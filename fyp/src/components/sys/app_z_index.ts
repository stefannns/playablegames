/**
 * Stacking order inside `[data-app-frame-root]`.
 *
 * Chrome (status bar, home indicator) sits above business overlays so immersive
 * sheets can use `inset-0` full-bleed while system UI stays fixed — see
 * `STATUS_BAR.md` and `app_frame.tsx` 文件头。
 *
 * Soft keyboard stays on top of portaled sheets so composers never cover the keys.
 */
export const APP_Z_OVERLAY = 2000;

/**
 * Portaled `TUXSheet` surfaces inside AppFrame — below `APP_Z_OVERLAY` /
 * status bar / home indicator, above tab content. Default TUXSheet z-index
 * (2000) matches `APP_Z_OVERLAY` and can paint over shell chrome when portaled
 * after `[data-app-frame-overlays]` in DOM order.
 */
export const APP_Z_SHEET = 1900;

/**
 * Nested `TUXSheet` above another sheet (e.g. wiki on comment) — below soft-keyboard
 * dismiss layer (1990) and shell chrome (2100).
 */
export const APP_Z_SHEET_STACKED = 1950;

/**
 * Partial-height sheets with `overlayBackgroundColor="transparent"` (配乐 55%/70%).
 * Must stay at TUX default 2000 so the soft-keyboard dismiss layer (1990) paints
 * **under** the sheet — see `soft_keyboard_host.tsx`. Full-bleed sheets use
 * `APP_Z_SHEET` (1900) instead.
 */
export const APP_Z_PARTIAL_SHEET = 2000;

/** Trim / volume above the music panel — still below shell chrome (2100). */
export const APP_Z_PARTIAL_SHEET_STACKED = 2050;

/** Fixed desktop status bar — `status_bar.tsx` (`AppChromeStatusBar`). */
export const APP_Z_STATUS_BAR = 2100;

/** Fixed desktop home indicator — `AppFrame` / `home_indicator.tsx`. */
export const APP_Z_HOME_INDICATOR = 2100;

export const APP_Z_KEYBOARD = 2200;
