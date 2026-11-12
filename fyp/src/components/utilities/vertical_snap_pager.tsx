import { getColorCSSVar } from "@byted-tiktok/tux-web";
import { gsap } from "gsap";
import { createFeedPreviewTap } from "./feed_preview_tap";
import {
  cloneElement,
  type CSSProperties,
  forwardRef,
  isValidElement,
  type MutableRefObject,
  type ReactElement,
  type ReactNode,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

export type VerticalSnapPagerHandle = {
  next: () => void;
  prev: () => void;
  /** 无动画地跳到给定 logical index（pages 数组索引） */
  jumpToLogical: (logical: number) => void;
};

type DragState = {
  pointerId: number | null;
  isDragging: boolean;
  startX: number;
  startY: number;
  startTime: number;
  lastX: number;
  lastY: number;
  lastTime: number;
  velocityX: number;
  velocityY: number;
  height: number;
  width: number;
  activeIndex: number;
  baseTrackY: number;
  trackY: number;
  startedInCarousel: boolean;
  visitorGesture: boolean;
  axis: "vertical" | "horizontal" | "undecided";
};

export type VerticalSnapPagerProps = {
  pages: ReactNode[];
  activeIndex?: number;
  defaultActiveIndex?: number;
  onActiveIndexChange?: (activeIndex: number) => void;
  className?: string;
  style?: CSSProperties;

  /** Whether to show the full-screen color fill feedback while dragging. */
  gestureFill?: boolean;

  /**
   * When true and there are at least 2 pages, uses a 3× duplicate strip with offset recycling:
   * each flip is always a single-page motion (next enters from the bottom); crossing the strip
   * edge recenters invisibly so it never feels like “jumping back to the top”.
   */
  loop?: boolean;

  /** Feed left-swipe → guest profile (follow-hand progress 0–1). */
  onHorizontalStart?: () => void;
  onHorizontalMove?: (progress: number) => void;
  onHorizontalEnd?: (commit: boolean) => void;
};

/**
 * 手势判定参数（当前配置偏“很容易翻页”）
 * - 速度：用于快速甩动翻页（单位 px/ms）
 * - 位移：用于慢速轻拖翻页（单位 px）
 * - 进度：用于很小位移/很小速度时的兜底（按页面高度比例）
 */
/** 真·快速甩动的速度门槛（px/ms）。低于它就完全按拖拽距离判定，避免轻微滑动误翻页。 */
const FLICK_VELOCITY_THRESHOLD = 0.35; // px/ms
/** 甩动翻页所需的最小净位移（px）：过滤“拖一点又拖回来”时松手瞬间的反向速度噪声。 */
const FLICK_MIN_TRAVEL_PX = 12; // px
/** 慢拖翻页门槛：净位移需达到页高的此比例才翻页，否则回弹到原视频。 */
const DISTANCE_COMMIT_RATIO = 0.2; // fraction of page height

/**
 * 速度滤波（低通）：减少 pointermove 的抖动噪声。
 * 说明：不会改变方向，只让速度更“稳”，属于常见手势实现细节。
 */
const VELOCITY_FILTER_ALPHA = 0.35;

/** 边界阻尼：在第一页/最后一页继续拖拽时增加阻尼，避免无限滑出 */
const OVERSCROLL_RESISTANCE = 0.35;

/** 吸附动画时长（秒） */
const ANIMATION_DURATION = 0.45;
const DESKTOP_WHEEL_MIN_WIDTH = 768;
/** 累积多少纵向 delta 才视为「有意翻一页」（略调高，避免轨迹板微抖动连跳） */
const WHEEL_TRIGGER_THRESHOLD_PX = 100;
/** 一阵滚轮暂停多久后清空累积（新的一阵才算新一页） */
const WHEEL_RESET_MS = 280;
const CAROUSEL_AXIS_LOCK_MIN_X_PX = 6;
const CAROUSEL_AXIS_LOCK_MIN_Y_PX = 36;
const CAROUSEL_HORIZONTAL_BIAS = 0.25;
const CAROUSEL_VERTICAL_BIAS = 2.6;
/**
 * 两次滚轮翻页的最短间隔：必须 ≥ 吸附动画时长，否则动画未完就解锁会「一盘滚轮连跳多页」
 */
const WHEEL_COOLDOWN_MS = Math.ceil(ANIMATION_DURATION * 1000) + 180;

const VISITOR_AXIS_LOCK_DECIDE_PX = 6;
/** Left-swipe → profile when the gesture stays within ±15° of horizontal. */
const VISITOR_PROFILE_MAX_ANGLE_FROM_HORIZONTAL_DEG = 15;
const VISITOR_PROFILE_MAX_SLOPE = Math.tan(
  (VISITOR_PROFILE_MAX_ANGLE_FROM_HORIZONTAL_DEG * Math.PI) / 180,
);
/** Lock feed scroll only once vertical travel is clear and outside the profile cone. */
const VISITOR_CLEAR_VERTICAL_MIN_Y_PX = 16;
const VISITOR_HORIZONTAL_COMMIT_PROGRESS = 0.28;
const VISITOR_HORIZONTAL_SWIPE_VELOCITY = 0.28;

function isWithinVisitorProfileSwipeCone(absDx: number, absDy: number) {
  return absDx > 0 && absDy <= absDx * VISITOR_PROFILE_MAX_SLOPE;
}

function shouldLockFeedVerticalScroll(absDx: number, absDy: number) {
  if (absDy < VISITOR_CLEAR_VERTICAL_MIN_Y_PX) return false;
  return !isWithinVisitorProfileSwipeCone(absDx, absDy);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function withCloneKey(node: ReactNode, key: string): ReactNode {
  if (!isValidElement(node)) return node;
  return cloneElement(node as ReactElement<{ key?: string }>, { key });
}

/** Three identical blocks: [...pages, ...pages, ...pages] for invisible index recycling. */
function buildTripleLoopPanels(pages: ReactNode[]): ReactNode[] {
  const n = pages.length;
  if (n < 2) return pages;
  const block = (b: number) =>
    pages.map((p, i) => withCloneKey(p, `__vertical_snap_loop_${b}_${i}`));
  return [...block(0), ...block(1), ...block(2)];
}

function visualToLogical(visual: number, logicalCount: number, extended: boolean): number {
  if (!extended) return visual;
  const n = logicalCount;
  return ((visual % n) + n) % n;
}

/** Middle block starts at visual index `logicalCount`. */
function logicalToVisual(logical: number, logicalCount: number, extended: boolean): number {
  if (!extended || logicalCount < 2) return logical;
  return logical + logicalCount;
}

export default forwardRef<VerticalSnapPagerHandle, VerticalSnapPagerProps>(
  function VerticalSnapPager(
    {
      pages,
      activeIndex,
      defaultActiveIndex = 0,
      onActiveIndexChange,
      className,
      style,
      gestureFill = true,
      loop = false,
      onHorizontalStart,
      onHorizontalMove,
      onHorizontalEnd,
    },
    handleRef,
  ) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const panelsRef = useRef<Array<HTMLDivElement | null>>([]);
  const gestureOverlayRef = useRef<HTMLDivElement | null>(null);

  const [internalActiveIndex, setInternalActiveIndex] = useState(() =>
    clamp(defaultActiveIndex, 0, Math.max(0, pages.length - 1)),
  );

  const resolvedActiveIndex = activeIndex ?? internalActiveIndex;

  const horizontalSwipeRef = useRef({
    start: onHorizontalStart,
    move: onHorizontalMove,
    end: onHorizontalEnd,
  });
  useEffect(() => {
    horizontalSwipeRef.current.start = onHorizontalStart;
    horizontalSwipeRef.current.move = onHorizontalMove;
    horizontalSwipeRef.current.end = onHorizontalEnd;
  }, [onHorizontalEnd, onHorizontalMove, onHorizontalStart]);

  const logicalCount = pages.length;
  const useExtendedLoop = loop && logicalCount >= 2;
  const panelNodes = useMemo(
    () => (useExtendedLoop ? buildTripleLoopPanels(pages) : pages),
    [loop, pages, useExtendedLoop],
  );
  const extendedCount = panelNodes.length;

  const dragHolderRef = useRef<DragState | null>(null);
  // 暴露给 forwardRef 的 imperative 方法（在 effect 内部赋值）
  const snapToVisualRef = useRef<((next: number) => void) | null>(null);
  const jumpToVisualRef = useRef<((next: number) => void) | null>(null);
  if (dragHolderRef.current === null) {
    const initialLogical = clamp(
      activeIndex !== undefined ? activeIndex : defaultActiveIndex,
      0,
      Math.max(0, logicalCount - 1),
    );
    dragHolderRef.current = {
      pointerId: null,
      isDragging: false,
      startX: 0,
      startY: 0,
      startTime: 0,
      lastX: 0,
      lastY: 0,
      lastTime: 0,
      velocityX: 0,
      velocityY: 0,
      height: 0,
      width: 0,
      activeIndex: logicalToVisual(initialLogical, logicalCount, useExtendedLoop),
      baseTrackY: 0,
      trackY: 0,
      startedInCarousel: false,
      visitorGesture: false,
      axis: "vertical",
    };
  }
  const dragRef = dragHolderRef as MutableRefObject<DragState>;

  useEffect(() => {
    if (activeIndex !== undefined) return;
    const maxIdx = Math.max(0, logicalCount - 1);
    setInternalActiveIndex((prev) => clamp(prev, 0, maxIdx));
  }, [logicalCount, activeIndex]);

  useEffect(() => {
    if (activeIndex === undefined) return;
    dragRef.current.activeIndex = logicalToVisual(
      resolvedActiveIndex,
      logicalCount,
      useExtendedLoop,
    );
  }, [activeIndex, resolvedActiveIndex, logicalCount, useExtendedLoop]);

  const fillColors = useMemo(() => {
    return {
      upFill: getColorCSSVar("UIShapeSuccess"),
      downFill: getColorCSSVar("UIShapeDanger"),
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const overlay = gestureOverlayRef.current;
    if (!root || !track) return;
    if (gestureFill && !overlay) return;
    if (logicalCount <= 0) return;

    root.style.cursor = "grab";

    const setTrackY = gsap.quickSetter(track, "y", "px");
    const setOverlayOpacity = overlay ? gsap.quickSetter(overlay, "opacity") : null;
    const setOverlayBg = overlay ? gsap.quickSetter(overlay, "backgroundColor") : null;

    let lastFill: "up" | "down" | null = null;
    let relayoutRaf: number | null = null;
    let windowListenersAttached = false;
    let wheelLock = false;
    let wheelAccumulatedY = 0;
    let wheelResetTimer: number | null = null;
    let wheelUnlockTimer: number | null = null;

    // 将高频 move 合并到每帧一次（业界常用），减少重复计算/DOM 写入
    let moveRaf: number | null = null;
    let pendingMoveX: number | null = null;
    let pendingMoveY: number | null = null;
    let pendingMoveTime: number | null = null;
    let horizontalVisitorStarted = false;
    const previewTap = createFeedPreviewTap<HTMLButtonElement>();

    // ResizeObserver 也合并到 RAF，避免短时间内重复触发布局
    let resizeRaf: number | null = null;

    // 缓存上一次布局高度：避免每次 applyLayout 都重复写入所有 panel 的高度
    let lastAppliedHeight = 0;
    let lastAppliedPageCount = 0;

    /**
     * 计算布局与高度。
     * 注意：切换路由/tab 时容器可能短暂高度为 0，这里做 RAF 重试兜底。
     */
    const applyLayout = (attempt = 0) => {
      const height = root.getBoundingClientRect().height;
      if (height < 2) {
        if (attempt < 10) {
          if (relayoutRaf != null) cancelAnimationFrame(relayoutRaf);
          relayoutRaf = requestAnimationFrame(() => applyLayout(attempt + 1));
        }
        return;
      }

      dragRef.current.height = height;
      dragRef.current.width = root.getBoundingClientRect().width;

      const shouldReflowPanels =
        Math.abs(height - lastAppliedHeight) > 0.5 || lastAppliedPageCount !== extendedCount;
      if (shouldReflowPanels) {
        track.style.height = `${height * extendedCount}px`;

        for (let index = 0; index < extendedCount; index += 1) {
          const panel = panelsRef.current[index];
          if (panel) panel.style.height = `${height}px`;
        }

        lastAppliedHeight = height;
        lastAppliedPageCount = extendedCount;
      }

      const y = dragRef.current.isDragging
        ? dragRef.current.trackY
        : -dragRef.current.activeIndex * height;
      dragRef.current.trackY = y;
      setTrackY(y);
    };

    applyLayout();

    const resizeObserver = new ResizeObserver(() => {
      if (resizeRaf != null) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = null;
        applyLayout();
      });
    });
    resizeObserver.observe(root);

    const snapToVisualIndex = (nextVisual: number) => {
      const clampedVisual = clamp(nextVisual, 0, extendedCount - 1);
      const logical = visualToLogical(clampedVisual, logicalCount, useExtendedLoop);

      onActiveIndexChange?.(logical);
      if (activeIndex === undefined) setInternalActiveIndex(logical);

      dragRef.current.activeIndex = clampedVisual;

      const targetY = -clampedVisual * dragRef.current.height;
      dragRef.current.trackY = targetY;
      gsap.killTweensOf(track);
      gsap.to(track, {
        y: targetY,
        duration: ANIMATION_DURATION,
        ease: "power3.out",
        onComplete: () => {
          if (!useExtendedLoop || logicalCount < 2) return;
          const n = logicalCount;
          let v = dragRef.current.activeIndex;
          const h = dragRef.current.height;
          if (v >= 2 * n) {
            v -= n;
            gsap.set(track, { y: -v * h });
            dragRef.current.activeIndex = v;
            dragRef.current.trackY = -v * h;
            setTrackY(-v * h);
          } else if (v < n) {
            v += n;
            gsap.set(track, { y: -v * h });
            dragRef.current.activeIndex = v;
            dragRef.current.trackY = -v * h;
            setTrackY(-v * h);
          }
        },
      });
    };

    snapToVisualRef.current = snapToVisualIndex;

    // 无动画地把 visualIndex 跳到指定值，并同步 trackY，避免 dismiss
    // pages 后下一次 layout 用旧 visualIndex 计算出错误的 y。
    jumpToVisualRef.current = (nextVisual: number) => {
      const clampedVisual = clamp(nextVisual, 0, extendedCount - 1);
      dragRef.current.activeIndex = clampedVisual;
      const targetY = -clampedVisual * dragRef.current.height;
      dragRef.current.trackY = targetY;
      dragRef.current.baseTrackY = targetY;
      gsap.killTweensOf(track);
      setTrackY(targetY);
    };

    const endDragUi = () => {
      previewTap.cancel();
      dragRef.current.isDragging = false;
      dragRef.current.pointerId = null;
      dragRef.current.startedInCarousel = false;
      dragRef.current.visitorGesture = false;
      dragRef.current.axis = "vertical";
      // 松手后回到默认光标：避免抓手光标一直“粘”在 feed 上（即使指针已移出手机框）。
      root.style.cursor = "";

      lastFill = null;
      if (overlay) {
        gsap.killTweensOf(overlay);
        gsap.to(overlay, {
          opacity: 0,
          duration: 0.18,
          ease: "power2.out",
        });
      }
    };

    const attachWindowListeners = () => {
      if (windowListenersAttached) return;
      windowListenersAttached = true;
      window.addEventListener("pointerup", onPointerUpOrCancel);
      window.addEventListener("pointercancel", onPointerUpOrCancel);
    };

    const detachWindowListeners = () => {
      if (!windowListenersAttached) return;
      windowListenersAttached = false;
      window.removeEventListener("pointerup", onPointerUpOrCancel);
      window.removeEventListener("pointercancel", onPointerUpOrCancel);
    };

    /**
     * 结束拖拽时的统一“物理判定”。
     * 说明：松手、丢 capture、失焦、切到后台——全部走同一套逻辑。
     */
    const getReleaseTargetIndex = () => {
      const height = Math.max(1, dragRef.current.height);
      const vy = dragRef.current.velocityY;
      const absVy = Math.abs(vy);
      const deltaTrackY = dragRef.current.trackY - dragRef.current.baseTrackY;
      const absDeltaTrackY = Math.abs(deltaTrackY);

      // 方向：track 向上(<0) → 翻到下一条；向下(>0) → 上一条。
      const dispDir = deltaTrackY < 0 ? 1 : deltaTrackY > 0 ? -1 : 0;
      const velDir = vy < 0 ? 1 : vy > 0 ? -1 : 0;

      let dir = 0;
      if (absDeltaTrackY / height >= DISTANCE_COMMIT_RATIO) {
        // 1) 拖够距离：按净位移方向翻页。
        dir = dispDir;
      } else if (
        absVy >= FLICK_VELOCITY_THRESHOLD &&
        velDir !== 0 &&
        velDir === dispDir &&
        absDeltaTrackY >= FLICK_MIN_TRAVEL_PX
      ) {
        // 2) 快速甩动，且速度方向与净位移方向一致：允许小位移翻页。
        //    “拖一点又拖回来”时速度多与位移反向 → 落到 else 回弹。
        dir = velDir;
      }
      // 否则 dir = 0：回弹到当前页（轻微滑动 / 拖回原处）。

      return clamp(dragRef.current.activeIndex + dir, 0, extendedCount - 1);
    };

    /** 统一收口：结束拖拽 UI、移除监听、按统一物理判定吸附到目标页 */
    const finishDrag = () => {
      if (dragRef.current.visitorGesture) {
        if (moveRaf != null) {
          cancelAnimationFrame(moveRaf);
          moveRaf = null;
        }
        pendingMoveX = null;
        pendingMoveY = null;
        pendingMoveTime = null;

        const width = Math.max(1, dragRef.current.width);
        const dx = dragRef.current.lastX - dragRef.current.startX;
        const progress = clamp(-dx / width, 0, 1);
        const commit =
          progress >= VISITOR_HORIZONTAL_COMMIT_PROGRESS ||
          dragRef.current.velocityX < -VISITOR_HORIZONTAL_SWIPE_VELOCITY;
        horizontalSwipeRef.current.end?.(commit);
        horizontalVisitorStarted = false;
        endDragUi();
        detachWindowListeners();
        return;
      }

      if (moveRaf != null) {
        cancelAnimationFrame(moveRaf);
        moveRaf = null;
      }
      pendingMoveX = null;
      pendingMoveY = null;
      pendingMoveTime = null;

      applyLayout();
      endDragUi();
      detachWindowListeners();
      snapToVisualIndex(getReleaseTargetIndex());
    };

    /**
     * 非正常结束（出界/失焦/切后台等）也按 finishDrag 的同一套判定吸附。
     * 注意：这里名字保留语义但不再“就近吸附”。
     */
    const forceFinishFromAbort = () => {
      if (!dragRef.current.isDragging) return;
      finishDrag();
    };

    const isInteractiveTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      if (target.closest("[data-feed-photo-carousel]")) return false;

      const control = target.closest(
          "button, a, input, textarea, select, [role='button'], [role='link'], [data-no-drag]",
      );
      // Only the explicit preview hit area permits pager drags; social controls do not.
      return Boolean(control && !control.matches("button[data-feed-preview-tap]"));
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (dragRef.current.isDragging) { previewTap.cancel(); return; }
      if (event.isPrimary === false) return;

      // If the user is interacting with a real control, don't hijack it as a drag gesture.
      // Otherwise preventDefault() would suppress the ensuing click.
      if (isInteractiveTarget(event.target)) return;

      const startedInCarousel =
        event.target instanceof Element &&
        Boolean(event.target.closest("[data-feed-photo-carousel]"));
      if (!startedInCarousel && event.cancelable) event.preventDefault();

      applyLayout();

      dragRef.current.pointerId = event.pointerId;
      dragRef.current.isDragging = true;
      dragRef.current.startX = event.clientX;
      dragRef.current.startY = event.clientY;
      dragRef.current.startTime = performance.now();
      const previewButton = event.target instanceof Element
        ? event.target.closest<HTMLButtonElement>("button[data-feed-preview-tap]") : null;
      previewTap.start(previewButton, event.pointerId, event.clientX, event.clientY, dragRef.current.startTime);
      dragRef.current.lastX = event.clientX;
      dragRef.current.lastY = event.clientY;
      dragRef.current.lastTime = dragRef.current.startTime;
      dragRef.current.velocityY = 0;
      dragRef.current.velocityX = 0;
      dragRef.current.baseTrackY = dragRef.current.trackY;
      dragRef.current.startedInCarousel = startedInCarousel;
      dragRef.current.visitorGesture = false;
      horizontalVisitorStarted = false;
      const visitorGesturesEnabled = Boolean(horizontalSwipeRef.current.move);
      dragRef.current.axis =
        startedInCarousel || visitorGesturesEnabled ? "undecided" : "vertical";

      // 重置 move 合并状态
      if (moveRaf != null) {
        cancelAnimationFrame(moveRaf);
        moveRaf = null;
      }
      pendingMoveX = null;
      pendingMoveY = null;
      pendingMoveTime = null;

      if (event.pointerType === "mouse") root.style.cursor = "grabbing";

      gsap.killTweensOf(track);

      if (overlay && setOverlayOpacity) {
        gsap.killTweensOf(overlay);
        setOverlayOpacity(0);
      }

      attachWindowListeners();

      if (!startedInCarousel) {
        try {
          // pointer capture 能保证移出元素后仍能收到 move/up；失败时由 window 监听兜底
          root.setPointerCapture(event.pointerId);
        } catch {
          // ignore
        }
      }
    };

    const flushPendingMove = () => {
      moveRaf = null;
      if (!dragRef.current.isDragging) return;

      const clientX = pendingMoveX;
      const clientY = pendingMoveY;
      const now = pendingMoveTime;
      if (clientY == null || now == null) return;

      const dx = clientX != null ? clientX - dragRef.current.startX : 0;
      const dy = clientY - dragRef.current.startY;

      if (dragRef.current.axis === "undecided") {
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (dragRef.current.startedInCarousel) {
          if (absDx < CAROUSEL_AXIS_LOCK_MIN_X_PX && absDy < CAROUSEL_AXIS_LOCK_MIN_Y_PX) {
            return;
          }
          if (
            absDx >=
            Math.max(CAROUSEL_AXIS_LOCK_MIN_X_PX, absDy * CAROUSEL_HORIZONTAL_BIAS)
          ) {
            dragRef.current.axis = "horizontal";
          } else if (
            absDy >= CAROUSEL_AXIS_LOCK_MIN_Y_PX &&
            absDy >= absDx * CAROUSEL_VERTICAL_BIAS
          ) {
            dragRef.current.axis = "vertical";
          } else {
            return;
          }
        } else if (horizontalSwipeRef.current.move) {
          if (absDx < VISITOR_AXIS_LOCK_DECIDE_PX && absDy < VISITOR_AXIS_LOCK_DECIDE_PX) {
            return;
          }

          if (dx < 0) {
            if (
              absDx >= VISITOR_AXIS_LOCK_DECIDE_PX &&
              isWithinVisitorProfileSwipeCone(absDx, absDy)
            ) {
              dragRef.current.visitorGesture = true;
              dragRef.current.axis = "vertical";
              return;
            }
            if (shouldLockFeedVerticalScroll(absDx, absDy)) {
              dragRef.current.axis = "vertical";
              return;
            }
            return;
          }

          if (shouldLockFeedVerticalScroll(absDx, absDy)) {
            dragRef.current.axis = "vertical";
            return;
          }
          return;
        } else {
          dragRef.current.axis = "vertical";
        }
      }

      if (dragRef.current.visitorGesture) {
        const dt = Math.max(1, now - dragRef.current.lastTime);
        const instantVx = (clientX! - dragRef.current.lastX) / dt;
        dragRef.current.velocityX =
          dragRef.current.velocityX * (1 - VELOCITY_FILTER_ALPHA) +
          instantVx * VELOCITY_FILTER_ALPHA;
        dragRef.current.lastX = clientX!;
        dragRef.current.lastY = clientY;
        dragRef.current.lastTime = now;

        if (!horizontalVisitorStarted) {
          horizontalVisitorStarted = true;
          horizontalSwipeRef.current.start?.();
        }
        const width = Math.max(1, dragRef.current.width);
        horizontalSwipeRef.current.move?.(clamp(-dx / width, 0, 1));
        return;
      }

      if (dragRef.current.axis === "horizontal") return;

      const currentVisual = dragRef.current.activeIndex;
      const loopPastPhysicalStart =
        useExtendedLoop && logicalCount >= 2 && currentVisual === 0 && dy > 0;
      const loopPastPhysicalEnd =
        useExtendedLoop &&
        logicalCount >= 2 &&
        currentVisual === extendedCount - 1 &&
        dy < 0;
      const pastStart = currentVisual === 0 && dy > 0;
      const pastEnd = currentVisual === extendedCount - 1 && dy < 0;
      const resistOverscroll =
        useExtendedLoop && logicalCount >= 2
          ? loopPastPhysicalStart || loopPastPhysicalEnd
          : pastStart || pastEnd;

      let resistedDy = dy;
      if (resistOverscroll) {
        // 到整条轨道物理首尾再继续拖时阻尼（loop 仍在中间段正常滑向相邻页）
        resistedDy = dy * OVERSCROLL_RESISTANCE;
      }

      const nextY = dragRef.current.baseTrackY + resistedDy;
      dragRef.current.trackY = nextY;
      setTrackY(nextY);

      if (overlay && setOverlayOpacity && setOverlayBg) {
        const height = Math.max(1, dragRef.current.height);
        const fillRatio = clamp(Math.abs(dy) / height, 0, 1);
        const nextFill = dy < 0 ? "up" : "down";

        if (nextFill !== lastFill) {
          setOverlayBg(nextFill === "up" ? fillColors.upFill : fillColors.downFill);
          lastFill = nextFill;
        }

        setOverlayOpacity(fillRatio * 0.75);
      }

      // 速度估算：用 dt 做瞬时速度，再做轻微低通滤波（更稳定）
      const dt = Math.max(1, now - dragRef.current.lastTime);
      const instantVy = (clientY - dragRef.current.lastY) / dt;
      dragRef.current.velocityY =
        dragRef.current.velocityY * (1 - VELOCITY_FILTER_ALPHA) +
        instantVy * VELOCITY_FILTER_ALPHA;
      dragRef.current.lastX = clientX ?? dragRef.current.lastX;
      dragRef.current.lastY = clientY;
      dragRef.current.lastTime = now;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragRef.current.isDragging) return;
      if (dragRef.current.pointerId !== event.pointerId) return;
      previewTap.move(event.pointerId, event.clientX, event.clientY);

      // 鼠标移出手机框/浏览器窗口外松手时收不到 pointerup，拖拽状态会卡住，
      // 等指针移回来内容就“无按键跟手”。这里在 move 时检测按键已全部抬起就立即收口。
      if (event.pointerType === "mouse" && event.buttons === 0) {
        finishDrag();
        return;
      }

      if (dragRef.current.axis === "horizontal") return;

      if (
        dragRef.current.axis !== "vertical" &&
        !dragRef.current.visitorGesture &&
        dragRef.current.axis !== "undecided"
      ) {
        return;
      }

      if (event.cancelable) event.preventDefault();

      // 合并到 RAF：只记录最新位置，下一帧统一更新 UI/速度
      pendingMoveX = event.clientX;
      pendingMoveY = event.clientY;
      pendingMoveTime = performance.now();
      if (moveRaf == null) moveRaf = requestAnimationFrame(flushPendingMove);
    };

    const onPointerUpOrCancel = (event: PointerEvent) => {
      if (!dragRef.current.isDragging) return;
      if (dragRef.current.pointerId !== event.pointerId) return;
      const previewButton = event.type === "pointerup"
        ? previewTap.release(event.pointerId, event.clientX, event.clientY, performance.now()) : null;
      previewTap.cancel();

      if (dragRef.current.axis === "horizontal") {
        dragRef.current.pointerId = null;
        dragRef.current.isDragging = false;
        dragRef.current.startedInCarousel = false;
        dragRef.current.axis = "vertical";
        root.style.cursor = "";
        detachWindowListeners();
        return;
      }

      // 松手：按统一 finishDrag 收口（与出界/失焦等“放弃结束”同物理）
      finishDrag();
      // Pointer capture retargets the browser click to the pager. Dispatch exactly
      // one native button activation for a stationary release; keyboard clicks
      // still use the button normally. Drags, cancels and long presses never play.
      if (previewButton?.isConnected && !previewButton.disabled) previewButton.click();
    };

    const onLostPointerCapture = () => {
      forceFinishFromAbort();
    };

    const onWindowBlur = () => {
      forceFinishFromAbort();
    };

    const onVisibilityChange = () => {
      if (document.hidden) forceFinishFromAbort();
    };

    const resetWheelAccumulator = () => {
      wheelAccumulatedY = 0;
      if (wheelResetTimer != null) {
        window.clearTimeout(wheelResetTimer);
        wheelResetTimer = null;
      }
    };

    const onWheel = (event: WheelEvent) => {
      if (window.innerWidth < DESKTOP_WHEEL_MIN_WIDTH) return;
      if (dragRef.current.isDragging || logicalCount <= 1) return;
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

      event.preventDefault();

      if (wheelLock) return;

      wheelAccumulatedY += event.deltaY;
      if (wheelResetTimer != null) window.clearTimeout(wheelResetTimer);
      wheelResetTimer = window.setTimeout(() => {
        wheelAccumulatedY = 0;
        wheelResetTimer = null;
      }, WHEEL_RESET_MS);

      if (Math.abs(wheelAccumulatedY) < WHEEL_TRIGGER_THRESHOLD_PX) return;

      const direction = wheelAccumulatedY > 0 ? 1 : -1;
      resetWheelAccumulator();

      const currentVisual = dragRef.current.activeIndex;
      const nextVisual = clamp(currentVisual + direction, 0, extendedCount - 1);
      if (nextVisual === currentVisual) return;

      wheelLock = true;
      snapToVisualIndex(nextVisual);
      if (wheelUnlockTimer != null) window.clearTimeout(wheelUnlockTimer);
      wheelUnlockTimer = window.setTimeout(() => {
        wheelLock = false;
        wheelUnlockTimer = null;
      }, WHEEL_COOLDOWN_MS);
    };

    root.addEventListener("pointerdown", onPointerDown);
    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerup", onPointerUpOrCancel);
    root.addEventListener("pointercancel", onPointerUpOrCancel);
    root.addEventListener("lostpointercapture", onLostPointerCapture);
    root.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("blur", onWindowBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      previewTap.cancel();
      detachWindowListeners();
      snapToVisualRef.current = null;
      jumpToVisualRef.current = null;
      if (moveRaf != null) cancelAnimationFrame(moveRaf);
      if (resizeRaf != null) cancelAnimationFrame(resizeRaf);
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerup", onPointerUpOrCancel);
      root.removeEventListener("pointercancel", onPointerUpOrCancel);
      root.removeEventListener("lostpointercapture", onLostPointerCapture);
      root.removeEventListener("wheel", onWheel);
      window.removeEventListener("blur", onWindowBlur);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      resizeObserver.disconnect();
      resetWheelAccumulator();
      if (wheelUnlockTimer != null) window.clearTimeout(wheelUnlockTimer);
      if (relayoutRaf != null) cancelAnimationFrame(relayoutRaf);
      gsap.killTweensOf(track);
      root.style.cursor = "";
    };
  }, [
    activeIndex,
    extendedCount,
    fillColors.downFill,
    fillColors.upFill,
    gestureFill,
    logicalCount,
    onActiveIndexChange,
    useExtendedLoop,
  ]);

  useImperativeHandle(
    handleRef,
    () => ({
      next: () => {
        const snap = snapToVisualRef.current;
        if (!snap) return;
        snap(dragHolderRef.current!.activeIndex + 1);
      },
      prev: () => {
        const snap = snapToVisualRef.current;
        if (!snap) return;
        snap(dragHolderRef.current!.activeIndex - 1);
      },
      jumpToLogical: (logical: number) => {
        // 同步把内部 visualIndex 调到目标 logical（无动画），并立刻
        // 把 trackY 也对齐到对应位置，避免 dismiss pages 等场景下旧
        // visualIndex 与新 pages 错位导致出现"跳到错误的 feed"的视觉 bug。
        const visual = logicalToVisual(logical, logicalCount, useExtendedLoop);
        const jump = jumpToVisualRef.current;
        if (jump) {
          jump(visual);
        } else {
          // 兜底：effect 还没挂上，也至少把 ref 内 index 对齐
          dragHolderRef.current!.activeIndex = visual;
        }
        if (activeIndex === undefined) setInternalActiveIndex(logical);
      },
    }),
    [logicalCount, useExtendedLoop, activeIndex],
  );

  if (logicalCount <= 0) {
    return (
      <div
        ref={rootRef}
        className={className}
        style={{ touchAction: "none", ...(style ?? {}) }}
      />
    );
  }

  const overlayEl = gestureFill ? (
    <div
      ref={gestureOverlayRef}
      className="z-0 absolute inset-0 pointer-events-none"
      style={{ opacity: 0 }}
    />
  ) : null;

  return (
    <div
      ref={rootRef}
      data-vertical-snap-pager-root="true"
      className={`relative w-full h-full overflow-hidden select-none cursor-grab ${className ?? ""}`}
      style={{ touchAction: "none", ...(style ?? {}) }}
    >
      {overlayEl}

      <div
        ref={trackRef}
        className="z-10 relative w-full"
        style={{ willChange: "transform" }}
      >
        {panelNodes.map((node, index) => (
          <div
            key={index}
            ref={(el) => {
              panelsRef.current[index] = el;
            }}
            className="relative w-full"
          >
            {node}
          </div>
        ))}
      </div>
    </div>
  );
});
