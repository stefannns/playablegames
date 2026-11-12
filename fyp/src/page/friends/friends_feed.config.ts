import { avatarSlotFromId, localAvatarUrlForDisplay } from "../../utils/local_avatar";
import { localProfileVideoThumbUrl } from "../../utils/local_media_placeholder";

export type FriendsCommentPreview = {
  author: string;
  text: string;
  authorId: string;
  /** Reply row: `Author ▶ Name: …` when set. */
  replyToAuthor?: string;
};

export type FriendsPostBase = {
  id: string;
  authorId: string;
  authorName: string;
  timeLabel: string;
  caption: string;
  likeCount: number;
  commentCount: number;
  comments: FriendsCommentPreview[];
  /** Row CTA next to the author name: DM a friend vs follow someone you see through friends. */
  primaryRowAction?: "message" | "follow";
  /** When `primaryRowAction` is `follow`, small overlapping avatars shown under the author name (mutual / social proof). */
  mutualFriendAvatarIds?: string[];
  /** Additional mutual friends not shown in the stack; renders as `+n` after the avatars. */
  mutualFriendsExtraCount?: number;
};

export type FriendsPostText = FriendsPostBase & {
  kind: "text";
};

export type FriendsPostSingleImage = FriendsPostBase & {
  kind: "single_image";
  /** 1-based index into `localProfileVideoThumbUrl` */
  imageThumbIndex: number;
};

export type FriendsPostMultiImage = FriendsPostBase & {
  kind: "multi_image";
  /** 1-based indices into `localProfileVideoThumbUrl` */
  imageThumbIndices: number[];
  anchorLabel?: string;
};

export type FriendsFeedItem = FriendsPostText | FriendsPostSingleImage | FriendsPostMultiImage;

export function friendsAuthorAvatarUrl(authorId: string, cssPx: number): string {
  return localAvatarUrlForDisplay(cssPx, avatarSlotFromId(authorId));
}

export function friendsPostThumbUrl(thumbIndex: number): string {
  return localProfileVideoThumbUrl(thumbIndex);
}

export const FRIENDS_FEED_ITEMS: FriendsFeedItem[] = [
  {
    kind: "multi_image",
    id: "fp-1",
    /** Same `id` / name as `inboxPageConfig.rows` “Cenis Grimm” so Friends Message reuses that row. */
    authorId: "cenis",
    authorName: "Cenis Grimm",
    timeLabel: "3m ago",
    caption: "Went to the Museum today, saw a lot of ancient paintings.",
    likeCount: 0,
    commentCount: 3,
    imageThumbIndices: [3, 9, 14],
    anchorLabel: "Bad lemon",
    comments: [
      {
        authorId: "jiaqi",
        author: "Jiaqi",
        replyToAuthor: "Siyuan",
        text: "I totally agree",
      },
      {
        authorId: "s1",
        author: "Siyuan",
        text: "Work-Life Balance in the modern world In today’s fast-paced and highly connected world.",
      },
      { authorId: "h1", author: "Hao233", text: "beautiful scene wanna see it by my eyes." },
    ],
  },
  {
    kind: "text",
    id: "fp-2",
    authorId: "clyde",
    authorName: "Clyde",
    timeLabel: "24m ago",
    caption:
      "Christmas season is here, reminding us to slow down, be kind, and enjoy the little moments 🤍🎁",
    likeCount: 9,
    commentCount: 0,
    comments: [],
  },
  {
    kind: "single_image",
    id: "fp-3",
    authorId: "yuyao",
    authorName: "Yuyao",
    timeLabel: "1h ago",
    caption: "Golden hour walk before dinner — the city felt unusually quiet.",
    likeCount: 99,
    commentCount: 1,
    imageThumbIndex: 18,
    primaryRowAction: "follow",
    mutualFriendAvatarIds: ["m1", "jiaqi", "chujie"],
    mutualFriendsExtraCount: 3,
    comments: [{ authorId: "m1", author: "Mia", text: "This lighting is unreal." }],
  },
];

/** Older friend posts shown after the “caught up” state — demo archive / already-seen feed. */
export const FRIENDS_PAST_FEED_ITEMS: FriendsFeedItem[] = [
  {
    kind: "single_image",
    id: "fp-past-1",
    authorId: "janice",
    authorName: "Janice",
    timeLabel: "Yesterday",
    caption: "Rainy Sunday baking — third loaf this month and finally nailed the crust.",
    likeCount: 42,
    commentCount: 2,
    imageThumbIndex: 7,
    comments: [
      { authorId: "lexi", author: "Lexi", text: "Recipe drop when?" },
      { authorId: "janice", author: "Janice", text: "Will DM you the notes!" },
    ],
  },
  {
    kind: "text",
    id: "fp-past-2",
    authorId: "s1",
    authorName: "Siyuan",
    timeLabel: "3d ago",
    caption:
      "Unpopular opinion: the best meetings are the ones that get cancelled. Used the hour for a long walk instead.",
    likeCount: 128,
    commentCount: 5,
    comments: [],
  },
  {
    kind: "multi_image",
    id: "fp-past-3",
    authorId: "taotao",
    authorName: "Taotao",
    timeLabel: "5d ago",
    caption: "Weekend trip — three cities, too many trains, zero regrets.",
    likeCount: 210,
    commentCount: 8,
    imageThumbIndices: [2, 11, 22],
    comments: [
      { authorId: "h1", author: "Hao233", text: "That second shot is wallpaper material." },
      { authorId: "taotao", author: "Taotao", text: "Took like forty tries to get the light right lol" },
    ],
  },
  {
    kind: "single_image",
    id: "fp-past-4",
    authorId: "chujie",
    authorName: "Chujie",
    timeLabel: "1w ago",
    caption: "First time at this venue — sound was rough but the energy made up for it.",
    likeCount: 67,
    commentCount: 0,
    imageThumbIndex: 5,
    primaryRowAction: "follow",
    mutualFriendAvatarIds: ["jiaqi", "m1"],
    mutualFriendsExtraCount: 1,
    comments: [],
  },
  {
    kind: "text",
    id: "fp-past-5",
    authorId: "m1",
    authorName: "Mia",
    timeLabel: "2w ago",
    caption: "Finally finished the book everyone recommended. Worth the hype — now I need a new one.",
    likeCount: 31,
    commentCount: 1,
    comments: [{ authorId: "yuyao", author: "Yuyao", text: "Try the sequel next!" }],
  },
];

export type FriendsSuggestedUser = {
  id: string;
  name: string;
  subtitle: string;
  followLabel: string;
  avatarAuthorId: string;
};

export const FRIENDS_SUGGESTED: FriendsSuggestedUser[] = [
  { id: "su-1", name: "Janice", subtitle: "Follows you", followLabel: "Follow back", avatarAuthorId: "janice" },
  { id: "su-2", name: "Lexi", subtitle: "From your contacts", followLabel: "Follow", avatarAuthorId: "lexi" },
  { id: "su-3", name: "Taotao", subtitle: "Follows you", followLabel: "Follow", avatarAuthorId: "taotao" },
  { id: "su-4", name: "Chujie", subtitle: "Mutual friends", followLabel: "Follow", avatarAuthorId: "chujie" },
  { id: "su-5", name: "Jiaqi", subtitle: "From your contacts", followLabel: "Follow", avatarAuthorId: "jiaqi" },
  { id: "su-6", name: "Yuyao", subtitle: "Follows you", followLabel: "Follow back", avatarAuthorId: "yuyao" },
  { id: "su-7", name: "Clyde", subtitle: "Suggested for you", followLabel: "Follow", avatarAuthorId: "clyde" },
  { id: "su-8", name: "Mia", subtitle: "Mutual friends", followLabel: "Follow", avatarAuthorId: "m1" },
  { id: "su-9", name: "Siyuan", subtitle: "Follows you", followLabel: "Follow", avatarAuthorId: "s1" },
  { id: "su-10", name: "Hao233", subtitle: "From your contacts", followLabel: "Follow", avatarAuthorId: "h1" },
];
