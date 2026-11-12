import { TUXSheet, TUXText, getColorCSSVar } from "@byted-tiktok/tux-web";
import { IconMicrophone, IconSpeaker2LTR } from "@byted-tiktok/tux-icons";
import { useRef, useState, type ComponentType, type SVGProps } from "react";
import { musicStackedSheetChromeProps } from "./music_panel_sheet_chrome";

export type VolumePanelProps = {
  visible: boolean;
  onDone: () => void;
  /** App-frame root so the sheet is clipped to the phone frame on desktop. */
  root?: HTMLElement | null;
};

const VOLUME_PANEL_TOP_RADIUS = 12;

/** Volume slider — Figma node 340:53291: 46px track (UIShapeNeutral4, r8), pink
 *  fill (UIShapePrimary), white 16px knob at the fill edge. Draggable. */
function VolumeSlider({ defaultValue }: { defaultValue: number }) {
  const [value, setValue] = useState(defaultValue);
  const trackRef = useRef<HTMLDivElement>(null);

  const setFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setValue(Math.max(0, Math.min(1, (clientX - r.left) / r.width)));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromClientX(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.buttons === 0) return;
    setFromClientX(e.clientX);
  };

  const pct = `${Math.round(value * 1000) / 10}%`;
  return (
    <div
      ref={trackRef}
      className="relative w-full touch-none"
      style={{ height: 46, borderRadius: 8, backgroundColor: getColorCSSVar("UIShapeNeutral4") }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
    >
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{ width: pct, backgroundColor: getColorCSSVar("UIShapePrimary"), borderRadius: "8px 0 0 8px" }}
      />
      <div
        className="absolute top-0 bottom-0 -translate-x-1/2"
        style={{
          left: pct,
          width: 16,
          backgroundColor: getColorCSSVar("UIShapeText1OnPrimary"),
          borderRadius: 999,
          border: `0.5px solid ${getColorCSSVar("UIShapeNeutral4")}`,
          boxShadow: "0 1px 2.5px rgba(0,0,0,0.2)",
        }}
      />
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  defaultValue,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  defaultValue: number;
}) {
  return (
    <div className="flex w-full flex-col" style={{ gap: 12, padding: "0 16px" }}>
      <div className="flex items-center" style={{ gap: 6, color: getColorCSSVar("UIText1") }}>
        <Icon width={20} height={20} />
        <TUXText as="span" typographyPreset="Headline-Semibold" color="UIText1">
          {label}
        </TUXText>
      </div>
      <VolumeSlider defaultValue={defaultValue} />
    </div>
  );
}

/**
 * Volume mixing panel (Figma node 333:47473 / 340:53284). TUXSheet with Done
 * and two volume sliders: Original (mic) + Sound (speaker).
 */
export function VolumePanel({ visible, onDone, root }: VolumePanelProps) {
  if (!root) return null;

  return (
    <TUXSheet
      visible={visible}
      onVisibleChange={(next: boolean) => {
        if (!next) onDone();
      }}
      {...musicStackedSheetChromeProps({
        root,
        overlayBackgroundColor: "transparent",
        testId: "edit-music-volume-sheet",
      })}
    >
      <div
        className="flex w-full flex-col overflow-hidden pb-2"
        style={{
          backgroundColor: getColorCSSVar("UISheetFlat1"),
          borderTopLeftRadius: VOLUME_PANEL_TOP_RADIUS,
          borderTopRightRadius: VOLUME_PANEL_TOP_RADIUS,
        }}
      >
        {/* Nav bar — "Done" (Headline-Medium) on the right. */}
        <div className="flex w-full items-center justify-end" style={{ height: 52, padding: "4px 6px" }}>
          <button
            type="button"
            onClick={onDone}
            className="flex h-11 items-center justify-center"
            style={{ padding: "0 8px" }}
          >
            <TUXText as="span" typographyPreset="Headline-Semibold" color="UIText1">
              Done
            </TUXText>
          </button>
        </div>

        {/* Two volume sliders. */}
        <div className="flex w-full flex-col" style={{ gap: 28, paddingTop: 10, paddingBottom: 40 }}>
          <Row icon={IconMicrophone} label="Original" defaultValue={0.5} />
          <Row icon={IconSpeaker2LTR} label="Sound" defaultValue={0.497} />
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
