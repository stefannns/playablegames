import { TUXNavBar, TUXNavBarIconAction, TUXText } from "@byted-tiktok/tux-web";
import { TUXIconChevronLeftOffsetLTR, TUXIconGear } from "@byted-tiktok/tux-icons";

import { AppFrameImmersiveChrome } from "../../../../components/sys/app_frame_immersive_chrome";
import { IconInk } from "./shared";
import { FindFriendsImmersiveShell } from "./find_friends_immersive_shell";

const CENTER_AVATAR = "/resource/find_friends/center_avatar.png";

export function ConnectNowPage({ onClose }: { onClose: () => void }) {
  return (
    <FindFriendsImmersiveShell className="bg-tux-v2-ui-page-flat-1">
      <AppFrameImmersiveChrome>
      <TUXNavBar
        heightPreset={44}
        backgroundColor="UIPageFlat1"
        backgroundOpacity={1}
        showSeparator={false}
        titleAlign="center"
        customTitle={
          <TUXText typographyPreset="H3-Bold" color="UIText1">
            Connect now
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
        trailing={
          <TUXNavBarIconAction
            aria-label="Settings"
            width="40px"
            height="44px"
            icon={
              <IconInk color="UIText1">
                <TUXIconGear size={24} />
              </IconInk>
            }
          />
        }
      />

      <div className="flex flex-1 items-center justify-center px-4">
        <div className="relative aspect-square w-full max-w-[410px]">
          <img
            src="/resource/find_friends/dot_ring.svg"
            alt=""
            aria-hidden
            className="absolute inset-0 size-full"
          />
          <img
            src={CENTER_AVATAR}
            alt=""
            className="absolute left-1/2 top-1/2 size-[84px] -translate-x-1/2 -translate-y-1/2 rounded-full object-cover"
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 px-10 pb-20 text-center">
        <TUXText typographyPreset="H3-Bold" color="UIText1" align="center">
          Looking for friends...
        </TUXText>
        <TUXText typographyPreset="P1-Regular" color="UIText3" align="center">
          Stay on this page to see each other.
        </TUXText>
      </div>
      </AppFrameImmersiveChrome>
    </FindFriendsImmersiveShell>
  );
}
