/** TUXNavBar `heightPreset={44}`. */
export const PROFILE_TOP_NAV_BAR_HEIGHT_PX = 44;

/**
 * Profile TUXTabBar row + 0.5px separator fallback when layout has not measured yet.
 * Prefer live `getBoundingClientRect()` on `tabBarRef` at runtime.
 */
export const PROFILE_TAB_BAR_CHROME_FALLBACK_HEIGHT_PX = 40.5;

/**
 * TUXTabBar sticky offset when NavBar sits outside the scroll container
 * (page root already applies `--app-frame-top-inset`).
 */
export const PROFILE_TAB_BAR_STICKY_TOP_CSS = "0px";
