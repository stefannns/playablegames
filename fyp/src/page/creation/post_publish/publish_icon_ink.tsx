import { getColorCSSVar } from "@byted-tiktok/tux-web";
import type { ReactNode } from "react";

import { IconInkCss } from "../../../components/icons/icon_ink";
import { PUBLISH_LIST_ICON_COLOR, PUBLISH_MUTED_ICON_COLOR } from "./publish_chrome.constants";

const PUBLISH_OVERLAY_ICON_COLOR = getColorCSSVar("UIImageOverlayWhite");

export function PublishListIconInk({ children }: { children: ReactNode }) {
  return (
    <IconInkCss color={PUBLISH_LIST_ICON_COLOR} className="inline-flex shrink-0 items-center justify-center">
      {children}
    </IconInkCss>
  );
}

export function PublishMutedIconInk({ children }: { children: ReactNode }) {
  return (
    <IconInkCss color={PUBLISH_MUTED_ICON_COLOR} className="inline-flex shrink-0 items-center justify-center">
      {children}
    </IconInkCss>
  );
}

export function PublishOverlayIconInk({ children }: { children: ReactNode }) {
  return (
    <IconInkCss color={PUBLISH_OVERLAY_ICON_COLOR} className="inline-flex shrink-0 items-center justify-center">
      {children}
    </IconInkCss>
  );
}
