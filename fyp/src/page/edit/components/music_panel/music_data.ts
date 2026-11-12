// Mock data for the TikTok music / sound selection panel (配乐面板).
// Mirrors the rows shown in the Figma default + selected states
// (file CMnRnFffiE3ju4hY704RM3, nodes 25536:66971 / 25536:67184).

export const MUSIC_TABS = [
  { itemKey: "hot", title: "Hot" },
  { itemKey: "foryou", title: "For you" },
  { itemKey: "favorites", title: "Favorites" },
  { itemKey: "recent", title: "Recent" },
] as const;

export type MusicTabKey = (typeof MUSIC_TABS)[number]["itemKey"];

export type MusicTrack = {
  id: string;
  title: string;
  artist: string;
  /** Pre-formatted post count, e.g. "102.2K". */
  posts: string;
  /** Clip length, mm:ss. */
  duration: string;
  /** 1-based slot into the local square-cover pool (localMusicCoverUrl). */
  coverSlot: number;
};

// Bottom mode bar (Original / Sound / Volume) — values read from Figma Dev Mode.
export const SOUND_MODES = [
  { key: "original", label: "Original" },
  { key: "sound", label: "Sound" },
  { key: "volume", label: "Volume" },
] as const;

export type SoundModeKey = (typeof SOUND_MODES)[number]["key"];

// Real cover art downloaded from Figma (public/resource/figma_covers/). The
// first 6 panel tracks map 1:1 to their Figma album art; everything else cycles.
const FIGMA_COVERS = ["01", "02", "03", "04", "05", "06", "07"].map(
  (n) => `/resource/figma_covers/cover-${n}.png`,
);
export const figmaCover = (slot: number): string =>
  FIGMA_COVERS[(((slot - 1) % FIGMA_COVERS.length) + FIGMA_COVERS.length) % FIGMA_COVERS.length];
export const FIGMA_BANNER = "/resource/figma_covers/banner-01.png";
export const FIGMA_FLOATING_COVER = "/resource/figma_covers/floating-01.png";

// Recent search history shown on the fullscreen search page (Figma node
// 25616:8643). Exact strings from the design.
export const SEARCH_HISTORY = [
  "supernatural song",
  "love and deep space",
  "apt",
  "what you want for me",
] as const;

// Discover page (Figma node 25616:8377) ----------------------------------
export const DISCOVER_TABS = ["For you", "Favorites", "More", "Your sounds"] as const;

export type Playlist = { name: string; coverSlot: number };

export const PLAYLISTS: Playlist[] = [
  { name: "TikTok Viral", coverSlot: 1 },
  { name: "Pop Hits", coverSlot: 2 },
  { name: "Hip-Hop", coverSlot: 3 },
  { name: "Chill Vibes", coverSlot: 4 },
  { name: "Workout", coverSlot: 5 },
  { name: "Throwback", coverSlot: 6 },
  { name: "R&B", coverSlot: 7 },
  { name: "Indie", coverSlot: 8 },
  { name: "Party", coverSlot: 9 },
];

// Cells on the Discover page (Figma "Cell/False", 84px). soundName/artist/duration.
export const DISCOVER_SOUNDS: MusicTrack[] = [
  { id: "alone-2", title: "Alone, Pt. II", artist: "Alan Walker & Ava Max", posts: "1.2M", duration: "01:00", coverSlot: 1 },
  { id: "blinding", title: "Blinding Lights", artist: "The Weeknd", posts: "3.4M", duration: "00:30", coverSlot: 2 },
  { id: "as-it-was", title: "As It Was", artist: "Harry Styles", posts: "2.8M", duration: "00:45", coverSlot: 3 },
  { id: "flowers", title: "Flowers", artist: "Miley Cyrus", posts: "4.1M", duration: "00:38", coverSlot: 4 },
  { id: "anti-hero", title: "Anti-Hero", artist: "Taylor Swift", posts: "5.0M", duration: "00:52", coverSlot: 5 },
  { id: "unholy", title: "Unholy", artist: "Sam Smith & Kim Petras", posts: "1.9M", duration: "00:36", coverSlot: 6 },
  { id: "calm-down", title: "Calm Down", artist: "Rema & Selena Gomez", posts: "2.2M", duration: "00:41", coverSlot: 7 },
  { id: "vampire", title: "vampire", artist: "Olivia Rodrigo", posts: "1.5M", duration: "00:33", coverSlot: 8 },
];

// Base pool for typed-search suggestions ("Search result" rows, Figma 25616:8656).
export const SEARCH_SUGGESTIONS = [
  "meow meeeeow meeeow",
  "supernatural song",
  "summer nights",
  "self aware",
  "love and deep space",
  "original sound",
  "sound effect",
  "slowed and reverb",
  "trending sounds",
  "viral songs 2025",
] as const;

// region Mock Data
// First 5 rows + durations match the Figma "Sounds 2025" node 9583:73791 exactly;
// the rest are mock entries to make the list scroll.
/** Camera-effect default; nav shows "Title - Artist" while the list row uses separate fields. */
export const CAMERA_EFFECT_SOUND_TRACK: MusicTrack = {
  id: "moment-of-truth",
  title: "Moment of Truth",
  artist: "Carlos Estella",
  posts: "12.4K",
  duration: "00:42",
  coverSlot: 1,
};

export const MUSIC_TRACKS: MusicTrack[] = [
  CAMERA_EFFECT_SOUND_TRACK,
  { id: "no-agreement", title: "No Agreement (Speed 0.8x)", artist: "Fela Kuti", posts: "102.2K", duration: "00:38", coverSlot: 1 },
  { id: "the-dreaming", title: "The Dreaming", artist: "Kate Bush", posts: "34.1K", duration: "02:14", coverSlot: 2 },
  { id: "long-live-asap", title: "Long. Live. A$AP", artist: "A$AP Rocky", posts: "20.5K", duration: "01:17", coverSlot: 3 },
  { id: "hard-core-kim", title: "Hard Core", artist: "Lil’ Kim", posts: "88.4K", duration: "01:08", coverSlot: 4 },
  { id: "mi-tierra", title: "Mi Tierra", artist: "Gloria Estefan", posts: "540.2K", duration: "01:14", coverSlot: 5 },
  { id: "first-take", title: "First Take", artist: "Roberta Flack", posts: "102.2K", duration: "01:39", coverSlot: 6 },
  { id: "homecoming", title: "Homecoming", artist: "Beyoncé", posts: "1.2M", duration: "03:01", coverSlot: 7 },
  { id: "running-up", title: "Running Up That Hill", artist: "Kate Bush", posts: "2.1M", duration: "04:58", coverSlot: 8 },
  { id: "praise-you", title: "Praise You", artist: "Fatboy Slim", posts: "76.0K", duration: "00:42", coverSlot: 9 },
  { id: "rhythm-nation", title: "Rhythm Nation", artist: "Janet Jackson", posts: "311.9K", duration: "01:08", coverSlot: 10 },
  { id: "doo-wop", title: "Doo Wop (That Thing)", artist: "Ms. Lauryn Hill", posts: "640.7K", duration: "02:00", coverSlot: 11 },
  { id: "circles", title: "Circles", artist: "Post Malone", posts: "50.4K", duration: "02:40", coverSlot: 12 },
  { id: "levitating", title: "Levitating", artist: "Dua Lipa", posts: "1.1M", duration: "00:45", coverSlot: 13 },
  { id: "bad-guy", title: "bad guy", artist: "Billie Eilish", posts: "3.2M", duration: "00:38", coverSlot: 14 },
  { id: "sunflower", title: "Sunflower", artist: "Post Malone & Swae Lee", posts: "2.4M", duration: "00:42", coverSlot: 15 },
  { id: "dynamite", title: "Dynamite", artist: "BTS", posts: "4.8M", duration: "00:30", coverSlot: 16 },
  { id: "watermelon", title: "Watermelon Sugar", artist: "Harry Styles", posts: "1.9M", duration: "00:55", coverSlot: 17 },
  { id: "savage", title: "Savage", artist: "Megan Thee Stallion", posts: "2.1M", duration: "00:33", coverSlot: 18 },
  { id: "stay", title: "STAY", artist: "The Kid LAROI & Justin Bieber", posts: "3.6M", duration: "00:41", coverSlot: 19 },
  { id: "industry-baby", title: "INDUSTRY BABY", artist: "Lil Nas X & Jack Harlow", posts: "2.7M", duration: "00:36", coverSlot: 20 },
  { id: "heat-waves", title: "Heat Waves", artist: "Glass Animals", posts: "5.5M", duration: "00:48", coverSlot: 21 },
  { id: "good-4-u", title: "good 4 u", artist: "Olivia Rodrigo", posts: "3.1M", duration: "00:39", coverSlot: 22 },
  { id: "montero", title: "MONTERO", artist: "Lil Nas X", posts: "1.8M", duration: "00:34", coverSlot: 23 },
  { id: "peaches", title: "Peaches", artist: "Justin Bieber", posts: "1.4M", duration: "00:50", coverSlot: 24 },
  { id: "kiss-me-more", title: "Kiss Me More", artist: "Doja Cat ft. SZA", posts: "2.9M", duration: "00:44", coverSlot: 25 },
  { id: "drivers-license", title: "drivers license", artist: "Olivia Rodrigo", posts: "4.2M", duration: "00:58", coverSlot: 26 },
  { id: "positions", title: "positions", artist: "Ariana Grande", posts: "1.6M", duration: "00:37", coverSlot: 27 },
  { id: "save-your-tears", title: "Save Your Tears", artist: "The Weeknd", posts: "2.3M", duration: "00:46", coverSlot: 28 },
  { id: "butter", title: "Butter", artist: "BTS", posts: "3.9M", duration: "00:31", coverSlot: 29 },
];

// Region sub-filter chips on the Hot tab (Figma "Chips", node 2779:209061).
export const HOT_CHIPS = ["US", "Singapore", "Global"] as const;
export type HotRegion = (typeof HOT_CHIPS)[number];

// A few extra regional hits so the Hot-tab chips feel like real, distinct charts
// (K-pop / Asia viral for the Singapore board) rather than the same list re-labelled.
const EXTRA_HOT_TRACKS: MusicTrack[] = [
  { id: "seven", title: "Seven (feat. Latto)", artist: "Jung Kook", posts: "7.2M", duration: "00:31", coverSlot: 7 },
  { id: "cupid", title: "Cupid (Twin Ver.)", artist: "FIFTY FIFTY", posts: "6.1M", duration: "00:40", coverSlot: 3 },
  { id: "ditto", title: "Ditto", artist: "NewJeans", posts: "4.4M", duration: "00:35", coverSlot: 5 },
  { id: "super-shy", title: "Super Shy", artist: "NewJeans", posts: "3.8M", duration: "00:34", coverSlot: 2 },
  { id: "left-right", title: "Left and Right", artist: "Charlie Puth ft. Jung Kook", posts: "2.0M", duration: "00:43", coverSlot: 6 },
];

const HOT_TRACK_BY_ID: Record<string, MusicTrack> = Object.fromEntries(
  [...MUSIC_TRACKS, ...DISCOVER_SOUNDS, ...EXTRA_HOT_TRACKS].map((t) => [t.id, t]),
);
const pickTracks = (ids: string[]): MusicTrack[] => ids.map((id) => HOT_TRACK_BY_ID[id]);

/** Demo default — two saved sounds when the panel first opens. */
export const DEFAULT_FAVORITE_TRACK_IDS = ["running-up", "doo-wop"] as const;

export function getTrackById(id: string): MusicTrack | undefined {
  return HOT_TRACK_BY_ID[id];
}

export function favoriteTracksFromIds(ids: readonly string[]): MusicTrack[] {
  return ids.map((id) => HOT_TRACK_BY_ID[id]).filter((t): t is MusicTrack => t != null);
}

// Each chip = its own ranked board. They overlap on a few worldwide hits (realistic)
// but each leads with a distinct regional flavor.
export const HOT_TRACKS_BY_REGION: Record<HotRegion, MusicTrack[]> = {
  US: pickTracks([
    "drivers-license", "good-4-u", "industry-baby", "heat-waves", "stay",
    "montero", "save-your-tears", "bad-guy", "levitating", "kiss-me-more",
    "positions", "butter", "watermelon", "savage", "peaches",
  ]),
  Singapore: pickTracks([
    "seven", "cupid", "ditto", "dynamite", "super-shy",
    "stay", "calm-down", "as-it-was", "left-right", "heat-waves",
    "butter", "flowers", "kiss-me-more", "blinding", "levitating",
  ]),
  Global: pickTracks([
    "flowers", "blinding", "as-it-was", "anti-hero", "unholy",
    "calm-down", "vampire", "stay", "heat-waves", "seven",
    "bad-guy", "dynamite", "drivers-license", "save-your-tears", "levitating",
  ]),
};

// Per-tab boards so For you / Favorites / Recent aren't the same list re-labelled.
// "For you" keeps the canonical Figma rows (MUSIC_TRACKS); the others are distinct.
export const FAVORITES_TRACKS: MusicTrack[] = pickTracks([
  "running-up", "doo-wop", "praise-you", "circles", "sunflower",
  "vampire", "calm-down", "as-it-was", "kiss-me-more", "flowers",
  "peaches", "positions", "the-dreaming", "mi-tierra",
]);

export const RECENT_TRACKS: MusicTrack[] = pickTracks([
  "blinding", "anti-hero", "unholy", "good-4-u", "stay",
  "heat-waves", "drivers-license", "montero", "savage", "butter",
  "dynamite", "watermelon", "bad-guy", "levitating",
]);

/** Nav pill label: title only, or "Title - Artist" when artist is set. */
export function soundDisplayName(track: MusicTrack): string {
  return track.artist ? `${track.title} - ${track.artist}` : track.title;
}

const TRACK_LOOKUP: MusicTrack[] = [
  ...MUSIC_TRACKS,
  ...DISCOVER_SOUNDS,
  ...EXTRA_HOT_TRACKS,
];

/** Resolve a nav pill string to a catalog track (title or "Title - Artist"). */
export function findTrackBySoundName(name: string): MusicTrack | undefined {
  const normalized = name.trim().toLowerCase();
  return TRACK_LOOKUP.find((track) => {
    const title = track.title.trim().toLowerCase();
    const display = soundDisplayName(track).trim().toLowerCase();
    return title === normalized || display === normalized;
  });
}

/** Tracks shown on a given panel tab (Hot uses the active region chip). */
export function tracksForMusicTab(
  tab: MusicTabKey,
  hotChipIndex = 0,
  savedTracks: MusicTrack[] = [],
): MusicTrack[] {
  if (tab === "hot") return HOT_TRACKS_BY_REGION[HOT_CHIPS[hotChipIndex]];
  if (tab === "favorites") return savedTracks;
  if (tab === "recent") return RECENT_TRACKS;
  return MUSIC_TRACKS;
}

/** Pick the tab that should show the track when syncing list selection. */
export function findTabForTrackId(trackId: string): MusicTabKey {
  if (MUSIC_TRACKS.some((t) => t.id === trackId)) return "foryou";
  if (FAVORITES_TRACKS.some((t) => t.id === trackId)) return "favorites";
  if (RECENT_TRACKS.some((t) => t.id === trackId)) return "recent";
  if (Object.values(HOT_TRACKS_BY_REGION).some((list) => list.some((t) => t.id === trackId))) {
    return "hot";
  }
  return "foryou";
}
// endregion
