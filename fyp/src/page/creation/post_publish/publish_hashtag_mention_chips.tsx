import { TUXText } from "@byted-tiktok/tux-web";
import { IconAt, IconNumber } from "@byted-tiktok/tux-icons";
import type { MouseEvent, ReactNode } from "react";

import { PUBLISH_CELL_BG, PUBLISH_LIST_ICON_COLOR } from "./publish_chrome.constants";

const CHIP_ICON_SIZE_PX = 14;

export type PublishHashtagMentionChipsProps = {
  /** 视频发布 — 输入态点 chip 不抢 textarea 焦点。 */
  keepDescriptionFocusOnPress?: boolean;
  onHashtag?: () => void;
  onMention?: () => void;
};

function PublishActionChip({
  label,
  icon,
  keepDescriptionFocusOnPress,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  keepDescriptionFocusOnPress?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-[6px] border-0 px-1.5"
      style={{ backgroundColor: PUBLISH_CELL_BG }}
      onPointerDown={
        keepDescriptionFocusOnPress
          ? (event: MouseEvent<HTMLButtonElement>) => event.preventDefault()
          : undefined
      }
      onClick={onClick}
    >
      <span
        className="inline-flex shrink-0 items-center justify-center"
        style={{
          width: CHIP_ICON_SIZE_PX,
          height: CHIP_ICON_SIZE_PX,
          color: PUBLISH_LIST_ICON_COLOR,
        }}
      >
        {icon}
      </span>
      <TUXText
        typographyPreset="P2-Semibold"
        color="UIText1"
        as="span"
        className="whitespace-nowrap"
      >
        {label}
      </TUXText>
    </button>
  );
}

export function PublishHashtagMentionChips({
  keepDescriptionFocusOnPress = false,
  onHashtag,
  onMention,
}: PublishHashtagMentionChipsProps) {
  return (
    <div className="hide-scrollbar flex h-8 shrink-0 gap-2 overflow-x-auto overflow-y-hidden">
      <PublishActionChip
        label="Hashtags"
        icon={
          <IconNumber width={CHIP_ICON_SIZE_PX} height={CHIP_ICON_SIZE_PX} />
        }
        keepDescriptionFocusOnPress={keepDescriptionFocusOnPress}
        onClick={onHashtag}
      />
      <PublishActionChip
        label="Mention"
        icon={<IconAt width={CHIP_ICON_SIZE_PX} height={CHIP_ICON_SIZE_PX} />}
        keepDescriptionFocusOnPress={keepDescriptionFocusOnPress}
        onClick={onMention}
      />
    </div>
  );
}
