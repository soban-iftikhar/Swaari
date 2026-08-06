import { TbRoute } from "../../lib/icons";

/**
 * Brandmark — the Swaari logo lockup. A charcoal tile housing an amber route
 * glyph (the product motif) with an optional wordmark, replacing the plain
 * "S in a square". One component so the brand renders identically in the header,
 * auth screens and anywhere else it appears.
 *
 * @param {object} props
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean} [props.showWordmark=true]
 * @param {string} [props.className]
 */
const TILE = {
  sm: "h-8 w-8 rounded-md",
  md: "h-9 w-9 rounded-lg",
  lg: "h-12 w-12 rounded-xl",
};
const GLYPH = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-7 w-7" };
const WORD = { sm: "text-base", md: "text-lg", lg: "text-2xl" };

export default function Brandmark({ size = "md", showWordmark = true, className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`sw-brandmark ${TILE[size] || TILE.md}`}>
        <TbRoute className={`text-amber ${GLYPH[size] || GLYPH.md}`} strokeWidth={2.4} />
      </span>
      {showWordmark && (
        <span className={`font-black tracking-tight text-charcoal ${WORD[size] || WORD.md}`}>
          Swaari
        </span>
      )}
    </div>
  );
}
