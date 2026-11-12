import {
  getColorCSSVar,
  getShadowCSSVar,
  TUXButton,
  TUXCheckbox,
  TUXNavBar,
  TUXSheet,
  TUXTabBar,
  TUXText,
} from "@byted-tiktok/tux-web";
import {
  IconAutoCutClapperboardSmall,
  IconChevronDownFill,
  IconLivePhoto,
  IconPenStar,
  IconXMark,
} from "@byted-tiktok/tux-icons";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type Ref,
  type RefObject,
} from "react";
import { ThemeScope, useTheme } from "../../context/theme";
import { AppNavBarBackButton } from "../../components/sys/app_nav_bar_back_button";
import { AppNavBarCloseButton } from "../../components/sys/app_nav_bar_close_button";
import {
  useAppFrame,
  useRegisterHomeIndicatorSurfaceTheme,
  useRegisterStatusBarSurfaceTheme,
} from "../../components/sys/app_frame";
import { useSoftKeyboard } from "../../components/sys/soft_keyboard";
import {
  CREATION_ALBUM_SHEET_SURFACE,
  CREATION_ALBUM_STATUS_BAR_THEME,
  CREATION_CAMERA_SHEET_OVERLAY,
  creationAlbumSheetSurfaceStyle,
  resolveCreationSheetFrameRoot,
} from "./creation_sheet_chrome";
import { appFrameSheetChromeProps } from "../../components/sys/app_frame_sheet_chrome";
import { motion, useReducedMotion } from "framer-motion";
import {
  ALBUM_THUMBNAIL_ZOOM_IN_DURATION_MS,
  ALBUM_THUMBNAIL_ZOOM_IN_EASE,
  ALBUM_THUMBNAIL_ZOOM_IN_MOTION_EASE,
  rectToLaunchFrom,
  type AlbumThumbnailLaunchFrom,
} from "./album_thumbnail_launch_motion";
import {
  CREATION_BOTTOM_CTA_BUTTON_HEIGHT,
  CREATION_BOTTOM_CTA_HORIZONTAL_PADDING_PX,
  CREATION_BOTTOM_CTA_ROW_HEIGHT_PX,
  CreationBottomCtaRow,
  CreationBottomCtaShell,
  CreationBottomCtaSlot,
} from "./components/creation_bottom_cta";
import { AlbumPreviewPhotoMotion } from "./components/album_preview_photo_motion";
import { AlbumPreviewSelectionControl } from "./components/album_preview_selection_control";
import {
  CREATION_ALBUM_GRID_TILE_ATTR,
  CREATION_ALBUM_THUMBNAIL_SRC_ATTR,
  CreationAlbumPreviewLayer,
  type AlbumPreviewCanvasMotion,
} from "./creation_album_preview_layer";
import { useHorizontalSwipeNavGesture } from "./hooks/use_horizontal_swipe_nav_gesture";

export type AlbumPickerConfirmItem = {
  id: string;
  src: string;
};

export type CreationAlbumPickerProps = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  /** App-frame root so the sheet covers the full phone frame on desktop. */
  root?: HTMLElement | null;
  /** Tap "Text" — close picker then open text-to-image (camera POST flow). */
  onOpenText?: () => void;
  /** Next — enter Photo edit with one slide per selected tile. */
  onConfirmSelection?: (items: AlbumPickerConfirmItem[]) => void;
};

const ALBUM_TABS = ["All", "Videos", "Photos", "Live Photos"] as const;

/** TUX Shadow/Contrast — legibility for text on video/images. */
const ALBUM_MEDIA_DURATION_TEXT_STYLE = {
  color: getColorCSSVar("UIImageOverlayWhite"),
  textShadow: getShadowCSSVar("Contrast"),
} as const;

type AlbumTab = (typeof ALBUM_TABS)[number];

const ALBUM_TAB_ITEMS = ALBUM_TABS.map((tab) => ({ itemKey: tab, title: tab }));

/** Mock capture time (ms); album grid sorts ascending = oldest at top, newest at bottom (camera roll). */
const ALBUM_CAPTURED_AT_BASE_MS = 1_704_000_000_000;
const ALBUM_CAPTURED_AT_DAY_MS = 86_400_000;

const ALBUM_MEDIA = [
  {
    id: "court",
    type: "livePhoto",
    src: "/resource/video_mock/people_outdoor/cover-02.jpg",
    capturedAt: ALBUM_CAPTURED_AT_BASE_MS + ALBUM_CAPTURED_AT_DAY_MS * 14,
  },
  {
    id: "market",
    type: "photo",
    src: "/resource/video_mock/empty_shots/cover-28.jpg",
    capturedAt: ALBUM_CAPTURED_AT_BASE_MS + ALBUM_CAPTURED_AT_DAY_MS * 13,
  },
  {
    id: "station",
    type: "photo",
    src: "/resource/video_mock/people_outdoor/cover-09.jpg",
    capturedAt: ALBUM_CAPTURED_AT_BASE_MS + ALBUM_CAPTURED_AT_DAY_MS * 12,
  },
  {
    id: "food",
    type: "livePhoto",
    src: "/resource/video_mock/food_closeups/13-thai-berry-ice-cream-thumbnail.jpg",
    capturedAt: ALBUM_CAPTURED_AT_BASE_MS + ALBUM_CAPTURED_AT_DAY_MS * 11,
  },
  {
    id: "note",
    type: "photo",
    src: "/resource/video_mock/people_outdoor/cover-10.jpg",
    capturedAt: ALBUM_CAPTURED_AT_BASE_MS + ALBUM_CAPTURED_AT_DAY_MS * 10,
  },
  {
    id: "bakery",
    type: "photo",
    src: "/resource/video_mock/food_closeups/08-berries-thumbnail.jpg",
    capturedAt: ALBUM_CAPTURED_AT_BASE_MS + ALBUM_CAPTURED_AT_DAY_MS * 9,
  },
  {
    id: "road",
    type: "video",
    src: "/resource/video_mock/empty_shots/cover-26.jpg",
    duration: "0:07",
    capturedAt: ALBUM_CAPTURED_AT_BASE_MS + ALBUM_CAPTURED_AT_DAY_MS * 8,
  },
  {
    id: "blossom",
    type: "photo",
    src: "/resource/video_mock/empty_shots/17-sun-shining-on-the-leaves-thumbnail.jpg",
    capturedAt: ALBUM_CAPTURED_AT_BASE_MS + ALBUM_CAPTURED_AT_DAY_MS * 7,
  },
  {
    id: "denim",
    type: "photo",
    src: "/resource/video_mock/people_outdoor/02-a-girl-spends-time-at-an-outdoor-caf-thumbnail.jpg",
    capturedAt: ALBUM_CAPTURED_AT_BASE_MS + ALBUM_CAPTURED_AT_DAY_MS * 6,
  },
  {
    id: "snack",
    type: "video",
    src: "/resource/video_mock/food_closeups/10-blueberries-and-strawberries-thumbnail.jpg",
    duration: "0:08",
    capturedAt: ALBUM_CAPTURED_AT_BASE_MS + ALBUM_CAPTURED_AT_DAY_MS * 5,
  },
  {
    id: "friends",
    type: "livePhoto",
    src: "/resource/video_mock/ai-portrait/thailand-hero-61eb5c.png",
    capturedAt: ALBUM_CAPTURED_AT_BASE_MS + ALBUM_CAPTURED_AT_DAY_MS * 4,
  },
  {
    id: "portrait",
    type: "photo",
    src: "/resource/figma_covers/cover-04.png",
    capturedAt: ALBUM_CAPTURED_AT_BASE_MS + ALBUM_CAPTURED_AT_DAY_MS * 3,
  },
  {
    id: "selfie",
    type: "video",
    src: "/resource/video_mock/people_indoor/05-a-girl-searching-on-the-nft-marketplace--thumbnail.jpg",
    duration: "0:09",
    capturedAt: ALBUM_CAPTURED_AT_BASE_MS + ALBUM_CAPTURED_AT_DAY_MS * 2,
  },
  {
    id: "clothes",
    type: "video",
    src: "/resource/video_mock/people_outdoor/cover-13.jpg",
    duration: "0:09",
    capturedAt: ALBUM_CAPTURED_AT_BASE_MS + ALBUM_CAPTURED_AT_DAY_MS * 1,
  },
  {
    id: "waves",
    type: "photo",
    src: "/resource/video_mock/empty_shots/01-waves-crashing-near-the-coast-thumbnail.jpg",
    capturedAt: ALBUM_CAPTURED_AT_BASE_MS,
  },
  {
    id: "sunset",
    type: "photo",
    src: "/resource/video_mock/empty_shots/cover-27.jpg",
    capturedAt: ALBUM_CAPTURED_AT_BASE_MS + ALBUM_CAPTURED_AT_DAY_MS * 15,
  },
  {
    id: "cafe",
    type: "livePhoto",
    src: "/resource/video_mock/people_outdoor/cover-11.jpg",
    capturedAt: ALBUM_CAPTURED_AT_BASE_MS + ALBUM_CAPTURED_AT_DAY_MS * 17,
  },
] as const;
type AlbumMediaItem = (typeof ALBUM_MEDIA)[number];
type AlbumMediaId = AlbumMediaItem["id"];

/** iOS-style album folders shown when the Recents header control is expanded (Figma 607:20164). */
const ALBUM_SOURCES = [
  {
    id: "recents",
    label: "Recents",
    count: 1526,
    thumbnail: "/resource/video_mock/people_outdoor/cover-02.jpg",
  },
  {
    id: "panoramas",
    label: "Panoramas",
    count: 624,
    thumbnail: "/resource/video_mock/empty_shots/cover-28.jpg",
  },
  {
    id: "videos",
    label: "Videos",
    count: 814,
    thumbnail: "/resource/video_mock/people_outdoor/cover-09.jpg",
  },
  {
    id: "favorites",
    label: "Favorites",
    count: 108,
    thumbnail: "/resource/video_mock/food_closeups/13-thai-berry-ice-cream-thumbnail.jpg",
  },
  {
    id: "timelapse",
    label: "Time-lapse",
    count: 77,
    thumbnail: "/resource/video_mock/food_closeups/08-berries-thumbnail.jpg",
  },
  {
    id: "bursts",
    label: "Bursts",
    count: 88,
    thumbnail: "/resource/video_mock/empty_shots/cover-26.jpg",
  },
  {
    id: "slomo",
    label: "Slo-mo",
    count: 7,
    thumbnail:
      "/resource/video_mock/empty_shots/17-sun-shining-on-the-leaves-thumbnail.jpg",
  },
  {
    id: "long-name",
    label: "blablablablablablablablablablablablablablabla",
    count: 8,
    thumbnail:
      "/resource/video_mock/people_outdoor/02-a-girl-spends-time-at-an-outdoor-caf-thumbnail.jpg",
  },
  {
    id: "hahaha",
    label: "Hahaha",
    count: 8,
    thumbnail: "/resource/figma/creation-preview-3ad4e2.png",
  },
] as const;
type AlbumSourceId = (typeof ALBUM_SOURCES)[number]["id"];


/**
 * Album picker footer geometry (Figma 600:19377).
 * Gallery multi-select: use-layout (36px) + thumb strip (78px) + gap (12px) + CTA (48px) + home (34px).
 * Preview multi-select: thumb strip (78px) + gap (12px) + CTA (48px) + home (34px) (no use-layout row).
 * Default sheet: action row (60px) + home (34px) = 94px.
 *
 * Grid scroll padding reserves space for the pinned footer (content rows + AppFrame bottom inset).
 */
const ALBUM_FOOTER_GRID_PADDING_DEFAULT =
  "calc(60px + var(--app-frame-bottom-inset))";
/** 已选缩略图条 / 预览图 与底部 CTA 按钮之间的间距（不是按钮下方）。 */
const ALBUM_FOOTER_THUMB_TO_CTA_GAP_PX = 12;
const ALBUM_FOOTER_THUMB_STRIP_HEIGHT_PX = 78;

const ALBUM_FOOTER_GRID_PADDING_WITH_SELECTION =
  `calc(${36 + ALBUM_FOOTER_THUMB_STRIP_HEIGHT_PX + ALBUM_FOOTER_THUMB_TO_CTA_GAP_PX + CREATION_BOTTOM_CTA_ROW_HEIGHT_PX}px + var(--app-frame-bottom-inset))`;
/** Figma Layout 600:19378 — pt 12, px 12, inner 24×24 control + label, gap 6 → 36px row. */
const ALBUM_FOOTER_SIDE_PAD_STYLE = {
  paddingLeft: CREATION_BOTTOM_CTA_HORIZONTAL_PADDING_PX,
  paddingRight: CREATION_BOTTOM_CTA_HORIZONTAL_PADDING_PX,
} as const;
const ALBUM_FOOTER_USE_LAYOUT_ROW_CLASS = "flex shrink-0 items-center pt-3";
const ALBUM_FOOTER_USE_LAYOUT_CONTROL_CLASS = "flex h-6 items-center gap-1.5";
/** Figma Selected media 600:19379 — h 78, pt 12, pb 2, px 12, thumb gap 12. */
const ALBUM_FOOTER_THUMB_STRIP_CLASS =
  "h-[78px] w-full min-w-0 max-w-full select-none overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x hide-scrollbar pb-0.5 pt-3";
const ALBUM_FOOTER_THUMB_ROW_CLASS =
  "flex h-full w-max flex-nowrap items-center gap-3 [&_img]:pointer-events-none";
const ALBUM_FOOTER_ACTION_ROW_CLASS =
  "flex h-[60px] shrink-0 items-center pb-1 pt-3";
const ALBUM_FOOTER_DEFAULT_ROW_CLASS = `${ALBUM_FOOTER_ACTION_ROW_CLASS} justify-between`;
const ALBUM_FOOTER_BOTTOM_INSET_CSS = "var(--app-frame-bottom-inset)";

/** Home indicator / safe-area below album chrome — separate from the 60px action rows. */
function AlbumFooterHomeInset() {
  return (
    <div
      className="shrink-0"
      style={{ height: "var(--app-frame-bottom-inset)" }}
      aria-hidden
    />
  );
}

/** Camera roll: oldest at top, newest at bottom — open scrolled to the newest row. */
function scrollAlbumGridToBottom(el: HTMLElement) {
  el.scrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
}

export default function CreationAlbumPicker({
  visible,
  onVisibleChange,
  root,
  onOpenText,
  onConfirmSelection,
}: CreationAlbumPickerProps) {
  const { resolvedTheme } = useTheme();
  const { topInsetCss } = useAppFrame();
  const albumGridScrollRef = useRef<HTMLDivElement>(null);
  const [frameRoot, setFrameRoot] = useState<HTMLElement | null>(root ?? null);
  const { isOpen: keyboardOpen, close: closeSoftKeyboard } = useSoftKeyboard();
  // Sheet body follows app light/dark; status bar stays dark over the camera peek.
  useRegisterStatusBarSurfaceTheme(visible ? CREATION_ALBUM_STATUS_BAR_THEME : null);
  useRegisterHomeIndicatorSurfaceTheme(visible ? resolvedTheme : null);
  const [activeAlbumTab, setActiveAlbumTab] = useState<AlbumTab>("All");
  const [selectedMediaIds, setSelectedMediaIds] = useState<AlbumMediaId[]>([]);
  const [previewMediaId, setPreviewMediaId] = useState<AlbumMediaId | null>(null);
  const [previewLaunchFrom, setPreviewLaunchFrom] =
    useState<AlbumThumbnailLaunchFrom | null>(null);
  const [multiSelectEnabled, setMultiSelectEnabled] = useState(true);
  const [useLayoutEnabled, setUseLayoutEnabled] = useState(false);
  const [albumSourcePickerOpen, setAlbumSourcePickerOpen] = useState(false);
  const [selectedAlbumSourceId, setSelectedAlbumSourceId] =
    useState<AlbumSourceId>("recents");
  const selectedAlbumSource =
    ALBUM_SOURCES.find((source) => source.id === selectedAlbumSourceId) ??
    ALBUM_SOURCES[0];
  const visibleMedia = sortAlbumMediaAscending(
    ALBUM_MEDIA.filter((item) => mediaMatchesAlbumTab(item.type, activeAlbumTab)),
  );
  const selectedMedia = selectedMediaIds.flatMap((id) => {
    const match = ALBUM_MEDIA.find((item) => item.id === id);
    return match ? [match] : [];
  });

  const toggleMediaSelection = (id: AlbumMediaId) => {
    closeSoftKeyboard();
    setSelectedMediaIds((current) =>
      current.includes(id)
        ? current.filter((mediaId) => mediaId !== id)
        : [...current, id],
    );
  };

  const removeMediaSelection = (id: AlbumMediaId) => {
    setSelectedMediaIds((current) => current.filter((mediaId) => mediaId !== id));
  };

  const confirmAlbumSelection = useCallback(
    (items: AlbumMediaItem[]) => {
      if (items.length === 0) return;
      onConfirmSelection?.(
        items.map((item) => ({
          id: item.id,
          src: item.src,
        })),
      );
    },
    [onConfirmSelection],
  );

  const toggleMultiSelect = () => {
    setMultiSelectEnabled((enabled) => {
      if (enabled) setSelectedMediaIds([]);
      return !enabled;
    });
  };

  const toggleUseLayout = () => {
    setUseLayoutEnabled((enabled) => !enabled);
  };

  /** Reserve max footer height while multi-select is on — avoids scrollport resize on first pick. */
  const albumGridUsesExpandedFooterPadding = multiSelectEnabled;
  const albumGridPaddingModeRef = useRef(albumGridUsesExpandedFooterPadding);
  const albumScrollTopBeforePaddingRef = useRef(0);
  /** Bumps when selection footer padding changes — cancels stale scroll-to-bottom rAF. */
  const albumScrollToBottomGenRef = useRef(0);
  const albumInitialScrollDoneRef = useRef(false);
  const albumLastScrolledTabRef = useRef<AlbumTab | null>(null);

  if (albumGridPaddingModeRef.current !== albumGridUsesExpandedFooterPadding) {
    albumScrollToBottomGenRef.current += 1;
    const el = albumGridScrollRef.current;
    if (el) albumScrollTopBeforePaddingRef.current = el.scrollTop;
  }

  useEffect(() => {
    setFrameRoot(resolveCreationSheetFrameRoot(root));
  }, [root]);

  useEffect(() => {
    if (visible && keyboardOpen) closeSoftKeyboard();
  }, [visible, keyboardOpen, closeSoftKeyboard]);

  useLayoutEffect(() => {
    if (!visible || albumSourcePickerOpen) return;
    const el = albumGridScrollRef.current;
    if (!el) return;

    if (albumGridPaddingModeRef.current !== albumGridUsesExpandedFooterPadding) {
      el.scrollTop = albumScrollTopBeforePaddingRef.current;
      const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
      if (el.scrollTop > maxScroll) el.scrollTop = maxScroll;
      albumGridPaddingModeRef.current = albumGridUsesExpandedFooterPadding;
    }
  }, [visible, albumSourcePickerOpen, albumGridUsesExpandedFooterPadding]);

  useLayoutEffect(() => {
    if (!visible || albumSourcePickerOpen) return;
    const el = albumGridScrollRef.current;
    if (!el) return;

    const shouldScrollForOpen = !albumInitialScrollDoneRef.current;
    const shouldScrollForTab = albumLastScrolledTabRef.current !== activeAlbumTab;
    if (!shouldScrollForOpen && !shouldScrollForTab) return;

    if (shouldScrollForOpen) albumInitialScrollDoneRef.current = true;
    albumLastScrolledTabRef.current = activeAlbumTab;

    const generation = (albumScrollToBottomGenRef.current += 1);
    scrollAlbumGridToBottom(el);
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (albumScrollToBottomGenRef.current !== generation) return;
        scrollAlbumGridToBottom(el);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [visible, albumSourcePickerOpen, activeAlbumTab]);

  useEffect(() => {
    if (!albumSourcePickerOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAlbumSourcePickerOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [albumSourcePickerOpen]);

  const handleVisibleChange = (next: boolean) => {
    if (!next && albumSourcePickerOpen) {
      setAlbumSourcePickerOpen(false);
      return;
    }
    if (!next) {
      setAlbumSourcePickerOpen(false);
      setPreviewMediaId(null);
      albumInitialScrollDoneRef.current = false;
      albumLastScrolledTabRef.current = null;
    }
    onVisibleChange(next);
  };

  const toggleAlbumSourcePicker = () => {
    setAlbumSourcePickerOpen((open) => !open);
  };

  const selectAlbumSource = (sourceId: AlbumSourceId) => {
    setSelectedAlbumSourceId(sourceId);
    setAlbumSourcePickerOpen(false);
  };

  const previewItem = previewMediaId
    ? (ALBUM_MEDIA.find((item) => item.id === previewMediaId) ?? null)
    : null;
  const previewIndex =
    previewMediaId !== null
      ? visibleMedia.findIndex((item) => item.id === previewMediaId)
      : -1;

  const goToPreviewAtIndex = (index: number) => {
    const nextItem = visibleMedia[index];
    if (nextItem) setPreviewMediaId(nextItem.id);
  };

  const previewSelectedOrder =
    previewItem !== null ? selectedMediaIds.indexOf(previewItem.id) : -1;
  const canSwipeToNext =
    previewIndex >= 0 && previewIndex < visibleMedia.length - 1;
  const canSwipeToPrev = previewIndex > 0;

  const openAlbumPreview = useCallback((id: AlbumMediaId, fromRect: DOMRectReadOnly) => {
    setPreviewLaunchFrom(rectToLaunchFrom(fromRect));
    setPreviewMediaId(id);
  }, []);

  const closeAlbumPreview = useCallback(() => {
    setPreviewMediaId(null);
    setPreviewLaunchFrom(null);
  }, []);

  return (
    <TUXSheet
      visible={visible}
      onVisibleChange={handleVisibleChange}
      root={frameRoot}
      position="bottom"
      {...appFrameSheetChromeProps()}
      heightModePreset="fixed"
      height={`calc(100% - ${topInsetCss})`}
      closeOnOutsideClick
      dragHandle="hidden"
      draggable={false}
      overlayBackgroundColor={CREATION_CAMERA_SHEET_OVERLAY}
      sheetBackgroundColor={CREATION_ALBUM_SHEET_SURFACE}
      testId="creation-album-sheet"
    >
      <ThemeScope
        mode={resolvedTheme}
        className="relative flex flex-col bg-tux-v2-ui-sheet-flat-1 w-full h-full min-h-0 overflow-hidden text-tux-v2-ui-text-1"
        style={creationAlbumSheetSurfaceStyle}
        data-softkb-keep-open
      >
        <>
            {previewMediaId === null ? (
            <TUXNavBar
              heightPreset={52}
              showSeparator={false}
              backgroundColor={CREATION_ALBUM_SHEET_SURFACE}
              leading={
                <div className="flex h-11 items-center">
                  <AppNavBarCloseButton
                    iconColor={getColorCSSVar("UIText1")}
                    onClose={() => handleVisibleChange(false)}
                  />
                </div>
              }
              customTitle={
                <TUXButton
                  text={selectedAlbumSource.label}
                  smoothRadius
                  aria-expanded={albumSourcePickerOpen}
                  aria-haspopup="listbox"
                  aria-label={`${selectedAlbumSource.label}, ${selectedAlbumSource.count} items`}
                  themePreset="secondary"
                  shapePreset="capsule"
                  sizePreset="small"
                  maxWidth="200px"
                  trailingIcon={
                    <IconChevronDownFill
                      width={16}
                      height={16}
                      className={`shrink-0 text-tux-v2-ui-text-1 transition-transform duration-200 ${
                        albumSourcePickerOpen ? "rotate-180" : ""
                      }`}
                    />
                  }
                  onClick={toggleAlbumSourcePicker}
                />
              }
              trailing={
                <TUXButton
                  text="Text"
                  smoothRadius
                  themePreset="secondary"
                  shapePreset="capsule"
                  sizePreset="small"
                  leadingIcon={<IconPenStar width={14} height={14} className="text-tux-v2-ui-text-1" />}
                  onClick={() => {
                    handleVisibleChange(false);
                    onOpenText?.();
                  }}
                />
              }
            />
            ) : (
              // Keep grid from jumping when preview replaces the nav — launch rect stays aligned.
              <div className="w-full h-[52px] shrink-0" aria-hidden />
            )}

            {albumSourcePickerOpen ? (
              <div
                className="flex-1 bg-tux-v2-ui-sheet-flat-1 pb-3 min-h-0 overflow-x-hidden overflow-y-auto overscroll-y-contain touch-pan-y hide-scrollbar"
                role="listbox"
                aria-label="Albums"
              >
                {ALBUM_SOURCES.map((source) => (
                  <AlbumSourceRow
                    key={source.id}
                    source={source}
                    selected={source.id === selectedAlbumSourceId}
                    onSelect={() => selectAlbumSource(source.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                {previewMediaId === null ? (
                  <div className="w-full shrink-0">
                    <TUXTabBar
                      items={ALBUM_TAB_ITEMS}
                      activeKey={activeAlbumTab}
                      onChange={(key) => setActiveAlbumTab(key as AlbumTab)}
                      fitContent
                      fixedSpacing
                      showFadingEdge={false}
                    />
                  </div>
                ) : null}

                <div className="relative flex-1 min-h-0">
                  <div
                    ref={albumGridScrollRef}
                    className="z-0 isolate absolute inset-0 bg-tux-v2-ui-sheet-flat-1 overflow-x-hidden overflow-y-auto overscroll-y-contain touch-pan-y hide-scrollbar"
                    style={{
                      overflowAnchor: "none",
                      scrollbarGutter: "stable",
                      paddingBottom: albumGridUsesExpandedFooterPadding
                        ? ALBUM_FOOTER_GRID_PADDING_WITH_SELECTION
                        : ALBUM_FOOTER_GRID_PADDING_DEFAULT,
                      visibility: previewMediaId ? "hidden" : "visible",
                    }}
                  >
                    <div className="gap-[1.5px] grid grid-cols-3">
                      {visibleMedia.map((item) => {
                        const selectedIndex = selectedMediaIds.indexOf(item.id);

                        return (
                          <AlbumMediaTile
                            key={item.id}
                            item={item}
                            showSelection={multiSelectEnabled}
                            selectedOrder={
                              multiSelectEnabled && selectedIndex !== -1
                                ? selectedIndex + 1
                                : null
                            }
                            onOpenPreview={(fromRect) => openAlbumPreview(item.id, fromRect)}
                            onToggleSelection={() => toggleMediaSelection(item.id)}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div
                    className="bottom-0 z-30 absolute inset-x-0 bg-tux-v2-ui-sheet-flat-1 pointer-events-none"
                    style={{ visibility: previewMediaId ? "hidden" : "visible" }}
                  >
                    <div className="pointer-events-auto">
                      {multiSelectEnabled && selectedMedia.length > 0 ? (
                        <SelectedAlbumActions
                          selectedMedia={selectedMedia}
                          onRemove={removeMediaSelection}
                          onOpenPreview={(id, fromRect) => openAlbumPreview(id, fromRect)}
                          onNext={() => confirmAlbumSelection(selectedMedia)}
                          useLayoutEnabled={useLayoutEnabled}
                          onToggleUseLayout={toggleUseLayout}
                        />
                      ) : (
                        <DefaultAlbumActions
                          multiSelectEnabled={multiSelectEnabled}
                          onToggleMultiSelect={toggleMultiSelect}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          <CreationAlbumPreviewLayer
            activeSrc={previewItem?.src ?? null}
            launchFrom={previewLaunchFrom}
          >
            {({
              displaySrc,
              canvasRef,
              previewChromeVisible,
              previewChromeOpacity,
              previewBackdropOpacity,
              previewFadeDurationMs,
              photoVisible,
              previewEnterAnimating,
              photoLayoutExpanded,
              canvasAlbumMotion,
            }) => {
              const layerItem =
                ALBUM_MEDIA.find((media) => media.src === displaySrc) ?? null;
              if (!layerItem) return null;

              return (
                <AlbumUploadPreviewPage
                  item={layerItem}
                  previewPosition={
                    previewIndex >= 0
                      ? { index: previewIndex + 1, total: visibleMedia.length }
                      : null
                  }
                  selectedMedia={selectedMedia}
                  selectedOrder={
                    previewSelectedOrder === -1 ? null : previewSelectedOrder + 1
                  }
                  onBack={closeAlbumPreview}
                  onToggleSelection={() => toggleMediaSelection(layerItem.id)}
                  onRemove={removeMediaSelection}
                  onOpenPreview={openAlbumPreview}
                  canSwipeToNext={canSwipeToNext}
                  canSwipeToPrev={canSwipeToPrev}
                  onSwipeToNext={() => {
                    if (canSwipeToNext) goToPreviewAtIndex(previewIndex + 1);
                  }}
                  onSwipeToPrev={() => {
                    if (canSwipeToPrev) goToPreviewAtIndex(previewIndex - 1);
                  }}
                  canvasRef={canvasRef}
                  previewChromeVisible={previewChromeVisible}
                  previewChromeOpacity={previewChromeOpacity}
                  previewBackdropOpacity={previewBackdropOpacity}
                  previewFadeDurationMs={previewFadeDurationMs}
                  photoVisible={photoVisible}
                  previewEnterAnimating={previewEnterAnimating}
                  photoLayoutExpanded={photoLayoutExpanded}
                  launchFrom={previewLaunchFrom}
                  canvasAlbumMotion={canvasAlbumMotion}
                  onNext={() =>
                    confirmAlbumSelection(
                      selectedMedia.length > 0 ? selectedMedia : [layerItem],
                    )
                  }
                />
              );
            }}
          </CreationAlbumPreviewLayer>
        </>
      </ThemeScope>
    </TUXSheet>
  );
}

/** Preview photo sits between nav + footer — chrome stays on page surface, not on the image. */
const ALBUM_PREVIEW_NAV_HEIGHT_PX = 52;
const ALBUM_PREVIEW_NAV_ICON_SHADOW = "drop-shadow(0 1px 3px rgba(0, 0, 0, 0.45))";
function albumPreviewFooterInsetCss(hasThumbStrip: boolean) {
  const ctaBlockPx =
    ALBUM_FOOTER_THUMB_TO_CTA_GAP_PX + CREATION_BOTTOM_CTA_ROW_HEIGHT_PX;
  return hasThumbStrip
    ? `calc(${ALBUM_FOOTER_THUMB_STRIP_HEIGHT_PX + ctaBlockPx}px + var(--app-frame-bottom-inset))`
    : `calc(${ctaBlockPx}px + var(--app-frame-bottom-inset))`;
}

function AlbumUploadPreviewPage({
  item,
  previewPosition,
  selectedMedia,
  selectedOrder,
  onBack,
  onToggleSelection,
  onRemove,
  onOpenPreview,
  canSwipeToNext,
  canSwipeToPrev,
  onSwipeToNext,
  onSwipeToPrev,
  canvasRef,
  previewChromeVisible,
  previewChromeOpacity,
  previewBackdropOpacity,
  previewFadeDurationMs,
  photoVisible,
  previewEnterAnimating,
  photoLayoutExpanded,
  launchFrom,
  canvasAlbumMotion,
  onNext,
}: {
  item: AlbumMediaItem;
  previewPosition: { index: number; total: number } | null;
  selectedMedia: AlbumMediaItem[];
  selectedOrder: number | null;
  onBack: () => void;
  onToggleSelection: () => void;
  onRemove: (id: AlbumMediaId) => void;
  onOpenPreview: (id: AlbumMediaId, fromRect: DOMRectReadOnly) => void;
  canSwipeToNext: boolean;
  canSwipeToPrev: boolean;
  onSwipeToNext: () => void;
  onSwipeToPrev: () => void;
  canvasRef: RefObject<HTMLDivElement | null>;
  previewChromeVisible: boolean;
  previewChromeOpacity: number;
  previewBackdropOpacity: number;
  previewFadeDurationMs: number;
  photoVisible: boolean;
  previewEnterAnimating: boolean;
  photoLayoutExpanded: boolean;
  launchFrom: AlbumThumbnailLaunchFrom | null;
  canvasAlbumMotion?: AlbumPreviewCanvasMotion;
  onNext?: () => void;
}) {
  const reduceMotion = useReducedMotion();

  const swipeNav = useHorizontalSwipeNavGesture({
    enabled: canSwipeToNext || canSwipeToPrev,
    onSwipeLeft: canSwipeToNext ? onSwipeToNext : undefined,
    onSwipeRight: canSwipeToPrev ? onSwipeToPrev : undefined,
  });

  const hasThumbStrip = selectedMedia.length > 0;
  const previewCanvasBottom = albumPreviewFooterInsetCss(hasThumbStrip);

  const chromeFadeTransition = {
    duration: reduceMotion ? 0 : previewFadeDurationMs / 1000,
    ease: ALBUM_THUMBNAIL_ZOOM_IN_MOTION_EASE,
  };
  const canvasInsetTransitionCss = reduceMotion
    ? undefined
    : `bottom ${ALBUM_THUMBNAIL_ZOOM_IN_DURATION_MS}ms ${ALBUM_THUMBNAIL_ZOOM_IN_EASE}`;

  return (
    <div className="relative w-full h-full min-h-0 overflow-hidden">
      {/* Full-bleed page surface — visible under nav + footer chrome, not only the photo canvas. */}
      <motion.div
        aria-hidden
        className="top-0 right-0 bottom-0 left-0 z-0 absolute bg-tux-v2-ui-page-flat-1 pointer-events-none"
        animate={{ opacity: previewBackdropOpacity }}
        transition={chromeFadeTransition}
      />

      <div
        ref={canvasRef as Ref<HTMLDivElement>}
        className="z-10 absolute inset-x-0 bg-tux-v2-ui-page-flat-1 overflow-hidden"
        style={{
          top: ALBUM_PREVIEW_NAV_HEIGHT_PX,
          left: 0,
          right: 0,
          bottom: previewCanvasBottom,
          opacity: photoVisible ? 1 : 0,
          transition: canvasInsetTransitionCss,
          ...(canvasAlbumMotion
            ? {
                transform: canvasAlbumMotion.entered
                  ? canvasAlbumMotion.expanded
                  : canvasAlbumMotion.collapsed,
                transformOrigin: `${canvasAlbumMotion.originX}px ${canvasAlbumMotion.originY}px`,
                transition: canvasAlbumMotion.motionAnimating
                  ? `transform ${canvasAlbumMotion.duration}ms ${canvasAlbumMotion.ease}`
                  : canvasInsetTransitionCss,
                willChange: "transform",
              }
            : undefined),
        }}
      >
        <AlbumPreviewPhotoMotion
          src={item.src}
          visible={photoVisible}
          canvasRef={canvasRef}
          launchFrom={launchFrom}
          previewEnterAnimating={previewEnterAnimating}
          photoLayoutExpanded={photoLayoutExpanded}
          exitCoverInCanvas={Boolean(canvasAlbumMotion)}
        />
      </div>

      <div
        className="absolute inset-x-0 touch-pan-y"
        style={{
          top: ALBUM_PREVIEW_NAV_HEIGHT_PX,
          left: 0,
          right: 0,
          bottom: previewCanvasBottom,
          transition: canvasInsetTransitionCss,
        }}
        aria-label={
          previewPosition
            ? `Preview ${previewPosition.index} of ${previewPosition.total}. Swipe horizontally to change item.`
            : "Album preview"
        }
        onPointerDown={swipeNav.handlePointerDown}
        onPointerUp={swipeNav.handlePointerUp}
        onPointerCancel={swipeNav.handlePointerCancel}
      />

      {previewChromeVisible ? (
        <motion.div
          className="z-20 absolute inset-0 pointer-events-none"
          animate={{ opacity: previewChromeOpacity }}
          transition={chromeFadeTransition}
        >
          <div
            className="absolute inset-x-0 top-0 z-20 flex h-[52px] items-center justify-between pl-1 pr-1 pointer-events-auto"
            data-name="Album preview chrome"
          >
            <AppNavBarBackButton
              onBack={() => onBack()}
              iconColor={getColorCSSVar("UIImageOverlayWhite")}
              style={{ filter: ALBUM_PREVIEW_NAV_ICON_SHADOW }}
            />
            <div className="flex items-center gap-1 pr-1">
              <span
                className="text-[13px] font-semibold leading-[1.3] text-tux-v2-ui-text-1"
                style={{ filter: ALBUM_PREVIEW_NAV_ICON_SHADOW }}
              >
                Selected
              </span>
              <AlbumPreviewSelectionControl
                selectedOrder={selectedOrder}
                onToggle={onToggleSelection}
              />
            </div>
          </div>

          <div
            data-no-preview-swipe
            className="bottom-0 absolute inset-x-0 pointer-events-auto"
          >
            <SelectedAlbumActions
              selectedMedia={selectedMedia}
              onRemove={onRemove}
              onOpenPreview={onOpenPreview}
              overlay
              showUseLayout={false}
              showThumbStrip={selectedMedia.length > 0}
              nextCount={selectedMedia.length > 0 ? selectedMedia.length : 1}
              onNext={onNext}
            />
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}

function AlbumSourceRow({
  source,
  selected,
  onSelect,
}: {
  source: (typeof ALBUM_SOURCES)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className="flex items-center gap-3 px-4 py-2 w-full h-[88px] text-left shrink-0"
    >
      <img
        src={source.thumbnail}
        alt=""
        className="size-[72px] shrink-0 rounded-(--tux-v2-radius-content-small) object-cover"
        draggable={false}
      />
      <div className="flex-1 min-w-0">
        <TUXText typographyPreset="H4-Semibold" color="UIText1" className="block truncate">
          {source.label}
        </TUXText>
        <TUXText typographyPreset="P2-Regular" color="UIText3" className="block mt-1">
          {source.count}
        </TUXText>
      </div>
    </button>
  );
}

function sortAlbumMediaAscending(items: readonly AlbumMediaItem[]): AlbumMediaItem[] {
  return [...items].sort((a, b) => a.capturedAt - b.capturedAt);
}

function mediaMatchesAlbumTab(
  mediaType: (typeof ALBUM_MEDIA)[number]["type"],
  activeAlbumTab: AlbumTab,
) {
  switch (activeAlbumTab) {
    case "Videos":
      return mediaType === "video";
    case "Photos":
      return mediaType === "photo";
    case "Live Photos":
      return mediaType === "livePhoto";
    case "All":
    default:
      return true;
  }
}

function AlbumMediaTile({
  item,
  showSelection,
  selectedOrder,
  onOpenPreview,
  onToggleSelection,
}: {
  item: AlbumMediaItem;
  showSelection: boolean;
  selectedOrder: number | null;
  onOpenPreview: (fromRect: DOMRectReadOnly) => void;
  onToggleSelection: () => void;
}) {
  const tileRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={tileRef}
      className="relative bg-tux-v2-ui-shape-neutral-4 h-[129px] overflow-hidden"
      {...{
        [CREATION_ALBUM_GRID_TILE_ATTR]: "",
        [CREATION_ALBUM_THUMBNAIL_SRC_ATTR]: item.src,
      }}
    >
      <button
        type="button"
        aria-label="Open preview"
        onClick={(event) => {
          event.stopPropagation();
          const tile = tileRef.current;
          if (tile) onOpenPreview(tile.getBoundingClientRect());
        }}
        className="block z-0 absolute inset-0 bg-transparent p-0 border-0 w-full h-full overflow-hidden cursor-pointer"
      >
        <img
          src={item.src}
          alt=""
          className="w-full h-full object-cover"
          draggable={false}
        />

        {"duration" in item ? (
          <TUXText
            typographyPreset="P2-Regular"
            className="right-1.5 bottom-1.5 absolute"
            style={ALBUM_MEDIA_DURATION_TEXT_STYLE}
          >
            {item.duration}
          </TUXText>
        ) : null}
        {item.type === "livePhoto" ? (
          <AlbumLivePhotoIcon className="right-1.5 bottom-1.5 absolute pointer-events-none" />
        ) : null}
      </button>

      {showSelection ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label={selectedOrder === null ? "Select item" : `Deselect item ${selectedOrder}`}
          aria-pressed={selectedOrder !== null}
          onPointerDown={(event) => {
            event.preventDefault();
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleSelection();
          }}
          className="top-1.5 right-1.5 z-1 absolute flex justify-end items-start bg-transparent p-0 border-0 min-w-[44px] min-h-[44px]"
        >
          <SelectionBadge selectedOrder={selectedOrder} />
        </button>
      ) : null}
    </div>
  );
}

function DefaultAlbumActions({
  overlay = false,
  multiSelectEnabled = true,
  onToggleMultiSelect,
}: {
  overlay?: boolean;
  multiSelectEnabled?: boolean;
  onToggleMultiSelect?: () => void;
}) {
  return (
    <div
      className={
        overlay
          ? "absolute inset-x-0 bottom-0 z-10 flex w-full shrink-0 flex-col bg-tux-v2-ui-image-overlay-black"
          : "flex shrink-0 flex-col bg-tux-v2-ui-sheet-flat-1"
      }
    >
      <div className={ALBUM_FOOTER_DEFAULT_ROW_CLASS} style={ALBUM_FOOTER_SIDE_PAD_STYLE}>
        <button
          type="button"
          className="flex items-center gap-1.5 h-10"
          aria-pressed={multiSelectEnabled}
          onPointerDown={(event) => event.preventDefault()}
          onClick={onToggleMultiSelect}
        >
          <span className="flex pointer-events-none shrink-0" aria-hidden>
            <TUXCheckbox
              name="creation-album-select-multiple"
              value="enabled"
              checked={multiSelectEnabled}
              sizePreset="small"
              shapePreset="circle"
            />
          </span>
          <TUXText
            typographyPreset={overlay ? "H4-Semibold" : "Headline-Semibold"}
            color={overlay ? "UIText1" : "UIText1"}
          >
            Select multiple
          </TUXText>
        </button>

        {!overlay && multiSelectEnabled ? (
          <TUXButton
            text="Next"
            themePreset="primary"
            shapePreset="capsule"
            sizePreset="medium"
            height="44px"
            width="180px"
            smoothRadius
            disabled
          />
        ) : null}
      </div>

      <AlbumFooterHomeInset />
    </div>
  );
}

const STRIP_DRAG_THRESHOLD_PX = 4;

function useHorizontalScrollContainer(itemCount: number) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const canScroll = () => el.scrollWidth > el.clientWidth + 1;

    const onWheel = (event: WheelEvent) => {
      if (!canScroll()) return;

      const { deltaX, deltaY } = event;
      if (Math.abs(deltaX) > Math.abs(deltaY)) return;
      if (deltaY === 0) return;

      const maxScrollLeft = el.scrollWidth - el.clientWidth;
      const nextScrollLeft = Math.max(0, Math.min(maxScrollLeft, el.scrollLeft + deltaY));
      if (nextScrollLeft === el.scrollLeft) return;

      event.preventDefault();
      el.scrollLeft = nextScrollLeft;
    };

    let activePointerId: number | null = null;
    let dragStartX = 0;
    let dragStartScrollLeft = 0;
    let isDragging = false;

    const syncCursor = () => {
      if (isDragging) return;
      el.style.cursor = canScroll() ? "grab" : "";
    };

    const onDocumentPointerMove = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) return;

      const deltaX = event.clientX - dragStartX;
      if (!isDragging) {
        if (Math.abs(deltaX) < STRIP_DRAG_THRESHOLD_PX) return;
        isDragging = true;
        el.style.cursor = "grabbing";
        el.style.userSelect = "none";
      }

      event.preventDefault();
      const maxScrollLeft = el.scrollWidth - el.clientWidth;
      el.scrollLeft = Math.max(0, Math.min(maxScrollLeft, dragStartScrollLeft - deltaX));
    };

    const endDocumentDrag = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) return;

      document.removeEventListener("pointermove", onDocumentPointerMove);
      document.removeEventListener("pointerup", endDocumentDrag);
      document.removeEventListener("pointercancel", endDocumentDrag);

      activePointerId = null;
      isDragging = false;
      el.style.userSelect = "";
      syncCursor();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if ((event.target as HTMLElement).closest("[data-no-strip-drag]")) return;
      if (!canScroll()) return;

      activePointerId = event.pointerId;
      dragStartX = event.clientX;
      dragStartScrollLeft = el.scrollLeft;
      isDragging = false;

      document.addEventListener("pointermove", onDocumentPointerMove, { passive: false });
      document.addEventListener("pointerup", endDocumentDrag);
      document.addEventListener("pointercancel", endDocumentDrag);
    };

    const onDragStart = (event: DragEvent) => {
      event.preventDefault();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("dragstart", onDragStart);

    syncCursor();
    const resizeObserver = new ResizeObserver(syncCursor);
    resizeObserver.observe(el);
    const innerTrack = el.firstElementChild;
    if (innerTrack) resizeObserver.observe(innerTrack);

    return () => {
      document.removeEventListener("pointermove", onDocumentPointerMove);
      document.removeEventListener("pointerup", endDocumentDrag);
      document.removeEventListener("pointercancel", endDocumentDrag);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("dragstart", onDragStart);
      resizeObserver.disconnect();
      el.style.cursor = "";
      el.style.userSelect = "";
    };
  }, [itemCount]);

  return scrollRef;
}

function SelectedAlbumActions({
  selectedMedia,
  onRemove,
  onOpenPreview,
  onNext,
  overlay = false,
  showUseLayout = true,
  useLayoutEnabled = false,
  onToggleUseLayout,
  showThumbStrip,
  nextCount,
}: {
  selectedMedia: AlbumMediaItem[];
  onRemove: (id: AlbumMediaId) => void;
  onOpenPreview: (id: AlbumMediaId, fromRect: DOMRectReadOnly) => void;
  onNext?: () => void;
  overlay?: boolean;
  showUseLayout?: boolean;
  useLayoutEnabled?: boolean;
  onToggleUseLayout?: () => void;
  /** Preview: hide strip when nothing selected; grid keeps strip whenever selectedMedia is non-empty. */
  showThumbStrip?: boolean;
  /** Preview: `Next (1)` for single-item preview when the grid selection is empty. */
  nextCount?: number;
}) {
  const resolvedShowThumbStrip = showThumbStrip ?? selectedMedia.length > 0;
  const resolvedNextCount = nextCount ?? selectedMedia.length;
  const selectedStripRef = useHorizontalScrollContainer(
    resolvedShowThumbStrip ? selectedMedia.length : 0,
  );

  return (
    <div
      className={
        overlay
          ? "absolute inset-x-0 bottom-0 z-10 flex w-full max-w-full flex-col"
          : "w-full max-w-full shrink-0 bg-tux-v2-ui-sheet-flat-1"
      }
    >
      {showUseLayout ? (
        <div
          className={ALBUM_FOOTER_USE_LAYOUT_ROW_CLASS}
          style={ALBUM_FOOTER_SIDE_PAD_STYLE}
        >
          <button
            type="button"
            className={ALBUM_FOOTER_USE_LAYOUT_CONTROL_CLASS}
            aria-pressed={useLayoutEnabled}
            onPointerDown={(event) => event.preventDefault()}
            onClick={onToggleUseLayout}
          >
            <span className="flex pointer-events-none shrink-0" aria-hidden>
              <TUXCheckbox
                name="creation-album-use-layout"
                value="enabled"
                checked={useLayoutEnabled}
                sizePreset="small"
                shapePreset="circle"
              />
            </span>
            <TUXText typographyPreset="H4-Semibold" color="UIText1">
              Use layout
            </TUXText>
          </button>
        </div>
      ) : null}

      {resolvedShowThumbStrip ? (
        <div
          ref={selectedStripRef}
          className={ALBUM_FOOTER_THUMB_STRIP_CLASS}
          style={ALBUM_FOOTER_SIDE_PAD_STYLE}
          role="list"
          aria-label="Selected media"
        >
          <div className={ALBUM_FOOTER_THUMB_ROW_CLASS}>
            {selectedMedia.map((item) => (
              <SelectedMediaThumb
                key={item.id}
                item={item}
                onOpenPreview={(fromRect) => onOpenPreview(item.id, fromRect)}
                onRemove={() => onRemove(item.id)}
              />
            ))}
          </div>
        </div>
      ) : null}

      <CreationBottomCtaShell
        bottomInsetCss={ALBUM_FOOTER_BOTTOM_INSET_CSS}
        className="shrink-0"
        style={{ paddingTop: ALBUM_FOOTER_THUMB_TO_CTA_GAP_PX }}
      >
        <CreationBottomCtaRow>
          <CreationBottomCtaSlot>
            <TUXButton
              text="AutoCut"
              themePreset="secondary"
              shapePreset="capsule"
              sizePreset="medium"
              height={CREATION_BOTTOM_CTA_BUTTON_HEIGHT}
              smoothRadius
              block
              backgroundColor={overlay ? "UIImageOverlayWhite" : undefined}
              textColor={overlay ? "UIImageOverlayBlack" : undefined}
              leadingIcon={
                <IconAutoCutClapperboardSmall
                  width={20}
                  height={20}
                  className="text-tux-v2-ui-shape-primary"
                />
              }
            />
          </CreationBottomCtaSlot>
          <CreationBottomCtaSlot>
            <TUXButton
              text={`Next (${resolvedNextCount})`}
              themePreset="primary"
              shapePreset="capsule"
              sizePreset="medium"
              height={CREATION_BOTTOM_CTA_BUTTON_HEIGHT}
              smoothRadius
              block
              onClick={onNext}
            />
          </CreationBottomCtaSlot>
        </CreationBottomCtaRow>
      </CreationBottomCtaShell>
    </div>
  );
}

function SelectedMediaThumb({
  item,
  onOpenPreview,
  onRemove,
}: {
  item: AlbumMediaItem;
  onOpenPreview: (fromRect: DOMRectReadOnly) => void;
  onRemove: () => void;
}) {
  return (
    <div className="relative bg-tux-v2-ui-shape-neutral-4 rounded-[8px] w-16 h-16 overflow-hidden shrink-0">
      <button
        type="button"
        data-no-strip-drag
        aria-label="Open preview"
        {...{ [CREATION_ALBUM_THUMBNAIL_SRC_ATTR]: item.src }}
        onClick={(event) => {
          event.stopPropagation();
          const img = event.currentTarget.querySelector("img");
          onOpenPreview((img ?? event.currentTarget).getBoundingClientRect());
        }}
        className="block z-0 absolute inset-0 bg-transparent p-0 border-0 w-full h-full overflow-hidden cursor-pointer"
      >
        <img
          src={item.src}
          alt=""
          className="w-full h-full object-cover"
          draggable={false}
        />
      </button>

      <button
        type="button"
        data-no-strip-drag
        aria-label="Remove selected media"
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        className="top-0 right-0 z-1 absolute flex justify-center items-center bg-tux-v2-ui-image-overlay-black-a50 rounded-tr-[6px] rounded-bl-[6px] size-5"
      >
        <IconXMark width={13} height={13} className="text-tux-v2-ui-image-overlay-white" />
      </button>

      {"duration" in item ? (
        <TUXText
          typographyPreset="P3-Semibold"
          className="right-[5px] bottom-[5px] z-1 absolute pointer-events-none"
          style={ALBUM_MEDIA_DURATION_TEXT_STYLE}
        >
          {selectedDurationLabel(item.duration)}
        </TUXText>
      ) : null}
    </div>
  );
}

/** Grid / preview multi-select indicator (Figma TUXCheckbox 607:21557 — 24px, P1-Semibold). */
function SelectionBadge({
  selectedOrder,
  surface = "image",
}: {
  selectedOrder: number | null;
  surface?: "image" | "page";
}) {
  if (selectedOrder === null) {
    const borderColor = getColorCSSVar(
      surface === "page" ? "UIText1" : "UIImageOverlayWhite",
    );
    return (
      <span
        className={[
          "box-border block size-6 shrink-0 rounded-full border-[1.5px] border-solid",
          surface === "image"
            ? "bg-tux-v2-ui-image-overlay-black-a25"
            : "bg-transparent",
        ].join(" ")}
        style={{ borderColor }}
        aria-hidden
      />
    );
  }

  return (
    <span
      className="flex size-6 shrink-0 items-center justify-center rounded-[20px] bg-tux-v2-ui-shape-primary"
    >
      <TUXText typographyPreset="P1-Semibold" color="UIImageOverlayWhite" className="leading-none">
        {selectedOrder}
      </TUXText>
    </span>
  );
}

function selectedDurationLabel(duration: string) {
  return duration.startsWith("0:") ? `00:${duration.slice(2)}` : duration;
}

function AlbumLivePhotoIcon({ className }: { className?: string }) {
  return (
    <span
      className={["flex size-5 items-center justify-center", className].filter(Boolean).join(" ")}
      style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.45))" }}
      aria-hidden
    >
      <IconLivePhoto width={20} height={20} className="text-tux-v2-ui-image-overlay-white" />
    </span>
  );
}
