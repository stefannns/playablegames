import {
  TUXInteractionContainer,
  TUXText,
  getColorCSSVar,
} from "@byted-tiktok/tux-web";
import { TUXIconChevronRightSlimThinLTR } from "@byted-tiktok/tux-icons";
import {
  useCallback,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { PUBLISH_MUTED_ICON_COLOR } from "./publish_chrome.constants";

export function PublishSettingRowTitle({ children }: { children: string }) {
  return (
    <TUXText
      as="span"
      typographyPreset="H4-Semibold"
      color="UIText1"
      textDisplay="truncate"
      className="min-w-0 flex-1 py-[5.5px]"
    >
      {children}
    </TUXText>
  );
}

function PublishSettingLeadingIcon({ children }: { children: ReactNode }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center"
      style={{ width: 18, height: 18, color: getColorCSSVar("UIText1") }}
    >
      {children}
    </span>
  );
}

function PublishSettingChevron() {
  return (
    <span className="flex min-h-8 w-[60px] shrink-0 items-center justify-end">
      <span style={{ color: PUBLISH_MUTED_ICON_COLOR }}>
        <TUXIconChevronRightSlimThinLTR size={16} />
      </span>
    </span>
  );
}

type PublishSettingRowProps = {
  title: ReactNode;
  leadingIcon: ReactNode;
  trailing?: ReactNode;
  /** Figma Title Area gap：默认 10px；隐私行 8px */
  titleGapClassName?: string;
  /** Figma Leading Icon 垂直 padding：More options / Share to 为 5.4px */
  leadingPaddingClassName?: string;
  footer?: ReactNode;
  onClick?: () => void;
};

/**
 * Figma List Item / Plain — px-16 + py-10、Title Area min-h-32 → 行高 52px。
 * 图文 / 视频发布共用；交互走 TUXInteractionContainer（与 TUXListCell 同系 overlay）。
 */
export function PublishSettingRow({
  title,
  leadingIcon,
  trailing = <PublishSettingChevron />,
  titleGapClassName = "gap-2.5",
  leadingPaddingClassName = "py-1.5",
  footer,
  onClick,
}: PublishSettingRowProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!onClick) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick();
      }
    },
    [onClick],
  );

  return (
    <TUXInteractionContainer
      className="group/setting relative flex w-full min-w-0 flex-col text-left"
      activeMode="overlay"
      hoverMode="overlay"
      hoveredOverlayColor="UIShapeNeutral4"
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
    >
      <div className="box-border flex h-[52px] w-full shrink-0 items-center px-4 text-left">
        <span className={`flex min-h-8 w-full items-center ${titleGapClassName}`}>
          <span className={`flex shrink-0 items-start ${leadingPaddingClassName}`}>
            <PublishSettingLeadingIcon>{leadingIcon}</PublishSettingLeadingIcon>
          </span>
          {typeof title === "string" ? (
            <PublishSettingRowTitle>{title}</PublishSettingRowTitle>
          ) : (
            <span className="min-w-0 flex-1 py-[5.5px]">{title}</span>
          )}
          {trailing}
        </span>
      </div>
      {footer}
    </TUXInteractionContainer>
  );
}
