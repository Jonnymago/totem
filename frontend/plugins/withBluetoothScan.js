/**
 * Configura i permessi Bluetooth per Android (legacy e Android 12+ API 31+).
 * Imposta BLUETOOTH_SCAN con usesPermissionFlags="neverForLocation"
 * e garantisce la presenza di BLUETOOTH_CONNECT e permessi correlati.
 */
const { withAndroidManifest } = require('@expo/config-plugins');

function withBluetoothScan(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    if (!Array.isArray(manifest['uses-permission'])) {
      manifest['uses-permission'] = manifest['uses-permission'] ? [manifest['uses-permission']] : [];
    }
    const perms = manifest['uses-permission'];

    const ensurePerm = (name, extraProps = {}) => {
      let existing = perms.find((p) => p.$ && p.$['android:name'] === name);
      if (existing) {
        Object.assign(existing.$, extraProps);
      } else {
        perms.push({
          $: {
            'android:name': name,
            ...extraProps,
          },
        });
      }
    };

    ensurePerm('android.permission.BLUETOOTH');
    ensurePerm('android.permission.BLUETOOTH_ADMIN');
    ensurePerm('android.permission.BLUETOOTH_CONNECT');
    ensurePerm('android.permission.BLUETOOTH_SCAN', { 'android:usesPermissionFlags': 'neverForLocation' });
    ensurePerm('android.permission.ACCESS_FINE_LOCATION');
    ensurePerm('android.permission.ACCESS_COARSE_LOCATION');

    return cfg;
  });
}

module.exports = withBluetoothScan;
