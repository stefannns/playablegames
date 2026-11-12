/** Opt-in review-only pool. Never changes the registry or ordinary feed. */
export function selectReviewPool(entries, search) {
  const params = new URLSearchParams(search);
  if (params.get('review') !== 'batch' || !params.has('reviewPool')) return entries;
  const requested = new Set((params.get('reviewPool') || '').split(',').slice(0, 256)
    .filter(id => /^[a-zA-Z0-9_-]{1,128}$/.test(id)));
  const selected = entries.filter(([, game]) => requested.has(game.taskId));
  // An invalid/empty opt-in must not silently widen to every game or crash the
  // looping pager. Fall back to exactly the first registered review game.
  return selected.length ? selected : entries.slice(0, 1);
}
