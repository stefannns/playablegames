import { TUXNavBar, TUXNavBarIconAction } from "@byted-tiktok/tux-web";
import {
  TUXIconCirclePlus,
  TUXIconEllipsisHorizontal,
  TUXIconMagnifyingGlass,
  TUXIconTwoPersonPlus,
} from "@byted-tiktok/tux-icons";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { useAppNavigation } from "../../context/app_navigation";
import { useAppFrame, useTabAppChromeSurfaceTheme } from "../../components/sys/app_frame";
import { useTheme } from "../../context/theme";
import PagePushStage, { usePagePushStage } from "../../hooks/page_push";
import { useTwoLevelRouteStackSync } from "../../hooks/sync_route_page_stack";
import { appPathForRoute } from "../../routes/app_route_tree";
import {
  inboxPageConfig,
  inboxRowById,
  inboxRowOpensDetail,
  filterInboxRowsByTab,
  inboxStoryDetailById,
  type InboxTabId,
  type InboxStoryDetail,
} from "./inbox_page.config";
import {
  setInboxBannerEnabled,
  useInboxBannerEnabled,
} from "./inbox_banner_store";
import { useMessagingSuite } from "./inbox_messaging_suite_store";
import { InboxBanner } from "./components/inbox_banner";
import { InboxLongPressOverlay } from "./components/inbox_long_press_overlay";
import { InboxTabBar } from "./components/inbox_tab_bar";
import { InboxTabSheet } from "./components/inbox_tab_sheet";
import { InboxDetailPageContent } from "./components/inbox_detail_page_content";
import { StoryDetailPageContent } from "../story/story_detail_page_content";
import { InboxRowCell, type InboxRowCellRow } from "./components/inbox_row_cell";
import { InboxNavBarTitle } from "./components/inbox_navbar_title";
import {
  canOpenStorySkylightCell,
  StorySkylightCell,
  type StorySkylightCellStory,
} from "./components/story_skylight_cell";
import { SKYLIGHT_SCROLL_ROW_INBOX_CLASS } from "./story_skylight.constants";

type InboxPageProps = {
  isTabActive?: boolean;
  bottomTabBar?: ReactNode;
};

const playableInboxStoryDetails = inboxPageConfig.storyDetails.filter(canOpenStorySkylightCell);

type InboxRootPageContentProps = {
  bottomTabBar?: ReactNode;
  onOpenInboxDetail: (row: InboxRowCellRow, trigger?: HTMLElement) => void;
  onOpenInboxStory: (story: StorySkylightCellStory, trigger: HTMLElement) => void;
  initialScrollTop: number;
  initialSkylightScrollLeft: number;
  revealStoryId?: string | null;
  onScrollTopChange: (scrollTop: number) => void;
  onSkylightScrollLeftChange: (scrollLeft: number) => void;
  onRevealStoryHandled: () => void;
};

function InboxRootPageContent({
  bottomTabBar,
  onOpenInboxDetail,
  onOpenInboxStory,
  initialScrollTop,
  initialSkylightScrollLeft,
  revealStoryId,
  onScrollTopChange,
  onSkylightScrollLeftChange,
  onRevealStoryHandled,
}: InboxRootPageContentProps) {
  const { topInsetCss } = useAppFrame();
  const [navBarBackgroundOpacity, setNavBarBackgroundOpacity] = useState(0);
  const bannerVisible = useInboxBannerEnabled();
  const messagingSuite = useMessagingSuite();
  const tabBarVisible = messagingSuite === "professional";
  const [activeTabId, setActiveTabId] = useState<InboxTabId>("all");
  const [tabSheetOpen, setTabSheetOpen] = useState(false);
  const [sheetRoot, setSheetRoot] = useState<HTMLElement | null>(null);
  const [longPressedRow, setLongPressedRow] = useState<InboxRowCellRow | null>(null);
  const [longPressedRect, setLongPressedRect] = useState<DOMRect | null>(null);
  const [openSwipeRowId, setOpenSwipeRowId] = useState<string | null>(null);
  const [dismissedRowIds, setDismissedRowIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const shouldReduceMotion = useReducedMotion();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const skylightScrollRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    scrollContainer.scrollTop = initialScrollTop;
    setNavBarBackgroundOpacity(initialScrollTop > 0 ? 1 : 0);
  }, [initialScrollTop]);

  // TUXSheet 通过 root 节点定位；用 AppFrame 的手机壳容器把 sheet 约束到壳子宽度内
  useEffect(() => {
    const frameRoot = scrollContainerRef.current?.closest(
      "[data-app-frame-root='true']",
    ) as HTMLElement | null;
    setSheetRoot(frameRoot ?? null);
  }, []);

  useLayoutEffect(() => {
    const skylightScroll = skylightScrollRef.current;
    if (!skylightScroll) return;

    skylightScroll.scrollLeft = initialSkylightScrollLeft;

    if (!revealStoryId) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      const targetAvatar = skylightScroll.querySelector<HTMLElement>(
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
      const scrollRect = skylightScroll.getBoundingClientRect();
      const hiddenLeft = targetRect.left - REVEAL_MARGIN_PX - scrollRect.left;
      const hiddenRight = targetRect.right + REVEAL_MARGIN_PX - scrollRect.right;

      if (hiddenLeft < 0 || hiddenRight > 0) {
        skylightScroll.scrollBy({
          left: hiddenLeft < 0 ? hiddenLeft : hiddenRight,
          behavior: "smooth",
        });
      }
      onRevealStoryHandled();
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [initialSkylightScrollLeft, onRevealStoryHandled, revealStoryId]);

  const visibleRows = filterInboxRowsByTab(
    inboxPageConfig.rows,
    activeTabId,
  ).filter((row) => !dismissedRowIds.has(row.id));

  return (
    <div
      className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-tux-v2-ui-page-flat-1"
      style={{ paddingTop: topInsetCss }}
    >
      <TUXNavBar
        heightPreset={44}
        customTitle={<InboxNavBarTitle />}
        showSeparator={false}
        backgroundColor="UIPageFlat1"
        backgroundOpacity={navBarBackgroundOpacity}
        leading={
          <TUXNavBarIconAction
            aria-label={
              messagingSuite === "professional"
                ? "New conversation"
                : "Invite friends"
            }
            width="44px"
            height="44px"
            icon={
              messagingSuite === "professional" ? (
                <TUXIconCirclePlus
                  size={24}
                  color="var(--tux-v2-color-ui-text-1)"
                />
              ) : (
                <TUXIconTwoPersonPlus
                  size={24}
                  color="var(--tux-v2-color-ui-text-1)"
                />
              )
            }
          />
        }
        trailing={
          <div className="flex items-center">
            <TUXNavBarIconAction
              aria-label="Search inbox"
              width="44px"
              height="44px"
              icon={
                <TUXIconMagnifyingGlass size={24} color="var(--tux-v2-color-ui-text-1)" />
              }
            />
            <TUXNavBarIconAction
              aria-label="More inbox actions"
              width="44px"
              height="44px"
              icon={
                <TUXIconEllipsisHorizontal size={24} color="var(--tux-v2-color-ui-text-1)" />
              }
            />
          </div>
        }
      />

      <div
        ref={scrollContainerRef}
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden"
        onScroll={(event) => {
          const { scrollTop } = event.currentTarget;
          const nextOpacity = scrollTop > 0 ? 1 : 0;

          onScrollTopChange(scrollTop);

          setNavBarBackgroundOpacity((currentOpacity) =>
            currentOpacity === nextOpacity ? currentOpacity : nextOpacity,
          );
        }}
      >
        <div className="hidden sm:block">
          <AnimatePresence initial={false}>
            {bannerVisible ? (
              <motion.div
                key="inbox-banner"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: 0.24, ease: [0.4, 0, 0.2, 1] }
                }
                style={{ overflow: "hidden" }}
              >
                <div className="px-2 pt-2 pb-2">
                  <InboxBanner onDismiss={() => setInboxBannerEnabled(false)} />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <section className="min-w-0 w-full px-0 pb-0 pt-0">
          <div
            ref={skylightScrollRef}
            data-story-anchor-scroll
            data-story-anchor-scope="inbox"
            className={SKYLIGHT_SCROLL_ROW_INBOX_CLASS}
            style={{ gap: 0 }}
            onScroll={(event) => {
              onSkylightScrollLeftChange(event.currentTarget.scrollLeft);
            }}
          >
            {inboxPageConfig.stories.map((story) => (
              <StorySkylightCell
                key={story.id}
                story={story}
                onOpenStory={onOpenInboxStory}
              />
            ))}
          </div>
        </section>

        <AnimatePresence initial={false}>
          {tabBarVisible ? (
            <motion.div
              key="inbox-tab-bar"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 0.24, ease: [0.4, 0, 0.2, 1] }
              }
              style={{ overflow: "hidden" }}
            >
              <InboxTabBar
                activeTabId={activeTabId}
                onTabSelect={setActiveTabId}
                onOpenSheet={() => setTabSheetOpen(true)}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="bg-tux-v2-ui-page-flat-1">
          <AnimatePresence initial={false}>
            {visibleRows.map((row) => {
              const isAvatar = row.leading.variant === "avatar";
              return (
                <motion.div
                  key={row.id}
                  layout
                  initial={false}
                  exit={{ opacity: 0, height: 0 }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { duration: 0.26, ease: [0.4, 0, 0.2, 1] }
                  }
                  style={{ overflow: "hidden" }}
                >
                  <InboxRowCell
                    row={row}
                    pressable={inboxRowOpensDetail(row)}
                    onClick={(clickedRow, trigger) => {
                      if (openSwipeRowId) {
                        setOpenSwipeRowId(null);
                        return;
                      }
                      if (!inboxRowOpensDetail(clickedRow)) {
                        return;
                      }
                      onOpenInboxDetail(clickedRow, trigger);
                    }}
                    onLongPress={
                      isAvatar
                        ? (pressedRow, trigger) => {
                            setLongPressedRow(pressedRow);
                            setLongPressedRect(trigger.getBoundingClientRect());
                          }
                        : undefined
                    }
                    enableSwipe={isAvatar}
                    swipeOpen={isAvatar && openSwipeRowId === row.id}
                    onSwipeOpenChange={
                      isAvatar
                        ? (open) =>
                            setOpenSwipeRowId(open ? row.id : (current) =>
                              current === row.id ? null : current,
                            )
                        : undefined
                    }
                    onSwipeAction={
                      isAvatar
                        ? (actionId, actedRow) => {
                            if (actionId === "delete") {
                              setDismissedRowIds((prev) => {
                                const next = new Set(prev);
                                next.add(actedRow.id);
                                return next;
                              });
                            }
                            setOpenSwipeRowId(null);
                          }
                        : undefined
                    }
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {bottomTabBar ? <div className="flex-none">{bottomTabBar}</div> : null}

      <InboxTabSheet
        visible={tabSheetOpen}
        onVisibleChange={setTabSheetOpen}
        activeTabId={activeTabId}
        onTabSelect={setActiveTabId}
        root={sheetRoot}
      />

      <InboxLongPressOverlay
        row={longPressedRow}
        originRect={longPressedRect}
        root={sheetRoot}
        onClose={() => {
          setLongPressedRow(null);
          setLongPressedRect(null);
        }}
        onAction={() => {
          // Prototype: just dismiss; persisting action results is out of scope.
        }}
      />
    </div>
  );
}

export default function InboxPage({
  isTabActive = true,
  bottomTabBar,
}: InboxPageProps) {
  const { route, navigate } = useAppNavigation();
  const { resolvedTheme } = useTheme();
  const inboxSub = route?.tab === "inbox" ? route.sub : null;
  const inboxChromeTheme =
    inboxSub?.screen === "story" ? "dark" : resolvedTheme;
  useTabAppChromeSurfaceTheme(isTabActive, inboxChromeTheme);
  const rootScrollTopRef = useRef(0);
  const rootSkylightScrollLeftRef = useRef(0);
  const pendingRevealStoryIdRef = useRef<string | null>(null);
  const storyTransitionSourceRectRef = useRef<DOMRect | null>(null);
  const pageStage = usePagePushStage({
    initialPage: buildInboxPage(),
    initialKey: "inbox-root",
    durationMs: 300,
    pageOffset: "24%",
  });
  const { pages, isTransitioning, push, pop, reset } = pageStage;

  const { markStackNavigation } = useTwoLevelRouteStackSync({
    tab: "inbox",
    route,
    pages,
    isTransitioning,
    rootKey: "inbox-root",
    detailKey: (id) => id,
    detailIdFromStackKey: (key) =>
      key.startsWith("inbox-message-") || key.startsWith("inbox-story-") ? key : null,
    getDetailId: (r) => {
      if (r.tab !== "inbox") return null;
      if (r.sub.screen === "message") return `inbox-message-${r.sub.threadId}`;
      if (r.sub.screen === "story") return `inbox-story-${r.sub.storyId}`;
      return null;
    },
    buildRoot: buildInboxPage,
    buildDetail: (id) => {
      if (id.startsWith("inbox-message-")) {
        const row = inboxRowById(id.slice("inbox-message-".length));
        return row && inboxRowOpensDetail(row)
          ? buildInboxDetailPage(row)
          : buildInboxPage();
      }

      if (id.startsWith("inbox-story-")) {
        const story = inboxStoryDetailById(id.slice("inbox-story-".length));
        return story && canOpenStorySkylightCell(story)
          ? buildInboxStoryPage(story, null)
          : buildInboxPage();
      }

      const row = inboxRowById(id);
      return row ? buildInboxDetailPage(row) : buildInboxPage();
    },
    detailTransitionStyle: (id) => (id.startsWith("inbox-story-") ? "none" : "slide"),
    detailIncomingPageOffset: (id) => (id.startsWith("inbox-story-") ? "0%" : undefined),
    detailOutgoingPageOffset: (id) => (id.startsWith("inbox-story-") ? "0%" : undefined),
    rootIncomingPageOffset: (id) => (id.startsWith("inbox-story-") ? "24%" : undefined),
    push,
    pop,
    reset,
  });

  const openInboxDetail = useCallback(
    (row: InboxRowCellRow, trigger?: HTMLElement) => {
      if (!inboxRowOpensDetail(row)) {
        return;
      }
      markStackNavigation();
      navigate(
        appPathForRoute({
          tab: "inbox",
          sub: { screen: "message", threadId: row.id },
        }),
      );
      push({
        trigger,
        outgoingKey: "inbox-root",
        outgoingPage: buildInboxPage(),
        incomingKey: `inbox-message-${row.id}`,
        incomingPage: buildInboxDetailPage(row),
      });
    },
    [markStackNavigation, navigate, push],
  );

  const openInboxStory = useCallback(
    (story: StorySkylightCellStory, trigger: HTMLElement) => {
      const storyDetail = inboxStoryDetailById(story.id);
      if (!storyDetail || !canOpenStorySkylightCell(story)) {
        return;
      }

      const sourceRect = trigger.getBoundingClientRect();
      storyTransitionSourceRectRef.current = sourceRect;

      markStackNavigation();
      navigate(
        appPathForRoute({
          tab: "inbox",
          sub: { screen: "story", storyId: story.id },
        }),
      );
      push({
        trigger,
        outgoingKey: "inbox-root",
        outgoingPage: buildInboxPage(),
        outgoingPageOffset: "0%",
        incomingKey: `inbox-story-${story.id}`,
        incomingPage: buildInboxStoryPage(storyDetail, sourceRect),
        incomingPageOffset: "0%",
        transitionStyle: "none",
      });
    },
    [markStackNavigation, navigate, push],
  );

  const handleCloseInboxDetail = useCallback(
    (row: InboxRowCellRow, trigger?: HTMLElement | null) => {
      markStackNavigation();
      navigate(appPathForRoute({ tab: "inbox", sub: { screen: "list" } }));
      pop({
        trigger,
        incomingPage: buildInboxPage(),
        outgoingPage: buildInboxDetailPage(row),
      });
    },
    [markStackNavigation, navigate, pop],
  );

  const handleCloseInboxStory = useCallback(
    (story: InboxStoryDetail, trigger?: HTMLElement | null) => {
      storyTransitionSourceRectRef.current = null;
      pendingRevealStoryIdRef.current = story.id;
      const skylightScroll = trigger?.closest<HTMLElement>("[data-story-anchor-scroll]");
      if (skylightScroll) {
        rootSkylightScrollLeftRef.current = skylightScroll.scrollLeft;
      }
      markStackNavigation();
      navigate(appPathForRoute({ tab: "inbox", sub: { screen: "list" } }));
      pop({
        trigger,
        incomingPage: buildInboxPage(),
        incomingPageOffset: "24%",
        transitionStyle: "none",
      });
    },
    [markStackNavigation, navigate, pop],
  );

  const handleInboxStoryChange = useCallback(
    (story: InboxStoryDetail) => {
      markStackNavigation();
      navigate(
        appPathForRoute({
          tab: "inbox",
          sub: { screen: "story", storyId: story.id },
        }),
        { replace: true },
      );
    },
    [markStackNavigation, navigate],
  );

  function buildInboxPage(): ReactNode {
    function InboxRootStagePage() {
      return (
        <InboxRootPageContent
          bottomTabBar={bottomTabBar}
          onOpenInboxDetail={openInboxDetail}
          onOpenInboxStory={openInboxStory}
          initialScrollTop={rootScrollTopRef.current}
          initialSkylightScrollLeft={rootSkylightScrollLeftRef.current}
          revealStoryId={pendingRevealStoryIdRef.current}
          onScrollTopChange={(scrollTop) => {
            rootScrollTopRef.current = scrollTop;
          }}
          onSkylightScrollLeftChange={(scrollLeft) => {
            rootSkylightScrollLeftRef.current = scrollLeft;
          }}
          onRevealStoryHandled={() => {
            pendingRevealStoryIdRef.current = null;
          }}
        />
      );
    }

    return <InboxRootStagePage />;
  }

  function buildInboxDetailPage(row: InboxRowCellRow): ReactNode {
    function InboxDetailStagePage() {
      return <InboxDetailPageContent row={row} onClose={handleCloseInboxDetail} />;
    }

    return <InboxDetailStagePage />;
  }

  function buildInboxStoryPage(
    story: InboxStoryDetail,
    sourceRect: DOMRect | null = storyTransitionSourceRectRef.current,
  ): ReactNode {
    function InboxStoryStagePage() {
      return (
        <StoryDetailPageContent
          story={story}
          stories={playableInboxStoryDetails}
          sourceRect={sourceRect}
          anchorScopeId="inbox"
          onStoryChange={handleInboxStoryChange}
          onClose={handleCloseInboxStory}
        />
      );
    }

    return <InboxStoryStagePage />;
  }

  return <PagePushStage manager={pageStage} />;
}
