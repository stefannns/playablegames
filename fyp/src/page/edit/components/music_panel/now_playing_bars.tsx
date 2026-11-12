import "./now_playing_bars.css";

/**
 * "Now playing" indicator before the selected track title (Figma node 429:178540).
 * 16×16, 4 bars (2px wide, x = 2 / 5.33 / 8.67 / 12), animated as an equalizer
 * while the sound plays. Color comes from currentColor (UITextPrimaryDisplay).
 */
export function NowPlayingBars({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden style={{ color, flexShrink: 0 }}>
      {/* full-height bars (h≈11.33, bottom at 13.33); CSS scaleY animates them */}
      <rect className="tt-eq-bar" x="2" y="2" width="2" height="11.333" rx="1" fill="currentColor" />
      <rect className="tt-eq-bar" x="5.333" y="2" width="2" height="11.333" rx="1" fill="currentColor" />
      <rect className="tt-eq-bar" x="8.667" y="2" width="2" height="11.333" rx="1" fill="currentColor" />
      <rect className="tt-eq-bar" x="12" y="2" width="2" height="11.333" rx="1" fill="currentColor" />
    </svg>
  );
}
