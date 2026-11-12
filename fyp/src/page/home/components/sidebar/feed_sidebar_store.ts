import { useSyncExternalStore } from "react";

type FeedSidebarState = {
  isOpen: boolean;
  isDragging: boolean;
  dragOffsetPx: number;
};

let state: FeedSidebarState = {
  isOpen: false,
  isDragging: false,
  dragOffsetPx: 0,
};

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function setFeedSidebarState(partial: Partial<FeedSidebarState>) {
  state = { ...state, ...partial };
  notify();
}

export function useFeedSidebarStore() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
  );
}
