import { ArrowRight, Clock, Route } from "lucide-react";
import PlaceSearch from "./PlaceSearch";
import TierSelector from "./TierSelector";
import PaymentToggle from "./PaymentToggle";
import Button from "../ui/Button";
import { formatDistance, formatDuration } from "../../lib/format";

/**
 * BookingPanel — the booking-stage form: pickup, dropoff, vehicle tier, payment,
 * and the request CTA. Fares refresh automatically as endpoints change.
 *
 * Pure presentational component driven by the useRideFlow state; all handlers
 * come from props.
 *
 * @param {object} props - mirrors the useRideFlow booking slice
 */
export default function BookingPanel({
  pickup,
  setPickup,
  dropoff,
  setDropoff,
  tier,
  setTier,
  paymentMethod,
  setPaymentMethod,
  estimate,
  estimating,
  loading,
  onRequest,
}) {
  const canRequest = !!pickup && !!dropoff && !loading;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-black text-charcoal">Where to?</h1>
        <p className="mt-1 text-sm text-slate-muted">
          Set your route, pick a ride, and let drivers send you offers.
        </p>
      </div>

      {/* Route inputs */}
      <div className="flex flex-col gap-3">
        <PlaceSearch label="Pickup" value={pickup} onChange={setPickup} placeholder="Where are you now?" />
        <PlaceSearch label="Dropoff" value={dropoff} onChange={setDropoff} placeholder="Where are you going?" />
      </div>

      {/* Route summary */}
      {estimate && (
        <div className="flex items-center gap-4 rounded-lg border border-line bg-cream/60 px-4 py-2.5 text-sm">
          <span className="inline-flex items-center gap-1.5 text-slate-ink">
            <Route className="h-4 w-4 text-slate-muted" />
            {formatDistance(estimate.distanceMeters)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-ink">
            <Clock className="h-4 w-4 text-slate-muted" />
            {formatDuration(estimate.durationSeconds)}
          </span>
        </div>
      )}

      {/* Vehicle tier */}
      {(pickup && dropoff) || estimating ? (
        <div>
          <h2 className="sw-kicker mb-2">Choose a ride</h2>
          <TierSelector tiers={estimate?.tiers} value={tier} onChange={setTier} loading={estimating} />
        </div>
      ) : null}

      {/* Payment */}
      {pickup && dropoff && (
        <div>
          <h2 className="sw-kicker mb-2">Payment</h2>
          <PaymentToggle value={paymentMethod} onChange={setPaymentMethod} />
        </div>
      )}

      {/* CTA */}
      <Button
        variant="accent"
        size="lg"
        fullWidth
        icon={ArrowRight}
        disabled={!canRequest}
        loading={loading}
        onClick={onRequest}
      >
        Request Ride
      </Button>
    </div>
  );
}
