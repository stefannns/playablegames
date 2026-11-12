import type { PlayableContentId } from "./playable_content";
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAppNavigation } from "../../../context/app_navigation";
import { APP_Z_OVERLAY } from "../../../components/sys/app_z_index";
import { PlayableDetailPage } from "./playable_feed";

/** Play mode changes only the chrome. The feed's stage stays mounted in its pager. */
export function usePlayableNavigation(overlayRoot: HTMLElement | null, reviewPaging?: {onNext: () => void; onPrevious: () => void}) {
  const { route, navigate } = useAppNavigation();
  const legacyDetail = route?.tab === "home" && route.sub.screen === "playable";
  const [playing, setPlaying] = useState(legacyDetail);
  const [contentId, setContentId] = useState<PlayableContentId>("playable-hotpot");

  // Keep the real chrome mounted while hidden so font wrapping, safe areas and
  // viewport changes all contribute to the same stage geometry in both modes.
  useLayoutEffect(() => {
    if (!overlayRoot) return;
    const header = overlayRoot.querySelector<HTMLElement>(".playable-detail-header");
    const footer = overlayRoot.querySelector<HTMLElement>(".playable-detail-footer");
    if (!header || !footer) return;
    const measure = () => {
      const screenHeight = overlayRoot.getBoundingClientRect().height;
      const headerHeight = header.getBoundingClientRect().height;
      const footerHeight = footer.getBoundingClientRect().height;
      overlayRoot.style.setProperty("--playable-header-height", `${headerHeight}px`);
      overlayRoot.style.setProperty("--playable-footer-height", `${footerHeight}px`);
      overlayRoot.style.setProperty("--playable-stage-height", `${Math.max(0, screenHeight - headerHeight - footerHeight)}px`);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(overlayRoot);
    observer.observe(header);
    observer.observe(footer);
    measure();
    return () => {
      observer.disconnect();
      for (const key of ["--playable-header-height", "--playable-footer-height", "--playable-stage-height"]) overlayRoot.style.removeProperty(key);
    };
  }, [overlayRoot]);

  useLayoutEffect(() => { if (legacyDetail) setPlaying(true); }, [legacyDetail]);
  // The overlay sits above every tab, so play mode ends as soon as the app leaves Home (e.g. Clip →
  // edit → Next opens Creation's publish page); otherwise the playable chrome would float over it.
  const onHome = route?.tab === "home";
  useLayoutEffect(() => { if (!onHome) setPlaying(false); }, [onHome]);
  function close() {
    setPlaying(false);
    if (legacyDetail) navigate("/app/home?feed=playable-hotpot", { replace: true });
  }
  return {
    open: (id: PlayableContentId) => { setContentId(id); setPlaying(true); }, playing, contentId, close,
    overlay: overlayRoot ? createPortal(
      <div className="playable-mode-overlay absolute inset-0" data-playing={playing} aria-hidden={!playing} style={{ zIndex: APP_Z_OVERLAY }}>
        <PlayableDetailPage onBack={close} active={playing} contentId={contentId} onNext={reviewPaging?.onNext} onPrevious={reviewPaging?.onPrevious} />
      </div>, overlayRoot.querySelector<HTMLElement>('[data-app-frame-overlays="true"]') ?? overlayRoot,
    ) : null,
  };
}
