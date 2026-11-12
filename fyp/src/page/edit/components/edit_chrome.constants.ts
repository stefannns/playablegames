/** 9:16 camera viewfinder + edit preview (shared contract). */
export const EDIT_MEDIA_ASPECT = "9 / 16";

/** Camera viewfinder + edit preview corner radius (px). */
export const EDIT_MEDIA_CORNER_RADIUS_PX = 20;

/** Nav bar inset from preview top; image stays full-bleed. */
export const EDIT_CHROME_TOP_OFFSET_PX = 8;

/** Sidebar tool column inset from preview top (tighter than nav bar). */
export const EDIT_SIDEBAR_TOP_OFFSET_PX = 4;

/** Pill chips over preview (AutoCut, Add sound, overlay toolbars). */
export const EDIT_OVERLAY_CAPSULE_RADIUS_CSS = "var(--tux-v2-radius-content-capsule)";

/** Sidebar tool column `top` (see {@link EDIT_SIDEBAR_TOP_OFFSET_PX}). */
export const EDIT_SIDEBAR_TOP_CSS = `${EDIT_SIDEBAR_TOP_OFFSET_PX}px`;

export function editSidebarTopWithOffsetCss(extraPx: number): string {
  return `${EDIT_SIDEBAR_TOP_OFFSET_PX + extraPx}px`;
}

/** Shared toolbar asset root (AutoCut effect thumbs, story avatar). */
export const EDIT_TOOLBAR_ASSET_ROOT = "/resource/video_mock/edit_video";

export const EDIT_SIDEBAR_SPRING = {
  type: "spring" as const,
  stiffness: 438.65,
  damping: 37.7,
};

export const EDIT_SIDEBAR_ROW_HEIGHT_PX = 52;

/** Fixed hit target / icon column — icons stay here on expand & collapse (see story edit). */
export const EDIT_SIDEBAR_ICON_COLUMN_WIDTH_PX = 56;

/** Centered overlay icon size inside the 56px column. */
export const EDIT_SIDEBAR_ICON_SIZE_PX = 28;

const EDIT_SIDEBAR_ICON_INSET_PX = (EDIT_SIDEBAR_ICON_COLUMN_WIDTH_PX - EDIT_SIDEBAR_ICON_SIZE_PX) / 2;

/** Left edge of the centered icon from the row's right — labels anchor here (see story edit). */
export const EDIT_SIDEBAR_ICON_LEFT_FROM_RIGHT_PX =
  EDIT_SIDEBAR_ICON_COLUMN_WIDTH_PX - EDIT_SIDEBAR_ICON_INSET_PX;

/** Gap between label text and icon edge. */
export const EDIT_SIDEBAR_LABEL_ICON_GAP_PX = 10;

/** Compact block: two tools + split line. */
export const EDIT_SIDEBAR_COMPACT_HEIGHT_PX = 117;

/** Staggered expandable panel heights (photo). */
export const EDIT_SIDEBAR_STAGGERED_HEIGHT_COLLAPSED_PX = 364;
export const EDIT_SIDEBAR_STAGGERED_HEIGHT_EXPANDED_PX = 398;

/** Inline column width when collapsed / expanded (video). Expanded fits longest label. */
export const EDIT_SIDEBAR_COLUMN_WIDTH_COLLAPSED_PX = 56;
export const EDIT_SIDEBAR_COLUMN_WIDTH_EXPANDED_PX = 220;

/** Staggered photo scroll panel — wide enough for natural-width labels + icon column. */
export const EDIT_SIDEBAR_STAGGERED_PANEL_WIDTH_PX = 220;

/** Camera expandable panel — collapsed ends before Filters row (Retouch is last visible). */
export const CAMERA_SIDEBAR_SCROLL_COLLAPSED_PX = 208;
/** Camera expandable panel — expanded through Ratio (below Filters). */
export const CAMERA_SIDEBAR_SCROLL_EXPANDED_PX = 312;

/** Sidebar tool icon scale on press (camera + edit). */
export const EDIT_SIDEBAR_PRESS_SCALE = 1.05;

/** Bottom action row offset from `--app-frame-bottom-inset` (edit + camera). */
export const EDIT_BOTTOM_CHROME_OFFSET_PX = 4;

/** Camera POST tab bar — sits above home indicator with this gap (44px tall row). */
export const CAMERA_TAB_BAR_BOTTOM_OFFSET_PX = 8;
export const CAMERA_TAB_BAR_HEIGHT_PX = 44;

/** Gap between effect dock bottom and camera tab bar top. */
export const CAMERA_DOCK_ABOVE_TAB_BAR_PX = 34;

export const CAMERA_DOCK_HEIGHT_PX = 86;
export const CAMERA_MODE_TAB_ABOVE_DOCK_PX = 16;
/** Mode tab bottom = dock bottom + dock height + gap. */
export const CAMERA_MODE_TAB_BOTTOM_OFFSET_PX =
  CAMERA_DOCK_ABOVE_TAB_BAR_PX + CAMERA_DOCK_HEIGHT_PX + CAMERA_MODE_TAB_ABOVE_DOCK_PX;

/** Recording shutter aligns with dock shutter — 15px below dock bottom anchor. */
export const CAMERA_RECORDING_BELOW_DOCK_BOTTOM_PX = 15;
