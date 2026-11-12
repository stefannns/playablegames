import { useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { getColorCSSVar } from "@byted-tiktok/tux-web";

import { CAMERA_TAB_BAR_HEIGHT_PX } from "../../edit/components/edit_chrome.constants.ts";

export type CreationPrimaryTabKey = "playable" | "post" | "create" | "live";

/** `overlay` — POST · CREATE · LIVE 固定相机底栏白字；`page` 保留给非 shell 场景。 */
export type CreationPrimaryTabBarSurface = "overlay" | "page";

export type CreationPrimaryTabBarProps = {
  active: CreationPrimaryTabKey;
  onChange?: (key: CreationPrimaryTabKey) => void;
  isTabActive?: boolean;
  /** `overlay` on camera; `page` on UIPageFlat1 Create screen. */
  surface?: CreationPrimaryTabBarSurface;
  style?: CSSProperties;
};

const PRIMARY_TABS: ReadonlyArray<{ key: CreationPrimaryTabKey; label: string }> = [
  { key: "playable", label: "PLAYABLE" },
  { key: "post", label: "POST" },
  { key: "create", label: "CREATE" },
  { key: "live", label: "LIVE" },
];

const TAB_TEXT_STYLE: CSSProperties = {
  fontSize: "15px",
  lineHeight: "130%",
  letterSpacing: 0,
};

const TAB_ITEM_GAP_PX = 26;
const CLICK_THRESHOLD = 6;
const AXIS_LOCK_MIN_X_PX = 6;
const AXIS_LOCK_MIN_Y_PX = 36;
const HORIZONTAL_BIAS = 0.25;
const VERTICAL_BIAS = 2.6;
const SNAP_ADVANCE_PX = 4;

const TAB_ESTIMATED_LABEL_WIDTH_PX: Record<CreationPrimaryTabKey, number> = {
  playable: 78,
  post: 46,
  create: 58,
  live: 38,
};

const TAB_COLORS: Record<
  CreationPrimaryTabBarSurface,
  { active: "UIText1" | "UIImageOverlayWhite"; inactive: "UIText3" | "UIImageOverlayWhiteA40" }
> = {
  page: { active: "UIText1", inactive: "UIText3" },
  overlay: { active: "UIImageOverlayWhite", inactive: "UIImageOverlayWhiteA40" },
};

function tabColorsForSurface(surface: CreationPrimaryTabBarSurface) {
  const tokens = TAB_COLORS[surface];
  return {
    active: getColorCSSVar(tokens.active),
    inactive: getColorCSSVar(tokens.inactive),
  };
}

const tabKeyToIndex = (key: CreationPrimaryTabKey) => {
  const index = PRIMARY_TABS.findIndex((item) => item.key === key);
  return index >= 0 ? index : 0;
};

const buildStaticTabMetrics = () => {
  let cursor = 0;
  return PRIMARY_TABS.map((item) => {
    const width = TAB_ESTIMATED_LABEL_WIDTH_PX[item.key];
    const metric = {
      center: cursor + width / 2,
      labelWidth: width,
    };
    cursor += width + TAB_ITEM_GAP_PX;
    return metric;
  });
};

type TabItemMetric = {
  center: number;
  labelWidth: number;
};

type TabDragState = {
  pointerId: number;
  startX: number;
  startY: number;
  axis: "undecided" | "horizontal" | "vertical";
  deltaX: number;
  deltaY: number;
  renderedDeltaX: number;
};

type TabLayoutState = {
  containerWidth: number;
  items: TabItemMetric[];
  measured: boolean;
};

const INITIAL_LAYOUT: TabLayoutState = {
  containerWidth: 390,
  items: buildStaticTabMetrics(),
  measured: true,
};

/** POST · CREATE · LIVE — fixed camera chrome; snap-scroll like PHOTO mode tab. */
export function CreationPrimaryTabBar({
  active,
  onChange,
  isTabActive = true,
  surface = "overlay",
  style,
}: CreationPrimaryTabBarProps) {
  const tabColors = tabColorsForSurface(surface);
  const containerRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<TabDragState | null>(null);
  const buttonRefs = useRef<
    Partial<Record<CreationPrimaryTabKey, HTMLButtonElement | null>>
  >({});
  const [layout, setLayout] = useState<TabLayoutState>(INITIAL_LAYOUT);
  const [liveOffset, setLiveOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasCompletedInitialLayout, setHasCompletedInitialLayout] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const activeIndex = tabKeyToIndex(active);
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

  const previewIndex = isDragging ? indexForDragOffset(liveOffset) : activeIndex;
  const previewItem = PRIMARY_TABS[previewIndex] ?? PRIMARY_TABS[activeIndex];

  const measureLayout = useCallback(() => {
    const container = containerRef.current;
    const strip = stripRef.current;
    if (!container || !strip) return;

    const staticMetrics = buildStaticTabMetrics();
    const items = PRIMARY_TABS.map((item, index) => {
      const button = buttonRefs.current[item.key];
      const label = button?.querySelector<HTMLElement>("[data-creation-primary-tab-label]");
      if (!button || !label) return null;
      const labelRect = label.getBoundingClientRect();
      return {
        center: staticMetrics[index].center,
        labelWidth: labelRect.width,
      };
    });
    if (items.some((item) => item === null)) return;

    const nextLayout: TabLayoutState = {
      containerWidth: container.clientWidth || 390,
      items: items as TabItemMetric[],
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

  useEffect(() => {
    if (!layout.measured || hasCompletedInitialLayout) return undefined;
    const frame = window.requestAnimationFrame(() => {
      setHasCompletedInitialLayout(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hasCompletedInitialLayout, layout.measured]);

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

  const resetDrag = useCallback(() => {
    dragRef.current = null;
    setIsDragging(false);
    setLiveOffset(0);
  }, []);

  const commitIndex = useCallback(
    (index: number) => {
      const item = PRIMARY_TABS[index];
      if (!item || item.key === active) return;
      onChange?.(item.key);
    },
    [active, onChange],
  );

  const nearestIndexAtClientX = useCallback(
    (clientX: number) => {
      let best = activeIndex;
      let bestDist = Infinity;
      PRIMARY_TABS.forEach((item, index) => {
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
    },
    [activeIndex],
  );

  const finishDrag = useCallback(
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

      resetDrag();
      if (nextIndex !== null) {
        commitIndex(nextIndex);
      }
    },
    [commitIndex, indexForDragOffset, nearestIndexAtClientX, resetDrag],
  );

  const updateDrag = (clientX: number, clientY: number, preventDefault?: () => void) => {
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
    const atEnd = activeIndex === PRIMARY_TABS.length - 1 && dx < 0;
    const renderedDx = atStart || atEnd ? dx * 0.32 : dx;
    drag.renderedDeltaX = renderedDx;
    setLiveOffset(renderedDx);
  };

  const handlePointerDown = (event: React.PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (dragRef.current) resetDrag();

    try {
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      /* noop */
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
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
      finishDrag(event.clientX);
      return;
    }
    updateDrag(event.clientX, event.clientY, () => {
      if (event.cancelable) event.preventDefault();
    });
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    finishDrag(event.clientX);
  };

  useEffect(() => {
    const handleWindowPointerUp = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      finishDrag(event.clientX);
    };
    const handleWindowBlur = () => finishDrag();
    const handleVisibilityChange = () => {
      if (document.hidden) finishDrag();
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
  }, [finishDrag]);

  const registerButtonRef =
    (key: CreationPrimaryTabKey) => (node: HTMLButtonElement | null) => {
      buttonRefs.current[key] = node;
    };

  const renderTabButton = (item: { key: CreationPrimaryTabKey; label: string }) => {
    const selected = item.key === previewItem.key;
    return (
      <button
        key={item.key}
        ref={registerButtonRef(item.key)}
        type="button"
        onClick={() => onChange?.(item.key)}
        className={[
          "relative flex items-center justify-center whitespace-nowrap",
          selected ? "font-bold" : "font-semibold",
        ].join(" ")}
        style={{
          ...TAB_TEXT_STYLE,
          width: TAB_ESTIMATED_LABEL_WIDTH_PX[item.key],
          height: CAMERA_TAB_BAR_HEIGHT_PX,
          color: selected ? tabColors.active : tabColors.inactive,
          transition: shouldReduceMotion ? "none" : "color 160ms ease-out",
        }}
        aria-pressed={selected}
      >
        <span data-creation-primary-tab-label style={{ position: "relative", zIndex: 1 }}>
          {item.label}
        </span>
      </button>
    );
  };

  const stripX = baseTranslate + liveOffset;
  const canAnimate =
    !shouldReduceMotion && hasCompletedInitialLayout && layout.measured;

  return (
    <div
      ref={containerRef}
      className="absolute left-0 z-30 overflow-hidden"
      data-name="Creation Primary Tab Bar"
      style={{
        width: 390,
        height: CAMERA_TAB_BAR_HEIGHT_PX,
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
        userSelect: "none",
        ...style,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onLostPointerCapture={() => finishDrag()}
    >
      <div
        ref={stripRef}
        className="absolute top-0 left-0 flex items-center"
        style={{
          height: CAMERA_TAB_BAR_HEIGHT_PX,
          gap: TAB_ITEM_GAP_PX,
          transform: `translate3d(${stripX}px, 0, 0)`,
          transition:
            canAnimate && !isDragging
              ? "transform 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
              : "none",
          visibility: layout.measured ? "visible" : "hidden",
          willChange: "transform",
        }}
      >
        {PRIMARY_TABS.map(renderTabButton)}
      </div>
    </div>
  );
}
