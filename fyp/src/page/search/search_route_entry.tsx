import { useAppNavigation } from "../../context/app_navigation";
import {
  appPathForRoute,
  appPathForTab,
  type AppRoute,
} from "../../routes/app_route_tree";
import { SearchConfigControls } from "./components/search_config_controls";
import SearchMiddlePage from "./search_middle_page";
import SearchResultLandingStack from "./search_result_landing_stack";

export function isHomeSearchRoute(route: AppRoute | null): boolean {
  return (
    route?.tab === "home" &&
    (route.sub.screen === "search-middle" ||
      route.sub.screen === "search-result" ||
      route.sub.screen === "search-landing")
  );
}

export function SearchHomeTabPage({
  route,
  isTabActive,
}: {
  route: AppRoute | null;
  isTabActive: boolean;
}) {
  const { navigate } = useAppNavigation();

  if (route?.tab !== "home") return null;

  if (
    route.sub.screen === "search-result" ||
    route.sub.screen === "search-landing"
  ) {
    return <SearchResultLandingStack route={route} isTabActive={isTabActive} />;
  }

  if (route.sub.screen === "search-middle") {
    return (
      <SearchMiddlePage
        isTabActive={isTabActive}
        onBack={() => navigate(appPathForTab("home"))}
        onOpenResults={() =>
          navigate(
            appPathForRoute({
              tab: "home",
              sub: { screen: "search-result" },
            }),
          )
        }
      />
    );
  }

  return null;
}

export function SearchRouteConfigControls({ route }: { route: AppRoute | null }) {
  if (route?.tab !== "home" || route.sub.screen !== "search-result") {
    return null;
  }

  return <SearchConfigControls />;
}
