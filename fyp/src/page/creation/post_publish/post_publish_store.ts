import type { CreationPostPublishOrigin } from "../../../routes/app_route_tree";
import { getAlbumEditPhotos, getCreationCapturedPhoto } from "../creation_studio_store";
import { CREATION_PUBLISH_COVER_FEED_INDEX } from "../creation_publish_page.config";
import { buildPhotoEditMediaList } from "../photo_edit_media_catalog";
import { localFeedVerticalCoverUrl } from "../../../utils/local_media_placeholder";
import { POST_PUBLISH_DEMO_IMAGES } from "./post_publish_constants";
import type {
  PostPublishDraft,
  PostPublishMediaItem,
  PostPublishSeed,
} from "./post_publish_types";

export type PostPublishBackTarget =
  | "default"
  | "text-to-image-templates"
  | "edit-photo";

let publishBackTarget: PostPublishBackTarget = "default";
let publishOrigin: CreationPostPublishOrigin = "edit-photo";

const EMPTY_DRAFT: PostPublishDraft = {
  mode: "photo-text",
  title: "",
  description: "",
  media: [],
  initialPreviewIndex: 0,
};

let currentDraft: PostPublishDraft = { ...EMPTY_DRAFT, media: [] };
let draftSeeded = false;
let pendingSeed: PostPublishSeed | null = null;

const POST_PUBLISH_PHOTO_SOURCES_KEY = "postPublish_photoSources";

function persistPhotoPublishSources(sources: readonly string[]) {
  try {
    sessionStorage.setItem(POST_PUBLISH_PHOTO_SOURCES_KEY, JSON.stringify(sources));
  } catch {
    // sessionStorage quota — in-memory draft still works this session.
  }
}

function readPersistedPhotoPublishSources(): readonly string[] | null {
  try {
    const raw = sessionStorage.getItem(POST_PUBLISH_PHOTO_SOURCES_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function clearPersistedPhotoPublishSources() {
  try {
    sessionStorage.removeItem(POST_PUBLISH_PHOTO_SOURCES_KEY);
  } catch {
    // ignore
  }
}

function buildPhotoPublishSourcesFromCapture(): readonly string[] | null {
  const album = getAlbumEditPhotos();
  if (album?.length) {
    return album.map((item) => item.src);
  }
  const captured = getCreationCapturedPhoto();
  if (!captured) return null;
  return buildPhotoEditMediaList(captured).map((item) => item.src);
}

export function isPostPublishDraftSeeded(): boolean {
  return draftSeeded;
}

export function queuePostPublishSeed(seed: PostPublishSeed) {
  pendingSeed = seed;
  if (seed.kind === "photo") {
    persistPhotoPublishSources(seed.sources);
  }
}

export function consumeQueuedPostPublishSeed(): PostPublishSeed | null {
  const seed = pendingSeed;
  pendingSeed = null;
  return seed;
}

function imageMedia(
  id: string,
  src: string,
  badge: string,
  showLivePhoto = false,
): PostPublishMediaItem {
  return { kind: "image", id, src, badge, showLivePhoto };
}

function buildPhotoTextDemoMedia(): PostPublishMediaItem[] {
  return POST_PUBLISH_DEMO_IMAGES.map((src, index) =>
    imageMedia(
      index === 0 ? "cover" : `photo-${index + 1}`,
      src,
      index === 0 ? "Cover" : String(index + 1),
      index > 0,
    ),
  );
}

function buildPhotoMedia(sources: readonly string[]): PostPublishMediaItem[] {
  return sources.map((src, index) =>
    imageMedia(
      index === 0 ? "cover" : `photo-${index + 1}`,
      src,
      index === 0 ? "Cover" : String(index + 1),
    ),
  );
}

function buildVideoMedia(
  coverSrc: string,
  videoSrc?: string,
): PostPublishMediaItem[] {
  return [
    {
      kind: "video",
      id: "cover",
      posterSrc: coverSrc,
      badge: "Cover",
      ...(videoSrc ? { src: videoSrc } : {}),
    },
  ];
}

/** 进入预览前把相机快照写回视频草稿封面（与 Edit Video / 发布页一致）。 */
export function syncVideoPublishPosterFromCapture() {
  const captured = getCreationCapturedPhoto();
  if (!captured || currentDraft.mode !== "video") return;

  const item = currentDraft.media[0];
  if (item?.kind !== "video") return;

  currentDraft = {
    ...currentDraft,
    media: [{ ...item, posterSrc: captured }],
  };
}

function buildTextImageMedia(templateId: number, text: string): PostPublishMediaItem[] {
  return [
    {
      kind: "text-image",
      id: "text-cover",
      templateId,
      text,
      badge: "Cover",
    },
  ];
}

export function postPublishBackTargetForOrigin(
  origin: CreationPostPublishOrigin,
): PostPublishBackTarget {
  if (origin === "text-to-image") return "text-to-image-templates";
  if (origin === "edit-video") return "default";
  return "edit-photo";
}

export function syncPostPublishRouteContext(origin: CreationPostPublishOrigin) {
  publishOrigin = origin;
  publishBackTarget = postPublishBackTargetForOrigin(origin);
}

function readStoredTextToImageSeed(): { templateId: number; text: string } {
  const parsed = Number(localStorage.getItem("textToImage_selectedTemplateId"));
  return {
    templateId: Number.isFinite(parsed) && parsed >= 1 ? parsed : 1,
    text: localStorage.getItem("textToImage_input") ?? "",
  };
}

/** 刷新后按 URL origin 恢复草稿（含拍摄快照 + 伴生图）。 */
export function seedPostPublishFromRouteOrigin(origin: CreationPostPublishOrigin) {
  syncPostPublishRouteContext(origin);
  if (origin === "text-to-image") {
    const { templateId, text } = readStoredTextToImageSeed();
    seedPostPublishDraft({ kind: "text-to-image", templateId, text }, origin);
    return;
  }
  if (origin === "edit-video") {
    const captured = getCreationCapturedPhoto();
    seedPostPublishDraft(
      {
        kind: "video",
        coverSrc: captured ?? localFeedVerticalCoverUrl(CREATION_PUBLISH_COVER_FEED_INDEX),
      },
      origin,
    );
    return;
  }
  const persisted = readPersistedPhotoPublishSources();
  if (persisted?.length) {
    seedPostPublishDraft({ kind: "photo", sources: persisted }, origin);
    return;
  }
  const fromCapture = buildPhotoPublishSourcesFromCapture();
  if (fromCapture?.length) {
    seedPostPublishDraft({ kind: "photo", sources: fromCapture }, origin);
    return;
  }
  seedPostPublishDraft({ kind: "photo-text-demo" }, origin);
}

export function getPostPublishBackTarget(): PostPublishBackTarget {
  return publishBackTarget;
}

export function resolvePostPublishBackTarget(
  routeOrigin?: CreationPostPublishOrigin | null,
): PostPublishBackTarget {
  if (publishBackTarget !== "default") {
    return publishBackTarget;
  }
  const origin = routeOrigin ?? publishOrigin;
  return postPublishBackTargetForOrigin(origin);
}

export function getPostPublishOrigin(): CreationPostPublishOrigin {
  return publishOrigin;
}

export function seedPostPublishDraft(
  seed: PostPublishSeed,
  routeOrigin?: CreationPostPublishOrigin,
) {
  if (seed.kind === "resume") {
    if (!draftSeeded) {
      return seedPostPublishDraft({ kind: "photo-text-demo" }, routeOrigin);
    }
    return currentDraft;
  }

  if (seed.kind === "text-to-image") {
    syncPostPublishRouteContext("text-to-image");
  } else if (seed.kind === "photo") {
    syncPostPublishRouteContext("edit-photo");
  } else if (seed.kind === "video") {
    syncPostPublishRouteContext("edit-video");
  } else if (seed.kind === "photo-text-demo") {
    syncPostPublishRouteContext(routeOrigin ?? "edit-photo");
  } else {
    publishBackTarget = "default";
  }

  switch (seed.kind) {
    case "photo-text-demo":
      currentDraft = {
        mode: "photo-text",
        title: "",
        description: "",
        media: buildPhotoTextDemoMedia(),
        initialPreviewIndex: 0,
      };
      break;
    case "photo":
      persistPhotoPublishSources(seed.sources);
      currentDraft = {
        mode: "photo",
        title: "",
        description: "",
        media: buildPhotoMedia(seed.sources),
        initialPreviewIndex: 0,
      };
      break;
    case "video": {
      const coverSrc =
        seed.coverSrc ?? localFeedVerticalCoverUrl(CREATION_PUBLISH_COVER_FEED_INDEX);
      currentDraft = {
        mode: "video",
        title: "",
        description: "",
        media: buildVideoMedia(coverSrc, seed.videoSrc),
        initialPreviewIndex: 0,
      };
      break;
    }
    case "text-to-image":
      currentDraft = {
        mode: "photo-text",
        title: "",
        description: "",
        media: buildTextImageMedia(seed.templateId, seed.text),
        initialPreviewIndex: 0,
      };
      break;
  }

  draftSeeded = true;
  return currentDraft;
}

export function getPostPublishDraft(): PostPublishDraft {
  if (!draftSeeded) {
    return seedPostPublishDraft({ kind: "photo-text-demo" });
  }
  return currentDraft;
}

export function updatePostPublishDraft(
  patch: Partial<Pick<PostPublishDraft, "title" | "description" | "initialPreviewIndex">>,
) {
  currentDraft = { ...currentDraft, ...patch };
}

export function resetPostPublishDraft() {
  currentDraft = { ...EMPTY_DRAFT, media: [] };
  draftSeeded = false;
  publishBackTarget = "default";
  publishOrigin = "edit-photo";
  pendingSeed = null;
  clearPersistedPhotoPublishSources();
}
