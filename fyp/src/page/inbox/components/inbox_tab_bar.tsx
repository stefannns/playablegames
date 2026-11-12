import { TUXText } from "@byted-tiktok/tux-web";
import { TUXIconChevronDown } from "@byted-tiktok/tux-icons";

import { IconInk } from "../../../components/icons/icon_ink";
import { INBOX_FILTER_ACTIVE_BG, INBOX_FILTER_IDLE_BG } from "../inbox_chrome.constants";
import { INBOX_TABS, type InboxTabId } from "../inbox_page.config";

type InboxTabBarProps = {
  activeTabId: InboxTabId;
  onTabSelect: (tabId: InboxTabId) => void;
  /** Opens the half-sheet that lists every tab. */
  onOpenSheet: () => void;
};

/** Chip label includes its badge count, e.g. `Unread 1`, `Ads 5`. */
function renderChipLabel(label: string, count: number | undefined) {
  return count != null ? `${label} ${count}` : label;
}

export function InboxTabBar({
  activeTabId,
  onTabSelect,
  onOpenSheet,
}: InboxTabBarProps) {
  return (
    <div className="relative h-14 bg-tux-v2-ui-page-flat-1">
      <div
        role="tablist"
        aria-label="Inbox filter tabs"
        className="hide-scrollbar flex h-full items-center gap-2 overflow-x-auto px-4 pr-12"
      >
        {INBOX_TABS.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabSelect(tab.id)}
              className="flex h-8 shrink-0 items-center rounded-[5px] px-3 transition-colors"
              style={{
                backgroundColor: isActive ? INBOX_FILTER_ACTIVE_BG : INBOX_FILTER_IDLE_BG,
              }}
            >
              <TUXText
                as="span"
                font="TikTokFont"
                typographyPreset="P1-Semibold"
                color={isActive ? "InboxFilterTextOnHighlight" : "UIText1"}
              >
                {renderChipLabel(tab.label, tab.count)}
              </TUXText>
            </button>
          );
        })}
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute right-10 top-0 h-full w-4"
        style={{
          background:
            "linear-gradient(to right, rgba(255,255,255,0) 0%, var(--tux-v2-color-ui-page-flat-1) 100%)",
        }}
      />

      <button
        type="button"
        aria-label="Open tabs picker"
        onClick={onOpenSheet}
        className="absolute right-0 top-0 flex h-full w-10 items-center justify-center bg-tux-v2-ui-page-flat-1 text-tux-v2-ui-text-1"
      >
        <IconInk color="UIText1">
          <TUXIconChevronDown size={16} />
        </IconInk>
      </button>
    </div>
  );
}
