/**
 * useMapTiler — resolves the basemap style handed to MapLibre GL.
 *
 * MapLibre GL JS ships as a normal npm module (imported directly by RideMap),
 * so there's no external <script> to inject and no async "is the SDK ready"
 * race. This hook's only job is to pick the basemap style:
 *
 *   - With VITE_MAPTILER_KEY set, use MapTiler's vector "streets" style —
 *     crisp, labelled, production-grade tiles served under MapTiler's terms.
 *   - Without a key, fall back to a *keyless* OpenStreetMap raster basemap so
 *     the map still renders live geography out of the box. This is fine for
 *     local dev / demos; for production set a key so tiles come from MapTiler
 *     rather than OSM's community tile servers (whose usage policy discourages
 *     heavy app traffic).
 *
 * The MapTiler key is a *browser* key by design (it must ride in the tile URL);
 * it's domain-restricted in the MapTiler dashboard, so a VITE_ prefix is correct
 * and safe. Address search + routing use LocationIQ, whose key stays server-side.
 *
 * `styleSpec` is referentially stable across renders (a module-level constant
 * object when keyless, or a plain string URL when keyed), so it's safe to use
 * directly in a map-init effect's dependency array.
 *
 * @param {string} [style="streets-v2"] - MapTiler style id (used only when keyed)
 * @returns {{ keyed: boolean, styleSpec: string|object }}
 */
const OSM_RASTER_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

export default function useMapTiler(style = "streets-v2") {
  const key = import.meta.env.VITE_MAPTILER_KEY || "";
  const keyed = Boolean(key);
  const styleSpec = keyed
    ? `https://api.maptiler.com/maps/${style}/style.json?key=${key}`
    : OSM_RASTER_STYLE;

  return { keyed, styleSpec };
}
