import { TUXNavBar, TUXNavBarIconAction, TUXText } from "@byted-tiktok/tux-web";
import {
  TUXIconChevronLeftOffsetLTR,
  TUXIconFlashlight,
  TUXIconImageSquare,
  TUXIconNowQR,
} from "@byted-tiktok/tux-icons";
import { motion } from "framer-motion";

import { AppFrameImmersiveChrome } from "../../../../components/sys/app_frame_immersive_chrome";
import { IconInk } from "./shared";
import { FindFriendsImmersiveShell } from "./find_friends_immersive_shell";
import {
  IMMERSIVE_OVERLAY_TEXT,
  IMMERSIVE_SURFACE_BLACK,
} from "../../../creation/immersive_chrome.constants";

const FRAME = 271; // largeScanBorderSize
const CORNER = 20; // cornerLength
const SCAN_LINE = 73; // QRCodeScanningGrid height
const FRAME_RADIUS = 12; // bendRadius — scan grid mask matches corner brackets

/** One white L-shaped corner bracket (cornerWidth 4, cornerLength 20, bendRadius 12). */
function ScanCorner({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const sides: Record<typeof position, string> = {
    tl: "left-0 top-0 border-l-[4px] border-t-[4px] rounded-tl-[12px]",
    tr: "right-0 top-0 border-r-[4px] border-t-[4px] rounded-tr-[12px]",
    bl: "bottom-0 left-0 border-b-[4px] border-l-[4px] rounded-bl-[12px]",
    br: "bottom-0 right-0 border-b-[4px] border-r-[4px] rounded-br-[12px]",
  };
  return (
    <span
      aria-hidden
      className={`absolute ${sides[position]}`}
      style={{ width: `${CORNER}px`, height: `${CORNER}px`, borderColor: IMMERSIVE_OVERLAY_TEXT }}
    />
  );
}

function ScanBottomButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="flex flex-col items-center gap-2 outline-none active:opacity-70"
    >
      <span
        className="flex size-14 items-center justify-center rounded-full"
        style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
      >
        <IconInk color="UIText1">{icon}</IconInk>
      </span>
      <TUXText typographyPreset="P3-Regular" color="UIText1">
        {label}
      </TUXText>
    </button>
  );
}

export function ScanPage({ onClose }: { onClose: () => void }) {
  return (
    <FindFriendsImmersiveShell style={{ backgroundColor: IMMERSIVE_SURFACE_BLACK }}>
      <AppFrameImmersiveChrome>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[120px]"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[120px]"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)" }}
        />

        <div className="relative z-10 shrink-0">
          <TUXNavBar
            heightPreset={44}
            backgroundColor="UIPageFlat1"
            backgroundOpacity={0}
            titleAlign="center"
            customTitle={
              <TUXText typographyPreset="H4-Bold" color="UIText1">
                Scan
              </TUXText>
            }
            leading={
              <TUXNavBarIconAction
                aria-label="Back"
                width="40px"
                height="44px"
                icon={
                  <IconInk color="UIText1">
                    <TUXIconChevronLeftOffsetLTR size={24} />
                  </IconInk>
                }
                onClick={onClose}
              />
            }
          />
        </div>

        <div className="relative z-0 flex min-h-0 flex-1 -translate-y-[30px] flex-col items-center justify-center">
          <div
            className="relative"
            style={{ width: `${FRAME}px`, height: `${FRAME}px`, maxWidth: "80vw" }}
          >
            <div
              aria-hidden
              className="absolute inset-0 overflow-hidden"
              style={{ borderRadius: `${FRAME_RADIUS}px` }}
            >
              <motion.img
                src="/resource/scan/QRCodeScanningGrid.png"
                alt=""
                className="absolute inset-x-0 top-0 w-full"
                initial={{ y: -SCAN_LINE }}
                animate={{ y: FRAME }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "loop", ease: "linear" }}
              />
            </div>
            <ScanCorner position="tl" />
            <ScanCorner position="tr" />
            <ScanCorner position="bl" />
            <ScanCorner position="br" />
          </div>

          <div className="mt-5 flex items-center gap-1.5">
            <IconInk color="UIText1">
              <TUXIconFlashlight size={20} />
            </IconInk>
            <TUXText typographyPreset="Headline-Semibold" color="UIText1">
              Tap to turn light on
            </TUXText>
          </div>

          <TUXText
            typographyPreset="P2-Regular"
            color="UIText1"
            align="center"
            className="mt-4 px-12"
          >
            Scan your friends&rsquo; QR code to connect
          </TUXText>
        </div>

        <div className="absolute inset-x-0 bottom-[61px] z-10 flex justify-center gap-[62px]">
          <ScanBottomButton icon={<TUXIconNowQR size={32} />} label="My QR code" />
          <ScanBottomButton icon={<TUXIconImageSquare size={32} />} label="Gallery" />
        </div>
      </AppFrameImmersiveChrome>
    </FindFriendsImmersiveShell>
  );
}
