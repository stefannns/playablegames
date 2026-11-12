import React, { useRef, useEffect, useState } from "react";
import { useFeedSidebarStore, setFeedSidebarState } from "./feed_sidebar_store";
import { FeedSidebar } from "./feed_sidebar";
import { getColorCSSVar } from "@byted-tiktok/tux-web";
import { useAppNavigation } from "../../../../context/app_navigation";
import { useTheme } from "../../../../context/theme";
import { useAddToStoryStore } from "../../../creation/add_to_story_store";
import { useVisitorProfile } from "../../../../context/visitor_profile";
import { isFindFriendsImmersiveSubpage } from "../../../friends/components/find_friends/find_friends_subpage.constants";

function isImmersiveFindFriendsRoute(activeTab: number, route: ReturnType<typeof useAppNavigation>["route"]) {
  if (!route) return false;
  if (activeTab === 1 && route.tab !== "friends") return false;
  if (activeTab === 4 && route.tab !== "profile") return false;
  if (activeTab !== 1 && activeTab !== 4) return false;
  if (route.sub.screen !== "find-friends") return false;
  return isFindFriendsImmersiveSubpage(route.sub.step);
}

export function FeedSidebarWrapper({ children, activeTab }: { children: React.ReactNode; activeTab: number }) {
  const { isOpen, dragOffsetPx, isDragging } = useFeedSidebarStore();
  const { route } = useAppNavigation();
  const { isOpen: addToStoryOpen } = useAddToStoryStore();
  const { phase: visitorPhase } = useVisitorProfile();
  const { resolvedTheme } = useTheme();
  const rootRef = useRef<HTMLDivElement>(null);
  // Guest profile owns its own right-swipe-to-close; don't let the left-edge
  // hotzone open the feed sidebar while it is on screen.
  const visitorProfileActiveRef = useRef(false);
  visitorProfileActiveRef.current = visitorPhase !== "closed";
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    lastX: 0,
    startTime: 0,
    lastTime: 0,
    pointerId: null as number | null,
    isDragging: false,
    hasExceededThreshold: false,
    startedInOverlayHotzone: false,
  });

  const getRootWidth = () =>
    rootRef.current?.clientWidth ??
    (typeof window !== "undefined" ? window.innerWidth : 331);
  const getRootRect = () => rootRef.current?.getBoundingClientRect() ?? null;
  /** Integer px — shared by sidebar width and content push to avoid transform hairlines. */
  const getSidebarWidthPx = () => Math.round(getRootWidth() * 0.85);
  const DRAG_ACTIVATION_PX = 10;

  const blockUnderlyingGesture = (event: PointerEvent) => {
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
  };

  useEffect(() => {
    if (isOpen && !dragRef.current.isDragging) {
      setFeedSidebarState({ dragOffsetPx: getSidebarWidthPx() });
    }

    const handleResize = () => {
      if (isOpen && !dragRef.current.isDragging) {
        setFeedSidebarState({ dragOffsetPx: getSidebarWidthPx() });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  useEffect(() => {
    // Only allow swipe on Home tab
    if (activeTab !== 0) {
      if (isOpen) {
        setFeedSidebarState({ isOpen: false, dragOffsetPx: 0, isDragging: false });
      }
      return;
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      // Guest profile is on top — let its own gestures handle the swipe.
      if (visitorProfileActiveRef.current) return;

      const rootRect = getRootRect();
      if (!rootRect) return;
      const localX = e.clientX - rootRect.left;
      const isInsideFrame = localX >= 0 && localX <= rootRect.width;
      if (!isInsideFrame) return;

      // 20% of visible frame width edge swipe
      const edgeWidth = rootRect.width * 0.2;
      const isEdge = localX <= edgeWidth;
      const sidebarWidth = getSidebarWidthPx();
      const startedInOverlayHotzone = isOpen && localX > sidebarWidth;

      if (!isEdge && !isOpen) return; // Must start at edge if closed

      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        startTime: performance.now(),
        lastTime: performance.now(),
        pointerId: e.pointerId,
        isDragging: true,
        hasExceededThreshold: false,
        startedInOverlayHotzone,
      };

      // The left-edge hotzone and the open overlay both own the gesture from pointerdown,
      // so the feed never starts a competing vertical swipe underneath.
      if (isEdge || startedInOverlayHotzone) {
        blockUnderlyingGesture(e);
      }

      window.addEventListener("pointermove", onPointerMove, { passive: false, capture: true });
      window.addEventListener("pointerup", onPointerUp, { capture: true });
      window.addEventListener("pointercancel", onPointerUp, { capture: true });
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== dragRef.current.pointerId) return;

      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (!dragRef.current.hasExceededThreshold) {
        const movedEnough = Math.max(absDx, absDy) > DRAG_ACTIVATION_PX;
        if (!movedEnough) {
          if (dragRef.current.startedInOverlayHotzone) {
            blockUnderlyingGesture(e);
          }
          return;
        }

        // Closed state: only open the sidebar when the gesture is rightward and within +/-45deg.
        if (!isOpen) {
          if (dx > 0 && absDy <= absDx) {
            dragRef.current.hasExceededThreshold = true;
            setFeedSidebarState({ isDragging: true });
            blockUnderlyingGesture(e);
          } else {
            cleanup();
            return;
          }
        } else if (dragRef.current.startedInOverlayHotzone) {
          // Open state on the overlay: block feed switching even for non-horizontal drags.
          if (absDx >= absDy) {
            dragRef.current.hasExceededThreshold = true;
            setFeedSidebarState({ isDragging: true });
          }
          blockUnderlyingGesture(e);
          if (!dragRef.current.hasExceededThreshold) {
            return;
          }
        } else if (absDx > absDy) {
          dragRef.current.hasExceededThreshold = true;
          setFeedSidebarState({ isDragging: true });
        } else if (absDy > DRAG_ACTIVATION_PX) {
          cleanup();
          return;
        }
      }

      if (dragRef.current.hasExceededThreshold) {
        blockUnderlyingGesture(e);
        const sidebarWidth = getSidebarWidthPx();
        const baseOffset = isOpen ? sidebarWidth : 0;
        let newOffset = Math.round(baseOffset + dx);
        newOffset = Math.max(0, Math.min(newOffset, sidebarWidth));
        setFeedSidebarState({ dragOffsetPx: newOffset });
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== dragRef.current.pointerId) return;
      const sidebarWidth = getSidebarWidthPx();

      if (!dragRef.current.hasExceededThreshold) {
        const shouldCloseFromOverlayInteraction =
          isOpen &&
          dragRef.current.startedInOverlayHotzone;

        cleanup();
        if (shouldCloseFromOverlayInteraction) {
          setFeedSidebarState({ isOpen: false, dragOffsetPx: 0, isDragging: false });
        }
        return;
      }

      const dx = e.clientX - dragRef.current.startX;
      const dt = performance.now() - dragRef.current.startTime;
      const velocity = dx / dt; // px per ms

      const threshold = sidebarWidth / 2;
      const baseOffset = isOpen ? sidebarWidth : 0;
      const finalOffset = baseOffset + dx;

      let nextIsOpen = isOpen;
      if (velocity > 0.5) nextIsOpen = true;
      else if (velocity < -0.5) nextIsOpen = false;
      else if (finalOffset > threshold) nextIsOpen = true;
      else nextIsOpen = false;

      setFeedSidebarState({
        isOpen: nextIsOpen,
        dragOffsetPx: nextIsOpen ? sidebarWidth : 0,
        isDragging: false,
      });
      cleanup();
    };

    const cleanup = () => {
      dragRef.current.isDragging = false;
      dragRef.current.pointerId = null;
      dragRef.current.hasExceededThreshold = false;
      dragRef.current.startedInOverlayHotzone = false;
      window.removeEventListener("pointermove", onPointerMove, true);
      window.removeEventListener("pointerup", onPointerUp, true);
      window.removeEventListener("pointercancel", onPointerUp, true);
    };

    window.addEventListener("pointerdown", onPointerDown, { passive: false, capture: true });
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      cleanup();
    };
  }, [activeTab, isOpen]);

  // 关闭面板时 isOpen 立刻变 false，但滑出 transform 还在跑 0.3s。
  // 这个标记在关闭动画结束前保持挂载，避免“面板直接消失”而看不到退场动效。
  const [sidebarRendered, setSidebarRendered] = useState(isOpen);
  useEffect(() => {
    if (isOpen || isDragging || dragOffsetPx > 0) setSidebarRendered(true);
  }, [isOpen, isDragging, dragOffsetPx]);
  const handleSidebarTransitionEnd = () => {
    if (!isOpen && !isDragging) setSidebarRendered(false);
  };

  const sidebarWidthPx = getSidebarWidthPx();
  const contentOffsetPx = Math.max(
    0,
    Math.min(Math.round(dragOffsetPx), sidebarWidthPx),
  );
  const contentPushTransform =
    contentOffsetPx > 0 ? `translate3d(${contentOffsetPx}px, 0, 0)` : undefined;
  const transition = isDragging ? "none" : "transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)";
  const immersiveFrame =
    activeTab === 0 ||
    activeTab === 2 ||
    addToStoryOpen ||
    isImmersiveFindFriendsRoute(activeTab, route);
  const frameBackdropClass = immersiveFrame
    ? "bg-tux-v2-brand-tiktok-black"
    : "bg-tux-v2-ui-page-flat-1";

  return (
    <div
      ref={rootRef}
      className={`relative h-full w-full overflow-hidden ${frameBackdropClass}`}
      data-tux-color-scheme={resolvedTheme}
    >
      {/* Sidebar slides in from left */}
      <div 
        className="top-0 left-0 absolute z-[1] h-full pointer-events-auto"
        onTransitionEnd={handleSidebarTransitionEnd}
        style={{ 
          width: `${sidebarWidthPx + 1}px`,
          visibility: sidebarRendered ? "visible" : "hidden",
          transform: `translate3d(${contentOffsetPx - sidebarWidthPx}px, 0, 0)`,
          transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)",
          willChange: "transform",
        }}
      >
        <FeedSidebar />
      </div>
      
      {/* Main Content pushed right */}
      <div
        className={`relative z-[2] h-full w-full ${frameBackdropClass}`}
        style={
          contentPushTransform
            ? {
                transform: contentPushTransform,
                transition,
                willChange: "transform",
              }
            : undefined
        }
      >
        {children}
        {/* Overlay mask using UISheetBackdrop1 */}
        <div 
          className="absolute inset-0"
          style={{ 
            backgroundColor: getColorCSSVar("UISheetBackdrop1"),
            opacity: sidebarWidthPx > 0 ? contentOffsetPx / sidebarWidthPx : 0,
            transition: isDragging ? "none" : "opacity 0.3s cubic-bezier(0.25, 1, 0.5, 1)",
            visibility: sidebarRendered ? "visible" : "hidden",
            pointerEvents: dragOffsetPx > 0 ? "auto" : "none",
            zIndex: 9999, // above everything in main content
          }}
        />
      </div>
    </div>
  );
}
