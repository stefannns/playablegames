import { colorsV2Rgba, type ColorV2Name } from "@byted-tiktok/tux-color";
import { TUXButton, TUXText } from "@byted-tiktok/tux-web";
import {
  Icon3ptArrowTurnUpRight,
  Icon3ptBookmark,
  Icon3ptBubbleEllipsisRight,
  Icon3ptHamburgerMenu,
  Icon3ptHeart,
  Icon3ptHeartFilled,
  IconAt,
  IconChevronLeftOffsetLTR,
  IconImageSquare,
  IconMagnifyingGlass,
  IconLike,
  IconMapThumbtackFill,
  IconMusicNoteSAlt,
  IconPenStarFill,
  IconSpeakerXMarkFillLTR,
  IconStickerRound,
  IconThumbsDown,
} from "@byted-tiktok/tux-icons";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useAppFrame } from "../../components/sys/app_frame";
import { useTheme, type ResolvedTheme } from "../../context/theme";
import { localAvatarUrlForDisplay } from "../../utils/local_avatar";
import { photoHeightAtWidth } from "../home/components/photo_text_post_layout";
import {
  getPhotoTextDetailData,
  getPhotoTextDetailDataFromContent,
  type PhotoTextDetailComment,
  type PhotoTextDetailCommentMedia,
} from "./photo_text_detail_data";
import {
  beginPhotoTextDetailExitTransition,
  buildHomeFeedHref,
  loadPhotoTextDetailSourceFrame,
  loadPhotoTextDetailSnapshot,
  navigateWithinApp,
  navigateWithSharedImageTransition,
  parsePhotoTextDetailSearch,
  PHOTO_TEXT_DETAIL_IMAGE_TARGET_ATTR,
  PHOTO_TEXT_SHARED_IMAGE_TRANSITION_NAME,
  type PhotoTextDetailRouteState,
} from "./photo_text_detail_route";

function getColorCSSVar(color: ColorV2Name): `var(${string})` {
  return `var(--tux-v2-color-${colorsV2Rgba[color].cssVarName})`;
}

const PHOTO_SWIPE_SPRING = {
  stiffness: 947.29,
  damping: 61.56,
};
const PAGE_CONTROL_MAX_VISIBLE_DOTS = 6;
const PAGE_CONTROL_DOT_WRAPPER_PX = 12;
const PAGE_CONTROL_DOT_ACTIVE_PX = 6;
const PAGE_CONTROL_DOT_SMALL_PX = 4.8;
const PAGE_CONTROL_DOT_XS_PX = 4;
const LIKE_HEART_COLOR = getColorCSSVar("UIShapePrimary");
const INLINE_LINK_COLOR = getColorCSSVar("UITextInfo");
const LIKE_HEART_FILLED_DELAY_MS = 100;
const LIKE_HEART_OUTLINE_EXIT_MS = 150;
const DETAIL_AVATAR_BORDER = `0.444px solid ${getColorCSSVar("UIShapeNeutral3")}`;

function getInitialDetailViewportWidth() {
  if (typeof document === "undefined") return 390;
  const frameRoot = document.querySelector<HTMLElement>(
    "[data-app-frame-root='true']",
  );
  const frameWidth = frameRoot?.getBoundingClientRect().width ?? 0;
  if (frameWidth > 0) return frameWidth;
  if (typeof window !== "undefined" && window.innerWidth > 0) {
    return window.innerWidth;
  }
  return 390;
}

type LikeMotionConfig = {
  popDurationMs: number;
  outlineFinalScale: number;
  filledInitialScale: number;
  expandScaleX: number;
  expandScaleY: number;
  centerXOffsetPx: number;
  centerYOffsetPx: number;
  particleDurationMs: number;
  particleRadiusPx: number;
  particleSizePx: number;
  particleEndScale: number;
  digitDurationMs: number;
  digitLiftPx: number;
};

const DEFAULT_LIKE_MOTION_CONFIG: LikeMotionConfig = {
  popDurationMs: 350,
  outlineFinalScale: 0.2,
  filledInitialScale: 0.2,
  expandScaleX: 1.3,
  expandScaleY: 1.2,
  centerXOffsetPx: 1,
  centerYOffsetPx: 2,
  particleDurationMs: 270,
  particleRadiusPx: 28,
  particleSizePx: 3,
  particleEndScale: 0.1,
  digitDurationMs: 180,
  digitLiftPx: 6,
};

type PageControlDotModel = {
  active: boolean;
  sizePx: number;
  key: string;
};

function buildPageControlDots(total: number, activeIndex: number): PageControlDotModel[] {
  if (total <= 0) return [];

  if (total < 5) {
    return Array.from({ length: total }, (_, index) => ({
      key: `dot-${index}`,
      active: index === activeIndex,
      sizePx: PAGE_CONTROL_DOT_ACTIVE_PX,
    }));
  }

  const visibleCount = Math.min(total, PAGE_CONTROL_MAX_VISIBLE_DOTS);
  const maxStart = Math.max(0, total - visibleCount);
  const start = Math.max(0, Math.min(activeIndex - 2, maxStart));
  const end = start + visibleCount;
  const hasHiddenLeft = start > 0;
  const hasHiddenRight = end < total;

  return Array.from({ length: visibleCount }, (_, slotIndex) => {
    const realIndex = start + slotIndex;
    let sizePx = PAGE_CONTROL_DOT_ACTIVE_PX;

    if (realIndex !== activeIndex) {
      if (hasHiddenLeft && slotIndex === 0) sizePx = PAGE_CONTROL_DOT_XS_PX;
      else if (hasHiddenLeft && slotIndex === 1) sizePx = PAGE_CONTROL_DOT_SMALL_PX;
      else if (hasHiddenRight && slotIndex === visibleCount - 1) sizePx = PAGE_CONTROL_DOT_XS_PX;
      else if (hasHiddenRight && slotIndex === visibleCount - 2) {
        sizePx = PAGE_CONTROL_DOT_SMALL_PX;
      }
    }

    return {
      key: `dot-${realIndex}`,
      active: realIndex === activeIndex,
      sizePx,
    };
  });
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function splitDescription(desc: string) {
  const parts = desc.trim().split(/\s+/);
  const hashtags = parts.filter((part) => /^#/.test(part));
  const body = parts.filter((part) => !/^#/.test(part)).join(" ").trim();
  return {
    body,
    hashtags: hashtags.join(" ").trim(),
  };
}

function renderInlineRichText(text: string, highlightColor: string) {
  const parts = text.split(/(\s+)/);
  return parts.map((part, index) => {
    if (/^[@#]/.test(part)) {
      return (
        <span
          key={`${part}-${index}`}
          style={{ color: highlightColor, fontWeight: 600 }}
        >
          {part}
        </span>
      );
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function isPhotoTextContent(
  content: unknown,
): content is ReturnType<typeof getPhotoTextDetailData>["content"] {
  if (!content || typeof content !== "object") return false;
  const maybeContent = content as {
    id?: unknown;
    photoText?: {
      images?: unknown;
    } | null;
  };
  return Boolean(
    maybeContent.id &&
    maybeContent.photoText &&
    typeof maybeContent.photoText === "object" &&
    Array.isArray(maybeContent.photoText.images),
  );
}

function DetailAction({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      className="relative flex flex-col flex-[1_0_0] justify-center items-center self-stretch gap-0.5 min-w-[44px] h-full"
    >
      <div className="flex justify-center items-center h-6">{icon}</div>
      <TUXText
        typographyPreset="P3-Semibold"
        className="text-tux-v2-ui-text-1 text-center"
      >
        {label}
      </TUXText>
    </button>
  );
}

function AnimatedCountDigits({
  value,
  previousValue,
  animationKey,
  animateChanges,
  config,
}: {
  value: number;
  previousValue: number;
  animationKey: number;
  animateChanges: boolean;
  config: LikeMotionConfig;
}) {
  const currentText = formatCount(value);
  const previousText = formatCount(previousValue);
  const maxLength = Math.max(currentText.length, previousText.length);
  const currentDigits = currentText.padStart(maxLength, " ").split("");
  const previousDigits = previousText.padStart(maxLength, " ").split("");

  return (
    <span className="inline-flex items-end">
      {currentDigits.map((digit, index) => {
        const previousDigit = previousDigits[index];
        const changed = digit !== previousDigit;
        const text = digit === " " ? "\u00A0" : digit;

        return (
          <span
            key={changed ? `digit-${animationKey}-${index}-${digit}` : `digit-static-${index}-${digit}`}
            className={
              changed && animateChanges
                ? "like-count-digit-change inline-block"
                : "inline-block"
            }
            style={
              changed && animateChanges
                ? ({
                  "--like-digit-lift": `${config.digitLiftPx}px`,
                  "--like-digit-duration": `${config.digitDurationMs}ms`,
                } as React.CSSProperties)
                : undefined
            }
          >
            {text}
          </span>
        );
      })}
    </span>
  );
}

function DetailLikeAction({
  initialCount,
  config,
}: {
  initialCount: number;
  config: LikeMotionConfig;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [previousCount, setPreviousCount] = useState(initialCount);
  const [digitAnimationKey, setDigitAnimationKey] = useState(0);
  const [iconAnimationKey, setIconAnimationKey] = useState(0);
  const [burstKey, setBurstKey] = useState(0);
  const [showBurst, setShowBurst] = useState(false);
  const [animateDigits, setAnimateDigits] = useState(false);
  const [showOutlineExit, setShowOutlineExit] = useState(false);
  const [showFilledHeartEnter, setShowFilledHeartEnter] = useState(false);
  const animationTimeoutsRef = useRef<number[]>([]);

  const clearAnimationTimers = () => {
    animationTimeoutsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    animationTimeoutsRef.current = [];
  };

  useEffect(() => {
    clearAnimationTimers();
    setLikeCount(initialCount);
    setPreviousCount(initialCount);
    setLiked(false);
    setShowBurst(false);
    setAnimateDigits(false);
    setShowOutlineExit(false);
    setShowFilledHeartEnter(false);
  }, [initialCount]);

  useEffect(() => {
    return () => {
      clearAnimationTimers();
    };
  }, []);

  const particleAngles = useMemo(
    () =>
      Array.from({ length: 8 }, (_, index) => {
        const angle = (Math.PI * 2 * index) / 8;
        return {
          x: Math.cos(angle) * 20,
          y: Math.sin(angle) * 20,
        };
      }),
    [],
  );

  const handleClick = () => {
    if (!liked) {
      clearAnimationTimers();
      setPreviousCount(likeCount);
      setLikeCount((count) => count + 1);
      setLiked(true);
      setAnimateDigits(true);
      setDigitAnimationKey((key) => key + 1);
      setIconAnimationKey((key) => key + 1);
      setBurstKey((key) => key + 1);
      setShowOutlineExit(true);
      setShowFilledHeartEnter(false);
      setShowBurst(false);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(8);
      }

      animationTimeoutsRef.current.push(
        window.setTimeout(() => {
          setShowFilledHeartEnter(true);
          setShowBurst(true);
        }, LIKE_HEART_FILLED_DELAY_MS),
      );
      animationTimeoutsRef.current.push(
        window.setTimeout(() => {
          setShowOutlineExit(false);
        }, LIKE_HEART_OUTLINE_EXIT_MS),
      );
      animationTimeoutsRef.current.push(
        window.setTimeout(() => {
          setShowFilledHeartEnter(false);
          setShowBurst(false);
          setAnimateDigits(false);
        }, Math.max(config.popDurationMs, LIKE_HEART_FILLED_DELAY_MS + config.particleDurationMs)),
      );
      animationTimeoutsRef.current.push(
        window.setTimeout(() => {
          setShowBurst(false);
          setAnimateDigits(false);
        }, config.digitDurationMs),
      );
      return;
    }

    clearAnimationTimers();
    setPreviousCount(likeCount);
    setLikeCount((count) => Math.max(0, count - 1));
    setLiked(false);
    setShowBurst(false);
    setAnimateDigits(false);
    setShowOutlineExit(false);
    setShowFilledHeartEnter(false);
  };

  return (
    <button
      type="button"
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      onClick={handleClick}
      className="relative flex flex-col flex-[1_0_0] justify-center items-center self-stretch gap-0.5 min-w-[44px] h-full"
    >
      <div className="relative flex justify-center items-center w-6 h-6 leading-none">
        {showBurst ? (
          <span
            key={`burst-${burstKey}`}
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{
              transform: `translate(${config.centerXOffsetPx}px, ${config.centerYOffsetPx}px)`,
            }}
          >
            {particleAngles.map((particle, index) => (
              <span
                key={`particle-${burstKey}-${index}`}
                className="top-1/2 left-1/2 absolute rounded-full like-heart-particle"
                style={
                  {
                    width: `${config.particleSizePx}px`,
                    height: `${config.particleSizePx}px`,
                    marginLeft: `${-config.particleSizePx / 2}px`,
                    marginTop: `${-config.particleSizePx / 2}px`,
                    backgroundColor: LIKE_HEART_COLOR,
                    "--particle-x": `${particle.x * (config.particleRadiusPx / 20)}px`,
                    "--particle-y": `${particle.y * (config.particleRadiusPx / 20)}px`,
                    "--particle-end-scale": String(config.particleEndScale),
                    "--particle-duration": `${config.particleDurationMs}ms`,
                  } as React.CSSProperties
                }
              />
            ))}
          </span>
        ) : null}

        {!liked ? (
          <span className="absolute inset-0 flex justify-center items-center">
            <Icon3ptHeart
              width={24}
              height={24}
              className="block text-tux-v2-ui-text-1"
            />
          </span>
        ) : null}

        {liked && !showOutlineExit && !showFilledHeartEnter ? (
          <span className="absolute inset-0 flex justify-center items-center">
            <Icon3ptHeartFilled
              width={24}
              height={24}
              className="block text-tux-v2-ui-shape-primary"
            />
          </span>
        ) : null}

        {showOutlineExit ? (
          <span
            key={`outline-${iconAnimationKey}`}
            className="absolute inset-0 flex justify-center items-center like-heart-outline-exit"
            style={
              {
                "--like-heart-outline-exit-scale": String(config.outlineFinalScale),
                "--like-heart-outline-exit-duration": `${LIKE_HEART_OUTLINE_EXIT_MS}ms`,
              } as React.CSSProperties
            }
          >
            <Icon3ptHeart
              width={24}
              height={24}
              className="block text-tux-v2-ui-text-1"
            />
          </span>
        ) : null}

        {showFilledHeartEnter ? (
          <span
            key={`heart-${iconAnimationKey}`}
            className="absolute inset-0 flex justify-center items-center like-heart-filled-enter"
            style={
              {
                "--like-heart-filled-start-scale": String(config.filledInitialScale),
                "--like-heart-expand-scale-x": String(config.expandScaleX),
                "--like-heart-expand-scale-y": String(config.expandScaleY),
                "--like-heart-filled-duration": `${Math.max(
                  160,
                  config.popDurationMs - LIKE_HEART_FILLED_DELAY_MS,
                )}ms`,
              } as React.CSSProperties
            }
          >
            <Icon3ptHeartFilled
              width={24}
              height={24}
              className="block text-tux-v2-ui-shape-primary"
            />
          </span>
        ) : null}
      </div>

      <TUXText
        typographyPreset="P3-Semibold"
        className="text-tux-v2-ui-text-1 text-center"
      >
        <AnimatedCountDigits
          value={likeCount}
          previousValue={previousCount}
          animationKey={digitAnimationKey}
          animateChanges={animateDigits}
          config={config}
        />
      </TUXText>
    </button>
  );
}

function LikeMotionDevPanel({
  config,
  onChange,
}: {
  config: LikeMotionConfig;
  onChange: (patch: Partial<LikeMotionConfig>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [panelPosition, setPanelPosition] = useState<{ left: number; top: number }>({
    left: 16,
    top: 80,
  });

  const copyConfig = async () => {
    const payload = JSON.stringify(config, null, 2);
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      // Ignore clipboard failures in unsupported contexts.
    }
  };

  const numberField = (
    key: keyof LikeMotionConfig,
    label: string,
    step = 0.01,
  ) => (
    <label className="block space-y-1" key={key}>
      <TUXText typographyPreset="P3-Semibold" className="text-tux-v2-ui-text-2">
        {label}
      </TUXText>
      <input
        type="number"
        step={step}
        value={config[key]}
        className="bg-tux-v2-ui-page-flat-1 px-2 py-1.5 border border-tux-v2-ui-shape-neutral-3 rounded-lg w-full text-[13px] text-tux-v2-ui-text-1"
        onChange={(event) => {
          const nextValue = Number(event.target.value);
          if (!Number.isFinite(nextValue)) return;
          onChange({ [key]: nextValue });
        }}
      />
    </label>
  );

  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") return;

    setPortalRoot(document.body);

    const updatePosition = () => {
      const frame = document.querySelector<HTMLElement>('[data-app-frame-root="true"]');
      const panelWidth = 300;
      const minInset = 16;

      if (!frame) {
        setPanelPosition({
          left: Math.max(minInset, window.innerWidth - panelWidth - minInset),
          top: 80,
        });
        return;
      }

      const rect = frame.getBoundingClientRect();
      const preferredLeft = rect.right + 16;
      const maxLeft = window.innerWidth - panelWidth - minInset;

      setPanelPosition({
        left: Math.max(minInset, Math.min(preferredLeft, maxLeft)),
        top: Math.max(16, rect.top + 20),
      });
    };

    updatePosition();

    const frame = document.querySelector<HTMLElement>('[data-app-frame-root="true"]');
    const resizeObserver =
      frame && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updatePosition())
        : null;

    if (resizeObserver && frame) {
      resizeObserver.observe(frame);
    }
    window.addEventListener("resize", updatePosition);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updatePosition);
    };
  }, []);

  if (!portalRoot) return null;

  return createPortal(
    <div
      className="hidden sm:block z-2600 fixed w-[300px] max-w-[calc(100vw-2rem)]"
      style={{
        left: `${panelPosition.left}px`,
        top: `${panelPosition.top}px`,
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="like-motion-dev-panel"
        aria-label="点赞动效调试"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 backdrop-blur-sm mb-2 ml-auto px-3 py-2 border rounded-full"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--tux-v2-color-ui-page-flat-1) 88%, transparent)",
          borderColor: "var(--tux-v2-color-ui-shape-neutral-3)",
          color: "var(--tux-v2-color-ui-text-1)",
        }}
      >
        <Icon3ptHamburgerMenu width={18} height={18} />
        <span className="font-semibold text-[13px] leading-4">点赞动效</span>
      </button>

      {open ? (
        <div
          id="like-motion-dev-panel"
          className="space-y-3 shadow-lg p-3 border rounded-2xl"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--tux-v2-color-ui-page-flat-1) 94%, transparent)",
            borderColor: getColorCSSVar("UIShapeNeutral3"),
          }}
        >
          <TUXText typographyPreset="P3-Semibold" className="text-tux-v2-ui-text-1">
            Like 动效参数
          </TUXText>

          <div className="gap-2 grid grid-cols-2">
            {numberField("popDurationMs", "Pop 时长", 1)}
            {numberField("particleDurationMs", "粒子时长", 1)}
            {numberField("outlineFinalScale", "黑心最终大小", 0.01)}
            {numberField("filledInitialScale", "红心初始大小", 0.01)}
            {numberField("expandScaleX", "放大 X", 0.01)}
            {numberField("expandScaleY", "放大 Y", 0.01)}
            {numberField("centerXOffsetPx", "圆心 X 偏移", 0.5)}
            {numberField("centerYOffsetPx", "圆心 Y 偏移", 0.5)}
            {numberField("particleRadiusPx", "扩散半径", 1)}
            {numberField("particleSizePx", "粒子初始大小", 0.5)}
            {numberField("particleEndScale", "粒子结束倍率", 0.01)}
            {numberField("digitDurationMs", "数字时长", 1)}
            {numberField("digitLiftPx", "数字上浮", 0.5)}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 bg-tux-v2-ui-shape-neutral-3 py-2 rounded-lg font-semibold text-[13px] text-tux-v2-ui-text-1"
              onClick={copyConfig}
            >
              复制参数
            </button>
            <button
              type="button"
              className="flex-1 bg-tux-v2-ui-shape-neutral-3 py-2 rounded-lg font-semibold text-[13px] text-tux-v2-ui-text-1"
              onClick={() => onChange(DEFAULT_LIKE_MOTION_CONFIG)}
            >
              重置默认
            </button>
          </div>
        </div>
      ) : null}
    </div>,
    portalRoot,
  );
}

function ChevronDownSmall() {
  return (
    <svg
      width={10}
      height={10}
      viewBox="0 0 10 10"
      aria-hidden="true"
      style={{ color: getColorCSSVar("UIText3") }}
    >
      <path
        d="M2 4l3 3 3-3"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function resolveDetailCommentAvatar(comment: PhotoTextDetailComment, sizePx: number) {
  return comment.avatarUrl ?? localAvatarUrlForDisplay(sizePx, comment.avatarSlot ?? 1);
}

function detailCommentLikeLabel(comment: PhotoTextDetailComment) {
  return comment.likeCountLabel ?? formatCount(comment.likeCount);
}

function detailCommentAuthorLabel(comment: PhotoTextDetailComment) {
  if (comment.creator) return "Creator";
  return comment.authorLabel;
}

function DetailCommentMediaView({ media }: { media: PhotoTextDetailCommentMedia }) {
  if (media.type === "audio") {
    return (
      <div
        className="flex flex-col gap-1.5 px-3 py-2 rounded-[10px] w-full max-w-[220px]"
        style={{ backgroundColor: getColorCSSVar("UIShapeNeutral4") }}
      >
        <div className="flex items-center gap-2">
          <IconMusicNoteSAlt width={16} height={16} className="text-tux-v2-ui-text-1" />
          <TUXText typographyPreset="P2-Semibold" className="flex-1 min-w-0 text-tux-v2-ui-text-1">
            Voice note
          </TUXText>
          <TUXText typographyPreset="P3-Regular" className="text-tux-v2-ui-text-3">
            {media.duration}
          </TUXText>
        </div>
        <TUXText
          as="p"
          typographyPreset="P3-Regular"
          className="m-0 text-tux-v2-ui-text-3"
          style={{ lineHeight: "16px" }}
        >
          {media.text}
        </TUXText>
      </div>
    );
  }

  if (media.type === "sticker") {
    return (
      <img
        src={media.url}
        alt=""
        aria-hidden="true"
        className="rounded max-w-[112px] max-h-[112px] object-contain"
        loading="eager"
      />
    );
  }

  const imageShape =
    media.display === "portrait"
      ? "aspect-[3/4] w-[132px]"
      : media.display === "square"
        ? "aspect-square w-[144px]"
        : media.display === "landscape"
          ? "aspect-[4/3] w-[176px]"
          : "aspect-[4/3] w-[156px]";

  return (
    <img
      src={media.url}
      alt=""
      aria-hidden="true"
      className={`${imageShape} max-w-full rounded-lg object-cover`}
      style={{ border: `0.5px solid ${getColorCSSVar("UIShapeNeutral3")}` }}
      loading="eager"
    />
  );
}

function DetailLikedByCreatorBadge({ avatarUrl }: { avatarUrl: string }) {
  return (
    <span className="relative w-[18px] h-4 shrink-0">
      <img
        src={avatarUrl}
        alt=""
        aria-hidden="true"
        className="top-0 left-0 absolute rounded-full w-4 h-4 object-cover"
        style={{ border: DETAIL_AVATAR_BORDER }}
      />
      <Icon3ptHeartFilled
        width={9}
        height={9}
        className="top-[7px] left-[9px] absolute"
        style={{ color: LIKE_HEART_COLOR }}
      />
    </span>
  );
}

function DetailCommentRow({
  depth = 0,
  ...comment
}: PhotoTextDetailComment & { depth?: 0 | 1 }) {
  const {
    authorName,
    body,
    postedAt,
    media,
    replies,
    replyCount,
    viewRepliesLabel,
    likedByCreatorAvatarUrl,
  } = comment;
  const isReply = depth === 1;
  const avatarSize = isReply ? 24 : 36;
  const authorLabel = detailCommentAuthorLabel(comment);

  return (
    <div className={isReply ? "flex gap-2 pt-1.5" : "flex gap-3 px-4 py-2.5"}>
      <img
        src={resolveDetailCommentAvatar(comment, avatarSize)}
        alt=""
        aria-hidden="true"
        className="flex-none rounded-full object-cover"
        style={{ width: avatarSize, height: avatarSize, border: DETAIL_AVATAR_BORDER }}
      />
      <div className="flex flex-col flex-1 gap-1 min-w-0">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1 min-w-0">
            <TUXText
              typographyPreset="P1-Regular"
              weight={500}
              className="text-tux-v2-ui-text-3 truncate"
            >
              {authorName}
            </TUXText>
            {authorLabel ? (
              <>
                <TUXText
                  as="span"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    lineHeight: "16.9px",
                    color: getColorCSSVar("UIText3"),
                  }}
                >
                  ·
                </TUXText>
                <TUXText
                  as="span"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    lineHeight: "16.9px",
                    color:
                      authorLabel === "Creator"
                        ? getColorCSSVar("UITextSecondary")
                        : getColorCSSVar("UIText3"),
                    whiteSpace: "nowrap",
                  }}
                >
                  {authorLabel}
                </TUXText>
              </>
            ) : null}
          </div>
          {body ? (
            <TUXText
              as="p"
              typographyPreset="H4-Regular"
              weight={500}
              className="m-0 text-tux-v2-ui-text-1"
              style={{ lineHeight: "20px", wordBreak: "break-word" }}
            >
              {renderInlineRichText(body, INLINE_LINK_COLOR)}
            </TUXText>
          ) : null}
        </div>

        {media ? <DetailCommentMediaView media={media} /> : null}

        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-2.5">
            <TUXText typographyPreset="P3-Regular" className="text-tux-v2-ui-text-placeholder">
              {postedAt}
            </TUXText>
            <TUXText typographyPreset="P2-Semibold" className="text-tux-v2-ui-text-3">
              Reply
            </TUXText>
            {likedByCreatorAvatarUrl ? (
              <DetailLikedByCreatorBadge avatarUrl={likedByCreatorAvatarUrl} />
            ) : null}
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1">
              <IconLike
                width={18}
                height={18}
                className="text-tux-v2-ui-text-3"
              />
              <TUXText typographyPreset="P3-Regular" className="min-w-[20px] text-tux-v2-ui-text-3 text-left">
                {detailCommentLikeLabel(comment)}
              </TUXText>
            </div>
            <IconThumbsDown width={18} height={18} className="text-tux-v2-ui-text-3" />
          </div>
        </div>

        {replies?.length ? (
          <div className="flex flex-col gap-1">
            {replies.map((reply) => (
              <DetailCommentRow key={reply.id} {...reply} depth={1} />
            ))}
          </div>
        ) : null}

        {!isReply && replyCount ? (
          <button type="button" className="flex items-center gap-2 mt-0.5">
            <span aria-hidden className="block bg-tux-v2-ui-shape-neutral-3 w-6 h-px" />
            <TUXText typographyPreset="P3-Regular" className="text-tux-v2-ui-text-3">
              {viewRepliesLabel ?? `View ${replyCount} repl${replyCount === 1 ? "y" : "ies"}`}
            </TUXText>
            <ChevronDownSmall />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function DetailComposerRow({
  avatarUrl,
}: {
  avatarUrl: string;
}) {
  return (
    <div className="flex items-center gap-2 px-4 pt-2.5 pb-1.5 w-full">
      <img
        src={avatarUrl}
        alt=""
        aria-hidden="true"
        className="flex-none rounded-full w-9 h-9 object-cover"
        style={{ border: DETAIL_AVATAR_BORDER }}
      />
      <div
        className="flex flex-1 items-center pl-4 rounded-full min-w-0 h-9 overflow-hidden"
        style={{ backgroundColor: getColorCSSVar("UIShapeNeutral4") }}
      >
        <TUXText
          typographyPreset="H4-Regular"
          className="flex-1 min-w-0 text-tux-v2-ui-text-placeholder truncate"
        >
          Share your thoughts...
        </TUXText>
        <div className="flex items-center pr-[5px] h-full shrink-0">
          <button
            type="button"
            aria-label="Add image"
            className="flex justify-center items-center w-[34px] h-9"
          >
            <IconImageSquare width={20} height={20} className="text-tux-v2-ui-text-3" />
          </button>
          <button
            type="button"
            aria-label="Add sticker"
            className="flex justify-center items-center w-[34px] h-9"
          >
            <IconStickerRound width={20} height={20} className="text-tux-v2-ui-text-3" />
          </button>
          <button
            type="button"
            aria-label="Mention creator"
            className="flex justify-center items-center w-[34px] h-9"
          >
            <IconAt width={20} height={20} className="text-tux-v2-ui-text-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailAnchorChip({
  label,
  leadingIcon,
}: {
  label: string;
  leadingIcon: ReactNode;
}) {
  return (
    <div
      className="inline-flex items-center gap-1 px-[6px] py-1 rounded-lg"
      style={{ backgroundColor: getColorCSSVar("UIShapeNeutral4") }}
    >
      {leadingIcon}
      <TUXText typographyPreset="P2-Semibold" className="text-tux-v2-ui-text-1">
        {label}
      </TUXText>
    </div>
  );
}

export default function PhotoTextDetailPage({
  routeStateOverride,
  visualThemeOverride,
  sourceSurface = "explore",
}: {
  routeStateOverride?: PhotoTextDetailRouteState;
  visualThemeOverride?: ResolvedTheme;
  sourceSurface?: "explore" | "for-you";
}) {
  const { resolvedTheme } = useTheme();
  const visualTheme = visualThemeOverride ?? resolvedTheme;
  const routeState = useMemo(
    () =>
      routeStateOverride ??
      parsePhotoTextDetailSearch(
        typeof window === "undefined" ? "" : window.location.search,
      ),
    [routeStateOverride],
  );
  const snapshotContent = useMemo(
    () => loadPhotoTextDetailSnapshot(routeState.feedId),
    [routeState.feedId],
  );
  const sourceFrame = useMemo(
    () =>
      loadPhotoTextDetailSourceFrame(
        routeState.feedId,
        routeState.imageIndex,
      ),
    [routeState.feedId, routeState.imageIndex],
  );
  const detail = useMemo(
    () =>
      isPhotoTextContent(snapshotContent)
        ? getPhotoTextDetailDataFromContent(snapshotContent)
        : getPhotoTextDetailData(routeState.feedId),
    [routeState.feedId, snapshotContent],
  );
  const { bottomInsetCss } = useAppFrame();
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);
  const imageRegionRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    dragging: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    startTime: number;
    startScrollLeft: number;
    type: "pending" | "swipe" | "blocked-vertical";
    input: "pointer" | "mouse" | "touch" | null;
  }>({
    dragging: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startTime: 0,
    startScrollLeft: 0,
    type: "pending",
    input: null,
  });
  const springAnimationRef = useRef<number | null>(null);
  const springVelocityRef = useRef(0);
  const lastViewportWRef = useRef(0);
  const [resolvedAspects, setResolvedAspects] = useState<
    Record<number, readonly [number, number]>
  >({});
  const [likeMotionConfig, setLikeMotionConfig] = useState<LikeMotionConfig>(
    DEFAULT_LIKE_MOTION_CONFIG,
  );
  const [viewportW, setViewportW] = useState(getInitialDetailViewportWidth);
  const [activeIndex, setActiveIndex] = useState(
    Math.min(
      detail.content.photoText.images.length - 1,
      Math.max(0, routeState.imageIndex),
    ),
  );
  const sourceFrameAspect =
    sourceFrame &&
      Number.isFinite(sourceFrame.frameHeightRatio) &&
      sourceFrame.frameHeightRatio > 0
      ? ([1, sourceFrame.frameHeightRatio] as const)
      : undefined;
  const snapshotDisplayAspects = detail.content.photoText.displayAspects;
  const displayAspectForIndex = (index: number) =>
    snapshotDisplayAspects?.[index] ??
    (index === routeState.imageIndex
      ? sourceFrame?.aspect ?? sourceFrame?.aspects?.[index] ?? sourceFrameAspect
      : sourceFrame?.aspects?.[index]) ??
    sourceFrame?.aspects?.[index] ??
    resolvedAspects[index] ??
    ([1, 1] as const);
  const frameAspect = sourceFrame
    ? displayAspectForIndex(routeState.imageIndex)
    : snapshotDisplayAspects?.[routeState.imageIndex] ??
    resolvedAspects[0] ??
    resolvedAspects[activeIndex] ??
    ([1, 1] as const);
  const naturalHeightAtViewportWidth = photoHeightAtWidth(
    Math.max(1, viewportW),
    frameAspect,
  );
  const maxImageContainerHeight = (Math.max(1, viewportW) * 4) / 3;
  const imageContainerHeight = Math.min(
    naturalHeightAtViewportWidth,
    maxImageContainerHeight,
  );
  const pageControlDots = buildPageControlDots(
    detail.content.photoText.images.length,
    activeIndex,
  );
  const showPageControl = detail.content.photoText.images.length > 1;
  const imageContainerRatio = Math.max(1, viewportW) / Math.max(imageContainerHeight, 1);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setViewportW(el.clientWidth));
    ro.observe(el);
    setViewportW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    detail.content.photoText.images.forEach((src, index) => {
      const image = new Image();
      image.onload = () => {
        if (cancelled || !image.naturalWidth || !image.naturalHeight) return;
        setResolvedAspects((prev) => {
          const current = prev[index];
          if (
            current &&
            current[0] === image.naturalWidth &&
            current[1] === image.naturalHeight
          ) {
            return prev;
          }
          return {
            ...prev,
            [index]: [image.naturalWidth, image.naturalHeight],
          };
        });
      };
      image.src = src;
    });

    return () => {
      cancelled = true;
    };
  }, [detail.content.photoText.images]);

  const cancelSpringAnimation = () => {
    if (springAnimationRef.current != null) {
      cancelAnimationFrame(springAnimationRef.current);
      springAnimationRef.current = null;
    }
    springVelocityRef.current = 0;
  };

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const next = Math.max(
          0,
          Math.min(
            detail.content.photoText.images.length - 1,
            Math.round(el.scrollLeft / Math.max(1, el.clientWidth)),
          ),
        );
        setActiveIndex((prev) => (prev === next ? prev : next));
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [detail.content.photoText.images.length]);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    if (lastViewportWRef.current === viewportW) return;
    lastViewportWRef.current = viewportW;
    el.scrollTo({ left: activeIndex * viewportW, behavior: "auto" });
  }, [activeIndex, viewportW]);

  useEffect(() => {
    const root = imageRegionRef.current;
    const scroller = carouselRef.current;
    const imageCount = detail.content.photoText.images.length;
    if (!root || !scroller) return;

    const resetDrag = () => {
      dragStateRef.current = {
        dragging: false,
        pointerId: null,
        startX: 0,
        startY: 0,
        startTime: 0,
        startScrollLeft: 0,
        type: "pending",
        input: null,
      };
    };

    const animateToIndex = (nextIndex: number) => {
      const clampedIndex = Math.max(0, Math.min(imageCount - 1, nextIndex));
      const targetLeft = clampedIndex * Math.max(1, viewportW);
      setActiveIndex(clampedIndex);
      cancelSpringAnimation();

      let lastTime = performance.now();
      const tick = (now: number) => {
        const dt = Math.min(0.032, Math.max(0.001, (now - lastTime) / 1000));
        lastTime = now;

        const displacement = scroller.scrollLeft - targetLeft;
        const acceleration =
          -PHOTO_SWIPE_SPRING.stiffness * displacement -
          PHOTO_SWIPE_SPRING.damping * springVelocityRef.current;
        springVelocityRef.current += acceleration * dt;
        const nextLeft = scroller.scrollLeft + springVelocityRef.current * dt;

        scroller.scrollLeft = nextLeft;

        if (
          Math.abs(targetLeft - nextLeft) < 0.5 &&
          Math.abs(springVelocityRef.current) < 0.5
        ) {
          scroller.scrollLeft = targetLeft;
          springAnimationRef.current = null;
          springVelocityRef.current = 0;
          return;
        }

        springAnimationRef.current = requestAnimationFrame(tick);
      };

      springAnimationRef.current = requestAnimationFrame(tick);
    };

    const beginDrag = (
      x: number,
      y: number,
      input: "pointer" | "mouse" | "touch",
      pointerId: number | null = null,
    ) => {
      dragStateRef.current = {
        dragging: true,
        pointerId,
        startX: x,
        startY: y,
        startTime: performance.now(),
        startScrollLeft: scroller.scrollLeft,
        type: "pending",
        input,
      };
      cancelSpringAnimation();
    };

    const isInteractiveTarget = (target: EventTarget | null) =>
      target instanceof Element &&
      Boolean(
        target.closest(
          "button, a, input, textarea, select, [role='button'], [role='link'], [data-no-drag]",
        ),
      );

    const moveDrag = (x: number, y: number) => {
      const drag = dragStateRef.current;
      if (!drag.dragging) return;

      const dx = x - drag.startX;
      const dy = y - drag.startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (drag.type === "pending") {
        if (absDx < 8 && absDy < 8) return;
        drag.type = absDx > absDy * 1.2 ? "swipe" : "blocked-vertical";
      }

      if (drag.type !== "swipe") return;

      const viewportWidth = Math.max(1, viewportW);
      const startIndex = Math.round(drag.startScrollLeft / viewportWidth);
      const minLeft = Math.max(0, (startIndex - 1) * viewportWidth);
      const maxLeft = Math.min((imageCount - 1) * viewportWidth, (startIndex + 1) * viewportWidth);
      scroller.scrollLeft = Math.max(
        minLeft,
        Math.min(maxLeft, drag.startScrollLeft - dx),
      );
    };

    const endDrag = (x: number) => {
      const drag = dragStateRef.current;
      if (!drag.dragging) return;

      const dx = x - drag.startX;
      const elapsed = Math.max(1, performance.now() - drag.startTime);
      const velocity = Math.abs(dx) / elapsed;
      const threshold = velocity > 0.4 ? 20 : 60;
      const currentIndex = Math.round(drag.startScrollLeft / Math.max(1, viewportW));
      let nextIndex = currentIndex;

      if (drag.type === "swipe") {
        if (dx <= -threshold) {
          nextIndex = Math.min(imageCount - 1, currentIndex + 1);
        } else if (dx >= threshold) {
          nextIndex = Math.max(0, currentIndex - 1);
        }
      }

      animateToIndex(nextIndex);
      resetDrag();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (isInteractiveTarget(event.target)) return;
      if (event.cancelable) event.preventDefault();
      beginDrag(event.clientX, event.clientY, "pointer", event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      const drag = dragStateRef.current;
      if (!drag.dragging || drag.input !== "pointer") return;
      if (drag.pointerId !== event.pointerId) return;
      moveDrag(event.clientX, event.clientY);
      if (dragStateRef.current.type === "swipe" && event.cancelable) {
        event.preventDefault();
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      const drag = dragStateRef.current;
      if (!drag.dragging || drag.input !== "pointer") return;
      if (drag.pointerId !== event.pointerId) return;
      endDrag(event.clientX);
    };

    const onMouseDown = (event: MouseEvent) => {
      if (dragStateRef.current.dragging || event.button !== 0) return;
      if (isInteractiveTarget(event.target)) return;
      event.preventDefault();
      beginDrag(event.clientX, event.clientY, "mouse");
    };

    const onMouseMove = (event: MouseEvent) => {
      const drag = dragStateRef.current;
      if (!drag.dragging || drag.input !== "mouse") return;
      event.preventDefault();
      moveDrag(event.clientX, event.clientY);
    };

    const onMouseUp = (event: MouseEvent) => {
      const drag = dragStateRef.current;
      if (!drag.dragging || drag.input !== "mouse") return;
      endDrag(event.clientX);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (dragStateRef.current.dragging || event.touches.length !== 1) return;
      if (isInteractiveTarget(event.target)) return;
      const touch = event.touches[0];
      beginDrag(touch.clientX, touch.clientY, "touch");
    };

    const onTouchMove = (event: TouchEvent) => {
      const drag = dragStateRef.current;
      if (!drag.dragging || drag.input !== "touch") return;
      const touch = event.touches[0];
      if (!touch) return;
      moveDrag(touch.clientX, touch.clientY);
      if (dragStateRef.current.type === "swipe" && event.cancelable) {
        event.preventDefault();
      }
    };

    const onTouchEnd = (event: TouchEvent) => {
      const drag = dragStateRef.current;
      if (!drag.dragging || drag.input !== "touch") return;
      const touch = event.changedTouches[0];
      if (!touch) {
        resetDrag();
        return;
      }
      endDrag(touch.clientX);
    };

    const onTouchCancel = () => resetDrag();

    root.addEventListener("pointerdown", onPointerDown, { capture: true });
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    root.addEventListener("mousedown", onMouseDown, { capture: true });
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    root.addEventListener("touchstart", onTouchStart, {
      capture: true,
      passive: true,
    });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchCancel);

    return () => {
      root.removeEventListener("pointerdown", onPointerDown, { capture: true });
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      root.removeEventListener("mousedown", onMouseDown, { capture: true });
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      root.removeEventListener("touchstart", onTouchStart, { capture: true });
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [detail.content.photoText.images.length, viewportW]);

  useEffect(() => () => cancelSpringAnimation(), []);

  const { body: descBody, hashtags } = splitDescription(
    detail.content.photoText.desc,
  );
  const anchorTokens = detail.anchors;
  const detailPageBackground =
    getColorCSSVar("UIPageFlat1");
  const detailBottomBarBackground = getColorCSSVar("UISheetGrouped2");
  const imageRegionBackground = detailPageBackground;
  const activeDotColor =
    visualTheme === "dark"
      ? "rgba(255, 255, 255, 1)"
      : "rgba(22, 24, 35, 0.92)";
  const inactiveDotColor =
    visualTheme === "dark"
      ? "rgba(255, 255, 255, 0.45)"
      : "rgba(22, 24, 35, 0.28)";
  const headerTransitionName = "photo-text-detail-header";
  const bodyTransitionName = "photo-text-detail-body";
  const actionTransitionName = "photo-text-detail-action";
  const handleBack = () => {
    const targetFeedId = routeState.returnFeedId ?? detail.content.id;
    const targetImageIndex = sourceSurface === "explore" ? 0 : activeIndex;
    const targetHref = buildHomeFeedHref(
      targetFeedId,
      targetImageIndex,
    );
    const imageElement =
      imageRegionRef.current?.querySelector<HTMLElement>(
        `[${PHOTO_TEXT_DETAIL_IMAGE_TARGET_ATTR}="${activeIndex}"]`,
      ) ??
      imageRegionRef.current?.querySelector<HTMLElement>(
        `[data-photo-text-detail-image-index="${activeIndex}"]`,
      );
    if (imageElement && headerRef.current && bodyRef.current && actionRef.current) {
      beginPhotoTextDetailExitTransition({
        imageElement,
        headerElement: headerRef.current,
        bodyElement: bodyRef.current,
        actionElement: actionRef.current,
        targetHref,
        targetFeedId,
        imageIndex: targetImageIndex,
      });
      return;
    }
    if (sourceSurface === "explore") {
      navigateWithinApp(targetHref);
      return;
    }
    navigateWithSharedImageTransition(targetHref);
  };

  return (
    <div
      data-source-surface={sourceSurface}
      className="relative flex flex-col flex-1 bg-tux-v2-ui-page-flat-1 min-h-0"
      style={{ backgroundColor: detailPageBackground }}
    >
      {false ? (
        <LikeMotionDevPanel
          config={likeMotionConfig}
          onChange={(patch) =>
            setLikeMotionConfig((current) => ({ ...current, ...patch }))
          }
        />
      ) : null}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div
          className="top-0 z-30 sticky bg-tux-v2-ui-page-flat-1 shrink-0"
          style={{ backgroundColor: detailPageBackground }}
        >
          <div
            ref={headerRef}
            className="flex items-center gap-0.5 pr-2 pl-1 w-full h-[54px]"
            style={{ viewTransitionName: headerTransitionName }}
          >
            <button
              type="button"
              aria-label="Go back"
              className="flex justify-start items-center pl-[9px] w-[34px] h-10 shrink-0"
              onClick={handleBack}
            >
              <IconChevronLeftOffsetLTR width={22} height={22} className="text-tux-v2-ui-text-1" />
            </button>

            <div className="flex flex-1 items-center gap-2 ml-[-2px] min-w-0">
              <img
                src={detail.content.avatarUrl}
                alt={`${detail.content.nickname} avatar`}
                className="rounded-full w-8 h-8 object-cover shrink-0"
                style={{ border: DETAIL_AVATAR_BORDER }}
              />
              <div className="flex flex-col justify-center min-w-0">
                <TUXText typographyPreset="H4-Semibold" className="text-tux-v2-ui-text-1 truncate">
                  {detail.content.nickname}
                </TUXText>
                <div className="flex items-center gap-0.5 min-w-0">
                  <IconMusicNoteSAlt
                    width={12}
                    height={12}
                    className="text-tux-v2-ui-text-3 shrink-0"
                  />
                  <TUXText typographyPreset="P3-Regular" className="text-tux-v2-ui-text-3 truncate">
                    {detail.content.musicTitle}
                  </TUXText>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 ml-2 shrink-0">
              <TUXButton
                text="Follow"
                themePreset="primary"
                shapePreset="capsule"
                sizePreset="small"
                smoothRadius
                minWidth="76px"
              />

              <button
                type="button"
                aria-label="Search"
                className="flex justify-center items-center w-10 h-10"
              >
                <IconMagnifyingGlass width={22} height={22} className="text-tux-v2-ui-text-1" />
              </button>
            </div>
          </div>
        </div>

        <div
          className="flex flex-col bg-tux-v2-ui-page-flat-1"
          style={{
            paddingBottom: `calc(${bottomInsetCss} + 76px)`,
            backgroundColor: detailPageBackground,
          }}
        >
          <div
            ref={imageRegionRef}
            className="relative flex justify-center items-center bg-tux-v2-ui-page-flat-1 w-full overflow-hidden"
            style={{
              height: imageContainerHeight,
              touchAction: "pan-y",
              backgroundColor: imageRegionBackground,
            }}
          >
            <div
              ref={carouselRef}
              className="w-full h-full overflow-hidden hide-scrollbar"
            >
              <div
                className="flex h-full"
                style={{
                  width: Math.max(1, viewportW) * detail.content.photoText.images.length,
                }}
              >
                {detail.content.photoText.images.map((src, index) => (
                  (() => {
                    const displayAspect = displayAspectForIndex(index);
                    const imageAspect =
                      displayAspect[0] / Math.max(displayAspect[1], 1);
                    const fitByHeight = imageAspect < imageContainerRatio;
                    const imageDisplayWidth = fitByHeight
                      ? Math.min(
                        Math.max(1, viewportW),
                        imageContainerHeight * imageAspect,
                      )
                      : Math.max(1, viewportW);
                    const imageDisplayHeight = fitByHeight
                      ? imageContainerHeight
                      : Math.min(
                        imageContainerHeight,
                        Math.max(1, viewportW) / Math.max(imageAspect, 0.001),
                      );

                    return (
                      <div
                        key={`${detail.content.id}-${index}`}
                        data-photo-text-detail-image-index={index}
                        className="flex justify-center items-center bg-tux-v2-ui-page-flat-1 h-full overflow-hidden shrink-0"
                        style={{
                          width: viewportW,
                          height: imageContainerHeight,
                          backgroundColor: imageRegionBackground,
                          viewTransitionName:
                            index === activeIndex
                              ? PHOTO_TEXT_SHARED_IMAGE_TRANSITION_NAME
                              : "none",
                        }}
                      >
                        <img
                          src={src}
                          alt={`${detail.content.nickname} detail ${index + 1}`}
                          {...{
                            [PHOTO_TEXT_DETAIL_IMAGE_TARGET_ATTR]: `${index}`,
                          }}
                          className="object-cover select-none"
                          style={{
                            width: imageDisplayWidth,
                            height: imageDisplayHeight,
                            objectPosition:
                              index === routeState.imageIndex
                                ? sourceFrame?.objectPosition ?? "center center"
                                : "center center",
                          }}
                          draggable={false}
                        />
                      </div>
                    );
                  })()
                ))}
              </div>
            </div>

            <button
              type="button"
              aria-label="Toggle image audio"
              className="right-3 bottom-3 absolute flex items-start gap-2.5 p-1.5 rounded-[16px]"
              style={{
                backgroundColor:
                  "var(--tux-v2-color-ui-image-overlay-dark-gray-a60)",
              }}
            >
              <IconSpeakerXMarkFillLTR
                width={16}
                height={16}
                style={{ color: "var(--tux-v2-color-ui-image-overlay-white)" }}
              />
            </button>
          </div>

          <div
            ref={bodyRef}
            className="flex flex-col items-center bg-tux-v2-ui-page-flat-1 w-full"
            style={{
              backgroundColor: detailPageBackground,
              viewTransitionName: bodyTransitionName,
            }}
          >
            {showPageControl ? (
              <div className="flex justify-center items-center px-4 pt-1 pb-1.5 w-full">
                <div className="relative flex justify-center items-center px-1.5 py-1.5">
                  {pageControlDots.map((dot) => {
                    const dotPadding =
                      dot.sizePx >= PAGE_CONTROL_DOT_ACTIVE_PX
                        ? (PAGE_CONTROL_DOT_WRAPPER_PX - dot.sizePx) / 2
                        : 0;
                    return (
                      <span
                        key={dot.key}
                        className="relative flex justify-center items-center shrink-0"
                        style={{
                          width: PAGE_CONTROL_DOT_WRAPPER_PX,
                          height: PAGE_CONTROL_DOT_WRAPPER_PX,
                          padding: dotPadding,
                        }}
                      >
                        <span
                          className="rounded-full"
                          style={{
                            width: dot.sizePx,
                            height: dot.sizePx,
                            backgroundColor: dot.active
                              ? activeDotColor
                              : inactiveDotColor,
                            opacity: 1,
                          }}
                        />
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div
              className="flex flex-col items-start gap-3 px-4 pb-4 w-full"
              style={{ paddingTop: showPageControl ? undefined : 20 }}
            >
              <div className="flex flex-col gap-1.5 w-full text-tux-v2-ui-text-1">
                <TUXText typographyPreset="H3-Semibold" className="text-tux-v2-ui-text-1">
                  {detail.content.photoText.title}
                </TUXText>
                <div className="w-full text-tux-v2-ui-text-1">
                  <TUXText
                    as="p"
                    typographyPreset="H4-Regular"
                    className="m-0 text-tux-v2-ui-text-1 whitespace-pre-wrap"
                  >
                    {descBody}
                  </TUXText>
                  {hashtags ? (
                    <TUXText
                      as="p"
                      typographyPreset="Headline-Regular"
                      className="block mt-1.5 text-tux-v2-ui-text-info"
                    >
                      {hashtags}
                    </TUXText>
                  ) : null}
                </div>
              </div>

              <div className="w-full overflow-x-auto hide-scrollbar">
                <div className="flex items-center gap-2 min-w-max">
                  {anchorTokens.map((anchor, index) => (
                    <DetailAnchorChip
                      key={anchor.id}
                      label={anchor.label}
                      leadingIcon={
                        index === 0 ? (
                          <IconMapThumbtackFill
                            width={13}
                            height={13}
                            className="text-tux-v2-ui-text-1"
                          />
                        ) : (
                          <IconPenStarFill
                            width={13}
                            height={13}
                            className="text-tux-v2-ui-text-1"
                          />
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1 text-nowrap">
                <TUXText typographyPreset="P2-Regular" className="text-tux-v2-ui-text-3">
                  {detail.timestamp}
                </TUXText>
                <TUXText typographyPreset="P2-Regular" className="text-tux-v2-ui-text-3">
                  ·
                </TUXText>
                <TUXText typographyPreset="P2-Semibold" className="text-tux-v2-ui-text-1">
                  See translation
                </TUXText>
              </div>
            </div>

            <div className="px-4 w-full">
              <div
                className="w-full"
                style={{
                  height: "0.5px",
                  backgroundColor: getColorCSSVar("UIShapeNeutral3"),
                }}
              />
            </div>

            <div className="flex flex-col pb-3.5 w-full">
              <div className="px-4 pt-3 pb-1">
                <TUXText typographyPreset="H4-Semibold" className="text-tux-v2-ui-text-1">
                  {formatCount(detail.content.commentCount)} comments
                </TUXText>
              </div>
              <DetailComposerRow avatarUrl={detail.content.avatarUrl} />
              {detail.comments.map((comment) => (
                <DetailCommentRow key={comment.id} {...comment} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        ref={actionRef}
        className="right-0 bottom-0 left-0 absolute bg-tux-v2-ui-page-flat-1"
        style={{
          backgroundColor: detailBottomBarBackground,
          paddingBottom: bottomInsetCss,
          boxShadow: `inset 0 0.5px 0 ${getColorCSSVar("UIShapeNeutral3")}`,
          viewTransitionName: actionTransitionName,
        }}
      >
        <div className="flex items-center gap-2.5 px-3 pt-[9px] pb-1 h-14">
          <div
            className="flex flex-[1_0_0] items-center px-4 rounded-full min-w-0 h-10"
            style={{ backgroundColor: getColorCSSVar("UIShapeNeutral4") }}
          >
            <TUXText typographyPreset="P1-Regular" className="text-tux-v2-ui-text-placeholder">
              Add comment...
            </TUXText>
          </div>

          <div className="flex items-center w-[208px] h-full">
            <DetailLikeAction
              initialCount={detail.content.likeCount}
              config={likeMotionConfig}
            />
            <DetailAction
              icon={
                <Icon3ptBubbleEllipsisRight
                  width={24}
                  height={24}
                  className="text-tux-v2-ui-text-1"
                />
              }
              label={formatCount(detail.content.commentCount)}
            />
            <DetailAction
              icon={
                <Icon3ptBookmark
                  width={24}
                  height={24}
                  className="text-tux-v2-ui-text-1"
                />
              }
              label={formatCount(detail.content.favoriteCount)}
            />
            <DetailAction
              icon={
                <Icon3ptArrowTurnUpRight
                  width={24}
                  height={24}
                  className="text-tux-v2-ui-text-1"
                />
              }
              label={formatCount(detail.content.shareCount)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
