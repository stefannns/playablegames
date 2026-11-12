import type { CameraModeKey } from "./components/camera_mode_tab";

/** Max-length video capture modes — tap/long-press shutter opens video edit. */
export const CAMERA_VIDEO_DURATION_MODES = ["3m", "60s", "15s"] as const satisfies readonly CameraModeKey[];

export type CameraVideoDurationMode = (typeof CAMERA_VIDEO_DURATION_MODES)[number];

export function isCameraPhotoMode(mode: CameraModeKey): boolean {
  return mode === "photo";
}

export function isCameraVideoDurationMode(mode: CameraModeKey): mode is CameraVideoDurationMode {
  return (CAMERA_VIDEO_DURATION_MODES as readonly CameraModeKey[]).includes(mode);
}

export function isCameraTextMode(mode: CameraModeKey): boolean {
  return mode === "text";
}
