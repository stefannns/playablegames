import type { TUXSheetProps } from "@byted-tiktok/tux-web";

import {
  APP_Z_PARTIAL_SHEET,
  APP_Z_PARTIAL_SHEET_STACKED,
} from "../../../../components/sys/app_z_index";

/** Primary music sheet — partial height, transparent overlay (`TUX_SHEET.md`). */
export function musicPanelSheetChromeProps(
  overrides?: Partial<TUXSheetProps>,
): Partial<TUXSheetProps> {
  return {
    zIndex: APP_Z_PARTIAL_SHEET,
    overlayBackgroundColor: "transparent",
    ...overrides,
  };
}

/** Trim / volume stacked above the music sheet. */
export function musicStackedSheetChromeProps(
  overrides?: Partial<TUXSheetProps>,
): Partial<TUXSheetProps> {
  return {
    zIndex: APP_Z_PARTIAL_SHEET_STACKED,
    position: "bottom",
    heightModePreset: "auto",
    closeOnOutsideClick: true,
    dragHandle: "hidden",
    draggable: false,
    sheetBackgroundColor: "UISheetFlat1",
    ...overrides,
  };
}
