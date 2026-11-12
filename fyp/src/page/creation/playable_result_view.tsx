/**
 * Result preview (Figma 25205:313324). Tapping an edit tool raises its sheet
 * (playable_result_panels.tsx) and the card shrinks into the space above it.
 * Tapping "Describe your idea" enters LUI typing (playable_lui_input.tsx): the toolbar gives way to the
 * keyboard and the card scales down, same aspect, to stay 16px above the growing input box.
 * The card plays the generated game when there is one (playable_game_frame.tsx), else shows demo art.
 */
import { getColorCSSVar } from "@byted-tiktok/tux-web";
import { TUXIconChevronRightFillLTR } from "@byted-tiktok/tux-icons";
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AppNavBarBackButton } from "../../components/sys/app_nav_bar_back_button";
import { PlayableGameFrame } from "./playable_game_frame";
import type { PlayableGame } from "./playable_generating_view";
import { PlayableLuiInput } from "./playable_lui_input";
import { PlayablePostView } from "./playable_post_view";
import { DEFAULT_TWEAKS, ResultToolSheet, TOOL_META, tweakMultipliers, type GameTweaks, type ResultTool } from "./playable_result_panels";
import "./playable_result.css";

const DEMO_PREVIEW = "/resource/playable/result/game-preview.jpg";
/** Full preview: 358×549 sitting 20px under the nav. */
const PREVIEW_CARD = { width: 358, height: 549, marginTop: 20, borderRadius: 36 };
/** Editing: card top 16px under the status bar (y=63), bottom always 16px above the sheet; same aspect. */
const EDIT = { gap: 16, nav: 44, sheet: 52 + 276, borderRadius: 28 };
const SPRING = { type: "spring", stiffness: 380, damping: 38 } as const;
/** Zoom from a template tile: card springs out of the tile while the page fades in behind it. */
const ZOOM = { type: "spring", stiffness: 300, damping: 34 } as const;
const TILE_RADIUS = 28;
/** Typing: card top 16px under the status bar, bottom 16px above the input box (its dock pads 12px). */
const TYPING = { top: EDIT.gap - EDIT.nav, bottom: EDIT.gap - 12, borderRadius: EDIT.borderRadius };
/** Soft keyboard reserve, matching the composer's dock (320px + bottom inset, which the section already pads). */
const KEYBOARD_HEIGHT = 320;
const KEYBOARD_SLIDE = { duration: 0.28, ease: [0.22, 1, 0.36, 1] } as const;
const TOOLS = Object.keys(TOOL_META) as ResultTool[];

export function PlayableResultView({ topInset, bottomInset, onBack, onSend, image = DEMO_PREVIEW, game, origin }: {
  topInset: string; bottomInset: string; onBack: () => void;
  /** Sends a follow-up prompt to the chat; without it the input stays a static placeholder (templates). */
  onSend?: (text: string) => void;
  /** Card art: the generated result (demo) or a template's gif. */
  image?: string;
  /** A real generated game: the card becomes the playable itself. */
  game?: PlayableGame;
  /** Viewport rect of the tapped template tile: the card zooms out of it and back into it on Back. */
  origin?: DOMRect;
}) {
  const reducedMotion = useReducedMotion();
  const [tool, setTool] = useState<ResultTool | null>(null);
  // Modify previews on the live game; ✓ keeps it, closing any other way snaps back to the applied values.
  const [appliedTweaks, setAppliedTweaks] = useState<GameTweaks>(DEFAULT_TWEAKS);
  const [liveTweaks, setLiveTweaks] = useState<GameTweaks>(DEFAULT_TWEAKS);
  useEffect(() => { if (!tool) setLiveTweaks(appliedTweaks); }, [tool, appliedTweaks]);
  const sectionRef = useRef<HTMLElement>(null);
  const [editCard, setEditCard] = useState({ width: 285, height: 437, marginTop: EDIT.gap - EDIT.nav, borderRadius: EDIT.borderRadius });
  // Size the editing card from the live frame so the 16px gap to the sheet holds on any screen height.
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const measure = () => {
      const style = getComputedStyle(section);
      const top = parseFloat(style.paddingTop), bottom = parseFloat(style.paddingBottom);
      const sheetTop = section.clientHeight - EDIT.sheet - bottom;
      const height = Math.max(0, sheetTop - EDIT.gap - (top + EDIT.gap));
      setEditCard({ height, width: height * PREVIEW_CARD.width / PREVIEW_CARD.height, marginTop: EDIT.gap - EDIT.nav, borderRadius: EDIT.borderRadius });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(section);
    return () => observer.disconnect();
  }, []);
  const transition = reducedMotion ? { duration: 0 } : SPRING;

  const [typing, setTyping] = useState(false);
  const [posting, setPosting] = useState(false);
  // Reserve room only for the frame's soft keyboard; a phone's own keyboard resizes the viewport instead.
  const reserveKeyboard = typing && window.matchMedia("(min-width: 640px)").matches;
  const reserveRef = useRef(reserveKeyboard);
  reserveRef.current = reserveKeyboard;
  const stageRef = useRef<HTMLDivElement>(null);
  const keyboardRef = useRef<HTMLDivElement>(null);
  const [typingCard, setTypingCard] = useState(editCard);
  // The card is sized for the stage it will have once the keyboard is fully up (stage + reserve stays
  // constant while it slides), so it shrinks in one move alongside the keyboard instead of chasing it.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const pending = reserveRef.current ? KEYBOARD_HEIGHT - (keyboardRef.current?.offsetHeight ?? 0) : 0;
      const height = Math.max(0, stage.clientHeight - pending - TYPING.top - TYPING.bottom);
      setTypingCard({ height, width: height * PREVIEW_CARD.width / PREVIEW_CARD.height, marginTop: TYPING.top, borderRadius: TYPING.borderRadius });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [reserveKeyboard]);
  const startTyping = (next: boolean) => {
    if (next) setTool(null);
    setTyping(next);
  };

  const zoomRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const chromeRefs = useRef<HTMLElement[]>([]);
  const chrome = (element: HTMLElement | null) => { if (element && !chromeRefs.current.includes(element)) chromeRefs.current.push(element); };
  const zooming = !!origin && !reducedMotion;

  /** Transform + clip that make the full-size card look exactly like the tile it came from. */
  const tilePose = () => {
    const section = sectionRef.current!, zoom = zoomRef.current!;
    zoom.style.transform = "none";
    zoom.style.clipPath = "none";
    const frameScale = section.getBoundingClientRect().width / section.offsetWidth || 1;
    const card = zoom.getBoundingClientRect();
    const scale = origin!.width / card.width;
    const localHeight = card.height / frameScale;
    const clipY = Math.max(0, (localHeight - origin!.height / (scale * frameScale)) / 2);
    return {
      x: (origin!.left - card.left) / frameScale,
      y: (origin!.top - card.top) / frameScale - clipY * scale,
      scale,
      clipPath: `inset(${clipY}px 0px ${clipY}px 0px round ${TILE_RADIUS / scale}px)`,
    };
  };

  useLayoutEffect(() => {
    if (!zooming) return;
    const zoom = zoomRef.current!, pose = tilePose();
    // Pin the start pose before the first paint, then spring to rest.
    zoom.style.transformOrigin = "0 0";
    zoom.style.transform = `translate(${pose.x}px, ${pose.y}px) scale(${pose.scale})`;
    zoom.style.clipPath = pose.clipPath;
    backdropRef.current!.style.opacity = "0";
    chromeRefs.current.forEach(element => { element.style.opacity = "0"; });
    const controls = [
      animate(zoom, { x: [pose.x, 0], y: [pose.y, 0], scale: [pose.scale, 1], clipPath: [pose.clipPath, `inset(0px 0px 0px 0px round ${PREVIEW_CARD.borderRadius}px)`] }, ZOOM),
      animate(backdropRef.current!, { opacity: [0, 1] }, { duration: 0.28, ease: "easeOut" }),
      ...chromeRefs.current.map(element => animate(element, { opacity: [0, 1], y: [8, 0] }, { duration: 0.24, delay: 0.14, ease: "easeOut" })),
    ];
    // Hand the corners back to the card itself (it reshapes when a tool sheet opens).
    controls[0].then(() => { zoom.style.clipPath = "none"; });
    return () => controls.forEach(control => control.stop());
    // Runs once on mount; `origin` is fixed for this view instance (keyed by template).
  }, []);

  const cover = (active: boolean) => game
    ? <PlayableGameFrame src={game.src} title={game.title} active={active} tweaks={active ? tweakMultipliers(liveTweaks) : undefined} />
    : <img src={image} alt="Playable preview" draggable={false} />;

  const leave = () => {
    if (!zooming) { onBack(); return; }
    setTool(null);
    const zoom = zoomRef.current!, pose = tilePose();
    zoom.style.transform = "none";
    zoom.style.clipPath = `inset(0px 0px 0px 0px round ${PREVIEW_CARD.borderRadius}px)`;
    chromeRefs.current.forEach(element => animate(element, { opacity: 0 }, { duration: 0.14 }));
    animate(backdropRef.current!, { opacity: 0 }, { duration: 0.26, ease: "easeIn" });
    animate(zoom, { x: [0, pose.x], y: [0, pose.y], scale: [1, pose.scale], clipPath: [zoom.style.clipPath, pose.clipPath] }, ZOOM)
      .then(onBack);
  };
  return (
    <section ref={sectionRef} className="playable-result" aria-label="Playable preview" data-zooming={zooming || undefined}
      style={{ paddingTop: topInset, paddingBottom: bottomInset }}>
      <div ref={backdropRef} className="playable-result-backdrop" aria-hidden="true" />
      <div ref={chrome} className="playable-result-nav">
        <AppNavBarBackButton iconColor={getColorCSSVar("UIText1")} onBack={leave} />
      </div>
      <div ref={stageRef} className="playable-result-stage">
        <div ref={zoomRef} className="playable-result-zoom">
          <motion.div className="playable-result-card" data-electron-smooth-corner
            initial={false} animate={tool ? editCard : typing ? typingCard : PREVIEW_CARD}
            transition={typing && !reducedMotion ? KEYBOARD_SLIDE : transition}>
            {cover(true)}
          </motion.div>
        </div>
      </div>
      {onSend
        ? <PlayableLuiInput typing={typing} onTypingChange={startTyping} onSend={onSend} />
        : <div ref={chrome} className="playable-result-input" data-electron-smooth-corner>Describe your idea...</div>}
      <AnimatePresence initial={false}>
        {reserveKeyboard && (
          <motion.div key="keyboard" ref={keyboardRef} className="playable-result-keyboard" aria-hidden="true"
            initial={{ height: 0 }} animate={{ height: KEYBOARD_HEIGHT }} exit={{ height: 0 }}
            transition={reducedMotion ? { duration: 0 } : KEYBOARD_SLIDE} />
        )}
      </AnimatePresence>
      <div ref={chrome} className="playable-result-toolbar" hidden={typing}>
        <div className="playable-result-tools">
          {TOOLS.map(key => (
            <button key={key} type="button" className="playable-result-tool" onClick={() => setTool(key)}>
              <span className="playable-result-tool-icon">
                {TOOL_META[key].icon(28)}
                {TOOL_META[key].badge !== undefined && <span className="playable-result-badge">{TOOL_META[key].badge}</span>}
              </span>
              {TOOL_META[key].label}
            </button>
          ))}
        </div>
        <button type="button" className="playable-result-next" aria-label="Next" onClick={() => setPosting(true)}><TUXIconChevronRightFillLTR size={24} /></button>
      </div>
      <AnimatePresence>
        {tool && (
          <motion.div key="sheet" className="playable-tool-sheet" data-electron-smooth-corner style={{ paddingBottom: bottomInset }}
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={transition}>
            <ResultToolSheet key={tool} tool={tool} tweaks={appliedTweaks} onPreview={setLiveTweaks}
              onApply={() => { setAppliedTweaks(liveTweaks); setTool(null); }} onCancel={() => setTool(null)} />
          </motion.div>
        )}
      </AnimatePresence>
      {posting && <PlayablePostView cover={cover(false)} topInset={topInset} bottomInset={bottomInset} onBack={() => setPosting(false)} />}
    </section>
  );
}
