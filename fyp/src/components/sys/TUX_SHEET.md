# TUXSheet — AppFrame z-index

实现：`app_z_index.ts`、`app_frame_sheet_chrome.ts`。壳层树见 `app_frame.tsx` 文件头。

## 规则

挂到 `[data-app-frame-root]` 的 `TUXSheet` **必须**显式设 `zIndex`，**不能**用 TUX 默认的 `2000`。

| 层级 | 常量 | 值 | 谁 |
|------|------|-----|-----|
| Tab 业务 | — | `0` | `[data-app-frame-content]` |
| 一级 Sheet（全屏/immersive） | `APP_Z_SHEET` | `1900` | 相册、分享、评论、Inbox tab sheet … |
| 二级 Sheet | `APP_Z_SHEET_STACKED` | `1950` | 叠在一级 sheet 上：wiki … |
| 一级 Sheet（局部高度 + 透明 overlay） | `APP_Z_PARTIAL_SHEET` | `2000` | **配乐** 55%/70% snap — 须与软键盘分层一致 |
| 二级 Sheet（配乐栈） | `APP_Z_PARTIAL_SHEET_STACKED` | `2050` | trim / volume |
| 软键盘 dismiss | — | `1990` | `soft_keyboard_host.tsx` |
| 软键盘面板 | — | `2090` | `soft_keyboard_host.tsx` |
| StatusBar | `APP_Z_STATUS_BAR` | `2100` | `AppChromeStatusBar` |
| Home Indicator | `APP_Z_HOME_INDICATOR` | `2100` | `HomeIndicator` |
| 软键盘（顶层） | `APP_Z_KEYBOARD` | `2200` | 预留 |

### 为何默认 2000 会盖住顶栏

- TUX 默认 `zIndex={2000}`，与 `APP_Z_OVERLAY` 同级。
- StatusBar 在 `[data-app-frame-overlays]`（`z-index: 2000` + `isolation`）里，子节点 `2100` **出不去**父层。
- Sheet portal 若作为 `frame-root` 的**更晚**兄弟节点、也是 `2000`，整层会画在 overlays **上面** → 时间/信号/Home Indicator 被挡。

翻译成人话：**不是高度问题，是谁在上面谁挡谁。**

### 配乐黑屏 — overlay 机制（必读）

TUX `TUXSheet` 的 overlay 节点带 CSS 类 `.tux-sheet__overlay`，**默认**：

```css
background-color: var(--tux-v2-color-ui-sheet-backdrop-1); /* = #000000 */
```

配乐依赖 prop `overlayBackgroundColor="transparent"` 用**内联 style** 盖掉这条 CSS。若没传、或被别的层挡住，看到的就是**全屏纯黑**。

另外：配乐是 **draggable + snapHeights**，overlay 的 `opacity` 会随 `snapYValue / baseHeight` 从 0 涨到 1。初始化时 `sortedHeights=[0]` 会让 overlay 先以 **满 opacity** 画一帧；若黑底 CSS 没被 `transparent` 压住，打开动画就像「背景突然变黑」。`music_panel_transparent_overlay.ts` 用 `!important` 强制透明兜底。

**不是嵌套两层 MusicPanel**：`add-sound` 路由 early-return 只挂 `AddSoundPage` 里那一个 panel；相机 / 编辑页的 `musicPanelOverlay` 会随路由卸载。

**透明时看到的黑**：overlay 真透明时，透出的是 **背后内容** — Creation Tab 外包 `FeedSidebarWrapper` 是纯黑；`add-sound` 若没铺编辑预览，sheet 上方就像黑幕。`add_sound_page.tsx` 在 `edit-photo` / `edit-video` origin 下会恢复 captured preview。

**配乐不能用 `APP_Z_SHEET`（1900）**：`soft_keyboard_host.tsx` 假定 sheet 在 **2000**，dismiss 层在 **1990** 且在 sheet **下面**。改成 1900 后叠层顺序错乱。局部透明 sheet 用 `APP_Z_PARTIAL_SHEET`（2000）。

## 怎么用

```tsx
import { appFrameSheetChromeProps } from "../../components/sys/app_frame_sheet_chrome";

<TUXSheet
  root={frameRoot}
  {...appFrameSheetChromeProps()}
  position="bottom"
  …
/>
```

叠在另一个 sheet 上：

```tsx
import { appFrameStackedSheetChromeProps } from "../../components/sys/app_frame_sheet_chrome";

<TUXSheet {...appFrameStackedSheetChromeProps()} … />
```

场景级 chrome helper（`music_panel_sheet_chrome.ts`、`creation_sheet_chrome.ts`、`post_permission_sheet_chrome.ts` 等）在内部 **spread `appFrameSheetChromeProps()` / `appFrameStackedSheetChromeProps()`**，业务组件只调场景 helper，不要直接写 `zIndex`。

## 本仓库已接入

| 文件 | 层级 |
|------|------|
| `creation_album_picker.tsx` | `APP_Z_SHEET` via `creation_sheet_chrome` |
| `camera_effects_panel.tsx` | 同上 |
| `share_panel.tsx` | `APP_Z_SHEET` |
| `feed_title_panel.tsx` | `APP_Z_SHEET` |
| `repost_interaction_panel.tsx` | `APP_Z_SHEET` |
| `long_press_panel.tsx` | `APP_Z_SHEET` |
| `comment_panel.tsx` | `APP_Z_SHEET` |
| `comment_wiki_panel.tsx` | `APP_Z_SHEET_STACKED` |
| `comment_wiki_infograph_panel.tsx` | `APP_Z_SHEET_STACKED` |
| `music_panel_sheet_chrome.ts` → `music_panel.tsx` | `APP_Z_PARTIAL_SHEET`（2000）+ `overlayBackgroundColor: transparent` |
| 同上 → `trim_panel.tsx` / `volume_panel.tsx` | `APP_Z_PARTIAL_SHEET_STACKED`（2050） |
| `post_permission_sheet_chrome.ts` | `APP_Z_SHEET` |
| `inbox_tab_sheet.tsx` | `APP_Z_SHEET` |
| `story_detail_page_content.tsx`（StorySharePanel，`src/page/story/`） | `APP_Z_SHEET` |

## 禁止

- ❌ 不设 `zIndex`（落到 TUX 默认 2000）
- ❌ `zIndex >= APP_Z_STATUS_BAR` 的业务 sheet（除非不是 AppFrame 内 portal，且已与设计确认）
- ❌ 用 `paddingTop` / 减高度去「躲」StatusBar——那是布局，解决不了盖住顶栏

## 新增 Sheet 自检

```bash
rg 'TUXSheet' src/ --glob '!*.bak'
```

每个 `root={…AppFrame…}` 的实例应出现 `appFrameSheetChromeProps` 或 `appFrameStackedSheetChromeProps`（或场景 `*_sheet_chrome.ts` helper 内 spread 了二者之一）。

### 配乐模块示例

```tsx
import { musicPanelSheetChromeProps, musicStackedSheetChromeProps } from "./music_panel_sheet_chrome";

// 主面板
<TUXSheet visible={open} onVisibleChange={setOpen} {...musicPanelSheetChromeProps({ root })} />

// trim / volume（主面板仍开着）
<TUXSheet visible {...musicStackedSheetChromeProps({ root })} />
```
