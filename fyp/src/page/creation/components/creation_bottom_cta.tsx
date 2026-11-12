import type { CSSProperties, ReactNode } from "react";

/** Creation 链路底部双 CTA 共用几何：px 12 / gap 8 / 安全区上 4 / 按钮 44。 */
export const CREATION_BOTTOM_CTA_HORIZONTAL_PADDING_PX = 12;
export const CREATION_BOTTOM_CTA_GAP_PX = 8;
export const CREATION_BOTTOM_CTA_SAFE_AREA_GAP_PX = 4;
export const CREATION_BOTTOM_CTA_BUTTON_HEIGHT_PX = 44;
export const CREATION_BOTTOM_CTA_BUTTON_HEIGHT = "44px";

/** CTA 行高度（44px 按钮 + 4px 距安全区）；含 pt-3 时再加 12px。 */
export const CREATION_BOTTOM_CTA_ROW_HEIGHT_PX =
  CREATION_BOTTOM_CTA_BUTTON_HEIGHT_PX + CREATION_BOTTOM_CTA_SAFE_AREA_GAP_PX;

export const CREATION_BOTTOM_CTA_ROW_WITH_TOP_PAD_HEIGHT_PX =
  CREATION_BOTTOM_CTA_ROW_HEIGHT_PX + 12;

export function creationBottomSafePaddingCss(
  bottomInsetCss: string,
  bottomGapPx: number = CREATION_BOTTOM_CTA_SAFE_AREA_GAP_PX,
): string {
  return `calc(${bottomInsetCss} + ${bottomGapPx}px)`;
}

export type CreationBottomCtaShellProps = {
  children: ReactNode;
  bottomInsetCss: string;
  /** 默认 {@link CREATION_BOTTOM_CTA_HORIZONTAL_PADDING_PX}；图文等页可覆写为 24。 */
  horizontalPaddingPx?: number;
  /** 按钮底到安全区上沿；默认 4px。 */
  bottomGapPx?: number;
  className?: string;
  style?: CSSProperties;
};

/** 贴底容器：水平 padding + 按钮区 + bottomGap 后再接 AppFrame 底部安全区。 */
export function CreationBottomCtaShell({
  children,
  bottomInsetCss,
  horizontalPaddingPx = CREATION_BOTTOM_CTA_HORIZONTAL_PADDING_PX,
  bottomGapPx = CREATION_BOTTOM_CTA_SAFE_AREA_GAP_PX,
  className = "",
  style,
}: CreationBottomCtaShellProps) {
  return (
    <div
      className={`shrink-0 ${className}`.trim()}
      style={{
        paddingLeft: horizontalPaddingPx,
        paddingRight: horizontalPaddingPx,
        paddingBottom: creationBottomSafePaddingCss(bottomInsetCss, bottomGapPx),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export type CreationBottomCtaRowProps = {
  children: ReactNode;
  className?: string;
};

/** 双 CTA 横排：gap 8，子项用 {@link CreationBottomCtaSlot} 包一层。 */
export function CreationBottomCtaRow({ children, className = "" }: CreationBottomCtaRowProps) {
  return (
    <div className={`flex w-full items-center gap-2 ${className}`.trim()}>{children}</div>
  );
}

export function CreationBottomCtaSlot({ children }: { children: ReactNode }) {
  return <div className="min-w-0 flex-1">{children}</div>;
}
