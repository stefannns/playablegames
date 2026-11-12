import {
  TUXIconColorArrowDownLeftAndArrowUpRight,
  TUXIconColorArrowUpLeftAndArrowDownRight,
  TUXIconColorBeauty,
  TUXIconColorCast,
  TUXIconColorCollage,
  TUXIconColorFilter,
  TUXIconColorFlashSlash,
  TUXIconColorFlip,
  TUXIconColorTimer,
} from "@byted-tiktok/tux-icons";
import type { ComponentType } from "react";

import {
  CAMERA_SIDEBAR_SCROLL_COLLAPSED_PX,
  CAMERA_SIDEBAR_SCROLL_EXPANDED_PX,
  EDIT_SIDEBAR_ROW_HEIGHT_PX,
} from "../edit/components/edit_chrome.constants.ts";
import {
  EDIT_SIDEBAR_ICON_SIZE,
  type EditSidebarTool,
} from "../edit/components/edit_sidebar";

export type CameraSideToolKey =
  | "flip"
  | "flash-slash"
  | "cast"
  | "timer"
  | "layout"
  | "retouch"
  | "filters"
  | "ratio";

function overlayIcon(Icon: ComponentType<{ size?: number }>, size = EDIT_SIDEBAR_ICON_SIZE) {
  return (
    <span className="relative z-10 inline-flex items-center justify-center">
      <Icon size={size} />
    </span>
  );
}

function staggerTop(index: number) {
  return { top: index * EDIT_SIDEBAR_ROW_HEIGHT_PX };
}

export function buildCameraSidebarTools(options: {
  flipDeg: number;
  usingStaticPreview: boolean;
  /** When true, shows `Arrow_Down_Left_And_Arrow_Up_Right`; otherwise expand icon. */
  ratioAltIcon: boolean;
  onFlip: () => void;
  onToggleRatio: () => void;
  onPickTool?: (key: CameraSideToolKey) => void;
}): {
  compactTools: EditSidebarTool[];
  expandableTools: EditSidebarTool[];
  scrollPanelHeights: { collapsed: number; expanded: number };
} {
  const { flipDeg, usingStaticPreview, ratioAltIcon, onFlip, onToggleRatio, onPickTool } = options;
  const RatioIcon = ratioAltIcon
    ? TUXIconColorArrowDownLeftAndArrowUpRight
    : TUXIconColorArrowUpLeftAndArrowDownRight;

  const compactTools: EditSidebarTool[] = [
    {
      id: "flip",
      label: usingStaticPreview ? "Use live camera" : "Flip camera",
      icon: (
        <span
          className="relative z-10 inline-flex items-center justify-center"
          style={{
            transform: `rotate(${flipDeg}deg)`,
            transition: "transform 320ms cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          <TUXIconColorFlip size={EDIT_SIDEBAR_ICON_SIZE} />
        </span>
      ),
      onClick: onFlip,
    },
    {
      id: "flash-slash",
      label: "Flash off",
      icon: overlayIcon(TUXIconColorFlashSlash),
      onClick: () => onPickTool?.("flash-slash"),
    },
  ];

  const expandableTools: EditSidebarTool[] = [
    {
      id: "cast",
      label: "Cast",
      icon: overlayIcon(TUXIconColorCast),
      stagger: staggerTop(0),
      onClick: () => onPickTool?.("cast"),
    },
    {
      id: "timer",
      label: "Timer",
      icon: overlayIcon(TUXIconColorTimer),
      stagger: staggerTop(1),
      onClick: () => onPickTool?.("timer"),
    },
    {
      id: "layout",
      label: "Layout",
      icon: overlayIcon(TUXIconColorCollage),
      stagger: staggerTop(2),
      onClick: () => onPickTool?.("layout"),
    },
    {
      id: "retouch",
      label: "Retouch",
      icon: overlayIcon(TUXIconColorBeauty),
      stagger: staggerTop(3),
      onClick: () => onPickTool?.("retouch"),
    },
    {
      id: "filters",
      label: "Filters",
      icon: overlayIcon(TUXIconColorFilter),
      stagger: staggerTop(4),
      onClick: () => onPickTool?.("filters"),
    },
    {
      id: "ratio",
      label: "Ratio",
      icon: overlayIcon(RatioIcon),
      stagger: staggerTop(5),
      onClick: onToggleRatio,
    },
  ];

  return {
    compactTools,
    expandableTools,
    scrollPanelHeights: {
      collapsed: CAMERA_SIDEBAR_SCROLL_COLLAPSED_PX,
      expanded: CAMERA_SIDEBAR_SCROLL_EXPANDED_PX,
    },
  };
}
