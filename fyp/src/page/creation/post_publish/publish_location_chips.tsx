import { TUXText } from "@byted-tiktok/tux-web";
import { TUXIconMagnifyingGlass } from "@byted-tiktok/tux-icons";
import { useRef, type MouseEvent, type ReactNode } from "react";

import { useHorizontalScrollWheel } from "../../../hooks/use_horizontal_scroll_wheel";
import { CREATION_PUBLISH_LOCATION_CHIPS } from "../creation_publish_page.config";

function LocationSuggestionChip({
  label,
  leadingIcon,
}: {
  label: string;
  leadingIcon?: ReactNode;
}) {
  const stopRowClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  return (
    <button
      type="button"
      className="inline-flex z-2 relative items-center gap-1 bg-tux-v2-ui-shape-neutral-4! px-2 rounded-[6px] h-[28px] shrink-0"
      onClick={stopRowClick}
    >
      {leadingIcon ? (
        <span className="flex justify-center items-center size-3 text-tux-v2-ui-text-1 shrink-0">
          {leadingIcon}
        </span>
      ) : null}
      <TUXText
        typographyPreset="P2-Semibold"
        color="UIText1"
        as="span"
        className="whitespace-nowrap"
      >
        {label}
      </TUXText>
    </button>
  );
}

/** Video publish — Location 行下方的横向地点建议 chips。 */
export function PublishLocationChipsFooter() {
  const chipRowRef = useRef<HTMLDivElement>(null);
  useHorizontalScrollWheel(chipRowRef);

  return (
    <div
      ref={chipRowRef}
      className="z-1 box-border relative flex flex-nowrap items-start gap-2 px-4 w-full min-w-0 h-[40px] overflow-x-auto overscroll-x-contain scroll-px-4 touch-pan-x hide-scrollbar shrink-0"
      role="group"
      aria-label="Suggested locations"
    >
      {CREATION_PUBLISH_LOCATION_CHIPS.map((label) => (
        <LocationSuggestionChip key={label} label={label} />
      ))}
      <LocationSuggestionChip
        label="Search more"
        leadingIcon={<TUXIconMagnifyingGlass size={12} />}
      />
    </div>
  );
}
