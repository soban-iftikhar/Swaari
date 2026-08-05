import { useEffect, useState } from "react";
import { Star, Check } from "lucide-react";
import StarRating from "../ui/StarRating";
import Button from "../ui/Button";
import { formatCurrency, fullNameOf } from "../../lib/format";

/**
 * RatingModal — post-trip rating shown when the ride reaches the "completed"
 * stage. Centered dialog (not a sheet) so it reads as a wrap-up moment.
 *
 * The rider picks 1–5 stars for their driver; optional compliment chips are a
 * cosmetic nicety that pre-selects a rating. Only the star value is sent to the
 * backend (POST /api/rides/:id/rate accepts `stars` only). Submitting or
 * skipping both clear the flow via the parent (rateRide resets; onSkip resets).
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {object} props.ride - the completed ride (driver, fare, route)
 * @param {(stars:number) => void} props.onSubmit - rateRide(stars)
 * @param {() => void} props.onSkip - dismiss without rating (resets the flow)
 */

const COMPLIMENTS = [
  { label: "Great driving", stars: 5 },
  { label: "Super clean car", stars: 5 },
  { label: "On time", stars: 5 },
  { label: "Friendly", stars: 5 },
];

export default function RatingModal({ open, ride, onSubmit, onSkip }) {
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // State resets naturally per ride: the parent keys this modal by ride id, so a
  // new completed ride remounts with fresh stars/tags. No reset effect needed.

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onSkip?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onSkip]);

  if (!open || !ride) return null;

  const driver = ride.driver || {};
  const driverName = fullNameOf(driver.fullname) || "your driver";

  const toggleTag = (label) => {
    setTags((prev) => (prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label]));
    // Compliment chips imply a top rating unless the rider set one already.
    setStars((s) => (s === 0 ? 5 : s));
  };

  const handleSubmit = () => {
    if (stars < 1) return;
    setSubmitting(true);
    onSubmit(stars);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sw-animate-fade-in" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-charcoal/50" aria-hidden="true" />

      <div
        className="relative w-full max-w-sm rounded-2xl border border-line bg-paper p-6 text-center sw-animate-scale-in"
        style={{ boxShadow: "var(--shadow-pop)" }}
      >
        {/* Driver avatar */}
        <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-charcoal text-2xl font-bold text-paper">
          {(driver.fullname?.firstname || "D").charAt(0).toUpperCase()}
        </span>

        <h2 className="mt-3 text-xl font-black text-charcoal">Rate your trip</h2>
        <p className="mt-1 text-sm text-slate-muted">
          How was your ride with {driverName}?
        </p>

        {/* Trip recap */}
        <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-cream px-3 py-2 text-sm">
          <span className="font-bold text-charcoal">{formatCurrency(ride.fare ?? ride.fareEstimate)}</span>
          <span className="text-slate-faint">·</span>
          <span className="capitalize text-slate-muted">{ride.paymentMethod}</span>
        </div>

        {/* Stars */}
        <div className="mt-5 flex justify-center">
          <StarRating value={stars} onChange={setStars} size={36} />
        </div>

        {/* Compliment chips (appear once a rating is chosen) */}
        {stars >= 4 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {COMPLIMENTS.map((c) => {
              const on = tags.includes(c.label);
              return (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => toggleTag(c.label)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    on
                      ? "border-amber bg-amber-050 text-amber-600"
                      : "border-line-strong bg-paper text-slate-muted hover:bg-cream"
                  }`}
                >
                  {on && <Check className="h-3 w-3" />}
                  {c.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 space-y-2">
          <Button
            variant="accent"
            fullWidth
            icon={Star}
            onClick={handleSubmit}
            disabled={stars < 1}
            loading={submitting}
          >
            Submit rating
          </Button>
          <Button variant="ghost" fullWidth onClick={onSkip} disabled={submitting}>
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}
