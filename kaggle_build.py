#!/usr/bin/env python3
# Runner automatico per compilazione APK Android Universale e Gestione Cache SDK su Kaggle
import os
import sys
import glob
import subprocess
import shutil

REPO = "Jonnymago/totem"
TOKEN = "TEST_TOKEN"
COMMIT_SHA = "main" or "main"
PROJECT_DIR = "/kaggle/working/app_project"
WORK_SDK = "/kaggle/working/android-sdk"

def run_cmd(cmd, cwd=None, check=True):
    print(f"\n>> Esecuzione: {cmd} (cwd: {cwd or '.'})")
    res = subprocess.run(cmd, shell=True, cwd=cwd)
    if check and res.returncode != 0:
        print(f"❌ Errore durante l'esecuzione del comando (Exit code: {res.returncode})")
        sys.exit(res.returncode)
    return res

def fetch_source():
    print("==================================================")
    print("📦 [1/5] Estrazione codice sorgente...")
    print("==================================================")
    if os.path.exists(PROJECT_DIR):
        shutil.rmtree(PROJECT_DIR)
    os.makedirs(PROJECT_DIR, exist_ok=True)

    extracted = False

    # Strategia 1: Download diretto tarball via GitHub API con Token
    if TOKEN:
        print("🌐 Download archivio sorgenti via GitHub REST API...")
        tar_url = f"https://api.github.com/repos/{REPO}/tarball/{COMMIT_SHA}"
        curl_cmd = (
            f"curl -s -L -H 'Authorization: Bearer {TOKEN}' "
            f"-H 'Accept: application/vnd.github.v3+json' "
            f"'{tar_url}' -o /tmp/app_source.tar.gz"
        )
        res = subprocess.run(curl_cmd, shell=True)
        if res.returncode == 0 and os.path.exists("/tmp/app_source.tar.gz") and os.path.getsize("/tmp/app_source.tar.gz") > 1000:
            tar_res = subprocess.run(f"tar -xzf /tmp/app_source.tar.gz --strip-components=1 -C {PROJECT_DIR}", shell=True)
            if tar_res.returncode == 0:
                print("✅ Sorgenti estratte con successo da GitHub API!")
                extracted = True

    # Strategia 2: Git clone con Token
    if not extracted and TOKEN:
        print("🌐 Fallback: Git clone con token...")
        clone_urls = [
            f"https://x-access-token:{TOKEN}@github.com/{REPO}.git",
            f"https://oauth2:{TOKEN}@github.com/{REPO}.git"
        ]
        for url in clone_urls:
            res = subprocess.run(f"git clone --depth 1 {url} {PROJECT_DIR}", shell=True)
            if res.returncode == 0:
                print("✅ Repository clonato con successo!")
                extracted = True
                break

    # Strategia 3: Git clone pubblico fallback
    if not extracted:
        print("🌐 Fallback: Git clone pubblico...")
        res = subprocess.run(f"git clone --depth 1 https://github.com/{REPO}.git {PROJECT_DIR}", shell=True)
        if res.returncode == 0:
            print("✅ Repository clonato via git!")
            extracted = True

    if not extracted:
        print("❌ Errore critico: Impossibile scaricare i sorgenti.")
        sys.exit(1)

def setup_sdk():
    print("==================================================")
    print("⚡ [2/5] Setup OpenJDK 17 & Android SDK...")
    print("==================================================")
    run_cmd("apt-get update -qq && apt-get install -y -qq openjdk-17-jdk unzip wget curl zip > /dev/null 2>&1", check=False)
    os.environ["JAVA_HOME"] = "/usr/lib/jvm/java-17-openjdk-amd64"
    os.environ["PATH"] = f"{os.environ.get('JAVA_HOME', '')}/bin:" + os.environ.get("PATH", "")

    print("🔍 Ricerca Android SDK nel dataset di cache (/kaggle/input)...")
    sdk_found = None
    if os.path.exists("/kaggle/input"):
        for root, dirs, files in os.walk("/kaggle/input"):
            if "platforms" in dirs and ("build-tools" in dirs or "platform-tools" in dirs or "cmdline-tools" in dirs):
                sdk_found = root
                break

    using_cache = False
    if sdk_found:
        print(f"🚀 Android SDK trovato e agganciato dalla Cache: {sdk_found}")
        os.environ["ANDROID_HOME"] = sdk_found
        os.environ["ANDROID_SDK_ROOT"] = sdk_found
        using_cache = True
        for sub in ["cmdline-tools/latest/bin", "platform-tools", "tools/bin"]:
            p = os.path.join(sdk_found, sub)
            if os.path.exists(p):
                os.environ["PATH"] = f"{p}:" + os.environ.get("PATH", "")
    else:
        print("⚠️ Cache SDK non trovata in input: download e installazione in corso...")
        sdk_path = WORK_SDK
        cmd_tools_dir = f"{sdk_path}/cmdline-tools/latest/bin"
        os.environ["ANDROID_HOME"] = sdk_path
        os.environ["ANDROID_SDK_ROOT"] = sdk_path
        os.environ["PATH"] = f"{cmd_tools_dir}:{sdk_path}/platform-tools:" + os.environ.get("PATH", "")

        os.makedirs(f"{sdk_path}/cmdline-tools", exist_ok=True)
        run_cmd("wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O /tmp/cmdline.zip")
        run_cmd(f"unzip -q -o /tmp/cmdline.zip -d {sdk_path}/cmdline-tools")
        run_cmd(f"rm -rf {sdk_path}/cmdline-tools/latest 2>/dev/null || true", check=False)
        run_cmd(f"mv {sdk_path}/cmdline-tools/cmdline-tools {sdk_path}/cmdline-tools/latest", check=False)
        
        print("📋 Accettazione licenze Android...")
        run_cmd(f"yes | {cmd_tools_dir}/sdkmanager --licenses > /dev/null 2>&1", check=False)
        print("📥 Download SDK Packages (Android 34, Android 35, Build Tools)...")
        run_cmd(f"{cmd_tools_dir}/sdkmanager 'platform-tools' 'platforms;android-35' 'platforms;android-34' 'build-tools;35.0.0' 'build-tools;34.0.0' > /dev/null 2>&1", check=False)

    return using_cache

def build_universal_apk():
    print("==================================================")
    print("🔨 [3/5] Compilazione Gradle APK Universale...")
    print("==================================================")
    frontend_dir = os.path.join(PROJECT_DIR, "frontend")
    gradle_target_dir = PROJECT_DIR

    if os.path.exists(frontend_dir):
        print("📦 Installazione dipendenze Node.js e prebuild Expo...")
        run_cmd("npm install --legacy-peer-deps", cwd=frontend_dir)
        run_cmd("npx expo prebuild --platform android --clean", cwd=frontend_dir)
        android_dir = os.path.join(frontend_dir, "android")
        if os.path.exists(android_dir):
            gradle_target_dir = android_dir

    os.chdir(gradle_target_dir)
    run_cmd("chmod +x ./gradlew")

    # Compilazione completa di un APK Debug universale e autoconsistente
    # Senza flag restrittivi di ABI in modo da incorporare tutte le librerie native supportate
    gradle_cmd = (
        "./gradlew assembleDebug "
        "--no-daemon "
        "--parallel "
        "--max-workers=4 "
        "-Dorg.gradle.jvmargs='-Xmx8g -XX:+UseParallelGC'"
    )
    build_res = subprocess.run(gradle_cmd, shell=True, cwd=gradle_target_dir)

    print("==================================================")
    print("📤 [4/5] Copia e validazione APK finale...")
    print("==================================================")
    
    # Ricerca dell'APK principale generato da Gradle
    candidate_apks = []
    for pattern in [
        f"{gradle_target_dir}/app/build/outputs/apk/debug/*.apk",
        f"{PROJECT_DIR}/**/build/outputs/apk/debug/*.apk",
        f"{PROJECT_DIR}/**/build/outputs/apk/**/*.apk"
    ]:
        found = glob.glob(pattern, recursive=True)
        for f in found:
            if f not in candidate_apks and os.path.isfile(f):
                candidate_apks.append(f)

    valid_apk = None
    # Prioritizza app-debug.apk o app-universal-debug.apk
    for apk in candidate_apks:
        name = os.path.basename(apk).lower()
        if "unaligned" not in name and name.endswith(".apk"):
            if "app-debug.apk" in name or "universal" in name:
                valid_apk = apk
                break
            if not valid_apk:
                valid_apk = apk

    if valid_apk and build_res.returncode == 0:
        target_output = "/kaggle/working/app-debug.apk"
        shutil.copy2(valid_apk, target_output)
        size_mb = os.path.getsize(target_output) / (1024 * 1024)
        print(f"✅ APK Universale pronto e valido: {target_output} ({size_mb:.2f} MB)")
    else:
        print("❌ Errore durante la compilazione Gradle: nessun APK valido generato.")
        sys.exit(1)

def export_sdk_cache(using_cache):
    print("==================================================")
    print("📦 [5/5] Gestione Cache SDK...")
    print("==================================================")
    if not using_cache and os.path.exists(WORK_SDK):
        print("📦 Creazione archivio 'android-sdk.zip' in /kaggle/working/ per salvataggio Dataset...")
        zip_target = "/kaggle/working/android-sdk"
        shutil.make_archive(zip_target, 'zip', WORK_SDK)
        zip_file = f"{zip_target}.zip"
        if os.path.exists(zip_file):
            size_mb = os.path.getsize(zip_file) / (1024 * 1024)
            print(f"✅ File 'android-sdk.zip' generato negli output di Kaggle ({size_mb:.2f} MB)!")
            print("💡 Puoi scaricarlo dalla sezione Output del Notebook e caricarlo su Kaggle Datasets.")
    else:
        print("ℹ️ È stata utilizzata la cache SDK esistente o non è necessaria una nuova esportazione.")

def main():
    fetch_source()
    using_cache = setup_sdk()
    build_universal_apk()
    export_sdk_cache(using_cache)
    print("🎉 Pipeline di build completata con successo al 100%!")

if __name__ == "__main__":
    main()
