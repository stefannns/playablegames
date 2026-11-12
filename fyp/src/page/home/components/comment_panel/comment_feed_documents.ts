import { avatarSlotFromId } from "../../../../utils/local_avatar";
import { DEFAULT_COMMENT_CONTENT_DOCUMENT } from "./comment_content_config";
import type {
  CommentAuthorLabel,
  CommentContentDocument,
  CommentContentNode,
} from "./comment_content_config";
import {
  FEED_COMMENT_DISPLAY_COUNT,
  FEED_COMMENT_EXTRA_SAMPLE,
  feedCommentVolumeTier,
} from "./comment_feed_volume";

const COMPOSER_AVATAR = String(
  avatarSlotFromId("comment-composer", 60),
);

type ThreadInput = {
  id: string;
  authorName: string;
  authorSeed: string;
  content: string;
  timeLabel: string;
  likeCountLabel: string;
  authorLabel?: CommentAuthorLabel;
  viewRepliesLabel?: string;
  replies?: ThreadInput[];
};

function avatar(seed: string) {
  return String(avatarSlotFromId(seed, 60));
}

function thread(input: ThreadInput): CommentContentNode {
  return {
    id: input.id,
    authorName: input.authorName,
    authorAvatarSrc: avatar(input.authorSeed),
    authorLabel: input.authorLabel,
    content: input.content,
    timeLabel: input.timeLabel,
    likeCountLabel: input.likeCountLabel,
    viewRepliesLabel: input.viewRepliesLabel,
    replies: (input.replies ?? []).map(thread),
  };
}

function doc(threads: ThreadInput[]): CommentContentDocument {
  return {
    version: 1,
    composer: {
      avatarSrc: COMPOSER_AVATAR,
      placeholder: "Add comment...",
    },
    comments: threads.map(thread),
  };
}

const VIRAL_EXTRA_LIKE_LABELS = [
  "18.2k",
  "11.4k",
  "8.7k",
  "6.3k",
  "4.9k",
  "3.8k",
  "2.6k",
  "1.9k",
  "1.2k",
  "842",
] as const;

const POPULAR_EXTRA_LIKE_LABELS = [
  "5.4k",
  "3.1k",
  "2.2k",
  "1.4k",
  "986",
  "642",
  "418",
] as const;

function extraLikeLabel(tier: ReturnType<typeof feedCommentVolumeTier>, index: number) {
  const labels =
    tier === "viral"
      ? VIRAL_EXTRA_LIKE_LABELS
      : tier === "popular"
        ? POPULAR_EXTRA_LIKE_LABELS
        : (["284", "176", "94"] as const);
  return labels[index % labels.length];
}

function extraTimeLabel(baseMinutes: number, index: number) {
  const minutes = baseMinutes + index * 6 + 3;
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function appendFeedCommentSamples() {
  for (const [feedId, extras] of Object.entries(FEED_COMMENT_EXTRA_SAMPLE)) {
    const baseDocument = FEED_COMMENT_BY_ID[feedId];
    if (!baseDocument || extras.length === 0) continue;

    const displayCount = FEED_COMMENT_DISPLAY_COUNT[feedId] ?? 0;
    const tier = feedCommentVolumeTier(displayCount);
    const baseMinutes = Math.max(12, Math.min(180, Math.floor(displayCount / 40)));

    const generated = extras.map((extra, index) =>
      thread({
        id: `${feedId}-sample-${index}`,
        authorName: extra.authorName,
        authorSeed: `${feedId}-${extra.authorName}`,
        content: extra.content,
        timeLabel: extraTimeLabel(baseMinutes, index),
        likeCountLabel: extraLikeLabel(tier, index),
      }),
    );

    FEED_COMMENT_BY_ID[feedId] = {
      ...baseDocument,
      comments: [...baseDocument.comments, ...generated],
    };
  }
}

/** Empty document for feeds without a curated thread (e.g. photo posts). */
export const EMPTY_FEED_COMMENT_DOCUMENT: CommentContentDocument = {
  version: 1,
  composer: {
    avatarSrc: COMPOSER_AVATAR,
    placeholder: "Add comment...",
  },
  comments: [],
};

const FEED_COMMENT_BY_ID: Record<string, CommentContentDocument> = {
  "feed-1": {
    ...DEFAULT_COMMENT_CONTENT_DOCUMENT,
    comments: [...DEFAULT_COMMENT_CONTENT_DOCUMENT.comments],
  },

  "feed-2": doc([
    {
      id: "feed-2-c1",
      authorName: "depthcheckdaily",
      authorSeed: "depthcheckdaily",
      content:
        "That visibility at the end?? I thought my screen brightness was broken for a second.",
      timeLabel: "9m ago",
      likeCountLabel: "12.4k",
    },
    {
      id: "feed-2-c2",
      authorName: "nitroxnotes",
      authorSeed: "nitroxnotes",
      content: "Where is this reef — Bali or Philippines? Need the dive site name pls",
      timeLabel: "14m ago",
      likeCountLabel: "3.1k",
      viewRepliesLabel: "View 2 replies",
      replies: [
        {
          id: "feed-2-c2-r1",
          authorName: "Reef Depths",
          authorSeed: "reef-depths",
          authorLabel: "Creator",
          content: "Filmed off Nusa Penida — Manta Point side if you know you know",
          timeLabel: "11m ago",
          likeCountLabel: "891",
        },
      ],
    },
    {
      id: "feed-2-c3",
      authorName: "scuba_sarah",
      authorSeed: "scuba_sarah",
      content: "The way the light hits the coral wall is insane. Saving for my cert trip.",
      timeLabel: "22m ago",
      likeCountLabel: "5.8k",
    },
    {
      id: "feed-2-c4",
      authorName: "notafish",
      authorSeed: "notafish",
      content: "Me watching this from my couch pretending I am not terrified of open water",
      timeLabel: "31m ago",
      likeCountLabel: "2.4k",
    },
    {
      id: "feed-2-c5",
      authorName: "bubble_ring_queen",
      authorSeed: "bubble_ring_queen",
      content: "Your buoyancy control is so clean — no silt cloud at all",
      timeLabel: "38m ago",
      likeCountLabel: "1.7k",
    },
    {
      id: "feed-2-c6",
      authorName: "wetsuit_wednesday",
      authorSeed: "wetsuit_wednesday",
      content: "Adding this to my dive log inspo folder immediately",
      timeLabel: "45m ago",
      likeCountLabel: "1.1k",
    },
    {
      id: "feed-2-c7",
      authorName: "reef_rescue",
      authorSeed: "reef_rescue",
      content: "The fish school at 0:11 — what species are those?",
      timeLabel: "52m ago",
      likeCountLabel: "892",
      replies: [
        {
          id: "feed-2-c7-r1",
          authorName: "Reef Depths",
          authorSeed: "reef-depths",
          authorLabel: "Creator",
          content: "Bumphead parrotfish parade — they show up around dawn",
          timeLabel: "49m ago",
          likeCountLabel: "412",
        },
      ],
    },
  ]),

  "feed-3": doc([
    {
      id: "feed-3-c1",
      authorName: "skates_in_silence",
      authorSeed: "skates_in_silence",
      content: "You can literally see the cracks under the ice I am NOT brave enough",
      timeLabel: "6m ago",
      likeCountLabel: "18.2k",
    },
    {
      id: "feed-3-c2",
      authorName: "lakeeffectkid",
      authorSeed: "lakeeffectkid",
      content: "This is giving pure glass rink energy. What lake is this?",
      timeLabel: "11m ago",
      likeCountLabel: "4.6k",
      replies: [
        {
          id: "feed-3-c2-r1",
          authorName: "Frost Lines",
          authorSeed: "frost-lines",
          authorLabel: "Creator",
          content: "Frozen bay in northern Michigan — only go when locals say it is safe",
          timeLabel: "8m ago",
          likeCountLabel: "1.2k",
        },
      ],
    },
    {
      id: "feed-3-c3",
      authorName: "winterarc_01",
      authorSeed: "winterarc_01",
      content: "The sound when blades hit clear ice >>> any ASMR playlist",
      timeLabel: "19m ago",
      likeCountLabel: "7.3k",
    },
    {
      id: "feed-3-c4",
      authorName: "cautiontapefan",
      authorSeed: "cautiontapefan",
      content: "Ok but who checked the thickness first be honest",
      timeLabel: "24m ago",
      likeCountLabel: "9.8k",
    },
    {
      id: "feed-3-c5",
      authorName: "golden_hour_glide",
      authorSeed: "golden_hour_glide",
      content: "That sunset reflection on the ice made me stop scrolling mid-swipe",
      timeLabel: "41m ago",
      likeCountLabel: "2.1k",
    },
    {
      id: "feed-3-c6",
      authorName: "blade_sharpeners",
      authorSeed: "blade_sharpeners",
      content: "The way your edges carve without chattering — ice quality is elite",
      timeLabel: "48m ago",
      likeCountLabel: "3.4k",
    },
    {
      id: "feed-3-c7",
      authorName: "midwest_memories",
      authorSeed: "midwest_memories",
      content: "This is the video I send people who say winter has no magic",
      timeLabel: "55m ago",
      likeCountLabel: "5.6k",
    },
    {
      id: "feed-3-c8",
      authorName: "frozen_lake_faq",
      authorSeed: "frozen_lake_faq",
      content: "Ok but thickness check thread when — safety first gang",
      timeLabel: "1h ago",
      likeCountLabel: "8.2k",
      replies: [
        {
          id: "feed-3-c8-r1",
          authorName: "Frost Lines",
          authorSeed: "frost-lines",
          authorLabel: "Creator",
          content: "Local fire dept posts daily readings — never skate without that",
          timeLabel: "58m ago",
          likeCountLabel: "2.3k",
        },
        {
          id: "feed-3-c8-r2",
          authorName: "ice_rescue_vol",
          authorSeed: "ice_rescue_vol",
          content: "This comment section asking the right questions respect",
          timeLabel: "56m ago",
          likeCountLabel: "1.1k",
        },
      ],
    },
  ]),

  "feed-4": doc([
    {
      id: "feed-4-c1",
      authorName: "goldenhourpups",
      authorSeed: "goldenhourpups",
      content: "THE TINY RUN AT 0:03 I REPLAYED IT FOUR TIMES",
      timeLabel: "4m ago",
      likeCountLabel: "24.6k",
    },
    {
      id: "feed-4-c2",
      authorName: "dogmom_energy",
      authorSeed: "dogmom_energy",
      content: "What breed is this angel?? Need to know for research purposes",
      timeLabel: "8m ago",
      likeCountLabel: "6.2k",
      replies: [
        {
          id: "feed-4-c2-r1",
          authorName: "Paws & Chaos",
          authorSeed: "paws-chaos",
          authorLabel: "Creator",
          content: "Golden retriever puppy — 14 weeks of pure chaos",
          timeLabel: "6m ago",
          likeCountLabel: "3.4k",
        },
      ],
    },
    {
      id: "feed-4-c3",
      authorName: "fetchfailed",
      authorSeed: "fetchfailed",
      content: "Bro gave up on the stick and chose vibes instead. Relatable.",
      timeLabel: "15m ago",
      likeCountLabel: "11.1k",
    },
    {
      id: "feed-4-c4",
      authorName: "vet_tok_dr",
      authorSeed: "vet_tok_dr",
      content: "Healthy happy pup energy — love the yard enrichment setup",
      timeLabel: "27m ago",
      likeCountLabel: "1.9k",
    },
    {
      id: "feed-4-c5",
      authorName: "sneakypaws",
      authorSeed: "sneakypaws",
      content: "@miles this is exactly what your future dog would do",
      timeLabel: "33m ago",
      likeCountLabel: "842",
    },
    {
      id: "feed-4-c6",
      authorName: "tail_wag_analytics",
      authorSeed: "tail_wag_analytics",
      content: "Scientifically the happiest video on the app today",
      timeLabel: "36m ago",
      likeCountLabel: "18.3k",
    },
    {
      id: "feed-4-c7",
      authorName: "golden_hour_puppy",
      authorSeed: "golden_hour_puppy",
      content: "The ear flop at 0:07 destroyed me",
      timeLabel: "40m ago",
      likeCountLabel: "9.7k",
    },
    {
      id: "feed-4-c8",
      authorName: "yard_zoomies",
      authorSeed: "yard_zoomies",
      content: "Name suggestions: Butter, Nugget, or Attorney General",
      timeLabel: "44m ago",
      likeCountLabel: "7.2k",
      replies: [
        {
          id: "feed-4-c8-r1",
          authorName: "Paws & Chaos",
          authorSeed: "paws-chaos",
          authorLabel: "Creator",
          content: "His name is Biscuit and he absolutely would hold office",
          timeLabel: "42m ago",
          likeCountLabel: "4.8k",
        },
      ],
    },
    {
      id: "feed-4-c9",
      authorName: "rescue_routes",
      authorSeed: "rescue_routes",
      content: "Adopt don't shop but also this puppy is illegally cute",
      timeLabel: "51m ago",
      likeCountLabel: "3.1k",
    },
    {
      id: "feed-4-c10",
      authorName: "dogdad_dave",
      authorSeed: "dogdad_dave",
      content: "Showed my wife — we are now discussing a third dog",
      timeLabel: "58m ago",
      likeCountLabel: "2.4k",
    },
    {
      id: "feed-4-c11",
      authorName: "stick_retrieval",
      authorSeed: "stick_retrieval",
      content: "The stick negotiation at 0:04 is peak golden retriever diplomacy",
      timeLabel: "1h ago",
      likeCountLabel: "5.5k",
    },
    {
      id: "feed-4-c12",
      authorName: "puppy_first_steps",
      authorSeed: "puppy_first_steps",
      content: "Why is the run so floppy I cannot breathe",
      timeLabel: "1h ago",
      likeCountLabel: "4.2k",
    },
    {
      id: "feed-4-c13",
      authorName: "grass_stain_club",
      authorSeed: "grass_stain_club",
      content: "That yard is a premium enrichment zone — tail wag speed proof",
      timeLabel: "1h ago",
      likeCountLabel: "1.9k",
    },
    {
      id: "feed-4-c14",
      authorName: "dogpark_regular",
      authorSeed: "dogpark_regular",
      content: "@sarah we need to show Biscuit this immediately",
      timeLabel: "1h ago",
      likeCountLabel: "967",
    },
    {
      id: "feed-4-c15",
      authorName: "happiness_archives",
      authorSeed: "happiness_archives",
      content: "Saving for a bad day — instant serotonin",
      timeLabel: "1h ago",
      likeCountLabel: "3.3k",
    },
  ]),

  "feed-5": doc([
    {
      id: "feed-5-c1",
      authorName: "tabbyterror",
      authorSeed: "tabbyterror",
      content: "The slow push of the mug off the table… textbook orange cat behavior",
      timeLabel: "3m ago",
      likeCountLabel: "31.2k",
    },
    {
      id: "feed-5-c2",
      authorName: "cattaxaccountant",
      authorSeed: "cattaxaccountant",
      content: "Eye contact while doing the crime is elite villain work",
      timeLabel: "7m ago",
      likeCountLabel: "14.8k",
    },
    {
      id: "feed-5-c3",
      authorName: "litterboxlegend",
      authorSeed: "litterboxlegend",
      content: "Mine does this then acts like nothing happened. Species trait.",
      timeLabel: "12m ago",
      likeCountLabel: "5.6k",
    },
    {
      id: "feed-5-c4",
      authorName: "Whisker FM",
      authorSeed: "whisker-fm",
      authorLabel: "Creator",
      content: "He looked straight at the camera mid-push I cannot make this up",
      timeLabel: "10m ago",
      likeCountLabel: "8.9k",
    },
    {
      id: "feed-5-c5",
      authorName: "purrfectly_unbothered",
      authorSeed: "purrfectly_unbothered",
      content: "Sound on for the little meow at the end — worth it",
      timeLabel: "21m ago",
      likeCountLabel: "2.7k",
    },
    {
      id: "feed-5-c6",
      authorName: "orange_cat_justice",
      authorSeed: "orange_cat_justice",
      content: "One brain cell and it is dedicated to crime",
      timeLabel: "25m ago",
      likeCountLabel: "22.4k",
    },
    {
      id: "feed-5-c7",
      authorName: "mug_survivor",
      authorSeed: "mug_survivor",
      content: "RIP mug you served well",
      timeLabel: "29m ago",
      likeCountLabel: "6.8k",
    },
    {
      id: "feed-5-c8",
      authorName: "chaos_gremlin",
      authorSeed: "chaos_gremlin",
      content: "The pause before the push is comedic timing gold",
      timeLabel: "34m ago",
      likeCountLabel: "11.2k",
    },
    {
      id: "feed-5-c9",
      authorName: "vet_student_sam",
      authorSeed: "vet_student_sam",
      content: "Healthy mischief — love an enriched shelf for testing gravity",
      timeLabel: "41m ago",
      likeCountLabel: "1.4k",
    },
    {
      id: "feed-5-c10",
      authorName: "shelf_safety_officer",
      authorSeed: "shelf_safety_officer",
      content: "That shelf never stood a chance and neither did we",
      timeLabel: "47m ago",
      likeCountLabel: "8.4k",
    },
    {
      id: "feed-5-c11",
      authorName: "tabby_trial_lawyer",
      authorSeed: "tabby_trial_lawyer",
      content: "Not guilty your honor — gravity is the real culprit",
      timeLabel: "53m ago",
      likeCountLabel: "5.9k",
    },
    {
      id: "feed-5-c12",
      authorName: "knick_knack_survivor",
      authorSeed: "knick_knack_survivor",
      content: "My cat watched this and knocked my pen off the desk in solidarity",
      timeLabel: "59m ago",
      likeCountLabel: "2.6k",
    },
  ]),

  "feed-6": doc([
    {
      id: "feed-6-c1",
      authorName: "apex_onboard",
      authorSeed: "apex_onboard",
      content: "That last corner defense was FILTHY. P1 deserved.",
      timeLabel: "5m ago",
      likeCountLabel: "9.4k",
    },
    {
      id: "feed-6-c2",
      authorName: "telemetry_tom",
      authorSeed: "telemetry_tom",
      content: "Gap at the line had to be less than a tenth — anyone have the timing?",
      timeLabel: "9m ago",
      likeCountLabel: "3.8k",
    },
    {
      id: "feed-6-c3",
      authorName: "grandstand_greg",
      authorSeed: "grandstand_greg",
      content: "Crowd noise spike when they went side by side gave me chills",
      timeLabel: "16m ago",
      likeCountLabel: "6.1k",
    },
    {
      id: "feed-6-c4",
      authorName: "Pole Position",
      authorSeed: "pole-position",
      authorLabel: "Creator",
      content: "Still shaking — that move into turn 3 is what won it",
      timeLabel: "13m ago",
      likeCountLabel: "4.2k",
    },
    {
      id: "feed-6-c5",
      authorName: "undercutclub",
      authorSeed: "undercutclub",
      content: "POV you held your breath for the entire final lap",
      timeLabel: "28m ago",
      likeCountLabel: "2.3k",
    },
    {
      id: "feed-6-c6",
      authorName: "drs_fan_club",
      authorSeed: "drs_fan_club",
      content: "Replayed the overtake frame by frame — textbook late brake",
      timeLabel: "35m ago",
      likeCountLabel: "4.7k",
    },
    {
      id: "feed-6-c7",
      authorName: "pit_wall_pat",
      authorSeed: "pit_wall_pat",
      content: "My pick was wrong and I am not even mad — that battle was fair",
      timeLabel: "42m ago",
      likeCountLabel: "2.9k",
    },
    {
      id: "feed-6-c8",
      authorName: "onboard_angles",
      authorSeed: "onboard_angles",
      content: "Need the onboard from P2 — that defensive line was crazy",
      timeLabel: "49m ago",
      likeCountLabel: "1.8k",
    },
  ]),

  "feed-7": doc([
    {
      id: "feed-7-c1",
      authorName: "offseasontraveler",
      authorSeed: "offseasontraveler",
      content: "Winter beach towns hit different — no crowds, just waves and coffee shops",
      timeLabel: "11m ago",
      likeCountLabel: "7.2k",
    },
    {
      id: "feed-7-c2",
      authorName: "quietcoast",
      authorSeed: "quietcoast",
      content: "Which town is this? The pier at 0:07 looks familiar",
      timeLabel: "18m ago",
      likeCountLabel: "2.9k",
      replies: [
        {
          id: "feed-7-c2-r1",
          authorName: "Ava Trips",
          authorSeed: "ava-trips",
          authorLabel: "Creator",
          content: "Small coastal town in Oregon — DM me if you want the exact spot",
          timeLabel: "15m ago",
          likeCountLabel: "641",
        },
      ],
    },
    {
      id: "feed-7-c3",
      authorName: "packlight_go",
      authorSeed: "packlight_go",
      content: "Adding this to my save folder for a solo trip",
      timeLabel: "26m ago",
      likeCountLabel: "1.4k",
    },
    {
      id: "feed-7-c4",
      authorName: "grey_sky_chaser",
      authorSeed: "grey_sky_chaser",
      content: "The muted color palette is so calming — feels like a film still",
      timeLabel: "34m ago",
      likeCountLabel: "3.1k",
    },
    {
      id: "feed-7-c5",
      authorName: "solo_travel_sue",
      authorSeed: "solo_travel_sue",
      content: "Offseason coastal walks >>> peak season chaos every time",
      timeLabel: "41m ago",
      likeCountLabel: "1.2k",
    },
  ]),

  "feed-8": doc([
    {
      id: "feed-8-c1",
      authorName: "frontend_fiona",
      authorSeed: "frontend_fiona",
      content: "Wait the scroll jank fix is literally one line?? Trying this tonight",
      timeLabel: "8m ago",
      likeCountLabel: "5.5k",
    },
    {
      id: "feed-8-c2",
      authorName: "reactref_guy",
      authorSeed: "reactref_guy",
      content: "Ok but why does every demo look smooth until I paste it into my codebase",
      timeLabel: "14m ago",
      likeCountLabel: "8.7k",
    },
  ]),

  "feed-9": doc([
    {
      id: "feed-9-c1",
      authorName: "deskjob_diana",
      authorSeed: "deskjob_diana",
      content: "Did this between meetings — shoulders are ON FIRE in the best way",
      timeLabel: "7m ago",
      likeCountLabel: "6.8k",
    },
    {
      id: "feed-9-c2",
      authorName: "no_gym_no_prob",
      authorSeed: "no_gym_no_prob",
      content: "Finally a shoulder routine that does not need dumbbells",
      timeLabel: "13m ago",
      likeCountLabel: "4.1k",
    },
    {
      id: "feed-9-c3",
      authorName: "Lina Fit",
      authorSeed: "lina-fit",
      authorLabel: "Creator",
      content: "Repeat 2x if you want — keep elbows soft on the raises",
      timeLabel: "10m ago",
      likeCountLabel: "1.5k",
    },
    {
      id: "feed-9-c4",
      authorName: "posture_patrol",
      authorSeed: "posture_patrol",
      content: "My neck tension after WFH week — this actually helped",
      timeLabel: "22m ago",
      likeCountLabel: "2.9k",
    },
    {
      id: "feed-9-c5",
      authorName: "lunch_break_lifts",
      authorSeed: "lunch_break_lifts",
      content: "Perfect length for a lunch break — shoulders burning thank you",
      timeLabel: "28m ago",
      likeCountLabel: "1.6k",
    },
    {
      id: "feed-9-c6",
      authorName: "wfh_stretch",
      authorSeed: "wfh_stretch",
      content: "Bookmarking for every Monday morning",
      timeLabel: "35m ago",
      likeCountLabel: "984",
    },
  ]),

  "feed-10": doc([
    {
      id: "feed-10-c1",
      authorName: "exam_season",
      authorSeed: "exam_season",
      content: "Explaining it out loud in an empty room hits different — saving for finals week",
      timeLabel: "10m ago",
      likeCountLabel: "3.4k",
    },
    {
      id: "feed-10-c2",
      authorName: "library_ghost",
      authorSeed: "library_ghost",
      content: "That window light + empty desks = main character study arc",
      timeLabel: "14m ago",
      likeCountLabel: "2.1k",
    },
    {
      id: "feed-10-c3",
      authorName: "Leo Study",
      authorSeed: "leo-study",
      authorLabel: "Creator",
      content: "I read notes aloud like I am teaching the empty row behind me — weird but it sticks.",
      timeLabel: "8m ago",
      likeCountLabel: "1.1k",
    },
  ]),

  "feed-11": doc([
    {
      id: "feed-11-c1",
      authorName: "capsule_closet",
      authorSeed: "capsule_closet",
      content: "Outfit 2 with the sneakers is the winner do not @ me",
      timeLabel: "6m ago",
      likeCountLabel: "11.3k",
    },
    {
      id: "feed-11-c2",
      authorName: "blazer_benefits",
      authorSeed: "blazer_benefits",
      content: "One blazer three vibes — this is why I tell people to invest in fit",
      timeLabel: "12m ago",
      likeCountLabel: "5.7k",
    },
    {
      id: "feed-11-c3",
      authorName: "Zoe Stylebook",
      authorSeed: "zoe-stylebook",
      authorLabel: "Creator",
      content: "Outfit 3 for dinner — outfit 1 for office. Same blazer all week.",
      timeLabel: "9m ago",
      likeCountLabel: "3.2k",
    },
    {
      id: "feed-11-c4",
      authorName: "thrift_queen_z",
      authorSeed: "thrift_queen_z",
      content: "Need the belt from look 1 where is it from",
      timeLabel: "21m ago",
      likeCountLabel: "1.9k",
    },
    {
      id: "feed-11-c5",
      authorName: "office_to_ootd",
      authorSeed: "office_to_ootd",
      content: "Outfit 1 for work tomorrow — blazer styling finally makes sense",
      timeLabel: "26m ago",
      likeCountLabel: "4.2k",
    },
    {
      id: "feed-11-c6",
      authorName: "vote_look_3",
      authorSeed: "vote_look_3",
      content: "Look 3 gang where are you — date night energy is unmatched",
      timeLabel: "31m ago",
      likeCountLabel: "6.7k",
    },
    {
      id: "feed-11-c7",
      authorName: "minimal_closet",
      authorSeed: "minimal_closet",
      content: "One blazer three fits is the whole capsule wardrobe thesis",
      timeLabel: "38m ago",
      likeCountLabel: "3.8k",
    },
    {
      id: "feed-11-c8",
      authorName: "tailor_tips",
      authorSeed: "tailor_tips",
      content: "Shoulder fit on that blazer is doing all the heavy lifting",
      timeLabel: "44m ago",
      likeCountLabel: "2.1k",
    },
  ]),

  "feed-12": doc([
    {
      id: "feed-12-c1",
      authorName: "platform_hopper",
      authorSeed: "platform_hopper",
      content: "The train announcement sample layered with the kick — chef kiss",
      timeLabel: "9m ago",
      likeCountLabel: "4.8k",
    },
    {
      id: "feed-12-c2",
      authorName: "headphone_haven",
      authorSeed: "headphone_haven",
      content: "Who else rewound the drop three times with AirPods in",
      timeLabel: "15m ago",
      likeCountLabel: "6.4k",
    },
    {
      id: "feed-12-c3",
      authorName: "Ryan Beats",
      authorSeed: "ryan-beats",
      authorLabel: "Creator",
      content: "Field recorded at Tokyo Station — full beat breakdown on YT",
      timeLabel: "12m ago",
      likeCountLabel: "2.1k",
    },
  ]),

  "feed-13": doc([
    {
      id: "feed-13-c1",
      authorName: "slump_breaker",
      authorSeed: "slump_breaker",
      content: "Book 2 on your list fixed my reading drought — ordering tonight",
      timeLabel: "14m ago",
      likeCountLabel: "3.6k",
    },
    {
      id: "feed-13-c2",
      authorName: "library_lurker",
      authorSeed: "library_lurker",
      content: "The way you ranked them without spoilers >>> responsible booktok",
      timeLabel: "20m ago",
      likeCountLabel: "2.2k",
    },
  ]),

  "feed-14": doc([
    {
      id: "feed-14-c1",
      authorName: "windowlight_witch",
      authorSeed: "windowlight_witch",
      content: "4:27pm light is undefeated — the catch in the eyes is perfect",
      timeLabel: "8m ago",
      likeCountLabel: "5.1k",
    },
    {
      id: "feed-14-c2",
      authorName: "portrait_practice",
      authorSeed: "portrait_practice",
      content: "What settings?? The skin tone retention is so natural",
      timeLabel: "13m ago",
      likeCountLabel: "2.8k",
    },
  ]),

  "feed-15": doc([
    {
      id: "feed-15-c1",
      authorName: "black_sheep_club",
      authorSeed: "black_sheep_club",
      content: "The one dark wool sheep in front >>> whole video",
      timeLabel: "7m ago",
      likeCountLabel: "4.3k",
    },
    {
      id: "feed-15-c2",
      authorName: "pasture_asmr",
      authorSeed: "pasture_asmr",
      content: "Sound on — grass + distant bells is instant calm",
      timeLabel: "12m ago",
      likeCountLabel: "2.6k",
    },
    {
      id: "feed-15-c3",
      authorName: "Felix Fields",
      authorSeed: "felix-fields",
      authorLabel: "Creator",
      content: "Caught them right before the clouds rolled over the ridge behind.",
      timeLabel: "9m ago",
      likeCountLabel: "1.8k",
    },
  ]),

  "feed-16": doc([
    {
      id: "feed-16-c1",
      authorName: "cinnamon_council",
      authorSeed: "cinnamon_council",
      content: "Those layers are standing AT attention — recipe drop when",
      timeLabel: "5m ago",
      likeCountLabel: "9.7k",
    },
    {
      id: "feed-16-c2",
      authorName: "proofing_pro",
      authorSeed: "proofing_pro",
      content: "The pull-apart shot made me hungry at 11pm unacceptable",
      timeLabel: "11m ago",
      likeCountLabel: "6.3k",
    },
    {
      id: "feed-16-c3",
      authorName: "Max Bakes",
      authorSeed: "max-bakes",
      authorLabel: "Creator",
      content: "Overnight proof + cold butter layers — recipe link in bio tomorrow",
      timeLabel: "8m ago",
      likeCountLabel: "3.5k",
    },
    {
      id: "feed-16-c4",
      authorName: "kitchen_scale_kate",
      authorSeed: "kitchen_scale_kate",
      content: "Small batch gang rise up — this is the perfect two-person tray",
      timeLabel: "19m ago",
      likeCountLabel: "1.2k",
    },
    {
      id: "feed-16-c5",
      authorName: "sunday_bake_club",
      authorSeed: "sunday_bake_club",
      content: "The swirl on top is bakery-level — no cap",
      timeLabel: "24m ago",
      likeCountLabel: "4.1k",
    },
    {
      id: "feed-16-c6",
      authorName: "butter_block_ben",
      authorSeed: "butter_block_ben",
      content: "Cold butter lamination gang — this is the way",
      timeLabel: "31m ago",
      likeCountLabel: "2.8k",
    },
  ]),

  "feed-17": doc([
    {
      id: "feed-17-c1",
      authorName: "kickflip_committee",
      authorSeed: "kickflip_committee",
      content: "TWO HOURS and you landed it clean — the roll away says everything",
      timeLabel: "6m ago",
      likeCountLabel: "8.4k",
    },
    {
      id: "feed-17-c2",
      authorName: "bail_clips_inc",
      authorSeed: "bail_clips_inc",
      content: "Please tell me the bloopers exist. The triumph hits harder with the fails.",
      timeLabel: "12m ago",
      likeCountLabel: "5.1k",
    },
    {
      id: "feed-17-c3",
      authorName: "Jules Skate",
      authorSeed: "jules-skate",
      authorLabel: "Creator",
      content: "Blooper reel coming — my shins are still recovering",
      timeLabel: "9m ago",
      likeCountLabel: "2.7k",
    },
    {
      id: "feed-17-c4",
      authorName: "flatground_forever",
      authorSeed: "flatground_forever",
      content: "That sound when wheels land back on grip tape >>>",
      timeLabel: "24m ago",
      likeCountLabel: "1.6k",
    },
  ]),

  "feed-18": doc([
    {
      id: "feed-18-c1",
      authorName: "collie_country",
      authorSeed: "collie_country",
      content: "Merle in wheat fields should be illegal levels of cute",
      timeLabel: "10m ago",
      likeCountLabel: "4.9k",
    },
    {
      id: "feed-18-c2",
      authorName: "off_leash_oak",
      authorSeed: "off_leash_oak",
      content: "The tongue out + green rows = pure countryside serotonin",
      timeLabel: "16m ago",
      likeCountLabel: "2.3k",
    },
    {
      id: "feed-18-c3",
      authorName: "Emma Fields",
      authorSeed: "emma-fields",
      authorLabel: "Creator",
      content: "Same field every Sunday before harvest — he knows the path by heart now.",
      timeLabel: "13m ago",
      likeCountLabel: "1.1k",
    },
    {
      id: "feed-18-c4",
      authorName: "rural_dog_mom",
      authorSeed: "rural_dog_mom",
      content: "City dogs could never — need this walk for my mental health",
      timeLabel: "29m ago",
      likeCountLabel: "3.8k",
    },
  ]),

  "feed-19": doc([
    {
      id: "feed-19-c1",
      authorName: "trail_at_dawn",
      authorSeed: "trail_at_dawn",
      content: "Fog rolling in right before sunrise is the whole reason I wake up early",
      timeLabel: "8m ago",
      likeCountLabel: "12.6k",
    },
    {
      id: "feed-19-c2",
      authorName: "peak_baggers",
      authorSeed: "peak_baggers",
      content: "Which trail is this? Need elevation and distance for my list",
      timeLabel: "14m ago",
      likeCountLabel: "3.4k",
      replies: [
        {
          id: "feed-19-c2-r1",
          authorName: "Kai Hikes",
          authorSeed: "kai-hikes",
          authorLabel: "Creator",
          content: "Alpine ridge loop — 8mi, started at 4:30am for the fog window",
          timeLabel: "11m ago",
          likeCountLabel: "982",
        },
      ],
    },
    {
      id: "feed-19-c3",
      authorName: "leave_no_trace",
      authorSeed: "leave_no_trace",
      content: "Views like this remind me to pack out everything. Stunning shot.",
      timeLabel: "22m ago",
      likeCountLabel: "2.1k",
    },
    {
      id: "feed-19-c4",
      authorName: "cloud_sea_chaser",
      authorSeed: "cloud_sea_chaser",
      content: "The silence in this clip — you can feel the cold air",
      timeLabel: "35m ago",
      likeCountLabel: "1.7k",
    },
    {
      id: "feed-19-c5",
      authorName: "ridge_runner",
      authorSeed: "ridge_runner",
      content: "4am alarm paid off — cloud sea views are unreal",
      timeLabel: "42m ago",
      likeCountLabel: "5.4k",
    },
    {
      id: "feed-19-c6",
      authorName: "sunrise_chaser_99",
      authorSeed: "sunrise_chaser_99",
      content: "This is why hikers become morning people against their will",
      timeLabel: "48m ago",
      likeCountLabel: "3.9k",
    },
    {
      id: "feed-19-c7",
      authorName: "pack_weight_police",
      authorSeed: "pack_weight_police",
      content: "What did you pack for a fog-window hike like this?",
      timeLabel: "55m ago",
      likeCountLabel: "1.3k",
      replies: [
        {
          id: "feed-19-c7-r1",
          authorName: "Kai Hikes",
          authorSeed: "kai-hikes",
          authorLabel: "Creator",
          content: "Layers, headlamp, hot thermos — fog came in fast at the ridge",
          timeLabel: "52m ago",
          likeCountLabel: "876",
        },
      ],
    },
  ]),

  "feed-20": doc([
    {
      id: "feed-20-c1",
      authorName: "grwm_reviewer",
      authorSeed: "grwm_reviewer",
      content: "Soft glam in 12 min and no filter — the skin still looks like skin",
      timeLabel: "4m ago",
      likeCountLabel: "15.2k",
    },
    {
      id: "feed-20-c2",
      authorName: "blend_buff",
      authorSeed: "blend_buff",
      content: "The cream blush placement at 0:22 changed my whole routine",
      timeLabel: "9m ago",
      likeCountLabel: "7.8k",
    },
    {
      id: "feed-20-c3",
      authorName: "Ruby Makeup",
      authorSeed: "ruby-makeup",
      authorLabel: "Creator",
      content: "Same products linked — key is thin layers and stop before full coverage",
      timeLabel: "6m ago",
      likeCountLabel: "4.5k",
    },
    {
      id: "feed-20-c4",
      authorName: "no_filter_nina",
      authorSeed: "no_filter_nina",
      content: "Finally a GRWM that does not look plastic on camera",
      timeLabel: "18m ago",
      likeCountLabel: "3.2k",
    },
    {
      id: "feed-20-c5",
      authorName: "lip_combo_lab",
      authorSeed: "lip_combo_lab",
      content: "Need the lip combo name — that rosy nude is perfect",
      timeLabel: "27m ago",
      likeCountLabel: "2.4k",
    },
    {
      id: "feed-20-c6",
      authorName: "skin_texture_fan",
      authorSeed: "skin_texture_fan",
      content: "You can still see pores — finally a glam tutorial for real skin",
      timeLabel: "33m ago",
      likeCountLabel: "6.1k",
    },
    {
      id: "feed-20-c7",
      authorName: "commute_grwm",
      authorSeed: "commute_grwm",
      content: "12 minutes is not a lie — timed it during my morning routine",
      timeLabel: "39m ago",
      likeCountLabel: "3.7k",
    },
    {
      id: "feed-20-c8",
      authorName: "blush_placement",
      authorSeed: "blush_placement",
      content: "The cream blush tip at 0:22 fixed my round-face routine",
      timeLabel: "46m ago",
      likeCountLabel: "2.9k",
    },
  ]),
};

appendFeedCommentSamples();

export function countCommentNodes(nodes: CommentContentNode[]): number {
  return nodes.reduce(
    (total, node) => total + 1 + countCommentNodes(node.replies),
    0,
  );
}

export function getCommentDocumentForFeed(
  feedId: string,
): CommentContentDocument | null {
  return FEED_COMMENT_BY_ID[feedId] ?? null;
}

export function hasFeedCommentDocument(feedId: string): boolean {
  return feedId in FEED_COMMENT_BY_ID;
}

/** Public total for rail + panel header; curated list in panel is a sample only. */
export function resolveFeedCommentCount(feedId: string): number {
  if (feedId in FEED_COMMENT_DISPLAY_COUNT) {
    return FEED_COMMENT_DISPLAY_COUNT[feedId];
  }
  const document = getCommentDocumentForFeed(feedId);
  if (document) {
    return countCommentNodes(document.comments);
  }
  return 0;
}

export type FeedEngagementMetrics = {
  likeCount: number;
  favoriteCount: number;
  shareCount: number;
};

const FAVORITE_SHARE_CAP = 500_000;

function zeroCommentEngagement(feedId?: string): FeedEngagementMetrics {
  const seed = avatarSlotFromId(feedId ?? "feed-zero", 97);
  const likeCount = 3 + (seed % 90);
  const favoriteCount = Math.max(1, Math.round(likeCount * 0.35));
  const shareCount = Math.max(1, Math.round(likeCount * 0.22));
  return { likeCount, favoriteCount, shareCount };
}

/**
 * Map public comment totals → rail engagement tiers:
 * - 0: single / double digits
 * - 1–99: tens
 * - 100–999: thousands of likes, hundreds of fav / share
 * - 1k–1.9k: tens of thousands of likes, hundreds of fav / share
 * - 2k+: 1M+ likes, fav / share capped at 500k
 */
export function resolveFeedEngagementMetrics(
  commentCount: number,
  feedId?: string,
): FeedEngagementMetrics {
  if (commentCount === 0) {
    return zeroCommentEngagement(feedId);
  }
  if (commentCount >= 2_000) {
    const likeCount = Math.round(1_000_000 + commentCount * 350);
    const favoriteCount = Math.min(
      FAVORITE_SHARE_CAP,
      Math.round(commentCount * 145),
    );
    const shareCount = Math.min(
      FAVORITE_SHARE_CAP,
      Math.round(commentCount * 98),
    );
    return { likeCount, favoriteCount, shareCount };
  }
  if (commentCount >= 1_000) {
    const likeCount = Math.round(8_000 + commentCount * 14);
    const favoriteCount = Math.round(90 + commentCount * 0.62);
    const shareCount = Math.round(75 + commentCount * 0.48);
    return { likeCount, favoriteCount, shareCount };
  }
  if (commentCount >= 100) {
    const likeCount = Math.round(650 + commentCount * 8.8);
    const favoriteCount = Math.round(55 + commentCount * 0.82);
    const shareCount = Math.round(48 + commentCount * 0.68);
    return { likeCount, favoriteCount, shareCount };
  }
  const likeCount = Math.min(99, Math.round(8 + commentCount * 0.92));
  const favoriteCount = Math.min(42, Math.round(3 + commentCount * 0.38));
  const shareCount = Math.min(28, Math.round(2 + commentCount * 0.26));
  return { likeCount, favoriteCount, shareCount };
}
