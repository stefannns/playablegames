import { useSyncExternalStore } from "react";

/**
 * Visibility toggles for the optional components that can appear in a feed
 * card's bottom-left info stack (Figma "Feed Experience 2026" node 7717:127513).
 *
 * The already-restored baseline (nickname, description, music marquee, right
 * rail and the location anchor) is NOT governed here — these flags only gate
 * the *additional* components so the default feed render stays untouched.
 */
export type FeedInfoComponentId =
  | "promo"
  | "friendTag"
  | "locationAnchor"
  | "verified"
  | "collaborators"
  | "textType"
  | "seeOriginal"
  | "sponsored"
  | "infoBar"
  | "actions"
  | "bottomBanner";

export type FeedInfoVisibility = Record<FeedInfoComponentId, boolean>;

export type FeedInfoComponentMeta = {
  id: FeedInfoComponentId;
  label: string;
  description: string;
};

/** Order here drives both the config panel rows and is documentation-only. */
export const FEED_INFO_COMPONENTS: FeedInfoComponentMeta[] = [
  { id: "promo", label: "Caption", description: "tonight we are very pleased to present…" },
  { id: "friendTag", label: "Friend tag", description: "Your friend" },
  { id: "locationAnchor", label: "Location anchor", description: "New York" },
  { id: "verified", label: "Verified badge", description: "Beside the username" },
  { id: "collaborators", label: "Collaboration tag", description: "3 collaborators + avatars" },
  { id: "textType", label: "Genre tag", description: "Text" },
  { id: "seeOriginal", label: "See original", description: "Repost source link" },
  { id: "sponsored", label: "Sponsored tag", description: "Ad disclosure" },
  { id: "infoBar", label: "Info bar", description: "Creator labelled as AI-generated…" },
  { id: "actions", label: "Bottom button", description: "Not interested / Follow back" },
  { id: "bottomBanner", label: "Bottom banner", description: "Search · trending result" },
];

const DEFAULT_VISIBILITY: FeedInfoVisibility = {
  promo: false,
  friendTag: false,
  // Already part of the restored design — keep it on so the baseline render
  // (location anchor where `content.location` is set) is preserved by default.
  locationAnchor: true,
  verified: false,
  collaborators: false,
  textType: false,
  seeOriginal: false,
  sponsored: false,
  infoBar: false,
  actions: false,
  bottomBanner: false,
};

let state: FeedInfoVisibility = { ...DEFAULT_VISIBILITY };

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function setFeedInfoComponentVisible(id: FeedInfoComponentId, visible: boolean) {
  if (state[id] === visible) return;
  state = { ...state, [id]: visible };
  emit();
}

export function toggleFeedInfoComponent(id: FeedInfoComponentId) {
  state = { ...state, [id]: !state[id] };
  emit();
}

export function useFeedInfoVisibility() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
