package expo.modules.kioskmode

import android.app.Activity
import android.app.ActivityManager
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ActivityInfo
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioTrack
import android.media.ToneGenerator
import android.net.Uri
import android.net.wifi.WifiManager
import android.os.BatteryManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.os.StatFs
import android.os.VibrationEffect
import android.os.Vibrator
import android.provider.Settings
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.Inet4Address
import java.net.NetworkInterface
import kotlin.math.PI
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin

class KioskModeModule : Module() {
  private var wakeLock: PowerManager.WakeLock? = null

  override fun definition() = ModuleDefinition {
    Name("KioskMode")

    AsyncFunction("startLockTask") Coroutine { ->
      withContext(Dispatchers.Main) {
        val activity = appContext.currentActivity ?: return@withContext false
        val context = appContext.reactContext ?: return@withContext false
        runCatching {
          val policyManager = devicePolicyManager()
          val admin = ComponentName(context, KioskDeviceAdminReceiver::class.java)
          val managedKiosk = policyManager.isDeviceOwnerApp(context.packageName) ||
            policyManager.isProfileOwnerApp(context.packageName)

          // Solo un Device Owner/Profile Owner già configurato può disabilitare
          // funzioni LockTask e notification shade. Senza provisioning Android
          // consente esclusivamente screen pinning, non un blocco totale.
          if (managedKiosk && policyManager.isAdminActive(admin)) {
            policyManager.setLockTaskPackages(admin, arrayOf(context.packageName))
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
              policyManager.setLockTaskFeatures(admin, DevicePolicyManager.LOCK_TASK_FEATURE_NONE)
            }
          }
          activity.startLockTask()
          true
        }.getOrDefault(false)
      }
    }

    AsyncFunction("stopLockTask") Coroutine { ->
      withContext(Dispatchers.Main) {
        val activity = appContext.currentActivity ?: return@withContext false
        runCatching {
          activity.stopLockTask()
          true
        }.getOrDefault(false)
      }
    }

    AsyncFunction("isLockTaskActive") {
      val context = appContext.reactContext ?: return@AsyncFunction false
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return@AsyncFunction false
      val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
      activityManager.lockTaskModeState != ActivityManager.LOCK_TASK_MODE_NONE
    }

    AsyncFunction("getKioskDiagnostics") {
      val context = appContext.reactContext ?: return@AsyncFunction mapOf(
        "isLockTaskActive" to false,
        "lockTaskModeState" to ActivityManager.LOCK_TASK_MODE_NONE,
        "isDeviceOwner" to false,
        "isProfileOwner" to false,
        "isDeviceAdmin" to false,
        "isDefaultHome" to false,
        "isIgnoringBattery" to false,
        "packageName" to "",
        "adminReceiver" to "expo.modules.kioskmode.KioskDeviceAdminReceiver"
      )
      val manager = devicePolicyManager()
      val admin = ComponentName(context, KioskDeviceAdminReceiver::class.java)
      val state = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        (context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager).lockTaskModeState
      } else {
        ActivityManager.LOCK_TASK_MODE_NONE
      }
      val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
      mapOf(
        "isLockTaskActive" to (state != ActivityManager.LOCK_TASK_MODE_NONE),
        "lockTaskModeState" to state,
        "isDeviceOwner" to manager.isDeviceOwnerApp(context.packageName),
        "isProfileOwner" to manager.isProfileOwnerApp(context.packageName),
        "isDeviceAdmin" to manager.isAdminActive(admin),
        "isDefaultHome" to isDefaultHome(context),
        "isIgnoringBattery" to if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) powerManager.isIgnoringBatteryOptimizations(context.packageName) else true,
        "packageName" to context.packageName,
        "adminReceiver" to admin.className
      )
    }

    AsyncFunction("hideSystemUI") Coroutine { ->
      withContext(Dispatchers.Main) {
        val activity = appContext.currentActivity ?: return@withContext false
        runCatching {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            activity.window.insetsController?.apply {
              hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
              // Equivalente moderno di IMMERSIVE_STICKY: le barre richiamate
              // dal bordo restano transitorie; un Device Owner LockTask gestisce
              // il blocco delle notifiche se già stato provisioning.
              systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
          } else {
            @Suppress("DEPRECATION")
            activity.window.decorView.systemUiVisibility = (
              View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
                View.SYSTEM_UI_FLAG_FULLSCREEN or
                View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
              )
          }
          true
        }.getOrDefault(false)
      }
    }

    AsyncFunction("showSystemUI") Coroutine { ->
      withContext(Dispatchers.Main) {
        val activity = appContext.currentActivity ?: return@withContext false
        runCatching {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            activity.window.insetsController?.show(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
          } else {
            @Suppress("DEPRECATION")
            activity.window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_VISIBLE
          }
          true
        }.getOrDefault(false)
      }
    }

    AsyncFunction("setKeepScreenOn") Coroutine { enabled: Boolean ->
      val context = appContext.reactContext ?: return@Coroutine false
      withContext(Dispatchers.Main) {
        val activity = appContext.currentActivity
        runCatching {
          val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
          if (enabled) {
            activity?.window?.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            if (wakeLock == null || wakeLock?.isHeld != true) {
              @Suppress("DEPRECATION")
              val lock = powerManager.newWakeLock(
                PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE,
                "Totem:KeepScreenAwake"
              )
              lock.setReferenceCounted(false)
              lock.acquire()
              wakeLock = lock
            }
          } else {
            activity?.window?.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            wakeLock?.takeIf { it.isHeld }?.release()
            wakeLock = null
          }
          true
        }.getOrDefault(false)
      }
    }

    AsyncFunction("setAutoStartOnBoot") { enabled: Boolean ->
      val context = appContext.reactContext ?: return@AsyncFunction false
      context.getSharedPreferences(BootCompletedReceiver.PREFS_NAME, Context.MODE_PRIVATE)
        .edit()
        .putBoolean(BootCompletedReceiver.KEY_AUTO_START_ON_BOOT, enabled)
        .apply()
      true
    }

    AsyncFunction("turnScreenOn") Coroutine { ->
      val context = appContext.reactContext ?: return@Coroutine false
      withContext(Dispatchers.Main) {
        val activity = appContext.currentActivity
        runCatching {
          val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
          wakeLock?.takeIf { it.isHeld }?.release()
          @Suppress("DEPRECATION")
          val lock = powerManager.newWakeLock(
            PowerManager.FULL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE,
            "Totem:ScreenWake"
          )
          wakeLock = lock
          lock.acquire(5_000L)
          activity?.window?.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1 && activity != null) {
            activity.setShowWhenLocked(true)
            activity.setTurnScreenOn(true)
          }
          Handler(Looper.getMainLooper()).postDelayed({
            runCatching { lock.takeIf { it.isHeld }?.release() }
            if (wakeLock === lock) wakeLock = null
          }, 5_000L)
          true
        }.getOrDefault(false)
      }
    }

    AsyncFunction("turnScreenOff") {
      val context = appContext.reactContext ?: return@AsyncFunction false
      val manager = devicePolicyManager()
      val admin = ComponentName(context, KioskDeviceAdminReceiver::class.java)
      runCatching {
        if (manager.isDeviceOwnerApp(context.packageName) || manager.isAdminActive(admin)) {
          manager.lockNow()
          true
        } else {
          false
        }
      }.getOrDefault(false)
    }

    AsyncFunction("setScreenOrientation") Coroutine { orientation: String ->
      val activity = appContext.currentActivity ?: return@Coroutine false
      runOnUiThread(activity) {
        activity.requestedOrientation = when (orientation) {
          "portrait" -> ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
          "landscape" -> ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
          else -> ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
        }
      }
    }

    AsyncFunction("setScreenBrightness") Coroutine { brightness: Double ->
      val activity = appContext.currentActivity ?: return@Coroutine false
      runOnUiThread(activity) {
        val attributes = activity.window.attributes
        attributes.screenBrightness = brightness.coerceIn(0.01, 1.0).toFloat()
        activity.window.attributes = attributes
      }
    }

    AsyncFunction("playHardwareBeep") Coroutine { ->
      val context = appContext.reactContext ?: return@Coroutine false
      withContext(Dispatchers.Default) {
        // Primo percorso: PCM sul volume multimediale, normalmente disponibile
        // anche se notifiche e suoneria sono silenziate sul tablet.
        val pcmPlayed = runCatching {
          val sampleRate = 44_100
          val durationMs = 260
          val sampleCount = sampleRate * durationMs / 1_000
          val fadeSamples = sampleRate / 100
          val samples = ShortArray(sampleCount) { index ->
            val envelope = min(1.0, min(index.toDouble() / fadeSamples, (sampleCount - index).toDouble() / fadeSamples))
            (sin(2.0 * PI * 1_046.5 * index / sampleRate) * Short.MAX_VALUE * 0.52 * max(0.0, envelope)).toInt().toShort()
          }
          val format = AudioFormat.Builder()
            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
            .setSampleRate(sampleRate)
            .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
            .build()
          val minimumBuffer = AudioTrack.getMinBufferSize(sampleRate, AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_16BIT)
          val track = AudioTrack.Builder()
            .setAudioAttributes(
              AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()
            )
            .setAudioFormat(format)
            .setBufferSizeInBytes(max(minimumBuffer, samples.size * 2))
            .setTransferMode(AudioTrack.MODE_STATIC)
            .build()
          if (track.state != AudioTrack.STATE_INITIALIZED) {
            track.release()
            false
          } else {
            val written = track.write(samples, 0, samples.size, AudioTrack.WRITE_BLOCKING)
            if (written <= 0) {
              track.release()
              false
            } else {
              track.play()
              Handler(Looper.getMainLooper()).postDelayed({ track.release() }, durationMs.toLong() + 180L)
              true
            }
          }
        }.getOrDefault(false)

        // Secondo percorso: alcuni firmware tablet rifiutano AudioTrack statico.
        // ToneGenerator sullo stesso STREAM_MUSIC garantisce un segnale alternativo.
        val audible = if (pcmPlayed) {
          true
        } else {
          runCatching {
            val generator = ToneGenerator(AudioManager.STREAM_MUSIC, 100)
            val started = generator.startTone(ToneGenerator.TONE_PROP_BEEP2, 350)
            Handler(Looper.getMainLooper()).postDelayed({ generator.release() }, 430L)
            started
          }.getOrDefault(false)
        }

        val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        if (vibrator?.hasVibrator() == true) {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(70L, VibrationEffect.DEFAULT_AMPLITUDE))
          } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(70L)
          }
        }
        audible
      }
    }

    AsyncFunction("playQueueCallBeep") Coroutine { ->
      val context = appContext.reactContext ?: return@Coroutine false
      withContext(Dispatchers.Default) {
        val pcmPlayed = runCatching {
          val sampleRate = 44_100
          val notes = doubleArrayOf(880.0, 1174.7, 1318.5)
          val noteMs = 220
          val gapMs = 70
          val totalMs = notes.size * noteMs + (notes.size - 1) * gapMs
          val sampleCount = sampleRate * totalMs / 1_000
          val fadeSamples = sampleRate / 80
          val samples = ShortArray(sampleCount) { index ->
            val tMs = index * 1000.0 / sampleRate
            var acc = 0.0
            var cursor = 0
            for (freq in notes) {
              val start = cursor
              val end = cursor + noteMs
              if (tMs >= start && tMs < end) {
                val localIndex = ((tMs - start) / 1000.0 * sampleRate).toInt()
                val localCount = sampleRate * noteMs / 1_000
                val envelope = min(1.0, min(localIndex.toDouble() / fadeSamples, (localCount - localIndex).toDouble() / fadeSamples))
                acc = sin(2.0 * PI * freq * localIndex / sampleRate) * 0.97 * max(0.0, envelope)
                break
              }
              cursor = end + gapMs
            }
            (acc * Short.MAX_VALUE).toInt().coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()
          }
          val format = AudioFormat.Builder()
            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
            .setSampleRate(sampleRate)
            .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
            .build()
          val minimumBuffer = AudioTrack.getMinBufferSize(sampleRate, AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_16BIT)
          val track = AudioTrack.Builder()
            .setAudioAttributes(
              AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()
            )
            .setAudioFormat(format)
            .setBufferSizeInBytes(max(minimumBuffer, samples.size * 2))
            .setTransferMode(AudioTrack.MODE_STATIC)
            .build()
          if (track.state != AudioTrack.STATE_INITIALIZED) {
            track.release()
            false
          } else {
            val written = track.write(samples, 0, samples.size, AudioTrack.WRITE_BLOCKING)
            if (written <= 0) {
              track.release()
              false
            } else {
              track.play()
              Handler(Looper.getMainLooper()).postDelayed({ track.release() }, totalMs.toLong() + 200L)
              true
            }
          }
        }.getOrDefault(false)

        val audible = if (pcmPlayed) {
          true
        } else {
          runCatching {
            val generator = ToneGenerator(AudioManager.STREAM_MUSIC, 100)
            generator.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 280)
            Handler(Looper.getMainLooper()).postDelayed({
              generator.startTone(ToneGenerator.TONE_PROP_BEEP2, 350)
            }, 300L)
            Handler(Looper.getMainLooper()).postDelayed({ generator.release() }, 780L)
            true
          }.getOrDefault(false)
        }

        val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        if (vibrator?.hasVibrator() == true) {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 90, 80, 90, 80, 140), -1))
          } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(320L)
          }
        }
        audible
      }
    }

    AsyncFunction("isIgnoringBatteryOptimizations") {
      val context = appContext.reactContext ?: return@AsyncFunction false
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return@AsyncFunction true
      val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
      powerManager.isIgnoringBatteryOptimizations(context.packageName)
    }

    AsyncFunction("requestIgnoreBatteryOptimizations") {
      val context = appContext.reactContext ?: return@AsyncFunction false
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return@AsyncFunction true
      runCatching {
        context.startActivity(
          Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
            data = Uri.parse("package:${context.packageName}")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
        )
        true
      }.getOrDefault(false)
    }

    AsyncFunction("openHomeSettings") { openSettings(Settings.ACTION_HOME_SETTINGS) }
    AsyncFunction("openScreenPinningSettings") { openSettings(Settings.ACTION_SECURITY_SETTINGS) }
    AsyncFunction("openAppSettings") {
      val context = appContext.reactContext ?: return@AsyncFunction false
      runCatching {
        context.startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${context.packageName}")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        true
      }.getOrDefault(false)
    }

    AsyncFunction("requestDeviceAdmin") {
      val context = appContext.reactContext ?: return@AsyncFunction false
      val admin = ComponentName(context, KioskDeviceAdminReceiver::class.java)
      runCatching {
        context.startActivity(Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
          putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, admin)
          putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, "Abilita il blocco sicuro del totem.")
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        })
        true
      }.getOrDefault(false)
    }

    AsyncFunction("bringToFront") {
      val context = appContext.reactContext ?: return@AsyncFunction false
      runCatching {
        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return@runCatching false
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        context.startActivity(launchIntent)
        true
      }.getOrDefault(false)
    }

    AsyncFunction("getWifiIpv4Address") {
      val context = appContext.reactContext ?: return@AsyncFunction ""
      findWifiIpv4Address(context)
    }

    AsyncFunction("getBatteryStatus") {
      val context = appContext.reactContext ?: return@AsyncFunction mapOf("level" to 100, "isCharging" to true)
      val battery = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
      val level = battery?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
      val scale = battery?.getIntExtra(BatteryManager.EXTRA_SCALE, 100) ?: 100
      val status = battery?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
      mapOf(
        "level" to if (level >= 0 && scale > 0) ((level * 100) / scale) else 0,
        "isCharging" to (status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL)
      )
    }

    AsyncFunction("getSystemInfo") {
      val context = appContext.reactContext ?: return@AsyncFunction mapOf("deviceModel" to "Android", "androidVersion" to Build.VERSION.RELEASE)
      val stat = StatFs(context.filesDir.absolutePath)
      mapOf(
        "deviceModel" to "${Build.MANUFACTURER} ${Build.MODEL}".trim(),
        "androidVersion" to Build.VERSION.RELEASE,
        "sdkInt" to Build.VERSION.SDK_INT,
        "storageFreeMb" to (stat.availableBytes / (1024L * 1024L)).toInt(),
        "storageTotalMb" to (stat.totalBytes / (1024L * 1024L)).toInt()
      )
    }
  }

  private fun devicePolicyManager(): DevicePolicyManager {
    val context = requireNotNull(appContext.reactContext) { "React context non disponibile" }
    return context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
  }

  private fun findWifiIpv4Address(context: Context): String {
    val wifiAddress = runCatching {
      @Suppress("DEPRECATION")
      val raw = (context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager)
        .connectionInfo?.ipAddress ?: 0
      if (raw == 0) "" else "${raw and 0xff}.${raw shr 8 and 0xff}.${raw shr 16 and 0xff}.${raw shr 24 and 0xff}"
    }.getOrDefault("")
    if (isUsableIpv4(wifiAddress)) return wifiAddress

    var fallback = ""
    val interfaces = runCatching { NetworkInterface.getNetworkInterfaces() }.getOrNull() ?: return fallback
    while (interfaces.hasMoreElements()) {
      val networkInterface = interfaces.nextElement()
      if (!networkInterface.isUp || networkInterface.isLoopback) continue
      val addresses = networkInterface.inetAddresses
      while (addresses.hasMoreElements()) {
        val address = addresses.nextElement()
        if (address !is Inet4Address || address.isLoopbackAddress) continue
        val host = address.hostAddress ?: continue
        if (!isUsableIpv4(host)) continue
        if (networkInterface.name.startsWith("wlan") || networkInterface.name.startsWith("eth")) return host
        if (fallback.isEmpty() && address.isSiteLocalAddress) fallback = host
      }
    }
    return fallback
  }

  private fun isUsableIpv4(address: String): Boolean {
    return address.isNotBlank() && address != "0.0.0.0" && address != "127.0.0.1" && !address.startsWith("169.254.")
  }

  private fun isDefaultHome(context: Context): Boolean {
    val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
    val resolved = context.packageManager.resolveActivity(intent, 0)
    return resolved?.activityInfo?.packageName == context.packageName
  }

  private fun openSettings(action: String): Boolean {
    val context = appContext.reactContext ?: return false
    return runCatching {
      context.startActivity(Intent(action).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      true
    }.getOrDefault(false)
  }

  private suspend fun runOnUiThread(activity: Activity, action: () -> Unit): Boolean = withContext(Dispatchers.Main) {
    runCatching {
      action()
      true
    }.getOrDefault(false)
  }
}
