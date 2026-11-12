import { TUXSegmentedControl } from "@byted-tiktok/tux-web";

import { useTheme, type ThemeMode } from "../../context/theme";
import { DesktopCornerToolbar } from "./desktop_corner_toolbar";

const ITEMS = [
  { itemKey: "system", title: "System" },
  { itemKey: "light", title: "Light" },
  { itemKey: "dark", title: "Dark" },
] as const;

function isThemeMode(value: string): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

export default function ThemeSwitcher() {
  const { mode, setMode } = useTheme();

  return (
    <DesktopCornerToolbar side="right" aria-label="Theme">
      <TUXSegmentedControl
        items={[...ITEMS]}
        activeKey={mode}
        sizePreset="small"
        shapePreset="capsule"
        fitContent={true}
        onChange={(key: string) => {
          if (isThemeMode(key)) setMode(key);
        }}
      />
    </DesktopCornerToolbar>
  );
}
