import { IconXMark } from "@byted-tiktok/tux-icons";
import type { CSSProperties } from "react";

/** Icon/X_Mark — NavBar leading close (Create · Live · camera POST). */
export const APP_NAV_BAR_CLOSE_ICON_SIZE = 24;

export type AppNavBarCloseButtonProps = {
  onClose?: (trigger: HTMLElement) => void;
  iconColor?: string;
  className?: string;
  style?: CSSProperties;
};

/** Standard TUX NavBar leading close — Icon/X_Mark at 24px. */
export function AppNavBarCloseButton({
  onClose,
  iconColor,
  className = "flex h-11 w-10.5 items-center justify-center",
  style,
}: AppNavBarCloseButtonProps) {
  return (
    <button
      type="button"
      aria-label="Close"
      className={className}
      style={style}
      onClick={(event) => onClose?.(event.currentTarget)}
    >
      <IconXMark
        width={APP_NAV_BAR_CLOSE_ICON_SIZE}
        height={APP_NAV_BAR_CLOSE_ICON_SIZE}
        color={iconColor}
      />
    </button>
  );
}
