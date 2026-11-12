import {
  TUXNavBar,
  TUXNavBarCloseButton,
  TUXSheet,
  TUXText,
  getColorCSSVar,
} from "@byted-tiktok/tux-web";
import { useEffect, useMemo, useState } from "react";
import { appFrameSheetChromeProps } from "../../../../components/sys/app_frame_sheet_chrome";
import { ThemeScope, useTheme } from "../../../../context/theme.tsx";
import { RepostInteractionCell } from "./repost_interaction_cell.tsx";
import {
  avatarFor,
  buildRepostEntries,
  SELF_AVATAR_SLOT,
} from "./repost_interaction_data.ts";

/**
 * Repost public-interaction panel ("repost 公开互动面板"), matching Figma
 * 121:20593. Navigation bar with a 2-line centered title + close, a list whose
 * sheet height adapts to the number of rows (auto, capped at ~73% of frame so
 * long lists scroll), and a bottom composer: when you haven't reposted it shows
 * an "Add to your repost..." pill + a "Repost" button; once reposted it becomes
 * the add-note entry.
 */

const MAX_HEIGHT_RATIO = 0.73;
const HEADER_HEIGHT = 52;
const SHEET_TOP_RADIUS = 26;

function RepostNavBarTitle({
  total,
  followCount,
}: {
  total: number;
  followCount: number;
}) {
  return (
    <div
      className="flex min-w-0 flex-col items-center justify-center text-center"
      style={{ rowGap: 2 }}
    >
      <TUXText
        as="div"
        font="TikTokFont"
        typographyPreset="Headline-Bold"
        color="UIText1"
      >
        Reposts
      </TUXText>
      {total > 0 ? (
        <TUXText
          as="div"
          typographyPreset="P3-Regular"
          color="UIText3"
          className="max-w-full truncate"
        >
          {total} in total, {followCount} from people you follow
        </TUXText>
      ) : null}
    </div>
  );
}

export type RepostInteractionPanelProps = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  root?: HTMLElement | null;
  reposterIds: string[];
  selfNote?: string;
  selfReposted?: boolean;
  onAddNote?: () => void;
  onRemoveRepost?: () => void;
  /** Repost from the panel's bottom CTA (when not yet reposted). */
  onRepost?: () => void;
  /** When false, the sheet renders without its dark overlay (e.g. while the
   *  note composer is raised on top of the panel). Defaults to true. */
  dim?: boolean;
};

function useFrameHeight(root?: HTMLElement | null) {
  const [frameHeight, setFrameHeight] = useState(() =>
    typeof window === "undefined" ? 0 : window.innerHeight,
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const frameEl =
      (root?.closest?.("[data-app-frame-root='true']") as HTMLElement | null) ??
      document.querySelector<HTMLElement>("[data-app-frame-root='true']");
    if (!frameEl) {
      setFrameHeight(window.innerHeight);
      return;
    }
    const update = () => {
      const h = frameEl.getBoundingClientRect().height;
      setFrameHeight(h > 0 ? h : window.innerHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(frameEl);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [root]);
  return frameHeight;
}

export function RepostInteractionPanel({
  visible,
  onVisibleChange,
  root,
  reposterIds,
  selfNote = "",
  selfReposted = false,
  onAddNote,
  onRemoveRepost,
  onRepost,
  dim = true,
}: RepostInteractionPanelProps) {
  const { mode: themeMode } = useTheme();
  const frameHeight = useFrameHeight(root);
  const maxPanelHeight = Math.round(frameHeight * MAX_HEIGHT_RATIO);
  // Single / short repost lists rest at 342pt (per design), then grow with the
  // row count up to the cap, beyond which the list scrolls.
  const minPanelHeight = Math.min(342, maxPanelHeight);
  const listMaxHeight = maxPanelHeight - 120;

  const entries = useMemo(
    () => buildRepostEntries(reposterIds, selfReposted, selfNote),
    [reposterIds, selfReposted, selfNote],
  );
  const total = entries.length;
  const followCount = reposterIds.length;

  return (
    <TUXSheet
      {...appFrameSheetChromeProps()}
      visible={visible}
      onVisibleChange={onVisibleChange}
      root={root}
      position="bottom"
      heightModePreset="auto"
      closeOnOutsideClick
      dragHandle="hidden"
      draggable
      overlayBackgroundColor={dim ? "UIImageOverlayBlackA50" : "transparent"}
      sheetBackgroundColor="UISheetFlat1"
    >
      <ThemeScope mode={themeMode} className="flex flex-col w-full min-h-0">
        <div
          className="flex flex-col w-full min-h-0 overflow-hidden bg-tux-v2-ui-sheet-flat-1"
          style={{
            minHeight: minPanelHeight,
            maxHeight: maxPanelHeight,
            borderTopLeftRadius: SHEET_TOP_RADIUS,
            borderTopRightRadius: SHEET_TOP_RADIUS,
          }}
        >
          <TUXNavBar
            heightPreset={HEADER_HEIGHT}
            showSeparator={false}
            backgroundOpacity={0}
            customTitle={<RepostNavBarTitle total={total} followCount={followCount} />}
            trailing={
              <TUXNavBarCloseButton color="UIText2" onClick={() => onVisibleChange(false)} />
            }
          />

          {/* List — fills the floored panel height, grows with row count,
              capped + scrollable. */}
          <div
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
            style={{ maxHeight: Math.max(160, listMaxHeight) }}
          >
            <div className="pb-1">
              {entries.map((entry) => (
                <RepostInteractionCell
                  key={entry.id}
                  entry={entry}
                  onRemove={
                    entry.isSelf
                      ? () => {
                          onRemoveRepost?.();
                          onVisibleChange(false);
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          </div>

          {/* Bottom composer — hidden once you've added a note, since a note
              can't be edited a second time. */}
          {!(selfReposted && Boolean(selfNote)) ? (
          <div>
            <div className="flex items-center gap-2 px-4 py-2">
              <img
                src={avatarFor(SELF_AVATAR_SLOT, 72)}
                alt="Your avatar"
                className="flex-none rounded-full object-cover"
                style={{ width: 36, height: 36 }}
              />
              {/* Input box — add a note (once) or repost. */}
              <button
                type="button"
                onClick={() => onAddNote?.()}
                className="flex flex-1 items-center px-4 min-w-0 cursor-pointer"
                style={{
                  height: 40,
                  backgroundColor: getColorCSSVar("UIShapeNeutral4"),
                  borderRadius: 9999,
                }}
              >
                <TUXText
                  as="span"
                  className="truncate"
                  style={{
                    fontSize: 15,
                    fontWeight: 400,
                    lineHeight: "19.5px",
                    color: getColorCSSVar("UIText3"),
                  }}
                >
                  Add to your repost...
                </TUXText>
              </button>
              {!selfReposted ? (
                <button
                  type="button"
                  aria-label="Repost"
                  onClick={() => onRepost?.()}
                  className="flex flex-none justify-center items-center cursor-pointer"
                  style={{
                    width: 90,
                    height: 40,
                    borderRadius: 9999,
                    backgroundColor: getColorCSSVar("UIShapePrimary"),
                  }}
                >
                  <TUXText typographyPreset="H4-Semibold" color="UIImageOverlayWhite">
                    Repost
                  </TUXText>
                </button>
              ) : null}
            </div>
            <div className="h-app-frame-bottom" />
          </div>
          ) : (
            <div className="h-app-frame-bottom" />
          )}
        </div>
      </ThemeScope>
    </TUXSheet>
  );
}
