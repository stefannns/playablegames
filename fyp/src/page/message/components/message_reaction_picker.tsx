import {
  TUXIconArrowTurnUpLeft,
  TUXIconArrowTurnUpRight,
  TUXIconDocOnDoc,
  TUXIconFlag,
  TUXIconTrashBin,
} from "@byted-tiktok/tux-icons";
import { getColorCSSVar } from "@byted-tiktok/tux-web";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, type CSSProperties } from "react";

import {
  REACTION_EMOJIS,
  type MessageThreadItem,
  type ReactionEmoji,
} from "../message_thread.types";
import { MessageBubbleVisual } from "./message_bubble_visual";

type IconComponent = typeof TUXIconArrowTurnUpLeft;

type MenuItem = {
  label: string;
  Icon: IconComponent;
  destructive?: boolean;
  action?: "delete" | "reply";
};

/** Context menu below the focused bubble. Reply (TTD-24) + Delete are wired; the rest just close. */
const MENU_ITEMS: MenuItem[] = [
  { label: "Reply", Icon: TUXIconArrowTurnUpLeft, action: "reply" },
  { label: "Forward", Icon: TUXIconArrowTurnUpRight },
  { label: "Copy", Icon: TUXIconDocOnDoc },
  { label: "Delete", Icon: TUXIconTrashBin, destructive: true, action: "delete" },
  { label: "Report", Icon: TUXIconFlag, destructive: true },
];

const springPop = { type: "spring", stiffness: 700, damping: 35 } as const;
const springGentle = { type: "spring", stiffness: 600, damping: 32 } as const;

/** Menu row chrome aligned with TUXMenuItem (radius / padding / hover / press overlay). */
function MessageContextMenuItem({
  label,
  Icon,
  destructive,
  onClick,
}: {
  label: string;
  Icon: IconComponent;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex w-full cursor-pointer items-center overflow-hidden rounded-(--tux-v2-radius-content-large,8px) p-3.5 text-left"
      style={{
        color: getColorCSSVar(destructive ? "UITextDangerDisplay" : "UIText1"),
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-tux-v2-ui-shape-neutral-4 opacity-0 group-hover:opacity-100 group-active:opacity-0"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-tux-v2-ui-shape-neutral-3 opacity-0 group-active:opacity-100"
      />
      <span className="relative z-1 me-2 flex shrink-0 text-[20px] leading-none">
        <Icon size={20} />
      </span>
      <span className="Headline-Semibold relative z-1 min-w-0 flex-1 truncate">
        {label}
      </span>
    </button>
  );
}

export type MessageReactionPickerProps = {
  item: MessageThreadItem;
  /** `end` = sent (right-aligned), `start` = received (left-aligned). */
  align: "start" | "end";
  senderBubbleStyle: CSSProperties;
  receiverBubbleStyle: CSSProperties;
  onSelectReaction: (emoji: ReactionEmoji) => void;
  onReply: () => void;
  onDelete: () => void;
  onClose: () => void;
};

/**
 * Long-press overlay: blurred backdrop + emoji reaction picker + a clone of the
 * focused bubble + a context menu — stacked and centered, aligned to the
 * sender's side (iMessage / TikTok pattern). Menu visuals mirror TUXMenu tokens
 * but stay in the original flex stack for motion sync.
 */
export function MessageReactionPicker({
  item,
  align,
  senderBubbleStyle,
  receiverBubbleStyle,
  onSelectReaction,
  onReply,
  onDelete,
  onClose,
}: MessageReactionPickerProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const isMe = align === "end";
  const currentReaction = "reaction" in item ? item.reaction : undefined;

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) onClose();
    },
    [onClose],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      ref={backdropRef}
      // z 必须高于 TUXNavBar 包裹层（运行时计算出 z-index:1000），否则导航栏会浮在
      // 模糊遮罩之上、保持高亮 —— iOS 长按时整屏（含导航栏）都被压暗。低于 AppFrame
      // 的 HomeIndicator（z-2100）即可。
      className="fixed inset-0 z-[1100] flex flex-col justify-center gap-2 px-6 py-10"
      // Dim + blur use the TUX 50% black overlay token; fading via opacity (not
      // the color itself) keeps the value tokenized — framer can't interpolate
      // a CSS var() color, but it can fade the whole layer's opacity.
      style={{
        alignItems: isMe ? "flex-end" : "flex-start",
        backgroundColor: getColorCSSVar("UIImageOverlayBlackA50"),
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={handleBackdropClick}
    >
      {/* Emoji reaction picker panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: -12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: -12 }}
        transition={springPop}
        className="flex items-center gap-1 rounded-[24px] px-3 py-1.5"
        style={{
          backgroundColor: getColorCSSVar("UIPageFlat1"),
          boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
        }}
      >
        {REACTION_EMOJIS.map((emoji, idx) => (
          <motion.button
            key={emoji}
            type="button"
            initial={{ opacity: 0, scale: 0, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ ...springPop, delay: 0.02 * idx }}
            whileTap={{ scale: 1.35 }}
            onClick={() => onSelectReaction(emoji)}
            // 触区 44px、emoji 32px、选中态填一颗 44px 圆 —— 对齐 iOS youthful
            // reaction bar（cell 46pt / emoji 字号 32pt / 选中背景 44pt）。
            className="flex size-11 items-center justify-center rounded-full text-[32px] leading-none"
            style={{
              backgroundColor:
                currentReaction === emoji
                  ? getColorCSSVar("UIShapeNeutral2")
                  : "transparent",
            }}
            aria-label={`React ${emoji}`}
          >
            {emoji}
          </motion.button>
        ))}
      </motion.div>

      {/* Focused bubble clone */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={springGentle}
        style={{ filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.18))" }}
      >
        <MessageBubbleVisual
          item={item}
          senderBubbleStyle={senderBubbleStyle}
          receiverBubbleStyle={receiverBubbleStyle}
        />
      </motion.div>

      {/* Context menu — TUXMenu-aligned chrome, original flex placement */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 16 }}
        transition={{ ...springGentle, delay: 0.02 }}
        className="flex w-[200px] flex-col overflow-hidden rounded-(--tux-v2-radius-container-level2-small,12px) p-1"
        style={{
          backgroundColor: getColorCSSVar("UISheetFlat3"),
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          transformOrigin: isMe ? "top right" : "top left",
        }}
      >
        {MENU_ITEMS.map(({ label, Icon, destructive, action }) => (
          <MessageContextMenuItem
            key={label}
            label={label}
            Icon={Icon}
            destructive={destructive}
            onClick={
              action === "delete"
                ? onDelete
                : action === "reply"
                  ? onReply
                  : onClose
            }
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
