'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaPlayer } from './MediaPlayer';
import type { MediaMetadata } from '../../types/media.type';

interface MediaLightboxProps {
  medias: MediaMetadata[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function MediaLightbox({ medias, initialIndex = 0, isOpen, onClose }: MediaLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousActiveElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    document.body.style.overflow = 'hidden';
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      previousActiveElement?.focus();
    };
  }, [isOpen]);

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
      if (e.key === 'Tab') {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const focusableElements = Array.from(
          dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        ).filter((element) => element.getAttribute('aria-hidden') !== 'true');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (!firstElement || !lastElement) {
          e.preventDefault();
          dialog.focus();
          return;
        }

        const activeElement = document.activeElement;
        if (e.shiftKey && (activeElement === firstElement || !dialog.contains(activeElement))) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && (activeElement === lastElement || !dialog.contains(activeElement))) {
          e.preventDefault();
          firstElement.focus();
        }
        return;
      }

      if (e.key === 'ArrowRight' && currentIndex < medias.length - 1) {
        setCurrentIndex(c => c + 1);
      }
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(c => c - 1);
      }
      if (e.key === 'Escape') {
        e.preventDefault();
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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shared media viewer"
        tabIndex={-1}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
        className="fixed inset-0 z-50 bg-black/90 flex flex-col"
        onClick={onClose}
      >
        {/* Header toolbar */}
        <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between border-b border-white/10 bg-black/80 p-4">
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close media viewer"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={handleDownload}
            aria-label="Download current media"
            className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Download className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          {/* Prev Button */}
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous media"
              className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronLeft className="h-8 w-8" aria-hidden="true" />
            </button>
          )}

          <motion.div 
            key={currentIndex}
            initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.95 }}
            transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 200 }}
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
              type="button"
              onClick={handleNext}
              aria-label="Next media"
              className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronRight className="h-8 w-8" aria-hidden="true" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
