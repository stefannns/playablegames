import { useRef, type ChangeEvent, type ClipboardEvent, type CSSProperties } from "react";
import { getColorCSSVar } from "@byted-tiktok/tux-web";
import {
  extractFeedCardHexDigits,
  formatFeedCardHexFromDigits,
} from "./feed_card.config";

type FeedCardHexColorInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: CSSProperties;
};

/** # 仅展示；仅可编辑后 6 位 hex */
export function FeedCardHexColorInput({
  value,
  onChange,
  placeholder = "FE2C55",
  className,
  style,
}: FeedCardHexColorInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const digits = extractFeedCardHexDigits(value);
  const fontSize = style?.fontSize ?? 13;

  const commitDigits = (raw: string) => {
    onChange(formatFeedCardHexFromDigits(raw));
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    commitDigits(event.target.value);
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    commitDigits(extractFeedCardHexDigits(event.clipboardData.getData("text")));
  };

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        boxSizing: "border-box",
        minWidth: 0,
        ...style,
      }}
      onClick={() => inputRef.current?.focus()}
    >
      <span
        aria-hidden
        className="shrink-0 select-none pointer-events-none tabular-nums"
        style={{
          color: getColorCSSVar("UIText1"),
          fontSize,
          lineHeight: 1,
          paddingLeft: 10,
        }}
      >
        #
      </span>
      <input
        ref={inputRef}
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Hex color value"
        className="min-w-0 flex-1 border-none bg-transparent outline-none tabular-nums"
        style={{
          color: getColorCSSVar("UIText1"),
          fontSize,
          padding: "0 10px 0 2px",
          fontFamily: "inherit",
        }}
        value={digits}
        placeholder={placeholder}
        onChange={handleChange}
        onPaste={handlePaste}
      />
    </div>
  );
}
