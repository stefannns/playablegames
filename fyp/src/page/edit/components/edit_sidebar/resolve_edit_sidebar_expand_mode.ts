import type { EditSidebarExpandMode, EditSidebarProps } from "./edit_sidebar.types.ts";

/**
 * Inline (few tools, width expands) vs scroll (many tools / explicit `stagger` tops).
 *
 * - `fadeInTool` → inline (video Captions row).
 * - Any `expandableTools[].stagger` → scroll (photo edit).
 * - Otherwise → inline (camera, video tools).
 */
export function resolveEditSidebarExpandMode(
  props: Pick<EditSidebarProps, "expandableTools" | "fadeInTool" | "expandMode">,
): EditSidebarExpandMode {
  if (props.expandMode) {
    return props.expandMode;
  }
  if (props.fadeInTool) {
    return "inline";
  }
  if (props.expandableTools.some((tool) => tool.stagger != null)) {
    return "scroll";
  }
  return "inline";
}

export function chevronIconForExpandMode(mode: EditSidebarExpandMode): "up" | "down" {
  return mode === "scroll" ? "down" : "up";
}
