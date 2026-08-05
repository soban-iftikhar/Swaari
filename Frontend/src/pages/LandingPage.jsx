import { useState } from "react";
import { ArrowRight, MapPin, Shield, Zap, Star, DollarSign, Users } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import { formatCurrency, formatDistance, formatDuration } from "../lib/format";
import api from "../lib/api";
import toast from "react-hot-toast";

/**
 * LandingPage — the public marketing entry point.
 *
 * Long-scroll, conversion-focused design: hero + instant fare calculator, how it
 * works (riders/drivers), safety/features grid, driver earnings tool, and footer.
 * All sections use the solid design tokens (no gradients, no decorative blur).
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      <HeroSection />
      <FareCalculatorSection />
      <HowItWorksSection />
      <FeaturesSection />
      <DriverEarningsSection />
      <Footer />
    </div>
  );
}

/** Hero: headline + dual CTA (Book a Ride / Drive with Us) */
function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-line bg-paper px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl text-center">
        <h1 className="text-5xl font-black leading-tight text-charcoal sm:text-6xl md:text-7xl">
          Your ride, <br className="sm:hidden" />
          <span className="text-amber">your fare</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-muted sm:text-xl">
          Request a ride and let drivers compete for your trip. Transparent bidding means
          you're always in control — accept the offer that works for you.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button as={Link} to="/get-started" variant="accent" size="lg" icon={ArrowRight}>
            Book a Ride
          </Button>
          <Button as={Link} to="/get-started" variant="outline" size="lg">
            Drive with Us
          </Button>
        </div>
      </div>
    </section>
  );
}

/** Fare calculator — live estimate via the /rides/estimate API */
function FareCalculatorSection() {
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleEstimate = async () => {
    if (!pickup.trim() || !dropoff.trim()) {
      toast.error("Enter both pickup and dropoff locations");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      // Mock coordinates for demo — real app would geocode the addresses.
      const res = await api.post("/api/rides/estimate", {
        pickup: { lat: 31.5497, lng: 74.3436 }, // Lahore placeholder
        dropoff: { lat: 31.5204, lng: 74.3587 },
      });
      setResult(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="border-b border-line px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl font-bold text-charcoal sm:text-4xl">
          Estimate Your Fare
        </h2>
        <p className="mt-3 text-center text-slate-muted">
          No surprises — see the cost before you ride.
        </p>
        <Card className="mt-8">
          <div className="flex flex-col gap-4">
            <Input
              icon={MapPin}
              placeholder="Pickup location"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
            />
            <Input
              icon={MapPin}
              placeholder="Dropoff location"
              value={dropoff}
              onChange={(e) => setDropoff(e.target.value)}
            />
            <Button onClick={handleEstimate} loading={loading} fullWidth>
              Get Estimate
            </Button>
          </div>
          {result && (
            <div className="mt-6 space-y-3 border-t border-line pt-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-muted">Distance</span>
                <span className="font-semibold text-charcoal">
                  {formatDistance(result.distanceMeters)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-muted">Duration</span>
                <span className="font-semibold text-charcoal">
                  {formatDuration(result.durationSeconds)}
                </span>
              </div>
              <div className="mt-4 space-y-2">
                {result.tiers.map((t) => (
                  <div key={t.tier} className="flex items-center justify-between rounded-lg border border-line bg-cream/50 px-4 py-3">
                    <span className="font-medium text-charcoal">{t.label}</span>
                    <span className="text-lg font-bold text-amber">{formatCurrency(t.fare)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}

/** How It Works — dual-track visual (Riders / Drivers) */
function HowItWorksSection() {
  return (
    <section className="border-b border-line px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold text-charcoal sm:text-4xl">
          How Swaari Works
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          <Card>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-050">
              <Users className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="mt-4 text-xl font-bold text-charcoal">For Riders</h3>
            <ol className="mt-4 space-y-3 text-sm text-slate-ink">
              <li className="flex gap-2">
                <span className="font-bold text-amber">1.</span>
                <span>Enter your pickup and dropoff — we show the estimated fare</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-amber">2.</span>
                <span>Nearby drivers see your request and send offers</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-amber">3.</span>
                <span>Review bids (price, ETA, rating) and accept your favorite</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-amber">4.</span>
                <span>Track your driver live, chat in-app, and pay when you arrive</span>
              </li>
            </ol>
          </Card>
          <Card>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-050">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="mt-4 text-xl font-bold text-charcoal">For Drivers</h3>
            <ol className="mt-4 space-y-3 text-sm text-slate-ink">
              <li className="flex gap-2">
                <span className="font-bold text-emerald">1.</span>
                <span>Go online — nearby trip requests appear in your feed</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-emerald">2.</span>
                <span>Bid your price or accept the standard fare instantly</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-emerald">3.</span>
                <span>Rider accepts your offer — navigate to pickup</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-emerald">4.</span>
                <span>Complete the trip, get rated, and keep more of what you earn</span>
              </li>
            </ol>
          </Card>
        </div>
      </div>
    </section>
  );
}

/** Features / Safety grid */
function FeaturesSection() {
  // Full class strings (not interpolated) so Tailwind's scanner keeps them.
  const TONE_CLASS = {
    amber: "bg-amber-050 text-amber-600",
    emerald: "bg-emerald-050 text-emerald-600",
  };
  const features = [
    {
      icon: Zap,
      title: "Fast Matching",
      desc: "Drivers near you get notified in seconds. Most rides are matched in under 2 minutes.",
      tone: "amber",
    },
    {
      icon: Shield,
      title: "Verified Drivers",
      desc: "All drivers pass background checks. Live GPS and in-app chat keep you connected.",
      tone: "emerald",
    },
    {
      icon: DollarSign,
      title: "Transparent Bidding",
      desc: "See every offer up front. Accept the fare that fits your budget — no surge surprises.",
      tone: "amber",
    },
    {
      icon: Star,
      title: "Two-Way Ratings",
      desc: "Riders and drivers rate each other. Quality is rewarded; accountability is built in.",
      tone: "emerald",
    },
  ];

  return (
    <section className="border-b border-line px-6 py-16 bg-paper">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold text-charcoal sm:text-4xl">
          Built for Safety & Trust
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} padded={false} className="p-5 text-center">
              <div className={`mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full ${TONE_CLASS[f.tone]}`}>
                <f.icon className="h-7 w-7" />
              </div>
              <h4 className="mt-4 font-bold text-charcoal">{f.title}</h4>
              <p className="mt-2 text-sm text-slate-muted">{f.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Driver earnings projection tool */
function DriverEarningsSection() {
  const [hours, setHours] = useState(40);
  const avgPerTrip = 300; // PKR baseline
  const tripsPerHour = 2.5;
  const weeklyTrips = Math.round(hours * tripsPerHour);
  const weeklyEarnings = weeklyTrips * avgPerTrip;

  return (
    <section className="border-b border-line px-6 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold text-charcoal sm:text-4xl">
          Drive. Earn. Repeat.
        </h2>
        <p className="mt-3 text-slate-muted">
          Set your own hours. Keep more of what you make.
        </p>
        <Card className="mt-8">
          <label className="block text-sm font-semibold text-charcoal">
            Weekly hours on the road
          </label>
          <input
            type="range"
            min="10"
            max="70"
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="mt-3 w-full"
          />
          <div className="mt-2 text-2xl font-bold text-amber">{hours} hours</div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-cream/50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-muted">
                Est. Weekly Trips
              </div>
              <div className="mt-1 text-2xl font-bold text-charcoal">{weeklyTrips}</div>
            </div>
            <div className="rounded-lg border border-line bg-amber-050 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                Est. Weekly Earnings
              </div>
              <div className="mt-1 text-2xl font-bold text-charcoal">
                {formatCurrency(weeklyEarnings)}
              </div>
            </div>
          </div>
          <Button as={Link} to="/get-started" variant="go" fullWidth className="mt-6">
            Start Driving Today
          </Button>
        </Card>
      </div>
    </section>
  );
}

/** Footer */
function Footer() {
  return (
    <footer className="bg-charcoal px-6 py-12 text-paper">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <h3 className="text-2xl font-black">Swaari</h3>
            <p className="mt-2 text-sm text-slate-faint">
              Transparent ride-hailing. Competitive fares. Your city, your way.
            </p>
          </div>
          <div>
            <h4 className="font-bold">Riders</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-faint">
              <li>
                <Link to="/rider/signup" className="hover:text-amber">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link to="/rider/login" className="hover:text-amber">
                  Log In
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold">Drivers</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-faint">
              <li>
                <Link to="/driver/signup" className="hover:text-amber">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link to="/driver/login" className="hover:text-amber">
                  Log In
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-charcoal-700 pt-6 text-center text-xs text-slate-faint">
          © {new Date().getFullYear()} Swaari. Built with transparency.
        </div>
      </div>
    </footer>
  );
}
