import { TUXListCell, TUXNavBar, getColorCSSVar } from "@byted-tiktok/tux-web";
import { AppNavBarBackButton } from "../../components/sys/app_nav_bar_back_button";
import { showAppFrameTopToast } from "../../components/sys/app_frame_top_toast";
import {
  TUXIconChevronRightSlimThinLTR,
  TUXIconCommentFill,
  TUXIconEyeFill,
  TUXIconPlaylist2Fill,
  TUXIconTrashBinFill,
} from "@byted-tiktok/tux-icons";
import { useState, type MouseEvent, type ReactNode } from "react";

import { useAppFrame } from "../../components/sys/app_frame";

const ICON_SIZE = 20;
const CHEVRON_COLOR = "UITextPlaceholder";

type ManagePostsItem = {
  key: string;
  label: string;
  icon: ReactNode;
};

const MANAGE_POSTS_ITEMS: ManagePostsItem[] = [
  {
    key: "recently-deleted",
    label: "Recently deleted",
    icon: <TUXIconTrashBinFill size={ICON_SIZE} />,
  },
  {
    key: "manage-post-visibility",
    label: "Manage post visibility",
    icon: <TUXIconEyeFill size={ICON_SIZE} />,
  },
  {
    key: "manage-comments-permission",
    label: "Manage comments permission",
    icon: <TUXIconCommentFill size={ICON_SIZE} />,
  },
  {
    key: "manage-post-reuse-permission",
    label: "Manage post reuse permission",
    icon: <TUXIconPlaylist2Fill size={ICON_SIZE} />,
  },
];

function PlainListLeadingIcon({ children }: { children: ReactNode }) {
  return (
    <span
      className="box-border inline-flex shrink-0 items-start py-1.5"
      style={{ color: getColorCSSVar(CHEVRON_COLOR) }}
    >
      <span
        className="inline-flex items-center justify-center"
        style={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          fontSize: ICON_SIZE,
          lineHeight: 0,
        }}
      >
        {children}
      </span>
    </span>
  );
}

export type ManagePostsPageProps = {
  onBack?: (trigger?: HTMLElement | null) => void;
  onItemClick?: (item: ManagePostsItem, trigger?: HTMLElement | null) => void;
};

export default function ManagePostsPage({ onBack, onItemClick }: ManagePostsPageProps) {
  const { topInsetCss } = useAppFrame();
  const [showSeparator, setShowSeparator] = useState(false);

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden"
      style={{
        backgroundColor: getColorCSSVar("UIPageGrouped1"),
        paddingTop: topInsetCss,
      }}
    >
      <TUXNavBar
        heightPreset={44}
        fixed={false}
        showSeparator={showSeparator}
        backgroundColor="UIPageGrouped1"
        title="Manage posts"
        leading={<AppNavBarBackButton onBack={onBack} />}
      />

      <div
        className="min-h-0 flex-1 overflow-y-auto"
        onScroll={(event) => {
          const nextShowSeparator = event.currentTarget.scrollTop > 6;
          setShowSeparator((current) =>
            current === nextShowSeparator ? current : nextShowSeparator,
          );
        }}
      >
        <div className="px-2 pb-6 pt-2">
          <div
            className="flex flex-col overflow-hidden rounded-lg"
            style={{ backgroundColor: getColorCSSVar("UISheetFlat1") }}
          >
            {MANAGE_POSTS_ITEMS.map((item) => (
              <TUXListCell
                key={item.key}
                title={item.label}
                leadingIcon={<PlainListLeadingIcon>{item.icon}</PlainListLeadingIcon>}
                trailing={
                  <div
                    className="flex min-h-8 items-center justify-end"
                    style={{ color: getColorCSSVar(CHEVRON_COLOR) }}
                  >
                    <TUXIconChevronRightSlimThinLTR size={16} />
                  </div>
                }
                onClick={(event: MouseEvent<HTMLElement>) => {
                  if (onItemClick) {
                    onItemClick(item, event.currentTarget);
                    return;
                  }
                  showAppFrameTopToast({
                    text: item.label,
                    duration: 1500,
                    displayMode: "replace",
                  });
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { MANAGE_POSTS_ITEMS, type ManagePostsItem };
