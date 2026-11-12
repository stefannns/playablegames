import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "@byted-tiktok/tux-web/styles.css";
import DevAgentation from "./components/dev_agentation";
import UrlQrOverlay from "./components/url_qr_overlay";
import { SoftKeyboardProvider } from "./components/sys/soft_keyboard";
import { AppNavigationProvider } from "./context/app_navigation";
import { ThemeProvider } from "./context/theme";
import RootAppEntry from "./page/root_app_entry";
import { initDesagentEmbedRuntime } from "./utils/desagent_embed";
import { syncStandaloneDisplayModeDataAttr } from "./utils/display_mode";

if (typeof window !== "undefined" && "ongesturestart" in window) {
  const prevent = (event: Event) => {
    event.preventDefault();
  };

  for (const type of ["gesturestart", "gesturechange", "gestureend"]) {
    document.addEventListener(type, prevent, { passive: false });
  }
}

if (typeof window !== "undefined") {
  document.addEventListener(
    "dragstart",
    (event) => {
      if (event.target instanceof HTMLImageElement) {
        event.preventDefault();
      }
    },
    { capture: true },
  );
}

if (typeof window !== "undefined") {
  initDesagentEmbedRuntime();
  syncStandaloneDisplayModeDataAttr();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AppNavigationProvider>
        <SoftKeyboardProvider>
          <>
            <RootAppEntry />
            <UrlQrOverlay />
            <DevAgentation />
          </>
        </SoftKeyboardProvider>
      </AppNavigationProvider>
    </ThemeProvider>
  </StrictMode>,
);
