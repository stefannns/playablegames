import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { FriendsCommentPreview } from "./friends_feed.config";

/**
 * Per-post interaction state for the Friends feed.
 *
 * Lives at the `FriendsPage` level (above the `PagePushStage`) so it survives
 * every snapshot rebuild of the Friends root page that the push stage triggers
 * on `push` (open DM), `pop` (return from DM), and `replace` (commit a follow).
 * Without this, the local `useState(false)` for like / "View more" inside each
 * `FriendsFeedPost` would reset to its default every time the root page node
 * is rebuilt — manifesting as the like flipping back to off after opening
 * Message, or comment threads collapsing after following an unrelated post.
 *
 * Context is required (not props) because the page stage stores a snapshot of
 * the React tree it was given; props captured in that snapshot's closure stay
 * stale even after `FriendsPage` re-renders. A provider placed above the stage
 * delivers fresh values into the snapshot's children at every render.
 */
type FriendsPostInteractionContextValue = {
  isLiked: (postId: string) => boolean;
  toggleLiked: (postId: string) => void;
  isCommentsExpanded: (postId: string) => boolean;
  toggleCommentsExpanded: (postId: string) => void;
  getAddedComments: (postId: string) => FriendsCommentPreview[];
  addComment: (postId: string, text: string) => void;
};

const FriendsPostInteractionContext =
  createContext<FriendsPostInteractionContextValue | null>(null);

export function FriendsPostInteractionProvider({ children }: { children: ReactNode }) {
  const [likedPostIds, setLikedPostIds] = useState(() => new Set<string>());
  const [expandedCommentPostIds, setExpandedCommentPostIds] = useState(
    () => new Set<string>(),
  );
  const [addedCommentsByPostId, setAddedCommentsByPostId] = useState(
    () => new Map<string, FriendsCommentPreview[]>(),
  );

  const toggleLiked = useCallback((postId: string) => {
    setLikedPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }, []);

  const toggleCommentsExpanded = useCallback((postId: string) => {
    setExpandedCommentPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }, []);

  const addComment = useCallback((postId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setAddedCommentsByPostId((prev) => {
      const next = new Map(prev);
      const comments = next.get(postId) ?? [];
      next.set(postId, [
        ...comments,
        {
          authorId: "friends-me",
          author: "You",
          text: trimmed,
        },
      ]);
      return next;
    });
  }, []);

  const value = useMemo<FriendsPostInteractionContextValue>(
    () => ({
      isLiked: (postId) => likedPostIds.has(postId),
      toggleLiked,
      isCommentsExpanded: (postId) => expandedCommentPostIds.has(postId),
      toggleCommentsExpanded,
      getAddedComments: (postId) => addedCommentsByPostId.get(postId) ?? [],
      addComment,
    }),
    [
      likedPostIds,
      expandedCommentPostIds,
      addedCommentsByPostId,
      toggleLiked,
      toggleCommentsExpanded,
      addComment,
    ],
  );

  return (
    <FriendsPostInteractionContext.Provider value={value}>
      {children}
    </FriendsPostInteractionContext.Provider>
  );
}

/**
 * Per-post handle. Falls back to a self-contained `useState` pair when used
 * outside the provider so individual posts still work in isolation (e.g.
 * Storybook, ad-hoc embedding). Inside Friends, the provider wins.
 */
export function useFriendsPostInteraction(postId: string) {
  const ctx = useContext(FriendsPostInteractionContext);
  const [localLiked, setLocalLiked] = useState(false);
  const [localExpanded, setLocalExpanded] = useState(false);
  const [localAddedComments, setLocalAddedComments] = useState<FriendsCommentPreview[]>([]);

  if (ctx) {
    return {
      liked: ctx.isLiked(postId),
      toggleLiked: () => ctx.toggleLiked(postId),
      commentsExpanded: ctx.isCommentsExpanded(postId),
      toggleCommentsExpanded: () => ctx.toggleCommentsExpanded(postId),
      addedComments: ctx.getAddedComments(postId),
      addComment: (text: string) => ctx.addComment(postId, text),
    };
  }

  return {
    liked: localLiked,
    toggleLiked: () => setLocalLiked((v) => !v),
    commentsExpanded: localExpanded,
    toggleCommentsExpanded: () => setLocalExpanded((v) => !v),
    addedComments: localAddedComments,
    addComment: (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setLocalAddedComments((comments) => [
        ...comments,
        {
          authorId: "friends-me",
          author: "You",
          text: trimmed,
        },
      ]);
    },
  };
}
