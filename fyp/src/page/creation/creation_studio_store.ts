import { useSyncExternalStore } from "react";

import type { PhotoEditMediaItem } from "./photo_edit_media_catalog";

/** JPEG data URL or static preview URL from the creation camera shutter. */
let capturedPhoto: string | null = null;
/** Album picker → Photo edit: one entry per selected tile (order preserved). */
let albumEditPhotos: PhotoEditMediaItem[] | null = null;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function setCreationCapturedPhoto(src: string | null) {
  if (capturedPhoto === src && albumEditPhotos === null) {
    return;
  }
  capturedPhoto = src;
  albumEditPhotos = null;
  emit();
}

export function setAlbumEditPhotos(photos: readonly PhotoEditMediaItem[]) {
  const next = photos.map((item) => ({ ...item }));
  albumEditPhotos = next.length > 0 ? next : null;
  capturedPhoto = null;
  emit();
}

export function clearCreationCapturedPhoto() {
  if (capturedPhoto === null && albumEditPhotos === null) {
    return;
  }
  capturedPhoto = null;
  albumEditPhotos = null;
  emit();
}

export function getCreationCapturedPhoto(): string | null {
  return capturedPhoto;
}

export function getAlbumEditPhotos(): readonly PhotoEditMediaItem[] | null {
  return albumEditPhotos;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCreationCapturedPhoto(): string | null {
  return useSyncExternalStore(subscribe, getCreationCapturedPhoto, getCreationCapturedPhoto);
}

export function useAlbumEditPhotos(): readonly PhotoEditMediaItem[] | null {
  return useSyncExternalStore(subscribe, getAlbumEditPhotos, getAlbumEditPhotos);
}
