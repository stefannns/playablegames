import { getColorCSSVar } from "@byted-tiktok/tux-web";

export function EditSidebarSplitLine() {
  return (
    <div className="flex w-full shrink-0 flex-col items-end justify-center px-[18px] py-[6px]">
      <div
        className="h-px w-5"
        style={{ backgroundColor: getColorCSSVar("UIImageOverlayWhiteA40") }}
      />
    </div>
  );
}
