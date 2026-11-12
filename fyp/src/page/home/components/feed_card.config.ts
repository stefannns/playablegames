import { useSyncExternalStore, useRef } from "react";
import presetCatalog from "./feed_card_preset_catalog.json";

/** 异形 Feed card 变体 */
export type FeedCardVariant = "profile-promo";

/** For You 当前页：普通 feed vs 异形 Feed card（控制左上角胶囊切换） */
export type HomeForYouActivePageKind = "feed-item" | "feed-card";

export type FeedCardGradientMode = "oklab" | "oklch";

export type FeedCardBackgroundStop = {
  color: string;
  position: number;
};

export type FeedCardBackgroundPreset = {
  id: string;
  name: string;
  family: string;
  mode: FeedCardGradientMode;
  angle: number;
  stops: FeedCardBackgroundStop[];
};

export type FeedCardBackgroundFamilyGroup = {
  id: string;
  label: string;
  cnLabel: string;
  presetIds: string[];
};

type CatalogPreset = (typeof presetCatalog.presets)[number];

const FEED_CARD_GRADIENT_ANGLE_DEG = 180;

/** 默认背景预设：Burning Sky 烈空（大卡 Dark） */
export const FEED_CARD_DEFAULT_PRESET_ID = "oklab-red-yellow-burning-sky";

/** 大卡 Light 默认渐变：Peach Drop 桃露 */
export const FEED_CARD_LARGE_LIGHT_PRESET_ID = "oklab-red-yellow-peach-drop";

export function getFeedCardDefaultBackgroundPresetId(
  cardType: FeedCardCardType,
  cardAppearance: FeedCardAppearance,
): FeedCardBackgroundPresetId {
  if (cardType === "large" && cardAppearance === "light") {
    return FEED_CARD_LARGE_LIGHT_PRESET_ID;
  }
  if (cardType === "large") {
    return FEED_CARD_DEFAULT_PRESET_ID;
  }
  return FEED_CARD_DEFAULT_PRESET_ID;
}

function catalogPresetToFeedCard(preset: CatalogPreset): FeedCardBackgroundPreset {
  // 推荐预设的"垂直翻转"策略：
  // - OKLAB 渐变：position → 1 - position，使顶/底对调；
  // - OKLCH 渐变：保持原始顺序（业务上相对 OKLAB 再翻一次，等于不翻）。
  // 自定义预设（custom）不走此函数，因此不受影响。
  const shouldFlip = preset.mode !== "oklch";
  const transformedStops = shouldFlip
    ? preset.stops
        .map((stop) => ({
          color: stop.color,
          position: 1 - stop.position,
        }))
        .sort((left, right) => left.position - right.position)
    : preset.stops.map((stop) => ({
        color: stop.color,
        position: stop.position,
      }));

  return {
    id: preset.id,
    name: preset.name,
    family: preset.family_id,
    mode: preset.mode as FeedCardGradientMode,
    angle: FEED_CARD_GRADIENT_ANGLE_DEG,
    stops: transformedStops,
  };
}

const catalogPresetMap = Object.fromEntries(
  presetCatalog.presets.map((preset) => [
    preset.id,
    catalogPresetToFeedCard(preset),
  ]),
) as Record<string, FeedCardBackgroundPreset>;

/**
 * better-gradient 全量预设（`feed_card_preset_catalog.json`）+ 异形卡定制 warm。
 * 多色标在 OKLAB/OKLCH 色空间插值；渲染时自动补全 0%/100% 避免上下露底。
 */
export const FEED_CARD_BACKGROUND_PRESETS: Record<string, FeedCardBackgroundPreset> = {
  ...catalogPresetMap,
};

export type FeedCardBackgroundPresetId = keyof typeof FEED_CARD_BACKGROUND_PRESETS;

export const FEED_CARD_BACKGROUND_PRESET_LIST: FeedCardBackgroundPresetId[] = [
  ...presetCatalog.presets.map((preset) => preset.id),
];

const oklchPairPresetIds = presetCatalog.presets
  .filter((preset) => preset.family_id === "oklch-pairs")
  .map((preset) => preset.id);

/** 按色系分组，供 Feed card 背景面板展示 */
export const FEED_CARD_BACKGROUND_FAMILY_GROUPS: FeedCardBackgroundFamilyGroup[] = [
  ...presetCatalog.families.map((family) => ({
    id: family.id,
    label: family.label,
    cnLabel: family.cn_label,
    presetIds: family.preset_ids,
  })),
  ...(oklchPairPresetIds.length > 0
    ? [
        {
          id: "oklch-pairs",
          label: "OKLCH pairs",
          cnLabel: "OKLCH 双色",
          presetIds: oklchPairPresetIds,
        },
      ]
    : []),
];

export function getFeedCardBackgroundPreset(
  id: FeedCardBackgroundPresetId,
): FeedCardBackgroundPreset {
  const catalogPreset = presetCatalog.presets.find((p) => p.id === id);
  if (catalogPreset) {
    return catalogPresetToFeedCard(catalogPreset);
  }
  // fallback to default
  const defaultPreset = presetCatalog.presets.find(
    (p) => p.id === FEED_CARD_DEFAULT_PRESET_ID,
  );
  return defaultPreset ? catalogPresetToFeedCard(defaultPreset) : {
    id: FEED_CARD_DEFAULT_PRESET_ID,
    name: "Burning Sky 烈空",
    family: "red-yellow",
    mode: "oklab",
    angle: FEED_CARD_GRADIENT_ANGLE_DEG,
    stops: [{ color: "#000000", position: 0 }, { color: "#FFFFFF", position: 1 }],
  };
}


export function formatFeedCardStopPosition(position: number): string {
  const percent = position * 100;
  return Number.isInteger(percent) ? `${percent}%` : `${percent.toFixed(1)}%`;
}

const HEX_COLOR_PATTERN = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

/** 从完整 hex 或粘贴内容提取可编辑的 6 位（不含 #） */
export function extractFeedCardHexDigits(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  let hex = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
  hex = hex.replace(/[^0-9A-Fa-f]/g, "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((channel) => channel + channel)
      .join("");
  }
  return hex.slice(0, 6).toUpperCase();
}

/** 6 位数字母 → 带 # 的 hex 字符串（允许未输满 6 位） */
export function formatFeedCardHexFromDigits(digits: string): string {
  const cleaned = digits.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6);
  return cleaned ? `#${cleaned}` : "";
}

export function normalizeFeedCardHexColor(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const candidate = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (!HEX_COLOR_PATTERN.test(candidate)) return null;
  let hex = candidate.slice(1);
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((channel) => channel + channel)
      .join("");
  }
  return `#${hex.toUpperCase()}`;
}

/** 编辑过程中实时预览（未输满 6 位时用 0 补齐） */
export function resolveFeedCardHexColorForPreview(input: string): string | null {
  const normalized = normalizeFeedCardHexColor(input);
  if (normalized) return normalized;
  const digits = extractFeedCardHexDigits(input);
  if (digits.length === 0) return null;
  const padded = `${digits}${"0".repeat(6)}`.slice(0, 6);
  return `#${padded}`;
}

function formatStopPosition(position: number): string {
  return formatFeedCardStopPosition(position);
}

/** 垂直翻转各停点 position（180° 渐变：顶↔底） */
export function flipFeedCardBackgroundStopsVertical(
  stops: FeedCardBackgroundStop[],
): FeedCardBackgroundStop[] {
  return [...stops]
    .map((stop) => ({
      ...stop,
      position: 1 - stop.position,
    }))
    .sort((left, right) => left.position - right.position);
}

/** 渲染用色：合法 hex 优先，否则编辑中的 6 位预览 */
export function resolveFeedCardStopColorForRender(color: string): string | null {
  return normalizeFeedCardHexColor(color) ?? resolveFeedCardHexColorForPreview(color);
}

function normalizeStopsForRender(stops: FeedCardBackgroundStop[]): FeedCardBackgroundStop[] {
  const sorted = [...stops].sort((left, right) => left.position - right.position);
  if (sorted.length === 0) return sorted;

  const normalized = [...sorted];
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  if (first.position > 0) {
    normalized.unshift({ color: first.color, position: 0 });
  }
  if (last.position < 1) {
    normalized.push({ color: last.color, position: 1 });
  }

  return normalized;
}

export type FeedCardBackgroundStyle = {
  backgroundColor: string;
  backgroundImage: string;
};

export type FeedCardBackgroundStyleOptions = {
  /**
   * true：sRGB 插值，停点处颜色与左侧 hex/色块一致（默认）。
   * false：按 preset.mode 在 OKLAB/OKLCH 空间插值。
   */
  matchHexStops?: boolean;
};

/** 直接用于 inline style：底色 + 渐变，边缘自动补到 0%/100% */
export function feedCardBackgroundStyle(
  preset: FeedCardBackgroundPreset,
  flipVertical = false,
  options: FeedCardBackgroundStyleOptions = {},
): FeedCardBackgroundStyle {
  const matchHexStops = options.matchHexStops ?? true;
  const resolvedStops = preset.stops
    .map((stop) => {
      const color = resolveFeedCardStopColorForRender(stop.color);
      return color ? { ...stop, color } : null;
    })
    .filter((stop): stop is FeedCardBackgroundStop => stop !== null);
  const stops = normalizeStopsForRender(
    resolvedStops.length > 0 ? resolvedStops : preset.stops,
  );
  const stopList = stops
    .map((stop) => `${stop.color} ${formatStopPosition(stop.position)}`)
    .join(", ");
  const angle = flipVertical ? 0 : preset.angle;
  const backgroundColor = flipVertical
    ? (stops[stops.length - 1]?.color ?? stops[0]?.color ?? "#000000")
    : (stops[0]?.color ?? "#000000");
  const interpolation = matchHexStops ? "" : ` in ${preset.mode}`;

  return {
    backgroundColor,
    backgroundImage: `linear-gradient(${angle}deg${interpolation}, ${stopList})`,
  };
}

// --- 背景预设选择 store ---

export type FeedCardCardType = "large" | "small" | "none";
export type FeedCardAppearance = "dark" | "light";

const FEED_CARD_BACKGROUND_STORAGE_KEY = "tiktok-ux-demo:feed-card-background:v2";

type FeedCardBackgroundConfig = {
  presetId?: string;
  customStops?: FeedCardBackgroundStop[];
};

type PersistedFeedCardBackground = {
  configs?: Record<string, FeedCardBackgroundConfig>;
};

function getConfigKey(cardType: FeedCardCardType, appearance: FeedCardAppearance): string {
  return `${cardType}-${appearance}`;
}

function isValidPresetId(id: string): id is FeedCardBackgroundPresetId {
  return id in FEED_CARD_BACKGROUND_PRESETS;
}

function readPersistedBackground(): PersistedFeedCardBackground {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(FEED_CARD_BACKGROUND_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PersistedFeedCardBackground;
  } catch {
    return {};
  }
}

function cloneCustomStops(stops: FeedCardBackgroundStop[]): FeedCardBackgroundStop[] {
  return stops.map((stop) => ({ ...stop }));
}

const persistedBackground = readPersistedBackground();

let currentCardType: FeedCardCardType = "large";
let currentAppearance: FeedCardAppearance = "dark";
let backgroundConfigs: Record<string, FeedCardBackgroundConfig> = persistedBackground.configs ?? {};

const presetListeners = new Set<() => void>();

function emitPreset() {
  presetListeners.forEach((listener) => listener());
}

function subscribePreset(listener: () => void) {
  presetListeners.add(listener);
  return () => presetListeners.delete(listener);
}

function getCurrentConfig(): FeedCardBackgroundConfig {
  const key = getConfigKey(currentCardType, currentAppearance);
  return backgroundConfigs[key] ?? {};
}

function updateCurrentConfig(updates: Partial<FeedCardBackgroundConfig>) {
  const key = getConfigKey(currentCardType, currentAppearance);
  backgroundConfigs[key] = { ...backgroundConfigs[key], ...updates };
}

function persistBackground() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    FEED_CARD_BACKGROUND_STORAGE_KEY,
    JSON.stringify({
      configs: backgroundConfigs,
    } satisfies PersistedFeedCardBackground),
  );
}

export function setFeedCardBackgroundVariant(cardType: FeedCardCardType, appearance: FeedCardAppearance) {
  if (currentCardType === cardType && currentAppearance === appearance) return;
  currentCardType = cardType;
  currentAppearance = appearance;
  emitPreset();
}

export function setFeedCardBackgroundPresetId(id: FeedCardBackgroundPresetId) {
  const current = getCurrentConfig().presetId;
  if (current === id) return;
  const preset = getFeedCardBackgroundPreset(id);
  updateCurrentConfig({
    presetId: id,
    customStops: cloneCustomStops(preset.stops),
  });
  persistBackground();
  emitPreset();
}

/** 整组替换 customStops（含 position），保证 Feed 与面板预览位置一致 */
export function setFeedCardCustomStops(stops: FeedCardBackgroundStop[]) {
  updateCurrentConfig({ customStops: cloneCustomStops(stops) });
  persistBackground();
  emitPreset();
}

export function setFeedCardCustomStopColor(index: number, color: string) {
  const normalizedColor = resolveFeedCardStopColorForRender(color);
  if (!normalizedColor) return;
  
  const currentConfig = getCurrentConfig();
  const fallbackPresetId = getFeedCardDefaultBackgroundPresetId(
    currentCardType,
    currentAppearance,
  );
  const currentStops = currentConfig.customStops 
    ? cloneCustomStops(currentConfig.customStops)
    : cloneCustomStops(getFeedCardBackgroundPreset(fallbackPresetId).stops);
  
  if (index < 0 || index >= currentStops.length) return;
  if (currentStops[index].color === normalizedColor) return;

  const updatedStops = currentStops.map((stop, stopIndex) =>
    stopIndex === index ? { ...stop, color: normalizedColor } : stop,
  );

  updateCurrentConfig({ customStops: updatedStops });
  persistBackground();
  emitPreset();
}

export function useFeedCardBackgroundPresetId() {
  const lastPresetRef = useRef<FeedCardBackgroundPresetId | null>(null);
  
  return useSyncExternalStore(
    subscribePreset,
    () => {
      const presetId = getCurrentConfig().presetId;
      const fallback = getFeedCardDefaultBackgroundPresetId(
        currentCardType,
        currentAppearance,
      );
      const result =
        typeof presetId === "string" && isValidPresetId(presetId)
          ? presetId
          : fallback;
      
      if (lastPresetRef.current !== result) {
        lastPresetRef.current = result;
      }
      return lastPresetRef.current;
    },
    () => {
      const fallback = getFeedCardDefaultBackgroundPresetId("large", "dark");
      if (lastPresetRef.current !== fallback) {
        lastPresetRef.current = fallback;
      }
      return lastPresetRef.current;
    },
  );
}

export function useFeedCardCustomStops() {
  const lastStopsRef = useRef<FeedCardBackgroundStop[] | null>(null);
  
  return useSyncExternalStore(
    subscribePreset,
    () => {
      const config = getCurrentConfig();
      const fallbackPresetId = getFeedCardDefaultBackgroundPresetId(
        currentCardType,
        currentAppearance,
      );
      const stops = config.customStops 
        ? cloneCustomStops(config.customStops)
        : cloneCustomStops(getFeedCardBackgroundPreset(fallbackPresetId).stops);
      
      // Check if stops are equal to avoid new reference on every render
      if (lastStopsRef.current === null || 
          JSON.stringify(lastStopsRef.current) !== JSON.stringify(stops)) {
        lastStopsRef.current = stops;
      }
      return lastStopsRef.current;
    },
    () => {
      const defaultStops = cloneCustomStops(
        getFeedCardBackgroundPreset(
          getFeedCardDefaultBackgroundPresetId("large", "dark"),
        ).stops,
      );
      if (lastStopsRef.current === null || 
          JSON.stringify(lastStopsRef.current) !== JSON.stringify(defaultStops)) {
        lastStopsRef.current = defaultStops;
      }
      return lastStopsRef.current;
    },
  );
}

// --- For You 当前页类型 store ---

let activePageKind: HomeForYouActivePageKind = "feed-card";
const pageListeners = new Set<() => void>();

function emitPage() {
  pageListeners.forEach((listener) => listener());
}

function subscribePage(listener: () => void) {
  pageListeners.add(listener);
  return () => pageListeners.delete(listener);
}

export function setHomeForYouActivePageKind(kind: HomeForYouActivePageKind) {
  if (activePageKind === kind) return;
  activePageKind = kind;
  emitPage();
}

export function useHomeForYouActivePageKind() {
  return useSyncExternalStore(
    subscribePage,
    () => activePageKind,
    () => activePageKind,
  );
}
