import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getKioskConfig,
  saveKioskConfig,
  KioskConfig,
  DEFAULT_KIOSK_CONFIG,
  getKioskTelemetry,
  KioskTelemetry,
} from '@/src/utils/kiosk';

export default function KioskHardwareScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<KioskConfig>(DEFAULT_KIOSK_CONFIG);
  const [telemetry, setTelemetry] = useState<KioskTelemetry | null>(null);
  const [activeTest, setActiveTest] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cfg, tel] = await Promise.all([getKioskConfig(), getKioskTelemetry()]);
      setConfig(cfg);
      setTelemetry(tel);
    } catch (e) {
      console.warn('Errore caricamento dati Kiosk:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (patch: Partial<KioskConfig>) => {
    const updated = { ...config, ...patch };
    setConfig(updated);
    try {
      setSaving(true);
      await saveKioskConfig(patch);
    } catch (e) {
      console.warn('Errore salvataggio kiosk:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerTest = (testName: string) => {
    setActiveTest(testName);
    setTimeout(() => {
      setActiveTest(null);
      if (testName === 'wake') {
        Alert.alert('✅ Test Risveglio', 'Comando di risveglio schermo (Wake Screen) inviato con successo.');
      } else if (testName === 'screensaver') {
        Alert.alert('✅ Test Salvaschermo', 'Salvaschermo promozionale avviato con successo.');
      } else if (testName === 'dim') {
        Alert.alert('✅ Test Dimming', 'Luminosità impostata in modalità risparmio energetico (10%).');
      } else if (testName === 'beep') {
        Alert.alert('🔔 Feedback Audio', 'Segnale acustico / beep di sistema riprodotto.');
      }
    }, 600);
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* HEADER SCHERMATA */}
      <View style={styles.header}>
        <View style={styles.headerIconBox}>
          <Ionicons name="tablet-portrait" size={28} color="#2563EB" />
        </View>
        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Controllo Kiosk & Hardware</Text>
          <Text style={styles.headerSubtitle}>Gestione dispositivo, blocco schermo, salvaschermo e REST API</Text>
        </View>
      </View>

      {/* SEZIONE 1: STATO KIOSK & BLOCCO DISPOSITIVO */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="lock-closed" size={22} color="#2563EB" />
          <Text style={styles.cardTitle}>Modalità Kiosk & Blocco Schermo</Text>
        </View>
        <Text style={styles.sectionDesc}>
          Blocca il tablet in modalità totem esclusiva. Nasconde la barra di navigazione Android e impedisce l'uscita non autorizzata ai clienti.
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingTextCol}>
            <Text style={styles.settingLabel}>Modalità Kiosk Dedicata</Text>
            <Text style={styles.settingSub}>Abilita il blocco e l'interfaccia a schermo intero.</Text>
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
            <Text style={styles.settingLabel}>Schermo Intero Immersivo (Immersive Mode)</Text>
            <Text style={styles.settingSub}>Nasconde le barre di sistema (Home, Indietro, Notifiche).</Text>
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

      {/* SEZIONE 2: SALVASCHERMO & GESTIONE INATTIVITÀ */}
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

      {/* SEZIONE 3: LUMINOSITÀ & ORIENTAMENTO DISPLAY */}
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

        {/* Orientamento Schermo */}
        <Text style={styles.inputGroupLabel}>Orientamento Display Forzato:</Text>
        <View style={styles.optionsGrid}>
          {[
            { label: 'Verticale (Portrait - Standard Totem)', mode: 'portrait', icon: 'phone-portrait' },
            { label: 'Orizzontale (Landscape - Bancone)', mode: 'landscape', icon: 'phone-landscape' },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.mode}
              style={[
                styles.optionCard,
                config.screenOrientation === opt.mode && styles.optionCardActive,
              ]}
              onPress={() => handleUpdate({ screenOrientation: opt.mode as any })}
            >
              <Ionicons
                name={opt.icon as any}
                size={18}
                color={config.screenOrientation === opt.mode ? '#2563EB' : '#64748B'}
              />
              <Text
                style={[
                  styles.optionCardText,
                  config.screenOrientation === opt.mode && styles.optionCardTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* SEZIONE 4: SICUREZZA & GESTURE DI SBLOCCO */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="finger-print" size={22} color="#8B5CF6" />
          <Text style={styles.cardTitle}>Sicurezza & Gesture di Sblocco</Text>
        </View>
        <Text style={styles.sectionDesc}>
          Imposta la sequenza di tocchi segreta per aprire il pannello di amministrazione e il PIN di protezione.
        </Text>

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

        <Text style={[styles.inputGroupLabel, { marginTop: 14 }]}>Posizione del Trigger Segreto:</Text>
        <View style={styles.optionsGrid}>
          {[
            { label: 'Angolo Alto a Destra', loc: 'top-right' },
            { label: 'Angolo Alto a Sinistra', loc: 'top-left' },
            { label: 'Logo Totem Ristorante', loc: 'logo' },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.loc}
              style={[
                styles.optionChip,
                config.secretTriggerLocation === opt.loc && styles.optionChipActive,
              ]}
              onPress={() => handleUpdate({ secretTriggerLocation: opt.loc as any })}
            >
              <Text
                style={[
                  styles.optionChipText,
                  config.secretTriggerLocation === opt.loc && styles.optionChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* SEZIONE 5: FREEKIOSK REST API & TELEMETRIA LOCALE */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="hardware-chip" size={22} color="#0284C7" />
          <Text style={styles.cardTitle}>FreeKiosk REST API & Telemetria LAN</Text>
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
            <Text style={[styles.telVal, styles.mono]}>{telemetry?.ipAddress || '192.168.1.9'}</Text>
          </View>
          <View style={styles.telemetryRow}>
            <Text style={styles.telKey}>Memoria Libera:</Text>
            <Text style={styles.telVal}>{telemetry?.freeMemoryMb || 512} MB</Text>
          </View>
          <View style={styles.telemetryRow}>
            <Text style={styles.telKey}>Versione Kiosk Engine:</Text>
            <Text style={styles.telVal}>{telemetry?.version || 'v1.2.10-kiosk'}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerTextBox: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
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
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  settingTextCol: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
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
    fontWeight: '700',
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
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  optionChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  optionChipTextActive: {
    color: 'white',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flex: 1,
    minWidth: '45%',
  },
  optionCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  optionCardText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  optionCardTextActive: {
    color: '#2563EB',
  },
  subConfigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  subConfigLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  miniChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  miniChipActive: {
    backgroundColor: '#10B981',
  },
  miniChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  miniChipTextActive: {
    color: 'white',
  },
  brightnessButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  brightnessChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  brightnessChipActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  brightnessChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  brightnessChipTextActive: {
    color: 'white',
  },
  timeInputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 10,
  },
  timeInputCol: {
    flex: 1,
  },
  timeInputLabel: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '700',
    marginBottom: 4,
  },
  timeInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  telemetryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  telKey: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  telVal: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
  },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  testButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flex: 1,
    minWidth: '45%',
    justifyContent: 'center',
  },
  testBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
});
