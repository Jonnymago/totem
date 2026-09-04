import { requireOptionalNativeModule } from 'expo-modules-core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, BackHandler, AppState } from 'react-native';

export interface KioskDiagnostics {
  isLockTaskActive: boolean;
  lockTaskModeState: number; // 0 = NONE, 1 = LOCKED, 2 = PINNED
  isDeviceOwner: boolean;
  isProfileOwner: boolean;
  isDeviceAdmin: boolean;
  isDefaultHome: boolean;
  isIgnoringBattery?: boolean;
  packageName: string;
  adminReceiver: string;
}

export interface BatteryStatus {
  level: number;
  isCharging: boolean;
}

export interface SystemInfo {
  deviceModel: string;
  androidVersion: string;
  sdkInt?: number;
  storageFreeMb?: number;
  storageTotalMb?: number;
}

interface KioskModeModule {
  startLockTask(): Promise<boolean>;
  stopLockTask(): Promise<boolean>;
  isLockTaskActive(): Promise<boolean>;
  getKioskDiagnostics?(): Promise<KioskDiagnostics>;
  isIgnoringBatteryOptimizations?(): Promise<boolean>;
  requestIgnoreBatteryOptimizations?(): Promise<boolean>;
  openHomeSettings?(): Promise<boolean>;
  openScreenPinningSettings?(): Promise<boolean>;
  openAppSettings?(): Promise<boolean>;
  requestDeviceAdmin?(): Promise<boolean>;
  bringToFront?(): Promise<boolean>;
  hideSystemUI?(): Promise<boolean>;
  showSystemUI?(): Promise<boolean>;
  setKeepScreenOn?(enabled: boolean): Promise<boolean>;
  setAutoStartOnBoot?(enabled: boolean): Promise<boolean>;
  turnScreenOn?(): Promise<boolean>;
  turnScreenOff?(): Promise<boolean>;
  rebootDevice?(): Promise<boolean>;
  setScreenOrientation?(orientation: string): Promise<boolean>;
  setScreenBrightness?(brightness: number): Promise<boolean>;
  playHardwareBeep?(): Promise<boolean>;
  playQueueCallBeep?(): Promise<boolean>;
  getWifiIpv4Address?(): Promise<string>;
  getBatteryStatus?(): Promise<BatteryStatus>;
  getSystemInfo?(): Promise<SystemInfo>;
}

const KIOSK_PREF_KEY = 'kiosk_mode_enabled';
const WATCHDOG_MS = 1500;

let nativeModule: KioskModeModule | null = null;

/**
 * Expo completa la registry dei moduli durante l'avvio dell'app. Una risoluzione
 * eseguita troppo presto veniva memorizzata come `null` per tutta la sessione,
 * anche se KioskMode era presente nell'APK. Ogni comando hardware ritenta quindi
 * la lettura fino a quando il bridge Android è disponibile.
 */
function getNativeKioskModule(): KioskModeModule | null {
  if (Platform.OS !== 'android') return null;
  if (!nativeModule) {
    nativeModule = requireOptionalNativeModule<KioskModeModule>('KioskMode');
  }
  return nativeModule;
}

let backHandlerSub: { remove: () => void } | null = null;
let watchdogTimer: ReturnType<typeof setInterval> | null = null;
let appStateSub: { remove: () => void } | null = null;

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
    // L’assenza della chiave equivale a primo avvio: il kiosk è disattivato
    // finché l’amministratore non lo abilita esplicitamente dal pannello.
    return v === '1';
  } catch {
    return false;
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
  const module = getNativeKioskModule();
  if (!module || Platform.OS !== 'android') return;
  try {
    await module.startLockTask();
  } catch {
    /* ignore */
  }
  try {
    await module.hideSystemUI?.();
  } catch {
    /* ignore */
  }
  try {
    await module.setKeepScreenOn?.(true);
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

  const module = getNativeKioskModule();
  if (!module) {
    stopWatchdog();
    unblockHardwareBack();
    return false;
  }

  try {
    const ok = await module.startLockTask();
    try {
      await module.hideSystemUI?.();
    } catch {}
    try {
      await module.setKeepScreenOn?.(true);
    } catch {}
    return ok;
  } catch {
    return false;
  }
}

export async function stopKioskMode(): Promise<boolean> {
  stopWatchdog();
  unblockHardwareBack();
  await setPreferred(false);

  const module = getNativeKioskModule();
  if (!module) return false;
  try {
    const ok = await module.stopLockTask();
    try {
      await module.showSystemUI?.();
    } catch {}
    try {
      await module.setKeepScreenOn?.(false);
    } catch {}
    return ok;
  } catch {
    return false;
  }
}

export async function setNativeAutoStartOnBoot(enabled: boolean): Promise<boolean> {
  const module = getNativeKioskModule();
  if (!module?.setAutoStartOnBoot) return false;
  try {
    return await module.setAutoStartOnBoot(enabled);
  } catch {
    return false;
  }
}

export async function isKioskModeActive(): Promise<boolean> {
  const module = getNativeKioskModule();
  if (!module) return false;
  try {
    const active = await module.isLockTaskActive();
    if (active) blockHardwareBack();
    return active;
  } catch {
    return isKioskPreferred();
  }
}

export async function getKioskDiagnostics(): Promise<KioskDiagnostics> {
  const module = getNativeKioskModule();
  if (!module?.getKioskDiagnostics) {
    return {
      isLockTaskActive: false,
      lockTaskModeState: 0,
      isDeviceOwner: false,
      isProfileOwner: false,
      isDeviceAdmin: false,
      isDefaultHome: false,
      isIgnoringBattery: true,
      packageName: 'com.emergent.quickorderstation.eku1ku',
      adminReceiver: 'expo.modules.kioskmode.KioskDeviceAdminReceiver',
    };
  }
  try {
    return await module.getKioskDiagnostics();
  } catch {
    return {
      isLockTaskActive: false,
      lockTaskModeState: 0,
      isDeviceOwner: false,
      isProfileOwner: false,
      isDeviceAdmin: false,
      isDefaultHome: false,
      isIgnoringBattery: true,
      packageName: 'com.emergent.quickorderstation.eku1ku',
      adminReceiver: 'expo.modules.kioskmode.KioskDeviceAdminReceiver',
    };
  }
}

export async function isIgnoringBatteryOptimizations(): Promise<boolean> {
  const module = getNativeKioskModule();
  if (!module?.isIgnoringBatteryOptimizations) return false;
  try {
    return await module.isIgnoringBatteryOptimizations();
  } catch {
    return false;
  }
}

export async function requestIgnoreBatteryOptimizations(): Promise<boolean> {
  const module = getNativeKioskModule();
  if (!module?.requestIgnoreBatteryOptimizations) return false;
  try {
    return await module.requestIgnoreBatteryOptimizations();
  } catch {
    return false;
  }
}

export async function openHomeSettings(): Promise<boolean> {
  const module = getNativeKioskModule();
  if (!module?.openHomeSettings) return false;
  try {
    return await module.openHomeSettings();
  } catch {
    return false;
  }
}

export async function openScreenPinningSettings(): Promise<boolean> {
  const module = getNativeKioskModule();
  if (!module?.openScreenPinningSettings) return false;
  try {
    return await module.openScreenPinningSettings();
  } catch {
    return false;
  }
}

export async function openAppSettings(): Promise<boolean> {
  const module = getNativeKioskModule();
  if (!module?.openAppSettings) return false;
  try {
    return await module.openAppSettings();
  } catch {
    return false;
  }
}

export async function requestDeviceAdmin(): Promise<boolean> {
  const module = getNativeKioskModule();
  if (!module?.requestDeviceAdmin) return false;
  try {
    return await module.requestDeviceAdmin();
  } catch {
    return false;
  }
}

export async function bringToFront(): Promise<boolean> {
  const module = getNativeKioskModule();
  if (!module?.bringToFront) return false;
  try {
    return await module.bringToFront();
  } catch {
    return false;
  }
}

export async function setNativeScreenOrientation(orientation: 'portrait' | 'landscape' | 'auto'): Promise<boolean> {
  const module = getNativeKioskModule();
  if (!module?.setScreenOrientation) return false;
  try {
    return await module.setScreenOrientation(orientation);
  } catch {
    return false;
  }
}

export async function setNativeScreenBrightness(levelPercent: number): Promise<boolean> {
  const module = getNativeKioskModule();
  if (!module?.setScreenBrightness) return false;
  try {
    const normalized = Math.max(0.05, Math.min(1.0, levelPercent / 100));
    return await module.setScreenBrightness(normalized);
  } catch {
    return false;
  }
}

export async function setKeepScreenOn(enabled: boolean): Promise<boolean> {
  const module = getNativeKioskModule();
  if (!module?.setKeepScreenOn) return false;
  try {
    return await module.setKeepScreenOn(enabled);
  } catch {
    return false;
  }
}

export async function turnScreenOn(): Promise<boolean> {
  const module = getNativeKioskModule();
  if (!module?.turnScreenOn) return false;
  try {
    return await module.turnScreenOn();
  } catch {
    return false;
  }
}

export async function turnScreenOff(): Promise<boolean> {
  const module = getNativeKioskModule();
  if (!module?.turnScreenOff) return false;
  try {
    return await module.turnScreenOff();
  } catch {
    return false;
  }
}

export async function rebootDevice(): Promise<boolean> {
  const module = getNativeKioskModule();
  if (!module?.rebootDevice) return false;
  try {
    return await module.rebootDevice();
  } catch {
    return false;
  }
}

export async function playNativeHardwareBeep(): Promise<boolean> {
  const module = getNativeKioskModule();
  if (!module?.playHardwareBeep) return false;
  try {
    return await module.playHardwareBeep();
  } catch {
    return false;
  }
}

export async function playQueueCallBeep(): Promise<boolean> {
  const module = getNativeKioskModule();
  if (module?.playQueueCallBeep) {
    try {
      const ok = await module.playQueueCallBeep();
      if (ok) return true;
    } catch {
      // fallback below
    }
  }
  try {
    await playNativeHardwareBeep();
    await new Promise((resolve) => setTimeout(resolve, 220));
    await playNativeHardwareBeep();
    await new Promise((resolve) => setTimeout(resolve, 220));
    return await playNativeHardwareBeep();
  } catch {
    return false;
  }
}

export async function getWifiIpv4Address(): Promise<string> {
  const module = getNativeKioskModule();
  if (!module?.getWifiIpv4Address) return '';
  try {
    return (await module.getWifiIpv4Address()).trim();
  } catch {
    return '';
  }
}

export async function getBatteryStatus(): Promise<BatteryStatus> {
  const module = getNativeKioskModule();
  if (!module?.getBatteryStatus) return { level: 100, isCharging: true };
  try {
    return await module.getBatteryStatus();
  } catch {
    return { level: 100, isCharging: true };
  }
}

export async function getSystemInfo(): Promise<SystemInfo> {
  const module = getNativeKioskModule();
  if (!module?.getSystemInfo) {
    return {
      deviceModel: 'Android Totem Station',
      androidVersion: 'Android OS',
    };
  }
  try {
    return await module.getSystemInfo();
  } catch {
    return {
      deviceModel: 'Android Totem Station',
      androidVersion: 'Android OS',
    };
  }
}

export async function hideNativeSystemUI(): Promise<boolean> {
  const module = getNativeKioskModule();
  if (!module?.hideSystemUI) return false;
  try {
    return await module.hideSystemUI();
  } catch {
    return false;
  }
}

export async function showNativeSystemUI(): Promise<boolean> {
  const module = getNativeKioskModule();
  if (!module?.showSystemUI) return false;
  try {
    return await module.showSystemUI();
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
