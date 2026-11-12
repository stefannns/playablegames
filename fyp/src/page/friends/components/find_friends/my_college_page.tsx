import {
  getColorCSSVar,
  TUXButton,
  TUXNavBar,
  TUXNavBarIconAction,
  TUXText,
} from "@byted-tiktok/tux-web";
import {
  TUXIconChevronLeftOffsetLTR,
  TUXIconChevronRightLTR,
  TUXIconCirclePlus,
  TUXIconLike,
  TUXIconMagnifyingGlass,
  TUXIconTwoSamePerson,
} from "@byted-tiktok/tux-icons";
import { useState } from "react";

import { useAppFrame } from "../../../../components/sys/app_frame";
import { showAppFrameTopToast } from "../../../../components/sys/app_frame_top_toast";
import { useTheme } from "../../../../context/theme";
import {
  COLLEGE_MEMBER_FILTERS,
  COLLEGE_MEMBERS,
  COLLEGE_MY_GROUPS,
  COLLEGE_OTHER_GROUPS,
  COLLEGE_POSTS,
  ffAvatar,
  ffThumb,
  type CollegeGroup,
  type CollegeMember,
} from "../../find_friends_subpages.config";
import { IconInk } from "./shared";

type CollegeTab = "posts" | "members" | "groups";

const TABS: { key: CollegeTab; label: string }[] = [
  { key: "posts", label: "Posts" },
  { key: "members", label: "Members (416)" },
  { key: "groups", label: "Groups (6)" },
];

/** Vertical alpha mask — opaque top 40%, feather out (iOS campus header). */
const CAMPUS_HEADER_MASK =
  "linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0.90) 50%, rgba(0,0,0,0.82) 55%, rgba(0,0,0,0.71) 60%, rgba(0,0,0,0.57) 68%, rgba(0,0,0,0.48) 72%, rgba(0,0,0,0.38) 78%, rgba(0,0,0,0.27) 84%, rgba(0,0,0,0.14) 92%, rgba(0,0,0,0) 100%)";

/**
 * Horizontal color band under the mask — light stops from
 * RefactoredCampusContainerViewController; dark keeps the same hue progression
 * on a near-UIPageFlat1 base.
 */
const CAMPUS_HEADER_BAND = {
  light:
    "linear-gradient(to right, #ebf3ff 0%, #edf0fc 25%, #fdeaf3 45%, #feefe6 61%, #fef4e2 69%, #ffeed8 90%, #ffe9d7 100%)",
  dark:
    "linear-gradient(to right, #1a2433 0%, #1c1f2e 25%, #2b1f28 45%, #2c221e 61%, #2d251c 69%, #2e2419 90%, #2f2318 100%)",
} as const;

/* --------------------------------- Posts tab --------------------------------- */

/** One Explore/search-style card: cover → caption → author + like row (per AWEFeedSearchVideoCollectionViewCell). */
function CollegePostCard({ post }: { post: (typeof COLLEGE_POSTS)[number] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        className="block w-full outline-none active:opacity-90"
        onClick={() =>
          showAppFrameTopToast({
            text: "haoqi：这个要合到消费post页面。",
            duration: 1800,
            displayMode: "replace",
          })
        }
        aria-label="Open post"
      >
        <img
          src={ffThumb(post.thumbIndex)}
          alt=""
          className={`w-full rounded-[10px] object-cover ${post.tall ? "aspect-[3/4]" : "aspect-square"}`}
        />
      </button>
      <TUXText typographyPreset="H4-Regular" color="UIText1" className="line-clamp-2">
        {post.caption}
      </TUXText>
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex min-w-0 items-center gap-1">
          <img
            src={ffAvatar(post.authorId, 20)}
            alt=""
            className="size-5 shrink-0 rounded-full object-cover"
            style={{ boxShadow: "0 0 0 0.5px var(--tux-v2-color-ui-shape-neutral-3)" }}
          />
          <TUXText typographyPreset="P2-Regular" color="UIText3" textDisplay="truncate">
            {post.authorName}
          </TUXText>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <IconInk color="UIText3">
            <TUXIconLike size={14} />
          </IconInk>
          <TUXText typographyPreset="P2-Regular" color="UIText3">
            {post.likes}
          </TUXText>
        </div>
      </div>
    </div>
  );
}

function CollegePostsTab() {
  const columns: (typeof COLLEGE_POSTS)[number][][] = [[], []];
  COLLEGE_POSTS.forEach((post, i) => columns[i % 2].push(post));
  return (
    <div className="flex gap-2 px-2 pt-2">
      {columns.map((column, i) => (
        <div key={i} className="flex flex-1 flex-col gap-2">
          {column.map((post) => (
            <CollegePostCard key={post.id} post={post} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* -------------------------------- Members tab -------------------------------- */

function MemberAvatar({ member }: { member: CollegeMember }) {
  if (!member.hasRing) {
    return (
      <img
        src={ffAvatar(member.avatarAuthorId, 72)}
        alt=""
        className="size-[72px] shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div
      className="shrink-0 rounded-full p-[2px]"
      style={{ background: "linear-gradient(135deg, #0094FF 0%, #20D5EC 50%, #00FFA3 100%)" }}
    >
      <div className="rounded-full p-[2px]" style={{ backgroundColor: getColorCSSVar("UIPageFlat1") }}>
        <img
          src={ffAvatar(member.avatarAuthorId, 72)}
          alt=""
          className="size-[72px] rounded-full object-cover"
        />
      </div>
    </div>
  );
}

function MemberFollowButton() {
  const [followed, setFollowed] = useState(false);
  return followed ? (
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
  );
}

function CollegeMembersTab() {
  return (
    <div className="flex flex-col">
      <div className="flex gap-2 px-4 py-3">
        {COLLEGE_MEMBER_FILTERS.map((filter, i) => (
          <button
            key={filter}
            type="button"
            className="flex items-center gap-1 rounded-full px-3.5 py-2 outline-none active:opacity-70"
            style={{ backgroundColor: getColorCSSVar("UIShapeNeutral4") }}
          >
            <TUXText typographyPreset="P1-Semibold" color="UIText2">
              {filter}
            </TUXText>
            {i === 0 ? (
              <IconInk color="UIText2" className="inline-flex rotate-90">
                <TUXIconChevronRightLTR size={12} />
              </IconInk>
            ) : null}
          </button>
        ))}
      </div>
      {COLLEGE_MEMBERS.map((member) => (
        <div key={member.id} className="flex flex-col gap-3 px-4 pb-4 pt-2">
          <div className="flex items-center gap-3">
            <MemberAvatar member={member} />
            <div className="flex min-w-0 flex-1 flex-col">
              <TUXText typographyPreset="Headline-Semibold" color="UIText1" textDisplay="truncate">
                {member.name}
              </TUXText>
              <TUXText typographyPreset="P2-Regular" color="UIText3">
                {member.relation}
              </TUXText>
              {member.gradYear ? (
                <TUXText typographyPreset="P2-Regular" color="UIText3">
                  {member.gradYear}
                </TUXText>
              ) : null}
            </div>
            <MemberFollowButton />
          </div>
          <div className="flex gap-px overflow-hidden rounded-(--tux-v2-radius-content-large,8px)">
            {member.postThumbIndices.slice(0, 4).map((thumbIndex, i) => (
              <div key={i} className="flex-1">
                <img
                  src={ffThumb(thumbIndex)}
                  alt=""
                  className="aspect-square w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* --------------------------------- Groups tab -------------------------------- */

/** Group-chat avatar — composite of member avatars in the TikTok 1/2/3/4 layouts (rounded square). */
function GroupCover({ covers }: { covers: string[] }) {
  const list = covers.slice(0, 4);
  const box = "size-[72px] shrink-0 overflow-hidden rounded-full";

  if (list.length === 0) {
    return <div className={box} style={{ backgroundColor: getColorCSSVar("UIShapeNeutral2") }} />;
  }
  if (list.length === 1) {
    return <img src={ffAvatar(list[0], 56)} alt="" className={`${box} object-cover`} />;
  }
  if (list.length === 2) {
    return (
      <div className={`${box} flex gap-px`} style={{ backgroundColor: getColorCSSVar("UIPageFlat1") }}>
        {list.map((a, i) => (
          <img key={i} src={ffAvatar(a, 28)} alt="" className="h-full w-1/2 object-cover" />
        ))}
      </div>
    );
  }
  if (list.length === 3) {
    return (
      <div className={`${box} flex gap-px`} style={{ backgroundColor: getColorCSSVar("UIPageFlat1") }}>
        <img src={ffAvatar(list[0], 28)} alt="" className="h-full w-1/2 object-cover" />
        <div className="flex w-1/2 flex-col gap-px">
          <img src={ffAvatar(list[1], 28)} alt="" className="h-1/2 w-full object-cover" />
          <img src={ffAvatar(list[2], 28)} alt="" className="h-1/2 w-full object-cover" />
        </div>
      </div>
    );
  }
  return (
    <div
      className={`grid ${box} grid-cols-2 gap-px`}
      style={{ backgroundColor: getColorCSSVar("UIPageFlat1") }}
    >
      {list.map((a, i) => (
        <img key={i} src={ffAvatar(a, 28)} alt="" className="size-full object-cover" />
      ))}
    </div>
  );
}

function GroupRow({
  group,
  action,
  first = false,
}: {
  group: CollegeGroup;
  action: "view" | "join";
  first?: boolean;
}) {
  return (
    <div className="px-4">
      <div
        className={`flex items-center gap-3 border-b-[0.5px] border-solid py-[18px]${
          first ? " -mt-1" : ""
        }`}
        style={{ borderBottomColor: getColorCSSVar("UIShapeNeutral4") }}
      >
        <GroupCover covers={group.coverAuthorIds} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <TUXText typographyPreset="H4-Semibold" color="UIText1" textDisplay="truncate">
            {group.name}
          </TUXText>
          <div className="flex items-center gap-[3px]">
            <IconInk color="UIText3">
              <TUXIconTwoSamePerson size={14} />
            </IconInk>
            <TUXText typographyPreset="P2-Regular" color="UIText3">
              {group.members} members
            </TUXText>
          </div>
          <TUXText typographyPreset="P2-Regular" color="UIText3" textDisplay="truncate">
            {group.desc}
          </TUXText>
        </div>
        {action === "view" ? (
          <TUXButton
            text="View"
            themePreset="secondary"
            backgroundColor="UIShapeNeutral4"
            textColor="UIText1"
            shapePreset="capsule"
            sizePreset="small"
            width="84px"
            smoothRadius
          />
        ) : (
          <TUXButton
            text="Join"
            themePreset="primary"
            shapePreset="capsule"
            sizePreset="small"
            width="84px"
            smoothRadius
          />
        )}
      </div>
    </div>
  );
}

function CollegeGroupsTab() {
  return (
    <div className="flex flex-col pb-6">
      <div className="px-4 pb-1 pt-4">
        <TUXText typographyPreset="P1-Semibold" color="UIText3">
          My groups
        </TUXText>
      </div>
      {COLLEGE_MY_GROUPS.map((group, i) => (
        <GroupRow key={group.id} group={group} action="view" first={i === 0} />
      ))}
      <div className="px-4 pb-1 pt-4">
        <TUXText typographyPreset="P1-Semibold" color="UIText3">
          Other groups
        </TUXText>
      </div>
      {COLLEGE_OTHER_GROUPS.map((group, i) => (
        <GroupRow key={group.id} group={group} action="join" first={i === 0} />
      ))}
    </div>
  );
}

/* ----------------------------------- Page ----------------------------------- */

export function MyCollegePage({ onClose }: { onClose: () => void }) {
  const { topInsetCss } = useAppFrame();
  const { resolvedTheme } = useTheme();
  const [tab, setTab] = useState<CollegeTab>("posts");

  return (
    <div
      className="relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-tux-v2-ui-page-flat-1"
      style={{ paddingTop: topInsetCss }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0"
        style={{
          height: `calc(${topInsetCss} + 150px)`,
          background: CAMPUS_HEADER_BAND[resolvedTheme],
          WebkitMaskImage: CAMPUS_HEADER_MASK,
          maskImage: CAMPUS_HEADER_MASK,
        }}
      />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
      <TUXNavBar
        heightPreset={44}
        backgroundColor="UIPageFlat1"
        backgroundOpacity={0}
        showSeparator={false}
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
        trailing={
          <div className="flex items-center">
            <TUXNavBarIconAction
              aria-label="Search"
              width="40px"
              height="44px"
              icon={
                <IconInk color="UIText1">
                  <TUXIconMagnifyingGlass size={24} />
                </IconInk>
              }
            />
            <TUXNavBarIconAction
              aria-label="Create"
              width="40px"
              height="44px"
              icon={
                <IconInk color="UIText1">
                  <TUXIconCirclePlus size={24} />
                </IconInk>
              }
            />
          </div>
        }
      />

      <div style={{ padding: "20px" }}>
        <TUXText
          typographyPreset="LargeTitle-Bold"
          color="UIText1"
          style={{ fontSize: "28px", fontWeight: 900, lineHeight: "1.18" }}
        >
          University of Southern California
        </TUXText>
      </div>

      {/* Campus tab bar: hug-content items (underline = text width), stack (left), indicator 2px UIText1 */}
      <div className="flex gap-6 px-5">
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              type="button"
              className="relative flex items-center pb-2.5 pt-1.5 outline-none"
              onClick={() => setTab(t.key)}
            >
              <TUXText
                typographyPreset={active ? "H4-Bold" : "H4-Semibold"}
                color={active ? "UIText1" : "UIText3"}
              >
                {t.label}
              </TUXText>
              {active ? (
                <div
                  className="absolute inset-x-0 bottom-0 h-[2px] rounded-full"
                  style={{ backgroundColor: getColorCSSVar("UIText1") }}
                />
              ) : null}
            </button>
          );
        })}
      </div>
      <div style={{ height: "0.5px", backgroundColor: getColorCSSVar("UIShapeNeutral3") }} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "posts" ? <CollegePostsTab /> : null}
        {tab === "members" ? <CollegeMembersTab /> : null}
        {tab === "groups" ? <CollegeGroupsTab /> : null}
      </div>
      </div>
    </div>
  );
}
