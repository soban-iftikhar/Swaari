import userModel from '../models/User.js';
import jwt from 'jsonwebtoken';

// Middleware to authenticate user using JWT
const authUser = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await userModel.findById(decoded._id).select("-refreshToken -__v");
    if (!user) {
      return res.status(401).json({ message: "Invalid token. User not found." });
    }

    req.user = user; // Attach user to request object
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token.", error: error.message });
  }
};

export default authUser; 