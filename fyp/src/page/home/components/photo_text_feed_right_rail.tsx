import { getColorCSSVar, TUXText } from "@byted-tiktok/tux-web";
import {
  IconMediaComment,
  IconMediaFavoriate,
  IconMediaLike,
  IconMediaShare,
  IconPlusSmall,
} from "@byted-tiktok/tux-icons";
import { useState, type ReactNode } from "react";

import { creatorAvatarUrlForFeedDisplay } from "../../../utils/local_avatar";
import type { FeedItemCardContent } from "./feed_item_card";

function formatFeedCount(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

type RailActionButtonProps = {
  ariaLabel: string;
  icon: ReactNode;
  label: ReactNode;
};

function RailActionButton({ ariaLabel, icon, label }: RailActionButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="flex cursor-pointer flex-col items-center py-2 pl-2.5 pr-1.5"
    >
      {icon}
      <TUXText typographyPreset="P3-Semibold" className="w-11 text-center" style={{ lineHeight: "16px" }}>
        {label}
      </TUXText>
    </button>
  );
}

export type PhotoTextFeedRightRailProps = {
  content: Pick<
    FeedItemCardContent,
    | "id"
    | "nickname"
    | "avatarUrl"
    | "likeCount"
    | "commentCount"
    | "favoriteCount"
    | "shareCount"
    | "musicCoverUrl"
    | "musicTitle"
  >;
  hideCounts?: boolean;
};

/** Static right rail for photo-text feed blocks (preview / demo). */
export function PhotoTextFeedRightRail({
  content,
  hideCounts = false,
}: PhotoTextFeedRightRailProps) {
  const [avatarSrc, setAvatarSrc] = useState(
    creatorAvatarUrlForFeedDisplay(44, content.id),
  );
  const overlayTextStyle = { color: getColorCSSVar("UIImageOverlayWhite") };
  const countOpacity = hideCounts ? 0 : 1;

  return (
    <div className="z-20 flex flex-col items-center">
      <div className="relative flex flex-col items-center py-2.5 pl-2.5 pr-1.5">
        <div
          aria-label="Open profile"
          className="h-11 w-11 overflow-hidden rounded-full bg-tux-v2-ui-page-flat-1"
          style={{ boxShadow: "inset 0 0 0 0.5px rgba(255,255,255,0.2)" }}
        >
          <img
            src={avatarSrc}
            alt={`${content.nickname} avatar`}
            className="h-full w-full object-cover"
            onError={() => {
              setAvatarSrc(creatorAvatarUrlForFeedDisplay(44, content.id));
            }}
          />
        </div>
        <div
          aria-label="Follow"
          className="-mt-2.5 rounded-full"
          style={{ backgroundColor: getColorCSSVar("UIShapePrimary") }}
        >
          <span className="h-5 w-5">
            <IconPlusSmall className="text-tux-v2-ui-text-1" width={20} height={20} />
          </span>
        </div>
      </div>

      <RailActionButton
        ariaLabel="Like"
        icon={
          <IconMediaLike className="text-tux-v2-ui-text-1" width={32} height={32} />
        }
        label={
          <span style={{ ...overlayTextStyle, opacity: countOpacity }}>
            {formatFeedCount(content.likeCount)}
          </span>
        }
      />
      <RailActionButton
        ariaLabel="Comment"
        icon={
          <IconMediaComment className="text-tux-v2-ui-text-1" width={32} height={32} />
        }
        label={
          <span style={{ ...overlayTextStyle, opacity: countOpacity }}>
            {formatFeedCount(content.commentCount)}
          </span>
        }
      />
      <RailActionButton
        ariaLabel="Favorite"
        icon={
          <IconMediaFavoriate className="text-tux-v2-ui-text-1" width={32} height={32} />
        }
        label={
          <span style={{ ...overlayTextStyle, opacity: countOpacity }}>
            {formatFeedCount(content.favoriteCount)}
          </span>
        }
      />
      <RailActionButton
        ariaLabel="Share"
        icon={
          <IconMediaShare className="text-tux-v2-ui-text-1" width={32} height={32} />
        }
        label={
          <span style={{ ...overlayTextStyle, opacity: countOpacity }}>
            {formatFeedCount(content.shareCount)}
          </span>
        }
      />

      <div aria-label="Music" className="pb-3 pl-3 pr-2 pt-2">
        <div
          className="block h-10 w-10 overflow-hidden rounded-full bg-tux-v2-ui-page-flat-1"
          style={{ boxShadow: "inset 0 0 0 0.5px rgba(255,255,255,0.2)" }}
        >
          <img
            src={content.musicCoverUrl}
            alt={`${content.musicTitle} cover`}
            className="h-full w-full rounded-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
