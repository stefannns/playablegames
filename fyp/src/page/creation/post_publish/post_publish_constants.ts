import { getPhotoFlowGallerySources } from "../photo_edit_media_catalog";

/** 与 Edit Photo 底栏同源，避免发布页换另一套图。 */
export const POST_PUBLISH_DEMO_IMAGES = getPhotoFlowGallerySources();

export const POST_PUBLISH_PREVIEW_DEMO_COUNTS = {
  likeCount: 824_500,
  commentCount: 12_840,
  favoriteCount: 210_200,
  shareCount: 8_310,
} as const;
