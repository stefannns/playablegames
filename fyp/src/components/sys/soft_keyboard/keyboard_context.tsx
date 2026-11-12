/**
 * 软键盘上下文 — 桌面手机框（`≥ sm`）的全局输入代理；真机 `< sm` 不介入。
 *
 * - `SoftKeyboardProvider` 包在 `main.tsx`；`SoftKeyboardHost` 挂在 `AppFrame`。
 * - 业务 `<input>` / `<textarea>`：`onFocus={useSoftKeyboardInputFocus(…)}`。
 * - 整页 composer：`useSoftKeyboardTextTarget`（自动 focus + open）。
 * - 受控值与 emoji 插入须同步 `setValue`；composer 外层 `data-softkb-keep-open`。
 * - 约定详见仓库根 `AGENTS.md` §3。
 */
import {
  type FocusEvent as ReactFocusEvent,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * Label shown on the keyboard's bottom-right "return" key. iOS exposes a
 * handful of contextual variants; we mirror the most useful ones.
 */
export type SoftKeyboardReturnKey =
  | "return"
  | "search"
  | "go"
  | "done"
  | "next"
  | "send"
  | "join";

export type SoftKeyboardAutoCapitalize =
  | "none"
  | "sentences"
  | "words"
  | "characters";

/** A text editing element we know how to mirror keystrokes into. */
export type SoftKeyboardTarget = HTMLInputElement | HTMLTextAreaElement;

export type SoftKeyboardOpenOptions = {
  /** Allow page controls to receive taps; outside dismissal still honors data-softkb-keep-open. */
  allowPageInteraction?: boolean;
  /** Per-input keyboard appearance; auto follows the app theme. */
  appearance?: "auto" | "light" | "dark";
  /** Initial textfield value. Defaults to `target.value` when target is set, else "". */
  initialValue?: string;
  /** Greyed placeholder text (reserved; page inputs own their placeholder). */
  placeholder?: string;
  /** Bottom-right action label on the keyboard. Defaults to "return". */
  returnKey?: SoftKeyboardReturnKey;
  /** Auto-capitalization policy. Defaults to "sentences". */
  autoCapitalize?: SoftKeyboardAutoCapitalize;
  /**
   * Bind to an existing `<input>` or `<textarea>`. Every keystroke is
   * mirrored to the element using the native value setter plus an `input`
   * event, so controlled React components stay in sync. Submit / dismiss
   * also propagate via standard DOM events.
   */
  target?: SoftKeyboardTarget | null;
  /** Called on every textfield change. */
  onChange?: (value: string) => void;
  /** Fired when user taps the return/search/go action. */
  onSubmit?: (value: string) => void;
  /** Fired right before the keyboard dismisses (any reason). */
  onDismiss?: (value: string) => void;
  /** Tap on the bottom-left emoji icon (placeholder for an emoji panel). */
  onEmoji?: () => void;
  /** Tap on the bottom-right microphone icon (placeholder for dictation). */
  onMic?: () => void;
};

type ResolvedOptions = Required<
  Omit<
    SoftKeyboardOpenOptions,
    | "onChange"
    | "onSubmit"
    | "onDismiss"
    | "onEmoji"
    | "onMic"
    | "target"
  >
> & {
  target: SoftKeyboardTarget | null;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  onDismiss?: (value: string) => void;
  onEmoji?: () => void;
  onMic?: () => void;
};

const DEFAULTS: ResolvedOptions = {
  allowPageInteraction: false,
  appearance: "auto",
  initialValue: "",
  placeholder: "",
  returnKey: "return",
  autoCapitalize: "sentences",
  target: null,
};

/**
 * Programmatically set an `<input>` / `<textarea>` value and fire `input`
 * so React's controlled-input listeners pick up the change. Falls back to
 * a direct assignment if the prototype descriptor is unavailable.
 */
function syncToTargetElement(target: SoftKeyboardTarget, next: string) {
  if (target.value === next) return;
  const proto =
    target instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
  if (descriptor?.set) {
    descriptor.set.call(target, next);
  } else {
    target.value = next;
  }
  target.dispatchEvent(new Event("input", { bubbles: true }));
}

type SoftKeyboardContextValue = {
  /** Whether the keyboard is currently presented. */
  isOpen: boolean;
  /** Current textfield value. */
  value: string;
  /** Resolved options (defaults merged in). */
  options: ResolvedOptions;
  /** Imperative: present the keyboard. */
  open: (options?: SoftKeyboardOpenOptions) => void;
  /** Imperative: dismiss the keyboard. Fires onDismiss with the latest value. */
  close: () => void;
  /** Imperative: mutate the current value. Fires onChange. */
  setValue: (next: string) => void;
  /**
   * Imperative: read the latest value synchronously (i.e. without waiting
   * for React to re-render). Useful for global keydown handlers that fire
   * faster than state propagation.
   */
  getValue: () => string;
  /** Imperative: submit the current value. Fires onSubmit then keeps keyboard open. */
  submit: () => void;
};

const SoftKeyboardContext = createContext<SoftKeyboardContextValue | null>(
  null,
);

export function SoftKeyboardProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ResolvedOptions>(DEFAULTS);
  const [value, setValueState] = useState<string>("");

  // Keep latest options in a ref so imperative methods always see the freshest
  // callbacks regardless of when they were captured.
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const open = useCallback((openOptions?: SoftKeyboardOpenOptions) => {
    const target = openOptions?.target ?? DEFAULTS.target;
    const initial =
      openOptions?.initialValue ??
      (target ? target.value : DEFAULTS.initialValue);
    const merged: ResolvedOptions = {
      ...DEFAULTS,
      ...openOptions,
      initialValue: initial,
      placeholder: openOptions?.placeholder ?? DEFAULTS.placeholder,
      returnKey: openOptions?.returnKey ?? DEFAULTS.returnKey,
      autoCapitalize: openOptions?.autoCapitalize ?? DEFAULTS.autoCapitalize,
      target,
    };
    setOptions(merged);
    setValueState(merged.initialValue);
    valueRef.current = merged.initialValue;
    // Reflect initial value into the target so DOM and our state agree.
    if (target) syncToTargetElement(target, merged.initialValue);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    optionsRef.current.onDismiss?.(valueRef.current);
    setIsOpen(false);
  }, []);

  const setValue = useCallback((next: string) => {
    setValueState(next);
    valueRef.current = next;
    const target = optionsRef.current.target;
    if (target) syncToTargetElement(target, next);
    optionsRef.current.onChange?.(next);
  }, []);

  const submit = useCallback(() => {
    optionsRef.current.onSubmit?.(valueRef.current);
  }, []);

  const getValue = useCallback(() => valueRef.current, []);

  const contextValue = useMemo<SoftKeyboardContextValue>(
    () => ({
      isOpen,
      value,
      options,
      open,
      close,
      setValue,
      getValue,
      submit,
    }),
    [isOpen, value, options, open, close, setValue, getValue, submit],
  );

  return (
    <SoftKeyboardContext.Provider value={contextValue}>
      {children}
    </SoftKeyboardContext.Provider>
  );
}

export function useSoftKeyboard() {
  const ctx = useContext(SoftKeyboardContext);
  if (!ctx) {
    throw new Error(
      "useSoftKeyboard must be used inside <SoftKeyboardProvider>",
    );
  }
  return ctx;
}

/**
 * Returns an `onFocus` handler that presents the soft keyboard bound to a
 * real `<input>` (or `<textarea>`) on desktop, and stays out of the way on
 * mobile so the OS keyboard can take over. Pair with your own value state:
 *
 * ```tsx
 * const [value, setValue] = useState("");
 * const onFocus = useSoftKeyboardInputFocus({ returnKey: "search" });
 * return <input value={value} onChange={(e) => setValue(e.target.value)} onFocus={onFocus} />;
 * ```
 *
 * The keyboard mirrors keystrokes back into the element via the native
 * value setter + `input` event, so controlled React inputs stay in sync.
 */
export function useSoftKeyboardInputFocus(
  openOptions?: Omit<SoftKeyboardOpenOptions, "target">,
) {
  const { open } = useSoftKeyboard();
  const optionsRef = useRef(openOptions);
  useEffect(() => {
    optionsRef.current = openOptions;
  }, [openOptions]);

  return useCallback(
    (event: ReactFocusEvent<SoftKeyboardTarget>) => {
      // On real phones we let the OS keyboard handle it. Same breakpoint as
      // the host's mobile auto-hide so the two stay in lockstep.
      if (
        typeof window !== "undefined" &&
        !window.matchMedia("(min-width: 640px)").matches
      ) {
        return;
      }
      open({ ...optionsRef.current, target: event.currentTarget });
    },
    [open],
  );
}

export type UseSoftKeyboardTextTargetOptions = {
  returnKey?: SoftKeyboardReturnKey;
  placeholder?: string;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
};

/** Same focus → `open({ target })` sequence as the text-to-image composer. */
export function useSoftKeyboardTextTarget(
  options: UseSoftKeyboardTextTargetOptions = {},
) {
  const targetRef = useRef<HTMLTextAreaElement | null>(null);
  const { open } = useSoftKeyboard();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const onTargetFocus = useSoftKeyboardInputFocus({
    returnKey: options.returnKey,
    placeholder: options.placeholder,
    onChange: options.onChange,
    onSubmit: options.onSubmit,
  });

  const focusTarget = useCallback(() => {
    const el = targetRef.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 640px)").matches
    ) {
      const o = optionsRef.current;
      open({
        target: el,
        returnKey: o.returnKey,
        placeholder: o.placeholder,
        onChange: o.onChange,
        onSubmit: o.onSubmit,
      });
    }
  }, [open]);

  const focusTargetAfterFrame = useCallback(() => {
    requestAnimationFrame(() => focusTarget());
  }, [focusTarget]);

  const onTargetFocusWithPrep = useCallback(
    (event: ReactFocusEvent<HTMLTextAreaElement>) => {
      const el = event.currentTarget;
      if (el.value.length === 0) {
        el.setSelectionRange(0, 0);
        el.scrollTop = 0;
      }
      onTargetFocus(event);
    },
    [onTargetFocus],
  );

  return {
    targetRef,
    onTargetFocus: onTargetFocusWithPrep,
    focusTarget,
    focusTargetAfterFrame,
  };
}
