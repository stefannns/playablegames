import Lottie from "lottie-react";
import { useMemo } from "react";

import phoneAnimation from "../../../assets/lottie/phone.json";

/**
 * The phone "ring" Lottie used on the call surface and in the minimized widget,
 * ported verbatim from the VoiceCall prototype (`assets/lottie-animation/phone.json`).
 *
 * The source clip packs three labelled segments via Lottie markers:
 *   call_pending  → frames  0–60   (ringing — what we loop here)
 *   call_active   → frames 60–90
 *   call_ended    → frames 90–120
 * We only mock the ringing state, so we loop the `call_pending` segment.
 *
 * Recolor: the RN build tinted the icon through `colorFilters` keyed on a fixed
 * set of keypaths (the phone fills + the four ring strokes), all to one color —
 * white on the dark call surface, green in the widget. lottie-web has no
 * keypath color filter, so we deep-clone the JSON and rewrite every fill/stroke
 * color to the target, which is equivalent for this monochrome glyph.
 */

const CALL_PENDING_SEGMENT: [number, number] = [0, 60];

const VARIANT_RGB: Record<"white" | "green", [number, number, number]> = {
  white: [255, 255, 255],
  green: [22, 193, 93], // #16c15d
};

type ColorKeyframe = { s?: number[]; e?: number[] };
type LottieColor = { a?: number; k?: number[] | ColorKeyframe[] };
type LottieShape = {
  ty?: string;
  c?: LottieColor;
  it?: LottieShape[];
};
type LottieLayer = { shapes?: LottieShape[] };
type LottieData = { layers?: LottieLayer[] };

function recolor(data: LottieData, [r, g, b]: [number, number, number]): LottieData {
  const clone: LottieData = JSON.parse(JSON.stringify(data));
  const rgba = [r / 255, g / 255, b / 255, 1];
  // Recolor a fill/stroke color, handling both static (`a:0`, `k` is a flat
  // [r,g,b,a]) and **animated** (`a:1`, `k` is an array of keyframe objects)
  // colors. Clobbering an animated color with a flat array makes lottie-web
  // throw while reading keyframes, which blanks the whole icon — so for animated
  // colors we rewrite each keyframe's start/end value instead.
  const setColor = (c?: LottieColor) => {
    if (!c || !Array.isArray(c.k)) return;
    if (c.a === 1) {
      for (const kf of c.k as ColorKeyframe[]) {
        if (kf && Array.isArray(kf.s)) kf.s = [...rgba];
        if (kf && Array.isArray(kf.e)) kf.e = [...rgba];
      }
    } else {
      c.k = [...rgba];
    }
  };
  const walk = (shapes?: LottieShape[]) => {
    if (!shapes) return;
    for (const shape of shapes) {
      if (shape.ty === "fl" || shape.ty === "st") setColor(shape.c);
      if (shape.it) walk(shape.it);
    }
  };
  for (const layer of clone.layers ?? []) walk(layer.shapes);
  return clone;
}

export function CallPhoneLottie({
  size,
  variant,
}: {
  size: number;
  variant: "white" | "green";
}) {
  const data = useMemo(
    () => recolor(phoneAnimation as LottieData, VARIANT_RGB[variant]),
    [variant],
  );

  return (
    <Lottie
      animationData={data}
      loop
      autoplay
      initialSegment={CALL_PENDING_SEGMENT}
      style={{ width: size, height: size }}
      rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
    />
  );
}
