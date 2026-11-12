import { getColorCSSVar, TUXText } from "@byted-tiktok/tux-web";
import { IconMusicNoteSAlt } from "@byted-tiktok/tux-icons";
import { useEffect, useRef, type CSSProperties } from "react";

import { localAvatarUrlForDisplay } from "../../../utils/local_avatar";
import { PhotoTextFeedRightRail } from "../../home/components/photo_text_feed_right_rail";
import { POST_PUBLISH_PREVIEW_DEMO_COUNTS } from "./post_publish_constants";
import type { PostPublishDraft, PostPublishVideoMedia } from "./post_publish_types";

const OVERLAY_TEXT_STYLE = { color: getColorCSSVar("UIImageOverlayWhite") };

const VIDEO_READABILITY_OVERLAY =
  "linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 18%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.42) 82%, rgba(0,0,0,0.72) 100%)";

const VIDEO_BOTTOM_TEXT_BACKDROP =
  "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.42) 72%, rgba(0,0,0,0.74) 100%)";

const FULL_BLEED_MEDIA_CLASS =
  "absolute inset-0 size-full object-cover object-center";

const FULL_BLEED_MEDIA_STYLE: CSSProperties = {
  objectPosition: "center top",
};

function resolveVideoMedia(draft: PostPublishDraft): PostPublishVideoMedia | null {
  const item = draft.media[draft.initialPreviewIndex] ?? draft.media[0];
  if (!item || item.kind !== "video") return null;
  return item;
}

export type PostPublishVideoPreviewBlockProps = {
  draft: PostPublishDraft;
};

/**
 * 视频发布预览 — 9:16 全屏铺满（对齐 Feed 竖版视频），非图文小卡模式。
 */
export function PostPublishVideoPreviewBlock({ draft }: PostPublishVideoPreviewBlockProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoMedia = resolveVideoMedia(draft);
  const description =
    draft.description.trim() || "Add description";

  const snapshotSrc = videoMedia?.posterSrc;
  const playableSrc = videoMedia?.src;

  useEffect(() => {
    if (!playableSrc) return;
    const video = videoRef.current;
    if (!video) return;
    void video.play().catch(() => undefined);
  }, [playableSrc]);

  if (!videoMedia) {
    return (
      <div className="absolute inset-0 bg-tux-v2-brand-tiktok-black" aria-hidden />
    );
  }

  const railContent = {
    id: "post-publish-video-preview",
    nickname: "You",
    avatarUrl: localAvatarUrlForDisplay(44, 1),
    musicTitle: "Original sound - You",
    musicCoverUrl: localAvatarUrlForDisplay(44, 1),
    ...POST_PUBLISH_PREVIEW_DEMO_COUNTS,
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-tux-v2-brand-tiktok-black">
      {playableSrc ? (
        <video
          ref={videoRef}
          className={FULL_BLEED_MEDIA_CLASS}
          style={FULL_BLEED_MEDIA_STYLE}
          poster={snapshotSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src={playableSrc} type="video/mp4" />
        </video>
      ) : (
        <img
          src={snapshotSrc}
          alt=""
          className={`app-no-img-drag ${FULL_BLEED_MEDIA_CLASS}`}
          style={FULL_BLEED_MEDIA_STYLE}
          draggable={false}
        />
      )}

      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: VIDEO_READABILITY_OVERLAY }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%]"
        style={{ background: VIDEO_BOTTOM_TEXT_BACKDROP }}
      />

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-end">
        <div className="flex w-full items-end justify-between gap-3">
          <div className="pointer-events-auto flex min-w-0 flex-1 flex-col gap-2 px-3 pb-2.5 pt-2">
            <TUXText typographyPreset="H3-Semibold" style={OVERLAY_TEXT_STYLE}>
              You
            </TUXText>
            <TUXText
              typographyPreset="H4-Regular"
              className="-mt-1"
              style={{
                ...OVERLAY_TEXT_STYLE,
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
                overflow: "hidden",
              }}
            >
              {description}
            </TUXText>
            <div className="flex min-w-0 items-center gap-2">
              <IconMusicNoteSAlt
                className="text-tux-v2-ui-text-1"
                width={14}
                height={14}
              />
              <TUXText
                typographyPreset="P1-Regular"
                style={OVERLAY_TEXT_STYLE}
                className="truncate"
              >
                Original sound - You
              </TUXText>
            </div>
          </div>

          <div className="pointer-events-auto shrink-0">
            <PhotoTextFeedRightRail content={railContent} hideCounts />
          </div>
        </div>
      </div>
    </div>
  );
}
