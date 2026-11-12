import { TUXIconLivePhoto, TUXIconPlusFill } from "@byted-tiktok/tux-icons";
import { TUXText, getColorCSSVar } from "@byted-tiktok/tux-web";
import type { CSSProperties } from "react";

import { TextImageCoverFill } from "../../text_to_image/text_image_cover_fill";
import { PublishListIconInk, PublishOverlayIconInk } from "./publish_icon_ink";
import type { PostPublishMediaItem } from "./post_publish_types";
const CELL_BG = getColorCSSVar("UIShapeNeutral4");
const OVERLAY_BADGE_BG = getColorCSSVar("UIImageOverlayDarkGrayA60");

function MediaBadge({ label, compact }: { label: string; compact: boolean }) {
  return (
    <span
      className="absolute left-0 top-0 inline-flex items-center justify-center overflow-hidden"
      style={{
        width: compact ? "15px" : label === "Cover" ? "49px" : "20px",
        height: compact ? "15px" : "20px",
        backgroundColor: OVERLAY_BADGE_BG,
        borderRadius: compact ? "0 0 6px 0" : "0 0 8px 0",
      }}
    >
      <TUXText
        typographyPreset={compact ? "SmallText2-Semibold" : "P3-Semibold"}
        color="UIImageOverlayWhite"
      >
        {label}
      </TUXText>
    </span>
  );
}

export function PostPublishAddTile({
  sizePx,
  onClick,
}: {
  sizePx: number;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label="Add image"
      className="relative flex shrink-0 items-center justify-center rounded-lg transition-all duration-200 ease-out"
      style={{ backgroundColor: CELL_BG }}
      onClick={onClick}
    >
      <div
        style={{ width: `${sizePx}px`, height: `${sizePx}px` }}
        className="flex items-center justify-center"
      >
        <PublishListIconInk>
          <TUXIconPlusFill size={20} />
        </PublishListIconInk>
      </div>
    </button>
  );
}

export function PostPublishMediaTile({
  item,
  sizePx,
  compactBadge,
  onClick,
}: {
  item: PostPublishMediaItem;
  sizePx: number;
  compactBadge: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const badgeLabel = item.badge === "Cover" && compactBadge ? "1" : item.badge;
  const tileStyle: CSSProperties = {
    width: `${sizePx}px`,
    height: `${sizePx}px`,
  };

  return (
    <button
      type="button"
      aria-label={`Edit ${item.badge}`}
      className="relative shrink-0 overflow-hidden rounded-lg transition-all duration-200 ease-out"
      style={tileStyle}
      onClick={onClick}
    >
      {item.kind === "image" ? (
        <img src={item.src} alt="" className="h-full w-full object-cover" />
      ) : item.kind === "video" ? (
        <img src={item.posterSrc} alt="" className="h-full w-full object-cover" />
      ) : (
        <TextImageCoverFill templateId={item.templateId} text={item.text} />
      )}
      <MediaBadge label={badgeLabel} compact={compactBadge} />
      {item.kind === "image" && item.showLivePhoto ? (
        <span
          className="absolute bottom-0 left-0 right-0 flex items-end justify-end px-1.5 pb-1.5"
          style={{
            background:
              "linear-gradient(180deg, rgba(0, 0, 0, 0) 8%, rgba(0, 0, 0, 0.24) 100%)",
          }}
        >
          <PublishOverlayIconInk>
            <TUXIconLivePhoto size={14} />
          </PublishOverlayIconInk>
        </span>
      ) : null}
    </button>
  );
}
