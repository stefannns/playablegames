import { useAppFrame } from "../../components/sys/app_frame";
import { CAMERA_TAB_BAR_BOTTOM_OFFSET_PX } from "../edit/components/edit_chrome.constants.ts";
import {
  CreationPrimaryTabBar,
  type CreationPrimaryTabKey,
  type CreationPrimaryTabBarSurface,
} from "./components/creation_primary_tab_bar";
import { type CSSProperties, type ReactNode } from "react";

export function creationPrimaryTabBottomCss(bottomInsetCss: string): string {
  return `calc(${bottomInsetCss} + ${CAMERA_TAB_BAR_BOTTOM_OFFSET_PX}px)`;
}

export type CreationPrimaryTabShellProps = {
  children: ReactNode;
  active: CreationPrimaryTabKey;
  surface: CreationPrimaryTabBarSurface;
  /** Fade out POST · CREATE · LIVE (camera chrome hides on effects panel / wheel). */
  hidden?: boolean;
  onChange: (key: CreationPrimaryTabKey) => void;
  isTabActive?: boolean;
};

/** Single POST · CREATE · LIVE bar shared by camera (POST) and Create hub routes. */
export function CreationPrimaryTabShell({
  children,
  active,
  surface,
  hidden = false,
  onChange,
  isTabActive = true,
}: CreationPrimaryTabShellProps) {
  const { bottomInsetCss } = useAppFrame();
  const tabBarBottomCss = creationPrimaryTabBottomCss(bottomInsetCss);

  const tabBarStyle: CSSProperties = {
    bottom: tabBarBottomCss,
    top: "auto",
    width: "100%",
    opacity: hidden ? 0 : 1,
    pointerEvents: hidden ? "none" : undefined,
    transition: "opacity 180ms ease",
  };

  return (
    <div className="relative h-full min-h-0" data-name="Creation Primary Tab Shell">
      <div className="absolute inset-0 min-h-0">{children}</div>
      <CreationPrimaryTabBar
        active={active}
        onChange={onChange}
        isTabActive={isTabActive}
        surface={surface}
        style={tabBarStyle}
      />
    </div>
  );
}
