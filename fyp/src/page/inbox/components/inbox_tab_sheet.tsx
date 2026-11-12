import { TUXNavBar, TUXNavBarIconAction, TUXSheet, TUXText, getColorCSSVar } from "@byted-tiktok/tux-web";
import { TUXIconXMark } from "@byted-tiktok/tux-icons";

import { appFrameSheetChromeProps } from "../../../components/sys/app_frame_sheet_chrome";
import { INBOX_TABS, type InboxTabId } from "../inbox_page.config";

type InboxTabSheetProps = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  activeTabId: InboxTabId;
  onTabSelect: (tabId: InboxTabId) => void;
  root?: HTMLElement | null;
};

/** Inline radio dot — matches the Figma "Item Picker Sheet" trailing indicator. */
function RadioDot({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className="flex h-6 w-6 items-center justify-center rounded-full border-2"
      style={{
        borderColor: checked
          ? "var(--tux-v2-color-ui-shape-primary)"
          : "var(--tux-v2-color-ui-shape-neutral-3)",
        backgroundColor: checked
          ? "var(--tux-v2-color-ui-shape-primary)"
          : "transparent",
      }}
    >
      {checked ? (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: "var(--tux-v2-color-ui-image-overlay-white)" }}
        />
      ) : null}
    </span>
  );
}

export function InboxTabSheet({
  visible,
  onVisibleChange,
  activeTabId,
  onTabSelect,
  root,
}: InboxTabSheetProps) {
  const handleSelect = (tabId: InboxTabId) => {
    onTabSelect(tabId);
    onVisibleChange(false);
  };

  return (
    <TUXSheet
      {...appFrameSheetChromeProps()}
      visible={visible}
      onVisibleChange={onVisibleChange}
      root={root}
      position="bottom"
      heightModePreset="auto"
      closeOnOutsideClick
      dragHandle="hidden"
      draggable
      sheetBackgroundColor="UISheetFlat1"
    >
      <div style={{ backgroundColor: getColorCSSVar("UISheetFlat1") }}>
        <TUXNavBar
          heightPreset={52}
          showSeparator={false}
          backgroundOpacity={0}
          title="Tabs"
          trailing={
            <TUXNavBarIconAction
              aria-label="Close tabs picker"
              width="52px"
              height="52px"
              onClick={() => onVisibleChange(false)}
              icon={
                <TUXIconXMark
                  size={22}
                  color="var(--tux-v2-color-ui-text-1)"
                />
              }
            />
          }
        />

        <ul role="listbox" aria-label="Inbox tab options" className="pb-6">
          {INBOX_TABS.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <li key={tab.id} className="px-4">
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleSelect(tab.id)}
                  className="flex h-13 w-full items-center justify-between border-b border-solid border-tux-v2-ui-shape-neutral-3 last:border-b-0"
                  style={{ height: 52 }}
                >
                  <TUXText
                    as="span"
                    font="TikTokFont"
                    typographyPreset="H4-Semibold"
                    color="UIText1"
                  >
                    {tab.count != null
                      ? `${tab.label} ${tab.count}`
                      : tab.label}
                  </TUXText>
                  <RadioDot checked={isActive} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </TUXSheet>
  );
}
