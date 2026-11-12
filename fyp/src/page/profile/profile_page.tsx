import {
  TUXNavBar,
  TUXNavBarIconAction,
  TUXTabBar,
  TUXTag,
  TUXText,
  getColorCSSVar,
} from "@byted-tiktok/tux-web";
import {
  TUXIcon3LinesHorizontal,
  TUXIconArrowTriangleDownLargeFill,
  TUXIconDraft,
  TUXIconExpExp03IconFootprint,
  TUXIconGearFill,
  TUXIconPersonPlus,
  TUXIconPencil,
  TUXIconPlay,
  TUXIconExpProfileExpIconPlaylistFill,
  TUXIconColorVerifiedBadge,
  TUXIconExpProfileExpIconMusicFill,
  TUXIconExpProfileExpIconShowcaseFill,
  TUXIconExpProfileExpIconCollectionFill,
  TUXIconExpProfileExpIconRepostFill,
  TUXIconExpProfileExpIconHeartFill,
  TUXIconExpProfileExpIconBookmarkFill,
  TUXIconColorProfileOrderFill,
  TUXIconColorProfileShowcaseFill,
  TUXIconColorProfileWatchHistoryFill,
} from "@byted-tiktok/tux-icons";
import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAppNavigation } from "../../context/app_navigation";
import { appPathForRoute } from "../../routes/app_route_tree";
import { useAppFrame, useTabAppChromeSurfaceTheme } from "../../components/sys/app_frame";
import { useTheme } from "../../context/theme";
import { ProfileStoryAvatarHost } from "./profile_story_avatar_host";
import PagePushStage, { usePagePushStage } from "../../hooks/page_push";
import { localProfileVideoThumbUrl } from "../../utils/local_media_placeholder";
import ManagePostsPage from "./manage_posts_page";
import SettingsAndPrivacyPage from "./settings_and_privacy_page";
import { FindFriendsPageContent } from "../friends/components/find_friends_page_content";
import { ProfileSidebar } from "./components/profile_sidebar";
import { MusicTabContent } from "../home/components/visitor_profile/music_tab_content";
import { RepostTabContent } from "../home/components/visitor_profile/repost_tab_content";
import { ShopTabContent } from "../home/components/visitor_profile/shop_tab_content";
import { deriveSelfProfileTabData } from "../home/components/visitor_profile/visitor_profile_utils";
import { MessagingSuitePageContent } from "../inbox/components/messaging_suite_page";
import { useProfileTabScrollPreservation } from "./use_profile_tab_scroll_preservation";
import { useProfileTabBarPin } from "./use_profile_tab_bar_pin";

void TUXTag;

/** Profile 侧栏宽度与 Home 侧边栏保持一致。 */
const PROFILE_NAV_ICON_COLOR = getColorCSSVar("UIText1");
function profileMenuRevealOffsetPercent(): string {
  return "85%";
}

type TopTabKey =
  | "posts"
  | "private"
  | "shop"
  | "unknown"
  | "bookmarks"
  | "likes";

/** Same play-count pool as the Posts grid body (30 cells). */
const PROFILE_POST_GRID_METRICS = [
  "8.8M",
  "1.2M",
  "23.1M",
  "3.4M",
  "9.7M",
  "15.2M",
  "6.3M",
  "892K",
  "4.5M",
  "1.8M",
  "11.2M",
  "720K",
  "2.9M",
  "18.4M",
  "560K",
  "7.1M",
  "3.2M",
  "945K",
  "12.8M",
  "2.1M",
  "5.6M",
  "430K",
  "9.9M",
  "1.5M",
  "4.8M",
  "680K",
  "14.3M",
  "2.6M",
  "875K",
  "10.5M",
] as const;

/** Posts grid = drafts + 2 pinned + 30 play cells. */
const PROFILE_POST_GRID_COUNT = 3 + PROFILE_POST_GRID_METRICS.length;

function buildPlainProfileGridItems(
  keyPrefix: string,
  thumbOffset: number,
  count: number,
): Array<{ key: string; thumbnailSrc: string; metric: string }> {
  return Array.from({ length: count }, (_, index) => ({
    key: `${keyPrefix}-${index + 1}`,
    thumbnailSrc: localProfileVideoThumbUrl(((thumbOffset + index) % 30) + 1),
    metric: PROFILE_POST_GRID_METRICS[index % PROFILE_POST_GRID_METRICS.length],
  }));
}

type ProfilePageProps = {
  isTabActive?: boolean;
  bottomTabBar?: ReactNode;
};

export default function ProfilePage({
  isTabActive = true,
  bottomTabBar,
}: ProfilePageProps) {
  const { resolvedTheme } = useTheme();
  useTabAppChromeSurfaceTheme(isTabActive, resolvedTheme);
  const { topInsetCss } = useAppFrame();
  const topTabs = useMemo<
    Array<{ key: TopTabKey; icon: ReactNode; showTrailingArrow?: boolean }>
  >(
    () => [
        {
          key: "posts",
          icon: <TUXIconExpProfileExpIconCollectionFill size={20} />,
          showTrailingArrow: true,
        },
        {
          key: "private",
          icon: <TUXIconExpProfileExpIconMusicFill size={20} />,
        },
        {
          key: "shop",
          icon: <TUXIconExpProfileExpIconShowcaseFill size={20} />,
        },
        {
          key: "unknown",
          icon: <TUXIconExpProfileExpIconRepostFill size={20} />,
        },
        {
          key: "bookmarks",
          icon: <TUXIconExpProfileExpIconBookmarkFill size={20} />,
        },
        {
          key: "likes",
          icon: <TUXIconExpProfileExpIconHeartFill size={20} />,
        },
      ],
    [],
  );

  const { route, navigate } = useAppNavigation();

  const selfProfileTabData = useMemo(() => deriveSelfProfileTabData(), []);

  const videoItems = useMemo<
    Array<{
      key: string;
      thumbnailSrc: string;
      title?: string;
      badge?: string;
      metric: string;
      metricIcon: "draft" | "play";
    }>
  >(
    () => [
      {
        key: "drafts",
        thumbnailSrc: localProfileVideoThumbUrl(1),
        title: "Drafts · 2",
        metric: "84.6MB",
        metricIcon: "draft",
      },
      {
        key: "pinned-1",
        thumbnailSrc: localProfileVideoThumbUrl(2),
        badge: "Pinned",
        metric: "6.5M",
        metricIcon: "play",
      },
      {
        key: "pinned-2",
        thumbnailSrc: localProfileVideoThumbUrl(3),
        badge: "Pinned",
        metric: "12.4M",
        metricIcon: "play",
      },
      ...PROFILE_POST_GRID_METRICS.map((metric, index) => ({
        key: `v-${index + 4}`,
        thumbnailSrc: localProfileVideoThumbUrl(index + 4),
        metric,
        metricIcon: "play" as const,
      })),
    ],
    [],
  );

  /** Liked tab — plain liked-video grid; no drafts / pinned / playlist chrome. */
  const likedVideoItems = useMemo(
    () => buildPlainProfileGridItems("liked", 0, PROFILE_POST_GRID_COUNT),
    [],
  );

  /** Bookmarks tab — saved posts grid without pinned badges. */
  const bookmarkVideoItems = useMemo(
    () => buildPlainProfileGridItems("bookmark", 11, PROFILE_POST_GRID_COUNT),
    [],
  );

  const pageStage = usePagePushStage({
    initialPage: buildProfilePage(),
    initialKey: "profile",
    durationMs: 300,
    pageOffset: "80%",
  });
  const { pages, isTransitioning, pop, push, reset, setStageElement } =
    pageStage;
  const stageRef = useRef<HTMLDivElement | null>(null);
  const attachStageElement = useCallback(
    (node: HTMLDivElement | null) => {
      stageRef.current = node;
      setStageElement(node);
    },
    [setStageElement],
  );
  const getMenuRevealOffset = useCallback(
    () => profileMenuRevealOffsetPercent(),
    [],
  );
  const stackDrivenNavRef = useRef(false);
  const markStackNavigation = () => {
    stackDrivenNavRef.current = true;
  };

  const handleCloseMenu = useCallback(
    (trigger?: HTMLElement | null) => {
      markStackNavigation();
      navigate(appPathForRoute({ tab: "profile", sub: { screen: "profile" } }));
      pop({
        trigger,
        incomingPage: buildProfilePage(),
        outgoingPage: buildMenuPage(),
        incomingPageOffset: "80%",
        outgoingPageOffset: "30%",
      });
    },
    [markStackNavigation, navigate, pop],
  );

  const handleOpenSettings = useCallback(
    (trigger?: HTMLElement | null) => {
      markStackNavigation();
      navigate(appPathForRoute({ tab: "profile", sub: { screen: "settings" } }));
      push({
        trigger,
        outgoingKey: "menu",
        outgoingPage: buildMenuPage(),
        outgoingPageOffset: "30%",
        incomingKey: "settings",
        incomingPage: buildSettingsPage(),
        incomingPageOffset: "30%",
      });
    },
    [markStackNavigation, navigate, push],
  );

  const handleCloseSettings = useCallback(
    (trigger?: HTMLElement | null) => {
      markStackNavigation();
      navigate(appPathForRoute({ tab: "profile", sub: { screen: "menu" } }));
      pop({
        trigger,
        incomingPage: buildMenuPage(),
        outgoingPage: buildSettingsPage(),
        incomingPageOffset: "30%",
        outgoingPageOffset: "30%",
      });
    },
    [markStackNavigation, navigate, pop],
  );

  const handleOpenMenu = useCallback(
    (trigger?: HTMLElement | null) => {
      markStackNavigation();
      navigate(appPathForRoute({ tab: "profile", sub: { screen: "menu" } }));
      push({
        trigger,
        outgoingKey: "profile",
        outgoingPage: buildProfilePage(),
        outgoingPageOffset: getMenuRevealOffset(),
        incomingKey: "menu",
        incomingPage: buildMenuPage(),
        incomingPageOffset: "30%",
      });
    },
    [getMenuRevealOffset, markStackNavigation, navigate, push],
  );

  const handleOpenFindFriends = useCallback(
    (trigger?: HTMLElement | null) => {
      markStackNavigation();
      navigate(appPathForRoute({ tab: "profile", sub: { screen: "find-friends" } }));
      push({
        trigger,
        outgoingKey: "profile",
        outgoingPage: buildProfilePage(),
        outgoingPageOffset: "24%",
        incomingKey: "find-friends",
        incomingPage: buildFindFriendsPage(),
        incomingPageOffset: "100%",
      });
    },
    [markStackNavigation, navigate, push],
  );

  const handleCloseFindFriends = useCallback(
    (trigger?: HTMLElement | null) => {
      markStackNavigation();
      navigate(appPathForRoute({ tab: "profile", sub: { screen: "profile" } }));
      pop({
        trigger,
        incomingPage: buildProfilePage(),
        outgoingPage: buildFindFriendsPage(),
        incomingPageOffset: "24%",
        outgoingPageOffset: "100%",
      });
    },
    [markStackNavigation, navigate, pop],
  );

  const handleOpenMessagingSuite = useCallback(
    (trigger?: HTMLElement | null) => {
      push({
        trigger,
        outgoingKey: "settings",
        outgoingPage: buildSettingsPage(),
        outgoingPageOffset: "30%",
        incomingKey: "messaging-suite",
        incomingPage: buildMessagingSuitePage(),
        incomingPageOffset: "100%",
      });
    },
    [push],
  );

  const handleCloseMessagingSuite = useCallback(
    (trigger?: HTMLElement | null) => {
      pop({
        trigger,
        incomingPage: buildSettingsPage(),
        outgoingPage: buildMessagingSuitePage(),
        incomingPageOffset: "30%",
        outgoingPageOffset: "100%",
      });
    },
    [pop],
  );

  useLayoutEffect(() => {
    if (route?.tab !== "profile") return;
    if (stackDrivenNavRef.current) {
      stackDrivenNavRef.current = false;
      return;
    }
    if (isTransitioning) return;

    const topKey = pages.at(-1)?.key;
    const target = route.sub.screen;

    if (target === "settings") {
      if (topKey === "settings" || topKey === "manage-posts") {
        return;
      }
      if (topKey === "menu") {
        push({
          outgoingKey: "menu",
          outgoingPage: buildMenuPage(),
          outgoingPageOffset: "30%",
          incomingKey: "settings",
          incomingPage: buildSettingsPage(),
          incomingPageOffset: "30%",
        });
        return;
      }
      if (topKey === "profile") {
        push({
          trigger: undefined,
          outgoingKey: "profile",
          outgoingPage: buildProfilePage(),
          outgoingPageOffset: getMenuRevealOffset(),
          incomingKey: "menu",
          incomingPage: buildMenuPage(),
          incomingPageOffset: "30%",
        });
        return;
      }
      reset(buildSettingsPage(), "settings");
      return;
    }

    if (target === "menu") {
      if (topKey === "menu") return;
      if (topKey === "settings" || topKey === "manage-posts") {
        pop({
          incomingPage: buildMenuPage(),
          outgoingPage: buildSettingsPage(),
          incomingPageOffset: "30%",
          outgoingPageOffset: "30%",
        });
        return;
      }
      if (topKey === "profile") {
        push({
          outgoingKey: "profile",
          outgoingPage: buildProfilePage(),
          outgoingPageOffset: getMenuRevealOffset(),
          incomingKey: "menu",
          incomingPage: buildMenuPage(),
          incomingPageOffset: "30%",
        });
        return;
      }
      reset(buildMenuPage(), "menu");
      return;
    }

    if (target === "find-friends") {
      if (topKey === "find-friends") return;
      if (topKey === "profile") {
        push({
          outgoingKey: "profile",
          outgoingPage: buildProfilePage(),
          outgoingPageOffset: "24%",
          incomingKey: "find-friends",
          incomingPage: buildFindFriendsPage(),
          incomingPageOffset: "100%",
        });
        return;
      }
      reset(buildFindFriendsPage(), "find-friends");
      return;
    }

    if (topKey === "profile" && pages.length <= 1) return;
    if (topKey === "manage-posts") {
      pop({
        incomingPage: buildSettingsPage(),
        outgoingPage: buildManagePostsPage(),
        incomingPageOffset: "30%",
        outgoingPageOffset: "30%",
      });
      return;
    }
    if (topKey === "settings") {
      pop({
        incomingPage: buildMenuPage(),
        outgoingPage: buildSettingsPage(),
        incomingPageOffset: "30%",
        outgoingPageOffset: "30%",
      });
      return;
    }
    if (topKey === "menu") {
      pop({
        incomingPage: buildProfilePage(),
        outgoingPage: buildMenuPage(),
        incomingPageOffset: "80%",
        outgoingPageOffset: "30%",
      });
      return;
    }
    if (topKey === "find-friends") {
      pop({
        incomingPage: buildProfilePage(),
        outgoingPage: buildFindFriendsPage(),
        incomingPageOffset: "24%",
        outgoingPageOffset: "100%",
      });
      return;
    }
    if (topKey === "messaging-suite") {
      pop({
        incomingPage: buildSettingsPage(),
        outgoingPage: buildMessagingSuitePage(),
        incomingPageOffset: "30%",
        outgoingPageOffset: "100%",
      });
      return;
    }
    reset(buildProfilePage(), "profile");
    // build*Page helpers omitted — new function identity each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, pages.at(-1)?.key, pages.length, isTransitioning, push, pop, reset]);

  const handleOpenManagePosts = useCallback(
    (trigger?: HTMLElement | null) => {
      push({
        trigger,
        outgoingKey: "settings",
        outgoingPage: buildSettingsPage(),
        outgoingPageOffset: "30%",
        incomingKey: "manage-posts",
        incomingPage: buildManagePostsPage(),
        incomingPageOffset: "30%",
      });
    },
    [push],
  );

  const handleCloseManagePosts = useCallback(
    (trigger?: HTMLElement | null) => {
      pop({
        trigger,
        incomingPage: buildSettingsPage(),
        outgoingPage: buildManagePostsPage(),
        incomingPageOffset: "30%",
        outgoingPageOffset: "30%",
      });
    },
    [pop],
  );

  function buildSettingsPage() {
    return (
      <SettingsAndPrivacyPage
        onBack={(trigger) => handleCloseSettings(trigger)}
        onItemClick={(item, trigger) => {
          if (item.key === "manage-posts") {
            handleOpenManagePosts(trigger);
            return;
          }
          if (item.key === "inbox-messaging") {
            handleOpenMessagingSuite(trigger);
          }
        }}
      />
    );
  }

  function buildManagePostsPage() {
    return (
      <ManagePostsPage onBack={(trigger) => handleCloseManagePosts(trigger)} />
    );
  }

  function buildFindFriendsPage() {
    return <FindFriendsPageContent tab="profile" onClose={handleCloseFindFriends} />;
  }

  function buildMessagingSuitePage() {
    return <MessagingSuitePageContent onBack={handleCloseMessagingSuite} />;
  }

  function buildMenuPage() {
    return (
      <div className="relative h-full w-full">
        <button
          type="button"
          aria-label="Close menu"
          className="absolute inset-0"
          onClick={(event) => handleCloseMenu(event.currentTarget)}
          style={{ backgroundColor: "transparent" }}
        />

        <div
          className="absolute top-0 right-0 z-10 h-full max-w-full overflow-y-auto pointer-events-auto"
          style={{
            width: "85%",
            backgroundColor: getColorCSSVar("UIPageGrouped1"),
          }}
        >
          <ProfileSidebar onOpenSettings={handleOpenSettings} />
        </div>
      </div>
    );
  }

  function buildProfilePage() {
    function ProfilePageContent() {
      const [activeTopTab, setActiveTopTab] = useState<TopTabKey>("posts");
      const [showSeparator, setShowSeparator] = useState(false);
      const tabBarRef = useRef<HTMLDivElement>(null);
      const navChromeRef = useRef<HTMLDivElement>(null);
      const tabBarSentinelRef = useRef<HTMLDivElement>(null);
      const updateTabBarPinRef = useRef<() => void>(() => {});
      const { scrollContainerRef, tabContentRef, handleTopTabChange } =
        useProfileTabScrollPreservation(
          activeTopTab,
          setActiveTopTab,
          tabBarSentinelRef,
          tabBarRef,
          navChromeRef,
          () => updateTabBarPinRef.current(),
        );
      const { updateTabBarPin } = useProfileTabBarPin(
        scrollContainerRef,
        navChromeRef,
        tabBarRef,
        tabBarSentinelRef,
        `${activeTopTab}-${showSeparator}`,
      );
      updateTabBarPinRef.current = updateTabBarPin;

      useLayoutEffect(() => {
        updateTabBarPin();
      }, [showSeparator, activeTopTab, updateTabBarPin]);

      return (
        <div
          className="bg-tux-v2-ui-page-flat-1 h-full min-h-0 flex flex-col overflow-hidden"
          style={{ paddingTop: topInsetCss }}
        >
          <div ref={navChromeRef} className="relative z-20 shrink-0 bg-tux-v2-ui-page-flat-1">
            <TUXNavBar
              heightPreset={44}
              fixed={false}
              showSeparator={showSeparator}
              backgroundColor="UIPageFlat1"
              backgroundOpacity={1}
              leading={
                <TUXNavBarIconAction
                  aria-label="Edit"
                  width="40px"
                  height="44px"
                  icon={<TUXIconPencil size={24} color={PROFILE_NAV_ICON_COLOR} />}
                />
              }
              trailing={
                <div className="flex items-center">
                  <TUXNavBarIconAction
                    aria-label="My visitors"
                    width="40px"
                    height="44px"
                    icon={
                      <TUXIconExpExp03IconFootprint size={24} color={PROFILE_NAV_ICON_COLOR} />
                    }
                  />
                  <TUXNavBarIconAction
                    aria-label="Find friends"
                    width="40px"
                    height="44px"
                    icon={<TUXIconPersonPlus size={24} color={PROFILE_NAV_ICON_COLOR} />}
                    onClick={(event) => handleOpenFindFriends(event.currentTarget)}
                  />
                  <TUXNavBarIconAction
                    aria-label="Menu"
                    width="40px"
                    height="44px"
                    icon={
                      <TUXIcon3LinesHorizontal size={24} color={PROFILE_NAV_ICON_COLOR} />
                    }
                    onClick={(event) => handleOpenMenu(event.currentTarget)}
                  />
                </div>
              }
            />
          </div>
          <div
            ref={scrollContainerRef}
            className="flex-1 min-h-0 overflow-y-auto"
            style={{ overflowAnchor: "none" }}
            onScroll={(event) => {
              updateTabBarPin();
              const nextShowSeparator = event.currentTarget.scrollTop > 6;
              setShowSeparator((current) =>
                current === nextShowSeparator ? current : nextShowSeparator,
              );
              requestAnimationFrame(() => {
                updateTabBarPin();
              });
            }}
          >
          <div className="px-4 pt-3 pb-4 relative">
            <div className="flex flex-col gap-4.5">
              <div className="flex flex-col gap-0.5 max-w-62.5">
                <div className="flex items-center gap-1 min-w-0">
                  <TUXText
                    as="h1"
                    typographyPreset="LargeTitle-Bold"
                    textDisplay="truncate"
                    color="UIText1"
                  >
                    Coldplay
                  </TUXText>
                  <button
                    type="button"
                    aria-label="Switch account"
                    className="flex items-center justify-center w-5 h-5"
                  >
                    <TUXIconArrowTriangleDownLargeFill size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-1 min-w-0">
                  <TUXText typographyPreset="P3-Semibold" color="UIText3" textDisplay="truncate">
                    @coldplay
                  </TUXText>
                  <TUXIconColorVerifiedBadge size={10} />
                  <TUXText typographyPreset="P3-Semibold" color="UIText3">
                    ·
                  </TUXText>
                  <TUXText typographyPreset="P3-Semibold" color="UIText3" textDisplay="truncate">
                    Artist
                  </TUXText>
                </div>
              </div>

              <div className="flex items-center gap-6 w-62.5">
                {(
                  [
                    { value: "36", label: "Following" },
                    { value: "8.1M", label: "Followers" },
                    { value: "88.3M", label: "Likes" },
                  ] as const
                ).map((item) => (
                  <div key={item.label} className="flex flex-col items-start text-left">
                    <TUXText typographyPreset="H4-Semibold" color="UIText1">
                      {item.value}
                    </TUXText>
                    <TUXText typographyPreset="P3-Regular" color="UIText3">
                      {item.label}
                    </TUXText>
                  </div>
                ))}
              </div>
            </div>

            <ProfileStoryAvatarHost />
          </div>

          <div className="px-4 pb-3">
            <div className="flex flex-col gap-0.5">
              <TUXText typographyPreset="P3-Regular" color="UIText3">
                He/him/his
              </TUXText>
              <TUXText typographyPreset="P2-Regular" color="UIText1">
                Tik Official Coldplay Tok. The new album, Moon Music, out now. Your Japanese bestie🇯🇵🫶#comedy
              </TUXText>
            </div>
            <div className="mt-1">
              <TUXText typographyPreset="P2-Semibold" color="UIText1">
                lemon8-app.com/bimbingan{" "}
                <span style={{ color: getColorCSSVar("UIText1") }}>and</span> 1 more
              </TUXText>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 px-4 pb-[12px]">
            {(
              [
                {
                  key: "watch-history",
                  label: "Watch history",
                  icon: <TUXIconColorProfileWatchHistoryFill size={12} />,
                },
                {
                  key: "your-orders",
                  label: "Your orders",
                  icon: <TUXIconColorProfileOrderFill size={12} />,
                },
                {
                  key: "showcase",
                  label: "Showcase",
                  icon: <TUXIconColorProfileShowcaseFill size={12} />,
                },
              ] as const
            ).map((chip) => (
              <button
                key={chip.key}
                type="button"
                className="flex items-center gap-1 rounded-full"
                style={{
                  paddingInline: 9,
                  paddingBlock: 6,
                  borderWidth: 0.5,
                  borderStyle: "solid",
                  borderColor: getColorCSSVar("UIShapeNeutral3"),
                  backgroundColor: getColorCSSVar("UIPageFlat1"),
                }}
              >
                <span
                  className="flex shrink-0 items-center justify-center"
                  style={{ width: 12, height: 12 }}
                >
                  {chip.icon}
                </span>
                <TUXText typographyPreset="P2-Semibold" color="UIText1">
                  {chip.label}
                </TUXText>
              </button>
            ))}
          </div>

          <div ref={tabBarSentinelRef} className="mt-2 h-px w-full shrink-0" aria-hidden />

          <div
            ref={tabBarRef}
            className="relative z-10 shrink-0 bg-tux-v2-ui-page-flat-1"
          >
              <TUXTabBar
                items={topTabs.map((tab) => ({
                  itemKey: tab.key,
                  leadingIcon: tab.icon,
                  showTrailingArrow: tab.showTrailingArrow,
                }))}
                activeKey={activeTopTab}
                onChange={handleTopTabChange}
                showSeparator={false}
                showFadingEdge={false}
              />
              <div
                style={{
                  height: "0.5px",
                  backgroundColor: getColorCSSVar("UIShapeNeutral3"),
                }}
              />
            </div>

          <div ref={tabContentRef}>
            {activeTopTab === "private" ? (
              <div className="pt-2">
                <MusicTabContent tracks={selfProfileTabData.musicTracks} />
              </div>
            ) : null}

            {activeTopTab === "unknown" ? (
              <div>
                <RepostTabContent items={selfProfileTabData.reposts} />
              </div>
            ) : null}

            {activeTopTab === "shop" ? (
              <div className="pt-1">
                <ShopTabContent shop={selfProfileTabData.shop} />
              </div>
            ) : null}

            {activeTopTab === "posts" ? (
              <div className="flex items-center gap-4.5 px-4 py-3">
                <div
                  className="flex items-center justify-center w-4 h-4"
                  style={{ color: getColorCSSVar("UIShapeNeutral2") }}
                >
                  <TUXIconGearFill size={15} />
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1"
                  style={{ color: getColorCSSVar("UIShapeNeutral2") }}
                >
                  <TUXIconExpProfileExpIconPlaylistFill size={14} />
                  <TUXText typographyPreset="P2-Semibold" color="UIText1">
                    Moon Music
                  </TUXText>
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1"
                  style={{ color: getColorCSSVar("UIShapeNeutral2") }}
                >
                  <TUXIconExpProfileExpIconPlaylistFill size={14} />
                  <TUXText typographyPreset="P2-Semibold" color="UIText1">
                    Jonny
                  </TUXText>
                </button>
              </div>
            ) : null}

            {activeTopTab === "posts" ||
            activeTopTab === "bookmarks" ||
            activeTopTab === "likes" ? (
            <div
              className="w-full"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1.5px",
              }}
            >
              {activeTopTab === "posts"
                ? videoItems.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className="relative overflow-hidden"
                      style={{
                        backgroundColor: getColorCSSVar("UIShapeNeutral4"),
                        aspectRatio: "129 / 173",
                      }}
                      aria-label="Video"
                    >
                      <img
                        alt=""
                        src={item.thumbnailSrc}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(to top, var(--tux-v2-color-ui-image-overlay-black-a15), transparent 45%)",
                        }}
                      />
                      <div
                        className="absolute left-0 right-0 bottom-0"
                        style={{
                          height: 52,
                          background:
                            "linear-gradient(to top, var(--tux-v2-color-ui-image-overlay-black-a50), transparent)",
                        }}
                      />
                      {item.title ? (
                        <div
                          className="absolute left-1.5 top-1.5"
                          style={{
                            color: "var(--tux-v2-color-ui-image-overlay-white)",
                          }}
                        >
                          <TUXText typographyPreset="P2-Semibold" color="UIImageOverlayWhite">
                            {item.title}
                          </TUXText>
                        </div>
                      ) : null}
                      {item.badge ? (
                        <div className="absolute left-1.5 top-1.5">
                          <div
                            className="px-1.5 py-0.5 rounded flex items-center justify-center"
                            style={{
                              height: 18,
                              backgroundColor: getColorCSSVar("UIShapePrimary"),
                              color: getColorCSSVar("UIShapeText1OnPrimary"),
                            }}
                          >
                            <TUXText
                              typographyPreset="P3-Semibold"
                              color="UIShapeText1OnPrimary"
                              className="block"
                              style={{ transform: "translateY(0.5px)" }}
                            >
                              {item.badge}
                            </TUXText>
                          </div>
                        </div>
                      ) : null}
                      <div
                        className="absolute left-1 bottom-1.5 flex items-center gap-0.5"
                        style={{
                          color: "var(--tux-v2-color-ui-image-overlay-white)",
                        }}
                      >
                        <span className="flex items-center justify-center w-4 h-4">
                          {item.metricIcon === "draft" ? (
                            <TUXIconDraft size={14} />
                          ) : (
                            <TUXIconPlay size={14} />
                          )}
                        </span>
                        <TUXText typographyPreset="P2-Semibold" color="UIImageOverlayWhite">
                          {item.metric}
                        </TUXText>
                      </div>
                    </button>
                  ))
                : (activeTopTab === "likes" ? likedVideoItems : bookmarkVideoItems).map(
                    (item) => (
                      <button
                        key={item.key}
                        type="button"
                        className="relative overflow-hidden"
                        style={{
                          backgroundColor: getColorCSSVar("UIShapeNeutral4"),
                          aspectRatio: "129 / 173",
                        }}
                        aria-label="Video"
                      >
                        <img
                          alt=""
                          src={item.thumbnailSrc}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              "linear-gradient(to top, var(--tux-v2-color-ui-image-overlay-black-a15), transparent 45%)",
                          }}
                        />
                        <div
                          className="absolute left-0 right-0 bottom-0"
                          style={{
                            height: 52,
                            background:
                              "linear-gradient(to top, var(--tux-v2-color-ui-image-overlay-black-a50), transparent)",
                          }}
                        />
                        <div
                          className="absolute left-1 bottom-1.5 flex items-center gap-0.5"
                          style={{
                            color: "var(--tux-v2-color-ui-image-overlay-white)",
                          }}
                        >
                          <span className="flex items-center justify-center w-4 h-4">
                            <TUXIconPlay size={14} />
                          </span>
                          <TUXText typographyPreset="P2-Semibold" color="UIImageOverlayWhite">
                            {item.metric}
                          </TUXText>
                        </div>
                      </button>
                    ),
                  )}
            </div>
            ) : null}
          </div>
          </div>
          {bottomTabBar ? <div className="flex-none">{bottomTabBar}</div> : null}
        </div>
      );
    }

    return <ProfilePageContent />;
  }

  const pagePushManager = useMemo(
    () => ({ ...pageStage, setStageElement: attachStageElement }),
    [attachStageElement, pageStage],
  );

  return <PagePushStage manager={pagePushManager} />;
}
