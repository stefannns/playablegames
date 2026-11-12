import {
  TUXButton,
  TUXNavBar,
  TUXNavBarIconAction,
  getColorCSSVar,
} from "@byted-tiktok/tux-web";
import {
  TUXIconArrowUpCircleFill,
  TUXIconFullScreen,
  TUXIconPen,
} from "@byted-tiktok/tux-icons";
import { useMemo } from "react";

import { useAppFrame } from "../../../components/sys/app_frame";
import {
  CREATION_BOTTOM_CTA_BUTTON_HEIGHT,
  CreationBottomCtaRow,
  CreationBottomCtaShell,
  CreationBottomCtaSlot,
} from "../components/creation_bottom_cta";
import { AppNavBarBackButton } from "../../../components/sys/app_nav_bar_back_button";
import { useAppNavigation } from "../../../context/app_navigation";
import { ThemeScope } from "../../../context/theme";
import { PhotoTextFeedBlock } from "../../home/components/photo_text_feed_block";
import { PhotoTextFeedRightRail } from "../../home/components/photo_text_feed_right_rail";
import { creationBackPathForSub } from "../../../routes/app_route_tree";
import { buildPostPublishPreviewFeedContent } from "./post_publish_feed_content";
import { getPostPublishDraft, getPostPublishOrigin } from "./post_publish_store";
import { PostPublishVideoPreviewBlock } from "./post_publish_video_preview_block";
import { PublishOverlayIconInk } from "./publish_icon_ink";

export type PostPublishPreviewPageProps = {
  onBack?: (trigger?: HTMLElement) => void;
};

export default function PostPublishPreviewPage({
  onBack,
}: PostPublishPreviewPageProps = {}) {
  const { navigate } = useAppNavigation();
  const { topInsetCss, bottomInsetCss } = useAppFrame();
  const draft = getPostPublishDraft();
  const isVideoPreview = draft.mode === "video";
  const feedContent = useMemo(
    () => (isVideoPreview ? null : buildPostPublishPreviewFeedContent(draft)),
    [
      isVideoPreview,
      draft.title,
      draft.description,
      draft.mode,
      draft.media.length,
      ...draft.media.map((item) =>
        item.kind === "image"
          ? item.src
          : item.kind === "video"
            ? `${item.src ?? "snapshot"}:${item.posterSrc}`
            : `${item.templateId}:${item.text}`,
      ),
    ],
  );
  const initialImageIndex = Math.max(
    0,
    Math.min(draft.initialPreviewIndex, Math.max(0, draft.media.length - 1)),
  );
  const editSecondaryLabel =
    isVideoPreview || getPostPublishOrigin() === "edit-video"
      ? "Edit video"
      : draft.mode === "photo"
        ? "Edit photo"
        : "Edit";

  const handleBack = (trigger?: HTMLElement) => {
    if (onBack) {
      onBack(trigger);
      return;
    }
    navigate(
      creationBackPathForSub({
        screen: "preview",
        origin: getPostPublishOrigin(),
      }),
    );
  };

  return (
    <ThemeScope
      mode="dark"
      className="relative flex h-full min-h-0 flex-col overflow-hidden bg-tux-v2-brand-tiktok-black"
      style={{ paddingTop: topInsetCss }}
    >
      <TUXNavBar
        heightPreset={44}
        title="Preview"
        backgroundOpacity={0}
        showSeparator={false}
        leading={
          <AppNavBarBackButton
            onBack={(trigger) => handleBack(trigger)}
            iconColor={getColorCSSVar("UIImageOverlayWhite")}
          />
        }
        trailing={
          <TUXNavBarIconAction
            aria-label="Preview actions"
            width="44px"
            height="44px"
            icon={
              <PublishOverlayIconInk>
                <TUXIconFullScreen size={20} />
              </PublishOverlayIconInk>
            }
          />
        }
      />

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {isVideoPreview ? (
          <PostPublishVideoPreviewBlock draft={draft} />
        ) : feedContent ? (
          <PhotoTextFeedBlock
            content={feedContent}
            initialActiveImageIndex={initialImageIndex}
            tabBottomPxOverride={0}
            rightRail={<PhotoTextFeedRightRail content={feedContent} hideCounts />}
          />
        ) : null}
      </div>

      <CreationBottomCtaShell
        bottomInsetCss={bottomInsetCss}
        className="bg-tux-v2-brand-tiktok-black pt-3"
      >
        <CreationBottomCtaRow>
          <CreationBottomCtaSlot>
            <TUXButton
              block
              text={editSecondaryLabel}
              leadingIcon={
                <PublishOverlayIconInk>
                  <TUXIconPen size={20} />
                </PublishOverlayIconInk>
              }
              themePreset="secondary"
              shapePreset="capsule"
              sizePreset="medium"
              height={CREATION_BOTTOM_CTA_BUTTON_HEIGHT}
              smoothRadius
              onClick={(event) => handleBack(event.currentTarget)}
            />
          </CreationBottomCtaSlot>
          <CreationBottomCtaSlot>
            <TUXButton
              block
              text="Post"
              leadingIcon={
                <PublishOverlayIconInk>
                  <TUXIconArrowUpCircleFill size={20} />
                </PublishOverlayIconInk>
              }
              themePreset="primary"
              shapePreset="capsule"
              sizePreset="medium"
              height={CREATION_BOTTOM_CTA_BUTTON_HEIGHT}
              smoothRadius
            />
          </CreationBottomCtaSlot>
        </CreationBottomCtaRow>
      </CreationBottomCtaShell>
    </ThemeScope>
  );
}
