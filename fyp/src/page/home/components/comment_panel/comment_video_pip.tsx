import { IconXMark } from "@byted-tiktok/tux-icons";
import { getColorCSSVar } from "@byted-tiktok/tux-web";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

export type CommentPipMediaKind = "image" | "video";

export type CommentPipVideoSnapshot = {
  currentTime: number;
  muted: boolean;
};

export type CommentPipVideoBridge = {
  getVideoSnapshot: () => CommentPipVideoSnapshot | null;
  onVisibilityChange: (visible: boolean) => void;
  onCurrentTimeChange: (currentTime: number) => void;
};

export type CommentPipMedia = {
  kind: CommentPipMediaKind;
  src: string;
  poster?: string;
  videoBridge?: CommentPipVideoBridge;
};

type UseCommentPipVideoBridgeOptions = {
  mediaKind: CommentPipMediaKind;
  mediaMuted?: boolean;
  isActive: boolean;
  resetKey: string;
  hasVideoAudioActivation: boolean;
  pipVisibleRef: MutableRefObject<boolean>;
  videoRef: RefObject<HTMLVideoElement | null>;
  resumePlayback: () => void;
};

export function useCommentPipVideoBridge({
  mediaKind,
  mediaMuted: _mediaMuted,
  isActive,
  resetKey,
  hasVideoAudioActivation: _hasVideoAudioActivation,
  pipVisibleRef,
  videoRef,
  resumePlayback,
}: UseCommentPipVideoBridgeOptions): CommentPipVideoBridge | undefined {
  const playbackTimeRef = useRef(0);

  useEffect(() => {
    playbackTimeRef.current = 0;
  }, [resetKey]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || mediaKind !== "video") return;
    if (!isActive || pipVisibleRef.current) {
      if (!isActive) {
        playbackTimeRef.current = 0;
      } else if (Number.isFinite(video.currentTime)) {
        playbackTimeRef.current = video.currentTime;
      }
      video.pause();
      return;
    }
    if (Number.isFinite(playbackTimeRef.current)) {
      try {
        video.currentTime = playbackTimeRef.current;
      } catch {
        /* noop */
      }
    }
    resumePlayback();
  }, [isActive, mediaKind, pipVisibleRef, resumePlayback, videoRef]);

  const onVisibilityChange = useCallback((visible: boolean) => {
    const video = videoRef.current;
    if (!video || mediaKind !== "video") return;
    pipVisibleRef.current = visible;
    if (visible) {
      playbackTimeRef.current = Number.isFinite(video.currentTime) ? video.currentTime : 0;
      video.pause();
      return;
    }
    if (Number.isFinite(playbackTimeRef.current)) {
      try {
        video.currentTime = playbackTimeRef.current;
      } catch {
        /* noop */
      }
    }
    resumePlayback();
  }, [mediaKind, pipVisibleRef, resumePlayback, videoRef]);

  const onCurrentTimeChange = useCallback((currentTime: number) => {
    if (!Number.isFinite(currentTime)) return;
    playbackTimeRef.current = currentTime;
  }, []);

  const getVideoSnapshot = useCallback(() => {
    if (mediaKind !== "video") return null;
    const video = videoRef.current;
    const currentTime = video?.currentTime;
    const resolvedCurrentTime =
      typeof currentTime === "number" && Number.isFinite(currentTime)
        ? currentTime
        : playbackTimeRef.current;
    return {
      currentTime: resolvedCurrentTime,
      muted: true,
    };
  }, [mediaKind, videoRef]);

  return useMemo(() => {
    if (mediaKind !== "video") return undefined;
    return {
      getVideoSnapshot,
      onVisibilityChange,
      onCurrentTimeChange,
    };
  }, [getVideoSnapshot, mediaKind, onCurrentTimeChange, onVisibilityChange]);
}

type CommentVideoPiPProps = {
  visible: boolean;
  suppressed?: boolean;
  media?: CommentPipMedia | null;
  portalTarget: HTMLElement | null;
  onClose: () => void;
};

const PIP_WIDTH_PX = 84;
const PIP_BORDER_PX = 3;
const PIP_TOP_BAR_PX = 22;
const PIP_OUTER_RADIUS = 14;
const PIP_INNER_RADIUS_SIDE = Math.max(0, PIP_OUTER_RADIUS - PIP_BORDER_PX);
const PIP_INNER_W = PIP_WIDTH_PX - PIP_BORDER_PX * 2;
const PIP_INNER_H = (PIP_INNER_W * 16) / 9;
const PIP_HEIGHT_PX = PIP_INNER_H + PIP_TOP_BAR_PX + PIP_BORDER_PX;
const PIP_ANIM_MS = 260;
const PIP_EDGE_INSET_PX = 12;
const PIP_SNAP_TRANSITION = "left 220ms cubic-bezier(0.22, 1, 0.36, 1)";

export function CommentVideoPiP({
  visible,
  suppressed = false,
  media,
  portalTarget,
  onClose,
}: CommentVideoPiPProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isShown, setIsShown] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hasSyncedSnapshotRef = useRef(false);
  const dragStateRef = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const mediaSrc = media?.src;
  const mediaPoster = media?.poster;
  const videoBridge = media?.videoBridge;
  const pipIsVideo = media?.kind === "video";
  const shouldShow = visible && !suppressed;

  useEffect(() => {
    if (shouldShow) {
      setShouldRender(true);
      hasSyncedSnapshotRef.current = false;
      setIsShown(false);
      return;
    }
    setIsShown(false);
    if (visible) {
      return;
    }
    const t = window.setTimeout(() => {
      setShouldRender(false);
      setPosition(null);
    }, PIP_ANIM_MS);
    return () => window.clearTimeout(t);
  }, [shouldShow, visible]);

  useEffect(() => {
    if (!shouldShow || !shouldRender || !position || isShown) return;
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => setIsShown(true));
    });
    return () => {
      cancelAnimationFrame(r1);
      if (r2) cancelAnimationFrame(r2);
    };
  }, [shouldShow, shouldRender, position, isShown]);

  useLayoutEffect(() => {
    if (!shouldRender || position || !portalTarget) return;
    const rect = portalTarget.getBoundingClientRect();
    const x = PIP_EDGE_INSET_PX;
    const y = Math.max(
      PIP_EDGE_INSET_PX,
      Math.round(rect.height * 0.3 - PIP_HEIGHT_PX / 2),
    );
    setPosition({ x, y });
  }, [shouldRender, position, portalTarget]);

  const pushCurrentPlaybackTime = useCallback(() => {
    const currentTime = videoRef.current?.currentTime;
    if (currentTime == null || !Number.isFinite(currentTime)) return;
    videoBridge?.onCurrentTimeChange(currentTime);
  }, [videoBridge]);

  const syncVideoFromSnapshot = useCallback(() => {
    if (!pipIsVideo || hasSyncedSnapshotRef.current) return;
    const video = videoRef.current;
    const snapshot = videoBridge?.getVideoSnapshot();
    if (!video || !snapshot || video.readyState < HTMLMediaElement.HAVE_METADATA) return;
    if (Number.isFinite(snapshot.currentTime)) {
      try {
        video.currentTime = snapshot.currentTime;
      } catch {
        /* noop */
      }
    }
    video.defaultMuted = true;
    video.muted = true;
    video.volume = 0;
    hasSyncedSnapshotRef.current = true;
    const playPromise = video.play();
    playPromise?.catch(() => {
      /* noop */
    });
  }, [pipIsVideo, videoBridge]);

  useEffect(() => {
    if (!visible || !pipIsVideo) return;
    const video = videoRef.current;
    if (!video) return;
    syncVideoFromSnapshot();
  }, [pipIsVideo, syncVideoFromSnapshot, visible]);

  useEffect(() => {
    if (visible) return;
    pushCurrentPlaybackTime();
  }, [pushCurrentPlaybackTime, visible]);

  useEffect(() => {
    return () => {
      pushCurrentPlaybackTime();
    };
  }, [pushCurrentPlaybackTime]);

  if (!shouldRender || !mediaSrc || !portalTarget || !position) return null;

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if ((event.target as HTMLElement).closest("[data-pip-close]")) return;
    const element = containerRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    dragStateRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    try {
      element.setPointerCapture(event.pointerId);
    } catch {
      /* noop */
    }
    setIsDragging(true);
    event.preventDefault();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const target = portalTarget.getBoundingClientRect();
    let nextX = event.clientX - target.left - drag.offsetX;
    let nextY = event.clientY - target.top - drag.offsetY;
    nextX = Math.min(Math.max(0, nextX), Math.max(0, target.width - PIP_WIDTH_PX));
    nextY = Math.min(Math.max(0, nextY), Math.max(0, target.height - PIP_HEIGHT_PX));
    setPosition({ x: nextX, y: nextY });
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragStateRef.current = null;
    setIsDragging(false);
    try {
      containerRef.current?.releasePointerCapture(event.pointerId);
    } catch {
      /* noop */
    }
    const target = portalTarget.getBoundingClientRect();
    setPosition((previousPosition) => {
      if (!previousPosition) return previousPosition;
      const center = previousPosition.x + PIP_WIDTH_PX / 2;
      const snapToLeft = center < target.width / 2;
      const nextX = snapToLeft
        ? PIP_EDGE_INSET_PX
        : Math.max(PIP_EDGE_INSET_PX, target.width - PIP_WIDTH_PX - PIP_EDGE_INSET_PX);
      const nextY = Math.min(
        Math.max(PIP_EDGE_INSET_PX, previousPosition.y),
        Math.max(PIP_EDGE_INSET_PX, target.height - PIP_HEIGHT_PX - PIP_EDGE_INSET_PX),
      );
      return { x: nextX, y: nextY };
    });
  };

  const node = (
    <div
      data-no-long-press="true"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        width: PIP_WIDTH_PX,
        height: PIP_HEIGHT_PX,
        borderRadius: PIP_OUTER_RADIUS,
        overflow: "hidden",
        backgroundColor: getColorCSSVar("UISheetFlat1"),
        boxShadow: [
          "0 24px 48px var(--tux-v2-color-shadow-floating)",
          "0 8px 16px var(--tux-v2-color-shadow-floating)",
          "0 2px 6px var(--tux-v2-color-shadow-floating)",
        ].join(", "),
        zIndex: 3300,
        pointerEvents: shouldShow ? "auto" : "none",
        cursor: shouldShow ? (isDragging ? "grabbing" : "grab") : "default",
        touchAction: "none",
        userSelect: "none",
        WebkitTouchCallout: "none",
        filter: isShown ? "blur(0px)" : "blur(18px)",
        opacity: isShown ? 1 : 0,
        transform: isShown ? "scale(1)" : "scale(0.94)",
        transformOrigin: "center",
        transition: isDragging
          ? "none"
          : `${PIP_SNAP_TRANSITION}, top 220ms cubic-bezier(0.22, 1, 0.36, 1), filter ${PIP_ANIM_MS}ms ease, opacity ${PIP_ANIM_MS}ms ease, transform ${PIP_ANIM_MS}ms ease`,
        willChange: "filter, opacity, transform, left, top",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        paddingTop: PIP_TOP_BAR_PX,
        paddingLeft: PIP_BORDER_PX,
        paddingRight: PIP_BORDER_PX,
        paddingBottom: PIP_BORDER_PX,
      }}
    >
      <button
        type="button"
        data-pip-close="true"
        aria-label="Close picture-in-picture"
        onClick={onClose}
        onPointerDown={(event) => event.stopPropagation()}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: PIP_TOP_BAR_PX + PIP_BORDER_PX,
          height: PIP_TOP_BAR_PX,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "none",
          padding: 0,
          color: getColorCSSVar("UIText1"),
          cursor: "pointer",
        }}
      >
        <IconXMark width={16} height={16} />
      </button>
      <div
        style={{
          width: PIP_INNER_W,
          height: PIP_INNER_H,
          borderRadius: PIP_INNER_RADIUS_SIDE,
          overflow: "hidden",
          backgroundColor: getColorCSSVar("UIShapeNeutral4"),
        }}
      >
        {pipIsVideo ? (
          <video
            ref={videoRef}
            poster={mediaPoster}
            aria-hidden="true"
            muted
            loop
            playsInline
            preload="auto"
            onLoadedMetadata={syncVideoFromSnapshot}
            onCanPlay={syncVideoFromSnapshot}
            onTimeUpdate={pushCurrentPlaybackTime}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              pointerEvents: "none",
            }}
          >
            <source src={mediaSrc} type="video/mp4" />
          </video>
        ) : (
          <img
            src={mediaSrc}
            alt=""
            aria-hidden="true"
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </div>
  );

  return createPortal(node, portalTarget);
}
