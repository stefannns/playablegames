export type CommentImageCroppingStyle = "default" | "thread" | "simple";

export type CommentTopBarTitleAlignment = "left" | "center";

export type CommentTopBarAnchorVariant =
  | "name"
  | "name_d"
  | "name_poi"
  | "two_lines"
  | "search"
  | "tako";

export type CommentEmptyStateStyle = "default" | "yeah-or-nah" | "curious-about";

export type CommentEmptyStateYeahOrNahLook = "a" | "b" | "c";

export type CommentEmptyStateCuriousAboutLook = "a" | "b";

export type CommentExperimentConfig = {
  // Allow Expand 已被弃用：其能力由 allowDrag || showExpandButton 派生。
  // allowExpand: boolean;
  allowDrag: boolean;
  // Show Grabber 已迁移到 CommentTopBarExperimentConfig。
  // showGrabber: boolean;
  showExpandButton: boolean;
  showPiP: boolean;
  imageTargetArea: number;
  imageBorderRadius: number;
  imageCroppingStyle: CommentImageCroppingStyle;
  imageExpandRate: number;
};

export type CommentWikiExperimentConfig = {
  enabled: boolean;
  detailPageVersion: CommentWikiDetailPageVersion;
  showGlow: boolean;
};

export type CommentTopBarExperimentConfig = {
  showAnchor: boolean;
  showGrabber: boolean;
  titleAlignment: CommentTopBarTitleAlignment;
  defaultAnchorVariant: CommentTopBarAnchorVariant;
};

export type CommentEmptyStateExperimentConfig = {
  forceEmptyState: boolean;
  style: CommentEmptyStateStyle;
  yeahOrNahLook: CommentEmptyStateYeahOrNahLook;
  curiousAboutLook: CommentEmptyStateCuriousAboutLook;
  /**
   * 当评论区为空时，把输入框上方的 emoji 行替换成一行可以横向滚动的
   * "curious about" 风格问题胶囊；点击某条问题会把它填入输入框。
   */
  replaceEmojiWithQuestions: boolean;
  /**
   * 在 curious-about 风格下，长按评论按钮唤起的快捷 emoji popover 下方
   * 额外渲染 3 个半透明问题胶囊（右对齐），点击仅关闭面板（暂不发送）。
   */
  showQuestionsAfterLongPress: boolean;
};

export type CommentWikiDetailPageVersion = "v1-content-panel" | "v2-infograph";

export type CommentExperimentId =
  | "comment-panel-expand"
  | "comment-wiki"
  | "comment-top-bar"
  | "comment-empty-state";

export type CommentExperimentPreset<TConfig> = {
  id: string;
  name: string;
  config: TConfig;
  createdAt: number;
};

export type CommentPanelExpandPreset = CommentExperimentPreset<CommentExperimentConfig>;
export type CommentWikiPreset = CommentExperimentPreset<CommentWikiExperimentConfig>;
export type CommentTopBarPreset = CommentExperimentPreset<CommentTopBarExperimentConfig>;
export type CommentEmptyStatePreset = CommentExperimentPreset<CommentEmptyStateExperimentConfig>;

export const COMMENT_EXPERIMENT_OPTIONS: Array<{
  id: CommentExperimentId;
  label: string;
}> = [
  { id: "comment-panel-expand", label: "Comment Panel Expand" },
  { id: "comment-wiki", label: "Comment Wiki" },
  { id: "comment-top-bar", label: "Comment Top Bar" },
  { id: "comment-empty-state", label: "Comment Empty State" },
];

export const DEFAULT_COMMENT_EXPERIMENT_CONFIG: CommentExperimentConfig = {
  // 原 allowExpand=false 的默认值等价于 allowDrag=false 且 showExpandButton=false
  // （此时面板没有任何方式可以从 70 进入 90，与旧的 Allow Expand off 行为一致）。
  allowDrag: false,
  showExpandButton: false,
  showPiP: false,
  imageTargetArea: 30000,
  imageBorderRadius: 8,
  imageCroppingStyle: "default",
  imageExpandRate: 1,
};

export const MAX_COMMENT_IMAGE_AREA = DEFAULT_COMMENT_EXPERIMENT_CONFIG.imageTargetArea * 9;

export const COMMENT_IMAGE_CROPPING_STYLE_OPTIONS: Array<{
  id: CommentImageCroppingStyle;
  label: string;
}> = [
  { id: "default", label: "default" },
  { id: "thread", label: "thread" },
  { id: "simple", label: "Simple" },
];

export const DEFAULT_COMMENT_WIKI_EXPERIMENT_CONFIG: CommentWikiExperimentConfig = {
  enabled: false,
  detailPageVersion: "v1-content-panel",
  showGlow: false,
};

export const COMMENT_WIKI_DETAIL_PAGE_OPTIONS: Array<{
  id: CommentWikiDetailPageVersion;
  label: string;
}> = [
  { id: "v1-content-panel", label: "V1 - Content Panel" },
  { id: "v2-infograph", label: "V2 - Infograph" },
];

export const COMMENT_EXPERIMENT_PRESETS_STORAGE_KEY = "comment-panel-experiment-presets";
export const COMMENT_EXPERIMENT_STATE_STORAGE_KEY = "comment-panel-experiment-state-v2";

export const DEFAULT_COMMENT_EXPERIMENT_PRESETS: CommentPanelExpandPreset[] = [
  {
    id: "preset-default",
    name: "default",
    createdAt: 1777301940000,
    config: DEFAULT_COMMENT_EXPERIMENT_CONFIG,
  },
  {
    id: "preset-expand-on",
    name: "Expand On",
    createdAt: 1777301950000,
    config: {
      ...DEFAULT_COMMENT_EXPERIMENT_CONFIG,
      allowDrag: true,
      showExpandButton: true,
    },
  },
  {
    id: "preset-expand-on-no-drag",
    name: "No Drag",
    createdAt: 1777301952000,
    config: {
      ...DEFAULT_COMMENT_EXPERIMENT_CONFIG,
      allowDrag: false,
      showExpandButton: true,
    },
  },
  {
    id: "preset-expand-pip",
    name: "PiP",
    createdAt: 1777301955000,
    config: {
      ...DEFAULT_COMMENT_EXPERIMENT_CONFIG,
      allowDrag: true,
      showExpandButton: true,
      showPiP: true,
    },
  },
  {
    id: "preset-thread",
    name: "Thread",
    createdAt: 1777301970000,
    config: {
      ...DEFAULT_COMMENT_EXPERIMENT_CONFIG,
      allowDrag: true,
      showExpandButton: true,
      imageBorderRadius: 16,
      imageCroppingStyle: "thread",
    },
  },
  {
    id: "preset-1.5ximg-r8",
    name: "1.5xImg,r=8",
    createdAt: 1777302000000,
    config: {
      ...DEFAULT_COMMENT_EXPERIMENT_CONFIG,
      allowDrag: true,
      showExpandButton: true,
      imageTargetArea: 67500,
      imageBorderRadius: 8,
    },
  },
  {
    id: "preset-2ximg-r12",
    name: "2xImg,r=12",
    createdAt: 1777302060000,
    config: {
      ...DEFAULT_COMMENT_EXPERIMENT_CONFIG,
      allowDrag: true,
      showExpandButton: true,
      imageTargetArea: 120000,
      imageBorderRadius: 12,
    },
  },
  {
    id: "preset-5xarea",
    name: "5xArea",
    createdAt: 1777302120000,
    config: {
      ...DEFAULT_COMMENT_EXPERIMENT_CONFIG,
      allowDrag: true,
      showExpandButton: true,
      imageTargetArea: 150000,
      imageBorderRadius: 16,
      imageCroppingStyle: "default",
    },
  },
  {
    id: "preset-simple",
    name: "simple",
    createdAt: 1777302124000,
    config: {
      ...DEFAULT_COMMENT_EXPERIMENT_CONFIG,
      allowDrag: true,
      showExpandButton: true,
      showPiP: false,
      imageBorderRadius: 8,
      imageCroppingStyle: "simple",
      imageExpandRate: 1,
    },
  },
  {
    id: "preset-simple-pip",
    name: "simple-pip",
    createdAt: 1777302124500,
    config: {
      ...DEFAULT_COMMENT_EXPERIMENT_CONFIG,
      allowDrag: true,
      showExpandButton: true,
      showPiP: true,
      imageBorderRadius: 8,
      imageCroppingStyle: "simple",
      imageExpandRate: 1,
    },
  },
  {
    id: "preset-simple-1-5",
    name: "simple1.5",
    createdAt: 1777302125000,
    config: {
      ...DEFAULT_COMMENT_EXPERIMENT_CONFIG,
      allowDrag: true,
      showExpandButton: true,
      showPiP: false,
      imageBorderRadius: 8,
      imageCroppingStyle: "simple",
      imageExpandRate: 1.5,
    },
  },
  {
    id: "preset-simple-1-5-pip",
    name: "simple1.5-pip",
    createdAt: 1777302125500,
    config: {
      ...DEFAULT_COMMENT_EXPERIMENT_CONFIG,
      allowDrag: true,
      showExpandButton: true,
      showPiP: true,
      imageBorderRadius: 8,
      imageCroppingStyle: "simple",
      imageExpandRate: 1.5,
    },
  },
  {
    id: "preset-simple-1-9",
    name: "simple1.9",
    createdAt: 1777302126000,
    config: {
      ...DEFAULT_COMMENT_EXPERIMENT_CONFIG,
      allowDrag: true,
      showExpandButton: true,
      showPiP: false,
      imageBorderRadius: 8,
      imageCroppingStyle: "simple",
      imageExpandRate: 1.9,
    },
  },
  {
    id: "preset-simple-1-9-pip",
    name: "simple1.9-pip",
    createdAt: 1777302126500,
    config: {
      ...DEFAULT_COMMENT_EXPERIMENT_CONFIG,
      allowDrag: true,
      showExpandButton: true,
      showPiP: true,
      imageBorderRadius: 8,
      imageCroppingStyle: "simple",
      imageExpandRate: 1.9,
    },
  },
];

export const DEFAULT_COMMENT_WIKI_PRESETS: CommentWikiPreset[] = [
  {
    id: "wiki-preset-default",
    name: "default",
    createdAt: 1777302120000,
    config: DEFAULT_COMMENT_WIKI_EXPERIMENT_CONFIG,
  },
  {
    id: "wiki-preset-on",
    name: "on",
    createdAt: 1777302130000,
    config: {
      ...DEFAULT_COMMENT_WIKI_EXPERIMENT_CONFIG,
      enabled: true,
    },
  },
  {
    id: "wiki-preset-v1-glow",
    name: "V1-Glow",
    createdAt: 1777302150000,
    config: {
      ...DEFAULT_COMMENT_WIKI_EXPERIMENT_CONFIG,
      enabled: true,
      showGlow: true,
    },
  },
  {
    id: "wiki-preset-v2",
    name: "V2",
    createdAt: 1777302160000,
    config: {
      ...DEFAULT_COMMENT_WIKI_EXPERIMENT_CONFIG,
      enabled: true,
      detailPageVersion: "v2-infograph",
      showGlow: false,
    },
  },
  {
    id: "wiki-preset-off",
    name: "off",
    createdAt: 1777302180000,
    config: {
      ...DEFAULT_COMMENT_WIKI_EXPERIMENT_CONFIG,
      enabled: false,
    },
  },
];

export const DEFAULT_COMMENT_TOP_BAR_EXPERIMENT_CONFIG: CommentTopBarExperimentConfig = {
  showAnchor: true,
  showGrabber: false,
  titleAlignment: "left",
  defaultAnchorVariant: "search",
};

export const COMMENT_TOP_BAR_TITLE_ALIGNMENT_OPTIONS: Array<{
  id: CommentTopBarTitleAlignment;
  label: string;
}> = [
  { id: "left", label: "Left" },
  { id: "center", label: "Center" },
];

export const COMMENT_TOP_BAR_ANCHOR_VARIANT_OPTIONS: Array<{
  id: CommentTopBarAnchorVariant;
  label: string;
}> = [
  { id: "name", label: "Name" },
  { id: "name_d", label: "Name + Detail" },
  { id: "name_poi", label: "POI" },
  { id: "two_lines", label: "Two Lines" },
  { id: "search", label: "Search" },
  { id: "tako", label: "Tako" },
];

export const DEFAULT_COMMENT_TOP_BAR_PRESETS: CommentTopBarPreset[] = [
  {
    id: "top-bar-preset-default",
    name: "default",
    createdAt: 1777302200000,
    config: DEFAULT_COMMENT_TOP_BAR_EXPERIMENT_CONFIG,
  },
  {
    id: "top-bar-preset-left",
    name: "Left",
    createdAt: 1777302210000,
    config: {
      ...DEFAULT_COMMENT_TOP_BAR_EXPERIMENT_CONFIG,
      titleAlignment: "left",
    },
  },
  {
    id: "top-bar-preset-no-anchor",
    name: "No Anchor",
    createdAt: 1777302220000,
    config: {
      ...DEFAULT_COMMENT_TOP_BAR_EXPERIMENT_CONFIG,
      showAnchor: false,
    },
  },
  {
    id: "top-bar-preset-centered",
    name: "Centered",
    createdAt: 1777302240000,
    config: {
      ...DEFAULT_COMMENT_TOP_BAR_EXPERIMENT_CONFIG,
      titleAlignment: "center",
    },
  },
  {
    id: "top-bar-preset-grabber",
    name: "With Grabber",
    createdAt: 1777302250000,
    config: {
      ...DEFAULT_COMMENT_TOP_BAR_EXPERIMENT_CONFIG,
      showGrabber: true,
    },
  },
];

export const COMMENT_EMPTY_STATE_STYLE_OPTIONS: Array<{
  id: CommentEmptyStateStyle;
  label: string;
}> = [
  { id: "default", label: "Default" },
  { id: "yeah-or-nah", label: "Yeah or Nah" },
  { id: "curious-about", label: "Curious About" },
];

export const COMMENT_EMPTY_STATE_YEAH_OR_NAH_LOOK_OPTIONS: Array<{
  id: CommentEmptyStateYeahOrNahLook;
  label: string;
}> = [
  { id: "a", label: "A · Tilted Bubbles" },
  { id: "b", label: "B · Split Arena" },
  { id: "c", label: "C · Comic Strip" },
];

export const COMMENT_EMPTY_STATE_CURIOUS_ABOUT_LOOK_OPTIONS: Array<{
  id: CommentEmptyStateCuriousAboutLook;
  label: string;
}> = [
  { id: "a", label: "A · Pill Mosaic" },
  { id: "b", label: "B · Scatter Stack" },
];

export const DEFAULT_COMMENT_EMPTY_STATE_EXPERIMENT_CONFIG: CommentEmptyStateExperimentConfig = {
  forceEmptyState: false,
  style: "default",
  yeahOrNahLook: "a",
  curiousAboutLook: "a",
  replaceEmojiWithQuestions: false,
  showQuestionsAfterLongPress: false,
};

/**
 * "Curious about…" 风格的问题选项，按当前演示视频（咖啡馆）选择的轻量提问。
 * 同时被 empty state 的 curious-about look 和新的 emoji-bar 替换实验复用。
 */
export const COMMENT_EMPTY_STATE_QUESTION_OPTIONS: ReadonlyArray<string> = [
  "what's that drink?",
  "where is this?",
  "is the wifi good?",
  "open on weekends?",
  "any outlets nearby?",
  "best seat in the house?",
  "how's the matcha?",
  "do they take cards?",
  "pet friendly?",
  "noise level for laptops?",
];

export const DEFAULT_COMMENT_EMPTY_STATE_PRESETS: CommentEmptyStatePreset[] = [
  {
    id: "empty-state-preset-default",
    name: "default",
    createdAt: 1777302300000,
    config: DEFAULT_COMMENT_EMPTY_STATE_EXPERIMENT_CONFIG,
  },
  {
    id: "empty-state-preset-yeah-or-nah-a",
    name: "yon-a",
    createdAt: 1777302310000,
    config: {
      ...DEFAULT_COMMENT_EMPTY_STATE_EXPERIMENT_CONFIG,
      forceEmptyState: true,
      style: "yeah-or-nah",
      yeahOrNahLook: "a",
    },
  },
  {
    id: "empty-state-preset-yeah-or-nah-b",
    name: "yon-b",
    createdAt: 1777302320000,
    config: {
      ...DEFAULT_COMMENT_EMPTY_STATE_EXPERIMENT_CONFIG,
      forceEmptyState: true,
      style: "yeah-or-nah",
      yeahOrNahLook: "b",
    },
  },
  {
    id: "empty-state-preset-yeah-or-nah-c",
    name: "yon-c",
    createdAt: 1777302330000,
    config: {
      ...DEFAULT_COMMENT_EMPTY_STATE_EXPERIMENT_CONFIG,
      forceEmptyState: true,
      style: "yeah-or-nah",
      yeahOrNahLook: "c",
    },
  },
  {
    id: "empty-state-preset-curious-about-a",
    name: "curious-a",
    createdAt: 1777302340000,
    config: {
      ...DEFAULT_COMMENT_EMPTY_STATE_EXPERIMENT_CONFIG,
      forceEmptyState: true,
      style: "curious-about",
      curiousAboutLook: "a",
    },
  },
  {
    id: "empty-state-preset-curious-about-a-lp",
    name: "curious-a-lp",
    createdAt: 1777302345000,
    config: {
      ...DEFAULT_COMMENT_EMPTY_STATE_EXPERIMENT_CONFIG,
      forceEmptyState: true,
      style: "curious-about",
      curiousAboutLook: "a",
      showQuestionsAfterLongPress: true,
    },
  },
  {
    id: "empty-state-preset-curious-about-b",
    name: "curious-b",
    createdAt: 1777302350000,
    config: {
      ...DEFAULT_COMMENT_EMPTY_STATE_EXPERIMENT_CONFIG,
      forceEmptyState: true,
      style: "curious-about",
      curiousAboutLook: "b",
    },
  },
  {
    id: "empty-state-preset-emoji-questions",
    name: "q-bar",
    createdAt: 1777302360000,
    config: {
      ...DEFAULT_COMMENT_EMPTY_STATE_EXPERIMENT_CONFIG,
      forceEmptyState: true,
      replaceEmojiWithQuestions: true,
    },
  },
];
