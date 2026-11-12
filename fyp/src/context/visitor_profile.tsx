import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { FeedItemCardContent } from "../page/home/components/feed_item_card";

export type VisitorPhase = "closed" | "dragging" | "open";

/** iOS push 转场时长与缓动（接近 UINavigationController 的手感）。 */
const OPEN_DURATION_MS = 380;
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
/** 旧页面向左视差的比例（iOS 约 0.3，这里 0.25 略保守）。 */
const PARALLAX_RATIO = 0.25;
/** 旧页面被压住时的最大变暗透明度。 */
const DIM_MAX = 0.12;

type Targets = {
  layer: HTMLElement | null;
  behind: HTMLElement | null;
  dim: HTMLElement | null;
};

type VisitorProfileContextValue = {
  content: FeedItemCardContent | null;
  phase: VisitorPhase;
  durationMs: number;
  /** 点击头像/用户名进入（非跟手，直接以转场动画推入）。 */
  openVisitorProfile: (content: FeedItemCardContent) => void;
  /** 返回（向右滑出）。 */
  closeVisitorProfile: () => void;
  /** 左滑手势开始：设定要展示的用户，进入跟手态。 */
  beginVisitorDrag: (content: FeedItemCardContent) => void;
  /** 左滑手势进行中：progress 0(关闭) → 1(完全打开)。 */
  setVisitorDragProgress: (progress: number) => void;
  /** 左滑手势结束：commit=true 完成推入，false 回弹关闭。 */
  endVisitorDrag: (commit: boolean) => void;
  registerLayer: (el: HTMLElement | null) => void;
  registerBehind: (el: HTMLElement | null) => void;
  registerDim: (el: HTMLElement | null) => void;
};

const VisitorProfileContext = createContext<VisitorProfileContextValue | null>(null);

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function VisitorProfileProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<FeedItemCardContent | null>(null);
  const [phase, setPhase] = useState<VisitorPhase>("closed");

  const targetsRef = useRef<Targets>({ layer: null, behind: null, dim: null });
  const closeTimerRef = useRef<number | null>(null);

  /**
   * 命令式地把三个元素摆到指定进度。
   * 拖动过程用 withTransition=false（即时跟手），松手/点击用 true（带缓动）。
   * 注意：transform / transition / opacity 全部命令式写入，React 不参与，避免每帧重渲染。
   */
  const applyVisual = useCallback((progress: number, withTransition: boolean) => {
    const p = clamp01(progress);
    const { layer, behind, dim } = targetsRef.current;
    const transformTransition = withTransition
      ? `transform ${OPEN_DURATION_MS}ms ${EASE}`
      : "none";

    if (layer) {
      if (p >= 1) {
        layer.style.transition = transformTransition;
        if (withTransition) {
          layer.style.transform = "translate3d(0,0,0)";
          const onTransitionEnd = (event: TransitionEvent) => {
            if (event.propertyName !== "transform") return;
            layer.style.transform = "none";
            layer.style.willChange = "auto";
          };
          layer.addEventListener("transitionend", onTransitionEnd, { once: true });
        } else {
          layer.style.transform = "none";
          layer.style.willChange = "auto";
        }
      } else {
        if (layer.style.transform === "none" || layer.style.transform === "") {
          layer.style.transition = "none";
          layer.style.transform = "translate3d(0,0,0)";
          void layer.offsetWidth;
        }
        layer.style.transition = transformTransition;
        layer.style.transform = `translate3d(${(1 - p) * 100}%,0,0)`;
        layer.style.willChange = "transform";
      }
    }
    if (behind) {
      if (p <= 0) {
        behind.style.transition = transformTransition;
        if (withTransition) {
          behind.style.transform = "translate3d(0,0,0)";
          const onTransitionEnd = (event: TransitionEvent) => {
            if (event.propertyName !== "transform") return;
            behind.style.transform = "none";
            behind.style.willChange = "auto";
          };
          behind.addEventListener("transitionend", onTransitionEnd, { once: true });
        } else {
          behind.style.transform = "none";
          behind.style.willChange = "auto";
        }
      } else {
        if (behind.style.transform === "none" || behind.style.transform === "") {
          behind.style.transition = "none";
          behind.style.transform = "translate3d(0,0,0)";
          void behind.offsetWidth;
        }
        behind.style.transition = transformTransition;
        behind.style.transform = `translate3d(${-p * PARALLAX_RATIO * 100}%,0,0)`;
        behind.style.willChange = "transform";
      }
    }
    if (dim) {
      dim.style.transition = withTransition ? `opacity ${OPEN_DURATION_MS}ms ${EASE}` : "none";
      dim.style.opacity = String(p * DIM_MAX);
    }
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleUnmount = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setContent(null);
      closeTimerRef.current = null;
    }, OPEN_DURATION_MS);
  }, [clearCloseTimer]);

  const openVisitorProfile = useCallback(
    (next: FeedItemCardContent) => {
      clearCloseTimer();
      setContent(next);
      setPhase("open");
      // layer 常驻且当前停在 translateX(100%)，先让内容渲染上去，下一帧再带缓动推到 0。
      requestAnimationFrame(() =>
        requestAnimationFrame(() => applyVisual(1, true)),
      );
    },
    [applyVisual, clearCloseTimer],
  );

  const closeVisitorProfile = useCallback(() => {
    setPhase("closed");
    applyVisual(0, true);
    scheduleUnmount();
  }, [applyVisual, scheduleUnmount]);

  const beginVisitorDrag = useCallback(
    (next: FeedItemCardContent) => {
      clearCloseTimer();
      setContent(next);
      setPhase("dragging");
      applyVisual(0, false);
    },
    [applyVisual, clearCloseTimer],
  );

  const setVisitorDragProgress = useCallback(
    (progress: number) => {
      applyVisual(progress, false);
    },
    [applyVisual],
  );

  const endVisitorDrag = useCallback(
    (commit: boolean) => {
      if (commit) {
        setPhase("open");
        applyVisual(1, true);
      } else {
        setPhase("closed");
        applyVisual(0, true);
        scheduleUnmount();
      }
    },
    [applyVisual, scheduleUnmount],
  );

  const registerLayer = useCallback((el: HTMLElement | null) => {
    targetsRef.current.layer = el;
    if (el) {
      el.style.transform = "translate3d(100%,0,0)";
      el.style.transition = "none";
    }
  }, []);

  const registerBehind = useCallback((el: HTMLElement | null) => {
    targetsRef.current.behind = el;
    if (el) {
      el.style.transform = "none";
      el.style.transition = "none";
      el.style.willChange = "auto";
    }
  }, []);

  const registerDim = useCallback((el: HTMLElement | null) => {
    targetsRef.current.dim = el;
    if (el) {
      el.style.opacity = "0";
      el.style.transition = "none";
    }
  }, []);

  const value = useMemo<VisitorProfileContextValue>(
    () => ({
      content,
      phase,
      durationMs: OPEN_DURATION_MS,
      openVisitorProfile,
      closeVisitorProfile,
      beginVisitorDrag,
      setVisitorDragProgress,
      endVisitorDrag,
      registerLayer,
      registerBehind,
      registerDim,
    }),
    [
      content,
      phase,
      openVisitorProfile,
      closeVisitorProfile,
      beginVisitorDrag,
      setVisitorDragProgress,
      endVisitorDrag,
      registerLayer,
      registerBehind,
      registerDim,
    ],
  );

  return (
    <VisitorProfileContext.Provider value={value}>{children}</VisitorProfileContext.Provider>
  );
}

export function useVisitorProfile() {
  const context = useContext(VisitorProfileContext);
  if (!context) {
    throw new Error("useVisitorProfile must be used within VisitorProfileProvider");
  }
  return context;
}
