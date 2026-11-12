import { useSyncExternalStore } from "react";

export type MusicDetailExperimentId =
  | "default"
  | "large-cover"
  | "turntable"
  | "open-record"
  | "open-record-arm";

export type MusicDetailExperimentOption = {
  id: MusicDetailExperimentId;
  label: string;
  description: string;
};

export const MUSIC_DETAIL_EXPERIMENT_OPTIONS: MusicDetailExperimentOption[] = [
  {
    id: "default",
    label: "默认样式",
    description: "当前线上还原样式",
  },
  {
    id: "large-cover",
    label: "大封面实验",
    description: "复制当前样式，作为后续大封面方案基线",
  },
  {
    id: "turntable",
    label: "唱片机",
    description: "唱片机封面方案",
  },
  {
    id: "open-record",
    label: "展开唱片",
    description: "打开唱片封面方案",
  },
  {
    id: "open-record-arm",
    label: "展开唱片2",
    description: "去掉黑胶并加入唱臂的打开唱片方案",
  },
];

type MusicDetailExperimentState = {
  activeExperimentId: MusicDetailExperimentId;
};

let state: MusicDetailExperimentState = {
  activeExperimentId: "default",
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function setMusicDetailExperimentId(next: MusicDetailExperimentId) {
  if (state.activeExperimentId === next) return;
  state = { ...state, activeExperimentId: next };
  emit();
}

export function useMusicDetailExperimentStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
