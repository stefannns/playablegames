import { getColorCSSVar } from "@byted-tiktok/tux-web";
import type { TUXSheetProps } from "@byted-tiktok/tux-web";
import { appFrameSheetChromeProps } from "../../components/sys/app_frame_sheet_chrome";

/** Shared overlay dim for creation camera sheets (album picker, etc.). */
export const CREATION_CAMERA_SHEET_OVERLAY = "UIImageOverlayBlackA50" as const;

/** Light sheet surface for the creation album picker (aligns with music / share sheets). */
export const CREATION_ALBUM_SHEET_SURFACE = "UISheetFlat1" as const;

/** Album route keeps the desktop status bar dark over the camera peek (sheet body is theme-aware). */
export const CREATION_ALBUM_STATUS_BAR_THEME = "dark" as const;

/** Wait for TUXSheet bottom dismiss before leaving `/app/creation/album`. */
export const CREATION_ALBUM_SHEET_DISMISS_MS = 360;

export const creationAlbumSheetSurfaceStyle = {
  backgroundColor: getColorCSSVar(CREATION_ALBUM_SHEET_SURFACE),
} as const;

/** Semi-transparent dark surface for the camera effects panel body. */
export const CREATION_EFFECTS_PANEL_SURFACE = "UIImageOverlayDarkGrayA60" as const;

/** Slightly lighter chip surface above the effects grid (Save pill). */
export const CREATION_EFFECTS_PANEL_CHIP_SURFACE = "UIImageOverlayDarkGrayA40" as const;

export const creationEffectsPanelSurfaceStyle = {
  backgroundColor: getColorCSSVar(CREATION_EFFECTS_PANEL_SURFACE),
} as const;

export function resolveCreationSheetFrameRoot(
  root?: HTMLElement | null,
): HTMLElement | null {
  return (
    root ??
    document.querySelector<HTMLElement>("[data-app-frame-root='true']")
  );
}

export function creationEffectsPanelSheetProps(
  overrides?: Partial<TUXSheetProps>,
): Partial<TUXSheetProps> {
  return appFrameSheetChromeProps({
    position: "bottom",
    heightModePreset: "auto",
    closeOnOutsideClick: true,
    dragHandle: "hidden",
    draggable: false,
    overlayBackgroundColor: "transparent",
    sheetBackgroundColor: "transparent",
    ...overrides,
  });
}
