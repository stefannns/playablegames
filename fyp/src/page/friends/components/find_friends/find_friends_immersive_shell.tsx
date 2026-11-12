import type { CSSProperties, ReactNode } from "react";

import { ThemeScope } from "../../../../context/theme";

type FindFriendsImmersiveShellProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/**
 * Camera-aligned immersive shell: outer `ThemeScope` fills edge-to-edge.
 * Inner column + safe area: {@link AppFrameImmersiveChrome}. Local theme only; chrome via register
 * stack（STATUS_BAR.md）。页内栈子页铺色见 `app_frame.tsx` 文件头；勿 `absolute inset-0` 或 forced document theme。
 */
export function FindFriendsImmersiveShell({
  children,
  className = "",
  style,
}: FindFriendsImmersiveShellProps) {
  return (
    <ThemeScope
      mode="dark"
      className={[
        "relative h-full min-h-0 w-full min-w-0 overflow-hidden",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      {children}
    </ThemeScope>
  );
}
