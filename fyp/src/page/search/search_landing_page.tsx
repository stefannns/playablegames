import type { ReactNode } from "react";
import { TUXText, getColorCSSVar } from "@byted-tiktok/tux-web";
import { IconChevronLeftOffsetLTR, TUXIconLike } from "@byted-tiktok/tux-icons";

import { useAppFrame, useTabAppChromeSurfaceTheme } from "../../components/sys/app_frame";
import { SearchSourceAvatarStack } from "./components/search_source_avatar_stack";

type SearchLandingPageProps = {
  isTabActive?: boolean;
  onBack: () => void;
};

const CRNA_VIDEO_1 =
  "https://www.figma.com/api/mcp/asset/101db24a-b7e1-4ef2-bd18-04aaba1caee9";
const CRNA_VIDEO_2 =
  "https://www.figma.com/api/mcp/asset/9096a71c-f2a4-41f0-8cf1-4ebc00a64b3d";
const CRNA_THUMBS_UP =
  "https://www.figma.com/api/mcp/asset/828e526f-bac6-48c0-a029-c8fcfa825b40";
const CRNA_THUMBS_DOWN =
  "https://www.figma.com/api/mcp/asset/1da76a8f-2eff-41e3-8527-e05113dfa5cc";
const CRNA_SHARE =
  "https://www.figma.com/api/mcp/asset/ca1edf5c-658c-4eb0-a2de-1c8433d2765d";
const CRNA_COPY =
  "https://www.figma.com/api/mcp/asset/d8011a34-a623-44fb-9e3f-b77417c18306";

const RESULTS_SHOW_ITEMS = [
  {
    label: "Tour dates listed",
    body: (
      <>
        {" "}
        (no outfit details): one TikTok clip shows a long list of 2026 tour stops
        and dates, but no photos/videos of what Carín León is wearing.
        <sup className="text-[10px]">1</sup>
      </>
    ),
  },
  {
    label: "General outfit inspiration pages",
    body: (
      <>
        : Pinterest and Lemon8-style pages share styling ideas for Carín León
        concerts (Western/casual + bold accessories), but none cite a specific 2026
        green outfit.
        <sup className="text-[10px]">2</sup>
        <sup className="text-[10px]">3</sup>
        <sup className="text-[10px]">4</sup>
        <sup className="text-[10px]">5</sup>
      </>
    ),
  },
  {
    label: "No direct visual match",
    body: ": none of the clips or pages provide a clear image of a green Carín León concert outfit from 2026.",
  },
] as const;

const VERIFY_LOOK_ITEMS = [
  {
    label: null,
    body: (
      <>
        Check Carín León&apos;s <span className="font-semibold">official social accounts</span>{" "}
        (Instagram/Twitter) and the <span className="font-semibold">official tour site</span>{" "}
        for photos/videos from the exact date you&apos;re looking for.
      </>
    ),
  },
  {
    label: null,
    body: (
      <>
        Search TikTok for the <span className="font-semibold">exact city/date</span> + &quot;Carín
        León outfit&quot; to find fan posts from that night.
      </>
    ),
  },
] as const;

function HollowBullet() {
  return (
    <span
      className="mt-[8px] size-[5px] shrink-0 rounded-full border border-tux-v2-ui-text-3"
      aria-hidden
    />
  );
}

function MarkdownSection({
  title,
  items,
}: {
  title: string;
  items: readonly { label: string | null; body: ReactNode }[];
}) {
  return (
    <section className="flex flex-col gap-2">
      <TUXText as="h2" typographyPreset="H3-Bold" color="UIText1Display">
        {title}
      </TUXText>
      <ul className="flex list-none flex-col gap-2 text-[15px] leading-[1.5] text-tux-v2-ui-text-1-display">
        {items.map((item, index) => (
          <li key={item.label ?? index} className="flex gap-2">
            <HollowBullet />
            <span className="min-w-0 flex-1">
              {item.label ? (
                <>
                  <span className="font-semibold">{item.label}</span>
                  {item.body}
                </>
              ) : (
                item.body
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RelatedVideoCard({ image }: { image: string }) {
  return (
    <div className="relative h-[203px] w-[152px] shrink-0 overflow-hidden rounded-lg">
      <img
        src={image}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42px] bg-gradient-to-b from-transparent to-black/30" />
      <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white drop-shadow">
        <TUXIconLike size={20} color="#fff" />
        <span className="text-[13px] font-medium leading-[1.3]">7.3K</span>
      </div>
    </div>
  );
}

function IconActionButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-lg bg-tux-v2-ui-sheet-grouped-1"
    >
      <img src={icon} alt="" className="size-5" loading="lazy" />
    </button>
  );
}

export default function SearchLandingPage({
  isTabActive = true,
  onBack,
}: SearchLandingPageProps) {
  const { topInsetCss } = useAppFrame();
  useTabAppChromeSurfaceTheme(isTabActive, "light");

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden bg-tux-v2-ui-page-flat-1"
      style={{ paddingTop: topInsetCss }}
    >
      <div className="flex h-11 shrink-0 items-center px-1.5">
        <button
          type="button"
          aria-label="Back to search results"
          onClick={onBack}
          className="flex size-11 items-center justify-center"
          style={{ color: getColorCSSVar("UIText1") }}
        >
          <IconChevronLeftOffsetLTR width={28} height={28} />
        </button>
      </div>

      <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">
        <main className="flex flex-col gap-6 px-4 pb-6">
          <header className="flex flex-col gap-1 pt-3">
            <h1 className="text-[32px] font-bold leading-[1.2] text-tux-v2-ui-text-1">
              Carín León 2026 Concert Outfit: Green Look
            </h1>
            <div className="flex items-center gap-2">
              <TUXText typographyPreset="P2-Regular" color="UIText2">
                AI summarized from content:
              </TUXText>
              <SearchSourceAvatarStack extraCount={12} />
            </div>
          </header>

          <section className="text-[15px] leading-[1.5] text-tux-v2-ui-text-1-display">
            <p>
              <span className="font-semibold bg-tux-v2-ui-shape-info-4 px-0.5 [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
                No verified TikTok or web source in these results shows what Carín
                León wore on stage at any 2026 concert
              </span>
              , so there&apos;s no confirmed &quot;green outfit&quot; image or description
              tied to his 2026 shows. The clips and pages here only list tour dates
              and general outfit inspiration, not a specific onstage look.
            </p>
          </section>

          <MarkdownSection title="What the results do show" items={RESULTS_SHOW_ITEMS} />
          <MarkdownSection title="Quick way to verify the look" items={VERIFY_LOOK_ITEMS} />

          <section className="flex flex-col gap-2">
            <TUXText as="h2" typographyPreset="H3-Bold" color="UIText1Display">
              If you&apos;re trying to recreate the look
            </TUXText>
            <p className="text-[15px] leading-[1.5] text-tux-v2-ui-text-1-display">
              Use the inspiration pages as a base (Western + bold accessories), then
              match the color palette to the venue lighting and your personal comfort.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <TUXText as="h2" typographyPreset="H2-Bold" color="UIText1Display">
              Related videos
            </TUXText>
            <div className="-mr-4 flex gap-2 overflow-x-auto pb-3 hide-scrollbar">
              <RelatedVideoCard image={CRNA_VIDEO_1} />
              <RelatedVideoCard image={CRNA_VIDEO_2} />
            </div>
          </section>
        </main>

        <footer className="flex flex-col gap-6 px-4 pb-6">
          <TUXText typographyPreset="P3-Regular" color="UIText3">
            Generated by AI for reference only.
          </TUXText>
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <IconActionButton icon={CRNA_THUMBS_UP} label="Helpful" />
              <IconActionButton icon={CRNA_THUMBS_DOWN} label="Not helpful" />
            </div>
            <div className="flex gap-3">
              <IconActionButton icon={CRNA_SHARE} label="Share" />
              <IconActionButton icon={CRNA_COPY} label="Copy" />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
