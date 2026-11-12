import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { TUXIconCameraFill } from "@byted-tiktok/tux-icons";

// ── Effect data ──────────────────────────────────────────────────────────────
const EFFECTS = [
  { id: 0, src: "/resource/video_mock/creation-camera/panel-effect-01.png" },
  { id: 1, src: "/resource/video_mock/creation-camera/panel-effect-02.png" },
  { id: 2, src: "/resource/video_mock/creation-camera/panel-effect-03.png" },
  { id: 3, src: "/resource/video_mock/creation-camera/panel-effect-04.png" },
  { id: 4, src: "/resource/video_mock/creation-camera/panel-effect-05.png" },
  { id: 5, src: "/resource/video_mock/creation-camera/panel-effect-06.png" },
];

// ── Strip layout ──────────────────────────────────────────────────────────────
// Unified 7-item strip for BOTH normal and selected modes:
//   [eff0, eff1, SHUTTER/CAMERA@pos2, eff2, eff3, eff4, eff5]
// In normal mode  → pos2 renders as white shutter circle; strip centered on pos2
// In selected mode → pos2 renders as camera icon; strip centered on selected effect
const CAMERA_POS = 2;
const LIST_LEN = 7;
const ITEM_W = 76;          // slot width px
const SELECTED_SIZE = 74;   // circle px at center
const NORMAL_SIZE = 56;     // circle px off-center
const MIN_SCALE = NORMAL_SIZE / SELECTED_SIZE;  // ≈ 0.757

// Flush alignment offset: how far the circle center moves inside its slot.
// At t=0 (far from center): circle center is FLUSH_OFFSET away from slot center.
// At t=1 (at center): no offset (circle stays at slot center).
// Left items pull LEFT, right items pull RIGHT.
const FLUSH_OFFSET = (ITEM_W - NORMAL_SIZE) / 2; // = 10

const WHITE = "var(--tux-v2-color-ui-image-overlay-white)";
const CLICK_THRESHOLD = 6; // px delta below which we treat pointer-up as a tap
const DOCK_AXIS_LOCK_MIN_X_PX = 6;
const DOCK_AXIS_LOCK_MIN_Y_PX = 36;
const DOCK_HORIZONTAL_BIAS = 0.25;
const DOCK_VERTICAL_BIAS = 2.6;

type DockDragState = {
  pointerId: number | null;
  startX: number;
  startY: number;
  baseTranslate: number;
  axis: "undecided" | "horizontal" | "vertical";
  deltaX: number;
  deltaY: number;
  renderedDeltaX: number;
};

// ── Position mapping ──────────────────────────────────────────────────────────
const effectIdToPos = (id: number) => (id < CAMERA_POS ? id : id + 1);
const posToEffectId = (pos: number) =>
  pos === CAMERA_POS ? -1 : pos < CAMERA_POS ? pos : pos - 1;

// ── Props ─────────────────────────────────────────────────────────────────────
export type CameraEffectDockProps = {
  /** null = shutter mode, 0–5 = effect selected */
  selectedEffect: number | null;
  onSelectEffect: (id: number) => void;
  onDeselect: () => void;
  /** Tap the centered slot only (shutter or selected effect) — `effectId` null = no effect. */
  onShutter?: (effectId: number | null) => void;
  onLongPressShutter?: () => void;
  onLongPressRelease?: () => void;
  /** Parent tab visible — remeasure width (hidden tabs often report 0). */
  isTabActive?: boolean;
  /** `false` while the wheel centers on an effect (incl. during drag) — hide POST · CREATE · LIVE. */
  onShutterCenteredChange?: (shutterCentered: boolean) => void;
  style?: CSSProperties;
};

// ── Component ─────────────────────────────────────────────────────────────────
const LONG_PRESS_MS = 300;

const CameraEffectDock = ({
  selectedEffect,
  onSelectEffect,
  onDeselect,
  onShutter,
  onLongPressShutter,
  onLongPressRelease,
  isTabActive = true,
  onShutterCenteredChange,
  style,
}: CameraEffectDockProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DockDragState | null>(null);
  const [dockWidth, setDockWidth] = useState(390);
  const [liveOffset, setLiveOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);

  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;

    const updateWidth = () => {
      const nextWidth = node.clientWidth;
      if (nextWidth > 0) {
        setDockWidth((current) => (current === nextWidth ? current : nextWidth));
      }
    };

    updateWidth();
    if (!isTabActive) return undefined;

    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, [isTabActive]);

  const getW = () => {
    const liveWidth = containerRef.current?.clientWidth ?? 0;
    return liveWidth > 0 ? liveWidth : dockWidth;
  };

  const translateForPos = (pos: number) =>
    getW() / 2 - (pos * ITEM_W + ITEM_W / 2);

  const nearestPos = (translate: number): number => {
    const w = getW();
    let best = 0, bestDist = Infinity;
    for (let p = 0; p < LIST_LEN; p++) {
      const dist = Math.abs(translate + p * ITEM_W + ITEM_W / 2 - w / 2);
      if (dist < bestDist) { bestDist = dist; best = p; }
    }
    return best;
  };

  // Strip translate: center the active slot
  const centeredPos = selectedEffect === null ? CAMERA_POS : effectIdToPos(selectedEffect);
  const baseTranslate = translateForPos(centeredPos);
  const totalTranslate = baseTranslate + liveOffset;
  const visuallyCenteredPos = isDragging
    ? nearestPos(baseTranslate + liveOffset)
    : centeredPos;

  useEffect(() => {
    onShutterCenteredChange?.(visuallyCenteredPos === CAMERA_POS);
  }, [onShutterCenteredChange, visuallyCenteredPos]);

  const offsetSign = liveOffset >= 0 ? "+" : "-";
  const totalTranslateCss =
    `calc(50% - ${centeredPos * ITEM_W + ITEM_W / 2}px ${offsetSign} ${Math.abs(liveOffset)}px)`;

  // Per-item transform: scale + flush-alignment translateX
  // All circles are SELECTED_SIZE (74px) in DOM with justify-center in their 76px slot.
  // transform = translateX(dx) scale(s) keeps visual center anchored at DOM center.
  const getItemTransform = (pos: number) => {
    const w = getW();
    const itemCenter = totalTranslate + pos * ITEM_W + ITEM_W / 2;
    const relPos = itemCenter - w / 2;       // negative = left, positive = right
    const t = Math.max(0, 1 - Math.abs(relPos) / ITEM_W);
    const scale = MIN_SCALE + (1 - MIN_SCALE) * t;
    // Pull circle toward its slot edge based on which side of center it's on.
    // At t=0: full flush (±FLUSH_OFFSET). At t=1: centered (dx=0).
    const side = relPos <= 0 ? -1 : 1;
    const dx = side * FLUSH_OFFSET * (1 - t);
    return { scale, dx, t };
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const resetDockDrag = useCallback(() => {
    dragRef.current = null;
    longPressFiredRef.current = false;
    setIsDragging(false);
    setLiveOffset(0);
  }, []);

  const commitSnappedPos = useCallback(
    (snapped: number, allowCenteredAction: boolean) => {
      if (snapped === centeredPos) {
        if (!allowCenteredAction) {
          return;
        }
        if (snapped === CAMERA_POS) {
          onShutter?.(selectedEffect);
        } else {
          onShutter?.(posToEffectId(snapped));
        }
        return;
      }

      if (snapped === CAMERA_POS) {
        if (selectedEffect !== null) {
          onDeselect();
        }
        return;
      }

      onSelectEffect(posToEffectId(snapped));
    },
    [centeredPos, onDeselect, onSelectEffect, onShutter, selectedEffect],
  );

  const finishDockDrag = useCallback(
    (clientX?: number) => {
      const drag = dragRef.current;
      clearLongPressTimer();

      if (longPressFiredRef.current) {
        resetDockDrag();
        onLongPressRelease?.();
        return;
      }

      if (!drag) return;

      const totalTravel = Math.hypot(drag.deltaX, drag.deltaY);
      const isTap =
        drag.axis === "undecided" &&
        Math.abs(drag.deltaX) < CLICK_THRESHOLD &&
        totalTravel < CLICK_THRESHOLD;

      if (drag.axis === "vertical") {
        resetDockDrag();
        return;
      }

      let snapped: number | null = null;
      let allowCenteredAction = false;
      if (isTap) {
        const containerLeft = containerRef.current?.getBoundingClientRect().left ?? 0;
        const pointerX = clientX ?? drag.startX;
        const tapXInStrip = pointerX - containerLeft - drag.baseTranslate;
        snapped = Math.max(0, Math.min(LIST_LEN - 1, Math.floor(tapXInStrip / ITEM_W)));
        allowCenteredAction = true;
      } else if (drag.axis === "horizontal") {
        snapped = nearestPos(drag.baseTranslate + drag.renderedDeltaX);
      }

      resetDockDrag();
      if (snapped !== null) {
        commitSnappedPos(snapped, allowCenteredAction);
      }
    },
    [commitSnappedPos, nearestPos, onLongPressRelease, resetDockDrag],
  );

  const updateDockDrag = (
    clientX: number,
    clientY: number,
    preventDefault?: () => void,
  ) => {
    const drag = dragRef.current;
    if (!drag || longPressFiredRef.current) return;

    const dx = clientX - drag.startX;
    const dy = clientY - drag.startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    drag.deltaX = dx;
    drag.deltaY = dy;

    if (drag.axis === "undecided") {
      if (absDx < DOCK_AXIS_LOCK_MIN_X_PX && absDy < DOCK_AXIS_LOCK_MIN_Y_PX) {
        return;
      }
      if (
        absDx >=
        Math.max(DOCK_AXIS_LOCK_MIN_X_PX, absDy * DOCK_HORIZONTAL_BIAS)
      ) {
        drag.axis = "horizontal";
        clearLongPressTimer();
        setIsDragging(true);
      } else if (
        absDy >= DOCK_AXIS_LOCK_MIN_Y_PX &&
        absDy >= absDx * DOCK_VERTICAL_BIAS
      ) {
        drag.axis = "vertical";
        clearLongPressTimer();
        return;
      } else {
        return;
      }
    }

    if (drag.axis !== "horizontal") return;

    preventDefault?.();
    const atStart = centeredPos === 0 && dx > 0;
    const atEnd = centeredPos === LIST_LEN - 1 && dx < 0;
    const renderedDx = atStart || atEnd ? dx * 0.32 : dx;
    drag.renderedDeltaX = renderedDx;
    setLiveOffset(renderedDx);
  };

  // ── Pointer handlers — active in ALL modes (unified strip) ─────────────────
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (dragRef.current) {
      clearLongPressTimer();
      resetDockDrag();
    }

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Pointer capture can fail when the pointer is already released.
    }

    longPressFiredRef.current = false;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseTranslate,
      axis: "undecided",
      deltaX: 0,
      deltaY: 0,
      renderedDeltaX: 0,
    };

    // Start long-press timer when pressing the centered shutter slot in normal mode.
    if (onLongPressShutter && selectedEffect === null) {
      const w = getW();
      const containerLeft = containerRef.current?.getBoundingClientRect().left ?? 0;
      const relX = e.clientX - containerLeft - w / 2;
      if (Math.abs(relX) <= ITEM_W / 2) {
        longPressTimerRef.current = setTimeout(() => {
          longPressTimerRef.current = null;
          longPressFiredRef.current = true;
          onLongPressShutter();
        }, LONG_PRESS_MS);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (e.pointerType === "mouse" && e.buttons === 0) {
      finishDockDrag(e.clientX);
      return;
    }
    updateDockDrag(e.clientX, e.clientY, () => {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    finishDockDrag(e.clientX);
  };

  const handleLostPointerCapture = () => {
    finishDockDrag();
  };

  useEffect(() => {
    const handleWindowPointerUp = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      finishDockDrag(event.clientX);
    };
    const handleWindowBlur = () => finishDockDrag();
    const handleVisibilityChange = () => {
      if (document.hidden) finishDockDrag();
    };

    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerUp);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerUp);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [finishDockDrag]);

  const motionEnabled = !isDragging;
  const scaleTransition = motionEnabled ? "transform 200ms ease" : "none";

  return (
    // Outer container has NO overflow-hidden so the outline ring is never clipped.
    // The ring (86px) fills the full 86px dock height — if the container clips, the
    // top/bottom 3px border disappears, making the ring look off-center.
    <div
      ref={containerRef}
      className="absolute left-0 z-30"
      style={{
        height: 86,
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
        userSelect: "none",
        ...style,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onLostPointerCapture={handleLostPointerCapture}
    >
      {/* Strip wrapper — overflow-hidden here clips only the item circles, not the ring */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="flex items-center h-full"
          style={{
            transform: `translateX(${totalTranslateCss})`,
            transition: motionEnabled ? "transform 280ms cubic-bezier(0.25,0.46,0.45,0.94)" : "none",
            willChange: "transform",
          }}
        >
        {Array.from({ length: LIST_LEN }, (_, pos) => {
          const { scale, dx } = getItemTransform(pos);
          // Skip identity transforms — applying scale(1)/translateX(0) via CSS can trigger
          // GPU compositing that shifts the element by a sub-pixel on high-DPI displays.
          const isIdentity = Math.abs(dx) < 0.01 && Math.abs(scale - 1) < 0.0001;
          const tf = isIdentity ? "none" : `translateX(${dx.toFixed(2)}px) scale(${scale.toFixed(4)})`;

          // ── Shutter/camera slot ──────────────────────────────────────────
          if (pos === CAMERA_POS) {
            const circleStyle: CSSProperties = {
              width: SELECTED_SIZE,
              height: SELECTED_SIZE,
              borderRadius: "999px",
              display: "block",
              transform: tf,
              transformOrigin: "center",
              transition: scaleTransition,
            };

            if (selectedEffect === null) {
              // Normal mode: default-selected white camera circle
              return (
                <div
                  key="camera-default"
                  style={{ width: ITEM_W, height: ITEM_W, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}
                >
                  <span style={{ ...circleStyle, background: WHITE, position: "relative" }}>
                    <span style={{
                      position: "absolute",
                      inset: "25%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "rgba(0,0,0,0.5)",
                      opacity: 0,
                    }}>
                      <TUXIconCameraFill size={Math.round(SELECTED_SIZE * 0.5)} />
                    </span>
                  </span>
                </div>
              );
            }

            // Selected mode: camera icon per Figma 6004:927
            // White-75% background + camera fill icon inset 25%
            return (
              <div
                key="camera"
                style={{ width: ITEM_W, height: ITEM_W, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}
              >
                <span style={{ ...circleStyle, overflow: "hidden", position: "relative" }}>
                  {/* bg: var(--ui/image-overlay/white-a75) */}
                  <span style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.75)", borderRadius: "999px" }} />
                  {/* icon: inset 25%, dark color visible on white bg */}
                  <span style={{
                    position: "absolute",
                    inset: "25%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(0,0,0,0.5)",
                  }}>
                    <TUXIconCameraFill size={Math.round(SELECTED_SIZE * 0.5)} />
                  </span>
                </span>
              </div>
            );
          }

          // ── Effect circle ────────────────────────────────────────────────
          const effectId = posToEffectId(pos);
          const eff = EFFECTS[effectId];
          return (
            <div
              key={effectId}
              style={{ width: ITEM_W, height: ITEM_W, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}
            >
              <span style={{
                width: SELECTED_SIZE,
                height: SELECTED_SIZE,
                borderRadius: "999px",
                overflow: "hidden",
                display: "block",
                transform: tf,
                transformOrigin: "center",
                transition: scaleTransition,
              }}>
                <img
                  src={eff.src}
                  alt=""
                  draggable={false}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </span>
            </div>
          );
        })}
        </div>
      </div>

      {/* Outline ring — top:0 + height matches container (86px) so vertical centering
           is pixel-exact without percentage math that can cause sub-pixel GPU shift */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          transform: "translateX(-50%)",
          width: 86,
          height: 86,
          borderRadius: "999px",
          border: `3px solid ${WHITE}`,
          pointerEvents: "none",
          zIndex: 10,
        }}
      />
    </div>
  );
};

export default CameraEffectDock;
