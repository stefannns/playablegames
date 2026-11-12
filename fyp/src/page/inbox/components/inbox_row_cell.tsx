import { TUXText } from "@byted-tiktok/tux-web";
import {
  TUXIconArchiveBox,
  TUXIconCamera,
  TUXIconHeartFill,
  TUXIconNotificationBoxFill,
  TUXIconPin,
  TUXIconTrashBin,
  TUXIconTwoPersonLargeFill,
  type TuxIcon,
} from "@byted-tiktok/tux-icons";
import { motion, useAnimation, type PanInfo } from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import {
  INBOX_BUBBLE_ACTIVITY_BG,
  INBOX_BUBBLE_FOLLOWERS_BG,
  INBOX_BUBBLE_ICON_COLOR,
  INBOX_BUBBLE_SYSTEM_BG,
  INBOX_SWIPE_ARCHIVE_BG,
  INBOX_SWIPE_DELETE_BG,
  INBOX_SWIPE_ICON_COLOR,
  INBOX_SWIPE_PIN_BG,
} from "../inbox_chrome.constants";
import { SocialAvatar, type SocialAvatarRingVariant } from "./social_avatar";

const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_THRESHOLD = 8;

const SWIPE_ACTION_WIDTH = 72;
const SWIPE_ACTIONS_COUNT = 3;
const SWIPE_OPEN_X = SWIPE_ACTION_WIDTH * SWIPE_ACTIONS_COUNT;

export type InboxSwipeActionId = "delete" | "pin" | "archive";

type SwipeActionDef = {
  id: InboxSwipeActionId;
  ariaLabel: string;
  bg: string;
  Icon: TuxIcon;
};

const SWIPE_ACTIONS: readonly SwipeActionDef[] = [
  { id: "delete", ariaLabel: "Delete conversation", bg: INBOX_SWIPE_DELETE_BG, Icon: TUXIconTrashBin },
  { id: "pin", ariaLabel: "Pin conversation", bg: INBOX_SWIPE_PIN_BG, Icon: TUXIconPin },
  { id: "archive", ariaLabel: "Archive conversation", bg: INBOX_SWIPE_ARCHIVE_BG, Icon: TUXIconArchiveBox },
];

type InboxRowLeading =
  | {
      variant: "icon-bubble";
      iconVariant: "followers" | "activity" | "system";
    }
  | {
      variant: "avatar";
      src: string;
      alt: string;
      size?: number;
      hasRing?: boolean;
      ringVariant?: SocialAvatarRingVariant;
      hasDot?: boolean;
    };

type InboxRowTrailing = {
  variant: "camera";
  label: string;
};

type InboxRowUnread =
  | {
      variant: "count";
      count: number;
    }
  | {
      variant: "dot";
    };
type InboxRowIconBubbleVariant = Extract<
  InboxRowLeading,
  { variant: "icon-bubble" }
>["iconVariant"];

export type InboxRowCellRow = {
  id: string;
  title: string;
  description: string;
  time?: string;
  unread?: InboxRowUnread;
  leading: InboxRowLeading;
  trailing?: InboxRowTrailing;
};

const INBOX_ROW_ICON_BUBBLE_VARIANTS: Record<
  InboxRowIconBubbleVariant,
  {
    background: string;
    iconColor: string;
    iconSize: number;
    size: number;
  }
> = {
  followers: {
    background: INBOX_BUBBLE_FOLLOWERS_BG,
    iconColor: INBOX_BUBBLE_ICON_COLOR,
    iconSize: 28,
    size: 52,
  },
  activity: {
    background: INBOX_BUBBLE_ACTIVITY_BG,
    iconColor: INBOX_BUBBLE_ICON_COLOR,
    iconSize: 28,
    size: 52,
  },
  system: {
    background: INBOX_BUBBLE_SYSTEM_BG,
    iconColor: INBOX_BUBBLE_ICON_COLOR,
    iconSize: 28,
    size: 52,
  },
};

function UnreadBadge({ count }: { count: number }) {
  return (
    <div className="flex h-5 min-w-5 items-center justify-center rounded-full bg-tux-v2-ui-shape-primary px-1">
      <TUXText
        as="span"
        font="TikTokFont"
        typographyPreset="P3-Semibold"
        color="UIShapeText1OnPrimary"
        align="center"
      >
        {count}
      </TUXText>
    </div>
  );
}

function CameraTrailingIcon() {
  return (
    <span
      aria-hidden
      className="flex h-10.5 w-10.5 items-center justify-center rounded-full text-tux-v2-ui-text-3"
    >
      <TUXIconCamera size={24} />
    </span>
  );
}

function renderRowLeading(leading: InboxRowLeading) {
  if (leading.variant === "avatar") {
    return (
      <SocialAvatar
        src={leading.src}
        alt={leading.alt}
        size={leading.size ?? 52}
        hasRing={leading.hasRing}
        ringVariant={leading.ringVariant}
        hasDot={leading.hasDot}
      />
    );
  }

  const iconBubbleAppearance =
    INBOX_ROW_ICON_BUBBLE_VARIANTS[leading.iconVariant];
  const Icon =
    leading.iconVariant === "followers"
      ? TUXIconTwoPersonLargeFill
      : leading.iconVariant === "activity"
        ? TUXIconHeartFill
        : TUXIconNotificationBoxFill;

  return (
    <div
      className="flex items-center justify-center rounded-full"
      style={{
        width: `${iconBubbleAppearance.size}px`,
        height: `${iconBubbleAppearance.size}px`,
        backgroundColor: iconBubbleAppearance.background,
        color: iconBubbleAppearance.iconColor,
      }}
    >
      <Icon size={iconBubbleAppearance.iconSize} />
    </div>
  );
}

function renderRowTrailing(
  trailing?: InboxRowTrailing,
  unread?: InboxRowUnread,
) {
  if (trailing?.variant === "camera") {
    return <CameraTrailingIcon />;
  }

  if (unread?.variant === "count") {
    return <UnreadBadge count={unread.count} />;
  }

  if (unread?.variant === "dot") {
    return (
      <span
        className="h-2 w-2 rounded-full bg-tux-v2-ui-shape-primary"
        aria-hidden
      />
    );
  }

  return null;
}

type InboxRowCellProps = {
  row: InboxRowCellRow;
  /** When false, row is display-only (no press affordance). */
  pressable?: boolean;
  onClick?: (row: InboxRowCellRow, trigger: HTMLElement) => void;
  /** Fired after the user holds the cell for ~500ms without moving. When this
   * fires the subsequent native click is suppressed so the cell does not
   * navigate to the detail page. */
  onLongPress?: (row: InboxRowCellRow, trigger: HTMLElement) => void;
  /** When true, the cell becomes left-swipeable to reveal action buttons
   * (Delete / Pin / Archive). Pair with `swipeOpen` + `onSwipeOpenChange`
   * so the parent can enforce single-open-at-a-time. */
  enableSwipe?: boolean;
  swipeOpen?: boolean;
  onSwipeOpenChange?: (open: boolean) => void;
  onSwipeAction?: (actionId: InboxSwipeActionId, row: InboxRowCellRow) => void;
};

export function InboxRowCell({
  row,
  pressable = true,
  onClick,
  onLongPress,
  enableSwipe,
  swipeOpen,
  onSwipeOpenChange,
  onSwipeAction,
}: InboxRowCellProps) {
  const trailing = renderRowTrailing(row.trailing, row.unread);
  const isUnread = row.unread != null;

  const longPressTimerRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  // True between drag start and the click event that fires right after pointer-up.
  // Used to suppress the cell's onClick when a swipe gesture just completed.
  const wasDraggingRef = useRef(false);

  // Swipe state (uncontrolled fallback for cells that pass enableSwipe but no controlled prop)
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = swipeOpen !== undefined;
  const isOpen = enableSwipe ? (isControlled ? swipeOpen : internalOpen) : false;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onSwipeOpenChange?.(next);
  };

  const dragControls = useAnimation();
  useEffect(() => {
    if (!enableSwipe) return;
    dragControls.start({
      x: isOpen ? -SWIPE_OPEN_X : 0,
      // Open: spring for the snap-into-place feel. Close: default tween (no bounce).
      transition: isOpen
        ? { type: "spring", stiffness: 380, damping: 32 }
        : { duration: 0.22, ease: [0.32, 0.72, 0, 1] },
    });
  }, [isOpen, enableSwipe, dragControls]);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current != null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!onLongPress) return;
    if (event.button !== 0 && event.pointerType === "mouse") return;
    longPressFiredRef.current = false;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    const target = event.currentTarget;
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTimerRef.current = null;
      longPressFiredRef.current = true;
      onLongPress(row, target);
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (longPressTimerRef.current == null || !pointerStartRef.current) return;
    const dx = event.clientX - pointerStartRef.current.x;
    const dy = event.clientY - pointerStartRef.current.y;
    if (Math.hypot(dx, dy) > LONG_PRESS_MOVE_THRESHOLD) {
      clearLongPressTimer();
    }
  };

  const cancelLongPress = () => {
    clearLongPressTimer();
    pointerStartRef.current = null;
  };

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    // Snap to open if dragged past half-way OR flicked left with enough velocity.
    const shouldOpen =
      info.offset.x < -SWIPE_OPEN_X / 2 ||
      (info.velocity.x < -400 && info.offset.x < -20);
    setOpen(shouldOpen);
  };

  const cellClassName =
    "flex h-18 w-full items-center bg-tux-v2-ui-page-flat-1 py-2 pl-4 pr-2";

  const cellInner = (
    <>
      <div className="mr-3 flex shrink-0 items-center justify-center overflow-visible">
        {renderRowLeading(row.leading)}
      </div>
      <div className="min-w-0 flex-1">
        <TUXText
          as="div"
          font="TikTokFont"
          typographyPreset={`H4-${isUnread ? "Semibold" : "Regular"}`}
          color="UIText1"
          textDisplay="truncate"
          className="min-w-0"
        >
          {row.title}
        </TUXText>
        <div className="mt-0.5 flex min-w-0 items-center">
          <TUXText
            as="span"
            font="TikTokFont"
            typographyPreset={`P1-${isUnread ? "Semibold" : "Regular"}`}
            color={isUnread ? "UIText1" : "UIText3"}
            textDisplay="truncate"
            className="min-w-0 max-w-full shrink"
          >
            {row.description}
          </TUXText>
          {row.time ? (
            <>
              <span className="mx-1 shrink-0 text-[14px] leading-[1.3] text-tux-v2-ui-text-3">
                ·
              </span>
              <TUXText
                as="span"
                font="TikTokFont"
                typographyPreset="P1-Regular"
                color="UIText3"
                className="shrink-0"
              >
                {row.time}
              </TUXText>
            </>
          ) : null}
        </div>
      </div>
      {trailing ? (
        <div className="ml-3 flex h-10.5 w-10.5 shrink-0 items-center justify-center">
          {trailing}
        </div>
      ) : null}
    </>
  );

  const cellButton = pressable ? (
    <button
      type="button"
      className={`${cellClassName} text-left`}
      onClick={(event) => {
        // The click that follows pointer-up after a swipe should never navigate.
        if (wasDraggingRef.current) {
          wasDraggingRef.current = false;
          event.preventDefault();
          return;
        }
        if (longPressFiredRef.current) {
          longPressFiredRef.current = false;
          event.preventDefault();
          return;
        }
        // Tap on cell content while swipe is open: just close it, don't navigate.
        if (isOpen) {
          event.preventDefault();
          setOpen(false);
          return;
        }
        onClick?.(row, event.currentTarget);
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={cancelLongPress}
      onPointerCancel={cancelLongPress}
      onPointerLeave={cancelLongPress}
    >
      {cellInner}
    </button>
  ) : (
    <div className={cellClassName} aria-disabled="true">
      {cellInner}
    </div>
  );

  if (!enableSwipe) {
    return cellButton;
  }

  return (
    <div className="relative h-18 w-full overflow-hidden">
      <div
        aria-hidden={!isOpen}
        className="absolute right-0 top-0 flex h-full"
        style={{ width: SWIPE_OPEN_X }}
      >
        {SWIPE_ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            aria-label={action.ariaLabel}
            tabIndex={isOpen ? 0 : -1}
            onClick={() => {
              onSwipeAction?.(action.id, row);
              setOpen(false);
            }}
            className="flex h-full items-center justify-center text-tux-v2-ui-image-overlay-white"
            style={{
              width: SWIPE_ACTION_WIDTH,
              backgroundColor: action.bg,
              color: INBOX_SWIPE_ICON_COLOR,
            }}
          >
            <action.Icon size={24} />
          </button>
        ))}
      </div>

      <motion.div
        className="relative h-full w-full bg-tux-v2-ui-page-flat-1"
        drag="x"
        dragConstraints={{ left: -SWIPE_OPEN_X, right: 0 }}
        dragElastic={{ left: 0.12, right: 0 }}
        dragMomentum={false}
        animate={dragControls}
        onDragStart={() => {
          // Any drag cancels a pending long-press timer (move threshold may not fire reliably)
          clearLongPressTimer();
          // Mark so the cell's onClick (which fires right after pointer-up) suppresses navigation
          wasDraggingRef.current = true;
        }}
        onDragEnd={handleDragEnd}
      >
        {cellButton}
      </motion.div>
    </div>
  );
}
