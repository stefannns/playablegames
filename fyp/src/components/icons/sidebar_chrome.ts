import { getColorCSSVar } from "@byted-tiktok/tux-web";

/**
 * 侧栏 leading / chevron 图标色。
 * TUXIcon 的 `color` 只会挂 `text-color-*` class，本仓库未生成该类；
 * 须在外层设 CSS `color`，图标 `fill: currentColor` 才能吃到 token。
 */
export const SIDEBAR_LEADING_ICON_CSS_COLOR = getColorCSSVar("UITextPlaceholder");

export const SIDEBAR_LIST_ICON_SIZE = 16;

export const SIDEBAR_CHEVRON_SIZE = 12;
