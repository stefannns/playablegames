import { useState, useEffect } from "react";

// 隐藏滚动条的样式
const scrollbarHideStyle = `
  .template-scroll-container::-webkit-scrollbar {
    display: none;
  }
  .template-scroll-container::-webkit-scrollbar-track {
    display: none;
  }
  .template-scroll-container::-webkit-scrollbar-thumb {
    display: none;
  }
`;

import { IconMusicNoteSAlt } from "@byted-tiktok/tux-icons";
import { TUXButton, TUXNavBar, getColorCSSVar } from "@byted-tiktok/tux-web";

import { AppNavBarBackButton } from "../../components/sys/app_nav_bar_back_button";
import { useAppFrame } from "../../components/sys/app_frame";
import { useEditMusicPanelChrome } from "../edit/components/music_panel/use_edit_music_panel_chrome";
import { useAppNavigation } from "../../context/app_navigation";
import {
  CREATION_BOTTOM_CTA_BUTTON_HEIGHT,
  CreationBottomCtaRow,
  CreationBottomCtaShell,
  CreationBottomCtaSlot,
} from "../creation/components/creation_bottom_cta";
import { creationSecondaryPaths } from "../creation/creation_secondary_paths";
import { postPublishPaths } from "../creation/post_publish/post_publish_paths";
import { queuePostPublishSeed } from "../creation/post_publish/post_publish_store";
import { localAvatarUrlForDisplay } from "../../utils/local_avatar";
import { TextToImageTemplate } from "./TextToImageTemplate";
import {
  TEXT_TO_IMAGE_SCREEN_HORIZONTAL_INSET,
  textToImageCardScrollStyle,
  textToImageScreenPaddingStyle,
} from "./text_to_image_layout";

const TEMPLATE_IDS = [1, 2, 3, 4, 5, 6, 7];

function YourStoryLeadingAvatar() {
  return (
    <div className="relative h-[28px] w-[28px] shrink-0">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: "1.5px solid transparent",
          background:
            "linear-gradient(135deg, rgba(21, 192, 249, 1) 0%, rgba(32, 213, 236, 1) 48%, rgba(26, 227, 198, 1) 100%)",
        }}
      />
      <img
        src={localAvatarUrlForDisplay(22, 1)}
        alt=""
        aria-hidden="true"
        className="absolute left-[3px] top-[3px] h-[22px] w-[22px] rounded-full object-cover"
      />
    </div>
  );
}

export type TemplateSelectPageProps = {
  onBack?: () => void;
};

export default function TemplateSelectPage({ onBack }: TemplateSelectPageProps) {
  const { navigate } = useAppNavigation();
  const [selectedTemplateId, setSelectedTemplateId] = useState(1);
  const [inputText, setInputText] = useState("");
  const { bottomInsetCss } = useAppFrame();
  const { soundNavProps, musicPanelOverlay } = useEditMusicPanelChrome();

  useEffect(() => {
    const savedText = localStorage.getItem("textToImage_input");
    if (savedText) {
      setInputText(savedText);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("textToImage_selectedTemplateId", String(selectedTemplateId));
  }, [selectedTemplateId]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarHideStyle }} />
      <div
        className="flex h-full min-h-0 w-full flex-col overflow-hidden"
        style={{ backgroundColor: getColorCSSVar("UIPageFlat1") }}
      >
        <div className="shrink-0 pt-app-frame-top">
          <TUXNavBar
            heightPreset={44}
            backgroundOpacity={0}
            showSeparator={false}
            titleAlign="center"
            leading={
              <AppNavBarBackButton
                onBack={() => {
                  if (onBack) {
                    onBack();
                    return;
                  }
                  navigate(creationSecondaryPaths.textToImage());
                }}
              />
            }
            customTitle={
              <button
                type="button"
                aria-label={
                  soundNavProps.soundName
                    ? `Sound: ${soundNavProps.soundName}`
                    : "Add sound"
                }
                className="flex h-11 max-w-[190px] items-center gap-2 rounded-full px-4"
                style={{ backgroundColor: getColorCSSVar("UIShapeNeutral4") }}
                onClick={soundNavProps.onSoundClick}
              >
                <IconMusicNoteSAlt
                  width={20}
                  height={20}
                  color={getColorCSSVar("UIText1")}
                />
                <span
                  className="min-w-0 truncate text-[16px] font-semibold leading-[1.3]"
                  style={{ color: getColorCSSVar("UIText1") }}
                >
                  {soundNavProps.soundName ?? "Add sound"}
                </span>
              </button>
            }
          />
        </div>

        <div
          className="flex min-h-0 flex-1 flex-col overflow-y-auto pt-3 pb-4"
          style={textToImageScreenPaddingStyle}
        >
          {/* 大预览卡片 */}
          <div className="relative w-full shrink-0" style={textToImageCardScrollStyle}>
            <div
              className="absolute inset-0 overflow-hidden rounded-[20px]"
              style={{
                boxShadow: "0px 0px 16px 0px rgba(0, 0, 0, 0.04)",
              }}
            >
              <TextToImageTemplate
                templateId={selectedTemplateId}
                text={inputText}
                className="h-full w-full"
              />
            </div>
            <div
              className="pointer-events-none absolute inset-0 rounded-[20px]"
              style={{
                border: `1px solid ${getColorCSSVar("UIShapeNeutral4")}`,
              }}
            />
          </div>

          <p
            className="mt-[22px] shrink-0 text-[15px] font-medium leading-[18px]"
            style={{ color: getColorCSSVar("UIText2") }}
          >
            Select a style
          </p>

          {/* 模版横滑：与卡片左缘对齐，右侧可滑出屏 */}
          <div
            className="template-scroll-container mt-3 flex shrink-0 touch-pan-x gap-2 overflow-x-auto pb-1"
            style={{
              marginLeft: -TEXT_TO_IMAGE_SCREEN_HORIZONTAL_INSET,
              marginRight: -TEXT_TO_IMAGE_SCREEN_HORIZONTAL_INSET,
              paddingLeft: TEXT_TO_IMAGE_SCREEN_HORIZONTAL_INSET,
              paddingRight: TEXT_TO_IMAGE_SCREEN_HORIZONTAL_INSET,
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {TEMPLATE_IDS.map((templateId) => (
              <button
                key={templateId}
                type="button"
                className="relative h-[72px] w-[54px] shrink-0 overflow-hidden rounded-[8px]"
                onClick={() => setSelectedTemplateId(templateId)}
              >
                <TextToImageTemplate
                  templateId={templateId}
                  text={inputText}
                  className="h-full w-full"
                />
                <div
                  className="pointer-events-none absolute inset-0 rounded-[8px]"
                  style={{
                    border:
                      selectedTemplateId === templateId
                        ? `3px solid ${getColorCSSVar("UIShapePrimary")}`
                        : `1px solid ${getColorCSSVar("UIShapeNeutral4")}`,
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* 底部 CTA */}
        <CreationBottomCtaShell
          bottomInsetCss={bottomInsetCss}
          className="pt-3"
          style={{ background: getColorCSSVar("UIPageFlat1") }}
        >
          <CreationBottomCtaRow>
            <CreationBottomCtaSlot>
              <TUXButton
                text="Your Story"
                themePreset="secondary"
                shapePreset="capsule"
                sizePreset="medium"
                height={CREATION_BOTTOM_CTA_BUTTON_HEIGHT}
                smoothRadius
                block
                leadingIcon={<YourStoryLeadingAvatar />}
              />
            </CreationBottomCtaSlot>
            <CreationBottomCtaSlot>
              <TUXButton
                text="Next"
                themePreset="primary"
                shapePreset="capsule"
                sizePreset="medium"
                height={CREATION_BOTTOM_CTA_BUTTON_HEIGHT}
                smoothRadius
                block
                onClick={() => {
                  localStorage.setItem(
                    "textToImage_selectedTemplateId",
                    String(selectedTemplateId),
                  );
                  queuePostPublishSeed({
                    kind: "text-to-image",
                    templateId: selectedTemplateId,
                    text: localStorage.getItem("textToImage_input") ?? "",
                  });
                  navigate(postPublishPaths.publish("text-to-image"));
                }}
              />
            </CreationBottomCtaSlot>
          </CreationBottomCtaRow>
        </CreationBottomCtaShell>
      </div>
      {musicPanelOverlay}
    </>
  );
}
