import { getColorCSSVar } from "@byted-tiktok/tux-web";

/** Feed / repost / comment overlay text on video (`FeedComponentsTextBackdrop2` @ 50%). */
export const FEED_OVERLAY_BACKDROP = `color-mix(in srgb, ${getColorCSSVar("FeedComponentsTextBackdrop2")} 50%, transparent)`;
export const FEED_OVERLAY_TEXT = getColorCSSVar("UIImageOverlayWhite");
export const FEED_OVERLAY_TEXT_ON_PRIMARY = getColorCSSVar("UIImageOverlayWhite");
