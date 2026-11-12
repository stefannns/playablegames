/** Comment panel static images under `public/resource/video_mock/comment_image/`. */

export const COMMENT_IMAGE_BASE = "/resource/video_mock/comment_image";

export const COMMENT_COFFEE_SHOP_IMAGES = {
  devocionAtrium: `${COMMENT_IMAGE_BASE}/coffee_shop/devocion-atrium.jpg`,
  devocionYellowMug: `${COMMENT_IMAGE_BASE}/coffee_shop/devocion-yellow-mug.jpg`,
  laCabraRoom: `${COMMENT_IMAGE_BASE}/coffee_shop/la-cabra-room.jpg`,
  omaRoom: `${COMMENT_IMAGE_BASE}/coffee_shop/oma-room.jpg`,
  omaMacarons: `${COMMENT_IMAGE_BASE}/coffee_shop/cokkies.jpg`,
  seyRoastery: `${COMMENT_IMAGE_BASE}/coffee_shop/sey-roastery.jpg`,
  seyMeme: `${COMMENT_IMAGE_BASE}/coffee_shop/meme.jpg`,
  felixInterior: `${COMMENT_IMAGE_BASE}/coffee_shop/felix-interior.jpg`,
  abracoCounter: `${COMMENT_IMAGE_BASE}/coffee_shop/abraco-counter.jpg`,
  notAsBitterFacade: `${COMMENT_IMAGE_BASE}/coffee_shop/not-as-bitter-facade.jpg`,
} as const;

export const COMMENT_COFFEE_SHOP_IMAGE_LIST = Object.values(COMMENT_COFFEE_SHOP_IMAGES);

export const COMMENT_STICKER_IMAGES = {
  wide: `${COMMENT_IMAGE_BASE}/stickers/comment-res-4dbe9d.webp`,
  card: `${COMMENT_IMAGE_BASE}/stickers/comment-res-c766fb.webp`,
} as const;

export const COMMENT_WIKI_INFOGRAPH_IMAGES = {
  croissant: `${COMMENT_IMAGE_BASE}/wiki/comment-wiki-croissant.webp`,
  tiktok: `${COMMENT_IMAGE_BASE}/wiki/comment-wiki-tiktok.webp`,
  laminatedPastry: `${COMMENT_IMAGE_BASE}/wiki/comment-wiki-laminated-pastry.webp`,
  parisianCafe: `${COMMENT_IMAGE_BASE}/wiki/comment-wiki-parisian-cafe.webp`,
} as const;

/** Default portrait image for the comment content editor. */
export const COMMENT_DEFAULT_EDITOR_IMAGE = COMMENT_COFFEE_SHOP_IMAGES.devocionAtrium;

const LEGACY_COMMENT_IMAGE_PREFIX = "/resource/comment_image/";
const DELETED_COVER_PATTERN = /\/cover-(01|03|04|06|12|18|22)\.jpg(?:\?.*)?$/;

/** Rewrite stale comment image URLs (localStorage / old presets) to current public paths. */
export function migrateCommentImageUrl(
  url: string,
  fallback: string = COMMENT_DEFAULT_EDITOR_IMAGE,
): string {
  const trimmed = url.trim();
  if (!trimmed) return fallback;

  if (trimmed.startsWith(LEGACY_COMMENT_IMAGE_PREFIX)) {
    return trimmed.replace(LEGACY_COMMENT_IMAGE_PREFIX, `${COMMENT_IMAGE_BASE}/`);
  }

  if (trimmed.startsWith(COMMENT_IMAGE_BASE)) return trimmed;

  const fileName = trimmed.split("/").pop()?.split("?")[0] ?? "";
  if (fileName.startsWith("comment-res-")) {
    return `${COMMENT_IMAGE_BASE}/stickers/${fileName}`;
  }
  if (fileName.startsWith("comment-wiki-")) {
    return `${COMMENT_IMAGE_BASE}/wiki/${fileName}`;
  }

  if (DELETED_COVER_PATTERN.test(trimmed) || /^https?:\/\/picsum\.photos\//.test(trimmed)) {
    return fallback;
  }

  if (trimmed.includes("/assets/figma/comment/")) {
    return migrateCommentImageUrl(fileName, fallback);
  }

  return trimmed;
}
