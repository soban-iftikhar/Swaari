import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin, Navigation } from "../../lib/icons";
import useMapTiler from "../../hooks/useMapTiler";

/**
 * RideMap — the map surface for the booking + tracking flow, on MapLibre GL
 * rendering MapTiler vector tiles.
 *
 * Renders pickup (A), dropoff (B), and (during a ride) the live driver marker,
 * plus a route line between pickup and dropoff — using real road geometry when a
 * `route` is supplied, else a straight segment. The basemap is MapTiler vector
 * tiles when a key is set, otherwise a keyless OpenStreetMap raster basemap, so
 * the map renders live geography either way (see useMapTiler). The solid,
 * on-brand placeholder is a last resort, shown only if MapLibre can't initialise
 * at all (e.g. WebGL unavailable).
 *
 * All points are plain `{ lat, lng }`. Callers holding GeoJSON `[lng, lat]`
 * should convert at the boundary (see `coordsOf` in lib/format).
 *
 * @param {object} props
 * @param {{lat:number,lng:number}} [props.pickup]
 * @param {{lat:number,lng:number}} [props.dropoff]
 * @param {{lat:number,lng:number}} [props.driver] - live driver position
 * @param {Array<[number,number]>} [props.route] - optional [lng,lat] path
 * @param {string} [props.className]
 */
const LAHORE = { lat: 31.5204, lng: 74.3587 };

export default function RideMap({ pickup, dropoff, driver, route, className = "" }) {
  const { styleSpec } = useMapTiler();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const loadedRef = useRef(false);
  const markersRef = useRef({});
  const [failed, setFailed] = useState(false);

  // Initialise the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: styleSpec,
        center: [pickup?.lng ?? LAHORE.lng, pickup?.lat ?? LAHORE.lat],
        zoom: 12,
        attributionControl: { compact: true },
      });
    } catch {
      // WebGL unavailable / context creation failed — fall back to the placeholder.
      setFailed(true);
      return;
    }
    map.on("error", () => {}); // swallow tile 4xx noise; the basemap still renders
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => {
      loadedRef.current = true;
      map.addSource("route", {
        type: "geojson",
        data: { type: "Feature", geometry: { type: "LineString", coordinates: [] } },
      });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#1a1a1a", "line-width": 4, "line-opacity": 0.75 },
      });
      syncMap(map, markersRef.current, { pickup, dropoff, driver, route });
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
      markersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleSpec]);

  // Sync markers + route whenever the points change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    syncMap(map, markersRef.current, { pickup, dropoff, driver, route });
  }, [pickup, dropoff, driver, route]);

  if (failed) {
    return <MapFallback pickup={pickup} dropoff={dropoff} driver={driver} className={className} />;
  }

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}

/**
 * Reconcile markers + route line + viewport against the current points.
 * Pure DOM/MapLibre work (no React) so it can run from both the load handler
 * and the points-changed effect.
 */
function syncMap(map, markers, { pickup, dropoff, driver, route }) {
  upsertMarker(map, markers, "pickup", pickup, () => pinEl("A", "#ffc107", "#1a1a1a"));
  upsertMarker(map, markers, "dropoff", dropoff, () => pinEl("B", "#1a1a1a", "#ffffff"));
  upsertMarker(map, markers, "driver", driver, driverEl);

  // Route line: real geometry when provided, else a straight pickup→dropoff line.
  const src = map.getSource("route");
  if (src) {
    let line = [];
    if (Array.isArray(route) && route.length > 1) line = route;
    else if (pickup && dropoff) line = [[pickup.lng, pickup.lat], [dropoff.lng, dropoff.lat]];
    src.setData({ type: "Feature", geometry: { type: "LineString", coordinates: line } });
  }

  // Fit the viewport to whatever points we have.
  const pts = [pickup, dropoff, driver].filter(Boolean);
  if (pts.length === 1) {
    map.easeTo({ center: [pts[0].lng, pts[0].lat], zoom: 14, duration: 500 });
  } else if (pts.length > 1) {
    const bounds = new maplibregl.LngLatBounds();
    pts.forEach((p) => bounds.extend([p.lng, p.lat]));
    map.fitBounds(bounds, { padding: 64, maxZoom: 15, duration: 500 });
  }
}

/** Create or move a marker; remove it when the point is cleared. */
function upsertMarker(map, markers, key, point, makeEl) {
  if (!point) {
    if (markers[key]) {
      markers[key].remove();
      delete markers[key];
    }
    return;
  }
  if (markers[key]) {
    markers[key].setLngLat([point.lng, point.lat]);
  } else {
    markers[key] = new maplibregl.Marker({ element: makeEl(), anchor: key === "driver" ? "center" : "bottom" })
      .setLngLat([point.lng, point.lat])
      .addTo(map);
  }
}

/** A solid teardrop pin with a single-letter label (A / B). */
function pinEl(label, bg, fg) {
  const el = document.createElement("div");
  el.style.cssText =
    "width:30px;height:38px;position:relative;transform:translateY(2px);filter:drop-shadow(0 2px 3px rgba(26,26,26,.35))";
  el.innerHTML = `<svg width="30" height="38" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 0C6.7 0 0 6.7 0 15c0 10.6 15 23 15 23s15-12.4 15-23C30 6.7 23.3 0 15 0z" fill="${bg}"/>
    <text x="15" y="20" text-anchor="middle" font-family="Inter,sans-serif" font-size="14" font-weight="800" fill="${fg}">${label}</text>
  </svg>`;
  return el;
}

/** Emerald pulsing dot for the live driver position. */
function driverEl() {
  const el = document.createElement("div");
  el.style.cssText =
    "width:22px;height:22px;border-radius:9999px;background:#10b981;border:3px solid #fff;box-shadow:0 0 0 4px rgba(16,185,129,.28),0 2px 4px rgba(26,26,26,.3)";
  return el;
}

/** Solid, on-brand placeholder shown when no MapTiler key is configured. */
function MapFallback({ pickup, dropoff, driver, className = "" }) {
  return (
    <div className={`relative h-full w-full overflow-hidden bg-charcoal ${className}`}>
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(#f7f6f2 1px, transparent 1px), linear-gradient(90deg, #f7f6f2 1px, transparent 1px)",
          backgroundSize: "38px 38px",
        }}
      />
      <div className="relative flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber text-charcoal">
          {driver ? <Navigation className="h-7 w-7" /> : <MapPin className="h-7 w-7" />}
        </span>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-paper">
            {driver ? "Tracking your driver" : "Map preview"}
          </p>
          <p className="max-w-xs text-xs text-slate-faint">
            {pickup?.address ? `Pickup: ${pickup.address}` : "Set your pickup and dropoff to continue."}
            {dropoff?.address ? ` → ${dropoff.address}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
