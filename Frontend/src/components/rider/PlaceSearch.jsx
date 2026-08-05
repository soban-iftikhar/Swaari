import { useEffect, useRef, useState } from "react";
import { MapPin, LocateFixed, Loader2, X } from "lucide-react";
import useGoogleMaps from "../../hooks/useGoogleMaps";

/**
 * PlaceSearch — address input backed by the Google Places Autocomplete widget.
 *
 * Emits a selected place as `{ address, lat, lng }` (same shape the backend
 * expects) or a manual coordinate when the user hits the geolocate button.
 * Falls back to a plain text field (with a manual coordinate picker) when the
 * Places library isn't available.
 *
 * @param {object} props
 * @param {string} [props.label]
 * @param {{address:string,lat:number,lng:number}|null} [props.value]
 * @param {(place:{address:string,lat:number,lng:number}|null) => void} props.onChange
 * @param {string} [props.placeholder]
 */
export default function PlaceSearch({ label, value, onChange, placeholder }) {
  const ready = useGoogleMaps();
  const hasKey = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const inputRef = useRef(null);
  const autocomplete = useRef(null);
  const [text, setText] = useState(value?.address || "");
  const [locating, setLocating] = useState(false);

  // Keep the text field in sync when the value is cleared externally.
  useEffect(() => {
    if (!value) setText("");
  }, [value]);

  // Wire up the Places widget once the API is ready and this field has focus.
  useEffect(() => {
    if (!ready || !hasKey || !inputRef.current) return;
    const g = window.google;

    const ac = new g.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "pk" }, // Swaari's home market
    });
    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (!place?.geometry?.location) return;
      const selected = {
        address: place.formatted_address || place.name,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      setText(selected.address);
      onChange(selected);
    });
    autocomplete.current = ac;

    return () => {
      g.maps.event.clearInstanceListeners(ac);
      autocomplete.current = null;
    };
  }, [ready, hasKey, onChange]);

  /** Use the browser's location as this endpoint. */
  const handleLocate = async () => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        }),
      );
      const selected = {
        address: "Current location",
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };
      setText(selected.address);
      onChange(selected);
    } catch {
      /* user denied or unavailable — leave the field as-is */
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-sm font-semibold text-charcoal">{label}</span>}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-faint">
          <MapPin className="h-4 w-4" />
        </span>
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            // Typing invalidates the previous selection.
            if (value && e.target.value !== value.address) onChange(null);
          }}
          placeholder={placeholder || "Enter an address"}
          className="sw-input pl-9 pr-10"
          autoComplete="off"
        />
        {text ? (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => {
              setText("");
              onChange(null);
            }}
            className="absolute right-9 top-1/2 -translate-y-1/2 text-slate-faint transition hover:text-charcoal"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
        <button
          type="button"
          aria-label="Use my current location"
          onClick={handleLocate}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-amber-600 transition hover:bg-amber-050"
        >
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
