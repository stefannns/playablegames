import { getColorCSSVar } from "@byted-tiktok/tux-web";
import type { ColorV2Name } from "@byted-tiktok/tux-color";
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTheme, type ResolvedTheme } from "../../context/theme";
import { APP_Z_HOME_INDICATOR, APP_Z_OVERLAY } from "./app_z_index";
import HomeIndicator from "./home_indicator";
import {
  getSoftKeyboardPresentedHeight,
  SoftKeyboardHost,
  useSoftKeyboard,
} from "./soft_keyboard";
import { isStandaloneDisplayMode } from "../../utils/display_mode";

/* ============================================================================
 * AppFrame — 桌面 phone-frame 壳层（本文件为分层/铺色约定权威来源）
 *
 * ## 节点树（sm+）
 *
 *   [data-app-frame-root]           唯一 62px squircle（index.css）
 *     [data-app-frame-content] z-0  Tab 业务；矩形 overflow:hidden，困住 transform 层
 *     [data-app-frame-overlays]     APP_Z_OVERLAY + isolation；见 prop frameOverlays
 *     HomeIndicator                 APP_Z_HOME_INDICATOR
 *     SoftKeyboardHost
 *
 * Portaled `TUXSheet` must use `appFrameSheetChromeProps()` (`APP_Z_SHEET`) so
 * default z-index 2000 does not paint over shell chrome — see `TUX_SHEET.md`.
 *
 * - Tab 业务 → `children`（content 内）。全屏浮层（Add to story）→ `frameOverlays`
 *   （仍在 AppFrame 内、content 外）。`App.tsx` 示范。
 * - 勿在业务页再套 62px border-radius / clip-path。
 *
 * ## 沉浸式铺色（局部 ThemeScope）
 *
 * 1. `useRegisterAppChromeSurfaceTheme("dark"|null)` — 仅桌面顶/底壳层（LIFO）。
 *    细则：`STATUS_BAR.md`。Tab 激活页用 `useTabAppChromeSurfaceTheme`。
 * 2. 不透明背景写在能撑满视口的节点上，优先内联 `backgroundColor: "#000000"`。
 * 3. Tab 深色页（相机）：`relative h-full` + 内层全铺黑；`topInsetCss` 只定位内容。
 * 4. 浮层（Add to story）：滑入根 `absolute inset-0` + 内联 `#000` + `bg-black`。
 * 5. 页内栈子页：见 `find_friends_immersive_shell.tsx`。
 * 6. 嵌在浅色 Tab 时父链铺黑：`FeedSidebarWrapper`（Creation / addToStoryOpen /
 *    Find Friends 沉浸式路由）、`FindFriendsPageContent` 根容器。
 *
 * ## AppFrameContext — top/bottom-inset + keyboard awareness
 *
 * **Safe area 完整规则（三种运行面、Home Tab 行、禁止清单）→ `SAFE_AREA.md`。**
 *
 * The frame owns layout truth for sticky composers, tab bars, sheet footers,
 * feed photo-text frames, etc. Do not re-derive insets in business code.
 *
 *   1. **Top inset** (`--app-frame-top-inset` / `topInsetCss`)
 *      - Real device: `env(safe-area-inset-top)`
 *      - Desagent embed: host `--safe-area-top` via `--app-safe-area-top`; no fake
 *        StatusBar (see `desagent_embed.ts` / `.app-frame-fake-status-bar`)
 *      - Standalone browser sm+ phone frame: fixed 62px (fake StatusBar, `h-15.5`)
 *      Clears status bar only — **not** the Home For You tab row; see
 *      `--home-tabs-below-top` / `resolveHomeFeedTabBottomPx()` in SAFE_AREA.md.
 *   2. **Bottom inset** (`--app-frame-bottom-inset` / `bottomInsetCss`)
 *      - Real device: `max(env(safe-area-inset-bottom), 8px)`
 *      - Desagent embed: host `--safe-area-bottom`; no fake HomeIndicator
 *      - Standalone browser sm+ phone frame: fixed 34px (fake Home Indicator, `h-8.5`)
 *   3. Whether the global soft keyboard is currently presented.
 *   4. Height of the soft-keyboard chrome when open.
 *   5. Top toast offset — `showAppFrameTopToast()` only (`app_frame_top_toast.ts`).
 *
 * App chrome surface themes (see STATUS_BAR.md):
 *
 *   - StatusBar + Home Indicator each keep a LIFO override stack on AppFrame.
 *   - Business screens register via `useRegisterStatusBarSurfaceTheme`,
 *     `useRegisterHomeIndicatorSurfaceTheme`, or `useRegisterAppChromeSurfaceTheme`.
 *   - App shell renders `<AppChromeStatusBar />` only — no route/business branches.
 *
 * Rather than have each surface re-derive these values (and inevitably get
 * one of them wrong — see the previous `pb-[max(env(safe-area-inset-bottom),
 * 8px)]` pattern, which left an 8px fallback on desktop that didn't clear
 * the 34px home indicator), the frame exposes a single context with CSS
 * expressions:
 *
 *   - `topInsetCss`: stable inset for elements anchored to the frame top
 *     (sheet content that should sit below the status bar, squeeze targets
 *     that should stay below the status bar / notch).
 *   - `bottomInsetCss`: stable inset for in-flow elements anchored to the
 *     frame bottom.
 *   - `floatingBottomInsetCss`: same as bottom while the keyboard is down,
 *     collapses to 0px while it is up. Use this on composers that ride
 *     above the keyboard via translateY — the padding-bottom transitions
 *     in lockstep with the slide-up so no phantom gap appears.
 *   6. StatusBar surface theme — desktop fake status bar color scheme.
 *      Defaults to `useTheme().resolvedTheme`; screens override via
 *      `useRegisterStatusBarSurfaceTheme` (LIFO stack, same as bottom chrome).
 *   7. Home Indicator surface theme — the resolved light/dark appearance of
 *      the bottom chrome strip (tab bar + indicator zone). Defaults to the
 *      app-wide `useTheme().resolvedTheme`; pages or Tabbar may override
 *      via `setHomeIndicatorSurfaceTheme` / `useRegisterHomeIndicatorSurfaceTheme`
 *      when a screen uses a fixed or dynamic local theme (e.g. Home tab
 *      `themeOverride: "dark"`, comment sheet theme).
 *
 * The values are exposed as `var(--app-frame-*)` strings backed by CSS
 * custom properties on the frame root, so they react to media queries and
 * the `data-keyboard-open` attribute with zero JS work. Native CSS
 * transitions on the consumer's `padding-bottom` carry the change smoothly.
 * Consumers that need a numeric pixel value (e.g. transform math in a rAF)
 * can read the CSS variable directly with `getComputedStyle(frameEl)
 * .getPropertyValue("--app-frame-top-inset")` and `parseFloat` it.
 * ========================================================================== */

export type AppFrameContextValue = {
  /**
   * CSS expression for the top inset of elements anchored to the frame top
   * (status bar / top safe-area). Does **not** include Home For You tab row —
   * use `--home-tabs-below-top` or `resolveHomeFeedTabBottomPx()` for that.
   * See `SAFE_AREA.md`.
   *
   * Use as `paddingTop` on sheets / overlays that should clear the status
   * bar, or read the resolved pixel value via
   * `parseFloat(getComputedStyle(frameEl).getPropertyValue("--app-frame-top-inset"))`
   * for transform math (e.g. the feed-card "squeeze to thumbnail" effect
   * needs to keep its scaled top edge below the status bar).
   */
  topInsetCss: string;
  /**
   * CSS expression for {@link showAppFrameTopToast} — clears the frame top
   * inset plus 8px. Defined as `--app-frame-top-toast-offset` on the frame
   * root (mobile: safe-area + 8px; desktop phone-frame: 62px + 8px).
   */
  topToastOffsetCss: string;
  /**
   * CSS expression for the bottom inset of in-flow elements anchored to the
   * frame bottom (tab bars, sticky footers, scroll padding-bottom).
   * Resolves to `max(env(safe-area-inset-bottom), 8px)` on mobile and to
   * the 34px desktop home-indicator height on sm+. Not affected by the
   * soft keyboard.
   */
  bottomInsetCss: string;
  /**
   * CSS expression for the bottom inset of *floating* composers / bars
   * that translate up above the soft keyboard. Equals `bottomInsetCss`
   * while the keyboard is down; collapses to `0px` while it is up so the
   * row sits flush against the keys (no gap, no opacity flicker — just a
   * smooth padding transition driven by the consumer).
   */
  floatingBottomInsetCss: string;
  /** True while the global soft keyboard is presented. */
  keyboardOpen: boolean;
  /**
   * Height (in CSS px) of the full soft-keyboard chrome when open — key
   * surface + word-suggestion strip (see {@link getSoftKeyboardPresentedHeight}).
   */
  keyboardSurfaceHeight: number;
  /**
   * Effective color scheme for the desktop StatusBar. Follows the app theme
   * unless a screen registers an override (see `useRegisterStatusBarSurfaceTheme`).
   */
  statusBarSurfaceTheme: ResolvedTheme;
  /**
   * Override StatusBar scheme for fixed/dynamic page chrome. Pass `null` to
   * clear this owner's registration.
   */
  setStatusBarSurfaceTheme: (theme: ResolvedTheme | null, ownerId: string) => void;
  /**
   * Effective theme for the bottom strip where the desktop Home Indicator
   * is drawn. Follows the app theme unless a child overrides it.
   */
  homeIndicatorSurfaceTheme: ResolvedTheme;
  /**
   * Override bottom-strip theme for fixed/dynamic page chrome. Pass `null`
   * to fall back to the app-wide resolved theme.
   */
  setHomeIndicatorSurfaceTheme: (theme: ResolvedTheme | null, ownerId: string) => void;
};

/** Stack entry recording one active caller's surface-theme override. */
type SurfaceThemeEntry = {
  ownerId: string;
  theme: ResolvedTheme;
};

function useSurfaceThemeStack() {
  const [stack, setStack] = useState<readonly SurfaceThemeEntry[]>([]);

  const setSurfaceTheme = useCallback((theme: ResolvedTheme | null, ownerId: string) => {
    setStack((prev) => {
      const without = prev.filter((entry) => entry.ownerId !== ownerId);
      if (theme === null) {
        return without.length === prev.length ? prev : without;
      }
      return [...without, { ownerId, theme }];
    });
  }, []);

  const resolvedOverride =
    stack.length > 0 ? stack[stack.length - 1].theme : null;

  return { setSurfaceTheme, resolvedOverride };
}

const AppFrameContext = createContext<AppFrameContextValue | null>(null);

/**
 * Read the layout truth published by the surrounding {@link AppFrame}.
 * Throws if used outside an `AppFrame` — that's almost always a bug, since
 * the values are meaningless without the frame's CSS variables in scope.
 */
export function useAppFrame() {
  const ctx = useContext(AppFrameContext);
  if (!ctx) {
    throw new Error("useAppFrame must be used inside <AppFrame>");
  }
  return ctx;
}

function useRegisterSurfaceTheme(
  surfaceTheme: ResolvedTheme | null,
  setter: AppFrameContextValue["setStatusBarSurfaceTheme"],
) {
  const ownerId = useId();

  useLayoutEffect(() => {
    setter(surfaceTheme, ownerId);
    return () => setter(null, ownerId);
  }, [ownerId, surfaceTheme, setter]);
}

/**
 * Register the desktop StatusBar color scheme while this component is mounted.
 *
 * - Pass `"dark"` for light chrome on a dark immersive surface (Home, Story).
 * - Pass `null` on unmount (handled automatically) to release the slot.
 * - Last registration on the AppFrame stack wins over Tab defaults.
 *
 * @see STATUS_BAR.md — App chrome surface theme registration
 * @see STATUS_BAR.md — stacking, overlay pattern, compliance checklist
 */
export function useRegisterStatusBarSurfaceTheme(
  surfaceTheme: ResolvedTheme | null,
) {
  const { setStatusBarSurfaceTheme } = useAppFrame();
  useRegisterSurfaceTheme(surfaceTheme, setStatusBarSurfaceTheme);
}

/**
 * Register the Home Indicator bottom-strip theme while this component is mounted.
 *
 * @see STATUS_BAR.md — e.g. comment panel follows `resolvedTheme` when open
 */
export function useRegisterHomeIndicatorSurfaceTheme(
  surfaceTheme: ResolvedTheme | null,
) {
  const { setHomeIndicatorSurfaceTheme } = useAppFrame();
  useRegisterSurfaceTheme(surfaceTheme, setHomeIndicatorSurfaceTheme);
}

/**
 * Register StatusBar and Home Indicator with the same surface theme.
 * Prefer this for full-screen immersive routes (e.g. Inbox Story).
 *
 * @see STATUS_BAR.md
 */
export function useRegisterAppChromeSurfaceTheme(
  surfaceTheme: ResolvedTheme | null,
) {
  useRegisterStatusBarSurfaceTheme(surfaceTheme);
  useRegisterHomeIndicatorSurfaceTheme(surfaceTheme);
}

/**
 * Register desktop StatusBar + Home Indicator for the active Tabbar page.
 * Inactive tabs must pass `null` so hidden mounts do not override the visible
 * tab on the AppFrame LIFO theme stack.
 */
export function useTabAppChromeSurfaceTheme(
  isTabActive: boolean,
  surfaceTheme: ResolvedTheme | null,
) {
  useRegisterAppChromeSurfaceTheme(isTabActive ? surfaceTheme : null);
}

export type AppFrameProps = {
  children?: ReactNode;
  /**
   * Full-frame overlays (Add to story, shell StatusBar, …) rendered as siblings
   * **outside** `[data-app-frame-content]` so they stay above business pages
   * whose transform/backdrop layers can escape a nested overflow clip.
   */
  frameOverlays?: ReactNode;
  backgroundColor?: ColorV2Name;
  desktopTopInset?: boolean;
  desktopTopInsetClassName?: string;
  desktopFrameClassName?: string;
};

const AppFrame = (
  {
    children,
    frameOverlays,
    backgroundColor = "UIPageFlat1",
    desktopTopInset = false,
    desktopTopInsetClassName = "pt-app-frame-top",
    desktopFrameClassName,
  }: AppFrameProps
) => {
  const { isOpen: keyboardOpen } = useSoftKeyboard();
  const keyboardSurfaceHeight = getSoftKeyboardPresentedHeight();
  const { resolvedTheme } = useTheme();
  const {
    setSurfaceTheme: setStatusBarSurfaceTheme,
    resolvedOverride: statusBarOverride,
  } = useSurfaceThemeStack();
  const {
    setSurfaceTheme: setHomeIndicatorSurfaceTheme,
    resolvedOverride: homeIndicatorOverride,
  } = useSurfaceThemeStack();

  const statusBarSurfaceTheme = statusBarOverride ?? resolvedTheme;
  const homeIndicatorSurfaceTheme = homeIndicatorOverride ?? resolvedTheme;

  const standaloneDisplayMode = isStandaloneDisplayMode();

  // Static strings — they reference CSS custom properties defined on the
  // frame root in index.css, so they remain stable across renders and the
  // actual numeric values are resolved per media query / data-attr by CSS.
  const contextValue = useMemo<AppFrameContextValue>(
    () => ({
      topInsetCss: "var(--app-frame-top-inset)",
      topToastOffsetCss: "var(--app-frame-top-toast-offset)",
      bottomInsetCss: "var(--app-frame-bottom-inset)",
      floatingBottomInsetCss: "var(--app-frame-floating-bottom-inset)",
      keyboardOpen,
      keyboardSurfaceHeight,
      statusBarSurfaceTheme,
      setStatusBarSurfaceTheme,
      homeIndicatorSurfaceTheme,
      setHomeIndicatorSurfaceTheme,
    }),
    [
      homeIndicatorSurfaceTheme,
      keyboardOpen,
      keyboardSurfaceHeight,
      setHomeIndicatorSurfaceTheme,
      setStatusBarSurfaceTheme,
      statusBarSurfaceTheme,
    ],
  );

  return (
    <AppFrameContext.Provider value={contextValue}>
      <div
        className={
          standaloneDisplayMode
            ? "absolute inset-0 w-full h-full overflow-hidden"
            : "fixed inset-0 w-full h-full"
        }
        style={{ backgroundColor: "#222222" }}
      >
        <div
          data-app-frame-root="true"
          data-keyboard-open={keyboardOpen ? "true" : "false"}
          style={{ backgroundColor: getColorCSSVar(backgroundColor) }}
          className={[
            // Desktop "phone-frame": centered, fixed-size, with a 62px corner
            // radius and matching overflow clip so the soft keyboard / home
            // indicator / page content all respect the rounded silhouette.
            // Mobile (< sm) stays edge-to-edge with no rounding.
            // Desktop squircle on root (index.css); business content lives in
            // `[data-app-frame-content]` so portaled overlays paint above it.
            "sm:top-1/2 sm:left-1/2 sm:absolute relative w-full h-full sm:-translate-x-1/2 sm:-translate-y-1/2 sm:overflow-hidden",
            desktopFrameClassName ?? "sm:w-100.5 sm:h-218.5",
            desktopTopInset ? desktopTopInsetClassName : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div
            data-app-frame-content="true"
            className="relative z-0 h-full min-h-0 w-full min-w-0 overflow-hidden"
          >
            {children}
          </div>
          {frameOverlays ? (
            <div
              data-app-frame-overlays="true"
              className="pointer-events-none absolute inset-0 min-h-0 w-full"
              style={{ zIndex: APP_Z_OVERLAY, isolation: "isolate" }}
            >
              {frameOverlays}
            </div>
          ) : null}
          <HomeIndicator
            surfaceTheme={homeIndicatorSurfaceTheme}
            className="pointer-events-none absolute inset-x-0 bottom-0"
            style={{ zIndex: APP_Z_HOME_INDICATOR }}
          />
          <SoftKeyboardHost />
        </div>
      </div>
    </AppFrameContext.Provider>
  );
};

export default AppFrame;
