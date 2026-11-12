import { useCallback, useState } from "react";

import { useAppNavigation } from "../../../../context/app_navigation";
import {
  addSoundPath,
  soundDiscoverPath,
  soundSearchOriginFromRoute,
} from "../../../../routes/app_route_tree";
import type { MusicTrack } from "./music_data";
import { EditMusicPanelOverlay } from "./edit_music_panel_overlay";

export type EditMusicPanelNavProps = {
  soundName?: string;
  onSoundClick?: () => void;
  onSoundDismiss?: () => void;
};

export type UseEditMusicPanelChromeOptions = {
  /** Extra nav label to mirror in the panel (e.g. camera effect default sound). */
  activeSoundTitle?: string;
  /** Original / Sound / Volume bar — edit on, camera studio off (default true). */
  showSoundModeBar?: boolean;
  /** Called when the user picks or clears a track in the panel list. */
  onSelectedSoundChange?: (track: MusicTrack | null) => void;
};

/**
 * Shared state for the 配乐面板 + nav "Add sound" pill (empty or showing a track).
 * Tapping the pill always opens the panel; × clears the selection.
 */
export function useEditMusicPanelChrome(options?: UseEditMusicPanelChromeOptions) {
  const { route, navigate } = useAppNavigation();
  const [musicPanelOpen, setMusicPanelOpen] = useState(false);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const soundChromeFaded = musicPanelOpen || volumeOpen;
  const [selectedSoundName, setSelectedSoundName] = useState<string | undefined>();
  const activeSoundTitle = options?.activeSoundTitle;
  const showSoundModeBar = options?.showSoundModeBar ?? true;
  const onSelectedSoundChangeExtra = options?.onSelectedSoundChange;
  const panelSyncTitle = selectedSoundName ?? activeSoundTitle;
  const soundSearchOrigin = soundSearchOriginFromRoute(route);

  const openMusicPanel = useCallback(() => {
    setMusicPanelOpen(true);
  }, []);

  const openAddSound = useCallback(() => {
    navigate(addSoundPath(soundSearchOrigin));
  }, [navigate, soundSearchOrigin]);

  const openSoundDiscover = useCallback(() => {
    navigate(soundDiscoverPath(soundSearchOrigin));
  }, [navigate, soundSearchOrigin]);

  const dismissSelectedSound = useCallback(() => {
    setSelectedSoundName(undefined);
  }, []);

  const soundNavProps: EditMusicPanelNavProps = {
    soundName: selectedSoundName,
    onSoundClick: openMusicPanel,
    onSoundDismiss: dismissSelectedSound,
  };

  const handleSelectedSoundChange = useCallback(
    (track: MusicTrack | null) => {
      setSelectedSoundName(track?.title);
      onSelectedSoundChangeExtra?.(track);
    },
    [onSelectedSoundChangeExtra],
  );

  const musicPanelOverlay = (
    <EditMusicPanelOverlay
      panelOpen={musicPanelOpen}
      onPanelOpenChange={setMusicPanelOpen}
      volumeOpen={volumeOpen}
      onVolumeOpenChange={setVolumeOpen}
      onSelectedSoundChange={handleSelectedSoundChange}
      selectedSoundTitle={panelSyncTitle}
      showSoundModeBar={showSoundModeBar}
      onOpenSoundDiscover={openSoundDiscover}
    />
  );

  return {
    musicPanelOpen,
    soundChromeFaded,
    setMusicPanelOpen,
    selectedSoundName,
    setSelectedSoundName,
    soundNavProps,
    openMusicPanel,
    openAddSound,
    dismissSelectedSound,
    musicPanelOverlay,
  };
}
