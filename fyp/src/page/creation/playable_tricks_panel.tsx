import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";

/**
 * `panelImage` is the add-on frame art (exported at 64px, 24971:272215; drawn at 56px per 25915:155046), art
 * pre-placed; `image` is the chip icon.
 * Camera's frame export carried an opaque fill, so its transparent art is placed in the frame with `panelArt`.
 */
export const PLAYABLE_TRICKS = [
  { label: "Camera", panelLabel: "Camera", image: "/resource/playable/camera.png", panelImage: "/resource/playable/addons/camera-art-v2.png",
    // Figma 25915:155046: 42px art, rotated −4.62°, centered in the 45.246px box at (5.38, 6.75) of the 56px frame.
    panelArt: { left: 7, top: 8.37, width: 42, height: 42, transform: "rotate(-4.62deg)" } },
  { label: "Tilt", panelLabel: "Tilt", image: "/resource/playable/tilt.png", panelImage: "/resource/playable/addons/tilt.png" },
  { label: "Player’s friends", panelLabel: "Friends", image: "/resource/playable/friends.png", panelImage: "/resource/playable/addons/friends.png" },
  { label: "Microphone", panelLabel: "Microphone", image: "/resource/playable/microphone.png", panelImage: "/resource/playable/addons/microphone.png" },
  // Prompt-only pottery tricks (clay idea); not listed in the Add-ons row.
  { label: "Cup", panelLabel: "Cup", image: "/resource/playable/ideas/cup.png" },
  { label: "Vase", panelLabel: "Vase", image: "/resource/playable/ideas/vase.png" },
  { label: "Bowl", panelLabel: "Bowl", image: "/resource/playable/ideas/bowl.png" },
] as const;
/** A trick chip's chevron cycles only within its own group: add-ons never turn into pottery. */
export const PLAYABLE_TRICK_CYCLES = [[0, 1, 2, 3], [4, 5, 6]] as const;
export const PLAYABLE_MEMES = [
  { label: "Duck meme", image: "/resource/playable/duck-meme.png" },
  { label: "Monkey meme", image: "/resource/playable/monkey.png" },
  { label: "Side-eye dog meme", image: "/resource/playable/dog.png" },
  { label: "Portrait meme", image: "/resource/playable/portrait.png" },
  { label: "Reaction meme", image: "/resource/playable/meme-extra.png" },
] as const;

/** A keyboard-replacement dock in the existing AppFrame, not a modal overlay. */
export function PlayableTricksPanel({ bottomInset, onTrick, onMeme, onClose }: {
  bottomInset: string;
  onTrick: (index: number) => void;
  onMeme: (index: number) => void;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.section className="playable-tricks-panel" data-electron-smooth-corner aria-label="Tricks" data-softkb-keep-open
      style={{ paddingBottom: bottomInset }} initial={{ y: reduced ? 0 : "100%" }} animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 438.65, damping: 41.89 }}
      onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); onClose(); } }}>
      <button className="playable-tricks-grabber" aria-label="Close Tricks" onClick={onClose}><span /></button>
      <h2>Memes</h2>
      <div className="playable-tricks-row">
        {PLAYABLE_MEMES.map((item, index) => (
          <button key={item.image} className="playable-meme-tile" data-electron-smooth-corner aria-label={item.label}
            onClick={() => onMeme(index)}><img src={item.image} alt="" draggable={false} /></button>
        ))}
      </div>
      <h2>Add-ons</h2>
      <div className="playable-tricks-row">
        {[2, 1, 0, 3].map(index => {
          const item = PLAYABLE_TRICKS[index] as { label: string; panelLabel: string; panelImage: string; panelArt?: CSSProperties };
          return <button key={item.label} className="playable-addon-tile" data-electron-smooth-corner
            onClick={() => onTrick(index)}>
            <span className="playable-addon-art">
              <img src={item.panelImage} alt="" draggable={false} style={item.panelArt && { position: "absolute", ...item.panelArt }} />
            </span><span>{item.panelLabel}</span>
          </button>;
        })}
      </div>
    </motion.section>
  );
}
