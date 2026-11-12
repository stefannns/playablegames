import type { ReactNode } from "react";

import { PUBLISH_CELL_BG } from "./publish_chrome.constants";

export const PUBLISH_COMPOSER_ICON_BUTTON_SIZE_PX = 32;

export type PublishComposerIconButtonProps = {
  ariaLabel: string;
  children: ReactNode;
  onClick?: () => void;
};

/** 32×32 纯图标按钮 — TUXButton leadingIcon-only 无法居中，用 flex 壳。 */
export function PublishComposerIconButton({
  ariaLabel,
  children,
  onClick,
}: PublishComposerIconButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="inline-flex shrink-0 items-center justify-center rounded-[6px] border-0 p-0"
      style={{
        width: PUBLISH_COMPOSER_ICON_BUTTON_SIZE_PX,
        height: PUBLISH_COMPOSER_ICON_BUTTON_SIZE_PX,
        backgroundColor: PUBLISH_CELL_BG,
      }}
    >
      {children}
    </button>
  );
}
