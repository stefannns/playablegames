import { TUXSheet, TUXStatusView, TUXTabBar, TUXText, getColorCSSVar } from "@byted-tiktok/tux-web";
import { IllustrationEmptyHumanStar } from "@tiktok-arch/tux-illustration/web";
import {
  IconMagnifyingGlass,
  IconMicrophone,
  IconMicrophoneSlash,
  IconMusicNoteSAlt,
  IconMusicNoteSAltSlash,
  IconSpeaker2LTR,
} from "@byted-tiktok/tux-icons";
import { useEffect, useMemo, useRef, useState, type ComponentType, type SVGProps } from "react";
import { showAppFrameTopToast } from "../../../../components/sys/app_frame_top_toast";
import { musicPanelSheetChromeProps } from "./music_panel_sheet_chrome";
import {
  MUSIC_TABS,
  SOUND_MODES,
  HOT_CHIPS,
  DEFAULT_FAVORITE_TRACK_IDS,
  favoriteTracksFromIds,
  findTabForTrackId,
  findTrackBySoundName,
  tracksForMusicTab,
  type MusicTabKey,
  type MusicTrack,
  type SoundModeKey,
} from "./music_data";
import { MusicRow } from "./music_row";
import { TrimPanel } from "./trim_panel";

export type MusicPanelProps = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  /** App-frame root so the sheet is clipped to the phone frame on desktop. */
  root?: HTMLElement | null;
  onSearch?: () => void;
  /** Tapping the Volume mode opens the volume-mixing panel. */
  onOpenVolume?: () => void;
  /** Fired when the user picks or clears a row (updates edit nav "Add sound" pill). */
  onSelectedTrackChange?: (track: MusicTrack | null) => void;
  /** Mirrors the nav pill label so the list highlight stays in sync (demo two-way link). */
  selectedSoundTitle?: string;
  /** Original / Sound / Volume mode bar — edit page on, camera studio off. */
  showSoundModeBar?: boolean;
};

// Default (channel ON) icons.
const MODE_ICONS: Record<SoundModeKey, ComponentType<SVGProps<SVGSVGElement>>> = {
  original: IconMicrophone, // Icon/Microphone
  sound: IconMusicNoteSAlt, // Icon/Music_Note_S_Alt
  volume: IconSpeaker2LTR, // Icon/Speaker_2_LTR
};

// Muted (channel OFF) icons — tapping Original / Sound swaps to the slash glyph
// (Figma node 499:208532: Icon/Microphone_Slash, Icon/Music_Note_S_Alt_Slash).
const MODE_ICONS_MUTED: Partial<Record<SoundModeKey, ComponentType<SVGProps<SVGSVGElement>>>> = {
  original: IconMicrophoneSlash,
  sound: IconMusicNoteSAltSlash,
};

/** Two-stage height (Figma ~55% / 70%) — TUXSheet snapHeights. */
const MUSIC_PANEL_SNAP_HEIGHTS = ["55%", "70%"] as const;
const MUSIC_PANEL_TOP_RADIUS = 12;
const MAX_PAGES = 8;

type Item = { track: MusicTrack; key: string; rank: number };

/**
 * TikTok 配乐面板 — TUXSheet container with draggable 55% / 70% detents;
 * list scrolls inside the sheet body. Loads 30 sounds per page; near-bottom
 * scroll appends more.
 */
export function MusicPanel({
  visible,
  onVisibleChange,
  root,
  onSearch,
  onOpenVolume,
  onSelectedTrackChange,
  selectedSoundTitle,
  showSoundModeBar = true,
}: MusicPanelProps) {
  const [activeTab, setActiveTab] = useState<MusicTabKey>("foryou");
  // Original / Sound are per-channel mute toggles; a key in the set = muted (slash icon).
  const [mutedModes, setMutedModes] = useState<Set<SoundModeKey>>(() => new Set());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => [...DEFAULT_FAVORITE_TRACK_IDS]);
  const [activeChip, setActiveChip] = useState(0);
  const [trimTrack, setTrimTrack] = useState<MusicTrack | null>(null);
  const [pages, setPages] = useState(1);

  const activeTabRef = useRef(activeTab);
  const activeChipRef = useRef(activeChip);
  activeTabRef.current = activeTab;
  activeChipRef.current = activeChip;

  const savedTracks = useMemo(() => favoriteTracksFromIds(favoriteIds), [favoriteIds]);
  const savedTracksRef = useRef(savedTracks);
  savedTracksRef.current = savedTracks;

  // Keep list highlight aligned with the nav pill (top → panel).
  // If the track is already on the current tab, only highlight — do not jump tabs.
  useEffect(() => {
    if (!selectedSoundTitle) {
      setSelectedKey(null);
      return;
    }
    const track = findTrackBySoundName(selectedSoundTitle);
    if (!track) return;

    const currentPool = tracksForMusicTab(
      activeTabRef.current,
      activeChipRef.current,
      savedTracksRef.current,
    );
    if (currentPool.some((t) => t.id === track.id)) {
      setSelectedKey(`${track.id}-0`);
      return;
    }

    const tab =
      savedTracksRef.current.some((t) => t.id === track.id)
        ? "favorites"
        : findTabForTrackId(track.id);
    setActiveTab(tab);
    setPages(1);
    setSelectedKey(`${track.id}-0`);
  }, [selectedSoundTitle]);

  const pool = tracksForMusicTab(activeTab, activeChip, savedTracks);

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    const pageCount = activeTab === "favorites" ? 1 : pages;
    for (let p = 0; p < pageCount; p++) {
      pool.forEach((t, i) => out.push({ track: t, key: `${t.id}-${p}`, rank: p * pool.length + i + 1 }));
    }
    return out;
  }, [activeTab, pages, pool]);

  const toggleFavorite = (trackId: string) => {
    setFavoriteIds((prev) => {
      if (prev.includes(trackId)) {
        if (selectedKey?.startsWith(`${trackId}-`)) {
          setSelectedKey(null);
        }
        return prev.filter((id) => id !== trackId);
      }
      showAppFrameTopToast({ text: "Sound saved", duration: 1500, displayMode: "replace" });
      return [...prev, trackId];
    });
  };

  const onListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (activeTab === "favorites") return;
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 280) {
      setPages((p) => (p < MAX_PAGES ? p + 1 : p));
    }
  };

  if (!root) return null;

  return (
    <>
      <TUXSheet
        visible={visible}
        onVisibleChange={onVisibleChange}
        {...musicPanelSheetChromeProps({
          root,
          position: "bottom",
          snapHeights: [...MUSIC_PANEL_SNAP_HEIGHTS],
          draggable: true,
          dragHandle: "auto",
          closeOnOutsideClick: true,
          sheetBackgroundColor: "UISheetFlat1",
          testId: "edit-music-panel-sheet",
        })}
      >
        <div
          className="flex h-full min-h-0 flex-col overflow-hidden"
          style={{
            backgroundColor: getColorCSSVar("UISheetFlat1"),
            borderTopLeftRadius: MUSIC_PANEL_TOP_RADIUS,
            borderTopRightRadius: MUSIC_PANEL_TOP_RADIUS,
          }}
        >
          {/* Header — tab indicator above a separate full-width hairline (not stacked). */}
          <div className="shrink-0" style={{ paddingTop: 12 }}>
            <div className="flex items-center">
              <div className="min-w-0 flex-1">
                <TUXTabBar
                  testId="edit-music-panel-tab-bar"
                  items={MUSIC_TABS.map((tab) => ({
                    itemKey: tab.itemKey,
                    title: tab.title,
                  }))}
                  activeKey={activeTab}
                  onChange={(key: string) => {
                    setActiveTab(key as MusicTabKey);
                    setPages(1);
                  }}
                  fitContent
                  fixedSpacing
                  showSeparator={false}
                  showFadingEdge={false}
                />
              </div>
              <button
                type="button"
                aria-label="Search sounds"
                onClick={onSearch}
                className="flex shrink-0 items-center justify-center"
                style={{ width: 44, height: 44, color: getColorCSSVar("UIText1") }}
              >
                <IconMagnifyingGlass width={24} height={24} />
              </button>
            </div>
            <div
              style={{
                height: "0.5px",
                backgroundColor: getColorCSSVar("UIShapeNeutral3"),
              }}
            />
          </div>

          {/* Sound list — native scroll, 30/page + infinite load. Hot = ranked + chips. */}
          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain hide-scrollbar"
            style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}
            onScroll={onListScroll}
          >
            {activeTab === "hot" && (
              <div className="flex w-full overflow-x-auto hide-scrollbar" style={{ gap: 8, padding: "12px 16px" }}>
                {HOT_CHIPS.map((chip, i) => {
                  const on = activeChip === i;
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setActiveChip(i);
                        setPages(1);
                      }}
                      className="flex shrink-0 items-center"
                      style={{
                        height: 32,
                        padding: "0 14px",
                        borderRadius: 999,
                        backgroundColor: getColorCSSVar(on ? "UIText1" : "UIShapeNeutral4"),
                      }}
                    >
                      <TUXText
                        as="span"
                        typographyPreset="H4-Semibold"
                        color={on ? "UIShapeText1OnNeutral" : "UIText1"}
                      >
                        {chip}
                      </TUXText>
                    </button>
                  );
                })}
              </div>
            )}
            {activeTab === "favorites" && items.length === 0 ? (
              <div className="px-4" style={{ paddingTop: 32, paddingBottom: 24 }}>
                <TUXStatusView
                  title="No favorites yet"
                  message="Add sound to Favorites to find or use it later"
                  image={<IllustrationEmptyHumanStar />}
                />
              </div>
            ) : (
              items.map((it) => (
                <MusicRow
                  key={it.key}
                  track={it.track}
                  rank={activeTab === "hot" ? it.rank : undefined}
                  selected={selectedKey === it.key}
                  bookmarked={favoriteIds.includes(it.track.id)}
                  onSelect={() => {
                    if (selectedKey === it.key) {
                      setSelectedKey(null);
                      onSelectedTrackChange?.(null);
                      return;
                    }
                    setSelectedKey(it.key);
                    onSelectedTrackChange?.(it.track);
                  }}
                  onTrim={() => setTrimTrack(it.track)}
                  onBookmark={() => toggleFavorite(it.track.id)}
                />
              ))
            )}
          </div>

          {showSoundModeBar ? (
            <div
              className="flex shrink-0 flex-col"
              style={{
                backgroundColor: getColorCSSVar("UISheetFlat1"),
                boxShadow: "0px 12px 25px rgba(0,0,0,0.1)",
              }}
            >
              <div className="flex w-full items-center" style={{ paddingTop: 6 }}>
                {SOUND_MODES.map((mode) => {
                  const muted = mutedModes.has(mode.key);
                  const Icon = (muted && MODE_ICONS_MUTED[mode.key]) || MODE_ICONS[mode.key];
                  const toggleMute = () =>
                    setMutedModes((prev) => {
                      const next = new Set(prev);
                      next.has(mode.key) ? next.delete(mode.key) : next.add(mode.key);
                      return next;
                    });
                  return (
                    <button
                      key={mode.key}
                      type="button"
                      onClick={() => (mode.key === "volume" ? onOpenVolume?.() : toggleMute())}
                      className="flex min-w-0 flex-1 flex-col items-center"
                      style={{ gap: 4, color: getColorCSSVar("UIText1") }}
                      aria-pressed={muted}
                    >
                      <Icon width={24} height={24} />
                      <TUXText as="span" typographyPreset="P3-Semibold" color="UIText1">
                        {mode.label}
                      </TUXText>
                    </button>
                  );
                })}
              </div>
              <div className="relative w-full" style={{ height: 34 }}>
                <div
                  className="absolute left-1/2 -translate-x-1/2 rounded-full"
                  style={{
                    bottom: 8,
                    width: 140,
                    height: 5,
                    backgroundColor: getColorCSSVar("UIImageOverlayBlack"),
                  }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </TUXSheet>

      {/* Trim panel (tapping a selected row's scissors). */}
      {trimTrack ? (
        <TrimPanel
          track={trimTrack}
          visible
          root={root}
          onCancel={() => setTrimTrack(null)}
          onDone={() => setTrimTrack(null)}
        />
      ) : null}
    </>
  );
}
