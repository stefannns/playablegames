import { getColorCSSVar } from "@byted-tiktok/tux-web";
import { useEffect, useState } from "react";

/** Full loading cycle — 91 frames @ 60 fps (Lottie `loading_l1x`). */
const LOTTIE_TOTAL_FRAMES = 91;
const LOTTIE_FPS = 60;
const LOTTIE_REFERENCE_TOTAL_MS = (LOTTIE_TOTAL_FRAMES / LOTTIE_FPS) * 1000;

/** Wall-clock budget for the publish ring + fly sequence. */
export const STORY_POST_TOTAL_MS = 1300;

const STORY_POST_TIME_SCALE = STORY_POST_TOTAL_MS / LOTTIE_REFERENCE_TOTAL_MS;

function storyPostScaledMs(referenceMs: number) {
  return Math.round(referenceMs * STORY_POST_TIME_SCALE);
}

/** Reference timings before {@link STORY_POST_TIME_SCALE} — fly 420ms, buffers 120/360ms. */
export const STORY_POST_FLY_DURATION_MS = storyPostScaledMs(420);
export const STORY_POST_FALLBACK_BUFFER_MS = storyPostScaledMs(120);
export const STORY_POST_OVERLAY_EXIT_MS = storyPostScaledMs(360);

/** Plus + breakpoints finish fading in at this progress. */
const REVEAL_PROGRESS = 0.28;

/** Clockwise spin begins here — breakpoints are visible but hold briefly first. */
const SPIN_START_PROGRESS = 0.14;

/** SVG default path 0 = 3 o'clock; rotate so path 0 sits near 12 o'clock. */
const RING_TRANSFORM_DEG = -55;

/** Ring closes at 12 o'clock — animation ends here. */
const RING_CLOSE_POINT = 0;

/** Full clockwise sweep from reveal start to close. */
const SWEEP_TO_CLOSE = 100;

/** Visible dash window — shorter on first reveal, slightly longer once spin starts. */
const REVEAL_PARTIAL_ARC = 32;
const PARTIAL_ARC = 24;

/** Gap between dash segments on the ring stroke (reference ~6px). */
const SEGMENT_GAP_PX = 6;

/** Relative dash lengths — short breakpoints plus one long arc (kept < reveal window). */
const DASH_SEGMENT_FRACTIONS = [
  0.012, 0.014, 0.016, 0.018, 0.02, 0.024, 0.028, 0.034, 0.045, 0.055, 0.16,
];

const STORY_RING_STOPS = [
  { offset: "0%", color: getColorCSSVar("SocialStoryGradientGreen1") },
  { offset: "50%", color: getColorCSSVar("SocialStoryGradientGreen2") },
  { offset: "100%", color: getColorCSSVar("SocialStoryGradientGreen3") },
];

type TrimState = { start: number; end: number; opacity: number };

/** 0 → 1 after {@link SPIN_START_PROGRESS} — full sweep through animation end. */
function spinProgress(progress: number) {
  if (progress <= SPIN_START_PROGRESS) {
    return 0;
  }
  return Math.min(1, (progress - SPIN_START_PROGRESS) / (1 - SPIN_START_PROGRESS));
}

/** Plus badge opacity — 0 at start, 1 when reveal completes (while rotation already runs). */
export function storyPostPlusOpacity(progress: number) {
  if (progress <= 0) {
    return 0;
  }
  if (progress >= REVEAL_PROGRESS) {
    return 1;
  }
  return progress / REVEAL_PROGRESS;
}

/** path 75 ≈ 9 o'clock. Reach it earlier in spinT to spend longer sweeping past nine. */
const NINE_O_CLOCK_PATH = 75;
const NINE_O_CLOCK_SPIN_T = 0.65;

/** Map spin phase to path rotation — tail from 9 o'clock → noon is stretched. */
function pathRotationFromSpin(spinT: number): number {
  if (spinT <= 0) {
    return 0;
  }
  if (spinT <= NINE_O_CLOCK_SPIN_T) {
    return (spinT / NINE_O_CLOCK_SPIN_T) * NINE_O_CLOCK_PATH;
  }
  const tailT = (spinT - NINE_O_CLOCK_SPIN_T) / (1 - NINE_O_CLOCK_SPIN_T);
  return NINE_O_CLOCK_PATH + tailT * (SWEEP_TO_CLOSE - NINE_O_CLOCK_PATH);
}

/** One full turn over the spin cycle — used by callers for frozen snapshots. */
export function storyPostRingRotationDeg(progress: number) {
  const spinT = spinProgress(progress);
  return (pathRotationFromSpin(spinT) / SWEEP_TO_CLOSE) * 360;
}

export type StoryPostRingTimeline = {
  frame: number;
  progress: number;
  rotationDeg: number;
};

export function useStoryPostRingTimeline(active: boolean): StoryPostRingTimeline {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!active) {
      setFrame(0);
      return undefined;
    }

    const startedAt = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const nextFrame = Math.min(
        LOTTIE_TOTAL_FRAMES,
        (elapsed / STORY_POST_TOTAL_MS) * LOTTIE_TOTAL_FRAMES,
      );
      setFrame(nextFrame);
      if (nextFrame < LOTTIE_TOTAL_FRAMES) {
        raf = window.requestAnimationFrame(tick);
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [active]);

  const progress = frame / LOTTIE_TOTAL_FRAMES;
  const rotationDeg = storyPostRingRotationDeg(progress);

  return { frame, progress, rotationDeg };
}

function ringStrokeWidth(size: number) {
  if (size > 72) return 4;
  if (size > 56) return 3.5;
  if (size > 40) return 3;
  if (size > 24) return 2.5;
  if (size > 20) return 2;
  return 1.5;
}

/** Story ring geometry aligned with {@link SocialAvatar}. */
export function storyRingMetrics(sizePx: number) {
  const stroke = ringStrokeWidth(sizePx);
  const ringGap = stroke;
  const avatarRadius = sizePx / 2;
  const centerRadius = avatarRadius + ringGap + stroke / 2;
  const circumferencePx = 2 * Math.PI * centerRadius;
  return { stroke, ringGap, centerRadius, circumferencePx };
}

/** Padding needed outside the avatar box so the story ring is not clipped. */
export function storyRingInsetPx(sizePx: number) {
  const { stroke, centerRadius } = storyRingMetrics(sizePx);
  const outerRadius = centerRadius + stroke / 2;
  return Math.ceil(outerRadius - sizePx / 2);
}

/** Breakpoint finished its sweep — hide dashes, snap to full ring. */
function isSpinComplete(spinT: number, pathRotation: number) {
  return spinT >= 1 && pathRotation >= SWEEP_TO_CLOSE;
}

/** Whether the ring animation has closed (full ring, no 0–90° gap). */
export function isStoryPostRingClosed(frame: number, _rotationDeg: number) {
  const progress = frame / LOTTIE_TOTAL_FRAMES;
  const spinT = spinProgress(progress);
  const pathRotation = pathRotationFromSpin(spinT);
  return isSpinComplete(spinT, pathRotation);
}

function buildDashPattern(circumferencePx: number): number[] {
  const gapUnit = (SEGMENT_GAP_PX / circumferencePx) * 100;
  const parts: number[] = [];

  for (const fraction of DASH_SEGMENT_FRACTIONS) {
    parts.push(fraction * 100);
    parts.push(gapUnit);
  }

  return parts;
}

/** Solid arc swept from 12 o'clock — retained through close. */
function sweptTrailState(spinT: number, pathRotation: number): TrimState | null {
  if (spinT <= 0 && pathRotation <= 0.01) {
    return null;
  }

  const swept = Math.min(Math.max(pathRotation, 0), SWEEP_TO_CLOSE);
  if (swept <= 0.01) {
    return null;
  }

  return {
    start: RING_CLOSE_POINT,
    end: RING_CLOSE_POINT + swept,
    opacity: 1,
  };
}

function FullRing({
  cx,
  cy,
  r,
  strokeWidth,
  gradientId,
}: {
  cx: number;
  cy: number;
  r: number;
  strokeWidth: number;
  gradientId: string;
}) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke={`url(#${gradientId})`}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      transform={`rotate(${RING_TRANSFORM_DEG} ${cx} ${cy})`}
    />
  );
}

function TrimRing({
  cx,
  cy,
  r,
  strokeWidth,
  gradientId,
  trim,
}: {
  cx: number;
  cy: number;
  r: number;
  strokeWidth: number;
  gradientId: string;
  trim: TrimState;
}) {
  const visible = Math.max(0, trim.end - trim.start);

  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke={`url(#${gradientId})`}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      pathLength={100}
      strokeDasharray={`${visible} ${100 - visible}`}
      strokeDashoffset={-trim.start}
      opacity={trim.opacity}
      transform={`rotate(${RING_TRANSFORM_DEG} ${cx} ${cy})`}
    />
  );
}

function OpenArcMask({
  id,
  cx,
  cy,
  r,
  strokeWidth,
  openStart,
  openLength,
}: {
  id: string;
  cx: number;
  cy: number;
  r: number;
  strokeWidth: number;
  openStart: number;
  openLength: number;
}) {
  if (openLength <= 0.01) {
    return null;
  }

  return (
    <mask id={id}>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="white"
        strokeWidth={strokeWidth * 2.5}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={`${openLength} ${100 - openLength}`}
        strokeDashoffset={-openStart}
        transform={`rotate(${RING_TRANSFORM_DEG} ${cx} ${cy})`}
      />
    </mask>
  );
}

/**
 * 1. Partial dashed arc fades in with the plus
 * 2. Breakpoints rotate clockwise from 12 o'clock; swept path becomes solid
 * 3. Ring closes at 12 o'clock — snap to full ring
 */
export function StoryPostRingLoader({
  frame,
  rotationDeg: _rotationDeg,
  gradientId,
  sizePx = 78,
  forceFullRing = false,
}: {
  frame: number;
  rotationDeg: number;
  gradientId: string;
  sizePx?: number;
  /** Settled inbox state — static full ring, not an animated gap-fill. */
  forceFullRing?: boolean;
}) {
  const cx = 50;
  const cy = 50;
  const { stroke, centerRadius, circumferencePx } = storyRingMetrics(sizePx);
  const r = (centerRadius / sizePx) * 100;
  const strokeWidth = (stroke / sizePx) * 100;
  const progress = frame / LOTTIE_TOTAL_FRAMES;
  const spinT = spinProgress(progress);
  const pathRotation = pathRotationFromSpin(spinT);
  const plusOpacity = storyPostPlusOpacity(progress);
  const spinComplete = isSpinComplete(spinT, pathRotation);
  const ringClosed = forceFullRing || spinComplete;
  const sweptTrail = ringClosed ? null : sweptTrailState(spinT, pathRotation);

  const dashPattern = buildDashPattern(circumferencePx).join(" ");
  const dashOffset = RING_CLOSE_POINT;
  const openStart = RING_CLOSE_POINT + pathRotation;
  const openLength = progress < REVEAL_PROGRESS ? REVEAL_PARTIAL_ARC : PARTIAL_ARC;
  const showDashed = !ringClosed && plusOpacity > 0 && openLength > 0.01;
  const openMaskId = `${gradientId}-open`;

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      viewBox="0 0 100 100"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          {STORY_RING_STOPS.map((stop) => (
            <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
          ))}
        </linearGradient>
        <OpenArcMask
          id={openMaskId}
          cx={cx}
          cy={cy}
          r={r}
          strokeWidth={strokeWidth}
          openStart={openStart}
          openLength={openLength}
        />
      </defs>
      {ringClosed ? (
        <FullRing
          cx={cx}
          cy={cy}
          r={r}
          strokeWidth={strokeWidth}
          gradientId={gradientId}
        />
      ) : sweptTrail ? (
        <TrimRing
          cx={cx}
          cy={cy}
          r={r}
          strokeWidth={strokeWidth}
          gradientId={gradientId}
          trim={sweptTrail}
        />
      ) : null}
      {showDashed ? (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={dashPattern}
          strokeDashoffset={-dashOffset}
          opacity={plusOpacity}
          mask={`url(#${openMaskId})`}
          transform={`rotate(${RING_TRANSFORM_DEG} ${cx} ${cy})`}
        />
      ) : null}
    </svg>
  );
}

export { LOTTIE_TOTAL_FRAMES };
