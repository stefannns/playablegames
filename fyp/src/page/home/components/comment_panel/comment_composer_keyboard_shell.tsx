import { getColorCSSVar } from "@byted-tiktok/tux-web";
import { type CSSProperties, type ReactNode } from "react";

import { useAppFrame } from "../../../../components/sys/app_frame";
import {
  KB_OPEN_ANIMATION_MS,
  getSoftKeyboardPresentedHeight,
} from "../../../../components/sys/soft_keyboard";
import { getCommentComposerContentHeightPx } from "./comment_text_field.tsx";

/** Gap between composer content and the keyboard suggestion bar (iOS). */
export const COMMENT_COMPOSER_KEYBOARD_GAP_PX = 8;

/** Matches `[data-testid="comment-sheet"]` height transition in `comment_panel.css`. */
export const COMMENT_SHEET_ENTER_MS = 320;

export type CommentComposerKeyboardShellProps = {
  children: ReactNode;
  /** When true, `padding-bottom` = keyboard height + gap; otherwise safe-area only. */
  keyboardLiftActive: boolean;
  className?: string;
  style?: CSSProperties;
};

/**
 * Shared keyboard lift chrome for comment / Friends reply composers.
 * Bottom padding (keyboard + gap) — not margin — so UISheetFlat1 fills the
 * area behind the soft keyboard to the frame bottom.
 */
export function CommentComposerKeyboardShell({
  children,
  keyboardLiftActive,
  className,
  style,
}: CommentComposerKeyboardShellProps) {
  const { floatingBottomInsetCss } = useAppFrame();

  const keyboardSurfacePx = keyboardLiftActive
    ? getSoftKeyboardPresentedHeight()
    : 0;

  const paddingBottom =
    keyboardSurfacePx > 0
      ? `${keyboardSurfacePx + COMMENT_COMPOSER_KEYBOARD_GAP_PX}px`
      : floatingBottomInsetCss;

  return (
    <div
      className={className}
      style={{
        backgroundColor: getColorCSSVar("UISheetFlat1"),
        paddingBottom,
        transition:
          keyboardSurfacePx > 0
            ? `padding-bottom ${KB_OPEN_ANIMATION_MS}ms cubic-bezier(0.32, 0.72, 0, 1)`
            : "padding-bottom 240ms cubic-bezier(0.4, 0, 0.2, 1)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function readAppFrameFloatingBottomInsetPx(
  root: HTMLElement | null = typeof document === "undefined"
    ? null
    : document.querySelector<HTMLElement>("[data-app-frame-root]"),
): number {
  if (!root || typeof window === "undefined") return 34;
  const raw = getComputedStyle(root)
    .getPropertyValue("--app-frame-floating-bottom-inset")
    .trim();
  const px = Number.parseFloat(raw);
  return Number.isFinite(px) ? px : 34;
}

/** Reserve space in the comment sheet while the composer is portaled to the frame bottom. */
export function getCommentComposerSheetSlotPx({
  expanded,
  keyboardSurfacePx,
  bottomInsetPx,
}: {
  expanded: boolean;
  keyboardSurfacePx: number;
  bottomInsetPx: number;
}): number {
  const content = getCommentComposerContentHeightPx(expanded);
  const chromeBottom =
    keyboardSurfacePx > 0
      ? keyboardSurfacePx + COMMENT_COMPOSER_KEYBOARD_GAP_PX
      : bottomInsetPx;
  return Math.ceil(content + chromeBottom);
}
