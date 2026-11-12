import type { ColorV2Name } from "@byted-tiktok/tux-color";
import { getColorCSSVar } from "@byted-tiktok/tux-web";
import type { ReactNode } from "react";

/**
 * Tints a TUX icon via `currentColor`.
 *
 * TUX icons render with `fill: currentColor`, and their `color` prop only sets a
 * `text-color-*` utility class that this app's CSS does not define. Wrapping the
 * icon and setting CSS `color` to a semantic token var is the reliable way to
 * color it (no hardcoded values).
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
