import { Inbox, PowerOff, Loader2 } from "lucide-react";
import OnlineToggle from "./OnlineToggle";
import RequestCard from "./RequestCard";
import EmptyState from "../ui/EmptyState";

/**
 * RequestFeed — the driver's idle-stage panel: the online switch plus the live
 * feed of open ride requests to bid on. The mirror of the rider's SearchingPanel.
 *
 * Gated by presence: while offline, the feed is hidden behind a prompt to go
 * online. While online with no requests yet, it shows a "listening" empty state.
 *
 * @param {object} props
 * @param {boolean} props.online
 * @param {boolean} [props.toggling]
 * @param {string} [props.vehicleType]
 * @param {string} [props.geolocationError]
 * @param {() => void} props.onGoOnline
 * @param {() => void} props.onGoOffline
 * @param {Array} props.requests - open ride requests
 * @param {Object} props.myBids - rideId → the driver's pending bid
 * @param {(rideId:string, bid:object) => Promise<boolean>} props.onBid
 * @param {(rideId:string) => Promise<boolean>} props.onWithdraw
 * @param {boolean} [props.loading] - a bid/withdraw is in flight
 */
export default function RequestFeed({
  online,
  toggling,
  vehicleType,
  geolocationError,
  onGoOnline,
  onGoOffline,
  requests,
  myBids,
  onBid,
  onWithdraw,
  loading,
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Presence toggle */}
      <div className="border-b border-line pb-4">
        <OnlineToggle
          online={online}
          toggling={toggling}
          vehicleType={vehicleType}
          geolocationError={geolocationError}
          onGoOnline={onGoOnline}
          onGoOffline={onGoOffline}
        />
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto py-4">
        {!online ? (
          <EmptyState
            icon={PowerOff}
            title="You're offline"
            body="Go online to start receiving ride requests from riders near you."
          />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={Inbox}
            tone="emerald"
            pulse
            body="You're online and listening. New ride requests nearby will appear here instantly."
          >
            <Loader2 className="h-5 w-5 animate-spin text-slate-faint" />
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-3 sw-stagger">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-muted">
              {requests.length} open request{requests.length > 1 ? "s" : ""}
            </p>
            {requests.map((req) => (
              <RequestCard
                key={req._id}
                request={req}
                myBid={myBids[String(req._id)]}
                onBid={onBid}
                onWithdraw={onWithdraw}
                busy={loading}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
