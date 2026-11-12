import { PLAYABLE_CONTENT, type PlayableContentId } from "./playable_content";
import { showcaseFrameSource, showcaseGameCount } from "./playable_batch_showcase.mjs";
import {isItalianReview,localizedReviewSource,italianGames} from "./playable_review_italian.mjs";
import { BATCH1_STILL_COVERS } from "./playable_still_covers";
import { BATCH3_STILL_COVERS } from "./batch3_still_covers";
import { usePlayableExitGesture } from "./playable_exit_gesture";
import { ThemeScope } from "../../../context/theme";
import { usePlayablePalette } from "./playable_palette";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { TUXNavBar } from "@byted-tiktok/tux-web";
import { IconHeart, IconChevronLeftOffsetLTR, IconMediaLike, IconMediaLikeActive, IconMediaComment, IconMediaFavoriate, IconMediaFavoriateActive, IconMediaShare, IconPlusSmall, IconBubbleRight, IconChevronUpDouble, IconArrowTurnUpRight } from "@byted-tiktok/tux-icons";
import { useRegisterAppChromeSurfaceTheme } from "../../../components/sys/app_frame";
import { SharePanel } from "./share_panel";
import { PlayableRemixPanel } from "./playable_remix_panel";
import { openCommentPanelFor, registerCommentPanelFeedBinding } from "./comment_panel";
import { EditVideoPage } from "../../edit/video/edit_video_page";
import { CreationPublishPageContent } from "../../creation/components/creation_publish_page_content";
import { seedPostPublishDraft } from "../../creation/post_publish/post_publish_store";
import { PlayableResultView } from "../../creation/playable_result_view";
import { PLAYABLE_FRAME_ALLOW, PlayableGameFrame, playableSandbox } from "../../creation/playable_game_frame";
import { setPlayableRemixSource } from "../../creation/playable_remix_store";
import CreationPlayablePage from "../../creation/creation_playable_page";
import { useAppFrame } from "../../../components/sys/app_frame";
import "./playable_feed.css";

// A shared prototype state keeps the feed and its detail in sync when returning.
const emptyEngagement = { liked: false, saved: false, followed: false };
const engagement = new Map<PlayableContentId, typeof emptyEngagement>();
const listeners = new Set<() => void>();
function useEngagement(contentId: PlayableContentId) {
  const state = useSyncExternalStore((listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => engagement.get(contentId) ?? emptyEngagement);
  return { ...state, toggle: (key: keyof typeof emptyEngagement) => { const current = engagement.get(contentId) ?? emptyEngagement; engagement.set(contentId, { ...current, [key]: !current[key] }); listeners.forEach((listener) => listener()); } };
}
/** Publish cover for a Clip (Figma 21817:104801) until real screen capture can grab a frame. */
const CLIP_FRAME = "/resource/playable-feed/clip-frame-snow.jpg";
/** Clip's edit preview sits exactly where the playable stage is (vars set by `usePlayableNavigation`). */
const CLIP_MEDIA_FRAME = {
  top: "calc(var(--playable-header-height) - var(--app-frame-top-inset))", bottom: "auto", height: "var(--playable-stage-height)",
} as const;
const STAGE_RADIUS = 32;
/** The app frame root around a feed card: where its sheets mount, like the video feed's. */
function useFrameRoot<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [root, setRoot] = useState<HTMLElement | null>(null);
  useEffect(() => { setRoot(ref.current?.closest<HTMLElement>("[data-app-frame-root='true']") ?? null); }, []);
  return [ref, root] as const;
}
/** Opens the shared comment sheet for a playable: no PiP squeeze, feed chrome stays, mounted at `root`. */
function openPlayableComments(contentId: PlayableContentId, root: HTMLElement | null) {
  const key = `playable:${contentId}`;
  registerCommentPanelFeedBinding(key, { feedContentId: null, pipMedia: null, applySqueeze: () => {}, preserveFeedChrome: true, root });
  openCommentPanelFor(key);
}
function Asset({ src, size = 22 }: { src: string; size?: number }) { return <img src={src} width={size} height={size} alt="" />; }
export function PlayableStage({ playing, contentId }: { playing: boolean; contentId: PlayableContentId }) {
  const content = PLAYABLE_CONTENT[contentId];
  const taskId = contentId.replace(/^playable-batch-/, "");
  const batch3Cover = BATCH3_STILL_COVERS[taskId];
  const batch1Cover = contentId.startsWith("playable-batch-") && BATCH1_STILL_COVERS.has(taskId) && new URLSearchParams(window.location.search).get("cover") === "still"
    ? `/resource/playable-covers/batch1/${taskId}.png?v=covers-20261110-b6b2660f0f` : undefined;
  const stillCover = batch3Cover || batch1Cover;
  const [coverFailed, setCoverFailed] = useState(false);
  const [freshFrameReady, setFreshFrameReady] = useState(false);
  useEffect(() => { setCoverFailed(false); }, [contentId]);
  const frameSource = localizedReviewSource(contentId,showcaseFrameSource(contentId, content.src, window.location.search),window.location.search);
  const frame = useRef<HTMLIFrameElement>(null);
  const batch = contentId.startsWith("playable-batch-");
  const [loaded, setLoaded] = useState(false);
  const wasPlaying = useRef(playing);
  useEffect(() => {
    if (!frame.current) return;
    // Load a screen ahead, so the game (and its sampled palette) is ready by the time it's swiped in.
    const observer = new IntersectionObserver(([entry]) => {
      if (batch) setLoaded(entry.isIntersecting);
      else if (entry.isIntersecting) { setLoaded(true); observer.disconnect(); }
    // Use the pager's expanded bounds: its own clipping otherwise prevents an
    // AppFrame-root observer from prewarming a card until it enters the screen.
    // Far-away loop clones still remain unloaded; only adjacent stages qualify.
    }, {
      root: batch ? frame.current.closest("[data-vertical-snap-pager-root='true']") ?? frame.current.closest("[data-app-frame-root='true']") : null,
      rootMargin: "100% 0px",
    });
    observer.observe(frame.current);
    return () => observer.disconnect();
  }, [batch]);
  useEffect(() => {
    const iframe = frame.current;
    if (batch3Cover && !wasPlaying.current && playing && iframe && loaded) {
      // The still cover must never leave a player in a running preview state.
      setFreshFrameReady(false);
      iframe.contentWindow?.location.reload();
    } else {
      // Update the current document even when same-URL navigation is a no-op.
      iframe?.contentWindow?.postMessage({ type: "playable-active", active: playing }, "*");
    }
    if (!playing) setFreshFrameReady(false);
    if (wasPlaying.current && !playing && iframe && loaded) {
      // Reload only the embedded game on exit; preserve the outer stage geometry.
      if (batch3Cover) iframe.contentWindow?.location.reload();
      else iframe.src = `${frameSource}#services=`;
    }
    wasPlaying.current = playing;
  }, [playing, frameSource, loaded, batch3Cover]);
  return <div className="playable-stage" data-electron-smooth-corner>
    <iframe ref={frame} title={content.title} className="playable-html-frame" src={loaded ? `${frameSource}#services=` : "about:blank"} sandbox={playableSandbox(content.src)} allow={PLAYABLE_FRAME_ALLOW} onLoad={() => {
      frame.current?.contentWindow?.postMessage({ type: "playable-active", active: playing }, "*");
      if (playing && loaded) setFreshFrameReady(true);
    }} tabIndex={playing ? 0 : -1} />
    {stillCover && !coverFailed && (!playing || (batch3Cover && !freshFrameReady)) && <img className="playable-still-cover" data-playable-still-cover src={stillCover} alt="" onError={() => setCoverFailed(true)} />}
  </div>;
}

function Action({ label, children, onClick, pressed }: { label: string; children: ReactNode; onClick: () => void; pressed?: boolean }) {
  return <button type="button" aria-label={label} aria-pressed={pressed} onClick={onClick} className="playable-action">{children}</button>;
}
export function PlayableFeedCard({ onPlay, playing, contentId }: { onPlay: () => void; playing: boolean; contentId: PlayableContentId }) {
  const content = PLAYABLE_CONTENT[contentId];
  const italian=isItalianReview(contentId,window.location.search);
  const state = useEngagement(contentId);
  const [share, setShare] = useState(false);
  const [cardRef, sheetRoot] = useFrameRoot<HTMLElement>();
  const paletteStyle = usePlayablePalette(cardRef, content.src);
  return <article ref={cardRef} style={paletteStyle} data-playing={playing} className="playable-feed-card" aria-label={content.title + " feed"}>
    <div className="playable-feed-media"><PlayableStage playing={playing} contentId={contentId} /></div>
    <div className="playable-feed-tint playable-feed-tint-top" /><div className="playable-feed-tint playable-feed-tint-bottom" />
    {!playing && <button type="button" className="playable-preview-hit" data-feed-preview-tap aria-label={italian?`Gioca: ${content.title}`:`Play ${content.title}`} onClick={onPlay}>
      <span className="playable-launch"><Asset src="/resource/playable-feed/joystick.svg" size={20} />{italian?'Tocca per giocare':'Tap to play'}</span>
    </button>}
    <div className="playable-feed-info"><div className="playable-author">Bella <span className="playable-badge"><Asset src="/resource/playable-feed/joystick.svg" size={12} />Playable</span></div><p>{italian?italianGames[contentId.replace(/^playable-batch-/,"")].name:content.description}</p><small>{italian?'Contiene contenuti generati dall’IA':'Contains AI-generated media'}</small></div>
    <aside className="playable-feed-rail">
      <button className="playable-avatar-follow" aria-label={state.followed ? "Unfollow Bella" : "Follow Bella"} onClick={() => state.toggle("followed")}><img src="/resource/playable-feed/bella.png" alt="Bella" />{!state.followed && <span><IconPlusSmall width={16} height={16} color="white" /></span>}</button>
      <Action label="Like" pressed={state.liked} onClick={() => state.toggle("liked")}>{state.liked ? <IconMediaLikeActive width={32} height={32} color="#fe2c55" /> : <IconMediaLike width={32} height={32} color="white" />}<span>12K</span></Action>
      <Action label="Comments" onClick={() => openPlayableComments(contentId, sheetRoot)}><IconMediaComment width={32} height={32} color="white" /><span>456</span></Action>
      <Action label="Save" pressed={state.saved} onClick={() => state.toggle("saved")}>{state.saved ? <IconMediaFavoriateActive width={32} height={32} color="#face15" /> : <IconMediaFavoriate width={32} height={32} color="white" />}<span>{state.saved ? 69 : 68}</span></Action>
      <Action label="Share" onClick={() => setShare(true)}><IconMediaShare width={32} height={32} color="white" /><span>43</span></Action>
      <img className="playable-record" src="/resource/playable-feed/hotpot.png" alt="Sound cover" />
    </aside>
    <SharePanel visible={share} onVisibleChange={setShare} root={sheetRoot} />
  </article>;
}
export function PlayableDetailPage({ onBack, active, contentId, onNext, onPrevious }: { onBack: () => void; active: boolean; contentId: PlayableContentId; onNext?: () => void; onPrevious?: () => void }) {
  const batchReview = contentId.startsWith("playable-batch-");
  const singleShowcase = showcaseGameCount(window.location.search) === 1;
  useRegisterAppChromeSurfaceTheme(active ? "dark" : null);
  const state = useEngagement(contentId);
  const [share, setShare] = useState(false);
  const [remix, setRemix] = useState(false);
  // Play mode renders in the frame's top overlay layer, above frame-root sheets, so its sheets mount
  // in hosts inside that layer. Hosts are empty boxes until a sheet opens (see .playable-sheet-host).
  const [sheetRoot, setSheetRoot] = useState<HTMLDivElement | null>(null);
  const [remixRoot, setRemixRoot] = useState<HTMLDivElement | null>(null);
  // Clip "auto-records" the session and opens the video edit page right over play mode; its Next opens
  // the publish page on top. Each Back steps one layer down, ending on the same playable, still playing.
  const [clip, setClip] = useState<"edit" | "publish" | null>(null);
  const publishClip = () => {
    seedPostPublishDraft({ kind: "video", coverSrc: CLIP_FRAME }, "edit-video");
    setClip("publish");
  };
  // Remix sheet's two exits, both opened over play mode so Back steps back to the sheet:
  // "Describe your idea…" → the Playable composer in remix mode; Remix → the GUI editor (Figma 18212:281352).
  const [describing, setDescribing] = useState(false);
  const [editing, setEditing] = useState(false);
  const backToRemix = () => { setDescribing(false); setEditing(false); setRemix(true); };
  const { topInsetCss, bottomInsetCss } = useAppFrame();
  // Leaving play mode closes everything opened on top of it, so the next Tap to play starts clean.
  useEffect(() => {
    if (active) return;
    setClip(null);
    setDescribing(false);
    setEditing(false);
    setRemix(false);
    setShare(false);
  }, [active]);
  const headerGesture = usePlayableExitGesture("left", onBack);
  const footerGesture = usePlayableExitGesture("up", onNext ?? onBack, onPrevious);
  return <><ThemeScope mode="dark"><section className="playable-detail" aria-label="Playable interaction">
    <div className="playable-detail-header pt-app-frame-top"><TUXNavBar heightPreset={44} backgroundColor="UIPageFlat1" showSeparator={false} leading={<span className="flex h-11 w-10.5 items-center justify-center"><IconChevronLeftOffsetLTR width={22} height={22} color="white" /></span>} trailing={<div className="playable-detail-nav-actions"><Action label="Save" pressed={state.saved} onClick={() => state.toggle("saved")}>{state.saved ? <IconMediaFavoriateActive width={22} height={22} color="white" /> : <IconMediaFavoriate width={22} height={22} color="white" />}</Action><Action label="Share" onClick={() => setShare(true)}><IconArrowTurnUpRight width={24} height={24} color="white" /></Action></div>} /><button type="button" className="playable-header-exit-hotspot" aria-label="Back" {...headerGesture} onClick={onBack} /></div>

    <div className="playable-detail-footer"><div className="playable-footer-exit-hotspot" {...footerGesture}>
    <div className="playable-detail-metrics">
      <Action label="Like" pressed={state.liked} onClick={() => state.toggle("liked")}>{state.liked ? <IconMediaLikeActive width={22} height={22} color="#fe2c55" /> : <IconHeart width={22} height={22} color="white" />}12K</Action>
      <Action label="Comments" onClick={() => openPlayableComments(contentId, sheetRoot)}><IconBubbleRight width={22} height={22} color="white" />112</Action>
      {!batchReview && <><Action label="Remix" onClick={() => setRemix(true)}><Asset src="/resource/playable-feed/sparkles.svg" />11.2K</Action>
      <button className="playable-clip" onClick={() => setClip("edit")}><Asset src="/resource/playable-feed/clip.svg" size={18} />Clip</button></>}
    </div>
    <div className="playable-detail-author"><img src="/resource/playable-feed/bella.png" alt="Bella" /><div><strong>Bella</strong><p>{PLAYABLE_CONTENT[contentId].description}</p></div></div>
    <button className="playable-back-hint" style={singleShowcase ? { visibility: "hidden" } : undefined} disabled={singleShowcase} aria-hidden={singleShowcase || undefined} onClick={onNext ?? onBack}><IconChevronUpDouble width={12} height={12} />{onNext ? "Swipe up for next game" : "Swipe up to go back"}</button>
    </div></div>
    <SharePanel visible={active && share} onVisibleChange={setShare} root={sheetRoot} />
    <PlayableRemixPanel contentId={contentId} visible={active && remix} onVisibleChange={setRemix} root={remixRoot}
      onDescribe={() => { setRemix(false); setPlayableRemixSource({ src: PLAYABLE_CONTENT[contentId].src, title: PLAYABLE_CONTENT[contentId].title }); setDescribing(true); }}
      onRemix={() => { setRemix(false); setEditing(true); }} />
    {/* Remix is dark by default; share / comments keep the app theme like the video feed. */}
    <div ref={setRemixRoot} className="playable-sheet-host" />
  </section></ThemeScope><div ref={setSheetRoot} className="playable-sheet-host" />
    {active && editing && <ThemeScope mode="dark" className="playable-clip-layer">
      <PlayableResultView game={{ src: PLAYABLE_CONTENT[contentId].src, title: PLAYABLE_CONTENT[contentId].title }}
        topInset={topInsetCss} bottomInset={bottomInsetCss} onBack={backToRemix} />
    </ThemeScope>}
    {active && describing && <ThemeScope mode="dark" className="playable-clip-layer"><CreationPlayablePage isTabActive onClose={backToRemix} /></ThemeScope>}
    {active && clip && <ThemeScope mode="dark" className="playable-clip-layer">
      {/* The "recording": the same playable, playing itself, in the stage's exact frame. */}
      <EditVideoPage mediaSrc={CLIP_FRAME} mediaFrameStyle={CLIP_MEDIA_FRAME}
        mediaContent={<PlayableGameFrame src={PLAYABLE_CONTENT[contentId].src} title={PLAYABLE_CONTENT[contentId].title} active={false} autoplay />} mediaCornerRadiusPx={STAGE_RADIUS}
        onBack={() => setClip(null)} onNext={publishClip} />
    </ThemeScope>}
    {active && clip === "publish" && <div className="playable-clip-layer"><CreationPublishPageContent onClose={() => setClip("edit")}
      coverContent={<PlayableGameFrame src={PLAYABLE_CONTENT[contentId].src} title={PLAYABLE_CONTENT[contentId].title} active={false} autoplay />} /></div>}
  </>;
}
