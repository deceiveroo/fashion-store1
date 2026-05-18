export type HapticPattern = 'light' | 'medium' | 'success';

const patterns: Record<HapticPattern, number | number[]> = {
  light: 8,
  medium: [12, 40, 12],
  success: [10, 30, 20],
};

export function triggerHaptic(pattern: HapticPattern = 'light'): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    navigator.vibrate(patterns[pattern]);
  } catch {
    /* unsupported */
  }
}
