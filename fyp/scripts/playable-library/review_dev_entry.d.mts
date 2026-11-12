import type {Plugin} from 'vite';

export function reviewDevEntryHtml(html: string, originalUrl?: string): string;
export function reviewDevEntry(): Plugin;
