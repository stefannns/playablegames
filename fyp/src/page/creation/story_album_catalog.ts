import { localFeedVerticalCoverUrl } from "../../utils/local_media_placeholder";

/** Permanent local placeholders shown ahead of the generated grid tiles. */
const PINNED_MEDIA: string[] = [
  "/resource/video_mock/story_picker/picker-01.png",
  "/resource/video_mock/story_picker/picker-02.png",
  "/resource/video_mock/story_picker/picker-03.png",
  "/resource/video_mock/story_picker/picker-04.png",
];

/** Inserted at the 8th album photo (0-based index 7); everything after shifts back. */
const EXTRA_MEDIA_SRC = "/resource/video_mock/story_picker/picker-05.png";
const EXTRA_MEDIA_INDEX = 7;

const GRID_TILE_COUNT = 17;

/** Stable pseudo-random favorites (~6 of 22 tiles). Index 8 (9th tile) is plain photo. */
const FAVORITE_INDICES = new Set([1, 4, 11, 15, 19]);

/** Stable pseudo-random videos (~6 of 22 tiles). */
const VIDEO_INDICES = new Set([2, 6, 10, 14, 17, 21]);

const VIDEO_DURATION_SECONDS = [9, 14, 23, 31, 47, 62];

export type StoryAlbumMediaTab = "All" | "Favorites" | "Photos" | "Videos";

export type StoryAlbumItem = {
  id: string;
  src: string;
  isFavorite: boolean;
  isVideo: boolean;
  /** Present when {@link StoryAlbumItem.isVideo} — `MM:SS` per Figma App/P3-Medium. */
  durationLabel?: string;
};

function buildPhotoSources(): string[] {
  const sources = [
    ...PINNED_MEDIA,
    ...Array.from({ length: GRID_TILE_COUNT }, (_, index) =>
      localFeedVerticalCoverUrl(index + 1),
    ),
  ];
  sources.splice(EXTRA_MEDIA_INDEX, 0, EXTRA_MEDIA_SRC);
  return sources;
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function buildStoryAlbumCatalog(): StoryAlbumItem[] {
  let videoSlot = 0;

  return buildPhotoSources().map((src, index) => {
    const isVideo = VIDEO_INDICES.has(index);
    const isFavorite = FAVORITE_INDICES.has(index);

    return {
      id: `${src}-${index}`,
      src,
      isFavorite,
      isVideo,
      durationLabel: isVideo
        ? formatDuration(VIDEO_DURATION_SECONDS[videoSlot++ % VIDEO_DURATION_SECONDS.length])
        : undefined,
    };
  });
}

/** Built once — tile metadata stays stable for tab filtering and grid badges. */
export const STORY_ALBUM_CATALOG = buildStoryAlbumCatalog();

export function storyAlbumItemMatchesTab(
  item: StoryAlbumItem,
  tab: StoryAlbumMediaTab,
): boolean {
  switch (tab) {
    case "All":
      return true;
    case "Favorites":
      return item.isFavorite;
    case "Photos":
      return !item.isVideo;
    case "Videos":
      return item.isVideo;
    default:
      return true;
  }
}

export function storyAlbumShowsCameraCell(tab: StoryAlbumMediaTab): boolean {
  return tab === "All";
}
