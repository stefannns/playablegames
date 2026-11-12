import { getColorCSSVar } from "@byted-tiktok/tux-web";

/** Figma TUXCheckbox 607:21557 — album grid / preview multi-select, 24px. */
export const ALBUM_PREVIEW_SELECTION_SIZE_PX = 24;
const ALBUM_PREVIEW_SELECTION_BORDER_PX = 2;
const PREVIEW_CHROME_SHADOW = "drop-shadow(0 1px 3px rgba(0, 0, 0, 0.45))";

export type AlbumPreviewSelectionControlProps = {
  selectedOrder: number | null;
  onToggle: () => void;
};

/** Preview chrome ring — UIText1 stroke on dark ThemeScope (Figma TUXCheckbox 607:21557). */
const PREVIEW_SELECTION_RING_COLOR = getColorCSSVar("UIText1");

/**
 * Album preview trailing selector — empty ring or numbered primary pill.
 * Ring stroke uses UIText1; fill / selected states use TUX color tokens.
 */
export function AlbumPreviewSelectionControl({
  selectedOrder,
  onToggle,
}: AlbumPreviewSelectionControlProps) {
  const selected = selectedOrder !== null;

  return (
    <button
      type="button"
      className="flex size-11 shrink-0 items-center justify-center"
      aria-label={selected ? `Deselect item ${selectedOrder}` : "Select item"}
      aria-pressed={selected}
      onPointerDown={(event) => event.preventDefault()}
      onClick={onToggle}
    >
      {selected ? (
        <span
          className="flex items-center justify-center rounded-full bg-tux-v2-ui-shape-primary"
          style={{
            width: ALBUM_PREVIEW_SELECTION_SIZE_PX,
            height: ALBUM_PREVIEW_SELECTION_SIZE_PX,
            filter: PREVIEW_CHROME_SHADOW,
          }}
        >
          <span
            className="text-[13px] font-semibold leading-none text-tux-v2-ui-image-overlay-white"
          >
            {selectedOrder}
          </span>
        </span>
      ) : (
        <span
          className="box-border rounded-full bg-tux-v2-ui-image-overlay-black-a25"
          style={{
            width: ALBUM_PREVIEW_SELECTION_SIZE_PX,
            height: ALBUM_PREVIEW_SELECTION_SIZE_PX,
            border: `${ALBUM_PREVIEW_SELECTION_BORDER_PX}px solid ${PREVIEW_SELECTION_RING_COLOR}`,
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.45)",
          }}
          aria-hidden
        />
      )}
    </button>
  );
}
