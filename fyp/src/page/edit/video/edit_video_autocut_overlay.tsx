import {
  IconCircleSlash,
  IconTrashBin,
  TUXIconAiStars,
} from "@byted-tiktok/tux-icons";
import { getColorCSSVar } from "@byted-tiktok/tux-web";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  EDIT_OVERLAY_CAPSULE_RADIUS_CSS,
  EDIT_TOOLBAR_ASSET_ROOT,
} from "../components/edit_chrome.constants";

const ASSET_ROOT = EDIT_TOOLBAR_ASSET_ROOT;

export type EditVideoAutoCutMode = "default" | "picker" | "soundSync" | "autoCut";

const MENU_SPRING = {
  type: "spring" as const,
  stiffness: 438.65,
  damping: 37.7,
};

/** Footer action crossfade — AutoCut chip ⇄ Sound sync, driven by selectedIndex. */
const FOOTER_ACTION_SPRING = {
  type: "spring" as const,
  stiffness: 520,
  damping: 34,
};

const FOOTER_ACTION_VARIANTS = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.92 },
};

const AUTOCUT_EFFECT_ITEMS = [
  { type: "block" as const },
  { src: `${ASSET_ROOT}/autocut-effect-0.png` },
  {
    layers: [
      `${ASSET_ROOT}/autocut-effect-1a.png`,
      `${ASSET_ROOT}/autocut-effect-1b.png`,
    ],
    elevated: true,
  },
  {
    layers: [
      `${ASSET_ROOT}/autocut-effect-2a.png`,
      `${ASSET_ROOT}/autocut-effect-2b.png`,
    ],
  },
  {
    layers: [
      `${ASSET_ROOT}/autocut-effect-2a.png`,
      `${ASSET_ROOT}/autocut-effect-3b.png`,
    ],
  },
  {
    layers: [
      `${ASSET_ROOT}/autocut-effect-2a.png`,
      `${ASSET_ROOT}/autocut-effect-4b.png`,
    ],
  },
  { src: `${ASSET_ROOT}/autocut-effect-5.png` },
  { src: `${ASSET_ROOT}/autocut-effect-6.png` },
  { src: `${ASSET_ROOT}/autocut-effect-7.png` },
];

const AUTOCUT_ITEM_WIDTH = 54;
const AUTOCUT_ITEM_GAP = 12;
const AUTOCUT_ITEM_STEP = AUTOCUT_ITEM_WIDTH + AUTOCUT_ITEM_GAP;

/** Media-overlay chrome: stays white over preview, independent of page theme. */
const OVERLAY_WHITE = getColorCSSVar("UIImageOverlayWhite");

/** AutoCut chip / picker anchor — inset from the media preview bottom edge. */
const AUTOCUT_MEDIA_BOTTOM_INSET_PX = 20;


function AutoCutChip({
  onClick,
  className = "",
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label="AutoCut"
      onClick={onClick}
      className={[
        "flex h-8 items-center justify-center pl-2.5 pr-2",
        className,
      ].join(" ")}
      style={{
        border: "none",
        width: 97,
        color: getColorCSSVar("UIImageOverlayWhite"),
        backgroundColor: getColorCSSVar("UIImageOverlayDarkGrayA60"),
        borderRadius: EDIT_OVERLAY_CAPSULE_RADIUS_CSS,
        paddingLeft: 10,
        paddingRight: 8,
      }}
    >
      <TUXIconAiStars
        size={16}
        color={getColorCSSVar("UIImageOverlayWhite")}
        aria-hidden
      />
      <span className="flex items-center justify-center pl-1 pr-1.5">
        <span
          className="overflow-hidden text-ellipsis whitespace-nowrap text-center font-semibold leading-[1.3] text-[13px]"
          style={{ textShadow: "0 1px 1px rgba(0,0,0,0.12)" }}
        >
          AutoCut
        </span>
      </span>
    </button>
  );
}

function AutoCutButton({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="absolute inset-x-0 z-10 flex justify-center"
      style={{ bottom: AUTOCUT_MEDIA_BOTTOM_INSET_PX }}
    >
      <AutoCutChip onClick={onClick} />
    </div>
  );
}

function AutoCutEffectItem({
  item,
  selected,
  onClick,
}: {
  item: (typeof AUTOCUT_EFFECT_ITEMS)[number];
  selected: boolean;
  onClick: () => void;
}) {
  if ("type" in item && item.type === "block") {
    return (
      <button
        type="button"
        aria-label="No sound sync effect"
        onClick={onClick}
        className="relative flex h-[72px] w-[54px] shrink-0 items-center justify-center"
        style={{
          border: "none",
          backgroundColor: getColorCSSVar("UIImageOverlayDarkGrayA60"),
          borderRadius: "var(--tux-v2-radius-container-level1-small, 10px)",
          padding: 0,
        }}
      >
        <IconCircleSlash
          width={24}
          height={24}
          style={{ color: OVERLAY_WHITE }}
          aria-hidden
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label="Sound sync effect"
      onClick={onClick}
      className="relative flex shrink-0 flex-col items-center overflow-hidden"
      style={{
        border: "none",
        borderRadius: "var(--tux-v2-radius-container-level1-small, 10px)",
        padding: 0,
      }}
    >
      <div
        className={[
          "relative h-[72px] w-[54px] shrink-0",
          selected || ("elevated" in item && item.elevated)
            ? "shadow-[0_6px_24px_rgba(0,0,0,0.15)]"
            : "",
        ].join(" ")}
        data-name="Effect icon"
      >
        {"layers" in item && item.layers ? (
          <span aria-hidden className="pointer-events-none absolute inset-0">
            {item.layers.map((src) => (
              <img
                key={src}
                src={src}
                alt=""
                draggable={false}
                className="absolute inset-0 size-full max-w-none object-cover"
              />
            ))}
          </span>
        ) : "src" in item ? (
          <img
            src={item.src}
            alt=""
            draggable={false}
            className="absolute inset-0 size-full max-w-none object-cover"
          />
        ) : null}
      </div>
    </button>
  );
}

function SoundSyncButton({
  onClose,
  onClick,
  className = "",
}: {
  onClose: () => void;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      className={[
        "relative flex h-8 max-w-[160px] shrink-0 items-center justify-center gap-1.5 px-2",
        onClick ? "cursor-pointer" : "",
        className,
      ].join(" ")}
      onClick={onClick}
      style={{
        backgroundColor: getColorCSSVar("UIImageOverlayDarkGrayA60"),
        borderRadius: EDIT_OVERLAY_CAPSULE_RADIUS_CSS,
      }}
    >
      <div className="flex items-center justify-center pl-1 pr-1.5">
        <span
          className="max-w-[112px] overflow-hidden text-ellipsis whitespace-nowrap text-center font-semibold leading-[1.3] text-[13px]"
          style={{
            color: getColorCSSVar("UIImageOverlayWhite"),
            textShadow: "0 1px 1px rgba(0,0,0,0.12)",
          }}
        >
          Sound sync
        </span>
      </div>
      <div
        className="h-4 w-px shrink-0"
        style={{ backgroundColor: getColorCSSVar("UIImageOverlayWhiteA20") }}
      />
      <button
        type="button"
        aria-label="Remove sound sync"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        className="relative flex size-4 shrink-0 appearance-none items-center justify-center overflow-hidden border-0 bg-transparent p-0"
        style={{ border: "none", backgroundColor: "transparent", padding: 0 }}
      >
        <IconTrashBin
          width={16}
          height={16}
          style={{ color: getColorCSSVar("UIImageOverlayWhite") }}
          aria-hidden
        />
      </button>
    </div>
  );
}

function AutoCutCollapsedSoundSync({
  onClose,
  onOpen,
}: {
  onClose: () => void;
  onOpen: () => void;
}) {
  return (
    <motion.div
      className="absolute inset-x-0 z-10 flex justify-center"
      style={{ bottom: AUTOCUT_MEDIA_BOTTOM_INSET_PX }}
      initial={{ opacity: 1, y: -68 }}
      animate={{ opacity: 1, y: 0 }}
      transition={MENU_SPRING}
    >
      <SoundSyncButton onClose={onClose} onClick={onOpen} />
    </motion.div>
  );
}

function AutoCutCollapsedButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.div
      className="absolute inset-x-0 z-10 flex justify-center"
      style={{ bottom: AUTOCUT_MEDIA_BOTTOM_INSET_PX }}
      initial={{ opacity: 1, y: -68 }}
      animate={{ opacity: 1, y: 0 }}
      transition={MENU_SPRING}
    >
      <AutoCutChip onClick={onClick} />
    </motion.div>
  );
}

function AutoCutExpandedPanel({
  selectedIndex,
  onSelectIndex,
  onCollapse,
}: {
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onCollapse: (selectedIndex: number) => void;
}) {
  const listViewportRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(390);
  const [dragX, setDragX] = useState(-selectedIndex * AUTOCUT_ITEM_STEP);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startDragX: number;
  } | null>(null);
  const didDragRef = useRef(false);

  useLayoutEffect(() => {
    const node = listViewportRef.current;
    if (!node) return undefined;

    const updateWidth = () => {
      const nextWidth = node.clientWidth;
      if (nextWidth > 0) {
        setViewportWidth((current) => (current === nextWidth ? current : nextWidth));
      }
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setDragX(-selectedIndex * AUTOCUT_ITEM_STEP);
  }, [selectedIndex]);

  /** Left inset so item 0 centers under the ring when dragX = 0. */
  const listCenterPadding = viewportWidth / 2 - AUTOCUT_ITEM_WIDTH / 2;

  const minDragX = -(AUTOCUT_EFFECT_ITEMS.length - 1) * AUTOCUT_ITEM_STEP;

  const clampDragX = (value: number) => Math.min(0, Math.max(minDragX, value));

  const selectIndex = (index: number) => {
    const nextIndex = Math.min(AUTOCUT_EFFECT_ITEMS.length - 1, Math.max(0, index));
    onSelectIndex(nextIndex);
    setDragX(-nextIndex * AUTOCUT_ITEM_STEP);
  };

  const settleToNearestItem = (value: number) => {
    selectIndex(Math.round(Math.abs(value) / AUTOCUT_ITEM_STEP));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startDragX: dragX,
    };
    didDragRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const nextDragX = clampDragX(dragState.startDragX + event.clientX - dragState.startX);
    if (Math.abs(event.clientX - dragState.startX) > 3) {
      didDragRef.current = true;
    }
    setDragX(nextDragX);
    onSelectIndex(Math.round(Math.abs(nextDragX) / AUTOCUT_ITEM_STEP));
    event.preventDefault();
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    dragStateRef.current = null;
    settleToNearestItem(dragX);
  };

  const handleListBlankClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || didDragRef.current) {
      didDragRef.current = false;
      return;
    }

    onCollapse(selectedIndex);
  };

  return (
    <motion.div
      className="absolute inset-x-0 z-10 flex flex-col items-center gap-4"
      style={{ bottom: AUTOCUT_MEDIA_BOTTOM_INSET_PX }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={MENU_SPRING}
    >
      <div
        ref={listViewportRef}
        className="app-no-img-drag relative flex w-full shrink-0 cursor-grab items-center overflow-hidden py-[3px]"
        style={{
          paddingLeft: listCenterPadding,
          touchAction: "none",
          userSelect: "none",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <motion.div
          className="relative flex shrink-0 items-start gap-3"
          animate={{ x: dragX }}
          transition={MENU_SPRING}
          onClick={handleListBlankClick}
        >
          {AUTOCUT_EFFECT_ITEMS.map((item, index) => (
            <AutoCutEffectItem
              key={index}
              item={item}
              selected={index === selectedIndex}
              onClick={() => selectIndex(index)}
            />
          ))}
        </motion.div>
        <div
          className="absolute left-1/2 top-1/2 h-[78px] w-[60px] -translate-x-1/2 -translate-y-1/2 border-[3px] border-solid"
          style={{
            borderColor: getColorCSSVar("UIImageOverlayWhite"),
            borderRadius: "var(--tux-v2-radius-container-level2-small, 16px)",
          }}
        />
      </div>
      <div className="relative flex h-8 w-full items-center justify-center">
        <AnimatePresence initial={false}>
          {selectedIndex > 0 ? (
            <motion.div
              key="sound-sync"
              className="absolute inset-0 flex items-center justify-center"
              style={{ transformOrigin: "center" }}
              variants={FOOTER_ACTION_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={FOOTER_ACTION_SPRING}
            >
              <SoundSyncButton onClose={() => selectIndex(0)} />
            </motion.div>
          ) : (
            <motion.div
              key="autocut"
              className="absolute inset-0 flex items-center justify-center"
              style={{ transformOrigin: "center" }}
              variants={FOOTER_ACTION_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={FOOTER_ACTION_SPRING}
            >
              <AutoCutChip onClick={() => onCollapse(0)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}


export type EditVideoAutoCutOverlayProps = {
  mode: EditVideoAutoCutMode;
  effectIndex: number;
  onEffectIndexChange: (index: number) => void;
  onCollapsePicker: (selectedIndex: number) => void;
  onOpenPicker: () => void;
  onRemoveSoundSync: () => void;
};

/** Preview-area AutoCut chrome (video edit only). */
export function EditVideoAutoCutOverlay({
  mode,
  effectIndex,
  onEffectIndexChange,
  onCollapsePicker,
  onOpenPicker,
  onRemoveSoundSync,
}: EditVideoAutoCutOverlayProps) {
  return (
    <>
      {mode === "picker" ? (
        <button
          type="button"
          aria-label="Collapse AutoCut picker"
          className="absolute inset-0 z-9 appearance-none border-0 bg-transparent p-0"
          style={{ border: "none", backgroundColor: "transparent", padding: 0 }}
          onClick={() => onCollapsePicker(effectIndex)}
        />
      ) : null}
      {mode === "picker" ? (
        <AutoCutExpandedPanel
          selectedIndex={effectIndex}
          onSelectIndex={onEffectIndexChange}
          onCollapse={onCollapsePicker}
        />
      ) : mode === "soundSync" ? (
        <AutoCutCollapsedSoundSync
          onClose={onRemoveSoundSync}
          onOpen={onOpenPicker}
        />
      ) : mode === "autoCut" ? (
        <AutoCutCollapsedButton onClick={onOpenPicker} />
      ) : (
        <AutoCutButton onClick={onOpenPicker} />
      )}
    </>
  );
}
