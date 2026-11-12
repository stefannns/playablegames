import type { ReactNode } from "react";

import { useVisitorProfile } from "../../context/visitor_profile";
import {
  useRegisterHomeIndicatorSurfaceTheme,
  useRegisterStatusBarSurfaceTheme,
} from "./app_frame";
import { APP_Z_OVERLAY } from "./app_z_index";
import VisitorProfileLayer from "./visitor_profile_layer";

/** Parallax host + dim + guest profile layer; registers light chrome while open. */
export function VisitorProfileAppChrome({ children }: { children: ReactNode }) {
  const { phase, registerBehind, registerDim } = useVisitorProfile();

  useRegisterStatusBarSurfaceTheme(phase === "open" ? "light" : null);
  useRegisterHomeIndicatorSurfaceTheme(phase === "open" ? "light" : null);

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <div ref={registerBehind} className="h-full min-h-0">
        {children}
      </div>
      <div
        ref={registerDim}
        className="pointer-events-none absolute inset-0 bg-black"
        style={{ zIndex: APP_Z_OVERLAY - 10, opacity: 0 }}
      />
      <VisitorProfileLayer />
    </div>
  );
}
