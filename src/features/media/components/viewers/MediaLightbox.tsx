'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaPlayer } from './MediaPlayer';
import type { MediaMetadata } from '../../types/media.type';

interface MediaLightboxProps {
  medias: MediaMetadata[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function MediaLightbox({ medias, initialIndex = 0, isOpen, onClose }: MediaLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, initialIndex]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < medias.length - 1) setCurrentIndex(c => c + 1);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) setCurrentIndex(c => c - 1);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const media = medias[currentIndex];
    if (!media?.url) return;
    
    // Cloudinary download trick: append fl_attachment to the URL
    // e.g. https://res.cloudinary.com/demo/image/upload/v1/sample.jpg -> https://res.cloudinary.com/demo/image/upload/fl_attachment/v1/sample.jpg
    let downloadUrl = media.url;
    if (downloadUrl.includes('/upload/')) {
      downloadUrl = downloadUrl.replace('/upload/', '/upload/fl_attachment/');
    }

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `media-${currentIndex}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentIndex < medias.length - 1) {
        setCurrentIndex(c => c + 1);
      }
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(c => c - 1);
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, medias.length, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-black/90 flex flex-col"
        onClick={onClose}
      >
        {/* Header toolbar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <button 
            onClick={handleDownload}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 text-white transition-colors"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          {/* Prev Button */}
          {currentIndex > 0 && (
            <button 
              onClick={handlePrev}
              className="absolute left-4 w-12 h-12 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          <motion.div 
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full h-full p-10 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()} // Prevent click from closing
          >
            <div className="max-w-[90vw] max-h-[90vh] w-full h-full flex items-center justify-center">
               <MediaPlayer media={medias[currentIndex]} className="!w-auto !h-auto max-w-full max-h-full object-contain" />
            </div>
          </motion.div>

          {/* Next Button */}
          {currentIndex < medias.length - 1 && (
            <button 
              onClick={handleNext}
              className="absolute right-4 w-12 h-12 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
