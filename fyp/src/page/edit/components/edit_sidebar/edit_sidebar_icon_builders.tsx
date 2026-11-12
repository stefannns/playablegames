import {
  TUXIconColorAiAliveTag,
  TUXIconColorArrowTurnUpRight,
  TUXIconColorClosedCaption,
  TUXIconColorCrop,
  TUXIconColorEffect,
  TUXIconColorFilter,
  TUXIconColorGear,
  TUXIconColorImageStackRectangleSparkle,
  TUXIconColorLivePhotoAiGradient,
  TUXIconColorStickerSquare,
  TUXIconColorTemplate,
  TUXIconColorTextLatin,
  TUXIconColorTrack,
  TUXIconColorMicStar,
} from "@byted-tiktok/tux-icons";
import type { ReactNode } from "react";

import type { EditSidebarIconPreset } from "./edit_sidebar.types.ts";

export const EDIT_SIDEBAR_ICON_SIZE = 28;

function editSidebarIconShell(dataName: string, children: ReactNode) {
  return (
    <span
      className="relative z-10 inline-flex size-7 shrink-0 items-center justify-center"
      data-name={dataName}
    >
      {children}
    </span>
  );
}

export function editSidebarAiAliveIcon() {
  return editSidebarIconShell(
    "Icon_Color/Live_Photo_Ai",
    <span className="relative inline-flex">
      <TUXIconColorLivePhotoAiGradient size={EDIT_SIDEBAR_ICON_SIZE} />
      <span
        className="absolute -bottom-1.5 -right-1.5 inline-flex"
        data-name="Icon_Color/Ai_Alive_Tag"
      >
        <TUXIconColorAiAliveTag size={16} />
      </span>
    </span>,
  );
}

export function resolveEditSidebarIcon(preset: EditSidebarIconPreset): ReactNode {
  switch (preset) {
    case "settings":
      return editSidebarIconShell(
        "Icon_Color/Gear",
        <TUXIconColorGear size={EDIT_SIDEBAR_ICON_SIZE} />,
      );
    case "share":
      return editSidebarIconShell(
        "Icon_Color/Arrow_Turn_Up_Right",
        <TUXIconColorArrowTurnUpRight size={EDIT_SIDEBAR_ICON_SIZE} />,
      );
    case "track":
      return editSidebarIconShell(
        "Icon_Color/Track",
        <TUXIconColorTrack size={EDIT_SIDEBAR_ICON_SIZE} />,
      );
    case "templates":
      return editSidebarIconShell(
        "Icon_Color/Template",
        <TUXIconColorTemplate size={EDIT_SIDEBAR_ICON_SIZE} />,
      );
    case "photoTemplates":
      return editSidebarIconShell(
        "Icon_Color/Image_Stack_Rectangle_Sparkle",
        <TUXIconColorImageStackRectangleSparkle size={EDIT_SIDEBAR_ICON_SIZE} />,
      );
    case "text":
      return editSidebarIconShell(
        "Icon_Color/Text_Latin",
        <TUXIconColorTextLatin size={EDIT_SIDEBAR_ICON_SIZE} />,
      );
    case "stickers":
      return editSidebarIconShell(
        "Icon_Color/Sticker_Square",
        <TUXIconColorStickerSquare size={EDIT_SIDEBAR_ICON_SIZE} />,
      );
    case "effects":
      return editSidebarIconShell(
        "Icon_Color/Effect",
        <TUXIconColorEffect size={EDIT_SIDEBAR_ICON_SIZE} />,
      );
    case "filters":
      return editSidebarIconShell(
        "Icon_Color/Filter",
        <TUXIconColorFilter size={EDIT_SIDEBAR_ICON_SIZE} />,
      );
    case "crop":
      return editSidebarIconShell(
        "Icon_Color/Crop",
        <TUXIconColorCrop size={EDIT_SIDEBAR_ICON_SIZE} />,
      );
    case "voice":
      return editSidebarIconShell(
        "Icon_Color/Mic_Star",
        <TUXIconColorMicStar size={EDIT_SIDEBAR_ICON_SIZE} />,
      );
    case "captions":
      return editSidebarIconShell(
        "Icon_Color/Closed_Caption",
        <TUXIconColorClosedCaption size={EDIT_SIDEBAR_ICON_SIZE} />,
      );
    case "aiAlive":
      return editSidebarAiAliveIcon();
    default:
      return null;
  }
}
