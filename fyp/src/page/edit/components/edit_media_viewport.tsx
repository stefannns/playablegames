import { cloneElement, isValidElement, useState, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { getColorCSSVar } from "@byted-tiktok/tux-web";

import { useAppFrame } from "../../../components/sys/app_frame";
import {
  EDIT_BOTTOM_CHROME_OFFSET_PX,
  EDIT_MEDIA_ASPECT,
  EDIT_MEDIA_CORNER_RADIUS_PX,
  EDIT_SIDEBAR_TOP_CSS,
} from "./edit_chrome.constants.ts";
import { EditPageNavBar } from "./edit_page_nav_bar.tsx";
import { musicPanelChromeFadeStyle } from "./music_panel/music_panel_chrome_fade.ts";
import { useEditMusicPanelChrome } from "./music_panel/use_edit_music_panel_chrome.tsx";
import { EditSidebarBackdrop } from "./edit_sidebar/edit_sidebar_backdrop.tsx";
import type { EditSidebarProps } from "./edit_sidebar/edit_sidebar.types.ts";

export {
  EDIT_CHROME_TOP_OFFSET_PX,
  EDIT_MEDIA_ASPECT,
  EDIT_MEDIA_CORNER_RADIUS_PX,
} from "./edit_chrome.constants.ts";

type EditMediaViewportProps = {
  /** When omitted, preview uses {@link getColorCSSVar} `UIShapeNeutral4` fill. */
  mediaSrc?: string | null;
  mediaAlt?: string;
  /** Custom preview body; overrides the default single-image preview. */
  mediaContent?: ReactNode;
  /** Overlay on preview (sidebar, panels, …). */
  children?: ReactNode;
  /** Right edit toolbar; rendered above other overlays. */
  sidebar?: ReactNode;
  /** Anchored to frame bottom: safe-area inset + 4px. */
  bottomActions?: ReactNode;
  /** Preview image corner radius (px). Defaults to {@link EDIT_MEDIA_CORNER_RADIUS_PX}. */
  mediaCornerRadiusPx?: number;
  /** Repositions the preview inside the 9:16 area (nav stays on top), e.g. to match another page's stage. */
  mediaFrameStyle?: CSSProperties;
  onBack?: (trigger: HTMLElement) => void;
  /**
   * Reserve {@link AppFrame} top inset on this viewport. Set false when a parent
   * already clears the status bar (standalone edit route `StatusBar` row).
   */
  reserveFrameTopInset?: boolean;
};

/**
 * StatusBar 下方同一内容区：画面与 NavBar 顶边对齐（叠放，非上下排列）。
 * Sidebar + gradient scrim span the full page height (through bottom actions).
 */
export function EditMediaViewport({
  mediaSrc = null,
  mediaAlt = "Edit preview",
  mediaContent,
  children,
  sidebar,
  bottomActions,
  mediaCornerRadiusPx = EDIT_MEDIA_CORNER_RADIUS_PX,
  mediaFrameStyle,
  onBack,
  reserveFrameTopInset = true,
}: EditMediaViewportProps) {
  const { topInsetCss } = useAppFrame();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const { soundNavProps, musicPanelOverlay, soundChromeFaded } = useEditMusicPanelChrome();
  const chromeFade = musicPanelChromeFadeStyle(soundChromeFaded);

  const sidebarNode =
    sidebar && isValidElement(sidebar)
      ? cloneElement(sidebar as ReactElement<EditSidebarProps>, {
          onExpandedChange: setSidebarExpanded,
          toolTopCss: EDIT_SIDEBAR_TOP_CSS,
        })
      : sidebar;

  return (
    <div
      className="relative flex h-full min-h-0 w-full flex-col bg-black font-sans text-white"
      style={{
        paddingTop: reserveFrameTopInset ? topInsetCss : undefined,
      }}
    >
      <div
        className="relative w-full shrink-0 overflow-hidden"
        style={{ aspectRatio: EDIT_MEDIA_ASPECT }}
      >
        <div
          className="absolute inset-0 overflow-hidden"
          data-electron-smooth-corner
          style={{
            borderRadius: mediaCornerRadiusPx,
            backgroundColor: mediaSrc || mediaContent ? undefined : getColorCSSVar("UIShapeNeutral4"),
            ...mediaFrameStyle,
          }}
        >
          {mediaContent ?? (mediaSrc ? (
            <img
              src={mediaSrc}
              alt={mediaAlt}
              draggable={false}
              className="app-no-img-drag absolute inset-0 size-full object-cover object-top"
            />
          ) : null)}
        </div>
        <EditPageNavBar
          className="z-30"
          style={chromeFade}
          onBack={onBack}
          {...soundNavProps}
        />
        {children ? (
          <div
            className="pointer-events-none absolute inset-0 z-20 w-full"
            style={chromeFade}
          >
            {children}
          </div>
        ) : null}
      </div>
      <div className="pointer-events-none min-h-0 flex-1 bg-black" aria-hidden />
      {sidebar ? (
        <div
          className="pointer-events-none absolute inset-x-0 z-30 overflow-visible"
          style={{
            top: reserveFrameTopInset ? topInsetCss : 0,
            bottom: "calc(-1 * var(--app-frame-bottom-inset, 0px))",
            ...chromeFade,
          }}
        >
          <EditSidebarBackdrop visible={sidebarExpanded} />
          <div className="relative size-full">{sidebarNode}</div>
        </div>
      ) : null}
      {bottomActions ? (
        <div
          className="pointer-events-none absolute inset-x-0 z-20 flex justify-center"
          style={{
            bottom: `calc(var(--app-frame-bottom-inset) + ${EDIT_BOTTOM_CHROME_OFFSET_PX}px)`,
            ...chromeFade,
          }}
        >
          <div className="pointer-events-auto min-w-0 w-full">{bottomActions}</div>
        </div>
      ) : null}
      {musicPanelOverlay}
    </div>
  );
}
