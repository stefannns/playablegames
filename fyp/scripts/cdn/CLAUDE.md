# scripts/cdn/
> L2 | 父级: /Users/bytedance/Documents/TUX/tiktok-tux-demo/CLAUDE.md

成员清单
upload_cdn_asset.py: 单文件 CDN 上传器，调用 `https://ife.bytedance.net/cdn/upload`，从邮箱环境变量或参数拿上传身份。
upload_minitt_resource_cdn.py: Mini TT `public/resource` 批量上传器——命名空间由 CDN base 反推钉死(多人上传落同一空间,落点校验失败即报错),同名覆盖自动触发异步 refresh,生成幂等审计 manifest。
optimize_minitt_videos.py: Mini TT 视频预处理器，长边超过 1920 的 MP4 才用 ffmpeg 降采样并在更小时替换。
build_minitt_goofy.py: Goofy / 云端发布编排器——视频优化、CDN build(查重上传已内置于 build)、为静态路由生成 SPA 入口页,带 `--alias` 时再 `bytedcli goofy preview deploy dist`(与 DesAgent Share → Goofy 同通道)。
minitt_resource_cdn_build_plugin.mjs: `/resource` 协议的路由器——build 开始先自动查重上传新媒体(传不了则构建失败,绝不产出 404 dist),再把媒体引用改写指向 CDN、从 `dist/resource` 删掉媒体(playable 游戏的 .html/.js 不上 CDN,保留原路径随站点部署;`playable-library/` 整个目录是按相对路径加载素材的外部游戏,上传/改写/删除都跳过,原样随站点部署)；dev 时本地文件优先、缺失则 302 回落 CDN。
minitt_resource_cdn_build_plugin.d.mts: 上述 Vite 插件的 TypeScript 声明，避免给原型仓新增 Node 类型依赖。

法则: `/resource` 是业务语义协议，CDN 上传只维护协议背后的物理位置；新增资源先落 `public/resource`,再用上传脚本同步 manifest；视频先压源文件，再上传 CDN；禁止把完整 CDN URL 写进业务页面。

备份契约: `public/resource` 的媒体二进制**不进 git**(见根 `.gitignore`),仓库只提交本 manifest。CDN + manifest = 唯一备份与恢复索引(每条含 `relPath + sha256 + cdnUrl`);恢复命令见根 `CLAUDE.md` 的 `/resource` 章节。

⚠️ fast-deliver 的命名空间按邮箱字符串**区分大小写**(`zihan.Huang` 与 `zihan.huang` 是两个物理隔离的空间),且 email 参数无鉴权——它只是空间选择器。本仓资源已迁至 base 钉死的小写空间 `nuhboeh7uhopg`(= `zihan.huang@bytedance.com`,fast-deliver 控制台可见可管理);上传脚本按 base 保留大小写反推邮箱并严格校验落点,不要手动传别的大小写变体。历史大写空间 `nuhbOeh7uhopg` 仍存有旧副本(线上旧 Goofy 预览引用),保留不写不删。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
