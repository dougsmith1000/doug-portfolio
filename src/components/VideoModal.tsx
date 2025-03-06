import { createEffect, onCleanup, onMount } from "solid-js";
import { isServer } from "solid-js/web";

interface VideoModalProps {
  videoSrc: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export default function VideoModal(props: VideoModalProps) {
  if (isServer) return null;

  let modalRef: HTMLDivElement | undefined;
  let contentRef: HTMLDivElement | undefined;

  onMount(() => {
    if (props.isOpen) {
      document.body.style.overflow = "hidden";
    }
  });

  createEffect(() => {
    if (props.isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscapeKey);
    } else {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscapeKey);
    }
  });

  onCleanup(() => {
    document.body.style.overflow = "";
    document.removeEventListener("keydown", handleEscapeKey);
  });

  const handleBackdropClick = (e: MouseEvent) => {
    // Only close if clicking directly on the backdrop, not on its children
    if (e.target === modalRef) {
      e.preventDefault();
      e.stopPropagation();
      props.onClose();
    }
  };

  const handleEscapeKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      props.onClose();
    }
  };

  const handleCloseButtonClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    props.onClose();
  };

  return (
    <div
      ref={modalRef}
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300 modal-backdrop"
      classList={{
        "opacity-100 pointer-events-auto": props.isOpen,
        "opacity-0 pointer-events-none": !props.isOpen,
      }}
      onClick={handleBackdropClick}
    >
      <div
        ref={contentRef}
        class="relative bg-neutral-900 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,255,128,0.3)] max-w-4xl w-full mx-4 transform transition-transform duration-300 modal-content"
        classList={{
          "scale-100": props.isOpen,
          "scale-95": !props.isOpen,
        }}
      >
        <div class="p-4 border-b border-neutral-700 flex justify-between items-center">
          <h3 class="text-xl font-ibm-plex-mono text-white/90">{props.title}</h3>
          <button
            class="text-white/70 hover:text-white transition-colors p-2"
            onClick={handleCloseButtonClick}
            aria-label="Close modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="relative">
          <video src={props.videoSrc} controls autoplay class="w-full h-auto" />
        </div>
      </div>
    </div>
  );
}
