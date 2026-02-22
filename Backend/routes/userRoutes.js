import express from "express";
import {body} from "express-validator";
import userController from "../controllers/userController.js";

const router = express.Router();

router.post("/register", [
    body("firstName").notEmpty().withMessage("First name is required"),
    body("email").isEmail().withMessage("invalid email"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long")
], userController.registerUser);

export default router;
