import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { createPortal } from "react-dom";

import { InboxRowCell, type InboxRowCellRow } from "./inbox_row_cell";
import {
  InboxLongPressMenu,
  type InboxLongPressActionId,
} from "./inbox_long_press_menu";

type InboxLongPressOverlayProps = {
  row: InboxRowCellRow | null;
  /** Cell's bounding rect in viewport coords at long-press start. */
  originRect: DOMRect | null;
  /** AppFrame phone-container; overlay is portaled here so it can't escape the phone. */
  root: HTMLElement | null;
  onClose: () => void;
  onAction: (actionId: InboxLongPressActionId, row: InboxRowCellRow) => void;
};

/** Estimated menu height for positioning math — overshoots so cells near
 * bottom flip the menu above instead of clipping. */
const MENU_HEIGHT_ESTIMATE = 380;
const MENU_GAP = 8;
const MENU_INSET = 16;

export function InboxLongPressOverlay({
  row,
  originRect,
  root,
  onClose,
  onAction,
}: InboxLongPressOverlayProps) {
  // ESC closes the overlay (desktop affordance)
  useEffect(() => {
    if (!row) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [row, onClose]);

  // Lock scroll on the AppFrame while overlay is up so the cell stays under
  // the menu and the page doesn't shift behind the backdrop.
  useEffect(() => {
    if (!row || !root) return;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, [row, root]);

  if (!root) return null;

  const rootRect = root.getBoundingClientRect();
  const overlay = (
    <AnimatePresence>
      {row && originRect ? (
        (() => {
          const cellTop = originRect.top - rootRect.top;
          const cellLeft = originRect.left - rootRect.left;
          const cellWidth = originRect.width;
          const cellHeight = originRect.height;

          const placeMenuAbove =
            cellTop + cellHeight + MENU_GAP + MENU_HEIGHT_ESTIMATE >
            rootRect.height;
          const menuTop = placeMenuAbove
            ? cellTop - MENU_GAP - MENU_HEIGHT_ESTIMATE
            : cellTop + cellHeight + MENU_GAP;

          // iOS-style cubic-bezier (matches UIKit's default ease for sheets/popovers).
          const easeOut = [0.32, 0.72, 0, 1] as const;
          const easeInOut = [0.4, 0, 0.2, 1] as const;

          return (
            <motion.div
              key="inbox-longpress-overlay"
              className="absolute inset-0 z-50"
              onClick={onClose}
            >
              <motion.div
                aria-hidden
                className="absolute inset-0"
                initial={{
                  backgroundColor: "rgba(0, 0, 0, 0)",
                  backdropFilter: "blur(0px)",
                }}
                animate={{
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                  backdropFilter: "blur(8px)",
                }}
                exit={{
                  backgroundColor: "rgba(0, 0, 0, 0)",
                  backdropFilter: "blur(0px)",
                }}
                transition={{ duration: 0.32, ease: easeInOut }}
              />

              <motion.div
                className="absolute overflow-hidden bg-tux-v2-ui-sheet-flat-1"
                style={{
                  top: cellTop,
                  left: cellLeft,
                  width: cellWidth,
                  height: cellHeight,
                  borderRadius: 12,
                  boxShadow: "0 8px 28px rgba(0,0,0,0.14)",
                }}
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.98, opacity: 0 }}
                transition={{ duration: 0.28, ease: easeOut }}
                onClick={(e) => e.stopPropagation()}
              >
                <InboxRowCell row={row} />
              </motion.div>

              <motion.div
                className="absolute"
                style={{
                  top: menuTop,
                  left: MENU_INSET,
                  transformOrigin: placeMenuAbove
                    ? "bottom left"
                    : "top left",
                }}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  // 进入时晚一拍，给 cell 浮起留出层次感
                  transition: { duration: 0.26, ease: easeOut, delay: 0.06 },
                }}
                exit={{
                  scale: 0.9,
                  opacity: 0,
                  // 退出立即开始，不要被 enter delay 拖
                  transition: { duration: 0.2, ease: easeInOut },
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <InboxLongPressMenu
                  onAction={(actionId) => {
                    onAction(actionId, row);
                    onClose();
                  }}
                />
              </motion.div>
            </motion.div>
          );
        })()
      ) : null}
    </AnimatePresence>
  );

  return createPortal(overlay, root);
}
