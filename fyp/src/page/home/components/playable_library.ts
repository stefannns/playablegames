/**
 * The Flora playable library games, vendored into public/resource/playable-library/<n>/ by
 * scripts/playable-library/mirror_flora_library.py (each <n>/index.html forwards to that game's entry).
 * Titles follow each game's own start screen; captions are feed copy.
 */
const game = (n: string, title: string, description: string) =>
  ({ src: `/resource/playable-library/${n}/index.html`, title, description }) as const;

export const PLAYABLE_LIBRARY = {
  "playable-lib-01": game("01", "Rage Release", "Scream it out 😤 How angry are you, really?"),
  "playable-lib-02": game("02", "Symphony Sketchpad", "Draw something and hear it turn into music 🎶"),
  "playable-lib-03": game("03", "My Album", "Turn your photos into a personal post office 📮"),
  "playable-lib-04": game("04", "Emoji Maker", "Build an emoji that looks just like you 🙂"),
  "playable-lib-05": game("05", "Kaleidoscope", "Drag to draw your own kaleidoscope ✨"),
  "playable-lib-06": game("06", "DIY Studio", "Decorate it your way 🎨"),
  "playable-lib-07": game("07", "The Sorting Hat", "Which Hogwarts house are you? 🎩"),
  "playable-lib-08a": game("08a", "Your Parallel Career", "Meet the other you 🪞"),
  "playable-lib-08b": game("08b", "How Old Is My Ear?", "Find out your hearing age 👂"),
  "playable-lib-09": game("09", "Custom Drink", "Mix a drink that matches your vibe 🧋"),
  "playable-lib-10a": game("10a", "Complete the Picture", "Can you guess the other half? ✏️"),
  "playable-lib-11a": game("11a", "Animal Grove", "Solve the mystery in the grove 🐷🔍"),
  "playable-lib-10b": game("10b", "Coinnects Numbers", "Connect every tile in order 🔢"),
  "playable-lib-11b": game("11b", "National Jersey Challenge", "Match each player to their jersey ⚽"),
  "playable-lib-12": game("12", "Color Hunt", "Find your color before time runs out 🎨"),
  "playable-lib-13": game("13", "Memory Mission", "How good is your memory? 🧠"),
  "playable-lib-14": game("14", "Don't Get Caught", "Keep your eyes on the jewels 💎🤫"),
  "playable-lib-15": game("15", "Pancake Time", "Pour, spread, cook 🥞"),
  "playable-lib-16": game("16", "Emoji Merge Blast", "Merge the emojis, chase the high score 💥"),
  "playable-lib-17": game("17", "3D Perspective Puzzle", "Rotate the fragments until it clicks 🧩"),
  "playable-lib-18": game("18", "ASMR Garden", "Paint grass, water and flowers 🌿"),
  "playable-lib-19": game("19", "The Little Diner", "Sizzle up the perfect hot dog 🌭"),
  "playable-lib-20": game("20", "The ASMR Studio", "Crispy squeeze, satisfying slice 🔪"),
  "playable-lib-21": game("21", "Hidden in Plain Sight", "Minesweeper, but it's a photo 💣"),
  "playable-lib-22": game("22", "Guess the Star", "Who's that footballer? ⚽"),
  "playable-lib-23": game("23", "Character Crossword", "A quick crossword break ✍️"),
  "playable-lib-24": game("24", "My Handmade Pizza", "Make a pizza for your bestie 🍕"),
  "playable-lib-25": game("25", "Milan Room Makeover", "€350 a month — make it home 🛋️"),
  "playable-lib-26": game("26", "The Dinner Club", "Spin to decide what's for dinner 🍝"),
} as const;
