'use client';

import { useState } from 'react';
import { AudioPlayer } from '@/features/media/components/viewers/AudioPlayer';
import { MediaLightbox } from '@/features/media/components/viewers/MediaLightbox';
import type { MediaMetadata } from '@/features/media/types/media.type';

interface MessageAttachmentsProps {
  medias: MediaMetadata[];
  hasLeadingContent?: boolean;
}

export const MessageAttachments = ({
  medias,
  hasLeadingContent = false,
}: MessageAttachmentsProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const imageMedias = medias.filter((media) => media.type === 'image');

  if (medias.length === 0) return null;

  return (
    <>
      <div
        className={`flex max-w-full flex-col gap-2 ${hasLeadingContent ? 'mt-2' : ''}`}
        onClick={(event) => event.stopPropagation()}
      >
        {medias.map((media) => {
          if (media.type === 'audio') {
            return (
              <div key={media._id} className="w-[min(450px,calc(100vw-5rem))] max-w-full">
                <AudioPlayer url={media.url} />
              </div>
            );
          }

          if (media.type === 'video') {
            return (
              <video
                key={media._id}
                src={media.url}
                poster={media.thumbnail}
                controls
                playsInline
                preload="metadata"
                aria-label="Video attachment"
                className="max-h-60 max-w-full rounded-xl border border-[#333] bg-black object-contain"
              />
            );
          }

          const imageIndex = imageMedias.findIndex((imageMedia) => imageMedia._id === media._id);

          return (
            <button
              key={media._id}
              type="button"
              onClick={() => setSelectedImageIndex(imageIndex)}
              aria-label={`Open image attachment ${imageIndex + 1} of ${imageMedias.length}`}
              className="flex max-w-full cursor-zoom-in overflow-hidden rounded-xl border border-[#333] bg-[#121212] transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={media.url}
                alt="Image attachment"
                loading="lazy"
                className="max-h-60 max-w-full object-contain"
              />
            </button>
          );
        })}
      </div>

      {selectedImageIndex !== null && (
        <MediaLightbox
          medias={imageMedias}
          initialIndex={selectedImageIndex}
          isOpen
          viewerLabel="Message image viewer"
          onClose={() => setSelectedImageIndex(null)}
        />
      )}
    </>
  );
};
