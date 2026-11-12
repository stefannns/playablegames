import { localAvatarUrlForDisplay } from "../../../../utils/local_avatar";

export type RepostReply = {
  id: string;
  authorName: string;
  avatarSlot: number;
  /** When set, the row renders "authorName ▸ replyToName" (reply to a reply). */
  replyToName?: string;
  content: string;
  timeLabel: string;
  likeCount: number;
  liked?: boolean;
};

/** Candidate users for the @-mention picker in the note composer. */
export type MentionContact = {
  id: string;
  name: string;
  handle: string;
  avatarSlot: number;
};

export const MENTION_CONTACTS: MentionContact[] = [
  { id: "angel", name: "Angel Botosh", handle: "angelb", avatarSlot: 41 },
  { id: "justin-d", name: "Justin Dokidis", handle: "jdokidis", avatarSlot: 43 },
  { id: "justin-a", name: "Justin Aminoff", handle: "justinaminoff", avatarSlot: 44 },
  { id: "jocelyn", name: "Jocelyn Herwig", handle: "jocelynh", avatarSlot: 45 },
  { id: "olivia", name: "Olivia Parker", handle: "oliviap", avatarSlot: 46 },
  { id: "liam", name: "Liam Carter", handle: "liamc", avatarSlot: 47 },
  { id: "maya", name: "Maya Lin", handle: "mayalin", avatarSlot: 48 },
];

export type RepostEntry = {
  id: string;
  /** True when this repost belongs to the current viewer ("You"). */
  isSelf?: boolean;
  authorName: string;
  avatarSlot: number;
  /** Optional attached note ("附言"). Empty string / undefined = no note. */
  note?: string;
  timeLabel: string;
  likeCount: number;
  liked?: boolean;
  replyCount: number;
  /** First-level replies, lazily shown via "View replies". */
  replies: RepostReply[];
};

/** The current viewer's identity slot — stable across the demo. */
export const SELF_AVATAR_SLOT = 8;

/** The viewer's display nickname (the panel shows the real nickname, not "You"). */
export const SELF_DISPLAY_NAME = "Avery Lim";

export function avatarFor(slot: number, size = 40): string {
  return localAvatarUrlForDisplay(size, slot);
}

/**
 * Pool of friends who can repost. A video's scenario references these by id
 * (see `feed_item_card.config.ts`), so the white-bar preview and the
 * interaction-panel list always render the exact same set of people — the
 * single source of truth for "who reposted this".
 */
type RepostFriend = Omit<RepostEntry, "id" | "isSelf">;

export const REPOST_FRIENDS: Record<string, RepostFriend> = {
  angel: {
    authorName: "Angel Botosh",
    avatarSlot: 41,
    note: "this transition is insane 🤯 had to share",
    timeLabel: "2h",
    likeCount: 128,
    replyCount: 2,
    replies: [
      { id: "angel-r1", authorName: "Justin Dokidis", avatarSlot: 43, content: "fr the edit is so clean", timeLabel: "1h", likeCount: 12 },
      { id: "angel-r2", authorName: "Jocelyn Herwig", replyToName: "Justin Dokidis", avatarSlot: 45, content: "💃💃 saving this for inspo", timeLabel: "1h", likeCount: 4 },
    ],
  },
  olivia: {
    authorName: "Olivia Parker",
    avatarSlot: 46,
    note: "the soundtrack though 🎧",
    timeLabel: "5h",
    likeCount: 561,
    replyCount: 1,
    replies: [
      { id: "olivia-r1", authorName: "Angel Botosh", avatarSlot: 41, content: "right?? on repeat all day", timeLabel: "4h", likeCount: 8 },
    ],
  },
  justin: {
    authorName: "Justin Aminoff",
    avatarSlot: 44,
    note: "",
    timeLabel: "8h",
    likeCount: 34,
    replyCount: 0,
    replies: [],
  },
  jocelyn: {
    authorName: "Jocelyn Herwig",
    avatarSlot: 45,
    note: "sending this to the group chat rn",
    timeLabel: "1d",
    likeCount: 92,
    replyCount: 0,
    replies: [],
  },
  liam: {
    authorName: "Liam Carter",
    avatarSlot: 47,
    note: "",
    timeLabel: "1d",
    likeCount: 7,
    replyCount: 0,
    replies: [],
  },
  maya: {
    authorName: "Maya Lin",
    avatarSlot: 48,
    note: "ok this is actually so good",
    timeLabel: "2d",
    likeCount: 203,
    replyCount: 0,
    replies: [],
  },
};

/** Lightweight preview for the feed white bar. */
export type ReposterPreview = {
  count: number;
  /** Up to 3 avatar slots for the overlapped stack. */
  avatarSlots: number[];
  /** First reposter's display name (for the 1-person label). */
  firstName: string;
};

export function getReposterPreview(reposterIds: string[]): ReposterPreview {
  const friends = reposterIds
    .map((id) => REPOST_FRIENDS[id])
    .filter((f): f is RepostFriend => Boolean(f));
  return {
    count: friends.length,
    avatarSlots: friends.slice(0, 3).map((f) => f.avatarSlot),
    firstName: friends[0]?.authorName ?? "",
  };
}

/**
 * Build the ordered interaction list for a video. Self repost (if any) is
 * pinned to the top, followed by the friends in scenario order.
 */
export function buildRepostEntries(
  reposterIds: string[],
  selfReposted: boolean,
  selfNote: string,
): RepostEntry[] {
  const entries: RepostEntry[] = [];
  if (selfReposted) {
    entries.push({
      id: "self",
      isSelf: true,
      authorName: SELF_DISPLAY_NAME,
      avatarSlot: SELF_AVATAR_SLOT,
      note: selfNote,
      timeLabel: "now",
      likeCount: 0,
      replyCount: 0,
      replies: [],
    });
  }
  for (const id of reposterIds) {
    const friend = REPOST_FRIENDS[id];
    if (friend) entries.push({ id, ...friend });
  }
  return entries;
}

export function formatCompact(value: number): string {
  if (value <= 0) return "";
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
