import {
  TUXAvatar,
  TUXListCell,
  TUXListHeader,
  TUXListView,
  TUXNavBar,
  TUXText,
  getColorCSSVar,
} from "@byted-tiktok/tux-web";
import { useAppFrame } from "../../components/sys/app_frame";
import { AppNavBarBackButton } from "../../components/sys/app_nav_bar_back_button";
import { showAppFrameTopToast } from "../../components/sys/app_frame_top_toast";
import {
  TUXIconARectangleFill,
  TUXIconAccessibilityFill,
  TUXIconCloudArrowDownFill,
  TUXIconArrowLeftArrowRightFill,
  TUXIconArrowToLeftFill,
  TUXIconArrowTurnUpRightFill,
  TUXIconAtFill,
  TUXIconBellFill,
  TUXIconBlockFill,
  TUXIconBookmarkFill,
  TUXIconChevronRightSlimThinLTR,
  TUXIconClockFill,
  TUXIconCommentFill,
  TUXIconContrastFill,
  TUXIconDownloadFill,
  TUXIconDropBoltFill,
  TUXIconFamilyFill,
  TUXIconFootPrintFill,
  TUXIconHeadphoneFill,
  TUXIconHeartFill,
  TUXIconHourglassFill,
  TUXIconInfoCircleFill,
  TUXIconLIVETVFill,
  TUXIconLinkFill,
  TUXIconLiveWallpaperFill,
  TUXIconLockLargeFill,
  TUXIconMusicNoteFill,
  TUXIconPaperplaneFill,
  TUXIconPersonFill,
  TUXIconPersonArrowLeftRightFill,
  TUXIconPersonDotFill,
  TUXIconPersonMapPinFill,
  TUXIconPlaylist2Fill,
  TUXIconShieldFill,
  TUXIconVideoStackSquareFill,
  TUXIconSpeaker2FillLTR,
  TUXIconTrashBinFill,
  TUXIconTwoPersonLargeFill,
  TUXIconVerticalRectanglePlayFill,
  TUXIconVideoFill,
} from "@byted-tiktok/tux-icons";
import { useState, type MouseEvent, type ReactNode } from "react";

import { localAvatarUrlForDisplay } from "../../utils/local_avatar";

const ICON_SIZE = 20;
const CHEVRON_COLOR = "UITextPlaceholder";

type SettingsItem = {
  key: string;
  label: string;
  icon: ReactNode;
  trailingValue?: string;
  trailing?: ReactNode;
};

type SettingsSection = {
  key: string;
  title: string;
  items: SettingsItem[];
};

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    key: "activity",
    title: "Activity",
    items: [
      {
        key: "manage-posts",
        label: "Manage posts",
        icon: <TUXIconVideoStackSquareFill size={ICON_SIZE} />,
      },
      {
        key: "content-preferences",
        label: "Content preferences",
        icon: <TUXIconVideoFill size={ICON_SIZE} />,
      },
      { key: "live", label: "LIVE", icon: <TUXIconLIVETVFill size={ICON_SIZE} /> },
      { key: "notifications", label: "Notifications", icon: <TUXIconBellFill size={ICON_SIZE} /> },
      {
        key: "time-and-wellbeing",
        label: "Time and well-being",
        icon: <TUXIconHourglassFill size={ICON_SIZE} />,
      },
      {
        key: "family-pairing",
        label: "Family Pairing",
        icon: <TUXIconFamilyFill size={ICON_SIZE} />,
      },
    ],
  },
  {
    key: "account",
    title: "Account",
    items: [
      { key: "account", label: "Account", icon: <TUXIconPersonFill size={ICON_SIZE} /> },
      {
        key: "security-permissions",
        label: "Security & permissions",
        icon: <TUXIconShieldFill size={ICON_SIZE} />,
      },
      {
        key: "share-profile",
        label: "Share profile",
        icon: <TUXIconArrowTurnUpRightFill size={ICON_SIZE} />,
      },
    ],
  },
  {
    key: "visibility",
    title: "Visibility",
    items: [
      {
        key: "private-account",
        label: "Private account",
        icon: <TUXIconLockLargeFill size={ICON_SIZE} />,
      },
      {
        key: "blocked-accounts",
        label: "Blocked accounts",
        icon: <TUXIconBlockFill size={ICON_SIZE} />,
      },
    ],
  },
  {
    key: "interactions",
    title: "Interactions",
    items: [
      { key: "comments", label: "Comments", icon: <TUXIconCommentFill size={ICON_SIZE} /> },
      {
        key: "mention",
        label: "Mention",
        icon: <TUXIconAtFill size={ICON_SIZE} />,
      },
      {
        key: "direct-messages",
        label: "Direct messages",
        icon: <TUXIconPaperplaneFill size={ICON_SIZE} />,
      },
      {
        key: "activity-status",
        label: "Activity status",
        icon: <TUXIconPersonDotFill size={ICON_SIZE} />,
        trailingValue: "On",
      },
      {
        key: "reuse-of-content",
        label: "Reuse of content",
        icon: <TUXIconPlaylist2Fill size={ICON_SIZE} />,
      },
      {
        key: "shared-links",
        label: "Shared links",
        icon: <TUXIconLinkFill size={ICON_SIZE} />,
        trailingValue: "On",
      },
      {
        key: "downloads",
        label: "Downloads",
        icon: <TUXIconDownloadFill size={ICON_SIZE} />,
        trailingValue: "Off",
      },
      {
        key: "following-list",
        label: "Following list",
        icon: <TUXIconTwoPersonLargeFill size={ICON_SIZE} />,
        trailingValue: "Everyone",
      },
      {
        key: "liked-videos",
        label: "Liked videos",
        icon: <TUXIconHeartFill size={ICON_SIZE} />,
        trailingValue: "Everyone",
      },
      {
        key: "favourite-sounds",
        label: "Favourite sounds",
        icon: <TUXIconBookmarkFill size={ICON_SIZE} />,
        trailingValue: "Off",
      },
      {
        key: "viewers",
        label: "Viewers",
        icon: <TUXIconFootPrintFill size={ICON_SIZE} />,
        trailingValue: "Off",
      },
    ],
  },
  {
    key: "preferences",
    title: "Preferences",
    items: [
      { key: "music", label: "Music", icon: <TUXIconMusicNoteFill size={ICON_SIZE} /> },
      {
        key: "inbox-messaging",
        label: "Inbox & Messaging",
        icon: <TUXIconPersonArrowLeftRightFill size={ICON_SIZE} />,
      },
      {
        key: "activity-center",
        label: "Activity center",
        icon: <TUXIconClockFill size={ICON_SIZE} />,
      },
      {
        key: "audience-controls",
        label: "Audience controls",
        icon: <TUXIconTwoPersonLargeFill size={ICON_SIZE} />,
      },
      { key: "ads", label: "Ads", icon: <TUXIconSpeaker2FillLTR size={ICON_SIZE} /> },
      {
        key: "playback",
        label: "Playback",
        icon: <TUXIconVerticalRectanglePlayFill size={ICON_SIZE} />,
      },
      { key: "display", label: "Display", icon: <TUXIconContrastFill size={ICON_SIZE} /> },
      { key: "language", label: "Language", icon: <TUXIconARectangleFill size={ICON_SIZE} /> },
      {
        key: "accessibility",
        label: "Accessibility",
        icon: <TUXIconAccessibilityFill size={ICON_SIZE} />,
      },
      {
        key: "contacts-and-location",
        label: "Contacts and location",
        icon: <TUXIconPersonMapPinFill size={ICON_SIZE} />,
      },
    ],
  },
  {
    key: "cache-cellular",
    title: "Cache & Cellular",
    items: [
      {
        key: "offline-videos",
        label: "Offline videos",
        icon: <TUXIconCloudArrowDownFill size={ICON_SIZE} />,
      },
      {
        key: "free-up-space",
        label: "Free up space",
        icon: <TUXIconTrashBinFill size={ICON_SIZE} />,
      },
      {
        key: "data-saver",
        label: "Data Saver",
        icon: <TUXIconDropBoltFill size={ICON_SIZE} />,
      },
      {
        key: "wallpaper",
        label: "Wallpaper",
        icon: <TUXIconLiveWallpaperFill size={ICON_SIZE} />,
      },
    ],
  },
  {
    key: "support-about",
    title: "Support & About",
    items: [
      { key: "help-center", label: "Help Center", icon: <TUXIconHeadphoneFill size={ICON_SIZE} /> },
      {
        key: "privacy-center",
        label: "Privacy Center",
        icon: <TUXIconLockLargeFill size={ICON_SIZE} />,
      },
      {
        key: "terms",
        label: "Terms and Policies",
        icon: <TUXIconInfoCircleFill size={ICON_SIZE} />,
      },
    ],
  },
  {
    key: "login",
    title: "Login",
    items: [
      {
        key: "switch",
        label: "Switch account",
        icon: <TUXIconArrowLeftArrowRightFill size={ICON_SIZE} />,
        trailing: (
          <div className="flex items-center gap-3">
            <TUXAvatar
              size={32}
              src={localAvatarUrlForDisplay(192, 1)}
              alt=""
            />
            <div style={{ color: getColorCSSVar(CHEVRON_COLOR) }}>
              <TUXIconChevronRightSlimThinLTR size={16} />
            </div>
          </div>
        ),
      },
      { key: "logout", label: "Log out", icon: <TUXIconArrowToLeftFill size={ICON_SIZE} /> },
    ],
  },
];

/** Matches Figma List Item / Plain → Leading Icon (py-6 + 20px glyph). */
function PlainListLeadingIcon({ children }: { children: ReactNode }) {
  return (
    <span
      className="box-border inline-flex shrink-0 items-start py-1.5"
      style={{ color: getColorCSSVar(CHEVRON_COLOR) }}
    >
      <span
        className="inline-flex items-center justify-center"
        style={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          fontSize: ICON_SIZE,
          lineHeight: 0,
        }}
      >
        {children}
      </span>
    </span>
  );
}

function SettingsTrailing({
  trailingValue,
  trailing,
}: {
  trailingValue?: string;
  trailing?: ReactNode;
}) {
  if (trailing) {
    return <div className="flex min-h-8 items-center justify-end">{trailing}</div>;
  }

  return (
    <div className="flex min-h-8 items-center justify-end gap-1">
      {trailingValue ? (
        <TUXText typographyPreset="Headline-Regular" color="UIText3">
          {trailingValue}
        </TUXText>
      ) : null}
      <div style={{ color: getColorCSSVar(CHEVRON_COLOR) }}>
        <TUXIconChevronRightSlimThinLTR size={16} />
      </div>
    </div>
  );
}

export type SettingsAndPrivacyPageProps = {
  onBack?: (trigger?: HTMLElement | null) => void;
  onItemClick?: (item: SettingsItem, trigger?: HTMLElement | null) => void;
};

export default function SettingsAndPrivacyPage({
  onBack,
  onItemClick,
}: SettingsAndPrivacyPageProps) {
  const { topInsetCss } = useAppFrame();
  const [showSeparator, setShowSeparator] = useState(false);

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden"
      style={{
        backgroundColor: getColorCSSVar("UIPageGrouped1"),
        paddingTop: topInsetCss,
      }}
    >
      <TUXNavBar
        heightPreset={44}
        fixed={false}
        showSeparator={showSeparator}
        backgroundColor="UIPageGrouped1"
        leading={<AppNavBarBackButton onBack={onBack} />}
      />

      <div
        className="min-h-0 flex-1 overflow-y-auto"
        onScroll={(event) => {
          const nextShowSeparator = event.currentTarget.scrollTop > 6;
          setShowSeparator((current) =>
            current === nextShowSeparator ? current : nextShowSeparator,
          );
        }}
      >
        <div className="px-6 pb-3 pt-2">
          <TUXText as="h1" typographyPreset="LargeTitle-Bold" color="UIText1">
            Settings and privacy
          </TUXText>
        </div>

        <div className="flex flex-col gap-2 pb-6">
          {SETTINGS_SECTIONS.map((section) => (
            <TUXListView
              key={section.key}
              grouped
              header={<TUXListHeader title={section.title} sizePreset="small" />}
            >
              {section.items.map((item) => (
                <TUXListCell
                  key={item.key}
                  title={item.label}
                  leadingIcon={<PlainListLeadingIcon>{item.icon}</PlainListLeadingIcon>}
                  trailing={
                    <SettingsTrailing
                      trailingValue={item.trailingValue}
                      trailing={item.trailing}
                    />
                  }
                  onClick={(event: MouseEvent<HTMLElement>) => {
                    if (onItemClick) {
                      onItemClick(item, event.currentTarget);
                      return;
                    }
                    showAppFrameTopToast({
                      text: item.label,
                      duration: 1500,
                      displayMode: "replace",
                    });
                  }}
                />
              ))}
            </TUXListView>
          ))}
        </div>

        <div className="py-6">
          <TUXText typographyPreset="P3-Regular" color="UIText2" className="block text-center">
            V22.2.0
          </TUXText>
        </div>
      </div>
    </div>
  );
}

export { SETTINGS_SECTIONS, type SettingsItem, type SettingsSection };
