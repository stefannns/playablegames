/**
 * Photo-text feed card layout helpers.
 *
 * The product spec resolves the image frame in A -> C -> B order.
 * Keep this deterministic so demo data and the dev panel stay stable.
 */

export type AspectWH = readonly [w: number, h: number];

export type PhotoTextFrameworkKind = "A" | "B" | "C";

export const PHOTO_TEXT_AUTO_ASPECT: AspectWH = [3, 4] as const;

export const PHOTO_TEXT_ASPECT_POOL: readonly AspectWH[] = [
  [1, 1],
  [3, 4],
  [4, 3],
  [4, 5],
  [5, 4],
  [16, 9],
  [9, 16],
  [2, 3],
  [1, 2],
] as const;

const FRAME_GAP_TO_USERNAME_PX = 8;
const FRAME_C_EXTRA_RESERVE_PX = 20;
const FRAME_A_MAX_RATIO = 9 / 16;
const THREE_BY_FOUR_RATIO = 3 / 4;

export type PhotoTextResolvedLayout = {
  framework: PhotoTextFrameworkKind;
  naturalImageHeightPx: number;
  imageTopPx: number;
  imageHeightPx: number;
  imageContainerHeightPx: number;
  showBottomGradient: boolean;
};

export function whRatio(aspect: AspectWH): number {
  return aspect[0] / aspect[1];
}

export function photoHeightAtWidth(fullWidth: number, aspect: AspectWH): number {
  const ratio = whRatio(aspect);
  if (!Number.isFinite(ratio) || ratio <= 0) return fullWidth;
  return fullWidth / ratio;
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash || 1;
}

export function aspectsFromSeed(seed: string, count: number): AspectWH[] {
  let hash = hashString(seed);
  const out: AspectWH[] = [];

  for (let index = 0; index < count; index += 1) {
    hash = (hash * 1103515245 + 12345) >>> 0;
    out.push(PHOTO_TEXT_ASPECT_POOL[hash % PHOTO_TEXT_ASPECT_POOL.length]!);
  }

  return out;
}

function max0(value: number) {
  return Math.max(0, value);
}

export function resolvePhotoTextLayout(args: {
  aspect: AspectWH;
  cardWidthPx: number;
  cardHeightPx: number;
  tabBottomPx: number;
  tabbarHeightPx: number;
  usernameTopPx: number;
  titleLineCount: number;
  descLineCount: number;
  /** When > 1, carousel slides top-align below the Home tab row. */
  carouselSlideCount?: number;
}): PhotoTextResolvedLayout {
  void args.tabbarHeightPx;

  const aspectRatio = whRatio(args.aspect);
  const naturalImageHeightPx = photoHeightAtWidth(
    Math.max(1, args.cardWidthPx),
    args.aspect,
  );

  const containerAHeightPx = max0(args.cardHeightPx);
  const containerBHeightPx = max0(
    args.usernameTopPx - FRAME_GAP_TO_USERNAME_PX - args.tabBottomPx,
  );
  const containerC1HeightPx = max0(
    args.usernameTopPx - FRAME_GAP_TO_USERNAME_PX - args.tabBottomPx,
  );
  const containerC2HeightPx = max0(
    containerC1HeightPx - FRAME_C_EXTRA_RESERVE_PX,
  );
  const threeByFourHeightPx = photoHeightAtWidth(
    Math.max(1, args.cardWidthPx),
    [3, 4],
  );
  const photoIsAtMostThreeByFour = aspectRatio <= THREE_BY_FOUR_RATIO;
  const photoIsWiderThanThreeByFour = aspectRatio > THREE_BY_FOUR_RATIO;
  const bContainerHeightPx = photoIsAtMostThreeByFour
    ? Math.max(containerBHeightPx, threeByFourHeightPx)
    : containerBHeightPx;

  const hitsFrameworkA =
    aspectRatio <= FRAME_A_MAX_RATIO &&
    args.titleLineCount + args.descLineCount <= 3;

  if (hitsFrameworkA) {
    return {
      framework: "A",
      naturalImageHeightPx,
      imageTopPx: 0,
      imageHeightPx: containerAHeightPx,
      imageContainerHeightPx: containerAHeightPx,
      showBottomGradient: true,
    };
  }

  if (naturalImageHeightPx <= containerC1HeightPx) {
    const centeredHeightPx =
      containerC2HeightPx > 0
        ? Math.min(naturalImageHeightPx, containerC2HeightPx)
        : naturalImageHeightPx;
    const topAlignCarousel = (args.carouselSlideCount ?? 1) > 1;
    return {
      framework: "C",
      naturalImageHeightPx,
      imageTopPx: topAlignCarousel
        ? args.tabBottomPx
        : args.tabBottomPx + (containerC1HeightPx - centeredHeightPx) / 2,
      imageHeightPx: centeredHeightPx,
      imageContainerHeightPx: containerC1HeightPx,
      showBottomGradient: false,
    };
  }

  const nearFitsContainerC1 =
    containerC1HeightPx > 0 &&
    naturalImageHeightPx / containerC1HeightPx <= 1.1;

  if (
    photoIsAtMostThreeByFour &&
    containerC1HeightPx > threeByFourHeightPx
  ) {
    return {
      framework: "B",
      naturalImageHeightPx,
      imageTopPx: args.tabBottomPx,
      imageHeightPx: Math.min(naturalImageHeightPx, bContainerHeightPx),
      imageContainerHeightPx: bContainerHeightPx,
      showBottomGradient: false,
    };
  }

  if (photoIsWiderThanThreeByFour && nearFitsContainerC1) {
    return {
      framework: "C",
      naturalImageHeightPx,
      imageTopPx: args.tabBottomPx,
      imageHeightPx: containerC1HeightPx,
      imageContainerHeightPx: containerC1HeightPx,
      showBottomGradient: false,
    };
  }

  return {
    framework: "B",
    naturalImageHeightPx,
    imageTopPx: args.tabBottomPx,
    imageHeightPx: Math.min(naturalImageHeightPx, bContainerHeightPx),
    imageContainerHeightPx: bContainerHeightPx,
    showBottomGradient: false,
  };
}
