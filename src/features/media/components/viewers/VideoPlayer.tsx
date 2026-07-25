'use client';

interface VideoPlayerProps {
  url: string;
  poster?: string;
}

export function VideoPlayer({ url, poster }: VideoPlayerProps) {
  return (
    <div 
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden"
      onClick={(e) => e.stopPropagation()} // Prevent triggering tweet click
    >
      <video 
        src={url}
        poster={poster}
        controls
        preload="metadata"
        className="max-w-full max-h-full object-contain"
        controlsList="nodownload" // Custom download handled elsewhere
      />
    </div>
  );
}
