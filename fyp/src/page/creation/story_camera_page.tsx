import {
  TUXIconCameraFlashFill,
  TUXIconCameraFlipCamera,
  TUXIconMusicNoteSAlt,
  TUXIconTextLatin,
  TUXIconXMark,
} from "@byted-tiktok/tux-icons";
import { TUXText } from "@byted-tiktok/tux-web";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

import { useAppFrame } from "../../components/sys/app_frame";
import { captureCameraViewfinder } from "./capture_camera_frame";
import { closeStoryCamera, openAlbumFromCamera, openStoryEdit } from "./add_to_story_store";
import {
  IMMERSIVE_OVERLAY_TEXT,
  IMMERSIVE_SURFACE_BLACK,
} from "./immersive_chrome.constants";

/** Reveal-mode record button graphic (Icon_Bitmap/Story_Reveal, 2x transparent). */
const STORY_REVEAL_BITMAP = "/resource/video_mock/camera/story_reveal.png";
const CAMERA_EFFECT_THUMB = "/resource/video_mock/camera/camera_effect.png";
const ALBUM_FIRST_PICKER_THUMB = "/resource/video_mock/story_picker/picker-01.png";

/** Which capture mode the camera is in — toggled by the STORY / STORY REVEAL tab. */
type CaptureMode = "story" | "reveal";

/** Center zoom, matching the album → editor motion spec. */
const ZOOM_IN_DURATION_MS = 250;
const ZOOM_IN_EASE = "cubic-bezier(0.16, 0.5, 0.3, 1)";
const ZOOM_OUT_DURATION_MS = 200;
const ZOOM_OUT_EASE = "cubic-bezier(0.4, 0, 0.6, 1)";
const ZOOM_FROM_SCALE = 0.9;

/** Viewfinder geometry per Figma node 2628:45926 (frame 390×844, camera y52→746). */
const VIEWFINDER_BOTTOM_PCT = (746 / 844) * 100;
const VIEWFINDER_FOOTER_PCT = 100 - VIEWFINDER_BOTTOM_PCT;
const VIEWFINDER_RADIUS = 20;

const TOOL_SHADOW = "drop-shadow(0 1px 4px rgba(0, 0, 0, 0.3))";

/** Story ring gradient — 45° top-left → bottom-right across green 1 / 2 / 3. */
const STORY_RECORD_GRADIENT =
  "linear-gradient(135deg, var(--tux-v2-color-social-story-gradient-green-1) 0%, var(--tux-v2-color-social-story-gradient-green-2) 50%, var(--tux-v2-color-social-story-gradient-green-3) 100%)";

/** Fade applied to elements that appear/disappear between capture modes. */
const MODE_FADE = "opacity 200ms ease-out";

type CameraFacing = "user" | "environment";

const FRONT_CAMERA_RE = /front|user|face|facetime|selfie|integrated|built-in/i;
const BACK_CAMERA_RE = /back|rear|environment|world|trunk|dual/i;

function pickCameraDeviceId(
  devices: MediaDeviceInfo[],
  facing: CameraFacing,
  activeDeviceId: string | null,
): string | undefined {
  const cameras = devices.filter((device) => device.kind === "videoinput" && device.deviceId);
  if (cameras.length === 0) {
    return undefined;
  }
  if (cameras.length === 1) {
    return cameras[0].deviceId;
  }

  const front = cameras.find((device) => FRONT_CAMERA_RE.test(device.label));
  const back = cameras.find((device) => BACK_CAMERA_RE.test(device.label));

  if (facing === "user" && front?.deviceId) {
    return front.deviceId;
  }
  if (facing === "environment" && back?.deviceId) {
    return back.deviceId;
  }

  if (activeDeviceId) {
    const other = cameras.find((device) => device.deviceId !== activeDeviceId);
    if (other?.deviceId) {
      return other.deviceId;
    }
  }

  return facing === "user" ? cameras[0].deviceId : cameras[cameras.length - 1].deviceId;
}

async function openCameraStream(
  facing: CameraFacing,
  activeDeviceId: string | null,
): Promise<MediaStream | null> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return null;
  }

  const devices = await navigator.mediaDevices.enumerateDevices();
  const deviceId = pickCameraDeviceId(devices, facing, activeDeviceId);

  const attempts: MediaStreamConstraints[] = [];
  if (deviceId) {
    attempts.push({ video: { deviceId: { exact: deviceId } }, audio: false });
  }
  attempts.push(
    { video: { facingMode: { ideal: facing } }, audio: false },
    { video: { facingMode: facing }, audio: false },
    { video: true, audio: false },
  );

  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch {
      continue;
    }
  }

  return null;
}

function ToolButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-13 w-14 items-center justify-center outline-none"
      style={{ color: IMMERSIVE_OVERLAY_TEXT, filter: TOOL_SHADOW }}
    >
      {icon}
    </button>
  );
}

function AlbumThumb({ src, onClick }: { src: string; onClick?: () => void }) {
  const shellClass =
    "block h-14 w-14 overflow-hidden outline-none transition-transform";
  const shellStyle = {
    borderRadius: "var(--tux-v2-radius-content-xlarge)",
    border: "0.5px solid var(--tux-v2-color-ui-image-overlay-white-a40)",
  };
  const img = (
    <img alt="" src={src} className="h-full w-full object-cover" draggable={false} />
  );

  if (!onClick) {
    return (
      <div aria-hidden className={shellClass} style={shellStyle}>
        {img}
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-label="Open album"
      onClick={onClick}
      className={`${shellClass} active:scale-95`}
      style={shellStyle}
    >
      {img}
    </button>
  );
}

/**
 * One label inside the STORY / STORY REVEAL segmented control. Renders the
 * black (selected) and white (unselected) variants stacked so the color can
 * cross-fade as selection moves. The button is measured to drive the sliding
 * white pill and the row offset that keeps the selected label page-centered.
 */
function TabLabel({
  text,
  selected,
  onClick,
  buttonRef,
  animate = true,
}: {
  text: string;
  selected: boolean;
  onClick: () => void;
  buttonRef: RefObject<HTMLButtonElement>;
  animate?: boolean;
}) {
  const fade = animate ? "opacity 260ms ease" : "none";

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      className="relative flex items-center whitespace-nowrap outline-none"
      style={{ height: 26 }}
    >
      <span
        className="flex items-center"
        style={{
          opacity: selected ? 0 : 1,
          transition: fade,
          textShadow: "0px 1px 5px rgba(0, 0, 0, 0.35)",
        }}
      >
        <TUXText typographyPreset="P1-Semibold" color="UIImageOverlayWhite">
          {text}
        </TUXText>
      </span>
      <span
        aria-hidden
        className="absolute inset-0 flex items-center justify-center"
        style={{ opacity: selected ? 1 : 0, transition: fade }}
      >
        <TUXText typographyPreset="P1-Semibold" color="UIImageOverlayBlack">
          {text}
        </TUXText>
      </span>
    </button>
  );
}

function StoryCameraContent({ active }: { active: boolean }) {
  const { topInsetCss, bottomInsetCss } = useAppFrame();
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewfinderRef = useRef<HTMLDivElement>(null);
  const activeDeviceIdRef = useRef<string | null>(null);
  const [streamReady, setStreamReady] = useState(false);
  const [facing, setFacing] = useState<CameraFacing>("user");
  const [mode, setMode] = useState<CaptureMode>("story");

  const isFrontCamera = facing === "user";
  const storyMode = mode === "story";

  const toggleCameraFacing = useCallback(() => {
    setStreamReady(false);
    setFacing((current) => (current === "user" ? "environment" : "user"));
  }, []);

  // Sliding-pill segmented control: measure the selected label so the white
  // capsule grows in place (centered) while the labels slide and recolor.
  const tabRef = useRef<HTMLDivElement>(null);
  const storyLabelRef = useRef<HTMLButtonElement>(null);
  const revealLabelRef = useRef<HTMLButtonElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const [rowOffset, setRowOffset] = useState(0);
  const [tabTransitionEnabled, setTabTransitionEnabled] = useState(false);

  useLayoutEffect(() => {
    const selected = storyMode ? storyLabelRef.current : revealLabelRef.current;
    const container = tabRef.current;
    if (!selected || !container) {
      return;
    }
    const PILL_PAD = 8;
    const width = selected.offsetWidth + PILL_PAD * 2;
    const center = container.clientWidth / 2;
    const selectedCenter = selected.offsetLeft + selected.offsetWidth / 2;
    setRowOffset(center - selectedCenter);
    setPill({ left: center - width / 2, width });
  }, [mode, storyMode]);

  // Snap tab layout on open; enable slide/fade only after the first paint so
  // entering the camera does not animate the row or pill from (0, 0).
  useLayoutEffect(() => {
    if (!active || tabTransitionEnabled) {
      return undefined;
    }
    const frame = window.requestAnimationFrame(() => setTabTransitionEnabled(true));
    return () => window.cancelAnimationFrame(frame);
  }, [active, tabTransitionEnabled]);

  useEffect(() => {
    if (!active) {
      setTabTransitionEnabled(false);
    }
  }, [active]);

  // Reveal the viewfinder only after the center zoom-in has finished.
  useEffect(() => {
    if (!active) {
      activeDeviceIdRef.current = null;
      return undefined;
    }

    let stream: MediaStream | null = null;
    let cancelled = false;
    setStreamReady(false);

    void openCameraStream(facing, activeDeviceIdRef.current).then((next) => {
      if (cancelled) {
        next?.getTracks().forEach((track) => track.stop());
        return;
      }
      if (!next) {
        return;
      }

      stream = next;
      const track = next.getVideoTracks()[0];
      activeDeviceIdRef.current = track?.getSettings().deviceId ?? activeDeviceIdRef.current;

      const video = videoRef.current;
      if (video) {
        video.srcObject = next;
        void video.play().catch(() => {
          // Autoplay may fail until the layer is visible — onLoadedData retries.
        });
      }
    });

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [active, facing]);

  const handleCapture = () => {
    const video = videoRef.current;
    const viewfinder = viewfinderRef.current;
    if (!video || !viewfinder || !streamReady) {
      return;
    }

    void captureCameraViewfinder(video, viewfinder, { mirrored: isFrontCamera }).then(
      (frame) => {
        if (frame) {
          openStoryEdit(frame);
        }
      },
    );
  };

  return (
    <div
      className="relative h-full min-h-0 w-full overflow-hidden"
      style={{ backgroundColor: IMMERSIVE_SURFACE_BLACK }}
    >
      {/* Viewfinder (Figma "bg 2") — live device camera fills the framed canvas */}
      <div
        ref={viewfinderRef}
        className="absolute inset-x-0 overflow-hidden"
        style={{
          top: topInsetCss,
          bottom: `${VIEWFINDER_FOOTER_PCT}%`,
          borderRadius: VIEWFINDER_RADIUS,
          backgroundColor: IMMERSIVE_SURFACE_BLACK,
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedData={() => {
            setStreamReady(true);
            void videoRef.current?.play().catch(() => undefined);
          }}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            opacity: streamReady ? 1 : 0,
            transition: "opacity 120ms ease-out",
            transform: isFrontCamera ? "scaleX(-1)" : "none",
          }}
        />
      </div>

      {/* Close */}
      <button
        type="button"
        aria-label="Close camera"
        onClick={closeStoryCamera}
        className="absolute left-3 flex h-8 w-8 items-center justify-center outline-none"
        style={{
          top: `calc(${topInsetCss} + 20px)`,
          color: IMMERSIVE_OVERLAY_TEXT,
          filter: TOOL_SHADOW,
        }}
      >
        <TUXIconXMark size={28} />
      </button>

      {/* Right toolbar — flip + flash stay; the divider, text and sounds fade
          out in STORY REVEAL mode. */}
      <div
        className="absolute right-0 flex flex-col items-center"
        style={{ top: `calc(${topInsetCss} + 10px)` }}
      >
        <ToolButton
          label="Flip camera"
          icon={<TUXIconCameraFlipCamera size={28} />}
          onClick={toggleCameraFacing}
        />
        <ToolButton label="Flash" icon={<TUXIconCameraFlashFill size={28} />} />
        <div
          aria-hidden
          className="flex w-14 items-center justify-center"
          style={{ padding: "6px 0", opacity: storyMode ? 1 : 0, transition: MODE_FADE }}
        >
          <span
            style={{ width: 20, height: 1, backgroundColor: "rgba(255, 255, 255, 0.34)" }}
          />
        </div>
        <div
          className="flex flex-col items-center"
          style={{
            opacity: storyMode ? 1 : 0,
            transition: MODE_FADE,
            pointerEvents: storyMode ? "auto" : "none",
          }}
        >
          <ToolButton label="Text" icon={<TUXIconTextLatin size={28} />} />
          <ToolButton label="Sounds" icon={<TUXIconMusicNoteSAlt size={28} />} />
        </div>
      </div>

      {/* Mode tab + record actions, anchored above the viewfinder bottom */}
      <div
        className="absolute inset-x-0 flex flex-col items-center gap-4"
        style={{ bottom: `calc(${VIEWFINDER_FOOTER_PCT}% + 24px)` }}
      >
        {/* Mode tab — white pill grows in place (centered) while the labels
            slide horizontally and cross-fade their color on toggle. */}
        <div ref={tabRef} className="relative w-full" style={{ height: 26 }}>
          <span
            aria-hidden
            className="absolute rounded-full"
            style={{
              top: 0,
              height: 26,
              left: pill.left,
              width: pill.width,
              backgroundColor: "var(--tux-v2-color-ui-image-overlay-white)",
              boxShadow: "0px 1px 5px rgba(0, 0, 0, 0.2)",
              transition: tabTransitionEnabled ? "left 260ms ease, width 260ms ease" : "none",
            }}
          />
          <div
            className="absolute left-0 top-0 flex items-center"
            style={{
              height: 26,
              gap: 24,
              transform: `translateX(${rowOffset}px)`,
              transition: tabTransitionEnabled ? "transform 260ms ease" : "none",
            }}
          >
            <TabLabel
              text="STORY"
              selected={storyMode}
              onClick={() => setMode("story")}
              buttonRef={storyLabelRef}
              animate={tabTransitionEnabled}
            />
            <TabLabel
              text="STORY REVEAL"
              selected={!storyMode}
              onClick={() => setMode("reveal")}
              buttonRef={revealLabelRef}
              animate={tabTransitionEnabled}
            />
          </div>
        </div>

        {/* Record actions — album thumbnails fade away in STORY REVEAL mode,
            leaving the record button centered with the reveal glyph. */}
        <div className="flex w-full items-center justify-between px-9">
          <span
            style={{
              opacity: storyMode ? 1 : 0,
              transition: MODE_FADE,
              pointerEvents: storyMode ? "auto" : "none",
            }}
          >
            <AlbumThumb src={CAMERA_EFFECT_THUMB} />
          </span>

          <button
            type="button"
            aria-label="Record"
            onClick={handleCapture}
            className="relative flex items-center justify-center rounded-full outline-none transition-transform active:scale-95"
            style={{
              width: 86,
              height: 86,
              border: "3px solid var(--tux-v2-color-ui-image-overlay-white)",
              filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.06))",
            }}
          >
            {storyMode ? (
              // Story mode: plain story-gradient capsule.
              <span
                className="rounded-full"
                style={{ width: 74, height: 74, background: STORY_RECORD_GRADIENT }}
              />
            ) : (
              // Story Reveal mode: dedicated bitmap action button.
              <img
                src={STORY_REVEAL_BITMAP}
                alt=""
                width={74}
                height={74}
                draggable={false}
                className="rounded-full"
                style={{ width: 74, height: 74 }}
              />
            )}
          </button>

          <span
            style={{
              opacity: storyMode ? 1 : 0,
              transition: MODE_FADE,
              pointerEvents: storyMode ? "auto" : "none",
            }}
          >
            <AlbumThumb src={ALBUM_FIRST_PICKER_THUMB} onClick={openAlbumFromCamera} />
          </span>
        </div>
      </div>

      {/* Record modes bar (camera mode selector) */}
      <div
        className="absolute inset-x-0 flex items-center justify-center"
        style={{ bottom: `calc(${bottomInsetCss} + 25px)` }}
      >
        <span style={{ textShadow: "0px 1px 5px rgba(0, 0, 0, 0.35)" }}>
          <TUXText typographyPreset="Headline-Semibold" color="UIImageOverlayWhite">
            STORY
          </TUXText>
        </span>
      </div>
    </div>
  );
}

/**
 * Camera capture layer rendered on top of the album. Zooms in from the center
 * when {@link open} is set. Stays mounted (stream kept alive) while {@link visible}
 * is false — e.g. editor open on top after a capture.
 */
export default function StoryCameraLayer({
  open,
  visible = true,
}: {
  open: boolean;
  visible?: boolean;
}) {
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);
  const exitTimerRef = useRef<number | null>(null);
  const prevVisibleRef = useRef(visible);

  const showUi = open && visible;
  const suspended = open && !visible;
  const resumingFromSuspend = open && visible && !prevVisibleRef.current && entered;

  useEffect(() => {
    prevVisibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    if (exitTimerRef.current != null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }

    if (!open) {
      setEntered(false);
      exitTimerRef.current = window.setTimeout(() => {
        setMounted(false);
        exitTimerRef.current = null;
      }, ZOOM_OUT_DURATION_MS);
      return undefined;
    }

    setMounted(true);

    if (suspended) {
      setEntered(true);
      return undefined;
    }

    let inner = 0;
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      window.cancelAnimationFrame(outer);
      window.cancelAnimationFrame(inner);
    };
  }, [open, suspended]);

  useEffect(
    () => () => {
      if (exitTimerRef.current != null) {
        window.clearTimeout(exitTimerRef.current);
      }
    },
    [],
  );

  if (!mounted) {
    return null;
  }

  const isClosing = !open;
  const skipTransition = suspended || resumingFromSuspend;

  return (
    <div
      className="absolute inset-0 z-100"
      aria-hidden={!showUi}
      style={{
        transformOrigin: "center",
        transform: entered ? "scale(1)" : `scale(${ZOOM_FROM_SCALE})`,
        transition: skipTransition
          ? "none"
          : `transform ${isClosing ? ZOOM_OUT_DURATION_MS : ZOOM_IN_DURATION_MS}ms ${isClosing ? ZOOM_OUT_EASE : ZOOM_IN_EASE}`,
        visibility: showUi ? "visible" : "hidden",
        pointerEvents: showUi ? "auto" : "none",
        willChange: "transform",
      }}
    >
      <StoryCameraContent active={open} />
    </div>
  );
}
