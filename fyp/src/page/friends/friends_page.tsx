import {
  getColorCSSVar,
  TUXButton,
  TUXNavBar,
  TUXNavBarIconAction,
  TUXText,
} from "@byted-tiktok/tux-web";
import {
  IconXMarkSmall,
  TUXIconArrowLeftCircleFill,
  TUXIconMagnifyingGlass,
  TUXIconPersonPlus,
} from "@byted-tiktok/tux-icons";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { useAppNavigation } from "../../context/app_navigation";
import { useAppFrame, useTabAppChromeSurfaceTheme } from "../../components/sys/app_frame";
import { useTheme } from "../../context/theme";
import PagePushStage, { usePagePushStage } from "../../hooks/page_push";
import { useTwoLevelRouteStackSync } from "../../hooks/sync_route_page_stack";
import { appPathForRoute } from "../../routes/app_route_tree";
import { InboxDetailPageContent } from "../inbox/components/inbox_detail_page_content";
import type { InboxRowCellRow } from "../inbox/components/inbox_row_cell";
import {
  inboxDetailRowForPeer,
  inboxPageConfig,
  inboxRowById,
  inboxStoryDetailById,
} from "../inbox/inbox_page.config";
import { SocialAvatar } from "../inbox/components/social_avatar";
import { StorySkylightCell } from "../inbox/components/story_skylight_cell";
import { SKYLIGHT_SCROLL_ROW_CLASS } from "../inbox/story_skylight.constants";
import { StoryDetailPageContent } from "../story/story_detail_page_content";
import {
  canOpenStory,
  type StoryCellSummary,
  type StoryDetail,
} from "../story/story.types";

import { FindFriendsPageContent } from "./components/find_friends_page_content";
import { isFindFriendsImmersiveSubpage } from "./components/find_friends/find_friends_subpage.constants";
import { FriendsFeedPost } from "./components/friends_feed_post";
import {
  FRIENDS_FEED_ITEMS,
  FRIENDS_PAST_FEED_ITEMS,
  FRIENDS_SUGGESTED,
  friendsAuthorAvatarUrl,
} from "./friends_feed.config";
import { FriendsPostInteractionProvider } from "./friends_post_interaction_context";

/** Sentinel detail id so the Friends 2-level stack sync treats Find Friends like a detail page. */
const FIND_FRIENDS_DETAIL_ID = "__find_friends__";
const FIND_FRIENDS_STACK_KEY = "friends-find-friends";

type FriendsPageProps = {
  isTabActive?: boolean;
  /** Switches main tab to Home (For You) — used by the feed end-state CTA. */
  onNavigateToHome?: () => void;
  /**
   * Bottom tab bar injected by `App` for the **root** Friends view only.
   * Mirrors the Inbox pattern: when Friends pushes a DM detail, the pushed
   * page intentionally omits this bar so the chat fills the frame (and the
   * global `App`-level tab bar is hidden via `tabBarVisible={false}`).
   */
  bottomTabBar?: ReactNode;
};

type FriendsRootPageContentProps = {
  onNavigateToHome?: () => void;
  initialScrollTop: number;
  onScrollTopChange: (scrollTop: number) => void;
  onOpenDmFromFriends: (peerAuthorId: string, peerDisplayName: string, trigger?: HTMLElement) => void;
  onOpenFindFriends: (trigger?: HTMLElement | null) => void;
  onOpenStory: (story: StoryCellSummary, trigger: HTMLElement) => void;
  initialStoryTrayOpen: boolean;
  onStoryTrayOpenChange: (open: boolean) => void;
  initialStoryTrayScrollLeft: number;
  onStoryTrayScrollLeftChange: (scrollLeft: number) => void;
  revealStoryId?: string | null;
  onRevealStoryHandled: () => void;
  followedFromSuggestedIds: ReadonlySet<string>;
  onFollowFromSuggested: (authorId: string) => void;
  bottomTabBar?: ReactNode;
};

/** Shared story roster — same people as Inbox; Friends tray tweaks presentation only. */
function friendsTrayStoryPresentation(story: StoryCellSummary): StoryCellSummary {
  const { bubble: _bubble, ...withoutBubble } = story;
  if (story.id === "chenyue") {
    return {
      ...withoutBubble,
      hasRing: true,
      ringVariant: "story",
      hasBadge: false,
      badgeVariant: undefined,
    };
  }
  return withoutBubble;
}

const FRIENDS_TRAY_CELL_STORIES = inboxPageConfig.stories.map(friendsTrayStoryPresentation);
const FRIENDS_TRAY_STORIES = FRIENDS_TRAY_CELL_STORIES.filter((story) => story.id !== "create");
const FRIENDS_TRAY_CREATE_SRC =
  inboxPageConfig.stories.find((story) => story.id === "create")?.src ?? "";
const playableFriendsStories = inboxPageConfig.storyDetails.filter((detail) =>
  canOpenStory(friendsTrayStoryPresentation(detail)),
);

function FriendsNavLeadingAvatars({
  storyTrayOpen,
  onToggleStoryTray,
}: {
  storyTrayOpen: boolean;
  onToggleStoryTray: () => void;
}) {
  if (storyTrayOpen) return <div className="w-10 h-11 shrink-0" aria-hidden />;
  const miniStories = FRIENDS_TRAY_STORIES.filter(canOpenStory).slice(0, 2);

  return (
    <div className="flex justify-center items-center gap-0">
      <button
        type="button"
        className="flex justify-center items-center active:opacity-70 rounded-full outline-none w-10 h-11 shrink-0"
        aria-label="Add story"
      >
        <SocialAvatar
          src={FRIENDS_TRAY_CREATE_SRC}
          alt=""
          size={24}
          hasBadge
          badgeVariant="createSmall"
          squarePhoto
        />
      </button>
      <button
        type="button"
        className="box-border flex justify-center items-center active:opacity-70 rounded-[8px] outline-none w-[72px] h-11 overflow-visible shrink-0"
        aria-label="Open friends stories"
        aria-expanded={false}
        onClick={onToggleStoryTray}
      >
        <div className="flex justify-start items-center gap-0">
          {miniStories.map((story, index) => (
            <span
              key={story.id}
              className={`inline-flex relative ${index > 0 ? "-ml-1" : ""}`}
              style={{ zIndex: miniStories.length - index }}
            >
              <SocialAvatar
                src={story.src}
                alt=""
                size={20}
                hasRing
                ringVariant="story"
              />
            </span>
          ))}
        </div>
      </button>
    </div>
  );
}

function FriendsStoryTray({
  showDragHandle,
  onClose,
  onOpenStory,
  initialScrollLeft,
  onScrollLeftChange,
  revealStoryId,
  onRevealStoryHandled,
}: {
  showDragHandle: boolean;
  onClose: () => void;
  onOpenStory: (story: StoryCellSummary, trigger: HTMLElement) => void;
  initialScrollLeft: number;
  onScrollLeftChange: (scrollLeft: number) => void;
  revealStoryId?: string | null;
  onRevealStoryHandled: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Restore scroll once on mount; reveal below may re-run when its id clears,
  // and resetting scrollLeft then would cancel the in-flight smooth scroll.
  const didRestoreScrollRef = useRef(false);
  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller || didRestoreScrollRef.current) return;
    didRestoreScrollRef.current = true;
    scroller.scrollLeft = initialScrollLeft;
  }, [initialScrollLeft]);

  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller || !revealStoryId) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      const targetAvatar = scroller.querySelector<HTMLElement>(
        `[data-story-avatar-id="${revealStoryId}"]`,
      );
      if (!targetAvatar) {
        onRevealStoryHandled();
        return;
      }

      // Story ring overflows the 78px avatar box by gap(4) + stroke(4); keep it
      // plus 2px breathing room inside the viewport when revealing.
      const REVEAL_MARGIN_PX = 10;
      const targetRect = targetAvatar.getBoundingClientRect();
      const scrollRect = scroller.getBoundingClientRect();
      const hiddenLeft = targetRect.left - REVEAL_MARGIN_PX - scrollRect.left;
      const hiddenRight = targetRect.right + REVEAL_MARGIN_PX - scrollRect.right;

      if (hiddenLeft < 0 || hiddenRight > 0) {
        scroller.scrollBy({
          left: hiddenLeft < 0 ? hiddenLeft : hiddenRight,
          behavior: "smooth",
        });
      }
      onRevealStoryHandled();
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [initialScrollLeft, onRevealStoryHandled, revealStoryId]);

  return (
    <motion.section
      className="relative bg-tux-v2-ui-page-flat-1 overflow-hidden shrink-0"
      initial={{ height: 0, opacity: 0, y: -16 }}
      animate={{ height: "auto", opacity: 1, y: 0 }}
      exit={{ height: 0, opacity: 0, y: -16 }}
      transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
      drag="y"
      dragConstraints={{ top: -120, bottom: 0 }}
      dragElastic={{ top: 0.08, bottom: 0 }}
      dragMomentum={false}
      onDragEnd={(_, info) => {
        if (info.offset.y < -42 || info.velocity.y < -520) {
          onClose();
        }
      }}
      aria-label="Friends stories"
    >
      <div
        ref={scrollRef}
        data-story-anchor-scroll
        data-story-anchor-scope="friends"
        className={SKYLIGHT_SCROLL_ROW_CLASS}
        style={{ gap: 0 }}
        onScroll={(event) => {
          onScrollLeftChange(event.currentTarget.scrollLeft);
        }}
      >
        {FRIENDS_TRAY_CELL_STORIES.map((story) => (
          <StorySkylightCell key={story.id} story={story} onOpenStory={onOpenStory} />
        ))}
      </div>
      {showDragHandle ? (
        <div className="bottom-0 absolute inset-x-0 flex justify-center items-start h-5">
          <div className="bg-tux-v2-ui-shape-neutral-3 rounded-full w-9 h-1" />
        </div>
      ) : null}
    </motion.section>
  );
}

function FriendsSuggestedSection() {
  const [removedSuggestedIds, setRemovedSuggestedIds] = useState(() => new Set<string>());
  const visibleSuggestions = FRIENDS_SUGGESTED.filter((u) => !removedSuggestedIds.has(u.id));
  const removeSuggested = (id: string) => {
    setRemovedSuggestedIds((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });
  };

  if (visibleSuggestions.length === 0) return null;

  return (
    <section className="flex flex-col gap-4 bg-tux-v2-ui-page-flat-1 px-4 pt-4 pb-5 border-tux-v2-ui-shape-neutral-3 border-b-[0.5px] border-solid">
      <TUXText typographyPreset="Headline-Semibold" color="UIText1">
        Suggested for you
      </TUXText>
      <div className="box-border flex flex-row flex-nowrap gap-1.5 -mx-4 pb-1 w-friends-carousel-bleed-sm min-w-0 overflow-x-auto overscroll-x-contain touch-pan-x shrink-0 hide-scrollbar">
        <AnimatePresence initial={false}>
          {visibleSuggestions.map((u, i) => {
            const isFirst = i === 0;
            const isLast = i === visibleSuggestions.length - 1;
            return (
              <motion.div
                key={u.id}
                layout
                initial={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
                className={
                  "relative h-51 w-37.5 shrink-0 overflow-hidden rounded-(--tux-v2-radius-content-large,8px)" +
                  (isFirst ? " ml-4" : "") +
                  (isLast ? " mr-4" : "")
                }
                style={{ backgroundColor: getColorCSSVar("UIPageFlat2") }}
              >
                <button
                  type="button"
                  className="top-[8pt] right-[8pt] absolute flex justify-center items-center active:opacity-80 outline-none size-4"
                  aria-label={`Dismiss ${u.name}`}
                  onClick={() => removeSuggested(u.id)}
                >
                  <IconXMarkSmall width={16} height={16} className="text-tux-v2-ui-text-placeholder" />
                </button>
                <div className="flex flex-col items-center px-2 pt-4 text-left">
                  <img
                    src={friendsAuthorAvatarUrl(u.avatarAuthorId, 80)}
                    alt=""
                    className="rounded-full size-20 object-cover"
                    width={80}
                    height={80}
                  />
                  <div className="flex flex-col items-center gap-0.5 mt-3 w-full text-center">
                    <TUXText typographyPreset="Headline-Semibold" color="UIText1" textDisplay="truncate" className="w-full">
                      {u.name}
                    </TUXText>
                    <TUXText typographyPreset="P2-Regular" color="UIText3" textDisplay="truncate" className="w-full">
                      {u.subtitle}
                    </TUXText>
                  </div>
                </div>
                <div className="bottom-3 absolute inset-x-3">
                  <TUXButton
                    text={u.followLabel}
                    themePreset="primary"
                    shapePreset="capsule"
                    sizePreset="small"
                    smoothRadius
                    block
                    onClick={() => removeSuggested(u.id)}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}

function FriendsFeedEnd({ onBackToForYou }: { onBackToForYou: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3.5 px-10 py-5 border-tux-v2-ui-shape-neutral-3 border-b-[0.5px] border-solid text-center">
      <TUXText as="div" typographyPreset="LargeTitle-Bold" color="UIText1" className="leading-none">
        🥳
      </TUXText>
      <TUXText typographyPreset="Headline-Semibold" color="UIText1" align="center">
        You viewed all new posts from friends
      </TUXText>
      <TUXButton
        text="Back to “For You”"
        themePreset="secondary"
        backgroundColor="UIShapeNeutral"
        textColor="UIShapeText1OnNeutral"
        shapePreset="capsule"
        sizePreset="small"
        smoothRadius
        leadingIcon={
          <span
            className="flex justify-center items-center shrink-0"
            style={{ color: getColorCSSVar("UIShapeText1OnNeutral") }}
            aria-hidden
          >
            <TUXIconArrowLeftCircleFill size={16} />
          </span>
        }
        onClick={onBackToForYou}
      />
    </div>
  );
}

function FriendsRootPageContent({
  onNavigateToHome,
  initialScrollTop,
  onScrollTopChange,
  onOpenDmFromFriends,
  onOpenFindFriends,
  onOpenStory,
  initialStoryTrayOpen,
  onStoryTrayOpenChange,
  initialStoryTrayScrollLeft,
  onStoryTrayScrollLeftChange,
  revealStoryId,
  onRevealStoryHandled,
  followedFromSuggestedIds,
  onFollowFromSuggested,
  bottomTabBar,
}: FriendsRootPageContentProps) {
  const { topInsetCss } = useAppFrame();
  const [navShowSeparator, setNavShowSeparator] = useState(false);
  const [storyTrayOpen, setStoryTrayOpenState] = useState(initialStoryTrayOpen);
  const [storyTrayOpenedByTap, setStoryTrayOpenedByTap] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const lastScrollTopRef = useRef(initialScrollTop);
  // The tray unmounts when collapsed, so reveal/scroll state must live here
  // (stays mounted): consume the reveal exactly once, and remember the user's
  // latest tray scroll across collapse/expand instead of the stale snapshot prop.
  const [trayRevealStoryId, setTrayRevealStoryId] = useState<string | null>(
    revealStoryId ?? null,
  );
  const trayScrollLeftRef = useRef(initialStoryTrayScrollLeft);
  const handleTrayScrollLeftChange = useCallback(
    (scrollLeft: number) => {
      trayScrollLeftRef.current = scrollLeft;
      onStoryTrayScrollLeftChange(scrollLeft);
    },
    [onStoryTrayScrollLeftChange],
  );
  const handleTrayRevealHandled = useCallback(() => {
    setTrayRevealStoryId(null);
    onRevealStoryHandled();
  }, [onRevealStoryHandled]);
  // Hoist tray open state to the page parent so the rebuilt root snapshot
  // (after a story push/pop) restores the tray exactly as the user left it.
  const setStoryTrayOpen = useCallback(
    (open: boolean) => {
      setStoryTrayOpenState(open);
      onStoryTrayOpenChange(open);
    },
    [onStoryTrayOpenChange],
  );
  const goHome = useCallback(() => {
    onNavigateToHome?.();
  }, [onNavigateToHome]);

  useLayoutEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    scrollContainer.scrollTop = initialScrollTop;
    lastScrollTopRef.current = initialScrollTop;
  }, [initialScrollTop]);

  return (
    <div
      className="flex flex-col bg-tux-v2-ui-page-flat-1 w-full min-w-0 h-full min-h-0 overflow-hidden"
      style={{ paddingTop: topInsetCss }}
    >
      <TUXNavBar
        heightPreset={44}
        backgroundColor="UIPageFlat1"
        backgroundOpacity={1}
        showSeparator={navShowSeparator}
        titleAlign="center"
        customTitle={
          <TUXText typographyPreset="H3-Bold" color="UIText1">
            Friends
          </TUXText>
        }
        leading={
          <div className="flex flex-1 justify-start items-end min-w-0 min-h-0">
            <FriendsNavLeadingAvatars
              storyTrayOpen={storyTrayOpen}
              onToggleStoryTray={() => {
                setStoryTrayOpenedByTap(true);
                setStoryTrayOpen(!storyTrayOpen);
              }}
            />
          </div>
        }
        trailing={
          <div className="flex items-center">
            <TUXNavBarIconAction
              aria-label="Find friends"
              width="40px"
              height="44px"
              icon={<TUXIconPersonPlus size={24} color="var(--tux-v2-color-ui-text-1)" />}
              onClick={(event) => onOpenFindFriends(event.currentTarget)}
            />
            <TUXNavBarIconAction
              aria-label="Search"
              width="40px"
              height="44px"
              icon={<TUXIconMagnifyingGlass size={24} color="var(--tux-v2-color-ui-text-1)" />}
            />
          </div>
        }
      />

      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto touch-pan-y friends-feed-scroll"
        onScroll={(e) => {
          const scrollTop = e.currentTarget.scrollTop;
          const previousScrollTop = lastScrollTopRef.current;
          const t = scrollTop > 6;
          setNavShowSeparator((c) => (c === t ? c : t));
          if (scrollTop > previousScrollTop + 2) {
            setStoryTrayOpen(false);
          } else if (scrollTop <= 0 && previousScrollTop > scrollTop) {
            setStoryTrayOpenedByTap(false);
            setStoryTrayOpen(true);
          }
          lastScrollTopRef.current = scrollTop;
          onScrollTopChange(scrollTop);
        }}
      >
        <AnimatePresence initial={false}>
          {storyTrayOpen ? (
            <FriendsStoryTray
              showDragHandle={storyTrayOpenedByTap}
              onClose={() => setStoryTrayOpen(false)}
              onOpenStory={onOpenStory}
              initialScrollLeft={trayScrollLeftRef.current}
              onScrollLeftChange={handleTrayScrollLeftChange}
              revealStoryId={trayRevealStoryId}
              onRevealStoryHandled={handleTrayRevealHandled}
            />
          ) : null}
        </AnimatePresence>
        {FRIENDS_FEED_ITEMS.map((item) => (
          <FriendsFeedPost
            key={item.id}
            item={item}
            onOpenDmFromFriends={onOpenDmFromFriends}
            followedFromSuggestedIds={followedFromSuggestedIds}
            onFollowFromSuggested={onFollowFromSuggested}
          />
        ))}
        <FriendsSuggestedSection />
        <FriendsFeedEnd onBackToForYou={goHome} />
        {FRIENDS_PAST_FEED_ITEMS.map((item) => (
          <FriendsFeedPost
            key={item.id}
            item={item}
            onOpenDmFromFriends={onOpenDmFromFriends}
            followedFromSuggestedIds={followedFromSuggestedIds}
            onFollowFromSuggested={onFollowFromSuggested}
          />
        ))}
      </div>

      {bottomTabBar ? <div className="flex-none">{bottomTabBar}</div> : null}
    </div>
  );
}

function FriendsPageInner({
  isTabActive = true,
  onNavigateToHome,
  bottomTabBar,
}: FriendsPageProps) {
  const { route, navigate } = useAppNavigation();
  const { resolvedTheme } = useTheme();
  const friendsSub = route?.tab === "friends" ? route.sub : null;
  const findFriendsStep =
    friendsSub?.screen === "find-friends" ? friendsSub.step : null;
  const friendsChromeTheme =
    friendsSub?.screen === "story" || isFindFriendsImmersiveSubpage(findFriendsStep)
      ? "dark"
      : resolvedTheme;
  useTabAppChromeSurfaceTheme(isTabActive, friendsChromeTheme);
  const rootScrollTopRef = useRef(0);
  const rootStoryTrayOpenRef = useRef(false);
  const rootStoryTrayScrollLeftRef = useRef(0);
  const pendingRevealStoryIdRef = useRef<string | null>(null);
  const storyTransitionSourceRectRef = useRef<DOMRect | null>(null);
  const [followedFromSuggestedIds, setFollowedFromSuggestedIds] = useState(() => new Set<string>());

  const markFollowFromSuggested = useCallback((authorId: string) => {
    setFollowedFromSuggestedIds((prev) => {
      if (prev.has(authorId)) return prev;
      const next = new Set(prev);
      next.add(authorId);
      return next;
    });
  }, []);

  const pageStage = usePagePushStage({
    initialPage: buildFriendsRootPage(),
    initialKey: "friends-root",
    durationMs: 300,
    pageOffset: "24%",
  });
  const { pages, isTransitioning, push, pop, replace, reset } = pageStage;

  useLayoutEffect(() => {
    if (followedFromSuggestedIds.size === 0) return;
    replace(buildFriendsRootPage(), "friends-root");
  }, [followedFromSuggestedIds, replace]);

  const { markStackNavigation } = useTwoLevelRouteStackSync({
    tab: "friends",
    route,
    pages,
    isTransitioning,
    rootKey: "friends-root",
    detailKey: (id) =>
      id === FIND_FRIENDS_DETAIL_ID
        ? FIND_FRIENDS_STACK_KEY
        : id.startsWith("friends-story-")
          ? id
          : `friends-dm-${id}`,
    detailIdFromStackKey: (key) =>
      key === FIND_FRIENDS_STACK_KEY
        ? FIND_FRIENDS_DETAIL_ID
        : key.startsWith("friends-story-")
          ? key
          : key.startsWith("friends-dm-")
            ? key.slice("friends-dm-".length)
            : null,
    getDetailId: (r) => {
      if (r.tab !== "friends") return null;
      if (r.sub.screen === "message") return r.sub.peerId;
      if (r.sub.screen === "find-friends") return FIND_FRIENDS_DETAIL_ID;
      if (r.sub.screen === "story") return `friends-story-${r.sub.storyId}`;
      return null;
    },
    buildRoot: buildFriendsRootPage,
    buildDetail: (id) => {
      if (id === FIND_FRIENDS_DETAIL_ID) return buildFindFriendsPage();
      if (id.startsWith("friends-story-")) {
        const story = inboxStoryDetailById(id.slice("friends-story-".length));
        return story && canOpenStory(story)
          ? buildFriendsStoryPage(story, null)
          : buildFriendsRootPage();
      }
      const row =
        inboxRowById(id) ??
        inboxDetailRowForPeer({ peerAuthorId: id, peerDisplayName: id });
      return buildFriendsDmDetailPage(row);
    },
    detailTransitionStyle: (id) => (id.startsWith("friends-story-") ? "none" : "slide"),
    detailIncomingPageOffset: (id) => (id.startsWith("friends-story-") ? "0%" : undefined),
    detailOutgoingPageOffset: (id) => (id.startsWith("friends-story-") ? "0%" : undefined),
    rootIncomingPageOffset: (id) => (id.startsWith("friends-story-") ? "24%" : undefined),
    push,
    pop,
    reset,
  });

  const handleCloseDmDetail = useCallback(
    (row: InboxRowCellRow, trigger?: HTMLElement | null) => {
      markStackNavigation();
      navigate(appPathForRoute({ tab: "friends", sub: { screen: "feed" } }));
      pop({
        trigger,
        incomingPage: buildFriendsRootPage(),
        outgoingPage: buildFriendsDmDetailPage(row),
      });
    },
    [markStackNavigation, navigate, pop, followedFromSuggestedIds],
  );

  const openDmDetail = useCallback(
    (row: InboxRowCellRow, trigger?: HTMLElement) => {
      markStackNavigation();
      navigate(
        appPathForRoute({
          tab: "friends",
          sub: { screen: "message", peerId: row.id },
        }),
      );
      push({
        trigger,
        outgoingKey: "friends-root",
        outgoingPage: buildFriendsRootPage(),
        incomingKey: `friends-dm-${row.id}`,
        incomingPage: buildFriendsDmDetailPage(row),
      });
    },
    [markStackNavigation, navigate, push, followedFromSuggestedIds],
  );

  const handleCloseFindFriends = useCallback(
    (trigger?: HTMLElement | null) => {
      markStackNavigation();
      navigate(appPathForRoute({ tab: "friends", sub: { screen: "feed" } }));
      pop({
        trigger: trigger ?? undefined,
        incomingPage: buildFriendsRootPage(),
        outgoingPage: buildFindFriendsPage(),
      });
    },
    [markStackNavigation, navigate, pop],
  );

  const openFindFriends = useCallback(
    (trigger?: HTMLElement | null) => {
      markStackNavigation();
      navigate(appPathForRoute({ tab: "friends", sub: { screen: "find-friends" } }));
      push({
        trigger: trigger ?? undefined,
        outgoingKey: "friends-root",
        outgoingPage: buildFriendsRootPage(),
        incomingKey: FIND_FRIENDS_STACK_KEY,
        incomingPage: buildFindFriendsPage(),
      });
    },
    [markStackNavigation, navigate, push],
  );

  const openFriendsStory = useCallback(
    (story: StoryCellSummary, trigger: HTMLElement) => {
      const storyDetail = inboxStoryDetailById(story.id);
      if (!storyDetail || !canOpenStory(story)) {
        return;
      }

      const sourceRect = trigger.getBoundingClientRect();
      storyTransitionSourceRectRef.current = sourceRect;

      markStackNavigation();
      navigate(
        appPathForRoute({
          tab: "friends",
          sub: { screen: "story", storyId: story.id },
        }),
      );
      push({
        trigger,
        outgoingKey: "friends-root",
        outgoingPage: buildFriendsRootPage(),
        outgoingPageOffset: "0%",
        incomingKey: `friends-story-${story.id}`,
        incomingPage: buildFriendsStoryPage(storyDetail, sourceRect),
        incomingPageOffset: "0%",
        transitionStyle: "none",
      });
    },
    [markStackNavigation, navigate, push],
  );

  const handleCloseFriendsStory = useCallback(
    (story: StoryDetail, trigger?: HTMLElement | null) => {
      storyTransitionSourceRectRef.current = null;
      pendingRevealStoryIdRef.current = story.id;
      const trayScroll = trigger?.closest<HTMLElement>("[data-story-anchor-scroll]");
      if (trayScroll) {
        rootStoryTrayScrollLeftRef.current = trayScroll.scrollLeft;
      }
      markStackNavigation();
      navigate(appPathForRoute({ tab: "friends", sub: { screen: "feed" } }));
      pop({
        trigger,
        incomingPage: buildFriendsRootPage(),
        incomingPageOffset: "24%",
        transitionStyle: "none",
      });
    },
    [markStackNavigation, navigate, pop],
  );

  const handleFriendsStoryChange = useCallback(
    (story: StoryDetail) => {
      markStackNavigation();
      navigate(
        appPathForRoute({
          tab: "friends",
          sub: { screen: "story", storyId: story.id },
        }),
        { replace: true },
      );
    },
    [markStackNavigation, navigate],
  );

  function buildFriendsStoryPage(
    story: StoryDetail,
    sourceRect: DOMRect | null = storyTransitionSourceRectRef.current,
  ): ReactNode {
    function FriendsStoryStagePage() {
      return (
        <StoryDetailPageContent
          story={story}
          stories={playableFriendsStories}
          sourceRect={sourceRect}
          anchorScopeId="friends"
          onStoryChange={handleFriendsStoryChange}
          onClose={handleCloseFriendsStory}
        />
      );
    }
    return <FriendsStoryStagePage />;
  }

  function buildFriendsDmDetailPage(row: InboxRowCellRow): ReactNode {
    function FriendsDmDetailStagePage() {
      return <InboxDetailPageContent row={row} onClose={handleCloseDmDetail} />;
    }
    return <FriendsDmDetailStagePage />;
  }

  function buildFindFriendsPage(): ReactNode {
    function FriendsFindFriendsStagePage() {
      return <FindFriendsPageContent tab="friends" onClose={handleCloseFindFriends} />;
    }
    return <FriendsFindFriendsStagePage />;
  }

  function buildFriendsRootPage(): ReactNode {
    function FriendsRootStagePage() {
      return (
        <FriendsRootPageContent
          onNavigateToHome={onNavigateToHome}
          initialScrollTop={rootScrollTopRef.current}
          onScrollTopChange={(scrollTop) => {
            rootScrollTopRef.current = scrollTop;
          }}
          onOpenDmFromFriends={(peerAuthorId, peerDisplayName, trigger) => {
            const row = inboxDetailRowForPeer({ peerAuthorId, peerDisplayName });
            openDmDetail(row, trigger);
          }}
          onOpenFindFriends={openFindFriends}
          onOpenStory={openFriendsStory}
          initialStoryTrayOpen={rootStoryTrayOpenRef.current}
          onStoryTrayOpenChange={(open) => {
            rootStoryTrayOpenRef.current = open;
          }}
          initialStoryTrayScrollLeft={rootStoryTrayScrollLeftRef.current}
          onStoryTrayScrollLeftChange={(scrollLeft) => {
            rootStoryTrayScrollLeftRef.current = scrollLeft;
          }}
          revealStoryId={pendingRevealStoryIdRef.current}
          onRevealStoryHandled={() => {
            pendingRevealStoryIdRef.current = null;
          }}
          followedFromSuggestedIds={followedFromSuggestedIds}
          onFollowFromSuggested={markFollowFromSuggested}
          bottomTabBar={bottomTabBar}
        />
      );
    }
    return <FriendsRootStagePage />;
  }

  return <PagePushStage manager={pageStage} />;
}

/**
 * Wraps the inner page with the per-post interaction provider so like /
 * "View more" state lives ABOVE the `PagePushStage`. The stage stores
 * snapshots of the page tree; props captured in those snapshots stay stale,
 * but a context Provider placed above the stage still injects fresh values
 * into the snapshots' subtrees on every render.
 */
export default function FriendsPage(props: FriendsPageProps) {
  return (
    <FriendsPostInteractionProvider>
      <FriendsPageInner {...props} />
    </FriendsPostInteractionProvider>
  );
}
