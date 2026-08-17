import { requireNativeModule } from 'expo-modules-core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, BackHandler, AppState } from 'react-native';

interface KioskModeModule {
  startLockTask(): Promise<boolean>;
  stopLockTask(): Promise<boolean>;
  isLockTaskActive(): Promise<boolean>;
  hideSystemUI?(): Promise<boolean>;
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

/** Re-applica lock + immersive in modo aggressivo (necessario su FydeOS). */
async function forceLockNow(): Promise<void> {
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

function startWatchdog() {
  if (Platform.OS !== 'android') return;
  if (watchdogTimer) return;

  // Timer continuo: ogni 1.5s ri-forza immersive + lock task
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

function stopWatchdog() {
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
    return await nativeModule.stopLockTask();
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
