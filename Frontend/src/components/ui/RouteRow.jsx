/**
 * RouteRow — the canonical pickup → dropoff display. One component, used
 * everywhere a trip route is shown (ActiveRidePanel, DriverTripPanel,
 * RequestCard), replacing three near-identical local reimplementations.
 *
 * A left rail carries an amber pickup node, the solid `sw-route-connector`
 * segment, and a charcoal dropoff node; the right column carries the captions
 * and addresses. Accepts either a plain address string or a ride "place"
 * (`{ address }`) for each end.
 *
 * @param {object} props
 * @param {string|{address?:string}} [props.pickup]
 * @param {string|{address?:string}} [props.dropoff]
 * @param {string} [props.className]
 */
const addressOf = (place) => (typeof place === "string" ? place : place?.address) || "—";

export default function RouteRow({ pickup, dropoff, className = "" }) {
  return (
    <div className={`flex ${className}`}>
      {/* Node rail */}
      <div className="mr-3 flex flex-col items-center pt-1">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber ring-2 ring-amber-050" />
        <span className="sw-route-connector my-1 flex-1" />
        <span className="mb-1 h-2.5 w-2.5 shrink-0 rounded-sm bg-charcoal" />
      </div>

      {/* Labels */}
      <div className="min-w-0 flex-1 space-y-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-faint">Pickup</p>
          <p className="truncate text-sm text-charcoal">{addressOf(pickup)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-faint">Dropoff</p>
          <p className="truncate text-sm text-charcoal">{addressOf(dropoff)}</p>
        </div>
      </div>
    </div>
  );
}
