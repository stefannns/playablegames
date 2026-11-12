import { avatarSlotFromId, localAvatarUrlForDisplay } from "../../../utils/local_avatar";
import { MessageThreadContent } from "../../message/components/message_thread_content";
import { messageDemoItems } from "../../message/message_demo.config";
import type { InboxRowCellRow } from "./inbox_row_cell";

export type InboxDetailPageContentProps = {
  row: InboxRowCellRow;
  onClose: (row: InboxRowCellRow, trigger?: HTMLElement | null) => void;
};

function peerAvatarFromRow(row: InboxRowCellRow): string {
  if (row.leading.variant === "avatar") {
    return row.leading.src;
  }
  return localAvatarUrlForDisplay(32, avatarSlotFromId(row.id));
}

/** 1:1 thread — inbox / friends push reuses the message thread layout. */
export function InboxDetailPageContent({ row, onClose }: InboxDetailPageContentProps) {
  const peerAvatarUrl = peerAvatarFromRow(row);

  return (
    <MessageThreadContent
      peerName={row.title}
      peerAvatarUrl={peerAvatarUrl}
      items={messageDemoItems}
      onBack={(trigger) => onClose(row, trigger ?? null)}
    />
  );
}
