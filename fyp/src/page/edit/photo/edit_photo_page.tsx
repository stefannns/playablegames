import {
  IconChevronDownObtuseFill,
  IconPlus,
} from "@byted-tiktok/tux-icons";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useRegisterHomeIndicatorSurfaceTheme } from "../../../components/sys/app_frame";
import { useAppNavigation } from "../../../context/app_navigation";
import { postPublishPaths } from "../../creation/post_publish/post_publish_paths";
import { queuePostPublishSeed } from "../../creation/post_publish/post_publish_store";
import { EditBottomActions } from "../components/edit_bottom_actions";
import { EditMediaViewport } from "../components/edit_media_viewport";
import { EditSidebar } from "../components/edit_sidebar";
import {
  buildPhotoEditMediaList,
  type PhotoEditMediaItem,
} from "../../creation/photo_edit_media_catalog";
import { buildEditPhotoSidebarTools } from "./edit_photo_toolbar.config";
import { EditVideoSettingsPanel } from "../video/edit_video_settings_panel";

const SELECTED_THUMB_SIZE_PX = 50;
const THUMB_SIZE_PX = 40;
const CAROUSEL_AXIS_LOCK_MIN_X_PX = 6;
const CAROUSEL_AXIS_LOCK_MIN_Y_PX = 36;
const CAROUSEL_HORIZONTAL_BIAS = 0.25;
const CAROUSEL_VERTICAL_BIAS = 2.6;
const CAROUSEL_COMMIT_PX = 48;
const CAROUSEL_COMMIT_PROGRESS = 0.14;
const CAROUSEL_WHEEL_COMMIT_PX = 36;
/** Idle after last wheel tick before the next photo may be advanced (one photo per gesture). */
const CAROUSEL_WHEEL_GESTURE_END_MS = 320;

type CarouselDragState = {
  pointerId: number | null;
  startX: number;
  startY: number;
  startIndex: number;
  axis: "undecided" | "horizontal" | "vertical";
  deltaX: number;
};

function clampPhotoIndex(index: number, total: number) {
  return Math.max(0, Math.min(total - 1, index));
}

export type EditPhotoPageProps = {
  /** Captured frame from the creation camera; omit for neutral placeholder fill. */
  mediaSrc?: string | null;
  /** Album multi-select — one carousel / publish slide per item. */
  albumPhotos?: readonly PhotoEditMediaItem[] | null;
  onBack?: () => void;
  reserveFrameTopInset?: boolean;
};

export function EditPhotoPage({
  mediaSrc = null,
  albumPhotos = null,
  onBack,
  reserveFrameTopInset = true,
}: EditPhotoPageProps) {
  const { navigate } = useAppNavigation();
  useRegisterHomeIndicatorSurfaceTheme("dark");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const sidebarTools = buildEditPhotoSidebarTools(() => setSettingsOpen(true));
  const photos = useMemo(
    () => buildPhotoEditMediaList(mediaSrc, albumPhotos),
    [mediaSrc, albumPhotos],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [trackOffset, setTrackOffset] = useState(0);
  const [carouselOffsetPx, setCarouselOffsetPx] = useState(0);
  const [carouselDragging, setCarouselDragging] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(0);
  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const wheelStateRef = useRef<{
    accumulatedX: number;
    lock: boolean;
    gestureEndTimer: number | null;
  }>({
    accumulatedX: 0,
    lock: false,
    gestureEndTimer: null,
  });
  const dragRef = useRef<CarouselDragState>({
    pointerId: null,
    startX: 0,
    startY: 0,
    startIndex: 0,
    axis: "undecided",
    deltaX: 0,
  });

  const openPublish = useCallback(() => {
    const sources = photos.map((photo) => photo.src);
    if (sources.length === 0) return;
    queuePostPublishSeed({ kind: "photo", sources });
    navigate(postPublishPaths.publish("edit-photo"));
  }, [navigate, photos]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    setActiveIndex((current) => clampPhotoIndex(current, photos.length));
  }, [photos.length]);

  useEffect(() => {
    return () => {
      const wheelState = wheelStateRef.current;
      if (wheelState.gestureEndTimer != null) {
        window.clearTimeout(wheelState.gestureEndTimer);
      }
    };
  }, []);

  useLayoutEffect(() => {
    const selectedThumb = thumbRefs.current[activeIndex];
    if (!selectedThumb) return;
    const center = selectedThumb.offsetLeft + selectedThumb.offsetWidth / 2;
    setTrackOffset(-center);
  }, [activeIndex, photos.length]);

  useEffect(() => {
    const onResize = () => {
      const selectedThumb = thumbRefs.current[activeIndex];
      if (!selectedThumb) return;
      setTrackOffset(-(selectedThumb.offsetLeft + selectedThumb.offsetWidth / 2));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeIndex]);

  useLayoutEffect(() => {
    const node = carouselRef.current;
    if (!node) return undefined;

    const updateWidth = () => {
      const nextWidth = node.clientWidth;
      if (nextWidth > 0) {
        setViewportWidth((current) => (current === nextWidth ? current : nextWidth));
      }
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const resetCarouselDrag = useCallback(() => {
    dragRef.current.pointerId = null;
    dragRef.current.axis = "undecided";
    dragRef.current.deltaX = 0;
    setCarouselDragging(false);
    setCarouselOffsetPx(0);
  }, []);

  const updateCarouselDrag = useCallback(
    (clientX: number, clientY: number, preventDefault?: () => void) => {
      const drag = dragRef.current;
      if (drag.pointerId == null) return;

      const dx = clientX - drag.startX;
      const dy = clientY - drag.startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (drag.axis === "undecided") {
        if (absDx < CAROUSEL_AXIS_LOCK_MIN_X_PX && absDy < CAROUSEL_AXIS_LOCK_MIN_Y_PX) {
          return;
        }
        if (
          absDx >=
          Math.max(CAROUSEL_AXIS_LOCK_MIN_X_PX, absDy * CAROUSEL_HORIZONTAL_BIAS)
        ) {
          drag.axis = "horizontal";
          setCarouselDragging(true);
        } else if (
          absDy >= CAROUSEL_AXIS_LOCK_MIN_Y_PX &&
          absDy >= absDx * CAROUSEL_VERTICAL_BIAS
        ) {
          drag.axis = "vertical";
          return;
        } else {
          return;
        }
      }

      if (drag.axis !== "horizontal") return;

      drag.deltaX = dx;
      preventDefault?.();
      const atStart = drag.startIndex === 0 && dx > 0;
      const atEnd = drag.startIndex === photos.length - 1 && dx < 0;
      const resistedDx = atStart || atEnd ? dx * 0.32 : dx;
      setCarouselOffsetPx(resistedDx);
    },
    [photos.length],
  );

  const finishCarouselDrag = useCallback(() => {
    const drag = dragRef.current;
    if (drag.pointerId == null) return;

    if (drag.axis === "horizontal" && viewportWidth > 0) {
      const progress = Math.abs(drag.deltaX) / Math.max(1, viewportWidth);
      const shouldCommit =
        Math.abs(drag.deltaX) >= CAROUSEL_COMMIT_PX ||
        progress >= CAROUSEL_COMMIT_PROGRESS;
      if (shouldCommit) {
        const direction = drag.deltaX < 0 ? 1 : -1;
        setActiveIndex((current) => clampPhotoIndex(current + direction, photos.length));
      }
    }

    resetCarouselDrag();
  }, [photos.length, resetCarouselDrag, viewportWidth]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startIndex: activeIndexRef.current,
        axis: "undecided",
        deltaX: 0,
      };
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture can fail if the pointer was already released.
      }
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (drag.pointerId !== event.pointerId) return;
      if (event.pointerType === "mouse" && event.buttons === 0) {
        finishCarouselDrag();
        return;
      }
      updateCarouselDrag(event.clientX, event.clientY, () => {
        if (event.cancelable) event.preventDefault();
        event.stopPropagation();
      });
    },
    [finishCarouselDrag, updateCarouselDrag],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (dragRef.current.pointerId !== event.pointerId) return;
      finishCarouselDrag();
    },
    [finishCarouselDrag],
  );

  const scheduleWheelGestureEnd = useCallback(() => {
    const wheelState = wheelStateRef.current;
    if (wheelState.gestureEndTimer != null) {
      window.clearTimeout(wheelState.gestureEndTimer);
    }
    wheelState.gestureEndTimer = window.setTimeout(() => {
      wheelState.accumulatedX = 0;
      wheelState.lock = false;
      wheelState.gestureEndTimer = null;
    }, CAROUSEL_WHEEL_GESTURE_END_MS);
  }, []);

  const handleCarouselWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      const absX = Math.abs(event.deltaX);
      const absY = Math.abs(event.deltaY);
      const horizontalDelta =
        absX > 0 && absX >= Math.max(8, absY * 0.35)
          ? event.deltaX
          : event.shiftKey && absY > 0
            ? event.deltaY
            : 0;

      if (horizontalDelta === 0 || photos.length <= 1) return;

      event.preventDefault();

      const wheelState = wheelStateRef.current;
      if (wheelState.lock) {
        scheduleWheelGestureEnd();
        return;
      }

      wheelState.accumulatedX += horizontalDelta;
      scheduleWheelGestureEnd();

      if (Math.abs(wheelState.accumulatedX) < CAROUSEL_WHEEL_COMMIT_PX) return;

      const direction = wheelState.accumulatedX > 0 ? 1 : -1;
      wheelState.accumulatedX = 0;
      wheelState.lock = true;
      setActiveIndex((current) => clampPhotoIndex(current + direction, photos.length));
    },
    [photos.length, scheduleWheelGestureEnd],
  );

  const selectPhoto = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const carouselTranslateX = -activeIndex * viewportWidth + carouselOffsetPx;

  const handleBack = useCallback(() => {
    if (settingsOpen) {
      setSettingsOpen(false);
      return;
    }
    onBack?.();
  }, [onBack, settingsOpen]);

  return (
    <EditMediaViewport
      mediaSrc={mediaSrc}
      mediaAlt="Photo preview"
      mediaContent={
        <div
          ref={carouselRef}
          className="size-full touch-pan-y overflow-hidden"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onLostPointerCapture={handlePointerUp}
          onWheel={handleCarouselWheel}
        >
          <div
            className="flex h-full will-change-transform"
            style={{
              width: `${photos.length * 100}%`,
              transform: `translate3d(${carouselTranslateX}px, 0, 0)`,
              transition: carouselDragging
                ? "none"
                : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative h-full shrink-0 overflow-hidden"
                style={{ width: viewportWidth > 0 ? viewportWidth : "100%" }}
              >
                <img
                  src={photo.src}
                  alt=""
                  draggable={false}
                  className="app-no-img-drag pointer-events-none absolute inset-0 m-auto size-full object-contain object-center"
                />
              </div>
            ))}
          </div>
        </div>
      }
      mediaCornerRadiusPx={0}
      onBack={handleBack}
      reserveFrameTopInset={reserveFrameTopInset}
      bottomActions={<EditBottomActions onNext={openPublish} />}
      sidebar={
        <EditSidebar {...sidebarTools} />
      }
    >
      <div
        className="pointer-events-none absolute inset-x-0 bottom-1.5 flex flex-col items-center gap-1"
        style={{
          opacity: settingsOpen ? 0 : 1,
          pointerEvents: settingsOpen ? "none" : undefined,
          transition: "opacity 120ms ease",
        }}
        aria-hidden={settingsOpen}
      >
        <span className="flex size-6 items-center justify-center">
          <IconChevronDownObtuseFill
            style={{
              fontSize: 24,
              color: "var(--tux-v2-color-ui-image-overlay-white)",
            }}
          />
        </span>

        <div className="pointer-events-auto relative h-[50px] w-full overflow-hidden">
          <div
            className="absolute left-1/2 top-1/2 flex items-center gap-1.5 transition-transform duration-300 ease-out"
            style={{ transform: `translate(${trackOffset}px, -50%)` }}
          >
            {photos.map((photo, index) => {
              const selected = index === activeIndex;
              const size = selected ? SELECTED_THUMB_SIZE_PX : THUMB_SIZE_PX;
              const radius = selected ? 10 : 8;

              return (
                <button
                  key={photo.id}
                  ref={(node) => {
                    thumbRefs.current[index] = node;
                  }}
                  type="button"
                  aria-label={`Select photo ${index + 1}`}
                  onClick={() => selectPhoto(index)}
                  className="relative shrink-0 cursor-pointer overflow-hidden"
                  style={{
                    width: size,
                    height: size,
                    borderRadius: radius,
                  }}
                >
                  <img
                    src={photo.src}
                    alt=""
                    draggable={false}
                    className="app-no-img-drag pointer-events-none size-full object-cover"
                    style={{
                      borderRadius: radius,
                      transform: selected ? "scale(0.92)" : undefined,
                    }}
                  />
                  {selected ? (
                    <span
                      className="pointer-events-none absolute inset-0"
                      style={{
                        borderRadius: 10,
                        border: "2.5px solid var(--tux-v2-color-ui-image-overlay-white)",
                      }}
                    />
                  ) : null}
                </button>
              );
            })}

            <button
              type="button"
              aria-label="Add photo"
              className="flex shrink-0 items-center justify-center"
              style={{
                width: THUMB_SIZE_PX,
                height: THUMB_SIZE_PX,
                borderRadius: 8,
                backgroundColor: "rgba(51, 51, 51, 0.6)",
              }}
            >
              <IconPlus
                style={{
                  fontSize: 16,
                  color: "var(--tux-v2-color-ui-image-overlay-white)",
                }}
              />
            </button>
          </div>
        </div>
      </div>
      <EditVideoSettingsPanel
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </EditMediaViewport>
  );
}
