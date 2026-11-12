import { useEffect } from "react";

import App from "../App";
import { useAppNavigation } from "../context/app_navigation";
import { VisitorProfileProvider } from "../context/visitor_profile";
import { PHOTO_TEXT_DETAIL_PATH } from "./photo_text_detail/photo_text_detail_route";
import PhotoTextDetailRoutePage from "./photo_text_detail/photo_text_detail_route_page";

/**
 * Top-level entry: tabbed `App`. Text-to-image lives under Creation
 * (`/app/creation/text-to-image*`) — see `creation_page.tsx`.
 *
 * Legacy URL backwards-compat: when `parseAppPathname` redirects (root `/`,
 * old demo paths, deprecated message paths …) we must preserve the original
 * `?query` and `#hash` so URL-driven experiment parameters still apply on
 * the canonical `/app/<tab>` path.
 */
export default function RootAppEntry() {
  const { parsed, pathname, navigate } = useAppNavigation();

  useEffect(() => {
    if (parsed.kind === "redirect") {
      const search = typeof window === "undefined" ? "" : window.location.search;
      const hash = typeof window === "undefined" ? "" : window.location.hash;
      navigate(`${parsed.to}${search}${hash}`, { replace: true });
    }
  }, [parsed, navigate]);

  if (parsed.kind === "redirect") {
    return null;
  }

  const standalonePath = pathname.replace(/\/+$/, "") || "/";
  if (standalonePath === PHOTO_TEXT_DETAIL_PATH) {
    return (
      <VisitorProfileProvider>
        <App overlay={<PhotoTextDetailRoutePage overlay />} />
      </VisitorProfileProvider>
    );
  }

  return (
    <VisitorProfileProvider>
      <App />
    </VisitorProfileProvider>
  );
}
