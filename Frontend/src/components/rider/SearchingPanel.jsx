import { useEffect, useState } from "react";
import { Loader2, Radio, X } from "lucide-react";
import OfferCard from "./OfferCard";
import Button from "../ui/Button";
import { formatCurrency, formatDistance, formatDuration } from "../../lib/format";

/**
 * SearchingPanel — the reverse-auction stage. Shows the requested route + fare
 * estimate, a live "finding drivers" pulse, and driver offers as they stream in.
 * The rider accepts one offer or cancels the search.
 *
 * @param {object} props
 * @param {object} props.ride - the requested ride
 * @param {Array} props.bids - live pending offers
 * @param {(bidId:string) => void} props.onAccept
 * @param {(bidId:string) => void} props.onReject
 * @param {() => void} props.onCancel
 * @param {boolean} [props.loading] - accept/cancel in flight
 */
export default function SearchingPanel({ ride, bids, onAccept, onReject, onCancel, loading }) {
  const [elapsed, setElapsed] = useState(0);
  const [acceptingId, setAcceptingId] = useState(null);

  // Simple elapsed timer so riders see the search is live.
  useEffect(() => {
    const started = ride?.createdAt ? new Date(ride.createdAt).getTime() : Date.now();
    const tick = () => setElapsed(Math.floor((Date.now() - started) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [ride?.createdAt]);

  const handleAccept = (bidId) => {
    setAcceptingId(bidId);
    onAccept(bidId);
  };

  const estFare = ride?.fareEstimate;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-line pb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-amber" />
          </span>
          <h1 className="text-xl font-black text-charcoal">Finding you a driver…</h1>
        </div>
        <p className="mt-1 text-sm text-slate-muted">
          {bids.length > 0
            ? `${bids.length} offer${bids.length > 1 ? "s" : ""} so far · searching ${elapsed}s`
            : `Notifying nearby drivers · ${elapsed}s`}
        </p>

        {/* Route + estimate recap */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-muted">
          {ride?.distanceMeters != null && <span>{formatDistance(ride.distanceMeters)}</span>}
          {ride?.durationSeconds != null && <span>{formatDuration(ride.durationSeconds)}</span>}
          {estFare != null && (
            <span className="font-semibold text-slate-ink">
              Est. {formatCurrency(estFare)} · <span className="capitalize">{ride.vehicleTier}</span>
            </span>
          )}
        </div>
      </div>

      {/* Offers list */}
      <div className="flex-1 overflow-y-auto py-4">
        {bids.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-050 text-amber-600">
              <Radio className="h-7 w-7 animate-pulse" />
            </span>
            <p className="max-w-xs text-sm text-slate-muted">
              Your request is live. Drivers nearby are reviewing it — offers will appear here.
            </p>
            <Loader2 className="h-5 w-5 animate-spin text-slate-faint" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {bids.map((bid) => (
              <OfferCard
                key={bid._id}
                bid={bid}
                onAccept={handleAccept}
                onReject={onReject}
                busy={loading && acceptingId === bid._id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cancel */}
      <div className="border-t border-line pt-3">
        <Button variant="danger" fullWidth icon={X} onClick={() => onCancel("Rider cancelled during search")} disabled={loading}>
          Cancel Request
        </Button>
      </div>
    </div>
  );
}
