import { Star, Clock, Check, X } from "lucide-react";
import { formatCurrency, fullNameOf } from "../../lib/format";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";

/**
 * OfferCard — a single driver's bid in the offers list.
 * Shows driver identity, rating, vehicle, ETA, price, and accept/decline actions.
 *
 * @param {object} props
 * @param {object} props.bid - populated bid { driver, amount, etaMinutes, note }
 * @param {(bidId:string) => void} props.onAccept
 * @param {(bidId:string) => void} props.onReject
 * @param {boolean} [props.busy] - an accept is in flight (disable actions)
 */
export default function OfferCard({ bid, onAccept, onReject, busy }) {
  const driver = bid.driver || {};
  const vehicle = driver.vehicle || {};
  const rating = driver.rating?.average ?? 5;

  return (
    <div className="rounded-xl border border-line bg-paper p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={fullNameOf(driver.fullname)} fallback="D" ring="amber" />
          <div>
            <p className="font-bold text-charcoal">{fullNameOf(driver.fullname) || "Driver"}</p>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-muted">
              <span className="inline-flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-amber text-amber" />
                {rating.toFixed(1)}
              </span>
              {vehicle.make && (
                <span className="capitalize">
                  {vehicle.color} {vehicle.make}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-charcoal">{formatCurrency(bid.amount)}</p>
          <p className="inline-flex items-center gap-1 text-xs text-slate-muted">
            <Clock className="h-3 w-3" />
            {bid.etaMinutes} min away
          </p>
        </div>
      </div>

      {bid.note && (
        <p className="mt-3 rounded-lg bg-cream px-3 py-2 text-sm text-slate-ink">“{bid.note}”</p>
      )}

      <div className="mt-3 flex gap-2">
        <Button variant="outline" size="sm" icon={X} onClick={() => onReject(bid._id)} disabled={busy}>
          Decline
        </Button>
        <Button variant="go" size="sm" fullWidth icon={Check} onClick={() => onAccept(bid._id)} loading={busy}>
          Accept {formatCurrency(bid.amount)}
        </Button>
      </div>
    </div>
  );
}
