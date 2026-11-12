import { type CSSProperties } from "react";
import { TUXIconChevronRightLTR, TUXIconColorFlip } from "@byted-tiktok/tux-icons";

import {
  EDIT_SIDEBAR_ICON_COLUMN_WIDTH_PX,
  EDIT_SIDEBAR_ROW_HEIGHT_PX,
} from "../../edit/components/edit_chrome.constants.ts";
import { EDIT_SIDEBAR_ICON_SIZE, EditSidebarToolShadow } from "../../edit/components/edit_sidebar";

// ── Effect metadata (demo values matching Figma) ──────────────────────────────
const EFFECT_META: Record<number, { name: string; creator: string; src: string }> = {
  0: { name: "Chic Cutie",   creator: "titokfilters.co", src: "/resource/video_mock/creation-camera/panel-effect-01.png" },
  1: { name: "Dark Edge",    creator: "effects.ai",      src: "/resource/video_mock/creation-camera/panel-effect-02.png" },
  2: { name: "Dreamy",       creator: "beautycam",       src: "/resource/video_mock/creation-camera/panel-effect-03.png" },
  3: { name: "Golden Hour",  creator: "lightroom.co",    src: "/resource/video_mock/creation-camera/panel-effect-04.png" },
  4: { name: "Vintage",      creator: "retrofilters",    src: "/resource/video_mock/creation-camera/panel-effect-05.png" },
  5: { name: "Neon Glow",   creator: "neoneffects",     src: "/resource/video_mock/creation-camera/panel-effect-06.png" },
};

export type CameraEffectPanelOverlayProps = {
  selectedEffect: number | null;
  style?: CSSProperties;
};

/**
 * Shown inside the camera viewport when the effects panel is open.
 * Contains two absolutely-positioned elements:
 *   - Effect label (top-left at Figma y=70): thumbnail + effect name + creator
 *   - Flip button  (top-right at Figma y=60): flip icon + "Flip" label
 */
const CameraEffectPanelOverlay = ({
  selectedEffect,
  style,
}: CameraEffectPanelOverlayProps) => {
  const meta = selectedEffect !== null ? EFFECT_META[selectedEffect] : null;

  return (
    // Transparent wrapper that covers the camera viewport
    <div
      className="absolute inset-0 z-30 pointer-events-none"
      style={style}
    >
      {/* ── Effect label (top-left) ─────────────────────────────────────────── */}
      {meta && (
        <div
          className="absolute flex flex-col gap-[4px] items-start"
          style={{ top: 70, left: 16 }}
        >
          {/* Effect thumbnail — 40×40, radius 8 */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <img
              src={meta.src}
              alt={meta.name}
              draggable={false}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }}
            />
          </div>

          {/* Effect name + creator */}
          <div className="flex flex-col items-start">
            <span
              className="font-semibold"
              style={{
                fontSize: 15,
                lineHeight: "130%",
                color: "white",
                textShadow: "0 1px 1px rgba(0,0,0,0.12)",
                whiteSpace: "nowrap",
              }}
            >
              {meta.name}
            </span>
            <span className="flex items-center">
              <span
                style={{
                  fontSize: 12,
                  lineHeight: "130%",
                  color: "white",
                  textShadow: "0 1px 1px rgba(0,0,0,0.12)",
                  whiteSpace: "nowrap",
                }}
              >
                Created by: {meta.creator}
              </span>
              <span style={{ color: "white", display: "inline-flex" }}>
                <TUXIconChevronRightLTR size={12} />
              </span>
            </span>
          </div>
        </div>
      )}

      {/* ── Flip button (top-right) ─────────────────────────────────────────── */}
      <div
        className="absolute flex flex-col items-center gap-0.5"
        style={{
          top: 60,
          right: 0,
          width: EDIT_SIDEBAR_ICON_COLUMN_WIDTH_PX,
          paddingTop: 12,
          paddingBottom: 12,
        }}
      >
        <span
          className="relative flex items-center justify-center"
          style={{
            width: EDIT_SIDEBAR_ICON_COLUMN_WIDTH_PX,
            height: EDIT_SIDEBAR_ROW_HEIGHT_PX,
          }}
        >
          <EditSidebarToolShadow />
          <span className="relative z-10 inline-flex">
            <TUXIconColorFlip size={EDIT_SIDEBAR_ICON_SIZE} />
          </span>
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: "rgba(255,255,255,0.75)",
            lineHeight: "1.3",
            letterSpacing: "2.287px",
            textAlign: "center",
            textShadow: "0 1px 1px rgba(0,0,0,0.12)",
          }}
        >
          Flip
        </span>
      </div>
    </div>
  );
};

export default CameraEffectPanelOverlay;
