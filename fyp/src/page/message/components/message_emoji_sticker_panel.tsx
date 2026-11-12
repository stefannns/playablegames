import { getColorCSSVar } from "@byted-tiktok/tux-web";
import {
  TUXIconEmoji,
  TUXIconMagnifyingGlass,
  TUXIconStar,
} from "@byted-tiktok/tux-icons";
import { motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

import tabCover1 from "../../../assets/figma/emoji-panel/tab-cover-1.png";
import tabCover2 from "../../../assets/figma/emoji-panel/tab-cover-2.png";
import tabCover3 from "../../../assets/figma/emoji-panel/tab-cover-3.png";
import tabCover4 from "../../../assets/figma/emoji-panel/tab-cover-4.png";

/**
 * Emoji panel (TTD-22 / F). Restored from the latest Figma `Chat Page > emoji`
 * frame (node 6685:125288): a 52pt top tab bar + vertically-scrolling sectioned
 * grid (Recent used / All Emojis).
 *
 *   ╶──────────╴                ← sheet grabber
 *   🔍  ⭐  😀 │ 🧑 🐱 🐤 🐶      ← top tab bar (search / fav / emoji + set covers)
 *   Recent used                 ← vertically-scrolling sectioned grid
 *   😃 😄 😁 …
 *   All Emojis
 *   😃 😄 😁 …
 *
 * Scope (per design owner): **system Unicode emoji only** — no custom PNG glyphs,
 * no stickers. Only emoji cells are interactive; tapping one appends the glyph to
 * the input (`onInsertEmoji` → input bar `insertText`). The tab bar is purely
 * decorative: search / fav are inert, the emoji tab is pinned to its selected
 * (highlighted) state, and the set covers don't switch sections. Tab switching /
 * scroll-spy / stickers are intentionally not built here.
 */
export interface MessageEmojiStickerPanelProps {
  /** Insert an emoji glyph into the input field (append at end). */
  onInsertEmoji: (emoji: string) => void;
}

// ── Layout constants (Figma `emoji` frame, 390 width) ───────────────────────
const PANEL_H = 384; // emoji frame height (tab bar + scrolling list)
const TAB_BAR_H = 52; // Sticker Bar height
const SECTION_INSET_X = 16; // section left/right padding
const EMOJI_COLS = 8; // 8 columns @ 390 width

const CARD_BG = getColorCSSVar("UIPageFlat1"); // white Sticker List card
const TEXT1 = getColorCSSVar("UIText1");
const TEXT3 = getColorCSSVar("UIText3");
const TAB_ACTIVE_BG = getColorCSSVar("UIShapeNeutral4");
const GRABBER = getColorCSSVar("UIShapeNeutral4");

// ── Emoji data (verbatim from the Figma `All Emojis` grid order) ─────────────
const ALL_EMOJIS = [
  "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "☺️",
  "😊", "😇", "🙂", "🙃", "😉", "😌", "🥰", "😋",
  "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎",
  "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕",
  "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢",
  "😭", "😤", "😠", "😡", "🤯", "😳", "🥵", "🥶",
  "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭",
];

// Recent used — first row of grinning faces (deduped from the design sample).
const RECENT_EMOJIS = ALL_EMOJIS.slice(0, 8);

const SECTIONS: { title: string; emojis: string[] }[] = [
  { title: "Recent used", emojis: RECENT_EMOJIS },
  { title: "All Emojis", emojis: ALL_EMOJIS },
];

// ── Top tab bar — decorative only (no section switching) ─────────────────────
type Tab =
  | { kind: "icon"; icon: ReactNode; active?: boolean }
  | { kind: "cover"; src: string };

const TABS: Tab[] = [
  { kind: "icon", icon: <TUXIconMagnifyingGlass size={24} /> },
  { kind: "icon", icon: <TUXIconStar size={26} /> },
  { kind: "icon", icon: <TUXIconEmoji size={24} />, active: true },
  { kind: "cover", src: tabCover1 },
  { kind: "cover", src: tabCover2 },
  { kind: "cover", src: tabCover3 },
  { kind: "cover", src: tabCover4 },
];

export function MessageEmojiStickerPanel({
  onInsertEmoji,
}: MessageEmojiStickerPanelProps) {
  return (
    <motion.div
      initial={{ height: 0 }}
      animate={{ height: PANEL_H }}
      exit={{ height: 0 }}
      transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
      // `-mx-4` cancels the input-bar container's `px-4` so the panel is
      // full-bleed (screen edge to edge, x=0..390) per Figma `Sticker List`.
      className="-mx-4 flex flex-col overflow-hidden"
    >
      {/* Top tab bar (decorative) */}
      <div
        className="flex shrink-0 items-center gap-5 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ height: TAB_BAR_H }}
      >
        {TABS.map((tab, i) => (
          <div
            key={i}
            className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg"
            style={{
              backgroundColor:
                tab.kind === "icon" && tab.active ? TAB_ACTIVE_BG : "transparent",
              // All tab icons are primary (UIText1) per design — the selected
              // emoji tab is distinguished only by its UIShapeNeutral4 box.
              color: TEXT1,
            }}
          >
            {tab.kind === "cover" ? (
              <img
                src={tab.src}
                alt=""
                className="size-[26px] rounded-md object-cover"
                draggable={false}
              />
            ) : (
              tab.icon
            )}
          </div>
        ))}
      </div>

      {/* Sticker List card — white, top-rounded (16px), with the Figma drop
          shadow (0/6/24, 10% black). Kept separate from the transparent tab bar
          so the shadow elevates only the list, not the tabs. */}
      <div
        className="mt-2 flex min-h-0 flex-1 flex-col rounded-t-2xl"
        style={{ backgroundColor: CARD_BG, boxShadow: "0 6px 24px rgba(0,0,0,0.10)" }}
      >
        {/* Grabber */}
        <div className="flex shrink-0 justify-center py-1.5">
          <span
            className="h-1 w-9 rounded-full"
            style={{ backgroundColor: GRABBER }}
          />
        </div>

        {/* Sectioned, vertically-scrolling emoji grid */}
        <div
          className="min-h-0 flex-1 overflow-y-auto"
          style={{ paddingBottom: 24 }}
        >
          {SECTIONS.map((section) => (
          <div
            key={section.title}
            style={{ paddingLeft: SECTION_INSET_X, paddingRight: SECTION_INSET_X }}
          >
            <div className="pt-3 pb-3 text-[13px] font-medium" style={{ color: TEXT3 }}>
              {section.title}
            </div>
            <div style={emojiGridStyle}>
              {section.emojis.map((glyph, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={glyph}
                  onClick={() => onInsertEmoji(glyph)}
                  className="flex h-[50px] items-center justify-center text-[28px] leading-none active:opacity-50"
                  style={{ color: TEXT1 }}
                >
                  {glyph}
                </button>
              ))}
            </div>
          </div>
        ))}
        </div>
      </div>
    </motion.div>
  );
}

// Match Figma: 28px cells, first flush-left and last flush-right within the
// 16px section inset, equal gaps distributed between (≈19px) — not 1fr columns.
const emojiGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: `repeat(${EMOJI_COLS}, 28px)`,
  justifyContent: "space-between",
};
