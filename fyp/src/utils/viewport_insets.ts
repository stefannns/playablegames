const APP_FRAME_ROOT_SELECTOR = '[data-app-frame-root="true"]';

/** @see SAFE_AREA.md — safe-area read helpers; do not reimplement in business code. */

function parsePx(value: string): number | null {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Resolve a CSS custom property to px by applying it on a hidden probe node.
 * Works for calc()/var() chains that getPropertyValue cannot parse.
 */
export function readCssVariablePx(
  context: Element | null | undefined,
  variableName: string,
  edge: "top" | "bottom" = "top",
): number {
  if (!context || typeof document === "undefined") return 0;

  const host = context.isConnected ? context : document.documentElement;
  const probe = document.createElement("div");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.width = "0";
  probe.style.height = "0";
  probe.style.overflow = "hidden";
  if (edge === "top") {
    probe.style.paddingTop = `var(${variableName})`;
  } else {
    probe.style.paddingBottom = `var(${variableName})`;
  }

  host.appendChild(probe);
  const computed = getComputedStyle(probe);
  const raw = edge === "top" ? computed.paddingTop : computed.paddingBottom;
  host.removeChild(probe);
  return parsePx(raw) ?? 0;
}


/**
 * Read resolved top/bottom inset px from AppFrame CSS variables.
 * Falls back to probing `--app-safe-area-*` on `:root` when the frame root
 * is not mounted yet.
 */
export function readAppFrameInsetPx(edge: "top" | "bottom"): number {
  if (typeof document === "undefined") return 0;

  const frameRoot = document.querySelector(APP_FRAME_ROOT_SELECTOR);
  if (frameRoot) {
    const frameVar =
      edge === "top" ? "--app-frame-top-inset" : "--app-frame-bottom-inset";
    return readCssVariablePx(frameRoot, frameVar, edge);
  }

  return measureAppSafeAreaInsetPx(edge);
}

/** Home For You top tab row height — matches `TUXNavBar` `heightPreset={44}`. */
export const HOME_FEED_TAB_ROW_HEIGHT_PX = 44;

/**
 * Y offset from a feed card top to the bottom of the Home tab row:
 * top safe-area inset + tab row height. Mirrors `--home-tabs-below-top` in
 * `index.css`.
 */
export function resolveHomeFeedTabBottomPx(context?: Element | null): number {
  const topInset = readAppFrameInsetPx("top");
  const fallback = topInset + HOME_FEED_TAB_ROW_HEIGHT_PX;

  if (!context || typeof document === "undefined") return fallback;

  const fromToken = readCssVariablePx(context, "--home-tabs-below-top", "top");
  return fromToken > 0 ? fromToken : fallback;
}

/** Probe the resolved `--app-safe-area-*` token (env on device, host vars in Desagent). */
export function measureAppSafeAreaInsetPx(edge: "top" | "bottom"): number {
  if (typeof document === "undefined") return 0;

  const probe = document.createElement("div");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.inset = "0";
  if (edge === "top") {
    probe.style.paddingTop = "var(--app-safe-area-top)";
  } else {
    probe.style.paddingBottom = "var(--app-safe-area-bottom)";
  }
  document.body.appendChild(probe);
  const computedStyle = getComputedStyle(probe);
  const insetValue =
    edge === "top" ? computedStyle.paddingTop : computedStyle.paddingBottom;
  document.body.removeChild(probe);
  return Number.parseFloat(insetValue) || 0;
}
