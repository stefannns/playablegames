import { useMemo, useRef, useEffect, useState, type CSSProperties } from "react";
import {
  TEXT_TO_IMAGE_CARD_CONTENT_WIDTH,
  TEXT_TO_IMAGE_CARD_HEIGHT,
  TEXT_TO_IMAGE_CARD_HORIZONTAL_INSET,
  TEXT_TO_IMAGE_CARD_WIDTH,
} from "./text_to_image_layout";

// 模版配置，基于飞书文档的精确配置（画布尺寸：342×456）
export const TEMPLATE_CONFIGS = [
  {
    id: 1,
    textArea: {
      x: 38,
      y: 456 - 228 - 85.5,
      width: 266,
      height: 228,
    },
    textStyle: {
      fontSize: 47,
      lineHeight: 1.1,
      color: "#49190B",
      fontWeight: "bold",
      fontFamily: "'Funnel Display', system-ui, sans-serif",
      textAlign: "left",
      verticalAlign: "bottom",
    },
  },
  {
    id: 2,
    textArea: {
      x: 69.5,
      y: 456 - 221 - 133,
      width: 202,
      height: 221,
    },
    textStyle: {
      fontSize: 38,
      lineHeight: 1.2,
      color: "#462E0F",
      fontWeight: "normal",
      fontFamily: "'Pangolin', cursive, system-ui",
      textAlign: "left",
      verticalAlign: "middle",
    },
  },
  {
    id: 3,
    textArea: {
      x: 31.5,
      y: 456 - 228 - 31.5,
      width: 278,
      height: 228,
    },
    textStyle: {
      fontSize: 44,
      lineHeight: 1.2,
      color: "#6F561E",
      fontWeight: "normal",
      fontFamily: "'Special Elite', cursive, system-ui",
      textAlign: "left",
      verticalAlign: "bottom",
    },
  },
  {
    id: 4,
    textArea: {
      x: 31,
      y: (456 - 266 - 81) + 20 - 20,
      width: 281,
      height: 266,
    },
    textStyle: {
      fontSize: 47,
      lineHeight: 1.2,
      color: "#306BE1",
      fontWeight: "bold",
      fontFamily: "'Barlow', sans-serif, system-ui",
      textAlign: "left",
      verticalAlign: "middle",
    },
  },
  {
    id: 5,
    textArea: {
      x: 44.3,
      y: 99 + 20,
      width: 253,
      height: 216,
    },
    textStyle: {
      fontSize: 40,
      lineHeight: 1.25,
      color: "#35253B",
      fontWeight: "normal",
      fontFamily: "'Young Serif', serif, system-ui",
      textAlign: "left",
      verticalAlign: "top",
    },
  },
  {
    id: 6,
    textArea: {
      x: 57,
      y: 456 - 240 - 57,
      width: 228,
      height: 240,
    },
    textStyle: {
      fontSize: 40,
      lineHeight: 1.2,
      color: "#2F8C59",
      fontWeight: "normal",
      fontFamily: "'Pangolin', cursive, system-ui",
      textAlign: "left",
      verticalAlign: "middle",
    },
  },
  {
    id: 7,
    textArea: {
      x: 38,
      y: 140 + 10,
      width: 266,
      height: 234,
    },
    textStyle: {
      fontSize: 44,
      lineHeight: 1.05,
      color: "#6C5915",
      fontWeight: "600",
      fontFamily: "'TikToksans', system-ui, sans-serif",
      textAlign: "center",
      verticalAlign: "top",
    },
  },
];

interface TextToImageTemplateProps {
  templateId: number;
  text: string;
  scaleOverride?: number;
  className?: string;
}

const CANVAS_WIDTH = TEXT_TO_IMAGE_CARD_WIDTH;
const CANVAS_HEIGHT = TEXT_TO_IMAGE_CARD_HEIGHT;

// 字号缩小步长
const FONT_STEP = 2;
const MIN_FONT_SIZE = 10;

const TEMPLATE_PLACEHOLDER_TEXT =
  "Share your thoughts or questions to spark discussion";

function maxLinesForHeight(
  availableHeight: number,
  fontSize: number,
  lineHeightRatio: number,
): number {
  const lineHeightPx = fontSize * lineHeightRatio;
  if (lineHeightPx <= 0) return 1;
  return Math.max(1, Math.floor(availableHeight / lineHeightPx));
}

export function TextToImageTemplate({
  templateId,
  text,
  scaleOverride,
  className = "",
}: TextToImageTemplateProps) {
  const config = useMemo(() => {
    return TEMPLATE_CONFIGS.find((c) => c.id === templateId) || TEMPLATE_CONFIGS[0];
  }, [templateId]);

  /** 与编辑页一致：卡片左右各 24px，纵向仍走模版配置 */
  const textLayout = useMemo(
    () => ({
      x: TEXT_TO_IMAGE_CARD_HORIZONTAL_INSET,
      width: TEXT_TO_IMAGE_CARD_CONTENT_WIDTH,
      y: config.textArea.y,
      height: config.textArea.height,
    }),
    [config.textArea.height, config.textArea.y],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [containerScale, setContainerScale] = useState(scaleOverride ?? 1);
  const [finalFontSize, setFinalFontSize] = useState(config.textStyle.fontSize);
  const [lineClamp, setLineClamp] = useState<number | null>(null);

  const displayText = text.trim() || TEMPLATE_PLACEHOLDER_TEXT;

  // 监听容器尺寸变化，计算缩放比例
  useEffect(() => {
    if (typeof scaleOverride === "number") {
      setContainerScale(scaleOverride);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      const rect = container.getBoundingClientRect();
      const scaleX = rect.width / CANVAS_WIDTH;
      const scaleY = rect.height / CANVAS_HEIGHT;
      setContainerScale(Math.min(scaleX, scaleY));
    };

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [scaleOverride]);

  // 使用隐藏的测量元素预计算字号；仍放不下时用行数截断 + 省略号
  useEffect(() => {
    const measureEl = measureRef.current;
    if (!measureEl) return;

    let targetSize = config.textStyle.fontSize;
    const availableHeight = textLayout.height;
    const availableWidth = textLayout.width;
    const { lineHeight: lineHeightRatio } = config.textStyle;

    const clearClampStyles = () => {
      measureEl.style.removeProperty("display");
      measureEl.style.removeProperty("-webkit-line-clamp");
      measureEl.style.removeProperty("-webkit-box-orient");
      measureEl.style.removeProperty("overflow");
      measureEl.style.removeProperty("text-overflow");
    };

    measureEl.style.fontSize = `${targetSize}px`;
    measureEl.style.lineHeight = `${lineHeightRatio}`;
    measureEl.style.width = `${availableWidth}px`;
    measureEl.style.height = "auto";
    clearClampStyles();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        let testSize = config.textStyle.fontSize;
        measureEl.style.fontSize = `${testSize}px`;
        let height = measureEl.scrollHeight;

        if (height > availableHeight) {
          while (testSize > MIN_FONT_SIZE) {
            testSize -= FONT_STEP;
            measureEl.style.fontSize = `${testSize}px`;
            height = measureEl.scrollHeight;
            if (height <= availableHeight) {
              targetSize = testSize;
              break;
            }
          }
          if (testSize <= MIN_FONT_SIZE) {
            targetSize = MIN_FONT_SIZE;
            measureEl.style.fontSize = `${targetSize}px`;
            height = measureEl.scrollHeight;
          }
        }

        let nextClamp: number | null = null;
        if (height > availableHeight) {
          nextClamp = maxLinesForHeight(
            availableHeight,
            targetSize,
            lineHeightRatio,
          );
          measureEl.style.setProperty("display", "-webkit-box");
          measureEl.style.setProperty("-webkit-box-orient", "vertical");
          measureEl.style.setProperty("-webkit-line-clamp", String(nextClamp));
          measureEl.style.setProperty("overflow", "hidden");
        }

        setFinalFontSize(targetSize);
        setLineClamp(nextClamp);
        clearClampStyles();
      });
    });
  }, [displayText, config, textLayout.height, textLayout.width]);

  const backgroundImageUrl = useMemo(() => {
    return `/resource/text_to_image/${templateId}.png`;
  }, [templateId]);

  // 最终显示的字号（考虑容器缩放）
  const displayFontSize = finalFontSize * containerScale;

  const textClampStyle: CSSProperties | undefined =
    lineClamp != null
      ? {
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: lineClamp,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }
      : undefined;

  const flexAlign =
    config.textStyle.verticalAlign === "top"
      ? "flex-start"
      : config.textStyle.verticalAlign === "middle"
        ? "center"
        : "flex-end";

  return (
    <>
      {/* 隐藏的测量元素，1:1比例用于计算 */}
      <div
        ref={measureRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          fontFamily: config.textStyle.fontFamily,
          fontWeight: config.textStyle.fontWeight,
          textAlign: config.textStyle.textAlign as any,
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          visibility: 'hidden',
          pointerEvents: 'none',
          whiteSpace: 'normal',
          width: `${textLayout.width}px`,
        }}
      >
        {displayText}
      </div>
      
      <div
        ref={containerRef}
        className={`relative overflow-hidden ${className}`}
        style={{
          aspectRatio: "342/456",
          width: "100%",
          height: "100%",
        }}
      >
        {/* 背景图片 */}
        <img
          src={backgroundImageUrl}
          alt={`Template ${templateId}`}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* 文字层 */}
        <div
          className="absolute"
          style={{
            left: `${(textLayout.x / CANVAS_WIDTH) * 100}%`,
            top: `${(textLayout.y / CANVAS_HEIGHT) * 100}%`,
            width: `${(textLayout.width / CANVAS_WIDTH) * 100}%`,
            height: `${(textLayout.height / CANVAS_HEIGHT) * 100}%`,
            display: "flex",
            alignItems: flexAlign,
            justifyContent: 
              config.textStyle.textAlign === "left" ? "flex-start" :
              config.textStyle.textAlign === "right" ? "flex-end" :
              "center",
            overflow: "hidden",
            padding: 0,
          }}
        >
          <div
            style={{
              fontSize: `${displayFontSize}px`,
              lineHeight: config.textStyle.lineHeight,
              color: config.textStyle.color,
              fontWeight: config.textStyle.fontWeight,
              fontFamily: config.textStyle.fontFamily,
              textAlign: config.textStyle.textAlign as any,
              wordWrap: "break-word",
              overflowWrap: "break-word",
              transition: "none",
              boxSizing: "border-box",
              width: "100%",
              maxHeight: "100%",
              ...textClampStyle,
            }}
          >
            {displayText}
          </div>
        </div>
      </div>
    </>
  );
}
