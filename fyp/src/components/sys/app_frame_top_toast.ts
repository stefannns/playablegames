import { TUXTopToast, type TUXTopToastConfig } from "@byted-tiktok/tux-web";

/**
 * AppFrame-scoped top toast — the only supported imperative API in this repo.
 *
 * Do not call `TUXTopToast.show()` directly: default portal targets the browser
 * viewport and misaligns on the desktop phone-frame. This helper portals to
 * `[data-app-frame-root]` and applies
 * `topSafeAreaHeight: var(--app-frame-top-toast-offset)` (defined in `src/index.css`).
 *
 * 自检：`rg 'TUXTopToast\.show' src/` 应仅命中本文件。
 *
 * Adjust global spacing by editing `--app-frame-top-toast-offset` on the frame
 * root, or pass `topSafeAreaHeight` per call for one-off overrides.
 */
export type AppFrameTopToastConfig = Omit<
  TUXTopToastConfig,
  "root" | "topSafeAreaHeight"
> & {
  /** Defaults to `var(--app-frame-top-toast-offset)`. */
  topSafeAreaHeight?: string;
};

export function getAppFrameRootElement(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>('[data-app-frame-root="true"]');
}

export function showAppFrameTopToast(config: AppFrameTopToastConfig) {
  const root = getAppFrameRootElement();
  return TUXTopToast.show({
    ...config,
    root: root ?? undefined,
    topSafeAreaHeight:
      config.topSafeAreaHeight ?? "var(--app-frame-top-toast-offset)",
  });
}
