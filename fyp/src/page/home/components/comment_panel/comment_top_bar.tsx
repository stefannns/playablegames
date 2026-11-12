import { TUXText, getColorCSSVar } from "@byted-tiktok/tux-web";
import {
  Icon3LinesCenterAligned,
  IconChevronCollapse,
  IconChevronExpand,
  IconMagnifyingGlassFill,
  IconMapThumbtackFill,
  IconShoppingCartFillLTR,
  IconXMark,
} from "@byted-tiktok/tux-icons";
import { useEffect, useMemo, useRef, useState } from "react";

export type CommentTopBarTitleAlignment = "left" | "center";

export type AnchorVariant = "name" | "name_d" | "name_poi" | "two_lines" | "search" | "tako";

export type CommentTopBarProps = {
  title: string;
  expanded: boolean;
  showGrabber?: boolean;
  showExpandButton?: boolean;
  showFilterButton?: boolean;
  showAnchor?: boolean;
  titleAlignment?: CommentTopBarTitleAlignment;
  defaultAnchorVariant?: AnchorVariant;
  onExpandedChange: (expanded: boolean) => void;
  onClose: () => void;
  onTopBarPointerDownCapture?: (event: React.PointerEvent<HTMLDivElement>) => void;
  // 当 topbar 区域（anchor / filter / expand / close）刚发生过拖动时返回 true，
  // 以阻止本次按钮 click 触发原本的点击行为。
  shouldSuppressTopBarClick?: () => boolean;
};

type AnchorVariantInternal = AnchorVariant;

export function CommentTopBar({
  title,
  expanded,
  showGrabber = true,
  showExpandButton = true,
  showFilterButton = true,
  showAnchor = true,
  titleAlignment = "left",
  defaultAnchorVariant = "name",
  onExpandedChange,
  onClose,
  onTopBarPointerDownCapture,
  shouldSuppressTopBarClick,
}: CommentTopBarProps) {
  const [anchorVariant, setAnchorVariant] = useState<AnchorVariantInternal>(defaultAnchorVariant);

  // 当外部默认锚点切换时，同步更新当前展示的锚点版本（保持点击循环切换的行为不变）。
  useEffect(() => {
    setAnchorVariant(defaultAnchorVariant);
  }, [defaultAnchorVariant]);

  const anchorButtonRef = useRef<HTMLButtonElement | null>(null);
  const anchorContentRef = useRef<HTMLDivElement | null>(null);
  const previousAnchorVariantRef = useRef<AnchorVariant | null>(null);
  const previousAnchorHeightRef = useRef<number | null>(null);

  const anchorPaddingClassName = useMemo(() => {
    switch (anchorVariant) {
      case "two_lines":
        return "pt-3 pr-1 pb-1.5 pl-3";
      case "search":
      case "tako":
        return "pt-3 pr-1 pb-1 pl-4";
      case "name":
      case "name_d":
      case "name_poi":
      default:
        return "pt-3 pr-1 pb-1 pl-3.5";
    }
  }, [anchorVariant]);

  useEffect(() => {
    const buttonElement = anchorButtonRef.current;
    const contentElement = anchorContentRef.current;
    if (!buttonElement) return;

    const nextHeight = buttonElement.getBoundingClientRect().height;
    const previousVariant = previousAnchorVariantRef.current;
    const previousHeight = previousAnchorHeightRef.current;

    if (previousVariant && previousVariant !== anchorVariant) {
      if (contentElement) {
        contentElement.animate(
          [
            {
              opacity: 0,
              transform: "translateY(5px) scale(0.985)",
            },
            {
              opacity: 1,
              transform: "translateY(0) scale(1)",
            },
          ],
          {
            duration: 180,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          },
        );
      }

      if (previousHeight && Math.abs(previousHeight - nextHeight) > 0.5) {
        buttonElement.animate(
          [
            { height: `${previousHeight}px` },
            { height: `${nextHeight}px` },
          ],
          {
            duration: 180,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          },
        );
      }
    }

    previousAnchorVariantRef.current = anchorVariant;
    previousAnchorHeightRef.current = nextHeight;
  }, [anchorVariant]);

  return (
    <div
      className="relative w-full select-none"
      onPointerDownCapture={onTopBarPointerDownCapture}
    >
      {/* Grabber */}
      {showGrabber ? (
        <div
          className="left-1/2 absolute -translate-x-1/2 select-none"
          style={{ top: 6, touchAction: "none" }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 999,
              backgroundColor: getColorCSSVar("UIShapeNeutral3"),
            }}
          />
        </div>
      ) : null}

      {/* Anchor Section */}
      {showAnchor ? (
        <button
          ref={anchorButtonRef}
        type="button"
        aria-label="Anchor"
        className={[
          "w-full overflow-hidden text-left transition-padding duration-180 ease-out",
          anchorPaddingClassName,
        ].join(" ")}
        data-anchor-root="true"
        onClick={() => {
          if (shouldSuppressTopBarClick?.()) return;
          const order: AnchorVariant[] = ["name", "name_d", "name_poi", "two_lines", "search", "tako"];
          const next = order[(order.indexOf(anchorVariant) + 1) % order.length];
          setAnchorVariant(next);
        }}
      >
        {anchorVariant === "name" ? (
          <div ref={anchorContentRef} className="flex items-center gap-2 origin-top-left">
            <div
              style={{
                backgroundColor: getColorCSSVar("UIPageGrouped1"),
                borderRadius: 6,
                padding: 5,
              }}
            >
              <IconMapThumbtackFill
                width={14}
                height={14}
                style={{ color: getColorCSSVar("UITextSuccessDisplay") }}
              />
            </div>
            <TUXText
              as="span"
              style={{
                fontSize: 13,
                fontWeight: 600,
                lineHeight: "16.9px",
                color: getColorCSSVar("UIText1"),
              }}
            >
              Budapest
            </TUXText>
          </div>
        ) : null}

        {anchorVariant === "name_d" ? (
          <div ref={anchorContentRef} className="flex items-center gap-2 origin-top-left">
            <div
              style={{
                backgroundColor: getColorCSSVar("UIPageGrouped1"),
                borderRadius: 6,
                padding: 5,
              }}
            >
              <IconMapThumbtackFill
                width={14}
                height={14}
                style={{ color: getColorCSSVar("UITextSuccessDisplay") }}
              />
            </div>
            <div className="flex items-center gap-1">
              <TUXText
                as="span"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: "16.9px",
                  color: getColorCSSVar("UIText1"),
                }}
              >
                Budapest
              </TUXText>
              <TUXText
                as="span"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: "16.9px",
                  color: getColorCSSVar("UIText1"),
                }}
              >
                ·
              </TUXText>
              <TUXText
                as="span"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: "16.9px",
                  color: getColorCSSVar("UIText1"),
                }}
              >
                Japan
              </TUXText>
            </div>
          </div>
        ) : null}

        {anchorVariant === "name_poi" ? (
          <div ref={anchorContentRef} className="flex items-center gap-2 origin-top-left">
            <div
              style={{
                backgroundColor: getColorCSSVar("UIPageGrouped1"),
                borderRadius: 6,
                padding: 5,
              }}
            >
              <IconShoppingCartFillLTR
                width={14}
                height={14}
                style={{ color: getColorCSSVar("UITextWarningDisplay") }}
              />
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <TUXText
                as="span"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: "16.9px",
                  color: getColorCSSVar("UIText1"),
                  whiteSpace: "nowrap",
                }}
              >
                Air Max 270 React
              </TUXText>
              <TUXText
                as="span"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  lineHeight: "16.9px",
                  letterSpacing: "0.9739%",
                  color: getColorCSSVar("UIText3"),
                }}
              >
                ·
              </TUXText>
              <TUXText
                as="span"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  lineHeight: "16.9px",
                  letterSpacing: "0.9739%",
                  color: getColorCSSVar("UIText3"),
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                70% off in Black Friday
              </TUXText>
            </div>
          </div>
        ) : null}

        {anchorVariant === "two_lines" ? (
          <div ref={anchorContentRef} className="flex items-center gap-2 origin-top-left">
            <div
              className="flex items-center justify-center"
              style={{
                width: 34,
                height: 34,
                backgroundColor: getColorCSSVar("UIPageGrouped1"),
                borderRadius: 8,
              }}
            >
              <IconMapThumbtackFill
                width={16}
                height={16}
                style={{ color: getColorCSSVar("UITextSuccessDisplay") }}
              />
            </div>
            <div className="flex flex-col justify-center gap-0.5">
              <div className="flex items-center gap-1">
                <TUXText
                  as="span"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    lineHeight: "16.9px",
                    color: getColorCSSVar("UIText1"),
                  }}
                >
                  Budapest
                </TUXText>
                <TUXText
                  as="span"
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    lineHeight: "18.2px",
                    color: getColorCSSVar("UIText1"),
                  }}
                >
                  ·
                </TUXText>
                <TUXText
                  as="span"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    lineHeight: "16.9px",
                    color: getColorCSSVar("UIText1"),
                  }}
                >
                  Japan
                </TUXText>
              </div>
              <TUXText
                as="span"
                style={{
                  fontSize: 12,
                  fontWeight: 400,
                  lineHeight: "15.6px",
                  color: getColorCSSVar("UIText3"),
                }}
              >
                14.7K people posted about this place
              </TUXText>
            </div>
          </div>
        ) : null}

        {anchorVariant === "search" ? (
          <div ref={anchorContentRef} className="flex items-center gap-1 origin-top-left">
            <TUXText
              as="span"
              style={{
                fontSize: 13,
                fontWeight: 500,
                lineHeight: "16.9px",
                letterSpacing: "0.9739%",
                color: getColorCSSVar("UIText3"),
              }}
            >
              Search:
            </TUXText>
            <div className="flex items-center gap-1">
              <TUXText
                as="span"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: "16.9px",
                  color: getColorCSSVar("UITextInfo"),
                }}
              >
                Hokkaido trip
              </TUXText>
              <IconMagnifyingGlassFill
                width={14}
                height={14}
                style={{ color: getColorCSSVar("UITextInfo") }}
              />
            </div>
          </div>
        ) : null}

        {anchorVariant === "tako" ? (
          <div ref={anchorContentRef} className="flex items-center gap-1 origin-top-left">
            <TUXText
              as="span"
              style={{
                fontSize: 13,
                fontWeight: 500,
                lineHeight: "16.9px",
                letterSpacing: "0.9739%",
                color: getColorCSSVar("UIText3"),
              }}
            >
              Ask Tako:
            </TUXText>
            <TUXText
              as="span"
              style={{
                fontSize: 13,
                fontWeight: 600,
                lineHeight: "16.9px",
                color: getColorCSSVar("UITextInfo"),
              }}
            >
              How to make pastas
            </TUXText>
          </div>
        ) : null}
      </button>
      ) : null}

      {/* Navigation Bar */}
      <div
        className="relative flex items-center justify-between h-10 pl-4 pr-1.5 select-none"
        style={{ touchAction: "none" }}
      >
        <div
          className={[
            "flex items-center gap-0.5 h-10",
            titleAlignment === "center" ? "absolute left-1/2 -translate-x-1/2" : "",
          ].join(" ")}
        >
          <div
            className="flex items-center h-8"
          >
            <TUXText
              as="span"
              style={{
                fontSize: 13,
                fontWeight: 600,
                lineHeight: "16.9px",
                color: getColorCSSVar("UIText1"),
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </TUXText>
          </div>
          {showFilterButton ? (
            <button
              type="button"
              aria-label="Filter"
              className="flex items-center justify-center"
              style={{ width: 14, height: 14, padding: 0, background: "transparent" }}
              data-topbar-action="true"
            >
              <Icon3LinesCenterAligned width={14} height={14} className="text-tux-v2-ui-text-1" />
            </button>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-0.5 ml-auto">
          {showExpandButton ? (
            <button
              type="button"
              aria-label="Expand"
              aria-pressed={expanded}
              className="flex items-center justify-center w-10 h-10"
              onClick={() => {
                if (shouldSuppressTopBarClick?.()) return;
                onExpandedChange(!expanded);
              }}
              data-topbar-action="true"
            >
              {expanded ? (
                <IconChevronCollapse width={20} height={20} className="text-tux-v2-ui-text-1" />
              ) : (
                <IconChevronExpand width={20} height={20} className="text-tux-v2-ui-text-1" />
              )}
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Close"
            className="flex items-center justify-center w-10 h-10"
            onClick={() => {
              if (shouldSuppressTopBarClick?.()) return;
              onClose();
            }}
            data-topbar-action="true"
          >
            <IconXMark width={22} height={22} className="text-tux-v2-ui-text-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
