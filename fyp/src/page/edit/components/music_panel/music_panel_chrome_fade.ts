import type { CSSProperties } from "react";

/** Match camera effects panel chrome fade (`creation_page` hideOnPanel). */
export const MUSIC_PANEL_CHROME_FADE_MS = 180;

export function musicPanelChromeFadeStyle(faded: boolean): CSSProperties {
  return {
    opacity: faded ? 0 : 1,
    pointerEvents: faded ? "none" : undefined,
    transition: `opacity ${MUSIC_PANEL_CHROME_FADE_MS}ms ease`,
  };
}
