/**
 * Card — the solid container primitive (border + subtle shadow, no gradient).
 * Compose freely; `padded` toggles default padding, `as` sets the element.
 */
export default function Card({ as: Tag = "div", padded = true, className = "", children, ...rest }) {
  return (
    <Tag className={`sw-card ${padded ? "p-5 sm:p-6" : ""} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
