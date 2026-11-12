import { TUXText, getColorCSSVar } from "@byted-tiktok/tux-web";
import {
  IconChevronRightLTR,
  IconClock,
  IconXMark,
  IconMusicNoteSAltFill,
  IconMagnifyingGlass,
  IconArrowUpLeftLTR,
} from "@byted-tiktok/tux-icons";
import { useEffect, useMemo, useState } from "react";
import { useAppFrame } from "../../../../components/sys/app_frame";
import { useSoftKeyboardTextTarget } from "../../../../components/sys/soft_keyboard/keyboard_context";
import { SEARCH_HISTORY, SEARCH_SUGGESTIONS } from "./music_data";
import { SoundPanelTuxNavBar } from "./sound_panel_nav";

export type SoundSearchPageProps = {
  onClose: () => void;
  /** Tapping "Discover more sounds" opens the routed discover page. */
  onDiscover?: () => void;
};

/**
 * Creation routed sound search page (Figma "Sound Found Page", node 25616:8638).
 * TUXNavBar + search field + history / suggestions. Reserves AppFrame status-bar inset.
 */
export function SoundSearchPage({ onClose, onDiscover }: SoundSearchPageProps) {
  const { topInsetCss } = useAppFrame();
  const [history, setHistory] = useState<string[]>([...SEARCH_HISTORY]);
  const [query, setQuery] = useState("");
  const { targetRef, onTargetFocus, focusTargetAfterFrame } = useSoftKeyboardTextTarget({
    placeholder: "Search",
    returnKey: "search",
    onChange: setQuery,
  });

  useEffect(() => {
    focusTargetAfterFrame();
  }, [focusTargetAfterFrame]);

  const applyQuery = (q: string) => {
    if (targetRef.current) targetRef.current.value = q;
    setQuery(q);
    focusTargetAfterFrame();
  };

  const trimmed = query.trim();
  const typing = trimmed.length > 0;

  const suggestions = useMemo(() => {
    if (!typing) return [];
    const q = trimmed.toLowerCase();
    const matches = SEARCH_SUGGESTIONS.filter((s) => s.toLowerCase().includes(q));
    return Array.from(
      new Set([trimmed, ...matches, `${trimmed} song`, `${trimmed} remix`, `${trimmed} slowed`]),
    ).slice(0, 10);
  }, [typing, trimmed]);

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      style={{
        backgroundColor: getColorCSSVar("UISheetFlat1"),
        paddingTop: topInsetCss,
      }}
    >
      <div className="flex w-full shrink-0 flex-col" style={{ paddingBottom: 8 }}>
        <SoundPanelTuxNavBar onBack={onClose} />

        <div className="flex w-full items-center" style={{ height: 44, padding: "0 16px 4px" }}>
          <div
            className="flex min-w-0 flex-1 items-center"
            style={{
              height: 40,
              borderRadius: 8,
              padding: 8,
              gap: 2,
              backgroundColor: getColorCSSVar("UIShapeNeutral4"),
            }}
          >
            <span className="shrink-0" style={{ color: getColorCSSVar("UIText1"), padding: "0 2px" }}>
              <IconMagnifyingGlass width={20} height={20} />
            </span>
            <textarea
              ref={targetRef}
              onFocus={onTargetFocus}
              onChange={(e) => setQuery(e.currentTarget.value)}
              rows={1}
              placeholder="Search"
              className="app-token-placeholder min-w-0 flex-1 resize-none border-0 bg-transparent outline-none"
              style={{
                height: 22,
                lineHeight: "22px",
                fontSize: 16,
                color: getColorCSSVar("UIText1"),
                overflow: "hidden",
                caretColor: getColorCSSVar("UITextPrimaryDisplay"),
              }}
            />
          </div>
          <button type="button" onClick={onClose} className="shrink-0" style={{ paddingLeft: 16 }}>
            <TUXText as="span" typographyPreset="Headline-Semibold" color="UITextPrimaryDisplay">
              Search
            </TUXText>
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain hide-scrollbar">
        {typing ? (
          <div className="flex w-full flex-col items-center" style={{ padding: "0 16px 12px" }}>
            {suggestions.map((s) => (
              <div key={s} className="flex w-full items-center" style={{ height: 44, gap: 12 }}>
                <button
                  type="button"
                  onClick={() => applyQuery(s)}
                  className="flex min-w-0 flex-1 items-center text-left"
                  style={{ gap: 8 }}
                >
                  <span
                    className="flex shrink-0 items-center justify-center rounded-full"
                    style={{
                      width: 30,
                      height: 30,
                      backgroundColor: getColorCSSVar("UIShapeNeutral4"),
                      color: getColorCSSVar("UIText1"),
                    }}
                  >
                    <IconMagnifyingGlass width={16} height={16} />
                  </span>
                  <TUXText
                    as="span"
                    typographyPreset="H4-Regular"
                    color="UIText1"
                    textDisplay="truncate"
                    className="min-w-0 flex-1"
                  >
                    {s}
                  </TUXText>
                </button>
                <button
                  type="button"
                  aria-label={`Use ${s}`}
                  onClick={() => applyQuery(s)}
                  className="flex shrink-0 items-center justify-center"
                  style={{ color: getColorCSSVar("UIText3") }}
                >
                  <IconArrowUpLeftLTR width={16} height={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex w-full flex-col items-center" style={{ padding: "0 16px 12px" }}>
            <button
              type="button"
              onClick={onDiscover}
              className="flex w-full items-center"
              style={{ height: 48, gap: 12, borderBottom: `1px solid ${getColorCSSVar("UIShapeNeutral4")}` }}
            >
              <span className="flex min-w-0 flex-1 items-center" style={{ gap: 14, color: getColorCSSVar("UIText1") }}>
                <IconMusicNoteSAltFill width={16} height={16} />
                <TUXText
                  as="span"
                  typographyPreset="H4-Semibold"
                  color="UIText1"
                  textDisplay="truncate"
                  className="min-w-0 flex-1 text-left"
                >
                  Discover more sounds
                </TUXText>
              </span>
              <span className="shrink-0" style={{ color: getColorCSSVar("UIText1") }}>
                <IconChevronRightLTR width={16} height={16} />
              </span>
            </button>

            <div className="flex w-full flex-col items-start" style={{ paddingTop: 6 }}>
              {history.map((q) => (
                <div key={q} className="flex w-full items-center" style={{ height: 40, gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => applyQuery(q)}
                    className="flex min-w-0 flex-1 items-center text-left"
                    style={{ gap: 8, color: getColorCSSVar("UIText1") }}
                  >
                    <IconClock width={16} height={16} />
                    <TUXText
                      as="span"
                      typographyPreset="H4-Regular"
                      color="UIText1"
                      textDisplay="truncate"
                      className="min-w-0 flex-1"
                    >
                      {q}
                    </TUXText>
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${q}`}
                    onClick={() => setHistory((h) => h.filter((x) => x !== q))}
                    className="flex shrink-0 items-center justify-center"
                    style={{ color: getColorCSSVar("UIText3") }}
                  >
                    <IconXMark width={16} height={16} />
                  </button>
                </div>
              ))}
            </div>

            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setHistory([])}
                className="flex w-full items-center justify-center"
                style={{ height: 48, padding: "15px 0" }}
              >
                <TUXText as="span" typographyPreset="H4-Semibold" color="UIText2">
                  Clear all
                </TUXText>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
