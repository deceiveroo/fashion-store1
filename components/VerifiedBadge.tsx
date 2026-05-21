import { CheckCircle } from 'lucide-react';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function VerifiedBadge({ size = 'md', className = '' }: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <CheckCircle 
      className={`${sizeClasses[size]} text-blue-500 inline-block ml-1 ${className}`} 
      aria-label="Верифицированный пользователь"
    />
  );
}
