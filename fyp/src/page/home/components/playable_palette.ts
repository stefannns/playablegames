import { useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";

export type RGB = readonly [number, number, number];
export const PLAYABLE_MEDIA = {
  src: "/resource/playable-feed/pocket-game.html",
  palette: {
    sampleFraction: 0.25,
    lightnessThreshold: 60,
    lightnessReduction: 30,
    // An unknown game must not inherit the lawn demo's blue/green palette.
    // Neutral loading chrome is replaced atomically by its first valid sample.
    fallbackTop: [23, 23, 23] as RGB,
    fallbackBottom: [23, 23, 23] as RGB,
    // Set either override when art direction needs a specific color.
    topOverride: undefined as RGB | undefined,
    bottomOverride: undefined as RGB | undefined,
  },
};

// Precomputed from each game's first screen with dominantColor below (the lawn game's scene is seeded: 20260924).
// Ship this asset's palette with its preview: even a cold page load must not
// first paint the generic blue fallback and recolor after the iframe loads.
// A different media URL still uses the sampling path below to derive its palette.
const initialPalettes = new Map<string, { top: RGB; bottom: RGB }>([
  ["/resource/playable-feed/pocket-game.html", { top: [19, 37, 19], bottom: [15, 91, 5] }],
  ["/resource/playable-feed/pocket-FxQaSVTWh-game.html", { top: [121, 169, 200], bottom: [93, 114, 137] }],
  // Mangaka's landing screen is DOM-based; its background is the initial main color.
  ["/resource/playable-feed/pocket-Fzo2A3wUt-game.html", { top: [250, 248, 242], bottom: [250, 248, 242] }],
  // The pumpkin and the Flora library games: sampled once from each game's first screen (headless Chrome
  // at 390×598 → 32×48, top / bottom 12 rows, dominantColor), so their cards paint final colors at once
  // and never recolor on arrival. Re-sample after a library refresh changes a game's first screen.
  ["/resource/playable-feed/pocket-F3950QIMH-game.html", { top: [35, 52, 76], bottom: [54, 56, 69] }],
  ["/resource/playable-library/01/index.html", { top: [248, 242, 232], bottom: [245, 239, 228] }],
  ["/resource/playable-library/02/index.html", { top: [251, 244, 235], bottom: [241, 233, 222] }],
  ["/resource/playable-library/03/index.html", { top: [250, 249, 246], bottom: [250, 249, 246] }],
  ["/resource/playable-library/04/index.html", { top: [245, 234, 245], bottom: [234, 217, 239] }],
  ["/resource/playable-library/05/index.html", { top: [20, 2, 0], bottom: [19, 2, 0] }],
  ["/resource/playable-library/06/index.html", { top: [187, 204, 218], bottom: [184, 201, 216] }],
  ["/resource/playable-library/07/index.html", { top: [23, 36, 45], bottom: [28, 36, 44] }],
  ["/resource/playable-library/08a/index.html", { top: [242, 236, 238], bottom: [245, 241, 236] }],
  ["/resource/playable-library/08b/index.html", { top: [244, 246, 250], bottom: [244, 246, 250] }],
  ["/resource/playable-library/09/index.html", { top: [249, 243, 229], bottom: [242, 236, 222] }],
  ["/resource/playable-library/10a/index.html", { top: [253, 251, 247], bottom: [253, 251, 247] }],
  ["/resource/playable-library/11a/index.html", { top: [246, 242, 231], bottom: [246, 242, 231] }],
  ["/resource/playable-library/10b/index.html", { top: [252, 251, 244], bottom: [243, 243, 233] }],
  ["/resource/playable-library/11b/index.html", { top: [26, 89, 71], bottom: [25, 88, 70] }],
  ["/resource/playable-library/12/index.html", { top: [245, 243, 236], bottom: [245, 243, 236] }],
  ["/resource/playable-library/13/index.html", { top: [244, 238, 232], bottom: [244, 238, 232] }],
  ["/resource/playable-library/14/index.html", { top: [94, 93, 84], bottom: [78, 45, 26] }],
  ["/resource/playable-library/15/index.html", { top: [138, 140, 135], bottom: [122, 123, 123] }],
  ["/resource/playable-library/16/index.html", { top: [253, 247, 241], bottom: [253, 246, 241] }],
  ["/resource/playable-library/17/index.html", { top: [245, 240, 230], bottom: [245, 240, 231] }],
  ["/resource/playable-library/18/index.html", { top: [245, 242, 235], bottom: [245, 242, 235] }],
  ["/resource/playable-library/19/index.html", { top: [26, 21, 20], bottom: [26, 21, 20] }],
  ["/resource/playable-library/20/index.html", { top: [238, 231, 217], bottom: [239, 232, 218] }],
  ["/resource/playable-library/21/index.html", { top: [243, 240, 229], bottom: [243, 240, 229] }],
  ["/resource/playable-library/22/index.html", { top: [20, 37, 44], bottom: [20, 37, 44] }],
  ["/resource/playable-library/23/index.html", { top: [243, 240, 231], bottom: [243, 240, 231] }],
  ["/resource/playable-library/24/index.html", { top: [171, 167, 156], bottom: [171, 167, 156] }],
  ["/resource/playable-library/25/index.html", { top: [49, 48, 47], bottom: [49, 48, 47] }],
  ["/resource/playable-library/26/index.html", { top: [246, 240, 223], bottom: [246, 240, 223] }],
]);

/**
 * Bright main colors drop L by `reduction`, keeping hue and chroma (spec: "Chroma 值和 Hue 值不变").
 * Not HSL saturation: a near-white cream has ~53% saturation but ~6% chroma, so holding saturation
 * would turn it mustard once darkened; holding chroma keeps it a neutral warm grey.
 * Cap the result's HSL saturation at 50, matching upstream 155c64d9's normal-feed rules.
 * The optional lightness floor defaults to off; no tuner settings affect this feed.
 */
export function adjustLightness(rgb: RGB, threshold = 60, reduction = 30, maxSaturation = 50, minLightness = 0): RGB {
  const channels = rgb.map((value) => value / 255);
  const max = Math.max(...channels), min = Math.min(...channels);
  const lightness = (max + min) / 2;
  const delta = max - min;
  // Tuner-only floor (0 = off): keep default normal-feed behavior unchanged below threshold.
  if (lightness * 100 < minLightness) {
    const liftedL = minLightness / 100;
    const chroma = Math.min(delta, 1 - Math.abs(2 * liftedL - 1));
    const offset = liftedL - chroma / 2;
    return channels.map((value) => Math.round(255 * (delta ? (value - min) / delta * chroma + offset : liftedL))) as unknown as RGB;
  }
  if (lightness * 100 < threshold) return rgb;
  const nextL = Math.max(0, lightness - reduction / 100);
  // Chroma = max − min; HSL saturation = chroma / (1 − |2L − 1|).
  const chroma = Math.min(delta, (maxSaturation / 100) * (1 - Math.abs(2 * nextL - 1)));
  const offset = nextL - chroma / 2;
  return channels.map((value) => Math.round(255 * (delta ? (value - min) / delta * chroma + offset : nextL))) as unknown as RGB;
}

/** Color Export `mergingTolerance`: colors within this RGB distance count as one swatch. */
const MERGING_TOLERANCE = 30;

/**
 * The band's main color, as the design team's Color Export reads it: 16-level buckets, merged greedily
 * from the most populous down (each joins the first swatch within MERGING_TOLERANCE of its color); the
 * biggest swatch wins and reports its own seed color — a real color in the image, not a blend of the swatch.
 */
export function dominantColor(pixels: Uint8ClampedArray): RGB | undefined {
  const buckets = new Map<number, { count: number; sum: number[] }>();
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue;
    const key = (pixels[i] >> 4) * 256 + (pixels[i + 1] >> 4) * 16 + (pixels[i + 2] >> 4);
    const bucket = buckets.get(key) ?? { count: 0, sum: [0, 0, 0] };
    bucket.count++;
    for (let c = 0; c < 3; c++) bucket.sum[c] += pixels[i + c];
    buckets.set(key, bucket);
  }
  const swatches: { seed: number[]; count: number }[] = [];
  for (const bucket of [...buckets.values()].sort((a, b) => b.count - a.count)) {
    const color = bucket.sum.map((value) => value / bucket.count);
    const swatch = swatches.find((candidate) => Math.hypot(...candidate.seed.map((value, c) => value - color[c])) <= MERGING_TOLERANCE);
    if (swatch) swatch.count += bucket.count;
    else swatches.push({ seed: color, count: bucket.count });
  }
  const winner = swatches.reduce<(typeof swatches)[number] | undefined>((best, swatch) => (!best || swatch.count > best.count ? swatch : best), undefined);
  return winner?.seed.map(Math.round) as RGB | undefined;
}

/** Samples the rendered, cropped Playable content, before the feed overlays. */
export function usePlayablePalette(cardRef: RefObject<HTMLElement | null>, mediaSrc: string = PLAYABLE_MEDIA.src) {
  const config = PLAYABLE_MEDIA.palette;
  const cached = initialPalettes.get(mediaSrc);
  const resolve = (color: RGB, override: RGB | undefined) =>
    override ?? adjustLightness(color, config.lightnessThreshold, config.lightnessReduction);
  const initialStyle = {
    "--playable-top-rgb": resolve(cached?.top ?? config.fallbackTop, config.topOverride).join(" "),
    "--playable-bottom-rgb": resolve(cached?.bottom ?? config.fallbackBottom, config.bottomOverride).join(" "),
  } as CSSProperties;
  const [paletteState, setPaletteState] = useState(() => ({ mediaSrc, style: initialStyle }));
  useLayoutEffect(() => {
    const setStyle = (style: CSSProperties) => setPaletteState({ mediaSrc, style });
    const card = cardRef.current;
    const image = card?.querySelector<HTMLImageElement>(".playable-stage-photo");
    const stage = image?.parentElement;
    const frame = card?.closest<HTMLElement>("[data-app-frame-root]");
    const iframe = card?.querySelector<HTMLIFrameElement>("iframe");
    if (iframe && frame) {
      const saved = initialPalettes.get(mediaSrc);
      const normalize = (color: RGB, override: RGB | undefined) =>
        override ?? adjustLightness(color, config.lightnessThreshold, config.lightnessReduction);
      let top = normalize(saved?.top ?? config.fallbackTop, config.topOverride);
      let bottom = normalize(saved?.bottom ?? config.fallbackBottom, config.bottomOverride);
      let initialPaletteCaptured = Boolean(saved);
      const update = () => setStyle({
        "--playable-top-rgb": top.join(" "),
        "--playable-bottom-rgb": bottom.join(" "),
        "--playable-screen-height": `${frame.getBoundingClientRect().height}px`,
      } as CSSProperties);
      const receive = (event: MessageEvent) => {
        if (event.source !== iframe.contentWindow || event.data?.type !== "playable-palette") return;
        // Keep the feed palette tied to the initial scene, not gameplay progress.
        if (card?.dataset.playing === "true" || initialPaletteCaptured) return;
        const valid = (value: unknown): value is number[] => Array.isArray(value) && value.length === 1536 && value.every(v => Number.isInteger(v) && v >= 0 && v <= 255);
        if (!valid(event.data.top) || !valid(event.data.bottom)) return;
        const sampledTop = dominantColor(new Uint8ClampedArray(event.data.top));
        const sampledBottom = dominantColor(new Uint8ClampedArray(event.data.bottom));
        if (!sampledTop || !sampledBottom) return;
        initialPalettes.set(mediaSrc, { top: sampledTop, bottom: sampledBottom });
        initialPaletteCaptured = true;
        // Install both bands together. Animating from an unrelated loading
        // palette creates a visible wrong-color flash as the card enters.
        top = normalize(sampledTop, config.topOverride);
        bottom = normalize(sampledBottom, config.bottomOverride);
        update();
      };
      window.addEventListener("message", receive);
      const observer = new ResizeObserver(update); observer.observe(frame); update();
      return () => { window.removeEventListener("message", receive); observer.disconnect(); };
    }
    if (!card || !image || !stage || !frame) return;
    let cancelled = false;
    const sample = () => {
      if (cancelled) return;
      const stageRect = stage.getBoundingClientRect();
      if (!stageRect.width || !stageRect.height) return;
      let top = config.fallbackTop, bottom = config.fallbackBottom;
      if (image.complete && image.naturalWidth > 0) {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 96;
          canvas.height = Math.max(4, Math.round(96 * stageRect.height / stageRect.width));
          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (context) {
            const rect = image.getBoundingClientRect();
            const fit = Math.max(rect.width / image.naturalWidth, rect.height / image.naturalHeight);
            const width = image.naturalWidth * fit, height = image.naturalHeight * fit;
            const scale = canvas.width / stageRect.width;
            context.drawImage(image, (rect.left - stageRect.left + (rect.width - width) / 2) * scale, (rect.top - stageRect.top + (rect.height - height) / 2) * scale, width * scale, height * scale);
            const band = Math.max(1, Math.floor(canvas.height * config.sampleFraction));
            top = dominantColor(context.getImageData(0, 0, canvas.width, band).data) ?? top;
            bottom = dominantColor(context.getImageData(0, canvas.height - band, canvas.width, band).data) ?? bottom;
          }
        } catch { /* Cross-origin or unavailable media: retain configured fallback. */ }
      }
      setStyle({
        "--playable-top-rgb": (config.topOverride ?? adjustLightness(top, config.lightnessThreshold, config.lightnessReduction)).join(" "),
        "--playable-bottom-rgb": (config.bottomOverride ?? adjustLightness(bottom, config.lightnessThreshold, config.lightnessReduction)).join(" "),
        "--playable-screen-height": `${frame.getBoundingClientRect().height}px`,
      } as CSSProperties);
    };
    const observer = new ResizeObserver(sample);
    observer.observe(frame); observer.observe(stage);
    image.addEventListener("load", sample);
    sample();
    return () => { cancelled = true; observer.disconnect(); image.removeEventListener("load", sample); };
  }, [cardRef, config, mediaSrc]);
  // A recycled card must never paint a previous game's palette for one frame.
  return paletteState.mediaSrc === mediaSrc ? paletteState.style : initialStyle;
}
