/**
 * 竖版封面 / Feed 视频占位（勿在业务配置里写 picsum 外链）。
 *
 * - 静态 9:16 封面：`public/resource/video_mock/`（优先 `empty_shots/`、`people_outdoor/` 的 `cover-NN.jpg`）
 * - 可播 MP4：`public/resource/feed_video/video-NN.mp4`（详见 `public/resource/feed_video/README.md`）
 */

const FEED_VIDEO = "/resource/feed_video";
const VIDEO_EMPTY = "/resource/video_mock/empty_shots";
const VIDEO_PEOPLE = "/resource/video_mock/people_outdoor";

/** Bump when replacing an MP4 in place (same filename) so browsers bypass stale cache. */
export const FEED_VIDEO_CACHE_VERSION = 2;

// Removed cover-01,03,04,06,12,18,22; cycle only remaining slots.
const AVAILABLE_COVER_SLOTS = [
  2, 5, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 19, 20, 21, 23, 24, 25, 26, 27, 28, 29, 30,
] as const;

function coverNn(feedIndex: number): string {
  const slot = AVAILABLE_COVER_SLOTS[(feedIndex - 1) % AVAILABLE_COVER_SLOTS.length]!;
  return String(slot).padStart(2, "0");
}

function videoNn(videoSlot: number): string {
  const n = ((videoSlot - 1) % 30) + 1;
  return String(n).padStart(2, "0");
}

/**
 * Full-screen feed card background (9:16). Odd `feedIndex` → empty_shots, even → people_outdoor.
 */
export function localFeedVerticalCoverUrl(feedIndex: number): string {
  const nn = coverNn(feedIndex);
  const base = feedIndex % 2 === 1 ? VIDEO_EMPTY : VIDEO_PEOPLE;
  return `${base}/cover-${nn}.jpg`;
}

/**
 * Home feed inline video (`mediaType: "video"`). Files live in
 * `public/resource/feed_video/` as `video-NN.mp4` (NN = 1-based slot).
 */
export function localFeedVideoUrl(videoSlot: number): string {
  const nn = videoNn(videoSlot);
  return `${FEED_VIDEO}/video-${nn}.mp4?v=${FEED_VIDEO_CACHE_VERSION}`;
}

/**
 * Poster before play / iOS static fallback — reuses `video_mock` covers
 * (`localFeedVerticalCoverUrl`). For a slot-specific file, use
 * `localFeedVideoPosterAssetUrl` and place JPG under `feed_video/posters/`.
 */
export function localFeedVideoPosterUrl(posterFeedIndex: number): string {
  return localFeedVerticalCoverUrl(posterFeedIndex);
}

/** Optional poster co-located with the MP4: `posters/video-NN.jpg`. */
export function localFeedVideoPosterAssetUrl(videoSlot: number): string {
  const nn = videoNn(videoSlot);
  return `${FEED_VIDEO}/posters/video-${nn}.jpg`;
}

/** Bottom music disc thumbnail (~40px); reuses avatar small pool for a crisp square crop. */
export function localMusicCoverUrl(feedIndex: number): string {
  const n = ((feedIndex - 1) % 60) + 1;
  return `/resource/avatar/small/avatar-${String(n).padStart(2, "0")}.jpg`;
}

/** Profile grid cells (~3:4); `thumbIndex` 1-based, cycles 30 covers per folder. */
export function localProfileVideoThumbUrl(thumbIndex: number): string {
  const nn = coverNn(thumbIndex);
  const base = thumbIndex % 2 === 1 ? VIDEO_EMPTY : VIDEO_PEOPLE;
  return `${base}/cover-${nn}.jpg`;
}

