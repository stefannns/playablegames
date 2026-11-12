/** Named, stable-ID playlists. A showcase never changes the normal review feed. */
export const CREATURE_DRAW_IDS = Object.freeze([
  'playable2_20261001230052_xrken6b',
  'playable_20260924213804_34rslj',
]);
export const TIME_CAMERA_ID = 'playable2_20261013020955_2hyyml';
const playlists = new Map([
  ['creature-draw', CREATURE_DRAW_IDS],
  ['creature-sandbox', [CREATURE_DRAW_IDS[0]]],
  ['draw-face', [CREATURE_DRAW_IDS[1]]],
  ['time-camera', [TIME_CAMERA_ID]],
  ['catch-the-beat', ['catch-the-beat-pilot']],
  ['pet-me-cat', ['pet-me-cat-preview']],
]);
export function showcaseGameCount(search) {
  return playlists.get(new URLSearchParams(search).get('showcase'))?.length ?? null;
}
export function showcaseFrameSource(id, source, search) {
  const params = new URLSearchParams(search);
  const ids = playlists.get(params.get('showcase'));
  if (!ids || !ids.some(taskId => id === 'playable-batch-' + taskId)) return source;
  const revision = params.get('revision') || 'creature-draw-20261019-1';
  const tag = /^[a-zA-Z0-9_-]{1,64}$/.test(revision) ? revision : 'creature-draw-20261019-1';
  const src = new URL(source, 'https://review.invalid');
  src.searchParams.set('showcaseRevision', tag);
  return src.pathname + src.search + src.hash;
}
export function selectReviewShowcase(entries, search) {
  const params = new URLSearchParams(search);
  const ids = playlists.get(params.get('showcase'));
  if (!ids) return null;
  return ids.map(taskId => {
    const entry = entries.find(([, game]) => game.taskId === taskId);
    if (!entry) throw new Error('Missing showcase game: ' + taskId);
    const [id, game] = entry;
    return [id, {...game, src: showcaseFrameSource(id, game.src, search)}];
  });
}
