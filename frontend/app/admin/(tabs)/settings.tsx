import React, { useEffect, useState } from 'react';
import { View, Text as NativeText, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput as NativeTextInput, Alert, Image, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSettings, updateSettings, resetOrderNumber, getAdminPin, setAdminPin, getAdminCredentials, changeRemoteCredentials, getRemoteAdminUrl } from '@/src/api/api';
import * as ImagePicker from 'expo-image-picker';
import { exportBackupZip, importBackupZip } from '@/src/utils/backup';
import { storage } from '@/src/utils/storage';
import { scanPrinters, getPairedPrinters, PairedPrinter } from '@/src/utils/printer';
import * as Network from 'expo-network';
import LanguageSelector from '@/src/components/LanguageSelector';
import { SupportedLanguage, useI18n } from '@/src/utils/i18n';

import { Text, TextInput } from '@/src/components/LocalizedPrimitives';
function deviceIdentifier(device: PairedPrinter): string {
  const addr = (device.address || '').trim();
  if (addr) return addr;
  return (device.id || device.name || '').trim();
}

export default function SettingsScreen() {
  const router = useRouter();
  const { t, setLanguage } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [restaurantName, setRestaurantName] = useState('');
  const [customBackendUrl, setCustomBackendUrl] = useState('');
  const [logo, setLogo] = useState('');
  const [autoPrintCourtesy, setAutoPrintCourtesy] = useState(true);
  const [autoPrintKitchen, setAutoPrintKitchen] = useState(true);
  const [kitchenDisplayEnabled, setKitchenDisplayEnabled] = useState(true);
  const [orderResetMode, setOrderResetMode] = useState<'daily' | 'never' | 'manual'>('daily');
  const [resetTime, setResetTime] = useState('06:00');
  const [lastResetAt, setLastResetAt] = useState<string | null>(null);
  const [btScanning, setBtScanning] = useState(false);
  const [printerCourtesy, setPrinterCourtesy] = useState('');
  const [printerKitchen, setPrinterKitchen] = useState('');
  const [knownPrinters, setKnownPrinters] = useState<any[]>([]);
  const [newPrinterName, setNewPrinterName] = useState('');
  const [localIp, setLocalIp] = useState('192.168.1.9');
  const [ipDetecting, setIpDetecting] = useState(false);
  const [pairedPrinters, setPairedPrinters] = useState<PairedPrinter[]>([]);
  const [pairedLoading, setPairedLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importing, setImporting] = useState(false);

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [credentialSaving, setCredentialSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const handleExportBackup = async () => {
    try {
      setImporting(true);
      const { size, method } = await exportBackupZip();
      const kb = Math.max(1, Math.round(size / 1024));
      if (method === 'saf') {
        Alert.alert(
          'Backup salvato',
          `File ZIP salvato nella cartella che hai scelto (${kb} KB).\nContiene impostazioni, testi e immagini.\nCopia quel file sull'altro tablet e usa Importa backup ZIP.`
        );
      } else if (method === 'share') {
        Alert.alert(
          'Backup pronto',
          `Usa il menu di condivisione per salvare il ZIP (${kb} KB) su Drive, USB o inviarlo.`
        );
      } else {
        Alert.alert(
          'Backup creato',
          `Il file ZIP è stato creato (${kb} KB), ma su questo dispositivo non c'è un'app per salvarlo/condividerlo.\nRiprova e, quando richiesto, scegli la cartella Download.`
        );
      }
    } catch (e: any) {
      console.error('export backup', e);
      Alert.alert('Errore', 'Impossibile creare il backup: ' + (e?.message || 'errore sconosciuto'));
    } finally {
      setImporting(false);
    }
  };

  const handleImportBackup = async () => {
    try {
      setImporting(true);
      const result = await importBackupZip();
      await loadSettings();
      Alert.alert(
        'Import completato',
        `Ripristinati ${result.categories} categorie e ${result.products} prodotti (con immagini).\nSe qualcosa non si aggiorna, chiudi e riapri l'app.`
      );
    } catch (e: any) {
      if (e?.message === 'CANCELLED') return;
      console.error('import backup', e);
      Alert.alert('Errore', 'Import fallito: ' + (e?.message || 'ZIP non valido'));
    } finally {
      setImporting(false);
    }
  };

  const handleLoadPairedPrinters = async () => {
    setPairedLoading(true);
    setPairedPrinters([]);
    try {
      const devices = await getPairedPrinters();
      setPairedPrinters(devices);
      if (devices.length === 0) {
        Alert.alert(
          'Nessun dispositivo Bluetooth',
          Platform.OS === 'web'
            ? 'Nessun dispositivo in modalita web.'
            : 'Nessun dispositivo trovato. Accendi e abbina la stampante in Impostazioni Android Bluetooth, concedi i permessi, poi aggiorna la lista. Oppure inserisci il MAC manualmente.'
        );
      }
    } catch (e) {
      console.error('Paired printers error:', e);
      Alert.alert('Errore', 'Impossibile recuperare i dispositivi Bluetooth. Controlla i permessi.');
    } finally {
      setPairedLoading(false);
    }
  };

  const addPairedPrinterToKnown = (device: PairedPrinter) => {
    const identifier = deviceIdentifier(device);
    if (!identifier) return;
    if (!knownPrinters.includes(identifier)) {
      setKnownPrinters([...knownPrinters, identifier]);
    }
  };

  const addAllPairedPrinters = () => {
    const toAdd = pairedPrinters.map(deviceIdentifier).filter(Boolean);
    setKnownPrinters(Array.from(new Set([...knownPrinters, ...toAdd])));
  };

  const handleScanPrinters = async () => {
    setBtScanning(true);
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Non disponibile', 'La scansione Bluetooth funziona solo su Android.');
        return;
      }
      const devices = await scanPrinters();
      setPairedPrinters(devices);
      Alert.alert(
        'Scansione completata',
        devices.length > 0
          ? 'Trovati ' + devices.length + ' dispositivi. Aggiungi la stampante all elenco e assegna Scontrino/Cucina.'
          : 'Nessun dispositivo. Abbina prima la stampante nelle impostazioni Bluetooth di sistema, poi riprova.'
      );
    } catch (e) {
      console.error('Scan error:', e);
      Alert.alert('Errore scansione', String(e));
    } finally {
      setBtScanning(false);
    }
  };

  const detectLocalIp = async (manual = false): Promise<string | null> => {
    try {
      if (manual) setIpDetecting(true);
      const ip = await Network.getIpAddressAsync();
      if (ip && ip !== '0.0.0.0' && !ip.startsWith('0.') && ip !== '127.0.0.1' && ip !== 'localhost') {
        setLocalIp(ip);
        await AsyncStorage.setItem('totem_server_ip', ip);
        await AsyncStorage.setItem('totem_local_ip', ip);
        return ip;
      }
    } catch (e) {
      console.warn('IP detect error:', e);
    } finally {
      if (manual) setIpDetecting(false);
    }

    try {
      const saved = (await AsyncStorage.getItem('totem_server_ip')) || (await AsyncStorage.getItem('totem_local_ip'));
      if (saved && saved !== '0.0.0.0' && !saved.startsWith('0.') && saved !== '127.0.0.1') {
        setLocalIp(saved);
        return saved;
      }
    } catch {}

    return null;
  };

  useEffect(() => {
    detectLocalIp();
    const t1 = setTimeout(() => detectLocalIp(), 1500);
    const t2 = setTimeout(() => detectLocalIp(), 4000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setRestaurantName(data.restaurant_name);
      setCustomBackendUrl(data.custom_backend_url || '');
      setLogo(data.logo || '');
      setAutoPrintCourtesy(data.auto_print_courtesy);
      setAutoPrintKitchen(data.auto_print_kitchen);
      setKitchenDisplayEnabled(data.kitchen_display_enabled);

      const savedCourtesy = await AsyncStorage.getItem('totem_printer_address');
      const savedKitchen = await AsyncStorage.getItem('totem_printer_kitchen_address');
      const savedPrinterConfigRaw = await AsyncStorage.getItem('totem_printer_config');
      let savedPrinterConfig: any = null;
      try {
        if (savedPrinterConfigRaw) savedPrinterConfig = JSON.parse(savedPrinterConfigRaw);
      } catch {}

      const courtesyTarget = data.printer_courtesy || savedCourtesy || savedPrinterConfig?.printer_courtesy || '';
      const kitchenTarget = data.printer_kitchen || savedKitchen || savedPrinterConfig?.printer_kitchen || '';

      setPrinterCourtesy(courtesyTarget);
      setPrinterKitchen(kitchenTarget);

      const baseKnown = (data.known_printers || []).map((p: any) =>
        typeof p === 'string' ? p : (p.address || p.name || p.id || p)
      ).filter(Boolean);
      const extraKnown = (savedPrinterConfig?.known_printers || []).filter(Boolean);
      const combinedKnown = Array.from(new Set([...baseKnown, ...extraKnown, courtesyTarget, kitchenTarget].filter(Boolean)));
      setKnownPrinters(combinedKnown);

      const liveIp = await Network.getIpAddressAsync().catch(() => null);
      if (liveIp && liveIp !== '0.0.0.0' && !liveIp.startsWith('0.') && liveIp !== '127.0.0.1' && liveIp !== 'localhost') {
        setLocalIp(liveIp);
        await AsyncStorage.setItem('totem_server_ip', liveIp);
        await AsyncStorage.setItem('totem_local_ip', liveIp);
      } else {
        const savedIp = (await AsyncStorage.getItem('totem_server_ip')) || (await AsyncStorage.getItem('totem_local_ip'));
        if (savedIp && savedIp !== '0.0.0.0' && !savedIp.startsWith('0.') && savedIp !== '127.0.0.1') {
          setLocalIp(savedIp);
        }
      }
      setOrderResetMode((data.order_reset_mode as any) || 'daily');
      setResetTime(data.reset_time || '06:00');
      setLastResetAt(data.last_reset_at || null);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      const mime = result.assets[0].mimeType || 'image/jpeg';
      setLogo('data:' + mime + ';base64,' + result.assets[0].base64);
    }
  };

  const handleRemoveLogo = () => setLogo('');

  const handleLanguageChange = async (language: SupportedLanguage) => {
    await setLanguage(language);
    await updateSettings({ language });
  };

  const handleSave = async () => {
    if (!restaurantName.trim()) {
      Alert.alert('Errore', 'Il nome del ristorante non puo essere vuoto');
      return;
    }
    setSaving(true);
    try {
      await updateSettings({
        restaurant_name: restaurantName,
        custom_backend_url: customBackendUrl,
        logo,
        auto_print_courtesy: autoPrintCourtesy,
        auto_print_kitchen: autoPrintKitchen,
        kitchen_display_enabled: kitchenDisplayEnabled,
        printer_courtesy: printerCourtesy,
        printer_kitchen: printerKitchen,
        known_printers: knownPrinters,
        order_reset_mode: orderResetMode,
        reset_time: resetTime,
        last_reset_at: lastResetAt,
      });

      await AsyncStorage.setItem('totem_printer_address', printerCourtesy || '');
      await AsyncStorage.setItem('totem_printer_kitchen_address', printerKitchen || '');
      await AsyncStorage.setItem('totem_printer_config', JSON.stringify({
        printer_courtesy: printerCourtesy || '',
        printer_kitchen: printerKitchen || '',
        known_printers: knownPrinters,
      }));
      if (localIp && localIp.trim()) {
        await AsyncStorage.setItem('totem_server_ip', localIp.trim());
        await AsyncStorage.setItem('totem_local_ip', localIp.trim());
      }

      Alert.alert('Successo', 'Impostazioni salvate correttamente');
    } catch (error) {
      console.error('Error saving:', error);
      Alert.alert('Errore', 'Impossibile salvare le impostazioni');
    } finally {
      setSaving(false);
    }
  };

  const handleResetOrderNumber = () => setShowResetConfirm(true);

  const confirmResetOrderNumber = async () => {
    setShowResetConfirm(false);
    setResetting(true);
    try {
      const result: any = await resetOrderNumber();
      setLastResetAt(result.reset_at);
      setOrderResetMode('manual');
    } catch (error) {
      console.error('Reset error:', error);
    } finally {
      setResetting(false);
    }
  };

  const formatDateTime = (isoString: string | null): string => {
    if (!isoString) return 'Mai';
    const date = new Date(isoString);
    return date.toLocaleDateString('it-IT') + ' ' + date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

  const handleLogout = async () => {
    await storage.secureRemove('admin_token');
    router.replace('/');
  };

  const handleSaveCredentials = async () => {
    const pinRegex = /^\d{4}$/;
    if (currentPin || newPin || confirmPin) {
      const storedPin = await getAdminPin();
      if (currentPin !== storedPin) {
        Alert.alert('Errore', 'PIN attuale non corretto');
        return;
      }
      if (!pinRegex.test(newPin)) {
        Alert.alert('Errore', 'Il nuovo PIN deve essere di 4 cifre');
        return;
      }
      if (newPin !== confirmPin) {
        Alert.alert('Errore', 'I nuovi PIN non coincidono');
        return;
      }
    }
    if (currentUsername || currentPassword || newUsername || newPassword) {
      const storedCredentials = await getAdminCredentials();
      if (currentUsername !== storedCredentials.username) {
        Alert.alert('Errore', 'Username attuale non corretto');
        return;
      }
      if (currentPassword !== storedCredentials.password) {
        Alert.alert('Errore', 'Password attuale non corretta');
        return;
      }
      if (!newUsername.trim() || !newPassword.trim()) {
        Alert.alert('Errore', 'Username e password nuovi obbligatori');
        return;
      }
    }
    if (!currentPin && !newPin && !confirmPin && !currentUsername && !currentPassword && !newUsername && !newPassword) {
      Alert.alert('Attenzione', 'Compila almeno un campo');
      return;
    }
    setCredentialSaving(true);
    try {
      if (newPin && confirmPin && newPin === confirmPin) await setAdminPin(newPin);
      if (newUsername && newPassword) {
        await changeRemoteCredentials(currentUsername, currentPassword, newUsername, newPassword);
      }
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setCurrentUsername('');
      setCurrentPassword('');
      setNewUsername('');
      setNewPassword('');
      Alert.alert('Successo', 'Credenziali aggiornate');
    } catch (error) {
      console.error(error);
      Alert.alert('Errore', 'Impossibile salvare le credenziali');
    } finally {
      setCredentialSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => router.replace('/')} style={styles.totemBtnHeader}>
            <Ionicons name="storefront" size={18} color="white" />
            <Text style={styles.totemBtnHeaderText}>Totem</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="globe-outline" size={18} color="#FF6B6B" /> {t('settings.language_section')}
          </Text>
          <Text style={styles.label}>{t('settings.select_language')}</Text>
          <LanguageSelector theme="light" onSelect={handleLanguageChange} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="storefront" size={18} color="#FF6B6B" /> Informazioni Ristorante
          </Text>
          <Text style={styles.label}>Nome del Ristorante</Text>
          <TextInput
            testID="restaurant-name-input"
            style={styles.input}
            value={restaurantName}
            onChangeText={setRestaurantName}
            placeholder="Es: PIZZERIA DA MARIO"
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="image" size={18} color="#FF6B6B" /> Logo Ristorante
          </Text>
          {logo ? (
            <View style={styles.logoContainer}>
              <Image source={{ uri: logo }} style={styles.logoPreview} resizeMode="contain" />
              <View style={styles.logoActions}>
                <TouchableOpacity onPress={pickLogo} style={styles.changeLogoBtn}>
                  <Ionicons name="camera" size={20} color="white" />
                  <Text style={styles.changeLogoText}>Cambia</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleRemoveLogo} style={styles.removeLogoBtn}>
                  <Ionicons name="trash" size={20} color="white" />
                  <Text style={styles.changeLogoText}>Rimuovi</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity testID="upload-logo-btn" style={styles.uploadButton} onPress={pickLogo}>
              <Ionicons name="cloud-upload" size={40} color="#FF6B6B" />
              <Text style={styles.uploadText}>Carica Logo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ========== ACCESSO REMOTO BROWSER ========== */}
        <View style={[styles.section, styles.remoteSection]}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="phone-portrait-outline" size={18} color="#FF6B6B" /> Accesso Remoto da Smartphone & PC
          </Text>
          <Text style={styles.remoteText}>
            Gestisci prodotti, categorie, foto, listini e impostazioni dal telefono o PC senza toccare il totem.
          </Text>

          {(!localIp || localIp === '0.0.0.0' || localIp.startsWith('0.') || localIp === 'IP_DEL_TABLET') && (
            <View style={{ backgroundColor: '#FFF3E0', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#FFE0B2' }}>
              <Text style={{ fontSize: 12, color: '#E65100', fontWeight: '500' }}>
                ⚠️ IP Wi-Fi non rilevato automaticamente. Inserisci l'indirizzo IP del tablet (es. 192.168.1.9) nel campo sotto per generare il QR Code corretto.
              </Text>
            </View>
          )}

          {(() => {
            const effectiveIp = (localIp && localIp !== '0.0.0.0' && !localIp.startsWith('0.') && localIp !== 'IP_DEL_TABLET') ? localIp.trim() : '192.168.1.9';
            const effectiveUrl = customBackendUrl ? (customBackendUrl.trim().replace(/\/+$/, '') + '/remote/') : getRemoteAdminUrl(effectiveIp);
            return (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF5F5', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#FFE0E0' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.remoteUrlLabel}>Apri nel browser del telefono o inquadra il QR Code:</Text>
                  <Text selectable style={[styles.remoteUrl, { fontSize: 13, marginTop: 4 }]}>
                    {effectiveUrl}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                    IP Totem: <Text style={{ fontWeight: 'bold', color: '#333' }}>{effectiveIp}</Text>
                  </Text>
                </View>
                <Image 
                  source={{ uri: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent(effectiveUrl) }} 
                  style={{ width: 100, height: 100, borderRadius: 8, marginLeft: 12, backgroundColor: '#FFF' }} 
                />
              </View>
            );
          })()}

          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={styles.label}>Indirizzo IP Totem (Wi-Fi Locale)</Text>
              <TouchableOpacity
                disabled={ipDetecting}
                onPress={async () => {
                  const detected = await detectLocalIp(true);
                  if (detected) {
                    Alert.alert('IP Rilevato', `Indirizzo IP Wi-Fi trovato: ${detected}`);
                  } else {
                    Alert.alert('Info Rilevamento', 'Impossibile rilevare l\'IP in automatico. Inserisci l\'indirizzo IP visibile nelle impostazioni Wi-Fi del tablet (es. 192.168.1.9).');
                  }
                }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#FFEAEA', borderRadius: 6 }}
              >
                {ipDetecting ? (
                  <ActivityIndicator size="small" color="#FF6B6B" style={{ marginRight: 4 }} />
                ) : (
                  <Ionicons name="refresh" size={14} color="#FF6B6B" style={{ marginRight: 4 }} />
                )}
                <Text style={{ fontSize: 12, color: '#FF6B6B', fontWeight: 'bold' }}>Rileva IP</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={localIp}
              onChangeText={(text) => {
                setLocalIp(text);
                const clean = (text || '').trim();
                if (clean && clean !== '0.0.0.0' && !clean.startsWith('0.') && clean !== '127.0.0.1') {
                  AsyncStorage.setItem('totem_local_ip', clean).catch(() => {});
                  AsyncStorage.setItem('totem_server_ip', clean).catch(() => {});
                }
              }}
              placeholder="es. 192.168.1.9"
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>URL Server Personalizzato (Opzionale per Cloud / Dominio)</Text>
            <TextInput
              style={styles.input}
              value={customBackendUrl}
              onChangeText={setCustomBackendUrl}
              placeholder="es. https://miosito.it oppure lascia vuoto per rete locale"
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.remoteHint}>
            1. Telefono e totem connessi alla stessa rete Wi-Fi{'\n'}
            2. Apri l'indirizzo sopra nel browser del telefono o scansiona il QR Code{'\n'}
            3. Effettua l'accesso inserendo il PIN dell'app ({restaurantName || 'Totem'})
          </Text>
          <Text style={[styles.remoteHint, { marginTop: 6, color: '#E65100', fontWeight: '600' }]}>
            Ogni modifica effettuata da remoto si sincronizza automaticamente con il totem.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="print" size={18} color="#FF6B6B" /> Stampa Automatica
          </Text>
          <TouchableOpacity style={styles.toggleRow} onPress={() => setAutoPrintCourtesy(!autoPrintCourtesy)}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Scontrino Cortesia</Text>
            </View>
            <View style={[styles.switch, autoPrintCourtesy && styles.switchActive]}>
              <View style={[styles.switchThumb, autoPrintCourtesy && styles.switchThumbActive]} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toggleRow} onPress={() => setAutoPrintKitchen(!autoPrintKitchen)}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Ticket Cucina</Text>
            </View>
            <View style={[styles.switch, autoPrintKitchen && styles.switchActive]}>
              <View style={[styles.switchThumb, autoPrintKitchen && styles.switchThumbActive]} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="bluetooth" size={18} color="#2196F3" /> Stampanti Bluetooth
          </Text>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#2196F3" />
            <Text style={styles.infoText}>
              Compatibile con MPT, Xprinter, Rongta e altre ESC/POS (Bluetooth Classic e BLE). Mostra tutti i dispositivi Bluetooth paired e vicini: scegli la stampante e assegna Scontrino o Cucina.
            </Text>
          </View>

          {Platform.OS === 'android' && (
            <TouchableOpacity style={styles.btScanBtn} onPress={handleScanPrinters} disabled={btScanning}>
              {btScanning ? <ActivityIndicator color="white" /> : <Ionicons name="search" size={22} color="white" />}
              <Text style={styles.btScanBtnText}>{btScanning ? 'Ricerca...' : 'Cerca dispositivi Bluetooth'}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.btPairedBtn} onPress={handleLoadPairedPrinters} disabled={pairedLoading}>
            {pairedLoading ? <ActivityIndicator color="white" /> : <Ionicons name="refresh" size={22} color="white" />}
            <Text style={styles.btScanBtnText}>{pairedLoading ? 'Caricamento...' : 'Aggiorna lista dispositivi'}</Text>
          </TouchableOpacity>

          <Text style={[styles.subSectionTitle, { marginTop: 16 }]}>Dispositivi trovati ({pairedPrinters.length})</Text>

          {pairedPrinters.length === 0 ? (
            <View style={[styles.infoBox, { backgroundColor: '#F3E5F5', borderColor: '#9C27B0' }]}>
              <Ionicons name="bluetooth-outline" size={20} color="#7B1FA2" />
              <Text style={[styles.infoText, { color: '#4A148C' }]}>
                Premi Cerca o Aggiorna lista. Vedrai cuffie, speaker e stampanti: aggiungi solo la stampante.
              </Text>
            </View>
          ) : (
            <>
              <TouchableOpacity style={styles.btAddAllBtn} onPress={addAllPairedPrinters}>
                <Ionicons name="add-circle-outline" size={20} color="white" />
                <Text style={styles.btAddAllText}>Aggiungi tutti all elenco</Text>
              </TouchableOpacity>
              {pairedPrinters.map((device, idx) => {
                const identifier = deviceIdentifier(device);
                const alreadyAdded = knownPrinters.includes(identifier);
                return (
                  <View key={identifier + '-' + idx} style={styles.pairedPrinterItem}>
                    <View style={styles.pairedPrinterInfo}>
                      <View style={styles.pairedPrinterIcon}>
                        <Ionicons name="print" size={20} color="#2196F3" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pairedPrinterName} numberOfLines={1}>
                          {device.name || '(Senza nome)'}{device.type ? ' · ' + device.type : ''}
                        </Text>
                        <Text style={styles.pairedPrinterAddr} numberOfLines={1}>
                          {device.address}
                        </Text>
                      </View>
                    </View>
                    {alreadyAdded ? (
                      <View style={styles.alreadyAddedChip}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={styles.alreadyAddedText}>Aggiunta</Text>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.addSingleBtn} onPress={() => addPairedPrinterToKnown(device)}>
                        <Ionicons name="add" size={18} color="white" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </>
          )}

          <Text style={[styles.subSectionTitle, { marginTop: 24 }]}>Elenco Stampanti</Text>
          {knownPrinters.length === 0 ? (
            <View style={[styles.infoBox, { backgroundColor: '#FFF3E0', borderColor: '#FF9800' }]}>
              <Ionicons name="warning" size={20} color="#FF9800" />
              <Text style={[styles.infoText, { color: '#E65100' }]}>Nessuna stampante. Aggiungine una dalla lista o inserisci il MAC.</Text>
            </View>
          ) : (
            knownPrinters.map((printer, index) => (
              <View key={index} style={styles.printerItem}>
                <View style={styles.printerInfo}>
                  <Ionicons name="print-outline" size={22} color="#2196F3" />
                  <Text style={styles.printerName}>{printer}</Text>
                </View>
                <View style={styles.printerRoles}>
                  <TouchableOpacity
                    style={[styles.roleChip, printerCourtesy === printer && styles.roleChipActive]}
                    onPress={async () => {
                      const nextVal = printerCourtesy === printer ? '' : printer;
                      setPrinterCourtesy(nextVal);
                      const known = Array.from(new Set((knownPrinters || []).map((p) => typeof p === 'string' ? p : (p && p.address) || (p && p.name) || String(p || '')).filter(Boolean)));
                      await AsyncStorage.setItem('totem_printer_address', nextVal);
                      await AsyncStorage.setItem('totem_printer_kitchen_address', printerKitchen || '');
                      await AsyncStorage.setItem('totem_printer_config', JSON.stringify({
                        printer_courtesy: nextVal,
                        printer_kitchen: printerKitchen || '',
                        known_printers: known,
                      }));
                      try { await updateSettings({ printer_courtesy: nextVal, printer_kitchen: printerKitchen || '', known_printers: known }); } catch (e) { console.warn(e); }
                    }}
                  >
                    <Text style={[styles.roleChipText, printerCourtesy === printer && styles.roleChipTextActive]}>Scontrino</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roleChip, printerKitchen === printer && styles.roleChipActiveKitchen]}
                    onPress={async () => {
                      const nextVal = printerKitchen === printer ? '' : printer;
                      setPrinterKitchen(nextVal);
                      const known = Array.from(new Set((knownPrinters || []).map((p) => typeof p === 'string' ? p : (p && p.address) || (p && p.name) || String(p || '')).filter(Boolean)));
                      await AsyncStorage.setItem('totem_printer_address', printerCourtesy || '');
                      await AsyncStorage.setItem('totem_printer_kitchen_address', nextVal);
                      await AsyncStorage.setItem('totem_printer_config', JSON.stringify({
                        printer_courtesy: printerCourtesy || '',
                        printer_kitchen: nextVal,
                        known_printers: known,
                      }));
                      try { await updateSettings({ printer_courtesy: printerCourtesy || '', printer_kitchen: nextVal, known_printers: known }); } catch (e) { console.warn(e); }
                    }}
                  >
                    <Text style={[styles.roleChipText, printerKitchen === printer && styles.roleChipTextActive]}>Cucina</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.printerRemoveBtn}
                    onPress={async () => {
                      const updated = knownPrinters.filter((_, i) => i !== index);
                      setKnownPrinters(updated);
                      let nextCourtesy = printerCourtesy;
                      let nextKitchen = printerKitchen;
                      if (printerCourtesy === printer) {
                        nextCourtesy = '';
                        setPrinterCourtesy('');
                        await AsyncStorage.setItem('totem_printer_address', '');
                      }
                      if (printerKitchen === printer) {
                        nextKitchen = '';
                        setPrinterKitchen('');
                        await AsyncStorage.setItem('totem_printer_kitchen_address', '');
                      }
                      await AsyncStorage.setItem('totem_printer_config', JSON.stringify({
                        printer_courtesy: nextCourtesy,
                        printer_kitchen: nextKitchen,
                        known_printers: updated,
                      }));
                    }}
                  >
                    <Ionicons name="close-circle" size={22} color="#FF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <View style={styles.addPrinterRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={newPrinterName}
              onChangeText={setNewPrinterName}
              placeholder="MAC es. 00:11:22:33:44:55 o nome"
              placeholderTextColor="#666"
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.addPrinterBtn, !newPrinterName.trim() && { opacity: 0.5 }]}
              disabled={!newPrinterName.trim()}
              onPress={async () => {
                const name = newPrinterName.trim();
                if (name && !knownPrinters.includes(name)) {
                  const next = [...knownPrinters, name];
                  setKnownPrinters(next);
                  setNewPrinterName('');
                  await AsyncStorage.setItem('totem_printer_config', JSON.stringify({
                    printer_courtesy: printerCourtesy || '',
                    printer_kitchen: printerKitchen || '',
                    known_printers: next,
                  }));
                  try { await updateSettings({ printer_courtesy: printerCourtesy || '', printer_kitchen: printerKitchen || '', known_printers: next }); } catch (e) { console.warn(e); }
                }
              }}
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="refresh-circle" size={18} color="#FF6B6B" /> Numero Ordini
          </Text>
          <TouchableOpacity style={[styles.modeOption, orderResetMode === 'daily' && styles.modeOptionActive]} onPress={() => setOrderResetMode('daily')}>
            <Text style={styles.modeTitle}>Giornaliero</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeOption, orderResetMode === 'manual' && styles.modeOptionActive]} onPress={() => setOrderResetMode('manual')}>
            <Text style={styles.modeTitle}>Manuale</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeOption, orderResetMode === 'never' && styles.modeOptionActive]} onPress={() => setOrderResetMode('never')}>
            <Text style={styles.modeTitle}>Mai</Text>
          </TouchableOpacity>
          {orderResetMode === 'daily' && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.label}>Orario reset giornaliero (HH:mm)</Text>
              <TextInput
                style={styles.input}
                value={resetTime}
                onChangeText={setResetTime}
                placeholder="06:00"
                keyboardType="numbers-and-punctuation"
              />
              <Text style={styles.hint}>Es. 06:00 → ogni giorno alle 6:00 il contatore ordini riparte da 1</Text>
            </View>
          )}
          <Text style={styles.hint}>Ultimo reset: {formatDateTime(lastResetAt)}</Text>
          <TouchableOpacity testID="reset-order-number-btn" style={styles.resetButton} onPress={handleResetOrderNumber} disabled={resetting}>
            {resetting ? <ActivityIndicator color="white" /> : <Text style={styles.resetButtonText}>Reset Numero Ora</Text>}
          </TouchableOpacity>
        </View>

        <Modal visible={showResetConfirm} transparent animationType="fade" onRequestClose={() => setShowResetConfirm(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Reset Numerazione e Comande?</Text>
              <Text style={{ fontSize: 14, color: '#DDD', marginBottom: 20, textAlign: 'center', lineHeight: 20 }}>
                Azzerando la numerazione, il prossimo ordine ripartirà da #1 e tutte le comande attuali verranno cancellate dalla schermata cucina.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowResetConfirm(false)}>
                  <Text style={styles.modalCancelText}>Annulla</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmResetOrderNumber}>
                  <Text style={styles.modalConfirmText}>Conferma Reset</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="download-outline" size={18} color="#FF6B6B" /> Backup / Migrazione
          </Text>
          <Text style={styles.hint}>
            Esporta: ti chiede dove salvare il ZIP (scegli Download). Importa: seleziona il file ZIP. Contiene impostazioni, testi e immagini.
          </Text>
          <TouchableOpacity
            style={[styles.resetButton, importing && { opacity: 0.6 }]}
            onPress={handleExportBackup}
            disabled={importing}
          >
            {importing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.resetButtonText}>Esporta backup ZIP</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: '#607D8B', marginTop: 10 }, importing && { opacity: 0.6 }]}
            onPress={handleImportBackup}
            disabled={importing}
          >
            <Text style={styles.resetButtonText}>Importa backup ZIP</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="key" size={18} color="#FF6B6B" /> Credenziali Admin
          </Text>
          <Text style={styles.label}>PIN attuale / nuovo / conferma</Text>
          <TextInput style={styles.input} value={currentPin} onChangeText={setCurrentPin} keyboardType="number-pad" maxLength={4} secureTextEntry placeholder="PIN attuale" />
          <TextInput style={styles.input} value={newPin} onChangeText={setNewPin} keyboardType="number-pad" maxLength={4} secureTextEntry placeholder="Nuovo PIN" />
          <TextInput style={styles.input} value={confirmPin} onChangeText={setConfirmPin} keyboardType="number-pad" maxLength={4} secureTextEntry placeholder="Conferma PIN" />
          <Text style={styles.label}>Username / Password</Text>
          <TextInput style={styles.input} value={currentUsername} onChangeText={setCurrentUsername} autoCapitalize="none" placeholder="Username attuale" />
          <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry placeholder="Password attuale" />
          <TextInput style={styles.input} value={newUsername} onChangeText={setNewUsername} autoCapitalize="none" placeholder="Nuovo username" />
          <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="Nuova password" />
          <TouchableOpacity style={styles.credentialSaveBtn} onPress={handleSaveCredentials} disabled={credentialSaving}>
            {credentialSaving ? <ActivityIndicator color="white" /> : <Text style={styles.credentialSaveBtnText}>Salva Credenziali</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity testID="save-settings-btn" style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Salva Impostazioni</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  desc: { fontSize: 14, color: "#666", marginBottom: 10, lineHeight: 20 },
  inputContainer: { marginBottom: 15 },
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#FF6B6B', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  logoutButton: { padding: 8 },
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
  content: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  section: {
    backgroundColor: 'white', borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 6 },
  input: { backgroundColor: '#F8F9FA', padding: 12, borderRadius: 8, fontSize: 16, borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 8 },
  hint: { fontSize: 12, color: '#999', fontStyle: 'italic', marginTop: 8 },
  logoContainer: { alignItems: 'center', gap: 12 },
  logoPreview: { width: 180, height: 120, borderRadius: 12, borderWidth: 2, borderColor: '#E0E0E0', backgroundColor: '#FAFAFA' },
  logoActions: { flexDirection: 'row', gap: 10 },
  changeLogoBtn: { backgroundColor: '#2196F3', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  removeLogoBtn: { backgroundColor: '#FF4444', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  changeLogoText: { color: 'white', fontWeight: '600', fontSize: 14 },
  uploadButton: { padding: 32, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: '#FF6B6B', borderStyle: 'dashed', backgroundColor: '#FFF5F5' },
  uploadText: { fontSize: 18, fontWeight: 'bold', color: '#FF6B6B', marginTop: 8 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  toggleInfo: { flex: 1, marginRight: 12 },
  toggleTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  switch: { width: 52, height: 30, borderRadius: 15, backgroundColor: '#CCC', padding: 3 },
  switchActive: { backgroundColor: '#4CAF50' },
  switchThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'white' },
  switchThumbActive: { alignSelf: 'flex-end' },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#E3F2FD', padding: 12, borderRadius: 8, marginTop: 12 },
  infoText: { flex: 1, fontSize: 12, color: '#1976D2', lineHeight: 18 },
  saveButton: { backgroundColor: '#4CAF50', padding: 18, borderRadius: 12, alignItems: 'center' },
  saveButtonDisabled: { backgroundColor: '#CCC' },
  saveButtonText: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  modeOption: { padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#F8F9FA' },
  modeOptionActive: { borderColor: '#FF6B6B', backgroundColor: '#FFF5F5' },
  modeTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
  resetButton: { backgroundColor: '#FF9800', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  resetButtonText: { fontSize: 16, fontWeight: 'bold', color: 'white' },
  btScanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2196F3', padding: 14, borderRadius: 10, marginTop: 12 },
  btScanBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  btPairedBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#9C27B0', padding: 14, borderRadius: 10, marginTop: 10 },
  btAddAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#673AB7', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginBottom: 10, alignSelf: 'flex-start' },
  btAddAllText: { color: 'white', fontSize: 14, fontWeight: '600' },
  subSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#FF6B6B', marginTop: 8, marginBottom: 8 },
  pairedPrinterItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#E0E0E0', gap: 10 },
  pairedPrinterInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  pairedPrinterIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' },
  pairedPrinterName: { fontSize: 15, fontWeight: '600', color: '#333' },
  pairedPrinterAddr: { fontSize: 12, color: '#888', marginTop: 2 },
  addSingleBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' },
  alreadyAddedChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#E8F5E9' },
  alreadyAddedText: { fontSize: 12, fontWeight: '600', color: '#2E7D32' },
  printerItem: { backgroundColor: '#F8F9FA', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E0E0E0' },
  printerInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  printerName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#333' },
  printerRoles: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#EEE', borderWidth: 1, borderColor: '#DDD' },
  roleChipActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  roleChipActiveKitchen: { backgroundColor: '#FF9800', borderColor: '#FF9800' },
  roleChipText: { fontSize: 13, fontWeight: '600', color: '#666' },
  roleChipTextActive: { color: 'white' },
  printerRemoveBtn: { marginLeft: 'auto', padding: 4 },
  addPrinterRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  addPrinterBtn: { backgroundColor: '#2196F3', width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  credentialSaveBtn: { backgroundColor: '#FF6B6B', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  credentialSaveBtnText: { fontSize: 16, fontWeight: 'bold', color: 'white' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#1a1a2e', borderRadius: 20, padding: 32, margin: 24, maxWidth: 400 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginBottom: 16, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#333', alignItems: 'center' },
  modalCancelText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  modalConfirmBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#FF6B6B', alignItems: 'center' },
  modalConfirmText: { fontSize: 16, fontWeight: '600', color: 'white' },
  remoteSection: { borderWidth: 2, borderColor: '#FF6B6B' },
  remoteText: { fontSize: 14, color: '#555', marginBottom: 12, lineHeight: 20 },
  remoteUrlBox: { backgroundColor: '#FFF5F5', borderRadius: 8, padding: 12, marginBottom: 10 },
  remoteUrlLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  remoteUrl: { fontSize: 15, fontWeight: '700', color: '#FF6B6B', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  remoteHint: { fontSize: 13, color: '#666', lineHeight: 20 },
});
