import jwt from "jsonwebtoken";
import Rider from "../models/Rider.js";
import Driver from "../models/Driver.js";

/**
 * Socket.io authentication middleware.
 *
 * Verifies the JWT supplied in the handshake (either `auth.token` or an
 * `Authorization: Bearer` header), loads the corresponding Rider/Driver, and
 * attaches `{ userId, role, user }` to the socket. Connections without a valid
 * token are rejected before any event handler runs.
 *
 * @param {import('socket.io').Socket} socket
 * @param {(err?: Error) => void} next
 */
export default async function socketAuth(socket, next) {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) return next(new Error("Authentication required"));

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const Model = decoded.role === "driver" ? Driver : Rider;

    const user = await Model.findById(decoded._id).select("_id fullname");
    if (!user) return next(new Error("User not found"));

    socket.data.userId = String(user._id);
    socket.data.role = decoded.role;
    socket.data.user = user;
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
}
