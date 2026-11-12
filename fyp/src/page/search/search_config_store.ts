import { useSyncExternalStore } from "react";

export type SearchTop1CardType =
  | "none"
  | "offline-text"
  | "offline-image-wrap"
  | "simple-qa-holiday"
  | "simple-qa-time-difference"
  | "simple-qa-math"
  | "simple-qa-sunset"
  | "simple-qa-sunrise-sunset"
  | "simple-qa-weekday"
  | "simple-qa-opening-hours"
  | "simple-qa-days";

export type SearchConfig = {
  top1CardType: SearchTop1CardType;
};

export const DEFAULT_SEARCH_TOP1_CARD_TYPE: SearchTop1CardType = "offline-text";

export const SEARCH_TOP1_CARD_TYPE_OPTIONS: readonly {
  value: SearchTop1CardType;
  label: string;
}[] = [
  { value: "none", label: "无" },
  { value: "offline-text", label: "离线问答卡（纯文字）" },
  { value: "offline-image-wrap", label: "离线问答卡（图片环绕）" },
  { value: "simple-qa-holiday", label: "简单问答卡（节日卡）" },
  { value: "simple-qa-time-difference", label: "简单问答卡（时差卡）" },
  { value: "simple-qa-math", label: "简单问答卡（数学计算卡）" },
  { value: "simple-qa-sunset", label: "简单问答卡（日出/日落卡）" },
  { value: "simple-qa-sunrise-sunset", label: "简单问答卡（日出&日落卡）" },
  { value: "simple-qa-weekday", label: "简单问答卡（星期计算卡）" },
  { value: "simple-qa-opening-hours", label: "简单问答卡（开放时间卡）" },
  { value: "simple-qa-days", label: "简单问答卡（天数计算卡）" },
];

let searchConfig: SearchConfig = {
  top1CardType: DEFAULT_SEARCH_TOP1_CARD_TYPE,
};

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return searchConfig;
}

export function setSearchTop1CardType(top1CardType: SearchTop1CardType) {
  if (searchConfig.top1CardType === top1CardType) return;
  searchConfig = { ...searchConfig, top1CardType };
  emitChange();
}

export function useSearchConfig() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
