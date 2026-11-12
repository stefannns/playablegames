import type { ReactNode } from "react";

import { useAppFrame } from "./app_frame";

/**
 * Pushes immersive page chrome below the desktop status bar / safe-area while
 * leaving the parent surface fill edge-to-edge (camera / Add to story pattern).
 */
export function AppFrameImmersiveChrome({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const { topInsetCss } = useAppFrame();

  return (
    <div
      className={[
        "relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ paddingTop: topInsetCss }}
    >
      {children}
    </div>
  );
}
