import {
  TUXIconCalendarFill,
  TUXIconCameraFill,
  TUXIconChevronDownSmallFill,
  TUXIconDraftFill,
  TUXIconLikeFill,
  TUXIconLivePhotoAi,
  TUXIconTextLatin,
  TUXIconXMark,
} from "@byted-tiktok/tux-icons";
import { TUXCheckbox, TUXText } from "@byted-tiktok/tux-web";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useAppFrame } from "../../components/sys/app_frame";
import { ThemeScope, useTheme } from "../../context/theme";
import {
  STORY_ALBUM_CATALOG,
  storyAlbumItemMatchesTab,
  storyAlbumShowsCameraCell,
  type StoryAlbumItem,
} from "./story_album_catalog";
import {
  dismissAddToStoryAlbum,
  openStoryCamera,
  openStoryEdit,
  useAddToStoryStore,
} from "./add_to_story_store";
import StoryCameraLayer from "./story_camera_page";
import StoryEditLayer from "./story_edit_page";
import StoryPostLandingLayer from "./story_post_landing";
import {
  IMMERSIVE_CARD_FILL,
  IMMERSIVE_INACTIVE_TEXT,
  IMMERSIVE_OVERLAY_HAIRLINE,
  IMMERSIVE_OVERLAY_TEXT,
  IMMERSIVE_SELECT_OVERLAY,
  IMMERSIVE_SURFACE_BLACK,
} from "./immersive_chrome.constants";

const ENTER_DURATION_MS = 360;
const ENTER_TIMING = "cubic-bezier(0.32, 0.72, 0, 1)";
const TAB_INDICATOR_WIDTH_PX = 80;
const TAB_INDICATOR_TRANSITION_MS = 260;
const TAB_INDICATOR_EASE = "cubic-bezier(0.16, 0.5, 0.3, 1)";


const FEATURE_ITEMS: Array<{ key: string; label: string; icon: ReactNode }> = [
  { key: "text", label: "Text", icon: <TUXIconTextLatin size={28} /> },
  { key: "drafts", label: "Drafts", icon: <TUXIconDraftFill size={28} /> },
  { key: "ai-alive", label: "AI Alive", icon: <TUXIconLivePhotoAi size={28} /> },
  { key: "archive", label: "Archive", icon: <TUXIconCalendarFill size={28} /> },
];

const MEDIA_TABS = ["All", "Favorites", "Photos", "Videos"] as const;
type MediaTab = (typeof MEDIA_TABS)[number];

/** Figma 2656:14253 — Icon/Like_Fill, 16px, bottom-left inset 6×8. */
const FAVORITE_BADGE_INSET_X_PX = 6;
const FAVORITE_BADGE_INSET_BOTTOM_PX = 8;
const FAVORITE_ICON_SIZE_PX = 16;
const FAVORITE_ICON_SHADOW = "drop-shadow(0 0.667px 2px rgba(0, 0, 0, 0.12))";

/** Figma 2656:14266 — App/P3-Medium, bottom-right inset 6×4. */
const VIDEO_DURATION_INSET_X_PX = 6;
const VIDEO_DURATION_INSET_BOTTOM_PX = 4;
const VIDEO_DURATION_SHADOW = "0 1px 1px rgba(0, 0, 0, 0.12)";

/** Figma 2656:14271 — selected overlay + primary count badge (24px, inset 6). */
const SELECT_BADGE_INSET_PX = 6;
const SELECT_BADGE_SIZE_PX = 24;
const SELECT_SELECTED_IMAGE_SCALE = 1.1;
const SELECT_ANIMATION_MS = 250;
const SELECT_ANIMATION_EASE = "cubic-bezier(0.16, 0.5, 0.3, 1)";
const SELECT_MEDIA_TRANSITION = `transform ${SELECT_ANIMATION_MS}ms ${SELECT_ANIMATION_EASE}`;
const SELECT_BADGE_ANIMATION = `story-album-select-badge-in ${SELECT_ANIMATION_MS}ms ${SELECT_ANIMATION_EASE} forwards`;

function FeatureCard({ label, icon }: { label: string; icon: ReactNode }) {
  return (
    <button
      type="button"
      className="flex h-[90px] w-[110px] flex-none flex-col items-center justify-center gap-1.5 rounded-[8px] border border-solid outline-none transition-transform active:scale-97"
      style={{ backgroundColor: IMMERSIVE_CARD_FILL, borderColor: IMMERSIVE_CARD_FILL }}
    >
      <span
        className="flex h-7 w-7 items-center justify-center"
        style={{ color: IMMERSIVE_OVERLAY_TEXT }}
        aria-hidden
      >
        {icon}
      </span>
      <span
        className="text-center text-[12px] font-medium leading-[1.3]"
        style={{ color: IMMERSIVE_OVERLAY_TEXT, letterSpacing: "0.16px" }}
      >
        {label}
      </span>
    </button>
  );
}

function AlbumSelectionBadge({ order }: { order: number }) {
  return (
    <span
      className="pointer-events-none absolute flex items-center justify-center rounded-full bg-tux-v2-ui-shape-primary"
      style={{
        top: SELECT_BADGE_INSET_PX,
        right: SELECT_BADGE_INSET_PX,
        width: SELECT_BADGE_SIZE_PX,
        height: SELECT_BADGE_SIZE_PX,
        transformOrigin: "center",
        animation: SELECT_BADGE_ANIMATION,
      }}
      aria-hidden
    >
      <span
        className="text-center text-[14px] font-medium leading-[1.3]"
        style={{ color: IMMERSIVE_OVERLAY_TEXT, letterSpacing: "0.093px" }}
      >
        {order}
      </span>
    </span>
  );
}

function AlbumMediaCell({
  item,
  selectMode,
  selectionOrder,
  onToggleSelect,
}: {
  item: StoryAlbumItem;
  selectMode: boolean;
  selectionOrder: number | null;
  onToggleSelect: () => void;
}) {
  const isSelected = selectionOrder != null;

  return (
    <button
      type="button"
      aria-label={
        selectMode
          ? isSelected
            ? `Deselect media ${selectionOrder}`
            : "Select media"
          : item.isVideo
            ? `Edit video ${item.durationLabel}`
            : "Edit media"
      }
      aria-pressed={selectMode ? isSelected : undefined}
      data-story-album-src={item.src}
      onClick={(event) => {
        if (selectMode) {
          onToggleSelect();
          return;
        }
        openStoryEdit(item.src, {
          fromRect: (() => {
            const img = event.currentTarget.querySelector("img");
            return (img ?? event.currentTarget).getBoundingClientRect();
          })(),
        });
      }}
      className="relative overflow-hidden outline-none"
      style={{ aspectRatio: "129 / 229", backgroundColor: IMMERSIVE_CARD_FILL }}
    >
      <img
        alt=""
        src={item.src}
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          transform: isSelected ? `scale(${SELECT_SELECTED_IMAGE_SCALE})` : "scale(1)",
          transformOrigin: "center",
          transition: selectMode ? SELECT_MEDIA_TRANSITION : undefined,
        }}
        draggable={false}
      />
      {isSelected ? (
        <span
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: IMMERSIVE_SELECT_OVERLAY }}
          aria-hidden
        />
      ) : null}
      {item.isFavorite ? (
        <span
          className="pointer-events-none absolute flex items-center justify-center"
          style={{
            left: FAVORITE_BADGE_INSET_X_PX,
            bottom: FAVORITE_BADGE_INSET_BOTTOM_PX,
            width: FAVORITE_ICON_SIZE_PX,
            height: FAVORITE_ICON_SIZE_PX,
            color: IMMERSIVE_OVERLAY_TEXT,
            filter: FAVORITE_ICON_SHADOW,
          }}
          aria-hidden
        >
          <TUXIconLikeFill size={FAVORITE_ICON_SIZE_PX} />
        </span>
      ) : null}
      {item.isVideo && item.durationLabel ? (
        <span
          className="pointer-events-none absolute"
          style={{
            right: VIDEO_DURATION_INSET_X_PX,
            bottom: VIDEO_DURATION_INSET_BOTTOM_PX,
            textShadow: VIDEO_DURATION_SHADOW,
          }}
          aria-hidden
        >
          <TUXText typographyPreset="P3-Semibold" color="UIImageOverlayWhite">
            {item.durationLabel}
          </TUXText>
        </span>
      ) : null}
      {selectMode ? (
        isSelected ? (
          <AlbumSelectionBadge order={selectionOrder} />
        ) : (
          <span
            className="pointer-events-none absolute rounded-full"
            style={{
              top: SELECT_BADGE_INSET_PX,
              right: SELECT_BADGE_INSET_PX,
              width: SELECT_BADGE_SIZE_PX,
              height: SELECT_BADGE_SIZE_PX,
              border: `1.5px solid ${IMMERSIVE_OVERLAY_TEXT}`,
            }}
            aria-hidden
          />
        )
      ) : null}
    </button>
  );
}

function MediaTabs({
  activeTab,
  onChange,
}: {
  activeTab: MediaTab;
  onChange: (tab: MediaTab) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Partial<Record<MediaTab, HTMLButtonElement>>>({});
  const [indicatorLeft, setIndicatorLeft] = useState(0);
  const [indicatorTransitionEnabled, setIndicatorTransitionEnabled] = useState(false);

  useLayoutEffect(() => {
    const row = rowRef.current;
    const activeButton = tabRefs.current[activeTab];
    if (!row || !activeButton) {
      return;
    }

    const rowRect = row.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();
    setIndicatorLeft(
      buttonRect.left - rowRect.left + (buttonRect.width - TAB_INDICATOR_WIDTH_PX) / 2,
    );
  }, [activeTab]);

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(() => setIndicatorTransitionEnabled(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="relative">
      <div ref={rowRef} className="relative flex items-stretch px-4">
        {MEDIA_TABS.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <button
              key={tab}
              ref={(node) => {
                if (node) {
                  tabRefs.current[tab] = node;
                }
              }}
              type="button"
              onClick={() => onChange(tab)}
              className="relative flex flex-1 items-center justify-center py-2.5 outline-none"
            >
              <span
                className="text-[15px] font-medium leading-[1.3]"
                style={{ color: isActive ? IMMERSIVE_OVERLAY_TEXT : IMMERSIVE_INACTIVE_TEXT }}
              >
                {tab}
              </span>
            </button>
          );
        })}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 h-0.5 rounded-full"
          style={{
            left: indicatorLeft,
            width: TAB_INDICATOR_WIDTH_PX,
            backgroundColor: IMMERSIVE_OVERLAY_TEXT,
            transition: indicatorTransitionEnabled
              ? `left ${TAB_INDICATOR_TRANSITION_MS}ms ${TAB_INDICATOR_EASE}`
              : "none",
          }}
        />
      </div>
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ height: "0.5px", backgroundColor: IMMERSIVE_OVERLAY_HAIRLINE }}
      />
    </div>
  );
}

function AddToStoryContent({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<MediaTab>("All");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { topInsetCss } = useAppFrame();

  const selectionOrderById = useMemo(() => {
    const order = new Map<string, number>();
    selectedIds.forEach((id, index) => order.set(id, index + 1));
    return order;
  }, [selectedIds]);

  const handleTabChange = (tab: MediaTab) => {
    setActiveTab(tab);
    setSelectedIds([]);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  };

  const toggleSelectMode = () => {
    setSelectMode((current) => {
      if (current) {
        setSelectedIds([]);
      }
      return !current;
    });
  };

  const toggleItemSelection = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id],
    );
  };

  const visibleItems = STORY_ALBUM_CATALOG.filter((item) =>
    storyAlbumItemMatchesTab(item, activeTab),
  );
  const showCameraCell = storyAlbumShowsCameraCell(activeTab);

  return (
    <div
      className="flex h-full min-h-0 w-full flex-col overflow-hidden"
      style={{ backgroundColor: IMMERSIVE_SURFACE_BLACK, paddingTop: topInsetCss }}
    >
      {/* Navigation bar — stays pinned at the top while the album scrolls */}
      <div
        className="relative z-20 flex h-11 flex-none items-center px-1"
        style={{ backgroundColor: IMMERSIVE_SURFACE_BLACK }}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center outline-none"
          style={{ color: IMMERSIVE_OVERLAY_TEXT }}
        >
          <TUXIconXMark size={24} />
        </button>
        <div className="pointer-events-none absolute inset-x-0 flex items-center justify-center">
          <span
            className="text-[17px] font-bold leading-[1.3]"
            style={{ color: IMMERSIVE_OVERLAY_TEXT }}
          >
            Add to story
          </span>
        </div>
        <div className="ml-auto h-11 w-11 flex-none" />
      </div>

      {/* Single scroll surface: features scroll away, the album header sticks. */}
      <div
        ref={scrollRef}
        className="hide-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
      >
        {/* Feature shortcuts — horizontally scrollable, scroll away vertically */}
        <div className="hide-scrollbar overflow-x-auto">
          <div className="flex w-max items-center gap-2 px-3 py-3">
            {FEATURE_ITEMS.map((item) => (
              <FeatureCard key={item.key} label={item.label} icon={item.icon} />
            ))}
          </div>
        </div>

        {/* Sticky album header: album selector + tabs */}
        <div
          className="sticky top-0 z-10"
          style={{ backgroundColor: IMMERSIVE_SURFACE_BLACK }}
        >
          {/* Album selector + select-multiple toggle */}
          <div className="flex h-12 items-center justify-between px-4 py-2">
            <button
              type="button"
              className="flex items-center gap-0.5 outline-none"
              style={{ color: IMMERSIVE_OVERLAY_TEXT }}
            >
              <span className="text-[15px] font-bold leading-[1.3]">Recents</span>
              <TUXIconChevronDownSmallFill size={16} />
            </button>

            <button
              type="button"
              onClick={toggleSelectMode}
              className="flex h-8 items-center gap-1.5 rounded-[20px] px-3 outline-none"
              style={{ backgroundColor: IMMERSIVE_CARD_FILL, backdropFilter: "blur(10px)" }}
            >
              <span className="pointer-events-none flex shrink-0" aria-hidden>
                <TUXCheckbox
                  name="story-album-select-multiple"
                  value="enabled"
                  checked={selectMode}
                  sizePreset="small"
                  shapePreset="circle"
                />
              </span>
              <span
                className="text-[12px] font-medium leading-[1.3]"
                style={{ color: IMMERSIVE_OVERLAY_TEXT, letterSpacing: "0.16px" }}
              >
                Select multiple
              </span>
            </button>
          </div>

          {/* Category tabs */}
          <MediaTabs activeTab={activeTab} onChange={handleTabChange} />
        </div>

        {/* Media grid */}
        <style>
          {`
            @keyframes story-album-select-badge-in {
              from {
                transform: scale(0.8);
              }
              to {
                transform: scale(1);
              }
            }
          `}
        </style>
        <div
          className="w-full"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1.5px",
          }}
        >
          {showCameraCell ? (
            <button
              key="camera"
              type="button"
              aria-label="Open camera"
              onClick={openStoryCamera}
              className="relative flex items-center justify-center overflow-hidden outline-none"
              style={{
                backgroundColor: IMMERSIVE_CARD_FILL,
                aspectRatio: "129 / 229",
              }}
            >
              <span
                className="flex h-8 w-8 items-center justify-center"
                style={{ color: IMMERSIVE_OVERLAY_TEXT }}
                aria-hidden
              >
                <TUXIconCameraFill size={32} />
              </span>
            </button>
          ) : null}

          {visibleItems.map((item) => (
            <AlbumMediaCell
              key={item.id}
              item={item}
              selectMode={selectMode}
              selectionOrder={selectionOrderById.get(item.id) ?? null}
              onToggleSelect={() => toggleItemSelection(item.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Album sheet that slides up over the live camera. The camera layer stays
 * mounted underneath — only this panel animates in and out.
 */
function AlbumPanelOverCamera({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);
  const exitTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (exitTimerRef.current != null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }

    if (open) {
      setMounted(true);
      let inner = 0;
      const outer = window.requestAnimationFrame(() => {
        inner = window.requestAnimationFrame(() => setEntered(true));
      });
      return () => {
        window.cancelAnimationFrame(outer);
        window.cancelAnimationFrame(inner);
      };
    }

    setEntered(false);
    exitTimerRef.current = window.setTimeout(() => {
      setMounted(false);
      exitTimerRef.current = null;
    }, ENTER_DURATION_MS);
    return undefined;
  }, [open]);

  useEffect(
    () => () => {
      if (exitTimerRef.current != null) {
        window.clearTimeout(exitTimerRef.current);
      }
    },
    [],
  );

  if (!mounted) {
    return null;
  }

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-110 min-h-0 w-full overflow-hidden"
      style={{
        backgroundColor: IMMERSIVE_SURFACE_BLACK,
        transform: entered ? "translateY(0)" : "translateY(100%)",
        transition: `transform ${ENTER_DURATION_MS}ms ${ENTER_TIMING}`,
      }}
    >
      <AddToStoryContent onClose={onClose} />
    </div>
  );
}

/**
 * Full-screen "Add to story" creation page. Mounted once inside the AppFrame and
 * driven by {@link useAddToStoryStore}. Enters bottom-to-top (slides up from the
 * frame's bottom edge) and slides back down on close.
 */
export default function AddToStoryOverlay() {
  const { isOpen, editImage, cameraOpen, albumOverCamera, postLanding } = useAddToStoryStore();
  const isPostExit = Boolean(postLanding);
  const [mounted, setMounted] = useState(isOpen);
  const [entered, setEntered] = useState(false);
  const exitTimerRef = useRef<number | null>(null);
  const { resolvedTheme } = useTheme();
  const { setStatusBarSurfaceTheme, setHomeIndicatorSurfaceTheme } = useAppFrame();
  const chromeStatusOwnerId = useId();
  const chromeHomeOwnerId = useId();

  // 沉浸式浮层：顶栏固定 dark。须跟 store.isOpen 同步，不能只等 mounted（入场动画
  // 首帧 mounted 仍为 false 时会漏注册，Tab 的 light 壳层会盖住）。
  const chromeSurfaceDark = isOpen || isPostExit || mounted;

  // Tab 根页在 resolvedTheme 变化时会重新入栈；浮层在 frameOverlays 里须同帧再登记，
  // 否则切换全局主题后顶栏会跟 Tab 走 light。
  useLayoutEffect(() => {
    if (!chromeSurfaceDark) {
      setStatusBarSurfaceTheme(null, chromeStatusOwnerId);
      setHomeIndicatorSurfaceTheme(null, chromeHomeOwnerId);
      return;
    }
    setStatusBarSurfaceTheme("dark", chromeStatusOwnerId);
    setHomeIndicatorSurfaceTheme("dark", chromeHomeOwnerId);
    return () => {
      setStatusBarSurfaceTheme(null, chromeStatusOwnerId);
      setHomeIndicatorSurfaceTheme(null, chromeHomeOwnerId);
    };
  }, [
    chromeSurfaceDark,
    resolvedTheme,
    chromeStatusOwnerId,
    chromeHomeOwnerId,
    setStatusBarSurfaceTheme,
    setHomeIndicatorSurfaceTheme,
  ]);

  useLayoutEffect(() => {
    if (exitTimerRef.current != null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }

    if (isOpen) {
      setMounted(true);
      // Double rAF guarantees the off-screen start frame (translateY 100%)
      // paints before we flip to translateY(0), so the slide-up always plays
      // instead of snapping straight to the final position.
      let inner = 0;
      const outer = window.requestAnimationFrame(() => {
        inner = window.requestAnimationFrame(() => setEntered(true));
      });
      return () => {
        window.cancelAnimationFrame(outer);
        window.cancelAnimationFrame(inner);
      };
    }

    setEntered(false);
    exitTimerRef.current = window.setTimeout(() => {
      setMounted(false);
      exitTimerRef.current = null;
    }, ENTER_DURATION_MS);
    return undefined;
  }, [isOpen]);

  useEffect(
    () => () => {
      if (exitTimerRef.current != null) {
        window.clearTimeout(exitTimerRef.current);
      }
    },
    [],
  );

  if (isPostExit) {
    return <StoryPostLandingLayer />;
  }

  if (!mounted) {
    return null;
  }

  const interactive = entered || isOpen;

  return (
    <ThemeScope
      mode="dark"
      className="pointer-events-auto absolute inset-0 flex min-h-0 w-full flex-col overflow-hidden bg-black"
      style={{
        backgroundColor: IMMERSIVE_SURFACE_BLACK,
        transform: entered ? "translateY(0)" : "translateY(100%)",
        transition: `transform ${ENTER_DURATION_MS}ms ${ENTER_TIMING}`,
        pointerEvents: interactive ? "auto" : "none",
      }}
    >
      {!albumOverCamera ? (
        <div
          className={
            cameraOpen
              ? "pointer-events-none absolute inset-0 z-0 flex min-h-0 flex-col"
              : "absolute inset-0 flex min-h-0 flex-col"
          }
          style={{ backgroundColor: IMMERSIVE_SURFACE_BLACK }}
          aria-hidden={cameraOpen ? true : undefined}
        >
          <AddToStoryContent onClose={dismissAddToStoryAlbum} />
        </div>
      ) : null}
      <StoryCameraLayer open={cameraOpen} visible={!(Boolean(editImage) && cameraOpen)} />
      <StoryEditLayer image={editImage} />
      <AlbumPanelOverCamera open={albumOverCamera} onClose={dismissAddToStoryAlbum} />
    </ThemeScope>
  );
}
