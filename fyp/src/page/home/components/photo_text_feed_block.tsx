import { getColorCSSVar, TUXText } from "@byted-tiktok/tux-web";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type WheelEvent as ReactWheelEvent,
} from "react";

import { LocationAnchor } from "./location_anchor";
import { usePhotoTextDevOptional } from "./photo_text_dev_context";
import { useFeedInfoVisibility } from "./feed_info/feed_info_config_store";
import {
  FeedBottomActions,
  FeedBottomBanner,
  FeedCollaboratorsChip,
  FeedFriendTag,
  FeedInfoBar,
  FeedPromoBanner,
  FeedSeeOriginal,
  FeedSponsoredTag,
  FeedTextTypeChip,
  FeedVerifiedBadge,
} from "./feed_info/feed_info_components";
import {
  readCssVariablePx,
  resolveHomeFeedTabBottomPx,
} from "../../../utils/viewport_insets";
import type { FeedItemCardContent, FeedPhotoTextSlide } from "./feed_item_card";
import { TextImageCoverFill } from "../../text_to_image/text_image_cover_fill";
import {
  PHOTO_TEXT_AUTO_ASPECT,
  photoHeightAtWidth,
  resolvePhotoTextLayout,
  type AspectWH,
} from "./photo_text_post_layout";
import {
  PHOTO_TEXT_FEED_IMAGE_TARGET_ATTR,
  PHOTO_TEXT_FEED_RIGHT_RAIL_TARGET_ATTR,
  PHOTO_TEXT_SHARED_IMAGE_TRANSITION_NAME,
  savePhotoTextDetailSourceFrame,
} from "../../photo_text_detail/photo_text_detail_route";

const TITLE_MAX_LINES = 2;
const DESC_MAX_LINES = 3;
const PAGE_DOT_GAP_PX = 6;
const PAGE_DOT_WRAPPER_PX = 12;
const PAGE_DOT_ACTIVE_PX = 6;
const PAGE_DOT_SMALL_PX = 4.8;
const PAGE_DOT_XS_PX = 4;
const IMAGE_LAYOUT_TRANSITION = "220ms cubic-bezier(0.22, 1, 0.36, 1)";
const IMAGE_LAYOUT_TRANSITION_SUPPRESSION_MS = 120;
const PHOTO_TEXT_BOTTOM_GRADIENT =
  "linear-gradient(180deg, rgba(0,0,0,0) 44%, rgba(0,0,0,0.18) 62%, rgba(0,0,0,0.42) 78%, rgba(0,0,0,0.74) 100%)";
const CAROUSEL_AXIS_LOCK_MIN_X_PX = 6;
const CAROUSEL_AXIS_LOCK_MIN_Y_PX = 36;
const CAROUSEL_HORIZONTAL_BIAS = 0.25;
const CAROUSEL_VERTICAL_BIAS = 2.6;
const CAROUSEL_COMMIT_PX = 48;
const CAROUSEL_COMMIT_PROGRESS = 0.14;
/** 在右侧操作栏起手左滑 → 进入客态 profile（跟手），松手时的提交进度阈值。 */
const PROFILE_SWIPE_COMMIT_PROGRESS = 0.3;
const PAGE_CONTROLLER_GAP_TO_DESCRIPTION_PX = 4;
const PAGE_CONTROL_MAX_VISIBLE_DOTS = 6;
const DESC_LINE_HEIGHT = "130%";
const DESC_LINE_HEIGHT_EM = 1.3;
const DESC_MORE_GAP_PX = 4;
const DESC_MORE_LABEL = "more";
const DESC_MORE_FONT_FAMILY =
  '"TikTok Sans", "TikTok Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const TITLE_MULTI_LINE_HEIGHT = "120%";
const PHOTO_TEXT_STACK_GAP_PX = 8;
const USERNAME_TO_TITLE_GAP_PX = 6;
const TITLE_TO_DESC_GAP_PX = 4;
const TEXT_DETAIL_TAP_CANCEL_PX = 8;

const TITLE_PRESET_TEXTS = [
  "",
  "reviewing study cafes in LA",
  "reviewing study cafes in LA - my personal top 5 favorites for studying and working",
] as const;

const DESC_PRESET_TEXTS = [
  "",
  "love this place!",
  "overall: i absolutely loved this cafe and see this being a staple",
  "overall: i absolutely loved this cafe and see this being a staple during finals season. the vibes are warm and calm",
  "overall: i absolutely loved this cafe and see this being a staple during finals and midterms. the atmosphere is cozy with warm lighting and comfy seats",
  "overall: i absolutely loved this cafe and see this being a staple during finals and midterms. the atmosphere is cozy with warm lighting, comfy seats, and the perfect ambient noise level for studying.",
] as const;

function countRenderedLines(element: HTMLElement | null): number {
  if (!element) return 0;
  const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight || "0");
  if (!Number.isFinite(lineHeight) || lineHeight <= 0) return 1;
  return Math.max(1, Math.round(element.getBoundingClientRect().height / lineHeight));
}

function previewTitleForLines(lineCount: number | null, fallback: string) {
  if (lineCount == null) return fallback;
  if (lineCount <= 0) return "";
  return TITLE_PRESET_TEXTS[Math.min(lineCount, TITLE_PRESET_TEXTS.length - 1)] ?? fallback;
}

function previewDescForLines(lineCount: number | null, fallback: string) {
  if (lineCount == null) return fallback;
  if (lineCount <= 0) return "";
  return DESC_PRESET_TEXTS[Math.min(lineCount, DESC_PRESET_TEXTS.length - 1)] ?? fallback;
}

function clampIndex(index: number, total: number) {
  return Math.max(0, Math.min(total - 1, index));
}

function normalizeMeasuredText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

type DescClampResult = {
  text: string;
  truncated: boolean;
};

function measureDescriptionClamp(
  element: HTMLElement | null,
  fullText: string,
  lineClamp: number,
): DescClampResult {
  const normalizedText = normalizeMeasuredText(fullText);
  if (!element || lineClamp <= 0 || !normalizedText) {
    return { text: normalizedText, truncated: false };
  }

  const width = element.clientWidth || element.getBoundingClientRect().width;
  if (!Number.isFinite(width) || width <= 0 || typeof document === "undefined") {
    return { text: normalizedText, truncated: false };
  }

  const textElement =
    element.firstElementChild instanceof HTMLElement ? element.firstElementChild : element;
  const baseStyle = getComputedStyle(textElement);
  const elementStyle = getComputedStyle(element);
  const lineHeightPx = Number.parseFloat(elementStyle.lineHeight || baseStyle.lineHeight || "0");
  if (!Number.isFinite(lineHeightPx) || lineHeightPx <= 0) {
    return { text: normalizedText, truncated: false };
  }

  const measureRoot = document.createElement("div");
  measureRoot.style.position = "fixed";
  measureRoot.style.left = "-10000px";
  measureRoot.style.top = "0";
  measureRoot.style.visibility = "hidden";
  measureRoot.style.pointerEvents = "none";
  measureRoot.style.width = `${width}px`;
  measureRoot.style.whiteSpace = "normal";
  measureRoot.style.wordBreak = baseStyle.wordBreak;
  measureRoot.style.overflowWrap = baseStyle.overflowWrap;
  measureRoot.style.fontFamily = baseStyle.fontFamily;
  measureRoot.style.fontSize = baseStyle.fontSize;
  measureRoot.style.fontStyle = baseStyle.fontStyle;
  measureRoot.style.fontWeight = baseStyle.fontWeight;
  measureRoot.style.letterSpacing = baseStyle.letterSpacing;
  measureRoot.style.lineHeight = elementStyle.lineHeight || DESC_LINE_HEIGHT;

  const textSpan = document.createElement("span");
  textSpan.style.fontFamily = baseStyle.fontFamily;
  textSpan.style.fontSize = baseStyle.fontSize;
  textSpan.style.fontStyle = baseStyle.fontStyle;
  textSpan.style.fontWeight = baseStyle.fontWeight;
  textSpan.style.letterSpacing = baseStyle.letterSpacing;
  textSpan.style.lineHeight = elementStyle.lineHeight || DESC_LINE_HEIGHT;

  const moreSpan = document.createElement("span");
  moreSpan.textContent = DESC_MORE_LABEL;
  moreSpan.style.marginLeft = `${DESC_MORE_GAP_PX}px`;
  moreSpan.style.fontFamily = DESC_MORE_FONT_FAMILY;
  moreSpan.style.fontSize = "15px";
  moreSpan.style.fontStyle = "normal";
  moreSpan.style.fontWeight = "600";
  moreSpan.style.lineHeight = DESC_LINE_HEIGHT;

  measureRoot.append(textSpan, moreSpan);
  document.body.appendChild(measureRoot);

  const maxHeightPx = lineHeightPx * lineClamp + 0.75;
  const fits = (text: string, includeMore: boolean) => {
    textSpan.textContent = text;
    moreSpan.style.display = includeMore ? "" : "none";
    return measureRoot.getBoundingClientRect().height <= maxHeightPx;
  };

  if (fits(normalizedText, false)) {
    measureRoot.remove();
    return { text: normalizedText, truncated: false };
  }

  let low = 0;
  let high = normalizedText.length;
  let best = "";
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidatePrefix = normalizedText.slice(0, mid).trimEnd();
    const candidate = `${candidatePrefix}...`;
    if (fits(candidate, true)) {
      best = candidatePrefix;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  measureRoot.remove();
  const clampedText = `${best.trimEnd()}...`;
  return {
    text: clampedText,
    truncated: true,
  };
}

type PageControlDotModel = {
  active: boolean;
  sizePx: number;
  key: string;
  realIndex: number;
};

function buildPageControlDots(
  total: number,
  activeIndex: number,
): PageControlDotModel[] {
  if (total <= 0) return [];

  if (total <= PAGE_CONTROL_MAX_VISIBLE_DOTS) {
    return Array.from({ length: total }, (_, index) => ({
      key: `dot-${index}`,
      active: index === activeIndex,
      sizePx: PAGE_DOT_ACTIVE_PX,
      realIndex: index,
    }));
  }

  const visibleCount = PAGE_CONTROL_MAX_VISIBLE_DOTS;
  const maxStart = Math.max(0, total - visibleCount);
  const start = Math.max(0, Math.min(activeIndex - 2, maxStart));
  const end = start + visibleCount;
  const hasHiddenLeft = start > 0;
  const hasHiddenRight = end < total;

  return Array.from({ length: visibleCount }, (_, slotIndex) => {
    const realIndex = start + slotIndex;
    let sizePx = PAGE_DOT_ACTIVE_PX;

    if (realIndex !== activeIndex) {
      if (hasHiddenLeft && slotIndex === 0) sizePx = PAGE_DOT_XS_PX;
      else if (hasHiddenLeft && slotIndex === 1) sizePx = PAGE_DOT_SMALL_PX;
      else if (hasHiddenRight && slotIndex === visibleCount - 1) sizePx = PAGE_DOT_XS_PX;
      else if (hasHiddenRight && slotIndex === visibleCount - 2) sizePx = PAGE_DOT_SMALL_PX;
    }

    return {
      key: `dot-${realIndex}`,
      active: realIndex === activeIndex,
      sizePx,
      realIndex,
    };
  });
}

export type PhotoTextFeedBlockProps = {
  content: FeedItemCardContent;
  initialActiveImageIndex?: number;
  isVisibleTransitionSource?: boolean;
  tabBottomPxOverride?: number;
  repostBar?: ReactNode;
  rightRail: ReactNode;
  commentOverlayVisible?: boolean;
  onOpenDetail?: (
    imageIndex: number,
    sourceElement: HTMLElement | null,
    detailContent: FeedItemCardContent & {
      photoText: NonNullable<FeedItemCardContent["photoText"]>;
    },
  ) => void;
  /** 点头像 / 用户名 → 客态 profile。 */
  onOpenProfile?: () => void;
  /** 末图继续左滑 → 客态 profile 跟手拖入（与普通 feed 左滑同一套手势）。 */
  onProfileSwipeStart?: () => void;
  onProfileSwipeMove?: (progress: number) => void;
  onProfileSwipeEnd?: (commit: boolean) => void;
};

export function PhotoTextFeedBlock({
  content,
  initialActiveImageIndex,
  isVisibleTransitionSource = false,
  tabBottomPxOverride,
  repostBar,
  rightRail,
  commentOverlayVisible = false,
  onOpenDetail,
  onOpenProfile,
  onProfileSwipeStart,
  onProfileSwipeMove,
  onProfileSwipeEnd,
}: PhotoTextFeedBlockProps) {
  const photoText = content.photoText;
  const carouselSlides = useMemo((): FeedPhotoTextSlide[] => {
    if (!photoText) return [];
    if (photoText.slides?.length) return [...photoText.slides];
    return photoText.images.map((src) => ({ kind: "image", src }));
  }, [photoText]);
  if (!photoText || carouselSlides.length === 0) return null;

  const rootRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const rightRailRef = useRef<HTMLDivElement>(null);
  const bottomAreaRef = useRef<HTMLDivElement>(null);
  const bottomClusterRef = useRef<HTMLDivElement>(null);
  const descriptionContentRef = useRef<HTMLDivElement>(null);
  const nicknameRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLDivElement>(null);
  const hasVisibleMeasurementRef = useRef(false);
  const layoutTransitionTimerRef = useRef<number | null>(null);
  const wheelStateRef = useRef<{
    accumulatedX: number;
    lock: boolean;
    resetTimer: number | null;
    unlockTimer: number | null;
  }>({
    accumulatedX: 0,
    lock: false,
    resetTimer: null,
    unlockTimer: null,
  });
  const carouselDragRef = useRef<{
    pointerId: number | null;
    startX: number;
    startY: number;
    startIndex: number;
    axis: "undecided" | "horizontal" | "vertical";
    dragged: boolean;
    deltaX: number;
    visitorGesture: boolean;
    startedInRail: boolean;
    captured: boolean;
    input: "pointer" | "mouse" | "touch" | null;
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    startIndex: 0,
    axis: "undecided",
    dragged: false,
    deltaX: 0,
    visitorGesture: false,
    startedInRail: false,
    captured: false,
    input: null,
  });
  // 横滑结束后吞掉紧随其后的 click，避免从操作栏按钮起手左滑时误触点赞/评论等。
  const suppressNextClickRef = useRef(false);
  const profileSwipeRef = useRef({
    start: onProfileSwipeStart,
    move: onProfileSwipeMove,
    end: onProfileSwipeEnd,
  });
  useEffect(() => {
    profileSwipeRef.current.start = onProfileSwipeStart;
    profileSwipeRef.current.move = onProfileSwipeMove;
    profileSwipeRef.current.end = onProfileSwipeEnd;
  }, [onProfileSwipeStart, onProfileSwipeMove, onProfileSwipeEnd]);
  const textDetailTapRef = useRef<{
    pointerId: number | null;
    startX: number;
    startY: number;
    suppressClick: boolean;
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    suppressClick: false,
  });

  const dev = usePhotoTextDevOptional();
  const perFeedDev = dev?.getPerFeed(content.id);
  const feedInfo = useFeedInfoVisibility();

  const titleText = (photoText.title ?? "").trim();
  const descText =
    (photoText.desc ?? "").trim() ||
    (content.description ?? "").trim() ||
    "\u00A0";
  const slideCount = carouselSlides.length;
  const overrideTitleLines = perFeedDev?.titleLines ?? null;
  const overrideDescLines = perFeedDev?.descLines ?? null;
  const renderTitleText = previewTitleForLines(overrideTitleLines, titleText);
  const renderDescText = previewDescForLines(overrideDescLines, descText);
  const renderTitleLineClamp =
    overrideTitleLines == null
      ? TITLE_MAX_LINES
      : Math.max(0, Math.min(TITLE_MAX_LINES, Math.round(overrideTitleLines)));
  const renderDescLineClamp =
    overrideDescLines == null
      ? DESC_MAX_LINES
      : Math.max(0, Math.min(DESC_MAX_LINES, Math.round(overrideDescLines)));

  const resolvedAspects = useMemo(() => {
    if (perFeedDev?.aspect) {
      return carouselSlides.map(() => perFeedDev.aspect as AspectWH);
    }
    return carouselSlides.map(() => PHOTO_TEXT_AUTO_ASPECT);
  }, [carouselSlides, perFeedDev?.aspect]);

  const [activeIndex, setActiveIndex] = useState(() =>
    clampIndex(initialActiveImageIndex ?? 0, slideCount),
  );
  const [titleLineCount, setTitleLineCount] = useState(0);
  const [descLineCount, setDescLineCount] = useState(0);
  const [isDescTruncated, setIsDescTruncated] = useState(false);
  const [clampedDescText, setClampedDescText] = useState(renderDescText);
  const [usernameTopPx, setUsernameTopPx] = useState(0);
  const [descriptionTopPx, setDescriptionTopPx] = useState(0);
  const [rootSize, setRootSize] = useState({ width: 0, height: 0 });
  const [chromeMetrics, setChromeMetrics] = useState({
    tabBottomPx: 88,
    tabbarHeightPx: 83,
  });
  const [carouselOffsetPx, setCarouselOffsetPx] = useState(0);
  const [carouselDragging, setCarouselDragging] = useState(false);
  const [suppressLayoutTransition, setSuppressLayoutTransition] = useState(true);
  const viewportWidth = rootSize.width;

  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;
  const viewportWidthRef = useRef(viewportWidth);
  viewportWidthRef.current = viewportWidth;
  const slideCountRef = useRef(slideCount);
  slideCountRef.current = slideCount;

  useEffect(() => {
    setActiveIndex((previous) => clampIndex(previous, slideCount));
  }, [slideCount]);

  const suppressLayoutTransitionsBriefly = () => {
    setSuppressLayoutTransition(true);
    if (layoutTransitionTimerRef.current != null) {
      window.clearTimeout(layoutTransitionTimerRef.current);
    }
    layoutTransitionTimerRef.current = window.setTimeout(() => {
      layoutTransitionTimerRef.current = null;
      setSuppressLayoutTransition(false);
    }, IMAGE_LAYOUT_TRANSITION_SUPPRESSION_MS);
  };

  useEffect(() => {
    suppressLayoutTransitionsBriefly();
    return () => {
      if (layoutTransitionTimerRef.current != null) {
        window.clearTimeout(layoutTransitionTimerRef.current);
        layoutTransitionTimerRef.current = null;
      }
    };
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const bottomAreaEl = bottomAreaRef.current;
    const descriptionEl = descriptionContentRef.current;
    const nicknameEl = nicknameRef.current;
    const clusterEl = bottomClusterRef.current;
    if (!root || !bottomAreaEl || !descriptionEl || !nicknameEl || !clusterEl) return;

    const updateMeasurements = () => {
      const rootRect = root.getBoundingClientRect();
      if (rootRect.width < 2 || rootRect.height < 2) {
        hasVisibleMeasurementRef.current = false;
        return;
      }

      if (!hasVisibleMeasurementRef.current) {
        hasVisibleMeasurementRef.current = true;
        suppressLayoutTransitionsBriefly();
      }

      const descriptionRect = descriptionEl.getBoundingClientRect();
      const nicknameRect = nicknameEl.getBoundingClientRect();

      setRootSize({
        width: rootRect.width,
        height: rootRect.height,
      });
      setDescriptionTopPx(Math.max(0, descriptionRect.top - rootRect.top));
      setUsernameTopPx(Math.max(0, nicknameRect.top - rootRect.top));
      setTitleLineCount(overrideTitleLines ?? countRenderedLines(titleRef.current));
      const nextDescClamp = measureDescriptionClamp(
        descRef.current,
        renderDescText,
        renderDescLineClamp,
      );
      setClampedDescText(nextDescClamp.text);
      setIsDescTruncated(nextDescClamp.truncated);
      setDescLineCount(overrideDescLines ?? countRenderedLines(descRef.current));

      const nextTabBottomPx =
        tabBottomPxOverride ?? resolveHomeFeedTabBottomPx(root);
      const tabbarVarPx = readCssVariablePx(root, "--app-tabbar-height", "bottom");
      const nextTabbarHeightPx = tabbarVarPx > 0 ? tabbarVarPx : 83;

      setChromeMetrics((current) => {
        if (
          current.tabBottomPx === nextTabBottomPx &&
          current.tabbarHeightPx === nextTabbarHeightPx
        ) {
          return current;
        }
        return {
          tabBottomPx: nextTabBottomPx,
          tabbarHeightPx: nextTabbarHeightPx,
        };
      });
    };

    updateMeasurements();

    const resizeObserver = new ResizeObserver(updateMeasurements);
    resizeObserver.observe(root);
    resizeObserver.observe(bottomAreaEl);
    resizeObserver.observe(clusterEl);
    resizeObserver.observe(descriptionEl);
    resizeObserver.observe(nicknameEl);
    if (titleRef.current) resizeObserver.observe(titleRef.current);
    if (descRef.current) resizeObserver.observe(descRef.current);

    window.addEventListener("resize", updateMeasurements);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateMeasurements);
    };
  }, [
    content.id,
    descText,
    feedInfo,
    overrideDescLines,
    overrideTitleLines,
    renderDescText,
    renderDescLineClamp,
    renderTitleText,
    tabBottomPxOverride,
    titleText,
  ]);

  const activeAspect = resolvedAspects[0] ?? [1, 1];
  const { tabBottomPx, tabbarHeightPx } = chromeMetrics;

  const layout = useMemo(
    () =>
      resolvePhotoTextLayout({
        aspect: activeAspect,
        cardWidthPx: rootSize.width,
        cardHeightPx: rootSize.height,
        tabBottomPx,
        tabbarHeightPx,
        usernameTopPx,
        titleLineCount,
        descLineCount,
        carouselSlideCount: slideCount,
      }),
    [
      activeAspect,
      descLineCount,
      rootSize.height,
      rootSize.width,
      tabBottomPx,
      tabbarHeightPx,
      titleLineCount,
      usernameTopPx,
      slideCount,
    ],
  );
  const displayFrameAspect = (
    viewportWidth > 0 && layout.imageHeightPx > 0
      ? ([viewportWidth, layout.imageHeightPx] as const)
      : activeAspect
  );
  const displayFrameAspects = useMemo(
    () => carouselSlides.map(() => displayFrameAspect),
    [carouselSlides, displayFrameAspect],
  );

  const resetCarouselDrag = () => {
    carouselDragRef.current.pointerId = null;
    carouselDragRef.current.axis = "undecided";
    carouselDragRef.current.dragged = false;
    carouselDragRef.current.deltaX = 0;
    carouselDragRef.current.visitorGesture = false;
    carouselDragRef.current.startedInRail = false;
    carouselDragRef.current.captured = false;
    carouselDragRef.current.input = null;
    setCarouselDragging(false);
    setCarouselOffsetPx(0);
  };

  useEffect(() => {
    return () => {
      if (wheelStateRef.current.resetTimer != null) {
        window.clearTimeout(wheelStateRef.current.resetTimer);
      }
      if (wheelStateRef.current.unlockTimer != null) {
        window.clearTimeout(wheelStateRef.current.unlockTimer);
      }
    };
  }, []);

  // 热区 = 右侧操作栏（头像/点赞/评论/收藏/分享那一列）的实际包围盒。
  // 只有从这块区域起手左滑才进客态 profile。
  const isWithinRightRail = (clientX: number, clientY: number) => {
    const rail = rightRailRef.current;
    if (!rail) return false;
    const rect = rail.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    );
  };

  const beginCarouselDrag = (
    startX: number,
    startY: number,
    input: "pointer" | "mouse" | "touch",
    pointerId: number | null = null,
  ) => {
    carouselDragRef.current.pointerId = pointerId;
    carouselDragRef.current.startX = startX;
    carouselDragRef.current.startY = startY;
    carouselDragRef.current.startIndex = activeIndexRef.current;
    carouselDragRef.current.axis = "undecided";
    carouselDragRef.current.dragged = false;
    carouselDragRef.current.deltaX = 0;
    carouselDragRef.current.visitorGesture = false;
    carouselDragRef.current.captured = false;
    carouselDragRef.current.startedInRail = isWithinRightRail(startX, startY);
    carouselDragRef.current.input = input;
  };

  const updateCarouselDrag = (
    clientX: number,
    clientY: number,
    preventDefault?: () => void,
  ) => {
    const drag = carouselDragRef.current;
    if (!drag.input) return;

    const dx = clientX - drag.startX;
    const dy = clientY - drag.startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (drag.axis === "undecided") {
      if (absDx < CAROUSEL_AXIS_LOCK_MIN_X_PX && absDy < CAROUSEL_AXIS_LOCK_MIN_Y_PX) {
        return;
      }
      if (
        absDx >=
        Math.max(CAROUSEL_AXIS_LOCK_MIN_X_PX, absDy * CAROUSEL_HORIZONTAL_BIAS)
      ) {
        drag.axis = "horizontal";
        setCarouselDragging(true);
      } else if (
        absDy >= CAROUSEL_AXIS_LOCK_MIN_Y_PX &&
        absDy >= absDx * CAROUSEL_VERTICAL_BIAS
      ) {
        drag.axis = "vertical";
        return;
      } else {
        return;
      }
    }

    if (drag.axis !== "horizontal") return;

    drag.dragged = true;
    drag.deltaX = dx;
    preventDefault?.();

    const lastIndex = slideCountRef.current - 1;
    const canProfileSwipe = Boolean(profileSwipeRef.current.move);
    // 两种情况把横滑转成「客态 profile 跟手拖入」：
    // 1) 从右侧操作栏区域起手左滑；
    // 2) 已经停在末图还继续左滑（没有下一张可切了）。
    const railProfileSwipe = drag.startedInRail && dx < 0;
    const endProfileSwipe = drag.startIndex === lastIndex && dx < 0;
    if (
      canProfileSwipe &&
      (drag.visitorGesture || railProfileSwipe || endProfileSwipe)
    ) {
      if (!drag.visitorGesture) {
        drag.visitorGesture = true;
        profileSwipeRef.current.start?.();
      }
      const width = Math.max(1, Math.round(viewportWidthRef.current));
      profileSwipeRef.current.move?.(Math.max(0, Math.min(1, -dx / width)));
      setCarouselOffsetPx(0);
      return;
    }

    const atStart = drag.startIndex === 0 && dx > 0;
    const atEnd = drag.startIndex === lastIndex && dx < 0;
    const resistedDx = atStart || atEnd ? dx * 0.32 : dx;
    setCarouselOffsetPx(resistedDx);
  };

  const finishCarouselDrag = () => {
    const drag = carouselDragRef.current;
    if (!drag.input) return;

    // 只要真的横滑过（包含半路取消的 profile 跟手），就吞掉随后的 click。
    if (drag.dragged || drag.visitorGesture) {
      suppressNextClickRef.current = true;
      window.setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 350);
    }

    if (drag.visitorGesture) {
      const width = Math.max(1, Math.round(viewportWidthRef.current));
      const progress = Math.max(0, Math.min(1, -drag.deltaX / width));
      profileSwipeRef.current.end?.(progress >= PROFILE_SWIPE_COMMIT_PROGRESS);
      resetCarouselDrag();
      return;
    }

    const width = Math.round(viewportWidthRef.current);
    const imageCount = slideCountRef.current;
    if (drag.axis === "horizontal" && width > 0) {
      const progress = Math.abs(drag.deltaX) / width;
      const shouldCommit =
        Math.abs(drag.deltaX) >= CAROUSEL_COMMIT_PX ||
        progress >= CAROUSEL_COMMIT_PROGRESS;
      if (shouldCommit) {
        const direction = drag.deltaX < 0 ? 1 : -1;
        setActiveIndex((previous) => clampIndex(previous + direction, imageCount));
      }
    }

    resetCarouselDrag();
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const supportsPointer =
      typeof window !== "undefined" && "PointerEvent" in window;

    const isCarouselDragExempt = (target: EventTarget | null): boolean => {
      if (!(target instanceof Element)) return false;
      return Boolean(
        target.closest(
          "button, a, input, textarea, select, [role='button'], [role='link'], [data-no-drag]",
        ),
      );
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const inRail = isWithinRightRail(event.clientX, event.clientY);
      const exempt = isCarouselDragExempt(event.target);
      // 操作栏区域即使命中按钮也允许起手（用于左滑进 profile）；其它地方维持原本的按钮豁免。
      if (exempt && !inRail) return;
      if (carouselDragRef.current.input !== null) resetCarouselDrag();
      beginCarouselDrag(event.clientX, event.clientY, "pointer", event.pointerId);
      // 命中按钮时先不抢指针，等横向锁定后再 capture，否则会偷掉按钮点按。
      if (!exempt) {
        carouselDragRef.current.captured = true;
        try {
          root.setPointerCapture(event.pointerId);
        } catch {
          // Pointer capture can fail when the pointer is already released.
        }
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const drag = carouselDragRef.current;
      if (drag.input !== "pointer" || drag.pointerId !== event.pointerId) return;
      // 鼠标移出手机框/窗口外松手收不到 pointerup → 拖拽卡住、回到框内“无按键跟手”。
      // 在 move 时检测按键已抬起就立即收口（与上下滑 pager 同物理）。
      if (event.pointerType === "mouse" && event.buttons === 0) {
        finishCarouselDrag();
        return;
      }
      updateCarouselDrag(event.clientX, event.clientY, () => {
        if (event.cancelable) event.preventDefault();
        event.stopPropagation();
      });
      // 从操作栏按钮起手的手势，锁定为横向后才接管指针（抑制按钮点按）。
      if (!drag.captured && drag.axis === "horizontal") {
        drag.captured = true;
        try {
          root.setPointerCapture(event.pointerId);
        } catch {
          // Pointer capture can fail when the pointer is already released.
        }
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      const drag = carouselDragRef.current;
      if (drag.input !== "pointer" || drag.pointerId !== event.pointerId) return;
      finishCarouselDrag();
    };

    const onLostPointerCapture = () => {
      if (carouselDragRef.current.input === "pointer") finishCarouselDrag();
    };

    const onClickCapture = (event: MouseEvent) => {
      if (!suppressNextClickRef.current) return;
      suppressNextClickRef.current = false;
      event.preventDefault();
      event.stopPropagation();
    };

    const onWindowBlur = () => {
      if (carouselDragRef.current.input) finishCarouselDrag();
    };

    const onWindowVisibilityChange = () => {
      if (document.hidden && carouselDragRef.current.input) finishCarouselDrag();
    };

    const onMouseDown = (event: MouseEvent) => {
      if (carouselDragRef.current.input) return;
      if (event.button !== 0) return;
      if (
        isCarouselDragExempt(event.target) &&
        !isWithinRightRail(event.clientX, event.clientY)
      ) {
        return;
      }
      beginCarouselDrag(event.clientX, event.clientY, "mouse");
    };

    const onMouseMove = (event: MouseEvent) => {
      if (carouselDragRef.current.input !== "mouse") return;
      if (event.buttons === 0) {
        finishCarouselDrag();
        return;
      }
      updateCarouselDrag(event.clientX, event.clientY, () => {
        event.preventDefault();
        event.stopPropagation();
      });
    };

    const onMouseUp = () => {
      if (carouselDragRef.current.input !== "mouse") return;
      finishCarouselDrag();
    };

    const onTouchStart = (event: TouchEvent) => {
      if (carouselDragRef.current.input || event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (!touch) return;
      if (
        isCarouselDragExempt(event.target) &&
        !isWithinRightRail(touch.clientX, touch.clientY)
      ) {
        return;
      }
      beginCarouselDrag(touch.clientX, touch.clientY, "touch");
    };

    const onTouchMove = (event: TouchEvent) => {
      if (carouselDragRef.current.input !== "touch") return;
      const touch = event.touches[0];
      if (!touch) return;
      updateCarouselDrag(touch.clientX, touch.clientY, () => {
        event.preventDefault();
        event.stopPropagation();
      });
    };

    const onTouchEnd = () => {
      if (carouselDragRef.current.input !== "touch") return;
      finishCarouselDrag();
    };

    if (supportsPointer) {
      root.addEventListener("pointerdown", onPointerDown, { capture: true });
      root.addEventListener("pointermove", onPointerMove, { passive: false });
      root.addEventListener("pointerup", onPointerUp);
      root.addEventListener("pointercancel", onPointerUp);
      root.addEventListener("lostpointercapture", onLostPointerCapture);
      // 窗口外松手/失焦兜底（pointer capture 失效时仍能收口，避免拖拽粘连）。
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
    } else {
      root.addEventListener("mousedown", onMouseDown, { capture: true });
      root.addEventListener("touchstart", onTouchStart, {
        capture: true,
        passive: true,
      });
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd);
      window.addEventListener("touchcancel", onTouchEnd);
    }
    root.addEventListener("click", onClickCapture, { capture: true });
    window.addEventListener("blur", onWindowBlur);
    document.addEventListener("visibilitychange", onWindowVisibilityChange);

    return () => {
      root.removeEventListener("click", onClickCapture, { capture: true });
      if (supportsPointer) {
        root.removeEventListener("pointerdown", onPointerDown, { capture: true });
        root.removeEventListener("pointermove", onPointerMove);
        root.removeEventListener("pointerup", onPointerUp);
        root.removeEventListener("pointercancel", onPointerUp);
        root.removeEventListener("lostpointercapture", onLostPointerCapture);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
      } else {
        root.removeEventListener("mousedown", onMouseDown, { capture: true });
        root.removeEventListener("touchstart", onTouchStart, { capture: true });
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
        window.removeEventListener("touchcancel", onTouchEnd);
      }
      window.removeEventListener("blur", onWindowBlur);
      document.removeEventListener("visibilitychange", onWindowVisibilityChange);
    };
    // Mutable gesture state is read through refs to avoid listener gaps while swiping.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCarouselWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    const absX = Math.abs(event.deltaX);
    const absY = Math.abs(event.deltaY);
    const horizontalDelta =
      absX > 0 && absX >= Math.max(8, absY * 0.35)
        ? event.deltaX
        : event.shiftKey && absY > 0
          ? event.deltaY
          : 0;

    if (horizontalDelta === 0 || slideCount <= 1) return;

    event.preventDefault();

    const wheelState = wheelStateRef.current;
    if (wheelState.lock) return;

    wheelState.accumulatedX += horizontalDelta;

    if (wheelState.resetTimer != null) {
      window.clearTimeout(wheelState.resetTimer);
    }
    wheelState.resetTimer = window.setTimeout(() => {
      wheelState.accumulatedX = 0;
      wheelState.resetTimer = null;
    }, 220);

    if (Math.abs(wheelState.accumulatedX) < 36) return;

    const direction = wheelState.accumulatedX > 0 ? 1 : -1;
    wheelState.accumulatedX = 0;
    wheelState.lock = true;
    setActiveIndex((previous) => clampIndex(previous + direction, slideCount));

    if (wheelState.unlockTimer != null) {
      window.clearTimeout(wheelState.unlockTimer);
    }
    wheelState.unlockTimer = window.setTimeout(() => {
      wheelState.lock = false;
      wheelState.unlockTimer = null;
    }, 260);
  };

  const leftColumnStyle: CSSProperties = {
    color: getColorCSSVar("UIText1"),
    textShadow:
      layout.framework === "A" ? "0px 1px 3px rgba(0, 0, 0, 0.5)" : undefined,
  };
  const descTextStyle: CSSProperties = {
    color: getColorCSSVar("UIText1"),
    lineHeight: DESC_LINE_HEIGHT,
  };
  const moreTextStyle: CSSProperties = {
    color: getColorCSSVar("UIText1Display"),
    textAlign: "right",
    fontFamily: DESC_MORE_FONT_FAMILY,
    fontSize: "15px",
    fontStyle: "normal",
    fontWeight: 600,
    lineHeight: DESC_LINE_HEIGHT,
  };
  const titleTextStyle: CSSProperties = {
    ...leftColumnStyle,
    lineHeight: renderTitleLineClamp > 1 ? TITLE_MULTI_LINE_HEIGHT : undefined,
  };
  const visibleDescText = isDescTruncated ? clampedDescText : renderDescText;

  const containerTopPx = layout.framework === "C" ? tabBottomPx : layout.imageTopPx;
  const imageOffsetWithinContainerPx = layout.imageTopPx - containerTopPx;
  const fallbackPageControllerTopPx = Math.max(layout.imageTopPx + 8, usernameTopPx - 8);
  const pageControllerTopPx =
    descriptionTopPx > 0
      ? descriptionTopPx - PAGE_CONTROLLER_GAP_TO_DESCRIPTION_PX
      : fallbackPageControllerTopPx;
  const slideWidthPx = viewportWidth > 0 ? Math.round(viewportWidth) : 0;
  const carouselTrackWidthPx =
    slideWidthPx > 0 ? slideWidthPx * slideCount : 0;
  const carouselTranslateX =
    slideWidthPx > 0
      ? -activeIndex * slideWidthPx + carouselOffsetPx
      : carouselOffsetPx;
  const imageLayoutTransition = suppressLayoutTransition
    ? "none"
    : `top ${IMAGE_LAYOUT_TRANSITION}, height ${IMAGE_LAYOUT_TRANSITION}`;
  const carouselTransition =
    carouselDragging || suppressLayoutTransition
      ? "none"
      : `transform ${IMAGE_LAYOUT_TRANSITION}`;
  const pageControlDots = buildPageControlDots(slideCount, activeIndex);
  const getSlideObjectPosition = (index: number) => {
    const slideAspect = resolvedAspects[index] ?? [1, 1];
    const slideNaturalHeightPx =
      viewportWidth > 0 ? photoHeightAtWidth(viewportWidth, slideAspect) : 0;
    return layout.framework === "B" &&
      slideNaturalHeightPx <= layout.imageContainerHeightPx
      ? "center top"
      : "center center";
  };
  const prepareSharedImageTransitionTarget = (index: number) => {
    if (
      !isVisibleTransitionSource ||
      typeof document === "undefined" ||
      typeof window === "undefined"
    ) {
      return;
    }

    const targetKey = `${content.id}:${index}`;
    document
      .querySelectorAll<HTMLElement>(`[${PHOTO_TEXT_FEED_IMAGE_TARGET_ATTR}]`)
      .forEach((element) => {
        element.style.viewTransitionName = "none";
      });

    const target = rootRef.current?.querySelector<HTMLElement>(
      `[${PHOTO_TEXT_FEED_IMAGE_TARGET_ATTR}="${targetKey}"]`,
    );
    if (!target) return;

    target.style.viewTransitionName = PHOTO_TEXT_SHARED_IMAGE_TRANSITION_NAME;
    target.getBoundingClientRect();
    window.setTimeout(() => {
      if (target.style.viewTransitionName === PHOTO_TEXT_SHARED_IMAGE_TRANSITION_NAME) {
        target.style.viewTransitionName = "none";
      }
    }, 900);
  };
  const persistDetailSourceFrame = (index: number) => {
    if (viewportWidth <= 0 || layout.imageHeightPx <= 0) return;
    savePhotoTextDetailSourceFrame(content.id, index, {
      frameHeightRatio: layout.imageHeightPx / Math.max(1, viewportWidth),
      objectPosition: getSlideObjectPosition(index),
      aspect: displayFrameAspect,
      aspects: displayFrameAspects,
    });
  };
  const handleOpenActiveDetail = () => {
    persistDetailSourceFrame(activeIndex);
    prepareSharedImageTransitionTarget(activeIndex);
    const sourceElement = rootRef.current?.querySelector<HTMLElement>(
      `[${PHOTO_TEXT_FEED_IMAGE_TARGET_ATTR}="${content.id}:${activeIndex}"]`,
    ) ?? null;
    onOpenDetail?.(activeIndex, sourceElement, {
      ...content,
      photoText: {
        ...photoText,
        displayAspects: displayFrameAspects,
      },
    });
  };
  const beginTextDetailTap = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    textDetailTapRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      suppressClick: false,
    };
  };
  const updateTextDetailTap = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const tap = textDetailTapRef.current;
    if (tap.pointerId !== event.pointerId) return;

    const dx = Math.abs(event.clientX - tap.startX);
    const dy = Math.abs(event.clientY - tap.startY);
    if (Math.max(dx, dy) >= TEXT_DETAIL_TAP_CANCEL_PX) {
      tap.suppressClick = true;
    }
  };
  const finishTextDetailTap = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const tap = textDetailTapRef.current;
    if (tap.pointerId !== event.pointerId) return;

    tap.pointerId = null;
    if (!tap.suppressClick) return;

    window.setTimeout(() => {
      if (textDetailTapRef.current.suppressClick) {
        textDetailTapRef.current.suppressClick = false;
      }
    }, 350);
  };
  const handleTextDetailClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (textDetailTapRef.current.suppressClick) {
      event.preventDefault();
      event.stopPropagation();
      textDetailTapRef.current.suppressClick = false;
      return;
    }

    handleOpenActiveDetail();
  };

  return (
    <div
      ref={rootRef}
      data-feed-photo-carousel
      className="relative h-full w-full overflow-hidden bg-tux-v2-brand-tiktok-black"
      style={{ touchAction: "pan-y" }}
      onWheel={handleCarouselWheel}
    >
      <div
        ref={scrollerRef}
        className="absolute left-0 w-full"
        style={{
          top: `${containerTopPx}px`,
          height: `${layout.imageContainerHeightPx}px`,
          transition: imageLayoutTransition,
        }}
      >
        <div
          className="absolute left-0 w-full overflow-hidden"
          style={{
            top: `${imageOffsetWithinContainerPx}px`,
            height: `${layout.imageHeightPx}px`,
            transition: imageLayoutTransition,
          }}
        >
          <div
            className="flex h-full"
            style={{
              width:
                carouselTrackWidthPx > 0
                  ? `${carouselTrackWidthPx}px`
                  : `${slideCount * 100}%`,
              transform: `translate3d(${carouselTranslateX}px, 0, 0)`,
              transition: carouselTransition,
              willChange: "transform",
            }}
          >
            {carouselSlides.map((slide, index) => {
              const slideObjectPosition = getSlideObjectPosition(index);

              return (
                <div
                  key={`${content.id}-${index}`}
                  data-feed-photo-slide
                  className="relative block h-full shrink-0 grow-0 overflow-hidden bg-black"
                  style={{
                    width:
                      slideWidthPx > 0
                        ? `${slideWidthPx}px`
                        : `${100 / slideCount}%`,
                    flex:
                      slideWidthPx > 0 ? `0 0 ${slideWidthPx}px` : undefined,
                    viewTransitionName: "none",
                  }}
                  {...{
                    [PHOTO_TEXT_FEED_IMAGE_TARGET_ATTR]: `${content.id}:${index}`,
                  }}
                  onDragStart={(event) => event.preventDefault()}
                >
                  {slide.kind === "image" ? (
                    <img
                      src={slide.src}
                      alt={`${content.nickname} photo ${index + 1}`}
                      className="h-full w-full"
                      draggable={false}
                      style={{
                        objectFit: "cover",
                        objectPosition: slideObjectPosition,
                      }}
                    />
                  ) : (
                    <TextImageCoverFill
                      templateId={slide.templateId}
                      text={slide.text}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {layout.showBottomGradient ? (
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: PHOTO_TEXT_BOTTOM_GRADIENT }}
            />
          ) : null}
        </div>
      </div>

      {slideCount > 1 ? (
        <div
          data-photo-text-page-dots
          className="pointer-events-auto absolute left-1/2 z-10 -translate-x-1/2 -translate-y-full"
          style={{ top: `${pageControllerTopPx}px` }}
        >
          <div className="relative flex items-center justify-center px-[6px] py-[6px]">
            <div
              className="absolute left-[6px] right-[6px] top-1/2 h-[12px] -translate-y-1/2 blur-[10px]"
              style={{ backgroundColor: "rgba(51, 51, 51, 0.3)" }}
            />
            <div className="relative z-10 flex items-center">
              {pageControlDots.map((dot, index) => (
                <button
                  key={dot.key}
                  type="button"
                  data-no-long-press
                  aria-label={`Show image ${dot.realIndex + 1}`}
                  aria-current={dot.active ? "true" : "false"}
                  className="relative flex shrink-0 items-center justify-center"
                  style={{
                    width: `${PAGE_DOT_WRAPPER_PX}px`,
                    height: `${PAGE_DOT_WRAPPER_PX}px`,
                    padding:
                      dot.active || dot.sizePx === PAGE_DOT_ACTIVE_PX ? "3px" : "0px",
                    marginRight:
                      index === pageControlDots.length - 1
                        ? "0px"
                        : `${PAGE_DOT_GAP_PX - 6}px`,
                  }}
                  onClick={() => setActiveIndex(dot.realIndex)}
                >
                  <span
                    className="block rounded-full transition-all"
                    style={{
                      width: `${dot.sizePx}px`,
                      height: `${dot.sizePx}px`,
                      backgroundColor: dot.active
                        ? "rgba(255, 255, 255, 1)"
                        : "rgba(255, 255, 255, 0.5)",
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div
        ref={bottomAreaRef}
        className="absolute left-0 right-0 z-10"
        style={{
          bottom: "var(--app-tabbar-height, 0px)",
          transition: `bottom ${IMAGE_LAYOUT_TRANSITION}`,
        }}
      >
        <div
          ref={bottomClusterRef}
          className="flex w-full items-end justify-between gap-3"
        >
          <div className="min-w-0 flex-1 pb-2.5 pl-3 pr-4 pt-2">
            <div
              ref={descriptionContentRef}
              data-photo-text-description-content
              className="flex min-w-0 flex-col"
            >
              {repostBar ? <div className="self-start">{repostBar}</div> : null}
              {feedInfo.promo ? (
                <div
                  className="self-start"
                  style={{ marginTop: repostBar ? PHOTO_TEXT_STACK_GAP_PX : 0 }}
                >
                  <FeedPromoBanner text="tonight we are very pleased to present the talk show live" />
                </div>
              ) : null}
              {feedInfo.friendTag ? (
                <div
                  className="self-start"
                  style={{
                    marginTop:
                      repostBar || feedInfo.promo ? PHOTO_TEXT_STACK_GAP_PX : 0,
                  }}
                >
                  <FeedFriendTag />
                </div>
              ) : null}
              {content.location && feedInfo.locationAnchor ? (
                <div
                  className="self-start"
                  style={{
                    marginTop:
                      repostBar || feedInfo.promo || feedInfo.friendTag
                        ? PHOTO_TEXT_STACK_GAP_PX
                        : 0,
                  }}
                >
                  <LocationAnchor label={content.location} />
                </div>
              ) : null}

              <div
                ref={nicknameRef}
                data-photo-text-nickname
                style={{
                  marginTop:
                    repostBar ||
                    feedInfo.promo ||
                    feedInfo.friendTag ||
                    (content.location && feedInfo.locationAnchor)
                      ? PHOTO_TEXT_STACK_GAP_PX
                      : 0,
                }}
              >
                <div className="flex min-w-0 flex-wrap items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Open ${content.nickname}'s profile`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenProfile?.();
                    }}
                    className="shrink-0 cursor-pointer bg-transparent p-0 text-left outline-none"
                  >
                    <TUXText typographyPreset="H3-Semibold" style={leftColumnStyle}>
                      {content.nickname}
                    </TUXText>
                  </button>
                  {feedInfo.verified ? <FeedVerifiedBadge /> : null}
                  {feedInfo.collaborators ? <FeedCollaboratorsChip /> : null}
                  {feedInfo.textType ? <FeedTextTypeChip /> : null}
                </div>
              </div>

              {(renderTitleLineClamp > 0 && renderTitleText) ||
              (renderDescLineClamp > 0 && renderDescText) ? (
                <button
                  type="button"
                  data-no-long-press
                  className="min-w-0 bg-transparent p-0 text-left outline-none"
                  style={{ marginTop: USERNAME_TO_TITLE_GAP_PX }}
                  onPointerDown={beginTextDetailTap}
                  onPointerMove={updateTextDetailTap}
                  onPointerUp={finishTextDetailTap}
                  onPointerCancel={finishTextDetailTap}
                  onClick={handleTextDetailClick}
                >
                  {renderTitleLineClamp > 0 && renderTitleText ? (
                    <div
                      ref={titleRef}
                      data-photo-text-title
                      className="min-w-0 overflow-hidden"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: renderTitleLineClamp,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      <TUXText
                        typographyPreset="H4-Bold"
                        font="TikTokFont"
                        style={titleTextStyle}
                      >
                        {renderTitleText}
                      </TUXText>
                    </div>
                  ) : null}

                  {renderDescLineClamp > 0 && renderDescText ? (
                    <div
                      ref={descRef}
                      data-photo-text-desc
                      className="relative min-w-0 overflow-hidden"
                      style={{
                        marginTop:
                          renderTitleLineClamp > 0 && renderTitleText
                            ? TITLE_TO_DESC_GAP_PX
                            : 0,
                        lineHeight: DESC_LINE_HEIGHT,
                        maxHeight: `${renderDescLineClamp * DESC_LINE_HEIGHT_EM}em`,
                      }}
                    >
                      <TUXText
                        as="span"
                        typographyPreset="H4-Regular"
                        style={descTextStyle}
                      >
                        {visibleDescText}
                      </TUXText>
                      {isDescTruncated ? (
                        <span
                          data-photo-text-more
                          className="pointer-events-none inline-flex items-baseline"
                          style={{ marginLeft: DESC_MORE_GAP_PX }}
                        >
                          <TUXText
                            as="span"
                            typographyPreset="H4-Semibold"
                            font="TikTokFont"
                            style={moreTextStyle}
                          >
                            {DESC_MORE_LABEL}
                          </TUXText>
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </button>
              ) : null}

              {feedInfo.seeOriginal ? (
                <div className="self-start" style={{ marginTop: PHOTO_TEXT_STACK_GAP_PX }}>
                  <FeedSeeOriginal />
                </div>
              ) : null}
              {feedInfo.sponsored ? (
                <div className="self-start" style={{ marginTop: PHOTO_TEXT_STACK_GAP_PX }}>
                  <FeedSponsoredTag />
                </div>
              ) : null}
              {feedInfo.infoBar ? (
                <div style={{ marginTop: PHOTO_TEXT_STACK_GAP_PX }}>
                  <FeedInfoBar />
                </div>
              ) : null}
              {feedInfo.actions ? (
                <div style={{ marginTop: PHOTO_TEXT_STACK_GAP_PX }}>
                  <FeedBottomActions />
                </div>
              ) : null}
            </div>
          </div>

          <div
            ref={rightRailRef}
            className="shrink-0"
            {...{
              [PHOTO_TEXT_FEED_RIGHT_RAIL_TARGET_ATTR]: `${content.id}:${activeIndex}`,
            }}
          >
            {rightRail}
          </div>
        </div>
        {feedInfo.bottomBanner ? <FeedBottomBanner /> : null}
      </div>

      {commentOverlayVisible ? (
        <div
          aria-hidden="true"
          data-photo-text-comment-overlay
          className="pointer-events-none absolute inset-0 z-40"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.55)" }}
        />
      ) : null}
    </div>
  );
}
