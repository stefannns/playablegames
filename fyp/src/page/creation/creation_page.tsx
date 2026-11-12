import { getColorCSSVar } from "@byted-tiktok/tux-web";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useAppNavigation } from "../../context/app_navigation";
import {
  appPathForRoute,
  creationBackPathForSub,
  soundDiscoverPath,
  soundSearchPath,
} from "../../routes/app_route_tree";
import { DiscoverPage } from "../edit/components/music_panel/discover_page";
import { AddSoundPage } from "../edit/components/music_panel/add_sound_page";
import { SoundSearchPage } from "../edit/components/music_panel/sound_search_page";
import {
  useAppFrame,
  useTabAppChromeSurfaceTheme,
} from "../../components/sys/app_frame";
import { ThemeScope, useTheme } from "../../context/theme";
import type { SoundSearchOrigin } from "../../routes/app_route_tree";
import {
  CAMERA_DOCK_ABOVE_TAB_BAR_PX,
  CAMERA_MODE_TAB_BOTTOM_OFFSET_PX,
  CAMERA_RECORDING_BELOW_DOCK_BOTTOM_PX,
  CAMERA_TAB_BAR_BOTTOM_OFFSET_PX,
  CAMERA_TAB_BAR_HEIGHT_PX,
  EDIT_MEDIA_ASPECT,
  EDIT_SIDEBAR_TOP_CSS,
} from "../edit/components/edit_chrome.constants.ts";
import { EditSidebar, EditSidebarBackdrop } from "../edit/components/edit_sidebar";
import { MediaPreviewNavBar } from "../edit/components/media_preview_nav_bar";
import {
  CAMERA_EFFECT_SOUND_TRACK,
  soundDisplayName,
} from "../edit/components/music_panel/music_data";
import { useEditMusicPanelChrome } from "../edit/components/music_panel/use_edit_music_panel_chrome";
import { buildCameraSidebarTools } from "./camera_toolbar.config";
import { captureCameraViewfinder } from "./capture_camera_frame";
import PostPublishFlow from "./post_publish/post_publish_flow";
import type { PhotoEditMediaItem } from "./photo_edit_media_catalog";
import {
  clearCreationCapturedPhoto,
  setAlbumEditPhotos,
  setCreationCapturedPhoto,
  useAlbumEditPhotos,
  useCreationCapturedPhoto,
} from "./creation_studio_store";
import { EditPhotoPage } from "../edit/photo/edit_photo_page";
import { EditVideoPage } from "../edit/video/edit_video_page";
import TemplateSelectPage from "../text_to_image/TemplateSelectPage";
import TextToImagePage from "../text_to_image/text_to_image_page";
import CameraAllEffectsBar from "./components/camera_all_effects_bar";
import CameraEffectPanelOverlay from "./components/camera_effect_panel_overlay";
import CameraEffectsPanel from "./components/camera_effects_panel";
import CameraEffectDock from "./components/camera_effect_dock";
import {
  isCameraPhotoMode,
  isCameraTextMode,
  isCameraVideoDurationMode,
} from "./camera_mode";
import { creationSecondaryPaths } from "./creation_secondary_paths";
import CameraModeTab, {
  type CameraModeKey,
} from "./components/camera_mode_tab";
import CameraPreviewViewport from "./components/camera_preview_viewport";
import CameraRecordingButton from "./components/camera_recording_button";
import CameraUploadEntrance from "./components/camera_upload_entrance";
import CreationAlbumPicker from "./creation_album_picker";
import { CREATION_ALBUM_SHEET_DISMISS_MS } from "./creation_sheet_chrome";
import CreationCreateTabPage from "./creation_create_tab_page";
import CreationLiveTabPage from "./creation_live_tab_page";
import CreationPlayablePage from "./creation_playable_page";
import {
  CreationPrimaryTabShell,
  creationPrimaryTabBottomCss,
} from "./creation_primary_tab_shell";
import type { CreationPrimaryTabKey } from "./components/creation_primary_tab_bar";
import {
  isCreationImmersiveDarkScreen,
  useCreationCreateRegionTheme,
} from "./creation_create_region_theme";
import { useCreationCamera } from "./hooks/use_creation_camera";

const EFFECT_PREVIEWS: Record<number, string> = {
  0: "/resource/video_mock/creation-camera/camera-preview-effect-0.png",
  1: "/resource/video_mock/creation-camera/camera-preview-effect-1.png",
  2: "/resource/video_mock/creation-camera/camera-preview-effect-3.png",
  3: "/resource/video_mock/creation-camera/camera-preview-effect-4.png",
  4: "/resource/video_mock/creation-camera/camera-preview-effect-2.png",
  5: "/resource/video_mock/creation-camera/camera-preview-effect-5.png",
};
const DEFAULT_PREVIEW = "/resource/video_mock/creation-camera/camera-preview.png";

/** Demo soundtrack label while a camera effect is active (restores pre-panel behavior). */
const CAMERA_EFFECT_SOUND_NAME = soundDisplayName(CAMERA_EFFECT_SOUND_TRACK);

// ── Layout constants (see Camera layout adaptation rules) ─────────────────────
const VF_SIDEBAR_RIGHT = 0; // Rule 6: 侧边栏右 padding

/** Gallery entrance vertically centered with POST tab bar (64px tall control). */
const CAMERA_GALLERY_BELOW_BOTTOM_INSET_PX =
  CAMERA_TAB_BAR_BOTTOM_OFFSET_PX + CAMERA_TAB_BAR_HEIGHT_PX / 2 - 32;

function cameraChromeBottomCss(bottomInsetCss: string, extraPx: number): string {
  return `calc(${bottomInsetCss} + ${extraPx}px)`;
}

function CameraStudioContent({
  isTabActive = true,
  onClose,
  onPhotoCaptured,
  onVideoCaptured,
  onOpenTextToImage,
  onOpenAlbum,
  onBottomChromeHiddenChange,
  pauseCamera = false,
}: {
  isTabActive?: boolean;
  onClose?: () => void;
  onPhotoCaptured: (frame: string | null) => void;
  onVideoCaptured: (frame: string | null) => void;
  onOpenTextToImage: () => void;
  onOpenAlbum: () => void;
  onBottomChromeHiddenChange?: (hidden: boolean) => void;
  /** Pause the live camera stream (e.g. album sheet covers the preview). */
  pauseCamera?: boolean;
}) {
  const viewfinderRef = useRef<HTMLDivElement | null>(null);
  const { topInsetCss, bottomInsetCss } = useAppFrame();
  const [activeMode, setActiveMode] = useState<CameraModeKey>("photo");
  const [selectedEffect, setSelectedEffect] = useState<number | null>(null);
  const [effectsPanelOpen, setEffectsPanelOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  /** Live camera vs Figma static preview — toggled via sidebar Flip. */
  const [previewMode, setPreviewMode] = useState<"live" | "static">("live");
  const [flipDeg, setFlipDeg] = useState(0);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [ratioAltIcon, setRatioAltIcon] = useState(false);
  const [effectSoundSuppressed, setEffectSoundSuppressed] = useState(false);
  const [shutterCentered, setShutterCentered] = useState(true);
  const effectSoundTitle =
    selectedEffect !== null && !effectSoundSuppressed
      ? CAMERA_EFFECT_SOUND_NAME
      : undefined;
  const {
    soundNavProps,
    musicPanelOverlay,
    soundChromeFaded,
    selectedSoundName,
    setSelectedSoundName,
    dismissSelectedSound,
  } = useEditMusicPanelChrome({
    activeSoundTitle: effectSoundTitle,
    showSoundModeBar: false,
    onSelectedSoundChange: (track) => {
      if (!track) setEffectSoundSuppressed(true);
    },
  });
  const { videoRef, status: cameraStatus } = useCreationCamera({
    enabled: isTabActive && previewMode === "live" && !pauseCamera,
    facingMode: "environment",
  });

  useEffect(() => {
    setSelectedSoundName(undefined);
    setEffectSoundSuppressed(false);
  }, [selectedEffect, setSelectedSoundName]);

  const cameraSoundNavProps = useMemo(() => {
    const effectSoundName =
      selectedEffect !== null && !effectSoundSuppressed
        ? CAMERA_EFFECT_SOUND_NAME
        : undefined;

    return {
      ...soundNavProps,
      soundName: selectedSoundName ?? effectSoundName,
      onSoundDismiss: () => {
        if (selectedSoundName) {
          dismissSelectedSound();
          return;
        }
        setEffectSoundSuppressed(true);
      },
    };
  }, [
    dismissSelectedSound,
    effectSoundSuppressed,
    selectedEffect,
    selectedSoundName,
    soundNavProps,
  ]);

  const staticPreviewBg =
    selectedEffect !== null
      ? (EFFECT_PREVIEWS[selectedEffect] ?? DEFAULT_PREVIEW)
      : DEFAULT_PREVIEW;

  const staticPreviewForEffect = useCallback((effectId: number | null) => {
    return effectId !== null
      ? (EFFECT_PREVIEWS[effectId] ?? DEFAULT_PREVIEW)
      : DEFAULT_PREVIEW;
  }, []);

  const captureViewfinderFrame = useCallback(
    async (captureEffectId: number | null = selectedEffect): Promise<string | null> => {
      const previewBg = staticPreviewForEffect(captureEffectId);
      const useStaticImage =
        previewMode === "static" ||
        cameraStatus === "unsupported" ||
        cameraStatus === "denied" ||
        cameraStatus === "error";

      if (useStaticImage) {
        return previewBg;
      }

      const video = videoRef.current;
      const viewfinder = viewfinderRef.current;
      if (!video || !viewfinder) {
        return null;
      }

      const frame = await captureCameraViewfinder(video, viewfinder, {
        mirrored: false,
      });
      return frame ?? null;
    },
    [cameraStatus, previewMode, selectedEffect, staticPreviewForEffect, videoRef],
  );

  const handleRecordingDone = useCallback(() => {
    setIsRecording(false);
    if (!isCameraVideoDurationMode(activeMode)) {
      return;
    }

    void captureViewfinderFrame().then((frame) => {
      onVideoCaptured(frame ?? staticPreviewBg);
    });
  }, [activeMode, captureViewfinderFrame, onVideoCaptured, staticPreviewBg]);

  const handleFlip = useCallback(() => {
    setFlipDeg((deg) => deg + 180);
    setPreviewMode((mode) => (mode === "live" ? "static" : "live"));
  }, []);

  const cameraSidebarTools = buildCameraSidebarTools({
    flipDeg,
    usingStaticPreview: previewMode === "static",
    ratioAltIcon,
    onFlip: handleFlip,
    onToggleRatio: () => setRatioAltIcon((alt) => !alt),
  });

  const handleClose = useCallback(() => {
    if (effectsPanelOpen) {
      setEffectsPanelOpen(false);
      return;
    }
    if (isRecording) {
      setIsRecording(false);
      return;
    }
    onClose?.();
  }, [effectsPanelOpen, isRecording, onClose]);

  /** Dock tap (shutter or any effect) — PHOTO → photo edit; 3m/60s/15s → video edit. */
  const handleShutter = useCallback(
    (captureEffectId: number | null = null) => {
      if (!isCameraPhotoMode(activeMode) && !isCameraVideoDurationMode(activeMode)) {
        return;
      }

      const effectForCapture = captureEffectId ?? selectedEffect;
      if (captureEffectId !== null && captureEffectId !== selectedEffect) {
        setSelectedEffect(captureEffectId);
      }

      const fallbackBg = staticPreviewForEffect(effectForCapture);

      void captureViewfinderFrame(effectForCapture).then((frame) => {
        if (isCameraPhotoMode(activeMode)) {
          onPhotoCaptured(frame);
          return;
        }
        onVideoCaptured(frame ?? fallbackBg);
      });
    },
    [
      activeMode,
      captureViewfinderFrame,
      onPhotoCaptured,
      onVideoCaptured,
      selectedEffect,
      staticPreviewForEffect,
    ],
  );

  const handleRecordingStart = useCallback(() => {
    if (!isCameraVideoDurationMode(activeMode)) {
      return;
    }
    setIsRecording(true);
  }, [activeMode]);

  const handleModeChange = useCallback(
    (mode: CameraModeKey) => {
      setActiveMode(mode);
      if (isCameraTextMode(mode)) {
        onOpenTextToImage();
      }
    },
    [onOpenTextToImage],
  );

  const uiInactive = effectsPanelOpen || isRecording || soundChromeFaded;
  const primaryTabHidden = uiInactive || !shutterCentered;

  useEffect(() => {
    onBottomChromeHiddenChange?.(primaryTabHidden);
  }, [onBottomChromeHiddenChange, primaryTabHidden]);

  const hideOnPanel: CSSProperties = {
    opacity: uiInactive ? 0 : 1,
    pointerEvents: uiInactive ? "none" : undefined,
    transition: "opacity 180ms ease",
  };

  const hideSoundOnRecording: CSSProperties = {
    opacity: isRecording ? 0 : 1,
    pointerEvents: isRecording ? "none" : undefined,
    transition: "opacity 180ms ease",
  };

  const showOnPanel: CSSProperties = {
    opacity: effectsPanelOpen ? 1 : 0,
    pointerEvents: effectsPanelOpen ? "auto" : "none",
    transition: "opacity 180ms ease",
  };

  const galleryBottomCss = cameraChromeBottomCss(
    bottomInsetCss,
    CAMERA_GALLERY_BELOW_BOTTOM_INSET_PX,
  );
  const dockBottomCss = cameraChromeBottomCss(
    bottomInsetCss,
    CAMERA_TAB_BAR_BOTTOM_OFFSET_PX +
      CAMERA_TAB_BAR_HEIGHT_PX +
      CAMERA_DOCK_ABOVE_TAB_BAR_PX,
  );
  const modeTabBottomCss = cameraChromeBottomCss(
    bottomInsetCss,
    CAMERA_TAB_BAR_BOTTOM_OFFSET_PX +
      CAMERA_TAB_BAR_HEIGHT_PX +
      CAMERA_MODE_TAB_BOTTOM_OFFSET_PX,
  );
  const recordingBottomCss = cameraChromeBottomCss(
    bottomInsetCss,
    CAMERA_TAB_BAR_BOTTOM_OFFSET_PX +
      CAMERA_TAB_BAR_HEIGHT_PX +
      CAMERA_DOCK_ABOVE_TAB_BAR_PX -
      CAMERA_RECORDING_BELOW_DOCK_BOTTOM_PX,
  );

  return (
    <ThemeScope mode="dark" className="relative h-full min-h-0">
      <div
        className="relative w-full h-full overflow-hidden"
        style={{ background: "#000000" }}
      >
        {/* Rule 3: 9:16 取景器顶边对齐 AppFrame 安全区（与 EditMediaViewport 一致） */}
        <div
          className="absolute inset-x-0"
          style={{
            top: topInsetCss,
            aspectRatio: EDIT_MEDIA_ASPECT,
          }}
          aria-label="Camera photo creation"
        >
          <div
            className="relative w-full"
            style={{ height: "100%" }}
          >
            <div ref={viewfinderRef} className="z-0 absolute inset-0">
              <CameraPreviewViewport
                className="absolute inset-0"
                mode={previewMode}
                staticBackgroundUrl={staticPreviewBg}
                videoRef={videoRef}
                facingMode="environment"
                cameraStatus={cameraStatus}
              />
            </div>

            <MediaPreviewNavBar
              leading="close"
              onLeading={() => handleClose()}
              {...cameraSoundNavProps}
              style={{ ...hideSoundOnRecording, ...hideOnPanel }}
            />

            <CameraEffectPanelOverlay
              selectedEffect={selectedEffect}
              style={showOnPanel}
            />

          </div>
        </div>

        {/* Rule 6: 侧栏与编辑页一致 — 预览顶 + 12px，z 高于底栏 */}
        <div
          className="z-40 absolute inset-x-0 overflow-visible pointer-events-none"
          style={{
            top: topInsetCss,
            bottom: "calc(-1 * var(--app-frame-bottom-inset, 0px))",
            right: VF_SIDEBAR_RIGHT,
            ...hideOnPanel,
          }}
        >
          <EditSidebarBackdrop visible={sidebarExpanded} />
          <div className="relative size-full">
            <EditSidebar
              compactTools={cameraSidebarTools.compactTools}
              expandableTools={cameraSidebarTools.expandableTools}
              scrollPanelHeights={cameraSidebarTools.scrollPanelHeights}
              toolTopCss={EDIT_SIDEBAR_TOP_CSS}
              onExpandedChange={setSidebarExpanded}
            />
          </div>
        </div>

        {/* Bottom chrome — anchored to AppFrame bottom inset (same model as EditMediaViewport). */}
        <div>
          <CameraModeTab
            active={activeMode}
            onChange={handleModeChange}
            isTabActive={isTabActive}
            style={{ bottom: modeTabBottomCss, top: "auto", width: "100%", ...hideOnPanel }}
          />

          <CameraEffectDock
            selectedEffect={selectedEffect}
            onSelectEffect={setSelectedEffect}
            onDeselect={() => setSelectedEffect(null)}
            onShutter={handleShutter}
            onLongPressShutter={handleRecordingStart}
            onLongPressRelease={handleRecordingDone}
            onShutterCenteredChange={setShutterCentered}
            isTabActive={isTabActive}
            style={{ bottom: dockBottomCss, top: "auto", width: "100%", ...hideOnPanel }}
          />

          {isRecording ? (
            <CameraRecordingButton
              onDone={handleRecordingDone}
              style={{ bottom: recordingBottomCss, top: "auto" }}
            />
          ) : null}
        </div>

        {/* Gallery + effects bar — primary POST/CREATE/LIVE tab lives in CreationPrimaryTabShell */}
        <div style={hideOnPanel}>
          <CameraUploadEntrance
            onClick={onOpenAlbum}
            style={{ bottom: galleryBottomCss, top: "auto", left: 0 }}
          />
          {selectedEffect !== null ? (
            <CameraAllEffectsBar
              onClose={() => setSelectedEffect(null)}
              onOpenPanel={() => setEffectsPanelOpen(true)}
              style={{
                bottom: cameraChromeBottomCss(bottomInsetCss, CAMERA_TAB_BAR_BOTTOM_OFFSET_PX - 10),
                top: "auto",
                left: 78,
                right: 0,
              }}
            />
          ) : null}
        </div>

        <CameraEffectsPanel
          visible={effectsPanelOpen}
          onVisibleChange={setEffectsPanelOpen}
          selectedEffect={selectedEffect}
          onSelectEffect={(id) => {
            setSelectedEffect(id);
            setEffectsPanelOpen(false);
          }}
        />

        {musicPanelOverlay}
      </div>
    </ThemeScope>
  );
}

function CreationEditPhotoContent({ onBack }: { onBack: () => void }) {
  const capturedPhoto = useCreationCapturedPhoto();
  const albumPhotos = useAlbumEditPhotos();

  return (
    <ThemeScope mode="dark" className="relative bg-black w-full h-full min-h-0">
      <EditPhotoPage
        mediaSrc={capturedPhoto}
        albumPhotos={albumPhotos}
        onBack={onBack}
      />
    </ThemeScope>
  );
}

function CreationEditVideoContent({ onBack }: { onBack: () => void }) {
  const capturedFrame = useCreationCapturedPhoto();

  return (
    <ThemeScope mode="dark" className="relative bg-black w-full h-full min-h-0">
      <EditVideoPage mediaSrc={capturedFrame} onBack={onBack} />
    </ThemeScope>
  );
}

function CreationTextToImageContent({ onBack }: { onBack: () => void }) {
  return <TextToImagePage onBack={onBack} />;
}

function CreationTextToImageTemplatesContent({ onBack }: { onBack: () => void }) {
  return <TemplateSelectPage onBack={onBack} />;
}

function CreationAddSoundContent({
  onBack,
  origin,
}: {
  onBack: () => void;
  origin: SoundSearchOrigin;
}) {
  return <AddSoundPage onBack={onBack} origin={origin} />;
}

function CreationSoundSearchContent({
  onBack,
  onDiscover,
}: {
  onBack: () => void;
  onDiscover: () => void;
}) {
  return <SoundSearchPage onClose={onBack} onDiscover={onDiscover} />;
}

function CreationAlbumRouteContent({
  isTabActive = true,
  onClose,
  onPhotoCaptured,
  onVideoCaptured,
  onOpenTextToImage,
  onAlbumPhotosSelected,
  onBack,
}: {
  isTabActive?: boolean;
  onClose?: () => void;
  onPhotoCaptured: (frame: string | null) => void;
  onVideoCaptured: (frame: string | null) => void;
  onOpenTextToImage: () => void;
  onAlbumPhotosSelected: (photos: PhotoEditMediaItem[]) => void;
  onBack: () => void;
}) {
  const [albumVisible, setAlbumVisible] = useState(true);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current !== null) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  const handleAlbumVisibleChange = useCallback(
    (open: boolean) => {
      if (open) {
        if (dismissTimerRef.current !== null) {
          clearTimeout(dismissTimerRef.current);
          dismissTimerRef.current = null;
        }
        setAlbumVisible(true);
        return;
      }

      setAlbumVisible(false);
      if (dismissTimerRef.current !== null) {
        clearTimeout(dismissTimerRef.current);
      }
      dismissTimerRef.current = setTimeout(() => {
        dismissTimerRef.current = null;
        onBack();
      }, CREATION_ALBUM_SHEET_DISMISS_MS);
    },
    [onBack],
  );

  return (
    <>
      <CameraStudioContent
        isTabActive={isTabActive}
        onClose={onClose}
        onPhotoCaptured={onPhotoCaptured}
        onVideoCaptured={onVideoCaptured}
        onOpenTextToImage={onOpenTextToImage}
        onOpenAlbum={onBack}
        pauseCamera
      />
      <CreationAlbumPicker
        visible={albumVisible}
        onVisibleChange={handleAlbumVisibleChange}
        onOpenText={onOpenTextToImage}
        onConfirmSelection={onAlbumPhotosSelected}
      />
    </>
  );
}

function CreationSoundDiscoverContent({
  onBack,
  onSearchTap,
}: {
  onBack: () => void;
  onSearchTap: () => void;
}) {
  return <DiscoverPage onClose={onBack} onSearchTap={onSearchTap} />;
}

const CREATION_PAGE_ROUTE_ROOT_CLASS =
  "relative h-full min-h-0 flex flex-col text-tux-v2-ui-text-1";

const CREATION_PAGE_ROUTE_ROOT_STYLE: CSSProperties = {
  backgroundColor: getColorCSSVar("UIPageFlat1"),
};

type CreationPrimaryTabScreen = "studio" | "create" | "live";

function primaryTabForScreen(screen: CreationPrimaryTabScreen): CreationPrimaryTabKey {
  switch (screen) {
    case "create":
      return "create";
    case "live":
      return "live";
    default:
      return "post";
  }
}

/** POST camera · Create hub · Live hub — one shared POST · CREATE · LIVE tab bar. */
function CreationPrimaryTabFlow({
  creationScreen,
  isTabActive = true,
  onClose,
  onOpenEditPhoto,
  onOpenEditVideo,
  onOpenTextToImage,
  onOpenAlbum,
  navigate,
}: {
  creationScreen: CreationPrimaryTabScreen;
  isTabActive?: boolean;
  onClose?: () => void;
  onOpenEditPhoto: (frame: string | null) => void;
  onOpenEditVideo: (frame: string | null) => void;
  onOpenTextToImage: () => void;
  onOpenAlbum: () => void;
  navigate: ReturnType<typeof useAppNavigation>["navigate"];
}) {
  const { bottomInsetCss } = useAppFrame();
  const createRegionTheme = useCreationCreateRegionTheme();
  const [primaryTabHidden, setPrimaryTabHidden] = useState(false);

  const isStudio = creationScreen === "studio";
  const primaryTab = primaryTabForScreen(creationScreen);
  const tabBarBottomCss = creationPrimaryTabBottomCss(bottomInsetCss);

  const handlePrimaryTabChange = useCallback(
    (key: CreationPrimaryTabKey) => {
      if (key === "playable") {
        navigate(creationSecondaryPaths.playable());
        return;
      }
      if (key === "create") {
        navigate(creationSecondaryPaths.create());
        return;
      }
      if (key === "live") {
        navigate(creationSecondaryPaths.live());
        return;
      }
      navigate(creationSecondaryPaths.studio());
    },
    [navigate],
  );

  let content: ReactNode;
  if (creationScreen === "create") {
    content = (
      <ThemeScope
        mode={createRegionTheme}
        className={CREATION_PAGE_ROUTE_ROOT_CLASS}
        style={CREATION_PAGE_ROUTE_ROOT_STYLE}
        data-name="Creation Create Route"
      >
        <CreationCreateTabPage
          embedded
          onClose={() => onClose?.()}
          onRequestPrimaryTab={handlePrimaryTabChange}
          bottomChromeInsetCss={tabBarBottomCss}
        />
      </ThemeScope>
    );
  } else if (creationScreen === "live") {
    content = (
      <ThemeScope
        mode={createRegionTheme}
        className={CREATION_PAGE_ROUTE_ROOT_CLASS}
        style={CREATION_PAGE_ROUTE_ROOT_STYLE}
        data-name="Creation Live Route"
      >
        <CreationLiveTabPage
          embedded
          onClose={() => onClose?.()}
          onRequestPrimaryTab={handlePrimaryTabChange}
          bottomChromeInsetCss={tabBarBottomCss}
        />
      </ThemeScope>
    );
  } else {
    content = (
      <CameraStudioContent
        isTabActive={isTabActive}
        onClose={onClose}
        onPhotoCaptured={onOpenEditPhoto}
        onVideoCaptured={onOpenEditVideo}
        onOpenTextToImage={onOpenTextToImage}
        onOpenAlbum={onOpenAlbum}
        onBottomChromeHiddenChange={setPrimaryTabHidden}
      />
    );
  }

  return (
    <CreationPrimaryTabShell
      active={primaryTab}
      surface="overlay"
      hidden={isStudio && primaryTabHidden}
      onChange={handlePrimaryTabChange}
      isTabActive={isTabActive}
    >
      {content}
    </CreationPrimaryTabShell>
  );
}

function CreationPage({ isTabActive = true, onClose }: CreationPageProps) {
  const { route, navigate } = useAppNavigation();
  const { resolvedTheme } = useTheme();
  const creationSub = route?.tab === "creation" ? route.sub : null;
  const creationScreen = creationSub?.screen ?? "studio";
  useTabAppChromeSurfaceTheme(
    isTabActive,
    creationScreen === "album"
      ? null
      : isCreationImmersiveDarkScreen(creationScreen)
        ? "dark"
        : resolvedTheme,
  );

  useEffect(() => {
    if (!isTabActive) {
      clearCreationCapturedPhoto();
    }
  }, [isTabActive]);

  const openEditPhoto = useCallback(
    (frame: string | null) => {
      setCreationCapturedPhoto(frame);
      navigate(
        appPathForRoute({ tab: "creation", sub: { screen: "edit-photo" } }),
      );
    },
    [navigate],
  );

  const openEditPhotoFromAlbum = useCallback(
    (photos: PhotoEditMediaItem[]) => {
      setAlbumEditPhotos(photos);
      navigate(
        appPathForRoute({ tab: "creation", sub: { screen: "edit-photo" } }),
      );
    },
    [navigate],
  );

  const openEditVideo = useCallback(
    (frame: string | null) => {
      setCreationCapturedPhoto(frame);
      navigate(
        appPathForRoute({ tab: "creation", sub: { screen: "edit-video" } }),
      );
    },
    [navigate],
  );

  const openTextToImage = useCallback(() => {
    navigate(creationSecondaryPaths.textToImage());
  }, [navigate]);

  const openAlbum = useCallback(() => {
    navigate(creationSecondaryPaths.album());
  }, [navigate]);

  if (creationScreen === "album") {
    return (
      <CreationAlbumRouteContent
        isTabActive={isTabActive}
        onClose={onClose}
        onPhotoCaptured={openEditPhoto}
        onVideoCaptured={openEditVideo}
        onOpenTextToImage={openTextToImage}
        onAlbumPhotosSelected={openEditPhotoFromAlbum}
        onBack={() => navigate(creationBackPathForSub({ screen: "album" }))}
      />
    );
  }

  if (creationScreen === "add-sound" && creationSub?.screen === "add-sound") {
    return (
      <CreationAddSoundContent
        origin={creationSub.origin}
        onBack={() => navigate(creationBackPathForSub(creationSub))}
      />
    );
  }

  if (creationScreen === "sound-search" && creationSub?.screen === "sound-search") {
    return (
      <CreationSoundSearchContent
        onBack={() => navigate(creationBackPathForSub(creationSub))}
        onDiscover={() => navigate(soundDiscoverPath(creationSub.origin))}
      />
    );
  }

  if (creationScreen === "sound-discover" && creationSub?.screen === "sound-discover") {
    return (
      <CreationSoundDiscoverContent
        onBack={() => navigate(creationBackPathForSub(creationSub))}
        onSearchTap={() => navigate(soundSearchPath(creationSub.origin))}
      />
    );
  }

  if (creationScreen === "edit-photo") {
    return (
      <CreationEditPhotoContent
        onBack={() => {
          clearCreationCapturedPhoto();
          navigate(creationBackPathForSub({ screen: "edit-photo" }));
        }}
      />
    );
  }

  if (creationScreen === "edit-video") {
    return (
      <CreationEditVideoContent
        onBack={() => {
          clearCreationCapturedPhoto();
          navigate(creationBackPathForSub({ screen: "edit-video" }));
        }}
      />
    );
  }

  if (creationScreen === "text-to-image") {
    return (
      <CreationTextToImageContent
        onBack={() => navigate(creationBackPathForSub({ screen: "text-to-image" }))}
      />
    );
  }

  if (creationScreen === "text-to-image-templates") {
    return (
      <CreationTextToImageTemplatesContent
        onBack={() =>
          navigate(creationBackPathForSub({ screen: "text-to-image-templates" }))
        }
      />
    );
  }

  if (creationScreen === "publish" || creationScreen === "preview") {
    return (
      <PostPublishFlow
        initialScreen={creationScreen === "preview" ? "preview" : "publish"}
      />
    );
  }

  if (creationScreen === "playable") {
    return <ThemeScope mode="dark" className={CREATION_PAGE_ROUTE_ROOT_CLASS} style={CREATION_PAGE_ROUTE_ROOT_STYLE}>
      <CreationPlayablePage isTabActive={isTabActive} onClose={() => navigate(creationSecondaryPaths.studio())} />
    </ThemeScope>;
  }

  const primaryTabScreen: CreationPrimaryTabScreen =
    creationScreen === "create"
      ? "create"
      : creationScreen === "live"
        ? "live"
        : "studio";

  return (
    <CreationPrimaryTabFlow
      creationScreen={primaryTabScreen}
      isTabActive={isTabActive}
      onClose={onClose}
      onOpenEditPhoto={openEditPhoto}
      onOpenEditVideo={openEditVideo}
      onOpenTextToImage={openTextToImage}
      onOpenAlbum={openAlbum}
      navigate={navigate}
    />
  );
}

export type CreationPageProps = {
  /** Creation tab is visible — release the camera when false. */
  isTabActive?: boolean;
  /** Leave Creation (e.g. back to Home or the tab/route before camera). */
  onClose?: () => void;
};

export default CreationPage;
