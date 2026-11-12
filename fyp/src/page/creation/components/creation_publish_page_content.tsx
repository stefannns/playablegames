import {
  TUXButton,
  TUXNavBar,
  TUXNavBarTextAction,
  TUXText,
  getColorCSSVar,
} from "@byted-tiktok/tux-web";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type ReactNode,
} from "react";

import { AppNavBarBackButton } from "../../../components/sys/app_nav_bar_back_button";
import { useHorizontalScrollWheel } from "../../../hooks/use_horizontal_scroll_wheel";
import { useAppFrame } from "../../../components/sys/app_frame";
import {
  useSoftKeyboard,
  useSoftKeyboardInputFocus,
} from "../../../components/sys/soft_keyboard";
import { localFeedVerticalCoverUrl } from "../../../utils/local_media_placeholder";
import {
  CREATION_PUBLISH_COVER_FEED_INDEX,
} from "../creation_publish_page.config";
import { PublishBottomActions } from "../post_publish/publish_bottom_actions";
import { PUBLISH_SECTION_DIVIDER_BG } from "../post_publish/publish_chrome.constants";
import { PublishHashtagMentionChips } from "../post_publish/publish_hashtag_mention_chips";
import { PublishSettingList } from "../post_publish/publish_setting_list";
import {
  getPostPublishDraft,
  syncVideoPublishPosterFromCapture,
  updatePostPublishDraft,
} from "../post_publish/post_publish_store";

export type CreationPublishPageContentProps = {
  onClose: (trigger?: HTMLElement | null) => void;
  onOpenPreview?: (imageIndex?: number, trigger?: HTMLElement) => void;
  /** Live cover instead of the draft's poster image (e.g. a playable playing itself). */
  coverContent?: ReactNode;
};

/**
 * 视频发布页（Figma node 12974:56377）— 与图文发布共用设置列表 / 底栏 / 预览流。
 */
export function CreationPublishPageContent({
  onClose,
  onOpenPreview,
  coverContent,
}: CreationPublishPageContentProps) {
  const { bottomInsetCss } = useAppFrame();
  const draft = getPostPublishDraft();
  const coverUrl =
    draft.media[0]?.kind === "video"
      ? draft.media[0].posterSrc
      : draft.media[0]?.kind === "image"
        ? draft.media[0].src
        : localFeedVerticalCoverUrl(CREATION_PUBLISH_COVER_FEED_INDEX);

  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const descriptionActionChipsRef = useRef<HTMLDivElement>(null);
  const hasKeyboardOpenedRef = useRef(false);
  const { isOpen: keyboardOpen } = useSoftKeyboard();
  useHorizontalScrollWheel(descriptionActionChipsRef);
  const [description, setDescription] = useState(draft.description);
  const [isDescriptionEditing, setIsDescriptionEditing] = useState(false);

  const bindSoftKeyboard = useSoftKeyboardInputFocus({
    returnKey: "done",
    placeholder: "Add description",
  });

  const handleDescriptionFocus = useCallback(
    (event: ReactFocusEvent<HTMLTextAreaElement>) => {
      setIsDescriptionEditing(true);
      bindSoftKeyboard(event);
    },
    [bindSoftKeyboard],
  );

  const isInsideDescriptionKeepOpen = useCallback((node: Node | null) => {
    if (!node) return false;
    const field = descriptionRef.current;
    if (field && (field === node || field.contains(node))) return true;
    return descriptionActionChipsRef.current?.contains(node) ?? false;
  }, []);

  const exitDescriptionEditing = useCallback(() => {
    setIsDescriptionEditing(false);
    descriptionRef.current?.blur();
  }, []);

  const handleDescriptionBlur = useCallback(() => {
    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (isInsideDescriptionKeepOpen(active)) return;
      exitDescriptionEditing();
    });
  }, [isInsideDescriptionKeepOpen, exitDescriptionEditing]);

  useEffect(() => {
    if (keyboardOpen) {
      hasKeyboardOpenedRef.current = true;
      return;
    }

    if (isDescriptionEditing && hasKeyboardOpenedRef.current) {
      hasKeyboardOpenedRef.current = false;
      exitDescriptionEditing();
    }
  }, [isDescriptionEditing, keyboardOpen, exitDescriptionEditing]);

  useEffect(() => {
    if (!isDescriptionEditing) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (isInsideDescriptionKeepOpen(target)) return;
      exitDescriptionEditing();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [isDescriptionEditing, exitDescriptionEditing, isInsideDescriptionKeepOpen]);

  const commitDraftForPreview = useCallback(() => {
    syncVideoPublishPosterFromCapture();
    updatePostPublishDraft({ description });
  }, [description]);

  const handlePreview = useCallback(
    (trigger?: HTMLElement) => {
      commitDraftForPreview();
      onOpenPreview?.(0, trigger);
    },
    [commitDraftForPreview, onOpenPreview],
  );

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-tux-v2-ui-page-flat-1 pt-app-frame-top">
      <TUXNavBar
        heightPreset={44}
        backgroundColor="UIPageFlat1"
        leading={<AppNavBarBackButton onBack={(trigger) => onClose(trigger)} />}
        trailing={
          isDescriptionEditing ? (
            <div className="px-2 py-1.5">
              <TUXButton
                text="Post"
                themePreset="primary"
                sizePreset="small"
                smoothRadius
                onClick={() => undefined}
              />
            </div>
          ) : (
            <TUXNavBarTextAction
              text="Preview"
              themePreset="secondary"
              onClick={(event) => handlePreview(event.currentTarget)}
            />
          )
        }
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 flex-col gap-2 overflow-x-clip">
          <section
            className="flex h-[232px] shrink-0 flex-col gap-4 px-4 pt-2 pb-3"
            data-softkb-keep-open
          >
            <div className="flex h-[164px] shrink-0 gap-4">
              <label className="flex h-[164px] min-w-0 flex-1 flex-col pt-1.5">
                <span className="sr-only">Description</span>
                <textarea
                  ref={descriptionRef}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="Headline-Regular block min-h-0 flex-1 resize-none border-0 bg-transparent p-0 text-tux-v2-ui-text-1 outline-none placeholder:text-tux-v2-ui-text-placeholder"
                  placeholder={isDescriptionEditing ? "" : "Add description"}
                  maxLength={2200}
                  onFocus={handleDescriptionFocus}
                  onBlur={handleDescriptionBlur}
                />
              </label>

              <button
                type="button"
                className="relative h-[164px] w-[123px] shrink-0 overflow-hidden rounded-[8px] border-0 bg-transparent p-0 text-left"
                aria-label="Preview post"
                onClick={(event) => handlePreview(event.currentTarget)}
              >
                {coverContent ?? (
                  <img
                    src={coverUrl}
                    alt=""
                    className="size-full object-cover"
                    loading="eager"
                  />
                )}
                <TUXText
                  typographyPreset="P2-Semibold"
                  color="UIImageOverlayWhite"
                  as="span"
                  className="absolute left-[10px] top-2"
                >
                  Preview
                </TUXText>
                <span
                  className="absolute inset-x-[6px] bottom-[7px] flex items-center justify-center rounded-[8px] px-1 py-1"
                  style={{ backgroundColor: getColorCSSVar("UIImageOverlayDarkGrayA60") }}
                >
                  <TUXText
                    typographyPreset="P1-Semibold"
                    color="UIImageOverlayWhite"
                    as="span"
                    className="w-full text-center"
                    textDisplay="truncate"
                  >
                    Edit cover
                  </TUXText>
                </span>
              </button>
            </div>

            <div ref={descriptionActionChipsRef}>
              <PublishHashtagMentionChips keepDescriptionFocusOnPress />
            </div>
          </section>

          <div
            className="h-px w-full shrink-0"
            style={{ backgroundColor: PUBLISH_SECTION_DIVIDER_BG }}
            aria-hidden
          />
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col pt-2">
          <div
            className={`relative z-0 min-h-0 flex-1 overflow-y-auto overflow-x-clip${isDescriptionEditing ? " pointer-events-none" : ""}`}
            aria-hidden={isDescriptionEditing}
          >
            <PublishSettingList showLocationChips className="pb-4" />
          </div>

          <PublishBottomActions
            bottomInsetCss={bottomInsetCss}
            disabled={isDescriptionEditing}
            horizontalPaddingPx={16}
          />

          {isDescriptionEditing ? (
            <button
              type="button"
              className="absolute inset-0 z-10 border-0 p-0"
              style={{ backgroundColor: getColorCSSVar("UIImageOverlayBlackA50") }}
              aria-label="Dismiss description editing"
              onClick={exitDescriptionEditing}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
