import { createElement, isValidElement, useState } from "react";
import type {
  CSSProperties,
  ComponentType,
  ReactElement,
  ReactNode,
} from "react";

import { ThemeScope, type ThemeMode } from "../../context/theme";

type Five<T> = readonly [T, T, T, T, T];

export type TabbarIcon = ReactElement | ComponentType<any>;

export type TabbarTabItem = {
  icon: TabbarIcon;
  activeIcon: TabbarIcon;
  text?: ReactNode;
  ariaLabel?: string;
  themeOverride?: ThemeMode;
};

type TabbarBaseProps = {
  pages: Five<ReactNode>;
  activeIndex?: number;
  defaultActiveIndex?: number;
  onChange?: (activeIndex: number) => void;
  className?: string;
  style?: CSSProperties;
  iconSize?: number;
  themeOverrides?: Five<ThemeMode | undefined>;
  tabBarVisible?: boolean;
};

type TabbarPropsWithTabs = TabbarBaseProps & {
  tabs: Five<TabbarTabItem>;
};

type TabbarPropsWithIcons = TabbarBaseProps & {
  icons: Five<TabbarIcon>;
  activeIcons: Five<TabbarIcon>;
  texts?: Five<ReactNode | undefined>;
};

export type TabbarProps = TabbarPropsWithTabs | TabbarPropsWithIcons;

const renderIcon = (iconLike: TabbarIcon, size: number) => {
  if (isValidElement(iconLike)) return iconLike;

  return createElement(iconLike as never, { size, width: size, height: size });
};

const normalizeTabItems = (props: TabbarProps): Five<TabbarTabItem> => {
  if ("tabs" in props) {
    return props.tabs.map((tab, index) => ({
      ...tab,
      themeOverride: tab.themeOverride ?? props.themeOverrides?.[index],
    })) as unknown as Five<TabbarTabItem>;
  }

  return props.icons.map((icon, index) => ({
    icon,
    activeIcon: props.activeIcons[index],
    text: props.texts?.[index],
    themeOverride: props.themeOverrides?.[index],
  })) as unknown as Five<TabbarTabItem>;
};

export type AppTabBarNavProps = {
  tabs: Five<TabbarTabItem>;
  activeIndex: number;
  onChange: (activeIndex: number) => void;
  iconSize?: number;
  className?: string;
  style?: CSSProperties;
  /** 首页等沉浸式 Tab：与 Feed 同色底，去掉顶部分隔线避免亮色模式下「描边」 */
  immersive?: boolean;
  /** Portfolio preview retains the original chrome without enabling other pages. */
  displayOnly?: boolean;
};

export const AppTabBarNav = ({
  tabs,
  activeIndex,
  onChange,
  iconSize = 24,
  className,
  style,
  immersive = false,
  displayOnly = false,
}: AppTabBarNavProps) => {
  const defaultNavClassName = immersive
    ? "relative z-10 flex flex-col flex-none bg-tux-v2-brand-tiktok-black font-semibold text-[10px] text-tux-v2-ui-text-1-display leading-none"
    : "relative z-10 flex flex-col flex-none bg-tux-v2-ui-page-flat-1 shadow-tabbar-top font-semibold text-[10px] text-tux-v2-ui-text-1-display leading-none";

  return (
    <nav
      role="tablist"
      aria-label="Tabs"
      className={[
        className ?? defaultNavClassName,
        "pb-app-tab-bar-bottom",
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      <div className="flex flex-row justify-between">
        {tabs.map((tab, index) => {
          const selected = index === activeIndex;
          const icon = renderIcon(
            selected ? tab.activeIcon : tab.icon,
            iconSize,
          );

          return (
            <button
              key={index}
              className="flex flex-auto flex-col items-center justify-center"
              type="button"
              role="tab"
              aria-selected={selected}
              aria-label={tab.ariaLabel}
              aria-disabled={displayOnly || undefined}
              title={displayOnly ? "Display only in this preview" : undefined}
              data-active={selected ? "true" : "false"}
              onClick={() => { if (!displayOnly) onChange(index); }}
            >
              <span className="leading-none">{icon}</span>
              {tab.text == null ? null : (
                <span className="mt-0.75 leading-none">{tab.text}</span>
              )}
            </button>
          );
        })}
      </div>

      <div
        className="app-frame-fake-home-indicator-spacer w-full h-8.5"
        aria-hidden
      />
    </nav>
  );
};

const Tabbar = (props: TabbarProps) => {
  const {
    pages,
    activeIndex,
    defaultActiveIndex = 0,
    onChange,
    className,
    style,
    iconSize = 24,
    tabBarVisible = true,
  } = props;

  const tabItems = normalizeTabItems(props);

  const [internalActiveIndex, setInternalActiveIndex] =
    useState(defaultActiveIndex);
  const resolvedActiveIndex = activeIndex ?? internalActiveIndex;
  const activeThemeOverride = tabItems[resolvedActiveIndex]?.themeOverride;

  const setActiveIndex = (index: number) => {
    onChange?.(index);
    if (activeIndex === undefined) setInternalActiveIndex(index);
  };

  // 沉浸式 Tab（首页）：根容器铺同色黑底，避免亮色模式下 feed 与 Tab 栏之间因
  // flex 子像素取整露出浅色 AppFrame 背景，形成一条「描边」般的 1px 边缘线。
  const immersiveActive = activeThemeOverride === "dark";
  const tabbarRootBgClass = immersiveActive
    ? "bg-tux-v2-brand-tiktok-black"
    : "bg-tux-v2-ui-page-flat-1";

  return (
    <div
      data-component="Tabbar"
      className={[className, tabbarRootBgClass].filter(Boolean).join(" ")}
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        position: "relative",
        ...style,
      }}
    >
      <div
        style={{
          flex: "1 1 auto",
          minHeight: 0,
          overflow: "hidden",
          position: "relative",
          zIndex: 0,
        }}
      >
        {pages.map((page, index) => (
          <div
            key={index}
            hidden={index !== resolvedActiveIndex}
            style={{ height: "100%", minHeight: 0 }}
          >
            {page}
          </div>
        ))}
      </div>

      {tabBarVisible ? (
        activeThemeOverride ? (
          <ThemeScope mode={activeThemeOverride}>
            <AppTabBarNav
              tabs={tabItems}
              activeIndex={resolvedActiveIndex}
              onChange={setActiveIndex}
              iconSize={iconSize}
              immersive={activeThemeOverride === "dark"}
            />
          </ThemeScope>
        ) : (
          <AppTabBarNav
            tabs={tabItems}
            activeIndex={resolvedActiveIndex}
            onChange={setActiveIndex}
            iconSize={iconSize}
          />
        )
      ) : null}
    </div>
  );
};

export default Tabbar;
