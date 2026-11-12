import { getColorCSSVar } from "@byted-tiktok/tux-web";
import type { TUXSheetProps } from "@byted-tiktok/tux-web";
import { appFrameSheetChromeProps } from "../../../../components/sys/app_frame_sheet_chrome";
import { getAppFrameRootElement } from "../../../../components/sys/app_frame_top_toast";

/** Align with `share_panel.tsx` / `feed_info_config_panel.tsx` TUXSheet chrome. */
export const POST_PERMISSION_SHEET_SURFACE = "UISheetFlat1" as const;

export const postPermissionSheetSurfaceStyle = {
  backgroundColor: getColorCSSVar(POST_PERMISSION_SHEET_SURFACE),
} as const;

export function postPermissionSheetChromeProps(
  overrides?: Partial<TUXSheetProps>,
): Partial<TUXSheetProps> {
  return appFrameSheetChromeProps({
    root: getAppFrameRootElement(),
    position: "bottom",
    heightModePreset: "auto",
    closeOnOutsideClick: true,
    dragHandle: "hidden",
    draggable: true,
    // Share panel omits this prop; on flat list pages we need an explicit dim
    // inside AppFrame (same token as feed_title_panel / repost when dimmed).
    overlayBackgroundColor: "UIImageOverlayBlackA50",
    sheetBackgroundColor: POST_PERMISSION_SHEET_SURFACE,
    ...overrides,
  });
}
