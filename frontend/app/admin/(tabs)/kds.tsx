import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
  Switch,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Network from 'expo-network';
import {
  getSettings,
  updateSettings,
  getCategories,
  getRemoteAdminUrl,
  upsertDepartmentKds,
  deleteDepartmentKds,
  createOrder,
  Category,
  DepartmentKDS,
} from '@/src/api/api';
import { getWifiIpv4Address } from '@/modules/kiosk-mode/src';
import { getLicenseInfo, isMultiLicense, LicenseInfo } from '@/src/utils/license';
import { Text, TextInput, InfoTip } from '@/src/components/LocalizedPrimitives';
import AdminHeader from '@/src/components/AdminHeader';
import { getFastLocalIp } from '@/src/utils/lanScanner';

function isUsableLanIpv4(value: string): boolean {
  const ip = (value || '').trim();
  if (!/^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip)) return false;
  const octets = ip.split('.').map(Number);
  if (octets.some((part) => part < 0 || part > 255)) return false;
  if (ip === '0.0.0.0' || ip === '127.0.0.1' || ip.startsWith('169.254.')) return false;
  return true;
}

export default function KdsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<DepartmentKDS[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [localIp, setLocalIp] = useState('');
  const [newName, setNewName] = useState('');
  const [renameDraft, setRenameDraft] = useState<Record<string, string>>({});
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [kitchenDisplayEnabled, setKitchenDisplayEnabled] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [isSavingKds, setIsSavingKds] = useState(false);

  const unlimited = isMultiLicense(license);
  const maxKds = unlimited ? 99 : 5;
  const host = localIp || 'IP_TABLET';
  const mainKitchenUrl = `http://${host}:3000/kitchen/`;

  const load = useCallback(async () => {
    try {
      const [settings, cats, fastIp, lic] = await Promise.all([
        getSettings(),
        getCategories().catch(() => [] as Category[]),
        getFastLocalIp(1200),
        getLicenseInfo().catch(() => null),
      ]);
      setDepartments(settings.department_kds || []);
      setCategories(cats || []);
      setLicense(lic);
      setKitchenDisplayEnabled(settings.kitchen_display_enabled !== false);
      const drafts: Record<string, string> = {};
      (settings.department_kds || []).forEach((d) => { drafts[d.id] = d.name; });
      setRenameDraft(drafts);
      const saved = (settings.remote_ip_override || '').trim();
      const ipVal = isUsableLanIpv4(saved) ? saved : fastIp;
      setLocalIp(ipVal || '127.0.0.1');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const kdsUrl = (dept: DepartmentKDS) => {
    const catsParam = (dept.assigned_category_ids || []).join(',');
    const name = dept.name || 'Cucina';
    return `http://${host}:3000/kitchen/?department=${encodeURIComponent(dept.id)}&name=${encodeURIComponent(name)}&categories=${encodeURIComponent(catsParam)}`;
  };

  const copyUrl = async (url: string) => {
    await Clipboard.setStringAsync(url);
    Alert.alert('Copiato', url);
  };

  const sendTestOrder = async () => {
    try {
      const catId = categories[0]?.id || 'cat_test';
      const order = await createOrder(
        [
          {
            product_id: 'test_kds_item_1',
            product_name: '🍕 Pizza Margherita (Test KDS)',
            quantity: 1,
            unit_price: 6.5,
            subtotal: 6.5,
            category_id: catId,
            product_category_id: catId,
            notes: 'Ben cotta (comanda test KDS)',
          },
        ],
        'dine-in',
        'kds_test',
        6.5
      );
      Alert.alert(
        '✅ Comanda Test Creata!',
        `La comanda #${order.order_number} è stata inviata con successo. Dovrebbe apparire immediatamente sul KDS in cucina con segnale acustico.`,
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      Alert.alert('Errore Invio Test', err?.message || 'Impossibile inviare comanda di prova.');
    }
  };

  const addDepartment = async () => {
    const nameTrimmed = newName.trim();
    if (!nameTrimmed) {
      Alert.alert('Nome Obbligatorio', 'Inserisci un nome per il nuovo reparto KDS (es. Pizzeria, Bar, Friggitrice, Grill).');
      return;
    }
    if (departments.length >= maxKds) {
      Alert.alert(
        'Limite KDS Raggiunto',
        `Hai raggiunto il numero massimo di ${maxKds} monitor KDS per la configurazione attuale. Passa a Totem Multi per KDS illimitati.`,
        [
          { text: 'Chiudi', style: 'cancel' },
          { text: 'Vedi Licenza', onPress: () => router.push('/admin/license') },
        ]
      );
      return;
    }
    try {
      setIsSavingKds(true);
      const saved = await upsertDepartmentKds({ name: nameTrimmed, assigned_category_ids: [] });
      setDepartments((list) => {
        const existingIdx = list.findIndex((x) => x.id === saved.id);
        if (existingIdx >= 0) {
          const next = [...list];
          next[existingIdx] = saved;
          return next;
        }
        return [...list, saved];
      });
      setRenameDraft((d) => ({ ...d, [saved.id]: saved.name }));
      setNewName('');
      Alert.alert('✅ KDS Creato', `Reparto "${saved.name}" creato con successo! Ora seleziona le categorie desiderate o apri l'URL sulla TV o tablet.`);
    } catch (e: any) {
      Alert.alert('Errore Creazione KDS', e?.message || 'Impossibile salvare il nuovo reparto KDS.');
    } finally {
      setIsSavingKds(false);
    }
  };

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator color="#FF6B6B" /></View>;
  }

  return (
    <View style={styles.container}>
      <AdminHeader
        title="Monitor Cucina KDS"
        subtitle="Kitchen Display System e reparti comande LAN"
        emoji="📺"
        showBack={true}
        showTotemButton={true}
        badge={{
          text: unlimited ? 'Totem Multi (99 KDS)' : 'Totem Mono (1 KDS)',
          variant: unlimited ? 'success' : 'primary',
        }}
      />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Guida Rapida a Scomparsa KDS LAN */}
        <View style={styles.guideCard}>
          <TouchableOpacity
            style={styles.guideToggleHeader}
            onPress={() => setShowGuide(!showGuide)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={styles.guideIconBadge}>
                <Ionicons name="information-circle" size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.guideTitle}>Come funziona il Monitor Cucina KDS LAN</Text>
                <Text style={styles.guideSubtitle}>
                  {showGuide ? 'Tocca per chiudere la guida' : 'Tocca qui per scoprire come collegare monitor e visualizzare le comande'}
                </Text>
              </View>
            </View>
            <Ionicons
              name={showGuide ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#64748B"
            />
          </TouchableOpacity>

          {showGuide && (
            <View style={styles.guideBody}>
              <View style={styles.guideStep}>
                <View style={[styles.stepNum, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="tv-outline" size={16} color="#2563EB" />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.stepTitle}>1. Collega Smart TV, Tablet o PC alla stessa rete Wi-Fi</Text>
                  <Text style={styles.stepDesc}>
                    Non serve installare nessuna app sui monitor della cucina: basta aprire il browser (Chrome, Safari, Silk su Fire TV Stick) e digitare l'indirizzo mostrato sotto, oppure inquadrare il QR Code.
                  </Text>
                </View>
              </View>

              <View style={styles.guideStep}>
                <View style={[styles.stepNum, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="restaurant-outline" size={16} color="#D97706" />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.stepTitle}>2. URL Principale vs Reparti Dedicati</Text>
                  <Text style={styles.stepDesc}>
                    • <Text style={{ fontWeight: '700' }}>URL Principale:</Text> Riceve <Text style={{ fontWeight: '700' }}>TUTTE</Text> le comande del ristorante (ideale per pass generale o capo cucina).{'\n'}
                    • <Text style={{ fontWeight: '700' }}>Reparti extra:</Text> Ricevono solo i prodotti delle categorie assegnate (es. solo Pizze per il forno, solo Bibite per il bar). Se non selezioni categorie, il reparto mostra tutte le comande.
                  </Text>
                </View>
              </View>

              <View style={styles.guideStep}>
                <View style={[styles.stepNum, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="sync-outline" size={16} color="#059669" />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.stepTitle}>3. Flusso di Lavorazione Comande & Suono Chime</Text>
                  <Text style={styles.stepDesc}>
                    Le comande entrano all'istante (polling live ogni 3,5 secondi) con un segnale sonoro chime. Il cuoco tocca <Text style={{ fontWeight: '700', color: '#D97706' }}>"Inizia"</Text> (comanda in preparazione), poi <Text style={{ fontWeight: '700', color: '#059669' }}>"Pronto"</Text> (il numero viene chiamato a voce sul Tabellone Clienti), infine <Text style={{ fontWeight: '700', color: '#64748B' }}>"Completa"</Text>.
                  </Text>
                </View>
              </View>

              <View style={styles.guideStep}>
                <View style={[styles.stepNum, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="help-buoy-outline" size={16} color="#DC2626" />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.stepTitle}>4. Non vedi le comande sul KDS? Cosa controllare</Text>
                  <Text style={styles.stepDesc}>
                    • Verifica che entrambi i dispositivi (Totem e TV/Tablet) siano connessi allo stesso router Wi-Fi.{'\n'}
                    • Se hai assegnato categorie al reparto, assicurati che i prodotti ordinati appartengano a quelle categorie.{'\n'}
                    • Usa il pulsante <Text style={{ fontWeight: '700' }}>"Invia Comanda Test"</Text> qui sotto per fare una prova istantanea!
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.guideTestBtn}
                onPress={() => { void sendTestOrder(); }}
                activeOpacity={0.8}
              >
                <Ionicons name="flash-outline" size={16} color="#FFF" />
                <Text style={styles.guideTestBtnText}>Invia Comanda di Prova al KDS</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Ionicons name="wifi-outline" size={18} color="#2563EB" />
            <Text style={styles.cardTitle}>URL cucina principale</Text>
            <InfoTip
              title="IP KDS"
              message="Questo indirizzo nasce automaticamente dal Wi-Fi del tablet. Aprilo su un altro tablet o browser in cucina. Non devi creare un reparto: l'URL principale mostra tutte le comande. I reparti extra filtrano per categoria."
            />
          </View>
          {!localIp ? (
            <Text style={styles.warn}>Collega il tablet al Wi-Fi. L'IP appare da solo. Puoi anche impostarlo in Impostazioni → Rete.</Text>
          ) : null}
          <Text style={styles.url} selectable>{mainKitchenUrl}</Text>
          {localIp ? (
            <ExpoImage
              source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(mainKitchenUrl)}` }}
              style={styles.qr}
              contentFit="contain"
            />
          ) : null}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.ghost} onPress={() => { void copyUrl(mainKitchenUrl); }}>
              <Ionicons name="copy-outline" size={14} color="#1E293B" />
              <Text style={styles.ghostText}>Copia URL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghost} onPress={() => Share.share({ message: mainKitchenUrl }).catch(() => {})}>
              <Ionicons name="share-social-outline" size={14} color="#1E293B" />
              <Text style={styles.ghostText}>Condividi</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.rowLabel}>Abilita tab comande cucina</Text>
                <InfoTip
                  title="Tab Comande"
                  message="Se attivo, nel totem compare la tab Comande per gestire gli ordini a video. Il monitor KDS via URL funziona comunque, anche se questa tab è spenta."
                />
              </View>
              <Text style={styles.hint}>Gestione visiva delle comande dal totem</Text>
            </View>
            <Switch
              value={kitchenDisplayEnabled}
              onValueChange={(enabled) => {
                setKitchenDisplayEnabled(enabled);
                void updateSettings({ kitchen_display_enabled: enabled });
              }}
              trackColor={{ false: '#CBD5E1', true: '#FF6B6B' }}
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Ionicons name="grid-outline" size={18} color="#F59E0B" />
            <Text style={styles.cardTitle}>Reparti extra (Pizzeria, Bar, Grill)</Text>
            <InfoTip
              title="Reparti KDS"
              message="Crea un monitor per ogni zona della cucina. Ogni reparto ha un URL proprio e mostra solo le categorie assegnate. Apri l'URL sulla stessa Wi-Fi da tablet o browser."
            />
          </View>
          <Text style={styles.hint}>
            Facoltativo. L'URL principale sopra basta per un solo schermo cucina. I reparti servono se hai più monitor.
          </Text>
          {departments.map((dept) => {
            const url = kdsUrl(dept);
            return (
              <View key={dept.id} style={styles.item}>
                <View style={styles.itemHead}>
                  <TextInput
                    style={styles.rename}
                    value={renameDraft[dept.id] ?? dept.name}
                    onChangeText={(v) => setRenameDraft((d) => ({ ...d, [dept.id]: v }))}
                    onEndEditing={async () => {
                      const name = (renameDraft[dept.id] || '').trim();
                      if (!name) return;
                      const saved = await upsertDepartmentKds({ ...dept, name });
                      setDepartments((list) => list.map((x) => (x.id === saved.id ? saved : x)));
                    }}
                    placeholder="Nome reparto"
                  />
                  <TouchableOpacity onPress={async () => {
                    await deleteDepartmentKds(dept.id);
                    setDepartments((list) => list.filter((x) => x.id !== dept.id));
                  }}>
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.label}>Categorie visibili su questo KDS</Text>
                <View style={styles.pills}>
                  {categories.map((cat) => {
                    const on = (dept.assigned_category_ids || []).includes(cat.id);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.pill, on && styles.pillOn]}
                        onPress={async () => {
                          const nextIds = on
                            ? (dept.assigned_category_ids || []).filter((id) => id !== cat.id)
                            : [...(dept.assigned_category_ids || []), cat.id];
                          const saved = await upsertDepartmentKds({ ...dept, assigned_category_ids: nextIds });
                          setDepartments((list) => list.map((x) => (x.id === saved.id ? saved : x)));
                        }}
                      >
                        <Text style={[styles.pillText, on && styles.pillTextOn]}>{cat.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.url}>{url}</Text>
                {localIp ? (
                  <ExpoImage
                    source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}` }}
                    style={styles.qr}
                    contentFit="contain"
                  />
                ) : null}
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.ghost} onPress={() => { void copyUrl(url); }}>
                    <Ionicons name="copy-outline" size={14} color="#1E293B" />
                    <Text style={styles.ghostText}>Copia URL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.ghost} onPress={() => Share.share({ message: url }).catch(() => {})}>
                    <Ionicons name="share-social-outline" size={14} color="#1E293B" />
                    <Text style={styles.ghostText}>Condividi</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
          <Text style={styles.label}>Nuovo reparto KDS</Text>
          <View style={styles.addRow}>
            <TextInput style={[styles.input, { flex: 1 }]} value={newName} onChangeText={setNewName} placeholder="Es. Pizzeria, Bar, Grill" />
            <TouchableOpacity
              style={[styles.primary, isSavingKds && { opacity: 0.6 }]}
              disabled={isSavingKds}
              onPress={() => { void addDepartment(); }}
            >
              {isSavingKds ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.primaryText}>Crea KDS</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  sub: { fontSize: 12, color: '#64748B' },
  scroll: { padding: 14, gap: 12, paddingBottom: 40 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 10 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', flexShrink: 1 },
  hint: { fontSize: 12, color: '#64748B', lineHeight: 18 },
  warn: { fontSize: 12, color: '#B45309', backgroundColor: '#FFFBEB', borderRadius: 10, padding: 10, overflow: 'hidden' },
  item: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, gap: 8 },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rename: { flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 10, height: 40, fontWeight: '700', color: '#0F172A' },
  label: { fontSize: 12, fontWeight: '700', color: '#334155' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  pillOn: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  pillText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  pillTextOn: { color: '#FFF' },
  url: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, color: '#2563EB' },
  qr: { width: 120, height: 120, alignSelf: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ghost: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  ghostText: { fontWeight: '700', color: '#1E293B', fontSize: 12 },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 10, height: 42, backgroundColor: '#F8FAFC' },
  primary: { backgroundColor: '#F59E0B', borderRadius: 10, paddingHorizontal: 14, height: 42, justifyContent: 'center', alignItems: 'center', minWidth: 90 },
  primaryText: { color: '#FFF', fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  rowLabel: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  guideCard: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#DBEAFE', overflow: 'hidden' },
  guideToggleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#F8FAFC' },
  guideIconBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  guideTitle: { fontSize: 14, fontWeight: '800', color: '#1E3A8A' },
  guideSubtitle: { fontSize: 11, color: '#64748B', marginTop: 1 },
  guideBody: { padding: 14, gap: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  guideStep: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  stepNum: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  stepTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  stepDesc: { fontSize: 12, color: '#475569', lineHeight: 17 },
  guideTestBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2563EB', paddingVertical: 10, borderRadius: 10, marginTop: 4 },
  guideTestBtnText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
});
