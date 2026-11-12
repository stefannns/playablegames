import { useId } from "react";

import { SKYLIGHT_AVATAR_PX } from "../inbox/story_skylight.constants";
import {
  LOTTIE_TOTAL_FRAMES,
  StoryPostRingLoader,
  storyPostPlusOpacity,
  storyPostRingRotationDeg,
  type StoryPostRingTimeline,
} from "./story_post_ring_loader";
import { StoryPostPlusBadge } from "./story_post_plus_badge";
import { StoryUserAvatarPhoto } from "./story_user_avatar_photo";

/** End-of-animation snapshot — closed ring, full plus, one full rotation. */
export function frozenStoryPostTimeline(): StoryPostRingTimeline {
  return {
    frame: LOTTIE_TOTAL_FRAMES,
    progress: 1,
    rotationDeg: storyPostRingRotationDeg(1),
  };
}

function StoryPostCreateBadge({
  opacity,
  avatarPx,
}: {
  opacity: number;
  avatarPx: number;
}) {
  return <StoryPostPlusBadge avatarPx={avatarPx} opacity={opacity} ariaHidden />;
}

/**
 * Create-cell avatar used during publish fly and after settle — same photo,
 * ring, and plus badge so the final frame matches the in-flight appearance.
 */
export function StoryPostCreateAvatar({
  timeline,
  settled = false,
  sizePx = SKYLIGHT_AVATAR_PX,
}: {
  timeline: StoryPostRingTimeline;
  settled?: boolean;
  sizePx?: number;
}) {
  const gradientId = useId().replace(/:/g, "");
  const plusOpacity = storyPostPlusOpacity(timeline.progress);

  return (
    <div className="relative h-full w-full overflow-visible">
      <StoryPostRingLoader
        frame={timeline.frame}
        rotationDeg={timeline.rotationDeg}
        gradientId={`story-post-ring-${gradientId}`}
        sizePx={sizePx}
        forceFullRing={settled}
      />
      <div className="absolute inset-0 overflow-hidden rounded-full bg-black">
        <StoryUserAvatarPhoto />
      </div>
      <StoryPostCreateBadge opacity={plusOpacity} avatarPx={sizePx} />
    </div>
  );
}
