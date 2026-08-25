import { Platform, Alert } from 'react-native';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';

export interface GitHubReleaseInfo {
  tag: string;
  name: string;
  publishedAt: string;
  apkUrl: string;
  apkSize: number; // in bytes
  apkSizeMb: string;
  body: string;
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

const GITHUB_REPO = 'Jonnymago/totem';
const GITHUB_RELEASES_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
export const DIRECT_APK_DOWNLOAD_URL = `https://github.com/${GITHUB_REPO}/releases/download/latest/Totem-QuickBite-Universal.apk`;

/**
 * Ottiene i dettagli completi sulla versione e sull'aggiornamento attivo.
 */
export function getAppVersionInfo(): AppVersionInfo {
  const version = Constants.expoConfig?.version || '1.2.16';
  const versionCode = Constants.expoConfig?.android?.versionCode || 137;
  const sdkVersion = Constants.expoConfig?.sdkVersion || '54.0.0';
  const isDev = __DEV__;

  let updateId: string | null = null;
  try {
    updateId = Updates.updateId || null;
  } catch {}

  return {
    version,
    versionCode,
    sdkVersion,
    updateId,
    channel: Updates.channel || null,
    runtimeVersion: Updates.runtimeVersion || null,
    isEmbeddedLaunch: Updates.isEmbeddedLaunch ?? true,
    isEmergencyLaunch: Updates.isEmergencyLaunch ?? false,
    isDev,
  };
}

/**
 * Controlla l'ultima versione APK disponibile su GitHub Releases.
 */
export async function checkForGitHubRelease(): Promise<{
  success: boolean;
  release?: GitHubReleaseInfo;
  error?: string;
}> {
  try {
    const response = await fetch(GITHUB_RELEASES_API, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'TotemQuickBite-App',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: 'Nessuna release trovata sul repository GitHub.' };
      }
      return { success: false, error: `Errore GitHub API: status ${response.status}` };
    }

    const data = await response.json();
    const assets: any[] = data.assets || [];
    const apkAsset = assets.find((a: any) => a.name && a.name.endsWith('.apk'));

    if (!apkAsset) {
      return {
        success: false,
        error: 'Nessun file APK trovato tra gli allegati dell\'ultima release.',
      };
    }

    const sizeInMb = (apkAsset.size / (1024 * 1024)).toFixed(1);

    const release: GitHubReleaseInfo = {
      tag: data.tag_name || 'latest',
      name: data.name || 'Totem Standalone APK',
      publishedAt: data.published_at || new Date().toISOString(),
      apkUrl: apkAsset.browser_download_url || DIRECT_APK_DOWNLOAD_URL,
      apkSize: apkAsset.size,
      apkSizeMb: sizeInMb,
      body: data.body || '',
    };

    return { success: true, release };
  } catch (err: any) {
    console.error('Errore controllo GitHub Release:', err);
    return {
      success: false,
      error: err?.message || 'Impossibile contattare GitHub per verificare gli aggiornamenti.',
    };
  }
}

/**
 * Scarica l'APK direttamente all'interno dell'applicazione con monitoraggio del progresso.
 */
export async function downloadApkFile(
  apkUrl: string,
  onProgress?: (progressPercent: number, downloadedMb: string, totalMb: string) => void
): Promise<{ success: boolean; localUri?: string; error?: string }> {
  try {
    const targetFileUri = FileSystem.documentDirectory + 'Totem-QuickBite-Universal.apk';

    // Rimuovi eventuale file scaricato in precedenza
    const fileInfo = await FileSystem.getInfoAsync(targetFileUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(targetFileUri, { idempotent: true });
    }

    const downloadResumable = FileSystem.createDownloadResumable(
      apkUrl,
      targetFileUri,
      {},
      (downloadProgress) => {
        if (downloadProgress.totalBytesExpectedToWrite > 0) {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          const percent = Math.min(100, Math.round(progress * 100));
          const dlMb = (downloadProgress.totalBytesWritten / (1024 * 1024)).toFixed(1);
          const totMb = (downloadProgress.totalBytesExpectedToWrite / (1024 * 1024)).toFixed(1);
          if (onProgress) {
            onProgress(percent, dlMb, totMb);
          }
        }
      }
    );

    const result = await downloadResumable.downloadAsync();
    if (!result || !result.uri) {
      return { success: false, error: 'Download non riuscito.' };
    }

    return { success: true, localUri: result.uri };
  } catch (err: any) {
    console.error('Errore download APK:', err);
    return {
      success: false,
      error: err?.message || 'Errore durante il download del pacchetto APK.',
    };
  }
}

/**
 * Avvia l'installazione nativa dell'APK scaricato.
 */
export async function launchApkInstallation(localUri: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (Platform.OS === 'android') {
      const contentUri = await FileSystem.getContentUriAsync(localUri);
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(localUri, {
          mimeType: 'application/vnd.android.package-archive',
          dialogTitle: 'Installa Aggiornamento Totem',
          UTI: 'com.android.package-archive',
        });
        return { success: true };
      }

      // Fallback apertura tramite Linking
      await Linking.openURL(contentUri);
      return { success: true };
    } else {
      await Linking.openURL(DIRECT_APK_DOWNLOAD_URL);
      return { success: true };
    }
  } catch (err: any) {
    console.error('Errore avvio installazione APK:', err);
    return {
      success: false,
      error: err?.message || 'Impossibile avviare il gestore pacchetti Android.',
    };
  }
}

/**
 * Apre il link di download diretto nel browser del tablet.
 */
export async function openDirectDownloadInBrowser(): Promise<void> {
  try {
    await Linking.openURL(DIRECT_APK_DOWNLOAD_URL);
  } catch (err) {
    Alert.alert('Errore', 'Impossibile aprire il browser: ' + String(err));
  }
}

/**
 * Controlla se è disponibile un aggiornamento Over-The-Air (OTA) classico Expo.
 */
export async function checkForAppUpdates(): Promise<{ isAvailable: boolean; manifest?: Updates.Manifest; error?: string }> {
  if (__DEV__ || Platform.OS === 'web') {
    return {
      isAvailable: false,
      error: 'Gli aggiornamenti OTA sono attivi solo nelle build Android installate sul dispositivo.',
    };
  }

  try {
    if (!Updates.isEnabled) {
      return {
        isAvailable: false,
        error: 'Il modulo OTA nativo non è attivo su questo APK. Usa l\'aggiornamento diretto APK sottostante.',
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
    return {
      isAvailable: false,
      error: error?.message || 'Nessun aggiornamento bundle disponibile.',
    };
  }
}

/**
 * Scarica e applica l'aggiornamento OTA Expo.
 */
export async function downloadAndApplyAppUpdate(): Promise<{ success: boolean; error?: string }> {
  if (__DEV__ || Platform.OS === 'web' || !Updates.isEnabled) {
    return {
      success: false,
      error: 'Operazione disponibile solo su build native con supporto OTA abilitato.',
    };
  }

  try {
    const fetchResult = await Updates.fetchUpdateAsync();
    if (fetchResult.isNew) {
      await Updates.reloadAsync();
      return { success: true };
    }
    return {
      success: false,
      error: 'Nessun nuovo bundle trovato durante il download.',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Errore durante il download dell\'aggiornamento.',
    };
  }
}
