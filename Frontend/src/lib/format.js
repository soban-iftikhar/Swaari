/**
 * Small, dependency-free formatting helpers used across the UI.
 * Currency is PKR (Pakistani Rupee) to match the platform's market.
 */

/**
 * Format a number as PKR currency, e.g. 1234 → "Rs 1,234".
 * @param {number} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  if (amount == null || Number.isNaN(Number(amount))) return "Rs —";
  return `Rs ${Math.round(Number(amount)).toLocaleString("en-PK")}`;
}

/**
 * Format meters as a friendly distance, e.g. 850 → "850 m", 5300 → "5.3 km".
 * @param {number} meters
 * @returns {string}
 */
export function formatDistance(meters) {
  if (meters == null) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format seconds as a compact duration, e.g. 90 → "2 min", 3900 → "1h 5m".
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  if (seconds == null) return "—";
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${Math.max(1, mins)} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Format an ISO/date value as a short clock time, e.g. "3:42 PM".
 * @param {string|Date} value
 * @returns {string}
 */
export function formatTime(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/**
 * Format an ISO/date value as a short date, e.g. "Aug 7, 2026".
 * @param {string|Date} value
 * @returns {string}
 */
export function formatDate(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Build a display name from a rider/driver `fullname` subdocument.
 * @param {{firstname?:string, lastname?:string}} fullname
 * @returns {string}
 */
export function fullNameOf(fullname) {
  if (!fullname) return "";
  return [fullname.firstname, fullname.lastname].filter(Boolean).join(" ");
}

/**
 * Countdown mm:ss from a number of seconds, clamped at 0.
 * @param {number} seconds
 * @returns {string}
 */
export function formatCountdown(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

/**
 * Normalise a ride "place" (pickup/dropoff) into `{ lat, lng }`.
 *
 * Booking inputs carry flat `{ lat, lng }`, but a *persisted* ride stores each
 * endpoint as GeoJSON `{ address, location: { coordinates: [lng, lat] } }`.
 * This reads whichever shape is present so the map gets real coordinates in
 * both cases (the driver dashboard only ever has the persisted shape).
 *
 * @param {object|null} place
 * @returns {{lat:number, lng:number}|null}
 */
export function coordsOf(place) {
  if (!place) return null;
  // Flat booking shape.
  if (Number.isFinite(place.lat) && Number.isFinite(place.lng)) {
    return { lat: place.lat, lng: place.lng };
  }
  // Persisted GeoJSON shape: coordinates are [lng, lat].
  const c = place.location?.coordinates;
  if (Array.isArray(c) && Number.isFinite(c[0]) && Number.isFinite(c[1])) {
    return { lat: c[1], lng: c[0] };
  }
  return null;
}
