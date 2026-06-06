"use client";

import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useState } from "react";

import { mc } from "@/utils/mc";

export type GalleryImage = {
  altText?: string | null;
  id: string;
  isPrimary: boolean;
  url: string | null;
};

export type ImageGalleryProps = {
  images: GalleryImage[];
  name: string;
};

/**
 * Image gallery with thumbnail strip and prev/next navigation.
 */
export function ImageGallery({ images, name }: ImageGalleryProps) {
  const sorted = [...images].sort(
    (a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0),
  );
  const [activeIndex, setActiveIndex] = useState(0);

  if (sorted.length === 0) {
    return (
      <section className="grid aspect-[4/3] place-items-center overflow-hidden rounded-xl bg-muted-surface text-text-muted">
        <section className="grid place-items-center gap-2">
          <ImageOff aria-hidden="true" className="size-8 opacity-40" />
          <span className="ts-sm">Makmur Farma</span>
        </section>
      </section>
    );
  }

  const active = sorted[activeIndex];
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < sorted.length - 1;

  return (
    <section className="grid gap-3">
      <section className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted-surface">
        {active?.url ? (
          <img
            alt={active.altText ?? name}
            className="h-full w-full object-cover"
            src={active.url}
          />
        ) : (
          <section className="grid h-full place-items-center text-text-muted">
            <span className="ts-sm">Makmur Farma</span>
          </section>
        )}

        {sorted.length > 1 && (
          <>
            <button
              aria-label="Gambar sebelumnya"
              className="absolute left-2 top-1/2 -translate-y-1/2 grid size-8 place-items-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 disabled:opacity-30"
              disabled={!hasPrev}
              onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </button>
            <button
              aria-label="Gambar berikutnya"
              className="absolute right-2 top-1/2 -translate-y-1/2 grid size-8 place-items-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 disabled:opacity-30"
              disabled={!hasNext}
              onClick={() => setActiveIndex((i) => Math.min(sorted.length - 1, i + 1))}
              type="button"
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
            <span className="absolute bottom-2 right-2 rounded-full bg-black/40 px-2 py-0.5 ts-xs text-white">
              {activeIndex + 1} / {sorted.length}
            </span>
          </>
        )}
      </section>

      {sorted.length > 1 && (
        <section
          aria-label="Thumbnail gambar"
          className="flex gap-2 overflow-x-auto pb-1"
          role="group"
        >
          {sorted.map((image, index) => (
            <button
              aria-label={`Lihat gambar ${index + 1}`}
              aria-pressed={index === activeIndex}
              className={mc(
                "size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue",
                index === activeIndex
                  ? "border-primary-blue"
                  : "border-border-default opacity-70 hover:opacity-100",
              )}
              key={image.id}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              {image.url ? (
                <img
                  alt={image.altText ?? name}
                  className="h-full w-full object-cover"
                  src={image.url}
                />
              ) : (
                <section className="grid h-full place-items-center bg-muted-surface text-text-muted">
                  <span className="ts-xs">—</span>
                </section>
              )}
            </button>
          ))}
        </section>
      )}
    </section>
  );
}
