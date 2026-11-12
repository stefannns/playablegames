import { TUXButton, TUXTabBar, getColorCSSVar } from "@byted-tiktok/tux-web";
import { TUXIconChevronDownSmallFill } from "@byted-tiktok/tux-icons";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, type CSSProperties } from "react";

import { useAppFrame } from "../../../components/sys/app_frame";
import { showAppFrameTopToast } from "../../../components/sys/app_frame_top_toast";
import { localProfileVideoThumbUrl } from "../../../utils/local_media_placeholder";

/**
 * Album drawer (TTD-23 / G). A modal bottom sheet (dark scrim + slide-up) over
 * the chat: a 3-column photo grid with ordered multi-select badges and a
 * "Send (N)" CTA that drops the chosen photos into the thread as image
 * messages, in pick order.
 *
 *   ▓▓▓▓▓▓▓▓▓▓▓▓   ← dark scrim (fades in)
 *   ╶────╴          ← sheet grabber
 *   All  Videos  Photos
 *   ▦ ▦ ▦          ← 3-col grid, 2px gaps; tap to (de)select
 *   ▦ ▦ ▦            selected → dimmed + numbered red badge
 *   [   Send (3)   ]  ← appears once ≥1 selected
 *
 * iOS restoration notes (mined from `ExposedAlbumThumbnailCell.swift` — the
 * inline strip cell; the full drawer lives in the external TikTokStudio/Album
 * repo so its chrome is defined here):
 *   - selection cap 9, over-limit → toast, no shake / no red  (SelectionState:34)
 *   - selected thumbnail alpha 0.4                            (ThumbnailCell:51)
 *   - badge core color rgb(254,44,85) = #FE2C55               (ThumbnailCell:102)
 *   - badge number 12pt                                       (ThumbnailCell:107)
 *   - badge pop-in ≈ spring(stiffness 500, damping 30)        (per issue)
 * Grid is 3 columns / 2pt gaps per the external StudioAlbum collection view.
 */
export interface MessageAlbumPanelProps {
  /** Send the chosen photos as image messages, in selection order. */
  onSend: (imageSrcs: string[]) => void;
  /** Dismiss the drawer (scrim tap / Send / back). */
  onClose: () => void;
}

// ── iOS-sourced constants ───────────────────────────────────────────────────
const SELECTION_LIMIT = 9; // ExposedAlbumSelectionState.swift:34 (TikTok cap)
const SELECTED_ALPHA = 0.4; // ExposedAlbumThumbnailCell.swift:51
// iOS hardcodes rgb(254,44,85); in TUX that's the semantic `UIShapePrimary`
// token (ExposedAlbumThumbnailCell.swift:102 / #FE2C55) — use the token, not the literal.
const BADGE_RED = getColorCSSVar("UIShapePrimary");
const badgeSpring = { type: "spring", stiffness: 500, damping: 30 } as const;

// ── Layout ──────────────────────────────────────────────────────────────────
const GRID_COLS = 3;
const GRID_GAP = 2; // StudioAlbumAssetListCollectionView.swift:73-76 (2pt)
const PHOTO_COUNT = 30; // mock pool (cycles the local cover placeholders)
const TABS = ["All", "Videos", "Photos"] as const;

const SHEET_BG = getColorCSSVar("UIPageFlat1");
const GRABBER = getColorCSSVar("UIShapeNeutral4");
const TEXT1 = getColorCSSVar("UIText1");
const SCRIM = getColorCSSVar("UIImageOverlayBlackA50");
const BADGE_WHITE = getColorCSSVar("UIImageOverlayWhite");
const PILL_BG = getColorCSSVar("UIShapeNeutral4"); // "Recents" album selector pill

export function MessageAlbumPanel({ onSend, onClose }: MessageAlbumPanelProps) {
  const { floatingBottomInsetCss } = useAppFrame();
  // Ordered selection: index into `photos`, position = badge number − 1.
  const [selected, setSelected] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("All");

  // Stable mock pool — 3:4 local covers, reused as square-cropped album cells.
  const photos = useMemo(
    () =>
      Array.from({ length: PHOTO_COUNT }, (_, i) =>
        localProfileVideoThumbUrl(i + 1),
      ),
    [],
  );

  const toggle = (i: number) => {
    setSelected((prev) => {
      const at = prev.indexOf(i);
      // Deselect → drop it; remaining badges renumber automatically (order = position).
      if (at >= 0) return prev.filter((x) => x !== i);
      // Over the cap: toast only — iOS does not flash red or haptic-buzz here.
      if (prev.length >= SELECTION_LIMIT) {
        showAppFrameTopToast({
          text: `You can select up to ${SELECTION_LIMIT} photos`,
          duration: 1500,
          displayMode: "replace",
        });
        return prev;
      }
      return [...prev, i];
    });
  };

  const handleSend = () => {
    if (selected.length === 0) return;
    onSend(selected.map((i) => photos[i]));
    onClose();
  };

  return (
    <motion.div
      // Scrim covers the whole frame (including nav bar) like the long-press
      // overlay; z below the AppFrame HomeIndicator (2100), above NavBar (1000).
      className="fixed inset-0 z-[1100] flex flex-col justify-end"
      style={{ backgroundColor: SCRIM }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className="flex max-h-[78%] flex-col rounded-t-2xl"
        style={{ backgroundColor: SHEET_BG }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* Grabber */}
        <div className="flex shrink-0 justify-center py-1.5">
          <span
            className="h-1 w-9 rounded-full"
            style={{ backgroundColor: GRABBER }}
          />
        </div>

        {/* "Recents" album selector pill — decorative (single mock album). */}
        <div className="flex shrink-0 justify-center pt-1 pb-3">
          <button
            type="button"
            className="flex items-center gap-1 rounded-full py-2 pl-4 pr-3"
            style={{ backgroundColor: PILL_BG, color: TEXT1 }}
          >
            <span className="text-[17px] font-semibold leading-none">Recents</span>
            <TUXIconChevronDownSmallFill size={18} />
          </button>
        </div>

        {/* Tab bar — TUX equal-width tabs with the native sliding underline.
            Cosmetic only (the mock pool has no video/photo split). */}
        <div className="shrink-0">
          <TUXTabBar
            items={TABS.map((tab) => ({ itemKey: tab, title: tab }))}
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as (typeof TABS)[number])}
            showSeparator={false}
            showFadingEdge={false}
          />
        </div>

        {/* Photo grid */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
              gap: GRID_GAP,
            }}
          >
            {photos.map((src, i) => {
              const order = selected.indexOf(i);
              const isSelected = order >= 0;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggle(i)}
                  aria-label={`Photo ${i + 1}${isSelected ? `, selected ${order + 1}` : ""}`}
                  className="relative aspect-square overflow-hidden"
                >
                  <img
                    src={src}
                    alt=""
                    draggable={false}
                    className="size-full object-cover transition-opacity duration-150"
                    style={{ opacity: isSelected ? SELECTED_ALPHA : 1 }}
                  />
                  <SelectionBadge order={isSelected ? order + 1 : null} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Send CTA — slides in once something is picked. */}
        <AnimatePresence>
          {selected.length > 0 ? (
            <motion.div
              className="shrink-0 px-4 pt-2"
              style={{ paddingBottom: `calc(${floatingBottomInsetCss} + 8px)` }}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            >
              <TUXButton
                text={`Send (${selected.length})`}
                themePreset="primary"
                shapePreset="capsule"
                sizePreset="large"
                smoothRadius
                block
                onClick={handleSend}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

/**
 * Top-right selection badge: a hollow white ring when unselected, a numbered
 * red disc (white ring + #FE2C55 core + 12pt white number) that springs in
 * when picked.
 */
function SelectionBadge({ order }: { order: number | null }) {
  return (
    <span className="pointer-events-none absolute right-2 top-2" style={badgeBox}>
      {/* Unselected baseline — a translucent white disc with a white ring, so it
          stays legible on both bright and dark photos (iOS hollow-circle look). */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          backgroundColor: "rgba(255,255,255,0.28)",
          border: `1.5px solid ${BADGE_WHITE}`,
          boxShadow: "0 0 4px rgba(0,0,0,0.18)",
          opacity: order == null ? 1 : 0,
        }}
      />
      <AnimatePresence>
        {order != null ? (
          <motion.span
            key="filled"
            className="absolute inset-0 flex items-center justify-center rounded-full text-[13px] font-semibold leading-none"
            style={{
              backgroundColor: BADGE_RED,
              color: BADGE_WHITE,
              boxShadow: `0 0 0 1.5px ${BADGE_WHITE}`,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={badgeSpring}
          >
            {order}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}

const badgeBox: CSSProperties = { width: 26, height: 26 };
