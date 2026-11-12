/**
 * Desagent preview iframe vs standalone browser / `npm run dev`.
 *
 * - Phone-frame embed: host owns status bar + home indicator (`--safe-area-*` > 0).
 * - Full Screen embed (`deviceIndex` 21 / host 0px insets): AppFrame paints fake chrome.
 *
 * Early sync also runs from `__desagent-embed-bootstrap` in index.html / vite plugin.
 *
 * @see src/components/sys/SAFE_AREA.md
 */

/** Desagent device preset index for "Full screen" (no host phone chrome). */
export const DESAGENT_FULL_SCREEN_DEVICE_INDEX = 21;

const ARTBOARDS_JSON_URL = "/.desagent/artboards.json";

let cachedArtboardDeviceIndex: number | null | undefined;

export function isDesagentEmbed() {
  if (typeof window === "undefined") return false;
  return window.parent !== window;
}

function readInlineSafeArea(edge: "top" | "bottom") {
  if (typeof document === "undefined") return "";
  return document.documentElement.style.getPropertyValue(
    edge === "top" ? "--safe-area-top" : "--safe-area-bottom",
  ).trim();
}

function parsePx(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function fullscreenFlagFromMessage(data: Record<string, unknown> | null | undefined) {
  if (!data) return null;

  if (data.fullScreen === true || data.fullscreen === true) return true;
  if (data.fullScreen === false || data.fullscreen === false) return false;
  if (data.previewMode === "fullscreen" || data.devicePreset === "fullscreen") {
    return true;
  }
  if (data.deviceIndex === DESAGENT_FULL_SCREEN_DEVICE_INDEX) return true;
  if (data.hostChromeVisible === false || data.hostOverlays === false) return true;
  if (data.hostStatusBar === false && data.hostHomeIndicator === false) return true;
  if (data.hostProvidesPhoneChrome === false) return true;

  return null;
}

function hostChromeHiddenByCssVar() {
  const inline = document.documentElement.style
    .getPropertyValue("--desagent-host-chrome")
    .trim();
  return inline === "hidden" || inline === "none";
}

function desagentHostSafeAreaWasSet() {
  return readInlineSafeArea("top") !== "" || readInlineSafeArea("bottom") !== "";
}

function isFullscreenDeviceIndex(deviceIndex: number | null | undefined) {
  return deviceIndex === DESAGENT_FULL_SCREEN_DEVICE_INDEX;
}

async function refreshArtboardDeviceIndex() {
  // A production review host explicitly supplies native chrome via CSS.
  // Do not probe the local simulator's artboard endpoint in that embedding.
  if (hostChromeHiddenByCssVar()) return cachedArtboardDeviceIndex ?? null;
  if (!isDesagentEmbed()) {
    cachedArtboardDeviceIndex = undefined;
    return null;
  }

  try {
    const response = await fetch(ARTBOARDS_JSON_URL, { cache: "no-store" });
    if (!response.ok) return cachedArtboardDeviceIndex ?? null;

    const payload = (await response.json()) as {
      artboards?: Array<{ deviceIndex?: number }>;
    };
    const board = payload.artboards?.[0];
    const next =
      board && typeof board.deviceIndex === "number" ? board.deviceIndex : null;
    cachedArtboardDeviceIndex = next;
    return next;
  } catch {
    return cachedArtboardDeviceIndex ?? null;
  }
}

/**
 * Desagent "Full screen" preview — host chrome is hidden and AppFrame must
 * render fake StatusBar / HomeIndicator.
 */
export function isDesagentFullscreenPreview(
  messageFlag: boolean | null = null,
  artboardDeviceIndex: number | null | undefined = cachedArtboardDeviceIndex,
) {
  if (!isDesagentEmbed()) return false;

  if (document.documentElement.dataset.desagentFullscreen === "true") {
    return true;
  }

  if (messageFlag === true) return true;
  if (messageFlag === false) return false;

  if (isFullscreenDeviceIndex(artboardDeviceIndex)) return true;

  if (hostChromeHiddenByCssVar()) return true;

  if (!desagentHostSafeAreaWasSet()) return false;

  const topPx = parsePx(readInlineSafeArea("top"));
  const bottomPx = parsePx(readInlineSafeArea("bottom"));
  return topPx === 0 && bottomPx === 0;
}

/** Sync `html[data-desagent-embed]` / `[data-desagent-fullscreen]` for CSS gating. */
export function syncDesagentPreviewModeDataAttrs(
  message?: Record<string, unknown> | null,
) {
  if (typeof document === "undefined") {
    return { embedded: false, fullscreen: false };
  }

  const embedded = isDesagentEmbed();
  if (embedded) {
    document.documentElement.dataset.desagentEmbed = "true";
  } else {
    delete document.documentElement.dataset.desagentEmbed;
    delete document.documentElement.dataset.desagentFullscreen;
    return { embedded: false, fullscreen: false };
  }

  const messageFlag = fullscreenFlagFromMessage(message ?? null);
  const fullscreen = isDesagentFullscreenPreview(messageFlag);

  if (fullscreen) {
    document.documentElement.dataset.desagentFullscreen = "true";
  } else {
    delete document.documentElement.dataset.desagentFullscreen;
  }

  return { embedded: true, fullscreen };
}

/** @deprecated Prefer {@link initDesagentEmbedRuntime}. */
export function syncDesagentEmbedDataAttr() {
  return syncDesagentPreviewModeDataAttrs().embedded;
}

/** Complement head bootstrap; re-sync on host messages, artboard changes, resize. */
export function initDesagentEmbedRuntime() {
  syncDesagentPreviewModeDataAttrs();
  if (!isDesagentEmbed()) return;

  void refreshArtboardDeviceIndex().then(() => {
    syncDesagentPreviewModeDataAttrs();
  });

  window.addEventListener("message", (event) => {
    const type = event.data?.type;
    if (
      type === "safe-area:set" ||
      type === "viewport:capabilities" ||
      type === "preview:state" ||
      type === "artboard:update"
    ) {
      requestAnimationFrame(() => {
        syncDesagentPreviewModeDataAttrs(event.data);
      });
    }
  });

  window.addEventListener("resize", () => {
    syncDesagentPreviewModeDataAttrs();
  });

  window.setInterval(() => {
    void refreshArtboardDeviceIndex().then(() => {
      syncDesagentPreviewModeDataAttrs();
    });
  }, 3000);

  for (const delay of [0, 50, 200, 500]) {
    window.setTimeout(() => syncDesagentPreviewModeDataAttrs(), delay);
  }
}
