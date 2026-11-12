/** Dev-only, live-mounted conversion pilot. Never copied to the production resource catalog. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const pilotRoot = fileURLToPath(new URL('../../../2026-10-20-catch-the-beat-playable/game/', import.meta.url));
export const pilotPrefix = '/resource/playable-pilot/catch-the-beat/';
const types = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.wasm':'application/wasm', '.tflite':'application/octet-stream', '.png':'image/png', '.webp':'image/webp', '.mp3':'audio/mpeg', '.woff2':'font/woff2'};

export function pilotFileForRequest(url) {
  const raw = (url || '').split('?')[0];
  if (!raw.startsWith(pilotPrefix)) return undefined;
  let relative;
  try { relative = decodeURIComponent(raw.slice(pilotPrefix.length)); } catch { return null; }
  if (!relative || relative.includes('\\') || relative.split('/').some(part => !part || part.startsWith('.'))) return null;
  const file = path.resolve(pilotRoot, relative);
  try {
    const realRoot = fs.realpathSync(pilotRoot), realFile = fs.realpathSync(file);
    return realFile.startsWith(realRoot + path.sep) && fs.statSync(realFile).isFile() ? realFile : null;
  } catch { return null; }
}

export function pilotPreview() {
  return {
    name: 'catch-the-beat-local-pilot',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const file = pilotFileForRequest(req.url);
        if (file === undefined) return next();
        if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, {'Allow':'GET, HEAD'}).end(); return; }
        if (!file) { res.writeHead(404).end('Pilot asset not found'); return; }
        res.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream', 'Content-Length':fs.statSync(file).size, 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff'});
        if (req.method === 'HEAD') { res.end(); return; }
        const stream = fs.createReadStream(file);
        stream.on('error', () => res.destroy());
        stream.pipe(res);
      });
    },
  };
}
