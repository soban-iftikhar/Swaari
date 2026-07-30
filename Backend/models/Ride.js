import mongoose from "mongoose";

/**
 * Ride lifecycle states.
 *
 *  requested  → rider has broadcast a request; drivers are being notified / bidding
 *  accepted   → rider accepted a driver (or driver accepted standard fare); driver assigned
 *  arriving   → driver is en route to the pickup point
 *  arrived    → driver has reached the pickup point (OTP exchange)
 *  ongoing    → trip in progress (rider on board)
 *  completed  → trip finished, fare settled
 *  cancelled  → cancelled by rider or driver before completion
 */
export const RIDE_STATUS = Object.freeze({
  REQUESTED: "requested",
  ACCEPTED: "accepted",
  ARRIVING: "arriving",
  ARRIVED: "arrived",
  ONGOING: "ongoing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
});

/** A GeoJSON Point subdocument paired with a human-readable address. */
const placeSchema = new mongoose.Schema(
  {
    address: { type: String, required: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      // [longitude, latitude]
      coordinates: { type: [Number], required: true },
    },
  },
  { _id: false },
);

const rideSchema = new mongoose.Schema(
  {
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rider",
      required: true,
      index: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
      index: true,
    },

    pickup: { type: placeSchema, required: true },
    dropoff: { type: placeSchema, required: true },

    vehicleTier: {
      type: String,
      enum: ["economy", "comfort", "executive"],
      required: true,
    },

    // Route metrics (from Distance Matrix / Directions, or haversine fallback).
    distanceMeters: { type: Number, required: true },
    durationSeconds: { type: Number, required: true },

    // System-suggested baseline fare (PKR).
    fareEstimate: { type: Number, required: true },
    // Final agreed fare — equals accepted bid amount, or estimate on standard accept.
    fare: { type: Number, default: null },

    paymentMethod: {
      type: String,
      enum: ["cash", "online"],
      default: "cash",
    },

    status: {
      type: String,
      enum: Object.values(RIDE_STATUS),
      default: RIDE_STATUS.REQUESTED,
      index: true,
    },

    // The bid the rider accepted (null when accepted at standard fare).
    acceptedBid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bid",
      default: null,
    },

    // 4-digit code the rider shares with the driver at pickup to start the trip.
    otp: {
      type: String,
      select: false,
    },

    // Live driver position during an active ride ([lng, lat]) for tracking.
    driverLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: { type: [Number], default: undefined },
    },

    // Phase timestamps for analytics and receipts.
    timeline: {
      requestedAt: { type: Date, default: Date.now },
      acceptedAt: { type: Date },
      arrivedAt: { type: Date },
      startedAt: { type: Date },
      completedAt: { type: Date },
      cancelledAt: { type: Date },
    },

    cancellation: {
      by: { type: String, enum: ["rider", "driver", "system"] },
      reason: { type: String },
    },

    rating: {
      byRider: { type: Number, min: 1, max: 5 },
      byDriver: { type: Number, min: 1, max: 5 },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        delete ret.otp;
        return ret;
      },
    },
  },
);

// Common query patterns: a rider's or driver's most recent rides.
rideSchema.index({ rider: 1, createdAt: -1 });
rideSchema.index({ driver: 1, createdAt: -1 });

const Ride = mongoose.model("Ride", rideSchema);
export default Ride;
