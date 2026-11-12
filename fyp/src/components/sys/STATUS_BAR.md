# StatusBar / 壳层主题注册

实现：`status_bar.tsx`、`app_z_index.ts`、`app_frame.tsx`（注册栈）。App 挂载见 `App.tsx`（`frameOverlays` 内的 `AppChromeStatusBar`）。

顶/底 **inset 与安全区**（与 StatusBar 正交）：`SAFE_AREA.md`。

## 规则

- Tab 壳 **只渲染一条** `AppChromeStatusBar`（`APP_Z_STATUS_BAR`），不随业务浮层 `transform` 滑动。
- **禁止**在 `App.tsx` 按 `route` / `activeTab` 分支顶栏主题。
- **禁止**在 Tab 业务页再挂第二条 `<StatusBar />`。
- 独立路由页（如 `photo_text_detail/*RoutePage`）可用默认导出 `StatusBar`（无注册栈时跟 `useTheme`）。
- 壳层勿用 `StatusBar` 的遗留 `foreground` prop；用注册栈 + `ThemeScope`。
- **`Tabbar` 的 `themeOverride` 只驱动底栏 UI**（`ThemeScope` + 沉浸式 Tab 根背景），**不写** StatusBar / Home Indicator。

## 注册栈（LIFO）

栈顶生效；`null` = 撤销本 owner 的条目。

| API | 用途 |
|-----|------|
| `useTabAppChromeSurfaceTheme(isTabActive, theme)` | **Tab 根页首选**：仅激活 Tab 注册顶 + 底 |
| `useRegisterAppChromeSurfaceTheme(theme \| null)` | 顶 + 底同时（浮层、独立全屏子页） |
| `useRegisterStatusBarSurfaceTheme(theme \| null)` | 仅桌面顶栏 |
| `useRegisterHomeIndicatorSurfaceTheme(theme \| null)` | 仅底栏指示条 |

`theme`: `"light"` \| `"dark"`。

### 为何需要 `useTabAppChromeSurfaceTheme`

`Tabbar` 用 `hidden` 保留五个 Tab 子树，**非激活 Tab 仍挂载**。若在子组件里直接 `useRegisterAppChromeSurfaceTheme(theme)` 且不判断激活态，隐藏 Tab 的注册会留在 LIFO 栈上，盖住当前可见 Tab——典型症状：

- 浅色页（Profile / Inbox / Text to Image）顶栏变成 **白字**，像「没有 StatusBar」；
- 硬刷新与子页路由时表现不一致。

**约定：Tab 级壳层主题只在 Tab 根页注册，且必须带 `isTabActive`。**

```tsx
// App.tsx — 每个 Tab 根页传入激活态
<HomePage isTabActive={activeTab === 0} … />
<FriendsPage isTabActive={activeTab === 1} … />
<CreationPage isTabActive={activeTab === 2} … />
<InboxPage isTabActive={activeTab === 3} … />
<ProfilePage isTabActive={activeTab === 4} … />
```

```tsx
// Tab 根页 — 根据本 Tab 表面决定 theme
import { useTabAppChromeSurfaceTheme } from "../../components/sys/app_frame";
import { useTheme } from "../../context/theme";

function ExampleTabPage({ isTabActive = true }: { isTabActive?: boolean }) {
  const { resolvedTheme } = useTheme();
  useTabAppChromeSurfaceTheme(isTabActive, resolvedTheme);
  // …
}
```

等价于 `useRegisterAppChromeSurfaceTheme(isTabActive ? theme : null)`。

## 各 Tab 主题（权威在 Tab 根页）

在 **Tab 根页** 按路由/子 Tab 算出 `theme`，再交给 `useTabAppChromeSurfaceTheme`。子组件、页内栈 **默认不再** 重复注册整壳（避免隐藏挂载抢栈）。

| Tab | 文件 | `theme` 规则 |
|-----|------|----------------|
| Home | `home_page.tsx` | For You → `"dark"`；Explore → `resolvedTheme` |
| Friends | `friends_page.tsx` | 默认 `resolvedTheme`；Find Friends 沉浸式子步（`connect-now` / `qr` / `scan`）→ `"dark"` |
| Creation | `creation_page.tsx` | `studio` / `edit-photo` / `edit-video` / `preview` → `"dark"`；其余（text-to-image、配乐、publish 等）→ `resolvedTheme` |
| Inbox | `inbox_page.tsx` | 默认 `resolvedTheme`；`sub.screen === "story"` → `"dark"` |
| Profile | `profile_page.tsx` | `resolvedTheme` |

参考实现：`creation_page.tsx` 内 `CREATION_DARK_CHROME_SCREENS` + `useTabAppChromeSurfaceTheme`。

## 其它场景（非 Tab 根）

| 场景 | 做法 |
|------|------|
| Add to story 浮层 | `add_to_story_page.tsx`：`useRegisterAppChromeSurfaceTheme(mounted ? "dark" : null)` |
| 访客主页滑入 | `visitor_profile_app_chrome.tsx`：`phase === "open"` 时 `"light"` |
| 评论面板仅底栏 | `comment_panel.tsx`：`useRegisterHomeIndicatorSurfaceTheme(visible ? resolvedTheme : null)` |
| Edit Photo/Video 仅底栏 | `edit_photo_page.tsx` / `edit_video_page.tsx`：`useRegisterHomeIndicatorSurfaceTheme("dark")`（顶栏由 Creation Tab 根页负责） |

沉浸式 **布局与铺色**（非注册栈）：`app_frame.tsx` 文件头。

## 新增 Tab / 子路由检查清单

1. `App.tsx`：`pages` 接入 + `isTabActive={activeTab === N}`。
2. Tab 根页：`useTabAppChromeSurfaceTheme(isTabActive, …)`，按路由表决定 `light` / `dark`。
3. 子页、页内栈、shell：**不要**再 `useRegisterAppChromeSurfaceTheme`（除非是全 App 级浮层，且与 Tab 根逻辑不重复）。
4. 需要深色沉浸式子路由时，在 **Tab 根** 读 `route.sub` 分支（见 Friends / Inbox / Creation），不要散落在叶子组件。
5. 勿在 `App.tsx` 按 `activeTab` 写 StatusBar 分支；勿恢复 `Tabbar` 写顶栏注册。

## 自检

1. 当前可见 Tab 是否在根页用 `useTabAppChromeSurfaceTheme(isTabActive, …)` 注册？
2. 非激活 Tab 是否传 `isTabActive={false}`（注册为 `null`）？
3. 叶子组件是否误用 `useRegisterAppChromeSurfaceTheme` 导致隐藏 Tab 抢栈？
4. `themeOverride` 是否只用于 Tab 底栏 UI，而非 StatusBar？
5. 勿复制第二套 Home Indicator / StatusBar 实例。
