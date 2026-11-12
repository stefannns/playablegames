import { createPortal } from "react-dom";

import { APP_Z_PARTIAL_SHEET_STACKED } from "../../../../components/sys/app_z_index";
import { SoundSearchPage } from "./sound_search_page";

/** Above trim / volume stacked sheets; music panel stays mounted underneath. */
const SOUND_SEARCH_OVERLAY_Z_INDEX = APP_Z_PARTIAL_SHEET_STACKED + 10;

export type SoundSearchOverlayProps = {
  visible: boolean;
  root: HTMLElement | null;
  onClose: () => void;
  onDiscover?: () => void;
};

/** Full-frame search on top of the open music sheet — dismiss only hides search. */
export function SoundSearchOverlay({
  visible,
  root,
  onClose,
  onDiscover,
}: SoundSearchOverlayProps) {
  if (!visible || !root) return null;

  return createPortal(
    <div
      className="absolute inset-0 min-h-0"
      style={{ zIndex: SOUND_SEARCH_OVERLAY_Z_INDEX }}
    >
      <SoundSearchPage onClose={onClose} onDiscover={onDiscover} />
    </div>,
    root,
  );
}
