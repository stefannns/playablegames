/** Story skylight avatar diameter — shared by cells and publish landing motion. */
export const SKYLIGHT_AVATAR_PX = 78;

/** Figma Story Content — 6px below the 78×78 photo; use 12px (gap-3) for layout gap so labels clear rings/badges. */
export const SKYLIGHT_LABEL_GAP_PX = 12;

/** `StorySkylightCell` outer box height. */
export const SKYLIGHT_CELL_HEIGHT_PX = 123;

/** Vertical padding on the horizontal story strip (8px top + 8px bottom). */
export const SKYLIGHT_SCROLL_PADDING_Y_PX = 8;

/** Inbox story strip top inset below header chrome. */
export const SKYLIGHT_SCROLL_PADDING_TOP_INBOX_PX = 38;

/** Shared horizontal story scroll row — height fits cell content + `py-2`. */
export const SKYLIGHT_SCROLL_ROW_CLASS =
  "hide-scrollbar box-border flex h-fit min-w-0 w-full shrink-0 flex-row flex-nowrap overflow-x-auto overflow-y-visible overscroll-x-contain touch-pan-x px-1 py-2";

/** Inbox horizontal story scroll row — taller top padding below inbox header. */
export const SKYLIGHT_SCROLL_ROW_INBOX_CLASS =
  "hide-scrollbar box-border flex h-fit min-w-0 w-full shrink-0 flex-row flex-nowrap overflow-x-auto overflow-y-visible overscroll-x-contain touch-pan-x px-1 pb-2 pt-[38px]";
