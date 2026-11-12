# Safe Area / AppFrame Inset 使用规则

实现：`src/index.css`（CSS token）、`app_frame.tsx`（React context）、`src/utils/viewport_insets.ts`（JS 读值）。Desagent 宿主协议见 `.claude/skills/desagent-runtime/references/bridge-protocol.md`。

**顶/底安全区是本仓库前端布局的硬约束。** 新增页面、NavBar、贴顶/贴底 composer、Feed 图文帧、Sheet 前必须先读本文件，再写 JSX。

---

## 1. 运行面（不要混用）

| 运行面 | 识别方式 | 假 StatusBar / HomeIndicator | 顶部 inset | 底部 inset |
|--------|----------|------------------------------|------------|------------|
| **真机**（iOS / Android） | `(hover: none) and (pointer: coarse)` | 不画（系统 chrome） | `env(safe-area-inset-top)` | `max(env(safe-area-inset-bottom), 8px)` |
| **Desagent 嵌入（手机框）** | `html[data-desagent-embed="true"]`（非 fullscreen） | **不画** — 宿主 owns | 宿主 `--safe-area-top` | 宿主 `--safe-area-bottom` |
| **Desagent Full Screen** | `html[data-desagent-fullscreen="true"]`（`deviceIndex: 21` 或宿主 `safe-area:set` 全 0） | **AppFrame 画**（唯一 Desagent 内显假壳的场景） | 固定 **62px** | 固定 **34px** |
| **浏览器 / node 预览 sm+** | 非 embed 且 `@media (min-width: 640px)` | AppFrame 画假壳（`app-frame-fake-*`） | 固定 **62px** | 固定 **34px** |

- 真机：**只用** `env()`，不读宿主 `--safe-area-*`。
- Desagent 手机框：`env()` 在 iframe 内常为 0，**必须**走 `--safe-area-*` → `--app-safe-area-*`；**禁止**叠 AppFrame 假 StatusBar / HomeIndicator。
- Desagent Full Screen：`/.desagent/artboards.json` 的 `deviceIndex: 21`、宿主 `safe-area:set` 全 0、或显式 `fullScreen` 消息 → `data-desagent-fullscreen="true"` → AppFrame 用 62/34px 并显示假壳。
- 独立浏览器 sm+：`index.css` 把 inset 换成 62/34px，并显示 `AppChromeStatusBar` + `HomeIndicator`（`.app-frame-fake-*` 类）。

---

## 2. CSS token  ladder（单一真值链）

```text
:root
  --safe-area-*          ← Desagent 宿主 / 默认 env() 回退
  --app-safe-area-*      ← 按运行面解析后的语义 inset

[data-app-frame-root]
  --app-frame-top-inset
  --app-frame-bottom-inset
  --app-frame-floating-bottom-inset   ← 键盘弹起时收 0
  --app-frame-top-toast-offset

.home-feed-page（Home For You 专用）
  --home-feed-tab-row-height: 44px
  --home-tabs-below-top: calc(var(--app-frame-top-inset) + var(--home-feed-tab-row-height))
```

### Tailwind utility（`index.css`）

| Class | 含义 |
|-------|------|
| `pt-app-frame-top` | `padding-top: var(--app-frame-top-inset)` |
| `pt-app-frame-top-gap-4` | 顶 inset + 16px（侧栏等） |
| `pb-app-safe-bottom` | `padding-bottom: max(var(--app-safe-area-bottom), 8px)` |
| `h-app-frame-bottom` | `height: var(--app-frame-bottom-inset)` |

**禁止**在业务里再写 `pt-[env(safe-area-inset-top)] sm:pt-15.5` 这类成对分支。

---

## 3. React：`useAppFrame()` 何时用什么

| Context 字段 | 用途 |
|--------------|------|
| `topInsetCss` | 贴顶 NavBar、Sheet 内容、全页 `paddingTop` — **仅清 StatusBar / 顶安全区** |
| `bottomInsetCss` | 贴底 Tab 内流 footer、scroll `padding-bottom` |
| `floatingBottomInsetCss` | 随软键盘上移的 composer（键盘弹起自动收 0） |
| `topToastOffsetCss` | 仅配合 `showAppFrameTopToast()` |

```tsx
import { useAppFrame } from "../../components/sys/app_frame";

const { topInsetCss, bottomInsetCss, floatingBottomInsetCss } = useAppFrame();

// 贴顶壳层
<div style={{ paddingTop: topInsetCss }} />

// 或 declarative
<div className="pt-app-frame-top" />
```

### 底 Tabbar（`AppTabBarNav`）

- 真机 / Desagent：`pb-app-tab-bar-bottom`（始终读 `--app-safe-area-bottom`）
- 独立浏览器 sm+：`pb-app-tab-bar-bottom` 收为 0 + `.app-frame-fake-home-indicator-spacer`（假 Home Indicator 占位）

---

## 4. Home Feed 顶 Tab 行（StatusBar **之下**还有一层）

Home For You / Explore 的 **分类 Tab** 叠在 Feed 上，内容起点不是 `topInsetCss`，而是：

```text
tabBottomPx = 顶安全区 + Tab 行高度(44px)
            = var(--home-tabs-below-top)
```

| 场景 | 做法 |
|------|------|
| CSS 布局 | `padding-top: var(--home-tabs-below-top)` 或 Explore 列表 `calc(var(--home-tabs-below-top) + 6px)` |
| JS 布局（图文多图帧） | `resolveHomeFeedTabBottomPx(root)` from `viewport_insets.ts` |
| 顶 Tab 容器 | `home_page.tsx`：`data-home-feed-top-chrome` + `pt-app-frame-top` |

**图文 Feed（含多图 carousel）**：`photo_text_post_layout.ts` 里 Framework B/C 的 `imageTopPx` **必须**从 `tabBottomPx` 起算，**禁止**只用顶安全区（会顶进 Tab 行）。

多图（`slideCount > 1`）在 Framework C 内 **顶对齐** `tabBottomPx`，不在 Tab 下方垂直居中留白。

---

## 5. JS 读像素（`src/utils/viewport_insets.ts`）

| API | 何时用 |
|-----|--------|
| `readAppFrameInsetPx("top" \| "bottom")` | 需要数值 px 的 transform / 布局（读 `--app-frame-*-inset`） |
| `resolveHomeFeedTabBottomPx(element?)` | Home 图文帧、任何「Tab 行下缘」定位 |
| `readCssVariablePx(el, "--token", "top")` | 读任意继承 token（含 calc 链） |
| `measureAppSafeAreaInsetPx` | 仅真机 native 键盘等必须用 `--app-safe-area-*` 原值的场景 |

**禁止**用 `getBoundingClientRect` 量顶 Tab 壳层替代上述公式（旋转 / HMR / 时序会漂）。

读值须在 `resize` / `ResizeObserver` 后重算；**禁止** mount 时读一次写死。

---

## 6. 参考实现（抄邻页）

| 场景 | 文件 |
|------|------|
| Tab 根页 NavBar 顶 inset | `inbox_page.tsx`、`profile_page.tsx` — `paddingTop: topInsetCss` |
| 全页顶栏 | `message_thread_content.tsx` — `pt-app-frame-top` |
| Home 顶 Tab 叠层 | `home_page.tsx` — `data-home-feed-top-chrome` + `pt-app-frame-top` |
| 图文多图帧 | `photo_text_feed_block.tsx` + `photo_text_post_layout.ts` |
| 侧栏顶距 | `feed_sidebar.tsx` — `pt-app-frame-top-gap-4` |
| 底 Tabbar 安全区 | `tabbar.tsx` — `pb-app-safe-bottom sm:pb-0` |
| 评论真机键盘 | `comment_text_field.tsx` — `measureAppSafeAreaInsetPx("bottom")` |
| 无 Home Tab 的预览 | `post_publish_preview_page.tsx` — `tabBottomPxOverride={0}` |

---

## 7. 禁止清单

1. 业务 CSS 直接写 `env(safe-area-inset-*)` 或硬编码 `62px` / `34px` / iPhone 刘海数值。
2. `sm:pt-15.5` 与 `env(...)` 成对手写 — 用 `pt-app-frame-top` 或 `topInsetCss`。
3. 把 **顶安全区** 当成 **Home Tab 行下缘**（Feed 图文 / 多图必错）。
4. 在 sm+ 重复画 StatusBar / Home Indicator（Desagent 窄宽度由宿主画，sm+ 由 `AppChromeStatusBar` + `HomeIndicator` 画）。
5. 绕过 `AppFrame` 自建全屏根后再自己猜 safe area。
6. `TUXTopToast.show()` 不带 AppFrame root — 用 `showAppFrameTopToast()`。

---

## 8. 新增页面自检

- [ ] 贴顶 UI 用的是 `topInsetCss` / `pt-app-frame-top`，不是 `env()` / `sm:pt-15.5`。
- [ ] 贴底 UI 用的是 `bottomInsetCss` / `pb-app-safe-bottom` / `h-app-frame-bottom`，Tabbar sm+ 有 `h-8.5` 占位。
- [ ] Home Feed 内若有顶 Tab 叠层，内容起点用 `--home-tabs-below-top` 或 `resolveHomeFeedTabBottomPx`。
- [ ] 浮层 composer 用 `floatingBottomInsetCss`；键盘高度用 `getSoftKeyboardPresentedHeight`。
- [ ] 改 inset 相关 CSS 后，在 **Desagent 窄宽度** 与 **桌面 sm+ 手机框** 各手测一遍。
