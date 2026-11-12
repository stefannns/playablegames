import { useSyncExternalStore } from "react";

type CommentPanelVisualState = {
  isOpen: boolean;
  isExpanded: boolean;
  isCompactViewport: boolean;
  preserveFeedChrome: boolean;
};

let state: CommentPanelVisualState = {
  isOpen: false,
  isExpanded: false,
  isCompactViewport: false,
  preserveFeedChrome: false,
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function setCommentPanelVisualState(next: Partial<CommentPanelVisualState>) {
  const merged = { ...state, ...next };
  if (
    merged.isOpen === state.isOpen &&
    merged.isExpanded === state.isExpanded &&
    merged.isCompactViewport === state.isCompactViewport &&
    merged.preserveFeedChrome === state.preserveFeedChrome
  ) {
    return;
  }
  state = merged;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function useCommentPanelVisualStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
