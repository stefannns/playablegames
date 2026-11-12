import { getColorCSSVar } from "@byted-tiktok/tux-web";
import { useRef, type CSSProperties, type PointerEvent } from "react";

import { useSwipeRightGesture } from "../hooks/use_swipe_right_gesture";

export type CreationBottomTabKey = "post" | "create" | "live";

const SWIPE_TO_CREATE_THRESHOLD_PX = 48;
const SWIPE_MAX_VERTICAL_DRIFT_PX = 36;

const TABS: ReadonlyArray<{ key: CreationBottomTabKey; label: string }> = [
  { key: "post", label: "POST" },
  { key: "create", label: "CREATE" },
  { key: "live", label: "LIVE" },
];

const TAB_TEXT_STYLE: CSSProperties = {
  fontSize: "15px",
  lineHeight: "130%",
  letterSpacing: 0,
};

const overlayTabColors = {
  active: getColorCSSVar("UIImageOverlayWhite"),
  inactive: getColorCSSVar("UIImageOverlayWhiteA40"),
} as const;

const pageTabColors = {
  active: getColorCSSVar("UIText1"),
  inactive: getColorCSSVar("UIText3"),
} as const;

/** Home-indicator safe area below tab labels (Figma 34px; uses AppFrame token). */
function BottomTabHomeInset() {
  return (
    <div
      className="shrink-0"
      style={{ height: "var(--app-frame-bottom-inset)" }}
      data-name="System/Home Indicator"
      aria-hidden
    />
  );
}

type CreationBottomTabRowProps = {
  active: CreationBottomTabKey;
  interactiveTabs: ReadonlySet<CreationBottomTabKey>;
  activeColor: string;
  inactiveColor: string;
  onTabPress?: (key: CreationBottomTabKey, trigger?: HTMLElement) => void;
  onPointerDown?: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerCancel?: () => void;
};

/** Shared Tab Bar row — centered POST · CREATE · LIVE (54px). */
function CreationBottomTabRow({
  active,
  interactiveTabs,
  activeColor,
  inactiveColor,
  onTabPress,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
}: CreationBottomTabRowProps) {
  return (
    <div
      className="mx-auto flex h-[54px] w-full max-w-[390px] touch-pan-y items-center justify-center gap-[26px] py-2.5"
      data-name="Tab Bar"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {TABS.map((tab) => {
        const selected = tab.key === active;
        const interactive = interactiveTabs.has(tab.key);
        const style = {
          ...TAB_TEXT_STYLE,
          color: selected ? activeColor : inactiveColor,
        };
        const className = [
          "shrink-0 whitespace-nowrap",
          selected ? "font-bold" : "font-semibold",
        ].join(" ");

        if (interactive && onTabPress) {
          return (
            <button
              key={tab.key}
              type="button"
              className={className}
              style={{ ...style, touchAction: "manipulation" }}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => onTabPress(tab.key, event.currentTarget)}
              aria-pressed={selected}
            >
              {tab.label}
            </button>
          );
        }

        return (
          <span key={tab.key} className={className} style={style}>
            {tab.label}
          </span>
        );
      })}
    </div>
  );
}

export type CreationBottomTabBarOverlayProps = {
  active: CreationBottomTabKey;
  onChange?: (key: CreationBottomTabKey) => void;
  /** Swipe left on the tab bar (toward CREATE) opens the Create tab screen. */
  onSwipeToCreate?: () => void;
  style?: CSSProperties;
};

/** Camera overlay — Figma `tab` (633:19085). */
export function CreationBottomTabBarOverlay({
  active,
  onChange,
  onSwipeToCreate,
  style,
}: CreationBottomTabBarOverlayProps) {
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    swipeStartRef.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start || !onSwipeToCreate) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaY) > SWIPE_MAX_VERTICAL_DRIFT_PX) return;
    if (deltaX < -SWIPE_TO_CREATE_THRESHOLD_PX) {
      onSwipeToCreate();
    }
  };

  const handlePointerCancel = () => {
    swipeStartRef.current = null;
  };

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-30 flex h-fit w-full shrink-0 flex-col bg-tux-v2-ui-image-overlay-black"
      data-name="tab"
      data-node-id="633:19085"
      style={style}
    >
      <CreationBottomTabRow
        active={active}
        interactiveTabs={new Set(TABS.map((tab) => tab.key))}
        activeColor={overlayTabColors.active}
        inactiveColor={overlayTabColors.inactive}
        onTabPress={(key) => onChange?.(key)}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      />
    </div>
  );
}

export type CreationBottomTabBarFooterProps = {
  /** Tap POST or swipe right on the tab bar to return to the camera (POST) screen. */
  onSelectPost: (trigger?: HTMLElement) => void;
};

/** Create tab page footer — Figma `Bottom Tab` (621:18469): 54px tab row + 34px home inset. */
export function CreationBottomTabBarFooter({ onSelectPost }: CreationBottomTabBarFooterProps) {
  const { handlePointerDown, handlePointerUp, handlePointerCancel } = useSwipeRightGesture(() => {
    onSelectPost();
  });

  return (
    <div
      className="relative flex h-fit w-full shrink-0 flex-col bg-tux-v2-ui-page-flat-1"
      data-name="Bottom Tab"
    >
      <CreationBottomTabRow
        active="create"
        interactiveTabs={new Set(["post"])}
        activeColor={pageTabColors.active}
        inactiveColor={pageTabColors.inactive}
        onTabPress={(key, trigger) => {
          if (key === "post") onSelectPost(trigger);
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      />
      <BottomTabHomeInset />
    </div>
  );
}

