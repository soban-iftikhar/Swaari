import { useState } from "react";
import { Loader2 } from "lucide-react";
import Header from "../../Components/Header";
import Navbar from "../../Components/Navbar";
import RideMap from "../../components/rider/RideMap";
import RequestFeed from "../../components/driver/RequestFeed";
import DriverTripPanel from "../../components/driver/DriverTripPanel";
import EarningsBar from "../../components/driver/EarningsBar";
import ChatDrawer from "../../components/rider/ChatDrawer";
import RatingModal from "../../components/rider/RatingModal";
import DashboardCanvas from "../../components/ui/DashboardCanvas";
import useDriverFlow from "../../hooks/useDriverFlow";
import useDriverPresence from "../../hooks/useDriverPresence";
import useRideChat from "../../hooks/useRideChat";
import { useAuth } from "../../context/AuthContext";
import { fullNameOf, coordsOf } from "../../lib/format";

/**
 * Maps a concrete vehicle type to the service tier (mirrors the backend's
 * VEHICLE_TIER_BY_TYPE). The `tier` virtual isn't serialized on the driver
 * profile, so we derive it here for display.
 */
const VEHICLE_TIER_BY_TYPE = {
  bike: "economy",
  rickshaw: "economy",
  mini: "economy",
  sedan: "comfort",
  suv: "executive",
  van: "executive",
};

/**
 * DriverDashboard — the composing shell for the driver workspace, the mirror of
 * RiderDashboard. Orchestrates the driver state machine (useDriverFlow) and
 * presence (useDriverPresence), renders the map + the correct stage panel, and
 * wires chat + post-trip rating.
 *
 * Stages: idle (feed + bidding) → assigned (drive the trip) → completed (rate)
 * The active trip's rideId is fed to presence so location broadcasts tag the
 * trip and relay live to the rider.
 */
export default function DriverDashboard() {
  const { user } = useAuth();
  const flow = useDriverFlow();
  const [chatOpen, setChatOpen] = useState(false);

  const rideId = flow.ride?._id;
  const presence = useDriverPresence({ rideId });
  const chat = useRideChat(rideId, "driver", chatOpen);

  const tier = VEHICLE_TIER_BY_TYPE[user?.vehicle?.type] || "economy";

  // Map coordinates: our own position + (during a trip) the assigned pickup/dropoff.
  // A persisted ride stores endpoints as GeoJSON, so derive lat/lng via coordsOf.
  const self = presence.position;
  const pickup = coordsOf(flow.ride?.pickup);
  const dropoff = coordsOf(flow.ride?.dropoff);

  // Chat drawer title
  const riderName = flow.ride?.rider ? fullNameOf(flow.ride.rider.fullname) || "Your rider" : "Chat";

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Header />

      {flow.restoring ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-muted" />
        </div>
      ) : (
        <DashboardCanvas
          map={<RideMap pickup={pickup} dropoff={dropoff} driver={self} className="h-full w-full" />}
        >
          {flow.stage === "idle" && (
            <div className="flex h-full flex-col gap-4">
              <EarningsBar user={user} />
              <div className="min-h-0 flex-1">
                <RequestFeed
                  online={presence.online}
                  toggling={presence.toggling}
                  tier={tier}
                  geolocationError={presence.geolocationError}
                  onGoOnline={presence.goOnline}
                  onGoOffline={presence.goOffline}
                  requests={flow.requests}
                  myBids={flow.myBids}
                  onBid={flow.placeBid}
                  onWithdraw={flow.withdrawBid}
                  loading={flow.loading}
                />
              </div>
            </div>
          )}

          {flow.stage === "assigned" && (
            <DriverTripPanel
              ride={flow.ride}
              unreadCount={chat.unread}
              onOpenChat={() => setChatOpen(true)}
              onAdvance={flow.advanceStatus}
              onComplete={flow.completeTrip}
              onCancel={flow.cancelRide}
              loading={flow.loading}
            />
          )}

          {flow.stage === "completed" && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-xl font-black text-charcoal">Trip completed!</p>
              <p className="mt-2 text-sm text-slate-muted">
                Rate your rider below or skip to get back online.
              </p>
            </div>
          )}
        </DashboardCanvas>
      )}

      <Navbar
        items={[
          { label: "Home", to: "/driver/dashboard" },
          { label: "History", to: "/driver/history" },
          { label: "Contact", to: "/driver/contact" },
        ]}
      />

      {/* Chat drawer */}
      <ChatDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        title={`Chat with ${riderName}`}
        myRole="driver"
        messages={chat.messages}
        typing={chat.typing}
        onSend={chat.send}
        onTyping={chat.setMyTyping}
      />

      {/* Post-trip rating — keyed by ride id so each trip gets a fresh modal.
          The driver rates their rider (the rider's modal rates the driver). */}
      <RatingModal
        key={rideId || "none"}
        open={flow.stage === "completed"}
        ride={flow.ride}
        counterpart="rider"
        onSubmit={flow.rateRide}
        onSkip={flow.reset}
      />
    </div>
  );
}
