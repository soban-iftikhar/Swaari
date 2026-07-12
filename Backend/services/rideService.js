import crypto from "crypto";
import mongoose from "mongoose";
import Ride, { RIDE_STATUS } from "../models/Ride.js";
import Bid, { BID_STATUS } from "../models/Bid.js";
import Driver, { VEHICLE_TIER_BY_TYPE } from "../models/Driver.js";
import Rider from "../models/Rider.js";
import { estimateFare, getRouteMetrics } from "./mapsService.js";
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

/** Vehicle `type`s that satisfy a requested tier (reverse of VEHICLE_TIER_BY_TYPE). */
const TYPES_FOR_TIER = Object.entries(VEHICLE_TIER_BY_TYPE).reduce((acc, [type, tier]) => {
  (acc[tier] ||= []).push(type);
  return acc;
}, {});

/** Build an Error with an attached HTTP status code. */
function httpError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/** GeoJSON [lng, lat] → { lat, lng } for the maps service. */
const toLatLng = (coords) => ({ lng: coords[0], lat: coords[1] });

/** Generate a 4-digit pickup OTP as a zero-padded string. */
function generateOtp() {
  return String(crypto.randomInt(0, 10000)).padStart(4, "0");
}

const rideService = {
  /**
   * Create a ride request, compute fare, generate the pickup OTP, and broadcast
   * to nearby online drivers whose vehicle matches the requested tier.
   *
   * @param {string} riderId
   * @param {object} payload - { pickup, dropoff, vehicleTier, paymentMethod }
   *   where pickup/dropoff = { address, lng, lat }
   * @returns {Promise<{ride: object, matchedDrivers: number}>}
   */
  async requestRide(riderId, payload) {
    const { pickup, dropoff, vehicleTier, paymentMethod = "cash" } = payload;

    if (!pickup?.address || !dropoff?.address) {
      throw httpError("Pickup and dropoff addresses are required");
    }
    if (!["economy", "comfort", "executive"].includes(vehicleTier)) {
      throw httpError("Invalid vehicle tier");
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
    const fareEstimate = estimateFare(vehicleTier, distanceMeters, durationSeconds);
    const otp = generateOtp();

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
      vehicleTier,
      paymentMethod,
      distanceMeters,
      durationSeconds,
      fareEstimate,
      otp,
      status: RIDE_STATUS.REQUESTED,
    });

    await Rider.findByIdAndUpdate(riderId, { currentRide: ride._id });

    // Find nearby online, available drivers whose vehicle matches the tier.
    const drivers = await this.findNearbyDrivers(pickupLatLng, vehicleTier);
    const driverIds = drivers.map((d) => String(d._id));

    // Broadcast the request (without the OTP) to matched drivers in real time.
    const publicRide = await this.getRideById(ride._id);
    emitToDrivers(driverIds, EVENTS.RIDE_REQUESTED, publicRide);

    return { ride: publicRide, matchedDrivers: driverIds.length };
  },

  /**
   * Geospatial search for online + available drivers near a point whose vehicle
   * type satisfies the requested tier.
   * @param {{lat:number, lng:number}} point
   * @param {string} tier
   * @param {number} [radiusKm] - defaults to DRIVER_SEARCH_RADIUS_KM env
   * @returns {Promise<Array>}
   */
  async findNearbyDrivers(point, tier, radiusKm) {
    const radius = radiusKm || Number(process.env.DRIVER_SEARCH_RADIUS_KM) || 8;
    const types = TYPES_FOR_TIER[tier] || [];

    return Driver.find({
      isOnline: true,
      status: "available",
      "vehicle.type": { $in: types },
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
   * @returns {Promise<object>} the updated ride (with OTP for the rider)
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

    const populated = await this.getRideById(ride._id, { withOtp: true });

    // Notify driver (assigned) and rider (confirmed).
    emitToUser("driver", bid.driver, EVENTS.RIDE_ACCEPTED, populated.forDriver);
    emitToUser("rider", riderId, EVENTS.RIDE_ACCEPTED, populated.forRider);

    return populated.forRider;
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
   * transitions and emits status to both participants. Starting the trip
   * requires the correct pickup OTP.
   *
   * @param {object} args - { rideId, actorRole, actorId, nextStatus, otp? }
   * @returns {Promise<object>} updated public ride
   */
  async updateRideStatus({ rideId, actorRole, actorId, nextStatus, otp }) {
    const ride = await Ride.findById(rideId).select("+otp");
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

    // OTP gate for starting the trip.
    if (nextStatus === RIDE_STATUS.ONGOING) {
      if (!otp || String(otp) !== String(ride.otp)) {
        throw httpError("Incorrect pickup code", 401);
      }
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
   * both parties' currentRide pointers. Mutates the passed ride doc's driver.
   * @param {import('mongoose').Document} ride
   * @private
   */
  async _settleCompletedRide(ride) {
    const fare = ride.fare ?? ride.fareEstimate;
    await Driver.findByIdAndUpdate(ride.driver, {
      status: "available",
      currentRide: null,
      $inc: { "stats.totalTrips": 1, "stats.totalEarnings": fare },
    });
    await Rider.findByIdAndUpdate(ride.rider, { currentRide: null });
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

    return publicRide;
  },

  /**
   * Persist a driver's live location during an active ride and relay it to the
   * rider for smooth marker tracking.
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
    ).select("rider");
    if (!ride) return;

    // Keep the driver's own profile location fresh too.
    await Driver.findByIdAndUpdate(driverId, {
      location: { type: "Point", coordinates: [coords.lng, coords.lat], updatedAt: new Date() },
    });

    emitToUser("rider", ride.rider, EVENTS.RIDE_DRIVER_LOCATION, {
      rideId: String(rideId),
      coords,
    });
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
   * @param {{withOtp?:boolean}} [opts]
   * @returns {Promise<object>}
   */
  async getRideById(rideId, opts = {}) {
    let query = Ride.findById(rideId)
      .populate("rider", "fullname rating")
      .populate("driver", "fullname vehicle rating location");
    if (opts.withOtp) query = query.select("+otp");

    const ride = await query;
    if (!ride) throw httpError("Ride not found", 404);

    const base = ride.toObject();
    if (!opts.withOtp) return base;

    // When OTP is requested, return role-scoped variants:
    // the rider sees the OTP, the driver never does.
    const forDriver = { ...base };
    delete forDriver.otp;
    return { forRider: base, forDriver };
  },

  /**
   * Open ride requests near a driver whose tier matches the driver's vehicle —
   * powers the driver's trip request feed on load (before live pushes arrive).
   * @param {string} driverId
   * @param {number} [radiusKm]
   * @returns {Promise<Array>}
   */
  async getOpenRequestsForDriver(driverId, radiusKm) {
    const driver = await Driver.findById(driverId).select("vehicle location");
    if (!driver) throw httpError("Driver not found", 404);

    const tier = VEHICLE_TIER_BY_TYPE[driver.vehicle?.type] || "economy";
    const radius = radiusKm || Number(process.env.DRIVER_SEARCH_RADIUS_KM) || 8;

    const query = { status: RIDE_STATUS.REQUESTED, vehicleTier: tier };

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
      .populate("driver", "fullname vehicle rating location")
      .select(role === "rider" ? "+otp" : "");
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
      await this._applyRating(Driver, ride.driver, value);
    } else {
      if (ride.rating.byDriver) throw httpError("Already rated", 409);
      ride.rating.byDriver = value;
      await this._applyRating(Rider, ride.rider, value);
    }
    await ride.save();
    return ride.toObject();
  },

  /**
   * Fold a new star rating into a user's running average.
   * @param {import('mongoose').Model} Model
   * @param {string} userId
   * @param {number} stars
   * @private
   */
  async _applyRating(Model, userId, stars) {
    const user = await Model.findById(userId).select("rating");
    if (!user) return;
    const count = user.rating.count + 1;
    const average = (user.rating.average * user.rating.count + stars) / count;
    user.rating = { average: Math.round(average * 100) / 100, count };
    await user.save();
  },
};

export default rideService;
