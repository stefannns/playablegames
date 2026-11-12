/** Thumbnail bounds when opening a fullscreen layer from an album grid cell. */
export type AlbumThumbnailLaunchFrom = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type AlbumLaunchMotion = {
  originX: number;
  originY: number;
  collapsed: string;
  expanded: string;
};

/** iOS hero — animate photo bounds (not non-uniform scale) with aspect-fill inside. */
export type AlbumFrameRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type AlbumFrameMotion = {
  collapsed: AlbumFrameRect;
  expanded: AlbumFrameRect;
};

/** Fixed expanded viewport + transform scale — keeps cover crop stable during zoom. */
export type AlbumTransformHeroMotion = {
  expandedFrame: AlbumFrameRect;
  originX: number;
  originY: number;
  collapsed: string;
  expanded: string;
};

export const ALBUM_THUMBNAIL_ZOOM_IN_DURATION_MS = 250;
export const ALBUM_THUMBNAIL_ZOOM_OUT_DURATION_MS = 200;
/** Shared ease for enter layer zoom + exit canvas shrink. */
export const ALBUM_THUMBNAIL_ZOOM_EASE = "cubic-bezier(0.33, 1, 0.68, 1)";
export const ALBUM_THUMBNAIL_ZOOM_IN_EASE = ALBUM_THUMBNAIL_ZOOM_EASE;
export const ALBUM_THUMBNAIL_ZOOM_OUT_EASE = ALBUM_THUMBNAIL_ZOOM_EASE;
/** Framer Motion cubic-bezier tuple — matches {@link ALBUM_THUMBNAIL_ZOOM_IN_EASE}. */
export const ALBUM_THUMBNAIL_ZOOM_IN_MOTION_EASE = [0.33, 1, 0.68, 1] as const;
/** Start/end scale for the zoom transition — 1 matches the tapped album cell size. */
export const ALBUM_THUMBNAIL_ZOOM_FROM_SCALE = 1;

function collapseScale(from: AlbumThumbnailLaunchFrom, canvasRect: DOMRectReadOnly) {
  return {
    sx: (from.width / canvasRect.width) * ALBUM_THUMBNAIL_ZOOM_FROM_SCALE,
    sy: (from.height / canvasRect.height) * ALBUM_THUMBNAIL_ZOOM_FROM_SCALE,
  };
}

/** Exit: canvas lands on the album thumbnail (collapsed end-state). */
export function albumExitCanvasMotion(
  from: AlbumThumbnailLaunchFrom,
  canvasRect: DOMRectReadOnly,
): AlbumLaunchMotion | null {
  if (canvasRect.width <= 0 || canvasRect.height <= 0 || from.width <= 0 || from.height <= 0) {
    return null;
  }

  const { sx, sy } = collapseScale(from, canvasRect);
  const originX = from.left + from.width / 2 - canvasRect.left;
  const originY = from.top + from.height / 2 - canvasRect.top;
  const dx = from.left - canvasRect.left - originX * (1 - sx);
  const dy = from.top - canvasRect.top - originY * (1 - sy);

  return {
    originX,
    originY,
    collapsed: `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`,
    expanded: "translate3d(0, 0, 0) scale(1)",
  };
}

/**
 * Enter: whole layer scales up using the same photo scale as exit.
 * Anchor stays at the album thumbnail center; only translate differs for layer vs canvas.
 */
export function albumEnterLayerMotion(
  from: AlbumThumbnailLaunchFrom,
  layerRect: DOMRectReadOnly,
  canvasRect: DOMRectReadOnly,
): AlbumLaunchMotion | null {
  if (
    layerRect.width <= 0 ||
    layerRect.height <= 0 ||
    canvasRect.width <= 0 ||
    canvasRect.height <= 0 ||
    from.width <= 0 ||
    from.height <= 0
  ) {
    return null;
  }

  const { sx, sy } = collapseScale(from, canvasRect);
  const originX = from.left + from.width / 2 - layerRect.left;
  const originY = from.top + from.height / 2 - layerRect.top;
  const dx = from.left - layerRect.left - originX * (1 - sx);
  const dy = from.top - layerRect.top - originY * (1 - sy);

  return {
    originX,
    originY,
    collapsed: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
    expanded: "scale(1)",
  };
}

export function syncEnterLayerMotion(
  layer: HTMLDivElement | null,
  canvas: HTMLDivElement | null,
  from: AlbumThumbnailLaunchFrom | null,
): AlbumLaunchMotion | null {
  if (!layer || !canvas || !from) {
    return null;
  }
  return albumEnterLayerMotion(from, layer.getBoundingClientRect(), canvas.getBoundingClientRect());
}

export function syncExitCanvasMotion(
  canvas: HTMLDivElement | null,
  from: AlbumThumbnailLaunchFrom | null,
): AlbumLaunchMotion | null {
  if (!canvas || !from) {
    return null;
  }
  return albumExitCanvasMotion(from, canvas.getBoundingClientRect());
}

function domRectToFrameRect(rect: AlbumThumbnailLaunchFrom | DOMRectReadOnly): AlbumFrameRect {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

/**
 * Hero frame morph in viewport coordinates — pair with `position: fixed` on the
 * photo so the collapsed state lands exactly on the tapped thumbnail.
 */
export function albumViewportFrameMotion(
  from: AlbumThumbnailLaunchFrom,
  targetRect: DOMRectReadOnly,
): AlbumFrameMotion | null {
  if (targetRect.width <= 0 || targetRect.height <= 0 || from.width <= 0 || from.height <= 0) {
    return null;
  }

  return {
    collapsed: domRectToFrameRect(from),
    expanded: domRectToFrameRect(targetRect),
  };
}

export function syncAlbumFrameMotion(
  target: HTMLDivElement | null,
  from: AlbumThumbnailLaunchFrom | null,
): AlbumFrameMotion | null {
  if (!target || !from) {
    return null;
  }
  return albumViewportFrameMotion(from, target.getBoundingClientRect());
}

function albumTransformHeroMotion(
  from: AlbumThumbnailLaunchFrom,
  targetRect: DOMRectReadOnly,
): AlbumTransformHeroMotion | null {
  if (targetRect.width <= 0 || targetRect.height <= 0 || from.width <= 0 || from.height <= 0) {
    return null;
  }

  const { sx, sy } = collapseScale(from, targetRect);
  const originX = from.left + from.width / 2 - targetRect.left;
  const originY = from.top + from.height / 2 - targetRect.top;
  const dx = from.left - targetRect.left - originX * (1 - sx);
  const dy = from.top - targetRect.top - originY * (1 - sy);

  return {
    expandedFrame: domRectToFrameRect(targetRect),
    originX,
    originY,
    collapsed: `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`,
    expanded: "translate3d(0, 0, 0) scale(1)",
  };
}

export function syncAlbumTransformHeroMotion(
  target: HTMLDivElement | null,
  from: AlbumThumbnailLaunchFrom | null,
): AlbumTransformHeroMotion | null {
  if (!target || !from) {
    return null;
  }
  return albumTransformHeroMotion(from, target.getBoundingClientRect());
}

export function rectToLaunchFrom(rect: DOMRectReadOnly): AlbumThumbnailLaunchFrom {
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
}

export function thumbnailRectFromElement(element: HTMLElement): AlbumThumbnailLaunchFrom {
  return rectToLaunchFrom(element.getBoundingClientRect());
}

/** Re-measure the album cell on exit so the shrink lands on the live grid position. */
export function refreshAlbumThumbnailRect(
  src: string,
  hint: AlbumThumbnailLaunchFrom | null,
  srcAttribute = "data-album-thumbnail-src",
  tileScopeAttribute?: string,
): AlbumThumbnailLaunchFrom | null {
  const selector = tileScopeAttribute
    ? `[${tileScopeAttribute}][${srcAttribute}]`
    : `[${srcAttribute}]`;
  const buttons = document.querySelectorAll<HTMLElement>(selector);
  let best: AlbumThumbnailLaunchFrom | null = null;
  let bestDist = Infinity;

  for (const button of buttons) {
    if (button.getAttribute(srcAttribute) !== src) {
      continue;
    }
    const candidate = thumbnailRectFromElement(button);
    if (!hint) {
      return candidate;
    }
    const dx = candidate.left + candidate.width / 2 - (hint.left + hint.width / 2);
    const dy = candidate.top + candidate.height / 2 - (hint.top + hint.height / 2);
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      best = candidate;
    }
  }

  return best ?? hint;
}
