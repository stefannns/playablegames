/**
 * Hand-off from a feed playable's Remix sheet to the Playable composer: the playable being remixed.
 * The composer consumes it once on entry and shows that playable as a cover where the idea bulb sits.
 */
export type PlayableRemixSource = { src: string; title: string };

let pendingRemix: PlayableRemixSource | null = null;

export function setPlayableRemixSource(source: PlayableRemixSource) {
  pendingRemix = source;
}

/** Returns the pending source (if any) and clears it, so later visits open the normal composer. */
export function takePlayableRemixSource(): PlayableRemixSource | null {
  const source = pendingRemix;
  pendingRemix = null;
  return source;
}
