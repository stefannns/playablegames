import { TUXText, getColorCSSVar } from "@byted-tiktok/tux-web";
import { IconRepostFill, IconPenFill } from "@byted-tiktok/tux-icons";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  avatarFor,
  getReposterPreview,
  SELF_AVATAR_SLOT,
} from "./repost_interaction_data.ts";

/**
 * Feed white bar ("白条") — web recreation of iOS `TTKUpvoteNewBubbleElement`:
 *  - Guide → reposted (you tap from the empty/guide state): the guide fades
 *    out, the reposted bubble fades in (AnimatePresence mode="wait", 0.15s).
 *  - Follow-repost (you join existing reposters): the bar stays mounted and
 *    your avatar scales/fades into the FRONT of the stack — an insert, not a
 *    whole-bubble crossfade (`insertAvatarToTheFront:animated`).
 *  - Note carousel: when others have also reposted, the whole pill content
 *    crossfades (opacity replace) between your note and "{N} reposted" — no
 *    width morph.
 */

const BAR_HEIGHT = 28;
const AVATAR = 20;
const LABEL_LINE = "16px";
const FADE = { duration: 0.15, ease: "linear" as const };
const SPRINGY = { duration: 0.24, ease: [0.2, 0.8, 0.2, 1] as const };

function AvatarStack({ slots, enterFront }: { slots: number[]; enterFront: boolean }) {
  if (slots.length === 0) return null;
  return (
    <span className="flex items-center" style={{ paddingLeft: 2 }}>
      {slots.map((slot, i) => {
        const style = {
          width: AVATAR,
          height: AVATAR,
          marginLeft: i === 0 ? 0 : -10,
          boxShadow: `0 0 0 2px ${getColorCSSVar("UIImageOverlayWhite")}`,
          zIndex: slots.length - i,
          position: "relative" as const,
        };
        // Only the newly-inserted front avatar animates in (on follow-repost).
        if (enterFront && i === 0) {
          return (
            <motion.img
              key={slot}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={SPRINGY}
              src={avatarFor(slot, AVATAR * 2)}
              alt=""
              className="rounded-full object-cover"
              style={style}
            />
          );
        }
        return (
          <img
            key={slot}
            src={avatarFor(slot, AVATAR * 2)}
            alt=""
            className="rounded-full object-cover"
            style={style}
          />
        );
      })}
    </span>
  );
}

export type RepostWhiteBarProps = {
  reposterIds: string[];
  isReposted: boolean;
  note: string;
  onRepost: () => void;
  onOpenPanel: () => void;
  onOpenNote: () => void;
};

export function RepostWhiteBar({
  reposterIds,
  isReposted,
  note,
  onRepost,
  onOpenPanel,
  onOpenNote,
}: RepostWhiteBarProps) {
  const preview = getReposterPreview(reposterIds);
  const reduceMotion = useReducedMotion();
  const animate = !reduceMotion;

  // Carousel the note only when OTHERS have also reposted.
  const rotating = isReposted && Boolean(note) && preview.count > 0;
  const [phase, setPhase] = useState(0);
  const [op, setOp] = useState(1);
  const swapTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!rotating) {
      setPhase(0);
      setOp(1);
      return;
    }
    const iv = window.setInterval(() => {
      setOp(0); // whole-content opacity replace (no width tween)
      swapTimerRef.current = window.setTimeout(() => {
        setPhase((p) => (p + 1) % 2);
        setOp(1);
      }, 200);
    }, 3000);
    return () => {
      window.clearInterval(iv);
      if (swapTimerRef.current != null) window.clearTimeout(swapTimerRef.current);
    };
  }, [rotating]);

  // Detect the false→true repost flip — derived during render so the inserted
  // self avatar mounts WITH its entrance animation on the very same frame.
  const prevReposted = useRef(isReposted);
  const justReposted =
    isReposted && !prevReposted.current && preview.count > 0 && animate;
  useEffect(() => {
    prevReposted.current = isReposted;
  }, [isReposted]);
  const enterFront = justReposted;

  const stateKey = !isReposted && preview.count === 0 ? "guide" : "reposted";
  const total = preview.count + 1; // friends + you
  const selfStack = [SELF_AVATAR_SLOT, ...preview.avatarSlots].slice(0, 3);

  // Reposted-bar content (covers friends-only, self-only, self+friends).
  const showingNote = Boolean(note) && (!rotating || phase === 0);
  let slots: number[];
  let label: string;
  if (isReposted) {
    if (note && showingNote) {
      slots = [SELF_AVATAR_SLOT];
      label = `“${note}”`;
    } else if (preview.count > 0) {
      slots = selfStack;
      label = `${total} reposted`;
    } else {
      slots = [SELF_AVATAR_SLOT];
      label = "You reposted";
    }
  } else {
    slots = preview.avatarSlots;
    label = `${preview.count} reposted`;
  }

  const crossfade = {
    initial: animate ? { opacity: 0 } : false,
    animate: { opacity: 1 },
    exit: animate ? { opacity: 0 } : undefined,
    transition: FADE,
  };

  return (
    <div className="self-start mb-1" data-no-long-press>
      <AnimatePresence mode="wait" initial={false}>
        {stateKey === "guide" ? (
          <motion.button
            key="guide"
            {...crossfade}
            type="button"
            aria-label="Repost to followers"
            onClick={onRepost}
            className="flex items-center gap-1 bg-tux-v2-feed-anchor-bg px-1.5 rounded cursor-pointer"
            style={{ height: BAR_HEIGHT }}
          >
            <IconRepostFill className="text-tux-v2-ui-image-overlay-white" width={16} height={16} />
            <TUXText
              typographyPreset="P2-Semibold"
              className="whitespace-nowrap"
              style={{ color: getColorCSSVar("UIImageOverlayWhite"), lineHeight: LABEL_LINE }}
            >
              Repost to followers
            </TUXText>
          </motion.button>
        ) : (
          <motion.div key="reposted" {...crossfade} className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="View reposts"
              onClick={onOpenPanel}
              className="flex items-center bg-tux-v2-ui-image-overlay-white pl-0.5 pr-1.75 rounded max-w-[240px] cursor-pointer"
              style={{ height: BAR_HEIGHT }}
            >
              <span
                className="inline-flex items-center gap-1.5"
                style={{ opacity: op, transition: "opacity 200ms ease" }}
              >
                <AvatarStack slots={slots} enterFront={enterFront} />
                <TUXText
                  typographyPreset="P2-Semibold"
                  className="truncate"
                  style={{ color: getColorCSSVar("UIImageOverlayBlack"), lineHeight: LABEL_LINE }}
                >
                  {label}
                </TUXText>
              </span>
            </button>

            {/* Right-side action: quick-repost (others reposted, you haven't)
                or pen to add a note (you reposted, no note yet). */}
            {!isReposted ? (
              <button
                type="button"
                aria-label="Repost to followers"
                onClick={onRepost}
                className="flex justify-center items-center bg-tux-v2-feed-anchor-bg rounded cursor-pointer"
                style={{ width: BAR_HEIGHT, height: BAR_HEIGHT }}
              >
                <IconRepostFill className="text-tux-v2-ui-image-overlay-white" width={16} height={16} />
              </button>
            ) : !note ? (
              <button
                type="button"
                aria-label="Add note"
                onClick={onOpenNote}
                className="flex justify-center items-center bg-tux-v2-feed-anchor-bg rounded cursor-pointer"
                style={{ width: BAR_HEIGHT, height: BAR_HEIGHT }}
              >
                <IconPenFill className="text-tux-v2-ui-image-overlay-white" width={16} height={16} />
              </button>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
