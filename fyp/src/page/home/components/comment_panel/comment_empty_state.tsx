import { TUXButton, TUXIconButton, TUXText, getColorCSSVar } from "@byted-tiktok/tux-web";
import { IconArrowClockwise } from "@byted-tiktok/tux-icons";
import {
  IllustrationEmptyHumanChatBubble,
  IllustrationEmptyHumanStar,
} from "@tiktok-arch/tux-illustration/web";
import { useCallback, useState } from "react";
import type {
  CommentEmptyStateCuriousAboutLook,
  CommentEmptyStateStyle,
  CommentEmptyStateYeahOrNahLook,
} from "./comment_experiment_config.ts";
import "./comment_empty_state.css";

export type CommentEmptyStateProps = {
  onCommentClick: () => void;
  onChipSelect: (text: string) => void;
  style: CommentEmptyStateStyle;
  yeahOrNahLook: CommentEmptyStateYeahOrNahLook;
  curiousAboutLook: CommentEmptyStateCuriousAboutLook;
};

export function CommentEmptyState({
  onCommentClick,
  onChipSelect,
  style,
  yeahOrNahLook,
  curiousAboutLook,
}: CommentEmptyStateProps) {
  if (style === "yeah-or-nah") {
    return <CommentEmptyStateYeahOrNah look={yeahOrNahLook} onChipSelect={onChipSelect} />;
  }
  if (style === "curious-about") {
    return <CommentEmptyStateCuriousAbout look={curiousAboutLook} onChipSelect={onChipSelect} />;
  }
  return <CommentEmptyStateDefault onCommentClick={onCommentClick} />;
}

function CommentEmptyStateDefault({ onCommentClick }: { onCommentClick: () => void }) {
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ backgroundColor: getColorCSSVar("UISheetFlat1") }}
    >
      <div className="flex w-full flex-col items-center justify-center pb-4">
        <div className="empty-default__illustration" aria-hidden="true">
          <IllustrationEmptyHumanChatBubble />
        </div>
        <div className="w-full px-12 py-4 text-center">
          <TUXText
            as="p"
            typographyPreset="Headline-Semibold"
            color="UIText2"
            align="center"
            style={{ margin: 0, lineHeight: "20.8px" }}
          >
            Enjoy this post? Start the conversation.
          </TUXText>
        </div>
        <TUXButton
          text="Comment"
          smoothRadius
          themePreset="secondary"
          shapePreset="capsule"
          height="40px"
          paddingInline="28px"
          backgroundColor="UIShapeNeutral4"
          textColor="UIText1"
          onClick={onCommentClick}
          aria-label="Comment"
        />
      </div>
    </div>
  );
}

const YEAH_OR_NAH_QUESTION = "Environment > taste?";
const YEAH_OR_NAH_CALL_TO_ACTION = "Tap to start the conversation!";

type YeahOrNahSide = "yeah" | "nah";

const YEAH_OR_NAH_REPLY_CHIPS: Record<YeahOrNahSide, readonly string[]> = {
  yeah: [
    "i'd come back just for the vibes \u2615",
    "wifi + playlist carried, ngl",
    "the aesthetic is half the cup fr",
  ],
  nah: [
    "pretty cafe, mid latte \uD83D\uDE2C",
    "if the espresso's bad nothing else matters",
    "give me a hole-in-the-wall w/ great beans any day",
  ],
};

function CommentEmptyStateYeahOrNah({
  look,
  onChipSelect,
}: {
  look: CommentEmptyStateYeahOrNahLook;
  onChipSelect: (text: string) => void;
}) {
  if (look === "a") {
    return <YeahOrNahLookA onChipSelect={onChipSelect} />;
  }
  if (look === "b") {
    return <YeahOrNahLookB onChipSelect={onChipSelect} />;
  }
  if (look === "c") {
    return <YeahOrNahLookC onChipSelect={onChipSelect} />;
  }
  return <YeahOrNahPlaceholder look={look} />;
}

function YeahOrNahLookA({ onChipSelect }: { onChipSelect: (text: string) => void }) {
  const [selected, setSelected] = useState<YeahOrNahSide | null>(null);

  const handleSelect = (side: YeahOrNahSide) => {
    setSelected((prev) => (prev === side ? null : side));
  };

  const chips = selected ? YEAH_OR_NAH_REPLY_CHIPS[selected] : null;

  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ backgroundColor: getColorCSSVar("UISheetFlat1") }}
    >
      <div
        className="yon-stage"
        data-yeah-or-nah-look="a"
        data-yon-selected={selected ?? undefined}
      >
        <button type="button" className="yon-bubble yon-bubble--question" aria-label={YEAH_OR_NAH_QUESTION}>
          <span>{YEAH_OR_NAH_QUESTION}</span>
          <svg
            className="yon-bubble__tail"
            viewBox="0 0 20 18"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="M2 2 L10 16 L18 2" fill="var(--yon-paper)" stroke="none" />
            <path
              d="M2 2 L10 16 L18 2"
              fill="none"
              stroke="var(--yon-bubble-stroke)"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="yon-answers">
          <button
            type="button"
            className="yon-bubble yon-bubble--answer yon-bubble--yeah"
            aria-pressed={selected === "yeah"}
            onClick={() => handleSelect("yeah")}
          >
            Yeah
          </button>
          <button
            type="button"
            className="yon-bubble yon-bubble--answer yon-bubble--nah"
            aria-pressed={selected === "nah"}
            onClick={() => handleSelect("nah")}
          >
            Nah
          </button>
        </div>

        <div className="yon-footer">
          <TUXText
            as="p"
            typographyPreset="Headline-Semibold"
            color="UIText2"
            align="center"
            className="yon-prompt"
            style={{ margin: 0, lineHeight: "20.8px" }}
          >
            {selected ? "Tap to send your take" : YEAH_OR_NAH_CALL_TO_ACTION}
          </TUXText>

          <div
            className="yon-chips-slot"
            data-active={selected ? "true" : undefined}
            aria-hidden={selected ? undefined : "true"}
          >
            <div className="yon-chips-slot__inner">
              <div className="yon-chips" data-yon-side={selected ?? undefined} key={selected ?? "none"}>
                {(chips ?? YEAH_OR_NAH_REPLY_CHIPS.yeah).map((text) => (
                  <button
                    key={text}
                    type="button"
                    className="yon-chip"
                    onClick={(event) => {
                      event.stopPropagation();
                      onChipSelect(text);
                    }}
                    aria-label={text}
                    tabIndex={selected ? 0 : -1}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Look B · Split Arena
// 整片空区域分上下两段：上半 YEAH，下半 NAH，中间黑色 judge bar 夹问题。
// 底色不是实色品牌色，而是从 judge bar 向外淡淡扩散的渐变。点击某半 →
// 该半接管整个剩余区域、未选中半折叠到 0；reply chips 直接出现在选中那
// 半内（替换大字），而不是固定在底部。
// ============================================================================

function YeahOrNahLookB({ onChipSelect }: { onChipSelect: (text: string) => void }) {
  const [selected, setSelected] = useState<YeahOrNahSide | null>(null);

  const handleSelect = (side: YeahOrNahSide) => {
    setSelected((prev) => (prev === side ? null : side));
  };

  const renderHalf = (side: YeahOrNahSide, label: string) => {
    const isActive = selected === side;
    return (
      <div
        role="button"
        tabIndex={0}
        className={`yon-arena__half yon-arena__half--${side}`}
        aria-pressed={isActive}
        onClick={() => handleSelect(side)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleSelect(side);
          }
        }}
      >
        <span className="yon-arena__word" aria-hidden={isActive}>
          {label}
        </span>
        <div className="yon-arena__chips" aria-hidden={!isActive}>
          {YEAH_OR_NAH_REPLY_CHIPS[side].map((text) => (
            <button
              key={text}
              type="button"
              className="yon-chip"
              tabIndex={isActive ? 0 : -1}
              onClick={(e) => {
                e.stopPropagation();
                onChipSelect(text);
              }}
              aria-label={text}
            >
              {text}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className="h-full w-full"
      style={{ backgroundColor: getColorCSSVar("UISheetFlat1") }}
    >
      <div
        className="yon-arena"
        data-yeah-or-nah-look="b"
        data-yon-selected={selected ?? undefined}
      >
        {renderHalf("yeah", "YEAH")}

        <div className="yon-arena__judge" aria-hidden="true">
          <TUXText
            as="span"
            typographyPreset="Headline-Semibold"
            color="UIText2"
            align="center"
            style={{ margin: 0, lineHeight: "20.8px" }}
          >
            {YEAH_OR_NAH_QUESTION}
          </TUXText>
        </div>

        {renderHalf("nah", "NAH")}
      </div>
    </div>
  );
}

// ============================================================================
// Look C · Chat Bubbles（对话气泡风）
// 像真实的聊天对话：左对齐灰色「问题气泡」，右对齐两个并列的回答气泡
// （Yeah / Nah，弱化品牌色）。每个气泡末端有 iMessage 风的小尾巴。选择
// 后未选中那个气泡淡出收缩，下方升起 reply chips。
// ============================================================================

function YeahOrNahLookC({ onChipSelect }: { onChipSelect: (text: string) => void }) {
  const [selected, setSelected] = useState<YeahOrNahSide | null>(null);

  const handleSelect = (side: YeahOrNahSide) => {
    setSelected((prev) => (prev === side ? null : side));
  };

  const chips = selected ? YEAH_OR_NAH_REPLY_CHIPS[selected] : null;

  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ backgroundColor: getColorCSSVar("UISheetFlat1") }}
      onClick={selected ? () => setSelected(null) : undefined}
      role={selected ? "button" : undefined}
      aria-label={selected ? "Back to choosing" : undefined}
    >
      <div
        className="yon-chat"
        data-yeah-or-nah-look="c"
        data-yon-selected={selected ?? undefined}
      >
        <div className="yon-chat__stage">
          <div className="yon-chat__illustration" aria-hidden="true">
            <IllustrationEmptyHumanStar />
          </div>

          <div className="yon-chat__bubble yon-chat__bubble--question" aria-hidden="true">
            <span>{YEAH_OR_NAH_QUESTION}</span>
          </div>

          <button
            type="button"
            className="yon-chat__bubble yon-chat__bubble--answer yon-chat__bubble--yeah"
            aria-pressed={selected === "yeah"}
            onClick={() => handleSelect("yeah")}
          >
            <span>Yeah</span>
          </button>
          <button
            type="button"
            className="yon-chat__bubble yon-chat__bubble--answer yon-chat__bubble--nah"
            aria-pressed={selected === "nah"}
            onClick={() => handleSelect("nah")}
          >
            <span>Nah</span>
          </button>
        </div>

        <div className="yon-footer">
          <TUXText
            as="p"
            typographyPreset="Headline-Semibold"
            color="UIText2"
            align="center"
            className="yon-prompt"
            style={{ margin: 0, lineHeight: "20.8px" }}
          >
            {selected ? "Tap to send your take" : YEAH_OR_NAH_CALL_TO_ACTION}
          </TUXText>

          <div
            className="yon-chips-slot"
            data-active={selected ? "true" : undefined}
            aria-hidden={selected ? undefined : "true"}
          >
            <div className="yon-chips-slot__inner">
              <div className="yon-chips" data-yon-side={selected ?? undefined} key={selected ?? "none"}>
                {(chips ?? YEAH_OR_NAH_REPLY_CHIPS.yeah).map((text) => (
                  <button
                    key={text}
                    type="button"
                    className="yon-chip"
                    onClick={(event) => {
                      event.stopPropagation();
                      onChipSelect(text);
                    }}
                    aria-label={text}
                    tabIndex={selected ? 0 : -1}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function YeahOrNahPlaceholder({ look }: { look: CommentEmptyStateYeahOrNahLook }) {
  const label = "Look · Coming Soon";
  // 当前 a/b/c 都已实现，保留 placeholder 仅作类型穷尽兜底。
  void look;
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ backgroundColor: getColorCSSVar("UISheetFlat1") }}
    >
      <div className="yon-placeholder" style={{ color: getColorCSSVar("UIText2") }}>
        <span className="yon-placeholder__chip">{label}</span>
        <TUXText
          as="p"
          typographyPreset="Headline-Semibold"
          color="UIText2"
          align="center"
          style={{ margin: 0, lineHeight: "20.8px" }}
        >
          {YEAH_OR_NAH_QUESTION}
        </TUXText>
        <TUXText
          as="p"
          color="UIText3"
          align="center"
          style={{ margin: 0, fontSize: 14, lineHeight: "20px" }}
        >
          Coming soon. Designs in progress.
        </TUXText>
      </div>
    </div>
  );
}

// ============================================================================
// ============================================================================
// Curious About — empty state style
// 共享布局：顶部插画（IllustrationEmptyHumanStar）+ 标题（Curious about…）
// + 内容（Look A / Look B）+ 底部 refresh button。
// Look A · Pill Mosaic：3 行 pill 错位拼贴。
// Look B · Scatter Stack：3 张长条卡片轻微旋转 + 重叠，散落感 + popover 阴影。
// ============================================================================

const CURIOUS_ABOUT_TITLE = "Curious about\u2026";

// 围绕"咖啡馆视频"的问题，三行 5-6 个；通过 refresh 在批次间循环。
const CURIOUS_ABOUT_QUESTION_BATCHES: ReadonlyArray<readonly string[]> = [
  [
    "what's that drink?",
    "where is this?",
    "is the wifi good?",
    "open on weekends?",
    "any outlets nearby?",
  ],
  [
    "best seat in the house?",
    "how's the matcha?",
    "do they take cards?",
    "pet friendly?",
    "noise level for laptops?",
  ],
  [
    "house special?",
    "vibe for a first date?",
    "any vegan options?",
    "how loud is it?",
    "open late?",
  ],
];

function CommentEmptyStateCuriousAbout({
  look,
  onChipSelect,
}: {
  look: CommentEmptyStateCuriousAboutLook;
  onChipSelect: (text: string) => void;
}) {
  const [batchIndex, setBatchIndex] = useState(0);
  const [refreshSpinKey, setRefreshSpinKey] = useState(0);

  const handleRefresh = useCallback(() => {
    setBatchIndex((prev) => (prev + 1) % CURIOUS_ABOUT_QUESTION_BATCHES.length);
    setRefreshSpinKey((prev) => prev + 1);
  }, []);

  const questions = CURIOUS_ABOUT_QUESTION_BATCHES[batchIndex];

  const refreshButton = (
    <span key={refreshSpinKey} className="curious-refresh">
      <TUXIconButton
        sizePreset="medium"
        backgroundColor="transparent"
        icon={<IconArrowClockwise />}
        onClick={handleRefresh}
        aria-label="Show different questions"
      />
    </span>
  );

  const headerNode = (
    <>
      <div className="curious-illustration" aria-hidden="true">
        <IllustrationEmptyHumanStar />
      </div>
      <span className="curious-title">{CURIOUS_ABOUT_TITLE}</span>
    </>
  );

  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ backgroundColor: getColorCSSVar("UISheetFlat1") }}
    >
      <div
        className="curious-stage"
        data-curious-look={look}
        key={`${look}-${batchIndex}`}
      >
        {headerNode}
        {look === "a" ? (
          <CuriousAboutLookA questions={questions} onChipSelect={onChipSelect} />
        ) : (
          <CuriousAboutLookB questions={questions} onChipSelect={onChipSelect} />
        )}
        {refreshButton}
      </div>
    </div>
  );
}

// Look A · Pill Mosaic
// 错位拼贴：3 行 pill；每行水平错位形成排版节奏。
function CuriousAboutLookA({
  questions,
  onChipSelect,
}: {
  questions: readonly string[];
  onChipSelect: (text: string) => void;
}) {
  // 把 5-6 个 pill 分到 3 行：2 / 2 / 1+。
  // 这里直接按 [0,1] / [2,3] / [4..] 切片。
  const row1 = questions.slice(0, 2);
  const row2 = questions.slice(2, 4);
  const row3 = questions.slice(4);

  return (
    <div className="curious-mosaic">
      <div className="curious-mosaic__row" data-row="0">
        {row1.map((text, i) => (
          <CuriousPill
            key={text}
            text={text}
            delayMs={120 + i * 30}
            onClick={() => onChipSelect(text)}
          />
        ))}
      </div>
      <div className="curious-mosaic__row" data-row="1">
        {row2.map((text, i) => (
          <CuriousPill
            key={text}
            text={text}
            delayMs={210 + i * 30}
            onClick={() => onChipSelect(text)}
          />
        ))}
      </div>
      {row3.length > 0 ? (
        <div className="curious-mosaic__row" data-row="2">
          {row3.map((text, i) => (
            <CuriousPill
              key={text}
              text={text}
              delayMs={300 + i * 30}
              onClick={() => onChipSelect(text)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CuriousPill({
  text,
  delayMs,
  onClick,
}: {
  text: string;
  delayMs: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="curious-pill"
      onClick={onClick}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {text}
    </button>
  );
}

// Look B · Scatter Stack
// 3 张长条卡片堆叠，每张带轻微正负角度且互相稍有重叠，
// 营造散落感；带 popover 风格阴影。
function CuriousAboutLookB({
  questions,
  onChipSelect,
}: {
  questions: readonly string[];
  onChipSelect: (text: string) => void;
}) {
  // 仅取前 3 个作为散落卡片。
  const cardQuestions = questions.slice(0, 3);

  return (
    <div className="curious-scatter__cards">
      {cardQuestions.map((text, i) => (
        <button
          key={text}
          type="button"
          className="curious-card"
          data-card-position={i}
          onClick={() => onChipSelect(text)}
          style={{ animationDelay: `${140 + i * 70}ms` }}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
