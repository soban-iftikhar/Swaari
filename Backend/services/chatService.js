import Message from "../models/Message.js";
import Ride, { RIDE_STATUS } from "../models/Ride.js";
import { emitToUser } from "../socket/io.js";
import { EVENTS } from "../socket/events.js";

/**
 * Chat service — in-app messaging between the rider and driver of a ride.
 *
 * Messages are only allowed while a ride is active (accepted → ongoing). Each
 * send persists the message and pushes it to the counterpart in real time;
 * read receipts flip `readAt` and notify the original sender.
 */

/** Statuses during which chat is permitted. */
const ACTIVE_STATUSES = [
  RIDE_STATUS.ACCEPTED,
  RIDE_STATUS.ARRIVING,
  RIDE_STATUS.ARRIVED,
  RIDE_STATUS.ONGOING,
];

function httpError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

const chatService = {
  /**
   * Load the ride and assert the caller is a participant on an active ride.
   * @returns {Promise<{ride: object, counterpart: {role:string, id:string}}>}
   * @private
   */
  async _authorizeParticipant(rideId, actorRole, actorId) {
    const ride = await Ride.findById(rideId).select("rider driver status");
    if (!ride) throw httpError("Ride not found", 404);

    const isRider = actorRole === "rider" && String(ride.rider) === String(actorId);
    const isDriver = actorRole === "driver" && String(ride.driver) === String(actorId);
    if (!isRider && !isDriver) throw httpError("Not a participant of this ride", 403);

    if (!ACTIVE_STATUSES.includes(ride.status)) {
      throw httpError("Chat is only available during an active ride", 409);
    }

    const counterpart = isRider
      ? { role: "driver", id: String(ride.driver) }
      : { role: "rider", id: String(ride.rider) };

    return { ride, counterpart };
  },

  /**
   * Persist and deliver a chat message.
   * @param {object} args - { rideId, senderRole, senderId, text }
   * @returns {Promise<object>} the created message
   */
  async sendMessage({ rideId, senderRole, senderId, text }) {
    const trimmed = (text || "").trim();
    if (!trimmed) throw httpError("Message cannot be empty");

    const { counterpart } = await this._authorizeParticipant(rideId, senderRole, senderId);

    const message = await Message.create({
      ride: rideId,
      senderRole,
      sender: senderId,
      senderModel: senderRole === "driver" ? "Driver" : "Rider",
      text: trimmed,
    });

    const payload = { rideId: String(rideId), message: message.toObject() };
    // Deliver to the counterpart; echo to the sender's other tabs.
    emitToUser(counterpart.role, counterpart.id, EVENTS.CHAT_MESSAGE, payload);
    emitToUser(senderRole, senderId, EVENTS.CHAT_MESSAGE, payload);

    return message.toObject();
  },

  /**
   * Return the full conversation for a ride (chronological).
   * @param {object} args - { rideId, actorRole, actorId }
   * @returns {Promise<Array>}
   */
  async getMessages({ rideId, actorRole, actorId }) {
    // Reuse participant check but allow reading after the ride ends too.
    const ride = await Ride.findById(rideId).select("rider driver");
    if (!ride) throw httpError("Ride not found", 404);
    const ok =
      (actorRole === "rider" && String(ride.rider) === String(actorId)) ||
      (actorRole === "driver" && String(ride.driver) === String(actorId));
    if (!ok) throw httpError("Not a participant of this ride", 403);

    return Message.find({ ride: rideId }).sort({ createdAt: 1 });
  },

  /**
   * Mark all messages the caller received as read, and notify the sender so
   * their UI can show read receipts.
   * @param {object} args - { rideId, actorRole, actorId }
   * @returns {Promise<{updated:number}>}
   */
  async markRead({ rideId, actorRole, actorId }) {
    const { counterpart } = await this._authorizeParticipant(rideId, actorRole, actorId);

    // Messages sent by the counterpart, not yet read.
    const result = await Message.updateMany(
      { ride: rideId, senderRole: counterpart.role, readAt: null },
      { readAt: new Date() },
    );

    if (result.modifiedCount > 0) {
      emitToUser(counterpart.role, counterpart.id, EVENTS.CHAT_READ, {
        rideId: String(rideId),
        readAt: new Date(),
      });
    }
    return { updated: result.modifiedCount };
  },
};

export default chatService;
