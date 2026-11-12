/**
 * 长按 reaction 选择器的 emoji。对齐 iOS youthful 默认 reaction bar 的前 6 个
 * （`AWEIMMessageEmojiConfigModel` 完整 20 个里 `kDefaultEmojiSetCount = 6` 展示的那组），
 * 顺序照搬。iOS 后面还有「更多」展开，本版暂不做。
 */
export const REACTION_EMOJIS = ["❤️", "😂", "🥰", "😭", "😳", "👍"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

/** 可被长按 react / 删除的消息共有字段。 */
type ReactableFields = {
  /** 稳定标识，用于 reaction / 删除时定位这条消息 */
  id: string;
  /** 长按选中的 reaction emoji，未选则无 */
  reaction?: ReactionEmoji;
  /** 引用回复：指向被引用消息的 id（TTD-24）。未引用则无。 */
  quotedMessageId?: string;
};

/** 己方发出的消息共有字段（在 ReactableFields 上多一个「已读」）。 */
type SentFields = ReactableFields & {
  /** 是否显示 "Seen"（仅最新一条己方消息显示，D 阶段使用） */
  isSeen?: boolean;
};

export type MessageThreadItem =
  | { kind: "timestamp"; label: string }
  | ({ kind: "receive"; text: string } & ReactableFields)
  | ({ kind: "send"; text: string } & SentFields)
  | ({ kind: "send-emoji"; emoji: string } & SentFields)
  | ({ kind: "receive-emoji"; emoji: string } & ReactableFields)
  | ({ kind: "send-image"; imageSrc: string } & SentFields)
  | ({ kind: "receive-image"; imageSrc: string } & ReactableFields)
  | ({ kind: "send-sticker"; imageSrc: string } & SentFields)
  | ({
      kind: "send-link";
      imageSrc: string;
      title: string;
      domain: string;
    } & SentFields)
  | ({
      kind: "shared-post";
      thumbnail: string;
      authorName: string;
      authorAvatar: string;
    } & ReactableFields)
  | ({ kind: "video"; thumbnail: string } & ReactableFields);
