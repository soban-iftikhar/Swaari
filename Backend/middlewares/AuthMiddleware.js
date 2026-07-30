import Rider from '../models/Rider.js';
import Driver from '../models/Driver.js';
import jwt from 'jsonwebtoken';
import BlackListToken from '../models/BlackListToken.js';

/**
 * Extract a bearer token from the cookie or Authorization header.
 * @param {import('express').Request} req
 * @returns {string|undefined}
 */
const extractToken = (req) =>
  req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

/**
 * Factory producing an auth middleware bound to a single Model. Verifies the
 * JWT, rejects blacklisted (logged-out) tokens, loads the entity, and attaches
 * it to the request under `attachAs` (and also as `req.authUser` / `req.role`).
 *
 * @param {import('mongoose').Model} Model
 * @param {string} attachAs - request property name (e.g. 'rider' | 'driver')
 */
const createAuthMiddleware = (Model, attachAs = 'entity') => {
  return async (req, res, next) => {
    try {
      const token = extractToken(req);
      if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
      }

      // Reject tokens that were blacklisted on logout.
      const blacklisted = await BlackListToken.findOne({ token });
      if (blacklisted) {
        return res.status(401).json({ message: "Session expired. Please log in again." });
      }

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const entity = await Model.findById(decoded._id).select("-__v");
      if (!entity) {
        return res.status(401).json({ message: "Invalid token. Entity not found." });
      }

      req[attachAs] = entity;
      req.authUser = entity;
      req.role = Model.modelName.toLowerCase();
      req.token = token;
      next();
    } catch (error) {
      res.status(401).json({ message: "Invalid token.", error: error.message });
    }
  };
};

/**
 * Role-agnostic authentication for endpoints shared by riders and drivers
 * (e.g. ride status, chat, cancel). Detects the role from the token and loads
 * the correct model, attaching `req.authUser` and `req.role`.
 */
const authAny = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const blacklisted = await BlackListToken.findOne({ token });
    if (blacklisted) {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const Model = decoded.role === "driver" ? Driver : Rider;
    const entity = await Model.findById(decoded._id).select("-__v");
    if (!entity) {
      return res.status(401).json({ message: "Invalid token. Entity not found." });
    }

    req.authUser = entity;
    req.role = decoded.role;
    req[decoded.role] = entity;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token.", error: error.message });
  }
};

/**
 * Guard restricting a route to a specific role. Use after `authAny`.
 * @param {'rider'|'driver'} role
 */
const requireRole = (role) => (req, res, next) => {
  if (req.role !== role) {
    return res.status(403).json({ message: `Only ${role}s can perform this action.` });
  }
  next();
};

// Middleware to authenticate rider
const authRider = createAuthMiddleware(Rider, 'rider');

// Middleware to authenticate driver
const authDriver = createAuthMiddleware(Driver, 'driver');

export { authRider, authDriver, authAny, requireRole };
export default authRider;
