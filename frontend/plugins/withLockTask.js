/**
 * Expo Config Plugin per Lock Task Mode (Kiosk) e Home Launcher su Android.
 *
 * Configura:
 * 1. lockTaskMode="normal" per consentire sia lo Screen Pinning standard che il LockTask via Device Owner.
 * 2. Intent filter CATEGORY_HOME per consentire l'impostazione dell'app come Launcher predefinito.
 * 3. KioskDeviceAdminReceiver per Device Owner / Device Admin.
 * 4. BootCompletedReceiver per l'avvio automatico al boot.
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

  // Permessi di sistema
  if (!manifest['uses-permission']) {
    manifest['uses-permission'] = [];
  }
  const perms = manifest['uses-permission'];
  const ensurePerm = (name) => {
    if (!perms.some((p) => p.$ && p.$['android:name'] === name)) {
      perms.push({ $: { 'android:name': name } });
    }
  };

  ensurePerm('android.permission.RECEIVE_BOOT_COMPLETED');
  ensurePerm('android.permission.REORDER_TASKS');
  ensurePerm('android.permission.SYSTEM_ALERT_WINDOW');

  const app = manifest.application[0];

  if (app.activity) {
    for (const act of app.activity) {
      if (
        act.$ &&
        (act.$['android:name'] === '.MainActivity' ||
          String(act.$['android:name']).endsWith('MainActivity'))
      ) {
        // Usa lockTaskMode="normal" per massima compatibilità
        act.$['android:lockTaskMode'] = 'normal';
        act.$['android:showWhenLocked'] = 'true';
        act.$['android:turnScreenOn'] = 'true';
        act.$['android:launchMode'] = 'singleTask';

        // Aggiunge intent filter HOME per registrare l'app come Launcher opzionale
        if (!Array.isArray(act['intent-filter'])) {
          act['intent-filter'] = act['intent-filter'] ? [act['intent-filter']] : [];
        }
        const hasHomeFilter = act['intent-filter'].some((filter) => {
          if (!filter) return false;
          const categories = Array.isArray(filter.category) ? filter.category : filter.category ? [filter.category] : [];
          return categories.some((c) => c?.$?.['android:name'] === 'android.intent.category.HOME');
        });
        if (!hasHomeFilter) {
          act['intent-filter'].push({
            action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
            category: [
              { $: { 'android:name': 'android.intent.category.HOME' } },
              { $: { 'android:name': 'android.intent.category.DEFAULT' } },
            ],
          });
        }
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

  // 1. Device Admin Receiver per LockTask & Device Owner
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
          {
            $: {
              'android:name': 'android.app.action.PROFILE_PROVISIONING_COMPLETE',
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
          { $: { 'android:name': 'com.htc.intent.action.QUICKBOOT_POWERON' } },
        ],
      },
    ],
  });

  return androidManifest;
}

function ensureDeviceAdminXml(platformProjectRoot) {
  const possiblePaths = [
    path.join(platformProjectRoot, 'app', 'src', 'main', 'res', 'xml'),
    path.join(platformProjectRoot, 'src', 'main', 'res', 'xml'),
    path.join(platformProjectRoot, 'android', 'app', 'src', 'main', 'res', 'xml'),
  ];
  const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<device-admin xmlns:android="http://schemas.android.com/apk/res/android">
  <uses-policies>
    <lock-task />
  </uses-policies>
</device-admin>
`;
  for (const xmlDir of possiblePaths) {
    try {
      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }
      fs.writeFileSync(path.join(xmlDir, 'device_admin_policies.xml'), xmlContent, 'utf8');
    } catch (e) {
      // ignore
    }
  }
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
