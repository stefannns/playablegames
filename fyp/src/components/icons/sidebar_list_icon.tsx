import { TUXIconChevronRightSlimThinLTR } from "@byted-tiktok/tux-icons";
import type { ReactNode } from "react";

import {
  SIDEBAR_CHEVRON_SIZE,
  SIDEBAR_LEADING_ICON_CSS_COLOR,
  SIDEBAR_LIST_ICON_SIZE,
} from "./sidebar_chrome";

export function SidebarListLeadingIcon({ children }: { children: ReactNode }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center"
      style={{
        width: SIDEBAR_LIST_ICON_SIZE,
        height: SIDEBAR_LIST_ICON_SIZE,
        color: SIDEBAR_LEADING_ICON_CSS_COLOR,
      }}
    >
      {children}
    </span>
  );
}

export function SidebarChevron() {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center"
      style={{ color: SIDEBAR_LEADING_ICON_CSS_COLOR }}
    >
      <TUXIconChevronRightSlimThinLTR size={SIDEBAR_CHEVRON_SIZE} />
    </span>
  );
}
