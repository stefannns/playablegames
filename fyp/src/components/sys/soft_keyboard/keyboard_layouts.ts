/**
 * Key data for the iOS-style soft keyboard.
 *
 * A "key" is either a character to insert or a named action handled by the
 * keyboard logic (shift, backspace, layout switch, space, return).
 */

export type CharKey = {
  type: "char";
  /** Character inserted on tap. */
  value: string;
  /**
   * Display label. Defaults to {@link CharKey.value}. Useful for showing a
   * different glyph than what's inserted (e.g. `&` vs `&amp;`).
   */
  label?: string;
  /** Flex weight in its row. Defaults to 1. */
  flex?: number;
  /** Fixed pixel width — overrides {@link flex} when set. */
  width?: number;
};

export type ActionKey = {
  type: "action";
  action:
    | "shift"
    | "backspace"
    | "layout-numbers"
    | "layout-letters"
    | "layout-symbols"
    | "space"
    | "return"
    | "globe";
  /** Display label for textual action keys. */
  label?: string;
  /** Flex weight in its row. */
  flex?: number;
  /** Fixed pixel width — overrides {@link flex} when set. */
  width?: number;
};

export type KeyboardKey = CharKey | ActionKey;

export type KeyboardLayoutId = "letters" | "numbers" | "symbols";

export type KeyboardLayout = {
  id: KeyboardLayoutId;
  /** Each entry is a row of keys, top to bottom. */
  rows: KeyboardKey[][];
};

const charRow = (chars: string[]): CharKey[] =>
  chars.map((value) => ({ type: "char", value }));

/* eslint-disable @typescript-eslint/no-unused-vars */
// Reference: iPhone portrait layout, US English.

export const LETTERS_LAYOUT: KeyboardLayout = {
  id: "letters",
  rows: [
    charRow(["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"]),
    // Row 2: 28px side inset applied at render time (`KB_LETTERS_ROW_SIDE_INSET_PX`).
    charRow(["a", "s", "d", "f", "g", "h", "j", "k", "l"]),
    [
      { type: "action", action: "shift" },
      ...charRow(["z", "x", "c", "v", "b", "n", "m"]),
      { type: "action", action: "backspace" },
    ],
    // English-only for now: the globe (input-language switch) is intentionally
    // omitted. The layout-switch and return keys sit at a fixed 92px width
    // each (per spec); space fills the remaining row.
    [
      { type: "action", action: "layout-numbers", label: "123", width: 92 },
      { type: "action", action: "space", label: "space", flex: 1 },
      { type: "action", action: "return", width: 92 },
    ],
  ],
};

export const NUMBERS_LAYOUT: KeyboardLayout = {
  id: "numbers",
  rows: [
    charRow(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]),
    charRow(["-", "/", ":", ";", "(", ")", "$", "&", "@", '"']),
    [
      { type: "action", action: "layout-symbols", label: "#+=", flex: 1.5 },
      ...charRow([".", ",", "?", "!", "'"]),
      { type: "action", action: "backspace" },
    ],
    [
      { type: "action", action: "layout-letters", label: "ABC", width: 92 },
      { type: "action", action: "space", label: "space", flex: 1 },
      { type: "action", action: "return", width: 92 },
    ],
  ],
};

export const SYMBOLS_LAYOUT: KeyboardLayout = {
  id: "symbols",
  rows: [
    charRow(["[", "]", "{", "}", "#", "%", "^", "*", "+", "="]),
    charRow(["_", "\\", "|", "~", "<", ">", "€", "£", "¥", "·"]),
    [
      { type: "action", action: "layout-numbers", label: "123", flex: 1.5 },
      ...charRow([".", ",", "?", "!", "'"]),
      { type: "action", action: "backspace" },
    ],
    [
      { type: "action", action: "layout-letters", label: "ABC", width: 92 },
      { type: "action", action: "space", label: "space", flex: 1 },
      { type: "action", action: "return", width: 92 },
    ],
  ],
};

export function getLayout(id: KeyboardLayoutId): KeyboardLayout {
  switch (id) {
    case "numbers":
      return NUMBERS_LAYOUT;
    case "symbols":
      return SYMBOLS_LAYOUT;
    default:
      return LETTERS_LAYOUT;
  }
}
