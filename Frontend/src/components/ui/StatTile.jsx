/**
 * StatTile — a compact KPI block (label + value + optional icon/delta).
 * Used on the driver analytics dashboard and ride summaries.
 *
 * @param {object} props
 * @param {string} props.label
 * @param {string|number} props.value
 * @param {React.ComponentType} [props.icon]
 * @param {'amber'|'emerald'|'neutral'} [props.tone='neutral']
 * @param {string} [props.sub] - small caption under the value
 */
const ICON_TONE = {
  amber: "bg-amber-050 text-amber-600",
  emerald: "bg-emerald-050 text-emerald-600",
  neutral: "bg-cream text-slate-ink",
};

export default function StatTile({ label, value, icon: Icon, tone = "neutral", sub }) {
  return (
    <div className="sw-card p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-muted">{label}</span>
        {Icon && (
          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${ICON_TONE[tone]}`}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-bold text-charcoal">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-muted">{sub}</div>}
    </div>
  );
}
