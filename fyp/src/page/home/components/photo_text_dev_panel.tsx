import { TUXIconButton, TUXText, getColorCSSVar } from "@byted-tiktok/tux-web";
import { Icon3ptHamburgerMenu, IconChevronCollapse } from "@byted-tiktok/tux-icons";
import { useMemo, useState } from "react";

import {
  APP_FRAME_CORNER_PANEL_CHROME_CLASS,
  AppFrameCornerCapsuleTrigger,
  AppFrameCornerPanelAnchor,
  appFrameCornerPanelChromeStyle,
} from "../../../components/sys/app_frame_corner_capsule_trigger";
import { useCommentPanelVisualStore } from "./comment_panel/comment_panel_visual_store";
import { PHOTO_TEXT_ASPECT_POOL, type AspectWH } from "./photo_text_post_layout";
import { usePhotoTextDevPublished } from "./photo_text_dev_context";

function aspectKey(aspect: AspectWH): string {
  return `${aspect[0]}:${aspect[1]}`;
}

function parseAspectKey(value: string): AspectWH | null {
  const match = /^(\d+):(\d+)$/.exec(value.trim());
  if (!match) return null;

  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  if (width <= 0 || height <= 0) return null;

  return [width, height] as const;
}

function clampLineCount(raw: string, min: number, max: number) {
  if (raw === "") return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return Math.max(min, Math.min(max, Math.round(value)));
}

export type PhotoTextDevPanelProps = {
  /** Keep in sync with {@link FeedInfoDebugControls} `stackBelowCommentExperiment`. */
  stackBelowCommentExperiment?: boolean;
};

export default function PhotoTextDevPanel({
  stackBelowCommentExperiment = false,
}: PhotoTextDevPanelProps) {
  const ctx = usePhotoTextDevPublished();
  const { isOpen: isCommentPanelOpen } = useCommentPanelVisualStore();
  const [panelOpen, setPanelOpen] = useState(false);

  const stackIndex = (stackBelowCommentExperiment ? 1 : 0) + 2;

  const activeContent = useMemo(() => {
    if (!ctx || ctx.activeFeedIndex < 0) return null;
    return ctx.feedContents[ctx.activeFeedIndex] ?? null;
  }, [ctx]);

  const feedId = activeContent?.id;
  const photo = activeContent?.photoText;

  if (!ctx || !activeContent || !feedId || !photo || isCommentPanelOpen) {
    return null;
  }

  const state = ctx.getPerFeed(feedId);

  if (!panelOpen) {
    return (
      <AppFrameCornerCapsuleTrigger
        side="left"
        stackIndex={stackIndex}
        text="Photo text"
        leadingIcon={
          <Icon3ptHamburgerMenu className="text-tux-v2-ui-text-1" width={16} height={16} />
        }
        onClick={() => setPanelOpen(true)}
        aria-label="Open photo text dev panel"
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
          <TUXText
            as="div"
            style={{
              fontSize: 15,
              fontWeight: 600,
              lineHeight: "19.5px",
              color: getColorCSSVar("UIText1"),
            }}
          >
            Photo text
          </TUXText>
          <div className="flex min-w-0 items-center gap-2">
            <TUXText
              typographyPreset="P3-Regular"
              className="truncate text-tux-v2-ui-text-3"
            >
              {activeContent.nickname}
            </TUXText>
            <TUXIconButton
              icon={<IconChevronCollapse width={14} height={14} />}
              sizePreset="small"
              onClick={() => setPanelOpen(false)}
              backgroundColor="UIPageFlat2"
              aria-label="Collapse photo text panel"
            />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <label className="block space-y-1">
          <TUXText typographyPreset="P3-Semibold" className="text-tux-v2-ui-text-2">
            Image aspect
          </TUXText>
          <select
            className="w-full rounded-lg border border-tux-v2-ui-shape-neutral-3 bg-tux-v2-ui-page-flat-1 px-2 py-1.5 text-[13px] text-tux-v2-ui-text-1"
            value={state.aspect ? aspectKey(state.aspect) : ""}
            onChange={(event) => {
              const nextValue = event.target.value;
              ctx.setAspect(feedId, nextValue === "" ? null : parseAspectKey(nextValue));
            }}
          >
            <option value="">Auto</option>
            {PHOTO_TEXT_ASPECT_POOL.map((aspect) => (
              <option key={aspectKey(aspect)} value={aspectKey(aspect)}>
                {aspectKey(aspect)}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <TUXText typographyPreset="P3-Semibold" className="text-tux-v2-ui-text-2">
            Title lines
          </TUXText>
          <input
            type="number"
            min={0}
            max={2}
            step={1}
            placeholder="Auto"
            className="w-full rounded-lg border border-tux-v2-ui-shape-neutral-3 bg-tux-v2-ui-page-flat-1 px-2 py-1.5 text-[13px] text-tux-v2-ui-text-1"
            value={state.titleLines ?? ""}
            onChange={(event) => {
              ctx.setTitleLines(feedId, clampLineCount(event.target.value, 0, 2));
            }}
          />
        </label>

        <label className="block space-y-1">
          <TUXText typographyPreset="P3-Semibold" className="text-tux-v2-ui-text-2">
            Description lines
          </TUXText>
          <input
            type="number"
            min={0}
            max={5}
            step={1}
            placeholder="Auto"
            className="w-full rounded-lg border border-tux-v2-ui-shape-neutral-3 bg-tux-v2-ui-page-flat-1 px-2 py-1.5 text-[13px] text-tux-v2-ui-text-1"
            value={state.descLines ?? ""}
            onChange={(event) => {
              ctx.setDescLines(feedId, clampLineCount(event.target.value, 0, 5));
            }}
          />
        </label>

        <button
          type="button"
          className="w-full rounded-lg bg-tux-v2-ui-shape-neutral-3 py-2 text-[13px] font-semibold text-tux-v2-ui-text-1"
          onClick={() => ctx.resetFeed(feedId)}
        >
          Reset this post
        </button>
      </div>
    </AppFrameCornerPanelAnchor>
  );
}
