package expo.modules.kioskmode

import android.app.Activity
import android.app.ActivityManager
import android.content.Context
import android.content.pm.ActivityInfo
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Build
import android.view.View
import android.view.Window
import android.view.WindowManager
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class KioskModeModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React Application Context is null")

  private val currentActivity: Activity?
    get() = appContext.currentActivity

  override fun definition() = ModuleDefinition {
    Name("KioskMode")

    AsyncFunction("startLockTask") {
      val activity = currentActivity ?: return@AsyncFunction false
      try {
        activity.runOnUiThread {
          try {
            activity.startLockTask()
            hideSystemUIInternal(activity)
          } catch (e: Exception) {
            e.printStackTrace()
          }
        }
        return@AsyncFunction true
      } catch (e: Exception) {
        return@AsyncFunction false
      }
    }

    AsyncFunction("stopLockTask") {
      val activity = currentActivity ?: return@AsyncFunction false
      try {
        activity.runOnUiThread {
          try {
            activity.stopLockTask()
            showSystemUIInternal(activity)
          } catch (e: Exception) {
            e.printStackTrace()
          }
        }
        return@AsyncFunction true
      } catch (e: Exception) {
        return@AsyncFunction false
      }
    }

    AsyncFunction("isLockTaskActive") {
      val activity = currentActivity ?: return@AsyncFunction false
      val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
        ?: return@AsyncFunction false
      
      return@AsyncFunction if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        activityManager.lockTaskModeState != ActivityManager.LOCK_TASK_MODE_NONE
      } else {
        @Suppress("DEPRECATION")
        activityManager.isInLockTaskMode
      }
    }

    AsyncFunction("hideSystemUI") {
      val activity = currentActivity ?: return@AsyncFunction false
      try {
        activity.runOnUiThread {
          hideSystemUIInternal(activity)
        }
        return@AsyncFunction true
      } catch (e: Exception) {
        return@AsyncFunction false
      }
    }

    AsyncFunction("showSystemUI") {
      val activity = currentActivity ?: return@AsyncFunction false
      try {
        activity.runOnUiThread {
          showSystemUIInternal(activity)
        }
        return@AsyncFunction true
      } catch (e: Exception) {
        return@AsyncFunction false
      }
    }

    AsyncFunction("setScreenOrientation") { orientation: String ->
      val activity = currentActivity ?: return@AsyncFunction false
      try {
        activity.runOnUiThread {
          when (orientation.lowercase()) {
            "portrait" -> activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
            "landscape" -> activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
            "sensor_portrait" -> activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT
            "sensor_landscape" -> activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
            "auto" -> activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
            else -> activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
          }
        }
        return@AsyncFunction true
      } catch (e: Exception) {
        e.printStackTrace()
        return@AsyncFunction false
      }
    }

    AsyncFunction("setScreenBrightness") { brightness: Double ->
      val activity = currentActivity ?: return@AsyncFunction false
      try {
        activity.runOnUiThread {
          val window = activity.window ?: return@runOnUiThread
          val layoutParams = window.attributes
          val clamped = brightness.toFloat().coerceIn(0.05f, 1.0f)
          layoutParams.screenBrightness = clamped
          window.attributes = layoutParams
        }
        return@AsyncFunction true
      } catch (e: Exception) {
        return@AsyncFunction false
      }
    }

    AsyncFunction("playHardwareBeep") {
      try {
        val toneGen = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 100)
        toneGen.startTone(ToneGenerator.TONE_PROP_BEEP, 200)
        return@AsyncFunction true
      } catch (e: Exception) {
        return@AsyncFunction false
      }
    }
  }

  private fun hideSystemUIInternal(activity: Activity) {
    val window: Window = activity.window ?: return
    
    // Flag hardware a livello di Window per totem sempre attivo
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    window.addFlags(WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD)
    window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED)
    window.addFlags(WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      WindowCompat.setDecorFitsSystemWindows(window, false)
      val controller = WindowCompat.getInsetsController(window, window.decorView)
      if (controller != null) {
        controller.hide(WindowInsetsCompat.Type.systemBars())
        controller.systemBarsBehavior =
          WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
      }
    } else {
      @Suppress("DEPRECATION")
      window.decorView.systemUiVisibility = (
        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
          or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
          or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
          or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
          or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
          or View.SYSTEM_UI_FLAG_FULLSCREEN
      )
    }
  }

  private fun showSystemUIInternal(activity: Activity) {
    val window: Window = activity.window ?: return
    window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      WindowCompat.setDecorFitsSystemWindows(window, true)
      val controller = WindowCompat.getInsetsController(window, window.decorView)
      controller?.show(WindowInsetsCompat.Type.systemBars())
    } else {
      @Suppress("DEPRECATION")
      window.decorView.systemUiVisibility = (
        View.SYSTEM_UI_FLAG_LAYOUT_STABLE
          or View.SYSTEM_UI_FLAG_VISIBLE
      )
    }
  }
}

