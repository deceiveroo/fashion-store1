'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

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

/** Склонение слова «цвет»: 1 цвет, 2 цвета, 5 цветов. */
function colorWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'цвет';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'цвета';
  return 'цветов';
}

/**
 * Премиальный выбор цвета:
 *  - заголовок «Цвет» + выбранное название
 *  - лента превью-карточек 3:4 (формат каталога моды) с плавным подъёмом и тенью
 *  - активный вариант обведён тонким контуром и помечен галочкой
 *  - стрелки прокрутки, когда вариантов много
 */
export default function ColorSelector({ colors, activeColorId, onSelect }: ColorSelectorProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (!colors.length) return null;

  const scrollBy = (delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const showArrows = colors.length > 4;
  const activeName = colors.find((c) => c.id === activeColorId)?.name;

  return (
    <div className="space-y-3.5">
      <div className="flex items-baseline gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-gray-500 dark:text-neutral-400">
          Цвет
        </p>
        {activeName && (
          <span className="text-sm font-light tracking-wide text-gray-900 dark:text-white">
            {activeName}
          </span>
        )}
        {colors.length > 1 && (
          <span className="ml-auto text-[11px] font-light text-gray-400 dark:text-neutral-600">
            {colors.length}&nbsp;{colorWord(colors.length)}
          </span>
        )}
      </div>

      <div className="relative">
        {showArrows && (
          <button
            type="button"
            aria-label="Прокрутить влево"
            onClick={() => scrollBy(-220)}
            className="hidden md:flex absolute -left-3.5 top-[42%] -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-md ring-1 ring-gray-200 hover:bg-white hover:scale-105 transition-all dark:bg-neutral-800/90 dark:ring-neutral-700 dark:hover:bg-neutral-700"
          >
            <ChevronLeft className="h-4 w-4 text-gray-700 dark:text-neutral-200" />
          </button>
        )}

        <div
          ref={scrollerRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 pt-1 px-0.5"
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
                className="group/color flex-shrink-0 snap-start text-center focus:outline-none"
                style={{ width: 76 }}
              >
                <div
                  className={`relative aspect-[3/4] w-[76px] overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900 transition-all duration-300 ease-out ${
                    isActive
                      ? 'ring-2 ring-gray-900 dark:ring-white shadow-lg'
                      : 'ring-1 ring-gray-200/50 dark:ring-neutral-800/50 group-hover/color:-translate-y-1 group-hover/color:shadow-md group-hover/color:ring-gray-300 dark:group-hover/color:ring-neutral-700'
                  }`}
                >
                  <Image
                    src={color.image}
                    alt={color.name}
                    fill
                    sizes="76px"
                    quality={75}
                    className="object-cover transition-transform duration-500 ease-out group-hover/color:scale-105"
                  />

                  {/* Вуаль на неактивных — мягко гаснет при наведении */}
                  <span
                    className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
                      isActive
                        ? 'opacity-0'
                        : 'bg-white/35 dark:bg-black/40 opacity-100 group-hover/color:opacity-0'
                    }`}
                    aria-hidden
                  />

                  {/* Галочка на активном */}
                  <span
                    className={`absolute right-1.5 top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-gray-900 dark:bg-white shadow-md transition-all duration-300 ${
                      isActive ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                    }`}
                    aria-hidden
                  >
                    <Check className="h-3 w-3 text-white dark:text-gray-900" strokeWidth={3} />
                  </span>
                </div>

                <p
                  className={`mt-2.5 text-xs leading-snug line-clamp-2 transition-colors ${
                    isActive
                      ? 'text-gray-900 dark:text-white font-semibold'
                      : 'text-gray-500 dark:text-neutral-400 font-medium group-hover/color:text-gray-700 dark:group-hover/color:text-neutral-300'
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
            onClick={() => scrollBy(220)}
            className="hidden md:flex absolute -right-3.5 top-[42%] -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-md ring-1 ring-gray-200 hover:bg-white hover:scale-105 transition-all dark:bg-neutral-800/90 dark:ring-neutral-700 dark:hover:bg-neutral-700"
          >
            <ChevronRight className="h-4 w-4 text-gray-700 dark:text-neutral-200" />
          </button>
        )}
      </div>
    </div>
  );
}
