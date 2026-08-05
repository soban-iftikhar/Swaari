import { Phone, MessageSquare, ShieldAlert, X, Star, Navigation, KeyRound } from "lucide-react";
import Button from "../ui/Button";
import { formatCurrency, fullNameOf } from "../../lib/format";
import toast from "react-hot-toast";

/**
 * ActiveRidePanel — the tracking stage once a driver is assigned.
 *
 * Shows the live ride status, the assigned driver + vehicle, the pickup OTP the
 * rider shares to start the trip, and the trip actions (chat, call, SOS, cancel).
 * Status advances in real time via socket updates handled upstream.
 *
 * @param {object} props
 * @param {object} props.ride - the active ride (rider view, includes otp)
 * @param {number} [props.unreadCount] - unread chat messages badge
 * @param {() => void} props.onOpenChat
 * @param {(reason?:string) => void} props.onCancel
 * @param {boolean} [props.loading]
 */

const STATUS_META = {
  accepted: { label: "Driver assigned", hint: "Your driver is getting ready.", tone: "amber" },
  arriving: { label: "On the way", hint: "Your driver is heading to your pickup.", tone: "amber" },
  arrived: { label: "Driver has arrived", hint: "Share your pickup code to start.", tone: "emerald" },
  ongoing: { label: "On your trip", hint: "Enjoy the ride — sit back and relax.", tone: "emerald" },
};

export default function ActiveRidePanel({ ride, unreadCount = 0, onOpenChat, onCancel, loading }) {
  const driver = ride.driver || {};
  const vehicle = driver.vehicle || {};
  const meta = STATUS_META[ride.status] || STATUS_META.accepted;
  const canCancel = ride.status !== "ongoing";
  const showOtp = ["accepted", "arriving", "arrived"].includes(ride.status);

  return (
    <div className="flex h-full flex-col">
      {/* Status header */}
      <div className="border-b border-line pb-4">
        <span className={`sw-chip ${meta.tone === "emerald" ? "sw-chip-emerald" : "sw-chip-amber"}`}>
          <Navigation className="h-3.5 w-3.5" />
          {meta.label}
        </span>
        <p className="mt-2 text-sm text-slate-muted">{meta.hint}</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto py-4">
        {/* Pickup OTP */}
        {showOtp && ride.otp && (
          <div className="rounded-xl border-2 border-dashed border-amber bg-amber-050 p-4 text-center">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-600">
              <KeyRound className="h-3.5 w-3.5" />
              Pickup code
            </p>
            <p className="mt-1 text-4xl font-black tracking-[0.3em] text-charcoal">{ride.otp}</p>
            <p className="mt-1 text-xs text-slate-muted">Share this with your driver to start the trip.</p>
          </div>
        )}

        {/* Driver card */}
        <div className="rounded-xl border border-line bg-paper p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-charcoal text-lg font-bold text-paper">
                {(driver.fullname?.firstname || "D").charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="font-bold text-charcoal">{fullNameOf(driver.fullname) || "Your driver"}</p>
                <span className="inline-flex items-center gap-1 text-xs text-slate-muted">
                  <Star className="h-3 w-3 fill-amber text-amber" />
                  {(driver.rating?.average ?? 5).toFixed(1)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-charcoal">{formatCurrency(ride.fare ?? ride.fareEstimate)}</p>
              <p className="text-xs capitalize text-slate-muted">{ride.paymentMethod}</p>
            </div>
          </div>

          {/* Vehicle */}
          {vehicle.make && (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-cream px-3 py-2 text-sm">
              <span className="capitalize text-slate-ink">
                {vehicle.color} {vehicle.make} · <span className="capitalize">{vehicle.type}</span>
              </span>
              {vehicle.licensePlate && (
                <span className="rounded border border-line-strong bg-paper px-2 py-0.5 font-mono text-xs font-bold tracking-wider text-charcoal">
                  {vehicle.licensePlate}
                </span>
              )}
            </div>
          )}

          {/* Contact actions */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" icon={Phone} onClick={() => toast("Calling is a demo in this build", { icon: "📞" })}>
              Call
            </Button>
            <Button variant="primary" size="sm" icon={MessageSquare} onClick={onOpenChat} className="relative">
              Chat
              {unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-paper">
                  {unreadCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Trip route */}
        <div className="space-y-2">
          <RouteRow color="bg-amber" label={ride.pickup?.address} caption="Pickup" />
          <RouteRow color="bg-charcoal" label={ride.dropoff?.address} caption="Dropoff" />
        </div>
      </div>

      {/* Safety + cancel */}
      <div className="space-y-2 border-t border-line pt-3">
        <Button
          variant="danger"
          fullWidth
          icon={ShieldAlert}
          onClick={() => toast("Emergency services would be contacted here", { icon: "🚨" })}
        >
          Emergency (SOS)
        </Button>
        {canCancel && (
          <Button
            variant="ghost"
            fullWidth
            icon={X}
            onClick={() => onCancel("Rider cancelled the ride")}
            disabled={loading}
          >
            Cancel ride
          </Button>
        )}
      </div>
    </div>
  );
}

/** A pickup/dropoff row with a colored node. */
function RouteRow({ color, label, caption }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-faint">{caption}</p>
        <p className="truncate text-sm text-charcoal">{label || "—"}</p>
      </div>
    </div>
  );
}
