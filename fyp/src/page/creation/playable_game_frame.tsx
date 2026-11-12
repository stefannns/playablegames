/**
 * A generated playable's HTML in a card. The game always renders at phone width (GAME_VIEWPORT) and is
 * scaled to cover its box, so a 187px chat card and the full preview show the same composition.
 * Inactive frames are a live cover (no input); active frames are playable, same protocol as the feed stage.
 * `tweaks` are physics multipliers posted to tweakable games (ignored by others), resent on every load.
 * `autoplay` asks the feed host script to play the game by itself (reads like a recorded session).
 */
import { useLayoutEffect, useRef } from "react";
import "./playable_result.css";

/** The preview card's aspect at phone width; every card that shows a game keeps or crops to this. */
const GAME_VIEWPORT = { width: 390, height: 598 };
/** Device features playables ask for (voice meter, camera stamps, …); the browser still prompts per use. */
export const PLAYABLE_FRAME_ALLOW = "microphone; camera; autoplay; fullscreen";
/**
 * Pocket playables run fully sandboxed. Trusted library and local review games load ES modules, JSON
 * and fonts from their own folder, which a null-origin sandbox blocks without CORS headers — and the
 * Goofy page server can't send those — so they keep their real origin (plus downloads for "Save image").
 */
export function playableSandbox(src: string) {
  const localPackage = src.startsWith("/resource/playable-library/") || src.startsWith("/resource/playable-local/") || src.startsWith("/resource/playable-batch/") || src.startsWith("/resource/playable-pilot/catch-the-beat/");
  return localPackage ? "allow-scripts allow-same-origin allow-downloads" : "allow-scripts";
}

export function PlayableGameFrame({ src, title, active, tweaks, autoplay = false }: {
  src: string; title: string; active: boolean;
  tweaks?: Record<string, number>;
  autoplay?: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const post = () => frameRef.current?.contentWindow?.postMessage({ type: "playable-active", active }, "*");
  const postAutoplay = () => frameRef.current?.contentWindow?.postMessage({ type: "playable-autoplay", on: autoplay }, "*");
  const postTweaks = () => { if (tweaks) frameRef.current?.contentWindow?.postMessage({ type: "playable-tweaks", values: tweaks }, "*"); };

  useLayoutEffect(() => {
    const box = boxRef.current, frame = frameRef.current;
    if (!box || !frame) return;
    const fit = () => {
      const scale = Math.max(box.clientWidth / GAME_VIEWPORT.width, box.clientHeight / GAME_VIEWPORT.height);
      const x = (box.clientWidth - GAME_VIEWPORT.width * scale) / 2, y = (box.clientHeight - GAME_VIEWPORT.height * scale) / 2;
      frame.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(post, [active]);
  // Keyed on the values, not the object, so re-renders don't re-post identical tweaks.
  const tweaksKey = JSON.stringify(tweaks ?? null);
  useLayoutEffect(postTweaks, [tweaksKey]);
  useLayoutEffect(postAutoplay, [autoplay]);

  return (
    <div ref={boxRef} className="playable-game-box" data-electron-smooth-corner>
      <iframe ref={frameRef} className="playable-game-frame" title={title} src={`${src}#services=`} sandbox={playableSandbox(src)} allow={PLAYABLE_FRAME_ALLOW}
        style={{ width: GAME_VIEWPORT.width, height: GAME_VIEWPORT.height, pointerEvents: active ? "auto" : "none" }}
        tabIndex={active ? 0 : -1} onLoad={() => { post(); postTweaks(); postAutoplay(); }} />
    </div>
  );
}
