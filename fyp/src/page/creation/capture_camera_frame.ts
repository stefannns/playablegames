type ObjectCoverCrop = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
};

/** Match object-cover + object-position (default center top) used by the live viewfinder. */
function objectCoverCrop(
  videoWidth: number,
  videoHeight: number,
  containerWidth: number,
  containerHeight: number,
  objectPosition: { x: "center"; y: "top" } = { x: "center", y: "top" },
): ObjectCoverCrop {
  const videoAspect = videoWidth / videoHeight;
  const containerAspect = containerWidth / containerHeight;

  if (videoAspect > containerAspect) {
    const sw = videoHeight * containerAspect;
    return {
      sx: objectPosition.x === "center" ? (videoWidth - sw) / 2 : 0,
      sy: 0,
      sw,
      sh: videoHeight,
    };
  }

  const sh = videoWidth / containerAspect;
  return {
    sx: 0,
    sy: objectPosition.y === "top" ? 0 : (videoHeight - sh) / 2,
    sw: videoWidth,
    sh,
  };
}

type FrameSource = {
  image: CanvasImageSource;
  crop: ObjectCoverCrop;
  close?: () => void;
};

/**
 * Prefer ImageCapture / createImageBitmap so the browser performs the same
 * YUV → RGB color conversion as the live <video> tag. Direct drawImage(video)
 * on a default sRGB canvas often shifts warm/yellow on Safari and macOS cameras.
 */
async function loadFrameSource(
  video: HTMLVideoElement,
  crop: ObjectCoverCrop,
): Promise<FrameSource> {
  const stream = video.srcObject;
  if (stream instanceof MediaStream) {
    const track = stream.getVideoTracks()[0];
    const ImageCaptureCtor = (
      window as typeof window & {
        ImageCapture?: new (track: MediaStreamTrack) => {
          grabFrame(): Promise<ImageBitmap>;
        };
      }
    ).ImageCapture;
    if (track && ImageCaptureCtor) {
      try {
        const capture = new ImageCaptureCtor(track);
        const bitmap = await capture.grabFrame();
        return {
          image: bitmap,
          crop,
          close: () => bitmap.close(),
        };
      } catch {
        // Fall through to createImageBitmap / video.
      }
    }
  }

  try {
    const bitmap = await createImageBitmap(video, crop.sx, crop.sy, crop.sw, crop.sh, {
      resizeQuality: "high",
    });
    return {
      image: bitmap,
      crop: { sx: 0, sy: 0, sw: bitmap.width, sh: bitmap.height },
      close: () => bitmap.close(),
    };
  } catch {
    return { image: video, crop };
  }
}

/** Capture the visible viewfinder region (object-cover crop) as a JPEG data URL. */
export async function captureCameraViewfinder(
  video: HTMLVideoElement,
  container: HTMLElement,
  options: { mirrored?: boolean } = {},
): Promise<string | null> {
  const { videoWidth: vw, videoHeight: vh } = video;
  if (!vw || !vh) {
    return null;
  }

  const cw = container.clientWidth;
  const ch = container.clientHeight;
  if (!cw || !ch) {
    return null;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const outW = Math.round(cw * dpr);
  const outH = Math.round(ch * dpr);
  const crop = objectCoverCrop(vw, vh, cw, ch);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d", { alpha: false, colorSpace: "srgb" });
  if (!ctx) {
    return null;
  }

  const source = await loadFrameSource(video, crop);

  try {
    ctx.save();
    if (options.mirrored) {
      ctx.translate(outW, 0);
      ctx.scale(-1, 1);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      source.image,
      source.crop.sx,
      source.crop.sy,
      source.crop.sw,
      source.crop.sh,
      0,
      0,
      outW,
      outH,
    );
    ctx.restore();

    return canvas.toDataURL("image/jpeg", 0.92);
  } finally {
    source.close?.();
  }
}
