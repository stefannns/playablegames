import { getColorCSSVar, TUXAvatar, TUXButton, TUXSheet, TUXText } from "@byted-tiktok/tux-web";
import {
  IconAnchorEffect,
  IconAt,
  IconBubbleRight,
  IconEmoji,
  IconImageAlt1,
  IconImageAlt1Fill,
  IconLike,
  IconLikeFill,
  IconThumbsDown,
  TUXIconPaperplaneRounded,
  TUXIconArrowTriangleUpLargeFill,
  TUXIconChevronDownSmallFill,
  TUXIconChevronUpSmallFill,
  TUXIconEllipsisHorizontal,
} from "@byted-tiktok/tux-icons";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { APP_Z_OVERLAY } from "../../../components/sys/app_z_index";
import { appFrameSheetChromeProps } from "../../../components/sys/app_frame_sheet_chrome";
import { useSoftKeyboard } from "../../../components/sys/soft_keyboard";
import {
  getAppFrameRootElement,
  showAppFrameTopToast,
} from "../../../components/sys/app_frame_top_toast";
import { AnimatedDigitText } from "../../../components/motion/animated_digit_text";
import { CommentComposerKeyboardShell } from "../../home/components/comment_panel/comment_composer_keyboard_shell";
import {
  CommentTextField,
  type CommentTextFieldHandle,
} from "../../home/components/comment_panel/comment_text_field";
import { SharePanel } from "../../home/components/share_panel";
import type { FriendsCommentPreview, FriendsFeedItem } from "../friends_feed.config";
import {
  friendsAuthorAvatarUrl,
  friendsPostThumbUrl,
} from "../friends_feed.config";
import { useFriendsPostInteraction } from "../friends_post_interaction_context";

/** Overrides TUX H4 preset line-height (utilities lose to preset CSS). */
const FRIENDS_FEED_H4_BODY_LINE_HEIGHT: CSSProperties = { lineHeight: "140%" };

/** Force UIText3 via CSS var (preset `color` prop can resolve to flat rgb in preview). */
const FRIENDS_FEED_H4_AUTHOR_LABEL_STYLE: CSSProperties = {
  ...FRIENDS_FEED_H4_BODY_LINE_HEIGHT,
  color: getColorCSSVar("UIText3"),
};

function friendsDisplayTimeLabel(timeLabel: string): string {
  return timeLabel.replace(/\s+ago$/i, "");
}

function showFriendsImageToast() {
  showAppFrameTopToast({
    text: "haoqi：这个要合到消费post页面。",
    duration: 1800,
    displayMode: "replace",
  });
}

function MutualFriendsAvatarStack({
  authorIds,
  extraMutualCount,
}: {
  authorIds: string[];
  extraMutualCount?: number;
}) {
  if (authorIds.length === 0) return null;
  const showExtra = extraMutualCount != null && extraMutualCount > 0;
  return (
    <div
      className="flex flex-row flex-wrap items-center gap-1 min-w-0"
      role="group"
      aria-label={
        showExtra
          ? `Friends with ${authorIds.length} people shown, ${extraMutualCount} more`
          : `Friends with ${authorIds.length} people`
      }
    >
      <TUXText typographyPreset="P2-Regular" color="UIText3" className="shrink-0">
        Friends with
      </TUXText>
      <div className="flex items-center gap-0.5 min-w-0">
        <div className="flex flex-row items-center" aria-hidden>
          {authorIds.map((id, index) => (
            <div
              key={`${id}-${index}`}
              className={`relative size-4 shrink-0 overflow-hidden rounded-full bg-tux-v2-ui-shape-neutral-3 ring-1 ring-tux-v2-ui-page-flat-1 ${index > 0 ? "-ml-0.5" : ""}`}
              style={{ zIndex: index + 1 }}
            >
              <img
                src={friendsAuthorAvatarUrl(id, 16)}
                alt=""
                className="size-full object-cover"
                width={16}
                height={16}
                draggable={false}
              />
            </div>
          ))}
        </div>
        {showExtra ? (
          <TUXText typographyPreset="P2-Regular" color="UIText3" className="tabular-nums shrink-0">
            +{extraMutualCount}
          </TUXText>
        ) : null}
      </div>
    </div>
  );
}

/** Defer parent follow + stack `replace` so pill layout / background can tween first. */
const FRIENDS_FOLLOW_TO_MESSAGE_COMMIT_MS = 320;
const FRIENDS_AUTHOR_CTA_LAYOUT_MS = 0.35;
const FRIENDS_AUTHOR_CTA_LAYOUT_EASE = [0.32, 0.72, 0, 1] as const;

function AuthorRow({
  authorId,
  authorName,
  timeLabel,
  primaryRowAction = "message",
  mutualFriendAvatarIds,
  mutualFriendsExtraCount,
  followedFromSuggestedIds,
  onFollowFromSuggested,
  onOpenSharePanel,
}: {
  authorId: string;
  authorName: string;
  timeLabel: string;
  primaryRowAction?: "message" | "follow";
  mutualFriendAvatarIds?: string[];
  mutualFriendsExtraCount?: number;
  followedFromSuggestedIds?: ReadonlySet<string>;
  onFollowFromSuggested?: (authorId: string) => void;
  onOpenSharePanel: () => void;
}) {
  const followedFromSuggested = Boolean(followedFromSuggestedIds?.has(authorId));
  const [pendingFollowToMessage, setPendingFollowToMessage] = useState(false);
  const followCommitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFollowFromSuggestedRef = useRef(onFollowFromSuggested);
  onFollowFromSuggestedRef.current = onFollowFromSuggested;

  useEffect(() => {
    return () => {
      if (followCommitTimerRef.current != null) {
        clearTimeout(followCommitTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (followedFromSuggested) setPendingFollowToMessage(false);
  }, [followedFromSuggested]);

  const showFollowCta =
    primaryRowAction === "follow" && !followedFromSuggested && !pendingFollowToMessage;
  const showMutualStack =
    primaryRowAction === "follow" && mutualFriendAvatarIds && mutualFriendAvatarIds.length > 0;

  const scheduleFollowCommit = () => {
    if (followCommitTimerRef.current != null) {
      clearTimeout(followCommitTimerRef.current);
    }
    followCommitTimerRef.current = setTimeout(() => {
      followCommitTimerRef.current = null;
      onFollowFromSuggestedRef.current?.(authorId);
      setPendingFollowToMessage(false);
    }, FRIENDS_FOLLOW_TO_MESSAGE_COMMIT_MS);
  };

  return (
    <div className="flex justify-between items-start gap-2 w-full min-w-0">
      <div className="flex flex-col flex-1 gap-1 min-w-0">
        <div className="flex items-baseline min-w-0">
          <TUXText typographyPreset="Headline-Semibold" color="UIText1" textDisplay="truncate" className="min-w-0">
            {authorName}
          </TUXText>
          <TUXText typographyPreset="H4-Regular" color="UIText3" className="ml-1.5 shrink-0">
            {friendsDisplayTimeLabel(timeLabel)}
          </TUXText>
        </div>
        {showMutualStack ? (
          <MutualFriendsAvatarStack authorIds={mutualFriendAvatarIds} extraMutualCount={mutualFriendsExtraCount} />
        ) : null}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {showFollowCta ? (
          <motion.div
            layout
            transition={{
              layout: { duration: FRIENDS_AUTHOR_CTA_LAYOUT_MS, ease: FRIENDS_AUTHOR_CTA_LAYOUT_EASE },
            }}
            className="inline-flex shrink-0"
          >
            <TUXButton
              text="Follow"
              smoothRadius
              themePreset="primary"
              shapePreset="capsule"
              sizePreset="tiny"
              height="24px"
              aria-label={`Follow ${authorName}`}
              onClick={() => {
                setPendingFollowToMessage(true);
                scheduleFollowCommit();
              }}
            />
          </motion.div>
        ) : null}
        <button
          type="button"
          className="flex justify-center items-center active:opacity-70 rounded-[6px] outline-none size-4"
          style={{ color: getColorCSSVar("UIText3") }}
          aria-label="More options"
          onClick={onOpenSharePanel}
        >
          <TUXIconEllipsisHorizontal size={16} />
        </button>
      </div>
    </div>
  );
}

/** How many comment rows stay visible before "View more" (when there is overflow). */
const FRIENDS_COMMENT_PREVIEW_COLLAPSED_COUNT = 5;

function friendsFeedCommentPreviewKey(c: FriendsCommentPreview): string {
  return `${c.authorId}-${c.text.slice(0, 12)}`;
}

function FriendsFeedCommentRow({
  c,
  onReply,
}: {
  c: FriendsCommentPreview;
  onReply: (authorName: string | null) => void;
}) {
  const replyTargetName = c.author === "You" ? null : c.author;

  return (
    <button
      type="button"
      className="flow-root bg-transparent active:opacity-70 p-0 border-0 outline-none w-full min-w-0 text-left"
      aria-label={replyTargetName ? `Reply to ${replyTargetName}` : "Add comment"}
      onClick={() => onReply(replyTargetName)}
    >
      <div className="float-left flex justify-center items-start mr-1 w-5 h-5 max-h-5 overflow-visible">
        <TUXAvatar
          size={20}
          src={friendsAuthorAvatarUrl(c.authorId, 20)}
          alt=""
          ringColor="transparent"
        />
      </div>
      <TUXText
        typographyPreset="H4-Regular"
        color="UIText1"
        className="block min-w-0"
        style={FRIENDS_FEED_H4_BODY_LINE_HEIGHT}
      >
        <span className="inline-flex flex-wrap items-baseline gap-1">
          <TUXText
            as="span"
            typographyPreset="H4-Semibold"
            color="UIText3"
            style={FRIENDS_FEED_H4_AUTHOR_LABEL_STYLE}
          >
            {c.replyToAuthor ? c.author : `${c.author}:`}
          </TUXText>
          {c.replyToAuthor ? (
            <>
              <span
                className="inline-flex justify-center items-center self-center size-2.5 rotate-90 shrink-0"
                style={{ color: getColorCSSVar("UIText3") }}
                aria-hidden
              >
                <TUXIconArrowTriangleUpLargeFill size={10} />
              </span>
              <TUXText
                as="span"
                typographyPreset="H4-Semibold"
                color="UIText3"
                style={FRIENDS_FEED_H4_AUTHOR_LABEL_STYLE}
              >
                {c.replyToAuthor}:
              </TUXText>
            </>
          ) : null}
        </span>
        <span className="ml-1.333">{c.text}</span>
      </TUXText>
    </button>
  );
}

function CommentPreview({
  comments,
  expanded,
  onToggleExpanded,
  onReplyToComment,
}: {
  comments: FriendsFeedItem["comments"];
  expanded: boolean;
  onToggleExpanded: () => void;
  onReplyToComment: (authorName: string | null) => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const extraCommentsRegionId = useId();

  if (comments.length === 0) return null;

  const hasOverflow = comments.length > FRIENDS_COMMENT_PREVIEW_COLLAPSED_COUNT;
  const headComments = hasOverflow
    ? comments.slice(0, FRIENDS_COMMENT_PREVIEW_COLLAPSED_COUNT)
    : comments;
  /** Remaining comments after the first five (often five in demo data; can be more). */
  const tailComments = hasOverflow
    ? comments.slice(FRIENDS_COMMENT_PREVIEW_COLLAPSED_COUNT)
    : [];

  const expandCollapseMs = prefersReducedMotion ? 0 : 350;
  const expandCollapseEase = "cubic-bezier(0.32, 0.72, 0, 1)";

  return (
    <div className="flex flex-col gap-2 w-full min-w-0">
      {headComments.map((c) => (
        <FriendsFeedCommentRow
          key={friendsFeedCommentPreviewKey(c)}
          c={c}
          onReply={onReplyToComment}
        />
      ))}
      {hasOverflow ? (
        <div
          className={`flex min-w-0 w-full flex-col ${expanded ? "gap-2" : "gap-0"}`}
        >
          {/*
           * When collapsed the grid row is 0fr tall but still a flex item; if
           * we keep gap-2 between grid and button we stack two 8px gaps (after
           * last head comment and before the button) and the spacing reads as
           * ~16px. gap-0 while collapsed keeps a single gap-2 from the outer
           * column between the last head row and this wrapper.
           */}
          <div
            className="grid w-full min-h-0"
            style={{
              gridTemplateRows: expanded ? "1fr" : "0fr",
              transition:
                expandCollapseMs > 0
                  ? `grid-template-rows ${expandCollapseMs}ms ${expandCollapseEase}`
                  : undefined,
            }}
          >
            <div
              className="min-h-0 overflow-hidden"
              id={extraCommentsRegionId}
              role="region"
              aria-hidden={!expanded}
              aria-label="More comments"
            >
              <div className="flex flex-col gap-2 w-full min-h-0">
                {tailComments.map((c) => (
                  <FriendsFeedCommentRow
                    key={friendsFeedCommentPreviewKey(c)}
                    c={c}
                    onReply={onReplyToComment}
                  />
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="flex justify-start items-center gap-0 active:opacity-70 outline-none w-full min-w-0"
            style={{ color: getColorCSSVar("UITextInfo") }}
            aria-expanded={expanded}
            aria-controls={extraCommentsRegionId}
            onClick={onToggleExpanded}
          >
            <TUXText
              typographyPreset="H4-Semibold"
              style={{
                ...FRIENDS_FEED_H4_BODY_LINE_HEIGHT,
                color: getColorCSSVar("UITextInfo"),
              }}
            >
              {expanded ? "View less" : "View more"}
            </TUXText>
            <span className="inline-flex shrink-0" aria-hidden>
              {expanded ? (
                <TUXIconChevronUpSmallFill size={20} color="var(--tux-v2-color-ui-text-info)" />
              ) : (
                <TUXIconChevronDownSmallFill size={20} color="var(--tux-v2-color-ui-text-info)" />
              )}
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

const FRIENDS_QUICK_COMMENT_EMOJIS = [
  { emoji: "😊", label: "React with smiling face" },
  { emoji: "🤨", label: "React with raised eyebrow" },
  { emoji: "😂", label: "React with laughing face" },
] as const;

function QuickEmojiBurst({ burst }: { burst: { id: number; emoji: string } | null }) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalRoot(document.querySelector<HTMLElement>("[data-app-frame-root]") ?? document.body);
  }, []);

  if (!burst) return null;

  const particles = Array.from({ length: 18 }).map((_, index) => {
    const lane = index % 6;
    const startLeft = 8 + lane * 17 + (index % 2 === 0 ? 3 : -4);
    const driftX = ((index % 5) - 2) * 28;
    const rise = 360 + (index % 4) * 52 + Math.floor(index / 6) * 72;
    const size = 34 + (index % 3) * 8;
    return { driftX, index, rise, size, startLeft };
  });

  return createPortal(
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: APP_Z_OVERLAY - 1 }}
      aria-hidden
    >
      {particles.map(({ driftX, index, rise, size, startLeft }) => {
        return (
          <motion.span
            key={`${burst.id}-${index}`}
            className="bottom-6 absolute flex justify-center items-center leading-none"
            style={{
              fontSize: size,
              height: size,
              left: `${startLeft}%`,
              width: size,
            }}
            initial={{ opacity: 0, scale: 0.5, x: 0, y: 24, rotate: -8 + (index % 5) * 4 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1.15, 1, 0.86],
              x: driftX,
              y: -rise,
              rotate: 10 - (index % 6) * 4,
            }}
            transition={{
              duration: 1.55,
              delay: index * 0.035,
              ease: [0.22, 0.61, 0.36, 1],
            }}
          >
            {burst.emoji}
          </motion.span>
        );
      })}
    </div>,
    portalRoot ?? document.body,
  );
}

function AddCommentBar({
  onOpen,
  onQuickEmojiComment,
}: {
  onOpen: () => void;
  onQuickEmojiComment: (emoji: string) => void;
}) {
  const [burst, setBurst] = useState<{ id: number; emoji: string } | null>(null);
  const clearBurstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addCommentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (clearBurstTimerRef.current != null) clearTimeout(clearBurstTimerRef.current);
      if (addCommentTimerRef.current != null) clearTimeout(addCommentTimerRef.current);
    };
  }, []);

  const triggerQuickEmojiComment = (emoji: string) => {
    if (clearBurstTimerRef.current != null) clearTimeout(clearBurstTimerRef.current);
    if (addCommentTimerRef.current != null) clearTimeout(addCommentTimerRef.current);
    setBurst({ id: Date.now(), emoji });
    addCommentTimerRef.current = setTimeout(() => {
      addCommentTimerRef.current = null;
      onQuickEmojiComment(`${emoji}${emoji}${emoji}`);
    }, 360);
    clearBurstTimerRef.current = setTimeout(() => {
      clearBurstTimerRef.current = null;
      setBurst(null);
    }, 2200);
  };

  return (
    <div className="relative bg-tux-v2-ui-shape-neutral-4 py-0.5 pr-2 pl-3 rounded-[36px] w-full min-w-0 overflow-visible">
      <QuickEmojiBurst burst={burst} />
      <div className="z-1 relative flex justify-between items-center gap-2 h-10">
        <button
          type="button"
          className="flex-1 active:opacity-80 outline-none min-w-0 text-left"
          aria-label="Add comment"
          onClick={onOpen}
        >
          <TUXText typographyPreset="H4-Regular" color="UITextPlaceholder" textDisplay="truncate">
          Add comment…
          </TUXText>
        </button>
        <div className="flex items-center gap-0 shrink-0" role="group" aria-label="Quick emoji reactions">
          {FRIENDS_QUICK_COMMENT_EMOJIS.map(({ emoji, label }) => (
            <button
              key={label}
              type="button"
              className="flex justify-center items-center active:opacity-70 rounded-full outline-none size-9 shrink-0"
              aria-label={label}
              onClick={() => triggerQuickEmojiComment(emoji)}
            >
              <span className="text-[25px] leading-none pointer-events-none select-none">{emoji}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function InteractionRow({
  authorId,
  authorName,
  likeCount,
  commentCount,
  liked,
  onToggleLiked,
  onOpenComments,
  onOpenDmFromFriends,
}: {
  authorId: string;
  authorName: string;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  onToggleLiked: () => void;
  onOpenComments: () => void;
  onOpenDmFromFriends?: (peerAuthorId: string, peerDisplayName: string, trigger?: HTMLElement) => void;
}) {
  /**
   * The like state is owned by `FriendsPostInteractionProvider` (above the
   * Friends `PagePushStage`) so it survives root-page rebuilds when the user
   * pushes into DM, returns, or commits a follow on another post. The base
   * count comes from the feed config; we just add +1 when liked so the
   * number reflects the user action without mutating shared data. Number
   * color stays `UIText1` whether liked or not — only the heart icon
   * switches to filled + `UIShapePrimary`.
   */
  const displayedLikeCount = likeCount + (liked ? 1 : 0);

  return (
    <div className="flex justify-start items-center gap-4 w-full h-7">
      <button
        type="button"
        className="flex items-center gap-1 active:opacity-70 outline-none"
        aria-pressed={liked}
        aria-label={liked ? "Unlike" : "Like"}
        onClick={onToggleLiked}
      >
        {liked ? (
          <IconLikeFill
            width={24}
            height={24}
            className="text-tux-v2-ui-shape-primary"
          />
        ) : (
          <IconLike
            width={24}
            height={24}
            className="text-tux-v2-ui-text-1"
          />
        )}
        <AnimatedDigitText
          value={displayedLikeCount}
          skipInitialAnimation
          typographyPreset="P2-Semibold"
          color="UIText1"
        />
      </button>
      <button
        type="button"
        className="flex items-center gap-1 active:opacity-70 outline-none"
        aria-label="Open comments"
        onClick={onOpenComments}
      >
        <IconBubbleRight width={24} height={24} className="text-tux-v2-ui-text-1" />
        <TUXText typographyPreset="P2-Semibold" color="UIText1">
          {commentCount}
        </TUXText>
      </button>
      <button
        type="button"
        className="flex justify-center items-center active:opacity-70 rounded-[6px] outline-none size-6 text-tux-v2-ui-text-1"
        aria-label={`Message ${authorName}`}
        onClick={(e) => onOpenDmFromFriends?.(authorId, authorName, e.currentTarget)}
      >
        <TUXIconPaperplaneRounded size={24} />
      </button>
    </div>
  );
}

function friendsCommentSheetLikeLabel(index: number): string {
  return ["4", "1", "902", ""][index % 4];
}

function FriendsCommentSheetActions({ likeCountLabel }: { likeCountLabel: string }) {
  const [liked, setLiked] = useState(false);
  const likeColor = liked ? getColorCSSVar("UIShapePrimary") : getColorCSSVar("UIText3");

  return (
    <div className="flex items-center gap-3 shrink-0">
      <button
        type="button"
        className="flex items-center gap-0.5 bg-transparent active:opacity-70 p-0 border-0 outline-none"
        aria-label={liked ? "Unlike comment" : "Like comment"}
        aria-pressed={liked}
        onClick={() => setLiked((value) => !value)}
      >
        {liked ? (
          <IconLikeFill width={16} height={16} style={{ color: likeColor }} />
        ) : (
          <IconLike width={16} height={16} style={{ color: likeColor }} />
        )}
        {likeCountLabel ? (
          <TUXText
            as="span"
            typographyPreset="P2-Regular"
            className="tabular-nums"
            style={{ color: likeColor, lineHeight: "15.6px" }}
          >
            {likeCountLabel}
          </TUXText>
        ) : null}
      </button>
      <button
        type="button"
        className="flex items-center bg-transparent active:opacity-70 p-0 border-0 outline-none shrink-0"
        aria-label="Dislike comment"
      >
        <IconThumbsDown width={16} height={16} style={{ color: getColorCSSVar("UIText3") }} />
      </button>
    </div>
  );
}

function FriendsCommentSheet({
  listOpen,
  composerOpen,
  authorName,
  replyTargetName,
  comments,
  onCloseList,
  onCloseComposer,
  onRequestComposer,
  onSend,
}: {
  listOpen: boolean;
  composerOpen: boolean;
  authorName: string;
  replyTargetName: string | null;
  comments: FriendsCommentPreview[];
  onCloseList: () => void;
  onCloseComposer: () => void;
  onRequestComposer: (replyTargetName?: string | null) => void;
  onSend: (text: string) => void;
}) {
  const inputRef = useRef<CommentTextFieldHandle | null>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [frameHeight, setFrameHeight] = useState(() =>
    typeof window !== "undefined" ? window.innerHeight : 844,
  );
  const { isOpen: keyboardOpen } = useSoftKeyboard();
  const keyboardLiftActive = composerOpen && keyboardOpen;
  const commentTitle = `${comments.length} ${comments.length === 1 ? "comment" : "comments"}`;
  const composerPlaceholder = replyTargetName ? `replying to ${replyTargetName}` : "Add comment...";
  const sheetHeightPx = Math.max(0, Math.round(frameHeight * 0.7));

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-app-frame-root]") ?? document.body;
    setPortalRoot(root);
  }, []);

  useEffect(() => {
    if (!portalRoot) return;

    const updateFrameHeight = () => {
      const nextHeight = portalRoot.getBoundingClientRect().height;
      setFrameHeight(nextHeight > 0 ? nextHeight : window.innerHeight);
    };

    updateFrameHeight();
    const resizeObserver = new ResizeObserver(updateFrameHeight);
    resizeObserver.observe(portalRoot);
    window.addEventListener("resize", updateFrameHeight);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateFrameHeight);
    };
  }, [portalRoot]);

  // One frame after mount: collapsed → expanded transition, in sync with keyboard open.
  useEffect(() => {
    if (!composerOpen) return;
    const id = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [composerOpen]);

  if (!portalRoot) return null;

  const emojiRail = (
    <div className="flex justify-between items-center gap-3 px-4 h-12 text-[30px] leading-none shrink-0">
      {["🤣", "😂", "😁", "🥰", "😳", "☺️", "😅"].map((emoji, index) => (
        <button
          key={`${emoji}-${index}`}
          type="button"
          className="flex justify-center items-center active:opacity-70 rounded-full outline-none size-10"
          aria-label={`React ${emoji}`}
          onClick={() => onRequestComposer()}
        >
          {emoji}
        </button>
      ))}
    </div>
  );

  const listComposerTrigger = (
    <div className="bg-tux-v2-ui-page-flat-1 border-tux-v2-ui-shape-neutral-3 border-t-[0.5px] border-solid shrink-0">
      {emojiRail}
      <div className="pb-[max(28px,calc(var(--app-safe-area-bottom)+20px))] flex items-center gap-2 px-4">
        <TUXAvatar size={40} src={friendsAuthorAvatarUrl("friends-me", 40)} alt="" ringColor="transparent" />
        <button
          type="button"
          className="flex flex-1 items-center bg-tux-v2-ui-shape-neutral-4 active:opacity-80 pr-3 pl-4 rounded-[24px] outline-none min-w-0 h-12 text-left"
          aria-label="Open comment composer"
          onClick={() => onRequestComposer()}
        >
          <TUXText typographyPreset="H4-Regular" color="UITextPlaceholder" className="flex-1 min-w-0">
            Add comment...
          </TUXText>
          <div className="flex items-center gap-3 ml-2 text-tux-v2-ui-text-1 shrink-0">
            <IconImageAlt1 width={24} height={24} />
            <IconEmoji width={24} height={24} />
            <IconAt width={24} height={24} />
          </div>
        </button>
      </div>
    </div>
  );

  const composer = (
    <CommentTextField
      ref={inputRef}
      avatarSrc={friendsAuthorAvatarUrl("friends-me", 40)}
      placeholder={composerPlaceholder}
      onSend={onSend}
    />
  );

  const composerPortal =
    composerOpen &&
    createPortal(
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ zIndex: APP_Z_OVERLAY }}
        role="dialog"
        aria-modal="true"
        aria-label={`${authorName} comment composer`}
      >
        <button
          type="button"
          className="z-20 absolute inset-0"
          style={{ backgroundColor: listOpen ? "rgba(0, 0, 0, 0.45)" : "rgba(0, 0, 0, 0.35)" }}
          aria-label="Close comment composer"
          onClick={onCloseComposer}
        />
        <div
          className={
            "absolute inset-x-0 bottom-0 z-30 flex w-full flex-col overflow-visible" +
            (listOpen ? " shadow-[0_-12px_32px_rgba(0,0,0,0.14)]" : "")
          }
        >
          <CommentComposerKeyboardShell
            keyboardLiftActive={keyboardLiftActive}
            className="w-full"
          >
            {composer}
          </CommentComposerKeyboardShell>
        </div>
      </div>,
      portalRoot,
    );

  return (
    <>
      <TUXSheet
        {...appFrameSheetChromeProps()}
        visible={listOpen}
        onVisibleChange={(nextVisible) => {
          if (!nextVisible) {
            onCloseComposer();
            onCloseList();
          }
        }}
        root={portalRoot}
        position="bottom"
        heightModePreset="fixed"
        height={`${sheetHeightPx}px`}
        closeOnOutsideClick
        dragHandle="hidden"
        draggable
        sheetBackgroundColor="transparent"
        testId="friends-comment-sheet"
      >
        <div
          className="flex flex-col w-full h-full min-h-0 overflow-hidden bg-tux-v2-ui-page-flat-1 shadow-[0_-12px_32px_rgba(0,0,0,0.18)] rounded-t-[20px]"
          role="dialog"
          aria-modal="true"
          aria-label={`${authorName} comments`}
        >
          <div className="relative flex justify-center items-center px-4 h-14 shrink-0">
            <TUXText typographyPreset="H4-Semibold" color="UIText1">
              {commentTitle}
            </TUXText>
            <button
              type="button"
              className="right-4 absolute flex justify-center items-center active:opacity-70 rounded-full outline-none size-9"
              aria-label="Close comments"
              onClick={() => {
                onCloseComposer();
                onCloseList();
              }}
            >
              <span className="font-light text-[36px] leading-none" aria-hidden>
                ×
              </span>
            </button>
          </div>
          <div className="flex-1 px-4 pt-5 pb-5 min-h-0 overflow-y-auto overscroll-contain">
            {comments.length > 0 ? (
              <div className="flex flex-col gap-5">
                {comments.map((comment, index) => {
                  const replyTarget = comment.author === "You" ? null : comment.author;
                  return (
                    <div
                      key={`${comment.authorId}-${index}-${comment.text}`}
                      className="flex items-start gap-3 min-w-0"
                    >
                      <button
                        type="button"
                        className="active:opacity-70 rounded-full outline-none shrink-0"
                        aria-label={`Reply to ${comment.author}`}
                        onClick={() => onRequestComposer(replyTarget)}
                      >
                        <TUXAvatar
                          size={40}
                          src={friendsAuthorAvatarUrl(comment.authorId, 40)}
                          alt=""
                          ringColor="transparent"
                        />
                      </button>
                      <div className="flex-1 min-w-0">
                        <button
                          type="button"
                          className="block active:opacity-70 outline-none w-full min-w-0 text-left"
                          aria-label={`Reply to ${comment.author}`}
                          onClick={() => onRequestComposer(replyTarget)}
                        >
                          <TUXText as="div" typographyPreset="H4-Semibold" color="UIText3" textDisplay="truncate">
                            {comment.author}
                          </TUXText>
                          <TUXText as="div" typographyPreset="H4-Regular" color="UIText1" className="mt-0.5 min-w-0" style={FRIENDS_FEED_H4_BODY_LINE_HEIGHT}>
                            {comment.replyToAuthor ? `@${comment.replyToAuthor} ` : ""}
                            {comment.text}
                          </TUXText>
                        </button>
                        <div className="flex justify-between items-center gap-4 mt-1">
                          <div className="flex items-center gap-5">
                            <TUXText typographyPreset="P2-Regular" color="UIText3">
                              {index === 0 ? "7m" : "6m"}
                            </TUXText>
                            <button
                              type="button"
                              className="bg-transparent active:opacity-70 p-0 border-0 outline-none text-left"
                              onClick={() => onRequestComposer(replyTarget)}
                            >
                              <TUXText typographyPreset="P2-Semibold" color="UIText3">
                                Reply
                              </TUXText>
                            </button>
                          </div>
                          <FriendsCommentSheetActions likeCountLabel={friendsCommentSheetLikeLabel(index)} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex justify-center items-center min-h-30">
                <TUXText typographyPreset="H4-Regular" color="UIText3">
                  No comments yet
                </TUXText>
              </div>
            )}
          </div>
          {listComposerTrigger}
        </div>
      </TUXSheet>
      {composerPortal}
    </>
  );
}

function PostShell({
  postId,
  authorId,
  authorName,
  timeLabel,
  caption,
  likeCount,
  commentCount,
  comments,
  primaryRowAction,
  mutualFriendAvatarIds,
  mutualFriendsExtraCount,
  onOpenDmFromFriends,
  followedFromSuggestedIds,
  onFollowFromSuggested,
  children,
}: {
  /** Stable feed-item id used to look up interaction state from the provider. */
  postId: string;
  authorId: string;
  authorName: string;
  timeLabel: string;
  caption: string;
  likeCount: number;
  commentCount: number;
  comments: FriendsFeedItem["comments"];
  primaryRowAction?: FriendsFeedItem["primaryRowAction"];
  mutualFriendAvatarIds?: FriendsFeedItem["mutualFriendAvatarIds"];
  mutualFriendsExtraCount?: FriendsFeedItem["mutualFriendsExtraCount"];
  onOpenDmFromFriends?: (peerAuthorId: string, peerDisplayName: string, trigger?: HTMLElement) => void;
  followedFromSuggestedIds?: ReadonlySet<string>;
  onFollowFromSuggested?: (authorId: string) => void;
  children?: ReactNode;
}) {
  const [commentListOpen, setCommentListOpen] = useState(false);
  const [commentComposerOpen, setCommentComposerOpen] = useState(false);
  const [replyTargetName, setReplyTargetName] = useState<string | null>(null);
  const [sharePanelVisible, setSharePanelVisible] = useState(false);
  const { liked, toggleLiked, commentsExpanded, toggleCommentsExpanded, addedComments, addComment } =
    useFriendsPostInteraction(postId);
  const visibleComments = [...comments, ...addedComments];
  const displayedCommentCount = commentCount + addedComments.length;
  const openCommentThreadFromIcon = () => {
    if (displayedCommentCount === 0) {
      setCommentListOpen(false);
      setReplyTargetName(null);
      setCommentComposerOpen(true);
      return;
    }
    setCommentListOpen(true);
    setReplyTargetName(null);
    setCommentComposerOpen(false);
  };
  const openCommentComposer = ({
    keepListOpen = false,
    replyTargetName: nextReplyTargetName = null,
  }: {
    keepListOpen?: boolean;
    replyTargetName?: string | null;
  } = {}) => {
    if (!keepListOpen) {
      setCommentListOpen(false);
    }
    setReplyTargetName(nextReplyTargetName);
    setCommentComposerOpen(true);
  };

  return (
    <article className="flex gap-3 px-4 py-4 border-tux-v2-ui-shape-neutral-3 border-b-[0.5px] border-solid">
      <div className="pt-0.5 shrink-0">
        <img
          src={friendsAuthorAvatarUrl(authorId, 40)}
          alt=""
          className="rounded-full ring-1 ring-tux-v2-ui-shape-neutral-3 size-10 object-cover"
          width={40}
          height={40}
        />
      </div>
      <div className="flex flex-col flex-1 gap-2.5 min-w-0">
        <div className="flex flex-col gap-1.5">
          <AuthorRow
            authorId={authorId}
            authorName={authorName}
            timeLabel={timeLabel}
            primaryRowAction={primaryRowAction}
            mutualFriendAvatarIds={mutualFriendAvatarIds}
            mutualFriendsExtraCount={mutualFriendsExtraCount}
            followedFromSuggestedIds={followedFromSuggestedIds}
            onFollowFromSuggested={onFollowFromSuggested}
            onOpenSharePanel={() => setSharePanelVisible(true)}
          />
          <TUXText
            typographyPreset="H4-Regular"
            color="UIText1"
            className="w-full min-w-0"
            style={FRIENDS_FEED_H4_BODY_LINE_HEIGHT}
          >
            {caption}
          </TUXText>
        </div>
        {children}
        <InteractionRow
          authorId={authorId}
          authorName={authorName}
          likeCount={likeCount}
          commentCount={displayedCommentCount}
          liked={liked}
          onToggleLiked={toggleLiked}
          onOpenComments={openCommentThreadFromIcon}
          onOpenDmFromFriends={onOpenDmFromFriends}
        />
        <div className="flex flex-col gap-3">
          <CommentPreview
            comments={visibleComments}
            expanded={commentsExpanded}
            onToggleExpanded={toggleCommentsExpanded}
            onReplyToComment={(nextReplyTargetName) =>
              openCommentComposer({ replyTargetName: nextReplyTargetName })
            }
          />
          <AddCommentBar
            onOpen={() => openCommentComposer()}
            onQuickEmojiComment={addComment}
          />
        </div>
      </div>
      <FriendsCommentSheet
        listOpen={commentListOpen}
        composerOpen={commentComposerOpen}
        authorName={authorName}
        replyTargetName={replyTargetName}
        comments={visibleComments}
        onCloseList={() => setCommentListOpen(false)}
        onCloseComposer={() => {
          setCommentComposerOpen(false);
          setReplyTargetName(null);
        }}
        onRequestComposer={(nextReplyTargetName) =>
          openCommentComposer({ keepListOpen: true, replyTargetName: nextReplyTargetName ?? null })
        }
        onSend={(text) => {
          addComment(text);
          setCommentComposerOpen(false);
          setReplyTargetName(null);
        }}
      />
      <SharePanel
        visible={sharePanelVisible}
        onVisibleChange={setSharePanelVisible}
        root={getAppFrameRootElement()}
      />
    </article>
  );
}

/** Text-only friend post (no media). */
export function FriendsPostText({
  item,
  onOpenDmFromFriends,
  followedFromSuggestedIds,
  onFollowFromSuggested,
}: {
  item: Extract<FriendsFeedItem, { kind: "text" }>;
  onOpenDmFromFriends?: (peerAuthorId: string, peerDisplayName: string, trigger?: HTMLElement) => void;
  followedFromSuggestedIds?: ReadonlySet<string>;
  onFollowFromSuggested?: (authorId: string) => void;
}) {
  return (
    <PostShell
      postId={item.id}
      authorId={item.authorId}
      authorName={item.authorName}
      timeLabel={item.timeLabel}
      caption={item.caption}
      likeCount={item.likeCount}
      commentCount={item.commentCount}
      comments={item.comments}
      primaryRowAction={item.primaryRowAction}
      mutualFriendAvatarIds={item.mutualFriendAvatarIds}
      mutualFriendsExtraCount={item.mutualFriendsExtraCount}
      onOpenDmFromFriends={onOpenDmFromFriends}
      followedFromSuggestedIds={followedFromSuggestedIds}
      onFollowFromSuggested={onFollowFromSuggested}
    />
  );
}

/** Friend post with a single image. */
export function FriendsPostSingleImage({
  item,
  onOpenDmFromFriends,
  followedFromSuggestedIds,
  onFollowFromSuggested,
}: {
  item: Extract<FriendsFeedItem, { kind: "single_image" }>;
  onOpenDmFromFriends?: (peerAuthorId: string, peerDisplayName: string, trigger?: HTMLElement) => void;
  followedFromSuggestedIds?: ReadonlySet<string>;
  onFollowFromSuggested?: (authorId: string) => void;
}) {
  const src = friendsPostThumbUrl(item.imageThumbIndex);
  return (
    <PostShell
      postId={item.id}
      authorId={item.authorId}
      authorName={item.authorName}
      timeLabel={item.timeLabel}
      caption={item.caption}
      likeCount={item.likeCount}
      commentCount={item.commentCount}
      comments={item.comments}
      primaryRowAction={item.primaryRowAction}
      mutualFriendAvatarIds={item.mutualFriendAvatarIds}
      mutualFriendsExtraCount={item.mutualFriendsExtraCount}
      onOpenDmFromFriends={onOpenDmFromFriends}
      followedFromSuggestedIds={followedFromSuggestedIds}
      onFollowFromSuggested={onFollowFromSuggested}
    >
      <button
        type="button"
        className="w-full overflow-hidden rounded-(--tux-v2-radius-content-large,8px) border border-solid border-tux-v2-ui-shape-neutral-3 bg-transparent p-0 text-left outline-none active:opacity-90"
        aria-label="Open post image"
        onClick={showFriendsImageToast}
      >
        <img src={src} alt="" className="w-full max-h-feed-cover object-cover" loading="lazy" />
      </button>
    </PostShell>
  );
}

/** Friend post with multiple images in a horizontal strip (carousel-style). */
export function FriendsPostMultiImage({
  item,
  onOpenDmFromFriends,
  followedFromSuggestedIds,
  onFollowFromSuggested,
}: {
  item: Extract<FriendsFeedItem, { kind: "multi_image" }>;
  onOpenDmFromFriends?: (peerAuthorId: string, peerDisplayName: string, trigger?: HTMLElement) => void;
  followedFromSuggestedIds?: ReadonlySet<string>;
  onFollowFromSuggested?: (authorId: string) => void;
}) {
  return (
    <PostShell
      postId={item.id}
      authorId={item.authorId}
      authorName={item.authorName}
      timeLabel={item.timeLabel}
      caption={item.caption}
      likeCount={item.likeCount}
      commentCount={item.commentCount}
      comments={item.comments}
      primaryRowAction={item.primaryRowAction}
      mutualFriendAvatarIds={item.mutualFriendAvatarIds}
      mutualFriendsExtraCount={item.mutualFriendsExtraCount}
      onOpenDmFromFriends={onOpenDmFromFriends}
      followedFromSuggestedIds={followedFromSuggestedIds}
      onFollowFromSuggested={onFollowFromSuggested}
    >
      <div className="flex flex-col gap-2 w-full min-w-0">
        <div className="box-border flex flex-row flex-nowrap gap-1.5 -mr-4 -ml-17 pb-0.5 w-friends-carousel-bleed-lg min-w-0 overflow-x-auto overflow-y-visible overscroll-x-contain touch-pan-x shrink-0 hide-scrollbar">
          {item.imageThumbIndices.map((idx, i) => {
            const isFirst = i === 0;
            const isLast = i === item.imageThumbIndices.length - 1;
            return (
            <button
              type="button"
              key={idx}
              className={
                "relative h-50 w-37.5 shrink-0 grow-0 basis-auto overflow-hidden rounded-(--tux-v2-radius-content-large,8px) border border-solid border-tux-v2-ui-shape-neutral-3 bg-transparent p-0 text-left outline-none active:opacity-90" +
                (isFirst ? " ml-17" : "") +
                (isLast ? " mr-4" : "")
              }
              aria-label="Open post image"
              onClick={showFriendsImageToast}
            >
              {isFirst ? (
                <div
                  className="top-2 left-2 z-1 absolute flex justify-center items-center rounded-[4px] w-[33px] h-5"
                  style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
                  aria-label={`${item.imageThumbIndices.length} photos`}
                >
                  <div className="flex justify-center items-center gap-[3px]">
                    <IconImageAlt1Fill
                      width={12}
                      height={12}
                      style={{ color: getColorCSSVar("UIImageOverlayWhite") }}
                    />
                    <span
                      className="font-semibold text-[12px] leading-[1.3] whitespace-nowrap"
                      style={{ color: getColorCSSVar("UIImageOverlayWhite") }}
                    >
                      {item.imageThumbIndices.length}
                    </span>
                  </div>
                </div>
              ) : null}
              <img
                src={friendsPostThumbUrl(idx)}
                alt=""
                className="size-full object-cover"
                loading="lazy"
              />
            </button>
            );
          })}
        </div>
        {item.anchorLabel ? (
          <div className="inline-flex items-center self-start gap-1.5 bg-tux-v2-ui-shape-neutral-4 p-1 rounded-[6px] max-w-full">
            <span
              className="flex justify-center items-center size-4.5 text-tux-v2-ui-text-1 shrink-0"
              aria-hidden
            >
              <IconAnchorEffect
                width={18}
                height={18}
                className="block max-w-full max-h-full text-tux-v2-ui-text-1"
              />
            </span>
            <TUXText
              typographyPreset="P3-Semibold"
              color="UIText1"
              textDisplay="truncate"
              className="min-w-0 leading-none!"
            >
              {item.anchorLabel}
            </TUXText>
          </div>
        ) : null}
      </div>
    </PostShell>
  );
}

export function FriendsFeedPost({
  item,
  onOpenDmFromFriends,
  followedFromSuggestedIds,
  onFollowFromSuggested,
}: {
  item: FriendsFeedItem;
  onOpenDmFromFriends?: (peerAuthorId: string, peerDisplayName: string, trigger?: HTMLElement) => void;
  followedFromSuggestedIds?: ReadonlySet<string>;
  onFollowFromSuggested?: (authorId: string) => void;
}) {
  if (item.kind === "text")
    return (
      <FriendsPostText
        item={item}
        onOpenDmFromFriends={onOpenDmFromFriends}
        followedFromSuggestedIds={followedFromSuggestedIds}
        onFollowFromSuggested={onFollowFromSuggested}
      />
    );
  if (item.kind === "single_image")
    return (
      <FriendsPostSingleImage
        item={item}
        onOpenDmFromFriends={onOpenDmFromFriends}
        followedFromSuggestedIds={followedFromSuggestedIds}
        onFollowFromSuggested={onFollowFromSuggested}
      />
    );
  return (
    <FriendsPostMultiImage
      item={item}
      onOpenDmFromFriends={onOpenDmFromFriends}
      followedFromSuggestedIds={followedFromSuggestedIds}
      onFollowFromSuggested={onFollowFromSuggested}
    />
  );
}
