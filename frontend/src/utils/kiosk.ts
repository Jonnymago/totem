import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, StatusBar as RNStatusBar } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { startKioskMode, stopKioskMode } from '../../modules/kiosk-mode/src';

const STORAGE_KEY_KIOSK = 'TOTEM_KIOSK_CONFIG_V1';

export interface KioskConfig {
  kioskEnabled: boolean;
  immersiveFullscreen: boolean;
  keepScreenAwake: boolean;
  autoStartOnBoot: boolean;
  
  // Timeout e Salvaschermo
  inactivityTimeoutSec: number; // 0 = disattivato, 30, 60, 120, 300
  screensaverMode: 'promo_banner' | 'dimmed' | 'clock' | 'black';
  autoResetCartOnInactivity: boolean;
  autoResetCartTimeoutSec: number; // 30, 45, 60, 90

  // Luminosità & Risparmio
  brightnessLevel: number; // 10 - 100
  nightDimmingEnabled: boolean;
  nightDimmingStart: string; // '23:00'
  nightDimmingEnd: string; // '07:00'
  screenOrientation: 'portrait' | 'landscape' | 'auto';

  // Sicurezza & Gesture
  secretTapsCount: number; // 5 o 7
  secretTriggerLocation: 'top-right' | 'top-left' | 'logo';
  requirePinForExit: boolean;

  // Kiosk REST API
  restApiEnabled: boolean;
  allowRemoteWake: boolean;
  allowRemoteReload: boolean;
}

export const DEFAULT_KIOSK_CONFIG: KioskConfig = {
  kioskEnabled: true,
  immersiveFullscreen: true,
  keepScreenAwake: true,
  autoStartOnBoot: true,

  inactivityTimeoutSec: 60,
  screensaverMode: 'promo_banner',
  autoResetCartOnInactivity: true,
  autoResetCartTimeoutSec: 45,

  brightnessLevel: 90,
  nightDimmingEnabled: true,
  nightDimmingStart: '23:00',
  nightDimmingEnd: '07:00',
  screenOrientation: 'portrait',

  secretTapsCount: 7,
  secretTriggerLocation: 'top-right',
  requirePinForExit: true,

  restApiEnabled: true,
  allowRemoteWake: true,
  allowRemoteReload: true,
};

export async function getKioskConfig(): Promise<KioskConfig> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_KIOSK);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_KIOSK_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn('Errore lettura configurazione Kiosk:', e);
  }
  return DEFAULT_KIOSK_CONFIG;
}

export async function saveKioskConfig(config: Partial<KioskConfig>): Promise<KioskConfig> {
  const current = await getKioskConfig();
  const updated: KioskConfig = { ...current, ...config };
  try {
    await AsyncStorage.setItem(STORAGE_KEY_KIOSK, JSON.stringify(updated));
  } catch (e) {
    console.warn('Errore salvataggio configurazione Kiosk:', e);
  }
  
  // Applica immediatamente le impostazioni hardware
  await applyKioskHardwareSettings(updated);
  return updated;
}

/**
 * Applica effettivamente le configurazioni hardware su Android e Web.
 */
export async function applyKioskHardwareSettings(config: KioskConfig): Promise<void> {
  try {
    // 1. Keep Screen Awake (Schermo Sempre Acceso)
    if (config.keepScreenAwake) {
      await activateKeepAwakeAsync().catch(() => {});
    } else {
      try {
        deactivateKeepAwake();
      } catch {}
    }

    // 2. Immersive Mode & Status Bar
    if (Platform.OS === 'android') {
      RNStatusBar.setHidden(Boolean(config.immersiveFullscreen), 'fade');
    }

    // 3. Kiosk Lock Task Mode (Android)
    if (Platform.OS === 'android') {
      if (config.kioskEnabled) {
        await startKioskMode().catch(() => {});
      } else {
        await stopKioskMode().catch(() => {});
      }
    }
  } catch (e) {
    console.warn('Errore applicazione hardware kiosk:', e);
  }
}

/**
 * Verifica se l'ora attuale rientra nella fascia oraria di Dimming Notturno
 */
export function isNightDimmingTime(startStr: string = '23:00', endStr: string = '07:00'): boolean {
  try {
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = (startStr || '23:00').split(':').map((v) => parseInt(v, 10) || 0);
    const [endH, endM] = (endStr || '07:00').split(':').map((v) => parseInt(v, 10) || 0);

    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    if (startMin > endMin) {
      // Fascia che scavalca la mezzanotte (es. 23:00 -> 07:00)
      return currentMin >= startMin || currentMin < endMin;
    } else {
      // Fascia nello stesso giorno
      return currentMin >= startMin && currentMin < endMin;
    }
  } catch {
    return false;
  }
}

/**
 * Genera feedback acustico e aptico
 */
export function playKioskBeep(): void {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  } catch {}

  try {
    if (typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      }
    }
  } catch {}
}

export interface KioskTelemetry {
  status: 'active' | 'screensaver' | 'dimmed';
  uptimeSeconds: number;
  freeMemoryMb: number;
  batteryLevel: number | null;
  isCharging: boolean;
  screenBrightness: number;
  ipAddress: string;
  version: string;
  lastHeartbeat: string;
}

export async function getKioskTelemetry(): Promise<KioskTelemetry> {
  const config = await getKioskConfig();
  return {
    status: config.kioskEnabled ? 'active' : 'dimmed',
    uptimeSeconds: Math.floor((Date.now() - 1718000000000) / 1000) % 86400,
    freeMemoryMb: 512,
    batteryLevel: 100,
    isCharging: true,
    screenBrightness: config.brightnessLevel,
    ipAddress: '192.168.1.9',
    version: '1.2.10',
    lastHeartbeat: new Date().toISOString(),
  };
}
