import { useRef, type PointerEvent as ReactPointerEvent } from "react";

import { APP_Z_OVERLAY } from "./app_z_index";
import VisitorProfilePage from "../../page/profile/visitor_profile_page";
import { useVisitorProfile } from "../../context/visitor_profile";
import { useTheme } from "../../context/theme";

/** Lock the gesture as a close-swipe once it travels this far. */
const CLOSE_AXIS_LOCK_PX = 8;
/** Release past this fraction of the width (or a flick) commits the close. */
const CLOSE_COMMIT_PROGRESS = 0.3;
const CLOSE_FLICK_VELOCITY = 0.35;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

/**
 * Walking from the gesture target up to the layer root, is there a horizontal
 * scroller that is NOT at its leftmost edge? If so, a rightward drag should
 * scroll that content (revealing its left side) instead of closing the profile.
 * Only when every scroller is already at scrollLeft 0 (or there is none) does a
 * rightward drag fall through to the close-the-profile gesture.
 */
function hasHorizontalScrollLeftToReveal(
  target: Element | null,
  root: Element | null,
): boolean {
  let el: Element | null = target;
  while (el && el !== root) {
    if (el instanceof HTMLElement && el.scrollLeft > 0.5) {
      const overflowX = getComputedStyle(el).overflowX;
      if (
        (overflowX === "auto" || overflowX === "scroll") &&
        el.scrollWidth > el.clientWidth + 1
      ) {
        return true;
      }
    }
    el = el.parentElement;
  }
  return false;
}

/**
 * 客态个人页的"右侧推入"覆盖层（iOS push 风格）。
 *
 * - 始终挂载，初始停在 translateX(100%)（屏幕右侧之外）；
 * - transform / transition 完全由 VisitorProfileProvider 命令式驱动：
 *   - 左滑跟手时即时跟随手指（无过渡）；
 *   - 点击进入 / 松手完成 / 返回时带缓动动画；
 * - 关闭后内容卸载，元素仍保留以便下次直接复用。
 *
 * 全屏态下支持「右滑跟手返回上级」：右滑驱动反向视差，松手过半（或快速甩动）
 * 提交关闭，否则回弹复位。
 */
export default function VisitorProfileLayer() {
  const {
    content,
    phase,
    registerLayer,
    closeVisitorProfile,
    setVisitorDragProgress,
    endVisitorDrag,
  } = useVisitorProfile();
  const { resolvedTheme } = useTheme();

  const interactive = phase !== "closed";

  const dragRef = useRef({
    pointerId: null as number | null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastTime: 0,
    velocityX: 0,
    width: 1,
    axis: "undecided" as "undecided" | "close" | "ignore",
    startTarget: null as Element | null,
    didDrag: false,
  });

  /**
   * After a horizontal drag, swallow the synthetic click that would otherwise
   * land on a button underneath (e.g. the top tab bar) and switch tabs. The
   * one-shot capture listener is also cleared on a timer in case no click fires.
   */
  const suppressNextClick = (layer: HTMLElement) => {
    const swallow = (clickEvent: Event) => {
      clickEvent.stopPropagation();
      clickEvent.preventDefault();
    };
    layer.addEventListener("click", swallow, { capture: true, once: true });
    window.setTimeout(() => {
      layer.removeEventListener("click", swallow, { capture: true });
    }, 350);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (phase !== "open") return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    // Only real text inputs / explicit opt-outs keep their own behavior.
    // Buttons & links are allowed: a tap never moves far enough to lock the
    // close axis, so clicks still fire; only a clear rightward drag closes.
    if (
      event.target instanceof Element &&
      event.target.closest("input, textarea, select, [contenteditable='true'], [data-no-drag]")
    ) {
      return;
    }
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastTime: performance.now(),
      velocityX: 0,
      width: event.currentTarget.clientWidth || 1,
      axis: "undecided",
      startTarget: event.target instanceof Element ? event.target : null,
      didDrag: false,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    // Any meaningful horizontal travel counts as a drag (not a tap), so the
    // trailing click on an underlying button can be suppressed on release.
    if (Math.abs(dx) >= CLOSE_AXIS_LOCK_PX) drag.didDrag = true;

    if (drag.axis === "undecided") {
      if (Math.abs(dx) < CLOSE_AXIS_LOCK_PX && Math.abs(dy) < CLOSE_AXIS_LOCK_PX) {
        return;
      }
      // Only a rightward, horizontal-dominant drag becomes a close gesture.
      if (dx > 0 && Math.abs(dx) > Math.abs(dy)) {
        // If the content under the finger can still scroll left, let it scroll
        // instead of closing — only close once it sits at its leftmost edge.
        if (
          hasHorizontalScrollLeftToReveal(drag.startTarget, event.currentTarget)
        ) {
          drag.axis = "ignore";
          return;
        }
        drag.axis = "close";
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // ignore
        }
      } else {
        drag.axis = "ignore";
        return;
      }
    }

    if (drag.axis !== "close") return;

    if (event.cancelable) event.preventDefault();
    const now = performance.now();
    const dt = Math.max(1, now - drag.lastTime);
    drag.velocityX = (event.clientX - drag.lastX) / dt;
    drag.lastX = event.clientX;
    drag.lastTime = now;

    const progress = clamp01(1 - dx / drag.width);
    setVisitorDragProgress(progress);
  };

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) return;
    const wasClosing = drag.axis === "close";
    const didDrag = drag.didDrag;
    drag.pointerId = null;
    drag.axis = "undecided";
    drag.startTarget = null;
    drag.didDrag = false;

    // A horizontal drag must never read as a tap on the control underneath
    // (e.g. switching the profile's top tab) — eat the trailing click.
    if (didDrag) suppressNextClick(event.currentTarget);

    if (!wasClosing) return;

    const dx = event.clientX - drag.startX;
    const shouldClose =
      dx > drag.width * CLOSE_COMMIT_PROGRESS ||
      drag.velocityX > CLOSE_FLICK_VELOCITY;
    // commit=false closes (snaps to 0), commit=true snaps back open.
    endVisitorDrag(!shouldClose);
  };

  return (
    <div
      ref={registerLayer}
      data-tux-color-scheme={resolvedTheme}
      aria-hidden={phase !== "open"}
      className="absolute inset-0 bg-tux-v2-ui-page-flat-1"
      style={{
        zIndex: APP_Z_OVERLAY,
        colorScheme: resolvedTheme,
        // ThemeScope 只切换 CSS 变量；外层 TUXApp 可能把 color 设成别的值，
        // 这里显式拨回 UIText1（随当前主题解析），否则 NavBar 等会继承错误颜色。
        color: "var(--tux-v2-color-ui-text-1)",
        willChange: "transform",
        pointerEvents: interactive ? "auto" : "none",
        touchAction: "pan-y",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
    >
      {content ? (
        <VisitorProfilePage content={content} onBack={closeVisitorProfile} />
      ) : null}
    </div>
  );
}
