import { TUXText, TUXTopToast } from "@byted-tiktok/tux-web";
import {
  TUXIconChevronLeftLTR,
  TUXIconPerson,
  TUXIconPersonArrowLeftRight,
  TUXIconTickCircleFill,
  type TuxIcon,
} from "@byted-tiktok/tux-icons";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import {
  getMessagingSuite,
  setMessagingSuite,
  useMessagingSuite,
  type MessagingSuite,
} from "../inbox_messaging_suite_store";

type SuiteCardData = {
  id: MessagingSuite;
  title: string;
  Icon: TuxIcon;
  bullets: string[];
};

const SUITE_CARDS: SuiteCardData[] = [
  {
    id: "personal",
    title: "Personal · Chat with friends",
    Icon: TUXIconPerson,
    bullets: ["Basic messaging tools", "Receive all notifications"],
  },
  {
    id: "professional",
    title: "Professional · Engage followers",
    Icon: TUXIconPersonArrowLeftRight,
    bullets: [
      "Organize chat using tabs and labels",
      "Reply faster with advanced messaging tools",
      "Receive focused push notifications",
    ],
  },
];

const TOAST_DURATION_MS = 2200;

function SuiteRadio({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2"
      style={{
        borderColor: selected
          ? "var(--tux-v2-color-ui-shape-primary)"
          : "var(--tux-v2-color-ui-shape-neutral-3)",
        backgroundColor: selected
          ? "var(--tux-v2-color-ui-shape-primary)"
          : "transparent",
      }}
    >
      {selected ? (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: "var(--tux-v2-color-ui-image-overlay-white)" }}
        />
      ) : null}
    </span>
  );
}

function SuiteCard({
  data,
  selected,
  onClick,
}: {
  data: SuiteCardData;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="flex w-full items-start gap-2 rounded-[12px] bg-tux-v2-ui-sheet-flat-1 p-4 text-left"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <data.Icon size={20} color="var(--tux-v2-color-ui-text-1)" />
          <TUXText
            as="span"
            font="TikTokFont"
            typographyPreset="H4-Semibold"
            color="UIText1"
          >
            {data.title}
          </TUXText>
        </div>
        <ul className="ml-7 flex flex-col gap-0.5">
          {data.bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-1.5">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-tux-v2-ui-text-3" />
              <TUXText
                as="span"
                font="TikTokFont"
                typographyPreset="P1-Regular"
                color="UIText3"
              >
                {bullet}
              </TUXText>
            </li>
          ))}
        </ul>
      </div>
      <SuiteRadio selected={selected} />
    </button>
  );
}

export type MessagingSuitePageContentProps = {
  onBack: (trigger?: HTMLElement | null) => void;
};

/** Inbox & Messaging suite picker — intended for Profile PagePush stack. */
export function MessagingSuitePageContent({ onBack }: MessagingSuitePageContentProps) {
  const currentSuite = useMessagingSuite();
  const [selectedId, setSelectedId] = useState<MessagingSuite>(currentSuite);
  const [hasJustSwitched, setHasJustSwitched] = useState(false);
  const [toastRoot, setToastRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setToastRoot(
      document.querySelector<HTMLElement>('[data-app-frame-root="true"]'),
    );
  }, []);

  useEffect(() => {
    setSelectedId(getMessagingSuite());
    setHasJustSwitched(false);
  }, []);

  const hasPendingChange = selectedId !== currentSuite;
  const title = hasJustSwitched
    ? "Switch messaging suite"
    : "Select a messaging suite";

  const handleSwitchNow = () => {
    setMessagingSuite(selectedId);
    setHasJustSwitched(true);
    TUXTopToast.show({
      text: "Messaging suite switched",
      leading: <TUXIconTickCircleFill size={16} />,
      duration: TOAST_DURATION_MS,
      root: toastRoot,
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-tux-v2-ui-page-grouped-1">
      <div className="flex h-11 shrink-0 items-center px-1">
        <button
          type="button"
          aria-label="Back"
          onClick={(event) => onBack(event.currentTarget)}
          className="flex h-11 w-11 items-center justify-center text-tux-v2-ui-text-1"
        >
          <TUXIconChevronLeftLTR size={24} />
        </button>
      </div>

      <div className="px-4 pb-4 pt-2">
        <TUXText
          as="h1"
          font="TikTokFont"
          typographyPreset="LargeTitle-Bold"
          color="UIText1"
        >
          {title}
        </TUXText>
      </div>

      <div className="flex flex-col gap-3 px-4">
        {SUITE_CARDS.map((card) => (
          <SuiteCard
            key={card.id}
            data={card}
            selected={selectedId === card.id}
            onClick={() => setSelectedId(card.id)}
          />
        ))}
      </div>

      <div className="flex-1" />

      <AnimatePresence>
        {hasPendingChange ? (
          <motion.div
            key="switch-now-bar"
            className="px-4 pb-8 pt-3"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
          >
            <button
              type="button"
              onClick={handleSwitchNow}
              className="flex h-12 w-full items-center justify-center rounded-full bg-tux-v2-ui-shape-primary"
            >
              <TUXText
                as="span"
                font="TikTokFont"
                typographyPreset="H4-Semibold"
                color="UIShapeText1OnPrimary"
              >
                Switch now
              </TUXText>
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
