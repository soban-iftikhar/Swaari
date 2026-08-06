import mongoose from "mongoose";
import authPlugin from "../utils/authPlugin.js";

const riderSchema = new mongoose.Schema(
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

    /**
     * Last known position as a GeoJSON Point: coordinates are [longitude, latitude].
     * Used to default the pickup pin and for support/analytics.
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

    rating: {
      average: { type: Number, default: 5, min: 0, max: 5 },
      count: { type: Number, default: 0 },
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

riderSchema.index({ location: "2dsphere" });

// Apply auth plugin
riderSchema.plugin(authPlugin);

const Rider = mongoose.model("Rider", riderSchema);
export default Rider;
