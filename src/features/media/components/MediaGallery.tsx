import React from 'react';
import { MediaType } from '../types/media.type';

export interface PublishedMedia {
  _id: string;
  url: string;
  type: MediaType | number; // Number for enum from backend if any
}

interface MediaGalleryProps {
  media: PublishedMedia[];
  onMediaClick?: (index: number) => void;
}

export const MediaGallery = ({ media, onMediaClick }: MediaGalleryProps) => {
  if (!media || media.length === 0) return null;

  // Grid layout logic
  const gridClass = () => {
    switch (media.length) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2';
      case 3:
      case 4:
        return 'grid-cols-2';
      default:
        return 'grid-cols-2';
    }
  };

  return (
    <div className={`grid gap-2 mt-3 ${gridClass()}`}>
      {media.map((item, index) => {
        // Handle both string types and numeric types if backend uses enums
        // Assuming 0: image, 1: video, 2: audio (adjust to actual DB enum)
        const isVideo = item.type === 'video' || item.type === 1;

        const aspectClass = media.length === 1 ? 'aspect-video' : 'aspect-square';

        return (
          <div
            key={item._id || index}
            className={`relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 ${
              isVideo ? 'cursor-default' : 'cursor-zoom-in'
            } ${aspectClass}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!isVideo) onMediaClick?.(index);
            }}
          >
            {isVideo ? (
              <video
                src={item.url}
                className="h-full w-full bg-black object-contain"
                controls
                playsInline
                preload="metadata"
                aria-label="Tweet video"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img
                src={item.url}
                alt="Tweet media"
                className="w-full h-full object-cover hover:opacity-90 transition-opacity"
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
