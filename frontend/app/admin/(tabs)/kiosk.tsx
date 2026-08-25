import React, { useEffect, useState } from 'react';
import {
  View,
  Text as NativeText,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput as NativeTextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  KioskConfig,
  DEFAULT_KIOSK_CONFIG,
  getKioskTelemetry,
  KioskTelemetry,
} from '@/src/utils/kiosk';
import { Text, TextInput } from '@/src/components/LocalizedPrimitives';
import { useKioskStore } from '@/src/store/kioskStore';
import {
  startKioskMode,
  stopKioskMode,
  isKioskModeActive,
  getKioskDiagnostics,
  KioskDiagnostics,
  openHomeSettings,
  openScreenPinningSettings,
  openAppSettings,
  requestDeviceAdmin,
} from '@/modules/kiosk-mode/src';
import { checkAllAppPermissions, requestAllAppPermissions, AppPermissionStatus } from '@/src/utils/permissions';

export default function KioskHardwareScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const {
    config,
    updateConfig,
    triggerWake,
    triggerScreensaver,
    triggerDim,
    triggerBeep,
  } = useKioskStore();
  const [telemetry, setTelemetry] = useState<KioskTelemetry | null>(null);
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [isLockTaskRunning, setIsLockTaskRunning] = useState(false);
  const [diagnostics, setDiagnostics] = useState<KioskDiagnostics | null>(null);
  const [permissions, setPermissions] = useState<AppPermissionStatus | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tel, lockState, diag, perms] = await Promise.all([
        getKioskTelemetry(),
        isKioskModeActive(),
        getKioskDiagnostics(),
        checkAllAppPermissions(),
      ]);
      setTelemetry(tel);
      setIsLockTaskRunning(lockState);
      setDiagnostics(diag);
      setPermissions(perms);
    } catch (e) {
      console.warn('Error loading Kiosk data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (patch: Partial<KioskConfig>) => {
    try {
      setSaving(true);
      await updateConfig(patch);
      const [tel, lockState, diag] = await Promise.all([
        getKioskTelemetry(),
        isKioskModeActive(),
        getKioskDiagnostics(),
      ]);
      setTelemetry(tel);
      setIsLockTaskRunning(lockState);
      setDiagnostics(diag);
    } catch (e) {
      console.warn('Error saving kiosk config:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleManualLockToggle = async () => {
    try {
      if (isLockTaskRunning) {
        await stopKioskMode();
        setIsLockTaskRunning(false);
        await updateConfig({ kioskEnabled: false });
        Alert.alert('🔓 Kiosk Sbloccato', 'Modalità Lock Task disattivata e barre di sistema ripristinate.');
      } else {
        await startKioskMode();
        setIsLockTaskRunning(true);
        await updateConfig({ kioskEnabled: true });
        Alert.alert('🔒 Kiosk Bloccato', 'Modalità Lock Task e schermo intero attivati.');
      }
      const diag = await getKioskDiagnostics();
      setDiagnostics(diag);
    } catch (e) {
      Alert.alert('Errore', String(e));
    }
  };

  const handleRequestAllPermissions = async () => {
    try {
      const result = await requestAllAppPermissions();
      setPermissions(result);
      if (result.allGranted) {
        Alert.alert('✅ Permessi Accordati', 'Tutti i permessi essenziali (Bluetooth, Storage, Posizione) sono attivi.');
      } else {
        Alert.alert('⚠️ Permessi Parziali', 'Alcuni permessi non sono stati accordati. Puoi gestirli dalle impostazioni di sistema.');
      }
    } catch (e) {
      Alert.alert('Errore permessi', String(e));
    }
  };

  const handleTriggerTest = (testName: string) => {
    setActiveTest(testName);
    setTimeout(() => {
      setActiveTest(null);
      if (testName === 'wake') {
        triggerWake();
        Alert.alert('✅ Test Risveglio', 'Comando di risveglio schermo eseguito con successo.');
      } else if (testName === 'screensaver') {
        triggerScreensaver();
        Alert.alert('✅ Test Salvaschermo', 'Salvaschermo avviato. Tocca lo schermo per uscire.');
      } else if (testName === 'dim') {
        triggerDim();
        Alert.alert('✅ Test Dimming', 'Luminosità impostata al 10% (risparmio energetico). Tocca lo schermo per ripristinare.');
      } else if (testName === 'beep') {
        triggerBeep();
        Alert.alert('🔔 Feedback Acustico', 'Segnale acustico e vibrazione hardware eseguiti.');
      }
    }, 300);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Caricamento impostazioni Kiosk & Hardware...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER DELLA SCHERMATA */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/admin/settings')}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Controllo Kiosk</Text>
        </View>
        <TouchableOpacity
          style={styles.totemBtnHeader}
          onPress={() => router.replace('/')}
        >
          <Ionicons name="storefront" size={18} color="white" />
          <Text style={styles.totemBtnHeaderText}>Totem</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>


      {/* SEZIONE 1: STATO KIOSK & BLOCCO DISPOSITIVO */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="lock-closed" size={22} color="#2563EB" />
          <Text style={styles.cardTitle}>Modalità Kiosk & Blocco Schermo (Anti-Uscita Cliente)</Text>
        </View>
        <Text style={styles.sectionDesc}>
          Fissa il tablet in modalità totem esclusiva. Nasconde la barra di navigazione Android, blocca i tasti Home e Recenti e impedisce l'uscita ai clienti.
        </Text>

        {/* Status Badge e Bottone Rapido */}
        <View style={styles.lockStatusBox}>
          <View style={{ flex: 1, minWidth: 160 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.statusDot, { backgroundColor: isLockTaskRunning ? '#10B981' : '#F59E0B' }]} />
              <Text style={styles.lockStatusLabel}>
                Stato: {isLockTaskRunning ? '🔒 Bloccato (Kiosk Attivo)' : '🔓 Non Fissato (Libero)'}
              </Text>
            </View>
            <Text style={styles.lockDetailText}>
              {diagnostics?.isDeviceOwner
                ? '⭐ Device Owner Attivo (Blocco Totale)'
                : diagnostics?.isDefaultHome
                ? '🏠 Launcher Predefinito'
                : '📱 Screen Pinning Android'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.quickLockBtn, { backgroundColor: isLockTaskRunning ? '#F59E0B' : '#10B981' }]}
            onPress={handleManualLockToggle}
          >
            <Ionicons name={isLockTaskRunning ? "lock-open" : "lock-closed"} size={16} color="white" />
            <Text style={styles.quickLockBtnText}>
              {isLockTaskRunning ? 'Sblocca' : 'Fissa Schermo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pulsanti Azioni Rapide Kiosk OS */}
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.actionPillBtn}
            onPress={() => openHomeSettings()}
          >
            <Ionicons name="home-outline" size={16} color="#2563EB" />
            <Text style={styles.actionPillBtnText}>Imposta come Home Launcher</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionPillBtn}
            onPress={() => openScreenPinningSettings()}
          >
            <Ionicons name="shield-outline" size={16} color="#2563EB" />
            <Text style={styles.actionPillBtnText}>Opzioni Blocco Android</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionPillBtn}
            onPress={() => requestDeviceAdmin()}
          >
            <Ionicons name="key-outline" size={16} color="#2563EB" />
            <Text style={styles.actionPillBtnText}>Attiva Device Admin</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingTextCol}>
            <Text style={styles.settingLabel}>Modalità Kiosk Esclusiva (Lock Task)</Text>
            <Text style={styles.settingSub}>Blocca l'app a schermo intero e disabilita i tasti Home e Recenti.</Text>
          </View>
          <Switch
            value={config.kioskEnabled}
            onValueChange={(val) => handleUpdate({ kioskEnabled: val })}
            trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
            thumbColor={config.kioskEnabled ? '#2563EB' : '#94A3B8'}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingTextCol}>
            <Text style={styles.settingLabel}>Schermo Intero Immersivo</Text>
            <Text style={styles.settingSub}>Nasconde permanentemente la barra di stato e la barra di navigazione.</Text>
          </View>
          <Switch
            value={config.immersiveFullscreen}
            onValueChange={(val) => handleUpdate({ immersiveFullscreen: val })}
            trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
            thumbColor={config.immersiveFullscreen ? '#2563EB' : '#94A3B8'}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingTextCol}>
            <Text style={styles.settingLabel}>Schermo Sempre Acceso (Keep Awake)</Text>
            <Text style={styles.settingSub}>Impedisce lo spegnimento dello schermo durante il servizio.</Text>
          </View>
          <Switch
            value={config.keepScreenAwake}
            onValueChange={(val) => handleUpdate({ keepScreenAwake: val })}
            trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
            thumbColor={config.keepScreenAwake ? '#2563EB' : '#94A3B8'}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingTextCol}>
            <Text style={styles.settingLabel}>Avvio Automatico all'Accensione (Auto-Boot)</Text>
            <Text style={styles.settingSub}>Riapre l'app totem immediatamente dopo il riavvio del tablet.</Text>
          </View>
          <Switch
            value={config.autoStartOnBoot}
            onValueChange={(val) => handleUpdate({ autoStartOnBoot: val })}
            trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
            thumbColor={config.autoStartOnBoot ? '#2563EB' : '#94A3B8'}
          />
        </View>
      </View>

      {/* SEZIONE 2: DIAGNOSTICA PERMESSI ANDROID */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="shield-checkmark" size={22} color="#10B981" />
          <Text style={styles.cardTitle}>Diagnostica Permessi & Hardware Android</Text>
        </View>
        <Text style={styles.sectionDesc}>
          Verifica lo stato dei permessi richiesti per la stampante termica Bluetooth, le immagini e le funzionalità totem.
        </Text>

        <View style={styles.permList}>
          <View style={styles.permRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
              <Ionicons
                name={permissions?.bluetooth ? "bluetooth" : "bluetooth-outline"}
                size={20}
                color={permissions?.bluetooth ? "#10B981" : "#EF4444"}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.permTitle}>Bluetooth (Connect & Scan)</Text>
                <Text style={styles.permSub} numberOfLines={2}>Necessario per stampanti termiche</Text>
              </View>
            </View>
            <Text style={[styles.permBadge, { backgroundColor: permissions?.bluetooth ? '#DCFCE7' : '#FEE2E2', color: permissions?.bluetooth ? '#15803D' : '#B91C1C' }]}>
              {permissions?.bluetooth ? '🟢 Accordato' : '🔴 Mancante'}
            </Text>
          </View>

          <View style={styles.permDivider} />

          <View style={styles.permRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
              <Ionicons
                name={permissions?.location ? "location" : "location-outline"}
                size={20}
                color={permissions?.location ? "#10B981" : "#64748B"}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.permTitle}>Posizione (Discovery BLE)</Text>
                <Text style={styles.permSub} numberOfLines={2}>Scansione periferiche Bluetooth legacy</Text>
              </View>
            </View>
            <Text style={[styles.permBadge, { backgroundColor: permissions?.location ? '#DCFCE7' : '#F1F5F9', color: permissions?.location ? '#15803D' : '#475569' }]}>
              {permissions?.location ? '🟢 Accordato' : '⚪ Facoltativo'}
            </Text>
          </View>

          <View style={styles.permDivider} />

          <View style={styles.permRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
              <Ionicons
                name={permissions?.media ? "images" : "images-outline"}
                size={20}
                color={permissions?.media ? "#10B981" : "#EF4444"}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.permTitle}>Archivio & Immagini</Text>
                <Text style={styles.permSub} numberOfLines={2}>Caricamento logo ristorante e foto pietanze</Text>
              </View>
            </View>
            <Text style={[styles.permBadge, { backgroundColor: permissions?.media ? '#DCFCE7' : '#FEE2E2', color: permissions?.media ? '#15803D' : '#B91C1C' }]}>
              {permissions?.media ? '🟢 Accordato' : '🔴 Mancante'}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <TouchableOpacity
            style={styles.requestPermsBtn}
            onPress={handleRequestAllPermissions}
          >
            <Ionicons name="shield-checkmark-outline" size={16} color="white" />
            <Text style={styles.requestPermsBtnText}>Richiedi Permessi</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.appSettingsBtn}
            onPress={() => openAppSettings()}
          >
            <Ionicons name="settings-outline" size={16} color="#0F172A" />
            <Text style={styles.appSettingsBtnText}>Impostazioni OS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SEZIONE 3: SALVASCHERMO & GESTIONE INATTIVITÀ */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="time" size={22} color="#10B981" />
          <Text style={styles.cardTitle}>Salvaschermo & Reset Inattività</Text>
        </View>
        <Text style={styles.sectionDesc}>
          Configura il comportamento del totem quando nessun cliente interagisce con lo schermo.
        </Text>

        {/* Timeout Inattività */}
        <Text style={styles.inputGroupLabel}>Timeout Inattività:</Text>
        <View style={styles.optionsGrid}>
          {[
            { label: '30 sec', val: 30 },
            { label: '60 sec', val: 60 },
            { label: '2 min', val: 120 },
            { label: '5 min', val: 300 },
            { label: 'Disattivato', val: 0 },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.val}
              style={[
                styles.optionChip,
                config.inactivityTimeoutSec === opt.val && styles.optionChipActive,
              ]}
              onPress={() => handleUpdate({ inactivityTimeoutSec: opt.val })}
            >
              <Text
                style={[
                  styles.optionChipText,
                  config.inactivityTimeoutSec === opt.val && styles.optionChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tipo Salvaschermo */}
        <Text style={[styles.inputGroupLabel, { marginTop: 14 }]}>Tipo di Salvaschermo:</Text>
        <View style={styles.optionsGrid}>
          {[
            { label: 'Banner Promozionale', mode: 'promo_banner', icon: 'images' },
            { label: 'Risparmio Energetico (Dimmed)', mode: 'dimmed', icon: 'contrast' },
            { label: 'Orologio Digitale', mode: 'clock', icon: 'time-outline' },
            { label: 'Schermo Nero', mode: 'black', icon: 'moon' },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.mode}
              style={[
                styles.optionCard,
                config.screensaverMode === opt.mode && styles.optionCardActive,
              ]}
              onPress={() => handleUpdate({ screensaverMode: opt.mode as any })}
            >
              <Ionicons
                name={opt.icon as any}
                size={18}
                color={config.screensaverMode === opt.mode ? '#2563EB' : '#64748B'}
              />
              <Text
                style={[
                  styles.optionCardText,
                  config.screensaverMode === opt.mode && styles.optionCardTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        {/* Auto-Reset Carrello */}
        <View style={styles.settingRow}>
          <View style={styles.settingTextCol}>
            <Text style={styles.settingLabel}>Auto-Reset Carrello Abbandonato</Text>
            <Text style={styles.settingSub}>
              Svuota il carrello e torna alla home se il cliente si allontana prima di pagare.
            </Text>
          </View>
          <Switch
            value={config.autoResetCartOnInactivity}
            onValueChange={(val) => handleUpdate({ autoResetCartOnInactivity: val })}
            trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
            thumbColor={config.autoResetCartOnInactivity ? '#10B981' : '#94A3B8'}
          />
        </View>

        {config.autoResetCartOnInactivity && (
          <View style={styles.subConfigRow}>
            <Text style={styles.subConfigLabel}>Tempo attesa reset carrello:</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[30, 45, 60, 90].map((sec) => (
                <TouchableOpacity
                  key={sec}
                  style={[
                    styles.miniChip,
                    config.autoResetCartTimeoutSec === sec && styles.miniChipActive,
                  ]}
                  onPress={() => handleUpdate({ autoResetCartTimeoutSec: sec })}
                >
                  <Text
                    style={[
                      styles.miniChipText,
                      config.autoResetCartTimeoutSec === sec && styles.miniChipTextActive,
                    ]}
                  >
                    {sec}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* SEZIONE 4: LUMINOSITÀ & ORIENTAMENTO DISPLAY */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="sunny" size={22} color="#F59E0B" />
          <Text style={styles.cardTitle}>Luminosità & Controllo Display</Text>
        </View>

        <Text style={styles.inputGroupLabel}>Luminosità Schermo ({config.brightnessLevel}%):</Text>
        <View style={styles.brightnessButtonsRow}>
          {[25, 50, 75, 90, 100].map((lvl) => (
            <TouchableOpacity
              key={lvl}
              style={[
                styles.brightnessChip,
                config.brightnessLevel === lvl && styles.brightnessChipActive,
              ]}
              onPress={() => handleUpdate({ brightnessLevel: lvl })}
            >
              <Text
                style={[
                  styles.brightnessChipText,
                  config.brightnessLevel === lvl && styles.brightnessChipTextActive,
                ]}
              >
                {lvl}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingTextCol}>
            <Text style={styles.settingLabel}>Dimming Notturno Programmato</Text>
            <Text style={styles.settingSub}>
              Abbassa la luminosità al 10% negli orari di chiusura per preservare il pannello.
            </Text>
          </View>
          <Switch
            value={config.nightDimmingEnabled}
            onValueChange={(val) => handleUpdate({ nightDimmingEnabled: val })}
            trackColor={{ false: '#CBD5E1', true: '#FDE68A' }}
            thumbColor={config.nightDimmingEnabled ? '#F59E0B' : '#94A3B8'}
          />
        </View>

        {config.nightDimmingEnabled && (
          <View style={styles.timeInputsRow}>
            <View style={styles.timeInputCol}>
              <Text style={styles.timeInputLabel}>Dalle ore:</Text>
              <TextInput
                style={styles.timeInput}
                value={config.nightDimmingStart}
                onChangeText={(val) => handleUpdate({ nightDimmingStart: val })}
                placeholder="23:00"
              />
            </View>
            <View style={styles.timeInputCol}>
              <Text style={styles.timeInputLabel}>Alle ore:</Text>
              <TextInput
                style={styles.timeInput}
                value={config.nightDimmingEnd}
                onChangeText={(val) => handleUpdate({ nightDimmingEnd: val })}
                placeholder="07:00"
              />
            </View>
          </View>
        )}

        <View style={styles.divider} />

        <Text style={styles.inputGroupLabel}>Orientamento Display:</Text>
        <View style={styles.optionsGrid}>
          {[
            { label: '📱 Verticale (Portrait)', val: 'portrait' },
            { label: '🖥️ Orizzontale (Landscape)', val: 'landscape' },
            { label: '🔄 Automatico (Auto)', val: 'auto' },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.val}
              style={[
                styles.optionChip,
                config.screenOrientation === opt.val && styles.optionChipActive,
              ]}
              onPress={() => handleUpdate({ screenOrientation: opt.val as any })}
            >
              <Text
                style={[
                  styles.optionChipText,
                  config.screenOrientation === opt.val && styles.optionChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* SEZIONE 5: SICUREZZA & GESTURE DI SBLOCCO */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="finger-print" size={22} color="#8B5CF6" />
          <Text style={styles.cardTitle}>Sicurezza & Gesture di Sblocco</Text>
        </View>
        <Text style={styles.sectionDesc}>
          Imposta la sequenza di tocchi segreta per aprire il pannello di amministrazione e il PIN di protezione.
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingTextCol}>
            <Text style={styles.settingLabel}>Richiedi PIN per Uscita / Accesso</Text>
            <Text style={styles.settingSub}>Richiede il PIN amministratore dopo aver completato i tocchi segreti.</Text>
          </View>
          <Switch
            value={config.requirePinForExit}
            onValueChange={(val) => handleUpdate({ requirePinForExit: val })}
            trackColor={{ false: '#CBD5E1', true: '#DDD6FE' }}
            thumbColor={config.requirePinForExit ? '#8B5CF6' : '#94A3B8'}
          />
        </View>

        <View style={styles.divider} />

        <Text style={styles.inputGroupLabel}>Numero di tocchi segreti:</Text>
        <View style={styles.optionsGrid}>
          {[
            { label: '5 Tocchi Rapidi', val: 5 },
            { label: '7 Tocchi Rapidi (Consigliato)', val: 7 },
            { label: '10 Tocchi', val: 10 },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.val}
              style={[
                styles.optionChip,
                config.secretTapsCount === opt.val && styles.optionChipActive,
              ]}
              onPress={() => handleUpdate({ secretTapsCount: opt.val })}
            >
              <Text
                style={[
                  styles.optionChipText,
                  config.secretTapsCount === opt.val && styles.optionChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* SEZIONE 6: TOTEM KIOSK REST API & TELEMETRIA LOCALE */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="hardware-chip" size={22} color="#0284C7" />
          <Text style={styles.cardTitle}>Totem Kiosk REST API & Telemetria LAN</Text>
        </View>
        <Text style={styles.sectionDesc}>
          Permette il controllo remoto e la telemetria via rete locale LAN (compatibile con Home Assistant e pannello web).
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingTextCol}>
            <Text style={styles.settingLabel}>REST API Locale Attiva</Text>
            <Text style={styles.settingSub}>Porta standard 8000 / microserver Python locale.</Text>
          </View>
          <Switch
            value={config.restApiEnabled}
            onValueChange={(val) => handleUpdate({ restApiEnabled: val })}
            trackColor={{ false: '#CBD5E1', true: '#BAE6FD' }}
            thumbColor={config.restApiEnabled ? '#0284C7' : '#94A3B8'}
          />
        </View>

        {/* Telemetria Box */}
        <View style={styles.telemetryBox}>
          <View style={styles.telemetryRow}>
            <Text style={styles.telKey}>Stato Schermo:</Text>
            <Text style={styles.telVal}>🟢 Attivo ({config.brightnessLevel}%)</Text>
          </View>
          <View style={styles.telemetryRow}>
            <Text style={styles.telKey}>IP Kiosk LAN:</Text>
            <Text style={[styles.telVal, styles.mono]}>{telemetry?.ipAddress || 'Rilevamento...'}</Text>
          </View>
          <View style={styles.telemetryRow}>
            <Text style={styles.telKey}>Memoria Libera:</Text>
            <Text style={styles.telVal}>{telemetry?.freeMemoryMb || 512} MB</Text>
          </View>
          <View style={styles.telemetryRow}>
            <Text style={styles.telKey}>Versione Sistema:</Text>
            <Text style={styles.telVal}>{telemetry?.version || '1.2.15'}</Text>
          </View>
        </View>

        {/* Test Strumenti Hardware Rapidi */}
        <Text style={[styles.inputGroupLabel, { marginTop: 14 }]}>Test Strumenti & Comandi Hardware:</Text>
        <View style={styles.testButtonsGrid}>
          <TouchableOpacity
            style={styles.testBtn}
            onPress={() => handleTriggerTest('wake')}
            disabled={activeTest !== null}
          >
            <Ionicons name="sunny-outline" size={16} color="#0F172A" />
            <Text style={styles.testBtnText}>Test Risveglio (Wake)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testBtn}
            onPress={() => handleTriggerTest('screensaver')}
            disabled={activeTest !== null}
          >
            <Ionicons name="images-outline" size={16} color="#0F172A" />
            <Text style={styles.testBtnText}>Test Salvaschermo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testBtn}
            onPress={() => handleTriggerTest('dim')}
            disabled={activeTest !== null}
          >
            <Ionicons name="contrast-outline" size={16} color="#0F172A" />
            <Text style={styles.testBtnText}>Test Dimming (10%)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testBtn}
            onPress={() => handleTriggerTest('beep')}
            disabled={activeTest !== null}
          >
            <Ionicons name="volume-high-outline" size={16} color="#0F172A" />
            <Text style={styles.testBtnText}>Test Feedback Beep</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FF6B6B',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  totemBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  totemBtnHeaderText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionDesc: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  lockStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    flexWrap: 'wrap',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  lockStatusLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  lockDetailText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  quickLockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
  },
  quickLockBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  actionPillBtnText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  permList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  permTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  permSub: {
    fontSize: 11,
    color: '#64748B',
  },
  permBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  permDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 6,
  },
  requestPermsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  requestPermsBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 13,
  },
  appSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  appSettingsBtnText: {
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 13,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  settingTextCol: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  settingSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  inputGroupLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  optionChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  optionChipTextActive: {
    color: '#2563EB',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  optionCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  optionCardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  optionCardTextActive: {
    color: '#2563EB',
  },
  subConfigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  subConfigLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  miniChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  miniChipActive: {
    backgroundColor: '#10B981',
  },
  miniChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  miniChipTextActive: {
    color: 'white',
  },
  brightnessButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  brightnessChip: {
    flex: 1,
    minWidth: 50,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  brightnessChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  brightnessChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  brightnessChipTextActive: {
    color: '#D97706',
  },
  timeInputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  timeInputCol: {
    flex: 1,
  },
  timeInputLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  timeInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  telemetryBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    gap: 8,
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  telKey: {
    fontSize: 12,
    color: '#94A3B8',
  },
  telVal: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
    flexShrink: 1,
  },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#38BDF8',
  },
  testButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  testBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
});
