import type { FeedItemCardContent } from "../home/components/feed_item_card";
import { homeFeedItemContents } from "../home/components/feed_item_card.config";
import { avatarSlotFromId } from "../../utils/local_avatar";
import {
  DEFAULT_COMMENT_CONTENT_DOCUMENT,
  getCommentContentPreset,
  getCommentStickerSrc,
  resolveCommentAvatarSrc,
  type CommentAuthorLabel,
  type CommentContentDocument,
  type CommentContentNode,
  type CommentImageDisplay,
  type CommentMediaSpec,
} from "../home/components/comment_panel/comment_content_config";

export type PhotoTextDetailAnchor = {
  id: string;
  label: string;
  accent: "mint" | "rose";
};

export type PhotoTextDetailComment = {
  id: string;
  authorName: string;
  avatarSlot?: number;
  avatarUrl?: string;
  authorLabel?: CommentAuthorLabel;
  body: string;
  postedAt: string;
  likeCount: number;
  likeCountLabel?: string;
  creator?: boolean;
  likedByCreatorAvatarUrl?: string;
  media?: PhotoTextDetailCommentMedia;
  replies?: PhotoTextDetailComment[];
  replyCount?: number;
  viewRepliesLabel?: string;
};

export type PhotoTextDetailData = {
  content: FeedItemCardContent & { photoText: NonNullable<FeedItemCardContent["photoText"]> };
  timestamp: string;
  anchors: PhotoTextDetailAnchor[];
  comments: PhotoTextDetailComment[];
};

export type PhotoTextDetailCommentMedia =
  | {
      type: "image";
      url: string;
      display: CommentImageDisplay;
    }
  | {
      type: "sticker";
      url: string;
    }
  | {
      type: "audio";
      duration: string;
      text: string;
    };

const DETAIL_RICH_COMMENT_LIMIT = 8;
const DETAIL_RICH_REPLY_PREVIEW_LIMIT = 2;

function parseCompactCount(value: string) {
  const normalizedValue = value.trim().toLowerCase().replace(/,/g, "");
  const match = /^(\d+(?:\.\d+)?)([kmb])?$/.exec(normalizedValue);
  if (!match) return 0;
  const amount = Number.parseFloat(match[1]);
  if (!Number.isFinite(amount)) return 0;
  if (match[2] === "b") return Math.round(amount * 1_000_000_000);
  if (match[2] === "m") return Math.round(amount * 1_000_000);
  if (match[2] === "k") return Math.round(amount * 1_000);
  return Math.round(amount);
}

function parseReplyCount(label: string | undefined) {
  if (!label) return 0;
  const match = /(\d+)/.exec(label);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function buildDetailCommentMedia(
  media: CommentMediaSpec | undefined,
): PhotoTextDetailCommentMedia | undefined {
  if (!media?.visible) return undefined;
  if (media.type === "image") {
    return {
      type: "image",
      url: media.url,
      display: media.display,
    };
  }
  if (media.type === "sticker") {
    return {
      type: "sticker",
      url: getCommentStickerSrc(media.stickerRef),
    };
  }
  return {
    type: "audio",
    duration: media.duration,
    text: media.text,
  };
}

function shouldShowDetailCommentNode(node: CommentContentNode) {
  return !(node.media?.visible && node.media.type === "audio");
}

function selectCommentDocument(
  content: FeedItemCardContent & { photoText: NonNullable<FeedItemCardContent["photoText"]> },
): CommentContentDocument {
  const searchableText = [
    content.id,
    content.nickname,
    content.description,
    content.photoText.title,
    content.photoText.desc,
    content.location ?? "",
  ].join(" ").toLowerCase();

  if (/\b(tokyo|osaka|kyoto|travel|trip|canal|glico)\b/.test(searchableText)) {
    return getCommentContentPreset("kyoto-trip")?.document ?? DEFAULT_COMMENT_CONTENT_DOCUMENT;
  }

  if (/\b(panetic|unexpected|taylor|cat|comedy|meme|funny)\b/.test(searchableText)) {
    return getCommentContentPreset("comedy-chaos")?.document ?? DEFAULT_COMMENT_CONTENT_DOCUMENT;
  }

  if (/\b(seneca|quote|happiness|thought|book|reading)\b/.test(searchableText)) {
    return getCommentContentPreset("hot-takes")?.document ?? DEFAULT_COMMENT_CONTENT_DOCUMENT;
  }

  return DEFAULT_COMMENT_CONTENT_DOCUMENT;
}

function mapCommentContentNodeToDetailComment({
  node,
  content,
  depth,
}: {
  node: CommentContentNode;
  content: FeedItemCardContent & { photoText: NonNullable<FeedItemCardContent["photoText"]> };
  depth: 0 | 1;
}): PhotoTextDetailComment {
  const isCreator = node.authorLabel === "Creator";
  const replyPreview = depth === 0
    ? node.replies
        .filter(shouldShowDetailCommentNode)
        .slice(0, DETAIL_RICH_REPLY_PREVIEW_LIMIT)
        .map((reply) =>
          mapCommentContentNodeToDetailComment({
            node: reply,
            content,
            depth: 1,
          }),
        )
    : [];
  const creatorReply = node.replies.find((reply) => reply.authorLabel === "Creator");
  const avatarUrl = isCreator
    ? content.avatarUrl
    : resolveCommentAvatarSrc(node.authorAvatarSrc, depth === 0 ? 36 : 24);
  const replyCount = Math.max(
    node.replies.filter(shouldShowDetailCommentNode).length,
    parseReplyCount(node.viewRepliesLabel),
  );

  return {
    id: node.id,
    authorName: isCreator ? content.nickname : node.authorName,
    avatarUrl,
    authorLabel: node.authorLabel,
    body: node.content,
    postedAt: node.timeLabel,
    likeCount: parseCompactCount(node.likeCountLabel),
    likeCountLabel: node.likeCountLabel,
    creator: isCreator,
    likedByCreatorAvatarUrl: creatorReply ? content.avatarUrl : undefined,
    media: buildDetailCommentMedia(node.media),
    replies: replyPreview,
    replyCount,
    viewRepliesLabel: node.viewRepliesLabel,
  };
}

function buildRichDetailComments(
  content: FeedItemCardContent & { photoText: NonNullable<FeedItemCardContent["photoText"]> },
) {
  const document = selectCommentDocument(content);
  return document.comments
    .filter(shouldShowDetailCommentNode)
    .slice(0, DETAIL_RICH_COMMENT_LIMIT)
    .map((node) =>
      mapCommentContentNodeToDetailComment({
        node,
        content,
        depth: 0,
      }),
    );
}

const DETAIL_EXTRAS: Record<
  string,
  Pick<PhotoTextDetailData, "timestamp" | "anchors" | "comments">
> = {
  "feed-3": {
    timestamp: "Mar 11",
    anchors: [
      { id: "route", label: "Morning Route", accent: "mint" },
      { id: "weather", label: "Rain Run Club", accent: "rose" },
    ],
    comments: [
      {
        id: "run-1",
        authorName: "milesbymaya",
        avatarSlot: avatarSlotFromId("run-1"),
        body: "5k before work is elite behavior. the rain makes this feel even better.",
        postedAt: "Mar 12",
        likeCount: 128,
      },
      {
        id: "run-2",
        authorName: "coach.dani",
        avatarSlot: avatarSlotFromId("run-2"),
        body: "this is exactly the kind of easy-day pace i try to stick to. looks so calm.",
        postedAt: "Mar 12",
        likeCount: 44,
        creator: true,
        replyCount: 4,
      },
      {
        id: "run-3",
        authorName: "citystride",
        avatarSlot: avatarSlotFromId("run-3"),
        body: "wait the soundtrack choice is perfect here.",
        postedAt: "Mar 13",
        likeCount: 12,
      },
    ],
  },
  "feed-8": {
    timestamp: "Mar 11",
    anchors: [
      { id: "ux", label: "Motion recipe", accent: "mint" },
      { id: "event", label: "Live Debug · Today 5:20 PM", accent: "rose" },
    ],
    comments: [
      {
        id: "ux-1",
        authorName: "msp0rts247",
        avatarSlot: avatarSlotFromId("ux-1"),
        body: "My favorite coffee shop in LA. Their croissant might be the greatest dessert of all time.",
        postedAt: "Mar 11",
        likeCount: 885,
      },
      {
        id: "ux-2",
        authorName: "sukhmani",
        avatarSlot: avatarSlotFromId("ux-2"),
        body: "right!!! i was so skeptical at first!!!",
        postedAt: "Mar 12",
        likeCount: 885,
        creator: true,
        replyCount: 12,
      },
      {
        id: "ux-3",
        authorName: "color.field",
        avatarSlot: avatarSlotFromId("ux-3"),
        body: "idk. it looks like I’m swinging through McDonald’s on my way home. 😂",
        postedAt: "Mar 14",
        likeCount: 127,
      },
      {
        id: "ux-4",
        authorName: "yogabyangela",
        avatarSlot: avatarSlotFromId("ux-4"),
        body: "@sukhmani @raveen__sidhu @alyssa this is like the cool bars I was talking about",
        postedAt: "Mar 15",
        likeCount: 3,
        replyCount: 1,
      },
    ],
  },
  "feed-13": {
    timestamp: "Apr 2",
    anchors: [
      { id: "books", label: "Reading Slump Fix", accent: "mint" },
      { id: "club", label: "Book Club Picks", accent: "rose" },
    ],
    comments: [
      {
        id: "book-1",
        authorName: "pagefolds",
        avatarSlot: avatarSlotFromId("book-1"),
        body: "okay adding two of these to my list immediately.",
        postedAt: "Apr 3",
        likeCount: 72,
      },
      {
        id: "book-2",
        authorName: "mara.reads",
        avatarSlot: avatarSlotFromId("book-2"),
        body: "Shelf reset is such a good title for this. feels like a clean start.",
        postedAt: "Apr 4",
        likeCount: 21,
        creator: true,
      },
    ],
  },
  "study-cafe-la": {
    timestamp: "Mar 11",
    anchors: [
      { id: "city", label: "New York City", accent: "mint" },
      { id: "create", label: "Create a text image", accent: "rose" },
    ],
    comments: [
      {
        id: "study-1",
        authorName: "mrsports247",
        avatarSlot: avatarSlotFromId("study-1"),
        body: "My favorite coffee shop in LA. Their croissant might be the greatest dessert of all time.",
        postedAt: "Mar 11",
        likeCount: 152,
      },
      {
        id: "study-2",
        authorName: "bellypan",
        avatarSlot: avatarSlotFromId("study-2"),
        body: "right!!! i was so skeptical at first!!!",
        postedAt: "Mar 12",
        likeCount: 88,
        creator: true,
        replyCount: 12,
      },
    ],
  },
  "seneca-happiness": {
    timestamp: "Mar 11",
    anchors: [
      { id: "quote", label: "Quote post", accent: "mint" },
      { id: "mood", label: "Monday thoughts", accent: "rose" },
    ],
    comments: [
      {
        id: "seneca-1",
        authorName: "thebookstagirl",
        avatarSlot: avatarSlotFromId("seneca-1"),
        body: "this is beautiful. i needed this reminder today.",
        postedAt: "Mar 11",
        likeCount: 278,
      },
      {
        id: "seneca-2",
        authorName: "dessert_fix",
        avatarSlot: avatarSlotFromId("seneca-2"),
        body: "same. i kept rereading it this morning and had to save it here.",
        postedAt: "Mar 11",
        likeCount: 189,
        creator: true,
        replyCount: 9,
      },
      {
        id: "seneca-3",
        authorName: "paperlatte",
        avatarSlot: avatarSlotFromId("seneca-3"),
        body: "the typography + texture makes it feel like an old library postcard.",
        postedAt: "Mar 12",
        likeCount: 63,
      },
      {
        id: "seneca-4",
        authorName: "mondaymurmurs",
        avatarSlot: avatarSlotFromId("seneca-4"),
        body: "trying very hard to live by this instead of spiraling over next week.",
        postedAt: "Mar 12",
        likeCount: 41,
      },
      {
        id: "seneca-5",
        authorName: "stoiccorner",
        avatarSlot: avatarSlotFromId("seneca-5"),
        body: "seneca always finds a way to call me out gently.",
        postedAt: "Mar 13",
        likeCount: 22,
      },
    ],
  },
};

function firstPhotoTextContent() {
  return homeFeedItemContents.find(
    (item): item is FeedItemCardContent & { photoText: NonNullable<FeedItemCardContent["photoText"]> } =>
      Boolean(item.photoText),
  )!;
}

export function getPhotoTextDetailData(feedId: string | null): PhotoTextDetailData {
  return getPhotoTextDetailDataFromContent(
    homeFeedItemContents.find(
      (item): item is FeedItemCardContent & { photoText: NonNullable<FeedItemCardContent["photoText"]> } =>
        item.id === feedId && Boolean(item.photoText),
    ) ?? firstPhotoTextContent(),
  );
}

export function getPhotoTextDetailDataFromContent(
  content: FeedItemCardContent & { photoText: NonNullable<FeedItemCardContent["photoText"]> },
): PhotoTextDetailData {
  const extras =
    DETAIL_EXTRAS[content.id] ?? {
      timestamp: "Mar 11",
      anchors: [
        { id: "tag-1", label: "Photo Post", accent: "mint" as const },
        { id: "tag-2", label: "Creator Update", accent: "rose" as const },
      ],
      comments: [
        {
          id: `${content.id}-c1`,
          authorName: "viewer.notes",
          avatarSlot: avatarSlotFromId(`${content.id}-c1`),
          body: "this layout feels super polished.",
          postedAt: "Mar 11",
          likeCount: 18,
        },
      ],
    };
  const anchors = content.location
    ? [
        { id: "location", label: content.location, accent: "mint" as const },
        ...extras.anchors.slice(1),
      ]
    : extras.anchors;

  return {
    content,
    ...extras,
    anchors,
    comments: buildRichDetailComments(content),
  };
}
