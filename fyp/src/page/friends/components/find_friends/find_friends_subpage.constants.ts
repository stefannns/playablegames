import type { FindFriendsStep } from "../../../../routes/app_route_tree";

/** Always-dark, full-bleed sub-pages — use {@link FindFriendsImmersiveShell}. */
export const FIND_FRIENDS_IMMERSIVE_SUBPAGES = [
  "connect-now",
  "qr",
  "scan",
] as const satisfies readonly FindFriendsStep[];

export type FindFriendsImmersiveSubpage =
  (typeof FIND_FRIENDS_IMMERSIVE_SUBPAGES)[number];

export function isFindFriendsImmersiveSubpage(
  step: FindFriendsStep | null | undefined,
): step is FindFriendsImmersiveSubpage {
  return (
    step != null &&
    (FIND_FRIENDS_IMMERSIVE_SUBPAGES as readonly string[]).includes(step)
  );
}
