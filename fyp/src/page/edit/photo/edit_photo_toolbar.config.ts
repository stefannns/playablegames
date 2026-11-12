import type { EditSidebarTool } from "../components/edit_sidebar";

export function buildEditPhotoSidebarTools(onSettingsClick: () => void): {
  compactTools: EditSidebarTool[];
  expandableTools: EditSidebarTool[];
} {
  const compactTools: EditSidebarTool[] = [
    {
      id: "settings",
      label: "Settings",
      iconDef: "settings",
      onClick: onSettingsClick,
    },
    {
      id: "share",
      label: "Share",
      iconDef: "share",
    },
  ];

  const expandableTools: EditSidebarTool[] = [
    {
      id: "aiAlive",
      label: "AI alive",
      iconDef: "aiAlive",
      stagger: { top: 0 },
    },
    {
      id: "edit",
      label: "Edit",
      expandedLabel: "Edit",
      iconDef: "track",
      stagger: { top: 52 },
    },
    {
      id: "photoTemplates",
      label: "Photo Templates",
      iconDef: "photoTemplates",
      stagger: { top: 104 },
    },
    {
      id: "videoTemplates",
      label: "Video Templates",
      iconDef: "templates",
      stagger: { top: 156 },
    },
    {
      id: "text",
      label: "Text",
      iconDef: "text",
      stagger: { top: 208 },
    },
    {
      id: "stickers",
      label: "Stickers",
      iconDef: "stickers",
      stagger: { top: 260 },
    },
    {
      id: "effects",
      label: "Effects",
      iconDef: "effects",
      stagger: { top: 312 },
    },
    {
      id: "filters",
      label: "Filters",
      iconDef: "filters",
      stagger: { top: 364 },
    },
    {
      id: "crop",
      label: "Crop",
      iconDef: "crop",
      stagger: { top: 416 },
    },
    {
      id: "voice",
      label: "Voice",
      iconDef: "voice",
      stagger: { top: 468 },
    },
  ];

  return { compactTools, expandableTools };
}
