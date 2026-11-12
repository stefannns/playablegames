import { useEffect, useState } from "react";

import type { MusicTrack } from "./music_data";
import { MusicPanel } from "./music_panel";
import { SoundSearchOverlay } from "./sound_search_overlay";
import { VolumePanel } from "./volume_panel";

export type EditMusicPanelOverlayProps = {
  panelOpen: boolean;
  onPanelOpenChange: (open: boolean) => void;
  volumeOpen: boolean;
  onVolumeOpenChange: (open: boolean) => void;
  onSelectedSoundChange?: (track: MusicTrack | null) => void;
  /** Nav pill label to mirror in the panel list (panel → top uses onSelectedSoundChange). */
  selectedSoundTitle?: string;
  /** Original / Sound / Volume bar — shown on edit, hidden on camera studio. */
  showSoundModeBar?: boolean;
  /** Discover more sounds — leaves the stack for the routed discover page. */
  onOpenSoundDiscover?: () => void;
};

/**
 * Shared sound-selection stack for photo / video edit (配乐面板).
 * Portals into AppFrame so the sheet covers the full phone frame on desktop.
 */
export function EditMusicPanelOverlay({
  panelOpen,
  onPanelOpenChange,
  volumeOpen,
  onVolumeOpenChange,
  onSelectedSoundChange,
  selectedSoundTitle,
  showSoundModeBar = true,
  onOpenSoundDiscover,
}: EditMusicPanelOverlayProps) {
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [soundSearchOpen, setSoundSearchOpen] = useState(false);

  useEffect(() => {
    setRoot(
      document.querySelector<HTMLElement>("[data-app-frame-root='true']"),
    );
  }, []);

  return (
    <>
      <MusicPanel
        visible={panelOpen}
        onVisibleChange={onPanelOpenChange}
        root={root}
        onSearch={() => setSoundSearchOpen(true)}
        onOpenVolume={() => {
          onPanelOpenChange(false);
          onVolumeOpenChange(true);
        }}
        onSelectedTrackChange={(track) => onSelectedSoundChange?.(track)}
        selectedSoundTitle={selectedSoundTitle}
        showSoundModeBar={showSoundModeBar}
      />

      <SoundSearchOverlay
        visible={soundSearchOpen}
        root={root}
        onClose={() => setSoundSearchOpen(false)}
        onDiscover={
          onOpenSoundDiscover
            ? () => {
                setSoundSearchOpen(false);
                onOpenSoundDiscover();
              }
            : undefined
        }
      />

      <VolumePanel
        visible={volumeOpen}
        root={root}
        onDone={() => {
          onVolumeOpenChange(false);
          onPanelOpenChange(true);
        }}
      />
    </>
  );
}
