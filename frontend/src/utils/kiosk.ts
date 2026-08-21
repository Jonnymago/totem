import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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
  return updated;
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
    version: 'v1.2.10-kiosk-engine',
    lastHeartbeat: new Date().toISOString(),
  };
}
