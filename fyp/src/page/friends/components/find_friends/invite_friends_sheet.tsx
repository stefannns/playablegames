import {
  getColorCSSVar,
  TUXNavBar,
  TUXNavBarIconAction,
  TUXSheet,
  TUXText,
} from "@byted-tiktok/tux-web";
import {
  IconColorFacebookCircle,
  IconColorInstagramCircle,
  IconColorLinkCircle,
  IconColorMessengerCircle,
  IconColorSmsCircle,
  IconColorSnapchatCircle,
  IconColorWhatsappCircle,
  TUXIconXMark,
} from "@byted-tiktok/tux-icons";
import { useEffect, useState, type ReactNode } from "react";

import { appFrameSheetChromeProps } from "../../../../components/sys/app_frame_sheet_chrome";

type Channel = {
  id: string;
  label: string;
  /** Full-color brand icon (the colored circle is part of the icon — no extra bg). */
  icon: ReactNode;
};

const CHANNELS: Channel[] = [
  { id: "copy", label: "Copy link", icon: <IconColorLinkCircle width={56} height={56} /> },
  { id: "sms", label: "SMS", icon: <IconColorSmsCircle width={56} height={56} /> },
  { id: "whatsapp", label: "WhatsApp", icon: <IconColorWhatsappCircle width={56} height={56} /> },
  { id: "messenger", label: "Messenger", icon: <IconColorMessengerCircle width={56} height={56} /> },
  { id: "snapchat", label: "Snapchat Chats", icon: <IconColorSnapchatCircle width={56} height={56} /> },
  { id: "facebook", label: "Facebook", icon: <IconColorFacebookCircle width={56} height={56} /> },
  { id: "instagram", label: "Instagram", icon: <IconColorInstagramCircle width={56} height={56} /> },
];

export function InviteFriendsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [root, setRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setRoot(document.querySelector<HTMLElement>("[data-app-frame-root]"));
  }, []);

  return (
    <TUXSheet
      {...appFrameSheetChromeProps()}
      visible={open}
      onVisibleChange={(visible) => {
        if (!visible) {
          onClose();
        }
      }}
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
          title="Invite friends"
          trailing={
            <TUXNavBarIconAction
              aria-label="Close invite friends"
              width="52px"
              height="52px"
              onClick={onClose}
              icon={
                <TUXIconXMark
                  size={22}
                  color="var(--tux-v2-color-ui-text-1)"
                />
              }
            />
          }
        />

        <div className="hide-scrollbar flex touch-pan-x gap-4 overflow-x-auto px-4 pb-9 pt-4">
          {CHANNELS.map((channel) => (
            <button
              key={channel.id}
              type="button"
              className="flex w-[68px] shrink-0 flex-col items-center gap-1.5 outline-none active:opacity-70"
            >
              {channel.icon}
              <TUXText
                typographyPreset="P3-Regular"
                color="UIText1"
                align="center"
                className="w-full leading-tight"
              >
                {channel.label}
              </TUXText>
            </button>
          ))}
        </div>
      </div>
    </TUXSheet>
  );
}
