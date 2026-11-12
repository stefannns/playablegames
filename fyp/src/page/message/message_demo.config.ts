import { avatarSlotFromId, localAvatarUrlForDisplay } from "../../utils/local_avatar";
import {
  localFeedVerticalCoverUrl,
  localProfileVideoThumbUrl,
} from "../../utils/local_media_placeholder";

import type { MessageThreadItem } from "./message_thread.types";

/**
 * Demo transcript — a natural back-and-forth that weaves every message kind
 * (text / emoji / image / sticker / shared video / shared post / link card)
 * through the conversation instead of dumping the media types in a row.
 *
 * Pacing rule: never more than 5 messages between timestamps, so long runs get
 * broken up the way a real chat does.
 */
export const messageDemoItems: MessageThreadItem[] = [
  { kind: "timestamp", label: "9:18 PM" },
  {
    kind: "send",
    id: "m1",
    text: "hey — found that laptop stand you've been wanting 👇",
  },
  {
    kind: "send-link",
    id: "m2",
    imageSrc: localFeedVerticalCoverUrl(11),
    title:
      "Laptop Stand Aluminum Alloy Foldable Portable Laptop Heighten Laptop Holder Bracket Notebook Stand",
    domain: "Shopee.com",
  },
  { kind: "receive", id: "m3", text: "omg perfect, ordering it now" },
  {
    kind: "receive",
    id: "m4",
    text: "anyway — I just saw your new story, looks like you had the best time 🥹",
  },
  { kind: "receive", id: "m5", text: "where even was that??" },

  { kind: "timestamp", label: "9:19 PM" },
  {
    kind: "send",
    id: "m6",
    text: "that little coast town we always talk about! finally made it",
    quotedMessageId: "m5", // reply to a text message
  },
  {
    kind: "send-image",
    id: "m7",
    imageSrc: localFeedVerticalCoverUrl(2),
  },
  { kind: "receive-emoji", id: "m8", emoji: "😍" },
  {
    kind: "receive",
    id: "m9",
    text: "ok I'm officially jealous, that view is unreal",
    reaction: "😭",
    quotedMessageId: "m7", // reply to an image
  },

  { kind: "timestamp", label: "9:20 PM" },
  { kind: "send", id: "m10", text: "haha you'd love it here" },
  {
    kind: "send",
    id: "m11",
    text: "also — tiktok just updated their stickers 👀",
  },
  { kind: "receive", id: "m12", text: "wait really? send me one" },
  {
    kind: "send-sticker",
    id: "m13",
    imageSrc: localAvatarUrlForDisplay(140, 2),
    reaction: "❤️",
  },
  {
    kind: "receive",
    id: "m14",
    text: "STOPP that's so cute 😂",
    quotedMessageId: "m13", // reply to a sticker
  },

  { kind: "timestamp", label: "9:21 PM" },
  { kind: "receive-emoji", id: "m15", emoji: "😂" },
  { kind: "send", id: "m16", text: "lol I've been using them nonstop" },
  { kind: "receive", id: "m17", text: "show me the trip videos too!" },
  { kind: "send", id: "m18", text: "ok this one's my favorite" },
  {
    kind: "video",
    id: "m19",
    thumbnail: localFeedVerticalCoverUrl(4),
  },

  { kind: "timestamp", label: "9:22 PM" },
  {
    kind: "receive",
    id: "m20",
    text: "saving this immediately 🙌",
    reaction: "🥰",
    quotedMessageId: "m19", // reply to a video
  },
  {
    kind: "receive-image",
    id: "m21",
    imageSrc: localProfileVideoThumbUrl(10),
  },
  { kind: "receive", id: "m22", text: "this was you last summer right? 😭" },
  { kind: "send", id: "m23", text: "omg yes haha that was such a good day" },
  { kind: "send-emoji", id: "m24", emoji: "😭" },

  { kind: "timestamp", label: "9:23 PM" },
  {
    kind: "shared-post",
    id: "m25",
    thumbnail: localProfileVideoThumbUrl(3),
    authorName: "@dancecrew",
    authorAvatar: localAvatarUrlForDisplay(32, avatarSlotFromId("dancecrew")),
  },
  {
    kind: "receive",
    id: "m26",
    text: "okay we're learning this one 💃",
    quotedMessageId: "m25", // reply to a shared post
  },
  { kind: "send", id: "m27", text: "okieee 🥳", isSeen: true },
];
