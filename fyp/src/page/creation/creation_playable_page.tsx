/**
 * Playable composer: empty → seeded text + atomic media tokens.
 * Uses AppFrame chrome/insets and the shared keyboard; the first prompt follows the bulb, while return visits open
 * an empty prompt with the keyboard up. "Tap for ideas" only ever appears on the first visit.
 */
import { animate, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { TUXNavBar, getColorCSSVar } from "@byted-tiktok/tux-web";
import { useAppFrame } from "../../components/sys/app_frame";
import { AppNavBarCloseButton } from "../../components/sys/app_nav_bar_close_button";
import { useSoftKeyboard } from "../../components/sys/soft_keyboard";
import { TUXIconXMarkSmall } from "@byted-tiktok/tux-icons";
import { takePlayableRemixSource, type PlayableRemixSource } from "./playable_remix_store";
import { PlayableGameFrame } from "./playable_game_frame";
import "./creation_playable_page.css";
import { PLAYABLE_TRICKS, PLAYABLE_TRICK_CYCLES, PLAYABLE_MEMES, PlayableTricksPanel } from "./playable_tricks_panel";

import { PlayableMediaPanel } from "./playable_media_panel";
import { chipHint } from "./playable_chip_hint";
import { PlayableGeneratingView, type PlayableFollowUp, type PlayableGame } from "./playable_generating_view";
import { PlayableResultView } from "./playable_result_view";
import { describePrompt } from "./playable_generation";

import { CAMERA_TOKEN, CHARACTER_PHOTO, COUNT_TOKEN, DUCK_TOKEN, EMPTY_BULB, PHOTO_TOKEN, PLAYABLE_IDEAS, followUpGame, ideaGame } from "./playable_ideas";

// Preserve entry history across route unmounts for this app session.
let hasEnteredPlayable = false;

const REMIX_PLACEHOLDER = "Describe your idea";
const PLACEHOLDER_IDEAS = [
  "Describe your idea...",
  "Make a game about your favorite meme...",
  "Create a challenge using your camera...",
];

const MEDIA = {
  chevron: "/resource/playable/chevron.svg",
  pen: "/resource/playable/ideas/pen.svg",
  minus: "/resource/playable/ideas/minus.svg",
  plus: "/resource/playable/ideas/plus.svg",
};
type ChipKind = "addon" | "meme" | "photo" | "count";
const SEED_CHIPS: Record<string, ChipKind> = {
  [CAMERA_TOKEN]: "addon", [DUCK_TOKEN]: "meme", [PHOTO_TOKEN]: "photo", [COUNT_TOKEN]: "count",
};
/** Chips get exact air instead of a text space on either side: capsules 12px, small images 10px. */
const TOKEN_GAPS: Record<string, number> = { [CAMERA_TOKEN]: 12, [COUNT_TOKEN]: 12, [DUCK_TOKEN]: 10, [PHOTO_TOKEN]: 10 };
const IMAGE_GAP = 10;

const IMAGE_PAIR_GAP = 8;
const IMAGE_TILE = ".playable-duck-token, .playable-photo-token";

/** Serializes as `text`, renders as exactly `width` px. */
function createGap(width: number, text = " ") {
  const span = document.createElement("span");
  span.className = "playable-token-space";
  // Atomic like a chip: a caret inside this font-size:0 span would swallow later inserts.
  span.contentEditable = "false";
  span.dataset.width = String(width);
  span.style.width = `${width}px`;
  span.textContent = text;
  return span;
}
const REPLY_COUNT = { initial: 3, min: 1, max: 9 };
/** Entering the composer: a short beat before the prefilled prompt starts typing. */
const ENTRY_PAUSE_MS = 800;
/** "Tap for ideas" waits this long without interaction once the composer is ready. */
const GUIDE_IDLE_MS = 3000;
/** Bulb tap (non-typewriter) reveal: text after a short beat, chips 80ms behind it. */
const TAP_REVEAL = { text: 0.16, chip: 0.16 + 0.08 };

function createImage(src: string, className?: string) {
  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  img.draggable = false;
  if (className) img.className = className;
  return img;
}

function createStepButton(step: -1 | 1) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "playable-count-step";
  button.dataset.step = String(step);
  button.setAttribute("aria-label", step < 0 ? "Fewer replies" : "More replies");
  button.append(createImage(step < 0 ? MEDIA.minus : MEDIA.plus));
  return button;
}

/** Serialize rich content without leaking the chip's label into the editable text. */
function readPrompt(node: Node): string {
  if (node instanceof HTMLElement && node.dataset.promptToken) return node.dataset.promptToken;
  if (node.nodeType === Node.TEXT_NODE) return (node.textContent ?? "").replace(/\u200B/g, "");
  if (node.nodeName === "BR") return "\n";
  return Array.from(node.childNodes).map(readPrompt).join("");
}


function createPromptChip(kind: ChipKind, index: number, token: string) {
  const camera = kind === "addon";
  const chip = document.createElement("span");
  chip.contentEditable = "false";
  chip.dataset.promptToken = token;
  if (kind === "photo") {
    chip.className = "playable-photo-token";
    chip.dataset.kind = kind;
    chip.setAttribute("aria-label", "Character photo");
    const badge = document.createElement("span");
    badge.className = "playable-photo-badge";
    badge.append(createImage(MEDIA.pen));
    const photo = createImage(CHARACTER_PHOTO, "playable-photo-image");
    photo.dataset.electronSmoothCorner = "";
    chip.append(photo, badge);
    return chip;
  }
  if (kind === "count") {
    chip.className = "playable-count-token";
    chip.dataset.kind = kind;
    chip.setAttribute("role", "group");
    chip.setAttribute("aria-label", "Replies each turn");
    const value = document.createElement("span");
    value.className = "playable-count-value";
    value.textContent = String(REPLY_COUNT.initial);
    chip.append(createStepButton(-1), value, createStepButton(1));
    return chip;
  }
  chip.className = camera ? "playable-camera-token" : "playable-duck-token";
  chip.setAttribute("aria-label", camera ? "Trick selection" : PLAYABLE_MEMES[index].label);
  chip.setAttribute("role", camera ? "group" : "button");
  if (!camera) chip.tabIndex = 0;
  chip.dataset.kind = kind;
  chip.dataset.index = String(index);
  const img = document.createElement("img");
  img.src = camera ? PLAYABLE_TRICKS[index].image : PLAYABLE_MEMES[index].image;
  img.alt = "";
  img.draggable = false;
  if (camera) {
    const main = document.createElement("button");
    main.type = "button";
    main.className = "playable-camera-main";
    main.setAttribute("aria-label", "Next add-on");
    const label = document.createElement("span");
    label.dataset.trickLabel = "true";
    label.textContent = PLAYABLE_TRICKS[index].label;
    main.append(img, label);
    chip.append(main);
    const chevron = document.createElement("img");
    chevron.src = MEDIA.chevron;
    chevron.alt = "";
    chevron.className = "playable-token-chevron";
    const cycle = document.createElement("button");
    cycle.type = "button";
    cycle.className = "playable-trick-cycle";
    cycle.setAttribute("aria-label", "Next trick");
    cycle.append(chevron);
    chip.append(cycle);
  } else {
    img.dataset.electronSmoothCorner = "";
    chip.append(img);
  }
  return chip;
}

function decodeImage(src: string) {
  const image = new Image();
  image.src = src;
  return image.decode().catch(() => undefined);
}

/** Two image tiles side by side sit 5px apart; every other gap keeps its own width. */
function normalizeImageGaps(editor: HTMLElement) {
  // Chips inserted at a caret inside a text run live in that run's span, not the editor root.
  const containers = new Set<Node>([editor]);
  editor.querySelectorAll(".playable-token-space").forEach(gap => containers.add(gap.parentNode!));
  containers.forEach(container => normalizeGapsIn(container));
}

function normalizeGapsIn(container: Node) {
  const nodes = Array.from(container.childNodes).filter(node => node.nodeType !== Node.TEXT_NODE || readPrompt(node));
  const isGap = (node?: Node) => node instanceof HTMLElement && node.classList.contains("playable-token-space");
  const isTile = (node?: Node) => node instanceof HTMLElement && node.matches(IMAGE_TILE);
  for (let index = 0; index < nodes.length; index++) {
    if (!isGap(nodes[index])) continue;
    const start = index;
    while (isGap(nodes[index + 1])) index++;
    const run = nodes.slice(start, index + 1) as HTMLElement[];
    const paired = isTile(nodes[start - 1]) && isTile(nodes[index + 1]);
    run.forEach(gap => { gap.style.width = `${paired ? IMAGE_PAIR_GAP / run.length : Number(gap.dataset.width)}px`; });
  }
}

const isAtom = (node: Node | null): node is HTMLElement =>
  node instanceof HTMLElement && (!!node.dataset.promptToken || node.classList.contains("playable-token-space"));

/**
 * Browsers have no caret position after a trailing non-editable atom and snap it back to the start.
 * Give such an atom an editable zero-width text node (stripped by readPrompt) to hold the caret.
 */
function caretHolderAfter(atom: Node) {
  const next = atom.nextSibling;
  if (next?.nodeType === Node.TEXT_NODE) {
    // An empty leftover text node has no box to draw the caret from.
    if (!next.textContent) next.textContent = "\u200B";
    return next as Text;
  }
  const holder = document.createTextNode("\u200B");
  atom.parentNode!.insertBefore(holder, next);
  return holder;
}

/** Collapsed range after the last content (creates a caret holder after a trailing atom). */
function endRange(editor: HTMLElement) {
  const range = document.createRange();
  let last = editor.lastChild;
  while (last?.nodeType === Node.TEXT_NODE && !readPrompt(last)) last = last.previousSibling;
  if (isAtom(last)) last = caretHolderAfter(last);
  // Typed characters live inside spans; anchor the caret in the final text node, but stop at atoms.
  while (last?.lastChild && !isAtom(last)) last = last.lastChild;
  if (isAtom(last)) {
    range.setStartAfter(last);
    range.collapse(true);
  } else if (last?.nodeType === Node.TEXT_NODE) {
    range.setStart(last, last.textContent?.length ?? 0);
    range.collapse(true);
  } else {
    range.selectNodeContents(editor);
    range.collapse(false);
  }
  return range;
}

function moveCaretToEnd(editor: HTMLElement) {
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(endRange(editor));
}

const isAir = (node: Node | null) => !!node && (
  (node.nodeType === Node.TEXT_NODE && !readPrompt(node)) ||
  (node instanceof HTMLElement && node.classList.contains("playable-token-space")));

/** The chip a Backspace at `range` would reach, looking past invisible gaps and caret holders. */
function chipBeforeCaret(range: Range, editor: HTMLElement) {
  if (!range.collapsed) return null;
  const { startContainer: container, startOffset: offset } = range;
  // Real characters before the caret in this text node: an ordinary Backspace.
  if (container.nodeType === Node.TEXT_NODE && container.textContent!.slice(0, offset).replace(/\u200B/g, "")) return null;
  let node: Node | null = container.nodeType === Node.TEXT_NODE ? container.previousSibling : container.childNodes[offset - 1] ?? null;
  // Leaving a text run's span from its start continues with the span's previous sibling.
  if (!node && container !== editor && container.parentNode && container.parentNode !== editor && container.parentNode instanceof HTMLElement
    && container.parentNode.classList.contains("playable-prompt-text")) node = container.parentNode.previousSibling;
  while (isAir(node)) node = node!.previousSibling;
  return node instanceof HTMLElement && node.dataset.promptToken ? node : null;
}

/** Remove a chip with the gaps and caret holders around it, so one Backspace deletes one chip. */
function removeChipWithAir(chip: HTMLElement) {
  while (isAir(chip.previousSibling)) chip.previousSibling!.remove();
  while (isAir(chip.nextSibling)) chip.nextSibling!.remove();
  chip.remove();
}

/** Soft keyboard deletes one character at a time; a deleted gap means the user meant the chip before it. */
function collapseChipDeletion(previous: string, next: string) {
  if (next.length >= previous.length || !previous.startsWith(next)) return next;
  if (!/^[\u2009\u200B]+$/.test(previous.slice(next.length))) return next;
  const trimmed = next.replace(/[\u2009\u200B]+$/, "");
  return /[\uFFFC\uE000-\uF8FF]$/.test(trimmed) ? trimmed.slice(0, -1).replace(/[\u2009\u200B]+$/, "") : trimmed;
}

export default function CreationPlayablePage({ isTabActive, onClose }: {
  isTabActive: boolean;
  onClose: () => void;
}) {
  const { topInsetCss, bottomInsetCss, floatingBottomInsetCss, keyboardOpen } = useAppFrame();
  const { open, close, setValue } = useSoftKeyboard();
  const reducedMotion = useReducedMotion();
  const editorRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const valueRef = useRef("");
  const chipCount = useRef(0);
  const nextToken = useRef(0xe100);
  const uploadedImages = useRef<string[]>([]);
  useEffect(() => () => uploadedImages.current.forEach(url => URL.revokeObjectURL(url)), []);
  const initialized = useRef(false);
  const wasActive = useRef(false);
  const returningEntry = useRef(false);
  // Remixing a feed playable (Figma 25696:253215): that playable, as a live cover, takes the bulb's place and the prompt
  // shows a static "Describe your idea" — no typewriter prefill, rotating hints or ideas tooltip.
  const [remixSource, setRemixSource] = useState<PlayableRemixSource | null>(null);
  const touched = useRef(false);
  const [bulbIndex, setBulbIndex] = useState(-1);
  const bulbIndexRef = useRef(-1);
  const ideaGeneration = useRef(0);
  const bulbMotionRef = useRef<ReturnType<typeof animate> | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  // Chips only, no words yet: trail the caret with a hint built from those chips.
  const [hint, setHint] = useState<string | null>(null);
  const syncHint = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const words = readPrompt(editor).replace(/[\s\u200B\uFFFC\uE000-\uE002\uE100-\uF8FF]/g, "");
    setHint(words ? null : chipHint(Array.from(editor.querySelectorAll<HTMLElement>("[data-prompt-token]"))));
  };
  const [panel, setPanel] = useState<"tricks" | "templates" | "images" | null>(null);
  // Set while the Images dock is open to swap the character photo (single pick) rather than insert.
  const [photoSwap, setPhotoSwap] = useState(false);
  // Snapshot of the prompt at Generate time; non-null shows the generating state over the composer.
  const [generating, setGenerating] = useState<Node[] | null>(null);
  // The result preview on top of the chat, showing the game of the turn that opened it (if any).
  const [viewing, setViewing] = useState<{ game?: PlayableGame } | null>(null);
  // The real game behind the generated prompt, when it is a known idea (e.g. Spider-man → feed's rooftops).
  const [generatedGame, setGeneratedGame] = useState<PlayableGame>();
  // The generating prompt as text for the model (chips spelled out), captured with the snapshot.
  const [promptText, setPromptText] = useState("");
  // Prompts sent from the result preview's input; each adds a turn to the generating chat.
  const [followUps, setFollowUps] = useState<PlayableFollowUp[]>([]);
  // A template tapped in the Templates dock, previewed in the result page frame.
  const [templatePreview, setTemplatePreview] = useState<{ src: string; origin: DOMRect } | null>(null);
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const [placeholderText, setPlaceholderText] = useState(PLACEHOLDER_IDEAS[0]);
  // The chip hint shows whenever the prompt is chips-only (keyboard or dock open alike). Toggling this off
  // for one frame after an insert replays its delayed wipe right behind the moved caret.
  const [hintArmed, setHintArmed] = useState(true);
  // "Tap for ideas" tooltip: shows after 3s of no interaction once the composer is ready; any user
  // interaction (tap, key, keyboard input) spends it for this visit. Programmatic focus doesn't count.
  const [guideSpent, setGuideSpent] = useState(false);
  const [guideShown, setGuideShown] = useState(false);
  const trickRef = useRef(0);
  const memeRef = useRef(0);
  // One reserved dock height keeps the composer stable across keyboard/resource tabs.
  const panelHeight = `calc(320px + ${bottomInsetCss})`;
  const [caretMode, setCaretMode] = useState<"hidden" | "end" | "editing">("hidden");
  const bulbRef = useRef<HTMLButtonElement>(null);
  const animationRef = useRef<Array<ReturnType<typeof animate>>>([]);

  const writePrompt = useCallback((value: string, pop = false, force = false, typewrite = false) => {
    const editor = editorRef.current;
    if (!editor) return;
    valueRef.current = value;
    setIsEmpty(!value.trim());
    if (!force && readPrompt(editor) === value) return;
    if (!pop) setCaretMode("editing");
    animationRef.current.forEach(animation => animation.stop());
    animationRef.current = [];
    let revealTime = 0;
    const letters: Array<{ element: HTMLElement; delay: number }> = [];
    const texts: HTMLElement[] = [];
    const chips: Array<{ element: HTMLElement; delay: number }> = [];
    const savedChips = new Map(Array.from(editor.querySelectorAll<HTMLElement>("[data-prompt-token]"))
      .map(chip => [chip.dataset.promptToken!, chip]));
    const parts = value.split(/([\uFFFC\uE000-\uE002\uE100-\uF8FF])/);
    const nodes = parts.flatMap((raw, index) => {
      // Inserted chips sit between thin-space gaps; rebuild those as real gap spans so a rewrite
      // (e.g. the keyboard echoing the value back) keeps the exact 10px / 5px spacing.
      const isText = !SEED_CHIPS[raw] && !savedChips.has(raw);
      const thinLead = isText ? raw.match(/^[\u2009\u200B]*/)![0] : "";
      const thinTrail = isText ? raw.slice(thinLead.length).match(/[\u2009\u200B]*$/)![0] : "";
      const part = raw.slice(thinLead.length, raw.length - thinTrail.length);
      const gaps = (thin: string) => Array.from(thin).filter(c => c === "\u2009").map(() => createGap(IMAGE_GAP, "\u2009"));
      if (isText && !part) return gaps(thinLead + thinTrail);
      if (isText) {
        // Keep real spaces in the serialized prompt, but give the capsule exactly 12px on each side.
        const fragment = document.createElement("span");
        fragment.className = "playable-prompt-text";
        const leadingGap = !!TOKEN_GAPS[parts[index - 1]] && part.startsWith(" ");
        const trailingGap = !!TOKEN_GAPS[parts[index + 1]] && part.endsWith(" ");
        if (leadingGap) fragment.append(createGap(TOKEN_GAPS[parts[index - 1]]));
        const text = part.slice(leadingGap ? 1 : 0, trailingGap ? -1 : undefined);
        if (typewrite && !reducedMotion) {
          for (const character of Array.from(text)) {
            const letter = document.createElement("span");
            letter.className = "playable-typed-letter";
            letter.textContent = character;
            letter.style.opacity = "0";
            fragment.append(letter);
            letters.push({ element: letter, delay: revealTime });
            revealTime += .025;
          }
        } else {
          fragment.append(document.createTextNode(text));
          if (pop && !reducedMotion) { fragment.style.opacity = "0"; texts.push(fragment); }
        }
        if (trailingGap) fragment.append(createGap(TOKEN_GAPS[parts[index + 1]]));
        return [...gaps(thinLead), fragment, ...gaps(thinTrail)];
      }
      const chip = (!force ? savedChips.get(part)?.cloneNode(true) : undefined) as HTMLElement | undefined
        ?? createPromptChip(SEED_CHIPS[part], part === CAMERA_TOKEN ? trickRef.current : memeRef.current, part);
      chips.push({ element: chip, delay: typewrite ? revealTime : TAP_REVEAL.chip });
      if (typewrite) revealTime += .14;
      if (pop && !reducedMotion) chip.style.opacity = "0";
      return chip;
    });
    editor.replaceChildren(...nodes);
    normalizeImageGaps(editor);
    syncHint(); // Keyboard echoes rewrite through here too; re-derive from the new DOM.
    letters.forEach(({ element, delay }) => animationRef.current.push(animate(element, { opacity: 1 }, {
      delay, duration: .001,
    })));
    texts.forEach(element => animationRef.current.push(animate(element, { opacity: 1 }, {
      delay: TAP_REVEAL.text, duration: .16, ease: "easeOut",
    })));
    if (document.activeElement === editor) moveCaretToEnd(editor);
    if (pop && !reducedMotion) {
      chips.forEach(({ element: chip, delay }) => {
        // Keep layout stable; reveal each token only when typing reaches it.
        // Land oversized and shrink into place, so each chip reads as being dropped into the sentence.
        animationRef.current.push(animate(chip, { scale: [1.1, 1], y: 0, opacity: [0, 1] },
          { delay, duration: 0.22, ease: "easeOut" }));
      });
    }
  }, [reducedMotion]);

  const focusEditor = useCallback(() => {
    setPanel(null);
    setPhotoSwap(false);
    editorRef.current?.focus({ preventScroll: true });
    if (window.matchMedia("(min-width: 640px)").matches) {
      open({
        allowPageInteraction: true,
        appearance: "dark",
        initialValue: valueRef.current,
        returnKey: "return",
        autoCapitalize: "none",
        onChange: value => {
          touched.current = true;
          // Our own setValue() echoes back through here; only a real keystroke changes the value.
          if (value !== valueRef.current) setGuideSpent(true);
          const next = collapseChipDeletion(valueRef.current, value);
          writePrompt(next);
          if (next !== value) setValue(next);
        },
        onSubmit: value => setValue(`${value}\n`),
      });
    }
  }, [open, setValue, writePrompt]);

  const applyIdea = useCallback(async (index: number) => {
    const firstPrompt = !initialized.current;
    const generation = ++ideaGeneration.current;
    const idea = index < 0 ? null : PLAYABLE_IDEAS[index];
    bulbIndexRef.current = index;
    setShowPlaceholder(!firstPrompt);
    initialized.current = true;
    touched.current = true;
    if (idea) {
      trickRef.current = idea.trick;
      memeRef.current = idea.meme;
    }
    setCaretMode("hidden");
    const prompt = idea?.prompt ?? "";
    if (firstPrompt) {
      // Entry: wait for the colored bulb to decode so its swap lands on the same frame as the typewriter.
      await Promise.all([
        new Promise<void>(resolve => window.setTimeout(resolve, ENTRY_PAUSE_MS)),
        idea ? decodeImage(idea.bulb) : undefined,
      ]);
      if (generation !== ideaGeneration.current || valueRef.current !== "") return;
    }
    setBulbIndex(index);
    bulbMotionRef.current?.stop();
    if (bulbRef.current && !reducedMotion) {
      bulbMotionRef.current = animate([
        [bulbRef.current, { scale: [0.9, 1.04], y: [3, 0] },
          { duration: firstPrompt ? 0.05 : 0.24, ease: "easeOut" }],
        [bulbRef.current, { scale: 1 },
          { type: "spring", stiffness: 300, damping: 20 }],
      ]);
    }
    setShowPlaceholder(true);
    writePrompt(prompt, true, true, firstPrompt);
    if (window.matchMedia("(min-width: 640px)").matches) setValue(prompt);
    await Promise.all(animationRef.current);
    if (generation !== ideaGeneration.current || valueRef.current !== prompt || !idea) return;
    if (editorRef.current && document.activeElement === editorRef.current) moveCaretToEnd(editorRef.current);
    setCaretMode(current => current === "hidden" ? "end" : current);
  }, [reducedMotion, setValue, writePrompt]);

  // Tab pages can stay mounted while hidden. Reset before the next visible paint.
  useLayoutEffect(() => {
    if (!isTabActive) { wasActive.current = false; return; }
    if (!wasActive.current) {
      // A remix entry behaves like a return visit: empty prompt, keyboard up, no tooltip.
      const remix = takePlayableRemixSource();
      setRemixSource(remix);
      returningEntry.current = hasEnteredPlayable || !!remix;
      hasEnteredPlayable = true;
      wasActive.current = true;
    }
    const returning = returningEntry.current;
    setHintArmed(true);
    setGuideSpent(returning); // return visits never show the tooltip
    setGuideShown(false);
    setBulbIndex(-1);
    setShowPlaceholder(returning);
    bulbIndexRef.current = -1;
    ideaGeneration.current++;
    setIsEmpty(true);
    setHint(null);
    setPanel(null);
    setPhotoSwap(false);
    setGenerating(null);
    setViewing(null);
    setFollowUps([]);
    setTemplatePreview(null);
    trickRef.current = 0;
    memeRef.current = 0;
    // The caret always sits at the prompt's end; only the first-visit typewriter hides it until done.
    setCaretMode(returning ? "end" : "hidden");
    initialized.current = returning;
    touched.current = returning;
    valueRef.current = "";
    editorRef.current?.replaceChildren();
    if (bulbRef.current) bulbRef.current.style.transform = "none";
  }, [isTabActive]);

  useEffect(() => {
    if (!isTabActive) return;
    if (returningEntry.current) {
      // Return visit: empty prompt, keyboard up, caret ready.
      focusEditor();
      setValue("");
    } else {
      focusEditor();
      void applyIdea(0);
    }
    return () => {
      ideaGeneration.current++;
      bulbMotionRef.current?.stop();
      animationRef.current.forEach(animation => animation.stop());
      close();
      editorRef.current?.blur();
    };
  }, [isTabActive, focusEditor, applyIdea, close, setValue]);


  // Decorative placeholder only: never write suggestions into the prompt or keyboard value.
  useEffect(() => {
    // Rotate whenever the bulb is gray and the prompt is empty; opening panels or focusing doesn't restart it.
    if (remixSource) {
      setPlaceholderText(REMIX_PLACEHOLDER);
      return;
    }
    if (!isTabActive || !isEmpty || !showPlaceholder || bulbIndex >= 0 || reducedMotion) {
      setPlaceholderText(PLACEHOLDER_IDEAS[0]);
      return;
    }
    let phrase = 0;
    let length = 0;
    let deleting = false;
    let timer: number;
    setPlaceholderText("");
    const tick = () => {
      const text = PLACEHOLDER_IDEAS[phrase];
      length += deleting ? -1 : 1;
      setPlaceholderText(text.slice(0, length));
      let delay = deleting ? 20 : 45;
      if (!deleting && length === text.length) {
        deleting = true;
        delay = 1800;
      } else if (deleting && length === 0) {
        deleting = false;
        phrase = (phrase + 1) % PLACEHOLDER_IDEAS.length;
        delay = 300;
      }
      timer = window.setTimeout(tick, delay);
    };
    timer = window.setTimeout(tick, 45);
    return () => window.clearTimeout(timer);
  }, [isTabActive, isEmpty, showPlaceholder, reducedMotion, bulbIndex, remixSource]);


  // Draw the same 3×28 caret during both prefill and editing. Native carets
  // inherit line-box height and cannot preserve the design's width/height.
  useLayoutEffect(() => {
    const editor = editorRef.current;
    const caret = caretRef.current;
    if (!editor || !caret) return;
    let frame = 0;
    const update = () => {
      const selection = window.getSelection();
      caret.hidden = true;
      if (caretMode === "hidden") return;
      // Focused: follow the live selection. Unfocused (keyboard down / a dock open): keep showing it at the end.
      const focused = document.activeElement === editor && !!selection?.rangeCount && selection.isCollapsed
        && editor.contains(selection.anchorNode);
      const range = focused ? selection!.getRangeAt(0).cloneRange() : endRange(editor);
      let rect = range.getBoundingClientRect();
      let useRight = false;
      if (!rect.height && range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset > 0) {
        range.setStart(range.startContainer, range.startOffset - 1);
        rect = range.getBoundingClientRect();
        useRight = true;
      } else if (!rect.height && range.startContainer === editor && range.startOffset > 0) {
        // After a chip/gap: x from the preceding node's right edge, row from the nearest visible node.
        const nodes = Array.from(editor.childNodes).slice(0, range.startOffset);
        const measure = (node: Node) => { const r = document.createRange(); r.selectNode(node); return r.getBoundingClientRect(); };
        const right = measure(nodes[nodes.length - 1]).right;
        const row = nodes.reverse().map(measure).find(r => r.height);
        if (row) { rect = new DOMRect(right, row.top, 0, row.height); useRight = true; }
      }
      const card = editor.parentElement!;
      const cardRect = card.getBoundingClientRect();
      const scaleX = cardRect.width / card.offsetWidth || 1;
      const scaleY = cardRect.height / card.offsetHeight || 1;
      const editorRect = editor.getBoundingClientRect();
      const style = getComputedStyle(editor);
      const x = rect.height ? ((useRight ? rect.right : rect.left) - cardRect.left) / scaleX
        : (editorRect.left - cardRect.left) / scaleX + parseFloat(style.paddingLeft);
      const y = rect.height ? (rect.top + rect.height / 2 - cardRect.top) / scaleY - 14
        : (editorRect.top - cardRect.top) / scaleY + parseFloat(style.paddingTop) + parseFloat(style.lineHeight) / 2 - 14;
      if (y < (editorRect.top - cardRect.top) / scaleY || y + 28 > (editorRect.bottom - cardRect.top) / scaleY) return;
      caret.style.left = `${x}px`;
      caret.style.top = `${y}px`;
      caret.hidden = false;
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    update();
    document.addEventListener("selectionchange", schedule);
    editor.addEventListener("input", schedule);
    editor.addEventListener("scroll", schedule);
    editor.addEventListener("focus", schedule);
    editor.addEventListener("blur", schedule);
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(editor);
    // Chips inserted from a dock change the end without focus or input events.
    const mutations = new MutationObserver(schedule);
    mutations.observe(editor, { childList: true, subtree: true, characterData: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      mutations.disconnect();
      document.removeEventListener("selectionchange", schedule);
      editor.removeEventListener("input", schedule);
      editor.removeEventListener("scroll", schedule);
      editor.removeEventListener("focus", schedule);
      editor.removeEventListener("blur", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [caretMode, isTabActive]);

  const feedback = (target: HTMLElement | null) => {
    if (!target || reducedMotion) return;
    animationRef.current.push(animate([
      [target, { scale: [0.9, 1.04], y: 0 }, { duration: 0.14, ease: "easeOut" }],
      [target, { scale: 1 }, { type: "spring", stiffness: 438.65, damping: 20 }],
    ]));
  };

  const insertResources = (chips: HTMLElement[], keepPanel = false) => {
    const editor = editorRef.current;
    if (!editor) return;
    ideaGeneration.current++;
    animationRef.current.forEach(animation => animation.stop());
    editor.querySelectorAll<HTMLElement>(".playable-typed-letter, .playable-prompt-text, [data-prompt-token]").forEach(el => { el.style.opacity = "1"; });
    // The caret lives at the end of the prompt, so new chips always append there.
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    range.deleteContents();
    const fragment = document.createDocumentFragment();
    chips.forEach(chip => {
      fragment.append(createGap(IMAGE_GAP, "\u2009"), chip, createGap(IMAGE_GAP, "\u2009"));
    });
    const tail = fragment.lastChild!;
    range.insertNode(fragment);
    const holder = caretHolderAfter(tail);
    range.setStart(holder, holder.textContent === "\u200B" ? 1 : 0);  // after the ZWSP, else before existing text
    range.collapse(true);
    valueRef.current = readPrompt(editor);
    setIsEmpty(false);
    syncHint();
    touched.current = true;
    initialized.current = true;
    if (!keepPanel) {
      focusEditor();
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    }
    setCaretMode("editing");
    setValue(valueRef.current);
    normalizeImageGaps(editor);
    chipCount.current = editor.querySelectorAll("[data-prompt-token]").length;
    setHintArmed(false);
    window.setTimeout(() => setHintArmed(true), 16);
    chips.at(-1)?.scrollIntoView({ block: "nearest" });
  };

  const insertTrick = (index: number) => insertResources([
    createPromptChip("addon", index, String.fromCharCode(nextToken.current++)),
  ]);
  const insertMeme = (index: number) => insertResources([
    createPromptChip("meme", index, String.fromCharCode(nextToken.current++)),
  ]);
  const insertImages = (sources: string[]) => {
    const chips = sources.map(src => {
      if (src.startsWith("blob:")) uploadedImages.current.push(src);
      const chip = document.createElement("span");
      chip.contentEditable = "false";
      chip.className = "playable-duck-token";
      chip.dataset.promptToken = String.fromCharCode(nextToken.current++);
      chip.dataset.kind = "image";
      chip.dataset.src = src;
      chip.setAttribute("aria-label", "Attached image");
      const image = document.createElement("img");
      image.src = src;
      image.alt = "Attached image";
      image.draggable = false;
      image.dataset.electronSmoothCorner = "";
      chip.append(image);
      return chip;
    });
    insertResources(chips, true);
  };
  const photoChip = () => editorRef.current?.querySelector<HTMLElement>('[data-kind="photo"]') ?? null;
  /** Swap the character photo in place; null restores the seeded photo. */
  const swapPhoto = (src: string | null) => {
    const chip = photoChip();
    const image = chip?.querySelector<HTMLImageElement>(".playable-photo-image");
    if (!chip || !image) return;
    if (src?.startsWith("blob:")) uploadedImages.current.push(src);
    image.src = src ?? CHARACTER_PHOTO;
    if (src) chip.dataset.src = src; else delete chip.dataset.src;
    feedback(chip);
  };
  const imageChips = () => Array.from(editorRef.current?.querySelectorAll<HTMLElement>('[data-kind="image"]') ?? []);
  const removeImage = (src: string) => {
    const editor = editorRef.current;
    const chip = imageChips().find(element => element.dataset.src === src);
    if (!editor || !chip) return;
    // Drop the gaps insertResources placed around the chip as well.
    [chip.previousSibling, chip.nextSibling].forEach(node => {
      if (node instanceof HTMLElement && node.classList.contains("playable-token-space")) node.remove();
    });
    chip.remove();
    normalizeImageGaps(editor);
    if (document.activeElement === editor) moveCaretToEnd(editor);
    valueRef.current = readPrompt(editor);
    setIsEmpty(!valueRef.current.trim());
    syncHint();
    setValue(valueRef.current);
  };

  const activateToken = (target: HTMLElement) => {
    const chip = target.closest<HTMLElement>("[data-prompt-token]");
    if (!chip || chip.dataset.kind === "image") return;
    if (chip.dataset.kind === "photo") {
      touched.current = true;
      close();
      editorRef.current?.blur();
      setPhotoSwap(true);
      setPanel("images");
      return;
    }
    if (chip.dataset.kind === "count") {
      const step = Number(target.closest<HTMLElement>("[data-step]")?.dataset.step ?? 0);
      const value = chip.querySelector<HTMLElement>(".playable-count-value")!;
      const next = Math.min(REPLY_COUNT.max, Math.max(REPLY_COUNT.min, Number(value.textContent) + step));
      if (next === Number(value.textContent)) return;
      value.textContent = String(next);
      feedback(value);
      return;
    }
    const kind = chip.dataset.kind === "addon" ? "addon" : "meme";
    const current = Number(chip.dataset.index ?? 0);
    let index = (current + 1) % PLAYABLE_MEMES.length;
    if (kind === "addon") {
      const cycle: readonly number[] = PLAYABLE_TRICK_CYCLES.find(group => (group as readonly number[]).includes(current)) ?? PLAYABLE_TRICK_CYCLES[0];
      index = cycle[(cycle.indexOf(current) + 1) % cycle.length];
    }
    const replacement = createPromptChip(kind, index, chip.dataset.promptToken!);
    chip.replaceWith(replacement);
    syncHint();
    feedback(replacement);
  };

  const syncInput = () => {
    const editor = editorRef.current!;
    normalizeImageGaps(editor);
    // Deleting a chip re-anchors the caret after the last content.
    const chips = editor.querySelectorAll("[data-prompt-token]").length;
    if (chips < chipCount.current) moveCaretToEnd(editor);
    chipCount.current = chips;
    setCaretMode("editing");
    touched.current = true;
    const value = readPrompt(editorRef.current!);
    setIsEmpty(!value.trim());
    syncHint();
    valueRef.current = value;
    if (keyboardOpen) setValue(value);
  };

  const nextIdea = () => {
    // Content-only action: do not focus/blur, open/close the keyboard, or change panels.
    // Pointer default prevention below preserves the existing editing session.
    void applyIdea(bulbIndexRef.current >= PLAYABLE_IDEAS.length - 1 ? -1 : bulbIndexRef.current + 1);
  };

  // Ready = the first-visit typewriter has finished (caret shows) or a return visit has loaded.
  const composerReady = isTabActive && caretMode !== "hidden" && !generating;
  useEffect(() => {
    if (!composerReady || guideSpent) return;
    const timer = window.setTimeout(() => setGuideShown(true), GUIDE_IDLE_MS);
    return () => window.clearTimeout(timer);
  }, [composerReady, guideSpent]);
  const guideVisible = guideShown && !guideSpent;

  return (
    <div className="playable-page" style={{ paddingTop: topInsetCss }} data-name="Playable Composer"
      onPointerDownCapture={() => setGuideSpent(true)} onKeyDownCapture={() => setGuideSpent(true)}>
      <img className="playable-backdrop" src="/resource/playable/composer-bg.png" alt="" aria-hidden="true" draggable={false} />
      <div className="playable-title-bar"><TUXNavBar heightPreset={44} backgroundColor="transparent" showSeparator={false} zIndex={1}
        title="PLAYABLE" titleAlign="center"
        leading={<AppNavBarCloseButton iconColor={getColorCSSVar("UIText1")} onClose={() => { close(); onClose(); }} />} /></div>
      <div className="playable-workspace" data-softkb-keep-open
        style={{ marginBottom: panel || keyboardOpen ? panelHeight : floatingBottomInsetCss }}>
        <div className="playable-card" data-electron-smooth-corner>
          <div ref={editorRef} className="playable-editor" data-empty={isEmpty && showPlaceholder} data-chip-hint={(hintArmed && hint) || undefined} data-placeholder={placeholderText} aria-placeholder="Describe your idea..." data-caret={caretMode} contentEditable suppressContentEditableWarning
            role="textbox" aria-label="Describe your playable" aria-multiline="true" spellCheck={false}
            onFocus={event => { if (event.target === event.currentTarget) focusEditor(); }}
            onInput={syncInput}
            onPointerDown={event => {
              if ((event.target as HTMLElement).closest("[data-prompt-token]")) {
                event.preventDefault();
                return;
              }
              if (event.button === 0) {
                // The caret always stays after the last content, not where the tap landed.
                event.preventDefault();
                if (document.activeElement !== event.currentTarget) focusEditor();
                moveCaretToEnd(event.currentTarget);
                setCaretMode("editing");
                return;
              }
              if (initialized.current || touched.current) setCaretMode("editing");
            }}
            onClick={event => activateToken(event.target as HTMLElement)}
            onKeyDown={event => {
              const target = event.target as HTMLElement;
              if (target.matches(".playable-duck-token") && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault(); activateToken(target); return;
              }
              if (target.closest("[data-prompt-token]")) return;
              if (event.key === "Backspace") {
                const selection = window.getSelection();
                const chip = selection?.rangeCount ? chipBeforeCaret(selection.getRangeAt(0), event.currentTarget) : null;
                if (chip) {
                  event.preventDefault();
                  removeChipWithAir(chip);
                  syncInput();
                  moveCaretToEnd(event.currentTarget);
                  return;
                }
              }
              if (initialized.current) setCaretMode("editing"); if (event.key === "Escape") { close(); event.currentTarget.blur(); } }}
            onPaste={event => {
              event.preventDefault();
              const text = event.clipboardData.getData("text/plain");
              const selection = window.getSelection();
              if (!selection?.rangeCount) return;
              const range = selection.getRangeAt(0);
              range.deleteContents();
              const node = document.createTextNode(text);
              range.insertNode(node);
              range.setStartAfter(node);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
              syncInput();
            }} />
          <span ref={caretRef} className="playable-caret" aria-hidden="true" hidden />
          <div className="playable-actions" onMouseDown={event => event.preventDefault()} onPointerDown={event => event.preventDefault()}>
            {remixSource ? (
              <span className="playable-remix-chip">
                <span className="playable-remix-chip-tile" data-electron-smooth-corner aria-label={`Remixing ${remixSource.title}`}>
                  <PlayableGameFrame src={remixSource.src} title={remixSource.title} active={false} />
                </span>
                <img className="playable-remix-chip-clip" src="/resource/playable-feed/remix/paperclip.svg" alt="" aria-hidden="true" />
                <button type="button" className="playable-remix-chip-close" aria-label="Remove remix" onClick={() => setRemixSource(null)}>
                  <TUXIconXMarkSmall size={16} />
                </button>
              </span>
            ) : <span className="playable-bulb-anchor">
            {guideVisible && <div className="playable-idea-tooltip" role="tooltip">
              Tap for ideas
              <svg className="playable-idea-tooltip-arrow" width="21" height="8" viewBox="0 0 21 8" aria-hidden="true">
                <path d="M10.5 8C7.81482 8 5.86733 0 0 0H21C15.1327 0 13.1852 8 10.5 8Z" />
              </svg>
            </div>}
            <button ref={bulbRef} type="button" className="playable-bulb"
              aria-label={`Next idea — ${bulbIndex < 0 ? "Gray" : PLAYABLE_IDEAS[bulbIndex].color} bulb`}
              data-softkb-keep-open
              onPointerDown={event => {
                if (event.button !== 0) return;
                event.preventDefault();
                event.stopPropagation();
                nextIdea();
              }}
              onTouchEnd={event => event.preventDefault()}
              onClick={event => { if (event.detail === 0) nextIdea(); }}>
              <img src={bulbIndex < 0 ? EMPTY_BULB : PLAYABLE_IDEAS[bulbIndex].bulb} alt="" draggable={false} />
            </button>
            </span>}
            <div className="playable-actions-right">
              <button type="button" className="playable-mention" aria-label="Insert mention"
                onClick={() => { focusEditor(); writePrompt(`${valueRef.current}@`); if (window.matchMedia("(min-width: 640px)").matches) setValue(valueRef.current); }}>
                <img src="/resource/playable/at.svg" alt="" />
              </button>
              <button type="button" className="playable-generate" aria-label="Generate playable" disabled={isEmpty}
                onClick={() => {
                  close();
                  editorRef.current?.blur();
                  setPanel(null);
                  setFollowUps([]);
                  setGeneratedGame(editorRef.current ? ideaGame(readPrompt(editorRef.current)) : undefined);
                  const nodes = Array.from(editorRef.current?.childNodes ?? [], node => node.cloneNode(true));
                  setPromptText(describePrompt(nodes));
                  setGenerating(nodes);
                }}>
                <img src="/resource/playable/generate.svg" alt="" />
              </button>
            </div>
          </div>
        </div>
        <div className="playable-tools" aria-label="Prompt resources">
          {(["images", "tricks", "templates"] as const).map(kind => (
            <button key={kind} type="button" aria-expanded={panel === kind} className={panel === kind ? "is-active" : ""}
              onPointerDown={event => event.preventDefault()} onClick={() => {
                if (panel === kind) { focusEditor(); return; }
                touched.current = true;
                close();
                editorRef.current?.blur();
                setPhotoSwap(false);
                setPanel(kind);
              }}>
              <img src={{ images: "/resource/playable/images.svg", tricks: "/resource/playable/tricks.svg", templates: "/resource/playable/templates.svg" }[kind]} alt="" />
              {kind[0].toUpperCase() + kind.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {panel === "tricks" && <PlayableTricksPanel bottomInset={bottomInsetCss}
        onTrick={insertTrick} onMeme={insertMeme} onClose={focusEditor} />}
      {(panel === "templates" || panel === "images") && <PlayableMediaPanel key={`${panel}-${photoSwap}`} kind={panel} bottomInset={bottomInsetCss} onClose={focusEditor}
        {...(photoSwap && panel === "images"
          ? { onAddImages: ([src]: string[]) => swapPhoto(src), onRemoveImage: () => swapPhoto(null),
            insertedImages: () => (photoChip()?.dataset.src ? [photoChip()!.dataset.src!] : []), maxPicks: 1 }
          : { onAddImages: insertImages, onRemoveImage: removeImage,
            insertedImages: () => imageChips().map(chip => chip.dataset.src!) })}
        onOpenTemplate={(src, origin) => { close(); setTemplatePreview({ src, origin }); }} />}
      {generating && <PlayableGeneratingView prompt={generating} promptText={promptText} demoGame={generatedGame} followUps={followUps} topInset={topInsetCss} bottomInset={bottomInsetCss}
        onBack={() => setGenerating(null)} onStop={() => setGenerating(null)} onView={game => setViewing({ game })} />}
      {generating && viewing && <PlayableResultView game={viewing.game} topInset={topInsetCss} bottomInset={bottomInsetCss}
        onBack={() => setViewing(null)}
        onSend={text => { setViewing(null); setFollowUps(list => [...list, { text, base: viewing.game, demo: followUpGame(viewing.game, text) }]); }} />}
      {templatePreview && <PlayableResultView key={templatePreview.src} image={templatePreview.src} origin={templatePreview.origin} topInset={topInsetCss}
        bottomInset={bottomInsetCss} onBack={() => setTemplatePreview(null)} />}
    </div>
  );
}
