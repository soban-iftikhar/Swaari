import express from "express";
import { body } from "express-validator";
import userController from "../controllers/userController.js";
import authUser from "../middlewares/AuthMiddleware.js";

const router = express.Router();

// Route for user registration
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
  userController.registerUser,
);

// Route for user login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("invalid email"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
  ],
  userController.loginUser,
);


// Protected route to get user profile
router.get("/profile", authUser, userController.getUserProfile);

router.get("/logout", authUser, userController.logoutUser);

export default router;
