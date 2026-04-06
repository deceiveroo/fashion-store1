// app/config/design-tokens.ts
export const tokens = {
  colors: {
    primary: '#6366f1', // indigo
    primaryHover: '#4f46e5',
    secondary: '#8b5cf6', // violet
    secondaryHover: '#7c3aed',
    accent: '#ec4899', // pink
    accentHover: '#db2777',
    background: '#f8fafc', // slate-50
    surface: '#ffffff',
    surfaceHover: '#f1f5f9', // slate-100
    text: '#0f172a', // slate-900
    textSecondary: '#64748b', // slate-500
    border: '#e2e8f0', // slate-200
    success: '#10b981', // emerald-500
    warning: '#f59e0b', // amber-500
    error: '#ef4444', // red-500
    info: '#3b82f6', // blue-500
  },
  radii: {
    xs: '0.125rem', // 2px
    sm: '0.25rem',  // 4px
    md: '0.5rem',   // 8px
    lg: '0.75rem',  // 12px
    xl: '1rem',     // 16px
    '2xl': '1.5rem', // 24px
    '3xl': '2rem',   // 32px
    full: '9999px',  // Full round
  },
  spacing: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
    '3xl': '4rem',  // 64px
  },
  typography: {
    sizes: {
      xs: '0.75rem',  // 12px
      sm: '0.875rem', // 14px
      base: '1rem',   // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem',  // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
      '6xl': '3.75rem',  // 60px
    },
    weights: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    families: {
      sans: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        '"Noto Sans"',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
        '"Noto Color Emoji"',
      ].join(', '),
      serif: ['"Playfair Display"', 'serif'].join(', '),
      mono: [
        'SFMono-Regular',
        'Menlo',
        'Monaco',
        'Consolas',
        '"Liberation Mono"',
        '"Courier New"',
        'monospace',
      ].join(', '),
    },
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },
  transitions: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      ease: 'ease',
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};

// Theme configurations for different design styles
export const themeConfigs = {
  minimal: {
    colors: {
      primary: tokens.colors.primary,
      background: '#ffffff',
      surface: '#ffffff',
      text: tokens.colors.text,
    },
    radii: {
      card: tokens.radii.lg,
      button: tokens.radii.md,
    },
  },
  luxury: {
    colors: {
      primary: '#8b5cf6', // violet
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#0f172a',
    },
    radii: {
      card: tokens.radii.xl,
      button: tokens.radii.lg,
    },
  },
  eco: {
    colors: {
      primary: '#10b981', // emerald
      background: '#f0fdf4',
      surface: '#ffffff',
      text: '#065f46',
    },
    radii: {
      card: tokens.radii.lg,
      button: tokens.radii.md,
    },
  },
};