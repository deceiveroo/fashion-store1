'use client';

import Link from 'next/link';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

/**
 * Единая брендовая кнопка приложения. Варианты + размеры + иконки + состояние загрузки.
 * primary — брендовый фиолетовый градиент (#8b7cf6 → #c4b5fd).
 * Решает разнобой ad-hoc кнопок `from-purple-600 to-pink-600 rounded-lg` и их переполнение
 * (whitespace-nowrap + единые высоты). Может рендериться как <button> или <Link> (через href).
 */
export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
  children?: ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & { href?: undefined };

type ButtonAsLink = CommonProps & {
  href: string;
  onClick?: () => void;
  target?: string;
  rel?: string;
};

type ButtonProps = ButtonAsButton | ButtonAsLink;

const BASE =
  'group/btn relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b7cf6]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]';

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-xs',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40',
  outline:
    'border border-[var(--fc-glass-border)] bg-[var(--fc-surface)] text-[var(--foreground)] backdrop-blur-md hover:bg-[var(--fc-surface-elevated)] hover:shadow-md',
  ghost: 'text-[var(--text-secondary)] hover:bg-[var(--fc-surface-elevated)] hover:text-[var(--foreground)]',
  danger: 'text-white bg-rose-500 shadow-lg shadow-rose-500/25 hover:bg-rose-600',
  success: 'text-white bg-emerald-500 shadow-lg shadow-emerald-500/25 hover:bg-emerald-600',
};

const PRIMARY_GRADIENT = { backgroundImage: 'linear-gradient(135deg, #8b7cf6, #c4b5fd)' };

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  const {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    icon,
    iconRight,
    className = '',
    children,
    ...rest
  } = props as CommonProps & Record<string, unknown>;

  const classes = `${BASE} ${SIZES[size]} ${VARIANTS[variant]} ${fullWidth ? 'w-full' : ''} ${className}`;
  const style = variant === 'primary' ? PRIMARY_GRADIENT : undefined;

  const inner = (
    <span className="relative inline-flex items-center gap-2">
      {loading ? <Spinner /> : icon}
      {children}
      {!loading && iconRight}
    </span>
  );

  if ('href' in props && props.href) {
    const { href, target, rel, onClick } = props as ButtonAsLink;
    return (
      <Link href={href} target={target} rel={rel} onClick={onClick} className={classes} style={style}>
        {inner}
      </Link>
    );
  }

  const { disabled, ...buttonRest } = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button ref={ref} className={classes} style={style} disabled={disabled || loading} {...buttonRest}>
      {inner}
    </button>
  );
});

export default Button;
