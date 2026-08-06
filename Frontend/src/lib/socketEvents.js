/**
 * Canonical Socket.io event names — mirror of Backend/socket/events.js.
 * Keep these two files in sync; a mismatch silently breaks real-time features.
 */
export const EVENTS = Object.freeze({
  // Connection / presence
  DRIVER_GO_ONLINE: "driver:go-online",
  DRIVER_GO_OFFLINE: "driver:go-offline",
  DRIVER_LOCATION_UPDATE: "driver:location-update",
  DRIVER_STATS_UPDATE: "driver:stats-update",

  // Ride lifecycle (server → clients)
  RIDE_REQUESTED: "ride:requested",
  RIDE_NEW_BID: "ride:new-bid",
  RIDE_BID_WITHDRAWN: "ride:bid-withdrawn",
  RIDE_ACCEPTED: "ride:accepted",
  RIDE_CANCELLED: "ride:cancelled",
  RIDE_STATUS: "ride:status",
  RIDE_DRIVER_LOCATION: "ride:driver-location",
  RIDE_EXPIRED: "ride:expired",

  // Chat
  CHAT_MESSAGE: "chat:message",
  CHAT_READ: "chat:read",
  CHAT_TYPING: "chat:typing",

  // Client → server ride actions
  RIDE_JOIN: "ride:join",
  RIDE_LEAVE: "ride:leave",
});

export default EVENTS;
