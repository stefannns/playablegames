/** Icon_Bitmap/Blue_V_Badge — 10×10 handle 行；待 tux-icons 导出 TUXIconBitmapBlueVBadge 后可切组件 */
const BLUE_V_BADGE_SRC = "/resource/icons/blue-v-badge.png";

type ProfileVerifiedBadgeProps = {
  size?: number;
  className?: string;
};

/** 与 P3-Semibold handle 行并排时的光学垂直校正（主态/客态 handle 行一致） */
const HANDLE_ROW_OPTICAL_NUDGE_PX = 0;

export function ProfileVerifiedBadge({ size = 10, className }: ProfileVerifiedBadgeProps) {
  const handleRowNudge =
    size === 10 ? { transform: `translateY(${HANDLE_ROW_OPTICAL_NUDGE_PX}px)` } : undefined;

  return (
    <span
      aria-hidden
      className={[
        "inline-flex shrink-0 items-center justify-center leading-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ width: size, height: size, ...handleRowNudge }}
    >
      <img
        src={BLUE_V_BADGE_SRC}
        alt=""
        width={size}
        height={size}
        draggable={false}
        className="block h-full w-full object-contain"
      />
    </span>
  );
}
