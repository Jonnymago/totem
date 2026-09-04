import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Linking,
  useWindowDimensions,
  Platform,
  Switch,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Network from 'expo-network';
import {
  getSettings,
  updateSettings,
  getDisplayQueueCalling,
  setDisplayQueueCalling,
  getRemoteAdminUrl,
  resetOrderNumber,
} from '@/src/api/api';
import { playQueueCallSound } from '@/src/utils/audio';
import { getWifiIpv4Address } from '@/modules/kiosk-mode/src';
import { getFastLocalIp } from '@/src/utils/lanScanner';
import { Text, TextInput, InfoTip } from '@/src/components/LocalizedPrimitives';
import AdminHeader from '@/src/components/AdminHeader';

function isUsableLanIpv4(value: string): boolean {
  const ip = (value || '').trim();
  if (!/^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip)) return false;
  const octets = ip.split('.').map(Number);
  if (octets.some((part) => part < 0 || part > 255)) return false;
  if (ip === '0.0.0.0' || ip === '127.0.0.1' || ip.startsWith('169.254.')) return false;
  return true;
}

interface DqConfig {
  show_only_number: boolean;
  show_header: boolean;
  show_clock: boolean;
  show_ready_list: boolean;
  show_prep_list: boolean;
  show_instruction: boolean;
  number_size: 'normal' | 'huge' | 'gigantic';
  theme: 'dark-navy' | 'dark-pure' | 'light';
  sound_enabled: boolean;
  call_label: string;
  instruction_text: string;
  show_prefix: boolean;
}

const DEFAULT_DQ_CONFIG: DqConfig = {
  show_only_number: false,
  show_header: true,
  show_clock: true,
  show_ready_list: true,
  show_prep_list: true,
  show_instruction: true,
  number_size: 'huge',
  theme: 'dark-navy',
  sound_enabled: true,
  call_label: '',
  instruction_text: '',
  show_prefix: false,
};

export default function QueueCounterScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 420;
  const [dqCallingNum, setDqCallingNum] = useState<number | null>(null);
  const [dqManualInput, setDqManualInput] = useState('');
  const [dqCallingLoading, setDqCallingLoading] = useState(false);
  const [localIp, setLocalIp] = useState('');
  const [orderResetMode, setOrderResetMode] = useState<'daily' | 'never' | 'manual'>('daily');
  const [resetTime, setResetTime] = useState('06:00');
  const [lastResetAt, setLastResetAt] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [dqConfig, setDqConfig] = useState<DqConfig>(DEFAULT_DQ_CONFIG);

  const loadCallingNumber = useCallback(async () => {
    try {
      const res = await getDisplayQueueCalling();
      setDqCallingNum(res.number ?? null);
    } catch {
      /* ignore */
    }
  }, []);

  const detectIp = useCallback(async () => {
    try {
      const [settings, fastIp] = await Promise.all([
        getSettings(),
        getFastLocalIp(1200),
      ]);
      setOrderResetMode(settings.order_reset_mode || 'daily');
      setResetTime(settings.reset_time || '06:00');
      setLastResetAt(settings.last_reset_at || null);
      if (settings.display_queue_config && typeof settings.display_queue_config === 'object') {
        setDqConfig({ ...DEFAULT_DQ_CONFIG, ...settings.display_queue_config });
      }
      const saved = (settings.remote_ip_override || '').trim();
      const ipVal = isUsableLanIpv4(saved) ? saved : fastIp;
      setLocalIp(ipVal || '127.0.0.1');
    } catch {
      /* ignore */
    }
  }, []);

  const saveDqConfig = async (patch: Partial<DqConfig>) => {
    const next = { ...dqConfig, ...patch };
    setDqConfig(next);
    try {
      await updateSettings({ display_queue_config: next });
    } catch {
      Alert.alert('Errore', 'Impossibile aggiornare la configurazione.');
    }
  };

  useEffect(() => {
    void loadCallingNumber();
    void detectIp();
    const interval = setInterval(() => { void loadCallingNumber(); }, 4000);
    return () => clearInterval(interval);
  }, [loadCallingNumber, detectIp]);

  const announce = async (next: number | null, withSound: boolean) => {
    try {
      setDqCallingLoading(true);
      const res = await setDisplayQueueCalling(next);
      setDqCallingNum(res.number);
      if (withSound && res.number != null) {
        void playQueueCallSound();
      }
    } catch {
      Alert.alert('Errore', 'Impossibile aggiornare il numero di coda.');
    } finally {
      setDqCallingLoading(false);
    }
  };

  const handleCallNext = () => {
    void playQueueCallSound();
    void announce((dqCallingNum ?? 0) + 1, false);
  };
  const handleCallPrev = () => {
    if (!dqCallingNum || dqCallingNum <= 1) return;
    void playQueueCallSound();
    void announce(dqCallingNum - 1, false);
  };
  const handleCallManual = () => {
    const num = parseInt(dqManualInput.trim(), 10);
    if (Number.isNaN(num) || num < 0) {
      Alert.alert('Numero non valido', 'Inserisci un numero intero.');
      return;
    }
    setDqManualInput('');
    void playQueueCallSound();
    void announce(num, false);
  };
  const handleCallReset = () => {
    Alert.alert('Azzera coda', 'Nessun numero resterà in chiamata sulle TV.', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Azzera', style: 'destructive', onPress: () => { void announce(null, false); } },
    ]);
  };

  const saveResetMode = async (mode: 'daily' | 'never' | 'manual', time = resetTime) => {
    if (mode === 'daily' && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time.trim())) {
      Alert.alert('Orario non valido', 'Inserisci l’orario di reset nel formato HH:MM, tra 00:00 e 23:59.');
      return;
    }
    setOrderResetMode(mode);
    setResetTime(time);
    await updateSettings({ order_reset_mode: mode, reset_time: time.trim() || '06:00' });
  };

  const handleResetOrders = () => {
    Alert.alert(
      'Azzerare i numeri ordine?',
      'Il contatore torna a 1 e le comande in cucina vengono svuotate. Il numero in chiamata in sala resta invariato.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Azzera ora',
          style: 'destructive',
          onPress: async () => {
            try {
              setResetting(true);
              const result = await resetOrderNumber();
              setLastResetAt(result.reset_at);
              Alert.alert('Contatore azzerato', `Ordini cancellati: ${result.orders_cleared}`);
            } catch {
              Alert.alert('Errore', 'Impossibile azzerare la numerazione.');
            } finally {
              setResetting(false);
            }
          },
        },
      ]
    );
  };

  const host = localIp || 'IP_TABLET';
  const queueUrl = `http://${host}:3000/queue/`;

  const copyUrl = async (url: string) => {
    await Clipboard.setStringAsync(url);
    Alert.alert('Copiato', url);
  };

  return (
    <View style={styles.container}>
      <AdminHeader
        title="Contacoda Numerico"
        subtitle="Chiamata clienti e monitor TV ritiro in sala"
        emoji="🎫"
        showBack={true}
        showTotemButton={true}
      />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Ionicons name="megaphone" size={18} color="#FF6B6B" />
            <Text style={styles.cardTitle}>Numero in chiamata</Text>
            <InfoTip
              title="Chiama il numero"
              message="+1 avanza, -1 torna indietro, Chiama imposta un numero a mano. Un suono alto avvisa cassa e TV. Azzera toglie il numero dal tabellone senza cancellare gli ordini."
            />
          </View>
          <View style={styles.numStage}>
            <Text style={styles.numLabel}>ATTUALE</Text>
            <View style={styles.digitRow}>
              {(dqCallingNum !== null ? String(dqCallingNum).padStart(2, '0') : '--').split('').map((ch, idx) => (
                <View key={`${ch}-${idx}`} style={[styles.digitBox, compact && styles.digitBoxCompact]}>
                  <Text style={[styles.digitChar, compact && styles.digitCharCompact]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.4}>
                    {ch}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={styles.numHint}>Il tabellone TV e il suono si aggiornano subito</Text>
          </View>
          <View style={styles.actionsCol}>
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrev, (!dqCallingNum || dqCallingNum <= 1) && { opacity: 0.45 }]}
                onPress={handleCallPrev}
                disabled={dqCallingLoading || !dqCallingNum || dqCallingNum <= 1}
              >
                <Text style={styles.btnLight}>-1 Precedente</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnNext]} onPress={handleCallNext} disabled={dqCallingLoading}>
                {dqCallingLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnWhite}>+1 Chiama</Text>}
              </TouchableOpacity>
            </View>
            <View style={styles.manualRow}>
              <TextInput
                style={styles.input}
                value={dqManualInput}
                onChangeText={setDqManualInput}
                placeholder="Es. 42"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                maxLength={4}
              />
              <TouchableOpacity style={styles.manualBtn} onPress={handleCallManual}>
                <Text style={styles.manualBtnText}>Chiama</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resetBtn} onPress={handleCallReset}>
                <Text style={styles.resetText}>Azzera</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Ionicons name="tv-outline" size={18} color="#2563EB" />
            <Text style={styles.cardTitle}>IP tabellone coda</Text>
            <InfoTip
              title="URL coda"
              message="Apri questo indirizzo sulla Smart TV, Firestick o browser della sala, stessa Wi-Fi del totem. Mostra solo il numero a schermo intero. La vetrina prodotti sta nella tab TV."
            />
          </View>
          {!localIp ? (
            <Text style={styles.warn}>Collega il tablet al Wi-Fi. L'IP appare da solo. Puoi anche impostarlo in Impostazioni → Rete.</Text>
          ) : null}
          <Text style={styles.url} selectable>{queueUrl}</Text>
          <View style={styles.wrapRow}>
            <TouchableOpacity style={styles.ghost} onPress={() => copyUrl(queueUrl)}>
              <Ionicons name="copy-outline" size={15} color="#1E293B" />
              <Text style={styles.ghostText}>Copia URL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghost} onPress={() => Share.share({ message: queueUrl }).catch(() => {})}>
              <Ionicons name="share-social-outline" size={15} color="#1E293B" />
              <Text style={styles.ghostText}>Condividi</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.ghost, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]} onPress={() => Linking.openURL(queueUrl).catch(() => Alert.alert('Errore', 'Impossibile aprire il browser locale.'))}>
              <Ionicons name="open-outline" size={15} color="#2563EB" />
              <Text style={[styles.ghostText, { color: '#2563EB', fontWeight: '800' }]}>Apri Monitor</Text>
            </TouchableOpacity>
          </View>
          {localIp ? (
            <ExpoImage
              source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(queueUrl)}` }}
              style={{ width: 140, height: 140, marginTop: 12, alignSelf: 'center' }}
              contentFit="contain"
            />
          ) : null}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Ionicons name="color-palette-outline" size={18} color="#0EA5E9" />
            <Text style={styles.cardTitle}>Personalizzazione Monitor TV (Contacoda)</Text>
            <InfoTip
              title="Personalizzazione TV"
              message="Personalizza layout, colori e dimensioni del tabellone visualizzato sulle Smart TV della sala."
            />
          </View>
          <Text style={styles.hint}>
            Personalizza layout, colori e dimensioni del tabellone visualizzato sulle Smart TV della sala.
          </Text>

          <Text style={styles.sectionSubtitle}>Modalità Visualizzazione TV</Text>
          <View style={styles.pills}>
            {[
              { id: false, label: 'Completo (Chiamata + Liste)' },
              { id: true, label: 'Solo Numero Gigante' },
            ].map((m) => {
              const active = dqConfig.show_only_number === m.id;
              return (
                <TouchableOpacity
                  key={String(m.id)}
                  style={[styles.pill, active && styles.pillOn]}
                  onPress={() => { void saveDqConfig({ show_only_number: m.id }); }}
                >
                  <Text style={[styles.pillText, active && styles.pillTextOn]}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionSubtitle}>Tema Colore Schermo</Text>
          <View style={styles.pills}>
            {[
              { id: 'dark-navy', label: 'Blu Notte (Navy)' },
              { id: 'dark-pure', label: 'Nero OLED' },
              { id: 'light', label: 'Chiaro' },
            ].map((t) => {
              const active = (dqConfig.theme || 'dark-navy') === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.pill, active && styles.pillOn]}
                  onPress={() => { void saveDqConfig({ theme: t.id as any }); }}
                >
                  <Text style={[styles.pillText, active && styles.pillTextOn]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionSubtitle}>Dimensione Cifra</Text>
          <View style={styles.pills}>
            {[
              { id: 'normal', label: 'Standard' },
              { id: 'huge', label: 'Enorme' },
              { id: 'gigantic', label: 'Gigantesco' },
            ].map((s) => {
              const active = (dqConfig.number_size || 'huge') === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.pill, active && styles.pillOn]}
                  onPress={() => { void saveDqConfig({ number_size: s.id as any }); }}
                >
                  <Text style={[styles.pillText, active && styles.pillTextOn]}>{s.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionSubtitle}>Opzioni & Suoni TV</Text>

          <View style={styles.settingRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.settingLabel}>Gong sonoro su Smart TV alla chiamata</Text>
              <Text style={styles.settingSub}>Emette un segnale acustico alla chiamata di un numero</Text>
            </View>
            <Switch
              value={dqConfig.sound_enabled !== false}
              onValueChange={(v) => { void saveDqConfig({ sound_enabled: v }); }}
              trackColor={{ false: '#CBD5E1', true: '#2563EB' }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.settingLabel}>Orologio digitale in alto</Text>
              <Text style={styles.settingSub}>Mostra l'ora corrente aggiornata al secondo</Text>
            </View>
            <Switch
              value={dqConfig.show_clock !== false}
              onValueChange={(v) => { void saveDqConfig({ show_clock: v }); }}
              trackColor={{ false: '#CBD5E1', true: '#2563EB' }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.settingLabel}>Intestazione con nome attività</Text>
              <Text style={styles.settingSub}>Mostra il nome del ristorante nella barra superiore</Text>
            </View>
            <Switch
              value={dqConfig.show_header !== false}
              onValueChange={(v) => { void saveDqConfig({ show_header: v }); }}
              trackColor={{ false: '#CBD5E1', true: '#2563EB' }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.settingLabel}>Istruzioni per il ritiro</Text>
              <Text style={styles.settingSub}>Mostra la guida al ritiro al cliente sotto al numero</Text>
            </View>
            <Switch
              value={dqConfig.show_instruction !== false}
              onValueChange={(v) => { void saveDqConfig({ show_instruction: v }); }}
              trackColor={{ false: '#CBD5E1', true: '#2563EB' }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.settingLabel}>Prefisso '#' davanti al numero</Text>
              <Text style={styles.settingSub}>Mostra #01 anziché 01</Text>
            </View>
            <Switch
              value={Boolean(dqConfig.show_prefix)}
              onValueChange={(v) => { void saveDqConfig({ show_prefix: v }); }}
              trackColor={{ false: '#CBD5E1', true: '#2563EB' }}
            />
          </View>

          <Text style={styles.sectionSubtitle}>Personalizzazione Testi Schermo TV</Text>
          <View style={{ gap: 10, marginTop: 4 }}>
            <View>
              <Text style={styles.label}>Etichetta numero chiamata (default: NUMERO IN CHIAMATA)</Text>
              <TextInput
                style={styles.input}
                value={dqConfig.call_label}
                onChangeText={(text) => setDqConfig((prev) => ({ ...prev, call_label: text }))}
                onEndEditing={() => { void saveDqConfig({ call_label: dqConfig.call_label }); }}
                placeholder="NUMERO IN CHIAMATA"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <View>
              <Text style={styles.label}>Istruzioni ritiro (default: ⚡ Recarsi alla cassa o al banco di ritiro)</Text>
              <TextInput
                style={styles.input}
                value={dqConfig.instruction_text}
                onChangeText={(text) => setDqConfig((prev) => ({ ...prev, instruction_text: text }))}
                onEndEditing={() => { void saveDqConfig({ instruction_text: dqConfig.instruction_text }); }}
                placeholder="⚡ Recarsi alla cassa o al banco di ritiro"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Ionicons name="refresh-circle-outline" size={18} color="#8B5CF6" />
            <Text style={styles.cardTitle}>Numerazione ordini</Text>
            <InfoTip
              title="Azzeramento numeri"
              message="Automatico: ogni giorno all'orario scelto il contatore ordini riparte da 1. Manuale: solo quando premi Azzera ora. Mai: i numeri crescono senza sosta. Non cancella il numero in chiamata sul tabellone."
            />
          </View>
          <Text style={styles.hint}>Quando il contatore scontrini e comande torna a 1.</Text>
          <View style={styles.pills}>
            {[
              { id: 'daily', label: 'Automatico' },
              { id: 'manual', label: 'Manuale' },
              { id: 'never', label: 'Mai' },
            ].map((mode) => {
              const active = orderResetMode === mode.id;
              return (
                <TouchableOpacity
                  key={mode.id}
                  style={[styles.pill, active && styles.pillOn]}
                  onPress={() => { void saveResetMode(mode.id as 'daily' | 'manual' | 'never'); }}
                >
                  <Text style={[styles.pillText, active && styles.pillTextOn]}>{mode.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {orderResetMode === 'daily' ? (
            <View>
              <Text style={styles.label}>Orario di azzeramento automatico (HH:MM)</Text>
              <TextInput
                style={styles.input}
                value={resetTime}
                onChangeText={setResetTime}
                onEndEditing={() => { void saveResetMode('daily', resetTime); }}
                placeholder="06:00"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>
          ) : null}
          <Text style={styles.hint}>
            {orderResetMode === 'daily'
              ? `Reset automatico alle ${resetTime || '06:00'}.`
              : orderResetMode === 'manual'
                ? 'Il contatore si azzera solo quando premi Azzera ora.'
                : 'I numeri ordine non si azzerano mai da soli.'}
            {lastResetAt ? ` Ultimo reset: ${lastResetAt}` : ''}
          </Text>
          <TouchableOpacity style={styles.danger} onPress={handleResetOrders} disabled={resetting}>
            {resetting ? <ActivityIndicator color="#fff" /> : <Text style={styles.dangerText}>Azzera ora</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 8,
  },
  emoji: { fontSize: 20 },
  title: { fontSize: 18, fontWeight: '800', color: '#0F172A', flexShrink: 1 },
  sub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  iconBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 14, gap: 12, paddingBottom: 40 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', flexShrink: 1 },
  numStage: { backgroundColor: '#0F172A', borderRadius: 20, paddingVertical: 22, paddingHorizontal: 16, alignItems: 'center', marginBottom: 14, overflow: 'hidden' },
  numLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  digitRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', width: '100%', maxWidth: 280, marginTop: 10 },
  digitBox: {
    flexGrow: 1,
    flexBasis: 0,
    maxWidth: 92,
    minHeight: 92,
    borderRadius: 16,
    backgroundColor: '#111827',
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  digitBoxCompact: { minHeight: 72, maxWidth: 72 },
  digitChar: { color: '#FFF', fontSize: 64, fontWeight: '900', lineHeight: 70, includeFontPadding: false },
  digitCharCompact: { fontSize: 48, lineHeight: 54 },
  numHint: { color: '#94A3B8', fontSize: 11, marginTop: 10, textAlign: 'center' },
  actionsCol: { gap: 10 },
  btnRow: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  btnPrev: { backgroundColor: '#334155' },
  btnNext: { backgroundColor: '#FF6B6B' },
  btnLight: { color: '#F8FAFC', fontWeight: '800' },
  btnWhite: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  manualRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, minWidth: 80, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 10, height: 46, backgroundColor: '#F8FAFC' },
  manualBtn: { backgroundColor: '#1E293B', borderRadius: 10, paddingHorizontal: 14, height: 46, justifyContent: 'center' },
  manualBtnText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
  resetBtn: { borderWidth: 1, borderColor: '#FECACA', borderRadius: 10, paddingHorizontal: 12, height: 46, justifyContent: 'center' },
  resetText: { color: '#EF4444', fontWeight: '800', fontSize: 12 },
  hint: { fontSize: 12, color: '#64748B', marginBottom: 8 },
  warn: { fontSize: 12, color: '#B45309', backgroundColor: '#FFFBEB', borderRadius: 10, padding: 10, marginBottom: 8, overflow: 'hidden' },
  url: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, color: '#2563EB', marginBottom: 10 },
  wrapRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  ghost: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  ghostText: { fontWeight: '700', color: '#1E293B', fontSize: 12 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  pill: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  pillOn: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  pillText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  pillTextOn: { color: '#FFF' },
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6 },
  danger: { marginTop: 10, backgroundColor: '#EF4444', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  dangerText: { color: '#FFF', fontWeight: '800' },
  sectionSubtitle: { fontSize: 13, fontWeight: '800', color: '#1E293B', marginTop: 14, marginBottom: 8 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingLabel: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  settingSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
});
