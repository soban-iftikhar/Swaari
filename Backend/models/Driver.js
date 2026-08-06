import mongoose from "mongoose";
import authPlugin from "../utils/authPlugin.js";

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
     *
     * `type` has NO default on purpose: a default would stamp `{ type: "Point" }`
     * onto every new account with no coordinates, which is invalid GeoJSON and
     * makes the 2dsphere index reject the save ("Can't extract geo keys"). Left
     * unset, the whole `location` object is minimized away and the (v2) 2dsphere
     * index simply skips the document until a real position is written.
     */
    location: {
      type: {
        type: String,
        enum: ["Point"],
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

// Apply auth plugin (JWT generation + password hashing helpers).
driverSchema.plugin(authPlugin);

const Driver = mongoose.model("Driver", driverSchema);
export default Driver;
