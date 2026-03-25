import riderService from "../services/riderService.js";
import { validationResult } from "express-validator";

// Controller function to handle rider registration
const registerRider = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const result = await riderService.registerRider(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Controller function to handle rider login
const loginRider = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const result = await riderService.loginRider(email, password);

    // Set access token in HTTP-only cookie
    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

// Controller function to get rider profile (protected route)
const getRiderProfile = async (req, res) => {
  try {
    const rider = await riderService.getRiderProfile(req.rider);
    res.status(200).json({ rider });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controller function to handle rider logout
const logoutRider = async (req, res) => {
  try {
    const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
    await riderService.logoutRider(token);
    res.clearCookie("accessToken");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  registerRider,
  loginRider,
  getRiderProfile,
  logoutRider,
};
