import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

/** Fixed position for desktop debug controls (route switcher, theme). Hidden in Desagent embed. */
export const DESKTOP_CORNER_TOOLBAR_POSITION_CLASS =
  "app-shell-dev-toolbar bottom-4 z-50 fixed";

/** Outer shell — wraps `TUXSegmentedControl` on the theme side. */
export const DESKTOP_CORNER_TOOLBAR_SHELL_CLASS =
  "inline-flex bg-tux-v2-ui-page-flat-1 rounded-full p-0.5";

/**
 * Mirrors `@byted-tiktok/tux-web` `TUXSegmentedControl` `sizePreset="small"`
 * (`components/segmented-control/constants.js`).
 */
export const DESKTOP_SEGMENTED_CONTROL_SMALL = {
  trackPaddingPx: 3,
  trackMinHeightPx: 40,
  segmentPaddingInlinePx: 14,
  segmentPaddingBlockPx: 7.5,
  segmentGapPx: 4,
  segmentIconPx: 14,
} as const;

type DesktopCornerToolbarProps = {
  side: "left" | "right";
  "aria-label"?: string;
  children: ReactNode;
  className?: string;
};

export function DesktopCornerToolbar({
  side,
  "aria-label": ariaLabel,
  children,
  className,
}: DesktopCornerToolbarProps) {
  const sideClass = side === "left" ? "left-4" : "right-4";
  return (
    <div
      className={[DESKTOP_CORNER_TOOLBAR_POSITION_CLASS, sideClass, className]
        .filter(Boolean)
        .join(" ")}
      aria-label={ariaLabel}
    >
      <div className={DESKTOP_CORNER_TOOLBAR_SHELL_CLASS}>{children}</div>
    </div>
  );
}

/** Inner track (`ui-shape-neutral-4`) — same layer as `TUXSegmentedControl` root. */
export function DesktopSegmentedControlTrack({ children }: { children: ReactNode }) {
  const { trackPaddingPx, trackMinHeightPx } = DESKTOP_SEGMENTED_CONTROL_SMALL;
  return (
    <div
      className="relative flex w-fit items-center justify-between overflow-hidden rounded-(--tux-v2-radius-content-capsule) bg-tux-v2-ui-shape-neutral-4"
      style={{
        padding: trackPaddingPx,
        minHeight: trackMinHeightPx,
      }}
    >
      {children}
    </div>
  );
}

/** Selected segment pill (`ui-sheet-flat-3` + overlay) — matches sliding indicator. */
export function DesktopSegmentedControlPill({ children }: { children: ReactNode }) {
  const { segmentPaddingInlinePx, segmentPaddingBlockPx } = DESKTOP_SEGMENTED_CONTROL_SMALL;
  return (
    <span
      className="relative z-1 inline-flex items-center justify-center overflow-hidden rounded-(--tux-v2-radius-content-capsule) bg-tux-v2-ui-sheet-flat-3 before:pointer-events-none before:absolute before:inset-0 before:rounded-inherit before:bg-tux-v2-ui-image-overlay-white-a20 before:content-['']"
      style={{
        paddingInline: segmentPaddingInlinePx,
        paddingBlock: segmentPaddingBlockPx,
      }}
    >
      <span className="relative z-1 inline-flex items-center justify-center">{children}</span>
    </span>
  );
}

type DesktopSegmentedTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

/** Popover / menu trigger sized like one selected `TUXSegment` item. */
export const DesktopSegmentedTrigger = forwardRef<HTMLButtonElement, DesktopSegmentedTriggerProps>(
  function DesktopSegmentedTrigger({ children, className, type = "button", ...rest }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={[
          "m-0 cursor-pointer border-0 bg-transparent p-0 outline-none",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        <DesktopSegmentedControlTrack>
          <DesktopSegmentedControlPill>{children}</DesktopSegmentedControlPill>
        </DesktopSegmentedControlTrack>
      </button>
    );
  },
);
