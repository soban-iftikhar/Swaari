import { useEffect, useRef, useState } from "react";
import api from "../../lib/api";
import { MapPin, LocateFixed, Loader2, X, Search } from "../../lib/icons";

/**
 * PlaceSearch — address input with a custom autocomplete dropdown backed by the
 * server-side LocationIQ proxy (`GET /api/maps/autocomplete`). The LocationIQ
 * key never reaches the browser; we only ever call our own API.
 *
 * Emits a selected place as `{ address, lat, lng }` (the shape the backend and
 * useRideFlow expect) — unchanged from the old Google Places widget, so callers
 * need no changes. The "use my location" button reverse-geocodes the browser
 * fix via `GET /api/maps/reverse` to fill a human-readable address.
 *
 * Restoring real coordinates here is what fixes distance-based fares: a picked
 * result carries lat/lng, so `/api/rides/estimate` gets a real route instead of
 * distance ≈ 0.
 *
 * @param {object} props
 * @param {string} [props.label]
 * @param {{address:string,lat:number,lng:number}|null} [props.value]
 * @param {(place:{address:string,lat:number,lng:number}|null) => void} props.onChange
 * @param {string} [props.placeholder]
 */
export default function PlaceSearch({ label, value, onChange, placeholder }) {
  const [text, setText] = useState(value?.address || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const boxRef = useRef(null);
  const debounceRef = useRef(null);
  const reqIdRef = useRef(0); // guards against out-of-order responses
  const suppressRef = useRef(false); // skip the fetch fired by a programmatic set

  // Keep the field in sync when the value is cleared/changed externally.
  useEffect(() => {
    if (!value) setText("");
    else setText(value.address || "");
  }, [value]);

  // Close the dropdown on outside click.
  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Debounced autocomplete against our proxy whenever the query changes.
  useEffect(() => {
    if (suppressRef.current) {
      suppressRef.current = false;
      return;
    }
    const q = text.trim();
    if (q.length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const myId = ++reqIdRef.current;
      try {
        const res = await api.get("/api/maps/autocomplete", { params: { q } });
        if (myId !== reqIdRef.current) return; // a newer query superseded us
        setResults(res.data?.results || []);
        setOpen(true);
        setActiveIdx(-1);
      } catch {
        if (myId === reqIdRef.current) setResults([]);
      } finally {
        if (myId === reqIdRef.current) setSearching(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [text]);

  /** Commit a selected result upward and collapse the list. */
  const select = (place) => {
    suppressRef.current = true; // don't re-search for the address we just set
    setText(place.address);
    setResults([]);
    setOpen(false);
    setActiveIdx(-1);
    onChange({ address: place.address, lat: place.lat, lng: place.lng });
  };

  const clear = () => {
    setText("");
    setResults([]);
    setOpen(false);
    onChange(null);
  };

  /** Reverse-geocode the browser's location into an address. */
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
      const { latitude: lat, longitude: lng } = pos.coords;
      let address = "Current location";
      try {
        const res = await api.get("/api/maps/reverse", { params: { lat, lng } });
        if (res.data?.result?.address) address = res.data.result.address;
      } catch {
        /* keep the generic label if reverse geocoding is unavailable */
      }
      select({ address, lat, lng });
    } catch {
      /* user denied or unavailable — leave the field as-is */
    } finally {
      setLocating(false);
    }
  };

  /** Keyboard navigation over the results list. */
  const onKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      select(results[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5" ref={boxRef}>
      {label && <span className="text-sm font-semibold text-charcoal">{label}</span>}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-faint">
          <MapPin className="h-4 w-4" />
        </span>
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (value) onChange(null); // typing invalidates the prior selection
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder || "Search for an address"}
          className="sw-input pl-9 pr-16"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls="place-search-list"
        />
        {/* Trailing controls: clear + locate */}
        {text ? (
          <button
            type="button"
            aria-label="Clear"
            onClick={clear}
            className="absolute right-9 top-1/2 -translate-y-1/2 text-slate-faint transition hover:text-charcoal"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
        <button
          type="button"
          aria-label="Use my current location"
          onClick={handleLocate}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-amber-600 transition hover:bg-amber-050"
        >
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
        </button>

        {/* Autocomplete dropdown */}
        {open && (results.length > 0 || searching) && (
          <ul
            id="place-search-list"
            role="listbox"
            className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 max-h-64 overflow-y-auto rounded-lg border border-line bg-paper py-1 sw-animate-fade-in"
            style={{ boxShadow: "var(--shadow-pop)" }}
          >
            {searching && results.length === 0 ? (
              <li className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> Searching…
              </li>
            ) : (
              results.map((r, i) => (
                <li key={r.placeId} role="option" aria-selected={i === activeIdx}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => select(r)}
                    className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition ${
                      i === activeIdx ? "bg-cream" : "hover:bg-cream"
                    }`}
                  >
                    <span className="mt-0.5 text-slate-faint">
                      <Search className="h-4 w-4" />
                    </span>
                    <span className="line-clamp-2 text-sm leading-snug text-slate-ink">{r.address}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
