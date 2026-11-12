import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTheme } from "../../../context/theme";
import { useSoftKeyboard } from "./keyboard_context";
import type { KeyboardLayoutId } from "./keyboard_layouts";
import SoftKeyboard, {
  KB_PANEL_TOP_RADIUS_PX,
  KB_SURFACE_COLOR_DARK,
  KB_SURFACE_COLOR_LIGHT,
  getSoftKeyboardPresentedHeight,
  type ShiftState,
} from "./soft_keyboard";

/**
 * SoftKeyboardHost
 *
 * Render at most once per `AppFrame`. It listens to the global
 * {@link useSoftKeyboard} context, presents an iOS-styled keyboard with a
 * slide-up animation, and proxies user input back through
 * `setValue`/`submit`/`close`.
 */
export default function SoftKeyboardHost() {
  const { resolvedTheme: appTheme } = useTheme();
  const {
    isOpen,
    value,
    options,
    close,
    setValue,
    getValue,
    submit,
  } = useSoftKeyboard();
  const resolvedTheme = options.appearance === "dark" || options.appearance === "light"
    ? options.appearance
    : appTheme;

  /* -- Mobile auto-hide --------------------------------------------------- */

  // The soft keyboard is a touch-friendly desktop surrogate for the OS
  // keyboard. On real phones (< sm breakpoint) we step aside and let the
  // native virtual keyboard handle input — the host renders null there.
  const [visibleViewport, setVisibleViewport] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 640px)").matches;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 640px)");
    const handler = () => setVisibleViewport(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  /* -- Local UI state ----------------------------------------------------- */

  const [layoutId, setLayoutId] = useState<KeyboardLayoutId>("letters");
  const [shift, setShift] = useState<ShiftState>("off");
  // Sliding panel (keyboard surface). The document-level
  // tap-outside-to-dismiss listener below uses this to decide whether a
  // pointerdown landed on the keyboard's own chrome (which must never
  // dismiss it) vs. somewhere outside.
  const slidingPanelRef = useRef<HTMLDivElement | null>(null);
  // Snapshot the shift mode so handleInsert (which runs from both pointer
  // taps and physical keydown) always reads the latest value without going
  // stale across rapid keystrokes.
  const shiftRef = useRef<ShiftState>(shift);
  useEffect(() => {
    shiftRef.current = shift;
  }, [shift]);

  /* -- Reset layout & shift each time the keyboard opens ------------------ */
  useEffect(() => {
    if (!isOpen) return;
    setLayoutId("letters");
    // Auto-capitalization on open: same logic as iOS.
    const initialShift: ShiftState =
      options.autoCapitalize === "characters"
        ? "caps"
        : options.autoCapitalize === "none"
          ? "off"
          : value.length === 0 ||
              /[.!?]\s*$/.test(value) ||
              (options.autoCapitalize === "words" && /\s$/.test(value))
            ? "on"
            : "off";
    setShift(initialShift);
    // Only depend on isOpen so re-typing doesn't fight the user's chosen shift.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /* -- Key handlers ------------------------------------------------------- */

  // All value-mutating handlers read the latest value via `getValue()` so a
  // burst of physical-keyboard keydowns doesn't lose keystrokes through
  // stale closures.

  const handleInsert = useCallback(
    (rawChar: string) => {
      // Apply our soft-keyboard shift + auto-capitalize rules. (Physical
      // keyboard input bypasses this and inserts event.key verbatim — see
      // the keydown listener below.)
      let ch = rawChar;
      const currentShift = shiftRef.current;
      if (/^[a-z]$/i.test(ch)) {
        if (currentShift === "caps") {
          ch = ch.toUpperCase();
        } else if (currentShift === "on") {
          ch = ch.toUpperCase();
          // Single-shot — release shift after one letter.
          setShift("off");
        } else {
          ch = ch.toLowerCase();
        }
      }
      setValue(getValue() + ch);
    },
    [getValue, setValue],
  );

  const handleBackspace = useCallback(() => {
    const v = getValue();
    if (v.length === 0) return;
    // Strip one *visual* character; Array.from handles surrogate pairs.
    const chars = Array.from(v);
    chars.pop();
    setValue(chars.join(""));
  }, [getValue, setValue]);

  const handleSpace = useCallback(() => {
    const v = getValue();
    setValue(v + " ");
    if (options.autoCapitalize === "sentences" && /[.!?]$/.test(v)) {
      setShift("on");
    }
  }, [getValue, setValue, options.autoCapitalize]);

  const handleReturn = useCallback(() => {
    submit();
  }, [submit]);

  const handleShift = useCallback((next: ShiftState) => {
    setShift(next);
  }, []);

  const handleLayoutSwitch = useCallback((next: KeyboardLayoutId) => {
    setLayoutId(next);
  }, []);

  /* -- Physical (hardware) keyboard ---------------------------------------
   * The consumer's `target` input (or any other input on the page) gets its
   * keystrokes directly from the browser — we don't intercept those. The
   * listener below only fires when focus is on a non-editable element (e.g. a
   * button, the body, the backdrop) so a user who somehow tabbed away can
   * still drive the soft keyboard from their hardware keyboard.
   *
   * Escape is the one exception: pressing it anywhere closes the keyboard
   * for parity with iOS dismiss-gesture behaviour. */
  useEffect(() => {
    if (!isOpen || !visibleViewport) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const active = document.activeElement;
      const focusedInEditable =
        active != null &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          (active as HTMLElement).isContentEditable);

      // Any text-editing control owns its own keys. An external `target`
      // input can wire Enter / Escape via onKeyDown or rely on the consumer's
      // existing form wiring.
      if (focusedInEditable) return;

      switch (event.key) {
        case "Escape":
          event.preventDefault();
          close();
          return;
        case "Backspace":
          event.preventDefault();
          handleBackspace();
          return;
        case "Enter":
          event.preventDefault();
          submit();
          return;
        case " ":
          event.preventDefault();
          handleSpace();
          return;
        default:
          break;
      }
      if (event.key.length === 1) {
        event.preventDefault();
        // event.key already reflects the user's modifier state — insert as-is.
        setValue(getValue() + event.key);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [
    isOpen,
    visibleViewport,
    handleBackspace,
    handleSpace,
    submit,
    close,
    getValue,
    setValue,
  ]);

  /* -- Tap-outside-to-dismiss --------------------------------------------
   * The dim backdrop below the panel only catches taps in regions not
   * covered by other floating surfaces — e.g. an open TUXSheet rides on
   * top of it at z 2000, so taps inside an in-sheet comments list never
   * reach the backdrop. This document-level listener fills that gap: any
   * pointerdown outside the keyboard's own sliding panel and outside a
   * consumer-marked safe zone dismisses the keyboard, matching iOS
   * "tap outside to dismiss" behaviour.
   *
   * Consumers that host the bound `target` input (e.g. a comment
   * composer) should mark their wrapper with `data-softkb-keep-open`
   * so taps on the composer chrome don't yank the keyboard back down.
   * The bound `target` itself is always safe — belt-and-braces in case
   * the consumer forgets to mark a wrapper. */
  useEffect(() => {
    if (!isOpen || !visibleViewport) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;

      if (slidingPanelRef.current?.contains(target)) return;

      const bound = options.target;
      if (bound && (bound === target || bound.contains(target))) return;

      if (
        target instanceof Element &&
        target.closest("[data-softkb-keep-open]")
      ) {
        return;
      }

      close();
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen, visibleViewport, options.target, close]);

  /* -- Sizing ------------------------------------------------------------- */

  const totalHeight = getSoftKeyboardPresentedHeight();

  const suggestionItems = useMemo(() => ["I", "The", "I'm"], []);
  const panelSurfaceColor =
    resolvedTheme === "dark" ? KB_SURFACE_COLOR_DARK : KB_SURFACE_COLOR_LIGHT;

  /* -- Render ------------------------------------------------------------- */

  // We keep the host mounted permanently so transitions can run; rely on
  // pointer-events: none to allow taps to pass through when closed.
  const surfacePointerEvents = isOpen ? "auto" : "none";

  // Memoise inline styles to avoid React noise.
  const slidingStyle = useMemo(
    () => ({
      transform: isOpen ? "translateY(0)" : "translateY(100%)",
      transition: isOpen
        ? "transform 280ms cubic-bezier(0.22, 0.61, 0.36, 1)"
        : "transform 240ms cubic-bezier(0.4, 0, 0.2, 1)",
    }),
    [isOpen],
  );

  // On real phones we render nothing so the OS keyboard takes over. The
  // context still tracks state — callers can detect mobile (e.g. via the
  // same media query) and route to native inputs if they want.
  if (!visibleViewport) return null;

  return (
    // The wrapper is purposely *not* given a `zIndex`, so it does not
    // open its own stacking context. That lets the two children below
    // sit at different z-indexes in the AppFrame's stacking context:
    // the dim backdrop ducks *under* any open TUXSheet (z 2000), while
    // the keyboard panel itself sits *above* the sheet, so an in-sheet
    // comment composer can ride right on top of the keys.
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: options.allowPageInteraction ? "none" : surfacePointerEvents,
        // Squircle clip is owned by `[data-app-frame-root]` — avoid a second
        // rectangular overflow here, which leaves light corner halos at the
        // bottom when the keyboard is semi-transparent.
      }}
    >
      {/* Transparent tap-catcher — dismiss on tap without dimming the page. */}
      <button
        type="button"
        aria-hidden={!isOpen || options.allowPageInteraction}
        tabIndex={isOpen && !options.allowPageInteraction ? 0 : -1}
        aria-label="Dismiss keyboard"
        onClick={close}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1990,
          background: "transparent",
          opacity: isOpen ? 1 : 0,
          transition: "opacity 220ms ease-out",
          pointerEvents: isOpen && !options.allowPageInteraction ? "auto" : "none",
          border: "none",
          padding: 0,
          margin: 0,
          cursor: "default",
        }}
      />

      {/* Sliding panel: keyboard surface. Sits just below the HomeIndicator
          (z 2100) so the indicator pill stays on top, but above any open
          TUXSheet so the keys are never hidden. */}
      <div
        ref={slidingPanelRef}
        data-soft-keyboard-clip=""
        data-electron-smooth-corner=""
        aria-hidden={!isOpen}
        style={{
          pointerEvents: surfacePointerEvents,
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2090,
          height: totalHeight,
          display: "flex",
          flexDirection: "column",
          backgroundColor: panelSurfaceColor,
          borderTopLeftRadius: KB_PANEL_TOP_RADIUS_PX,
          borderTopRightRadius: KB_PANEL_TOP_RADIUS_PX,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          overflow: "hidden",
          ...slidingStyle,
        }}
        onPointerDown={(event) => {
          // Don't let taps inside the panel reach the dismiss backdrop.
          event.stopPropagation();
        }}
      >
        <SoftKeyboard
          layoutId={layoutId}
          shift={shift}
          resolvedTheme={resolvedTheme}
          returnKey={options.returnKey}
          onInsert={handleInsert}
          onBackspace={handleBackspace}
          onShift={handleShift}
          onLayoutSwitch={handleLayoutSwitch}
          onReturn={handleReturn}
          onSpace={handleSpace}
          onEmoji={options.onEmoji}
          onMic={options.onMic}
          suggestionItems={suggestionItems}
          onSuggestionSelect={setValue}
        />
      </div>
    </div>
  );
}
