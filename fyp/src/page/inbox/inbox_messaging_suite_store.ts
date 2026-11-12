import { useSyncExternalStore } from "react";

/**
 * Tracks which "messaging suite" the user has picked for the Inbox.
 * - `personal`: default; basic inbox, no business chip tab bar.
 * - `professional`: enables the business chip tab bar (Inbox / Unread /
 *   Starred / Ads / Leads / Unanswered / Spam) above the row list.
 *
 * Suite preference is persisted via localStorage.
 */

export type MessagingSuite = "personal" | "professional";

const STORAGE_KEY = "inbox.messaging.suite";

function readStored(): MessagingSuite {
  if (typeof window === "undefined") return "personal";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "professional" ? "professional" : "personal";
  } catch {
    return "personal";
  }
}

type State = {
  suite: MessagingSuite;
};

let state: State = {
  suite: readStored(),
};
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function persistSuite(suite: MessagingSuite) {
  try {
    window.localStorage.setItem(STORAGE_KEY, suite);
  } catch {
    // ignore
  }
}

export function setMessagingSuite(suite: MessagingSuite): void {
  if (state.suite === suite) return;
  state = { ...state, suite };
  persistSuite(suite);
  emit();
}

export function getMessagingSuite(): MessagingSuite {
  return state.suite;
}

const subscribe = (callback: () => void) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};

export function useMessagingSuite(): MessagingSuite {
  return useSyncExternalStore(
    subscribe,
    () => state.suite,
    () => "personal" as MessagingSuite,
  );
}
