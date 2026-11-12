import { TUXText } from "@byted-tiktok/tux-web";
import {
  TUXIconPaperplaneRounded,
  TUXIconXMark,
} from "@byted-tiktok/tux-icons";

type InboxBannerProps = {
  message?: string;
  actionLabel?: string;
  onActionClick?: () => void;
  onDismiss?: () => void;
};

export function InboxBanner({
  message = "More inbox features are available when you turn 18",
  actionLabel = "View more",
  onActionClick,
  onDismiss,
}: InboxBannerProps) {
  return (
    <div
      className="flex items-center gap-3 rounded-[10px] bg-tux-v2-ui-sheet-flat-1 py-3 pl-4 pr-3"
      style={{
        minHeight: 64,
        boxShadow: "0 2px 10px 0 rgba(0, 0, 0, 0.14)",
      }}
    >
      <span
        aria-hidden
        className="shrink-0"
        style={{ color: "var(--tux-v2-color-ui-shape-primary)" }}
      >
        <TUXIconPaperplaneRounded size={24} />
      </span>

      <div className="min-w-0 flex-1">
        <TUXText
          as="div"
          font="TikTokFont"
          typographyPreset="P2-Semibold"
          color="UIText1"
        >
          {message}
        </TUXText>
      </div>

      <button
        type="button"
        onClick={onActionClick}
        className="flex shrink-0 items-center justify-center rounded-full bg-tux-v2-ui-shape-primary px-3"
        style={{ height: 28 }}
      >
        <TUXText
          as="span"
          font="TikTokFont"
          typographyPreset="P2-Semibold"
          color="UIShapeText1OnPrimary"
        >
          {actionLabel}
        </TUXText>
      </button>

      <button
        type="button"
        aria-label="Dismiss banner"
        onClick={onDismiss}
        className="flex h-6 w-6 shrink-0 items-center justify-center text-tux-v2-ui-text-3"
      >
        <TUXIconXMark size={16} />
      </button>
    </div>
  );
}
