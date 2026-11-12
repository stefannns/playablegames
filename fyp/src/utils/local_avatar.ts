/**
 * 本地头像占位（`public/resource/avatar/` → `/resource/avatar/...`）。
 *
 * | 档位 | 目录 | 适用 CSS 边长 | 命名 |
 * |------|------|---------------|------|
 * | small | `small/` | ≤96px | `avatar-01.jpg` … `avatar-60.jpg` |
 * | multi | `multi/` | 96–176px | `avatar-01.png` … `avatar-05.png`（缺则回退 small） |
 * | big | `big/` | >176px | `avatar-01.png` … `avatar-07.png`（缺则 multi→small） |
 *
 * API：`localAvatarUrlForDisplay(cssPx, slot)`、`avatarSlotFromId(id)`、`localAvatarUrl(tier, slot)`。
 * 业务勿写死外链或 picsum；demo 数据参考 home / inbox / profile 配置。
 */

export type LocalAvatarTier = "small" | "multi" | "big";

const PAD2 = (n: number) => String(Math.min(Math.max(n, 1), 99)).padStart(2, "0");

/** Map arbitrary id string to a stable slot in 1..modulo (default 60, matches small library size). */
export function avatarSlotFromId(id: string, modulo = 60): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (Math.abs(h) % modulo) + 1;
}

function clampSlot(slot: number, modulo: number): number {
  return ((Math.abs(slot) - 1) % modulo) + 1;
}

/** Resolved URL for a tier + identity slot (1-based). Falls back to `small` when multi/big slot lacks a matching file. */
export function localAvatarUrl(tier: LocalAvatarTier, slot: number): string {
  const s60 = clampSlot(slot, 60);
  const nn = PAD2(s60);

  if (tier === "small") {
    return `/resource/avatar/small/avatar-${nn}.jpg`;
  }

  if (tier === "multi") {
    if (s60 <= 5) {
      return `/resource/avatar/multi/avatar-${PAD2(s60)}.png`;
    }
    return `/resource/avatar/small/avatar-${nn}.jpg`;
  }

  // big
  if (s60 <= 7) {
    return `/resource/avatar/big/avatar-${PAD2(s60)}.png`;
  }
  if (s60 <= 5) {
    return `/resource/avatar/multi/avatar-${PAD2(s60)}.png`;
  }
  return `/resource/avatar/small/avatar-${nn}.jpg`;
}

/**
 * Choose tier from approximate rendered CSS size (max of width/height), then resolve URL.
 * Thresholds align with asset resolutions under `public/resource/avatar/`.
 */
export function localAvatarTierForDisplaySize(cssPx: number): LocalAvatarTier {
  if (cssPx <= 96) return "small";
  if (cssPx <= 176) return "multi";
  return "big";
}

export function localAvatarUrlForDisplay(cssPx: number, slot: number): string {
  return localAvatarUrl(localAvatarTierForDisplaySize(cssPx), slot);
}

/** Stable creator slot for home feed + guest profile — one identity per `content.id`. */
export function creatorAvatarSlotForFeedId(feedId: string): number {
  const feedMatch = /^feed-(\d+)$/.exec(feedId);
  if (feedMatch) {
    return Number.parseInt(feedMatch[1], 10);
  }
  const slotById: Record<string, number> = {
    "feed-card-slot": 22,
    "photo-feed-2": 21,
    "photo-feed-4": 26,
  };
  return slotById[feedId] ?? avatarSlotFromId(feedId);
}

/** Feed rail (44px) and guest profile (96px) must share the same slot — only tier differs. */
export function creatorAvatarUrlForFeedDisplay(cssPx: number, feedId: string): string {
  return localAvatarUrlForDisplay(cssPx, creatorAvatarSlotForFeedId(feedId));
}

/** Signed-in user identity slot — shared across profile, inbox Create, and story publish. */
export const CURRENT_USER_AVATAR_SLOT = 1;

/** Main profile (Coldplay demo) — `public/resource/avatar/big/avatar-09.jpg`. */
export const SELF_PROFILE_AVATAR_SRC = "/resource/avatar/big/avatar-09.jpg";

/**
 * One canonical asset for the current user — profile header, inbox Create, story fly.
 */
export function currentUserAvatarSrc(): string {
  return SELF_PROFILE_AVATAR_SRC;
}
