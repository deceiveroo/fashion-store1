export type SoundId = 'hover' | 'favorite' | 'add-cart' | 'stylist-open';

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.04,
  pan = 0
): void {
  const ctx = getContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    void ctx.resume();
  }

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const panner = ctx.createStereoPanner();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  panner.pan.value = pan;
  gainNode.gain.setValueAtTime(gain, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(panner);
  panner.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, gain = 0.02): void {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();

  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
  }

  const source = ctx.createBufferSource();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2800;
  filter.Q.value = 0.8;

  source.buffer = buffer;
  gainNode.gain.value = gain;
  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  source.start();
}

export function playProductSound(id: SoundId, enabled: boolean): void {
  if (!enabled) return;

  switch (id) {
    case 'hover':
      playNoise(0.12, 0.015);
      break;
    case 'favorite':
      playTone(220, 0.25, 'sine', 0.05, -0.3);
      playTone(330, 0.35, 'sine', 0.04, 0.3);
      break;
    case 'add-cart':
      playTone(440, 0.15, 'triangle', 0.03);
      break;
    case 'stylist-open':
      playTone(523, 0.12, 'sine', 0.035, -0.2);
      playTone(659, 0.18, 'sine', 0.03, 0.2);
      break;
    default:
      break;
  }
}
