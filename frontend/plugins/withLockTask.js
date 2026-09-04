/**
 * Expo Config Plugin per Lock Task Mode e Home Launcher su Android.
 *
 * Il modulo nativo kiosk-mode dichiara receiver Device Admin e Boot Receiver.
 * Questo plugin configura soltanto l'attività principale e i permessi di sistema,
 * evitando dichiarazioni duplicate nel manifest finale.
 */

const { withAndroidManifest } = require('@expo/config-plugins');

const MODULE_RECEIVERS = new Set([
  '.KioskDeviceAdminReceiver',
  'expo.modules.kioskmode.KioskDeviceAdminReceiver',
  'expo.modules.kioskmode.BootCompletedReceiver',
]);

function addLockTaskToManifest(androidManifest) {
  const { manifest } = androidManifest;
  if (!manifest?.application?.[0]) return androidManifest;

  if (!manifest['uses-permission']) manifest['uses-permission'] = [];
  const ensurePermission = (name) => {
    if (!manifest['uses-permission'].some((permission) => permission.$?.['android:name'] === name)) {
      manifest['uses-permission'].push({ $: { 'android:name': name } });
    }
  };

  ensurePermission('android.permission.RECEIVE_BOOT_COMPLETED');
  ensurePermission('android.permission.REORDER_TASKS');
  ensurePermission('android.permission.SYSTEM_ALERT_WINDOW');
  ensurePermission('android.permission.WAKE_LOCK');
  ensurePermission('android.permission.TURN_SCREEN_ON');

  const app = manifest.application[0];
  // Il backup operatore è gestito dall’app e non include segreti. Disabilitiamo
  // Auto Backup Android per non copiare automaticamente dati locali in cloud/device.
  app.$['android:allowBackup'] = 'false';
  for (const activity of app.activity || []) {
    const activityName = String(activity.$?.['android:name'] || '');
    if (activityName !== '.MainActivity' && !activityName.endsWith('MainActivity')) continue;

    activity.$['android:lockTaskMode'] = 'normal';
    activity.$['android:showWhenLocked'] = 'true';
    activity.$['android:turnScreenOn'] = 'true';
    activity.$['android:launchMode'] = 'singleTask';

    if (!Array.isArray(activity['intent-filter'])) {
      activity['intent-filter'] = activity['intent-filter'] ? [activity['intent-filter']] : [];
    }
    const hasHomeFilter = activity['intent-filter'].some((filter) => {
      const categories = Array.isArray(filter?.category)
        ? filter.category
        : filter?.category
          ? [filter.category]
          : [];
      return categories.some((category) => category?.$?.['android:name'] === 'android.intent.category.HOME');
    });
    if (!hasHomeFilter) {
      activity['intent-filter'].push({
        action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
        category: [
          { $: { 'android:name': 'android.intent.category.HOME' } },
          { $: { 'android:name': 'android.intent.category.DEFAULT' } },
        ],
      });
    }
  }

  // Rimuove eventuali receiver generati dalle versioni precedenti del plugin.
  // Il manifest di kiosk-mode ne fornisce ora una sola definizione canonica.
  if (Array.isArray(app.receiver)) {
    app.receiver = app.receiver.filter((receiver) => !MODULE_RECEIVERS.has(receiver.$?.['android:name']));
  }

  return androidManifest;
}

function withLockTask(config) {
  return withAndroidManifest(config, (modConfig) => {
    modConfig.modResults = addLockTaskToManifest(modConfig.modResults);
    return modConfig;
  });
}

module.exports = withLockTask;
