/**
 * Maps & fare service.
 *
 * Computes route metrics (distance + duration) and fare estimates. When a
 * LocationIQ key is configured it uses their Directions API (OSRM-backed) for
 * accurate road metrics; otherwise it falls back to a haversine estimate so the
 * platform stays fully functional without external credentials.
 *
 * LocationIQ was chosen over Google because it needs no billing account — a free
 * email-signup key is enough. The key lives server-side only (LOCATIONIQ_KEY,
 * never exposed to the browser); the frontend reaches geocoding through the
 * /api/maps proxy.
 *
 * All public helpers accept plain `{ lat, lng }` points. Callers holding GeoJSON
 * `[lng, lat]` coordinates should convert at the boundary.
 */

/**
 * Per-vehicle pricing model (PKR). Fare = base + perKm·km + perMin·min, floored at minFare.
 * Riders pick a concrete vehicle type directly; each has its own economics. This
 * table is the single source of truth for both estimates and the selectable list
 * (order here is the order shown in the picker — cheapest → priciest). Tune to
 * your market.
 */
export const VEHICLE_PRICING = Object.freeze({
  bike: { base: 60, perKm: 22, perMin: 1.5, minFare: 90, label: "Bike" },
  rickshaw: { base: 90, perKm: 32, perMin: 2, minFare: 120, label: "Rickshaw" },
  mini: { base: 110, perKm: 42, perMin: 2.5, minFare: 150, label: "Mini" },
  sedan: { base: 160, perKm: 65, perMin: 4, minFare: 230, label: "Car" },
  suv: { base: 220, perKm: 85, perMin: 5, minFare: 320, label: "SUV" },
  van: { base: 260, perKm: 95, perMin: 6, minFare: 380, label: "Van" },
});

/** The selectable vehicle types, in display order — the source-of-truth list. */
export const VEHICLE_TYPES = Object.freeze(Object.keys(VEHICLE_PRICING));

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
 * Uses LocationIQ Directions when LOCATIONIQ_KEY is set, else haversine.
 * @param {{lat:number, lng:number}} pickup
 * @param {{lat:number, lng:number}} dropoff
 * @returns {Promise<{distanceMeters:number, durationSeconds:number, source:string}>}
 */
export async function getRouteMetrics(pickup, dropoff) {
  const key = process.env.LOCATIONIQ_KEY;

  if (key) {
    try {
      // LocationIQ Directions (OSRM-compatible): coordinates are lng,lat pairs
      // separated by ';'. overview=false skips geometry — we only need metrics.
      const coords = `${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}`;
      const url = new URL(`https://us1.locationiq.com/v1/directions/driving/${coords}`);
      url.searchParams.set("key", key);
      url.searchParams.set("overview", "false");

      const res = await fetch(url);
      const data = await res.json();
      const route = data?.routes?.[0];

      if (route && Number.isFinite(route.distance) && Number.isFinite(route.duration)) {
        return {
          distanceMeters: Math.round(route.distance),
          durationSeconds: Math.round(route.duration),
          source: "locationiq",
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
 * Estimate the fare for a vehicle type given route metrics. Rounds to nearest 10 PKR.
 * @param {string} vehicleType - bike | rickshaw | mini | sedan | suv | van
 * @param {number} distanceMeters
 * @param {number} durationSeconds
 * @returns {number} fare in PKR
 */
export function estimateFare(vehicleType, distanceMeters, durationSeconds) {
  const pricing = VEHICLE_PRICING[vehicleType] || VEHICLE_PRICING.mini;
  const km = distanceMeters / 1000;
  const min = durationSeconds / 60;

  const raw = pricing.base + pricing.perKm * km + pricing.perMin * min;
  const fare = Math.max(pricing.minFare, raw);
  return Math.round(fare / 10) * 10;
}

/**
 * Produce a fare estimate for every vehicle type at once — used by the fare
 * calculator and the vehicle selection screen.
 * @param {{lat:number, lng:number}} pickup
 * @param {{lat:number, lng:number}} dropoff
 * @returns {Promise<{distanceMeters:number, durationSeconds:number, source:string, options:Array}>}
 */
export async function estimateFares(pickup, dropoff) {
  const metrics = await getRouteMetrics(pickup, dropoff);

  const options = Object.entries(VEHICLE_PRICING).map(([type, pricing]) => ({
    type,
    label: pricing.label,
    fare: estimateFare(type, metrics.distanceMeters, metrics.durationSeconds),
  }));

  return { ...metrics, options };
}

export default {
  VEHICLE_PRICING,
  VEHICLE_TYPES,
  haversineMeters,
  getRouteMetrics,
  estimateFare,
  estimateFares,
};
