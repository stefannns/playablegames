import { TUXText, useMultiLineOptimalTextResize } from "@byted-tiktok/tux-web";
import { useRef } from "react";

function ThoughtBubbleTail() {
  return (
    <svg
      width="14"
      height="12"
      viewBox="15 12.5 14 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="mr-4 block"
      style={{
        filter: "drop-shadow(0 4px 9px rgba(0, 0, 0, 0.14))",
      }}
    >
      <path
        d="M15 12.5C19.4545 12.5 16.216 17.5 20.0909 17.5C23.9658 17.5 24.5455 12.5 29 12.5H15Z"
        fill="var(--tux-v2-color-ui-page-flat-3)"
      />
      <path
        d="M20 22C20 23.3807 18.8807 24.5 17.5 24.5C16.1193 24.5 15 23.3807 15 22C15 20.6193 16.1193 19.5 17.5 19.5C18.8807 19.5 20 20.6193 20 22Z"
        fill="var(--tux-v2-color-ui-page-flat-3)"
      />
    </svg>
  );
}

type ThoughtBubbleProps = {
  text: string;
  isFilled: boolean;
};

export function ThoughtBubble({ text, isFilled }: ThoughtBubbleProps) {
  const textRef = useRef<HTMLElement>(null);

  useMultiLineOptimalTextResize(textRef, {
    fontSizeRanges: [
      [13, 15],
      [11, 13],
    ],
  });

  return (
    <div
      className="inline-flex flex-col items-end"
      style={{
        width: "max-content",
        maxWidth: "5rem",
        overflow: "visible",
      }}
    >
      <div
        className="radius-container-level1-large flex items-center justify-center px-2 py-1.5"
        style={{
          width: "100%",
          minHeight: "40px",
          backgroundColor: "var(--tux-v2-color-ui-page-flat-3)",
          boxShadow: "0 4px 9px rgba(0, 0, 0, 0.14)",
        }}
      >
        <TUXText
          ref={textRef}
          as="div"
          font="TikTokFont"
          typographyPreset="SmallText1-Semibold"
          color={isFilled ? "UIText1" : "UITextPlaceholder"}
          align="center"
          textDisplay="lineBreak"
          className="w-full"
        >
          {text}
        </TUXText>
      </div>
      <ThoughtBubbleTail />
    </div>
  );
}
