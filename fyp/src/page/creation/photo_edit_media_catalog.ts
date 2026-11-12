/** Edit Photo ↔ Post Publish 共用图集：与 `/resource/publish/` 同一批文件。 */
export type PhotoEditMediaItem = {
  id: string;
  src: string;
};

/** 编辑底栏 / 发布顶栏 / Routes 演示均使用此列表。 */
export const PHOTO_FLOW_GALLERY: readonly PhotoEditMediaItem[] = [
  { id: "photo-1", src: "/resource/publish/publish-cover.png" },
  { id: "photo-2", src: "/resource/publish/publish-photo-2.png" },
  { id: "photo-3", src: "/resource/publish/publish-photo-3.png" },
] as const;

export function getPhotoFlowGallerySources(): readonly string[] {
  return PHOTO_FLOW_GALLERY.map((item) => item.src);
}

/**
 * Photo edit carousel sources.
 * 1. Album multi-select (N picks → N slides)
 * 2. Camera shutter (snapshot + demo companions)
 * 3. Default demo gallery
 */
export function buildPhotoEditMediaList(
  capturedSrc: string | null | undefined,
  albumPhotos?: readonly PhotoEditMediaItem[] | null,
): PhotoEditMediaItem[] {
  if (albumPhotos?.length) {
    return albumPhotos.map((item) => ({ ...item }));
  }
  if (capturedSrc) {
    return [
      { id: "captured-photo", src: capturedSrc },
      ...PHOTO_FLOW_GALLERY.map((item) => ({ ...item })),
    ];
  }
  return PHOTO_FLOW_GALLERY.map((item) => ({ ...item }));
}
