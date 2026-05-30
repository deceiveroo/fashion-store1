'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Maximize2, Sparkles } from 'lucide-react';
import ImageLightbox, { type LightboxImage } from './ImageLightbox';
import { BLUR_DATA_URL } from '@/lib/blur-placeholder';

export interface GalleryMedia {
  id?: string;
  url: string;
  mediaType?: 'image' | 'video';
  thumbnailUrl?: string;
  duration?: number;
}

interface ProductGalleryProps {
  images: GalleryMedia[];
  name: string;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  isNew?: boolean;
  featured?: boolean;
}

const LENS_SCALE = 2.2;

export default function ProductGallery({
  images,
  name,
  selectedIndex,
  onSelectIndex,
  isNew,
  featured,
}: ProductGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [canHoverZoom, setCanHoverZoom] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  const current = images[selectedIndex];
  const isVideo = current?.mediaType === 'video';
  const hasMultiple = images.length > 1;

  // Лупа при наведении — только для мыши (desktop), не для тач-экранов.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setCanHoverZoom(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const goPrev = useCallback(
    () => onSelectIndex(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1),
    [selectedIndex, images.length, onSelectIndex]
  );
  const goNext = useCallback(
    () => onSelectIndex(selectedIndex === images.length - 1 ? 0 : selectedIndex + 1),
    [selectedIndex, images.length, onSelectIndex]
  );

  const onMove = (e: React.MouseEvent) => {
    if (!frameRef.current) return;
    const r = frameRef.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setOrigin({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) });
  };

  const lightboxImages: LightboxImage[] = useMemo(
    () => images.map((m) => ({ id: m.id, url: m.url, mediaType: m.mediaType })),
    [images]
  );

  const enableLens = canHoverZoom && !isVideo;

  return (
    <div className="lg:col-span-7 space-y-4">
      {/* Главное медиа */}
      <div
        ref={frameRef}
        className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.25)] ring-1 ring-black/[0.05] dark:bg-neutral-900 dark:ring-white/[0.07] group/gallery"
        onMouseEnter={() => enableLens && setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
        onMouseMove={enableLens ? onMove : undefined}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={current?.id ?? selectedIndex}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {isVideo ? (
              <video
                src={current?.url}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-contain"
              />
            ) : (
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                aria-label="Открыть фото на весь экран"
                className="absolute inset-0 w-full h-full cursor-zoom-in"
              >
                <Image
                  src={current?.url}
                  alt={name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  priority={selectedIndex === 0}
                  loading={selectedIndex === 0 ? 'eager' : 'lazy'}
                  quality={95}
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  // object-contain — фото видно целиком, ничего не режется.
                  className="object-contain transition-transform duration-200 ease-out"
                  style={
                    zoomed
                      ? {
                          transform: `scale(${LENS_SCALE})`,
                          transformOrigin: `${origin.x}% ${origin.y}%`,
                        }
                      : undefined
                  }
                />
              </button>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Бейджи */}
        {(featured || isNew) && (
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
            {isNew && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-900 shadow-sm ring-1 ring-black/[0.04] backdrop-blur-md dark:bg-black/40 dark:text-white dark:ring-white/10">
                <Sparkles className="h-2.5 w-2.5 text-violet-500" />
                New
              </span>
            )}
            {featured && (
              <span className="rounded-full bg-gray-900/85 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white shadow-sm backdrop-blur-md dark:bg-white/90 dark:text-gray-900">
                Хит
              </span>
            )}
          </div>
        )}

        {/* Кнопка «на весь экран» */}
        {!isVideo && (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label="Открыть на весь экран"
            className="absolute bottom-3 right-3 z-10 rounded-full p-2.5 bg-white/85 text-gray-900 opacity-0 group-hover/gallery:opacity-100 transition-opacity hover:bg-white focus-visible:opacity-100 backdrop-blur-md shadow-sm ring-1 ring-black/[0.04]"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        )}

        {/* Стрелки */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Предыдущее фото"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full p-2 bg-white/90 text-gray-900 opacity-0 group-hover/gallery:opacity-100 transition-all hover:bg-white focus-visible:opacity-100 shadow-sm ring-1 ring-black/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Следующее фото"
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full p-2 bg-white/90 text-gray-900 opacity-0 group-hover/gallery:opacity-100 transition-all hover:bg-white focus-visible:opacity-100 shadow-sm ring-1 ring-black/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Миниатюры */}
      {hasMultiple && (
        <motion.div
          className="grid grid-cols-4 sm:grid-cols-5 gap-2 md:gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {images.map((image, index) => (
            <button
              key={image.id ?? index}
              type="button"
              onClick={() => onSelectIndex(index)}
              aria-label={`Фото ${index + 1}`}
              aria-current={selectedIndex === index}
              className={`relative aspect-[3/4] overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900 transition-all ${
                selectedIndex === index
                  ? 'ring-2 ring-violet-600 ring-offset-2 dark:ring-offset-neutral-950'
                  : 'opacity-60 hover:opacity-100 ring-1 ring-gray-200 dark:ring-neutral-800'
              }`}
            >
              <Image
                src={image.mediaType === 'video' && image.thumbnailUrl ? image.thumbnailUrl : image.url}
                alt=""
                fill
                sizes="(max-width: 640px) 25vw, 12vw"
                loading="lazy"
                quality={80}
                className="object-cover"
              />
              {image.mediaType === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-5 h-5 text-gray-900 ml-0.5" fill="currentColor" />
                  </div>
                </div>
              )}
              {image.duration && (
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-white text-[10px] rounded font-medium">
                  {Math.floor(image.duration / 60)}:{String(image.duration % 60).padStart(2, '0')}
                </span>
              )}
            </button>
          ))}
        </motion.div>
      )}

      <ImageLightbox
        images={lightboxImages}
        index={selectedIndex}
        open={lightboxOpen}
        alt={name}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={onSelectIndex}
      />
    </div>
  );
}
