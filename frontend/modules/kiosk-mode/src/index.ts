import { requireNativeModule } from 'expo-modules-core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, BackHandler, AppState } from 'react-native';

export interface KioskDiagnostics {
  isLockTaskActive: boolean;
  lockTaskModeState: number; // 0 = NONE, 1 = LOCKED, 2 = PINNED
  isDeviceOwner: boolean;
  isProfileOwner: boolean;
  isDeviceAdmin: boolean;
  isDefaultHome: boolean;
  packageName: string;
  adminReceiver: string;
}

interface KioskModeModule {
  startLockTask(): Promise<boolean>;
  stopLockTask(): Promise<boolean>;
  isLockTaskActive(): Promise<boolean>;
  getKioskDiagnostics?(): Promise<KioskDiagnostics>;
  openHomeSettings?(): Promise<boolean>;
  openScreenPinningSettings?(): Promise<boolean>;
  openAppSettings?(): Promise<boolean>;
  requestDeviceAdmin?(): Promise<boolean>;
  hideSystemUI?(): Promise<boolean>;
  showSystemUI?(): Promise<boolean>;
  setScreenOrientation?(orientation: string): Promise<boolean>;
  setScreenBrightness?(brightness: number): Promise<boolean>;
  playHardwareBeep?(): Promise<boolean>;
}

const KIOSK_PREF_KEY = 'kiosk_mode_enabled';
const WATCHDOG_MS = 1500;

let nativeModule: KioskModeModule | null = null;
let backHandlerSub: { remove: () => void } | null = null;
let watchdogTimer: ReturnType<typeof setInterval> | null = null;
let appStateSub: { remove: () => void } | null = null;

try {
  if (Platform.OS === 'android') {
    nativeModule = requireNativeModule('KioskMode');
  }
} catch {
  // Native module not available
}

async function setPreferred(enabled: boolean) {
  try {
    await AsyncStorage.setItem(KIOSK_PREF_KEY, enabled ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export async function isKioskPreferred(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KIOSK_PREF_KEY);
    return v !== '0'; // default attivo per totem
  } catch {
    return true;
  }
}

function blockHardwareBack() {
  if (backHandlerSub) return;
  backHandlerSub = BackHandler.addEventListener('hardwareBackPress', () => true);
}

function unblockHardwareBack() {
  if (backHandlerSub) {
    backHandlerSub.remove();
    backHandlerSub = null;
  }
}

/** Re-applica lock + immersive in modo aggressivo (necessario su Totem). */
export async function forceLockNow(): Promise<void> {
  if (!nativeModule || Platform.OS !== 'android') return;
  try {
    await nativeModule.startLockTask();
  } catch {
    /* ignore */
  }
  try {
    await nativeModule.hideSystemUI?.();
  } catch {
    /* ignore */
  }
  blockHardwareBack();
}

export function startWatchdog() {
  if (Platform.OS !== 'android') return;
  if (watchdogTimer) return;

  // Timer continuo: ogni 1.5s ri-forza immersive + lock task se abilitato
  watchdogTimer = setInterval(() => {
    void forceLockNow();
  }, WATCHDOG_MS);

  if (!appStateSub) {
    appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void forceLockNow();
      }
    });
  }

  // Prima applicazione immediata
  void forceLockNow();
}

export function stopWatchdog() {
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }
  if (appStateSub) {
    appStateSub.remove();
    appStateSub = null;
  }
}

export async function startKioskMode(): Promise<boolean> {
  await setPreferred(true);
  blockHardwareBack();
  startWatchdog();

  if (!nativeModule) return true;

  try {
    const ok = await nativeModule.startLockTask();
    try {
      await nativeModule.hideSystemUI?.();
    } catch {
      /* optional */
    }
    return ok;
  } catch {
    return false;
  }
}

export async function stopKioskMode(): Promise<boolean> {
  stopWatchdog();
  unblockHardwareBack();
  await setPreferred(false);

  if (!nativeModule) return true;
  try {
    const ok = await nativeModule.stopLockTask();
    try {
      await nativeModule.showSystemUI?.();
    } catch {}
    return ok;
  } catch {
    return false;
  }
}

export async function isKioskModeActive(): Promise<boolean> {
  if (!nativeModule) {
    return isKioskPreferred();
  }
  try {
    const active = await nativeModule.isLockTaskActive();
    if (active) blockHardwareBack();
    return active;
  } catch {
    return isKioskPreferred();
  }
}

export async function getKioskDiagnostics(): Promise<KioskDiagnostics> {
  if (!nativeModule?.getKioskDiagnostics) {
    return {
      isLockTaskActive: false,
      lockTaskModeState: 0,
      isDeviceOwner: false,
      isProfileOwner: false,
      isDeviceAdmin: false,
      isDefaultHome: false,
      packageName: 'com.emergent.quickorderstation.eku1ku',
      adminReceiver: 'expo.modules.kioskmode.KioskDeviceAdminReceiver',
    };
  }
  try {
    return await nativeModule.getKioskDiagnostics();
  } catch {
    return {
      isLockTaskActive: false,
      lockTaskModeState: 0,
      isDeviceOwner: false,
      isProfileOwner: false,
      isDeviceAdmin: false,
      isDefaultHome: false,
      packageName: 'com.emergent.quickorderstation.eku1ku',
      adminReceiver: 'expo.modules.kioskmode.KioskDeviceAdminReceiver',
    };
  }
}

export async function openHomeSettings(): Promise<boolean> {
  if (!nativeModule?.openHomeSettings) return false;
  try {
    return await nativeModule.openHomeSettings();
  } catch {
    return false;
  }
}

export async function openScreenPinningSettings(): Promise<boolean> {
  if (!nativeModule?.openScreenPinningSettings) return false;
  try {
    return await nativeModule.openScreenPinningSettings();
  } catch {
    return false;
  }
}

export async function openAppSettings(): Promise<boolean> {
  if (!nativeModule?.openAppSettings) return false;
  try {
    return await nativeModule.openAppSettings();
  } catch {
    return false;
  }
}

export async function requestDeviceAdmin(): Promise<boolean> {
  if (!nativeModule?.requestDeviceAdmin) return false;
  try {
    return await nativeModule.requestDeviceAdmin();
  } catch {
    return false;
  }
}

export async function setNativeScreenOrientation(orientation: 'portrait' | 'landscape' | 'auto'): Promise<boolean> {
  if (!nativeModule?.setScreenOrientation) return false;
  try {
    return await nativeModule.setScreenOrientation(orientation);
  } catch {
    return false;
  }
}

export async function setNativeScreenBrightness(levelPercent: number): Promise<boolean> {
  if (!nativeModule?.setScreenBrightness) return false;
  try {
    const normalized = Math.max(0.05, Math.min(1.0, levelPercent / 100));
    return await nativeModule.setScreenBrightness(normalized);
  } catch {
    return false;
  }
}

export async function playNativeHardwareBeep(): Promise<boolean> {
  if (!nativeModule?.playHardwareBeep) return false;
  try {
    return await nativeModule.playHardwareBeep();
  } catch {
    return false;
  }
}

export async function hideNativeSystemUI(): Promise<boolean> {
  if (!nativeModule?.hideSystemUI) return false;
  try {
    return await nativeModule.hideSystemUI();
  } catch {
    return false;
  }
}

export async function showNativeSystemUI(): Promise<boolean> {
  if (!nativeModule?.showSystemUI) return false;
  try {
    return await nativeModule.showSystemUI();
  } catch {
    return false;
  }
}

/**
 * All'avvio / resume: se kiosk era abilitato, riattiva lock + watchdog.
 */
export async function ensureKioskIfPreferred(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const preferred = await isKioskPreferred();
  if (!preferred) {
    stopWatchdog();
    return;
  }
  startWatchdog();
  await forceLockNow();
}
