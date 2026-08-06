import { useCallback, useEffect, useRef, useState } from "react";
import api from "../lib/api";
import { EVENTS } from "../lib/socketEvents";
import { useSocket, useSocketEvent } from "../context/SocketContext";
import toast from "react-hot-toast";

/**
 * useDriverFlow — the driver workspace state machine and real-time orchestrator.
 *
 * The mirror image of useRideFlow, from the driver's seat:
 *   idle (live request feed + bidding) → assigned (drive the trip) → completed (rate)
 *
 * The `stage` is derived purely from the driver's assigned ride:
 *   - no assigned ride            → "idle"     (browse + bid on open requests)
 *   - accepted|arriving|arrived|ongoing → "assigned" (active trip panel)
 *   - completed                   → "completed" (rate the rider)
 *
 * A driver is only ever *assigned* to a ride once a rider accepts their bid, so
 * the restore call (`/active`, driver variant) returns only assigned rides — an
 * unaccepted bid never appears here. Open requests + the driver's own pending
 * bids live in `requests[]` / `myBids{}` and are cleared on assignment.
 *
 * Socket wiring (all on the driver's personal room except status/cancel, which
 * arrive on the ride room after RIDE_JOIN):
 *   RIDE_REQUESTED      → a new open request to prepend to the feed
 *   RIDE_BID_WITHDRAWN  → our bid was declined ({rejected}) → drop it, toast
 *   RIDE_ACCEPTED       → our bid won → become the assigned driver, clear feed
 *   RIDE_STATUS         → status advanced elsewhere → sync
 *   RIDE_CANCELLED      → the rider cancelled → toast + back to the feed
 *
 * @returns {object} flow state + action handlers (see return statement)
 */

const ASSIGNED_STATUSES = ["accepted", "arriving", "arrived", "ongoing"];

/** Derive the UI stage from the driver's assigned ride (or null). */
function stageFromRide(ride) {
  if (!ride) return "idle";
  if (ASSIGNED_STATUSES.includes(ride.status)) return "assigned";
  if (ride.status === "completed") return "completed";
  return "idle"; // cancelled / unknown → back to the request feed
}

export default function useDriverFlow() {
  const { emit, connected } = useSocket();

  // ── Feed + our bids (idle stage) ───────────────────────
  const [requests, setRequests] = useState([]); // open ride requests near us
  const [myBids, setMyBids] = useState({}); // rideId → our pending bid

  // ── Assigned ride (assigned/completed stages) ──────────
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(true);

  const joinedRideId = useRef(null);
  const stage = stageFromRide(ride);

  // ── Restore an in-progress trip on mount + seed the feed ─
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [activeRes, requestsRes] = await Promise.allSettled([
          api.get("/api/rides/active"),
          api.get("/api/rides/requests"),
        ]);
        if (cancelled) return;
        if (activeRes.status === "fulfilled" && activeRes.value.data?.ride) {
          setRide(activeRes.value.data.ride);
        } else if (requestsRes.status === "fulfilled") {
          // Only surface the feed when we're not already on a trip.
          setRequests(requestsRes.value.data?.rides || []);
        }
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();
    return () => {
      cancelled = true;
    };
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

  // ── Live: a new open request near us ───────────────────
  useSocketEvent(EVENTS.RIDE_REQUESTED, (incoming) => {
    if (!incoming?._id) return;
    // Ignore while we're on a trip — we can't take another.
    if (ride) return;
    setRequests((prev) => {
      if (prev.some((r) => r._id === incoming._id)) return prev;
      return [incoming, ...prev];
    });
    toast("New ride request nearby", { icon: "📍" });
  });

  // ── Live: our bid was declined / the request is gone ───
  useSocketEvent(EVENTS.RIDE_BID_WITHDRAWN, (payload) => {
    const rideId = payload?.rideId && String(payload.rideId);
    if (!rideId) return;
    setMyBids((prev) => {
      if (!prev[rideId]) return prev;
      const next = { ...prev };
      delete next[rideId];
      return next;
    });
    if (payload.rejected) toast("A rider passed on your offer", { icon: "👋" });
  });

  // ── Live: our offer was accepted → we're assigned ──────
  useSocketEvent(EVENTS.RIDE_ACCEPTED, (updated) => {
    if (!updated?._id) return;
    setRide(updated);
    setRequests([]);
    setMyBids({});
    toast.success("You got the ride! Head to the pickup.");
  });

  // ── Live: ride status advanced (from the ride room) ────
  useSocketEvent(EVENTS.RIDE_STATUS, (updated) => {
    if (updated?._id) setRide(updated);
  });

  // ── Live: the rider cancelled → back to the feed ───────
  useSocketEvent(EVENTS.RIDE_CANCELLED, (updated) => {
    setRide(null);
    const by = updated?.cancellation?.by;
    if (by === "rider") toast.error("The rider cancelled the ride");
    reloadRequests();
  });

  /** Re-fetch the open-requests feed (after a cancel / returning to idle). */
  const reloadRequests = useCallback(async () => {
    try {
      const res = await api.get("/api/rides/requests");
      setRequests(res.data?.rides || []);
    } catch {
      /* non-fatal; live pushes will still populate the feed */
    }
  }, []);

  /** Place (or update) a bid on an open request. */
  const placeBid = useCallback(async (rideId, { amount, etaMinutes, note } = {}) => {
    if (!rideId) return false;
    setLoading(true);
    try {
      const res = await api.post(`/api/rides/${rideId}/bid`, { amount, etaMinutes, note });
      if (res.data?.bid) setMyBids((prev) => ({ ...prev, [String(rideId)]: res.data.bid }));
      toast.success("Offer sent");
      return true;
    } catch (err) {
      toast.error(err.message || "Couldn't send your offer");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /** Withdraw our bid from a request. */
  const withdrawBid = useCallback(async (rideId) => {
    if (!rideId) return false;
    setLoading(true);
    try {
      await api.delete(`/api/rides/${rideId}/bid`);
      setMyBids((prev) => {
        const next = { ...prev };
        delete next[String(rideId)];
        return next;
      });
      toast("Offer withdrawn", { icon: "↩️" });
      return true;
    } catch (err) {
      toast.error(err.message || "Couldn't withdraw your offer");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Advance the assigned ride's status.
   *   arriving → arrived → ongoing (needs the rider's OTP) → completed
   * @param {string} next - the target status
   * @param {string} [otp] - required to start the trip (status === "ongoing")
   */
  const advanceStatus = useCallback(
    async (next, otp) => {
      if (!ride?._id) return false;
      setLoading(true);
      try {
        const body = otp ? { status: next, otp } : { status: next };
        const res = await api.post(`/api/rides/${ride._id}/status`, body);
        if (res.data?.ride) setRide(res.data.ride);
        return true;
      } catch (err) {
        toast.error(err.message || "Couldn't update the trip");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [ride],
  );

  /** Complete the trip (shortcut for advanceStatus("completed")). */
  const completeTrip = useCallback(() => advanceStatus("completed"), [advanceStatus]);

  /** Cancel the assigned ride and return to the feed. */
  const cancelRide = useCallback(
    async (reason) => {
      if (!ride?._id) return false;
      setLoading(true);
      try {
        await api.post(`/api/rides/${ride._id}/cancel`, { reason });
        setRide(null);
        toast.success("Ride cancelled");
        reloadRequests();
        return true;
      } catch (err) {
        toast.error(err.message || "Couldn't cancel the ride");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [ride, reloadRequests],
  );

  /** Rate the completed ride's rider, then return to the feed. */
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

  /** Clear the finished trip and return to the live request feed. */
  const reset = useCallback(() => {
    setRide(null);
    reloadRequests();
  }, [reloadRequests]);

  return {
    // stage + entities
    stage,
    requests,
    myBids,
    ride,
    loading,
    restoring,
    // actions
    placeBid,
    withdrawBid,
    advanceStatus,
    completeTrip,
    cancelRide,
    rateRide,
    reset,
  };
}
