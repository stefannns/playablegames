import { useSyncExternalStore } from "react";
import {
  COMMENT_EXPERIMENT_STATE_STORAGE_KEY,
  COMMENT_EXPERIMENT_PRESETS_STORAGE_KEY,
  DEFAULT_COMMENT_EMPTY_STATE_EXPERIMENT_CONFIG,
  DEFAULT_COMMENT_EMPTY_STATE_PRESETS,
  DEFAULT_COMMENT_EXPERIMENT_CONFIG,
  DEFAULT_COMMENT_EXPERIMENT_PRESETS,
  DEFAULT_COMMENT_TOP_BAR_EXPERIMENT_CONFIG,
  DEFAULT_COMMENT_TOP_BAR_PRESETS,
  DEFAULT_COMMENT_WIKI_EXPERIMENT_CONFIG,
  DEFAULT_COMMENT_WIKI_PRESETS,
  type CommentEmptyStateExperimentConfig,
  type CommentEmptyStatePreset,
  type CommentExperimentId,
  type CommentExperimentConfig,
  type CommentPanelExpandPreset,
  type CommentTopBarExperimentConfig,
  type CommentTopBarPreset,
  type CommentWikiExperimentConfig,
  type CommentWikiPreset,
} from "./comment_experiment_config";

type CommentExperimentGroupState<TConfig, TPreset> = {
  config: TConfig;
  presets: TPreset[];
};

type CommentExperimentStoreState = {
  visible: boolean;
  activeExperimentId: CommentExperimentId;
  commentPanelExpand: CommentExperimentGroupState<
    CommentExperimentConfig,
    CommentPanelExpandPreset
  >;
  commentWiki: CommentExperimentGroupState<CommentWikiExperimentConfig, CommentWikiPreset>;
  commentTopBar: CommentExperimentGroupState<CommentTopBarExperimentConfig, CommentTopBarPreset>;
  commentEmptyState: CommentExperimentGroupState<
    CommentEmptyStateExperimentConfig,
    CommentEmptyStatePreset
  >;
};

type PersistedCommentExperimentState = {
  activeExperimentId?: CommentExperimentId;
  commentPanelExpandPresets?: CommentPanelExpandPreset[];
  commentWikiPresets?: CommentWikiPreset[];
  commentTopBarPresets?: CommentTopBarPreset[];
  commentEmptyStatePresets?: CommentEmptyStatePreset[];
};

const listeners = new Set<() => void>();
const activePanelIds = new Set<string>();
const COMMENT_EXPERIMENT_ACTIVE_QUERY_KEY = "commentExperiment";
const COMMENT_PANEL_EXPAND_PRESET_QUERY_KEY = "commentPanelExpandPreset";
const COMMENT_WIKI_PRESET_QUERY_KEY = "commentWikiPreset";
const COMMENT_TOP_BAR_PRESET_QUERY_KEY = "commentTopBarPreset";
const COMMENT_EMPTY_STATE_PRESET_QUERY_KEY = "commentEmptyStatePreset";
const BUILT_IN_COMMENT_WIKI_PRESET_IDS = new Set(
  DEFAULT_COMMENT_WIKI_PRESETS.map((preset) => normalizePresetMatchValue(preset.id)),
);
const BUILT_IN_COMMENT_WIKI_PRESET_NAMES = new Set(
  DEFAULT_COMMENT_WIKI_PRESETS.map((preset) => normalizePresetMatchValue(preset.name)),
);
const BUILT_IN_COMMENT_TOP_BAR_PRESET_IDS = new Set(
  DEFAULT_COMMENT_TOP_BAR_PRESETS.map((preset) => normalizePresetMatchValue(preset.id)),
);
const BUILT_IN_COMMENT_TOP_BAR_PRESET_NAMES = new Set(
  DEFAULT_COMMENT_TOP_BAR_PRESETS.map((preset) => normalizePresetMatchValue(preset.name)),
);
const BUILT_IN_COMMENT_EMPTY_STATE_PRESET_IDS = new Set(
  DEFAULT_COMMENT_EMPTY_STATE_PRESETS.map((preset) => normalizePresetMatchValue(preset.id)),
);
const BUILT_IN_COMMENT_EMPTY_STATE_PRESET_NAMES = new Set(
  DEFAULT_COMMENT_EMPTY_STATE_PRESETS.map((preset) => normalizePresetMatchValue(preset.name)),
);

let state: CommentExperimentStoreState = {
  visible: true,
  activeExperimentId: "comment-wiki",
  commentPanelExpand: {
    config: DEFAULT_COMMENT_EXPERIMENT_CONFIG,
    presets: DEFAULT_COMMENT_EXPERIMENT_PRESETS,
  },
  commentWiki: {
    config: DEFAULT_COMMENT_WIKI_EXPERIMENT_CONFIG,
    presets: DEFAULT_COMMENT_WIKI_PRESETS,
  },
  commentTopBar: {
    config: DEFAULT_COMMENT_TOP_BAR_EXPERIMENT_CONFIG,
    presets: DEFAULT_COMMENT_TOP_BAR_PRESETS,
  },
  commentEmptyState: {
    config: DEFAULT_COMMENT_EMPTY_STATE_EXPERIMENT_CONFIG,
    presets: DEFAULT_COMMENT_EMPTY_STATE_PRESETS,
  },
};

let hydrated = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(next: Partial<CommentExperimentStoreState>) {
  state = { ...state, ...next };
  emit();
}

function hydratePresets() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const persistedState = readPersistedExperimentState();
    const rawCommentPanelExpandPresets = Array.isArray(persistedState.commentPanelExpandPresets)
      ? persistedState.commentPanelExpandPresets
      : [];
    const sanitizedCommentPanelExpandPresets = sanitizeCommentPanelExpandPresets(
      rawCommentPanelExpandPresets,
    );
    const rawCommentWikiPresets = Array.isArray(persistedState.commentWikiPresets)
      ? persistedState.commentWikiPresets
      : [];
    const sanitizedCommentWikiPresets = sanitizeCommentWikiPresets(rawCommentWikiPresets);
    const rawCommentTopBarPresets = Array.isArray(persistedState.commentTopBarPresets)
      ? persistedState.commentTopBarPresets
      : [];
    const sanitizedCommentTopBarPresets = sanitizeCommentTopBarPresets(rawCommentTopBarPresets);
    const rawCommentEmptyStatePresets = Array.isArray(persistedState.commentEmptyStatePresets)
      ? persistedState.commentEmptyStatePresets
      : [];
    const sanitizedCommentEmptyStatePresets = sanitizeCommentEmptyStatePresets(
      rawCommentEmptyStatePresets,
    );
    const commentPanelExpandPresets = mergePresets(
      DEFAULT_COMMENT_EXPERIMENT_PRESETS,
      sanitizedCommentPanelExpandPresets,
    );
    const commentWikiPresets = mergePresets(
      DEFAULT_COMMENT_WIKI_PRESETS,
      sanitizedCommentWikiPresets,
    );
    const commentTopBarPresets = mergePresets(
      DEFAULT_COMMENT_TOP_BAR_PRESETS,
      sanitizedCommentTopBarPresets,
    );
    const commentEmptyStatePresets = mergePresets(
      DEFAULT_COMMENT_EMPTY_STATE_PRESETS,
      sanitizedCommentEmptyStatePresets,
    );

    let nextState: CommentExperimentStoreState = {
      ...state,
      activeExperimentId: parseCommentExperimentId(persistedState.activeExperimentId)
        ?? "comment-panel-expand",
      commentPanelExpand: {
        ...state.commentPanelExpand,
        presets: commentPanelExpandPresets,
      },
      commentWiki: {
        ...state.commentWiki,
        presets: commentWikiPresets,
      },
      commentTopBar: {
        ...state.commentTopBar,
        presets: commentTopBarPresets,
      },
      commentEmptyState: {
        ...state.commentEmptyState,
        presets: commentEmptyStatePresets,
      },
    };

    const searchParams = new URLSearchParams(window.location.search);
    const urlPanelPreset = findPresetByQueryValue(
      commentPanelExpandPresets,
      searchParams.get(COMMENT_PANEL_EXPAND_PRESET_QUERY_KEY),
    );
    const urlWikiPreset = findCommentWikiPresetByQueryValue(
      commentWikiPresets,
      searchParams.get(COMMENT_WIKI_PRESET_QUERY_KEY),
    );
    const urlTopBarPreset = findPresetByQueryValue(
      commentTopBarPresets,
      searchParams.get(COMMENT_TOP_BAR_PRESET_QUERY_KEY),
    );
    const urlEmptyStatePreset = findPresetByQueryValue(
      commentEmptyStatePresets,
      searchParams.get(COMMENT_EMPTY_STATE_PRESET_QUERY_KEY),
    );

    if (urlPanelPreset) {
      nextState = {
        ...nextState,
        commentPanelExpand: {
          ...nextState.commentPanelExpand,
          config: urlPanelPreset.config,
        },
      };
    }

    if (urlWikiPreset) {
      nextState = {
        ...nextState,
        commentWiki: {
          ...nextState.commentWiki,
          config: urlWikiPreset.config,
        },
      };
    }

    if (urlTopBarPreset) {
      nextState = {
        ...nextState,
        commentTopBar: {
          ...nextState.commentTopBar,
          config: urlTopBarPreset.config,
        },
      };
    }

    if (urlEmptyStatePreset) {
      nextState = {
        ...nextState,
        commentEmptyState: {
          ...nextState.commentEmptyState,
          config: urlEmptyStatePreset.config,
        },
      };
    }

    const explicitActiveExperimentId = parseCommentExperimentId(
      searchParams.get(COMMENT_EXPERIMENT_ACTIVE_QUERY_KEY),
    );
    if (explicitActiveExperimentId) {
      nextState = { ...nextState, activeExperimentId: explicitActiveExperimentId };
    } else if (urlPanelPreset && !urlWikiPreset && !urlTopBarPreset && !urlEmptyStatePreset) {
      nextState = { ...nextState, activeExperimentId: "comment-panel-expand" };
    } else if (urlWikiPreset && !urlPanelPreset && !urlTopBarPreset && !urlEmptyStatePreset) {
      nextState = { ...nextState, activeExperimentId: "comment-wiki" };
    } else if (urlTopBarPreset && !urlPanelPreset && !urlWikiPreset && !urlEmptyStatePreset) {
      nextState = { ...nextState, activeExperimentId: "comment-top-bar" };
    } else if (urlEmptyStatePreset && !urlPanelPreset && !urlWikiPreset && !urlTopBarPreset) {
      nextState = { ...nextState, activeExperimentId: "comment-empty-state" };
    }

    state = nextState;

    if (
      JSON.stringify(sanitizedCommentPanelExpandPresets) !==
        JSON.stringify(rawCommentPanelExpandPresets) ||
      JSON.stringify(sanitizedCommentWikiPresets) !== JSON.stringify(rawCommentWikiPresets) ||
      JSON.stringify(sanitizedCommentTopBarPresets) !== JSON.stringify(rawCommentTopBarPresets) ||
      JSON.stringify(sanitizedCommentEmptyStatePresets) !==
        JSON.stringify(rawCommentEmptyStatePresets)
    ) {
      persistState();
    }
  } catch {
    // Ignore invalid local data.
  }
}

function persistState() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    COMMENT_EXPERIMENT_STATE_STORAGE_KEY,
    JSON.stringify({
      activeExperimentId: state.activeExperimentId,
      commentPanelExpandPresets: state.commentPanelExpand.presets,
      commentWikiPresets: state.commentWiki.presets,
      commentTopBarPresets: state.commentTopBar.presets,
      commentEmptyStatePresets: state.commentEmptyState.presets,
    }),
  );
}

function readPersistedExperimentState(): PersistedCommentExperimentState {
  if (typeof window === "undefined") return {};

  const stateRaw = window.localStorage.getItem(COMMENT_EXPERIMENT_STATE_STORAGE_KEY);
  if (stateRaw) {
    const parsed = JSON.parse(stateRaw) as PersistedCommentExperimentState;
    return {
      activeExperimentId: parseCommentExperimentId(parsed.activeExperimentId),
      commentPanelExpandPresets: Array.isArray(parsed.commentPanelExpandPresets)
        ? parsed.commentPanelExpandPresets
        : [],
      commentWikiPresets: Array.isArray(parsed.commentWikiPresets)
        ? parsed.commentWikiPresets
        : [],
      commentTopBarPresets: Array.isArray(parsed.commentTopBarPresets)
        ? parsed.commentTopBarPresets
        : [],
      commentEmptyStatePresets: Array.isArray(parsed.commentEmptyStatePresets)
        ? parsed.commentEmptyStatePresets
        : [],
    };
  }

  const legacyRaw = window.localStorage.getItem(COMMENT_EXPERIMENT_PRESETS_STORAGE_KEY);
  if (!legacyRaw) return {};

  const parsed = JSON.parse(legacyRaw) as CommentPanelExpandPreset[];
  return {
    commentPanelExpandPresets: Array.isArray(parsed) ? parsed : [],
  };
}

export function subscribeCommentExperimentStore(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCommentExperimentStoreSnapshot() {
  hydratePresets();
  return state;
}

export function useCommentExperimentStore() {
  return useSyncExternalStore(
    subscribeCommentExperimentStore,
    getCommentExperimentStoreSnapshot,
    getCommentExperimentStoreSnapshot,
  );
}

export function openCommentExperimentPanel(panelId: string) {
  activePanelIds.add(panelId);
  setState({ visible: activePanelIds.size > 0 });
}

export function closeCommentExperimentPanel(panelId: string) {
  activePanelIds.delete(panelId);
  setState({ visible: activePanelIds.size > 0 });
}

export function setActiveCommentExperimentId(activeExperimentId: CommentExperimentId) {
  setState({ activeExperimentId });
  persistState();
}

export function setCommentExperimentConfig(config: CommentExperimentConfig) {
  setState({
    commentPanelExpand: {
      ...state.commentPanelExpand,
      config: normalizeCommentExperimentConfig(config),
    },
  });
}

export function setCommentWikiExperimentConfig(config: CommentWikiExperimentConfig) {
  setState({
    commentWiki: {
      ...state.commentWiki,
      config,
    },
  });
}

export function setCommentTopBarExperimentConfig(config: CommentTopBarExperimentConfig) {
  setState({
    commentTopBar: {
      ...state.commentTopBar,
      config: normalizeCommentTopBarConfig(config),
    },
  });
}

export function setCommentEmptyStateExperimentConfig(config: CommentEmptyStateExperimentConfig) {
  setState({
    commentEmptyState: {
      ...state.commentEmptyState,
      config: normalizeCommentEmptyStateConfig(config),
    },
  });
}

export function resetCommentExperimentConfig() {
  if (state.activeExperimentId === "comment-wiki") {
    setState({
      commentWiki: {
        ...state.commentWiki,
        config: DEFAULT_COMMENT_WIKI_EXPERIMENT_CONFIG,
      },
    });
    return;
  }

  if (state.activeExperimentId === "comment-top-bar") {
    setState({
      commentTopBar: {
        ...state.commentTopBar,
        config: DEFAULT_COMMENT_TOP_BAR_EXPERIMENT_CONFIG,
      },
    });
    return;
  }

  if (state.activeExperimentId === "comment-empty-state") {
    setState({
      commentEmptyState: {
        ...state.commentEmptyState,
        config: DEFAULT_COMMENT_EMPTY_STATE_EXPERIMENT_CONFIG,
      },
    });
    return;
  }

  setState({
    commentPanelExpand: {
      ...state.commentPanelExpand,
      config: DEFAULT_COMMENT_EXPERIMENT_CONFIG,
    },
  });
}

export function saveCommentExperimentPreset(name: string) {
  if (state.activeExperimentId === "comment-wiki") {
    const preset: CommentWikiPreset = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      config: state.commentWiki.config,
      createdAt: Date.now(),
    };
    const presets = [preset, ...state.commentWiki.presets];
    setState({
      commentWiki: {
        ...state.commentWiki,
        presets,
      },
    });
    persistState();
    return;
  }

  if (state.activeExperimentId === "comment-top-bar") {
    const preset: CommentTopBarPreset = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      config: state.commentTopBar.config,
      createdAt: Date.now(),
    };
    const presets = [preset, ...state.commentTopBar.presets];
    setState({
      commentTopBar: {
        ...state.commentTopBar,
        presets,
      },
    });
    persistState();
    return;
  }

  if (state.activeExperimentId === "comment-empty-state") {
    const preset: CommentEmptyStatePreset = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      config: state.commentEmptyState.config,
      createdAt: Date.now(),
    };
    const presets = [preset, ...state.commentEmptyState.presets];
    setState({
      commentEmptyState: {
        ...state.commentEmptyState,
        presets,
      },
    });
    persistState();
    return;
  }

  const preset: CommentPanelExpandPreset = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    config: state.commentPanelExpand.config,
    createdAt: Date.now(),
  };
  const presets = [preset, ...state.commentPanelExpand.presets];
  setState({
    commentPanelExpand: {
      ...state.commentPanelExpand,
      presets,
    },
  });
  persistState();
}

export function applyCommentExperimentPreset(presetId: string) {
  if (state.activeExperimentId === "comment-wiki") {
    const preset = state.commentWiki.presets.find((item) => item.id === presetId);
    if (!preset) return;
    setState({
      commentWiki: {
        ...state.commentWiki,
        config: preset.config,
      },
    });
    return;
  }

  if (state.activeExperimentId === "comment-top-bar") {
    const preset = state.commentTopBar.presets.find((item) => item.id === presetId);
    if (!preset) return;
    setState({
      commentTopBar: {
        ...state.commentTopBar,
        config: preset.config,
      },
    });
    return;
  }

  if (state.activeExperimentId === "comment-empty-state") {
    const preset = state.commentEmptyState.presets.find((item) => item.id === presetId);
    if (!preset) return;
    setState({
      commentEmptyState: {
        ...state.commentEmptyState,
        config: preset.config,
      },
    });
    return;
  }

  const preset = state.commentPanelExpand.presets.find((item) => item.id === presetId);
  if (!preset) return;
  setState({
    commentPanelExpand: {
      ...state.commentPanelExpand,
      config: preset.config,
    },
  });
}

export function deleteCommentExperimentPreset(presetId: string) {
  if (state.activeExperimentId === "comment-wiki") {
    const presets = state.commentWiki.presets.filter((item) => item.id !== presetId);
    setState({
      commentWiki: {
        ...state.commentWiki,
        presets,
      },
    });
    persistState();
    return;
  }

  if (state.activeExperimentId === "comment-top-bar") {
    const presets = state.commentTopBar.presets.filter((item) => item.id !== presetId);
    setState({
      commentTopBar: {
        ...state.commentTopBar,
        presets,
      },
    });
    persistState();
    return;
  }

  if (state.activeExperimentId === "comment-empty-state") {
    const presets = state.commentEmptyState.presets.filter((item) => item.id !== presetId);
    setState({
      commentEmptyState: {
        ...state.commentEmptyState,
        presets,
      },
    });
    persistState();
    return;
  }

  const presets = state.commentPanelExpand.presets.filter((item) => item.id !== presetId);
  setState({
    commentPanelExpand: {
      ...state.commentPanelExpand,
      presets,
    },
  });
  persistState();
}

function mergePresets<TPreset extends { id: string; name: string }>(
  defaults: TPreset[],
  custom: TPreset[],
): TPreset[] {
  const byId = new Map<string, TPreset>();
  const byName = new Map<string, TPreset>();

  for (const preset of defaults) {
    byId.set(preset.id, preset);
    byName.set(preset.name, preset);
  }

  for (const preset of custom) {
    byId.set(preset.id, preset);
    byName.set(preset.name, preset);
  }

  const merged: TPreset[] = [];
  const seen = new Set<string>();

  for (const preset of defaults) {
    const resolved = byId.get(preset.id) ?? byName.get(preset.name) ?? preset;
    if (seen.has(resolved.id)) continue;
    merged.push(resolved);
    seen.add(resolved.id);
  }

  for (const preset of custom) {
    if (seen.has(preset.id)) continue;
    merged.push(preset);
    seen.add(preset.id);
  }

  return merged;
}

function findPresetByQueryValue<TPreset extends { id: string; name: string }>(
  presets: TPreset[],
  queryValue: string | null,
) {
  if (!queryValue) return null;
  const normalizedQuery = normalizePresetMatchValue(queryValue);
  return (
    presets.find((preset) => normalizePresetMatchValue(preset.id) === normalizedQuery) ??
    presets.find((preset) => normalizePresetMatchValue(preset.name) === normalizedQuery) ??
    null
  );
}

function findCommentWikiPresetByQueryValue(
  presets: CommentWikiPreset[],
  queryValue: string | null,
) {
  return findPresetByQueryValue(presets, queryValue);
}

function sanitizeCommentPanelExpandPresets(presets: CommentPanelExpandPreset[]) {
  return presets.map((preset) => ({
    ...preset,
    config: normalizeCommentExperimentConfig(preset.config),
  }));
}

function normalizeCommentExperimentConfig(
  config: Partial<CommentExperimentConfig> & {
    // Legacy fields from older persisted data; consumed for migration only.
    allowExpand?: boolean;
    showGrabber?: boolean;
  } | undefined,
): CommentExperimentConfig {
  // 旧数据兼容：当 allowExpand=false 时，强制将 allowDrag 与 showExpandButton 置为 false，
  // 等价复刻旧的「禁止展开」语义；当 allowExpand=true 或字段缺失时，按字段默认值取用。
  const legacyAllowExpand = config?.allowExpand;
  const allowDrag =
    legacyAllowExpand === false
      ? false
      : config?.allowDrag ?? DEFAULT_COMMENT_EXPERIMENT_CONFIG.allowDrag;
  const showExpandButton =
    legacyAllowExpand === false
      ? false
      : config?.showExpandButton ?? DEFAULT_COMMENT_EXPERIMENT_CONFIG.showExpandButton;
  return {
    allowDrag,
    showExpandButton,
    showPiP: config?.showPiP ?? DEFAULT_COMMENT_EXPERIMENT_CONFIG.showPiP,
    imageTargetArea: config?.imageTargetArea ?? DEFAULT_COMMENT_EXPERIMENT_CONFIG.imageTargetArea,
    imageBorderRadius:
      config?.imageBorderRadius ?? DEFAULT_COMMENT_EXPERIMENT_CONFIG.imageBorderRadius,
    imageExpandRate:
      typeof config?.imageExpandRate === "number" && Number.isFinite(config.imageExpandRate)
        ? Math.min(3, Math.max(1, config.imageExpandRate))
        : DEFAULT_COMMENT_EXPERIMENT_CONFIG.imageExpandRate,
    imageCroppingStyle:
      config?.imageCroppingStyle === "thread" ||
      config?.imageCroppingStyle === "default" ||
      config?.imageCroppingStyle === "simple"
        ? config.imageCroppingStyle
        : DEFAULT_COMMENT_EXPERIMENT_CONFIG.imageCroppingStyle,
  };
}

function sanitizeCommentWikiPresets(presets: CommentWikiPreset[]) {
  return presets
    .filter(
      (preset) =>
        !BUILT_IN_COMMENT_WIKI_PRESET_IDS.has(normalizePresetMatchValue(preset.id)) &&
        !BUILT_IN_COMMENT_WIKI_PRESET_NAMES.has(normalizePresetMatchValue(preset.name)),
    )
    .map((preset) => ({
      ...preset,
      config: normalizeCommentWikiConfig(preset.config),
    }));
}

function normalizeCommentWikiConfig(
  config: Partial<CommentWikiExperimentConfig> | undefined,
): CommentWikiExperimentConfig {
  return {
    enabled: config?.enabled ?? DEFAULT_COMMENT_WIKI_EXPERIMENT_CONFIG.enabled,
    detailPageVersion:
      config?.detailPageVersion === "v1-content-panel" ||
      config?.detailPageVersion === "v2-infograph"
        ? config.detailPageVersion
        : DEFAULT_COMMENT_WIKI_EXPERIMENT_CONFIG.detailPageVersion,
    showGlow: config?.showGlow ?? DEFAULT_COMMENT_WIKI_EXPERIMENT_CONFIG.showGlow,
  };
}

function sanitizeCommentTopBarPresets(presets: CommentTopBarPreset[]) {
  return presets
    .filter(
      (preset) =>
        !BUILT_IN_COMMENT_TOP_BAR_PRESET_IDS.has(normalizePresetMatchValue(preset.id)) &&
        !BUILT_IN_COMMENT_TOP_BAR_PRESET_NAMES.has(normalizePresetMatchValue(preset.name)),
    )
    .map((preset) => ({
      ...preset,
      config: normalizeCommentTopBarConfig(preset.config),
    }));
}

function normalizeCommentTopBarConfig(
  config: Partial<CommentTopBarExperimentConfig> | undefined,
): CommentTopBarExperimentConfig {
  const variant = config?.defaultAnchorVariant;
  const allowedVariants: CommentTopBarExperimentConfig["defaultAnchorVariant"][] = [
    "name",
    "name_d",
    "name_poi",
    "two_lines",
    "search",
    "tako",
  ];
  return {
    showAnchor: config?.showAnchor ?? DEFAULT_COMMENT_TOP_BAR_EXPERIMENT_CONFIG.showAnchor,
    showGrabber: config?.showGrabber ?? DEFAULT_COMMENT_TOP_BAR_EXPERIMENT_CONFIG.showGrabber,
    titleAlignment:
      config?.titleAlignment === "left" || config?.titleAlignment === "center"
        ? config.titleAlignment
        : DEFAULT_COMMENT_TOP_BAR_EXPERIMENT_CONFIG.titleAlignment,
    defaultAnchorVariant:
      variant && allowedVariants.includes(variant)
        ? variant
        : DEFAULT_COMMENT_TOP_BAR_EXPERIMENT_CONFIG.defaultAnchorVariant,
  };
}

function sanitizeCommentEmptyStatePresets(presets: CommentEmptyStatePreset[]) {
  return presets
    .filter(
      (preset) =>
        !BUILT_IN_COMMENT_EMPTY_STATE_PRESET_IDS.has(normalizePresetMatchValue(preset.id)) &&
        !BUILT_IN_COMMENT_EMPTY_STATE_PRESET_NAMES.has(normalizePresetMatchValue(preset.name)),
    )
    .map((preset) => ({
      ...preset,
      config: normalizeCommentEmptyStateConfig(preset.config),
    }));
}

function normalizeCommentEmptyStateConfig(
  config: Partial<CommentEmptyStateExperimentConfig> | undefined,
): CommentEmptyStateExperimentConfig {
  return {
    forceEmptyState:
      config?.forceEmptyState ?? DEFAULT_COMMENT_EMPTY_STATE_EXPERIMENT_CONFIG.forceEmptyState,
    style:
      config?.style === "default" ||
      config?.style === "yeah-or-nah" ||
      config?.style === "curious-about"
        ? config.style
        : DEFAULT_COMMENT_EMPTY_STATE_EXPERIMENT_CONFIG.style,
    yeahOrNahLook:
      config?.yeahOrNahLook === "a" ||
      config?.yeahOrNahLook === "b" ||
      config?.yeahOrNahLook === "c"
        ? config.yeahOrNahLook
        : DEFAULT_COMMENT_EMPTY_STATE_EXPERIMENT_CONFIG.yeahOrNahLook,
    curiousAboutLook:
      config?.curiousAboutLook === "a" || config?.curiousAboutLook === "b"
        ? config.curiousAboutLook
        : DEFAULT_COMMENT_EMPTY_STATE_EXPERIMENT_CONFIG.curiousAboutLook,
    replaceEmojiWithQuestions:
      config?.replaceEmojiWithQuestions ??
      DEFAULT_COMMENT_EMPTY_STATE_EXPERIMENT_CONFIG.replaceEmojiWithQuestions,
    showQuestionsAfterLongPress:
      config?.showQuestionsAfterLongPress ??
      DEFAULT_COMMENT_EMPTY_STATE_EXPERIMENT_CONFIG.showQuestionsAfterLongPress,
  };
}

function normalizePresetMatchValue(value: string) {
  return value.trim().toLowerCase();
}

function parseCommentExperimentId(value: string | null | undefined): CommentExperimentId | undefined {
  if (
    value === "comment-panel-expand" ||
    value === "comment-wiki" ||
    value === "comment-top-bar" ||
    value === "comment-empty-state"
  ) {
    return value;
  }
  return undefined;
}
