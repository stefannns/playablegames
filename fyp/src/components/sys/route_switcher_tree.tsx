import { TUXText, getColorCSSVar } from "@byted-tiktok/tux-web";
import { useCallback, useState } from "react";

import {
  routeTreeNodeMatchesPathname,
  type RouteTreeNode,
} from "../../routes/app_route_tree";

const ROUTE_CURRENT_BADGE_BG = getColorCSSVar("UIText1");
const ROUTE_CURRENT_BADGE_TEXT = getColorCSSVar("UIPageFlat1");

const INDENT_PX = 8;
/** Concentric corners: container radius = padding + item radius */
export const ROUTE_TREE_PADDING_PX = 4;
export const ROUTE_TREE_ITEM_RADIUS_PX = 6;
export const ROUTE_TREE_CONTAINER_RADIUS_PX =
  ROUTE_TREE_PADDING_PX + ROUTE_TREE_ITEM_RADIUS_PX;
const COLLAPSED_STORAGE_KEY = "routeSwitcher_collapsedNodeIds";

function loadCollapsedRouteNodeIds(): Set<string> {
  try {
    const raw = localStorage.getItem(COLLAPSED_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function persistCollapsedRouteNodeIds(ids: Set<string>) {
  try {
    localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore quota errors
  }
}

export function routeTreeNodeIsCurrent(pathname: string, node: RouteTreeNode): boolean {
  return routeTreeNodeMatchesPathname(pathname, node);
}

type RouteSwitcherTreeProps = {
  nodes: RouteTreeNode[];
  pathname: string;
  onNavigate: (path: string) => void;
};

export function RouteSwitcherTree({
  nodes,
  pathname,
  onNavigate,
}: RouteSwitcherTreeProps) {
  const [collapsedIds, setCollapsedIds] = useState(loadCollapsedRouteNodeIds);

  const toggleCollapsed = useCallback((nodeId: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      persistCollapsedRouteNodeIds(next);
      return next;
    });
  }, []);

  return (
    <ul
      className="m-0 list-none"
      style={{ padding: ROUTE_TREE_PADDING_PX }}
      role="tree"
    >
      {nodes.map((node) => (
        <RouteSwitcherTreeBranch
          key={node.id}
          node={node}
          depth={0}
          pathname={pathname}
          collapsedIds={collapsedIds}
          onToggleCollapsed={toggleCollapsed}
          onNavigate={onNavigate}
        />
      ))}
    </ul>
  );
}

type RouteSwitcherTreeBranchProps = {
  node: RouteTreeNode;
  depth: number;
  pathname: string;
  collapsedIds: Set<string>;
  onToggleCollapsed: (nodeId: string) => void;
  onNavigate: (path: string) => void;
};

function RouteSwitcherTreeBranch({
  node,
  depth,
  pathname,
  collapsedIds,
  onToggleCollapsed,
  onNavigate,
}: RouteSwitcherTreeBranchProps) {
  const children = node.children ?? [];
  const hasChildren = children.length > 0;
  const isCollapsed = collapsedIds.has(node.id);
  const isCurrent = routeTreeNodeIsCurrent(pathname, node);

  return (
    <li role="treeitem" aria-expanded={hasChildren ? !isCollapsed : undefined}>
      <div
        className={[
          "flex min-h-10 items-center gap-1.5 pr-2.5",
          isCurrent
            ? "bg-tux-v2-ui-shape-neutral-4"
            : "hover:bg-tux-v2-ui-shape-neutral-4",
        ].join(" ")}
        style={{
          paddingLeft: depth * INDENT_PX + 4,
          borderRadius: ROUTE_TREE_ITEM_RADIUS_PX,
        }}
      >
        <CollapseToggle
          visible={hasChildren}
          expanded={!isCollapsed}
          label={node.label}
          onClick={() => onToggleCollapsed(node.id)}
        />
        <button
          type="button"
          aria-current={isCurrent ? "page" : undefined}
          className="flex min-w-0 flex-1 items-center justify-between gap-2 border-0 bg-transparent p-0 text-left outline-none"
          onClick={() => onNavigate(node.path)}
        >
          <TUXText typographyPreset="P1-Regular" color="UIText1" className="min-w-0 truncate">
            {node.label}
          </TUXText>
          {isCurrent ? (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none"
              style={{
                color: ROUTE_CURRENT_BADGE_TEXT,
                backgroundColor: ROUTE_CURRENT_BADGE_BG,
              }}
            >
              Current
            </span>
          ) : null}
        </button>
      </div>
      {hasChildren && !isCollapsed ? (
        <ul className="m-0 list-none" role="group">
          {children.map((child) => (
            <RouteSwitcherTreeBranch
              key={child.id}
              node={child}
              depth={depth + 1}
              pathname={pathname}
              collapsedIds={collapsedIds}
              onToggleCollapsed={onToggleCollapsed}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function CollapseToggle({
  visible,
  expanded,
  label,
  onClick,
}: {
  visible: boolean;
  expanded: boolean;
  label: string;
  onClick: () => void;
}) {
  if (!visible) {
    return <span className="inline-block w-6 shrink-0" aria-hidden />;
  }

  return (
    <button
      type="button"
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border-0 bg-transparent p-0 text-tux-v2-ui-text-1 outline-none hover:bg-tux-v2-ui-shape-neutral-4"
      aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <ChevronGlyph expanded={expanded} />
    </button>
  );
}

function ChevronGlyph({ expanded }: { expanded: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d={expanded ? "M4 6.5 8 10.5 12 6.5" : "M6 4.5 10 8.5 6 12.5"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
