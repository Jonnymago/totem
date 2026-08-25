# 📱 Guida Completa alla Compilazione APK Standalone (GitHub Actions)

Questa guida documenta l'architettura, la configurazione e il flusso di compilazione automatica dell'APK Android per i Totem e i dispositivi con **FydeOS / Android nativo**.

---

## 🏗️ 1. Architettura della Pipeline di Build

La pipeline è gestita tramite **GitHub Actions** nel file `.github/workflows/build_apk.yml`.  
Tutti i passaggi avvengono su macchine virtuali isolate `ubuntu-latest` senza richiedere EAS a pagamento o server esterni (come Kaggle).

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
[ Gradle: ./gradlew assembleRelease -PreactNativeArchitectures=armeabi-v7a,arm64-v8a ]
               │
               ▼
[ 1. Caricamento Artifacts (ZIP) ]
[ 2. Pubblicazione Release GitHub: Totem-QuickBite-Universal.apk (Download Diretto) ]
```

---

## ⚙️ 2. Scelte Tecniche e Ottimizzazioni

### A. Architetture CPU Target (`armeabi-v7a,arm64-v8a`)
* **Tablet Android Moderni (64-bit):** Eseguono direttamente i binari compilati a 64-bit (`arm64-v8a`).
* **Tablet Meno Recenti (32-bit):** Eseguono i binari `armeabi-v7a`.
* **FydeOS (Totem PC x86 / AMD):** Esegue le architetture ARM attraverso il bridge di traduzione nativo integrato in FydeOS (`libndk_translation` / `Houdini`), garantendo fluidità a 60/120 FPS senza la necessità di includere pesanti binari x86_64.
* **Risultato:** Dimensione APK ridotta da ~170 MB a **~80 MB** e tempo di compilazione C++ dimezzato.

### B. Strategia di Caching Multilivello
* **NPM Cache:** Memorizza i pacchetti `node_modules` in base all'hash di `frontend/package.json`.
* **Gradle Cache (`gradle/actions/setup-gradle@v4`):** Memorizza l'intera directory `~/.gradle/caches` (~1.04 GB di dipendenze Maven, Google Maven, Kotlin Compiler Daemon e wrapper binari). I download di rete successivi al primo impiegano meno di 30 secondi.

### C. Debug Signing su Release
Nei progetti Expo Prebuild, la configurazione release standard richiede una keystore di produzione firmata. Per consentire l'installazione immediata e autonoma dell'APK su qualsiasi tablet o totem senza dover configurare certificati esterni o password, lo script inietta automaticamente:
```gradle
buildTypes {
    release {
        signingConfig signingConfigs.debug
    }
}
```

---

## 🚀 3. Come Avviare una Nuova Compilazione

### Metodo A: Push Automatico
Ogni volta che esegui una modifica al codice sorgente e fai il push sul branch principale:
```bash
git add .
git commit -m "feat: aggiornamento interfaccia totem"
git push origin main
```
*(Nota: le modifiche ai soli file `.md` e `.gitignore` non avviano build inutili).*

### Metodo B: Avvio Manuale (Workflow Dispatch)
1. Vai su GitHub nel tuo repository.
2. Clicca sulla scheda **Actions** in alto.
3. Nel menu a sinistra, seleziona **Build Totem Android APK (GitHub Actions)**.
4. Clicca sul pulsante **Run workflow** -> **Run workflow**.

---

## 📥 4. Come Scaricare l'APK Compilato

### Download Diretto `.apk` (1 solo clic - Consigliato per Tablet)
1. Vai alla sezione **Releases** del repository:  
   `https://github.com/<TUO_UTENTE>/totem/releases`
2. Apri la release **`Totem QuickBite Standalone APK (Latest Build)`**.
3. Nella sezione **Assets**, clicca direttamente sul file:
   👉 **`Totem-QuickBite-Universal.apk`**
4. Il tablet scaricherà direttamente il file `.apk` e avvierà l'installazione (senza dover estrarre alcun archivio ZIP).

### Download da Artifacts (Archivio ZIP con checksum)
1. Dalla scheda **Actions**, clicca sull'esecuzione del workflow completata.
2. Scorri in fondo alla pagina fino alla sezione **Artifacts**.
3. Clicca su **`Totem-QuickBite-Android-APK`** per scaricare lo ZIP contenente l'APK e il file `checksums.sha256`.

---

## 🛠️ 5. Risoluzione dei Problemi Frequenti

| Problema | Causa | Soluzione |
| :--- | :--- | :--- |
| **Download in formato `.zip`** | Hai scaricato dalla sezione *Artifacts* anziché da *Releases*. | Scarica il file diretto dalla pagina **Releases** del repository. |
| **"App non installata" sul tablet** | Versione precedente installata con firma differente. | Disinstalla prima la vecchia versione dal tablet e reinstalla il nuovo APK. |
| **Cache Gradle corrotta** | Cambio radicale di librerie native. | Avvia il workflow manualmente spuntando la casella `clean_build: true`. |
