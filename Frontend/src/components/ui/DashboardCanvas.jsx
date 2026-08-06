/**
 * DashboardCanvas — the shared layout shell for both dashboards: the map is a
 * full-bleed canvas and the stage content floats over it.
 *
 * Replaces the old rigid "map 3/5 + panel 2/5" split (and the fixed 40vh mobile
 * slab) with a real product layout:
 *   • Desktop (≥sm): the map fills the region; the stage panel is a floating card
 *     pinned to the left with margins — not a hard column.
 *   • Mobile: the map sits behind a bottom-sheet-style panel (rounded top, grab
 *     handle, elevated) that clears the fixed bottom navbar. The map stays short
 *     in the background, content lives in the sheet.
 *
 * The panel owns a definite height at every breakpoint so panels built as
 * `h-full flex flex-col` (pinned header/footer + scrolling middle) work without
 * a percentage-height collapse. Solid surface, strong border, no blur.
 *
 * @param {object} props
 * @param {React.ReactNode} props.map - the RideMap element (rendered full-bleed)
 * @param {React.ReactNode} props.children - the active stage panel
 */
export default function DashboardCanvas({ map, children }) {
  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Map canvas — fills the region, everything else floats over it. */}
      <div className="absolute inset-0">{map}</div>

      {/* Floating stage panel: bottom sheet on mobile → left card on desktop. */}
      <div
        className="absolute z-10 flex flex-col bg-paper shadow-pop
          inset-x-0 bottom-[68px] h-[62vh] rounded-t-2xl border-t border-line-strong
          sm:inset-x-auto sm:left-4 sm:top-4 sm:bottom-4 sm:h-auto sm:w-[26rem]
          sm:max-w-[calc(100%-2rem)] sm:rounded-2xl sm:border"
      >
        {/* Grab handle — sheet affordance on mobile only. */}
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line-strong sm:hidden" />
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
