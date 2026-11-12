import { TUXText, getColorCSSVar } from "@byted-tiktok/tux-web";
import { IconLike, IconLikeFill, IconArrowTriangleRightFillLTR } from "@byted-tiktok/tux-icons";
import { useState } from "react";
import {
  avatarFor,
  formatCompact,
  type RepostEntry,
  type RepostReply,
} from "./repost_interaction_data.ts";

/**
 * One repost in the public-interaction list, matching Figma 121:20593.
 * Top-level repost: 48px avatar, 16/SemiBold name, 15/Regular note, an actions
 * row (date · Reply), and a right-hand like column. Replies render inline,
 * indented (28px avatar, optional "A ▸ B" reply-to header).
 */

const LIKE_COL_WIDTH = 36;

function LikeColumn({
  count,
  liked,
  onToggle,
}: {
  count: number;
  liked: boolean;
  onToggle: () => void;
}) {
  const color = liked ? getColorCSSVar("UIShapePrimary") : getColorCSSVar("UIText3");
  const display = count + (liked ? 1 : 0);
  return (
    <button
      type="button"
      aria-label={liked ? "Unlike" : "Like"}
      aria-pressed={liked}
      onClick={onToggle}
      className="flex flex-col items-center justify-center gap-0.5 flex-none border-0 bg-transparent"
      style={{ width: LIKE_COL_WIDTH, height: 48 }}
    >
      {liked ? (
        <IconLikeFill width={20} height={20} style={{ color }} />
      ) : (
        <IconLike width={20} height={20} style={{ color }} />
      )}
      <TUXText
        as="span"
        style={{
          fontSize: 12,
          fontWeight: 500,
          lineHeight: "15.6px",
          color,
          opacity: display > 0 ? 1 : 0,
        }}
      >
        {display > 0 ? formatCompact(display) : "0"}
      </TUXText>
    </button>
  );
}

function ActionMetaRow({
  timeLabel,
  isSelf,
  onRemove,
}: {
  timeLabel: string;
  isSelf?: boolean;
  onRemove?: () => void;
}) {
  // Time and the action labels share one baseline; same line-height + leading-trim
  // via flex items-center keeps "Aug 2" and "Reply" aligned.
  return (
    <div className="flex items-center gap-3 leading-none">
      <span
        style={{
          fontSize: 12,
          fontWeight: 400,
          lineHeight: "15.6px",
          color: getColorCSSVar("UITextPlaceholder"),
        }}
      >
        {timeLabel}
      </span>
      <button type="button" className="flex items-center cursor-pointer border-0 bg-transparent p-0">
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            lineHeight: "15.6px",
            color: getColorCSSVar("UIText3"),
          }}
        >
          Reply
        </span>
      </button>
      {isSelf ? (
        <button
          type="button"
          className="flex items-center cursor-pointer border-0 bg-transparent p-0"
          onClick={onRemove}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              lineHeight: "15.6px",
              color: getColorCSSVar("UIText3"),
            }}
          >
            Remove
          </span>
        </button>
      ) : null}
    </div>
  );
}

function ReplyRow({ reply }: { reply: RepostReply }) {
  const [liked, setLiked] = useState(Boolean(reply.liked));
  return (
    <div
      className="flex items-start justify-between"
      style={{ paddingLeft: 74, paddingRight: 10, paddingTop: 6, paddingBottom: 10 }}
    >
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <img
          src={avatarFor(reply.avatarSlot, 56)}
          alt=""
          className="flex-none rounded-full object-cover"
          style={{ width: 28, height: 28 }}
          loading="lazy"
        />
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-[3px] min-w-0">
            <TUXText
              as="span"
              style={{
                fontSize: 15,
                fontWeight: 600,
                lineHeight: "19.5px",
                color: getColorCSSVar("UIText1"),
                whiteSpace: "nowrap",
              }}
            >
              {reply.authorName}
            </TUXText>
            {reply.replyToName ? (
              <>
                <IconArrowTriangleRightFillLTR
                  width={16}
                  height={16}
                  style={{ color: getColorCSSVar("UIText1") }}
                />
                <TUXText
                  as="span"
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    lineHeight: "19.5px",
                    color: getColorCSSVar("UIText1"),
                    whiteSpace: "nowrap",
                  }}
                >
                  {reply.replyToName}
                </TUXText>
              </>
            ) : null}
          </div>
          <TUXText
            as="div"
            style={{
              fontSize: 15,
              fontWeight: 400,
              lineHeight: "19.5px",
              color: getColorCSSVar("UIText1"),
              wordBreak: "break-word",
              padding: "2px 0",
            }}
          >
            {reply.content}
          </TUXText>
          <ActionMetaRow timeLabel={reply.timeLabel} />
        </div>
      </div>
      <LikeColumn count={reply.likeCount} liked={liked} onToggle={() => setLiked((v) => !v)} />
    </div>
  );
}

export function RepostInteractionCell({
  entry,
  onRemove,
}: {
  entry: RepostEntry;
  onRemove?: () => void;
}) {
  const [liked, setLiked] = useState(Boolean(entry.liked));
  const hasNote = Boolean(entry.note && entry.note.trim().length > 0);

  return (
    <div className="flex flex-col">
      {/* Top-level repost */}
      <div
        className="flex items-start gap-3"
        style={{ paddingLeft: 16, paddingRight: 10, paddingTop: 10, paddingBottom: 10 }}
      >
        {/* When there's no note the content is shorter than the avatar, so
            center it; with a note, top-align so the name sits by the avatar top. */}
        <div
          className={`flex gap-2.5 flex-1 min-w-0 ${hasNote ? "items-start" : "items-center"}`}
        >
          <img
            src={avatarFor(entry.avatarSlot, 96)}
            alt={`${entry.authorName} avatar`}
            className="flex-none rounded-full object-cover"
            style={{ width: 48, height: 48 }}
            loading="lazy"
          />
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            {/* Name truncates within its column so a long nickname never runs
                under the right-hand like column. No "You" / "· You" suffix. */}
            <div className="min-w-0">
              <TUXText
                as="span"
                className="block truncate"
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  lineHeight: "20.8px",
                  color: getColorCSSVar("UIText1"),
                }}
              >
                {entry.authorName}
              </TUXText>
            </div>
            {hasNote ? (
              <TUXText
                as="div"
                style={{
                  fontSize: 15,
                  fontWeight: 400,
                  lineHeight: "19.5px",
                  color: getColorCSSVar("UIText1"),
                  wordBreak: "break-word",
                  padding: "3px 0",
                }}
              >
                {entry.note}
              </TUXText>
            ) : null}
            <ActionMetaRow timeLabel={entry.timeLabel} isSelf={entry.isSelf} onRemove={onRemove} />
          </div>
        </div>
        <LikeColumn count={entry.likeCount} liked={liked} onToggle={() => setLiked((v) => !v)} />
      </div>

      {/* Replies — shown inline, indented. */}
      {entry.replies.map((reply) => (
        <ReplyRow key={reply.id} reply={reply} />
      ))}
    </div>
  );
}
