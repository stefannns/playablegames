import { getColorCSSVar } from "@byted-tiktok/tux-web";
import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * 长按评论按钮唤起的快捷 emoji 反馈面板。
 *
 * 视觉参考 Figma node 238:11052，但结合线上已发版本做了以下偏离：
 *   - Backdrop 复用评论 composer focus 的 `UISheetBackdrop2`，更通透。
 *   - 胶囊去掉 1px 描边（设计稿太老），改用柔和投影提升悬浮感。
 *   - 4 个 emoji（😂 😳 😍 😆），系统 emoji 字号 38。
 *
 * 实现要点（与项目约定一致）：
 *   - 单实例：每张 active feed card 只挂一份；非 visible 时不渲染。
 *   - 通过 `createPortal` 挂到 AppFrame 根，避免被 feed-card 的
 *     squeeze transform 拖动。
 *   - **明暗锁定**：portal 内容不在 home 页的 `<ThemeScope mode="dark">`
 *     子树里，因此在 portal 根上显式打 `data-tux-color-scheme="dark"`，
 *     与 feed 视频上的覆盖元素一致 —— 不论用户系统主题，文字始终白色。
 *   - emoji pill **位置永远固定** 在评论按钮中线，可选的问题 chips 是
 *     独立的绝对定位兄弟节点，从 pill 顶部上方延伸，永远不会推动 pill。
 *   - 锚点用 ref 持有的按钮 DOMRect 实时读取——只在打开瞬间读一次。
 *   - 严格通过 `visible` 状态驱动入/出场动画，不使用 setTimeout 估值
 *     （duration 是常量，不是经验补丁）。
 */

export const COMMENT_QUICK_REACTION_EMOJIS = [
  "\u{1F602}", // 😂 face with tears of joy
  "\u{1F633}", // 😳 flushed face
  "\u{1F60D}", // 😍 smiling face with heart-eyes
  "\u{1F606}", // 😆 grinning squinting face
];

export type CommentQuickReactionAnchor = {
  /** 按钮在 viewport 中的 left 边界，用于把胶囊右端贴到按钮左侧。 */
  buttonLeft: number;
  /** 按钮在 viewport 中的垂直中心。 */
  buttonCenterY: number;
};

export type CommentQuickReactionPopoverProps = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  anchor: CommentQuickReactionAnchor | null;
  root: HTMLElement | null;
  onSelect?: (emoji: string) => void;
  /**
   * 可选的"长按后问题胶囊"列表。若提供且非空，会在白色 emoji 胶囊
   * 上方右对齐渲染半透明问题胶囊。点击当前不发送评论，仅关闭面板。
   */
  questions?: ReadonlyArray<string>;
  onQuestionSelect?: (question: string) => void;
};

const ENTER_DURATION_MS = 220;

// 与 Figma 设计稿对齐的几何尺寸。
const PILL_HEIGHT = 56;
const PILL_PADDING_Y = 8;
const PILL_PADDING_X = 10;
const EMOJI_GAP = 12;
const EMOJI_FONT_SIZE = 38;
// 用 line-height: 1（= em-box）+ flex 居中，glyph 自身 metrics 才是
// 唯一居中依据。Figma 的 1.25 是 frame 行盒高度，对单字符 emoji 不能直接套。
const EMOJI_LINE_HEIGHT = 1;
// Apple Color Emoji 的 glyph 在 em-box 里并非几何居中——视觉重心略高于
// em-box 中线。包一层 span 用 transform 做亚像素补偿。
const EMOJI_BASELINE_SHIFT_EM = 0.05;
// 每个 emoji 的可点击框：胶囊内高 = 56 - 8*2 = 40，做成正方形 40×40。
const EMOJI_BOX_SIZE = PILL_HEIGHT - PILL_PADDING_Y * 2;

// emoji pill 与上方 chips 之间的间距。
const CHIP_STACK_GAP = 12;
// chip 与 chip 之间的间距。
const CHIP_INNER_GAP = 8;

export function CommentQuickReactionPopover({
  visible,
  onVisibleChange,
  anchor,
  root,
  onSelect,
  questions,
  onQuestionSelect,
}: CommentQuickReactionPopoverProps) {
  // 用 mounted 控制 DOM 存在性，用 entered 控制 transform/opacity，
  // 这样关闭时也能完整播退场动画再卸载。
  const [mounted, setMounted] = useState(visible);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      const id = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(id);
    }
    if (!mounted) return;
    setEntered(false);
    const onEnd = () => setMounted(false);
    const t = window.setTimeout(onEnd, ENTER_DURATION_MS);
    return () => window.clearTimeout(t);
  }, [visible, mounted]);

  // 计算相对 root 的定位（root 是 AppFrame 根，使用 absolute 定位）。
  const [position, setPosition] = useState<{
    right: number;
    top: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!visible || !anchor || !root) return;
    const rootRect = root.getBoundingClientRect();
    const right = Math.max(8, rootRect.right - anchor.buttonLeft + 8);
    const top = anchor.buttonCenterY - rootRect.top;
    setPosition({ right, top });
  }, [visible, anchor, root]);

  if (!mounted || !root || !anchor || !position) return null;

  const scale = entered ? 1 : 0.6;
  // chips 组的"顶部"应正好等于 emoji pill 底部加上 CHIP_STACK_GAP。
  // pill 底部 = anchor.top + PILL_HEIGHT/2。
  const chipsTopFromTop = position.top + PILL_HEIGHT / 2 + CHIP_STACK_GAP;

  return createPortal(
    // 整个 popover 强制锁定 dark 主题：portal 不在 home 页的 ThemeScope
    // 子树里，否则 light mode 下 UIText1 会解析成黑色。
    // 这与 feed 视频上叠加元素的「明暗锁定」机制一致。
    <div
      role="dialog"
      aria-modal="true"
      data-tux-color-scheme="dark"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        pointerEvents: "auto",
        colorScheme: "dark",
      }}
    >
      {/* Backdrop —— 与评论面板 composer focus 状态共用同一层 token，
          视觉更通透，避免和长按/分享面板那种重 overlay 撞色。 */}
      <div
        onPointerDown={(event) => {
          event.preventDefault();
          onVisibleChange(false);
        }}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: getColorCSSVar("UISheetBackdrop2"),
          opacity: entered ? 1 : 0,
          transition: `opacity ${ENTER_DURATION_MS}ms ease-out`,
        }}
      />

      {/* 白色 emoji 胶囊 —— 独立绝对定位，永远以评论按钮中线为锚点。
          chips 是它的兄弟节点（见下方），不会改变 pill 的位置。 */}
      <div
        onPointerDown={(event) => event.stopPropagation()}
        style={{
          position: "absolute",
          right: position.right,
          top: position.top,
          transform: `translate3d(0, -50%, 0) scale(${scale})`,
          transformOrigin: "100% 50%",
          opacity: entered ? 1 : 0,
          height: PILL_HEIGHT,
          padding: `${PILL_PADDING_Y}px ${PILL_PADDING_X}px`,
          display: "flex",
          alignItems: "center",
          gap: EMOJI_GAP,
          backgroundColor: getColorCSSVar("BrandTikTokWhite"),
          // 设计稿里的 1px 描边和现网视觉对不上——线上是无边框 + 柔和投影。
          boxShadow:
            "0 8px 24px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.12)",
          borderRadius: 99,
          transition: `transform ${ENTER_DURATION_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity ${ENTER_DURATION_MS}ms ease-out`,
          willChange: "transform, opacity",
        }}
      >
        {COMMENT_QUICK_REACTION_EMOJIS.map((emoji, index) => (
          <button
            key={emoji}
            type="button"
            aria-label={`Quick reaction ${index + 1}`}
            onClick={(event) => {
              event.stopPropagation();
              onSelect?.(emoji);
              onVisibleChange(false);
            }}
            style={{
              width: EMOJI_BOX_SIZE,
              height: EMOJI_BOX_SIZE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              padding: 0,
              fontSize: EMOJI_FONT_SIZE,
              lineHeight: EMOJI_LINE_HEIGHT,
              textAlign: "center",
              cursor: "pointer",
              fontFamily:
                "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', 'Twemoji Mozilla', sans-serif",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: "block",
                // glyph 视觉重心补偿——参见 EMOJI_BASELINE_SHIFT_EM 注释。
                transform: `translateY(${EMOJI_BASELINE_SHIFT_EM}em)`,
                lineHeight: 1,
              }}
            >
              {emoji}
            </span>
          </button>
        ))}
      </div>

      {/* 可选：长按后问题 chips —— 独立绝对定位在 emoji pill *下方*，
          顶部距 pill 底部留 CHIP_STACK_GAP。chips 数量改变只会向下长，
          永远不会挤动 emoji pill 自身。
          颜色：FeedComponentsTextBackdrop 半透明灰底（feed overlay 专用
          token） + UIText1（dark-locked 后总是白色）；
          叠加 backdrop-filter: blur 让 chip 与背后视频文字之间有清晰
          的层次区分，避免在文字密集区域读不清。 */}
      {questions && questions.length > 0 ? (
        <div
          onPointerDown={(event) => event.stopPropagation()}
          style={{
            position: "absolute",
            right: position.right,
            top: chipsTopFromTop,
            // 关键：chips 容器**不能**带 transform / filter / opacity<1
            // 等创建 backdrop root 的属性——一旦祖先创建了 backdrop root，
            // 子元素 chip 上的 `backdrop-filter` 就只能模糊 root 内部的
            // 内容（空），导致 blur 看似失效。
            // 因此入场动画只用 opacity（=1 后不再创建 root），
            // 且不再叠 scale。
            opacity: entered ? 1 : 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: CHIP_INNER_GAP,
            transition: `opacity ${ENTER_DURATION_MS}ms ease-out`,
          }}
        >
          {questions.map((text) => (
            <button
              key={text}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onQuestionSelect?.(text);
                onVisibleChange(false);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                maxWidth: "100%",
                padding: "10px 16px",
                border: 0,
                borderRadius: 14,
                // TUX 为 feed overlay 上的 chip/标签专门提供了
                // FeedComponents* token，浅灰半透明（40% gray），
                // 在 dark-locked 视频背景上比纯黑遮罩通透。
                backgroundColor: getColorCSSVar("FeedComponentsTextBackdrop"),
                color: getColorCSSVar("UIText1"),
                // backdrop-filter 模糊 chip 背后的视频/文字像素，避免
                // chip 文字与背后描述/作者名等密集文字撞在一起糊成一团。
                // 6px 是较轻档位，仅足以打散背后文字的高频边缘，不会
                // 在视频上形成显著"玻璃感"光晕。
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                fontSize: 14,
                fontWeight: 600,
                lineHeight: 1.3,
                letterSpacing: "-0.005em",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {text}
            </button>
          ))}
        </div>
      ) : null}
    </div>,
    root,
  );
}
