import { useState } from "react";
import { Loader2 } from "lucide-react";
import Header from "../../Components/Header";
import Navbar from "../../Components/Navbar";
import RideMap from "../../components/rider/RideMap";
import BookingPanel from "../../components/rider/BookingPanel";
import SearchingPanel from "../../components/rider/SearchingPanel";
import ActiveRidePanel from "../../components/rider/ActiveRidePanel";
import ChatDrawer from "../../components/rider/ChatDrawer";
import RatingModal from "../../components/rider/RatingModal";
import useRideFlow from "../../hooks/useRideFlow";
import useRideChat from "../../hooks/useRideChat";
import { fullNameOf } from "../../lib/format";

/**
 * RiderDashboard — the composing shell for the entire rider booking and tracking
 * experience. Orchestrates the state machine (useRideFlow), renders the map +
 * the correct stage panel, and wires chat and post-trip rating.
 *
 * Stages: booking → searching → active → completed
 * The map shows pickup/dropoff/driver; panels are pure presentational.
 */
export default function RiderDashboard() {
  const flow = useRideFlow();
  const [chatOpen, setChatOpen] = useState(false);

  const chat = useRideChat(flow.ride?._id, "rider", chatOpen);

  // Map coordinates
  const pickup = flow.pickup ? { lat: flow.pickup.lat, lng: flow.pickup.lng } : null;
  const dropoff = flow.dropoff ? { lat: flow.dropoff.lat, lng: flow.dropoff.lng } : null;
  const driver = flow.driverCoords;

  // Chat drawer title
  const driverName = flow.ride?.driver
    ? fullNameOf(flow.ride.driver.fullname) || "Your driver"
    : "Chat";

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Header />

      {flow.restoring ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-muted" />
        </div>
      ) : (
        <div className="relative flex flex-1">
          {/* Map (left/top) */}
          <div className="relative h-[40vh] w-full sm:h-auto sm:w-3/5 lg:w-2/3">
            <RideMap pickup={pickup} dropoff={dropoff} driver={driver} className="h-full w-full" />
          </div>

          {/* Stage panel (right/bottom) */}
          <div className="w-full overflow-y-auto border-t border-line bg-paper p-5 sm:w-2/5 sm:border-l sm:border-t-0 lg:w-1/3">
            {flow.stage === "booking" && (
              <BookingPanel
                pickup={flow.pickup}
                setPickup={flow.setPickup}
                dropoff={flow.dropoff}
                setDropoff={flow.setDropoff}
                tier={flow.tier}
                setTier={flow.setTier}
                paymentMethod={flow.paymentMethod}
                setPaymentMethod={flow.setPaymentMethod}
                estimate={flow.estimate}
                estimating={flow.estimating}
                loading={flow.loading}
                onRequest={flow.requestRide}
              />
            )}

            {flow.stage === "searching" && (
              <SearchingPanel
                ride={flow.ride}
                bids={flow.bids}
                onAccept={flow.acceptBid}
                onReject={flow.rejectBid}
                onCancel={flow.cancelRide}
                loading={flow.loading}
              />
            )}

            {flow.stage === "active" && (
              <ActiveRidePanel
                ride={flow.ride}
                unreadCount={chat.unread}
                onOpenChat={() => setChatOpen(true)}
                onCancel={flow.cancelRide}
                loading={flow.loading}
              />
            )}

            {flow.stage === "completed" && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-xl font-black text-charcoal">Trip completed!</p>
                <p className="mt-2 text-sm text-slate-muted">
                  Rate your driver below or skip to book another ride.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <Navbar
        items={[
          { label: "Home", to: "/rider/dashboard" },
          { label: "History", to: "/rider/history" },
          { label: "Contact", to: "/rider/contact" },
        ]}
      />

      {/* Chat drawer */}
      <ChatDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        title={`Chat with ${driverName}`}
        myRole="rider"
        messages={chat.messages}
        typing={chat.typing}
        onSend={chat.send}
        onTyping={chat.setMyTyping}
      />

      {/* Post-trip rating — keyed by ride id so each trip gets a fresh modal */}
      <RatingModal
        key={flow.ride?._id || "none"}
        open={flow.stage === "completed"}
        ride={flow.ride}
        onSubmit={flow.rateRide}
        onSkip={flow.reset}
      />
    </div>
  );
}

