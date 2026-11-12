import type { CSSProperties } from "react";

import type { AlbumThumbnailLaunchFrom } from "./album_thumbnail_launch_motion";

/** Absolute photo box inside the preview canvas (px). */
export type PhotoBoxLayout = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Aspect-fill — matches grid tile `object-cover`. */
export function computeAspectFillLayout(
  imageWidth: number,
  imageHeight: number,
  boxWidth: number,
  boxHeight: number,
): PhotoBoxLayout {
  if (imageWidth <= 0 || imageHeight <= 0 || boxWidth <= 0 || boxHeight <= 0) {
    return { left: 0, top: 0, width: boxWidth, height: boxHeight };
  }

  const scale = Math.max(boxWidth / imageWidth, boxHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    width,
    height,
    left: (boxWidth - width) / 2,
    top: (boxHeight - height) / 2,
  };
}

/** Aspect-fit — settled preview shows the full image. */
export function computeAspectFitLayout(
  imageWidth: number,
  imageHeight: number,
  boxWidth: number,
  boxHeight: number,
): PhotoBoxLayout {
  if (imageWidth <= 0 || imageHeight <= 0 || boxWidth <= 0 || boxHeight <= 0) {
    return { left: 0, top: 0, width: boxWidth, height: boxHeight };
  }

  const scale = Math.min(boxWidth / imageWidth, boxHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    width,
    height,
    left: (boxWidth - width) / 2,
    top: (boxHeight - height) / 2,
  };
}

/**
 * Map the square thumbnail's aspect-fill crop into preview-canvas coordinates.
 * Keeps the same visible pixels as the tapped grid cell at animation start.
 */
export function computeThumbnailCoverInCanvas(
  imageWidth: number,
  imageHeight: number,
  _canvasWidth: number,
  _canvasHeight: number,
  thumbnail: AlbumThumbnailLaunchFrom,
  canvasViewportRect: DOMRectReadOnly,
): PhotoBoxLayout {
  const coverInThumb = computeAspectFillLayout(
    imageWidth,
    imageHeight,
    thumbnail.width,
    thumbnail.height,
  );
  const offsetX = thumbnail.left - canvasViewportRect.left;
  const offsetY = thumbnail.top - canvasViewportRect.top;

  return {
    left: offsetX + coverInThumb.left,
    top: offsetY + coverInThumb.top,
    width: coverInThumb.width,
    height: coverInThumb.height,
  };
}

export function photoBoxLayoutToCss(layout: PhotoBoxLayout): CSSProperties {
  return {
    position: "absolute",
    left: layout.left,
    top: layout.top,
    width: layout.width,
    height: layout.height,
  };
}
