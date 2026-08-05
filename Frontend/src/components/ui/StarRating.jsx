import { useState } from "react";
import { Star } from "lucide-react";

/**
 * StarRating — display or interactive 1–5 star control.
 *
 * @param {object} props
 * @param {number} [props.value=0] - current rating (supports halves for display)
 * @param {(n:number)=>void} [props.onChange] - when provided, the control is interactive
 * @param {number} [props.size=20]
 * @param {boolean} [props.readOnly]
 */
export default function StarRating({ value = 0, onChange, size = 20, readOnly = false }) {
  const [hover, setHover] = useState(0);
  const interactive = !readOnly && typeof onChange === "function";
  const active = hover || value;

  return (
    <div className="inline-flex items-center gap-0.5" role={interactive ? "radiogroup" : undefined}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= active;
        return (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange(n)}
            onMouseEnter={() => interactive && setHover(n)}
            onMouseLeave={() => interactive && setHover(0)}
            className={interactive ? "cursor-pointer" : "cursor-default"}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <Star
              style={{ width: size, height: size }}
              className={filled ? "fill-amber text-amber" : "text-line-strong"}
              strokeWidth={2}
            />
          </button>
        );
      })}
    </div>
  );
}
