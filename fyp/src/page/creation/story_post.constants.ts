import type { AddToStorySource } from "./add_to_story_store";
import { SKYLIGHT_AVATAR_PX } from "../inbox/story_skylight.constants";

/** Profile header avatar — landing target when publishing from profile. */
export const PROFILE_STORY_AVATAR_PX = 96;

export type StoryPostTargetConfig = {
  tab: "inbox" | "profile";
  targetAttr: string;
  avatarPx: number;
};

const STORY_POST_TARGETS: Record<AddToStorySource, StoryPostTargetConfig> = {
  "inbox-create": {
    tab: "inbox",
    targetAttr: "create",
    avatarPx: SKYLIGHT_AVATAR_PX,
  },
  "profile-avatar": {
    tab: "profile",
    targetAttr: "profile",
    avatarPx: PROFILE_STORY_AVATAR_PX,
  },
};

export function storyPostTargetFor(source: AddToStorySource): StoryPostTargetConfig {
  return STORY_POST_TARGETS[source];
}
