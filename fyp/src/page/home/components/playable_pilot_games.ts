/** Local conversion pilots are opt-in showcases, never part of the batch catalog. */
export const PLAYABLE_PILOT_GAMES = {
  "playable-batch-pet-me-cat-preview": {
    taskId: "pet-me-cat-preview",
    src: "/resource/playable-batch/pet-me-cat-preview/game.html?review=cat-20261020",
    title: "Pet Me · Cat",
    description: "A little grooming for a very sleepy cat.",
  },
  "playable-batch-catch-the-beat-pilot": {
    taskId: "catch-the-beat-pilot",
    src: "/resource/playable-pilot/catch-the-beat/game.html?host=fyp",
    title: "Catch the Beat",
    description: "Your face. Your moves. Catch the beat.",
  },
} as const;
