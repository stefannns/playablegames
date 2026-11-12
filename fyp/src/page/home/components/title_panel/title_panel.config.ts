import { avatarSlotFromId, localAvatarUrlForDisplay } from "../../../../utils/local_avatar";

/**
 * Static data backing the Feed "Title Panel" (caption + AI overview + comments)
 * — restored from Figma node 7024:393679. Avatars resolve to the local
 * `public/resource/avatar` library by display size, never external URLs.
 */

export type TitlePanelAnchor =
  | { kind: "search"; label: string; query: string }
  | { kind: "poi"; label: string };

export type TitlePanelComment = {
  id: string;
  authorName: string;
  /** Teal "Creator" / grey "Following" badge after the name, if any. */
  creatorLabel?: "Creator" | "Following";
  content: string;
  timeLabel: string;
  likeCountLabel: string;
};

export type TitlePanelAiOverview = {
  /** Summary line shown first. */
  summary: string;
  /** Bold hook question. */
  question: string;
  /** Trailing paragraph that fades out under the "View all" button. */
  detail: string;
  viewAllLabel: string;
};

export type TitlePanelContent = {
  author: {
    name: string;
    avatarSrc: string;
  };
  caption: {
    text: string;
    hashtag: string;
    dateLabel: string;
    translationLabel: string;
  };
  anchors: TitlePanelAnchor[];
  aiOverview: TitlePanelAiOverview;
  commentCountLabel: string;
  comments: TitlePanelComment[];
  composer: {
    avatarSrc: string;
    placeholder: string;
  };
  actions: {
    likeLabel: string;
    commentLabel: string;
    bookmarkLabel: string;
    shareLabel: string;
  };
};

const commentAvatar = (id: string) =>
  localAvatarUrlForDisplay(36, avatarSlotFromId(id));

export const titlePanelContent: TitlePanelContent = {
  author: {
    name: "burcu bloyd 🌺",
    avatarSrc: localAvatarUrlForDisplay(28, avatarSlotFromId("burcu-bloyd")),
  },
  caption: {
    text: "fresh hair ",
    hashtag: "#hairtok",
    dateLabel: "Jan 13",
    translationLabel: "See translation",
  },
  anchors: [
    { kind: "search", label: "Search:", query: "hair trending" },
    { kind: "poi", label: "Point Reyes Lighthouse" },
  ],
  aiOverview: {
    summary:
      "This video shows a woman proudly displaying her beautiful, freshly styled long hair.",
    question:
      "What is this trend/challenge, and what’s the core hook that makes it repeatable?",
    detail:
      "This trend involves users showcasing their newly styled or cut hair, often featuring a hair transformation.",
    viewAllLabel: "View all",
  },
  commentCountLabel: "1064 comments",
  comments: [
    {
      id: "charlotte-robertson",
      authorName: "charlotte robertson",
      content:
        "This video is so inspiring. It reignited my passion and confidence for life.",
      timeLabel: "Mar 15",
      likeCountLabel: "847",
    },
    {
      id: "alvin-creator",
      authorName: "Alvin",
      creatorLabel: "Creator",
      content:
        "Sorry no each place is separate 😂 but you could combine some of the places!",
      timeLabel: "1s ago",
      likeCountLabel: "622",
    },
    {
      id: "alvin-friends",
      authorName: "Alvin",
      creatorLabel: "Following",
      content:
        "Full of positive energy. It's really powerful to see such a video in tough times. It's like a guiding light on the way forward. Come on!",
      timeLabel: "Mar 15",
      likeCountLabel: "485",
    },
    {
      id: "yogabyangela-1",
      authorName: "yogabyangela",
      content:
        "@sukhmani @raveen__sidhu @alyssa this is like the cool bars I was talking about",
      timeLabel: "Mar 15",
      likeCountLabel: "3",
    },
    {
      id: "alvin-friends-2",
      authorName: "Alvin",
      creatorLabel: "Following",
      content:
        "Full of positive energy. It's really powerful to see such a video in tough times. It's like a guiding light on the way forward. Come on!",
      timeLabel: "Mar 15",
      likeCountLabel: "485",
    },
    {
      id: "yogabyangela-2",
      authorName: "yogabyangela",
      content:
        "@sukhmani @raveen__sidhu @alyssa this is like the cool bars I was talking about",
      timeLabel: "Mar 15",
      likeCountLabel: "3",
    },
  ].map((comment) => ({
    ...comment,
    creatorLabel: comment.creatorLabel as
      | "Creator"
      | "Following"
      | undefined,
  })) as TitlePanelComment[],
  composer: {
    avatarSrc: localAvatarUrlForDisplay(40, avatarSlotFromId("me-composer")),
    placeholder: "Add comment...",
  },
  actions: {
    likeLabel: "99.1K",
    commentLabel: "930",
    bookmarkLabel: "810",
    shareLabel: "674",
  },
};

export function titlePanelCommentAvatar(id: string) {
  return commentAvatar(id);
}
