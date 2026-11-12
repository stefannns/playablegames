import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { CommentSheetMetrics } from "./comment_panel/comment_panel";

type SnapState = "70" | "90";

export type UseMusicDetailSheetChromeOptions = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onMetricsChange?: (metrics: CommentSheetMetrics) => void;
  root?: HTMLElement | null;
  sheetTestId?: string;
};

export function useMusicDetailSheetChrome({
  visible,
  onMetricsChange,
  root,
  sheetTestId = "music-detail-sheet",
}: UseMusicDetailSheetChromeOptions) {
  const panelSurfaceRef = useRef<HTMLDivElement | null>(null);
  const [frameHeight, setFrameHeight] = useState(() => {
    if (typeof window === "undefined") return 0;
    return window.innerHeight;
  });
  const [snap, setSnap] = useState<SnapState>("70");
  const [observedHeightPx, setObservedHeightPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(isDragging);
  isDraggingRef.current = isDragging;

  const getSheetContainer = useCallback(() => {
    if (typeof document === "undefined") return null;
    return document.querySelector<HTMLElement>(`[data-testid="${sheetTestId}"]`);
  }, [sheetTestId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const frameElement =
      (root?.closest?.("[data-app-frame-root='true']") as HTMLElement | null) ??
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

  const height70Px = frameHeight * 0.73;
  const expandedHeightPx = frameHeight;

  const getSheetExpandProgress = useCallback(
    (heightPx: number) => {
      const range = expandedHeightPx - height70Px;
      if (range <= 0) return 0;
      return Math.max(0, Math.min(1, (heightPx - height70Px) / range));
    },
    [expandedHeightPx, height70Px],
  );

  const setPanelExpandProgressImmediate = useCallback(
    (heightPx: number) => {
      panelSurfaceRef.current?.style.setProperty(
        "--music-detail-expand-progress",
        String(getSheetExpandProgress(heightPx)),
      );
    },
    [getSheetExpandProgress],
  );

  const visualExpansionProgress = visible
    ? getSheetExpandProgress(observedHeightPx || height70Px)
    : 0;

  const snapHeights = useMemo(() => {
    if (frameHeight <= 0) return ["73%", "100%"] as const;
    return [
      `${Math.max(0, Math.round(height70Px))}px`,
      `${Math.max(0, Math.round(expandedHeightPx))}px`,
    ] as const;
  }, [expandedHeightPx, frameHeight, height70Px]);

  useEffect(() => {
    if (!visible) {
      setSnap("70");
      setObservedHeightPx(0);
      setIsDragging(false);
      return;
    }
    setSnap("70");
    setObservedHeightPx(height70Px);
    setPanelExpandProgressImmediate(height70Px);
  }, [height70Px, setPanelExpandProgressImmediate, visible]);

  useEffect(() => {
    if (!visible) return;

    const sheetEl = getSheetContainer();
    if (!sheetEl) return;

    const onPointerDown = () => setIsDragging(true);
    const onPointerUp = () => setIsDragging(false);

    sheetEl.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      sheetEl.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      setIsDragging(false);
    };
  }, [getSheetContainer, visible]);

  const rafIdRef = useRef<number | null>(null);
  const onMetricsChangeRef = useRef(onMetricsChange);
  onMetricsChangeRef.current = onMetricsChange;
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  useEffect(() => {
    if (!visible || rafIdRef.current != null) return;

    const frameEl =
      (root?.closest?.("[data-app-frame-root='true']") as HTMLElement | null) ??
      document.querySelector<HTMLElement>("[data-app-frame-root='true']") ??
      document.documentElement;
    const initialFrameRect = frameEl.getBoundingClientRect();
    const cachedFrameTop = initialFrameRect.top;
    const cachedFrameHeight =
      initialFrameRect.height || frameHeight || window.innerHeight;
    const midpoint = (height70Px + expandedHeightPx) / 2;

    const tick = () => {
      const contentEl = panelSurfaceRef.current;
      const sheetEl = getSheetContainer();
      const isVisible = visibleRef.current;

      if (sheetEl) {
        const sheetHeight = sheetEl.getBoundingClientRect().height;
        if (sheetHeight > 0) {
          setObservedHeightPx(sheetHeight);
          setPanelExpandProgressImmediate(sheetHeight);
          const nextSnap: SnapState = sheetHeight >= midpoint ? "90" : "70";
          setSnap((current) => (current === nextSnap ? current : nextSnap));
        }
      }

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
      onMetricsChangeRef.current?.({
        visible: isVisible || stillOnScreen,
        isDragging: isDraggingRef.current,
        dismissProgress: 0,
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
  }, [
    expandedHeightPx,
    frameHeight,
    getSheetContainer,
    height70Px,
    root,
    setPanelExpandProgressImmediate,
    visible,
  ]);

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

  return {
    panelSurfaceRef,
    height70Px,
    expandedHeightPx,
    snapHeights,
    snap,
    visualExpansionProgress,
    isDragging,
  };
}
