import {
  addSoundPath,
  appPathForRoute,
  soundDiscoverPath,
  soundSearchPath,
  type SoundSearchOrigin,
} from "../../routes/app_route_tree";
import { postPublishPaths } from "./post_publish/post_publish_paths";

/** Creation 二级屏 — 拍摄 studio + 照片/视频/图文编辑（均在 Creation Tab 内）。 */
export const creationSecondaryPaths = {
  studio: () =>
    appPathForRoute({ tab: "creation", sub: { screen: "studio" } }),
  playable: () =>
    appPathForRoute({ tab: "creation", sub: { screen: "playable" } }),
  create: () =>
    appPathForRoute({ tab: "creation", sub: { screen: "create" } }),
  live: () =>
    appPathForRoute({ tab: "creation", sub: { screen: "live" } }),
  album: () =>
    appPathForRoute({ tab: "creation", sub: { screen: "album" } }),
  editPhoto: () =>
    appPathForRoute({ tab: "creation", sub: { screen: "edit-photo" } }),
  editVideo: () =>
    appPathForRoute({ tab: "creation", sub: { screen: "edit-video" } }),
  textToImage: () =>
    appPathForRoute({ tab: "creation", sub: { screen: "text-to-image" } }),
  textToImageTemplates: () =>
    appPathForRoute({
      tab: "creation",
      sub: { screen: "text-to-image-templates" },
    }),
  textToImagePublish: () => postPublishPaths.publish("text-to-image"),
  editPhotoPublish: () => postPublishPaths.publish("edit-photo"),
  editPhotoPreview: () => postPublishPaths.preview("edit-photo"),
  textToImagePreview: () => postPublishPaths.preview("text-to-image"),
  addSound: (origin: SoundSearchOrigin) => addSoundPath(origin),
  soundSearch: (origin: SoundSearchOrigin) => soundSearchPath(origin),
  soundDiscover: (origin: SoundSearchOrigin) => soundDiscoverPath(origin),
} as const;
