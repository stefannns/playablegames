/**
 * App URL 树与路由类型（约定权威来源）。
 *
 * ## 一级 Tab（`APP_TAB_ORDER`）
 * `/app/home` | `friends` | `creation` | `inbox` | `profile`
 * `/`、`/app` → 重定向 `/app/home`。
 *
 * ## 二级示例
 * - Friends / Inbox 私信：**不同 URL**（`/app/friends/message/:id` vs
 *   `/app/inbox/message/:id`），同 UI、返回栈归属不同 Tab。
 * - Find Friends（三级）：Tab → `find-friends` → `/:step`（`FIND_FRIENDS_STEPS`）。
 *   页内栈：Friends feed → Find Friends 根 → 子步（`friends_page` + `find_friends_page_content`）。
 * - Creation：`playable` | `create` | `live` | `album` | `edit-photo` | `edit-video` | `text-to-image` | `templates`；
 *   发布/预览为三级：`edit-photo/publish|preview`、`text-to-image/publish|preview`。
 *   配乐：`…/add-sound` → `…/add-sound/search` → `…/add-sound/discover`。
 *   返回上一级：`creationBackPathForSub`（与 Routes 树 `buildCreationRouteMenuBranches` 一致）。
 * - Profile：`menu` | `settings`（三级栈见 `profile_page.tsx`）。
 *
 * ## 导航 API
 * `useAppNavigation()` + `appPathForTab` / `appPathForRoute` / `parseAppPathname`。
 * 桌面 Routes 菜单：`buildAppRouteTree()`。
 *
 * ## 页内栈（须与 URL 同步，见 `page_push.tsx`）
 * 应用内：`markStackNavigation()` → `navigate()` → `push()`/`pop()`。
 * 两级屏：`useTwoLevelRouteStackSync`（Inbox/Friends 等）。
 * 禁止：仅 `reset()` 对 URL；仅改 URL 不 push/pop；无条件 `reset` 同步 URL。
 *
 * ## 新增路由检查
 * 1. 本文件：`parseAppPathname`、`appPathForRoute`、`buildAppRouteTree`
 * 2. `App.tsx`：新 Tab → `APP_TAB_ORDER` + `Tabbar`
 * 3. 对应 `*_page.tsx`：栈同步 + 动画
 * 4. Message 类：Friends / Inbox 各一条 URL
 */

import { inboxRowById, inboxStoryById } from "../page/inbox/inbox_page.config";

export const APP_ROOT_PATH = "/app";

/** Default thread when jumping to Message from the desktop Routes menu. */
export const ROUTES_MENU_DEFAULT_MESSAGE_ID = "cenis";
export const ROUTES_MENU_DEFAULT_STORY_ID = "curiosity";

export const APP_TAB_ORDER = [
  "home",
  "friends",
  "creation",
  "inbox",
  "profile",
] as const;

export type AppTabId = (typeof APP_TAB_ORDER)[number];

/** Nested Find Friends screens (URL segment under `…/find-friends/:step`). */
export const FIND_FRIENDS_STEPS = [
  "connect-now",
  "my-college",
  "qr",
  "contacts",
  "facebook",
  "scan",
  "search",
] as const;

export type FindFriendsStep = (typeof FIND_FRIENDS_STEPS)[number];

export function isFindFriendsStep(value: string): value is FindFriendsStep {
  return (FIND_FRIENDS_STEPS as readonly string[]).includes(value);
}

export function findFriendsStepLabel(step: FindFriendsStep): string {
  switch (step) {
    case "connect-now":
      return "Connect now";
    case "my-college":
      return "My college";
    case "qr":
      return "QR code";
    case "contacts":
      return "Contacts";
    case "facebook":
      return "Facebook friends";
    case "scan":
      return "Scan";
    case "search":
      return "Search";
    default:
      return step;
  }
}

function findFriendsPathForTab(tab: "friends" | "profile", step?: FindFriendsStep): string {
  const base = `${APP_ROOT_PATH}/${tab}/find-friends`;
  return step ? `${base}/${step}` : base;
}

export type FriendsSubRoute =
  | { screen: "feed" }
  | { screen: "find-friends"; step?: FindFriendsStep }
  | { screen: "message"; peerId: string }
  | { screen: "story"; storyId: string };

export type InboxSubRoute =
  | { screen: "list" }
  | { screen: "message"; threadId: string }
  | { screen: "story"; storyId: string };

export type ProfileSubRoute =
  | { screen: "profile" }
  | { screen: "menu" }
  | { screen: "settings" }
  | { screen: "find-friends"; step?: FindFriendsStep };

export type HomeSubRoute =
  | { screen: "playable" }
  | { screen: "feed" }
  | { screen: "search-middle" }
  | { screen: "search-result" }
  | { screen: "search-landing" };

/** Where sound search / discover was opened from (encoded in URL for back navigation). */
export type SoundSearchOrigin =
  | "studio"
  | "edit-photo"
  | "edit-video"
  | "text-to-image-templates";

/** Parent flow for unified post publish / preview (level-3 under Creation). */
export type CreationPostPublishOrigin = "edit-photo" | "text-to-image" | "edit-video";

export type CreationSubRoute =
  | { screen: "studio" }
  | { screen: "playable" }
  | { screen: "create" }
  | { screen: "live" }
  | { screen: "album" }
  | { screen: "edit-photo" }
  | { screen: "edit-video" }
  | { screen: "text-to-image" }
  | { screen: "text-to-image-templates" }
  | { screen: "publish"; origin: CreationPostPublishOrigin }
  | { screen: "preview"; origin: CreationPostPublishOrigin }
  | { screen: "add-sound"; origin: SoundSearchOrigin }
  | { screen: "sound-search"; origin: SoundSearchOrigin }
  | { screen: "sound-discover"; origin: SoundSearchOrigin };

export type AppTabSubRoute =
  | { tab: "home"; sub: HomeSubRoute }
  | { tab: "friends"; sub: FriendsSubRoute }
  | { tab: "creation"; sub: CreationSubRoute }
  | { tab: "inbox"; sub: InboxSubRoute }
  | { tab: "profile"; sub: ProfileSubRoute };

export type AppRoute = AppTabSubRoute;

export type ParsedLocation =
  | { kind: "redirect"; to: string }
  | { kind: "app"; route: AppRoute }
  | { kind: "unknown"; pathname: string };

export type RouteTreeNode = {
  id: string;
  label: string;
  path: string;
  depth: number;
  children?: RouteTreeNode[];
  /** Any matching pathname marks this menu row as Current (e.g. all message threads). */
  matchesPathname?: (pathname: string) => boolean;
};

export function tabToIndex(tab: AppTabId): number {
  return APP_TAB_ORDER.indexOf(tab);
}

export function indexToTab(index: number): AppTabId {
  return APP_TAB_ORDER[index] ?? "home";
}

export function appPathForTab(tab: AppTabId): string {
  return `${APP_ROOT_PATH}/${tab}`;
}

export function appPathForRoute(route: AppRoute): string {
  switch (route.tab) {
    case "home":
      if (route.sub.screen === "playable") return `${APP_ROOT_PATH}/home/playable`;
      if (route.sub.screen === "search-landing") {
        return `${APP_ROOT_PATH}/home/search/landing`;
      }
      if (route.sub.screen === "search-result") {
        return `${APP_ROOT_PATH}/home/search/result`;
      }
      if (route.sub.screen === "search-middle") {
        return `${APP_ROOT_PATH}/home/search/middle`;
      }
      return appPathForTab("home");
    case "creation":
      if (route.sub.screen === "add-sound") {
        return addSoundPath(route.sub.origin);
      }
      if (route.sub.screen === "sound-search") {
        return soundSearchPath(route.sub.origin);
      }
      if (route.sub.screen === "sound-discover") {
        return soundDiscoverPath(route.sub.origin);
      }
      if (route.sub.screen === "album") {
        return `${APP_ROOT_PATH}/creation/album`;
      }
      if (route.sub.screen === "edit-photo") {
        return `${APP_ROOT_PATH}/creation/edit-photo`;
      }
      if (route.sub.screen === "edit-video") {
        return `${APP_ROOT_PATH}/creation/edit-video`;
      }
      if (route.sub.screen === "text-to-image-templates") {
        return `${APP_ROOT_PATH}/creation/text-to-image/templates`;
      }
      if (route.sub.screen === "text-to-image") {
        return `${APP_ROOT_PATH}/creation/text-to-image`;
      }
      if (route.sub.screen === "publish") {
        return `${APP_ROOT_PATH}/creation/${route.sub.origin}/publish`;
      }
      if (route.sub.screen === "preview") {
        return `${APP_ROOT_PATH}/creation/${route.sub.origin}/preview`;
      }
      if (route.sub.screen === "playable") {
        return `${APP_ROOT_PATH}/creation/playable`;
      }
      if (route.sub.screen === "create") {
        return `${APP_ROOT_PATH}/creation/create`;
      }
      if (route.sub.screen === "live") {
        return `${APP_ROOT_PATH}/creation/live`;
      }
      return appPathForTab("creation");
    case "friends":
      if (route.sub.screen === "message")
        return `${APP_ROOT_PATH}/friends/message/${encodeURIComponent(route.sub.peerId)}`;
      if (route.sub.screen === "find-friends")
        return findFriendsPathForTab("friends", route.sub.step);
      if (route.sub.screen === "story")
        return `${APP_ROOT_PATH}/friends/story/${encodeURIComponent(route.sub.storyId)}`;
      return appPathForTab("friends");
    case "inbox":
      if (route.sub.screen === "message") {
        return `${APP_ROOT_PATH}/inbox/message/${encodeURIComponent(route.sub.threadId)}`;
      }
      if (route.sub.screen === "story") {
        return `${APP_ROOT_PATH}/inbox/story/${encodeURIComponent(route.sub.storyId)}`;
      }
      return appPathForTab("inbox");
    case "profile":
      if (route.sub.screen === "menu") return `${APP_ROOT_PATH}/profile/menu`;
      if (route.sub.screen === "settings") return `${APP_ROOT_PATH}/profile/settings`;
      if (route.sub.screen === "find-friends")
        return findFriendsPathForTab("profile", route.sub.step);
      return appPathForTab("profile");
    default:
      return appPathForTab("home");
  }
}

function parseFriendsRest(rest: string): FriendsSubRoute {
  const messageMatch = rest.match(/^(?:message|chat)\/([^/]+)$/);
  if (messageMatch) {
    return { screen: "message", peerId: decodeURIComponent(messageMatch[1]) };
  }
  const findFriendsMatch = rest.match(/^find-friends(?:\/([^/]+))?$/);
  if (findFriendsMatch) {
    const stepRaw = findFriendsMatch[1];
    if (stepRaw && isFindFriendsStep(stepRaw)) {
      return { screen: "find-friends", step: stepRaw };
    }
    if (!stepRaw) {
      return { screen: "find-friends" };
    }
  }
  const storyMatch = rest.match(/^story\/([^/]+)$/);
  if (storyMatch) {
    return { screen: "story", storyId: decodeURIComponent(storyMatch[1]) };
  }
  return { screen: "feed" };
}

function parseInboxRest(rest: string): InboxSubRoute {
  const messageMatch = rest.match(/^(?:message|thread)\/([^/]+)$/);
  if (messageMatch) {
    return { screen: "message", threadId: decodeURIComponent(messageMatch[1]) };
  }
  const storyMatch = rest.match(/^story\/([^/]+)$/);
  if (storyMatch) {
    return { screen: "story", storyId: decodeURIComponent(storyMatch[1]) };
  }
  return { screen: "list" };
}

function parseHomeRest(rest: string): HomeSubRoute {
  if (rest === "playable") return { screen: "playable" };
  if (rest === "search/landing") {
    return { screen: "search-landing" };
  }
  if (rest === "search/result") {
    return { screen: "search-result" };
  }
  if (rest === "search/middle") {
    return { screen: "search-middle" };
  }
  return { screen: "feed" };
}

function parseCreationRest(rest: string): CreationSubRoute {
  if (rest === "edit-photo/add-sound/search") {
    return { screen: "sound-search", origin: "edit-photo" };
  }
  if (rest === "edit-photo/add-sound/discover") {
    return { screen: "sound-discover", origin: "edit-photo" };
  }
  if (rest === "edit-photo/add-sound") {
    return { screen: "add-sound", origin: "edit-photo" };
  }
  if (rest === "edit-video/add-sound/search") {
    return { screen: "sound-search", origin: "edit-video" };
  }
  if (rest === "edit-video/add-sound/discover") {
    return { screen: "sound-discover", origin: "edit-video" };
  }
  if (rest === "edit-video/add-sound") {
    return { screen: "add-sound", origin: "edit-video" };
  }
  if (rest === "text-to-image/templates/add-sound/search") {
    return { screen: "sound-search", origin: "text-to-image-templates" };
  }
  if (rest === "text-to-image/templates/add-sound/discover") {
    return { screen: "sound-discover", origin: "text-to-image-templates" };
  }
  if (rest === "text-to-image/templates/add-sound") {
    return { screen: "add-sound", origin: "text-to-image-templates" };
  }
  if (rest === "add-sound/search") {
    return { screen: "sound-search", origin: "studio" };
  }
  if (rest === "add-sound/discover") {
    return { screen: "sound-discover", origin: "studio" };
  }
  if (rest === "add-sound") {
    return { screen: "add-sound", origin: "studio" };
  }
  if (rest === "playable") {
    return { screen: "playable" };
  }
  if (rest === "create") {
    return { screen: "create" };
  }
  if (rest === "live") {
    return { screen: "live" };
  }
  if (rest === "album") {
    return { screen: "album" };
  }
  if (rest === "edit-photo") {
    return { screen: "edit-photo" };
  }
  if (rest === "edit-video/publish") {
    return { screen: "publish", origin: "edit-video" };
  }
  if (rest === "edit-video/preview") {
    return { screen: "preview", origin: "edit-video" };
  }
  if (rest === "edit-video") {
    return { screen: "edit-video" };
  }
  if (rest === "text-to-image/templates") {
    return { screen: "text-to-image-templates" };
  }
  if (rest === "edit-photo/publish") {
    return { screen: "publish", origin: "edit-photo" };
  }
  if (rest === "edit-photo/preview") {
    return { screen: "preview", origin: "edit-photo" };
  }
  if (rest === "text-to-image/publish") {
    return { screen: "publish", origin: "text-to-image" };
  }
  if (rest === "text-to-image/preview") {
    return { screen: "preview", origin: "text-to-image" };
  }
  if (rest === "text-to-image") {
    return { screen: "text-to-image" };
  }
  return { screen: "studio" };
}

function soundFlowBasePath(origin: SoundSearchOrigin): string {
  switch (origin) {
    case "edit-photo":
      return `${APP_ROOT_PATH}/creation/edit-photo/add-sound`;
    case "edit-video":
      return `${APP_ROOT_PATH}/creation/edit-video/add-sound`;
    case "text-to-image-templates":
      return `${APP_ROOT_PATH}/creation/text-to-image/templates/add-sound`;
    default:
      return `${APP_ROOT_PATH}/creation/add-sound`;
  }
}

export function addSoundPath(origin: SoundSearchOrigin): string {
  return soundFlowBasePath(origin);
}

export function soundSearchPath(origin: SoundSearchOrigin): string {
  return `${soundFlowBasePath(origin)}/search`;
}

export function soundDiscoverPath(origin: SoundSearchOrigin): string {
  return `${soundFlowBasePath(origin)}/discover`;
}

/**
 * Creation 屏的上一级路径（与 Routes 树父子关系一致，返回按钮统一走这里）。
 * 菜单嵌套见 `buildCreationRouteMenuBranches()`。
 */
export function creationBackPathForSub(sub: CreationSubRoute): string {
  switch (sub.screen) {
    case "sound-discover":
      return soundSearchPath(sub.origin);
    case "sound-search":
      return addSoundPath(sub.origin);
    case "add-sound":
      return creationReturnPathForSoundOrigin(sub.origin);
    case "preview":
      return appPathForRoute({
        tab: "creation",
        sub: { screen: "publish", origin: sub.origin },
      });
    case "publish":
      return appPathForRoute({
        tab: "creation",
        sub:
          sub.origin === "text-to-image"
            ? { screen: "text-to-image-templates" }
            : sub.origin === "edit-video"
              ? { screen: "edit-video" }
              : { screen: "edit-photo" },
      });
    case "text-to-image-templates":
      return appPathForRoute({ tab: "creation", sub: { screen: "text-to-image" } });
    case "album":
    case "playable":
    case "create":
    case "live":
      return appPathForTab("creation");
    case "edit-photo":
    case "edit-video":
    case "text-to-image":
    case "studio":
      return appPathForTab("creation");
    default:
      return appPathForTab("creation");
  }
}

export function creationBackPathForRoute(route: AppRoute): string | null {
  if (route.tab !== "creation") return null;
  return creationBackPathForSub(route.sub);
}

export function creationBackPathForPathname(pathname: string): string | null {
  const parsed = parseAppPathname(pathname);
  if (parsed.kind !== "app") return null;
  return creationBackPathForRoute(parsed.route);
}

/** Add sound 的上一级（按 origin 回到对应编辑/模板页）。 */
export function creationReturnPathForSoundOrigin(origin: SoundSearchOrigin): string {
  switch (origin) {
    case "edit-photo":
      return appPathForRoute({ tab: "creation", sub: { screen: "edit-photo" } });
    case "edit-video":
      return appPathForRoute({ tab: "creation", sub: { screen: "edit-video" } });
    case "text-to-image-templates":
      return appPathForRoute({
        tab: "creation",
        sub: { screen: "text-to-image-templates" },
      });
    default:
      return appPathForTab("creation");
  }
}

/** Origin encoded in URL when on search/discover; otherwise inferred from the current Creation screen. */
export function soundSearchOriginFromRoute(route: AppRoute | null | undefined): SoundSearchOrigin {
  if (!route || route.tab !== "creation") return "studio";
  const sub = route.sub;
  if (
    sub.screen === "add-sound" ||
    sub.screen === "sound-search" ||
    sub.screen === "sound-discover"
  ) {
    return sub.origin;
  }
  if (sub.screen === "edit-photo") return "edit-photo";
  if (sub.screen === "edit-video") return "edit-video";
  if (sub.screen === "text-to-image-templates") return "text-to-image-templates";
  return "studio";
}

function parseProfileRest(rest: string): ProfileSubRoute {
  if (rest === "menu") return { screen: "menu" };
  if (rest === "settings") return { screen: "settings" };
  const findFriendsMatch = rest.match(/^find-friends(?:\/([^/]+))?$/);
  if (findFriendsMatch) {
    const stepRaw = findFriendsMatch[1];
    if (stepRaw && isFindFriendsStep(stepRaw)) {
      return { screen: "find-friends", step: stepRaw };
    }
    if (!stepRaw) {
      return { screen: "find-friends" };
    }
  }
  return { screen: "profile" };
}

/** Legacy standalone / demo paths → canonical app home. */
function legacyRedirectTarget(pathname: string): string | null {
  if (pathname === "/router_page" || pathname === "/demo/router") {
    return appPathForTab("home");
  }
  if (pathname === "/app/creation/ai-portrait") {
    return appPathForTab("creation");
  }
  if (pathname === "/edit_photo") {
    return `${APP_ROOT_PATH}/creation/edit-photo`;
  }
  if (pathname === "/edit_video") {
    return `${APP_ROOT_PATH}/creation/edit-video`;
  }
  if (pathname === "/text_to_image") {
    return `${APP_ROOT_PATH}/creation/text-to-image`;
  }
  if (pathname === "/template_select") {
    return `${APP_ROOT_PATH}/creation/text-to-image/templates`;
  }
  if (pathname === "/publish") {
    return `${APP_ROOT_PATH}/creation/edit-photo/publish`;
  }
  if (pathname === `${APP_ROOT_PATH}/creation/publish`) {
    return `${APP_ROOT_PATH}/creation/edit-photo/publish`;
  }
  if (pathname === `${APP_ROOT_PATH}/creation/preview`) {
    return `${APP_ROOT_PATH}/creation/edit-photo/preview`;
  }
  const soundLegacyRedirects: Record<string, string> = {
    [`${APP_ROOT_PATH}/creation/sound-search`]: soundSearchPath("studio"),
    [`${APP_ROOT_PATH}/creation/sound-discover`]: soundDiscoverPath("studio"),
    [`${APP_ROOT_PATH}/creation/edit-photo/sound-search`]: soundSearchPath("edit-photo"),
    [`${APP_ROOT_PATH}/creation/edit-photo/sound-discover`]: soundDiscoverPath("edit-photo"),
    [`${APP_ROOT_PATH}/creation/edit-video/sound-search`]: soundSearchPath("edit-video"),
    [`${APP_ROOT_PATH}/creation/edit-video/sound-discover`]: soundDiscoverPath("edit-video"),
    [`${APP_ROOT_PATH}/creation/text-to-image/templates/sound-search`]:
      soundSearchPath("text-to-image-templates"),
    [`${APP_ROOT_PATH}/creation/text-to-image/templates/sound-discover`]:
      soundDiscoverPath("text-to-image-templates"),
  };
  if (soundLegacyRedirects[pathname]) {
    return soundLegacyRedirects[pathname];
  }
  const legacyMessage = pathname.match(/^\/app\/(friends\/chat|inbox\/thread)\/([^/]+)$/);
  if (legacyMessage) {
    const [, segment, id] = legacyMessage;
    return segment.startsWith("friends")
      ? `${APP_ROOT_PATH}/friends/message/${id}`
      : `${APP_ROOT_PATH}/inbox/message/${id}`;
  }
  return null;
}

export function parseAppPathname(pathname: string): ParsedLocation {
  const normalized = pathname.replace(/\/+$/, "") || "/";

  const legacyTo = legacyRedirectTarget(normalized);
  if (legacyTo) {
    return { kind: "redirect", to: legacyTo };
  }

  if (normalized === "/" || normalized === APP_ROOT_PATH) {
    return { kind: "redirect", to: appPathForTab("home") };
  }

  const match = normalized.match(/^\/app\/([^/]+)(?:\/(.*))?$/);
  if (!match) {
    return { kind: "unknown", pathname: normalized };
  }

  const tab = match[1] as AppTabId;
  const rest = match[2] ?? "";

  if (!APP_TAB_ORDER.includes(tab)) {
    return { kind: "unknown", pathname: normalized };
  }

  switch (tab) {
    case "home":
      return { kind: "app", route: { tab: "home", sub: parseHomeRest(rest) } };
    case "creation":
      return { kind: "app", route: { tab: "creation", sub: parseCreationRest(rest) } };
    case "friends":
      return { kind: "app", route: { tab: "friends", sub: parseFriendsRest(rest) } };
    case "inbox":
      return { kind: "app", route: { tab: "inbox", sub: parseInboxRest(rest) } };
    case "profile":
      return { kind: "app", route: { tab: "profile", sub: parseProfileRest(rest) } };
    default:
      return { kind: "unknown", pathname: normalized };
  }
}

function leaf(id: string, label: string, path: string, depth: number): RouteTreeNode {
  return { id, label, path, depth };
}

function isFriendsMessagePath(pathname: string): boolean {
  const parsed = parseAppPathname(pathname);
  return parsed.kind === "app" && parsed.route.tab === "friends" && parsed.route.sub.screen === "message";
}

function isFindFriendsRootPath(pathname: string, tab: "friends" | "profile"): boolean {
  const parsed = parseAppPathname(pathname);
  if (parsed.kind !== "app" || parsed.route.tab !== tab) return false;
  if (parsed.route.sub.screen !== "find-friends") return false;
  return parsed.route.sub.step === undefined;
}

function isFriendsFindFriendsRootPath(pathname: string): boolean {
  return isFindFriendsRootPath(pathname, "friends");
}

function isProfileFindFriendsRootPath(pathname: string): boolean {
  return isFindFriendsRootPath(pathname, "profile");
}

function findFriendsStepMenuLeaves(
  tab: "friends" | "profile",
  tabId: string,
  depth: number,
): RouteTreeNode[] {
  return FIND_FRIENDS_STEPS.map((step) =>
    leaf(
      `${tabId}-find-friends-${step}`,
      findFriendsStepLabel(step),
      appPathForRoute({ tab, sub: { screen: "find-friends", step } }),
      depth,
    ),
  );
}

function findFriendsMenuBranch(
  tab: "friends" | "profile",
  tabId: string,
  nodeId: string,
): RouteTreeNode {
  return {
    ...leaf(
      nodeId,
      "Find friends",
      appPathForRoute({ tab, sub: { screen: "find-friends" } }),
      1,
    ),
    matchesPathname:
      tab === "friends" ? isFriendsFindFriendsRootPath : isProfileFindFriendsRootPath,
    children: findFriendsStepMenuLeaves(tab, tabId, 2),
  };
}

function isInboxMessagePath(pathname: string): boolean {
  const parsed = parseAppPathname(pathname);
  return parsed.kind === "app" && parsed.route.tab === "inbox" && parsed.route.sub.screen === "message";
}

function isInboxStoryPath(pathname: string): boolean {
  const parsed = parseAppPathname(pathname);
  return parsed.kind === "app" && parsed.route.tab === "inbox" && parsed.route.sub.screen === "story";
}

function isCreationPostPublishPath(
  pathname: string,
  origin: CreationPostPublishOrigin,
): boolean {
  const parsed = parseAppPathname(pathname);
  return (
    parsed.kind === "app" &&
    parsed.route.tab === "creation" &&
    parsed.route.sub.screen === "publish" &&
    parsed.route.sub.origin === origin
  );
}

function isCreationPostPreviewPath(
  pathname: string,
  origin: CreationPostPublishOrigin,
): boolean {
  const parsed = parseAppPathname(pathname);
  return (
    parsed.kind === "app" &&
    parsed.route.tab === "creation" &&
    parsed.route.sub.screen === "preview" &&
    parsed.route.sub.origin === origin
  );
}

function isCreationEditPhotoPath(pathname: string): boolean {
  const parsed = parseAppPathname(pathname);
  return (
    parsed.kind === "app" &&
    parsed.route.tab === "creation" &&
    parsed.route.sub.screen === "edit-photo"
  );
}

function isCreationEditVideoPath(pathname: string): boolean {
  const parsed = parseAppPathname(pathname);
  return (
    parsed.kind === "app" &&
    parsed.route.tab === "creation" &&
    parsed.route.sub.screen === "edit-video"
  );
}

function isCreationTextToImageTemplatesPath(pathname: string): boolean {
  const parsed = parseAppPathname(pathname);
  return (
    parsed.kind === "app" &&
    parsed.route.tab === "creation" &&
    parsed.route.sub.screen === "text-to-image-templates"
  );
}

function isCreationAddSoundPath(pathname: string): boolean {
  const parsed = parseAppPathname(pathname);
  return (
    parsed.kind === "app" &&
    parsed.route.tab === "creation" &&
    parsed.route.sub.screen === "add-sound"
  );
}

function isCreationSoundSearchPath(pathname: string): boolean {
  const parsed = parseAppPathname(pathname);
  return (
    parsed.kind === "app" &&
    parsed.route.tab === "creation" &&
    parsed.route.sub.screen === "sound-search"
  );
}

function isCreationSoundDiscoverPath(pathname: string): boolean {
  const parsed = parseAppPathname(pathname);
  return (
    parsed.kind === "app" &&
    parsed.route.tab === "creation" &&
    parsed.route.sub.screen === "sound-discover"
  );
}

function isHomeSearchMiddlePath(pathname: string): boolean {
  const parsed = parseAppPathname(pathname);
  return (
    parsed.kind === "app" &&
    parsed.route.tab === "home" &&
    parsed.route.sub.screen === "search-middle"
  );
}

function isHomeSearchResultPath(pathname: string): boolean {
  const parsed = parseAppPathname(pathname);
  return (
    parsed.kind === "app" &&
    parsed.route.tab === "home" &&
    parsed.route.sub.screen === "search-result"
  );
}

function isHomeSearchLandingPath(pathname: string): boolean {
  const parsed = parseAppPathname(pathname);
  return (
    parsed.kind === "app" &&
    parsed.route.tab === "home" &&
    parsed.route.sub.screen === "search-landing"
  );
}

function buildHomeSearchRouteMenuBranch(): RouteTreeNode {
  return {
    ...leaf(
      "search-middle",
      "Search",
      appPathForRoute({ tab: "home", sub: { screen: "search-middle" } }),
      1,
    ),
    matchesPathname: isHomeSearchMiddlePath,
    children: [
      {
        ...leaf(
          "search-result",
          "Result",
          appPathForRoute({ tab: "home", sub: { screen: "search-result" } }),
          2,
        ),
        matchesPathname: isHomeSearchResultPath,
        children: [
          {
            ...leaf(
              "search-landing",
              "Landing",
              appPathForRoute({
                tab: "home",
                sub: { screen: "search-landing" },
              }),
              3,
            ),
            matchesPathname: isHomeSearchLandingPath,
          },
        ],
      },
    ],
  };
}

/** Conversation title for Routes label suffix (`·`); falls back to raw id. */
export function messageDisplayName(conversationId: string): string {
  return inboxRowById(conversationId)?.title ?? conversationId;
}

export function storyDisplayName(storyId: string): string {
  return inboxStoryById(storyId)?.name ?? storyId;
}

export function nestedScreenLabel(
  tabLabel: string,
  screenLabel: string,
  detailName?: string,
): string {
  const base = `${tabLabel} / ${screenLabel}`;
  return detailName ? `${base} · ${detailName}` : base;
}

/** Same matching rules as the Routes menu `Current` badge. */
export function routeTreeNodeMatchesPathname(
  pathname: string,
  node: RouteTreeNode,
): boolean {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (node.matchesPathname?.(normalized)) return true;
  return normalized === node.path;
}

/** Deepest Routes menu label for a pathname (e.g. `Creation / Create`). */
export function routeMenuLabelForPathname(
  pathname: string,
  nodes: RouteTreeNode[] = buildAppRouteTree(),
): string {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  let bestLabel = "Home";
  let bestDepth = -1;

  const walk = (list: RouteTreeNode[], prefix: string) => {
    for (const node of list) {
      const label = prefix ? `${prefix} / ${node.label}` : node.label;
      if (
        routeTreeNodeMatchesPathname(normalized, node) &&
        node.depth > bestDepth
      ) {
        bestDepth = node.depth;
        bestLabel = label;
      }
      if (node.children?.length) {
        walk(node.children, label);
      }
    }
  };

  walk(nodes, "");
  return bestLabel;
}

function postPublishMenuBranch(
  origin: CreationPostPublishOrigin,
  idPrefix: string,
  depth: number,
): RouteTreeNode {
  return {
    ...leaf(
      `${idPrefix}-publish`,
      "Post Publish",
      appPathForRoute({ tab: "creation", sub: { screen: "publish", origin } }),
      depth,
    ),
    matchesPathname: (pathname) => isCreationPostPublishPath(pathname, origin),
    children: [
      {
        ...leaf(
          `${idPrefix}-preview`,
          "Post Preview",
          appPathForRoute({ tab: "creation", sub: { screen: "preview", origin } }),
          depth + 1,
        ),
        matchesPathname: (pathname) => isCreationPostPreviewPath(pathname, origin),
      },
    ],
  };
}

function addSoundMenuBranch(origin: SoundSearchOrigin, depth: number): RouteTreeNode {
  return {
    ...leaf("creation-add-sound", "Add sound", addSoundPath(origin), depth),
    matchesPathname: isCreationAddSoundPath,
    children: [
      {
        ...leaf(
          "creation-add-sound-search",
          "Search",
          soundSearchPath(origin),
          depth + 1,
        ),
        matchesPathname: isCreationSoundSearchPath,
        children: [
          {
            ...leaf(
              "creation-add-sound-discover",
              "Discover",
              soundDiscoverPath(origin),
              depth + 2,
            ),
            matchesPathname: isCreationSoundDiscoverPath,
          },
        ],
      },
    ],
  };
}

/** Creation Tab 下 Routes 树分支（嵌套与 `creationBackPathForSub` 一致）。 */
function buildCreationRouteMenuBranches(): RouteTreeNode[] {
  return [
    leaf("creation-playable", "Playable", appPathForRoute({ tab: "creation", sub: { screen: "playable" } }), 1),
    {
      ...leaf(
        "creation-create",
        "Create",
        appPathForRoute({ tab: "creation", sub: { screen: "create" } }),
        1,
      ),
      matchesPathname: (pathname) => {
        const parsed = parseAppPathname(pathname);
        return (
          parsed.kind === "app" &&
          parsed.route.tab === "creation" &&
          parsed.route.sub.screen === "create"
        );
      },
    },
    {
      ...leaf(
        "creation-live",
        "Live",
        appPathForRoute({ tab: "creation", sub: { screen: "live" } }),
        1,
      ),
      matchesPathname: (pathname) => {
        const parsed = parseAppPathname(pathname);
        return (
          parsed.kind === "app" &&
          parsed.route.tab === "creation" &&
          parsed.route.sub.screen === "live"
        );
      },
    },
    {
      ...leaf(
        "creation-album",
        "Album",
        appPathForRoute({ tab: "creation", sub: { screen: "album" } }),
        1,
      ),
      matchesPathname: (pathname) => {
        const parsed = parseAppPathname(pathname);
        return (
          parsed.kind === "app" &&
          parsed.route.tab === "creation" &&
          parsed.route.sub.screen === "album"
        );
      },
    },
    {
      ...leaf(
        "creation-edit-photo",
        "Edit Photo",
        appPathForRoute({ tab: "creation", sub: { screen: "edit-photo" } }),
        1,
      ),
      matchesPathname: isCreationEditPhotoPath,
      children: [
        postPublishMenuBranch("edit-photo", "creation-edit-photo", 2),
        addSoundMenuBranch("edit-photo", 2),
      ],
    },
    {
      ...leaf(
        "creation-edit-video",
        "Edit Video",
        appPathForRoute({ tab: "creation", sub: { screen: "edit-video" } }),
        1,
      ),
      matchesPathname: isCreationEditVideoPath,
      children: [postPublishMenuBranch("edit-video", "creation-edit-video", 2)],
    },
    {
      ...leaf(
        "creation-text-to-image",
        "Text to Image",
        appPathForRoute({ tab: "creation", sub: { screen: "text-to-image" } }),
        1,
      ),
      matchesPathname: (pathname) => {
        const parsed = parseAppPathname(pathname);
        return (
          parsed.kind === "app" &&
          parsed.route.tab === "creation" &&
          parsed.route.sub.screen === "text-to-image"
        );
      },
      children: [
        {
          ...leaf(
            "creation-text-to-image-templates",
            "Templates",
            appPathForRoute({
              tab: "creation",
              sub: { screen: "text-to-image-templates" },
            }),
            2,
          ),
          matchesPathname: isCreationTextToImageTemplatesPath,
          children: [postPublishMenuBranch("text-to-image", "creation-text-to-image", 3)],
        },
      ],
    },
  ];
}

/** Desktop Routes menu: five tabs + nested screens (message under Friends vs Inbox). */
export function buildAppRouteTree(): RouteTreeNode[] {
  return [
    {
      id: "tab-home",
      label: "Home",
      path: appPathForTab("home"),
      depth: 0,
      children: [buildHomeSearchRouteMenuBranch(), leaf("home-playable", "Playable", "/app/home/playable", 1)],
    },
    {
      id: "tab-friends",
      label: "Friends",
      path: appPathForTab("friends"),
      depth: 0,
      children: [
        findFriendsMenuBranch("friends", "friends", "friends-find-friends"),
        {
          ...leaf(
            "friends-message",
            "Message",
            appPathForRoute({
              tab: "friends",
              sub: { screen: "message", peerId: ROUTES_MENU_DEFAULT_MESSAGE_ID },
            }),
            1,
          ),
          matchesPathname: isFriendsMessagePath,
        },
      ],
    },
    {
      id: "tab-creation",
      label: "Creation",
      path: appPathForTab("creation"),
      depth: 0,
      children: buildCreationRouteMenuBranches(),
    },
    {
      id: "tab-inbox",
      label: "Inbox",
      path: appPathForTab("inbox"),
      depth: 0,
      children: [
        {
          ...leaf(
            "inbox-message",
            "Message",
            appPathForRoute({
              tab: "inbox",
              sub: { screen: "message", threadId: ROUTES_MENU_DEFAULT_MESSAGE_ID },
            }),
            1,
          ),
          matchesPathname: isInboxMessagePath,
        },
        {
          ...leaf(
            "inbox-story",
            "Story",
            appPathForRoute({
              tab: "inbox",
              sub: { screen: "story", storyId: ROUTES_MENU_DEFAULT_STORY_ID },
            }),
            1,
          ),
          matchesPathname: isInboxStoryPath,
        },
      ],
    },
    {
      id: "tab-profile",
      label: "Profile",
      path: appPathForTab("profile"),
      depth: 0,
      children: [
        leaf("profile-menu", "Menu", appPathForRoute({ tab: "profile", sub: { screen: "menu" } }), 1),
        leaf(
          "profile-settings",
          "Settings",
          appPathForRoute({ tab: "profile", sub: { screen: "settings" } }),
          1,
        ),
        findFriendsMenuBranch("profile", "profile", "profile-find-friends"),
      ],
    },
  ];
}

export function flattenRouteTree(nodes: RouteTreeNode[]): RouteTreeNode[] {
  const out: RouteTreeNode[] = [];
  const walk = (list: RouteTreeNode[]) => {
    for (const node of list) {
      out.push(node);
      if (node.children?.length) walk(node.children);
    }
  };
  walk(nodes);
  return out;
}

export type FlatRouteMenuEntry = {
  path: string;
  label: string;
  matchesPathname?: (pathname: string) => boolean;
};

/** Routes menu rows: tab roots plus `A / B` or `A / B / C` for nested screens. */
export function flattenRouteMenuEntries(
  nodes: RouteTreeNode[] = buildAppRouteTree(),
): FlatRouteMenuEntry[] {
  const out: FlatRouteMenuEntry[] = [];

  const walk = (list: RouteTreeNode[], prefix: string) => {
    for (const node of list) {
      const label = `${prefix} / ${node.label}`;
      out.push({
        path: node.path,
        label,
        matchesPathname: node.matchesPathname,
      });
      if (node.children?.length) {
        walk(node.children, label);
      }
    }
  };

  for (const node of nodes) {
    out.push({ path: node.path, label: node.label });
    walk(node.children ?? [], node.label);
  }
  return out;
}

/** One-line clipboard: hierarchical labels (`Tab/Screen/…`), comma-separated, then count (no spaces). */
export function formatRouteMenuClipboardText(
  nodes: RouteTreeNode[] = buildAppRouteTree(),
): string {
  const labels = flattenRouteMenuEntries(nodes).map((entry) =>
    entry.label.replace(/\s*\/\s*/g, "/"),
  );
  return `${labels.join(",")},${labels.length}`;
}

/** Label for the route switcher trigger; message/story screens append `·` + title from id. */
export function currentRouteLabelForPathname(pathname: string): string {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const parsed = parseAppPathname(normalized);
  if (parsed.kind !== "app") return routeMenuLabelForPathname(appPathForTab("home"));

  const label = routeMenuLabelForPathname(normalized);

  if (parsed.route.tab === "friends" && parsed.route.sub.screen === "message") {
    return `${label} · ${messageDisplayName(parsed.route.sub.peerId)}`;
  }
  if (parsed.route.tab === "friends" && parsed.route.sub.screen === "story") {
    return `${label} · ${storyDisplayName(parsed.route.sub.storyId)}`;
  }
  if (parsed.route.tab === "inbox") {
    if (parsed.route.sub.screen === "message") {
      return `${label} · ${messageDisplayName(parsed.route.sub.threadId)}`;
    }
    if (parsed.route.sub.screen === "story") {
      return `${label} · ${storyDisplayName(parsed.route.sub.storyId)}`;
    }
  }

  return label;
}

export function isAppTabPath(pathname: string, tab: AppTabId): boolean {
  const parsed = parseAppPathname(pathname);
  return parsed.kind === "app" && parsed.route.tab === tab;
}
