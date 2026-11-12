import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import type { FeedItemCardContent } from "./feed_item_card";
import type { AspectWH } from "./photo_text_post_layout";

export type PhotoTextPerFeedDev = {
  /** When non-null, every photo in this card uses the same aspect. */
  aspect: AspectWH | null;
  /** When non-null, overrides the measured title line count for layout choice. */
  titleLines: number | null;
  /** When non-null, overrides the measured description line count for layout choice. */
  descLines: number | null;
};

const defaultPerFeed: PhotoTextPerFeedDev = {
  aspect: null,
  titleLines: null,
  descLines: null,
};

export type PhotoTextDevContextValue = {
  activeFeedIndex: number;
  feedContents: readonly FeedItemCardContent[];
  getPerFeed: (feedId: string) => PhotoTextPerFeedDev;
  setAspect: (feedId: string, aspect: AspectWH | null) => void;
  setTitleLines: (feedId: string, lineCount: number | null) => void;
  setDescLines: (feedId: string, lineCount: number | null) => void;
  resetFeed: (feedId: string) => void;
};

const PhotoTextDevContext = createContext<PhotoTextDevContextValue | null>(null);

/** Shell-level consumers (App.tsx) read feed dev state published by the home provider. */
let publishedPhotoTextDev: PhotoTextDevContextValue | null = null;
const publishedPhotoTextDevListeners = new Set<() => void>();

function setPublishedPhotoTextDev(next: PhotoTextDevContextValue | null) {
  publishedPhotoTextDev = next;
  publishedPhotoTextDevListeners.forEach((listener) => listener());
}

export function usePhotoTextDevPublished(): PhotoTextDevContextValue | null {
  return useSyncExternalStore(
    (onStoreChange) => {
      publishedPhotoTextDevListeners.add(onStoreChange);
      return () => publishedPhotoTextDevListeners.delete(onStoreChange);
    },
    () => publishedPhotoTextDev,
    () => null,
  );
}

export function PhotoTextDevProvider({
  activeFeedIndex,
  feedContents,
  children,
}: {
  activeFeedIndex: number;
  feedContents: readonly FeedItemCardContent[];
  children: ReactNode;
}) {
  const [map, setMap] = useState<Record<string, PhotoTextPerFeedDev>>({});

  const getPerFeed = useCallback(
    (feedId: string): PhotoTextPerFeedDev => ({
      ...defaultPerFeed,
      ...map[feedId],
    }),
    [map],
  );

  const patchFeed = useCallback(
    (feedId: string, patch: Partial<PhotoTextPerFeedDev>) => {
      setMap((current) => ({
        ...current,
        [feedId]: { ...defaultPerFeed, ...current[feedId], ...patch },
      }));
    },
    [],
  );

  const setAspect = useCallback(
    (feedId: string, aspect: AspectWH | null) => {
      patchFeed(feedId, { aspect });
    },
    [patchFeed],
  );

  const setTitleLines = useCallback(
    (feedId: string, titleLines: number | null) => {
      patchFeed(feedId, { titleLines });
    },
    [patchFeed],
  );

  const setDescLines = useCallback(
    (feedId: string, descLines: number | null) => {
      patchFeed(feedId, { descLines });
    },
    [patchFeed],
  );

  const resetFeed = useCallback((feedId: string) => {
    setMap((current) => {
      if (!(feedId in current)) return current;
      const next = { ...current };
      delete next[feedId];
      return next;
    });
  }, []);

  const value = useMemo<PhotoTextDevContextValue>(
    () => ({
      activeFeedIndex,
      feedContents,
      getPerFeed,
      setAspect,
      setTitleLines,
      setDescLines,
      resetFeed,
    }),
    [
      activeFeedIndex,
      feedContents,
      getPerFeed,
      setAspect,
      setTitleLines,
      setDescLines,
      resetFeed,
    ],
  );

  useEffect(() => {
    setPublishedPhotoTextDev(value);
    return () => setPublishedPhotoTextDev(null);
  }, [value]);

  return (
    <PhotoTextDevContext.Provider value={value}>
      {children}
    </PhotoTextDevContext.Provider>
  );
}

export function usePhotoTextDevOptional(): PhotoTextDevContextValue | null {
  return useContext(PhotoTextDevContext);
}
