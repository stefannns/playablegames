import { TUXIconPlayFill } from "@byted-tiktok/tux-icons";
import { getColorCSSVar } from "@byted-tiktok/tux-web";

export type MediaCardProps = {
  /** Cover / thumbnail image URL. */
  thumbnail: string;
  alt: string;
  /** Centered play triangle — for video / shared-post. */
  showPlay?: boolean;
  /** shared-post only: author username shown in the bottom scrim. */
  authorName?: string;
  /** shared-post only: author avatar in the bottom scrim. */
  authorAvatar?: string;
};

/**
 * Image / video / shared-post card — 162×216, 24px radius (iOS youthful
 * `kYouthfulBubbleCornerRadius`). On-media colors go through the TUX overlay
 * tokens (`UIImageOverlay*`). The shared-post scrim is a fixed-height
 * (100px, bottom-anchored) gradient layer that fills the lower half of the
 * card — matches iOS `bottomMaskView` in `ShareVideoCardVideoContainerView`.
 * Avatar + username sit on top of it at 12px from the leading/bottom edges.
 */
export function MediaCard({
  thumbnail,
  alt,
  showPlay = false,
  authorName,
  authorAvatar,
}: MediaCardProps) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-[24px]"
      style={{ width: 162, height: 216 }}
    >
      <img
        src={thumbnail}
        alt={alt}
        className="absolute inset-0 size-full object-cover"
        draggable={false}
      />
      {showPlay ? (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            color: getColorCSSVar("UIImageOverlayWhite"),
            // iOS `iconShadowOnVideo` (TUXIcon.m:445): offset(0,1) blur 1
            // black@12%. drop-shadow follows the triangle's alpha, matching
            // iOS drawing the shadow on the glyph pixels (not a square box).
            filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.12))",
          }}
        >
          <TUXIconPlayFill size={32} />
        </div>
      ) : null}
      {authorName ? (
        <>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[100px]"
            style={{
              background: `linear-gradient(180deg, transparent 0%, ${getColorCSSVar("UIImageOverlayBlackA50")} 100%)`,
            }}
          />
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1">
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt=""
                className="size-4 shrink-0 rounded-full object-cover"
              />
            ) : null}
            <span
              className="truncate text-[12px] font-semibold leading-[1.3]"
              style={{ color: getColorCSSVar("UIImageOverlayWhite") }}
            >
              {authorName}
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}
