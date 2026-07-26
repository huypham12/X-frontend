'use client';

interface VideoPlayerProps {
  url: string;
  poster?: string;
}

export function VideoPlayer({ url, poster }: VideoPlayerProps) {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-black"
      onClick={(event) => event.stopPropagation()}
    >
      <video
        src={url}
        poster={poster}
        controls
        playsInline
        preload="metadata"
        aria-label="Tweet video"
        className="h-full w-full object-contain"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}
