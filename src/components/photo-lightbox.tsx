"use client";

import { useCallback, useEffect, useState } from "react";

interface LightboxPhoto {
  url: string;
  label?: string;
}

export function usePhotoLightbox() {
  const [photos, setPhotos] = useState<LightboxPhoto[]>([]);
  const [index, setIndex] = useState<number | null>(null);

  const open = useCallback((list: LightboxPhoto[], at: number) => {
    setPhotos(list);
    setIndex(at);
  }, []);
  const close = useCallback(() => setIndex(null), []);

  return { photos, index, open, close, setIndex };
}

export function PhotoLightbox({
  photos,
  index,
  onClose,
  onNavigate,
}: {
  photos: LightboxPhoto[];
  index: number | null;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  useEffect(() => {
    if (index === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate((index! + 1) % photos.length);
      if (e.key === "ArrowLeft") onNavigate((index! - 1 + photos.length) % photos.length);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, photos.length, onClose, onNavigate]);

  if (index === null || !photos[index]) return null;
  const photo = photos[index];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10"
      style={{ background: "rgba(11,11,13,0.92)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* close */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 z-10 flex size-10 items-center justify-center rounded-full text-xl transition hover:bg-white/10 ltr:right-4 rtl:left-4"
        style={{ color: "var(--gold-200)" }}
      >
        ✕
      </button>

      {/* prev / next */}
      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((index - 1 + photos.length) % photos.length);
            }}
            aria-label="Previous photo"
            className="absolute left-2 z-10 flex size-11 items-center justify-center rounded-full text-2xl transition hover:bg-white/10 sm:left-6"
            style={{ color: "var(--gold-200)" }}
          >
            ‹
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((index + 1) % photos.length);
            }}
            aria-label="Next photo"
            className="absolute right-2 z-10 flex size-11 items-center justify-center rounded-full text-2xl transition hover:bg-white/10 sm:right-6"
            style={{ color: "var(--gold-200)" }}
          >
            ›
          </button>
        </>
      )}

      <figure
        className="flex max-h-full max-w-4xl flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={photo.label ?? "Photo"}
          className="max-h-[80vh] max-w-full rounded-xl object-contain"
          style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
        />
        <figcaption className="flex items-center gap-3 text-sm" style={{ color: "var(--text-on-dark-muted)" }}>
          {photo.label && <span>{photo.label}</span>}
          {photos.length > 1 && (
            <span style={{ color: "var(--gold-300)" }}>
              {index + 1} / {photos.length}
            </span>
          )}
        </figcaption>
      </figure>
    </div>
  );
}
