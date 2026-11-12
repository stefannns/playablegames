import { useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

export type CameraModeKey = "3m" | "60s" | "15s" | "photo" | "text";

export type CameraModeTabProps = {
  active: CameraModeKey;
  onChange?: (key: CameraModeKey) => void;
  /** Parent tab visible — remeasure width (hidden tabs often report 0). */
  isTabActive?: boolean;
  style?: CSSProperties;
};

const MODE_TEXT_STYLE: CSSProperties = {
  fontSize: "14px",
  lineHeight: "130%",
  letterSpacing: 0,
};

const PILL_H = 26;
const SELECTED_PILL_INLINE_PADDING = 9;
const MODE_ITEM_GAP_PX = 24;
const CLICK_THRESHOLD = 6;
const AXIS_LOCK_MIN_X_PX = 6;
const AXIS_LOCK_MIN_Y_PX = 36;
const HORIZONTAL_BIAS = 0.25;
const VERTICAL_BIAS = 2.6;
const SNAP_ADVANCE_PX = 4;

const CAMERA_MODE_ITEMS: ReadonlyArray<{ key: CameraModeKey; label: string }> = [
  { key: "3m", label: "3m" },
  { key: "60s", label: "60s" },
  { key: "15s", label: "15s" },
  { key: "photo", label: "PHOTO" },
  { key: "text", label: "TEXT" },
];

// Keep initial positioning deterministic like CameraEffectDock: the strip can
// center PHOTO on the first paint without waiting for DOM measurement. Runtime
// measurement is only used for the pill width.
const MODE_ESTIMATED_LABEL_WIDTH_PX: Record<CameraModeKey, number> = {
  "3m": 24,
  "60s": 32,
  "15s": 30,
  photo: 58,
  text: 44,
};

const modeKeyToIndex = (key: CameraModeKey) => {
  const index = CAMERA_MODE_ITEMS.findIndex((item) => item.key === key);
  return index >= 0 ? index : 0;
};

const buildStaticModeMetrics = (): ModeItemMetric[] => {
  let cursor = 0;
  return CAMERA_MODE_ITEMS.map((item) => {
    const width = MODE_ESTIMATED_LABEL_WIDTH_PX[item.key];
    const metric = {
      center: cursor + width / 2,
      labelWidth: width,
    };
    cursor += width + MODE_ITEM_GAP_PX;
    return metric;
  });
};

type ModeItemMetric = {
  center: number;
  labelWidth: number;
};

type ModeDragState = {
  pointerId: number;
  startX: number;
  startY: number;
  baseTranslate: number;
  axis: "undecided" | "horizontal" | "vertical";
  deltaX: number;
  deltaY: number;
  renderedDeltaX: number;
};

type ModeLayoutState = {
  containerWidth: number;
  items: ModeItemMetric[];
  measured: boolean;
};

type ModeIndicatorState = {
  width: number;
  measured: boolean;
};

const INITIAL_LAYOUT: ModeLayoutState = {
  containerWidth: 390,
  items: buildStaticModeMetrics(),
  measured: true,
};

const CameraModeTab = ({
  active,
  onChange,
  isTabActive = true,
  style,
}: CameraModeTabProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<ModeDragState | null>(null);
  const buttonRefs = useRef<
    Partial<Record<CameraModeKey, HTMLButtonElement | null>>
  >({});
  const [layout, setLayout] = useState<ModeLayoutState>(INITIAL_LAYOUT);
  const [indicator, setIndicator] = useState<ModeIndicatorState>(() => ({
    width:
      MODE_ESTIMATED_LABEL_WIDTH_PX[active] +
      SELECTED_PILL_INLINE_PADDING * 2,
    measured: true,
  }));
  const [liveOffset, setLiveOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasCompletedInitialLayout, setHasCompletedInitialLayout] =
    useState(false);
  const shouldReduceMotion = useReducedMotion();

  const activeIndex = modeKeyToIndex(active);
  const baseTranslate =
    layout.measured && layout.items[activeIndex]
      ? layout.containerWidth / 2 - layout.items[activeIndex].center
      : 0;

  const nearestIndexForTranslate = useCallback(
    (translate: number) => {
      if (!layout.measured || layout.items.length === 0) return activeIndex;
      const viewportCenter = layout.containerWidth / 2;
      let best = activeIndex;
      let bestDist = Infinity;
      layout.items.forEach((item, index) => {
        const dist = Math.abs(item.center + translate - viewportCenter);
        if (dist < bestDist) {
          bestDist = dist;
          best = index;
        }
      });
      return best;
    },
    [activeIndex, layout.containerWidth, layout.items, layout.measured],
  );

  const indexForDragOffset = useCallback(
    (offset: number) => {
      const nearest = nearestIndexForTranslate(baseTranslate + offset);
      if (nearest !== activeIndex) return nearest;

      const direction = offset < 0 ? 1 : offset > 0 ? -1 : 0;
      const nextIndex = activeIndex + direction;
      const next = layout.items[nextIndex];
      if (!next || direction === 0) return activeIndex;

      return Math.abs(offset) >= SNAP_ADVANCE_PX ? nextIndex : activeIndex;
    },
    [activeIndex, baseTranslate, layout.items, nearestIndexForTranslate],
  );

  const previewIndex = isDragging
    ? indexForDragOffset(liveOffset)
    : activeIndex;

  const previewItem = CAMERA_MODE_ITEMS[previewIndex] ?? CAMERA_MODE_ITEMS[activeIndex];

  const measureLayout = useCallback(() => {
    const container = containerRef.current;
    const strip = stripRef.current;
    if (!container || !strip) return;

    const staticMetrics = buildStaticModeMetrics();
    const items = CAMERA_MODE_ITEMS.map((item, index) => {
      const button = buttonRefs.current[item.key];
      const label = button?.querySelector<HTMLElement>("[data-camera-mode-label]");
      if (!button || !label) return null;
      const labelRect = label.getBoundingClientRect();
      return {
        center: staticMetrics[index].center,
        labelWidth: labelRect.width,
      };
    });
    if (items.some((item) => item === null)) return;

    const nextLayout: ModeLayoutState = {
      containerWidth: container.clientWidth || 390,
      items: items as ModeItemMetric[],
      measured: true,
    };

    setLayout((current) => {
      const same =
        current.containerWidth === nextLayout.containerWidth &&
        current.measured === nextLayout.measured &&
        current.items.length === nextLayout.items.length &&
        current.items.every((item, index) => {
          const next = nextLayout.items[index];
          return item.center === next.center && item.labelWidth === next.labelWidth;
        });
      return same ? current : nextLayout;
    });
  }, []);

  useLayoutEffect(() => {
    measureLayout();
  }, [isTabActive, measureLayout]);

  useLayoutEffect(() => {
    const metric = layout.items[previewIndex];
    if (!metric) return;
    const width = Math.ceil(metric.labelWidth + SELECTED_PILL_INLINE_PADDING * 2);
    setIndicator((current) => {
      const next = { width, measured: true };
      return current.width === next.width &&
        current.measured === next.measured
        ? current
        : next;
    });
  }, [layout.items, previewIndex]);

  useEffect(() => {
    if (!layout.measured || !indicator.measured || hasCompletedInitialLayout) {
      return undefined;
    }
    const frame = window.requestAnimationFrame(() => {
      setHasCompletedInitialLayout(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hasCompletedInitialLayout, indicator.measured, layout.measured]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const strip = stripRef.current;
    if (!isTabActive || !container || !strip) return undefined;

    const observer = new ResizeObserver(measureLayout);
    observer.observe(container);
    observer.observe(strip);
    Object.values(buttonRefs.current).forEach((button) => {
      if (button) observer.observe(button);
    });
    window.addEventListener("resize", measureLayout);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measureLayout);
    };
  }, [isTabActive, measureLayout]);

  const resetModeDrag = useCallback(() => {
    dragRef.current = null;
    setIsDragging(false);
    setLiveOffset(0);
  }, []);

  const commitIndex = useCallback(
    (index: number) => {
      const item = CAMERA_MODE_ITEMS[index];
      if (!item || item.key === active) return;
      onChange?.(item.key);
    },
    [active, onChange],
  );

  const nearestIndexAtClientX = useCallback((clientX: number) => {
    let best = activeIndex;
    let bestDist = Infinity;
    CAMERA_MODE_ITEMS.forEach((item, index) => {
      const button = buttonRefs.current[item.key];
      if (!button) return;
      const rect = button.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) {
        best = index;
        bestDist = 0;
        return;
      }
      const dist = Math.abs(clientX - (rect.left + rect.width / 2));
      if (dist < bestDist) {
        bestDist = dist;
        best = index;
      }
    });
    return best;
  }, [activeIndex]);

  const finishModeDrag = useCallback(
    (clientX?: number) => {
      const drag = dragRef.current;
      if (!drag) return;

      const totalTravel = Math.hypot(drag.deltaX, drag.deltaY);
      const isTap =
        drag.axis === "undecided" &&
        Math.abs(drag.deltaX) < CLICK_THRESHOLD &&
        totalTravel < CLICK_THRESHOLD;

      let nextIndex: number | null = null;
      if (isTap) {
        nextIndex = nearestIndexAtClientX(clientX ?? drag.startX);
      } else if (drag.axis === "horizontal") {
        nextIndex = indexForDragOffset(drag.renderedDeltaX);
      }

      resetModeDrag();
      if (nextIndex !== null) {
        commitIndex(nextIndex);
      }
    },
    [
      commitIndex,
      indexForDragOffset,
      nearestIndexAtClientX,
      resetModeDrag,
    ],
  );

  const updateModeDrag = (
    clientX: number,
    clientY: number,
    preventDefault?: () => void,
  ) => {
    const drag = dragRef.current;
    if (!drag) return;

    const dx = clientX - drag.startX;
    const dy = clientY - drag.startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    drag.deltaX = dx;
    drag.deltaY = dy;

    if (drag.axis === "undecided") {
      if (absDx < AXIS_LOCK_MIN_X_PX && absDy < AXIS_LOCK_MIN_Y_PX) return;
      if (absDx >= Math.max(AXIS_LOCK_MIN_X_PX, absDy * HORIZONTAL_BIAS)) {
        drag.axis = "horizontal";
        setIsDragging(true);
      } else if (absDy >= AXIS_LOCK_MIN_Y_PX && absDy >= absDx * VERTICAL_BIAS) {
        drag.axis = "vertical";
        return;
      } else {
        return;
      }
    }

    if (drag.axis !== "horizontal") return;

    preventDefault?.();
    const atStart = activeIndex === 0 && dx > 0;
    const atEnd = activeIndex === CAMERA_MODE_ITEMS.length - 1 && dx < 0;
    const renderedDx = atStart || atEnd ? dx * 0.32 : dx;
    drag.renderedDeltaX = renderedDx;
    setLiveOffset(renderedDx);
  };

  const handlePointerDown = (event: React.PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (dragRef.current) resetModeDrag();

    try {
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      /* noop */
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseTranslate,
      axis: "undecided",
      deltaX: 0,
      deltaY: 0,
      renderedDeltaX: 0,
    };
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.pointerType === "mouse" && event.buttons === 0) {
      finishModeDrag(event.clientX);
      return;
    }
    updateModeDrag(event.clientX, event.clientY, () => {
      if (event.cancelable) event.preventDefault();
    });
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    finishModeDrag(event.clientX);
  };

  useEffect(() => {
    const handleWindowPointerUp = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      finishModeDrag(event.clientX);
    };
    const handleWindowBlur = () => finishModeDrag();
    const handleVisibilityChange = () => {
      if (document.hidden) finishModeDrag();
    };

    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerUp);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerUp);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [finishModeDrag]);

  const registerButtonRef =
    (key: CameraModeKey) => (node: HTMLButtonElement | null) => {
      buttonRefs.current[key] = node;
    };

  const renderModeButton = (item: { key: CameraModeKey; label: string }) => {
    const selected = item.key === previewItem.key;
    return (
      <button
        key={item.key}
        ref={registerButtonRef(item.key)}
        type="button"
        onClick={() => onChange?.(item.key)}
        className="relative flex items-center justify-center font-semibold"
        style={{
          ...MODE_TEXT_STYLE,
          width: MODE_ESTIMATED_LABEL_WIDTH_PX[item.key],
          height: PILL_H,
          color: selected ? "#000000" : "#FFFFFF",
          textShadow: selected ? "none" : "0 1px 5px rgba(0,0,0,0.35)",
          transition: shouldReduceMotion ? "none" : "color 160ms ease-out",
        }}
        aria-pressed={selected}
      >
        <span data-camera-mode-label style={{ position: "relative", zIndex: 1 }}>
          {item.label}
        </span>
      </button>
    );
  };

  const stripX = baseTranslate + liveOffset;
  const canAnimateModeChange =
    !shouldReduceMotion &&
    hasCompletedInitialLayout &&
    layout.measured &&
    indicator.measured;

  return (
    <div
      ref={containerRef}
      className="absolute left-0 z-30 overflow-hidden"
      style={{
        width: 390,
        height: PILL_H,
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
        userSelect: "none",
        ...style,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onLostPointerCapture={() => finishModeDrag()}
    >
      <div
        aria-hidden
        className="absolute top-0 left-1/2"
        style={{
          width: indicator.width,
          height: PILL_H,
          transform: "translateX(-50%)",
          opacity: indicator.measured && layout.measured ? 1 : 0,
          transition: canAnimateModeChange
            ? "width 220ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 120ms ease-out"
            : "none",
          borderRadius: 22,
          background: "#FFFFFF",
          boxShadow: "0 1px 5px rgba(0,0,0,0.2)",
        }}
      />
      <div
        ref={stripRef}
        className="absolute top-0 left-0 flex items-center"
        style={{
          height: PILL_H,
          gap: MODE_ITEM_GAP_PX,
          transform: `translate3d(${stripX}px, 0, 0)`,
          transition:
            canAnimateModeChange && !isDragging
              ? "transform 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
              : "none",
          visibility: layout.measured ? "visible" : "hidden",
          willChange: "transform",
        }}
      >
        {CAMERA_MODE_ITEMS.map(renderModeButton)}
      </div>
    </div>
  );
};

export default CameraModeTab;
