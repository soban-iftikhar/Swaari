import express from "express";
import { body } from "express-validator";
import riderController from "../controllers/riderController.js";
import authRider from "../middlewares/AuthMiddleware.js";

const router = express.Router();

// Route for rider registration
router.post(
  "/register",
  [
    body("fullName.firstName")
      .notEmpty()
      .withMessage("First name is required"),
    body("fullName.lastName")
      .notEmpty()
      .withMessage("Last name is required"),
    body("email").isEmail().withMessage("invalid email"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
  ],
  riderController.registerRider,
);

// Route for rider login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("invalid email"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
  ],
  riderController.loginRider,
);


// Protected route to get rider profile
router.get("/profile", authRider, riderController.getRiderProfile);

router.get("/logout", authRider, riderController.logoutRider);

export default router;
