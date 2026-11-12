import {
  TUXIcon2ptAdvertisement,
  TUXIcon2ptBlock,
  TUXIcon2ptClosedCaptionFill,
  TUXIcon2ptDuet,
  TUXIcon2ptEffect,
  TUXIcon2ptFilmStar,
  TUXIcon2ptGIF,
  TUXIcon2ptGift,
  TUXIcon2ptInfoCircle,
  TUXIcon2ptLivePhoto,
  TUXIcon2ptLiveWallpaper,
  TUXIcon2ptShoppingBagStar,
  TUXIcon2ptSlashRectangle,
  TUXIcon2ptSpeed,
  TUXIcon2ptStitch,
  TUXIcon2ptTemplate,
  TUXIconAddToStoryFill,
  TUXIconArrowDownToLineBold,
  TUXIconChromecastBold,
  TUXIconColorEllipsisCircle,
  TUXIconColorFacebookCircle,
  TUXIconColorInstagramCircle,
  TUXIconColorLinkCircle,
  TUXIconColorSnapchatCircle,
  TUXIconColorTwitterCircle,
  TUXIconColorWhatsappCircle,
  TUXIconDocOnDocFill,
  TUXIconCameraFill,
  TUXIconFireFill,
  TUXIconFlagFill,
  TUXIconMagnifyingGlass,
  TUXIconHeartBrokenFill,
  TUXIconHeart,
  TUXIconHeartFill,
  TUXIconImageStack,
  TUXIconMicrophoneFill,
  TUXIconArrowTurnUpRight,
  TUXIconStickerRoundFill,
  TUXIconXMark,
} from "@byted-tiktok/tux-icons";
import {
  getColorCSSVar,
  TUXSheet,
  TUXText,
} from "@byted-tiktok/tux-web";
import { useAppFrame } from "../../components/sys/app_frame";
import { appFrameSheetChromeProps } from "../../components/sys/app_frame_sheet_chrome";
import {
  KB_OPEN_ANIMATION_MS,
  useSoftKeyboard,
  useSoftKeyboardInputFocus,
} from "../../components/sys/soft_keyboard";
import { ThemeScope } from "../../context/theme";
import {
  STORY_COMPOSER_BG,
  STORY_OVERLAY_TEXT,
  STORY_REPLY_CARET,
  STORY_REPLY_INPUT_WELL,
  STORY_REPLY_TAB_THUMB,
  STORY_REPLY_TAB_TRACK,
  STORY_SHARE_AVATAR_PLACEHOLDER,
  STORY_SHARE_DIVIDER,
  STORY_SHARE_ICON_WELL,
  STORY_SHARE_ONLINE_DOT,
  STORY_SHARE_SELECTED_RING,
  STORY_SHARE_SURFACE,
} from "./story_chrome.constants";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";

import type { StoryDetail } from "./story.types";
import { SocialAvatar } from "../inbox/components/social_avatar";

type LocalRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type Point = {
  x: number;
  y: number;
};

type StoryActionPanel = "message" | "share" | null;
type StoryReplyTab = "emoji" | "avatar";

type MagnifyTransition = {
  mode: "opening" | "closing";
  phase: "from" | "to";
  anchorRect: LocalRect;
  fromRect?: LocalRect;
  fromMaskOpacity?: number;
  story: StoryDetail;
  segmentIndex: number;
  progress: number;
};

type StorySwitchTransition = {
  fromStory: StoryDetail;
  toStory: StoryDetail;
  direction: -1 | 1;
  progress: number;
  fromSegmentIndex: number;
  fromProgress: number;
};

type DragSession = {
  pointerId: number;
  startX: number;
  startY: number;
  startTime: number;
  dragging: boolean;
};

type StoryDetailPageContentProps = {
  story: StoryDetail;
  stories: readonly StoryDetail[];
  sourceRect?: DOMRect | null;
  /** Host anchor scope (`data-story-anchor-scope`) for open/close avatar lookups. */
  anchorScopeId?: string;
  onStoryChange?: (story: StoryDetail) => void;
  onClose: (story: StoryDetail, trigger?: HTMLElement | null) => void;
};

const STORY_OPEN_TRANSITION_MS = 180;
const STORY_CLOSE_TRANSITION_MS = 200;
const STORY_AVATAR_FADE_MS = 90;
const STORY_AVATAR_REAPPEAR_MS = 200;
const STORY_TRANSITION_TIMING = "cubic-bezier(0.32, 0.72, 0, 1)";
const STORY_TUX_SPRING_FRAME_TIMING =
  "linear(0, 0.189 12.5%, 0.472 25%, 0.691 37.5%, 0.832 50%, 0.915 62.5%, 0.962 75%, 0.987 87.5%, 1)";
const STORY_TUX_SPRING_FADE_TIMING =
  "linear(0, 0.466 12.5%, 0.821 25%, 0.949 37.5%, 0.986 50%, 0.997 62.5%, 0.999 75%, 1 87.5%, 1)";
const STORY_SWITCH_MS = 320;
const CLOSE_DRAG_THRESHOLD = 112;
const STORY_DRAG_CANCEL_MS = 150;
const STORY_INTERACTIVE_PIN_MS = 60_000;
const STORY_MEDIA_TOP_OFFSET = 0;
const STORY_HEADER_TOP_OFFSET = 12;
const STORY_MEDIA_HEIGHT = 694;
const STORY_MEDIA_BOTTOM_GUARD = 132;
const STORY_REACTION_EMOJIS = ["😍", "😂", "😳"] as const;
const STORY_REPLY_FLOATING_EMOJIS = ["😍", "😂", "😳", "🤩", "❤️", "👏", "🔥", "🎉"] as const;
const STORY_REPLY_AVATAR_STICKERS: readonly {
  id: string;
  src: string;
  fit: "cover" | "contain";
  imageStyle: CSSProperties;
}[] = [
  {
    id: "smile-close",
    src: "/resource/avatar/story-reply/avatar-sticker-01.png",
    fit: "cover",
    imageStyle: { inset: "1.47% 13.24% 0 14.71%" },
  },
  {
    id: "smile",
    src: "/resource/avatar/story-reply/avatar-sticker-02.png",
    fit: "cover",
    imageStyle: { inset: "-9.93% 5.97% -15.49% -5.14%" },
  },
  {
    id: "heart",
    src: "/resource/avatar/story-reply/avatar-sticker-03.png",
    fit: "cover",
    imageStyle: {
      height: 88,
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      width: 88,
    },
  },
  {
    id: "laugh",
    src: "/resource/avatar/story-reply/avatar-sticker-04.png",
    fit: "contain",
    imageStyle: { inset: "1.47% 15.61% -1.47% 12.27%" },
  },
  {
    id: "smirk",
    src: "/resource/avatar/story-reply/avatar-sticker-05.png",
    fit: "contain",
    imageStyle: { inset: "0 0 1.47% 7.35%" },
  },
  {
    id: "question",
    src: "/resource/avatar/story-reply/avatar-sticker-06.png",
    fit: "cover",
    imageStyle: { height: 90, left: -1, top: -1, width: 90 },
  },
];
const STORY_MUSIC_NOTE_PATH =
  "M9.09262 0.00213971C9.24226 -0.0173789 9.37495 0.0991277 9.37495 0.250038L9.375 7.69693C9.375 8.69794 8.56352 9.50943 7.5625 9.50943H7.5C6.5335 9.50943 5.75 8.72593 5.75 7.75943C5.75 6.79293 6.5335 6.00943 7.5 6.00943H8.19995V2.22776L3.62495 2.8245L3.625 8.44693C3.625 9.44794 2.81352 10.2594 1.8125 10.2594H1.75C0.783502 10.2594 0 9.47593 0 8.50943C0 7.54293 0.783502 6.75943 1.75 6.75943H2.44995V1.08808C2.44995 0.962512 2.5431 0.856425 2.66762 0.840183L9.09262 0.00213971Z";

function viewportRectToLocal(rect: DOMRect, root: HTMLElement): LocalRect {
  const rootRect = root.getBoundingClientRect();

  return {
    left: rect.left - rootRect.left,
    top: rect.top - rootRect.top,
    width: rect.width,
    height: rect.height,
  };
}

function fullRootRect(root: HTMLElement): LocalRect {
  const rootRect = root.getBoundingClientRect();

  return {
    left: 0,
    top: 0,
    width: rootRect.width,
    height: rootRect.height,
  };
}

function fallbackAnchorRect(root: HTMLElement): LocalRect {
  const rootRect = root.getBoundingClientRect();
  const size = 78;

  return {
    left: rootRect.width / 2 - size / 2,
    top: rootRect.height - 160,
    width: size,
    height: size,
  };
}

/**
 * Multiple surfaces (inbox skylight, friends tray) stay mounted at once and
 * share story ids, so anchor lookups must be scoped via
 * `data-story-anchor-scope` on the host container to avoid grabbing a
 * same-id avatar from another tab's DOM.
 */
function getStoryAvatarElement(storyId: string, scopeId?: string): HTMLElement | null {
  if (typeof document === "undefined") {
    return null;
  }

  const selector = `[data-story-avatar-id="${storyId}"]`;
  return document.querySelector<HTMLElement>(
    scopeId ? `[data-story-anchor-scope="${scopeId}"] ${selector}` : selector,
  );
}

function getStoryCellElement(storyId: string, scopeId?: string): HTMLElement | null {
  if (typeof document === "undefined") {
    return null;
  }

  const selector = `[data-story-cell-id="${storyId}"]`;
  return document.querySelector<HTMLElement>(
    scopeId ? `[data-story-anchor-scope="${scopeId}"] ${selector}` : selector,
  );
}

function canConsumeStoryDetail(story: StoryDetail) {
  return story.hasRing === true && story.ringVariant === "story";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function resistanceFunction(value: number) {
  return 0.14 * Math.log2(6 * value + 1);
}

function resistantOffset(delta: number, size: number) {
  if (size <= 0) {
    return 0;
  }

  const sign = delta >= 0 ? 1 : -1;
  return sign * size * resistanceFunction(Math.abs(delta) / size);
}

function dragProgress(root: HTMLElement, offset: Point) {
  const rootRect = root.getBoundingClientRect();
  const distanceX = Math.abs(offset.x) / Math.max(rootRect.width, 1);
  const distanceY = Math.abs(offset.y) / Math.max(rootRect.height, 1);

  return Math.sqrt(distanceX * distanceX + distanceY * distanceY);
}

function translatedFullRect(root: HTMLElement, offset: Point): LocalRect {
  const rect = fullRootRect(root);

  return {
    ...rect,
    left: rect.left + offset.x,
    top: rect.top + offset.y,
  };
}

function cubicBezierYForX(x: number, p1x: number, p1y: number, p2x: number, p2y: number) {
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;
  let t = x;

  for (let index = 0; index < 8; index += 1) {
    const curveX = ((ax * t + bx) * t + cx) * t - x;
    const derivativeX = (3 * ax * t + 2 * bx) * t + cx;
    if (Math.abs(curveX) < 0.005 || Math.abs(derivativeX) < 1e-6) {
      break;
    }
    t -= curveX / derivativeX;
  }

  t = clamp(t, 0, 1);
  return ((ay * t + by) * t + cy) * t;
}

function storyPagingEase(progress: number) {
  return cubicBezierYForX(clamp(progress, 0, 1), 0.3, 0.18, 0, 1);
}

function StoryIconButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      data-story-control
      aria-label={label}
      className="flex flex-none justify-center items-center active:opacity-65 rounded-full outline-none w-[26px] h-[26px] transition-opacity"
      onClick={onClick}
      style={{ color: active ? getColorCSSVar("UIShapePrimary") : getColorCSSVar("BrandTikTokWhite") }}
    >
      {children}
    </button>
  );
}

function StoryMusicNoteIcon() {
  return (
    <svg
      aria-hidden="true"
      className="w-3 h-3"
      fill="none"
      viewBox="0 0 12 12"
    >
      <path
        d={STORY_MUSIC_NOTE_PATH}
        fill="currentColor"
        transform="translate(0.875 0.7404)"
      />
    </svg>
  );
}

function StoryMusicCoverIcon({ src }: { src: string }) {
  const svgId = useId().replace(/:/g, "");
  const clipId = `story-music-cover-clip-${svgId}`;
  const maskId = `story-music-cover-mask-${svgId}`;

  return (
    <svg
      aria-hidden="true"
      className="absolute"
      height="20"
      viewBox="0 0 20 20"
      width="20"
      style={{ left: 2, top: 2 }}
    >
      <defs>
        <clipPath id={clipId}>
          <rect height="20" rx="5" width="20" />
        </clipPath>
        <mask
          id={maskId}
          height="20"
          maskUnits="userSpaceOnUse"
          width="20"
          x="0"
          y="0"
        >
          <rect fill="white" height="20" rx="5" width="20" />
          <path
            d={STORY_MUSIC_NOTE_PATH}
            fill="black"
            stroke="black"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
            transform="translate(11.875 10.7404)"
          />
        </mask>
      </defs>
      <image
        clipPath={`url(#${clipId})`}
        height="20"
        href={src}
        mask={`url(#${maskId})`}
        preserveAspectRatio="xMidYMid slice"
        width="20"
      />
    </svg>
  );
}

function StorySurface({
  story,
  segmentIndex,
  progress,
  liked,
  emojiBurst,
  interactive,
  onPreviousStory,
  onNextStory,
  onOpenMusic,
  onClose,
  onOpenMessage,
  onReactEmoji,
  onToggleLike,
  onShare,
}: {
  story: StoryDetail;
  segmentIndex: number;
  progress: number;
  liked?: boolean;
  emojiBurst?: { id: number; emoji: string } | null;
  interactive: boolean;
  onPreviousStory?: () => void;
  onNextStory?: () => void;
  onOpenMusic?: () => void;
  onClose?: () => void;
  onOpenMessage?: () => void;
  onReactEmoji?: (emoji: string) => void;
  onToggleLike?: () => void;
  onShare?: () => void;
}) {
  const activeSegment = story.segments[segmentIndex] ?? story.segments[0];
  const storyImageSrc = activeSegment?.mediaSrc ?? story.src;

  return (
    <div
      data-story-detail-id={story.id}
      data-story-detail-interactive={interactive ? "true" : "false"}
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: getColorCSSVar("BrandTikTokBlack") }}
    >
      <ThemeScope mode="dark" className="absolute inset-0">
      <div
        className="z-0 absolute inset-x-0 rounded-[18px] overflow-hidden"
        style={{
          top: `calc(var(--app-frame-top-inset) + ${STORY_MEDIA_TOP_OFFSET}px)`,
          height: `min(${STORY_MEDIA_HEIGHT}px, calc(100% - var(--app-frame-top-inset) - ${STORY_MEDIA_TOP_OFFSET + STORY_MEDIA_BOTTOM_GUARD}px))`,
        }}
      >
        <img
          src={storyImageSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="top-0 right-0 left-0 absolute h-[138px]"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.25) 44%, rgba(0,0,0,0) 100%)",
          }}
        />
        <div
          className="right-0 bottom-0 left-0 absolute h-[314px]"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.46) 70%, rgba(0,0,0,0.7) 100%)",
          }}
        />

      </div>

      {interactive ? (
        <>
          <button
            type="button"
            data-story-tap-zone
            aria-label="Previous story"
            className="top-0 bottom-0 left-0 z-10 absolute w-1/2"
            onClick={onPreviousStory}
          />
          <button
            type="button"
            data-story-tap-zone
            aria-label="Next story"
            className="top-0 right-0 bottom-0 z-10 absolute w-1/2"
            onClick={onNextStory}
          />
        </>
      ) : null}

      <div
        className="left-1/2 z-20 absolute flex flex-col gap-1.5 w-[390px] max-w-full -translate-x-1/2"
        style={{ top: `calc(var(--app-frame-top-inset) + ${STORY_HEADER_TOP_OFFSET}px)` }}
      >
        <div className="flex gap-0.5 px-3 w-full h-1">
          <div
            data-story-progress-track
            className="flex-1 rounded-full min-w-0 overflow-hidden"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.34)" }}
          >
            <div
              className="rounded-full h-full"
              style={{
                width: `${clamp((segmentIndex + progress) / Math.max(story.segments.length, 1), 0, 1) * 100}%`,
                backgroundColor: getColorCSSVar("BrandTikTokWhite"),
              }}
            />
          </div>
        </div>

        <div className="flex justify-between items-center w-full h-10">
          <div className="flex items-center gap-2 pl-3 min-w-0">
            <SocialAvatar
              src={story.src}
              alt={story.name}
              size={32}
              hasRing={false}
              hasDot={false}
            />
            <div className="flex items-center gap-1 min-w-0">
              <TUXText
                as="span"
                font="TikTokFont"
                size={17}
                weight={500}
                color="BrandTikTokWhite"
                textDisplay="truncate"
                style={{ textShadow: "0 0 4px rgba(0, 0, 0, 0.35)" }}
              >
                {story.name}
              </TUXText>
              <TUXText
                as="span"
                font="TikTokFont"
                size={15}
                weight={600}
                textDisplay="truncate"
                style={{
                  color: "rgba(255, 255, 255, 0.6)",
                  textShadow: "0 0 4px rgba(0, 0, 0, 0.35)",
                }}
              >
                · {story.timestamp} ago
              </TUXText>
            </div>
          </div>

          <div className="flex flex-none items-center gap-4 pr-4">
            <button
              type="button"
              data-story-control
              aria-label="Open music"
              className="relative flex-none active:opacity-70 w-6 h-6"
              disabled={!interactive}
              onClick={onOpenMusic}
            >
              <StoryMusicCoverIcon src={story.music.coverSrc} />
              <span
                className="top-3 left-[13px] absolute flex justify-center items-center w-3 h-3"
                style={{ color: getColorCSSVar("BrandTikTokWhite") }}
              >
                <StoryMusicNoteIcon />
              </span>
            </button>

            <button
              type="button"
              data-story-control
              aria-label="Close story"
              className="flex flex-none justify-center items-center active:opacity-70 w-6 h-6"
              disabled={!interactive}
              onClick={onClose}
              style={{ color: getColorCSSVar("BrandTikTokWhite") }}
            >
              <TUXIconXMark size={24} />
            </button>
          </div>
        </div>
      </div>

      <div
        className="left-1/2 z-30 absolute flex items-center gap-4 pr-[17px] pl-3 w-[393px] max-w-full h-[77px] -translate-x-1/2"
        style={{ bottom: "calc(var(--app-frame-bottom-inset) + 17px)" }}
      >
        <div
          data-story-control
          className="flex flex-1 items-center pr-3.5 pl-[21px] rounded-full min-w-0 h-12"
          style={{ backgroundColor: STORY_COMPOSER_BG }}
        >
          <button
            type="button"
            className="flex-1 active:opacity-75 min-w-0 text-left"
            disabled={!interactive}
            onClick={onOpenMessage}
          >
            <TUXText
              as="span"
              font="TikTokFont"
              size={16}
              weight={500}
              textDisplay="truncate"
              color="UIText3"
              style={{
                letterSpacing: "0.03px",
                lineHeight: 1.3,
              }}
            >
              Message...
            </TUXText>
          </button>

          <div className="flex flex-none items-center gap-3.5">
            {STORY_REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                aria-label={`React ${emoji}`}
                className="flex justify-center items-center rounded-full w-7 h-9 text-[28px] leading-none active:scale-90"
                disabled={!interactive}
                onClick={() => onReactEmoji?.(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div data-story-control className="flex flex-none items-center gap-[19px]">
          <StoryIconButton
            label={liked ? "Unlike story" : "Like story"}
            active={liked}
            onClick={() => onToggleLike?.()}
          >
            {liked ? <TUXIconHeartFill size={26} /> : <TUXIconHeart size={26} />}
          </StoryIconButton>
          <StoryIconButton label="Share story" onClick={() => onShare?.()}>
            <TUXIconArrowTurnUpRight size={32} />
          </StoryIconButton>
        </div>
      </div>

      {interactive && emojiBurst ? (
        <div
          key={emojiBurst.id}
          aria-hidden="true"
          className="left-1/2 z-40 absolute text-[48px] -translate-x-1/2 pointer-events-none"
          style={{
            bottom: "calc(var(--app-frame-bottom-inset) + 92px)",
            animation: "story-emoji-burst 760ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
          }}
        >
          {emojiBurst.emoji}
        </div>
      ) : null}
      </ThemeScope>
    </div>
  );
}

function StorySwitchStage({
  transition,
  liked,
  renderStory,
}: {
  transition: StorySwitchTransition;
  liked: boolean;
  renderStory: (
    story: StoryDetail,
    segmentIndex: number,
    progress: number,
    interactive: boolean,
    liked: boolean,
  ) => ReactNode;
}) {
  const direction = transition.direction;
  const progress = clamp(transition.progress, 0, 1);
  const outgoingTransform = `translate3d(${-direction * progress * 100}%, 0, 0) rotateY(${-direction * progress * 45}deg)`;
  const incomingProgress = 1 - progress;
  const incomingTransform = `translate3d(${direction * incomingProgress * 100}%, 0, 0) rotateY(${direction * incomingProgress * 45}deg)`;
  const outgoingOrigin = direction > 0 ? "100% 50%" : "0% 50%";
  const incomingOrigin = direction > 0 ? "0% 50%" : "100% 50%";
  const outgoingMaskOpacity = progress;
  const incomingMaskOpacity = incomingProgress;

  const layerStyle = (
    transform: string,
    transformOrigin: string,
    zIndex: number,
  ): CSSProperties => ({
    position: "absolute",
    inset: 0,
    zIndex,
    transform,
    transformOrigin,
    pointerEvents: "none",
    backfaceVisibility: "hidden",
    willChange: "transform",
  });

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ perspective: 500, transformStyle: "preserve-3d" }}
    >
      <div style={layerStyle(outgoingTransform, outgoingOrigin, 1)}>
        {renderStory(
          transition.fromStory,
          transition.fromSegmentIndex,
          transition.fromProgress,
          false,
          liked,
        )}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: getColorCSSVar("BrandTikTokBlack"),
            opacity: outgoingMaskOpacity,
          }}
        />
      </div>
      <div style={layerStyle(incomingTransform, incomingOrigin, 2)}>
        {renderStory(transition.toStory, 0, 0, false, false)}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: getColorCSSVar("BrandTikTokBlack"),
            opacity: incomingMaskOpacity,
          }}
        />
      </div>
    </div>
  );
}

function StoryTransitionPreview({
  story,
  segmentIndex,
  progress,
}: {
  story: StoryDetail;
  segmentIndex: number;
  progress: number;
}) {
  return (
    <StorySurface
      story={story}
      segmentIndex={segmentIndex}
      progress={progress}
      interactive={false}
    />
  );
}

function StoryMagnifyTransitionLayer({
  transition,
  rootRef,
}: {
  transition: MagnifyTransition | null;
  rootRef: RefObject<HTMLDivElement | null>;
}) {
  const root = rootRef.current;

  if (!transition || !root) {
    return null;
  }

  const fullRect = fullRootRect(root);
  const durationMs =
    transition.mode === "opening" ? STORY_OPEN_TRANSITION_MS : STORY_CLOSE_TRANSITION_MS;
  const frameTiming =
    transition.mode === "closing" ? STORY_TUX_SPRING_FRAME_TIMING : STORY_TRANSITION_TIMING;
  const fadeTiming =
    transition.mode === "closing" ? STORY_TUX_SPRING_FADE_TIMING : STORY_TRANSITION_TIMING;
  const snapshotFromRect = transition.fromRect ?? fullRect;
  const maskFromOpacity = transition.fromMaskOpacity ?? 1;
  const centeredAvatarRect = {
    left: fullRect.left + fullRect.width / 2 - transition.anchorRect.width / 2,
    top: fullRect.top + fullRect.height / 2 - transition.anchorRect.height / 2,
    width: transition.anchorRect.width,
    height: transition.anchorRect.height,
  };
  const snapshotRect =
    transition.mode === "opening"
      ? transition.phase === "to"
        ? fullRect
        : transition.anchorRect
      : transition.phase === "to"
        ? transition.anchorRect
        : snapshotFromRect;
  const snapshotOpacity =
    transition.mode === "opening"
      ? transition.phase === "to"
        ? 1
        : 0
      : transition.phase === "to"
        ? 0
        : 1;
  const maskOpacity =
    transition.mode === "opening"
      ? transition.phase === "to"
        ? 1
        : 0
      : transition.phase === "to"
        ? 0
        : maskFromOpacity;
  const avatarRect =
    transition.mode === "opening"
      ? transition.phase === "to"
        ? centeredAvatarRect
        : transition.anchorRect
      : transition.phase === "to"
        ? transition.anchorRect
        : centeredAvatarRect;
  const avatarOpacity =
    transition.mode === "opening"
      ? transition.phase === "to"
        ? 0
        : 1
      : transition.phase === "to"
        ? 1
        : 0;
  const avatarFadeMs =
    transition.mode === "opening" ? STORY_AVATAR_FADE_MS : STORY_AVATAR_REAPPEAR_MS;
  const targetSize = Math.min(transition.anchorRect.width, transition.anchorRect.height);
  const borderRadius =
    snapshotRect.width === fullRect.width && snapshotRect.height === fullRect.height
      ? 0
      : targetSize / 2;
  const snapshotClipPath = `inset(0 round ${borderRadius}px)`;
  const snapshotScaleX = snapshotRect.width / Math.max(fullRect.width, 1);
  const snapshotScaleY = snapshotRect.height / Math.max(fullRect.height, 1);

  return (
    <div className="z-50 absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: getColorCSSVar("BrandTikTokBlack"),
          opacity: maskOpacity,
          transition: `opacity ${durationMs}ms ${fadeTiming}`,
        }}
      />
      <img
        aria-hidden="true"
        src={transition.story.src}
        alt=""
        className="absolute object-cover"
        style={{
          left: avatarRect.left,
          top: avatarRect.top,
          width: avatarRect.width,
          height: avatarRect.height,
          opacity: avatarOpacity,
          borderRadius: 999,
          transition: [
            `left ${durationMs}ms ${frameTiming}`,
            `top ${durationMs}ms ${frameTiming}`,
            `opacity ${avatarFadeMs}ms ${fadeTiming}`,
          ].join(", "),
          willChange: "left, top, opacity",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute overflow-hidden"
        style={{
          left: snapshotRect.left,
          top: snapshotRect.top,
          width: snapshotRect.width,
          height: snapshotRect.height,
          opacity: snapshotOpacity,
          borderRadius,
          clipPath: snapshotClipPath,
          boxShadow: borderRadius > 0 ? "0 14px 40px rgba(0, 0, 0, 0.24)" : "none",
          transition: [
            `opacity ${durationMs}ms ${fadeTiming}`,
            `left ${durationMs}ms ${frameTiming}`,
            `top ${durationMs}ms ${frameTiming}`,
            `width ${durationMs}ms ${frameTiming}`,
            `height ${durationMs}ms ${frameTiming}`,
            `border-radius ${durationMs}ms ${frameTiming}`,
            `clip-path ${durationMs}ms ${frameTiming}`,
            `box-shadow ${durationMs}ms ${frameTiming}`,
          ].join(", "),
          willChange: "opacity, left, top, width, height, border-radius, clip-path",
        }}
      >
        <div
          className="top-0 left-0 absolute"
          style={{
            width: fullRect.width,
            height: fullRect.height,
            transform: `scale(${snapshotScaleX}, ${snapshotScaleY})`,
            transformOrigin: "0 0",
            transition: `transform ${durationMs}ms ${frameTiming}`,
            willChange: "transform",
          }}
        >
          <StoryTransitionPreview
            story={transition.story}
            segmentIndex={transition.segmentIndex}
            progress={transition.progress}
          />
        </div>
      </div>
    </div>
  );
}

function StoryReplySegmentedControl({
  activeTab,
  onChange,
}: {
  activeTab: StoryReplyTab;
  onChange: (tab: StoryReplyTab) => void;
}) {
  return (
    <div
      className="relative grid grid-cols-2 mx-auto p-0.5 rounded-full w-[148px] h-9 overflow-hidden"
      style={{ backgroundColor: STORY_REPLY_TAB_TRACK }}
    >
      <div
        aria-hidden="true"
        className="top-0.5 bottom-0.5 absolute rounded-full"
        style={{
          left: activeTab === "emoji" ? 2 : 74,
          width: 72,
          backgroundColor: STORY_REPLY_TAB_THUMB,
          transition: "left 300ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      />
      <button
        type="button"
        aria-label="Emoji replies"
        className="z-10 relative flex justify-center items-center text-[21px] leading-none"
        onClick={() => onChange("emoji")}
        style={{ color: STORY_OVERLAY_TEXT }}
      >
        😍
      </button>
      <button
        type="button"
        aria-label="Avatar replies"
        className="z-10 relative flex justify-center items-center font-semibold text-[18px]"
        onClick={() => onChange("avatar")}
        style={{ color: STORY_OVERLAY_TEXT }}
      >
        Avatar
      </button>
    </div>
  );
}

function StoryReplyAvatarSticker({
  sticker,
  onClick,
}: {
  sticker: (typeof STORY_REPLY_AVATAR_STICKERS)[number];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Send avatar ${sticker.id}`}
      className="relative w-[88px] h-[88px] overflow-hidden active:scale-95"
      onClick={onClick}
    >
      <span
        aria-hidden="true"
        className="absolute overflow-hidden"
        style={sticker.imageStyle}
      >
        <img
          src={sticker.src}
          alt=""
          className="absolute inset-0 w-full max-w-none h-full pointer-events-none"
          style={{ objectFit: sticker.fit }}
        />
      </span>
    </button>
  );
}

function StoryReplyFloatingPanel({
  activeTab,
  onTabChange,
  onReactEmoji,
  onSelectAvatar,
}: {
  activeTab: StoryReplyTab;
  onTabChange: (tab: StoryReplyTab) => void;
  onReactEmoji: (emoji: string) => void;
  onSelectAvatar: (stickerId: string) => void;
}) {
  return (
    <div
      className="left-1/2 absolute w-[393px] max-w-full h-[304px] -translate-x-1/2"
      style={{ bottom: "403px" }}
    >
      <StoryReplySegmentedControl activeTab={activeTab} onChange={onTabChange} />

      {activeTab === "emoji" ? (
        <div
          className="gap-x-12 gap-y-12 grid grid-cols-[36px_36px_36px_36px] mx-auto w-[288px] h-[120px]"
          style={{ marginTop: 38 }}
        >
          {STORY_REPLY_FLOATING_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-label={`Send ${emoji}`}
              className="relative flex justify-center items-center w-9 h-9 overflow-visible active:scale-90"
              onClick={() => onReactEmoji(emoji)}
            >
              <span className="block absolute -inset-[3px] text-[60px] text-center leading-[42px]">
                {emoji}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div
          className="place-items-center gap-x-3 gap-y-6 grid grid-cols-[88px_88px_88px] mx-auto w-[288px] h-[200px]"
          style={{ marginTop: 24 }}
        >
          {STORY_REPLY_AVATAR_STICKERS.map((sticker) => (
            <StoryReplyAvatarSticker
              key={sticker.id}
              sticker={sticker}
              onClick={() => onSelectAvatar(sticker.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StoryReplyInputAccessory({
  story,
  replyValue,
  onReplyChange,
  onSend,
}: {
  story: StoryDetail;
  replyValue: string;
  onReplyChange: (value: string) => void;
  onSend: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const onSendRef = useRef(onSend);
  const onReplyChangeRef = useRef(onReplyChange);
  onSendRef.current = onSend;
  onReplyChangeRef.current = onReplyChange;

  const handleFocus = useSoftKeyboardInputFocus({
    placeholder: `Message ${story.name}...`,
    returnKey: "send",
    onChange: (value) => onReplyChangeRef.current(value),
    onSubmit: (value) => {
      const trimmed = value.trim();
      if (trimmed) {
        onSendRef.current(trimmed);
      }
    },
  });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const keepKeyboardOpen = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <div
      data-softkb-keep-open
      className="relative flex h-[67px] w-full items-center gap-3 rounded-t-[12px] pl-4 pr-4"
      style={{
        backgroundColor: getColorCSSVar("BrandTikTokWhite"),
        zIndex: 2,
      }}
    >
      <button
        type="button"
        aria-label="Open camera"
        className="flex h-11 w-9 flex-none items-center justify-center text-tux-v2-ui-text-1 active:opacity-65"
        onPointerDown={keepKeyboardOpen}
        onMouseDown={keepKeyboardOpen}
      >
        <TUXIconCameraFill size={31} />
      </button>

      <div
        className="flex h-[50px] min-w-0 flex-1 items-center rounded-full pl-4 pr-3"
        style={{ backgroundColor: STORY_REPLY_INPUT_WELL }}
      >
        <input
          ref={inputRef}
          value={replyValue}
          aria-label={`Message ${story.name}`}
          autoComplete="off"
          inputMode="text"
          placeholder={`Message ${story.name}...`}
          className="min-w-0 flex-1 bg-transparent text-[17px] font-normal leading-none text-tux-v2-ui-text-1 outline-none placeholder:text-tux-v2-ui-text-placeholder"
          style={{ caretColor: STORY_REPLY_CARET }}
          onChange={(event) => onReplyChange(event.currentTarget.value)}
          onFocus={handleFocus}
        />
        <div className="ml-2 flex flex-none items-center gap-4 text-tux-v2-ui-text-1">
          <button
            type="button"
            aria-label="Open album"
            className="active:opacity-65"
            onPointerDown={keepKeyboardOpen}
            onMouseDown={keepKeyboardOpen}
          >
            <TUXIconImageStack size={28} />
          </button>
          <button
            type="button"
            aria-label="Open sticker"
            className="active:opacity-65"
            onPointerDown={keepKeyboardOpen}
            onMouseDown={keepKeyboardOpen}
          >
            <TUXIconStickerRoundFill size={29} />
          </button>
          <button
            type="button"
            aria-label="Record voice"
            className="active:opacity-65"
            onPointerDown={keepKeyboardOpen}
            onMouseDown={keepKeyboardOpen}
          >
            <TUXIconMicrophoneFill size={32} />
          </button>
        </div>
      </div>
    </div>
  );
}

function StoryReplyInputDock({
  story,
  replyValue,
  onReplyChange,
  onSend,
}: {
  story: StoryDetail;
  replyValue: string;
  onReplyChange: (value: string) => void;
  onSend: (value: string) => void;
}) {
  const { keyboardSurfaceHeight } = useAppFrame();
  const { isOpen: keyboardOpen } = useSoftKeyboard();

  return (
    <div
      className="absolute inset-x-0 z-40 mx-auto w-full max-w-[393px] overflow-hidden rounded-t-[12px]"
      style={{
        bottom: keyboardOpen ? keyboardSurfaceHeight : 0,
        transition: `bottom ${KB_OPEN_ANIMATION_MS}ms cubic-bezier(0.32, 0.72, 0, 1)`,
        animation: "story-reply-dock-in 240ms cubic-bezier(0.32, 0.72, 0, 1)",
      }}
    >
      <StoryReplyInputAccessory
        story={story}
        replyValue={replyValue}
        onReplyChange={onReplyChange}
        onSend={onSend}
      />
    </div>
  );
}

function StoryReplyComposerOverlay({
  story,
  replyValue,
  onReplyChange,
  onSend,
  onReactEmoji,
  onClose,
}: {
  story: StoryDetail;
  replyValue: string;
  onReplyChange: (value: string) => void;
  onSend: (value: string) => void;
  onReactEmoji: (emoji: string) => void;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<StoryReplyTab>("emoji");
  const { close: closeSoftKeyboard } = useSoftKeyboard();

  const handleClose = useCallback(() => {
    closeSoftKeyboard();
    onClose();
  }, [closeSoftKeyboard, onClose]);

  useEffect(() => () => closeSoftKeyboard(), [closeSoftKeyboard]);

  return (
    <div data-story-control className="z-80 absolute inset-0">
      <button
        type="button"
        aria-label="Close reply composer"
        className="absolute inset-0 cursor-default"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        onClick={handleClose}
      />

      <StoryReplyFloatingPanel
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onReactEmoji={(emoji) => {
          onReactEmoji(emoji);
          handleClose();
        }}
        onSelectAvatar={() => {
          onReactEmoji("🫶");
          handleClose();
        }}
      />
      <StoryReplyInputDock
        story={story}
        replyValue={replyValue}
        onReplyChange={onReplyChange}
        onSend={onSend}
      />
    </div>
  );
}

type StoryShareContact = {
  name: string;
  src?: string;
  group?: readonly string[];
  online?: boolean;
  selected?: boolean;
};

type StoryShareButtonConfig = {
  label: string;
  icon: ReactNode;
  colorIcon?: boolean;
};

const STORY_SHARE_CONTACTS = [
  {
    name: "Bo Feng",
    src: "/resource/avatar/small/avatar-03.jpg",
    online: true,
  },
  {
    name: "TikTok Design (13)",
    group: [
      "/resource/avatar/custom/create.jpg",
      "/resource/avatar/custom/curiosity.jpg",
      "/resource/avatar/small/avatar-12.jpg",
      "/resource/avatar/small/avatar-13.jpg",
    ],
  },
  {
    name: "Chaceyyyy",
    src: "/resource/avatar/small/avatar-21.jpg",
  },
  {
    name: "Yeeyelin",
    src: "/resource/avatar/small/avatar-29.jpg",
  },
  {
    name: "Chujie",
    src: "/resource/avatar/small/avatar-39.jpg",
  },
  {
    name: "Siyuan",
    src: "/resource/avatar/custom/siyuan.png",
  },
] satisfies readonly StoryShareContact[];

const STORY_SHARE_CHANNELS = [
  { label: "Copy link", icon: <TUXIconColorLinkCircle size={48} />, colorIcon: true },
  { label: "WhatsApp", icon: <TUXIconColorWhatsappCircle size={48} />, colorIcon: true },
  { label: "Instagram", icon: <TUXIconColorInstagramCircle size={48} />, colorIcon: true },
  { label: "Snapchat", icon: <TUXIconColorSnapchatCircle size={48} />, colorIcon: true },
  { label: "Facebook", icon: <TUXIconColorFacebookCircle size={48} />, colorIcon: true },
  { label: "Twitter", icon: <TUXIconColorTwitterCircle size={56} />, colorIcon: true },
  { label: "More", icon: <TUXIconColorEllipsisCircle size={56} />, colorIcon: true },
] satisfies readonly StoryShareButtonConfig[];

const STORY_SHARE_FUNCTIONS = [
  { label: "Report", icon: <TUXIconFlagFill size={24} /> },
  { label: "Not interested", icon: <TUXIconHeartBrokenFill size={24} /> },
  { label: "Save video", icon: <TUXIconArrowDownToLineBold size={24} /> },
  { label: "Add to Story", icon: <TUXIconAddToStoryFill size={24} /> },
  { label: "Promote", icon: <TUXIconFireFill size={24} /> },
  { label: "Cast", icon: <TUXIconChromecastBold size={24} /> },
  { label: "Duet", icon: <TUXIcon2ptDuet size={24} /> },
  { label: "Live photo", icon: <TUXIcon2ptLivePhoto size={24} /> },
  { label: "Stitch", icon: <TUXIcon2ptStitch size={24} /> },
  { label: "Wallpaper", icon: <TUXIcon2ptLiveWallpaper size={24} /> },
  { label: "Effect", icon: <TUXIcon2ptEffect size={24} /> },
  { label: "GIF", icon: <TUXIcon2ptGIF size={24} /> },
  { label: "Template", icon: <TUXIcon2ptTemplate size={24} /> },
  { label: "Captions", icon: <TUXIcon2ptClosedCaptionFill size={24} /> },
  { label: "Speed", icon: <TUXIcon2ptSpeed size={24} /> },
  { label: "Gift", icon: <TUXIcon2ptGift size={24} /> },
  { label: "Copy", icon: <TUXIconDocOnDocFill size={24} /> },
  { label: "Audience", icon: <TUXIcon2ptSlashRectangle size={24} /> },
  { label: "Info", icon: <TUXIcon2ptInfoCircle size={24} /> },
  { label: "Block", icon: <TUXIcon2ptBlock size={24} /> },
  { label: "Shop", icon: <TUXIcon2ptShoppingBagStar size={24} /> },
  { label: "Ad settings", icon: <TUXIcon2ptAdvertisement size={24} /> },
  { label: "Film star", icon: <TUXIcon2ptFilmStar size={24} /> },
] satisfies readonly StoryShareButtonConfig[];

function StoryShareGroupAvatar({ sources }: { sources: readonly string[] }) {
  return (
    <div
      className="grid grid-cols-2 grid-rows-2 p-px rounded-full w-12 h-12 overflow-hidden"
      style={{ backgroundColor: STORY_SHARE_AVATAR_PLACEHOLDER }}
    >
      {sources.slice(0, 4).map((src, index) => (
        <img
          key={`${src}-${index}`}
          src={src}
          alt=""
          className="w-full h-full object-cover"
        />
      ))}
    </div>
  );
}

function StoryShareContactButton({ contact }: { contact: StoryShareContact }) {
  return (
    <button
      type="button"
      className="flex flex-col flex-none items-center gap-2 active:opacity-70 w-16"
      aria-label={`Send to ${contact.name}`}
    >
      <span className="relative flex justify-center items-center w-12 h-12">
        {contact.group ? (
          <StoryShareGroupAvatar sources={contact.group} />
        ) : (
          <img
            src={contact.src}
            alt=""
            className="rounded-full w-12 h-12 object-cover"
          />
        )}
        {contact.online ? (
          <span className="-right-px -bottom-px absolute flex justify-center items-center bg-white rounded-full w-[17px] h-[17px]">
            <span
              className="rounded-full w-3.5 h-3.5"
              style={{ backgroundColor: STORY_SHARE_ONLINE_DOT }}
            />
          </span>
        ) : null}
        {contact.selected ? (
          <span
            className="right-0 bottom-0 absolute flex justify-center items-center border-2 border-white rounded-full w-4 h-4"
            style={{ backgroundColor: STORY_SHARE_SELECTED_RING }}
          >
            <svg aria-hidden="true" width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 3.9L3.6 6.5L9 1" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        ) : null}
      </span>
      <span className="w-16 min-h-[14px] font-medium text-tux-v2-ui-text-1 text-[11px] text-center line-clamp-2 leading-[14px]">
        {contact.name}
      </span>
    </button>
  );
}

function StoryShareRoundButton({ item }: { item: StoryShareButtonConfig }) {
  return (
    <button
      type="button"
      className="flex flex-col flex-none items-center gap-2 active:opacity-70 w-16"
      aria-label={item.label}
    >
      <span
        className={[
          "flex h-12 w-12 items-center justify-center rounded-full",
          item.colorIcon ? "" : "text-tux-v2-ui-text-1",
        ].join(" ")}
        style={item.colorIcon ? undefined : { backgroundColor: STORY_SHARE_ICON_WELL }}
      >
        {item.icon}
      </span>
      <span className="w-16 min-h-[14px] font-medium text-tux-v2-ui-text-1 text-[11px] text-center line-clamp-2 leading-[14px]">
        {item.label}
      </span>
    </button>
  );
}

function StorySharePanel({ onClose }: { onClose: () => void }) {
  return (
    <ThemeScope mode="light" className="w-full h-[376px] overflow-hidden text-tux-v2-ui-text-1">
      <div data-story-control className="w-full h-full" style={{ backgroundColor: STORY_SHARE_SURFACE }}>
      <div className="relative flex justify-center items-center px-2 h-[52px]">
        <button
          type="button"
          aria-label="Search people"
          className="top-1 left-2 absolute flex justify-center items-center active:bg-tux-v2-ui-shape-neutral-4 rounded-full w-11 h-11"
        >
          <TUXIconMagnifyingGlass size={24} />
        </button>
        <TUXText as="div" font="TikTokFont" size={17} weight={700} color="UIText1">
          Send to
        </TUXText>
        <button
          type="button"
          aria-label="Close share panel"
          className="top-1 right-2 absolute flex justify-center items-center active:bg-tux-v2-ui-shape-neutral-4 rounded-full w-11 h-11"
          onClick={onClose}
        >
          <TUXIconXMark size={24} />
        </button>
      </div>

      <div className="flex gap-1 px-2 pt-0.5 h-[97px] overflow-x-auto story-share-row">
        {STORY_SHARE_CONTACTS.map((contact) => (
          <StoryShareContactButton key={contact.name} contact={contact} />
        ))}
      </div>

      <div className="h-px" style={{ backgroundColor: STORY_SHARE_DIVIDER }} />

      <div className="flex gap-1 px-2 pt-3 h-[105px] overflow-x-auto story-share-row">
        {STORY_SHARE_CHANNELS.map((item) => (
          <StoryShareRoundButton key={item.label} item={item} />
        ))}
      </div>

      <div className="flex gap-1 px-2 pt-0 h-[86px] overflow-x-auto story-share-row">
        {STORY_SHARE_FUNCTIONS.map((item) => (
          <StoryShareRoundButton key={item.label} item={item} />
        ))}
      </div>

      <div className="flex justify-center items-end pb-2 h-[35px]">
        <div className="bg-tux-v2-ui-text-1 rounded-full w-36 h-1.25" />
      </div>
      </div>
    </ThemeScope>
  );
}

function StorySheet({
  panel,
  rootRef,
  onClose,
}: {
  panel: StoryActionPanel;
  rootRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
}) {
  if (panel !== "share") {
    return null;
  }

  return (
    <TUXSheet
      {...appFrameSheetChromeProps()}
      root={rootRef}
      visible
      onVisibleChange={(nextVisible: boolean) => {
        if (!nextVisible) {
          onClose();
        }
      }}
      position="bottom"
      heightModePreset="fixed"
      height="376px"
      closeOnOutsideClick
      draggable={false}
      dragHandle="hidden"
      sheetBackgroundColor="UIPageFlat1"
      sheetBackground={STORY_SHARE_SURFACE}
      overlayBackgroundColor="transparent"
    >
      <div data-story-control className="w-full h-full overflow-hidden">
        <StorySharePanel onClose={onClose} />
      </div>
    </TUXSheet>
  );
}

export function StoryDetailPageContent({
  story,
  stories,
  sourceRect,
  anchorScopeId,
  onStoryChange,
  onClose,
}: StoryDetailPageContentProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const switchTimerRef = useRef<number | null>(null);
  const switchAnimationFrameRef = useRef<number | null>(null);
  const skylightScrollPinFrameRef = useRef<number | null>(null);
  const burstTimerRef = useRef<number | null>(null);
  const closingRef = useRef(false);
  const dragRef = useRef<DragSession | null>(null);
  const progressRef = useRef(0);
  const segmentIndexRef = useRef(0);
  const activeStoryRef = useRef(story);
  const lastPropStoryIdRef = useRef(story.id);
  const hiddenStoryCellRef = useRef<HTMLElement | null>(null);
  const dragOffsetRef = useRef<Point>({ x: 0, y: 0 });
  const suppressTapUntilRef = useRef(0);
  const startCloseRef = useRef<((fromRect?: LocalRect, fromMaskOpacity?: number) => void) | null>(null);

  const [activeStory, setActiveStory] = useState(story);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [contentVisible, setContentVisible] = useState(!sourceRect);
  const [transition, setTransition] = useState<MagnifyTransition | null>(null);
  const [storySwitch, setStorySwitch] = useState<StorySwitchTransition | null>(null);
  const [activePanel, setActivePanel] = useState<StoryActionPanel>(null);
  const [liked, setLiked] = useState(false);
  const [replyValue, setReplyValue] = useState("");
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [dragSettling, setDragSettling] = useState(false);
  const [emojiBurst, setEmojiBurst] = useState<{ id: number; emoji: string } | null>(null);

  const activeSegment = activeStory.segments[segmentIndex] ?? activeStory.segments[0];

  const stopSkylightScrollPin = useCallback(() => {
    if (skylightScrollPinFrameRef.current !== null) {
      window.cancelAnimationFrame(skylightScrollPinFrameRef.current);
      skylightScrollPinFrameRef.current = null;
    }
  }, []);

  const pinStorySkylightScroll = useCallback(
    (storyId: string, durationMs: number) => {
      stopSkylightScrollPin();
      const cell = getStoryCellElement(storyId, anchorScopeId);
      const scrollContainer = cell?.closest<HTMLElement>("[data-story-anchor-scroll]");
      if (!scrollContainer) {
        return;
      }

      const lockedScrollLeft = scrollContainer.scrollLeft;
      const startedAt = performance.now();
      const pin = () => {
        if (scrollContainer.isConnected) {
          scrollContainer.scrollLeft = lockedScrollLeft;
        }

        if (performance.now() - startedAt < durationMs) {
          skylightScrollPinFrameRef.current = window.requestAnimationFrame(pin);
        } else {
          skylightScrollPinFrameRef.current = null;
        }
      };

      pin();
    },
    [anchorScopeId, stopSkylightScrollPin],
  );

  const restoreHiddenStoryCell = useCallback(() => {
    if (hiddenStoryCellRef.current) {
      hiddenStoryCellRef.current.style.visibility = "";
      hiddenStoryCellRef.current = null;
    }
  }, []);

  const hideStoryCell = useCallback(
    (storyId: string) => {
      const cell = getStoryCellElement(storyId, anchorScopeId);
      if (!cell) {
        return null;
      }

      if (hiddenStoryCellRef.current === cell) {
        return cell;
      }

      restoreHiddenStoryCell();
      cell.style.visibility = "hidden";
      hiddenStoryCellRef.current = cell;
      return cell;
    },
    [anchorScopeId, restoreHiddenStoryCell],
  );

  useEffect(() => {
    activeStoryRef.current = activeStory;
  }, [activeStory]);

  useEffect(() => {
    segmentIndexRef.current = segmentIndex;
  }, [segmentIndex]);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (story.id === lastPropStoryIdRef.current) {
      return;
    }

    lastPropStoryIdRef.current = story.id;
    if (storySwitch || story.id === activeStoryRef.current.id) {
      return;
    }

    activeStoryRef.current = story;
    setActiveStory(story);
    setSegmentIndex(0);
    segmentIndexRef.current = 0;
    setProgress(0);
    progressRef.current = 0;
    setLiked(false);
    setActivePanel(null);
  }, [story, storySwitch]);

  const switchStory = useCallback(
    (direction: -1 | 1) => {
      if (closingRef.current || storySwitch || transition) {
        return;
      }

      const currentStory = activeStoryRef.current;
      const currentIndex = stories.findIndex((candidate) => candidate.id === currentStory.id);
      let nextStory: StoryDetail | undefined;
      for (
        let nextIndex = currentIndex + direction;
        nextIndex >= 0 && nextIndex < stories.length;
        nextIndex += direction
      ) {
        const candidate = stories[nextIndex];
        if (candidate && canConsumeStoryDetail(candidate)) {
          nextStory = candidate;
          break;
        }
      }

      if (!nextStory) {
        return;
      }

      if (switchTimerRef.current !== null) {
        window.clearTimeout(switchTimerRef.current);
      }
      if (switchAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(switchAnimationFrameRef.current);
      }

      setActivePanel(null);
      setStorySwitch({
        fromStory: currentStory,
        toStory: nextStory,
        direction,
        progress: 0,
        fromSegmentIndex: segmentIndexRef.current,
        fromProgress: progressRef.current,
      });
      setProgress(0);
      progressRef.current = 0;
      onStoryChange?.(nextStory);

      const startedAt = performance.now();
      const tick = (now: number) => {
        const rawProgress = clamp((now - startedAt) / STORY_SWITCH_MS, 0, 1);
        const easedProgress = storyPagingEase(rawProgress);

        setStorySwitch((current) =>
          current ? { ...current, progress: easedProgress } : current,
        );

        if (rawProgress < 1) {
          switchAnimationFrameRef.current = window.requestAnimationFrame(tick);
        }
      };

      switchAnimationFrameRef.current = window.requestAnimationFrame(tick);

      switchTimerRef.current = window.setTimeout(() => {
        if (switchAnimationFrameRef.current !== null) {
          window.cancelAnimationFrame(switchAnimationFrameRef.current);
          switchAnimationFrameRef.current = null;
        }
        activeStoryRef.current = nextStory;
        setActiveStory(nextStory);
        setSegmentIndex(0);
        segmentIndexRef.current = 0;
        setProgress(0);
        progressRef.current = 0;
        setStorySwitch(null);
        setLiked(false);
        setReplyValue("");
      }, STORY_SWITCH_MS + 24);
    },
    [onStoryChange, stories, storySwitch, transition],
  );

  const advancePlayback = useCallback(() => {
    const currentStory = activeStoryRef.current;
    const currentIndex = stories.findIndex((candidate) => candidate.id === currentStory.id);
    let nextStory: StoryDetail | undefined;

    for (
      let nextIndex = currentIndex + 1;
      nextIndex >= 0 && nextIndex < stories.length;
      nextIndex += 1
    ) {
      const candidate = stories[nextIndex];
      if (candidate && canConsumeStoryDetail(candidate)) {
        nextStory = candidate;
        break;
      }
    }

    if (nextStory) {
      switchStory(1);
      return;
    }

    setProgress(1);
    progressRef.current = 1;
    startCloseRef.current?.();
  }, [stories, switchStory]);

  const startClose = useCallback(
    (fromRect?: LocalRect, fromMaskOpacity?: number) => {
      if (closingRef.current) {
        return;
      }

      const root = rootRef.current;
      const closingStory = activeStoryRef.current;
      const targetElement = getStoryAvatarElement(closingStory.id, anchorScopeId);
      if (!root) {
        onClose(closingStory);
        return;
      }

      const anchorRect = targetElement
        ? viewportRectToLocal(targetElement.getBoundingClientRect(), root)
        : fallbackAnchorRect(root);

      closingRef.current = true;
      setActivePanel(null);
      setDragOffset({ x: 0, y: 0 });
      dragOffsetRef.current = { x: 0, y: 0 };
      pinStorySkylightScroll(closingStory.id, STORY_CLOSE_TRANSITION_MS);
      hideStoryCell(closingStory.id);
      setTransition({
        mode: "closing",
        phase: "from",
        anchorRect,
        fromRect,
        fromMaskOpacity,
        story: closingStory,
        segmentIndex: segmentIndexRef.current,
        progress: progressRef.current,
      });
      setContentVisible(false);

      const animationFrame = window.requestAnimationFrame(() => {
        setTransition((current) => (current ? { ...current, phase: "to" } : current));
      });

      closeTimerRef.current = window.setTimeout(() => {
        window.cancelAnimationFrame(animationFrame);
        stopSkylightScrollPin();
        restoreHiddenStoryCell();
        onClose(closingStory, targetElement);
      }, STORY_CLOSE_TRANSITION_MS + 18);
    },
    [anchorScopeId, hideStoryCell, onClose, pinStorySkylightScroll, restoreHiddenStoryCell, stopSkylightScrollPin],
  );

  startCloseRef.current = startClose;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !sourceRect) {
      setContentVisible(true);
      return undefined;
    }

    const anchorRect = viewportRectToLocal(sourceRect, root);

    pinStorySkylightScroll(story.id, STORY_OPEN_TRANSITION_MS + 48);
    hideStoryCell(story.id);
    setContentVisible(false);
    setTransition({
      mode: "opening",
      phase: "from",
      anchorRect,
      story,
      segmentIndex: 0,
      progress: 0,
    });

    const animationFrame = window.requestAnimationFrame(() => {
      setTransition((current) => (current ? { ...current, phase: "to" } : current));
    });
    const timer = window.setTimeout(() => {
      setTransition(null);
      setContentVisible(true);
      stopSkylightScrollPin();
      restoreHiddenStoryCell();
    }, STORY_OPEN_TRANSITION_MS + 28);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(timer);
      stopSkylightScrollPin();
      restoreHiddenStoryCell();
    };
  }, [
    hideStoryCell,
    pinStorySkylightScroll,
    restoreHiddenStoryCell,
    sourceRect,
    stopSkylightScrollPin,
    story,
  ]);

  useEffect(() => {
    return () => {
      restoreHiddenStoryCell();
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
      if (switchTimerRef.current !== null) {
        window.clearTimeout(switchTimerRef.current);
      }
      if (switchAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(switchAnimationFrameRef.current);
      }
      stopSkylightScrollPin();
      if (burstTimerRef.current !== null) {
        window.clearTimeout(burstTimerRef.current);
      }
    };
  }, [restoreHiddenStoryCell, stopSkylightScrollPin]);

  useEffect(() => {
    setProgress(0);
    progressRef.current = 0;
  }, [segmentIndex, activeStory.id]);

  useEffect(() => {
    if (!activeSegment || activePanel || !contentVisible || closingRef.current || dragOffset.y > 0 || storySwitch) {
      return undefined;
    }

    const duration = Math.max(activeSegment.durationMs, 1000);
    let frame = 0;
    let startedAt = performance.now() - progressRef.current * duration;

    const tick = (now: number) => {
      const nextProgress = (now - startedAt) / duration;

      if (nextProgress >= 1) {
        startedAt = now;
        advancePlayback();
        return;
      }

      progressRef.current = nextProgress;
      setProgress(nextProgress);
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [activePanel, activeSegment, advancePlayback, contentVisible, dragOffset.y, storySwitch]);

  const settleDragBack = () => {
    setDragSettling(true);
    setDragOffset({ x: 0, y: 0 });
    dragOffsetRef.current = { x: 0, y: 0 };
    window.setTimeout(() => {
      setDragSettling(false);
      restoreHiddenStoryCell();
      stopSkylightScrollPin();
    }, STORY_DRAG_CANCEL_MS);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePanel || closingRef.current || event.button !== 0 || storySwitch) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest("[data-story-control]")) {
      return;
    }

    const root = rootRef.current;
    if (!root) {
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startTime: performance.now(),
      dragging: false,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const root = rootRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !root) {
      return;
    }

    const rawX = event.clientX - drag.startX;
    const rawY = event.clientY - drag.startY;
    const absoluteX = Math.abs(rawX);
    const absoluteY = Math.abs(rawY);

    if (!drag.dragging) {
      if (absoluteY < 6 && absoluteX < 6) {
        return;
      }
      if (rawY <= 0 || absoluteY < absoluteX * 0.8) {
        return;
      }
      drag.dragging = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      const draggingStory = activeStoryRef.current;
      pinStorySkylightScroll(draggingStory.id, STORY_INTERACTIVE_PIN_MS);
      hideStoryCell(draggingStory.id);
    }

    const rootRect = root.getBoundingClientRect();
    const nextOffset = {
      x: 0,
      y: Math.max(0, resistantOffset(rawY, rootRect.height)),
    };

    suppressTapUntilRef.current = performance.now() + 360;
    dragOffsetRef.current = nextOffset;
    event.preventDefault();
    setDragOffset(nextOffset);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const root = rootRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const offset = dragOffsetRef.current;
    const elapsed = Math.max(performance.now() - drag.startTime, 1);
    const velocity = offset.y / elapsed;
    const movementX = Math.abs(event.clientX - drag.startX);
    const movementY = Math.abs(event.clientY - drag.startY);
    dragRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (root && drag.dragging) {
      const progressValue = dragProgress(root, offset);
      if (offset.y > CLOSE_DRAG_THRESHOLD || progressValue > 0.16 || velocity > 0.45) {
        startClose(translatedFullRect(root, offset), clamp(1 - progressValue, 0, 1));
        return;
      }
    }

    const target = event.target as HTMLElement;
    if (
      root &&
      !drag.dragging &&
      movementX < 8 &&
      movementY < 8 &&
      !target.closest("[data-story-control]") &&
      !target.closest("[data-story-tap-zone]") &&
      performance.now() >= suppressTapUntilRef.current
    ) {
      const rootRect = root.getBoundingClientRect();
      const localX = event.clientX - rootRect.left;
      if (localX < rootRect.width / 2) {
        switchStory(-1);
      } else {
        // Last / only story: tapping the right side exits the viewer.
        advancePlayback();
      }
      return;
    }

    settleDragBack();
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (drag && event.currentTarget.hasPointerCapture(drag.pointerId)) {
      event.currentTarget.releasePointerCapture(drag.pointerId);
    }
    settleDragBack();
  };

  const handlePreviousStory = () => {
    if (performance.now() < suppressTapUntilRef.current) {
      return;
    }
    switchStory(-1);
  };

  const handleNextStory = () => {
    if (performance.now() < suppressTapUntilRef.current) {
      return;
    }
    // Last / only story: tapping the right side exits the viewer.
    advancePlayback();
  };

  const showEmojiBurst = (emoji: string) => {
    setEmojiBurst({ id: Date.now(), emoji });
    if (burstTimerRef.current !== null) {
      window.clearTimeout(burstTimerRef.current);
    }
    burstTimerRef.current = window.setTimeout(() => setEmojiBurst(null), 760);
  };

  const sendStoryReply = (value: string) => {
    if (!value.trim()) {
      return;
    }

    setReplyValue("");
    setActivePanel(null);
    showEmojiBurst("💬");
  };

  const renderStory = (
    surfaceStory: StoryDetail,
    surfaceSegmentIndex: number,
    surfaceProgress: number,
    interactive: boolean,
    surfaceLiked: boolean,
  ) => (
    <StorySurface
      story={surfaceStory}
      segmentIndex={surfaceSegmentIndex}
      progress={surfaceProgress}
      liked={surfaceLiked}
      emojiBurst={interactive ? emojiBurst : null}
      interactive={interactive}
      onPreviousStory={handlePreviousStory}
      onNextStory={handleNextStory}
      onClose={() => startClose()}
      onOpenMessage={() => setActivePanel("message")}
      onReactEmoji={showEmojiBurst}
      onToggleLike={() => setLiked((current) => !current)}
      onShare={() => setActivePanel("share")}
    />
  );

  const root = rootRef.current;
  const currentDragProgress = root ? dragProgress(root, dragOffset) : 0;
  const isDragging = dragOffset.y !== 0;

  return (
    <div
      ref={rootRef}
      className="relative w-full min-w-0 h-full min-h-0 overflow-hidden"
      style={{ backgroundColor: "transparent" }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundColor: getColorCSSVar("BrandTikTokBlack"),
          opacity: contentVisible ? clamp(1 - currentDragProgress, 0, 1) : 0,
          transition: dragSettling
            ? `opacity ${STORY_DRAG_CANCEL_MS}ms ${STORY_TRANSITION_TIMING}`
            : undefined,
        }}
      />

      <div
        className="absolute inset-0 overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{
          opacity: contentVisible ? 1 : 0,
          transform: `translate3d(0, ${dragOffset.y}px, 0)`,
          transition: dragSettling
            ? `transform ${STORY_DRAG_CANCEL_MS}ms ${STORY_TRANSITION_TIMING}`
            : undefined,
          touchAction: activePanel ? "auto" : "none",
          willChange: isDragging ? "transform" : undefined,
        }}
      >
        {storySwitch ? (
          <StorySwitchStage
            transition={storySwitch}
            liked={liked}
            renderStory={renderStory}
          />
        ) : (
          renderStory(activeStory, segmentIndex, progress, true, liked)
        )}
      </div>

      <StoryMagnifyTransitionLayer transition={transition} rootRef={rootRef} />

      {activePanel === "message" ? (
        <StoryReplyComposerOverlay
          story={activeStory}
          replyValue={replyValue}
          onReplyChange={setReplyValue}
          onSend={sendStoryReply}
          onReactEmoji={showEmojiBurst}
          onClose={() => setActivePanel(null)}
        />
      ) : null}

      <StorySheet
        panel={activePanel}
        rootRef={rootRef}
        onClose={() => setActivePanel(null)}
      />

      <style>
        {`
          @keyframes story-emoji-burst {
            0% {
              opacity: 0;
              transform: translate3d(-50%, 18px, 0) scale(0.82);
            }
            18% {
              opacity: 1;
              transform: translate3d(-50%, 0, 0) scale(1);
            }
            100% {
              opacity: 0;
              transform: translate3d(-50%, -86px, 0) scale(1.35);
            }
          }

          @keyframes story-reply-dock-in {
            0% {
              transform: translate3d(0, 18px, 0);
            }
            100% {
              transform: translate3d(0, 0, 0);
            }
          }

          .story-share-row {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .story-share-row::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
    </div>
  );
}
