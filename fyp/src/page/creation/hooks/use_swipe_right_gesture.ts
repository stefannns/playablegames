import { useCallback, useRef, type PointerEvent } from "react";

export const SWIPE_RIGHT_THRESHOLD_PX = 48;
export const SWIPE_RIGHT_MAX_VERTICAL_DRIFT_PX = 36;

/** Finger moves right (toward POST / back to camera). Mirrors camera tab bar swipe-left-to-create. */
export function useSwipeRightGesture(onSwipeRight: () => void) {
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    swipeStartRef.current = { x: event.clientX, y: event.clientY };
  }, []);

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const start = swipeStartRef.current;
      swipeStartRef.current = null;
      if (!start) return;

      const deltaX = event.clientX - start.x;
      const deltaY = event.clientY - start.y;
      if (Math.abs(deltaY) > SWIPE_RIGHT_MAX_VERTICAL_DRIFT_PX) return;
      if (Math.abs(deltaX) <= Math.abs(deltaY)) return;
      if (deltaX > SWIPE_RIGHT_THRESHOLD_PX) {
        onSwipeRight();
      }
    },
    [onSwipeRight],
  );

  const handlePointerCancel = useCallback(() => {
    swipeStartRef.current = null;
  }, []);

  return { handlePointerDown, handlePointerUp, handlePointerCancel };
}
