import type { CSSProperties } from "react";

/** 文字转图卡片设计稿画布（与模版 PNG 一致） */
export const TEXT_TO_IMAGE_CARD_WIDTH = 342;
export const TEXT_TO_IMAGE_CARD_HEIGHT = 456;
export const TEXT_TO_IMAGE_CARD_ASPECT_RATIO =
  TEXT_TO_IMAGE_CARD_WIDTH / TEXT_TO_IMAGE_CARD_HEIGHT;

/** 屏幕内容区左右留白；卡片宽度 = 100% − 2×本值，高度按设计稿比例缩放 */
export const TEXT_TO_IMAGE_SCREEN_HORIZONTAL_INSET = 24;

/** 卡片内正文区左右留白：编辑页与模版预览共用 */
export const TEXT_TO_IMAGE_CARD_HORIZONTAL_INSET = 24;

export const TEXT_TO_IMAGE_CARD_CONTENT_WIDTH =
  TEXT_TO_IMAGE_CARD_WIDTH - TEXT_TO_IMAGE_CARD_HORIZONTAL_INSET * 2;

const textToImageCardAspectRatio = `${TEXT_TO_IMAGE_CARD_WIDTH} / ${TEXT_TO_IMAGE_CARD_HEIGHT}`;

/** 可滚动区域内的预览卡：宽度撑满，高度随比例 */
export const textToImageCardScrollStyle: CSSProperties = {
  width: "100%",
  aspectRatio: textToImageCardAspectRatio,
};

/** 定高 flex 区域内的卡片：限制 maxHeight，避免把底部 CTA 顶出屏 */
export const textToImageCardAspectBoxStyle: CSSProperties = {
  width: "100%",
  maxHeight: "100%",
  aspectRatio: textToImageCardAspectRatio,
};

export const textToImageScreenPaddingStyle: CSSProperties = {
  paddingLeft: TEXT_TO_IMAGE_SCREEN_HORIZONTAL_INSET,
  paddingRight: TEXT_TO_IMAGE_SCREEN_HORIZONTAL_INSET,
};
