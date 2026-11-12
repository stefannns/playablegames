import { TUXButton } from "@byted-tiktok/tux-web";
import { TUXIconArrowUpCircleFill, TUXIconDraft } from "@byted-tiktok/tux-icons";

import {
  CREATION_BOTTOM_CTA_BUTTON_HEIGHT,
  CreationBottomCtaRow,
  CreationBottomCtaShell,
  CreationBottomCtaSlot,
} from "../components/creation_bottom_cta";
import { PublishListIconInk } from "./publish_icon_ink";

export type PublishBottomActionsProps = {
  bottomInsetCss: string;
  /** 输入态时禁用底栏点击（视频发布页遮罩场景）。 */
  disabled?: boolean;
  /** 默认 12；视频发布页 Figma 为 16（px-4）。 */
  horizontalPaddingPx?: number;
  className?: string;
  onDrafts?: () => void;
  onPost?: () => void;
};

export function PublishBottomActions({
  bottomInsetCss,
  disabled = false,
  horizontalPaddingPx,
  className = "bg-tux-v2-ui-page-flat-1 pt-3",
  onDrafts,
  onPost,
}: PublishBottomActionsProps) {
  return (
    <CreationBottomCtaShell
      bottomInsetCss={bottomInsetCss}
      horizontalPaddingPx={horizontalPaddingPx}
      className={`${className}${disabled ? " pointer-events-none" : ""}`.trim()}
      aria-hidden={disabled}
    >
      <CreationBottomCtaRow>
        <CreationBottomCtaSlot>
          <TUXButton
            block
            text="Drafts"
            leadingIcon={
              <PublishListIconInk>
                <TUXIconDraft size={20} />
              </PublishListIconInk>
            }
            themePreset="secondary"
            shapePreset="capsule"
            sizePreset="medium"
            height={CREATION_BOTTOM_CTA_BUTTON_HEIGHT}
            smoothRadius
            onClick={onDrafts}
          />
        </CreationBottomCtaSlot>
        <CreationBottomCtaSlot>
          <TUXButton
            block
            text="Post"
            leadingIcon={<TUXIconArrowUpCircleFill size={20} />}
            themePreset="primary"
            shapePreset="capsule"
            sizePreset="medium"
            height={CREATION_BOTTOM_CTA_BUTTON_HEIGHT}
            smoothRadius
            onClick={onPost}
          />
        </CreationBottomCtaSlot>
      </CreationBottomCtaRow>
    </CreationBottomCtaShell>
  );
}
