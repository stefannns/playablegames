# scripts/playable-gen/
> L2 | 父级: ../../CLAUDE.md

成员清单
playable_generate_dev_plugin.mjs: 仅本地 dev 的生成桥——`POST /api/playable/generate` 把 prompt(或「修改指令 + 当前游戏 HTML」)交给 Claude(`claude-opus-5-5`,流式),以 NDJSON 回传进度与最终单文件 HTML;只接受本机请求;无 key 返回 503 让前端回落 demo。
playable_generate_dev_plugin.d.mts: 上述插件的 TypeScript 声明。

法则: key 放 `.env.local` 的 `ANTHROPIC_API_KEY`(无 `VITE_` 前缀,只在 dev server 读取,永不进 bundle / dist)。Goofy 静态站没有这个接口,前端自动走原 demo。生成约定(单文件、竖屏 390×598、触控、无外链)写在插件的 SYSTEM_PROMPT 里;前端调用见 `src/page/creation/playable_generation.ts`。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
