import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

const RADIUS = 50;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 314.16
const RECORDING_DURATION_MS = 15_000;
const RED = "#FE2C55";
const WHITE = "var(--tux-v2-color-ui-image-overlay-white)";

export type CameraRecordingButtonProps = {
  onDone: () => void;
  style?: CSSProperties;
};

const CameraRecordingButton = ({ onDone, style }: CameraRecordingButtonProps) => {
  // Entrance scale-in animation
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setEntered(true), 0);
    return () => clearTimeout(id);
  }, []);

  // RAF-driven arc animation — direct DOM mutation to avoid re-renders
  const startRef = useRef(performance.now());
  const rafRef = useRef(0);
  const firedRef = useRef(false);
  const arcRef = useRef<SVGCircleElement>(null);
  const onDoneRef = useRef(onDone);
  useLayoutEffect(() => { onDoneRef.current = onDone; });

  const fire = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    cancelAnimationFrame(rafRef.current);
    onDoneRef.current();
  };

  useEffect(() => {
    const tick = (now: number) => {
      const p = Math.min((now - startRef.current) / RECORDING_DURATION_MS, 1);
      if (arcRef.current) {
        arcRef.current.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - p));
      }
      if (p >= 1) { fire(); return; }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button
      type="button"
      aria-label="Stop recording"
      className="absolute z-40"
      style={{
        width: 116,
        height: 116,
        left: "50%",
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        touchAction: "none",
        transform: `translateX(-50%) scale(${entered ? 1 : 0.65})`,
        opacity: entered ? 1 : 0,
        transition: "transform 220ms cubic-bezier(0.34,1.56,0.64,1), opacity 180ms ease",
        ...style,
      }}
      onPointerUp={fire}
      onPointerCancel={fire}
    >
      {/* Background circle — ui/image overlay/white a40 */}
      <span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "999px",
          background: "var(--tux-v2-color-ui-image-overlay-white-a40)",
          display: "block",
        }}
      />

      {/* Red progress arc — rotated so fill starts from 12 o'clock */}
      <svg
        width="116"
        height="116"
        viewBox="0 0 116 116"
        style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
        aria-hidden
      >
        <circle
          ref={arcRef}
          cx="58"
          cy="58"
          r={RADIUS}
          fill="none"
          stroke={RED}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={String(CIRCUMFERENCE)}
          strokeDashoffset={String(CIRCUMFERENCE)}
        />
      </svg>

      {/* White inner circle */}
      <span
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
          width: 36,
          height: 36,
          borderRadius: "999px",
          background: WHITE,
          display: "block",
          pointerEvents: "none",
        }}
      />
    </button>
  );
};

export default CameraRecordingButton;
