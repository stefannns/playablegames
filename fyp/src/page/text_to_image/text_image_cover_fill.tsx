import { useLayoutEffect, useRef, useState } from "react";

import { TextToImageTemplate } from "./TextToImageTemplate";

const CANVAS_WIDTH = 342;
const CANVAS_HEIGHT = 456;

/** Scale a text-image template to cover its container (publish strip / feed carousel). */
export function TextImageCoverFill({
  templateId,
  text,
}: {
  templateId: number;
  text: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      const { width, height } = container.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      setScale(Math.max(width / CANVAS_WIDTH, height / CANVAS_HEIGHT));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-black">
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: `${CANVAS_WIDTH}px`,
          height: `${CANVAS_HEIGHT}px`,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <TextToImageTemplate
          templateId={templateId}
          text={text}
          scaleOverride={1}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
