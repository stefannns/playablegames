import { avatarSlotFromId, localAvatarUrlForDisplay } from "../../../../utils/local_avatar";
import {
  COMMENT_COFFEE_SHOP_IMAGES,
  COMMENT_DEFAULT_EDITOR_IMAGE,
  COMMENT_STICKER_IMAGES,
  migrateCommentImageUrl,
} from "./comment_assets";

export type CommentImageDisplay = "auto" | "portrait" | "landscape" | "square";
export type CommentAuthorLabel = "Creator" | "Following";

export type CommentMediaSpec =
  | {
      type: "image";
      visible: boolean;
      url: string;
      display: CommentImageDisplay;
    }
  | {
      type: "sticker";
      visible: boolean;
      stickerRef: CommentStickerReference;
    }
  | {
      type: "audio";
      visible: boolean;
      duration: string;
      text: string;
    };

export type CommentContentNode = {
  id: string;
  authorName: string;
  authorAvatarSrc: string;
  authorLabel?: CommentAuthorLabel;
  content: string;
  timeLabel: string;
  likeCountLabel: string;
  media?: CommentMediaSpec;
  replies: CommentContentNode[];
  viewRepliesLabel?: string;
};

export type CommentComposerConfig = {
  avatarSrc: string;
  placeholder: string;
};

export type CommentContentDocument = {
  version: 1;
  composer: CommentComposerConfig;
  comments: CommentContentNode[];
};

export const COMMENT_CONTENT_STORAGE_KEY = "comment-panel-content-document-v4";
export const COMMENT_LOCAL_AVATAR_SLOT_COUNT = 60;

const commentAvatarRef = (seed: string) =>
  String(avatarSlotFromId(seed, COMMENT_LOCAL_AVATAR_SLOT_COUNT));

const COMMENT_AVATAR_REFS = {
  creator: commentAvatarRef("maya-brews"),
  composer: String(avatarSlotFromId("comment-composer", COMMENT_LOCAL_AVATAR_SLOT_COUNT)),
} as const;

const COMMENT_MEDIA_REFS = COMMENT_COFFEE_SHOP_IMAGES;

export const COMMENT_STICKER_OPTIONS = [
  {
    id: "sticker-coffee-need",
    label: "I Need Coffee",
    src: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExejdsa3UxbGI3Y2I1cjFsc2x5b3c0djNmMjVoYWFoOXcwaWJjZzMzdyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/xGOPX4IY24tM1JZnHq/giphy.gif",
  },
  {
    id: "sticker-coffee-wait",
    label: "Coffee Wait",
    src: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZno0OG5zaTFzdXJrMWZuamE3cnc0YW5qd3h2YzdmaXZ5a3Z6aXQ0OSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/5YuhLwDgrgtRVwI7OY/giphy.gif",
  },
  {
    id: "sticker-wide",
    label: "Local Sticker Wide",
    src: COMMENT_STICKER_IMAGES.wide,
  },
  {
    id: "sticker-card",
    label: "Local Sticker Card",
    src: COMMENT_STICKER_IMAGES.card,
  },
] as const;

export type CommentStickerOptionId = (typeof COMMENT_STICKER_OPTIONS)[number]["id"];
export type CommentStickerReference = string;

const COMMENT_STICKER_URLS: Record<CommentStickerOptionId, string> = Object.fromEntries(
  COMMENT_STICKER_OPTIONS.map((option) => [option.id, option.src]),
) as Record<CommentStickerOptionId, string>;

const COFFEE_SHOP_COMMENT_CONTENT_DOCUMENT: CommentContentDocument = {
  version: 1,
  composer: {
    avatarSrc: COMMENT_AVATAR_REFS.composer,
    placeholder: "Add comment...",
  },
  comments: [
    {
      id: "comment-nyc-1",
      authorName: "beanstayup",
      authorAvatarSrc: commentAvatarRef("beanstayup"),
      content:
        "Devocion for the light-filled plant oasis, Abraco for zero-fluff East Village energy, and SEY when you want to taste the bean instead of the syrup.",
      timeLabel: "12m ago",
      likeCountLabel: "9.8k",
      viewRepliesLabel: "View 4 replies",
      replies: [
        {
          id: "comment-nyc-1-reply-1",
          authorName: "Maya Brews",
          authorAvatarSrc: COMMENT_AVATAR_REFS.creator,
          authorLabel: "Creator",
          content: "this is exactly the kind of comment section map i needed",
          timeLabel: "10m ago",
          likeCountLabel: "2.1k",
          replies: [],
        },
        {
          id: "comment-nyc-1-reply-2",
          authorName: "oliveoilcakefan",
          authorAvatarSrc: commentAvatarRef("oliveoilcakefan"),
          content: "Abraco's olive oil cake deserves co-headliner billing btw",
          timeLabel: "9m ago",
          likeCountLabel: "684",
          replies: [],
        },
        {
          id: "comment-nyc-1-reply-3",
          authorName: "quietgrind",
          authorAvatarSrc: commentAvatarRef("quietgrind"),
          content: "SEY for the coffee, Devocion for the meeting i pretend is casual",
          timeLabel: "8m ago",
          likeCountLabel: "441",
          replies: [],
        },
      ],
    },
    {
      id: "comment-nyc-2",
      authorName: "bklynmorningrun",
      authorAvatarSrc: commentAvatarRef("bklynmorningrun"),
      content:
        "Not enough people talk about how Devocion feels like you accidentally walked into a greenhouse with espresso.",
      timeLabel: "18m ago",
      likeCountLabel: "6.1k",
      media: {
        type: "image",
        visible: true,
        url: COMMENT_MEDIA_REFS.devocionAtrium,
        display: "auto",
      },
      viewRepliesLabel: "View 3 replies",
      replies: [
        {
          id: "comment-nyc-2-reply-1",
          authorName: "yellowmugagenda",
          authorAvatarSrc: commentAvatarRef("yellowmugagenda"),
          content: "the yellow mug somehow makes every latte taste 12 percent better",
          timeLabel: "16m ago",
          likeCountLabel: "902",
          replies: [],
        },
        {
          id: "comment-nyc-2-reply-2",
          authorName: "Maya Brews",
          authorAvatarSrc: COMMENT_AVATAR_REFS.creator,
          authorLabel: "Creator",
          content: "okay greenhouse with espresso is exactly the vibe",
          timeLabel: "15m ago",
          likeCountLabel: "1.5k",
          replies: [],
        },
      ],
    },
    {
      id: "comment-nyc-3",
      authorName: "cardamombuntruth",
      authorAvatarSrc: commentAvatarRef("cardamombuntruth"),
      content:
        "La Cabra is not hidden and i support gatekeeping it emotionally because that cardamom bun has ruined me for all other pastries.",
      timeLabel: "24m ago",
      likeCountLabel: "4.3k",
      viewRepliesLabel: "View 2 replies",
      replies: [
        {
          id: "comment-nyc-3-reply-1",
          authorName: "lineforlacabra",
          authorAvatarSrc: commentAvatarRef("lineforlacabra"),
          content: "the Saturday line outside La Cabra is my villain origin story and yes i am attaching evidence",
          timeLabel: "21m ago",
          likeCountLabel: "1.2k",
          media: {
            type: "image",
            visible: true,
            url: COMMENT_MEDIA_REFS.laCabraRoom,
            display: "auto",
          },
          replies: [],
        },
        {
          id: "comment-nyc-3-reply-2",
          authorName: "Maya Brews",
          authorAvatarSrc: COMMENT_AVATAR_REFS.creator,
          authorLabel: "Creator",
          content: "worth emotional damage unfortunately",
          timeLabel: "19m ago",
          likeCountLabel: "933",
          replies: [],
        },
      ],
    },
    {
      id: "comment-nyc-4",
      authorName: "whereisgoodwifi",
      authorAvatarSrc: commentAvatarRef("whereisgoodwifi"),
      content:
        "Need Manhattan recs where i can sit for an hour without feeling like i am committing a crime. Go.",
      timeLabel: "31m ago",
      likeCountLabel: "2.2k",
      viewRepliesLabel: "View 6 replies",
      replies: [
        {
          id: "comment-nyc-4-reply-1",
          authorName: "notebookandfoam",
          authorAvatarSrc: commentAvatarRef("notebookandfoam"),
          content: "Coffee Project earlier in the afternoon usually works for me",
          timeLabel: "28m ago",
          likeCountLabel: "511",
          replies: [],
        },
        {
          id: "comment-nyc-4-reply-2",
          authorName: "blackfoxdesk",
          authorAvatarSrc: commentAvatarRef("blackfoxdesk"),
          content: "Black Fox downtown if you want serious coffee and not too much chaos",
          timeLabel: "26m ago",
          likeCountLabel: "347",
          replies: [],
        },
        {
          id: "comment-nyc-4-reply-3",
          authorName: "Maya Brews",
          authorAvatarSrc: COMMENT_AVATAR_REFS.creator,
          authorLabel: "Creator",
          content: "bonus points if the iced latte is actually good too",
          timeLabel: "25m ago",
          likeCountLabel: "619",
          replies: [],
        },
      ],
    },
    {
      id: "comment-nyc-5",
      authorName: "evillageespresso",
      authorAvatarSrc: commentAvatarRef("evillageespresso"),
      content: "voice note because my East Village ranking changes daily",
      timeLabel: "46m ago",
      likeCountLabel: "1.9k",
      media: {
        type: "audio",
        visible: true,
        duration: "0:18",
        text:
          "For East Village: Coffee Project for the deconstructed latte, La Cabra for pour over and pastry, Abraco for intense coffee and olive oil cake. Three totally different moods.",
      },
      replies: [],
    },
    {
      id: "comment-nyc-6",
      authorName: "subwaybarista",
      authorAvatarSrc: commentAvatarRef("subwaybarista"),
      content:
        "me opening this comment section knowing my entire paycheck is about to become a coffee crawl",
      timeLabel: "54m ago",
      likeCountLabel: "13.2k",
      media: {
        type: "sticker",
        visible: true,
        stickerRef: "sticker-coffee-need",
      },
      replies: [],
    },
    {
      id: "comment-nyc-7",
      authorName: "uptownflatwhite",
      authorAvatarSrc: commentAvatarRef("uptownflatwhite"),
      content:
        "The Oma Shop II if you want somewhere that actually feels like a community space and not just a pretty counter.",
      timeLabel: "1h ago",
      likeCountLabel: "3.6k",
      viewRepliesLabel: "View 3 replies",
      replies: [
        {
          id: "comment-nyc-7-reply-2",
          authorName: "sundayinharlem",
          authorAvatarSrc: commentAvatarRef("sundayinharlem"),
          authorLabel: "Following",
          content: "I came yesterday AND I LOVED THE MACARONS I WILL COME BACK FOR COFFEE AND CAKE FOR SURE💕💕💕",
          timeLabel: "55m ago",
          likeCountLabel: "429",
          media: {
            type: "image",
            visible: true,
            url: COMMENT_MEDIA_REFS.omaMacarons,
            display: "auto",
          },
          replies: [],
        },
        {
          id: "comment-nyc-7-reply-1",
          authorName: "flatbushfork",
          authorAvatarSrc: commentAvatarRef("flatbushfork"),
          content: "Lips Cafe gives me that same community-first energy in Flatbush",
          timeLabel: "58m ago",
          likeCountLabel: "733",
          replies: [],
        },
      ],
    },
    {
      id: "comment-nyc-8",
      authorName: "tinycafeguy",
      authorAvatarSrc: commentAvatarRef("tinycafeguy"),
      content:
        "Small cafe owner here. Please keep making posts like this. One honest shoutout can carry an indie shop through a slow weekday.",
      timeLabel: "1h ago",
      likeCountLabel: "2.8k",
      viewRepliesLabel: "View 2 replies",
      replies: [
        {
          id: "comment-nyc-8-reply-1",
          authorName: "Maya Brews",
          authorAvatarSrc: COMMENT_AVATAR_REFS.creator,
          authorLabel: "Creator",
          content: "rooting for the independents every time",
          timeLabel: "59m ago",
          likeCountLabel: "811",
          replies: [],
        },
        {
          id: "comment-nyc-8-reply-2",
          authorName: "boroughbyborough",
          authorAvatarSrc: commentAvatarRef("boroughbyborough"),
          content: "not me immediately wanting everyone to drop their borough",
          timeLabel: "57m ago",
          likeCountLabel: "302",
          replies: [],
        },
      ],
    },
    {
      id: "comment-nyc-9",
      authorName: "sohoonfoot",
      authorAvatarSrc: commentAvatarRef("sohoonfoot"),
      authorLabel: "Following",
      content:
        "@nina @lexi we are doing La Cabra -> Coffee Project -> Felix next weekend and nobody can stop me",
      timeLabel: "1h ago",
      likeCountLabel: "857",
      viewRepliesLabel: "View 2 replies",
      replies: [
        {
          id: "comment-nyc-9-reply-1",
          authorName: "lexiwalks",
          authorAvatarSrc: commentAvatarRef("lexiwalks"),
          content: "Felix is camp in coffee form and i mean that lovingly",
          timeLabel: "1h ago",
          likeCountLabel: "266",
          replies: [],
        },
      ],
    },
    {
      id: "comment-nyc-10",
      authorName: "ornateespresso",
      authorAvatarSrc: commentAvatarRef("ornateespresso"),
      content:
        "Felix is absolutely doing the most and I still folded instantly. The room alone talked me into staying for a second drink.",
      timeLabel: "1h ago",
      likeCountLabel: "1.4k",
      media: {
        type: "image",
        visible: true,
        url: COMMENT_MEDIA_REFS.felixInterior,
        display: "auto",
      },
      viewRepliesLabel: "View 4 replies",
      replies: [
        {
          id: "comment-nyc-10-reply-1",
          authorName: "williamsburgsip",
          authorAvatarSrc: commentAvatarRef("williamsburgsip"),
          content: "Felix is camp in coffee form and i mean that lovingly",
          timeLabel: "1h ago",
          likeCountLabel: "385",
          replies: [],
        },
        {
          id: "comment-nyc-10-reply-2",
          authorName: "cobblestonefoam",
          authorAvatarSrc: commentAvatarRef("cobblestonefoam"),
          content: "the espresso tonic there feels like a performance piece",
          timeLabel: "58m ago",
          likeCountLabel: "194",
          replies: [],
        },
      ],
    },
    {
      id: "comment-nyc-11",
      authorName: "pouroverszn",
      authorAvatarSrc: commentAvatarRef("pouroverszn"),
      content:
        "SEY for nerd coffee, Park at Kims for a calm Nolita reset, Hi-Collar if you want hand-brewed coffee and zero laptop chaos.",
      timeLabel: "1h ago",
      likeCountLabel: "1.7k",
      replies: [
        {
          id: "comment-nyc-11-reply-1",
          authorName: "manualbrewonly",
          authorAvatarSrc: commentAvatarRef("manualbrewonly"),
          content: "",
          timeLabel: "58m ago",
          likeCountLabel: "221",
          media: {
            type: "image",
            visible: true,
            url: COMMENT_MEDIA_REFS.seyMeme,
            display: "auto",
          },
          replies: [],
        },
      ],
    },
    {
      id: "comment-nyc-12",
      authorName: "deconstructedmilk",
      authorAvatarSrc: commentAvatarRef("deconstructedmilk"),
      content:
        "Has anyone done Coffee Project's deconstructed latte more than once or is it a one-time experience for the plot",
      timeLabel: "2h ago",
      likeCountLabel: "1.1k",
      viewRepliesLabel: "View 3 replies",
      replies: [
        {
          id: "comment-nyc-12-reply-1",
          authorName: "cremaengineer",
          authorAvatarSrc: commentAvatarRef("cremaengineer"),
          content: "i ordered it twice because i needed to understand myself",
          timeLabel: "1h ago",
          likeCountLabel: "547",
          replies: [],
        },
        {
          id: "comment-nyc-12-reply-2",
          authorName: "Maya Brews",
          authorAvatarSrc: COMMENT_AVATAR_REFS.creator,
          authorLabel: "Creator",
          content: "for science, obviously",
          timeLabel: "1h ago",
          likeCountLabel: "724",
          replies: [],
        },
      ],
    },
    {
      id: "comment-nyc-13",
      authorName: "midtownmatcha",
      authorAvatarSrc: commentAvatarRef("midtownmatcha"),
      content: "sorry this had to be a voice note because i have FEELINGS",
      timeLabel: "2h ago",
      likeCountLabel: "902",
      media: {
        type: "audio",
        visible: true,
        duration: "0:11",
        text:
          "Black Fox never misses when i need an actual downtown coffee and not dessert in disguise. Also yes i will still go to Felix when i feel theatrical.",
      },
      replies: [],
    },
    {
      id: "comment-nyc-14",
      authorName: "boroughsnob",
      authorAvatarSrc: commentAvatarRef("boroughsnob"),
      content:
        "yall call every cafe a hidden gem the second it has sunlight and a ceramic cup",
      timeLabel: "2h ago",
      likeCountLabel: "5.6k",
      viewRepliesLabel: "View 3 replies",
      replies: [
        {
          id: "comment-nyc-14-reply-1",
          authorName: "Maya Brews",
          authorAvatarSrc: COMMENT_AVATAR_REFS.creator,
          authorLabel: "Creator",
          content: "let me be dramatic in peace",
          timeLabel: "2h ago",
          likeCountLabel: "2.7k",
          replies: [],
        },
        {
          id: "comment-nyc-14-reply-2",
          authorName: "notesappfoodie",
          authorAvatarSrc: commentAvatarRef("notesappfoodie"),
          content: "fair but i am still saving every single one of these",
          timeLabel: "1h ago",
          likeCountLabel: "884",
          replies: [],
        },
      ],
    },
    {
      id: "comment-nyc-15",
      authorName: "linemaxxer",
      authorAvatarSrc: commentAvatarRef("linemaxxer"),
      content: "the La Cabra queue every Saturday morning",
      timeLabel: "2h ago",
      likeCountLabel: "3.3k",
      media: {
        type: "sticker",
        visible: true,
        stickerRef: "sticker-coffee-wait",
      },
      replies: [],
    },
    {
      id: "comment-nyc-16",
      authorName: "latteontheles",
      authorAvatarSrc: commentAvatarRef("latteontheles"),
      content:
        "Proof that Abraço is tiny, loud, and somehow still completely worth squeezing into for the coffee and olive oil cake.",
      timeLabel: "2h ago",
      likeCountLabel: "2.4k",
      media: {
        type: "image",
        visible: true,
        url: COMMENT_MEDIA_REFS.abracoCounter,
        display: "auto",
      },
      viewRepliesLabel: "View 2 replies",
      replies: [
        {
          id: "comment-nyc-16-reply-1",
          authorName: "Maya Brews",
          authorAvatarSrc: COMMENT_AVATAR_REFS.creator,
          authorLabel: "Creator",
          content: "tiny room, huge payoff. exactly my type of place",
          timeLabel: "1h ago",
          likeCountLabel: "1.1k",
          replies: [],
        },
      ],
    },
    {
      id: "comment-nyc-17",
      authorName: "foamandfreelance",
      authorAvatarSrc: commentAvatarRef("foamandfreelance"),
      content:
        "Not As Bitter looks like a black hole from outside and then hands you something so pretty you forgive the entire bit.",
      timeLabel: "3h ago",
      likeCountLabel: "1.8k",
      media: {
        type: "image",
        visible: true,
        url: COMMENT_MEDIA_REFS.notAsBitterFacade,
        display: "auto",
      },
      viewRepliesLabel: "View 3 replies",
      replies: [
        {
          id: "comment-nyc-17-reply-1",
          authorName: "seatcamping",
          authorAvatarSrc: commentAvatarRef("seatcamping"),
          content: "their whole aesthetic says do not speak to me until i have my drink",
          timeLabel: "2h ago",
          likeCountLabel: "522",
          replies: [],
        },
      ],
    },
  ],
};

const KYOTO_TRIP_COMMENT_CONTENT_DOCUMENT: CommentContentDocument = {
  version: 1,
  composer: {
    avatarSrc: COMMENT_AVATAR_REFS.composer,
    placeholder: "Add comment...",
  },
  comments: [
    {
      id: "comment-kyoto-1",
      authorName: "shinkansenshawty",
      authorAvatarSrc: commentAvatarRef("shinkansenshawty"),
      content:
        "Hot tip: skip Fushimi Inari midday and go right before sunset. Empty trail, golden gates, zero tour groups. Life changing.",
      timeLabel: "8m ago",
      likeCountLabel: "12.4k",
      viewRepliesLabel: "View 3 replies",
      replies: [
        {
          id: "comment-kyoto-1-reply-1",
          authorName: "Maya Brews",
          authorAvatarSrc: COMMENT_AVATAR_REFS.creator,
          authorLabel: "Creator",
          content: "the sunset hike was the move for sure",
          timeLabel: "6m ago",
          likeCountLabel: "1.8k",
          replies: [],
        },
        {
          id: "comment-kyoto-1-reply-2",
          authorName: "torii_truther",
          authorAvatarSrc: commentAvatarRef("torii_truther"),
          content: "5pm in fall is unreal, please everyone listen to this",
          timeLabel: "4m ago",
          likeCountLabel: "612",
          replies: [],
        },
      ],
    },
    {
      id: "comment-kyoto-2",
      authorName: "matchainmymug",
      authorAvatarSrc: commentAvatarRef("matchainmymug"),
      content:
        "Need a real matcha rec in Gion that isn't a tourist trap. Begging.",
      timeLabel: "16m ago",
      likeCountLabel: "3.2k",
      viewRepliesLabel: "View 2 replies",
      replies: [
        {
          id: "comment-kyoto-2-reply-1",
          authorName: "tearoomanon",
          authorAvatarSrc: commentAvatarRef("tearoomanon"),
          content: "Tsujiri's main shop is still legit if you go on a weekday morning",
          timeLabel: "12m ago",
          likeCountLabel: "742",
          replies: [],
        },
      ],
    },
    {
      id: "comment-kyoto-3",
      authorName: "ryokanlife",
      authorAvatarSrc: commentAvatarRef("ryokanlife"),
      content: "voice note because i had too many opinions about the ryokan",
      timeLabel: "27m ago",
      likeCountLabel: "1.6k",
      media: {
        type: "audio",
        visible: true,
        duration: "0:14",
        text:
          "Splurge on one night at a small countryside ryokan, do the kaiseki dinner, then book cheaper city stays the rest of the trip. Best balance.",
      },
      replies: [],
    },
    {
      id: "comment-kyoto-4",
      authorName: "bambooforestbro",
      authorAvatarSrc: commentAvatarRef("bambooforestbro"),
      content: "arashiyama at 7am hits totally different. you can hear the bamboo creak.",
      timeLabel: "41m ago",
      likeCountLabel: "5.9k",
      replies: [],
    },
    {
      id: "comment-kyoto-5",
      authorName: "stationramenstan",
      authorAvatarSrc: commentAvatarRef("stationramenstan"),
      content:
        "anyone else just eat at the basement food halls under the big stations? feels illegal how good it is",
      timeLabel: "1h ago",
      likeCountLabel: "4.1k",
      media: {
        type: "sticker",
        visible: true,
        stickerRef: "sticker-coffee-need",
      },
      replies: [],
    },
  ],
};

const HOT_TAKES_COMMENT_CONTENT_DOCUMENT: CommentContentDocument = {
  version: 1,
  composer: {
    avatarSrc: COMMENT_AVATAR_REFS.composer,
    placeholder: "Add comment...",
  },
  comments: [
    {
      id: "comment-hot-1",
      authorName: "mildlyspicy",
      authorAvatarSrc: commentAvatarRef("mildlyspicy"),
      content: "pineapple on pizza is fine and the discourse around it is more annoying than the pineapple itself",
      timeLabel: "3m ago",
      likeCountLabel: "18.7k",
      replies: [],
    },
    {
      id: "comment-hot-2",
      authorName: "sundayopinion",
      authorAvatarSrc: commentAvatarRef("sundayopinion"),
      content: "iced americano is a personality and i will not apologize",
      timeLabel: "9m ago",
      likeCountLabel: "6.4k",
      replies: [],
    },
    {
      id: "comment-hot-3",
      authorName: "Maya Brews",
      authorAvatarSrc: COMMENT_AVATAR_REFS.creator,
      authorLabel: "Creator",
      content: "the comments are doing the absolute most today and i am here for it",
      timeLabel: "14m ago",
      likeCountLabel: "9.1k",
      replies: [],
    },
    {
      id: "comment-hot-4",
      authorName: "honestlyno",
      authorAvatarSrc: commentAvatarRef("honestlyno"),
      content: "brunch is overrated. it's just expensive breakfast you waited 45 minutes for.",
      timeLabel: "22m ago",
      likeCountLabel: "11.2k",
      replies: [],
    },
  ],
};

// 围绕一个 "猫咪试图优雅跳上柜台、最后翻车把咖啡打翻" 的搞笑短视频，评论区全是
// 玩梗 / 抖机灵 / emoji-only 的高赞回复。
const COMEDY_CHAOS_COMMENT_CONTENT_DOCUMENT: CommentContentDocument = {
  version: 1,
  composer: {
    avatarSrc: COMMENT_AVATAR_REFS.composer,
    placeholder: "Add comment...",
  },
  comments: [
    {
      id: "comment-bit-1",
      authorName: "physicsdenier",
      authorAvatarSrc: commentAvatarRef("physicsdenier"),
      content:
        "the way he hit the ground harder than my self esteem on a monday 😭😭",
      timeLabel: "1m ago",
      likeCountLabel: "98.4k",
      viewRepliesLabel: "View 4 replies",
      replies: [
        {
          id: "comment-bit-1-reply-1",
          authorName: "Maya Brews",
          authorAvatarSrc: COMMENT_AVATAR_REFS.creator,
          authorLabel: "Creator",
          content: "appreciate u for this 🫡",
          timeLabel: "1m ago",
          likeCountLabel: "12.4k",
          replies: [],
        },
        {
          id: "comment-bit-1-reply-2",
          authorName: "lowkeydown",
          authorAvatarSrc: commentAvatarRef("lowkeydown"),
          content: "why is this comment so personal",
          timeLabel: "1m ago",
          likeCountLabel: "8.9k",
          replies: [],
        },
        {
          id: "comment-bit-1-reply-3",
          authorName: "sadgirlhrs",
          authorAvatarSrc: commentAvatarRef("sadgirlhrs"),
          content: "called me out and didn't even tag me",
          timeLabel: "1m ago",
          likeCountLabel: "5.6k",
          replies: [],
        },
      ],
    },
    // Promoted meme comment — first-screen wiki entry: "CEO of"
    {
      id: "comment-bit-14",
      authorName: "ceooficedcoffee",
      authorAvatarSrc: commentAvatarRef("ceooficedcoffee"),
      content: "him? CEO of overcommitting to the bit. quarterly earnings: zero dignity 📉",
      timeLabel: "1m ago",
      likeCountLabel: "82.7k",
      viewRepliesLabel: "View 2 replies",
      replies: [
        {
          id: "comment-bit-14-reply-1",
          authorName: "boardmeetingbabe",
          authorAvatarSrc: commentAvatarRef("boardmeetingbabe"),
          content: "shareholders are REELING",
          timeLabel: "1m ago",
          likeCountLabel: "8.2k",
          replies: [],
        },
      ],
    },
    {
      id: "comment-bit-2",
      authorName: "ragdollphysics",
      authorAvatarSrc: commentAvatarRef("ragdollphysics"),
      content:
        "POV: gravity finally remembered it had something to do today",
      timeLabel: "2m ago",
      likeCountLabel: "76.2k",
      replies: [],
    },
    // Promoted meme comment — first-screen wiki entry: "it's giving"
    {
      id: "comment-bit-16",
      authorName: "itsgivingvibes",
      authorAvatarSrc: commentAvatarRef("itsgivingvibes"),
      content: "it's giving final boss energy. it's giving 'i won't be defeated by a rug.' it's giving 🥲",
      timeLabel: "2m ago",
      likeCountLabel: "68.1k",
      replies: [],
    },
    {
      id: "comment-bit-3",
      authorName: "narratorman",
      authorAvatarSrc: commentAvatarRef("narratorman"),
      content:
        "narrator: \"and that, kids, is how we lost the security deposit\"",
      timeLabel: "3m ago",
      likeCountLabel: "59.8k",
      viewRepliesLabel: "View 2 replies",
      replies: [
        {
          id: "comment-bit-3-reply-1",
          authorName: "depositdust",
          authorAvatarSrc: commentAvatarRef("depositdust"),
          content: "rip the security deposit 🪦 2019 - 2024",
          timeLabel: "2m ago",
          likeCountLabel: "21.5k",
          replies: [],
        },
      ],
    },
    // Promoted meme comment — first-screen wiki entry: "Y/N" + "CEO of"
    {
      id: "comment-bit-20",
      authorName: "ynfanfic",
      authorAvatarSrc: commentAvatarRef("ynfanfic"),
      content:
        "POV: y/n walks into the office and the CEO is THIS man. the fanfic writes itself. chapter 1: the floor incident.",
      timeLabel: "3m ago",
      likeCountLabel: "47.3k",
      viewRepliesLabel: "View 1 reply",
      replies: [
        {
          id: "comment-bit-20-reply-1",
          authorName: "wattpadwoman",
          authorAvatarSrc: commentAvatarRef("wattpadwoman"),
          content: "\"he was a chaos demon. she was an HR rep. could it be?\" 📖",
          timeLabel: "3m ago",
          likeCountLabel: "9.4k",
          replies: [],
        },
      ],
    },
    {
      id: "comment-bit-4",
      authorName: "buffering4ever",
      authorAvatarSrc: commentAvatarRef("buffering4ever"),
      content: "i replayed this 47 times and it still gets funnier",
      timeLabel: "4m ago",
      likeCountLabel: "98.2k",
      replies: [],
    },
    {
      id: "comment-bit-5",
      authorName: "emojionly",
      authorAvatarSrc: commentAvatarRef("emojionly"),
      content: "💀💀💀💀💀💀",
      timeLabel: "5m ago",
      likeCountLabel: "76.4k",
      replies: [],
    },
    {
      id: "comment-bit-6",
      authorName: "stuntcoordinator",
      authorAvatarSrc: commentAvatarRef("stuntcoordinator"),
      content:
        "tom cruise could NEVER. unprompted. unscripted. raw cinema.",
      timeLabel: "6m ago",
      likeCountLabel: "64.0k",
      media: {
        type: "sticker",
        visible: true,
        stickerRef: "sticker-coffee-wait",
      },
      replies: [],
    },
    {
      id: "comment-bit-7",
      authorName: "auntiemorale",
      authorAvatarSrc: commentAvatarRef("auntiemorale"),
      content:
        "this is what happens when you don't say grace before your iced latte",
      timeLabel: "8m ago",
      likeCountLabel: "53.8k",
      replies: [],
    },
    {
      id: "comment-bit-8",
      authorName: "spongebobref",
      authorAvatarSrc: commentAvatarRef("spongebobref"),
      content: "and that's how squidward lost his job 💼",
      timeLabel: "11m ago",
      likeCountLabel: "41.6k",
      replies: [],
    },
    {
      id: "comment-bit-9",
      authorName: "tagasinner",
      authorAvatarSrc: commentAvatarRef("tagasinner"),
      content: "@everyone come look at what bro did 😭",
      timeLabel: "13m ago",
      likeCountLabel: "33.2k",
      replies: [],
    },
    {
      id: "comment-bit-10",
      authorName: "voicenotebully",
      authorAvatarSrc: commentAvatarRef("voicenotebully"),
      content: "i HAVE to react to this one in audio",
      timeLabel: "16m ago",
      likeCountLabel: "27.8k",
      media: {
        type: "audio",
        visible: true,
        duration: "0:07",
        text:
          "ok hear me out he was THIS close to recovering it. THIS close. and the universe said nope.",
      },
      replies: [],
    },
    {
      id: "comment-bit-11",
      authorName: "deadpancomic",
      authorAvatarSrc: commentAvatarRef("deadpancomic"),
      content: "him: a graceful gazelle. the floor: HR.",
      timeLabel: "19m ago",
      likeCountLabel: "22.1k",
      replies: [],
    },
    {
      id: "comment-bit-12",
      authorName: "lastonthebit",
      authorAvatarSrc: commentAvatarRef("lastonthebit"),
      content:
        "i scrolled to the comments BEFORE watching just to make sure y'all weren't lying. you weren't. 🧎",
      timeLabel: "22m ago",
      likeCountLabel: "18.4k",
      replies: [],
    },
    // ===== 2025–2026 当代梗（剩余条目，作为深度滚动的梗百科入口） =====
    {
      id: "comment-bit-13",
      authorName: "rizzanalyst",
      authorAvatarSrc: commentAvatarRef("rizzanalyst"),
      content: "this man has WRIZZ. wholesome rizz. give him benefits.",
      timeLabel: "24m ago",
      likeCountLabel: "16.9k",
      replies: [],
    },
    {
      id: "comment-bit-15",
      authorName: "delulusolulu",
      authorAvatarSrc: commentAvatarRef("delulusolulu"),
      content:
        "the delulu is real: he stood up, looked at the camera, and decided THIS is the clip that gets him a record deal",
      timeLabel: "29m ago",
      likeCountLabel: "13.6k",
      replies: [],
    },
    {
      id: "comment-bit-17",
      authorName: "letmecookbro",
      authorAvatarSrc: commentAvatarRef("letmecookbro"),
      content: "nah let him cook 🧑‍🍳 the recipe is humiliation, the dish is virality",
      timeLabel: "35m ago",
      likeCountLabel: "10.4k",
      replies: [],
    },
    {
      id: "comment-bit-18",
      authorName: "chronicallyhere",
      authorAvatarSrc: commentAvatarRef("chronicallyhere"),
      content:
        "only chronically online people will understand why i screamed at this. touch grass tomorrow, today we laugh.",
      timeLabel: "38m ago",
      likeCountLabel: "9.5k",
      replies: [],
    },
    {
      id: "comment-bit-19",
      authorName: "sigmastoic",
      authorAvatarSrc: commentAvatarRef("sigmastoic"),
      content: "sigma move. take the L. accept the floor. become one with the spill.",
      timeLabel: "42m ago",
      likeCountLabel: "8.7k",
      replies: [],
    },
  ],
};

export type CommentContentPresetId =
  | "coffee-shop"
  | "kyoto-trip"
  | "hot-takes"
  | "comedy-chaos";

export type CommentContentPreset = {
  id: CommentContentPresetId;
  label: string;
  description: string;
  document: CommentContentDocument;
};

export const COMMENT_CONTENT_PRESETS: CommentContentPreset[] = [
  {
    id: "coffee-shop",
    label: "Coffee Shop",
    description: "NYC coffee crawl recs (default)",
    document: COFFEE_SHOP_COMMENT_CONTENT_DOCUMENT,
  },
  {
    id: "kyoto-trip",
    label: "Kyoto Trip",
    description: "Travel recs with audio voice note",
    document: KYOTO_TRIP_COMMENT_CONTENT_DOCUMENT,
  },
  {
    id: "hot-takes",
    label: "Hot Takes",
    description: "Short opinionated comments, no media",
    document: HOT_TAKES_COMMENT_CONTENT_DOCUMENT,
  },
  {
    id: "comedy-chaos",
    label: "Comedy Chaos",
    description: "Funny video — joke-stacking, emoji, voice note bits",
    document: COMEDY_CHAOS_COMMENT_CONTENT_DOCUMENT,
  },
];

export const DEFAULT_COMMENT_CONTENT_PRESET_ID: CommentContentPresetId = "coffee-shop";

export const DEFAULT_COMMENT_CONTENT_DOCUMENT: CommentContentDocument =
  COFFEE_SHOP_COMMENT_CONTENT_DOCUMENT;

let defaultCommentImageUrlById: Map<string, string> | null = null;

function getDefaultCommentImageUrl(commentId: string): string | null {
  if (!defaultCommentImageUrlById) {
    defaultCommentImageUrlById = new Map();
    const visit = (nodes: CommentContentNode[]) => {
      for (const node of nodes) {
        if (node.media?.type === "image") {
          defaultCommentImageUrlById!.set(node.id, node.media.url);
        }
        visit(node.replies);
      }
    };
    visit(DEFAULT_COMMENT_CONTENT_DOCUMENT.comments);
    for (const preset of COMMENT_CONTENT_PRESETS) {
      visit(preset.document.comments);
    }
  }
  return defaultCommentImageUrlById.get(commentId) ?? null;
}

export function getCommentContentPreset(presetId: string): CommentContentPreset | null {
  const normalized = presetId.trim().toLowerCase();
  return (
    COMMENT_CONTENT_PRESETS.find((preset) => preset.id.toLowerCase() === normalized) ?? null
  );
}

export function getCommentStickerSrc(stickerRef: CommentStickerReference) {
  const trimmedValue = stickerRef.trim();
  if (!trimmedValue) return COMMENT_STICKER_OPTIONS[0].src;
  if (isCommentLocalStickerReference(trimmedValue)) {
    return COMMENT_STICKER_URLS[trimmedValue as CommentStickerOptionId];
  }
  if (trimmedValue.startsWith("http") || trimmedValue.includes("/assets/figma/comment/")) {
    return migrateCommentImageUrl(trimmedValue, COMMENT_STICKER_OPTIONS[0].src);
  }
  return trimmedValue;
}

export function normalizeCommentContentDocument(
  value: Partial<CommentContentDocument> | null | undefined,
): CommentContentDocument | null {
  if (!value || value.version !== 1) return null;
  if (!value.composer) return null;
  const normalizedComposerAvatarSrc = normalizeCommentAvatarReference(value.composer.avatarSrc);
  if (!normalizedComposerAvatarSrc) return null;
  if (typeof value.composer.placeholder !== "string") return null;
  if (!Array.isArray(value.comments)) return null;

  const normalizedComments = normalizeCommentNodes(value.comments);
  if (!normalizedComments) return null;

  return {
    version: 1,
    composer: {
      avatarSrc: normalizedComposerAvatarSrc,
      placeholder: value.composer.placeholder,
    },
    comments: normalizedComments,
  };
}

function normalizeCommentNodes(values: unknown[]): CommentContentNode[] | null {
  const normalizedNodes: CommentContentNode[] = [];

  for (const value of values) {
    const normalizedNode = normalizeCommentNode(value);
    if (!normalizedNode) return null;
    normalizedNodes.push(normalizedNode);
  }

  return normalizedNodes;
}

function normalizeCommentNode(value: unknown): CommentContentNode | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string") return null;
  if (typeof value.authorName !== "string") return null;
  const normalizedAuthorAvatarSrc = normalizeCommentAvatarReference(value.authorAvatarSrc);
  if (!normalizedAuthorAvatarSrc) return null;

  const rawLabel = value.authorLabel;
  if (rawLabel !== undefined && rawLabel !== "Creator" && rawLabel !== "Following") {
    return null;
  }

  if (typeof value.content !== "string") return null;
  if (typeof value.timeLabel !== "string") return null;
  if (typeof value.likeCountLabel !== "string") return null;
  if (!Array.isArray(value.replies)) return null;

  const normalizedReplies = normalizeCommentNodes(value.replies);
  if (!normalizedReplies) return null;

  let normalizedMedia: CommentMediaSpec | undefined;
  if (value.media !== undefined) {
    normalizedMedia = normalizeCommentMediaSpec(value.media, value.id) ?? undefined;
    if (!normalizedMedia) return null;
  }
  if (value.viewRepliesLabel !== undefined && typeof value.viewRepliesLabel !== "string") {
    return null;
  }

  return {
    id: value.id,
    authorName: value.authorName,
    authorAvatarSrc: normalizedAuthorAvatarSrc,
    authorLabel: rawLabel,
    content: value.content,
    timeLabel: value.timeLabel,
    likeCountLabel: value.likeCountLabel,
    media: normalizedMedia,
    replies: normalizedReplies,
    viewRepliesLabel: value.viewRepliesLabel,
  };
}

function normalizeCommentMediaSpec(value: unknown, commentId?: string): CommentMediaSpec | null {
  if (!isRecord(value) || typeof value.visible !== "boolean" || typeof value.type !== "string") {
    return null;
  }

  if (value.type === "image") {
    if (
      typeof value.url !== "string" ||
      (value.display !== "auto" &&
        value.display !== "portrait" &&
        value.display !== "landscape" &&
        value.display !== "square")
    ) {
      return null;
    }
    const fallback =
      (typeof commentId === "string" ? getDefaultCommentImageUrl(commentId) : null) ??
      COMMENT_DEFAULT_EDITOR_IMAGE;
    return {
      type: "image",
      visible: value.visible,
      url: migrateCommentImageUrl(value.url, fallback),
      display: value.display,
    };
  }

  if (value.type === "sticker") {
    const normalizedStickerRef = normalizeCommentStickerReference(value.stickerRef ?? value.stickerId);
    if (!normalizedStickerRef) return null;
    return {
      type: "sticker",
      visible: value.visible,
      stickerRef: normalizedStickerRef,
    };
  }

  if (value.type === "audio") {
    if (typeof value.duration !== "string" || typeof value.text !== "string") return null;
    return {
      type: "audio",
      visible: value.visible,
      duration: value.duration,
      text: value.text,
    };
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null;
}

export function collectCommentDocumentPreloadUrls(document: CommentContentDocument) {
  const urls = new Set<string>([resolveCommentAvatarSrc(document.composer.avatarSrc, 40)]);

  const visitNode = (node: CommentContentNode) => {
    urls.add(resolveCommentAvatarSrc(node.authorAvatarSrc, 40));
    if (node.media?.type === "image" && node.media.visible && node.media.url) {
      urls.add(migrateCommentImageUrl(node.media.url, getDefaultCommentImageUrl(node.id) ?? COMMENT_DEFAULT_EDITOR_IMAGE));
    }
    if (node.media?.type === "sticker" && node.media.visible) {
      urls.add(getCommentStickerSrc(node.media.stickerRef));
    }
    node.replies.forEach(visitNode);
  };

  document.comments.forEach(visitNode);
  return [...urls];
}

export function getCommentAudioBarWidth(duration: string) {
  const totalSeconds = parseDurationSeconds(duration);
  if (totalSeconds == null) return 136;
  return clamp(108 + totalSeconds * 1.8, 120, 220);
}

export function createEmptyCommentNode(id: string): CommentContentNode {
  return {
    id,
    authorName: "new_user",
    authorAvatarSrc: String(avatarSlotFromId(id, COMMENT_LOCAL_AVATAR_SLOT_COUNT)),
    content: "New comment",
    timeLabel: "now",
    likeCountLabel: "0",
    replies: [],
  };
}

export function resolveCommentAvatarSrc(avatarRef: string, cssPx: number) {
  const trimmedValue = avatarRef.trim();
  if (!trimmedValue) return localAvatarUrlForDisplay(cssPx, 1);
  if (!isCommentLocalAvatarReference(trimmedValue)) return trimmedValue;
  return localAvatarUrlForDisplay(cssPx, Number.parseInt(trimmedValue, 10));
}

function normalizeCommentStickerReference(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function isCommentLocalStickerReference(value: string) {
  return COMMENT_STICKER_OPTIONS.some((option) => option.id === value);
}

export function isCommentLocalAvatarReference(value: string) {
  return /^\d+$/.test(value.trim());
}

function normalizeCommentAvatarReference(value: unknown) {
  if (typeof value === "string") {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }

  return null;
}

function parseDurationSeconds(duration: string) {
  const normalized = duration.trim();
  const match = /^(\d+):([0-5]\d)$/.exec(normalized);
  if (!match) return null;
  const minutes = Number.parseInt(match[1], 10);
  const seconds = Number.parseInt(match[2], 10);
  return minutes * 60 + seconds;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
