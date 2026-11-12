import { TUXNavBar, TUXText, getColorCSSVar } from "@byted-tiktok/tux-web";
import { type CSSProperties } from "react";

import { AppNavBarCloseButton } from "../../components/sys/app_nav_bar_close_button";
import type { CreationPrimaryTabKey } from "./components/creation_primary_tab_bar";

const LIVE_PAGE_ROOT_CLASS =
  "box-border flex h-full min-h-0 w-full flex-col text-tux-v2-ui-text-1 pt-[var(--app-frame-top-inset)]";

const LIVE_PAGE_ROOT_STYLE: CSSProperties = {
  backgroundColor: getColorCSSVar("UIPageFlat1"),
};

export type CreationLiveTabPageProps = {
  onClose: (trigger?: HTMLElement) => void;
  /** Shell-owned bottom tab — reserve space above POST · CREATE · LIVE. */
  embedded?: boolean;
  onRequestPrimaryTab?: (tab: CreationPrimaryTabKey) => void;
  bottomChromeInsetCss?: string;
};

/** Routed Live hub placeholder — URL `/app/creation/live`. */
export default function CreationLiveTabPage({
  onClose,
  embedded = false,
  bottomChromeInsetCss,
}: CreationLiveTabPageProps) {
  return (
    <div
      className={LIVE_PAGE_ROOT_CLASS}
      style={LIVE_PAGE_ROOT_STYLE}
      data-name="Creation Live Tab Page"
    >
      <div className="w-full shrink-0 bg-tux-v2-ui-page-flat-1" data-name="Navigation Bar">
        <TUXNavBar
          heightPreset={44}
          showSeparator={false}
          backgroundColor="UIPageFlat1"
          titleAlign="center"
          leading={
            <div className="flex h-11 items-center">
              <AppNavBarCloseButton
                iconColor={getColorCSSVar("UIText1")}
                onClose={onClose}
              />
            </div>
          }
          customTitle={
            <TUXText typographyPreset="H4-Semibold" color="UIText1">
              LIVE
            </TUXText>
          }
        />
      </div>

      <div
        className="min-h-0 flex-1"
        style={
          embedded && bottomChromeInsetCss
            ? { paddingBottom: `calc(${bottomChromeInsetCss} + 44px)` }
            : undefined
        }
      />
    </div>
  );
}
