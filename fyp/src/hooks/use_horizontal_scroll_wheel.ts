import { useEffect, type RefObject } from "react";

/** 桌面横向 chip 行：滚轮纵向滑动转为横向滚动。 */
export function useHorizontalScrollWheel(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const row = ref.current;
    if (!row) return;

    const onWheel = (event: WheelEvent) => {
      if (row.scrollWidth <= row.clientWidth) return;
      row.scrollLeft += event.deltaY;
      event.preventDefault();
    };

    row.addEventListener("wheel", onWheel, { passive: false });
    return () => row.removeEventListener("wheel", onWheel);
  }, [ref]);
}
