import { PLAYABLE_CONTENT } from "../home/components/playable_content";

/** Each color owns a prompt and the referenced trick/meme selection. */
export const CAMERA_TOKEN = "\uFFFC";
export const DUCK_TOKEN = "\uE000";
export const EMPTY_BULB = "/resource/playable/bulbs/off.png";
/** Character-photo chip (Figma 25162:296172) and replies stepper (Figma 24980:274087). */
export const PHOTO_TOKEN = "\uE001";
export const COUNT_TOKEN = "\uE002";
export const CHARACTER_PHOTO = "/resource/playable/ideas/character-photo.png";
/** Entry prompt first, then one design frame per bulb tap; gray bulb (empty) closes the loop. */
export const PLAYABLE_IDEAS = [
  { color: "Pink", bulb: "/resource/playable/bulbs/on_04.png", trick: 0, meme: 0,
    prompt: `Using ${CAMERA_TOKEN} to turn player into a duck like the meme ${DUCK_TOKEN} with signature look.` },
  // Figma 24971:271636
  { color: "Cyan", bulb: "/resource/playable/bulbs/on_05.png", trick: 4, meme: 0,
    prompt: `Drag to shape spinning clay into a ${CAMERA_TOKEN} then paint, fire and score.` },
  // Figma 24971:272162
  { color: "Blue", bulb: "/resource/playable/bulbs/on_06.png", trick: 2, meme: 0,
    prompt: `Play snake with ${CAMERA_TOKEN} , you are the head, eat friends to grow your tail.` },
  // Figma 25162:295927
  { color: "Purple", bulb: "/resource/playable/bulbs/on_07.png", trick: 1, meme: 0,
    prompt: `Using ${PHOTO_TOKEN} this as character to create a 3D Spider-man game ${CAMERA_TOKEN} to steer movement and web-swinging.` },
  // Figma 24971:272725
  { color: "Mint", bulb: "/resource/playable/bulbs/on_08.png", trick: 2, meme: 0,
    prompt: `Chat 1-on-1 with ${CAMERA_TOKEN} , pick from ${COUNT_TOKEN} replies each turn, then get a recap.` },
] as const;

/**
 * Ideas whose generation already has a real playable; the rest fall back to demo art. Spider-man is the
 * feed's rooftops game, patched (…-tweakable.html) to take live physics multipliers from the Modify sheet.
 */
const IDEA_GAMES: Partial<Record<number, { src: string; title: string }>> = {
  3: { src: "/resource/playable-feed/pocket-FxQaSVTWh-game-tweakable.html", title: PLAYABLE_CONTENT["playable-rooftops"].title },
};
/** The Spider-man game recolored into a primeval forest (sky, fog, ground, trunk-like towers). */
const FOREST_GAME = { src: "/resource/playable-feed/pocket-FxQaSVTWh-game-forest.html", title: "Forest swinging game" };
/** Demo follow-up edit: asking the Spider-man game for a forest returns its forest build; anything else stays demo art. */
export function followUpGame(base: { src: string } | undefined, text: string) {
  return base?.src === IDEA_GAMES[3]?.src && /森林|丛林|forest|jungle/i.test(text) ? FOREST_GAME : undefined;
}
/** A prompt's words without chips or spacing, so chip swaps (Tilt ↔ Camera, photo) don't change the match. */
const promptWords = (text: string) => text.replace(/[\s\u200B\uFFFC\uE000-\uE002\uE100-\uF8FF]/g, "");
/** The real game behind a prompt, when it is one of the ideas above with its text left as suggested. */
export function ideaGame(prompt: string) {
  return IDEA_GAMES[PLAYABLE_IDEAS.findIndex(idea => promptWords(idea.prompt) === promptWords(prompt))];
}
