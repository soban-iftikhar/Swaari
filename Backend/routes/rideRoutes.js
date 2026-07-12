import express from "express";
import { body } from "express-validator";
import rideController from "../controllers/rideController.js";
import { authRider, authDriver, authAny, requireRole } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

/**
 * Ride routes — REST API for the ride lifecycle.
 *
 * Public routes (estimate) don't require auth. Most routes use `authAny` so
 * both riders and drivers can call them; guards (`requireRole`) refine access
 * where needed (e.g. only riders request rides, only drivers place bids).
 */

// ── Public: fare estimation ────────────────────────────────────
router.post("/estimate", rideController.estimate);

// ── Rider-only: request a ride ─────────────────────────────────
router.post(
  "/",
  authRider,
  [
    body("pickup.address").notEmpty().withMessage("Pickup address is required"),
    body("pickup.lat").isFloat().withMessage("Pickup latitude is required"),
    body("pickup.lng").isFloat().withMessage("Pickup longitude is required"),
    body("dropoff.address").notEmpty().withMessage("Dropoff address is required"),
    body("dropoff.lat").isFloat().withMessage("Dropoff latitude is required"),
    body("dropoff.lng").isFloat().withMessage("Dropoff longitude is required"),
    body("vehicleTier")
      .isIn(["economy", "comfort", "executive"])
      .withMessage("Invalid vehicle tier"),
    body("paymentMethod")
      .optional()
      .isIn(["cash", "online"])
      .withMessage("Invalid payment method"),
  ],
  rideController.requestRide,
);

// ── Shared: active ride + history ──────────────────────────────
router.get("/active", authAny, rideController.getActiveRide);
router.get("/history", authAny, rideController.getHistory);

// ── Driver-only: open requests feed ────────────────────────────
router.get("/requests", authDriver, rideController.getOpenRequests);

// ── Single ride read (participants only) ───────────────────────
router.get("/:id", authAny, rideController.getRide);

// ── Bidding (rider reads, driver writes) ───────────────────────
router.get("/:id/bids", authAny, requireRole("rider"), rideController.getBids);

router.post(
  "/:id/bid",
  authDriver,
  [
    body("amount").isFloat({ min: 0 }).withMessage("Bid amount must be a positive number"),
    body("etaMinutes")
      .isInt({ min: 0 })
      .withMessage("ETA must be a non-negative integer"),
    body("note").optional().isString().isLength({ max: 140 }),
  ],
  rideController.placeBid,
);

router.delete("/:id/bid", authDriver, rideController.withdrawBid);

// ── Rider bid acceptance/rejection ─────────────────────────────
router.post(
  "/:id/accept",
  authRider,
  [body("bidId").notEmpty().withMessage("Bid ID is required")],
  rideController.acceptBid,
);

router.post(
  "/:id/reject-bid",
  authRider,
  [body("bidId").notEmpty().withMessage("Bid ID is required")],
  rideController.rejectBid,
);

// ── Status transitions (driver) ────────────────────────────────
router.post(
  "/:id/status",
  authDriver,
  [
    body("status")
      .isIn(["arriving", "arrived", "ongoing", "completed"])
      .withMessage("Invalid status"),
    body("otp").optional().isString(),
  ],
  rideController.updateStatus,
);

// ── Cancel (both) ──────────────────────────────────────────────
router.post(
  "/:id/cancel",
  authAny,
  [body("reason").optional().isString()],
  rideController.cancelRide,
);

// ── Rating (both, after completion) ────────────────────────────
router.post(
  "/:id/rate",
  authAny,
  [body("stars").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5")],
  rideController.rateRide,
);

// ── Chat (both, participants only) ─────────────────────────────
router.get("/:id/messages", authAny, rideController.getMessages);

export default router;
