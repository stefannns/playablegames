# Comment Empty State · "Yeah or Nah" 方向文档

> 适用范围：替换评论面板「无评论」时的「插画 + Comment 按钮」原态。
> 实验位置：`Comment Empty State` 实验下，新增 `Looks` 维度（A / B / C）。
> 题面（所有 Look 共用）：`environment > taste?`（主语 = coffee shop。Yeah = 站环境、Nah = 站味道）。
>
> 设计基调：TikTok 体感、几何 bold、不是 SaaS 投票组件。三个方向**故意走完全不同的 register**，避免「换个配色就当成新版」。**没有共同骨架**，每个 Look 自己的版式与节奏自洽。

---

## Look A · Tilted Bubbles（倾斜气泡 · 贴纸感）已实现

布局：问题气泡居中、整体微旋转 -3°，下面两个回答气泡向外八字摊开（Yeah 旋 -6°，Nah 旋 +6°）。每个气泡是粗黑描边的纯色矩形（无阴影、约 14px radius）。

- 问题气泡：白底黑字，下方有一个三角小尾巴指向左下（聊天气泡 tail）。
- Yeah：TikTok 青（token：`BrandTikTokSplash`）底，深墨字（token：`UIShapeText1OnSecondary`）。
- Nah：TikTok 玫红（token：`BrandTikTokRazzmatazz`）底，白字（token：`UIShapeText1OnPrimary`）。
- 字号：问题 22–24 / 700；Yeah/Nah 28 / 800。
- 描边：2.5px 实描边（含 tail），颜色使用 token（`UIShapeNeutral3`）以保证暗色模式可读性。
- 动效：进场依次 stamp（120ms cubic-bezier 0.2,0.9,0.3,1.4，轻微 overshoot）。点击：被选中的气泡瞬间放大 1.06，另一个 desaturate + 缩到 0.94。

参考感：TikTok「贴纸」体系、Risograph 海报。最稳，最像 TikTok 主品牌。

### A.next · 选完立场后弹出 3 个观点 reply chips

- 选 Yeah/Nah 后：上方 caption 与 chips **共用同一列布局**；chips 使用「0fr → 1fr」高度过渡把空间从下方“长出来”，上方内容自然上滑让位（避免直接跳到顶部）。
- chips 不是直接复用 TUX Button：为了支持长文案的多行换行且保持圆角一致，使用本地 `.yon-chip`（圆角固定 14px、上下 padding 更松），再用 token 对齐 TUX 的 secondary 质感。
- 文案围绕 coffee shop 真实评论口吻，模仿 TikTok 评论生态：口语、半句话、emoji 适量。
- 行为：点击 chip → **直接把内容填到评论输入框 + 激活输入框焦点**（不真的发送，方便用户继续编辑）。
- 切换立场：chips 列表整组替换（重放入场），上一份的 pressed 态清掉。

**Yeah（站环境）：**
1. `i'd come back just for the vibes ☕`
2. `wifi + playlist carried, ngl`
3. `the aesthetic is half the cup fr`

**Nah（站味道）：**
1. `pretty cafe, mid latte 😬`
2. `if the espresso's bad nothing else matters`
3. `give me a hole-in-the-wall w/ great beans any day`

---

## Look B · Split Arena（竖向二分对决）

布局：抛弃气泡范式，整片空区域被拆成上下两段，中间留一条黑色「裁判条」夹着问题。

- 上半（青色）大字写 `YEAH`，下半（玫红）写 `NAH`，两边大字 64–80px / 900 / italic / 字间距 -2%。
- 问题是中间黑条上的白字 pill：`environment > taste?`，14–15px / 600。
- **不展示票型**（无 `54%` / `46%` 之类的票数）。
- 动效：hover/touch-down 时对应那一半向中线压 6px，黑条被「挤压」，另一半轻微回退；释放时 spring 回弹一次（不要 bounce 过度）。
- 选完立场后接 chips：上下两段重新排版让位（B 方案的 chips 升起动画细节再细化）。

参考感：TikTok Yes/No 滤镜玩法、综艺投票墙。最 bold、最有情绪，也是最不像一个评论区的方向，适合做 hero 视觉。

> 与最初提案的差异：去掉了 `54%` / `46%` 票数，按用户要求"不展示票型"。其余完全保留。

---

## Look C · Comic Strip（三格漫画式聊天）

布局：让空状态本身**演**一段对话，把「这是大家会怎么聊」直接表演给你看。

- 第一格：左对齐灰色气泡（`UIShapeNeutral4` 类色），里面是 `environment > taste?`。
- 第二、三格：右对齐两个气泡 Yeah / Nah，分别上青下粉，错开 8px 位移做出"两个人在抢答"感。
- 每个气泡末端都有 iMessage 式的小尾巴，但尾巴是粗几何三角，不是 SF 圆角那种。
- 顶部有个小 caption：`tap one to vote`，12px / 500 / 60% 透明度（注：与 default empty state 的"comment"按钮文案系列保持轻量）。
- 动效：进场是「打字 → 弹出」节奏（问题先出，250ms 后 Yeah 弹入，再 120ms Nah 弹入）。点击后未选项收成胶囊缩到角落，已选项放大并显示 `+1`。
- 选完立场后接 chips：在第二、三格下方流出（C 方案的 chips 排版后续细化）。

参考感：iMessage、TikTok DM、表情包文化。最有「人味」，最不像 widget。

---

## 共用规则（不是骨架，是约束）

- 题面统一：`environment > taste?`（不要改成 `environment vs taste`、`taste or vibe` 等）。
- 选项统一：`Yeah` / `Nah`（不要改成 `Yes`/`No` 或 `Agree`/`Disagree`）。
- 颜色：**一律使用 TUX color token**，不要写死 hex / rgba，确保暗色模式一致。
  - 品牌色：`BrandTikTokSplash` / `BrandTikTokRazzmatazz`（双模一致）。
  - 背景/纸色：`UISheetFlat1`。
  - 文字/描边：`UIText*`、`UIShapeNeutral*`、`UIShapeText1On*` 等随主题反转的 token。
- 不使用 em dash。
- 实验位：`empty-state-preset-yeah-or-nah-a/b/c`。

---

## 工程落地说明（新增进度）

### 文件结构

- 空状态组件已从 `comment_panel.tsx` 抽离，避免后续 Looks 变多导致 CommentPanel 膨胀：
  - 组件：`comment_empty_state.tsx`
  - 样式：`comment_empty_state.css`
- `comment_panel.tsx` 仅保留「有评论列表 / 无评论空状态」的分发逻辑与输入框编排。

---

## 落地清单

- [x] `comment_experiment_config.ts`：`style: "yeah-or-nah"` + `yeahOrNahLook: "a" | "b" | "c"`。
- [x] `comment_experiment_panel.tsx`：Style + Looks 双选 + Preset summary。
- [x] Look A：倾斜气泡视觉、tail 对齐、选择反馈。
- [x] Look A · A.next：3 张观点 chips（可多行换行、圆角统一、点击填到输入框 + 激活焦点）。
- [x] 色彩 token 化：移除 fixed color，暗色模式正常。
- [x] 代码整理：空状态逻辑与样式抽离为独立文件，CommentPanel 保持简洁。
- [ ] Look B（Split Arena）实拼。
- [ ] Look C（Comic Strip）实拼。
