import { Platform } from 'react-native';
import { playNativeHardwareBeep, playQueueCallBeep } from '@/modules/kiosk-mode/src';

/**
 * Utility universale per suono di notifica nuove comande / allarmi
 * Supporta:
 * - Web Audio API (sintetizzatore a frequenza pura Ding-Dong)
 * - Android Native Beep (tramite kiosk module ToneGenerator)
 */

let webAudioCtx: any = null;

function getWebAudioContext(): any {
  if (Platform.OS !== 'web') return null;
  try {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!webAudioCtx || webAudioCtx.state === 'closed') {
      webAudioCtx = new AudioCtx();
    }
    if (webAudioCtx.state === 'suspended') {
      void webAudioCtx.resume();
    }
    return webAudioCtx;
  } catch {
    return null;
  }
}

function playWebTones(tones: { freq: number; start: number; dur: number; gain: number; type?: OscillatorType }[]): void {
  try {
    const ctx = getWebAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    for (const tone of tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = tone.type || 'sine';
      osc.frequency.setValueAtTime(tone.freq, now + tone.start);
      gain.gain.setValueAtTime(0.0001, now + tone.start);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.001, tone.gain), now + tone.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.start + tone.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + tone.start);
      osc.stop(now + tone.start + tone.dur + 0.02);
    }
  } catch (e) {
    console.warn('Cannot play web audio:', e);
  }
}

export function playKitchenChime(): void {
  if (Platform.OS === 'android') {
    playNativeHardwareBeep().catch(() => {});
  }
  playWebTones([
    { freq: 783.99, start: 0, dur: 0.35, gain: 0.28 },
    { freq: 1046.5, start: 0.18, dur: 0.52, gain: 0.32 },
  ]);
}

export function playAlertBeep(): void {
  if (Platform.OS === 'android') {
    playNativeHardwareBeep().catch(() => {});
  }
  playWebTones([{ freq: 880, start: 0, dur: 0.2, gain: 0.25, type: 'triangle' }]);
}

/** Suono forte e riconoscibile per avanzamento numero di coda (sala + cassa). */
export async function playQueueCallSound(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      const played = await playQueueCallBeep();
      if (!played) {
        await playNativeHardwareBeep().catch(() => {});
        await new Promise((r) => setTimeout(r, 220));
        await playNativeHardwareBeep().catch(() => {});
        await new Promise((r) => setTimeout(r, 220));
        await playNativeHardwareBeep().catch(() => {});
      }
    } catch {
      playNativeHardwareBeep().catch(() => {});
    }
  }
  playWebTones([
    { freq: 523.25, start: 0, dur: 0.22, gain: 0.95, type: 'square' },
    { freq: 880, start: 0.12, dur: 0.32, gain: 0.98, type: 'triangle' },
    { freq: 1174.7, start: 0.32, dur: 0.36, gain: 0.98, type: 'triangle' },
    { freq: 1318.5, start: 0.58, dur: 0.48, gain: 1, type: 'sine' },
  ]);
}
