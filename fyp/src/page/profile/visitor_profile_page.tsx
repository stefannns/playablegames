import {
  TUXButton,
  TUXNavBar,
  TUXNavBarIconAction,
  TUXTabBar,
  TUXText,
  getColorCSSVar,
} from "@byted-tiktok/tux-web";
import {
  TUXIconArrowTriangleDownLargeFill,
  TUXIconArrowTurnUpRight,
  TUXIconBell,
  TUXIconChevronLeftOffsetLTR,
  TUXIconExpProfileExpIconBookmarkFill,
  TUXIconExpProfileExpIconCollectionFill,
  TUXIconExpProfileExpIconMusicFill,
  TUXIconExpProfileExpIconPlaylistFill,
  TUXIconExpProfileExpIconRepostFill,
  TUXIconExpProfileExpIconShowcaseFill,
  TUXIconPaperplaneFill,
  TUXIconPersonPlusFill,
  TUXIconPlay,
} from "@byted-tiktok/tux-icons";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { useAppFrame } from "../../components/sys/app_frame";
import { setVisitorFollowing, useIsVisitorFollowing } from "./visitor_follow_store";
import {
  VisitorChipLiveIcon,
  VisitorChipShowcaseIcon,
  VisitorChipSubscriptionIcon,
} from "./visitor_chip_color_icons";
import { creatorAvatarUrlForFeedDisplay } from "../../utils/local_avatar";
import type { FeedItemCardContent } from "../home/components/feed_item_card";
import { ProfileFeedThumb } from "../home/components/visitor_profile/profile_feed_thumb";
import { ProfileVerifiedBadge } from "../home/components/visitor_profile/profile_verified_badge";
import { VisitorHighlightCover } from "../home/components/visitor_profile/visitor_highlight_cover";
import { MusicTabContent } from "../home/components/visitor_profile/music_tab_content";
import { RepostTabContent } from "../home/components/visitor_profile/repost_tab_content";
import { ShopTabContent } from "../home/components/visitor_profile/shop_tab_content";
import {
  deriveVisitorProfileData,
  type VisitorChipIconKey,
} from "../home/components/visitor_profile/visitor_profile_utils";
import { useProfileTabBarPin } from "./use_profile_tab_bar_pin";
import { useProfileTabScrollPreservation } from "./use_profile_tab_scroll_preservation";

const CHIP_ICON_SIZE = 12;
const VISITOR_PROFILE_NAV_ICON_COLOR = getColorCSSVar("UIText1");

function renderChipIcon(iconKey: VisitorChipIconKey) {
  switch (iconKey) {
    case "shop-bag":
      return <VisitorChipShowcaseIcon size={CHIP_ICON_SIZE} />;
    case "live-tv":
      return <VisitorChipLiveIcon size={CHIP_ICON_SIZE} />;
    case "star":
    default:
      return <VisitorChipSubscriptionIcon size={CHIP_ICON_SIZE} />;
  }
}

type VisitorProfilePageProps = {
  content: FeedItemCardContent;
  onBack: () => void;
};

type TopTabKey = "posts" | "music" | "shop" | "repost" | "bookmarks";

export default function VisitorProfilePage({ content, onBack }: VisitorProfilePageProps) {
  const { topInsetCss } = useAppFrame();
  const data = useMemo(() => deriveVisitorProfileData(content), [content]);
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

  const isFollowing = useIsVisitorFollowing(content.id);
  const setIsFollowing = (next: boolean) => setVisitorFollowing(content.id, next);
  const [avatarSrc, setAvatarSrc] = useState(data.avatarUrl);
  useEffect(() => {
    setAvatarSrc(data.avatarUrl);
  }, [data.avatarUrl]);

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
        key: "music",
        icon: <TUXIconExpProfileExpIconMusicFill size={20} />,
      },
      {
        key: "shop",
        icon: <TUXIconExpProfileExpIconShowcaseFill size={20} />,
      },
      {
        key: "repost",
        icon: <TUXIconExpProfileExpIconRepostFill size={20} />,
      },
      {
        key: "bookmarks",
        icon: <TUXIconExpProfileExpIconBookmarkFill size={20} />,
      },
    ],
    [],
  );

  return (
    <div
      className="flex flex-col bg-tux-v2-ui-page-flat-1 h-full min-h-0 overflow-hidden"
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
              aria-label="Back"
              width="40px"
              height="44px"
              icon={
                <TUXIconChevronLeftOffsetLTR
                  size={24}
                  color={VISITOR_PROFILE_NAV_ICON_COLOR}
                />
              }
              onClick={onBack}
            />
          }
          trailing={
            <div className="flex items-center">
              <TUXNavBarIconAction
                aria-label="Notifications"
                width="40px"
                height="44px"
                icon={<TUXIconBell size={24} color={VISITOR_PROFILE_NAV_ICON_COLOR} />}
              />
              <TUXNavBarIconAction
                aria-label="Share profile"
                width="40px"
                height="44px"
                icon={
                  <TUXIconArrowTurnUpRight size={24} color={VISITOR_PROFILE_NAV_ICON_COLOR} />
                }
              />
            </div>
          }
        />
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto"
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
        {/* Header: name / handle / stats + avatar */}
        <div className="relative px-4 pt-3 pb-3.5">
          <div className="flex flex-col gap-4.5">
            <div className="flex flex-col gap-0.5 max-w-[250px]">
              <TUXText
                as="h1"
                typographyPreset="LargeTitle-Bold"
                textDisplay="truncate"
                color="UIText1"
                className="min-w-0"
              >
                {data.nickname}
              </TUXText>

              <div className="flex items-center min-w-0">
                <TUXText
                  typographyPreset="P3-Semibold"
                  color="UIText3"
                  textDisplay="truncate"
                  className="min-w-0 leading-none! shrink"
                >
                  {data.handle}
                </TUXText>
                <ProfileVerifiedBadge size={10} className="mr-1 ml-0.5" />
                <TUXText typographyPreset="P3-Semibold" color="UIText3" className="leading-none!">
                  ·
                </TUXText>
                <TUXText
                  typographyPreset="P3-Semibold"
                  color="UIText3"
                  textDisplay="truncate"
                  className="ml-1 leading-none!"
                >
                  {data.category}
                </TUXText>
              </div>
            </div>

            <div className="flex items-center gap-6 w-[250px]">
              {[
                { value: data.followingCount, label: "Following" },
                { value: data.followersCount, label: "Followers" },
                { value: data.likesCount, label: "Likes" },
              ].map((item) => (
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

          <div className="top-2 right-4 absolute">
            <div
              className="bg-tux-v2-ui-shape-neutral-4 rounded-full overflow-hidden"
              style={{
                width: 96,
                height: 96,
                border: "1px solid var(--tux-v2-color-ui-shape-neutral-3)",
              }}
            >
              <img
                src={avatarSrc}
                alt={`${data.nickname} avatar`}
                className="w-full h-full object-cover"
                onError={() => {
                  setAvatarSrc(creatorAvatarUrlForFeedDisplay(96, content.id));
                }}
              />
            </div>
          </div>
        </div>

        {/* Follow / Message / Add friend — 关注前后两态，Figma 3370:63337 */}
        {/* data-no-drag: 这是操作按钮区，按住右滑不应触发返回手势。 */}
        <div className="px-4 pb-3" data-no-drag>
          {isFollowing ? (
            <div className="flex items-center gap-2 h-10">
              <button
                type="button"
                aria-label={`Message ${data.nickname}`}
                className="flex flex-1 justify-center items-center rounded-full h-full"
                style={{ backgroundColor: getColorCSSVar("UIShapeNeutral4") }}
              >
                <TUXText typographyPreset="H4-Semibold" color="UIText1">
                  Message
                </TUXText>
              </button>
              <button
                type="button"
                aria-label="Following"
                onClick={() => setIsFollowing(false)}
                className="flex justify-center items-center gap-0.5 px-4 rounded-full h-full"
                style={{
                  backgroundColor: getColorCSSVar("UIShapeNeutral4"),
                  color: getColorCSSVar("UIText1"),
                }}
              >
                <TUXText
                  typographyPreset="H4-Semibold"
                  color="UIText1"
                  className="whitespace-nowrap"
                >
                  Following
                </TUXText>
                <TUXIconArrowTriangleDownLargeFill size={14} />
              </button>
              <button
                type="button"
                aria-label={`Add ${data.nickname} as friend`}
                className="flex justify-center items-center rounded-full shrink-0"
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: getColorCSSVar("UIShapeNeutral4"),
                  color: getColorCSSVar("UIText1"),
                }}
              >
                <TUXIconPersonPlusFill size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 h-10">
              <div className="flex-1">
                <TUXButton
                  text="Follow"
                  themePreset="primary"
                  shapePreset="capsule"
                  sizePreset="medium"
                  smoothRadius
                  width="100%"
                  onClick={() => setIsFollowing(true)}
                />
              </div>
              <button
                type="button"
                aria-label={`Message ${data.nickname}`}
                className="flex justify-center items-center rounded-full shrink-0"
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: getColorCSSVar("UIShapeNeutral4"),
                  color: getColorCSSVar("UIText1"),
                }}
              >
                <TUXIconPaperplaneFill size={18} />
              </button>
              <button
                type="button"
                aria-label={`Add ${data.nickname} as friend`}
                className="flex justify-center items-center rounded-full shrink-0"
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: getColorCSSVar("UIShapeNeutral4"),
                  color: getColorCSSVar("UIText1"),
                }}
              >
                <TUXIconPersonPlusFill size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Bio */}
        <div className="px-4 pb-3">
          <div className="flex flex-col gap-0.5">
            <TUXText typographyPreset="P3-Regular" color="UIText3">
              {data.pronouns}
            </TUXText>
            <TUXText typographyPreset="P2-Regular" color="UIText1">
              {data.bio}
            </TUXText>
          </div>
          <div className="mt-1">
            <TUXText typographyPreset="P2-Semibold" color="UIText1">
              {data.link}{" "}
              <span style={{ color: getColorCSSVar("UIText1") }}>{data.linkSuffix}</span>
            </TUXText>
          </div>
        </div>

        {/* Chips: Showcase / Subscription / Next LIVE */}
        <div className="flex flex-wrap items-center gap-2 px-4 pb-[12px]">
          {data.chips.map((chip) => (
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
                className="flex justify-center items-center shrink-0"
                style={{ width: CHIP_ICON_SIZE, height: CHIP_ICON_SIZE }}
              >
                {renderChipIcon(chip.iconKey)}
              </span>
              <TUXText typographyPreset="P2-Semibold" color="UIText1">
                {chip.label}
              </TUXText>
            </button>
          ))}
        </div>

        {/* Highlights row */}
        <div className="flex items-center gap-[24px] pr-2 pb-3 pl-4 overflow-x-auto hide-scrollbar">
          {data.highlights.map((item) => (
            <button
              key={item.key}
              type="button"
              className="flex flex-col items-center gap-1 w-[54px] min-w-[54px] max-w-[54px] shrink-0"
            >
              <VisitorHighlightCover
                src={item.coverSrc}
                alt={`${item.label} highlight cover`}
              />
              <TUXText
                typographyPreset="P3-Regular"
                color="UIText1"
                className="block w-full text-center"
                textDisplay="truncate"
              >
                {item.label}
              </TUXText>
            </button>
          ))}
        </div>

        <div ref={tabBarSentinelRef} className="mt-2 h-px w-full shrink-0" aria-hidden />

        <div
          ref={tabBarRef}
          className="visitor-profile-top-tabs relative z-10 shrink-0 bg-tux-v2-ui-page-flat-1"
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

        <div ref={tabContentRef} className="bg-tux-v2-ui-page-flat-1">
        {/* Music tab：曲目列表 */}
        {activeTopTab === "music" ? (
          <div className="pt-2">
            <MusicTabContent tracks={data.musicTracks} />
          </div>
        ) : null}

        {/* Repost tab：转发网格 */}
        {activeTopTab === "repost" ? (
          <div>
            <RepostTabContent items={data.reposts} />
          </div>
        ) : null}

        {/* Shop tab：电商品牌主页 */}
        {activeTopTab === "shop" ? (
          <div className="pt-1">
            <ShopTabContent shop={data.shop} />
          </div>
        ) : null}

        {/* Playlists row 仅在 Posts 这种"我作品"语境的 tab 上显示 */}
        {activeTopTab !== "music" &&
        activeTopTab !== "repost" &&
        activeTopTab !== "shop" &&
        activeTopTab !== "bookmarks" ? (
          <div className="flex items-center gap-4.5 px-4 py-3">
            {data.playlists.map((title) => (
              <button
                key={title}
                type="button"
                className="flex items-center gap-1"
                style={{ color: getColorCSSVar("UIShapeNeutral2") }}
              >
                <TUXIconExpProfileExpIconPlaylistFill size={14} />
                <TUXText typographyPreset="P2-Semibold" color="UIText1">
                  {title}
                </TUXText>
              </button>
            ))}
          </div>
        ) : null}

        {/* Video grid（Posts / Bookmarks 等仍走九宫格的 tab） */}
        {activeTopTab !== "music" &&
        activeTopTab !== "repost" &&
        activeTopTab !== "shop" ? (
        <div
          className="w-full"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1.5px",
          }}
        >
          {data.videos.map((item) => (
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
              <ProfileFeedThumb
                thumbnailSrc={item.thumbnailSrc}
                videoThumbnailSrc={item.videoThumbnailSrc}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, var(--tux-v2-color-ui-image-overlay-black-a15), transparent 45%)",
                }}
              />
              <div
                className="right-0 bottom-0 left-0 absolute"
                style={{
                  height: 52,
                  background:
                    "linear-gradient(to top, var(--tux-v2-color-ui-image-overlay-black-a50), transparent)",
                }}
              />

              {item.badge && activeTopTab !== "bookmarks" ? (
                <div className="top-1.5 left-1.5 absolute">
                  <div
                    className="flex justify-center items-center px-1.5 py-0.5 rounded"
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
                className="bottom-1.5 left-1 absolute flex items-center gap-0.5"
                style={{ color: "var(--tux-v2-color-ui-image-overlay-white)" }}
              >
                <span className="flex justify-center items-center w-4 h-4">
                  <TUXIconPlay size={14} />
                </span>
                <TUXText typographyPreset="P2-Semibold" color="UIImageOverlayWhite">
                  {item.metric}
                </TUXText>
              </div>
            </button>
          ))}
        </div>
        ) : null}

        <div className="h-6" />
        </div>
      </div>
    </div>
  );
}
