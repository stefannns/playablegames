import { type CSSProperties } from "react";
import {
  IMMERSIVE_TOOL_CLOSE_BG,
  IMMERSIVE_TOOL_CLOSE_ICON,
  IMMERSIVE_TOOL_PILL_BG,
} from "../immersive_chrome.constants";
import {
  TUXIconBookmark,
  TUXIconChevronExpand,
  TUXIconXMarkSmall,
} from "@byted-tiktok/tux-icons";

export type CameraAllEffectsBarProps = {
  onClose: () => void;
  onOpenPanel?: () => void;
  style?: CSSProperties;
};

/**
 * Bottom bar shown when an effect is selected.
 * Renders to the right of CameraUploadEntrance (left: 78px = 68px thumb + 10px gap).
 * Figma: "Effect bar" pill (#3a3a3a, r=24) + white X close button.
 */
const CameraAllEffectsBar = ({ onClose, onOpenPanel, style }: CameraAllEffectsBarProps) => {
  return (
    <div
      className="absolute z-30 flex items-center"
      style={{
        height: 64,
        gap: 10,
        ...style,
      }}
    >
      {/* Effect pill: bookmark | All effects | expand — tap opens the panel */}
      <button
        type="button"
        aria-label="Open all effects"
        onClick={onOpenPanel}
        className="flex items-center"
        style={{
          flex: 1,
          minWidth: 0,
          height: 48,
          borderRadius: 24,
          background: IMMERSIVE_TOOL_PILL_BG,
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <span
          className="flex items-center justify-center shrink-0"
          style={{ width: 52, height: 48 }}
        >
          <span style={{ color: "var(--tux-v2-color-ui-image-overlay-white)", display: "inline-flex" }}>
            <TUXIconBookmark size={22} />
          </span>
        </span>

        <span
          className="flex-1 min-w-0 text-center font-bold truncate"
          style={{
            fontSize: 15,
            lineHeight: "130%",
            color: "var(--tux-v2-color-ui-image-overlay-white)",
          }}
        >
          All effects
        </span>

        <span
          className="flex items-center justify-center shrink-0"
          style={{ width: 50, height: 48 }}
        >
          <span style={{ color: "var(--tux-v2-color-ui-image-overlay-white)", display: "inline-flex" }}>
            <TUXIconChevronExpand size={22} />
          </span>
        </span>
      </button>

      {/* Close button: white circle with X — 12px padding on all sides */}
      <div className="flex items-center justify-center shrink-0" style={{ width: 64, height: 64 }}>
        <button
          type="button"
          aria-label="Close effects"
          onClick={onClose}
          className="flex items-center justify-center"
          style={{
            width: 40,
            height: 40,
            borderRadius: "999px",
            background: IMMERSIVE_TOOL_CLOSE_BG,
            border: "none",
            cursor: "pointer",
          }}
        >
          <TUXIconXMarkSmall size={24} color={IMMERSIVE_TOOL_CLOSE_ICON} />
        </button>
      </div>
    </div>
  );
};

export default CameraAllEffectsBar;
