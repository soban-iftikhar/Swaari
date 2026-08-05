import { Banknote, CreditCard } from "lucide-react";

/**
 * PaymentToggle — cash vs. online payment segmented control.
 * Online is a mock in this build (no gateway wired), labelled as such.
 *
 * @param {object} props
 * @param {'cash'|'online'} props.value
 * @param {(method:'cash'|'online') => void} props.onChange
 */
const OPTIONS = [
  { key: "cash", label: "Cash", icon: Banknote },
  { key: "online", label: "Online", icon: CreditCard },
];

export default function PaymentToggle({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {OPTIONS.map(({ key, label, icon: Icon }) => {
        const selected = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition ${
              selected ? "border-charcoal bg-charcoal text-paper" : "border-line bg-paper text-slate-ink hover:border-line-strong"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
