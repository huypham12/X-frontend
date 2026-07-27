'use client';

import { useState } from 'react';
import { Images, LoaderCircle, Music2, RotateCcw, Video } from 'lucide-react';
import { MediaLightbox } from '@/features/media/components/viewers/MediaLightbox';
import { MediaPlayer } from '@/features/media/components/viewers/MediaPlayer';
import { useConversationMedia } from '../hooks/use-conversation-media';
import type {
  ConversationMediaTab,
  SharedConversationMedia,
} from '../types/conversation-media.type';

interface ConversationMediaViewProps {
  conversationId: string;
}

const MEDIA_TABS: Array<{
  value: ConversationMediaTab;
  label: string;
  icon: typeof Images;
}> = [
  { value: 'image', label: 'Photos', icon: Images },
  { value: 'video', label: 'Videos', icon: Video },
  { value: 'audio', label: 'Audio', icon: Music2 },
];

const ConversationMediaSkeleton = () => (
  <div className="grid grid-cols-2 gap-2" aria-label="Loading shared media">
    {[0, 1, 2, 3].map((item) => (
      <div
        key={item}
        className="aspect-square animate-pulse rounded-xl bg-[#181818] motion-reduce:animate-none"
      />
    ))}
  </div>
);

const MediaItems = ({
  activeTab,
  medias,
  onOpenImage,
}: {
  activeTab: ConversationMediaTab;
  medias: SharedConversationMedia[];
  onOpenImage: (index: number) => void;
}) => {
  if (activeTab === 'image') {
    return (
      <div className="grid grid-cols-2 gap-2">
        {medias.map((media, index) => (
          <button
            key={media._id}
            type="button"
            onClick={() => onOpenImage(index)}
            aria-label={`Open shared photo ${index + 1}`}
            className="aspect-square overflow-hidden rounded-xl bg-[#121212] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <MediaPlayer media={media} className="h-full w-full" />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {medias.map((media) => (
        <article
          key={media._id}
          className={`overflow-hidden rounded-xl bg-[#121212] ${
            activeTab === 'video' ? 'aspect-video' : 'min-h-24 p-2'
          }`}
        >
          <MediaPlayer
            media={media}
            audioVariant="compact"
            className={activeTab === 'video' ? 'h-full w-full' : 'min-h-20'}
          />
        </article>
      ))}
    </div>
  );
};

export const ConversationMediaView = ({ conversationId }: ConversationMediaViewProps) => {
  const [activeTab, setActiveTab] = useState<ConversationMediaTab>('image');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const {
    medias,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useConversationMedia(conversationId);
  const visibleMedias = medias.filter((media) => media.type === activeTab);
  const imageMedias = medias.filter((media) => media.type === 'image');

  return (
    <div className="flex min-h-full flex-col px-4 py-5">
      <div role="tablist" aria-label="Shared media type" className="grid grid-cols-3 gap-2">
        {MEDIA_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`conversation-media-${tab.value}`}
              onClick={() => setActiveTab(tab.value)}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                isActive ? 'bg-white text-black' : 'bg-[#181818] text-gray-300 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sr-only sm:hidden">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div
        id={`conversation-media-${activeTab}`}
        role="tabpanel"
        className="mt-5 min-h-0 flex-1"
      >
        {isLoading ? (
          <ConversationMediaSkeleton />
        ) : isError ? (
          <div className="flex flex-col items-center px-4 py-12 text-center">
            <p className="text-sm text-gray-400">Could not load shared media.</p>
            <button
              type="button"
              onClick={() => {
                void refetch();
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#536471] px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Retry
            </button>
          </div>
        ) : visibleMedias.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-gray-400">
              {hasNextPage
                ? `No ${MEDIA_TABS.find((tab) => tab.value === activeTab)?.label.toLowerCase()} loaded yet.`
                : `No shared ${MEDIA_TABS.find((tab) => tab.value === activeTab)?.label.toLowerCase()}.`}
            </p>
          </div>
        ) : (
          <MediaItems
            activeTab={activeTab}
            medias={visibleMedias}
            onOpenImage={setSelectedImageIndex}
          />
        )}

        {hasNextPage && !isError && (
          <button
            type="button"
            onClick={() => {
              void fetchNextPage();
            }}
            disabled={isFetchingNextPage}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-[#536471] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isFetchingNextPage && (
              <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            )}
            {isFetchingNextPage ? 'Loading' : 'Load more'}
          </button>
        )}
      </div>

      {selectedImageIndex !== null && (
        <MediaLightbox
          medias={imageMedias}
          initialIndex={selectedImageIndex}
          isOpen
          onClose={() => setSelectedImageIndex(null)}
        />
      )}
    </div>
  );
};
