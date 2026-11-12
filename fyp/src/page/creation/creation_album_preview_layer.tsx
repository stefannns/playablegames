import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { ThemeScope } from "../../context/theme";
import {
  ALBUM_THUMBNAIL_ZOOM_IN_DURATION_MS,
  ALBUM_THUMBNAIL_ZOOM_IN_EASE,
  ALBUM_THUMBNAIL_ZOOM_OUT_DURATION_MS,
  ALBUM_THUMBNAIL_ZOOM_OUT_EASE,
  type AlbumLaunchMotion,
  type AlbumThumbnailLaunchFrom,
  refreshAlbumThumbnailRect,
  syncExitCanvasMotion,
} from "./album_thumbnail_launch_motion";

export const CREATION_ALBUM_THUMBNAIL_SRC_ATTR = "data-creation-album-src";
/** Grid cell only — excludes selected-strip thumbs when re-measuring on exit. */
export const CREATION_ALBUM_GRID_TILE_ATTR = "data-creation-album-grid-tile";

export type AlbumPreviewCanvasMotion = {
  entered: boolean;
  /** True only while CSS should interpolate transform (avoids settle snap). */
  motionAnimating: boolean;
  collapsed: string;
  expanded: string;
  originX: number;
  originY: number;
  duration: number;
  ease: string;
};

type CreationAlbumPreviewLayerProps = {
  /** Active preview media src — null starts the zoom-out exit. */
  activeSrc: string | null;
  launchFrom: AlbumThumbnailLaunchFrom | null;
  children: (args: {
    displaySrc: string;
    canvasRef: RefObject<HTMLDivElement | null>;
    previewChromeVisible: boolean;
    previewChromeOpacity: number;
    previewBackdropOpacity: number;
    previewFadeDurationMs: number;
    photoVisible: boolean;
    /** Enter zoom — JS layout animates thumbnail cover → aspect fit. */
    previewEnterAnimating: boolean;
    photoLayoutExpanded: boolean;
    canvasAlbumMotion?: AlbumPreviewCanvasMotion;
  }) => ReactNode;
};

/**
 * Album preview — enter: photo canvas zooms from thumbnail; nav / backdrop / footer
 * fade in. Exit: canvas shrinks back to the grid tile.
 */
export function CreationAlbumPreviewLayer({
  activeSrc,
  launchFrom,
  children,
}: CreationAlbumPreviewLayerProps) {
  const [mountedSrc, setMountedSrc] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);
  const [motionReady, setMotionReady] = useState(false);
  const [launchMotion, setLaunchMotion] = useState<AlbumLaunchMotion | null>(null);
  const [motionPhase, setMotionPhase] = useState<"in" | "out">("in");
  const [enterSettled, setEnterSettled] = useState(false);
  const launchFromRef = useRef<AlbumThumbnailLaunchFrom | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const exitTimerRef = useRef<number | null>(null);
  const enterSettleTimerRef = useRef<number | null>(null);
  /** Last active src while preview is open — null only when fully closed. */
  const openPreviewSrcRef = useRef<string | null>(null);

  const displaySrc = activeSrc ?? mountedSrc;

  useLayoutEffect(() => {
    if (exitTimerRef.current != null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    if (enterSettleTimerRef.current != null) {
      window.clearTimeout(enterSettleTimerRef.current);
      enterSettleTimerRef.current = null;
    }

    if (activeSrc) {
      const isNewOpen = openPreviewSrcRef.current === null;
      openPreviewSrcRef.current = activeSrc;
      setMountedSrc(activeSrc);

      if (!isNewOpen) {
        return undefined;
      }

      if (launchFrom) {
        launchFromRef.current = launchFrom;
      }

      setLaunchMotion(null);
      setMotionPhase("in");
      setEnterSettled(false);
      setEntered(false);
      setMotionReady(false);

      let inner = 0;
      const outer = window.requestAnimationFrame(() => {
        setMotionReady(true);
        inner = window.requestAnimationFrame(() => {
          canvasRef.current?.offsetHeight;
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
  }, [activeSrc, launchFrom]);

  useLayoutEffect(() => {
    if (activeSrc || !mountedSrc) {
      return undefined;
    }

    const refreshed = refreshAlbumThumbnailRect(
      mountedSrc,
      launchFromRef.current,
      CREATION_ALBUM_THUMBNAIL_SRC_ATTR,
      CREATION_ALBUM_GRID_TILE_ATTR,
    );
    if (refreshed) {
      launchFromRef.current = refreshed;
    }
    setLaunchMotion(syncExitCanvasMotion(canvasRef.current, launchFromRef.current));
    setMotionPhase("out");
    setEnterSettled(true);
    setMotionReady(true);
    setEntered(true);

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
      launchFromRef.current = null;
      openPreviewSrcRef.current = null;
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
  }, [activeSrc, mountedSrc]);

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

  const isAlbumEnter = motionPhase === "in";
  const isAlbumExit = motionPhase === "out";
  /** Exit only — enter zooms the photo via JS layout inside a static canvas. */
  const showCanvasMotion = Boolean(launchMotion) && motionReady && isAlbumExit;
  const motionAnimating =
    (isAlbumEnter && entered && !enterSettled) || (isAlbumExit && !entered);
  const chromeAndBackdropVisible = entered || enterSettled;

  return (
    <ThemeScope
      mode="dark"
      className="z-50 isolate absolute inset-0 bg-tux-v2-ui-page-flat-1"
    >
      {children({
        displaySrc,
        canvasRef,
        previewChromeVisible: !isAlbumExit,
        previewChromeOpacity: isAlbumExit ? 0 : chromeAndBackdropVisible ? 1 : 0,
        previewBackdropOpacity: isAlbumExit ? 0 : chromeAndBackdropVisible ? 1 : 0,
        previewFadeDurationMs: isAlbumExit
          ? ALBUM_THUMBNAIL_ZOOM_OUT_DURATION_MS
          : ALBUM_THUMBNAIL_ZOOM_IN_DURATION_MS,
        photoVisible: !isAlbumEnter || motionReady,
        previewEnterAnimating: isAlbumEnter && !enterSettled,
        photoLayoutExpanded: isAlbumExit ? entered : entered || enterSettled,
        canvasAlbumMotion:
          showCanvasMotion && launchMotion
            ? {
                entered,
                motionAnimating,
                collapsed: launchMotion.collapsed,
                expanded: launchMotion.expanded,
                originX: launchMotion.originX,
                originY: launchMotion.originY,
                duration: isAlbumExit
                  ? ALBUM_THUMBNAIL_ZOOM_OUT_DURATION_MS
                  : ALBUM_THUMBNAIL_ZOOM_IN_DURATION_MS,
                ease: isAlbumExit
                  ? ALBUM_THUMBNAIL_ZOOM_OUT_EASE
                  : ALBUM_THUMBNAIL_ZOOM_IN_EASE,
              }
            : undefined,
      })}
    </ThemeScope>
  );
}
