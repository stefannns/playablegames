import { getColorCSSVar, TUXText } from "@byted-tiktok/tux-web";
import {
  TUXIconColorAiGroupShot,
  TUXIconColorPhotoswap,
  TUXIconColorSticker,
  TUXIconPlayRectangleFill,
} from "@byted-tiktok/tux-icons";
import type { ReactNode } from "react";

import gameControllerSvg from "../../../assets/figma/action-bar/game_controller_fill.svg?url";
import reactionHeart from "../../../assets/figma/action-bar/reaction-heart.png";
import reactionJoy from "../../../assets/figma/action-bar/reaction-joy.png";
import reactionThumbsup from "../../../assets/figma/action-bar/reaction-thumbsup.png";

/**
 * Quick-action bar above the input pill (Figma `Action Bar`, node 6724:147837 /
 * iOS `ChatActionBarView`). Sits at the very top of the bottom input stack,
 * above the quote-reply bar (iOS `ChatInputStageView.swift:344` orders
 * actionBar → quotePanel → input).
 *
 * Layout mirrors iOS constants: each entry is a 32-tall fully-rounded pill on a
 * `UIShapeNeutral4` (black-5%) fill, items spaced 8px, 12px section inset, the
 * row scrolls horizontally. Emoji pills pad 16/side, labelled feature pills
 * pad 12 + a 4px icon→text gap, text `P1-Regular`.
 *
 * Only the first three (❤️ 😂 👍) are real: tapping one sends it as a sticker
 * (the transparent PNG blown up to the 140px sticker size). Every other entry
 * is a stub → a "Coming soon" top toast.
 */
export type MessageActionBarProps = {
  /** Tap one of the three emoji → send it as a 140px sticker. */
  onSendSticker: (imageSrc: string) => void;
  /** Tap any stub feature → "Coming soon" toast (wired by the parent). */
  onComingSoon: () => void;
};

const PILL_BG = getColorCSSVar("UIShapeNeutral4");
// Share post's Figma tint (#01A1DA cyan). TUX icons' `color` prop only accepts a
// token *name* (it becomes a `text-color-{name}` class) — a raw hex is ignored —
// so we tint via CSS `color` on a wrapper and let `fill: currentColor` inherit
// it. Games is a gradient (`linear-gradient(152deg, #6372F7→#4F5FF7)`) baked
// into its SVG asset, since currentColor can't carry a gradient.
const SHARE_POST_TINT = "#01A1DA";

// The three quick-reaction emoji, sent as stickers. Source PNGs exported from
// the Figma `Action Bar` frame (transparent, oversized so they stay crisp when
// scaled up to the 140px sticker bubble).
const EMOJI: { src: string; label: string }[] = [
  { src: reactionHeart, label: "Heart" },
  { src: reactionJoy, label: "Joy" },
  { src: reactionThumbsup, label: "Thumbs up" },
];

// Remaining iOS action-bar entries — all stubs here. Icon names verified
// against @byted-tiktok/tux-icons; `Color*` icons render their own multi-color,
// the two `*Fill` icons take `UIText1`.
const FEATURES: { icon: ReactNode; label: string }[] = [
  {
    icon: <img src={gameControllerSvg} alt="" width={20} height={20} />,
    label: "Games",
  },
  { icon: <TUXIconColorAiGroupShot size={20} />, label: "Group Shot" },
  { icon: <TUXIconColorPhotoswap size={20} />, label: "Photoswap" },
  {
    icon: (
      <span style={{ display: "inline-flex", color: SHARE_POST_TINT }}>
        <TUXIconPlayRectangleFill size={20} />
      </span>
    ),
    label: "Share post",
  },
  { icon: <TUXIconColorSticker size={20} />, label: "Sticker store" },
];

export function MessageActionBar({
  onSendSticker,
  onComingSoon,
}: MessageActionBarProps) {
  return (
    // The caller's `-mx-4` wrapper cancels the input stack's `px-4` so the row
    // scrolls edge-to-edge; `px-3` re-adds the 12px iOS section inset for the
    // first/last pill.
    <div className="flex gap-2 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {EMOJI.map((e) => (
        <button
          key={e.label}
          type="button"
          aria-label={e.label}
          onClick={() => onSendSticker(e.src)}
          className="flex h-8 shrink-0 items-center rounded-full px-4"
          style={{ backgroundColor: PILL_BG }}
        >
          <img
            src={e.src}
            alt=""
            className="size-5 object-contain"
            draggable={false}
          />
        </button>
      ))}
      {FEATURES.map((f) => (
        <button
          key={f.label}
          type="button"
          aria-label={f.label}
          onClick={onComingSoon}
          className="flex h-8 shrink-0 items-center gap-1 rounded-full px-3"
          style={{ backgroundColor: PILL_BG }}
        >
          {f.icon}
          <TUXText typographyPreset="P1-Regular" color="UIText1">
            {f.label}
          </TUXText>
        </button>
      ))}
    </div>
  );
}
