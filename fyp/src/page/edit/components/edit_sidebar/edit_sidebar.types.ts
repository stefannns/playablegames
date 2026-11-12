import type { ReactNode } from "react";

/** Preset mapped to {@link resolveEditSidebarIcon} → TUX `Icon_Color/` components. */
export type EditSidebarIconPreset =
  | "settings"
  | "share"
  | "track"
  | "templates"
  | "photoTemplates"
  | "text"
  | "stickers"
  | "effects"
  | "filters"
  | "crop"
  | "voice"
  | "captions"
  | "aiAlive";

export type EditSidebarStaggerPosition = {
  /** Top offset (px) within the expandable scroll panel. */
  top: number;
};

export type EditSidebarTool = {
  id: string;
  label: string;
  /** Label shown when expanded; defaults to `label`. Track-style tools often use "Edit". */
  expandedLabel?: string;
  /** Custom icon node (highest priority). */
  icon?: ReactNode;
  /** Built-in TUX IconColor preset; used when `icon` is omitted. */
  iconDef?: EditSidebarIconPreset;
  onClick?: () => void;
  /** Scroll-panel layout — absolute `top` inside the expandable scroll region. */
  stagger?: EditSidebarStaggerPosition;
  /** Inline expand — fade in when panel expands (e.g. Captions). */
  fadeInWhenExpanded?: boolean;
};

/** How the expandable section opens (resolved automatically — do not pass manually). */
export type EditSidebarExpandMode = "inline" | "scroll";

export type EditSidebarProps = {
  /** Always-visible tools above the split line (Settings, Share, …). */
  compactTools: EditSidebarTool[];
  /** Tools revealed in the expandable section. */
  expandableTools: EditSidebarTool[];
  /** Inline expand only — extra row that fades in when expanded (e.g. Captions). */
  fadeInTool?: EditSidebarTool;
  /** Scroll-panel: height of the compact block (defaults to 117). */
  compactSectionHeightPx?: number;
  /** Scroll-panel: scroll region heights when collapsed / expanded. */
  scrollPanelHeights?: { collapsed: number; expanded: number };
  /** Inline expand: width when collapsed / expanded. */
  inlineWidths?: { collapsed: number; expanded: number };
  /** Override auto-resolved expand mode (rare — prefer tool `stagger` / `fadeInTool`). */
  expandMode?: EditSidebarExpandMode;
  /** Fired when expandable tools open/close (drives full-height backdrop in viewport). */
  onExpandedChange?: (expanded: boolean) => void;
  /**
   * Tool column offset from the sidebar overlay top. When the viewport already
   * applies {@link AppFrame} top inset, use chrome offset only (4px).
   */
  toolTopCss?: string;
};
