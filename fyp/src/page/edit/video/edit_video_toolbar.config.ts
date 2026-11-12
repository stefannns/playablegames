import type { EditSidebarTool } from "../components/edit_sidebar";

export function buildEditVideoSidebarTools(onSettingsClick: () => void): {
  compactTools: EditSidebarTool[];
  expandableTools: EditSidebarTool[];
  fadeInTool: EditSidebarTool;
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
      id: "edit-video",
      label: "Edit video",
      expandedLabel: "Edit",
      iconDef: "track",
    },
    {
      id: "templates",
      label: "Templates",
      expandedLabel: "Templates",
      iconDef: "templates",
    },
    {
      id: "text",
      label: "Text",
      expandedLabel: "Text",
      iconDef: "text",
    },
    {
      id: "stickers",
      label: "Stickers",
      expandedLabel: "Stickers",
      iconDef: "stickers",
    },
    {
      id: "effects",
      label: "Effects",
      expandedLabel: "Effects",
      iconDef: "effects",
    },
    {
      id: "filters",
      label: "Filters",
      expandedLabel: "Filters",
      iconDef: "filters",
    },
    {
      id: "voice",
      label: "Voice",
      expandedLabel: "Voice",
      iconDef: "voice",
    },
  ];

  const fadeInTool: EditSidebarTool = {
    id: "captions",
    label: "Captions",
    expandedLabel: "Captions",
    fadeInWhenExpanded: true,
    iconDef: "captions",
  };

  return { compactTools, expandableTools, fadeInTool };
}
