import { TUXText } from "@byted-tiktok/tux-web";
import {
  TUXIconArchiveBox,
  TUXIconBellSlash,
  TUXIconExclamationMarkCircle,
  TUXIconMessageRead,
  TUXIconPin,
  TUXIconStar,
  TUXIconTrashBin,
  type TuxIcon,
} from "@byted-tiktok/tux-icons";

export type InboxLongPressActionId =
  | "mark-as-read"
  | "archive"
  | "pin"
  | "mute"
  | "star"
  | "delete"
  | "spam";

type InboxLongPressMenuItem = {
  id: InboxLongPressActionId;
  label: string;
  Icon: TuxIcon;
  destructive?: boolean;
  /** 1 = primary group, 2 = destructive group (separator before) */
  group: 1 | 2;
};

const MENU_ITEMS: InboxLongPressMenuItem[] = [
  { id: "mark-as-read", label: "Mark as read", Icon: TUXIconMessageRead, group: 1 },
  { id: "archive", label: "Archive", Icon: TUXIconArchiveBox, group: 1 },
  { id: "pin", label: "Pin", Icon: TUXIconPin, group: 1 },
  { id: "mute", label: "Mute", Icon: TUXIconBellSlash, group: 1 },
  { id: "star", label: "Star", Icon: TUXIconStar, group: 1 },
  { id: "delete", label: "Delete", Icon: TUXIconTrashBin, destructive: true, group: 2 },
  { id: "spam", label: "Spam", Icon: TUXIconExclamationMarkCircle, destructive: true, group: 2 },
];

type InboxLongPressMenuProps = {
  onAction: (actionId: InboxLongPressActionId) => void;
};

export function InboxLongPressMenu({ onAction }: InboxLongPressMenuProps) {
  return (
    <div
      role="menu"
      aria-label="Inbox row actions"
      className="flex w-50 flex-col rounded-[12px] bg-tux-v2-ui-sheet-flat-1 p-1"
      style={{ boxShadow: "0 8px 28px rgba(0, 0, 0, 0.18)" }}
    >
      {MENU_ITEMS.map((item, index) => {
        const prev = MENU_ITEMS[index - 1];
        const needsSeparator = prev != null && prev.group !== item.group;
        const color = item.destructive
          ? "var(--tux-v2-color-ui-shape-primary)"
          : "var(--tux-v2-color-ui-text-1)";

        return (
          <div key={item.id}>
            {needsSeparator ? (
              <div
                aria-hidden
                className="my-1 h-px bg-tux-v2-ui-shape-neutral-3"
                style={{ marginLeft: 12, marginRight: 12 }}
              />
            ) : null}
            <button
              type="button"
              role="menuitem"
              onClick={() => onAction(item.id)}
              className="flex h-12 w-full items-center gap-3 rounded-[8px] px-3 transition-colors active:bg-tux-v2-ui-shape-neutral-3"
              style={{ color }}
            >
              <span aria-hidden className="flex shrink-0 items-center justify-center">
                <item.Icon size={20} />
              </span>
              <TUXText
                as="span"
                font="TikTokFont"
                typographyPreset="H4-Semibold"
                style={{ color }}
              >
                {item.label}
              </TUXText>
            </button>
          </div>
        );
      })}
    </div>
  );
}
