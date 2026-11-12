import { isPlayableContentId } from "./components/playable_content";
import { PlayableFeedCard } from "./components/playable_feed";
import { usePlayableNavigation } from "./components/playable_navigation";
import { PLAYABLE_BATCH_GAMES, isBatchReview } from "./components/playable_batch_games";
import { getColorCSSVar, TUXNavBar, TUXText } from "@byted-tiktok/tux-web";
import { IconLiveEntrance, IconMagnifyingGlass } from "@byted-tiktok/tux-icons";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { flushSync } from "react-dom";
import { createPortal } from "react-dom";
import { useTabAppChromeSurfaceTheme } from "../../components/sys/app_frame";
import { APP_Z_OVERLAY } from "../../components/sys/app_z_index";
import VerticalSnapPager, {
  type VerticalSnapPagerHandle,
} from "../../components/utilities/vertical_snap_pager";
import { ThemeScope, useTheme, type ResolvedTheme } from "../../context/theme";
import { useVisitorProfile } from "../../context/visitor_profile";
import { useAppNavigation } from "../../context/app_navigation";
import { appPathForRoute } from "../../routes/app_route_tree";
import { useCommentPanelVisualStore } from "./components/comment_panel/comment_panel_visual_store";
import {
  CommentPanel,
  closeCommentPanel,
  getActiveCommentPanelBinding,
  useCommentPanelHost,
} from "./components/comment_panel";
import { useMusicDetailVisualStore } from "./components/music_detail_visual_store";

import { FeedCard } from "./components/feed_card";
import { homeFeedItemContents } from "./components/feed_item_card.config";
import ExploreFeedPage from "./components/explore_feed_page";
import {
  buildExploreDetailHref,
  buildExploreDetailSnapshot,
  exploreFeedItemsById,
  parseExploreDetailItemId,
  type ExploreFeedItem,
} from "./components/explore_feed_data";
import { FeedItemCard, type FeedItemCardContent } from "./components/feed_item_card";
import { setFeedSidebarState, useFeedSidebarStore } from "./components/sidebar/feed_sidebar_store";
import { PhotoTextDevProvider } from "./components/photo_text_dev_context";
import {
  HOME_FEED_IMAGE_PARAM,
  HOME_FEED_PARAM,
  cancelPendingPhotoTextExitTransition,
  navigateWithinApp,
  runPendingPhotoTextDetailExitTransition,
  savePhotoTextDetailSourceFrame,
  savePhotoTextDetailSnapshot,
} from "../photo_text_detail/photo_text_detail_route";
import PhotoTextDetailRoutePage from "../photo_text_detail/photo_text_detail_route_page";
import { setHomeForYouActivePageKind } from "./components/feed_card.config";

type HomeTab = {
  id: "stem" | "explore" | "singapore" | "following" | "shop" | "for-you";
  label: string;
};

const HOME_TABS: HomeTab[] = [
  { id: "stem", label: "STEM" },
  { id: "explore", label: "Explore" },
  { id: "singapore", label: "Singapore" },
  { id: "following", label: "Following" },
  { id: "shop", label: "Shop" },
  { id: "for-you", label: "For You" },
];

const HOME_EXPLORE_SURFACE_ATTR = "data-home-explore-surface";

/** For You 列表中异形卡所在位置：第三个（Playable 插入第二条） */
/** Located by id: the playables interleaved into For You shift every position. */
const FEED_CARD_SLOT_INDEX = homeFeedItemContents.findIndex((content) => content.id === "feed-card-slot");

function setHomeExploreSurfaceTheme(theme: ResolvedTheme | null) {
  if (typeof document === "undefined") return;
  if (theme === "light") {
    document.documentElement.setAttribute(HOME_EXPLORE_SURFACE_ATTR, "light");
  } else {
    document.documentElement.removeAttribute(HOME_EXPLORE_SURFACE_ATTR);
  }
}

export default function HomePage({
  isTabActive = true,
  onSurfaceThemeChange,
  fypOnly = false,
  feedNavigation,
}: {
  isTabActive?: boolean;
  onSurfaceThemeChange?: (theme: ResolvedTheme) => void;
  fypOnly?: boolean;
  feedNavigation?: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const { navigate } = useAppNavigation();
  const batchReview = fypOnly || isBatchReview();
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<Partial<Record<HomeTab["id"], HTMLButtonElement | null>>>({});
  const hasInitScrollRef = useRef(false);
  const [tabsHasLeftFade, setTabsHasLeftFade] = useState(false);
  const [tabsHasRightFade, setTabsHasRightFade] = useState(false);
  const [activeTabId, setActiveTabId] = useState<HomeTab["id"]>(() => {
    if (batchReview) return "for-you";
    if (typeof window === "undefined") return "for-you";
    return parseExploreDetailItemId(window.location.search) ? "explore" : "for-you";
  });
  const [exploreDetailItemId, setExploreDetailItemId] = useState<string | null>(() => {
    if (batchReview) return null;
    if (typeof window === "undefined") return null;
    return parseExploreDetailItemId(window.location.search);
  });
  const [sharedImageFeedId, setSharedImageFeedId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get(HOME_FEED_PARAM);
  });
  const [appFrameOverlayRoot, setAppFrameOverlayRoot] =
    useState<HTMLElement | null>(null);
  const pagerRef = useRef<VerticalSnapPagerHandle | null>(null);
  const playableNavigation = usePlayableNavigation(appFrameOverlayRoot, batchReview ? {
    onNext: () => { playableNavigation.close(); pagerRef.current?.next(); },
    onPrevious: () => { playableNavigation.close(); pagerRef.current?.prev(); },
  } : undefined);
  const initialFeedRouteState = useMemo(() => {
    if (typeof window === "undefined") {
      return { feedIndex: 0, imageIndex: 0, feedId: null as string | null };
    }
    const params = new URLSearchParams(window.location.search);
    const feedId = params.get(HOME_FEED_PARAM) ?? (window.location.pathname === "/app/home/playable" ? "playable-hotpot" : null);
    const imageIndex = Number.parseInt(
      params.get(HOME_FEED_IMAGE_PARAM) ?? "0",
      10,
    );
    if (!feedId) {
      return { feedIndex: 0, imageIndex: 0, feedId: null as string | null };
    }
    const matchedIndex = homeFeedItemContents.findIndex(
      (content) => content.id === feedId,
    );
    return {
      feedIndex: matchedIndex >= 0 ? matchedIndex : 0,
      imageIndex:
        Number.isFinite(imageIndex) && imageIndex >= 0 ? imageIndex : 0,
      feedId,
    };
  }, []);
  const initialFeedIndex = initialFeedRouteState.feedIndex;
  const [activeFeedIndex, setActiveFeedIndex] = useState(initialFeedIndex);
  const [feedCardDismissed, setFeedCardDismissed] = useState(false);
  const pendingJumpToLogicalRef = useRef<number | null>(null);
  const reviewHost = useMemo(() => batchReview ? new URLSearchParams(window.location.search).get("reviewHost") : null, [batchReview]);
  useEffect(() => {
    if (!batchReview) return;
    const content = homeFeedItemContents[activeFeedIndex];
    const game = content && Object.hasOwn(PLAYABLE_BATCH_GAMES, content.id)
      ? PLAYABLE_BATCH_GAMES[content.id as keyof typeof PLAYABLE_BATCH_GAMES] : null;
    if (!game) return;
    if (window.parent !== window && reviewHost) {
      window.parent.postMessage({type:"playable-batch-selection",taskId:game.taskId,total:homeFeedItemContents.length,reviewPool:new URLSearchParams(window.location.search).get("reviewPool"),reviewLocale:new URLSearchParams(window.location.search).get("lang")==="it"?"it":"en"}, reviewHost === "null" ? "*" : reviewHost);
    }
    const url = new URL(window.location.href);
    url.searchParams.set("feed", content.id);
    window.history.replaceState(window.history.state, "", url);
  }, [batchReview, activeFeedIndex, reviewHost]);
  useEffect(() => {
    if (!batchReview || window.parent === window || !reviewHost) return;
    const receive = (event: MessageEvent) => {
      if (event.source !== window.parent || event.origin !== reviewHost) return;
      if (event.data?.type === "playable-batch-select") {
        if (typeof event.data.taskId !== "string") return;
        const feedId = "playable-batch-" + event.data.taskId;
        if (!Object.hasOwn(PLAYABLE_BATCH_GAMES, feedId)) return;
        const target = homeFeedItemContents.findIndex(content => content.id === feedId);
        if (target < 0) return;
        playableNavigation.close();
        pagerRef.current?.jumpToLogical(target);
        // This pager is controlled; a direct jump must also update its logical state.
        setActiveFeedIndex(target);
      } else if (event.data?.type === "playable-batch-step") {
        if (event.data.direction !== "next" && event.data.direction !== "previous") return;
        playableNavigation.close();
        if (event.data.direction === "next") pagerRef.current?.next();
        else pagerRef.current?.prev();
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [batchReview, reviewHost, playableNavigation.close]);
  const {
    openVisitorProfile,
    beginVisitorDrag,
    setVisitorDragProgress,
    endVisitorDrag,
  } = useVisitorProfile();
  const resolveActiveFeedContent = useCallback((): FeedItemCardContent | null => {
    if (feedCardDismissed) {
      const list = homeFeedItemContents.filter((_, i) => i !== FEED_CARD_SLOT_INDEX);
      return list[activeFeedIndex] ?? null;
    }
    // Pager index aligns 1:1 with `homeFeedItemContents` (index 1 =异形卡，无客态 profile).
    const content = homeFeedItemContents[activeFeedIndex];
    if (!content || content.id === "feed-card-slot") return null;
    return content;
  }, [activeFeedIndex, feedCardDismissed]);

  // feed card（异形卡）槽位没有客态内容，左滑不应进 profile（否则推出空白页）。
  // 用这个标记保证 move/end 只在真正起手了的拖拽里生效。
  const visitorDragActiveRef = useRef(false);
  const handleVisitorHorizontalStart = useCallback(() => {
    const content = resolveActiveFeedContent();
    if (content) {
      visitorDragActiveRef.current = true;
      beginVisitorDrag(content);
    } else {
      visitorDragActiveRef.current = false;
    }
  }, [beginVisitorDrag, resolveActiveFeedContent]);
  const handleVisitorHorizontalMove = useCallback(
    (progress: number) => {
      if (!visitorDragActiveRef.current) return;
      setVisitorDragProgress(progress);
    },
    [setVisitorDragProgress],
  );
  const handleVisitorHorizontalEnd = useCallback(
    (commit: boolean) => {
      if (!visitorDragActiveRef.current) return;
      visitorDragActiveRef.current = false;
      endVisitorDrag(commit);
    },
    [endVisitorDrag],
  );
  const exploreDetailItem = useMemo(
    () =>
      exploreDetailItemId
        ? exploreFeedItemsById[exploreDetailItemId] ?? null
        : null,
    [exploreDetailItemId],
  );
  const {
    isOpen: isCommentPanelOpen,
    preserveFeedChrome: preserveCommentFeedChrome,
  } = useCommentPanelVisualStore();
  const { isOpen: isMusicDetailOpen } = useMusicDetailVisualStore();
  const {
    isOpen: isSidebarOpen,
    isDragging: isSidebarDragging,
    dragOffsetPx: sidebarDragOffsetPx,
  } = useFeedSidebarStore();
  const isSidebarVisible =
    isSidebarOpen || isSidebarDragging || sidebarDragOffsetPx > 0;
  const shouldHideFeedChrome = isCommentPanelOpen && !preserveCommentFeedChrome;
  const shouldHideHomeTopChrome = playableNavigation.playing ||
    shouldHideFeedChrome || Boolean(exploreDetailItem) || isMusicDetailOpen;
  const isExploreTab = activeTabId === "explore";
  const surfaceTheme: ResolvedTheme = isExploreTab ? resolvedTheme : "dark";
  useTabAppChromeSurfaceTheme(isTabActive, surfaceTheme);
  const isLightSurface = surfaceTheme === "light";

  const topChromeColor = getColorCSSVar("UIText1");
  const overlayTextStyle: CSSProperties = {
    color: topChromeColor,
  };
  const openSidebar = () => {
    setFeedSidebarState({
      isOpen: true,
      isDragging: false,
      dragOffsetPx: 0,
    });
  };
  const inactiveTabOpacity = isLightSurface ? 0.45 : 0.7;
  const tabEdgeMaskImage =
    tabsHasLeftFade && tabsHasRightFade
      ? `linear-gradient(to right, transparent 0, ${getColorCSSVar("BrandTikTokBlack")} 32px, ${getColorCSSVar("BrandTikTokBlack")} calc(100% - 32px), transparent 100%)`
      : tabsHasLeftFade
        ? `linear-gradient(to right, transparent 0, ${getColorCSSVar("BrandTikTokBlack")} 32px, ${getColorCSSVar("BrandTikTokBlack")} 100%)`
        : tabsHasRightFade
          ? `linear-gradient(to right, ${getColorCSSVar("BrandTikTokBlack")} 0, ${getColorCSSVar("BrandTikTokBlack")} calc(100% - 32px), transparent 100%)`
          : undefined;
  const tabEdgeMaskStyle: CSSProperties = tabEdgeMaskImage
    ? {
        WebkitMaskImage: tabEdgeMaskImage,
        maskImage: tabEdgeMaskImage,
      }
    : {};

  const forYouPages = useMemo(
    () => {
      const list = feedCardDismissed
        ? homeFeedItemContents.filter((_, i) => i !== FEED_CARD_SLOT_INDEX)
        : homeFeedItemContents;

      return list.map((content, index) => {
        if (batchReview) {
          const distance = Math.abs(index - activeFeedIndex);
          // Keep only current + neighbouring review cards mounted, even with the pager's loop strip.
          if (Math.min(distance, list.length - distance) > 1) {
            return <div key={content.id} className="h-full w-full bg-black" aria-hidden />;
          }
        }
        if (isPlayableContentId(content.id)) {
          const contentId = content.id;
          return <PlayableFeedCard key={contentId} contentId={contentId} onPlay={() => playableNavigation.open(contentId)} playing={playableNavigation.playing && playableNavigation.contentId === contentId} />;
        }
        if (
          !feedCardDismissed &&
          index === FEED_CARD_SLOT_INDEX &&
          content === homeFeedItemContents[FEED_CARD_SLOT_INDEX]
        ) {
          return (
            <FeedCard
              key="feed-card-profile-promo"
              variant="profile-promo"
              onNotInterested={() => {
                pagerRef.current?.next();
                window.setTimeout(() => {
                  pendingJumpToLogicalRef.current = FEED_CARD_SLOT_INDEX;
                  setFeedCardDismissed(true);
                }, 500);
              }}
            />
          );
        }
        const originalIndex = homeFeedItemContents.indexOf(content);
        return (
          <FeedItemCard
            key={content.id}
            index={originalIndex + 1}
            total={homeFeedItemContents.length}
            content={content}
            surfaceTheme={surfaceTheme}
            onOpenProfile={() => openVisitorProfile(content)}
            onProfileSwipeStart={() => beginVisitorDrag(content)}
            onProfileSwipeMove={setVisitorDragProgress}
            onProfileSwipeEnd={endVisitorDrag}
            isActive={index === activeFeedIndex}
            pausedByOverlay={index === activeFeedIndex && isSidebarVisible}
            isVisiblePhotoTextSource={
              activeTabId === "for-you" && activeFeedIndex === index
            }
            initialPhotoTextImageIndex={
              content.id === initialFeedRouteState.feedId
                ? initialFeedRouteState.imageIndex
                : undefined
            }
          />
        );
      });
    },
    [
      playableNavigation.open,
      playableNavigation.playing,
      playableNavigation.contentId,
      batchReview,
      activeFeedIndex,
      activeTabId,
      feedCardDismissed,
      initialFeedRouteState.feedId,
      initialFeedRouteState.imageIndex,
      isSidebarVisible,
      openVisitorProfile,
      beginVisitorDrag,
      setVisitorDragProgress,
      endVisitorDrag,
      surfaceTheme,
    ],
  );

  const scrollTabToBestPosition = (tabId: HomeTab["id"]) => {
    const scrollEl = tabScrollRef.current;
    const targetButton = tabButtonRefs.current[tabId];
    if (!scrollEl || !targetButton) return;

    const maxScrollLeft = scrollEl.scrollWidth - scrollEl.clientWidth;
    if (maxScrollLeft <= 1) return;

    const targetCenter = targetButton.offsetLeft + targetButton.offsetWidth / 2;
    const targetRatio = targetCenter / Math.max(1, scrollEl.scrollWidth);

    let nextScrollLeft = 0;
    if (targetRatio <= 1 / 3) {
      nextScrollLeft = 0;
    } else if (targetRatio >= 2 / 3) {
      nextScrollLeft = maxScrollLeft;
    } else {
      nextScrollLeft = Math.min(
        maxScrollLeft,
        Math.max(0, targetCenter - scrollEl.clientWidth / 2),
      );
    }

    scrollEl.scrollTo({ left: nextScrollLeft, behavior: "smooth" });
  };

  const handleHomeTabClick = (tabId: HomeTab["id"]) => {
    if (batchReview && tabId !== "for-you") return;
    const nextSurfaceTheme = tabId === "explore" ? resolvedTheme : "dark";
    setActiveTabId(tabId);
    onSurfaceThemeChange?.(nextSurfaceTheme);
    setHomeExploreSurfaceTheme(nextSurfaceTheme);
    scrollTabToBestPosition(tabId);
  };

  const handleSearchClick = () => {
    if (batchReview) return;
    navigate(appPathForRoute({ tab: "home", sub: { screen: "search-middle" } }));
  };

  useEffect(() => {
    if (activeTabId === "for-you") return;
    setActiveFeedIndex(0);
  }, [activeTabId]);

  useEffect(() => {
    onSurfaceThemeChange?.(surfaceTheme);
    setHomeExploreSurfaceTheme(surfaceTheme);
    return () => setHomeExploreSurfaceTheme(null);
  }, [onSurfaceThemeChange, surfaceTheme]);

  useEffect(() => {
    if (activeTabId !== "for-you") {
      setHomeForYouActivePageKind("feed-item");
      return;
    }
    const onFeedCard =
      !feedCardDismissed && activeFeedIndex === FEED_CARD_SLOT_INDEX;
    setHomeForYouActivePageKind(onFeedCard ? "feed-card" : "feed-item");
  }, [activeFeedIndex, activeTabId, feedCardDismissed]);

  useLayoutEffect(() => {
    if (!feedCardDismissed) return;
    const target = pendingJumpToLogicalRef.current;
    if (target == null) return;
    pendingJumpToLogicalRef.current = null;
    pagerRef.current?.jumpToLogical(target);
    setActiveFeedIndex(target);
  }, [feedCardDismissed]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    setAppFrameOverlayRoot(
      document.querySelector<HTMLElement>('[data-app-frame-root="true"]'),
    );
  }, []);

  useEffect(() => {
    if (!exploreDetailItem) return;
    savePhotoTextDetailSnapshot(buildExploreDetailSnapshot(exploreDetailItem));
  }, [exploreDetailItem]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncDetailFromLocation = () => {
      if (batchReview) return;
      const nextExploreItemId = parseExploreDetailItemId(window.location.search);
      const nextFeedId = new URLSearchParams(window.location.search).get(
        HOME_FEED_PARAM,
      );
      flushSync(() => {
        setExploreDetailItemId((previous) =>
          previous === nextExploreItemId ? previous : nextExploreItemId,
        );
        setSharedImageFeedId((previous) =>
          previous === nextFeedId ? previous : nextFeedId,
        );
        if (nextExploreItemId) {
          setActiveTabId("explore");
        }
      });

      if (runPendingPhotoTextDetailExitTransition()) return;

      window.requestAnimationFrame(() => {
        if (runPendingPhotoTextDetailExitTransition()) return;
        window.requestAnimationFrame(() => {
          if (runPendingPhotoTextDetailExitTransition()) return;
          cancelPendingPhotoTextExitTransition();
        });
      });
    };

    syncDetailFromLocation();
    window.addEventListener("popstate", syncDetailFromLocation);
    return () => window.removeEventListener("popstate", syncDetailFromLocation);
  }, [batchReview]);

  useEffect(() => {
    const updateTabsFadeState = () => {
      const element = tabScrollRef.current;
      if (!element) return;

      const hasOverflow = element.scrollWidth - element.clientWidth > 1;
      if (hasOverflow && !hasInitScrollRef.current) {
        element.scrollLeft = element.scrollWidth;
        hasInitScrollRef.current = true;
      }

      if (!hasOverflow) {
        setTabsHasLeftFade(false);
        setTabsHasRightFade(false);
        return;
      }

      const maxScrollLeft = element.scrollWidth - element.clientWidth;
      const atStart = element.scrollLeft <= 1;
      const atEnd = maxScrollLeft - element.scrollLeft <= 1;

      setTabsHasLeftFade(!atStart);
      setTabsHasRightFade(!atEnd);
    };

    updateTabsFadeState();
    const element = tabScrollRef.current;
    element?.addEventListener("scroll", updateTabsFadeState, { passive: true });
    window.addEventListener("resize", updateTabsFadeState);

    return () => {
      element?.removeEventListener("scroll", updateTabsFadeState);
      window.removeEventListener("resize", updateTabsFadeState);
    };
  }, []);

  const ensureExploreCardFullyVisible = (cardElement: HTMLElement) => {
    const scrollContainer = cardElement.closest<HTMLElement>(
      "[data-explore-feed-scroll-container]",
    );
    if (!scrollContainer) return;

    const scrollRect = scrollContainer.getBoundingClientRect();
    const cardRect = cardElement.getBoundingClientRect();
    const scrollStyle = window.getComputedStyle(scrollContainer);
    const topInset = Number.parseFloat(scrollStyle.paddingTop) || 0;
    const bottomNav = Array.from(
      document.querySelectorAll<HTMLElement>(
        'nav[role="tablist"][aria-label="Tabs"]',
      ),
    ).find((element) => element.getBoundingClientRect().height > 0);
    const bottomBoundary =
      bottomNav?.getBoundingClientRect().top ?? scrollRect.bottom;
    const visibleTop = scrollRect.top + topInset;
    const visibleBottom = bottomBoundary - 4;

    let deltaY = 0;
    if (cardRect.top < visibleTop) {
      deltaY = cardRect.top - visibleTop;
    } else if (cardRect.bottom > visibleBottom) {
      deltaY = cardRect.bottom - visibleBottom;
    }

    if (Math.abs(deltaY) < 1) return;
    scrollContainer.scrollTop += deltaY;
  };

  const handleOpenExploreDetail = (
    item: ExploreFeedItem,
    cardElement: HTMLElement,
  ) => {
    const rawAspect = item.aspect[0] / Math.max(item.aspect[1], 1);
    const clampedAspect = Math.min(4 / 3, Math.max(3 / 4, rawAspect));
    ensureExploreCardFullyVisible(cardElement);
    savePhotoTextDetailSnapshot(buildExploreDetailSnapshot(item));
    savePhotoTextDetailSourceFrame(item.id, 0, {
      frameHeightRatio: 1 / clampedAspect,
      objectPosition: "center center",
    });
    flushSync(() => {
      setExploreDetailItemId(item.id);
      setSharedImageFeedId(item.id);
    });
    navigateWithinApp(buildExploreDetailHref(item.id));
  };

  return (
    <ThemeScope
      mode={surfaceTheme}
      className="relative h-full min-h-0 home-feed-page"
    >
      <PhotoTextDevProvider
        activeFeedIndex={activeTabId === "for-you" ? activeFeedIndex : -1}
        feedContents={homeFeedItemContents}
      >
      {activeTabId === "for-you" ? (
        <VerticalSnapPager
          className="home-feed-pager"
          ref={pagerRef}
          pages={forYouPages}
          defaultActiveIndex={initialFeedIndex}
          onActiveIndexChange={setActiveFeedIndex}
          gestureFill={false}
          loop
          onHorizontalStart={batchReview ? undefined : handleVisitorHorizontalStart}
          onHorizontalMove={batchReview ? undefined : handleVisitorHorizontalMove}
          onHorizontalEnd={batchReview ? undefined : handleVisitorHorizontalEnd}
        />
      ) : activeTabId === "explore" ? (
        <ExploreFeedPage
          onOpenDetail={handleOpenExploreDetail}
          sharedImageFeedId={exploreDetailItemId ? null : sharedImageFeedId}
        />
      ) : (
        <div
          key={`empty-${activeTabId}`}
          className="bg-tux-v2-brand-tiktok-black w-full h-full"
        />
      )}

      {/* 评论/音乐详情面板打开时仅做软隐藏（opacity + pointer-events），保留 DOM 与
        * 横向 tab 滚动位置等内部状态；之前的条件渲染会让 tab 栏在面板关闭后
        * 重置回最右默认位（hasInitScrollRef 重新跑一次）。 */}
      <div
        aria-hidden={shouldHideHomeTopChrome}
        data-home-feed-top-chrome
        className="top-0 right-0 left-0 z-10 absolute pt-app-frame-top"
        style={{
          backgroundColor: isExploreTab ? getColorCSSVar("UIPageFlat1") : "transparent",
          opacity: shouldHideHomeTopChrome ? 0 : 1,
          transition: playableNavigation.playing ? "opacity 400ms cubic-bezier(.22, 1, .36, 1)" : "opacity 240ms ease",
          pointerEvents: shouldHideHomeTopChrome ? "none" : "auto",
        }}
      >
        <TUXNavBar
          heightPreset={44}
          backgroundOpacity={0}
          showSeparator={false}
          titleAlign="center"
          leading={(
            <div className="flex items-center h-10" style={{ marginLeft: "-8px" }}>
              {!batchReview && <button
                type="button"
                aria-label="Open sidebar"
                onClick={openSidebar}
                className="flex items-center h-10 shrink-0"
                style={{
                  width: "18px",
                  justifyContent: "flex-start",
                }}
              >
                <img
                  src="/resource/sidebar/icon/sidebar.svg"
                  alt=""
                  style={{ display: "block", width: "16px", height: "16px" }}
                />
              </button>}
              <button
                type="button"
                aria-label="Live"
                aria-disabled={batchReview || undefined}
                title={batchReview ? "Display only in this preview" : undefined}
                className="flex justify-center items-center w-10 h-10 shrink-0"
              >
                <IconLiveEntrance
                  width={24}
                  height={24}
                  style={{ color: topChromeColor }}
                />
              </button>
            </div>
          )}
          trailing={(
            <button
              type="button"
              aria-label="Search"
              aria-disabled={batchReview || undefined}
              title={batchReview ? "Display only in this preview" : undefined}
              className="flex justify-center items-center w-10 h-10"
              onClick={handleSearchClick}
            >
              <IconMagnifyingGlass
                width={24}
                height={24}
                style={{ color: topChromeColor }}
              />
            </button>
          )}
          customTitle={
            <div className="flex items-center h-full min-w-0">
              <div className="min-w-0 overflow-hidden" style={tabEdgeMaskStyle}>
                <div
                  ref={tabScrollRef}
                  className="flex items-center w-full overflow-x-auto hide-scrollbar"
                >
                  <div className="flex items-center min-w-max">
                    {HOME_TABS.map((tab) => {
                      const isActive = tab.id === activeTabId;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          className="relative flex items-center h-11 px-1.5 overflow-visible"
                          aria-label={tab.label}
                          aria-disabled={(batchReview && !isActive) || undefined}
                          title={batchReview && !isActive ? "Display only in this preview" : undefined}
                          ref={(node) => {
                            tabButtonRefs.current[tab.id] = node;
                          }}
                          onClick={() => {
                            handleHomeTabClick(tab.id);
                          }}
                        >
                          <span className="relative inline-flex items-center">
                            <TUXText
                              typographyPreset="H4-Semibold"
                              style={{
                                ...overlayTextStyle,
                                opacity: isActive ? 1 : inactiveTabOpacity,
                              }}
                            >
                              {tab.label}
                            </TUXText>
                            {isActive ? (
                              <span
                                className="left-1/2 absolute -translate-x-1/2"
                                style={{
                                  top: "calc(100% + 8px)",
                                  width: "24px",
                                  height: "2px",
                                  borderRadius: "9999px",
                                  backgroundColor: getColorCSSVar("UIText1"),
                                }}
                              />
                            ) : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          }
        />
      </div>

      <CommentPanelHost />
      </PhotoTextDevProvider>
      {feedNavigation && <div className="absolute bottom-0 left-0 right-0 z-10"
        aria-hidden={shouldHideHomeTopChrome}
        style={{ opacity: shouldHideHomeTopChrome ? 0 : 1, visibility: shouldHideHomeTopChrome ? "hidden" : "visible", pointerEvents: shouldHideHomeTopChrome ? "none" : "auto" }}>
        {feedNavigation}
      </div>}
      {playableNavigation.overlay}
      {appFrameOverlayRoot && exploreDetailItem
        ? createPortal(
            <div
              className="photo-text-detail-frame-overlay-enter absolute inset-0 overflow-hidden"
              style={{ zIndex: APP_Z_OVERLAY }}
            >
              <PhotoTextDetailRoutePage
                key={exploreDetailItem.id}
                overlay
                routeStateOverride={{
                  feedId: exploreDetailItem.id,
                  imageIndex: 0,
                  returnFeedId: exploreDetailItem.id,
                }}
                sourceSurfaceOverride="explore"
              />
            </div>,
            appFrameOverlayRoot,
          )
        : null}
    </ThemeScope>
  );
}

function CommentPanelHost() {
  const { visible, activeFeedKey, bindingVersion } = useCommentPanelHost();
  const hostRootRef = useRef<HTMLDivElement>(null);
  const [appFrameRoot, setAppFrameRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const frame = hostRootRef.current?.closest(
      "[data-app-frame-root='true']",
    ) as HTMLElement | null;
    setAppFrameRoot(frame ?? null);
  }, []);

  const binding = useMemo(
    () => getActiveCommentPanelBinding(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeFeedKey, bindingVersion],
  );

  return (
    <div ref={hostRootRef} aria-hidden="true">
      <CommentPanel
        visible={visible}
        onVisibleChange={(next: boolean) => {
          if (!next) closeCommentPanel();
        }}
        root={binding?.root ?? appFrameRoot}
        feedContentId={binding?.feedContentId ?? null}
        pipMedia={binding?.pipMedia ?? null}
        preserveFeedChrome={binding?.preserveFeedChrome ?? false}
        onMetricsChange={binding?.applySqueeze}
        sessionComments={binding?.sessionComments}
        onCommentPosted={binding?.onCommentPosted}
      />
    </div>
  );
}
