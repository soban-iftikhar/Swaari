import mongoose from "mongoose";
import authPlugin from "../utils/authPlugin.js";

/**
 * Maps a concrete vehicle type to a service tier used for pricing and matching.
 * Riders request a tier (economy / comfort / executive); drivers are matched
 * when their vehicle maps to the requested tier.
 */
export const VEHICLE_TIER_BY_TYPE = {
  bike: "economy",
  rickshaw: "economy",
  mini: "economy",
  sedan: "comfort",
  suv: "executive",
  van: "executive",
};

const driverSchema = new mongoose.Schema(
  {
    fullname: {
      firstname: {
        type: String,
        required: true,
        minlength: [3, "First name must be atleast 3 characters long"],
      },
      lastname: {
        type: String,
        required: true,
        minlength: [3, "Last name must be atleast 3 characters long"],
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      minlength: [5, "Email name must be atleast 5 characters long"],
    },
    password: {
      type: String,
      required: true,
      select: false,
      minlength: [8, "Password must be atleast 8 characters long"],
    },

    // Whether the driver is accepting new trip requests (online/offline toggle).
    isOnline: {
      type: Boolean,
      default: false,
    },

    // Lifecycle availability: free vs. currently engaged on a trip.
    status: {
      type: String,
      enum: ["available", "on_trip", "unavailable"],
      default: "available",
    },

    vehicle: {
      color: { type: String, required: true },
      licensePlate: { type: String, required: true, unique: true },
      make: { type: String, required: true },
      year: { type: Number, required: true },
      capacity: { type: Number, required: true },
      type: {
        type: String,
        enum: ["bike", "rickshaw", "mini", "sedan", "suv", "van"],
        required: true,
      },
    },

    /**
     * Current position as a GeoJSON Point: coordinates are [longitude, latitude].
     * A 2dsphere index (declared below) enables `$near` / `$geoWithin` radius
     * queries when matching riders to nearby drivers.
     */
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: undefined,
      },
      updatedAt: { type: Date },
    },

    // Aggregate rating derived from completed trips.
    rating: {
      average: { type: Number, default: 5, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },

    // Lifetime counters surfaced on the driver analytics dashboard.
    stats: {
      totalTrips: { type: Number, default: 0 },
      totalEarnings: { type: Number, default: 0 },
    },

    currentRide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      default: null,
    },

    socketId: {
      type: String,
    },
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Geospatial index enabling radius-based driver search.
driverSchema.index({ location: "2dsphere" });

/** Convenience virtual exposing the driver's current service tier. */
driverSchema.virtual("tier").get(function () {
  return VEHICLE_TIER_BY_TYPE[this.vehicle?.type] || "economy";
});

// Apply auth plugin (JWT generation + password hashing helpers).
driverSchema.plugin(authPlugin);

const Driver = mongoose.model("Driver", driverSchema);
export default Driver;
