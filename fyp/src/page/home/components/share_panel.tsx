import {
  IconArrowDownToLineBold,
  IconStoryStar,
  IconChromecastBold,
  IconColorDiscordCircle,
  IconColorEllipsisCircle,
  IconColorFacebookCircle,
  IconColorInstagramCircle,
  IconColorLinkCircle,
  IconColorRepostSquare,
  IconColorRepostTickSquare,
  IconColorSnapchatCircle,
  IconColorWhatsappCircle,
  IconEffectFill,
  IconDuetFill,
  IconFireFill,
  IconFlagFill,
  IconGifRectangleFill,
  IconGiftFill,
  IconHeartBrokenFill,
  IconLiveWallpaperFill,
  IconMagnifyingGlass,
  IconLivePhotoFill,
  IconPersonalizationFill,
  IconQuestionMarkCircleFillLTR,
  IconShoppingBagStarFill,
  IconSpeedMeterFill,
  IconStickerPlusFill,
  IconStitchFill,
  IconTextLatin,
  IconTemplatesCardsFill,
} from "@byted-tiktok/tux-icons";
import {
  getColorCSSVar,
  TUXNavBar,
  TUXNavBarCloseButton,
  TUXSheet,
  TUXText,
} from "@byted-tiktok/tux-web";
import { appFrameSheetChromeProps } from "../../../components/sys/app_frame_sheet_chrome";
import { localAvatarUrlForDisplay } from "../../../utils/local_avatar";

export type SharePanelProps = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  /** When false, hide the Repost quick action (rare; feed items always show it). */
  showRepost?: boolean;
  isReposted?: boolean;
  onRepostChange?: (reposted: boolean) => void;
  root?: HTMLElement | null;
};

type ShareQuickAction = {
  key: string;
  label: string;
  icon: JSX.Element;
};

type ShareContact = {
  key: string;
  name: string;
  avatar: string;
  online?: boolean;
};

const SHARE_CONTACTS: ShareContact[] = [
  {
    key: "angel",
    name: "Angel\nBotosh",
    avatar: localAvatarUrlForDisplay(88, 41),
  },
  {
    key: "design-group",
    name: "TikTok\nDesign (13)",
    avatar: localAvatarUrlForDisplay(88, 42),
  },
  {
    key: "justin-dokidis",
    name: "Justin\nDokidis",
    avatar: localAvatarUrlForDisplay(88, 43),
    online: true,
  },
  {
    key: "justin-aminoff",
    name: "Justin\nAminoff",
    avatar: localAvatarUrlForDisplay(88, 44),
  },
  {
    key: "jocelyn",
    name: "Jocelyn\nHerwig",
    avatar: localAvatarUrlForDisplay(88, 45),
  },
  {
    key: "olivia",
    name: "Olivia\nParker",
    avatar: localAvatarUrlForDisplay(88, 46),
  },
];

const SHARE_APP_ACTIONS: ShareQuickAction[] = [
  {
    key: "copy-link",
    label: "Copy link",
    icon: <IconColorLinkCircle width={56} height={56} />,
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: <IconColorWhatsappCircle width={56} height={56} />,
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: <IconColorFacebookCircle width={56} height={56} />,
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: <IconColorInstagramCircle width={56} height={56} />,
  },
  {
    key: "snapchat",
    label: "Snapchat",
    icon: <IconColorSnapchatCircle width={56} height={56} />,
  },
  {
    key: "discord",
    label: "Discord",
    icon: <IconColorDiscordCircle width={56} height={56} />,
  },
  {
    key: "more",
    label: "More",
    icon: <IconColorEllipsisCircle width={56} height={56} />,
  },
];

const SHARE_QUICK_ACTIONS: ShareQuickAction[] = [
  {
    key: "report",
    label: "Report",
    icon: <IconFlagFill width={28} height={28} className="text-tux-v2-ui-text-2" />,
  },
  {
    key: "not-interested",
    label: "Not\ninterested",
    icon: <IconHeartBrokenFill width={28} height={28} className="text-tux-v2-ui-text-2" />,
  },
  {
    key: "save-video",
    label: "Save video",
    icon: <IconArrowDownToLineBold width={28} height={28} className="text-tux-v2-ui-text-2" />,
  },
  {
    key: "add-story",
    label: "Add to\nStory",
    icon: <IconStoryStar width={28} height={28} className="text-tux-v2-ui-text-2" />,
  },
  {
    key: "cast",
    label: "Cast",
    icon: <IconChromecastBold width={28} height={28} className="text-tux-v2-ui-text-2" />,
  },
  {
    key: "manage-feed",
    label: "Manage\nFeed",
    icon: <IconPersonalizationFill width={28} height={28} className="text-tux-v2-ui-text-2" />,
  },
  {
    key: "why-this-video",
    label: "Why this video",
    icon: <IconQuestionMarkCircleFillLTR width={28} height={28} className="text-tux-v2-ui-text-2" />,
  },
  {
    key: "use-this-effect",
    label: "Use this effect",
    icon: <IconEffectFill width={28} height={28} className="text-tux-v2-ui-text-2" />,
  },
  {
    key: "captions",
    label: "Captions",
    icon: <IconTextLatin width={28} height={28} className="text-tux-v2-ui-text-2" />,
  },
  {
    key: "promote",
    label: "Promote",
    icon: <IconFireFill width={28} height={28} className="text-tux-v2-ui-text-2" />,
  },
  {
    key: "duet",
    label: "Duet",
    icon: <IconDuetFill width={28} height={28} className="text-tux-v2-ui-text-2" />,
  },
  {
    key: "stitch",
    label: "Stitch",
    icon: <IconStitchFill width={28} height={28} className="text-tux-v2-ui-text-2" />,
  },
  {
    key: "use-template",
    label: "Use template",
    icon: <IconTemplatesCardsFill width={28} height={28} className="text-tux-v2-ui-text-2" />,
  },
  {
    key: "create-sticker",
    label: "Create sticker",
    icon: <IconStickerPlusFill width={28} height={28} className="text-tux-v2-ui-text-2" />,
  },
  {
    key: "background-play",
    label: "Playback\nspeed",
    icon: <IconSpeedMeterFill width={28} height={28} className="text-tux-v2-ui-text-2" />,
  },
  {
    key: "auto-scroll",
    label: "Live\nphoto",
    icon: <IconLivePhotoFill width={28} height={28} className="text-tux-v2-ui-text-2" />,
  },
  {
    key: "reduce-data",
    label: "Set as\nwallpaper",
    icon: <IconLiveWallpaperFill width={28} height={28} className="text-tux-v2-ui-text-2" />,
  },
  {
    key: "view-analytics",
    label: "Share as\nGIF",
    icon: <IconGifRectangleFill width={28} height={28} className="text-tux-v2-ui-text-2" />,
  },
  {
    key: "privacy-settings",
    label: "Send gift",
    icon: <IconGiftFill width={28} height={28} className="text-tux-v2-ui-text-2" />,
  },
  {
    key: "hide-user",
    label: "Campaign\ndetails",
    icon: <IconShoppingBagStarFill width={28} height={28} className="text-tux-v2-ui-text-2" />,
  },
];

const SHEET_TOP_RADIUS = 26;

export function SharePanel({
  visible,
  onVisibleChange,
  showRepost = true,
  isReposted = false,
  onRepostChange,
  root,
}: SharePanelProps) {
  return (
    <TUXSheet
      {...appFrameSheetChromeProps()}
      visible={visible}
      onVisibleChange={onVisibleChange}
      root={root}
      position="bottom"
      heightModePreset="auto"
      closeOnOutsideClick
      dragHandle="hidden"
      draggable
      sheetBackgroundColor="UISheetFlat1"
    >
      <div
        className="pt-0 pb-8.5 overflow-hidden"
        style={{
          backgroundColor: getColorCSSVar("UISheetFlat1"),
          borderTopLeftRadius: SHEET_TOP_RADIUS,
          borderTopRightRadius: SHEET_TOP_RADIUS,
        }}
      >
        <TUXNavBar
          heightPreset={52}
          showSeparator={false}
          backgroundOpacity={0}
          customTitle={
            <div className="flex items-center justify-center text-center min-w-0">
              <TUXText
                typographyPreset="H3-Bold"
                color="UIText1"
                className="truncate"
              >
                Send to
              </TUXText>
            </div>
          }
          leading={
            <div
              aria-label="Search"
              className="flex items-center justify-center"
              style={{ width: 42, height: "100%" }}
            >
              <IconMagnifyingGlass width={22} height={22} className="text-tux-v2-ui-text-1" />
            </div>
          }
          trailing={
            <TUXNavBarCloseButton
              color="UIText2"
              onClick={() => onVisibleChange(false)}
            />
          }
        />

        <div className="pt-2 pb-3">
          <div className="flex gap-1 px-4 overflow-x-auto scroll-px-4 snap-mandatory snap-x hide-scrollbar">
            {showRepost ? (
              <button
                type="button"
                aria-label={isReposted ? "Reposted" : "Repost"}
                aria-pressed={isReposted}
                onClick={() => {
                  // Toggle: repost when not yet reposted, delete when already
                  // reposted. Either way the share panel closes afterward.
                  onRepostChange?.(!isReposted);
                  onVisibleChange(false);
                }}
                className="flex flex-col flex-none items-center gap-2 w-16 snap-start"
              >
                <span className="flex justify-center items-center rounded-full w-14 h-14 overflow-hidden">
                  {isReposted ? (
                    <IconColorRepostTickSquare width={56} height={56} />
                  ) : (
                    <IconColorRepostSquare width={56} height={56} />
                  )}
                </span>
                <TUXText typographyPreset="SmallText1-Regular" className="w-16 max-w-16 text-tux-v2-ui-text-1 text-center">
                  {isReposted ? "Reposted" : "Repost"}
                </TUXText>
              </button>
            ) : null}
            {SHARE_CONTACTS.map((recipient) => (
              <button
                key={`contact-${recipient.key}`}
                type="button"
                className="flex flex-col flex-none items-center gap-2 w-16 snap-start"
              >
                <span className="block relative">
                  <img
                    src={recipient.avatar}
                    alt={recipient.name}
                    className="rounded-full w-14 h-14 object-cover"
                  />
                  {recipient.online ? (
                    <span className="-right-0.5 -bottom-0.5 absolute bg-tux-v2-ui-shape-success border-2 border-tux-v2-ui-page-flat-1 rounded-full w-5 h-5" />
                  ) : null}
                </span>
                <TUXText typographyPreset="SmallText1-Regular" className="w-16 max-w-16 text-tux-v2-ui-text-1 text-center whitespace-pre-line">
                  {recipient.name}
                </TUXText>
              </button>
            ))}
          </div>
        </div>

        <div className="px-4">
          <div className="border-tux-v2-ui-shape-neutral-3 border-t" />
        </div>

        <div className="pt-4">
          <div className="flex gap-1 px-4 overflow-x-auto scroll-px-4 snap-mandatory snap-x hide-scrollbar">
            {SHARE_APP_ACTIONS.map((action) => (
              <button
                key={action.key}
                type="button"
                className="flex flex-col flex-none items-center gap-2 w-16 snap-start"
              >
                {action.icon}
                <TUXText typographyPreset="SmallText1-Regular" className="w-16 max-w-16 text-tux-v2-ui-text-1 text-center">
                  {action.label}
                </TUXText>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-5">
          <div className="flex gap-1 px-4 overflow-x-auto scroll-px-4 snap-mandatory snap-x hide-scrollbar">
            {SHARE_QUICK_ACTIONS.map((action) => (
              <button
                key={action.key}
                type="button"
                className="flex flex-col flex-none items-center gap-2 w-16 snap-start"
              >
                <span className="flex justify-center items-center bg-tux-v2-ui-sheet-grouped-3 rounded-full w-14 h-14">
                  {action.icon}
                </span>
                <TUXText typographyPreset="SmallText1-Regular" className="w-16 max-w-16 text-tux-v2-ui-text-1 text-center whitespace-pre-line">
                  {action.label}
                </TUXText>
              </button>
            ))}
          </div>
        </div>
      </div>
    </TUXSheet>
  );
}
