/** Use the published FYP shell for local batch review, not the full app's in-flow Tabbar. */
import {pilotPreview} from './pilot_preview.mjs';

export function reviewDevEntryHtml(html, originalUrl) {
  if (!originalUrl) return html;
  let url;
  try {
    url = new URL(originalUrl, 'http://localhost');
  } catch {
    return html;
  }
  if (!['/app/home', '/app/home/'].includes(url.pathname) || url.searchParams.get('review') !== 'batch') return html;
  return html.replace('src="/src/main.tsx"', 'src="/src/portfolio_fyp_main.tsx"');
}

export function reviewDevEntry() {
  return {
    name: 'playable-batch-review-dev-entry',
    apply: 'serve',
    // The opt-in pilot stays live-synced without changing the build config or resource catalog.
    configureServer: pilotPreview().configureServer,
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        return reviewDevEntryHtml(html, ctx.originalUrl);
      },
    },
  };
}
