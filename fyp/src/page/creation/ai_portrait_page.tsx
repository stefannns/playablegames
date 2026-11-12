import {
  TUXButton,
  TUXNavBar,
  TUXText,
  getColorCSSVar,
} from "@byted-tiktok/tux-web";
import {
  IMMERSIVE_OVERLAY_TEXT,
  IMMERSIVE_SURFACE_BLACK,
} from "./immersive_chrome.constants";
import {
  IconChevronLeftOffsetLTR,
  TUXIconColorAIStar,
} from "@byted-tiktok/tux-icons";
import { useAppFrame } from "../../components/sys/app_frame";
import { ThemeScope } from "../../context/theme";

export type AIPortraitPageProps = {
  onClose: (trigger?: HTMLElement | null) => void;
};

const BASE = "/resource/video_mock/ai-portrait";

const POLAROID_CARDS = [
  { src: `${BASE}/polaroid-1.png`, left: 265, top: 33, width: 88.41, height: 106.59, rotate: -5, originX: "0%", originY: "6.57%" },
  { src: `${BASE}/polaroid-2.png`, left: 195, top: 55, width: 93.14, height: 110.16, rotate: 8, originX: "15.06%", originY: "0%" },
  { src: `${BASE}/polaroid-3.png`, left: 140, top: 26, width: 88.2, height: 106.43, rotate: -4.87, originX: "0%", originY: "6.42%" },
  { src: `${BASE}/polaroid-4.png`, left: 2, top: 23, width: 96.15, height: 112.37, rotate: -10, originX: "0%", originY: "12.43%" },
  { src: `${BASE}/polaroid-5.png`, left: 76, top: 55, width: 85.12, height: 104.05, rotate: 3, originX: "6.20%", originY: "0%" },
];

const GRID_ITEMS = [
  { src: `${BASE}/grid-row1.png`, username: "@gowee_LA", posts: "1.6K posts" },
  { src: `${BASE}/grid-row2.png`, username: "@aline", posts: "1.6K posts" },
  { src: `${BASE}/grid-row3.png`, username: "@gowee_LA", posts: "1.6K posts" },
  { src: `${BASE}/grid-row4.png`, username: "@gowee_LA", posts: "1.6K posts" },
];

const CARD_WIDTH = 173;

export default function AIPortraitPage({ onClose }: AIPortraitPageProps) {
  const { topInsetCss } = useAppFrame();

  return (
    <ThemeScope mode="dark" className="relative h-full min-h-0">
      <div
        className="relative h-full min-h-0 w-full overflow-hidden"
        style={{ backgroundColor: IMMERSIVE_SURFACE_BLACK }}
      >
        <div className="h-full overflow-y-auto" style={{ paddingBottom: 34 }}>
          {/* ── Top section ── */}
          <div
            style={{
              width: "100%",
              maxWidth: 390,
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              paddingTop: 47,
            }}
          >
            {/* Polaroid cards area (390×287 centered container) */}
            <div
              style={{
                width: 390,
                height: 287,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 360,
                  height: 185,
                  position: "relative",
                }}
              >
                {POLAROID_CARDS.map((card, i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: card.left,
                      top: card.top,
                      width: card.width,
                      height: card.height,
                      borderRadius: 10,
                      border: `3px solid ${IMMERSIVE_OVERLAY_TEXT}`,
                      overflow: "hidden",
                      boxShadow:
                        "0.629px 1.887px 5.032px 0px rgba(0,0,0,0.06)",
                      transform: `rotate(${card.rotate}deg)`,
                      transformOrigin: `${card.originX} ${card.originY}`,
                    }}
                  >
                    <img
                      src={card.src}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                ))}

                {/* Decorative star 1 (26×26 at x=259, y=0) */}
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: 259,
                    top: 0,
                    width: 26,
                    height: 26,
                    filter: "drop-shadow(0 5px 10px rgba(0, 0, 0, 0.15))",
                  }}
                >
                  <TUXIconColorAIStar size={26} />
                </span>

                {/* Decorative star 2 (20×20 at x=52, y=165) */}
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: 52,
                    top: 165,
                    width: 20,
                    height: 20,
                    filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15))",
                  }}
                >
                  <TUXIconColorAIStar size={20} />
                </span>
              </div>
            </div>

            {/* ButtonGroup */}
            <div
              style={{
                width: 390,
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                gap: 16,
                padding: "0 12px 12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  gap: 5,
                }}
              >
                <TUXText
                  style={{
                    fontFamily: "TikTok Sans",
                    fontWeight: 600,
                    fontSize: 20,
                    lineHeight: "125%",
                    textAlign: "center",
                    color: getColorCSSVar("MiscTooltipText1"),
                  }}
                >
                  Picture yourself in different realities
                </TUXText>
                <TUXText
                  typographyPreset="P2-Regular"
                  style={{
                    textAlign: "center",
                    color: "rgba(255,255,255,0.75)",
                  }}
                >
                  Be anywhere and anyone by using one of your styles or a custom prompt of your own.
                </TUXText>
              </div>

              <TUXButton
                text="Create AI Self"
                shapePreset="capsule"
                sizePreset="medium"
                height="44px"
                smoothRadius
                block
                backgroundColor="UIShapeNeutral"
                textColor="UIShapeText1OnNeutral"
              />
            </div>
          </div>

          {/* ── Grid view ── */}
          <div
            style={{
              width: "100%",
              maxWidth: 390,
              margin: "0 auto",
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              padding: 16,
            }}
          >
            {GRID_ITEMS.map((item, i) => (
              <div
                key={i}
                style={{
                  width: CARD_WIDTH,
                  height: 260,
                  borderRadius: 14,
                  overflow: "hidden",
                  position: "relative",
                  backgroundColor: "rgba(51,51,51,0.6)",
                  flexShrink: 0,
                }}
              >
                <img
                  src={item.src}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    position: "absolute",
                    inset: 0,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    bottom: 0,
                    width: "100%",
                    height: 43,
                    background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    bottom: 0,
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 4,
                    padding: "0 12px 8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      width: "100%",
                    }}
                  >
                    <TUXText
                      typographyPreset="P1-Semibold"
                      style={{ color: getColorCSSVar("MiscTooltipText1") }}
                    >
                      {item.username}
                    </TUXText>
                  </div>
                  <TUXText
                    typographyPreset="P3-Regular"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                  >
                    {item.posts}
                  </TUXText>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* ── Fixed header overlay ── */}
        <div
          className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
          style={{
            paddingTop: topInsetCss,
            background:
              "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.61) 50%, rgba(0,0,0,0) 100%)",
          }}
        >
          <div className="pointer-events-auto">
            <TUXNavBar
              heightPreset={44}
              fixed={false}
              showSeparator={false}
              customTitle={<div />}
              titleAlign="center"
              leading={
                <button
                  type="button"
                  aria-label="Back"
                  className="flex items-center justify-center"
                  style={{ width: 44, height: 44 }}
                  onClick={(event) => onClose(event.currentTarget)}
                >
                  <IconChevronLeftOffsetLTR width={24} height={24} />
                </button>
              }
            />
          </div>
        </div>
      </div>
    </ThemeScope>
  );
}
