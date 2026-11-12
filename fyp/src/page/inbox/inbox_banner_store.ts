import { useSyncExternalStore } from "react";

/**
 * Tiny external store for the Inbox banner's visibility, persisted to
 * localStorage so the toggle survives reloads. Replaces the old
 * "show banner on every Inbox tab entry" behaviour with an explicit
 * user-controlled flag exposed by `InboxBannerControl`.
 */

const STORAGE_KEY = "inbox.banner.enabled";

function readStored(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === null ? true : raw === "true";
  } catch {
    return true;
  }
}

let state = readStored();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function setInboxBannerEnabled(enabled: boolean): void {
  if (state === enabled) return;
  state = enabled;
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
  } catch {
    // ignore quota / private-mode errors
  }
  emit();
}

export function getInboxBannerEnabled(): boolean {
  return state;
}

export function useInboxBannerEnabled(): boolean {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },
    () => state,
    () => true,
  );
}
