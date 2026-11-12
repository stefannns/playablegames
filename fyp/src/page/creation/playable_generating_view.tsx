/**
 * Generating state (Figma 18824:62546) → ready state at 100% (Figma 18186:275819).
 * The submitted prompt stays as a chat bubble; the progress card becomes the result card with a
 * View button, the notice leaves and Stop becomes a (disabled) Send. Overlays the composer, which
 * stays mounted so Back / Stop return to the exact prompt.
 * Prompts sent from the result preview append follow-up turns (Figma 18196:279313): text bubble,
 * "Generating in drafts...", and their own progress card that turns into the edited result.
 * Each turn runs a generation job (playable_generation.ts): live Claude output in local demos, else the timed demo.
 */
import { TUXNavBar, getColorCSSVar } from "@byted-tiktok/tux-web";
import { TUXIconAt, TUXIconChevronRightFillLTR, TUXIconImagePlus, TUXIconPaperplaneFill, TUXIconStopFill } from "@byted-tiktok/tux-icons";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLayoutEffect, useRef, useState } from "react";
import { AppNavBarBackButton } from "../../components/sys/app_nav_bar_back_button";
import { PlayableGameFrame } from "./playable_game_frame";
import { PlayableGeneratingCard } from "./playable_generating_card";
import { MentionText } from "./playable_lui_input";
import { useGeneratedPlayable, type GeneratedPlayable } from "./playable_generation";
import "./playable_generating.css";

/** Demo result until real generation is wired in. */
const RESULT = { image: "/resource/playable/result/spider-card.jpg", message: "🕷️ Ready to be the spider-man?" };
/** Placeholder art for a follow-up turn's result. */
const FOLLOW_UP_IMAGE = "/resource/playable/result/game-preview.jpg";
/** A follow-up turn enters in reading order: bubble, then the line, then its card. */
const TURN_STAGGER_S = 0.18;
/** Completion: the old line fades out first, then the new one wipes in left → right as the result card appears. */
const MESSAGE_OUT = { opacity: 0, transition: { duration: 0.2 } };
const MESSAGE_WIPE = { initial: { clipPath: "inset(0 100% 0 0)" }, animate: { clipPath: "inset(0 0% 0 0)" }, transition: { duration: 0.5, ease: "easeOut" } } as const;
/** The "you can leave" notice rises in after the user has watched the card for a moment. */
const NOTICE_DELAY_S = 2;
/** Bubble text is 16px vs the composer's 24px: capsule air 12→4px, image air 10→6px (Figma 25182:298323). */
const BUBBLE_GAPS: Record<string, number> = { 12: 4, 10: 6 };

/** A generated playable: its real game when one exists, else demo art. */
export type PlayableGame = { src: string; title: string };

/**
 * A prompt sent from the result preview. `base` is the game it edits (edited live when that game was
 * generated live, so it carries its HTML); `demo` is what the timed demo resolves to otherwise.
 */
export type PlayableFollowUp = { text: string; base?: GeneratedPlayable; demo?: PlayableGame };

/** Error line with a retry, in place of the generating message. */
function GenerationError({ onRetry }: { onRetry: () => void }) {
  return (
    <button type="button" className="playable-generating-message playable-generating-retry" onClick={onRetry}>
      ⚠️ Couldn’t build this one. Tap to try again.
    </button>
  );
}

function ReadyCard({ image, game, onView }: { image: string; game?: PlayableGame; onView: () => void }) {
  return (
    <div className="playable-result-ready">
      <button type="button" className="playable-result-ready-card" data-electron-smooth-corner aria-label="Open playable" onClick={onView}>
        {game ? <PlayableGameFrame src={game.src} title={game.title} active={false} /> : <img src={image} alt="" draggable={false} />}
      </button>
      <button type="button" className="playable-result-view" onClick={onView}>
        View<TUXIconChevronRightFillLTR size={16} />
      </button>
    </div>
  );
}

function FollowUpTurn({ text, base, demo, onView }: PlayableFollowUp & { onView: (game?: PlayableGame) => void }) {
  const reducedMotion = useReducedMotion();
  const { progress, game, error, retry } = useGeneratedPlayable({ prompt: text, previous: base, demo, live: Boolean(base?.html) });
  const enter = (index: number) => reducedMotion ? {} : {
    initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 },
    transition: { delay: index * TURN_STAGGER_S, duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  } as const;
  return (
    <div className="playable-followup">
      <motion.div className="playable-generating-bubble-row" {...enter(0)}>
        <div className="playable-generating-bubble playable-generating-bubble-text" data-electron-smooth-corner><MentionText text={text} /></div>
      </motion.div>
      <motion.div {...enter(1)}>
        {error ? <GenerationError onRetry={retry} /> : <p className="playable-generating-message">✨ Generating in drafts...</p>}
      </motion.div>
      <motion.div className="playable-generating-card-row" {...enter(2)}>
        {progress >= 100 ? <ReadyCard image={FOLLOW_UP_IMAGE} game={game} onView={() => onView(game)} /> : <PlayableGeneratingCard progress={progress} />}
      </motion.div>
    </div>
  );
}

export function PlayableGeneratingView({ prompt, promptText, demoGame, followUps, topInset, bottomInset, onBack, onStop, onView }: {
  /** Deep clones of the composer's nodes at the moment Generate was tapped. */
  prompt: Node[];
  /** The prompt as text for the model (chips spelled out). */
  promptText: string;
  /** A curated demo game for this prompt (e.g. the Spider-man idea): shown via the timed demo instead of generating. */
  demoGame?: PlayableGame;
  /** Prompts sent later from the result preview, oldest first. */
  followUps: PlayableFollowUp[];
  topInset: string;
  bottomInset: string;
  onBack: () => void;
  onStop: () => void;
  /** Opens the result preview from the ready card or its View button. */
  onView: (game?: PlayableGame) => void;
}) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { progress, game, error, retry } = useGeneratedPlayable({ prompt: promptText, demo: demoGame, live: !demoGame });
  const ready = progress >= 100;
  // Flips once the "Generating…" line has finished leaving, so text and card change together.
  const [revealed, setRevealed] = useState(false);

  useLayoutEffect(() => {
    const bubble = bubbleRef.current;
    if (!bubble) return;
    bubble.replaceChildren(...prompt.map(node => node.cloneNode(true)));
    // Freeze the snapshot: finish any mid-flight reveal and drop editing affordances.
    bubble.querySelectorAll<HTMLElement>("*").forEach(element => {
      element.style.opacity = "";
      element.style.transform = "";
      element.removeAttribute("contenteditable");
      element.removeAttribute("tabindex");
    });
    bubble.querySelectorAll<HTMLElement>(".playable-token-space").forEach(gap => {
      const base = Number(gap.dataset.width);
      const current = parseFloat(gap.style.width) || base;
      const target = BUBBLE_GAPS[base] ?? base;
      gap.style.width = `${current < base ? current * (target / base) : target}px`;
    });
  }, [prompt]);

  // A new turn lands at the bottom of the chat; jump there before the preview uncovers it.
  useLayoutEffect(() => {
    const chat = chatRef.current;
    if (chat && followUps.length) chat.scrollTop = chat.scrollHeight;
  }, [followUps.length]);

  return (
    <section className="playable-generating" aria-label="Generating playable"
      style={{ paddingTop: topInset, paddingBottom: bottomInset }}>
      <img className="playable-generating-glow-top" src="/resource/playable/generating/top-glow.svg" alt="" aria-hidden="true" />
      <img className="playable-generating-glow-bottom" src="/resource/playable/generating/bottom-glow.svg" alt="" aria-hidden="true" />
      <div className="playable-generating-nav">
        <TUXNavBar heightPreset={44} backgroundColor="transparent" showSeparator={false} title="PLAYABLE" titleAlign="center"
          leading={<AppNavBarBackButton iconColor={getColorCSSVar("UIText1")} onBack={onBack} />} />
      </div>
      <div ref={chatRef} className="playable-generating-chat">
        <div className="playable-generating-bubble-row">
          <div ref={bubbleRef} className="playable-generating-bubble" data-electron-smooth-corner aria-label="Your prompt" />
        </div>
        <AnimatePresence mode="wait" initial={false} onExitComplete={() => setRevealed(true)}>
          {ready ? (
            <motion.p key="ready" className="playable-generating-message" {...(reducedMotion ? {} : MESSAGE_WIPE)}>
              {game?.html ? `🎮 ${game.title} is ready to play!` : RESULT.message}
            </motion.p>
          ) : error ? (
            <motion.div key="error" exit={MESSAGE_OUT}><GenerationError onRetry={retry} /></motion.div>
          ) : (
            <motion.p key="generating" className="playable-generating-message" exit={MESSAGE_OUT}>✨ Generating...It will take 3-5 mins</motion.p>
          )}
        </AnimatePresence>
        <div className="playable-generating-card-row">
          {revealed ? <ReadyCard image={RESULT.image} game={game} onView={() => onView(game)} /> : <PlayableGeneratingCard progress={progress} />}
        </div>
        {followUps.map((turn, index) => <FollowUpTurn key={index} {...turn} onView={onView} />)}
      </div>
      <div className="playable-generating-dock">
        <AnimatePresence>
          {!ready && (
            <motion.div className="playable-generating-notice" data-electron-smooth-corner
              initial={{ opacity: 0, y: reducedMotion ? 0 : 24 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              transition={{ delay: NOTICE_DELAY_S, duration: 0.36, ease: [0.22, 1, 0.36, 1] }}>
              You can leave this page and we will notify you when it’s done.
            </motion.div>
          )}
        </AnimatePresence>
        <div className="playable-generating-input" data-electron-smooth-corner>
          <span className="playable-generating-placeholder">Describe your idea</span>
          <div className="playable-generating-actions">
            <button type="button" aria-label="Add image" disabled><TUXIconImagePlus size={24} /></button>
            <button type="button" aria-label="Mention" disabled><TUXIconAt size={24} /></button>
            {ready ? (
              <button type="button" className="playable-generating-send" aria-label="Send" disabled>
                <TUXIconPaperplaneFill size={22} />
              </button>
            ) : (
              <button type="button" className="playable-generating-stop" aria-label="Stop generating" onClick={onStop}>
                <span><TUXIconStopFill size={20} /></span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
