/**
 * Maps & fare service.
 *
 * Computes route metrics (distance + duration) and fare estimates. When a
 * Google Maps server key is configured it uses the Distance Matrix API for
 * accurate road metrics; otherwise it falls back to a haversine estimate so the
 * platform stays fully functional without external credentials.
 *
 * All public helpers accept plain `{ lat, lng }` points. Callers holding GeoJSON
 * `[lng, lat]` coordinates should convert at the boundary.
 */

/**
 * Per-tier pricing model (PKR). Fare = base + perKm·km + perMin·min, floored at minFare.
 * Tune these to your market; they are the single source of truth for estimates.
 */
export const TIER_PRICING = Object.freeze({
  economy: { base: 100, perKm: 45, perMin: 3, minFare: 150, label: "Economy" },
  comfort: { base: 160, perKm: 65, perMin: 4, minFare: 230, label: "Comfort" },
  executive: { base: 260, perKm: 95, perMin: 6, minFare: 380, label: "Executive" },
});

const EARTH_RADIUS_M = 6371000;
// Assumed average urban speed (km/h) for the fallback duration estimate.
const FALLBACK_SPEED_KMH = 24;

const toRad = (deg) => (deg * Math.PI) / 180;

/**
 * Great-circle distance between two points in meters (haversine formula).
 * @param {{lat:number, lng:number}} a
 * @param {{lat:number, lng:number}} b
 * @returns {number} distance in meters
 */
export function haversineMeters(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * Resolve road distance and duration between two points.
 * Uses Google Distance Matrix when GOOGLE_MAPS_API_KEY is set, else haversine.
 * @param {{lat:number, lng:number}} pickup
 * @param {{lat:number, lng:number}} dropoff
 * @returns {Promise<{distanceMeters:number, durationSeconds:number, source:string}>}
 */
export async function getRouteMetrics(pickup, dropoff) {
  const key = process.env.GOOGLE_MAPS_API_KEY;

  if (key) {
    try {
      const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
      url.searchParams.set("origins", `${pickup.lat},${pickup.lng}`);
      url.searchParams.set("destinations", `${dropoff.lat},${dropoff.lng}`);
      url.searchParams.set("mode", "driving");
      url.searchParams.set("key", key);

      const res = await fetch(url);
      const data = await res.json();
      const element = data?.rows?.[0]?.elements?.[0];

      if (element?.status === "OK") {
        return {
          distanceMeters: element.distance.value,
          durationSeconds: element.duration.value,
          source: "google",
        };
      }
    } catch {
      // Fall through to the haversine estimate on any network/API failure.
    }
  }

  // Fallback: straight-line distance inflated slightly for road routing, with a
  // duration derived from an assumed average urban speed.
  const straight = haversineMeters(pickup, dropoff);
  const distanceMeters = Math.round(straight * 1.35);
  const durationSeconds = Math.round((distanceMeters / 1000 / FALLBACK_SPEED_KMH) * 3600);
  return { distanceMeters, durationSeconds, source: "fallback" };
}

/**
 * Estimate the fare for a tier given route metrics. Rounds to the nearest 10 PKR.
 * @param {string} tier - economy | comfort | executive
 * @param {number} distanceMeters
 * @param {number} durationSeconds
 * @returns {number} fare in PKR
 */
export function estimateFare(tier, distanceMeters, durationSeconds) {
  const pricing = TIER_PRICING[tier] || TIER_PRICING.economy;
  const km = distanceMeters / 1000;
  const min = durationSeconds / 60;

  const raw = pricing.base + pricing.perKm * km + pricing.perMin * min;
  const fare = Math.max(pricing.minFare, raw);
  return Math.round(fare / 10) * 10;
}

/**
 * Produce a fare estimate for every tier at once — used by the fare calculator
 * and the vehicle selection screen.
 * @param {{lat:number, lng:number}} pickup
 * @param {{lat:number, lng:number}} dropoff
 * @returns {Promise<{distanceMeters:number, durationSeconds:number, source:string, tiers:Array}>}
 */
export async function estimateAllTiers(pickup, dropoff) {
  const metrics = await getRouteMetrics(pickup, dropoff);

  const tiers = Object.entries(TIER_PRICING).map(([tier, pricing]) => ({
    tier,
    label: pricing.label,
    fare: estimateFare(tier, metrics.distanceMeters, metrics.durationSeconds),
  }));

  return { ...metrics, tiers };
}

export default {
  TIER_PRICING,
  haversineMeters,
  getRouteMetrics,
  estimateFare,
  estimateAllTiers,
};
