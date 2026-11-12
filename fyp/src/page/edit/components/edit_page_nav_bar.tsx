import type { CSSProperties } from "react";

import { MediaPreviewNavBar } from "./media_preview_nav_bar.tsx";

type EditPageNavBarProps = {
  className?: string;
  style?: CSSProperties;
  onBack?: (trigger: HTMLElement) => void;
  soundName?: string;
  onSoundClick?: () => void;
  onSoundDismiss?: () => void;
};

/** Immersive edit chrome: back + Add sound. Settings stay in the right sidebar. */
export function EditPageNavBar({
  className,
  style,
  onBack,
  soundName,
  onSoundClick,
  onSoundDismiss,
}: EditPageNavBarProps) {
  return (
    <MediaPreviewNavBar
      className={className}
      style={style}
      leading="back"
      onLeading={onBack}
      soundName={soundName}
      onSoundClick={onSoundClick}
      onSoundDismiss={onSoundDismiss}
    />
  );
}
