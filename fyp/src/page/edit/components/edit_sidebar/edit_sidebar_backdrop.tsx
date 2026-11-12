import { motion } from "framer-motion";

import {
  EDIT_SIDEBAR_COLUMN_WIDTH_EXPANDED_PX,
  EDIT_SIDEBAR_SPRING,
} from "../edit_chrome.constants.ts";

type EditSidebarBackdropProps = {
  visible: boolean;
};

/** Right-edge scrim when the sidebar is expanded (CSS gradient, no bitmap asset). */
export function EditSidebarBackdrop({ visible }: EditSidebarBackdropProps) {
  return (
    <motion.div
      aria-hidden={!visible}
      className="pointer-events-none absolute right-0 top-0 z-0"
      style={{
        width: EDIT_SIDEBAR_COLUMN_WIDTH_EXPANDED_PX,
        bottom: "calc(-1 * var(--app-frame-bottom-inset, 0px))",
        backgroundImage: [
          "linear-gradient(",
          "to left,",
          "rgba(0, 0, 0, 0.58) 0%,",
          "rgba(0, 0, 0, 0.42) 18%,",
          "rgba(0, 0, 0, 0.26) 40%,",
          "rgba(0, 0, 0, 0.12) 62%,",
          "rgba(0, 0, 0, 0.04) 82%,",
          "transparent 100%",
          ")",
        ].join(" "),
      }}
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={EDIT_SIDEBAR_SPRING}
    />
  );
}
