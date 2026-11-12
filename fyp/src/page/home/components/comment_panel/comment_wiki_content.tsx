import { TUXText, getColorCSSVar } from "@byted-tiktok/tux-web";
import { avatarSlotFromId, localAvatarUrlForDisplay } from "../../../../utils/local_avatar";
import { localFeedVerticalCoverUrl } from "../../../../utils/local_media_placeholder";
import {
  COMMENT_COFFEE_SHOP_IMAGE_LIST,
  COMMENT_WIKI_INFOGRAPH_IMAGES,
} from "./comment_assets";

export type WikiFeedItem = {
  id: string;
  title: string;
  username: string;
  avatarSrc: string;
  likes: string;
  mediaKind: "photo" | "video";
  src: string;
  width: number;
  height: number;
};

export type WikiExperience = {
  label: string;
  summary: string;
  detailIntro: string;
  detailSections: Array<{ title: string; body: string }>;
  columns: WikiFeedItem[][];
};

const CROISSANT_INFOGRAPH_IMAGE_SRC = COMMENT_WIKI_INFOGRAPH_IMAGES.croissant;
const TIKTOK_INFOGRAPH_IMAGE_SRC = COMMENT_WIKI_INFOGRAPH_IMAGES.tiktok;
const LAMINATED_PASTRY_INFOGRAPH_IMAGE_SRC = COMMENT_WIKI_INFOGRAPH_IMAGES.laminatedPastry;
const PARISIAN_CAFE_INFOGRAPH_IMAGE_SRC = COMMENT_WIKI_INFOGRAPH_IMAGES.parisianCafe;

function wikiAvatar(username: string) {
  return localAvatarUrlForDisplay(32, avatarSlotFromId(username));
}

type WikiImageMode = "coffee" | "cover";

function patchWikiColumns(columns: WikiFeedItem[][], mode: WikiImageMode, feedStart = 1): WikiFeedItem[][] {
  let cursor = feedStart;
  return columns.map((column) =>
    column.map((item) => {
      const patched = {
        ...item,
        avatarSrc: wikiAvatar(item.username),
        src:
          mode === "coffee"
            ? COMMENT_COFFEE_SHOP_IMAGE_LIST[(cursor - 1) % COMMENT_COFFEE_SHOP_IMAGE_LIST.length]
            : localFeedVerticalCoverUrl(cursor),
      };
      cursor += 1;
      return patched;
    }),
  );
}

const CANONICAL_WIKI_KEYWORDS = [
  "Croissant",
  "TikTok",
  "laminated pastry",
  "Parisian cafe",
  "wrizz",
  "delulu",
  "sigma",
  "chronically online",
  "Y/N",
  "let him cook",
  "it's giving",
  "CEO of",
] as const;

const CROISSANT_SUMMARY =
  "A flaky, butter-layered pastry often associated with cafe mornings and indulgent comfort.";
const CROISSANT_DETAIL_INTRO =
  "Croissant usually refers to more than a pastry name. In comment language, it often signals a whole sensory scene: golden layers, a crisp shell, a soft interior, warm butter aroma, and the kind of breakfast mood people associate with a Parisian cafe ritual.";
const CROISSANT_DETAIL_SECTIONS = [
  {
    title: "Texture",
    body:
      "A croissant is a laminated pastry, which means dough and butter are folded together in repeated layers. Once baked, those layers lift apart and create a thin, crisp exterior with a light honeycomb structure inside.",
  },
  {
    title: "Flavor",
    body:
      "Its flavor profile is rich but not heavy: buttery, slightly toasty, and gently yeasty. Depending on the filling or finish, it can read as classic breakfast, dessert, or a more elevated coffee-pairing pastry.",
  },
  {
    title: "Cultural Cue",
    body:
      "When people mention croissant in comments, they are often referencing a vibe as much as a food item. It can imply Parisian cafe energy, soft luxury, morning routine content, or a visually satisfying flaky cut-open shot that instantly makes the thread feel more aspirational.",
  },
] as const;

const TIKTOK_SUMMARY =
  "A short-form video platform known for trends, remix culture, and highly personalized discovery.";
const TIKTOK_DETAIL_INTRO =
  "TikTok in comment context usually points to an ecosystem, not just an app. People use it to reference a fast-moving language of sounds, edits, trends, creator behavior, and recommendation loops that make content feel immediately recognizable and extremely easy to binge.";
const TIKTOK_DETAIL_SECTIONS = [
  {
    title: "Format",
    body:
      "TikTok popularized a short-form, vertically framed storytelling style where hooks arrive early, editing feels fast, and on-screen text, sound, and pacing work together to keep viewers engaged within seconds.",
  },
  {
    title: "Recommendation Loop",
    body:
      "A big part of its identity comes from how content is surfaced. Users often describe TikTok as feeling unusually personal because the recommendation system can quickly adapt to micro-interests, niche humor, and repeat viewing behavior.",
  },
  {
    title: "Comment Meaning",
    body:
      "When someone says something is 'so TikTok,' they may be pointing to a recognizable visual format, a viral sound, a creator archetype, or a certain style of internet-native discovery. It can mean the content feels trend-aware, highly remixable, and built for fast cultural circulation.",
  },
] as const;

const LAMINATED_PASTRY_SUMMARY =
  "A pastry technique built from repeated dough-and-butter folds that bake into crisp outer flakes and airy inner layers.";
const LAMINATED_PASTRY_DETAIL_INTRO =
  "Laminated pastry refers to dough that is wrapped around butter and folded multiple times to create many thin strata. People often bring it up when explaining why a croissant shatters into delicate flakes instead of eating like ordinary bread.";
const LAMINATED_PASTRY_DETAIL_SECTIONS = [
  {
    title: "Technique",
    body:
      "The dough is rolled out, folded, chilled, and rolled again so alternating layers of dough and butter stay distinct. During baking, steam from the butter pushes those layers apart and gives laminated pastry its signature lift.",
  },
  {
    title: "Why It Matters",
    body:
      "This is the structural reason a croissant feels light, crackly, and layered instead of dense. When comments praise the texture, they are often reacting to good lamination even if they do not use the technical term.",
  },
  {
    title: "Visual Cue",
    body:
      "On social feeds, laminated pastry often signals precision, craft, and quiet luxury. It fits naturally into the visual world of a Parisian cafe because the flaky cross-section reads as both indulgent and refined.",
  },
] as const;

const PARISIAN_CAFE_SUMMARY =
  "A lifestyle cue associated with sidewalk tables, buttery pastries, elegant coffee service, and a soft, leisurely city mood.";
const PARISIAN_CAFE_DETAIL_INTRO =
  "Parisian cafe usually describes more than a literal location. In comments, it often points to a visual mood: small round tables, warm light, polished cups, people-watching, and the kind of breakfast scene where a croissant or other laminated pastry feels especially photogenic.";
const PARISIAN_CAFE_DETAIL_SECTIONS = [
  {
    title: "Atmosphere",
    body:
      "The phrase suggests an environment that feels stylish without being loud. It mixes compact seating, street-facing views, good coffee, and the sense that time is moving a little slower than usual.",
  },
  {
    title: "Food Cue",
    body:
      "A Parisian cafe reference often comes bundled with pastries, especially croissant imagery. The flaky surface, butter sheen, and tabletop styling help sell the whole scene in a single frame.",
  },
  {
    title: "Comment Meaning",
    body:
      "When someone calls a post Parisian cafe, they usually mean the content feels romanticized, tasteful, and softly aspirational. It can describe decor, color palette, breakfast styling, or the emotional tone of the video itself.",
  },
] as const;

const _CROISSANT_COLUMNS: WikiFeedItem[][] = [
  [
    {
      id: "croissant-1",
      title: "Golden layers, soft center, and a bakery counter that smells like butter at 7AM.",
      username: "crumb.daily",
      avatarSrc: "https://picsum.photos/seed/wiki-croissant-user-1/32/32",
      likes: "251.7K",
      mediaKind: "photo",
      src: "https://picsum.photos/seed/wiki-croissant-1/640/860",
      width: 640,
      height: 860,
    },
    {
      id: "croissant-2",
      title: "Paris cafe guide for flaky croissants and quiet breakfast corners.",
      username: "whereweate",
      avatarSrc: "https://picsum.photos/seed/wiki-croissant-user-2/32/32",
      likes: "48.2K",
      mediaKind: "photo",
      src: "https://picsum.photos/seed/wiki-croissant-2/640/520",
      width: 640,
      height: 520,
    },
    {
      id: "croissant-3",
      title: "Proofing, folding, resting: the lamination routine behind the layers.",
      username: "oven.notes",
      avatarSrc: "https://picsum.photos/seed/wiki-croissant-user-3/32/32",
      likes: "12.3K",
      mediaKind: "video",
      src: "https://picsum.photos/seed/wiki-croissant-3/640/780",
      width: 640,
      height: 780,
    },
    {
      id: "croissant-4",
      title: "Chocolate croissant or classic? The comments are split for a reason.",
      username: "pastry.mood",
      avatarSrc: "https://picsum.photos/seed/wiki-croissant-user-4/32/32",
      likes: "91.4K",
      mediaKind: "photo",
      src: "https://picsum.photos/seed/wiki-croissant-4/640/700",
      width: 640,
      height: 700,
    },
  ],
  [
    {
      id: "croissant-5",
      title: "Inside a tiny neighborhood bakery where the croissant tray sells out first.",
      username: "daily.glaze",
      avatarSrc: "https://picsum.photos/seed/wiki-croissant-user-5/32/32",
      likes: "84.9K",
      mediaKind: "video",
      src: "https://picsum.photos/seed/wiki-croissant-5/640/920",
      width: 640,
      height: 920,
    },
    {
      id: "croissant-6",
      title: "Weekend coffee run, almond croissant, and a table right by the window.",
      username: "softmorning",
      avatarSrc: "https://picsum.photos/seed/wiki-croissant-user-6/32/32",
      likes: "36.8K",
      mediaKind: "photo",
      src: "https://picsum.photos/seed/wiki-croissant-6/640/760",
      width: 640,
      height: 760,
    },
    {
      id: "croissant-7",
      title: "Ranking frozen grocery-store croissants after one very honest blind test.",
      username: "foodbench",
      avatarSrc: "https://picsum.photos/seed/wiki-croissant-user-7/32/32",
      likes: "19.1K",
      mediaKind: "video",
      src: "https://picsum.photos/seed/wiki-croissant-7/640/560",
      width: 640,
      height: 560,
    },
    {
      id: "croissant-8",
      title: "How butter temperature changes the flake when you cut one open.",
      username: "laminate.lab",
      avatarSrc: "https://picsum.photos/seed/wiki-croissant-user-8/32/32",
      likes: "7.9K",
      mediaKind: "photo",
      src: "https://picsum.photos/seed/wiki-croissant-8/640/830",
      width: 640,
      height: 830,
    },
    {
      id: "croissant-9",
      title: "The kind of pastry shot that instantly makes everyone hungry in the thread.",
      username: "goldenbite",
      avatarSrc: "https://picsum.photos/seed/wiki-croissant-user-9/32/32",
      likes: "64.5K",
      mediaKind: "photo",
      src: "https://picsum.photos/seed/wiki-croissant-9/640/680",
      width: 640,
      height: 680,
    },
  ],
];

const _TIKTOK_COLUMNS: WikiFeedItem[][] = [
  [
    {
      id: "tiktok-1",
      title: "What makes a TikTok format instantly recognizable even with the sound off.",
      username: "trend.map",
      avatarSrc: "https://picsum.photos/seed/wiki-tiktok-user-1/32/32",
      likes: "183.3K",
      mediaKind: "video",
      src: "https://picsum.photos/seed/wiki-tiktok-1/640/900",
      width: 640,
      height: 900,
    },
    {
      id: "tiktok-2",
      title: "A creator workflow for scripting, trimming, captions, and posting in one pass.",
      username: "edit.circuit",
      avatarSrc: "https://picsum.photos/seed/wiki-tiktok-user-2/32/32",
      likes: "41.6K",
      mediaKind: "photo",
      src: "https://picsum.photos/seed/wiki-tiktok-2/640/560",
      width: 640,
      height: 560,
    },
    {
      id: "tiktok-3",
      title: "Trend recap: the sounds, transitions, and hooks people keep remaking.",
      username: "culture.loop",
      avatarSrc: "https://picsum.photos/seed/wiki-tiktok-user-3/32/32",
      likes: "98.0K",
      mediaKind: "video",
      src: "https://picsum.photos/seed/wiki-tiktok-3/640/760",
      width: 640,
      height: 760,
    },
    {
      id: "tiktok-4",
      title: "Why recommendation quality changes how fast a niche turns into a fandom.",
      username: "algo.notes",
      avatarSrc: "https://picsum.photos/seed/wiki-tiktok-user-4/32/32",
      likes: "22.4K",
      mediaKind: "photo",
      src: "https://picsum.photos/seed/wiki-tiktok-4/640/700",
      width: 640,
      height: 700,
    },
  ],
  [
    {
      id: "tiktok-5",
      title: "Behind the scenes of a short-form shoot built entirely for vertical framing.",
      username: "framecraft",
      avatarSrc: "https://picsum.photos/seed/wiki-tiktok-user-5/32/32",
      likes: "126.2K",
      mediaKind: "video",
      src: "https://picsum.photos/seed/wiki-tiktok-5/640/840",
      width: 640,
      height: 840,
    },
    {
      id: "tiktok-6",
      title: "Hooks that land in the first two seconds without feeling too scripted.",
      username: "open.loop",
      avatarSrc: "https://picsum.photos/seed/wiki-tiktok-user-6/32/32",
      likes: "30.7K",
      mediaKind: "photo",
      src: "https://picsum.photos/seed/wiki-tiktok-6/640/780",
      width: 640,
      height: 780,
    },
    {
      id: "tiktok-7",
      title: "A clean breakdown of why some videos keep resurfacing weeks later.",
      username: "signal.feed",
      avatarSrc: "https://picsum.photos/seed/wiki-tiktok-user-7/32/32",
      likes: "15.9K",
      mediaKind: "photo",
      src: "https://picsum.photos/seed/wiki-tiktok-7/640/520",
      width: 640,
      height: 520,
    },
    {
      id: "tiktok-8",
      title: "The comment section as its own content layer: jokes, lore, and stitched context.",
      username: "reply.energy",
      avatarSrc: "https://picsum.photos/seed/wiki-tiktok-user-8/32/32",
      likes: "57.2K",
      mediaKind: "video",
      src: "https://picsum.photos/seed/wiki-tiktok-8/640/860",
      width: 640,
      height: 860,
    },
    {
      id: "tiktok-9",
      title: "Creators using on-screen text to make trends readable before audio loads.",
      username: "subtitle.lab",
      avatarSrc: "https://picsum.photos/seed/wiki-tiktok-user-9/32/32",
      likes: "18.8K",
      mediaKind: "photo",
      src: "https://picsum.photos/seed/wiki-tiktok-9/640/680",
      width: 640,
      height: 680,
    },
  ],
];

const _LAMINATED_PASTRY_COLUMNS: WikiFeedItem[][] = [
  [
    {
      id: "laminated-pastry-1",
      title: "Cutting into a laminated pastry and hearing that clean, crisp crack on camera.",
      username: "layer.logic",
      avatarSrc: "https://picsum.photos/seed/wiki-laminate-user-1/32/32",
      likes: "63.1K",
      mediaKind: "video",
      src: "https://picsum.photos/seed/wiki-laminate-1/640/900",
      width: 640,
      height: 900,
    },
    {
      id: "laminated-pastry-2",
      title: "Why butter lock-in and fold count change the final honeycomb.",
      username: "pastry.school",
      avatarSrc: "https://picsum.photos/seed/wiki-laminate-user-2/32/32",
      likes: "18.4K",
      mediaKind: "photo",
      src: "https://picsum.photos/seed/wiki-laminate-2/640/560",
      width: 640,
      height: 560,
    },
    {
      id: "laminated-pastry-3",
      title: "Watching dough layers stay sharp after the final turn is weirdly satisfying.",
      username: "turn.table",
      avatarSrc: "https://picsum.photos/seed/wiki-laminate-user-3/32/32",
      likes: "44.7K",
      mediaKind: "video",
      src: "https://picsum.photos/seed/wiki-laminate-3/640/760",
      width: 640,
      height: 760,
    },
    {
      id: "laminated-pastry-4",
      title: "A side-by-side bake showing under-laminated dough versus a clean croissant lift.",
      username: "proof.window",
      avatarSrc: "https://picsum.photos/seed/wiki-laminate-user-4/32/32",
      likes: "12.2K",
      mediaKind: "photo",
      src: "https://picsum.photos/seed/wiki-laminate-4/640/700",
      width: 640,
      height: 700,
    },
  ],
  [
    {
      id: "laminated-pastry-5",
      title: "How chill time keeps the butter sheet intact instead of disappearing into the dough.",
      username: "cold.bench",
      avatarSrc: "https://picsum.photos/seed/wiki-laminate-user-5/32/32",
      likes: "27.5K",
      mediaKind: "video",
      src: "https://picsum.photos/seed/wiki-laminate-5/640/860",
      width: 640,
      height: 860,
    },
    {
      id: "laminated-pastry-6",
      title: "Cross-sections that make every butter layer visible like topographic lines.",
      username: "crumb.scan",
      avatarSrc: "https://picsum.photos/seed/wiki-laminate-user-6/32/32",
      likes: "35.0K",
      mediaKind: "photo",
      src: "https://picsum.photos/seed/wiki-laminate-6/640/780",
      width: 640,
      height: 780,
    },
    {
      id: "laminated-pastry-7",
      title: "One dough, three fold schedules, and very different flake results.",
      username: "oven.metrics",
      avatarSrc: "https://picsum.photos/seed/wiki-laminate-user-7/32/32",
      likes: "9.7K",
      mediaKind: "photo",
      src: "https://picsum.photos/seed/wiki-laminate-7/640/520",
      width: 640,
      height: 520,
    },
    {
      id: "laminated-pastry-8",
      title: "The kind of pastry lab video that makes technique look almost meditative.",
      username: "sheet.butter",
      avatarSrc: "https://picsum.photos/seed/wiki-laminate-user-8/32/32",
      likes: "22.8K",
      mediaKind: "video",
      src: "https://picsum.photos/seed/wiki-laminate-8/640/830",
      width: 640,
      height: 830,
    },
  ],
];

const _PARISIAN_CAFE_COLUMNS: WikiFeedItem[][] = [
  [
    {
      id: "parisian-cafe-1",
      title: "Morning light, marble tabletop, and a coffee order that makes the whole post feel cinematic.",
      username: "rue.notes",
      avatarSrc: "https://picsum.photos/seed/wiki-paris-user-1/32/32",
      likes: "71.4K",
      mediaKind: "photo",
      src: "https://picsum.photos/seed/wiki-paris-1/640/900",
      width: 640,
      height: 900,
    },
    {
      id: "parisian-cafe-2",
      title: "How creators stage a Parisian cafe mood without leaving their own city.",
      username: "table.for.two",
      avatarSrc: "https://picsum.photos/seed/wiki-paris-user-2/32/32",
      likes: "29.5K",
      mediaKind: "video",
      src: "https://picsum.photos/seed/wiki-paris-2/640/560",
      width: 640,
      height: 560,
    },
    {
      id: "parisian-cafe-3",
      title: "Street-side chairs, tiny cups, and that polished breakfast styling everyone copies.",
      username: "soft.city.guide",
      avatarSrc: "https://picsum.photos/seed/wiki-paris-user-3/32/32",
      likes: "52.8K",
      mediaKind: "photo",
      src: "https://picsum.photos/seed/wiki-paris-3/640/760",
      width: 640,
      height: 760,
    },
    {
      id: "parisian-cafe-4",
      title: "A cafe reel where the croissant, the chair angle, and the saucer all matter equally.",
      username: "scene.dresser",
      avatarSrc: "https://picsum.photos/seed/wiki-paris-user-4/32/32",
      likes: "16.4K",
      mediaKind: "photo",
      src: "https://picsum.photos/seed/wiki-paris-4/640/700",
      width: 640,
      height: 700,
    },
  ],
  [
    {
      id: "parisian-cafe-5",
      title: "The exact soundtrack and pacing choices that make breakfast content feel Parisian.",
      username: "edit.bonjour",
      avatarSrc: "https://picsum.photos/seed/wiki-paris-user-5/32/32",
      likes: "38.6K",
      mediaKind: "video",
      src: "https://picsum.photos/seed/wiki-paris-5/640/860",
      width: 640,
      height: 860,
    },
    {
      id: "parisian-cafe-6",
      title: "A slow cafe table study built from cups, cutlery, linen, and one flaky pastry.",
      username: "mood.service",
      avatarSrc: "https://picsum.photos/seed/wiki-paris-user-6/32/32",
      likes: "24.1K",
      mediaKind: "photo",
      src: "https://picsum.photos/seed/wiki-paris-6/640/780",
      width: 640,
      height: 780,
    },
    {
      id: "parisian-cafe-7",
      title: "People-watching clips that somehow make coffee look more expensive and more romantic.",
      username: "corner.table",
      avatarSrc: "https://picsum.photos/seed/wiki-paris-user-7/32/32",
      likes: "11.8K",
      mediaKind: "photo",
      src: "https://picsum.photos/seed/wiki-paris-7/640/520",
      width: 640,
      height: 520,
    },
    {
      id: "parisian-cafe-8",
      title: "From storefront to first sip: the mini-vlog formula behind the Parisian cafe fantasy.",
      username: "bonjour.loop",
      avatarSrc: "https://picsum.photos/seed/wiki-paris-user-8/32/32",
      likes: "47.9K",
      mediaKind: "video",
      src: "https://picsum.photos/seed/wiki-paris-8/640/830",
      width: 640,
      height: 830,
    },
  ],
];

const CROISSANT_COLUMNS = patchWikiColumns(_CROISSANT_COLUMNS, "coffee");
const TIKTOK_COLUMNS = patchWikiColumns(_TIKTOK_COLUMNS, "cover", 11);
const LAMINATED_PASTRY_COLUMNS = patchWikiColumns(_LAMINATED_PASTRY_COLUMNS, "coffee", 21);
const PARISIAN_CAFE_COLUMNS = patchWikiColumns(_PARISIAN_CAFE_COLUMNS, "coffee", 31);

function buildMemeColumns(slug: string, items: Array<{
  title: string;
  username: string;
  likes: string;
  mediaKind: "photo" | "video";
  ratio: number;
}>, feedStart = 41): WikiFeedItem[][] {
  const made = items.map((entry, index) => {
    const height = Math.round(640 / entry.ratio);
    return {
      id: `${slug}-${index + 1}`,
      title: entry.title,
      username: entry.username,
      avatarSrc: wikiAvatar(entry.username),
      likes: entry.likes,
      mediaKind: entry.mediaKind,
      src: localFeedVerticalCoverUrl(feedStart + index),
      width: 640,
      height,
    };
  });
  const half = Math.ceil(made.length / 2);
  return [made.slice(0, half), made.slice(half)];
}

// ============== 2025–2026 当代梗 wiki ==============

const WRIZZ_SUMMARY =
  "Wholesome rizz: rooted in 'rizz' (charm/pull), wrizz adds a sweetness layer for charisma that reads kind, respectful, or quietly confident rather than smooth-talking.";
const WRIZZ_DETAIL_INTRO =
  "Wrizz emerged in late 2025 and exploded in early 2026 as commenters looked for a successor to 'rizz' once it felt oversaturated. It crowns someone who is attractive in a soft, nondisruptive way: think attentive, slightly shy, secure-without-flexing energy.";
const WRIZZ_DETAIL_SECTIONS = [
  {
    title: "Origin",
    body:
      "Builds on 'rizz', short for charisma, popularized by streamer Kai Cenat and broadly mainstream by 2024. 'W' borrows from 'W' (a win) and signals the wholesome, green-flag variant of charm.",
  },
  {
    title: "How It's Used",
    body:
      "Used in comment sections to compliment subjects who are attractive without performing — eye contact, polite gestures, soft humor. Often paired with hearts, awkward emojis, or 'give him benefits'.",
  },
  {
    title: "What It Signals",
    body:
      "When someone says a clip 'has wrizz', they're flagging it as crush-worthy in a way the algorithm rewards: low-key, repeatable, and pleasant to rewatch.",
  },
] as const;
const WRIZZ_COLUMNS = buildMemeColumns("wrizz", [
  { title: "wrizz: the 2026 successor to rizz, explained in 30 seconds.", username: "slang.daily", likes: "324.1K", mediaKind: "video", ratio: 0.71 },
  { title: "Green-flag clips that comment sections immediately label wrizz.", username: "wholesome.cuts", likes: "82.4K", mediaKind: "photo", ratio: 1.23 },
  { title: "Why oversaturated rizz had to evolve — wrizz, a brief history.", username: "trend.notes", likes: "27.8K", mediaKind: "photo", ratio: 0.82 },
  { title: "POV: he opens the door, listens, and says 'no rush'. wrizz.", username: "softboi.cam", likes: "112.5K", mediaKind: "video", ratio: 0.74 },
  { title: "Comments crowning everyday strangers with wrizz of the week.", username: "nyc.streets", likes: "44.0K", mediaKind: "photo", ratio: 1.14 },
  { title: "wrizz vs rizz vs unspoken rizz: a side-by-side breakdown.", username: "lex.online", likes: "61.7K", mediaKind: "video", ratio: 0.82 },
]);

const DELULU_SUMMARY =
  "Short for 'delusional'. Used affectionately to describe wishful thinking, parasocial fantasies, or any belief that a glamorous outcome is just around the corner.";
const DELULU_DETAIL_INTRO =
  "Delulu started in K-pop fandom slang and crossed into mainstream TikTok in 2023, then mutated through 2024–2026 into a self-aware label for any optimistic, slightly unhinged hope. Commenters use it both to roast and to celebrate.";
const DELULU_DETAIL_SECTIONS = [
  {
    title: "Tone",
    body:
      "Almost always playful. 'Delulu is the solulu' (delusion is the solution) is the dominant catchphrase, framing fantasy as a coping tool, not an insult.",
  },
  {
    title: "Where You'll See It",
    body:
      "Comments under crush content, manifestation videos, fan-cam edits, or any clip where the outcome is clearly imagined but emotionally true. Often paired with sparkles ✨ or 🤡.",
  },
  {
    title: "Why It Stuck",
    body:
      "It compresses a long emotional state — knowing your hope is unrealistic but choosing it anyway — into one word that doesn't take itself seriously.",
  },
] as const;
const DELULU_COLUMNS = buildMemeColumns("delulu", [
  { title: "Delulu is the solulu: a soft 60-second pep talk.", username: "manifest.club", likes: "211.3K", mediaKind: "video", ratio: 0.7 },
  { title: "How K-pop fandoms invented delulu before TikTok adopted it.", username: "stan.archive", likes: "39.6K", mediaKind: "photo", ratio: 1.18 },
  { title: "Audio: 'imagining things again, normal behavior'.", username: "sound.diary", likes: "73.4K", mediaKind: "video", ratio: 0.9 },
  { title: "Delulu girlies: the manifestation board edit pack.", username: "vision.bored", likes: "48.0K", mediaKind: "photo", ratio: 0.82 },
  { title: "POV: you're delulu but the universe blinks first.", username: "main.character", likes: "182.7K", mediaKind: "video", ratio: 0.71 },
  { title: "When delulu becomes a personality trait, captioned compilation.", username: "comment.captures", likes: "15.9K", mediaKind: "photo", ratio: 1.27 },
]);

const SIGMA_SUMMARY =
  "Originally a 'lone wolf' male archetype meme; now mostly used ironically to roast over-serious, edgy, or self-styled stoic behavior.";
const SIGMA_DETAIL_INTRO =
  "Sigma started in self-help / hustle subcultures around 2020, peaked as the 'sigma male' edit format in 2022–2024, and by 2025–2026 lives almost entirely as parody. In comment sections, calling something a 'sigma move' usually means it's hilariously serious for no reason.";
const SIGMA_DETAIL_SECTIONS = [
  {
    title: "Original Meaning",
    body:
      "A 'sigma male' was framed as a successful loner who operates outside the alpha hierarchy. The aesthetic involved silent stares, suit edits, and a Patrick Bateman-coded soundtrack.",
  },
  {
    title: "Modern Usage",
    body:
      "Most uses today are tongue-in-cheek. 'Sigma move' is often deployed when someone takes a tiny moment — accepting an L, eating cereal alone — and treats it like a noir film moment.",
  },
  {
    title: "Pairings",
    body:
      "Often co-occurs with 'take the L', 'mewing', 'gigachad', and the Phonk-edit aesthetic. The closer the comment is to a one-word punchline, the funnier it tends to land.",
  },
] as const;
const SIGMA_COLUMNS = buildMemeColumns("sigma", [
  { title: "Sigma face edits, but they're crying behind the sunglasses.", username: "phonk.lab", likes: "256.0K", mediaKind: "video", ratio: 0.74 },
  { title: "How the sigma male meme went from dead serious to 100% ironic.", username: "meme.timeline", likes: "31.4K", mediaKind: "photo", ratio: 1.15 },
  { title: "Sigma move: making a Pop Tart and calling it discipline.", username: "low.effort", likes: "92.6K", mediaKind: "video", ratio: 0.92 },
  { title: "The internet's relationship with sigma, charted year by year.", username: "graph.trend", likes: "18.9K", mediaKind: "photo", ratio: 0.84 },
  { title: "Comment-section sigma moments that ate too hard.", username: "comment.cuts", likes: "67.5K", mediaKind: "photo", ratio: 1.05 },
  { title: "Audio: 'sigma. take the L. accept the floor.'", username: "audio.bin", likes: "44.2K", mediaKind: "video", ratio: 0.78 },
]);

const CHRONICALLY_ONLINE_SUMMARY =
  "A label for someone whose worldview is heavily shaped by being on the internet too much — strong opinions on niche discourse, niche references, and a flair for over-reading any clip.";
const CHRONICALLY_ONLINE_DETAIL_INTRO =
  "Chronically online started circulating on Twitter/X around 2022 and became standard TikTok comment vocabulary by 2024. Commenters use it to call out (or self-identify with) reactions that only make sense if you've spent a lot of time inside niche internet culture.";
const CHRONICALLY_ONLINE_DETAIL_SECTIONS = [
  {
    title: "Behavior Pattern",
    body:
      "A chronically online comment usually catches a microscopic detail (a font, a sound choice, a brand alignment) and spins it into an argument that requires significant context to even follow.",
  },
  {
    title: "Sister Phrases",
    body:
      "Often paired with 'touch grass' (please go outside), 'terminally offline' (the inverse), and 'this is not that deep'. The language around it is mostly self-aware.",
  },
  {
    title: "Why It Works",
    body:
      "It diagnoses a specific feeling: that the internet has overlapping inside jokes, and some replies are clearly written by someone who hasn't logged off in a while.",
  },
] as const;
const CHRONICALLY_ONLINE_COLUMNS = buildMemeColumns("chronically-online", [
  { title: "Chronically online behavior, a 12-minute compilation.", username: "log.off", likes: "143.2K", mediaKind: "video", ratio: 0.74 },
  { title: "Why 'touch grass' became the internet's softest insult.", username: "discourse.daily", likes: "29.7K", mediaKind: "photo", ratio: 1.2 },
  { title: "POV: explaining a niche fandom war at thanksgiving.", username: "family.dinner", likes: "61.8K", mediaKind: "video", ratio: 0.82 },
  { title: "Charts: chronically online posting habits across platforms.", username: "data.scroll", likes: "11.4K", mediaKind: "photo", ratio: 0.92 },
  { title: "Therapy session: log off, log back on, log off again.", username: "burnout.fm", likes: "78.0K", mediaKind: "video", ratio: 0.71 },
  { title: "Audio: 'only chronically online people will get this'.", username: "sound.bin", likes: "33.5K", mediaKind: "photo", ratio: 1.1 },
]);

const YN_SUMMARY =
  "Y/N stands for 'Your Name'. It's the second-person stand-in from fanfiction, used in TikTok skits where the viewer is cast as the protagonist, often opposite a dramatic CEO love interest.";
const YN_DETAIL_INTRO =
  "Y/N comes from Wattpad / fanfic culture, where stories are written so the reader fills in their own name. In late 2025 it merged with the 'CEO' billionaire-romance trope into a parody storytelling format that exploded across TikTok comments and POV videos.";
const YN_DETAIL_SECTIONS = [
  {
    title: "Format",
    body:
      "Most Y/N skits are written from a confused side character's POV, watching Y/N do something melodramatic with a brooding CEO. The narrator is usually a coworker, intern, or barista just trying to do their job.",
  },
  {
    title: "Comment Use",
    body:
      "Commenters use 'POV: Y/N walks in and …' to spin a clip into an instant Wattpad chapter. Replies often quote-write the next line like an unhinged book recap.",
  },
  {
    title: "Cultural Note",
    body:
      "It's a meta joke about fanfic conventions: tortured eye contact, slow elevator scenes, and HR situations that would never fly in real life. The humor is in the genre awareness, not the romance itself.",
  },
] as const;
const YN_COLUMNS = buildMemeColumns("yn-fanfic", [
  { title: "POV: Y/N is summoned to the CEO's office for the fourth time.", username: "office.skit", likes: "418.6K", mediaKind: "video", ratio: 0.71 },
  { title: "How Wattpad's Y/N format became the internet's favorite joke.", username: "fanfic.studies", likes: "37.0K", mediaKind: "photo", ratio: 1.16 },
  { title: "Audio: 'me watching Y/N and the CEO breathe heavily in a meeting'.", username: "narrator.fm", likes: "92.3K", mediaKind: "video", ratio: 0.85 },
  { title: "The Y/N + CEO trope cards: every cliché, ranked by frequency.", username: "trope.lab", likes: "23.8K", mediaKind: "photo", ratio: 0.92 },
  { title: "POV: you are the intern who keeps walking in on Y/N moments.", username: "intern.life", likes: "164.0K", mediaKind: "video", ratio: 0.74 },
  { title: "Wattpad chapter titles, but they're real comment threads.", username: "chapter.bot", likes: "51.5K", mediaKind: "photo", ratio: 1.22 },
]);

const LET_HIM_COOK_SUMMARY =
  "An encouragement to let someone keep going with whatever audacious thing they're doing — sports, music, a bit, a take. Don't interrupt; the dish is forming.";
const LET_HIM_COOK_DETAIL_INTRO =
  "'Let him cook' came out of streaming and gaming culture (especially Twitch) in 2022, broke out via NFL and NBA highlight commentary in 2023, and is now a default comment whenever someone is mid-flow doing something impressive or absurd.";
const LET_HIM_COOK_DETAIL_SECTIONS = [
  {
    title: "Origin",
    body:
      "Streamer slang for 'don't cancel my play, I have a plan'. The cooking metaphor reframes any high-effort, in-progress moment as a chef working on a dish.",
  },
  {
    title: "Variants",
    body:
      "'He cooked' (past tense, won), 'he's not cooking' (failing visibly), 'undercooked' (premature take), and 'chef' as a compliment all branch off the same metaphor.",
  },
  {
    title: "When To Drop It",
    body:
      "Best deployed under freestyle clips, comebacks, monologues, and bits where the creator is clearly committed. It signals confidence in the outcome before the outcome lands.",
  },
] as const;
const LET_HIM_COOK_COLUMNS = buildMemeColumns("let-him-cook", [
  { title: "'Let him cook' but every cook is a different sport.", username: "highlight.cut", likes: "302.1K", mediaKind: "video", ratio: 0.74 },
  { title: "Where 'let him cook' actually came from on Twitch.", username: "stream.story", likes: "44.6K", mediaKind: "photo", ratio: 1.18 },
  { title: "Chefs that ate, ranked by comment-section consensus.", username: "saucy.list", likes: "67.0K", mediaKind: "video", ratio: 0.82 },
  { title: "Comments saying 'undercooked' on the worst takes of the week.", username: "kitchen.audit", likes: "21.9K", mediaKind: "photo", ratio: 0.96 },
  { title: "Mic-drop monologues: he kept cooking through the whole interview.", username: "press.room", likes: "118.5K", mediaKind: "video", ratio: 0.71 },
  { title: "Audio: 'nah let him cook 🧑‍🍳'.", username: "sound.bin", likes: "59.4K", mediaKind: "photo", ratio: 1.1 },
]);

const ITS_GIVING_SUMMARY =
  "A compact way of saying 'this radiates the energy of ___'. Pulled from ballroom culture, now standard for vibe-naming any aesthetic, mood, or character.";
const ITS_GIVING_DETAIL_INTRO =
  "'It's giving' originates in Black queer ballroom culture and went mainstream on TikTok and Instagram around 2021. By 2026 it's still a daily-driver comment template because of its flexibility — you can finish the sentence with literally anything.";
const ITS_GIVING_DETAIL_SECTIONS = [
  {
    title: "Sentence Shape",
    body:
      "Used as 'it's giving [noun phrase]'. The phrase you choose is doing the comedy: 'it's giving substitute teacher', 'it's giving final boss energy', 'it's giving home insurance commercial'.",
  },
  {
    title: "Tone",
    body:
      "Can be a compliment, roast, or vibe label depending on what follows. Often deployed as a triple repetition for emphasis: 'it's giving X. it's giving Y. it's giving 🥲'.",
  },
  {
    title: "Cultural Note",
    body:
      "Like 'slay', 'tea', and 'no cap', 'it's giving' is rooted in AAVE and ballroom slang. Crediting that lineage matters because the phrasing carries decades of community style behind it.",
  },
] as const;
const ITS_GIVING_COLUMNS = buildMemeColumns("its-giving", [
  { title: "'It's giving' format breakdown: the punchline is the noun.", username: "lex.lab", likes: "188.4K", mediaKind: "video", ratio: 0.74 },
  { title: "Ballroom history: where 'it's giving' actually comes from.", username: "house.archives", likes: "41.0K", mediaKind: "photo", ratio: 1.15 },
  { title: "Outfit edits captioned with the most unhinged 'it's giving' lines.", username: "fit.notes", likes: "78.6K", mediaKind: "video", ratio: 0.82 },
  { title: "Comments using 'it's giving' to roast brand collabs of the year.", username: "marketing.fail", likes: "17.2K", mediaKind: "photo", ratio: 0.92 },
  { title: "POV: a friend group describes you only via 'it's giving'.", username: "group.chat", likes: "143.0K", mediaKind: "video", ratio: 0.71 },
  { title: "Triple-stacked 'it's giving' comments worth screenshotting.", username: "screenshot.bin", likes: "32.5K", mediaKind: "photo", ratio: 1.1 },
]);

const CEO_OF_SUMMARY =
  "A playful crown — calling someone 'CEO of [thing]' anoints them as the authority on a quirk, habit, or skill. It's hype, not a job title.";
const CEO_OF_DETAIL_INTRO =
  "'CEO of ___' started on Twitter around 2018 ('Beyoncé is the CEO of slaying'), spread to Instagram and Reddit, and exploded on TikTok around 2020. It has stayed in active rotation through 2026 as a low-effort, high-warmth way to credit someone for something specific.";
const CEO_OF_DETAIL_SECTIONS = [
  {
    title: "How It Reads",
    body:
      "It's a compliment that works because the corporate framing is intentionally too big for the subject. Calling someone 'CEO of doomscrolling at 3 a.m.' is funny precisely because the role would never exist.",
  },
  {
    title: "Self-Roast Variant",
    body:
      "Frequently used in first person too — 'CEO of overthinking everything', 'CEO of canceling plans last minute'. It softens admission with branding humor.",
  },
  {
    title: "Don't Confuse With",
    body:
      "Y/N + CEO is a separate trope (Wattpad-style billionaire romance). Plain 'CEO of ___' is praise; Y/N + CEO is parody storytelling. They share a word, not a vibe.",
  },
] as const;
const CEO_OF_COLUMNS = buildMemeColumns("ceo-of", [
  { title: "'CEO of ___' explainer: from 2018 tweets to 2026 fyp comments.", username: "slang.deck", likes: "229.0K", mediaKind: "video", ratio: 0.74 },
  { title: "Top self-roast 'CEO of' comments from this week.", username: "comment.bin", likes: "55.6K", mediaKind: "photo", ratio: 1.18 },
  { title: "CEO of iced coffee orders, three quarters in a row.", username: "drink.review", likes: "38.7K", mediaKind: "video", ratio: 0.92 },
  { title: "Why corporate metaphors keep winning the comment section.", username: "business.lite", likes: "12.5K", mediaKind: "photo", ratio: 0.84 },
  { title: "POV: friend group elections for CEO, COO, and intern.", username: "group.chat", likes: "97.0K", mediaKind: "video", ratio: 0.71 },
  { title: "CEO of doomscrolling, hosting an annual shareholder meeting.", username: "meeting.fake", likes: "21.8K", mediaKind: "photo", ratio: 1.07 },
]);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeWikiKeyword(keyword: string | null | undefined): string {
  return keyword?.trim().toLowerCase() ?? "";
}

const WIKI_ENTRY_REGEX = new RegExp(
  `\\b(?:${[...CANONICAL_WIKI_KEYWORDS]
    .sort((left, right) => right.length - left.length)
    .map(escapeRegExp)
    .join("|")})\\b`,
  "gi",
);

export function toCanonicalWikiKeyword(keyword: string | null | undefined): string | null {
  const normalized = normalizeWikiKeyword(keyword);
  if (!normalized) return null;
  if (normalized === "croissant") return "Croissant";
  if (normalized === "tiktok") return "TikTok";
  if (normalized === "laminated pastry") return "laminated pastry";
  if (normalized === "parisian cafe") return "Parisian cafe";
  if (normalized === "wrizz") return "wrizz";
  if (normalized === "delulu") return "delulu";
  if (normalized === "sigma") return "sigma";
  if (normalized === "chronically online") return "chronically online";
  if (normalized === "y/n") return "Y/N";
  if (normalized === "let him cook") return "let him cook";
  if (normalized === "it's giving") return "it's giving";
  if (normalized === "ceo of") return "CEO of";
  return null;
}

export function getWikiExperience(keyword: string | null): WikiExperience {
  const normalized = normalizeWikiKeyword(keyword);
  if (normalized === "croissant") {
    return {
      label: "Croissant",
      summary: CROISSANT_SUMMARY,
      detailIntro: CROISSANT_DETAIL_INTRO,
      detailSections: [...CROISSANT_DETAIL_SECTIONS],
      columns: CROISSANT_COLUMNS,
    };
  }

  if (normalized === "tiktok") {
    return {
      label: "TikTok",
      summary: TIKTOK_SUMMARY,
      detailIntro: TIKTOK_DETAIL_INTRO,
      detailSections: [...TIKTOK_DETAIL_SECTIONS],
      columns: TIKTOK_COLUMNS,
    };
  }

  if (normalized === "laminated pastry") {
    return {
      label: "laminated pastry",
      summary: LAMINATED_PASTRY_SUMMARY,
      detailIntro: LAMINATED_PASTRY_DETAIL_INTRO,
      detailSections: [...LAMINATED_PASTRY_DETAIL_SECTIONS],
      columns: LAMINATED_PASTRY_COLUMNS,
    };
  }

  if (normalized === "parisian cafe") {
    return {
      label: "Parisian cafe",
      summary: PARISIAN_CAFE_SUMMARY,
      detailIntro: PARISIAN_CAFE_DETAIL_INTRO,
      detailSections: [...PARISIAN_CAFE_DETAIL_SECTIONS],
      columns: PARISIAN_CAFE_COLUMNS,
    };
  }

  if (normalized === "wrizz") {
    return {
      label: "wrizz",
      summary: WRIZZ_SUMMARY,
      detailIntro: WRIZZ_DETAIL_INTRO,
      detailSections: [...WRIZZ_DETAIL_SECTIONS],
      columns: WRIZZ_COLUMNS,
    };
  }

  if (normalized === "delulu") {
    return {
      label: "delulu",
      summary: DELULU_SUMMARY,
      detailIntro: DELULU_DETAIL_INTRO,
      detailSections: [...DELULU_DETAIL_SECTIONS],
      columns: DELULU_COLUMNS,
    };
  }

  if (normalized === "sigma") {
    return {
      label: "sigma",
      summary: SIGMA_SUMMARY,
      detailIntro: SIGMA_DETAIL_INTRO,
      detailSections: [...SIGMA_DETAIL_SECTIONS],
      columns: SIGMA_COLUMNS,
    };
  }

  if (normalized === "chronically online") {
    return {
      label: "chronically online",
      summary: CHRONICALLY_ONLINE_SUMMARY,
      detailIntro: CHRONICALLY_ONLINE_DETAIL_INTRO,
      detailSections: [...CHRONICALLY_ONLINE_DETAIL_SECTIONS],
      columns: CHRONICALLY_ONLINE_COLUMNS,
    };
  }

  if (normalized === "y/n") {
    return {
      label: "Y/N",
      summary: YN_SUMMARY,
      detailIntro: YN_DETAIL_INTRO,
      detailSections: [...YN_DETAIL_SECTIONS],
      columns: YN_COLUMNS,
    };
  }

  if (normalized === "let him cook") {
    return {
      label: "let him cook",
      summary: LET_HIM_COOK_SUMMARY,
      detailIntro: LET_HIM_COOK_DETAIL_INTRO,
      detailSections: [...LET_HIM_COOK_DETAIL_SECTIONS],
      columns: LET_HIM_COOK_COLUMNS,
    };
  }

  if (normalized === "it's giving") {
    return {
      label: "it's giving",
      summary: ITS_GIVING_SUMMARY,
      detailIntro: ITS_GIVING_DETAIL_INTRO,
      detailSections: [...ITS_GIVING_DETAIL_SECTIONS],
      columns: ITS_GIVING_COLUMNS,
    };
  }

  if (normalized === "ceo of") {
    return {
      label: "CEO of",
      summary: CEO_OF_SUMMARY,
      detailIntro: CEO_OF_DETAIL_INTRO,
      detailSections: [...CEO_OF_DETAIL_SECTIONS],
      columns: CEO_OF_COLUMNS,
    };
  }

  return {
    label: "Entry Point",
    summary: "A quick AI summary that gives the highlighted keyword immediate context.",
    detailIntro:
      "This entry point is designed to turn a highlighted keyword into a lightweight discovery surface. Instead of stopping at a visual affordance, it first explains why the term matters and then opens into a richer stream of related content.",
    detailSections: [
      {
        title: "What It Does",
        body:
          "The collapsed state gives users a short explanation so the entry point feels useful at a glance. The expanded state then provides a denser overview that can hold more nuance and more editorial structure.",
      },
      {
        title: "Why It Helps",
        body:
          "That progression lowers the cognitive jump from reading a comment to exploring a topic. Users can decide whether the keyword is interesting before committing to a deeper content panel.",
      },
    ],
    columns: CROISSANT_COLUMNS,
  };
}

export function getInfographImageSrc(keyword: string | null): string {
  const normalized = normalizeWikiKeyword(keyword);
  if (normalized === "croissant") return CROISSANT_INFOGRAPH_IMAGE_SRC;
  if (normalized === "tiktok") return TIKTOK_INFOGRAPH_IMAGE_SRC;
  if (normalized === "laminated pastry") return LAMINATED_PASTRY_INFOGRAPH_IMAGE_SRC;
  if (normalized === "parisian cafe") return PARISIAN_CAFE_INFOGRAPH_IMAGE_SRC;
  return TIKTOK_INFOGRAPH_IMAGE_SRC;
}

export function renderWikiLinkedText(
  text: string,
  onKeywordClick?: (keyword: string) => void,
  excludeKeyword?: string | null,
): string | Array<string | JSX.Element> {
  if (!text) return text;
  const excludedCanonicalKeyword = toCanonicalWikiKeyword(excludeKeyword);

  const nodes: Array<string | JSX.Element> = [];
  let lastIndex = 0;
  let matchIndex = 0;
  let match: RegExpExecArray | null;
  WIKI_ENTRY_REGEX.lastIndex = 0;

  while ((match = WIKI_ENTRY_REGEX.exec(text)) !== null) {
    const start = match.index;
    const matchedText = match[0];
    if (start > lastIndex) nodes.push(text.slice(lastIndex, start));

    const canonicalKeyword = toCanonicalWikiKeyword(matchedText);
    if (
      canonicalKeyword &&
      onKeywordClick &&
      canonicalKeyword.toLowerCase() !== excludedCanonicalKeyword?.toLowerCase()
    ) {
      nodes.push(
        <WikiEntryPointInline
          key={`wiki-entry-${start}-${matchIndex}`}
          label={matchedText}
          canonicalKeyword={canonicalKeyword}
          onClick={onKeywordClick}
        />,
      );
    } else {
      nodes.push(matchedText);
    }

    lastIndex = start + matchedText.length;
    matchIndex += 1;
  }

  if (nodes.length === 0) return text;
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function WikiEntryPointInline({
  label,
  canonicalKeyword,
  onClick,
}: {
  label: string;
  canonicalKeyword: string;
  onClick: (keyword: string) => void;
}) {
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(event) => {
        event.stopPropagation();
        onClick(canonicalKeyword);
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        onClick(canonicalKeyword);
      }}
      style={{
        color: getColorCSSVar("UIText1"),
        backgroundImage: `radial-gradient(circle, ${getColorCSSVar("UITextPlaceholder")} 1px, transparent 1.1px)`,
        backgroundPosition: "0 calc(100% - 1px)",
        backgroundRepeat: "repeat-x",
        backgroundSize: "5px 3px",
        paddingBottom: 2,
        cursor: "pointer",
      }}
    >
      {label}
    </span>
  );
}

export function WikiRichDetail({
  experience,
  onKeywordClick,
  currentKeyword,
}: {
  experience: WikiExperience;
  onKeywordClick?: (keyword: string) => void;
  currentKeyword?: string | null;
}) {
  return (
    <div className="mt-1 flex flex-col gap-3">
      <TUXText
        as="div"
        style={{
          fontSize: 15,
          fontWeight: 500,
          lineHeight: "19.5px",
          color: getColorCSSVar("UIText1"),
        }}
      >
        {renderWikiLinkedText(experience.detailIntro, onKeywordClick, currentKeyword)}
      </TUXText>

      {experience.detailSections.map((section) => (
        <div key={section.title} className="flex flex-col gap-1.5">
          <TUXText
            as="div"
            style={{
              fontSize: 12,
              fontWeight: 600,
              lineHeight: "15.6px",
              color: getColorCSSVar("UIText3"),
              textTransform: "uppercase",
              letterSpacing: "0.02em",
            }}
          >
            {section.title}
          </TUXText>
          <TUXText
            as="div"
            style={{
              fontSize: 15,
              fontWeight: 500,
              lineHeight: "19.5px",
              color: getColorCSSVar("UIText1"),
            }}
          >
            {renderWikiLinkedText(section.body, onKeywordClick, currentKeyword)}
          </TUXText>
        </div>
      ))}
    </div>
  );
}
