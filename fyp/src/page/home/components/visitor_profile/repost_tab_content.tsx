import { TUXText, getColorCSSVar } from "@byted-tiktok/tux-web";
import {
  TUXIconRepost,
  TUXIconSquareCornerBorderFill,
} from "@byted-tiktok/tux-icons";

import { ProfileFeedThumb } from "./profile_feed_thumb";
import type { VisitorRepostItem } from "./visitor_profile_utils";

type RepostTabContentProps = {
  items: VisitorRepostItem[];
};

/**
 * 客态个人页 Repost (转发) tab 内容。
 * 设计来自 Figma 节点 66082:62777 (Main-Framework-Main-File)。
 * 3 列网格 + 时间标签 + Repost 图标 + 可选转发短评气泡 + 可选相册角标。
 */
export function RepostTabContent({ items }: RepostTabContentProps) {
  return (
    <div
      className="w-full"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1.5px",
      }}
    >
      {items.map((item) => (
        <RepostCard key={item.key} item={item} />
      ))}
    </div>
  );
}

function RepostCard({ item }: { item: VisitorRepostItem }) {
  return (
    <button
      type="button"
      className="relative overflow-hidden"
      style={{
        backgroundColor: getColorCSSVar("UIShapeNeutral4"),
        aspectRatio: "129 / 173",
      }}
      aria-label="Reposted video"
    >
      <ProfileFeedThumb
        thumbnailSrc={item.thumbnailSrc}
        videoThumbnailSrc={item.videoThumbnailSrc}
      />

      {/* 顶部轻微暗化（与 Posts grid 一致） */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, var(--tux-v2-color-ui-image-overlay-black-a15), transparent 45%)",
        }}
      />

      {/* 底部渐变，承载时间标签 */}
      <div
        className="absolute left-0 right-0 bottom-0"
        style={{
          height: 52,
          background:
            "linear-gradient(to top, var(--tux-v2-color-ui-image-overlay-black-a50), transparent)",
        }}
      />

      {/* 转发时附带的气泡短评 */}
      {item.commentBubble ? <CommentBubble text={item.commentBubble} /> : null}

      {/* 多图作品角标：右上角白色"折角矩形" */}
      {item.isAlbum ? (
        <div
          className="absolute top-1.5 right-1.5 flex items-center justify-center"
          style={{
            width: 20,
            height: 20,
            color: "var(--tux-v2-color-ui-image-overlay-white)",
            filter: "drop-shadow(0 1px 0.5px rgba(0,0,0,0.12))",
          }}
        >
          <TUXIconSquareCornerBorderFill size={18} />
        </div>
      ) : null}

      {/* 底部左下：repost 图标 + 时间 */}
      <div
        className="absolute left-1 bottom-1.5 flex items-center gap-0.5"
        style={{ color: "var(--tux-v2-color-ui-image-overlay-white)" }}
      >
        <span className="flex items-center justify-center w-4 h-4">
          <TUXIconRepost size={14} />
        </span>
        <TUXText typographyPreset="P2-Regular" color="UIImageOverlayWhite">
          {item.timeAgo}
        </TUXText>
      </div>
    </button>
  );
}

function CommentBubble({ text }: { text: string }) {
  return (
    <div
      className="absolute top-1.5 left-1.5 flex flex-col items-start"
      style={{
        filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.14))",
      }}
    >
      <div
        className="flex items-center"
        style={{
          paddingInline: 8,
          paddingBlock: 6,
          backgroundColor: getColorCSSVar("UISheetFlat1"),
          borderWidth: "0.5px",
          borderStyle: "solid",
          borderColor: "rgba(255,255,255,0.4)",
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          borderBottomRightRadius: 8,
        }}
      >
        <TUXText
          typographyPreset="P2-Semibold"
          color="UIText1"
          className="whitespace-nowrap"
        >
          {text}
        </TUXText>
      </div>
      {/* 小尾巴 */}
      <div
        style={{
          width: 6,
          height: 4,
          marginTop: -1,
          background: getColorCSSVar("UISheetFlat1"),
          clipPath: "polygon(0 0, 100% 0, 0 100%)",
        }}
      />
    </div>
  );
}
