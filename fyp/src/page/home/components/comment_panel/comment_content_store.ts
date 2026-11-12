import { useSyncExternalStore } from "react";
import {
  COMMENT_CONTENT_STORAGE_KEY,
  DEFAULT_COMMENT_CONTENT_DOCUMENT,
  getCommentContentPreset,
  normalizeCommentContentDocument,
  type CommentContentDocument,
} from "./comment_content_config";

type CommentContentStoreState = {
  visible: boolean;
  document: CommentContentDocument;
};

const COMMENT_CONTENT_PRESET_QUERY_KEY = "commentContentPreset";

let state: CommentContentStoreState = {
  visible: true,
  document: DEFAULT_COMMENT_CONTENT_DOCUMENT,
};

const listeners = new Set<() => void>();
const activePanelIds = new Set<string>();
let hydrated = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(next: Partial<CommentContentStoreState>) {
  state = { ...state, ...next };
  emit();
}

function hydrateItems() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;

  // URL preset takes priority over persisted localStorage data so a shared link
  // always opens the app with the requested preset.
  const urlPresetId = new URLSearchParams(window.location.search).get(
    COMMENT_CONTENT_PRESET_QUERY_KEY,
  );
  const urlPreset = urlPresetId ? getCommentContentPreset(urlPresetId) : null;
  if (urlPreset) {
    state = { ...state, document: urlPreset.document };
    return;
  }

  try {
    const legacyRaw = window.localStorage.getItem("comment-panel-content-document-v3");
    const raw =
      window.localStorage.getItem(COMMENT_CONTENT_STORAGE_KEY) ??
      legacyRaw;
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<CommentContentDocument>;
    const normalizedDocument = normalizeCommentContentDocument(parsed);
    if (normalizedDocument) {
      state = { ...state, document: normalizedDocument };
      persistDocument(normalizedDocument);
      if (legacyRaw && !window.localStorage.getItem(COMMENT_CONTENT_STORAGE_KEY)) {
        window.localStorage.removeItem("comment-panel-content-document-v3");
      }
    }
  } catch {
    // Ignore invalid local data.
  }
}

function persistDocument(document: CommentContentDocument) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COMMENT_CONTENT_STORAGE_KEY, JSON.stringify(document));
}

export function useCommentContentStore() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => {
      hydrateItems();
      return state;
    },
    () => state,
  );
}

export function openCommentContentPanel(panelId: string) {
  activePanelIds.add(panelId);
  setState({ visible: activePanelIds.size > 0 });
}

export function closeCommentContentPanel(panelId: string) {
  activePanelIds.delete(panelId);
  setState({ visible: activePanelIds.size > 0 });
}

export function setCommentContentDocument(document: CommentContentDocument) {
  persistDocument(document);
  setState({ document });
}

export function resetCommentContentDocument() {
  persistDocument(DEFAULT_COMMENT_CONTENT_DOCUMENT);
  setState({ document: DEFAULT_COMMENT_CONTENT_DOCUMENT });
}

export function applyCommentContentPreset(presetId: string) {
  const preset = getCommentContentPreset(presetId);
  if (!preset) return;
  persistDocument(preset.document);
  setState({ document: preset.document });
}
