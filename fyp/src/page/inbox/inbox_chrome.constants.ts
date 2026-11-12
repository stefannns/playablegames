import { getColorCSSVar } from "@byted-tiktok/tux-web";

/** Inbox tab chip — selected pill fill. */
export const INBOX_FILTER_ACTIVE_BG = `color-mix(in srgb, ${getColorCSSVar("InboxFilterHighlight")} 16%, transparent)`;

export const INBOX_FILTER_IDLE_BG = getColorCSSVar("UIShapeNeutral4");

/** Swipe actions on conversation rows. */
export const INBOX_SWIPE_DELETE_BG = getColorCSSVar("UIShapeDanger");
export const INBOX_SWIPE_PIN_BG = getColorCSSVar("SocialRelationInvite");
export const INBOX_SWIPE_ARCHIVE_BG = getColorCSSVar("SearchTakoChatBubble2");
export const INBOX_SWIPE_ICON_COLOR = getColorCSSVar("UIImageOverlayWhite");

/** System / activity leading bubbles on inbox rows. */
export const INBOX_BUBBLE_FOLLOWERS_BG = getColorCSSVar("SocialRelationShare");
export const INBOX_BUBBLE_ACTIVITY_BG = getColorCSSVar("UIShapePrimary");
export const INBOX_BUBBLE_SYSTEM_BG = getColorCSSVar("UIShapeNeutral");
export const INBOX_BUBBLE_ICON_COLOR = getColorCSSVar("UIImageOverlayWhite");

// Story viewer chrome constants moved to `src/page/story/story_chrome.constants.ts`.
