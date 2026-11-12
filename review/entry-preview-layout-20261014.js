/* Layout and static guidance only. Preview demonstrations are stored, not loaded. */
(() => {
  'use strict';
  const mode = document.currentScript?.getAttribute('data-entry-demo');
  if (!['face', 'one-stroke', 'dumpling'].includes(mode)) return;
  const html = document.documentElement;
  const host = !!document.querySelector('script[src*="playable-batch/review-host.js"]') || new URLSearchParams(location.search).get('feedReview') === '1';
  let interacted = false, compactGuide = null;
  html.toggleAttribute('data-entry-feed-preview', host);
  const style = document.createElement('style');
  style.textContent = `
    html[data-entry-feed-preview] .face-game__header{position:absolute;top:12%;left:30px;right:30px;padding:0}
    html[data-entry-feed-preview] .face-game__prompt{font-size:18px;line-height:1.4}
    html[data-entry-feed-preview] #draw-workspace{position:absolute;top:27%;bottom:27%;left:30px;right:30px;padding:0}
    html[data-entry-feed-preview] #draw-toolbar{visibility:hidden}
    html[data-entry-feed-preview] .one-stroke-hud{position:absolute!important;top:12%!important;left:30px!important;right:30px!important;width:auto!important;min-height:42px!important;padding:0!important}
    html[data-entry-feed-preview] .one-stroke-hud button{visibility:hidden}
    html[data-entry-feed-preview] .one-stroke-board{position:absolute!important;inset:28% 30px 32% 30px!important;width:auto!important}
    .entry-demo-copy{display:none;pointer-events:none}
    html[data-entry-feed-preview] .one-stroke-guide{visibility:hidden!important}
    html[data-entry-feed-preview] .entry-demo-copy{display:block;position:absolute;top:70%;left:30px;right:30px;margin:0;font-size:18px;line-height:1.5;font-weight:600;text-align:center;color:var(--text-sub)}
    html[data-entry-feed-preview] .dh-hud{top:12%!important;right:30px!important}
    html[data-entry-feed-preview] .dh-hud span[aria-hidden=true]{display:none}
    html[data-entry-feed-preview] .dh-guide{top:23%!important;right:30px!important}
    html[data-entry-feed-preview] .dh-board{inset:36% 30px 26% 30px!important}
    html[data-entry-feed-preview] .dh-dumpling{width:28px!important;height:28px!important}
    html[data-entry-feed-preview] .dh-guide span{font-size:18px;line-height:1.35}
    html[data-entry-demo-stopped] .entry-demo-copy{display:none}
  `;
  document.head.append(style);
  function attachGuide() {
    if (!host || mode !== 'one-stroke' || interacted || compactGuide) return;
    const board = document.querySelector('.one-stroke-board');
    if (!board) return;
    compactGuide = document.createElement('p'); compactGuide.className = 'entry-demo-copy';
    compactGuide.textContent = 'Connect in one stroke';
    board.parentElement.append(compactGuide);
    observer.disconnect();
  }
  const observer = new MutationObserver(attachGuide);
  if (host && mode === 'one-stroke') { observer.observe(document.getElementById('root'), {childList:true,subtree:true}); attachGuide(); }
  window.PlayableEntryPreview = {stop() { interacted = true; html.setAttribute('data-entry-demo-stopped',''); observer.disconnect(); }};
  window.addEventListener('message', event => {
    if (!host || event.source !== parent || event.origin !== location.origin || event.data?.type !== 'playable-active') return;
    html.toggleAttribute('data-entry-feed-preview', event.data.active !== true);
  });
  window.addEventListener('pagehide', () => observer.disconnect(), {once:true});
})();
