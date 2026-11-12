import {
  IconArrowDownToLine,
  IconAutoScroll,
  IconDanmu,
  IconEyeSlash,
  IconFeedContentClear,
  IconFire4,
  IconFlag,
  IconHeadphone,
  IconHeartBroken,
  IconPersonalization,
  IconPictureInPicture,
  IconQuestionMarkCircleLTR,
  IconSpeed,
  IconStarOnFeed,
  IconTextLatinThin,
} from "@byted-tiktok/tux-icons";
import {
  getColorCSSVar,
  TUXListCell,
  TUXListView,
  TUXSegmentedControl,
  TUXSheet,
  TUXSwitch,
} from "@byted-tiktok/tux-web";
import { appFrameSheetChromeProps } from "../../../components/sys/app_frame_sheet_chrome";
import { useState, type CSSProperties } from "react";

export type LongPressPanelProps = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  root?: HTMLElement | null;
};

type TextCellAction = {
  key: string;
  label: string;
  description?: string;
  leadingIcon?: JSX.Element;
  trailing?: JSX.Element;
  destructive?: boolean;
};

type ActionGroup = {
  key: string;
  actions: TextCellAction[];
};

const SPEED_OPTIONS = ["0.5x", "1.0x", "1.5x", "2.0x"] as const;

const SPEED_ITEMS = SPEED_OPTIONS.map((option) => ({
  itemKey: option,
  title: option,
}));

const ACTION_GROUPS: ActionGroup[] = [
  {
    key: "quick-actions",
    actions: [
      {
        key: "save-video",
        label: "Save video",
        leadingIcon: <IconArrowDownToLine width={18} height={18} className="text-tux-v2-ui-text-1" />,
      },
      {
        key: "not-interested",
        label: "Not interested",
        leadingIcon: <IconHeartBroken width={18} height={18} className="text-tux-v2-ui-text-1" />,
      },
      {
        key: "report",
        label: "Report",
        leadingIcon: <IconFlag width={18} height={18} className="text-tux-v2-ui-text-1" />,
      },
    ],
  },
  {
    key: "watching-tools",
    actions: [
      {
        key: "speed",
        label: "Speed",
        leadingIcon: <IconSpeed width={18} height={18} className="text-tux-v2-ui-text-1" />,
      },
      {
        key: "clear-display",
        label: "Clear display",
        leadingIcon: <IconFeedContentClear width={18} height={18} className="text-tux-v2-ui-text-1" />,
      },
      {
        key: "auto-scroll",
        label: "Auto scroll",
        leadingIcon: <IconAutoScroll width={18} height={18} className="text-tux-v2-ui-text-1" />,
        trailing: <TUXSwitch name="longpress-autoscroll" value="auto-scroll" />,
      },
      {
        key: "captions-and-translation",
        label: "Captions and translation",
        leadingIcon: <IconTextLatinThin width={18} height={18} className="text-tux-v2-ui-text-1" />,
      },
      {
        key: "picture-in-picture",
        label: "Picture-in-Picture",
        leadingIcon: <IconPictureInPicture width={18} height={18} className="text-tux-v2-ui-text-1" />,
      },
      {
        key: "background-audio",
        label: "Background audio",
        leadingIcon: <IconHeadphone width={18} height={18} className="text-tux-v2-ui-text-1" />,
        trailing: <TUXSwitch name="longpress-background-audio" value="background-audio" />,
      },
      {
        key: "one-liners",
        label: "One-liners",
        leadingIcon: <IconDanmu width={18} height={18} className="text-tux-v2-ui-text-1" />,
      },
    ],
  },
  {
    key: "recommendation",
    actions: [
      {
        key: "manage-feed",
        label: "Manage feed",
        leadingIcon: <IconPersonalization width={18} height={18} className="text-tux-v2-ui-text-1" />,
      },
      {
        key: "why-this-video",
        label: "Why this video",
        leadingIcon: <IconQuestionMarkCircleLTR width={18} height={18} className="text-tux-v2-ui-text-1" />,
      },
      {
        key: "customize-feed",
        label: "Customize feed",
        leadingIcon: <IconStarOnFeed width={18} height={18} className="text-tux-v2-ui-text-1" />,
      },
      {
        key: "promote",
        label: "Promote",
        leadingIcon: <IconFire4 width={18} height={18} className="text-tux-v2-ui-text-1" />,
      },
      {
        key: "mute-their-posts",
        label: "Mute their posts",
        leadingIcon: <IconEyeSlash width={18} height={18} className="text-tux-v2-ui-text-1" />,
      },
    ],
  },
];

const groupedAliasStyle = {
  "--tux-v2-color-ui-page-grouped-1": getColorCSSVar("UISheetGrouped1"),
  "--tux-v2-color-ui-page-grouped-2": getColorCSSVar("UISheetGrouped2"),
} as CSSProperties;

export function LongPressPanel({
  visible,
  onVisibleChange,
  root,
}: LongPressPanelProps) {
  const [speedKey, setSpeedKey] = useState("1.0x");

  const speedTrailing = (
    <div onClick={(event) => event.stopPropagation()}>
      <TUXSegmentedControl
        items={SPEED_ITEMS}
        activeKey={speedKey}
        sizePreset="small"
        shapePreset="rectangle"
        onChange={setSpeedKey}
      />
    </div>
  );

  return (
    <TUXSheet
      {...appFrameSheetChromeProps()}
      visible={visible}
      onVisibleChange={onVisibleChange}
      root={root}
      position="bottom"
      heightModePreset="fixed"
      height="508px"
      closeOnOutsideClick
      dragHandle="visible"
      draggable
      sheetBackgroundColor="UISheetGrouped1"
    >
      <div
        className="pt-4 px-1 pb-10 max-h-70vh overflow-y-auto overscroll-contain hide-scrollbar"
        style={{ backgroundColor: getColorCSSVar("UISheetGrouped1") }}
      >
        {ACTION_GROUPS.map((group, groupIndex) => (
          <div key={group.key} className={groupIndex === 0 ? "" : "mt-3"}>
            <div
              className="rounded-[12px] overflow-hidden"
              style={groupedAliasStyle}
            >
              <TUXListView
                grouped
              >
                {group.actions.map((action) => (
                  <TUXListCell
                    key={action.key}
                    title={action.label}
                    description={action.description}
                    leadingIcon={action.leadingIcon}
                    trailing={action.key === "speed" ? speedTrailing : action.trailing}
                    themePreset="normal"
                  />
                ))}
              </TUXListView>
            </div>
          </div>
        ))}
      </div>
    </TUXSheet>
  );
}
