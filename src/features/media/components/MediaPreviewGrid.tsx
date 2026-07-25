import { X } from 'lucide-react';
import { MediaItem } from '../types/media.type';
import Image from 'next/image';

interface MediaPreviewGridProps {
  mediaItems: MediaItem[];
  onRemove: (id: string) => void;
}

export const MediaPreviewGrid = ({ mediaItems, onRemove }: MediaPreviewGridProps) => {
  if (!mediaItems || mediaItems.length === 0) return null;

  // Grid layout logic similar to Twitter (1 file = full width, 2 files = split, etc.)
  const gridClass = () => {
    switch (mediaItems.length) {
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
      {mediaItems.map((item, index) => {
        const isUploading = item.status === 'uploading';
        const isError = item.status === 'error';

        // Adjust aspect ratio based on count
        const aspectClass =
          mediaItems.length === 1 ? 'aspect-video' : 'aspect-square';

        return (
          <div
            key={item.id}
            className={`relative rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 ${aspectClass}`}
          >
            {/* Remove Button */}
            <button
              onClick={() => onRemove(item.id)}
              className="absolute top-2 right-2 z-10 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white backdrop-blur-sm transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Media Content */}
            {item.type === 'image' ? (
              <img
                src={item.url}
                alt="Upload preview"
                className="w-full h-full object-cover"
              />
            ) : item.type === 'video' ? (
              <video
                src={item.url}
                className="w-full h-full object-cover"
                muted
                autoPlay
                loop
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-neutral-800 text-neutral-400">
                Audio File
              </div>
            )}

            {/* Uploading Overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-[80%] bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <span className="text-white text-xs mt-2 font-medium">
                  {item.progress}%
                </span>
              </div>
            )}

            {/* Error Overlay */}
            {isError && (
              <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center p-4">
                <span className="text-white text-xs font-medium text-center">
                  Upload failed
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
