# scripts/playable-library/
> L2 | 父级: ../../CLAUDE.md

成员清单
review_dev_entry.mjs: 本地 `review=batch` 使用原生 FYP review 入口；挂载独立 pilot 的 dev-only 资源中间件。
pilot_preview.mjs: 只读映射 CatchTheBeat 的实时游戏目录到 `/resource/playable-pilot/catch-the-beat/`，不改主游戏清单、不上传或复制到生产资源。
pilot_preview.test.mjs: 验证独立 showcase、素材路径边界与生产构建隔离。
mirror_flora_library.py: 从 https://flora-playable-library.netlify.app 拉取每个游戏的默认版本(有 manifest 按清单下载,无则顺着 html/js/css 的相对引用爬取),写入 `public/resource/playable-library/<id>/`,给入口页注入 feed 适配脚本 `pocket-host.js`(`data-seed-random="off"`),并生成稳定入口 `<id>/index.html` 与 `catalog.json`。

法则: 目录被 `.gitignore` 忽略(~70MB),新 clone / 资料库更新后跑 `python3 -I scripts/playable-library/mirror_flora_library.py` 重新拉取(先并行下载到 node_modules/.cache 暂存,完成后整体替换,刷新期间 feed 不受影响);游戏按相对路径加载素材,所以 CDN 管线整目录跳过、原样随站点部署。feed 标题与文案在 `src/page/home/components/playable_library.ts`。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
