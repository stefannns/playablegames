import { useLayoutEffect, useRef, type ReactNode } from "react";

import type { AppRoute, AppTabId } from "../routes/app_route_tree";
import type { PagePopPayload, PagePushPayload } from "./page_push";

type StackPage = { key: string };

type TwoLevelStackSyncOptions = {
  tab: AppTabId;
  route: AppRoute | null;
  pages: readonly StackPage[];
  isTransitioning: boolean;
  rootKey: string;
  detailKey: (id: string) => string;
  detailIdFromStackKey: (key: string) => string | null;
  getDetailId: (route: AppRoute) => string | null;
  buildRoot: () => ReactNode;
  buildDetail: (id: string) => ReactNode;
  detailTransitionStyle?: (id: string) => PagePushPayload["transitionStyle"];
  detailIncomingPageOffset?: (id: string) => string | undefined;
  detailOutgoingPageOffset?: (id: string) => string | undefined;
  rootIncomingPageOffset?: (id: string) => string | undefined;
  push: (payload: PagePushPayload) => void;
  pop: (payload?: PagePopPayload) => void;
  reset: (page: ReactNode, key?: string) => void;
};

/**
 * 两级页内栈（根 → 详情）与 URL 对齐。
 *
 * 返回 `markStackNavigation`：应用内点击须先调用，再 `navigate` + `push`/`pop`，
 * 避免 sync effect 在转场中用 `reset` 打断动画。
 *
 * 示例：`inbox_page.tsx`、`friends_page.tsx`（Find Friends 用自建栈 + route effect）。
 * 三级 Profile：见 `profile_page.tsx`（`stackDrivenNavRef`）。
 *
 * 路由树：`app_route_tree.ts`。转场 API：`page_push.tsx`。
 */
export function useTwoLevelRouteStackSync({
  tab,
  route,
  pages,
  isTransitioning,
  rootKey,
  detailKey,
  detailIdFromStackKey,
  getDetailId,
  buildRoot,
  buildDetail,
  detailTransitionStyle,
  detailIncomingPageOffset,
  detailOutgoingPageOffset,
  rootIncomingPageOffset,
  push,
  pop,
  reset,
}: TwoLevelStackSyncOptions) {
  const stackDrivenNavRef = useRef(false);

  const markStackNavigation = () => {
    stackDrivenNavRef.current = true;
  };

  useLayoutEffect(() => {
    if (route?.tab !== tab) return;
    if (stackDrivenNavRef.current) {
      stackDrivenNavRef.current = false;
      return;
    }
    if (isTransitioning) return;

    const topKey = pages.at(-1)?.key;
    const detailId = getDetailId(route);

    if (detailId) {
      const targetKey = detailKey(detailId);
      if (topKey === targetKey) return;

      if (topKey === rootKey) {
        push({
          outgoingKey: rootKey,
          outgoingPage: buildRoot(),
          incomingKey: targetKey,
          incomingPage: buildDetail(detailId),
          transitionStyle: detailTransitionStyle?.(detailId),
          incomingPageOffset: detailIncomingPageOffset?.(detailId),
          outgoingPageOffset: detailOutgoingPageOffset?.(detailId),
        });
        return;
      }

      reset(buildDetail(detailId), targetKey);
      return;
    }

    if (topKey === rootKey && pages.length <= 1) return;

    if (pages.length > 1) {
      const leavingId = topKey ? detailIdFromStackKey(topKey) : null;
      pop({
        incomingPage: buildRoot(),
        incomingPageOffset: leavingId ? rootIncomingPageOffset?.(leavingId) : undefined,
        outgoingPage: leavingId ? buildDetail(leavingId) : buildRoot(),
        transitionStyle: leavingId ? detailTransitionStyle?.(leavingId) : undefined,
      });
      return;
    }

    reset(buildRoot(), rootKey);
    // buildRoot / buildDetail intentionally omitted — they change every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, tab, pages.at(-1)?.key, pages.length, isTransitioning, rootKey, push, pop, reset]);

  return { markStackNavigation };
}
