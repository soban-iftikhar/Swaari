import express from "express";
import { body } from "express-validator";
import driverController from "../controllers/driverController.js";
import { authDriver } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

// Route for driver registration
router.post("/register", 
    body("fullName.firstName").notEmpty().withMessage("First name is required"),
    body("fullName.lastName").notEmpty().withMessage("Last name is required"),
    body("email").isEmail().withMessage("invalid email"), 
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
    body("vehicle.color").notEmpty().withMessage("Vehicle color is required"),
    body("vehicle.licensePlate").notEmpty().withMessage("Vehicle license plate is required"),
    body("vehicle.make").notEmpty().withMessage("Vehicle make is required"),
    body("vehicle.year").isInt({ min: 1886 }).withMessage("Vehicle year must be a valid year"),
    body("vehicle.capacity").isInt({ min: 1 }).withMessage("Vehicle capacity must be at least 1"),
    body("vehicle.type").notEmpty().withMessage("Vehicle type is required"),
    driverController.registerDriver
);

// Route for driver login
router.post("/login", 
    body("email").isEmail().withMessage("invalid email"), 
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
    driverController.loginDriver
);

// Protected route to get driver profile
router.get("/profile", authDriver, driverController.getDriverProfile);

// Route for driver logout
router.get("/logout", authDriver, driverController.logoutDriver);

export default router;