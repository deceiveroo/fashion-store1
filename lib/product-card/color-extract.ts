export type DominantColor = {
  r: number;
  g: number;
  b: number;
  hex: string;
};

const colorCache = new Map<string, DominantColor>();

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

export function applyDominantColorVars(el: HTMLElement, color: DominantColor): void {
  el.style.setProperty('--fc-accent', color.hex);
  el.style.setProperty('--fc-accent-rgb', `${color.r} ${color.g} ${color.b}`);
  el.style.setProperty('--fc-glow', `rgba(${color.r}, ${color.g}, ${color.b}, 0.35)`);
}

export async function extractDominantColor(
  imageUrl: string,
  cacheKey?: string
): Promise<DominantColor | null> {
  const key = cacheKey ?? imageUrl;
  const cached = colorCache.get(key);
  if (cached) return cached;

  if (typeof window === 'undefined') return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 32;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;

        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha < 128) continue;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }

        if (count === 0) {
          resolve(null);
          return;
        }

        const color: DominantColor = {
          r: Math.round(r / count),
          g: Math.round(g / count),
          b: Math.round(b / count),
          hex: rgbToHex(r / count, g / count, b / count),
        };
        colorCache.set(key, color);
        resolve(color);
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}
