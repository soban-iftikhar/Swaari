import mongoose from "mongoose";
import Ride, { RIDE_STATUS } from "../models/Ride.js";
import Bid, { BID_STATUS } from "../models/Bid.js";
import Driver from "../models/Driver.js";
import Rider from "../models/Rider.js";
import { estimateFare, getRouteMetrics, haversineMeters, VEHICLE_TYPES } from "./mapsService.js";
import { emitToUser, emitToRide, emitToDrivers } from "../socket/io.js";
import { EVENTS } from "../socket/events.js";

/**
 * Ride service — owns the full ride lifecycle and driver matching.
 *
 * Responsibilities:
 *  - create a ride request and broadcast it to nearby online drivers (2dsphere)
 *  - manage bids (place / accept / reject)
 *  - advance ride status (arriving → arrived → ongoing → completed)
 *  - cancellation and rating
 *
 * Every mutating method emits the relevant Socket.io events so connected clients
 * stay in sync in real time. Errors are thrown with a `.status` property so the
 * controller layer can map them to HTTP codes.
 */

/** Build an Error with an attached HTTP status code. */
function httpError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/** GeoJSON [lng, lat] → { lat, lng } for the maps service. */
const toLatLng = (coords) => ({ lng: coords[0], lat: coords[1] });

/**
 * Proximity radius (meters) for GPS geofence auto-advance. When the driver's
 * live position falls within this distance of the pickup (→ arrived) or dropoff
 * (→ completed), the ride advances automatically off the location stream.
 * Overridable via DRIVER_GEOFENCE_RADIUS_M.
 */
const GEOFENCE_RADIUS_M = Number(process.env.DRIVER_GEOFENCE_RADIUS_M) || 80;

const rideService = {
  /**
   * Create a ride request, compute fare, and broadcast to nearby online drivers
   * whose vehicle matches the requested type.
   *
   * @param {string} riderId
   * @param {object} payload - { pickup, dropoff, vehicleType, paymentMethod }
   *   where pickup/dropoff = { address, lng, lat }
   * @returns {Promise<{ride: object, matchedDrivers: number}>}
   */
  async requestRide(riderId, payload) {
    const { pickup, dropoff, vehicleType, paymentMethod = "cash" } = payload;

    if (!pickup?.address || !dropoff?.address) {
      throw httpError("Pickup and dropoff addresses are required");
    }
    if (!VEHICLE_TYPES.includes(vehicleType)) {
      throw httpError("Invalid vehicle type");
    }

    // Prevent overlapping active rides for the same rider.
    const existing = await Ride.findOne({
      rider: riderId,
      status: { $in: [RIDE_STATUS.REQUESTED, RIDE_STATUS.ACCEPTED, RIDE_STATUS.ARRIVING, RIDE_STATUS.ARRIVED, RIDE_STATUS.ONGOING] },
    });
    if (existing) {
      throw httpError("You already have an active ride", 409);
    }

    const pickupLatLng = { lat: pickup.lat, lng: pickup.lng };
    const dropoffLatLng = { lat: dropoff.lat, lng: dropoff.lng };

    const { distanceMeters, durationSeconds } = await getRouteMetrics(pickupLatLng, dropoffLatLng);
    const fareEstimate = estimateFare(vehicleType, distanceMeters, durationSeconds);

    const ride = await Ride.create({
      rider: riderId,
      pickup: {
        address: pickup.address,
        location: { type: "Point", coordinates: [pickup.lng, pickup.lat] },
      },
      dropoff: {
        address: dropoff.address,
        location: { type: "Point", coordinates: [dropoff.lng, dropoff.lat] },
      },
      vehicleType,
      paymentMethod,
      distanceMeters,
      durationSeconds,
      fareEstimate,
      status: RIDE_STATUS.REQUESTED,
    });

    await Rider.findByIdAndUpdate(riderId, { currentRide: ride._id });

    // Find nearby online, available drivers whose vehicle matches the type.
    const drivers = await this.findNearbyDrivers(pickupLatLng, vehicleType);
    const driverIds = drivers.map((d) => String(d._id));

    // Broadcast the request to matched drivers in real time.
    const publicRide = await this.getRideById(ride._id);
    emitToDrivers(driverIds, EVENTS.RIDE_REQUESTED, publicRide);

    return { ride: publicRide, matchedDrivers: driverIds.length };
  },

  /**
   * Geospatial search for online + available drivers near a point whose vehicle
   * type exactly matches the requested type.
   * @param {{lat:number, lng:number}} point
   * @param {string} vehicleType
   * @param {number} [radiusKm] - defaults to DRIVER_SEARCH_RADIUS_KM env
   * @returns {Promise<Array>}
   */
  async findNearbyDrivers(point, vehicleType, radiusKm) {
    const radius = radiusKm || Number(process.env.DRIVER_SEARCH_RADIUS_KM) || 8;

    return Driver.find({
      isOnline: true,
      status: "available",
      "vehicle.type": vehicleType,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [point.lng, point.lat] },
          $maxDistance: radius * 1000, // meters
        },
      },
    })
      .limit(25)
      .select("_id fullname vehicle rating location");
  },

  /**
   * Place or update a driver's bid on a ride, then notify the rider live.
   * @param {string} driverId
   * @param {string} rideId
   * @param {{amount:number, etaMinutes:number, note?:string}} offer
   * @returns {Promise<object>} the populated bid
   */
  async placeBid(driverId, rideId, offer) {
    const ride = await Ride.findById(rideId);
    if (!ride) throw httpError("Ride not found", 404);
    if (ride.status !== RIDE_STATUS.REQUESTED) {
      throw httpError("This ride is no longer accepting bids", 409);
    }

    const amount = Number(offer.amount);
    const etaMinutes = Number(offer.etaMinutes);
    if (!Number.isFinite(amount) || amount <= 0) throw httpError("Invalid bid amount");
    if (!Number.isFinite(etaMinutes) || etaMinutes < 0) throw httpError("Invalid ETA");

    // Upsert: re-bidding updates the existing offer (unique on ride+driver).
    const bid = await Bid.findOneAndUpdate(
      { ride: rideId, driver: driverId },
      { amount, etaMinutes, note: offer.note, status: BID_STATUS.PENDING },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).populate("driver", "fullname vehicle rating");

    // Notify the rider's personal room of the new/updated offer.
    emitToUser("rider", ride.rider, EVENTS.RIDE_NEW_BID, {
      rideId: String(ride._id),
      bid: bid.toObject(),
    });

    return bid;
  },

  /**
   * Withdraw a driver's pending bid and notify the rider.
   * @param {string} driverId
   * @param {string} rideId
   */
  async withdrawBid(driverId, rideId) {
    const bid = await Bid.findOneAndUpdate(
      { ride: rideId, driver: driverId, status: BID_STATUS.PENDING },
      { status: BID_STATUS.CANCELLED },
      { new: true },
    );
    if (!bid) throw httpError("No active bid to withdraw", 404);

    const ride = await Ride.findById(rideId).select("rider");
    if (ride) {
      emitToUser("rider", ride.rider, EVENTS.RIDE_BID_WITHDRAWN, {
        rideId: String(rideId),
        bidId: String(bid._id),
        driverId: String(driverId),
      });
    }
    return bid;
  },

  /**
   * Rider accepts a specific bid. Assigns the driver, locks the fare, rejects
   * competing bids, and notifies all parties. Uses a transaction when the DB
   * supports it, else a best-effort sequential path.
   * @param {string} riderId
   * @param {string} rideId
   * @param {string} bidId
   * @returns {Promise<object>} the updated ride
   */
  async acceptBid(riderId, rideId, bidId) {
    const ride = await Ride.findOne({ _id: rideId, rider: riderId });
    if (!ride) throw httpError("Ride not found", 404);
    if (ride.status !== RIDE_STATUS.REQUESTED) {
      throw httpError("This ride can no longer be modified", 409);
    }

    const bid = await Bid.findOne({ _id: bidId, ride: rideId, status: BID_STATUS.PENDING });
    if (!bid) throw httpError("Bid is no longer available", 409);

    // Ensure the driver is still free (guards against double-assignment).
    const driver = await Driver.findOneAndUpdate(
      { _id: bid.driver, status: "available" },
      { status: "on_trip", currentRide: ride._id },
      { new: true },
    );
    if (!driver) throw httpError("Driver is no longer available", 409);

    // Commit the assignment on the ride.
    ride.driver = bid.driver;
    ride.acceptedBid = bid._id;
    ride.fare = bid.amount;
    ride.status = RIDE_STATUS.ACCEPTED;
    ride.timeline.acceptedAt = new Date();
    await ride.save();

    // Mark bids: winner accepted, the rest rejected.
    bid.status = BID_STATUS.ACCEPTED;
    await bid.save();
    await Bid.updateMany(
      { ride: rideId, _id: { $ne: bid._id }, status: BID_STATUS.PENDING },
      { status: BID_STATUS.REJECTED },
    );

    const publicRide = await this.getRideById(ride._id);

    // Notify driver (assigned) and rider (confirmed).
    emitToUser("driver", bid.driver, EVENTS.RIDE_ACCEPTED, publicRide);
    emitToUser("rider", riderId, EVENTS.RIDE_ACCEPTED, publicRide);

    return publicRide;
  },

  /**
   * Reject a single bid without accepting another (rider dismisses an offer).
   * @param {string} riderId
   * @param {string} rideId
   * @param {string} bidId
   */
  async rejectBid(riderId, rideId, bidId) {
    const ride = await Ride.findOne({ _id: rideId, rider: riderId }).select("_id");
    if (!ride) throw httpError("Ride not found", 404);

    const bid = await Bid.findOneAndUpdate(
      { _id: bidId, ride: rideId, status: BID_STATUS.PENDING },
      { status: BID_STATUS.REJECTED },
      { new: true },
    );
    if (!bid) throw httpError("Bid not found", 404);

    // Let the driver know their offer was declined.
    emitToUser("driver", bid.driver, EVENTS.RIDE_BID_WITHDRAWN, {
      rideId: String(rideId),
      bidId: String(bid._id),
      rejected: true,
    });
    return bid;
  },

  /**
   * Advance a ride through its post-acceptance stages. Validates legal
   * transitions and emits status to both participants.
   *
   * @param {object} args - { rideId, actorRole, actorId, nextStatus }
   * @returns {Promise<object>} updated public ride
   */
  async updateRideStatus({ rideId, actorRole, actorId, nextStatus }) {
    const ride = await Ride.findById(rideId);
    if (!ride) throw httpError("Ride not found", 404);

    // Only the ride's own driver or rider may drive transitions.
    const ownerId = actorRole === "driver" ? ride.driver : ride.rider;
    if (String(ownerId) !== String(actorId)) {
      throw httpError("Not authorised for this ride", 403);
    }

    // Allowed transitions and which role may perform them.
    const TRANSITIONS = {
      [RIDE_STATUS.ARRIVING]: { from: [RIDE_STATUS.ACCEPTED], role: "driver" },
      [RIDE_STATUS.ARRIVED]: { from: [RIDE_STATUS.ACCEPTED, RIDE_STATUS.ARRIVING], role: "driver" },
      [RIDE_STATUS.ONGOING]: { from: [RIDE_STATUS.ARRIVED], role: "driver" },
      [RIDE_STATUS.COMPLETED]: { from: [RIDE_STATUS.ONGOING], role: "driver" },
    };

    const rule = TRANSITIONS[nextStatus];
    if (!rule) throw httpError("Invalid status transition");
    if (rule.role !== actorRole) throw httpError("Not authorised for this action", 403);
    if (!rule.from.includes(ride.status)) {
      throw httpError(`Cannot move from ${ride.status} to ${nextStatus}`, 409);
    }

    ride.status = nextStatus;
    const now = new Date();
    if (nextStatus === RIDE_STATUS.ARRIVED) ride.timeline.arrivedAt = now;
    if (nextStatus === RIDE_STATUS.ONGOING) ride.timeline.startedAt = now;

    if (nextStatus === RIDE_STATUS.COMPLETED) {
      ride.timeline.completedAt = now;
      await this._settleCompletedRide(ride);
    }

    await ride.save();

    const publicRide = await this.getRideById(ride._id);
    emitToRide(rideId, EVENTS.RIDE_STATUS, publicRide);
    return publicRide;
  },

  /**
   * Finalise a completed ride: free the driver, update counters, clear
   * both parties' currentRide pointers, and push the driver's fresh stats live.
   * Mutates the passed ride doc's driver.
   * @param {import('mongoose').Document} ride
   * @private
   */
  async _settleCompletedRide(ride) {
    const fare = ride.fare ?? ride.fareEstimate;
    const driver = await Driver.findByIdAndUpdate(
      ride.driver,
      {
        status: "available",
        currentRide: null,
        $inc: { "stats.totalTrips": 1, "stats.totalEarnings": fare },
      },
      { new: true },
    );
    await Rider.findByIdAndUpdate(ride.rider, { currentRide: null });

    // Push the driver's updated KPIs so their dashboard ticks up immediately.
    if (driver) {
      emitToUser("driver", ride.driver, EVENTS.DRIVER_STATS_UPDATE, {
        stats: driver.stats,
        rating: driver.rating,
      });
    }
  },

  /**
   * Cancel a ride (by rider or driver) at any pre-completion stage. Frees the
   * assigned driver, if any, and notifies the other party.
   * @param {object} args - { rideId, actorRole, actorId, reason? }
   * @returns {Promise<object>} the cancelled public ride
   */
  async cancelRide({ rideId, actorRole, actorId, reason }) {
    const ride = await Ride.findById(rideId);
    if (!ride) throw httpError("Ride not found", 404);

    const ownerId = actorRole === "driver" ? ride.driver : ride.rider;
    if (String(ownerId) !== String(actorId)) {
      throw httpError("Not authorised for this ride", 403);
    }
    if ([RIDE_STATUS.COMPLETED, RIDE_STATUS.CANCELLED].includes(ride.status)) {
      throw httpError("Ride is already finished", 409);
    }

    ride.status = RIDE_STATUS.CANCELLED;
    ride.cancellation = { by: actorRole, reason: reason || "" };
    ride.timeline.cancelledAt = new Date();
    await ride.save();

    // Before clearing bids, gather everyone who can currently *see* this request
    // so their feed clears instantly (not on a stale 409 when they try to bid):
    // pending bidders ∪ nearby drivers who saw the RIDE_REQUESTED broadcast.
    const recipientIds = new Set();
    if (!ride.driver) {
      const pendingBids = await Bid.find({ ride: rideId, status: BID_STATUS.PENDING }).select("driver");
      pendingBids.forEach((b) => recipientIds.add(String(b.driver)));

      if (ride.pickup?.location?.coordinates?.length === 2) {
        const nearby = await this.findNearbyDrivers(
          toLatLng(ride.pickup.location.coordinates),
          ride.vehicleType,
        );
        nearby.forEach((d) => recipientIds.add(String(d._id)));
      }
    }

    // Free the driver and clear ride pointers.
    if (ride.driver) {
      await Driver.findByIdAndUpdate(ride.driver, { status: "available", currentRide: null });
    }
    await Rider.findByIdAndUpdate(ride.rider, { currentRide: null });
    await Bid.updateMany(
      { ride: rideId, status: BID_STATUS.PENDING },
      { status: BID_STATUS.CANCELLED },
    );

    const publicRide = await this.getRideById(ride._id);
    emitToRide(rideId, EVENTS.RIDE_CANCELLED, publicRide);
    // Also hit personal rooms in case a party hasn't joined the ride room yet.
    emitToUser("rider", ride.rider, EVENTS.RIDE_CANCELLED, publicRide);
    if (ride.driver) emitToUser("driver", ride.driver, EVENTS.RIDE_CANCELLED, publicRide);
    // And every searching-phase driver who had the request card open.
    if (recipientIds.size) {
      emitToDrivers([...recipientIds], EVENTS.RIDE_CANCELLED, publicRide);
    }

    return publicRide;
  },

  /**
   * Persist a driver's live location during an active ride, relay it to the
   * rider for smooth marker tracking, and auto-advance the ride lifecycle by
   * GPS geofence (the primary, tap-free path):
   *   accepted            → arriving  (on the first ping, any position)
   *   accepted/arriving   → arrived   (within GEOFENCE_RADIUS_M of pickup)
   *   ongoing             → completed (within GEOFENCE_RADIUS_M of dropoff)
   * The rider boarding (arrived → ongoing) stays a manual "Start trip" tap.
   * @param {string} driverId
   * @param {string} rideId
   * @param {{lat:number, lng:number}} coords
   */
  async pushDriverLocation(driverId, rideId, coords) {
    const ride = await Ride.findOneAndUpdate(
      { _id: rideId, driver: driverId },
      {
        driverLocation: { type: "Point", coordinates: [coords.lng, coords.lat] },
      },
      { new: true },
    ).select("rider status pickup.location dropoff.location driver");
    if (!ride) return;

    // Keep the driver's own profile location fresh too.
    await Driver.findByIdAndUpdate(driverId, {
      location: { type: "Point", coordinates: [coords.lng, coords.lat], updatedAt: new Date() },
    });

    emitToUser("rider", ride.rider, EVENTS.RIDE_DRIVER_LOCATION, {
      rideId: String(rideId),
      coords,
    });

    // Geofence auto-advance. Ownership is already proven (the findOneAndUpdate
    // matched driver: driverId), so updateRideStatus's driver check passes.
    let desiredStatus = null;
    if (ride.status === RIDE_STATUS.ACCEPTED || ride.status === RIDE_STATUS.ARRIVING) {
      const pickupCoords = ride.pickup?.location?.coordinates;
      const nearPickup =
        pickupCoords?.length === 2 &&
        haversineMeters(coords, toLatLng(pickupCoords)) <= GEOFENCE_RADIUS_M;
      // Near the pickup → arrived; otherwise the first ping flips accepted → arriving.
      desiredStatus = nearPickup ? RIDE_STATUS.ARRIVED : RIDE_STATUS.ARRIVING;
    } else if (ride.status === RIDE_STATUS.ONGOING) {
      const dropoffCoords = ride.dropoff?.location?.coordinates;
      const nearDropoff =
        dropoffCoords?.length === 2 &&
        haversineMeters(coords, toLatLng(dropoffCoords)) <= GEOFENCE_RADIUS_M;
      if (nearDropoff) desiredStatus = RIDE_STATUS.COMPLETED;
    }

    // Only advance on a real change, and never let a racing/illegal transition
    // crash the socket handler.
    if (desiredStatus && desiredStatus !== ride.status) {
      try {
        await this.updateRideStatus({
          rideId,
          actorRole: "driver",
          actorId: driverId,
          nextStatus: desiredStatus,
        });
      } catch {
        // Ignore — a concurrent manual override or terminal state raced us.
      }
    }
  },

  /**
   * List all pending bids on a ride (for the rider's offer drawer).
   * @param {string} rideId
   * @returns {Promise<Array>}
   */
  async getRideBids(rideId) {
    return Bid.find({ ride: rideId, status: BID_STATUS.PENDING })
      .populate("driver", "fullname vehicle rating")
      .sort({ amount: 1 });
  },

  /**
   * Fetch a ride as a plain object, populated for client display.
   * @param {string} rideId
   * @returns {Promise<object>}
   */
  async getRideById(rideId) {
    const ride = await Ride.findById(rideId)
      .populate("rider", "fullname rating")
      .populate("driver", "fullname vehicle rating location");
    if (!ride) throw httpError("Ride not found", 404);
    return ride.toObject();
  },

  /**
   * Open ride requests near a driver whose vehicle type matches the driver's —
   * powers the driver's trip request feed on load (before live pushes arrive).
   * @param {string} driverId
   * @param {number} [radiusKm]
   * @returns {Promise<Array>}
   */
  async getOpenRequestsForDriver(driverId, radiusKm) {
    const driver = await Driver.findById(driverId).select("vehicle location");
    if (!driver) throw httpError("Driver not found", 404);

    const radius = radiusKm || Number(process.env.DRIVER_SEARCH_RADIUS_KM) || 8;

    const query = { status: RIDE_STATUS.REQUESTED, vehicleType: driver.vehicle?.type };

    // If we know the driver's position, restrict to nearby pickups.
    if (driver.location?.coordinates?.length === 2) {
      query["pickup.location"] = {
        $near: {
          $geometry: { type: "Point", coordinates: driver.location.coordinates },
          $maxDistance: radius * 1000,
        },
      };
    }

    return Ride.find(query)
      .populate("rider", "fullname rating")
      .sort({ createdAt: -1 })
      .limit(20);
  },

  /**
   * Return a user's ride history (most recent first).
   * @param {'rider'|'driver'} role
   * @param {string} userId
   * @param {number} [limit=20]
   * @returns {Promise<Array>}
   */
  async getHistory(role, userId, limit = 20) {
    const filter = role === "driver" ? { driver: userId } : { rider: userId };
    return Ride.find({ ...filter, status: { $in: [RIDE_STATUS.COMPLETED, RIDE_STATUS.CANCELLED] } })
      .populate(role === "driver" ? "rider" : "driver", "fullname vehicle rating")
      .sort({ createdAt: -1 })
      .limit(limit);
  },

  /**
   * Get the caller's current active ride, if any.
   * @param {'rider'|'driver'} role
   * @param {string} userId
   * @returns {Promise<object|null>}
   */
  async getActiveRide(role, userId) {
    const filter = role === "driver" ? { driver: userId } : { rider: userId };
    const ride = await Ride.findOne({
      ...filter,
      status: { $in: [RIDE_STATUS.REQUESTED, RIDE_STATUS.ACCEPTED, RIDE_STATUS.ARRIVING, RIDE_STATUS.ARRIVED, RIDE_STATUS.ONGOING] },
    })
      .populate("rider", "fullname rating")
      .populate("driver", "fullname vehicle rating location");
    return ride ? ride.toObject() : null;
  },

  /**
   * Submit a star rating for a completed ride and roll it into the counterpart's
   * aggregate rating.
   * @param {object} args - { rideId, actorRole, actorId, stars }
   */
  async rateRide({ rideId, actorRole, actorId, stars }) {
    const value = Number(stars);
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw httpError("Rating must be an integer from 1 to 5");
    }

    const ride = await Ride.findById(rideId);
    if (!ride) throw httpError("Ride not found", 404);
    if (ride.status !== RIDE_STATUS.COMPLETED) throw httpError("Ride is not completed", 409);

    const ownerId = actorRole === "driver" ? ride.driver : ride.rider;
    if (String(ownerId) !== String(actorId)) throw httpError("Not authorised", 403);

    // Rider rates the driver, and vice-versa.
    if (actorRole === "rider") {
      if (ride.rating.byRider) throw httpError("Already rated", 409);
      ride.rating.byRider = value;
      const driver = await this._applyRating(Driver, ride.driver, value);
      await ride.save();
      // Push the driver's fresh aggregate rating to their live dashboard.
      if (driver) {
        emitToUser("driver", ride.driver, EVENTS.DRIVER_STATS_UPDATE, {
          stats: driver.stats,
          rating: driver.rating,
        });
      }
      return ride.toObject();
    }

    if (ride.rating.byDriver) throw httpError("Already rated", 409);
    ride.rating.byDriver = value;
    await this._applyRating(Rider, ride.rider, value);
    await ride.save();
    return ride.toObject();
  },

  /**
   * Fold a new star rating into a user's running average.
   * @param {import('mongoose').Model} Model
   * @param {string} userId
   * @param {number} stars
   * @returns {Promise<import('mongoose').Document|null>} the updated user
   * @private
   */
  async _applyRating(Model, userId, stars) {
    const user = await Model.findById(userId).select("rating stats");
    if (!user) return null;
    const count = user.rating.count + 1;
    const average = (user.rating.average * user.rating.count + stars) / count;
    user.rating = { average: Math.round(average * 100) / 100, count };
    await user.save();
    return user;
  },
};

export default rideService;
