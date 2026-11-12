import { getColorCSSVar, TUXText } from "@byted-tiktok/tux-web";
import { TUXIconColorChevronDownFill, TUXIconColorChevronUpFill } from "@byted-tiktok/tux-icons";
import { motion } from "framer-motion";
import type { CSSProperties } from "react";

import {
  EDIT_SIDEBAR_ICON_COLUMN_WIDTH_PX,
  EDIT_SIDEBAR_ICON_LEFT_FROM_RIGHT_PX,
  EDIT_SIDEBAR_LABEL_ICON_GAP_PX,
  EDIT_SIDEBAR_PRESS_SCALE,
  EDIT_SIDEBAR_ROW_HEIGHT_PX,
  EDIT_SIDEBAR_SPRING,
} from "../edit_chrome.constants.ts";
import {
  EDIT_SIDEBAR_ICON_SIZE,
  resolveEditSidebarIcon,
} from "./edit_sidebar_icon_builders.tsx";
import type { EditSidebarTool } from "./edit_sidebar.types.ts";

const EDIT_SIDEBAR_PRESS_TRANSITION = {
  type: "spring" as const,
  stiffness: 500,
  damping: 28,
};

/** Radial blur under overlay toolbar icons (camera + edit sidebars). */
export function EditSidebarToolShadow() {
  return (
    <span
      aria-hidden="true"
      className="top-1/2 left-1/2 z-0 absolute size-8 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      data-name="Shadow"
    >
      <span
        className="absolute inset-[12.5%] rounded-full"
        data-name="Subtract"
        style={{
          background:
            "radial-gradient(ellipse 100% 70% at 50% 85%, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.1) 45%, transparent 72%)",
          filter: "blur(6px)",
        }}
      />
    </span>
  );
}

type EditSidebarToolButtonProps = {
  tool: EditSidebarTool;
  /** Show label beside the fixed icon column. */
  showLabel?: boolean;
  /** Label visibility for animation (inline column). */
  labelVisible?: boolean;
  /** Fade in/out tied to expand state (captions row). */
  fadeWithExpanded?: boolean;
  expanded?: boolean;
  className?: string;
  style?: CSSProperties;
};

/**
 * Icon column stays pinned on the right (56×52). Labels fade in to the left —
 * same contract as {@link story_edit_page} `renderSideToolButton`, so expand/collapse
 * does not re-anchor icons via flex or per-row `left-*`.
 */
export function EditSidebarToolButton({
  tool,
  showLabel = false,
  labelVisible = true,
  fadeWithExpanded = false,
  expanded = false,
  className,
  style,
}: EditSidebarToolButtonProps) {
  const displayLabel = tool.expandedLabel ?? tool.label;
  const renderLabel = showLabel && labelVisible && displayLabel;
  const iconNode = tool.icon ?? (tool.iconDef ? resolveEditSidebarIcon(tool.iconDef) : null);

  const labelStyle: CSSProperties = {
    right: EDIT_SIDEBAR_ICON_LEFT_FROM_RIGHT_PX,
    paddingRight: EDIT_SIDEBAR_LABEL_ICON_GAP_PX,
    color: getColorCSSVar("UIImageOverlayWhite"),
    textShadow: "0 1px 1px rgba(0, 0, 0, 0.12)",
  };

  return (
    <motion.button
      type="button"
      aria-label={tool.label}
      onClick={tool.onClick}
      data-name="Side bar tools"
      className={
        className ??
        [
          "relative shrink-0 overflow-visible border-0 bg-transparent p-0",
          showLabel ? "w-full" : "w-14",
        ].join(" ")
      }
      style={{
        border: "none",
        backgroundColor: "transparent",
        padding: 0,
        height: EDIT_SIDEBAR_ROW_HEIGHT_PX,
        ...style,
      }}
      {...(fadeWithExpanded
        ? {
            initial: { opacity: 0 },
            animate: { opacity: expanded ? 1 : 0 },
            transition: EDIT_SIDEBAR_SPRING,
            "aria-hidden": !expanded,
          }
        : {})}
    >
      {renderLabel ? (
        <motion.span
          className="pointer-events-none absolute top-1/2 w-max max-w-none -translate-y-1/2 whitespace-nowrap"
          style={labelStyle}
          initial={fadeWithExpanded ? false : { opacity: 0 }}
          animate={{ opacity: labelVisible ? 1 : 0 }}
          transition={EDIT_SIDEBAR_SPRING}
          aria-hidden={!labelVisible}
        >
          <TUXText
            typographyPreset="P1-Semibold"
            color="UIImageOverlayWhite"
            style={{ textShadow: "0 1px 1px rgba(0,0,0,0.12)" }}
          >
            {displayLabel}
          </TUXText>
        </motion.span>
      ) : null}
      <motion.span
        className="top-0 right-0 absolute flex justify-center items-center"
        style={{
          width: EDIT_SIDEBAR_ICON_COLUMN_WIDTH_PX,
          height: EDIT_SIDEBAR_ROW_HEIGHT_PX,
          transformOrigin: "center",
        }}
        whileTap={{ scale: EDIT_SIDEBAR_PRESS_SCALE }}
        transition={EDIT_SIDEBAR_PRESS_TRANSITION}
      >
        <EditSidebarToolShadow />
        {iconNode}
      </motion.span>
    </motion.button>
  );
}

/** Staggered photo rows: icon column pinned right; row spans panel when labels show. */
export function staggeredToolClassName(showLabel: boolean): string {
  return showLabel
    ? "absolute inset-x-0 w-auto max-w-none p-0"
    : "absolute right-0 w-14 p-0";
}

export function EditSidebarChevronButton({
  chevronIcon,
  arrowRotation,
  onClick,
  ariaLabel,
  className,
  yOffset,
}: {
  chevronIcon: "up" | "down";
  arrowRotation: number;
  onClick: () => void;
  ariaLabel: string;
  className?: string;
  yOffset?: number;
}) {
  const ChevronIcon =
    chevronIcon === "up" ? TUXIconColorChevronUpFill : TUXIconColorChevronDownFill;
  const chevronName =
    chevronIcon === "up" ? "Icon_Color/Chevron_Up_Fill" : "Icon_Color/Chevron_Down_Fill";

  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={
        className ??
        "relative flex h-[52px] w-14 shrink-0 appearance-none items-center justify-center overflow-visible border-0 bg-transparent p-0"
      }
      style={{ border: "none", backgroundColor: "transparent", padding: 0 }}
      animate={yOffset !== undefined ? { y: yOffset } : undefined}
      transition={EDIT_SIDEBAR_SPRING}
      data-name="Arrow"
    >
      <motion.span
        className="relative flex justify-center items-center"
        style={{
          width: EDIT_SIDEBAR_ICON_COLUMN_WIDTH_PX,
          height: EDIT_SIDEBAR_ROW_HEIGHT_PX,
          transformOrigin: "center",
        }}
        whileTap={{ scale: EDIT_SIDEBAR_PRESS_SCALE }}
        transition={EDIT_SIDEBAR_PRESS_TRANSITION}
      >
        <EditSidebarToolShadow />
        <motion.span
          className="inline-flex z-10 relative justify-center items-center"
          animate={{ rotate: arrowRotation }}
          transition={EDIT_SIDEBAR_SPRING}
          data-name={chevronName}
        >
          <ChevronIcon size={EDIT_SIDEBAR_ICON_SIZE} />
        </motion.span>
      </motion.span>
    </motion.button>
  );
}
