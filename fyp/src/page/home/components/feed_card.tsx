import {
  TUXButton,
  TUXIconButton,
  TUXText,
  getColorCSSVar,
  type TColorWithToken,
} from "@byted-tiktok/tux-web";
import {
  IconChevronCollapse,
  IconChevronLeftLTR,
  IconChevronRightLTR,
  IconChevronUpDouble,
  IconGearFill,
  IconImage,
  IconPlus,
} from "@byted-tiktok/tux-icons";
import {
  useRef,
  useState,
  useEffect,
  useMemo,
  type ChangeEvent,
  type CSSProperties,
  type RefObject,
} from "react";
import {
  AppFrameCornerCapsuleTrigger,
  AppFrameCornerPanelAnchor,
  APP_FRAME_CORNER_TRIGGER_HEIGHT_PX,
} from "../../../components/sys/app_frame_corner_capsule_trigger";
import { useCommentPanelVisualStore } from "./comment_panel/comment_panel_visual_store";
import {
    FEED_CARD_BACKGROUND_FAMILY_GROUPS,
    feedCardBackgroundStyle,
  formatFeedCardStopPosition,
  flipFeedCardBackgroundStopsVertical,
  resolveFeedCardHexColorForPreview,
  resolveFeedCardStopColorForRender,
  getFeedCardBackgroundPreset,
  setFeedCardBackgroundPresetId,
  setFeedCardBackgroundVariant,
  setFeedCardCustomStops,
  useFeedCardBackgroundPresetId,
  useFeedCardCustomStops,
  type FeedCardBackgroundPresetId,
  type FeedCardVariant,
} from "./feed_card.config";
import { FeedCardHexColorInput } from "./feed_card_hex_color_input";
import {
  getFeedCardMainButtonColors,
  getFeedCardSecondaryButtonColors,
  getFeedCardSwipeIndicatorColor,
  resetFeedCardMainButtonText,
  resolveFeedCardMainButtonColors,
  setFeedCardAppearance,
  setFeedCardBackgroundSource,
  setFeedCardBusinessCustomAspect,
  setFeedCardBusinessCustomAspect2,
  setFeedCardBusinessCustomImage,
  setFeedCardBusinessCustomImage2,
  setFeedCardCardType,
  setFeedCardCustomBackgroundImage,
  setFeedCardMainButtonColor,
  setFeedCardMainButtonCustomBackgroundHex,
  setFeedCardMainButtonCustomTextColor,
  setFeedCardMainButtonText,
  useFeedCardAppearance,
  useFeedCardBackgroundSource,
  useFeedCardBusinessCustomAspect,
  useFeedCardBusinessCustomAspect2,
  useFeedCardBusinessCustomImage,
  useFeedCardBusinessCustomImage2,
  useFeedCardCardType,
  useFeedCardCustomBackgroundImage,
  useFeedCardMainButtonColor,
  useFeedCardMainButtonCustomBackgroundHex,
  useFeedCardMainButtonCustomTextColor,
  useFeedCardMainButtonText,
  type FeedCardAppearance,
  type FeedCardCardType,
  type FeedCardMainButtonColor,
  type FeedCardMainButtonCustomTextColor,
} from "./feed_card_layout_store";

export type FeedCardProps = {
  variant: FeedCardVariant;
  onNotInterested?: () => void;
};

function largeCardDefaultContentSrc(appearance: FeedCardAppearance): string {
  return appearance === "light"
    ? "/resource/special_card/small_light.png"
    : "/resource/special_card/custom_content_default_dark.png";
}

/** 小卡 background 默认图 @3x：1170×2283（390×761 @1x） */
const SMALL_CARD_BACKGROUND_ASPECT = 2283 / 1170;

function smallCardDefaultBackgroundSrc(appearance: FeedCardAppearance): string {
  return appearance === "light"
    ? "/resource/special_card/small_light1.png"
    : "/resource/special_card/small_dark1.png";
}

/** 无卡 background 默认图 @3x：1170×2283（390×761 @1x，与小卡 background 同规格） */
function noneCardDefaultBackgroundSrc(appearance: FeedCardAppearance): string {
  return appearance === "light"
    ? "/resource/special_card/none_light1.png"
    : "/resource/special_card/none_dark1.png";
}

function feedCardDefaultBackgroundSrc(
  type: FeedCardCardType,
  cardAppearance: FeedCardAppearance,
): string | null {
  if (type === "small") return smallCardDefaultBackgroundSrc(cardAppearance);
  if (type === "none") return noneCardDefaultBackgroundSrc(cardAppearance);
  return null;
}

/** 小卡 custom content 默认图 @3x：1074×330 / 1074×333 */
const SMALL_CARD_DARK_CONTENT_ASPECT = 330 / 1074;
const SMALL_CARD_LIGHT_CONTENT_ASPECT = 333 / 1074;

function smallCardDefaultContentSrc(appearance: FeedCardAppearance): string {
  return appearance === "light"
    ? "/resource/special_card/small_light2.png"
    : "/resource/special_card/small_dark2.png";
}

function smallCardDefaultContentAspect(appearance: FeedCardAppearance): number {
  return appearance === "light"
    ? SMALL_CARD_LIGHT_CONTENT_ASPECT
    : SMALL_CARD_DARK_CONTENT_ASPECT;
}

/** 小卡 custom content 2 默认图 @3x：1074×108（358×36 @1x） */
const SMALL_CARD_CONTENT_2_ASPECT = 108 / 1074;

function smallCardDefaultContent2Src(appearance: FeedCardAppearance): string {
  return appearance === "light"
    ? "/resource/special_card/small_light3.png"
    : "/resource/special_card/small_dark3.png";
}

function smallCardDefaultContent2Aspect(_appearance: FeedCardAppearance): number {
  return SMALL_CARD_CONTENT_2_ASPECT;
}

/** 小卡 content 2 ↔ content 1（小卡片）间距 */
const SMALL_CARD_CONTENT_2_ABOVE_CONTENT_1_GAP_PX = 12;

/** Custom content 上传区尺寸说明（固定文案，不随图片实测变化） */
const FEED_CARD_CUSTOM_CONTENT_SIZE_HINT = "Size: W * H = 358 * H, @ 3x";

/** 无卡 Button color「Custom」预览：固定 mesh 炫彩底，不与下方自定义色值联动 */
const FEED_CARD_CUSTOM_BUTTON_PREVIEW_BASE = "#ff2a88";
const FEED_CARD_CUSTOM_BUTTON_PREVIEW_GRADIENT = [
  "radial-gradient(ellipse 62% 58% at 50% 48%, rgba(210, 95, 255, 0.48) 0%, transparent 46%)",
  "radial-gradient(ellipse 68% 72% at 70% 20%, rgba(185, 90, 255, 0.36) 0%, transparent 50%)",
  "radial-gradient(ellipse 50% 48% at 0% 100%, #c858ff 0%, transparent 38%)",
  "radial-gradient(ellipse 72% 80% at 0% 70%, rgba(255, 55, 70, 0.38) 0%, transparent 48%)",
  "radial-gradient(ellipse 78% 72% at 24% 52%, #ffb830 0%, transparent 54%)",
  "radial-gradient(ellipse 130% 110% at 0% 0%, #ff6850 0%, transparent 58%)",
  "radial-gradient(ellipse 120% 100% at 100% 0%, #00f0ff 0%, transparent 56%)",
  "radial-gradient(ellipse 115% 95% at 42% 58%, #ffd800 0%, transparent 58%)",
  "radial-gradient(ellipse 120% 105% at 0% 100%, #ff5020 0%, transparent 58%)",
  "radial-gradient(ellipse 115% 100% at 100% 100%, #f028ff 0%, transparent 56%)",
  "radial-gradient(ellipse 100% 90% at 72% 32%, #3080ff 0%, transparent 52%)",
  "radial-gradient(ellipse 95% 88% at 28% 42%, #ff9a50 0%, transparent 54%)",
  "radial-gradient(ellipse 85% 80% at 55% 18%, #fe2c55 0%, transparent 46%)",
].join(", ");

/** 下滑引导：底边 16px + 图标高 20px；小卡按钮与其顶边固定间距 24px */
const FEED_CARD_SWIPE_INDICATOR_BOTTOM_PX = 16;
const FEED_CARD_SWIPE_INDICATOR_SIZE_PX = 20;
const SMALL_CARD_BUTTONS_ABOVE_SWIPE_GAP_PX = 24;
const SMALL_CARD_ACTION_BUTTON_HEIGHT_PX = 52;
const SMALL_CARD_ACTION_BUTTONS_BOTTOM_PX =
  FEED_CARD_SWIPE_INDICATOR_BOTTOM_PX +
  FEED_CARD_SWIPE_INDICATOR_SIZE_PX +
  SMALL_CARD_BUTTONS_ABOVE_SWIPE_GAP_PX;
/** 小卡业务图区域高度限制（px） */
const SMALL_CARD_CONTENT_MIN_HEIGHT_PX = 100;
const SMALL_CARD_CONTENT_MAX_HEIGHT_PX = 240;
/** 小卡 / 大卡 custom content 圆角（iOS 平滑圆角见 `data-electron-smooth-corner`） */
const SMALL_CARD_CONTENT_BORDER_RADIUS_PX = 18;
const LARGE_CARD_CONTENT_BORDER_RADIUS_PX = 40;

/** 小卡业务卡片底边 ↔ 按钮顶边 */
const SMALL_CARD_CONTENT_ABOVE_BUTTONS_GAP_PX = 16;
const SMALL_CARD_CONTENT_BOTTOM_PX =
  SMALL_CARD_ACTION_BUTTONS_BOTTOM_PX +
  SMALL_CARD_ACTION_BUTTON_HEIGHT_PX +
  SMALL_CARD_CONTENT_ABOVE_BUTTONS_GAP_PX;

/** dark 大卡透明卡片：UI/Shape/Neutral 4（`UIShapeNeutral4`），无描边 */
function largeCardDarkGlassStyle(): CSSProperties {
  return {
    backgroundColor: getColorCSSVar("UIShapeNeutral4"),
  };
}

/** 小卡 custom content 衬底：light 白卡（`UIShapeNeutral`），dark 透明卡（`UIShapeNeutral4`） */
function smallCardContentBackingStyle(appearance: FeedCardAppearance): CSSProperties {
  return appearance === "dark"
    ? largeCardDarkGlassStyle()
    : { backgroundColor: getColorCSSVar("UIShapeNeutral") };
}

function FeedCardGradientBackground({
  presetId,
}: {
  presetId: FeedCardBackgroundPresetId;
}) {
  const customStops = useFeedCardCustomStops();
  
  // 优先使用 customStops 进行渲染，以实现实时预览
  const basePreset = getFeedCardBackgroundPreset(presetId);
  const preset = {
    ...basePreset,
    stops: customStops
  };
  
  const backgroundStyle = feedCardBackgroundStyle(preset, false);

  return (
    <div
      className="absolute inset-0"
      style={backgroundStyle}
      aria-hidden
    />
  );
}

function FeedCardImageBackground({ src }: { src: string }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      aria-hidden
    />
  );
}

function loadBusinessCustomImageFile(
  file: File,
  onReady: (dataUrl: string, aspect: number) => void,
) {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result !== "string") return;
    const dataUrl = reader.result;
    const probe = new Image();
    probe.onload = () => {
      const aspect =
        probe.naturalWidth > 0
          ? probe.naturalHeight / probe.naturalWidth
          : 1;
      onReady(dataUrl, aspect);
    };
    probe.onerror = () => onReady(dataUrl, 1);
    probe.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

/** 小卡单块 custom content（宽铺满，高度 clamp 100–240，cover 裁切） */
function SmallCardCustomContentBlock({
  appearance,
  customImage,
  customAspect,
  defaultSrc,
  defaultAspect,
  showContentBacking = true,
}: {
  appearance: FeedCardAppearance;
  customImage: string | null;
  customAspect: number | null;
  defaultSrc: string;
  defaultAspect: number;
  /** content 1 需白卡/透明卡衬底；content 2 仅展示图片 */
  showContentBacking?: boolean;
}) {
  let heightOverWidth = defaultAspect;
  if (customImage && customAspect && customAspect > 0) {
    heightOverWidth = customAspect;
  }
  const widthOverHeight = 1 / heightOverWidth;
  const contentSrc = customImage ?? defaultSrc;

  // content 2：宽铺满（父级 inset-x-4），高等比完整展示，无衬底
  if (!showContentBacking) {
    return (
      <div
        data-electron-smooth-corner=""
        className="relative w-full shrink-0 overflow-hidden"
        style={{ borderRadius: SMALL_CARD_CONTENT_BORDER_RADIUS_PX }}
      >
        <img
          src={contentSrc}
          alt=""
          className="block h-auto w-full max-w-full"
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div
      data-electron-smooth-corner=""
      className="relative w-full shrink-0 overflow-hidden"
      style={{
        borderRadius: SMALL_CARD_CONTENT_BORDER_RADIUS_PX,
        aspectRatio: `${widthOverHeight}`,
        minHeight: SMALL_CARD_CONTENT_MIN_HEIGHT_PX,
        maxHeight: SMALL_CARD_CONTENT_MAX_HEIGHT_PX,
      }}
    >
      {showContentBacking ? (
        <div
          className="absolute inset-0 pointer-events-none"
          style={smallCardContentBackingStyle(appearance)}
          aria-hidden
        />
      ) : null}
      <img
        src={contentSrc}
        alt=""
        className="relative block h-full w-full object-cover"
        draggable={false}
      />
    </div>
  );
}

/** 三种卡片骨架占位（基础 ui 后续会替换） */
function FeedCardSkeleton({
  cardType,
  appearance,
  businessCustomImage,
  businessCustomAspect,
}: {
  cardType: FeedCardCardType;
  appearance: FeedCardAppearance;
  businessCustomImage: string | null;
  businessCustomAspect: number | null;
}) {
  if (cardType === "none") return null;

  if (cardType === "small") {
    return (
      <SmallCardCustomContentBlock
        appearance={appearance}
        customImage={businessCustomImage}
        customAspect={businessCustomAspect}
        defaultSrc={smallCardDefaultContentSrc(appearance)}
        defaultAspect={smallCardDefaultContentAspect(appearance)}
      />
    );
  }

  // large：由 custom content 图决定尺寸——宽铺满（父级 inset-x-4），高等比，卡片高度贴合图片
  void businessCustomAspect;
  const contentSrc = businessCustomImage ?? largeCardDefaultContentSrc(appearance);
  return (
    <div
      data-electron-smooth-corner=""
      className="relative w-full shrink-0 overflow-hidden"
      style={{ borderRadius: LARGE_CARD_CONTENT_BORDER_RADIUS_PX }}
    >
      {appearance === "dark" ? (
        <div
          className="absolute inset-0 pointer-events-none"
          style={largeCardDarkGlassStyle()}
          aria-hidden
        />
      ) : null}
      <img
        src={contentSrc}
        alt=""
        className="relative block w-full h-auto max-w-full"
        draggable={false}
      />
    </div>
  );
}

function useAdaptiveButtonText(text: string, buttonWidth: number = 176) {
  const PADDING = 24;
  const AVAILABLE_WIDTH = buttonWidth - PADDING;
  
  const fontSizes = [14, 16];
  const fontWidthRatio = 0.55;
  
  const result = useMemo(() => {
    let fontSize = fontSizes[0];
    let displayText = text;
    let truncated = false;
    
    const minWidth = fontSizes[0] * fontWidthRatio;
    const maxChars = Math.floor(AVAILABLE_WIDTH / minWidth) - 3;
    
    if (text.length > maxChars) {
      displayText = text.slice(0, maxChars) + "...";
      truncated = true;
    }
    
    for (let i = fontSizes.length - 1; i >= 0; i--) {
      const size = fontSizes[i];
      const textWidth = (truncated ? displayText.length : text.length) * size * fontWidthRatio;
      if (textWidth <= AVAILABLE_WIDTH) {
        fontSize = size;
        break;
      }
    }
    
    return { fontSize, displayText, truncated };
  }, [text, buttonWidth]);
  
  return result;
}

function feedCardActionButtonColor(value: string): TColorWithToken {
  return value as TColorWithToken;
}

/** 底部 CTA（Not interested / Main Action）— 带 text 的 TUXButton 须 smoothRadius */
function FeedCardActionButton({
  text,
  backgroundColor,
  textColor,
  onClick,
}: {
  text: string;
  backgroundColor: string;
  textColor: string;
  onClick?: () => void;
}) {
  return (
    <div className="min-w-0 flex-1">
      <TUXButton
        text={text}
        smoothRadius
        block
        shapePreset="capsule"
        sizePreset="large"
        height={`${SMALL_CARD_ACTION_BUTTON_HEIGHT_PX}px`}
        backgroundColor={feedCardActionButtonColor(backgroundColor)}
        textColor={feedCardActionButtonColor(textColor)}
        onClick={onClick}
      />
    </div>
  );
}

/** For You 异形推荐卡（非 `FeedItemCard`） */
export function FeedCard({ variant: _variant, onNotInterested }: FeedCardProps) {
  void _variant;
  const backgroundPresetId = useFeedCardBackgroundPresetId();
  const cardType = useFeedCardCardType();
  const appearance = useFeedCardAppearance();
  const backgroundSource = useFeedCardBackgroundSource();
  const customBackgroundImage = useFeedCardCustomBackgroundImage();
  const businessCustomImage = useFeedCardBusinessCustomImage();
  const businessCustomAspect = useFeedCardBusinessCustomAspect();
  const businessCustomImage2 = useFeedCardBusinessCustomImage2();
  const businessCustomAspect2 = useFeedCardBusinessCustomAspect2();
  const mainButtonColor = useFeedCardMainButtonColor();
  const mainButtonText = useFeedCardMainButtonText();
  const mainButtonCustomBackgroundHex = useFeedCardMainButtonCustomBackgroundHex();
  const mainButtonCustomTextColor = useFeedCardMainButtonCustomTextColor();
  
  const secondaryButtonText = "Not interested";
  const buttonWidth = 176;
  
  const secondaryAdaptive = useAdaptiveButtonText(secondaryButtonText, buttonWidth);
  const mainAdaptive = useAdaptiveButtonText(mainButtonText, buttonWidth);
  
  // 当 cardType 或 appearance 变化时，同步到背景配置
  useEffect(() => {
    setFeedCardBackgroundVariant(cardType, appearance);
  }, [cardType, appearance]);

  // 当选择新的预设时，同步整组 stops（含 position）
  const prevPresetIdRef = useRef<FeedCardBackgroundPresetId | null>(null);
  useEffect(() => {
    if (prevPresetIdRef.current !== backgroundPresetId) {
      const preset = getFeedCardBackgroundPreset(backgroundPresetId);
      setFeedCardCustomStops(preset.stops);
      prevPresetIdRef.current = backgroundPresetId;
    }
  }, [backgroundPresetId]);

  const secondaryColors = getFeedCardSecondaryButtonColors(appearance);
  const mainColors = resolveFeedCardMainButtonColors(
    mainButtonColor,
    appearance,
    cardType === "none" ? mainButtonCustomBackgroundHex : null,
    cardType === "none" ? mainButtonCustomTextColor : null,
  );
  const swipeIndicatorToken = getFeedCardSwipeIndicatorColor(appearance);

  const backgroundImageSrc =
    cardType === "small" || cardType === "none"
      ? customBackgroundImage ?? feedCardDefaultBackgroundSrc(cardType, appearance)
      : backgroundSource === "image" && customBackgroundImage
        ? customBackgroundImage
        : null;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {backgroundImageSrc ? (
        <FeedCardImageBackground src={backgroundImageSrc} />
      ) : (
        <FeedCardGradientBackground presetId={backgroundPresetId} />
      )}

      {cardType === "small" ? (
        <>
          <div
            className="absolute inset-x-4 flex flex-col justify-end items-center"
            style={{
              top: "calc(var(--app-frame-top-inset) + 44px)",
              bottom: `${SMALL_CARD_CONTENT_BOTTOM_PX}px`,
              gap: `${SMALL_CARD_CONTENT_2_ABOVE_CONTENT_1_GAP_PX}px`,
            }}
          >
            <SmallCardCustomContentBlock
              appearance={appearance}
              customImage={businessCustomImage2}
              customAspect={businessCustomAspect2}
              defaultSrc={smallCardDefaultContent2Src(appearance)}
              defaultAspect={smallCardDefaultContent2Aspect(appearance)}
              showContentBacking={false}
            />
            <FeedCardSkeleton
              cardType={cardType}
              appearance={appearance}
              businessCustomImage={businessCustomImage}
              businessCustomAspect={businessCustomAspect}
            />
          </div>
          <div
            className="absolute inset-x-4 flex gap-3"
            style={{
              bottom: `${SMALL_CARD_ACTION_BUTTONS_BOTTOM_PX}px`,
            }}
          >
            <FeedCardActionButton
              text={secondaryAdaptive.displayText}
              backgroundColor={
                typeof secondaryColors.background === "string"
                  ? secondaryColors.background
                  : String(secondaryColors.background)
              }
              textColor={
                typeof secondaryColors.text === "string"
                  ? secondaryColors.text
                  : String(secondaryColors.text)
              }
            />
            <FeedCardActionButton
              text={mainAdaptive.displayText}
              backgroundColor={mainColors.background}
              textColor={mainColors.text}
            />
          </div>
        </>
      ) : cardType === "none" ? (
        <div
          className="absolute inset-x-4 flex gap-3"
          style={{
            bottom: `${SMALL_CARD_ACTION_BUTTONS_BOTTOM_PX}px`,
          }}
        >
          <FeedCardActionButton
            text={secondaryAdaptive.displayText}
            backgroundColor={
              typeof secondaryColors.background === "string"
                ? secondaryColors.background
                : String(secondaryColors.background)
            }
            textColor={
              typeof secondaryColors.text === "string"
                ? secondaryColors.text
                : String(secondaryColors.text)
            }
          />
          <FeedCardActionButton
            text={mainAdaptive.displayText}
            backgroundColor={mainColors.background}
            textColor={mainColors.text}
          />
        </div>
      ) : (
        <div className="absolute inset-x-4 flex flex-col items-center justify-center" style={{ top: "calc(var(--app-frame-top-inset) + 44px)", bottom: "36px" }}>
          <div className="flex flex-col items-center gap-4" style={{ width: "100%" }}>
            <FeedCardSkeleton
              cardType={cardType}
              appearance={appearance}
              businessCustomImage={businessCustomImage}
              businessCustomAspect={businessCustomAspect}
            />
            <div className="flex gap-3" style={{ width: "100%" }}>
              <FeedCardActionButton
                text={secondaryAdaptive.displayText}
                backgroundColor={
                  typeof secondaryColors.background === "string"
                    ? secondaryColors.background
                    : String(secondaryColors.background)
                }
                textColor={
                  typeof secondaryColors.text === "string"
                    ? secondaryColors.text
                    : String(secondaryColors.text)
                }
                onClick={() => onNotInterested?.()}
              />
              <FeedCardActionButton
                text={mainAdaptive.displayText}
                backgroundColor={mainColors.background}
                textColor={mainColors.text}
              />
            </div>
          </div>
        </div>
      )}

      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ bottom: `${FEED_CARD_SWIPE_INDICATOR_BOTTOM_PX}px` }}
      >
        <div className="animate-bounce">
          <IconChevronUpDouble
            width={FEED_CARD_SWIPE_INDICATOR_SIZE_PX}
            height={FEED_CARD_SWIPE_INDICATOR_SIZE_PX}
            style={{ color: getColorCSSVar(swipeIndicatorToken) }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 控制器（一级 + 二级面板）
// ============================================================

// --- 通用：分段控件（Segmented） ---

/** 与 hex 输入、rect 分段控件统一高度 */
const FEED_CARD_COMPACT_CONTROL_HEIGHT_PX = 32;

type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  shape = "pill",
  className,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (next: T) => void;
  ariaLabel?: string;
  /** pill：全圆角胶囊（Card type 等）；rect：圆角矩形（与 hex 输入框一致） */
  shape?: "pill" | "rect";
  className?: string;
}) {
  const radiusClass = shape === "rect" ? "rounded-lg" : "rounded-full";
  const trackHeightPx =
    shape === "rect" ? FEED_CARD_COMPACT_CONTROL_HEIGHT_PX : 32;
  const segmentHeightPx = trackHeightPx - 4;
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`flex items-center p-0.5 box-border ${radiusClass} ${className ?? ""}`.trim()}
      style={{
        height: trackHeightPx,
        backgroundColor: getColorCSSVar("UIShapeNeutral4"),
        border: "1.5px solid transparent",
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`flex items-center justify-center flex-1 px-3 transition-colors outline-none ${radiusClass}`}
            style={{
              height: segmentHeightPx,
              backgroundColor: selected
                ? getColorCSSVar("UIPageFlat1")
                : "transparent",
              boxShadow: "none",
              color: getColorCSSVar(selected ? "UIText1" : "UIText3"),
            }}
          >
            <TUXText typographyPreset="P3-Semibold">{option.label}</TUXText>
          </button>
        );
      })}
    </div>
  );
}

// --- 一级面板（layout） ---

function feedCardMainButtonColorCss(value: string): string {
  return value.startsWith("#") || value.startsWith("rgba")
    ? value
    : getColorCSSVar(value as any);
}

function FeedCardMainButtonColorPicker({
  cardType,
  appearance,
  selected,
  onSelect,
}: {
  cardType: FeedCardCardType;
  appearance: FeedCardAppearance;
  selected: FeedCardMainButtonColor;
  onSelect: (next: FeedCardMainButtonColor) => void;
}) {
  const colors: FeedCardMainButtonColor[] =
    cardType === "small"
      ? ["gray", "white", "red"]
      : cardType === "none"
        ? ["white", "gray", "red", "custom"]
        : ["white", "gray", "red"];
  const labelMap: Record<FeedCardMainButtonColor, string> = {
    red: "Red",
    white: "White",
    gray: "Gray",
    custom: "Custom",
  };
  return (
    <div className="flex items-center gap-2">
      {colors.map((color) => {
        const tokens = getFeedCardMainButtonColors(
          color === "custom" ? "white" : color,
          appearance,
        );
        const isSelected = color === selected;
        return (
          <button
            key={color}
            type="button"
            onClick={() => onSelect(color)}
            aria-pressed={isSelected}
            aria-label={`Main button color ${labelMap[color]}`}
            className="flex flex-col items-center gap-1.5 flex-1"
          >
            <div
                className="w-full h-9 rounded-full flex items-center justify-center"
                style={{
                  ...(color === "custom"
                    ? {
                        backgroundColor: FEED_CARD_CUSTOM_BUTTON_PREVIEW_BASE,
                        backgroundImage: FEED_CARD_CUSTOM_BUTTON_PREVIEW_GRADIENT,
                      }
                    : {
                        backgroundColor:
                          color === "white"
                            ? getColorCSSVar("UIImageOverlayWhite")
                            : color === "gray"
                              ? getColorCSSVar(
                                  appearance === "dark"
                                    ? "UIImageOverlayWhiteA20"
                                    : "UIImageOverlayWhiteA40",
                                )
                              : feedCardMainButtonColorCss(tokens.background),
                      }),
                  border: isSelected
                    ? `2px solid ${getColorCSSVar("UIText1")}`
                    : color === "white"
                      ? "2px solid var(--tux-v2-color-ui-shape-neutral-3)"
                      : "none",
                  boxSizing: "border-box",
                }}
              >
              <TUXText
                typographyPreset="P3-Semibold"
                style={{
                  color:
                    color === "custom"
                      ? getColorCSSVar("UIImageOverlayWhite")
                      : color === "white"
                      ? getColorCSSVar("UIImageOverlayBlack")
                      : color === "gray"
                      ? getColorCSSVar(
                          appearance === "dark"
                            ? "UIImageOverlayWhite"
                            : "UIImageOverlayBlackA50",
                        )
                      : getColorCSSVar("UIImageOverlayWhite"),
                }}
              >
                Aa
              </TUXText>
            </div>
            <TUXText
              typographyPreset="P3-Regular"
              className={
                isSelected ? "text-tux-v2-ui-text-1" : "text-tux-v2-ui-text-3"
              }
            >
              {labelMap[color]}
            </TUXText>
          </button>
        );
      })}
    </div>
  );
}

const FEED_CARD_HEX_INPUT_STYLE: CSSProperties = {
  height: FEED_CARD_COMPACT_CONTROL_HEIGHT_PX,
  borderRadius: 8,
  border: "1.5px solid transparent",
  backgroundColor: getColorCSSVar("UIShapeNeutral4"),
  fontSize: 13,
  flex: 1,
  minWidth: 0,
};

/** 无卡：主按钮自定义颜色（背景 hex + 文字黑/白） */
function FeedCardMainButtonCustomColorFields({
  backgroundHex,
  textColor,
  onBackgroundHexChange,
  onTextColorChange,
}: {
  backgroundHex: string;
  textColor: FeedCardMainButtonCustomTextColor | null;
  onBackgroundHexChange: (value: string) => void;
  onTextColorChange: (value: FeedCardMainButtonCustomTextColor) => void;
}) {
  const backgroundPreview = resolveFeedCardHexColorForPreview(backgroundHex);

  return (
    <div
      className="flex flex-col gap-2 p-2 rounded-xl"
      style={{
        backgroundColor: getColorCSSVar("UIShapeNeutral4"),
        border: "1.5px solid transparent",
      }}
    >
      <div className="flex items-center gap-2">
        <TUXText
          typographyPreset="P3-Regular"
          className="text-tux-v2-ui-text-3 shrink-0 w-24"
        >
          Background
        </TUXText>
        <FeedCardHexColorInput
          value={backgroundHex}
          onChange={onBackgroundHexChange}
          placeholder="FE2C55"
          style={FEED_CARD_HEX_INPUT_STYLE}
        />
        <div
          className="shrink-0 w-6 h-6 rounded-md border border-tux-v2-ui-shape-neutral-3"
          style={{
            backgroundColor:
              backgroundPreview ?? getColorCSSVar("UIShapeNeutral3"),
          }}
          aria-hidden
        />
      </div>
      <div className="flex items-center gap-2">
        <TUXText
          typographyPreset="P3-Regular"
          className="text-tux-v2-ui-text-3 shrink-0 w-24"
        >
          Text color
        </TUXText>
        <SegmentedControl<FeedCardMainButtonCustomTextColor>
          ariaLabel="Main button text color"
          value={textColor ?? "black"}
          onChange={onTextColorChange}
          options={[
            { value: "black", label: "Black" },
            { value: "white", label: "White" },
          ]}
          shape="rect"
          className="flex-1 min-w-0"
        />
      </div>
    </div>
  );
}

function FeedCardCustomContentUploadField({
  previewSrc,
  sizeHint,
  customImage,
  fileInputRef,
  onUploadClick,
  onFileChange,
  onClear,
}: {
  previewSrc: string;
  sizeHint: string;
  customImage: string | null;
  fileInputRef: RefObject<HTMLInputElement>;
  onUploadClick: () => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />
      <button
        type="button"
        onClick={onUploadClick}
        className="flex items-center gap-3 p-2 rounded-xl text-left"
        style={{
          border: "1.5px solid transparent",
          backgroundColor: getColorCSSVar("UIShapeNeutral4"),
        }}
      >
        <div
          className="shrink-0 w-10 h-10 rounded-lg overflow-hidden"
          style={{
            backgroundColor: getColorCSSVar("UIShapeNeutral4"),
            backgroundImage: `url(${customImage ?? previewSrc})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden
        />
        <span className="flex flex-col flex-1 min-w-0">
          <TUXText typographyPreset="P2-Semibold" className="text-tux-v2-ui-text-1">
            {customImage ? "Tap to replace" : "Upload image"}
          </TUXText>
          <TUXText typographyPreset="P3-Regular" className="text-tux-v2-ui-text-3">
            {sizeHint}
          </TUXText>
        </span>
        <IconPlus
          width={16}
          height={16}
          style={{ color: getColorCSSVar("UIText3") }}
        />
      </button>
      {customImage ? (
        <button
          type="button"
          onClick={onClear}
          className="self-start text-tux-v2-ui-text-3"
        >
          <TUXText typographyPreset="P3-Regular">Clear custom image</TUXText>
        </button>
      ) : null}
    </>
  );
}

function FeedCardLayoutPanel({
  onCollapse,
  onOpenBackground,
  stackIndex,
}: {
  onCollapse: () => void;
  onOpenBackground: () => void;
  stackIndex: number;
}) {
  const cardType = useFeedCardCardType();
  const appearance = useFeedCardAppearance();
  const backgroundSource = useFeedCardBackgroundSource();
  const backgroundPresetId = useFeedCardBackgroundPresetId();
  const customStops = useFeedCardCustomStops();
  const customBackgroundImage = useFeedCardCustomBackgroundImage();
  const businessCustomImage = useFeedCardBusinessCustomImage();
  const businessCustomImage2 = useFeedCardBusinessCustomImage2();
  const mainButtonColor = useFeedCardMainButtonColor();
  const mainButtonText = useFeedCardMainButtonText();
  const mainButtonCustomBackgroundHex = useFeedCardMainButtonCustomBackgroundHex();
  const mainButtonCustomTextColor = useFeedCardMainButtonCustomTextColor();
  const usesDefaultBackgroundImage = cardType === "small" || cardType === "none";
  const defaultBackgroundPreviewSrc = feedCardDefaultBackgroundSrc(cardType, appearance);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const businessFileInputRef = useRef<HTMLInputElement>(null);
  const businessFileInput2Ref = useRef<HTMLInputElement>(null);
  const panelScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelScrollRef.current?.scrollTo({ top: 0 });
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // 允许重复选同一文件再次触发 onChange
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFeedCardCustomBackgroundImage(reader.result);
        setFeedCardBackgroundSource("image");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBusinessUploadClick = () => {
    businessFileInputRef.current?.click();
  };

  const handleBusinessFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    loadBusinessCustomImageFile(file, (dataUrl, aspect) => {
      setFeedCardBusinessCustomImage(dataUrl);
      setFeedCardBusinessCustomAspect(aspect);
    });
  };

  const handleBusinessUploadClick2 = () => {
    businessFileInput2Ref.current?.click();
  };

  const handleBusinessFileChange2 = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    loadBusinessCustomImageFile(file, (dataUrl, aspect) => {
      setFeedCardBusinessCustomImage2(dataUrl);
      setFeedCardBusinessCustomAspect2(aspect);
    });
  };

  const businessContent1PreviewSrc =
    cardType === "large"
      ? largeCardDefaultContentSrc(appearance)
      : smallCardDefaultContentSrc(appearance);

  return (
    <AppFrameCornerPanelAnchor side="left" stackIndex={stackIndex}>
      <div
        ref={panelScrollRef}
        className="flex flex-col gap-8 px-3 pt-3 pb-8 rounded-2xl border border-tux-v2-ui-shape-neutral-3 shadow-lg w-80 overflow-y-auto"
        style={{
          marginTop: APP_FRAME_CORNER_TRIGGER_HEIGHT_PX + 8,
          maxHeight: "80vh",
          backgroundColor: getColorCSSVar("UIPageFlat1"),
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <TUXText typographyPreset="P1-Semibold" className="text-tux-v2-ui-text-1">
            Feed card
          </TUXText>
          <TUXIconButton
            icon={<IconChevronCollapse width={14} height={14} />}
            sizePreset="small"
            onClick={onCollapse}
            backgroundColor="UIPageFlat2"
            aria-label="Collapse feed card panel"
          />
        </div>

        {/* 1. 卡片类型 */}
        <section className="flex flex-col gap-2">
          <TUXText typographyPreset="P2-Semibold" className="text-tux-v2-ui-text-2">
            1. Card type
          </TUXText>
          <SegmentedControl<FeedCardCardType>
            ariaLabel="Card type"
            value={cardType}
            onChange={setFeedCardCardType}
            options={[
              { value: "large", label: "大卡模版" },
              { value: "small", label: "小卡模版" },
              { value: "none", label: "无卡模版" },
            ]}
          />
        </section>

        {/* 2. 浅深模式 */}
        <section className="flex flex-col gap-2">
          <TUXText typographyPreset="P2-Semibold" className="text-tux-v2-ui-text-2">
            2. Appearance (card-only)
          </TUXText>
          <SegmentedControl<FeedCardAppearance>
            ariaLabel="Card appearance"
            value={appearance}
            onChange={setFeedCardAppearance}
            options={[
              { value: "dark", label: "Dark" },
              { value: "light", label: "Light" },
            ]}
          />
        </section>

        {/* 3. 背景 */}
        <section className="flex flex-col gap-2">
          <TUXText typographyPreset="P2-Semibold" className="text-tux-v2-ui-text-2">
            3. Background
          </TUXText>

          {cardType === "large" ? (
            <button
              type="button"
              onClick={() => {
                setFeedCardBackgroundSource("preset");
                setFeedCardCustomBackgroundImage(null);
                onOpenBackground();
              }}
              className="flex items-center gap-3 p-2 rounded-xl text-left"
              style={{
                border: backgroundSource === "preset"
                  ? `2px solid ${getColorCSSVar("UIText1")}`
                  : "2px solid transparent",
                backgroundColor: getColorCSSVar("UIShapeNeutral4"),
              }}
            >
              <div
                className="shrink-0 w-10 h-10 rounded-lg overflow-hidden"
                aria-hidden
                style={feedCardBackgroundStyle(
                  {
                    ...getFeedCardBackgroundPreset(backgroundPresetId),
                    stops: customStops,
                  },
                  false,
                  { matchHexStops: true },
                )}
              />
              <span className="flex flex-col flex-1 min-w-0">
                <TUXText typographyPreset="P2-Semibold" className="text-tux-v2-ui-text-1">
                  Recommended gradient
                </TUXText>
              </span>
              <IconChevronRightLTR
                width={16}
                height={16}
                style={{ color: getColorCSSVar("UIText3") }}
              />
            </button>
          ) : null}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={handleUploadClick}
            className="flex items-center gap-3 p-2 rounded-xl text-left"
            style={{
              border:
                usesDefaultBackgroundImage
                  ? "1.5px solid transparent"
                  : backgroundSource === "image"
                    ? `2px solid ${getColorCSSVar("UIText1")}`
                    : "2px solid transparent",
              backgroundColor: getColorCSSVar("UIShapeNeutral4"),
            }}
          >
            <div
              className="shrink-0 w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center"
              style={{
                backgroundColor: getColorCSSVar("UIShapeNeutral4"),
                backgroundImage: `url(${
                  customBackgroundImage ?? defaultBackgroundPreviewSrc ?? ""
                })`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              aria-hidden
            >
              {!usesDefaultBackgroundImage && !customBackgroundImage ? (
                <IconImage
                  width={18}
                  height={18}
                  style={{ color: getColorCSSVar("UIText3") }}
                />
              ) : null}
            </div>
            <span className="flex flex-col flex-1 min-w-0">
              <TUXText typographyPreset="P2-Semibold" className="text-tux-v2-ui-text-1">
                {usesDefaultBackgroundImage
                  ? customBackgroundImage
                    ? "Tap to replace"
                    : "Upload image"
                  : "Custom image"}
              </TUXText>
              <TUXText typographyPreset="P3-Regular" className="text-tux-v2-ui-text-3">
                {usesDefaultBackgroundImage
                  ? `Size: W * H = 390 * ${Math.round(390 * SMALL_CARD_BACKGROUND_ASPECT)}, @ 3x`
                  : "Size: W * H = 390 * 761, @ 3x"}
              </TUXText>
            </span>
            <IconPlus
              width={16}
              height={16}
              style={{ color: getColorCSSVar("UIText3") }}
            />
          </button>

          {customBackgroundImage ? (
            <button
              type="button"
              onClick={() => setFeedCardCustomBackgroundImage(null)}
              className="self-start text-tux-v2-ui-text-3"
            >
              <TUXText typographyPreset="P3-Regular">Clear custom image</TUXText>
            </button>
          ) : null}
        </section>

        {/* 4. 主行动按钮 */}
        <section className="flex flex-col gap-2">
          <TUXText typographyPreset="P2-Semibold" className="text-tux-v2-ui-text-2">
            4. Main action button
          </TUXText>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <TUXText typographyPreset="P3-Regular" className="text-tux-v2-ui-text-3">
                Button color
              </TUXText>
              <FeedCardMainButtonColorPicker
                cardType={cardType}
                appearance={appearance}
                selected={mainButtonColor}
                onSelect={setFeedCardMainButtonColor}
              />
              {cardType === "none" && mainButtonColor === "custom" ? (
                <FeedCardMainButtonCustomColorFields
                  backgroundHex={mainButtonCustomBackgroundHex}
                  textColor={mainButtonCustomTextColor}
                  onBackgroundHexChange={setFeedCardMainButtonCustomBackgroundHex}
                  onTextColorChange={setFeedCardMainButtonCustomTextColor}
                />
              ) : null}
            </div>
            <div className="flex flex-col gap-1">
              <TUXText typographyPreset="P3-Regular" className="text-tux-v2-ui-text-3">
                Button text
              </TUXText>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={mainButtonText}
                  onChange={(event) => setFeedCardMainButtonText(event.target.value)}
                  placeholder="Main Action"
                  className="flex-1"
                  style={{
                    height: 32,
                    borderRadius: 8,
                    border: "1.5px solid transparent",
                    backgroundColor: getColorCSSVar("UIShapeNeutral4"),
                    color: getColorCSSVar("UIText1"),
                    padding: "0 10px",
                    fontSize: 13,
                  }}
                />
                <button
                  type="button"
                  onClick={resetFeedCardMainButtonText}
                  className="text-tux-v2-ui-text-3 px-2"
                >
                  <TUXText typographyPreset="P3-Regular">Reset</TUXText>
                </button>
              </div>
            </div>
          </div>
        </section>

        {cardType !== "none" ? (
          <section className="flex flex-col gap-2">
            <TUXText typographyPreset="P2-Semibold" className="text-tux-v2-ui-text-2">
              {cardType === "small" ? "5. Custom content 1" : "5. Custom content"}
            </TUXText>
            <FeedCardCustomContentUploadField
              previewSrc={businessContent1PreviewSrc}
              sizeHint={FEED_CARD_CUSTOM_CONTENT_SIZE_HINT}
              customImage={businessCustomImage}
              fileInputRef={businessFileInputRef}
              onUploadClick={handleBusinessUploadClick}
              onFileChange={handleBusinessFileChange}
              onClear={() => {
                setFeedCardBusinessCustomImage(null);
                setFeedCardBusinessCustomAspect(null);
              }}
            />
          </section>
        ) : null}

        {cardType === "small" ? (
          <section className="flex flex-col gap-2">
            <TUXText typographyPreset="P2-Semibold" className="text-tux-v2-ui-text-2">
              6. Custom content 2
            </TUXText>
            <FeedCardCustomContentUploadField
              previewSrc={smallCardDefaultContent2Src(appearance)}
              sizeHint={FEED_CARD_CUSTOM_CONTENT_SIZE_HINT}
              customImage={businessCustomImage2}
              fileInputRef={businessFileInput2Ref}
              onUploadClick={handleBusinessUploadClick2}
              onFileChange={handleBusinessFileChange2}
              onClear={() => {
                setFeedCardBusinessCustomImage2(null);
                setFeedCardBusinessCustomAspect2(null);
              }}
            />
          </section>
        ) : null}
      </div>
    </AppFrameCornerPanelAnchor>
  );
}

// --- 二级面板（背景渐变） ---

function FeedCardBackgroundPanel({
  onBack,
  stackIndex,
}: {
  onBack: () => void;
  stackIndex: number;
}) {
  const selectedId = useFeedCardBackgroundPresetId();
  const customStops = useFeedCardCustomStops();

  return (
    <AppFrameCornerPanelAnchor side="left" stackIndex={stackIndex}>
      <div
        className="flex flex-col rounded-2xl border border-tux-v2-ui-shape-neutral-3 shadow-lg w-80"
        style={{
          marginTop: APP_FRAME_CORNER_TRIGGER_HEIGHT_PX + 8,
          maxHeight: "80vh",
          minHeight: 0,
          backgroundColor: getColorCSSVar("UIPageFlat1"),
        }}
      >
        <div className="sticky top-0 z-10 flex items-center gap-2 px-3 py-3 bg-tux-v2-ui-page-flat-1 rounded-t-2xl">
          <TUXIconButton
            icon={<IconChevronLeftLTR width={14} height={14} />}
            sizePreset="small"
            onClick={onBack}
            backgroundColor="UIPageFlat2"
            aria-label="Back to feed card panel"
          />
          <TUXText typographyPreset="P1-Semibold" className="text-tux-v2-ui-text-1">
            Recommended gradients
          </TUXText>
        </div>

        <div className="flex flex-col gap-4 p-3 overflow-y-auto" style={{ maxHeight: "calc(80vh - 56px)" }}>
          {FEED_CARD_BACKGROUND_FAMILY_GROUPS.map((group) => (
            <section key={group.id} className="flex flex-col gap-2">
              <TUXText typographyPreset="P2-Semibold" className="text-tux-v2-ui-text-2">
                {group.cnLabel}
              </TUXText>

              {group.presetIds.map((presetId) => {
                const preset = getFeedCardBackgroundPreset(presetId);
                const isSelected = selectedId === presetId;
                const previewStops = isSelected ? customStops : preset.stops;
                const previewPreset = {
                  ...preset,
                  stops: previewStops.map((stop) => {
                    const color =
                      resolveFeedCardStopColorForRender(stop.color) ?? stop.color;
                    return { ...stop, color };
                  }),
                };
                const previewStyle = feedCardBackgroundStyle(previewPreset, false, {
                  matchHexStops: true,
                });
                
                return (
                  <div
                    key={presetId}
                    className="flex flex-col rounded-xl transition-colors"
                    style={{
                      borderWidth: "2px",
                      borderStyle: "solid",
                      borderColor: isSelected 
                        ? getColorCSSVar("UIText1")
                        : getColorCSSVar("UIShapeNeutral3"),
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setFeedCardBackgroundPresetId(presetId);
                        setFeedCardBackgroundSource("preset");
                      }}
                      className="flex items-center gap-3 p-2 w-full text-left transition-colors"
                      aria-pressed={isSelected}
                    >
                      <div className="shrink-0 w-8 h-12 rounded-lg border border-tux-v2-ui-shape-neutral-3 overflow-hidden">
                        <div className="w-full h-full" style={previewStyle} aria-hidden />
                      </div>
                      <span className="flex flex-col min-w-0 flex-1">
                        <TUXText typographyPreset="P2-Semibold" className="text-tux-v2-ui-text-1">
                          {preset.name}
                        </TUXText>
                        <TUXText
                          typographyPreset="P3-Regular"
                          className="truncate text-tux-v2-ui-text-3"
                        >
                          {preset.mode}
                        </TUXText>
                      </span>
                    </button>

                    {/* 编辑面板 - 选中时自动展开 */}
                    {isSelected ? (
                      <div className="flex flex-col gap-2 px-2 pb-2">
                        {customStops.map((stop, index) => {
                          const stopColorPreview =
                            resolveFeedCardStopColorForRender(stop.color) ??
                            getColorCSSVar("UIShapeNeutral3");

                          return (
                            <div key={`${stop.position}-${index}`} className="flex items-center gap-2">
                              <div
                                className="shrink-0 w-6 h-6 rounded-md border border-tux-v2-ui-shape-neutral-3"
                                style={{ backgroundColor: stopColorPreview }}
                                aria-hidden
                              />
                              <TUXText
                                typographyPreset="P3-Regular"
                                className="shrink-0 w-12 text-tux-v2-ui-text-3 tabular-nums"
                              >
                                {formatFeedCardStopPosition(stop.position)}
                              </TUXText>
                              <FeedCardHexColorInput
                                value={stop.color}
                                onChange={(newColor) => {
                                  setFeedCardCustomStops(
                                    customStops.map((s, i) =>
                                      i === index ? { ...s, color: newColor } : s,
                                    ),
                                  );
                                }}
                                className="flex-1 font-mono"
                                style={{
                                  height: 28,
                                  borderRadius: 8,
                                  border: `0.5px solid ${getColorCSSVar("UIShapeNeutral3")}`,
                                  backgroundColor: getColorCSSVar("UIPageFlat2"),
                                  fontSize: 12,
                                }}
                              />
                            </div>
                          );
                        })}

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setFeedCardCustomStops(preset.stops);
                            }}
                            className="flex flex-1 items-center justify-center gap-2 h-8 rounded-lg"
                            style={{
                              backgroundColor: getColorCSSVar("UIShapeNeutral4"),
                            }}
                          >
                            <TUXText typographyPreset="P3-Semibold" className="text-tux-v2-ui-text-1">
                              Reset to default
                            </TUXText>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFeedCardCustomStops(
                                flipFeedCardBackgroundStopsVertical(customStops),
                              );
                            }}
                            className="flex flex-1 items-center justify-center gap-2 h-8 rounded-lg"
                            style={{
                              backgroundColor: getColorCSSVar("UIShapeNeutral4"),
                            }}
                          >
                            <TUXText typographyPreset="P3-Semibold" className="text-tux-v2-ui-text-1">
                              Vertical flip
                            </TUXText>
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      </div>
    </AppFrameCornerPanelAnchor>
  );
}

// --- 入口（胶囊触发器 + 一级 / 二级切换）---

type DebugView = "collapsed" | "layout" | "background";

export type FeedCardDebugControlsProps = {
  visible?: boolean;
  stackBelowCommentExperiment?: boolean;
};

/** 异形卡左上角「Feed card」配置入口 */
export function FeedCardDebugControls({
  visible = true,
  stackBelowCommentExperiment = false,
}: FeedCardDebugControlsProps) {
  const { isOpen: isCommentPanelOpen } = useCommentPanelVisualStore();
  const [view, setView] = useState<DebugView>("collapsed");
  const stackIndex = stackBelowCommentExperiment ? 1 : 0;

  if (!visible) return null;

  const capsule = (
    <AppFrameCornerCapsuleTrigger
      side="left"
      stackIndex={stackIndex}
      visible={!isCommentPanelOpen}
      text="Feed card"
      leadingIcon={
        <IconGearFill className="text-tux-v2-ui-text-1" width={16} height={16} />
      }
      onClick={() =>
        setView((prev) => {
          if (prev === "collapsed") return "layout";
          return "collapsed";
        })
      }
      aria-label={
        view === "collapsed"
          ? "Open feed card settings"
          : "Collapse feed card settings"
      }
    />
  );

  if (view === "collapsed") return capsule;

  return (
    <>
      {capsule}
      {view === "layout" ? (
        <FeedCardLayoutPanel
          key="feed-card-layout-panel"
          stackIndex={stackIndex}
          onCollapse={() => setView("collapsed")}
          onOpenBackground={() => setView("background")}
        />
      ) : (
        <FeedCardBackgroundPanel
          stackIndex={stackIndex}
          onBack={() => setView("layout")}
        />
      )}
    </>
  );
}
