import { TUXText, getColorCSSVar } from "@byted-tiktok/tux-web";
import {
  TUXIcon3LinesHorizontal,
  TUXIconBookmark,
  TUXIconEllipsisHorizontal,
  TUXIconPlayFill,
} from "@byted-tiktok/tux-icons";

import { ProfileFeedThumb } from "./profile_feed_thumb";
import type { VisitorMusicTrack } from "./visitor_profile_utils";

type MusicTabContentProps = {
  tracks: VisitorMusicTrack[];
};

/**
 * 客态个人页的 Music tab 内容。设计来自 Figma 节点 48013:48136 (Main Framework Main File)。
 * 第一首音乐高亮：标题 + 横排 3 个视频缩略图；其余为 compact 单行。
 */
export function MusicTabContent({ tracks }: MusicTabContentProps) {
  if (tracks.length === 0) return null;

  const [highlightTrack, ...restTracks] = tracks;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 高亮音乐：标题 + 横排视频 */}
      <HighlightedTrack track={highlightTrack} />

      {/* 其余 compact 行 */}
      {restTracks.length > 0 ? (
        <div className="flex flex-col w-full">
          {restTracks.map((track) => (
            <CompactTrackRow key={track.key} track={track} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function HighlightedTrack({ track }: { track: VisitorMusicTrack }) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <TrackHeader track={track} trailing="highlight" />
      {track.highlightVideos && track.highlightVideos.length > 0 ? (
        <div className="px-4 py-2">
          <div className="flex gap-1 w-full">
            {track.highlightVideos.map((video) => (
              <HighlightVideoCard key={video.key} video={video} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CompactTrackRow({ track }: { track: VisitorMusicTrack }) {
  return <TrackHeader track={track} trailing="compact" />;
}

type TrackHeaderProps = {
  track: VisitorMusicTrack;
  trailing: "highlight" | "compact";
};

function TrackHeader({ track, trailing }: TrackHeaderProps) {
  return (
    <div className="flex items-stretch gap-2 pl-4 pr-3 py-2 w-full">
      {/* 封面 + 播放按钮 */}
      <div className="flex items-center pr-1 shrink-0">
        <div
          className="relative rounded overflow-hidden shrink-0"
          style={{
            width: 72,
            height: 72,
            backgroundColor: getColorCSSVar("UIShapeNeutral4"),
            borderWidth: "0.5px",
            borderStyle: "solid",
            borderColor: getColorCSSVar("UIShapeNeutral3"),
          }}
        >
          <img
            src={track.coverSrc}
            alt={`${track.title} cover`}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
            style={{
              width: 24,
              height: 24,
              color: "var(--tux-v2-color-ui-image-overlay-white)",
              filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.12))",
            }}
          >
            <TUXIconPlayFill size={24} />
          </span>
        </div>
      </div>

      {/* 文本区 */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-2">
        <div className="flex flex-col gap-0.5 min-w-0 w-full">
          <TUXText
            typographyPreset="Headline-Semibold"
            color="UIText1"
            textDisplay="truncate"
            className="block w-full"
          >
            {track.title}
          </TUXText>
          <TUXText
            typographyPreset="P1-Regular"
            color="UIText3"
            textDisplay="truncate"
            className="block w-full"
          >
            {track.usedByLabel}
          </TUXText>
        </div>
        <div className="flex items-center">
          <TUXText typographyPreset="P2-Regular" color="UIText3">
            {track.duration}
          </TUXText>
        </div>
      </div>

      {/* 右侧操作 */}
      <div className="flex items-start shrink-0 px-1 min-h-[32px]">
        {trailing === "highlight" ? (
          <div className="flex items-start gap-5">
            <button
              type="button"
              aria-label={`Bookmark ${track.title}`}
              className="flex items-center justify-center shrink-0"
              style={{ width: 20, height: 20, color: getColorCSSVar("UIText1") }}
            >
              <TUXIconBookmark size={20} />
            </button>
            <button
              type="button"
              aria-label={`More options for ${track.title}`}
              className="flex items-center justify-center shrink-0"
              style={{ width: 20, height: 20, color: getColorCSSVar("UIText1") }}
            >
              <TUXIcon3LinesHorizontal size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-start gap-5">
            <button
              type="button"
              aria-label={`Bookmark ${track.title}`}
              className="flex items-center justify-center w-11 h-11"
              style={{ color: getColorCSSVar("UIText1") }}
            >
              <TUXIconBookmark size={20} />
            </button>
            <button
              type="button"
              aria-label={`More options for ${track.title}`}
              className="flex items-center justify-center w-11 h-11"
              style={{ color: getColorCSSVar("UIText1") }}
            >
              <TUXIconEllipsisHorizontal size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function HighlightVideoCard({
  video,
}: {
  video: { thumbnailSrc: string; videoThumbnailSrc?: string; plays: string };
}) {
  return (
    <button
      type="button"
      className="relative shrink-0 rounded overflow-hidden"
      style={{
        flex: "1 1 0",
        aspectRatio: "117 / 156",
        borderWidth: "0.5px",
        borderStyle: "solid",
        borderColor: getColorCSSVar("UIShapeNeutral4"),
        backgroundColor: getColorCSSVar("UIShapeNeutral4"),
      }}
      aria-label="Video"
    >
      <ProfileFeedThumb
        thumbnailSrc={video.thumbnailSrc}
        videoThumbnailSrc={video.videoThumbnailSrc}
      />
      <div
        className="absolute inset-x-0 bottom-0 p-1 flex flex-col justify-end"
        style={{
          height: 52,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.005) 16%, rgba(0,0,0,0.02) 29%, rgba(0,0,0,0.06) 47%, rgba(0,0,0,0.116) 65%, rgba(0,0,0,0.187) 84%, rgba(0,0,0,0.24) 100%)",
        }}
      >
        <div
          className="flex items-center gap-0.5"
          style={{ color: "var(--tux-v2-color-ui-image-overlay-white)" }}
        >
          <span className="flex items-center justify-center w-4 h-4">
            <TUXIconPlayFill size={14} />
          </span>
          <TUXText typographyPreset="P2-Regular" color="UIImageOverlayWhite">
            {video.plays}
          </TUXText>
        </div>
      </div>
    </button>
  );
}
