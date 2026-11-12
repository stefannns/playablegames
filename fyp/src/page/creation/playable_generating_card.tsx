/**
 * Generating card: Paper mesh-gradient shader background + twinkling Lottie stars + progress.
 * Parameters from the Create-with-AI export README (shaders.paper.design/mesh-gradient):
 * card size, colors and shader props are copied verbatim.
 */
import Lottie from "lottie-react";
import { MeshGradient } from "@paper-design/shaders-react";
import { useReducedMotion } from "framer-motion";
import starAnimation from "../../assets/lottie/tako_generating_star.json";

const CARD = { width: 187, height: 265 };
const MESH = {
  colors: ["#d7e9ff", "#f4faff", "#cbc8fe", "#93bcff", "#b3ddff"],
  distortion: 0.56, swirl: 0.1, grainMixer: 0.245, grainOverlay: 0.11, speed: 1.2,
};

export function PlayableGeneratingCard({ progress }: { progress: number }) {
  const reducedMotion = useReducedMotion();
  return (
    <div className="playable-generating-card" data-electron-smooth-corner role="progressbar"
      aria-label="Generating playable" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
      <MeshGradient className="playable-generating-shader" width={CARD.width} height={CARD.height}
        {...MESH} speed={reducedMotion ? 0 : MESH.speed} />
      <div className="playable-generating-content">
        <Lottie className="playable-generating-stars" animationData={starAnimation} loop autoplay={!reducedMotion} />
        <span className="playable-generating-progress">{Math.min(99, Math.max(0, progress))}%</span>
      </div>
    </div>
  );
}
