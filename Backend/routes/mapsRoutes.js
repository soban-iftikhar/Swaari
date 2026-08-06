import express from "express";
import mapsController from "../controllers/mapsController.js";
import { authAny } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

/**
 * Maps routes — server-side proxy for LocationIQ geocoding so the API key stays
 * unexposed (it lives in LOCATIONIQ_KEY, never shipped to the browser).
 *
 * Both routes use `authAny`: only logged-in riders/drivers can search, which
 * keeps the shared key from being abused by anonymous traffic.
 */

// ── Address autocomplete ───────────────────────────────────────
router.get("/autocomplete", authAny, mapsController.autocomplete);

// ── Reverse geocode (coordinate → address) ─────────────────────
router.get("/reverse", authAny, mapsController.reverse);

export default router;
