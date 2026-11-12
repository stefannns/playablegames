import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import { IconChevronLeftOffsetLTR } from "@byted-tiktok/tux-icons";
import {
  TUXButton,
  TUXNavBar,
  TUXNavBarIconAction,
  getColorCSSVar,
} from "@byted-tiktok/tux-web";

import { useAppFrame } from "../../components/sys/app_frame";
import { useAppNavigation } from "../../context/app_navigation";
import {
  CREATION_BOTTOM_CTA_BUTTON_HEIGHT,
  CreationBottomCtaShell,
} from "../creation/components/creation_bottom_cta";
import { creationSecondaryPaths } from "../creation/creation_secondary_paths";
import {
  TEXT_TO_IMAGE_CARD_HEIGHT,
  TEXT_TO_IMAGE_CARD_HORIZONTAL_INSET,
  TEXT_TO_IMAGE_SCREEN_HORIZONTAL_INSET,
  textToImageCardAspectBoxStyle,
  textToImageScreenPaddingStyle,
} from "./text_to_image_layout";
import {
  KB_OPEN_ANIMATION_MS,
  useSoftKeyboard,
  useSoftKeyboardTextTarget,
} from "../../components/sys/soft_keyboard";

const PLACEHOLDER_TEXT =
  "Share your thoughts or questions to spark discussion";

const LINE_HEIGHT_PX = 20.8;
/** 编辑区最少占两行；内容超出后再增高，不超过卡片可用高度 */
const MIN_COMPOSER_LINES = 2;
const MIN_COMPOSER_HEIGHT_PX = LINE_HEIGHT_PX * MIN_COMPOSER_LINES;

export type TextToImagePageProps = {
  /** Back to creation camera (studio). */
  onBack?: () => void;
};

export default function TextToImagePage({ onBack }: TextToImagePageProps) {
  const { navigate } = useAppNavigation();
  const { close: closeSoftKeyboard } = useSoftKeyboard();
  const [value, setValue] = useState("");
  const [frameHeight, setFrameHeight] = useState<number | null>(null);
  const [cardTop, setCardTop] = useState(166);
  const [cardHeight, setCardHeight] = useState(TEXT_TO_IMAGE_CARD_HEIGHT);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const proceedToTemplatesRef = useRef<() => void>(() => {});

  const { targetRef: textareaRef, onTargetFocus, focusTarget, focusTargetAfterFrame } =
    useSoftKeyboardTextTarget({
      returnKey: "next",
      onSubmit: () => proceedToTemplatesRef.current(),
    });
  const { keyboardOpen, keyboardSurfaceHeight, bottomInsetCss } = useAppFrame();
  const [keyboardSettled, setKeyboardSettled] = useState(false);

  const dismissKeyboard = useCallback(() => {
    closeSoftKeyboard();
    textareaRef.current?.blur();
  }, [closeSoftKeyboard, textareaRef]);

  const proceedToTemplates = useCallback(() => {
    localStorage.setItem("textToImage_input", value);
    dismissKeyboard();
    navigate(creationSecondaryPaths.textToImageTemplates());
  }, [dismissKeyboard, navigate, value]);

  proceedToTemplatesRef.current = proceedToTemplates;

  useEffect(() => () => dismissKeyboard(), [dismissKeyboard]);

  const nextButtonHeight = 40;
  const nextButtonRightInset = 16;
  const nextButtonAboveKeyboardInset = 16;
  const textBoxHorizontalInset = TEXT_TO_IMAGE_CARD_HORIZONTAL_INSET;
  const textBoxVerticalInset = 32;
  const textBoxToNextButtonGap = 12;
  useEffect(() => {
    focusTargetAfterFrame();
  }, [focusTargetAfterFrame]);

  useEffect(() => {
    if (!keyboardOpen) {
      setKeyboardSettled(false);
      return;
    }
    const timer = window.setTimeout(
      () => setKeyboardSettled(true),
      KB_OPEN_ANIMATION_MS,
    );
    return () => window.clearTimeout(timer);
  }, [keyboardOpen]);

  useEffect(() => {
    const frameEl = frameRef.current;
    if (!frameEl) return;
    const update = () => {
      setFrameHeight(frameEl.getBoundingClientRect().height);
      const cardEl = cardRef.current;
      if (cardEl) {
        const cardRect = cardEl.getBoundingClientRect();
        setCardHeight(cardRect.height);
        setCardTop(cardRect.top - frameEl.getBoundingClientRect().top);
      }
    };
    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(frameEl);
    const cardEl = cardRef.current;
    if (cardEl) ro.observe(cardEl);
    return () => ro.disconnect();
  }, []);

  const keyboardTop =
    keyboardOpen && frameHeight != null
      ? frameHeight - keyboardSurfaceHeight
      : null;
  const nextButtonTopInCard =
    keyboardTop != null
      ? Math.max(
          0,
          Math.min(
            cardHeight - nextButtonHeight,
            keyboardTop -
              nextButtonAboveKeyboardInset -
              nextButtonHeight -
              cardTop,
          ),
        )
      : 286;

  const showKeyboardNextButton = keyboardOpen && keyboardSettled;

  /** 键盘落位后再为卡片内 Next 预留底部空间，避免编辑区随按钮位移动画抖动 */
  const composerBottomReserve = showKeyboardNextButton
    ? Math.max(
        textBoxVerticalInset,
        cardHeight - nextButtonTopInCard + textBoxToNextButtonGap,
      )
    : textBoxVerticalInset;

  const composerLayerStyle: CSSProperties = {
    left: textBoxHorizontalInset,
    right: textBoxHorizontalInset,
    top: textBoxVerticalInset,
    bottom: composerBottomReserve,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
  };

  const composerMaxHeight = Math.max(
    MIN_COMPOSER_HEIGHT_PX,
    cardHeight - textBoxVerticalInset - composerBottomReserve,
  );

  const syncTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = `${MIN_COMPOSER_HEIGHT_PX}px`;
    const measured = Math.max(el.scrollHeight, MIN_COMPOSER_HEIGHT_PX);
    el.style.height = `${Math.min(measured, composerMaxHeight)}px`;
  }, [composerMaxHeight]);

  useEffect(() => {
    syncTextareaHeight();
  }, [syncTextareaHeight]);

  return (
    <div
      ref={frameRef}
      className="relative flex h-full min-h-0 w-full flex-col overflow-hidden"
      style={{
        // grouped1 做底色，点阵纹理用 token 化的 CSS 点阵叠加（替换原烤死的浅色
        // background.png），底色与点都随明暗主题自适配。间距 19px、点色
        // UIShapeNeutral4 均按原图实测还原。
        backgroundColor: getColorCSSVar("UIPageGrouped1"),
        backgroundImage: `radial-gradient(${getColorCSSVar("UIShapeNeutral4")} 1px, transparent 1px)`,
        backgroundSize: "19px 19px",
      }}
    >
      <div className="relative z-10 shrink-0 pt-app-frame-top">
        <TUXNavBar
          heightPreset={44}
          backgroundOpacity={0}
          showSeparator={false}
          leading={
            <TUXNavBarIconAction
              aria-label="Back"
              width="44px"
              height="44px"
              icon={
                <IconChevronLeftOffsetLTR
                  width={24}
                  height={24}
                  color="var(--tux-v2-color-ui-text-1)"
                />
              }
              onClick={() => {
                dismissKeyboard();
                if (onBack) {
                  onBack();
                  return;
                }
                navigate(creationSecondaryPaths.studio());
              }}
            />
          }
        />
      </div>

      <h1
        className="relative z-10 shrink-0 pb-3 text-center text-[17px] font-bold leading-[22px]"
        style={{
          ...textToImageScreenPaddingStyle,
          color: getColorCSSVar("UIText1"),
        }}
      >
        CREATE AN IMAGE OF YOUR TEXT
      </h1>

      <div
        className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden"
        style={textToImageScreenPaddingStyle}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            ref={cardRef}
            className="relative w-full max-h-full shrink-0 cursor-text"
            style={textToImageCardAspectBoxStyle}
            onClick={focusTarget}
          >
          <div
            className="pointer-events-none absolute inset-0 rounded-[24px]"
            style={{
              backgroundColor: getColorCSSVar("UIPageGrouped2"),
              boxShadow: "0px 0px 16px 0px rgba(0, 0, 0, 0.04)",
            }}
          />

          <div
            className="absolute z-1 min-h-0"
            style={{
              ...composerLayerStyle,
              transition:
                "top 400ms cubic-bezier(0.22, 0.61, 0.36, 1), bottom 400ms cubic-bezier(0.22, 0.61, 0.36, 1)",
            }}
          >
            <div className="relative w-full">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                  setValue(e.target.value);
                  requestAnimationFrame(() => syncTextareaHeight());
                }}
                onFocus={onTargetFocus}
                className="block w-full resize-none overflow-x-hidden overflow-y-auto bg-transparent outline-none [-webkit-overflow-scrolling:touch]"
                rows={MIN_COMPOSER_LINES}
                style={{
                  border: "none",
                  padding: 0,
                  margin: 0,
                  minHeight: MIN_COMPOSER_HEIGHT_PX,
                  maxHeight: composerMaxHeight,
                  fontSize: 16,
                  fontWeight: 600,
                  lineHeight: `${LINE_HEIGHT_PX}px`,
                  color: getColorCSSVar("UIText1"),
                  textAlign: "left",
                  caretColor: getColorCSSVar("UIShapePrimary"),
                }}
              />

              {value.length === 0 ? (
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 text-[16px] font-semibold"
                  style={{
                    lineHeight: `${LINE_HEIGHT_PX}px`,
                    color: getColorCSSVar("UITextPlaceholder"),
                  }}
                >
                  {PLACEHOLDER_TEXT}
                </div>
              ) : null}
            </div>
          </div>

          {showKeyboardNextButton ? (
            <div
              data-softkb-keep-open
              className="absolute z-2"
              style={{
                right: nextButtonRightInset,
                top: nextButtonTopInCard,
                opacity: 1,
                transition: "opacity 200ms ease-out",
              }}
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <TUXButton
                text="Next"
                themePreset="primary"
                shapePreset="capsule"
                sizePreset="small"
                smoothRadius
                height="40px"
                paddingInline="26px"
                onClick={proceedToTemplates}
              />
            </div>
          ) : null}
          </div>
        </div>

        <CreationBottomCtaShell
          bottomInsetCss={bottomInsetCss}
          horizontalPaddingPx={TEXT_TO_IMAGE_SCREEN_HORIZONTAL_INSET}
          className="pt-3"
          style={{
            opacity: !keyboardOpen ? 1 : 0,
            pointerEvents: !keyboardOpen ? "auto" : "none",
            transition: "opacity 200ms ease-out",
          }}
        >
          <TUXButton
            text="Next"
            themePreset="primary"
            shapePreset="capsule"
            sizePreset="medium"
            height={CREATION_BOTTOM_CTA_BUTTON_HEIGHT}
            smoothRadius
            block
            onClick={proceedToTemplates}
          />
        </CreationBottomCtaShell>
      </div>
    </div>
  );
}
