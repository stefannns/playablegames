import { useEffect, useState } from "react";

import { useAppFrame } from "../../../../components/sys/app_frame";
import { useAppNavigation } from "../../../../context/app_navigation";
import {
  soundDiscoverPath,
  type SoundSearchOrigin,
} from "../../../../routes/app_route_tree";
import {
  useAlbumEditPhotos,
  useCreationCapturedPhoto,
} from "../../../creation/creation_studio_store";
import { EDIT_MEDIA_ASPECT } from "../edit_chrome.constants.ts";
import type { MusicTrack } from "./music_data";
import { MusicPanel } from "./music_panel";
import { SoundSearchOverlay } from "./sound_search_overlay";
import { VolumePanel } from "./volume_panel";

/** Camera studio static preview — same asset as `creation_page` DEFAULT_PREVIEW. */
const STUDIO_SOUND_BACKDROP_SRC =
  "/resource/video_mock/creation-camera/camera-preview.png";

export type AddSoundPageProps = {
  onBack: () => void;
  origin?: SoundSearchOrigin;
  onSelectedSoundChange?: (track: MusicTrack | null) => void;
  selectedSoundTitle?: string;
  showSoundModeBar?: boolean;
};

function AddSoundBackdrop({
  origin,
  mediaSrc,
  albumPreviewSrc,
}: {
  origin?: SoundSearchOrigin;
  mediaSrc: string | null;
  albumPreviewSrc?: string;
}) {
  const { topInsetCss } = useAppFrame();

  const editPreviewSrc = mediaSrc ?? albumPreviewSrc ?? null;
  const previewSrc =
    (origin === "edit-photo" || origin === "edit-video") && editPreviewSrc
      ? editPreviewSrc
      : origin === "studio"
        ? STUDIO_SOUND_BACKDROP_SRC
        : null;

  if (!previewSrc) {
    return <div className="absolute inset-0 bg-tux-v2-ui-page-flat-1" aria-hidden />;
  }

  return (
    <div
      className="absolute inset-0 flex flex-col bg-black font-sans text-white"
      style={{ paddingTop: topInsetCss }}
      aria-hidden
    >
      <div
        className="relative w-full shrink-0 overflow-hidden"
        style={{ aspectRatio: EDIT_MEDIA_ASPECT }}
      >
        <img
          src={previewSrc}
          alt=""
          draggable={false}
          className="app-no-img-drag absolute inset-0 size-full object-cover object-top"
        />
      </div>
      <div className="min-h-0 flex-1 bg-black" />
    </div>
  );
}

/** Routed Add sound — music panel sheet; search / discover are follow-up routes. */
export function AddSoundPage({
  onBack,
  origin,
  onSelectedSoundChange,
  selectedSoundTitle,
  showSoundModeBar = true,
}: AddSoundPageProps) {
  const { navigate } = useAppNavigation();
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [soundSearchOpen, setSoundSearchOpen] = useState(false);
  const capturedMedia = useCreationCapturedPhoto();
  const albumPhotos = useAlbumEditPhotos();
  const albumPreviewSrc = albumPhotos?.[0]?.src;

  useEffect(() => {
    setRoot(document.querySelector<HTMLElement>("[data-app-frame-root='true']"));
  }, []);

  return (
    <div className="relative h-full min-h-0 w-full bg-black">
      <AddSoundBackdrop
        origin={origin}
        mediaSrc={capturedMedia}
        albumPreviewSrc={albumPreviewSrc}
      />

      <MusicPanel
        visible
        onVisibleChange={(open) => {
          if (!open) onBack();
        }}
        root={root}
        onSearch={() => setSoundSearchOpen(true)}
        onOpenVolume={() => setVolumeOpen(true)}
        onSelectedTrackChange={(track) => onSelectedSoundChange?.(track)}
        selectedSoundTitle={selectedSoundTitle}
        showSoundModeBar={showSoundModeBar}
      />

      <SoundSearchOverlay
        visible={soundSearchOpen}
        root={root}
        onClose={() => setSoundSearchOpen(false)}
        onDiscover={
          origin
            ? () => {
                setSoundSearchOpen(false);
                navigate(soundDiscoverPath(origin));
              }
            : undefined
        }
      />

      {volumeOpen ? (
        <VolumePanel
          visible
          root={root}
          onDone={() => setVolumeOpen(false)}
        />
      ) : null}
    </div>
  );
}
