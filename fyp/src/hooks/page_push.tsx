/**
 * 页内 push/pop 转场栈（与 URL 并存）。
 *
 * ## 应用内导航（同一次用户操作）
 * 1. `markStackNavigation()` — 避免 URL sync effect 用 `reset` 打断动画
 * 2. `navigate(appPathForRoute(...))`
 * 3. `push(payload)` 或 `pop(payload)`
 *
 * ## 禁止
 * - 仅用 `reset()` 根据 URL 换屏（跳过动画）
 * - 只改 URL 不调 push/pop；只 push/pop 不改 URL
 * - `useLayoutEffect` 里无条件 `reset` 同步 URL
 *
 * ## 外部导航（Routes 菜单、popstate）
 * 由 sync effect 调 `push`/`pop` 对齐栈，不要 `reset`（除非无法映射）。
 *
 * 两级根→详情：见 `sync_route_page_stack.ts`。
 * URL 定义：见 `routes/app_route_tree.ts`。
 */
import type { ColorV2Name } from "@byted-tiktok/tux-color";
import { getColorCSSVar } from "@byted-tiktok/tux-web";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";

type PagePushTrigger = HTMLElement | null | RefObject<HTMLElement | null>;

type PagePushStackItem = {
  key: string;
  page: ReactNode;
  returnFocusTo: HTMLElement | null;
  pageOffset: string;
};

type PagePushTransitionKind = "push" | "pop";
type PagePushTransitionStyle = "slide" | "none";

type PagePushTransitionState = {
  id: string;
  kind: PagePushTransitionKind;
  style: PagePushTransitionStyle;
  enteringKey: string;
  leavingKey: string;
  anchorY: number;
};

export type PagePushPayload = {
  trigger?: PagePushTrigger;
  incomingPage: ReactNode;
  outgoingPage?: ReactNode;
  incomingKey?: string;
  outgoingKey?: string;
  incomingPageOffset?: string;
  outgoingPageOffset?: string;
  transitionStyle?: PagePushTransitionStyle;
};

export type PagePopPayload = {
  trigger?: PagePushTrigger;
  incomingPage?: ReactNode;
  outgoingPage?: ReactNode;
  incomingPageOffset?: string;
  outgoingPageOffset?: string;
  transitionStyle?: PagePushTransitionStyle;
};

export type PagePushStageOptions = {
  initialPage?: ReactNode;
  initialKey?: string;
  durationMs?: number;
  pageOffset?: string;
  overlayColor?: ColorV2Name;
  overlayOpacity?: number;
  backdropBlurPx?: number;
};

export type PagePushStageController = {
  readonly pages: readonly PagePushStackItem[];
  readonly transition: PagePushTransitionState | null;
  readonly isTransitioning: boolean;
  readonly canPop: boolean;
  readonly activePage: ReactNode | null;
  readonly durationMs: number;
  readonly pageOffset: string;
  readonly overlayColor: ColorV2Name;
  readonly overlayOpacity: number;
  readonly backdropBlurPx: number;
  readonly setStageElement: (node: HTMLDivElement | null) => void;
  /** Synchronous stack read (matches what push/pop use), not the last React render snapshot. */
  getStackSnapshot: () => readonly PagePushStackItem[];
  /** Active transition, if any (synchronous). */
  getActiveTransition: () => PagePushTransitionState | null;
  push: (payload: PagePushPayload) => void;
  pop: (payload?: PagePopPayload) => void;
  reset: (page: ReactNode, key?: string, pageOffset?: string) => void;
  replace: (page: ReactNode, key?: string, pageOffset?: string) => void;
};

export type PagePushStageProps = {
  manager: PagePushStageController;
  className?: string;
  style?: CSSProperties;
  pageStyle?: CSSProperties;
};

const DEFAULT_DURATION_MS = 360;
const DEFAULT_PAGE_OFFSET = "28%";
const DEFAULT_OVERLAY_COLOR: ColorV2Name = "UISheetBackdrop1";
const DEFAULT_OVERLAY_OPACITY = 1;
const DEFAULT_BACKDROP_BLUR_PX = 0;
const TRANSITION_TIMING = "cubic-bezier(0.32, 0.72, 0, 1)";

function resolveTriggerElement(trigger?: PagePushTrigger) {
  if (!trigger) {
    return null;
  }

  if (typeof HTMLElement !== "undefined" && trigger instanceof HTMLElement) {
    return trigger;
  }

  if ("current" in trigger) {
    return trigger.current;
  }

  return null;
}

function resolveAnchorY(trigger: HTMLElement | null, container: HTMLElement | null) {
  if (!trigger || !container) {
    return 50;
  }

  const triggerRect = trigger.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const centerY = triggerRect.top + triggerRect.height / 2;
  const relative = ((centerY - containerRect.top) / Math.max(containerRect.height, 1)) * 100;

  return Math.min(100, Math.max(0, relative));
}

function settlePages(pages: PagePushStackItem[], transition: PagePushTransitionState | null) {
  if (!transition || transition.kind === "push") {
    return pages;
  }

  return pages.filter((page) => page.key !== transition.leavingKey);
}

function createTransform(translateX: string, scale: number) {
  return `translate3d(${translateX}, 0, 0) scale(${scale})`;
}

function getStackedTranslateX(pages: readonly PagePushStackItem[], pageIndex: number, visibleCount: number) {
  const offsetParts = pages.slice(pageIndex, Math.max(pageIndex, visibleCount - 1)).map((page) => page.pageOffset);

  if (offsetParts.length === 0) {
    return "0%";
  }

  if (offsetParts.length === 1) {
    return `-${offsetParts[0]}`;
  }

  return `calc(-1 * (${offsetParts.join(" + ")}))`;
}

function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    update();

    mediaQuery.addEventListener("change", update);

    return () => {
      mediaQuery.removeEventListener("change", update);
    };
  }, []);

  return prefersReducedMotion;
}

export function usePagePushStage({
  initialPage,
  initialKey,
  durationMs = DEFAULT_DURATION_MS,
  pageOffset = DEFAULT_PAGE_OFFSET,
  overlayColor = DEFAULT_OVERLAY_COLOR,
  overlayOpacity = DEFAULT_OVERLAY_OPACITY,
  backdropBlurPx = DEFAULT_BACKDROP_BLUR_PX,
}: PagePushStageOptions = {}): PagePushStageController {
  const instanceId = useId().replace(/:/g, "");
  const keySequenceRef = useRef(0);
  const reducedMotion = useReducedMotion();
  const stageElementRef = useRef<HTMLDivElement | null>(null);

  const createKey = useCallback(
    (scope: string) => {
      keySequenceRef.current += 1;
      return `${instanceId}-${scope}-${keySequenceRef.current}`;
    },
    [instanceId],
  );

  const initialStack = useMemo<PagePushStackItem[]>(
    () =>
      initialPage === undefined
        ? []
        : [
            {
              key: initialKey ?? `${instanceId}-root-0`,
              page: initialPage,
              returnFocusTo: null,
              pageOffset,
            },
          ],
    [initialKey, initialPage, instanceId, pageOffset],
  );

  const [pages, setPagesState] = useState<PagePushStackItem[]>(initialStack);
  const pagesRef = useRef<PagePushStackItem[]>(initialStack);
  const [transition, setTransitionState] = useState<PagePushTransitionState | null>(null);
  const transitionRef = useRef<PagePushTransitionState | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const updatePages = useCallback((nextPages: PagePushStackItem[]) => {
    pagesRef.current = nextPages;
    setPagesState(nextPages);
  }, []);

  const updateTransition = useCallback((nextTransition: PagePushTransitionState | null) => {
    transitionRef.current = nextTransition;
    setTransitionState(nextTransition);
  }, []);

  const finishTransition = useCallback(
    (activeTransition: PagePushTransitionState) => {
      const settled = settlePages(pagesRef.current, activeTransition);
      const leavingPage = pagesRef.current.find((page) => page.key === activeTransition.leavingKey);

      updatePages(settled);
      updateTransition(null);
      setIsTransitioning(false);

      if (activeTransition.kind === "pop" && leavingPage?.returnFocusTo?.isConnected) {
        leavingPage.returnFocusTo.focus();
      }
    },
    [updatePages, updateTransition],
  );

  useEffect(() => {
    if (!transition) {
      return undefined;
    }

    const transitionDurationMs = transition.style === "none" || reducedMotion ? 0 : durationMs;

    if (transitionDurationMs === 0) {
      finishTransition(transition);
      return undefined;
    }

    setIsTransitioning(false);

    const animationFrame = window.requestAnimationFrame(() => {
      setIsTransitioning(true);
    });

    const timeout = window.setTimeout(() => {
      finishTransition(transition);
    }, transitionDurationMs);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(timeout);
    };
  }, [durationMs, finishTransition, reducedMotion, transition]);

  const setStageElement = useCallback((node: HTMLDivElement | null) => {
    stageElementRef.current = node;
  }, []);

  const push = useCallback(
    ({
      trigger,
      incomingPage,
      outgoingPage,
      incomingKey,
      outgoingKey,
      incomingPageOffset,
      outgoingPageOffset,
      transitionStyle = "slide",
    }: PagePushPayload) => {
      const triggerElement = resolveTriggerElement(trigger);
      const basePages = settlePages(pagesRef.current, transitionRef.current);
      const nextPages = [...basePages];

      if (nextPages.length === 0 && outgoingPage !== undefined) {
        nextPages.push({
          key: outgoingKey ?? createKey("root"),
          page: outgoingPage,
          returnFocusTo: null,
          pageOffset: outgoingPageOffset ?? pageOffset,
        });
      } else if (nextPages.length > 0 && outgoingPage !== undefined) {
        const activeIndex = nextPages.length - 1;
        const activePage = nextPages[activeIndex];

        nextPages[activeIndex] = {
          ...activePage,
          key: outgoingKey ?? activePage.key,
          page: outgoingPage,
          pageOffset: outgoingPageOffset ?? activePage.pageOffset,
        };
      }

      const leavingPage = nextPages.at(-1);

      if (!leavingPage) {
        updatePages([
          {
            key: incomingKey ?? createKey("page"),
            page: incomingPage,
            returnFocusTo: triggerElement,
            pageOffset: incomingPageOffset ?? pageOffset,
          },
        ]);
        updateTransition(null);
        setIsTransitioning(false);
        return;
      }

      const enteringPage: PagePushStackItem = {
        key: incomingKey ?? createKey("page"),
        page: incomingPage,
        returnFocusTo: triggerElement,
        pageOffset: incomingPageOffset ?? pageOffset,
      };

      const nextTransition: PagePushTransitionState = {
        id: createKey("transition"),
        kind: "push",
        style: transitionStyle,
        enteringKey: enteringPage.key,
        leavingKey: leavingPage.key,
        anchorY: resolveAnchorY(triggerElement, stageElementRef.current),
      };

      updatePages([...nextPages, enteringPage]);
      updateTransition(nextTransition);
    },
    [createKey, pageOffset, updatePages, updateTransition],
  );

  const pop = useCallback(
    (payload?: PagePopPayload) => {
      const triggerElement = resolveTriggerElement(payload?.trigger);
      const basePages = settlePages(pagesRef.current, transitionRef.current);

      if (basePages.length <= 1) {
        const fallbackPage = payload?.incomingPage ?? basePages[0]?.page ?? payload?.outgoingPage;

        updatePages(
          fallbackPage === undefined
            ? []
            : [
                {
                  key: basePages[0]?.key ?? createKey("root"),
                  page: fallbackPage,
                  returnFocusTo: null,
                  pageOffset: payload?.incomingPageOffset ?? basePages[0]?.pageOffset ?? pageOffset,
                },
              ],
        );
        updateTransition(null);
        setIsTransitioning(false);
        return;
      }

      const nextPages = [...basePages];
      const leavingIndex = nextPages.length - 1;
      const enteringIndex = leavingIndex - 1;
      const leavingPage = nextPages[leavingIndex];
      const enteringPage = nextPages[enteringIndex];

      nextPages[leavingIndex] = {
        ...leavingPage,
        page: payload?.outgoingPage ?? leavingPage.page,
        pageOffset: payload?.outgoingPageOffset ?? leavingPage.pageOffset,
      };

      nextPages[enteringIndex] = {
        ...enteringPage,
        page: payload?.incomingPage ?? enteringPage.page,
        pageOffset: payload?.incomingPageOffset ?? enteringPage.pageOffset,
      };

      const nextTransition: PagePushTransitionState = {
        id: createKey("transition"),
        kind: "pop",
        style: payload?.transitionStyle ?? "slide",
        enteringKey: enteringPage.key,
        leavingKey: leavingPage.key,
        anchorY: resolveAnchorY(triggerElement, stageElementRef.current),
      };

      updatePages(nextPages);
      updateTransition(nextTransition);
    },
    [createKey, pageOffset, updatePages, updateTransition],
  );

  const reset = useCallback(
    (page: ReactNode, key?: string, nextPageOffset?: string) => {
      updatePages([
        {
          key: key ?? createKey("root"),
          page,
          returnFocusTo: null,
          pageOffset: nextPageOffset ?? pageOffset,
        },
      ]);
      updateTransition(null);
      setIsTransitioning(false);
    },
    [createKey, pageOffset, updatePages, updateTransition],
  );

  const replace = useCallback(
    (page: ReactNode, key?: string, nextPageOffset?: string) => {
      const basePages = settlePages(pagesRef.current, transitionRef.current);

      if (basePages.length === 0) {
        updatePages([
          {
            key: key ?? createKey("root"),
            page,
            returnFocusTo: null,
            pageOffset: nextPageOffset ?? pageOffset,
          },
        ]);
        updateTransition(null);
        setIsTransitioning(false);
        return;
      }

      const targetKey = key ?? basePages.at(-1)?.key;

      if (!targetKey) {
        return;
      }

      const hasTargetKey = basePages.some((item) => item.key === targetKey);
      if (!hasTargetKey) {
        // URL / external navigation often targets a key that is not on the stack yet.
        updatePages([
          {
            key: targetKey,
            page,
            returnFocusTo: null,
            pageOffset: nextPageOffset ?? pageOffset,
          },
        ]);
        updateTransition(null);
        setIsTransitioning(false);
        return;
      }

      updatePages(
        basePages.map((item) =>
          item.key === targetKey
            ? { ...item, page, pageOffset: nextPageOffset ?? item.pageOffset }
            : item,
        ),
      );
    },
    [createKey, pageOffset, updatePages, updateTransition],
  );

  const getStackSnapshot = useCallback(() => pagesRef.current, []);
  const getActiveTransition = useCallback(() => transitionRef.current, []);

  return {
    pages,
    transition,
    isTransitioning,
    canPop: pages.length > 1,
    activePage: pages.at(-1)?.page ?? null,
    durationMs,
    pageOffset,
    overlayColor,
    overlayOpacity,
    backdropBlurPx,
    setStageElement,
    getStackSnapshot,
    getActiveTransition,
    push,
    pop,
    reset,
    replace,
  };
}

function getOverlayOpacity({
  pageIndex,
  pageCount,
  pageKey,
  transition,
  isTransitioning,
  overlayOpacity,
}: {
  pageIndex: number;
  pageCount: number;
  pageKey: string;
  transition: PagePushTransitionState | null;
  isTransitioning: boolean;
  overlayOpacity: number;
}) {
  const depth = pageCount - pageIndex - 1;
  const settledOverlayOpacity = Math.min(1, overlayOpacity + Math.max(depth - 1, 0) * 0.04);

  if (!transition) {
    if (depth <= 0) {
      return 0;
    }

    return settledOverlayOpacity;
  }

  if (transition.style === "none") {
    return 0;
  }

  if (transition.kind === "push" && pageKey === transition.leavingKey) {
    return isTransitioning ? overlayOpacity : 0;
  }

  if (transition.kind === "pop" && pageKey === transition.enteringKey) {
    return isTransitioning ? 0 : overlayOpacity;
  }

  if (depth <= 0) {
    return 0;
  }

  return settledOverlayOpacity;
}

function getPageTransform({
  pages,
  depth,
  pageIndex,
  pageKey,
  transition,
  isTransitioning,
}: {
  pages: readonly PagePushStackItem[];
  depth: number;
  pageIndex: number;
  pageKey: string;
  transition: PagePushTransitionState | null;
  isTransitioning: boolean;
}): string | undefined {
  if (!transition) {
    if (depth === 0) {
      return undefined;
    }

    return createTransform(getStackedTranslateX(pages, pageIndex, pages.length), 1);
  }

  if (transition.style === "none") {
    return undefined;
  }

  if (transition.kind === "push") {
    if (pageKey === transition.enteringKey) {
      return isTransitioning
        ? createTransform("0%", 1)
        : createTransform("100%", 0.998);
    }

    return isTransitioning
      ? createTransform(getStackedTranslateX(pages, pageIndex, pages.length), 1)
      : createTransform(getStackedTranslateX(pages, pageIndex, pages.length - 1), 1);
  }

  if (transition.kind === "pop") {
    if (pageKey === transition.leavingKey) {
      return isTransitioning
        ? createTransform("100%", 0.998)
        : undefined;
    }

    return isTransitioning
      ? createTransform(getStackedTranslateX(pages, pageIndex, pages.length - 1), 1)
      : createTransform(getStackedTranslateX(pages, pageIndex, pages.length), 0.996);
  }

  if (depth === 0) {
    return undefined;
  }

  return createTransform(getStackedTranslateX(pages, pageIndex, pages.length), 1);
}

const PAGE_PUSH_STAGE_DEFAULT_CLASS =
  "h-full min-h-0 w-full min-w-0 overflow-hidden";

export function PagePushStage({
  manager,
  className = PAGE_PUSH_STAGE_DEFAULT_CLASS,
  style,
  pageStyle,
}: PagePushStageProps) {
  const transitionDuration = manager.isTransitioning ? manager.durationMs : 0;
  const containerClassName = [className].filter(Boolean).join(" ");

  return (
    <div
      ref={manager.setStageElement}
      className={containerClassName}
      style={{
        display: "grid",
        width: "100%",
        minWidth: 0,
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        isolation: "isolate",
        ...style,
      }}
    >
      {manager.pages.map((page, pageIndex) => {
        const depth = manager.pages.length - pageIndex - 1;
        const isTopPage = depth === 0;
        const overlayAlpha = getOverlayOpacity({
          pageIndex,
          pageCount: manager.pages.length,
          pageKey: page.key,
          transition: manager.transition,
          isTransitioning: manager.isTransitioning,
          overlayOpacity: manager.overlayOpacity,
        });
        const transform = getPageTransform({
          pages: manager.pages,
          depth,
          pageIndex,
          pageKey: page.key,
          transition: manager.transition,
          isTransitioning: manager.isTransitioning,
        });

        return (
          <div
            key={page.key}
            style={{
              gridArea: "1 / 1",
              position: "relative",
              width: "100%",
              minWidth: 0,
              height: "100%",
              minHeight: 0,
              zIndex: pageIndex + 1,
              pointerEvents: isTopPage ? "auto" : "none",
              ...(transform
                ? {
                    transform,
                    transformOrigin: `100% ${manager.transition?.anchorY ?? 50}%`,
                  }
                : {}),
              transitionProperty: transform || manager.isTransitioning ? "transform" : undefined,
              transitionDuration: `${transitionDuration}ms`,
              transitionTimingFunction: TRANSITION_TIMING,
              willChange: manager.transition ? "transform" : undefined,
              ...pageStyle,
            }}
          >
            <div
              style={{
                position: "relative",
                zIndex: 0,
                width: "100%",
                minWidth: 0,
                height: "100%",
                minHeight: 0,
              }}
            >
              {page.page}
            </div>

            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 1,
                backgroundColor: getColorCSSVar(manager.overlayColor),
                opacity: overlayAlpha,
                backdropFilter:
                  manager.backdropBlurPx > 0 ? `blur(${manager.backdropBlurPx}px)` : undefined,
                transitionProperty: "opacity, backdrop-filter",
                transitionDuration: `${transitionDuration}ms`,
                transitionTimingFunction: TRANSITION_TIMING,
                pointerEvents: "none",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default PagePushStage;
