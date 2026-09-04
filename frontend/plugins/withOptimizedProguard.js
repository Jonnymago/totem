const fs = require('fs');
const path = require('path');
const { withAppBuildGradle, withDangerousMod } = require('@expo/config-plugins');

const TOTEM_R8_RULES = `

# BEGIN TOTEM R8 RULES
# Entry point dinamici rilevati da Expo Modules e dal manifest Android.
-keep class expo.modules.kioskmode.KioskModeModule { *; }
-keep class expo.modules.playbilling.PlayBillingModule { *; }
-keep class expo.modules.kioskmode.KioskDeviceAdminReceiver { <init>(); *; }
-keep class expo.modules.kioskmode.BootCompletedReceiver { <init>(); *; }

# Mantieni tutti i moduli Expo, i convertitori di tipo e i Record (DocumentPicker, FileSystem, ImagePicker, Sharing, ecc.)
-keep class expo.modules.** { *; }
-keepclassmembers class expo.modules.** { *; }
-keep interface expo.modules.** { *; }

-keep class * extends expo.modules.kotlin.records.Record { *; }
-keepclassmembers class * extends expo.modules.kotlin.records.Record { *; }
-keep class * implements expo.modules.kotlin.records.Record { *; }
-keepclassmembers class * implements expo.modules.kotlin.records.Record { *; }

-keepclassmembers class * {
    @expo.modules.kotlin.records.Field *;
}

-keep class expo.modules.kotlin.** { *; }
-keepclassmembers class expo.modules.kotlin.** { *; }

# Mantieni metadati e annotazioni per la reflection Kotlin e React Native
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod,RuntimeVisibleAnnotations,RuntimeInvisibleAnnotations,AnnotationDefault
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}
# END TOTEM R8 RULES
`;

/**
 * Usa il profilo Android ottimizzato quando R8 è attivo in release e mantiene
 * piccole keep rules per gli entry point Totem che Expo o Android invocano dinamicamente.
 */
function withOptimizedProguard(config) {
  config = withAppBuildGradle(config, (modConfig) => {
    const contents = modConfig.modResults.contents;
    const optimized = contents.replace(
      /getDefaultProguardFile\(["']proguard-android\.txt["']\)/g,
      'getDefaultProguardFile("proguard-android-optimize.txt")',
    );
    if (optimized === contents) {
      throw new Error('Profilo ProGuard Android standard non trovato nel build.gradle del modulo app.');
    }
    modConfig.modResults.contents = optimized;
    return modConfig;
  });

  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const proguardPath = path.join(modConfig.modRequest.platformProjectRoot, 'app', 'proguard-rules.pro');
      let contents = fs.existsSync(proguardPath) ? fs.readFileSync(proguardPath, 'utf8') : '';
      contents = contents.replace(/\n?# BEGIN TOTEM R8 RULES[\s\S]*?# END TOTEM R8 RULES\n?/g, '\n');
      fs.writeFileSync(proguardPath, `${contents.trimEnd()}${TOTEM_R8_RULES}\n`);
      return modConfig;
    },
  ]);
}

module.exports = withOptimizedProguard;
