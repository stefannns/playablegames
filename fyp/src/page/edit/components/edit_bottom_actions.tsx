import { TUXButton, getColorCSSVar } from "@byted-tiktok/tux-web";

import {
  CREATION_BOTTOM_CTA_BUTTON_HEIGHT,
  CREATION_BOTTOM_CTA_HORIZONTAL_PADDING_PX,
  CreationBottomCtaRow,
  CreationBottomCtaSlot,
} from "../../creation/components/creation_bottom_cta";
import { EDIT_TOOLBAR_ASSET_ROOT } from "./edit_chrome.constants.ts";

const STORY_RING_GRADIENT = `linear-gradient(135deg, ${getColorCSSVar("SocialStoryGradientGreen1")} 0%, ${getColorCSSVar("SocialStoryGradientGreen2")} 48%, ${getColorCSSVar("SocialStoryGradientGreen3")} 100%)`;
const STORY_RING_MASK_BLACK = getColorCSSVar("BrandTikTokBlack");

function StoryAvatar() {
  return (
    <span className="relative block size-7 shrink-0">
      <img
        src={`${EDIT_TOOLBAR_ASSET_ROOT}/avatar.png`}
        alt=""
        className="absolute left-[3px] top-[3px] size-[22px] rounded-full object-cover"
      />
      <span
        aria-hidden
        className="absolute inset-0 size-7 rounded-full"
        style={{
          background: STORY_RING_GRADIENT,
          WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - 1.5px), ${STORY_RING_MASK_BLACK} calc(100% - 1.5px))`,
          mask: `radial-gradient(farthest-side, transparent calc(100% - 1.5px), ${STORY_RING_MASK_BLACK} calc(100% - 1.5px))`,
        }}
      />
    </span>
  );
}

export type EditBottomActionsProps = {
  onNext?: () => void;
};

export function EditBottomActions({ onNext }: EditBottomActionsProps = {}) {
  return (
    <div
      className="w-full"
      style={{
        paddingLeft: CREATION_BOTTOM_CTA_HORIZONTAL_PADDING_PX,
        paddingRight: CREATION_BOTTOM_CTA_HORIZONTAL_PADDING_PX,
      }}
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
          leadingIcon={<StoryAvatar />}
          backgroundColor="UIImageOverlayWhite"
          textColor="UIImageOverlayBlack"
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
          onClick={onNext}
        />
      </CreationBottomCtaSlot>
    </CreationBottomCtaRow>
    </div>
  );
}
