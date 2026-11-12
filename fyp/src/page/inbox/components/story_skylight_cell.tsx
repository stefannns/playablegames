import { TUXText } from "@byted-tiktok/tux-web";
import { useRef } from "react";

import {
  openAddToStory,
  useAddToStoryStore,
  useStoryPostRingSettled,
} from "../../creation/add_to_story_store";
import {
  frozenStoryPostTimeline,
  StoryPostCreateAvatar,
} from "../../creation/story_post_create_avatar";
import { canOpenStory, type StoryCellSummary } from "../../story/story.types";
import { SKYLIGHT_AVATAR_PX } from "../story_skylight.constants";
import { SocialAvatar } from "./social_avatar";
import { ThoughtBubble } from "./thought_bubble";

export type StorySkylightCellStory = StoryCellSummary;

type StorySkylightCellProps = {
  story: StorySkylightCellStory;
  onOpenStory?: (story: StorySkylightCellStory, trigger: HTMLElement) => void;
};

export const canOpenStorySkylightCell = canOpenStory;

export function StorySkylightCell({ story, onOpenStory }: StorySkylightCellProps) {
  const { id, name, src, hasRing, ringVariant, hasDot, hasBadge, badgeVariant, bubble } = story;
  const avatarRef = useRef<HTMLDivElement | null>(null);
  const { postLanding } = useAddToStoryStore();
  const storyRingSettled = useStoryPostRingSettled();
  const isCreate = id === "create";
  const isInboxPostActive = isCreate && postLanding?.destination === "inbox-create";
  const showSettledAvatar = isCreate && storyRingSettled;
  const canOpenStory = canOpenStorySkylightCell(story);

  return (
    <div
      className="relative flex-none w-[100px] h-[123px]"
      data-story-cell-id={story.id}
    >
      <button
        type="button"
        className="relative block h-full w-full rounded-(--tux-v2-radius-container-level0-large) text-left outline-none"
        aria-label={isCreate ? "Add to story" : canOpenStory ? `Open story for ${name}` : `${name}`}
        aria-disabled={!isCreate && !canOpenStory}
        onClick={(event) => {
          event.currentTarget.blur();
          if (isCreate) {
            openAddToStory("inbox-create");
            return;
          }
          if (!canOpenStory) {
            return;
          }
          onOpenStory?.(story, avatarRef.current ?? event.currentTarget);
        }}
      >
        <div
          ref={avatarRef}
          className="top-2.5 left-1/2 z-10 absolute overflow-visible shrink-0"
          data-story-avatar-id={story.id}
          style={{
            width: SKYLIGHT_AVATAR_PX,
            height: SKYLIGHT_AVATAR_PX,
            transform: "translateX(-50%)",
          }}
        >
          {isCreate ? (
            <div
              className="absolute inset-0 overflow-visible"
              data-story-post-target="create"
            />
          ) : null}
          {!isInboxPostActive ? (
            <div className="z-1 absolute inset-0 overflow-visible">
              {showSettledAvatar ? (
                <StoryPostCreateAvatar timeline={frozenStoryPostTimeline()} settled />
              ) : (
                <SocialAvatar
                  src={src}
                  alt={name}
                  size={SKYLIGHT_AVATAR_PX}
                  hasRing={hasRing}
                  ringVariant={ringVariant}
                  hasDot={hasDot}
                  hasBadge={hasBadge}
                  badgeVariant={badgeVariant}
                  squarePhoto={isCreate}
                />
              )}
            </div>
          ) : null}
        </div>
        <TUXText
          as="div"
          font="TikTokFont"
          typographyPreset="P3-Semibold"
          color="UIText1"
          align="center"
          textDisplay="lineBreak"
          className="left-1/2 absolute px-1"
          style={{
            top: "100px",
            width: "96px",
            lineHeight: "16px",
            transform: "translateX(-50%)",
            overflowWrap: "anywhere",
          }}
        >
          {name}
        </TUXText>
      </button>
      {bubble ? (
        <div
          className="top-2.5 left-1/2 z-20 absolute flex flex-col items-center pointer-events-none"
          style={{
            transform: "translateX(-50%) translateY(calc(-100% + 18px))",
          }}
        >
          <ThoughtBubble text={bubble.text} isFilled={bubble.filled} />
        </div>
      ) : null}
    </div>
  );
}
