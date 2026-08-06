import { useCallback, useEffect, useRef, useState } from "react";
import api from "../lib/api";
import { EVENTS } from "../lib/socketEvents";
import { useSocket, useSocketEvent } from "../context/SocketContext";
import toast from "react-hot-toast";

/**
 * useRideFlow — the rider booking state machine and real-time orchestrator.
 *
 * Owns the whole rider journey in one place:
 *   booking → searching (bids arrive live) → active (tracking) → completed (rate)
 *
 * The `stage` is derived from the current ride's status plus local booking state,
 * so the UI is a pure function of it. Socket events (new bids, acceptance, status
 * changes, driver location, cancellation) update state in real time; on mount we
 * restore any in-progress ride so a refresh doesn't drop the rider mid-trip.
 *
 * @returns {object} flow state + action handlers (see return statement)
 */

const ACTIVE_STATUSES = ["accepted", "arriving", "arrived", "ongoing"];

/** Derive the UI stage from a ride object (or null) and booking readiness. */
function stageFromRide(ride) {
  if (!ride) return "booking";
  if (ride.status === "requested") return "searching";
  if (ACTIVE_STATUSES.includes(ride.status)) return "active";
  if (ride.status === "completed") return "completed";
  return "booking"; // cancelled / unknown → back to booking
}

export default function useRideFlow() {
  const { emit, connected } = useSocket();

  // ── Booking inputs ─────────────────────────────────────
  const [pickup, setPickup] = useState(null); // { address, lat, lng }
  const [dropoff, setDropoff] = useState(null);
  const [vehicleType, setVehicleType] = useState("bike");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [estimate, setEstimate] = useState(null); // { distanceMeters, durationSeconds, options }
  const [estimating, setEstimating] = useState(false);

  // ── Ride state ─────────────────────────────────────────
  const [ride, setRide] = useState(null);
  const [bids, setBids] = useState([]);
  const [driverCoords, setDriverCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(true);

  const joinedRideId = useRef(null);
  const stage = stageFromRide(ride);

  // ── Restore any in-progress ride on mount ──────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/api/rides/active");
        if (!cancelled && res.data?.ride) {
          setRide(res.data.ride);
          if (res.data.ride.status === "requested") {
            // Reload the offers that arrived before this session.
            loadBids(res.data.ride._id);
          }
        }
      } catch {
        /* no active ride is fine */
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Join/leave the ride room so we receive RIDE_STATUS ─
  useEffect(() => {
    const id = ride?._id;
    const shouldJoin = id && ride.status !== "completed" && ride.status !== "cancelled";
    if (connected && shouldJoin && joinedRideId.current !== id) {
      emit(EVENTS.RIDE_JOIN, id);
      joinedRideId.current = id;
    }
    if ((!shouldJoin || !id) && joinedRideId.current) {
      emit(EVENTS.RIDE_LEAVE, joinedRideId.current);
      joinedRideId.current = null;
    }
  }, [ride, connected, emit]);

  // ── Live: a driver placed/updated an offer ─────────────
  useSocketEvent(EVENTS.RIDE_NEW_BID, (payload) => {
    if (!payload?.bid) return;
    setBids((prev) => {
      const others = prev.filter((b) => b._id !== payload.bid._id);
      return [...others, payload.bid].sort((a, b) => a.amount - b.amount);
    });
    toast(`New offer: Rs ${payload.bid.amount}`, { icon: "🚗" });
  });

  // ── Live: a driver withdrew an offer ───────────────────
  useSocketEvent(EVENTS.RIDE_BID_WITHDRAWN, (payload) => {
    if (!payload?.bidId) return;
    setBids((prev) => prev.filter((b) => b._id !== payload.bidId));
  });

  // ── Live: our bid acceptance confirmed (both parties) ──
  useSocketEvent(EVENTS.RIDE_ACCEPTED, (updated) => {
    if (updated?._id) {
      setRide(updated);
      setBids([]);
    }
  });

  // ── Live: ride status advanced (arriving → completed) ──
  useSocketEvent(EVENTS.RIDE_STATUS, (updated) => {
    if (updated?._id) setRide(updated);
  });

  // ── Live: driver location for map tracking ─────────────
  useSocketEvent(EVENTS.RIDE_DRIVER_LOCATION, (payload) => {
    if (payload?.coords) setDriverCoords(payload.coords);
  });

  // ── Live: ride cancelled (by driver, or elsewhere) ─────
  useSocketEvent(EVENTS.RIDE_CANCELLED, (updated) => {
    setRide(updated?.status === "cancelled" ? updated : null);
    setBids([]);
    setDriverCoords(null);
    const by = updated?.cancellation?.by;
    if (by === "driver") toast.error("Your driver cancelled the ride");
  });

  /** Fetch the current pending offers for a ride (initial load / resume). */
  const loadBids = useCallback(async (rideId) => {
    try {
      const res = await api.get(`/api/rides/${rideId}/bids`);
      setBids(res.data?.bids || []);
    } catch {
      /* non-fatal; live events will still populate */
    }
  }, []);

  /** Recompute the fare estimate for the current pickup/dropoff pair. */
  const refreshEstimate = useCallback(async () => {
    if (!pickup || !dropoff) return;
    setEstimating(true);
    try {
      const res = await api.post("/api/rides/estimate", {
        pickup: { lat: pickup.lat, lng: pickup.lng },
        dropoff: { lat: dropoff.lat, lng: dropoff.lng },
      });
      setEstimate(res.data);
    } catch (err) {
      toast.error(err.message || "Couldn't estimate the fare");
    } finally {
      setEstimating(false);
    }
  }, [pickup, dropoff]);

  // Auto-estimate whenever both endpoints are set.
  useEffect(() => {
    if (pickup && dropoff) refreshEstimate();
    else setEstimate(null);
  }, [pickup, dropoff, refreshEstimate]);

  /** Submit the ride request and enter the searching stage. */
  const requestRide = useCallback(async () => {
    if (!pickup || !dropoff) {
      toast.error("Set your pickup and dropoff first");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/api/rides", {
        pickup: { address: pickup.address, lat: pickup.lat, lng: pickup.lng },
        dropoff: { address: dropoff.address, lat: dropoff.lat, lng: dropoff.lng },
        vehicleType,
        paymentMethod,
      });
      setRide(res.data.ride);
      setBids([]);
      const n = res.data.matchedDrivers;
      toast.success(n > 0 ? `Sent to ${n} nearby driver${n > 1 ? "s" : ""}` : "Request sent — waiting for drivers");
    } catch (err) {
      toast.error(err.message || "Couldn't request the ride");
    } finally {
      setLoading(false);
    }
  }, [pickup, dropoff, vehicleType, paymentMethod]);

  /** Accept a driver's offer; the ride advances to the active stage. */
  const acceptBid = useCallback(
    async (bidId) => {
      if (!ride?._id) return;
      setLoading(true);
      try {
        const res = await api.post(`/api/rides/${ride._id}/accept`, { bidId });
        setRide(res.data.ride);
        setBids([]);
        toast.success("Offer accepted — your driver is on the way!");
      } catch (err) {
        toast.error(err.message || "Couldn't accept this offer");
        // Refresh offers in case it was taken/withdrawn.
        loadBids(ride._id);
      } finally {
        setLoading(false);
      }
    },
    [ride, loadBids],
  );

  /** Dismiss a single offer without accepting it. */
  const rejectBid = useCallback(
    async (bidId) => {
      if (!ride?._id) return;
      setBids((prev) => prev.filter((b) => b._id !== bidId)); // optimistic
      try {
        await api.post(`/api/rides/${ride._id}/reject-bid`, { bidId });
      } catch (err) {
        toast.error(err.message || "Couldn't dismiss the offer");
        loadBids(ride._id);
      }
    },
    [ride, loadBids],
  );

  /** Cancel the current ride (searching or active). */
  const cancelRide = useCallback(
    async (reason) => {
      if (!ride?._id) return;
      setLoading(true);
      try {
        await api.post(`/api/rides/${ride._id}/cancel`, { reason });
        setRide(null);
        setBids([]);
        setDriverCoords(null);
        toast.success("Ride cancelled");
      } catch (err) {
        toast.error(err.message || "Couldn't cancel the ride");
      } finally {
        setLoading(false);
      }
    },
    [ride],
  );

  /** Rate the completed ride's driver, then clear the flow. */
  const rateRide = useCallback(
    async (stars) => {
      if (!ride?._id) return;
      try {
        await api.post(`/api/rides/${ride._id}/rate`, { stars });
        toast.success("Thanks for the feedback!");
      } catch (err) {
        toast.error(err.message || "Couldn't submit the rating");
      } finally {
        reset();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ride],
  );

  /** Reset back to a fresh booking state. */
  const reset = useCallback(() => {
    setRide(null);
    setBids([]);
    setDriverCoords(null);
    setPickup(null);
    setDropoff(null);
    setEstimate(null);
    setVehicleType("bike");
    setPaymentMethod("cash");
  }, []);

  return {
    // stage + entities
    stage,
    ride,
    bids,
    driverCoords,
    loading,
    restoring,
    // booking inputs
    pickup,
    setPickup,
    dropoff,
    setDropoff,
    vehicleType,
    setVehicleType,
    paymentMethod,
    setPaymentMethod,
    estimate,
    estimating,
    // actions
    requestRide,
    acceptBid,
    rejectBid,
    cancelRide,
    rateRide,
    reset,
  };
}
