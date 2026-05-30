// components/checkout/FuturisticProgress.tsx
'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface Step {
  id: number;
  name: string;
  description: string;
  completed: boolean;
}

interface FuturisticProgressProps {
  steps: Step[];
  currentStep: number;
}

export default function FuturisticProgress({ steps, currentStep }: FuturisticProgressProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-8">
      {/* Progress line */}
      <div className="relative">
        {/* Background */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />

        {/* Active progress */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="absolute top-5 left-0 h-1 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full"
        />

        {/* Step dots */}
        <div className="relative flex justify-between">
          {steps.map((step) => {
            const isCompleted = step.completed;
            const isCurrent = step.id === currentStep;
            const isActive = isCompleted || isCurrent;

            return (
              <div key={step.id} className="flex flex-col items-center">
                {/* Dot */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={16} className="text-white" strokeWidth={3} />
                  ) : (
                    <span className={`text-sm font-bold ${isCurrent ? 'text-white' : 'text-gray-400'}`}>
                      {step.id}
                    </span>
                  )}
                </div>

                {/* Label */}
                <p
                  className={`mt-3 text-sm font-medium ${
                    isActive ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400'
                  }`}
                >
                  {step.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
