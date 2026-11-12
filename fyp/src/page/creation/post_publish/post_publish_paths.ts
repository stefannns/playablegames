import {
  appPathForRoute,
  type AppRoute,
  type CreationPostPublishOrigin,
} from "../../../routes/app_route_tree";

/** 从 URL 解析 publish / preview 所属流程（刷新后仍可用）。 */
export function creationPublishOriginFromRoute(
  route: AppRoute | null,
): CreationPostPublishOrigin | null {
  if (route?.tab !== "creation") return null;
  const { sub } = route;
  if (sub.screen === "publish" || sub.screen === "preview") {
    return sub.origin;
  }
  return null;
}

/** Level-3 post publish / preview routes under Edit Photo or Text to Image. */
export const postPublishPaths = {
  publish: (origin: CreationPostPublishOrigin) =>
    appPathForRoute({ tab: "creation", sub: { screen: "publish", origin } }),
  preview: (origin: CreationPostPublishOrigin) =>
    appPathForRoute({ tab: "creation", sub: { screen: "preview", origin } }),
} as const;
