import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  parseAppPathname,
  type AppRoute,
  type ParsedLocation,
} from "../routes/app_route_tree";

type NavigateOptions = {
  replace?: boolean;
};

type AppNavigationContextValue = {
  pathname: string;
  parsed: ParsedLocation;
  route: AppRoute | null;
  navigate: (path: string, options?: NavigateOptions) => void;
};

const AppNavigationContext = createContext<AppNavigationContextValue | null>(null);

export function AppNavigationProvider({ children }: { children: ReactNode }) {
  const [pathname, setPathname] = useState(
    () => (typeof window === "undefined" ? "/" : window.location.pathname),
  );

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((path: string, options?: NavigateOptions) => {
    const next = path.startsWith("/") ? path : `/${path}`;
    if (options?.replace) {
      window.history.replaceState(null, "", next);
    } else {
      window.history.pushState(null, "", next);
    }
    setPathname(next);
  }, []);

  const parsed = useMemo(() => parseAppPathname(pathname), [pathname]);

  const route = useMemo((): AppRoute | null => {
    if (parsed.kind !== "app") return null;
    return parsed.route;
  }, [parsed]);

  const value = useMemo(
    (): AppNavigationContextValue => ({
      pathname,
      parsed,
      route,
      navigate,
    }),
    [pathname, parsed, route, navigate],
  );

  return (
    <AppNavigationContext.Provider value={value}>{children}</AppNavigationContext.Provider>
  );
}

export function useAppNavigation(): AppNavigationContextValue {
  const ctx = useContext(AppNavigationContext);
  if (!ctx) {
    throw new Error("useAppNavigation must be used within AppNavigationProvider");
  }
  return ctx;
}
