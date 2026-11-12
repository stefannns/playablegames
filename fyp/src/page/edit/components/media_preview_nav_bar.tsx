import {
  TUXIconCameraSingleNote,
  TUXIconXMarkSmall,
} from "@byted-tiktok/tux-icons";
import { getColorCSSVar, TUXNavBar } from "@byted-tiktok/tux-web";
import type { CSSProperties } from "react";

import { AppNavBarBackButton } from "../../../components/sys/app_nav_bar_back_button";
import { AppNavBarCloseButton } from "../../../components/sys/app_nav_bar_close_button";
import { ThemeScope } from "../../../context/theme";
import {
  EDIT_CHROME_TOP_OFFSET_PX,
  EDIT_OVERLAY_CAPSULE_RADIUS_CSS,
} from "./edit_chrome.constants.ts";

/** Keeps chrome legible over arbitrary preview content. */
const NAV_ICON_SHADOW = "drop-shadow(0 1px 3px rgba(0, 0, 0, 0.45))";

const ADD_SOUND_PILL_CLASS =
  "flex h-11 min-h-11 max-w-[190px] items-center rounded-full border-0";

type AddSoundNavTitleProps = {
  soundName?: string;
  onClick?: () => void;
  onDismiss?: () => void;
};

function AddSoundNavTitle({ soundName, onClick, onDismiss }: AddSoundNavTitleProps) {
  const overlayWhite = getColorCSSVar("UIImageOverlayWhite");
  const pillStyle: CSSProperties = {
    color: overlayWhite,
    backgroundColor: getColorCSSVar("UIImageOverlayDarkGrayA60"),
    borderRadius: EDIT_OVERLAY_CAPSULE_RADIUS_CSS,
  };

  if (soundName) {
    return (
      <div
        className={[ADD_SOUND_PILL_CLASS, "min-w-32 overflow-hidden"].join(" ")}
        style={pillStyle}
      >
        <button
          type="button"
          aria-label={`Sound: ${soundName}`}
          className="flex min-w-0 flex-1 items-center gap-1 pl-3.5 pr-2"
          style={{ border: "none", background: "transparent", color: overlayWhite }}
          onClick={onClick}
        >
          <TUXIconCameraSingleNote size={16} color={overlayWhite} />
          <span className="min-w-0 flex-1 truncate text-left font-bold leading-[1.3] text-[15px]">
            {soundName}
          </span>
        </button>
        <span
          aria-hidden
          className="h-[18px] w-px shrink-0"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
        />
        <button
          type="button"
          aria-label="Remove sound"
          className="flex h-11 w-10 shrink-0 items-center justify-center"
          style={{ border: "none", background: "transparent", color: overlayWhite }}
          onClick={onDismiss}
        >
          <TUXIconXMarkSmall size={20} color={overlayWhite} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-label="Add sound"
      className={[ADD_SOUND_PILL_CLASS, "gap-1 pl-3.5 pr-[18px]"].join(" ")}
      style={pillStyle}
      onClick={onClick}
    >
      <TUXIconCameraSingleNote size={16} color={overlayWhite} />
      <span className="font-bold leading-[1.3] text-[15px]">Add sound</span>
    </button>
  );
}

export type MediaPreviewNavBarProps = {
  className?: string;
  style?: CSSProperties;
  leading?: "back" | "close";
  onLeading?: (trigger: HTMLElement) => void;
  soundName?: string;
  onSoundClick?: () => void;
  onSoundDismiss?: () => void;
};

/** Immersive camera / edit preview chrome — TUXNavBar row (44px) + centered Add sound. */
export function MediaPreviewNavBar({
  className,
  style,
  leading = "back",
  onLeading,
  soundName,
  onSoundClick,
  onSoundDismiss,
}: MediaPreviewNavBarProps) {
  const overlayWhite = getColorCSSVar("UIImageOverlayWhite");

  const leadingNode =
    leading === "close" ? (
      <AppNavBarCloseButton
        iconColor={overlayWhite}
        style={{ filter: NAV_ICON_SHADOW }}
        onClose={onLeading}
      />
    ) : (
      <AppNavBarBackButton
        onBack={onLeading}
        iconColor={overlayWhite}
        style={{ filter: NAV_ICON_SHADOW }}
      />
    );

  return (
    <div
      className={[
        "pointer-events-none absolute inset-x-0 z-20 h-11",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ top: EDIT_CHROME_TOP_OFFSET_PX, ...style }}
    >
      <ThemeScope mode="dark">
        <TUXNavBar
          heightPreset={44}
          fixed={false}
          backgroundOpacity={0}
          showSeparator={false}
          titleAlign="center"
          leading={
            <div className="pointer-events-auto flex h-11 items-center">
              {leadingNode}
            </div>
          }
          customTitle={
            <div className="pointer-events-auto flex h-11 items-center justify-center">
              <AddSoundNavTitle
                soundName={soundName}
                onClick={onSoundClick}
                onDismiss={onSoundDismiss}
              />
            </div>
          }
        />
      </ThemeScope>
    </div>
  );
}
