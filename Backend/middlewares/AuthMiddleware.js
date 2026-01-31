import User from '../models/User.js';
import Driver from '../models/Driver.js';
import jwt from 'jsonwebtoken';

// Generic auth middleware factory
const createAuthMiddleware = (Model, attachAs = 'user') => {
  return async (req, res, next) => {
    try {
      const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
      }

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const entity = await Model.findById(decoded._id).select("-refreshToken -__v");
      if (!entity) {
        return res.status(401).json({ message: "Invalid token. Entity not found." });
      }

      req[attachAs] = entity; // Attach entity to request object
      next();
    } catch (error) {
      res.status(401).json({ message: "Invalid token.", error: error.message });
    }
  };
};

// Middleware to authenticate user
const authUser = createAuthMiddleware(User, 'user');

// Middleware to authenticate driver
const authDriver = createAuthMiddleware(Driver, 'driver');

export { authUser, authDriver };
export default authUser; 