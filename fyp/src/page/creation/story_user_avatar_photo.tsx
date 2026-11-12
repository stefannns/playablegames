import { currentUserAvatarSrc } from "../../utils/local_avatar";

/**
 * Square-cropped current-user photo — same source and crop on every story surface
 * (24px editor chip → 78px inbox → 96px profile) so publish fly has no jump.
 */
export function StoryUserAvatarPhoto({ alt = "" }: { alt?: string }) {
  return (
    <img
      alt={alt}
      src={currentUserAvatarSrc()}
      className="absolute inset-0 h-full w-full object-cover object-center"
      draggable={false}
    />
  );
}
