import {
  TUXIconButton,
  TUXText,
  getColorCSSVar,
} from "@byted-tiktok/tux-web";
import { IconChevronCollapse, IconChevronDown, IconGearFill } from "@byted-tiktok/tux-icons";
import { useEffect, useState } from "react";

import {
  APP_FRAME_CORNER_PANEL_CHROME_CLASS,
  AppFrameCornerCapsuleTrigger,
  AppFrameCornerPanelAnchor,
  appFrameCornerPanelChromeStyle,
} from "../../../components/sys/app_frame_corner_capsule_trigger";
import {
  SEARCH_TOP1_CARD_TYPE_OPTIONS,
  setSearchTop1CardType,
  useSearchConfig,
  type SearchTop1CardType,
} from "../search_config_store";
import "./search_config_controls.css";

export function SearchConfigControls() {
  const [panelOpen, setPanelOpen] = useState(false);
  const { top1CardType } = useSearchConfig();

  useEffect(() => {
    document.documentElement.setAttribute("data-search-result-config-active", "true");
    return () => {
      document.documentElement.removeAttribute("data-search-result-config-active");
    };
  }, []);

  if (!panelOpen) {
    return (
      <AppFrameCornerCapsuleTrigger
        side="left"
        text="Config"
        className="search-config-controls-chrome"
        leadingIcon={
          <IconGearFill className="text-tux-v2-ui-text-1" width={16} height={16} />
        }
        onClick={() => setPanelOpen(true)}
        aria-label="Configure search"
      />
    );
  }

  return (
    <AppFrameCornerPanelAnchor
      side="left"
      className={`${APP_FRAME_CORNER_PANEL_CHROME_CLASS} search-config-controls-chrome`}
      style={appFrameCornerPanelChromeStyle()}
    >
      <div
        className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3"
        style={{ borderColor: getColorCSSVar("UIShapeNeutral3") }}
      >
        <TUXText
          as="div"
          style={{
            fontSize: 15,
            fontWeight: 600,
            lineHeight: "19.5px",
            color: getColorCSSVar("UIText1"),
          }}
        >
          Config
        </TUXText>
        <TUXIconButton
          icon={<IconChevronCollapse width={14} height={14} />}
          sizePreset="small"
          onClick={() => setPanelOpen(false)}
          backgroundColor="UIPageFlat2"
          aria-label="Collapse search config panel"
        />
      </div>

      <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <TUXText typographyPreset="P1-Semibold" className="text-tux-v2-ui-text-1">
            Top1 CardType
          </TUXText>
          <div className="relative min-w-[172px]">
            <select
              className="h-9 w-full appearance-none rounded-lg border border-tux-v2-ui-shape-neutral-3 bg-tux-v2-ui-page-flat-1 px-3 pr-8 text-[13px] text-tux-v2-ui-text-1 outline-none"
              value={top1CardType}
              onChange={(event) =>
                setSearchTop1CardType(event.currentTarget.value as SearchTop1CardType)
              }
              aria-label="Top1 CardType"
            >
              {SEARCH_TOP1_CARD_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
              <IconChevronDown width={16} height={16} style={{ color: getColorCSSVar("UIText3") }} />
            </div>
          </div>
        </div>
      </div>
    </AppFrameCornerPanelAnchor>
  );
}
