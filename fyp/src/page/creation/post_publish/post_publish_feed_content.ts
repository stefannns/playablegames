import type {
  FeedItemCardContent,
  FeedPhotoTextSlide,
} from "../../home/components/feed_item_card";
import { localAvatarUrlForDisplay } from "../../../utils/local_avatar";
import { POST_PUBLISH_PREVIEW_DEMO_COUNTS } from "./post_publish_constants";
import type { PostPublishDraft, PostPublishMediaItem } from "./post_publish_types";

function toFeedSlide(item: PostPublishMediaItem): FeedPhotoTextSlide {
  if (item.kind === "image") {
    return { kind: "image", src: item.src };
  }
  if (item.kind === "video") {
    return { kind: "image", src: item.posterSrc };
  }
  return {
    kind: "text-image",
    templateId: item.templateId,
    text: item.text,
  };
}

/** Legacy `images[]` for feed metadata — image src or empty for text-image slides. */
function legacyImageSrc(slide: FeedPhotoTextSlide): string {
  if (slide.kind === "image") return slide.src;
  return "";
}

export function buildPostPublishPreviewSlides(
  media: readonly PostPublishMediaItem[],
): FeedPhotoTextSlide[] {
  return media.map(toFeedSlide);
}

export function buildPostPublishPreviewFeedContent(
  draft: PostPublishDraft,
): FeedItemCardContent {
  const title = draft.title || "Add a catchy title";
  const description =
    draft.description ||
    "Write a long description can help get 3x more views on average.";
  const avatarUrl = localAvatarUrlForDisplay(44, 1);
  const slides = buildPostPublishPreviewSlides(draft.media);
  const images = slides.map(legacyImageSrc);

  return {
    id: "post-publish-preview",
    mediaType: "image",
    mediaSrc: images.find(Boolean) ?? "",
    mediaAlt: "Publish preview cover",
    nickname: "You",
    description,
    avatarUrl,
    musicTitle: "Original sound - You",
    musicCoverUrl: avatarUrl,
    ...POST_PUBLISH_PREVIEW_DEMO_COUNTS,
    photoText: {
      images,
      slides,
      title,
      desc: description,
    },
  };
}
