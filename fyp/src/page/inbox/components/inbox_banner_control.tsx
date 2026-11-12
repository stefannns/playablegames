import { AppFrameCornerCapsuleTrigger } from "../../../components/sys/app_frame_corner_capsule_trigger";
import {
  setInboxBannerEnabled,
  useInboxBannerEnabled,
} from "../inbox_banner_store";

export type InboxBannerControlProps = {
  /** Shift down when the comment Experiment capsule is mounted. */
  stackBelowCommentExperiment?: boolean;
};

/**
 * Debug control for the Inbox age-gate banner. Uses the same corner capsule
 * entry as Feed / comment config panels — hidden below `sm`.
 */
export function InboxBannerControl({
  stackBelowCommentExperiment = false,
}: InboxBannerControlProps) {
  const enabled = useInboxBannerEnabled();
  const stackIndex = stackBelowCommentExperiment ? 1 : 0;

  return (
    <AppFrameCornerCapsuleTrigger
      side="left"
      stackIndex={stackIndex}
      text={`Banner: ${enabled ? "On" : "Off"}`}
      onClick={() => setInboxBannerEnabled(!enabled)}
      aria-label={`Inbox banner ${enabled ? "on" : "off"}. Click to toggle.`}
    />
  );
}
