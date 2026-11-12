import { useId, type CSSProperties } from "react";

/**
 * 客态 profile chip 用的彩色 icon 本地副本（Showcase / Subscription / LIVE）。
 *
 * 为什么不直接用 `@byted-tiktok/tux-icons` 的 `TUXIconColorProfile*Fill`：
 * 这些 SVG 的渐变用的是**写死的静态 id**（如 `Icon_Color-Profile_Showcase_Fill_svg__a`）。
 * Showcase 同时也在自己的 Profile tab 渲染，而非激活的 tab 被 Tabbar 用 `hidden`
 * (`display:none`) 挂着。浏览器会把 `fill="url(#同名id)"` 解析到 DOM 里**第一个**匹配
 * （正好在 display:none 子树里、不参与绘制的）渐变上 → 当前可见的 icon 拿不到 paint
 * server → 掉色（变黑/透明）。
 *
 * 这里用 `useId()` 给每个实例独立 id，彻底规避跨实例 / 跨 tab 的 id 碰撞。路径与渐变
 * 数据与 tux-icons 对应图标 1:1 一致。
 */

type GradientStop = { offset?: number; color: string };
type ColorIconSpec = {
  d: string;
  evenOdd?: boolean;
  gradient: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    stops: GradientStop[];
  };
};

const SHOWCASE: ColorIconSpec = {
  d: "M24 .8c5.47 0 10.08 4.06 10.77 9.48l1.03 8.05h4.25c1.93 0 2.9 0 3.6.39.61.34 1.1.89 1.36 1.54.3.74.18 1.7-.06 3.62l-1.32 10.7c-.5 4.1-.76 6.14-1.72 7.68a8.24 8.24 0 0 1-3.53 3.12c-1.65.77-3.71.77-7.84.77H17.47c-4.13 0-6.2 0-7.84-.77a8.24 8.24 0 0 1-3.53-3.12c-.96-1.54-1.22-3.59-1.72-7.68l-1.33-10.7C2.82 21.96 2.7 21 3 20.26a3.1 3.1 0 0 1 1.36-1.54c.7-.4 1.67-.4 3.6-.4h4.24l1.03-8.04C13.92 4.86 18.53.8 24 .8Zm0 7.21a3.65 3.65 0 0 0-3.62 3.19l-.91 7.13h9.06l-.91-7.13A3.65 3.65 0 0 0 24 8Z",
  evenOdd: true,
  gradient: {
    x1: 37.2,
    y1: 45.71,
    x2: 37.2,
    y2: 1.24,
    stops: [{ color: "#F5A0FF" }, { offset: 0.72, color: "#FE2C55" }],
  },
};

const LIVE: ColorIconSpec = {
  d: "M27.2 4.71c3.64 0 6.39 0 8.55.23 1.8.18 3.55.58 5.08 1.57 1.4.96 2.57 2.2 3.42 3.68.76 1.32 1.16 2.9 1.36 5.16.2 2.29.2 5.2.2 9.15 0 3.96 0 6.87-.2 9.15-.2 2.27-.6 3.85-1.36 5.17-.85 1.47-2 2.73-3.42 3.68-1.32.89-2.9 1.34-5.08 1.57-2.16.22-4.9.22-8.55.22h-6.4c-3.64 0-6.39 0-8.55-.22-2.18-.23-3.76-.68-5.08-1.57a11.12 11.12 0 0 1-3.42-3.68C3 37.5 2.6 35.92 2.4 33.65c-.2-2.28-.2-5.2-.2-9.15s0-6.86.2-9.15c.2-2.26.6-3.84 1.36-5.16.9-1.56 2.16-2.87 3.67-3.85 1.27-.78 2.79-1.19 4.83-1.4 2.16-.23 4.91-.23 8.55-.23h6.4ZM14.15 24.76a2.75 2.75 0 0 0-2.75 2.75v6a2.75 2.75 0 1 0 5.5 0v-6a2.75 2.75 0 0 0-2.75-2.75Zm9.85-12a2.75 2.75 0 0 0-2.75 2.75v18a2.75 2.75 0 1 0 5.5 0v-18A2.75 2.75 0 0 0 24 12.76Zm9.81 6.99a2.75 2.75 0 0 0-2.75 2.75v11a2.75 2.75 0 1 0 5.5 0v-11a2.75 2.75 0 0 0-2.75-2.75Z",
  evenOdd: true,
  gradient: {
    x1: 38,
    y1: 45.78,
    x2: 38,
    y2: 4.49,
    stops: [
      { color: "#F5A0FF" },
      { offset: 0.72, color: "#FE2C55" },
      { offset: 1, color: "#FE2C55" },
    ],
  },
};

const SUBSCRIPTION: ColorIconSpec = {
  d: "M39.4 42.2c.3 2.24-2 3.9-4.04 2.94l-7.95-3.77a67.73 67.73 0 0 0 10.85-7.98l1.14 8.81ZM21.93 3.85a2.85 2.85 0 0 1 5.01 0l2.36 4.32c-.64.26.65-.29 0 0 0 0 1.94-.76 3.73-1.25 2.44-.67 4.8-.98 6.86-.76 4.63.48 7.36 4.18 6.47 8.75-.4 2.03-1.4 4.19-2.75 6.33-2.73 4.3-7.22 8.98-12.8 13.1-5.59 4.13-11.38 7.05-16.29 8.4-2.45.67-4.8.98-6.86.76C3.03 43 .3 39.32 1.19 34.75c.4-2.03 1.39-4.2 2.75-6.34.7-1.12 2.32-3.23 2.32-3.23l-3.53-3.74a2.85 2.85 0 0 1 1.55-4.75l10.94-2.05a2 2 0 0 0 1.39-1.01l5.32-9.78ZM9.6 28.71c-.6.78-1.14 1.54-1.6 2.27a14.44 14.44 0 0 0-2.1 4.7c-.36 1.86.37 2.85 2.26 3.05.86.09 1.77-.02 1.77-.02-.51.1.44-.03 0 0l.98-7.55c.14-1.07-.64-1.74-1.3-2.45ZM39.4 10.93c-1.26-.13-2.99.04-5.1.62-.85.23-1.74.54-2.67.89.5.9.9 1.98 2.04 2.2L40.98 16c-.21.49.3-.55 0 0 0 0 .47-1.03.67-2.02.36-1.87-.37-2.86-2.26-3.06Z",
  gradient: {
    x1: 38.39,
    y1: 47.04,
    x2: 38.39,
    y2: 2.13,
    stops: [{ color: "#F5A0FF" }, { offset: 0.72, color: "#FE2C55" }],
  },
};

function ColorChipIcon({ spec, size }: { spec: ColorIconSpec; size: number }) {
  const gradientId = useId();
  const style: CSSProperties = { fontSize: `${size}px` };
  return (
    <svg
      viewBox="0 0 48 48"
      width="1em"
      height="1em"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      aria-hidden="true"
    >
      <path
        d={spec.d}
        fill={`url(#${gradientId})`}
        {...(spec.evenOdd ? { fillRule: "evenodd", clipRule: "evenodd" } : {})}
      />
      <defs>
        <linearGradient
          id={gradientId}
          x1={spec.gradient.x1}
          y1={spec.gradient.y1}
          x2={spec.gradient.x2}
          y2={spec.gradient.y2}
          gradientUnits="userSpaceOnUse"
        >
          {spec.gradient.stops.map((stop, index) => (
            <stop key={index} offset={stop.offset} stopColor={stop.color} />
          ))}
        </linearGradient>
      </defs>
    </svg>
  );
}

export function VisitorChipShowcaseIcon({ size }: { size: number }) {
  return <ColorChipIcon spec={SHOWCASE} size={size} />;
}

export function VisitorChipLiveIcon({ size }: { size: number }) {
  return <ColorChipIcon spec={LIVE} size={size} />;
}

export function VisitorChipSubscriptionIcon({ size }: { size: number }) {
  return <ColorChipIcon spec={SUBSCRIPTION} size={size} />;
}
