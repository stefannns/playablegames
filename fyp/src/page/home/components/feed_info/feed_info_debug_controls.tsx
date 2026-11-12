import { IconGearFill } from "@byted-tiktok/tux-icons";
import { useState } from "react";
import { AppFrameCornerCapsuleTrigger } from "../../../../components/sys/app_frame_corner_capsule_trigger";
import { useCommentPanelVisualStore } from "../comment_panel/comment_panel_visual_store";
import { FeedInfoConfigPanel } from "./feed_info_config_panel";

export type FeedInfoDebugControlsProps = {
  /** Shift down only when the comment Experiment capsule is actually mounted. */
  stackBelowCommentExperiment?: boolean;
};

export function FeedInfoDebugControls({
  stackBelowCommentExperiment = false,
}: FeedInfoDebugControlsProps) {
  const { isOpen: isCommentPanelOpen } = useCommentPanelVisualStore();
  const [panelOpen, setPanelOpen] = useState(false);
  const stackIndex = stackBelowCommentExperiment ? 1 : 0;

  if (isCommentPanelOpen) {
    return null;
  }

  if (!panelOpen) {
    return (
      <AppFrameCornerCapsuleTrigger
        side="left"
        stackIndex={stackIndex}
        text="Feed info"
        leadingIcon={
          <IconGearFill className="text-tux-v2-ui-text-1" width={16} height={16} />
        }
        onClick={() => setPanelOpen(true)}
        aria-label="Configure feed info components"
      />
    );
  }

  return (
    <FeedInfoConfigPanel
      stackIndex={stackIndex}
      onCollapse={() => setPanelOpen(false)}
    />
  );
}
