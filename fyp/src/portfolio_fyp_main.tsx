/** Portfolio review: native FYP with original display-only navigation chrome. */
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {TUXApp} from '@byted-tiktok/tux-web';
import './index.css';
import './App.css';
import '@byted-tiktok/tux-web/styles.css';
import AppFrame from './components/sys/app_frame';
import {AppChromeStatusBar} from './components/sys/status_bar';
import {SoftKeyboardProvider} from './components/sys/soft_keyboard';
import {AppNavigationProvider} from './context/app_navigation';
import {ThemeProvider,useTheme} from './context/theme';
import {VisitorProfileProvider} from './context/visitor_profile';
import HomePage from './page/home/home_page';
import {PortfolioFeedNavigation} from './components/app/portfolio_feed_navigation';
import {initDesagentEmbedRuntime} from './utils/desagent_embed';
import {syncStandaloneDisplayModeDataAttr} from './utils/display_mode';

initDesagentEmbedRuntime();
syncStandaloneDisplayModeDataAttr();
document.addEventListener('dragstart',event=>{if(event.target instanceof HTMLImageElement)event.preventDefault();},{capture:true});
function FypReview(){
  const {resolvedTheme}=useTheme();
  return <TUXApp theme={resolvedTheme} textDirection="ltr" platform="iOS">
    <AppFrame frameOverlays={<AppChromeStatusBar/>}>
      <div className="relative h-full min-h-0 min-w-0" style={{'--app-tabbar-height':'var(--app-frame-bottom-inset)'} as React.CSSProperties}>
        <HomePage fypOnly feedNavigation={<PortfolioFeedNavigation/>}/>
      </div>
    </AppFrame>
  </TUXApp>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><ThemeProvider><AppNavigationProvider><SoftKeyboardProvider><VisitorProfileProvider><FypReview/></VisitorProfileProvider></SoftKeyboardProvider></AppNavigationProvider></ThemeProvider></StrictMode>);
