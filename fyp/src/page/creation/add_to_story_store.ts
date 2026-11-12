import { useSyncExternalStore } from "react";

/** Where the "Add to story" page was opened from — kept for analytics/debug parity. */
export type AddToStorySource = "inbox-create" | "profile-avatar";

/** Where dismissing the album list returns — camera layer or the original source tab. */
export type AlbumReturnTo = "camera" | null;

/** Layer stack to restore when the story editor closes. */
type StoryEditReturnState = {
  cameraOpen: boolean;
  albumOverCamera: boolean;
  albumReturnTo: AlbumReturnTo;
};

type AddToStoryState = {
  isOpen: boolean;
  source: AddToStorySource | null;
  /** Currently edited media src, or null when the album list is on top. */
  editImage: string | null;
  /** Snapshot of camera/album layers before the editor opened. */
  editReturnTo: StoryEditReturnState | null;
  /** Album grid cell the user tapped — drives the photo fly-in transform. */
  editLaunchFrom: EditLaunchFrom | null;
  /** Whether the live camera capture page is on top. */
  cameraOpen: boolean;
  /** Album sheet slid in over the camera (camera stays live underneath). */
  albumOverCamera: boolean;
  /** When set, closing the album returns to the camera instead of the source tab. */
  albumReturnTo: AlbumReturnTo;
  /** Active "Your Story" publish fly-to-inbox animation, if any. */
  postLanding: StoryPostLanding | null;
  /**
   * User has an active story ring on both inbox Create and profile avatar.
   * Publish fly still targets {@link AddToStorySource}; settled ring is shared.
   */
  storyPostSettled: boolean;
};

/** Snapshot of the editor canvas at publish tap — used for the fly-to landing motion. */
export type StoryPostLanding = {
  fromRect: DOMRectReadOnly;
  destination: AddToStorySource;
};

import type { AlbumThumbnailLaunchFrom } from "./album_thumbnail_launch_motion";

export type EditLaunchFrom = AlbumThumbnailLaunchFrom;

let state: AddToStoryState = {
  isOpen: false,
  source: null,
  editImage: null,
  editReturnTo: null,
  editLaunchFrom: null,
  cameraOpen: false,
  albumOverCamera: false,
  albumReturnTo: null,
  postLanding: null,
  storyPostSettled: false,
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(next: AddToStoryState) {
  if (
    next.isOpen === state.isOpen &&
    next.source === state.source &&
    next.editImage === state.editImage &&
    next.editReturnTo === state.editReturnTo &&
    next.editLaunchFrom === state.editLaunchFrom &&
    next.cameraOpen === state.cameraOpen &&
    next.albumOverCamera === state.albumOverCamera &&
    next.albumReturnTo === state.albumReturnTo &&
    next.postLanding === state.postLanding &&
    next.storyPostSettled === state.storyPostSettled
  ) {
    return;
  }
  state = next;
  emit();
}

export function openAddToStory(source: AddToStorySource) {
  setState({
    isOpen: true,
    source,
    editImage: null,
    editReturnTo: null,
    editLaunchFrom: null,
    cameraOpen: false,
    albumOverCamera: false,
    albumReturnTo: null,
    postLanding: null,
    // Keep the settled create avatar visible under the rising sheet — avoids
    // swapping back to SocialAvatar for a frame (visible jump on tap).
    storyPostSettled: state.storyPostSettled,
  });
}

export function closeAddToStory() {
  setState({
    isOpen: false,
    source: state.source,
    editImage: null,
    editReturnTo: null,
    editLaunchFrom: null,
    cameraOpen: false,
    albumOverCamera: false,
    albumReturnTo: null,
    postLanding: null,
    storyPostSettled: state.storyPostSettled,
  });
}

/** Open the single-photo editor; remembers the current layer to restore on close. */
export function openStoryEdit(
  editImage: string,
  launch?: { fromRect: DOMRectReadOnly },
) {
  setState({
    ...state,
    isOpen: true,
    editImage,
    editReturnTo: {
      cameraOpen: state.cameraOpen,
      albumOverCamera: state.albumOverCamera,
      albumReturnTo: state.albumReturnTo,
    },
    editLaunchFrom: launch?.fromRect
      ? {
          left: launch.fromRect.left,
          top: launch.fromRect.top,
          width: launch.fromRect.width,
          height: launch.fromRect.height,
        }
      : null,
    // Keep the camera stream warm under the editor when capturing from camera.
    cameraOpen: state.cameraOpen,
    albumOverCamera: false,
  });
}

/** Close the editor and return to the page that opened it (album or camera). */
export function closeStoryEdit() {
  const returnTo = state.editReturnTo;
  setState({
    ...state,
    editImage: null,
    editReturnTo: null,
    editLaunchFrom: null,
    cameraOpen: returnTo?.cameraOpen ?? false,
    albumOverCamera: returnTo?.albumOverCamera ?? false,
    albumReturnTo: returnTo?.albumReturnTo ?? null,
  });
}

/** Close the album list — returns to camera when opened from the camera thumb, else the source tab. */
export function dismissAddToStoryAlbum() {
  if (state.albumReturnTo === "camera") {
    setState({
      ...state,
      albumOverCamera: false,
      albumReturnTo: null,
    });
    return;
  }
  closeAddToStory();
}

/** Open the main album page from the camera thumb; slides up over the live camera. */
export function openAlbumFromCamera() {
  setState({
    ...state,
    isOpen: true,
    cameraOpen: true,
    albumOverCamera: true,
    albumReturnTo: "camera",
  });
}

/** Open the live camera capture page on top of the album. */
export function openStoryCamera() {
  setState({ ...state, isOpen: true, cameraOpen: true, albumOverCamera: false });
}

/** Close the camera and return to the album list. */
export function closeStoryCamera() {
  setState({ ...state, cameraOpen: false, albumOverCamera: false });
}

/** Slide the album sheet up over the camera; the camera preview keeps running. */
export function openAlbumOverCamera() {
  setState({ ...state, isOpen: true, cameraOpen: true, albumOverCamera: true });
}

/** Dismiss the album sheet and return to the camera page. */
export function closeAlbumOverCamera() {
  setState({ ...state, albumOverCamera: false });
}

/** Start the publish fly-to landing animation from the editor canvas. */
export function publishStoryToInbox(landing: Pick<StoryPostLanding, "fromRect">) {
  const destination = state.source ?? "inbox-create";
  setState({
    isOpen: false,
    source: state.source ?? destination,
    editImage: null,
    editReturnTo: null,
    editLaunchFrom: null,
    cameraOpen: false,
    albumOverCamera: false,
    albumReturnTo: null,
    postLanding: { ...landing, destination },
    storyPostSettled: state.storyPostSettled,
  });
}

/** Finish the publish animation and tear down the creation overlay. */
export function completeStoryPost() {
  setState({
    isOpen: false,
    source: state.source,
    editImage: null,
    editReturnTo: null,
    editLaunchFrom: null,
    cameraOpen: false,
    albumOverCamera: false,
    albumReturnTo: null,
    postLanding: null,
    storyPostSettled: true,
  });
}

/** Shared story ring visible on inbox + profile — false while publish fly is active. */
export function useStoryPostRingSettled() {
  const { storyPostSettled, postLanding } = useAddToStoryStore();
  return storyPostSettled && postLanding == null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function useAddToStoryStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
