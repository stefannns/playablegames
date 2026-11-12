import { useSyncExternalStore } from "react";

/**
 * Per-user follow state for the guest profile, keyed by the feed/user id.
 *
 * The guest profile layer remounts its content every time it opens, so a local
 * `useState` would forget whether you already followed someone. This module-level
 * store keeps the "followed" set alive for the session so reopening a profile
 * shows the correct state.
 */
const followedIds = new Set<string>();
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

export function setVisitorFollowing(id: string, following: boolean) {
  if (following) {
    if (followedIds.has(id)) return;
    followedIds.add(id);
  } else {
    if (!followedIds.has(id)) return;
    followedIds.delete(id);
  }
  notify();
}

export function useIsVisitorFollowing(id: string) {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => followedIds.has(id),
  );
}
