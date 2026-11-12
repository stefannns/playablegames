import { useCallback, useRef, type ReactNode } from "react";

import { useAppNavigation } from "../../../context/app_navigation";
import PagePushStage, { usePagePushStage } from "../../../hooks/page_push";
import { useTwoLevelRouteStackSync } from "../../../hooks/sync_route_page_stack";
import { CreationPublishPageContent } from "../components/creation_publish_page_content";
import PostPublishPage from "./post_publish_page";
import PostPublishPreviewPage from "./post_publish_preview_page";
import { creationBackPathForSub } from "../../../routes/app_route_tree";
import {
  creationPublishOriginFromRoute,
  postPublishPaths,
} from "./post_publish_paths";
import {
  consumeQueuedPostPublishSeed,
  getPostPublishOrigin,
  isPostPublishDraftSeeded,
  seedPostPublishDraft,
  seedPostPublishFromRouteOrigin,
  syncVideoPublishPosterFromCapture,
} from "./post_publish_store";

const PUBLISH_ROOT_KEY = "creation-publish";
const PREVIEW_DETAIL_ID = "creation-preview";

export type PostPublishFlowProps = {
  initialScreen: "publish" | "preview";
};

export default function PostPublishFlow({ initialScreen }: PostPublishFlowProps) {
  const { route, navigate } = useAppNavigation();
  const bootstrappedRef = useRef(false);

  if (!bootstrappedRef.current) {
    bootstrappedRef.current = true;
    const queued = consumeQueuedPostPublishSeed();
    const routeOrigin = creationPublishOriginFromRoute(route);
    if (queued) {
      seedPostPublishDraft(queued, routeOrigin ?? undefined);
    } else if (routeOrigin && !isPostPublishDraftSeeded()) {
      seedPostPublishFromRouteOrigin(routeOrigin);
    } else if (initialScreen === "publish" && !isPostPublishDraftSeeded()) {
      seedPostPublishDraft(
        routeOrigin === "edit-video" ? { kind: "video" } : { kind: "photo-text-demo" },
        routeOrigin ?? undefined,
      );
    }
  }

  const publishOrigin =
    creationPublishOriginFromRoute(route) ?? getPostPublishOrigin();
  const isVideoPublish = publishOrigin === "edit-video";

  function buildPublishPage(): ReactNode {
    function PublishStagePage() {
      if (isVideoPublish) {
        return (
          <CreationPublishPageContent
            onClose={() =>
              navigate(
                creationBackPathForSub({
                  screen: "publish",
                  origin: "edit-video",
                }),
              )
            }
            onOpenPreview={(imageIndex = 0, trigger) => openPreview(imageIndex, trigger)}
          />
        );
      }
      return <PostPublishPage onOpenPreview={openPreview} />;
    }

    return <PublishStagePage />;
  }

  function buildPreviewPage(): ReactNode {
    function PreviewStagePage() {
      return <PostPublishPreviewPage onBack={closePreview} />;
    }

    return <PreviewStagePage />;
  }

  const pageStage = usePagePushStage({
    initialPage:
      initialScreen === "preview" ? buildPreviewPage() : buildPublishPage(),
    initialKey: initialScreen === "preview" ? PREVIEW_DETAIL_ID : PUBLISH_ROOT_KEY,
    durationMs: 300,
    pageOffset: "24%",
  });
  const { pages, isTransitioning, push, pop, reset } = pageStage;

  const { markStackNavigation } = useTwoLevelRouteStackSync({
    tab: "creation",
    route,
    pages,
    isTransitioning,
    rootKey: PUBLISH_ROOT_KEY,
    detailKey: () => PREVIEW_DETAIL_ID,
    detailIdFromStackKey: (key) => (key === PREVIEW_DETAIL_ID ? key : null),
    getDetailId: (r) =>
      r.tab === "creation" && r.sub.screen === "preview" ? PREVIEW_DETAIL_ID : null,
    buildRoot: buildPublishPage,
    buildDetail: () => buildPreviewPage(),
    push,
    pop,
    reset,
  });

  const openPreview = useCallback(
    (_imageIndex: number, trigger?: HTMLElement) => {
      if (getPostPublishOrigin() === "edit-video") {
        syncVideoPublishPosterFromCapture();
      }
      markStackNavigation();
      navigate(postPublishPaths.preview(getPostPublishOrigin()));
      push({
        trigger,
        outgoingKey: PUBLISH_ROOT_KEY,
        outgoingPage: buildPublishPage(),
        incomingKey: PREVIEW_DETAIL_ID,
        incomingPage: buildPreviewPage(),
      });
    },
    [markStackNavigation, navigate, push],
  );

  const closePreview = useCallback(
    (trigger?: HTMLElement) => {
      markStackNavigation();
      navigate(
        creationBackPathForSub({
          screen: "preview",
          origin: getPostPublishOrigin(),
        }),
      );
      pop({
        trigger,
        incomingPage: buildPublishPage(),
        outgoingPage: buildPreviewPage(),
      });
    },
    [markStackNavigation, navigate, pop],
  );

  return <PagePushStage manager={pageStage} />;
}
