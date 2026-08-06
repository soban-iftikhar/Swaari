import { Phone, MessageSquare, X, Star, Navigation, Flag, CheckCircle2 } from "lucide-react";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";
import RouteRow from "../ui/RouteRow";
import { formatCurrency, formatDistance, formatDuration, fullNameOf } from "../../lib/format";
import toast from "react-hot-toast";

/**
 * DriverTripPanel — the assigned-stage workspace, the driver's mirror of the
 * rider's ActiveRidePanel.
 *
 * GPS geofencing drives the lifecycle automatically off the driver's live
 * location stream: accepted → arriving (on the first ping) → arrived (near the
 * pickup) → [driver taps Start trip once] → ongoing → completed (near the
 * dropoff). The only human confirmation is the single "Start trip" tap. The
 * small "Mark arrived" / "Complete trip" buttons are override fallbacks for when
 * GPS can't advance the trip on its own (e.g. localhost, denied location).
 * Plus chat, a demo call button, and cancel (allowed until the trip starts).
 *
 * @param {object} props
 * @param {object} props.ride - the assigned ride (driver view)
 * @param {number} [props.unreadCount] - unread chat badge
 * @param {() => void} props.onOpenChat
 * @param {(next:string) => Promise<boolean>} props.onAdvance
 * @param {() => Promise<boolean>} props.onComplete
 * @param {(reason?:string) => void} props.onCancel
 * @param {boolean} [props.loading]
 */

const STATUS_META = {
  accepted: { label: "Ride assigned", hint: "Heading to the pickup — starting navigation.", tone: "amber" },
  arriving: { label: "En route to pickup", hint: "Driving to the rider's pickup point.", tone: "amber" },
  arrived: { label: "At pickup", hint: "You've arrived. Tap Start trip once the rider is in.", tone: "emerald" },
  ongoing: { label: "Trip in progress", hint: "Drive safely to the dropoff.", tone: "emerald" },
};

export default function DriverTripPanel({
  ride,
  unreadCount = 0,
  onOpenChat,
  onAdvance,
  onComplete,
  onCancel,
  loading,
}) {
  const rider = ride.rider || {};
  const meta = STATUS_META[ride.status] || STATUS_META.accepted;
  const canCancel = ride.status !== "ongoing";

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
        {/* Rider card */}
        <div className="rounded-xl border border-line bg-paper p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar name={fullNameOf(rider.fullname)} fallback="R" size="lg" ring="amber" />
              <div>
                <p className="font-bold text-charcoal">{fullNameOf(rider.fullname) || "Your rider"}</p>
                <span className="inline-flex items-center gap-1 text-xs text-slate-muted">
                  <Star className="h-3 w-3 fill-amber text-amber" />
                  {(rider.rating?.average ?? 5).toFixed(1)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-charcoal">{formatCurrency(ride.fare ?? ride.fareEstimate)}</p>
              <p className="text-xs capitalize text-slate-muted">{ride.paymentMethod}</p>
            </div>
          </div>

          {/* Contact actions */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Phone}
              onClick={() => toast("Calling is a demo in this build", { icon: "📞" })}
            >
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

        {/* Trip route + meta */}
        <RouteRow pickup={ride.pickup} dropoff={ride.dropoff} />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-muted">
          <span>{formatDistance(ride.distanceMeters)}</span>
          <span>{formatDuration(ride.durationSeconds)}</span>
          <span className="capitalize">{ride.vehicleType}</span>
        </div>
      </div>

      {/* Lifecycle CTA + cancel */}
      <div className="space-y-2 border-t border-line pt-3">
        {/* Primary action: the single Start-trip confirmation once the rider boards. */}
        {ride.status === "arrived" && (
          <Button variant="go" fullWidth icon={Navigation} onClick={() => onAdvance("ongoing")} loading={loading}>
            Start trip
          </Button>
        )}

        {/* Secondary overrides — GPS advances these automatically; the buttons are
            a manual fallback for when it can't (localhost, denied location). */}
        {ride.status === "arriving" && (
          <Button variant="outline" fullWidth icon={Flag} onClick={() => onAdvance("arrived")} loading={loading}>
            Mark arrived
          </Button>
        )}
        {ride.status === "ongoing" && (
          <Button variant="go" fullWidth icon={CheckCircle2} onClick={onComplete} loading={loading}>
            Complete trip
          </Button>
        )}

        {canCancel && (
          <Button
            variant="ghost"
            fullWidth
            icon={X}
            onClick={() => onCancel("Driver cancelled the ride")}
            disabled={loading}
          >
            Cancel ride
          </Button>
        )}
      </div>
    </div>
  );
}
