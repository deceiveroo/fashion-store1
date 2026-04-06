// Tailwind CSS v4 Configuration
// Note: In Tailwind v4, most configuration is done in CSS using @theme directive
// This file is kept for compatibility with tools that expect it
// See app/globals.css for the actual v4 configuration

import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
} satisfies Config;