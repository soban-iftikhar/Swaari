import asyncHandler from "../utils/asyncHandler.js";
import geocodeService from "../services/geocodeService.js";

/**
 * Maps controller — thin proxy over geocodeService so the server-side
 * LOCATIONIQ_KEY never reaches the browser. The frontend calls these instead of
 * hitting LocationIQ directly.
 *
 * Both handlers degrade gracefully (empty results / null) when the key is
 * missing, mirroring the service, so the app stays usable without creds.
 */

/**
 * GET /api/maps/autocomplete?q=…&limit=…
 * Address autocomplete for the booking screen's location search.
 * Returns { results: [{ address, lat, lng, placeId }] }.
 */
const autocomplete = asyncHandler(async (req, res) => {
  const q = String(req.query.q || "");
  const limit = Math.min(Number(req.query.limit) || 5, 10);
  const results = await geocodeService.autocomplete(q, limit);
  res.status(200).json({ results });
});

/**
 * GET /api/maps/reverse?lat=…&lng=…
 * Reverse-geocode a coordinate into an address (powers "use my location").
 * Returns { result: { address, lat, lng } | null }.
 */
const reverse = asyncHandler(async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ message: "lat and lng are required" });
  }
  const result = await geocodeService.reverse(lat, lng);
  res.status(200).json({ result });
});

export default { autocomplete, reverse };
