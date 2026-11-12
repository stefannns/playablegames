import {
  getColorCSSVar,
  TUXButton,
  TUXNavBar,
  TUXNavBarIconAction,
  TUXSheet,
  TUXTag,
  TUXText,
} from "@byted-tiktok/tux-web";
import {
  IconColorAppleMusic,
  TUXIconArrowTurnUpRight,
  TUXIconBookmark,
  TUXIconMagnifyingGlass,
  TUXIconPlayFill,
  TUXIconVideoFill,
} from "@byted-tiktok/tux-icons";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { AppNavBarBackButton } from "../../../components/sys/app_nav_bar_back_button";
import { ThemeScope, useTheme, type ResolvedTheme } from "../../../context/theme";
import {
  useRegisterHomeIndicatorSurfaceTheme,
  useRegisterStatusBarSurfaceTheme,
} from "../../../components/sys/app_frame";
import { appFrameSheetChromeProps } from "../../../components/sys/app_frame_sheet_chrome";
import { CreationBottomCtaSlot } from "../../creation/components/creation_bottom_cta";

const MUSIC_DETAIL_BOTTOM_CTA_BUTTON_HEIGHT = "52px";
const MUSIC_DETAIL_BOTTOM_CTA_HORIZONTAL_PADDING_PX = 24;
const MUSIC_DETAIL_BOTTOM_CTA_GAP_PX = 10;
const MUSIC_DETAIL_INLINE_ACTION_HEIGHT = "40px";

function getMusicDetailInlineActionColors(args: {
  useExperimentalSurface: boolean;
  largeCoverHeaderIsLight: boolean;
}):
  | {
      backgroundColor: string;
      textColor: string;
      iconColor: string;
    }
  | undefined {
  if (!args.useExperimentalSurface) return undefined;
  if (args.largeCoverHeaderIsLight) {
    return {
      backgroundColor: "UIImageOverlayBlackA25",
      textColor: "UIImageOverlayWhite",
      iconColor: getColorCSSVar("UIImageOverlayWhite"),
    };
  }
  return {
    backgroundColor: "UIShapeNeutral4",
    textColor: "UIText1",
    iconColor: getColorCSSVar("UIText1"),
  };
}
import { localProfileVideoThumbUrl } from "../../../utils/local_media_placeholder";
import type { CommentSheetMetrics } from "./comment_panel/comment_panel";
import type { FeedItemCardContent } from "./feed_item_card";
import { useMusicDetailExperimentStore } from "./music_detail_experiment_store";
import { useMusicDetailSheetChrome } from "./music_detail_sheet_chrome";
import { setMusicDetailVisualState } from "./music_detail_visual_store";

export type MusicDetailPanelState = "closed" | "half" | "full";

/** Panel chrome follows the feed surface; large-cover light header is the only override. */
function resolveMusicDetailSurfaceTheme(args: {
  surfaceTheme: ResolvedTheme;
  isLargeCoverExperiment: boolean;
  largeCoverHeaderIsLight: boolean;
}): ResolvedTheme {
  if (args.isLargeCoverExperiment && args.largeCoverHeaderIsLight) {
    return "dark";
  }
  return args.surfaceTheme;
}

type MusicDetailPanelProps = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  content: FeedItemCardContent;
  root?: HTMLElement | null;
  onMetricsChange?: (metrics: CommentSheetMetrics) => void;
  /** Feed tab surface (For You = dark, Explore follows app theme). */
  surfaceTheme?: ResolvedTheme;
};

const MUSIC_GRID_ITEMS = Array.from({ length: 18 }, (_, index) =>
  localProfileVideoThumbUrl(index + 1),
);
const FULL_NAV_BAR_HEIGHT = 44;
const NAV_SEPARATOR_SCROLL_THRESHOLD_PX = 6;
/** Half-sheet top corner radius — shared with open-record cover art. */
const MUSIC_DETAIL_PANEL_CORNER_RADIUS_PX = 12;
const HALF_MUSIC_INFO_PADDING_TOP = 30;
const FULL_MUSIC_INFO_PADDING_TOP = 8;
const LARGE_COVER_HERO_HEIGHT = 381;
const LARGE_COVER_BACKGROUND_URL =
  "/resource/music_detail/large-cover-background-2.png";
const LARGE_COVER_WAVE_PATH_D =
  "M123.171 312.773C93.2879 313.782 19.922 113.3 0 0H858.464C865.624 84.9223 799.335 255.019 761.981 256.028C715.289 257.289 701.214 239.232 676 239.232C650.786 239.232 642.449 282.672 595.757 282.672C549.064 282.672 545.657 235.448 495.23 239.232C444.802 243.015 384.231 364.5 372.462 366.969C352.132 371.235 351.5 158.5 332.5 158.5C317.5 158.5 302.367 242.385 255.675 239.232C208.983 236.079 203.523 72.5202 161.5 72.5202C119.477 72.5202 160.525 311.512 123.171 312.773Z";
const TURNTABLE_HALF_URL = "/resource/music_detail/turntable-half.png";
const TURNTABLE_FULL_URL = "/resource/music_detail/turntable-full.png";
const OPEN_RECORD_COVER_URL = "/resource/music_detail/open-record-cover.png";
const OPEN_RECORD_BLACK_URL = "/resource/music_detail/open-record-black.png";
const OPEN_RECORD_TONEARM_URL = "/resource/music_detail/open-record-tonearm.png";
const STORY_AVATAR_URL = "/resource/music_detail/story-avatar.png";
const STORY_RING_GRADIENT =
  "linear-gradient(135deg, #15C0F9 0%, #20D5EC 48%, #1AE3C6 100%)";

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(value: number) {
  const progress = clamp(value);
  return progress * progress * (3 - 2 * progress);
}

function remapProgress(value: number, start: number, end: number) {
  if (end <= start) return value >= end ? 1 : 0;
  return clamp((value - start) / (end - start));
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function getFrameTopInset(root?: HTMLElement | null) {
  if (!root || typeof window === "undefined") return 0;
  const frameEl = root.closest?.("[data-app-frame-root='true']") as HTMLElement | null;
  const target = frameEl ?? root;
  const topInset = parseFloat(
    getComputedStyle(target).getPropertyValue("--app-frame-top-inset").trim(),
  );
  return Number.isFinite(topInset) ? topInset : 0;
}

function SpotifyGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="12" fill="#1ED760" />
      <path
        d="M6.2 9.1c3.55-1.05 7.56-.76 11.48.85"
        stroke="white"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M7 12.2c3.08-.82 6.16-.58 9.23.72"
        stroke="white"
        strokeLinecap="round"
        strokeWidth="1.55"
      />
      <path
        d="M7.8 15.1c2.3-.56 4.65-.38 7 .5"
        stroke="white"
        strokeLinecap="round"
        strokeWidth="1.35"
      />
    </svg>
  );
}

function MusicCoverArt({
  src,
  size = 84,
  coverInset = 7,
  showGradientRing = true,
}: {
  src: string;
  size?: number;
  coverInset?: number;
  showGradientRing?: boolean;
}) {
  return (
    <div
      className="relative flex-none"
      style={{ width: size, height: size }}
    >
      {showGradientRing ? (
        <svg
          aria-hidden
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 84 84"
          fill="none"
        >
          <defs>
            <linearGradient
              id="mdp-music-cover-ring"
              x1="12"
              y1="10"
              x2="72"
              y2="74"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#0094FF" />
              <stop offset="0.48" stopColor="#20D5EC" />
              <stop offset="1" stopColor="#00FFA3" />
            </linearGradient>
          </defs>
          <circle
            cx="42"
            cy="42"
            r="40.25"
            stroke="url(#mdp-music-cover-ring)"
            strokeWidth="3.5"
          />
        </svg>
      ) : null}
      <div
        className="absolute overflow-hidden rounded-full"
        style={{ inset: coverInset }}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          onDragStart={(event) => event.preventDefault()}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}

function LargeCoverTitle({
  children,
  light = false,
}: {
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <div
      className="relative max-w-full overflow-hidden whitespace-nowrap"
      style={{
        animation:
          "mdp-large-cover-title-mask 8s linear infinite",
        WebkitMaskImage:
          "linear-gradient(to right, #000 0%, #000 78%, transparent 100%)",
        maskImage:
          "linear-gradient(to right, #000 0%, #000 78%, transparent 100%)",
      }}
    >
      <span
        className="inline-block min-w-max"
        style={{
          animation: "mdp-large-cover-title-marquee 8s linear infinite",
          color: light ? "#ffffff" : "#161823",
          fontSize: 20,
          fontWeight: 700,
          lineHeight: 1.25,
          textShadow: light ? "0 2px 8px rgba(0,0,0,0.25)" : undefined,
        }}
      >
        {children}
      </span>
    </div>
  );
}

function LargeCoverWave() {
  return (
    <svg
      aria-hidden
      className="absolute top-0 max-w-none"
      viewBox="0 0 859 368"
      fill="none"
      preserveAspectRatio="none"
      style={{
        left: "-4%",
        width: "108%",
        height: 190,
      }}
    >
      <defs>
        <linearGradient
          id="mdp-large-cover-wave-gradient"
          x1="418.968"
          y1="-9.5"
          x2="418.968"
          y2="189.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FCE5AE" />
          <stop offset="1" stopColor="#FFFFFF" />
        </linearGradient>
        <filter
          id="mdp-large-cover-wave-flow"
          x="-8%"
          y="-18%"
          width="116%"
          height="136%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.034"
            numOctaves="2"
            seed="7"
            result="waveNoise"
          >
            <animate
              attributeName="baseFrequency"
              dur="3.2s"
              repeatCount="indefinite"
              values="0.010 0.030;0.018 0.052;0.013 0.040;0.010 0.030"
              keyTimes="0;0.38;0.72;1"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="waveNoise"
            scale="18"
            xChannelSelector="R"
            yChannelSelector="G"
          >
            <animate
              attributeName="scale"
              dur="2.6s"
              repeatCount="indefinite"
              values="10;24;15;30;10"
              keyTimes="0;0.28;0.52;0.76;1"
            />
          </feDisplacementMap>
        </filter>
      </defs>
      <g
        filter="url(#mdp-large-cover-wave-flow)"
        style={{
          transformBox: "fill-box",
          transformOrigin: "50% 0%",
          animation:
            "mdp-large-cover-wave-flame-main 2.9s ease-in-out infinite",
        }}
      >
        <path
          d={LARGE_COVER_WAVE_PATH_D}
          fill="url(#mdp-large-cover-wave-gradient)"
        />
      </g>
      <path
        d={LARGE_COVER_WAVE_PATH_D}
        fill="url(#mdp-large-cover-wave-gradient)"
        opacity={0.42}
        style={{
          transformBox: "fill-box",
          transformOrigin: "47% 0%",
          animation:
            "mdp-large-cover-wave-flame-secondary 3.7s ease-in-out infinite",
        }}
      />
      <path
        d={LARGE_COVER_WAVE_PATH_D}
        fill="#FFFFFF"
        opacity={0.18}
        style={{
          transformBox: "fill-box",
          transformOrigin: "53% 0%",
          animation:
            "mdp-large-cover-wave-flame-tertiary 4.4s ease-in-out infinite",
        }}
      />
    </svg>
  );
}

function TurntableArtwork({ expanded }: { expanded: boolean }) {
  return (
    <div className="flex justify-center w-full">
      <img
        src={expanded ? TURNTABLE_FULL_URL : TURNTABLE_HALF_URL}
        alt=""
        draggable={false}
        className="object-contain"
        style={{
          width: expanded ? 169 : 138,
          height: expanded ? 148 : 58,
        }}
      />
    </div>
  );
}

function OpenRecordGoldDisc({ mode }: { mode: ResolvedTheme }) {
  const gradientId = useId().replace(/:/g, "");
  const isDark = mode === "dark";

  return (
    <svg
      aria-hidden
      viewBox="0 0 94 94"
      className="block h-full w-full"
      fill="none"
    >
      <defs>
        <radialGradient
          id={`${gradientId}-fill`}
          cx="34%"
          cy="28%"
          r="72%"
        >
          {isDark ? (
            <>
              <stop offset="0%" stopColor="#6B6B6B" />
              <stop offset="52%" stopColor="#3A3A3A" />
              <stop offset="100%" stopColor="#1A1A1A" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#FFF6E0" />
              <stop offset="48%" stopColor="#E2C06A" />
              <stop offset="100%" stopColor="#B8893A" />
            </>
          )}
        </radialGradient>
        <linearGradient
          id={`${gradientId}-sheen`}
          x1="18"
          y1="8"
          x2="72"
          y2="86"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor={isDark ? "#FFFFFF" : "#FFFFFF"}
            stopOpacity={isDark ? 0.14 : 0.34}
          />
          <stop offset="42%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop
            offset="100%"
            stopColor={isDark ? "#000000" : "#8A6420"}
            stopOpacity={isDark ? 0.28 : 0.18}
          />
        </linearGradient>
      </defs>
      <circle cx="47" cy="47" r="47" fill={`url(#${gradientId}-fill)`} />
      {[18, 24, 30, 36, 42].map((radius) => (
        <circle
          key={radius}
          cx="47"
          cy="47"
          r={radius}
          stroke={isDark ? "#FFFFFF" : "#B8893A"}
          strokeOpacity={isDark ? 0.06 : 0.12}
          strokeWidth="0.6"
        />
      ))}
      <circle
        cx="47"
        cy="47"
        r="47"
        fill={`url(#${gradientId}-sheen)`}
      />
      <circle
        cx="47"
        cy="47"
        r="46.2"
        stroke={isDark ? "#FFFFFF" : "#F3E2B0"}
        strokeOpacity={isDark ? 0.08 : 0.35}
        strokeWidth="0.8"
      />
    </svg>
  );
}

function OpenRecordLayer({ src }: { src: string }) {
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      onDragStart={(event) => event.preventDefault()}
      className="w-full h-full object-contain"
    />
  );
}

function MusicDetailStoryAvatar() {
  return (
    <span className="relative block size-7 shrink-0" aria-hidden>
      <img
        src={STORY_AVATAR_URL}
        alt=""
        draggable={false}
        onDragStart={(event) => event.preventDefault()}
        className="absolute left-[3px] top-[3px] size-[22px] rounded-full object-cover"
      />
      <span
        aria-hidden
        className="absolute inset-0 size-7 rounded-full"
        style={{
          background: STORY_RING_GRADIENT,
          WebkitMask:
            "radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1.5px))",
          mask: "radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1.5px))",
        }}
      />
    </span>
  );
}

function OpenRecordArtwork({
  progress,
  showTonearm = false,
  surfaceTheme,
}: {
  progress: number;
  showTonearm?: boolean;
  surfaceTheme: ResolvedTheme;
}) {
  const easedProgress = smoothstep(progress);
  const stageWidth = showTonearm
    ? lerp(162, 156, easedProgress)
    : lerp(162, 264, easedProgress);
  const stageHeight = showTonearm
    ? lerp(124, 106, easedProgress)
    : lerp(124, 136, easedProgress);
  const recordSize = 94;
  const coverSize = 96;
  const coverX = showTonearm ? lerp(26, 0, easedProgress) : lerp(26, 0, easedProgress);
  const coverY = lerp(14, 0, easedProgress);
  const blackX = lerp(27, 86, easedProgress);
  const goldX = showTonearm ? lerp(58, 82, easedProgress) : lerp(53, 170, easedProgress);
  const tonearmProgress = smoothstep(remapProgress(easedProgress, 0.18, 1));
  const recordShadow = `drop-shadow(0 10px 18px rgba(0,0,0,${lerp(
    showTonearm ? 0.04 : 0.08,
    showTonearm ? 0.08 : 0.16,
    easedProgress,
  )}))`;

  return (
    <div className="flex justify-center w-full">
      <div
        className="relative"
        style={{
          width: stageWidth,
          height: stageHeight,
          transform: showTonearm
            ? `translateY(${lerp(0, -10, easedProgress)}px)`
            : undefined,
        }}
      >
        <div
          className="absolute"
          style={{
            width: recordSize,
            height: recordSize,
            left: goldX,
            top: lerp(15, 0, easedProgress),
            transform: `rotate(${lerp(0, 4, easedProgress)}deg)`,
            filter: recordShadow,
            zIndex: 1,
          }}
        >
          <OpenRecordGoldDisc mode={surfaceTheme} />
        </div>
        {showTonearm ? null : (
          <div
            className="absolute"
            style={{
              width: recordSize,
              height: recordSize,
              left: blackX,
              top: lerp(15, 0, easedProgress),
              opacity: 1,
              transform: `rotate(${lerp(-2, 3, easedProgress)}deg)`,
              filter: recordShadow,
              zIndex: 2,
            }}
          >
            <OpenRecordLayer src={OPEN_RECORD_BLACK_URL} />
          </div>
        )}
        <div
          className="absolute overflow-hidden"
          style={{
            width: coverSize,
            height: coverSize,
            left: coverX,
            top: coverY,
            borderRadius: MUSIC_DETAIL_PANEL_CORNER_RADIUS_PX,
            transform: `rotate(${lerp(0, -5, easedProgress)}deg)`,
            transformOrigin: "50% 58%",
            boxShadow: `0 10px 18px rgba(0,0,0,${lerp(
              showTonearm ? 0.04 : 0.08,
              showTonearm ? 0.08 : 0.16,
              easedProgress,
            )})`,
            zIndex: 3,
          }}
        >
          <img
            src={OPEN_RECORD_COVER_URL}
            alt=""
            draggable={false}
            onDragStart={(event) => event.preventDefault()}
            className="w-full h-full object-cover"
          />
        </div>
        {showTonearm ? (
          <img
            src={OPEN_RECORD_TONEARM_URL}
            alt=""
            draggable={false}
            onDragStart={(event) => event.preventDefault()}
            className="absolute object-contain pointer-events-none"
            style={{
              width: 63,
              height: 88,
              left: lerp(101, 139, easedProgress),
              top: lerp(12, 9, easedProgress),
              opacity: tonearmProgress,
              transform: `rotate(${lerp(0, 15.5, tonearmProgress)}deg)`,
              transformOrigin: "50% 10%",
              zIndex: 5,
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

export function MusicDetailPanel({
  visible,
  onVisibleChange,
  content,
  root,
  onMetricsChange,
  surfaceTheme: surfaceThemeProp,
}: MusicDetailPanelProps) {
  const { resolvedTheme } = useTheme();
  const surfaceTheme = surfaceThemeProp ?? resolvedTheme;

  const { activeExperimentId } = useMusicDetailExperimentStore();
  const isLargeCoverExperiment = activeExperimentId === "large-cover";
  const isTurntableExperiment = activeExperimentId === "turntable";
  const isOpenRecordExperiment = activeExperimentId === "open-record";
  const isOpenRecordArmExperiment = activeExperimentId === "open-record-arm";
  const shouldUseOpenRecordArmLayout =
    isOpenRecordArmExperiment || isLargeCoverExperiment;
  const isOpenRecordLikeExperiment =
    isOpenRecordExperiment || shouldUseOpenRecordArmLayout;
  const isExperimentalMusicDetail =
    isLargeCoverExperiment || isTurntableExperiment || isOpenRecordLikeExperiment;
  const isCompactActionExperiment = isTurntableExperiment;

  const {
    panelSurfaceRef,
    snapHeights,
    snap,
    visualExpansionProgress,
    isDragging,
    expandedHeightPx,
  } = useMusicDetailSheetChrome({
    visible,
    onVisibleChange,
    onMetricsChange,
    root,
  });

  const state: MusicDetailPanelState = !visible
    ? "closed"
    : snap === "90"
      ? "full"
      : "half";
  const isFull = snap === "90";
  const largeCoverHeaderIsLight = false;
  const panelTheme = resolveMusicDetailSurfaceTheme({
    surfaceTheme,
    isLargeCoverExperiment,
    largeCoverHeaderIsLight,
  });
  useRegisterHomeIndicatorSurfaceTheme(visible ? panelTheme : null);
  useRegisterStatusBarSurfaceTheme(visible && isFull ? panelTheme : null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fullScrollUnlockTimerRef = useRef<number | null>(null);
  const [isFullScrollLocked, setIsFullScrollLocked] = useState(isFull);
  const [showNavSeparator, setShowNavSeparator] = useState(false);
  const shouldLockContentScroll = state !== "full" || isFullScrollLocked;

  useEffect(() => {
    scrollAreaRef.current?.scrollTo({ top: 0 });
    setShowNavSeparator(false);

    if (fullScrollUnlockTimerRef.current != null) {
      window.clearTimeout(fullScrollUnlockTimerRef.current);
      fullScrollUnlockTimerRef.current = null;
    }

    if (isFull) {
      setIsFullScrollLocked(true);
      fullScrollUnlockTimerRef.current = window.setTimeout(() => {
        setIsFullScrollLocked(false);
        fullScrollUnlockTimerRef.current = null;
      }, 380);
      return () => {
        if (fullScrollUnlockTimerRef.current != null) {
          window.clearTimeout(fullScrollUnlockTimerRef.current);
          fullScrollUnlockTimerRef.current = null;
        }
      };
    }

    setIsFullScrollLocked(false);
    return undefined;
  }, [isFull, visible]);

  useEffect(() => {
    return () => {
      if (fullScrollUnlockTimerRef.current != null) {
        window.clearTimeout(fullScrollUnlockTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setMusicDetailVisualState({
      isOpen: visible,
      isFullScreen: visible && isFull,
    });
    return () => {
      setMusicDetailVisualState({ isOpen: false, isFullScreen: false });
    };
  }, [isFull, visible]);

  const shouldBlockScrollHandoffToSheet = () => {
    if (state !== "full") return false;
    return (scrollAreaRef.current?.scrollTop ?? 0) <= 0;
  };

  const isolateScrollFromSheetDrag = (
    event: React.PointerEvent<HTMLDivElement> | ReactWheelEvent<HTMLDivElement>,
  ) => {
    if (!shouldBlockScrollHandoffToSheet()) return;
    event.stopPropagation();
  };

  const onContentWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (state === "full" && isFullScrollLocked) {
      event.preventDefault();
      return;
    }

    if (!shouldBlockScrollHandoffToSheet()) return;

    event.stopPropagation();
    const scrollTop = scrollAreaRef.current?.scrollTop ?? 0;
    if (scrollTop <= 0 && event.deltaY < 0) {
      event.preventDefault();
    }
  };

  const onContentScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const nextShowSeparator =
      event.currentTarget.scrollTop > NAV_SEPARATOR_SCROLL_THRESHOLD_PX;
    setShowNavSeparator((current) =>
      current === nextShowSeparator ? current : nextShowSeparator,
    );
  };

  const largeCoverDockProgress = isExperimentalMusicDetail
    ? smoothstep(remapProgress(visualExpansionProgress, 0.22, 1))
    : visualExpansionProgress;
  const largeCoverBackgroundProgress = isLargeCoverExperiment
    ? 1
    : visualExpansionProgress;
  const frameTopInset = getFrameTopInset(root);
  const openRecordPanelNavHeight = 14;
  const topNavOpacity = visualExpansionProgress;
  const hideDragHandle = isFull;
  const grabberOpacity = hideDragHandle ? 0 : Math.max(0, 1 - visualExpansionProgress);
  const topBarPaddingTop = lerp(16, frameTopInset, visualExpansionProgress);
  const topBarNavHeight = isOpenRecordLikeExperiment
    ? lerp(openRecordPanelNavHeight, FULL_NAV_BAR_HEIGHT, largeCoverDockProgress)
    : FULL_NAV_BAR_HEIGHT * visualExpansionProgress;
  const topRadius =
    visualExpansionProgress <= 0
      ? MUSIC_DETAIL_PANEL_CORNER_RADIUS_PX
      : MUSIC_DETAIL_PANEL_CORNER_RADIUS_PX * (1 - largeCoverDockProgress);
  const musicInfoPaddingTop =
    HALF_MUSIC_INFO_PADDING_TOP -
    (HALF_MUSIC_INFO_PADDING_TOP - FULL_MUSIC_INFO_PADDING_TOP) *
      visualExpansionProgress;
  const largeCoverHeaderTextColor = largeCoverHeaderIsLight
    ? "rgba(255,255,255,0.6)"
    : "rgba(22,24,35,0.48)";
  const largeCoverStrongTextColor = largeCoverHeaderIsLight
    ? "#ffffff"
    : "#161823";
  const largeCoverTextShadow = largeCoverHeaderIsLight
    ? "0 2px 8px rgba(0,0,0,0.25)"
    : undefined;
  const openRecordSaveActionColors = getMusicDetailInlineActionColors({
    useExperimentalSurface: true,
    largeCoverHeaderIsLight: false,
  });
  const playFullSongActionColors = getMusicDetailInlineActionColors({
    useExperimentalSurface: isCompactActionExperiment,
    largeCoverHeaderIsLight,
  });
  const saveActionColors = getMusicDetailInlineActionColors({
    useExperimentalSurface: isLargeCoverExperiment || isCompactActionExperiment,
    largeCoverHeaderIsLight,
  });
  const defaultInlineActionIconColor = getColorCSSVar("UIText1");
  const panelNavBarIconColor =
    isLargeCoverExperiment && largeCoverHeaderIsLight
      ? getColorCSSVar("UIImageOverlayWhite")
      : isLargeCoverExperiment
        ? getColorCSSVar("UIImageOverlayBlack")
        : getColorCSSVar("UIText1");
  const largeCoverShareIconColor = panelNavBarIconColor;

  const sheetStyle: CSSProperties = {
    borderTopLeftRadius: topRadius,
    borderTopRightRadius: topRadius,
    color: getColorCSSVar("UIText1"),
    ["--music-detail-expand-progress" as string]: String(visualExpansionProgress),
    boxShadow:
      visualExpansionProgress >= 1
        ? "none"
        : `0 -12px 28px rgba(0,0,0,${0.18 * (1 - visualExpansionProgress)})`,
  };

  const panelTopBar = (
    <div
      className="relative flex-none shrink-0 w-full select-none"
      style={{
        boxSizing: "content-box",
        paddingTop: topBarPaddingTop,
        height: topBarNavHeight,
        zIndex: 2,
      }}
    >
      <div
        style={{
          opacity: topNavOpacity,
          pointerEvents: topNavOpacity > 0.8 ? "auto" : "none",
        }}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <TUXNavBar
          heightPreset={44}
          showSeparator={showNavSeparator}
          backgroundOpacity={0}
          leading={
            <AppNavBarBackButton
              iconColor={panelNavBarIconColor}
              onBack={() => onVisibleChange(false)}
            />
          }
          trailing={
            <div className="flex items-center">
              <TUXNavBarIconAction
                aria-label="Search music posts"
                width="42px"
                height="44px"
                icon={
                  <TUXIconMagnifyingGlass
                    size={22}
                    color={panelNavBarIconColor}
                  />
                }
              />
              <TUXNavBarIconAction
                aria-label="Share music"
                width="42px"
                height="44px"
                icon={
                  <TUXIconArrowTurnUpRight
                    size={22}
                    color={panelNavBarIconColor}
                  />
                }
              />
            </div>
          }
        />
      </div>
    </div>
  );

  const panelBody = (
    <>
      {isLargeCoverExperiment ? (
        <style>
          {`@keyframes mdp-large-cover-wave-flame-main {
              0%, 100% { transform: translate3d(-1%, -4px, 0) scaleY(0.88) skewX(-1.5deg); }
              22% { transform: translate3d(1.3%, 8px, 0) scaleY(1.18) skewX(1.2deg); }
              48% { transform: translate3d(-0.5%, -2px, 0) scaleY(1.02) skewX(-0.8deg); }
              74% { transform: translate3d(0.8%, 5px, 0) scaleY(1.27) skewX(1.8deg); }
            }`}
          {`@keyframes mdp-large-cover-wave-flame-secondary {
              0%, 100% { transform: translate3d(2.2%, -8px, 0) scaleY(1.08) skewX(1.4deg); }
              34% { transform: translate3d(-1.2%, 7px, 0) scaleY(0.84) skewX(-1.2deg); }
              66% { transform: translate3d(0.6%, 1px, 0) scaleY(1.22) skewX(0.8deg); }
            }`}
          {`@keyframes mdp-large-cover-wave-flame-tertiary {
              0%, 100% { transform: translate3d(-2%, 3px, 0) scaleY(0.98) skewX(-0.8deg); }
              30% { transform: translate3d(1.5%, -7px, 0) scaleY(1.3) skewX(1.5deg); }
              62% { transform: translate3d(-0.8%, 8px, 0) scaleY(0.82) skewX(-1.6deg); }
            }`}
          {`@keyframes mdp-large-cover-title-marquee {
              0%, 18% { transform: translateX(0); }
              82%, 100% { transform: translateX(-34%); }
            }`}
          {`@keyframes mdp-large-cover-title-mask {
              0%, 18% {
                -webkit-mask-image: linear-gradient(to right, #000 0%, #000 78%, transparent 100%);
                mask-image: linear-gradient(to right, #000 0%, #000 78%, transparent 100%);
              }
              22%, 100% {
                -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 12%, #000 78%, transparent 100%);
                mask-image: linear-gradient(to right, transparent 0%, #000 12%, #000 78%, transparent 100%);
              }
            }`}
        </style>
      ) : null}
      <section
        aria-label="Music detail page"
        data-mdp-experiment={activeExperimentId}
        data-no-long-press="true"
        className="relative flex flex-1 min-h-0 w-full flex-col overflow-hidden"
      >
        <div
          ref={scrollAreaRef}
          className={[
            "relative flex-1 min-h-0",
            shouldLockContentScroll ? "overflow-hidden" : "overflow-y-auto",
          ].join(" ")}
          style={{
            touchAction: shouldLockContentScroll ? "none" : "pan-y",
            overscrollBehaviorY: "contain",
            zIndex: 2,
          }}
          onPointerDown={isolateScrollFromSheetDrag}
          onPointerDownCapture={isolateScrollFromSheetDrag}
          onWheel={onContentWheel}
          onScroll={onContentScroll}
        >
          <div
            className={[
              "relative",
              isOpenRecordLikeExperiment ? "overflow-visible" : "overflow-hidden",
            ].join(" ")}
          >
            {isOpenRecordLikeExperiment ? (
              <div
                className="relative px-4"
                style={{
                  paddingTop: lerp(14, 12, largeCoverDockProgress),
                  paddingBottom: 18,
                }}
              >
                <OpenRecordArtwork
                  progress={largeCoverDockProgress}
                  showTonearm={shouldUseOpenRecordArmLayout}
                  surfaceTheme={panelTheme}
                />
                <div
                  className="flex flex-col items-center text-center"
                  style={{
                    gap: 6,
                    marginTop: shouldUseOpenRecordArmLayout
                      ? lerp(-3, 5, largeCoverDockProgress)
                      : lerp(10, -18, largeCoverDockProgress),
                  }}
                >
                  <TUXText
                    as="h2"
                    typographyPreset="H3-Semibold"
                    color="UIText1"
                    className="block max-w-full truncate"
                    style={{ fontSize: 20 }}
                  >
                    Contains: {content.musicTitle}
                  </TUXText>
                  <div className="flex items-center justify-center gap-2 min-w-0">
                    <TUXText
                      typographyPreset="P1-Regular"
                      color="UIText1"
                      className="truncate"
                    >
                      Original sound by <strong>rachfumia</strong>
                    </TUXText>
                    <TUXText
                      typographyPreset="P1-Regular"
                      color="UIText3"
                      className="flex-none"
                    >
                      921.1K posts
                    </TUXText>
                  </div>
                </div>
              </div>
            ) : isTurntableExperiment ? (
              <div
                className="relative px-4 pb-3"
                style={{
                  paddingTop: lerp(6, 0, largeCoverDockProgress),
                }}
              >
                <TurntableArtwork expanded={largeCoverDockProgress > 0.55} />
                <div
                  className="flex flex-col items-center text-center"
                  style={{
                    gap: largeCoverDockProgress > 0.55 ? 8 : 6,
                    marginTop: largeCoverDockProgress > 0.55 ? 12 : 16,
                  }}
                >
                  <TUXText
                    as="h2"
                    typographyPreset="H3-Semibold"
                    color="UIText1"
                    className="block max-w-full truncate"
                    style={{ fontSize: 17 }}
                  >
                    Contains: {content.musicTitle}
                  </TUXText>
                  <div className="flex items-center justify-center min-w-0">
                    <TUXText
                      typographyPreset="P2-Semibold"
                      color="UIText1"
                      className="truncate"
                    >
                      Taylor Swift
                    </TUXText>
                  </div>
                  <div className="flex items-center justify-center gap-2 min-w-0">
                    <TUXText
                      typographyPreset="P1-Regular"
                      color="UIText2"
                      className="truncate"
                    >
                      Original sound by <strong>rachfumia</strong>
                    </TUXText>
                    <TUXText
                      typographyPreset="P1-Regular"
                      color="UIText3"
                      className="flex-none"
                    >
                      921.1K posts
                    </TUXText>
                  </div>
                </div>
              </div>
            ) : isLargeCoverExperiment ? (
              <div
                className="relative px-4 pb-3"
                style={{
                  paddingTop: lerp(16, 80, largeCoverDockProgress),
                }}
              >
                <div className="flex items-center gap-3 min-h-[92px]">
                  <MusicCoverArt
                    src={content.musicCoverUrl}
                    coverInset={7}
                    showGradientRing
                  />
                  <div className="flex flex-1 flex-col gap-1 min-w-0">
                    <LargeCoverTitle light={largeCoverHeaderIsLight}>
                      Contains: {content.musicTitle}
                    </LargeCoverTitle>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex items-center min-w-0">
                        <TUXText
                          typographyPreset="P2-Semibold"
                          className="truncate"
                          style={{
                            color: largeCoverHeaderTextColor,
                            textShadow: largeCoverTextShadow,
                          }}
                        >
                          {content.nickname}
                        </TUXText>
                      </div>
                      <span
                        className="h-1.5 w-px flex-none"
                        style={{ backgroundColor: largeCoverHeaderTextColor }}
                      />
                      <TUXText
                        typographyPreset="P2-Regular"
                        className="flex-none"
                        style={{
                          color: largeCoverHeaderTextColor,
                          textShadow: largeCoverTextShadow,
                        }}
                      >
                        921.1K posts
                      </TUXText>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <TUXText
                        typographyPreset="P2-Regular"
                        className="truncate"
                        style={{
                          color: largeCoverHeaderTextColor,
                          textShadow: largeCoverTextShadow,
                        }}
                      >
                        Original sound by <strong>{content.nickname}</strong>
                      </TUXText>
                      <span
                        className="h-1.5 w-px flex-none"
                        style={{ backgroundColor: largeCoverHeaderTextColor }}
                      />
                      <div className="flex flex-none items-center gap-1.5">
                        <TUXIconPlayFill
                          size={14}
                          color={largeCoverStrongTextColor}
                        />
                        <TUXText
                          typographyPreset="P2-Regular"
                          style={{
                            color: largeCoverStrongTextColor,
                            textShadow: largeCoverTextShadow,
                          }}
                        >
                          30s
                        </TUXText>
                      </div>
                    </div>
                  </div>
                  <TUXNavBarIconAction
                    aria-label="Share music"
                    width="32px"
                    height="32px"
                    icon={
                      <TUXIconArrowTurnUpRight
                        size={22}
                        color={largeCoverShareIconColor}
                      />
                    }
                  />
                </div>
              </div>
            ) : (
              <>
                <div
                  className="relative flex gap-4 items-center px-4 pb-3"
                  style={{ paddingTop: musicInfoPaddingTop }}
                >
                  <MusicCoverArt src={content.musicCoverUrl} />

                  <div className="flex flex-col flex-1 gap-1 min-w-0">
                    <TUXText
                      as="h2"
                      typographyPreset="H3-Semibold"
                      className="block"
                      textDisplay="lineBreak"
                    >
                      Contains: {content.musicTitle}
                    </TUXText>
                    <div className="flex items-center min-w-0">
                      <TUXText
                        typographyPreset="P2-Semibold"
                        className="truncate"
                      >
                        {content.nickname}
                      </TUXText>
                    </div>
                    <TUXText typographyPreset="SmallText1-Regular" color="UIText2">
                      Top 50 No.2
                    </TUXText>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2">
                  <div className="flex items-center gap-1.5">
                    <TUXIconPlayFill
                      size={14}
                      color={getColorCSSVar("UIText1")}
                    />
                    <TUXText typographyPreset="P1-Regular">30s</TUXText>
                  </div>
                  <div className="bg-tux-v2-ui-shape-neutral-3 w-px h-[18px]" />
                  <TUXText typographyPreset="P1-Regular" className="flex-1 truncate">
                    Original sound by <strong>{content.nickname}</strong>
                  </TUXText>
                  <TUXText typographyPreset="P2-Regular" color="UIText3">
                    921.1K posts
                  </TUXText>
                </div>
              </>
            )}

            {isOpenRecordLikeExperiment ? (
              <div
                className="flex justify-center px-4"
                style={{ paddingTop: 0, paddingBottom: 20 }}
              >
                <TUXButton
                  text="Save"
                  themePreset="secondary"
                  shapePreset="capsule"
                  sizePreset="medium"
                  height={MUSIC_DETAIL_INLINE_ACTION_HEIGHT}
                  smoothRadius
                  block
                  leadingIcon={
                    <TUXIconBookmark
                      size={18}
                      color={
                        openRecordSaveActionColors?.iconColor ??
                        defaultInlineActionIconColor
                      }
                    />
                  }
                  backgroundColor={openRecordSaveActionColors?.backgroundColor}
                  textColor={openRecordSaveActionColors?.textColor}
                />
              </div>
            ) : (
              <div
                className={[
                  "flex items-center gap-2 px-4 py-3",
                  isCompactActionExperiment ? "justify-center" : "",
                ].join(" ")}
                style={{
                  paddingTop:
                    isLargeCoverExperiment || isCompactActionExperiment
                      ? 0
                      : undefined,
                }}
              >
                {isLargeCoverExperiment ? null : (
                  <div
                    className={
                      isCompactActionExperiment ? "w-[111px] shrink-0" : "min-w-0 flex-1"
                    }
                  >
                    <TUXButton
                      text={isCompactActionExperiment ? "Spotify" : "Play full song"}
                      themePreset="secondary"
                      shapePreset="capsule"
                      sizePreset="medium"
                      height={MUSIC_DETAIL_INLINE_ACTION_HEIGHT}
                      smoothRadius
                      block={!isCompactActionExperiment}
                      width={isCompactActionExperiment ? "111px" : undefined}
                      leadingIcon={
                        isCompactActionExperiment ? (
                          <SpotifyGlyph size={18} />
                        ) : (
                          <IconColorAppleMusic width={20} height={20} />
                        )
                      }
                      backgroundColor={playFullSongActionColors?.backgroundColor}
                      textColor={playFullSongActionColors?.textColor}
                    />
                  </div>
                )}
                <div
                  className={
                    isCompactActionExperiment ? "w-[111px] shrink-0" : "min-w-0 flex-1"
                  }
                >
                  <TUXButton
                    text="Save"
                    themePreset="secondary"
                    shapePreset="capsule"
                    sizePreset="medium"
                    height={MUSIC_DETAIL_INLINE_ACTION_HEIGHT}
                    smoothRadius
                    block={!isCompactActionExperiment}
                    width={isCompactActionExperiment ? "111px" : undefined}
                    leadingIcon={
                      <TUXIconBookmark
                        size={18}
                        color={
                          saveActionColors?.iconColor ?? defaultInlineActionIconColor
                        }
                      />
                    }
                    backgroundColor={saveActionColors?.backgroundColor}
                    textColor={saveActionColors?.textColor}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-px pb-24">
            {MUSIC_GRID_ITEMS.map((src, index) => (
              <div
                key={`${src}-${index}`}
                className="relative bg-tux-v2-ui-shape-neutral-4 aspect-[3/4] overflow-hidden"
              >
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  onDragStart={(event) => event.preventDefault()}
                  className="w-full h-full object-cover"
                />
                {index === 0 ? (
                  <div className="absolute top-2 left-2">
                    <TUXTag
                      text="Original"
                      themePreset="primary"
                      textSizePreset="P3"
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div
          className="absolute inset-x-0 pt-5"
          style={{
            bottom: 54,
            zIndex: 2,
            paddingLeft: MUSIC_DETAIL_BOTTOM_CTA_HORIZONTAL_PADDING_PX,
            paddingRight: MUSIC_DETAIL_BOTTOM_CTA_HORIZONTAL_PADDING_PX,
          }}
        >
          <div
            className="flex w-full items-center"
            style={{ gap: MUSIC_DETAIL_BOTTOM_CTA_GAP_PX }}
          >
            <CreationBottomCtaSlot>
              <TUXButton
                text="Add to Story"
                themePreset="secondary"
                shapePreset="capsule"
                sizePreset="medium"
                height={MUSIC_DETAIL_BOTTOM_CTA_BUTTON_HEIGHT}
                smoothRadius
                block
                leadingIcon={<MusicDetailStoryAvatar />}
                backgroundColor="UIImageOverlayWhite"
                textColor="UIImageOverlayBlack"
              />
            </CreationBottomCtaSlot>
            <CreationBottomCtaSlot>
              <TUXButton
                text="Use sound"
                themePreset="primary"
                shapePreset="capsule"
                sizePreset="medium"
                height={MUSIC_DETAIL_BOTTOM_CTA_BUTTON_HEIGHT}
                smoothRadius
                block
                leadingIcon={
                  <TUXIconVideoFill
                    size={20}
                    color={getColorCSSVar("UIShapeText1OnPrimary")}
                  />
                }
              />
            </CreationBottomCtaSlot>
          </div>
        </div>
      </section>
    </>
  );

  return (
    <>
      <style>
        {`[data-music-detail-panel-surface="true"] {
            background-color: color-mix(
              in srgb,
              var(--tux-v2-color-ui-page-flat-1) calc(var(--music-detail-expand-progress, 0) * 100%),
              var(--tux-v2-color-ui-sheet-flat-1)
            );
          }
          [data-music-detail-panel-surface="true"] [data-music-detail-blur-scrim] {
            opacity: calc(1 - var(--music-detail-expand-progress, 0));
          }${
            !hideDragHandle
              ? `
          [data-testid="music-detail-sheet"] [class*="tux-sheet__drag-handle-container"] {
              opacity: ${grabberOpacity};
              transition: opacity 200ms ease;
            }`
              : ""
          }`}
      </style>
    <TUXSheet
      {...appFrameSheetChromeProps()}
      visible={visible}
      onVisibleChange={onVisibleChange}
      root={root}
      position="bottom"
      closeOnOutsideClick
      draggable={true}
      dragHandle={hideDragHandle ? "hidden" : "auto"}
      snapHeights={[...snapHeights]}
      snapMaxHeight={
        expandedHeightPx > 0
          ? `${Math.max(0, Math.round(expandedHeightPx))}px`
          : "100%"
      }
      overlayBackgroundColor="transparent"
      sheetBackgroundColor="transparent"
      testId="music-detail-sheet"
    >
      <ThemeScope mode={panelTheme} className="flex h-full min-h-0 w-full flex-col">
        <div
          ref={panelSurfaceRef}
          data-music-detail-panel-surface="true"
          data-no-long-press="true"
          className="relative flex h-full min-h-0 w-full flex-col overflow-hidden"
          style={{
            ...sheetStyle,
            transition: isDragging ? "none" : "border-radius 360ms ease",
          }}
        >
          {isLargeCoverExperiment ? (
            <div
              aria-hidden
              className="absolute top-0 right-0 left-0 overflow-hidden pointer-events-none"
              style={{
                zIndex: 0,
                top: 0,
                height: LARGE_COVER_HERO_HEIGHT,
                opacity: largeCoverBackgroundProgress,
              }}
            >
              <img
                src={LARGE_COVER_BACKGROUND_URL}
                alt=""
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div
                className="absolute top-0 right-0 left-0 overflow-hidden"
                style={{ height: 190 }}
              >
                <LargeCoverWave />
              </div>
              <div
                className="absolute inset-x-0 bottom-0 h-20"
                style={{
                  background: `linear-gradient(to bottom, rgba(255,255,255,0), ${getColorCSSVar("UISheetFlat1")})`,
                }}
              />
            </div>
          ) : null}
          {isLargeCoverExperiment ? (
            <div
              aria-hidden
              data-music-detail-blur-scrim
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundColor: "rgba(255,255,255,0.01)",
                backdropFilter: "blur(30px)",
                WebkitBackdropFilter: "blur(30px)",
                borderTopLeftRadius: topRadius,
                borderTopRightRadius: topRadius,
                transform: "translateZ(0)",
                zIndex: 1,
              }}
            />
          ) : null}
          {panelTopBar}
          {panelBody}
        </div>
      </ThemeScope>
    </TUXSheet>
    </>
  );
}
