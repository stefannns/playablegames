type ProfileFeedThumbProps = {
  thumbnailSrc: string;
  videoThumbnailSrc?: string;
  alt?: string;
  className?: string;
};

/** Profile grid thumb — video feeds show MP4 first frame; images use static src. */
export function ProfileFeedThumb({
  thumbnailSrc,
  videoThumbnailSrc,
  alt = "",
  className = "absolute inset-0 w-full h-full object-cover",
}: ProfileFeedThumbProps) {
  if (videoThumbnailSrc) {
    return (
      <video
        src={videoThumbnailSrc}
        muted
        playsInline
        preload="metadata"
        aria-hidden={alt.length === 0}
        aria-label={alt.length > 0 ? alt : undefined}
        className={className}
      />
    );
  }

  return <img alt={alt} src={thumbnailSrc} className={className} />;
}
