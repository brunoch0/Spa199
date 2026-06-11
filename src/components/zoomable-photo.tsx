"use client";

import { useState } from "react";
import { PhotoLightbox } from "./photo-lightbox";

// Single image that opens a fullscreen lightbox on click.
export function ZoomablePhoto({
  url,
  alt,
  label,
  className,
}: {
  url: string;
  alt: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative cursor-zoom-in"
        aria-label={`Enlarge: ${alt}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt} className={className} />
        <span className="absolute inset-0 rounded-[inherit] transition group-hover:bg-black/10" />
      </button>
      <PhotoLightbox
        photos={[{ url, label }]}
        index={open ? 0 : null}
        onClose={() => setOpen(false)}
        onNavigate={() => {}}
      />
    </>
  );
}

// Photo grid sharing one lightbox with prev/next navigation.
export function PhotoGrid({
  photos,
  gridClassName,
  itemClassName,
}: {
  photos: { url: string; label?: string }[];
  gridClassName: string;
  itemClassName: string;
}) {
  const [index, setIndex] = useState<number | null>(null);

  return (
    <>
      <div className={gridClassName}>
        {photos.map((p, i) => (
          <button
            key={p.url}
            type="button"
            onClick={() => setIndex(i)}
            className="group relative cursor-zoom-in"
            aria-label={`Enlarge photo ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={p.label ?? `Photo ${i + 1}`} className={itemClassName} />
            <span className="absolute inset-0 rounded-lg transition group-hover:bg-black/10" />
          </button>
        ))}
      </div>
      <PhotoLightbox
        photos={photos}
        index={index}
        onClose={() => setIndex(null)}
        onNavigate={setIndex}
      />
    </>
  );
}
