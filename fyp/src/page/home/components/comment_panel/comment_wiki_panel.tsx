import {
  IconLike,
  IconLivePhotoFill,
  IconPlayFill,
  IconXMark,
} from "@byted-tiktok/tux-icons";
import {
  TUXAvatar,
  TUXButton,
  TUXSheet,
  TUXText,
  getColorCSSVar,
} from "@byted-tiktok/tux-web";
import { useEffect, useRef, useState } from "react";
import { appFrameStackedSheetChromeProps } from "../../../../components/sys/app_frame_sheet_chrome";
import { ThemeScope, useTheme } from "../../../../context/theme.tsx";
import { type CommentWikiDetailPageVersion } from "./comment_experiment_config";
import {
  getWikiExperience,
  WikiRichDetail,
  type WikiFeedItem,
} from "./comment_wiki_content";

export type CommentWikiPanelProps = {
  panelId: string;
  isTopPage: boolean;
  visible: boolean;
  keyword: string | null;
  onVisibleChange: (visible: boolean) => void;
  onKeywordChange: (keyword: string) => void;
  onClosePage: () => void;
  detailPageVersion: CommentWikiDetailPageVersion;
  showGlow: boolean;
  root?: HTMLElement | null;
};

const CONTENT_CARD_SURFACE_COLOR = "UISheetFlat1";

export function CommentWikiPanel({
  panelId,
  isTopPage,
  visible,
  keyword,
  onKeywordChange,
  onClosePage,
  detailPageVersion,
  showGlow,
  onVisibleChange,
  root,
}: CommentWikiPanelProps) {
  type SnapState = "55" | "90";
  const { mode: themeMode } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [snap, setSnap] = useState<SnapState>("55");
  const [isDragging, setIsDragging] = useState(false);
  const [contentScrollEnabled, setContentScrollEnabled] = useState(false);
  const [showContentTopFade, setShowContentTopFade] = useState(false);
  const [animatedBodyHeight, setAnimatedBodyHeight] = useState<number | null>(null);
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
  const summaryBodyRef = useRef<HTMLDivElement | null>(null);
  const detailBodyRef = useRef<HTMLDivElement | null>(null);
  const cardAnimationFrameRef = useRef<number | null>(null);
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
  const glowEnabled = showGlow && detailPageVersion === "v1-content-panel";
  const aiCardSurfaceColor =
    detailPageVersion === "v1-content-panel" && !glowEnabled
      ? "UISheetFlat2"
      : CONTENT_CARD_SURFACE_COLOR;
  const sourceCount = experience.columns.reduce((count, column) => count + column.length, 0);
  const bodyHeightTransition = expanded
    ? "height 260ms cubic-bezier(0.33, 0.86, 0.2, 1)"
    : "height 360ms cubic-bezier(0.22, 0.8, 0.2, 1)";
  const bodyContentTransition = expanded
    ? "opacity 220ms cubic-bezier(0.33, 0.86, 0.2, 1), transform 220ms cubic-bezier(0.33, 0.86, 0.2, 1)"
    : "opacity 300ms cubic-bezier(0.22, 0.8, 0.2, 1), transform 300ms cubic-bezier(0.22, 0.8, 0.2, 1)";
  const animateExpandedChange = (nextExpanded: boolean) => {
    if (nextExpanded === expanded) return;

    const currentBody = expanded ? detailBodyRef.current : summaryBodyRef.current;
    const nextBody = nextExpanded ? detailBodyRef.current : summaryBodyRef.current;
    const currentHeight =
      currentBody?.getBoundingClientRect().height ??
      nextBody?.getBoundingClientRect().height ??
      0;
    const nextHeight =
      nextBody?.getBoundingClientRect().height ??
      currentBody?.getBoundingClientRect().height ??
      currentHeight;

    if (cardAnimationFrameRef.current != null) {
      window.cancelAnimationFrame(cardAnimationFrameRef.current);
      cardAnimationFrameRef.current = null;
    }

    setAnimatedBodyHeight(currentHeight);
    setExpanded(nextExpanded);
    if (nextExpanded) finalizeSnap("90");
    cardAnimationFrameRef.current = window.requestAnimationFrame(() => {
      setAnimatedBodyHeight(nextHeight);
      cardAnimationFrameRef.current = null;
    });
  };
  const syncAnimatedBodyHeight = () => {
    const target = expanded ? detailBodyRef.current : summaryBodyRef.current;
    if (!target) return;
    setAnimatedBodyHeight(target.getBoundingClientRect().height);
  };
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

  const syncContentTopFade = (scrollTop: number) => {
    setShowContentTopFade(scrollTop > 1);
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
        if (expanded && nextScrollTop > 8) {
          animateExpandedChange(false);
        }
        syncContentTopFade(nextScrollTop);
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
        if (contentEl) {
          contentEl.scrollTop = 0;
          syncContentTopFade(0);
        }
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
    setExpanded(false);
    if (contentScrollRef.current) contentScrollRef.current.scrollTop = 0;
    syncContentTopFade(0);
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
    if (!visible) {
      setIsDragging(false);
      setSnap("55");
      setSheetHeightPx(height55Px);
      dragStateRef.current.pointerId = null;
      activeHeightRef.current = height55Px;
      if (contentScrollRef.current) contentScrollRef.current.scrollTop = 0;
      syncContentTopFade(0);
      setContentScrollMode(false);
      setDraggingSelectionLocked(false);
      cleanupPointerListenersRef.current?.();
      cleanupPointerListenersRef.current = null;
      if (cardAnimationFrameRef.current != null) {
        window.cancelAnimationFrame(cardAnimationFrameRef.current);
        cardAnimationFrameRef.current = null;
      }
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
    syncContentTopFade(0);
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
      preloaded.length = 0;
    };
  }, [experience, visible]);

  useEffect(() => {
    if (!visible) {
      setAnimatedBodyHeight(null);
      return;
    }

    const update = () => syncAnimatedBodyHeight();
    const rafId = window.requestAnimationFrame(update);
    const resizeObserver = new ResizeObserver(update);
    if (summaryBodyRef.current) resizeObserver.observe(summaryBodyRef.current);
    if (detailBodyRef.current) resizeObserver.observe(detailBodyRef.current);
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);

    return () => {
      if (cardAnimationFrameRef.current != null) {
        window.cancelAnimationFrame(cardAnimationFrameRef.current);
        cardAnimationFrameRef.current = null;
      }
      if (snapAnimationFrameRef.current != null) {
        window.cancelAnimationFrame(snapAnimationFrameRef.current);
        snapAnimationFrameRef.current = null;
      }
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, [expanded, experience, visible]);

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
      // Match comment panel: keep native sheet container transparent so we fully
      // control the surface radius and avoid the library's default corner radius.
      sheetBackgroundColor="transparent"
      testId={sheetTestId}
    >
      <ThemeScope mode={themeMode} className="flex flex-col h-full min-h-0">
      <div
        data-no-long-press="true"
        className="flex flex-col h-full min-h-0 overflow-hidden"
        style={{
          backgroundColor: getColorCSSVar("UISheetFlat1"),
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        }}
      >
        <div
          className="flex justify-between items-center pt-1 pr-1.5 pl-4 h-11 select-none"
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
            className="flex justify-center items-center w-10 h-10"
            onClick={onClosePage}
            data-wiki-action="true"
          >
            <IconXMark width={22} height={22} style={{ color: getColorCSSVar("UIText1") }} />
          </button>
        </div>

        <div
          className="z-20 relative px-2 pt-1 pb-1.5"
          onPointerDownCapture={(event) => beginDrag(event, "panel")}
          style={{ touchAction: "none" }}
        >
          <div
            className="z-10 relative rounded-[12px]"
          >
            {glowEnabled ? (
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-[16px] pointer-events-none"
                style={{
                  zIndex: 0,
                  opacity: 0.88,
                  filter: "blur(10px)",
                  background: `
                    linear-gradient(
                      118deg,
                      color-mix(in srgb, ${getColorCSSVar("BrandTikTokSplash")} 66%, transparent) 6%,
                      color-mix(in srgb, ${getColorCSSVar("BrandTako1")} 62%, transparent) 46%,
                      color-mix(in srgb, ${getColorCSSVar("BrandTikTokRazzmatazz")} 60%, transparent) 84%
                    ),
                    radial-gradient(
                      44% 42% at 24% 24%,
                      color-mix(in srgb, ${getColorCSSVar("BrandTikTokSplash")} 64%, transparent) 0%,
                      transparent 68%
                    ),
                    radial-gradient(
                      40% 38% at 60% 34%,
                      color-mix(in srgb, ${getColorCSSVar("BrandTako1")} 58%, transparent) 0%,
                      transparent 68%
                    ),
                    radial-gradient(
                      38% 42% at 80% 72%,
                      color-mix(in srgb, ${getColorCSSVar("BrandTikTokRazzmatazz")} 58%, transparent) 0%,
                      transparent 68%
                    )
                  `,
                }}
              />
            ) : null}
            <div
              className="z-1 relative px-3 py-2 rounded-[12px] overflow-hidden"
              style={{
                backgroundColor: getColorCSSVar(aiCardSurfaceColor),
                boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${getColorCSSVar("UIShapeNeutral4")} 82%, transparent)`,
              }}
            >
              <div className="z-1 relative flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
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
                </div>
              </div>

              <div className="z-1 relative mt-1">
                <div
                  style={{
                    height: animatedBodyHeight == null ? "auto" : animatedBodyHeight,
                    transition: bodyHeightTransition,
                  }}
                >
                  <div className="relative">
                    <div
                      ref={summaryBodyRef}
                      style={{
                        width: "100%",
                        opacity: expanded ? 0 : 1,
                        transform: `translateY(${expanded ? -8 : 0}px)`,
                        transition: bodyContentTransition,
                        pointerEvents: expanded ? "none" : "auto",
                        position: expanded ? "absolute" : "relative",
                        inset: expanded ? "0 auto auto 0" : "auto",
                      }}
                    >
                      <div className="flex flex-col gap-3">
                        <TUXText
                          as="div"
                          style={{
                            fontSize: 15,
                            fontWeight: 500,
                            lineHeight: "19.5px",
                            color: getColorCSSVar("UIText1"),
                          }}
                        >
                          {experience.summary}
                        </TUXText>
                        <div data-wiki-action="true" className="flex justify-end">
                          <TUXButton
                            text="see more"
                            themePreset="secondary"
                            shapePreset="capsule"
                            sizePreset="small"
                            smoothRadius
                            onClick={() => animateExpandedChange(true)}
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

                    <div
                      ref={detailBodyRef}
                      style={{
                        width: "100%",
                        opacity: expanded ? 1 : 0,
                        transform: `translateY(${expanded ? 0 : 8}px)`,
                        transition: bodyContentTransition,
                        pointerEvents: expanded ? "auto" : "none",
                        position: expanded ? "relative" : "absolute",
                        inset: expanded ? "auto" : "0 auto auto 0",
                      }}
                    >
                      <WikiRichDetail
                        experience={experience}
                        currentKeyword={keyword}
                        onKeywordClick={onKeywordChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            aria-hidden="true"
            className="bottom-0 z-0 absolute inset-x-2 h-7 transition-opacity translate-y-3 duration-200 pointer-events-none"
            style={{
              opacity: showContentTopFade ? 1 : 0,
              background: `linear-gradient(
                180deg,
                ${getColorCSSVar("UISheetFlat1")} 0%,
                ${getColorCSSVar("UISheetFlat1")} 35%,
                color-mix(in srgb, ${getColorCSSVar("UISheetFlat1")} 80%, transparent) 50%,
                color-mix(in srgb, ${getColorCSSVar("UISheetFlat1")} 30%, transparent) 70%,
                color-mix(in srgb, ${getColorCSSVar("UISheetFlat1")} 0%, transparent) 90%,
                transparent 100%
              )`,
            }}
          />
        </div>

        <div
          ref={contentScrollRef}
          className="z-0 relative flex-1 -mt-2 pt-2 min-h-0 overscroll-contain"
          onPointerDownCapture={(event) => beginDrag(event, "content")}
          onScroll={(event) => {
            const nextScrollTop = event.currentTarget.scrollTop;
            if (expanded && nextScrollTop > 8) {
              animateExpandedChange(false);
            }
            syncContentTopFade(nextScrollTop);
          }}
          style={{
            overflowX: "hidden",
            overflowY: contentScrollEnabled ? "auto" : "hidden",
            touchAction: "none",
            overscrollBehaviorX: "none",
          }}
        >
          <div className="px-2 pt-1">
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
          </div>
          <div
            className="flex gap-1.5 px-2 pt-1.5"
          >
            {experience.columns.map((items, columnIndex) => (
              <div key={`column-${columnIndex}`} className="flex flex-col flex-1 gap-1.5 min-w-0">
                {items.map((item) => (
                  <WikiPostCard key={item.id} item={item} />
                ))}
              </div>
            ))}
          </div>
          <div className="h-2" />
        </div>
      </div>
      </ThemeScope>
    </TUXSheet>
  );
}

function WikiPostCard({ item }: { item: WikiFeedItem }) {
  return (
    <article
      className="rounded-[8px] overflow-hidden"
      style={{ backgroundColor: getColorCSSVar(CONTENT_CARD_SURFACE_COLOR) }}
    >
      <div
        className="relative rounded-[8px] w-full overflow-hidden"
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
          className="top-1.5 right-1.5 absolute flex justify-center items-center"
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
          <div className="flex flex-1 items-center gap-1 min-w-0">
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

          <div className="flex items-center gap-px shrink-0">
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
