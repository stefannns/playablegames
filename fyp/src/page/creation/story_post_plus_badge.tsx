import { TUXIconPlusTinyFill } from "@byted-tiktok/tux-icons";
import { getColorCSSVar } from "@byted-tiktok/tux-web";
import type { MouseEvent } from "react";

import { PROFILE_STORY_AVATAR_PX } from "./story_post.constants";

/** Plus badge diameter — profile header uses 24px, inbox skylight uses 20px. */
export function storyPostPlusBadgePx(avatarPx: number) {
  return avatarPx >= PROFILE_STORY_AVATAR_PX ? 24 : 20;
}

type StoryPostPlusBadgeProps = {
  avatarPx: number;
  opacity?: number;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  /** Hide from assistive tech when the parent button already has a label. */
  ariaHidden?: boolean;
};

/** Shared plus badge for profile + inbox story publish surfaces. */
export function StoryPostPlusBadge({
  avatarPx,
  opacity = 1,
  onClick,
  ariaHidden = false,
}: StoryPostPlusBadgeProps) {
  const badgePx = storyPostPlusBadgePx(avatarPx);
  const isProfileBadge = badgePx >= 24;

  return (
    <div
      {...(ariaHidden ? { "aria-hidden": true } : {})}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick && !ariaHidden ? "Add to story" : undefined}
      onClick={onClick}
      className="absolute z-2 flex items-center justify-center rounded-full outline-none"
      style={{
        right: 4,
        bottom: 0,
        width: badgePx,
        height: badgePx,
        opacity,
        background: getColorCSSVar("UIShapeSecondary"),
        boxShadow: "0 0 0 3.5px var(--tux-v2-color-ui-page-flat-1)",
        color: "var(--tux-v2-color-ui-image-overlay-white)",
      }}
    >
      {isProfileBadge ? <span aria-hidden className="absolute" style={{ inset: -2 }} /> : null}
      <TUXIconPlusTinyFill size={badgePx} />
    </div>
  );
}
