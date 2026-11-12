import { TUXText } from "@byted-tiktok/tux-web";
import {
  IconLike,
  IconPlayFill,
  IconSquareCornerBorderFill,
} from "@byted-tiktok/tux-icons";

import {
  leftColumnItems,
  rightColumnItems,
  type ExploreFeedItem,
} from "./explore_feed_data";
import {
  PHOTO_TEXT_FEED_IMAGE_TARGET_ATTR,
  PHOTO_TEXT_SHARED_IMAGE_TRANSITION_NAME,
} from "../../photo_text_detail/photo_text_detail_route";

const textFontFamily =
  '"TikTok Sans", "TikTok Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const EXPLORE_CARD_MIN_ASPECT = 3 / 4;
const EXPLORE_CARD_MAX_ASPECT = 4 / 3;
const EXPLORE_MEDIA_BADGE_ICON_SIZE = 14;

function clampExploreAspect(aspect: readonly [number, number]) {
  const rawAspect = aspect[0] / Math.max(aspect[1], 1);
  return Math.min(
    EXPLORE_CARD_MAX_ASPECT,
    Math.max(EXPLORE_CARD_MIN_ASPECT, rawAspect),
  );
}

function ExploreMediaBadge({
  badge,
}: {
  badge: NonNullable<ExploreFeedItem["badge"]>;
}) {
  if (badge === "none") return null;

  return (
    <span
      aria-hidden
      data-photo-text-non-shared
      className="absolute top-2 right-[8.5px] flex h-4 w-4 items-center justify-center overflow-visible drop-shadow-[0_1px_0.5px_rgba(0,0,0,0.12)]"
      style={{ color: "var(--tux-v2-color-ui-image-overlay-white)" }}
    >
      {badge === "video" ? (
        <IconPlayFill
          width={EXPLORE_MEDIA_BADGE_ICON_SIZE}
          height={EXPLORE_MEDIA_BADGE_ICON_SIZE}
        />
      ) : (
        <IconSquareCornerBorderFill
          width={EXPLORE_MEDIA_BADGE_ICON_SIZE}
          height={EXPLORE_MEDIA_BADGE_ICON_SIZE}
        />
      )}
    </span>
  );
}

function ExplorePostCell({
  item,
  onOpenDetail,
  sharedImageActive,
}: {
  item: ExploreFeedItem;
  onOpenDetail?: (item: ExploreFeedItem, cardElement: HTMLElement) => void;
  sharedImageActive?: boolean;
}) {
  const clampedAspect = clampExploreAspect(item.aspect);

  return (
    <article className="overflow-hidden rounded-lg bg-tux-v2-ui-page-flat-1">
      <button
        type="button"
        className="block w-full text-left"
        onClick={(event) => onOpenDetail?.(item, event.currentTarget)}
      >
        <div
          className="relative overflow-hidden rounded-lg border-[0.5px] border-tux-v2-ui-shape-neutral-4 bg-tux-v2-ui-shape-neutral-4"
          style={{
            aspectRatio: `${clampedAspect}`,
            viewTransitionName: sharedImageActive
              ? PHOTO_TEXT_SHARED_IMAGE_TRANSITION_NAME
              : "none",
          }}
          {...{ [PHOTO_TEXT_FEED_IMAGE_TARGET_ATTR]: `${item.id}:0` }}
        >
          <img
            src={item.imageSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
          <ExploreMediaBadge badge={item.badge ?? item.mediaType} />
        </div>

        <div className="flex flex-col gap-1.5 px-2 pt-1.5 pb-2">
          <TUXText
            as="h2"
            typographyPreset="P2-Regular"
            color="UIText1"
            weight={500}
            className="overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
          >
            {item.title}
          </TUXText>

          <div className="flex h-4 min-w-0 items-center justify-between gap-1">
            <div className="flex min-w-0 items-center gap-1">
              <img
                src={item.avatarSrc}
                alt=""
                className="h-4 w-4 flex-none rounded-full object-cover shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.08)]"
                draggable={false}
              />
              <span
                className="min-w-0 truncate text-[11px] leading-4 text-tux-v2-ui-text-3"
                style={{
                  fontFamily: textFontFamily,
                  fontWeight: 400,
                  letterSpacing: 0,
                }}
              >
                {item.author}
              </span>
            </div>

            <span className="flex h-4 flex-none items-center gap-px text-tux-v2-ui-text-3">
              <IconLike width={16} height={16} />
              <span
                className="text-[12px] leading-4"
                style={{
                  fontFamily: textFontFamily,
                  fontWeight: 400,
                  letterSpacing: 0,
                }}
              >
                {item.likes}
              </span>
            </span>
          </div>
        </div>
      </button>
    </article>
  );
}

function ExploreColumn({
  items,
  onOpenDetail,
  sharedImageFeedId,
}: {
  items: ExploreFeedItem[];
  onOpenDetail?: (item: ExploreFeedItem, cardElement: HTMLElement) => void;
  sharedImageFeedId?: string | null;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      {items.map((item) => (
        <ExplorePostCell
          key={item.id}
          item={item}
          onOpenDetail={onOpenDetail}
          sharedImageActive={sharedImageFeedId === item.id}
        />
      ))}
    </div>
  );
}

export default function ExploreFeedPage({
  onOpenDetail,
  sharedImageFeedId,
}: {
  onOpenDetail?: (item: ExploreFeedItem, cardElement: HTMLElement) => void;
  sharedImageFeedId?: string | null;
}) {
  return (
    <div className="h-full w-full bg-tux-v2-ui-page-flat-1 text-tux-v2-ui-text-1">
      <div
        data-explore-feed-scroll-container
        className="hide-scrollbar h-full w-full overflow-y-auto overscroll-contain px-1"
        style={{
          paddingTop: "calc(var(--home-tabs-below-top) + 6px)",
          paddingBottom: "calc(var(--app-frame-bottom-inset) + 12px)",
        }}
      >
        <div className="flex w-full items-start gap-1">
          <ExploreColumn
            items={leftColumnItems}
            onOpenDetail={onOpenDetail}
            sharedImageFeedId={sharedImageFeedId}
          />
          <ExploreColumn
            items={rightColumnItems}
            onOpenDetail={onOpenDetail}
            sharedImageFeedId={sharedImageFeedId}
          />
        </div>
      </div>
    </div>
  );
}
