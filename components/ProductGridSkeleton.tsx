'use client';

import { motion } from 'framer-motion';

interface ProductGridSkeletonProps {
  count?: number;
}

export default function ProductGridSkeleton({ count = 8 }: ProductGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-lg"
        >
          {/* Image skeleton */}
          <div className="relative h-80 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>

          {/* Content skeleton */}
          <div className="p-6 space-y-4">
            {/* Title */}
            <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-transparent via-white/30 dark:via-white/10 to-transparent"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 0.2,
                }}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-transparent via-white/30 dark:via-white/10 to-transparent"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                    delay: 0.3,
                  }}
                />
              </div>
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-3/4 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-transparent via-white/30 dark:via-white/10 to-transparent"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                    delay: 0.4,
                  }}
                />
              </div>
            </div>

            {/* Price and button */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="h-8 w-24 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-transparent via-white/30 dark:via-white/10 to-transparent"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                    delay: 0.5,
                  }}
                />
              </div>
              <div className="h-10 w-28 bg-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-900/50 dark:to-pink-900/50 rounded-2xl overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-transparent via-white/30 dark:via-white/10 to-transparent"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                    delay: 0.6,
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
