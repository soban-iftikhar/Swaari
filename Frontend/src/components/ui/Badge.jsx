/**
 * Badge / chip — compact status label.
 * @param {{tone?: 'neutral'|'amber'|'emerald', className?:string}} props
 */
const TONE_CLASS = {
  neutral: "sw-chip",
  amber: "sw-chip sw-chip-amber",
  emerald: "sw-chip sw-chip-emerald",
};

export default function Badge({ tone = "neutral", className = "", children }) {
  return <span className={`${TONE_CLASS[tone] || TONE_CLASS.neutral} ${className}`}>{children}</span>;
}
