export const CREATURE_DRAW_IDS: readonly string[];
export function showcaseGameCount(search: string): number | null;
export function showcaseFrameSource(id: string, source: string, search: string): string;
export function selectReviewShowcase<T extends {taskId: string; src: string}>(entries: [string, T][], search: string): [string, Omit<T, 'src'> & {src: string}][] | null;
