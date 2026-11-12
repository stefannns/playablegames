import type { FeedItemCardContent } from "../home/components/feed_item_card";

export const PHOTO_TEXT_DETAIL_PATH = "/photo_text_detail";
export const HOME_FEED_PARAM = "feed";
export const HOME_FEED_IMAGE_PARAM = "image";
const EXPLORE_DETAIL_PARAM = "exploreDetail";
const DETAIL_SNAPSHOT_PREFIX = "photo-text-detail:";
const DETAIL_SOURCE_FRAME_PREFIX = "photo-text-detail-frame:";
export const PHOTO_TEXT_SHARED_IMAGE_TRANSITION_NAME =
  "photo-text-shared-image";
const PHOTO_TEXT_TRANSITION_ATTR = "data-photo-text-transition";
const PHOTO_TEXT_FEED_IMAGE_TARGET_ATTR = "data-photo-text-feed-image-target";
const PHOTO_TEXT_FEED_RIGHT_RAIL_TARGET_ATTR =
  "data-photo-text-feed-right-rail-target";
const PHOTO_TEXT_EXIT_TARGET_ACTIVE_ATTR =
  "data-photo-text-exit-target-active";
const PHOTO_TEXT_LOCAL_ENTER_ATTR = "data-photo-text-local-enter";
const PHOTO_TEXT_DETAIL_IMAGE_TARGET_ATTR =
  "data-photo-text-detail-image-target";
const PHOTO_TEXT_EXIT_AUX_FADE_MS = 90;
const PHOTO_TEXT_FEED_ROOT_SELECTOR = "[data-feed-photo-carousel]";

type PhotoTextTransitionMode = "detail-enter" | "detail-exit";
type PhotoTextExitLayerKey = "image" | "header" | "body" | "action";
type PhotoTextExitLayerSpec = {
  key: PhotoTextExitLayerKey;
  element: HTMLElement;
  rectOverride?: Pick<DOMRect, "left" | "top" | "width" | "height">;
  rootElement?: HTMLElement | null;
  stripSelector?: string;
};
type PendingPhotoTextExitTransition = {
  overlayRoot: HTMLDivElement;
  layers: Record<PhotoTextExitLayerKey, HTMLDivElement>;
  targetFeedId: string;
  imageIndex: number;
  targetElement: HTMLElement | null;
  targetRightRailElement: HTMLElement | null;
  targetRightRailLayer: HTMLDivElement | null;
  targetRightRailPreviousOpacity: string | null;
  targetRightRailPreviousTransition: string | null;
  cleanupTimerId: number | null;
};

let pendingPhotoTextExitTransition: PendingPhotoTextExitTransition | null = null;
let pendingPhotoTextEnterTransition:
  | {
      overlayRoot: HTMLDivElement;
      imageLayer: HTMLDivElement;
      imageIndex: number;
      targetElement: HTMLElement | null;
      cleanupTimerId: number | null;
    }
  | null = null;
const detailSnapshotMemory = new Map<string, FeedItemCardContent>();
const detailSourceFrameMemory = new Map<string, PhotoTextDetailSourceFrame>();

export type PhotoTextDetailRouteState = {
  feedId: string | null;
  imageIndex: number;
  returnFeedId: string | null;
};

export type PhotoTextDetailSourceFrame = {
  frameHeightRatio: number;
  objectPosition: string;
  aspect?: readonly [number, number];
  aspects?: readonly (readonly [number, number])[];
};

export function buildPhotoTextDetailHref(feedId: string, imageIndex = 0) {
  const params = new URLSearchParams({
    feed: feedId,
    image: String(Math.max(0, imageIndex)),
    returnFeed: feedId,
  });
  return `${PHOTO_TEXT_DETAIL_PATH}?${params.toString()}`;
}

export function buildHomeFeedHref(feedId: string | null, imageIndex?: number) {
  if (!feedId) return "/app/home";
  const params = new URLSearchParams({
    [HOME_FEED_PARAM]: feedId,
  });
  if (imageIndex != null && Number.isFinite(imageIndex) && imageIndex >= 0) {
    params.set(HOME_FEED_IMAGE_PARAM, String(Math.floor(imageIndex)));
  }
  return `/app/home?${params.toString()}`;
}

export function navigateWithinApp(href: string, options?: { replace?: boolean }) {
  if (typeof window === "undefined") return;
  const nextUrl = new URL(href, window.location.origin);
  const currentUrl = new URL(window.location.href);
  const nextLocation = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
  const currentLocation = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
  if (nextLocation === currentLocation) return;
  if (options?.replace) {
    window.history.replaceState({}, "", nextLocation);
  } else {
    window.history.pushState({}, "", nextLocation);
  }
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function cleanupPendingPhotoTextExitTransition() {
  if (!pendingPhotoTextExitTransition) return;
  if (pendingPhotoTextExitTransition.cleanupTimerId != null) {
    window.clearTimeout(pendingPhotoTextExitTransition.cleanupTimerId);
  }
  pendingPhotoTextExitTransition.targetElement?.removeAttribute(
    PHOTO_TEXT_EXIT_TARGET_ACTIVE_ATTR,
  );
  if (pendingPhotoTextExitTransition.targetElement) {
    pendingPhotoTextExitTransition.targetElement.style.opacity = "";
    pendingPhotoTextExitTransition.targetElement.style.transition = "";
  }
  if (pendingPhotoTextExitTransition.targetRightRailElement) {
    pendingPhotoTextExitTransition.targetRightRailElement.style.opacity =
      pendingPhotoTextExitTransition.targetRightRailPreviousOpacity ?? "";
    pendingPhotoTextExitTransition.targetRightRailElement.style.transition =
      pendingPhotoTextExitTransition.targetRightRailPreviousTransition ?? "";
  }
  pendingPhotoTextExitTransition.overlayRoot.remove();
  pendingPhotoTextExitTransition = null;
}

export function cancelPendingPhotoTextExitTransition() {
  cleanupPendingPhotoTextExitTransition();
}

function cleanupPendingPhotoTextEnterTransition() {
  if (!pendingPhotoTextEnterTransition) return;
  if (pendingPhotoTextEnterTransition.cleanupTimerId != null) {
    window.clearTimeout(pendingPhotoTextEnterTransition.cleanupTimerId);
  }
  if (pendingPhotoTextEnterTransition.targetElement) {
    pendingPhotoTextEnterTransition.targetElement.style.opacity = "";
    pendingPhotoTextEnterTransition.targetElement.style.transition = "";
  }
  document.documentElement.removeAttribute(PHOTO_TEXT_LOCAL_ENTER_ATTR);
  pendingPhotoTextEnterTransition.overlayRoot.remove();
  pendingPhotoTextEnterTransition = null;
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (updateCallback: () => void | Promise<void>) => {
    finished: Promise<void>;
    ready: Promise<void>;
    updateCallbackDone: Promise<void>;
  };
};

function hasExploreDetailSearch(search: string) {
  return new URLSearchParams(search).get(EXPLORE_DETAIL_PARAM) === "1";
}

function getPhotoTextTransitionMode(
  currentUrl: URL,
  nextUrl: URL,
): PhotoTextTransitionMode | null {
  const isCurrentDetail =
    currentUrl.pathname === PHOTO_TEXT_DETAIL_PATH ||
    hasExploreDetailSearch(currentUrl.search);
  const isNextDetail =
    nextUrl.pathname === PHOTO_TEXT_DETAIL_PATH ||
    hasExploreDetailSearch(nextUrl.search);
  if (!isCurrentDetail && isNextDetail) return "detail-enter";
  if (isCurrentDetail && !isNextDetail) return "detail-exit";
  return null;
}

function clearFeedSharedImageTransitionNames() {
  document
    .querySelectorAll<HTMLElement>(`[${PHOTO_TEXT_FEED_IMAGE_TARGET_ATTR}]`)
    .forEach((element) => {
      if (
        element.style.viewTransitionName ===
        PHOTO_TEXT_SHARED_IMAGE_TRANSITION_NAME
      ) {
        element.style.viewTransitionName = "none";
      }
    });
}

export function navigateWithSharedImageTransition(
  href: string,
  options?: { replace?: boolean },
) {
  if (typeof document === "undefined") {
    navigateWithinApp(href, options);
    return;
  }

  const doc = document as ViewTransitionDocument;
  const currentUrl = new URL(window.location.href);
  const nextUrl = new URL(href, window.location.origin);
  const transitionMode = getPhotoTextTransitionMode(currentUrl, nextUrl);

  if (transitionMode) {
    document.documentElement.setAttribute(
      PHOTO_TEXT_TRANSITION_ATTR,
      transitionMode,
    );
  } else {
    document.documentElement.removeAttribute(PHOTO_TEXT_TRANSITION_ATTR);
  }

  if (typeof doc.startViewTransition === "function") {
    const transition = doc.startViewTransition(() => {
      if (transitionMode === "detail-enter") {
        clearFeedSharedImageTransitionNames();
      }
      navigateWithinApp(href, options);
    });
    transition.finished.finally(() => {
      document.documentElement.removeAttribute(PHOTO_TEXT_TRANSITION_ATTR);
    });
    return;
  }

  document.documentElement.removeAttribute(PHOTO_TEXT_TRANSITION_ATTR);
  navigateWithinApp(href, options);
}

function createFixedCloneLayer({
  element,
  key,
  rectOverride,
  rootElement,
  stripSelector,
}: PhotoTextExitLayerSpec) {
  const rect = rectOverride ?? element.getBoundingClientRect();
  const rootRect = rootElement?.getBoundingClientRect();
  const layer = document.createElement("div");
  layer.dataset.photoTextExitLayer = key;
  layer.style.position = rootElement ? "absolute" : "fixed";
  layer.style.left = `${rect.left - (rootRect?.left ?? 0)}px`;
  layer.style.top = `${rect.top - (rootRect?.top ?? 0)}px`;
  layer.style.width = `${rect.width}px`;
  layer.style.height = `${rect.height}px`;
  layer.style.margin = "0";
  layer.style.pointerEvents = "none";
  layer.style.transformOrigin = "top left";
  layer.style.willChange = "left, top, width, height, opacity";
  layer.style.zIndex = key === "image" ? "3" : "4";

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.width = "100%";
  clone.style.height = "100%";
  clone.style.margin = "0";
  clone.style.pointerEvents = "none";
  if (stripSelector) {
    clone.querySelectorAll(stripSelector).forEach((node) => node.remove());
  }
  layer.appendChild(clone);
  return layer;
}

function createAppFrameClippedOverlayRoot(rootElement: HTMLElement | null) {
  const rootRect = rootElement?.getBoundingClientRect();
  const overlayRoot = document.createElement("div");
  overlayRoot.style.position = "fixed";
  overlayRoot.style.left = `${rootRect?.left ?? 0}px`;
  overlayRoot.style.top = `${rootRect?.top ?? 0}px`;
  overlayRoot.style.width = `${rootRect?.width ?? window.innerWidth}px`;
  overlayRoot.style.height = `${rootRect?.height ?? window.innerHeight}px`;
  overlayRoot.style.margin = "0";
  overlayRoot.style.overflow = "hidden";
  overlayRoot.style.pointerEvents = "none";
  overlayRoot.style.zIndex = "5000";

  if (rootElement) {
    const rootStyle = window.getComputedStyle(rootElement);
    overlayRoot.style.borderRadius = rootStyle.borderRadius;
  }

  return overlayRoot;
}

function scopeExitOverlayToFeedTarget({
  target,
  overlayRoot,
  layers,
}: {
  target: HTMLElement;
  overlayRoot: HTMLDivElement;
  layers: Record<PhotoTextExitLayerKey, HTMLDivElement>;
}) {
  const feedRoot = target.closest<HTMLElement>(PHOTO_TEXT_FEED_ROOT_SELECTOR);
  if (!feedRoot) return false;
  if (overlayRoot.parentElement === feedRoot) return true;

  const layerRects = Object.entries(layers).map(([key, layer]) => ({
    key,
    layer,
    rect: layer.getBoundingClientRect(),
  }));
  const feedRootRect = feedRoot.getBoundingClientRect();

  overlayRoot.style.position = "absolute";
  overlayRoot.style.left = "0px";
  overlayRoot.style.top = "0px";
  overlayRoot.style.width = "100%";
  overlayRoot.style.height = "100%";
  overlayRoot.style.zIndex = "5";
  feedRoot.appendChild(overlayRoot);

  layerRects.forEach(({ layer, rect }) => {
    layer.style.left = `${rect.left - feedRootRect.left}px`;
    layer.style.top = `${rect.top - feedRootRect.top}px`;
  });

  return true;
}

function getPhotoTextTransitionRoot(element: HTMLElement) {
  return (
    element.closest<HTMLElement>("[data-app-frame-root='true']") ??
    document.querySelector<HTMLElement>("[data-app-frame-root='true']")
  );
}

function getRectRelativeToRoot(
  element: HTMLElement,
  rootElement: HTMLElement | null,
) {
  const rect = element.getBoundingClientRect();
  const rootRect = rootElement?.getBoundingClientRect();
  return {
    left: rect.left - (rootRect?.left ?? 0),
    top: rect.top - (rootRect?.top ?? 0),
    width: rect.width,
    height: rect.height,
  };
}

function findPhotoTextDetailImageTarget(imageIndex: number) {
  return document.querySelector<HTMLElement>(
    `[${PHOTO_TEXT_DETAIL_IMAGE_TARGET_ATTR}="${imageIndex}"]`,
  );
}

function getRectRelativeToOverlayRoot(
  element: HTMLElement,
  overlayRoot: HTMLElement,
) {
  const rect = element.getBoundingClientRect();
  const overlayRect = overlayRoot.getBoundingClientRect();
  return {
    left: rect.left - overlayRect.left,
    top: rect.top - overlayRect.top,
    width: rect.width,
    height: rect.height,
  };
}

function applyLayerRect(
  layer: HTMLElement,
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">,
) {
  layer.style.left = `${rect.left}px`;
  layer.style.top = `${rect.top}px`;
  layer.style.width = `${rect.width}px`;
  layer.style.height = `${rect.height}px`;
}

function runPendingPhotoTextDetailEnterTransition() {
  if (
    !pendingPhotoTextEnterTransition ||
    typeof document === "undefined" ||
    typeof window === "undefined"
  ) {
    return false;
  }

  const { imageIndex, imageLayer, overlayRoot } = pendingPhotoTextEnterTransition;
  const target = findPhotoTextDetailImageTarget(imageIndex);
  if (!target) return false;

  const targetRect = getRectRelativeToOverlayRoot(target, overlayRoot);

  target.style.opacity = "0";
  target.style.transition = "none";
  pendingPhotoTextEnterTransition.targetElement = target;

  window.requestAnimationFrame(() => {
    imageLayer.style.transition =
      "left 360ms cubic-bezier(0.22, 1, 0.36, 1), top 360ms cubic-bezier(0.22, 1, 0.36, 1), width 360ms cubic-bezier(0.22, 1, 0.36, 1), height 360ms cubic-bezier(0.22, 1, 0.36, 1)";
    applyLayerRect(imageLayer, targetRect);
  });

  pendingPhotoTextEnterTransition.cleanupTimerId = window.setTimeout(() => {
    document.documentElement.removeAttribute(PHOTO_TEXT_LOCAL_ENTER_ATTR);
    target.style.opacity = "1";
    target.style.transition = "none";
    window.requestAnimationFrame(() => {
      cleanupPendingPhotoTextEnterTransition();
    });
  }, 360);

  return true;
}

export function beginPhotoTextDetailEnterTransition({
  sourceElement,
  targetHref,
  imageIndex,
}: {
  sourceElement: HTMLElement;
  targetHref: string;
  imageIndex: number;
}) {
  if (typeof document === "undefined" || typeof window === "undefined") {
    navigateWithinApp(targetHref);
    return;
  }

  cleanupPendingPhotoTextEnterTransition();
  const transitionRoot = getPhotoTextTransitionRoot(sourceElement);
  const sourceRect = getRectRelativeToRoot(sourceElement, transitionRoot);
  const overlayRoot = createAppFrameClippedOverlayRoot(transitionRoot);

  const imageLayer = document.createElement("div");
  imageLayer.dataset.photoTextEnterLayer = "image";
  imageLayer.style.position = "absolute";
  imageLayer.style.left = `${sourceRect.left}px`;
  imageLayer.style.top = `${sourceRect.top}px`;
  imageLayer.style.width = `${sourceRect.width}px`;
  imageLayer.style.height = `${sourceRect.height}px`;
  imageLayer.style.margin = "0";
  imageLayer.style.overflow = "hidden";
  imageLayer.style.pointerEvents = "none";
  imageLayer.style.transformOrigin = "top left";
  imageLayer.style.willChange = "left, top, width, height, opacity";
  imageLayer.style.opacity = "1";

  const clone = sourceElement.cloneNode(true) as HTMLElement;
  clone.style.width = "100%";
  clone.style.height = "100%";
  clone.style.margin = "0";
  clone.style.pointerEvents = "none";
  imageLayer.appendChild(clone);
  overlayRoot.appendChild(imageLayer);
  document.body.appendChild(overlayRoot);

  pendingPhotoTextEnterTransition = {
    overlayRoot,
    imageLayer,
    imageIndex,
    targetElement: null,
    cleanupTimerId: null,
  };

  document.documentElement.setAttribute(PHOTO_TEXT_LOCAL_ENTER_ATTR, "true");
  navigateWithinApp(targetHref);

  let attempts = 0;
  const tryRun = () => {
    if (runPendingPhotoTextDetailEnterTransition()) return;
    attempts += 1;
    if (attempts < 12) {
      window.requestAnimationFrame(tryRun);
      return;
    }
    cleanupPendingPhotoTextEnterTransition();
  };
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(tryRun);
  });
}

function getVisibleAreaWithinFrame(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return 0;

  const style = window.getComputedStyle(element);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    Number(style.opacity) === 0
  ) {
    return 0;
  }

  const frameRoot =
    element.closest<HTMLElement>("[data-app-frame-root='true']") ??
    document.documentElement;
  const frameRect = frameRoot.getBoundingClientRect();
  const left = Math.max(rect.left, frameRect.left);
  const top = Math.max(rect.top, frameRect.top);
  const right = Math.min(rect.right, frameRect.right);
  const bottom = Math.min(rect.bottom, frameRect.bottom);
  return Math.max(0, right - left) * Math.max(0, bottom - top);
}

function findPhotoTextFeedImageTarget(feedId: string, imageIndex: number) {
  const selector = `[${PHOTO_TEXT_FEED_IMAGE_TARGET_ATTR}="${feedId}:${imageIndex}"]`;
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>(selector),
  );
  if (candidates.length <= 1) return candidates[0] ?? null;

  return candidates.reduce<HTMLElement | null>((best, candidate) => {
    if (!best) return candidate;
    return getVisibleAreaWithinFrame(candidate) > getVisibleAreaWithinFrame(best)
      ? candidate
      : best;
  }, null);
}

function findPhotoTextFeedRightRailTarget(feedId: string, imageIndex: number) {
  const selector = `[${PHOTO_TEXT_FEED_RIGHT_RAIL_TARGET_ATTR}="${feedId}:${imageIndex}"]`;
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>(selector),
  );
  if (candidates.length <= 1) return candidates[0] ?? null;

  return candidates.reduce<HTMLElement | null>((best, candidate) => {
    if (!best) return candidate;
    return getVisibleAreaWithinFrame(candidate) > getVisibleAreaWithinFrame(best)
      ? candidate
      : best;
  }, null);
}

export function beginPhotoTextDetailExitTransition({
  imageElement,
  headerElement,
  bodyElement,
  actionElement,
  targetHref,
  targetFeedId,
  imageIndex,
}: {
  imageElement: HTMLElement;
  headerElement: HTMLElement;
  bodyElement: HTMLElement;
  actionElement: HTMLElement;
  targetHref: string;
  targetFeedId: string;
  imageIndex: number;
}) {
  if (typeof document === "undefined" || typeof window === "undefined") {
    navigateWithinApp(targetHref);
    return;
  }

  cleanupPendingPhotoTextExitTransition();
  const transitionRoot = getPhotoTextTransitionRoot(imageElement);

  const overlayRoot = createAppFrameClippedOverlayRoot(transitionRoot);
  if (transitionRoot) {
    overlayRoot.style.position = "absolute";
    overlayRoot.style.left = "0px";
    overlayRoot.style.top = "0px";
    overlayRoot.style.width = "100%";
    overlayRoot.style.height = "100%";
    overlayRoot.style.zIndex = "5";
  }

  const imageLayer = createFixedCloneLayer({
    key: "image",
    element: imageElement,
    rootElement: transitionRoot,
  });
  const headerLayer = createFixedCloneLayer({
    key: "header",
    element: headerElement,
    rootElement: transitionRoot,
  });
  const bodyLayer = createFixedCloneLayer({
    key: "body",
    element: bodyElement,
    rootElement: transitionRoot,
  });
  const actionLayer = createFixedCloneLayer({
    key: "action",
    element: actionElement,
    rootElement: transitionRoot,
  });

  overlayRoot.append(imageLayer, headerLayer, bodyLayer, actionLayer);
  (transitionRoot ?? document.body).appendChild(overlayRoot);

  const existingTarget = findPhotoTextFeedImageTarget(targetFeedId, imageIndex);
  if (existingTarget) {
    scopeExitOverlayToFeedTarget({
      target: existingTarget,
      overlayRoot,
      layers: {
        image: imageLayer,
        header: headerLayer,
        body: bodyLayer,
        action: actionLayer,
      },
    });
  }

  pendingPhotoTextExitTransition = {
    overlayRoot,
    layers: {
      image: imageLayer,
      header: headerLayer,
      body: bodyLayer,
      action: actionLayer,
    },
    targetFeedId,
    imageIndex,
    targetElement: null,
    targetRightRailElement: null,
    targetRightRailLayer: null,
    targetRightRailPreviousOpacity: null,
    targetRightRailPreviousTransition: null,
    cleanupTimerId: null,
  };

  navigateWithinApp(targetHref);
}

export function runPendingPhotoTextDetailExitTransition() {
  if (
    !pendingPhotoTextExitTransition ||
    typeof document === "undefined" ||
    typeof window === "undefined"
  ) {
    return false;
  }

  const { targetFeedId, imageIndex, layers, overlayRoot } = pendingPhotoTextExitTransition;
  const target = findPhotoTextFeedImageTarget(targetFeedId, imageIndex);
  if (!target) return false;

  const overlayScopedToFeed = scopeExitOverlayToFeedTarget({
    target,
    overlayRoot,
    layers,
  });

  target.setAttribute(PHOTO_TEXT_EXIT_TARGET_ACTIVE_ATTR, "true");
  target.style.opacity = "0";
  pendingPhotoTextExitTransition.targetElement = target;

  const targetRect = getRectRelativeToOverlayRoot(target, overlayRoot);
  const targetRightRail = findPhotoTextFeedRightRailTarget(targetFeedId, imageIndex);
  if (
    !overlayScopedToFeed &&
    targetRightRail &&
    !pendingPhotoTextExitTransition.targetRightRailLayer
  ) {
    pendingPhotoTextExitTransition.targetRightRailPreviousOpacity =
      targetRightRail.style.opacity;
    pendingPhotoTextExitTransition.targetRightRailPreviousTransition =
      targetRightRail.style.transition;
    targetRightRail.style.transition = "none";
    targetRightRail.style.opacity = "0";
    const targetRightRailLayer = createFixedCloneLayer({
      key: "action",
      element: targetRightRail,
      rootElement: overlayRoot,
    });
    targetRightRailLayer.dataset.photoTextExitLayer = "target-right-rail";
    targetRightRailLayer.style.zIndex = "5";
    targetRightRailLayer.style.willChange = "opacity";
    overlayRoot.appendChild(targetRightRailLayer);
    pendingPhotoTextExitTransition.targetRightRailElement = targetRightRail;
    pendingPhotoTextExitTransition.targetRightRailLayer = targetRightRailLayer;
  }

  window.requestAnimationFrame(() => {
    layers.image.style.transform = "none";
    layers.image.style.transition =
      "left 350ms cubic-bezier(0.22, 1, 0.36, 1), top 350ms cubic-bezier(0.22, 1, 0.36, 1), width 350ms cubic-bezier(0.22, 1, 0.36, 1), height 350ms cubic-bezier(0.22, 1, 0.36, 1)";
    applyLayerRect(layers.image, targetRect);

    layers.header.style.transition =
      `opacity ${PHOTO_TEXT_EXIT_AUX_FADE_MS}ms cubic-bezier(0.32, 0.72, 0, 1)`;
    layers.header.style.opacity = "0";

    layers.body.style.transition =
      `opacity ${PHOTO_TEXT_EXIT_AUX_FADE_MS}ms cubic-bezier(0.32, 0.72, 0, 1)`;
    layers.body.style.opacity = "0";

    layers.action.style.transition =
      `opacity ${PHOTO_TEXT_EXIT_AUX_FADE_MS}ms cubic-bezier(0.32, 0.72, 0, 1)`;
    layers.action.style.opacity = "0";
  });

  pendingPhotoTextExitTransition.cleanupTimerId = window.setTimeout(() => {
    cleanupPendingPhotoTextExitTransition();
  }, 380);

  return true;
}

export {
  PHOTO_TEXT_DETAIL_IMAGE_TARGET_ATTR,
  PHOTO_TEXT_FEED_IMAGE_TARGET_ATTR,
  PHOTO_TEXT_FEED_RIGHT_RAIL_TARGET_ATTR,
};

export function savePhotoTextDetailSnapshot(content: FeedItemCardContent) {
  detailSnapshotMemory.set(content.id, content);
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      `${DETAIL_SNAPSHOT_PREFIX}${content.id}`,
      JSON.stringify(content),
    );
  } catch {
    // Ignore storage failures; the detail page falls back to config data.
  }
}

export function loadPhotoTextDetailSnapshot(feedId: string | null) {
  if (!feedId) return null;
  const memorySnapshot = detailSnapshotMemory.get(feedId);
  if (memorySnapshot) return memorySnapshot;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(
      `${DETAIL_SNAPSHOT_PREFIX}${feedId}`,
    );
    if (!raw) return null;
    return JSON.parse(raw) as FeedItemCardContent;
  } catch {
    return null;
  }
}

function mergePhotoTextDetailSourceFrame(
  previous: Partial<PhotoTextDetailSourceFrame> | null | undefined,
  frame: PhotoTextDetailSourceFrame,
): PhotoTextDetailSourceFrame {
  return {
    ...previous,
    ...frame,
    aspect: frame.aspect ?? previous?.aspect,
    aspects: frame.aspects ?? previous?.aspects,
  };
}

export function savePhotoTextDetailSourceFrame(
  feedId: string,
  imageIndex: number,
  frame: PhotoTextDetailSourceFrame,
) {
  const key = `${DETAIL_SOURCE_FRAME_PREFIX}${feedId}:${imageIndex}`;
  const memoryFrame = mergePhotoTextDetailSourceFrame(
    detailSourceFrameMemory.get(key),
    frame,
  );
  detailSourceFrameMemory.set(key, memoryFrame);

  if (typeof window === "undefined") return;
  try {
    const raw = window.sessionStorage.getItem(key);
    const previous = raw
      ? (JSON.parse(raw) as Partial<PhotoTextDetailSourceFrame>)
      : null;
    const merged = mergePhotoTextDetailSourceFrame(previous ?? memoryFrame, frame);
    window.sessionStorage.setItem(key, JSON.stringify(merged));
    detailSourceFrameMemory.set(key, merged);
  } catch {
    // Ignore storage failures; the detail page falls back to default layout.
  }
}

export function loadPhotoTextDetailSourceFrame(
  feedId: string | null,
  imageIndex: number,
) {
  if (!feedId) return null;
  const key = `${DETAIL_SOURCE_FRAME_PREFIX}${feedId}:${imageIndex}`;
  const memoryFrame = detailSourceFrameMemory.get(key);
  if (memoryFrame) return memoryFrame;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as PhotoTextDetailSourceFrame;
  } catch {
    return null;
  }
}

export function parsePhotoTextDetailSearch(search: string): PhotoTextDetailRouteState {
  const params = new URLSearchParams(search);
  const feedId = params.get("feed");
  const returnFeedId = params.get("returnFeed") ?? feedId;
  const parsedIndex = Number.parseInt(params.get("image") ?? "0", 10);

  return {
    feedId,
    returnFeedId,
    imageIndex:
      Number.isFinite(parsedIndex) && parsedIndex >= 0 ? parsedIndex : 0,
  };
}
