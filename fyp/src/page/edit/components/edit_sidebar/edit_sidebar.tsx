import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import {
  EDIT_SIDEBAR_COLUMN_WIDTH_COLLAPSED_PX,
  EDIT_SIDEBAR_COLUMN_WIDTH_EXPANDED_PX,
  EDIT_SIDEBAR_COMPACT_HEIGHT_PX,
  EDIT_SIDEBAR_SPRING,
  EDIT_SIDEBAR_STAGGERED_HEIGHT_COLLAPSED_PX,
  EDIT_SIDEBAR_STAGGERED_HEIGHT_EXPANDED_PX,
  EDIT_SIDEBAR_STAGGERED_PANEL_WIDTH_PX,
  EDIT_SIDEBAR_TOP_CSS,
} from "../edit_chrome.constants.ts";
import { EditSidebarSplitLine } from "./edit_sidebar_split_line.tsx";
import {
  EditSidebarChevronButton,
  EditSidebarToolButton,
  staggeredToolClassName,
} from "./edit_sidebar_tool.tsx";
import {
  chevronIconForExpandMode,
  resolveEditSidebarExpandMode,
} from "./resolve_edit_sidebar_expand_mode.ts";
import type { EditSidebarProps } from "./edit_sidebar.types.ts";

/** Few tools: column widens on expand; labels fade in beside icons. */
function EditSidebarInlineExpand({
  compactTools,
  expandableTools,
  fadeInTool,
  inlineWidths,
  onExpandedChange,
  toolTopCss = EDIT_SIDEBAR_TOP_CSS,
}: EditSidebarProps) {
  const chevronIcon = chevronIconForExpandMode("inline");
  const [expanded, setExpanded] = useState(false);
  const [renderExpandedContent, setRenderExpandedContent] = useState(false);
  const [arrowRotation, setArrowRotation] = useState(0);
  const removeExpandedContentTimer = useRef<number | null>(null);

  useEffect(() => {
    onExpandedChange?.(expanded);
  }, [expanded, onExpandedChange]);

  const collapsedWidth = inlineWidths?.collapsed ?? EDIT_SIDEBAR_COLUMN_WIDTH_COLLAPSED_PX;
  const expandedWidth = inlineWidths?.expanded ?? EDIT_SIDEBAR_COLUMN_WIDTH_EXPANDED_PX;

  const handleArrowClick = () => {
    if (removeExpandedContentTimer.current !== null) {
      window.clearTimeout(removeExpandedContentTimer.current);
      removeExpandedContentTimer.current = null;
    }

    if (expanded) {
      setExpanded(false);
      removeExpandedContentTimer.current = window.setTimeout(() => {
        setRenderExpandedContent(false);
        removeExpandedContentTimer.current = null;
      }, 300);
    } else {
      setRenderExpandedContent(true);
      window.requestAnimationFrame(() => {
        setExpanded(true);
      });
    }

    setArrowRotation((current) => current + 180);
  };

  return (
    <motion.div
      className="pointer-events-auto absolute right-0 z-10 flex flex-col items-end"
      style={{ top: toolTopCss }}
      initial={false}
      animate={{ width: renderExpandedContent ? expandedWidth : collapsedWidth }}
      transition={EDIT_SIDEBAR_SPRING}
    >
      <div className="relative z-10 flex w-full flex-col items-end">
        {compactTools.map((tool) => (
          <EditSidebarToolButton key={tool.id} tool={tool} />
        ))}
        <EditSidebarSplitLine />
        {expandableTools.map((tool) => (
          <EditSidebarToolButton
            key={tool.id}
            tool={tool}
            showLabel={renderExpandedContent}
            labelVisible={expanded}
          />
        ))}
        <div
          className="relative flex w-full shrink-0 flex-col items-end"
          style={{ height: renderExpandedContent ? 104 : 52 }}
        >
          {renderExpandedContent && fadeInTool ? (
            <EditSidebarToolButton
              tool={fadeInTool}
              showLabel={renderExpandedContent}
              labelVisible={expanded}
              fadeWithExpanded={fadeInTool.fadeInWhenExpanded ?? true}
              expanded={expanded}
            />
          ) : null}
          <EditSidebarChevronButton
            chevronIcon={chevronIcon}
            arrowRotation={arrowRotation}
            onClick={handleArrowClick}
            ariaLabel={expanded ? "Collapse tools" : "Expand tools"}
            className="absolute right-0 top-0 flex h-[52px] w-14 shrink-0 appearance-none items-center justify-center overflow-hidden border-0 bg-transparent p-0"
            yOffset={expanded ? 52 : 0}
          />
        </div>
      </div>
    </motion.div>
  );
}

/** Many tools: fixed compact block + scroll panel with optional stagger positions. */
function EditSidebarScrollExpand({
  compactTools,
  expandableTools,
  compactSectionHeightPx = EDIT_SIDEBAR_COMPACT_HEIGHT_PX,
  scrollPanelHeights = {
    collapsed: EDIT_SIDEBAR_STAGGERED_HEIGHT_COLLAPSED_PX,
    expanded: EDIT_SIDEBAR_STAGGERED_HEIGHT_EXPANDED_PX,
  },
  onExpandedChange,
  toolTopCss = EDIT_SIDEBAR_TOP_CSS,
}: EditSidebarProps) {
  const chevronIcon = chevronIconForExpandMode("scroll");
  const [expanded, setExpanded] = useState(false);
  const [arrowRotation, setArrowRotation] = useState(180);
  const toolsScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    onExpandedChange?.(expanded);
  }, [expanded, onExpandedChange]);

  const dragStateRef = useRef<{
    pointerId: number;
    startY: number;
    startScrollTop: number;
  } | null>(null);

  const offsetFromToolTop = (extraPx: number) => `calc(${toolTopCss} + ${extraPx}px)`;

  const handleArrowClick = () => {
    setExpanded((clicked) => {
      if (clicked && toolsScrollRef.current) {
        toolsScrollRef.current.scrollTop = 0;
      }
      return !clicked;
    });
    setArrowRotation((rotation) => rotation + 180);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!expanded || !toolsScrollRef.current) return;

    dragStateRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startScrollTop: toolsScrollRef.current.scrollTop,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!expanded || !toolsScrollRef.current || !dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    toolsScrollRef.current.scrollTop = dragState.startScrollTop + dragState.startY - event.clientY;
    event.preventDefault();
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current?.pointerId === event.pointerId) {
      dragStateRef.current = null;
    }
  };

  return (
    <>
      <div
        className="pointer-events-auto absolute right-0 z-10 flex w-14 flex-col items-end"
        style={{
          top: toolTopCss,
          height: compactSectionHeightPx,
        }}
      >
        {compactTools.map((tool) => (
          <EditSidebarToolButton key={tool.id} tool={tool} />
        ))}
        <EditSidebarSplitLine />
      </div>
      <motion.div
        ref={toolsScrollRef}
        className="pointer-events-auto absolute right-0 z-10 overflow-y-auto [&::-webkit-scrollbar]:hidden"
        style={{
          top: offsetFromToolTop(compactSectionHeightPx),
          // Collapsed: icon column only (56px). Full panel width steals carousel drags on the preview.
          width: expanded
            ? EDIT_SIDEBAR_STAGGERED_PANEL_WIDTH_PX
            : EDIT_SIDEBAR_COLUMN_WIDTH_COLLAPSED_PX,
          overflowX: expanded ? "visible" : "hidden",
          cursor: expanded ? "grab" : "default",
          maskImage: expanded
            ? "linear-gradient(to bottom, transparent 0px, black 6px, black calc(100% - 6px), transparent 100%)"
            : undefined,
          WebkitMaskImage: expanded
            ? "linear-gradient(to bottom, transparent 0px, black 6px, black calc(100% - 6px), transparent 100%)"
            : undefined,
          scrollbarWidth: "none",
          touchAction: expanded ? "none" : "auto",
          userSelect: "none",
          overflowY: expanded ? "auto" : "hidden",
        }}
        initial={false}
        animate={{
          height: expanded ? scrollPanelHeights.expanded : scrollPanelHeights.collapsed,
        }}
        transition={EDIT_SIDEBAR_SPRING}
        data-name="scrolling"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        {expandableTools.map((tool) => {
          const stagger = tool.stagger;
          if (!stagger) {
            return (
              <EditSidebarToolButton
                key={tool.id}
                tool={tool}
                showLabel={expanded}
                labelVisible={expanded}
              />
            );
          }

          return (
            <EditSidebarToolButton
              key={tool.id}
              tool={tool}
              showLabel={expanded}
              labelVisible={expanded}
              className={staggeredToolClassName(expanded)}
              style={{ top: stagger.top }}
            />
          );
        })}
      </motion.div>
      <motion.div
        className="pointer-events-auto absolute right-0 z-10 flex h-[52px] w-14 items-center justify-center"
        initial={false}
        animate={{
          top: expanded
            ? offsetFromToolTop(compactSectionHeightPx + scrollPanelHeights.expanded)
            : offsetFromToolTop(compactSectionHeightPx + scrollPanelHeights.collapsed),
        }}
        transition={EDIT_SIDEBAR_SPRING}
      >
        <motion.div
          className="flex-none"
          initial={false}
          animate={{ rotate: arrowRotation }}
          transition={EDIT_SIDEBAR_SPRING}
        >
          <EditSidebarChevronButton
            chevronIcon={chevronIcon}
            arrowRotation={0}
            onClick={handleArrowClick}
            ariaLabel="Collapse tools"
            className="relative flex h-[52px] w-14 appearance-none items-center justify-center overflow-hidden border-0 bg-transparent p-0"
          />
        </motion.div>
      </motion.div>
    </>
  );
}

/** Unified right toolbar — expand mode from tools (`stagger`, `fadeInTool`), not a manual variant. */
export function EditSidebar(props: EditSidebarProps) {
  const mode = resolveEditSidebarExpandMode(props);
  if (mode === "scroll") {
    return <EditSidebarScrollExpand {...props} />;
  }
  return <EditSidebarInlineExpand {...props} />;
}
