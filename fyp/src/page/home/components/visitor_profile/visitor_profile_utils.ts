import {
  creatorAvatarUrlForFeedDisplay,
  SELF_PROFILE_AVATAR_SRC,
} from "../../../../utils/local_avatar";
import { homeFeedItemContents } from "../feed_item_card.config";
import type { FeedItemCardContent } from "../feed_item_card";
import {
  PROFILE_EXCLUSIVE_THUMB_FEED_IDS,
  VISITOR_PROFILE_PRESETS,
  type VisitorProfilePreset,
} from "./visitor_profile_presets";

export type ProfileThumbSource = {
  thumbnailSrc: string;
  videoThumbnailSrc?: string;
};

export type VisitorVideoItem = ProfileThumbSource & {
  key: string;
  badge?: "Pinned";
  metric: string;
  /** "play" 显示在右下；"plain" 视频在更暗的底部条上 */
  metricStyle: "dark-overlay" | "soft-overlay";
};

export type VisitorHighlight = ProfileThumbSource & {
  key: string;
  label: string;
  coverSrc: string;
};

export type VisitorChipIconKey = "shop-bag" | "star" | "live-tv";

export type VisitorChip = {
  key: string;
  label: string;
  /** 左侧小圆图标背景的渐变（与设计稿的彩色 chip 一致） */
  iconGradient: string;
  /** 左侧小圆里画的具体图标 */
  iconKey: VisitorChipIconKey;
};

export type VisitorMusicVideoCard = ProfileThumbSource & {
  key: string;
  /** 已格式化好的播放量文本，例如 "2.2M" / "367K" */
  plays: string;
};

export type VisitorRepostItem = ProfileThumbSource & {
  key: string;
  /** 时间标签，例如 "2d" / "Apr 1" / "Mar 12" */
  timeAgo: string;
  /** 可选：用户转发时附带的短评（设计稿里的"白条"气泡） */
  commentBubble?: string;
  /** 是否多图作品（右上角显示叠加角标） */
  isAlbum?: boolean;
};

export type VisitorShopPromoTag = "flash-sale" | "hot-deals";

export type VisitorShopProduct = ProfileThumbSource & {
  key: string;
  imageSrc: string;
  title: string;
  /** 已格式化好的价格字符串，例如 "$118.60" 或 "Rp89.000.000" */
  price: string;
  /** 价格货币前缀（与 price 分开，便于设计稿那种 "$" 小一号的排版） */
  priceCurrency: string;
  /** 价格主体数字（不含货币） */
  priceAmount: string;
  promoTags: VisitorShopPromoTag[];
  /** 已格式化好的销量，例如 "990 sold" */
  soldLabel: string;
};

export type VisitorShop = {
  /** 品牌名，例如 "Bella Chris Fashion" */
  brandName: string;
  /** 品牌徽章右侧的副标题，例如 "TOP BRAND" */
  brandBadgeLabel: string;
  /** 促销 banner 文本片段，例如 "Get 30% off on all items over $30" */
  promoText: string;
  /** 促销 banner 里要突出的红色片段，例如 "30% off" */
  promoHighlight: string;
  products: VisitorShopProduct[];
};

export type VisitorMusicTrack = {
  key: string;
  title: string;
  /** 已格式化好的使用量文本，例如 "Used by 482.7K posts" */
  usedByLabel: string;
  /** 时长，"1:00" 形式 */
  duration: string;
  /** 封面图 */
  coverSrc: string;
  /** 仅高亮的首条音乐有这个字段：3 个视频缩略图 */
  highlightVideos?: VisitorMusicVideoCard[];
};

export type VisitorProfileData = {
  nickname: string;
  handle: string;
  category: string;
  avatarUrl: string;
  followingCount: string;
  followersCount: string;
  likesCount: string;
  pronouns: string;
  bio: string;
  link: string;
  linkSuffix: string;
  chips: VisitorChip[];
  highlights: VisitorHighlight[];
  playlists: string[];
  videos: VisitorVideoItem[];
  musicTracks: VisitorMusicTrack[];
  reposts: VisitorRepostItem[];
  shop: VisitorShop;
};

const FALLBACK_BIO =
  "Sharing little wins, behind-the-scenes, and the kind of moments that make the day worth posting.";

const PRONOUN_OPTIONS = ["She/her", "He/him", "They/them", "She/they"] as const;
const CATEGORY_OPTIONS = [
  "Creator",
  "Artist",
  "Photographer",
  "Producer",
  "Designer",
  "Athlete",
  "Foodie",
  "Storyteller",
] as const;

const HIGHLIGHT_LABEL_OPTIONS = [
  "Italy",
  "⛰️Hiking",
  "Spring",
  "🍜",
  "Studio",
  "Travel",
  "Tokyo",
  "Friends",
  "Workout",
  "Coffee",
] as const;

function profilePreset(content: FeedItemCardContent): VisitorProfilePreset | null {
  return VISITOR_PROFILE_PRESETS[content.id] ?? null;
}

let feedById: Map<string, FeedItemCardContent> | null = null;

function getFeedById(): Map<string, FeedItemCardContent> {
  if (!feedById) {
    feedById = new Map(homeFeedItemContents.map((item) => [item.id, item]));
  }
  return feedById;
}

function thumbSourceForFeed(item: FeedItemCardContent): ProfileThumbSource {
  if (item.mediaType === "video") {
    return {
      thumbnailSrc: item.mediaPoster ?? item.mediaSrc,
      videoThumbnailSrc: item.mediaSrc,
    };
  }
  return { thumbnailSrc: item.mediaPoster ?? item.mediaSrc };
}

function thumbVisualKey(thumb: ProfileThumbSource): string {
  return thumb.videoThumbnailSrc ?? thumb.thumbnailSrc;
}

/** All distinct thumb candidates for one feed (video frame, static poster, photo carousel). */
function allThumbCandidatesForFeed(item: FeedItemCardContent): ProfileThumbSource[] {
  const candidates: ProfileThumbSource[] = [];
  const seen = new Set<string>();

  const push = (thumb: ProfileThumbSource) => {
    const key = thumbVisualKey(thumb);
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(thumb);
  };

  push(thumbSourceForFeed(item));

  if (item.mediaType === "video") {
    const poster = item.mediaPoster ?? item.mediaSrc;
    push({ thumbnailSrc: poster });
  }

  for (const src of item.photoText?.images ?? []) {
    push({ thumbnailSrc: src });
  }

  return candidates;
}

function canBorrowFeedThumb(viewerFeedId: string, thumbFeedId: string): boolean {
  return (
    !PROFILE_EXCLUSIVE_THUMB_FEED_IDS.has(thumbFeedId) ||
    viewerFeedId === thumbFeedId
  );
}

function orderedThemedFeedIds(
  content: FeedItemCardContent,
  relatedFeedIds: readonly string[],
): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const feedId of [content.id, ...relatedFeedIds]) {
    if (!canBorrowFeedThumb(content.id, feedId)) continue;
    if (seen.has(feedId)) continue;
    seen.add(feedId);
    ids.push(feedId);
  }
  return ids;
}

/** Pick up to `count` thumbs — never repeats the same visual within one tab/grid. */
function pickThemedThumbs(
  content: FeedItemCardContent,
  count: number,
  preset: VisitorProfilePreset | null,
): ProfileThumbSource[] {
  const feedIds = orderedThemedFeedIds(content, preset?.relatedFeedIds ?? []);
  const feedByIdMap = getFeedById();
  const used = new Set<string>();
  const result: ProfileThumbSource[] = [];

  const tryPush = (thumb: ProfileThumbSource) => {
    if (result.length >= count) return;
    const key = thumbVisualKey(thumb);
    if (used.has(key)) return;
    used.add(key);
    result.push(thumb);
  };

  // Pass 1: one primary thumb per themed feed (grid slot 1 = current feed, 2–9 = 8 others).
  for (const feedId of feedIds) {
    if (result.length >= count) break;
    const item = feedByIdMap.get(feedId);
    if (!item) continue;
    tryPush(thumbSourceForFeed(item));
  }

  // Pass 2: extra posters / photo-carousel frames — still no visual repeat.
  for (const feedId of feedIds) {
    if (result.length >= count) break;
    const item = feedByIdMap.get(feedId);
    if (!item) continue;
    for (const thumb of allThumbCandidatesForFeed(item)) {
      if (result.length >= count) break;
      tryPush(thumb);
    }
  }

  if (result.length === 0) {
    tryPush(thumbSourceForFeed(content));
  }

  return result;
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickFromSeed<T>(seed: number, options: readonly T[]): T {
  return options[seed % options.length];
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatPlain(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

function formatMetric(value: number) {
  // 较大数用紧凑写法（12.4M / 16.5K），较小数显示原始数字（如 9,126）。
  if (value < 10_000) return formatPlain(value);
  return formatCompact(value);
}

/** Guest profile reads as an active creator — avoid literal 0 in displayed counts. */
function profileDisplayCount(
  raw: number,
  content: FeedItemCardContent,
  seed: number,
  salt: number,
): number {
  const rounded = Math.round(raw);
  if (rounded > 0) return rounded;

  const anchor = Math.max(
    content.likeCount,
    content.favoriteCount * 2,
    content.commentCount * 4,
    1,
  );
  const tierFloor =
    anchor >= 500_000 ? 4_800 : anchor >= 50_000 ? 620 : anchor >= 5_000 ? 96 : anchor >= 500 ? 18 : 4;
  return tierFloor + ((seed + salt) % Math.max(8, Math.round(tierFloor * 0.4)));
}

function profileHeaderCount(raw: number, min: number): number {
  const rounded = Math.round(raw);
  return Math.max(min, rounded);
}

function handleFromName(name: string) {
  const normalized = name
    .toLowerCase()
    .replace(/\s*&\s*/g, "and")
    .replace(/[^a-z0-9]+/g, "");
  return `@${normalized}`;
}

function creatorHandle(
  content: FeedItemCardContent,
  preset: VisitorProfilePreset | null,
): string {
  if (preset?.linkSlug) {
    const base = preset.linkSlug.split(".")[0] ?? preset.linkSlug;
    return `@${base}`;
  }
  return handleFromName(content.nickname);
}

/** Keep Music tab artist labels aligned with feed `musicTitle` / creator nickname. */
function alignMusicTitleWithCreator(title: string, nickname: string): string {
  if (title.includes(nickname)) return title;

  const dashIndex = title.lastIndexOf(" - ");
  if (dashIndex === -1) return `${title} - ${nickname}`;

  const song = title.slice(0, dashIndex);
  const tail = title.slice(dashIndex + 3).trim();
  const genericTails = new Set(["Single", "EP", "Slow", "Extended", "Remix", "Ambient", "Loop"]);
  const first = nickname.split(" ")[0];

  if (genericTails.has(tail)) return `${song} - ${nickname}`;
  if (tail === first || tail.startsWith(`${first} `)) return `${song} - ${nickname}`;

  return title;
}

/** 主态个人页 Music / Repost / Shop tab 与客态共用同一套 mock 数据派生逻辑 */
export function deriveSelfProfileTabData(): Pick<
  VisitorProfileData,
  "musicTracks" | "reposts" | "shop"
> {
  const content: FeedItemCardContent = {
    id: "self-profile-coldplay",
    mediaType: "video",
    mediaSrc: "https://picsum.photos/seed/tux-pinned-1/258/346",
    mediaPoster: "https://picsum.photos/seed/tux-pinned-1/258/346",
    nickname: "Coldplay",
    description:
      "Tik Official Coldplay Tok. The new album, Moon Music, out now. Your Japanese bestie🇯🇵🫶#comedy",
    avatarUrl: SELF_PROFILE_AVATAR_SRC,
    musicTitle: "Moon Music",
    musicCoverUrl: "https://picsum.photos/seed/tux-moon-music-cover/144/144",
    likeCount: 6_500_000,
    commentCount: 120_000,
    favoriteCount: 890_000,
    shareCount: 45_000,
  };
  const data = deriveVisitorProfileData(content);
  return {
    musicTracks: data.musicTracks,
    reposts: data.reposts,
    shop: data.shop,
  };
}

export function deriveVisitorProfileData(content: FeedItemCardContent): VisitorProfileData {
  const seed = hashString(content.id);
  const preset = profilePreset(content);

  const category = preset?.category ?? pickFromSeed(seed >> 1, CATEGORY_OPTIONS);
  const pronouns = preset?.pronouns ?? pickFromSeed(seed >> 2, PRONOUN_OPTIONS);

  // Followers ~ likes 数量级；Following 走小数字（客态不出现 0）
  const followers = profileHeaderCount(content.likeCount * 0.85, 1_200);
  const following = profileHeaderCount(24 + (seed % 320), 42);
  const totalLikes = profileHeaderCount(
    content.likeCount * 12 + content.favoriteCount * 5,
    120,
  );

  const highlightLabels = preset
    ? [...preset.highlights]
    : Array.from({ length: 4 }, (_, index) =>
        HIGHLIGHT_LABEL_OPTIONS[(seed + index * 3) % HIGHLIGHT_LABEL_OPTIONS.length],
      );
  const highlightThumbs = preset
    ? pickThemedThumbs(content, highlightLabels.length, preset)
    : [thumbSourceForFeed(content)];
  const highlights: VisitorHighlight[] = highlightLabels
    .slice(0, highlightThumbs.length)
    .map((label, index) => {
      const thumb = highlightThumbs[index]!;
      return {
        key: `${content.id}-hl-${index}`,
        label,
        coverSrc: thumb.thumbnailSrc,
        thumbnailSrc: thumb.thumbnailSrc,
        videoThumbnailSrc: thumb.videoThumbnailSrc,
      };
    });

  // 视频九宫格：每格不同 feed / 不同画面，凑不满就不硬填重复格
  const gridThumbs = pickThemedThumbs(content, 9, preset);
  const extraMetricsSeed = [
    content.commentCount * 3,
    content.favoriteCount,
    Math.round(content.likeCount * 0.6),
    Math.round(content.shareCount * 12),
    Math.round(content.likeCount * 0.32),
    Math.round(content.favoriteCount * 0.4),
    Math.round(content.commentCount * 5.5),
    Math.round(content.favoriteCount * 0.8),
  ];
  const baseVideos: VisitorVideoItem[] = gridThumbs.map((thumb, index) => ({
    key: `${content.id}-v-${index}`,
    thumbnailSrc: thumb.thumbnailSrc,
    videoThumbnailSrc: thumb.videoThumbnailSrc,
    badge: index === 0 || index === 1 ? "Pinned" : undefined,
    metric: formatMetric(
      profileDisplayCount(
        index === 0 ? content.likeCount : extraMetricsSeed[index - 1] ?? 12_000,
        content,
        seed,
        index,
      ),
    ),
    metricStyle: index % 3 === 1 ? "soft-overlay" : "dark-overlay",
  }));

  const trackTitles = [
    content.musicTitle,
    ...(preset?.extraMusicTitles ?? [
      `${content.nickname} Mix - Single`,
      "Late Drive - Single",
      "After Hours - EP",
      "Soft Glow - Single",
    ]).map((title) => alignMusicTitleWithCreator(title, content.nickname)),
  ];
  const trackUseCounts = [
    profileDisplayCount(Math.max(120_000, content.likeCount * 0.6), content, seed, 20),
    profileDisplayCount(Math.max(5_000, content.commentCount * 1.3), content, seed, 21),
    profileDisplayCount(Math.max(800, content.shareCount * 1.4), content, seed, 22),
    profileDisplayCount(Math.max(400, content.shareCount * 0.7), content, seed, 23),
    profileDisplayCount(Math.max(300, content.shareCount * 0.4), content, seed, 24),
  ];
  const highlightPlayCounts = [
    profileDisplayCount(content.likeCount * 0.95, content, seed, 30),
    profileDisplayCount(content.likeCount * 1.45, content, seed, 31),
    profileDisplayCount(content.likeCount * 0.45, content, seed, 32),
  ];
  const musicTracks: VisitorMusicTrack[] = trackTitles.map((title, index) => {
    const baseTrack: VisitorMusicTrack = {
      key: `${content.id}-track-${index}`,
      title,
      usedByLabel: `Used by ${formatMetric(trackUseCounts[index])} posts`,
      duration: "1:00",
      coverSrc:
        index === 0
          ? content.musicCoverUrl
          : `https://picsum.photos/seed/${content.id}-track-${index}-cover/144/144`,
    };
    if (index === 0) {
      const musicClipThumbs = pickThemedThumbs(content, 3, preset);
      baseTrack.highlightVideos = musicClipThumbs.map((thumb, clipIndex) => ({
        key: `${content.id}-track-${index}-clip-${clipIndex}`,
        thumbnailSrc: thumb.thumbnailSrc,
        videoThumbnailSrc: thumb.videoThumbnailSrc,
        plays: formatMetric(highlightPlayCounts[clipIndex]),
      }));
    }
    return baseTrack;
  });

  const chips: VisitorChip[] = [
    {
      key: "showcase",
      label: "Showcase",
      iconGradient: "linear-gradient(135deg, #FE2C55 0%, #F5A0FF 100%)",
      iconKey: "shop-bag",
    },
    {
      key: "subscription",
      label: "Subscription",
      iconGradient: "linear-gradient(135deg, #F5A0FF 0%, #FE2C55 100%)",
      iconKey: "star",
    },
    {
      key: "next-live",
      label: "LIVE",
      iconGradient: "linear-gradient(135deg, #25F4EE 0%, #FE2C55 100%)",
      iconKey: "live-tv",
    },
  ];

  return {
    nickname: content.nickname,
    handle: creatorHandle(content, preset),
    category,
    avatarUrl: creatorAvatarUrlForFeedDisplay(96, content.id),
    followingCount: formatCompact(following),
    followersCount: formatCompact(followers),
    likesCount: formatCompact(totalLikes),
    pronouns,
    bio: content.description || FALLBACK_BIO,
    link: preset?.linkSlug ?? `${content.nickname.split(" ")[0].toLowerCase()}.app/links`,
    linkSuffix: "and 1 more",
    chips,
    highlights,
    playlists: preset?.playlists ?? [
      `Best of ${content.nickname}`,
      "Daily picks",
    ],
    videos: baseVideos,
    musicTracks,
    reposts: buildReposts(content, seed, preset),
    shop: buildShop(content, seed, preset),
  };
}

const REPOST_TIME_LABELS = [
  "2d",
  "3d",
  "3d",
  "4d",
  "7d",
  "7d",
  "Apr 2",
  "Apr 1",
  "Apr 1",
  "Mar 20",
  "Mar 12",
  "Mar 10",
];

const REPOST_COMMENT_BUBBLES = [
  "LOL",
  "👍👍👍",
  "❤hhhhh",
  "Nice try!",
  "🔥🔥",
  "Saved",
];

const SHOP_PRODUCT_TITLES = [
  "friendly reusable tote bag - vintage",
  "Anua official pink white tee",
  "Vintage trench coat - camel beige",
  "Soft cotton blouse - dusty pink",
  "Wide-leg linen trousers - sand",
  "Pearl button cardigan - cream",
];

const SHOP_BADGE_LABELS = ["TOP BRAND", "OFFICIAL STORE", "VERIFIED BRAND"];

function buildShop(
  content: FeedItemCardContent,
  seed: number,
  preset: VisitorProfilePreset | null,
): VisitorShop {
  const brandBadgeLabel = SHOP_BADGE_LABELS[(seed >> 2) % SHOP_BADGE_LABELS.length];
  const discountPct = 10 + ((seed >> 1) % 5) * 5; // 10%, 15%, 20%, 25%, 30%
  const threshold = 20 + ((seed >> 3) % 4) * 10; // $20-$50
  const productTitles = preset?.shopProducts ?? SHOP_PRODUCT_TITLES;
  const productThumbs = preset
    ? pickThemedThumbs(content, productTitles.length, preset)
    : [thumbSourceForFeed(content)];

  const products: VisitorShopProduct[] = productTitles
    .slice(0, productThumbs.length)
    .map((title, index) => {
    const usdPriceCents = 1899 + ((seed + index * 137) % 12000); // 18.99 – 138.99
    const price = (usdPriceCents / 100).toFixed(2);
    const promoFlash = (seed + index * 5) % 2 === 0;
    const promoHot = (seed + index * 7) % 3 === 0;
    const promoTags: VisitorShopPromoTag[] = [];
    if (promoFlash) promoTags.push("flash-sale");
    if (promoHot) promoTags.push("hot-deals");

    const soldCount = profileDisplayCount(
      80 + ((seed + index * 41) % 9920),
      content,
      seed,
      50 + index,
    );
    const thumb = productThumbs[index]!;
    return {
      key: `${content.id}-prod-${index}`,
      imageSrc: thumb.thumbnailSrc,
      thumbnailSrc: thumb.thumbnailSrc,
      videoThumbnailSrc: thumb.videoThumbnailSrc,
      title,
      price: `$${price}`,
      priceCurrency: "$",
      priceAmount: price,
      promoTags,
      soldLabel: `${formatMetric(soldCount)} sold`,
    };
  });

  return {
    brandName: content.nickname,
    brandBadgeLabel,
    promoText: `Get ${discountPct}% off on all items over $${threshold}`,
    promoHighlight: `${discountPct}% off`,
    products,
  };
}

function buildReposts(
  content: FeedItemCardContent,
  seed: number,
  preset: VisitorProfilePreset | null,
): VisitorRepostItem[] {
  const bubblePool = preset?.repostBubbles ?? REPOST_COMMENT_BUBBLES;
  const repostThumbs = preset
    ? pickThemedThumbs(content, REPOST_TIME_LABELS.length, preset)
    : [thumbSourceForFeed(content)];
  return REPOST_TIME_LABELS.slice(0, repostThumbs.length).map((timeAgo, index) => {
    const isAlbum = (seed + index) % 5 === 0;
    const hasBubble = (seed + index * 7) % 4 === 0;
    const thumb = repostThumbs[index]!;
    const item: VisitorRepostItem = {
      key: `${content.id}-rp-${index}`,
      thumbnailSrc: thumb.thumbnailSrc,
      videoThumbnailSrc: thumb.videoThumbnailSrc,
      timeAgo,
    };
    if (hasBubble) {
      item.commentBubble = bubblePool[(seed + index * 3) % bubblePool.length];
    }
    if (isAlbum) {
      item.isAlbum = true;
    }
    return item;
  });
}
