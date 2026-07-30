import { Server } from "socket.io";
import socketAuth from "./auth.js";
import { EVENTS } from "./events.js";
import {
  setIo,
  registerUser,
  unregisterSocket,
  rideRoom,
} from "./io.js";
import Driver from "../models/Driver.js";
import rideService from "../services/rideService.js";
import chatService from "../services/chatService.js";
import { EVENTS as E } from "./events.js";

/**
 * Initialise the Socket.io server on top of the given HTTP server and register
 * all real-time event handlers.
 *
 * Connection flow:
 *   1. `socketAuth` verifies the JWT and attaches { userId, role } to the socket.
 *   2. On connect, the user joins their personal room and (drivers) refresh
 *      their online status + socket id.
 *   3. Handlers cover: driver presence/location, ride room join/leave, and chat.
 *
 * REST controllers own the heavier ride mutations (request/accept/status) and
 * emit results through the shared emitters in `io.js`; sockets handle the
 * high-frequency, low-stakes streams (location, chat, presence).
 *
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
export default function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
      credentials: true,
    },
  });

  setIo(io);
  io.use(socketAuth);

  io.on(EVENTS.CONNECT, async (socket) => {
    const { userId, role } = socket.data;
    registerUser(role, userId, socket);

    // Persist the socket id so REST services can target this user.
    try {
      const Model = role === "driver" ? Driver : (await import("../models/Rider.js")).default;
      await Model.findByIdAndUpdate(userId, { socketId: socket.id });
    } catch {
      /* non-fatal: presence still works via in-memory maps */
    }

    // ── Driver presence ──────────────────────────────────
    socket.on(EVENTS.DRIVER_GO_ONLINE, async (payload, ack) => {
      try {
        if (role !== "driver") throw new Error("Only drivers can go online");
        const update = { isOnline: true, status: "available", socketId: socket.id };
        if (payload?.lat != null && payload?.lng != null) {
          update.location = {
            type: "Point",
            coordinates: [payload.lng, payload.lat],
            updatedAt: new Date(),
          };
        }
        await Driver.findByIdAndUpdate(userId, update);
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on(EVENTS.DRIVER_GO_OFFLINE, async (_payload, ack) => {
      try {
        if (role !== "driver") throw new Error("Only drivers can go offline");
        await Driver.findByIdAndUpdate(userId, { isOnline: false, status: "unavailable" });
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    // ── Driver live location stream ──────────────────────
    // High-frequency: persisted + relayed to the rider on the active ride.
    socket.on(EVENTS.DRIVER_LOCATION_UPDATE, async (payload) => {
      try {
        if (role !== "driver") return;
        const { rideId, lat, lng } = payload || {};
        if (lat == null || lng == null) return;

        if (rideId) {
          await rideService.pushDriverLocation(userId, rideId, { lat, lng });
        } else {
          // No active ride — just keep the driver's own position fresh.
          await Driver.findByIdAndUpdate(userId, {
            location: { type: "Point", coordinates: [lng, lat], updatedAt: new Date() },
          });
        }
      } catch {
        /* dropped location updates are non-fatal */
      }
    });

    // ── Ride room membership ─────────────────────────────
    socket.on(EVENTS.RIDE_JOIN, (rideId, ack) => {
      if (rideId) socket.join(rideRoom(rideId));
      ack?.({ ok: true });
    });
    socket.on(EVENTS.RIDE_LEAVE, (rideId, ack) => {
      if (rideId) socket.leave(rideRoom(rideId));
      ack?.({ ok: true });
    });

    // ── Chat ─────────────────────────────────────────────
    socket.on(EVENTS.CHAT_MESSAGE, async (payload, ack) => {
      try {
        const { rideId, text } = payload || {};
        const message = await chatService.sendMessage({
          rideId,
          senderRole: role,
          senderId: userId,
          text,
        });
        ack?.({ ok: true, message });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on(EVENTS.CHAT_READ, async (payload, ack) => {
      try {
        const { rideId } = payload || {};
        const result = await chatService.markRead({ rideId, actorRole: role, actorId: userId });
        ack?.({ ok: true, ...result });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    // Typing indicator — relayed to the ride room, not persisted.
    socket.on(EVENTS.CHAT_TYPING, (payload) => {
      const { rideId, typing } = payload || {};
      if (!rideId) return;
      socket.to(rideRoom(rideId)).emit(EVENTS.CHAT_TYPING, { rideId, role, typing: !!typing });
    });

    // ── Disconnect ───────────────────────────────────────
    socket.on(EVENTS.DISCONNECT, async () => {
      unregisterSocket(socket);
      // Drivers auto-go-offline when their last socket drops.
      if (role === "driver") {
        try {
          await Driver.findByIdAndUpdate(userId, { isOnline: false, status: "unavailable", socketId: null });
        } catch {
          /* non-fatal */
        }
      }
    });
  });

  return io;
}

// Re-export for convenience where a single import is preferred.
export { E as EVENTS };
