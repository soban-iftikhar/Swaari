/**
 * Avatar — the canonical identity chip: initials on a solid charcoal disc with
 * an optional accent ring. Replaces the ad-hoc "letter in a charcoal circle"
 * repeated across OfferCard, RequestCard, ActiveRidePanel, DriverTripPanel and
 * RatingModal, so every person renders consistently.
 *
 * @param {object} props
 * @param {string} [props.name] - full name; initials are derived from it
 * @param {string} [props.fallback='U'] - char used when no name is present
 * @param {'sm'|'md'|'lg'|'xl'} [props.size='md']
 * @param {'none'|'amber'|'emerald'|'charcoal'} [props.ring='none'] - tier/role accent ring
 * @param {string} [props.className]
 */
const SIZE_CLASS = {
  sm: "h-9 w-9 text-sm",
  md: "h-11 w-11 text-base",
  lg: "h-12 w-12 text-lg",
  xl: "h-16 w-16 text-2xl",
};

const RING_CLASS = {
  none: "",
  amber: "ring-2 ring-amber ring-offset-2 ring-offset-paper",
  emerald: "ring-2 ring-emerald ring-offset-2 ring-offset-paper",
  charcoal: "ring-2 ring-charcoal ring-offset-2 ring-offset-paper",
};

/** First letters of the first (and last, if any) name token, upper-cased. */
function initialsOf(name, fallback) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback.charAt(0).toUpperCase();
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function Avatar({ name, fallback = "U", size = "md", ring = "none", className = "" }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-charcoal font-bold text-paper ${
        SIZE_CLASS[size] || SIZE_CLASS.md
      } ${RING_CLASS[ring] || ""} ${className}`}
      aria-hidden="true"
    >
      {initialsOf(name, fallback)}
    </span>
  );
}
