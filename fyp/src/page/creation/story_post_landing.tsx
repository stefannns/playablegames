import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useAppNavigation } from "../../context/app_navigation";
import { appPathForTab } from "../../routes/app_route_tree";
import {
  completeStoryPost,
  useAddToStoryStore,
  type StoryPostLanding,
} from "./add_to_story_store";
import { storyPostTargetFor } from "./story_post.constants";
import { StoryPostCreateAvatar } from "./story_post_create_avatar";
import {
  isStoryPostRingClosed,
  STORY_POST_FALLBACK_BUFFER_MS,
  STORY_POST_FLY_DURATION_MS,
  STORY_POST_TOTAL_MS,
  useStoryPostRingTimeline,
} from "./story_post_ring_loader";

const FLY_DURATION_MS = STORY_POST_FLY_DURATION_MS;
const FLY_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
/** Avatar + ring fly above the app shell. */
const STORY_POST_FLY_Z_INDEX = 5000;
/** Initial fly size relative to the settled avatar diameter. */
const FLY_START_SCALE = 1.3;

type FlyFrame = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function centerFlyFrame(centerX: number, centerY: number, sizePx: number): FlyFrame {
  return {
    left: centerX - sizePx / 2,
    top: centerY - sizePx / 2,
    width: sizePx,
    height: sizePx,
  };
}

/** Starts centered on the editor canvas at settled avatar size (scale applied separately). */
function canvasCenterFlyStart(rect: DOMRectReadOnly, avatarPx: number): FlyFrame {
  return centerFlyFrame(rect.left + rect.width / 2, rect.top + rect.height / 2, avatarPx);
}

function targetRectToFlyEnd(rect: DOMRectReadOnly, avatarPx: number): FlyFrame {
  return centerFlyFrame(rect.left + rect.width / 2, rect.top + rect.height / 2, avatarPx);
}

function waitForPostTarget(
  targetAttr: string,
  onReady: (target: HTMLElement) => void,
  onFail: () => void,
) {
  let attempts = 0;

  const tick = () => {
    const target = document.querySelector<HTMLElement>(
      `[data-story-post-target="${targetAttr}"]`,
    );
    if (target && !target.closest("[hidden]")) {
      onReady(target);
      return;
    }

    attempts += 1;
    if (attempts > 40) {
      onFail();
      return;
    }

    window.requestAnimationFrame(tick);
  };

  window.requestAnimationFrame(tick);
}

function StoryPostFlyLayer({ landing }: { landing: StoryPostLanding }) {
  const { navigate } = useAppNavigation();
  const ringTimeline = useStoryPostRingTimeline(true);
  const postTarget = storyPostTargetFor(landing.destination);
  const avatarPx = postTarget.avatarPx;
  const fromFrame = canvasCenterFlyStart(landing.fromRect, avatarPx);
  const [frame, setFrame] = useState<FlyFrame>(fromFrame);
  const [flyScale, setFlyScale] = useState(FLY_START_SCALE);
  const [anchorTarget, setAnchorTarget] = useState<HTMLElement | null>(null);
  const finishTimerRef = useRef<number | null>(null);
  const anchorTimerRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    if (completedRef.current) {
      return;
    }
    if (!isStoryPostRingClosed(ringTimeline.frame, ringTimeline.rotationDeg)) {
      return;
    }

    // Let the closed full ring paint once before swapping to settled.
    const raf = window.requestAnimationFrame(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        completeStoryPost();
      }
    });

    return () => window.cancelAnimationFrame(raf);
  }, [ringTimeline.frame, ringTimeline.rotationDeg]);

  useEffect(() => {
    navigate(appPathForTab(postTarget.tab), { replace: true });

    let cancelled = false;

    waitForPostTarget(
      postTarget.targetAttr,
      (target) => {
        if (cancelled) {
          return;
        }

        const toFrame = targetRectToFlyEnd(target.getBoundingClientRect(), avatarPx);

        window.requestAnimationFrame(() => {
          if (cancelled) {
            return;
          }
          window.requestAnimationFrame(() => {
            if (!cancelled) {
              setFrame(toFrame);
              setFlyScale(1);
            }
          });
        });

        anchorTimerRef.current = window.setTimeout(() => {
          if (!cancelled) {
            setAnchorTarget(target);
          }
          anchorTimerRef.current = null;
        }, FLY_DURATION_MS);

        // Fallback if the ring timeline stalls before the close frame.
        finishTimerRef.current = window.setTimeout(() => {
          if (!cancelled && !completedRef.current) {
            completedRef.current = true;
            completeStoryPost();
          }
          finishTimerRef.current = null;
        }, STORY_POST_TOTAL_MS + STORY_POST_FALLBACK_BUFFER_MS);
      },
      () => {
        if (!cancelled && !completedRef.current) {
          completedRef.current = true;
          completeStoryPost();
        }
      },
    );

    return () => {
      cancelled = true;
      if (finishTimerRef.current != null) {
        window.clearTimeout(finishTimerRef.current);
        finishTimerRef.current = null;
      }
      if (anchorTimerRef.current != null) {
        window.clearTimeout(anchorTimerRef.current);
        anchorTimerRef.current = null;
      }
    };
  }, [avatarPx, landing, navigate, postTarget]);

  const flyTransition = `left ${FLY_DURATION_MS}ms ${FLY_EASE}, top ${FLY_DURATION_MS}ms ${FLY_EASE}, transform ${FLY_DURATION_MS}ms ${FLY_EASE}`;

  const content = <StoryPostCreateAvatar timeline={ringTimeline} sizePx={avatarPx} />;

  if (anchorTarget) {
    return createPortal(
      <div className="pointer-events-none absolute inset-0 z-0 overflow-visible">{content}</div>,
      anchorTarget,
    );
  }

  return createPortal(
    <div
      className="pointer-events-none fixed overflow-visible"
      style={{
        left: frame.left,
        top: frame.top,
        width: frame.width,
        height: frame.height,
        zIndex: STORY_POST_FLY_Z_INDEX,
        transform: `scale(${flyScale})`,
        transformOrigin: "center center",
        transition: flyTransition,
        willChange: "left, top, transform",
      }}
    >
      {content}
    </div>,
    document.body,
  );
}

/**
 * Publish fly: user avatar + story ring from 1.3× scale at the editor canvas
 * center down to the inbox Create cell or profile avatar.
 */
export default function StoryPostLandingLayer() {
  const { postLanding } = useAddToStoryStore();

  if (!postLanding) {
    return null;
  }

  return <StoryPostFlyLayer landing={postLanding} />;
}
