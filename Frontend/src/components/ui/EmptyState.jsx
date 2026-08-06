/**
 * EmptyState — the canonical idle / empty / listening state. One styled
 * treatment for RequestFeed (offline + listening) and SearchingPanel (waiting
 * for offers), replacing the duplicated "icon-in-a-tinted-circle + paragraph".
 *
 * The mark is a squared, ringed tile rather than the generic soft circle; when
 * `pulse` is set an amber/emerald ping radiates behind it to read as "live and
 * listening" — the distinctive touch these live states earn.
 *
 * @param {object} props
 * @param {React.ComponentType} props.icon
 * @param {string} [props.title]
 * @param {string} props.body
 * @param {'neutral'|'amber'|'emerald'} [props.tone='neutral']
 * @param {boolean} [props.pulse] - radiate a ping ring behind the tile (live states)
 * @param {React.ReactNode} [props.children] - optional footer (e.g. a spinner)
 * @param {string} [props.className]
 */
const TONE = {
  neutral: { tile: "bg-cream text-slate-ink", ring: "ring-line", ping: "bg-slate-faint" },
  amber: { tile: "bg-amber-050 text-amber-600", ring: "ring-amber", ping: "bg-amber" },
  emerald: { tile: "bg-emerald-050 text-emerald-600", ring: "ring-emerald", ping: "bg-emerald" },
};

export default function EmptyState({
  icon: Icon,
  title,
  body,
  tone = "neutral",
  pulse = false,
  children,
  className = "",
}) {
  const t = TONE[tone] || TONE.neutral;
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-10 text-center ${className}`}>
      <span className="relative inline-flex">
        {pulse && (
          <span
            className={`sw-animate-ping absolute inset-0 rounded-xl ${t.ping} opacity-40`}
            aria-hidden="true"
          />
        )}
        <span
          className={`relative inline-flex h-14 w-14 items-center justify-center rounded-xl ring-1 ${t.tile} ${t.ring}`}
        >
          <Icon className="h-7 w-7" />
        </span>
      </span>
      {title && <p className="text-base font-bold text-charcoal">{title}</p>}
      <p className="max-w-xs text-sm text-slate-muted">{body}</p>
      {children}
    </div>
  );
}
