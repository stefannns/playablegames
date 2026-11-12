import { getColorCSSVar } from "@byted-tiktok/tux-web";
import {
  IconArrowUpFill,
  IconAt,
  IconGift,
  IconImageSquare,
  IconMicrophone,
  IconStickerRound,
} from "@byted-tiktok/tux-icons";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { measureAppSafeAreaInsetPx } from "../../../../utils/viewport_insets";
import { useAppFrame } from "../../../../components/sys/app_frame";
import {
  useSoftKeyboard,
  useSoftKeyboardInputFocus,
} from "../../../../components/sys/soft_keyboard";

export type CommentTextFieldKeyboardLiftMode = "translate" | "padding";

export type CommentTextFieldProps = {
  avatarSrc: string;
  placeholder: string;
  onFocusChange?: (focused: boolean) => void;
  onSend?: (text: string) => void;
  forceExpanded?: boolean;
  showVoiceAndGiftActions?: boolean;
  /**
   * `padding` (default) — parent owns `margin-bottom` / `padding-bottom` lift.
   * `translate` — legacy `transform` lift when no parent chrome handles keyboard.
   */
  keyboardLiftMode?: CommentTextFieldKeyboardLiftMode;
  /**
   * 当为 true 时，把输入框上方的快捷 emoji 横排替换为
   * "curious about" 风格的横向滚动问题胶囊；点击某条会通过
   * `onQuestionSelect` 把整段问题文本写入输入框（替换当前内容）。
   */
  questionsBarEnabled?: boolean;
  questionOptions?: ReadonlyArray<string>;
  onQuestionSelect?: (text: string) => void;
};

export type CommentTextFieldHandle = {
  focus: () => void;
  setText: (text: string) => void;
};

/**
 * Top emoji bar shown when the composer is in its expanded "editor" form.
 * Quick-pick emojis sourced from the design.
 */
const QUICK_EMOJIS = ["\u{1F600}", "\u{1F970}", "\u{1F602}", "\u{1F633}", "\u{1F60F}", "\u{1F605}", "\u{1F97A}"];

const EXPAND_TRANSITION = "cubic-bezier(0.22, 0.61, 0.36, 1)";
const EXPAND_DURATION_MS = 280;

// Editor pill sizing — line-height = 19.5px, vertical padding 10px top + 10px
// bottom. 2-line floor → 60px (matches Figma `Text Input` height = 60). 5-line
// ceiling → 60 + 3*19.5 = 118.5px ≈ 119px. Beyond 5 lines the textarea begins
// to scroll vertically.
const LINE_HEIGHT_PX = 19.5;
const PILL_VPAD_PX = 10;
const MIN_LINES = 2;
const MAX_LINES = 5;
const PILL_MIN_HEIGHT_PX = LINE_HEIGHT_PX * MIN_LINES + PILL_VPAD_PX * 2; // ≈ 59 → snap to 60 visually
const PILL_MAX_HEIGHT_PX = LINE_HEIGHT_PX * MAX_LINES + PILL_VPAD_PX * 2; // ≈ 117.5

/** Layout chrome inside {@link CommentTextField} — keep in sync with JSX padding/heights. */
export const COMMENT_COMPOSER_DIVIDER_PX = 0.5;
export const COMMENT_COMPOSER_COLLAPSED_ROW_PX = 8 + 40 + 8;
export const COMMENT_COMPOSER_EMOJI_BAR_PX = 40;
export const COMMENT_COMPOSER_EXPANDED_ROW_MIN_PX = 8 + PILL_MIN_HEIGHT_PX + 8;
export const COMMENT_COMPOSER_ACTION_BAR_PX = 48;
export const COMMENT_COMPOSER_EXPAND_DURATION_MS = EXPAND_DURATION_MS;

/** Visible {@link CommentTextField} height excluding keyboard shell bottom padding. */
export function getCommentComposerContentHeightPx(expanded: boolean): number {
  if (!expanded) {
    return COMMENT_COMPOSER_DIVIDER_PX + COMMENT_COMPOSER_COLLAPSED_ROW_PX;
  }
  return (
    COMMENT_COMPOSER_DIVIDER_PX +
    COMMENT_COMPOSER_EMOJI_BAR_PX +
    COMMENT_COMPOSER_EXPANDED_ROW_MIN_PX +
    COMMENT_COMPOSER_ACTION_BAR_PX
  );
}

export const CommentTextField = forwardRef<CommentTextFieldHandle, CommentTextFieldProps>(function CommentTextField(
  {
    avatarSrc,
    placeholder,
    onFocusChange,
    onSend,
    forceExpanded = false,
    showVoiceAndGiftActions = true,
    keyboardLiftMode = "padding",
    questionsBarEnabled,
    questionOptions,
    onQuestionSelect,
  },
  ref,
) {
  const liftViaPadding = keyboardLiftMode === "padding";
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [nativeKeyboardOffsetPx, setNativeKeyboardOffsetPx] = useState(0);
  const [textareaContentHeight, setTextareaContentHeight] = useState(LINE_HEIGHT_PX * MIN_LINES);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { keyboardOpen, keyboardSurfaceHeight, floatingBottomInsetCss } =
    useAppFrame();
  const softKeyboard = useSoftKeyboard();
  const handleFocus = useSoftKeyboardInputFocus({
    placeholder,
    returnKey: "send",
    autoCapitalize: "sentences",
  });
  const safeAreaBottomPxRef = useRef<number | null>(null);

  // The composer's "expanded" form must persist for as long as the user is
  // still in the editing flow. On desktop, tapping anywhere on the soft
  // keyboard's chrome (e.g. the gaps between keys) blurs the textarea but
  // keeps the keyboard up — so we OR the textarea's own focus state with
  // "soft keyboard is open AND owned by this textarea". The `target ===`
  // guard is critical: as soon as the host releases this textarea (e.g. on
  // sheet dismissal it calls `close()` which clears its target *before*
  // `isOpen` flips false), the composer collapses immediately. Without
  // this guard, a stale `isOpen=true` keeps the composer in editor form
  // during the sheet's close animation, which thrashes layout and stalls
  // the FeedItemCard squeeze-release rAF loop.
  const ownsSoftKeyboard =
    softKeyboard.isOpen && softKeyboard.options?.target === textareaRef.current;
  const expanded = forceExpanded || focused || ownsSoftKeyboard;
  const hasText = value.trim().length > 0;

  // Keep the parent in sync with the composer's actual visual state, not
  // just the raw textarea focus event. Otherwise tapping a soft-keyboard
  // gap blurs the textarea (so `focused` is false) yet the composer is
  // still visually expanded — and the overlay tied to "composer focused"
  // would disappear out from under the still-expanded editor.
  useEffect(() => {
    onFocusChange?.(expanded);
  }, [expanded, onFocusChange]);

  // Auto-resize the textarea between MIN_LINES and MAX_LINES; once content
  // exceeds MAX_LINES the textarea itself becomes scrollable. In the
  // collapsed (unfocused) form the textarea is forced back to a single line
  // height so it sits centered inside the 36px pill — overflow is shown via
  // an ellipsized overlay (see render below) since native textareas cannot
  // do single-line `text-overflow: ellipsis`.
  const recomputeTextareaHeight = useCallback(() => {
    const node = textareaRef.current;
    if (!node) return;
    if (!expanded) {
      node.style.height = `${LINE_HEIGHT_PX}px`;
      node.style.overflowY = "hidden";
      setTextareaContentHeight(LINE_HEIGHT_PX);
      return;
    }
    // Reset to 0 so scrollHeight reflects the natural content height.
    node.style.height = "0px";
    const natural = node.scrollHeight;
    const minH = LINE_HEIGHT_PX * MIN_LINES;
    const maxH = LINE_HEIGHT_PX * MAX_LINES;
    const clamped = Math.max(minH, Math.min(natural, maxH));
    node.style.height = `${clamped}px`;
    node.style.overflowY = natural > maxH ? "auto" : "hidden";
    setTextareaContentHeight(clamped);
  }, [expanded]);

  useLayoutEffect(() => {
    recomputeTextareaHeight();
  }, [value, expanded, recomputeTextareaHeight]);

  useEffect(() => {
    if (!focused) {
      setNativeKeyboardOffsetPx(0);
      return;
    }
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 640px)").matches) return;

    const getSafeAreaBottomPx = () => {
      if (safeAreaBottomPxRef.current != null) return safeAreaBottomPxRef.current;
      const resolved = measureAppSafeAreaInsetPx("bottom");
      safeAreaBottomPxRef.current = resolved;
      return resolved;
    };

    const update = () => {
      const vv = window.visualViewport;
      if (!vv) {
        setNativeKeyboardOffsetPx(0);
        return;
      }
      const offset =
        window.innerHeight - vv.height - vv.offsetTop - getSafeAreaBottomPx();
      setNativeKeyboardOffsetPx(Math.max(0, Math.round(offset)));
    };

    update();
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [focused]);

  // Single source of truth for the composer text. Anything that mutates the
  // value (typing, the soft keyboard's own buttons, emoji-bar taps) must
  // route through here so that React state and the SoftKeyboardHost's
  // internal valueRef stay aligned. Without this, the host's `setValue` on
  // its next keypress overwrites the React-only state (e.g. an emoji we
  // inserted via `insertAtCaret`, or a question chip that just filled the
  // input — which previously caused the next keystroke to clobber the chip).
  const writeValue = useCallback(
    (next: string) => {
      setValue(next);
      // Only push back to the host while it owns this textarea as `target`.
      // (On mobile the host is unmounted and `isOpen` stays false.)
      if (softKeyboard.isOpen && softKeyboard.options.target === textareaRef.current) {
        softKeyboard.setValue(next);
      }
    },
    [softKeyboard],
  );

  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus({ preventScroll: true });
    },
    setText: (text: string) => {
      // Route programmatic fills (e.g. tapping a "curious about" question
      // chip) through writeValue so React state AND the SoftKeyboardHost's
      // valueRef stay in sync. Otherwise the host's next keypress would
      // overwrite React-only state with its stale empty `valueRef`,
      // erasing the chip text instead of appending to it.
      writeValue(text);
      // Place the caret at the end so subsequent typing extends the chip
      // text rather than starting from the beginning.
      requestAnimationFrame(() => {
        const node = textareaRef.current;
        if (!node) return;
        try {
          node.setSelectionRange(text.length, text.length);
        } catch {
          // No-op.
        }
      });
    },
  }));

  // Insert a string at the current caret (or selection) without losing focus.
  const insertAtCaret = useCallback(
    (text: string) => {
      const node = textareaRef.current;
      if (!node) {
        writeValue(value + text);
        return;
      }
      const start = node.selectionStart ?? node.value.length;
      const end = node.selectionEnd ?? node.value.length;
      const next = node.value.slice(0, start) + text + node.value.slice(end);
      writeValue(next);
      // Restore caret after React applies the new value.
      requestAnimationFrame(() => {
        const restored = textareaRef.current;
        if (!restored) return;
        const caret = start + text.length;
        restored.focus({ preventScroll: true });
        try {
          restored.setSelectionRange(caret, caret);
        } catch {
          // No-op: selection APIs unavailable on this element.
        }
      });
    },
    [value, writeValue],
  );

  const sendCurrentValue = useCallback(() => {
    const text = value.trim();
    if (!text) return;
    onSend?.(text);
    writeValue("");
  }, [onSend, value, writeValue]);

  // Prevents pointer / mouse interactions on chrome (avatar, emoji bar, action
  // bar, send button) from stealing focus from the textarea — which would
  // otherwise collapse the composer back to its compact form.
  const preventBlurMouseDown = useCallback((event: React.MouseEvent | React.PointerEvent) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("[data-comment-textarea='true']")) return;
    event.preventDefault();
  }, []);

  const iconColor = getColorCSSVar("UIText1");
  const actionIcons = showVoiceAndGiftActions
    ? [IconImageSquare, IconStickerRound, IconAt, IconMicrophone, IconGift]
    : [IconImageSquare, IconStickerRound, IconAt];
  const pillHeight = expanded
    ? Math.max(PILL_MIN_HEIGHT_PX, Math.min(PILL_MAX_HEIGHT_PX, textareaContentHeight + PILL_VPAD_PX * 2))
    : 40;

  return (
    <div
      className="w-full"
      // Tells <SoftKeyboardHost>'s document-level tap-outside listener to
      // treat anything inside this composer (avatar, emoji bar, action bar,
      // send button, …) as "in keyboard scope" and *not* dismiss the
      // desktop soft keyboard. Without this, a tap on e.g. an emoji would
      // be classified as "outside the keyboard panel and outside the bound
      // target input" and the keyboard would close.
      data-softkb-keep-open=""
      onMouseDown={preventBlurMouseDown}
      onPointerDown={preventBlurMouseDown}
      style={{
        backgroundColor: getColorCSSVar("UISheetFlat1"),
        transform: liftViaPadding
          ? nativeKeyboardOffsetPx > 0
            ? `translateY(-${nativeKeyboardOffsetPx}px)`
            : "translateY(0)"
          : keyboardOpen
            ? `translateY(-${keyboardSurfaceHeight}px)`
            : nativeKeyboardOffsetPx > 0
              ? `translateY(-${nativeKeyboardOffsetPx}px)`
              : "translateY(0)",
        transition: liftViaPadding
          ? nativeKeyboardOffsetPx > 0
            ? `transform ${EXPAND_DURATION_MS}ms ${EXPAND_TRANSITION}`
            : "transform 240ms cubic-bezier(0.4, 0, 0.2, 1)"
          : keyboardOpen || nativeKeyboardOffsetPx > 0
            ? `transform ${EXPAND_DURATION_MS}ms ${EXPAND_TRANSITION}`
            : "transform 240ms cubic-bezier(0.4, 0, 0.2, 1)",
        willChange: liftViaPadding ? undefined : "transform",
      }}
    >
      <div
        className="w-full"
        style={{
          height: 0.5,
          backgroundColor: getColorCSSVar("UIShapeNeutral3"),
        }}
      />

      {/* Top bar above the composer — slides in when the editor is in its
          expanded form. By default it's a row of quick-pick emojis; when
          `questionsBarEnabled` is true (empty-state experiment toggle) it is
          replaced by a horizontally scrolling row of "curious about" style
          question chips. Tapping a question fills it into the input via
          `onQuestionSelect`. Layout / sizing / chip style follow the
          Figma "Comment Text Field › Actions" frame: row, scroll-x,
          gap 8, padding 8/12/2, chip bg rgba(0,0,0,0.05) (UIShapeNeutral4),
          radius 24, padding 4×8. */}
      <div
        aria-hidden={!expanded}
        style={{
          overflow: "hidden",
          maxHeight: expanded ? 40 : 0,
          opacity: expanded ? 1 : 0,
          transition: `max-height ${EXPAND_DURATION_MS}ms ${EXPAND_TRANSITION}, opacity 200ms ease`,
          willChange: "max-height, opacity",
        }}
      >
        {questionsBarEnabled && questionOptions && questionOptions.length > 0 ? (
          <div
            className="flex items-center"
            style={{
              gap: 8,
              padding: "8px 12px 2px",
              overflowX: "auto",
              overflowY: "hidden",
              scrollbarWidth: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {questionOptions.map((question) => (
              <button
                key={question}
                type="button"
                tabIndex={-1}
                aria-label={question}
                onClick={() => {
                  if (onQuestionSelect) {
                    onQuestionSelect(question);
                  } else {
                    writeValue(question);
                  }
                }}
                style={{
                  flex: "0 0 auto",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px 12px",
                  borderRadius: 24,
                  border: "none",
                  backgroundColor: getColorCSSVar("UIShapeNeutral4"),
                  color: getColorCSSVar("UIText1"),
                  fontSize: 15,
                  fontWeight: 400,
                  lineHeight: "19.5px",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {question}
              </button>
            ))}
          </div>
        ) : (
          <div
            className="flex items-center justify-between"
            style={{ gap: 15, padding: "4px 12px 0" }}
          >
            {QUICK_EMOJIS.map((emoji, index) => (
              <button
                key={index}
                type="button"
                tabIndex={-1}
                aria-label={`emoji ${index + 1}`}
                onClick={() => insertAtCaret(emoji)}
                style={{
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  fontSize: 28,
                  lineHeight: 1,
                  cursor: "pointer",
                  fontFamily:
                    "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', 'Twemoji Mozilla', sans-serif",
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Avatar + text input pill */}
      <div
        className="flex"
        style={{
          gap: 6,
          padding: "8px 12px",
          alignItems: expanded ? "flex-start" : "center",
          transition: `align-items ${EXPAND_DURATION_MS}ms ${EXPAND_TRANSITION}`,
        }}
      >
        <img
          src={avatarSrc}
          alt="User avatar"
          className="rounded-full w-9 h-9 object-cover"
          loading="eager"
          style={{
            marginTop: expanded ? 2 : 0,
            transition: `margin-top ${EXPAND_DURATION_MS}ms ${EXPAND_TRANSITION}`,
            flex: "0 0 auto",
          }}
        />

        <div
          className="flex flex-1 min-w-0"
          style={{
            backgroundColor: getColorCSSVar("UIShapeNeutral4"),
            borderRadius: 22,
            height: pillHeight,
            alignItems: "stretch",
            overflow: "hidden",
            transition: `height ${EXPAND_DURATION_MS}ms ${EXPAND_TRANSITION}`,
            willChange: "height",
          }}
        >
          <div
            className="flex-1 min-w-0 relative"
            style={{
              padding: expanded ? `${PILL_VPAD_PX}px 16px` : "0 16px",
              display: "flex",
              alignItems: expanded ? "stretch" : "center",
              transition: `padding ${EXPAND_DURATION_MS}ms ${EXPAND_TRANSITION}`,
            }}
          >
            <textarea
              ref={textareaRef}
              data-comment-textarea="true"
              value={value}
              rows={1}
              onChange={(event) => writeValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.shiftKey) return;
                event.preventDefault();
                sendCurrentValue();
              }}
              onFocus={(event) => {
                setFocused(true);
                handleFocus(event);
              }}
              onBlur={() => {
                setFocused(false);
              }}
              placeholder={placeholder}
              enterKeyHint="send"
              autoCapitalize="sentences"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              aria-label={placeholder}
              onPointerDown={(event) => {
                if (event.pointerType !== "touch") return;
                event.preventDefault();
                textareaRef.current?.focus({ preventScroll: true });
              }}
              className="w-full min-w-0 bg-transparent border-0 p-0 outline-none"
              style={{
                fontSize: 15,
                fontWeight: 400,
                lineHeight: `${LINE_HEIGHT_PX}px`,
                color: getColorCSSVar("UIText1"),
                resize: "none",
                display: "block",
                width: "100%",
                fontFamily: "inherit",
                overflowY: "hidden",
                // Hide the native textarea's collapsed-state rendering and
                // delegate visual presentation (placeholder + truncated value)
                // to the overlay below. The textarea remains the focus /
                // caret target so all input behavior is unaffected.
                opacity: expanded || hasText === false ? (expanded ? 1 : 0) : 0,
                whiteSpace: expanded ? "pre-wrap" : "nowrap",
              }}
            />

            {/* Collapsed-state visual overlay: shows placeholder when empty
                and a truncated single-line value when filled. Pointer events
                are disabled so taps still hit the textarea behind it. */}
            {!expanded && (
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 16px",
                  pointerEvents: "none",
                  fontSize: 15,
                  fontWeight: 400,
                  lineHeight: `${LINE_HEIGHT_PX}px`,
                  color: hasText
                    ? getColorCSSVar("UIText1")
                    : getColorCSSVar("UITextPlaceholder"),
                }}
              >
                <span
                  style={{
                    display: "block",
                    width: "100%",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {hasText ? value : placeholder}
                </span>
              </div>
            )}
          </div>

          {/* Compact in-pill icons — fade out and collapse to zero width as
              the editor expands so the textarea reclaims the full pill width. */}
          <div
            className="flex items-center"
            style={{
              paddingRight: expanded ? 0 : 5,
              width: expanded ? 0 : "auto",
              opacity: expanded ? 0 : 1,
              transform: expanded ? "translateX(8px)" : "translateX(0)",
              transition:
                "opacity 160ms ease, transform 200ms ease, width 200ms ease, padding-right 200ms ease",
              pointerEvents: expanded ? "none" : "auto",
              flex: "0 0 auto",
              alignSelf: "center",
              overflow: "hidden",
            }}
          >
            <div className="px-1.75 py-2">
              <IconImageSquare width={24} height={24} style={{ color: iconColor }} />
            </div>
            <div className="px-1.75 py-2">
              <IconStickerRound width={24} height={24} style={{ color: iconColor }} />
            </div>
            <div className="px-1.75 py-2">
              <IconAt width={24} height={24} style={{ color: iconColor }} />
            </div>
          </div>
        </div>
      </div>

      {/* Action bar — slides in below the input pill in the expanded form. */}
      <div
        aria-hidden={!expanded}
        style={{
          overflow: "hidden",
          maxHeight: expanded ? 48 : 0,
          opacity: expanded ? 1 : 0,
          transition: `max-height ${EXPAND_DURATION_MS}ms ${EXPAND_TRANSITION}, opacity 220ms ease`,
          willChange: "max-height, opacity",
          pointerEvents: expanded ? "auto" : "none",
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            padding: keyboardOpen ? "0 12px 0 8px" : "0 12px 8px 8px",
          }}
        >
          <div className="flex items-center">
            {actionIcons.map(
              (IconComp, index) => (
                <div
                  key={index}
                  className="flex items-end"
                  style={{ padding: "4px 8px" }}
                >
                  <IconComp width={24} height={24} style={{ color: iconColor }} />
                </div>
              ),
            )}
          </div>

          <button
            type="button"
            tabIndex={-1}
            disabled={!hasText}
            aria-label="Send comment"
            onClick={sendCurrentValue}
            style={{
              width: 52,
              height: 32,
              borderRadius: 999,
              border: "none",
              padding: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: getColorCSSVar("UIShapePrimary"),
              color: getColorCSSVar("UIImageOverlayWhite"),
              opacity: hasText ? 1 : 0.4,
              transition: "opacity 180ms ease",
              cursor: hasText ? "pointer" : "default",
              boxSizing: "border-box",
            }}
          >
            <IconArrowUpFill
              width={16}
              height={16}
              style={{ color: getColorCSSVar("UIImageOverlayWhite") }}
            />
          </button>
        </div>
      </div>

      {liftViaPadding ? null : (
        <div
          aria-hidden="true"
          style={{
            // Collapses to 0 while the keyboard is up (`data-keyboard-open`) so
            // the composer sits flush on the keys; restores safe-area when down.
            height: floatingBottomInsetCss,
          }}
        />
      )}
    </div>
  );
});
