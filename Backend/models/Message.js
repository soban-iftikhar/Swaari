import mongoose from "mongoose";

/**
 * A single in-app chat message exchanged between the rider and driver of a ride.
 * `readAt` powers read receipts; ordering is by `createdAt`.
 */
const messageSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
      index: true,
    },

    // Who sent it — drives message alignment and the refPath for `sender`.
    senderRole: {
      type: String,
      enum: ["rider", "driver"],
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "senderModel",
    },
    senderModel: {
      type: String,
      required: true,
      enum: ["Rider", "Driver"],
    },

    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    // Null until the recipient has seen the message (read receipt).
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Fetch a ride's conversation in chronological order.
messageSchema.index({ ride: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
