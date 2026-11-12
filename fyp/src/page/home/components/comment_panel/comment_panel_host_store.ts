import { useSyncExternalStore } from "react";
import type { CommentSheetMetrics } from "./comment_panel";
import type { CommentContentNode } from "./comment_content_config";
import type { CommentPipMedia } from "./comment_video_pip";

/**
 * 单例 CommentPanel 的"宿主"：home 页只挂载一份 CommentPanel，
 * 各 FeedItemCard 通过 register 注册自己的 pipMedia + squeeze handler，
 * 通过 openCommentPanelFor 触发打开。
 *
 * 这样即便 VerticalSnapPager 的 loop 模式把 feed 三倍克隆，
 * 也只有一份 CommentPanel DOM、一份 ResizeObserver、一份 mock 图预加载。
 */

type FeedBinding = {
  /** Stable feed id from `feed_item_card.config` (e.g. `feed-1`). */
  feedContentId: string | null;
  pipMedia: CommentPipMedia | null;
  applySqueeze: (metrics: CommentSheetMetrics) => void;
  preserveFeedChrome?: boolean;
  /** Comments posted in this session — shown at top of the panel list. */
  sessionComments?: CommentContentNode[];
  /** Fired when the user actually posts a comment (send / quick reaction). */
  onCommentPosted?: (text: string) => void;
  /** Mount point override, e.g. the playable play-mode overlay that sits above the app frame root. */
  root?: HTMLElement | null;
};

type HostState = {
  visible: boolean;
  /** 当前激活的 feed key（与 binding map 的 key 对应） */
  activeFeedKey: string | null;
  /** 每次 active binding 引用更新时自增，供消费者 useMemo 当依赖。 */
  bindingVersion: number;
};

let state: HostState = {
  visible: false,
  activeFeedKey: null,
  bindingVersion: 0,
};

const bindings = new Map<string, FeedBinding>();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(next: Partial<HostState>) {
  const merged = { ...state, ...next };
  if (
    merged.visible === state.visible &&
    merged.activeFeedKey === state.activeFeedKey &&
    merged.bindingVersion === state.bindingVersion
  ) {
    return;
  }
  state = merged;
  emit();
}

/**
 * 注册或更新某个 feed 的 binding。
 * 设计上**永不删除**——deps 变化时只更新引用，避免中间出现 binding 缺失
 * 导致 CommentVideoPiP 短暂卸载、续播状态丢失。
 * 真正的清理（feed 卡卸载或离开 active）由 unregisterCommentPanelFeedBinding 显式负责。
 */
export function registerCommentPanelFeedBinding(
  feedKey: string,
  binding: FeedBinding,
) {
  bindings.set(feedKey, binding);
  if (state.activeFeedKey === feedKey) {
    setState({ bindingVersion: state.bindingVersion + 1 });
  }
}

export function unregisterCommentPanelFeedBinding(feedKey: string) {
  bindings.delete(feedKey);
  if (state.activeFeedKey === feedKey && state.visible) {
    // 当前激活的 feed 真的离开了：关掉面板，避免错位。
    setState({ visible: false, activeFeedKey: null });
  }
}

export function updateCommentPanelFeedBinding(
  feedKey: string,
  binding: FeedBinding,
) {
  bindings.set(feedKey, binding);
  if (state.activeFeedKey === feedKey) {
    setState({ bindingVersion: state.bindingVersion + 1 });
  }
}

export function openCommentPanelFor(feedKey: string) {
  if (!bindings.has(feedKey)) return;
  setState({ visible: true, activeFeedKey: feedKey });
}

export function closeCommentPanel() {
  setState({ visible: false });
}

export function getActiveCommentPanelBinding(): FeedBinding | null {
  if (!state.activeFeedKey) return null;
  return bindings.get(state.activeFeedKey) ?? null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function useCommentPanelHost() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
