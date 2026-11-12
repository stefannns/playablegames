import { TUXText, getColorCSSVar } from "@byted-tiktok/tux-web";
import { IconAnchorMapThumbtack } from "@byted-tiktok/tux-icons";

export type LocationAnchorProps = {
  label: string;
  onClick?: () => void;
};

/**
 * Feed location anchor — a tappable LBS pill that sits above the username in
 * the bottom-left info column. Mirrors the Figma "Anchor" node: a green
 * map-thumbtack glyph + place name on a translucent dark backdrop, hugging its
 * own content (never full-bleed) on top of the feed media.
 */
export function LocationAnchor({ label, onClick }: LocationAnchorProps) {
  return (
    <button
      type="button"
      aria-label={`Location: ${label}`}
      onClick={onClick}
      data-no-long-press
      className="flex items-center gap-1 self-start rounded pt-1 pr-1.5 pb-1 pl-1 max-w-full cursor-pointer"
      style={{
        backgroundColor: `color-mix(in srgb, ${getColorCSSVar("FeedComponentsTextBackdrop2")} 50%, transparent)`,
      }}
    >
      <span
        className="flex shrink-0 overflow-hidden"
        style={{ borderRadius: 2 }}
      >
        <IconAnchorMapThumbtack width={20} height={20} />
      </span>
      <TUXText
        typographyPreset="P2-Semibold"
        className="truncate"
        color="UIImageOverlayWhite"
        style={{ letterSpacing: "0.1266px", lineHeight: 1.3 }}
      >
        {label}
      </TUXText>
    </button>
  );
}
