import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";

import { PROFILE_TAB_BAR_CHROME_FALLBACK_HEIGHT_PX } from "./profile_chrome.constants";

function scrollOffsetTop(
  scrollEl: HTMLDivElement,
  el: HTMLElement,
): number {
  const scrollRect = scrollEl.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  return scrollEl.scrollTop + (rect.top - scrollRect.top);
}

/**
 * Visual height reserved at the scroll viewport top by the (pinned) tab bar chrome.
 * Uses live geometry so translateY pin + separator are included.
 */
function tabBarBottomInsetFromScrollViewport(
  scrollEl: HTMLDivElement,
  tabBarEl: HTMLElement,
): number {
  const scrollRect = scrollEl.getBoundingClientRect();
  const tabBarRect = tabBarEl.getBoundingClientRect();
  const inset = tabBarRect.bottom - scrollRect.top;
  if (inset > 0) return inset;
  if (tabBarEl.offsetHeight > 0) return tabBarEl.offsetHeight;
  return PROFILE_TAB_BAR_CHROME_FALLBACK_HEIGHT_PX;
}

/**
 * scrollTop so the active tab panel starts right below the pinned TUXTabBar.
 */
function tabSwitchScrollTop(
  scrollEl: HTMLDivElement,
  tabContentEl: HTMLElement,
  tabBarEl: HTMLElement,
): number {
  const activePanel =
    (tabContentEl.firstElementChild as HTMLElement | null) ?? tabContentEl;
  const panelTop = scrollOffsetTop(scrollEl, activePanel);
  const tabBarInset = tabBarBottomInsetFromScrollViewport(scrollEl, tabBarEl);
  return panelTop - tabBarInset;
}

function isTabBarPinned(
  scrollEl: HTMLDivElement,
  sentinelEl: HTMLElement,
  navChromeEl: HTMLElement | null,
): boolean {
  const pinTopEdge = Math.min(
    scrollEl.getBoundingClientRect().top,
    navChromeEl?.getBoundingClientRect().bottom ??
      scrollEl.getBoundingClientRect().top,
  );
  return sentinelEl.getBoundingClientRect().top < pinTopEdge - 0.5;
}

/** User has scrolled at least into the tab-bar zone (not still browsing header only). */
function isInTabContentZone(
  scrollEl: HTMLDivElement,
  sentinelEl: HTMLElement,
): boolean {
  return scrollEl.scrollTop >= sentinelEl.offsetTop - 1;
}

/** Tab bar 已吸顶，或 scroll 已滚过 tab bar 区域 → 切换 tab 时重置内容 scroll。 */
function shouldResetTabContentScroll(
  scrollEl: HTMLDivElement,
  sentinelEl: HTMLElement,
  navChromeEl: HTMLElement | null,
): boolean {
  return (
    isTabBarPinned(scrollEl, sentinelEl, navChromeEl) ||
    isInTabContentZone(scrollEl, sentinelEl)
  );
}

/**
 * Profile 顶栏 Tab 切换时的滚动策略（所有 tab 统一）：
 * - Tab bar 已吸顶 / 已滚过 tab bar：新 tab 从该 tab 内容块顶部开始
 * - 仍在 header 区域：保持当前 scrollTop
 */
export function useProfileTabScrollPreservation<T extends string>(
  activeTopTab: T,
  setActiveTopTab: (key: T) => void,
  tabBarSentinelRef?: RefObject<HTMLDivElement>,
  tabBarRef?: RefObject<HTMLDivElement>,
  navChromeRef?: RefObject<HTMLDivElement>,
  onAfterScrollAdjust?: () => void,
): {
  scrollContainerRef: RefObject<HTMLDivElement>;
  tabContentRef: RefObject<HTMLDivElement>;
  handleTopTabChange: (key: string) => void;
} {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);
  const prevActiveTopTabRef = useRef(activeTopTab);

  const applyTabSwitchScroll = useCallback(() => {
    const scrollEl = scrollContainerRef.current;
    const tabContentEl = tabContentRef.current;
    const tabBarEl = tabBarRef?.current ?? null;
    if (!scrollEl || !tabContentEl || !tabBarEl) return;

    onAfterScrollAdjust?.();
    scrollEl.scrollTop = tabSwitchScrollTop(scrollEl, tabContentEl, tabBarEl);
    onAfterScrollAdjust?.();
  }, [onAfterScrollAdjust, tabBarRef]);

  const handleTopTabChange = useCallback(
    (key: string) => {
      if (key === activeTopTab) return;

      const tabContentEl = tabContentRef.current;
      if (tabContentEl) {
        tabContentEl.style.minHeight = "";
      }

      setActiveTopTab(key as T);
    },
    [activeTopTab, setActiveTopTab],
  );

  useLayoutEffect(() => {
    const tabChanged = prevActiveTopTabRef.current !== activeTopTab;
    prevActiveTopTabRef.current = activeTopTab;
    if (!tabChanged) return;

    const scrollEl = scrollContainerRef.current;
    const sentinelEl = tabBarSentinelRef?.current ?? null;
    if (!scrollEl || !sentinelEl) return;

    if (
      !shouldResetTabContentScroll(
        scrollEl,
        sentinelEl,
        navChromeRef?.current ?? null,
      )
    ) {
      return;
    }

    applyTabSwitchScroll();
    requestAnimationFrame(() => {
      applyTabSwitchScroll();
    });
  }, [
    activeTopTab,
    applyTabSwitchScroll,
    navChromeRef,
    tabBarSentinelRef,
  ]);

  return { scrollContainerRef, tabContentRef, handleTopTabChange };
}
