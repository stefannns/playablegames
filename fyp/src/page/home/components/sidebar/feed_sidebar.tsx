import { TUXText, getColorCSSVar, TUXButton } from "@byted-tiktok/tux-web";
import {
  TUXIconClockFill,
  TUXIconCloudArrowDownFill,
  TUXIconColorCoinSmall,
  TUXIconMinisFill,
  TUXIconPersonStarFill,
  TUXIconQRCodeFill,
  TUXIconRoundStackFill,
  TUXIconShoppingCartFillLTR,
  TUXIconWalletFill,
} from "@byted-tiktok/tux-icons";
import { SIDEBAR_LIST_ICON_SIZE } from "../../../../components/icons/sidebar_chrome";
import { SidebarChevron, SidebarListLeadingIcon } from "../../../../components/icons/sidebar_list_icon";
import { useAppFrame } from "../../../../components/sys/app_frame";

export function FeedSidebar() {
  const { bottomInsetCss } = useAppFrame();
  const sectionTitleTextStyle = {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  } as const;
  const amountTextStyle = {
    color: getColorCSSVar("UIText1"),
  } as const;
  const mutedText1Style = {
    color: getColorCSSVar("UIText3"),
  } as const;
  const taskRowStyle = {
    width: "100%",
    display: "flex",
    alignItems: "center",
  } as const;
  const taskLeadingStyle = {
    minWidth: 0,
    flex: "1 1 auto",
    display: "flex",
    alignItems: "center",
    columnGap: "10px",
  } as const;
  const taskImageFrameStyle = {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    background: getColorCSSVar("UIShapeNeutral4"),
    overflow: "hidden",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as const;
  const taskTextBlockStyle = {
    minWidth: 0,
    flex: "1 1 auto",
    display: "flex",
    flexDirection: "column",
    rowGap: "1px",
  } as const;
  const taskTitleTextStyle = {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  } as const;
  const taskRewardRowStyle = {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    columnGap: "2px",
  } as const;
  const taskRewardTextStyle = {
    color: getColorCSSVar("SearchTaskCoin2"),
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  } as const;
  const taskButtonWrapperStyle = {
    marginLeft: "10px",
    flexShrink: 0,
  } as const;
  const listCellStyle = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    minWidth: 0,
    paddingTop: "12px",
    paddingBottom: "12px",
  } as const;
  const listCellTitleStyle = {
    minWidth: 0,
    flex: "1 1 auto",
  } as const;
  const listCellTextBlockResetStyle = {
    display: "block",
    margin: 0,
    padding: 0,
    border: 0,
  } as const;
  const listCellTitleTextStyle = {
    ...sectionTitleTextStyle,
    ...listCellTextBlockResetStyle,
    height: "20.8px",
  } as const;
  const listCellAmountTextStyle = {
    ...listCellTextBlockResetStyle,
    height: "20.8px",
  } as const;
  const listCellTrailingStyle = {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    marginLeft: "20px",
    columnGap: "4px",
  } as const;
  const listCellBalanceTrailingStyle = {
    ...listCellTrailingStyle,
    columnGap: "8px",
  } as const;

  return (
    <div
      className="h-full overflow-y-auto"
      style={{
        display: "flex",
        width: "100%",
        paddingRight: "20px",
        paddingBottom: "0",
        paddingLeft: "20px",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        background: getColorCSSVar("UISheetGrouped1"),
      }}
    >
      <div
        className="pt-app-frame-top-gap-4 flex flex-col gap-2 w-full shrink-0"
        style={{
          paddingBottom: bottomInsetCss,
        }}
      >
        {/* Your rewards */}
        <div
          style={{
            display: "flex",
            padding: "4px 20px 4px 20px",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "4px",
            borderRadius: "16px",
            background: getColorCSSVar("UISheetGrouped2"),
          }}
        >
          <div className="flex items-center w-full" style={{ paddingTop: "12px", paddingBottom: "12px", columnGap: "20px" }}>
            <div className="flex flex-1 items-center min-w-0" style={{ columnGap: "10px" }}>
              <SidebarListLeadingIcon>
                <TUXIconRoundStackFill
                  size={SIDEBAR_LIST_ICON_SIZE}
                />
              </SidebarListLeadingIcon>
              <TUXText typographyPreset="P1-Semibold" color="UIText1" textDisplay="truncate" className="block flex-1 min-w-0" style={sectionTitleTextStyle}>
                Your rewards
              </TUXText>
            </div>
            <SidebarChevron />
          </div>

          <div className="flex flex-col items-start self-stretch w-full" style={{ rowGap: "16px", paddingBottom: "12px" }}>
            <div className="flex items-center" style={{ columnGap: "4px" }}>
              <TUXIconColorCoinSmall size={24} />
              <TUXText typographyPreset="H1-Bold" style={amountTextStyle}>
                200
              </TUXText>
              <span className="inline-flex items-center" style={{ marginLeft: "8px" }}>
                <TUXText typographyPreset="P2-Semibold" className="leading-none" style={mutedText1Style}>
                  (
                </TUXText>
                <span className="inline-flex items-center" style={{ columnGap: "2px", marginLeft: "2px" }}>
                  <span className="inline-flex items-center align-middle">
                    <TUXIconColorCoinSmall size={12} />
                  </span>
                  <TUXText typographyPreset="P3-Semibold" className="leading-none" style={mutedText1Style}>
                    1,000=R$1
                  </TUXText>
                </span>
                <TUXText typographyPreset="P2-Semibold" className="leading-none" style={{ ...mutedText1Style, marginLeft: "2px" }}>
                  )
                </TUXText>
              </span>
            </div>

            <div style={taskRowStyle}>
              <div style={taskLeadingStyle}>
                <div style={taskImageFrameStyle}>
                  <img
                    src="/resource/sidebar/task-center/task-center-daily-check-in.png"
                    alt=""
                    style={{ display: "block", height: "26px", width: "auto" }}
                  />
                </div>
                <div style={taskTextBlockStyle}>
                  <TUXText typographyPreset="P1-Semibold" color="UIText1" style={taskTitleTextStyle}>
                    Daily check in
                  </TUXText>
                  <div style={taskRewardRowStyle}>
                    <TUXIconColorCoinSmall size={10} />
                    <TUXText typographyPreset="SmallText1-Semibold" style={taskRewardTextStyle}>
                      1,000
                    </TUXText>
                  </div>
                </div>
              </div>
              <div style={taskButtonWrapperStyle}>
                <TUXButton themePreset="secondary" shapePreset="capsule" smoothRadius width="48px" height="24px" paddingInline="0px">
                  <TUXText typographyPreset="P3-Semibold" color="UIText1">GO</TUXText>
                </TUXButton>
              </div>
            </div>

            <div style={taskRowStyle}>
              <div style={taskLeadingStyle}>
                <div style={taskImageFrameStyle}>
                  <img
                    src="/resource/sidebar/task-center/task-center-daily-check-in.png"
                    alt=""
                    style={{ display: "block", height: "26px", width: "auto" }}
                  />
                </div>
                <div style={taskTextBlockStyle}>
                  <TUXText typographyPreset="P1-Semibold" color="UIText1" style={taskTitleTextStyle}>
                    Invite new users
                  </TUXText>
                  <div style={taskRewardRowStyle}>
                    <TUXIconColorCoinSmall size={10} />
                    <TUXText typographyPreset="SmallText1-Semibold" style={taskRewardTextStyle}>
                      50,000
                    </TUXText>
                  </div>
                </div>
              </div>
              <div style={taskButtonWrapperStyle}>
                <TUXButton themePreset="secondary" shapePreset="capsule" smoothRadius width="48px" height="24px" paddingInline="0px">
                  <TUXText typographyPreset="P3-Semibold" color="UIText1">GO</TUXText>
                </TUXButton>
              </div>
            </div>
          </div>
        </div>

        {/* TikTok Minis */}
        <div
          style={{
            display: "flex",
            padding: "4px 20px 4px 20px",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "4px",
            borderRadius: "16px",
            background: getColorCSSVar("UISheetGrouped2"),
          }}
        >
          <div className="flex items-center gap-5 py-3 w-full">
            <div className="flex flex-1 items-center gap-2.5 min-w-0">
              <SidebarListLeadingIcon>
                <TUXIconMinisFill size={SIDEBAR_LIST_ICON_SIZE} />
              </SidebarListLeadingIcon>
              <TUXText typographyPreset="P1-Semibold" color="UIText1" textDisplay="truncate" className="block flex-1 min-w-0" style={sectionTitleTextStyle}>
                TikTok Minis
              </TUXText>
            </div>
            <SidebarChevron />
          </div>
          <div
            style={{
              width: "100%",
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              columnGap: "32px",
              rowGap: "16px",
              paddingBottom: "12px",
            }}
          >
            {[
              { name: "DramaLab", src: "/resource/sidebar/minis/1.png" },
              { name: "Monopoly man", src: "/resource/sidebar/minis/2.png" },
              { name: "FlexTV", src: "/resource/sidebar/minis/3.png" },
              { name: "RoyalKing", src: "/resource/sidebar/minis/4.png" },
              { name: "Crossy Road", src: "/resource/sidebar/minis/5.png" },
              { name: "Helix Jump", src: "/resource/sidebar/minis/6.png" },
            ].map((app, i) => (
              <div
                key={i}
                style={{
                  minWidth: 0,
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  rowGap: "6px",
                }}
              >
                <div style={{ width: "52px", height: "52px", borderRadius: "12px", overflow: "hidden", flexShrink: 0 }}>
                  <img
                    src={app.src}
                    alt=""
                    style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <TUXText
                  typographyPreset="SmallText1-Regular"
                  color="UIText1"
                  textDisplay="truncate"
                  className="w-full text-center"
                >
                  {app.name}
                </TUXText>
              </div>
            ))}
          </div>
        </div>

        {/* Your orders */}
        <div
          style={{
            display: "flex",
            padding: "4px 20px 4px 20px",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "4px",
            borderRadius: "16px",
            background: getColorCSSVar("UISheetGrouped2"),
          }}
        >
          <div className="flex items-center gap-5 py-3 w-full">
            <div className="flex flex-1 items-center gap-2.5 min-w-0">
              <SidebarListLeadingIcon>
                <TUXIconShoppingCartFillLTR
                  size={SIDEBAR_LIST_ICON_SIZE}
                />
              </SidebarListLeadingIcon>
              <TUXText typographyPreset="P1-Semibold" color="UIText1" textDisplay="truncate" className="block flex-1 min-w-0" style={sectionTitleTextStyle}>
                Your orders
              </TUXText>
            </div>
            <SidebarChevron />
          </div>
          <div style={{ width: "100%", display: "flex", flexDirection: "column", rowGap: "16px", paddingBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", columnGap: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "6px", overflow: "hidden", flexShrink: 0 }}>
                <img
                  src="/resource/sidebar/orders/1.png"
                  alt=""
                  style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ minWidth: 0, display: "flex", flexDirection: "column", rowGap: "1px" }}>
                <TUXText typographyPreset="P1-Semibold" color="UIText1">Unpaid</TUXText>
                <TUXText typographyPreset="SmallText1-Regular" color="UIText3">Order dispatch</TUXText>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", columnGap: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "6px", overflow: "hidden", flexShrink: 0 }}>
                <img
                  src="/resource/sidebar/orders/2.png"
                  alt=""
                  style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ minWidth: 0, display: "flex", flexDirection: "column", rowGap: "1px" }}>
                <TUXText typographyPreset="P1-Semibold" color="UIText1">Delivered on Oct 18</TUXText>
                <TUXText typographyPreset="SmallText1-Regular" color="UIText3">Parcel was left in mail room</TUXText>
              </div>
            </div>
          </div>
        </div>

        {/* List items */}
        <div
          style={{
            display: "flex",
            padding: "4px 20px 4px 20px",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "0px",
            borderRadius: "16px",
            background: getColorCSSVar("UISheetGrouped2"),
          }}
        >
          <div style={listCellStyle}>
            <SidebarListLeadingIcon>
              <TUXIconWalletFill size={SIDEBAR_LIST_ICON_SIZE} />
            </SidebarListLeadingIcon>
            <div style={{ ...listCellTitleStyle, marginLeft: "10px" }}>
              <TUXText typographyPreset="P1-Semibold" color="UIText1" textDisplay="truncate" style={listCellTitleTextStyle}>
                Balance
              </TUXText>
            </div>
            <div style={listCellBalanceTrailingStyle}>
              <TUXText typographyPreset="P2-Regular" color="UITextPlaceholder" style={listCellAmountTextStyle}>
                $480.89
              </TUXText>
              <SidebarChevron />
            </div>
          </div>
          <div style={listCellStyle}>
            <SidebarListLeadingIcon>
              <TUXIconClockFill size={SIDEBAR_LIST_ICON_SIZE} />
            </SidebarListLeadingIcon>
            <div style={{ ...listCellTitleStyle, marginLeft: "10px" }}>
              <TUXText typographyPreset="P1-Semibold" color="UIText1" textDisplay="truncate" style={listCellTitleTextStyle}>
                Activity center
              </TUXText>
            </div>
            <div style={listCellTrailingStyle}>
              <SidebarChevron />
            </div>
          </div>
          <div style={listCellStyle}>
            <SidebarListLeadingIcon>
              <TUXIconCloudArrowDownFill size={SIDEBAR_LIST_ICON_SIZE} />
            </SidebarListLeadingIcon>
            <div style={{ ...listCellTitleStyle, marginLeft: "10px" }}>
              <TUXText typographyPreset="P1-Semibold" color="UIText1" textDisplay="truncate" style={listCellTitleTextStyle}>
                Offline videos
              </TUXText>
            </div>
            <div style={listCellTrailingStyle}>
              <SidebarChevron />
            </div>
          </div>
          <div style={listCellStyle}>
            <SidebarListLeadingIcon>
              <TUXIconQRCodeFill size={SIDEBAR_LIST_ICON_SIZE} />
            </SidebarListLeadingIcon>
            <div style={{ ...listCellTitleStyle, marginLeft: "10px" }}>
              <TUXText typographyPreset="P1-Semibold" color="UIText1" textDisplay="truncate" style={listCellTitleTextStyle}>
                Your QR code
              </TUXText>
            </div>
            <div style={listCellTrailingStyle}>
              <SidebarChevron />
            </div>
          </div>
          <div style={listCellStyle}>
            <SidebarListLeadingIcon>
              <TUXIconPersonStarFill size={SIDEBAR_LIST_ICON_SIZE} />
            </SidebarListLeadingIcon>
            <div style={{ ...listCellTitleStyle, marginLeft: "10px" }}>
              <TUXText typographyPreset="P1-Semibold" color="UIText1" textDisplay="truncate" style={listCellTitleTextStyle}>
                TikTok Studio
              </TUXText>
            </div>
            <div style={listCellTrailingStyle}>
              <SidebarChevron />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
