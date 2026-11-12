/**
 * Remix sheet for a playable (Figma 25682:207490): remixes of this playable in a 2-column grid,
 * with a "Describe your idea…" bar (opens the Playable composer in remix mode) and a Remix button
 * (opens this playable in the GUI editor). Cards are demo content.
 */
import { TUXSheet } from "@byted-tiktok/tux-web";
import { IconHeart, TUXIconXMark } from "@byted-tiktok/tux-icons";
import { appFrameSheetChromeProps } from "../../../components/sys/app_frame_sheet_chrome";
import type { PlayableContentId } from "./playable_content";
import "./playable_remix_panel.css";

type Remix = { title: string; author: string; cover: string };
const FOOD_REMIXES: Remix[] = [
  { title: "Shrink yourself into your...", author: "Bella", cover: "/resource/playable-feed/remix/remix-1.jpg" },
  { title: "Feed yourself and beat..", author: "Siyuaan", cover: "/resource/playable-feed/remix/remix-2.jpg" },
  { title: "Sip race with your bestie", author: "Bella", cover: "/resource/playable-feed/remix/remix-3.jpg" },
  { title: "Matcha tower challenge", author: "Siyuaan", cover: "/resource/playable-feed/remix/remix-4.jpg" },
];
/** Remixes of the Spider-man rooftops game (Figma 25716:302513). */
const SPIDER_REMIXES: Remix[] = [
  { title: "Pixel Spidey drops into Brooklyn", author: "Bella", cover: "/resource/playable-feed/remix/spider-1.jpg" },
  { title: "Dodge the blasts downtown", author: "Siyuaan", cover: "/resource/playable-feed/remix/spider-2.jpg" },
  { title: "Swing past the skyline", author: "Bella", cover: "/resource/playable-feed/remix/spider-3.jpg" },
  { title: "Wall-crawl to the rooftop", author: "Siyuaan", cover: "/resource/playable-feed/remix/spider-4.jpg" },
];
/** Demo remixes per feed playable; the rest share the food set. */
const REMIXES_BY_CONTENT: Partial<Record<PlayableContentId, Remix[]>> = { "playable-rooftops": SPIDER_REMIXES };
const REMIX_COUNT = 8;

export function PlayableRemixPanel({ contentId, visible, onVisibleChange, root, onDescribe, onRemix }: {
  /** The playable whose remixes are listed. */
  contentId: PlayableContentId;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  /** The play-mode overlay, so the sheet sits inside the phone frame above the playable. */
  root: HTMLElement | null;
  /** "Describe your idea…": write a remix prompt in the Playable composer. */
  onDescribe: () => void;
  /** Remix button: tweak this playable directly in the GUI editor. */
  onRemix: () => void;
}) {
  return (
    <TUXSheet {...appFrameSheetChromeProps()} visible={visible} onVisibleChange={onVisibleChange} root={root}
      position="bottom" heightModePreset="auto" closeOnOutsideClick dragHandle="hidden" draggable sheetBackgroundColor="UISheetFlat1">
      <section className="playable-remix" data-electron-smooth-corner aria-label={`Remix ${REMIX_COUNT}`}>
        <header className="playable-remix-nav">
          <h2>Remix {REMIX_COUNT}</h2>
          {/* Pointer-down is kept from the draggable sheet so a tap on ✕ always closes rather than starting a drag. */}
          <button type="button" className="playable-remix-close" aria-label="Close"
            onPointerDown={event => event.stopPropagation()} onClick={() => onVisibleChange(false)}>
            <TUXIconXMark size={24} />
          </button>
        </header>
        <div className="playable-remix-grid">
          {(REMIXES_BY_CONTENT[contentId] ?? FOOD_REMIXES).map(remix => (
            <article key={remix.cover} className="playable-remix-card">
              <img className="playable-remix-cover" data-electron-smooth-corner src={remix.cover} alt="" draggable={false} />
              <p className="playable-remix-title">{remix.title}</p>
              <div className="playable-remix-meta">
                <span><img src="/resource/playable-feed/remix/avatar.png" alt="" />{remix.author}</span>
                <span><IconHeart width={16} height={16} />166</span>
              </div>
            </article>
          ))}
        </div>
        <div className="playable-remix-dock">
          <div className="playable-remix-input" data-electron-smooth-corner>
            <button type="button" className="playable-remix-describe" onClick={onDescribe}>
              {/* Figma "Icon": tilted AI sparkles at 50% with a soft shadow, art bleeding past its 22px frame. */}
              <span className="playable-remix-describe-icon" aria-hidden="true"><img src="/resource/playable-feed/remix/describe-icon.svg" alt="" /></span>
              <span className="playable-remix-describe-text">Describe your idea...</span>
            </button>
            <button type="button" className="playable-remix-go" onClick={onRemix}>Remix</button>
            {/* Figma "Dark color": a soft blue glow along the pill's bottom edge, as wide as the pill. */}
            <span className="playable-remix-glow" aria-hidden="true"><img src="/resource/playable-feed/remix/input-glow.svg" alt="" /></span>
          </div>
        </div>
      </section>
    </TUXSheet>
  );
}
