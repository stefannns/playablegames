import { IconLike, IconLivePhotoFill, IconPlayFill, IconXMark } from "@byted-tiktok/tux-icons";
import { TUXAvatar, TUXButton, TUXSheet, TUXText, getColorCSSVar } from "@byted-tiktok/tux-web";
import { useEffect, useRef, useState } from "react";
import { appFrameStackedSheetChromeProps } from "../../../../components/sys/app_frame_sheet_chrome";
import { ThemeScope, useTheme } from "../../../../context/theme.tsx";
import { type CommentWikiDetailPageVersion } from "./comment_experiment_config";
import {
  getInfographImageSrc,
  getWikiExperience,
  WikiRichDetail,
  type WikiFeedItem,
} from "./comment_wiki_content";

export type CommentWikiInfographPanelProps = {
  panelId: string;
  isTopPage: boolean;
  visible: boolean;
  keyword: string | null;
  onVisibleChange: (visible: boolean) => void;
  onKeywordChange: (keyword: string) => void;
  onClosePage: () => void;
  detailPageVersion: CommentWikiDetailPageVersion;
  root?: HTMLElement | null;
};

const CONTENT_CARD_SURFACE_COLOR = "UISheetFlat1";

export function CommentWikiInfographPanel({
  panelId,
  isTopPage,
  visible,
  keyword,
  onKeywordChange,
  onClosePage,
  detailPageVersion: _detailPageVersion,
  onVisibleChange,
  root,
}: CommentWikiInfographPanelProps) {
  type SnapState = "55" | "90";
  const { mode: themeMode } = useTheme();
  const [snap, setSnap] = useState<SnapState>("55");
  const [isDragging, setIsDragging] = useState(false);
  const [contentScrollEnabled, setContentScrollEnabled] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 639px)").matches;
  });
  const [frameHeight, setFrameHeight] = useState(() => {
    if (typeof window === "undefined") return 0;
    return window.innerHeight;
  });
  const activeHeightRef = useRef(0);
  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  const contentScrollEnabledRef = useRef(false);
  const dragRafRef = useRef<number | null>(null);
  const pendingHeightRef = useRef<number | null>(null);
  const previousUserSelectRef = useRef("");
  const cleanupPointerListenersRef = useRef<(() => void) | null>(null);
  const snapAnimationFrameRef = useRef<number | null>(null);
  const dragStateRef = useRef<{
    pointerId: number | null;
    startX: number;
    startY: number;
    startHeight: number;
    startScrollTop: number;
    lastHeight: number;
    lastTime: number;
    velocity: number;
    hasExceededThreshold: boolean;
    source: "panel" | "content";
    allowCloseBelowMin: boolean;
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    startHeight: 0,
    startScrollTop: 0,
    lastHeight: 0,
    lastTime: 0,
    velocity: 0,
    hasExceededThreshold: false,
    source: "panel",
    allowCloseBelowMin: false,
  });
  const experience = getWikiExperience(keyword);
  const infographImageSrc = getInfographImageSrc(keyword);
  const sourceCount = experience.columns.reduce((count, column) => count + column.length, 0);
  const height55Px = frameHeight * 0.55;
  const height90Px = frameHeight * 0.93;
  const targetHeightPx = snap === "90" ? height90Px : height55Px;
  const [sheetHeightPx, setSheetHeightPx] = useState(() => targetHeightPx);
  const sheetTestId = `comment-wiki-sheet-${panelId}`;

  const getSheetContainer = () =>
    typeof document === "undefined"
      ? null
      : document.querySelector<HTMLElement>(`[data-testid="${sheetTestId}"]`);

  const setSheetHeightImmediate = (heightPx: number) => {
    const container = getSheetContainer();
    if (!container) return;
    container.style.height = `${Math.max(0, Math.round(heightPx))}px`;
  };

  const setSheetTransitionEnabled = (enabled: boolean) => {
    const container = getSheetContainer();
    if (!container) return;
    container.style.transition = enabled
      ? "height 320ms cubic-bezier(0.33, 0.86, 0.2, 1)"
      : "none";
  };

  const flushPendingHeight = () => {
    if (pendingHeightRef.current == null) return;
    setSheetHeightImmediate(pendingHeightRef.current);
    pendingHeightRef.current = null;
    dragRafRef.current = null;
  };

  const scheduleHeightWrite = (heightPx: number) => {
    pendingHeightRef.current = heightPx;
    if (dragRafRef.current != null) return;
    dragRafRef.current = window.requestAnimationFrame(flushPendingHeight);
  };

  const setDraggingSelectionLocked = (locked: boolean) => {
    if (typeof document === "undefined") return;
    const rootStyle = document.documentElement.style;
    const bodyStyle = document.body?.style;
    if (locked) {
      previousUserSelectRef.current = rootStyle.userSelect;
      rootStyle.userSelect = "none";
      if (bodyStyle) bodyStyle.userSelect = "none";
      return;
    }
    rootStyle.userSelect = previousUserSelectRef.current;
    if (bodyStyle) bodyStyle.userSelect = "";
  };

  const setContentScrollMode = (enabled: boolean) => {
    if (contentScrollEnabledRef.current === enabled) return;
    contentScrollEnabledRef.current = enabled;
    setContentScrollEnabled(enabled);
  };

  const finalizeSnap = (nextSnap: SnapState) => {
    const nextHeight = nextSnap === "90" ? height90Px : height55Px;
    const startHeight = Math.max(0, Math.round(activeHeightRef.current || sheetHeightPx || nextHeight));

    if (snapAnimationFrameRef.current != null) {
      window.cancelAnimationFrame(snapAnimationFrameRef.current);
      snapAnimationFrameRef.current = null;
    }

    setSnap(nextSnap);
    setSheetHeightPx(nextHeight);
    activeHeightRef.current = nextHeight;
    setContentScrollMode(nextSnap === "90");

    const container = getSheetContainer();
    if (!container) return;
    setSheetTransitionEnabled(true);
    container.style.height = `${startHeight}px`;
    void container.offsetHeight;
    snapAnimationFrameRef.current = window.requestAnimationFrame(() => {
      setSheetHeightImmediate(nextHeight);
      snapAnimationFrameRef.current = null;
    });
  };

  const beginDrag = (event: React.PointerEvent<HTMLDivElement>, source: "panel" | "content") => {
    if (!visible) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const target = event.target as Element | null;
    if (target?.closest?.("button, a, input, textarea, select, [data-wiki-action='true']")) return;

    const contentEl = contentScrollRef.current;
    const startScrollTop = source === "content" ? contentEl?.scrollTop ?? 0 : 0;
    if (snapAnimationFrameRef.current != null) {
      window.cancelAnimationFrame(snapAnimationFrameRef.current);
      snapAnimationFrameRef.current = null;
    }
    const currentHeight = getSheetContainer()?.getBoundingClientRect().height ?? sheetHeightPx;

    dragStateRef.current.pointerId = event.pointerId;
    dragStateRef.current.startX = event.clientX;
    dragStateRef.current.startY = event.clientY;
    dragStateRef.current.startHeight = currentHeight;
    dragStateRef.current.startScrollTop = startScrollTop;
    dragStateRef.current.lastHeight = currentHeight;
    dragStateRef.current.lastTime = performance.now();
    dragStateRef.current.velocity = 0;
    dragStateRef.current.hasExceededThreshold = false;
    dragStateRef.current.source = source;
    dragStateRef.current.allowCloseBelowMin = snap === "90";
    activeHeightRef.current = currentHeight;

    const handleMove = (nextEvent: PointerEvent) => {
      if (nextEvent.pointerId !== dragStateRef.current.pointerId) return;
      const dx = nextEvent.clientX - dragStateRef.current.startX;
      const dyFromStart = nextEvent.clientY - dragStateRef.current.startY;

      if (!dragStateRef.current.hasExceededThreshold) {
        const absX = Math.abs(dx);
        const absY = Math.abs(dyFromStart);
        const DRAG_THRESHOLD = 6;

        if (absX < DRAG_THRESHOLD && absY < DRAG_THRESHOLD) return;
        if (absY < absX * 0.9) return;

        dragStateRef.current.hasExceededThreshold = true;
        setSheetTransitionEnabled(false);
        setDraggingSelectionLocked(true);
        setIsDragging(true);
        setSheetHeightImmediate(dragStateRef.current.startHeight);
      }

      const delta = dragStateRef.current.startY - nextEvent.clientY;
      const max = height90Px;
      const min = dragStateRef.current.allowCloseBelowMin ? 0 : height55Px;
      let next = dragStateRef.current.startHeight + delta;

      if (dragStateRef.current.source === "content" && contentEl) {
        const upward = Math.max(0, delta);
        const downward = Math.max(0, -delta);
        const expandBudget = Math.max(0, max - dragStateRef.current.startHeight);
        const expandDelta = Math.min(upward, expandBudget);
        const overflowUp = upward - expandDelta;

        next = dragStateRef.current.startHeight + expandDelta;

        const scrollConsumed = Math.min(dragStateRef.current.startScrollTop, downward);
        const remainingDown = downward - scrollConsumed;
        if (remainingDown > 0) {
          next = dragStateRef.current.startHeight - remainingDown;
        }

        const nextScrollTop = Math.max(
          0,
          dragStateRef.current.startScrollTop - scrollConsumed + overflowUp,
        );
        contentEl.scrollTop = nextScrollTop;
        setContentScrollMode(next >= max - 0.5 || nextScrollTop > 0);
      }

      const now = performance.now();
      const dt = (now - dragStateRef.current.lastTime) / 1000;

      if (max > 0 && next > max) next = max + (next - max) * 0.2;
      if (min >= 0 && next < min) next = min + (next - min) * 0.2;

      if (dt > 0) {
        const dr = next - dragStateRef.current.lastHeight;
        dragStateRef.current.velocity = dr / dt;
        dragStateRef.current.lastHeight = next;
        dragStateRef.current.lastTime = now;
      }

      activeHeightRef.current = next;
      scheduleHeightWrite(next);
    };

    const handleUp = (nextEvent: PointerEvent | FocusEvent) => {
      if ("pointerId" in nextEvent && nextEvent.pointerId !== dragStateRef.current.pointerId) return;

      const cleanupPointerTracking = () => {
        cleanupPointerListenersRef.current?.();
        cleanupPointerListenersRef.current = null;
      };

      const current = activeHeightRef.current;
      const v = dragStateRef.current.velocity;
      const wasDragging = dragStateRef.current.hasExceededThreshold;
      const UP_EXPAND_VELOCITY = 1600;
      const DOWN_CLOSE_VELOCITY = -1200;
      const closeDistancePx = Math.max(40, Math.min(96, frameHeight * 0.1));

      dragStateRef.current.pointerId = null;
      dragStateRef.current.hasExceededThreshold = false;
      if (dragRafRef.current != null) {
        window.cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      pendingHeightRef.current = null;
      if (!wasDragging) {
        cleanupPointerTracking();
        return;
      }

      setSheetTransitionEnabled(true);
      setDraggingSelectionLocked(false);
      setIsDragging(false);

      const shouldCloseByVelocity = dragStateRef.current.allowCloseBelowMin && v < DOWN_CLOSE_VELOCITY;
      const shouldCloseByDistance =
        dragStateRef.current.allowCloseBelowMin &&
        current <= height55Px - closeDistancePx;
      if (shouldCloseByVelocity || shouldCloseByDistance) {
        setContentScrollMode(false);
        if (contentEl) contentEl.scrollTop = 0;
        setSnap("55");
        setSheetHeightPx(height55Px);
        activeHeightRef.current = height55Px;
        cleanupPointerTracking();
        onClosePage();
        return;
      }

      if (v > UP_EXPAND_VELOCITY) {
        finalizeSnap("90");
        cleanupPointerTracking();
        return;
      }

      const dist55 = Math.abs(current - height55Px);
      const dist90 = Math.abs(current - height90Px);
      finalizeSnap(dist90 <= dist55 ? "90" : "55");
      cleanupPointerTracking();
    };

    cleanupPointerListenersRef.current?.();
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    window.addEventListener("blur", handleUp);
    cleanupPointerListenersRef.current = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
      window.removeEventListener("blur", handleUp);
    };
  };

  useEffect(() => {
    if (contentScrollRef.current) contentScrollRef.current.scrollTop = 0;
    setContentScrollMode(false);
  }, [keyword, visible]);

  useEffect(() => {
    if (!visible || isTopPage) return;
    finalizeSnap("90");
  }, [isTopPage, visible]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const frameElement =
      root?.closest?.("[data-app-frame-root='true']") ??
      document.querySelector<HTMLElement>("[data-app-frame-root='true']");
    if (!frameElement) {
      setFrameHeight(window.innerHeight);
      return;
    }

    const updateFrameHeight = () => {
      const nextHeight = frameElement.getBoundingClientRect().height;
      setFrameHeight(nextHeight > 0 ? nextHeight : window.innerHeight);
    };

    updateFrameHeight();

    const resizeObserver = new ResizeObserver(updateFrameHeight);
    resizeObserver.observe(frameElement);

    window.addEventListener("resize", updateFrameHeight);
    window.visualViewport?.addEventListener("resize", updateFrameHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateFrameHeight);
      window.visualViewport?.removeEventListener("resize", updateFrameHeight);
    };
  }, [root]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const updateCompactViewport = () => setIsCompactViewport(mediaQuery.matches);

    updateCompactViewport();
    mediaQuery.addEventListener("change", updateCompactViewport);
    return () => mediaQuery.removeEventListener("change", updateCompactViewport);
  }, []);

  useEffect(() => {
    if (!visible) {
      setIsDragging(false);
      setSnap("55");
      setSheetHeightPx(height55Px);
      dragStateRef.current.pointerId = null;
      activeHeightRef.current = height55Px;
      if (contentScrollRef.current) contentScrollRef.current.scrollTop = 0;
      setContentScrollMode(false);
      setDraggingSelectionLocked(false);
      cleanupPointerListenersRef.current?.();
      cleanupPointerListenersRef.current = null;
      if (snapAnimationFrameRef.current != null) {
        window.cancelAnimationFrame(snapAnimationFrameRef.current);
        snapAnimationFrameRef.current = null;
      }
      return;
    }

    setSnap("55");
    setSheetHeightPx(height55Px);
    activeHeightRef.current = height55Px;
    if (contentScrollRef.current) contentScrollRef.current.scrollTop = 0;
    setContentScrollMode(false);
  }, [visible, height55Px]);

  useEffect(() => {
    if (isDragging) return;
    if (visible) {
      setSheetTransitionEnabled(true);
      setSheetHeightImmediate(targetHeightPx);
    }
    setSheetHeightPx(targetHeightPx);
    activeHeightRef.current = targetHeightPx;
  }, [isDragging, targetHeightPx, visible]);

  useEffect(() => {
    setSheetTransitionEnabled(!isDragging);
  }, [isDragging, visible]);

  useEffect(() => {
    if (!visible) return;
    const preloadUrls = [
      infographImageSrc,
      ...experience.columns.flatMap((column) =>
        column.flatMap((item) => [item.src, item.avatarSrc]),
      ),
    ];

    const preloaded: HTMLImageElement[] = [];
    for (const src of preloadUrls) {
      const img = new Image();
      img.decoding = "async";
      img.setAttribute("fetchpriority", "high");
      img.src = src;
      void img.decode?.().catch(() => {});
      preloaded.push(img);
    }

    return () => {
      if (snapAnimationFrameRef.current != null) {
        window.cancelAnimationFrame(snapAnimationFrameRef.current);
        snapAnimationFrameRef.current = null;
      }
      preloaded.length = 0;
    };
  }, [experience, infographImageSrc, visible]);

  const revealFullContent = snap === "90";
  const showSeeMoreOverlay = snap === "55";

  return (
    <TUXSheet
      {...appFrameStackedSheetChromeProps()}
      visible={visible}
      onVisibleChange={(next: boolean) => {
        onVisibleChange(next);
        if (!next) setSnap("55");
      }}
      root={root}
      position="bottom"
      heightModePreset="fixed"
      height={`${Math.max(0, Math.round(sheetHeightPx))}px`}
      closeOnOutsideClick={isTopPage}
      dragHandle="hidden"
      draggable={false}
      overlayBackgroundColor={isTopPage ? "rgba(0, 0, 0, 0.25)" : "transparent"}
      sheetBackgroundColor="transparent"
      testId={sheetTestId}
    >
      <ThemeScope mode={themeMode} className="flex h-full min-h-0 flex-col">
      <div
        data-no-long-press="true"
        className="flex h-full min-h-0 flex-col overflow-hidden"
        style={{
          backgroundColor: getColorCSSVar("UISheetFlat1"),
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        }}
      >
        <div
          className="flex h-11 items-center justify-between pl-4 pr-1.5 pt-1 select-none"
          onPointerDownCapture={(event) => beginDrag(event, "panel")}
          style={{ touchAction: "none" }}
        >
          <TUXText
            as="span"
            style={{
              fontSize: 13,
              fontWeight: 600,
              lineHeight: "16.9px",
              color: getColorCSSVar("UIText1"),
              whiteSpace: "nowrap",
            }}
          >
            TikTok wiki
          </TUXText>

          <button
            type="button"
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center"
            onClick={onClosePage}
            data-wiki-action="true"
          >
            <IconXMark width={22} height={22} style={{ color: getColorCSSVar("UIText1") }} />
          </button>
        </div>

        <div
          ref={contentScrollRef}
          className="relative min-h-0 flex-1 overscroll-contain"
          onPointerDownCapture={(event) => beginDrag(event, "content")}
          style={{
            overflowX: "hidden",
            overflowY: contentScrollEnabled ? "auto" : "hidden",
            touchAction: "none",
            overscrollBehaviorX: "none",
          }}
        >
          <div className="px-2 pt-1 pb-2">
            <div
              className="overflow-hidden rounded-[12px]"
              style={{ backgroundColor: getColorCSSVar(CONTENT_CARD_SURFACE_COLOR) }}
            >
              <div
                style={{
                  aspectRatio: "1 / 1",
                  borderRadius: 12,
                  border: `0.5px solid ${getColorCSSVar("UIShapeNeutral3")}`,
                  overflow: "hidden",
                }}
              >
                <img
                  src={infographImageSrc}
                  alt=""
                  loading="eager"
                  fetchPriority="high"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
              <div className="px-3 pt-3 pb-3">
                <TUXText
                  as="div"
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    lineHeight: "19.5px",
                    color: getColorCSSVar("UIText1"),
                  }}
                >
                  {experience.label}
                </TUXText>
                <WikiRichDetail
                  experience={experience}
                  currentKeyword={keyword}
                  onKeywordClick={onKeywordChange}
                />
              </div>
            </div>

            {revealFullContent ? (
              <div className="mt-1.5">
                <TUXText
                  as="div"
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    lineHeight: "20.8px",
                    color: getColorCSSVar("UIText1"),
                    letterSpacing: "0.01em",
                  }}
                >
                  {`Explore ${sourceCount} sources`}
                </TUXText>
                <div className="mt-1.5 flex gap-1.5">
                  {experience.columns.map((items, columnIndex) => (
                    <div key={`column-${columnIndex}`} className="flex min-w-0 flex-1 flex-col gap-1.5">
                      {items.map((item) => (
                        <WikiPostCard key={item.id} item={item} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {showSeeMoreOverlay ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 px-2">
              <div
                aria-hidden="true"
                className="rounded-b-3"
                style={{
                  height: isCompactViewport ? 128 : 162,
                  background: `linear-gradient(
                    180deg,
                    color-mix(in srgb, ${getColorCSSVar("UISheetFlat1")} 0%, transparent) 0%,
                    color-mix(in srgb, ${getColorCSSVar("UISheetFlat1")} 72%, transparent) 48%,
                    ${getColorCSSVar("UISheetFlat1")} 100%
                  )`,
                }}
              />
              <div
                className="absolute inset-x-0 flex justify-center"
                style={{ bottom: isCompactViewport ? 12 : 34 }}
              >
                <div className="pointer-events-auto">
                  <TUXButton
                    text="see more"
                    themePreset="secondary"
                    shapePreset="capsule"
                    sizePreset="small"
                    smoothRadius
                    onClick={() => finalizeSnap("90")}
                    backgroundColor="UIPageFlat1"
                    borderStyle="solid"
                    borderWidth="0.5px"
                    borderColor="UIShapeNeutral3"
                    paddingInline="16px"
                    height="32px"
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      </ThemeScope>
    </TUXSheet>
  );
}

function WikiPostCard({ item }: { item: WikiFeedItem }) {
  return (
    <article
      className="overflow-hidden rounded-[8px]"
      style={{ backgroundColor: getColorCSSVar(CONTENT_CARD_SURFACE_COLOR) }}
    >
      <div
        className="relative w-full overflow-hidden rounded-[8px]"
        style={{
          aspectRatio: `${item.width} / ${item.height}`,
          border: `0.5px solid ${getColorCSSVar("UIShapeNeutral4")}`,
        }}
      >
        <img
          src={item.src}
          alt=""
          loading="eager"
          fetchPriority="high"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />

        <div
          className="absolute right-1.5 top-1.5 flex items-center justify-center"
          style={{
            width: 18,
            height: 18,
            color: getColorCSSVar("UIImageOverlayWhite"),
            filter: "drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.12))",
          }}
        >
          {item.mediaKind === "photo" ? (
            <IconLivePhotoFill width={18} height={18} />
          ) : (
            <IconPlayFill width={18} height={18} />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 px-2 pt-1.5 pb-2">
        <TUXText
          as="div"
          style={{
            fontSize: 13,
            fontWeight: 600,
            lineHeight: "16.9px",
            color: getColorCSSVar("UIText1"),
            wordBreak: "break-word",
          }}
        >
          {item.title}
        </TUXText>

        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <TUXAvatar src={item.avatarSrc} alt="" size={16} />
            <TUXText
              as="span"
              style={{
                minWidth: 0,
                fontSize: 11,
                fontWeight: 400,
                lineHeight: "14.3px",
                color: getColorCSSVar("UITextPlaceholder"),
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {item.username}
            </TUXText>
          </div>

          <div className="flex shrink-0 items-center gap-px">
            <IconLike width={12} height={12} style={{ color: getColorCSSVar("UITextPlaceholder") }} />
            <TUXText
              as="span"
              style={{
                fontSize: 12,
                fontWeight: 400,
                lineHeight: "15.6px",
                color: getColorCSSVar("UITextPlaceholder"),
              }}
            >
              {item.likes}
            </TUXText>
          </div>
        </div>
      </div>
    </article>
  );
}
