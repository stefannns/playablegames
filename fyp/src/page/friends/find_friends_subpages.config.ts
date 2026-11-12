import { friendsAuthorAvatarUrl, friendsPostThumbUrl } from "./friends_feed.config";

/**
 * UI-only placeholder data for the Find Friends sub-pages (Connect Now, My
 * College, QR code, Contacts / Facebook, Invite). No real users, no networking.
 */

export function ffAvatar(authorId: string, cssPx: number): string {
  return friendsAuthorAvatarUrl(authorId, cssPx);
}

export function ffThumb(thumbIndex: number): string {
  return friendsPostThumbUrl(thumbIndex);
}

/* ----------------------------- My College: Posts ----------------------------- */

export type CollegePost = {
  id: string;
  thumbIndex: number;
  caption: string;
  authorId: string;
  authorName: string;
  likes: string;
  /** Taller card for the masonry look. */
  tall?: boolean;
};

export const COLLEGE_POSTS: CollegePost[] = [
  { id: "cp-1", thumbIndex: 3, caption: "My gofund me is in my bio 🤍 It's honestly heartbreaki…", authorId: "lexi", authorName: "n.j.lov", likes: "1.5M", tall: true },
  { id: "cp-2", thumbIndex: 9, caption: "Condenadas al éxito 👍🏽", authorId: "yuyao", authorName: "Evelyn", likes: "288.8K" },
  { id: "cp-3", thumbIndex: 14, caption: "Dear Lord, when I get to…", authorId: "h1", authorName: "Nextstopisnyc", likes: "276.4K", tall: true },
  { id: "cp-4", thumbIndex: 18, caption: "Next 4!!", authorId: "taotao", authorName: "Abbey", likes: "398.5K" },
  { id: "cp-5", thumbIndex: 5, caption: "Nigerian student core:", authorId: "chujie", authorName: "kelechi", likes: "120.1K" },
  { id: "cp-6", thumbIndex: 22, caption: "first week of finals szn", authorId: "s1", authorName: "mina", likes: "44.2K", tall: true },
];

/* ---------------------------- My College: Members ---------------------------- */

export type CollegeMember = {
  id: string;
  name: string;
  relation: string;
  gradYear?: string;
  avatarAuthorId: string;
  hasRing?: boolean;
  postThumbIndices: number[];
};

export const COLLEGE_MEMBERS: CollegeMember[] = [
  { id: "cm-1", name: "Nikita", relation: "Friends", gradYear: "Grad '27", avatarAuthorId: "lexi", postThumbIndices: [3, 9, 14, 18] },
  { id: "cm-2", name: "Yuze", relation: "Friends", avatarAuthorId: "frank", postThumbIndices: [2, 11, 22, 7] },
  { id: "cm-3", name: "Lil.Peanut.Hua", relation: "Friends", avatarAuthorId: "chujie", postThumbIndices: [5, 12, 1, 24] },
  { id: "cm-4", name: "Marleyy", relation: "Friends", gradYear: "Grad '26", avatarAuthorId: "janice", postThumbIndices: [8, 19, 4, 27] },
];

export const COLLEGE_MEMBER_FILTERS = ["Grad year", "Followers", "Connections"] as const;

/* ----------------------------- My College: Groups ---------------------------- */

export type CollegeGroup = {
  id: string;
  name: string;
  members: number;
  desc: string;
  /** Up to 4 avatar slots for the quad group cover. */
  coverAuthorIds: string[];
  isNew?: boolean;
};

export const COLLEGE_MY_GROUPS: CollegeGroup[] = [
  { id: "mg-1", name: "USC Class of 2025", members: 279, desc: "Join this group to connect with your 2025 peers! Anyone is welcomed", coverAuthorIds: ["lexi"] },
  { id: "mg-2", name: "USC Undergrad", members: 200, desc: "A place for USC undergrads to connect, share, and thrive on campus. ✌️🦖", coverAuthorIds: ["frank", "chujie", "janice", "yuyao"] },
  { id: "mg-3", name: "Annenberg Angle", members: 296, desc: "Media, comms, and PR students breaking down campaigns and each other's outfits", coverAuthorIds: ["s1", "m1", "taotao", "h1"] },
];

export const COLLEGE_OTHER_GROUPS: CollegeGroup[] = [
  { id: "og-1", name: "Go Trojans!", members: 160, desc: "For all things Trojan pride. Fight On! ✌️", coverAuthorIds: ["clyde"] },
  { id: "og-2", name: "USC Lost & Found", members: 143, desc: "No description yet.", coverAuthorIds: ["lexi", "frank", "s1", "chujie"] },
  { id: "og-3", name: "Gradventure Buddies", members: 88, desc: "Weekend trips and post-grad adventures with fellow Trojans.", coverAuthorIds: ["janice", "taotao", "yuyao", "m1"] },
];

/* ------------------------- Contacts / Facebook lists ------------------------- */

export type FollowListUser = {
  id: string;
  name: string;
  handle: string;
  avatarAuthorId?: string;
};

export const CONTACTS_LIST: FollowListUser[] = [
  { id: "ct-1", name: "Maya Lin", handle: "mayalin", avatarAuthorId: "yuyao" },
  { id: "ct-2", name: "Daniel Cho", handle: "user702396934", avatarAuthorId: "frank" },
  { id: "ct-3", name: "Leah Brooks", handle: "leah.brooks", avatarAuthorId: "lexi" },
  { id: "ct-4", name: "Jordan Ellis", handle: "jordan_ellis", avatarAuthorId: "janice" },
  { id: "ct-5", name: "FightingFifty1976", handle: "fightingfifty1976", avatarAuthorId: "chujie" },
];

export const FACEBOOK_LIST: FollowListUser[] = [
  { id: "fb-1", name: "Marcus Reed", handle: "marcusreed", avatarAuthorId: "frank" },
  { id: "fb-2", name: "Priya N.", handle: "priya.codes", avatarAuthorId: "yuyao" },
  { id: "fb-3", name: "Olivia Park", handle: "olivia.park", avatarAuthorId: "m1" },
  { id: "fb-4", name: "Dani Lopez", handle: "dani.lopez", avatarAuthorId: "chujie" },
  { id: "fb-5", name: "Wei Zhang", handle: "weizhang_", avatarAuthorId: "s1" },
];

/* --------------------------------- QR profile -------------------------------- */

export const QR_PROFILE = {
  name: "Coldplay",
  handle: "@coldplay",
  avatarAuthorId: "lexi",
} as const;
