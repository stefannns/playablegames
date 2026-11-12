import { getColorCSSVar, TUXButton, TUXText } from "@byted-tiktok/tux-web";
import {
  IconChevronRightOffsetLTR,
  IconCollaboration,
  IconColorVerifiedBadge,
  IconHorizontalBars,
  IconMagnifyingGlass,
} from "@byted-tiktok/tux-icons";
import { localAvatarUrlForDisplay } from "../../../../utils/local_avatar";

/** Translucent dark backdrop — `FeedComponentsTextBackdrop2` (#404040) @ 50%. */
const BACKDROP = `color-mix(in srgb, ${getColorCSSVar("FeedComponentsTextBackdrop2")} 50%, transparent)`;
const OVERLAY_TEXT = getColorCSSVar("UIImageOverlayWhite");

/**
 * Caption / call-out banner — node 7717:127525.
 * P1-Semibold on a translucent backdrop, hugging its content. Vertical spacing
 * to siblings is owned by the info column's 8px flex gap.
 */
export function FeedPromoBanner({ text }: { text: string }) {
  return (
    <div
      className="flex items-center self-start rounded px-1.5 py-1 max-w-[240px]"
      style={{ backgroundColor: BACKDROP }}
    >
      <TUXText
        typographyPreset="P1-Semibold"
        style={{ color: OVERLAY_TEXT, letterSpacing: "0.0931px", lineHeight: 1.3 }}
      >
        {text}
      </TUXText>
    </div>
  );
}

/** "Your friend" relationship tag — node 7717:127526. Neutral fill, radius 4. */
export function FeedFriendTag({ text = "Your friend" }: { text?: string }) {
  return (
    <div
      className="flex items-center self-start px-1 py-0.5"
      style={{
        backgroundColor: getColorCSSVar("UIShapeNeutral"),
        borderRadius: 4,
      }}
    >
      <TUXText
        typographyPreset="P3-Semibold"
        className="whitespace-nowrap"
        style={{ color: getColorCSSVar("UIShapeText1OnNeutral"), lineHeight: 1.3 }}
      >
        {text}
      </TUXText>
    </div>
  );
}

/** Verified badge glyph that sits beside the username — node 7717:127538. */
export function FeedVerifiedBadge() {
  return (
    <span className="flex shrink-0" aria-label="Verified account">
      <IconColorVerifiedBadge width={16} height={16} />
    </span>
  );
}

/** Collaborators chip with stacked avatars — node 7717:127539. */
export function FeedCollaboratorsChip({
  count = 3,
  avatarSlots = [47, 48],
}: {
  count?: number;
  avatarSlots?: number[];
}) {
  return (
    <div
      className="flex shrink-0 items-center gap-1 rounded py-0.5 pr-1 pl-1.5"
      style={{ backgroundColor: BACKDROP }}
    >
      <IconCollaboration className="text-tux-v2-ui-text-1" width={12} height={12} />
      <TUXText
        typographyPreset="P3-Semibold"
        className="whitespace-nowrap"
        style={{ color: OVERLAY_TEXT, lineHeight: 1.3 }}
      >
        {`${count} collaborators`}
      </TUXText>
      <span className="flex items-center">
        {avatarSlots.map((slot, index) => (
          <img
            key={slot}
            src={localAvatarUrlForDisplay(15, slot)}
            alt=""
            aria-hidden
            className="block rounded-full w-[15px] h-[15px] object-cover"
            style={{
              marginLeft: index === 0 ? 0 : -4,
              boxShadow: "0 0 0 1px rgba(64,64,64,0.6)",
            }}
          />
        ))}
      </span>
    </div>
  );
}

/** "Text" post-type chip with a paragraph glyph — node 7717:127552. */
export function FeedTextTypeChip({ text = "Text" }: { text?: string }) {
  return (
    <div
      className="flex shrink-0 items-center gap-0.5 rounded py-0.5 pr-1.5 pl-1"
      style={{ backgroundColor: BACKDROP }}
    >
      <IconHorizontalBars className="text-tux-v2-ui-text-1" width={12} height={12} />
      <TUXText
        typographyPreset="P3-Semibold"
        className="whitespace-nowrap"
        style={{ color: OVERLAY_TEXT, lineHeight: 1.3 }}
      >
        {text}
      </TUXText>
    </div>
  );
}

/** "See original" repost source link — node 7717:127576. */
export function FeedSeeOriginal({ text = "See original" }: { text?: string }) {
  return (
    <button
      type="button"
      data-no-long-press
      className="self-start cursor-pointer my-0.5"
    >
      <TUXText
        typographyPreset="P2-Semibold"
        className="block whitespace-nowrap feed-text-trim"
        style={{ color: getColorCSSVar("UIText3"), letterSpacing: "0.1266px", lineHeight: 1.3 }}
      >
        {text}
      </TUXText>
    </button>
  );
}

/** "Sponsored" ad disclosure tag — node 7717:127564. Dark-gray overlay, radius 4. */
export function FeedSponsoredTag({ text = "Sponsored" }: { text?: string }) {
  return (
    <div
      className="flex items-center self-start px-1 py-0.5"
      style={{
        backgroundColor: getColorCSSVar("UIImageOverlayDarkGrayA60"),
        borderRadius: 4,
      }}
    >
      <TUXText
        typographyPreset="SmallText1-Semibold"
        className="whitespace-nowrap"
        style={{ color: getColorCSSVar("UIImageOverlayWhite"), lineHeight: 1.3 }}
      >
        {text}
      </TUXText>
    </div>
  );
}

/**
 * Info bar — node 7717:127566. Carries the AI-generated / content disclosure
 * copy. Clamps to a maximum of two lines, truncating the overflow.
 */
export function FeedInfoBar({
  text = "Creator labelled as AI-generated · The video may contain disturbing content.",
}: {
  text?: string;
}) {
  return (
    <TUXText
      typographyPreset="P3-Semibold"
      className="w-full"
      style={{
        color: getColorCSSVar("UIText3"),
        lineHeight: 1.3,
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: 2,
        overflow: "hidden",
      }}
    >
      {text}
    </TUXText>
  );
}

/**
 * Full-bleed bottom search banner — node 7717:127589.
 * A translucent bar pinned above the tab bar with a search glyph, a trending
 * query and a trailing chevron.
 */
export function FeedBottomBanner({
  text = "Search · Billie Eilish releases new album last nig...",
  onClick,
}: {
  text?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      data-no-long-press
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 w-full text-left cursor-pointer"
      style={{ backgroundColor: BACKDROP }}
    >
      <span className="flex flex-1 items-center gap-1 min-w-0">
        <IconMagnifyingGlass className="shrink-0 text-tux-v2-ui-text-1" width={16} height={16} />
        <TUXText
          typographyPreset="P2-Semibold"
          className="block truncate flex-1 min-w-0"
          style={{ color: OVERLAY_TEXT, lineHeight: 1.3 }}
        >
          {text}
        </TUXText>
      </span>
      <IconChevronRightOffsetLTR className="shrink-0 text-tux-v2-ui-text-1" width={16} height={16} />
    </button>
  );
}

/** "Not interested" / "Follow back" action pair — node 7717:127582. */
export function FeedBottomActions({
  onNotInterested,
  onFollowBack,
}: {
  onNotInterested?: () => void;
  onFollowBack?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 w-full" data-no-long-press>
      <TUXButton
        text="Not interested"
        smoothRadius
        block
        shapePreset="capsule"
        sizePreset="small"
        height="36px"
        backgroundColor="UIImageOverlayWhiteA20"
        textColor="UIImageOverlayWhite"
        onClick={onNotInterested}
      />
      <TUXButton
        text="Follow back"
        smoothRadius
        block
        shapePreset="capsule"
        sizePreset="small"
        themePreset="primary"
        height="36px"
        onClick={onFollowBack}
      />
    </div>
  );
}
