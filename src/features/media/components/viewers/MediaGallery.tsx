'use client';

import { useState } from 'react';
import { MediaPlayer } from './MediaPlayer';
import { MediaLightbox } from './MediaLightbox';
import { Play } from 'lucide-react';

interface MediaGalleryProps {
  medias: any[];
}

export function MediaGallery({ medias }: MediaGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  if (!medias || medias.length === 0) return null;

  const handleMediaClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    
    // Only open lightbox for images. Videos and audios play inline natively unless we want them in lightbox.
    // For Twitter clone, images open in lightbox, videos play inline. We can open lightbox for both if we want.
    // Let's open lightbox for everything except Audio.
    const media = medias[index];
    if (media.type === 'audio') return; 

    setInitialIndex(index);
    setLightboxOpen(true);
  };

  // If all are audio, we just list them vertically
  const allAudio = medias.every(m => m.type === 'audio' || (m.url && m.url.match(/\.(mp3|wav|ogg|m4a)$/i)));
  
  if (allAudio) {
    return (
      <div className="mt-3 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
        {medias.map((media) => (
          <MediaPlayer key={media._id} media={media} />
        ))}
      </div>
    );
  }

  // Normal Grid layout for Images and Videos
  return (
    <>
      <div 
        className={`mt-3 grid gap-0.5 rounded-2xl overflow-hidden border border-[#2F3336] ${
          medias.length === 1 ? 'grid-cols-1' :
          medias.length === 2 ? 'grid-cols-2 aspect-[8/4.5]' :
          medias.length === 3 ? 'grid-cols-2 aspect-[8/4.5]' : 'grid-cols-2 aspect-square'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {medias.map((media, index) => {
          const isVideo = media.type === 'video' || (media.url && media.url.match(/\.(mp4|webm|mov)$/i));

          return (
            <div 
              key={media._id} 
              className={`relative w-full h-full bg-[#333639] cursor-pointer hover:opacity-90 transition-opacity ${
                medias.length === 3 && index === 0 ? 'row-span-2' : ''
              }`}
              onClick={(e) => handleMediaClick(e, index)}
            >
              <MediaPlayer media={media} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
              
              {/* Play icon overlay for videos in the grid (if we disable native controls in grid) */}
              {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-[#1d9bf0] flex items-center justify-center text-white">
                    <Play className="w-6 h-6 fill-current ml-1" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <MediaLightbox 
        medias={medias} 
        isOpen={lightboxOpen} 
        initialIndex={initialIndex}
        onClose={() => setLightboxOpen(false)} 
      />
    </>
  );
}
