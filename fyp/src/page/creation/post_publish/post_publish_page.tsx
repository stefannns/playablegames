import {
  TUXNavBar,
  TUXNavBarTextAction,
} from "@byted-tiktok/tux-web";
import {
  TUXIconAiInsight,
  TUXIconAt,
  TUXIconChevronCollapse,
  TUXIconChevronExpand,
  TUXIconNumber,
  TUXIconPenStar,
} from "@byted-tiktok/tux-icons";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type CSSProperties,
} from "react";

import { useAppFrame } from "../../../components/sys/app_frame";
import { AppNavBarBackButton } from "../../../components/sys/app_nav_bar_back_button";
import {
  useSoftKeyboard,
  useSoftKeyboardInputFocus,
} from "../../../components/sys/soft_keyboard";
import { useAppNavigation } from "../../../context/app_navigation";
import { creationBackPathForSub } from "../../../routes/app_route_tree";
import {
  PostPublishAddTile,
  PostPublishMediaTile,
} from "./post_publish_media_tile";
import {
  creationPublishOriginFromRoute,
  postPublishPaths,
} from "./post_publish_paths";
import {
  getPostPublishDraft,
  getPostPublishOrigin,
  updatePostPublishDraft,
} from "./post_publish_store";
import { PublishBottomActions } from "./publish_bottom_actions";
import { PublishComposerIconButton } from "./publish_composer_icon_button";
import {
  PUBLISH_DIVIDER_BG,
  PUBLISH_LIST_ICON_COLOR,
} from "./publish_chrome.constants";
import { PublishListIconInk } from "./publish_icon_ink";
import { PublishSettingList } from "./publish_setting_list";

const INPUT_AREA_HEIGHT = 180;
const INPUT_EDITING_AREA_HEIGHT = 294;
const TITLE_MIN_HEIGHT = 20;
const DESCRIPTION_MIN_HEIGHT = 20;
const TITLE_DESCRIPTION_DIVIDER_SPACE = 21;

const TEXT_INPUT_STYLE: CSSProperties = {
  width: "100%",
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: "15px",
  lineHeight: "1.3",
  color: PUBLISH_LIST_ICON_COLOR,
  padding: 0,
};

export type PostPublishPageProps = {
  onOpenPreview?: (imageIndex: number, trigger?: HTMLElement) => void;
  onBack?: () => void;
};

export default function PostPublishPage({
  onOpenPreview,
  onBack,
}: PostPublishPageProps = {}) {
  const { route, navigate } = useAppNavigation();
  const draft = getPostPublishDraft();
  const publishOrigin =
    creationPublishOriginFromRoute(route) ?? getPostPublishOrigin();
  const { topInsetCss, bottomInsetCss } = useAppFrame();
  const { isOpen: keyboardOpen } = useSoftKeyboard();
  const [title, setTitle] = useState(draft.title);
  const [description, setDescription] = useState(draft.description);
  const [isEditing, setIsEditing] = useState(false);
  const [titleHeight, setTitleHeight] = useState(TITLE_MIN_HEIGHT);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const hasKeyboardOpenedRef = useRef(false);
  const inputAreaHeight = isEditing ? INPUT_EDITING_AREA_HEIGHT : INPUT_AREA_HEIGHT;
  const descriptionHeight = Math.max(
    DESCRIPTION_MIN_HEIGHT,
    inputAreaHeight - titleHeight - TITLE_DESCRIPTION_DIVIDER_SPACE,
  );
  const mediaTileSize = isEditing ? 50 : 100;

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
      return;
    }
    navigate(
      creationBackPathForSub({
        screen: "publish",
        origin: publishOrigin,
      }),
    );
  }, [navigate, onBack, publishOrigin]);

  const commitDraftForPreview = useCallback(
    (imageIndex: number) => {
      updatePostPublishDraft({ title, description, initialPreviewIndex: imageIndex });
    },
    [description, title],
  );

  const handlePreview = useCallback(
    (trigger?: HTMLElement) => {
      commitDraftForPreview(0);
      if (onOpenPreview) {
        onOpenPreview(0, trigger);
        return;
      }
      navigate(postPublishPaths.preview(getPostPublishOrigin()));
    },
    [commitDraftForPreview, navigate, onOpenPreview],
  );

  const handlePreviewFromImage = useCallback(
    (imageIndex: number, trigger?: HTMLElement) => {
      commitDraftForPreview(imageIndex);
      if (onOpenPreview) {
        onOpenPreview(imageIndex, trigger);
        return;
      }
      navigate(postPublishPaths.preview(getPostPublishOrigin()));
    },
    [commitDraftForPreview, navigate, onOpenPreview],
  );

  const actionButtons = useMemo(
    () => [
      {
        id: "hashtag",
        icon: (
          <PublishListIconInk>
            <TUXIconNumber size={16} />
          </PublishListIconInk>
        ),
        label: "Add hashtag",
      },
      {
        id: "mention",
        icon: (
          <PublishListIconInk>
            <TUXIconAt size={16} />
          </PublishListIconInk>
        ),
        label: "Mention someone",
      },
      {
        id: "ai",
        icon: (
          <PublishListIconInk>
            <TUXIconAiInsight size={16} />
          </PublishListIconInk>
        ),
        label: "AI assistant",
      },
    ],
    [],
  );

  const bindSoftKeyboard = useSoftKeyboardInputFocus({
    returnKey: "done",
  });

  const handleTitleFocus = useCallback(
    (event: ReactFocusEvent<HTMLTextAreaElement>) => {
      setIsEditing(true);
      bindSoftKeyboard(event);
    },
    [bindSoftKeyboard],
  );

  const handleDescriptionFocus = useCallback(
    (event: ReactFocusEvent<HTMLTextAreaElement>) => {
      setIsEditing(true);
      bindSoftKeyboard(event);
    },
    [bindSoftKeyboard],
  );

  const focusTitleInput = useCallback(() => {
    setIsEditing(true);
    requestAnimationFrame(() => {
      titleRef.current?.focus();
    });
  }, []);

  useLayoutEffect(() => {
    const element = titleRef.current;
    if (!element) return;

    element.style.height = "0px";
    const nextHeight = Math.min(
      element.scrollHeight,
      inputAreaHeight - TITLE_DESCRIPTION_DIVIDER_SPACE - DESCRIPTION_MIN_HEIGHT,
    );
    element.style.height = `${nextHeight}px`;
    setTitleHeight(nextHeight);
  }, [inputAreaHeight, title]);

  useEffect(() => {
    if (keyboardOpen) {
      hasKeyboardOpenedRef.current = true;
      return;
    }

    if (isEditing && hasKeyboardOpenedRef.current) {
      setIsEditing(false);
      hasKeyboardOpenedRef.current = false;
      titleRef.current?.blur();
      descriptionRef.current?.blur();
    }
  }, [isEditing, keyboardOpen]);

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-x-hidden touch-pan-y bg-tux-v2-ui-page-flat-1"
      style={{ paddingTop: topInsetCss }}
    >
      <TUXNavBar
        heightPreset={44}
        backgroundColor="UIPageFlat1"
        showSeparator={false}
        leading={<AppNavBarBackButton onBack={() => handleBack()} />}
        trailing={
          isEditing ? (
            <TUXNavBarTextAction text="Post" themePreset="primary" />
          ) : (
            <TUXNavBarTextAction
              text="Preview"
              themePreset="secondary"
              onClick={(event) => handlePreview(event.currentTarget)}
            />
          )
        }
      />

      <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden touch-pan-y">
        <section className="px-4 pb-3 pt-2">
          <div className="-mx-4 hide-scrollbar overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x px-4">
            <div className="flex w-max gap-2">
              {draft.media.map((item, tileIndex) => (
                <PostPublishMediaTile
                  key={item.id}
                  item={item}
                  sizePx={mediaTileSize}
                  compactBadge={isEditing}
                  onClick={(event) =>
                    handlePreviewFromImage(tileIndex, event.currentTarget)
                  }
                />
              ))}
              <PostPublishAddTile sizePx={mediaTileSize} />
            </div>
          </div>

          <div
            className="pt-3 transition-all duration-200 ease-out"
            style={{
              width: "358px",
              height: `${inputAreaHeight}px`,
            }}
            onClick={focusTitleInput}
          >
            <div className="w-full">
              <textarea
                ref={titleRef}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onFocus={handleTitleFocus}
                placeholder="Add a catchy title"
                aria-label="Add a catchy title"
                rows={1}
                className="app-token-placeholder block w-full resize-none overflow-hidden text-[15px] font-bold"
                style={{
                  ...TEXT_INPUT_STYLE,
                  minHeight: `${TITLE_MIN_HEIGHT}px`,
                  height: `${titleHeight}px`,
                }}
              />
            </div>

            <div
              className="my-[10px]"
              style={{ borderBottom: `0.5px solid ${PUBLISH_DIVIDER_BG}` }}
            />

            <div className="w-full">
              <textarea
                ref={descriptionRef}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                onFocus={handleDescriptionFocus}
                placeholder="Write a long description can help get 3x more views on average."
                aria-label="Write a long description"
                rows={1}
                className="app-token-placeholder block w-full resize-none text-[15px]"
                style={{
                  ...TEXT_INPUT_STYLE,
                  fontWeight: 400,
                  height: `${descriptionHeight}px`,
                  minHeight: `${DESCRIPTION_MIN_HEIGHT}px`,
                }}
              />
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2">
              {actionButtons.map((action) => (
                <PublishComposerIconButton key={action.id} ariaLabel={action.label}>
                  {action.icon}
                </PublishComposerIconButton>
              ))}
              <span
                className="h-4 w-px"
                style={{ backgroundColor: PUBLISH_DIVIDER_BG }}
              />
              <PublishComposerIconButton ariaLabel="Refine caption">
                <PublishListIconInk>
                  <TUXIconPenStar size={16} />
                </PublishListIconInk>
              </PublishComposerIconButton>
            </div>

            <PublishComposerIconButton
              ariaLabel={isEditing ? "Collapse composer" : "Expand composer"}
              onClick={!isEditing ? focusTitleInput : undefined}
            >
              <PublishListIconInk>
                {isEditing ? (
                  <TUXIconChevronCollapse size={16} />
                ) : (
                  <TUXIconChevronExpand size={16} />
                )}
              </PublishListIconInk>
            </PublishComposerIconButton>
          </div>
        </section>

        {!isEditing ? (
          <div className="px-4 pb-[15px] pt-[15px]">
            <div style={{ borderBottom: `0.5px solid ${PUBLISH_DIVIDER_BG}` }} />
          </div>
        ) : null}

        {!isEditing ? (
          <PublishSettingList showLocationHelp className="pb-4" />
        ) : null}
      </div>

      {!isEditing ? (
        <PublishBottomActions bottomInsetCss={bottomInsetCss} />
      ) : null}
    </div>
  );
}
