import { TUXText } from "@byted-tiktok/tux-web";
import { useEffect, useMemo, useRef, useState } from "react";

type InlineExpandTextProps = {
  text: string;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  collapsedLines: number;
  fontSize: number;
  lineHeightPx: number;
  textColor: string;
  actionColor: string;
  measureWidthInsetPx?: number;
  forceShowMore?: boolean;
  expandLabel?: string;
};

export function InlineExpandText({
  text,
  expanded,
  onExpandedChange,
  collapsedLines,
  fontSize,
  lineHeightPx,
  textColor,
  actionColor,
  measureWidthInsetPx = 0,
  forceShowMore = false,
  expandLabel = " ... see all",
}: InlineExpandTextProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const measureRootRef = useRef<HTMLDivElement | null>(null);
  const measureTextRef = useRef<HTMLSpanElement | null>(null);
  const measureMoreRef = useRef<HTMLSpanElement | null>(null);
  const [clampState, setClampState] = useState<{ text: string; showMore: boolean }>(() => ({
    text: "",
    showMore: false,
  }));

  const normalizedText = useMemo(() => {
    return text.replace(/\s*\n+\s*/g, " ").replace(/\s{2,}/g, " ").trim();
  }, [text]);

  useEffect(() => {
    if (expanded) {
      setClampState({ text: normalizedText, showMore: false });
    }
  }, [expanded, normalizedText]);

  useEffect(() => {
    const container = containerRef.current;
    const measureRoot = measureRootRef.current;
    const measureText = measureTextRef.current;
    const measureMore = measureMoreRef.current;
    if (!container || !measureRoot || !measureText || !measureMore) return;

    if (expanded) {
      setClampState({ text: normalizedText, showMore: false });
      return;
    }

    const maxHeight = collapsedLines * lineHeightPx;

    const compute = () => {
      const containerWidth = container.getBoundingClientRect().width;
      measureRoot.style.width = `${Math.max(0, containerWidth - measureWidthInsetPx)}px`;

      measureMore.textContent = "";
      measureText.textContent = normalizedText;
      const fullHeight = measureRoot.scrollHeight;
      const fits = fullHeight <= maxHeight + 0.5;

      if (fits && !forceShowMore) {
        setClampState({ text: normalizedText, showMore: false });
        return;
      }

      measureMore.textContent = expandLabel;

      let lo = 0;
      let hi = normalizedText.length;
      let best = 0;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const candidate = normalizedText.slice(0, mid).trimEnd();
        measureText.textContent = candidate;
        const height = measureRoot.scrollHeight;
        if (height <= maxHeight + 0.5) {
          best = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }

      const finalText = normalizedText.slice(0, best).trimEnd();
      setClampState({ text: finalText, showMore: true });
    };

    compute();
    const rafId = window.requestAnimationFrame(compute);
    void document.fonts?.ready?.then(() => compute());

    const resizeObserver = new ResizeObserver(() => compute());
    resizeObserver.observe(container);

    const handleViewportResize = () => compute();
    window.addEventListener("resize", handleViewportResize);
    window.visualViewport?.addEventListener("resize", handleViewportResize);

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleViewportResize);
      window.visualViewport?.removeEventListener("resize", handleViewportResize);
    };
  }, [
    collapsedLines,
    expanded,
    expandLabel,
    forceShowMore,
    lineHeightPx,
    measureWidthInsetPx,
    normalizedText,
  ]);

  return (
    <div
      ref={containerRef}
      style={{
        fontSize,
        lineHeight: `${lineHeightPx}px`,
      }}
    >
      <TUXText
        as="span"
        style={{
          fontSize,
          fontWeight: 400,
          lineHeight: `${lineHeightPx}px`,
          color: textColor,
          whiteSpace: "normal",
          wordBreak: "break-word",
        }}
      >
        {expanded ? normalizedText : clampState.text}
      </TUXText>
      {!expanded && clampState.showMore ? (
        <button
          type="button"
          onClick={() => onExpandedChange(true)}
          style={{
            fontSize,
            fontWeight: 600,
            lineHeight: `${lineHeightPx}px`,
            color: actionColor,
            whiteSpace: "nowrap",
            background: "transparent",
            border: 0,
            padding: 0,
            margin: 0,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {expandLabel}
        </button>
      ) : null}

      <div
        ref={measureRootRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
          zIndex: -1,
          left: 0,
          top: 0,
          fontSize,
          lineHeight: `${lineHeightPx}px`,
          wordBreak: "break-word",
          whiteSpace: "normal",
        }}
      >
        <span ref={measureTextRef} style={{ fontWeight: 400 }} />
        <span ref={measureMoreRef} style={{ fontWeight: 600 }} />
      </div>
    </div>
  );
}
