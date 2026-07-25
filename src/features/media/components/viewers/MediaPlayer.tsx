'use client';

import { AudioPlayer } from './AudioPlayer';
import { VideoPlayer } from './VideoPlayer';

interface MediaPlayerProps {
  media: any; // MediaMetadata
  className?: string;
}

export function MediaPlayer({ media, className = '' }: MediaPlayerProps) {
  if (!media || !media.url) return null;

  // Cloudinary often sets resource_type as 'video' for audio as well, 
  // so we check the `type` explicitly.
  const isAudio = media.type === 'audio' || media.url.match(/\.(mp3|wav|ogg|m4a)$/i);
  const isVideo = media.type === 'video' || media.url.match(/\.(mp4|webm|mov)$/i);

  if (isAudio) {
    return (
      <div className={`w-full ${className}`}>
        <AudioPlayer url={media.url} />
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className={`w-full h-full ${className}`}>
        <VideoPlayer url={media.url} poster={media.thumbnail} />
      </div>
    );
  }

  // Fallback to Image
  return (
    <div className={`w-full h-full relative ${className}`}>
      <img 
        src={media.url} 
        alt="Media" 
        className="w-full h-full object-cover" 
        loading="lazy" 
      />
    </div>
  );
}
