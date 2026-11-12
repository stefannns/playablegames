import {
  Fragment,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { IconEmojiLike, IconMicrophone } from "@byted-tiktok/tux-icons";
import {
  type ActionKey,
  type CharKey,
  type KeyboardKey,
  type KeyboardLayoutId,
  getLayout,
} from "./keyboard_layouts";
import type { SoftKeyboardReturnKey } from "./keyboard_context";

/* ============================================================================
 * Layout metrics — every value below is derived from the design spec:
 *   - key height 45px, vertical row gap 11px, row count 4 (= 213px keys)
 *   - 10px top padding above the first row
 *   - 80px bottom action strip (emoji + microphone) flush with frame bottom
 * ========================================================================== */

export const KB_KEY_HEIGHT = 45;
/** iOS system key grain — 7px squircle via `data-electron-smooth-corner`. */
export const KB_KEY_BORDER_RADIUS_PX = 7;
/** Char label line box inside a 45px key (leaves {@link KB_CHAR_BOTTOM_PAD_PX} below). */
export const KB_CHAR_LINE_HEIGHT_PX = 41;
export const KB_CHAR_BOTTOM_PAD_PX = 4;
export const KB_ROW_GAP = 11;
/** Horizontal gap between keys in a row. */
export const KB_KEY_GAP_PX = 6;
/** ASD row inset from the Q-row edges (each side). */
export const KB_LETTERS_ROW_SIDE_INSET_PX = 28;
/** Gap between shift/backspace and the Z-row letter cluster (each side). */
export const KB_SHIFT_ROW_EDGE_GAP_PX = 14;
export const KB_ROW_COUNT = 4;
export const KB_TOP_PADDING = 10;
export const KB_BOTTOM_STRIP_HEIGHT = 80;
/** Opaque keyboard chrome — avoids squircle clip + backdrop-filter corner halos. */
export const KB_SURFACE_COLOR_LIGHT = "#D1D3D9";

const SHIFT_ROW_EDGE_SPACER_STYLE: CSSProperties = {
  width: KB_SHIFT_ROW_EDGE_GAP_PX,
  flexShrink: 0,
};

function isShiftBackspaceRow(row: KeyboardKey[]): boolean {
  const first = row[0];
  const last = row[row.length - 1];
  return (
    row.length >= 3 &&
    first?.type === "action" &&
    first.action === "shift" &&
    last?.type === "action" &&
    last.action === "backspace"
  );
}
export const KB_SURFACE_COLOR_DARK = "#272729";

/** Top squircle on the outer sliding keyboard panel (bottom stays square). */
export const KB_PANEL_TOP_RADIUS_PX = 27;

/** Word-suggestion strip — top of the keyboard surface, same container/bg as keys. */
export const KB_SUGGESTION_BAR_HEIGHT = 46;
export const KB_SUGGESTION_DIVIDER_HEIGHT_PX = 24;
/** Key rows + bottom emoji/mic strip (excludes the suggestion bar). */
export const KB_KEYS_AREA_HEIGHT =
  KB_TOP_PADDING +
  KB_ROW_COUNT * KB_KEY_HEIGHT +
  (KB_ROW_COUNT - 1) * KB_ROW_GAP +
  KB_BOTTOM_STRIP_HEIGHT;
/**
 * Full keyboard surface: suggestion bar + keys + bottom action strip.
 * Used by the host to size the sliding panel.
 */
export const KB_SURFACE_HEIGHT = KB_SUGGESTION_BAR_HEIGHT + KB_KEYS_AREA_HEIGHT;

/** Slide-up duration when the soft keyboard opens (`SoftKeyboardHost`). */
export const KB_OPEN_ANIMATION_MS = 280;

/** Full slide-up chrome height — suggestion strip + keys + bottom action strip. */
export function getSoftKeyboardPresentedHeight(): number {
  return KB_SURFACE_HEIGHT;
}

/* ============================================================================
 * Colors / metrics — chosen to closely match iOS portrait QWERTY keyboard.
 * ========================================================================== */

type Palette = {
  surface: string;
  letterKey: string;
  letterKeyPressed: string;
  functionKey: string;
  functionKeyPressed: string;
  text: string;
  textMuted: string;
  returnKey: string;
  returnKeyText: string;
  bubble: string;
  bubbleText: string;
  suggestionDivider: string;
};

const LIGHT_PALETTE: Palette = {
  surface: KB_SURFACE_COLOR_LIGHT,
  letterKey: "#FFFFFF",
  letterKeyPressed: "#E2E5EA",
  functionKey: "#ABB0BC",
  functionKeyPressed: "#FFFFFF",
  text: "#000000",
  textMuted: "#000000",
  returnKey: "#007AFF",
  returnKeyText: "#FFFFFF",
  bubble: "#FFFFFF",
  bubbleText: "#000000",
  suggestionDivider: "rgba(174, 174, 178, 0.5)",
};

const DARK_PALETTE: Palette = {
  surface: KB_SURFACE_COLOR_DARK,
  letterKey: "#6D6D72",
  letterKeyPressed: "#8E8E92",
  functionKey: "#48484C",
  functionKeyPressed: "#6D6D72",
  text: "#FFFFFF",
  textMuted: "#FFFFFF",
  returnKey: "#007AFF",
  returnKeyText: "#FFFFFF",
  bubble: "#7B7B7F",
  bubbleText: "#FFFFFF",
  suggestionDivider: "rgba(255, 255, 255, 0.16)",
};

/* ============================================================================
 * Shift state
 * ========================================================================== */

export type ShiftState = "off" | "on" | "caps";

const shiftNext = (state: ShiftState): ShiftState => {
  switch (state) {
    case "off":
      return "on";
    case "on":
      return "caps";
    case "caps":
      return "off";
  }
};

/* ============================================================================
 * Action / character handlers
 * ========================================================================== */

type SoftKeyboardProps = {
  layoutId: KeyboardLayoutId;
  /** Required to apply auto-capitalization defaults at first render. */
  shift: ShiftState;
  resolvedTheme: "light" | "dark";
  returnKey: SoftKeyboardReturnKey;
  /** Insert a character at the caret. */
  onInsert: (char: string) => void;
  onBackspace: () => void;
  onShift: (next: ShiftState) => void;
  onLayoutSwitch: (next: KeyboardLayoutId) => void;
  onReturn: () => void;
  onSpace: () => void;
  /** Tap on the bottom-left emoji icon. Wired to a future emoji panel. */
  onEmoji?: () => void;
  /** Tap on the bottom-right microphone icon (dictation). */
  onMic?: () => void;
  /** Quick-type suggestions shown above the key rows (same surface container). */
  suggestionItems?: readonly string[];
  onSuggestionSelect?: (text: string) => void;
};

/* ============================================================================
 * Icons (inline SVG so we control stroke width / centering)
 * ========================================================================== */

function ShiftGlyph({
  active,
  color,
}: {
  active: boolean;
  color: string;
}) {
  return (
    <svg
      width={20}
      height={22}
      viewBox="0 0 20 22"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2.5 10.4L9.32 3.46c.37-.38.98-.38 1.36 0L17.5 10.4c.32.32.1.85-.36.85h-3.39c-.28 0-.5.22-.5.5v5.5c0 .55-.45 1-1 1H7.75c-.55 0-1-.45-1-1v-5.5c0-.28-.22-.5-.5-.5H2.86c-.46 0-.68-.53-.36-.85Z"
        fill={active ? color : "transparent"}
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CapsLockGlyph({ color }: { color: string }) {
  return (
    <svg
      width={20}
      height={22}
      viewBox="0 0 20 22"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2.5 10.4L9.32 3.46c.37-.38.98-.38 1.36 0L17.5 10.4c.32.32.1.85-.36.85h-3.39c-.28 0-.5.22-.5.5v5.5c0 .55-.45 1-1 1H7.75c-.55 0-1-.45-1-1v-5.5c0-.28-.22-.5-.5-.5H2.86c-.46 0-.68-.53-.36-.85Z"
        fill={color}
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <circle cx={10} cy={9} r={1.1} fill={color} opacity={0.55} />
    </svg>
  );
}

function BackspaceGlyph({ color }: { color: string }) {
  return (
    <svg
      width={26}
      height={20}
      viewBox="0 0 26 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8.2 3.3 1.8 9.3a1 1 0 0 0 0 1.4l6.4 6c.19.18.43.28.69.28h13.2c1.66 0 3-1.35 3-3V6c0-1.66-1.34-3-3-3H8.89c-.26 0-.5.1-.69.3Z"
        stroke={color}
        strokeWidth={1.4}
        fill="none"
      />
      <path
        d="m13.2 7.3 5 5m0-5-5 5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

function GlobeGlyph({ color }: { color: string }) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
    >
      <circle cx={11} cy={11} r={8.2} stroke={color} strokeWidth={1.4} />
      <ellipse cx={11} cy={11} rx={3.4} ry={8.2} stroke={color} strokeWidth={1.4} />
      <path d="M3 11h16" stroke={color} strokeWidth={1.4} />
    </svg>
  );
}

/* ============================================================================
 * Single key
 * ========================================================================== */

const RETURN_LABELS: Record<SoftKeyboardReturnKey, string> = {
  return: "return",
  search: "Search",
  go: "Go",
  done: "Done",
  next: "Next",
  send: "Send",
  join: "Join",
};

type KeyButtonProps = {
  k: KeyboardKey;
  palette: Palette;
  /** Capitalized display variant for letter keys. */
  upper: boolean;
  shift: ShiftState;
  returnKey: SoftKeyboardReturnKey;
  /** Whether this is a "primary" colored return key (e.g. blue Search). */
  returnPrimary: boolean;
  onInsert: (char: string) => void;
  onBackspace: () => void;
  onShift: () => void;
  onLayoutSwitch: (next: KeyboardLayoutId) => void;
  onReturn: () => void;
  onSpace: () => void;
};

const KeyButton = ({
  k,
  palette,
  upper,
  shift,
  returnKey,
  returnPrimary,
  onInsert,
  onBackspace,
  onShift,
  onLayoutSwitch,
  onReturn,
  onSpace,
}: KeyButtonProps) => {
  const [pressed, setPressed] = useState(false);
  const pointerIdRef = useRef<number | null>(null);
  // Long-press repeat (for backspace).
  const repeatTimerRef = useRef<number | null>(null);
  const repeatIntervalRef = useRef<number | null>(null);

  const isCharKey = k.type === "char";
  const isLetter = isCharKey && /^[a-z]$/i.test((k as CharKey).value);
  const isSpace = k.type === "action" && (k as ActionKey).action === "space";
  const isReturn = k.type === "action" && (k as ActionKey).action === "return";
  const isBackspace =
    k.type === "action" && (k as ActionKey).action === "backspace";
  const isShift = k.type === "action" && (k as ActionKey).action === "shift";
  const isLayoutSwitch =
    k.type === "action" &&
    ((k as ActionKey).action === "layout-numbers" ||
      (k as ActionKey).action === "layout-letters" ||
      (k as ActionKey).action === "layout-symbols");
  const usesLetterKeySurface =
    (isCharKey && !isSpace) ||
    isSpace ||
    isShift ||
    isBackspace ||
    isLayoutSwitch;

  // Resolve background color.
  const baseBg: string = useMemo(() => {
    if (isReturn && returnPrimary) return palette.returnKey;
    if (usesLetterKeySurface) return palette.letterKey;
    return palette.functionKey;
  }, [
    isReturn,
    returnPrimary,
    usesLetterKeySurface,
    palette.returnKey,
    palette.letterKey,
    palette.functionKey,
  ]);

  const pressedBg: string = useMemo(() => {
    if (isReturn && returnPrimary) return palette.returnKey;
    if (usesLetterKeySurface) return palette.letterKeyPressed;
    return palette.functionKeyPressed;
  }, [
    isReturn,
    returnPrimary,
    usesLetterKeySurface,
    palette.returnKey,
    palette.letterKeyPressed,
    palette.functionKeyPressed,
  ]);

  // Resolve text color.
  const fg: string = useMemo(() => {
    if (isReturn && returnPrimary) return palette.returnKeyText;
    return palette.text;
  }, [isReturn, returnPrimary, palette.returnKeyText, palette.text]);

  const clearRepeat = useCallback(() => {
    if (repeatTimerRef.current != null) {
      window.clearTimeout(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
    if (repeatIntervalRef.current != null) {
      window.clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearRepeat();
  }, [clearRepeat]);

  const release = useCallback(() => {
    setPressed(false);
    pointerIdRef.current = null;
    clearRepeat();
  }, [clearRepeat]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      // Only respond to primary button or touch / pen.
      if (event.pointerType === "mouse" && event.button !== 0) return;
      pointerIdRef.current = event.pointerId;
      try {
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      } catch {
        // Some browsers may throw if capture is already held.
      }
      setPressed(true);

      // Begin long-press repeat for backspace.
      if (isBackspace) {
        onBackspace();
        repeatTimerRef.current = window.setTimeout(() => {
          repeatIntervalRef.current = window.setInterval(() => {
            onBackspace();
          }, 80);
        }, 380);
      }

      event.preventDefault();
    },
    [isBackspace, onBackspace],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      // Ignore stray pointerups that did not start on this key. This matters
      // when the keyboard mounts during the tail end of another tap (for
      // example, focusing the comment field): the releasing pointer may now be
      // geometrically above a key, but that key must not "steal" the tap.
      if (pointerIdRef.current == null) {
        return;
      }
      if (event.pointerId !== pointerIdRef.current) {
        return;
      }
      // Determine the action target: did the pointer end on this key?
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const onTarget =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      release();

      if (!onTarget) return;

      if (k.type === "char") {
        const charVal = upper ? k.value.toUpperCase() : k.value.toLowerCase();
        // Non-letters stay as-is.
        const finalChar = isLetter ? charVal : k.value;
        onInsert(finalChar);
        return;
      }

      const actionKey = k as ActionKey;
      switch (actionKey.action) {
        case "shift":
          onShift();
          break;
        case "backspace":
          // Already fired on press; repeat handled long-press.
          break;
        case "layout-numbers":
          onLayoutSwitch("numbers");
          break;
        case "layout-letters":
          onLayoutSwitch("letters");
          break;
        case "layout-symbols":
          onLayoutSwitch("symbols");
          break;
        case "space":
          onSpace();
          break;
        case "return":
          onReturn();
          break;
        case "globe":
          // No-op for the demo.
          break;
      }
    },
    [
      k,
      isLetter,
      upper,
      onBackspace,
      onInsert,
      onLayoutSwitch,
      onReturn,
      onShift,
      onSpace,
      release,
    ],
  );

  const handlePointerCancel = useCallback(() => {
    release();
  }, [release]);

  // Label
  let label: string | null = null;
  let glyph: JSX.Element | null = null;
  let fontStyle: CSSProperties = {};

  if (k.type === "char") {
    const ch = isLetter ? (upper ? k.value.toUpperCase() : k.value) : k.value;
    label = k.label ?? ch;
    fontStyle = { fontSize: 25, fontWeight: 400 };
  } else {
    const action = k.action;
    if (action === "shift") {
      // Background matches letter keys; on/caps only fill the glyph (fg).
      glyph =
        shift === "caps" ? (
          <CapsLockGlyph color={fg} />
        ) : (
          <ShiftGlyph active={shift === "on"} color={fg} />
        );
    } else if (action === "backspace") {
      glyph = <BackspaceGlyph color={fg} />;
    } else if (action === "globe") {
      glyph = <GlobeGlyph color={fg} />;
    } else if (action === "space") {
      label = "space";
      fontStyle = { fontSize: 17, fontWeight: 400 };
    } else if (action === "return") {
      label = RETURN_LABELS[returnKey];
      fontStyle = { fontSize: 17, fontWeight: 500 };
    } else if (
      action === "layout-numbers" ||
      action === "layout-letters" ||
      action === "layout-symbols"
    ) {
      label = k.label ?? "";
      fontStyle = { fontSize: 16, fontWeight: 500 };
    }
  }

  const effectiveBg = pressed ? pressedBg : baseBg;
  const effectiveFg = fg;

  // Fixed-width keys: layout-switch / return (92px), shift / backspace (square).
  const sizing: CSSProperties =
    isShift || isBackspace
      ? {
          flex: `0 0 ${KB_KEY_HEIGHT}px`,
          width: KB_KEY_HEIGHT,
        }
      : k.width != null
        ? { flex: `0 0 ${k.width}px`, width: k.width }
        : { flex: k.flex ?? 1 };

  const isCharLabel = isCharKey && glyph == null;

  return (
    <button
      type="button"
      data-electron-smooth-corner=""
      style={{
        ...sizing,
        height: "100%",
        borderRadius: KB_KEY_BORDER_RADIUS_PX,
        border: "none",
        outline: "none",
        margin: 0,
        background: effectiveBg,
        color: effectiveFg,
        touchAction: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        overflow: "hidden",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif',
        cursor: "pointer",
        transition: "background 80ms ease-out",
        ...(isCharLabel
          ? {
              display: "block",
              lineHeight: `${KB_CHAR_LINE_HEIGHT_PX}px`,
              textAlign: "center",
              padding: `0 0 ${KB_CHAR_BOTTOM_PAD_PX}px 0`,
              ...fontStyle,
            }
          : {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: isShift || isBackspace ? 0 : `0 0 ${KB_CHAR_BOTTOM_PAD_PX}px 0`,
              ...fontStyle,
            }),
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onContextMenu={(event) => event.preventDefault()}
      aria-label={
        k.type === "char"
          ? k.value
          : k.type === "action"
            ? k.action
            : undefined
      }
    >
      {glyph ?? label}
    </button>
  );
};

/* ============================================================================
 * Word-suggestion strip — shares the keyboard surface container/background.
 * ========================================================================== */

function SuggestionBar({
  items,
  palette,
  onSelect,
}: {
  items: readonly string[];
  palette: Palette;
  onSelect: (text: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div
      style={{
        height: KB_SUGGESTION_BAR_HEIGHT,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {items.map((item, index) => (
        <Fragment key={`${item}-${index}`}>
          {index > 0 ? (
            <div
              aria-hidden
              style={{
                width: 0.5,
                height: KB_SUGGESTION_DIVIDER_HEIGHT_PX,
                flexShrink: 0,
                backgroundColor: palette.suggestionDivider,
              }}
            />
          ) : null}
          <button
            type="button"
            onClick={() => onSelect(item)}
            style={{
              flex: 1,
              minWidth: 0,
              height: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              color: palette.text,
              fontSize: 17,
              lineHeight: "22px",
              fontWeight: 400,
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
              padding: "0 8px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              textAlign: "center",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {item}
          </button>
        </Fragment>
      ))}
    </div>
  );
}

/* ============================================================================
 * The keyboard panel (suggestion strip + rows + keys)
 * ========================================================================== */

export default function SoftKeyboard({
  layoutId,
  shift,
  resolvedTheme,
  returnKey,
  onInsert,
  onBackspace,
  onShift,
  onLayoutSwitch,
  onReturn,
  onSpace,
  onEmoji,
  onMic,
  suggestionItems = [],
  onSuggestionSelect,
}: SoftKeyboardProps) {
  const palette = resolvedTheme === "dark" ? DARK_PALETTE : LIGHT_PALETTE;
  const layout = getLayout(layoutId);
  const upper = shift !== "off";

  // Decide whether the return key should be visually "primary" (blue).
  // iOS only highlights it on certain return keys (Search/Go/Send/Join/Done).
  const returnPrimary = returnKey !== "return" && returnKey !== "next";

  return (
    <div
      style={{
        background: palette.surface,
        flex: 1,
        minHeight: 0,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {suggestionItems.length > 0 && onSuggestionSelect ? (
        <SuggestionBar
          items={suggestionItems}
          palette={palette}
          onSelect={onSuggestionSelect}
        />
      ) : null}

      {/* Rows area: fixed 45px rows with 11px gaps. */}
      <div
        style={{
          paddingTop: KB_TOP_PADDING,
          paddingLeft: 3,
          paddingRight: 3,
          display: "flex",
          flexDirection: "column",
          gap: KB_ROW_GAP,
        }}
      >
        {layout.rows.map((row, rowIdx) => {
          const isMiddleLettersRow =
            layout.id === "letters" && rowIdx === 1;
          const shiftBackspaceRow = isShiftBackspaceRow(row);
          const keyButtonProps = {
            palette,
            upper,
            shift,
            returnKey,
            returnPrimary,
            onInsert,
            onBackspace,
            onShift: () => onShift(shiftNext(shift)),
            onLayoutSwitch,
            onReturn,
            onSpace,
          };
          return (
            <div
              key={rowIdx}
              style={{
                display: "flex",
                gap: shiftBackspaceRow ? 0 : KB_KEY_GAP_PX,
                height: KB_KEY_HEIGHT,
                alignItems: "stretch",
                paddingLeft: isMiddleLettersRow
                  ? KB_LETTERS_ROW_SIDE_INSET_PX
                  : 0,
                paddingRight: isMiddleLettersRow
                  ? KB_LETTERS_ROW_SIDE_INSET_PX
                  : 0,
              }}
            >
              {shiftBackspaceRow ? (
                <>
                  <KeyButton k={row[0]} {...keyButtonProps} />
                  <div aria-hidden style={SHIFT_ROW_EDGE_SPACER_STYLE} />
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      gap: KB_KEY_GAP_PX,
                      alignItems: "stretch",
                    }}
                  >
                    {row.slice(1, -1).map((key, keyIdx) => (
                      <KeyButton
                        key={`${rowIdx}-${keyIdx + 1}`}
                        k={key}
                        {...keyButtonProps}
                      />
                    ))}
                  </div>
                  <div aria-hidden style={SHIFT_ROW_EDGE_SPACER_STYLE} />
                  <KeyButton k={row[row.length - 1]} {...keyButtonProps} />
                </>
              ) : (
                row.map((key, keyIdx) => (
                  <KeyButton
                    key={`${rowIdx}-${keyIdx}`}
                    k={key}
                    {...keyButtonProps}
                  />
                ))
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom action strip: emoji (left) + microphone (right). The home
          indicator pill from <HomeIndicator /> overlays the bottom 34px of
          this strip on desktop via its higher z-index. */}
      <BottomActionStrip
        palette={palette}
        onEmoji={onEmoji}
        onMic={onMic}
      />
    </div>
  );
}

/* ============================================================================
 * Bottom action strip — emoji & microphone icons (no globe; English-only).
 * ========================================================================== */

function BottomActionStrip({
  palette,
  onEmoji,
  onMic,
}: {
  palette: Palette;
  onEmoji?: () => void;
  onMic?: () => void;
}) {
  return (
    <div
      style={{
        height: KB_BOTTOM_STRIP_HEIGHT,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        paddingTop: 12,
        paddingLeft: 22,
        paddingRight: 22,
        boxSizing: "border-box",
      }}
    >
      <BottomActionButton
        ariaLabel="Emoji"
        color={palette.text}
        onPress={onEmoji}
      >
        <IconEmojiLike width={26} height={26} />
      </BottomActionButton>
      <BottomActionButton
        ariaLabel="Voice dictation"
        color={palette.text}
        onPress={onMic}
      >
        <IconMicrophone width={26} height={26} />
      </BottomActionButton>
    </div>
  );
}

function BottomActionButton({
  ariaLabel,
  color,
  onPress,
  children,
}: {
  ariaLabel: string;
  color: string;
  onPress?: () => void;
  children: JSX.Element;
}) {
  const [pressed, setPressed] = useState(false);
  const pointerActiveRef = useRef(false);
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      data-electron-smooth-corner=""
      onPointerDown={() => {
        pointerActiveRef.current = true;
        setPressed(true);
      }}
      onPointerUp={() => {
        if (!pointerActiveRef.current) {
          return;
        }
        pointerActiveRef.current = false;
        setPressed(false);
        onPress?.();
      }}
      onPointerCancel={() => {
        pointerActiveRef.current = false;
        setPressed(false);
      }}
      onPointerLeave={() => {
        pointerActiveRef.current = false;
        setPressed(false);
      }}
      style={{
        width: 36,
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        border: "none",
        outline: "none",
        padding: 0,
        margin: 0,
        borderRadius: KB_KEY_BORDER_RADIUS_PX,
        color,
        opacity: pressed ? 0.4 : 1,
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
        transition: "opacity 80ms ease-out",
      }}
    >
      {children}
    </button>
  );
}
