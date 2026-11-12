import { TUXIconXMarkCircleFill } from "@byted-tiktok/tux-icons";
import { getColorCSSVar } from "@byted-tiktok/tux-web";
import { motion } from "framer-motion";

import type { MessageThreadItem } from "../message_thread.types";

/**
 * 把被引用消息压成一行预览。对齐 iOS DM 引用条:文本类直接显示正文,媒体类用
 * 方括号类型标签 `[Photo]` / `[Video]` / `[Post]` / `[Sticker]` + 小缩略图。
 * 范围按 TTD-24:text / image / video / shared-post / sticker;其余给个兜底。
 */
export type QuoteSummary = { preview: string; thumbnail?: string };

export function quoteSummary(item: MessageThreadItem): QuoteSummary {
  switch (item.kind) {
    case "send":
    case "receive":
      return { preview: item.text };
    case "send-emoji":
    case "receive-emoji":
      return { preview: item.emoji };
    case "send-image":
    case "receive-image":
      return { preview: "[Photo]", thumbnail: item.imageSrc };
    case "video":
      return { preview: "[Video]", thumbnail: item.thumbnail };
    case "shared-post":
      return { preview: "[Post]", thumbnail: item.thumbnail };
    case "send-sticker":
      return { preview: "[Sticker]", thumbnail: item.imageSrc };
    case "send-link":
      return { preview: "[Link]", thumbnail: item.imageSrc };
    default:
      return { preview: "" };
  }
}

// iOS QuoteRedesignContentView: 卡片底色与左/右竖线同色，都是 uiShapeNeutral4
// （随聊天背景做一次 mix，这里直接取 token）。竖线不是高对比强调色。
const CARD_BG = getColorCSSVar("UIShapeNeutral4");

/** `{name}: {preview}`（+ 缩略图）。引用条与气泡引用卡共用。 */
function QuoteContent({
  name,
  quoted,
  className,
}: {
  name: string;
  quoted: MessageThreadItem | undefined;
  className?: string;
}) {
  const summary = quoted ? quoteSummary(quoted) : { preview: "Message unsent" };
  return (
    <>
      <span
        className={`min-w-0 line-clamp-2 leading-[1.3] ${className ?? ""}`}
        style={{
          color: getColorCSSVar("UIText2"),
          fontStyle: quoted ? "normal" : "italic",
        }}
      >
        <span style={{ color: getColorCSSVar("UIText1") }}>{name}:</span>{" "}
        {summary.preview}
      </span>
      {quoted && summary.thumbnail ? (
        <img
          src={summary.thumbnail}
          alt=""
          className="size-9 shrink-0 rounded-[6px] object-cover"
          draggable={false}
        />
      ) : null}
    </>
  );
}

/**
 * 输入栏顶部的引用条(TTD-18 输入栏之上冒出来)。100ms height + opacity 进出,
 * 比 iOS 的硬切更顺。右侧填充圆 X 清掉当前引用。
 */
export function MessageInputQuoteBar({
  quoted,
  authorName,
  onCancel,
}: {
  /** 被引用消息;被撤回 / 找不到时为 undefined。 */
  quoted: MessageThreadItem | undefined;
  /** 被引用消息的作者名,显示成 `{authorName}: …`。 */
  authorName: string;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.1, ease: "easeOut" }}
      className="overflow-hidden"
    >
      <div className="flex items-stretch gap-1">
        {/* 左竖线：与卡片同色、外侧 4px pill,对齐 iOS QuoteRedesignContentView。 */}
        <span
          className="my-0.5 w-1 shrink-0 self-stretch rounded-[2px]"
          style={{ backgroundColor: CARD_BG }}
        />
        <div
          className="flex flex-1 items-center gap-2 rounded-[12px] px-3 py-2.5"
          style={{ backgroundColor: CARD_BG }}
        >
          <QuoteContent
            name={authorName}
            quoted={quoted}
            className="text-[14px]"
          />
          <button
            type="button"
            aria-label="Cancel reply"
            onClick={onCancel}
            className="ml-auto flex shrink-0 items-center justify-center"
            style={{ color: getColorCSSVar("UIText3") }}
          >
            <TUXIconXMarkCircleFill size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * 挂在新消息气泡上方的引用卡。4px 圆角竖线是独立于卡片的一根 pill,与卡片留 4px
 * 间距、同色。竖线贴在**气泡内侧**:接收方(左气泡)竖线在左,发送方(右气泡)竖线
 * 在右 —— 用 `align="end"` 时 flex-row-reverse 把竖线翻到右侧。点击 → 滚回原消息
 * + bounce。被引用消息被撤回时显示 "Message unsent" 灰文且不可点。
 */
export function MessageQuotedCard({
  quoted,
  authorName,
  onJump,
  align = "start",
}: {
  quoted: MessageThreadItem | undefined;
  authorName: string;
  onJump?: () => void;
  /** 跟随气泡:接收方 "start"(竖线在左),发送方 "end"(竖线在右)。 */
  align?: "start" | "end";
}) {
  const unsent = !quoted;
  return (
    <button
      type="button"
      onClick={unsent ? undefined : onJump}
      disabled={unsent}
      className={`mb-1 flex max-w-[260px] items-stretch gap-1 text-left ${
        align === "end" ? "flex-row-reverse" : ""
      }`}
      style={{ cursor: unsent ? "default" : "pointer" }}
    >
      <span
        className="my-0.5 w-1 shrink-0 self-stretch rounded-[2px]"
        style={{ backgroundColor: CARD_BG }}
      />
      <span
        className="flex min-w-0 items-center gap-2 rounded-[12px] px-3 py-2"
        style={{ backgroundColor: CARD_BG }}
      >
        <QuoteContent name={authorName} quoted={quoted} className="text-[13px]" />
      </span>
    </button>
  );
}
