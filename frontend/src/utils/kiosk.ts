import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, StatusBar as RNStatusBar } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import * as Network from 'expo-network';
import {
  startKioskMode,
  stopKioskMode,
  setNativeScreenOrientation,
  setNativeScreenBrightness,
  playNativeHardwareBeep,
  hideNativeSystemUI,
  showNativeSystemUI,
  setKeepScreenOn,
  getKioskDiagnostics,
  getBatteryStatus,
  getWifiIpv4Address,
  setNativeAutoStartOnBoot,
} from '../../modules/kiosk-mode/src';

const STORAGE_KEY_KIOSK = 'TOTEM_KIOSK_CONFIG_V1';

async function getLocalIpAddress(): Promise<string> {
  const nativeWifiIp = await getWifiIpv4Address().catch(() => '');
  if (nativeWifiIp && nativeWifiIp !== '0.0.0.0' && nativeWifiIp !== '127.0.0.1' && !nativeWifiIp.startsWith('169.254.')) {
    return nativeWifiIp;
  }
  try {
    const ip = await Network.getIpAddressAsync();
    return ip && ip !== '0.0.0.0' && ip !== '127.0.0.1' && !ip.startsWith('169.254.') ? ip : '';
  } catch {
    return '';
  }
}

export interface KioskConfig {
  kioskEnabled: boolean;
  immersiveFullscreen: boolean;
  keepScreenAwake: boolean;
  autoStartOnBoot: boolean;
  
  // Timeout e Salvaschermo
  inactivityTimeoutSec: number; // 0 = disattivato, 30, 60, 120, 300
  screensaverMode: 'promo_banner' | 'dimmed' | 'clock' | 'black';
  /** Ritorna alla home cliente dopo inattività nella fase d'ordine. */
  autoReturnHomeOnInactivity: boolean;
  autoReturnHomeTimeoutSec: number; // 30, 45, 60, 90, 120, 180, 300
  /** Se attivo, svuota anche il carrello quando scatta il ritorno automatico. */
  autoResetCartOnInactivity: boolean;
  /** Compatibilità con configurazioni precedenti; migrato sul timeout rientro home. */
  autoResetCartTimeoutSec: number; // 30, 45, 60, 90

  // Luminosità & Risparmio
  brightnessLevel: number; // 10 - 100
  nightDimmingEnabled: boolean;
  nightDimmingStart: string; // '23:00'
  nightDimmingEnd: string; // '07:00'
  screenOrientation: 'portrait' | 'landscape' | 'auto';

  // Sicurezza & Gesture
  secretTapsCount: number; // 5 o 7
  secretTriggerLocation: 'top-center' | 'top-right' | 'top-left' | 'logo';
  requirePinForExit: boolean;

  // Kiosk REST API
  restApiEnabled: boolean;
  allowRemoteWake: boolean;
  allowRemoteReload: boolean;
}

export const DEFAULT_KIOSK_CONFIG: KioskConfig = {
  // Il primo avvio deve essere sempre sbloccato: l’amministratore abilita il
  // blocco kiosk solo dal pannello dopo avere completato la configurazione.
  kioskEnabled: false,
  immersiveFullscreen: false,
  keepScreenAwake: false,
  autoStartOnBoot: false,

  inactivityTimeoutSec: 60,
  screensaverMode: 'promo_banner',
  autoReturnHomeOnInactivity: true,
  autoReturnHomeTimeoutSec: 45,
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
      const legacyTimeout = Number(parsed.autoResetCartTimeoutSec);
      return {
        ...DEFAULT_KIOSK_CONFIG,
        ...parsed,
        // Le installazioni esistenti mantengono il timeout precedentemente
        // scelto per il reset carrello, ora usato anche per il rientro home.
        autoReturnHomeOnInactivity: parsed.autoReturnHomeOnInactivity ?? parsed.autoResetCartOnInactivity ?? true,
        autoReturnHomeTimeoutSec: Number.isFinite(legacyTimeout) && legacyTimeout > 0
          ? legacyTimeout
          : (parsed.autoReturnHomeTimeoutSec ?? DEFAULT_KIOSK_CONFIG.autoReturnHomeTimeoutSec),
      };
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
      if (Platform.OS === 'android') {
        await setKeepScreenOn(true).catch(() => {});
      }
    } else {
      try {
        // In ambiente web Expo restituisce una Promise rifiutata se il wake
        // lock non è mai stato attivato; attenderla evita l’overlay di errore.
        await deactivateKeepAwake();
      } catch {}
      if (Platform.OS === 'android') {
        await setKeepScreenOn(false).catch(() => {});
      }
    }

    // 2. Avvio automatico: la preferenza viene letta dal receiver nativo al boot.
    if (Platform.OS === 'android') {
      await setNativeAutoStartOnBoot(Boolean(config.autoStartOnBoot)).catch(() => {});
    }

    // 3. Immersive Mode & Status Bar & Navigation Bar
    if (Platform.OS === 'android') {
      RNStatusBar.setHidden(Boolean(config.immersiveFullscreen), 'fade');
      if (config.immersiveFullscreen) {
        await hideNativeSystemUI().catch(() => {});
      } else {
        await showNativeSystemUI().catch(() => {});
      }
    }

    // 4. Orientamento Display (Android + Web)
    const targetOrientation = config.screenOrientation || 'portrait';
    if (Platform.OS === 'android') {
      await setNativeScreenOrientation(targetOrientation).catch(() => {});
    } else if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof screen !== 'undefined') {
      try {
        const anyScreen = screen as any;
        if (anyScreen.orientation?.lock) {
          if (targetOrientation === 'portrait') {
            anyScreen.orientation.lock('portrait').catch(() => {});
          } else if (targetOrientation === 'landscape') {
            anyScreen.orientation.lock('landscape').catch(() => {});
          } else {
            anyScreen.orientation.unlock?.();
          }
        }
      } catch {}
    }

    // 5. Luminosità Schermo Hardware
    if (Platform.OS === 'android') {
      await setNativeScreenBrightness(config.brightnessLevel || 90).catch(() => {});
    }

    // 6. Kiosk Lock Task Mode (Android)
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
      return currentMin >= startMin && currentMin < endMin;
    }
  } catch {
    return false;
  }
}

/**
 * Trigger per sblocco amministratore tramite gesture segreta.
 */
class SecretGestureController {
  private tapTimes: number[] = [];

  public registerTap(targetLocation: 'top-center' | 'top-right' | 'top-left' | 'logo', config: KioskConfig): boolean {
    if (config.secretTriggerLocation !== targetLocation) {
      this.tapTimes = [];
      return false;
    }

    const now = Date.now();
    // Considera validi i tap distanti meno di 700ms l'uno dall'altro
    this.tapTimes = this.tapTimes.filter((t) => now - t < 700 * (config.secretTapsCount || 7));
    this.tapTimes.push(now);

    // Feedback aptico leggero a ogni tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    if (this.tapTimes.length >= (config.secretTapsCount || 7)) {
      this.tapTimes = [];
      // Feedback aptico forte di successo
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      return true;
    }
    return false;
  }

  public reset() {
    this.tapTimes = [];
  }
}

export const secretGesture = new SecretGestureController();

export interface KioskTelemetry {
  status: 'active' | 'screensaver' | 'dimmed';
  uptimeSeconds: number;
  batteryLevel: number | null;
  isCharging: boolean;
  screenBrightness: number;
  ipAddress: string;
  version: string;
  lastHeartbeat: string;
  isDeviceOwner: boolean;
  isLockTaskActive: boolean;
}

/** Riproduce un riscontro udibile e aptico, con fallback WebAudio quando disponibile. */
export function playKioskBeep(): void {
  void playTotemBeep();
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  if (Platform.OS === 'web') {
    try {
      const AudioContextCtor = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
      if (!AudioContextCtor) return;
      const context = new AudioContextCtor();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.setValueAtTime(880, context.currentTime);
      gain.gain.setValueAtTime(0.15, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.18);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.18);
    } catch {}
  }
}

export async function playTotemBeep(): Promise<void> {
  if (Platform.OS === 'android') {
    await playNativeHardwareBeep().catch(() => {});
  }
}

/** Espone stato reale del kiosk al pannello remoto senza valori segnaposto. */
export async function getKioskTelemetry(): Promise<KioskTelemetry> {
  const [config, ipAddress, diagnostics, battery] = await Promise.all([
    getKioskConfig(),
    getLocalIpAddress(),
    getKioskDiagnostics(),
    getBatteryStatus(),
  ]);
  return {
    status: config.kioskEnabled ? 'active' : 'dimmed',
    uptimeSeconds: Math.floor(Date.now() / 1000),
    batteryLevel: battery?.level ?? null,
    isCharging: Boolean(battery?.isCharging),
    screenBrightness: config.brightnessLevel,
    ipAddress,
    version: '1.2.18',
    lastHeartbeat: new Date().toISOString(),
    isDeviceOwner: Boolean(diagnostics?.isDeviceOwner),
    isLockTaskActive: Boolean(diagnostics?.isLockTaskActive),
  };
}
