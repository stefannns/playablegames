import { TUXNavBar, TUXText } from "@byted-tiktok/tux-web";
import { IconChevronDownFill } from "@byted-tiktok/tux-icons";

import { AppNavBarBackButton } from "../../../../components/sys/app_nav_bar_back_button";

/** Center title for sound search / discover fullscreen (Figma "Sounds ▾"). */
function SoundPanelNavTitle() {
  return (
    <div className="flex items-center justify-center gap-0.5">
      <TUXText as="span" typographyPreset="H3-Bold" color="UIText1">
        Sounds
      </TUXText>
      <IconChevronDownFill width={16} height={16} className="text-tux-v2-ui-text-1" />
    </div>
  );
}

export type SoundPanelTuxNavBarProps = {
  onBack: () => void;
};

/** TUXNavBar row — back + centered Sounds title (light sheet surface). */
export function SoundPanelTuxNavBar({ onBack }: SoundPanelTuxNavBarProps) {
  return (
    <TUXNavBar
      heightPreset={44}
      showSeparator={false}
      backgroundOpacity={0}
      backgroundColor="UISheetFlat1"
      leading={<AppNavBarBackButton onBack={() => onBack()} />}
      customTitle={<SoundPanelNavTitle />}
    />
  );
}
