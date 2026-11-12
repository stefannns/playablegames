import {
  getColorCSSVar,
  TUXIconButton,
  TUXSwitch,
  TUXText,
} from "@byted-tiktok/tux-web";
import { IconChevronCollapse } from "@byted-tiktok/tux-icons";

import {
  APP_FRAME_CORNER_PANEL_CHROME_CLASS,
  AppFrameCornerPanelAnchor,
  appFrameCornerPanelChromeStyle,
} from "../../../../components/sys/app_frame_corner_capsule_trigger";
import {
  FEED_INFO_COMPONENTS,
  setFeedInfoComponentVisible,
  useFeedInfoVisibility,
} from "./feed_info_config_store";

export type FeedInfoConfigPanelProps = {
  stackIndex: number;
  onCollapse: () => void;
};

/**
 * Viewport-fixed feed info configurator — same shell as comment experiment /
 * photo text dev panels so toggles are not mistaken for in-app UI.
 */
export function FeedInfoConfigPanel({
  stackIndex,
  onCollapse,
}: FeedInfoConfigPanelProps) {
  const visibility = useFeedInfoVisibility();

  return (
    <AppFrameCornerPanelAnchor
      side="left"
      stackIndex={stackIndex}
      className={APP_FRAME_CORNER_PANEL_CHROME_CLASS}
      style={appFrameCornerPanelChromeStyle()}
    >
      <div
        className="flex shrink-0 flex-col gap-1 border-b px-4 py-3"
        style={{ borderColor: getColorCSSVar("UIShapeNeutral3") }}
      >
        <div className="flex items-center justify-between gap-3">
          <TUXText
            as="div"
            style={{
              fontSize: 15,
              fontWeight: 600,
              lineHeight: "19.5px",
              color: getColorCSSVar("UIText1"),
            }}
          >
            Feed components
          </TUXText>
          <TUXIconButton
            icon={<IconChevronCollapse width={14} height={14} />}
            sizePreset="small"
            onClick={onCollapse}
            backgroundColor="UIPageFlat2"
            aria-label="Collapse feed components panel"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
        {FEED_INFO_COMPONENTS.map((item) => {
          const checked = visibility[item.id];
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 border-b border-tux-v2-ui-shape-neutral-3 py-2.5 last:border-b-0"
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <TUXText typographyPreset="P1-Semibold" className="text-tux-v2-ui-text-1">
                  {item.label}
                </TUXText>
                <TUXText
                  typographyPreset="P3-Regular"
                  className="truncate text-tux-v2-ui-text-3"
                >
                  {item.description}
                </TUXText>
              </div>
              <TUXSwitch
                name={`feed-info-${item.id}`}
                value={item.id}
                checked={checked}
                onChange={(_event, nextChecked) =>
                  setFeedInfoComponentVisible(item.id, nextChecked)
                }
              />
            </div>
          );
        })}
      </div>
    </AppFrameCornerPanelAnchor>
  );
}
