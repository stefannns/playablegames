import { colorsV2Rgba, isColorV2, type ColorV2Name } from "@byted-tiktok/tux-color";
import {
  TUXIconPlusTinyFill,
  TUXIconVerticalBars,
} from "@byted-tiktok/tux-icons";
import { TUXAvatar, getColorCSSVar, type TUXAvatarProps } from "@byted-tiktok/tux-web";
import type { CSSProperties } from "react";

import { StoryUserAvatarPhoto } from "../../creation/story_user_avatar_photo";

const BASE_AVATAR_PRESET_SIZE = {
  large: 96,
  medium: 48,
  small: 32,
  tiny: 24,
} as const;

const STORY_RING_BRUSHES: Partial<Record<ColorV2Name, CSSProperties["background"]>> = {
  SocialStoryCreate: `linear-gradient(135deg, ${getColorCSSVar("SocialStoryGradientGreen1")} 0%, ${getColorCSSVar("SocialStoryGradientGreen2")} 50%, ${getColorCSSVar("SocialStoryGradientGreen3")} 100%)`,
};

export type SocialAvatarRingVariant = "live" | "story";
export type SocialAvatarBadgeVariant = "create" | "createSmall" | "live";

const SOCIAL_AVATAR_RING_VARIANTS: Record<SocialAvatarRingVariant, ColorV2Name> = {
  live: "BrandTikTokRazzmatazz",
  story: "SocialStoryCreate",
};

const SOCIAL_AVATAR_BADGE_VARIANTS: Record<
  SocialAvatarBadgeVariant,
  {
    icon: "plus" | "vertical-bars";
    background: string;
    iconColor: string;
    iconSize: number;
    size: number;
  }
> = {
  create: {
    icon: "plus",
    background: getColorCSSVar("SocialStoryPlusBackground"),
    iconColor: "var(--tux-v2-color-ui-shape-text-1-on-primary)",
    iconSize: 20,
    size: 20,
  },
  createSmall: {
    icon: "plus",
    background: getColorCSSVar("SocialStoryPlusBackground"),
    iconColor: "var(--tux-v2-color-ui-shape-text-1-on-primary)",
    iconSize: 12,
    size: 12,
  },
  live: {
    icon: "vertical-bars",
    background: "var(--tux-v2-color-ui-shape-primary)",
    iconColor: "var(--tux-v2-color-ui-image-overlay-white)",
    iconSize: 12,
    size: 20,
  },
};

type SocialAvatarProps = Omit<
  TUXAvatarProps,
  "ringColor" | "showDot" | "badgeIcon"
> & {
  hasDot?: boolean;
  hasRing?: boolean;
  ringVariant?: SocialAvatarRingVariant;
  hasBadge?: boolean;
  badgeVariant?: SocialAvatarBadgeVariant;
  ringGapColor?: CSSProperties["background"];
  /** Square `object-cover` crop — matches story publish fly targets for the current user. */
  squarePhoto?: boolean;
};

function getAvatarSize(sizePreset: NonNullable<TUXAvatarProps["sizePreset"]>, size?: number) {
  return size ?? BASE_AVATAR_PRESET_SIZE[sizePreset];
}

function getDotBadgeConfig(size: number) {
  const badgeSize =
    size > 96 ? 24 : size > 72 ? 20 : size > 48 ? 16 : size > 36 ? 14 : size > 20 ? 12 : 8;

  if (size > 64) {
    return { badgeSize, bottomOffset: 2, rightOffset: 2, badgeGap: size > 72 ? 3.5 : 3 };
  }
  if (size > 32) {
    return {
      badgeSize,
      bottomOffset: 0,
      rightOffset: 0,
      badgeGap: size > 40 ? 3 : size > 36 ? 2.5 : size > 28 ? 2 : 1.5,
    };
  }

  return { badgeSize, bottomOffset: -2, rightOffset: -2, badgeGap: size > 20 ? 1.5 : 1.5 };
}

function getIconBadgeConfig(size: number) {
  let badgeSize = 14;
  if (size > 96) badgeSize = 36;
  else if (size > 72) badgeSize = 24;
  else if (size > 56) badgeSize = 20;
  else if (size > 40) badgeSize = 18;
  else if (size > 36) badgeSize = 16;

  if (size > 96) {
    return { badgeSize, bottomOffset: 0, rightOffset: 0, badgeGap: 4 };
  }
  if (size > 64) {
    return { badgeSize, bottomOffset: 0, rightOffset: 4, badgeGap: 3.5 };
  }
  if (size > 48) {
    return { badgeSize, bottomOffset: 0, rightOffset: 0, badgeGap: 3 };
  }
  if (size > 32) {
    return {
      badgeSize,
      bottomOffset: -2,
      rightOffset: -2,
      badgeGap: size > 40 ? 3 : size > 36 ? 2.5 : 2,
    };
  }

  return { badgeSize, bottomOffset: -3, rightOffset: -3, badgeGap: 1.5 };
}

// Match TUXAvatar's stroke-width breakpoints so custom gradient rings scale the same way.
function getRingStrokeWidth(size: number) {
  if (size > 72) return 4;
  if (size > 56) return 3.5;
  if (size > 40) return 3;
  if (size > 24) return 2.5;
  if (size > 20) return 2;
  return 1.5;
}

function renderBadgeIcon(icon: "plus" | "vertical-bars", iconSize: number, iconColor: string) {
  const Icon = icon === "plus" ? TUXIconPlusTinyFill : TUXIconVerticalBars;

  return (
    <span
      aria-hidden
      className="flex items-center justify-center"
      style={{ color: iconColor }}
    >
      <Icon size={iconSize} />
    </span>
  );
}

function resolveRingBrush(ringColor?: ColorV2Name | CSSProperties["background"]) {
  if (!ringColor || ringColor === "transparent") return undefined;
  if (typeof ringColor === "string" && isColorV2(ringColor)) {
    const token = ringColor as ColorV2Name;
    const customBrush = STORY_RING_BRUSHES[token];
    if (customBrush) return customBrush;
    return `var(--tux-v2-color-${colorsV2Rgba[token].cssVarName})`;
  }
  return ringColor;
}

function resolveColorValue(color?: CSSProperties["background"]) {
  if (!color) return undefined;
  if (typeof color === "string" && isColorV2(color)) {
    const token = color as ColorV2Name;
    return `var(--tux-v2-color-${colorsV2Rgba[token].cssVarName})`;
  }
  return color;
}

function createRingMask(innerRadius: number, outerRadius: number) {
  const innerStart = Math.max(innerRadius - 0.5, 0);
  const outerEnd = outerRadius + 0.5;
  const maskBlack = getColorCSSVar("BrandTikTokBlack");
  return `radial-gradient(circle, transparent ${innerStart}px, ${maskBlack} ${innerRadius}px, ${maskBlack} ${outerRadius}px, transparent ${outerEnd}px)`;
}

export function SocialAvatar({
  hasRing,
  ringVariant,
  hasBadge,
  badgeVariant,
  ringGapColor = "var(--tux-v2-color-ui-page-flat-1)",
  squarePhoto = false,
  sizePreset = "medium",
  size,
  hasDot,
  dotColor = "MiscOnlineShape",
  ...avatarProps
}: SocialAvatarProps) {
  const ringColor =
    hasRing && ringVariant
      ? SOCIAL_AVATAR_RING_VARIANTS[ringVariant]
      : undefined;
  const badgeAppearance =
    hasBadge && badgeVariant
      ? SOCIAL_AVATAR_BADGE_VARIANTS[badgeVariant]
      : undefined;
  const ringBrush = resolveRingBrush(ringColor);
  const avatarSize = getAvatarSize(sizePreset, size);
  const avatarRadius = avatarSize / 2;
  const ringStrokeWidth = getRingStrokeWidth(avatarSize);
  // TUXAvatar uses outline + outlineOffset, which is equivalent to gap === stroke width.
  const ringGap = ringStrokeWidth;
  const gapScale = (avatarSize + 2 * ringGap) / avatarSize;
  const ringScale = (avatarSize + 2 * (ringGap + ringStrokeWidth)) / avatarSize;
  const gapMask = createRingMask(avatarRadius / gapScale, avatarRadius);
  const ringMask = createRingMask((avatarRadius + ringGap) / ringScale, avatarRadius);
  const badgeConfig = badgeAppearance
    ? {
        ...getIconBadgeConfig(avatarSize),
        ...(badgeAppearance.size ? { badgeSize: badgeAppearance.size } : null),
      }
    : getDotBadgeConfig(avatarSize);
  const badgeFill = resolveColorValue(badgeAppearance?.background);
  const dotFill = resolveColorValue(dotColor);

  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        width: `${avatarSize}px`,
        height: `${avatarSize}px`,
        flexShrink: 0,
      }}
    >
      {ringBrush ? (
        <>
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "9999px",
              background: ringBrush,
              transform: `scale(${ringScale})`,
              transformOrigin: "center",
              mask: ringMask,
              WebkitMask: ringMask,
              pointerEvents: "none",
            }}
          />
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "9999px",
              background: ringGapColor,
              transform: `scale(${gapScale})`,
              transformOrigin: "center",
              mask: gapMask,
              WebkitMask: gapMask,
              pointerEvents: "none",
            }}
          />
        </>
      ) : null}
      <div style={{ position: "relative", zIndex: 1 }}>
        {squarePhoto ? (
          <div
            style={{
              position: "relative",
              width: `${avatarSize}px`,
              height: `${avatarSize}px`,
              overflow: "hidden",
              borderRadius: "9999px",
            }}
          >
            <StoryUserAvatarPhoto alt={avatarProps.alt ?? ""} />
          </div>
        ) : (
          <TUXAvatar {...avatarProps} sizePreset={sizePreset} size={size} />
        )}
      </div>
      {badgeAppearance ? (
        <div
          style={{
            position: "absolute",
            right: `${badgeConfig.rightOffset}px`,
            bottom: `${badgeConfig.bottomOffset}px`,
            zIndex: 2,
            display: "flex",
            width: `${badgeConfig.badgeSize}px`,
            height: `${badgeConfig.badgeSize}px`,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "9999px",
            background: badgeFill,
            boxShadow: `0 0 0 ${badgeConfig.badgeGap}px var(--tux-v2-color-ui-page-flat-1)`,
          }}
        >
          {renderBadgeIcon(
            badgeAppearance.icon,
            badgeAppearance.iconSize,
            badgeAppearance.iconColor,
          )}
        </div>
      ) : hasDot ? (
        <div
          aria-hidden
          style={{
            position: "absolute",
            right: `${badgeConfig.rightOffset}px`,
            bottom: `${badgeConfig.bottomOffset}px`,
            zIndex: 2,
            width: `${badgeConfig.badgeSize}px`,
            height: `${badgeConfig.badgeSize}px`,
            borderRadius: "9999px",
            background: dotFill,
            boxShadow: `0 0 0 ${badgeConfig.badgeGap}px var(--tux-v2-color-ui-page-flat-1)`,
          }}
        />
      ) : null}
    </div>
  );
}
