# Feed 视频资源（`public/resource/feed_video`）

首页 Feed 里 **`mediaType: "video"`** 的 MP4 放这里，由 Vite 原样提供，URL 形如 `/resource/feed_video/...`。

## 目录

| 路径 | 用途 |
|------|------|
| **`video-01.mp4` … `video-NN.mp4`** | 竖版短视频本体，建议 9:16，H.264 + AAC，体积适中便于 Demo |
| **`posters/`**（可选） | 与视频同槽位的首帧/封面：`posters/video-01.jpg`；未放时代码里用 `video_mock` 的 `cover-*.jpg` |

## 命名约定

- 视频：**`video-NN.mp4`**，`NN` 为 **1-based** 序号（`01`、`02`…），与 `localFeedVideoUrl(N)` 对齐；**`video-NN` 绑定 `feed-N`**（序号一致）。
- 可选封面：**`posters/video-NN.jpg`**，与 `localFeedVideoPosterAssetUrl(N)` 对齐。
- 说明列格式：**`{主题} Demo（{创作者 nickname}）`**，例如 `竞赛 Demo（Pole Position）`。
- **同文件名替换 MP4** 后：把 `src/utils/local_media_placeholder.ts` 里的 `FEED_VIDEO_CACHE_VERSION` **+1**，并硬刷新页面（PWA 可能仍缓存旧片）。

## 在代码里引用

优先用 `src/utils/local_media_placeholder.ts`：

```ts
import {
  localFeedVideoUrl,
  localFeedVideoPosterUrl,
  localFeedVideoPosterAssetUrl,
} from "../../../utils/local_media_placeholder";

// feed_item_card.config.ts 示例
mediaSrc: localFeedVideoUrl(1),
mediaPoster: localFeedVideoPosterUrl(18), // 复用 video_mock 的 cover-18
// 若已放入 posters/video-01.jpg：
// mediaPoster: localFeedVideoPosterAssetUrl(1),
```

## 新增一条 Feed 视频

1. 把 MP4 放进本目录，按下一个空闲序号命名（如 `video-02.mp4`）。
2. 在 `src/page/home/components/feed_item_card.config.ts` 增加一条 `mediaType: "video"` 配置。
3. （可选）在 `posters/` 放同序号 JPG；否则用 `localFeedVideoPosterUrl(feedIndex)` 从 `video_mock` 选封面。

## 与 `video_mock` 的区别

- **`video_mock/`**：静态 9:16 **封面图**（图片 Feed、海报占位）。
- **`feed_video/`**：可 **播放的 MP4**（真视频 Feed、评论 PiP 等）。

当前已收录：

| 文件 | Feed 绑定 | 说明 |
|------|-----------|------|
| `video-01.mp4` | `feed-1` | 咖啡店 Demo（Maya Brews） |
| `video-02.mp4` | `feed-2` | 潜水 Demo（Reef Depths） |
| `video-03.mp4` | `feed-3` | 冰面 Demo（Frost Lines） |
| `video-04.mp4` | `feed-4` | 小狗 Demo（Paws & Chaos） |
| `video-05.mp4` | `feed-5` | 小猫 Demo（Whisker FM） |
| `video-06.mp4` | `feed-6` | 竞赛 Demo（Pole Position） |
| `video-07.mp4` | `feed-7` | 旅行 Demo（Ava Trips） |
| `video-08.mp4` | `feed-8` | 编程 Demo（Derek Codes） |
| `video-09.mp4` | `feed-9` | 健身 Demo（Lina Fit） |
| `video-10.mp4` | `feed-10` | 学习 Demo（Leo Study） |
| `video-11.mp4` | `feed-11` | 穿搭 Demo（Zoe Stylebook） |
| `video-12.mp4` | `feed-12` | 音乐制作 Demo（Ryan Beats） |
| `video-13.mp4` | `feed-13` | 读书 Demo（Ella Reads） |
| `video-14.mp4` | `feed-14` | 人像摄影 Demo（Noah Shoot） |
| `video-15.mp4` | `feed-15` | 牧场羊群 Demo（Felix Fields） |
| `video-16.mp4` | `feed-16` | 烘焙 Demo（Max Bakes） |
| `video-17.mp4` | `feed-17` | 滑板 Demo（Jules Skate） |
| `video-18.mp4` | `feed-18` | 乡村遛狗 Demo（Emma Fields） |
| `video-19.mp4` | `feed-19` | 徒步 Demo（Kai Hikes） |
| `video-20.mp4` | `feed-20` | 化妆 Demo（Ruby Makeup） |
