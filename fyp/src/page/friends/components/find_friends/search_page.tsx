import { TUXInput, TUXNavBar, TUXNavBarIconAction, TUXText } from "@byted-tiktok/tux-web";
import {
  TUXIconChevronLeftOffsetLTR,
  TUXIconMagnifyingGlass,
  TUXIconScan,
} from "@byted-tiktok/tux-icons";
import { useEffect, useRef } from "react";

import { useAppFrame } from "../../../../components/sys/app_frame";
import { IconInk } from "./shared";

export function SearchPage({ onClose }: { onClose: () => void }) {
  const { topInsetCss } = useAppFrame();
  const fieldRef = useRef<HTMLDivElement>(null);

  // Focus the field on mount so the search bar shows a blinking cursor (keyboard ignored on web).
  useEffect(() => {
    fieldRef.current?.querySelector("input")?.focus();
  }, []);

  return (
    <div
      className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-tux-v2-ui-page-flat-1"
      style={{ paddingTop: topInsetCss }}
    >
      <TUXNavBar
        heightPreset={44}
        backgroundColor="UIPageFlat1"
        backgroundOpacity={1}
        showSeparator={false}
        titleAlign="center"
        customTitle={
          <TUXText typographyPreset="H3-Bold" color="UIText1">
            Find friends
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
            aria-label="Scan QR code to add friend"
            width="40px"
            height="44px"
            icon={
              <IconInk color="UIText1">
                <TUXIconScan size={24} />
              </IconInk>
            }
          />
        }
      />

      <div ref={fieldRef} className="px-4 pt-2 pb-3">
        <TUXInput
          sizePreset="medium"
          width="100%"
          placeholder="Search by name or username"
          aria-label="Search by name or username"
          autoFocus
          leadingIcon={
            <IconInk color="UITextPlaceholder">
              <TUXIconMagnifyingGlass size={20} />
            </IconInk>
          }
        />
      </div>

      <div className="flex flex-1 flex-col items-center px-12 pt-[5%]">
        <img src="/resource/illustration/EmptyTwoHumanBubble.png" alt="" className="w-[130px]" />
        <TUXText typographyPreset="H4-Semibold" color="UIText3" align="center" className="mt-4">
          Enter people&apos;s names or usernames to search for them on TikTok.
        </TUXText>
      </div>
    </div>
  );
}
