import { TUXText, getColorCSSVar } from "@byted-tiktok/tux-web";
import { IconEmoji, IconAt, IconKeyboardCircle } from "@byted-tiktok/tux-icons";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { APP_Z_OVERLAY } from "../../../../components/sys/app_z_index";
import {
  useSoftKeyboard,
  useSoftKeyboardTextTarget,
} from "../../../../components/sys/soft_keyboard";
import { ThemeScope, useTheme } from "../../../../context/theme.tsx";
import {
  avatarFor,
  MENTION_CONTACTS,
  SELF_AVATAR_SLOT,
} from "./repost_interaction_data.ts";

/**
 * Add-a-note ("附言") composer (Figma 282:48462). Input card stays screen-
 * centered; uses the same global SoftKeyboardHost + focus/open path as
 * text-to-image (`useSoftKeyboardTextTarget`).
 */

const MAX_CHAR_COUNT = 150;
const CARD_WIDTH = 326;
const PANEL_HEIGHT = 300;
const FADE_MS = 200;

type ComposerMode = "keyboard" | "emoji" | "mention";

const EMOJIS = [
  "😀","😂","🥹","😍","😎","🥳","😭","😅","👍","🙏",
  "🔥","✨","🎉","💯","❤️","🧡","💛","💚","💙","💜",
  "🖤","🤍","👀","💀","🙌","👏","🤯","😱","🥲","😮",
  "🤔","😴","😇","🤩","😜","😉","🙃","😏","🫶","🤝",
  "💃","🕺","🎶","🎧","📷","🌟","⚡","🌈","🍜","☕",
];

export type RepostNoteInputProps = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  root?: HTMLElement | null;
  initialNote?: string;
  onSubmit?: (note: string) => void;
};

export function RepostNoteInput({
  visible,
  onVisibleChange,
  root,
  initialNote = "",
  onSubmit,
}: RepostNoteInputProps) {
  const { mode: themeMode } = useTheme();
  const { isOpen: softKeyboardOpen, close: closeSoftKeyboard, setValue: setSoftKeyboardValue } =
    useSoftKeyboard();

  const [value, setValue] = useState(initialNote);
  const [mounted, setMounted] = useState(visible);
  const [shown, setShown] = useState(false);
  const [mode, setMode] = useState<ComposerMode>("keyboard");
  const skipBlurCloseRef = useRef(false);
  const wasSoftKeyboardOpenRef = useRef(false);

  const updateValue = useCallback(
    (next: string) => {
      const clipped = next.slice(0, MAX_CHAR_COUNT);
      setValue(clipped);
      if (softKeyboardOpen) setSoftKeyboardValue(clipped);
    },
    [softKeyboardOpen, setSoftKeyboardValue],
  );

  const handleSendRef = useRef<() => void>(() => {});

  const { targetRef: textareaRef, onTargetFocus, focusTarget, focusTargetAfterFrame } =
    useSoftKeyboardTextTarget({
      placeholder: "Say something...",
      returnKey: "send",
      onChange: updateValue,
      onSubmit: () => handleSendRef.current(),
    });

  const handleSend = useCallback(() => {
    const next = (textareaRef.current?.value ?? value).trim();
    if (!next) return;
    onSubmit?.(next);
    closeSoftKeyboard();
    onVisibleChange(false);
  }, [closeSoftKeyboard, onSubmit, onVisibleChange, textareaRef, value]);

  handleSendRef.current = handleSend;

  const closeComposer = useCallback(() => {
    closeSoftKeyboard();
    onVisibleChange(false);
  }, [closeSoftKeyboard, onVisibleChange]);

  const dismissSoftKeyboard = useCallback(() => {
    closeSoftKeyboard();
    textareaRef.current?.blur();
  }, [closeSoftKeyboard, textareaRef]);

  const armAccessorySwitch = useCallback(() => {
    skipBlurCloseRef.current = true;
  }, []);

  const handleTextareaBlur = useCallback(() => {
    requestAnimationFrame(() => {
      if (skipBlurCloseRef.current) {
        skipBlurCloseRef.current = false;
        return;
      }
      if (mode !== "keyboard") return;
      closeComposer();
    });
  }, [closeComposer, mode]);

  const returnToTextKeyboard = useCallback(() => {
    setMode("keyboard");
    focusTarget();
  }, [focusTarget]);

  // Desktop: dismiss soft keyboard → close the note composer (stay open for @ / emoji panels).
  useEffect(() => {
    if (softKeyboardOpen) {
      wasSoftKeyboardOpenRef.current = true;
      return;
    }
    if (!visible || !shown || mode !== "keyboard") {
      wasSoftKeyboardOpenRef.current = false;
      return;
    }
    if (wasSoftKeyboardOpenRef.current) {
      wasSoftKeyboardOpenRef.current = false;
      onVisibleChange(false);
    }
  }, [softKeyboardOpen, visible, shown, mode, onVisibleChange]);

  useEffect(() => {
    if (visible) {
      wasSoftKeyboardOpenRef.current = false;
      setMounted(true);
      setValue(initialNote);
      setMode("keyboard");
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    setShown(false);
    closeSoftKeyboard();
    const id = window.setTimeout(() => setMounted(false), FADE_MS);
    return () => window.clearTimeout(id);
  }, [visible, initialNote, closeSoftKeyboard]);

  // Same as text-to-image: present global soft keyboard on the next frame after UI is ready.
  useEffect(() => {
    if (!visible || !shown || mode !== "keyboard") return;
    focusTargetAfterFrame();
  }, [visible, shown, mode, focusTargetAfterFrame]);

  if (!mounted) return null;

  const trimmed = value.trim();
  const canSend = trimmed.length > 0;

  const insertText = (text: string) => {
    updateValue(value + text);
  };

  const openEmojiPanel = () => {
    setMode("emoji");
    dismissSoftKeyboard();
  };

  const openMentionPanel = () => {
    setMode("mention");
    dismissSoftKeyboard();
  };

  const handleBackdropPointerDown = (event: ReactPointerEvent) => {
    event.stopPropagation();
    closeComposer();
  };

  const fadeTransition = `opacity ${FADE_MS}ms ease`;

  const composerCard = (
    <div
      role="dialog"
      aria-label="Add to your repost"
      className="relative shrink-0 bg-tux-v2-ui-sheet-flat-1"
      style={{
        width: CARD_WIDTH,
        maxWidth: "100%",
        minHeight: 124,
        borderRadius: 20,
        backgroundColor: getColorCSSVar("UISheetFlat1"),
      }}
    >
      <div className="absolute left-3 top-3 right-3 flex items-center gap-2">
        <img
          src={avatarFor(SELF_AVATAR_SLOT, 80)}
          alt="Your avatar"
          className="flex-none rounded-full object-cover"
          style={{ width: 40, height: 40 }}
        />
        <div className="relative flex-1 min-w-0">
          {value.length === 0 ? (
            <span
              className="top-0 left-0 absolute pointer-events-none"
              style={{
                fontSize: 17,
                fontWeight: 500,
                lineHeight: "22px",
                color: getColorCSSVar("UITextPlaceholder"),
              }}
            >
              Say something...
            </span>
          ) : null}
          <textarea
            ref={textareaRef}
            value={value}
            rows={1}
            maxLength={MAX_CHAR_COUNT}
            onFocus={(event) => {
              setMode("keyboard");
              onTargetFocus(event);
            }}
            onBlur={handleTextareaBlur}
            onChange={(e) => updateValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            enterKeyHint="send"
            autoCapitalize="sentences"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="block bg-transparent p-0 outline-none w-full resize-none"
            style={{
              fontSize: 17,
              lineHeight: "22px",
              color: getColorCSSVar("UIText1"),
              caretColor: getColorCSSVar("UITextPrimaryDisplay"),
              minHeight: 22,
              maxHeight: 66,
            }}
          />
        </div>
      </div>

      <div className="absolute right-3 bottom-3 flex items-center gap-3">
        <div className="flex items-center" style={{ gap: 1 }}>
          <button
            type="button"
            aria-label="Mention"
            className="flex justify-center items-center cursor-pointer"
            style={{ width: 40, height: 40 }}
            onPointerDown={() => {
              if (mode !== "mention") armAccessorySwitch();
            }}
            onClick={() => (mode === "mention" ? returnToTextKeyboard() : openMentionPanel())}
          >
            <IconAt width={24} height={24} className="text-tux-v2-ui-text-1" />
          </button>
          <button
            type="button"
            aria-label={mode === "emoji" ? "Keyboard" : "Emoji"}
            className="flex justify-center items-center cursor-pointer"
            style={{ width: 40, height: 40 }}
            onPointerDown={() => {
              if (mode !== "emoji") armAccessorySwitch();
            }}
            onClick={() => (mode === "emoji" ? returnToTextKeyboard() : openEmojiPanel())}
          >
            {mode === "emoji" ? (
              <IconKeyboardCircle width={24} height={24} className="text-tux-v2-ui-text-1" />
            ) : (
              <IconEmoji width={24} height={24} className="text-tux-v2-ui-text-1" />
            )}
          </button>
        </div>

        <button
          type="button"
          aria-label="Add"
          disabled={!canSend}
          onPointerDown={() => {
            if (canSend) skipBlurCloseRef.current = true;
          }}
          onClick={handleSend}
          className="flex justify-center items-center cursor-pointer"
          style={{
            width: 90,
            height: 40,
            padding: "8px 14px",
            borderRadius: 999,
            backgroundColor: getColorCSSVar("UIShapePrimary"),
            opacity: canSend ? 1 : 0.5,
          }}
        >
          <TUXText typographyPreset="H4-Semibold" color="UIImageOverlayWhite">
            Add
          </TUXText>
        </button>
      </div>
    </div>
  );

  const node = (
    <ThemeScope mode={themeMode}>
      <div
        className="absolute inset-0"
        style={{ zIndex: APP_Z_OVERLAY }}
        aria-hidden={!shown}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: getColorCSSVar("UIImageOverlayBlackA50"),
            opacity: shown ? 1 : 0,
            transition: fadeTransition,
            pointerEvents: shown ? "auto" : "none",
          }}
          onPointerDown={handleBackdropPointerDown}
        />

        <div
          data-softkb-keep-open
          className="absolute inset-0 flex flex-col items-center justify-center px-6 pointer-events-none"
        >
          <div
            className="flex flex-col items-center gap-3 w-full pointer-events-auto"
            style={{
              opacity: shown ? 1 : 0,
              transition: fadeTransition,
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <TUXText
              typographyPreset="H4-Regular"
              className="text-center"
              color="UIImageOverlayWhite"
            >
              Add to your repost
            </TUXText>
            <div className="flex w-full justify-center">{composerCard}</div>
          </div>
        </div>

        {mode !== "keyboard" ? (
          <div
            data-softkb-keep-open
            className="absolute right-0 bottom-0 left-0 overflow-hidden pointer-events-auto rounded-t-(--tux-v2-radius-container-level2-large) bg-tux-v2-ui-sheet-flat-1"
            style={{
              height: PANEL_HEIGHT,
              backgroundColor: getColorCSSVar("UISheetFlat1"),
              borderTop: `0.5px solid ${getColorCSSVar("UIShapeNeutral3")}`,
              borderTopLeftRadius: "var(--tux-v2-radius-container-level2-large)",
              borderTopRightRadius: "var(--tux-v2-radius-container-level2-large)",
              opacity: shown ? 1 : 0,
              transition: fadeTransition,
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            {mode === "emoji" ? (
              <div className="h-full overflow-y-auto px-2 py-2">
                <div className="grid grid-cols-9">
                  {EMOJIS.map((emoji, i) => (
                    <button
                      key={`${emoji}-${i}`}
                      type="button"
                      className="flex justify-center items-center h-11 cursor-pointer"
                      style={{ fontSize: 28, lineHeight: "28px" }}
                      onClick={() => insertText(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full overflow-y-auto">
                {MENTION_CONTACTS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="flex items-center gap-3 px-4 w-full h-14 cursor-pointer"
                    onClick={() => {
                      insertText(`@${c.name} `);
                      returnToTextKeyboard();
                    }}
                  >
                    <img
                      src={avatarFor(c.avatarSlot, 80)}
                      alt=""
                      className="flex-none rounded-full object-cover"
                      style={{ width: 40, height: 40 }}
                    />
                    <div className="flex flex-col items-start min-w-0">
                      <TUXText
                        typographyPreset="P1-Semibold"
                        className="truncate"
                        style={{ color: getColorCSSVar("UIText1") }}
                      >
                        {c.name}
                      </TUXText>
                      <TUXText
                        typographyPreset="P2-Regular"
                        className="truncate"
                        style={{ color: getColorCSSVar("UIText3") }}
                      >
                        @{c.handle}
                      </TUXText>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </ThemeScope>
  );

  return createPortal(node, root ?? document.body);
}
