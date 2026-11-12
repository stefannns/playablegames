import { colorsV2Rgba, type ColorV2Name } from "@byted-tiktok/tux-color";
import { TUXApp } from "@byted-tiktok/tux-web";
import StatusBar from "../../components/sys/status_bar";
import AppFrame, {
  useRegisterStatusBarSurfaceTheme,
} from "../../components/sys/app_frame";
import RouteSwitcher from "../../components/sys/route_switcher";
import ThemeSwitcher from "../../components/sys/theme_switcher";
import {
  ThemeScope,
  useTheme,
  type ResolvedTheme,
} from "../../context/theme";
import PhotoTextDetailPage from "./photo_text_detail_page";
import type { PhotoTextDetailRouteState } from "./photo_text_detail_route";

function getColorCSSVar(color: ColorV2Name): `var(${string})` {
  return `var(--tux-v2-color-${colorsV2Rgba[color].cssVarName})`;
}

function PhotoTextDetailRoutePageContent({
  pageBackground,
  routeStateOverride,
  showInlineStatusBar,
  visualTheme,
  sourceSurface,
}: {
  pageBackground: string;
  routeStateOverride?: PhotoTextDetailRouteState;
  showInlineStatusBar: boolean;
  visualTheme: ResolvedTheme;
  sourceSurface: "explore" | "for-you";
}) {
  useRegisterStatusBarSurfaceTheme(showInlineStatusBar ? null : visualTheme);

  return (
    <div
      className="flex flex-col h-full min-h-0 bg-tux-v2-ui-page-flat-1"
      style={{ backgroundColor: pageBackground }}
    >
      {showInlineStatusBar ? (
        <StatusBar floating={false} />
      ) : (
        <div className="app-frame-fake-status-bar-spacer h-15.5 shrink-0" aria-hidden />
      )}
      <PhotoTextDetailPage
        routeStateOverride={routeStateOverride}
        visualThemeOverride={visualTheme}
        sourceSurface={sourceSurface}
      />
    </div>
  );
}

export default function PhotoTextDetailRoutePage({
  overlay = false,
  routeStateOverride,
  sourceSurfaceOverride,
}: {
  overlay?: boolean;
  routeStateOverride?: PhotoTextDetailRouteState;
  sourceSurfaceOverride?: "explore" | "for-you";
}) {
  const { resolvedTheme } = useTheme();
  const sourceSurface =
    sourceSurfaceOverride ??
    (typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("exploreDetail") === "1"
      ? "explore"
      : "for-you");
  const visualTheme: ResolvedTheme = resolvedTheme;
  const pageBackground =
    getColorCSSVar("UIPageFlat1");

  if (overlay) {
    return (
      <ThemeScope mode={visualTheme} className="h-full min-h-0">
        <PhotoTextDetailRoutePageContent
          pageBackground={pageBackground}
          routeStateOverride={routeStateOverride}
          showInlineStatusBar={false}
          visualTheme={visualTheme}
          sourceSurface={sourceSurface}
        />
      </ThemeScope>
    );
  }

  return (
    <TUXApp theme={visualTheme} textDirection="ltr" platform="iOS">
      <AppFrame>
        <PhotoTextDetailRoutePageContent
          pageBackground={pageBackground}
          routeStateOverride={routeStateOverride}
          showInlineStatusBar
          visualTheme={visualTheme}
          sourceSurface={sourceSurface}
        />
      </AppFrame>

      <RouteSwitcher />
      <ThemeSwitcher />
    </TUXApp>
  );
}
