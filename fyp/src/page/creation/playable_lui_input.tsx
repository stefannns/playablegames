/**
 * "Describe your idea" on the result preview. Tapping the pill enters LUI typing (Figma 16143:184769):
 * the input box rides on the keyboard, grows with long text up to 5 lines (16143:186204), and typing
 * "@" lists friends above it (18220:283985). Send hands the text to the chat (18196:279313).
 */
import { TUXIconAt, TUXIconImagePlus, TUXIconPaperplaneFill } from "@byted-tiktok/tux-icons";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { type PointerEvent as ReactPointerEvent, useLayoutEffect, useRef, useState } from "react";
import { useSoftKeyboard } from "../../components/sys/soft_keyboard";
import "./playable_generating.css";

/** Demo friends until a real contact list is wired in. */
const FRIENDS = ["Jerol", "Zhouqi", "Thomas", "Siyuan", "Janice", "Frank"].map(name => ({
  name, avatar: `/resource/playable/mention/${name.toLowerCase()}.png`,
}));
/** App/Headline-Regular rows are 16 × 1.3; the box stops growing at 5 rows and scrolls instead. */
const LINE_HEIGHT = 20.8;
const MAX_LINES = 5;
/** A trailing "@word" (at the start or after a space) is the mention being typed. */
const MENTION_QUERY = /(^|\s)@(\w*)$/;
/** Completed mentions of known friends, highlighted wherever the prompt is shown. */
const MENTION = new RegExp(`(@(?:${FRIENDS.map(friend => friend.name).join("|")}))(?!\\w)`);

/** Prompt text with friend mentions wrapped for the #60B3FF semibold highlight. */
export function MentionText({ text }: { text: string }) {
  return <>{text.split(MENTION).map((part, index) => index % 2 ? <span key={index} className="playable-mention-tag">{part}</span> : part)}</>;
}
const isDesktopFrame = () => window.matchMedia("(min-width: 640px)").matches;

export function PlayableLuiInput({ typing, onTypingChange, onSend }: {
  typing: boolean;
  onTypingChange: (typing: boolean) => void;
  onSend: (text: string) => void;
}) {
  const { open, close, setValue, isOpen } = useSoftKeyboard();
  const reducedMotion = useReducedMotion();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const syncMirror = () => { if (mirrorRef.current && fieldRef.current) mirrorRef.current.scrollTop = fieldRef.current.scrollTop; };
  const [draft, setDraft] = useState("");

  const sendRef = useRef<() => void>(() => {});
  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    close();
    onTypingChange(false);
    onSend(text);
  };
  sendRef.current = send;
  const typingChangeRef = useRef(onTypingChange);
  typingChangeRef.current = onTypingChange;

  // Present the keyboard bound to the field once typing mounts it.
  useLayoutEffect(() => {
    const field = fieldRef.current;
    if (!typing || !field) return;
    field.focus({ preventScroll: true });
    field.setSelectionRange(field.value.length, field.value.length);
    if (!isDesktopFrame()) return;
    open({
      target: field,
      allowPageInteraction: true,
      appearance: "dark",
      returnKey: "send",
      autoCapitalize: "sentences",
      onSubmit: () => sendRef.current(),
      onDismiss: () => typingChangeRef.current(false),
    });
  }, [typing, open]);

  // Grow with the text, then scroll inside the box past MAX_LINES.
  useLayoutEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    field.style.height = "0px";
    field.style.height = `${Math.min(field.scrollHeight, LINE_HEIGHT * MAX_LINES)}px`;
    field.scrollTop = field.scrollHeight;
    syncMirror();
  }, [draft, typing]);

  /** Programmatic edits go through the keyboard on desktop so its own value stays in sync. */
  const writeDraft = (next: string) => {
    setDraft(next);
    if (isOpen) setValue(next);
  };
  const query = MENTION_QUERY.exec(draft);
  const friends = query ? FRIENDS.filter(friend => friend.name.toLowerCase().startsWith(query[2].toLowerCase())) : [];
  const mention = (name: string) => writeDraft(`${draft.slice(0, draft.length - query![2].length)}${name} `);
  // Buttons in the dock must not steal focus from the field (that would end typing on phones).
  const keepFocus = (event: ReactPointerEvent) => event.preventDefault();

  if (!typing) {
    return (
      <button type="button" className="playable-result-input" data-electron-smooth-corner data-filled={!!draft || undefined}
        onClick={() => onTypingChange(true)}>
        {draft ? <MentionText text={draft} /> : "Describe your idea..."}
      </button>
    );
  }
  return (
    <div className="playable-lui-dock" data-softkb-keep-open>
      <AnimatePresence>
        {friends.length > 0 && (
          <motion.div key="mention" className="playable-lui-mention" onPointerDown={keepFocus}
            initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}>
            <div className="playable-lui-mention-row">
              {friends.map(friend => (
                <button key={friend.name} type="button" className="playable-lui-mention-item" onClick={() => mention(friend.name)}>
                  <img src={friend.avatar} alt="" draggable={false} />
                  <span>{friend.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="playable-lui-box" data-electron-smooth-corner>
        {/* The field's own glyphs are transparent; the mirror under it paints the same text with mentions highlighted. */}
        <div className="playable-lui-field-wrap">
          <div ref={mirrorRef} className="playable-lui-field-mirror" aria-hidden="true"><MentionText text={draft} />{"\u200B"}</div>
          <textarea ref={fieldRef} className="playable-lui-field" rows={1} value={draft} placeholder="Describe your idea"
            aria-label="Describe your idea" enterKeyHint="send"
            onChange={event => setDraft(event.target.value)} onScroll={syncMirror}
            onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); } }}
            onBlur={() => { if (!isDesktopFrame()) onTypingChange(false); }} />
        </div>
        <div className="playable-lui-actions" onPointerDown={keepFocus}>
          <button type="button" aria-label="Add image"><TUXIconImagePlus size={24} /></button>
          <button type="button" aria-label="Mention a friend" onClick={() => writeDraft(`${draft}${draft && !/\s$/.test(draft) ? " " : ""}@`)}>
            <TUXIconAt size={24} />
          </button>
          <button type="button" className="playable-generating-send" aria-label="Send" disabled={!draft.trim()} onClick={send}>
            <TUXIconPaperplaneFill size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}
