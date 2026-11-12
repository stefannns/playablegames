import { TUXSheet, TUXText, getColorCSSVar } from "@byted-tiktok/tux-web";
import { useRef, useState } from "react";
import { musicStackedSheetChromeProps } from "./music_panel_sheet_chrome";
import type { MusicTrack } from "./music_data";

export type TrimPanelProps = {
  track: MusicTrack;
  visible: boolean;
  onCancel: () => void;
  onDone: () => void;
  /** App-frame root so the sheet stacks above the music panel on desktop. */
  root?: HTMLElement | null;
};

const TRIM_PANEL_TOP_RADIUS = 12;

// Deterministic waveform bar heights (0.15..1).
const BARS = Array.from({ length: 90 }, (_, i) =>
  0.18 + 0.82 * Math.abs(Math.sin(i * 0.9) * 0.6 + Math.cos(i * 0.37) * 0.4),
);
const SEL_WIDTH = 0.74; // selected window as a fraction of the track

/**
 * Music trim panel (Figma node 2779:209516). TUXSheet with "{n}s selected" + time,
 * draggable waveform selection frame, and Cancel/Done.
 */
export function TrimPanel({ visible, onCancel, onDone, root }: TrimPanelProps) {
  const [start, setStart] = useState((1 - SEL_WIDTH) / 2); // 0..(1-SEL_WIDTH)
  const waveRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef(0);

  const clamp = (v: number) => Math.max(0, Math.min(1 - SEL_WIDTH, v));

  const onPointerDown = (e: React.PointerEvent) => {
    const el = waveRef.current;
    if (!el) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect();
    dragOffset.current = (e.clientX - r.left) / r.width - start;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.buttons === 0) return;
    const el = waveRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setStart(clamp((e.clientX - r.left) / r.width - dragOffset.current));
  };

  const ink = getColorCSSVar("UIText1");
  const dim = getColorCSSVar("UIShapeNeutral3");

  if (!root) return null;

  return (
    <TUXSheet
      visible={visible}
      onVisibleChange={(next: boolean) => {
        if (!next) onCancel();
      }}
      {...musicStackedSheetChromeProps({
        root,
        overlayBackgroundColor: "UIImageOverlayBlackA50",
        testId: "edit-music-trim-sheet",
      })}
    >
      <div
        className="flex w-full flex-col overflow-hidden"
        style={{
          backgroundColor: getColorCSSVar("UISheetFlat1"),
          borderTopLeftRadius: TRIM_PANEL_TOP_RADIUS,
          borderTopRightRadius: TRIM_PANEL_TOP_RADIUS,
        }}
      >
        {/* Header — "{n}s selected" + time. */}
        <div className="flex w-full items-center justify-between" style={{ padding: "24px 16px" }}>
          <TUXText as="span" typographyPreset="H4-Regular" color="UIText3">
            15s selected
          </TUXText>
          <div className="flex items-center">
            <TUXText as="span" typographyPreset="H4-Regular" color="UIText1">
              00:17
            </TUXText>
            <TUXText as="span" typographyPreset="P2-Regular" color="UIText3" className="px-px">
              /
            </TUXText>
            <TUXText as="span" typographyPreset="H4-Regular" color="UIText3">
              01:30
            </TUXText>
          </div>
        </div>

        {/* Waveform with a draggable selection frame. */}
        <div className="w-full" style={{ paddingBottom: 12 }}>
          <div
            ref={waveRef}
            className="relative w-full touch-none select-none"
            style={{ height: 89, padding: "0 16px" }}
          >
            <div className="relative h-full w-full">
              <div className="absolute inset-0 flex items-center justify-between">
                {BARS.map((h, i) => {
                  const pos = i / (BARS.length - 1);
                  const selected = pos >= start && pos <= start + SEL_WIDTH;
                  return (
                    <span
                      key={i}
                      style={{
                        width: 2,
                        height: `${h * 56}px`,
                        borderRadius: 2,
                        backgroundColor: selected ? ink : dim,
                        opacity: selected ? 1 : 0.6,
                      }}
                    />
                  );
                })}
              </div>
              <div
                className="absolute top-1/2 -translate-y-1/2 touch-none"
                style={{
                  left: `${start * 100}%`,
                  width: `${SEL_WIDTH * 100}%`,
                  height: 70,
                  border: `2px solid ${getColorCSSVar("UIImageOverlayBlackA80")}`,
                  borderRadius: 12,
                  cursor: "grab",
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
              />
            </div>
          </div>
        </div>

        {/* Nav bar — Cancel / Done. */}
        <div
          className="flex w-full items-center justify-between"
          style={{ height: 52, padding: "4px 14px", color: ink }}
        >
          <button type="button" onClick={onCancel} className="flex h-11 items-center px-2">
            <TUXText as="span" typographyPreset="Headline-Regular" color="UIText1">
              Cancel
            </TUXText>
          </button>
          <button type="button" onClick={onDone} className="flex h-11 items-center px-2">
            <TUXText as="span" typographyPreset="Headline-Semibold" color="UIText1">
              Done
            </TUXText>
          </button>
        </div>

        {/* Home indicator. */}
        <div className="relative w-full" style={{ height: 34 }}>
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full"
            style={{
              bottom: 8,
              width: 140,
              height: 5,
              backgroundColor: getColorCSSVar("UIImageOverlayBlack"),
            }}
          />
        </div>
      </div>
    </TUXSheet>
  );
}
