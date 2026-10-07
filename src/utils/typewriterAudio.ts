// Web Audio API Synthesizer for tactile typewriter and mechanical key sounds
// 100% self-contained: synthesizes audio in real-time with zero external files or network requests

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export type TypewriterSoundType = 'key' | 'space' | 'enter' | 'backspace' | 'bell';

/**
 * Synthesizes a realistic tactile mechanical key sound
 * @param type Type of key pressed
 * @param volume Volume level between 0 and 1
 */
export function playTypewriterSound(type: TypewriterSoundType = 'key', volume: number = 0.45): void {
  const ctx = getAudioContext();
  if (!ctx || volume <= 0) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(Math.min(1, Math.max(0, volume)), now);
  masterGain.connect(ctx.destination);

  switch (type) {
    case 'enter': {
      // Mechanical carriage return sound: clack + resonant bell chime
      playMechanicalClick(ctx, masterGain, now, 0.9, 0.05);

      // Bell chime (classic typewriter ding)
      const osc = ctx.createOscillator();
      const bellGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2489, now); // D#7 bell tone
      osc.frequency.exponentialRampToValueAtTime(2400, now + 0.35);

      bellGain.gain.setValueAtTime(0.35 * volume, now);
      bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(bellGain);
      bellGain.connect(masterGain);
      osc.start(now + 0.02);
      osc.stop(now + 0.42);
      break;
    }

    case 'space': {
      // Spacebar: deeper, hollower mechanical thud
      playMechanicalClick(ctx, masterGain, now, 0.65, 0.06, 320);
      break;
    }

    case 'backspace': {
      // Backspace: slightly crisper, damped double-click
      playMechanicalClick(ctx, masterGain, now, 0.7, 0.04, 750);
      break;
    }

    case 'bell': {
      // Standalone milestone bell chime
      const osc = ctx.createOscillator();
      const bellGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2093, now); // C7 chime
      bellGain.gain.setValueAtTime(0.5 * volume, now);
      bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(bellGain);
      bellGain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.65);
      break;
    }

    case 'key':
    default: {
      // Standard mechanical key strike with slight pitch and timing randomization
      const pitchVariation = 0.92 + Math.random() * 0.16;
      playMechanicalClick(ctx, masterGain, now, 0.75, 0.035, 950 * pitchVariation);
      break;
    }
  }
}

function playMechanicalClick(
  ctx: AudioContext,
  destination: AudioNode,
  startTime: number,
  intensity: number,
  duration: number,
  centerFreq: number = 900
): void {
  // 1. Noise burst (mechanical snap)
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    // Decaying white noise
    const decay = 1 - i / bufferSize;
    output[i] = (Math.random() * 2 - 1) * Math.pow(decay, 2);
  }

  const whiteNoise = ctx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(centerFreq, startTime);
  filter.Q.setValueAtTime(3.0, startTime);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(intensity, startTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  whiteNoise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(destination);

  whiteNoise.start(startTime);
  whiteNoise.stop(startTime + duration);

  // 2. Low-frequency impact thud (body resonance)
  const impactOsc = ctx.createOscillator();
  const impactGain = ctx.createGain();
  impactOsc.type = 'triangle';
  impactOsc.frequency.setValueAtTime(centerFreq * 0.35, startTime);
  impactOsc.frequency.exponentialRampToValueAtTime(60, startTime + duration * 1.2);

  impactGain.gain.setValueAtTime(intensity * 0.5, startTime);
  impactGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 1.2);

  impactOsc.connect(impactGain);
  impactGain.connect(destination);

  impactOsc.start(startTime);
  impactOsc.stop(startTime + duration * 1.3);
}
