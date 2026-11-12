import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import ts from 'typescript';

const root = resolve(import.meta.dirname, '../..');
const source = readFileSync(resolve(root, 'src/page/home/components/playable_local_games.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
new Function('exports', compiled)(exports);
const games = Object.entries(exports.PLAYABLE_LOCAL_GAMES);
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const require = createRequire(import.meta.url);

test('two distinct games have stable, self-contained local entries', () => {
  assert.deepEqual(games.map(([id]) => id), ['playable-local-one-stroke', 'playable-local-neon-swing']);
  for (const [, game] of games) {
    assert.match(game.src, /^\/resource\/playable-local\/[a-z-]+\/game.html$/);
    const entry = resolve(root, 'public', game.src.slice(1));
    const html = readFileSync(entry, 'utf8');
    assert.match(html, /pocket-host\.js["'] data-seed-random="off"/);
    assert.ok(html.indexOf('pocket-host.js') < html.indexOf('bundle.js'));
    assert.ok(existsSync(resolve(entry, '../game.config.json')));
    assert.ok(existsSync(resolve(entry, '../assets/fonts/poppins/Poppins-Regular.woff2')));
  }
});

test('game bundles and configurations stay byte-identical to the current review copies', () => {
  const review = resolve(root, '../2026-10-05-all-files-review');
  const originals = [
    'playable2_20260927020828_5pmrhn/playable2_20260927020828_5pmrhn',
    'playable2_20261013020814_twgfzt',
  ];
  games.forEach(([, game], index) => {
    const folder = resolve(root, 'public', game.src.slice(1), '..');
    for (const file of ['bundle.js', 'game.config.json']) {
      assert.equal(hash(resolve(folder, file)), hash(resolve(review, originals[index], file)));
    }
  });
});

test('both games are registered in content and placed before the unchanged library', () => {
  const registry = readFileSync(resolve(root, 'src/page/home/components/playable_content.ts'), 'utf8');
  const feed = readFileSync(resolve(root, 'src/page/home/components/feed_item_card.config.ts'), 'utf8');
  assert.match(registry, /\.\.\.PLAYABLE_LOCAL_GAMES/);
  assert.match(feed, /return \[\.\.\.localGames, \.\.\.items\.slice\(0, at\), \.\.\.games, \.\.\.items\.slice\(at\)\]/);
  assert.match(readFileSync(resolve(root, 'src/page/creation/playable_game_frame.tsx'), 'utf8'), /src\.startsWith\("\/resource\/playable-library\/"\)/);
  assert.match(readFileSync(resolve(root, 'src/page/creation/playable_game_frame.tsx'), 'utf8'), /src\.startsWith\("\/resource\/playable-local\/"\)/);
  assert.match(readFileSync(resolve(root, 'scripts/cdn/minitt_resource_cdn_build_plugin.mjs'), 'utf8'), /new Set\(\['playable-library', 'playable-local'\]\)/);
  assert.match(readFileSync(resolve(root, 'scripts/cdn/upload_minitt_resource_cdn.py'), 'utf8'), /SELF_CONTAINED_DIRS = \("playable-library", "playable-local"\)/);
  assert.ok(require.resolve('typescript'));
});
