import { useRef, type PointerEvent, type MouseEvent } from "react";

/** Gestures are bound only to chrome hotspots, never to the game iframe. */
export function usePlayableExitGesture(direction: "left" | "up" | "down", onExit: () => void, onReverse?: () => void) {
  const start = useRef<{ id: number; x: number; y: number; time: number; dragging: boolean } | null>(null);
  const suppressClick = useRef(false);
  return {
    onPointerDownCapture(event: PointerEvent<HTMLElement>) {
      if (!event.isPrimary || event.button !== 0) return;
      suppressClick.current = false;
      start.current = { id: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp, dragging: false };
    },
    onPointerMoveCapture(event: PointerEvent<HTMLElement>) {
      const point = start.current;
      if (!point || point.id !== event.pointerId) return;
      const dx = event.clientX - point.x, dy = event.clientY - point.y;
      if (Math.hypot(dx, dy) > 8) {
        point.dragging = true;
        suppressClick.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        event.preventDefault();
      }
    },
    onPointerUpCapture(event: PointerEvent<HTMLElement>) {
      const point = start.current;
      start.current = null;
      if (!point || point.id !== event.pointerId) return;
      const main = direction === "left" ? point.x - event.clientX : direction === "down" ? event.clientY - point.y : point.y - event.clientY;
      const cross = Math.abs(direction === "left" ? point.y - event.clientY : point.x - event.clientX);
      const speed = main / Math.max(1, event.timeStamp - point.time);
      if (point.dragging) { event.preventDefault(); event.stopPropagation(); }
      if (main > cross * 1.25 && (main >= 48 || main >= 24 && speed >= .4)) onExit();
      else if (onReverse && -main > cross * 1.25 && (-main >= 48 || -main >= 24 && -speed >= .4)) onReverse();
    },
    onPointerCancel() { start.current = null; suppressClick.current = true; },
    onClickCapture(event: MouseEvent<HTMLElement>) {
      if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; }
    },
  };
}
