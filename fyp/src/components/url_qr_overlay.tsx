import { getColorCSSVar } from "@byted-tiktok/tux-web";
import { useCallback, useEffect } from "react";
import QRCode from "react-qr-code";

import { showAppFrameTopToast } from "./sys/app_frame_top_toast";
import { ThemeScope } from "../context/theme";
import { usePageUrl } from "../hooks/use_page_url";
import { isDesagentEmbed } from "../utils/desagent_embed";

const LOG_PREFIX = "[URL QR]";

export default function UrlQrOverlay() {
  const url = usePageUrl();

  useEffect(() => {
    if (!url) return;
    console.log(`${LOG_PREFIX}`, url);
  }, [url]);

  const handleCopyLink = useCallback(async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      showAppFrameTopToast({
        text: "Link copied to clipboard",
        duration: 2200,
        displayMode: "replace",
      });
    } catch {
      showAppFrameTopToast({
        text: "Could not copy link to clipboard",
        duration: 2200,
        displayMode: "replace",
      });
    }
  }, [url]);

  if (!url || isDesagentEmbed()) return null;

  return (
    <ThemeScope
      mode="light"
      className="hidden md:block top-4 right-4 z-60 fixed rounded-lg"
      style={{ backgroundColor: getColorCSSVar("UIPageFlat1") }}
    >
      <button
        type="button"
        className="cursor-pointer rounded-lg p-2 transition-opacity hover:opacity-80 active:opacity-60"
        aria-label="Copy page link to clipboard"
        title="Copy link"
        onClick={() => {
          void handleCopyLink();
        }}
      >
        <QRCode
          value={url}
          size={96}
          level="M"
          bgColor={getColorCSSVar("UIPageFlat1")}
          fgColor={getColorCSSVar("UIText1")}
        />
      </button>
    </ThemeScope>
  );
}
