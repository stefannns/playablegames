import type { FeedItemCardContent } from "./feed_item_card";
import {
  resolveFeedCommentCount,
  resolveFeedEngagementMetrics,
} from "./comment_panel/comment_feed_documents";
import { creatorAvatarUrlForFeedDisplay } from "../../../utils/local_avatar";
import { PLAYABLE_LIBRARY } from "./playable_library";
import { PLAYABLE_LOCAL_GAMES } from "./playable_local_games";
import { PLAYABLE_BATCH_GAMES, isBatchReview } from "./playable_batch_games";
import { PLAYABLE_PILOT_GAMES } from "./playable_pilot_games";
import { selectReviewShowcase } from "./playable_batch_showcase.mjs";
import { selectReviewPool } from "./playable_review_pool.mjs";
import {
  localFeedVerticalCoverUrl,
  localFeedVideoPosterUrl,
  localFeedVideoUrl,
  localMusicCoverUrl,
} from "../../../utils/local_media_placeholder";

/** Feed rail avatar ~44 CSS px — slot derived from `content.id` for profile parity. */
function feedAvatar(feedId: string) {
  return creatorAvatarUrlForFeedDisplay(44, feedId);
}

function photoPostImages(seed: number, count: number) {
  return Array.from({ length: count }, (_, index) =>
    localFeedVerticalCoverUrl(seed + index),
  );
}

const FIRST_FEED_MUSIC_COVER_URL =
  "/resource/music_detail/first-feed-music-cover-figma.png";

const homeFeedItemContentsBase: FeedItemCardContent[] = [
  // 顺序约定：①视频 ②割草 ③屋顶互动 ④漫画互动 ⑤异形卡 ⑥图文。
  {
    id: "feed-1",
    mediaType: "video",
    mediaSrc: localFeedVideoUrl(1),
    mediaPoster: localFeedVideoPosterUrl(1),
    mediaMuted: false,
    mediaAlt: "Hidden gem coffee shop in New York City",
    nickname: "Maya Brews",
    description:
      "OK I just found the cutest hidden gem coffee spot in NYC and I am fully obsessed. Drop your best hidden coffee gems in New York in the comments right now. #nyccoffee #coffeetok #hiddengems",
    avatarUrl: feedAvatar("feed-1"),
    musicTitle: "City Sips - Maya Brews",
    musicCoverUrl: FIRST_FEED_MUSIC_COVER_URL,
    likeCount: 682400,
    commentCount: 15400,
    favoriteCount: 118900,
    shareCount: 4720,
  },
  { id: "playable-pumpkin", mediaType: "image", mediaSrc: "/resource/playable-feed/pocket-F3950QIMH-game.html", nickname: "Bella", description: "Carve your own jack-o'-lantern 🎃", avatarUrl: "/resource/playable-feed/bella.png", musicTitle: "", musicCoverUrl: "/resource/playable-feed/bella.png", likeCount: 12000, commentCount: 456, favoriteCount: 68, shareCount: 43 },
  { id: "playable-hotpot", mediaType: "image", mediaSrc: "/resource/playable-feed/hotpot.png", mediaAlt: "Bella hot pot playable", nickname: "Bella", description: "Treat me to hot pot!!! 🍲🥢", avatarUrl: "/resource/playable-feed/bella.png", musicTitle: "", musicCoverUrl: "/resource/playable-feed/hotpot.png", likeCount: 12000, commentCount: 456, favoriteCount: 68, shareCount: 43 },
  { id: "playable-rooftops", mediaType: "image", mediaSrc: "/resource/playable-feed/pocket-FxQaSVTWh-game.html", nickname: "Bella", description: "Swing across the rooftops!", avatarUrl: "/resource/playable-feed/bella.png", musicTitle: "", musicCoverUrl: "/resource/playable-feed/bella.png", likeCount: 12000, commentCount: 456, favoriteCount: 68, shareCount: 43 },
  { id: "playable-comic", mediaType: "image", mediaSrc: "/resource/playable-feed/pocket-Fzo2A3wUt-game.html", nickname: "Bella", description: "Create your own comic story.", avatarUrl: "/resource/playable-feed/bella.png", musicTitle: "", musicCoverUrl: "/resource/playable-feed/bella.png", likeCount: 12000, commentCount: 456, favoriteCount: 68, shareCount: 43 },
  // Scenario 1 — nobody has reposted yet → white bar shows the guide entrance.（异形卡占位槽）
  { id: "feed-card-slot", mediaType: "image", mediaSrc: localFeedVerticalCoverUrl(1), mediaAlt: "Mia Chen feed cover", nickname: "Mia Chen", description: "Tried this 10-min udon and now I am obsessed. #homecooking #weeknightdinner", avatarUrl: feedAvatar("feed-card-slot"), musicTitle: "Late Night Kitchen - Mello", musicCoverUrl: localMusicCoverUrl(1), location: "New York", likeCount: 824500, commentCount: 12840, favoriteCount: 210200, shareCount: 8310, repost: { reposterIds: [] } },
  { id: "photo-feed-2", mediaType: "image", mediaSrc: localFeedVerticalCoverUrl(21), mediaAlt: "Amelia Parks photo post", nickname: "Amelia Parks", description: "Weekend light leaks and tiny neighborhood details. #photodump #citywalk", avatarUrl: feedAvatar("photo-feed-2"), musicTitle: "Window Seat - Amelia", musicCoverUrl: localMusicCoverUrl(21), location: "Brooklyn", likeCount: 384200, commentCount: 7310, favoriteCount: 84200, shareCount: 2190, repost: { reposterIds: [] }, photoText: { images: photoPostImages(21, 5), title: "Little city walk details", desc: "Weekend light leaks, corner store flowers, and tiny neighborhood details from a slow afternoon walk. #photodump #citywalk" } },
  // Scenario 2 — 2 friends reposted → white bar shows their avatars + count.
  {
    id: "feed-2",
    mediaType: "video",
    mediaSrc: localFeedVideoUrl(2),
    mediaPoster: localFeedVideoPosterUrl(2),
    mediaAlt: "Scuba diving along a coral reef",
    nickname: "Reef Depths",
    description:
      "First dive of the season and the visibility was insane. Would you go deeper or stay shallow? #scubadiving #underwater #ocean",
    avatarUrl: feedAvatar("feed-2"),
    musicTitle: "Blue Current - Reef Depths",
    musicCoverUrl: localMusicCoverUrl(22),
    location: "Great Barrier Reef",
    likeCount: 892400,
    commentCount: 18600,
    favoriteCount: 142300,
    shareCount: 6240,
    repost: { reposterIds: ["angel", "olivia"] },
  },
  { id: "photo-feed-4", mediaType: "image", mediaSrc: localFeedVerticalCoverUrl(26), mediaAlt: "Noor Table photo post", nickname: "Noor Table", description: "Tiny dinner party notes: citrus, candles, and the pasta that disappeared first. #hosting #foodtok", avatarUrl: feedAvatar("photo-feed-4"), musicTitle: "Table Glow - Noor", musicCoverUrl: localMusicCoverUrl(26), location: "Chicago", likeCount: 957600, commentCount: 18420, favoriteCount: 201900, shareCount: 6770, repost: { reposterIds: ["angel", "olivia"] }, photoText: { images: photoPostImages(26, 6), title: "Dinner party camera roll", desc: "Tiny dinner party notes: citrus, candles, handwritten place cards, and the pasta that disappeared first. #hosting #foodtok #tablescape" } },
  // Scenario 3 — 6 friends reposted → overlapped avatar stack + count.
  {
    id: "feed-3",
    mediaType: "video",
    mediaSrc: localFeedVideoUrl(3),
    mediaPoster: localFeedVideoPosterUrl(3),
    mediaAlt: "Skating on a frozen lake at golden hour",
    nickname: "Frost Lines",
    description:
      "The ice was so clear you could see every crack below your skates. Save this for winter. #iceskating #winter #frozenlake",
    avatarUrl: feedAvatar("feed-3"),
    musicTitle: "Glass Surface - Frost Lines",
    musicCoverUrl: localMusicCoverUrl(23),
    location: "Lake Baikal",
    likeCount: 1240800,
    commentCount: 22100,
    favoriteCount: 198600,
    shareCount: 9870,
    repost: { reposterIds: ["angel", "olivia", "justin", "jocelyn", "liam", "maya"] },
  },
  {
    id: "feed-4",
    mediaType: "video",
    mediaSrc: localFeedVideoUrl(4),
    mediaPoster: localFeedVideoPosterUrl(4),
    mediaAlt: "Golden retriever puppy playing in the yard",
    nickname: "Paws & Chaos",
    description:
      "Tell me this is not the happiest 12 seconds on your feed today. #puppy #dogsoftiktok #goldenretriever",
    avatarUrl: feedAvatar("feed-4"),
    musicTitle: "Tail Wag - Paws & Chaos",
    musicCoverUrl: localMusicCoverUrl(24),
    likeCount: 2103400,
    commentCount: 48200,
    favoriteCount: 367800,
    shareCount: 28400,
  },
  {
    id: "feed-5",
    mediaType: "video",
    mediaSrc: localFeedVideoUrl(5),
    mediaPoster: localFeedVideoPosterUrl(5),
    mediaAlt: "Orange tabby cat knocking things off a shelf",
    nickname: "Whisker FM",
    description:
      "Zero thoughts just vibes and one very suspicious paw. #catsoftiktok #tabby #fyp",
    avatarUrl: feedAvatar("feed-5"),
    musicTitle: "Purr Loop - Whisker FM",
    musicCoverUrl: localMusicCoverUrl(25),
    likeCount: 1876500,
    commentCount: 39100,
    favoriteCount: 312400,
    shareCount: 19600,
  },
  {
    id: "feed-6",
    mediaType: "video",
    mediaSrc: localFeedVideoUrl(6),
    mediaPoster: localFeedVideoPosterUrl(6),
    mediaAlt: "Final lap of a close motorsport race",
    nickname: "Pole Position",
    description:
      "Photo finish energy — who had your pick for P1? #racing #motorsport #fyp",
    avatarUrl: feedAvatar("feed-6"),
    musicTitle: "Redline - Pole Position",
    musicCoverUrl: localMusicCoverUrl(26),
    location: "Monza",
    likeCount: 956200,
    commentCount: 31400,
    favoriteCount: 87400,
    shareCount: 11200,
  },
  { id: "feed-7", mediaType: "video", mediaSrc: localFeedVideoUrl(7), mediaPoster: localFeedVideoPosterUrl(7), mediaAlt: "Quiet winter walk along an empty beach town", nickname: "Ava Trips", description: "Everyone chases summer beaches — try the offseason when the whole coast feels like yours. Where is your quiet escape? #travel #quietplaces #offseason", avatarUrl: feedAvatar("feed-7"), musicTitle: "Waves in December - Ava", musicCoverUrl: localMusicCoverUrl(7), likeCount: 984300, commentCount: 4200, favoriteCount: 171900, shareCount: 6110 },
  { id: "feed-8", mediaType: "video", mediaSrc: localFeedVideoUrl(8), mediaPoster: localFeedVideoPosterUrl(8), mediaAlt: "Screen recording of a smooth UI scroll fix", nickname: "Derek Codes", description: "One line fixed the jank in my feed scroll — before/after in the clip. Devs save this. #frontend #webdev #react", avatarUrl: feedAvatar("feed-8"), musicTitle: "Keystrokes - Loop Dept.", musicCoverUrl: localMusicCoverUrl(8), likeCount: 542100, commentCount: 3800, favoriteCount: 129700, shareCount: 5380 },
  { id: "feed-9", mediaType: "video", mediaSrc: localFeedVideoUrl(9), mediaPoster: localFeedVideoPosterUrl(9), mediaAlt: "At-home shoulder workout demo", nickname: "Lina Fit", description: "No dumbbells, no excuses — shoulder burn in under 8 minutes. Try it between meetings. #fitness #homeworkout #shoulders", avatarUrl: feedAvatar("feed-9"), musicTitle: "Push Day - Lina", musicCoverUrl: localMusicCoverUrl(9), likeCount: 913400, commentCount: 5100, favoriteCount: 206500, shareCount: 9020 },
  { id: "feed-10", mediaType: "video", mediaSrc: localFeedVideoUrl(10), mediaPoster: localFeedVideoPosterUrl(10), mediaAlt: "Student explaining notes in a sunlit empty classroom", nickname: "Leo Study", description: "Empty classroom + golden window light = my favorite study setup. I explain chapters out loud to actually remember them — try it before your next exam. #studytok #studywithme #focus", avatarUrl: feedAvatar("feed-10"), musicTitle: "Empty Hall - Leo Study", musicCoverUrl: localMusicCoverUrl(10), likeCount: 289300, commentCount: 890, favoriteCount: 64100, shareCount: 1290 },
  { id: "feed-11", mediaType: "video", mediaSrc: localFeedVideoUrl(11), mediaPoster: localFeedVideoPosterUrl(11), mediaAlt: "Three outfits styled from one black blazer", nickname: "Zoe Stylebook", description: "One blazer, three completely different moods — office, weekend, date night. Which look gets your vote? #styling #capsulewardrobe #ootd", avatarUrl: feedAvatar("feed-11"), musicTitle: "Mirror Check - Zoe", musicCoverUrl: localMusicCoverUrl(11), likeCount: 1330700, commentCount: 6200, favoriteCount: 274000, shareCount: 11700 },
  { id: "feed-12", mediaType: "video", mediaSrc: localFeedVideoUrl(12), mediaPoster: localFeedVideoPosterUrl(12), mediaAlt: "Beat making session with train station samples", nickname: "Ryan Beats", description: "Sampled a Tokyo train platform and built a full beat around it. Headphones on for this one. #producer #beatmaking #sampling", avatarUrl: feedAvatar("feed-12"), musicTitle: "Platform 3 - Ryan Beats", musicCoverUrl: localMusicCoverUrl(12), likeCount: 774600, commentCount: 3400, favoriteCount: 148300, shareCount: 6430 },
  { id: "feed-13", mediaType: "video", mediaSrc: localFeedVideoUrl(13), mediaPoster: localFeedVideoPosterUrl(13), mediaAlt: "Stack of books with reading recommendations", nickname: "Ella Reads", description: "Books that pulled me out of a reading slump — no spoilers, just vibes. Drop your current read below. #booktok #readinglist", avatarUrl: feedAvatar("feed-13"), musicTitle: "Turn the Page - Lumen", musicCoverUrl: localMusicCoverUrl(13), likeCount: 620900, commentCount: 2900, favoriteCount: 192700, shareCount: 3320 },
  { id: "feed-14", mediaType: "video", mediaSrc: localFeedVideoUrl(14), mediaPoster: localFeedVideoPosterUrl(14), mediaAlt: "Portrait lit by late afternoon window light", nickname: "Noah Shoot", description: "Found perfect window light at 4:27pm — settings and reflector in comments if you shoot portraits. #portrait #photography #windowlight", avatarUrl: feedAvatar("feed-14"), musicTitle: "Side Light - Noah", musicCoverUrl: localMusicCoverUrl(14), likeCount: 858200, commentCount: 2100, favoriteCount: 119200, shareCount: 4880 },
  { id: "feed-15", mediaType: "video", mediaSrc: localFeedVideoUrl(15), mediaPoster: localFeedVideoPosterUrl(15), mediaAlt: "Flock of sheep grazing in a green pasture with mountains behind", nickname: "Felix Fields", description: "One black sheep in a sea of cream wool — whole flock grazing before the clouds rolled in. Sound on for the pasture hum. #nature #sheep #countryside #slowliving", avatarUrl: feedAvatar("feed-15"), musicTitle: "Pasture Hum - Felix Fields", musicCoverUrl: localMusicCoverUrl(15), likeCount: 497500, commentCount: 1800, favoriteCount: 91300, shareCount: 2960 },
  { id: "feed-16", mediaType: "video", mediaSrc: localFeedVideoUrl(16), mediaPoster: localFeedVideoPosterUrl(16), mediaAlt: "Freshly baked cinnamon rolls with perfect layers", nickname: "Max Bakes", description: "Cinnamon roll layers finally came out perfect — cold butter, overnight proof, no regrets. #baking #cinnamonrolls #smallbatch", avatarUrl: feedAvatar("feed-16"), musicTitle: "Warm Oven - Max", musicCoverUrl: localMusicCoverUrl(16), likeCount: 1094100, commentCount: 4800, favoriteCount: 245300, shareCount: 10540 },
  { id: "feed-17", mediaType: "video", mediaSrc: localFeedVideoUrl(17), mediaPoster: localFeedVideoPosterUrl(17), mediaAlt: "Skateboarder landing a clean kickflip", nickname: "Jules Skate", description: "Two hours of bails for one clean kickflip — the roll-away made it worth it. #skateboarding #kickflip #progress", avatarUrl: feedAvatar("feed-17"), musicTitle: "Concrete Echo - Jules", musicCoverUrl: localMusicCoverUrl(17), likeCount: 701800, commentCount: 3600, favoriteCount: 102100, shareCount: 4680 },
  { id: "feed-18", mediaType: "video", mediaSrc: localFeedVideoUrl(18), mediaPoster: localFeedVideoPosterUrl(18), mediaAlt: "Merle dog standing happy in a green wheat field", nickname: "Emma Fields", description: "Took the dog through the wheat rows before harvest — merle coat in all that green is unfairly cute. Where is your countryside walk spot? #countryside #dogsoftiktok #bordercollie #rural", avatarUrl: feedAvatar("feed-18"), musicTitle: "Field Run - Emma Fields", musicCoverUrl: localMusicCoverUrl(18), likeCount: 934200, commentCount: 4100, favoriteCount: 223800, shareCount: 8830 },
  { id: "feed-19", mediaType: "video", mediaSrc: localFeedVideoUrl(19), mediaPoster: localFeedVideoPosterUrl(19), mediaAlt: "Fog rolling over a mountain ridge at sunrise", nickname: "Kai Hikes", description: "Fog rolled in right before sunrise and the whole ridge turned into a cloud sea. Worth the 4am alarm. #hiking #sunrise #nature", avatarUrl: feedAvatar("feed-19"), musicTitle: "Trailhead - Kai", musicCoverUrl: localMusicCoverUrl(19), likeCount: 1412200, commentCount: 5400, favoriteCount: 289700, shareCount: 13210 },
  { id: "feed-20", mediaType: "video", mediaSrc: localFeedVideoUrl(20), mediaPoster: localFeedVideoPosterUrl(20), mediaAlt: "Soft glam makeup tutorial in natural light", nickname: "Ruby Makeup", description: "Soft glam in 12 minutes, no filter, skin still looks like skin. Products linked — thin layers only. #makeuptutorial #grwm #softglam", avatarUrl: feedAvatar("feed-20"), musicTitle: "Glow Routine - Ruby", musicCoverUrl: localMusicCoverUrl(20), likeCount: 1179800, commentCount: 7800, favoriteCount: 261400, shareCount: 10990 },
];

/** Local feel-test games lead the feed; the existing Pocket/Flora sequence stays intact. */
function withLibraryPlayables(items: FeedItemCardContent[]): FeedItemCardContent[] {
  const toFeedGame = ([id, game]: [string, { src: string; title: string; description: string }]): FeedItemCardContent => ({
    id, mediaType: "image", mediaSrc: game.src, mediaAlt: game.title, nickname: "Bella", description: game.description,
    avatarUrl: "/resource/playable-feed/bella.png", musicTitle: "", musicCoverUrl: "/resource/playable-feed/bella.png",
    likeCount: 12000, commentCount: 456, favoriteCount: 68, shareCount: 43,
  });
  const games = Object.entries(PLAYABLE_LIBRARY).map(toFeedGame);
  const localGames = Object.entries(PLAYABLE_LOCAL_GAMES).map(toFeedGame);
  // Normal feed order: swipe up advances to the next game in the review list.
  const showcase = isBatchReview() ? selectReviewShowcase(Object.entries({...PLAYABLE_BATCH_GAMES, ...PLAYABLE_PILOT_GAMES}), window.location.search) : null;
  if (showcase) return showcase.map(toFeedGame);
  if (isBatchReview()) return selectReviewPool(Object.entries(PLAYABLE_BATCH_GAMES), window.location.search).map(toFeedGame);
  const at = items.findIndex((item) => item.id === "playable-comic") + 1;
  return [...localGames, ...items.slice(0, at), ...games, ...items.slice(at)];
}

/** Rail metrics follow comment volume — zero comments ⇒ near-zero engagement. */
export const homeFeedItemContents: FeedItemCardContent[] =
  withLibraryPlayables(homeFeedItemContentsBase).map((item) => {
    if (item.id === "playable-hotpot" || Object.hasOwn(PLAYABLE_LIBRARY, item.id) || Object.hasOwn(PLAYABLE_LOCAL_GAMES, item.id) || Object.hasOwn(PLAYABLE_BATCH_GAMES, item.id)) return item;
    const commentCount = resolveFeedCommentCount(item.id);
    return {
      ...item,
      commentCount,
      ...resolveFeedEngagementMetrics(commentCount, item.id),
    };
  });
