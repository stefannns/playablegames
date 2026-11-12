import {
  getColorCSSVar,
  TUXNavBar,
  TUXNavBarIconAction,
  TUXText,
} from "@byted-tiktok/tux-web";
import {
  IconChevronLeftOffsetLTR,
  TUXIconEllipsisHorizontal,
  TUXIconPhone,
} from "@byted-tiktok/tux-icons";
import { AnimatePresence, motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { useAppFrame } from "../../../components/sys/app_frame";
import {
  getSoftKeyboardPresentedHeight,
  useSoftKeyboard,
} from "../../../components/sys/soft_keyboard";
import { showAppFrameTopToast } from "../../../components/sys/app_frame_top_toast";
import {
  type MessageThreadItem,
  type ReactionEmoji,
} from "../message_thread.types";
import { MessageActionBar } from "./message_action_bar";
import { MessageAlbumPanel } from "./message_album_panel";
import { MessageBubbleVisual } from "./message_bubble_visual";
import { MessageEmojiStickerPanel } from "./message_emoji_sticker_panel";
import {
  MessageInputBar,
  type MessageInputBarHandle,
} from "./message_input_bar";
import {
  MessageInputQuoteBar,
  MessageQuotedCard,
} from "./message_quote_card";
import { MessageReactionPicker } from "./message_reaction_picker";
import { ReactionPill } from "./message_reaction_pill";
import { MessageVoiceCall } from "./message_voice_call";
import {
  SENDER_BUBBLE_FALLBACK,
  SENDER_BUBBLE_GRADIENT,
} from "./message_send_gradient";

export type MessageThreadContentProps = {
  peerName: string;
  peerAvatarUrl: string;
  items: MessageThreadItem[];
  onBack: (trigger?: HTMLElement) => void;
  bottomAccessory?: ReactNode;
};

/** A message from the peer (left-aligned). Timestamps / sent messages are not. */
function isReceived(item: MessageThreadItem | undefined): boolean {
  return (
    item?.kind === "receive" ||
    item?.kind === "receive-emoji" ||
    item?.kind === "receive-image"
  );
}

/** Received kinds sit left, everything else right. */
function rowAlign(item: MessageThreadItem): "start" | "end" {
  return isReceived(item) ? "start" : "end";
}

/**
 * Vertical space *above* a row — mirrors iOS chat-room "under cell spacing"
 * (`AWEIMChatRoomMessageCellLayoutComponent`, New Padding / 改版组):
 *   - same sender, consecutive bubbles → 4px (tight run)
 *   - sender switches → 24px (clear speaker change)
 *   - around a timestamp → 16px each side (symmetric breathing room)
 * First row (no prev) gets none.
 */
function spaceAboveClass(
  prev: MessageThreadItem | undefined,
  curr: MessageThreadItem,
): string {
  if (!prev) return "";
  if (curr.kind === "timestamp" || prev.kind === "timestamp") return "mt-4";
  return rowAlign(prev) === rowAlign(curr) ? "mt-1" : "mt-6";
}

/**
 * iOS `isPureEmojiAndCountSmallerThan3:` (AWEIMMessageUI.m:560) — an outgoing
 * text message is rendered as a big, bubble-less emoji when it is *only* emoji
 * (spaces allowed, not counted) and holds **at most 3** of them. Anything else
 * (a non-emoji char, or 4+ emoji) falls back to a normal text bubble.
 *
 * Grapheme segmentation collapses ZWJ sequences / skin-tone / flag pairs into
 * one visible emoji, so the count matches what the user sees.
 */
function isBigEmojiText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  let emojiCount = 0;
  for (const { segment } of segmenter.segment(trimmed)) {
    if (/^\s+$/u.test(segment)) continue; // spaces allowed, not counted
    if (!/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(segment)) {
      return false; // a non-emoji character → normal bubble
    }
    emojiCount += 1;
    if (emojiCount > 3) return false;
  }
  return emojiCount > 0;
}

/** Clock label for inserted timestamps, e.g. `9:41 PM` — matches the seed data. */
function formatClock(ms: number): string {
  const d = new Date(ms);
  let h = d.getHours();
  const meridiem = h >= 12 ? "PM" : "AM";
  h %= 12;
  if (h === 0) h = 12;
  return `${h}:${String(d.getMinutes()).padStart(2, "0")} ${meridiem}`;
}

export function MessageThreadContent({
  peerName,
  peerAvatarUrl,
  items: initialItems,
  onBack,
  bottomAccessory,
}: MessageThreadContentProps) {
  const { floatingBottomInsetCss } = useAppFrame();
  const { isOpen: softKeyboardOpen } = useSoftKeyboard();
  const keyboardLiftPx = softKeyboardOpen
    ? getSoftKeyboardPresentedHeight()
    : 0;
  /** iOS DM gap above the keyboard — painted on the bottom bar, not bare margin. */
  const DM_COMPOSER_KEYBOARD_GAP_PX = 8;

  /**
   * Items become local state so long-press reactions can mutate them. Each DM
   * push mounts a fresh thread, so seeding from props once is enough (no sync
   * back to props needed — sticking with prop passing, no state library).
   */
  const [items, setItems] = useState<MessageThreadItem[]>(initialItems);

  /** Id of the message whose long-press reaction overlay is open, if any. */
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeItem =
    activeId != null
      ? (items.find((it) => "id" in it && it.id === activeId) ?? null)
      : null;

  /**
   * Quote-reply (TTD-24). `quotedId` is the message being replied to; the next
   * send attaches it as `quotedMessageId`. A ref mirror lets `appendOutgoing`
   * read it without re-binding on every quote change.
   */
  const [quotedId, setQuotedId] = useState<string | null>(null);
  const quotedIdRef = useRef<string | null>(null);
  const setQuote = useCallback((id: string | null) => {
    quotedIdRef.current = id;
    setQuotedId(id);
  }, []);
  const itemById = useCallback(
    (id: string | null | undefined): MessageThreadItem | undefined =>
      id == null ? undefined : items.find((it) => "id" in it && it.id === id),
    [items],
  );
  // Quoted-message author label: my messages → "You", peer's → their name.
  const quoteAuthor = useCallback(
    (item: MessageThreadItem | undefined) =>
      item && isReceived(item) ? peerName : "You",
    [peerName],
  );

  // 200ms long-press timer (matches iOS `minimumPressDuration = 0.2`);
  // cancelled by touch move / pointer up / scroll.
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearPress = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }, []);
  const pressHandlers = useCallback(
    (id: string) => ({
      onTouchStart: () => {
        clearPress();
        pressTimer.current = setTimeout(() => setActiveId(id), 200);
      },
      onTouchEnd: clearPress,
      onTouchMove: clearPress,
      onMouseDown: () => {
        clearPress();
        pressTimer.current = setTimeout(() => setActiveId(id), 200);
      },
      onMouseUp: clearPress,
      onMouseLeave: clearPress,
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
        clearPress();
        setActiveId(id);
      },
    }),
    [clearPress],
  );

  const handleSelectReaction = useCallback(
    (emoji: ReactionEmoji) => {
      setItems((prev) =>
        prev.map((it) =>
          "id" in it && it.id === activeId
            ? // toggle: tapping the active emoji clears it
              ({
                ...it,
                reaction: it.reaction === emoji ? undefined : emoji,
              } as MessageThreadItem)
            : it,
        ),
      );
      setActiveId(null);
    },
    [activeId],
  );

  // Delete: drop the active message; AnimatePresence plays the collapse exit.
  const handleDelete = useCallback(() => {
    setItems((prev) =>
      prev.filter((it) => !("id" in it) || it.id !== activeId),
    );
    setActiveId(null);
  }, [activeId]);

  // Reply (TTD-24): stash the long-pressed message as the active quote, close
  // the overlay, and focus the field so the user can type their reply.
  const handleReply = useCallback(() => {
    setQuote(activeId);
    setActiveId(null);
    requestAnimationFrame(() => inputBarRef.current?.focus());
  }, [activeId, setQuote]);

  /**
   * Each bubble registers its DOM node so a quote-card tap can scroll back to
   * the original message and play a bounce (scale 1→1.08 over 200ms, then
   * 1.08→1 over 300ms with an overshoot cubic — matches iOS reply jump).
   */
  const bubbleNodesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const registerBubbleNode = useCallback(
    (id: string) => (node: HTMLDivElement | null) => {
      const map = bubbleNodesRef.current;
      if (node) map.set(id, node);
      else map.delete(id);
    },
    [],
  );
  const handleJumpToQuoted = useCallback((targetId: string) => {
    const node = bubbleNodesRef.current.get(targetId);
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    node.animate?.(
      [
        { transform: "scale(1)", offset: 0, easing: "ease-out" },
        {
          transform: "scale(1.08)",
          offset: 0.4,
          easing: "cubic-bezier(0.25, 0, 0.8, 1.88)",
        },
        { transform: "scale(1)", offset: 1 },
      ],
      { duration: 500 },
    );
  }, []);

  // "Seen" shows under the most recent sent (right-aligned) message.
  let lastSentId: string | null = null;
  for (let i = items.length - 1; i >= 0; i -= 1) {
    const it = items[i];
    if ("id" in it && rowAlign(it) === "end") {
      lastSentId = it.id;
      break;
    }
  }

  /**
   * Chat threads should open at the **latest** message — user scrolls UP to
   * read history, not DOWN. Anchor the scroll container at its bottom on the
   * first paint of each newly mounted thread. Each DM push mounts a fresh
   * `MessageThreadContent` (see `FriendsPage` / `InboxPage` push stage), so
   * `[]` deps reliably run for every conversation a user opens.
   */
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  /** Skip bottom-bar scroll pinning until the thread's first layout pass settles. */
  const bottomBarResizeReadyRef = useRef(false);
  useLayoutEffect(() => {
    const node = scrollContainerRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
    const frame = window.requestAnimationFrame(() => {
      bottomBarResizeReadyRef.current = true;
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  /**
   * Input bar wiring (TTD-18). `inputBarRef` exposes `insertText` for the
   * emoji panel (F) to consume. `emojiPanelOpen` drives the bar's third
   * button state and is the mount point where F will render its panel.
   */
  const inputBarRef = useRef<MessageInputBarHandle>(null);
  const [emojiPanelOpen, setEmojiPanelOpen] = useState(false);
  const [albumPanelOpen, setAlbumPanelOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  // Unique id source for locally-sent messages; last-send time gates timestamps.
  const sendSeqRef = useRef(0);
  const lastSendAtRef = useRef<number | null>(null);
  const pendingScrollRef = useRef(false);
  const prevKeyboardLiftRef = useRef(0);

  // Pin the latest message when the keyboard slides in — same beat as iOS
  // shrinking the collection view from the bottom.
  useLayoutEffect(() => {
    if (keyboardLiftPx <= 0) {
      prevKeyboardLiftRef.current = 0;
      return;
    }
    if (prevKeyboardLiftRef.current === keyboardLiftPx) return;
    prevKeyboardLiftRef.current = keyboardLiftPx;
    const node = scrollContainerRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [keyboardLiftPx]);

  // Shared outgoing append: timestamp gating (>1 min since last send), stable
  // id, and scroll-to-bottom. `build` turns the id into the concrete message.
  const appendOutgoing = useCallback(
    (build: (id: string) => MessageThreadItem) => {
      const now = Date.now();
      // iOS `messageCombineInterval` = 5 min: a fresh timestamp is inserted
      // only when the gap since the last send exceeds it (AWEIMSetting.m).
      const needTimestamp =
        lastSendAtRef.current == null || now - lastSendAtRef.current > 300_000;
      lastSendAtRef.current = now;
      sendSeqRef.current += 1;
      const id = `local-${sendSeqRef.current}`;
      // Attach the active quote (if any), then clear it so the next send is clean.
      const quoted = quotedIdRef.current ?? undefined;
      const built = build(id);
      const withQuote =
        quoted && "id" in built
          ? ({ ...built, quotedMessageId: quoted } as MessageThreadItem)
          : built;
      if (quoted) setQuote(null);
      setItems((prev) => [
        ...prev,
        ...(needTimestamp
          ? [{ kind: "timestamp", label: formatClock(now) } as MessageThreadItem]
          : []),
        withQuote,
      ]);
      pendingScrollRef.current = true;
    },
    [setQuote],
  );

  const handleSendText = useCallback(
    (body: string) =>
      appendOutgoing((id) =>
        // Pure-emoji (≤3) sends render as a big bubble-less emoji, matching iOS.
        isBigEmojiText(body)
          ? { kind: "send-emoji", id, emoji: body.trim() }
          : { kind: "send", id, text: body },
      ),
    [appendOutgoing],
  );

  // Action bar (TTD): tapping ❤️/😂/👍 sends that emoji as a 140px sticker.
  const handleSendSticker = useCallback(
    (imageSrc: string) =>
      appendOutgoing((id) => ({ kind: "send-sticker", id, imageSrc })),
    [appendOutgoing],
  );

  // Every other action-bar entry is a stub → a dismissable "Coming soon" toast.
  const handleComingSoon = useCallback(() => {
    showAppFrameTopToast({
      text: "Coming soon",
      duration: 1500,
      displayMode: "replace",
    });
  }, []);

  // Album send (G): each picked photo becomes its own image message, in order.
  // `appendOutgoing` gates the leading timestamp, so only the first of the batch
  // carries one (the rest land within the 5-min combine window).
  const handleSendImages = useCallback(
    (imageSrcs: string[]) =>
      imageSrcs.forEach((imageSrc) =>
        appendOutgoing((id) => ({ kind: "send-image", id, imageSrc })),
      ),
    [appendOutgoing],
  );

  // After a send appends rows, jump the viewport to the newest message.
  useLayoutEffect(() => {
    if (!pendingScrollRef.current) return;
    pendingScrollRef.current = false;
    const node = scrollContainerRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  });

  /**
   * Keep the conversation pinned to its **offset-from-bottom** when the input
   * area grows or shrinks — the emoji/sticker panel sliding up, the quote-reply
   * bar appearing, or the textarea wrapping to multiple lines. iOS shrinks the
   * message-list frame from the bottom while preserving `contentOffsetFromBottom`
   * (AWEIMMessageBaseViewController.m:1267 / :1903), so the messages rise *with*
   * the panel instead of staying glued to the top with the newest ones clipped
   * behind it.
   *
   * We restore an **absolute** target scrollTop (distance-from-bottom held
   * constant), not an incremental delta. A delta double-counts on close: the
   * browser already clamps scrollTop down by the same amount when the scroller
   * grows back, so adding our own shift lands the view a panel-height short of
   * the newest message. `frozen` holds the intended distance steady for the
   * duration of a resize burst so the transient scroll events the browser fires
   * mid-clamp don't corrupt it.
   */
  const bottomBarRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    bottomBarResizeReadyRef.current = false;
    return () => {
      bottomBarResizeReadyRef.current = false;
    };
  }, []);
  useEffect(() => {
    const bar = bottomBarRef.current;
    const scroller = scrollContainerRef.current;
    if (!bar || !scroller || typeof ResizeObserver === "undefined") return;

    const distanceFromBottom = () =>
      Math.max(0, scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight);

    let distance = distanceFromBottom();
    let frozen: number | null = null;
    let settle: ReturnType<typeof setTimeout> | null = null;

    // Track the user's intended distance only while no resize is in flight.
    const onScroll = () => {
      if (frozen == null) distance = distanceFromBottom();
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });

    const observer = new ResizeObserver(() => {
      if (!bottomBarResizeReadyRef.current) return;
      if (frozen == null) frozen = distance; // freeze intent at burst start
      scroller.scrollTop = scroller.scrollHeight - scroller.clientHeight - frozen;
      if (settle) clearTimeout(settle);
      settle = setTimeout(() => {
        frozen = null;
      }, 100);
    });
    observer.observe(bar);

    return () => {
      scroller.removeEventListener("scroll", onScroll);
      observer.disconnect();
      if (settle) clearTimeout(settle);
    };
  }, []);

  /**
   * Outgoing bubble — Instagram-style "shared gradient through a window".
   *
   * Conceptually there is **one** gradient layer pinned to the visible chat
   * area, and every sender bubble is a window onto that one layer. A bubble
   * near the bottom samples the purple end; a bubble near the top samples
   * the blue end; scrolling moves bubbles through the (stationary) gradient
   * and their color shifts — exactly the IG/iMessage feel.
   *
   * We *cannot* implement this with `background-attachment: fixed`: the
   * `PagePushStage` wrapper (see `src/hooks/page_push.tsx`) always applies a
   * `transform` + `will-change: transform` to each pushed page, which
   * replaces the containing block for `fixed` backgrounds with that
   * (per-page) wrapper and on top of that some browsers degrade it to
   * `scroll` once a transformed ancestor + a scrolling ancestor are
   * combined. The visible bug: each bubble paints its own copy of the full
   * gradient, so larger bubbles look more purple just because their
   * bottom-right corner is bigger.
   *
   * Instead we compute the gradient slice manually: every sender bubble
   * gets the same `background-image`, but `background-size` is set to the
   * scroll container's visible width/height and `background-position` is
   * set to the bubble's negative offset within that container. All bubbles
   * together then tile out a single, virtual gradient pinned to the chat
   * viewport. The effect runs on scroll (rAF-throttled) and on container
   * resize, plus once after every render to catch layout shifts (new
   * messages, fonts loading, push transitions settling, etc.).
   *
   * `backgroundColor` stays as the 30%-stop solid color so the first paint
   * (before the layout effect runs) doesn't flash transparent.
   */
  const senderBubbleStyle: CSSProperties = {
    backgroundColor: SENDER_BUBBLE_FALLBACK,
    backgroundImage: SENDER_BUBBLE_GRADIENT,
    backgroundRepeat: "no-repeat",
    color: getColorCSSVar("UIShapeText1OnPrimary"),
  };

  const senderBubblesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const registerSenderBubble = useCallback(
    (key: string) => (node: HTMLDivElement | null) => {
      const map = senderBubblesRef.current;
      if (node) {
        map.set(key, node);
      } else {
        map.delete(key);
      }
    },
    [],
  );
  const updateSenderGradients = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const sizeCss = `${containerRect.width}px ${containerRect.height}px`;
    senderBubblesRef.current.forEach((bubble) => {
      const bubbleRect = bubble.getBoundingClientRect();
      const offsetX = bubbleRect.left - containerRect.left;
      const offsetY = bubbleRect.top - containerRect.top;
      bubble.style.backgroundSize = sizeCss;
      bubble.style.backgroundPosition = `${-offsetX}px ${-offsetY}px`;
    });
  }, []);
  useLayoutEffect(() => {
    updateSenderGradients();
  });
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    let rafId: number | null = null;
    const schedule = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        updateSenderGradients();
      });
    };
    container.addEventListener("scroll", schedule, { passive: true });
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(schedule)
        : null;
    resizeObserver?.observe(container);
    window.addEventListener("resize", schedule);
    return () => {
      container.removeEventListener("scroll", schedule);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", schedule);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [updateSenderGradients]);

  const receiverBubbleStyle: CSSProperties = {
    backgroundColor: getColorCSSVar("UISheetGrouped1"),
    color: getColorCSSVar("UIText1"),
  };

  return (
    <div
      className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-tux-v2-ui-page-flat-1 pt-app-frame-top"
    >
      {/* iOS DM nav is 56pt tall; TUXNavBar only offers 44|52, so we wrap the
          52 preset in a 2px top/bottom band (same white bg) → 56 total. */}
      <div
        className="shrink-0 bg-tux-v2-ui-page-flat-1"
        style={{ paddingTop: "2px", paddingBottom: "2px" }}
      >
      <TUXNavBar
        heightPreset={52}
        /**
         * `titleAlign="start"` drops `flex: 1` from the leading slot
         * (default `"center"` mirrors leading + trailing for balanced iOS
         * titles) and applies it to the empty title slot instead, so the
         * merged back + avatar + name cluster sits fully left-aligned and
         * the trailing icon group stays pinned right.
         */
        titleAlign="start"
        showSeparator={false}
        backgroundColor="UIPageFlat1"
        leading={
          /**
           * iMessage / TikTok DM pattern: back chevron and the peer
           * avatar + name belong to the **same** visual cluster, so we
           * compose them in one flex container here rather than using
           * TUXNavBar's separate `customTitle` slot. That eliminates the
           * built-in 4 px margin between the leading and title slots and
           * lets the chevron sit flush against the avatar — the natural
           * 10 px of empty space inside the 42 px wide back button is the
           * only visual gap, which matches the spec.
           */
          <div className="flex items-center">
            <button
              type="button"
              aria-label="Back"
              className="flex h-11 w-10.5 flex-col items-center justify-center"
              onClick={(event) => onBack(event.currentTarget)}
            >
              <IconChevronLeftOffsetLTR width={22} height={22} />
            </button>
            <div className="flex min-w-0 items-center gap-2">
              <img
                src={peerAvatarUrl}
                alt=""
                className="size-8 shrink-0 rounded-full object-cover"
              />
              {/* iOS DM (youthful): title is Headline 16px / Medium (500),
                  not semibold — the default-experiment Bold is heavier. */}
              <span className="truncate text-[16px] font-medium leading-[1.3] text-tux-v2-ui-text-1">
                {peerName}
              </span>
            </div>
          </div>
        }
        trailing={
          <div className="flex items-center">
            <TUXNavBarIconAction
              aria-label="Call"
              width="44px"
              height="44px"
              padding="10px 9px"
              onClick={() => setCallOpen(true)}
              icon={
                <TUXIconPhone
                  size={24}
                  color="var(--tux-v2-color-ui-text-1)"
                />
              }
            />
            <TUXNavBarIconAction
              aria-label="More"
              width="44px"
              height="44px"
              padding="10px 9px"
              icon={
                <TUXIconEllipsisHorizontal
                  size={24}
                  color="var(--tux-v2-color-ui-text-1)"
                />
              }
            />
          </div>
        }
      />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div
          ref={scrollContainerRef}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-0 pb-2 pt-2"
        >
          {/*
           * `min-h-full + justify-end` anchors short threads (e.g. a chat
           * with only a couple of messages) to the bottom of the viewport,
           * matching iMessage / TikTok DM. For long threads (taller than
           * the container), the `useLayoutEffect` above scrolls the box to
           * its bottom on mount so the latest message is in view.
           */}
          <div className="flex min-h-full flex-col justify-end">
            <AnimatePresence initial={false}>
              {items.map((item, index) => {
                const key = `${item.kind}-${index}`;
                const topGap = spaceAboveClass(items[index - 1], item);
              if (item.kind === "timestamp") {
                return (
                  <div
                    key={key}
                    className={`flex justify-center px-12 ${topGap}`}
                  >
                    <TUXText
                      typographyPreset="P3-Regular"
                      color="UIText3"
                      align="center"
                    >
                      {item.label}
                    </TUXText>
                  </div>
                );
              }

              // All reactable kinds (everything but timestamp / send-link)
              // share one row: optional avatar gutter, the bubble visual wired
              // for long-press, and a reaction pill below.
              if (
                item.kind === "receive" ||
                item.kind === "send" ||
                item.kind === "send-emoji" ||
                item.kind === "receive-emoji" ||
                item.kind === "send-image" ||
                item.kind === "receive-image" ||
                item.kind === "send-sticker" ||
                item.kind === "shared-post" ||
                item.kind === "video" ||
                item.kind === "send-link"
              ) {
                const align = rowAlign(item);
                const isMe = align === "end";
                // Avatar shows only on the last message of a consecutive
                // received run — i.e. when the next item isn't also received
                // (a timestamp / sent message / end-of-thread breaks the group).
                const showAvatar = !isMe && !isReceived(items[index + 1]);
                return (
                  <motion.div
                    key={item.id}
                    exit={{ opacity: 0, height: 0, scale: 0.8 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    // No overflow-hidden — quote jump scales the bubble to 1.08×;
                    // clipping here would crop the bounce (iOS reply jump).
                    className={`flex w-full ${topGap} ${isMe ? "justify-end pr-3" : "pl-3"}`}
                  >
                    {!isMe ? (
                      <div
                        className="mr-2 size-[30px] shrink-0 self-end overflow-hidden rounded-full"
                        aria-hidden={!showAvatar}
                      >
                        {showAvatar ? (
                          <img
                            src={peerAvatarUrl}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : null}
                      </div>
                    ) : null}
                    <div
                      className={`flex min-w-0 flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      {"quotedMessageId" in item && item.quotedMessageId ? (
                        <MessageQuotedCard
                          quoted={itemById(item.quotedMessageId)}
                          authorName={quoteAuthor(itemById(item.quotedMessageId))}
                          align={isMe ? "end" : "start"}
                          onJump={() =>
                            handleJumpToQuoted(item.quotedMessageId as string)
                          }
                        />
                      ) : null}
                      <div
                        {...pressHandlers(item.id)}
                        ref={registerBubbleNode(item.id)}
                        className="cursor-pointer select-none"
                        style={{
                          touchAction: "manipulation",
                          WebkitTouchCallout: "none",
                        }}
                      >
                        <MessageBubbleVisual
                          item={item}
                          senderBubbleStyle={senderBubbleStyle}
                          receiverBubbleStyle={receiverBubbleStyle}
                          senderBubbleRef={
                            isMe ? registerSenderBubble(item.id) : undefined
                          }
                        />
                      </div>
                      <ReactionPill emoji={item.reaction} align={align} />
                      {isMe && item.id === lastSentId ? (
                        <TUXText
                          typographyPreset="P3-Regular"
                          color="UIText2"
                          className="mr-1 mt-1"
                        >
                          Seen
                        </TUXText>
                      ) : null}
                    </div>
                  </motion.div>
                );
              }

                return null;
              })}
            </AnimatePresence>
          </div>
        </div>

        <div
          ref={bottomBarRef}
          className="relative z-1 flex flex-none flex-col gap-2 bg-tux-v2-ui-page-flat-1 px-4 pt-2"
          style={{
            paddingBottom:
              keyboardLiftPx > 0
                ? `${DM_COMPOSER_KEYBOARD_GAP_PX}px`
                : floatingBottomInsetCss,
            // Layout lift (not transform) so the input stack clears the soft
            // keyboard, ResizeObserver keeps scroll pinned, and we avoid calc()
            // with CSS vars inside transform (which was a no-op in some builds).
            marginBottom: keyboardLiftPx > 0 ? `${keyboardLiftPx}px` : undefined,
            transition:
              keyboardLiftPx > 0
                ? "margin-bottom 280ms cubic-bezier(0.32, 0.72, 0, 1), padding-bottom 280ms cubic-bezier(0.32, 0.72, 0, 1)"
                : "margin-bottom 240ms cubic-bezier(0.4, 0, 0.2, 1), padding-bottom 240ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Quick-action bar — topmost, above the quote strip (iOS order).
              iOS hides it while a message is being quoted
              (`ChatInputActionBarFeaturePack.swift` shows the bar only when
              `currentQuotedMessage == nil`), so the quote strip takes its slot.
              Collapse with the same height+opacity transition as the strip. */}
          <AnimatePresence initial={false}>
            {quotedId == null ? (
              <motion.div
                key="action-bar"
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.1 }}
                // `-mx-4` (moved off the bar itself) gives the row its
                // edge-to-edge scroll; `overflow-hidden` here only clips the
                // height collapse, not the horizontal bleed.
                className="-mx-4 overflow-hidden"
              >
                <MessageActionBar
                  onSendSticker={handleSendSticker}
                  onComingSoon={handleComingSoon}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
          {/* Quote-reply strip (TTD-24) — sits above the input pill. */}
          <AnimatePresence initial={false}>
            {quotedId != null ? (
              <MessageInputQuoteBar
                key="quote-bar"
                quoted={itemById(quotedId)}
                authorName={quoteAuthor(itemById(quotedId))}
                onCancel={() => setQuote(null)}
              />
            ) : null}
          </AnimatePresence>
          <MessageInputBar
            ref={inputBarRef}
            onSend={handleSendText}
            isEmojiPanelOpen={emojiPanelOpen}
            onToggleEmojiPanel={() => setEmojiPanelOpen((open) => !open)}
            // Album drawer (G) — opens the modal photo picker overlay.
            onOpenAlbum={() => setAlbumPanelOpen(true)}
          />
          {/* Emoji & sticker panel (F) — slides up to replace the keyboard. */}
          <AnimatePresence>
            {emojiPanelOpen ? (
              <MessageEmojiStickerPanel
                key="emoji-sticker-panel"
                onInsertEmoji={(emoji) =>
                  inputBarRef.current?.insertText(emoji)
                }
              />
            ) : null}
          </AnimatePresence>
          {bottomAccessory}
        </div>
      </div>

      <AnimatePresence>
        {activeItem ? (
          <MessageReactionPicker
            key="reaction-picker"
            item={activeItem}
            align={rowAlign(activeItem)}
            senderBubbleStyle={senderBubbleStyle}
            receiverBubbleStyle={receiverBubbleStyle}
            onSelectReaction={handleSelectReaction}
            onReply={handleReply}
            onDelete={handleDelete}
            onClose={() => setActiveId(null)}
          />
        ) : null}
      </AnimatePresence>

      {/* Album drawer (G) — modal bottom sheet + scrim, sits above everything. */}
      <AnimatePresence>
        {albumPanelOpen ? (
          <MessageAlbumPanel
            key="album-panel"
            onSend={handleSendImages}
            onClose={() => setAlbumPanelOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      {/* Voice call (H) — full-screen ringing surface + minimizable widget.
          MessageVoiceCall owns its own AnimatePresence for the surface ⇄ widget
          crossfade, so it is mounted directly (no outer AnimatePresence — nesting
          presence contexts froze the surface's enter opacity mid-animation). */}
      {callOpen ? (
        <MessageVoiceCall
          peerName={peerName}
          peerAvatarUrl={peerAvatarUrl}
          onClose={() => setCallOpen(false)}
        />
      ) : null}
    </div>
  );
}
