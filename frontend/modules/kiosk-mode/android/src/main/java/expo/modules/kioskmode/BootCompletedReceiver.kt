package expo.modules.kioskmode

import android.app.KeyguardManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.PowerManager

class BootCompletedReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val action = intent.action ?: return
    val supportedActions = setOf(
      Intent.ACTION_BOOT_COMPLETED,
      Intent.ACTION_LOCKED_BOOT_COMPLETED,
      Intent.ACTION_MY_PACKAGE_REPLACED,
      "android.intent.action.QUICKBOOT_POWERON",
      "com.htc.intent.action.QUICKBOOT_POWERON"
    )
    if (action !in supportedActions) return

    val preferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val autoStart = preferences.getBoolean(KEY_AUTO_START_ON_BOOT, false) ||
      preferences.getBoolean("kiosk_mode_enabled", false)

    if (!autoStart) return

    // Accendi momentaneamente lo schermo se spento per permettere il boot
    runCatching {
      val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
      @Suppress("DEPRECATION")
      val wakeLock = powerManager.newWakeLock(
        PowerManager.FULL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE,
        "Totem:BootWake"
      )
      wakeLock.acquire(3_000L)
    }

    val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return
    launchIntent.addFlags(
      Intent.FLAG_ACTIVITY_NEW_TASK or
        Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
        Intent.FLAG_ACTIVITY_SINGLE_TOP or
        Intent.FLAG_ACTIVITY_CLEAR_TOP
    )
    runCatching { context.startActivity(launchIntent) }
  }

  companion object {
    const val PREFS_NAME = "TotemKioskMode"
    const val KEY_AUTO_START_ON_BOOT = "autoStartOnBoot"
  }
}
