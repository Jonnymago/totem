/**
 * Expo Config Plugin per Lock Task Mode (Kiosk) su Android / FydeOS.
 *
 * Usa lockTaskMode="always" sull'activity: forza screen pinning anche
 * senza Device Owner (necessario su FydeOS dove Device Admin non funziona).
 */

const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const RECEIVER_CLASS = 'expo.modules.kioskmode.KioskDeviceAdminReceiver';
const BOOT_RECEIVER_CLASS = 'expo.modules.kioskmode.BootCompletedReceiver';

function addLockTaskToManifest(androidManifest) {
  const { manifest } = androidManifest;
  if (!manifest?.application?.[0]) {
    return androidManifest;
  }

  // Aggiungi permesso avvio al boot
  if (!manifest['uses-permission']) {
    manifest['uses-permission'] = [];
  }
  const hasBootPerm = manifest['uses-permission'].some(
    (p) => p.$ && p.$['android:name'] === 'android.permission.RECEIVE_BOOT_COMPLETED'
  );
  if (!hasBootPerm) {
    manifest['uses-permission'].push({
      $: { 'android:name': 'android.permission.RECEIVE_BOOT_COMPLETED' },
    });
  }

  const app = manifest.application[0];

  if (app.activity) {
    for (const act of app.activity) {
      if (
        act.$ &&
        (act.$['android:name'] === '.MainActivity' ||
          String(act.$['android:name']).endsWith('MainActivity'))
      ) {
        act.$['android:lockTaskMode'] = 'always';
      }
    }
  }

  if (!app['receiver']) {
    app['receiver'] = [];
  }

  app['receiver'] = app['receiver'].filter((r) => {
    const name = r.$ && r.$['android:name'];
    return name !== '.KioskDeviceAdminReceiver' && name !== RECEIVER_CLASS && name !== BOOT_RECEIVER_CLASS;
  });

  // 1. Device Admin Receiver per LockTask
  app['receiver'].push({
    $: {
      'android:name': RECEIVER_CLASS,
      'android:permission': 'android.permission.BIND_DEVICE_ADMIN',
      'android:exported': 'true',
    },
    'meta-data': [
      {
        $: {
          'android:name': 'android.app.device_admin',
          'android:resource': '@xml/device_admin_policies',
        },
      },
    ],
    'intent-filter': [
      {
        action: [
          {
            $: {
              'android:name': 'android.app.action.DEVICE_ADMIN_ENABLED',
            },
          },
        ],
      },
    ],
  });

  // 2. Boot Completed Receiver per Auto-Boot
  app['receiver'].push({
    $: {
      'android:name': BOOT_RECEIVER_CLASS,
      'android:enabled': 'true',
      'android:exported': 'true',
    },
    'intent-filter': [
      {
        action: [
          { $: { 'android:name': 'android.intent.action.BOOT_COMPLETED' } },
          { $: { 'android:name': 'android.intent.action.QUICKBOOT_POWERON' } },
        ],
      },
    ],
  });

  return androidManifest;
}

function ensureDeviceAdminXml(projectRoot) {
  const xmlDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'xml');
  const xmlPath = path.join(xmlDir, 'device_admin_policies.xml');
  if (!fs.existsSync(xmlDir)) {
    fs.mkdirSync(xmlDir, { recursive: true });
  }
  fs.writeFileSync(
    xmlPath,
    `<?xml version="1.0" encoding="utf-8"?>
<device-admin xmlns:android="http://schemas.android.com/apk/res/android">
  <uses-policies>
    <lock-task />
  </uses-policies>
</device-admin>
`
  );
}

function withLockTask(config) {
  config = withAndroidManifest(config, (config) => {
    config.modResults = addLockTaskToManifest(config.modResults);
    return config;
  });

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      ensureDeviceAdminXml(config.modRequest.platformProjectRoot);
      return config;
    },
  ]);

  return config;
}

module.exports = withLockTask;
