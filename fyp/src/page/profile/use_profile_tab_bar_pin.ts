import {
  useCallback,
  useLayoutEffect,
  type RefObject,
} from "react";

/**
 * Pin profile TUXTabBar under the top NavBar while scrolling.
 *
 * CSS `position: sticky` is unreliable here (FeedSidebarWrapper / guest-profile
 * parallax layers use transform on ancestors). Uses a sentinel + live geometry
 * each scroll frame so pin position stays correct after layout shifts.
 */
/** Cover sub-pixel gap between NavBar and pinned TUXTabBar. */
const PROFILE_TAB_PIN_OVERLAP_PX = 1;
const PROFILE_TAB_PIN_COVER_PX = 12;

export function useProfileTabBarPin(
  scrollContainerRef: RefObject<HTMLDivElement>,
  navChromeRef: RefObject<HTMLDivElement>,
  tabBarRef: RefObject<HTMLDivElement>,
  tabBarSentinelRef: RefObject<HTMLDivElement>,
  remeasureKey?: string,
): {
  updateTabBarPin: () => void;
} {

  const updateTabBarPin = useCallback(() => {
    const scrollEl = scrollContainerRef.current;
    const navChromeEl = navChromeRef.current;
    const tabBarEl = tabBarRef.current;
    const sentinelEl = tabBarSentinelRef.current;
    if (!scrollEl || !tabBarEl || !sentinelEl) return;

    const scrollTopEdge = scrollEl.getBoundingClientRect().top;
    const navBottom = navChromeEl?.getBoundingClientRect().bottom ?? scrollTopEdge;
    // Content peeks through at the scroll viewport top — align tab to that edge.
    const pinTopEdge = Math.min(scrollTopEdge, navBottom);

    tabBarEl.style.transform = "";
    tabBarEl.style.boxShadow = "";
    tabBarEl.removeAttribute("data-profile-tab-pinned");

    const sentinelTop = sentinelEl.getBoundingClientRect().top;
    const tabTop = tabBarEl.getBoundingClientRect().top;

    if (sentinelTop < pinTopEdge - 0.5) {
      const delta =
        Math.round(pinTopEdge - tabTop) - PROFILE_TAB_PIN_OVERLAP_PX;
      if (delta !== 0) {
        tabBarEl.style.transform = `translate3d(0, ${delta}px, 0)`;
      }
      tabBarEl.style.boxShadow = `0 -${PROFILE_TAB_PIN_COVER_PX}px 0 0 var(--tux-v2-color-ui-page-flat-1)`;
      tabBarEl.setAttribute("data-profile-tab-pinned", "true");
    }
  }, [navChromeRef, scrollContainerRef, tabBarRef]);

  useLayoutEffect(() => {
    updateTabBarPin();
    window.addEventListener("resize", updateTabBarPin);
    return () => window.removeEventListener("resize", updateTabBarPin);
  }, [updateTabBarPin, remeasureKey]);

  return { updateTabBarPin };
}
