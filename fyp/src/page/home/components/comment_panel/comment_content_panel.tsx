import {
  TUXButton,
  TUXIconButton,
  TUXSwitch,
  TUXText,
  getColorCSSVar,
} from "@byted-tiktok/tux-web";
import {
  IconChevronCollapse,
  IconChevronDown,
  IconDicesFill,
  IconTrashBin,
} from "@byted-tiktok/tux-icons";
import { useState } from "react";
import {
  AppFrameCornerCapsuleTrigger,
  AppFrameCornerPanelAnchor,
} from "../../../../components/sys/app_frame_corner_capsule_trigger";
import { COMMENT_DEFAULT_EDITOR_IMAGE } from "./comment_assets";
import {
  COMMENT_LOCAL_AVATAR_SLOT_COUNT,
  COMMENT_STICKER_OPTIONS,
  COMMENT_CONTENT_PRESETS,
  createEmptyCommentNode,
  normalizeCommentContentDocument,
  type CommentAuthorLabel,
  type CommentContentDocument,
  type CommentContentNode,
  type CommentContentPresetId,
  type CommentImageDisplay,
  type CommentMediaSpec,
} from "./comment_content_config";
import { applyCommentContentPreset } from "./comment_content_store";

type CommentContentPanelProps = {
  visible: boolean;
  document: CommentContentDocument;
  onDocumentChange: (next: CommentContentDocument) => void;
  onReset: () => void;
};

export function CommentContentPanel({
  visible,
  document,
  onDocumentChange,
  onReset,
}: CommentContentPanelProps) {
  if (!visible) return null;
  const [collapsed, setCollapsed] = useState(true);
  const [clipboardText, setClipboardText] = useState("");
  const [clipboardStatus, setClipboardStatus] = useState<string | null>(null);
  const activePresetId = detectActiveCommentContentPresetId(document);

  if (collapsed) {
    return (
      <AppFrameCornerCapsuleTrigger
        side="right"
        stackIndex={0}
        text="Content"
        onClick={() => setCollapsed(false)}
        aria-label="Open comment content panel"
      />
    );
  }

  return (
    <AppFrameCornerPanelAnchor
      side="right"
      stackIndex={0}
      className="w-90 max-h-comment-panel-shell overflow-hidden rounded-[16px] border shadow-panel-floating backdrop-blur-xl"
      style={{
        backgroundColor: getColorCSSVar("UIPageFlat1"),
        borderColor: getColorCSSVar("UIShapeNeutral3"),
      }}
    >
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 border-b"
        style={{ borderColor: getColorCSSVar("UIShapeNeutral3") }}
      >
        <TUXText
          as="div"
          style={{
            fontSize: 15,
            fontWeight: 600,
            lineHeight: "19.5px",
            color: getColorCSSVar("UIText1"),
          }}
        >
          Comment Content
        </TUXText>
        <div className="flex items-center gap-2">
          <TUXButton
            text="Reset"
            smoothRadius
            themePreset="secondary"
            shapePreset="capsule"
            sizePreset="small"
            onClick={onReset}
            backgroundColor="UIPageFlat2"
            borderStyle="solid"
            borderWidth="0.5px"
            borderColor="UIShapeNeutral3"
            paddingInline="10px"
            height="28px"
          />
          <TUXIconButton
            icon={<IconChevronCollapse width={14} height={14} />}
            sizePreset="small"
            onClick={() => setCollapsed(true)}
            backgroundColor="UIPageFlat2"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4 max-h-comment-panel-body overflow-y-auto">
        <SectionCard title="Mock Presets">
          <TUXText as="div" style={subtleTextStyle}>
            One-click swap to a different mock comment dataset. Overwrites the current
            content (your edits in localStorage will be replaced).
          </TUXText>
          <div className="flex flex-wrap gap-2">
            {COMMENT_CONTENT_PRESETS.map((preset) => {
              const isActive = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyCommentContentPreset(preset.id)}
                  title={preset.description}
                  style={{
                    borderRadius: 999,
                    border: `0.5px solid ${getColorCSSVar(
                      isActive ? "UIShapePrimary" : "UIShapeNeutral3",
                    )}`,
                    backgroundColor: getColorCSSVar(
                      isActive ? "UIPageFlat3" : "UIPageFlat1",
                    ),
                    color: getColorCSSVar("UIText1"),
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 500,
                    lineHeight: "15.6px",
                    cursor: "pointer",
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          <TUXText as="div" style={subtleTextStyle}>
            URL: <code>?commentContentPreset={activePresetId ?? "coffee-shop"}</code>
          </TUXText>
        </SectionCard>

        <SectionCard title="Clipboard Import / Export">
          <TUXText as="div" style={subtleTextStyle}>
            Copy the full comment config, or paste JSON text below and import it.
          </TUXText>
          <InputField
            value={clipboardText}
            onChange={setClipboardText}
            placeholder="Paste full comment config JSON"
          />
          <div className="flex flex-wrap gap-2">
            <TUXButton
              text="Copy Current"
              smoothRadius
              themePreset="secondary"
              shapePreset="capsule"
              sizePreset="small"
              onClick={async () => {
                const nextText = serializeCommentDocument(document);
                try {
                  await navigator.clipboard.writeText(nextText);
                  setClipboardStatus(
                    "Config copied to clipboard, paste it somewhere so you don't lose it.",
                  );
                } catch {
                  setClipboardStatus("Copy failed. Please try again.");
                }
              }}
              backgroundColor="UIPageFlat2"
              borderStyle="solid"
              borderWidth="0.5px"
              borderColor="UIShapeNeutral3"
              paddingInline="10px"
              height="32px"
            />
            <TUXButton
              text="Import"
              smoothRadius
              themePreset="primary"
              shapePreset="capsule"
              sizePreset="small"
              onClick={() => {
                const parsedDocument = parseImportedCommentDocument(clipboardText);
                if (!parsedDocument) {
                  setClipboardStatus("Import failed. Please paste a valid comment config JSON.");
                  return;
                }
                onDocumentChange(parsedDocument);
                setClipboardText("");
                setClipboardStatus("Comment config imported successfully.");
              }}
              paddingInline="10px"
              height="32px"
            />
          </div>
          {clipboardStatus ? (
            <TUXText as="div" style={subtleTextStyle}>
              {clipboardStatus}
            </TUXText>
          ) : null}
        </SectionCard>

        <SectionCard title="Composer">
          <Field label="Avatar ID / URL">
            <AvatarReferenceField
              value={document.composer.avatarSrc}
              onChange={(next) =>
                onDocumentChange({
                  ...document,
                  composer: { ...document.composer, avatarSrc: next },
                })
              }
            />
          </Field>
          <Field label="Placeholder">
            <InputField
              value={document.composer.placeholder}
              onChange={(next) =>
                onDocumentChange({
                  ...document,
                  composer: { ...document.composer, placeholder: next },
                })
              }
            />
          </Field>
        </SectionCard>

        <div className="flex items-center justify-between gap-3">
          <TUXText as="div" style={sectionTitleStyle}>
            Top-Level Comments
          </TUXText>
          <div className="flex items-center gap-2">
            <TUXButton
              text="Clear All"
              smoothRadius
              themePreset="secondary"
              shapePreset="capsule"
              sizePreset="small"
              onClick={() => {
                if (document.comments.length === 0) return;
                onDocumentChange({
                  ...document,
                  comments: [],
                });
              }}
              backgroundColor="UIPageFlat2"
              borderStyle="solid"
              borderWidth="0.5px"
              borderColor="UIShapeNeutral3"
              paddingInline="10px"
              height="32px"
            />
          </div>
        </div>

        {document.comments.map((comment, index) => (
          <CommentNodeEditor
            key={comment.id}
            node={comment}
            depth={0}
            index={index}
            onChange={(nextNode) =>
              onDocumentChange({
                ...document,
                comments: updateNodeInTree(document.comments, comment.id, () => nextNode),
              })
            }
            onDelete={() =>
              onDocumentChange({
                ...document,
                comments: removeNodeInTree(document.comments, comment.id),
              })
            }
            onAddReply={() =>
              onDocumentChange({
                ...document,
                comments: updateNodeInTree(document.comments, comment.id, (currentNode) => ({
                  ...currentNode,
                  replies: [...currentNode.replies, createEmptyCommentNode(createNodeId())],
                })),
              })
            }
          />
        ))}
        <div className="flex justify-end pt-1">
          <TUXButton
            text="Add Comment"
            smoothRadius
            themePreset="secondary"
            shapePreset="capsule"
            sizePreset="small"
            onClick={() =>
              onDocumentChange({
                ...document,
                comments: [...document.comments, createEmptyCommentNode(createNodeId())],
              })
            }
            backgroundColor="UIPageFlat2"
            borderStyle="solid"
            borderWidth="0.5px"
            borderColor="UIShapeNeutral3"
            paddingInline="10px"
            height="32px"
          />
        </div>
      </div>
    </AppFrameCornerPanelAnchor>
  );
}

function CommentNodeEditor({
  node,
  depth,
  index,
  onChange,
  onDelete,
  onAddReply,
}: {
  node: CommentContentNode;
  depth: number;
  index: number;
  onChange: (nextNode: CommentContentNode) => void;
  onDelete: () => void;
  onAddReply: () => void;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const mediaType = node.media?.type ?? "none";
  const title = depth === 0 ? `${index + 1}.` : `Reply ${index + 1}`;
  const summaryAuthor = node.authorName.trim() || "unknown_user";
  const summaryContent = node.content.trim() || "Empty comment";

  return (
    <SectionCard title={title}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <TUXText as="div" style={subtleTextStyle}>
            {summaryAuthor}
          </TUXText>
          {collapsed ? (
            <div className="flex items-center gap-2 min-w-0">
              <TUXText
                as="div"
                style={{
                  ...subtleTextStyle,
                  flex: 1,
                  minWidth: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {summaryContent}
              </TUXText>
              {mediaType !== "none" ? (
                <TUXText
                  as="div"
                  style={{
                    ...subtleTextStyle,
                    flexShrink: 0,
                    color: getColorCSSVar("UIText2"),
                  }}
                >
                  {formatMediaTypeLabel(mediaType)}
                </TUXText>
              ) : null}
            </div>
          ) : (
            <TUXText as="div" style={subtleTextStyle}>
              {depth === 0 ? node.id : `${node.id} · depth ${depth}`}
            </TUXText>
          )}
        </div>
        <div className="flex items-center gap-2">
          <InlineIconButton
            onClick={() => setCollapsed((current) => !current)}
            ariaLabel={collapsed ? "Expand comment" : "Collapse comment"}
            renderIcon={(color) => (
              <IconChevronDown
                width={16}
                height={16}
                style={{
                  color,
                  transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
                  transition: "transform 160ms ease",
                }}
              />
            )}
          />
          <InlineIconButton
            onClick={onDelete}
            ariaLabel="Delete comment"
            renderIcon={(color) => <IconTrashBin width={16} height={16} style={{ color }} />}
          />
        </div>
      </div>

      {collapsed ? null : (
        <>
          <Field label="Author Name">
            <InputField
              value={node.authorName}
              onChange={(next) => onChange({ ...node, authorName: next })}
            />
          </Field>
          <Field label="Author Avatar ID / URL">
            <AvatarReferenceField
              value={node.authorAvatarSrc}
              onChange={(next) => onChange({ ...node, authorAvatarSrc: next })}
            />
          </Field>
          <Field label="Label">
            <SelectField
              value={node.authorLabel ? node.authorLabel.toLowerCase() : "none"}
              onChange={(next) =>
                onChange({
                  ...node,
                  authorLabel: next === "none" ? undefined : (toCommentAuthorLabel(next) ?? undefined),
                })
              }
            >
              <option value="none">None</option>
              <option value="creator">Creator</option>
              <option value="following">Following</option>
            </SelectField>
          </Field>
          <Field label="Content">
            <TextareaField
              value={node.content}
              onChange={(next) => onChange({ ...node, content: next })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Time">
              <InputField
                value={node.timeLabel}
                onChange={(next) => onChange({ ...node, timeLabel: next })}
              />
            </Field>
            <Field label="Like Count">
              <InputField
                value={node.likeCountLabel}
                onChange={(next) => onChange({ ...node, likeCountLabel: next })}
              />
            </Field>
          </div>

          <Field label="Media Type">
            <SelectField
              value={mediaType}
              onChange={(next) =>
                onChange({
                  ...node,
                  media: createMediaSpec(next as MediaTypeValue, node.media),
                })
              }
            >
              <option value="none">None</option>
              <option value="image">Image</option>
              <option value="sticker">Sticker</option>
              <option value="audio">Audio</option>
            </SelectField>
          </Field>

          {node.media ? (
            <div
              className="rounded-xl border p-3"
              style={{
                borderColor: getColorCSSVar("UIShapeNeutral3"),
                backgroundColor: getColorCSSVar("UIPageFlat1"),
              }}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <TUXText as="div" style={fieldLabelStyle}>
                  Media Visible
                </TUXText>
                <TUXSwitch
                  name={`media-visible-${node.id}`}
                  value={node.id}
                  sizePreset="small"
                  checked={node.media.visible}
                  onChange={(_event: unknown, checked: boolean) =>
                    onChange({ ...node, media: { ...node.media!, visible: checked } })
                  }
                  backgroundColor="UIShapePrimary"
                />
              </div>

              {node.media?.type === "image"
                ? (() => {
                    const imageMedia = node.media;
                    return (
                      <>
                        <Field label="Image URL">
                          <InputField
                            value={imageMedia.url}
                            onChange={(next) =>
                              onChange({
                                ...node,
                                media: {
                                  type: "image",
                                  visible: imageMedia.visible,
                                  url: next,
                                  display: imageMedia.display,
                                },
                              })
                            }
                          />
                        </Field>
                        <Field label="Image Shape">
                          <SelectField
                            value={imageMedia.display}
                            onChange={(next) =>
                              onChange({
                                ...node,
                                media: {
                                  type: "image",
                                  visible: imageMedia.visible,
                                  url: imageMedia.url,
                                  display: next as CommentImageDisplay,
                                },
                              })
                            }
                          >
                            <option value="auto">Auto</option>
                            <option value="portrait">Portrait</option>
                            <option value="landscape">Landscape</option>
                            <option value="square">Square</option>
                          </SelectField>
                        </Field>
                      </>
                    );
                  })()
                : null}

              {node.media?.type === "sticker"
                ? (() => {
                    const stickerMedia = node.media;
                    return (
                      <Field label="Sticker Ref / URL">
                        <StickerReferenceField
                          value={stickerMedia.stickerRef}
                          onChange={(next) =>
                            onChange({
                              ...node,
                              media: {
                                type: "sticker",
                                visible: stickerMedia.visible,
                                stickerRef: next,
                              },
                            })
                          }
                        />
                      </Field>
                    );
                  })()
                : null}

              {node.media?.type === "audio"
                ? (() => {
                    const audioMedia = node.media;
                    return (
                      <>
                        <Field label="Duration">
                          <AudioDurationSlider
                            valueSeconds={durationLabelToSeconds(audioMedia.duration)}
                            onChange={(nextSeconds) =>
                              onChange({
                                ...node,
                                media: {
                                  type: "audio",
                                  visible: audioMedia.visible,
                                  duration: secondsToDurationLabel(nextSeconds),
                                  text: audioMedia.text,
                                },
                              })
                            }
                          />
                        </Field>
                        <Field label="Audio Text">
                          <TextareaField
                            value={audioMedia.text}
                            onChange={(next) =>
                              onChange({
                                ...node,
                                media: {
                                  type: "audio",
                                  visible: audioMedia.visible,
                                  duration: audioMedia.duration,
                                  text: next,
                                },
                              })
                            }
                          />
                        </Field>
                      </>
                    );
                  })()
                : null}
            </div>
          ) : null}

          {node.replies.length > 0 ? (
            <div className="flex flex-col gap-3 pt-2">
              <TUXText as="div" style={sectionTitleStyle}>
                Replies
              </TUXText>
              {node.replies.map((reply, replyIndex) => (
                <CommentNodeEditor
                  key={reply.id}
                  node={reply}
                  depth={depth + 1}
                  index={replyIndex}
                  onChange={(nextReply) =>
                    onChange({
                      ...node,
                      replies: updateNodeInTree(node.replies, reply.id, () => nextReply),
                    })
                  }
                  onDelete={() =>
                    onChange({
                      ...node,
                      replies: removeNodeInTree(node.replies, reply.id),
                    })
                  }
                  onAddReply={() =>
                    onChange({
                      ...node,
                      replies: updateNodeInTree(node.replies, reply.id, (currentReply) => ({
                        ...currentReply,
                        replies: [...currentReply.replies, createEmptyCommentNode(createNodeId())],
                      })),
                    })
                  }
                />
              ))}
            </div>
          ) : null}
          <div className="flex justify-end pt-1">
            <TUXButton
              text="Add Reply"
              smoothRadius
              themePreset="secondary"
              shapePreset="capsule"
              sizePreset="small"
              onClick={onAddReply}
              backgroundColor="UIPageFlat1"
              borderStyle="solid"
              borderWidth="0.5px"
              borderColor="UIShapeNeutral3"
              paddingInline="10px"
              height="28px"
            />
          </div>
        </>
      )}
    </SectionCard>
  );
}

function formatMediaTypeLabel(mediaType: Exclude<MediaTypeValue, "none">) {
  if (mediaType === "image") return "Image";
  if (mediaType === "sticker") return "Sticker";
  return "Audio";
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[16px] border p-3"
      style={{
        borderColor: getColorCSSVar("UIShapeNeutral3"),
        backgroundColor: getColorCSSVar("UIPageFlat2"),
      }}
    >
      <TUXText as="div" style={cardTitleStyle}>
        {title}
      </TUXText>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <TUXText as="span" style={fieldLabelStyle}>
        {label}
      </TUXText>
      {children}
    </label>
  );
}

function InputField({
  value,
  onChange,
  placeholder,
  paddingRight,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  paddingRight?: number;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      style={{
        ...inputStyle,
        paddingRight,
      }}
    />
  );
}

function AvatarReferenceField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <InputField
          value={value}
          onChange={onChange}
          placeholder={`1-${COMMENT_LOCAL_AVATAR_SLOT_COUNT} or https://...`}
          paddingRight={44}
        />
        <div className="absolute inset-y-0 right-2 flex items-center">
          <InlineIconButton
            onClick={() => onChange(createRandomAvatarReference())}
            ariaLabel="Random avatar"
            renderIcon={(color) => <IconDicesFill width={16} height={16} style={{ color }} />}
          />
        </div>
      </div>
      <TUXText as="div" style={subtleTextStyle}>
        Use a local avatar slot from 1-{COMMENT_LOCAL_AVATAR_SLOT_COUNT}, or keep an image URL for
        older imported data.
      </TUXText>
    </div>
  );
}

function StickerReferenceField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <InputField
        value={value}
        onChange={onChange}
        placeholder={`${COMMENT_STICKER_OPTIONS[0].id} or https://...`}
      />
      <div className="flex flex-wrap gap-2">
        {COMMENT_STICKER_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            style={{
              borderRadius: 999,
              border: `0.5px solid ${getColorCSSVar("UIShapeNeutral3")}`,
              backgroundColor: option.id === value ? getColorCSSVar("UIPageFlat3") : getColorCSSVar("UIPageFlat2"),
              color: getColorCSSVar("UIText1"),
              padding: "6px 10px",
              fontSize: 12,
              lineHeight: "15.6px",
              cursor: "pointer",
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
      <TUXText as="div" style={subtleTextStyle}>
        Type a local sticker ref or paste any external GIF / image URL.
      </TUXText>
    </div>
  );
}

function InlineIconButton({
  ariaLabel,
  onClick,
  renderIcon,
}: {
  ariaLabel: string;
  onClick: () => void;
  renderIcon: (color: string) => React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const color = pressed
    ? getColorCSSVar("UIText1")
    : hovered
      ? getColorCSSVar("UIText2")
      : getColorCSSVar("UIText3");

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        padding: 0,
        border: 0,
        borderRadius: 999,
        background: "transparent",
        cursor: "pointer",
      }}
    >
      {renderIcon(color)}
    </button>
  );
}

function SelectField({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (next: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={selectStyle}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
        <IconChevronDown width={16} height={16} style={{ color: getColorCSSVar("UIText3") }} />
      </div>
    </div>
  );
}

function TextareaField({
  value,
  onChange,
  minHeight = 88,
}: {
  value: string;
  onChange: (next: string) => void;
  minHeight?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      style={{
        width: "100%",
        minHeight,
        resize: "vertical",
        borderRadius: 12,
        border: `0.5px solid ${getColorCSSVar("UIShapeNeutral3")}`,
        backgroundColor: getColorCSSVar("UIPageFlat1"),
        color: getColorCSSVar("UIText1"),
        padding: "10px 12px",
        fontSize: 13,
        lineHeight: "16.9px",
      }}
    />
  );
}

type MediaTypeValue = CommentMediaSpec["type"] | "none";

function createMediaSpec(nextType: MediaTypeValue, previous: CommentMediaSpec | undefined) {
  if (nextType === "none") return undefined;
  if (nextType === "image") {
    return {
      type: "image" as const,
      visible: previous?.visible ?? true,
      url: previous?.type === "image" ? previous.url : COMMENT_DEFAULT_EDITOR_IMAGE,
      display: previous?.type === "image" ? previous.display : "auto",
    };
  }
  if (nextType === "sticker") {
    return {
      type: "sticker" as const,
      visible: previous?.visible ?? true,
      stickerRef: previous?.type === "sticker" ? previous.stickerRef : COMMENT_STICKER_OPTIONS[0].id,
    };
  }
  return {
    type: "audio" as const,
    visible: previous?.visible ?? true,
    duration: previous?.type === "audio" ? previous.duration : "0:07",
    text: previous?.type === "audio" ? previous.text : "New audio transcript",
  };
}

function updateNodeInTree(
  nodes: CommentContentNode[],
  targetId: string,
  updater: (node: CommentContentNode) => CommentContentNode,
): CommentContentNode[] {
  return nodes.map((node) => {
    if (node.id === targetId) return updater(node);
    if (node.replies.length === 0) return node;
    return {
      ...node,
      replies: updateNodeInTree(node.replies, targetId, updater),
    };
  });
}

function removeNodeInTree(nodes: CommentContentNode[], targetId: string): CommentContentNode[] {
  return nodes
    .filter((node) => node.id !== targetId)
    .map((node) => ({
      ...node,
      replies: removeNodeInTree(node.replies, targetId),
    }));
}

function createNodeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createRandomAvatarReference() {
  return String(Math.floor(Math.random() * COMMENT_LOCAL_AVATAR_SLOT_COUNT) + 1);
}

function AudioDurationSlider({
  valueSeconds,
  onChange,
}: {
  valueSeconds: number;
  onChange: (nextSeconds: number) => void;
}) {
  const safeValue = clamp(valueSeconds, 3, 120);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <TUXText as="span" style={subtleTextStyle}>
          {secondsToDurationLabel(safeValue)}
        </TUXText>
        <TUXText as="span" style={subtleTextStyle}>
          3s - 2:00
        </TUXText>
      </div>
      <input
        type="range"
        min={3}
        max={120}
        step={1}
        value={safeValue}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{
          width: "100%",
          accentColor: getColorCSSVar("UIShapePrimary"),
        }}
      />
    </div>
  );
}

function durationLabelToSeconds(duration: string) {
  const match = /^(\d+):([0-5]\d)$/.exec(duration.trim());
  if (!match) return 7;
  const minutes = Number.parseInt(match[1], 10);
  const seconds = Number.parseInt(match[2], 10);
  return minutes * 60 + seconds;
}

function secondsToDurationLabel(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function serializeCommentDocument(document: CommentContentDocument) {
  return JSON.stringify(document, null, 2);
}

function detectActiveCommentContentPresetId(
  document: CommentContentDocument,
): CommentContentPresetId | null {
  // The comment count + first top-level id is a cheap and stable signal across
  // the built-in presets, since they don't share comment ids.
  const firstCommentId = document.comments[0]?.id;
  if (!firstCommentId) return null;
  const match = COMMENT_CONTENT_PRESETS.find(
    (preset) =>
      preset.document.comments.length === document.comments.length &&
      preset.document.comments[0]?.id === firstCommentId,
  );
  return match?.id ?? null;
}

function parseImportedCommentDocument(text: string) {
  try {
    const parsed = JSON.parse(text) as unknown;
    return normalizeCommentContentDocument(parsed as Partial<CommentContentDocument>);
  } catch {
    return null;
  }
}

function toCommentAuthorLabel(value: string): CommentAuthorLabel | null {
  if (value === "creator") return "Creator";
  if (value === "following") return "Following";
  return null;
}

const sectionTitleStyle = {
  fontSize: 13,
  fontWeight: 600,
  lineHeight: "16.9px",
  color: getColorCSSVar("UIText1"),
} as const;

const cardTitleStyle = {
  fontSize: 13,
  fontWeight: 600,
  lineHeight: "16.9px",
  color: getColorCSSVar("UIText1"),
} as const;

const subtleTextStyle = {
  fontSize: 12,
  fontWeight: 400,
  lineHeight: "15.6px",
  color: getColorCSSVar("UIText3"),
} as const;

const fieldLabelStyle = {
  fontSize: 12,
  fontWeight: 600,
  lineHeight: "15.6px",
  color: getColorCSSVar("UIText3"),
} as const;

const inputStyle = {
  width: "100%",
  minHeight: 40,
  borderRadius: 12,
  border: `0.5px solid ${getColorCSSVar("UIShapeNeutral3")}`,
  backgroundColor: getColorCSSVar("UIPageFlat1"),
  color: getColorCSSVar("UIText1"),
  padding: "10px 12px",
  fontSize: 13,
  lineHeight: "16.9px",
} as const;

const selectStyle = {
  ...inputStyle,
  paddingRight: 40,
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
} as const;
