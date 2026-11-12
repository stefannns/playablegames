import type { TUXSheetProps } from "@byted-tiktok/tux-web";

import { APP_Z_SHEET, APP_Z_SHEET_STACKED } from "./app_z_index";

/**
 * Default chrome for `TUXSheet` portaled to `[data-app-frame-root]`.
 * See `TUX_SHEET.md`.
 */
export function appFrameSheetChromeProps(
  overrides?: Partial<TUXSheetProps>,
): Partial<TUXSheetProps> {
  return {
    zIndex: APP_Z_SHEET,
    ...overrides,
  };
}

/**
 * Second-level sheet stacked above another AppFrame sheet (trim on music panel,
 * wiki on comment panel) — still below StatusBar / Home Indicator.
 */
export function appFrameStackedSheetChromeProps(
  overrides?: Partial<TUXSheetProps>,
): Partial<TUXSheetProps> {
  return {
    zIndex: APP_Z_SHEET_STACKED,
    ...overrides,
  };
}
