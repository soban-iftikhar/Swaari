import { Users } from "lucide-react";
import { TIER_ICON } from "../../lib/icons";
import { formatCurrency } from "../../lib/format";

/**
 * TierSelector — vehicle tier cards (economy / comfort / executive) with live
 * per-tier fares. Selection is a solid amber-outlined card; no gradients.
 *
 * @param {object} props
 * @param {Array<{tier:string,label:string,fare:number}>} props.tiers - from the estimate API
 * @param {string} props.value - selected tier key
 * @param {(tier:string) => void} props.onChange
 * @param {boolean} [props.loading] - estimate in flight (show skeleton fares)
 */

const TIER_META = {
  economy: { icon: TIER_ICON.economy, desc: "Affordable everyday rides", seats: 4 },
  comfort: { icon: TIER_ICON.comfort, desc: "Newer cars, more room", seats: 4 },
  executive: { icon: TIER_ICON.executive, desc: "Premium vehicles", seats: 4 },
};

const ORDER = ["economy", "comfort", "executive"];

export default function TierSelector({ tiers, value, onChange, loading }) {
  // Index fares by tier for quick lookup; fall back to label-only cards.
  const fareByTier = Object.fromEntries((tiers || []).map((t) => [t.tier, t]));

  return (
    <div className="flex flex-col gap-2">
      {ORDER.map((key) => {
        const meta = TIER_META[key];
        const info = fareByTier[key];
        const Icon = meta.icon;
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
                <span className="font-bold text-charcoal capitalize">{info?.label || key}</span>
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
