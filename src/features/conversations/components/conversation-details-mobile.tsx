'use client';

import { useEffect, useRef, useSyncExternalStore, type RefObject } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useConversationDetailsStore } from '../stores/conversation-details.store';
import { ConversationDetailsPanel } from './conversation-details-panel';

interface ConversationDetailsMobileProps {
  conversationId: string;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
}

const MOBILE_MEDIA_QUERY = '(max-width: 1023px)';

const subscribeToMobileViewport = (onStoreChange: () => void) => {
  const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
  mediaQuery.addEventListener('change', onStoreChange);
  return () => mediaQuery.removeEventListener('change', onStoreChange);
};

const getMobileViewportSnapshot = () => window.matchMedia(MOBILE_MEDIA_QUERY).matches;
const getMobileViewportServerSnapshot = () => false;

export const ConversationDetailsMobile = ({
  conversationId,
  returnFocusRef,
}: ConversationDetailsMobileProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const openConversationId = useConversationDetailsStore((state) => state.openConversationId);
  const closeDetails = useConversationDetailsStore((state) => state.closeDetails);
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useSyncExternalStore(
    subscribeToMobileViewport,
    getMobileViewportSnapshot,
    getMobileViewportServerSnapshot,
  );
  const isOpen = isMobile && openConversationId === conversationId;

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const returnFocusElement = returnFocusRef.current;
    document.body.style.overflow = 'hidden';
    const focusFrame = window.requestAnimationFrame(() => headingRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDetails();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement = focusableElements.at(-1);

      if (!firstFocusableElement || !lastFocusableElement) {
        event.preventDefault();
        return;
      }

      const activeElement = document.activeElement;
      if (
        event.shiftKey &&
        (activeElement === firstFocusableElement || activeElement === headingRef.current)
      ) {
        event.preventDefault();
        lastFocusableElement.focus();
      } else if (!event.shiftKey && activeElement === lastFocusableElement) {
        event.preventDefault();
        firstFocusableElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      returnFocusElement?.focus();
    };
  }, [closeDetails, isOpen, returnFocusRef]);

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="conversation-details-panel-mobile-title"
          className="fixed inset-x-0 bottom-0 top-10 z-40 bg-black lg:hidden"
          initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: prefersReducedMotion ? 0 : 16 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: 'easeOut' }}
        >
          <ConversationDetailsPanel
            conversationId={conversationId}
            panelId="conversation-details-panel-mobile"
            headingRef={headingRef}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
