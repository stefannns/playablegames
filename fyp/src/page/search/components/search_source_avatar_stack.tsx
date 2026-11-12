import { TUXAvatarStack } from "@byted-tiktok/tux-web";

import { avatarSlotFromId, localAvatarUrlForDisplay } from "../../../utils/local_avatar";

import "./search_source_avatar_stack.css";

const SOURCE_AVATAR_SLOTS = [
  avatarSlotFromId("search-source-1"),
  avatarSlotFromId("search-source-2"),
  avatarSlotFromId("search-source-3"),
] as const;
const SOURCE_AVATAR_SIZE_PX = 16;

type SearchSourceAvatarStackProps = {
  extraCount: number;
  avatarCount?: 2 | 3;
};

export function SearchSourceAvatarStack({
  extraCount,
  avatarCount = 3,
}: SearchSourceAvatarStackProps) {
  const visibleSlots = SOURCE_AVATAR_SLOTS.slice(0, avatarCount);

  return (
    <div className="search-source-avatar-stack flex items-center">
      <TUXAvatarStack
        size="tiny"
        stackMode="lastOnTop"
        avatars={visibleSlots.map((slot) => ({
          src: localAvatarUrlForDisplay(SOURCE_AVATAR_SIZE_PX, slot),
          alt: "",
        }))}
        extraNumber={extraCount}
      />
    </div>
  );
}
