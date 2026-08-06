import { useState } from "react";
import { Star, Route, Clock, Wallet, ChevronDown, Send, Trash2 } from "lucide-react";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Input from "../ui/Input";
import Avatar from "../ui/Avatar";
import RouteRow from "../ui/RouteRow";
import { formatCurrency, formatDistance, formatDuration, fullNameOf } from "../../lib/format";

/**
 * RequestCard — a single open ride request in the driver's feed, and the inline
 * bidding surface. The driver-side mirror of the rider's OfferCard.
 *
 * Collapsed, it shows the rider, route, distance/duration and the platform fare
 * estimate. Expanded, it reveals a bid form (amount prefilled to the estimate,
 * ETA in minutes, optional note) with place / update / withdraw actions
 * depending on whether the driver already has a live bid on this request.
 *
 * @param {object} props
 * @param {object} props.request - populated ride request (rider, pickup, dropoff, fareEstimate…)
 * @param {object} [props.myBid] - the driver's existing pending bid on this ride, if any
 * @param {(rideId:string, bid:{amount:number,etaMinutes:number,note?:string}) => Promise<boolean>} props.onBid
 * @param {(rideId:string) => Promise<boolean>} props.onWithdraw
 * @param {boolean} [props.busy] - a bid/withdraw is in flight
 */
export default function RequestCard({ request, myBid, onBid, onWithdraw, busy }) {
  const hasBid = !!myBid;
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(() => String(myBid?.amount ?? request.fareEstimate ?? ""));
  const [eta, setEta] = useState(() => String(myBid?.etaMinutes ?? 5));
  const [note, setNote] = useState(() => myBid?.note ?? "");

  const rider = request.rider || {};
  const rating = rider.rating?.average ?? 5;

  const amountValid = amount !== "" && Number(amount) >= 0;
  const etaValid = eta !== "" && Number.isInteger(Number(eta)) && Number(eta) >= 0;
  const canSubmit = amountValid && etaValid && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    const ok = await onBid(request._id, {
      amount: Number(amount),
      etaMinutes: Number(eta),
      note: note.trim() || undefined,
    });
    if (ok) setOpen(false);
  };

  return (
    <div className={`rounded-xl border bg-paper p-4 ${hasBid ? "border-emerald" : "border-line"}`}>
      {/* Rider + fare estimate */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={fullNameOf(rider.fullname)} fallback="R" ring={hasBid ? "emerald" : "none"} />
          <div>
            <p className="font-bold text-charcoal">{fullNameOf(rider.fullname) || "Rider"}</p>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-muted">
              <span className="inline-flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-amber text-amber" />
                {rating.toFixed(1)}
              </span>
              <span className="capitalize">{request.vehicleTier}</span>
              <span className="capitalize">· {request.paymentMethod}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-slate-faint">Est. fare</p>
          <p className="text-xl font-black text-charcoal">{formatCurrency(request.fareEstimate)}</p>
        </div>
      </div>

      {/* Route */}
      <RouteRow pickup={request.pickup} dropoff={request.dropoff} className="mt-3" />

      {/* Trip meta */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-muted">
        <span className="inline-flex items-center gap-1">
          <Route className="h-3.5 w-3.5" />
          {formatDistance(request.distanceMeters)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {formatDuration(request.durationSeconds)}
        </span>
        {hasBid && (
          <Badge tone="emerald" className="ml-auto">
            Bid placed · {formatCurrency(myBid.amount)}
          </Badge>
        )}
      </div>

      {/* Toggle / bid surface */}
      {!open ? (
        <div className="mt-3 flex gap-2">
          {hasBid ? (
            <>
              <Button
                variant="outline"
                size="sm"
                icon={Trash2}
                onClick={() => onWithdraw(request._id)}
                disabled={busy}
              >
                Withdraw
              </Button>
              <Button variant="go" size="sm" fullWidth icon={ChevronDown} onClick={() => setOpen(true)} disabled={busy}>
                Update offer
              </Button>
            </>
          ) : (
            <Button variant="go" size="sm" fullWidth icon={Wallet} onClick={() => setOpen(true)} disabled={busy}>
              Place a bid
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3 border-t border-line pt-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Your fare (Rs)"
              type="number"
              inputMode="numeric"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={!amountValid && amount !== "" ? "sw-input-error" : ""}
            />
            <Input
              label="ETA (min)"
              type="number"
              inputMode="numeric"
              min="0"
              value={eta}
              onChange={(e) => setEta(e.target.value)}
              className={!etaValid && eta !== "" ? "sw-input-error" : ""}
            />
          </div>
          <Input
            label="Note (optional)"
            type="text"
            maxLength={140}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. 2 min away, silver Corolla"
          />
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="go"
              size="sm"
              fullWidth
              icon={Send}
              onClick={submit}
              loading={busy}
              disabled={!canSubmit}
            >
              {hasBid ? "Update offer" : "Send offer"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
