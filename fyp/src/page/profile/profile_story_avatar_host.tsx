import {
  openAddToStory,
  useAddToStoryStore,
  useStoryPostRingSettled,
} from "../creation/add_to_story_store";
import {
  frozenStoryPostTimeline,
  StoryPostCreateAvatar,
} from "../creation/story_post_create_avatar";
import { PROFILE_STORY_AVATAR_PX } from "../creation/story_post.constants";
import { storyRingInsetPx } from "../creation/story_post_ring_loader";
import { StoryPostPlusBadge } from "../creation/story_post_plus_badge";
import { StoryUserAvatarPhoto } from "../creation/story_user_avatar_photo";

/**
 * Profile header avatar + publish landing target.
 *
 * The portal host (`data-story-post-target`) stays empty so createPortal never
 * fights React children. Settled / static avatars render in a sibling layer.
 */
export function ProfileStoryAvatarHost() {
  const { postLanding } = useAddToStoryStore();
  const storyRingSettled = useStoryPostRingSettled();
  const ringInset = storyRingInsetPx(PROFILE_STORY_AVATAR_PX);
  const outerPx = PROFILE_STORY_AVATAR_PX + ringInset * 2;
  const isProfilePostActive = postLanding?.destination === "profile-avatar";
  const showSettledAvatar = storyRingSettled;

  const innerBox = {
    top: ringInset,
    left: ringInset,
    width: PROFILE_STORY_AVATAR_PX,
    height: PROFILE_STORY_AVATAR_PX,
  } as const;

  const openStory = () => openAddToStory("profile-avatar");

  return (
    <div
      className="absolute overflow-visible"
      style={{
        top: `${8 - ringInset}px`,
        right: `${16 - ringInset}px`,
        width: outerPx,
        height: outerPx,
      }}
    >
      <div
        className="absolute overflow-visible"
        style={innerBox}
        data-story-post-target="profile"
      />
      {!isProfilePostActive ? (
        <div className="z-1 absolute overflow-visible" style={innerBox}>
          {showSettledAvatar ? (
            <button
              type="button"
              className="relative outline-none w-full h-full active:scale-97 transition-transform"
              onClick={openStory}
              aria-label="Add to story"
            >
              <StoryPostCreateAvatar
                timeline={frozenStoryPostTimeline()}
                settled
                sizePx={PROFILE_STORY_AVATAR_PX}
              />
            </button>
          ) : (
            <div className="relative w-full h-full">
              <button
                type="button"
                className="relative rounded-full outline-none w-full h-full overflow-hidden active:scale-97 transition-transform"
                style={{ border: "1px solid var(--tux-v2-color-ui-shape-neutral-3)" }}
                onClick={openStory}
                aria-label="Profile avatar"
              >
                <StoryUserAvatarPhoto alt="Profile avatar" />
              </button>
              <StoryPostPlusBadge
                avatarPx={PROFILE_STORY_AVATAR_PX}
                onClick={(e) => {
                  e.stopPropagation();
                  openStory();
                }}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
