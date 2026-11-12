/**
 * [INPUT]: depends on Vite build output, the CDN audit manifest, upload_minitt_resource_cdn.py, and a CDN base.
 * [OUTPUT]: exports cdnResourceBuild (dedup-uploads new media before bundling — fails closed, never ships 404s —
 *           then rewrites /resource media references and removes media from dist/resource; non-media
 *           resources such as playable game HTML/JS stay in dist and deploy with the site; self-contained
 *           dirs (playable-library and playable-local: games with relative media) are skipped entirely)
 *           and devCdnResourceFallback (dev middleware: local file first, 302 to CDN when missing).
 * [POS]: scripts/cdn build helper; keeps Node fs usage out of vite.config.ts type checking.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const MANIFEST_PATH = new URL('./minitt-resource-cdn-manifest.json', import.meta.url)
const UPLOADER_PATH = fileURLToPath(new URL('./upload_minitt_resource_cdn.py', import.meta.url))
const MEDIA_SUFFIXES = new Set(['.gif', '.jpg', '.jpeg', '.mp4', '.png', '.svg', '.webp'])
/** Vendored games under /resource that load media by relative path: shipped with the site untouched. */
const SELF_CONTAINED_DIRS = new Set(['playable-library', 'playable-local', 'playable-batch'])

const TEXT_OUTPUT_EXTENSIONS = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.map',
  '.mjs',
  '.svg',
  '.txt',
  '.webmanifest',
  '.xml',
])

/**
 * `/resource/` prefixes that point at non-media files (playable game .html/.js, which the CDN uploader
 * doesn't handle) keep their site-relative path; everything else — including dynamic prefixes like
 * `/resource/avatar/${id}.png` — moves to the CDN.
 */
const RESOURCE_PREFIX = /\/resource\/(?![^"'`\s]*\.(?:html|js)["'`?#\s])/g

/** Drop media from dist/resource (served by the CDN); keep the files that ship with the site. */
function removeMediaResources(dir, top = true) {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir)) {
    if (top && SELF_CONTAINED_DIRS.has(entry)) continue
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      removeMediaResources(path, false)
      if (!readdirSync(path).length) rmSync(path, { recursive: true, force: true })
    } else if (MEDIA_SUFFIXES.has(extname(path).toLowerCase())) {
      rmSync(path, { force: true })
    }
  }
}

function rewriteResourceReferences(root, cdnBase) {
  if (!existsSync(root)) return
  for (const entry of readdirSync(root)) {
    const path = join(root, entry)
    if (SELF_CONTAINED_DIRS.has(entry) && root.endsWith(`${sep}resource`)) continue
    const stat = statSync(path)
    if (stat.isDirectory()) {
      rewriteResourceReferences(path, cdnBase)
      continue
    }
    if (!TEXT_OUTPUT_EXTENSIONS.has(extname(path))) continue
    const source = readFileSync(path, 'utf-8')
    const next = source.replace(RESOURCE_PREFIX, `${cdnBase}/`)
    if (next !== source) writeFileSync(path, next)
  }
}

/** List local media files whose content is not yet on the CDN per the manifest. */
function collectUnsyncedMedia(resourceRoot) {
  if (!existsSync(resourceRoot)) return []
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'))
  const unsynced = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      if (dir === resourceRoot && SELF_CONTAINED_DIRS.has(entry)) continue
      const path = join(dir, entry)
      if (statSync(path).isDirectory()) {
        walk(path)
        continue
      }
      if (!MEDIA_SUFFIXES.has(extname(path).toLowerCase())) continue
      const rel = path.slice(resourceRoot.length + 1).split(sep).join('/')
      const known = manifest.assets?.[rel]
      const sha256 = createHash('sha256').update(readFileSync(path)).digest('hex')
      if (!known?.cdnUrl || known.sha256 !== sha256) unsynced.push(rel)
    }
  }
  walk(resourceRoot)
  return unsynced
}

export function cdnResourceBuild(cdnBase) {
  let root = ''
  let outDir = ''
  return {
    name: 'minitt-cdn-resource-build',
    apply: 'build',
    configResolved(config) {
      root = config.root
      outDir = resolve(config.root, config.build.outDir)
    },
    buildStart() {
      // Default behavior for EVERY CDN build (ours, DesAgent's, anyone's):
      // dedup-upload new/changed media before bundling. Fully synced tree = no-op, no credentials needed.
      const sync = spawnSync('python3', [UPLOADER_PATH], { cwd: root, stdio: 'inherit' })
      if (sync.status !== 0) {
        throw new Error(
          '[minitt-cdn] resource sync failed — new media could not reach the CDN, refusing to build a dist that would 404. ' +
            'Check the log above (office network/VPN is required for uploads) and rebuild.',
        )
      }
    },
    closeBundle() {
      // Failsafe: after a successful sync nothing may remain unsynced. Fail closed, never ship 404s.
      const unsynced = collectUnsyncedMedia(resolve(root, 'public/resource'))
      if (unsynced.length) {
        throw new Error(`[minitt-cdn] still not on CDN, refusing to publish 404s: ${unsynced.join(', ')}`)
      }
      rewriteResourceReferences(outDir, cdnBase)
      removeMediaResources(join(outDir, 'resource'))
    },
  }
}

/** Dev server: serve /resource from public/ when the file exists, otherwise 302 to the CDN. */
export function devCdnResourceFallback(cdnBase) {
  return {
    name: 'minitt-cdn-resource-dev-fallback',
    apply: 'serve',
    configureServer(server) {
      const resourceRoot = resolve(server.config.root, 'public/resource')
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0]
        if (!url.startsWith('/resource/')) return next()
        const rel = decodeURIComponent(url.slice('/resource/'.length))
        const localPath = resolve(resourceRoot, rel)
        if (localPath.startsWith(resourceRoot + sep) && existsSync(localPath)) return next()
        res.statusCode = 302
        res.setHeader('Location', `${cdnBase}/${rel.split('/').map(encodeURIComponent).join('/')}`)
        res.end()
      })
    },
  }
}
