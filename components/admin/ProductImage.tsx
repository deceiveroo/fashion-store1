import Image from 'next/image';

interface ProductImageProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}

export function ProductImage({ src, alt, size = 80, className = '' }: ProductImageProps) {
  // Проверяем, является ли src валидным URL
  const isValidUrl = src && (src.startsWith('http') || src.startsWith('/'));
  
  if (!isValidUrl) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-gray-400 text-xs">No image</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`} style={{ width: size, height: size }}>
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="object-cover"
        loading="lazy"
        quality={75}
        unoptimized={src.startsWith('http') && !src.includes(process.env.NEXT_PUBLIC_SITE_URL || '')}
      />
    </div>
  );
}
