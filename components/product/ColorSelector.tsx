'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface ColorOption {
  /** Уникальный идентификатор варианта цвета */
  id: string;
  /** Название цвета: «Темно-синий», «Белый» */
  name: string;
  /** URL картинки-превью (квадрат/портрет) */
  image: string;
  /** Опционально — ссылка на отдельную страницу варианта */
  href?: string;
}

interface ColorSelectorProps {
  colors: ColorOption[];
  activeColorId: string | null;
  onSelect: (colorId: string) => void;
}

/**
 * Выбор цвета в стиле ЦУМ:
 *  - заголовок «Цвет»
 *  - горизонтальная лента превью ~70px с подписью под каждой плиткой
 *  - активный вариант обведён, неактивные — слегка приглушены
 *
 * Никаких внешних классов/иконок ЦУМа — только собственный Tailwind.
 */
export default function ColorSelector({ colors, activeColorId, onSelect }: ColorSelectorProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (!colors.length) return null;

  const scrollBy = (delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const showArrows = colors.length > 4;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-900 dark:text-white">
        Цвет
        {activeColorId && (
          <span className="ml-2 text-gray-500 dark:text-neutral-400 font-normal">
            {colors.find((c) => c.id === activeColorId)?.name}
          </span>
        )}
      </p>

      <div className="relative">
        {showArrows && (
          <button
            type="button"
            aria-label="Прокрутить влево"
            onClick={() => scrollBy(-200)}
            className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-200 hover:bg-gray-50 dark:bg-neutral-800 dark:ring-neutral-700 dark:hover:bg-neutral-700"
          >
            <ChevronLeft className="h-4 w-4 text-gray-700 dark:text-neutral-200" />
          </button>
        )}

        <div
          ref={scrollerRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1"
          style={{ scrollbarWidth: 'none' }}
        >
          {colors.map((color) => {
            const isActive = color.id === activeColorId;
            return (
              <button
                key={color.id}
                type="button"
                onClick={() => onSelect(color.id)}
                aria-pressed={isActive}
                aria-label={`Цвет: ${color.name}`}
                className="group/color flex-shrink-0 snap-start text-left focus:outline-none"
                style={{ width: 70 }}
              >
                <div
                  className={`relative aspect-square w-[70px] overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-900 transition-all ${
                    isActive
                      ? 'ring-2 ring-gray-900 dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-neutral-950'
                      : 'ring-1 ring-gray-200 dark:ring-neutral-800 opacity-70 group-hover/color:opacity-100 group-hover/color:ring-gray-400 dark:group-hover/color:ring-neutral-500'
                  }`}
                >
                  <Image
                    src={color.image}
                    alt={color.name}
                    fill
                    sizes="70px"
                    quality={70}
                    className="object-cover"
                  />
                </div>
                <p
                  className={`mt-1.5 text-[11px] leading-tight line-clamp-2 transition-colors ${
                    isActive
                      ? 'text-gray-900 dark:text-white font-medium'
                      : 'text-gray-500 dark:text-neutral-400'
                  }`}
                >
                  {color.name}
                </p>
              </button>
            );
          })}
        </div>

        {showArrows && (
          <button
            type="button"
            aria-label="Прокрутить вправо"
            onClick={() => scrollBy(200)}
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-200 hover:bg-gray-50 dark:bg-neutral-800 dark:ring-neutral-700 dark:hover:bg-neutral-700"
          >
            <ChevronRight className="h-4 w-4 text-gray-700 dark:text-neutral-200" />
          </button>
        )}
      </div>
    </div>
  );
}
