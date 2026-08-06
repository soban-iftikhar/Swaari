import { useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import useGeolocation from "./useGeolocation";
import { EVENTS } from "../lib/socketEvents";

/**
 * useDriverPresence — the driver's online/offline toggle and live location
 * broadcast.
 *
 * Online semantics:
 *  - Going online emits `DRIVER_GO_ONLINE` with a fresh geolocation fix, which
 *    marks the driver `isOnline: true, status: "available"` and seeds their
 *    position so the rider-matching `$near` query finds them immediately.
 *  - While online we stream position at a throttled cadence (~5s) via
 *    `DRIVER_LOCATION_UPDATE`. When an active `rideId` is passed (driver on a
 *    trip) the backend relays the fix to the rider in real time; otherwise it
 *    just keeps the driver's profile position fresh for matching.
 *  - Going offline (or the socket dropping) flips the driver unavailable, so
 *    they stop appearing in ride requests.
 *
 * @param {object} [opts]
 * @param {string} [opts.rideId] - active ride id; when present, location is
 *   relayed to the rider during the trip.
 * @returns {{
 *   online: boolean,
 *   position: {lat:number,lng:number}|null,
 *   geolocationError: string|null,
 *   toggling: boolean,
 *   goOnline: () => Promise<boolean>,
 *   goOffline: () => Promise<boolean>
 * }}
 */
export default function useDriverPresence({ rideId } = {}) {
  const { emit, connected } = useSocket();
  const { updateUser } = useAuth();

  const [online, setOnline] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Always watch the driver's position so we have a fresh fix ready the moment
  // they go online, and can stream it while online. requestLocation() is used
  // for the one-off fix on the go-online click itself.
  const { position, error: geolocationError, requestLocation } = useGeolocation({ watch: true });

  // Throttle: remember the last time we broadcast so we never spam the socket.
  const lastSent = useRef(0);
  const STREAM_INTERVAL_MS = 5000;

  // Keep the driver's online state in sync with the socket connection: if the
  // socket drops, presence is gone server-side (drivers auto-go-offline), so
  // reflect that locally too.
  useEffect(() => {
    if (!connected) setOnline(false);
  }, [connected]);

  /** Go online: send our position so nearby riders can find us. */
  const goOnline = useCallback(async () => {
    if (!connected) return false;
    setToggling(true);
    try {
      // Fresh fix first so matching uses our current location.
      let coords = position;
      try {
        coords = await requestLocation();
      } catch {
        /* keep the watched position if the one-off fix fails */
      }
      const ok = await new Promise((resolve) => {
        emit(
          EVENTS.DRIVER_GO_ONLINE,
          coords ? { lat: coords.lat, lng: coords.lng } : {},
          (ack) => resolve(ack?.ok === true),
        );
      });
      if (ok) {
        setOnline(true);
        updateUser({ isOnline: true });
        lastSent.current = Date.now();
      }
      return ok;
    } finally {
      setToggling(false);
    }
  }, [connected, position, requestLocation, emit, updateUser]);

  /** Go offline: stop appearing in ride requests. */
  const goOffline = useCallback(async () => {
    if (!connected) return false;
    setToggling(true);
    try {
      const ok = await new Promise((resolve) => {
        emit(EVENTS.DRIVER_GO_OFFLINE, {}, (ack) => resolve(ack?.ok === true));
      });
      if (ok) {
        setOnline(false);
        updateUser({ isOnline: false });
      }
      return ok;
    } finally {
      setToggling(false);
    }
  }, [connected, emit, updateUser]);

  // Stream position while online, throttled. Tag the rideId when on a trip so
  // the rider gets live tracking.
  useEffect(() => {
    if (!online || !connected || !position) return;
    const now = Date.now();
    if (now - lastSent.current < STREAM_INTERVAL_MS) return;
    lastSent.current = now;
    emit(EVENTS.DRIVER_LOCATION_UPDATE, {
      ...(rideId ? { rideId } : {}),
      lat: position.lat,
      lng: position.lng,
    });
  }, [online, connected, position, rideId, emit]);

  return {
    online,
    position,
    geolocationError,
    toggling,
    goOnline,
    goOffline,
  };
}
