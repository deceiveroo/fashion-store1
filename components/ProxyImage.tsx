'use client';

/**
 * ProxyImage - обёртка над <img> которая проксирует внешние картинки через Vercel CDN.
 * Используется вместо <img> для картинок с supabase.co и других заблокированных доменов.
 * Проксирование через /_next/image позволяет обойти блокировки из России.
 */

import { useState, ImgHTMLAttributes } from 'react';

const PROXY_DOMAINS = ['supabase.co', 'supabase.com'];

function shouldProxy(src?: string): boolean {
  if (!src) return false;
  return PROXY_DOMAINS.some(domain => src.includes(domain));
}

function getProxiedUrl(src: string, width: number = 256): string {
  if (!shouldProxy(src)) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
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
  const [errored, setErrored] = useState(false);
  
  const actualSrc = errored 
    ? fallbackSrc 
    : (src ? getProxiedUrl(src, proxyWidth) : fallbackSrc);

  return (
    <img
      {...props}
      src={actualSrc}
      onError={(e) => {
        if (!errored) {
          setErrored(true);
        }
        onError?.(e);
      }}
    />
  );
}

export { getProxiedUrl, shouldProxy };
