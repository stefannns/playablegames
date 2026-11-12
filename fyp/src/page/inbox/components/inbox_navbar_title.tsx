import { TUXText } from "@byted-tiktok/tux-web";
import { TUXIconArrowTriangleDownLargeFill } from "@byted-tiktok/tux-icons";

export function InboxNavBarTitle() {
  return (
    <div className="flex items-center gap-1">
      <TUXText
        as="div"
        font="TikTokFont"
        typographyPreset="H3-Bold"
        color="UIText1"
      >
        Inbox
      </TUXText>
      <div className="flex h-4 items-center gap-0.5 rounded-[4px] bg-tux-v2-ui-shape-neutral-4 pl-1 pr-0.75 text-tux-v2-ui-text-3">
        <span
          className="h-2 w-2 rounded-full bg-tux-v2-ui-text-placeholder"
          aria-hidden
        />
        <TUXIconArrowTriangleDownLargeFill
          size={8}
          color="var(--tux-v2-color-ui-text-placeholder)"
        />
      </div>
    </div>
  );
}
