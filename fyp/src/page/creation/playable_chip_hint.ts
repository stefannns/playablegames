/**
 * Placeholder that trails a prompt made only of chips (no words yet).
 * Materials (images, memes) are the noun; add-ons describe how the game is played.
 * Fixed order — material first, then add-on — so insertion order never breaks the sentence.
 */
import { PLAYABLE_TRICKS } from "./playable_tricks_panel";

const ENDING = "to...";
/** Keyed by PLAYABLE_TRICKS index. `lead` opens an add-on-only hint, `how` follows a material. */
const ADDON_PHRASES: Record<number, { noun: string; how: string; lead: string }> = {
  0: { noun: "camera", how: "with the camera", lead: "Use the camera" },
  1: { noun: "tilt", how: "by tilting the phone", lead: "Tilt the phone" },
  2: { noun: "friends", how: "with friends", lead: "Play with friends" },
  3: { noun: "voice", how: "with your voice", lead: "Use your voice" },
};
/** More add-ons than this collapse to "these tricks" so the hint never outgrows the prompt. */
const MAX_NAMED_ADDONS = 2;

function addonPhrase(index: number) {
  const noun = PLAYABLE_TRICKS[index]?.label.toLowerCase() ?? "trick";
  return ADDON_PHRASES[index] ?? { noun, how: `with the ${noun}`, lead: `Use the ${noun}` };
}

function material(images: number, memes: number) {
  if (images && memes) return "these pictures";
  if (images) return images > 1 ? "these images" : "this image";
  if (memes) return memes > 1 ? "these memes" : "this meme";
  return null;
}

function addons(indices: number[], afterMaterial: boolean) {
  if (!indices.length) return null;
  if (indices.length > MAX_NAMED_ADDONS) return afterMaterial ? "with these tricks" : "Use these tricks";
  if (indices.length === 1) return afterMaterial ? addonPhrase(indices[0]).how : addonPhrase(indices[0]).lead;
  const nouns = indices.map(index => addonPhrase(index).noun).join(" and ");
  return afterMaterial ? `with the ${nouns}` : `Use the ${nouns}`;
}

/** `chips` are the editor's top-level prompt chips; null when no hint applies. */
export function chipHint(chips: HTMLElement[]) {
  const kinds = chips.map(chip => chip.dataset.kind);
  const images = kinds.filter(kind => kind === "image").length;
  const memes = kinds.filter(kind => kind === "meme").length;
  const addonIndices = [...new Set(chips.filter(chip => chip.dataset.kind === "addon").map(chip => Number(chip.dataset.index ?? 0)))];
  const noun = material(images, memes);
  const how = addons(addonIndices, !!noun);
  if (noun) return `Use ${noun}${how ? ` ${how}` : ""} ${ENDING}`;
  return how ? `${how} ${ENDING}` : null;
}
