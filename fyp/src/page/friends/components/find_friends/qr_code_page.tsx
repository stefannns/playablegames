import { getColorCSSVar, TUXNavBar, TUXNavBarIconAction, TUXText } from "@byted-tiktok/tux-web";
import {
  IconTiktokTextLogo,
  TUXIconChevronLeftOffsetLTR,
  TUXIconLink,
  TUXIconNSharelink,
  TUXIconScan,
} from "@byted-tiktok/tux-icons";

import { AppFrameImmersiveChrome } from "../../../../components/sys/app_frame_immersive_chrome";
import { ThemeScope } from "../../../../context/theme";
import { QR_PROFILE } from "../../find_friends_subpages.config";
import { FindFriendsImmersiveShell } from "./find_friends_immersive_shell";
import { IconInk } from "./shared";

const CENTER_AVATAR = "/resource/find_friends/center_avatar.png";
const QR_IMAGE = "/resource/find_friends/qr_code.png";

function QrActionButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="flex h-[77px] flex-1 flex-col items-center justify-center gap-1 rounded-[18px] outline-none active:opacity-80"
      style={{ backgroundColor: getColorCSSVar("UIPageFlat1") }}
    >
      <IconInk color="UIText1">{icon}</IconInk>
      <TUXText typographyPreset="P3-Semibold" color="UIText1">
        {label}
      </TUXText>
    </button>
  );
}

export function QrCodePage({
  onClose,
  onOpenScan,
}: {
  onClose: () => void;
  onOpenScan?: () => void;
}) {
  return (
    <FindFriendsImmersiveShell
      style={{
        backgroundImage: "url(/resource/find_friends/qr_bg.webp)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: getColorCSSVar("BrandTikTokBlack"),
      }}
    >
      <AppFrameImmersiveChrome>
      <TUXNavBar
        heightPreset={44}
        backgroundColor="UIPageFlat1"
        backgroundOpacity={0}
        leading={
          <TUXNavBarIconAction
            aria-label="Back"
            width="40px"
            height="44px"
            icon={
              <IconInk color="UIShapeText1OnPrimary">
                <TUXIconChevronLeftOffsetLTR size={24} />
              </IconInk>
            }
            onClick={onClose}
          />
        }
        trailing={
          <TUXNavBarIconAction
            aria-label="Scan"
            width="40px"
            height="44px"
            icon={
              <IconInk color="UIShapeText1OnPrimary">
                <TUXIconScan size={24} />
              </IconInk>
            }
            onClick={onOpenScan}
          />
        }
      />

      <div className="flex flex-1 flex-col items-center justify-center px-8 pb-[12%]">
        <div className="relative w-full" style={{ paddingTop: "64px" }}>
          <div
            className="absolute left-1/2 top-0 z-10 flex -translate-x-1/2 items-center justify-center rounded-full"
            style={{
              width: "106px",
              height: "106px",
              backgroundColor: getColorCSSVar("UIImageOverlayWhite"),
            }}
          >
            <img
              src={CENTER_AVATAR}
              alt=""
              className="rounded-full object-cover"
              style={{ width: "96px", height: "96px" }}
            />
          </div>
          <ThemeScope mode="light" className="flex w-full flex-col items-center">
            <div
              className="flex w-full flex-col items-center"
              style={{
                backgroundColor: getColorCSSVar("UIPageFlat1"),
                borderRadius: "24px",
                paddingTop: "47px",
                paddingBottom: "30px",
              }}
            >
              <div className="flex flex-col items-center" style={{ rowGap: "3px" }}>
                <TUXText typographyPreset="H2-Bold" color="UIText1">
                  {QR_PROFILE.name}
                </TUXText>
                <TUXText typographyPreset="P1-Regular" color="UIText3">
                  {QR_PROFILE.handle}
                </TUXText>
              </div>
              <div style={{ width: "200px", height: "200px", marginTop: "16px" }}>
                <img src={QR_IMAGE} alt="" className="size-full object-contain" />
              </div>
              <div style={{ marginTop: "22px" }}>
                <IconInk color="UIText1">
                  <IconTiktokTextLogo width={66} height={16} />
                </IconInk>
              </div>
            </div>

            <div className="mt-2 flex w-full" style={{ gap: "8px" }}>
              <QrActionButton icon={<TUXIconLink size={24} />} label="Copy link" />
              <QrActionButton icon={<TUXIconNSharelink size={24} />} label="Share link" />
            </div>
          </ThemeScope>
        </div>
      </div>

      <div
        className="flex justify-center px-6 pb-8"
      >
        <TUXText
          typographyPreset="P2-Regular"
          color="UIShapeText1OnPrimary"
          align="center"
          className="opacity-80"
        >
          Tap background to change style
        </TUXText>
      </div>
      </AppFrameImmersiveChrome>
    </FindFriendsImmersiveShell>
  );
}
