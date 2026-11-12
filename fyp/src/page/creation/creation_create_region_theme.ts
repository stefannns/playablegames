import type { AppRoute, CreationSubRoute } from "../../routes/app_route_tree";
import { useTheme, type ResolvedTheme, type ThemeMode } from "../../context/theme";

/** 相机 / Create / Live / 编辑沉浸式 — StatusBar、Tabbar 根背景、页内 ThemeScope 用 dark。 */
const CREATION_IMMERSIVE_DARK_SCREENS = new Set<
  CreationSubRoute["screen"] | "studio"
>([
  "studio",
  "playable",
  "create",
  "live",
  "edit-photo",
  "edit-video",
  "preview",
  /** Routed add-sound keeps the camera / edit preview behind the sheet. */
  "add-sound",
]);

export function isCreationImmersiveDarkScreen(
  screen: CreationSubRoute["screen"] | "studio" | undefined,
): boolean {
  return CREATION_IMMERSIVE_DARK_SCREENS.has(screen ?? "studio");
}

/**
 * Creation Tab 在 `Tabbar` 上的 `themeOverride`：沉浸式子路由（含 create / live）钉 dark；
 * 图文、配乐、发布等跟 `resolvedTheme`。
 */
export function creationAppTabBarThemeOverride(
  route: AppRoute | null | undefined,
  resolvedTheme: ResolvedTheme,
): ThemeMode {
  if (!route || route.tab !== "creation") return "dark";
  const screen = route.sub?.screen ?? "studio";
  return isCreationImmersiveDarkScreen(screen) ? "dark" : resolvedTheme;
}

/**
 * Create / Live hub 页内 `ThemeScope`（与 POST 相机同为深色面）：
 * - `"dark"` — 固定深色（默认）
 * - `"follow-app"` — 跟随桌面 ThemeSwitcher（仅验收）
 */
export const CREATION_CREATE_REGION_THEME_MODE: ThemeMode | "follow-app" =
  "dark";

export function useCreationCreateRegionTheme(): ThemeMode {
  const { mode } = useTheme();
  if (CREATION_CREATE_REGION_THEME_MODE === "follow-app") return mode;
  return CREATION_CREATE_REGION_THEME_MODE;
}
