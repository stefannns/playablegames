/**
 * Shared story domain types — used by every story entry surface
 * (inbox skylight, friends tray, feed avatars, visitor profile…).
 *
 * Anchor protocol for the story viewer open/close magnify motion:
 * host pages tag the source avatar with `data-story-avatar-id={id}`
 * (optionally `data-story-cell-id={id}` on the cell, and
 * `data-story-anchor-scroll` on its horizontal scroll container).
 * The viewer animates from/to that element; when absent it falls
 * back to the `sourceRect` prop / centered fade.
 */
import type {
  SocialAvatarBadgeVariant,
  SocialAvatarRingVariant,
} from "../inbox/components/social_avatar";

/** Summary rendered on a story entry avatar cell. */
export type StoryCellSummary = {
  id: string;
  name: string;
  src: string;
  hasRing?: boolean;
  ringVariant?: SocialAvatarRingVariant;
  hasDot?: boolean;
  hasBadge?: boolean;
  badgeVariant?: SocialAvatarBadgeVariant;
  bubble?: {
    text: string;
    filled: boolean;
  };
};

/** A story is openable iff the avatar wears the story gradient ring. */
export function canOpenStory(story: StoryCellSummary): boolean {
  return story.hasRing === true && story.ringVariant === "story";
}

export type StorySegment = {
  id: string;
  mediaSrc: string;
  durationMs: number;
  caption: string;
  locationLabel?: string;
};

export type StoryDetail = StoryCellSummary & {
  timestamp: string;
  music: {
    title: string;
    artist: string;
    coverSrc: string;
  };
  quickEmojis: string[];
  stats: {
    likes: string;
    comments: string;
    shares: string;
  };
  comments: {
    author: string;
    text: string;
  }[];
  segments: StorySegment[];
};
