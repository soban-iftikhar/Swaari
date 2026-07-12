/**
 * Canonical Socket.io event names shared across the backend.
 *
 * Keeping these as constants (rather than inline strings) prevents silent typos
 * between emitters and listeners. The frontend mirrors this list in
 * `Frontend/src/lib/socketEvents.js` — keep the two in sync.
 */
export const EVENTS = Object.freeze({
  // ── Connection / presence ──────────────────────────────
  CONNECT: "connection",
  DISCONNECT: "disconnect",
  DRIVER_GO_ONLINE: "driver:go-online",
  DRIVER_GO_OFFLINE: "driver:go-offline",
  DRIVER_LOCATION_UPDATE: "driver:location-update", // driver → server

  // ── Ride lifecycle (server → clients) ──────────────────
  RIDE_REQUESTED: "ride:requested", // → nearby drivers
  RIDE_NEW_BID: "ride:new-bid", // → rider
  RIDE_BID_WITHDRAWN: "ride:bid-withdrawn", // → rider
  RIDE_ACCEPTED: "ride:accepted", // → driver (bid accepted) / rider
  RIDE_CANCELLED: "ride:cancelled", // → both
  RIDE_STATUS: "ride:status", // → both (arriving/arrived/ongoing/completed)
  RIDE_DRIVER_LOCATION: "ride:driver-location", // → rider (live tracking)
  RIDE_EXPIRED: "ride:expired", // → rider (no drivers / timed out)

  // ── Chat (bidirectional) ───────────────────────────────
  CHAT_MESSAGE: "chat:message",
  CHAT_READ: "chat:read",
  CHAT_TYPING: "chat:typing",

  // ── Client → server ride actions handled over sockets ──
  RIDE_JOIN: "ride:join", // join a ride room
  RIDE_LEAVE: "ride:leave",
});

export default EVENTS;
