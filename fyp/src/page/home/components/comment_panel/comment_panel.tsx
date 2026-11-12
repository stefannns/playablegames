import { TUXSheet, getColorCSSVar } from "@byted-tiktok/tux-web";
import { IconXMark } from "@byted-tiktok/tux-icons";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ThemeScope, useTheme } from "../../../../context/theme.tsx";
import {
  useAppFrame,
  useRegisterHomeIndicatorSurfaceTheme,
} from "../../../../components/sys/app_frame.tsx";
import { appFrameSheetChromeProps } from "../../../../components/sys/app_frame_sheet_chrome";
import { measureAppSafeAreaInsetPx } from "../../../../utils/viewport_insets";
import { CommentComposerKeyboardShell } from "./comment_composer_keyboard_shell.tsx";
import { CommentVideoPiP, type CommentPipMedia } from "./comment_video_pip.tsx";
import { CommentTopBar } from "./comment_top_bar.tsx";
import { CommentTextField, type CommentTextFieldHandle } from "./comment_text_field.tsx";
import { CommentCell } from "./comment_cell.tsx";
import { CommentWikiPanel } from "./comment_wiki_panel.tsx";
import { CommentWikiInfographPanel } from "./comment_wiki_infograph_panel.tsx";
import {
  EMPTY_FEED_COMMENT_DOCUMENT,
  countCommentNodes,
  getCommentDocumentForFeed,
  resolveFeedCommentCount,
} from "./comment_feed_documents.ts";
import { useCommentContentStore, openCommentContentPanel, closeCommentContentPanel } from "./comment_content_store.ts";
import { useCommentExperimentStore, openCommentExperimentPanel, closeCommentExperimentPanel } from "./comment_experiment_store.ts";
import { CommentEmptyState } from "./comment_empty_state.tsx";
import { COMMENT_EMPTY_STATE_QUESTION_OPTIONS } from "./comment_experiment_config.ts";
import { setCommentPanelVisualState } from "./comment_panel_visual_store.ts";
import {
  collectCommentDocumentPreloadUrls,
  getCommentAudioBarWidth,
  getCommentStickerSrc,
  resolveCommentAvatarSrc,
  type CommentContentNode,
  type CommentImageDisplay,
  type CommentMediaSpec,
} from "./comment_content_config.ts";
import { migrateCommentImageUrl } from "./comment_assets.ts";
import "./comment_panel.css";

/**
 * Real-time metrics emitted while the comment sheet is on-screen. Feeds the
 * "video squeeze" effect on the underlying FeedItemCard so the media scales
 * down in lock-step with the sheet's slide / drag — see
 * {@link CommentPanelProps.onMetricsChange}.
 */
export type CommentSheetMetrics = {
  /** True while any pixel of the sheet is on-screen (open or animating). */
  visible: boolean;
  /** True while the sheet geometry is being driven by the drag gesture. */
  isDragging: boolean;
  /** Progress of the custom edge-swipe dismissal (0..1). */
  dismissProgress: number;
  /** Sheet's top edge in CSS px, relative to the host frame (0..frameHeight). */
  sheetTopY: number;
  /** Host frame's CSS-px height — denominator for the scale ratio. */
  frameHeight: number;
};

export type CommentPanelProps = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  root?: HTMLElement | null;
  /** When set, show curated comments for this feed id instead of the dev content store. */
  feedContentId?: string | null;
  pipMedia?: CommentPipMedia | null;
  preserveFeedChrome?: boolean;
  /**
   * Fired on every animation frame the sheet is on-screen (open OR animating
   * out). Consumers should treat each call as the latest metrics and react
   * synchronously — typically by mutating a CSS transform via a ref to avoid
   * per-frame React re-renders.
   */
  onMetricsChange?: (metrics: CommentSheetMetrics) => void;
  /** User-posted comments for the active feed (prepended to the curated list). */
  sessionComments?: CommentContentNode[];
  /** User sent a comment from the composer (not merely opening the sheet). */
  onCommentPosted?: (text: string) => void;
};

export function CommentPanel({
  visible,
  onVisibleChange,
  root,
  feedContentId = null,
  pipMedia,
  preserveFeedChrome = false,
  onMetricsChange,
  sessionComments = [],
  onCommentPosted,
}: CommentPanelProps) {
  type SnapState = "70" | "90";
  type WikiPageState = {
    id: string;
    keyword: string;
    visible: boolean;
  };
  const panelInstanceId = useId();
  const { mode: themeMode, resolvedTheme } = useTheme();
  // 浮层仅注册底栏；顶栏仍由 Tabbar / AppChromeStatusBar 栈解析 — STATUS_BAR.md
  useRegisterHomeIndicatorSurfaceTheme(visible ? resolvedTheme : null);
  const { commentPanelExpand, commentWiki, commentTopBar, commentEmptyState } = useCommentExperimentStore();
  const { document: storeDocument } = useCommentContentStore();
  const feedDocument = feedContentId
    ? getCommentDocumentForFeed(feedContentId)
    : null;
  const contentDocument =
    feedDocument ??
    (feedContentId ? EMPTY_FEED_COMMENT_DOCUMENT : storeDocument);
  const experimentConfig = commentPanelExpand.config;
  const allowDrag = experimentConfig.allowDrag;
  const showExpandButton = experimentConfig.showExpandButton;
  // 派生 allowExpand：只要存在任一进入 90 的入口（拖动 / 展开按钮），即视为允许展开。
  const allowExpand = allowDrag || showExpandButton;
  const showWikiEntryPoint = commentWiki.config.enabled;
  const topBarExperimentConfig = commentTopBar.config;
  // Show Grabber 已迁移到 Top Bar 实验组，独立可配置。
  const showGrabber = topBarExperimentConfig.showGrabber;
  const emptyStateStyle = commentEmptyState.config.style;
  const emptyStateYeahOrNahLook = commentEmptyState.config.yeahOrNahLook;
  const emptyStateCuriousAboutLook = commentEmptyState.config.curiousAboutLook;
  const sessionCommentCount = sessionComments.length;
  const displayedComments = [...sessionComments, ...contentDocument.comments];
  const rawCommentCount = feedContentId
    ? resolveFeedCommentCount(feedContentId) + sessionCommentCount
    : countCommentNodes(contentDocument.comments) + sessionCommentCount;
  const hasComments =
    (rawCommentCount > 0 || sessionCommentCount > 0) &&
    !commentEmptyState.config.forceEmptyState;
  const resolvedTopBarTitle = hasComments ? `${formatCommentCount(rawCommentCount)} comments` : "Comments";
  const [wikiPages, setWikiPages] = useState<WikiPageState[]>([]);
  const [composerFocused, setComposerFocused] = useState(false);
  const { keyboardOpen } = useAppFrame();
  const keyboardLiftActive = visible && composerFocused && keyboardOpen;
  const wikiPageIdRef = useRef(0);
  const panelSurfaceRef = useRef<HTMLDivElement | null>(null);
  const commentTextFieldRef = useRef<CommentTextFieldHandle | null>(null);
  const [isCompactViewport, setIsCompactViewport] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 639px)").matches;
  });
  const [isPipDismissed, setIsPipDismissed] = useState(false);
  const [safeAreaTopPx, setSafeAreaTopPx] = useState(0);
  const [previewImageSrc, setPreviewImageSrc] = useState<string | null>(null);

  const measureSafeAreaInset = (edge: "top" | "bottom") =>
    measureAppSafeAreaInsetPx(edge);

  const sheetContainerRef = useRef<HTMLElement | null>(null);
  const sheetOverlayRef = useRef<HTMLElement | null>(null);
  const sheetOverlayFocusAlphaRef = useRef(0);
  const dismissLinkedProgressRef = useRef(0);

  const getSheetContainer = () =>
    typeof document === "undefined"
      ? null
      : document.querySelector<HTMLElement>('[data-testid="comment-sheet"]');

  const getSheetOverlay = () =>
    getSheetContainer()
      ?.parentElement
      ?.querySelector<HTMLElement>('[data-testid$="sheet-overlay"]');

  const setSheetHeightImmediate = (heightPx: number) => {
    const container = sheetContainerRef.current ?? getSheetContainer();
    sheetContainerRef.current = container;
    if (!container) return;
    container.style.height = `${Math.max(0, Math.round(heightPx))}px`;
  };

  const setSheetTransitionEnabled = (enabled: boolean) => {
    const container = sheetContainerRef.current ?? getSheetContainer();
    sheetContainerRef.current = container;
    if (!container) return;
    container.style.transition = enabled
      ? "height 320ms cubic-bezier(0.33, 0.86, 0.2, 1)"
      : "none";
  };

  const [snap, setSnap] = useState<SnapState>("70");
  const [isDragging, setIsDragging] = useState(false);
  const [isEdgeSwipeDragging, setIsEdgeSwipeDragging] = useState(false);
  const isDraggingRef = useRef(isDragging);
  isDraggingRef.current = isDragging;
  const isEdgeSwipeDraggingRef = useRef(isEdgeSwipeDragging);
  isEdgeSwipeDraggingRef.current = isEdgeSwipeDragging;
  const activeHeightRef = useRef(0);
  const dragRafRef = useRef<number | null>(null);
  const pendingHeightRef = useRef<number | null>(null);
  const previousUserSelectRef = useRef("");
  const cleanupPointerListenersRef = useRef<(() => void) | null>(null);
  const cleanupEdgeSwipeListenersRef = useRef<(() => void) | null>(null);
  const edgeSwipeResetTimerRef = useRef<number | null>(null);
  const edgeSwipeClosingRef = useRef(false);
  const suppressTopBarClickRef = useRef(false);
  const [isPipSuppressedByDismissGesture, setIsPipSuppressedByDismissGesture] =
    useState(false);
  const edgeDismissOffsetRef = useRef(0);
  const edgeSwipeStateRef = useRef<{
    pointerId: number | null;
    startX: number;
    startY: number;
    lastX: number;
    lastTime: number;
    velocity: number;
    panelWidth: number;
    panelHeight: number;
    hasExceededThreshold: boolean;
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
    panelWidth: 0,
    panelHeight: 0,
    hasExceededThreshold: false,
  });
  const dragStateRef = useRef<{
    pointerId: number | null;
    startX: number;
    startY: number;
    startHeight: number;
    lastHeight: number;
    lastTime: number;
    velocity: number;
    hasExceededThreshold: boolean;
    startedFromAnchor: boolean;
    startSnap: SnapState;
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    startHeight: 0,
    lastHeight: 0,
    lastTime: 0,
    velocity: 0,
    hasExceededThreshold: false,
    startedFromAnchor: false,
    startSnap: "70",
  });

  const flushPendingHeight = () => {
    if (pendingHeightRef.current == null) return;
    setSheetHeightImmediate(pendingHeightRef.current);
    setPanelExpandProgressImmediate(pendingHeightRef.current);
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

  const clearEdgeSwipeResetTimer = () => {
    if (edgeSwipeResetTimerRef.current != null) {
      window.clearTimeout(edgeSwipeResetTimerRef.current);
      edgeSwipeResetTimerRef.current = null;
    }
  };

  const clearEdgeSwipeGestureState = () => {
    setIsEdgeSwipeDragging(false);
    edgeSwipeStateRef.current.pointerId = null;
    edgeSwipeStateRef.current.hasExceededThreshold = false;
  };

  const setDismissLinkedVisualProgress = (progress: number) => {
    const clamped = Math.max(0, Math.min(progress, 1));
    dismissLinkedProgressRef.current = clamped;
    const overlay = sheetOverlayRef.current ?? getSheetOverlay() ?? null;
    sheetOverlayRef.current = overlay;
    if (overlay) {
      overlay.style.opacity = String((1 - clamped) * sheetOverlayFocusAlphaRef.current);
    }
  };

  const setDismissLinkedVisualTransition = (enabled: boolean, durationMs = 0) => {
    const overlay = sheetOverlayRef.current ?? getSheetOverlay() ?? null;
    sheetOverlayRef.current = overlay;
    if (overlay) {
      overlay.style.transition = enabled
        ? `opacity ${durationMs}ms cubic-bezier(0.22, 0.61, 0.36, 1)`
        : "none";
    }
  };

  const getPanelSurfaceWidth = () => {
    const width = panelSurfaceRef.current?.getBoundingClientRect().width ?? root?.getBoundingClientRect().width ?? 0;
    return width > 0 ? width : Math.max(1, window.innerWidth);
  };

  const getPanelSurfaceHeight = () => {
    const height = panelSurfaceRef.current?.getBoundingClientRect().height ?? sheetHeightPx;
    return height > 0 ? height : Math.max(1, frameHeight);
  };

  const setPanelDismissTransitionEnabled = (enabled: boolean, durationMs = 0) => {
    panelSurfaceRef.current?.style.setProperty(
      "--comment-panel-dismiss-transition-ms",
      enabled ? `${durationMs}ms` : "0ms",
    );
    setDismissLinkedVisualTransition(enabled, durationMs);
  };

  const setPanelDismissOffsetImmediate = (offsetPx: number) => {
    const max =
      edgeSwipeStateRef.current.panelHeight > 0
        ? edgeSwipeStateRef.current.panelHeight
        : getPanelSurfaceHeight();
    const clampedOffset = Math.max(0, Math.min(offsetPx, max));
    edgeDismissOffsetRef.current = clampedOffset;
    panelSurfaceRef.current?.style.setProperty(
      "--comment-panel-dismiss-offset",
      `${Math.round(clampedOffset * 100) / 100}px`,
    );
    setDismissLinkedVisualProgress(max <= 0 ? 0 : clampedOffset / max);
  };

  const resetPanelDismissOffsetImmediate = () => {
    setPanelDismissTransitionEnabled(false);
    setPanelDismissOffsetImmediate(0);
  };

  const isPointerInLeftEdgeHotZone = (clientX: number) => {
    const rect = panelSurfaceRef.current?.getBoundingClientRect();
    if (!rect) return clientX <= edgeSwipeHotZonePx;
    return clientX - rect.left <= edgeSwipeHotZonePx;
  };

  const [frameHeight, setFrameHeight] = useState(() => {
    if (typeof window === "undefined") return 0;
    return window.innerHeight;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const frameElement =
      root?.closest?.("[data-app-frame-root='true']") ??
      document.querySelector<HTMLElement>("[data-app-frame-root='true']");
    const updateViewportMode = () => {
      setIsCompactViewport(mediaQuery.matches);
      setSafeAreaTopPx(measureSafeAreaInset("top"));
    };
    if (!frameElement) {
      setFrameHeight(window.innerHeight);
      updateViewportMode();
      return;
    }

    const updateFrameHeight = () => {
      const nextHeight = frameElement.getBoundingClientRect().height;
      setFrameHeight(nextHeight > 0 ? nextHeight : window.innerHeight);
      updateViewportMode();
    };

    updateFrameHeight();

    const resizeObserver = new ResizeObserver(updateFrameHeight);
    resizeObserver.observe(frameElement);

    window.addEventListener("resize", updateFrameHeight);
    window.visualViewport?.addEventListener("resize", updateFrameHeight);
    mediaQuery.addEventListener?.("change", updateViewportMode);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateFrameHeight);
      window.visualViewport?.removeEventListener("resize", updateFrameHeight);
      mediaQuery.removeEventListener?.("change", updateViewportMode);
    };
  }, [root]);

  useEffect(() => {
    const preloaded: HTMLImageElement[] = [];
    for (const src of collectCommentDocumentPreloadUrls(contentDocument)) {
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
  }, [contentDocument]);

  useEffect(() => {
    if (!visible) {
      sheetContainerRef.current = null;
      sheetOverlayRef.current = null;
      return;
    }
    const container = getSheetContainer();
    sheetContainerRef.current = container;
    sheetOverlayRef.current = container?.parentElement?.querySelector<HTMLElement>(
      '[data-testid$="sheet-overlay"]',
    ) ?? null;
    setDismissLinkedVisualProgress(dismissLinkedProgressRef.current);
  }, [visible]);

  useEffect(() => {
    sheetOverlayFocusAlphaRef.current = composerFocused ? 1 : 0;
    setDismissLinkedVisualTransition(true, 220);
    setDismissLinkedVisualProgress(dismissLinkedProgressRef.current);
  }, [composerFocused]);

  useEffect(() => {
    if (visible) {
      openCommentExperimentPanel(panelInstanceId);
      openCommentContentPanel(panelInstanceId);
      return () => closeCommentExperimentPanel(panelInstanceId);
    }

    closeCommentExperimentPanel(panelInstanceId);
    closeCommentContentPanel(panelInstanceId);
    return undefined;
  }, [panelInstanceId, visible]);

  const height70Px = frameHeight * 0.73;
  const height90Px = isCompactViewport
    ? Math.max(height70Px, frameHeight - Math.max(12, safeAreaTopPx))
    : frameHeight * 0.93;
  const expandedHeightPx = allowExpand ? height90Px : height70Px;
  const closeDistancePx = Math.max(40, Math.min(96, frameHeight * 0.1));
  const edgeSwipeHotZonePx = 24;
  const edgeSwipeLockThresholdPx = 8;
  const getSheetExpandProgress = (heightPx: number) => {
    const range = expandedHeightPx - height70Px;
    if (range <= 0) return 0;
    return Math.max(0, Math.min(1, (heightPx - height70Px) / range));
  };
  const setPanelExpandProgressImmediate = (heightPx: number) => {
    panelSurfaceRef.current?.style.setProperty(
      "--comment-panel-expand-progress",
      String(getSheetExpandProgress(heightPx)),
    );
  };

  const targetHeightPx = snap === "90" ? expandedHeightPx : height70Px;
  const [sheetHeightPx, setSheetHeightPx] = useState(() => targetHeightPx);
  const wikiPageStack = wikiPages.map((page, index) => ({
    ...page,
    index,
    panelId: `${page.id}-${page.keyword.trim().toLowerCase().replace(/\s+/g, "-")}`,
    isTopPage: index === wikiPages.length - 1,
  }));

  // Keep internal state stable across open/close.
  useEffect(() => {
    if (!visible) {
      setIsDragging(false);
      setIsEdgeSwipeDragging(false);
      setSnap("70");
      dragStateRef.current.pointerId = null;
      edgeSwipeStateRef.current.pointerId = null;
      edgeSwipeStateRef.current.hasExceededThreshold = false;
      setIsPipSuppressedByDismissGesture(false);
      setWikiPages([]);
      activeHeightRef.current = 0;
      setDraggingSelectionLocked(false);
      cleanupPointerListenersRef.current?.();
      cleanupPointerListenersRef.current = null;
      cleanupEdgeSwipeListenersRef.current?.();
      cleanupEdgeSwipeListenersRef.current = null;
      clearEdgeSwipeResetTimer();
      if (!edgeSwipeClosingRef.current) {
        setPanelExpandProgressImmediate(height70Px);
        resetPanelDismissOffsetImmediate();
      } else {
        setSheetTransitionEnabled(false);
      }
      setIsPipDismissed(false);
      setPreviewImageSrc(null);
      setComposerFocused(false);
      return;
    }
    // On open, start at 70%.
    edgeSwipeClosingRef.current = false;
    setIsPipSuppressedByDismissGesture(false);
    setSnap("70");
    setSheetHeightPx(height70Px);
    activeHeightRef.current = height70Px;
    setPanelExpandProgressImmediate(height70Px);
    resetPanelDismissOffsetImmediate();
    setIsPipDismissed(false);
  }, [visible, height70Px]);


  // Drive expand/collapse with CSS transition on the TUXSheet container.
  useEffect(() => {
    if (isDragging) return;
    setSheetHeightPx(targetHeightPx);
    activeHeightRef.current = targetHeightPx;
  }, [isDragging, targetHeightPx]);

  useEffect(() => {
    const closingPages = wikiPages.filter((page) => !page.visible);
    if (closingPages.length === 0) return;

    const timers = closingPages.map((page) =>
      window.setTimeout(() => {
        setWikiPages((currentPages) =>
          currentPages.filter((currentPage) => currentPage.id !== page.id),
        );
      }, 320),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [wikiPages]);
  const expanded = allowExpand && snap === "90";
  const pipVisible =
    visible && expanded && experimentConfig.showPiP && !isPipDismissed && Boolean(pipMedia?.src);

  useEffect(() => {
    if (allowExpand) return;
    setSnap("70");
    setSheetHeightPx(height70Px);
    activeHeightRef.current = height70Px;
    setSheetHeightImmediate(height70Px);
    setPanelExpandProgressImmediate(height70Px);
  }, [allowExpand, height70Px]);

  useEffect(() => {
    setPanelExpandProgressImmediate(visible ? sheetHeightPx : height70Px);
  }, [height70Px, sheetHeightPx, visible]);

  useEffect(() => {
    setCommentPanelVisualState({
      isOpen: visible,
      isExpanded: visible && expanded,
      isCompactViewport,
      preserveFeedChrome: visible && preserveFeedChrome,
    });
    return () =>
      setCommentPanelVisualState({
        isOpen: false,
        isExpanded: false,
        preserveFeedChrome: false,
      });
  }, [expanded, isCompactViewport, preserveFeedChrome, visible]);

  useEffect(() => {
    pipMedia?.videoBridge?.onVisibilityChange(pipVisible);
  }, [pipMedia, pipVisible]);

  useEffect(() => {
    return () => {
      clearEdgeSwipeResetTimer();
      cleanupEdgeSwipeListenersRef.current?.();
    };
  }, []);

  /* --------------------------------------------------------------------- *
   * Sheet position tracking — rAF loop that reports the sheet content's
   * top-edge Y (relative to the host frame) every frame. Continues running
   * through the close animation and self-terminates once the sheet has
   * slid fully off-screen, so consumers (e.g. the FeedItemCard "video
   * squeeze" effect) get smooth open AND close metrics without doing any
   * easing themselves.
   * --------------------------------------------------------------------- */
  const rafIdRef = useRef<number | null>(null);
  const onMetricsChangeRef = useRef(onMetricsChange);
  onMetricsChangeRef.current = onMetricsChange;
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  useEffect(() => {
    if (!visible || rafIdRef.current != null) return;

    // 关键性能优化：把动画期间不变的几个量在打开瞬间读一次缓存。
    // 旧实现每帧都 getBoundingClientRect 两次 + 触发同步 layout，
    // 在 PWA 上是动画卡顿的主因。
    const frameEl = (root?.closest?.("[data-app-frame-root='true']") as HTMLElement | null)
      ?? document.querySelector<HTMLElement>("[data-app-frame-root='true']")
      ?? document.documentElement;
    const initialFrameRect = frameEl.getBoundingClientRect();
    const cachedFrameTop = initialFrameRect.top;
    const cachedFrameHeight = initialFrameRect.height || frameHeight || window.innerHeight;

    const tick = () => {
      const contentEl = panelSurfaceRef.current;
      const isVisible = visibleRef.current;

      if (!contentEl || !contentEl.isConnected) {
        if (!isVisible) {
          onMetricsChangeRef.current?.({
            visible: false,
            isDragging: false,
            dismissProgress: 0,
            sheetTopY: 0,
            frameHeight: 0,
          });
          rafIdRef.current = null;
          return;
        }
        rafIdRef.current = requestAnimationFrame(tick);
        return;
      }

      const sheetTopY = contentEl.getBoundingClientRect().top - cachedFrameTop;
      const stillOnScreen = sheetTopY < cachedFrameHeight - 1;
      const dismissHeight = edgeSwipeStateRef.current.panelHeight > 0
        ? edgeSwipeStateRef.current.panelHeight
        : cachedFrameHeight;
      const dismissProgress =
        edgeDismissOffsetRef.current <= 0
          ? 0
          : Math.max(
              0,
              Math.min(1, edgeDismissOffsetRef.current / Math.max(1, dismissHeight)),
            );
      onMetricsChangeRef.current?.({
        visible: isVisible || stillOnScreen,
        isDragging: isDraggingRef.current,
        dismissProgress,
        sheetTopY,
        frameHeight: cachedFrameHeight,
      });
      if (!isVisible && !stillOnScreen) {
        rafIdRef.current = null;
        return;
      }
      rafIdRef.current = requestAnimationFrame(tick);
    };
    rafIdRef.current = requestAnimationFrame(tick);
    // 注意：这里有意不返回 cleanup。visible 翻 false 时 rAF 必须继续跑，
    // 让 sheet 完成 sliding-out 动画并持续上报 metrics，feed 卡才能
    // 平滑复原。组件真正卸载时由下方的 unmount-safety effect 兜底。
  }, [visible, root, frameHeight]);

  // Unmount safety: cancel rAF + reset consumer's transform.
  useEffect(() => {
    return () => {
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      onMetricsChangeRef.current?.({
        visible: false,
        isDragging: false,
        dismissProgress: 0,
        sheetTopY: 0,
        frameHeight: 0,
      });
    };
  }, []);

  useEffect(() => {
    setSheetTransitionEnabled(!isDragging);
  }, [isDragging, visible]);

  const shouldSuppressAnchorClick = () => {
    if (!suppressTopBarClickRef.current) return false;
    suppressTopBarClickRef.current = false;
    return true;
  };

  const onTopBarPointerDownCapture = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!visible) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (isPointerInLeftEdgeHotZone(event.clientX)) return;
    const target = event.target as Element | null;
    // Title / Filter / Expand / Close 等 topbar 按钮不再 early return，让它们也能参与拖动。
    // 拖动跨过阈值后会通过 suppressTopBarClickRef 抑制其 click，避免误触发按钮行为。
    const startedFromTopBarInteractive = Boolean(
      target?.closest?.('[data-anchor-root="true"], [data-topbar-action="true"]'),
    );

    const startHeight = sheetHeightPx;
    suppressTopBarClickRef.current = false;
    dragStateRef.current.pointerId = event.pointerId;
    dragStateRef.current.startX = event.clientX;
    dragStateRef.current.startY = event.clientY;
    dragStateRef.current.startHeight = startHeight;
    dragStateRef.current.lastHeight = startHeight;
    dragStateRef.current.lastTime = performance.now();
    dragStateRef.current.velocity = 0;
    dragStateRef.current.hasExceededThreshold = false;
    dragStateRef.current.startedFromAnchor = startedFromTopBarInteractive;
    dragStateRef.current.startSnap = snap;
    activeHeightRef.current = startHeight;
    const handleMove = (event: PointerEvent) => {
      if (event.pointerId !== dragStateRef.current.pointerId) return;
      const dx = event.clientX - dragStateRef.current.startX;
      const dyFromStart = event.clientY - dragStateRef.current.startY;

      if (!dragStateRef.current.hasExceededThreshold) {
        const absX = Math.abs(dx);
        const absY = Math.abs(dyFromStart);
        const DRAG_THRESHOLD = 6;

        if (absX < DRAG_THRESHOLD && absY < DRAG_THRESHOLD) return;
        if (absY < absX * 0.9) return;

        dragStateRef.current.hasExceededThreshold = true;
        suppressTopBarClickRef.current = dragStateRef.current.startedFromAnchor;
        setSheetTransitionEnabled(false);
        setDraggingSelectionLocked(true);
        setIsDragging(true);
        setSheetHeightImmediate(dragStateRef.current.startHeight);
      }

      const delta = dragStateRef.current.startY - event.clientY;
      const rawNext = dragStateRef.current.startHeight + delta;

      // Rubber band beyond max/min to keep the gesture feeling natural.
      let next = rawNext;
      // 当 allowDrag 关闭时，禁止从 70 通过拖动越过 70 进入 90。
      // 若拖动起点已经在 90（通过其他入口进入），仍允许在 70 ↔ 90 之间拖动以便收起。
      const canDragExpand = allowExpand && (allowDrag || dragStateRef.current.startSnap === "90");
      const max = canDragExpand ? expandedHeightPx : height70Px;
      if (max > 0 && next > max) {
        // 当不允许向上拖动展开时（allowDrag 关闭且起点在 70），完全锁定面板高度，
        // 不做 rubber-band 视觉位移，避免 image area > 30000 时图片随拖动放大。
        next = canDragExpand ? max + (next - max) * 0.2 : max;
      }
      if (next < 0) next = next * 0.2;

      const now = performance.now();
      const dt = (now - dragStateRef.current.lastTime) / 1000;
      if (dt > 0) {
        const dr = next - dragStateRef.current.lastHeight;
        dragStateRef.current.velocity = dr / dt;
        dragStateRef.current.lastHeight = next;
        dragStateRef.current.lastTime = now;
      }

      activeHeightRef.current = next;
      scheduleHeightWrite(next);
    };

    const handleUp = (event: PointerEvent | FocusEvent) => {
      if ("pointerId" in event) {
        if (event.pointerId !== dragStateRef.current.pointerId) return;
      }

      const cleanupPointerTracking = () => {
        cleanupPointerListenersRef.current?.();
        cleanupPointerListenersRef.current = null;
      };

      const current = activeHeightRef.current;
      const v = dragStateRef.current.velocity;
      const UP_EXPAND_VELOCITY = 1600;
      const DOWN_CLOSE_VELOCITY = -1200;
      const wasDragging = dragStateRef.current.hasExceededThreshold;

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

      const deltaDown = dragStateRef.current.startHeight - current;
      const isDownGesture = deltaDown > 0;
      const shouldCloseByVelocity = v < DOWN_CLOSE_VELOCITY;
      const shouldCloseByDistance = isDownGesture && deltaDown >= closeDistancePx;
      if (shouldCloseByVelocity || shouldCloseByDistance) {
        cleanupPointerTracking();
        onVisibleChange(false);
        return;
      }

      if (allowExpand && v > UP_EXPAND_VELOCITY) {
        // allowDrag 关闭时，禁止「向上甩」从 70 进入 90；但若起点已是 90，则保持原有 90 行为。
        if (!allowDrag && dragStateRef.current.startSnap !== "90") {
          setSnap("70");
          setSheetHeightPx(height70Px);
          activeHeightRef.current = height70Px;
          setSheetHeightImmediate(height70Px);
          cleanupPointerTracking();
          return;
        }
        setSnap("90");
        setSheetHeightPx(expandedHeightPx);
        activeHeightRef.current = expandedHeightPx;
        setSheetHeightImmediate(expandedHeightPx);
        cleanupPointerTracking();
        return;
      }

      // Snap to the nearest height.
      if (!allowExpand) {
        setSnap("70");
        setSheetHeightPx(height70Px);
        activeHeightRef.current = height70Px;
        setSheetHeightImmediate(height70Px);
        cleanupPointerTracking();
        return;
      }

      // 当 allowDrag 关闭且起点为 70 时，无论手势方向都吸附回 70（不进入 90）。
      if (!allowDrag && dragStateRef.current.startSnap !== "90") {
        setSnap("70");
        setSheetHeightPx(height70Px);
        activeHeightRef.current = height70Px;
        setSheetHeightImmediate(height70Px);
        cleanupPointerTracking();
        return;
      }

      const dist70 = Math.abs(current - height70Px);
      const dist90 = Math.abs(current - expandedHeightPx);
      if (dist90 <= dist70) {
        setSnap("90");
        setSheetHeightPx(expandedHeightPx);
        activeHeightRef.current = expandedHeightPx;
        setSheetHeightImmediate(expandedHeightPx);
      } else {
        setSnap("70");
        setSheetHeightPx(height70Px);
        activeHeightRef.current = height70Px;
        setSheetHeightImmediate(height70Px);
      }
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

  const beginEdgeSwipeGesture = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!visible) return;
    if (isDraggingRef.current) return;
    if (isEdgeSwipeDraggingRef.current) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    const state = edgeSwipeStateRef.current;
    state.pointerId = event.pointerId;
    state.startX = event.clientX;
    state.startY = event.clientY;
    state.lastX = event.clientX;
    state.lastTime = performance.now();
    state.velocity = 0;
    state.panelWidth = getPanelSurfaceWidth();
    state.panelHeight = getPanelSurfaceHeight();
    state.hasExceededThreshold = false;

    const handleMove = (nativeEvent: PointerEvent) => {
      if (nativeEvent.pointerId !== state.pointerId) return;

      const dx = nativeEvent.clientX - state.startX;
      const dy = nativeEvent.clientY - state.startY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (!state.hasExceededThreshold) {
        if (absX < edgeSwipeLockThresholdPx && absY < edgeSwipeLockThresholdPx) {
          return;
        }
        if (dx <= 0 || absX < absY * 1.1) {
          cleanupEdgeSwipeListenersRef.current?.();
          cleanupEdgeSwipeListenersRef.current = null;
          clearEdgeSwipeGestureState();
          return;
        }

        state.hasExceededThreshold = true;
        setIsEdgeSwipeDragging(true);
        setDraggingSelectionLocked(true);
        setPanelDismissTransitionEnabled(false);
        setSheetTransitionEnabled(false);
        if (pipVisible) {
          setIsPipSuppressedByDismissGesture(true);
        }
      }

      nativeEvent.preventDefault();

      const swipeProgress = Math.max(0, Math.min(dx / Math.max(1, state.panelWidth), 1));
      const nextOffset = swipeProgress * Math.max(1, state.panelHeight);
      const now = performance.now();
      const dt = (now - state.lastTime) / 1000;
      if (dt > 0) {
        state.velocity = (nextOffset - edgeDismissOffsetRef.current) / dt;
      }
      state.lastX = nativeEvent.clientX;
      state.lastTime = now;
      setPanelDismissOffsetImmediate(nextOffset);
    };

    const handleUp = (nativeEvent: PointerEvent | FocusEvent) => {
      if ("pointerId" in nativeEvent && nativeEvent.pointerId !== state.pointerId) {
        return;
      }

      const wasDragging = state.hasExceededThreshold;
      const currentOffset = edgeDismissOffsetRef.current;
      const velocity = state.velocity;

      cleanupEdgeSwipeListenersRef.current?.();
      cleanupEdgeSwipeListenersRef.current = null;
      clearEdgeSwipeGestureState();
      setDraggingSelectionLocked(false);

      if (!wasDragging) {
        return;
      }

      const panelHeight = Math.max(1, state.panelHeight);
      const closeThresholdPx = Math.max(120, Math.min(220, panelHeight * 0.32));
      const shouldClose = currentOffset >= closeThresholdPx || velocity > 1200;

      if (shouldClose) {
        edgeSwipeClosingRef.current = true;
        setPanelDismissTransitionEnabled(true, 220);
        setPanelDismissOffsetImmediate(panelHeight);
        clearEdgeSwipeResetTimer();
        edgeSwipeResetTimerRef.current = window.setTimeout(() => {
          edgeSwipeResetTimerRef.current = null;
          onMetricsChangeRef.current?.({
            visible: false,
            isDragging: false,
            dismissProgress: 1,
            sheetTopY: frameHeight,
            frameHeight,
          });
          onVisibleChange(false);
        }, 220);
        return;
      }

      setIsPipSuppressedByDismissGesture(false);
      setPanelDismissTransitionEnabled(true, 240);
      setPanelDismissOffsetImmediate(0);
      clearEdgeSwipeResetTimer();
      edgeSwipeResetTimerRef.current = window.setTimeout(() => {
        edgeSwipeResetTimerRef.current = null;
        setPanelDismissTransitionEnabled(false);
      }, 240);
    };

    cleanupEdgeSwipeListenersRef.current?.();
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    window.addEventListener("blur", handleUp);
    cleanupEdgeSwipeListenersRef.current = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
      window.removeEventListener("blur", handleUp);
    };
  };

  const createWikiPage = (keyword: string): WikiPageState => {
    wikiPageIdRef.current += 1;
    return {
      id: `wiki-page-${wikiPageIdRef.current}`,
      keyword,
      visible: true,
    };
  };

  const openWikiEntryPoint = (keyword: string) => {
    // Keep the sheet open and open the wiki sheet on top (like other overlays in the demo).
    setWikiPages([createWikiPage(keyword)]);
  };

  const pushWikiEntryPoint = (keyword: string) => {
    setWikiPages((currentPages) => {
      const currentTop = currentPages.at(-1);
      if (currentTop?.keyword.trim().toLowerCase() === keyword.trim().toLowerCase()) {
        return currentPages;
      }
      return [...currentPages, createWikiPage(keyword)];
    });
  };

  const closeWikiPageById = (pageId: string) => {
    setWikiPages((currentPages) =>
      currentPages.map((page) =>
        page.id === pageId
          ? {
              ...page,
              visible: false,
            }
          : page,
      ),
    );
  };

  const focusCommentInput = () => {
    commentTextFieldRef.current?.focus();
  };

  const fillCommentInput = (text: string) => {
    commentTextFieldRef.current?.setText(text);
    commentTextFieldRef.current?.focus();
  };

  return (
    <>
      <TUXSheet
        {...appFrameSheetChromeProps()}
        visible={visible}
        onVisibleChange={(next: boolean) => {
          onVisibleChange(next);
          if (!next) setSnap("70");
        }}
        root={root}
        position="bottom"
        heightModePreset="fixed"
        height={`${Math.max(0, Math.round(sheetHeightPx))}px`}
        closeOnOutsideClick
        dragHandle="hidden"
        draggable={false}
        overlayBackgroundColor="transparent"
        // Keep the native sheet container transparent and render the exact panel
        // surface + radius inside, to match Figma.
        sheetBackgroundColor="transparent"
        testId="comment-sheet"
      >
        <ThemeScope mode={themeMode} className="flex flex-col w-full h-full min-h-0">
        <div
          ref={panelSurfaceRef}
          data-comment-panel-surface="true"
          data-no-long-press="true"
          className="flex flex-col w-full h-full min-h-0 overflow-hidden"
          style={{
            backgroundColor: getColorCSSVar("UISheetFlat1"),
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            position: "relative",
            touchAction: isEdgeSwipeDragging ? "none" : "pan-y",
          }}
        >
          <div
            aria-hidden="true"
            data-comment-panel-edge-swipe-zone="true"
            onPointerDown={beginEdgeSwipeGesture}
          />
          <CommentTopBar
            title={resolvedTopBarTitle}
            expanded={expanded}
            showGrabber={showGrabber}
            showExpandButton={showExpandButton}
            showFilterButton={hasComments}
            showAnchor={topBarExperimentConfig.showAnchor}
            titleAlignment={topBarExperimentConfig.titleAlignment}
            defaultAnchorVariant={topBarExperimentConfig.defaultAnchorVariant}
            onExpandedChange={(next) => setSnap(next && allowExpand ? "90" : "70")}
            onClose={() => onVisibleChange(false)}
            onTopBarPointerDownCapture={onTopBarPointerDownCapture}
            shouldSuppressTopBarClick={shouldSuppressAnchorClick}
          />

          <div className="flex-1 min-h-0 overflow-hidden">
            {hasComments ? (
              <div
                className="h-full overscroll-contain"
                style={{
                  overflowX: "hidden",
                  overflowY: isEdgeSwipeDragging ? "hidden" : "auto",
                  touchAction: isEdgeSwipeDragging ? "none" : "pan-y",
                  overscrollBehaviorX: "none",
                }}
              >
                <div className="py-2">
                  {displayedComments.map((comment) => (
                    <CommentCell
                      key={comment.id}
                      avatarSrc={resolveCommentAvatarSrc(comment.authorAvatarSrc, 36)}
                      username={comment.authorName}
                      creatorLabel={comment.authorLabel}
                      content={comment.content}
                      timeLabel={comment.timeLabel}
                      likeCountLabel={comment.likeCountLabel}
                      resource={resolveCommentResource(comment.media)}
                      subPreview={resolveCommentSubPreview(comment)}
                      experimentConfig={experimentConfig}
                      animateResourceStyle={!isDragging}
                      showWikiEntryPoint={showWikiEntryPoint}
                      onWikiEntryPointClick={openWikiEntryPoint}
                      onImageClick={(src) => setPreviewImageSrc(src)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <CommentEmptyState
                onCommentClick={focusCommentInput}
                onChipSelect={fillCommentInput}
                style={emptyStateStyle}
                yeahOrNahLook={emptyStateYeahOrNahLook}
                curiousAboutLook={emptyStateCuriousAboutLook}
              />
            )}
          </div>

          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: getColorCSSVar("UISheetBackdrop2"),
              pointerEvents: "none",
              zIndex: 1,
              opacity: composerFocused ? 1 : 0,
              transition: "opacity 220ms cubic-bezier(0.22, 0.61, 0.36, 1)",
              willChange: "opacity",
            }}
          />

          <CommentComposerKeyboardShell
            keyboardLiftActive={keyboardLiftActive}
            className="relative z-2 shrink-0"
          >
            <CommentTextField
              ref={commentTextFieldRef}
              avatarSrc={resolveCommentAvatarSrc(
                contentDocument.composer.avatarSrc,
                40,
              )}
              placeholder={contentDocument.composer.placeholder}
              onFocusChange={setComposerFocused}
              onSend={(text) => {
                onCommentPosted?.(text);
              }}
              questionsBarEnabled={
                !hasComments &&
                commentEmptyState.config.replaceEmojiWithQuestions
              }
              questionOptions={COMMENT_EMPTY_STATE_QUESTION_OPTIONS}
              onQuestionSelect={fillCommentInput}
            />
          </CommentComposerKeyboardShell>
        </div>
        </ThemeScope>
      </TUXSheet>

      {commentWiki.config.detailPageVersion === "v2-infograph"
        ? wikiPageStack.map((page) => (
            <CommentWikiInfographPanel
              key={page.panelId}
              panelId={page.panelId}
              isTopPage={page.isTopPage}
              visible={page.visible}
              keyword={page.keyword}
              detailPageVersion={commentWiki.config.detailPageVersion}
              onKeywordChange={pushWikiEntryPoint}
              onClosePage={() => {
                closeWikiPageById(page.id);
              }}
              onVisibleChange={(next: boolean) => {
                if (!next) {
                  closeWikiPageById(page.id);
                }
              }}
              root={root}
            />
          ))
        : wikiPageStack.map((page) => (
            <CommentWikiPanel
              key={page.panelId}
              panelId={page.panelId}
              isTopPage={page.isTopPage}
              visible={page.visible}
              keyword={page.keyword}
              detailPageVersion={commentWiki.config.detailPageVersion}
              showGlow={commentWiki.config.showGlow}
              onKeywordChange={pushWikiEntryPoint}
              onClosePage={() => {
                closeWikiPageById(page.id);
              }}
              onVisibleChange={(next: boolean) => {
                if (!next) {
                  closeWikiPageById(page.id);
                }
              }}
              root={root}
            />
          ))}

      <CommentVideoPiP
        visible={pipVisible}
        suppressed={isPipSuppressedByDismissGesture}
        media={pipMedia}
        portalTarget={root ?? null}
        onClose={() => setIsPipDismissed(true)}
      />

      <CommentImagePreview
        src={previewImageSrc}
        portalTarget={root ?? null}
        onClose={() => setPreviewImageSrc(null)}
      />
    </>
  );
}

function formatCommentCount(count: number): string {
  return new Intl.NumberFormat("en-US").format(count);
}

function resolveCommentResource(media: CommentMediaSpec | undefined) {
  if (!media || media.visible === false) return undefined;

  if (media.type === "image") {
    const size = resolveImageSize(media.display);
    return {
      kind: "image" as const,
      src: migrateCommentImageUrl(media.url),
      intrinsicWidth: size.width,
      intrinsicHeight: size.height,
      border: `0.5px solid ${getColorCSSVar("UIShapeNeutral4")}`,
      autoSize: media.display === "auto",
    };
  }

  if (media.type === "sticker") {
    return {
      kind: "sticker" as const,
      src: getCommentStickerSrc(media.stickerRef),
      intrinsicWidth: 120,
      intrinsicHeight: 120,
      autoSize: true,
    };
  }

  return {
    kind: "audio" as const,
    barWidth: getCommentAudioBarWidth(media.duration),
    duration: media.duration,
    text: media.text,
  };
}

function resolveCommentSubPreview(node: CommentContentNode) {
  const firstReply = node.replies[0];
  if (!firstReply) return undefined;

  return {
    comment: {
      avatarSrc: resolveCommentAvatarSrc(firstReply.authorAvatarSrc, 24),
      username: firstReply.authorName,
      creatorLabel: firstReply.authorLabel,
      content: firstReply.content,
      timeLabel: firstReply.timeLabel,
      likeCountLabel: firstReply.likeCountLabel,
      resource: resolveCommentResource(firstReply.media),
    },
    viewRepliesLabel: node.viewRepliesLabel ?? formatViewRepliesLabel(node.replies.length),
  };
}

function resolveImageSize(display: CommentImageDisplay) {
  if (display === "auto") {
    return { width: 1080, height: 1350 };
  }
  if (display === "landscape") {
    return { width: 1440, height: 960 };
  }
  if (display === "square") {
    return { width: 1200, height: 1200 };
  }
  return { width: 1080, height: 2400 };
}

function formatViewRepliesLabel(replyCount: number) {
  if (replyCount <= 0) return "View replies";
  return `View ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`;
}

type CommentImagePreviewProps = {
  src: string | null;
  portalTarget: HTMLElement | null;
  onClose: () => void;
};

const IMAGE_PREVIEW_ANIM_MS = 200;

/**
 * 评论里的图片点击后全屏预览：黑色背景遮罩 + 居中等比缩放图片，
 * 点击任意位置或关闭按钮即可退出。挂载到 AppFrame 根上保持在桌面手机框内。
 */
function CommentImagePreview({ src, portalTarget, onClose }: CommentImagePreviewProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isShown, setIsShown] = useState(false);

  useEffect(() => {
    if (src) {
      setShouldRender(true);
      return;
    }
    setIsShown(false);
    const t = window.setTimeout(() => setShouldRender(false), IMAGE_PREVIEW_ANIM_MS);
    return () => window.clearTimeout(t);
  }, [src]);

  useEffect(() => {
    if (!shouldRender || !src) return;
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => setIsShown(true));
    });
    return () => {
      cancelAnimationFrame(r1);
      if (r2) cancelAnimationFrame(r2);
    };
  }, [shouldRender, src]);

  useEffect(() => {
    if (!src) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [src, onClose]);

  if (!shouldRender || !portalTarget) return null;

  const node = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: getColorCSSVar("BrandTikTokBlack"),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 3400,
        opacity: isShown ? 1 : 0,
        transition: `opacity ${IMAGE_PREVIEW_ANIM_MS}ms ease`,
        cursor: "zoom-out",
        userSelect: "none",
      }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          draggable={false}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            display: "block",
            transform: isShown ? "scale(1)" : "scale(0.96)",
            transition: `transform ${IMAGE_PREVIEW_ANIM_MS}ms ease`,
            cursor: "zoom-out",
          }}
        />
      ) : null}

      <button
        type="button"
        aria-label="Close image preview"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          width: 36,
          height: 36,
          borderRadius: 18,
          border: "none",
          backgroundColor: getColorCSSVar("UIImageOverlayBlackA50"),
          color: getColorCSSVar("UIImageOverlayWhite"),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <IconXMark width={20} height={20} />
      </button>
    </div>
  );

  return createPortal(node, portalTarget);
}
