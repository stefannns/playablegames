import { useSyncExternalStore } from "react";

type MusicDetailVisualState = {
  isOpen: boolean;
  isFullScreen: boolean;
};

let state: MusicDetailVisualState = {
  isOpen: false,
  isFullScreen: false,
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function setMusicDetailVisualState(next: Partial<MusicDetailVisualState>) {
  const merged = { ...state, ...next };
  if (
    merged.isOpen === state.isOpen &&
    merged.isFullScreen === state.isFullScreen
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

export function useMusicDetailVisualStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
