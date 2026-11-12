import {
  IconQuestionMarkCircleLTR,
  TUXIconArrowTurnUpRight,
  TUXIconEarthW,
  TUXIconEllipsisHorizontalFill,
  TUXIconMapPin,
  TUXIconPlus,
} from "@byted-tiktok/tux-icons";
import { useMemo, type ReactNode } from "react";

import { PublishLocationChipsFooter } from "./publish_location_chips";
import { PublishListIconInk, PublishMutedIconInk } from "./publish_icon_ink";
import { PublishSettingRow, PublishSettingRowTitle } from "./publish_setting_row";

export type PublishSettingListProps = {
  /** Video publish — Location 行带底部 chips；图文发布不带。 */
  showLocationChips?: boolean;
  /** 图文发布 — Location 旁带问号提示。 */
  showLocationHelp?: boolean;
  className?: string;
};

type StandardRow = {
  id: string;
  title: string;
  icon: ReactNode;
  titleGapClassName?: string;
  leadingPaddingClassName?: string;
};

const STANDARD_ROWS: StandardRow[] = [
  {
    id: "add-link",
    title: "Add link",
    icon: (
      <PublishListIconInk>
        <TUXIconPlus size={18} />
      </PublishListIconInk>
    ),
  },
  {
    id: "visibility",
    title: "Everyone can view this post",
    icon: (
      <PublishListIconInk>
        <TUXIconEarthW size={18} />
      </PublishListIconInk>
    ),
    titleGapClassName: "gap-2",
  },
  {
    id: "more",
    title: "More options",
    icon: (
      <PublishListIconInk>
        <TUXIconEllipsisHorizontalFill size={18} />
      </PublishListIconInk>
    ),
    leadingPaddingClassName: "py-[5.4px]",
  },
  {
    id: "share",
    title: "Share to",
    icon: (
      <PublishListIconInk>
        <TUXIconArrowTurnUpRight size={18} />
      </PublishListIconInk>
    ),
    leadingPaddingClassName: "py-[5.4px]",
  },
];

export function PublishSettingList({
  showLocationChips = false,
  showLocationHelp = false,
  className = "",
}: PublishSettingListProps) {
  const locationTitle = useMemo(() => {
    if (!showLocationHelp) {
      return "Location";
    }
    return (
      <span className="inline-flex min-w-0 flex-1 items-center gap-1 py-[5.5px]">
        <PublishSettingRowTitle>Location</PublishSettingRowTitle>
        <PublishMutedIconInk>
          <IconQuestionMarkCircleLTR width={12} height={12} aria-hidden />
        </PublishMutedIconInk>
      </span>
    );
  }, [showLocationHelp]);

  return (
    <section className={className}>
      <PublishSettingRow
        title={locationTitle}
        leadingIcon={
          <PublishListIconInk>
            <TUXIconMapPin size={18} />
          </PublishListIconInk>
        }
        footer={showLocationChips ? <PublishLocationChipsFooter /> : undefined}
      />

      {STANDARD_ROWS.map((row) => (
        <PublishSettingRow
          key={row.id}
          title={row.title}
          leadingIcon={row.icon}
          titleGapClassName={row.titleGapClassName}
          leadingPaddingClassName={row.leadingPaddingClassName}
        />
      ))}
    </section>
  );
}
