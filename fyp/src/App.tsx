/**
 * Tab 应用壳层入口。
 *
 *   TUXApp
 *     AppFrame
 *       children → [data-app-frame-content]（FeedSidebarWrapper → Tabbar → 各 Tab 页）
 *       frameOverlays → AddToStoryOverlay + AppChromeStatusBar（须在 content 外，见 app_frame.tsx）
 *       HomeIndicator / SoftKeyboard（AppFrame 内建）
 *     RouteSwitcher + ThemeSwitcher（在 AppFrame 外、TUXApp 内）
 *
 * 不要在此按 route/activeTab 分支 StatusBar 主题；沉浸式屏用 useRegisterAppChromeSurfaceTheme。
 */
import "./App.css";
import { TUXApp } from "@byted-tiktok/tux-web";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAppNavigation } from "./context/app_navigation";
import {
  appPathForRoute,
  appPathForTab,
  indexToTab,
  tabToIndex,
  type AppRoute,
} from "./routes/app_route_tree";
import {
  IconExpExp02IconFriends,
  IconExpExp02IconFriendsFill,
  IconExpExp02IconHome,
  IconExpExp02IconHomeFill,
  IconExpExp02IconInbox,
  IconExpExp02IconInboxFill,
  IconExpExp02IconProfile,
  IconExpExp02IconProfileFill,
} from "@byted-tiktok/tux-icons";

import Tabbar, { AppTabBarNav } from "./components/app/tabbar";
import CreationIcon from "./components/app/creation_icon";
import { APP_Z_OVERLAY } from "./components/sys/app_z_index";
import AppFrame from "./components/sys/app_frame";
import { FeedSidebarWrapper } from "./page/home/components/sidebar/feed_sidebar_wrapper";
import RouteSwitcher from "./components/sys/route_switcher";
import { AppChromeStatusBar } from "./components/sys/status_bar";
import ThemeSwitcher from "./components/sys/theme_switcher";
import { VisitorProfileAppChrome } from "./components/sys/visitor_profile_app_chrome";
import { useTheme, type ResolvedTheme } from "./context/theme";
import InboxPage from "./page/inbox/inbox_page";
import { InboxBannerControl } from "./page/inbox/components/inbox_banner_control";
import CreationPage from "./page/creation/creation_page";
import { creationAppTabBarThemeOverride } from "./page/creation/creation_create_region_theme";
import AddToStoryOverlay from "./page/creation/add_to_story_page";
import FriendsPage from "./page/friends/friends_page";
import HomePage from "./page/home/home_page";
import {
  SearchHomeTabPage,
  SearchRouteConfigControls,
  isHomeSearchRoute,
} from "./page/search/search_route_entry";
import ProfilePage from "./page/profile/profile_page";
import { CommentExperimentPanel } from "./page/home/components/comment_panel/comment_experiment_panel";
import { CommentContentPanel } from "./page/home/components/comment_panel/comment_content_panel";
import {
  resetCommentContentDocument,
  setCommentContentDocument,
  useCommentContentStore,
} from "./page/home/components/comment_panel/comment_content_store";
import {
  applyCommentExperimentPreset,
  deleteCommentExperimentPreset,
  resetCommentExperimentConfig,
  saveCommentExperimentPreset,
  setActiveCommentExperimentId,
  setCommentEmptyStateExperimentConfig,
  setCommentExperimentConfig,
  setCommentTopBarExperimentConfig,
  setCommentWikiExperimentConfig,
  useCommentExperimentStore,
} from "./page/home/components/comment_panel/comment_experiment_store";
import { useCommentPanelVisualStore } from "./page/home/components/comment_panel/comment_panel_visual_store";
import { FeedCardDebugControls } from "./page/home/components/feed_card";
import { FeedInfoDebugControls } from "./page/home/components/feed_info/feed_info_debug_controls";
import { MusicDetailExperimentDebugControls } from "./page/home/components/music_detail_experiment_toolbox";
import PhotoTextDevPanel from "./page/home/components/photo_text_dev_panel";
import { useHomeForYouActivePageKind } from "./page/home/components/feed_card.config";
import { useMusicDetailVisualStore } from "./page/home/components/music_detail_visual_store";

function App({ overlay }: { overlay?: ReactNode }) {
  const batchReview = new URLSearchParams(window.location.search).get("review") === "batch";
  const { resolvedTheme } = useTheme();
  const { route, navigate } = useAppNavigation();
  const [activeTab, setActiveTab] = useState(() =>
    route ? tabToIndex(route.tab) : 0,
  );
  const [homeSurfaceTheme, setHomeSurfaceTheme] =
    useState<ResolvedTheme>("dark");
  const commentExperiment = useCommentExperimentStore();
  const commentContent = useCommentContentStore();
  const {
    isOpen: isCommentPanelOpen,
    preserveFeedChrome: preserveCommentFeedChrome,
  } = useCommentPanelVisualStore();
  const { isOpen: isMusicDetailOpen } = useMusicDetailVisualStore();
  const shouldCommentHideHomeChrome =
    isCommentPanelOpen && !preserveCommentFeedChrome;
  const isSearchRouteActive = isHomeSearchRoute(route);
  const homeForYouActivePageKind = useHomeForYouActivePageKind();
  // 延迟隐藏 Home tab/顶部导航栏：面板打开时稍等一会再隐藏，避免比面板入场动画更快导致闪烁；
  // 面板关闭时立即恢复，让 Home chrome 抢在面板退场动画结束前回到位。
  const [shouldHideHomeChrome, setShouldHideHomeChrome] = useState(false);

  useEffect(() => {
    if (shouldCommentHideHomeChrome) {
      const timer = window.setTimeout(() => setShouldHideHomeChrome(true), 220);
      return () => window.clearTimeout(timer);
    }
    setShouldHideHomeChrome(false);
    return undefined;
  }, [shouldCommentHideHomeChrome]);

  useEffect(() => {
    if (!route) return;
    const nextIndex = tabToIndex(route.tab);
    setActiveTab((current) => (current === nextIndex ? current : nextIndex));
  }, [route]);

  const lastInboxTapRef = useRef(0);
  /** Last in-app route before opening Creation — used by the close (X) control. */
  const routeBeforeCreationRef = useRef<AppRoute>({
    tab: "home",
    sub: { screen: "feed" },
  });
  useEffect(() => {
    if (!route || route.tab === "creation") return;
    routeBeforeCreationRef.current = route;
  }, [route]);

  const handleCreationClose = useCallback(() => {
    const prior = routeBeforeCreationRef.current;
    const returnRoute: AppRoute =
      prior.tab === "creation" ? { tab: "home", sub: { screen: "feed" } } : prior;
    setActiveTab(tabToIndex(returnRoute.tab));
    navigate(appPathForRoute(returnRoute));
  }, [navigate]);

  const handleTabChange = useCallback(
    (index: number) => {
      // 双击底部 Inbox tab (index 3) -> 触发业务 tab 栏切换
      if (index === 3) {
        const now = Date.now();
        if (now - lastInboxTapRef.current < 300) {
          window.dispatchEvent(new CustomEvent("inbox-double-tap-toggle-tabs"));
          lastInboxTapRef.current = 0;
        } else {
          lastInboxTapRef.current = now;
        }
      } else {
        lastInboxTapRef.current = 0;
      }
      if (index !== 0) {
        document.documentElement.removeAttribute("data-home-explore-surface");
      }
      setActiveTab(index);
      navigate(appPathForTab(indexToTab(index)));
    },
    [navigate],
  );

  const creationTabThemeOverride = useMemo(
    () => creationAppTabBarThemeOverride(route, resolvedTheme),
    [route, resolvedTheme],
  );

  const tabs = useMemo(
    () =>
      [
        {
          icon: IconExpExp02IconHome,
          activeIcon: IconExpExp02IconHomeFill,
          text: "Home",
          themeOverride: homeSurfaceTheme,
        },
        {
          icon: IconExpExp02IconFriends,
          activeIcon: IconExpExp02IconFriendsFill,
          text: "Friends",
        },
        {
          icon: CreationIcon,
          activeIcon: CreationIcon,
          themeOverride: creationTabThemeOverride,
        },
        {
          icon: IconExpExp02IconInbox,
          activeIcon: IconExpExp02IconInboxFill,
          text: "Inbox",
        },
        {
          icon: IconExpExp02IconProfile,
          activeIcon: IconExpExp02IconProfileFill,
          text: "Profile",
        },
      ] as const,
    [creationTabThemeOverride, homeSurfaceTheme],
  );

  return (
    <TUXApp theme={resolvedTheme} textDirection="ltr" platform="iOS">
      <AppFrame
        frameOverlays={
          <>
            <AddToStoryOverlay />
            {/* 壳层顶栏须在业务 content 外且 z-index > APP_Z_OVERLAY */}
            <AppChromeStatusBar />
          </>
        }
      >
        <FeedSidebarWrapper activeTab={activeTab}>
          <VisitorProfileAppChrome>
            <div className="relative flex h-full min-h-0 min-w-0 flex-col">
              <Tabbar
                className="flex-1 min-h-0"
                activeIndex={activeTab}
                onChange={handleTabChange}
                iconSize={24}
                // Guest profile is an opaque full-screen overlay that covers the
                // tab bar on its own — keep the underlying tab bar mounted so the
                // push/parallax transition doesn't jump when it appears/disappears.
                tabBarVisible={
                  activeTab !== 1 &&
                  activeTab !== 2 &&
                  activeTab !== 3 &&
                  activeTab !== 4 &&
                  !isSearchRouteActive &&
                  !isMusicDetailOpen &&
                  !shouldHideHomeChrome
                }
                tabs={tabs}
                pages={
                  [
                    isSearchRouteActive ? (
                      <SearchHomeTabPage
                        route={route}
                        isTabActive={activeTab === 0}
                      />
                    ) : (
                      <HomePage
                        isTabActive={activeTab === 0}
                        onSurfaceThemeChange={setHomeSurfaceTheme}
                      />
                    ),
                    <FriendsPage
                      isTabActive={activeTab === 1}
                      onNavigateToHome={() => {
                        setActiveTab(0);
                        navigate(appPathForTab("home"));
                      }}
                      bottomTabBar={
                        <AppTabBarNav
                          tabs={tabs}
                          activeIndex={1}
                          onChange={handleTabChange}
                          iconSize={24}
                        />
                      }
                    />,
                    <CreationPage
                      isTabActive={activeTab === 2}
                      onClose={handleCreationClose}
                    />,
                    <InboxPage
                      isTabActive={activeTab === 3}
                      bottomTabBar={
                        <AppTabBarNav
                          tabs={tabs}
                          activeIndex={3}
                          onChange={handleTabChange}
                          iconSize={24}
                        />
                      }
                    />,
                    <ProfilePage
                      isTabActive={activeTab === 4}
                      bottomTabBar={
                        <AppTabBarNav
                          tabs={tabs}
                          activeIndex={4}
                          onChange={handleTabChange}
                          iconSize={24}
                        />
                      }
                    />,
                  ] as const
                }
              />
              {overlay ? (
                <div className="absolute inset-0" style={{ zIndex: APP_Z_OVERLAY }}>
                  {overlay}
                </div>
              ) : null}
            </div>
          </VisitorProfileAppChrome>
        </FeedSidebarWrapper>
      </AppFrame>

      {!batchReview && <RouteSwitcher />}
      {!batchReview && <ThemeSwitcher />}
      {!batchReview && activeTab === 0 && !isSearchRouteActive && homeForYouActivePageKind === "feed-item" ? (
        <>
          <FeedInfoDebugControls
            stackBelowCommentExperiment={
              commentExperiment.visible
            }
          />
          <MusicDetailExperimentDebugControls
            stackBelowCommentExperiment={
              commentExperiment.visible
            }
          />
          <PhotoTextDevPanel
            stackBelowCommentExperiment={
              commentExperiment.visible
            }
          />
        </>
      ) : null}
      {!batchReview && activeTab === 0 && !isSearchRouteActive && homeForYouActivePageKind === "feed-card" ? (
        <FeedCardDebugControls
          stackBelowCommentExperiment={
            commentExperiment.visible
          }
        />
      ) : null}
      <SearchRouteConfigControls route={route} />
      {activeTab === 3 ? (
        <InboxBannerControl
          stackBelowCommentExperiment={commentExperiment.visible}
        />
      ) : null}
      <CommentExperimentPanel
        visible={commentExperiment.visible}
        activeExperimentId={commentExperiment.activeExperimentId}
        panelExpandConfig={commentExperiment.commentPanelExpand.config}
        panelExpandPresets={commentExperiment.commentPanelExpand.presets}
        wikiConfig={commentExperiment.commentWiki.config}
        wikiPresets={commentExperiment.commentWiki.presets}
        topBarConfig={commentExperiment.commentTopBar.config}
        topBarPresets={commentExperiment.commentTopBar.presets}
        emptyStateConfig={commentExperiment.commentEmptyState.config}
        emptyStatePresets={commentExperiment.commentEmptyState.presets}
        onActiveExperimentChange={setActiveCommentExperimentId}
        onPanelExpandConfigChange={setCommentExperimentConfig}
        onWikiConfigChange={setCommentWikiExperimentConfig}
        onTopBarConfigChange={setCommentTopBarExperimentConfig}
        onEmptyStateConfigChange={setCommentEmptyStateExperimentConfig}
        onSavePreset={saveCommentExperimentPreset}
        onApplyPreset={applyCommentExperimentPreset}
        onDeletePreset={deleteCommentExperimentPreset}
        onResetDefaults={resetCommentExperimentConfig}
      />
      <CommentContentPanel
        visible={commentContent.visible}
        document={commentContent.document}
        onDocumentChange={setCommentContentDocument}
        onReset={resetCommentContentDocument}
      />
    </TUXApp>
  );
}

export default App;
