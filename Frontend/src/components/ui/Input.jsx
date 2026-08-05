/**
 * Input — labelled text field with inline error and optional leading icon.
 *
 * @param {object} props
 * @param {string} [props.label]
 * @param {string} [props.error] - shows a red border + message when present
 * @param {React.ComponentType} [props.icon] - leading Lucide icon
 * @param {string} [props.hint] - helper text under the field
 * Remaining props are forwarded to the native <input>.
 */
export default function Input({ label, error, icon: Icon, hint, className = "", id, ...rest }) {
  const inputId = id || rest.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-charcoal">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-faint">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <input
          id={inputId}
          className={`sw-input ${Icon ? "pl-9" : ""} ${error ? "sw-input-error" : ""} ${className}`}
          {...rest}
        />
      </div>
      {error ? (
        <span className="text-xs font-medium text-danger">{error}</span>
      ) : (
        hint && <span className="text-xs text-slate-muted">{hint}</span>
      )}
    </div>
  );
}
