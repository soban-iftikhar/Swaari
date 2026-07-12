import mongoose from "mongoose";

/**
 * A driver's offer on a ride request. Riders receive these live in the offer
 * drawer and may accept or reject each one. A driver holds at most one active
 * bid per ride (enforced by the compound unique index below); re-bidding
 * updates the existing document.
 */
export const BID_STATUS = Object.freeze({
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
});

const bidSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
      index: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
      index: true,
    },

    // Offered fare in PKR.
    amount: {
      type: Number,
      required: true,
      min: [0, "Bid amount cannot be negative"],
    },

    // Driver's estimated minutes to reach the pickup point.
    etaMinutes: {
      type: Number,
      required: true,
      min: 0,
    },

    // Optional short note shown to the rider (e.g. "AC on, arriving fast").
    note: {
      type: String,
      maxlength: 140,
    },

    status: {
      type: String,
      enum: Object.values(BID_STATUS),
      default: BID_STATUS.PENDING,
      index: true,
    },
  },
  { timestamps: true },
);

// One active bid per driver per ride; re-bids upsert this document.
bidSchema.index({ ride: 1, driver: 1 }, { unique: true });

const Bid = mongoose.model("Bid", bidSchema);
export default Bid;
