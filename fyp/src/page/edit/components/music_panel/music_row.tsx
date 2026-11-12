import { TUXText, getColorCSSVar } from "@byted-tiktok/tux-web";
import { IconScissors, IconBookmark, IconBookmarkFill } from "@byted-tiktok/tux-icons";
import { NowPlayingBars } from "./now_playing_bars";
import { figmaCover, type MusicTrack } from "./music_data";

export type MusicRowProps = {
  track: MusicTrack;
  selected: boolean;
  bookmarked: boolean;
  onSelect: () => void;
  onTrim: () => void;
  onBookmark: () => void;
  /** Hot tab: shows a ranking number before the cover (Figma node 2779:209130). */
  rank?: number;
};

/**
 * "Music cell" row — 1:1 with Figma (Sounds 2025, selected node 429:178534):
 *   cell:   flex gap-12 items-start, pl-16 pt-6 → 60px tall
 *   cover:  48×48, radius 8, selected → 2px solid UITextPrimaryDisplay
 *   info:   flex-1, h-48, gap-2; title H4-Semibold (15) UIText1, meta P3-Regular (12) UIText3
 *           with 13px (P2) "·" separators
 *   actions (selected): scissors + bookmark, each 24px icon in a 44×44 tap target
 *   separator: inset 76px (width 314), UIShapeNeutral3 0.5px
 */
export function MusicRow({
  track,
  selected,
  bookmarked,
  onSelect,
  onTrim,
  onBookmark,
  rank,
}: MusicRowProps) {
  const accent = getColorCSSVar("UITextPrimaryDisplay");
  const meta3 = getColorCSSVar("UIText3");

  return (
    <div
      className="flex w-full items-start"
      style={{
        gap: rank ? 10 : 12,
        paddingLeft: rank ? 8 : 16,
        paddingTop: 6,
        backgroundColor: selected ? getColorCSSVar("UIShapeNeutral4") : "transparent",
      }}
    >
      {/* Ranking number (Hot tab) — TikTok Sans heavy italic, UIText3. */}
      {rank != null && (
        <span
          className="flex shrink-0 items-center justify-center self-stretch"
          style={{
            width: 24,
            fontFamily: "var(--app-font-display, var(--app-font-sans))",
            fontSize: 16,
            fontWeight: 900,
            fontStyle: "italic",
            letterSpacing: "0.28px",
            color: meta3,
          }}
        >
          {rank}
        </span>
      )}

      {/* Cover — 48×48, radius 8. Selected adds a 2px inset accent ring drawn as an
          overlay (NOT a border): a border-box border would eat 2px on each side and
          shrink the artwork to 44×44, making the cover visibly "jump" on tap. */}
      <button
        type="button"
        onClick={onSelect}
        aria-label={`Select ${track.title}`}
        className="relative shrink-0 overflow-hidden"
        style={{ width: 48, height: 48, borderRadius: 8 }}
      >
        <img
          src={figmaCover(track.coverSlot)}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
        {selected && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ borderRadius: 8, border: `2px solid ${accent}`, boxSizing: "border-box" }}
          />
        )}
      </button>

      {/* Text column: [title-row + actions] then the inset separator (gap 6). */}
      <div className="flex min-w-0 flex-1 flex-col" style={{ gap: 6 }}>
        <div className="flex w-full items-center" style={{ gap: 16 }}>
          {/* Info — 48px tall, vertically centered, gap 2 between title and meta. */}
          <button
            type="button"
            onClick={onSelect}
            className="flex min-w-0 flex-1 flex-col justify-center text-left"
            // Figma: default cell is px-16 (text stops 16px from the right edge);
            // selected cell is pl-16 only — the actions reach the edge instead.
            style={{ height: 48, gap: 2, paddingRight: selected ? 0 : 16 }}
          >
            <div className="flex w-full min-w-0 items-center" style={{ gap: 4 }}>
              {selected && <NowPlayingBars color={accent} />}
              <TUXText
                as="div"
                typographyPreset="H4-Semibold"
                color={selected ? "UITextPrimaryDisplay" : "UIText1"}
                textDisplay="truncate"
                className="min-w-0 flex-1"
              >
                {track.title}
              </TUXText>
            </div>
            {/* Meta: 12px parts, 13px "·" separators (P2), color UIText3. */}
            <div className="flex w-full min-w-0 items-center" style={{ color: meta3 }}>
              <TUXText as="span" typographyPreset="P3-Regular" color="UIText3" textDisplay="truncate" className="min-w-0 shrink">
                {track.artist}
              </TUXText>
              <span className="shrink-0 text-center" style={{ width: 12, fontSize: 13, lineHeight: 1.3 }}>·</span>
              <TUXText as="span" typographyPreset="P3-Regular" color="UIText3" className="shrink-0 whitespace-nowrap">
                {track.posts} posts
              </TUXText>
              <span className="shrink-0 text-center" style={{ width: 12, fontSize: 13, lineHeight: 1.3 }}>·</span>
              <TUXText as="span" typographyPreset="P3-Regular" color="UIText3" className="shrink-0 whitespace-nowrap">
                {track.duration}
              </TUXText>
            </div>
          </button>

          {/* Actions (selected only): scissors + bookmark, 24px icons in 44×44. */}
          {selected && (
            <div className="flex shrink-0 items-center justify-end">
              <button
                type="button"
                aria-label="Trim sound"
                onClick={onTrim}
                className="flex items-center justify-center"
                style={{ width: 44, height: 44, color: getColorCSSVar("UIText1") }}
              >
                <IconScissors width={24} height={24} />
              </button>
              <button
                type="button"
                aria-label={bookmarked ? "Remove from favorites" : "Add to favorites"}
                aria-pressed={bookmarked}
                onClick={onBookmark}
                className="flex items-center justify-center"
                // Saved state = UIText1 fill (black), NOT the accent.
                style={{ width: 44, height: 44, color: getColorCSSVar("UIText1") }}
              >
                {bookmarked ? (
                  <IconBookmarkFill width={24} height={24} />
                ) : (
                  <IconBookmark width={24} height={24} />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Inset hairline separator (width 314 = 76→390), UIShapeNeutral3 0.5px. */}
        <div
          className="w-full"
          style={{ height: 0, borderBottom: `0.5px solid ${getColorCSSVar("UIShapeNeutral3")}` }}
        />
      </div>
    </div>
  );
}
