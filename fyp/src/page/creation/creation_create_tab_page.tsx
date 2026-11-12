import { TUXNavBar, TUXText, getColorCSSVar } from "@byted-tiktok/tux-web";
import {
  TUXIconAiGenerateBold,
  TUXIconAiSelf,
  TUXIconAiVideoFill,
  TUXIconAutoCutClapperboard,
  TUXIconCirclePlusFill,
  TUXIconDraft,
  TUXIconImageEditFill,
  TUXIconMagnifyingGlass,
} from "@byted-tiktok/tux-icons";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from "react";

import { IconInk } from "../../components/icons/icon_ink";
import { ThemeScope } from "../../context/theme";
import { AppNavBarCloseButton } from "../../components/sys/app_nav_bar_close_button";
import { useCreationCreateRegionTheme } from "./creation_create_region_theme";
import { CreationBottomTabBarFooter } from "./components/creation_bottom_tab_bar";
import { CreationCreateTitleLogo } from "./components/creation_create_title_logo";
import type { CreationPrimaryTabKey } from "./components/creation_primary_tab_bar";
import { useSwipeRightGesture } from "./hooks/use_swipe_right_gesture";
import {
  CREATION_CREATE_CATEGORY_TABS,
  CREATION_CREATE_PRIME_SLOTS,
  CREATION_NEW_VIDEO_NAV_GRADIENT,
  getCreationCreateTemplateCardsForCategory,
  type CreationCreateCategoryTab,
  type CreationPrimeSlot,
  type CreationTemplateCard,
} from "./creation_create_tab.config";

const CREATE_PAGE_ROOT_CLASS =
  "box-border flex h-full min-h-0 w-full flex-col text-tux-v2-ui-text-1 pt-[var(--app-frame-top-inset)]";

const CREATE_PAGE_ROOT_STYLE: CSSProperties = {
  backgroundColor: getColorCSSVar("UIPageFlat1"),
};

export type CreationCreateTabPageProps = {
  onClose: (trigger?: HTMLElement) => void;
  /** Standalone route — footer tab returns to POST. */
  onSelectPost?: (trigger?: HTMLElement) => void;
  /** Shell-owned bottom tab — no duplicate footer. */
  embedded?: boolean;
  onRequestPrimaryTab?: (tab: CreationPrimaryTabKey) => void;
  /** Reserved space above the shared primary tab bar (shell passes camera chrome bottom). */
  bottomChromeInsetCss?: string;
};

/** Figma default `Create page` (624:22962); scrolled-up (629:23270). */
export default function CreationCreateTabPage({
  onClose,
  onSelectPost,
  embedded = false,
  onRequestPrimaryTab,
  bottomChromeInsetCss,
}: CreationCreateTabPageProps) {
  const [activeCategory, setActiveCategory] = useState<CreationCreateCategoryTab>("For you");
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const stickyTabSentinelRef = useRef<HTMLDivElement | null>(null);

  const createRegionTheme = useCreationCreateRegionTheme();
  const categoryTemplates = getCreationCreateTemplateCardsForCategory(activeCategory);
  const leftColumn = categoryTemplates.slice(0, 3);
  const rightColumn = categoryTemplates.slice(3);

  /** Show nav `New` only after the category tab bar has scrolled into its sticky (pinned) position. */
  useEffect(() => {
    const scrollRoot = scrollContainerRef.current;
    const sentinel = stickyTabSentinelRef.current;
    if (!scrollRoot || !sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolledUp((current) => {
          const next = !entry.isIntersecting;
          return current === next ? current : next;
        });
      },
      { root: scrollRoot, threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const returnToPost = useCallback(() => {
    if (embedded) {
      onRequestPrimaryTab?.("post");
      return;
    }
    onSelectPost?.();
  }, [embedded, onRequestPrimaryTab, onSelectPost]);

  const {
    handlePointerDown: handleContentSwipeDown,
    handlePointerUp: handleContentSwipeUp,
    handlePointerCancel: handleContentSwipeCancel,
  } = useSwipeRightGesture(returnToPost);

  const page = (
    <>
      <div className="w-full shrink-0 bg-tux-v2-ui-page-flat-1" data-name="Navigation Bar">
        <TUXNavBar
          heightPreset={44}
          showSeparator={false}
          backgroundColor="UIPageFlat1"
          titleAlign="center"
          leading={
            <div className="flex h-11 items-center">
              <AppNavBarCloseButton
                iconColor={getColorCSSVar("UIText1")}
                onClose={onClose}
              />
            </div>
          }
          customTitle={
            <div className="flex h-11 items-center justify-center" aria-label="CREATE">
              <CreationCreateTitleLogo className="h-[17px] w-[88px]" color="UIText1" />
            </div>
          }
          trailing={
            <div
              className="flex h-11 items-center transition-[opacity,transform] duration-200 ease-out"
              style={{
                opacity: isScrolledUp ? 1 : 0,
                transform: isScrolledUp ? "scale(1)" : "scale(0.96)",
                pointerEvents: isScrolledUp ? "auto" : "none",
              }}
              aria-hidden={!isScrolledUp}
            >
              <NavNewVideoButton />
            </div>
          }
        />
      </div>

      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        style={
          embedded && bottomChromeInsetCss
            ? { paddingBottom: `calc(${bottomChromeInsetCss} + 44px)` }
            : undefined
        }
      >
        <div
          ref={scrollContainerRef}
          className="min-h-0 flex-1 touch-pan-y overflow-y-auto overflow-x-hidden overscroll-y-contain hide-scrollbar bg-tux-v2-ui-page-flat-1"
          onPointerDown={handleContentSwipeDown}
          onPointerUp={handleContentSwipeUp}
          onPointerCancel={handleContentSwipeCancel}
        >
          <div data-name="Collapsible chrome">
            <PrimeSlotRow slots={CREATION_CREATE_PRIME_SLOTS} />

            <div className="flex shrink-0 gap-2 px-3 pb-3">
              <ThemeScope
                mode="light"
                className="relative flex h-[84px] min-w-0 flex-1 items-center justify-center overflow-hidden rounded-(--tux-v2-radius-container-level0-small)"
                style={{ backgroundImage: CREATION_NEW_VIDEO_NAV_GRADIENT }}
              >
                <button type="button" className="flex flex-col items-center gap-1">
                  <CreateChipIconInk>
                    <TUXIconCirclePlusFill size={28} />
                  </CreateChipIconInk>
                  <TUXText typographyPreset="H3-Semibold" color="UIText1">
                    New video
                  </TUXText>
                </button>
              </ThemeScope>
              <button
                type="button"
                className="flex size-[84px] shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-(--tux-v2-radius-container-level0-small) bg-tux-v2-ui-shape-neutral-3 px-3 py-4"
              >
                <IconInk color="UIText1">
                  <TUXIconDraft size={26} />
                </IconInk>
                <TUXText typographyPreset="H3-Semibold" color="UIText1">
                  Drafts
                </TUXText>
              </button>
            </div>

            <div className="flex h-9 shrink-0 items-center gap-3 px-3 pt-1">
              <TUXText typographyPreset="H2-Semibold" color="UIText1" className="min-w-0 flex-1">
                Templates
              </TUXText>
              <button
                type="button"
                aria-label="Search templates"
                className="flex size-8 shrink-0 items-center justify-center rounded-(--tux-v2-radius-content-capsule) bg-tux-v2-ui-shape-neutral-3"
              >
                <IconInk color="UIText1">
                  <TUXIconMagnifyingGlass size={16} />
                </IconInk>
              </button>
            </div>
          </div>

          <div ref={stickyTabSentinelRef} className="h-px w-full shrink-0" aria-hidden />

          <div
            className="sticky top-0 z-10 shrink-0 bg-tux-v2-ui-page-flat-1 pb-2"
            data-name="Tab Bar - Create"
          >
            <CreationCategoryTabBar active={activeCategory} onChange={setActiveCategory} />
          </div>

          <div className="px-3 pb-3 pt-1" data-name="Template list" key={activeCategory}>
            <div className="flex gap-2">
              <TemplateColumn cards={leftColumn} />
              <TemplateColumn cards={rightColumn} />
            </div>
          </div>
        </div>
      </div>

      {!embedded && onSelectPost ? (
        <CreationBottomTabBarFooter onSelectPost={onSelectPost} />
      ) : null}
    </>
  );

  if (embedded) {
    return (
      <div className={CREATE_PAGE_ROOT_CLASS} style={CREATE_PAGE_ROOT_STYLE}>
        {page}
      </div>
    );
  }

  return (
    <ThemeScope
      mode={createRegionTheme}
      className={CREATE_PAGE_ROOT_CLASS}
      style={CREATE_PAGE_ROOT_STYLE}
    >
      {page}
    </ThemeScope>
  );
}

/**
 * TUX icons use `currentColor`; their `color` prop maps to an undefined
 * `text-color-*` class in this app — wrap and set CSS `color` to UIText1.
 */
function CreateChipIconInk({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center"
      style={{ color: getColorCSSVar("UIText1") }}
    >
      {children}
    </span>
  );
}

/** Figma nav trailing `New` capsule (629:23270) — light gradient chip uses light UIText. */
function NavNewVideoButton() {
  return (
    <ThemeScope
      mode="light"
      className="flex h-7 min-w-16 items-center justify-center gap-1 rounded-(--tux-v2-radius-content-capsule) px-[7px] py-2"
      style={{ backgroundImage: CREATION_NEW_VIDEO_NAV_GRADIENT }}
    >
      <button type="button" className="flex items-center gap-1">
        <CreateChipIconInk>
          <TUXIconCirclePlusFill size={14} />
        </CreateChipIconInk>
        <TUXText typographyPreset="P1-Semibold" color="UIText1">
          New
        </TUXText>
      </button>
    </ThemeScope>
  );
}

/** Figma glyph id → TUX icon (see `public/resource/figma/creation-create/icon-*.svg`). */
const PRIME_SLOT_TUX_ICONS: Record<
  CreationPrimeSlot["id"],
  ComponentType<{ size?: number; color?: string }>
> = {
  "photo-editor": TUXIconImageEditFill, // image_edit_fill
  autocut: TUXIconAutoCutClapperboard, // autocut_clapperboard
  "ai-video": TUXIconAiVideoFill, // icon-ai-video.svg
  "ai-image": TUXIconAiGenerateBold, // ai_generate_bold
  "ai-self": TUXIconAiSelf, // ai_self
};

function PrimeSlotRow({ slots }: { slots: readonly CreationPrimeSlot[] }) {
  return (
    <div className="flex w-full shrink-0 items-start px-1" data-name="Prime slots">
      {slots.map((slot) => {
        const Icon = PRIME_SLOT_TUX_ICONS[slot.id];
        return (
          <button
            key={slot.id}
            type="button"
            className="flex min-w-0 flex-1 flex-col items-center gap-2 pb-5 pt-2"
          >
            <span className="flex size-6 shrink-0 items-center justify-center">
              <Icon size={24} color="UIText1" />
            </span>
            <TUXText
              typographyPreset="SmallText1-Semibold"
              color="UIText1"
              className="text-center"
            >
              {slot.label}
            </TUXText>
          </button>
        );
      })}
    </div>
  );
}

/** Match Home feed top tabs — fade only when scrolled off an edge. */
const CATEGORY_TAB_EDGE_FADE_PX = 32;

function CreationCategoryTabBar({
  active,
  onChange,
}: {
  active: CreationCreateCategoryTab;
  onChange: (tab: CreationCreateCategoryTab) => void;
}) {
  const tabScrollRef = useRef<HTMLDivElement | null>(null);
  const [hasLeftFade, setHasLeftFade] = useState(false);
  const [hasRightFade, setHasRightFade] = useState(false);

  useEffect(() => {
    const updateTabFadeState = () => {
      const element = tabScrollRef.current;
      if (!element) return;

      const hasOverflow = element.scrollWidth - element.clientWidth > 1;
      if (!hasOverflow) {
        setHasLeftFade(false);
        setHasRightFade(false);
        return;
      }

      const maxScrollLeft = element.scrollWidth - element.clientWidth;
      const atStart = element.scrollLeft <= 1;
      const atEnd = maxScrollLeft - element.scrollLeft <= 1;

      setHasLeftFade(!atStart);
      setHasRightFade(!atEnd);
    };

    updateTabFadeState();
    const element = tabScrollRef.current;
    element?.addEventListener("scroll", updateTabFadeState, { passive: true });
    window.addEventListener("resize", updateTabFadeState);

    return () => {
      element?.removeEventListener("scroll", updateTabFadeState);
      window.removeEventListener("resize", updateTabFadeState);
    };
  }, []);

  const tabEdgeMaskImage =
    hasLeftFade && hasRightFade
      ? `linear-gradient(to right, transparent 0, ${getColorCSSVar("BrandTikTokBlack")} ${CATEGORY_TAB_EDGE_FADE_PX}px, ${getColorCSSVar("BrandTikTokBlack")} calc(100% - ${CATEGORY_TAB_EDGE_FADE_PX}px), transparent 100%)`
      : hasLeftFade
        ? `linear-gradient(to right, transparent 0, ${getColorCSSVar("BrandTikTokBlack")} ${CATEGORY_TAB_EDGE_FADE_PX}px, ${getColorCSSVar("BrandTikTokBlack")} 100%)`
        : hasRightFade
          ? `linear-gradient(to right, ${getColorCSSVar("BrandTikTokBlack")} 0, ${getColorCSSVar("BrandTikTokBlack")} calc(100% - ${CATEGORY_TAB_EDGE_FADE_PX}px), transparent 100%)`
          : undefined;
  const tabEdgeMaskStyle: CSSProperties = tabEdgeMaskImage
    ? {
        WebkitMaskImage: tabEdgeMaskImage,
        maskImage: tabEdgeMaskImage,
      }
    : {};

  return (
    <div className="relative h-10 shrink-0 overflow-hidden">
      <div className="min-w-0 overflow-hidden" style={tabEdgeMaskStyle}>
        <div
          ref={tabScrollRef}
          className="flex h-10 w-full items-center overflow-x-auto pl-3 hide-scrollbar"
        >
          <div className="flex min-w-max items-center gap-5">
            {CREATION_CREATE_CATEGORY_TABS.map((tab) => {
              const selected = tab === active;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => onChange(tab)}
                  className="relative flex h-10 shrink-0 items-center justify-center"
                  aria-pressed={selected}
                >
                  <TUXText
                    typographyPreset="H4-Semibold"
                    color={selected ? "UIText1" : "UIText3"}
                    className="whitespace-nowrap"
                  >
                    {tab}
                  </TUXText>
                  {selected ? (
                    <span className="absolute bottom-0 h-0.5 w-[22px] rounded-(--tux-v2-radius-content-tiny) bg-tux-v2-ui-text-1" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateColumn({ cards }: { cards: CreationTemplateCard[] }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      {cards.map((card) => (
        <article key={card.id} className="flex w-full flex-col gap-2">
          <div
            className="relative w-full overflow-hidden rounded-(--tux-v2-radius-container-level2-small) bg-tux-v2-ui-shape-neutral-4"
            style={{ aspectRatio: card.aspectRatio }}
          >
            {card.src ? (
              <img
                src={card.src}
                alt=""
                className="pointer-events-none absolute inset-0 size-full object-cover"
                draggable={false}
              />
            ) : null}
          </div>
          <div className="flex flex-col gap-0.5 pl-1">
            <TUXText typographyPreset="P1-Semibold" color="UIText1">
              {card.title}
            </TUXText>
            <TUXText typographyPreset="P3-Regular" color="UIText3">
              {card.subtitle}
            </TUXText>
          </div>
        </article>
      ))}
    </div>
  );
}
