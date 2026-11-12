import { motion, useReducedMotion, type Transition } from "framer-motion";
import { useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";

import {
  computeAspectFillLayout,
  computeAspectFitLayout,
  computeThumbnailCoverInCanvas,
  type PhotoBoxLayout,
} from "../album_preview_photo_layout";
import {
  ALBUM_THUMBNAIL_ZOOM_IN_DURATION_MS,
  ALBUM_THUMBNAIL_ZOOM_IN_MOTION_EASE,
  type AlbumThumbnailLaunchFrom,
} from "../album_thumbnail_launch_motion";

type NaturalSize = { width: number; height: number };
type CanvasSize = { width: number; height: number };

type AlbumPreviewPhotoMotionProps = {
  src: string;
  visible: boolean;
  canvasRef: RefObject<HTMLDivElement | null>;
  launchFrom: AlbumThumbnailLaunchFrom | null;
  previewEnterAnimating: boolean;
  photoLayoutExpanded: boolean;
  /** Exit shrink — aspect-fill inside the transforming canvas. */
  exitCoverInCanvas: boolean;
};

function layoutToMotionTarget(layout: PhotoBoxLayout) {
  return {
    left: layout.left,
    top: layout.top,
    width: layout.width,
    height: layout.height,
  };
}

function resolvePhotoLayouts(args: {
  naturalSize: NaturalSize;
  canvasSize: CanvasSize;
  canvasViewport: DOMRectReadOnly;
  launchFrom: AlbumThumbnailLaunchFrom | null;
  previewEnterAnimating: boolean;
  photoLayoutExpanded: boolean;
  exitCoverInCanvas: boolean;
}) {
  const { naturalSize, canvasSize, canvasViewport, launchFrom } = args;
  const fit = computeAspectFitLayout(
    naturalSize.width,
    naturalSize.height,
    canvasSize.width,
    canvasSize.height,
  );
  const exitCover = computeAspectFillLayout(
    naturalSize.width,
    naturalSize.height,
    canvasSize.width,
    canvasSize.height,
  );
  const thumb =
    launchFrom !== null
      ? computeThumbnailCoverInCanvas(
          naturalSize.width,
          naturalSize.height,
          canvasSize.width,
          canvasSize.height,
          launchFrom,
          canvasViewport,
        )
      : fit;

  let target = fit;
  if (args.exitCoverInCanvas) {
    target = exitCover;
  } else if (args.previewEnterAnimating && !args.photoLayoutExpanded) {
    target = thumb;
  }

  return { thumb, fit, target };
}

export function AlbumPreviewPhotoMotion({
  src,
  visible,
  canvasRef,
  launchFrom,
  previewEnterAnimating,
  photoLayoutExpanded,
  exitCoverInCanvas,
}: AlbumPreviewPhotoMotionProps) {
  const reduceMotion = useReducedMotion();
  const photoRef = useRef<HTMLImageElement>(null);
  const [naturalSize, setNaturalSize] = useState<NaturalSize | null>(null);
  const [canvasSize, setCanvasSize] = useState<CanvasSize | null>(null);
  const [viewportRevision, setViewportRevision] = useState(0);

  useLayoutEffect(() => {
    setNaturalSize(null);
  }, [src]);

  useLayoutEffect(() => {
    const img = photoRef.current;
    if (!img?.complete || img.naturalWidth <= 0 || img.naturalHeight <= 0) {
      return;
    }
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
  }, [src, visible]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const syncCanvas = () => {
      setCanvasSize({ width: canvas.clientWidth, height: canvas.clientHeight });
      setViewportRevision((value) => value + 1);
    };

    syncCanvas();
    const observer = new ResizeObserver(syncCanvas);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [canvasRef, src, previewEnterAnimating]);

  const layouts = useMemo(() => {
    if (!naturalSize || !canvasSize || canvasSize.width <= 0 || canvasSize.height <= 0) {
      return null;
    }
    const viewport = canvasRef.current?.getBoundingClientRect();
    if (!viewport) return null;

    return resolvePhotoLayouts({
      naturalSize,
      canvasSize,
      canvasViewport: viewport,
      launchFrom,
      previewEnterAnimating,
      photoLayoutExpanded,
      exitCoverInCanvas,
    });
  }, [
    canvasRef,
    canvasSize,
    exitCoverInCanvas,
    launchFrom,
    naturalSize,
    photoLayoutExpanded,
    previewEnterAnimating,
    viewportRevision,
  ]);

  const layoutTransition: Transition = useMemo(() => {
    if (reduceMotion) {
      return { duration: 0 };
    }
    // Animate thumb→fit on enter, and any later canvas resize (e.g. selection thumb strip).
    const shouldAnimateLayout =
      !exitCoverInCanvas && !(previewEnterAnimating && !photoLayoutExpanded);
    if (!shouldAnimateLayout) {
      return { duration: 0 };
    }
    return {
      duration: ALBUM_THUMBNAIL_ZOOM_IN_DURATION_MS / 1000,
      ease: ALBUM_THUMBNAIL_ZOOM_IN_MOTION_EASE,
    };
  }, [exitCoverInCanvas, photoLayoutExpanded, previewEnterAnimating, reduceMotion]);

  if (!layouts) {
    return (
      <img
        ref={photoRef}
        src={src}
        alt=""
        draggable={false}
        className="invisible absolute max-w-none pointer-events-none"
        onLoad={(event) => {
          const { naturalWidth, naturalHeight } = event.currentTarget;
          if (naturalWidth > 0 && naturalHeight > 0) {
            setNaturalSize({ width: naturalWidth, height: naturalHeight });
          }
        }}
      />
    );
  }

  const initial =
    previewEnterAnimating && launchFrom && !photoLayoutExpanded
      ? layoutToMotionTarget(layouts.thumb)
      : false;

  return (
    <motion.img
      ref={photoRef}
      src={src}
      alt=""
      draggable={false}
      className="absolute max-w-none pointer-events-none"
      initial={initial}
      animate={{
        ...layoutToMotionTarget(layouts.target),
        opacity: visible ? 1 : 0,
      }}
      transition={{
        left: layoutTransition,
        top: layoutTransition,
        width: layoutTransition,
        height: layoutTransition,
        opacity: { duration: 0 },
      }}
      onLoad={(event) => {
        const { naturalWidth, naturalHeight } = event.currentTarget;
        if (naturalWidth > 0 && naturalHeight > 0) {
          setNaturalSize({ width: naturalWidth, height: naturalHeight });
        }
      }}
    />
  );
}
