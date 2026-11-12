import { useId } from "react";

/** Figma Shape_Highlight Size=54 (10837:88385) clip path, viewBox 0 0 49 49 */
const HIGHLIGHT_CLIP_PATH =
  "M2.57123 11.4108C4.21145 7.39686 7.3971 4.2112 11.4111 2.57098C19.8003 -0.857092 29.1997 -0.857092 37.5889 2.57098C41.6029 4.2112 44.7886 7.39686 46.4288 11.4108C49.8568 19.8001 49.8568 29.1994 46.4288 37.5887C44.7886 41.6026 41.6029 44.7883 37.5889 46.4285C29.1997 49.8566 19.8003 49.8566 11.4111 46.4285C7.3971 44.7883 4.21145 41.6026 2.57123 37.5887C-0.856845 29.1994 -0.856845 19.8001 2.57123 11.4108Z";

/** Figma Shape_Highlight Size=54 stroke path (0.5px rgba(0,0,0,0.12)) */
const HIGHLIGHT_STROKE_PATH =
  "M11.5066 2.80463C19.8346 -0.598401 29.1654 -0.5984 37.4934 2.80463C41.4446 4.4192 44.5806 7.55516 46.1951 11.5064C49.5982 19.8344 49.5982 29.1652 46.1951 37.4931C44.5806 41.4444 41.4446 44.5803 37.4934 46.1949C29.1654 49.5979 19.8346 49.5979 11.5066 46.1949C7.5554 44.5803 4.41944 41.4443 2.80488 37.4931C-0.598154 29.1652 -0.598155 19.8344 2.80488 11.5064C4.41944 7.55516 7.5554 4.4192 11.5066 2.80463Z";

const HIGHLIGHT_SIZE_PX = 54;

type VisitorHighlightCoverProps = {
  src: string;
  alt: string;
};

/** Story Figma Shape_Highlight Size=54 — 54×54 squircle cover + 0.5px neutral stroke */
export function VisitorHighlightCover({ src, alt }: VisitorHighlightCoverProps) {
  const clipId = useId();

  return (
    <svg
      width={HIGHLIGHT_SIZE_PX}
      height={HIGHLIGHT_SIZE_PX}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={alt}
      className="block shrink-0"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={HIGHLIGHT_CLIP_PATH} />
        </clipPath>
      </defs>
      <image
        href={src}
        width={56}
        height={56}
        clipPath={`url(#${clipId})`}
        preserveAspectRatio="xMidYMid slice"
      />
      <path
        d={HIGHLIGHT_STROKE_PATH}
        fill="none"
        stroke="black"
        strokeOpacity={0.12}
        strokeWidth={0.5}
      />
    </svg>
  );
}
