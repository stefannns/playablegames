import { TUXButton, TUXNavBar, TUXNavBarIconAction, TUXText } from "@byted-tiktok/tux-web";
import { TUXIconChevronLeftOffsetLTR, TUXIconPersonFill } from "@byted-tiktok/tux-icons";
import { useState } from "react";

import { useAppFrame } from "../../../../components/sys/app_frame";
import { ffAvatar, type FollowListUser } from "../../find_friends_subpages.config";
import { IconInk } from "./shared";

function ContactRow({ user }: { user: FollowListUser }) {
  const [followed, setFollowed] = useState(false);
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      {user.avatarAuthorId ? (
        <img
          src={ffAvatar(user.avatarAuthorId, 48)}
          alt=""
          width={48}
          height={48}
          className="size-12 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--tux-v2-color-ui-shape-neutral-2)" }}
        >
          <IconInk color="UIShapeText1OnPrimary">
            <TUXIconPersonFill size={26} />
          </IconInk>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <TUXText typographyPreset="Headline-Semibold" color="UIText1" textDisplay="truncate">
          {user.name}
        </TUXText>
        <TUXText typographyPreset="P2-Regular" color="UIText3" textDisplay="truncate">
          {user.handle}
        </TUXText>
      </div>
      {followed ? (
        <TUXButton
          text="Following"
          themePreset="secondary"
          backgroundColor="UIShapeNeutral4"
          textColor="UIText1"
          shapePreset="capsule"
          sizePreset="small"
          width="96px"
          smoothRadius
          onClick={() => setFollowed(false)}
        />
      ) : (
        <TUXButton
          text="Follow"
          themePreset="primary"
          shapePreset="capsule"
          sizePreset="small"
          width="96px"
          smoothRadius
          onClick={() => setFollowed(true)}
        />
      )}
    </div>
  );
}

export function ContactsListPage({
  title,
  users,
  onClose,
}: {
  title: string;
  users: FollowListUser[];
  onClose: () => void;
}) {
  const { topInsetCss } = useAppFrame();
  return (
    <div
      className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-tux-v2-ui-page-flat-1"
      style={{ paddingTop: topInsetCss }}
    >
      <TUXNavBar
        heightPreset={44}
        backgroundColor="UIPageFlat1"
        backgroundOpacity={1}
        showSeparator={false}
        titleAlign="center"
        customTitle={
          <TUXText typographyPreset="H3-Bold" color="UIText1">
            {title}
          </TUXText>
        }
        leading={
          <TUXNavBarIconAction
            aria-label="Back"
            width="40px"
            height="44px"
            icon={
              <IconInk color="UIText1">
                <TUXIconChevronLeftOffsetLTR size={24} />
              </IconInk>
            }
            onClick={onClose}
          />
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto pt-2">
        {users.map((user) => (
          <ContactRow key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
}
