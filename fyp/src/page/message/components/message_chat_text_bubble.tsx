import { TUXText, type TColorWithToken, type TUXTextProps } from "@byted-tiktok/tux-web";
import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";

export type MessageChatTextBubbleProps = {
  text: string;
  bubbleStyle: CSSProperties;
  textColor: TColorWithToken;
  bubbleRef?: Ref<HTMLDivElement>;
};

type ChatBubbleTextProps = TUXTextProps & {
  trimBoundingBox?: boolean;
  children?: ReactNode;
};

/** TUX `trimBoundingBox` — trim typographic line box (not font-size resize). */
const trimBoundingBoxStyle: CSSProperties = {
  textBoxTrim: "trim-both",
  textBoxEdge: "cap alphabetic",
};

const BUBBLE_PADDING_X = 16; // px-4 each side
// iOS `preferredTextMessageMaxWidth` = floor(239 × SCREEN_WIDTH/375); on a 390
// frame that's 248px of *text*. The bubble is that + horizontal padding. iOS
// wraps greedily (UILabel) and the bubble hugs the widest line — no balancing.
const TEXT_CONTENT_MAX = 248;
const BUBBLE_MAX_W = TEXT_CONTENT_MAX + BUBBLE_PADDING_X * 2; // 280

const EMOJI_PART = "(?:\\p{Extended_Pictographic}|\\p{Regional_Indicator})";
// A word char, then space(s), then a trailing emoji run (incl. ZWJ / VS16
// sequences) at end of string.
const TRAILING_EMOJI = new RegExp(
  `(\\S)\\s+(${EMOJI_PART}(?:[\\u200D\\uFE0F]|${EMOJI_PART})*)\\s*$`,
  "u",
);

/**
 * Glue a trailing emoji to the word before it with a non-breaking space ( )
 * so it can never orphan onto a line by itself (e.g. "…this one 💃" wrapping to a
 * lone "💃"). iOS greedy-wraps identically, but a single-emoji line reads worst
 * on web; this keeps the rest of the wrapping iOS-faithful while killing that case.
 */
function glueTrailingEmoji(text: string): string {
  return text.replace(TRAILING_EMOJI, (_m, a, b) => a + "\u00A0" + b);
}

function ChatBubbleText({
  trimBoundingBox = false,
  style,
  ...textProps
}: ChatBubbleTextProps) {
  return (
    <TUXText
      {...textProps}
      style={
        trimBoundingBox ? { ...trimBoundingBoxStyle, ...style } : style
      }
    />
  );
}

/**
 * Chat text bubble that hugs the **longest wrapped line** (capped at 280px,
 * matching iOS `preferredTextMessageMaxWidth` + padding).
 *
 * Pure CSS can't do this: with a `max-width`, text whose single-line width just
 * exceeds the cap forces the box to the full width and then wraps inside it,
 * leaving a big empty gap on the right (worst with a short last line). Neither
 * `width: max-content`, `fit-content`, nor `text-wrap: balance` give the right
 * result (balance over-narrows short messages into too many lines). So we
 * greedy-wrap like iOS and measure: lay the text out at the cap, read one client
 * rect per rendered line via a Range, and pin the box width to the widest line +
 * padding. Re-wrapping at that width is identical (the widest line still fits),
 * so the result is stable — no measure/layout loop.
 *
 * The width is a **definite** px value, so the long-press overlay clone (same
 * component) hugs it correctly during its parent's shrink-to-fit pass.
 */
export function MessageChatTextBubble({
  text,
  bubbleStyle,
  textColor,
  bubbleRef,
}: MessageChatTextBubbleProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [boxWidth, setBoxWidth] = useState<number>();
  const display = glueTrailingEmoji(text);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const measure = () => {
      const range = document.createRange();
      range.selectNodeContents(el);
      let widest = 0;
      for (const rect of range.getClientRects()) {
        if (rect.width > widest) widest = rect.width;
      }
      setBoxWidth(
        widest > 0
          ? // +2px guard: getClientRects sub-pixel under-measures a line by ~1px,
            // so pinning to the bare width can make a line that fit during
            // measurement re-wrap at its own pinned width — leaving the box stuck
            // wide while the text wrapped (big right gap). The guard is invisible.
            Math.min(Math.ceil(widest) + 2 + BUBBLE_PADDING_X * 2, BUBBLE_MAX_W)
          : undefined,
      );
    };
    measure();
    // Re-measure once web fonts finish loading: the first pass can run against a
    // fallback font with different metrics, which pins a wrong width (e.g. a
    // borderline line flips between 1 and 2 lines on reload). `fonts.ready`
    // makes the final wrap deterministic against the real font.
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
    };
  }, [display]);

  return (
    <div
      ref={bubbleRef}
      className="inline-block max-w-[280px] rounded-[24px] px-4 py-3"
      style={{ ...bubbleStyle, width: boxWidth }}
    >
      <span ref={textRef}>
        <ChatBubbleText
          as="span"
          typographyPreset="Headline-Regular"
          color={textColor}
          trimBoundingBox
        >
          {display}
        </ChatBubbleText>
      </span>
    </div>
  );
}
