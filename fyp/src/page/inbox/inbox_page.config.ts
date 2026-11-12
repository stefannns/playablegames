import type { InboxRowCellRow } from "./components/inbox_row_cell";
import type { StorySkylightCellStory } from "./components/story_skylight_cell";
import type { StoryDetail, StorySegment } from "../story/story.types";
import { avatarSlotFromId, currentUserAvatarSrc, localAvatarUrlForDisplay } from "../../utils/local_avatar";
import {
  localFeedVerticalCoverUrl,
  localMusicCoverUrl,
} from "../../utils/local_media_placeholder";

export type InboxStorySegment = StorySegment;

export type InboxStoryDetail = StoryDetail;

/** Inbox row leading avatar ~52 CSS px → `small/`. */
function rowAvatar(rowId: string) {
  return localAvatarUrlForDisplay(52, avatarSlotFromId(rowId));
}

const stories = [
  {
    id: "create",
    name: "Create",
    // Current user — same asset + square crop as profile / story publish fly.
    src: currentUserAvatarSrc(),
    hasRing: false,
    ringVariant: "story",
    hasBadge: true,
    badgeVariant: "create",
    bubble: {
      text: "Whisper, whisper",
      filled: false,
    },
  },
  {
    id: "chenyue",
    name: "Hao",
    src: "/resource/avatar/custom/hao.png",
    hasRing: true,
    ringVariant: "live",
    hasBadge: true,
    badgeVariant: "live",
  },
  {
    id: "curiosity",
    name: "Curiosity",
    src: "/resource/avatar/custom/curiosity.jpg",
    hasRing: true,
    ringVariant: "story",
    hasDot: true,
  },
  {
    id: "yiidy",
    name: "yyyy",
    src: "/resource/avatar/custom/yyyy.png",
    hasRing: true,
    ringVariant: "story",
    bubble: {
      text: "🔥🔥",
      filled: true,
    },
  },
  {
    id: "luna",
    name: "siyuan",
    src: "/resource/avatar/custom/siyuan.png",
    hasRing: true,
    ringVariant: "story",
  },
  {
    id: "eeeen",
    name: "eeeen",
    src: "/resource/avatar/custom/eeeen.jpg",
    hasRing: true,
    ringVariant: "story",
  },
  ] satisfies StorySkylightCellStory[];

const storyCaptions = [
  "caught the best light between meetings",
  "little reset before the next thing",
  "this corner deserves its own loop",
  "proof that today had texture",
  "saving this mood for later",
  "posting before I overthink it",
] as const;

const storyLocations = [
  "Downtown",
  "Studio",
  "Cafe",
  "Sunset",
  "Backstage",
  "Weekend",
] as const;

const storyDetails = stories.map((story, index) => {
  const slot = index + 1;

  return {
    ...story,
    name: story.id === "create" ? "hazelilili" : story.name,
    timestamp: slot % 2 === 0 ? "21m" : "12m",
    music: {
      title: ["night drive", "soft focus", "paper planes", "after hours", "tiny sparks", "slow bloom"][index],
      artist: ["Mika Vale", "san reyes", "Kira Sun", "Noah Park", "Ari Moss", "The Room"][index],
      coverSrc: localMusicCoverUrl(slot + 12),
    },
    quickEmojis: ["❤️", "😂", "🔥", "👏"],
    stats: {
      likes: `${18 + slot * 7}`,
      comments: `${slot + 2}`,
      shares: `${slot}`,
    },
    comments: [
      {
        author: "Rhea",
        text: "This looks so good",
      },
      {
        author: "Tommy",
        text: "Send me this spot",
      },
      {
        author: "Ava",
        text: "wait I love the vibe",
      },
    ],
    segments: [0].map((segmentIndex) => ({
      id: `${story.id}-${segmentIndex + 1}`,
      mediaSrc: localFeedVerticalCoverUrl(slot * 3 + segmentIndex),
      durationMs: 4200 + segmentIndex * 500,
      caption: storyCaptions[(index + segmentIndex) % storyCaptions.length],
      locationLabel: storyLocations[(index + segmentIndex) % storyLocations.length],
    })),
  };
}) satisfies InboxStoryDetail[];

const rows = [
  {
    id: "new-followers",
    title: "New Followers",
    description: "Rhianna started following you.",
    unread: { variant: "count", count: 9 },
    leading: {
      variant: "icon-bubble",
      iconVariant: "followers",
    },
  },
  {
    id: "activity",
    title: "Activity",
    description: "Jaela liked your video.",
    unread: { variant: "count", count: 1 },
    leading: {
      variant: "icon-bubble",
      iconVariant: "activity",
    },
  },
  {
    id: "system",
    title: "System notifications",
    description: "TikTok: Updates to your post performance.",
    time: "5m",
    unread: { variant: "dot" },
    leading: {
      variant: "icon-bubble",
      iconVariant: "system",
    },
  },
  {
    id: "cenis",
    title: "Cenis Grimm",
    description: "Hello how r u recently",
    time: "5m",
    unread: { variant: "count", count: 1 },
    leading: {
      variant: "avatar",
      src: rowAvatar("cenis"),
      alt: "Cenis Grimm",
    },
  },
  {
    id: "summer",
    title: "summer",
    description: "Keep chatting to unlock a Streak",
    time: "1h",
    leading: {
      variant: "avatar",
      src: rowAvatar("summer"),
      alt: "summer",
    },
    trailing: {
      variant: "camera",
      label: "Open camera for summer",
    },
  },
  {
    id: "tommy",
    title: "Tommy Tang",
    description: "sent a sticker",
    time: "1h",
    leading: {
      variant: "avatar",
      src: rowAvatar("tommy"),
      alt: "Tommy Tang",
      hasRing: true,
      ringVariant: "story",
    },
    trailing: {
      variant: "camera",
      label: "Open camera for Tommy Tang",
    },
  },
  {
    id: "july",
    title: "July",
    description: "hello!!!",
    time: "2h",
    unread: { variant: "count", count: 1 },
    leading: {
      variant: "avatar",
      src: rowAvatar("july"),
      alt: "July",
      hasDot: true,
    },
  },
  {
    id: "rhea",
    title: "Rhea",
    description: "did you see the new cut?",
    time: "3h",
    leading: {
      variant: "avatar",
      src: rowAvatar("rhea"),
      alt: "Rhea",
    },
    trailing: {
      variant: "camera",
      label: "Open camera for Rhea",
    },
  },
  {
    id: "noah",
    title: "Noah Lee",
    description: "shared a post with you",
    time: "4h",
    unread: { variant: "dot" },
    leading: {
      variant: "avatar",
      src: rowAvatar("noah"),
      alt: "Noah Lee",
      hasRing: true,
      ringVariant: "story",
    },
  },
  {
    id: "ava",
    title: "Ava",
    description: "omg this filter is so good",
    time: "6h",
    leading: {
      variant: "avatar",
      src: rowAvatar("ava"),
      alt: "Ava",
      hasDot: true,
    },
    trailing: {
      variant: "camera",
      label: "Open camera for Ava",
    },
  },
  {
    id: "kai",
    title: "Kai",
    description: "sent a photo",
    time: "Yesterday",
    unread: { variant: "count", count: 2 },
    leading: {
      variant: "avatar",
      src: rowAvatar("kai"),
      alt: "Kai",
    },
  },
  {
    id: "zoe",
    title: "Zoe Wang",
    description: "let's shoot this tomorrow",
    time: "Yesterday",
    leading: {
      variant: "avatar",
      src: rowAvatar("zoe"),
      alt: "Zoe Wang",
    },
    trailing: {
      variant: "camera",
      label: "Open camera for Zoe Wang",
    },
  },
  ] satisfies InboxRowCellRow[];

/**
 * Resolves the `InboxRowCellRow` for `InboxDetailPageContent`.
 * Reuses the **same object** as the inbox list when `id` or display `title`
 * matches a configured row; otherwise builds one DM-shaped fallback (Friends
 * “Message”, unknown peers).
 */
export function inboxRowById(rowId: string): InboxRowCellRow | undefined {
  return inboxPageConfig.rows.find((row) => row.id === rowId);
}

export function inboxStoryById(storyId: string): StorySkylightCellStory | undefined {
  return inboxPageConfig.stories.find((story) => story.id === storyId);
}

export function inboxStoryDetailById(storyId: string): InboxStoryDetail | undefined {
  return inboxPageConfig.storyDetails.find((story) => story.id === storyId);
}

export function inboxDetailRowForPeer(input: {
  peerAuthorId: string;
  peerDisplayName: string;
  messagePreview?: string;
  timeLabel?: string;
}): InboxRowCellRow {
  const displayNorm = input.peerDisplayName.trim().toLowerCase();
  const hit = rows.find(
    (r) => r.id === input.peerAuthorId || r.title.trim().toLowerCase() === displayNorm,
  );
  if (hit) {
    return hit;
  }

  return {
    id: `dm-peer-${input.peerAuthorId}`,
    title: input.peerDisplayName,
    description: input.messagePreview ?? "Hello how r u recently",
    time: input.timeLabel ?? "5m",
    leading: {
      variant: "avatar",
      src: rowAvatar(input.peerAuthorId),
      alt: input.peerDisplayName,
    },
  };
}

export type InboxTabId =
  | "all"
  | "unread"
  | "starred"
  | "ads"
  | "leads"
  | "unanswered"
  | "spam";

export type InboxTabDefinition = {
  id: InboxTabId;
  label: string;
  /** Optional badge count shown after the label, e.g. "Unread 1". */
  count?: number;
};

/** Tabs shown in the inbox business chip bar. Order = display order. */
export const INBOX_TABS: InboxTabDefinition[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread", count: 1 },
  { id: "starred", label: "Starred", count: 4 },
  { id: "ads", label: "Ads", count: 5 },
  { id: "leads", label: "Leads", count: 1 },
  { id: "unanswered", label: "Unanswered", count: 4 },
  { id: "spam", label: "Spam", count: 4 },
];

/** DM thread rows open message detail; system aggregates (icon-bubble) have no detail yet. */
export function inboxRowOpensDetail(row: InboxRowCellRow): boolean {
  return row.leading.variant === "avatar";
}

/**
 * Filters the inbox rows by tab id. Mock data; tabs other than "all" / "unread"
 * map to deterministic subsets so each tab shows a distinct list in the demo.
 *
 * 系统聚合通知（leading 为 icon-bubble 的 New Followers / Activity /
 * System notifications）仅在 "All" 出现；其他业务 tab 是按对人会话过滤的，
 * 所以筛选前先把 icon-bubble 行剔掉。
 */
export function filterInboxRowsByTab(
  allRows: InboxRowCellRow[],
  tabId: InboxTabId,
): InboxRowCellRow[] {
  if (tabId === "all") {
    return allRows;
  }

  const personRows = allRows.filter((row) => row.leading.variant === "avatar");

  switch (tabId) {
    case "unread":
      return personRows.filter((row) => row.unread != null);
    case "starred":
      return personRows.slice(0, 4);
    case "ads":
      return personRows.slice(0, 5);
    case "leads":
      return personRows.slice(0, 1);
    case "unanswered":
      return personRows.slice(0, 4);
    case "spam":
      return personRows.slice(0, 4);
    default:
      return personRows;
  }
}

export const inboxPageConfig = {
  stories,
  storyDetails,
  rows,
} as const;

export type InboxPageConfigStory = StorySkylightCellStory;
export type InboxPageConfigStoryDetail = InboxStoryDetail;
export type InboxPageConfigRow = InboxRowCellRow;
