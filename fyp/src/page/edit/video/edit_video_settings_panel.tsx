import {
  IconQuestionMarkCircleLTR,
  TUXIconChevronRightSlimThinLTR,
  TUXIconXMark,
} from "@byted-tiktok/tux-icons";
import {
  getColorCSSVar,
  TUXListCell,
  TUXListHeader,
  TUXListView,
  TUXNavBar,
  TUXNavBarIconAction,
  TUXRadio,
  TUXSheet,
  TUXSwitch,
  TUXText,
} from "@byted-tiktok/tux-web";
import { useState, type ReactNode } from "react";

import { getAppFrameRootElement } from "../../../components/sys/app_frame_top_toast";
import {
  postPermissionSheetChromeProps,
  postPermissionSheetSurfaceStyle,
} from "../../profile/components/post_permission/post_permission_sheet_chrome";

type EditVideoSettingsPanelProps = {
  visible: boolean;
  onClose: () => void;
};

function SettingsListSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <TUXListView grouped header={<TUXListHeader title={title} sizePreset="small" />}>
      {children}
    </TUXListView>
  );
}

function SettingsChevronTrailing() {
  return (
    <span className="flex shrink-0 items-center" style={{ color: getColorCSSVar("UIShapeNeutral2") }}>
      <TUXIconChevronRightSlimThinLTR size={16} />
    </span>
  );
}

export function EditVideoSettingsPanel({ visible, onClose }: EditVideoSettingsPanelProps) {
  const [privacy, setPrivacy] = useState<"everyone" | "friends" | "only-you">("everyone");
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [reuseEnabled, setReuseEnabled] = useState(true);
  const [aiGeneratedEnabled, setAiGeneratedEnabled] = useState(false);
  const [audienceControlsEnabled, setAudienceControlsEnabled] = useState(false);

  return (
    <TUXSheet
      visible={visible}
      onVisibleChange={(next: boolean) => {
        if (!next) onClose();
      }}
      {...postPermissionSheetChromeProps({
        root: getAppFrameRootElement(),
        heightModePreset: "fixed",
        height: "586px",
        draggable: false,
      })}
    >
      <div
        className="flex h-full min-h-0 flex-col"
        style={{
          ...postPermissionSheetSurfaceStyle,
          backgroundColor: getColorCSSVar("UIPageGrouped1"),
        }}
      >
        <TUXNavBar
          heightPreset={52}
          showSeparator={false}
          backgroundOpacity={0}
          title="Settings"
          trailing={
            <TUXNavBarIconAction
              aria-label="Close settings"
              width="52px"
              height="52px"
              onClick={onClose}
              icon={
                <TUXIconXMark
                  size={22}
                  color="var(--tux-v2-color-ui-text-1)"
                />
              }
            />
          }
        />

        <div
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto pb-6 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="flex flex-col gap-2">
            <SettingsListSection title="Who can view this post">
              <TUXListCell
                title="Everyone"
                onClick={() => setPrivacy("everyone")}
                trailing={
                  <TUXRadio
                    name="post-privacy"
                    value="everyone"
                    checked={privacy === "everyone"}
                    onChange={() => setPrivacy("everyone")}
                    sizePreset="large"
                  />
                }
              />
              <TUXListCell
                title="Friends"
                description="Followers that you follow back · 0 friends"
                onClick={() => setPrivacy("friends")}
                trailing={
                  <TUXRadio
                    name="post-privacy"
                    value="friends"
                    checked={privacy === "friends"}
                    onChange={() => setPrivacy("friends")}
                    sizePreset="large"
                  />
                }
              />
              <TUXListCell
                title="Only you"
                onClick={() => setPrivacy("only-you")}
                trailing={
                  <TUXRadio
                    name="post-privacy"
                    value="only-you"
                    checked={privacy === "only-you"}
                    onChange={() => setPrivacy("only-you")}
                    sizePreset="large"
                  />
                }
              />
            </SettingsListSection>

            <SettingsListSection title="Video privacy">
              <TUXListCell
                title="Allow comments and one-liners"
                trailing={
                  <TUXSwitch
                    name="settings-comments"
                    value="settings-comments"
                    checked={commentsEnabled}
                    onChange={(_event: unknown, nextChecked: boolean) =>
                      setCommentsEnabled(nextChecked)
                    }
                    sizePreset="large"
                  />
                }
              />
              <TUXListCell
                title="Allow reuse of content"
                description="Duet, Stitch, stickers, and add to story"
                trailing={
                  <TUXSwitch
                    name="settings-reuse"
                    value="settings-reuse"
                    checked={reuseEnabled}
                    onChange={(_event: unknown, nextChecked: boolean) =>
                      setReuseEnabled(nextChecked)
                    }
                    sizePreset="large"
                  />
                }
              />
            </SettingsListSection>

            <SettingsListSection title="Advanced settings">
              <TUXListCell
                title="Content disclosure"
                description="Posts without proper disclosure may be restricted or removed"
                trailing={<SettingsChevronTrailing />}
              />
              <TUXListCell
                title={
                  <TUXText typographyPreset="H4-Semibold" color="UIText1">
                    AI-generated content
                  </TUXText>
                }
                description={
                  <>
                    Add this label to tell viewers your content was generated or edited with AI.{" "}
                    <TUXText as="span" typographyPreset="P3-Semibold" color="UIText1">
                      Learn more
                    </TUXText>
                  </>
                }
                trailing={
                  <TUXSwitch
                    name="settings-ai-generated"
                    value="settings-ai-generated"
                    checked={aiGeneratedEnabled}
                    onChange={(_event: unknown, nextChecked: boolean) =>
                      setAiGeneratedEnabled(nextChecked)
                    }
                    sizePreset="large"
                  />
                }
              />
              <TUXListCell
                title={
                  <span className="inline-flex min-w-0 items-center gap-0.5">
                    <TUXText typographyPreset="H4-Semibold" color="UIText1">
                      Audience controls
                    </TUXText>
                    <span
                      className="flex size-[17px] shrink-0 items-center justify-center"
                      style={{ color: getColorCSSVar("UIText3") }}
                      aria-hidden
                    >
                      <IconQuestionMarkCircleLTR width={13} height={13} />
                    </span>
                  </span>
                }
                description="This video is limited to those aged 18 years and older."
                trailing={
                  <TUXSwitch
                    name="settings-audience-controls"
                    value="settings-audience-controls"
                    checked={audienceControlsEnabled}
                    onChange={(_event: unknown, nextChecked: boolean) =>
                      setAudienceControlsEnabled(nextChecked)
                    }
                    sizePreset="large"
                  />
                }
              />
            </SettingsListSection>
          </div>
        </div>
      </div>
    </TUXSheet>
  );
}
