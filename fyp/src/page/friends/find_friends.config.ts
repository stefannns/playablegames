import { friendsAuthorAvatarUrl, friendsPostThumbUrl } from "./friends_feed.config";

/**
 * Static placeholder data for the **Find Friends** page.
 *
 * UI-only demo content restored from the TikTok "Find Friends" page. No real
 * user data and no networking — every row action (Follow / Remove / entry rows)
 * is intentionally inert (see `find_friends_page_content.tsx`).
 */

export type FindFriendsSuggestedUser = {
  id: string;
  /** Display nickname shown in bold on the first line. */
  name: string;
  /** Secondary `@handle` line under the nickname. */
  username: string;
  /** Fallback suggestion-reason text when no mutual avatars are shown. */
  reason: string;
  /** When set, the reason renders as `Friends with <avatar stack> +N`. */
  mutualAvatarIds?: string[];
  /** Count appended after the mutual-avatar stack (`+N`). */
  mutualExtraCount?: number;
  /** Blue verified badge after the nickname. */
  verified?: boolean;
  /** Relation button copy — "Follow" or "Follow back". */
  followLabel: string;
  /** Avatar slot id (maps into the local demo avatar pool). */
  avatarAuthorId: string;
  /** Recent-post square cover thumbnails shown in the horizontal strip. */
  postThumbIndices: number[];
};

export const FIND_FRIENDS_SUGGESTED: FindFriendsSuggestedUser[] = [
  {
    id: "ff-1",
    name: "Lexi",
    username: "@hazel_lilili",
    reason: "Suggested for you",
    mutualAvatarIds: ["chujie", "jiaqi", "taotao"],
    mutualExtraCount: 4,
    followLabel: "Follow",
    avatarAuthorId: "lexi",
    postThumbIndices: [3, 9, 14, 18],
  },
  {
    id: "ff-2",
    name: "Taotao",
    username: "@taotao.daily",
    reason: "Followed by chujie + 3 more",
    mutualAvatarIds: ["chujie", "jiaqi", "m1"],
    mutualExtraCount: 3,
    followLabel: "Follow",
    avatarAuthorId: "taotao",
    postThumbIndices: [2, 11, 22, 7],
  },
  {
    id: "ff-3",
    name: "Janice",
    username: "@janice",
    reason: "Follows you",
    followLabel: "Follow",
    avatarAuthorId: "janice",
    postThumbIndices: [7, 5, 16, 20],
  },
  {
    id: "ff-4",
    name: "Chujie",
    username: "@chujie",
    reason: "From your contacts",
    followLabel: "Follow",
    avatarAuthorId: "chujie",
    postThumbIndices: [5, 12, 1, 24],
  },
  {
    id: "ff-5",
    name: "Siyuan",
    username: "@siyuan",
    reason: "Mutual friends",
    mutualAvatarIds: ["m1", "yuyao"],
    mutualExtraCount: 2,
    followLabel: "Follow",
    avatarAuthorId: "s1",
    postThumbIndices: [8, 19, 4, 27],
  },
];

export function findFriendsAvatarUrl(authorId: string, cssPx: number): string {
  return friendsAuthorAvatarUrl(authorId, cssPx);
}

export function findFriendsPostThumbUrl(thumbIndex: number): string {
  return friendsPostThumbUrl(thumbIndex);
}
