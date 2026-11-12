/** Shared publish / preview shell — photo-text carousel, photo, or full-screen video. */
export type PostPublishMode = "photo-text" | "photo" | "video";

export type PostPublishImageMedia = {
  kind: "image";
  id: string;
  src: string;
  badge: string;
  showLivePhoto?: boolean;
};

export type PostPublishVideoMedia = {
  kind: "video";
  id: string;
  /** 可播放 MP4；原型里相机只有快照时不设，预览用 posterSrc 全屏展示。 */
  src?: string;
  posterSrc: string;
  badge: string;
};

export type PostPublishTextImageMedia = {
  kind: "text-image";
  id: string;
  templateId: number;
  text: string;
  badge: string;
};

export type PostPublishMediaItem =
  | PostPublishImageMedia
  | PostPublishVideoMedia
  | PostPublishTextImageMedia;

export type PostPublishDraft = {
  mode: PostPublishMode;
  title: string;
  description: string;
  media: PostPublishMediaItem[];
  initialPreviewIndex: number;
};

export type PostPublishSeed =
  | { kind: "photo-text-demo" }
  | { kind: "photo"; sources: readonly string[] }
  | { kind: "text-to-image"; templateId: number; text: string }
  | { kind: "video"; coverSrc?: string; videoSrc?: string }
  | { kind: "resume" };
