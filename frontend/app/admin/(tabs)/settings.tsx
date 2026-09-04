import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Switch,
  Share,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import {
  getSettings,
  updateSettings,
  generateRecoveryCode,
  getRemoteAdminUrl,
  updateAdminCredentialsSafely,
  resetOrderNumber,
  StationTopologyConfig,
  StationRole,
} from '@/src/api/api';
import { exportBackupZip, importBackupZip } from '@/src/utils/backup';
import { exportCredentialRecoveryBackup } from '@/src/utils/credentialBackup';
import { getLicenseInfo, isMultiLicense, LicenseInfo } from '@/src/utils/license';
import LanguageSelector from '@/src/components/LanguageSelector';
import { useI18n } from '@/src/utils/i18n';
import { sanitizeImageUri } from '@/src/utils/imageUtils';
import { Text, TextInput, InfoTip } from '@/src/components/LocalizedPrimitives';
import { useKioskStore } from '@/src/store/kioskStore';
import { getFastLocalIp, autoConfigureTopology, scanSubnetForTotems, DiscoveredStation } from '@/src/utils/lanScanner';
import AdminHeader from '@/src/components/AdminHeader';
import GuideHelper from '@/src/components/GuideHelper';

function isUsableLanIpv4(value: string): boolean {
  const ip = (value || '').trim();
  if (!/^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip)) return false;
  const octets = ip.split('.').map(Number);
  if (octets.some((part) => part < 0 || part > 255)) return false;
  if (ip === '0.0.0.0' || ip === '127.0.0.1' || ip.startsWith('169.254.')) return false;
  return true;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const kioskStore = useKioskStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Category Filtering
  const [activeCategory, setActiveCategory] = useState<'locale' | 'devices' | 'network' | 'kiosk' | 'license' | 'guide' | 'backup'>('locale');

  // General Settings
  const [restaurantName, setRestaurantName] = useState('');
  const [logo, setLogo] = useState('');

  // Reset & Order Numbering
  const [orderResetMode, setOrderResetMode] = useState<'daily' | 'never' | 'manual'>('daily');
  const [resetTime, setResetTime] = useState('06:00');
  const [lastResetAt, setLastResetAt] = useState<string | null>(null);
  const [resettingOrders, setResettingOrders] = useState(false);

  // Network & Remote
  const [localIp, setLocalIp] = useState('192.168.1.9');
  const [manualIp, setManualIp] = useState('');
  const [savingManualIp, setSavingManualIp] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState('');

  // Topology State
  const [topology, setTopology] = useState<StationTopologyConfig>({
    role: 'mono',
    station_id: 'TOTEM-01',
    station_name: 'Totem principale',
    master_server_ip: '',
    master_server_port: 3000,
    auto_discovery: true,
    order_prefix: '',
    sync_interval_sec: 15,
  });

  // License State
  const [license, setLicense] = useState<LicenseInfo | null>(null);

  // Security Credentials
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [credentialSaving, setCredentialSaving] = useState(false);
  const [generatingRecovery, setGeneratingRecovery] = useState(false);
  const [newRecoveryCodeModal, setNewRecoveryCodeModal] = useState<string | null>(null);
  const [savingRecoveryBackup, setSavingRecoveryBackup] = useState(false);

  const [importing, setImporting] = useState(false);

  const [autoScanning, setAutoScanning] = useState(false);
  const [autoScanLogs, setAutoScanLogs] = useState<string[]>([]);
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredStation[]>([]);

  useEffect(() => {
    loadSettingsData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettingsData();
    }, [])
  );

  const loadSettingsData = async () => {
    try {
      setLoading(true);
      const [settings, fastIp, lic] = await Promise.all([
        getSettings(),
        getFastLocalIp(1200),
        getLicenseInfo().catch(() => null),
      ]);

      setRestaurantName(settings.restaurant_name || '');
      setLogo(settings.logo || '');
      setOrderResetMode(settings.order_reset_mode || 'daily');
      setResetTime(settings.reset_time || '06:00');
      setLastResetAt(settings.last_reset_at || null);
      setLicense(lic);

      const savedManualIp = (settings.remote_ip_override || '').trim();
      const ipVal = isUsableLanIpv4(savedManualIp) ? savedManualIp : fastIp;
      setManualIp(savedManualIp);
      setLocalIp(ipVal || '127.0.0.1');
      const effectiveUrl = getRemoteAdminUrl(ipVal || 'localhost');
      setRemoteUrl(effectiveUrl);

      if (settings.station_topology) {
        setTopology({
          role: settings.station_topology.role || 'mono',
          station_id: settings.station_topology.station_id || 'TOTEM-01',
          station_name: settings.station_topology.station_name || 'Totem principale',
          master_server_ip: settings.station_topology.master_server_ip || '',
          master_server_port: settings.station_topology.master_server_port || 3000,
          auto_discovery: settings.station_topology.auto_discovery !== false,
          order_prefix: settings.station_topology.order_prefix || '',
          sync_interval_sec: settings.station_topology.sync_interval_sec || 15,
        });
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoConfigureTopology = async () => {
    try {
      setAutoScanning(true);
      setAutoScanLogs(['Inizio scansione automatica della rete LAN...']);
      const result = await autoConfigureTopology((log) => {
        setAutoScanLogs((prev) => [...prev, log]);
      });
      await loadSettingsData();
      Alert.alert(result.role === 'master' ? '👑 Totem Master Configurato' : '📱 Totem Satellite Agganciato', result.message);
    } catch (e: any) {
      Alert.alert('Errore Scansione', e?.message || 'Impossibile completare la scansione automatica');
    } finally {
      setAutoScanning(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await updateSettings({
        restaurant_name: restaurantName.trim(),
        logo,
        order_reset_mode: orderResetMode,
        reset_time: resetTime,
        station_topology: topology,
      });
      Alert.alert('Successo', 'Impostazioni salvate con successo.');
    } catch (e: any) {
      Alert.alert('Errore', e?.message || 'Impossibile salvare le impostazioni.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetOrdersNow = async () => {
    Alert.alert(
      'Azzera Numerazione Ordini',
      'Vuoi azzerare la numerazione degli ordini al numero #01 e ripulire il tabellone di chiamata della coda clienti?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Azzera Adesso',
          style: 'destructive',
          onPress: async () => {
            try {
              setResettingOrders(true);
              await resetOrderNumber();
              const s = await getSettings();
              setLastResetAt(s.last_reset_at || new Date().toISOString());
              Alert.alert('Completato', 'Numerazione scontrini e tabellone coda azzerati con successo.');
            } catch (e: any) {
              Alert.alert('Errore', e?.message || 'Impossibile azzerare la numerazione.');
            } finally {
              setResettingOrders(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveCredentials = async () => {
    const cleanCurrent = currentPin.trim();
    const cleanNew = newPin.trim();
    const cleanConfirm = confirmNewPin.trim();

    if (!cleanCurrent) {
      Alert.alert('Sicurezza', 'Inserisci il PIN corrente per autorizzare la modifica.');
      return;
    }
    if (!cleanNew) {
      Alert.alert('Info', 'Inserisci il nuovo PIN a 6 cifre.');
      return;
    }
    if (cleanNew.length !== 6 || !/^\d{6}$/.test(cleanNew)) {
      Alert.alert('Errore PIN', 'Il nuovo PIN deve essere composto esattamente da 6 cifre numeriche.');
      return;
    }
    if (cleanNew !== cleanConfirm) {
      Alert.alert('Errore PIN', 'I due nuovi PIN inseriti non coincidono.');
      return;
    }

    try {
      setCredentialSaving(true);
      await updateAdminCredentialsSafely(cleanCurrent, { pin: cleanNew });
      Alert.alert('Successo', 'PIN a 6 cifre aggiornato con successo.');
      setCurrentPin('');
      setNewPin('');
      setConfirmNewPin('');
      loadSettingsData();
    } catch (e: any) {
      Alert.alert('Errore', e?.message || 'Impossibile aggiornare il PIN.');
    } finally {
      setCredentialSaving(false);
    }
  };

  const handlePickLogo = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        if (asset.base64) {
          setLogo(`data:image/jpeg;base64,${asset.base64}`);
        } else if (asset.uri) {
          setLogo(asset.uri);
        }
      }
    } catch (e) {
      Alert.alert('Errore', 'Impossibile selezionare il logo');
    }
  };

  const handleExportBackup = async () => {
    try {
      const res = await exportBackupZip();
      if (res.success) {
        Alert.alert('Backup Esportato', 'Archivio ZIP del ristorante esportato con successo.');
      }
    } catch (e: any) {
      Alert.alert('Errore Backup', e?.message || 'Impossibile creare il backup');
    }
  };

  const handleImportBackup = async () => {
    Alert.alert(
      'Importa Backup ZIP',
      'Il ripristino sostituirà categorie, prodotti e immagini correnti. Vuoi continuare?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Seleziona File ZIP',
          onPress: async () => {
            try {
              setImporting(true);
              const res = await importBackupZip();
              if (res.success) {
                Alert.alert('Ripristino Completato', 'Il catalogo e le impostazioni sono stati ripristinati.');
                loadSettingsData();
              }
            } catch (e: any) {
              Alert.alert('Errore Importazione', e?.message || 'File ZIP non valido.');
            } finally {
              setImporting(false);
            }
          },
        },
      ]
    );
  };

  const handleCopyUrl = async () => {
    await Clipboard.setStringAsync(remoteUrl);
    Alert.alert('Link Copiato', 'Indirizzo pannello remoto copiato negli appunti.');
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(remoteUrl || 'http://127.0.0.1:3000')}`;
  const unlimited = isMultiLicense(license);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Caricamento impostazioni...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdminHeader
        title="Impostazioni Totem"
        subtitle="Configurazione generale, dispositivi, licenza e manuale operativo"
        emoji="⚙️"
        showBack={false}
        showTotemButton={true}
        badge={{
          text: unlimited ? 'Totem Multi Attivo' : 'Totem Mono',
          variant: unlimited ? 'success' : 'primary',
        }}
        rightActions={
          <TouchableOpacity style={styles.headerSaveBtn} onPress={handleSaveSettings} disabled={saving}>
            {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Ionicons name="save-outline" size={16} color="#FFF" />}
            <Text style={styles.headerSaveBtnText}>{saving ? 'Salvataggio...' : 'Salva'}</Text>
          </TouchableOpacity>
        }
      />

      {/* Category Navigation Bar */}
      <View style={styles.categoryBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryBarScroll}>
          {[
            { id: 'locale', label: 'Attività & Logo', icon: 'storefront-outline' },
            { id: 'devices', label: 'Stampe, TV & Coda', icon: 'tv-outline' },
            { id: 'network', label: 'Rete & Multi-Totem', icon: 'wifi-outline' },
            { id: 'kiosk', label: 'Kiosk & Sicurezza', icon: 'shield-checkmark-outline' },
            { id: 'license', label: 'Licenza & Piani', icon: 'key-outline' },
            { id: 'guide', label: 'Guida & Manuale', icon: 'book-outline' },
            { id: 'backup', label: 'Backup Dati', icon: 'cloud-download-outline' },
          ].map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catPill, active && styles.catPillActive]}
                onPress={() => {
                  if (cat.id === 'license') {
                    router.push('/admin/license');
                  } else {
                    setActiveCategory(cat.id as any);
                  }
                }}
              >
                <Ionicons name={cat.icon as any} size={15} color={active ? '#FFFFFF' : '#475569'} />
                <Text style={[styles.catPillText, active && styles.catPillTextActive]}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* SECTION 1: ATTIVITÀ & LINGUA */}
        {activeCategory === 'locale' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="storefront" size={18} color="#FF6B6B" />
              <Text style={styles.cardTitle}>Attività & Lingua Totem</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nome Ristorante / Attività</Text>
              <TextInput
                style={styles.input}
                value={restaurantName}
                onChangeText={setRestaurantName}
                placeholder="Es. Burger Fast Gourmet"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Logo Attività</Text>
              <View style={styles.logoRow}>
                <View style={styles.logoPreviewBox}>
                  {sanitizeImageUri(logo) ? (
                    <ExpoImage
                      source={{ uri: sanitizeImageUri(logo)! }}
                      style={styles.logoImage}
                      contentFit="contain"
                    />
                  ) : (
                    <Text style={{ fontSize: 24 }}>🏪</Text>
                  )}
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={styles.actionBtn} onPress={handlePickLogo}>
                    <Ionicons name="image-outline" size={16} color="#1E293B" />
                    <Text style={styles.actionBtnText}>Scegli Logo</Text>
                  </TouchableOpacity>
                  {logo ? (
                    <TouchableOpacity style={[styles.actionBtn, { borderColor: '#FECACA' }]} onPress={() => setLogo('')}>
                      <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Rimuovi</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Lingua Principale Interfaccia</Text>
              <LanguageSelector />
            </View>
          </View>
        )}

        {/* SECTION 2: STAMPE, TV & CODA */}
        {activeCategory === 'devices' && (
          <View style={{ gap: 12 }}>
            <TouchableOpacity style={styles.hubCard} onPress={() => router.push('/admin/printers')}>
              <View style={[styles.hubIconBadge, { backgroundColor: '#0F766E' }]}>
                <Ionicons name="print" size={24} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.hubTitle}>🖨️ Stampanti Termiche & Editor Scontrino</Text>
                <Text style={styles.hubSubtitle}>
                  Associa stampanti Bluetooth/LAN (58/80mm), personalizza intestazioni, loghi, testi e traduzioni scontrino.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.hubCard} onPress={() => router.push('/admin/signage')}>
              <View style={[styles.hubIconBadge, { backgroundColor: '#7C3AED' }]}>
                <Ionicons name="tv" size={24} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={styles.hubTitle}>📺 Digital Signage (Vetrina TV)</Text>
                  <View style={{ backgroundColor: '#EDE9FE', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#6D28D9' }}>COMING SOON</Text>
                  </View>
                </View>
                <Text style={styles.hubSubtitle}>
                  Vetrina multimediale e video in loop (modulo temporaneamente in refactoring).
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.hubCard} onPress={() => router.push('/admin/queue')}>
              <View style={[styles.hubIconBadge, { backgroundColor: '#2563EB' }]}>
                <Ionicons name="megaphone" size={24} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.hubTitle}>📢 Tabellone Coda Clienti (Monitor Ritiro)</Text>
                <Text style={styles.hubSubtitle}>
                  Chiamata vocale/sonora ordini pronti, tabellone da sala per monitor TV, impostazioni numerazione e reset.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>

            {/* Reset & Numerazione Ordini Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="receipt-outline" size={18} color="#D97706" />
                <Text style={styles.cardTitle}>🔢 Numerazione Ricevute & Sincronizzazione Coda</Text>
              </View>
              <Text style={styles.cardDesc}>
                La numerazione progressiva degli ordini viene stampata sugli scontrini cliente e comande cucina. L'azzeramento sincronizza automaticamente anche il tabellone di chiamata della coda.
              </Text>

              <Text style={styles.formLabel}>Modalità di reset automatico</Text>
              <View style={styles.pillSelectorRow}>
                {[
                  { id: 'daily', label: '📅 Giornaliero' },
                  { id: 'manual', label: '🖐️ Solo Manuale' },
                  { id: 'never', label: '♾️ Mai' },
                ].map((item) => {
                  const active = orderResetMode === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.pillBtn, active && styles.pillBtnActive]}
                      onPress={() => setOrderResetMode(item.id as any)}
                    >
                      <Text style={[styles.pillBtnText, active && styles.pillBtnTextActive]}>{item.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {orderResetMode === 'daily' && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Orario reset giornaliero (HH:MM)</Text>
                  <TextInput
                    style={styles.input}
                    value={resetTime}
                    onChangeText={setResetTime}
                    placeholder="06:00"
                  />
                </View>
              )}

              {lastResetAt ? (
                <Text style={styles.metaText}>
                  Ultimo azzeramento eseguito il: {new Date(lastResetAt).toLocaleString('it-IT')}
                </Text>
              ) : null}

              <TouchableOpacity
                style={styles.btnResetOrders}
                onPress={handleResetOrdersNow}
                disabled={resettingOrders}
              >
                {resettingOrders ? (
                  <ActivityIndicator color="#EF4444" size="small" />
                ) : (
                  <>
                    <Ionicons name="refresh-circle" size={20} color="#EF4444" />
                    <Text style={styles.btnResetOrdersText}>Azzera Adesso Numerazione Ordini & Tabellone Coda</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* SECTION 3: RETE & MULTI-TOTEM */}
        {activeCategory === 'network' && (
          <View style={{ gap: 12 }}>
            <View style={styles.networkStatusCard}>
              <View style={styles.networkStatusHead}>
                <View style={styles.networkPulseDot} />
                <Text style={styles.networkStatusHeadTitle}>Rete Wi-Fi Locale Attiva</Text>
              </View>
              <Text style={styles.networkStatusIp}>IP Totem: {localIp || 'Non rilevato'}</Text>
              <Text style={styles.networkStatusHint}>
                Tutti i dispositivi (smartphone, TV, KDS e altri totem) devono essere connessi alla stessa rete Wi-Fi del locale.
              </Text>

              <TouchableOpacity
                style={[styles.btnAutoDiscover, autoScanning && { opacity: 0.8 }]}
                onPress={handleAutoConfigureTopology}
                disabled={autoScanning}
              >
                {autoScanning ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                )}
                <Text style={styles.btnAutoDiscoverText}>
                  {autoScanning ? 'Scansione & Rilevamento in corso...' : '⚡ Ricerca Automatica & Aggancio Totem'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="git-network" size={18} color="#7C3AED" />
                <Text style={styles.cardTitle}>Configurazione Totem & Ruolo LAN</Text>
              </View>

              <View style={styles.roleCardsCol}>
                <TouchableOpacity
                  style={[styles.roleSelectCard, topology.role === 'master' && styles.roleSelectCardActive]}
                  onPress={() => {
                    const isMulti = Boolean(license?.features?.multiTotem);
                    if (license?.status === 'expired') {
                      Alert.alert('Licenza Scaduta', 'Acquista un abbonamento per continuare ad usare i servizi.');
                      return;
                    }
                    if (license?.status !== 'trial' && !isMulti) {
                      Alert.alert('Non Supportato', 'La modalità Master/Satellite richiede un abbonamento Multi-Totem.');
                      return;
                    }
                    setTopology({ ...topology, role: 'master' });
                  }}
                >
                  <View style={[styles.roleSelectIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={{ fontSize: 24 }}>👑</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roleSelectTitle}>Totem Principale (Master)</Text>
                    <Text style={styles.roleSelectDesc}>
                      Questo tablet è il "Cervello": gestisce la cassa, il database e distribuisce gli ordini a tutti gli altri totem.
                    </Text>
                  </View>
                  {topology.role === 'master' && <Ionicons name="checkmark-circle" size={22} color="#10B981" />}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleSelectCard, topology.role === 'satellite' && styles.roleSelectCardActive]}
                  onPress={() => {
                    const isMulti = Boolean(license?.features?.multiTotem);
                    if (license?.status === 'expired') {
                      Alert.alert('Licenza Scaduta', 'Acquista un abbonamento per continuare ad usare i servizi.');
                      return;
                    }
                    if (license?.status !== 'trial' && !isMulti) {
                      Alert.alert('Non Supportato', 'La modalità Master/Satellite richiede un abbonamento Multi-Totem.');
                      return;
                    }
                    setTopology({ ...topology, role: 'satellite' });
                  }}
                >
                  <View style={[styles.roleSelectIcon, { backgroundColor: '#EFF6FF' }]}>
                    <Text style={{ fontSize: 24 }}>📱</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roleSelectTitle}>Totem Secondario (Satellite)</Text>
                    <Text style={styles.roleSelectDesc}>
                      Totem cliente aggiuntivo. Si collega automaticamente al Totem Principale per sincronizzare menu e comande.
                    </Text>
                  </View>
                  {topology.role === 'satellite' && <Ionicons name="checkmark-circle" size={22} color="#10B981" />}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleSelectCard, topology.role === 'mono' && styles.roleSelectCardActive]}
                  onPress={() => setTopology({ ...topology, role: 'mono' })}
                >
                  <View style={[styles.roleSelectIcon, { backgroundColor: '#F1F5F9' }]}>
                    <Text style={{ fontSize: 24 }}>🎯</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roleSelectTitle}>Totem Singolo (Stand-Alone)</Text>
                    <Text style={styles.roleSelectDesc}>
                      Hai un solo totem nel locale. Tutto funziona autonomamente senza bisogno di configurazioni di rete.
                    </Text>
                  </View>
                  {topology.role === 'mono' && <Ionicons name="checkmark-circle" size={22} color="#10B981" />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Remote Admin Access Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="phone-portrait-outline" size={18} color="#2563EB" />
                <Text style={styles.cardTitle}>Accesso da Smartphone & PC</Text>
              </View>

              <View style={styles.qrSection}>
                <View style={styles.qrCodeWrapper}>
                  <ExpoImage source={{ uri: qrImageUrl }} style={styles.qrImage} contentFit="contain" />
                </View>
                <View style={styles.qrInfoCol}>
                  <Text style={styles.qrInstructionTitle}>Come accedere da smartphone:</Text>
                  <Text style={styles.qrInstructionText}>1. Connetti lo smartphone al Wi-Fi del locale.</Text>
                  <Text style={styles.qrInstructionText}>2. Inquadra il codice QR con la fotocamera.</Text>
                  <Text style={styles.qrInstructionText}>3. Accedi all'amministrazione in mobilità.</Text>
                </View>
              </View>

              <View style={styles.urlBox}>
                <Text style={styles.urlText} numberOfLines={1}>{remoteUrl}</Text>
                <TouchableOpacity style={styles.urlCopyBtn} onPress={handleCopyUrl}>
                  <Ionicons name="copy-outline" size={14} color="#2563EB" />
                  <Text style={styles.urlCopyText}>Copia</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* SECTION 4: KIOSK & SICUREZZA */}
        {activeCategory === 'kiosk' && (
          <View style={{ gap: 12 }}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="lock-closed" size={18} color="#FF6B6B" />
                <Text style={styles.cardTitle}>Modalità Kiosk & Blocco Schermo</Text>
              </View>

              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Blocco Schermo Kiosk Totem</Text>
                  <Text style={styles.settingSub}>Impedisce ai clienti di uscire dall'applicazione</Text>
                </View>
                <Switch
                  value={Boolean(kioskStore.config?.kioskEnabled)}
                  onValueChange={(v) => { void kioskStore.updateConfig({ kioskEnabled: v, immersiveFullscreen: v }); }}
                  trackColor={{ false: '#CBD5E1', true: '#FF6B6B' }}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Schermo Sempre Acceso</Text>
                  <Text style={styles.settingSub}>Evita che il tablet entri in standby durante il servizio</Text>
                </View>
                <Switch
                  value={Boolean(kioskStore.config?.keepScreenAwake)}
                  onValueChange={(v) => { void kioskStore.updateConfig({ keepScreenAwake: v }); }}
                  trackColor={{ false: '#CBD5E1', true: '#FF6B6B' }}
                />
              </View>
            </View>

            {/* PIN Security */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="shield-checkmark" size={18} color="#EF4444" />
                <Text style={styles.cardTitle}>Modifica PIN Amministratore (6 Cifre)</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>PIN Corrente</Text>
                <TextInput
                  style={styles.input}
                  value={currentPin}
                  onChangeText={(t) => setCurrentPin(t.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="numeric"
                  secureTextEntry
                  placeholder="Inserisci PIN attuale..."
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Nuovo PIN (6 Cifre)</Text>
                  <TextInput
                    style={styles.input}
                    value={newPin}
                    onChangeText={(t) => setNewPin(t.replace(/\D/g, '').slice(0, 6))}
                    keyboardType="numeric"
                    secureTextEntry
                    placeholder="6 cifre..."
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Conferma Nuovo PIN</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmNewPin}
                    onChangeText={(t) => setConfirmNewPin(t.replace(/\D/g, '').slice(0, 6))}
                    keyboardType="numeric"
                    secureTextEntry
                    placeholder="Ripeti 6 cifre..."
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.saveCredsBtn} onPress={handleSaveCredentials} disabled={credentialSaving}>
                {credentialSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveCredsBtnText}>Aggiorna PIN di Sicurezza</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}



        {/* SECTION 6: GUIDA & MANUALE OPERATIVO */}
        {activeCategory === 'guide' && (
          <View style={{ gap: 12 }}>
            <GuideHelper />
          </View>
        )}

        {/* SECTION 7: BACKUP DATI */}
        {activeCategory === 'backup' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="cloud-download-outline" size={18} color="#065F46" />
              <Text style={styles.cardTitle}>Salvataggio & Ripristino Archivio Locale</Text>
            </View>
            <Text style={styles.settingSub}>
              Esporta o ripristina un archivio ZIP completo contenente: Categorie, Piatti, Foto, Varianti, Ingredienti e Configurazioni.
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity style={styles.backupBtn} onPress={handleExportBackup}>
                <Ionicons name="download-outline" size={18} color="#1E293B" />
                <Text style={styles.backupBtnText}>Esporta Backup ZIP</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.backupBtn} onPress={handleImportBackup} disabled={importing}>
                {importing ? <ActivityIndicator color="#1E293B" size="small" /> : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={18} color="#1E293B" />
                    <Text style={styles.backupBtnText}>Importa Backup ZIP</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748B', fontWeight: '600' },
  headerSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F766E',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  headerSaveBtnText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  categoryBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
  },
  categoryBarScroll: { paddingHorizontal: 16, gap: 8 },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  catPillActive: { backgroundColor: '#0F172A' },
  catPillText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  catPillTextActive: { color: '#FFFFFF' },
  content: { flex: 1 },
  scrollContent: { padding: 14, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  cardDesc: { fontSize: 12, color: '#64748B', lineHeight: 16 },
  hubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  hubIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  hubSubtitle: { fontSize: 11, color: '#64748B', marginTop: 2, lineHeight: 15 },
  networkStatusCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  networkStatusHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  networkPulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A' },
  networkStatusHeadTitle: { fontSize: 13, fontWeight: '800', color: '#166534' },
  networkStatusIp: { fontSize: 14, fontWeight: '900', color: '#15803D' },
  networkStatusHint: { fontSize: 11, color: '#166534', marginTop: 2 },
  btnAutoDiscover: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  btnAutoDiscoverText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  roleCardsCol: { gap: 8, marginVertical: 6 },
  roleSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
    gap: 12,
  },
  roleSelectCardActive: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  roleSelectIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleSelectTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  roleSelectDesc: { fontSize: 11, color: '#64748B', marginTop: 2, lineHeight: 15 },
  qrSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  qrCodeWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  qrImage: { width: 90, height: 90 },
  qrInfoCol: { flex: 1, gap: 4 },
  qrInstructionTitle: { fontSize: 12, fontWeight: '800', color: '#1E293B' },
  qrInstructionText: { fontSize: 11, color: '#64748B' },
  urlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  urlText: { fontSize: 11, color: '#475569', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', flex: 1 },
  urlCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
  },
  urlCopyText: { color: '#2563EB', fontWeight: '700', fontSize: 11 },
  formGroup: { width: '100%' },
  formLabel: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 4 },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoPreviewBox: {
    width: 54,
    height: 54,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: { width: '100%', height: '100%' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  pillSelectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillBtnActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  pillBtnText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  pillBtnTextActive: { color: '#FFFFFF' },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  settingLabel: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  settingSub: { fontSize: 11, color: '#64748B' },
  formRow: { flexDirection: 'row', gap: 8 },
  saveCredsBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  saveCredsBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  backupBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  backupBtnText: { fontSize: 12, fontWeight: '800', color: '#1E293B' },
  btnResetOrders: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  btnResetOrdersText: { color: '#EF4444', fontWeight: '800', fontSize: 12 },
  metaText: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic' },
  licenseBannerBox: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  licensePlanTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F766E',
  },
  licensePlanDesc: {
    fontSize: 12,
    color: '#134E4A',
    lineHeight: 16,
  },
  licenseStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  licenseStatusBadgeMulti: {
    backgroundColor: '#D1FAE5',
  },
  licenseStatusBadgeMono: {
    backgroundColor: '#E2E8F0',
  },
  licenseStatusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
  },
  licenseOpenFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F766E',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  licenseOpenFullBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
