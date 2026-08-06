import { Power, Wifi, WifiOff } from "lucide-react";
import Button from "../ui/Button";

/**
 * OnlineToggle — the driver's go-online / go-offline switch.
 *
 * When online, the driver's location streams live and open requests appear in
 * the feed. When offline, the feed is gated. Shows the driver's service tier and
 * surfaces any geolocation error that would block going online.
 *
 * @param {object} props
 * @param {boolean} props.online
 * @param {boolean} [props.toggling] - a go online/offline call is in flight
 * @param {string} [props.tier] - service tier ("economy" | "comfort" | "executive")
 * @param {string} [props.geolocationError] - blocks going online when present
 * @param {() => void} props.onGoOnline
 * @param {() => void} props.onGoOffline
 */
export default function OnlineToggle({
  online,
  toggling,
  tier,
  geolocationError,
  onGoOnline,
  onGoOffline,
}) {
  return (
    <div className={`sw-card p-4 ${online ? "border-emerald" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${
              online ? "bg-emerald-050 text-emerald-600" : "bg-cream text-slate-faint"
            }`}
          >
            {online ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
          </span>
          <div>
            <p className="font-bold text-charcoal">{online ? "You're online" : "You're offline"}</p>
            <p className="text-xs text-slate-muted">
              {online ? "Receiving nearby ride requests" : "Go online to start earning"}
              {tier && (
                <>
                  {" · "}
                  <span className="capitalize">{tier}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <Button
          variant={online ? "outline" : "go"}
          icon={Power}
          onClick={online ? onGoOffline : onGoOnline}
          loading={toggling}
          disabled={!online && !!geolocationError}
        >
          {online ? "Go offline" : "Go online"}
        </Button>
      </div>

      {!online && geolocationError && (
        <p className="mt-3 rounded-lg bg-danger-050 px-3 py-2 text-xs font-medium text-danger">
          {geolocationError} — enable location access to go online.
        </p>
      )}
    </div>
  );
}
