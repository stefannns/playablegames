import { IconChevronLeftOffsetLTR } from "@byted-tiktok/tux-icons";
import type { CSSProperties } from "react";

/** Matches Profile settings / manage posts back control (22×22 offset chevron). */
export const APP_NAV_BAR_BACK_ICON_SIZE = 22;

export type AppNavBarBackButtonProps = {
  onBack?: (trigger: HTMLElement) => void;
  /** When set, passed to the icon (e.g. `getColorCSSVar("UIImageOverlayWhite")` on immersive preview). */
  iconColor?: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * Standard TUX NavBar leading back control — same icon & hit target as Profile sub-pages.
 * 全仓库 TUXNavBar leading 返回应使用本组件（勿混用其它左箭头）。
 * 沉浸式预览可传 `iconColor={getColorCSSVar("UIImageOverlayWhite")}`（见 `edit_page_nav_bar.tsx`）。
 */
export function AppNavBarBackButton({
  onBack,
  iconColor,
  className = "flex h-11 w-10.5 items-center justify-center",
  style,
}: AppNavBarBackButtonProps) {
  return (
    <button
      type="button"
      aria-label="Back"
      className={className}
      style={style}
      onClick={(event) => {
        if (onBack) {
          onBack(event.currentTarget);
          return;
        }
        window.history.back();
      }}
    >
      <IconChevronLeftOffsetLTR
        width={APP_NAV_BAR_BACK_ICON_SIZE}
        height={APP_NAV_BAR_BACK_ICON_SIZE}
        color={iconColor}
      />
    </button>
  );
}
