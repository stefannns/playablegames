import { getColorCSSVar } from "@byted-tiktok/tux-web";
import { TUXIcon3ptLink } from "@byted-tiktok/tux-icons";
import type { CSSProperties, Ref } from "react";

import type { MessageThreadItem } from "../message_thread.types";
import { MessageChatTextBubble } from "./message_chat_text_bubble";
import { MediaCard } from "./message_media_bubble";

export type MessageBubbleVisualProps = {
  item: MessageThreadItem;
  senderBubbleStyle: CSSProperties;
  receiverBubbleStyle: CSSProperties;
  /** Attaches the shared-gradient-window ref to a sent text bubble (list only). */
  senderBubbleRef?: Ref<HTMLDivElement>;
};

/**
 * Renders just the visual bubble for a reactable message kind — no row, no
 * alignment, no avatar gutter, no reaction pill. Shared by the message list
 * rows and the long-press overlay clone so both stay pixel-identical.
 *
 * `timestamp` is handled inline in `message_thread_content` and returns null
 * here.
 */
export function MessageBubbleVisual({
  item,
  senderBubbleStyle,
  receiverBubbleStyle,
  senderBubbleRef,
}: MessageBubbleVisualProps) {
  switch (item.kind) {
    case "send":
      return (
        <MessageChatTextBubble
          text={item.text}
          bubbleStyle={senderBubbleStyle}
          textColor="UIShapeText1OnPrimary"
          bubbleRef={senderBubbleRef}
        />
      );
    case "receive":
      return (
        <MessageChatTextBubble
          text={item.text}
          bubbleStyle={receiverBubbleStyle}
          textColor="UIText1"
        />
      );
    case "send-emoji":
    case "receive-emoji":
      // iOS `bigEmojiFont` = systemFontOfSize:48 (AWEIMMessageUI.m:641).
      return (
        <span className="block select-none text-[48px] leading-[1.2]" role="img">
          {item.emoji}
        </span>
      );
    case "send-sticker":
      return (
        <div
          className="overflow-hidden rounded-[24px]"
          style={{ width: 112, height: 112 }}
        >
          <img
            src={item.imageSrc}
            alt=""
            className="size-full object-contain"
            draggable={false}
          />
        </div>
      );
    case "send-image":
    case "receive-image":
      return <MediaCard thumbnail={item.imageSrc} alt="Photo" />;
    case "shared-post":
      return (
        <MediaCard
          thumbnail={item.thumbnail}
          alt="Shared post"
          showPlay
          authorName={item.authorName}
          authorAvatar={item.authorAvatar}
        />
      );
    case "video":
      return <MediaCard thumbnail={item.thumbnail} alt="Video" showPlay />;
    case "send-link":
      return (
        <div
          // 固定 260px（不用 min(100%,…)）：在 shrink-to-fit 的气泡列里，百分比宽度没有
          // 确定参照会让卡片撑满列、items-end 右对齐失效（表现为贴左）。媒体卡同样用定宽。
          className="w-[260px] shrink-0 overflow-hidden rounded-[12px]"
          style={{ backgroundColor: getColorCSSVar("UISheetGrouped1") }}
        >
          <div className="relative aspect-[260/136] w-full overflow-hidden">
            <img
              src={item.imageSrc}
              alt=""
              className="absolute inset-0 size-full object-cover"
              draggable={false}
            />
          </div>
          <div className="flex flex-col gap-1 px-3 pb-4 pt-3">
            <p className="line-clamp-3 text-[16px] font-semibold leading-[1.3] text-tux-v2-ui-text-1-display">
              {item.title}
            </p>
            <div className="flex h-4 items-center gap-1">
              <TUXIcon3ptLink
                size={12}
                color="var(--tux-v2-color-ui-text-3)"
              />
              <p className="min-w-0 flex-1 truncate text-[12px] leading-[1.3] tracking-[0.16px] text-tux-v2-ui-text-3">
                {item.domain}
              </p>
            </div>
          </div>
        </div>
      );
    default:
      return null;
  }
}
