import {
  TUXButton,
  TUXIconButton,
  TUXSwitch,
  TUXText,
  getColorCSSVar,
} from "@byted-tiktok/tux-web";
import {
  APP_FRAME_CORNER_PANEL_CHROME_CLASS,
  AppFrameCornerCapsuleTrigger,
  AppFrameCornerPanelAnchor,
  appFrameCornerPanelChromeStyle,
} from "../../../../components/sys/app_frame_corner_capsule_trigger";
import {
  IconChevronCollapse,
  IconChevronDown,
  IconTrashBin,
} from "@byted-tiktok/tux-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  COMMENT_EMPTY_STATE_CURIOUS_ABOUT_LOOK_OPTIONS,
  COMMENT_EMPTY_STATE_STYLE_OPTIONS,
  COMMENT_EMPTY_STATE_YEAH_OR_NAH_LOOK_OPTIONS,
  COMMENT_IMAGE_CROPPING_STYLE_OPTIONS,
  COMMENT_TOP_BAR_ANCHOR_VARIANT_OPTIONS,
  COMMENT_TOP_BAR_TITLE_ALIGNMENT_OPTIONS,
  COMMENT_WIKI_DETAIL_PAGE_OPTIONS,
  COMMENT_EXPERIMENT_OPTIONS,
  MAX_COMMENT_IMAGE_AREA,
  type CommentEmptyStateExperimentConfig,
  type CommentEmptyStatePreset,
  type CommentExperimentConfig,
  type CommentExperimentId,
  type CommentPanelExpandPreset,
  type CommentTopBarExperimentConfig,
  type CommentTopBarPreset,
  type CommentWikiExperimentConfig,
  type CommentWikiPreset,
} from "./comment_experiment_config";

type CommentExperimentPanelProps = {
  visible: boolean;
  activeExperimentId: CommentExperimentId;
  panelExpandConfig: CommentExperimentConfig;
  panelExpandPresets: CommentPanelExpandPreset[];
  wikiConfig: CommentWikiExperimentConfig;
  wikiPresets: CommentWikiPreset[];
  topBarConfig: CommentTopBarExperimentConfig;
  topBarPresets: CommentTopBarPreset[];
  emptyStateConfig: CommentEmptyStateExperimentConfig;
  emptyStatePresets: CommentEmptyStatePreset[];
  onActiveExperimentChange: (next: CommentExperimentId) => void;
  onPanelExpandConfigChange: (next: CommentExperimentConfig) => void;
  onWikiConfigChange: (next: CommentWikiExperimentConfig) => void;
  onTopBarConfigChange: (next: CommentTopBarExperimentConfig) => void;
  onEmptyStateConfigChange: (next: CommentEmptyStateExperimentConfig) => void;
  onSavePreset: (name: string) => void;
  onApplyPreset: (presetId: string) => void;
  onDeletePreset: (presetId: string) => void;
  onResetDefaults: () => void;
};

export function CommentExperimentPanel({
  visible,
  activeExperimentId,
  panelExpandConfig,
  panelExpandPresets,
  wikiConfig,
  wikiPresets,
  topBarConfig,
  topBarPresets,
  emptyStateConfig,
  emptyStatePresets,
  onActiveExperimentChange,
  onPanelExpandConfigChange,
  onWikiConfigChange,
  onTopBarConfigChange,
  onEmptyStateConfigChange,
  onSavePreset,
  onApplyPreset,
  onDeletePreset,
  onResetDefaults,
}: CommentExperimentPanelProps) {
  if (!visible) return null;
  const [collapsed, setCollapsed] = useState(true);

  if (collapsed) {
    return (
      <AppFrameCornerCapsuleTrigger
        side="left"
        stackIndex={0}
        text="Experiment"
        onClick={() => setCollapsed(false)}
        aria-label="Open comment experiment panel"
      />
    );
  }

  return (
    <ExperimentPanelContent
      activeExperimentId={activeExperimentId}
      panelExpandConfig={panelExpandConfig}
      panelExpandPresets={panelExpandPresets}
      wikiConfig={wikiConfig}
      wikiPresets={wikiPresets}
      topBarConfig={topBarConfig}
      topBarPresets={topBarPresets}
      emptyStateConfig={emptyStateConfig}
      emptyStatePresets={emptyStatePresets}
      onActiveExperimentChange={onActiveExperimentChange}
      onPanelExpandConfigChange={onPanelExpandConfigChange}
      onWikiConfigChange={onWikiConfigChange}
      onTopBarConfigChange={onTopBarConfigChange}
      onEmptyStateConfigChange={onEmptyStateConfigChange}
      onSavePreset={onSavePreset}
      onApplyPreset={onApplyPreset}
      onDeletePreset={onDeletePreset}
      onResetDefaults={onResetDefaults}
      onCollapse={() => setCollapsed(true)}
    />
  );
}

function ExperimentPanelContent({
  activeExperimentId,
  panelExpandConfig,
  panelExpandPresets,
  wikiConfig,
  wikiPresets,
  topBarConfig,
  topBarPresets,
  emptyStateConfig,
  emptyStatePresets,
  onActiveExperimentChange,
  onPanelExpandConfigChange,
  onWikiConfigChange,
  onTopBarConfigChange,
  onEmptyStateConfigChange,
  onSavePreset,
  onApplyPreset,
  onDeletePreset,
  onResetDefaults,
  onCollapse,
}: Omit<CommentExperimentPanelProps, "visible"> & { onCollapse: () => void }) {
  const [experimentMenuOpen, setExperimentMenuOpen] = useState(false);
  const experimentMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!experimentMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (experimentMenuRef.current?.contains(event.target as Node)) return;
      setExperimentMenuOpen(false);
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [experimentMenuOpen]);

  const updateConfig = <K extends keyof CommentExperimentConfig,>(
    key: K,
    value: CommentExperimentConfig[K],
  ) => {
    onPanelExpandConfigChange({ ...panelExpandConfig, [key]: value });
  };

  const activeExperimentLabel =
    COMMENT_EXPERIMENT_OPTIONS.find((item) => item.id === activeExperimentId)?.label ??
    COMMENT_EXPERIMENT_OPTIONS[0].label;
  const activeCroppingStyleLabel =
    COMMENT_IMAGE_CROPPING_STYLE_OPTIONS.find(
      (item) => item.id === panelExpandConfig.imageCroppingStyle,
    )?.label ?? COMMENT_IMAGE_CROPPING_STYLE_OPTIONS[0].label;
  const activeWikiDetailPageLabel =
    COMMENT_WIKI_DETAIL_PAGE_OPTIONS.find(
      (item) => item.id === wikiConfig.detailPageVersion,
    )?.label ?? COMMENT_WIKI_DETAIL_PAGE_OPTIONS[0].label;
  const activeTopBarTitleAlignmentLabel =
    COMMENT_TOP_BAR_TITLE_ALIGNMENT_OPTIONS.find(
      (item) => item.id === topBarConfig.titleAlignment,
    )?.label ?? COMMENT_TOP_BAR_TITLE_ALIGNMENT_OPTIONS[0].label;
  const activeTopBarAnchorVariantLabel =
    COMMENT_TOP_BAR_ANCHOR_VARIANT_OPTIONS.find(
      (item) => item.id === topBarConfig.defaultAnchorVariant,
    )?.label ?? COMMENT_TOP_BAR_ANCHOR_VARIANT_OPTIONS[0].label;
  const activeEmptyStateStyleLabel =
    COMMENT_EMPTY_STATE_STYLE_OPTIONS.find((item) => item.id === emptyStateConfig.style)?.label ??
    COMMENT_EMPTY_STATE_STYLE_OPTIONS[0].label;
  const emptyStateLookOptions =
    emptyStateConfig.style === "curious-about"
      ? COMMENT_EMPTY_STATE_CURIOUS_ABOUT_LOOK_OPTIONS
      : COMMENT_EMPTY_STATE_YEAH_OR_NAH_LOOK_OPTIONS;
  const activeEmptyStateLookId =
    emptyStateConfig.style === "curious-about"
      ? emptyStateConfig.curiousAboutLook
      : emptyStateConfig.yeahOrNahLook;
  const activeEmptyStateLookLabel =
    emptyStateLookOptions.find((item) => item.id === activeEmptyStateLookId)?.label ??
    emptyStateLookOptions[0].label;
  const emptyStateLookAvailable =
    emptyStateConfig.style === "yeah-or-nah" || emptyStateConfig.style === "curious-about";
  const wikiGlowAvailable = wikiConfig.detailPageVersion === "v1-content-panel";
  const imageAreaAvailable = panelExpandConfig.imageCroppingStyle === "default";
  const imageExpandRateAvailable = panelExpandConfig.imageCroppingStyle === "simple";
  // 派生「展开能力」：只要 allowDrag 或 showExpandButton 任一开启即可展开；
  // 都关闭时其余 expand 组选项不可用，等价于旧的 Allow Expand off。
  const panelExpandEnabled = panelExpandConfig.allowDrag || panelExpandConfig.showExpandButton;
  const panelExpandControlsDisabled = !panelExpandEnabled;

  const activePresets = useMemo(() => {
    if (activeExperimentId === "comment-wiki") return wikiPresets;
    if (activeExperimentId === "comment-top-bar") return topBarPresets;
    if (activeExperimentId === "comment-empty-state") return emptyStatePresets;
    return panelExpandPresets;
  }, [activeExperimentId, panelExpandPresets, wikiPresets, topBarPresets, emptyStatePresets]);

  const presetItems = useMemo(() => {
    if (activeExperimentId === "comment-wiki") {
      return wikiPresets.map((preset) => ({
        id: preset.id,
        name: preset.name,
        summary:
          `Wiki ${preset.config.enabled ? "on" : "off"} · ` +
          `Glow ${preset.config.showGlow ? "on" : "off"} · ` +
          (
            COMMENT_WIKI_DETAIL_PAGE_OPTIONS.find(
              (item) => item.id === preset.config.detailPageVersion,
            )?.label ?? COMMENT_WIKI_DETAIL_PAGE_OPTIONS[0].label
          ),
      }));
    }
    if (activeExperimentId === "comment-top-bar") {
      return topBarPresets.map((preset) => ({
        id: preset.id,
        name: preset.name,
        summary:
          `Anchor ${preset.config.showAnchor ? "on" : "off"} · ` +
          `Grabber ${preset.config.showGrabber ? "on" : "off"} · ` +
          `Title ${
            COMMENT_TOP_BAR_TITLE_ALIGNMENT_OPTIONS.find(
              (item) => item.id === preset.config.titleAlignment,
            )?.label ?? COMMENT_TOP_BAR_TITLE_ALIGNMENT_OPTIONS[0].label
          }`,
      }));
    }
    if (activeExperimentId === "comment-empty-state") {
      return emptyStatePresets.map((preset) => {
        const styleLabel =
          COMMENT_EMPTY_STATE_STYLE_OPTIONS.find((item) => item.id === preset.config.style)
            ?.label ?? COMMENT_EMPTY_STATE_STYLE_OPTIONS[0].label;
        const baseSummary =
          preset.config.style === "yeah-or-nah"
            ? `Force ${preset.config.forceEmptyState ? "on" : "off"} · Style ${styleLabel} · Look ${preset.config.yeahOrNahLook.toUpperCase()}`
            : preset.config.style === "curious-about"
              ? `Force ${preset.config.forceEmptyState ? "on" : "off"} · Style ${styleLabel} · Look ${preset.config.curiousAboutLook.toUpperCase()}`
              : `Force ${preset.config.forceEmptyState ? "on" : "off"} · Style ${styleLabel}`;
        const summary = preset.config.replaceEmojiWithQuestions
          ? `${baseSummary} · Q-Bar on`
          : baseSummary;
        return {
          id: preset.id,
          name: preset.name,
          summary,
        };
      });
    }
    return panelExpandPresets.map((preset) => ({
      id: preset.id,
      name: preset.name,
      summary:
        `Drag ${preset.config.allowDrag ? "on" : "off"} · Expand ` +
        `${preset.config.showExpandButton ? "on" : "off"} · PiP ${preset.config.showPiP ? "on" : "off"} · Crop ` +
          `${preset.config.imageCroppingStyle} · Area ${preset.config.imageTargetArea} · Expand ${preset.config.imageExpandRate}x · ` +
        `Radius ${preset.config.imageBorderRadius}`,
    }));
  }, [activeExperimentId, panelExpandPresets, wikiPresets, topBarPresets, emptyStatePresets]);

  return (
    <AppFrameCornerPanelAnchor
      side="left"
      stackIndex={0}
      className={APP_FRAME_CORNER_PANEL_CHROME_CLASS}
      style={appFrameCornerPanelChromeStyle()}
    >
      <div
        className="flex flex-col gap-3 px-4 py-3 border-b shrink-0"
        style={{ borderColor: getColorCSSVar("UIShapeNeutral3") }}
      >
        <div className="flex justify-between items-center gap-3">
          <TUXText
            as="div"
            style={{
              fontSize: 15,
              fontWeight: 600,
              lineHeight: "19.5px",
              color: getColorCSSVar("UIText1"),
            }}
          >
            Experiment Control
          </TUXText>
          <div className="flex items-center gap-2">
            <TUXButton
              text="Reset"
              smoothRadius
              themePreset="secondary"
              shapePreset="capsule"
              sizePreset="small"
              onClick={onResetDefaults}
              backgroundColor="UIPageFlat2"
              borderStyle="solid"
              borderWidth="0.5px"
              borderColor="UIShapeNeutral3"
              paddingInline="10px"
              height="28px"
            />
            <TUXIconButton
              icon={<IconChevronCollapse width={14} height={14} />}
              sizePreset="small"
              onClick={onCollapse}
              backgroundColor="UIPageFlat2"
            />
          </div>
        </div>
        <div className="w-full">
          <ExperimentSelect
            menuRef={experimentMenuRef}
            activeLabel={activeExperimentLabel}
            open={experimentMenuOpen}
            onToggle={() => setExperimentMenuOpen((current) => !current)}
            onSelect={(nextId) => {
              onActiveExperimentChange(nextId);
              setExperimentMenuOpen(false);
            }}
          />
        </div>
      </div>

      <div className="flex flex-col flex-1 gap-4 p-4 min-h-0 overflow-y-auto">
        {activeExperimentId === "comment-wiki" ? (
          <>
            <ToggleRow
              label="Show Wiki Entry Point"
              value={wikiConfig.enabled}
              onChange={(next) => onWikiConfigChange({ ...wikiConfig, enabled: next })}
            />
            <ToggleRow
              label="Show Glow"
              value={wikiConfig.showGlow}
              onChange={(next) => onWikiConfigChange({ ...wikiConfig, showGlow: next })}
              disabled={!wikiGlowAvailable}
            />
            <SelectRow
              label="Detail Page Version"
              valueLabel={activeWikiDetailPageLabel}
              options={COMMENT_WIKI_DETAIL_PAGE_OPTIONS}
              onSelect={(next) => onWikiConfigChange({ ...wikiConfig, detailPageVersion: next })}
            />
          </>
        ) : activeExperimentId === "comment-top-bar" ? (
          <>
            <ToggleRow
              label="Show Anchor"
              value={topBarConfig.showAnchor}
              onChange={(next) => onTopBarConfigChange({ ...topBarConfig, showAnchor: next })}
            />
            {topBarConfig.showAnchor ? (
              <DropdownRow
                label="Default Anchor"
                valueLabel={activeTopBarAnchorVariantLabel}
                options={COMMENT_TOP_BAR_ANCHOR_VARIANT_OPTIONS}
                onSelect={(next) =>
                  onTopBarConfigChange({ ...topBarConfig, defaultAnchorVariant: next })
                }
              />
            ) : null}
            <ToggleRow
              label="Show Grabber"
              value={topBarConfig.showGrabber}
              onChange={(next) => onTopBarConfigChange({ ...topBarConfig, showGrabber: next })}
            />
            <SelectRow
              label="Title Alignment"
              valueLabel={activeTopBarTitleAlignmentLabel}
              options={COMMENT_TOP_BAR_TITLE_ALIGNMENT_OPTIONS}
              onSelect={(next) =>
                onTopBarConfigChange({ ...topBarConfig, titleAlignment: next })
              }
            />
          </>
        ) : activeExperimentId === "comment-empty-state" ? (
          <>
            <ToggleRow
              label="Force Empty State"
              value={emptyStateConfig.forceEmptyState}
              onChange={(next) =>
                onEmptyStateConfigChange({ ...emptyStateConfig, forceEmptyState: next })
              }
            />
            <SelectRow
              label="Style"
              valueLabel={activeEmptyStateStyleLabel}
              options={COMMENT_EMPTY_STATE_STYLE_OPTIONS}
              onSelect={(next) =>
                onEmptyStateConfigChange({ ...emptyStateConfig, style: next })
              }
            />
            <SelectRow
              label="Looks"
              valueLabel={activeEmptyStateLookLabel}
              options={emptyStateLookOptions}
              onSelect={(next) => {
                if (emptyStateConfig.style === "curious-about") {
                  onEmptyStateConfigChange({
                    ...emptyStateConfig,
                    curiousAboutLook: next as typeof emptyStateConfig.curiousAboutLook,
                  });
                } else {
                  onEmptyStateConfigChange({
                    ...emptyStateConfig,
                    yeahOrNahLook: next as typeof emptyStateConfig.yeahOrNahLook,
                  });
                }
              }}
              disabled={!emptyStateLookAvailable}
            />
            <ToggleRow
              label="Replace Emoji w/ Questions"
              value={emptyStateConfig.replaceEmojiWithQuestions}
              onChange={(next) =>
                onEmptyStateConfigChange({
                  ...emptyStateConfig,
                  replaceEmojiWithQuestions: next,
                })
              }
            />
            <ToggleRow
              label="Show Questions After Long Pressing"
              value={emptyStateConfig.showQuestionsAfterLongPress}
              onChange={(next) =>
                onEmptyStateConfigChange({
                  ...emptyStateConfig,
                  showQuestionsAfterLongPress: next,
                })
              }
              disabled={emptyStateConfig.style !== "curious-about"}
            />
          </>
        ) : (
          <>
            {/*
             * Allow Expand 已弃用：其能力由 Allow Drag 与 Show Expand 共同覆盖；
             * 两者全部关闭时，等价于旧的 Allow Expand off 状态。
             */}
            {/* <ToggleRow
              label="Allow Expand"
              value={panelExpandConfig.allowExpand}
              onChange={(next) => updateConfig("allowExpand", next)}
            /> */}
            <ToggleRow
              label="Allow Drag"
              value={panelExpandConfig.allowDrag}
              onChange={(next) => updateConfig("allowDrag", next)}
            />
            <ToggleRow
              label="Show Expand"
              value={panelExpandConfig.showExpandButton}
              onChange={(next) => updateConfig("showExpandButton", next)}
            />
            <ToggleRow
              label="Show PiP"
              value={panelExpandConfig.showPiP}
              onChange={(next) => updateConfig("showPiP", next)}
              disabled={panelExpandControlsDisabled}
            />
            <NumberRow
              label="Image Radius"
              value={panelExpandConfig.imageBorderRadius}
              min={0}
              max={24}
              step={1}
              onChange={(next) => updateConfig("imageBorderRadius", next)}
              disabled={panelExpandControlsDisabled}
            />
            <SelectRow
              label="Image Cropping Style"
              valueLabel={activeCroppingStyleLabel}
              options={COMMENT_IMAGE_CROPPING_STYLE_OPTIONS}
              onSelect={(next) => updateConfig("imageCroppingStyle", next)}
              disabled={panelExpandControlsDisabled}
            />
            {imageAreaAvailable ? (
              <NumberRow
                label="Image Area"
                value={panelExpandConfig.imageTargetArea}
                min={12000}
                max={MAX_COMMENT_IMAGE_AREA}
                step={500}
                onChange={(next) => updateConfig("imageTargetArea", next)}
                disabled={panelExpandControlsDisabled}
              />
            ) : null}
            {imageExpandRateAvailable ? (
              <NumberRow
                label="Image Expand Rate"
                value={panelExpandConfig.imageExpandRate}
                min={1}
                max={3}
                step={0.05}
                onChange={(next) => updateConfig("imageExpandRate", next)}
                disabled={panelExpandControlsDisabled}
              />
            ) : null}
          </>
        )}

        <PresetSection
          presets={presetItems}
          onSavePreset={onSavePreset}
          onApplyPreset={onApplyPreset}
          onDeletePreset={onDeletePreset}
          emptyMessage={`Save the current ${activeExperimentLabel} settings as a preset to compare experiments.`}
          savedCount={activePresets.length}
        />
      </div>
    </AppFrameCornerPanelAnchor>
  );
}

type ExperimentSelectProps = {
  menuRef: React.RefObject<HTMLDivElement>;
  activeLabel: string;
  open: boolean;
  onToggle: () => void;
  onSelect: (nextId: CommentExperimentId) => void;
};

const ExperimentSelect = ({
  menuRef,
  activeLabel,
  open,
  onToggle,
  onSelect,
}: ExperimentSelectProps) => (
  <div ref={menuRef} className="relative">
    <button
      type="button"
      onClick={onToggle}
      className="flex justify-between items-center px-3 py-2 border rounded-xl w-full text-left"
      style={{
        backgroundColor: getColorCSSVar("UIPageFlat2"),
        borderColor: getColorCSSVar("UIShapeNeutral3"),
      }}
    >
      <div className="min-w-0">
        <TUXText
          as="div"
          style={{
            fontSize: 11,
            fontWeight: 600,
            lineHeight: "14.3px",
            color: getColorCSSVar("UIText3"),
          }}
        >
          Experiment
        </TUXText>
        <TUXText
          as="div"
          style={{
            fontSize: 13,
            fontWeight: 600,
            lineHeight: "16.9px",
            color: getColorCSSVar("UIText1"),
          }}
        >
          {activeLabel}
        </TUXText>
      </div>
      <IconChevronDown width={16} height={16} style={{ color: getColorCSSVar("UIText3") }} />
    </button>

    {open ? (
      <div
        className="top-experiment-menu right-0 left-0 z-10 absolute p-1 border rounded-xl"
        style={{
          backgroundColor: getColorCSSVar("UIPageFlat1"),
          borderColor: getColorCSSVar("UIShapeNeutral3"),
          boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
        }}
      >
        {COMMENT_EXPERIMENT_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className="px-3 py-2 rounded-lg w-full text-left"
            style={{
              backgroundColor:
                option.label === activeLabel
                  ? getColorCSSVar("UIPageFlat2")
                  : "transparent",
            }}
          >
            <TUXText
              as="div"
              style={{
                fontSize: 13,
                fontWeight: 600,
                lineHeight: "16.9px",
                color: getColorCSSVar("UIText1"),
              }}
            >
              {option.label}
            </TUXText>
          </button>
        ))}
      </div>
    ) : null}
  </div>
);

function ToggleRow({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex justify-between items-center gap-3">
      <TUXText
        as="span"
        style={{
          fontSize: 13,
          fontWeight: 500,
          lineHeight: "16.9px",
          color: getColorCSSVar(disabled ? "UITextPlaceholder" : "UIText1"),
        }}
      >
        {label}
      </TUXText>
      <TUXSwitch
        name={`experiment-${label.toLowerCase().replace(/\s+/g, "-")}`}
        value={label}
        sizePreset="small"
        checked={value}
        onChange={(_event: unknown, checked: boolean) => onChange(checked)}
        disabled={disabled}
        backgroundColor="UIShapePrimary"
      />
    </div>
  );
}

function NumberRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  disabled = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}) {
  const safeValue = Number.isFinite(value) ? value : min;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center gap-3">
        <TUXText
          as="span"
          style={{
            fontSize: 13,
            fontWeight: 500,
            lineHeight: "16.9px",
            color: getColorCSSVar(disabled ? "UITextPlaceholder" : "UIText1"),
          }}
        >
          {label}
        </TUXText>
        <input
          type="number"
          value={safeValue}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={(event) => {
            if (disabled) return;
            const next = Number(event.target.value);
            if (!Number.isFinite(next)) return;
            onChange(clamp(next, min, max));
          }}
          style={{
            width: 84,
            height: 28,
            borderRadius: 10,
            border: `0.5px solid ${getColorCSSVar("UIShapeNeutral3")}`,
            backgroundColor: getColorCSSVar("UIPageFlat2"),
            color: getColorCSSVar(disabled ? "UITextPlaceholder" : "UIText1"),
            padding: "0 10px",
            fontSize: 13,
            lineHeight: "16.9px",
          }}
        />
      </div>
      <input
        type="range"
        value={safeValue}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(event) => {
          if (disabled) return;
          onChange(Number(event.target.value));
        }}
        style={{
          width: "100%",
          accentColor: getColorCSSVar("UIShapePrimary"),
          opacity: disabled ? 0.4 : 1,
        }}
      />
    </div>
  );
}

function SelectRow<TOptionId extends string>({
  label,
  valueLabel,
  options,
  onSelect,
  disabled = false,
}: {
  label: string;
  valueLabel: string;
  options: Array<{ id: TOptionId; label: string }>;
  onSelect: (next: TOptionId) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center gap-3">
        <TUXText
          as="span"
          style={{
            fontSize: 13,
            fontWeight: 500,
            lineHeight: "16.9px",
            color: getColorCSSVar(disabled ? "UITextPlaceholder" : "UIText1"),
          }}
        >
          {label}
        </TUXText>
        <TUXText
          as="span"
          style={{
            fontSize: 12,
            fontWeight: 400,
            lineHeight: "15.6px",
            color: getColorCSSVar(disabled ? "UITextPlaceholder" : "UIText3"),
          }}
        >
          {valueLabel}
        </TUXText>
      </div>
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const selected = option.label === valueLabel;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                if (disabled) return;
                onSelect(option.id);
              }}
              disabled={disabled}
              className="flex justify-between items-center px-3 py-2 border rounded-xl text-left"
              style={{
                backgroundColor: selected
                  ? getColorCSSVar("UIPageFlat2")
                  : getColorCSSVar("UIPageFlat1"),
                borderColor: selected
                  ? getColorCSSVar("UIShapePrimary")
                  : getColorCSSVar("UIShapeNeutral3"),
                opacity: disabled ? 0.5 : 1,
              }}
            >
              <TUXText
                as="span"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: "16.9px",
                  color: getColorCSSVar(disabled ? "UITextPlaceholder" : "UIText1"),
                }}
              >
                {option.label}
              </TUXText>
              <TUXText
                as="span"
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  lineHeight: "15.6px",
                  color: selected
                    ? getColorCSSVar("UITextInfo")
                    : getColorCSSVar("UITextPlaceholder"),
                }}
              >
                {selected ? "Selected" : "Available"}
              </TUXText>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DropdownRow<TOptionId extends string>({
  label,
  valueLabel,
  options,
  onSelect,
  disabled = false,
}: {
  label: string;
  valueLabel: string;
  options: Array<{ id: TOptionId; label: string }>;
  onSelect: (next: TOptionId) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div className="flex justify-between items-center gap-3">
      <TUXText
        as="span"
        style={{
          fontSize: 13,
          fontWeight: 500,
          lineHeight: "16.9px",
          color: getColorCSSVar(disabled ? "UITextPlaceholder" : "UIText1"),
        }}
      >
        {label}
      </TUXText>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            setOpen((current) => !current);
          }}
          className="flex items-center gap-1 px-2.5 py-1 border rounded-lg"
          style={{
            backgroundColor: getColorCSSVar("UIPageFlat2"),
            borderColor: getColorCSSVar("UIShapeNeutral3"),
            opacity: disabled ? 0.5 : 1,
            minHeight: 28,
          }}
        >
          <TUXText
            as="span"
            style={{
              fontSize: 12,
              fontWeight: 600,
              lineHeight: "15.6px",
              color: getColorCSSVar(disabled ? "UITextPlaceholder" : "UIText1"),
            }}
          >
            {valueLabel}
          </TUXText>
          <IconChevronDown
            width={14}
            height={14}
            style={{ color: getColorCSSVar(disabled ? "UITextPlaceholder" : "UIText3") }}
          />
        </button>
        {open ? (
          <div
            className="top-[calc(100%+6px)] right-0 z-20 absolute p-1 border rounded-xl min-w-[140px]"
            style={{
              backgroundColor: getColorCSSVar("UIPageFlat1"),
              borderColor: getColorCSSVar("UIShapeNeutral3"),
              boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
            }}
          >
            {options.map((option) => {
              const selected = option.label === valueLabel;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onSelect(option.id);
                    setOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-lg w-full text-left"
                  style={{
                    backgroundColor: selected
                      ? getColorCSSVar("UIPageFlat2")
                      : "transparent",
                  }}
                >
                  <TUXText
                    as="span"
                    style={{
                      fontSize: 12,
                      fontWeight: selected ? 600 : 500,
                      lineHeight: "15.6px",
                      color: getColorCSSVar("UIText1"),
                    }}
                  >
                    {option.label}
                  </TUXText>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PresetSection({
  presets,
  onSavePreset,
  onApplyPreset,
  onDeletePreset,
  emptyMessage,
  savedCount,
}: {
  presets: Array<{ id: string; name: string; summary: string }>;
  onSavePreset: (name: string) => void;
  onApplyPreset: (presetId: string) => void;
  onDeletePreset: (presetId: string) => void;
  emptyMessage: string;
  savedCount: number;
}) {
  const [name, setName] = useState("");

  return (
    <div
      className="pt-4 border-t"
      style={{ borderColor: getColorCSSVar("UIShapeNeutral3") }}
    >
      <div className="flex justify-between items-center gap-3 mb-2">
        <TUXText
          as="span"
          style={{
            fontSize: 13,
            fontWeight: 600,
            lineHeight: "16.9px",
            color: getColorCSSVar("UIText1"),
          }}
        >
          Presets
        </TUXText>
        <TUXText
          as="span"
          style={{
            fontSize: 12,
            fontWeight: 400,
            lineHeight: "15.6px",
            color: getColorCSSVar("UIText3"),
          }}
        >
          {savedCount} saved
        </TUXText>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          value={name}
          placeholder="Preset name"
          onChange={(event) => setName(event.target.value)}
          style={{
            flex: 1,
            height: 32,
            borderRadius: 10,
            border: `0.5px solid ${getColorCSSVar("UIShapeNeutral3")}`,
            backgroundColor: getColorCSSVar("UIPageFlat2"),
            color: getColorCSSVar("UIText1"),
            padding: "0 12px",
            fontSize: 13,
            lineHeight: "16.9px",
          }}
        />
        <TUXButton
          text="Save"
          smoothRadius
          themePreset="primary"
          shapePreset="capsule"
          sizePreset="small"
          onClick={() => {
            const nextName = name.trim();
            if (!nextName) return;
            onSavePreset(nextName);
            setName("");
          }}
          paddingInline="10px"
          height="32px"
        />
      </div>

      <div className="flex flex-col gap-2 pr-1 max-h-48 overflow-y-auto">
        {presets.length === 0 ? (
          <div
            className="px-3 py-2 rounded-xl"
            style={{ backgroundColor: getColorCSSVar("UIPageFlat2") }}
          >
            <TUXText
              as="div"
              style={{
                fontSize: 12,
                fontWeight: 400,
                lineHeight: "15.6px",
                color: getColorCSSVar("UIText3"),
              }}
            >
              {emptyMessage}
            </TUXText>
          </div>
        ) : null}
        {presets.map((preset) => (
          <div
            key={preset.id}
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ backgroundColor: getColorCSSVar("UIPageFlat2") }}
          >
            <button
              type="button"
              onClick={() => onApplyPreset(preset.id)}
              className="flex-1 text-left"
            >
              <TUXText
                as="div"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: "16.9px",
                  color: getColorCSSVar("UIText1"),
                }}
              >
                {preset.name}
              </TUXText>
              <TUXText
                as="div"
                style={{
                  fontSize: 12,
                  fontWeight: 400,
                  lineHeight: "15.6px",
                  color: getColorCSSVar("UIText3"),
                }}
              >
                {preset.summary}
              </TUXText>
            </button>
            <button
              type="button"
              aria-label={`Delete preset ${preset.name}`}
              onClick={() => onDeletePreset(preset.id)}
              className="flex justify-center items-center rounded-full w-8 h-8"
              style={{ color: getColorCSSVar("UIText3") }}
            >
              <IconTrashBin width={16} height={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
