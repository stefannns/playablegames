/**
 * [INPUT]: depends on Vite, React, vite-plugin-pwa, and the Mini TT CDN resource plugins.
 * [OUTPUT]: exports the Vite config; remote-first /resource — dev falls back to CDN, build rewrites to CDN by default;
 *           dev also serves /api/playable/generate (Claude, key from .env.local ANTHROPIC_API_KEY, never bundled).
 *           local /app/home?review=batch reuses the published FYP-only shell and its measured navigation inset.
 * [POS]: project build boundary; owns /resource protocol routing for dev and production output.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { cdnResourceBuild, devCdnResourceFallback } from './scripts/cdn/minitt_resource_cdn_build_plugin.mjs'
import { playableGenerateDevPlugin } from './scripts/playable-gen/playable_generate_dev_plugin.mjs'
import { reviewDevEntry } from './scripts/playable-library/review_dev_entry.mjs'

/** Remote-first default; override via VITE_MINITT_RESOURCE_CDN_BASE (set it empty for a self-contained local build). */
/* Owner segment is case-sensitive: lowercase `nuhboeh7uhopg` = zihan.huang's console-visible fast-deliver space. */
const DEFAULT_MINITT_CDN_BASE =
  'https://lf3-static.bytednsdoc.com/obj/eden-cn/nuhboeh7uhopg/desagent/minitt/v1'

function normalizeCdnBase(value: string | undefined): string {
  return (value ?? '').trim().replace(/\/+$/, '')
}

function envValue(name: string): string | undefined {
  return (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[name]
}

/** Dev only: inject LAN origin for QR when the tab uses localhost. */
function devLanOriginForQr(): Plugin {
  return {
    name: 'dev-lan-origin-for-qr',
    apply: 'serve',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const networkUrl = ctx.server?.resolvedUrls?.network[0]
        if (!networkUrl) return html
        const origin = networkUrl.replace(/\/$/, '')
        const tag = `<script>window.__DEV_LAN_ORIGIN__=${JSON.stringify(origin)};</script>`
        return html.replace('<head>', `<head>\n    ${tag}`)
      },
    },
  }
}

/** Dev: avoid stale MP4 when replacing files under public/resource/feed_video/. */
function devNoCacheFeedVideo(): Plugin {
  return {
    name: 'dev-no-cache-feed-video',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req as { url?: string }).url?.split('?')[0] ?? ''
        if (url.startsWith('/resource/feed_video/') && url.endsWith('.mp4')) {
          res.setHeader('Cache-Control', 'no-store')
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const cdnBase = normalizeCdnBase(envValue('VITE_MINITT_RESOURCE_CDN_BASE') ?? DEFAULT_MINITT_CDN_BASE)
  if (mode === 'cdn' && !cdnBase) {
    throw new Error('VITE_MINITT_RESOURCE_CDN_BASE is required for `vite build --mode cdn`.')
  }
  const useCdnResources = Boolean(cdnBase)

  return {
    server: {
      host: true,
    },
    plugins: [
      reviewDevEntry(),
      devLanOriginForQr(),
      devNoCacheFeedVideo(),
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,woff2}'],
          globIgnores: ['**/resource/**'],
          // Playable games load /resource/*.html in iframes; never answer those with the app shell.
          navigateFallbackDenylist: [/^\/resource\//],
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          runtimeCaching: useCdnResources
            ? []
            : [
                {
                  urlPattern: /\/resource\/feed_video\/.*\.mp4(?:\?.*)?$/i,
                  handler: 'NetworkFirst',
                  options: {
                    cacheName: 'feed-video',
                    expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 7 },
                  },
                },
              ],
        },
        manifest: {
          name: 'tiktok_ux_demo',
          short_name: 'tux-demo',
          description: 'TUX demo (PWA)',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#ffffff',
          icons: [
            {
              src: '/apple-touch-icon.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        devOptions: {
          enabled: true,
        },
      }),
      ...(useCdnResources ? [cdnResourceBuild(cdnBase), devCdnResourceFallback(cdnBase)] : []),
      // Local demo only: real prompt → HTML playable generation. Reads the non-VITE_ key, so it stays server-side.
      playableGenerateDevPlugin(loadEnv(mode, '.', '').ANTHROPIC_API_KEY),
    ],
  }
})
