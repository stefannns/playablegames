import { useSyncExternalStore } from "react";
import type { ColorV2Name } from "@byted-tiktok/tux-color";
import { resolveFeedCardHexColorForPreview } from "./feed_card.config";

/**
 * 异形卡 layout / appearance 配置 store。
 *
 * 支持每种 (cardType, appearance) 组合有独立的配置。
 */

/** 卡片骨架类型 */
export type FeedCardCardType = "large" | "small" | "none";

/** 异形卡专属外观（与系统主题独立） */
export type FeedCardAppearance = "dark" | "light";

/** 背景来源：使用 OKLAB 渐变预设，或上传自定义图片 */
export type FeedCardBackgroundSource = "preset" | "image";

/** 主按钮配色档位（最终颜色由 appearance 共同决定；`custom` 仅无卡） */
export type FeedCardMainButtonColor = "white" | "red" | "gray" | "custom";

const STORAGE_KEY = "tiktok-ux-demo:feed-card-layout:v2";

const DEFAULT_MAIN_BUTTON_TEXT = "Main Action";

/** 无卡：主按钮文字自定义（黑/白） */
export type FeedCardMainButtonCustomTextColor = "black" | "white";

type FeedCardVariantConfig = {
  backgroundSource?: FeedCardBackgroundSource;
  customBackgroundImage?: string | null;
  mainButtonColor?: FeedCardMainButtonColor;
  mainButtonText?: string;
  /** 无卡：主按钮自定义 hex 背景 */
  mainButtonCustomBackgroundHex?: string | null;
  mainButtonCustomTextColor?: FeedCardMainButtonCustomTextColor | null;
  businessCustomImage?: string | null;
  businessCustomAspect?: number | null;
  businessCustomImage2?: string | null;
  businessCustomAspect2?: number | null;
};

type FeedCardVariantDefaults = {
  backgroundSource: FeedCardBackgroundSource;
  customBackgroundImage: string | null;
  mainButtonColor: FeedCardMainButtonColor;
  mainButtonText: string;
  mainButtonCustomBackgroundHex: string | null;
  mainButtonCustomTextColor: FeedCardMainButtonCustomTextColor | null;
  businessCustomImage: string | null;
  businessCustomAspect: number | null;
  businessCustomImage2: string | null;
  businessCustomAspect2: number | null;
};

/** 各 (cardType, appearance) 首次打开时的默认配置（与产品定稿截图一致） */
const FEED_CARD_VARIANT_DEFAULTS: Record<string, FeedCardVariantDefaults> = {
  "large-dark": {
    backgroundSource: "preset",
    customBackgroundImage: null,
    mainButtonColor: "white",
    mainButtonText: DEFAULT_MAIN_BUTTON_TEXT,
    mainButtonCustomBackgroundHex: null,
    mainButtonCustomTextColor: null,
    businessCustomImage: null,
    businessCustomAspect: null,
    businessCustomImage2: null,
    businessCustomAspect2: null,
  },
  "large-light": {
    backgroundSource: "preset",
    customBackgroundImage: null,
    mainButtonColor: "white",
    mainButtonText: DEFAULT_MAIN_BUTTON_TEXT,
    mainButtonCustomBackgroundHex: null,
    mainButtonCustomTextColor: null,
    businessCustomImage: null,
    businessCustomAspect: null,
    businessCustomImage2: null,
    businessCustomAspect2: null,
  },
  "small-dark": {
    backgroundSource: "image",
    customBackgroundImage: null,
    mainButtonColor: "gray",
    mainButtonText: DEFAULT_MAIN_BUTTON_TEXT,
    mainButtonCustomBackgroundHex: null,
    mainButtonCustomTextColor: null,
    businessCustomImage: null,
    businessCustomAspect: null,
    businessCustomImage2: null,
    businessCustomAspect2: null,
  },
  "small-light": {
    backgroundSource: "image",
    customBackgroundImage: null,
    mainButtonColor: "gray",
    mainButtonText: DEFAULT_MAIN_BUTTON_TEXT,
    mainButtonCustomBackgroundHex: null,
    mainButtonCustomTextColor: null,
    businessCustomImage: null,
    businessCustomAspect: null,
    businessCustomImage2: null,
    businessCustomAspect2: null,
  },
  "none-dark": {
    backgroundSource: "image",
    customBackgroundImage: null,
    mainButtonColor: "custom",
    mainButtonText: DEFAULT_MAIN_BUTTON_TEXT,
    mainButtonCustomBackgroundHex: "#FE2C55",
    mainButtonCustomTextColor: "white",
    businessCustomImage: null,
    businessCustomAspect: null,
    businessCustomImage2: null,
    businessCustomAspect2: null,
  },
  "none-light": {
    backgroundSource: "image",
    customBackgroundImage: null,
    mainButtonColor: "custom",
    mainButtonText: DEFAULT_MAIN_BUTTON_TEXT,
    mainButtonCustomBackgroundHex: "#000000",
    mainButtonCustomTextColor: "white",
    businessCustomImage: null,
    businessCustomAspect: null,
    businessCustomImage2: null,
    businessCustomAspect2: null,
  },
};

function getVariantDefaults(
  type: FeedCardCardType,
  mode: FeedCardAppearance,
): FeedCardVariantDefaults {
  return FEED_CARD_VARIANT_DEFAULTS[getConfigKey(type, mode)];
}

function getCurrentVariantDefaults(): FeedCardVariantDefaults {
  return getVariantDefaults(cardType, appearance);
}

type PersistedFeedCardLayout = {
  cardType?: FeedCardCardType;
  appearance?: FeedCardAppearance;
  configs?: Record<string, FeedCardVariantConfig>;
};

function getConfigKey(cardType: FeedCardCardType, appearance: FeedCardAppearance): string {
  return `${cardType}-${appearance}`;
}

function readPersisted(): PersistedFeedCardLayout {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PersistedFeedCardLayout;
  } catch {
    return {};
  }
}

const persisted = readPersisted();

let cardType: FeedCardCardType = persisted.cardType ?? "large";
let appearance: FeedCardAppearance = persisted.appearance ?? "dark";
let variantConfigs: Record<string, FeedCardVariantConfig> = persisted.configs ?? {};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getCurrentConfig(): FeedCardVariantConfig {
  const key = getConfigKey(cardType, appearance);
  return variantConfigs[key] ?? {};
}

function updateCurrentConfig(updates: Partial<FeedCardVariantConfig>) {
  const key = getConfigKey(cardType, appearance);
  variantConfigs[key] = { ...variantConfigs[key], ...updates };
}

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      cardType,
      appearance,
      configs: variantConfigs,
    } satisfies PersistedFeedCardLayout),
  );
}

export function useFeedCardCardType() {
  return useSyncExternalStore(
    subscribe,
    () => cardType,
    () => cardType,
  );
}

export function useFeedCardAppearance() {
  return useSyncExternalStore(
    subscribe,
    () => appearance,
    () => appearance,
  );
}

export function useFeedCardBackgroundSource() {
  return useSyncExternalStore(
    subscribe,
    () =>
      getCurrentConfig().backgroundSource ?? getCurrentVariantDefaults().backgroundSource,
    () => getVariantDefaults("large", "dark").backgroundSource,
  );
}

export function useFeedCardCustomBackgroundImage() {
  return useSyncExternalStore(
    subscribe,
    () => getCurrentConfig().customBackgroundImage ?? null,
    () => getCurrentConfig().customBackgroundImage ?? null,
  );
}

export function getFeedCardDefaultMainButtonColor(
  type: FeedCardCardType,
  mode: FeedCardAppearance = appearance,
): FeedCardMainButtonColor {
  return getVariantDefaults(type, mode).mainButtonColor;
}

export function useFeedCardMainButtonColor() {
  return useSyncExternalStore(
    subscribe,
    () =>
      getCurrentConfig().mainButtonColor ?? getCurrentVariantDefaults().mainButtonColor,
    () => getVariantDefaults("large", "dark").mainButtonColor,
  );
}

export function useFeedCardMainButtonText() {
  return useSyncExternalStore(
    subscribe,
    () => getCurrentConfig().mainButtonText ?? getCurrentVariantDefaults().mainButtonText,
    () => DEFAULT_MAIN_BUTTON_TEXT,
  );
}

export function useFeedCardMainButtonCustomBackgroundHex() {
  return useSyncExternalStore(
    subscribe,
    () =>
      getCurrentConfig().mainButtonCustomBackgroundHex ??
      getCurrentVariantDefaults().mainButtonCustomBackgroundHex ??
      "",
    () => getVariantDefaults("none", "dark").mainButtonCustomBackgroundHex ?? "",
  );
}

export function useFeedCardMainButtonCustomTextColor() {
  return useSyncExternalStore(
    subscribe,
    () =>
      getCurrentConfig().mainButtonCustomTextColor ??
      getCurrentVariantDefaults().mainButtonCustomTextColor,
    () => getVariantDefaults("none", "dark").mainButtonCustomTextColor,
  );
}

export function useFeedCardBusinessCustomImage() {
  return useSyncExternalStore(
    subscribe,
    () => getCurrentConfig().businessCustomImage ?? null,
    () => getCurrentConfig().businessCustomImage ?? null,
  );
}

export function useFeedCardBusinessCustomAspect() {
  return useSyncExternalStore(
    subscribe,
    () => getCurrentConfig().businessCustomAspect ?? null,
    () => getCurrentConfig().businessCustomAspect ?? null,
  );
}

export function useFeedCardBusinessCustomImage2() {
  return useSyncExternalStore(
    subscribe,
    () => getCurrentConfig().businessCustomImage2 ?? null,
    () => getCurrentConfig().businessCustomImage2 ?? null,
  );
}

export function useFeedCardBusinessCustomAspect2() {
  return useSyncExternalStore(
    subscribe,
    () => getCurrentConfig().businessCustomAspect2 ?? null,
    () => getCurrentConfig().businessCustomAspect2 ?? null,
  );
}

export function setFeedCardCardType(value: FeedCardCardType) {
  if (cardType === value) return;
  cardType = value;
  persist();
  emit();
}

export function setFeedCardAppearance(value: FeedCardAppearance) {
  if (appearance === value) return;
  appearance = value;
  persist();
  emit();
}

export function setFeedCardBackgroundSource(value: FeedCardBackgroundSource) {
  const current = getCurrentConfig().backgroundSource;
  if (current === value) return;
  updateCurrentConfig({ backgroundSource: value });
  persist();
  emit();
}

export function setFeedCardCustomBackgroundImage(value: string | null) {
  const current = getCurrentConfig().customBackgroundImage;
  if (current === value) return;
  updateCurrentConfig({ customBackgroundImage: value });
  persist();
  emit();
}

export function setFeedCardMainButtonColor(value: FeedCardMainButtonColor) {
  const current = getCurrentConfig().mainButtonColor;
  if (current === value) return;
  updateCurrentConfig({ mainButtonColor: value });
  persist();
  emit();
}

export function setFeedCardMainButtonText(value: string) {
  const current = getCurrentConfig().mainButtonText;
  if (current === value) return;
  updateCurrentConfig({ mainButtonText: value });
  persist();
  emit();
}

export function setFeedCardMainButtonCustomBackgroundHex(value: string) {
  const current = getCurrentConfig().mainButtonCustomBackgroundHex ?? "";
  if (current === value) return;
  updateCurrentConfig({ mainButtonCustomBackgroundHex: value });
  persist();
  emit();
}

export function setFeedCardMainButtonCustomTextColor(
  value: FeedCardMainButtonCustomTextColor | null,
) {
  const current = getCurrentConfig().mainButtonCustomTextColor ?? null;
  if (current === value) return;
  updateCurrentConfig({ mainButtonCustomTextColor: value });
  persist();
  emit();
}

export function resetFeedCardMainButtonText() {
  setFeedCardMainButtonText(DEFAULT_MAIN_BUTTON_TEXT);
}

export function setFeedCardBusinessCustomImage(value: string | null) {
  const current = getCurrentConfig().businessCustomImage;
  if (current === value) return;
  updateCurrentConfig({ businessCustomImage: value });
  persist();
  emit();
}

export function setFeedCardBusinessCustomAspect(value: number | null) {
  const current = getCurrentConfig().businessCustomAspect;
  if (current === value) return;
  updateCurrentConfig({ businessCustomAspect: value });
  persist();
  emit();
}

export function setFeedCardBusinessCustomImage2(value: string | null) {
  const current = getCurrentConfig().businessCustomImage2;
  if (current === value) return;
  updateCurrentConfig({ businessCustomImage2: value });
  persist();
  emit();
}

export function setFeedCardBusinessCustomAspect2(value: number | null) {
  const current = getCurrentConfig().businessCustomAspect2;
  if (current === value) return;
  updateCurrentConfig({ businessCustomAspect2: value });
  persist();
  emit();
}

export function getFeedCardMainButtonColors(
  buttonColor: Exclude<FeedCardMainButtonColor, "custom">,
  cardAppearance: FeedCardAppearance,
): {
  background: string;
  text: string;
} {
  const colors: Record<
    Exclude<FeedCardMainButtonColor, "custom">,
    Record<FeedCardAppearance, { background: string; text: string }>
  > = {
    white: {
      dark: { background: "UIImageOverlayWhite", text: "UIImageOverlayBlack" },
      light: { background: "UIImageOverlayWhite", text: "UIImageOverlayBlack" },
    },
    red: {
      dark: { background: "#FE2C55", text: "UIImageOverlayWhite" },
      light: { background: "#FE2C55", text: "UIImageOverlayWhite" },
    },
    gray: {
      dark: { background: "UIImageOverlayWhiteA20", text: "UIImageOverlayWhite" },
      light: { background: "UIImageOverlayWhiteA40", text: "UIImageOverlayBlackA50" },
    },
  };
  return colors[buttonColor][cardAppearance];
}

function resolveFeedCardCustomMainButtonColors(
  customBackgroundHex?: string | null,
  customTextColor?: FeedCardMainButtonCustomTextColor | null,
): { background: string; text: string } | null {
  const background = customBackgroundHex
    ? resolveFeedCardHexColorForPreview(customBackgroundHex)
    : null;
  const effectiveTextColor = customTextColor ?? "black";
  const text =
    effectiveTextColor === "white" ? "UIImageOverlayWhite" : "UIImageOverlayBlack";
  if (background) {
    return { background, text };
  }
  return null;
}

export function resolveFeedCardMainButtonColors(
  buttonColor: FeedCardMainButtonColor,
  cardAppearance: FeedCardAppearance,
  customBackgroundHex?: string | null,
  customTextColor?: FeedCardMainButtonCustomTextColor | null,
): {
  background: string;
  text: string;
} {
  if (buttonColor === "custom") {
    return (
      resolveFeedCardCustomMainButtonColors(customBackgroundHex, customTextColor) ??
      getFeedCardMainButtonColors("white", cardAppearance)
    );
  }
  return getFeedCardMainButtonColors(buttonColor, cardAppearance);
}

export function getFeedCardSecondaryButtonColors(
  cardAppearance: FeedCardAppearance,
): {
  background: ColorV2Name | string;
  text: ColorV2Name | string;
} {
  if (cardAppearance === "dark") {
    return {
      background: "UIImageOverlayWhiteA20",
      text: "UIImageOverlayWhite",
    };
  }
  return {
    background: "UIImageOverlayWhiteA40",
    text: "UIImageOverlayBlackA50",
  };
}

export function getFeedCardSwipeIndicatorColor(
  cardAppearance: FeedCardAppearance,
): ColorV2Name {
  return cardAppearance === "dark" ? "UIImageOverlayWhiteA75" : "UIImageOverlayBlackA50";
}