import { useEffect, useRef, useState } from "react";

export type CreationCameraFacing = "user" | "environment";

export type UseCreationCameraOptions = {
  /** Start/stop the MediaStream (tab visible + live preview mode). */
  enabled: boolean;
  facingMode: CreationCameraFacing;
};

export type CreationCameraStatus =
  | "idle"
  | "starting"
  | "active"
  | "unsupported"
  | "denied"
  | "error";

function stopMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function clearVideoElement(video: HTMLVideoElement | null) {
  if (!video) return;
  video.pause();
  video.srcObject = null;
  video.removeAttribute("src");
  video.load();
}

function muteVideoElement(video: HTMLVideoElement) {
  video.defaultMuted = true;
  video.muted = true;
  video.volume = 0;
}

function isDocumentActive() {
  if (typeof document === "undefined") return true;
  const visible = document.visibilityState === "visible";
  const focused =
    typeof document.hasFocus === "function" ? document.hasFocus() : true;
  return visible && focused;
}

/**
 * Binds a rear/front camera stream to a <video> ref for the Creation preview.
 * Stops tracks when `enabled` is false, the document/window is not active, or
 * the hook unmounts.
 */
export function useCreationCamera({
  enabled,
  facingMode,
}: UseCreationCameraOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<CreationCameraStatus>("idle");
  const [pageActive, setPageActive] = useState(isDocumentActive);

  useEffect(() => {
    const updatePageActive = () => setPageActive(isDocumentActive());
    const markInactive = () => setPageActive(false);

    updatePageActive();
    document.addEventListener("visibilitychange", updatePageActive);
    window.addEventListener("focus", updatePageActive);
    window.addEventListener("blur", markInactive);
    window.addEventListener("pageshow", updatePageActive);
    window.addEventListener("pagehide", markInactive);
    return () => {
      document.removeEventListener("visibilitychange", updatePageActive);
      window.removeEventListener("focus", updatePageActive);
      window.removeEventListener("blur", markInactive);
      window.removeEventListener("pageshow", updatePageActive);
      window.removeEventListener("pagehide", markInactive);
    };
  }, []);

  const shouldRunCamera = enabled && pageActive;

  useEffect(() => {
    if (!shouldRunCamera) {
      clearVideoElement(videoRef.current);
      setStream((prev) => {
        stopMediaStream(prev);
        return null;
      });
      setStatus("idle");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return;
    }

    let cancelled = false;
    setStatus("starting");

    void (async () => {
      try {
        const next = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (cancelled) {
          stopMediaStream(next);
          return;
        }
        setStream((prev) => {
          stopMediaStream(prev);
          return next;
        });
        setStatus("active");
      } catch {
        if (!cancelled) setStatus("denied");
      }
    })();

    return () => {
      cancelled = true;
      clearVideoElement(videoRef.current);
      setStream((prev) => {
        stopMediaStream(prev);
        return null;
      });
      setStatus("idle");
    };
  }, [facingMode, shouldRunCamera]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !stream) return;

    muteVideoElement(el);
    el.srcObject = stream;
    muteVideoElement(el);
    void el.play().catch(() => {
      /* autoplay policy — muted video should still play */
    });

    return () => {
      if (el.srcObject === stream) {
        clearVideoElement(el);
      }
    };
  }, [stream]);

  return { videoRef, status };
}
