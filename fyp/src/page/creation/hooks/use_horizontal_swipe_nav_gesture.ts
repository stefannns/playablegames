import { useCallback, useRef, type PointerEvent } from "react";

export const HORIZONTAL_SWIPE_THRESHOLD_PX = 48;
export const HORIZONTAL_SWIPE_MAX_VERTICAL_DRIFT_PX = 36;

type HorizontalSwipeNavOptions = {
  enabled?: boolean;
  /** Finger moves left (deltaX negative) — typically show next item. */
  onSwipeLeft?: () => void;
  /** Finger moves right (deltaX positive) — typically show previous item. */
  onSwipeRight?: () => void;
};

/**
 * Horizontal swipe-to-navigate on pointer up (album preview, galleries).
 * Ignores gestures that start on interactive controls (buttons, links).
 */
export function useHorizontalSwipeNavGesture({
  enabled = true,
  onSwipeLeft,
  onSwipeRight,
}: HorizontalSwipeNavOptions) {
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!enabled) return;
      if ((event.target as HTMLElement).closest("button, a, [data-no-preview-swipe]")) return;
      swipeStartRef.current = { x: event.clientX, y: event.clientY };
    },
    [enabled],
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const start = swipeStartRef.current;
      swipeStartRef.current = null;
      if (!enabled || !start) return;

      const deltaX = event.clientX - start.x;
      const deltaY = event.clientY - start.y;
      if (Math.abs(deltaY) > HORIZONTAL_SWIPE_MAX_VERTICAL_DRIFT_PX) return;
      if (Math.abs(deltaX) <= Math.abs(deltaY)) return;

      if (deltaX < -HORIZONTAL_SWIPE_THRESHOLD_PX) {
        onSwipeLeft?.();
      } else if (deltaX > HORIZONTAL_SWIPE_THRESHOLD_PX) {
        onSwipeRight?.();
      }
    },
    [enabled, onSwipeLeft, onSwipeRight],
  );

  const handlePointerCancel = useCallback(() => {
    swipeStartRef.current = null;
  }, []);

  return { handlePointerDown, handlePointerUp, handlePointerCancel };
}
