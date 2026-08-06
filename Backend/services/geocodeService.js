/**
 * Geocoding service — address autocomplete and reverse geocoding via LocationIQ.
 *
 * Kept separate from mapsService (which owns routing + fare) because this is the
 * search/geocoding concern. Both share the server-side LOCATIONIQ_KEY, which is
 * never exposed to the browser: the frontend calls these through the /api/maps
 * proxy so the key stays unexposed.
 *
 * Every helper degrades gracefully (empty results / null) when the key is
 * missing or the upstream call fails, so the app stays usable without creds.
 *
 * All results are normalised to the app's `{ address, lat, lng }` shape (the
 * same contract the old Google Places widget emitted), plus a `placeId` for
 * stable React list keys.
 */

// Country bias — Swaari's home market (mirrors the old Places restriction).
const COUNTRY_CODES = "pk";

/**
 * Address autocomplete for a partial query string.
 * @param {string} query - the partial address the user is typing
 * @param {number} [limit=5]
 * @returns {Promise<Array<{address:string, lat:number, lng:number, placeId:string}>>}
 */
export async function autocomplete(query, limit = 5) {
  const key = process.env.LOCATIONIQ_KEY;
  const q = (query || "").trim();
  if (!key || q.length < 3) return [];

  try {
    const url = new URL("https://api.locationiq.com/v1/autocomplete");
    url.searchParams.set("key", key);
    url.searchParams.set("q", q);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("countrycodes", COUNTRY_CODES);
    url.searchParams.set("accept-language", "en"); // Latin-script names, not local script
    url.searchParams.set("dedupe", "1");

    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      .map((item) => normalizePlace(item))
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Reverse geocode a coordinate into a human-readable address.
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{address:string, lat:number, lng:number}|null>}
 */
export async function reverse(lat, lng) {
  const key = process.env.LOCATIONIQ_KEY;
  if (!key || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  try {
    const url = new URL("https://us1.locationiq.com/v1/reverse");
    url.searchParams.set("key", key);
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("accept-language", "en"); // Latin-script names, not local script
    url.searchParams.set("format", "json");

    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.display_name) return null;

    return {
      address: data.display_name,
      lat: Number(data.lat) || lat,
      lng: Number(data.lon) || lng,
    };
  } catch {
    return null;
  }
}

/**
 * Normalise a raw LocationIQ result into the app's place shape.
 * @param {object} item - a single LocationIQ autocomplete/search result
 * @returns {{address:string, lat:number, lng:number, placeId:string}|null}
 * @private
 */
function normalizePlace(item) {
  const lat = Number(item?.lat);
  const lng = Number(item?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    address: item.display_name || item.display_place || "",
    lat,
    lng,
    placeId: String(item.place_id ?? item.osm_id ?? `${lat},${lng}`),
  };
}

export default { autocomplete, reverse };
