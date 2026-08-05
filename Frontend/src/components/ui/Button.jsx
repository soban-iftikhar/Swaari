/**
 * Button — the app's primary action element.
 *
 * Variants map to the solid design-system button classes (no gradients):
 *   primary (charcoal) · accent (amber) · go (emerald) · outline · danger · ghost
 *
 * @param {object} props
 * @param {React.ElementType} [props.as='button'] - render as another element/component (e.g. Link)
 * @param {'primary'|'accent'|'go'|'outline'|'danger'|'ghost'} [props.variant='primary']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean} [props.loading] - shows a spinner and disables the button
 * @param {boolean} [props.fullWidth]
 * @param {React.ComponentType} [props.icon] - leading Lucide icon component
 */
import { Loader2 } from "lucide-react";

const VARIANT_CLASS = {
  primary: "sw-btn-primary",
  accent: "sw-btn-accent",
  go: "sw-btn-go",
  outline: "sw-btn-outline",
  danger: "sw-btn-danger",
  ghost: "bg-transparent text-slate-ink hover:bg-cream border-transparent",
};

const SIZE_CLASS = {
  sm: "text-sm px-3 py-1.5",
  md: "text-sm px-4 py-2.5",
  lg: "text-base px-6 py-3",
};

export default function Button({
  as: Component = "button",
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  icon: Icon,
  className = "",
  children,
  disabled,
  ...rest
}) {
  const variantClass = VARIANT_CLASS[variant] || VARIANT_CLASS.primary;
  const isNativeButton = Component === "button";
  // Only native <button> understands the `disabled` attribute; for polymorphic
  // renders (e.g. Link) we fall back to a disabled style + click guard.
  const disabledProps = isNativeButton
    ? { disabled: disabled || loading }
    : (disabled || loading)
      ? { "aria-disabled": true, tabIndex: -1, onClick: (e) => e.preventDefault() }
      : {};
  return (
    <Component
      className={`sw-btn ${variantClass} ${SIZE_CLASS[size]} ${fullWidth ? "w-full" : ""} ${
        !isNativeButton && (disabled || loading) ? "pointer-events-none opacity-60" : ""
      } ${className}`}
      {...disabledProps}
      {...rest}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        Icon && <Icon className="h-4 w-4" />
      )}
      {children}
    </Component>
  );
}
