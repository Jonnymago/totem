import { Platform } from 'react-native';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';

export interface AppUpdateStatus {
  isAvailable: boolean;
  isChecking: boolean;
  isDownloading: boolean;
  manifest?: Updates.Manifest;
  updateId?: string;
  createdAt?: string;
  errorMessage?: string;
  isSupported: boolean;
}

export interface AppVersionInfo {
  version: string;
  versionCode: string | number;
  sdkVersion: string;
  updateId: string | null;
  channel: string | null;
  runtimeVersion: string | null;
  isEmbeddedLaunch: boolean;
  isEmergencyLaunch: boolean;
  isDev: boolean;
}

/**
 * Ottiene i dettagli completi sulla versione e sull'aggiornamento OTA attivo.
 */
export function getAppVersionInfo(): AppVersionInfo {
  const version = Constants.expoConfig?.version || '1.0.0';
  const versionCode = Constants.expoConfig?.android?.versionCode || 1;
  const sdkVersion = Constants.expoConfig?.sdkVersion || '54.0.0';
  const isDev = __DEV__;

  return {
    version,
    versionCode,
    sdkVersion,
    updateId: Updates.updateId || null,
    channel: Updates.channel || null,
    runtimeVersion: Updates.runtimeVersion || null,
    isEmbeddedLaunch: Updates.isEmbeddedLaunch ?? true,
    isEmergencyLaunch: Updates.isEmergencyLaunch ?? false,
    isDev,
  };
}

/**
 * Controlla se è disponibile un aggiornamento Over-The-Air (OTA).
 */
export async function checkForAppUpdates(): Promise<{ isAvailable: boolean; manifest?: Updates.Manifest; error?: string }> {
  // Gli aggiornamenti OTA funzionano solo in runtime nativo standalone/release
  if (__DEV__ || Platform.OS === 'web') {
    return {
      isAvailable: false,
      error: 'Gli aggiornamenti OTA sono attivi solo nelle build Android installate sul dispositivo (non in modalità sviluppo/web).',
    };
  }

  try {
    if (!Updates.isEnabled) {
      return {
        isAvailable: false,
        error: 'Il modulo expo-updates non è abilitato in questo ambiente di esecuzione.',
      };
    }

    const checkResult = await Updates.checkForUpdateAsync();

    if (checkResult.isAvailable) {
      return {
        isAvailable: true,
        manifest: checkResult.manifest,
      };
    }

    return {
      isAvailable: false,
    };
  } catch (error: any) {
    console.warn('Errore durante il controllo aggiornamenti OTA:', error);
    return {
      isAvailable: false,
      error: error?.message || 'Impossibile verificare gli aggiornamenti in questo momento.',
    };
  }
}

/**
 * Scarica e applica l'aggiornamento OTA, ricaricando l'app immediatamente.
 */
export async function downloadAndApplyAppUpdate(): Promise<{ success: boolean; error?: string }> {
  if (__DEV__ || Platform.OS === 'web' || !Updates.isEnabled) {
    return {
      success: false,
      error: 'Operazione disponibile solo su build native Android installate.',
    };
  }

  try {
    const fetchResult = await Updates.fetchUpdateAsync();

    if (fetchResult.isNew) {
      // Riavvia l'applicazione con il nuovo bundle JavaScript aggiornato
      await Updates.reloadAsync();
      return { success: true };
    }

    return {
      success: false,
      error: 'Nessun nuovo bundle trovato durante il download.',
    };
  } catch (error: any) {
    console.error('Errore durante il download dell\'aggiornamento OTA:', error);
    return {
      success: false,
      error: error?.message || 'Errore durante il download dell\'aggiornamento.',
    };
  }
}
