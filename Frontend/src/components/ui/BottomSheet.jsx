import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * BottomSheet — a mobile-first sliding drawer anchored to the bottom of the
 * screen, used for the bidding offer drawer, chat, and confirmations. On wider
 * screens it becomes a right-aligned side panel for a desktop-first feel.
 *
 * Solid surface (no blur on the panel itself); a dim scrim closes on click.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string} [props.title]
 * @param {React.ReactNode} [props.footer] - sticky footer area
 * @param {'sheet'|'side'} [props.variant='sheet'] - force layout; default is responsive
 */
export default function BottomSheet({ open, onClose, title, footer, children, variant }) {
  // Lock body scroll while open and close on Escape.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const sidePanel = variant === "side";
  const positionClass = sidePanel
    ? "inset-y-0 right-0 h-full w-full max-w-md"
    : "inset-x-0 bottom-0 max-h-[88vh] sm:inset-y-0 sm:right-0 sm:bottom-auto sm:h-full sm:w-full sm:max-w-md sm:max-h-none";
  const roundingClass = sidePanel ? "" : "rounded-t-2xl sm:rounded-t-none";

  return (
    <div className="fixed inset-0 z-50 sw-animate-fade-in" role="dialog" aria-modal="true">
      {/* Scrim */}
      <div className="absolute inset-0 bg-charcoal/40" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <div
        className={`absolute ${positionClass} flex flex-col bg-paper ${roundingClass} border-line shadow-pop sw-animate-slide-up`}
        style={{ boxShadow: "var(--shadow-pop)" }}
      >
        {/* Grab handle (sheet mode) */}
        {!sidePanel && (
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-line-strong sm:hidden" />
        )}

        {title && (
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <h3 className="text-base font-bold text-charcoal">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-muted transition hover:bg-cream"
              aria-label="Close"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && <div className="border-t border-line bg-cream/60 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
