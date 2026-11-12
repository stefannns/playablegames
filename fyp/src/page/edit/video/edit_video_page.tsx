import { useCallback, useState, type CSSProperties, type ReactNode } from "react";

import { useRegisterHomeIndicatorSurfaceTheme } from "../../../components/sys/app_frame";
import { useAppNavigation } from "../../../context/app_navigation";
import { getCreationCapturedPhoto } from "../../creation/creation_studio_store";
import { CREATION_PUBLISH_COVER_FEED_INDEX } from "../../creation/creation_publish_page.config";
import { postPublishPaths } from "../../creation/post_publish/post_publish_paths";
import { queuePostPublishSeed } from "../../creation/post_publish/post_publish_store";
import { localFeedVerticalCoverUrl } from "../../../utils/local_media_placeholder";
import { EditBottomActions } from "../components/edit_bottom_actions";
import { EditMediaViewport } from "../components/edit_media_viewport";
import { EditSidebar } from "../components/edit_sidebar";
import {
  EditVideoAutoCutOverlay,
  type EditVideoAutoCutMode,
} from "./edit_video_autocut_overlay";
import { buildEditVideoSidebarTools } from "./edit_video_toolbar.config";
import { EditVideoSettingsPanel } from "./edit_video_settings_panel";

export type EditVideoPageProps = {
  /** Captured frame from the creation camera; omit for neutral placeholder fill. */
  mediaSrc?: string | null;
  onBack?: (trigger: HTMLElement) => void;
  reserveFrameTopInset?: boolean;
  /** Replaces the default Next (route to Creation's publish page), e.g. to publish in place. */
  onNext?: () => void;
  /** Custom preview body instead of `mediaSrc` (e.g. a live playable). */
  mediaContent?: ReactNode;
  /** Passed to the preview frame; see `EditMediaViewport`. */
  mediaFrameStyle?: CSSProperties;
  mediaCornerRadiusPx?: number;
};

export function EditVideoPage({
  mediaSrc = null,
  onBack,
  reserveFrameTopInset = true,
  onNext,
  mediaContent,
  mediaFrameStyle,
  mediaCornerRadiusPx,
}: EditVideoPageProps) {
  const { navigate } = useAppNavigation();
  useRegisterHomeIndicatorSurfaceTheme("dark");
  const [autoCutMode, setAutoCutMode] = useState<EditVideoAutoCutMode>("default");
  const [autoCutEffectIndex, setAutoCutEffectIndex] = useState(1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const sidebarTools = buildEditVideoSidebarTools(() => setSettingsOpen(true));

  const collapseAutoCutPicker = useCallback((selectedIndex: number) => {
    setAutoCutMode(selectedIndex === 0 ? "autoCut" : "soundSync");
  }, []);

  const openAutoCutPicker = useCallback(() => {
    setAutoCutEffectIndex(1);
    setAutoCutMode("picker");
  }, []);

  const removeCollapsedSoundSync = useCallback(() => {
    setAutoCutEffectIndex(1);
    setAutoCutMode("default");
  }, []);

  const openPublish = useCallback(() => {
    const captured = getCreationCapturedPhoto();
    queuePostPublishSeed({
      kind: "video",
      coverSrc:
        captured ?? localFeedVerticalCoverUrl(CREATION_PUBLISH_COVER_FEED_INDEX),
    });
    navigate(postPublishPaths.publish("edit-video"));
  }, [navigate]);

  const handleBack = useCallback(
    (trigger: HTMLElement) => {
      if (settingsOpen) {
        setSettingsOpen(false);
        return;
      }
      if (autoCutMode === "picker") {
        collapseAutoCutPicker(autoCutEffectIndex);
        return;
      }
      onBack?.(trigger);
    },
    [autoCutEffectIndex, autoCutMode, collapseAutoCutPicker, onBack, settingsOpen],
  );

  return (
    <EditMediaViewport
      mediaSrc={mediaSrc}
      mediaAlt="Video preview"
      onBack={handleBack}
      reserveFrameTopInset={reserveFrameTopInset}
      mediaContent={mediaContent}
      mediaFrameStyle={mediaFrameStyle}
      mediaCornerRadiusPx={mediaCornerRadiusPx}
      bottomActions={<EditBottomActions onNext={onNext ?? openPublish} />}
      sidebar={<EditSidebar {...sidebarTools} />}
    >
      <div
        className="absolute inset-0"
        style={{
          opacity: settingsOpen ? 0 : 1,
          pointerEvents: settingsOpen ? "none" : "auto",
          transition: "opacity 120ms ease",
        }}
        aria-hidden={settingsOpen}
      >
        <EditVideoAutoCutOverlay
          mode={autoCutMode}
          effectIndex={autoCutEffectIndex}
          onEffectIndexChange={setAutoCutEffectIndex}
          onCollapsePicker={collapseAutoCutPicker}
          onOpenPicker={openAutoCutPicker}
          onRemoveSoundSync={removeCollapsedSoundSync}
        />
      </div>
      <EditVideoSettingsPanel
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </EditMediaViewport>
  );
}
