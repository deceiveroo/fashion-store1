'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler, Sparkles, Check, ChevronRight } from 'lucide-react';

interface SizeAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSize: (size: string) => void;
  availableSizes: string[];
}

export default function SizeAdvisorModal({
  isOpen,
  onClose,
  onSelectSize,
  availableSizes,
}: SizeAdvisorModalProps) {
  const [height, setHeight] = useState<number>(175);
  const [weight, setWeight] = useState<number>(70);
  const [bodyType, setBodyType] = useState<'slim' | 'normal' | 'athletic' | 'heavy'>('normal');
  const [calculatedSize, setCalculatedSize] = useState<string>('M');
  const [recommendedText, setRecommendedText] = useState<string>('');

  // Sizing calculation based on BMI and Complexion
  useEffect(() => {
    // 🧠 ИМТ (BMI) = вес (кг) / рост^2 (м)
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);

    // Базовый расчет размера на основе ИМТ
    let size = 'M';
    if (bmi < 18.5) {
      size = 'XS';
    } else if (bmi < 21.5) {
      size = 'S';
    } else if (bmi < 25) {
      size = 'M';
    } else if (bmi < 28.5) {
      size = 'L';
    } else {
      size = 'XL';
    }

    // Корректировка размера на основе типа телосложения
    const sizes = ['XS', 'S', 'M', 'L', 'XL'];
    let sizeIdx = sizes.indexOf(size);

    if (bodyType === 'slim' && sizeIdx > 0) {
      sizeIdx--;
    } else if (bodyType === 'heavy' && sizeIdx < sizes.length - 1) {
      sizeIdx++;
    } else if (bodyType === 'athletic') {
      // Спортивное телосложение: более широкие плечи при узкой талии
      // Обычно оставляет базовый размер, но дает примечание
    }

    const finalCalculated = sizes[sizeIdx];
    setCalculatedSize(finalCalculated);

    // Генерация премиум-рекомендации
    const isAvailable = availableSizes.includes(finalCalculated);
    let text = `Размер ${finalCalculated} идеально сядет по вашей фигуре. `;
    
    if (bodyType === 'slim') {
      text += 'Посадка будет слегка свободной в плечах, подчеркивая утонченный силуэт.';
    } else if (bodyType === 'athletic') {
      text += 'Вещь подчеркнет плечевой пояс и спортивную осанку, мягко облегая торс.';
    } else if (bodyType === 'heavy') {
      text += 'Посадка будет комфортной, обеспечивая полную свободу движений.';
    } else {
      text += 'Посадка будет классической и элегантной в лучших традициях бренда.';
    }

    if (!isAvailable && availableSizes.length > 0) {
      // Ищем ближайший доступный размер
      const targetIdx = sizes.indexOf(finalCalculated);
      let nearest = availableSizes[0];
      let minDiff = 10;
      
      availableSizes.forEach(s => {
        const idx = sizes.indexOf(s);
        if (idx !== -1 && Math.abs(idx - targetIdx) < minDiff) {
          minDiff = Math.abs(idx - targetIdx);
          nearest = s;
        }
      });

      const fitType = sizes.indexOf(nearest) < targetIdx ? 'более облегающим' : 'более свободным (оверсайз)';
      text = `На основе ваших параметров лучше всего подойдет размер ${finalCalculated}, но так как его сейчас нет в наличии, мы настоятельно рекомендуем размер ${nearest}. Он будет сидеть чуть ${fitType}.`;
    }

    setRecommendedText(text);
  }, [height, weight, bodyType, availableSizes]);

  // Mannequin scale parameters for Framer Motion animation
  const heightScale = 0.85 + ((height - 140) / 70) * 0.3; // 0.85 to 1.15
  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);
  const baseWidthScale = 0.8 + ((bmi - 15) / 20) * 0.4; // 0.8 to 1.2
  
  const bodyTypeModifiers = {
    slim: 0.9,
    normal: 1.0,
    athletic: 1.03,
    heavy: 1.16,
  };
  const widthScale = baseWidthScale * bodyTypeModifiers[bodyType];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 dark:bg-black/75 backdrop-blur-[6px] z-50 cursor-pointer"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white/95 dark:bg-[#0b0b11]/95 border border-gray-100 dark:border-neutral-800/80 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl flex flex-col max-h-[90vh] md:max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-neutral-800/60 bg-gradient-to-r from-gray-50/50 to-white dark:from-neutral-900/10 dark:to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-600/10 text-purple-600 dark:text-purple-400 rounded-xl">
                  <Ruler size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                    Виртуальный стилист
                  </h3>
                  <p className="text-[11px] text-gray-400 dark:text-neutral-500 uppercase tracking-widest mt-0.5">
                    Подбор идеального размера
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800/60 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Left Side: SVG Mannequin Animation */}
              <div className="md:col-span-5 flex flex-col items-center justify-center bg-gray-50/60 dark:bg-neutral-900/20 border border-gray-100/60 dark:border-neutral-900/40 rounded-2xl py-6 min-h-[300px]">
                <div className="relative w-full aspect-[2/3] max-w-[150px] flex items-center justify-center">
                  <svg 
                    viewBox="0 0 100 220" 
                    className="w-full h-full"
                  >
                    {/* Head */}
                    <motion.circle
                      cx="50"
                      cy="30"
                      r="13"
                      animate={{ scale: heightScale * 0.95 }}
                      transition={{ type: 'spring', damping: 22 }}
                      className="fill-purple-600/10 dark:fill-purple-500/10 stroke-purple-600/50 dark:stroke-purple-400/50 stroke-1.5"
                    />
                    
                    {/* Body Silhouette */}
                    <motion.path
                      d="M 50,44 C 47,44 46,47 46,50 L 46,54 C 36,58 32,68 32,78 L 36,115 C 37,125 34,135 36,145 L 36,205 C 36,210 39,211 41,211 C 43,211 44,207 44,202 L 47,150 L 50,150 L 53,150 L 56,202 C 56,207 57,211 59,211 C 61,211 64,210 64,205 L 64,145 C 66,135 63,125 64,115 L 68,78 C 68,68 64,58 54,54 L 54,50 C 54,47 53,44 50,44 Z"
                      animate={{ scaleX: widthScale, scaleY: heightScale, originX: 0.5, originY: 0.4 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 120 }}
                      className="fill-purple-600/15 dark:fill-purple-500/15 stroke-purple-600/60 dark:stroke-purple-400/60 stroke-2"
                    />
                  </svg>
                </div>
                <div className="mt-4 text-center">
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-neutral-500 block">
                    Параметры фигуры
                  </span>
                  <span className="text-sm font-light text-gray-700 dark:text-neutral-300 mt-1 block">
                    ИМТ: <span className="font-semibold text-purple-600 dark:text-purple-400">{bmi.toFixed(1)}</span>
                  </span>
                </div>
              </div>

              {/* Right Side: Form Inputs */}
              <div className="md:col-span-7 space-y-6">
                {/* Height Input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-500">
                      Рост (см)
                    </label>
                    <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                      {height}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="140"
                    max="210"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-full h-1 bg-gray-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-600 dark:accent-purple-500"
                  />
                </div>

                {/* Weight Input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-500">
                      Вес (кг)
                    </label>
                    <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                      {weight}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="120"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full h-1 bg-gray-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-600 dark:accent-purple-500"
                  />
                </div>

                {/* Complexion Type */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-500 block mb-1">
                    Телосложение
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'slim', label: 'Худощавое' },
                      { key: 'normal', label: 'Обычное' },
                      { key: 'athletic', label: 'Спортивное' },
                      { key: 'heavy', label: 'Плотное' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setBodyType(item.key as 'slim' | 'normal' | 'athletic' | 'heavy')}
                        className={`px-3 py-2 text-xs font-medium border rounded-xl transition-all ${
                          bodyType === item.key
                            ? 'border-purple-600 bg-purple-500/5 text-purple-600 dark:border-purple-500 dark:bg-purple-500/10 dark:text-purple-400 font-semibold'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recommendation Box */}
                <div className="bg-purple-500/5 dark:bg-purple-500/5 border border-purple-500/15 dark:border-purple-500/10 rounded-2xl p-4 flex gap-3">
                  <div className="p-1 bg-purple-500 rounded-xl text-white h-fit mt-0.5">
                    <Sparkles size={14} className="animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-1">
                      Рекомендация стилиста
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-neutral-400 leading-relaxed font-light">
                      {recommendedText}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-100 dark:border-neutral-800/60 bg-gray-50/60 dark:bg-[#0c0c14]/40 flex items-center justify-between gap-4">
              <div className="flex items-center gap-1">
                <span className="text-xs font-light text-gray-400 dark:text-neutral-500 uppercase tracking-wider">
                  Расчетный размер:
                </span>
                <span className="text-lg font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent px-1">
                  {calculatedSize}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-neutral-800/40 transition-all"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectSize(calculatedSize);
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Применить размер</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
