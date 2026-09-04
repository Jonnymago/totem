import { PermissionsAndroid, Platform, Permission } from 'react-native';

export interface AppPermissionStatus {
  bluetooth: boolean;
  location: boolean;
  media: boolean;
  allGranted: boolean;
}

/**
 * Controlla lo stato di tutti i permessi runtime dell'app su Android.
 */
export async function checkAllAppPermissions(): Promise<AppPermissionStatus> {
  if (Platform.OS !== 'android') {
    return { bluetooth: true, location: true, media: true, allGranted: true };
  }

  const apiVersion =
    typeof Platform.Version === 'number'
      ? Platform.Version
      : parseInt(String(Platform.Version), 10) || 30;

  try {
    // 1. Bluetooth
    let bluetooth = true;
    if (apiVersion >= 31) {
      const hasConnect = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
      const hasScan = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
      bluetooth = hasConnect && hasScan;
    }

    // 2. Location (per discovery BLE / Legacy)
    let location = true;
    if (apiVersion < 31) {
      location = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    }

    // 3. Media / Storage
    let media = true;
    if (apiVersion >= 33) {
      media = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
    } else {
      media = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
    }

    const allGranted = bluetooth && (apiVersion >= 31 || location) && media;

    return {
      bluetooth,
      location,
      media,
      allGranted,
    };
  } catch (e) {
    console.warn('[permissions] Errore verifica permessi:', e);
    return { bluetooth: false, location: false, media: false, allGranted: false };
  }
}

/**
 * Richiede tutti i permessi essenziali in batch su Android.
 */
export async function requestAllAppPermissions(): Promise<AppPermissionStatus> {
  if (Platform.OS !== 'android') {
    return { bluetooth: true, location: true, media: true, allGranted: true };
  }

  const apiVersion =
    typeof Platform.Version === 'number'
      ? Platform.Version
      : parseInt(String(Platform.Version), 10) || 30;

  const toRequest: Permission[] = [];

  try {
    // 1. Bluetooth (Android 12+)
    if (apiVersion >= 31) {
      const hasConnect = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
      const hasScan = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
      if (!hasConnect) toRequest.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
      if (!hasScan) toRequest.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
    } else {
      const hasLoc = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      if (!hasLoc) toRequest.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    }

    // 2. Media / Galleria
    if (apiVersion >= 33) {
      const hasMedia = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
      if (!hasMedia) toRequest.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
    } else {
      const hasStorage = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
      if (!hasStorage) toRequest.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
    }

    // 3. Notifiche (Android 13+)
    if (apiVersion >= 33) {
      const hasNotif = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      if (!hasNotif) toRequest.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }

    if (toRequest.length > 0) {
      console.log('[permissions] Richiesta batch permessi:', toRequest);
      await PermissionsAndroid.requestMultiple(toRequest);
    }

    return await checkAllAppPermissions();
  } catch (e) {
    console.warn('[permissions] Errore richiesta permessi:', e);
    return await checkAllAppPermissions();
  }
}
