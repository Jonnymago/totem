# 📱 Guida Completa: Compilazione APK & Aggiornamenti OTA (GitHub Actions)

Questa guida descrive i due metodi ufficiali per compilare e aggiornare l'applicazione Totem QuickBite su dispositivi Android e sistemi **FydeOS**.

---

## ⚡ Guida Rapida: Quale Metodo Usare?

| Tipo di Modifica | Metodo Consigliato | Tempo di Build | Azione sul Tablet |
| :--- | :--- | :--- | :--- |
| **Grafica, testi, pulsanti, listini, logica carrello, layout o scontrini** | ⚡ **Aggiornamento OTA (Expo)** | **~30 secondi** | **Zero reinstallazioni** (1 tap su *Verifica Aggiornamenti* nel menu Admin o al riavvio) |
| **Aggiunta nuove periferiche native C++, nuovi driver Bluetooth a basso livello o nuovi permessi `AndroidManifest`** | 🔨 **Compilazione Completa APK** | **~10-15 minuti** | Download del nuovo file `.apk` e installazione |

---

## ⚡ METODO 1: Aggiornamento Istantaneo Over-The-Air (OTA) in ~30 Secondi

Con l'aggiornamento OTA, GitHub compila esclusivamente il bundle JavaScript ed Hermes (`index.bundle` + asset). **Non serve ricompilare il codice nativo Android né reinstallare l'APK.**

### 1. Come Avviare l'Aggiornamento OTA da GitHub
1. Vai sul tuo repository GitHub: `https://github.com/Jonnymago/totem`
2. Clicca sulla scheda **Actions** in alto.
3. Nel menu a sinistra, seleziona:  
   👉 **`⚡ Aggiornamento Istantaneo Totem (Expo OTA Updates)`**
4. Clicca sul pulsante **Run workflow**, inserisci una breve descrizione (es. *"Nuovo menu estivo e scontrino aggiornato"*) e conferma cliccando su **Run workflow**.
5. In **~30-40 secondi**, il nuovo bundle è pronto e pubblicato!

### 2. Come Ricevere l'Aggiornamento sul Totem
* **Automatico:** All'avvio dell'applicazione, il Totem controlla se ci sono aggiornamenti e li scarica in background.
* **Manuale dal Menu Admin:**
  1. Apri il pannello Admin del Totem (icona lucchetto / PIN).
  2. Vai su **Impostazioni** -> Sezione **🔄 Aggiornamenti Totem (OTA)**.
  3. Clicca su **Verifica Aggiornamenti**.
  4. Se disponibile, clicca su **Scarica & Applica**: il Totem si riavvierà con la nuova versione all'istante!

---

## 🔨 METODO 2: Compilazione Completa APK Nativo (GitHub Actions)

La pipeline compila l'intero ecosistema Android nativo (C++, Kotlin, Java, Hermes, V8, React Native Engine) su una macchina virtuale Ubuntu isolata.

### 1. Architettura della Pipeline Gradle
```
[ Push su main / Trigger manuale ]
               │
               ▼
[ Setup Node.js 20 + Cache NPM ]
               │
               ▼
[ Setup Java 17 Temurin + Cache Gradle (~1.3 GB) ]
               │
               ▼
[ Expo Prebuild: npx expo prebuild --platform android --clean ]
               │
               ▼
[ Iniezione automatica Debug Signing per APK Standalone ]
               │
               ▼
[ Gradle: ./gradlew assembleRelease -PreactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64 ]
               │
               ▼
[ 1. Caricamento Artifacts (ZIP) ]
[ 2. Pubblicazione Release GitHub: Totem-QuickBite-Universal.apk (Download Diretto) ]
```

### 2. Architetture CPU Universali (`Universal: ARM + x86_64`)
* Target: **`armeabi-v7a`**, **`arm64-v8a`**, **`x86`**, **`x86_64`**.
* **Compatibilità Totale FydeOS / ChromeOS (Totem PC Intel/AMD):** Esegue React Native ed Hermes in modalità nativa x86_64 a 64-bit senza dipendere dal layer di traduzione ARM, garantendo massima stabilità, avvio istantaneo e 60 FPS senza crash.
* **Compatibilità Tablet Android:** Funziona perfettamente su qualsiasi tablet o smartphone Android ARM (Samsung, Lenovo, Xiaomi, POS dedicati).

### 3. Come Avviare la Compilazione APK
* **Automatica:** Eseguendo un `git push` sul branch `main`.
* **Manuale:**
  1. Vai su **Actions** su GitHub.
  2. Seleziona **`Build Totem Android APK (GitHub Actions)`**.
  3. Clicca su **Run workflow**.

### 4. Come Scaricare l'APK Compilato sul Tablet (1 Solo Clic)
1. Sul browser del tablet/totem, apri:  
   `https://github.com/Jonnymago/totem/releases`
2. Apri la release **`Totem QuickBite Standalone APK (Latest Build)`**.
3. Nella sezione **Assets**, tocca direttamente:  
   👉 **`Totem-QuickBite-Universal.apk`**
4. Il download si avvierà come file `.apk` diretto (nessun file ZIP da estrarre).

---

## 🛠️ Risoluzione Problemi e Domande Frequenti

| Situazione | Causa | Soluzione |
| :--- | :--- | :--- |
| **"Nessun aggiornamento disponibile" in OTA** | Il codice non contiene modifiche o il Totem è già all'ultima versione. | Esegui una nuova build OTA da GitHub Actions. |
| **"App non installata" durante l'update APK** | Firma crittografica differente rispetto all'APK precedentemente installato. | Disinstalla prima la vecchia app e installa il nuovo APK. |
| **Download scaricato in formato `.zip`** | È stato scaricato dalla sezione *Artifacts* anziché da *Releases*. | Usa il link diretto nella sezione **Releases** di GitHub. |
| **Cache Gradle corrotta durante la build APK** | Modifiche radicali alle dipendenze native. | Avvia il workflow manuale spuntando l'opzione `clean_build: true`. |
