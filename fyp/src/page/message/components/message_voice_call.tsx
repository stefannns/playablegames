import { TUXText } from "@byted-tiktok/tux-web";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useLayoutEffect, useRef, useState } from "react";

import { useAppFrame } from "../../../components/sys/app_frame";
import { CallPhoneLottie } from "./call_phone_lottie";

/**
 * Voice-call overlay — a port of the `VoiceCall` Expo prototype (`app/call.js`
 * + `useCallAnimation` + `useWidgetDrag`) into the TUX Web phone-frame.
 *
 * Two surfaces share a single **morphing container** (the "container transform"
 * from the demo, driven by one `progress` motion value 0→1):
 *
 *   • progress 0 — full-screen "Calling…" ringing state: blurred peer avatar,
 *     a 160px avatar with two pulsing rings, the peer name + a phone Lottie that
 *     loops the `call_pending` segment, and the Speaker / Mute / End cluster.
 *   • progress 1 — a 64px rounded widget sitting at the dragged position.
 *
 * The morph follows the demo exactly: the container shrinks from the full frame
 * to the widget box while the call UI fades out over the first stretch and the
 * widget content fades in over the last; the container's top-left tracks
 * `progress · widgetPosition`, so minimising flies into wherever the widget is.
 *
 * The widget is draggable; on release it snaps flush to the nearest edge
 * ("normal"), or — if flung past an edge — tucks off-screen leaving an 18px
 * sliver with an inward chevron ("snap"). Tapping a normal widget restores the
 * call; tapping a snapped one pops it back to normal first.
 */

// ── Layout constants (mirror src/call/constants.js) ──────────────────────────
const WIDGET = 64;
const PAD = 8;
const SNAP_VISIBLE = 18;
const HIDDEN = WIDGET - SNAP_VISIBLE; // 46
const SNAP_THRESHOLD = WIDGET / 3;
const WIDGET_RADIUS = 12;
const SNAP_RADIUS = 8;
const TOP_BOUND = 100;
const BOTTOM_INSET = 150; // keep the widget clear of the input bar / controls
const DEFAULT_TOP = 159;

const MINIMIZE_EASE = [0.33, 1, 0.68, 1] as const; // easeOutCubic
const SNAP_EASE = [0.42, 0, 0.58, 1] as const; // easeInOut

const CALLING_TEXT = "rgba(255,255,255,0.6)";
const LABEL_TEXT = "rgba(255,255,255,0.75)";
// Snapped (edge-tucked) widget surface: the demo stacks a dark expo-blur
// (intensity 32) under a translucent fill. On web that's a heavy backdrop blur
// plus a translucent vertical gradient (lighter at the top, darker at the
// bottom) so the frosted sliver reads as glass rather than a flat grey chip.
const SNAP_BLUR = "blur(8px) saturate(140%)";
const SNAP_GRADIENT =
  "linear-gradient(180deg, rgba(122,122,122,0.30) 0%, rgba(48,48,48,0.42) 55%, rgba(28,28,28,0.5) 100%)";

type WidgetMode = "normal" | "snap";
type WidgetSide = "left" | "right";

type MessageVoiceCallProps = {
  peerName: string;
  peerAvatarUrl: string;
  /** End the call — fully unmounts the overlay. */
  onClose: () => void;
};

export function MessageVoiceCall({
  peerName,
  peerAvatarUrl,
  onClose,
}: MessageVoiceCallProps) {
  const { topInsetCss, bottomInsetCss } = useAppFrame();

  const [minimized, setMinimized] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [widgetMode, setWidgetMode] = useState<WidgetMode>("normal");
  const [widgetSide, setWidgetSide] = useState<WidgetSide>("right");

  // Frame size — measured so the morph + bounds match the live phone-frame.
  const frameRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState({ w: 390, h: 844 });
  const placedRef = useRef(false);

  // Widget position (top-left of the 64px box, in frame coordinates).
  const wx = useMotionValue(390 - WIDGET - PAD);
  const wy = useMotionValue(DEFAULT_TOP);
  // Morph 0 = full call surface, 1 = widget.
  const progress = useMotionValue(0);

  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth || 390;
      const h = el.clientHeight || 844;
      setFrame({ w, h });
      if (!placedRef.current) {
        placedRef.current = true;
        wx.set(w - WIDGET - PAD);
        wy.set(DEFAULT_TOP);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [wx, wy]);

  // ── Geometry helpers ───────────────────────────────────────────────────────
  const boundsLeft = PAD;
  const boundsRight = frame.w - WIDGET - PAD;
  const boundsBottom = frame.h - WIDGET - BOTTOM_INSET;
  const extLeft = -HIDDEN;
  const extRight = frame.w - SNAP_VISIBLE;

  const clampTop = (t: number) =>
    Math.min(Math.max(t, TOP_BOUND), Math.max(TOP_BOUND, boundsBottom));
  const clampLeft = (l: number) => Math.min(Math.max(l, extLeft), extRight);

  const normalLeft = (side: WidgetSide) => (side === "left" ? boundsLeft : boundsRight);
  const snapLeft = (side: WidgetSide) => (side === "left" ? extLeft : extRight);

  // ── Morph (minimize / restore) ─────────────────────────────────────────────
  const animateMinimize = (next: boolean) => {
    animate(progress, next ? 1 : 0, {
      duration: 0.3,
      ease: MINIMIZE_EASE,
    });
    setMinimized(next);
  };

  // ── Widget pointer drag + snap ───────────────────────────────────────────────
  const drag = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    baseX: 0,
    baseY: 0,
  });

  const animateToState = (mode: WidgetMode, side: WidgetSide, top: number) => {
    setWidgetMode(mode);
    setWidgetSide(side);
    const left = mode === "snap" ? snapLeft(side) : normalLeft(side);
    animate(wx, left, { duration: 0.2, ease: SNAP_EASE });
    animate(wy, clampTop(top), { duration: 0.2, ease: SNAP_EASE });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!minimized) return;
    drag.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      baseX: wx.get(),
      baseY: wy.get(),
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.moved = true;
    wx.set(clampLeft(d.baseX + dx));
    wy.set(clampTop(d.baseY + dy));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);

    if (!d.moved) {
      // Tap: snapped widget pops back to normal; normal widget restores the call.
      if (widgetMode === "snap") {
        animateToState("normal", widgetSide, wy.get());
      } else {
        animateMinimize(false);
      }
      return;
    }

    const left = wx.get();
    const top = wy.get();
    const center = (boundsLeft + boundsRight) / 2;
    const side: WidgetSide = left < center ? "left" : "right";
    if (left <= boundsLeft - SNAP_THRESHOLD) {
      animateToState("snap", "left", top);
    } else if (left >= boundsRight + SNAP_THRESHOLD) {
      animateToState("snap", "right", top);
    } else {
      animateToState("normal", side, top);
    }
  };

  // ── Derived morph styles ─────────────────────────────────────────────────────
  const left = useTransform(() => progress.get() * wx.get());
  const top = useTransform(() => progress.get() * wy.get());
  const width = useTransform(progress, [0, 1], [frame.w, WIDGET]);
  const height = useTransform(progress, [0, 1], [frame.h, WIDGET]);
  const radius = useTransform(
    progress,
    [0, 1],
    [0, widgetMode === "snap" ? SNAP_RADIUS : WIDGET_RADIUS],
  );
  const shadowAlpha = useTransform(progress, [0, 1], [0, widgetMode === "snap" ? 0 : 0.1]);
  const boxShadow = useMotionTemplate`0 6px 24px rgba(0,0,0,${shadowAlpha})`;

  const surfaceOpacity = useTransform(progress, [0, 0.35, 1], [1, 1, 0]);
  const widgetOpacity = useTransform(progress, [0, 0.55, 1], [0, 0, 1]);
  const widgetScale = useTransform(progress, [0, 1], [0.88, 1]);

  const snapped = widgetMode === "snap";

  return (
    // Full-frame positioning context (pointer-events pass through to the chat
    // when minimized; the morph container below grabs them when expanded).
    <div ref={frameRef} className="pointer-events-none absolute inset-0 z-[1100]">
      <motion.div
        className="pointer-events-auto absolute overflow-hidden"
        style={{
          left,
          top,
          width,
          height,
          borderRadius: radius,
          boxShadow,
          // Transparent on purpose: the dark call screen comes from the surface
          // layer below. Once that fades to 0 (minimized), the container is clear
          // so the frosted widget blurs the *chat* behind it, not a black box.
          backgroundColor: "transparent",
          touchAction: "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* ── Call surface (kept at full frame size, clipped as it shrinks) ── */}
        <motion.div
          className="absolute left-0 top-0 overflow-hidden"
          style={{
            width: frame.w,
            height: frame.h,
            opacity: surfaceOpacity,
            // Solid black base so the call screen is fully opaque (the blurred
            // avatar + 48% scrim alone leave faint gaps at the edges). When the
            // surface fades to 0 on minimize, the whole layer — base included —
            // disappears, leaving the transparent container → chat behind.
            backgroundColor: "#000000",
            pointerEvents: minimized ? "none" : "auto",
          }}
        >
          <img
            src={peerAvatarUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 size-full object-cover"
            style={{ filter: "blur(40px)", transform: "scale(1.25)" }}
          />
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.48)" }} />

          {/* Top bar — minimize (zoom) */}
          <div
            className="absolute inset-x-0 flex justify-end px-5"
            style={{ top: `calc(${topInsetCss} + 6px)` }}
          >
            <ControlButton ariaLabel="Minimize call" size={48} onTap={() => animateMinimize(true)}>
              <ZoomIcon size={48} />
            </ControlButton>
          </div>

          {/* Center: avatar + pulses, name, calling row */}
          <div className="absolute inset-x-0 top-[240px] flex flex-col items-center">
            <div className="relative flex size-40 items-center justify-center">
              <PulseRing delay={0} />
              <PulseRing delay={1.5} />
              {/* relative + z-10 so the avatar paints ABOVE the pulse rings:
                  the rings are position:absolute (positioned), so without this
                  they'd render on top of the static <img> regardless of DOM
                  order. The rings should ripple out from *behind* the avatar. */}
              <img
                src={peerAvatarUrl}
                alt=""
                className="relative z-10 size-40 rounded-full object-cover"
              />
            </div>

            <div className="mt-[22px] flex flex-col items-center gap-2">
              <TUXText typographyPreset="H1-Semibold" color="#f6f6f6" align="center">
                {peerName}
              </TUXText>
              <div className="flex items-center gap-1">
                <span className="flex" style={{ opacity: 0.6 }}>
                  <CallPhoneLottie size={18} variant="white" />
                </span>
                <TUXText typographyPreset="Headline-Regular" color={CALLING_TEXT}>
                  Calling...
                </TUXText>
              </div>
            </div>
          </div>

          {/* Bottom controls — Speaker / Mute / End */}
          <div
            className="absolute inset-x-0 flex justify-between px-9"
            style={{ bottom: `calc(${bottomInsetCss} + 40px)` }}
          >
            <ControlItem
              label="Speaker"
              ariaLabel="Toggle speaker"
              onTap={() => setSpeakerOn((v) => !v)}
            >
              {speakerOn ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
            </ControlItem>
            <ControlItem
              label={micOn ? "Mute" : "Unmute"}
              ariaLabel="Toggle microphone"
              onTap={() => setMicOn((v) => !v)}
            >
              {micOn ? <MicOnIcon /> : <MicOffIcon />}
            </ControlItem>
            <ControlItem label="End" ariaLabel="End call" onTap={onClose}>
              <EndCallIcon />
            </ControlItem>
          </div>
        </motion.div>

        {/* ── Widget content (fades in over the back half of the morph) ──
            Purely visual: it covers the whole frame, so it must NOT eat pointer
            events (an invisible opacity:0 layer still intercepts clicks). The
            morph container itself handles the drag / tap-to-restore gestures. */}
        <motion.div
          aria-label="Restore call"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{
            opacity: widgetOpacity,
            scale: widgetScale,
            background: snapped ? SNAP_GRADIENT : "#ffffff",
            backdropFilter: snapped ? SNAP_BLUR : "none",
            WebkitBackdropFilter: snapped ? SNAP_BLUR : "none",
          }}
        >
          {snapped ? (
            // Centered on the visible sliver: tucked left → chevron flush right
            // (and points right, toward screen centre), and vice-versa. top:22
            // vertically centers the 20px glyph in the 64px box (matches demo).
            <div
              className="absolute flex size-5 items-center justify-center"
              style={widgetSide === "left" ? { right: 0, top: 22 } : { left: 0, top: 22 }}
            >
              <SnapChevron direction={widgetSide === "left" ? "right" : "left"} size={20} />
            </div>
          ) : (
            <motion.div
              className="flex"
              animate={{ rotate: [0, -12, 12, -12, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <CallPhoneLottie size={32} variant="green" />
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

/**
 * One pulsing ring behind the avatar (white, ripples outward + fades).
 *
 * Opacity is keyframed 0 → peak → 0 (not a flat fade from a visible start), so
 * each loop begins and ends fully transparent — the cycle boundary is seamless
 * and the ring no longer "pops" back into view on every repeat (the flicker).
 * The ring starts at the avatar's size (scale 1) and grows past it, so the
 * faint early frames stay hidden behind the avatar, matching the demo.
 */
function PulseRing({ delay }: { delay: number }) {
  return (
    <motion.span
      aria-hidden
      className="absolute size-40 rounded-full"
      style={{ backgroundColor: "#ffffff" }}
      initial={{ scale: 1, opacity: 0 }}
      animate={{ scale: [1, 1.35], opacity: [0, 0.22, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay }}
    />
  );
}

/** A 72px control button with a label underneath (bottom cluster). */
function ControlItem({
  label,
  ariaLabel,
  onTap,
  children,
}: {
  label: string;
  ariaLabel: string;
  onTap: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-[98px] flex-col items-center gap-3">
      <ControlButton ariaLabel={ariaLabel} size={72} onTap={onTap}>
        {children}
      </ControlButton>
      <TUXText typographyPreset="P1-Regular" color={LABEL_TEXT} align="center">
        {label}
      </TUXText>
    </div>
  );
}

/** Press-scale wrapper around an icon button (matches the demo's spring feel). */
function ControlButton({
  ariaLabel,
  size,
  onTap,
  children,
}: {
  ariaLabel: string;
  size: number;
  onTap: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      style={{ width: size, height: size }}
      className="flex items-center justify-center"
      whileTap={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 300, damping: 23 }}
      onClick={onTap}
    >
      {children}
    </motion.button>
  );
}

// ── Icons (ported from VoiceCall/src/components/CallActionButton.js) ──────────

function SpeakerOffIcon({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      <rect width="72" height="72" rx="36" fill="white" fillOpacity="0.2" />
      <rect x="0.25" y="0.25" width="71.5" height="71.5" rx="35.75" stroke="white" strokeOpacity="0.2" strokeWidth="0.5" />
      <path d="M24.6666 30.6688C23.5621 30.6688 22.6666 31.5642 22.6666 32.6688V40.1132C22.6666 41.2178 23.5621 42.1132 24.6666 42.1132H27.4683C27.8375 42.1132 28.1902 42.2664 28.4424 42.5361L34.3592 48.8667C35.1852 49.7505 36.6666 49.166 36.6666 47.9563V24.2579C36.6666 23.0218 35.1304 22.4511 34.3234 23.3874L28.446 30.206C28.1927 30.4998 27.824 30.6688 27.4361 30.6688H24.6666Z" fill="white" />
      <path d="M44.9557 44.9568C44.6954 44.6964 44.6969 44.2755 44.9425 44.0012C48.9671 39.5056 48.9671 32.4945 44.9425 27.999C44.6969 27.7247 44.6954 27.3037 44.9557 27.0434L45.8985 26.1006C46.1589 25.8402 46.5822 25.8392 46.8305 26.1111C51.8794 31.638 51.8794 40.3622 46.8305 45.8891C46.5822 46.1609 46.1589 46.1599 45.8985 45.8996L44.9557 44.9568Z" fill="white" />
      <path d="M40.6861 32.2539C40.4561 31.9664 40.4527 31.5464 40.7131 31.286L41.6559 30.3432C41.9162 30.0829 42.3405 30.0813 42.5802 30.3608C45.3274 33.5638 45.3274 38.4364 42.5802 41.6394C42.3405 41.9189 41.9162 41.9173 41.6559 41.6569L40.7131 40.7141C40.4527 40.4538 40.4561 40.0337 40.6861 39.7463C42.4168 37.5837 42.4168 34.4165 40.6861 32.2539Z" fill="white" />
    </svg>
  );
}

function SpeakerOnIcon({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      <rect width="72" height="72" rx="36" fill="white" />
      <rect x="0.25" y="0.25" width="71.5" height="71.5" rx="35.75" stroke="white" strokeOpacity="0.2" strokeWidth="0.5" />
      <path d="M24.6666 30.6688C23.5621 30.6688 22.6666 31.5642 22.6666 32.6688V40.1132C22.6666 41.2178 23.5621 42.1132 24.6666 42.1132H27.4683C27.8375 42.1132 28.1902 42.2664 28.4424 42.5361L34.3592 48.8667C35.1852 49.7505 36.6666 49.166 36.6666 47.9563V24.2579C36.6666 23.0218 35.1304 22.4511 34.3234 23.3874L28.446 30.206C28.1927 30.4998 27.824 30.6688 27.4361 30.6688H24.6666Z" fill="black" />
      <path d="M44.9557 44.9568C44.6954 44.6964 44.6969 44.2755 44.9425 44.0012C48.9671 39.5056 48.9671 32.4945 44.9425 27.999C44.6969 27.7247 44.6954 27.3037 44.9557 27.0434L45.8985 26.1006C46.1589 25.8402 46.5822 25.8392 46.8305 26.1111C51.8794 31.638 51.8794 40.3622 46.8305 45.8891C46.5822 46.1609 46.1589 46.1599 45.8985 45.8996L44.9557 44.9568Z" fill="black" />
      <path d="M40.6861 32.2539C40.4561 31.9664 40.4527 31.5464 40.7131 31.286L41.6559 30.3432C41.9162 30.0829 42.3405 30.0813 42.5802 30.3608C45.3274 33.5638 45.3274 38.4364 42.5802 41.6394C42.3405 41.9189 41.9162 41.9173 41.6559 41.6569L40.7131 40.7141C40.4527 40.4538 40.4561 40.0337 40.6861 39.7463C42.4168 37.5837 42.4168 34.4165 40.6861 32.2539Z" fill="black" />
    </svg>
  );
}

function MicOffIcon({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      <rect width="72" height="72" rx="36" fill="white" fillOpacity="0.2" />
      <rect x="0.25" y="0.25" width="71.5" height="71.5" rx="35.75" stroke="white" strokeOpacity="0.2" strokeWidth="0.5" />
      <path d="M49.3472 47.2321C49.6076 47.4925 50.0297 47.4925 50.2901 47.2321L51.2329 46.2893C51.4932 46.029 51.4932 45.6069 51.2329 45.3465L46.7567 40.8704C47.4652 39.4879 47.8985 37.9401 47.9845 36.2988C48 36.0021 48 35.6605 48 35.0882V31.9989C48 31.6307 47.7015 31.3323 47.3333 31.3323H46C45.6318 31.3323 45.3333 31.6307 45.3333 31.9989V35.039C45.3333 35.6749 45.3329 35.9414 45.3215 36.1593C45.2718 37.1068 45.0708 38.0135 44.7422 38.8559L41.8346 35.9483C41.8558 35.7457 41.8666 35.54 41.8666 35.3317V27.3317C41.8666 24.0917 39.24 21.4651 36 21.4651C33.6613 21.4651 31.6422 22.8336 30.6998 24.8134L26.8423 20.956C26.582 20.6957 26.1599 20.6957 25.8995 20.956L24.9567 21.8988C24.6964 22.1592 24.6964 22.5813 24.9567 22.8416L49.3472 47.2321ZM41.4098 42.9601L43.3264 44.8766C41.626 46.113 39.5676 46.888 37.3333 47.0194V49.9989C37.3333 50.3671 37.0349 50.6656 36.6667 50.6656H35.3333C34.9651 50.6656 34.6667 50.3671 34.6667 49.9989V47.0194C28.9084 46.6807 24.3178 42.067 24.0155 36.2988C24 36.0021 24 35.6606 24 35.0883L24 31.9989C24 31.6307 24.2985 31.3323 24.6667 31.3323H26C26.3682 31.3323 26.6667 31.6307 26.6667 31.9989V35.039C26.6667 35.6749 26.6671 35.9414 26.6785 36.1593C26.9107 40.589 30.4501 44.1283 34.8798 44.3605C35.0976 44.3719 35.3641 44.3724 36 44.3724C36.6359 44.3724 36.9024 44.3719 37.1202 44.3605C38.6998 44.2777 40.1662 43.7744 41.4098 42.9601ZM38.8888 40.439L30.1333 31.6836V35.3317C30.1333 38.5718 32.7599 41.1984 36 41.1984C37.0502 41.1984 38.036 40.9224 38.8888 40.439Z" fill="white" />
    </svg>
  );
}

function MicOnIcon({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      <rect width="72" height="72" rx="36" fill="white" />
      <rect x="0.25" y="0.25" width="71.5" height="71.5" rx="35.75" stroke="white" strokeOpacity="0.2" strokeWidth="0.5" />
      <path d="M30.2666 27.332C30.2666 24.1655 32.8335 21.5986 35.9999 21.5986C39.1664 21.5986 41.7333 24.1655 41.7333 27.332V35.332C41.7333 38.4984 39.1664 41.0653 35.9999 41.0653C32.8335 41.0653 30.2666 38.4984 30.2666 35.332V27.332ZM26.3027 31.4044C26.1601 31.3317 25.9734 31.3317 25.6 31.3317H25.0667C24.6933 31.3317 24.5066 31.3317 24.364 31.4044C24.2386 31.4683 24.1366 31.5703 24.0727 31.6957C24 31.8383 24 32.025 24 32.3984V35.0877C24 35.66 24 36.0015 24.0155 36.2983C24.3178 42.0664 28.9084 46.6801 34.6667 47.0189V49.5984C34.6667 49.9717 34.6667 50.1584 34.7393 50.301C34.8032 50.4265 34.9052 50.5285 35.0307 50.5924C35.1733 50.665 35.36 50.665 35.7333 50.665H36.2667C36.64 50.665 36.8267 50.665 36.9693 50.5924C37.0948 50.5285 37.1968 50.4265 37.2607 50.301C37.3333 50.1584 37.3333 49.9717 37.3333 49.5984V47.0189C43.0916 46.6801 47.6822 42.0664 47.9845 36.2983C48 36.0015 48 35.66 48 35.0876V32.3984C48 32.025 48 31.8383 47.9273 31.6957C47.8634 31.5703 47.7614 31.4683 47.636 31.4044C47.4934 31.3317 47.3067 31.3317 46.9333 31.3317H46.4C46.0266 31.3317 45.8399 31.3317 45.6973 31.4044C45.5719 31.4683 45.4699 31.5703 45.406 31.6957C45.3333 31.8383 45.3333 32.025 45.3333 32.3984V35.0385C45.3333 35.6744 45.3329 35.9409 45.3215 36.1587C45.0893 40.5884 41.5499 44.1278 37.1202 44.3599C36.9024 44.3713 36.6359 44.3718 36 44.3718C35.3641 44.3718 35.0976 44.3713 34.8798 44.3599C30.4501 44.1278 26.9107 40.5884 26.6785 36.1587C26.6671 35.9409 26.6667 35.6744 26.6667 35.0385V32.3984C26.6667 32.025 26.6667 31.8383 26.594 31.6957C26.5301 31.5703 26.4281 31.4683 26.3027 31.4044Z" fill="black" />
    </svg>
  );
}

function EndCallIcon({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      <rect width="72" height="72" rx="36" fill="#FF4C3A" />
      <rect x="0.25" y="0.25" width="71.5" height="71.5" rx="35.75" stroke="black" strokeOpacity="0.12" strokeWidth="0.5" />
      <g clipPath="url(#call-end-clip)">
        <path d="M41.6662 34.2938C40.9221 33.8892 38.2747 33.1827 36.0321 33.1827C33.7895 33.1827 31.142 33.8892 30.398 34.2938C30.1685 34.4187 30.0661 34.6802 30.1195 34.936L30.7475 37.9499C30.9026 38.6941 30.4051 39.4172 29.6545 39.5383L22.7289 40.6553C21.4843 40.856 20.1578 40.3612 19.7243 39.1774C17.5408 33.2148 25.1382 27.1161 36.0321 27.1161C46.926 27.1161 54.5234 33.2148 52.3399 39.1774C51.9063 40.3612 50.5799 40.856 49.3352 40.6553L42.4096 39.5383C41.6591 39.4172 41.1616 38.6941 41.3166 37.9499L41.9447 34.936C41.998 34.6802 41.8957 34.4187 41.6662 34.2938Z" fill="white" />
      </g>
      <defs>
        <clipPath id="call-end-clip">
          <rect width="32" height="32" fill="white" transform="translate(58.6667 36) rotate(135)" />
        </clipPath>
      </defs>
    </svg>
  );
}

function ZoomIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="24" fill="white" fillOpacity="0.19" />
      <rect x="0.25" y="0.25" width="47.5" height="47.5" rx="23.75" stroke="white" strokeOpacity="0.19" strokeWidth="0.5" />
      <path d="M20.8198 18.6974L16.1824 14.0633C15.9871 13.8681 15.6706 13.8682 15.4754 14.0634L14.0609 15.4779C13.8657 15.6731 13.8657 15.9895 14.0608 16.1848L18.6948 20.8224L14.2203 20.7083C13.9392 20.7011 13.7075 20.927 13.7075 21.2081V23.1952C13.7075 23.4714 13.9314 23.6952 14.2075 23.6952L22.1928 23.6952C22.5906 23.6952 22.9722 23.5372 23.2535 23.2559C23.5348 22.9746 23.6928 22.5931 23.6928 22.1952L23.6928 14.21C23.6928 13.9338 23.4689 13.71 23.1928 13.71L21.2057 13.71C20.9246 13.71 20.6987 13.9417 20.7059 14.2227L20.8198 18.6974Z" fill="#F6F6F6" />
      <path d="M29.2998 27.1824L33.9371 31.8186C34.1324 32.0138 34.1325 32.3304 33.9372 32.5257L32.5231 33.9398C32.3278 34.1351 32.0112 34.1351 31.8159 33.9398L27.1798 29.3024L27.2926 33.7808C27.2997 34.0618 27.0738 34.2934 26.7927 34.2934H24.8055C24.5294 34.2934 24.3055 34.0696 24.3055 33.7934L24.3055 25.8082C24.3055 25.4103 24.4635 25.0288 24.7448 24.7475C25.0261 24.4662 25.4077 24.3082 25.8055 24.3082L33.7908 24.3082C34.0669 24.3082 34.2908 24.532 34.2908 24.8082V26.7954C34.2908 27.0765 34.0592 27.3023 33.7782 27.2952L29.2998 27.1824Z" fill="#F6F6F6" />
    </svg>
  );
}

/** Inward-pointing chevron shown in the snapped (edge-tucked) widget state. */
function SnapChevron({ direction, size = 20 }: { direction: "left" | "right"; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <g transform={direction === "right" ? "rotate(180 10 10)" : undefined}>
        <path
          d="M6.84354 9.52555L9.92383 2.01733C10.0124 1.80144 10.0567 1.69349 10.1325 1.62827C10.1992 1.57089 10.2824 1.53612 10.3701 1.52892C10.4698 1.52073 10.5778 1.56502 10.7937 1.65359L11.873 2.0964C12.0889 2.18498 12.1969 2.22926 12.2621 2.30511C12.3195 2.37182 12.3542 2.45499 12.3614 2.54268C12.3696 2.64238 12.3253 2.75032 12.2368 2.96621L9.45492 9.74695C9.41659 9.84037 9.39743 9.88707 9.38985 9.93537C9.38313 9.9782 9.38313 10.0218 9.38985 10.0646C9.39743 10.1129 9.41659 10.1596 9.45492 10.253L12.2368 17.0338C12.3253 17.2497 12.3696 17.3576 12.3614 17.4573C12.3542 17.545 12.3195 17.6282 12.2621 17.6949C12.1969 17.7707 12.0889 17.815 11.873 17.9036L10.7937 18.3464C10.5778 18.435 10.4698 18.4792 10.3701 18.4711C10.2824 18.4639 10.1992 18.4291 10.1325 18.3717C10.0567 18.3065 10.0124 18.1985 9.92383 17.9826L6.84354 10.4744C6.71882 10.1704 6.71882 9.82955 6.84354 9.52555Z"
          fill="#FFFFFF"
        />
      </g>
    </svg>
  );
}
