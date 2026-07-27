import { LoaderCircle, RotateCcw, X } from 'lucide-react';
import type { MediaErrorCode, MediaItem } from '../types/media.type';
import { AudioPlayer } from './viewers/AudioPlayer';

interface MediaPreviewGridProps {
  mediaItems: MediaItem[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onContinueProcessing: (id: string) => void;
}

const getErrorMessage = (errorCode?: MediaErrorCode) => {
  if (errorCode === 'processing_failed') return 'Video processing failed.';
  if (errorCode === 'processing_timeout') return 'Video is taking longer than expected.';
  return 'Upload failed.';
};

export const MediaPreviewGrid = ({
  mediaItems,
  onRemove,
  onRetry,
  onContinueProcessing,
}: MediaPreviewGridProps) => {
  if (mediaItems.length === 0) return null;

  return (
    <div className={`mt-3 grid items-start gap-2 ${mediaItems.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
      {mediaItems.map((item) => {
        const previewSizeClass =
          item.type === 'audio'
            ? 'h-24'
            : mediaItems.length === 1
              ? 'aspect-video'
              : 'aspect-square';
        const isBusy = item.status === 'uploading' || item.status === 'processing';

        return (
          <div
            key={item.id}
            className={`relative w-full overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 ${previewSizeClass}`}
          >
            <button
              type="button"
              aria-label="Remove media"
              onClick={(event) => {
                event.stopPropagation();
                onRemove(item.id);
              }}
              className="absolute right-2 top-2 z-30 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>

            {item.type === 'image' ? (
              <img
                src={item.previewUrl}
                alt="Upload preview"
                className="h-full w-full object-cover"
              />
            ) : item.type === 'video' ? (
              <video
                src={item.previewUrl}
                className="h-full w-full bg-black object-contain"
                controls={item.status === 'ready'}
                muted={item.status !== 'ready'}
                playsInline
                preload="metadata"
                aria-label="Video preview"
                onClick={(event) => event.stopPropagation()}
              />
            ) : (
              <AudioPlayer
                url={item.previewUrl}
                variant="compact"
                disabled={isBusy || item.status === 'error'}
              />
            )}

            {item.status === 'uploading' && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/65 p-4">
                <div className="h-1.5 w-full max-w-[80%] overflow-hidden rounded-full bg-neutral-700">
                  <div
                    className="h-full bg-[#1d9bf0] transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <span className="mt-2 text-center text-xs font-medium text-white">
                  Uploading {item.type}… {item.progress}%
                </span>
              </div>
            )}

            {item.status === 'processing' && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/65 p-4">
                <LoaderCircle className="h-7 w-7 animate-spin text-[#1d9bf0]" />
                <span className="mt-2 text-center text-xs font-medium text-white">
                  Processing video…
                </span>
              </div>
            )}

            {item.status === 'error' && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-950/80 p-4">
                <span className="text-center text-xs font-medium text-white">
                  {getErrorMessage(item.errorCode)}
                </span>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (item.errorCode === 'processing_timeout') {
                      onContinueProcessing(item.id);
                    } else {
                      onRetry(item.id);
                    }
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-gray-200"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {item.errorCode === 'processing_timeout' ? 'Check again' : 'Retry'}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
