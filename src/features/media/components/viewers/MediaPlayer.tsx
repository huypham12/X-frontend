'use client';

import { AudioPlayer } from './AudioPlayer';
import { VideoPlayer } from './VideoPlayer';
import type { MediaMetadata } from '../../types/media.type';

interface MediaPlayerProps {
  media: MediaMetadata;
  className?: string;
  audioVariant?: 'default' | 'compact';
}

export function MediaPlayer({ media, className = '', audioVariant = 'default' }: MediaPlayerProps) {
  if (!media || !media.url) return null;

  // Cloudinary often sets resource_type as 'video' for audio as well, 
  // so we check the `type` explicitly.
  const isAudio = media.type === 'audio' || media.url.match(/\.(mp3|wav|ogg|m4a)$/i);
  const isVideo = media.type === 'video' || media.url.match(/\.(mp4|webm|mov)$/i);

  if (isAudio) {
    return (
      <div className={`w-full ${className}`}>
        <AudioPlayer url={media.url} variant={audioVariant} />
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className={`h-full w-full ${className}`} onClick={(event) => event.stopPropagation()}>
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
