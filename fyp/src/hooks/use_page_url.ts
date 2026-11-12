import { useSyncExternalStore } from "react";

declare global {
  interface Window {
    /** Set in dev by vite `devLanOriginForQr` for QR scanning on LAN. */
    __DEV_LAN_ORIGIN__?: string;
  }
}

const urlListeners = new Set<() => void>();
let historyPatched = false;

function notifyUrlListeners() {
  for (const listener of urlListeners) {
    listener();
  }
}

function ensureHistoryPatch() {
  if (typeof window === "undefined" || historyPatched) return;
  historyPatched = true;

  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  history.pushState = (...args) => {
    const result = originalPushState(...args);
    notifyUrlListeners();
    return result;
  };

  history.replaceState = (...args) => {
    const result = originalReplaceState(...args);
    notifyUrlListeners();
    return result;
  };

  window.addEventListener("popstate", notifyUrlListeners);
  window.addEventListener("hashchange", notifyUrlListeners);
}

function subscribePageUrl(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  ensureHistoryPatch();
  urlListeners.add(onStoreChange);
  return () => {
    urlListeners.delete(onStoreChange);
  };
}

function qrUrlFromLocation(href: string): string {
  if (!import.meta.env.DEV) return href;

  const lanOrigin = window.__DEV_LAN_ORIGIN__;
  if (!lanOrigin) return href;

  try {
    const current = new URL(href);
    if (
      current.hostname !== "localhost" &&
      current.hostname !== "127.0.0.1"
    ) {
      return href;
    }
    const lan = new URL(lanOrigin);
    lan.pathname = current.pathname;
    lan.search = current.search;
    lan.hash = current.hash;
    return lan.href;
  } catch {
    return href;
  }
}

function getPageUrlSnapshot(): string {
  if (typeof window === "undefined") return "";
  return qrUrlFromLocation(window.location.href);
}

/**
 * URL for QR / sharing: dev on localhost → LAN IPv4; otherwise the real address bar URL.
 */
export function usePageUrl(): string {
  return useSyncExternalStore(subscribePageUrl, getPageUrlSnapshot, () => "");
}
