import { TUXText, getColorCSSVar } from "@byted-tiktok/tux-web";
import {
  IconArrowClockwise,
  IconChevronLeftOffsetLTR,
  IconClock,
  IconMagnifyingGlass,
  IconMicrophone,
  IconXMark,
  IconXMarkSmall,
  TUXIconChevronDown,
  TUXIconChevronRightLTR,
  TUXIconEllipsisHorizontal,
  TUXIconLike,
} from "@byted-tiktok/tux-icons";
import { motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

import { useAppFrame, useTabAppChromeSurfaceTheme } from "../../components/sys/app_frame";
import { useSoftKeyboardTextTarget } from "../../components/sys/soft_keyboard";
import {
  localFeedVerticalCoverUrl,
  localMusicCoverUrl,
} from "../../utils/local_media_placeholder";
import { localAvatarUrl } from "../../utils/local_avatar";
import { SearchSourceAvatarStack } from "./components/search_source_avatar_stack";
import { useSearchConfig, type SearchTop1CardType } from "./search_config_store";

type SearchMiddlePageProps = {
  isTabActive?: boolean;
  onBack: () => void;
  onOpenResults: () => void;
};

type SearchResultPageProps = {
  isTabActive?: boolean;
  onBack: () => void;
  onOpenLanding: () => void;
};

const RECENT_SEARCHES = [
  "where is penguin's habitat",
  "where is penguin's habitat",
  "where is penguin's habitat",
] as const;

const MAY_LIKE_ITEMS = [
  {
    title: "Red Desert – Monica Vitti Interview",
    subtitle: "Just watched",
    accent: true,
    image: localFeedVerticalCoverUrl(5),
  },
  {
    title: "Billie Eilish",
    subtitle: "Just watched",
    accent: true,
    image: localMusicCoverUrl(12),
  },
  {
    title: "New Jeans",
    subtitle: "Searched",
    accent: false,
    image: localFeedVerticalCoverUrl(8),
  },
  {
    title: "Where Dreams Go To Die",
    subtitle: "Sound",
    accent: false,
    image: localFeedVerticalCoverUrl(16),
  },
] as const;

const EXPLORE_ITEMS = [
  { id: "tara-1", label: "Tara Yummy\nPlayboy Ad", image: null },
  { id: "midnight", label: "Midnight tryst", image: localFeedVerticalCoverUrl(24) },
  { id: "tara-2", label: "Tara Yummy\nPlayboy Ad", image: localFeedVerticalCoverUrl(10) },
  { id: "tara-3", label: "Tara Yummy\nPlayboy Ad", image: localFeedVerticalCoverUrl(28) },
] as const;

const SEARCH_TABS = [
  "Top",
  "Videos",
  "Users",
  "Sounds",
  "Shop",
  "LIVE",
] as const;

const SEARCH_HIGHLIGHTS_ICON =
  "https://www.figma.com/api/mcp/asset/0a79ca71-e656-475a-8ab1-a3cc6762f811";

const SEARCH_RESULT_QUERY_BY_CARD_TYPE: Record<SearchTop1CardType, string> = {
  none: "mesh dress",
  "offline-text": "where is penguin's habitat",
  "offline-image-wrap": "where is penguin's habitat",
  "simple-qa-holiday": "Thanksgiving 2024",
  "simple-qa-time-difference": "Time in Barcelona",
  "simple-qa-math": "115-25",
  "simple-qa-sunset": "San francisco sunset",
  "simple-qa-sunrise-sunset": "San francisco sunset and sunrise",
  "simple-qa-weekday": "weekday of jan22,2011",
  "simple-qa-opening-hours": "Rockefeller center hours",
  "simple-qa-days": "day since 1 january 2024",
};

type SimpleQaSingleAnswerCardType = Exclude<
  SearchTop1CardType,
  | "none"
  | "offline-text"
  | "offline-image-wrap"
  | "simple-qa-sunrise-sunset"
>;

type SimpleQaSingleAnswerCardConfig = {
  description: string;
  answer: string;
  descriptionSize?: 13 | 15;
  answerIcon?: "sunset";
};

const SIMPLE_QA_SINGLE_ANSWER_CARD_CONFIG: Record<
  SimpleQaSingleAnswerCardType,
  SimpleQaSingleAnswerCardConfig
> = {
  "simple-qa-holiday": {
    description: "Thanksgiving in the United States is",
    answer: "Thu, Nov 28, 2024",
    descriptionSize: 13,
  },
  "simple-qa-time-difference": {
    description: "Monday, Oct 21, 2024 in Barcelona, Spain (GMT+1)",
    answer: "9:58 AM",
    descriptionSize: 13,
  },
  "simple-qa-math": {
    description: "115-25 = ",
    answer: "90",
  },
  "simple-qa-sunset": {
    description: "Sunset time in San Francisco, CA on Jan 13, 2025 is",
    answer: "17:13",
    answerIcon: "sunset",
  },
  "simple-qa-weekday": {
    description: "January 22, 2011 is",
    answer: "Saturday",
  },
  "simple-qa-opening-hours": {
    description: "The open hour of Rockefeller center is",
    answer: "10:00 AM - 16:00 PM",
  },
  "simple-qa-days": {
    description: "1 Jan 2024 - 6 Feb 2025",
    answer: "244 days",
  },
};

const RESULT_CARDS = [
  {
    id: "coast",
    cover: localFeedVerticalCoverUrl(11),
    date: "Jul 20, 2024",
    title: "Look how beautiful this flamingo is, nature crea...",
    author: "Jony",
    avatar: localAvatarUrl("small", 19),
    verified: true,
    likes: "7.3K",
  },
  {
    id: "penguin",
    cover: localFeedVerticalCoverUrl(19),
    date: "Jul 20, 2024",
    title: "Can you imagine? The most beautiful creature...",
    author: "JesseLiu",
    avatar: localAvatarUrl("small", 7),
    verified: false,
    likes: "7.3K",
  },
  {
    id: "red-dress",
    cover: localFeedVerticalCoverUrl(13),
    date: "Jul 20, 2024",
    title: "#meshdress POV: a birthday look that actually fits...",
    author: "MiraStyle",
    avatar: localAvatarUrl("small", 31),
    verified: false,
    likes: "3.1K",
  },
  {
    id: "evening-light",
    cover: localFeedVerticalCoverUrl(24),
    date: "Jul 20, 2024",
    title: "Evening light, a calm mesh dress, and city plans",
    author: "Nova Fits",
    avatar: localAvatarUrl("small", 42),
    verified: true,
    likes: "14.2K",
  },
  {
    id: "black-dress",
    cover: localFeedVerticalCoverUrl(21),
    date: "Jul 21, 2024",
    title: "Black mesh dress styling ideas for dinner plans",
    author: "ClosetDaily",
    avatar: localAvatarUrl("small", 27),
    verified: false,
    likes: "5.8K",
  },
  {
    id: "villa-look",
    cover: localFeedVerticalCoverUrl(28),
    date: "Jul 21, 2024",
    title: "It's giving villa ready. Shop pre-loved looks",
    author: "PreLoved UK",
    avatar: localAvatarUrl("small", 53),
    verified: true,
    likes: "22K",
  },
] as const;

const RESULTS_LOADING_MS = 900;

function SearchTopBar({
  onBack,
  query,
  placeholder = false,
  trailing,
}: {
  onBack: () => void;
  query: string;
  placeholder?: boolean;
  trailing: "search" | "more";
}) {
  return (
    <div className="flex h-13 items-center gap-1 px-1">
      <button
        type="button"
        aria-label="Back"
        onClick={onBack}
        className="flex h-11 w-11 shrink-0 items-center justify-center"
        style={{ color: getColorCSSVar("UIText1") }}
      >
        <IconChevronLeftOffsetLTR width={28} height={28} />
      </button>
      <div
        className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg px-2"
        role="search"
        aria-label={`Search ${query}`}
        style={{ backgroundColor: getColorCSSVar("UIShapeNeutral4") }}
      >
        <IconMagnifyingGlass
          width={22}
          height={22}
          style={{ color: getColorCSSVar("UIText1") }}
        />
        <TUXText
          typographyPreset="Headline-Regular"
          color={placeholder ? "UITextPlaceholder" : "UIText1"}
          textDisplay="truncate"
          className="min-w-0 flex-1"
        >
          {query}
        </TUXText>
        {trailing === "search" ? (
          <IconMicrophone
            width={22}
            height={22}
            style={{ color: getColorCSSVar("UIText1") }}
          />
        ) : (
          <span
            className="flex size-5 shrink-0 items-center justify-center rounded-full"
            style={{
              backgroundColor: getColorCSSVar("UITextPlaceholder"),
              color: getColorCSSVar("UIShapeText1OnPrimary"),
            }}
            aria-hidden
          >
            <IconXMarkSmall width={14} height={14} />
          </span>
        )}
      </div>
      {trailing === "search" ? (
        <button
          type="button"
          className="flex h-11 w-[70px] shrink-0 items-center justify-center"
          aria-label="Search"
        >
          <TUXText typographyPreset="Headline-Semibold" color="UITextPrimaryDisplay">
            Search
          </TUXText>
        </button>
      ) : (
        <button
          type="button"
          aria-label="More"
          className="flex h-11 w-10 shrink-0 items-center justify-center"
          style={{ color: getColorCSSVar("UIText1") }}
        >
          <TUXIconEllipsisHorizontal size={24} />
        </button>
      )}
    </div>
  );
}

function SearchMiddleTopBar({
  onBack,
  query,
  onQueryChange,
  onSubmit,
}: {
  onBack: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const { targetRef, onTargetFocus, focusTargetAfterFrame } =
    useSoftKeyboardTextTarget({
      placeholder: "Search",
      returnKey: "search",
      onChange: onQueryChange,
      onSubmit,
    });

  useEffect(() => {
    focusTargetAfterFrame();
  }, [focusTargetAfterFrame]);

  return (
    <div className="flex h-13 items-center gap-1 px-1" data-softkb-keep-open>
      <button
        type="button"
        aria-label="Back"
        onClick={onBack}
        className="flex h-11 w-11 shrink-0 items-center justify-center"
        style={{ color: getColorCSSVar("UIText1") }}
      >
        <IconChevronLeftOffsetLTR width={28} height={28} />
      </button>
      <div
        className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg px-2"
        role="search"
        aria-label="Search"
        style={{ backgroundColor: getColorCSSVar("UIShapeNeutral4") }}
      >
        <IconMagnifyingGlass
          width={22}
          height={22}
          style={{ color: getColorCSSVar("UIText1") }}
        />
        <textarea
          ref={targetRef}
          value={query}
          onFocus={onTargetFocus}
          onChange={(event) => onQueryChange(event.currentTarget.value)}
          rows={1}
          placeholder="Red Desert – Monica Vitti I..."
          className="app-token-placeholder min-w-0 flex-1 resize-none border-0 bg-transparent outline-none"
          style={{
            height: 22,
            lineHeight: "22px",
            fontSize: 16,
            color: getColorCSSVar("UIText1"),
            overflow: "hidden",
            caretColor: getColorCSSVar("UITextPrimaryDisplay"),
          }}
        />
        <button
          type="button"
          aria-label="Voice search"
          className="flex size-7 shrink-0 items-center justify-center"
          onMouseDown={(event) => event.preventDefault()}
          style={{ color: getColorCSSVar("UIText1") }}
        >
          <IconMicrophone width={22} height={22} />
        </button>
      </div>
      <button
        type="button"
        className="flex h-11 w-[70px] shrink-0 items-center justify-center"
        aria-label="Search"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onSubmit}
      >
        <TUXText typographyPreset="Headline-Semibold" color="UITextPrimaryDisplay">
          Search
        </TUXText>
      </button>
    </div>
  );
}

function RecentSearchRow({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="flex h-11 w-full items-center gap-3 px-5 text-left"
      onClick={onClick}
    >
      <IconClock width={18} height={18} style={{ color: getColorCSSVar("UIText3") }} />
      <TUXText
        typographyPreset="Headline-Semibold"
        color="UIText1"
        textDisplay="truncate"
        className="min-w-0 flex-1"
      >
        {label}
      </TUXText>
      <IconXMark width={16} height={16} style={{ color: getColorCSSVar("UIText3") }} />
    </button>
  );
}

function MayLikeRow({
  item,
  onClick,
}: {
  item: (typeof MAY_LIKE_ITEMS)[number];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="flex h-14 w-full items-center gap-2 px-5 text-left"
      onClick={onClick}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{
          backgroundColor: getColorCSSVar(
            item.accent ? "UITextPrimaryDisplay" : "UIText3",
          ),
        }}
      />
      <div className="min-w-0 flex-1">
        <TUXText
          typographyPreset="Headline-Semibold"
          color={item.accent ? "UITextPrimaryDisplay" : "UIText1"}
          textDisplay="truncate"
          className="block"
        >
          {item.title}
        </TUXText>
        <TUXText
          typographyPreset="P1-Regular"
          color="UIText3"
          textDisplay="truncate"
          className="block"
        >
          {item.subtitle}
        </TUXText>
      </div>
      <img
        src={item.image}
        alt=""
        className="size-11 shrink-0 rounded-md object-cover"
        loading="lazy"
      />
    </button>
  );
}

function ExploreCard({
  item,
  onClick,
}: {
  item: (typeof EXPLORE_ITEMS)[number];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="flex min-h-[134px] flex-col items-center overflow-hidden rounded-lg px-3 pt-4 text-center active:opacity-90"
      style={{ backgroundColor: getColorCSSVar("UIShapeNeutral4") }}
      onClick={onClick}
    >
      <div className="flex items-start justify-center gap-1">
        <IconMagnifyingGlass width={17} height={17} style={{ marginTop: 3 }} />
        <TUXText
          typographyPreset="Headline-Semibold"
          color="UIText1"
          className="whitespace-pre-line"
          style={{ lineHeight: "22px" }}
        >
          {item.label}
        </TUXText>
      </div>
      <TUXText typographyPreset="P1-Regular" color="UITextPrimaryDisplay" className="mt-1">
        Trending
      </TUXText>
      {item.image ? (
        <img
          src={item.image}
          alt=""
          className="mt-5 h-40 w-[72%] rounded-md object-cover"
          loading="lazy"
        />
      ) : null}
    </button>
  );
}

function SearchResultsLoading() {
  return (
    <div
      className="flex min-h-0 flex-1 items-center justify-center"
      style={{ backgroundColor: getColorCSSVar("UIPageFlat1") }}
      role="status"
      aria-label="Loading search results"
    >
      <div className="flex items-center justify-center gap-0.5">
        <motion.span
          className="size-3 rounded-full"
          style={{ backgroundColor: "#fe2c55" }}
          animate={{ x: [0, 7, 0], scale: [1, 0.88, 1] }}
          transition={{ duration: 0.72, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          className="size-3 rounded-full"
          style={{ backgroundColor: "#25f4ee" }}
          animate={{ x: [0, -7, 0], scale: [1, 0.88, 1] }}
          transition={{ duration: 0.72, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

function SearchHighlightsSourceRow() {
  return (
    <div className="flex h-5 min-w-0 items-center gap-1">
      <img
        src={SEARCH_HIGHLIGHTS_ICON}
        alt=""
        className="size-4 shrink-0"
        loading="lazy"
      />
      <TUXText
        typographyPreset="P2-Regular"
        color="UIText3"
        textDisplay="truncate"
        className="min-w-0 shrink"
      >
        Search Highlights · AI summary from
      </TUXText>
      <SearchSourceAvatarStack avatarCount={2} extraCount={3} />
    </div>
  );
}

function SearchTop1CardShell({
  children,
  onOpenLanding,
  heightClassName,
}: {
  children: ReactNode;
  onOpenLanding: () => void;
  heightClassName: string;
}) {
  return (
    <section
      className={`relative mx-1 mt-1 overflow-hidden rounded-md bg-tux-v2-ui-page-flat-1 pb-3 ${heightClassName}`}
      aria-label="Search highlights"
    >
      <div className="flex items-center gap-1 px-3 py-3">
        <SearchHighlightsSourceRow />
        <button
          type="button"
          aria-label="More search highlight options"
          className="ml-auto flex size-6 shrink-0 items-center justify-center"
          style={{ color: getColorCSSVar("UIText3") }}
        >
          <TUXIconEllipsisHorizontal size={20} />
        </button>
      </div>

      {children}

      <button
        type="button"
        className="absolute bottom-1 left-1/2 z-10 flex -translate-x-1/2 items-center justify-center gap-1 px-3 py-1.5"
        aria-label="See more search highlights"
        onClick={onOpenLanding}
      >
        <TUXText typographyPreset="P1-Semibold" color="UIText1">
          See more
        </TUXText>
        <TUXIconChevronRightLTR size={14} />
      </button>
    </section>
  );
}

function SearchOfflineTextTop1Card({
  onOpenLanding,
}: {
  onOpenLanding: () => void;
}) {
  return (
    <SearchTop1CardShell onOpenLanding={onOpenLanding} heightClassName="h-[310px]">
      <div className="relative h-[246px] overflow-hidden px-3">
        <TUXText
          as="h1"
          typographyPreset="H3-Bold"
          color="UIText1"
          textDisplay="truncate"
        >
          Where Is Penguin&apos;s Habitat
        </TUXText>
        <div
          className="mt-2 flex flex-col gap-2 text-tux-v2-ui-text-1-display"
          style={{
            fontSize: 14,
            lineHeight: "18.2px",
          }}
        >
          <p>
            Penguins live almost exclusively{" "}
            <span className="font-semibold">in the Southern Hemisphere</span>.
            While many people associate them with Antarctica, penguins can be found
            on every continent in the Southern Hemisphere, including various
            islands and coastlines.
          </p>
          <div>
            <TUXText
              as="h2"
              typographyPreset="P1-Semibold"
              color="UIText1Display"
            >
              Locations of Penguin Habitats
            </TUXText>
            <p className="mt-1">
              <span className="font-semibold">Antarctica:</span> This continent is
              home to the largest penguin populations, though only two species, the
              Emperor and Adélie penguins, live there year-round. Other species,
              like Chinstrap and Gentoo penguins, also breed on the Antarctic
              Peninsula and nearby islands.
            </p>
          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.75) 35%, rgba(255,255,255,0.95) 60%, var(--tux-v2-color-ui-page-flat-1) 100%)",
          }}
        />
      </div>
    </SearchTop1CardShell>
  );
}

function SearchImageWrapTop1Card({
  onOpenLanding,
}: {
  onOpenLanding: () => void;
}) {
  return (
    <SearchTop1CardShell onOpenLanding={onOpenLanding} heightClassName="h-[310px]">
      <div className="relative h-[246px] overflow-hidden px-3">
        <TUXText
          as="h1"
          typographyPreset="H3-Bold"
          color="UIText1"
          textDisplay="truncate"
        >
          Where Is Penguin&apos;s Habitat
        </TUXText>
        <div
          className="mt-2 flow-root text-tux-v2-ui-text-1-display"
          style={{
            fontSize: 14,
            lineHeight: "18.2px",
          }}
        >
          <span className="relative float-left mr-3 block h-[112px] w-[84px] overflow-hidden rounded-lg">
            <img
              src="/resource/search/penguin-swimming.png"
              alt=""
              className="h-full w-full object-cover object-center"
              loading="lazy"
            />
            <span
              className="absolute bottom-2 right-2 rounded-full px-1.5 py-0.5 text-[13px] font-semibold leading-none text-white"
              style={{ backgroundColor: "rgba(0,0,0,0.42)", color: "#fff" }}
              aria-hidden
            >
              +3
            </span>
          </span>
          Penguins live almost exclusively{" "}
          <span className="font-semibold">in the Southern Hemisphere</span>.
          While many people associate them with Antarctica, penguins can be
          found on every continent in the Southern Hemisphere, including
          various islands and coastlines.
        </div>

        <TUXText
          as="h2"
          typographyPreset="P1-Semibold"
          color="UIText1Display"
          className="mt-2"
        >
          Locations of Penguin Habitats
        </TUXText>
        <TUXText
          as="p"
          typographyPreset="P1-Regular"
          color="UIText1Display"
          style={{ lineHeight: "18.2px" }}
        >
          • <span className="font-semibold">Antarctica:</span> This
          continent is home to the largest penguin populations, though only
          two species, the Emperor and Adélie penguins, live there
          year-round. Other species, like Chinstrap and Gentoo penguins,
          also breed on the Antarctic Peninsula and nearby islands.
        </TUXText>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.75) 35%, rgba(255,255,255,0.95) 60%, var(--tux-v2-color-ui-page-flat-1) 100%)",
          }}
        />
      </div>
    </SearchTop1CardShell>
  );
}

function SearchSimpleQaHeader() {
  return (
    <div className="flex items-center gap-3 px-4 pb-1 pt-4">
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <img
          src={SEARCH_HIGHLIGHTS_ICON}
          alt=""
          className="size-5 shrink-0"
          loading="lazy"
        />
        <TUXText
          typographyPreset="H4-Bold"
          color="UIText1Display"
          textDisplay="truncate"
          className="min-w-0"
        >
          Search Highlights
        </TUXText>
      </div>
      <button
        type="button"
        aria-label="More search highlight options"
        className="flex size-6 shrink-0 items-center justify-center"
        style={{ color: getColorCSSVar("UIText3") }}
      >
        <TUXIconEllipsisHorizontal size={20} />
      </button>
    </div>
  );
}

function WeatherSunIcon({ kind, size = 24 }: { kind: "sunrise" | "sunset"; size?: 18 | 24 }) {
  const sunSize = size === 24 ? 10 : 8;
  const horizonTop = size === 24 ? 18 : 14;
  const sunTop = kind === "sunrise" ? 3 : 5;

  return (
    <span
      className="relative inline-block shrink-0"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span
        className="absolute left-1/2 rounded-full"
        style={{
          top: sunTop,
          width: sunSize,
          height: sunSize,
          transform: "translateX(-50%)",
          background:
            "linear-gradient(180deg, rgba(255,218,98,1) 0%, rgba(255,148,73,1) 100%)",
        }}
      />
      <span
        className="absolute left-0 right-0 h-2 rounded-t-full"
        style={{
          top: size === 24 ? 10 : 8,
          background:
            "linear-gradient(180deg, rgba(128,178,255,0.95) 0%, rgba(128,178,255,0.15) 100%)",
        }}
      />
      <span
        className="absolute left-0 right-0 h-0.5 rounded-full"
        style={{ top: horizonTop, backgroundColor: "#80b2ff" }}
      />
    </span>
  );
}

function SearchSimpleQaSingleAnswerCard({
  config,
}: {
  config: SimpleQaSingleAnswerCardConfig;
}) {
  const descriptionPreset =
    config.descriptionSize === 13 ? "P2-Regular" : "H4-Regular";

  return (
    <section className="bg-tux-v2-ui-page-flat-1 pb-4" aria-label="Search highlights">
      <SearchSimpleQaHeader />

      <div className="flex flex-col gap-1 px-4 pt-2">
        <TUXText typographyPreset={descriptionPreset} color="UIText2">
          {config.description}
        </TUXText>
        <div className="flex min-w-0 items-center gap-1.5">
          {config.answerIcon === "sunset" ? <WeatherSunIcon kind="sunset" /> : null}
          <TUXText
            as="div"
            color="UIText1"
            textDisplay="truncate"
            className="min-w-0"
            style={{
              fontSize: 24,
              fontWeight: 700,
              lineHeight: "30px",
            }}
          >
            {config.answer}
          </TUXText>
        </div>
      </div>
    </section>
  );
}

function SearchSimpleQaSunriseSunsetCard() {
  return (
    <section className="bg-tux-v2-ui-page-flat-1 pb-4" aria-label="Search highlights">
      <SearchSimpleQaHeader />

      <div className="px-4 pb-3 pt-2">
        <TUXText typographyPreset="H4-Regular" color="UIText2">
          Sunrise and sunset time in San Francisco, CA on Jan 13, 2025 is
        </TUXText>
      </div>

      <div className="px-4">
        <div
          className="h-px w-full"
          style={{ backgroundColor: getColorCSSVar("UIShapeNeutral3") }}
        />
        <div className="flex h-[62px] items-center">
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5">
            <div className="flex items-center justify-center gap-1">
              <WeatherSunIcon kind="sunrise" size={18} />
              <TUXText typographyPreset="P2-Regular" color="UIText2">
                Sunrise
              </TUXText>
            </div>
            <TUXText typographyPreset="H4-Bold" color="UIText1">
              06:27
            </TUXText>
          </div>
          <div
            className="h-5 w-px"
            style={{ backgroundColor: getColorCSSVar("UIShapeNeutral3") }}
          />
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5">
            <div className="flex items-center justify-center gap-1">
              <WeatherSunIcon kind="sunset" size={18} />
              <TUXText typographyPreset="P2-Regular" color="UIText2">
                Sunset
              </TUXText>
            </div>
            <TUXText typographyPreset="H4-Bold" color="UIText1">
              17:45
            </TUXText>
          </div>
        </div>
        <div
          className="h-px w-full"
          style={{ backgroundColor: getColorCSSVar("UIShapeNeutral3") }}
        />
      </div>
    </section>
  );
}

function SearchSimpleQaTop1Card({ cardType }: { cardType: SearchTop1CardType }) {
  if (cardType === "simple-qa-sunrise-sunset") {
    return <SearchSimpleQaSunriseSunsetCard />;
  }

  if (cardType in SIMPLE_QA_SINGLE_ANSWER_CARD_CONFIG) {
    return (
      <SearchSimpleQaSingleAnswerCard
        config={
          SIMPLE_QA_SINGLE_ANSWER_CARD_CONFIG[
            cardType as SimpleQaSingleAnswerCardType
          ]
        }
      />
    );
  }

  return null;
}

function SearchTop1Card({
  cardType,
  onOpenLanding,
}: {
  cardType: SearchTop1CardType;
  onOpenLanding: () => void;
}) {
  if (cardType === "none") return null;

  if (cardType === "offline-image-wrap") {
    return <SearchImageWrapTop1Card onOpenLanding={onOpenLanding} />;
  }

  if (cardType.startsWith("simple-qa-")) {
    return <SearchSimpleQaTop1Card cardType={cardType} />;
  }

  return <SearchOfflineTextTop1Card onOpenLanding={onOpenLanding} />;
}

export default function SearchMiddlePage({
  isTabActive = true,
  onBack,
  onOpenResults,
}: SearchMiddlePageProps) {
  const { topInsetCss } = useAppFrame();
  const [query, setQuery] = useState("");
  useTabAppChromeSurfaceTheme(isTabActive, "light");

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden"
      style={{
        backgroundColor: getColorCSSVar("UIPageFlat1"),
        paddingTop: topInsetCss,
      }}
    >
      <SearchMiddleTopBar
        onBack={onBack}
        query={query}
        onQueryChange={setQuery}
        onSubmit={onOpenResults}
      />

      <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto pb-8">
        <section aria-label="Recent searches">
          {RECENT_SEARCHES.map((item) => (
            <RecentSearchRow key={item} label={item} onClick={onOpenResults} />
          ))}
          <button
            type="button"
            className="flex h-11 w-full items-center justify-center gap-1"
            aria-label="See more recent searches"
          >
            <TUXText typographyPreset="Headline-Semibold" color="UIText3">
              See more
            </TUXText>
            <TUXIconChevronDown size={14} color={getColorCSSVar("UIText3")} />
          </button>
        </section>

        <div
          className="mx-5 h-px"
          style={{ backgroundColor: getColorCSSVar("UIShapeNeutral4") }}
        />

        <section className="pt-4" aria-label="You may like">
          <div className="mb-1 flex items-center justify-between px-5">
            <TUXText typographyPreset="H4-Semibold" color="UIText1">
              You may like
            </TUXText>
            <button
              type="button"
              className="flex items-center gap-1"
              aria-label="Refresh recommendations"
            >
              <IconArrowClockwise
                width={16}
                height={16}
                style={{ color: getColorCSSVar("UIText3") }}
              />
              <TUXText typographyPreset="P1-Regular" color="UIText3">
                Refresh
              </TUXText>
            </button>
          </div>
          {MAY_LIKE_ITEMS.map((item) => (
            <MayLikeRow key={item.title} item={item} onClick={onOpenResults} />
          ))}
        </section>

        <section className="px-2 pt-4" aria-label="Explore">
          <TUXText typographyPreset="H4-Semibold" color="UIText1" className="mb-3 px-3">
            Explore
          </TUXText>
          <div className="grid grid-cols-2 gap-1.5">
            {EXPLORE_ITEMS.map((item) => (
              <ExploreCard key={item.id} item={item} onClick={onOpenResults} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function SearchResultPage({
  isTabActive = true,
  onBack,
  onOpenLanding,
}: SearchResultPageProps) {
  const { topInsetCss } = useAppFrame();
  const [contentReady, setContentReady] = useState(false);
  const { top1CardType } = useSearchConfig();
  const resultQuery = SEARCH_RESULT_QUERY_BY_CARD_TYPE[top1CardType];
  useTabAppChromeSurfaceTheme(isTabActive, "light");

  useEffect(() => {
    setContentReady(false);
    const timer = window.setTimeout(() => setContentReady(true), RESULTS_LOADING_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden"
      style={{
        backgroundColor: getColorCSSVar("UIPageFlat1"),
        paddingTop: topInsetCss,
      }}
    >
      <div className="shrink-0">
        <SearchTopBar
          onBack={onBack}
          query={resultQuery}
          trailing="more"
        />

        <div
          className="flex h-10 items-start overflow-x-auto border-b pl-4 hide-scrollbar"
          style={{
            borderBottomColor: getColorCSSVar("UIShapeNeutral3"),
          }}
        >
          {SEARCH_TABS.map((tab) => {
            const active = tab === "Top";
            return (
              <button
                type="button"
                key={tab}
                className="relative flex h-10 shrink-0 items-center justify-center px-2.5"
                aria-current={active ? "page" : undefined}
              >
                <TUXText
                  typographyPreset={active ? "H4-Semibold" : "H4-Regular"}
                  color={active ? "UIText1" : "UIText3"}
                  style={active ? undefined : { fontWeight: 500 }}
                >
                  {tab}
                </TUXText>
                {active ? (
                  <span
                    className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2"
                    style={{ backgroundColor: getColorCSSVar("UIText1") }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {contentReady ? (
        <div
          className="hide-scrollbar min-h-0 flex-1 overflow-y-auto pb-24"
          style={{ backgroundColor: getColorCSSVar("UIShapeNeutral4") }}
        >
        <SearchTop1Card cardType={top1CardType} onOpenLanding={onOpenLanding} />

        <section
          className="mt-1 grid grid-cols-2 gap-1 px-1"
          aria-label="Video results"
        >
          {RESULT_CARDS.map((card) => (
            <article
              key={card.id}
              className="min-w-0 overflow-hidden rounded bg-tux-v2-ui-page-flat-1"
            >
              <div className="relative h-[291px] overflow-hidden rounded-t-md">
                <img
                  src={card.cover}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <span className="sr-only">{card.date}</span>
              </div>
              <div className="px-2 pb-2 pt-2">
                <TUXText
                  as="h3"
                  typographyPreset="Headline-Regular"
                  color="UIText1"
                  className="line-clamp-2"
                  style={{ lineHeight: "20px" }}
                >
                  {card.title}
                </TUXText>
                <div className="mt-1.5 flex items-center justify-between gap-1">
                  <div className="flex min-w-0 items-center gap-1">
                    <img
                      src={card.avatar}
                      alt=""
                      className="size-5 shrink-0 rounded-full object-cover"
                    />
                    <TUXText
                      typographyPreset="P2-Regular"
                      color="UIText3"
                      textDisplay="truncate"
                      className="min-w-0"
                    >
                      {card.author}
                    </TUXText>
                    {card.verified ? (
                      <span
                        className="flex size-3 shrink-0 items-center justify-center rounded-full text-[8px] text-white"
                        style={{ backgroundColor: "#20D5EC" }}
                        aria-label="Verified"
                      >
                        ✓
                      </span>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <TUXIconLike size={16} color={getColorCSSVar("UIText3")} />
                    <TUXText typographyPreset="P2-Regular" color="UIText3">
                      {card.likes}
                    </TUXText>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section
          className="mx-1 mt-1 rounded-t bg-tux-v2-ui-page-flat-1 px-3 py-3"
          aria-label="Related searches"
        >
          <TUXText typographyPreset="Headline-Semibold" color="UIText2">
            Others searched for
          </TUXText>
        </section>
        </div>
      ) : (
        <SearchResultsLoading />
      )}
    </div>
  );
}
