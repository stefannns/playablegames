import { TUXText } from "@byted-tiktok/tux-web";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, type ComponentProps, type CSSProperties } from "react";

/** Match `tabbar.tsx` slide / theme transition easing. */
const ANIMATED_DIGIT_EASE = [0.32, 0.72, 0, 1] as const;

const STAGGER_S = 0.035;
const CHAR_DURATION_S = 0.32;

const containerVariants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: STAGGER_S,
      delayChildren: 0,
    },
  },
};

const digitVariants = {
  hidden: {
    opacity: 0,
    y: 12,
    filter: "blur(8px)",
  },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: CHAR_DURATION_S,
      ease: ANIMATED_DIGIT_EASE,
    },
  },
};

type TUXTextPick = Pick<
  ComponentProps<typeof TUXText>,
  "typographyPreset" | "color" | "className" | "style"
>;

export type AnimatedDigitTextProps = TUXTextPick & {
  /** Integer shown digit-by-digit (non-integers are not supported). */
  value: number;
  /**
   * When `true`, the first paint of this instance does not run the stagger
   * enter (use in lists so rows do not animate on scroll-in). After that,
   * every `value` change still animates.
   */
  skipInitialAnimation?: boolean;
  /** Duration of the `width: Nch` transition (tabular slot). Default 350. */
  widthTransitionMs?: number;
};

/**
 * Tabular digit string with a fixed `ch` slot width (smooth reflow for
 * neighbors like a like icon) plus per-digit stagger (blur + slide up),
 * Magic UI TextAnimate–style. Reuse anywhere you need animated counters.
 */
export function AnimatedDigitText({
  value,
  skipInitialAnimation = false,
  widthTransitionMs = 350,
  typographyPreset = "P2-Semibold",
  color = "UIText1",
  className,
  style,
}: AnimatedDigitTextProps) {
  const prefersReducedMotion = useReducedMotion();
  const skipFirstEnterRef = useRef(skipInitialAnimation);

  useEffect(() => {
    skipFirstEnterRef.current = false;
  }, []);

  const str = String(value);
  const digitCount = str.length;

  const slotStyle: CSSProperties = {
    ...style,
    width: `${digitCount}ch`,
    fontVariantNumeric: "tabular-nums",
    transition: `width ${widthTransitionMs}ms cubic-bezier(0.32, 0.72, 0, 1)`,
  };

  if (prefersReducedMotion) {
    return (
      <TUXText
        typographyPreset={typographyPreset}
        color={color}
        className={["inline-block tabular-nums", className].filter(Boolean).join(" ") || undefined}
        style={slotStyle}
      >
        {value}
      </TUXText>
    );
  }

  return (
    <TUXText
      typographyPreset={typographyPreset}
      color={color}
      className={["inline-block tabular-nums", className].filter(Boolean).join(" ") || undefined}
      style={slotStyle}
    >
      <motion.span
        key={value}
        className="inline-flex"
        initial={skipFirstEnterRef.current ? false : "hidden"}
        animate="show"
        variants={containerVariants}
      >
        {str.split("").map((digit, i) => (
          <motion.span
            key={`${value}-${i}`}
            variants={digitVariants}
            className="inline-block w-1ch shrink-0 text-center"
          >
            {digit}
          </motion.span>
        ))}
      </motion.span>
    </TUXText>
  );
}
