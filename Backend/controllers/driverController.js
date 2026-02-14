import driverService from "../services/driverService.js";
import { validationResult } from "express-validator";

// Controller function to handle driver registration
const registerDriver = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const result = await driverService.registerDriver(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Controller function to handle driver login
const loginDriver = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const result = await driverService.loginDriver(email, password);

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

// Controller function to get driver profile (protected route)
const getDriverProfile = async (req, res) => {
  try {
    const driver = await driverService.getDriverProfile(req.driver);
    res.status(200).json({ driver });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};kkk

// Controller function to handle driver logout
const logoutDriver = async (req, res) => {
  try {
    const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
    await driverService.logoutDriver(token);
    res.clearCookie("accessToken");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  registerDriver,
  loginDriver,
  getDriverProfile,
  logoutDriver,
};