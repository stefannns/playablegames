import type { CSSProperties, Ref } from "react";
import { EDIT_MEDIA_CORNER_RADIUS_PX } from "../../edit/components/edit_chrome.constants.ts";
import type { CreationCameraFacing, CreationCameraStatus } from "../hooks/use_creation_camera";

export type CameraPreviewViewportProps = {
  mode: "live" | "static";
  staticBackgroundUrl: string;
  videoRef: Ref<HTMLVideoElement>;
  facingMode: CreationCameraFacing;
  cameraStatus: CreationCameraStatus;
  style?: CSSProperties;
  className?: string;
};

const CameraPreviewViewport = ({
  mode,
  staticBackgroundUrl,
  videoRef,
  facingMode,
  cameraStatus,
  style,
  className,
}: CameraPreviewViewportProps) => {
  const cameraUnavailable =
    cameraStatus === "unsupported" ||
    cameraStatus === "denied" ||
    cameraStatus === "error";

  const useStaticImage = mode === "static" || (mode === "live" && cameraUnavailable);

  return (
    <div
      className={className}
      style={{
        borderRadius: EDIT_MEDIA_CORNER_RADIUS_PX,
        overflow: "hidden",
        backgroundColor: "var(--tux-v2-color-brand-tiktok-black)",
        backgroundImage: useStaticImage ? `url("${staticBackgroundUrl}")` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        ...style,
      }}
      aria-hidden
    >
      {mode === "live" && !cameraUnavailable ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
            transform: facingMode === "user" ? "scaleX(-1)" : undefined,
          }}
        />
      ) : null}
    </div>
  );
};

export default CameraPreviewViewport;
