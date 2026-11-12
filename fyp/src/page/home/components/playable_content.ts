import { PLAYABLE_LIBRARY } from "./playable_library";
import { PLAYABLE_LOCAL_GAMES } from "./playable_local_games";
import { PLAYABLE_BATCH_GAMES } from "./playable_batch_games";
import { PLAYABLE_PILOT_GAMES } from "./playable_pilot_games";

/** Each playable owns its HTML source; feed and interaction share one stage. */
export const PLAYABLE_CONTENT = {
  "playable-pumpkin": { src: "/resource/playable-feed/pocket-F3950QIMH-game.html", title: "Pumpkin carving game", description: "Carve your own jack-o'-lantern 🎃" },
  "playable-hotpot": { src: "/resource/playable-feed/pocket-game.html", title: "Pocket lawn mowing game", description: "Treat me to hot pot!!! 🍲🥢" },
  "playable-rooftops": { src: "/resource/playable-feed/pocket-FxQaSVTWh-game.html", title: "Rooftop swinging game", description: "Swing across the rooftops!" },
  "playable-comic": { src: "/resource/playable-feed/pocket-Fzo2A3wUt-game.html", title: "Pocket Mangaka", description: "Create your own comic story." },
  ...PLAYABLE_LIBRARY,
  ...PLAYABLE_LOCAL_GAMES,
  ...PLAYABLE_BATCH_GAMES,
  ...PLAYABLE_PILOT_GAMES,
} as const;
export type PlayableContentId = keyof typeof PLAYABLE_CONTENT;
export function isPlayableContentId(id: string): id is PlayableContentId {
  return Object.hasOwn(PLAYABLE_CONTENT, id);
}
