/**
 * AppFrame 左上角胶囊 + 浮层面板壳层（桌面 `sm+` 可见）。
 *
 * ## 配置面板（团队叫法）
 *
 * Feed / 评论 / 图文里，左上角齿轮或胶囊按钮 + 展开的调参浮层，统一叫 **配置面板**。
 * 新建或改这类 UI 时复用本文件的 `AppFrameCornerCapsuleTrigger`、
 * `APP_FRAME_CORNER_PANEL_CHROME_CLASS`、`appFrameCornerPanelChromeStyle`。
 *
 * | 场景 | 入口组件 | 挂载 |
 * |------|----------|------|
 * | 评论 | `comment_experiment_panel.tsx` → `CommentExperimentPanel` | `App.tsx` |
 * | Feed 异形卡 | `feed_card.tsx` → `FeedCardDebugControls` | `App.tsx`（feed-card） |
 * | Feed 图文条 | `feed_info_debug_controls.tsx` → `FeedInfoDebugControls` | `App.tsx`（feed-item） |
 * | 图文帖 dev | `photo_text_dev_panel.tsx` → `PhotoTextDevPanel` | `App.tsx`（feed-item） |
 * | 音乐详情实验 | `music_detail_experiment_toolbox.tsx` → `MusicDetailExperimentDebugControls` | `App.tsx`（feed-item） |
 *
 * 多个配置面板同侧堆叠时用 `stackIndex`；评论 Experiment 打开时其余入口让位或 `stackBelowCommentExperiment`。
 */
import { TUXButton, getColorCSSVar, type TUXButtonProps } from "@byted-tiktok/tux-web";
import type { CSSProperties, ReactNode } from "react";

/** Collapsed capsule height (`TUXButton` `height="32px"`). */
export const APP_FRAME_CORNER_TRIGGER_HEIGHT_PX = 32;

/** Vertical gap between stacked triggers on the same side. */
export const APP_FRAME_CORNER_TRIGGER_STACK_GAP_PX = 8;

/** Offset below the viewport top safe area. */
export const APP_FRAME_CORNER_TRIGGER_TOP_OFFSET_PX = 16;

/** Default z-index for collapsed corner triggers (expanded panels use +100). */
export const APP_FRAME_CORNER_TRIGGER_Z_CLASS = "z-3200";

export const APP_FRAME_CORNER_PANEL_Z_CLASS = "z-3300";

/** 配置面板展开态外壳（评论 / Feed / 图文共用）。 */
export const APP_FRAME_CORNER_PANEL_CHROME_CLASS =
  "max-h-[calc(100vh-var(--app-safe-area-top)-var(--app-safe-area-bottom)-32px)] flex flex-col shadow-panel-floating backdrop-blur-xl border rounded-[16px] w-80 max-w-[calc(100vw-32px)]";

export function appFrameCornerPanelChromeStyle(): CSSProperties {
  return {
    backgroundColor: getColorCSSVar("UIPageFlat1"),
    borderColor: getColorCSSVar("UIShapeNeutral3"),
  };
}

/** Config panels: standalone sm+; Desagent Full Screen only (phone preview hidden). */
export const APP_FRAME_CORNER_VISIBILITY_CLASS = "app-frame-config-panel-chrome";

/** Same as {@link APP_FRAME_CORNER_VISIBILITY_CLASS} with flex layout for triggers. */
export const APP_FRAME_CORNER_TRIGGER_VISIBILITY_CLASS =
  "app-frame-config-panel-chrome app-frame-config-panel-chrome--flex";

const SIDE_CLASS = {
  left: "left-4",
  right: "right-4",
} as const;

export type AppFrameCornerSide = keyof typeof SIDE_CLASS;

/**
 * `top` for `position: fixed` corner UI — anchored to the browser viewport
 * (same model as RouteSwitcher / ThemeSwitcher), not the phone frame box.
 */
export function appFrameCornerTopCss(stackIndex = 0): string {
  const stackOffset =
    stackIndex * (APP_FRAME_CORNER_TRIGGER_HEIGHT_PX + APP_FRAME_CORNER_TRIGGER_STACK_GAP_PX);
  return `calc(var(--app-safe-area-top) + ${APP_FRAME_CORNER_TRIGGER_TOP_OFFSET_PX}px + ${stackOffset}px)`;
}

export type AppFrameCornerCapsuleTriggerProps = {
  side: AppFrameCornerSide;
  /** 0 = first row under the top inset; increments stack downward on the same side. */
  stackIndex?: number;
  visible?: boolean;
  text: string;
  leadingIcon?: ReactNode;
  onClick: () => void;
  "aria-label"?: string;
  zIndexClass?: string;
  className?: string;
  style?: CSSProperties;
} & Partial<Pick<TUXButtonProps, "disabled" | "testId">>;

/**
 * Viewport-fixed top-left / top-right capsule trigger — mount from `App` or
 * other shell-level hosts. Visible at standalone sm+ or Desagent Full Screen;
 * hidden in Desagent phone preview. Bottom route/theme switchers use
 * `app-shell-dev-toolbar` instead.
 */
export function AppFrameCornerCapsuleTrigger({
  side,
  stackIndex = 0,
  visible = true,
  text,
  leadingIcon,
  onClick,
  "aria-label": ariaLabel,
  zIndexClass = APP_FRAME_CORNER_TRIGGER_Z_CLASS,
  className,
  style,
  disabled,
  testId,
}: AppFrameCornerCapsuleTriggerProps) {
  if (!visible) return null;

  return (
    <div
      className={[
        APP_FRAME_CORNER_TRIGGER_VISIBILITY_CLASS,
        SIDE_CLASS[side],
        zIndexClass,
        "fixed items-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        top: appFrameCornerTopCss(stackIndex),
        height: APP_FRAME_CORNER_TRIGGER_HEIGHT_PX,
        ...style,
      }}
    >
      <TUXButton
        text={text}
        smoothRadius
        themePreset="secondary"
        shapePreset="capsule"
        sizePreset="small"
        leadingIcon={leadingIcon}
        onClick={onClick}
        backgroundColor="UIPageFlat1"
        borderStyle="solid"
        borderWidth="0.5px"
        borderColor="UIShapeNeutral3"
        paddingInline="12px"
        height={`${APP_FRAME_CORNER_TRIGGER_HEIGHT_PX}px`}
        aria-label={ariaLabel ?? text}
        disabled={disabled}
        testId={testId}
      />
    </div>
  );
}

export type AppFrameCornerPanelAnchorProps = {
  side: AppFrameCornerSide;
  stackIndex?: number;
  visible?: boolean;
  children: ReactNode;
  zIndexClass?: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * Viewport-fixed anchor for expanded panels — same `top` / stack as
 * {@link AppFrameCornerCapsuleTrigger}.
 */
export function AppFrameCornerPanelAnchor({
  side,
  stackIndex = 0,
  visible = true,
  children,
  zIndexClass = APP_FRAME_CORNER_PANEL_Z_CLASS,
  className,
  style,
}: AppFrameCornerPanelAnchorProps) {
  if (!visible) return null;

  return (
    <div
      className={[
        APP_FRAME_CORNER_VISIBILITY_CLASS,
        SIDE_CLASS[side],
        zIndexClass,
        "fixed",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ top: appFrameCornerTopCss(stackIndex), ...style }}
    >
      {children}
    </div>
  );
}
