import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useGeolocation — thin wrapper over the browser Geolocation API.
 *
 * Returns the last known position plus helpers to request a one-off fix or watch
 * continuously. Coordinates are normalised to `{ lat, lng }` to match the rest of
 * the app (backend stores GeoJSON [lng, lat] but the UI works in {lat,lng}).
 *
 * @param {object} [opts]
 * @param {boolean} [opts.watch=false] - continuously watch position
 * @param {boolean} [opts.enableHighAccuracy=true]
 * @returns {{
 *   position: {lat:number,lng:number}|null,
 *   error: string|null,
 *   loading: boolean,
 *   requestLocation: () => Promise<{lat:number,lng:number}>
 * }}
 */
export default function useGeolocation({ watch = false, enableHighAccuracy = true } = {}) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const watchIdRef = useRef(null);

  const toLatLng = (pos) => ({
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
  });

  /** Request a single position fix, resolving with { lat, lng }. */
  const requestLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        const msg = "Geolocation is not supported by this browser";
        setError(msg);
        reject(new Error(msg));
        return;
      }
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = toLatLng(pos);
          setPosition(coords);
          setError(null);
          setLoading(false);
          resolve(coords);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
          reject(err);
        },
        { enableHighAccuracy, timeout: 10000, maximumAge: 30000 },
      );
    });
  }, [enableHighAccuracy]);

  // Optional continuous watch.
  useEffect(() => {
    if (!watch || !("geolocation" in navigator)) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition(toLatLng(pos));
        setError(null);
      },
      (err) => setError(err.message),
      { enableHighAccuracy, timeout: 10000, maximumAge: 5000 },
    );
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [watch, enableHighAccuracy]);

  return { position, error, loading, requestLocation };
}
