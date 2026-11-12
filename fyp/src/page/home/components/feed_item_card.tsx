import { getColorCSSVar, TUXText, usePopMotion } from "@byted-tiktok/tux-web";
import {
  IconMusicNoteSAlt,
  IconMediaComment,
  IconMediaFavoriate,
  IconMediaFavoriateActive,
  IconMediaLike,
  IconMediaLikeActive,
  IconMediaShare,
  IconPlusSmall,
  TUXIconColorPlay,
} from "@byted-tiktok/tux-icons";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
} from "react";
import {
  avatarSlotFromId,
  creatorAvatarUrlForFeedDisplay,
} from "../../../utils/local_avatar";
import type { ResolvedTheme } from "../../../context/theme";
import { LongPressPanel } from "./long_press_panel";
import { SharePanel } from "./share_panel";
import {
  type CommentQuickReactionAnchor,
  CommentQuickReactionPopover,
} from "./comment_quick_reaction_popover";
import {
  type CommentPipMedia,
  type CommentSheetMetrics,
  useCommentPipVideoBridge,
  registerCommentPanelFeedBinding,
  unregisterCommentPanelFeedBinding,
  openCommentPanelFor,
  useCommentPanelHost,
} from "./comment_panel";
import type { CommentContentNode } from "./comment_panel/comment_content_config";
import { useCommentPanelVisualStore } from "./comment_panel/comment_panel_visual_store";
import { useCommentExperimentStore } from "./comment_panel/comment_experiment_store";
import { COMMENT_EMPTY_STATE_QUESTION_OPTIONS } from "./comment_panel/comment_experiment_config";
import { LocationAnchor } from "./location_anchor";
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
import { FeedTitlePanel } from "./title_panel/feed_title_panel";
import { RepostNoteInput } from "./repost/repost_note_input";
import { RepostInteractionPanel } from "./repost/repost_interaction_panel";
import { RepostWhiteBar } from "./repost/repost_white_bar";
import { PhotoTextFeedBlock } from "./photo_text_feed_block";
import {
  beginPhotoTextDetailEnterTransition,
  buildPhotoTextDetailHref,
  navigateWithinApp,
  savePhotoTextDetailSourceFrame,
  savePhotoTextDetailSnapshot,
} from "../../photo_text_detail/photo_text_detail_route";
import { MusicDetailPanel } from "./music_detail_panel";

type RightRailActionButtonProps = {
  ariaLabel: string;
  icon: ReactNode;
  label: ReactNode;
  onClick?: () => void;
  pressed?: boolean;
  buttonRef?: Ref<HTMLButtonElement>;
  onPointerDown?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerCancel?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerLeave?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onContextMenu?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
};

function RightRailActionButton({
  ariaLabel,
  icon,
  label,
  onClick,
  pressed,
  buttonRef,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onPointerLeave,
  onContextMenu,
}: RightRailActionButtonProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={ariaLabel}
      aria-pressed={pressed}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={onPointerLeave}
      onContextMenu={onContextMenu}
      className="flex flex-col items-center py-2 pr-1.5 pl-2.5 cursor-pointer"
    >
      {icon}
      <TUXText typographyPreset="P3-Semibold" className="w-11 text-center" style={{ lineHeight: "16px"}}>
        {label}
      </TUXText>
    </button>
  );
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQueryList = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const onChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    setPrefersReducedMotion(mediaQueryList.matches);

    mediaQueryList.addEventListener("change", onChange);
    return () => mediaQueryList.removeEventListener("change", onChange);
  }, []);

  return prefersReducedMotion;
}

export type FeedItemCardProps = {
  index: number;
  total: number;
  content: FeedItemCardContent;
  isActive?: boolean;
  initialPhotoTextImageIndex?: number;
  isVisiblePhotoTextSource?: boolean;
  /** Tap avatar / nickname → guest profile (Feed swipe-left uses pager hooks). */
  onOpenProfile?: () => void;
  /** Photo-text 末图继续左滑 → 客态 profile 跟手拖入。 */
  onProfileSwipeStart?: () => void;
  onProfileSwipeMove?: (progress: number) => void;
  onProfileSwipeEnd?: (commit: boolean) => void;
  /**
   * 被左侧面板等覆盖层挡住时仅暂停（不重置进度、不动手动暂停态）；
   * 关闭后从当前进度恢复。注意：这与 isActive=false 不同——后者会被
   * 当作“划走到别的视频”而重置进度。
   */
  pausedByOverlay?: boolean;
  /** Feed tab surface theme — music detail panel follows this. */
  surfaceTheme?: ResolvedTheme;
};

export type FeedItemCardMediaContent =
  | {
      type: "image";
      src: string;
      alt?: string;
    }
  | {
      type: "video";
      src: string;
      poster?: string;
      autoPlay?: boolean;
      muted?: boolean;
      loop?: boolean;
    };

export type FeedPhotoTextSlide =
  | { kind: "image"; src: string }
  | { kind: "text-image"; templateId: number; text: string };

export type FeedPhotoTextPayload = {
  images: string[];
  /** When set, carousel renders these slides (supports text-image templates). */
  slides?: FeedPhotoTextSlide[];
  title: string;
  desc: string;
  displayAspects?: readonly (readonly [number, number])[];
};

export type FeedItemCardContent = {
  id: string;
  mediaType: FeedItemCardMediaContent["type"];
  mediaSrc: string;
  mediaAlt?: string;
  mediaPoster?: string;
  mediaAutoPlay?: boolean;
  mediaMuted?: boolean;
  mediaLoop?: boolean;
  nickname: string;
  description: string;
  avatarUrl: string;
  musicTitle: string;
  musicCoverUrl: string;
  location?: string;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  shareCount: number;
  photoText?: FeedPhotoTextPayload;
  /**
   * Optional demo scenario: pre-seeded reposters and/or the guide white bar.
   * Omit on normal feed items — share-sheet Repost still works; the white bar
   * appears after the viewer reposts. `reposterIds` empty = guide entrance.
   */
  repost?: {
    reposterIds: string[];
  };
};

/**
 * iOS（含浏览器与 PWA）下 inline `<video>` 在本 Demo 资源上经常黑屏并拖慢页面，
 * 因此统一降级为静态 poster 图片，绕开 HLS/MP4 解码与自动播放策略问题。
 * 参考：iPadOS 13+ 报告为 Mac UA + 多点触控，故用 vendor + maxTouchPoints 兜底。
 */
const FEED_VIDEO_PLAY_OVERLAY_ICON_PX = 72;

/** 滑离当前卡或 Tab 不可见时仅暂停，保留 src/缓冲，避免回到首页时 poster 重载闪烁。 */
function pauseFeedVideoElement(video: HTMLVideoElement) {
  video.pause();
}

const IS_IOS_LIKE = (() => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS 13+ 默认报告 desktop Safari UA，需要补充触控点判定。
  const hasMultiTouch =
    typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 1;
  if (/Macintosh/.test(ua) && hasMultiTouch) return true;
  return false;
})();

export function FeedItemCard({
  index,
  total,
  content: rawContent,
  isActive = true,
  initialPhotoTextImageIndex,
  isVisiblePhotoTextSource = false,
  onOpenProfile,
  onProfileSwipeStart,
  onProfileSwipeMove,
  onProfileSwipeEnd,
  pausedByOverlay = false,
  surfaceTheme,
}: FeedItemCardProps) {
  const repostConfig = rawContent.repost;
  const repostEnabled = repostConfig != null;
  const reposterIds = repostConfig?.reposterIds ?? [];
  void index;
  void total;

  const feedInfo = useFeedInfoVisibility();

  // iOS 下把视频卡降级为静态海报图——所有视频相关分支（PiP、比例计算、播放控制）
  // 都会自动走 image 分支，不会再挂载 `<video>` 元素。
  const content = useMemo<FeedItemCardContent>(() => {
    if (IS_IOS_LIKE && rawContent.mediaType === "video") {
      return {
        ...rawContent,
        mediaType: "image",
        mediaSrc: rawContent.mediaPoster ?? rawContent.mediaSrc,
      };
    }
    return rawContent;
  }, [rawContent]);
  const isPhotoTextPost = Boolean(content.photoText);

  const feedBindingKey = useId();
  const { isOpen: isCommentPanelOpen } = useCommentPanelVisualStore();
  const {
    visible: isCommentPanelHostVisible,
    activeFeedKey: activeCommentFeedKey,
  } = useCommentPanelHost();
  const isThisCommentPanelOpen =
    isCommentPanelHostVisible && activeCommentFeedKey === feedBindingKey;
  const { commentEmptyState } = useCommentExperimentStore();
  const showQuestionsAfterLongPress =
    commentEmptyState.config.style === "curious-about" &&
    commentEmptyState.config.showQuestionsAfterLongPress;

  const cardRootRef = useRef<HTMLDivElement>(null);
  const mediaVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaImageRef = useRef<HTMLImageElement | null>(null);
  // The "scaleable surface" — everything that visually represents the feed
  // card (background media, readability overlays, bottom-left info, right
  // rail). When the comment sheet rides up we shrink this whole subtree so
  // the card collapses into the space above the sheet, mirroring TikTok's
  // signature "video squeezes into a thumbnail" effect.
  const mediaWrapRef = useRef<HTMLDivElement>(null);
  const mediaTopMaskRef = useRef<HTMLDivElement>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [commentBoost, setCommentBoost] = useState(0);
  const [sessionComments, setSessionComments] = useState<CommentContentNode[]>([]);
  const [isReposted, setIsReposted] = useState(false);
  const [repostNote, setRepostNote] = useState("");
  const [isLongPressPanelVisible, setIsLongPressPanelVisible] = useState(false);
  const [isSharePanelVisible, setIsSharePanelVisible] = useState(false);
  const [isTitlePanelVisible, setIsTitlePanelVisible] = useState(false);
  const [isNoteInputVisible, setIsNoteInputVisible] = useState(false);
  const [isRepostInteractionVisible, setIsRepostInteractionVisible] = useState(false);
  const supportsVideoTapPlayback = content.mediaType === "video";
  const [isVideoManuallyPaused, setIsVideoManuallyPaused] = useState(false);
  // 镜像到 ref：让 resume/activate 等回调读到最新暂停态又不必把
  // isVideoManuallyPaused 列进依赖（否则切换暂停会让回调换身份，连带
  // 重跑「恢复播放」effect，把 currentTime 拉回 0）。
  const isVideoManuallyPausedRef = useRef(false);
  // 与 isActive 对齐初值，避免 IO 回调前误触发 suspend 拆掉 src。
  const [isCardVisibleInFrame, setIsCardVisibleInFrame] = useState(isActive);
  const canPlayFeedVideo =
    content.mediaType === "video" && isActive && isCardVisibleInFrame;

  const handleRepostChange = useCallback((reposted: boolean) => {
    setIsReposted(reposted);
    if (!reposted) setRepostNote("");
  }, []);

  const showRepostChrome = repostEnabled || isReposted;
  const [isCommentReactionVisible, setIsCommentReactionVisible] = useState(false);
  const [commentReactionAnchor, setCommentReactionAnchor] =
    useState<CommentQuickReactionAnchor | null>(null);
  const commentButtonRef = useRef<HTMLButtonElement | null>(null);
  const commentLongPressTimerRef = useRef<number | null>(null);
  const commentLongPressFiredRef = useRef(false);
  const [isMusicDetailVisible, setIsMusicDetailVisible] = useState(false);
  const isMusicDetailOpen = isMusicDetailVisible;
  const [longPressPanelRoot, setLongPressPanelRoot] = useState<HTMLElement | null>(null);
  const feedAvatarSrc = creatorAvatarUrlForFeedDisplay(44, content.id);
  const [avatarSrc, setAvatarSrc] = useState(feedAvatarSrc);
  const [hasVideoAudioActivation, setHasVideoAudioActivation] = useState(false);
  const pipVisibleRef = useRef(false);
  const mediaContentAspectRatioRef = useRef<number | null>(null);
  const [isMusicMarqueeActive, setIsMusicMarqueeActive] = useState(false);
  const [musicMarqueeDistance, setMusicMarqueeDistance] = useState(0);
  const [musicMarqueeDuration, setMusicMarqueeDuration] = useState(8);
  const musicViewportRef = useRef<HTMLDivElement>(null);
  const musicMeasureRef = useRef<HTMLSpanElement>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTrackingRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
  } | null>(null);

  useEffect(() => {
    isVideoManuallyPausedRef.current = isVideoManuallyPaused;
  }, [isVideoManuallyPaused]);

  useEffect(() => {
    setAvatarSrc(creatorAvatarUrlForFeedDisplay(44, content.id));
  }, [content.id]);

  useEffect(() => {
    setHasVideoAudioActivation(false);
  }, [content.id]);

  useEffect(() => {
    setIsLiked(false);
    setIsFavorited(false);
    setCommentBoost(0);
    setSessionComments([]);
  }, [content.id]);

  useEffect(() => {
    mediaContentAspectRatioRef.current = null;
  }, [content.id, content.mediaSrc, content.mediaType]);

  useEffect(() => {
    const frameRoot = cardRootRef.current?.closest(
      "[data-app-frame-root='true']",
    ) as HTMLElement | null;
    setLongPressPanelRoot(frameRoot ?? null);
  }, []);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current != null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const clearCommentLongPressTimer = useCallback(() => {
    if (commentLongPressTimerRef.current != null) {
      window.clearTimeout(commentLongPressTimerRef.current);
      commentLongPressTimerRef.current = null;
    }
  }, []);

  const bumpCommentCount = useCallback(() => {
    setCommentBoost((prev) => prev + 1);
  }, []);

  const handleCommentPosted = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setSessionComments((prev) => [
        {
          id: `session-${content.id}-${prev.length}`,
          authorName: "You",
          authorAvatarSrc: String(avatarSlotFromId("comment-composer", 60)),
          content: trimmed,
          timeLabel: "Just now",
          likeCountLabel: "0",
          replies: [],
        },
        ...prev,
      ]);
      bumpCommentCount();
    },
    [bumpCommentCount, content.id],
  );

  const openCommentReactionFromButton = useCallback(() => {
    const buttonEl = commentButtonRef.current;
    if (!buttonEl) return;
    const rect = buttonEl.getBoundingClientRect();
    setCommentReactionAnchor({
      buttonLeft: rect.left,
      buttonCenterY: rect.top + rect.height / 2,
    });
    setIsCommentReactionVisible(true);
  }, []);

  const onCommentButtonPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      // 评论按钮的长按手势走自己的定时器；
      // 不走外层 onMediaPointerDown（capture 阶段会被 button 命中过滤掉）。
      commentLongPressFiredRef.current = false;
      clearCommentLongPressTimer();
      commentLongPressTimerRef.current = window.setTimeout(() => {
        commentLongPressFiredRef.current = true;
        commentLongPressTimerRef.current = null;
        openCommentReactionFromButton();
      }, 380);
    },
    [clearCommentLongPressTimer, openCommentReactionFromButton],
  );

  const onCommentButtonPointerUp = useCallback(() => {
    clearCommentLongPressTimer();
  }, [clearCommentLongPressTimer]);

  const onCommentButtonPointerCancel = useCallback(() => {
    clearCommentLongPressTimer();
  }, [clearCommentLongPressTimer]);

  const onCommentButtonContextMenu = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      // 桌面右键 / 移动端长按系统菜单都拦掉，避免遮住自定义弹层。
      event.preventDefault();
    },
    [],
  );

  useEffect(() => {
    return () => clearCommentLongPressTimer();
  }, [clearCommentLongPressTimer]);

  const cancelLongPressTracking = useCallback(() => {
    clearLongPressTimer();
    longPressTrackingRef.current = null;
  }, [clearLongPressTimer]);

  useEffect(() => {
    if (!isActive) {
      setIsVideoManuallyPaused(false);
      setIsCardVisibleInFrame(false);
      return;
    }
    setIsCardVisibleInFrame(true);
  }, [isActive]);

  useEffect(() => {
    if (content.mediaType !== "video" || !isActive) return;
    const element = cardRootRef.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsCardVisibleInFrame(true);
      return;
    }

    const frameRoot = element.closest("[data-app-frame-root='true']");
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsCardVisibleInFrame(entry.isIntersecting);
      },
      {
        root: frameRoot ?? null,
        threshold: 0,
      },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [content.id, content.mediaType, isActive]);

  const pauseInactiveFeedVideo = useCallback(() => {
    const video = mediaVideoRef.current;
    if (!video || content.mediaType !== "video") return;
    pauseFeedVideoElement(video);
  }, [content.mediaType]);

  const resumeVideoPlayback = useCallback(() => {
    const video = mediaVideoRef.current;
    if (!video || !canPlayFeedVideo) return;
    if (isVideoManuallyPausedRef.current) {
      video.pause();
      return;
    }
    if (pipVisibleRef.current) {
      video.pause();
      return;
    }
    video.defaultMuted = true;
    video.muted = true;
    video.volume = 0;
    const playPromise = video.play();
    playPromise?.catch(() => {
      // Ignore autoplay rejections; the next explicit user gesture will retry.
    });
  }, [canPlayFeedVideo]);

  useEffect(() => {
    if (canPlayFeedVideo) {
      resumeVideoPlayback();
      return;
    }
    pauseInactiveFeedVideo();
    setHasVideoAudioActivation(false);
  }, [canPlayFeedVideo, pauseInactiveFeedVideo, resumeVideoPlayback]);

  // 左侧面板等覆盖层挡住当前视频：仅暂停、保留进度与手动暂停态；
  // 关闭后 resumeVideoPlayback 会从当前位置继续（手动暂停的则保持暂停）。
  useEffect(() => {
    if (content.mediaType !== "video") return;
    const video = mediaVideoRef.current;
    if (!video) return;
    if (pausedByOverlay) {
      video.pause();
    } else {
      resumeVideoPlayback();
    }
  }, [pausedByOverlay, content.mediaType, resumeVideoPlayback]);

  const toggleVideoPlayback = useCallback(() => {
    const video = mediaVideoRef.current;
    if (!video || !supportsVideoTapPlayback || !canPlayFeedVideo) return;
    if (pipVisibleRef.current) return;

    if (isVideoManuallyPaused || video.paused) {
      isVideoManuallyPausedRef.current = false;
      setIsVideoManuallyPaused(false);
      video.defaultMuted = true;
      video.muted = true;
      video.volume = 0;
      void video.play().catch(() => {
        /* autoplay policy */
      });
      return;
    }

    isVideoManuallyPausedRef.current = true;
    setIsVideoManuallyPaused(true);
    video.pause();
  }, [
    canPlayFeedVideo,
    isVideoManuallyPaused,
    supportsVideoTapPlayback,
  ]);

  const activateVideoAudio = useCallback(() => {
    const video = mediaVideoRef.current;
    if (!video || !canPlayFeedVideo) return;
    // 手动暂停状态下，按下画面（含滑动起手）不应自动续播，否则上下滑/左右滑
    // 都会把暂停的视频又播起来。恢复播放交给点按 toggle。
    if (isVideoManuallyPausedRef.current) return;
    if (pipVisibleRef.current) {
      video.pause();
      return;
    }
    setHasVideoAudioActivation(true);
    video.defaultMuted = true;
    video.muted = true;
    video.volume = 0;
    const playPromise = video.play();
    playPromise?.catch(() => {
      /* noop */
    });
  }, [canPlayFeedVideo]);

  const updateMediaContentAspectRatio = useCallback((size: {
    width: number;
    height: number;
  } | null) => {
    if (!size) return;
    if (size.width <= 0 || size.height <= 0) return;
    mediaContentAspectRatioRef.current = size.height / size.width;
  }, []);

  useEffect(() => {
    if (content.mediaType !== "image") return;
    const image = mediaImageRef.current;
    if (!image?.complete) return;
    updateMediaContentAspectRatio({
      width: image.naturalWidth,
      height: image.naturalHeight,
    });
  }, [content.mediaType, content.mediaSrc, updateMediaContentAspectRatio]);

  const pipVideoBridge = useCommentPipVideoBridge({
    mediaKind: content.mediaType,
    mediaMuted: content.mediaMuted,
    isActive,
    resetKey: content.id,
    hasVideoAudioActivation,
    pipVisibleRef,
    videoRef: mediaVideoRef,
    resumePlayback: resumeVideoPlayback,
  });

  const pipMedia = useMemo<CommentPipMedia>(() => ({
    kind: content.mediaType,
    src: content.mediaSrc,
    poster: content.mediaPoster,
    videoBridge: pipVideoBridge,
  }), [
    content.mediaPoster,
    content.mediaSrc,
    content.mediaType,
    pipVideoBridge,
  ]);

  useEffect(() => {
    // 仅 active 卡需要追踪 long-press 取消手势；
    // 其它克隆卡挂 window listener 是浪费。
    if (!isActive) return;

    const LONG_PRESS_MOVE_CANCEL_PX = 10;

    const onWindowPointerMove = (event: PointerEvent) => {
      const tracking = longPressTrackingRef.current;
      if (!tracking || event.pointerId !== tracking.pointerId) return;

      const deltaX = Math.abs(event.clientX - tracking.startX);
      const deltaY = Math.abs(event.clientY - tracking.startY);
      if (
        deltaX >= LONG_PRESS_MOVE_CANCEL_PX ||
        deltaY >= LONG_PRESS_MOVE_CANCEL_PX
      ) {
        cancelLongPressTracking();
      }
    };

    const onWindowPointerEnd = (event: PointerEvent) => {
      const tracking = longPressTrackingRef.current;
      if (!tracking || event.pointerId !== tracking.pointerId) return;

      const deltaX = Math.abs(event.clientX - tracking.startX);
      const deltaY = Math.abs(event.clientY - tracking.startY);
      const isTap =
        deltaX < LONG_PRESS_MOVE_CANCEL_PX && deltaY < LONG_PRESS_MOVE_CANCEL_PX;

      if (supportsVideoTapPlayback && isTap) {
        toggleVideoPlayback();
      }

      cancelLongPressTracking();
    };

    window.addEventListener("pointermove", onWindowPointerMove);
    window.addEventListener("pointerup", onWindowPointerEnd);
    window.addEventListener("pointercancel", onWindowPointerEnd);

    return () => {
      window.removeEventListener("pointermove", onWindowPointerMove);
      window.removeEventListener("pointerup", onWindowPointerEnd);
      window.removeEventListener("pointercancel", onWindowPointerEnd);
    };
  }, [cancelLongPressTracking, isActive, supportsVideoTapPlayback, toggleVideoPlayback]);

  useEffect(() => {
    return () => cancelLongPressTracking();
  }, [cancelLongPressTracking]);

  const prefersReducedMotion = usePrefersReducedMotion();

  /* ------------------------------------------------------------------ *
   * Comment-sheet → media squeeze coupling.
   *
   * This intentionally stays close to the original implementation: the sheet
   * reports its top edge each frame, and we mutate the media wrapper transform
   * directly. The only extra rule is that very tall media uses a 4:3 virtual
   * height for the scale denominator, which makes the shrunk media larger.
   * ------------------------------------------------------------------ */
  // 缓存动画期间不变的几何量（由消费者在 panel 第一次可见时刷新）。
  // 避免每帧 getComputedStyle / offsetHeight / offsetWidth 触发同步 layout。
  const squeezeGeometryRef = useRef<{
    topInsetPx: number;
    naturalHeight: number;
    naturalWidth: number;
  } | null>(null);

  const resetCommentSqueezeStyles = useCallback(() => {
    const el = mediaWrapRef.current;
    const topMaskEl = mediaTopMaskRef.current;

    if (el) {
      el.style.transform = "";
      el.style.transformOrigin = "";
      el.style.transition = "";
      el.style.willChange = "";
    }
    if (topMaskEl) {
      topMaskEl.style.height = "0px";
      topMaskEl.style.opacity = "0";
      topMaskEl.style.transform = "";
      topMaskEl.style.transition = "";
    }
    squeezeGeometryRef.current = null;
  }, []);

  const handleCommentMetrics = useCallback((m: CommentSheetMetrics) => {
    const el = mediaWrapRef.current;
    const topMaskEl = mediaTopMaskRef.current;
    if (!el) return;

    const dismissProgress = Math.max(0, Math.min(1, m.dismissProgress ?? 0));

    if (!m.visible && dismissProgress <= 0.001) {
      resetCommentSqueezeStyles();
      return;
    }

    // 在 panel 第一次出现时一次性测量所有几何信息，之后整段动画都复用。
    let geometry = squeezeGeometryRef.current;
    if (!geometry) {
      const frameEl = el.closest(
        '[data-app-frame-root="true"]',
      ) as HTMLElement | null;
      if (!frameEl) {
        if (!m.visible) resetCommentSqueezeStyles();
        return;
      }
      const naturalHeight = el.offsetHeight;
      const naturalWidth = el.offsetWidth;
      if (naturalHeight <= 0 || naturalWidth <= 0) {
        if (!m.visible) resetCommentSqueezeStyles();
        return;
      }
      const topInsetStr = getComputedStyle(frameEl)
        .getPropertyValue("--app-frame-top-inset")
        .trim();
      const topInsetPx = Number.isFinite(parseFloat(topInsetStr))
        ? parseFloat(topInsetStr)
        : 0;
      geometry = { topInsetPx, naturalHeight, naturalWidth };
      squeezeGeometryRef.current = geometry;
    }

    const { topInsetPx, naturalHeight, naturalWidth } = geometry;

    if (m.sheetTopY >= m.frameHeight - 1) {
      // sheet 已经完全滑出屏幕外才 reset。
      // 之前用的是 naturalHeight（feed 卡高度）作判定，
      // 当 sheet 顶部降到 tabbar 区域时虽然 progress 还非零（scale<1），
      // reset 会把 scale 强行拉回 1 → 视觉上"突然放大一下"。
      // 现在让 phase 1 自己平滑收尾到 progress=0 → scale=1。
      resetCommentSqueezeStyles();
      return;
    }

    let contentAspectRatio = mediaContentAspectRatioRef.current;
    if (content.mediaType === "video") {
      const video = mediaVideoRef.current;
      if (video && video.videoWidth > 0 && video.videoHeight > 0) {
        contentAspectRatio = video.videoHeight / video.videoWidth;
      }
    } else {
      const image = mediaImageRef.current;
      if (image && image.naturalWidth > 0 && image.naturalHeight > 0) {
        contentAspectRatio = image.naturalHeight / image.naturalWidth;
      }
    }

    const targetPanelHeight = m.frameHeight * 0.73;
    const visiblePanelHeight = Math.max(0, m.frameHeight - m.sheetTopY);
    const rawProgress = visiblePanelHeight / Math.max(1, targetPanelHeight);
    const progress = Math.max(0, rawProgress) * (1 - dismissProgress);

    if (progress <= 0.02) {
      resetCommentSqueezeStyles();
      return;
    }

    const fitHeight =
      contentAspectRatio != null && contentAspectRatio > 4 / 3
        ? naturalWidth * (4 / 3)
        : naturalHeight;
    const targetSpace = Math.max(0, m.frameHeight - targetPanelHeight - topInsetPx);
    const targetScale = Math.max(0, Math.min(1, targetSpace / fitHeight));
    const targetHeight = naturalHeight * targetScale;
    const targetTranslateY = topInsetPx + (targetSpace - targetHeight) / 2;

    let scale: number;
    let translateY: number;
    if (progress <= 1) {
      // Phase 1: interpolate from natural to target (4:3 centered) state.
      scale = 1 + (targetScale - 1) * progress;
      translateY = targetTranslateY * progress;
    } else {
      // Phase 2: keep tracking the actual remaining space above the panel so
      // the media keeps shrinking until it disappears as the panel grows past
      // the 7-screen mark.
      const actualSpace = Math.max(0, m.sheetTopY - topInsetPx);
      scale = Math.min(targetScale, actualSpace / fitHeight);
      const actualHeight = naturalHeight * scale;
      translateY = topInsetPx + (actualSpace - actualHeight) / 2;
    }

    if (scale >= 0.9995 && Math.abs(translateY) <= 0.5) {
      resetCommentSqueezeStyles();
      return;
    }

    const maskOpacity = Math.min(1, progress);
    if (topMaskEl) {
      // mask 的 height 在初次进入时设为 topInsetPx 后就不再变化（避免 layout）；
      // 整段动画只通过 transform/opacity 控制视觉，纯合成层。
      if (topMaskEl.style.height !== `${Math.max(0, topInsetPx)}px`) {
        topMaskEl.style.height = `${Math.max(0, topInsetPx)}px`;
        topMaskEl.style.transition = "none";
      }
      topMaskEl.style.opacity = String(maskOpacity);
      topMaskEl.style.transform = `translate3d(0, ${-Math.max(0, topInsetPx) * (1 - maskOpacity)}px, 0)`;
    }
    // transformOrigin / transition / willChange 在整段动画期间不变；
    // 仅在首次进入时写一次，避免每帧触发 style recalc。
    if (el.style.transformOrigin !== "50% 0%") {
      el.style.transformOrigin = "50% 0%";
      el.style.transition = "none";
      el.style.willChange = "transform";
    }
    el.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
  }, [content.mediaType, resetCommentSqueezeStyles]);

  const handlePhotoTextCommentMetrics = useCallback(() => {
    resetCommentSqueezeStyles();
  }, [resetCommentSqueezeStyles]);

  // 把当前 feed 的 pipMedia + squeeze handler 注册到 CommentPanel 单例宿主。
  // 仅当 isActive 时注册，避免 loop 模式下三份克隆互相覆盖。
  // 关键：deps 变化时 register 是"更新"语义（永不 delete），
  // 这样即便 pipMedia 引用因 hasVideoAudioActivation 等变化重建，
  // host 拿到的 binding 也是连续的——CommentVideoPiP 不会被打断重置。
  // 仅当 isActive 真正切换为 false 或组件卸载时，才 unregister。
  useEffect(() => {
    if (!isActive) return;
    registerCommentPanelFeedBinding(feedBindingKey, {
      feedContentId: content.id,
      pipMedia: isPhotoTextPost ? null : pipMedia,
      applySqueeze: isPhotoTextPost
        ? handlePhotoTextCommentMetrics
        : handleCommentMetrics,
      preserveFeedChrome: isPhotoTextPost,
      sessionComments,
      onCommentPosted: handleCommentPosted,
    });
  }, [
    content.id,
    feedBindingKey,
    handleCommentMetrics,
    handleCommentPosted,
    handlePhotoTextCommentMetrics,
    isActive,
    isPhotoTextPost,
    pipMedia,
    sessionComments,
  ]);

  useEffect(() => {
    if (!isActive) return;
    return () => {
      unregisterCommentPanelFeedBinding(feedBindingKey);
    };
  }, [feedBindingKey, isActive]);

  const timeoutsRef = useRef<number[]>([]);
  useEffect(() => {
    return () => {
      for (const timeoutId of timeoutsRef.current) {
        window.clearTimeout(timeoutId);
      }
      timeoutsRef.current = [];
    };
  }, []);

  const [likePopActive, setLikePopActive] = useState(false);
  const [favoritePopActive, setFavoritePopActive] = useState(false);

  const likeScale = usePopMotion({
    active: !prefersReducedMotion && likePopActive,
    from: 1,
    to: 1.18,
    bounciness: 6,
    speed: 18,
  });

  const favoriteScale = usePopMotion({
    active: !prefersReducedMotion && favoritePopActive,
    from: 1,
    to: 1.18,
    bounciness: 6,
    speed: 18,
  });

  const triggerLikeToggle = () => {
    if (prefersReducedMotion) {
      setIsLiked((value) => !value);
      return;
    }

    if (likePopActive) return;

    setLikePopActive(true);
    timeoutsRef.current.push(
      window.setTimeout(() => {
        setIsLiked((value) => !value);
      }, 90),
    );
    timeoutsRef.current.push(
      window.setTimeout(() => {
        setLikePopActive(false);
      }, 180),
    );
  };

  const triggerFavoriteToggle = () => {
    if (prefersReducedMotion) {
      setIsFavorited((value) => !value);
      return;
    }

    if (favoritePopActive) return;

    setFavoritePopActive(true);
    timeoutsRef.current.push(
      window.setTimeout(() => {
        setIsFavorited((value) => !value);
      }, 90),
    );
    timeoutsRef.current.push(
      window.setTimeout(() => {
        setFavoritePopActive(false);
      }, 180),
    );
  };

  const textShadowColor = getColorCSSVar("FeedTopTabTextShadowA66");

  const overlayTextStyle: CSSProperties = {
    color: getColorCSSVar("UIText1"),
    textShadow: `0px 1px 3px ${textShadowColor}`,
  };
  const leftOverlayTextStyle: CSSProperties = {
    color: getColorCSSVar("UIText1"),
  };
  const musicTextFadeStyle: CSSProperties = {
    ...leftOverlayTextStyle,
    WebkitMaskImage:
      "linear-gradient(to right, #000 0%, #000 calc(100% - 24px), transparent 100%)",
    maskImage:
      "linear-gradient(to right, #000 0%, #000 calc(100% - 24px), transparent 100%)",
  };
  const formatCount = (value: number) =>
    new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);

  const displayedLikeCount = content.likeCount + (isLiked ? 1 : 0);
  const displayedFavoriteCount = content.favoriteCount + (isFavorited ? 1 : 0);
  const displayedCommentCount = content.commentCount + commentBoost;
  const displayedShareCount = content.shareCount;

  const openCommentPanel = useCallback(() => {
    activateVideoAudio();
    openCommentPanelFor(feedBindingKey);
  }, [activateVideoAudio, feedBindingKey]);

  const onMediaPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if ((event.target as Element).closest("button, [data-no-long-press]")) return;

    // The left-edge 20% strip is reserved for the sidebar gesture. Do not arm
    // feed long-press interactions there, otherwise the long-press panel can
    // race with the sidebar swipe gesture.
    if (typeof window !== "undefined" && event.clientX <= window.innerWidth * 0.2) {
      cancelLongPressTracking();
      return;
    }

    activateVideoAudio();

    cancelLongPressTracking();
    longPressTrackingRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };

    longPressTimerRef.current = window.setTimeout(() => {
      setIsLongPressPanelVisible(true);
      cancelLongPressTracking();
    }, 600);
  };

  useEffect(() => {
    // 仅 active 卡才需要测量 marquee；loop 模式下 N×3 份卡同时运行
    // ResizeObserver 是切卡卡顿的来源之一。
    if (!isActive) {
      setIsMusicMarqueeActive(false);
      return;
    }

    const updateMarqueeState = () => {
      if (prefersReducedMotion) {
        setIsMusicMarqueeActive(false);
        return;
      }

      const viewportWidth = musicViewportRef.current?.clientWidth ?? 0;
      const textWidth = musicMeasureRef.current?.scrollWidth ?? 0;
      const marqueeGap = 24;

      if (textWidth > viewportWidth + 1) {
        const distance = textWidth + marqueeGap;
        setIsMusicMarqueeActive(true);
        setMusicMarqueeDistance(distance);
        setMusicMarqueeDuration(Math.max(5, distance / 26));
      } else {
        setIsMusicMarqueeActive(false);
      }
    };

    updateMarqueeState();

    const resizeObserver = new ResizeObserver(updateMarqueeState);
    if (musicViewportRef.current) resizeObserver.observe(musicViewportRef.current);
    if (musicMeasureRef.current) resizeObserver.observe(musicMeasureRef.current);

    window.addEventListener("resize", updateMarqueeState);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateMarqueeState);
    };
  }, [content.musicTitle, prefersReducedMotion, isActive]);

  const readabilityOverlayBackground =
    "linear-gradient(0deg, rgba(0, 0, 0, 0.00) 82.45%, rgba(0, 0, 0, 0.00) 83.87%, rgba(0, 0, 0, 0.01) 85.18%, rgba(0, 0, 0, 0.03) 86.4%, rgba(0, 0, 0, 0.05) 87.55%, rgba(0, 0, 0, 0.08) 88.64%, rgba(0, 0, 0, 0.11) 89.69%, rgba(0, 0, 0, 0.14) 90.72%, rgba(0, 0, 0, 0.17) 91.74%, rgba(0, 0, 0, 0.19) 92.76%, rgba(0, 0, 0, 0.22) 93.81%, rgba(0, 0, 0, 0.25) 94.9%, rgba(0, 0, 0, 0.27) 96.05%, rgba(0, 0, 0, 0.29) 97.27%, rgba(0, 0, 0, 0.30) 98.58%, rgba(0, 0, 0, 0.30) 100%), linear-gradient(180deg, rgba(0, 0, 0, 0.00) 83.84%, rgba(0, 0, 0, 0.00) 85.14%, rgba(0, 0, 0, 0.01) 86.35%, rgba(0, 0, 0, 0.03) 87.47%, rgba(0, 0, 0, 0.04) 88.53%, rgba(0, 0, 0, 0.06) 89.54%, rgba(0, 0, 0, 0.08) 90.51%, rgba(0, 0, 0, 0.11) 91.45%, rgba(0, 0, 0, 0.13) 92.39%, rgba(0, 0, 0, 0.16) 93.33%, rgba(0, 0, 0, 0.18) 94.3%, rgba(0, 0, 0, 0.20) 95.31%, rgba(0, 0, 0, 0.22) 96.36%, rgba(0, 0, 0, 0.23) 97.49%, rgba(0, 0, 0, 0.24) 98.7%, rgba(0, 0, 0, 0.24) 100%)";
  const bottomTextBackdropBackground =
    "linear-gradient(180deg, rgba(0, 0, 0, 0.00) 0%, rgba(0, 0, 0, 0.08) 36%, rgba(0, 0, 0, 0.18) 68%, rgba(0, 0, 0, 0.28) 100%)";
  const photoTextRightRail = (
    <div className="z-20 flex flex-col items-center">
      <div className="relative flex flex-col items-center py-2.5 pr-1.5 pl-2.5">
        <button
          type="button"
          aria-label="Open profile"
          onClick={onOpenProfile}
          className="bg-tux-v2-ui-page-flat-1 rounded-full w-11 h-11 overflow-hidden cursor-pointer"
          style={{ boxShadow: "inset 0 0 0 0.5px rgba(255,255,255,0.2)" }}
        >
          <img
            src={avatarSrc}
            alt={`${content.nickname} avatar`}
            className="w-full h-full object-cover"
            onError={() => {
              setAvatarSrc(creatorAvatarUrlForFeedDisplay(44, content.id));
            }}
          />
        </button>
        <div
          aria-label="Follow"
          className="-mt-2.5 rounded-full"
          style={{ backgroundColor: getColorCSSVar("UIShapePrimary") }}
        >
          <span className="w-5 h-5">
            <IconPlusSmall
              className="text-tux-v2-ui-text-1"
              width={20}
              height={20}
            />
          </span>
        </div>
      </div>

      <RightRailActionButton
        ariaLabel="Like"
        pressed={isLiked}
        onClick={triggerLikeToggle}
        icon={
          <div
            className="flex justify-center items-center w-8 h-8"
            style={{ transform: `scale(${likeScale})` }}
          >
            {isLiked ? (
              <IconMediaLikeActive
                className="text-tux-v2-ui-shape-danger"
                width={32}
                height={32}
              />
            ) : (
              <IconMediaLike
                className="text-tux-v2-ui-text-1"
                width={32}
                height={32}
              />
            )}
          </div>
        }
        label={
          <span style={overlayTextStyle}>
            {formatCount(displayedLikeCount)}
          </span>
        }
      />

      <RightRailActionButton
        ariaLabel="Comment"
        buttonRef={commentButtonRef}
        onPointerDown={onCommentButtonPointerDown}
        onPointerUp={onCommentButtonPointerUp}
        onPointerCancel={onCommentButtonPointerCancel}
        onPointerLeave={onCommentButtonPointerCancel}
        onContextMenu={onCommentButtonContextMenu}
        onClick={() => {
          if (commentLongPressFiredRef.current) {
            commentLongPressFiredRef.current = false;
            return;
          }
          openCommentPanel();
        }}
        icon={
          <IconMediaComment
            className="text-tux-v2-ui-text-1"
            width={32}
            height={32}
          />
        }
        label={
          <span style={overlayTextStyle}>
            {formatCount(displayedCommentCount)}
          </span>
        }
      />

      <RightRailActionButton
        ariaLabel="Favorite"
        pressed={isFavorited}
        onClick={triggerFavoriteToggle}
        icon={
          <div
            className="flex justify-center items-center w-8 h-8"
            style={{ transform: `scale(${favoriteScale})` }}
          >
            {isFavorited ? (
              <IconMediaFavoriateActive
                className="text-tux-v2-ui-shape-primary"
                width={32}
                height={32}
              />
            ) : (
              <IconMediaFavoriate
                className="text-tux-v2-ui-text-1"
                width={32}
                height={32}
              />
            )}
          </div>
        }
        label={
          <span style={overlayTextStyle}>
            {formatCount(displayedFavoriteCount)}
          </span>
        }
      />

      <RightRailActionButton
        ariaLabel="Share"
        onClick={() => setIsSharePanelVisible(true)}
        icon={
          <IconMediaShare
            className="text-tux-v2-ui-text-1"
            width={32}
            height={32}
          />
        }
        label={
          <span style={overlayTextStyle}>
            {formatCount(displayedShareCount)}
          </span>
        }
      />

      <button
        type="button"
        aria-label="Music"
        data-no-long-press
        className="pt-2 pr-2 pb-3 pl-3"
        onClick={() => setIsMusicDetailVisible(true)}
      >
        <div
          className="block bg-tux-v2-ui-page-flat-1 rounded-full w-10 h-10"
          style={{ boxShadow: "inset 0 0 0 0.5px rgba(255,255,255,0.2)" }}
        >
          <img
            src={content.musicCoverUrl}
            alt={`${content.musicTitle} cover`}
            className="rounded-full w-full h-full object-cover"
          />
        </div>
      </button>
    </div>
  );

  return (
    <div
      ref={cardRootRef}
      className="relative bg-tux-v2-brand-tiktok-black w-full h-full overflow-hidden"
      onPointerDownCapture={onMediaPointerDown}
    >
      {/* Scaleable card surface — see `handleCommentMetrics` above. The
          three children (media, readability overlay, bottom info + right
          rail) shrink together as one visual unit when the comment sheet
          rides up, so the entire card retracts into the top slice.
          Panels (long-press / share / comment) live OUTSIDE this wrap so
          they keep their natural 1:1 layout regardless of the squeeze. */}
      <div
        ref={mediaTopMaskRef}
        className="top-0 right-0 left-0 z-10 absolute bg-tux-v2-brand-tiktok-black pointer-events-none"
        style={{ height: 0, opacity: 0 }}
      />
      <div ref={mediaWrapRef} className="absolute inset-0">
        {content.photoText ? (
          <PhotoTextFeedBlock
            content={content}
            initialActiveImageIndex={initialPhotoTextImageIndex}
            isVisibleTransitionSource={isVisiblePhotoTextSource}
            repostBar={
              showRepostChrome ? (
                <RepostWhiteBar
                  reposterIds={reposterIds}
                  isReposted={isReposted}
                  note={repostNote}
                  onRepost={() => handleRepostChange(true)}
                  onOpenPanel={() => setIsRepostInteractionVisible(true)}
                  onOpenNote={() => setIsNoteInputVisible(true)}
                />
              ) : null
            }
            rightRail={photoTextRightRail}
            onOpenProfile={onOpenProfile}
            onProfileSwipeStart={onProfileSwipeStart}
            onProfileSwipeMove={onProfileSwipeMove}
            onProfileSwipeEnd={onProfileSwipeEnd}
            commentOverlayVisible={
              isThisCommentPanelOpen ||
              (isPhotoTextPost && isActive && isCommentPanelOpen)
            }
            onOpenDetail={(imageIndex, sourceElement, detailContent) => {
              savePhotoTextDetailSnapshot(detailContent);
              if (sourceElement) {
                const sourceRect = sourceElement.getBoundingClientRect();
                const sourceImage = sourceElement.querySelector<HTMLImageElement>("img");
                if (sourceRect.width > 0 && sourceRect.height > 0) {
                  savePhotoTextDetailSourceFrame(detailContent.id, imageIndex, {
                    frameHeightRatio: sourceRect.height / sourceRect.width,
                    objectPosition:
                      sourceImage?.style.objectPosition || "center center",
                    aspect: detailContent.photoText.displayAspects?.[imageIndex],
                    aspects: detailContent.photoText.displayAspects,
                  });
                }
              }
              const detailHref = buildPhotoTextDetailHref(detailContent.id, imageIndex);
              if (sourceElement) {
                beginPhotoTextDetailEnterTransition({
                  sourceElement,
                  targetHref: detailHref,
                  imageIndex,
                });
                return;
              }
              navigateWithinApp(detailHref);
            }}
          />
        ) : (
          <>
        {/* Config-driven media */}
        <div
          className="top-0 right-0 left-0 absolute bg-tux-v2-brand-tiktok-black"
          style={{ bottom: "var(--app-tabbar-height, 0px)" }}
        >
          {content.mediaType === "video" ? (
            <>
              <video
                key={content.mediaSrc}
                ref={mediaVideoRef}
                className="w-full h-full object-cover bg-tux-v2-brand-tiktok-black"
                autoPlay={false}
                muted
                loop={content.mediaLoop ?? true}
                playsInline
                preload={canPlayFeedVideo ? "auto" : "metadata"}
                onLoadedMetadata={(event) => {
                  updateMediaContentAspectRatio({
                    width: event.currentTarget.videoWidth,
                    height: event.currentTarget.videoHeight,
                  });
                }}
                onLoadedData={resumeVideoPlayback}
                onCanPlay={resumeVideoPlayback}
              >
                <source src={content.mediaSrc} type="video/mp4" />
              </video>
              {supportsVideoTapPlayback && isActive ? (
                <div
                  className={`pointer-events-none absolute inset-0 z-1 flex items-center justify-center ${
                    prefersReducedMotion ? "" : "transition-opacity duration-200 ease-out"
                  } ${isVideoManuallyPaused ? "opacity-50" : "opacity-0"}`}
                  aria-hidden={!isVideoManuallyPaused}
                >
                  <TUXIconColorPlay size={FEED_VIDEO_PLAY_OVERLAY_ICON_PX} />
                </div>
              ) : null}
            </>
          ) : (
            <img
              ref={mediaImageRef}
              src={content.mediaSrc}
              alt={content.mediaAlt ?? "Feed background"}
              className="w-full h-full object-cover"
              onLoad={(event) => {
                updateMediaContentAspectRatio({
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight,
                });
              }}
            />
          )}
        </div>

        {/* Top & bottom readability overlays */}
        <div
          className={[
            "top-0 right-0 left-0 absolute pointer-events-none transition-opacity duration-200",
            isMusicDetailOpen ? "opacity-0" : "opacity-100",
          ].join(" ")}
          style={{
            bottom: "var(--app-tabbar-height, 0px)",
            background: readabilityOverlayBackground,
          }}
        />
        <div
          className="right-0 bottom-0 left-0 absolute pointer-events-none"
          style={{
            height: "38%",
            bottom: "var(--app-tabbar-height, 0px)",
            background: bottomTextBackdropBackground,
            opacity: isCommentPanelOpen || isMusicDetailOpen ? 0 : 1,
            transition: "opacity 200ms ease-out",
          }}
        />

        {/* Bottom info + right rail — wrapper passes taps through to video; children re-enable hits */}
        <div
          className="pointer-events-none top-0 right-0 left-0 z-0 absolute flex flex-col justify-end"
          style={{
            bottom: "var(--app-tabbar-height, 0px)",
            opacity: isCommentPanelOpen || isMusicDetailOpen ? 0 : 1,
            pointerEvents: isCommentPanelOpen || isMusicDetailOpen ? "none" : "auto",
            transition: "opacity 200ms ease-out",
          }}
        >
        <div className="flex justify-between items-end gap-3 w-full">
          {/* Bottom-left text */}
          <div className="pointer-events-auto flex flex-col flex-1 gap-2 pt-2 pr-4 pb-2.5 pl-3 min-w-0">
            {showRepostChrome ? (
              <RepostWhiteBar
                reposterIds={reposterIds}
                isReposted={isReposted}
                note={repostNote}
                onRepost={() => handleRepostChange(true)}
                onOpenPanel={() => setIsRepostInteractionVisible(true)}
                onOpenNote={() => setIsNoteInputVisible(true)}
              />
            ) : null}
            {feedInfo.promo ? (
              <FeedPromoBanner text="tonight we are very pleased to present the talk show live" />
            ) : null}
            {feedInfo.friendTag ? <FeedFriendTag /> : null}
            {content.location && feedInfo.locationAnchor ? (
              <LocationAnchor label={content.location} />
            ) : null}
            <div
              role="button"
              tabIndex={0}
              aria-label="Open post details"
              data-no-long-press="true"
              className="flex flex-col gap-1 items-start cursor-pointer min-w-0"
              onClick={() => setIsTitlePanelVisible(true)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                setIsTitlePanelVisible(true);
              }}
            >
              <div className="flex flex-wrap items-center gap-1 min-w-0">
                <button
                  type="button"
                  aria-label={`Open ${content.nickname}'s profile`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenProfile?.();
                  }}
                  className="shrink-0 cursor-pointer text-left"
                >
                  <TUXText typographyPreset="H3-Semibold" style={leftOverlayTextStyle}>
                    {content.nickname}
                  </TUXText>
                </button>
                {feedInfo.verified ? <FeedVerifiedBadge /> : null}
                {feedInfo.collaborators ? <FeedCollaboratorsChip /> : null}
                {feedInfo.textType ? <FeedTextTypeChip /> : null}
              </div>
              <TUXText
                typographyPreset="H4-Regular"
                className="-mt-1"
                style={{
                  ...leftOverlayTextStyle,
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 2,
                  overflow: "hidden",
                }}
              >
                {content.description}
              </TUXText>
            </div>
            {feedInfo.seeOriginal ? <FeedSeeOriginal /> : null}
            {feedInfo.sponsored ? <FeedSponsoredTag /> : null}
            {feedInfo.infoBar ? <FeedInfoBar /> : null}

            <div className="flex items-center gap-2 min-w-0">
              <IconMusicNoteSAlt
                className="text-tux-v2-ui-text-1"
                width={14}
                height={14}
              />
              <div
                ref={musicViewportRef}
                className="relative flex-1 min-w-0 overflow-hidden whitespace-nowrap"
                style={musicTextFadeStyle}
              >
                <span
                  ref={musicMeasureRef}
                  aria-hidden
                  className="top-0 left-0 absolute invisible pointer-events-none whitespace-nowrap P1-Regular"
                >
                  {content.musicTitle}
                </span>
                {isMusicMarqueeActive ? (
                  <div
                    className="feed-music-marquee-track"
                    style={
                      {
                        "--music-marquee-distance": `${musicMarqueeDistance}px`,
                        "--music-marquee-duration": `${musicMarqueeDuration}s`,
                      } as CSSProperties
                    }
                  >
                    <TUXText typographyPreset="P1-Regular" style={leftOverlayTextStyle} className="inline-block pr-6 whitespace-nowrap">
                      {content.musicTitle}
                    </TUXText>
                    <TUXText typographyPreset="P1-Regular" style={leftOverlayTextStyle} className="inline-block whitespace-nowrap" aria-hidden>
                      {content.musicTitle}
                    </TUXText>
                  </div>
                ) : (
                  <TUXText typographyPreset="P1-Regular" style={leftOverlayTextStyle} className="block truncate">
                    {content.musicTitle}
                  </TUXText>
                )}
              </div>
            </div>
            {feedInfo.actions ? <FeedBottomActions /> : null}
          </div>

          {/* Right action rail */}
          <div className="pointer-events-auto z-20 flex flex-col items-center">

            <div className="relative flex flex-col items-center py-2.5 pr-1.5 pl-2.5">
              <button
                type="button"
                aria-label={`Open ${content.nickname}'s profile`}
                onClick={onOpenProfile}
                className="bg-tux-v2-ui-page-flat-1 rounded-full w-11 h-11 overflow-hidden cursor-pointer"
                style={{ boxShadow: "inset 0 0 0 0.5px rgba(255,255,255,0.2)" }}
              >
                <img
                  src={avatarSrc}
                  alt={`${content.nickname} avatar`}
                  className="w-full h-full object-cover"
                  onError={() => {
                    setAvatarSrc(creatorAvatarUrlForFeedDisplay(44, content.id));
                  }}
                />
              </button>
              <div
                aria-label="Follow"
                className="-mt-2.5 rounded-full"
                style={{ backgroundColor: getColorCSSVar("UIShapePrimary") }}
              >
                <span
                  className="w-5 h-5"
                >
                  <IconPlusSmall
                    className="text-tux-v2-ui-text-1"
                    width={20}
                    height={20}
                  />
                </span>
              </div>
            </div>

            <RightRailActionButton
              ariaLabel="Like"
              pressed={isLiked}
              onClick={triggerLikeToggle}
              icon={
                <div
                  className="flex justify-center items-center w-8 h-8"
                  style={{ transform: `scale(${likeScale})` }}
                >
                  {isLiked ? (
                    <IconMediaLikeActive
                      className="text-tux-v2-ui-shape-danger"
                      width={32}
                      height={32}
                    />
                  ) : (
                    <IconMediaLike
                      className="text-tux-v2-ui-text-1"
                      width={32}
                      height={32}
                    />
                  )}
                </div>
              }
              label={
                <span style={overlayTextStyle}>
                  {formatCount(displayedLikeCount)}
                </span>
              }
            />

            <RightRailActionButton
              ariaLabel="Comment"
              buttonRef={commentButtonRef}
              onPointerDown={onCommentButtonPointerDown}
              onPointerUp={onCommentButtonPointerUp}
              onPointerCancel={onCommentButtonPointerCancel}
              onPointerLeave={onCommentButtonPointerCancel}
              onContextMenu={onCommentButtonContextMenu}
              onClick={() => {
                // 长按已经触发过 quick reaction 时，跳过常规点击。
                if (commentLongPressFiredRef.current) {
                  commentLongPressFiredRef.current = false;
                  return;
                }
                openCommentPanel();
              }}
              icon={
                <IconMediaComment
                  className="text-tux-v2-ui-text-1"
                  width={32}
                  height={32}
                />
              }
              label={
                <span style={overlayTextStyle}>
                  {formatCount(displayedCommentCount)}
                </span>
              }
            />

            <RightRailActionButton
              ariaLabel="Favorite"
              pressed={isFavorited}
              onClick={triggerFavoriteToggle}
              icon={
                <div
                  className="flex justify-center items-center w-8 h-8"
                  style={{ transform: `scale(${favoriteScale})` }}
                >
                  {isFavorited ? (
                    <IconMediaFavoriateActive
                      className="text-tux-v2-ui-shape-primary"
                      width={32}
                      height={32}
                    />
                  ) : (
                    <IconMediaFavoriate
                      className="text-tux-v2-ui-text-1"
                      width={32}
                      height={32}
                    />
                  )}
                </div>
              }
              label={
                <span style={overlayTextStyle}>
                  {formatCount(displayedFavoriteCount)}
                </span>
              }
            />

            <RightRailActionButton
              ariaLabel="Share"
              onClick={() => setIsSharePanelVisible(true)}
              icon={
                <IconMediaShare
                  className="text-tux-v2-ui-text-1"
                  width={32}
                  height={32}
                />
              }
              label={
                <span style={overlayTextStyle}>
                  {formatCount(displayedShareCount)}
                </span>
              }
            />

            <button
              type="button"
              aria-label="Music"
              data-no-long-press
              className="pt-2 pr-2 pb-3 pl-3"
              onClick={() => setIsMusicDetailVisible(true)}
            >
              <div
                className="block bg-tux-v2-ui-page-flat-1 rounded-full w-10 h-10"
                style={{ boxShadow: "inset 0 0 0 0.5px rgba(255,255,255,0.2)" }}
              >
                <img
                  src={content.musicCoverUrl}
                  alt={`${content.musicTitle} cover`}
                  className="rounded-full w-full h-full object-cover"
                />
              </div>
            </button>
          </div>
        </div>
        {feedInfo.bottomBanner ? <FeedBottomBanner /> : null}
        </div>
          </>
        )}
      </div>

      <MusicDetailPanel
        visible={isMusicDetailVisible}
        onVisibleChange={setIsMusicDetailVisible}
        content={content}
        root={longPressPanelRoot}
        onMetricsChange={handleCommentMetrics}
        surfaceTheme={surfaceTheme}
      />

      {/* Panels — portaled by TUXSheet to the AppFrame root, so they sit
          OUTSIDE the scaleable card surface above and keep their natural
          1:1 layout regardless of the squeeze transform. */}
      <LongPressPanel
        visible={isLongPressPanelVisible}
        onVisibleChange={setIsLongPressPanelVisible}
        root={longPressPanelRoot}
      />
      <SharePanel
        visible={isSharePanelVisible}
        onVisibleChange={setIsSharePanelVisible}
        isReposted={isReposted}
        onRepostChange={handleRepostChange}
        root={longPressPanelRoot}
      />
      <FeedTitlePanel
        visible={isTitlePanelVisible}
        onVisibleChange={setIsTitlePanelVisible}
        root={longPressPanelRoot}
        onMetricsChange={handleCommentMetrics}
      />
      {showRepostChrome ? (
        <>
          <RepostNoteInput
            visible={isNoteInputVisible}
            onVisibleChange={setIsNoteInputVisible}
            root={longPressPanelRoot}
            initialNote={repostNote}
            onSubmit={(note) => {
              if (!isReposted) setIsReposted(true);
              setRepostNote(note);
            }}
          />
          <RepostInteractionPanel
            visible={isRepostInteractionVisible}
            onVisibleChange={setIsRepostInteractionVisible}
            root={longPressPanelRoot}
            reposterIds={reposterIds}
            selfReposted={isReposted}
            selfNote={repostNote}
            onAddNote={() => setIsNoteInputVisible(true)}
            onRemoveRepost={() => handleRepostChange(false)}
            onRepost={() => handleRepostChange(true)}
            dim={!isNoteInputVisible}
          />
        </>
      ) : null}
      <CommentQuickReactionPopover
        visible={isCommentReactionVisible}
        onVisibleChange={setIsCommentReactionVisible}
        anchor={commentReactionAnchor}
        root={longPressPanelRoot}
        onSelect={(emoji) => {
          handleCommentPosted(emoji);
        }}
        questions={
          showQuestionsAfterLongPress
            ? COMMENT_EMPTY_STATE_QUESTION_OPTIONS.slice(0, 3)
            : undefined
        }
      />
    </div>
  );
}
