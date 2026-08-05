import { useEffect, useState } from "react";

/**
 * useGoogleMaps — lazy-loads the Google Maps JS API and returns the ready state.
 *
 * The script is inserted once globally and all calls share the same promise. Maps,
 * Places, and Directions libs are pre-loaded (we need all three for the booking flow).
 *
 * Usage:
 *   const mapsReady = useGoogleMaps();
 *   if (!mapsReady) return <Spinner />;
 *   // now window.google.maps.* is available
 *
 * @returns {boolean} true once the API is loaded and ready
 */

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
const SCRIPT_ID = "google-maps-api-script";

// Global promise shared across all component instances.
let loadPromise = null;

function loadGoogleMaps() {
  if (loadPromise) return loadPromise;

  // Already loaded?
  if (window.google?.maps) {
    loadPromise = Promise.resolve();
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      // Script tag present but not yet fired — wait for it.
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places,geometry&callback=__googleMapsCallback`;
    script.async = true;
    script.defer = true;

    window.__googleMapsCallback = () => {
      delete window.__googleMapsCallback;
      resolve();
    };

    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export default function useGoogleMaps() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadGoogleMaps()
      .then(() => setReady(true))
      .catch((err) => console.error("Google Maps load error:", err));
  }, []);

  return ready;
}
