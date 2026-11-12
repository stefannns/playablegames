import type { ColorV2Name } from "@byted-tiktok/tux-color";
import {
  getColorCSSVar,
  TUXAvatarStack,
  TUXButton,
  TUXInput,
  TUXNavBar,
  TUXNavBarIconAction,
  TUXText,
} from "@byted-tiktok/tux-web";
import {
  TUXIconArrowTurnUpRightFill,
  TUXIconChevronLeftOffsetLTR,
  TUXIconChevronRightLTR,
  TUXIconConnectNow,
  TUXIconFacebookCircle,
  TUXIconInfoCircle,
  TUXIconMagnifyingGlass,
  TUXIconPersonPhDFill,
  TUXIconPhoneBookFill,
  TUXIconQRCodeFill,
  TUXIconScan,
  TUXIconXMarkSmall,
} from "@byted-tiktok/tux-icons";
import { AnimatePresence, motion } from "framer-motion";
import { useLayoutEffect, useRef, useState, type ComponentType, type ReactNode } from "react";

import { useAppNavigation } from "../../../context/app_navigation";
import { useAppFrame } from "../../../components/sys/app_frame";
import PagePushStage, { usePagePushStage } from "../../../hooks/page_push";
import {
  appPathForRoute,
  type FindFriendsStep,
} from "../../../routes/app_route_tree";
import { showAppFrameTopToast } from "../../../components/sys/app_frame_top_toast";
import {
  FIND_FRIENDS_SUGGESTED,
  findFriendsAvatarUrl,
  findFriendsPostThumbUrl,
  type FindFriendsSuggestedUser,
} from "../find_friends.config";
import { CONTACTS_LIST, FACEBOOK_LIST } from "../find_friends_subpages.config";
import { isFindFriendsImmersiveSubpage } from "./find_friends/find_friends_subpage.constants";
import { ConnectNowPage } from "./find_friends/connect_now_page";
import { ContactsListPage } from "./find_friends/contacts_list_page";
import { InviteFriendsSheet } from "./find_friends/invite_friends_sheet";
import { MyCollegePage } from "./find_friends/my_college_page";
import { QrCodePage } from "./find_friends/qr_code_page";
import { ScanPage } from "./find_friends/scan_page";
import { SearchPage } from "./find_friends/search_page";
import { IconInk } from "./find_friends/shared";

type FindFriendsPageContentProps = {
  /** Which tab opened Find Friends — drives URL under `/app/friends` or `/app/profile`. */
  tab: "friends" | "profile";
  onClose: (trigger?: HTMLElement | null) => void;
};

type SubPage = FindFriendsStep;

const FIND_FRIENDS_ROOT_KEY = "find-friends-root";

function subPageKey(sub: SubPage) {
  return `find-friends-${sub}`;
}

function subPageFromKey(key: string): SubPage | null {
  if (!key.startsWith("find-friends-")) return null;
  const sub = key.slice("find-friends-".length) as SubPage;
  return sub;
}

/** Same dev-placeholder toast the Friends feed shows when a post cover is tapped. */
function showFindFriendsImageToast() {
  showAppFrameTopToast({
    text: "haoqi：这个要合到消费post页面。",
    duration: 1800,
    displayMode: "replace",
  });
}

type EntryRow = {
  id: string;
  title: string;
  subtitle: string;
  Icon: ComponentType<{ size?: number; color?: string }>;
  /** Semantic color token for the circular icon background (per the iOS cell). */
  circleColor: ColorV2Name;
};

const ENTRY_ROWS: EntryRow[] = [
  { id: "connect-now", title: "Connect Now", subtitle: "Find or be found by friends around you.", Icon: TUXIconConnectNow, circleColor: "SocialRelationConnectNow" },
  { id: "college", title: "My college", subtitle: "Connect with people from your school.", Icon: TUXIconPersonPhDFill, circleColor: "DataCategoriesAssist4" },
  { id: "qr", title: "Use QR code", subtitle: "Show or scan each other’s QR codes.", Icon: TUXIconQRCodeFill, circleColor: "SocialRelationQrCode" },
  { id: "invite", title: "Invite friends", subtitle: "Ask your friends to connect via the link.", Icon: TUXIconArrowTurnUpRightFill, circleColor: "SocialRelationInvite" },
  { id: "contacts", title: "Find contacts", subtitle: "Sync or find contacts on TikTok.", Icon: TUXIconPhoneBookFill, circleColor: "SocialRelationContact" },
  { id: "facebook", title: "Find Facebook friends", subtitle: "Sync or find Facebook friends.", Icon: TUXIconFacebookCircle, circleColor: "SocialRelationFacebook" },
];

/** TUX search field (visual-only — read-only, no input handling). */
function FindFriendsSearchBar({ onOpen }: { onOpen: () => void }) {
  return (
    <div
      className="relative cursor-pointer px-4 pt-2 pb-3"
      onClick={onOpen}
      role="button"
      aria-label="Search"
    >
      <div className="pointer-events-none">
        <TUXInput
          sizePreset="medium"
          width="100%"
          placeholder="Search by name or username"
          readOnly
          tabIndex={-1}
          leadingIcon={
            <IconInk color="UITextPlaceholder">
              <TUXIconMagnifyingGlass size={20} />
            </IconInk>
          }
        />
      </div>
    </div>
  );
}

/** One vertical find-friends entry row: colored circle + title + subtitle + chevron. */
function FindFriendsEntryRow({ row, onSelect }: { row: EntryRow; onSelect: (id: string) => void }) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left outline-none active:opacity-70"
      aria-label={row.title}
      onClick={() => onSelect(row.id)}
    >
      <div
        className="flex size-12 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: getColorCSSVar(row.circleColor),
          color: getColorCSSVar("UIShapeText1OnPrimary"),
        }}
      >
        <row.Icon size={24} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <TUXText typographyPreset="Headline-Semibold" color="UIText1" textDisplay="truncate">
          {row.title}
        </TUXText>
        <TUXText typographyPreset="P2-Regular" color="UIText3" textDisplay="truncate">
          {row.subtitle}
        </TUXText>
      </div>
      <IconInk color="UITextPlaceholder">
        <TUXIconChevronRightLTR size={16} />
      </IconInk>
    </button>
  );
}

function FindFriendsEntryList({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <section className="flex flex-col">
      {ENTRY_ROWS.map((row) => (
        <FindFriendsEntryRow key={row.id} row={row} onSelect={onSelect} />
      ))}
    </section>
  );
}

/** Mutual-friends proof: "Friends with <avatar stack> +N". */
function FindFriendsMutualReason({ user }: { user: FindFriendsSuggestedUser }) {
  const avatars = user.mutualAvatarIds ?? [];
  return (
    <div className="flex min-w-0 items-center gap-1 overflow-hidden">
      <TUXText typographyPreset="P2-Regular" color="UIText3" className="shrink-0 whitespace-nowrap">
        Friends with
      </TUXText>
      <div className="shrink-0">
        <TUXAvatarStack
          size="tiny"
          stackMode="lastOnTop"
          avatars={avatars.map((avatarId) => ({
            src: findFriendsAvatarUrl(avatarId, 24),
            alt: "",
          }))}
        />
      </div>
      {user.mutualExtraCount ? (
        <TUXText typographyPreset="P2-Regular" color="UIText3" className="shrink-0 whitespace-nowrap">
          +{user.mutualExtraCount}
        </TUXText>
      ) : null}
    </div>
  );
}

/** One suggested-account row: header + square cover strip + actions. */
function FindFriendsSuggestedCard({
  user,
  onRemove,
}: {
  user: FindFriendsSuggestedUser;
  onRemove: () => void;
}) {
  const posts = user.postThumbIndices.slice(0, 4);
  const hasMutual = (user.mutualAvatarIds?.length ?? 0) > 0;
  const [followed, setFollowed] = useState(false);
  return (
    <div className="px-4">
      <div
        className="flex flex-col gap-3 py-[18px]"
        style={{ borderBottom: `0.5px solid ${getColorCSSVar("UIShapeNeutral4")}` }}
      >
      <div className="flex items-center gap-3">
        <img
          src={findFriendsAvatarUrl(user.avatarAuthorId, 64)}
          alt=""
          width={64}
          height={64}
          className="size-16 shrink-0 rounded-full object-cover"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-1">
            <TUXText typographyPreset="Headline-Semibold" color="UIText1" textDisplay="truncate">
              {user.name}
            </TUXText>
            {user.verified ? (
              <span
                aria-label="Verified"
                className="flex size-4 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: getColorCSSVar("UIShapePrimary") }}
              >
                <TUXText typographyPreset="SmallText2-Semibold" color="UIShapeText1OnPrimary">
                  ✓
                </TUXText>
              </span>
            ) : null}
          </div>
          <TUXText typographyPreset="P2-Regular" color="UIText1" textDisplay="truncate">
            {user.username}
          </TUXText>
          {hasMutual ? (
            <FindFriendsMutualReason user={user} />
          ) : (
            <TUXText typographyPreset="P2-Regular" color="UIText3" textDisplay="truncate">
              {user.reason}
            </TUXText>
          )}
        </div>
        <div className="flex w-[120px] shrink-0 items-center justify-end gap-2">
          {followed ? (
            <TUXButton
              text="Following"
              themePreset="secondary"
              backgroundColor="UIShapeNeutral4"
              textColor="UIText1"
              shapePreset="capsule"
              sizePreset="small"
              smoothRadius
              block
              onClick={() => setFollowed(false)}
            />
          ) : (
            <>
              <TUXButton
                text={user.followLabel}
                themePreset="primary"
                shapePreset="capsule"
                sizePreset="small"
                width="88px"
                smoothRadius
                onClick={() => setFollowed(true)}
              />
              <button
                type="button"
                className="flex size-6 shrink-0 items-center justify-center outline-none active:opacity-70"
                style={{ color: getColorCSSVar("UITextPlaceholder") }}
                aria-label={`Remove suggestion ${user.name}`}
                onClick={onRemove}
              >
                <TUXIconXMarkSmall size={20} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-px overflow-hidden rounded-[10px]">
        {posts.map((thumbIndex, index) => (
          <button
            type="button"
            key={`${user.id}-post-${index}`}
            className="relative flex-1 outline-none active:opacity-90"
            onClick={showFindFriendsImageToast}
            aria-label="Open post"
          >
            <img
              src={findFriendsPostThumbUrl(thumbIndex)}
              alt=""
              className="aspect-square w-full object-cover"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ boxShadow: `inset 0 0 0 0.5px ${getColorCSSVar("UIShapeNeutral4")}` }}
            />
          </button>
        ))}
      </div>
      </div>
    </div>
  );
}

function FindFriendsSuggestedList() {
  const [removedIds, setRemovedIds] = useState(() => new Set<string>());
  const visibleUsers = FIND_FRIENDS_SUGGESTED.filter((user) => !removedIds.has(user.id));
  const removeUser = (id: string) =>
    setRemovedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

  return (
    <section className="flex flex-col">
      <div className="flex items-center gap-1 px-4 pt-5 pb-0.5">
        <TUXText typographyPreset="H4-Bold" color="UIText1">
          Suggested accounts
        </TUXText>
        <IconInk color="UIText3">
          <TUXIconInfoCircle size={12} />
        </IconInk>
      </div>
      <AnimatePresence initial={false}>
        {visibleUsers.map((user) => (
          <motion.div
            key={user.id}
            initial={false}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            style={{ overflow: "hidden" }}
          >
            <FindFriendsSuggestedCard user={user} onRemove={() => removeUser(user.id)} />
          </motion.div>
        ))}
      </AnimatePresence>
    </section>
  );
}

function renderSubPage(
  subPage: SubPage,
  close: (trigger?: HTMLElement | null) => void,
  go: (sub: SubPage, trigger?: HTMLElement | null) => void,
) {
  switch (subPage) {
    case "connect-now":
      return <ConnectNowPage onClose={close} />;
    case "my-college":
      return <MyCollegePage onClose={close} />;
    case "qr":
      return <QrCodePage onClose={close} onOpenScan={() => go("scan")} />;
    case "contacts":
      return <ContactsListPage title="Contacts" users={CONTACTS_LIST} onClose={close} />;
    case "facebook":
      return (
        <ContactsListPage title="Facebook friends" users={FACEBOOK_LIST} onClose={close} />
      );
    case "scan":
      return <ScanPage onClose={close} />;
    case "search":
      return <SearchPage onClose={close} />;
    default:
      return null;
  }
}

type FindFriendsRootPageProps = {
  topInsetCss: string;
  onClose: (trigger?: HTMLElement | null) => void;
  onOpenScan: (trigger?: HTMLElement | null) => void;
  onOpenSearch: () => void;
  onEntrySelect: (id: string) => void;
};

function FindFriendsRootPage({
  topInsetCss,
  onClose,
  onOpenScan,
  onOpenSearch,
  onEntrySelect,
}: FindFriendsRootPageProps) {
  return (
    <div
      className="relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-tux-v2-ui-page-flat-1"
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
            Find friends
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
            onClick={(event) => onClose(event.currentTarget)}
          />
        }
        trailing={
          <TUXNavBarIconAction
            aria-label="Scan QR code to add friend"
            width="40px"
            height="44px"
            icon={
              <IconInk color="UIText1">
                <TUXIconScan size={24} />
              </IconInk>
            }
            onClick={(event) => onOpenScan(event.currentTarget)}
          />
        }
      />

      <div className="friends-feed-scroll min-h-0 flex-1 touch-pan-y overflow-x-hidden overflow-y-auto">
        <FindFriendsSearchBar onOpen={onOpenSearch} />
        <FindFriendsEntryList onSelect={onEntrySelect} />
        <FindFriendsSuggestedList />
      </div>
    </div>
  );
}

/**
 * Find Friends page — pushed onto Friends / Profile stacks from the nav-bar
 * `person_plus` action. Entry rows / scan / search use nested PagePush; Invite
 * friends stays a bottom sheet.
 */
export function FindFriendsPageContent({ tab, onClose }: FindFriendsPageContentProps) {
  const { topInsetCss } = useAppFrame();
  const { route, navigate } = useAppNavigation();
  const [inviteOpen, setInviteOpen] = useState(false);
  const stackDrivenNavRef = useRef(false);

  function markStackNavigation() {
    stackDrivenNavRef.current = true;
  }

  function findFriendsRoutePath(step?: FindFriendsStep) {
    return appPathForRoute({ tab, sub: { screen: "find-friends", step } });
  }

  function buildPageForKey(key: string): ReactNode {
    if (key === FIND_FRIENDS_ROOT_KEY) {
      return buildRootPage();
    }
    const sub = subPageFromKey(key);
    if (!sub) {
      return buildRootPage();
    }
    return renderSubPage(sub, handleCloseSubPage, handleOpenSubPage);
  }

  function buildRootPage() {
    const handleEntrySelect = (id: string) => {
      if (id === "connect-now") handleOpenSubPage("connect-now");
      else if (id === "college") handleOpenSubPage("my-college");
      else if (id === "qr") handleOpenSubPage("qr");
      else if (id === "invite") {
        setInviteOpen(true);
        showAppFrameTopToast({
          text: "Link copied",
          duration: 1800,
          displayMode: "replace",
        });
      } else if (id === "contacts") handleOpenSubPage("contacts");
      else if (id === "facebook") handleOpenSubPage("facebook");
    };

    return (
      <FindFriendsRootPage
        topInsetCss={topInsetCss}
        onClose={onClose}
        onOpenScan={(trigger) => handleOpenSubPage("scan", trigger)}
        onOpenSearch={() => handleOpenSubPage("search")}
        onEntrySelect={handleEntrySelect}
      />
    );
  }

  const pageStage = usePagePushStage({
    initialPage: buildRootPage(),
    initialKey: FIND_FRIENDS_ROOT_KEY,
    durationMs: 300,
    pageOffset: "24%",
  });
  const { pages, push, pop, isTransitioning } = pageStage;

  // Stack items snapshot React nodes at push time; handlers must read the live
  // stack via ref instead of a stale `pages` closure from that render.
  const pagesRef = useRef(pages);
  pagesRef.current = pages;

  function handleOpenSubPage(sub: SubPage, trigger?: HTMLElement | null) {
    const topKey = pagesRef.current.at(-1)?.key ?? FIND_FRIENDS_ROOT_KEY;
    markStackNavigation();
    navigate(findFriendsRoutePath(sub));
    push({
      trigger,
      outgoingKey: topKey,
      outgoingPage: buildPageForKey(topKey),
      incomingKey: subPageKey(sub),
      incomingPage: buildPageForKey(subPageKey(sub)),
    });
  }

  function handleCloseSubPage(trigger?: HTMLElement | null) {
    const stack = pagesRef.current;
    const topKey = stack.at(-1)?.key;
    if (!topKey || topKey === FIND_FRIENDS_ROOT_KEY) {
      return;
    }
    const parentKey = stack.at(-2)?.key ?? FIND_FRIENDS_ROOT_KEY;
    const parentStep =
      parentKey === FIND_FRIENDS_ROOT_KEY ? undefined : subPageFromKey(parentKey) ?? undefined;
    markStackNavigation();
    navigate(findFriendsRoutePath(parentStep));
    pop({
      trigger,
      incomingPage: buildPageForKey(parentKey),
      outgoingPage: buildPageForKey(topKey),
    });
  }

  useLayoutEffect(() => {
    if (!route) return;
    if (route.tab !== tab) return;
    if (route.sub.screen !== "find-friends") return;
    if (stackDrivenNavRef.current) {
      stackDrivenNavRef.current = false;
      return;
    }
    if (isTransitioning) return;

    const targetStep = route.sub.step ?? null;
    const topKey = pagesRef.current.at(-1)?.key ?? FIND_FRIENDS_ROOT_KEY;
    const currentSub = subPageFromKey(topKey);

    if (targetStep === null) {
      if (topKey === FIND_FRIENDS_ROOT_KEY) return;
      handleCloseSubPage();
      return;
    }

    if (currentSub === targetStep) return;

    if (topKey === FIND_FRIENDS_ROOT_KEY) {
      const outgoingKey = topKey;
      push({
        outgoingKey,
        outgoingPage: buildPageForKey(outgoingKey),
        incomingKey: subPageKey(targetStep),
        incomingPage: buildPageForKey(subPageKey(targetStep)),
      });
      return;
    }

    if (currentSub) {
      const parentKey = FIND_FRIENDS_ROOT_KEY;
      pop({
        incomingPage: buildPageForKey(parentKey),
        outgoingPage: buildPageForKey(topKey),
      });
      push({
        outgoingKey: parentKey,
        outgoingPage: buildPageForKey(parentKey),
        incomingKey: subPageKey(targetStep),
        incomingPage: buildPageForKey(subPageKey(targetStep)),
      });
    }
    // build*Page helpers omitted — new function identity each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, tab, pages.at(-1)?.key, isTransitioning, push, pop]);

  const topSub = subPageFromKey(pages.at(-1)?.key ?? "");
  const immersiveBackdrop = isFindFriendsImmersiveSubpage(topSub);

  return (
    <div
      className={[
        "relative h-full",
        immersiveBackdrop
          ? "bg-tux-v2-brand-tiktok-black"
          : "bg-tux-v2-ui-page-flat-1",
      ].join(" ")}
    >
      <PagePushStage manager={pageStage} />
      <InviteFriendsSheet open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}
