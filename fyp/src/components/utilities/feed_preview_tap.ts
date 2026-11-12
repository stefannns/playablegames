/** Opt-in preview buttons share the pager's pointer pipeline, not a competing gesture. */
export function createFeedPreviewTap<T>() {
  let candidate: { target: T; pointerId: number; x: number; y: number; time: number } | null = null;
  const cancel = () => { candidate = null; };
  const move = (pointerId: number, x: number, y: number) => {
    if (candidate?.pointerId === pointerId && Math.hypot(x - candidate.x, y - candidate.y) > 10) cancel();
  };
  return {
    start(target: T | null, pointerId: number, x: number, y: number, time: number) {
      candidate = target ? { target, pointerId, x, y, time } : null;
    },
    move,
    cancel,
    release(pointerId: number, x: number, y: number, time: number): T | null {
      move(pointerId, x, y);
      const tap = candidate;
      cancel();
      return tap && tap.pointerId === pointerId && time - tap.time <= 600 ? tap.target : null;
    },
  };
}
