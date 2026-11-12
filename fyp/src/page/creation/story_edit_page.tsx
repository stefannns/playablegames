import {
  TUXIconChevronDownFill,
  TUXIconChevronLeftLTR,
  TUXIconColorAiAliveTag,
  TUXIconColorArrowTurnUpRight,
  TUXIconColorCrop,
  TUXIconColorFilter,
  TUXIconColorGear,
  TUXIconColorLivePhotoAiGradient,
  TUXIconColorMusic,
  TUXIconSticker,
  TUXIconTextLatin,
} from "@byted-tiktok/tux-icons";
import { TUXText } from "@byted-tiktok/tux-web";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";

import { useAppFrame } from "../../components/sys/app_frame";
import { closeStoryEdit, publishStoryToInbox, useAddToStoryStore, type EditLaunchFrom } from "./add_to_story_store";
import {
  ALBUM_THUMBNAIL_ZOOM_IN_DURATION_MS,
  ALBUM_THUMBNAIL_ZOOM_IN_EASE,
  ALBUM_THUMBNAIL_ZOOM_OUT_DURATION_MS,
  ALBUM_THUMBNAIL_ZOOM_OUT_EASE,
  type AlbumLaunchMotion,
  refreshAlbumThumbnailRect,
  syncEnterLayerMotion,
  syncExitCanvasMotion,
} from "./album_thumbnail_launch_motion";
import { StoryUserAvatarPhoto } from "./story_user_avatar_photo";
import {
  IMMERSIVE_OVERLAY_TEXT,
  IMMERSIVE_SURFACE_BLACK,
} from "./immersive_chrome.constants";

/** Fade-out when leaving the editor back to the live camera viewfinder. */
const CAMERA_EXIT_FADE_MS = 160;
const STORY_ALBUM_THUMBNAIL_SRC_ATTR = "data-story-album-src";
const TOOL_SIDEBAR_EXPAND_MS = 280;
const TOOL_SIDEBAR_COLLAPSE_MS = 150;
const TOOL_SIDEBAR_EASE = "cubic-bezier(0.16, 0.5, 0.3, 1)";
const TOOL_ROW_HEIGHT_PX = 52;
const CHEVRON_TOGGLE_OFFSET_Y = 8;
/** Wide enough for labels + icon column so clip-path does not crop text. */
const TOOL_SIDEBAR_CLIP_WIDTH_PX = 220;
const TOOL_ICON_SIZE_PX = 28;
const TOOL_BUTTON_WIDTH_PX = 56;
const TOOL_ICON_INSET_PX = (TOOL_BUTTON_WIDTH_PX - TOOL_ICON_SIZE_PX) / 2;
/** 28px icon is centered in the 56px hit target — anchor labels to the icon edge. */
const TOOL_ICON_LEFT_FROM_RIGHT_PX = TOOL_BUTTON_WIDTH_PX - TOOL_ICON_INSET_PX;
const TOOL_LABEL_ICON_GAP_PX = 12;

type ChevronMotion = "expand" | "collapse" | null;

/** Keeps tool glyphs and labels legible over arbitrary photo content. */
const TOOL_SHADOW = "drop-shadow(0 1px 3px rgba(0, 0, 0, 0.45))";
const LABEL_SHADOW = "0px 1px 1px rgba(0, 0, 0, 0.4)";

type SideTool = { key: string; label: string; icon: ReactNode };

/** Always-visible tools (icons only when collapsed; labeled when expanded). */
const BASE_TOOLS: SideTool[] = [
  { key: "settings", label: "Settings", icon: <TUXIconColorGear size={28} /> },
  { key: "text", label: "Text", icon: <TUXIconTextLatin size={28} /> },
  { key: "stickers", label: "Stickers", icon: <TUXIconSticker size={28} /> },
  { key: "sounds", label: "Sounds", icon: <TUXIconColorMusic size={28} /> },
  { key: "filters", label: "Filters", icon: <TUXIconColorFilter size={28} /> },
];

/** Extra tools revealed only when the sidebar is expanded (Figma 2625:45594). */
const EXTRA_TOOLS: SideTool[] = [
  { key: "crop", label: "Crop", icon: <TUXIconColorCrop size={28} /> },
  {
    key: "ai-alive",
    label: "AI Alive",
    icon: (
      <span className="relative inline-flex">
        <TUXIconColorLivePhotoAiGradient size={28} />
        <span className="absolute -bottom-1.5 -right-1.5 inline-flex">
          <TUXIconColorAiAliveTag size={16} />
        </span>
      </span>
    ),
  },
  { key: "share", label: "Share", icon: <TUXIconColorArrowTurnUpRight size={28} /> },
];

function toolLabelRevealStyle(showLabel: boolean): CSSProperties {
  const durationMs = showLabel ? TOOL_SIDEBAR_EXPAND_MS : TOOL_SIDEBAR_COLLAPSE_MS;

  return {
    opacity: showLabel ? 1 : 0,
    transition: `opacity ${durationMs}ms ${TOOL_SIDEBAR_EASE}`,
  };
}

function extraToolsRevealStyle(expanded: boolean, closing: boolean): CSSProperties {
  /** Clipped from bottom — expand reveals top-down; collapse hides bottom-up (reverse). */
  const hiddenClip = "inset(0 0 100% 0)";
  const open = expanded || closing;
  const durationMs = expanded ? TOOL_SIDEBAR_EXPAND_MS : TOOL_SIDEBAR_COLLAPSE_MS;
  const clipTransition = `clip-path ${durationMs}ms ${TOOL_SIDEBAR_EASE}, -webkit-clip-path ${durationMs}ms ${TOOL_SIDEBAR_EASE}`;
  const heightTransition = `max-height ${TOOL_SIDEBAR_COLLAPSE_MS}ms ${TOOL_SIDEBAR_EASE}`;

  return {
    width: TOOL_SIDEBAR_CLIP_WIDTH_PX,
    maxHeight: open ? EXTRA_TOOLS.length * TOOL_ROW_HEIGHT_PX : 0,
    clipPath: expanded ? "inset(0 0 0 0)" : hiddenClip,
    WebkitClipPath: expanded ? "inset(0 0 0 0)" : hiddenClip,
    pointerEvents: expanded ? "auto" : "none",
    transition: expanded || closing ? clipTransition : `${heightTransition}, ${clipTransition}`,
  };
}

function chevronToggleStyle(expanded: boolean, motion: ChevronMotion): CSSProperties {
  const base: CSSProperties = {
    display: "inline-flex",
    height: 28,
    width: 28,
    alignItems: "center",
    justifyContent: "center",
    transformOrigin: "center",
    backfaceVisibility: "hidden",
    willChange: motion ? "rotate, translate" : undefined,
  };

  if (motion === "expand") {
    return {
      ...base,
      animation: [
        `story-tool-chevron-rotate-expand ${TOOL_SIDEBAR_EXPAND_MS}ms ${TOOL_SIDEBAR_EASE} forwards`,
        `story-tool-chevron-translate-expand ${TOOL_SIDEBAR_EXPAND_MS}ms ${TOOL_SIDEBAR_EASE} forwards`,
      ].join(", "),
    };
  }

  if (motion === "collapse") {
    return {
      ...base,
      animation: [
        `story-tool-chevron-rotate-collapse ${TOOL_SIDEBAR_COLLAPSE_MS}ms ${TOOL_SIDEBAR_EASE} forwards`,
        `story-tool-chevron-translate-collapse ${TOOL_SIDEBAR_COLLAPSE_MS}ms ${TOOL_SIDEBAR_EASE} forwards`,
      ].join(", "),
    };
  }

  return {
    ...base,
    rotate: expanded ? "180deg" : "0deg",
    translate: "0 0",
  };
}

function renderSideToolButton(tool: SideTool, showLabel: boolean) {
  const label = (
    <span style={{ textShadow: LABEL_SHADOW, whiteSpace: "nowrap" }}>
      <TUXText typographyPreset="P1-Semibold" color="UIImageOverlayWhite">
        {tool.label}
      </TUXText>
    </span>
  );

  return (
    <button
      key={tool.key}
      type="button"
      aria-label={tool.label}
      className="relative h-13 w-14 shrink-0 outline-none"
    >
      <span
        className="pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap"
        style={{
          right: TOOL_ICON_LEFT_FROM_RIGHT_PX,
          paddingRight: TOOL_LABEL_ICON_GAP_PX,
          ...toolLabelRevealStyle(showLabel),
        }}
        aria-hidden={!showLabel}
      >
        {label}
      </span>
      <span
        className="flex h-13 w-14 items-center justify-center"
        style={{ color: IMMERSIVE_OVERLAY_TEXT, filter: TOOL_SHADOW }}
      >
        {tool.icon}
      </span>
    </button>
  );
}

function renderExtraToolIcon(tool: SideTool) {
  return (
    <button
      key={tool.key}
      type="button"
      aria-label={tool.label}
      className="flex h-13 w-14 shrink-0 items-center justify-center outline-none"
      style={{ color: IMMERSIVE_OVERLAY_TEXT, filter: TOOL_SHADOW }}
    >
      {tool.icon}
    </button>
  );
}

function renderExtraToolLabels(expanded: boolean) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden={!expanded}
    >
      {EXTRA_TOOLS.map((tool, index) => (
        <span
          key={tool.key}
          className="absolute -translate-y-1/2 whitespace-nowrap"
          style={{
            top: index * TOOL_ROW_HEIGHT_PX + TOOL_ROW_HEIGHT_PX / 2,
            right: TOOL_ICON_LEFT_FROM_RIGHT_PX,
            paddingRight: TOOL_LABEL_ICON_GAP_PX,
            ...toolLabelRevealStyle(expanded),
          }}
        >
          <span style={{ textShadow: LABEL_SHADOW }}>
            <TUXText typographyPreset="P1-Semibold" color="UIImageOverlayWhite">
              {tool.label}
            </TUXText>
          </span>
        </span>
      ))}
    </div>
  );
}

/**
 * Canvas geometry per Figma node 2624:40935 (frame 390×844): the photo card
 * spans y52→746, so its bottom edge sits at 746/844 of the frame height and it
 * leaves an 11.6% black footer below for the upload button.
 */
const CANVAS_BOTTOM_PCT = (746 / 844) * 100;
const CANVAS_FOOTER_PCT = 100 - CANVAS_BOTTOM_PCT;
/** Canvas image corner radius — Figma uses a literal 20px (no exact TUX token). */
const CANVAS_RADIUS = 20;

/**
 * Story-ring gradient — 45° top-left → bottom-right across the Social Story
 * green tokens (Gradient Green 1 → 2 → 3).
 */
const STORY_RING_STOPS = [
  { offset: "0%", color: "var(--tux-v2-color-social-story-gradient-green-1)" },
  { offset: "50%", color: "var(--tux-v2-color-social-story-gradient-green-2)" },
  { offset: "100%", color: "var(--tux-v2-color-social-story-gradient-green-3)" },
];

/**
 * 24px avatar wrapped by a 32px SVG story ring, per Figma node 2624:41248.
 * Uses the same identity asset as the inbox "Create" entry so it reads as the
 * same person.
 */
function StoryUploadAvatar() {
  return (
    <span className="relative inline-flex h-6 w-6 flex-none items-center justify-center">
      <svg
        aria-hidden
        width={32}
        height={32}
        viewBox="0 0 32 32"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <defs>
          {/* objectBoundingBox 0,0 → 1,1 gives the 45° diagonal fitted to the ring */}
          <linearGradient id="story-upload-ring" x1="0" y1="0" x2="1" y2="1">
            {STORY_RING_STOPS.map((stop) => (
              <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
            ))}
          </linearGradient>
        </defs>
        <circle
          cx={16}
          cy={16}
          r={15}
          fill="none"
          stroke="url(#story-upload-ring)"
          strokeWidth={2}
        />
      </svg>
      <div className="relative h-6 w-6 overflow-hidden rounded-full">
        <StoryUserAvatarPhoto alt="Your avatar" />
      </div>
    </span>
  );
}

function StoryEditContent({
  src,
  canvasRef,
  hideChrome,
  canvasAlbumMotion,
}: {
  src: string;
  canvasRef: RefObject<HTMLDivElement | null>;
  hideChrome: boolean;
  canvasAlbumMotion?: {
    entered: boolean;
    collapsed: string;
    expanded: string;
    originX: number;
    originY: number;
    duration: number;
    ease: string;
  };
}) {
  const { topInsetCss } = useAppFrame();
  const { postLanding } = useAddToStoryStore();
  const [expanded, setExpanded] = useState(false);
  const [extraToolsClosing, setExtraToolsClosing] = useState(false);
  const [chevronMotion, setChevronMotion] = useState<ChevronMotion>(null);
  const isPosting = Boolean(postLanding);

  const handleToggleExpanded = useCallback(() => {
    setExpanded((value) => {
      if (value) {
        setExtraToolsClosing(true);
        setChevronMotion("collapse");
        return false;
      }
      setExtraToolsClosing(false);
      setChevronMotion("expand");
      return true;
    });
  }, []);

  const handleChevronAnimationEnd = useCallback((event: React.AnimationEvent<HTMLSpanElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (!event.animationName.startsWith("story-tool-chevron-rotate")) {
      return;
    }
    setChevronMotion(null);
  }, []);

  const extraToolsOpen = expanded || extraToolsClosing;

  const handleExtraToolsTransitionEnd = useCallback((event: React.TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (event.propertyName !== "clip-path" && event.propertyName !== "-webkit-clip-path") {
      return;
    }
    setExtraToolsClosing((closing) => {
      if (!closing) {
        return closing;
      }
      return false;
    });
  }, []);

  const handlePublish = () => {
    const canvas = canvasRef.current;
    if (!canvas || isPosting) {
      return;
    }
    publishStoryToInbox({
      fromRect: canvas.getBoundingClientRect(),
    });
  };

  return (
    <div
      className="relative h-full min-h-0 w-full overflow-hidden"
      style={{ backgroundColor: hideChrome ? "transparent" : IMMERSIVE_SURFACE_BLACK }}
    >
      <div
        ref={canvasRef as React.Ref<HTMLDivElement>}
        className="absolute inset-x-0 overflow-hidden"
        style={{
          top: topInsetCss,
          bottom: `${CANVAS_FOOTER_PCT}%`,
          borderRadius: CANVAS_RADIUS,
          visibility: isPosting ? "hidden" : "visible",
          ...(canvasAlbumMotion
            ? {
                transform: canvasAlbumMotion.entered
                  ? canvasAlbumMotion.expanded
                  : canvasAlbumMotion.collapsed,
                transformOrigin: `${canvasAlbumMotion.originX}px ${canvasAlbumMotion.originY}px`,
                transition: `transform ${canvasAlbumMotion.duration}ms ${canvasAlbumMotion.ease}`,
                willChange: "transform",
              }
            : undefined),
        }}
      >
        <img
          alt=""
          src={src}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      </div>

      {!hideChrome ? (
        <div className="absolute inset-0 z-20">
          {/* Back / Close */}
          <button
            type="button"
            aria-label="Back"
            onClick={closeStoryEdit}
            disabled={isPosting}
            className="absolute left-1.5 flex h-11 w-11 items-center justify-center outline-none"
            style={{
              top: `calc(${topInsetCss} + 6px)`,
              color: IMMERSIVE_OVERLAY_TEXT,
              filter: TOOL_SHADOW,
            }}
          >
            <TUXIconChevronLeftLTR size={28} />
          </button>

          {/* Right tool sidebar — collapses to icons, expands to labeled tools */}
          <style>
            {`
              @keyframes story-tool-chevron-rotate-expand {
                from {
                  rotate: 0deg;
                }
                to {
                  rotate: 180deg;
                }
              }
              @keyframes story-tool-chevron-translate-expand {
                0% {
                  translate: 0 0;
                }
                50% {
                  translate: 0 ${CHEVRON_TOGGLE_OFFSET_Y}px;
                }
                100% {
                  translate: 0 0;
                }
              }
              @keyframes story-tool-chevron-rotate-collapse {
                from {
                  rotate: 180deg;
                }
                to {
                  rotate: 0deg;
                }
              }
              @keyframes story-tool-chevron-translate-collapse {
                0% {
                  translate: 0 0;
                }
                50% {
                  translate: 0 ${CHEVRON_TOGGLE_OFFSET_Y}px;
                }
                100% {
                  translate: 0 0;
                }
              }
            `}
          </style>
          <div
            className="absolute right-0 flex flex-col items-end overflow-visible"
            style={{ top: `calc(${topInsetCss} + 6px)` }}
          >
            {BASE_TOOLS.map((tool) => renderSideToolButton(tool, expanded))}

            <div
              className="relative self-end overflow-visible"
              style={{
                width: TOOL_SIDEBAR_CLIP_WIDTH_PX,
                height: extraToolsOpen ? EXTRA_TOOLS.length * TOOL_ROW_HEIGHT_PX : 0,
                transition:
                  expanded || extraToolsClosing
                    ? undefined
                    : `height ${TOOL_SIDEBAR_COLLAPSE_MS}ms ${TOOL_SIDEBAR_EASE}`,
              }}
            >
              {renderExtraToolLabels(expanded)}
              <div
                className="relative flex flex-col items-end overflow-visible"
                style={extraToolsRevealStyle(expanded, extraToolsClosing)}
                onTransitionEnd={handleExtraToolsTransitionEnd}
              >
                {EXTRA_TOOLS.map((tool) => renderExtraToolIcon(tool))}
              </div>
            </div>

            {/* Expand / collapse toggle */}
            <button
              type="button"
              aria-label={expanded ? "Show fewer tools" : "Show more tools"}
              aria-expanded={expanded}
              onClick={handleToggleExpanded}
              className="flex h-13 w-14 shrink-0 items-center justify-center outline-none"
              style={{ color: IMMERSIVE_OVERLAY_TEXT }}
            >
              <span
                style={{ filter: TOOL_SHADOW, ...chevronToggleStyle(expanded, chevronMotion) }}
                onAnimationEnd={handleChevronAnimationEnd}
              >
                <TUXIconChevronDownFill size={28} />
              </span>
            </button>
          </div>

          {/* "Your Story" upload button — sits 16px below the canvas (Figma y762) */}
          <div
            className="absolute inset-x-0 px-3"
            style={{ top: `calc(${CANVAS_BOTTOM_PCT}% + 16px)` }}
          >
            <button
              type="button"
              aria-label="Post to your story"
              onClick={handlePublish}
              disabled={isPosting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full outline-none transition-transform active:scale-98 disabled:pointer-events-none"
              style={{ backgroundColor: IMMERSIVE_OVERLAY_TEXT }}
            >
              <StoryUploadAvatar />
              <TUXText typographyPreset="Headline-Semibold" color="UIImageOverlayBlack">
                Your Story
              </TUXText>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Editor layer rendered on top of the album. Zooms in when {@link image} is set
 * and zooms back out on close, keeping the album list mounted underneath.
 */
export default function StoryEditLayer({ image }: { image: string | null }) {
  const { isOpen, postLanding, editReturnTo, editLaunchFrom } = useAddToStoryStore();
  const [mountedSrc, setMountedSrc] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [launchMotion, setLaunchMotion] = useState<AlbumLaunchMotion | null>(null);
  const [motionPhase, setMotionPhase] = useState<"in" | "out">("in");
  const [enterSettled, setEnterSettled] = useState(false);
  const fromCameraRef = useRef(false);
  const launchFromRef = useRef<EditLaunchFrom | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const exitTimerRef = useRef<number | null>(null);
  const enterSettleTimerRef = useRef<number | null>(null);

  const displaySrc = image ?? mountedSrc;

  useLayoutEffect(() => {
    if (exitTimerRef.current != null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    if (enterSettleTimerRef.current != null) {
      window.clearTimeout(enterSettleTimerRef.current);
      enterSettleTimerRef.current = null;
    }

    if (image) {
      const fromCamera = editReturnTo?.cameraOpen ?? false;
      fromCameraRef.current = fromCamera;
      setMountedSrc(image);
      setFadeOut(false);
      if (fromCamera && !editLaunchFrom) {
        launchFromRef.current = null;
        setLaunchMotion(null);
        setEnterSettled(true);
        setEntered(true);
        return undefined;
      }
      if (editLaunchFrom) {
        launchFromRef.current = editLaunchFrom;
      }
      const launchFrom = editLaunchFrom ?? launchFromRef.current;
      setLaunchMotion(syncEnterLayerMotion(layerRef.current, canvasRef.current, launchFrom));
      setMotionPhase("in");
      setEnterSettled(false);
      setEntered(false);

      let inner = 0;
      const outer = window.requestAnimationFrame(() => {
        setLaunchMotion(
          syncEnterLayerMotion(layerRef.current, canvasRef.current, launchFromRef.current),
        );
        inner = window.requestAnimationFrame(() => {
          layerRef.current?.offsetHeight;
          setEntered(true);
        });
      });
      enterSettleTimerRef.current = window.setTimeout(() => {
        setEnterSettled(true);
        enterSettleTimerRef.current = null;
      }, ALBUM_THUMBNAIL_ZOOM_IN_DURATION_MS);
      return () => {
        window.cancelAnimationFrame(outer);
        window.cancelAnimationFrame(inner);
        if (enterSettleTimerRef.current != null) {
          window.clearTimeout(enterSettleTimerRef.current);
          enterSettleTimerRef.current = null;
        }
      };
    }

    return undefined;
  }, [editLaunchFrom, editReturnTo?.cameraOpen, image]);

  useLayoutEffect(() => {
    if (image || !mountedSrc || postLanding) {
      return undefined;
    }

    if (!isOpen) {
      setMountedSrc(null);
      setFadeOut(false);
      setEntered(false);
      setEnterSettled(false);
      fromCameraRef.current = false;
      return undefined;
    }

    if (fromCameraRef.current && !launchFromRef.current) {
      setFadeOut(true);
      exitTimerRef.current = window.setTimeout(() => {
        setMountedSrc(null);
        setFadeOut(false);
        setEntered(false);
        fromCameraRef.current = false;
        exitTimerRef.current = null;
      }, CAMERA_EXIT_FADE_MS);
      return () => {
        if (exitTimerRef.current != null) {
          window.clearTimeout(exitTimerRef.current);
          exitTimerRef.current = null;
        }
      };
    }

    const refreshed = refreshAlbumThumbnailRect(
      mountedSrc,
      launchFromRef.current,
      STORY_ALBUM_THUMBNAIL_SRC_ATTR,
    );
    if (refreshed) {
      launchFromRef.current = refreshed;
    }
    setLaunchMotion(syncExitCanvasMotion(canvasRef.current, launchFromRef.current));
    setMotionPhase("out");
    setEnterSettled(true);

    let inner = 0;
    const outer = window.requestAnimationFrame(() => {
      setLaunchMotion(syncExitCanvasMotion(canvasRef.current, launchFromRef.current));
      inner = window.requestAnimationFrame(() => {
        canvasRef.current?.offsetHeight;
        setEntered(false);
      });
    });
    exitTimerRef.current = window.setTimeout(() => {
      setMountedSrc(null);
      setFadeOut(false);
      exitTimerRef.current = null;
    }, ALBUM_THUMBNAIL_ZOOM_OUT_DURATION_MS);
    return () => {
      window.cancelAnimationFrame(outer);
      window.cancelAnimationFrame(inner);
      if (exitTimerRef.current != null) {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };
  }, [image, isOpen, mountedSrc, postLanding]);

  useEffect(
    () => () => {
      if (exitTimerRef.current != null) {
        window.clearTimeout(exitTimerRef.current);
      }
      if (enterSettleTimerRef.current != null) {
        window.clearTimeout(enterSettleTimerRef.current);
      }
    },
    [],
  );

  if (!displaySrc) {
    return null;
  }

  const isPostExit = Boolean(postLanding);
  if (isPostExit) {
    return null;
  }

  const hasThumbnailLaunch = Boolean(editLaunchFrom ?? launchFromRef.current);
  const fromCameraCaptureFade =
    (image ? (editReturnTo?.cameraOpen ?? false) : fromCameraRef.current) &&
    !hasThumbnailLaunch &&
    !isPostExit;
  const albumMotionActive = !fromCameraCaptureFade && !isPostExit;
  const isAlbumEnter = albumMotionActive && motionPhase === "in";
  const isAlbumExit = albumMotionActive && motionPhase === "out";
  const layerMotionActive = Boolean(launchMotion) && isAlbumEnter && !enterSettled;
  const canvasMotionActive = Boolean(launchMotion) && isAlbumExit;

  return (
    <div
      ref={layerRef}
      className="absolute inset-0 z-110"
      style={{
        transform: layerMotionActive
          ? entered
            ? launchMotion!.expanded
            : launchMotion!.collapsed
          : undefined,
        transformOrigin: layerMotionActive
          ? `${launchMotion!.originX}px ${launchMotion!.originY}px`
          : undefined,
        transition: fromCameraCaptureFade && fadeOut
            ? `opacity ${CAMERA_EXIT_FADE_MS}ms ease-out`
            : layerMotionActive
              ? `transform ${ALBUM_THUMBNAIL_ZOOM_IN_DURATION_MS}ms ${ALBUM_THUMBNAIL_ZOOM_IN_EASE}`
              : undefined,
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? "none" : undefined,
        willChange: fadeOut ? "opacity" : layerMotionActive ? "transform" : undefined,
      }}
    >
      <StoryEditContent
        src={displaySrc}
        canvasRef={canvasRef}
        hideChrome={isAlbumExit}
        canvasAlbumMotion={
          canvasMotionActive && launchMotion
            ? {
                entered,
                collapsed: launchMotion.collapsed,
                expanded: launchMotion.expanded,
                originX: launchMotion.originX,
                originY: launchMotion.originY,
                duration: ALBUM_THUMBNAIL_ZOOM_OUT_DURATION_MS,
                ease: ALBUM_THUMBNAIL_ZOOM_OUT_EASE,
              }
            : undefined
        }
      />
    </div>
  );
}
