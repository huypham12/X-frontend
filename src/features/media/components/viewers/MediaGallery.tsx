'use client';

import { useState } from 'react';
import type { MediaMetadata } from '../../types/media.type';
import { MediaLightbox } from './MediaLightbox';
import { MediaPlayer } from './MediaPlayer';

interface MediaGalleryProps {
  medias: MediaMetadata[];
}

export function MediaGallery({ medias }: MediaGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  if (medias.length === 0) return null;

  const imageMedias = medias.filter((media) => media.type === 'image');
  const allAudio = medias.every((media) => media.type === 'audio');

  const handleMediaClick = (event: React.MouseEvent, media: MediaMetadata) => {
    event.stopPropagation();
    if (media.type !== 'image') return;

    const imageIndex = imageMedias.findIndex((imageMedia) => imageMedia._id === media._id);
    if (imageIndex < 0) return;
    setInitialIndex(imageIndex);
    setLightboxOpen(true);
  };

  if (allAudio) {
    return (
      <div className="mt-3 flex flex-col gap-2" onClick={(event) => event.stopPropagation()}>
        {medias.map((media) => (
          <MediaPlayer key={media._id} media={media} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div
        className={`mt-3 grid gap-0.5 overflow-hidden rounded-2xl border border-[#2F3336] ${
          medias.length === 1
            ? 'aspect-video grid-cols-1'
            : medias.length === 2 || medias.length === 3
              ? 'aspect-[8/4.5] grid-cols-2'
              : 'aspect-square grid-cols-2'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        {medias.map((media, index) => {
          const isImage = media.type === 'image';

          return (
            <div
              key={media._id}
              className={`relative h-full w-full bg-[#333639] transition-opacity ${
                isImage ? 'cursor-zoom-in hover:opacity-90' : 'cursor-default'
              } ${medias.length === 3 && index === 0 ? 'row-span-2' : ''}`}
              onClick={(event) => handleMediaClick(event, media)}
            >
              <MediaPlayer
                media={media}
                audioVariant="compact"
                className={
                  isImage
                    ? 'pointer-events-none absolute inset-0 h-full w-full object-cover'
                    : 'absolute inset-0 h-full w-full'
                }
              />
            </div>
          );
        })}
      </div>

      <MediaLightbox
        key={`${lightboxOpen}-${initialIndex}`}
        medias={imageMedias}
        isOpen={lightboxOpen}
        initialIndex={initialIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
