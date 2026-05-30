'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler, Sparkles, Check, Wand2 } from 'lucide-react';
import BodySilhouette from '@/components/product/BodySilhouette';

interface SizeAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSize: (size: string) => void;
  availableSizes: string[];
}

type Gender = 'female' | 'male';
type BodyType = 'slim' | 'normal' | 'athletic' | 'heavy';

// Сегмент сегментированного контрола (вынесен из render: без замыкания на стейт).
function Segment({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative isolate flex items-center justify-center rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${
        active ? 'text-white' : 'text-gray-600 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white'
      }`}
    >
      {active && (
        <motion.span
          layoutId="advisorSeg"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="absolute inset-0 -z-10 rounded-xl shadow-sm pdp-accent-gradient"
        />
      )}
      {children}
    </button>
  );
}

export default function SizeAdvisorModal({
  isOpen,
  onClose,
  onSelectSize,
  availableSizes,
}: SizeAdvisorModalProps) {
  const [gender, setGender] = useState<Gender>('female');
  const [height, setHeight] = useState<number>(175);
  const [weight, setWeight] = useState<number>(70);
  const [bodyType, setBodyType] = useState<BodyType>('normal');
  const [calculatedSize, setCalculatedSize] = useState<string>('M');
  const [recommendedText, setRecommendedText] = useState<string>('');

  // Sizing calculation based on BMI and Complexion — логику НЕ трогаем.
  useEffect(() => {
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);

    let size = 'M';
    if (bmi < 18.5) size = 'XS';
    else if (bmi < 21.5) size = 'S';
    else if (bmi < 25) size = 'M';
    else if (bmi < 28.5) size = 'L';
    else size = 'XL';

    const sizes = ['XS', 'S', 'M', 'L', 'XL'];
    let sizeIdx = sizes.indexOf(size);

    if (bodyType === 'slim' && sizeIdx > 0) {
      sizeIdx--;
    } else if (bodyType === 'heavy' && sizeIdx < sizes.length - 1) {
      sizeIdx++;
    } else if (bodyType === 'athletic') {
      // Спортивное: базовый размер, но примечание ниже.
    }

    const finalCalculated = sizes[sizeIdx];
    setCalculatedSize(finalCalculated);

    const isAvailable = availableSizes.includes(finalCalculated);
    let text = `Размер ${finalCalculated} идеально сядет по вашей фигуре. `;

    if (bodyType === 'slim') {
      text += 'Посадка будет слегка свободной, подчёркивая утончённый силуэт.';
    } else if (bodyType === 'athletic') {
      text += gender === 'female'
        ? 'Подчеркнёт линию талии и плеч, мягко облегая фигуру.'
        : 'Подчеркнёт плечевой пояс и грудь, аккуратно облегая торс.';
    } else if (bodyType === 'heavy') {
      text += 'Посадка будет комфортной, обеспечивая полную свободу движений.';
    } else {
      text += 'Посадка будет классической и элегантной в лучших традициях бренда.';
    }

    if (!isAvailable && availableSizes.length > 0) {
      const targetIdx = sizes.indexOf(finalCalculated);
      let nearest = availableSizes[0];
      let minDiff = 10;
      availableSizes.forEach((s) => {
        const idx = sizes.indexOf(s);
        if (idx !== -1 && Math.abs(idx - targetIdx) < minDiff) {
          minDiff = Math.abs(idx - targetIdx);
          nearest = s;
        }
      });
      const fitType = sizes.indexOf(nearest) < targetIdx ? 'более облегающим' : 'более свободным (оверсайз)';
      text = `На основе ваших параметров лучше всего подойдёт размер ${finalCalculated}, но так как его сейчас нет в наличии, мы рекомендуем размер ${nearest}. Он будет сидеть чуть ${fitType}.`;
    }

    setRecommendedText(text);
  }, [height, weight, bodyType, gender, availableSizes]);

  const bmi = weight / ((height / 100) * (height / 100));
  const heightPct = ((height - 140) / 70) * 100;
  const weightPct = ((weight - 40) / 80) * 100;

  const sliderFill = (pct: number) =>
    `linear-gradient(to right, #8b5cf6 0%, #6366f1 ${pct}%, rgba(140,140,160,0.18) ${pct}%, rgba(140,140,160,0.18) 100%)`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 cursor-pointer bg-black/50 backdrop-blur-[6px] dark:bg-black/75"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed left-1/2 top-1/2 z-50 flex max-h-[92vh] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-white/40 bg-white/95 shadow-2xl backdrop-blur-2xl dark:border-neutral-800/80 dark:bg-[#0b0b11]/95 md:max-h-[88vh]"
          >
            {/* Header */}
            <div className="relative flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-neutral-800/60">
              <div className="relative flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl text-white shadow-sm pdp-accent-gradient">
                  <Wand2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Виртуальный стилист
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-neutral-400">
                    Подбор идеального размера
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="relative rounded-lg p-1.5 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-neutral-800/60 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="grid flex-1 grid-cols-1 items-stretch gap-6 overflow-y-auto p-6 md:grid-cols-12 md:gap-8 md:p-8">
              {/* Figure */}
              <div className="relative md:col-span-5">
                <div className="relative flex h-full min-h-[360px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900/50">
                  <div className="relative h-[360px] w-full">
                    <BodySilhouette gender={gender} height={height} weight={weight} bodyType={bodyType} />
                  </div>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-gray-200 bg-white/80 px-3 py-1 backdrop-blur-md dark:border-neutral-700/60 dark:bg-neutral-900/60">
                    <span className="text-xs font-medium text-gray-700 dark:text-neutral-300">
                      ИМТ: <span className="font-bold text-violet-600 dark:text-violet-400">{bmi.toFixed(1)}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-5 md:col-span-7">
                {/* Gender */}
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-500">
                    Силуэт
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-gray-200 bg-gray-50/60 p-1.5 dark:border-neutral-800 dark:bg-neutral-900/40">
                    <Segment active={gender === 'female'} onClick={() => setGender('female')}>Женский</Segment>
                    <Segment active={gender === 'male'} onClick={() => setGender('male')}>Мужской</Segment>
                  </div>
                </div>

                {/* Height */}
                <div>
                  <div className="mb-2 flex items-baseline justify-between">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-500">Рост, см</label>
                    <span className="text-xl font-black tabular-nums text-gray-900 dark:text-white">{height}</span>
                  </div>
                  <input
                    type="range" min={140} max={210} value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full outline-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[var(--thumb-bg)] [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[var(--thumb-bg)]"
                    style={{
                      background: sliderFill(heightPct),
                      ['--thumb-bg' as string]: '#7c3aed',
                    } as React.CSSProperties}
                  />
                </div>

                {/* Weight */}
                <div>
                  <div className="mb-2 flex items-baseline justify-between">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-500">Вес, кг</label>
                    <span className="text-xl font-black tabular-nums text-gray-900 dark:text-white">{weight}</span>
                  </div>
                  <input
                    type="range" min={40} max={120} value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full outline-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[var(--thumb-bg)] [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[var(--thumb-bg)]"
                    style={{
                      background: sliderFill(weightPct),
                      ['--thumb-bg' as string]: '#7c3aed',
                    } as React.CSSProperties}
                  />
                </div>

                {/* Body type */}
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-500">
                    Телосложение
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 rounded-2xl border border-gray-200 bg-gray-50/60 p-1.5 dark:border-neutral-800 dark:bg-neutral-900/40">
                    {([
                      { key: 'slim', label: 'Худощавое' },
                      { key: 'normal', label: 'Обычное' },
                      { key: 'athletic', label: 'Спортивное' },
                      { key: 'heavy', label: 'Плотное' },
                    ] as const).map((item) => (
                      <Segment key={item.key} active={bodyType === item.key} onClick={() => setBodyType(item.key)}>
                        <span className="px-0.5 text-center leading-tight">{item.label}</span>
                      </Segment>
                    ))}
                  </div>
                </div>

                {/* Recommendation */}
                <div className="flex gap-3 rounded-2xl border border-violet-500/15 bg-violet-500/[0.05] p-4">
                  <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-xl text-white pdp-accent-gradient">
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <h4 className="mb-1 text-xs font-semibold text-gray-900 dark:text-white">
                      Рекомендация стилиста
                    </h4>
                    <p className="text-xs leading-relaxed text-gray-600 dark:text-neutral-400">
                      {recommendedText}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/60 px-6 py-4 dark:border-neutral-800/60 dark:bg-[#0c0c14]/40">
              <div className="flex items-center gap-2">
                <Ruler size={16} className="text-gray-400 dark:text-neutral-500" />
                <span className="text-xs font-medium text-gray-500 dark:text-neutral-400">
                  Ваш размер
                </span>
                <motion.span
                  key={calculatedSize}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                  className="text-2xl font-black text-violet-600 dark:text-violet-400"
                >
                  {calculatedSize}
                </motion.span>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-medium text-gray-500 transition-all hover:bg-gray-100/60 hover:text-gray-700 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800/40 dark:hover:text-white"
                >
                  Отмена
                </button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    onSelectSize(calculatedSize);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 rounded-xl px-6 py-2.5 text-xs font-semibold text-white shadow-md transition-[filter,box-shadow] hover:brightness-105 hover:shadow-lg pdp-accent-gradient"
                >
                  <Check size={14} />
                  <span>Применить размер</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
