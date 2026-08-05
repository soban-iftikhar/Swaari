import { useEffect, useRef } from "react";
import { MapPin, Navigation } from "lucide-react";
import useGoogleMaps from "../../hooks/useGoogleMaps";

/**
 * RideMap — the Google map surface for the booking + tracking flow.
 *
 * Renders pickup, dropoff, and (during a ride) the live driver marker, plus a
 * route polyline between pickup and dropoff. When the Google Maps API key is
 * absent or the script fails to load, it degrades to a clean solid placeholder
 * so the rest of the flow stays usable without external credentials.
 *
 * @param {object} props
 * @param {{lat:number,lng:number}} [props.pickup]
 * @param {{lat:number,lng:number}} [props.dropoff]
 * @param {{lat:number,lng:number}} [props.driver] - live driver position
 * @param {string} [props.className]
 */
export default function RideMap({ pickup, dropoff, driver, className = "" }) {
  const ready = useGoogleMaps();
  const hasKey = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const markers = useRef({});
  const routeLine = useRef(null);

  // Initialise the map once the API is ready.
  useEffect(() => {
    if (!ready || !mapRef.current || mapObj.current) return;
    const g = window.google;
    mapObj.current = new g.maps.Map(mapRef.current, {
      center: pickup || { lat: 31.5204, lng: 74.3587 }, // Lahore default
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: true,
      clickableIcons: false,
      styles: MAP_STYLE,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Sync markers + route whenever points change.
  useEffect(() => {
    if (!ready || !mapObj.current) return;
    const g = window.google;
    const map = mapObj.current;

    const upsertMarker = (key, pos, opts) => {
      if (!pos) {
        if (markers.current[key]) {
          markers.current[key].setMap(null);
          delete markers.current[key];
        }
        return;
      }
      if (markers.current[key]) {
        markers.current[key].setPosition(pos);
      } else {
        markers.current[key] = new g.maps.Marker({ position: pos, map, ...opts });
      }
    };

    upsertMarker("pickup", pickup, {
      label: { text: "A", color: "#1a1a1a", fontWeight: "700" },
      icon: pinIcon("#ffc107"),
    });
    upsertMarker("dropoff", dropoff, {
      label: { text: "B", color: "#ffffff", fontWeight: "700" },
      icon: pinIcon("#1a1a1a"),
    });
    upsertMarker("driver", driver, { icon: carIcon() });

    // Route line between pickup and dropoff.
    if (pickup && dropoff) {
      const path = [pickup, dropoff];
      if (routeLine.current) {
        routeLine.current.setPath(path);
      } else {
        routeLine.current = new g.maps.Polyline({
          path,
          map,
          strokeColor: "#1a1a1a",
          strokeOpacity: 0.7,
          strokeWeight: 4,
        });
      }
    } else if (routeLine.current) {
      routeLine.current.setMap(null);
      routeLine.current = null;
    }

    // Fit to whatever points we have.
    const pts = [pickup, dropoff, driver].filter(Boolean);
    if (pts.length === 1) {
      map.setCenter(pts[0]);
      map.setZoom(15);
    } else if (pts.length > 1) {
      const bounds = new g.maps.LatLngBounds();
      pts.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, 80);
    }
  }, [ready, pickup, dropoff, driver]);

  // Fallback surface (no key or failed load).
  if (!hasKey || (!ready && !hasKey)) {
    return <MapFallback pickup={pickup} dropoff={dropoff} driver={driver} className={className} />;
  }

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <div ref={mapRef} className="h-full w-full" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-cream">
          <div className="flex items-center gap-2 text-slate-muted">
            <Navigation className="h-5 w-5 animate-pulse" />
            Loading map…
          </div>
        </div>
      )}
    </div>
  );
}

/** Solid placeholder shown when Google Maps isn't available. */
function MapFallback({ pickup, dropoff, driver, className = "" }) {
  return (
    <div className={`relative h-full w-full overflow-hidden bg-charcoal ${className}`}>
      {/* Subtle grid motif (solid strokes, no gradient) */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(#f7f6f2 1px, transparent 1px), linear-gradient(90deg, #f7f6f2 1px, transparent 1px)",
          backgroundSize: "40px 40px",
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

/** A rounded pin SVG data-URI marker in the given solid color. */
function pinIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="46" viewBox="0 0 34 46">
    <path d="M17 0C7.6 0 0 7.6 0 17c0 12 17 29 17 29s17-17 17-29C34 7.6 26.4 0 17 0z" fill="${color}"/>
    <circle cx="17" cy="17" r="11" fill="#ffffff"/>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(34, 46),
    anchor: new window.google.maps.Point(17, 46),
    labelOrigin: new window.google.maps.Point(17, 17),
  };
}

/** Emerald car dot for the live driver marker. */
function carIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
    <circle cx="15" cy="15" r="13" fill="#10b981" stroke="#ffffff" stroke-width="3"/>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(30, 30),
    anchor: new window.google.maps.Point(15, 15),
  };
}

// Muted, low-chroma map styling to match the solid design language.
const MAP_STYLE = [
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "labels", stylers: [{ visibility: "simplified" }] },
];
