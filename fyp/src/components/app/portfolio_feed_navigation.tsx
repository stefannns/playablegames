/** Original App.tsx navigation components, with no page mounts or route actions. */
import { useLayoutEffect, useRef } from "react";
import {
  IconExpExp02IconFriends, IconExpExp02IconFriendsFill,
  IconExpExp02IconHome, IconExpExp02IconHomeFill,
  IconExpExp02IconInbox, IconExpExp02IconInboxFill,
  IconExpExp02IconProfile, IconExpExp02IconProfileFill,
} from "@byted-tiktok/tux-icons";
import { AppTabBarNav } from "./tabbar";
import CreationIcon from "./creation_icon";

const tabs = [
  { icon: IconExpExp02IconHome, activeIcon: IconExpExp02IconHomeFill, text: "Home" },
  { icon: IconExpExp02IconFriends, activeIcon: IconExpExp02IconFriendsFill, text: "Friends" },
  { icon: CreationIcon, activeIcon: CreationIcon, ariaLabel: "Create" },
  { icon: IconExpExp02IconInbox, activeIcon: IconExpExp02IconInboxFill, text: "Inbox" },
  { icon: IconExpExp02IconProfile, activeIcon: IconExpExp02IconProfileFill, text: "Profile" },
] as const;

export function PortfolioFeedNavigation() {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const nav = ref.current;
    const page = nav?.closest<HTMLElement>(".home-feed-page");
    if (!nav || !page) return;
    // Measure the reused component, including its AppFrame-owned inset/spacer.
    // Do not introduce a second safe area or guess a tab-bar height.
    const previous = page.style.getPropertyValue("--app-tabbar-height");
    const measure = () => page.style.setProperty("--app-tabbar-height", `${nav.offsetHeight}px`);
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    measure();
    return () => {
      observer.disconnect();
      if (previous) page.style.setProperty("--app-tabbar-height", previous);
      else page.style.removeProperty("--app-tabbar-height");
    };
  }, []);
  return <div ref={ref} data-portfolio-feed-navigation>
    <AppTabBarNav tabs={tabs} activeIndex={0} onChange={() => {}} immersive displayOnly/>
  </div>;
}
