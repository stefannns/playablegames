/**
 * Edit-tool sheets for the result preview: Modify (25205:313325), Text (16143:183977),
 * Images (16143:183978), Music (18096:183258). Each body reports whether it holds an
 * applicable change so the shared nav can enable ✓.
 */
import { TUXSwitch } from "@byted-tiktok/tux-web";
import {
  TUXIconAiAutocutFill, TUXIconBookmark, TUXIconControl, TUXIconImageAlt1, TUXIconMagnifyingGlass,
  TUXIconMusicNoteSAlt, TUXIconPencil, TUXIconReplace, TUXIconTickFill, TUXIconXMark,
} from "@byted-tiktok/tux-icons";
import { useRef, useState, type ReactNode } from "react";

export type ResultTool = "modify" | "text" | "images" | "music";

export const TOOL_META: Record<ResultTool, { label: string; icon: (size: number) => ReactNode; badge?: number }> = {
  modify: { label: "Modify", icon: size => <TUXIconControl size={size} />, badge: 4 },
  text: { label: "Text", icon: size => <TUXIconPencil size={size} />, badge: 2 },
  images: { label: "Images", icon: size => <TUXIconImageAlt1 size={size} />, badge: 2 },
  music: { label: "Music", icon: size => <TUXIconMusicNoteSAlt size={size} />, badge: 1 },
};

/* ---------- Modify ---------- */

/** Physics the tweakable game exposes (…-tweakable.html reads `__pt.<key>`); 50 = the game as generated. */
const SLIDERS = [
  { key: "gravity", label: "Gravity" },
  { key: "swing", label: "Swing power" },
  { key: "jump", label: "Jump height" },
] as const;
export type GameTweaks = Record<(typeof SLIDERS)[number]["key"], number>;
export const DEFAULT_TWEAKS: GameTweaks = { gravity: 50, swing: 50, jump: 50 };
/** Slider 0–100 → game multiplier: 0 → 0.3×, 50 → 1× (as generated), 100 → 2×. */
const multiplier = (value: number) => value <= 50 ? 0.3 + 0.7 * value / 50 : 1 + (value - 50) / 50;
export const tweakMultipliers = (tweaks: GameTweaks) =>
  Object.fromEntries(SLIDERS.map(({ key }) => [key, multiplier(tweaks[key])]));

/** Dragging within this many points of a 10% tick snaps onto it. */
const SNAP_RANGE = 3;

/** 32px track, translucent fill, 14px thumb at the fill's end; 10% step dots only while dragging, with snapping. */
function TweakSlider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const setFromPointer = (clientX: number) => {
    const rect = trackRef.current!.getBoundingClientRect();
    const raw = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) * 100;
    const tick = Math.round(raw / 10) * 10;
    const next = Math.abs(raw - tick) <= SNAP_RANGE ? tick : Math.round(raw);
    // A light tick of haptics when the thumb lands on a new step.
    if (next === tick && next !== value) navigator.vibrate?.(8);
    onChange(next);
  };
  const end = () => setDragging(false);
  return (
    <div className="playable-tweak" data-active={dragging}>
      <div className="playable-tweak-label"><span>{label}</span><span>{value}</span></div>
      <div ref={trackRef} className="playable-tweak-track" data-electron-smooth-corner role="slider" tabIndex={0}
        aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}
        onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); setFromPointer(event.clientX); }}
        onPointerMove={event => { if (dragging) setFromPointer(event.clientX); }}
        onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
        onKeyDown={event => {
          const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[event.key];
          if (!step) return;
          event.preventDefault();
          onChange(Math.min(100, Math.max(0, value + step)));
        }}>
        {dragging && Array.from({ length: 9 }, (_, index) => (index + 1) * 10).filter(stop => stop > value)
          .map(stop => <i key={stop} className="playable-tweak-dot" style={{ left: `${stop}%` }} />)}
        <div className="playable-tweak-fill" data-electron-smooth-corner style={{ width: `max(14px, ${value}%)` }} />
        <div className="playable-tweak-thumb" style={{ left: `calc(max(14px, ${value}%) - 14px)` }} />
      </div>
    </div>
  );
}

type BodyProps = {
  onDirty: (dirty: boolean) => void;
  /** Applied game tweaks: Modify starts from them and previews edits live through onPreview. */
  tweaks: GameTweaks;
  onPreview: (tweaks: GameTweaks) => void;
};
function ModifyBody({ onDirty, tweaks, onPreview }: BodyProps) {
  const [values, setValues] = useState(tweaks);
  return (
    <div className="playable-sheet-body playable-modify-body">
      {SLIDERS.map(({ key, label }) => (
        <TweakSlider key={key} label={label} value={values[key]} onChange={value => {
          const next = { ...values, [key]: value };
          setValues(next);
          onPreview(next);
          onDirty(SLIDERS.some(s => next[s.key] !== tweaks[s.key]));
        }} />
      ))}
      <div className="playable-modify-switches">
        {["Shake effect", "VS Component"].map(label => (
          <label key={label} className="playable-modify-switch">
            <span>{label}</span>
            <TUXSwitch name={label} value="on" defaultChecked backgroundColor="#c6e4ff" onChange={() => onDirty(true)} />
          </label>
        ))}
      </div>
    </div>
  );
}

/* ---------- Text ---------- */

/** The Spider-man game's on-screen labels (demo: edits don't reach the game yet). */
const TEXT_FIELDS = [
  { key: "swing", label: "Swing button", initial: "SWING" },
  { key: "jump", label: "Jump button", initial: "JUMP" },
] as const;

function TextBody({ onDirty }: { onDirty: (dirty: boolean) => void }) {
  const [values, setValues] = useState<Record<string, string>>(Object.fromEntries(TEXT_FIELDS.map(f => [f.key, f.initial])));
  return (
    <div className="playable-sheet-body playable-text-body">
      {TEXT_FIELDS.map(({ key, label }) => (
        <label key={key} className="playable-text-field">
          <span>{label}</span>
          <input value={values[key]} data-electron-smooth-corner onChange={event => {
            const next = { ...values, [key]: event.target.value };
            setValues(next);
            onDirty(TEXT_FIELDS.some(f => next[f.key] !== f.initial));
          }} />
        </label>
      ))}
    </div>
  );
}

/* ---------- Images ---------- */

/** The Spider-man game's art: its city backdrop and the hero cutout (demo crops of the game). */
const IMAGE_TILES = [
  { key: "scene", label: "Background", src: "/resource/playable/result/game-scene.jpg" },
  { key: "character", label: "Character", src: "/resource/playable/result/game-character.png", cutout: true },
];

function ImagesBody({ onDirty }: { onDirty: (dirty: boolean) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="playable-sheet-body playable-images-body">
      <div className="playable-images-row">
        {IMAGE_TILES.map(tile => (
          <button key={tile.key} type="button" className="playable-images-tile" data-electron-smooth-corner
            aria-label={tile.label} aria-pressed={selected === tile.key} data-cutout={tile.cutout || undefined}
            onClick={() => { const next = selected === tile.key ? null : tile.key; setSelected(next); onDirty(next !== null); }}>
            <img src={tile.src} alt="" draggable={false} />
            {selected === tile.key && <span className="playable-images-check"><TUXIconTickFill size={12} /></span>}
          </button>
        ))}
      </div>
      {/* Replace / AI cutout act on the selected image; dimmed (20%) until one is picked. */}
      <div className="playable-images-actions" data-enabled={selected !== null}>
        <button type="button" aria-label="Replace image" disabled={!selected}><TUXIconReplace size={22} /></button>
        <button type="button" aria-label="AI cutout" disabled={!selected}><TUXIconAiAutocutFill size={22} /></button>
      </div>
    </div>
  );
}

/* ---------- Music ---------- */

const MUSIC_TABS = ["Hot", "For you", "Favorites", "Recent"];
const SONGS = [
  { title: "Mi Tierra", artist: "Denise", posts: "540.2K", duration: "01:14", cover: "/resource/avatar/small/avatar-11.jpg" },
  { title: "You", artist: "Denise", posts: "34.1K", duration: "02:14", cover: "/resource/avatar/small/avatar-12.jpg" },
  { title: "Hard Core", artist: "Denise", posts: "88.4K", duration: "01:08", cover: "/resource/avatar/small/avatar-13.jpg" },
  { title: "Mi Tierra", artist: "Denise", posts: "540.2K", duration: "01:14", cover: "/resource/avatar/small/avatar-14.jpg" },
  { title: "First Take", artist: "Roberta Flack", posts: "102.2K", duration: "02:01", cover: "/resource/avatar/small/avatar-15.jpg" },
];

function MusicBody({ onDirty }: { onDirty: (dirty: boolean) => void }) {
  const [tab, setTab] = useState("For you");
  const [playing, setPlaying] = useState(0);
  const [saved, setSaved] = useState<number[]>([]);
  return (
    <div className="playable-sheet-body playable-music-body">
      <div className="playable-music-search" data-electron-smooth-corner>
        <TUXIconMagnifyingGlass size={20} /><input placeholder="Search" aria-label="Search music" />
      </div>
      <div className="playable-music-tabs" role="tablist">
        {MUSIC_TABS.map(name => (
          <button key={name} type="button" role="tab" aria-selected={tab === name} onClick={() => setTab(name)}>{name}</button>
        ))}
      </div>
      <div className="playable-music-list">
        {SONGS.map((song, index) => (
          <div key={index} className="playable-music-cell" data-selected={playing === index}
            onClick={() => { setPlaying(index); onDirty(index !== 0); }}>
            <img className="playable-music-cover" src={song.cover} alt="" draggable={false} data-electron-smooth-corner />
            <div className="playable-music-info">
              <strong>{playing === index && <i className="playable-music-wave" aria-hidden="true"><b /><b /><b /><b /></i>}{song.title}</strong>
              <span>{song.artist} · {song.posts} posts · {song.duration}</span>
            </div>
            <button type="button" className="playable-music-save" aria-label={`Save ${song.title}`} aria-pressed={saved.includes(index)}
              onClick={event => { event.stopPropagation(); setSaved(list => list.includes(index) ? list.filter(i => i !== index) : [...list, index]); }}>
              <TUXIconBookmark size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Shared sheet ---------- */

const BODIES: Record<ResultTool, (props: BodyProps) => ReactNode> = {
  modify: ModifyBody, text: TextBody, images: ImagesBody, music: MusicBody,
};

/** ✓ keeps the previewed edits (onApply); ✕ drops them (onCancel). */
export function ResultToolSheet({ tool, tweaks, onPreview, onApply, onCancel }: Omit<BodyProps, "onDirty"> & {
  tool: ResultTool; onApply: () => void; onCancel: () => void;
}) {
  // Music already has a playing pick, so its ✓ is live from the start (Figma 18096:183258).
  const [dirty, setDirty] = useState(tool === "music");
  const Body = BODIES[tool];
  return (
    <>
      <div className="playable-sheet-nav">
        <button type="button" aria-label="Cancel" onClick={onCancel}><TUXIconXMark size={24} /></button>
        <h2>{TOOL_META[tool].icon(22)}{TOOL_META[tool].label}</h2>
        <button type="button" aria-label="Apply" disabled={!dirty} onClick={onApply}><TUXIconTickFill size={24} /></button>
      </div>
      <Body onDirty={value => setDirty(value || tool === "music")} tweaks={tweaks} onPreview={onPreview} />
    </>
  );
}
