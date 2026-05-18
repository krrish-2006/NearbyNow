"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";

type ProductImageGalleryProps = {
  images: string[];
  productTitle: string;
};

export function ProductImageGallery({
  images,
  productTitle,
}: ProductImageGalleryProps) {
  const uniqueImages = useMemo(
    () => Array.from(new Set(images.filter(Boolean))),
    [images],
  );
  const [selectedImage, setSelectedImage] = useState(uniqueImages[0] ?? null);
  const thumbnailStripRef = useRef<HTMLDivElement>(null);

  function scrollThumbnails(direction: "left" | "right") {
    const strip = thumbnailStripRef.current;

    if (!strip) {
      return;
    }

    strip.scrollBy({
      left: direction === "left" ? -180 : 180,
      behavior: "smooth",
    });
  }

  if (!selectedImage) {
    return (
      <div className="overflow-hidden rounded-[2rem] border bg-white shadow-sm">
        <div className="flex aspect-square items-center justify-center bg-neutral-100 text-neutral-400">
          No Image
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border bg-white shadow-sm">
      <div className="relative aspect-square bg-neutral-100">
        <Image
          src={selectedImage}
          alt={productTitle}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
          className="object-cover"
        />
      </div>

      {uniqueImages.length > 1 && (
        <div className="border-t bg-white p-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => scrollThumbnails("left")}
              aria-label="Scroll product images left"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-white text-2xl font-bold leading-none shadow-sm transition hover:bg-black hover:text-white"
            >
              ‹
            </button>

            <div
              ref={thumbnailStripRef}
              className="flex flex-1 snap-x gap-3 overflow-x-auto scroll-smooth pb-2"
              aria-label={`${productTitle} images`}
            >
              {uniqueImages.map((imageUrl, index) => {
                const isSelected = imageUrl === selectedImage;

                return (
                  <button
                    key={`${imageUrl}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(imageUrl)}
                    aria-label={`Show ${productTitle} image ${index + 1}`}
                    aria-current={isSelected}
                    className={`relative h-28 w-28 shrink-0 snap-start overflow-hidden rounded-2xl border bg-neutral-100 transition sm:h-32 sm:w-32 ${
                      isSelected
                        ? "border-black ring-2 ring-black"
                        : "border-neutral-200 hover:border-black"
                    }`}
                  >
                    <Image
                      src={imageUrl}
                      alt={`${productTitle} image ${index + 1}`}
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => scrollThumbnails("right")}
              aria-label="Scroll product images right"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-white text-2xl font-bold leading-none shadow-sm transition hover:bg-black hover:text-white"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
