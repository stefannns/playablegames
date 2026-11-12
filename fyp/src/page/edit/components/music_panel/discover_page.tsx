import { TUXText, getColorCSSVar } from "@byted-tiktok/tux-web";
import {
  IconMagnifyingGlass,
  IconPlayFill,
  IconBookmark,
  IconScissors,
  IconTrashBinFill,
} from "@byted-tiktok/tux-icons";
import { useState } from "react";
import { useAppFrame } from "../../../../components/sys/app_frame";
import { SoundPanelTuxNavBar } from "./sound_panel_nav";
import {
  DISCOVER_TABS,
  DISCOVER_SOUNDS,
  PLAYLISTS,
  figmaCover,
  FIGMA_BANNER,
  type MusicTrack,
  type Playlist,
} from "./music_data";

export type DiscoverPageProps = {
  onClose: () => void;
  /** Tapping the search bar returns to the routed search page. */
  onSearchTap: () => void;
};

/** Sound cell — Figma "Cell/False" (390×84): 64px cover + play, name/artist/duration, bookmark. */
function SoundCell({ track, onPlay }: { track: MusicTrack; onPlay: () => void }) {
  return (
    <div className="flex w-full items-center" style={{ height: 84, gap: 12, padding: "10px 16px" }}>
      <button type="button" onClick={onPlay} className="relative shrink-0 overflow-hidden" style={{ width: 64, height: 64, borderRadius: 4 }}>
        <img src={figmaCover(track.coverSlot)} alt="" loading="lazy" className="h-full w-full object-cover" />
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            color: getColorCSSVar("UIImageOverlayWhite"),
            filter: `drop-shadow(0 1px 1px ${getColorCSSVar("UIImageOverlayBlackA15")})`,
          }}
        >
          <IconPlayFill width={24} height={24} />
        </span>
      </button>
      <button type="button" onClick={onPlay} className="flex min-w-0 flex-1 flex-col text-left" style={{ gap: 4 }}>
        <div className="flex min-w-0 flex-col" style={{ gap: 2 }}>
          <TUXText as="div" typographyPreset="H4-Semibold" color="UIText1" textDisplay="truncate">{track.title}</TUXText>
          <TUXText as="div" typographyPreset="P2-Regular" color="UIText3" textDisplay="truncate">{track.artist}</TUXText>
        </div>
        <TUXText as="div" typographyPreset="P3-Regular" color="UIText3" textDisplay="truncate">{track.duration}</TUXText>
      </button>
      <button type="button" aria-label="Save" className="flex shrink-0 items-center" style={{ color: getColorCSSVar("UIText1") }}>
        <IconBookmark width={20} height={20} />
      </button>
    </div>
  );
}

/** Playlist chip — Figma "Playlists" (168×44): UIShapeNeutral4 capsule, 28px cover + name. */
function PlaylistChip({ playlist }: { playlist: Playlist }) {
  return (
    <button
      type="button"
      className="flex shrink-0 items-center overflow-hidden"
      style={{ width: 168, gap: 8, padding: 8, borderRadius: 8, backgroundColor: getColorCSSVar("UIShapeNeutral4") }}
    >
      <img src={figmaCover(playlist.coverSlot)} alt="" loading="lazy" className="shrink-0 object-cover" style={{ width: 28, height: 28, borderRadius: 9 }} />
      <TUXText as="span" typographyPreset="H4-Regular" color="UIText1" textDisplay="truncate" className="min-w-0 flex-1 text-left">
        {playlist.name}
      </TUXText>
    </button>
  );
}

/** Floating music bar (mini player) — Figma node 25616:8483, shown while a sound plays. */
function FloatingMusicBar({ track, onClose }: { track: MusicTrack; onClose: () => void }) {
  const ink = getColorCSSVar("UIImageOverlayBlack");
  return (
    <div
      className="flex items-center"
      style={{
        height: 64,
        gap: 20,
        paddingLeft: 12,
        paddingRight: 18,
        borderRadius: 12,
        backgroundColor: getColorCSSVar("UISheetFlat2"),
      }}
    >
      <div className="flex min-w-0 flex-1 items-center" style={{ gap: 12 }}>
        <div className="relative shrink-0 overflow-hidden" style={{ width: 40, height: 40, borderRadius: 4, border: `0.2px solid ${getColorCSSVar("UIShapeNeutral4")}` }}>
          <img src={figmaCover(track.coverSlot)} alt="" className="h-full w-full object-cover" />
          <span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              color: getColorCSSVar("UIImageOverlayWhite"),
              filter: `drop-shadow(0 1px 1px ${getColorCSSVar("UIImageOverlayBlackA15")})`,
            }}
          >
            <IconPlayFill width={16} height={16} />
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center" style={{ gap: 2, color: ink }}>
          <TUXText as="div" typographyPreset="P3-Regular" textDisplay="truncate" style={{ color: ink }}>Current sound</TUXText>
          <TUXText as="div" typographyPreset="H4-Semibold" textDisplay="truncate" style={{ color: ink }}>{track.title}</TUXText>
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-center" style={{ gap: 20, color: ink }}>
        <button type="button" aria-label="Trim"><IconScissors width={20} height={20} /></button>
        <button type="button" aria-label="Save"><IconBookmark width={20} height={20} /></button>
        <button type="button" aria-label="Remove" onClick={onClose}><IconTrashBinFill width={20} height={20} /></button>
      </div>
    </div>
  );
}

/**
 * Discover page (Figma "Sound Found Page", node 25616:8377). Reached from
 * "Discover more sounds". Tapping a sound plays it → floating music bar appears
 * (Figma node 25616:8449 / 25616:8483).
 */
export function DiscoverPage({ onClose, onSearchTap }: DiscoverPageProps) {
  const { topInsetCss, bottomInsetCss } = useAppFrame();
  const [activeTab, setActiveTab] = useState(0);
  const [playing, setPlaying] = useState<MusicTrack | null>(null);
  const hairline = getColorCSSVar("UIShapeNeutral3");
  const rows = [PLAYLISTS.slice(0, 3), PLAYLISTS.slice(3, 6), PLAYLISTS.slice(6, 9)];

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      style={{
        backgroundColor: getColorCSSVar("UISheetFlat1"),
        paddingTop: topInsetCss,
      }}
    >
      <div className="flex w-full shrink-0 flex-col" style={{ paddingBottom: 8 }}>
        <SoundPanelTuxNavBar onBack={onClose} />
        <div className="flex w-full items-center" style={{ height: 44, padding: "0 16px 4px" }}>
          <button type="button" onClick={onSearchTap} className="flex min-w-0 flex-1 items-center" style={{ height: 40, borderRadius: 8, padding: 8, gap: 2, backgroundColor: getColorCSSVar("UIShapeNeutral4") }}>
            <span className="shrink-0" style={{ color: getColorCSSVar("UIText1"), padding: "0 2px" }}><IconMagnifyingGlass width={20} height={20} /></span>
            <TUXText as="span" typographyPreset="Headline-Regular" color="UITextPlaceholder">Search</TUXText>
          </button>
        </div>
      </div>

      {/* Scrollable content. */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain hide-scrollbar">
        {/* Banner carousel. */}
        <div className="relative flex w-full items-center justify-center" style={{ padding: "0 16px 12px" }}>
          <img src={FIGMA_BANNER} alt="" className="w-full object-cover" style={{ height: 94, borderRadius: 10 }} />
          <div className="absolute flex items-center" style={{ bottom: 18, gap: 6 }}>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="rounded-full"
                style={{
                  width: 6,
                  height: 6,
                  backgroundColor: getColorCSSVar(
                    i === 0 ? "UIImageOverlayWhite" : "UIImageOverlayWhiteA40",
                  ),
                }}
              />
            ))}
          </div>
        </div>

        {/* Tab bar. */}
        <div className="relative flex w-full items-stretch justify-between" style={{ height: 40, padding: "0 16px" }}>
          {DISCOVER_TABS.map((tab, i) => {
            const active = activeTab === i;
            return (
              <button key={tab} type="button" onClick={() => setActiveTab(i)} className="relative flex items-center justify-center">
                <TUXText as="span" typographyPreset="H4-Semibold" color={active ? "UIText1" : "UIText3"}>{tab}</TUXText>
                {active && <span className="absolute bottom-0 left-0 right-0" style={{ height: 2, backgroundColor: getColorCSSVar("UIShapeNeutral") }} />}
              </button>
            );
          })}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0" style={{ height: 0, borderBottom: `0.5px solid ${hairline}` }} />
        </div>

        {/* Sound cells (first group). */}
        <div style={{ paddingTop: 2 }}>
          {DISCOVER_SOUNDS.slice(0, 4).map((t) => <SoundCell key={t.id} track={t} onPlay={() => setPlaying(t)} />)}
        </div>

        {/* Playlists. */}
        <div className="flex w-full items-center justify-between" style={{ height: 44, padding: "0 16px" }}>
          <TUXText as="span" typographyPreset="H4-Semibold" color="UIText1">Playlists</TUXText>
          <button type="button"><TUXText as="span" typographyPreset="H4-Semibold" color="UIText3">All</TUXText></button>
        </div>
        <div className="flex w-full flex-col" style={{ gap: 8 }}>
          {rows.map((row, i) => (
            <div key={i} className="flex w-full overflow-x-auto hide-scrollbar" style={{ gap: 8, padding: "0 16px" }}>
              {row.map((p) => <PlaylistChip key={p.name} playlist={p} />)}
            </div>
          ))}
        </div>

        {/* Sound cells (second group). */}
        <div style={{ paddingTop: 12, paddingBottom: playing ? 76 : 0 }}>
          {DISCOVER_SOUNDS.slice(4, 8).map((t) => <SoundCell key={t.id} track={t} onPlay={() => setPlaying(t)} />)}
        </div>
      </div>

      {/* Floating music bar (when a sound is playing). */}
      {playing && (
        <div
          className="absolute left-0 right-0"
          style={{
            bottom: `calc(${bottomInsetCss} + 12px)`,
            padding: "0 16px",
          }}
        >
          <FloatingMusicBar track={playing} onClose={() => setPlaying(null)} />
        </div>
      )}
    </div>
  );
}
