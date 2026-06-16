'use client';

/**
 * ProxyImage - обёртка над <img> которая проксирует внешние картинки через Vercel CDN.
 * Используется вместо <img> для картинок с supabase.co и других заблокированных доменов.
 * Проксирование через /_next/image позволяет обойти блокировки из России.
 * 
 * Добавлена 3-этапная система фолбеков:
 * 1. Проксированная ссылка (через /_next/image) для обхода блокировок и сжатия.
 * 2. Прямая ссылка (напрямую с supabase) на клиенте, если локальный dev-сервер не может достучаться до Supabase.
 * 3. Локальный плейсхолдер, если картинка физически отсутствует.
 */

import { useState, useEffect, ImgHTMLAttributes } from 'react';

const PROXY_DOMAINS = ['supabase.co', 'supabase.com'];

// Должно совпадать с imageSizes ∪ deviceSizes в next.config.js. Оптимизатор
// next/image (v16) отдаёт 400, если w не равен в точности одному из этих значений.
const ALLOWED_WIDTHS = [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920];

function shouldProxy(src?: string): boolean {
  if (!src) return false;
  return PROXY_DOMAINS.some(domain => src.includes(domain));
}

function getProxiedUrl(src: string, width: number = 256): string {
  if (!shouldProxy(src)) return src;
  // Удваиваем ширину под retina/2x-экраны (иначе картинка мылит) и поднимаем
  // качество до 90. Next-оптимизатор сам ужмёт в AVIF/WebP, так что вес растёт умеренно.
  // Округляем вверх до ближайшего разрешённого размера — иначе /_next/image вернёт 400.
  const desired = Math.min(width * 2, 1920);
  const retinaWidth = ALLOWED_WIDTHS.find(w => w >= desired) ?? 1920;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${retinaWidth}&q=90`;
}

interface ProxyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  proxyWidth?: number;
  fallbackSrc?: string;
}

export default function ProxyImage({ 
  src, 
  proxyWidth = 256, 
  fallbackSrc = '/placeholder-image.jpg',
  onError,
  ...props 
}: ProxyImageProps) {
  // 0 - проксированная, 1 - прямая ссылка, 2 - плейсхолдер
  const [stage, setStage] = useState<0 | 1 | 2>(0);

  // Сбрасываем стадию при смене картинки
  useEffect(() => {
    setStage(0);
  }, [src]);
  
  const actualSrc = (() => {
    if (!src || typeof src !== 'string') return fallbackSrc;
    if (stage === 0) return getProxiedUrl(src, proxyWidth);
    if (stage === 1) return src; // Пробуем напрямую на клиенте
    return fallbackSrc;
  })();

  return (
    <img
      {...props}
      src={actualSrc}
      onError={(e) => {
        if (stage === 0) {
          // Если прокси-сервер выдал 400 (например, в dev-режиме локальный сервер не смог скачать файл)
          setStage(1);
        } else if (stage === 1) {
          // Если и прямая ссылка битая
          setStage(2);
        }
        onError?.(e);
      }}
    />
  );
}

export { getProxiedUrl, shouldProxy };

