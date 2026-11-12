import { TUXText } from "@byted-tiktok/tux-web";
import { Icon3ptHamburgerMenu } from "@byted-tiktok/tux-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAppNavigation } from "../../context/app_navigation";
import {
  buildAppRouteTree,
  currentRouteLabelForPathname,
  flattenRouteMenuEntries,
  formatRouteMenuClipboardText,
} from "../../routes/app_route_tree";
import { showAppFrameTopToast } from "./app_frame_top_toast";
import {
  DESKTOP_SEGMENTED_CONTROL_SMALL,
  DesktopCornerToolbar,
  DesktopSegmentedTrigger,
} from "./desktop_corner_toolbar";
import {
  RouteSwitcherTree,
  ROUTE_TREE_CONTAINER_RADIUS_PX,
} from "./route_switcher_tree";

const ROUTE_SWITCHER_SINGLE_CLICK_MS = 250;

export default function RouteSwitcher() {
  const { pathname, navigate } = useAppNavigation();
  const [panelOpen, setPanelOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const singleClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const appTree = useMemo(() => buildAppRouteTree(), []);

  const currentPageLabel = useMemo(
    () => currentRouteLabelForPathname(pathname),
    [pathname],
  );

  useEffect(() => {
    if (!panelOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root || root.contains(event.target as Node)) return;
      setPanelOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [panelOpen]);

  useEffect(() => {
    return () => {
      if (singleClickTimerRef.current) {
        clearTimeout(singleClickTimerRef.current);
      }
    };
  }, []);

  const copyRouteMenuToClipboard = useCallback(async () => {
    const text = formatRouteMenuClipboardText(appTree);
    const count = flattenRouteMenuEntries(appTree).length;
    try {
      await navigator.clipboard.writeText(text);
      showAppFrameTopToast({
        text: `Copied ${count} routes to clipboard`,
        duration: 2200,
        displayMode: "replace",
      });
    } catch {
      showAppFrameTopToast({
        text: "Could not copy routes to clipboard",
        duration: 2200,
        displayMode: "replace",
      });
    }
  }, [appTree]);

  const handleTriggerClick = useCallback(() => {
    if (singleClickTimerRef.current) return;
    singleClickTimerRef.current = setTimeout(() => {
      singleClickTimerRef.current = null;
      setPanelOpen((open) => !open);
    }, ROUTE_SWITCHER_SINGLE_CLICK_MS);
  }, []);

  const handleTriggerDoubleClick = useCallback(() => {
    if (singleClickTimerRef.current) {
      clearTimeout(singleClickTimerRef.current);
      singleClickTimerRef.current = null;
    }
    void copyRouteMenuToClipboard();
  }, [copyRouteMenuToClipboard]);

  const { segmentGapPx, segmentIconPx } = DESKTOP_SEGMENTED_CONTROL_SMALL;

  return (
    <DesktopCornerToolbar side="left" aria-label="Routes">
      <div ref={rootRef} className="relative">
        <DesktopSegmentedTrigger
          aria-label={`Open route switcher, current page ${currentPageLabel}. Double-click to copy all routes.`}
          aria-expanded={panelOpen}
          className="max-w-min(60,calc(100vw-12rem))"
          onClick={handleTriggerClick}
          onDoubleClick={handleTriggerDoubleClick}
        >
          <span
            className="inline-flex min-w-0 max-w-full items-center justify-center"
            style={{ gap: segmentGapPx }}
          >
            <Icon3ptHamburgerMenu
              width={segmentIconPx}
              height={segmentIconPx}
              className="shrink-0 text-tux-v2-ui-text-1"
            />
            <TUXText
              typographyPreset="H4-Semibold"
              color="UIText1"
              className="min-w-0 truncate"
            >
              {currentPageLabel}
            </TUXText>
          </span>
        </DesktopSegmentedTrigger>

        {panelOpen ? (
          <div
            className="absolute bottom-full left-0 z-50 mb-2 min-w-[220px] max-w-[min(320px,calc(100vw-2rem))] overflow-hidden border border-tux-v2-ui-shape-neutral-3 bg-tux-v2-ui-page-flat-1 shadow-lg"
            style={{ borderRadius: ROUTE_TREE_CONTAINER_RADIUS_PX }}
            role="dialog"
            aria-label="Route tree"
          >
            <div className="max-h-[min(420px,calc(100vh-8rem))] overflow-y-auto overscroll-contain touch-pan-y">
              <RouteSwitcherTree
                nodes={appTree}
                pathname={pathname}
                onNavigate={(path) => {
                  navigate(path);
                  setPanelOpen(false);
                }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </DesktopCornerToolbar>
  );
}
