export type CreationPrimeSlot = {
  id: "photo-editor" | "autocut" | "ai-video" | "ai-image" | "ai-self";
  label: string;
};

export type CreationTemplateCard = {
  id: string;
  title: string;
  subtitle: string;
  src?: string;
  aspectRatio: "179/238" | "179/318";
};

const VIDEO_MOCK_BASE = "/resource/video_mock";

export const CREATION_CREATE_PRIME_SLOTS: readonly CreationPrimeSlot[] = [
  { id: "photo-editor", label: "Photo editor" },
  { id: "autocut", label: "AutoCut" },
  { id: "ai-video", label: "AI Video" },
  { id: "ai-image", label: "AI Image" },
  { id: "ai-self", label: "AI Self" },
] as const;

/** Figma `Create page` scrolled-up nav CTA gradient (629:23270 trailing). */
export const CREATION_NEW_VIDEO_NAV_GRADIENT =
  "linear-gradient(-82.88deg, rgb(235, 253, 255) 10.24%, rgb(255, 239, 230) 90.18%)";

/** Scroll past collapsible chrome (prime + entrances + Templates row) before sticky tabs + nav New. */
export const CREATION_CREATE_SCROLL_COLLAPSE_PX = 8;

export const CREATION_CREATE_CATEGORY_TABS = [
  "Saved",
  "For you",
  "Monthly recap",
  "Summer",
  "Graduation",
  "Trending",
] as const;

export type CreationCreateCategoryTab = (typeof CREATION_CREATE_CATEGORY_TABS)[number];

type TemplateCardSeed = Omit<CreationTemplateCard, "id"> & { id: string };

function templateCards(seeds: readonly TemplateCardSeed[]): CreationTemplateCard[] {
  return seeds.map((seed) => ({ ...seed }));
}

/** Masonry layout per Figma; thumbnails from `video_mock` (same pool as album picker). */
const FOR_YOU_TEMPLATE_CARDS = templateCards([
  {
    id: "for-you-1",
    title: "Vlog Keren",
    subtitle: "3.5M videos · 12 clips",
    src: `${VIDEO_MOCK_BASE}/people_outdoor/cover-09.jpg`,
    aspectRatio: "179/238",
  },
  {
    id: "for-you-2",
    title: "Vlog Keren",
    subtitle: "3.5M videos · 12 clips",
    src: `${VIDEO_MOCK_BASE}/people_outdoor/cover-02.jpg`,
    aspectRatio: "179/318",
  },
  {
    id: "for-you-3",
    title: "Vlog Keren",
    subtitle: "3.5M videos · 12 clips",
    src: `${VIDEO_MOCK_BASE}/empty_shots/17-sun-shining-on-the-leaves-thumbnail.jpg`,
    aspectRatio: "179/318",
  },
  {
    id: "for-you-4",
    title: "Vlog Keren",
    subtitle: "3.5M videos · 12 clips",
    src: `${VIDEO_MOCK_BASE}/food_closeups/10-blueberries-and-strawberries-thumbnail.jpg`,
    aspectRatio: "179/318",
  },
  {
    id: "for-you-5",
    title: "Vlog Keren",
    subtitle: "3.5M videos · 12 clips",
    src: `${VIDEO_MOCK_BASE}/people_outdoor/02-a-girl-spends-time-at-an-outdoor-caf-thumbnail.jpg`,
    aspectRatio: "179/318",
  },
  {
    id: "for-you-6",
    title: "Vlog Keren",
    subtitle: "3.5M videos · 12 clips",
    src: `${VIDEO_MOCK_BASE}/food_closeups/13-thai-berry-ice-cream-thumbnail.jpg`,
    aspectRatio: "179/318",
  },
]);

const CREATION_CREATE_TEMPLATES_BY_CATEGORY: Record<
  CreationCreateCategoryTab,
  CreationTemplateCard[]
> = {
  Saved: templateCards([
    {
      id: "saved-1",
      title: "Weekend recap",
      subtitle: "Saved · 8 clips",
      src: `${VIDEO_MOCK_BASE}/people_outdoor/cover-13.jpg`,
      aspectRatio: "179/238",
    },
    {
      id: "saved-2",
      title: "Coffee run",
      subtitle: "Saved · 6 clips",
      src: `${VIDEO_MOCK_BASE}/people_outdoor/02-a-girl-spends-time-at-an-outdoor-caf-thumbnail.jpg`,
      aspectRatio: "179/318",
    },
    {
      id: "saved-3",
      title: "City night",
      subtitle: "Saved · 10 clips",
      src: `${VIDEO_MOCK_BASE}/empty_shots/cover-26.jpg`,
      aspectRatio: "179/318",
    },
    {
      id: "saved-4",
      title: "Beach day",
      subtitle: "Saved · 5 clips",
      src: `${VIDEO_MOCK_BASE}/empty_shots/01-waves-crashing-near-the-coast-thumbnail.jpg`,
      aspectRatio: "179/318",
    },
    {
      id: "saved-5",
      title: "Brunch vibes",
      subtitle: "Saved · 7 clips",
      src: `${VIDEO_MOCK_BASE}/food_closeups/08-berries-thumbnail.jpg`,
      aspectRatio: "179/318",
    },
    {
      id: "saved-6",
      title: "Studio session",
      subtitle: "Saved · 4 clips",
      src: `${VIDEO_MOCK_BASE}/people_indoor/05-a-girl-searching-on-the-nft-marketplace--thumbnail.jpg`,
      aspectRatio: "179/318",
    },
  ]),
  "For you": FOR_YOU_TEMPLATE_CARDS,
  "Monthly recap": templateCards([
    {
      id: "recap-1",
      title: "March highlights",
      subtitle: "2.1M videos · 18 clips",
      src: `${VIDEO_MOCK_BASE}/people_outdoor/cover-09.jpg`,
      aspectRatio: "179/238",
    },
    {
      id: "recap-2",
      title: "Best of spring",
      subtitle: "1.8M videos · 14 clips",
      src: `${VIDEO_MOCK_BASE}/empty_shots/cover-28.jpg`,
      aspectRatio: "179/318",
    },
    {
      id: "recap-3",
      title: "Friends montage",
      subtitle: "920K videos · 9 clips",
      src: `${VIDEO_MOCK_BASE}/people_outdoor/cover-02.jpg`,
      aspectRatio: "179/318",
    },
    {
      id: "recap-4",
      title: "Travel diary",
      subtitle: "640K videos · 11 clips",
      src: `${VIDEO_MOCK_BASE}/empty_shots/17-sun-shining-on-the-leaves-thumbnail.jpg`,
      aspectRatio: "179/318",
    },
    {
      id: "recap-5",
      title: "Food moments",
      subtitle: "510K videos · 8 clips",
      src: `${VIDEO_MOCK_BASE}/food_closeups/13-thai-berry-ice-cream-thumbnail.jpg`,
      aspectRatio: "179/318",
    },
    {
      id: "recap-6",
      title: "Late nights",
      subtitle: "380K videos · 6 clips",
      src: `${VIDEO_MOCK_BASE}/empty_shots/cover-26.jpg`,
      aspectRatio: "179/318",
    },
  ]),
  Summer: templateCards([
    {
      id: "summer-1",
      title: "Golden hour",
      subtitle: "4.2M videos · 10 clips",
      src: `${VIDEO_MOCK_BASE}/empty_shots/01-waves-crashing-near-the-coast-thumbnail.jpg`,
      aspectRatio: "179/238",
    },
    {
      id: "summer-2",
      title: "Pool party",
      subtitle: "2.9M videos · 12 clips",
      src: `${VIDEO_MOCK_BASE}/people_outdoor/cover-13.jpg`,
      aspectRatio: "179/318",
    },
    {
      id: "summer-3",
      title: "Road trip",
      subtitle: "1.6M videos · 15 clips",
      src: `${VIDEO_MOCK_BASE}/empty_shots/17-sun-shining-on-the-leaves-thumbnail.jpg`,
      aspectRatio: "179/318",
    },
    {
      id: "summer-4",
      title: "Ice cream break",
      subtitle: "1.1M videos · 7 clips",
      src: `${VIDEO_MOCK_BASE}/food_closeups/13-thai-berry-ice-cream-thumbnail.jpg`,
      aspectRatio: "179/318",
    },
    {
      id: "summer-5",
      title: "Sunset picnic",
      subtitle: "890K videos · 9 clips",
      src: `${VIDEO_MOCK_BASE}/food_closeups/10-blueberries-and-strawberries-thumbnail.jpg`,
      aspectRatio: "179/318",
    },
    {
      id: "summer-6",
      title: "Festival fit",
      subtitle: "720K videos · 8 clips",
      src: `${VIDEO_MOCK_BASE}/people_outdoor/02-a-girl-spends-time-at-an-outdoor-caf-thumbnail.jpg`,
      aspectRatio: "179/318",
    },
  ]),
  Graduation: templateCards([
    {
      id: "grad-1",
      title: "Cap toss",
      subtitle: "3.8M videos · 11 clips",
      src: `${VIDEO_MOCK_BASE}/people_outdoor/cover-02.jpg`,
      aspectRatio: "179/238",
    },
    {
      id: "grad-2",
      title: "Class of 2026",
      subtitle: "2.4M videos · 16 clips",
      src: `${VIDEO_MOCK_BASE}/people_outdoor/cover-09.jpg`,
      aspectRatio: "179/318",
    },
    {
      id: "grad-3",
      title: "Campus walk",
      subtitle: "1.5M videos · 9 clips",
      src: `${VIDEO_MOCK_BASE}/people_indoor/05-a-girl-searching-on-the-nft-marketplace--thumbnail.jpg`,
      aspectRatio: "179/318",
    },
    {
      id: "grad-4",
      title: "Family proud",
      subtitle: "980K videos · 6 clips",
      src: `${VIDEO_MOCK_BASE}/people_outdoor/cover-13.jpg`,
      aspectRatio: "179/318",
    },
    {
      id: "grad-5",
      title: "After party",
      subtitle: "760K videos · 8 clips",
      src: `${VIDEO_MOCK_BASE}/empty_shots/cover-28.jpg`,
      aspectRatio: "179/318",
    },
    {
      id: "grad-6",
      title: "Yearbook glow",
      subtitle: "540K videos · 5 clips",
      src: `${VIDEO_MOCK_BASE}/food_closeups/08-berries-thumbnail.jpg`,
      aspectRatio: "179/318",
    },
  ]),
  Trending: templateCards([
    {
      id: "trending-1",
      title: "Viral dance",
      subtitle: "12M videos · 6 clips",
      src: `${VIDEO_MOCK_BASE}/people_outdoor/cover-09.jpg`,
      aspectRatio: "179/238",
    },
    {
      id: "trending-2",
      title: "POV trend",
      subtitle: "8.4M videos · 4 clips",
      src: `${VIDEO_MOCK_BASE}/food_closeups/10-blueberries-and-strawberries-thumbnail.jpg`,
      aspectRatio: "179/318",
    },
    {
      id: "trending-3",
      title: "Glow up",
      subtitle: "5.2M videos · 8 clips",
      src: `${VIDEO_MOCK_BASE}/people_outdoor/cover-02.jpg`,
      aspectRatio: "179/318",
    },
    {
      id: "trending-4",
      title: "Sound check",
      subtitle: "3.9M videos · 5 clips",
      src: `${VIDEO_MOCK_BASE}/empty_shots/cover-26.jpg`,
      aspectRatio: "179/318",
    },
    {
      id: "trending-5",
      title: "Before / after",
      subtitle: "2.7M videos · 7 clips",
      src: `${VIDEO_MOCK_BASE}/empty_shots/17-sun-shining-on-the-leaves-thumbnail.jpg`,
      aspectRatio: "179/318",
    },
    {
      id: "trending-6",
      title: "Day in my life",
      subtitle: "2.1M videos · 10 clips",
      src: `${VIDEO_MOCK_BASE}/food_closeups/13-thai-berry-ice-cream-thumbnail.jpg`,
      aspectRatio: "179/318",
    },
  ]),
};

export function getCreationCreateTemplateCardsForCategory(
  category: CreationCreateCategoryTab,
): CreationTemplateCard[] {
  return CREATION_CREATE_TEMPLATES_BY_CATEGORY[category];
}
