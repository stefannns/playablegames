# Comment Empty State · "Curious about" 方向文档

> 适用范围：替换评论面板「无评论」时的「插画 + Comment 按钮」原态。
> 实验位置：`Comment Empty State` 实验下，新增 style `curious-about`，并在其下分 Looks（A / B）。
> 题面共享：标题文案 `Curious about?` + 一个**刷新（refresh）图标**按钮，刷新后换一组围绕当前视频的问题。
> Chips 文案围绕视频本身，是观众真实会问的小问题（咖啡店例：`what beans?` / `where is this place?` / `is the wifi password public 😏` / `who shot this?` / `playlist drop?` / `latte art tutorial?`）。
>
> 设计基调：克制、几何、活泼，不靠夸张动画或贴纸感。两个 Looks 走完全不同的版式：A 是**横向静态拼贴**，B 是**对话式扇形展开**，互不共享骨架。
>
> 行为统一：点击任一 chip → 把内容塞进 `CommentTextField` + 激活焦点（不真的发送，方便用户继续编辑）。点击刷新 → 当前 chip 列表整组替换为下一组（带极轻的 stagger fade 入场）。

---

## 共用元素：标题区

- 标题文本：`Curious about?`，22–24px / 600（Semibold）。
- 标题颜色：`UIText1`。
- **紧跟在标题之后**有一个 refresh icon button（不是装饰图形，是真的刷新功能）：
  - 图标：`tux-icons` 中的 `IconArrowsCounterClockwise` / `IconArrowClockwise`（搜 `refresh` / `reload` / `cycle` 取最贴切的那个；不要换成 `Sparkle`、`Star` 这种"看起来漂亮但无意义"的图标）。
  - 尺寸：18–20px，颜色 `UIText2`。
  - 命中区：32×32 透明 button，圆角 16px。按下时 icon 自身做 `rotate(360deg)` 一圈（300ms ease-out-quart），不要重复转。
  - 行为：换一批 chips；如果当前已有上一批，做 fade-out → 新批 stagger fade-in（每个 30–40ms）。
- 标题与 refresh 图标之间间距 6–8px；整体作为一个 inline-flex 单位。

---

## Look A · Pill Mosaic（错位静态拼贴）

布局：标题 + refresh 居左对齐在内容区顶部；下方 **3 行 pill**，每行 2–3 个，**行与行之间水平错位**形成排版节奏，而不是规整栅格。

- 行错位：第 1 行 `padding-left: 0`，第 2 行 `padding-left: 24px`，第 3 行 `padding-left: 12px`。
- pill 形状：圆角固定 14px（不是胶囊），高度 32–34px，水平 padding 14px。
- 字号：13px / 500，颜色 `UIText1`，整 chip 一行不换行。
- 配色（每行最多 1 个填色锚点，其余中性）：
  - 描边款：`UISheetFlat1` 背景 + 1px `UIShapeNeutral3` 描边。
  - 中性实底款：`UISheetFlat3` 背景，无描边。
  - 焦点款：`BrandTikTokSplash` 背景 + `UIShapeText1OnSecondary` 文字（每行至多 1 个，整页至多 2 个）。
- 标题左侧装饰：在 `Curious about?` 行的最左侧前置一个静态几何符号 `✦`（小写星号字符 / SVG，14px，颜色 `UIText3`），仅用于打节奏，不做动画。

布局节奏感：

- 整体内容区垂直方向**居中偏上**（top padding ≈ 28px，留下方一些负空间避免压到输入框）。
- pill 之间水平间距 8px，行间距 10px。
- 总宽度限制在面板内宽 - 32px（左右各留 16px 余量）。

动效：

- 入场：标题 + refresh fade-up（opacity 0→1 + translateY 6→0，220ms ease-out-quart）。pill 按 row-major 顺序 stagger，每个 30ms。
- 点击：被点 pill 描边变粗为 1.5px + translateY -1px（120ms），随后 fade 80ms 后填入输入框。
- 没有持续 motion；不要漂浮、不要滚动。

参考感：杂志侧栏、editorial tag cloud、TikTok 搜索 trending 的克制版。

---

## Look B · Fan Bubbles（标题居左 · 气泡居右扇形）

布局：**对话式**——标题在左侧上方，3 个问题气泡在右侧成列，每个气泡有微小角度变化形成扇形趋势。

- 左侧：`Curious about?` + refresh icon 一组，垂直方向**与中间气泡同高**（不是顶部对齐，是视觉对话的「发起方」位置）。
- 右侧 3 个气泡纵向堆叠：
  - 第 1 个：`rotate(-3deg)`，水平 `translateX: -8px`（往左偏）。
  - 第 2 个：`rotate(0deg)`，水平居中（作为锚）。
  - 第 3 个：`rotate(+3deg)`，水平 `translateX: +6px`（往右偏）。
  - 角度只为打破秩序感，不超过 ±4°，避免廉价感。
- 气泡形状：**圆角矩形 16px**（不是胶囊），padding `10px 14px`，最小高度 36px，支持两行换行（长问题不截断）。
- 气泡之间垂直间距 8px。
- 气泡有一个**极细 V 形 tail**指向左侧标题方向（沿用项目里 Look A 的 V 形 open path 画法，`viewBox="0 0 20 18"`、`stroke-width: 1.5`，避免闭合三角描边接缝问题），tail 仅出现在中间那个气泡，作为对话指向锚（不是每个都出 tail，避免重复噪音）。

气泡配色（节奏 1+1+1）：

- 第 1 个：`UISheetFlat1` 底 + 1px `UIShapeNeutral3` 描边 + `UIText1` 文字。
- 第 2 个：`UISheetFlat3` 实底（无描边）+ `UIText1` 文字。
- 第 3 个：`BrandTikTokSplash` 实底 + `UIShapeText1OnSecondary` 文字。
- 文字：13–14px / 500。

布局节奏感：

- 整体内容区水平居中后**整组左右各留 16px**；左侧标题列宽度约占 38%，右侧气泡列约占 58%，中间留 4% 视觉缝隙。
- 整组内容垂直居中于 empty state 区域。

动效：

- 入场：标题 fade-up；3 个气泡 stamp-in（scale 0.92→1 + 各自旋转角度从 0 → 目标角度），stagger 60ms，曲线 ease-out-quart。
- 点击：被点气泡 lift 2px + 旋转回 0° + 描边/底色加重，再 fade 进输入框。
- 刷新：3 个气泡同时 fade-out（120ms），新一批以相同 stamp-in 序列进入。
- 没有持续漂浮 motion。

参考感：iMessage 群聊截图、editorial 引用排版、问答类海报。最贴「围绕视频提问」的语义——像创作者听到观众发问。

---

## 共用规则

- 颜色：**一律使用 TUX color token**，不要硬编码 hex / rgba，确保暗色模式一致。
  - 中性：`UISheetFlat1` / `UISheetFlat2` / `UISheetFlat3` / `UIShapeNeutral3`。
  - 文字：`UIText1` / `UIText2` / `UIText3`，反色 `UIShapeText1OnSecondary` / `UIShapeText1OnPrimary`。
  - 焦点色：`BrandTikTokSplash`（仅做单点强调，全页不超过 1–2 个填色锚点）。
- 圆角：pill / 气泡使用**固定圆角**（A 用 14px、B 用 16px），不用 `999px` 胶囊，避免单/双行场景下圆角不一致。
- 不用 em dash；问题文案以小写起头、可带轻量 emoji（≤1 个/句）。
- 进场动效仅一次；点击与刷新动效都受 120–220ms 上限约束；曲线统一使用 ease-out-quart 系列，**禁止 bounce/elastic**。
- 题源：所有 chip 内容必须围绕「当前视频」可能引发的好奇心，避免泛泛"how are you?"型套话。

---

## 工程落地说明

### 配置项

在 `comment_experiment_config.ts` 扩展：

- `CommentEmptyStateStyle` 增加 `"curious-about"` 选项。
- 新增 `CommentEmptyStateCuriousAboutLook = "a" | "b"`。
- `CommentEmptyStateExperimentConfig` 增加 `curiousAboutLook` 字段，默认 `"a"`。
- `COMMENT_EMPTY_STATE_STYLE_OPTIONS` 增加 `{ id: "curious-about", label: "Curious about" }`。
- 增加 Looks 选项：`A · Pill Mosaic`、`B · Fan Bubbles`。
- 增加 presets：`empty-state-preset-curious-about-a/b`。

### 组件结构

- 在 `comment_empty_state.tsx` 中新增分支：当 `style === "curious-about"` 时渲染 `CommentEmptyStateCuriousAbout`，内部按 `look` 选 A / B。
- 复用现有 `onChipSelect(text)` 钩子做"填到输入框 + 聚焦"。
- 内部维护一个本地 state `chipBatchIndex`，刷新时 `+1`，从一个 `CURIOUS_ABOUT_BATCHES: readonly (readonly string[])[]` 列表里循环取一组。
- 刷新图标使用 `@byted-tiktok/tux-icons` 中的 refresh / reload 类图标（先搜 `refresh`，无则 `reload`，无则 `arrows` + `clockwise`），**不要替换为视觉装饰图标**。

### 文件

- 视觉与交互：`comment_empty_state.tsx`（追加分支，不新建文件，避免组件碎片）。
- 样式：`comment_empty_state.css`（追加 `.curious` 命名空间，与 `.yon-` 隔离）。

---

## 落地清单

- [ ] `comment_experiment_config.ts`：扩展 `style` + `curiousAboutLook` + Looks options + presets。
- [ ] `comment_experiment_panel.tsx`：在 Style 切到 `curious-about` 时显示 Looks 选择。
- [ ] `comment_empty_state.tsx`：`CommentEmptyStateCuriousAbout` + `LookA` + `LookB` + 共享标题区（含 refresh）。
- [ ] `comment_empty_state.css`：`.curious-stage` / `.curious-title` / `.curious-refresh` / `.curious-pill` / `.curious-bubble` 等类。
- [ ] chip 批次池：至少 3 组，每组 5–6 个问题，刷新可循环。
- [ ] 色彩 token 化检查：暗色模式下两个 Look 的对比度均 ≥ AA。
