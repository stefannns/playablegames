import { getColorCSSVar } from "@byted-tiktok/tux-web";
import {
  TUXIconCameraFill,
  TUXIconCameraStickerRoundFill,
  TUXIconEmojiHappyFill,
  TUXIconImageStackFill,
  TUXIconKeyboardCircleFill,
  TUXIconMicFill,
  TUXIconPaperplaneFill,
} from "@byted-tiktok/tux-icons";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from "react";

import {
  useSoftKeyboard,
  useSoftKeyboardInputFocus,
} from "../../../components/sys/soft_keyboard";
import { SENDER_BUBBLE_GRADIENT } from "./message_send_gradient";

/** Imperative handle so the emoji panel (F) can insert characters at will. */
export interface MessageInputBarHandle {
  insertText: (text: string) => void;
  /** Focus the field — used when a long-press "Reply" opens the quote bar (TTD-24). */
  focus: () => void;
}

export type MessageInputBarProps = {
  /** Append a text message to the thread. Trimmed, never empty. */
  onSend: (text: string) => void;
  /** Whether the emoji/sticker panel (F) currently replaces the keyboard. */
  isEmojiPanelOpen: boolean;
  /** Toggle the emoji/sticker panel (F). Also fired by the sticker button. */
  onToggleEmojiPanel: () => void;
  /** Open the album drawer (G). Stubbed until G lands. */
  onOpenAlbum: () => void;
};

const TEXT1 = getColorCSSVar("UIText1");
// Constant white for the send plane sitting on the brand-gradient circle.
const OVERLAY_WHITE = getColorCSSVar("UIImageOverlayWhite");

/**
 * The textarea matches the TUX `Headline-Regular` preset (the size the old
 * static placeholder used) by reading the same typography CSS vars, so the
 * live field is visually identical to the placeholder it replaces.
 */
const textareaStyle: CSSProperties = {
  fontSize: "var(--tux-v2-typography-headline-size)",
  lineHeight: "var(--tux-v2-typography-headline-line-height)",
  letterSpacing: "var(--tux-v2-typography-headline-letter-spacing)",
  color: TEXT1,
  caretColor: TEXT1,
  // iOS `textViewMaximumHeight` (~6 lines): grow to 98px, then scroll inside.
  maxHeight: 98,
};

export const MessageInputBar = forwardRef<
  MessageInputBarHandle,
  MessageInputBarProps
>(function MessageInputBar(
  { onSend, isEmojiPanelOpen, onToggleEmojiPanel, onOpenAlbum },
  ref,
) {
  const [text, setText] = useState("");
  const [multiline, setMultiline] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Height of the textarea at a single line — set once on mount (empty field).
  const singleLineRef = useRef<number | null>(null);
  const softKeyboard = useSoftKeyboard();

  const hasText = text.trim().length > 0;

  const writeText = useCallback(
    (next: string) => {
      setText(next);
      if (
        softKeyboard.isOpen &&
        softKeyboard.options?.target === textareaRef.current
      ) {
        softKeyboard.setValue(next);
      }
    },
    [softKeyboard],
  );

  /** Re-fit the textarea to its content (auto-grow up to `maxHeight`). */
  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = el.scrollHeight;
    el.style.height = `${next}px`;
    // iOS bottom-pins the leading/trailing buttons once the field wraps; until
    // then everything is vertically centered in the pill. Flip on >1 line.
    const base = singleLineRef.current ?? next;
    setMultiline(next > base + 4);
  }, []);

  // Capture the empty single-line height before the first resize runs.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (el && singleLineRef.current == null) singleLineRef.current = el.scrollHeight;
  }, []);

  const clearComposer = useCallback(() => {
    setText("");
    setMultiline(false);
    const el = textareaRef.current;
    if (el) el.style.height = "auto";
    // Always clear the host valueRef — not only when `options.target` matches,
    // so soft-keyboard Send cannot leave stale text in the bound field.
    softKeyboard.setValue("");
  }, [softKeyboard]);

  const submitText = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      onSend(trimmed);
      clearComposer();
    },
    [onSend, clearComposer],
  );

  const submitTextRef = useRef(submitText);
  submitTextRef.current = submitText;

  const handleSoftKeyboardFocus = useSoftKeyboardInputFocus({
    placeholder: "Message…",
    returnKey: "send",
    autoCapitalize: "sentences",
    // Stable forwarder — `open()` snapshots callbacks; ref keeps Send up to date.
    onSubmit: (raw) => submitTextRef.current(raw),
  });

  useImperativeHandle(
    ref,
    () => ({
      insertText: (t: string) => {
        const el = textareaRef.current;
        writeText((el?.value ?? text) + t);
        requestAnimationFrame(resize);
      },
      focus: () => textareaRef.current?.focus({ preventScroll: true }),
    }),
    [resize, text, writeText],
  );

  const handleSend = useCallback(() => {
    submitText(textareaRef.current?.value ?? text);
  }, [submitText, text]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter sends; Shift+Enter inserts a newline.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    writeText(e.target.value);
    resize();
  };

  const preventBlurMouseDown = useCallback(
    (event: MouseEvent | PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("textarea, button")) return;
      event.preventDefault();
    },
    [],
  );

  return (
    // Chrome icons fill with `currentColor`, so bind it once here to UIText1;
    // the send button overrides it locally to white.
    <div
      className={`flex gap-3 ${multiline ? "items-end" : "items-center"}`}
      style={{ color: TEXT1 }}
      data-softkb-keep-open=""
      onMouseDown={preventBlurMouseDown}
      onPointerDown={preventBlurMouseDown}
    >
      <button
        type="button"
        aria-label="Open camera"
        className="flex size-6 shrink-0 flex-col items-center justify-center rounded-full"
      >
        <TUXIconCameraFill size={24} />
      </button>

      <div
        // iOS pill 固定 44pt:
        //   - send button 36 + sendMessageButtonInset(4/4) = 44 嵌满 pill
        //   - trailing icons 24 + textViewToFunctionButtonsInset(10/10) = 44 嵌满 pill
        // HTML 里没法子元素单控 padding,所以全局取 py-1(4px) — 让 36 send 不会撑大 pill;
        // 24 图标在 44 pill 里居中,等效留白 10px,跟 iOS 一致。
        className={`flex min-h-[48px] flex-1 gap-1 rounded-[24px] py-1 ${multiline ? "items-end" : "items-center"}`}
        style={{
          backgroundColor: getColorCSSVar("UISheetGrouped1"),
          // iOS PlainContainerView (youthful/modern DM 分支):
          //   textView.leadingAnchor = pillLeading + youthfulTextViewLeadingInset(13)
          //     + UITextView 默认 lineFragmentPadding(~5) ≈ 18pt 字形起点;
          //     HTML textarea 无 lineFragmentPadding,需要把这一截并进 paddingLeft.
          //   trailingFunctionButtonTrailingInset = 12  (trailing 图标态)
          //   sendMessageButtonInset.trailing    = 4   (发送按钮态)
          //   textViewToFunctionButtonsInset.leading = 4 (→ gap-1)
          paddingLeft: 16,
          paddingRight: hasText ? 4 : 16,
        }}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={(event) => {
            // Tapping the field returns to the keyboard, dismissing the panel.
            if (isEmojiPanelOpen) onToggleEmojiPanel();
            handleSoftKeyboardFocus(event);
          }}
          placeholder="Message…"
          rows={1}
          className="min-w-0 flex-1 resize-none overflow-y-auto border-none bg-transparent outline-none placeholder:text-tux-v2-ui-text-placeholder"
          style={textareaStyle}
        />

        {hasText ? (
          <div className="flex shrink-0 items-center gap-2.5">
            <button
              type="button"
              aria-label="Emoji"
              onClick={onToggleEmojiPanel}
            >
              <TUXIconEmojiHappyFill size={24} />
            </button>
            <button
              type="button"
              aria-label="Send"
              onClick={handleSend}
              className="flex size-9 items-center justify-center rounded-full"
              // TUX icons fill with `currentColor`; set it on the button so the
              // plane reads constant white over the brand gradient.
              style={{ background: SENDER_BUBBLE_GRADIENT, color: OVERLAY_WHITE }}
            >
              <TUXIconPaperplaneFill size={20} />
            </button>
          </div>
        ) : isEmojiPanelOpen ? (
          // Sticker panel open — iOS shows THREE: keyboard (replaces sticker) →
          // album → voice (ChatInputPlainContainerView: shouldShowKeyboardButton
          // swaps sticker for keyboard; album + voice stay).
          <div className="flex shrink-0 items-center gap-4">
            <button
              type="button"
              aria-label="Keyboard"
              onClick={() => {
                onToggleEmojiPanel();
                requestAnimationFrame(() => textareaRef.current?.focus());
              }}
            >
              <TUXIconKeyboardCircleFill size={24} />
            </button>
            <button type="button" aria-label="Photos" onClick={onOpenAlbum}>
              <TUXIconImageStackFill size={24} />
            </button>
            <button type="button" aria-label="Voice message">
              <TUXIconMicFill size={24} />
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-4">
            <button
              type="button"
              aria-label="Stickers"
              onClick={onToggleEmojiPanel}
            >
              <TUXIconCameraStickerRoundFill size={24} />
            </button>
            <button type="button" aria-label="Photos" onClick={onOpenAlbum}>
              <TUXIconImageStackFill size={24} />
            </button>
            <button type="button" aria-label="Voice message">
              <TUXIconMicFill size={24} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
