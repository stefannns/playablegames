import type { CSSProperties } from "react";

import type { ResolvedTheme } from "../../context/theme";

export type HomeIndicatorProps = {
  className?: string;
  style?: CSSProperties;
  /** 底部条所在表面的有效明暗（由 AppFrame 汇总全局 + 页面覆盖） */
  surfaceTheme: ResolvedTheme;
};

/** iOS 风格指示条：半透明填充，避免纯色在亮色底上出现描边/光晕 */
function pillBackground(surfaceTheme: ResolvedTheme) {
  return surfaceTheme === "dark"
    ? "rgba(255, 255, 255, 0.72)"
    : "rgba(0, 0, 0, 0.52)";
}

/**
 * Home 指示条（仅独立浏览器 sm+ 显示；Desagent 宿主 owns 底栏 chrome）。
 * 用于模拟移动端底部 Home Indicator 的视觉元素，方便统一维护。
 */
export default function HomeIndicator({
  className,
  style,
  surfaceTheme,
}: HomeIndicatorProps) {
  return (
    <div
      data-app-home-indicator="true"
      className={`app-frame-fake-home-indicator justify-center items-end pb-2 w-full h-8.5 ${className ?? ""}`}
      style={style}
    >
      <div
        className="h-1.25 w-36 rounded-full"
        style={{
          backgroundColor: pillBackground(surfaceTheme),
          border: "none",
          boxShadow: "none",
        }}
      />
    </div>
  );
}
