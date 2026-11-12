import { TUXIconButton, TUXText, getColorCSSVar } from "@byted-tiktok/tux-web";
import {
  IconChevronCollapse,
  IconColorTickCircleFill,
  IconGearFill,
} from "@byted-tiktok/tux-icons";
import { useState } from "react";

import {
  APP_FRAME_CORNER_PANEL_CHROME_CLASS,
  AppFrameCornerCapsuleTrigger,
  AppFrameCornerPanelAnchor,
  appFrameCornerPanelChromeStyle,
} from "../../../components/sys/app_frame_corner_capsule_trigger";
import { useCommentPanelVisualStore } from "./comment_panel/comment_panel_visual_store";
import {
  MUSIC_DETAIL_EXPERIMENT_OPTIONS,
  setMusicDetailExperimentId,
  useMusicDetailExperimentStore,
} from "./music_detail_experiment_store";

export type MusicDetailExperimentDebugControlsProps = {
  /** Shift down when the comment Experiment capsule is mounted. */
  stackBelowCommentExperiment?: boolean;
};

function musicDetailExperimentStackIndex(stackBelowCommentExperiment: boolean): number {
  return (stackBelowCommentExperiment ? 1 : 0) + 1;
}

export function MusicDetailExperimentDebugControls({
  stackBelowCommentExperiment = false,
}: MusicDetailExperimentDebugControlsProps) {
  const { isOpen: isCommentPanelOpen } = useCommentPanelVisualStore();
  const { activeExperimentId } = useMusicDetailExperimentStore();
  const [panelOpen, setPanelOpen] = useState(false);
  const stackIndex = musicDetailExperimentStackIndex(stackBelowCommentExperiment);

  if (isCommentPanelOpen) {
    return null;
  }

  if (!panelOpen) {
    return (
      <AppFrameCornerCapsuleTrigger
        side="left"
        stackIndex={stackIndex}
        text="MDP Toolbox"
        leadingIcon={
          <IconGearFill className="text-tux-v2-ui-text-1" width={16} height={16} />
        }
        onClick={() => setPanelOpen(true)}
        aria-label="Open MDP toolbox"
      />
    );
  }

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
          <div className="min-w-0">
            <TUXText typographyPreset="H4-Semibold" color="UIText1">
              MDP Toolbox
            </TUXText>
            <TUXText typographyPreset="P3-Regular" color="UIText3" className="block">
              切换音乐详情页实验组
            </TUXText>
          </div>
          <TUXIconButton
            icon={<IconChevronCollapse width={14} height={14} />}
            sizePreset="small"
            onClick={() => setPanelOpen(false)}
            backgroundColor="UIPageFlat2"
            aria-label="Collapse MDP toolbox"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {MUSIC_DETAIL_EXPERIMENT_OPTIONS.map((option) => {
          const selected = option.id === activeExperimentId;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left"
              style={{
                backgroundColor: selected
                  ? getColorCSSVar("UIShapeNeutral4")
                  : "transparent",
              }}
              onClick={() => setMusicDetailExperimentId(option.id)}
            >
              <span
                className="flex h-5 w-5 flex-none items-center justify-center rounded-full"
                style={{
                  color: selected
                    ? getColorCSSVar("UIShapePrimary")
                    : getColorCSSVar("UIText3"),
                }}
              >
                {selected ? <IconColorTickCircleFill width={18} height={18} /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <TUXText typographyPreset="P2-Semibold" color="UIText1" className="block">
                  {option.label}
                </TUXText>
                <TUXText typographyPreset="P3-Regular" color="UIText3" className="block">
                  {option.description}
                </TUXText>
              </span>
            </button>
          );
        })}
      </div>
    </AppFrameCornerPanelAnchor>
  );
}
