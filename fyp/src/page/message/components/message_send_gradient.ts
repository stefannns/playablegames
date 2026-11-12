/**
 * Shared blue→purple gradient for the DM outgoing surface.
 *
 * Used both by the sender message bubble (sampled as a single virtual layer,
 * see `message_thread_content.tsx`) and by the send button in the input bar so
 * the two read as the same brand color. There is no TUX gradient token, so the
 * stops stay as hex here — kept in one place rather than copied per call site.
 */
export const SENDER_BUBBLE_GRADIENT =
  "linear-gradient(135deg, #0894FF 0%, #276CFF 30%, #4257FF 86%, #9B4BFF 100%)";

/** Solid 30%-stop color, used as the first-paint fallback before the gradient. */
export const SENDER_BUBBLE_FALLBACK = "#276CFF";
