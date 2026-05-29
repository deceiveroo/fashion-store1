'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

export interface LightboxImage {
  id?: string;
  url: string;
  mediaType?: 'image' | 'video';
}

interface ImageLightboxProps {
  images: LightboxImage[];
  index: number;
  open: boolean;
  alt?: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const STEP = 0.5;

/**
 * Полноэкранный просмотр фото товара с зумом.
 * - Колесо мыши / кнопки +/- — зум к центру/курсору.
 * - Перетаскивание (drag) при увеличении.
 * - Пинч двумя пальцами на тач-устройствах.
 * - Двойной клик/тап — переключение зума.
 * - Стрелки ←/→ и кнопки — листание; Esc — закрыть.
 */
export default function ImageLightbox({
  images,
  index,
  open,
  alt = '',
  onClose,
  onIndexChange,
}: ImageLightboxProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Состояние жестов держим в ref, чтобы не плодить ре-рендеры на каждое движение.
  const drag = useRef<{ active: boolean; startX: number; startY: number; baseX: number; baseY: number }>(
    { active: false, startX: 0, startY: 0, baseX: 0, baseY: 0 }
  );
  const pinch = useRef<{ active: boolean; startDist: number; baseScale: number }>(
    { active: false, startDist: 0, baseScale: 1 }
  );

  const current = images[index];
  const isVideo = current?.mediaType === 'video';
  const canNavigate = images.length > 1;

  const resetView = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  // Сброс зума при смене фото или открытии.
  useEffect(() => {
    resetView();
  }, [index, open, resetView]);

  const goPrev = useCallback(() => {
    onIndexChange(index === 0 ? images.length - 1 : index - 1);
  }, [index, images.length, onIndexChange]);

  const goNext = useCallback(() => {
    onIndexChange(index === images.length - 1 ? 0 : index + 1);
  }, [index, images.length, onIndexChange]);

  // Клавиатура: Esc / стрелки.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && canNavigate) goPrev();
      else if (e.key === 'ArrowRight' && canNavigate) goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, canNavigate, onClose, goPrev, goNext]);

  // Блокируем прокрутку фона, пока открыт лайтбокс.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

  const zoomBy = useCallback((delta: number) => {
    setScale((s) => {
      const next = clampScale(s + delta);
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    if (isVideo) return;
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? STEP : -STEP);
  }, [isVideo, zoomBy]);

  const onDoubleClick = useCallback(() => {
    if (isVideo) return;
    setScale((s) => {
      const next = s > 1 ? 1 : 2.5;
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, [isVideo]);

  // --- Drag мышью ---
  const onPointerDown = (e: React.PointerEvent) => {
    if (scale <= 1 || isVideo) return;
    drag.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      baseX: offset.x,
      baseY: offset.y,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    setOffset({
      x: drag.current.baseX + (e.clientX - drag.current.startX),
      y: drag.current.baseY + (e.clientY - drag.current.startY),
    });
  };
  const onPointerUp = () => {
    drag.current.active = false;
  };

  // --- Touch: pinch zoom + drag ---
  const dist = (t: React.TouchList) =>
    Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

  const onTouchStart = (e: React.TouchEvent) => {
    if (isVideo) return;
    if (e.touches.length === 2) {
      pinch.current = { active: true, startDist: dist(e.touches), baseScale: scale };
    } else if (e.touches.length === 1 && scale > 1) {
      drag.current = {
        active: true,
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        baseX: offset.x,
        baseY: offset.y,
      };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (pinch.current.active && e.touches.length === 2) {
      const ratio = dist(e.touches) / pinch.current.startDist;
      setScale(clampScale(pinch.current.baseScale * ratio));
    } else if (drag.current.active && e.touches.length === 1) {
      setOffset({
        x: drag.current.baseX + (e.touches[0].clientX - drag.current.startX),
        y: drag.current.baseY + (e.touches[0].clientY - drag.current.startY),
      });
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) pinch.current.active = false;
    if (e.touches.length === 0) {
      drag.current.active = false;
      if (scale <= 1) setOffset({ x: 0, y: 0 });
    }
  };

  if (!current) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр фото"
        >
          {/* Клик по фону закрывает */}
          <div className="absolute inset-0" onClick={onClose} aria-hidden />

          {/* Верхняя панель */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 sm:p-6 text-white/90">
            <span className="text-sm font-light tracking-wide tabular-nums">
              {images.length > 1 ? `${index + 1} / ${images.length}` : ''}
            </span>
            <div className="flex items-center gap-2">
              {!isVideo && (
                <>
                  <button
                    type="button"
                    onClick={() => zoomBy(-STEP)}
                    aria-label="Уменьшить"
                    className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-30"
                    disabled={scale <= MIN_SCALE}
                  >
                    <ZoomOut className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => zoomBy(STEP)}
                    aria-label="Увеличить"
                    className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-30"
                    disabled={scale >= MAX_SCALE}
                  >
                    <ZoomIn className="h-5 w-5" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть"
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Стрелки */}
          {canNavigate && (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label="Предыдущее фото"
                className="absolute left-2 sm:left-4 top-1/2 z-20 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Следующее фото"
                className="absolute right-2 sm:right-4 top-1/2 z-20 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Медиа */}
          <div
            ref={containerRef}
            className="relative z-10 h-full w-full flex items-center justify-center overflow-hidden touch-none select-none"
            style={{ cursor: scale > 1 ? (drag.current.active ? 'grabbing' : 'grab') : 'default' }}
            onWheel={onWheel}
            onDoubleClick={onDoubleClick}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {isVideo ? (
              <video
                key={current.id ?? index}
                src={current.url}
                controls
                autoPlay
                loop
                playsInline
                className="max-h-[90vh] max-w-[92vw] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div
                className="relative max-h-[90vh] max-w-[92vw] will-change-transform"
                style={{
                  transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
                  transition: drag.current.active || pinch.current.active ? 'none' : 'transform 0.2s ease-out',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  key={current.id ?? index}
                  src={current.url}
                  alt={alt}
                  width={1600}
                  height={2000}
                  sizes="92vw"
                  quality={95}
                  priority
                  draggable={false}
                  className="h-auto max-h-[90vh] w-auto object-contain"
                />
              </div>
            )}
          </div>

          {/* Подсказка */}
          {!isVideo && scale === 1 && (
            <p className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 text-center text-[11px] uppercase tracking-[0.2em] text-white/40">
              Колесо или двойной клик — приблизить
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
