import { TUXText, getColorCSSVar } from "@byted-tiktok/tux-web";
import {
  IconChevronDown,
  IconLike,
  IconLikeFill,
  IconPlayFill,
  IconThumbsDown,
  IconThumbsdownFill,
} from "@byted-tiktok/tux-icons";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  DEFAULT_COMMENT_EXPERIMENT_CONFIG,
  type CommentExperimentConfig,
} from "./comment_experiment_config";
import { InlineExpandText } from "./inline_expand_text";
import { toCanonicalWikiKeyword } from "./comment_wiki_content";

type CommentImageResource = {
  kind: "image";
  src: string;
  intrinsicWidth: number;
  intrinsicHeight: number;
  border?: string;
  autoSize?: boolean;
};

type CommentStickerResource = {
  kind: "sticker";
  src: string;
  intrinsicWidth: number;
  intrinsicHeight: number;
  autoSize?: boolean;
};

type CommentAudioResource = {
  kind: "audio";
  barWidth: number;
  duration: string;
  text: string;
  showMore?: boolean;
};

type CommentResource = CommentImageResource | CommentStickerResource | CommentAudioResource;
type CommentIntrinsicSize = { width: number; height: number };

export type CommentSubPreview = {
  comment: {
    avatarSrc: string;
    username: string;
    creatorLabel?: "Creator" | "Following";
    content: string;
    timeLabel: string;
    likeCountLabel: string;
    resource?: CommentResource;
  };
  viewRepliesLabel: string;
};

export type CommentCellProps = {
  avatarSrc: string;
  username: string;
  creatorLabel?: "Creator" | "Following";
  content: string;
  timeLabel: string;
  likeCountLabel: string;
  resource?: CommentResource;
  subPreview?: CommentSubPreview;
  experimentConfig?: CommentExperimentConfig;
  animateResourceStyle?: boolean;
  showWikiEntryPoint?: boolean;
  onWikiEntryPointClick?: (keyword: string) => void;
  onImageClick?: (src: string) => void;
};

const COMMENT_IMAGE_MIN_RATIO = 3 / 4;
const COMMENT_IMAGE_MAX_RATIO = 4 / 3;
const COMMENT_SIMPLE_IMAGE_MAX_WIDTH = 150;
const COMMENT_SIMPLE_IMAGE_MAX_HEIGHT = 150;
const COMMENT_STICKER_MAX_SIZE = 120;
const COMMENT_THREAD_IMAGE_MIN_WIDTH = 100;
const COMMENT_THREAD_IMAGE_MIN_HEIGHT = 60;
const COMMENT_WIKI_KEYWORDS = [
  "croissant",
  "TikTok",
  "laminated pastry",
  "Parisian cafe",
  "wrizz",
  "delulu",
  "sigma",
  "chronically online",
  "Y/N",
  "let him cook",
  "it's giving",
  "CEO of",
] as const;
const COMMENT_MENTION_REGEX_SOURCE = "@[A-Za-z0-9_.]+";
const COMMENT_WIKI_REGEX_SOURCE = `\\b(?:${[...COMMENT_WIKI_KEYWORDS]
  .sort((a, b) => b.length - a.length)
  .map((keyword) => keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|")})\\b`;
const COMMENT_HIDDEN_LABEL = "This comment will no longer be shown to you";
const COUNT_LABEL_REGEX = /^(\d+(?:\.\d+)?)([kmb])?$/i;
const COUNT_SUFFIX_MULTIPLIERS = {
  k: 1_000,
  m: 1_000_000,
  b: 1_000_000_000,
} as const;
const commentAutoResourceSizeCache = new Map<string, CommentIntrinsicSize>();

function parseCountLabel(label: string) {
  const normalizedLabel = label.trim();
  const matched = COUNT_LABEL_REGEX.exec(normalizedLabel);
  if (!matched) return null;

  const [, valueText, suffixText] = matched;
  const numericValue = Number.parseFloat(valueText);
  if (!Number.isFinite(numericValue)) return null;

  if (!suffixText) {
    return Math.round(numericValue);
  }

  const suffix = suffixText.toLowerCase() as keyof typeof COUNT_SUFFIX_MULTIPLIERS;
  const multiplier = COUNT_SUFFIX_MULTIPLIERS[suffix];
  if (!multiplier) return null;
  return Math.round(numericValue * multiplier);
}

function trimTrailingZeros(value: string) {
  return value.replace(/\.0$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}

function formatCountLabel(value: number, originalLabel: string) {
  const normalizedLabel = originalLabel.trim();
  const matched = COUNT_LABEL_REGEX.exec(normalizedLabel);
  const originalSuffix = matched?.[2]?.toLowerCase();

  if (!originalSuffix && value < 1_000) {
    return String(value);
  }

  if (value >= 1_000_000_000) {
    return `${trimTrailingZeros((value / 1_000_000_000).toFixed(1))}b`;
  }

  if (value >= 1_000_000) {
    return `${trimTrailingZeros((value / 1_000_000).toFixed(1))}m`;
  }

  if (value >= 1_000) {
    return `${trimTrailingZeros((value / 1_000).toFixed(1))}k`;
  }

  return String(value);
}

function getCommentVisualResourceStyle(
  resource: CommentImageResource | CommentStickerResource,
  experimentConfig: CommentExperimentConfig,
  {
    expanded = false,
    availableWidth,
  }: {
    expanded?: boolean;
    availableWidth?: number;
  } = {},
) {
  if (resource.kind === "sticker") {
    const scale = Math.min(
      1,
      COMMENT_STICKER_MAX_SIZE / Math.max(1, resource.intrinsicWidth),
      COMMENT_STICKER_MAX_SIZE / Math.max(1, resource.intrinsicHeight),
    );

    return {
      width: Math.round(resource.intrinsicWidth * scale),
      height: Math.round(resource.intrinsicHeight * scale),
      borderRadius: 4,
      border: undefined,
      objectFit: "contain" as const,
    };
  }

  if (
    expanded &&
    experimentConfig.imageCroppingStyle === "thread" &&
    Number.isFinite(availableWidth) &&
    (availableWidth ?? 0) > 0
  ) {
    const maxWidth = Math.max(COMMENT_THREAD_IMAGE_MIN_WIDTH, Math.round(availableWidth ?? 0));
    const maxHeight = Math.round(maxWidth * (4 / 3));
    const aspectRatio = resource.intrinsicWidth / Math.max(1, resource.intrinsicHeight);
    const maxBoxRatio = maxWidth / Math.max(1, maxHeight);
    const fitsByWidth = aspectRatio >= maxBoxRatio;
    const fittedWidth = fitsByWidth ? maxWidth : maxHeight * aspectRatio;
    const fittedHeight = fitsByWidth ? maxWidth / Math.max(aspectRatio, 0.0001) : maxHeight;
    const needsVerticalCrop = fitsByWidth && fittedHeight < COMMENT_THREAD_IMAGE_MIN_HEIGHT;
    const needsHorizontalCrop = !fitsByWidth && fittedWidth < COMMENT_THREAD_IMAGE_MIN_WIDTH;

    return {
      width: Math.round(needsHorizontalCrop ? COMMENT_THREAD_IMAGE_MIN_WIDTH : fittedWidth),
      height: Math.round(needsVerticalCrop ? COMMENT_THREAD_IMAGE_MIN_HEIGHT : fittedHeight),
      borderRadius: experimentConfig.imageBorderRadius,
      border: resource.border,
      objectFit: "cover" as const,
    };
  }

  const rawRatio = resource.intrinsicWidth / Math.max(1, resource.intrinsicHeight);
  const constrainedRatio = Math.min(
    COMMENT_IMAGE_MAX_RATIO,
    Math.max(COMMENT_IMAGE_MIN_RATIO, rawRatio),
  );
  const maxAvailableWidth =
    Number.isFinite(availableWidth) && (availableWidth ?? 0) > 0
      ? Math.max(1, availableWidth ?? 0)
      : undefined;

  if (experimentConfig.imageCroppingStyle === "simple") {
    const fittedSimpleSize = fitSizeWithinBox(
      {
        width: COMMENT_SIMPLE_IMAGE_MAX_WIDTH,
        height: COMMENT_SIMPLE_IMAGE_MAX_HEIGHT,
      },
      constrainedRatio,
    );
    const expandRate = expanded
      ? Math.max(1, experimentConfig.imageExpandRate)
      : 1;
    const expandedWidth = fittedSimpleSize.width * expandRate;
    const constrainedWidth = Math.min(expandedWidth, maxAvailableWidth ?? expandedWidth);
    const height = constrainedWidth / constrainedRatio;

    return {
      width: Math.round(constrainedWidth),
      height: Math.round(height),
      borderRadius: experimentConfig.imageBorderRadius,
      border: resource.border,
      objectFit: "cover" as const,
    };
  }

  const width = Math.sqrt(Math.max(1, experimentConfig.imageTargetArea) * constrainedRatio);
  const constrainedWidth = Math.min(width, maxAvailableWidth ?? width);
  const height = constrainedWidth / constrainedRatio;

  return {
    width: Math.round(constrainedWidth),
    height: Math.round(height),
    borderRadius: experimentConfig.imageBorderRadius,
    border: resource.border,
    objectFit: "cover" as const,
  };
}

function getCachedAutoResourceSize(resource: CommentResource | undefined) {
  if (!resource || resource.kind === "audio" || !resource.autoSize) return null;
  return commentAutoResourceSizeCache.get(resource.src) ?? null;
}

function cacheAutoResourceSize(resource: CommentResource | undefined, size: CommentIntrinsicSize) {
  if (!resource || resource.kind === "audio" || !resource.autoSize) return;
  commentAutoResourceSizeCache.set(resource.src, size);
}

function getAutoSizedResourceKey(resource: CommentResource | undefined) {
  if (!resource || resource.kind === "audio" || !resource.autoSize) return "";
  return `${resource.kind}:${resource.src}`;
}

export function CommentCell({
  avatarSrc,
  username,
  creatorLabel,
  content,
  timeLabel,
  likeCountLabel,
  resource,
  subPreview,
  experimentConfig = DEFAULT_COMMENT_EXPERIMENT_CONFIG,
  animateResourceStyle = true,
  showWikiEntryPoint = false,
  onWikiEntryPointClick,
  onImageClick,
}: CommentCellProps) {
  const contentColumnRef = useRef<HTMLDivElement | null>(null);
  const [contentColumnWidth, setContentColumnWidth] = useState(0);
  const [isDisliked, setIsDisliked] = useState(false);
  const [loadedImageSize, setLoadedImageSize] = useState<CommentIntrinsicSize | null>(
    () => getCachedAutoResourceSize(resource),
  );

  useEffect(() => {
    const host = contentColumnRef.current;
    if (!host) return;

    const updateWidth = () => {
      const nextWidth = host.getBoundingClientRect().width;
      setContentColumnWidth((current) => {
        const rounded = Math.max(0, Math.round(nextWidth));
        return current === rounded ? current : rounded;
      });
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(host);
    return () => resizeObserver.disconnect();
  }, []);

  const autoSizedResourceKey = getAutoSizedResourceKey(resource);

  useEffect(() => {
    setLoadedImageSize(getCachedAutoResourceSize(resource));
  }, [autoSizedResourceKey]);

  return (
    <div className="flex gap-2 px-3 py-3">
      <img
        src={avatarSrc}
        alt=""
        className="rounded-full w-9 h-9 object-cover"
        loading="eager"
      />

      <div ref={contentColumnRef} className="flex flex-col gap-2 flex-1 min-w-0">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1 min-w-0">
            <TUXText
              as="span"
              style={{
                fontSize: 13,
                fontWeight: 600,
                lineHeight: "16.9px",
                color: getColorCSSVar("UIText3"),
              }}
            >
              {username}
            </TUXText>
            {creatorLabel ? (
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
                    color: getCommentLabelColor(creatorLabel),
                    whiteSpace: "nowrap",
                  }}
                >
                  {creatorLabel}
                </TUXText>
              </>
            ) : null}
          </div>

          {isDisliked ? (
            <HiddenCommentNotice onDislikeClick={() => setIsDisliked(false)} />
          ) : content ? (
            <TUXText
              as="div"
              style={{
                fontSize: 15,
                fontWeight: 500,
                lineHeight: "19.5px",
                color: getColorCSSVar("UIText1"),
                wordBreak: "break-word",
              }}
            >
              {renderCommentText(content, showWikiEntryPoint, onWikiEntryPointClick)}
            </TUXText>
          ) : null}
        </div>

        {!isDisliked ? (
          <>
            {resource && resource.kind !== "audio" ? (() => {
              const effectiveResource =
                resource.autoSize && loadedImageSize
                  ? {
                      ...resource,
                      intrinsicWidth: loadedImageSize.width,
                      intrinsicHeight: loadedImageSize.height,
                    }
                  : resource;
              const visualStyle = getCommentVisualResourceStyle(effectiveResource, experimentConfig, {
                expanded: true,
                availableWidth: contentColumnWidth,
              });
              const collapsedExperimentConfig =
                experimentConfig.imageCroppingStyle === "simple"
                  ? experimentConfig
                  : DEFAULT_COMMENT_EXPERIMENT_CONFIG;
              const collapsedVisualStyle = getCommentVisualResourceStyle(
                effectiveResource,
                collapsedExperimentConfig,
                { expanded: false, availableWidth: contentColumnWidth },
              );
              const widthDelta = visualStyle.width - collapsedVisualStyle.width;
              const heightDelta = visualStyle.height - collapsedVisualStyle.height;
              const borderRadiusDelta = visualStyle.borderRadius - collapsedVisualStyle.borderRadius;
              const interpolatedWidth =
                resource.kind === "image"
                  ? `calc(${collapsedVisualStyle.width}px + ${widthDelta}px * var(--comment-panel-expand-progress, 0))`
                  : visualStyle.width;
              const interpolatedHeight =
                resource.kind === "image"
                  ? `calc(${collapsedVisualStyle.height}px + ${heightDelta}px * var(--comment-panel-expand-progress, 0))`
                  : visualStyle.height;
              const interpolatedBorderRadius =
                resource.kind === "image"
                  ? `calc(${collapsedVisualStyle.borderRadius}px + ${borderRadiusDelta}px * var(--comment-panel-expand-progress, 0))`
                  : visualStyle.borderRadius;
              return (
                <div
                  onClick={
                    resource.kind === "image" && onImageClick
                      ? () => onImageClick(resource.src)
                      : undefined
                  }
                  style={{
                    width: interpolatedWidth,
                    height: interpolatedHeight,
                    borderRadius: interpolatedBorderRadius,
                    border: visualStyle.border,
                    overflow: "hidden",
                    position: "relative",
                    alignSelf: "flex-start",
                    cursor: resource.kind === "image" && onImageClick ? "zoom-in" : undefined,
                    transition:
                      resource.kind === "image" && animateResourceStyle
                        ? "width 320ms cubic-bezier(0.33, 0.86, 0.2, 1), height 320ms cubic-bezier(0.33, 0.86, 0.2, 1), border-radius 320ms cubic-bezier(0.33, 0.86, 0.2, 1)"
                        : undefined,
                  }}
                >
                  <img
                    src={resource.src}
                    alt=""
                    loading="eager"
                    onLoad={
                      resource.autoSize
                        ? (event) => {
                            const target = event.currentTarget;
                            if (target.naturalWidth <= 0 || target.naturalHeight <= 0) return;
                            const nextSize = {
                              width: target.naturalWidth,
                              height: target.naturalHeight,
                            };
                            cacheAutoResourceSize(resource, nextSize);
                            setLoadedImageSize(nextSize);
                          }
                        : undefined
                    }
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: visualStyle.objectFit,
                      display: "block",
                      borderRadius: "inherit",
                    }}
                  />
                </div>
              );
            })() : null}

            {resource?.kind === "audio" ? (
              <CommentAudioResourceView
                barWidth={resource.barWidth}
                duration={resource.duration}
                text={resource.text}
                showMore={resource.showMore}
              />
            ) : null}

            <CommentActions
              timeLabel={timeLabel}
              likeCountLabel={likeCountLabel}
              showDislike
              onDislikeClick={() => setIsDisliked(true)}
            />

          </>
        ) : null}

        {subPreview ? (
          <div className="flex flex-col gap-2">
            <SubCommentCell
              {...subPreview.comment}
              experimentConfig={experimentConfig}
              showWikiEntryPoint={showWikiEntryPoint}
              onWikiEntryPointClick={onWikiEntryPointClick}
              onImageClick={onImageClick}
            />
            <ViewRepliesRow label={subPreview.viewRepliesLabel} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CommentActions({
  timeLabel,
  likeCountLabel,
  showDislike,
  onDislikeClick,
}: {
  timeLabel: string;
  likeCountLabel: string;
  showDislike: boolean;
  onDislikeClick?: () => void;
}) {
  const [isLiked, setIsLiked] = useState(false);
  const parsedLikeCount = useMemo(() => parseCountLabel(likeCountLabel), [likeCountLabel]);
  const likeColor = isLiked ? getColorCSSVar("UIShapePrimary") : getColorCSSVar("UIText3");
  const resolvedLikeCountLabel =
    parsedLikeCount === null
      ? likeCountLabel
      : formatCountLabel(parsedLikeCount + (isLiked ? 1 : 0), likeCountLabel);

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <TUXText
          as="span"
          style={{
            fontSize: 12,
            fontWeight: 400,
            lineHeight: "15.6px",
            color: getColorCSSVar("UITextPlaceholder"),
          }}
        >
          {timeLabel}
        </TUXText>
        <TUXText
          as="span"
          style={{
            fontSize: 13,
            fontWeight: 600,
            lineHeight: "16.9px",
            color: getColorCSSVar("UIText3"),
          }}
        >
          Reply
        </TUXText>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={isLiked ? "Unlike comment" : "Like comment"}
          aria-pressed={isLiked}
          className="flex items-center gap-0.5 border-0 bg-transparent p-0"
          onClick={() => setIsLiked((value) => !value)}
        >
          {isLiked ? (
            <IconLikeFill width={16} height={16} style={{ color: likeColor }} />
          ) : (
            <IconLike width={16} height={16} style={{ color: likeColor }} />
          )}
          <TUXText
            as="span"
            style={{
              display: "inline-block",
              minWidth: "3ch",
              textAlign: "left",
              fontSize: 12,
              fontWeight: 400,
              fontVariantNumeric: "tabular-nums",
              lineHeight: "15.6px",
              color: likeColor,
            }}
          >
            {resolvedLikeCountLabel}
          </TUXText>
        </button>
        {showDislike ? (
          <DislikeButton pressed={false} onClick={onDislikeClick} />
        ) : null}
      </div>
    </div>
  );
}

function HiddenCommentNotice({ onDislikeClick }: { onDislikeClick: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <TUXText
        as="div"
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          fontWeight: 400,
          lineHeight: "15.6px",
          color: getColorCSSVar("UITextPlaceholder"),
        }}
      >
        {COMMENT_HIDDEN_LABEL}
      </TUXText>
      <DislikeButton pressed onClick={onDislikeClick} />
    </div>
  );
}

function DislikeButton({
  pressed,
  onClick,
}: {
  pressed: boolean;
  onClick?: () => void;
}) {
  const iconColor = getColorCSSVar("UIText3");

  return (
    <button
      type="button"
      aria-label={pressed ? "Undo dislike comment" : "Dislike comment"}
      aria-pressed={pressed}
      className="flex shrink-0 items-center border-0 bg-transparent p-0"
      onClick={onClick}
    >
      {pressed ? (
        <IconThumbsdownFill width={16} height={16} style={{ color: iconColor }} />
      ) : (
        <IconThumbsDown width={16} height={16} style={{ color: iconColor }} />
      )}
    </button>
  );
}

function ViewRepliesRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        style={{
          width: 24,
          height: 0.5,
          backgroundColor: getColorCSSVar("UIShapeNeutral3"),
        }}
      />
      <div className="flex items-center" style={{ gap: 1 }}>
        <TUXText
          as="span"
          style={{
            fontSize: 13,
            fontWeight: 600,
            lineHeight: "16.9px",
            color: getColorCSSVar("UIText3"),
          }}
        >
          {label}
        </TUXText>
        <IconChevronDown width={16} height={16} style={{ color: getColorCSSVar("UIText3") }} />
      </div>
    </div>
  );
}

function getCommentLabelColor(label: "Creator" | "Following") {
  return label === "Creator" ? getColorCSSVar("UITextSecondary") : getColorCSSVar("UIText3");
}

function fitSizeWithinBox(box: CommentIntrinsicSize, aspectRatio: number) {
  const safeRatio = Math.max(aspectRatio, 0.0001);
  const boxRatio = box.width / Math.max(1, box.height);
  const fitsByWidth = safeRatio >= boxRatio;
  return {
    width: fitsByWidth ? box.width : box.height * safeRatio,
    height: fitsByWidth ? box.width / safeRatio : box.height,
  };
}

function SubCommentCell({
  avatarSrc,
  username,
  creatorLabel,
  content,
  timeLabel,
  likeCountLabel,
  resource,
  experimentConfig = DEFAULT_COMMENT_EXPERIMENT_CONFIG,
  showWikiEntryPoint = false,
  onWikiEntryPointClick,
  onImageClick,
}: CommentSubPreview["comment"] & {
  experimentConfig?: CommentExperimentConfig;
  showWikiEntryPoint?: boolean;
  onWikiEntryPointClick?: (keyword: string) => void;
  onImageClick?: (src: string) => void;
}) {
  const [isDisliked, setIsDisliked] = useState(false);
  const contentColumnRef = useRef<HTMLDivElement | null>(null);
  const [contentColumnWidth, setContentColumnWidth] = useState(0);
  const [loadedImageSize, setLoadedImageSize] = useState<CommentIntrinsicSize | null>(
    () => getCachedAutoResourceSize(resource),
  );

  useEffect(() => {
    const host = contentColumnRef.current;
    if (!host) return;

    const updateWidth = () => {
      const nextWidth = host.getBoundingClientRect().width;
      setContentColumnWidth((current) => {
        const rounded = Math.max(0, Math.round(nextWidth));
        return current === rounded ? current : rounded;
      });
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(host);
    return () => resizeObserver.disconnect();
  }, []);

  const autoSizedResourceKey = getAutoSizedResourceKey(resource);

  useEffect(() => {
    setLoadedImageSize(getCachedAutoResourceSize(resource));
  }, [autoSizedResourceKey]);

  return (
    <div className="flex items-start gap-2 min-w-0">
      <img
        src={avatarSrc}
        alt=""
        className="rounded-full object-cover shrink-0"
        loading="eager"
        style={{
          width: 24,
          height: 24,
          border: `0.5px solid ${getColorCSSVar("UIShapeNeutral3")}`,
        }}
      />

      <div ref={contentColumnRef} className="flex flex-col gap-2 flex-1 min-w-0">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1 min-w-0">
            <TUXText
              as="span"
              style={{
                fontSize: 13,
                fontWeight: 600,
                lineHeight: "16.9px",
                color: getColorCSSVar("UIText3"),
                whiteSpace: "nowrap",
              }}
            >
              {username}
            </TUXText>
            {creatorLabel ? (
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
                    color: getCommentLabelColor(creatorLabel),
                    whiteSpace: "nowrap",
                  }}
                >
                  {creatorLabel}
                </TUXText>
              </>
            ) : null}
          </div>

          {isDisliked ? (
            <HiddenCommentNotice onDislikeClick={() => setIsDisliked(false)} />
          ) : (
            <TUXText
              as="div"
              style={{
                fontSize: 15,
                fontWeight: 500,
                lineHeight: "19.5px",
                color: getColorCSSVar("UIText1"),
                wordBreak: "break-word",
              }}
            >
              {renderCommentText(content, showWikiEntryPoint, onWikiEntryPointClick)}
            </TUXText>
          )}
        </div>

        {!isDisliked ? (
          <>
            {resource && resource.kind !== "audio" ? (() => {
              const effectiveResource =
                resource.autoSize && loadedImageSize
                  ? {
                      ...resource,
                      intrinsicWidth: loadedImageSize.width,
                      intrinsicHeight: loadedImageSize.height,
                    }
                  : resource;
              const visualStyle = getCommentVisualResourceStyle(
                effectiveResource,
                experimentConfig,
                { expanded: true, availableWidth: contentColumnWidth },
              );
              const collapsedExperimentConfig =
                experimentConfig.imageCroppingStyle === "simple"
                  ? experimentConfig
                  : DEFAULT_COMMENT_EXPERIMENT_CONFIG;
              const collapsedVisualStyle = getCommentVisualResourceStyle(
                effectiveResource,
                collapsedExperimentConfig,
                { expanded: false, availableWidth: contentColumnWidth },
              );
              const widthDelta = visualStyle.width - collapsedVisualStyle.width;
              const heightDelta = visualStyle.height - collapsedVisualStyle.height;
              const borderRadiusDelta = visualStyle.borderRadius - collapsedVisualStyle.borderRadius;
              const interpolatedWidth =
                resource.kind === "image"
                  ? `calc(${collapsedVisualStyle.width}px + ${widthDelta}px * var(--comment-panel-expand-progress, 0))`
                  : visualStyle.width;
              const interpolatedHeight =
                resource.kind === "image"
                  ? `calc(${collapsedVisualStyle.height}px + ${heightDelta}px * var(--comment-panel-expand-progress, 0))`
                  : visualStyle.height;
              const interpolatedBorderRadius =
                resource.kind === "image"
                  ? `calc(${collapsedVisualStyle.borderRadius}px + ${borderRadiusDelta}px * var(--comment-panel-expand-progress, 0))`
                  : visualStyle.borderRadius;
              return (
                <div
                  onClick={
                    resource.kind === "image" && onImageClick
                      ? () => onImageClick(resource.src)
                      : undefined
                  }
                  style={{
                    width: interpolatedWidth,
                    height: interpolatedHeight,
                    borderRadius: interpolatedBorderRadius,
                    border: visualStyle.border,
                    overflow: "hidden",
                    position: "relative",
                    alignSelf: "flex-start",
                    cursor: resource.kind === "image" && onImageClick ? "zoom-in" : undefined,
                    transition:
                      resource.kind === "image"
                        ? "width 320ms cubic-bezier(0.33, 0.86, 0.2, 1), height 320ms cubic-bezier(0.33, 0.86, 0.2, 1), border-radius 320ms cubic-bezier(0.33, 0.86, 0.2, 1)"
                        : undefined,
                  }}
                >
                  <img
                    src={resource.src}
                    alt=""
                    loading="eager"
                    onLoad={
                      resource.autoSize
                        ? (event) => {
                            const target = event.currentTarget;
                            if (target.naturalWidth <= 0 || target.naturalHeight <= 0) return;
                            const nextSize = {
                              width: target.naturalWidth,
                              height: target.naturalHeight,
                            };
                            cacheAutoResourceSize(resource, nextSize);
                            setLoadedImageSize(nextSize);
                          }
                        : undefined
                    }
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: visualStyle.objectFit,
                      display: "block",
                      borderRadius: "inherit",
                    }}
                  />
                </div>
              );
            })() : null}

            {resource?.kind === "audio" ? (
              <CommentAudioResourceView
                barWidth={resource.barWidth}
                duration={resource.duration}
                text={resource.text}
                showMore={resource.showMore}
              />
            ) : null}

            <CommentActions
              timeLabel={timeLabel}
              likeCountLabel={likeCountLabel}
              showDislike
              onDislikeClick={() => setIsDisliked(true)}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}

function renderCommentText(
  text: string,
  showWikiEntryPoint: boolean,
  onWikiEntryPointClick?: (keyword: string) => void,
) {
  const tokenRegex = new RegExp(
    showWikiEntryPoint
      ? `(${COMMENT_MENTION_REGEX_SOURCE})|(${COMMENT_WIKI_REGEX_SOURCE})`
      : `(${COMMENT_MENTION_REGEX_SOURCE})`,
    "gi",
  );

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(tokenRegex)) {
    const matchIndex = match.index ?? 0;
    const matchedText = match[0];
    if (matchIndex > lastIndex) {
      nodes.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex, matchIndex)}</span>);
    }

    if (match[1]) {
      nodes.push(
        <span key={`mention-${matchIndex}`} style={{ color: getColorCSSVar("UITextInfo") }}>
          {matchedText}
        </span>,
      );
    } else if (showWikiEntryPoint) {
      nodes.push(
        <CommentWikiEntryPoint
          key={`wiki-${matchIndex}`}
          label={matchedText}
          onClick={onWikiEntryPointClick}
        />,
      );
    } else {
      nodes.push(<span key={`text-${matchIndex}`}>{matchedText}</span>);
    }

    lastIndex = matchIndex + matchedText.length;
  }

  if (nodes.length === 0) return text;
  if (lastIndex < text.length) {
    nodes.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }
  return nodes;
}

function CommentWikiEntryPoint({
  label,
  onClick,
}: {
  label: string;
  onClick?: (keyword: string) => void;
}) {
  const isInteractive = Boolean(onClick);
  return (
    <span
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={
        isInteractive
          ? (event) => {
              event.stopPropagation();
              const canonicalKeyword = toCanonicalWikiKeyword(label);
              onClick?.(canonicalKeyword ?? label);
            }
          : undefined
      }
      onKeyDown={
        isInteractive
          ? (event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              event.stopPropagation();
              const canonicalKeyword = toCanonicalWikiKeyword(label);
              onClick?.(canonicalKeyword ?? label);
            }
          : undefined
      }
      style={{
        color: getColorCSSVar("UIText1"),
        backgroundImage: `radial-gradient(circle, ${getColorCSSVar("UITextPlaceholder")} 1px, transparent 1.1px)`,
        backgroundPosition: "0 calc(100% - 1px)",
        backgroundRepeat: "repeat-x",
        backgroundSize: "5px 3px",
        paddingBottom: 2,
        cursor: isInteractive ? "pointer" : undefined,
      }}
    >
      {label}
    </span>
  );
}

function CommentAudioResourceView({
  barWidth,
  duration,
  text,
  showMore,
}: {
  barWidth: number;
  duration: string;
  text: string;
  showMore?: boolean;
}) {
  const forceShowMore = Boolean(showMore);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setIsExpanded(false);
  }, [text]);

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex items-center"
        style={{
          width: barWidth,
          height: 44,
          // Figma: UI/Sheet/Flat 2
          backgroundColor: getColorCSSVar("UISheetFlat2"),
          borderRadius: 14,
          border: `0.5px solid ${getColorCSSVar("UIShapeNeutral4")}`,
          padding: 12,
          gap: 8,
        }}
      >
        <div
          className="flex items-center justify-center"
          style={{
            width: 24,
            height: 24,
            // Figma: UI/Sheet/Flat 3
            backgroundColor: getColorCSSVar("UISheetFlat3"),
            borderRadius: 999,
            border: `0.5px solid ${getColorCSSVar("UIShapeNeutral4")}`,
            flexShrink: 0,
          }}
        >
          <IconPlayFill width={14} height={14} style={{ color: getColorCSSVar("UIText1") }} />
        </div>
        <div className="flex-1 min-w-0 flex items-center" style={{ height: 20 }}>
          <AudioWave />
        </div>
        <TUXText
          as="span"
          style={{
            fontSize: 14,
            fontWeight: 600,
            lineHeight: "18.2px",
            color: getColorCSSVar("UIText1"),
            flexShrink: 0,
          }}
        >
          {duration}
        </TUXText>
      </div>

      <div
        style={{
          // Figma: UI/Sheet/Flat 2
          backgroundColor: getColorCSSVar("UISheetFlat2"),
          borderRadius: 14,
          padding: "10px 12px",
          position: "relative",
        }}
      >
        <InlineExpandText
          text={text}
          expanded={isExpanded}
          onExpandedChange={setIsExpanded}
          collapsedLines={4}
          fontSize={13}
          lineHeightPx={16.9}
          textColor={getColorCSSVar("UIText2")}
          actionColor={getColorCSSVar("UIText3")}
          measureWidthInsetPx={24}
          forceShowMore={forceShowMore}
        />
      </div>
    </div>
  );
}

function AudioWave({ tileWidth = 40.5 }: { tileWidth?: number }) {
  // Render as an inline SVG pattern (instead of CSS mask-image) to avoid browser/support
  // quirks that can degrade into a solid color block when the mask fails to apply.
  //
  // Important: do NOT use viewBox scaling here. The wave should look identical at any width
  // (cropped/repeated), not horizontally squashed/stretched.
  const rawId = useId();
  const patternId = useMemo(() => `audio-wave-${rawId.replace(/:/g, "-")}`, [rawId]);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [quantizedWidth, setQuantizedWidth] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const compute = () => {
      const width = host.getBoundingClientRect().width;
      // The pattern contains 9 bars per tile, but bars themselves are spaced regularly.
      // If we quantize by the full tile width, we'd drop up to 9 bars at once. Instead,
      // only trim when the *last bar* would be partially visible.
      //
      // From the exported SVG: bars are 2px wide and repeat every 4.5px.
      const BAR_PITCH_PX = 4.5;
      const BAR_WIDTH_PX = 2;

      const safePitch = BAR_PITCH_PX > 0 ? BAR_PITCH_PX : 1;
      const safeBarWidth = Math.min(BAR_WIDTH_PX, safePitch);

      // Remainder into the current pitch slot [0..pitch).
      const slotIndex = Math.floor(width / safePitch);
      const slotStart = slotIndex * safePitch;
      const remainder = width - slotStart;

      // If we're inside a bar (would show a chopped bar), snap back to the bar's start.
      const INSIDE_BAR_EPS = 0.01;
      const trimmed = remainder < safeBarWidth - INSIDE_BAR_EPS ? slotStart : width;

      // Avoid a 1px "hairline" at the end caused by subpixel rounding/AA.
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      const snapped = Math.floor(trimmed * dpr) / dpr;
      setQuantizedWidth(Math.max(0, snapped));
    };

    compute();
    const ro = new ResizeObserver(() => compute());
    ro.observe(host);
    return () => ro.disconnect();
  }, [tileWidth]);

  return (
    <div ref={hostRef} style={{ width: "100%", height: 20, overflow: "hidden" }}>
      {/* Only render full wave tiles; avoids showing a chopped last bar at the end. */}
      {quantizedWidth > 0 ? (
        <div style={{ width: quantizedWidth, height: 20, overflow: "hidden" }}>
          <svg
            width={quantizedWidth}
            height="20"
            style={{ display: "block", color: getColorCSSVar("UIText1") }}
            aria-hidden="true"
            focusable="false"
            shapeRendering="crispEdges"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id={patternId} width={tileWidth} height="20" patternUnits="userSpaceOnUse">
                <path
                  d="M0 8C0 7.44772 0.447715 7 1 7C1.55228 7 2 7.44772 2 8V12C2 12.5523 1.55228 13 1 13C0.447715 13 0 12.5523 0 12V8Z"
                  fill="currentColor"
                />
                <path
                  d="M4.5 5C4.5 4.44772 4.94772 4 5.5 4C6.05228 4 6.5 4.44772 6.5 5V15C6.5 15.5523 6.05228 16 5.5 16C4.94772 16 4.5 15.5523 4.5 15V5Z"
                  fill="currentColor"
                />
                <path
                  d="M9 3C9 2.44772 9.44772 2 10 2C10.5523 2 11 2.44772 11 3V17C11 17.5523 10.5523 18 10 18C9.44772 18 9 17.5523 9 17V3Z"
                  fill="currentColor"
                />
                <path
                  d="M13.5 5C13.5 4.44772 13.9477 4 14.5 4C15.0523 4 15.5 4.44772 15.5 5V15C15.5 15.5523 15.0523 16 14.5 16C13.9477 16 13.5 15.5523 13.5 15V5Z"
                  fill="currentColor"
                />
                <path
                  d="M18 6C18 5.44772 18.4477 5 19 5C19.5523 5 20 5.44772 20 6V14C20 14.5523 19.5523 15 19 15C18.4477 15 18 14.5523 18 14V6Z"
                  fill="currentColor"
                />
                <path
                  d="M22.5 7C22.5 6.44772 22.9477 6 23.5 6C24.0523 6 24.5 6.44772 24.5 7V13C24.5 13.5523 24.0523 14 23.5 14C22.9477 14 22.5 13.5523 22.5 13V7Z"
                  fill="currentColor"
                />
                <path
                  d="M27 8C27 7.44772 27.4477 7 28 7C28.5523 7 29 7.44772 29 8V12C29 12.5523 28.5523 13 28 13C27.4477 13 27 12.5523 27 12V8Z"
                  fill="currentColor"
                />
                <path
                  d="M31.5 8C31.5 7.44772 31.9477 7 32.5 7C33.0523 7 33.5 7.44772 33.5 8V12C33.5 12.5523 33.0523 13 32.5 13C31.9477 13 31.5 12.5523 31.5 12V8Z"
                  fill="currentColor"
                />
                <path
                  d="M36 5C36 4.44772 36.4477 4 37 4C37.5523 4 38 4.44772 38 5V15C38 15.5523 37.5523 16 37 16C36.4477 16 36 15.5523 36 15V5Z"
                  fill="currentColor"
                />
              </pattern>
            </defs>
            <rect width={quantizedWidth} height="20" fill={`url(#${patternId})`} />
          </svg>
        </div>
      ) : null}
    </div>
  );
}
