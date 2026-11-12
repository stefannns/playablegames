import type { ColorV2Name } from "@byted-tiktok/tux-color";
import { getColorCSSVar } from "@byted-tiktok/tux-web";
import type { ReactNode } from "react";

/**
 * Tints TUX icons via `currentColor`.
 * `TUXIcon color` only adds an undefined `text-color-*` class in this app.
 */
export function IconInk({
  color,
  children,
  className,
}: {
  color: ColorV2Name;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={className ?? "inline-flex items-center justify-center"}
      style={{ color: getColorCSSVar(color) }}
    >
      {children}
    </span>
  );
}

/** Same as {@link IconInk} but accepts a resolved CSS color string. */
export function IconInkCss({
  color,
  children,
  className,
}: {
  color: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={className ?? "inline-flex items-center justify-center"}
      style={{ color }}
    >
      {children}
    </span>
  );
}
