import { useEffect, useState, type CSSProperties } from "react";
import { getColorCSSVar, TUXSheet } from "@byted-tiktok/tux-web";
import {
  TUXIconBookmarkFill,
  TUXIconMagnifyingGlass,
} from "@byted-tiktok/tux-icons";
import { useRegisterHomeIndicatorSurfaceTheme } from "../../../components/sys/app_frame";
import {
  CREATION_EFFECTS_PANEL_CHIP_SURFACE,
  creationEffectsPanelSheetProps,
  creationEffectsPanelSurfaceStyle,
  resolveCreationSheetFrameRoot,
} from "../creation_sheet_chrome";

// ── 16 unique panel-effect images (IDs 0–5 align with dock effects) ───────────
const GRID = [
  { id: 0,  src: "/resource/video_mock/creation-camera/panel-effect-01.png" },
  { id: 1,  src: "/resource/video_mock/creation-camera/panel-effect-02.png" },
  { id: 2,  src: "/resource/video_mock/creation-camera/panel-effect-03.png" },
  { id: 3,  src: "/resource/video_mock/creation-camera/panel-effect-04.png" },
  { id: 4,  src: "/resource/video_mock/creation-camera/panel-effect-05.png" },
  { id: 5,  src: "/resource/video_mock/creation-camera/panel-effect-06.png" },
  { id: 6,  src: "/resource/video_mock/creation-camera/panel-effect-07.png" },
  { id: 7,  src: "/resource/video_mock/creation-camera/panel-effect-08.png" },
  { id: 8,  src: "/resource/video_mock/creation-camera/panel-effect-09.png" },
  { id: 9,  src: "/resource/video_mock/creation-camera/panel-effect-10.png" },
  { id: 10, src: "/resource/video_mock/creation-camera/panel-effect-11.png" },
  { id: 11, src: "/resource/video_mock/creation-camera/panel-effect-12.png" },
  { id: 12, src: "/resource/video_mock/creation-camera/panel-effect-13.png" },
  { id: 13, src: "/resource/video_mock/creation-camera/panel-effect-14.png" },
  { id: 14, src: "/resource/video_mock/creation-camera/panel-effect-15.png" },
  { id: 15, src: "/resource/video_mock/creation-camera/panel-effect-16.png" },
];

const TABS = ["Trending", "New", "Tool", "Hot"];

const IconNoEffect = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="11" r="7.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" />
    <line x1="5.8" y1="5.8" x2="16.2" y2="16.2" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export type CameraEffectsPanelProps = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  selectedEffect: number | null;
  onSelectEffect: (id: number) => void;
  /** App-frame root so the sheet covers the full phone frame on desktop. */
  root?: HTMLElement | null;
};

const CameraEffectsPanel = ({
  visible,
  onVisibleChange,
  selectedEffect,
  onSelectEffect,
  root,
}: CameraEffectsPanelProps) => {
  const [frameRoot, setFrameRoot] = useState<HTMLElement | null>(root ?? null);
  const [activeTab, setActiveTab] = useState(0);

  useRegisterHomeIndicatorSurfaceTheme(visible ? "dark" : null);

  useEffect(() => {
    setFrameRoot(resolveCreationSheetFrameRoot(root));
  }, [root]);

  if (!frameRoot) return null;

  return (
    <TUXSheet
      visible={visible}
      onVisibleChange={onVisibleChange}
      root={frameRoot}
      testId="creation-effects-panel-sheet"
      {...creationEffectsPanelSheetProps()}
    >
      <div className="relative flex w-full flex-col items-start gap-[10px]">
        {/* ── Shutter button — floats 34px above screen bottom (above home indicator) ── */}
        <button
          type="button"
          aria-label="Take photo"
          style={{
            position: "absolute",
            bottom: 34,
            left: "50%",
            transform: "translateX(-50%)",
            width: 52,
            height: 52,
            padding: 0,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "999px",
              border: "3.5px solid var(--tux-v2-color-ui-image-overlay-white)",
              boxSizing: "border-box",
            }}
          />
          <span
            style={{
              width: 42,
              height: 42,
              borderRadius: "999px",
              background: "var(--tux-v2-color-ui-image-overlay-white)",
              display: "block",
            }}
          />
        </button>

        {/* ── Save pill ────────────────────────────────────────────────────── */}
        <div style={{ paddingLeft: 12 }}>
          <button
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              height: 32,
              paddingLeft: 5,
              paddingRight: 8,
              background: getColorCSSVar(CREATION_EFFECTS_PANEL_CHIP_SURFACE),
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
            }}
          >
            <span style={{ display: "inline-flex", color: "white" }}>
              <TUXIconBookmarkFill size={22} />
            </span>
            <span style={{ fontSize: 15, fontWeight: 600, color: "white", lineHeight: "1.3" }}>
              Save
            </span>
          </button>
        </div>

        {/* ── Effect content box ───────────────────────────────────────────── */}
        <div
          style={{
            width: "100%",
            height: 304,
            ...creationEffectsPanelSurfaceStyle,
            borderRadius: "12px 12px 0 0",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Tab bar */}
          <div style={{ height: 52, flexShrink: 0, display: "flex", alignItems: "center", overflow: "hidden" }}>
            <div style={{ display: "flex", gap: 26, alignItems: "center", paddingLeft: 5, paddingRight: 8, flexShrink: 0 }}>
              <div style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconNoEffect />
              </div>
              <span style={{ display: "inline-flex", color: "rgba(255,255,255,0.6)" }}>
                <TUXIconMagnifyingGlass size={26} />
              </span>
            </div>

            <div style={{ flex: 1, minWidth: 0, overflowX: "auto", display: "flex", alignItems: "center", scrollbarWidth: "none" } as CSSProperties}>
              <div style={{ width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ display: "inline-flex", color: "rgba(255,255,255,0.6)" }}>
                  <TUXIconBookmarkFill size={22} />
                </span>
              </div>

              {TABS.map((tab, i) => {
                const sel = i === activeTab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(i)}
                    style={{
                      flexShrink: 0,
                      height: 52,
                      padding: "0 15px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: sel ? "space-between" : "center",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    {sel ? (
                      <>
                        <div style={{ height: 2 }} />
                        <span style={{ fontSize: 15, fontWeight: 600, color: "white", lineHeight: "1.3", whiteSpace: "nowrap" }}>
                          {tab}
                        </span>
                        <div style={{ width: "100%", height: 2, background: "white", borderRadius: 1 }} />
                      </>
                    ) : (
                      <span style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.4)", lineHeight: "1.3", whiteSpace: "nowrap" }}>
                        {tab}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Effects grid — 16 unique cells, only one can be selected */}
          <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" } as CSSProperties}>
            {[0, 1, 2, 3].map((row) => (
              <div key={row} style={{ display: "flex", justifyContent: "space-between", padding: "12px 28px", flexShrink: 0 }}>
                {[0, 1, 2, 3].map((col) => {
                  const cell = GRID[row * 4 + col];
                  const isSelected = cell.id === selectedEffect;
                  return (
                    <button
                      key={cell.id}
                      type="button"
                      onClick={() => onSelectEffect(cell.id % 6)}
                      style={{
                        width: 68,
                        height: 68,
                        borderRadius: isSelected ? 16 : 12,
                        border: `2px solid ${isSelected ? "white" : "transparent"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                        background: "transparent",
                        flexShrink: 0,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ width: 60, height: 60, borderRadius: 10, overflow: "hidden" }}>
                        <img
                          src={cell.src}
                          alt=""
                          draggable={false}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </TUXSheet>
  );
};

export default CameraEffectsPanel;
