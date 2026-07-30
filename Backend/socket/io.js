/**
 * Socket.io instance holder and user→socket registry.
 *
 * This module owns the singleton `io` instance plus a mapping of authenticated
 * users to their current socket id. Services (ride, bid, chat) import the small
 * emit helpers here to push real-time events without importing the whole socket
 * layer — which keeps the dependency graph acyclic (socket handlers depend on
 * services, services depend only on these thin emitters).
 *
 * Rooms convention:
 *   - `rider:<id>` / `driver:<id>` — a user's personal room (all their tabs).
 *   - `ride:<id>`                  — both participants of an active ride.
 */

let io = null;

/** In-memory presence maps: userId → socketId. Rebuilt on reconnect. */
const riderSockets = new Map();
const driverSockets = new Map();

/**
 * Store the initialised Socket.io server instance.
 * @param {import('socket.io').Server} server
 */
export function setIo(server) {
  io = server;
}

/** @returns {import('socket.io').Server} the Socket.io server instance */
export function getIo() {
  if (!io) throw new Error("Socket.io not initialised. Call setIo() first.");
  return io;
}

/** Personal room name for a user. */
export const roomFor = (role, id) => `${role}:${id}`;
/** Shared room name for a ride's participants. */
export const rideRoom = (rideId) => `ride:${rideId}`;

/**
 * Register a connected user's socket and join their personal room.
 * @param {'rider'|'driver'} role
 * @param {string} userId
 * @param {import('socket.io').Socket} socket
 */
export function registerUser(role, userId, socket) {
  const map = role === "driver" ? driverSockets : riderSockets;
  map.set(String(userId), socket.id);
  socket.join(roomFor(role, userId));
}

/**
 * Remove a socket from the presence maps on disconnect.
 * @param {import('socket.io').Socket} socket
 */
export function unregisterSocket(socket) {
  for (const map of [riderSockets, driverSockets]) {
    for (const [userId, socketId] of map.entries()) {
      if (socketId === socket.id) map.delete(userId);
    }
  }
}

/** @returns {string|undefined} current socket id for a user, if connected */
export function getUserSocketId(role, userId) {
  const map = role === "driver" ? driverSockets : riderSockets;
  return map.get(String(userId));
}

/**
 * Emit an event to a specific user's personal room.
 * @param {'rider'|'driver'} role
 * @param {string} userId
 * @param {string} event
 * @param {*} payload
 */
export function emitToUser(role, userId, event, payload) {
  if (!io) return;
  io.to(roomFor(role, userId)).emit(event, payload);
}

/**
 * Emit an event to both participants in a ride room.
 * @param {string} rideId
 * @param {string} event
 * @param {*} payload
 */
export function emitToRide(rideId, event, payload) {
  if (!io) return;
  io.to(rideRoom(rideId)).emit(event, payload);
}

/**
 * Emit an event to a list of drivers by id (e.g. broadcasting a new request
 * to nearby online drivers).
 * @param {string[]} driverIds
 * @param {string} event
 * @param {*} payload
 */
export function emitToDrivers(driverIds, event, payload) {
  if (!io) return;
  for (const id of driverIds) emitToUser("driver", id, event, payload);
}

export default {
  setIo,
  getIo,
  roomFor,
  rideRoom,
  registerUser,
  unregisterSocket,
  getUserSocketId,
  emitToUser,
  emitToRide,
  emitToDrivers,
};
