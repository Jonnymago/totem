/**
 * Imposta BLUETOOTH_SCAN con usesPermissionFlags="neverForLocation"
 * cosi la scansione dei dispositivi paired non dipende dal GPS.
 */
const { withAndroidManifest } = require('@expo/config-plugins');

function withBluetoothScan(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    if (!manifest['uses-permission']) manifest['uses-permission'] = [];
    const perms = manifest['uses-permission'];
    let found = false;
    for (const p of perms) {
      if (p.$ && p.$['android:name'] === 'android.permission.BLUETOOTH_SCAN') {
        p.$['android:usesPermissionFlags'] = 'neverForLocation';
        found = true;
      }
    }
    if (!found) {
      perms.push({
        $: {
          'android:name': 'android.permission.BLUETOOTH_SCAN',
          'android:usesPermissionFlags': 'neverForLocation',
        },
      });
    }
    return cfg;
  });
}

module.exports = withBluetoothScan;
