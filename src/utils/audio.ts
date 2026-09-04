// Synthesized Web Audio API Beep and Feedback Utility

export function playBeep(freq: number = 880, durationMs: number = 180): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch (e) {
    console.warn('AudioContext playback error:', e);
  }
}

export function playSuccessBeep(): void {
  playBeep(659, 100); // E5
  setTimeout(() => playBeep(880, 150), 100); // A5
}

export function playAlertBeep(): void {
  playBeep(440, 150);
  setTimeout(() => playBeep(330, 200), 160);
}

/** Suono forte per avanzamento numero di coda sulla sala / admin remoto. */
export function playQueueCallSound(): void {
  playBeep(880, 220);
  setTimeout(() => playBeep(1175, 260), 200);
  setTimeout(() => playBeep(1319, 320), 460);
}
