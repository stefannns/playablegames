import { TUXNavBarCloseButton, TUXSheet, TUXText, getColorCSSVar } from "@byted-tiktok/tux-web";
import {
  Icon3LinesCenterAligned,
  IconArrowTurnUpRight,
  IconBookmark,
  IconBubbleEllipsisRight,
  IconChevronRightLTR,
  IconLike,
  IconMagnifyingGlassFill,
  IconMapThumbtackFill,
  IconPlusSmall,
} from "@byted-tiktok/tux-icons";
import { useEffect, useRef, useState } from "react";
import { appFrameSheetChromeProps } from "../../../../components/sys/app_frame_sheet_chrome";
import { ThemeScope } from "../../../../context/theme";
import { CommentCell } from "../comment_panel/comment_cell";
import type { CommentSheetMetrics } from "../comment_panel";
import { setCommentPanelVisualState } from "../comment_panel/comment_panel_visual_store";
import {
  titlePanelContent,
  titlePanelCommentAvatar,
  type TitlePanelAnchor,
} from "./title_panel.config";

/** TikTok AI "Tako" rainbow-swirl mark — Figma `Tako_Small` bitmap. */
const TAKO_SMALL_SRC = "/resource/icons/tako_small.png";

export type FeedTitlePanelProps = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  root?: HTMLElement | null;
  /** Mirrors CommentPanel — drives the underlying feed "video squeeze". */
  onMetricsChange?: (metrics: CommentSheetMetrics) => void;
};

const SHEET_TEST_ID = "title-panel-sheet";

const OFF_SHEET_METRICS: CommentSheetMetrics = {
  visible: false,
  isDragging: false,
  dismissProgress: 0,
  sheetTopY: 0,
  frameHeight: 0,
};

/**
 * Feed "Title Panel" — restored from Figma node 7024:393679.
 *
 * A bottom sheet that slides over the feed showing the post caption, search /
 * POI anchors, an AI overview card, and the comment list, with a docked
 * comment composer + engagement bar. Mechanics (fixed ~73% height,
 * drag-to-close, per-frame metrics that drive the feed squeeze) mirror the
 * sibling {@link CommentPanel}.
 */
export function FeedTitlePanel({
  visible,
  onVisibleChange,
  root,
  onMetricsChange,
}: FeedTitlePanelProps) {
  const content = titlePanelContent;
  const panelSurfaceRef = useRef<HTMLDivElement | null>(null);

  const [frameHeight, setFrameHeight] = useState(() =>
    typeof window === "undefined" ? 0 : window.innerHeight,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const frameElement =
      root?.closest?.("[data-app-frame-root='true']") ??
      document.querySelector<HTMLElement>("[data-app-frame-root='true']");
    if (!frameElement) {
      setFrameHeight(window.innerHeight);
      return;
    }
    const update = () => {
      const next = frameElement.getBoundingClientRect().height;
      setFrameHeight(next > 0 ? next : window.innerHeight);
    };
    update();
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(frameElement);
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, [root]);

  const sheetHeightPx = Math.round(frameHeight * 0.73);
  const closeDistancePx = Math.max(40, Math.min(96, frameHeight * 0.1));

  /* ------------------------------------------------------------------ *
   * Publish the sheet's frame-relative top edge each frame so the feed
   * card can squeeze its video into the slice above the sheet (see
   * FeedItemCard.handleCommentMetrics). Self-terminates after the sheet
   * slides fully off-screen on close.
   * ------------------------------------------------------------------ */
  const rafIdRef = useRef<number | null>(null);
  const onMetricsChangeRef = useRef(onMetricsChange);
  onMetricsChangeRef.current = onMetricsChange;
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  useEffect(() => {
    if (!visible || rafIdRef.current != null) return;
    const tick = () => {
      const contentEl = panelSurfaceRef.current;
      const frameEl =
        (root?.closest?.("[data-app-frame-root='true']") as HTMLElement | null) ??
        document.querySelector<HTMLElement>("[data-app-frame-root='true']") ??
        document.documentElement;
      const isVisible = visibleRef.current;

      // The sheet content can leave the DOM the instant it closes (e.g. an
      // outside-click dismiss unmounts it without a tracked slide-out). When
      // that happens while we're closing, the squeeze must still be released
      // — otherwise the feed card stays frozen at its shrunk size. Report a
      // final off-screen frame and stop.
      if (!contentEl || !contentEl.isConnected || !frameEl) {
        if (!isVisible) {
          onMetricsChangeRef.current?.(OFF_SHEET_METRICS);
          rafIdRef.current = null;
          return;
        }
        rafIdRef.current = requestAnimationFrame(tick);
        return;
      }

      const rect = contentEl.getBoundingClientRect();
      const frameRect = frameEl.getBoundingClientRect();
      const sheetTopY = rect.top - frameRect.top;
      const frameHeightPx = frameRect.height;
      const stillOnScreen = sheetTopY < frameHeightPx - 1;
      onMetricsChangeRef.current?.({
        visible: isVisible || stillOnScreen,
        isDragging: false,
        dismissProgress: 0,
        sheetTopY,
        frameHeight: frameHeightPx,
      });
      if (!isVisible && !stillOnScreen) {
        rafIdRef.current = null;
        return;
      }
      rafIdRef.current = requestAnimationFrame(tick);
    };
    rafIdRef.current = requestAnimationFrame(tick);
  }, [visible, root]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      onMetricsChangeRef.current?.(OFF_SHEET_METRICS);
    };
  }, []);

  // Hide the home feed chrome (top tabs + tab bar) while the panel is open,
  // reusing the shared visual store the comment sheet already drives.
  useEffect(() => {
    setCommentPanelVisualState({ isOpen: visible, isExpanded: false });
    return () => setCommentPanelVisualState({ isOpen: false, isExpanded: false });
  }, [visible]);

  /* ------------------------------------------------------------------ *
   * Drag-to-close on the nav bar. Shrinking a bottom-anchored sheet moves
   * its top edge down, so dragging down past `closeDistancePx` (or with
   * enough downward velocity) dismisses it; otherwise it snaps back.
   * ------------------------------------------------------------------ */
  const cleanupRef = useRef<(() => void) | null>(null);
  const dragRef = useRef({
    pointerId: null as number | null,
    startY: 0,
    startHeight: 0,
    lastY: 0,
    lastTime: 0,
    velocity: 0,
    active: false,
  });

  const getSheetContainer = () =>
    typeof document === "undefined"
      ? null
      : document.querySelector<HTMLElement>(`[data-testid="${SHEET_TEST_ID}"]`);

  const setContainerHeight = (heightPx: number) => {
    const container = getSheetContainer();
    if (container) container.style.height = `${Math.max(0, Math.round(heightPx))}px`;
  };
  const setContainerTransition = (enabled: boolean) => {
    const container = getSheetContainer();
    if (container) {
      container.style.transition = enabled
        ? "height 320ms cubic-bezier(0.33, 0.86, 0.2, 1)"
        : "none";
    }
  };

  const onNavBarPointerDownCapture = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!visible) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const target = event.target as Element | null;
    if (target?.closest?.("[data-titlebar-action='true']")) return;

    const drag = dragRef.current;
    drag.pointerId = event.pointerId;
    drag.startY = event.clientY;
    drag.startHeight = sheetHeightPx;
    drag.lastY = event.clientY;
    drag.lastTime = performance.now();
    drag.velocity = 0;
    drag.active = false;

    const handleMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== drag.pointerId) return;
      const dy = moveEvent.clientY - drag.startY;
      if (!drag.active) {
        if (Math.abs(dy) < 6) return;
        drag.active = true;
        setContainerTransition(false);
      }
      const next = drag.startHeight - dy;
      const clamped = next > sheetHeightPx ? sheetHeightPx + (next - sheetHeightPx) * 0.2 : next;
      const now = performance.now();
      const dt = (now - drag.lastTime) / 1000;
      if (dt > 0) {
        drag.velocity = (moveEvent.clientY - drag.lastY) / dt;
        drag.lastY = moveEvent.clientY;
        drag.lastTime = now;
      }
      setContainerHeight(clamped);
    };

    const handleUp = (upEvent: PointerEvent | FocusEvent) => {
      if ("pointerId" in upEvent && upEvent.pointerId !== drag.pointerId) return;
      cleanupRef.current?.();
      cleanupRef.current = null;
      const wasActive = drag.active;
      drag.pointerId = null;
      drag.active = false;
      if (!wasActive) return;

      setContainerTransition(true);
      const draggedDown = drag.startY < drag.lastY ? drag.lastY - drag.startY : 0;
      const shouldClose = draggedDown >= closeDistancePx || drag.velocity > 1200;
      if (shouldClose) {
        onVisibleChange(false);
        return;
      }
      setContainerHeight(sheetHeightPx);
    };

    cleanupRef.current?.();
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    window.addEventListener("blur", handleUp);
    cleanupRef.current = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
      window.removeEventListener("blur", handleUp);
    };
  };

  useEffect(() => () => cleanupRef.current?.(), []);

  return (
    <TUXSheet
      {...appFrameSheetChromeProps()}
      visible={visible}
      onVisibleChange={onVisibleChange}
      root={root}
      position="bottom"
      heightModePreset="fixed"
      height={`${sheetHeightPx}px`}
      closeOnOutsideClick
      dragHandle="hidden"
      draggable={false}
      overlayBackgroundColor="UIImageOverlayBlackA50"
      sheetBackgroundColor="transparent"
      testId={SHEET_TEST_ID}
    >
      <ThemeScope mode="light" className="flex flex-col w-full h-full min-h-0">
        <div
          ref={panelSurfaceRef}
          data-no-long-press="true"
          className="flex flex-col w-full h-full min-h-0 overflow-hidden"
          style={{
            backgroundColor: getColorCSSVar("UISheetFlat1"),
            borderTopLeftRadius: 26,
            borderTopRightRadius: 26,
          }}
        >
          <TitlePanelNavBar
            author={content.author}
            onClose={() => onVisibleChange(false)}
            onPointerDownCapture={onNavBarPointerDownCapture}
          />

          <div className="flex-1 min-h-0 overflow-hidden">
            <div className="h-full overflow-y-auto overscroll-contain">
              <CaptionBlock content={content} />
              <AiOverviewCard overview={content.aiOverview} />
              <CommentsHeader label={content.commentCountLabel} />
              <div>
                {content.comments.map((comment) => (
                  <CommentCell
                    key={comment.id}
                    avatarSrc={titlePanelCommentAvatar(comment.id)}
                    username={comment.authorName}
                    creatorLabel={comment.creatorLabel}
                    content={comment.content}
                    timeLabel={comment.timeLabel}
                    likeCountLabel={comment.likeCountLabel}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="relative">
            <AskAiPill />
            <BottomActionBar content={content} />
          </div>
        </div>
      </ThemeScope>
    </TUXSheet>
  );
}

function TitlePanelNavBar({
  author,
  onClose,
  onPointerDownCapture,
}: {
  author: { name: string; avatarSrc: string };
  onClose: () => void;
  onPointerDownCapture: (event: React.PointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      className="relative flex w-full items-center select-none"
      style={{
        touchAction: "none",
        backgroundColor: getColorCSSVar("UISheetFlat1"),
        height: 52,
      }}
      onPointerDownCapture={onPointerDownCapture}
    >
      <div className="flex items-center gap-2 pl-4">
        <img
          src={author.avatarSrc}
          alt=""
          className="rounded-full w-7 h-7 object-cover"
          loading="eager"
        />
        <div className="flex items-center gap-1">
          <TUXText
            as="span"
            style={{
              fontSize: 13,
              fontWeight: 500,
              lineHeight: "16.9px",
              color: getColorCSSVar("UIText2"),
              whiteSpace: "nowrap",
            }}
          >
            {author.name}
          </TUXText>
          <button
            type="button"
            aria-label="Follow"
            data-titlebar-action="true"
            className="flex items-center bg-transparent border-0 p-0"
          >
            <IconPlusSmall
              width={14}
              height={14}
              style={{ color: getColorCSSVar("UITextPrimaryDisplay") }}
            />
            <TUXText
              as="span"
              style={{
                fontSize: 13,
                fontWeight: 600,
                lineHeight: "16.9px",
                color: getColorCSSVar("UITextPrimaryDisplay"),
              }}
            >
              Follow
            </TUXText>
          </button>
        </div>
      </div>

      <div className="flex items-center ml-auto pr-2">
        <TUXNavBarCloseButton color="UIText2" onClick={onClose} />
      </div>
    </div>
  );
}

function CaptionBlock({ content }: { content: typeof titlePanelContent }) {
  return (
    <div
      className="flex flex-col gap-2 px-4 pt-1 pb-1.5"
      style={{ backgroundColor: getColorCSSVar("UISheetFlat1") }}
    >
      <div className="flex flex-col gap-2">
        <TUXText
          as="div"
          style={{ fontSize: 15, lineHeight: "21px", wordBreak: "break-word" }}
        >
          <span style={{ fontWeight: 400, color: getColorCSSVar("UIText1") }}>
            {content.caption.text}
          </span>
          <span style={{ fontWeight: 500, color: getColorCSSVar("UITextInfo") }}>
            {content.caption.hashtag}
          </span>
        </TUXText>

        <div className="flex items-center gap-3">
          <TUXText
            as="span"
            style={{
              fontSize: 13,
              fontWeight: 400,
              lineHeight: "16.9px",
              color: getColorCSSVar("UIText3"),
            }}
          >
            {content.caption.dateLabel}
          </TUXText>
          <TUXText
            as="span"
            style={{
              fontSize: 13,
              fontWeight: 500,
              lineHeight: "16.9px",
              color: getColorCSSVar("UIText1"),
            }}
          >
            {content.caption.translationLabel}
          </TUXText>
        </div>
      </div>

      <div className="flex items-start gap-2">
        {content.anchors.map((anchor, index) => (
          <AnchorPill key={index} anchor={anchor} />
        ))}
      </div>
    </div>
  );
}

function AnchorPill({ anchor }: { anchor: TitlePanelAnchor }) {
  const isSearch = anchor.kind === "search";
  return (
    <div
      className="relative flex items-center gap-1 shrink-0"
      style={{
        backgroundColor: getColorCSSVar("UIShapeNeutral4"),
        borderRadius: 4,
        // Search pill reserves room on the right for the floating magnifier.
        padding: isSearch ? "4.5px 17px 4.5px 6px" : "4.5px 6px",
        maxWidth: "100%",
      }}
    >
      {isSearch ? (
        <>
          <TUXText
            as="span"
            style={{
              fontSize: 13,
              fontWeight: 600,
              lineHeight: "16.9px",
              color: getColorCSSVar("UIText3"),
            }}
          >
            {anchor.label}
          </TUXText>
          <TUXText
            as="span"
            style={{
              fontSize: 13,
              fontWeight: 600,
              lineHeight: "16.9px",
              color: getColorCSSVar("UIText1"),
            }}
          >
            {anchor.query}
          </TUXText>
          <IconMagnifyingGlassFill
            width={9}
            height={9}
            style={{
              position: "absolute",
              top: 5,
              right: 6,
              color: getColorCSSVar("UIText1"),
            }}
          />
        </>
      ) : (
        <>
          <IconMapThumbtackFill
            width={13}
            height={13}
            style={{ color: getColorCSSVar("UIText3") }}
          />
          <TUXText
            as="span"
            style={{
              fontSize: 13,
              fontWeight: 600,
              lineHeight: "16.9px",
              color: getColorCSSVar("UIText1"),
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {anchor.label}
          </TUXText>
        </>
      )}
    </div>
  );
}

const AI_OVERVIEW_TINT =
  "linear-gradient(-44.65deg, rgba(255, 0, 57, 0.09) 14%, rgba(93, 29, 255, 0.105) 30%, rgba(26, 143, 255, 0.138) 49%, rgba(2, 183, 255, 0.15) 78%)";

function AiOverviewCard({
  overview,
}: {
  overview: typeof titlePanelContent.aiOverview;
}) {
  return (
    <div className="px-4 pt-3 pb-1" style={{ backgroundColor: getColorCSSVar("UISheetFlat1") }}>
      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          backgroundColor: getColorCSSVar("UISheetGrouped2"),
          border: "0.5px solid #a5ebff",
          borderRadius: 12,
        }}
      >
        {/* Subtle rainbow tint fading down from the top edge of the card. */}
        <div
          aria-hidden
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            height: 112,
            backgroundImage: AI_OVERVIEW_TINT,
            WebkitMaskImage: "linear-gradient(180deg, #000 0%, transparent 100%)",
            maskImage: "linear-gradient(180deg, #000 0%, transparent 100%)",
          }}
        />

        <div className="relative flex flex-col">
          <div className="flex items-center gap-1.5 px-3 pt-3 pb-2">
            <img src={TAKO_SMALL_SRC} alt="" width={16} height={16} className="block" />
            <TUXText
              as="span"
              style={{
                fontSize: 15,
                fontWeight: 600,
                lineHeight: "19.5px",
                color: getColorCSSVar("UIText1"),
              }}
            >
              AI overview
            </TUXText>
          </div>

          <div className="flex flex-col gap-2 px-3">
            <TUXText
              as="p"
              style={{
                fontSize: 15,
                fontWeight: 400,
                lineHeight: "19.5px",
                color: getColorCSSVar("UIText1"),
              }}
            >
              {overview.summary}
            </TUXText>
            <TUXText
              as="p"
              style={{
                fontSize: 15,
                fontWeight: 600,
                lineHeight: "19.5px",
                color: getColorCSSVar("UIText1"),
              }}
            >
              {overview.question}
            </TUXText>
            <TUXText
              as="p"
              style={{
                fontSize: 15,
                fontWeight: 400,
                lineHeight: "19.5px",
                color: getColorCSSVar("UIText1"),
              }}
            >
              {overview.detail}
            </TUXText>
          </div>

          <div className="px-3 pt-2 pb-3">
            <div className="relative">
              <div
                aria-hidden
                className="absolute left-0 right-0 pointer-events-none"
                style={{
                  bottom: "100%",
                  height: 40,
                  backgroundImage:
                    "linear-gradient(180deg, rgba(255,255,255,0) 0%, #ffffff 100%)",
                }}
              />
              <button
                type="button"
                className="flex items-center justify-center gap-1 w-full border-0"
                style={{
                  height: 40,
                  backgroundColor: getColorCSSVar("UIShapeNeutral4"),
                  borderRadius: 999,
                }}
              >
                <TUXText
                  as="span"
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    lineHeight: "18.2px",
                    color: getColorCSSVar("UIText1"),
                  }}
                >
                  {overview.viewAllLabel}
                </TUXText>
                <IconChevronRightLTR
                  width={14}
                  height={14}
                  style={{ color: getColorCSSVar("UIText1") }}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentsHeader({ label }: { label: string }) {
  return (
    <div
      className="flex items-center gap-0.5 px-4 pt-4 pb-1"
      style={{ backgroundColor: getColorCSSVar("UISheetFlat1") }}
    >
      <TUXText
        as="span"
        style={{
          fontSize: 15,
          fontWeight: 600,
          lineHeight: "19.5px",
          color: getColorCSSVar("UIText1"),
        }}
      >
        {label}
      </TUXText>
      <Icon3LinesCenterAligned
        width={14}
        height={14}
        style={{ color: getColorCSSVar("UIText1") }}
      />
    </div>
  );
}

function AskAiPill() {
  return (
    <div className="absolute right-3 z-10" style={{ bottom: "calc(100% + 8px)" }}>
      <button
        type="button"
        className="flex items-center gap-2 border-0"
        style={{
          height: 40,
          padding: "0 12px",
          backgroundColor: getColorCSSVar("UISheetFlat1"),
          borderRadius: 999,
          boxShadow: "var(--tux-v2-shadow-floating, 0 4px 16px rgba(0,0,0,0.12))",
        }}
      >
        <img src={TAKO_SMALL_SRC} alt="" width={20} height={20} className="block" />
        <TUXText
          as="span"
          style={{
            fontSize: 13,
            fontWeight: 600,
            lineHeight: "16.9px",
            color: getColorCSSVar("UIText1"),
          }}
        >
          Ask AI
        </TUXText>
      </button>
    </div>
  );
}

function BottomActionBar({ content }: { content: typeof titlePanelContent }) {
  const actions = [
    { key: "like", icon: IconLike, label: content.actions.likeLabel, aria: "Like" },
    {
      key: "comment",
      icon: IconBubbleEllipsisRight,
      label: content.actions.commentLabel,
      aria: "Comment",
    },
    {
      key: "bookmark",
      icon: IconBookmark,
      label: content.actions.bookmarkLabel,
      aria: "Save",
    },
    {
      key: "share",
      icon: IconArrowTurnUpRight,
      label: content.actions.shareLabel,
      aria: "Share",
    },
  ] as const;

  return (
    <div className="w-full" style={{ backgroundColor: getColorCSSVar("UIPageFlat1") }}>
      <div
        className="w-full"
        style={{ borderTop: `0.5px solid ${getColorCSSVar("UIShapeNeutral3")}` }}
      />
      <div className="flex items-center gap-2 pl-4 pr-3 pt-2.5">
        <div
          className="flex flex-1 items-center min-w-0"
          style={{
            backgroundColor: getColorCSSVar("UIShapeNeutral4"),
            borderRadius: 22,
            minHeight: 40,
            padding: "8px 12px",
          }}
        >
          <TUXText
            as="span"
            style={{
              fontSize: 15,
              fontWeight: 400,
              lineHeight: "19.5px",
              color: getColorCSSVar("UITextPlaceholder"),
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {content.composer.placeholder}
          </TUXText>
        </div>

        <div className="flex items-center">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.key}
                type="button"
                aria-label={action.aria}
                className="flex flex-col items-center justify-center gap-0.5 w-12 bg-transparent border-0"
              >
                <Icon width={22} height={22} style={{ color: getColorCSSVar("UIText1") }} />
                <TUXText
                  as="span"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    lineHeight: "15.6px",
                    color: getColorCSSVar("UIText1"),
                  }}
                >
                  {action.label}
                </TUXText>
              </button>
            );
          })}
        </div>
      </div>

      {/* Clear the AppFrame's Home Indicator (real safe area on mobile, 34px on desktop). */}
      <div className="h-app-frame-bottom" />
    </div>
  );
}
