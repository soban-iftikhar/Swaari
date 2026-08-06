import { Users } from "lucide-react";
import { VEHICLE_ICON } from "../../lib/icons";
import { formatCurrency } from "../../lib/format";

/**
 * VehicleSelector — concrete vehicle-type cards (bike · rickshaw · mini · car ·
 * SUV · van) with live per-type fares. Selection is a solid amber-outlined card;
 * no gradients. The keys mirror the backend VEHICLE_PRICING types.
 *
 * @param {object} props
 * @param {Array<{type:string,label:string,fare:number}>} props.options - from the estimate API
 * @param {string} props.value - selected vehicle type key
 * @param {(type:string) => void} props.onChange
 * @param {boolean} [props.loading] - estimate in flight (show skeleton fares)
 */

const VEHICLE_META = {
  bike: { desc: "Quick & wallet-friendly", seats: 1 },
  rickshaw: { desc: "Breezy tuk-tuk hops", seats: 3 },
  mini: { desc: "Compact city rides", seats: 4 },
  sedan: { desc: "Comfortable car rides", seats: 4 },
  suv: { desc: "Extra room & comfort", seats: 6 },
  van: { desc: "Groups & luggage", seats: 10 },
};

const ORDER = ["bike", "rickshaw", "mini", "sedan", "suv", "van"];

export default function VehicleSelector({ options, value, onChange, loading }) {
  // Index fares by vehicle type for quick lookup; fall back to label-only cards.
  const fareByType = Object.fromEntries((options || []).map((o) => [o.type, o]));

  return (
    <div className="flex flex-col gap-2">
      {ORDER.map((key) => {
        const meta = VEHICLE_META[key];
        const info = fareByType[key];
        const Icon = VEHICLE_ICON[key];
        const selected = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition ${
              selected
                ? "border-amber bg-amber-050"
                : "border-line bg-paper hover:border-line-strong"
            }`}
          >
            <span
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                selected ? "bg-amber text-charcoal" : "bg-cream text-slate-ink"
              }`}
            >
              <Icon className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold capitalize text-charcoal">{info?.label || key}</span>
                <span className="inline-flex items-center gap-0.5 text-xs text-slate-muted">
                  <Users className="h-3 w-3" />
                  {meta.seats}
                </span>
              </div>
              <p className="truncate text-xs text-slate-muted">{meta.desc}</p>
            </div>
            <div className="shrink-0 text-right">
              {loading ? (
                <span className="inline-block h-5 w-16 animate-pulse rounded bg-line" />
              ) : info ? (
                <span className="text-lg font-bold text-charcoal">{formatCurrency(info.fare)}</span>
              ) : (
                <span className="text-sm text-slate-faint">—</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
