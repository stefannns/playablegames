import { type CSSProperties } from "react";

export type CameraUploadEntranceProps = {
  onClick?: () => void;
  style?: CSSProperties;
};

/**
 * Gallery upload entrance.
 * Container: 68×64 (10px top/bottom, 12px left/right padding per Figma spec).
 * Icon: 44×44 SVG — rounded-square thumbnail and stack shadow.
 */
const CameraUploadEntrance = ({ onClick, style }: CameraUploadEntranceProps) => {
  return (
    <button
      type="button"
      aria-label="Upload from gallery"
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
      className="absolute z-40 flex items-center justify-center"
      style={{
        width: 68,
        height: 64,
        padding: "10px 12px",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        ...style,
      }}
    >
      <img
        src="/resource/figma/creation-camera/icon_camera_upload.svg"
        alt=""
        draggable={false}
        style={{ width: 44, height: 44, display: "block", pointerEvents: "none" }}
      />
    </button>
  );
};

export default CameraUploadEntrance;
