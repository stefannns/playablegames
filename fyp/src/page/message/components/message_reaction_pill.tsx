import { AnimatePresence, motion } from "framer-motion";

export type ReactionPillProps = {
  emoji?: string;
  align: "start" | "end";
};

/**
 * Reaction emoji shown below a bubble, overlapping it by 8px — reuses the
 * bordered-circle look the existing send-sticker reaction already used. Spring
 * pop on enter/exit (framer-motion) gives the "reaction landed" feel.
 */
export function ReactionPill({ emoji, align }: ReactionPillProps) {
  return (
    <AnimatePresence>
      {emoji ? (
        <motion.div
          key={emoji}
          initial={{ opacity: 0, scale: 0.3, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.3, y: 6 }}
          transition={{ type: "spring", stiffness: 700, damping: 30 }}
          className={`relative z-[2] -mt-2 flex ${align === "end" ? "justify-end pr-1" : "justify-start pl-1"}`}
          style={{ transformOrigin: align === "end" ? "right top" : "left top" }}
        >
          <div className="flex size-8 items-center justify-center rounded-full border-[0.5px] border-tux-v2-ui-shape-neutral-4 bg-tux-v2-ui-page-flat-1">
            <span className="text-[16px] leading-none">{emoji}</span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
