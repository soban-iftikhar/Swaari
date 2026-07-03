import { io } from "socket.io-client";

/**
 * Singleton Socket.io client.
 *
 * A single shared connection is created lazily on first `connectSocket()` and
 * authenticated with the JWT via the handshake `auth` field (matching the
 * backend `socketAuth` middleware). Reused across the app so components share
 * one connection; `disconnectSocket()` tears it down on logout.
 */
let socket = null;

/**
 * Establish (or reuse) the authenticated socket connection.
 * @param {string} [token] - JWT; defaults to the stored access token.
 * @returns {import('socket.io-client').Socket}
 */
export function connectSocket(token = localStorage.getItem("token")) {
  if (socket?.connected) return socket;

  // Recreate if a previous socket exists but is disconnected.
  if (socket) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  socket = io(import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_BASE_URL, {
    auth: { token },
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 800,
  });

  return socket;
}

/** @returns {import('socket.io-client').Socket|null} the current socket, if any */
export function getSocket() {
  return socket;
}

/** Disconnect and clear the singleton (call on logout). */
export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export default { connectSocket, getSocket, disconnectSocket };
