import PagePushStage, { usePagePushStage } from "../../hooks/page_push";
import { useTwoLevelRouteStackSync } from "../../hooks/sync_route_page_stack";
import { useAppNavigation } from "../../context/app_navigation";
import { appPathForRoute, type AppRoute } from "../../routes/app_route_tree";
import { SearchResultPage } from "./search_middle_page";
import SearchLandingPage from "./search_landing_page";

type SearchResultLandingStackProps = {
  route: AppRoute | null;
  isTabActive?: boolean;
};

const RESULT_KEY = "search-result";
const LANDING_KEY = "search-landing";

export default function SearchResultLandingStack({
  route,
  isTabActive = true,
}: SearchResultLandingStackProps) {
  const { navigate } = useAppNavigation();

  function buildResultPage() {
    return (
      <SearchResultPage
        isTabActive={isTabActive}
        onBack={() =>
          navigate(appPathForRoute({ tab: "home", sub: { screen: "search-middle" } }))
        }
        onOpenLanding={() => {
          markStackNavigation();
          navigate(
            appPathForRoute({ tab: "home", sub: { screen: "search-landing" } }),
          );
          push({
            outgoingKey: RESULT_KEY,
            outgoingPage: buildResultPage(),
            incomingKey: LANDING_KEY,
            incomingPage: buildLandingPage(),
          });
        }}
      />
    );
  }

  function buildLandingPage() {
    return (
      <SearchLandingPage
        isTabActive={isTabActive}
        onBack={() => {
          markStackNavigation();
          navigate(
            appPathForRoute({ tab: "home", sub: { screen: "search-result" } }),
            { replace: true },
          );
          pop({
            incomingPage: buildResultPage(),
            outgoingPage: buildLandingPage(),
          });
        }}
      />
    );
  }

  const pageStage = usePagePushStage({
    initialKey: RESULT_KEY,
    pageOffset: "28%",
    initialPage: buildResultPage(),
  });
  const { push, pop, reset, isTransitioning } = pageStage;

  const { markStackNavigation } = useTwoLevelRouteStackSync({
    tab: "home",
    route,
    pages: pageStage.pages,
    isTransitioning,
    rootKey: RESULT_KEY,
    detailKey: () => LANDING_KEY,
    detailIdFromStackKey: (key) => (key === LANDING_KEY ? "landing" : null),
    getDetailId: (nextRoute) =>
      nextRoute.tab === "home" && nextRoute.sub.screen === "search-landing"
        ? "landing"
        : null,
    buildRoot: buildResultPage,
    buildDetail: buildLandingPage,
    push,
    pop,
    reset,
  });

  return <PagePushStage manager={pageStage} />;
}
