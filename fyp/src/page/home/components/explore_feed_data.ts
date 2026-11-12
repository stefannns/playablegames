import type { FeedItemCardContent } from "./feed_item_card";
import {
  HOME_FEED_IMAGE_PARAM,
  HOME_FEED_PARAM,
} from "../../photo_text_detail/photo_text_detail_route";

export type ExploreFeedItem = {
  id: string;
  title: string;
  author: string;
  likes: string;
  imageSrc: string;
  avatarSrc: string;
  aspect: readonly [number, number];
  mediaType: "image" | "video";
  badge?: "image" | "none" | "video";
  commentCount?: number;
  favoriteCount?: number;
  shareCount?: number;
  detailDesc?: string;
  detailImages?: string[];
};

const ASSET_BASE = "/resource/explore_feed";
const EXPLORE_DETAIL_PARAM = "exploreDetail";
const TOKYO_LIST_IMG = `${ASSET_BASE}/tokyo-list.jpg`;
const ICED_COFFEE_IMG = `${ASSET_BASE}/iced-coffee.jpg`;
const DESK_JOURNAL_IMG = `${ASSET_BASE}/desk-journal.jpg`;
const PINK_GUAVA_IMG = `${ASSET_BASE}/pink-guava.jpg`;
const ORANGE_CAT_IMG = `${ASSET_BASE}/orange-cat.png`;
const WINTER_OUTFIT_01_IMG = `${ASSET_BASE}/winter-outfit-01.webp`;
const GLICO_NIGHT_IMG = `${ASSET_BASE}/glico-night.png`;
const WINTER_OUTFIT_02_IMG = `${ASSET_BASE}/winter-outfit-02.webp`;
const OSAKA_CANAL_IMG = `${ASSET_BASE}/osaka-canal.png`;

export const leftColumnItems: ExploreFeedItem[] = [
  {
    id: "seneca-happiness",
    title:
      "True happiness is to enjoy the present, without anxious dependence upon the future.",
    author: "dessert_fix",
    likes: "251.7K",
    imageSrc: `${ASSET_BASE}/post-01.png`,
    avatarSrc: `${ASSET_BASE}/avatar-01.png`,
    aspect: [189, 188],
    mediaType: "image",
  },
  {
    id: "study-cafe-la",
    title: "reviewing study cafes in LA part one",
    author: "bellypan",
    likes: "99.1K",
    commentCount: 930,
    favoriteCount: 810,
    shareCount: 674,
    imageSrc: `${ASSET_BASE}/post-02.png`,
    avatarSrc: `${ASSET_BASE}/avatar-03.png`,
    aspect: [3, 4],
    mediaType: "image",
    detailDesc:
      "overall: i loved this cafe and see this being a staple during finals season.",
  },
  {
    id: "panetic",
    title: "you're panetic, you know that?",
    author: "thenandnow",
    likes: "42.8K",
    imageSrc: `${ASSET_BASE}/post-05.png`,
    avatarSrc: `${ASSET_BASE}/avatar-05.png`,
    aspect: [3, 4],
    mediaType: "video",
  },
  {
    id: "cozy-corner",
    title: "a small corner that made the whole afternoon feel softer",
    author: "slowdiary",
    likes: "18.2K",
    imageSrc: `${ASSET_BASE}/post-06.png`,
    avatarSrc: `${ASSET_BASE}/avatar-07.png`,
    aspect: [3, 4],
    mediaType: "image",
  },
  {
    id: "tokyo-must-visit",
    title: "my list of must visit places in Tokyo",
    author: "nightticket",
    likes: "54.9K",
    commentCount: 801,
    favoriteCount: 692,
    shareCount: 451,
    imageSrc: TOKYO_LIST_IMG,
    avatarSrc: `${ASSET_BASE}/avatar-01.png`,
    aspect: [1116, 1548],
    mediaType: "image",
    detailDesc:
      "finally pinned the spots I keep saving for Tokyo: tower light, giant sign, and the canal walk.",
    detailImages: [TOKYO_LIST_IMG, GLICO_NIGHT_IMG, OSAKA_CANAL_IMG],
  },
  {
    id: "desk-reset",
    title: "today's desk trio: lock screen, grid paper, silver pen",
    author: "m.stand",
    likes: "12.6K",
    imageSrc: DESK_JOURNAL_IMG,
    avatarSrc: `${ASSET_BASE}/avatar-03.png`,
    aspect: [684, 1004],
    mediaType: "image",
    detailDesc:
      "small things that make a workday feel more put together.",
    detailImages: [DESK_JOURNAL_IMG, ICED_COFFEE_IMG, PINK_GUAVA_IMG],
  },
  {
    id: "cat-sidequest",
    title: "met the roundest little supervisor on my walk",
    author: "tinyroutes",
    likes: "88.4K",
    imageSrc: ORANGE_CAT_IMG,
    avatarSrc: `${ASSET_BASE}/avatar-05.png`,
    aspect: [436, 520],
    mediaType: "image",
    detailDesc:
      "I was ready to be late if that meant one more minute saying hi.",
  },
  {
    id: "osaka-canal-ride",
    title: "Osaka looked unreal from the canal today",
    author: "glowframe",
    likes: "64.2K",
    imageSrc: OSAKA_CANAL_IMG,
    avatarSrc: `${ASSET_BASE}/avatar-07.png`,
    aspect: [1340, 1566],
    mediaType: "image",
    detailDesc:
      "another angle from the same save folder. every street felt like a postcard.",
    detailImages: [OSAKA_CANAL_IMG, TOKYO_LIST_IMG, GLICO_NIGHT_IMG],
  },
];

export const rightColumnItems: ExploreFeedItem[] = [
  {
    id: "unexpected-taylor",
    title: "not what i was expecting #taylorswift",
    author: "abc7la",
    likes: "1,790",
    imageSrc: `${ASSET_BASE}/post-03.png`,
    avatarSrc: `${ASSET_BASE}/avatar-02.png`,
    aspect: [4, 5],
    mediaType: "image",
  },
  {
    id: "night-sign",
    title: "found the best light on the walk home",
    author: "afterhours",
    likes: "31.5K",
    imageSrc: `${ASSET_BASE}/post-07.png`,
    avatarSrc: `${ASSET_BASE}/avatar-06.png`,
    aspect: [9, 16],
    mediaType: "video",
  },
  {
    id: "blue-bottle-run",
    title: "the coffee order that fixes the whole morning",
    author: "weekdaynote",
    likes: "23.7K",
    imageSrc: ICED_COFFEE_IMG,
    avatarSrc: `${ASSET_BASE}/avatar-02.png`,
    aspect: [684, 1004],
    mediaType: "image",
    detailDesc:
      "iced coffee, planner, and one small fruit stop. that was the whole reset.",
    detailImages: [ICED_COFFEE_IMG, DESK_JOURNAL_IMG, PINK_GUAVA_IMG],
  },
  {
    id: "pink-guava-morning",
    title: "pink guava on glass feels like a small luxury",
    author: "softkitchen",
    likes: "9.8K",
    imageSrc: PINK_GUAVA_IMG,
    avatarSrc: `${ASSET_BASE}/avatar-08.png`,
    aspect: [760, 1080],
    mediaType: "image",
    detailDesc:
      "the prettiest thing in the kitchen this week.",
    detailImages: [PINK_GUAVA_IMG, ICED_COFFEE_IMG, DESK_JOURNAL_IMG],
  },
  {
    id: "winter-outfits",
    title: "winter outfits inspo",
    author: "sinaanjulie",
    likes: "211.4K",
    commentCount: 1920,
    favoriteCount: 1280,
    shareCount: 1042,
    imageSrc: WINTER_OUTFIT_01_IMG,
    avatarSrc: `${ASSET_BASE}/avatar-04.png`,
    aspect: [2160, 2880],
    mediaType: "image",
    detailDesc:
      "oversized suede, a big bag, and layers that still feel clean.",
    detailImages: [WINTER_OUTFIT_01_IMG, WINTER_OUTFIT_02_IMG],
  },
  {
    id: "glico-after-rain",
    title: "finally saw the Glico sign in person",
    author: "framebyframe",
    likes: "37.3K",
    imageSrc: GLICO_NIGHT_IMG,
    avatarSrc: `${ASSET_BASE}/avatar-06.png`,
    aspect: [1434, 1736],
    mediaType: "image",
    detailDesc:
      "saved this view for years and it still felt surreal in person.",
    detailImages: [GLICO_NIGHT_IMG, OSAKA_CANAL_IMG, TOKYO_LIST_IMG],
  },
  {
    id: "corner-coffee-walk",
    title: "the coat, the beanie, the corner coffee stop",
    author: "sinaanjulie",
    likes: "76.8K",
    imageSrc: WINTER_OUTFIT_02_IMG,
    avatarSrc: `${ASSET_BASE}/avatar-02.png`,
    aspect: [2160, 2880],
    mediaType: "image",
    detailDesc:
      "another frame from the same outfit folder, this time with the coffee run.",
    detailImages: [WINTER_OUTFIT_02_IMG, WINTER_OUTFIT_01_IMG],
  },
];

const allExploreFeedItems = [...leftColumnItems, ...rightColumnItems];

export const exploreFeedItemsById = Object.fromEntries(
  allExploreFeedItems.map((item) => [item.id, item]),
) as Record<string, ExploreFeedItem>;

function parseCompactCount(value: string) {
  const normalized = value.trim().toUpperCase().replace(/,/g, "");
  if (!normalized) return 0;
  const match = normalized.match(/^(\d+(?:\.\d+)?)([KM]?)$/);
  if (!match) return 0;
  const amount = Number.parseFloat(match[1]);
  if (!Number.isFinite(amount)) return 0;
  if (match[2] === "M") return Math.round(amount * 1_000_000);
  if (match[2] === "K") return Math.round(amount * 1_000);
  return Math.round(amount);
}

export function buildExploreDetailHref(feedId: string, imageIndex = 0) {
  const params = new URLSearchParams({
    [HOME_FEED_PARAM]: feedId,
    [HOME_FEED_IMAGE_PARAM]: String(Math.max(0, imageIndex)),
    returnFeed: feedId,
    [EXPLORE_DETAIL_PARAM]: "1",
  });
  return `/app/home?${params.toString()}`;
}

export function parseExploreDetailItemId(search: string) {
  const params = new URLSearchParams(search);
  if (params.get(EXPLORE_DETAIL_PARAM) !== "1") return null;
  const feedId = params.get(HOME_FEED_PARAM);
  if (!feedId) return null;
  return exploreFeedItemsById[feedId] ? feedId : null;
}

export function buildExploreDetailSnapshot(
  item: ExploreFeedItem,
): FeedItemCardContent {
  const likeCount = parseCompactCount(item.likes);
  const commentCount =
    item.commentCount ?? Math.max(12, Math.round(likeCount * 0.018));
  const favoriteCount =
    item.favoriteCount ?? Math.max(8, Math.round(likeCount * 0.011));
  const shareCount =
    item.shareCount ?? Math.max(4, Math.round(likeCount * 0.005));

  return {
    id: item.id,
    mediaType: item.mediaType,
    mediaSrc: item.imageSrc,
    mediaAlt: item.title,
    mediaPoster: item.imageSrc,
    nickname: item.author,
    description: item.title,
    avatarUrl: item.avatarSrc,
    musicTitle: `original sound - ${item.author}`,
    musicCoverUrl: item.imageSrc,
    likeCount,
    commentCount,
    favoriteCount,
    shareCount,
    photoText: {
      images: item.detailImages ?? [item.imageSrc],
      title: item.title,
      desc: item.detailDesc ?? item.title,
    },
  };
}
