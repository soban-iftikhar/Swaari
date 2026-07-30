import { validationResult } from "express-validator";
import asyncHandler from "../utils/asyncHandler.js";
import rideService from "../services/rideService.js";
import chatService from "../services/chatService.js";
import { estimateAllTiers } from "../services/mapsService.js";

/**
 * Ride controller — thin HTTP layer over rideService / chatService.
 *
 * Controllers validate input, delegate to the service (which owns business
 * rules and Socket.io emits), and shape the JSON response. All handlers are
 * wrapped with asyncHandler so thrown/rejected errors reach the central error
 * middleware and become consistent JSON responses.
 */

/** Collect express-validator errors into a 400, if any. */
const rejectOnValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }
  return false;
};

/**
 * POST /api/rides/estimate
 * Body: { pickup:{lat,lng}, dropoff:{lat,lng} }
 * Returns distance/duration and a fare per tier. Public-friendly (used by the
 * landing page calculator and the booking screen).
 */
const estimate = asyncHandler(async (req, res) => {
  const { pickup, dropoff } = req.body;
  if (!pickup?.lat || !pickup?.lng || !dropoff?.lat || !dropoff?.lng) {
    return res.status(400).json({ message: "pickup and dropoff coordinates are required" });
  }
  const result = await estimateAllTiers(
    { lat: Number(pickup.lat), lng: Number(pickup.lng) },
    { lat: Number(dropoff.lat), lng: Number(dropoff.lng) },
  );
  res.status(200).json(result);
});

/**
 * POST /api/rides  (rider)
 * Create a ride request and broadcast to nearby drivers.
 */
const requestRide = asyncHandler(async (req, res) => {
  if (rejectOnValidationErrors(req, res)) return;
  const result = await rideService.requestRide(req.authUser._id, req.body);
  res.status(201).json(result);
});

/**
 * GET /api/rides/active  (rider or driver)
 * The caller's current in-progress ride, or null.
 */
const getActiveRide = asyncHandler(async (req, res) => {
  const ride = await rideService.getActiveRide(req.role, req.authUser._id);
  res.status(200).json({ ride });
});

/**
 * GET /api/rides/history  (rider or driver)
 */
const getHistory = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const rides = await rideService.getHistory(req.role, req.authUser._id, limit);
  res.status(200).json({ rides });
});

/**
 * GET /api/rides/requests  (driver)
 * Nearby open requests for the driver's tier — powers the trip feed.
 */
const getOpenRequests = asyncHandler(async (req, res) => {
  const rides = await rideService.getOpenRequestsForDriver(req.authUser._id);
  res.status(200).json({ rides });
});

/**
 * GET /api/rides/:id  (participant)
 */
const getRide = asyncHandler(async (req, res) => {
  const ride = await rideService.getRideById(req.params.id);
  res.status(200).json({ ride });
});

/**
 * GET /api/rides/:id/bids  (rider)
 * All pending offers for the rider's offer drawer.
 */
const getBids = asyncHandler(async (req, res) => {
  const bids = await rideService.getRideBids(req.params.id);
  res.status(200).json({ bids });
});

/**
 * POST /api/rides/:id/bid  (driver)
 * Body: { amount, etaMinutes, note? }
 */
const placeBid = asyncHandler(async (req, res) => {
  const bid = await rideService.placeBid(req.authUser._id, req.params.id, req.body);
  res.status(201).json({ bid });
});

/**
 * DELETE /api/rides/:id/bid  (driver)
 */
const withdrawBid = asyncHandler(async (req, res) => {
  const bid = await rideService.withdrawBid(req.authUser._id, req.params.id);
  res.status(200).json({ bid });
});

/**
 * POST /api/rides/:id/accept  (rider)
 * Body: { bidId }
 */
const acceptBid = asyncHandler(async (req, res) => {
  const ride = await rideService.acceptBid(req.authUser._id, req.params.id, req.body.bidId);
  res.status(200).json({ ride });
});

/**
 * POST /api/rides/:id/reject-bid  (rider)
 * Body: { bidId }
 */
const rejectBid = asyncHandler(async (req, res) => {
  const bid = await rideService.rejectBid(req.authUser._id, req.params.id, req.body.bidId);
  res.status(200).json({ bid });
});

/**
 * POST /api/rides/:id/status  (driver)
 * Body: { status, otp? } — arriving | arrived | ongoing | completed
 */
const updateStatus = asyncHandler(async (req, res) => {
  const ride = await rideService.updateRideStatus({
    rideId: req.params.id,
    actorRole: req.role,
    actorId: req.authUser._id,
    nextStatus: req.body.status,
    otp: req.body.otp,
  });
  res.status(200).json({ ride });
});

/**
 * POST /api/rides/:id/cancel  (rider or driver)
 * Body: { reason? }
 */
const cancelRide = asyncHandler(async (req, res) => {
  const ride = await rideService.cancelRide({
    rideId: req.params.id,
    actorRole: req.role,
    actorId: req.authUser._id,
    reason: req.body.reason,
  });
  res.status(200).json({ ride });
});

/**
 * POST /api/rides/:id/rate  (rider or driver)
 * Body: { stars }
 */
const rateRide = asyncHandler(async (req, res) => {
  const ride = await rideService.rateRide({
    rideId: req.params.id,
    actorRole: req.role,
    actorId: req.authUser._id,
    stars: req.body.stars,
  });
  res.status(200).json({ ride });
});

/**
 * GET /api/rides/:id/messages  (participant)
 */
const getMessages = asyncHandler(async (req, res) => {
  const messages = await chatService.getMessages({
    rideId: req.params.id,
    actorRole: req.role,
    actorId: req.authUser._id,
  });
  res.status(200).json({ messages });
});

export default {
  estimate,
  requestRide,
  getActiveRide,
  getHistory,
  getOpenRequests,
  getRide,
  getBids,
  placeBid,
  withdrawBid,
  acceptBid,
  rejectBid,
  updateStatus,
  cancelRide,
  rateRide,
  getMessages,
};
