import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import {
  adminPinLogin,
  configureInitialAdminCredentials,
  getAdminCredentialStatus,
  resetAdminCredentialsWithRecoveryCode,
} from '@/src/api/api';
import { storage } from '@/src/utils/storage';
import { saveCredentialRecoveryBackup, shareCredentialRecoveryBackup } from '@/src/utils/credentialBackup';
import LanguageSelector from '@/src/components/LanguageSelector';
import { Text, TextInput } from '@/src/components/LocalizedPrimitives';

type LoginMode = 'login' | 'setup' | 'recovery';

export default function AdminLoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<LoginMode>(params.mode === 'recovery' ? 'recovery' : 'login');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [oneTimeRecoveryCode, setOneTimeRecoveryCode] = useState<string | null>(null);
  const [backupSaving, setBackupSaving] = useState(false);
  const [recoveryHandled, setRecoveryHandled] = useState<'none' | 'saved' | 'shared'>('none');

  useEffect(() => {
    void loadCredentialStatus();
  }, []);

  useEffect(() => {
    if (params.mode === 'recovery') {
      setMode('recovery');
    }
  }, [params.mode]);

  const loadCredentialStatus = async () => {
    setLoading(true);
    try {
      const status = await getAdminCredentialStatus();
      setMode(!status.configured ? 'setup' : params.mode === 'recovery' ? 'recovery' : 'login');
    } catch {
      setError('Impossibile verificare la configurazione di sicurezza.');
    } finally {
      setLoading(false);
    }
  };

  const extractRecoveryCode = (raw: string): string => {
    if (!raw) return '';
    const tqbMatch = raw.match(/TQB-RC-[A-Z0-9-]+/i);
    if (tqbMatch) return tqbMatch[0].trim().toUpperCase();
    const codeMatch = raw.match(/(?:[A-F0-9]{4}-){7}[A-F0-9]{4}/i) || raw.match(/[A-F0-9]{32}/i);
    if (codeMatch) return codeMatch[0].trim().toUpperCase();
    return raw.trim().toUpperCase();
  };

  const handlePasteRecoveryCode = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (!text || !text.trim()) {
        Alert.alert('Appunti vuoti', 'Nessun testo trovato negli appunti.');
        return;
      }
      const code = extractRecoveryCode(text);
      setRecoveryCode(code);
      setError('');
      Alert.alert('Codice Incollato', 'Recovery Code inserito dagli appunti con successo.');
    } catch {
      Alert.alert('Errore', 'Impossibile leggere il contenuto dagli appunti.');
    }
  };

  const handlePickRecoveryFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'application/json', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const uri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      if (content) {
        const code = extractRecoveryCode(content);
        if (code) {
          setRecoveryCode(code);
          setError('');
          Alert.alert('File Letto', 'Recovery Code estratto e inserito correttamente!');
        } else {
          Alert.alert('Codice non trovato', 'Il file selezionato non contiene un Recovery Code valido.');
        }
      }
    } catch (e: any) {
      Alert.alert('Errore Lettura File', e?.message || 'Impossibile leggere il file selezionato.');
    }
  };

  const saveAdminSession = async (token: string) => {
    const saved = await storage.secureSet('admin_token', token);
    if (!saved) throw new Error('Impossibile salvare la sessione amministratore.');
  };

  const handlePinLogin = async (overridePin?: string) => {
    const pinToSubmit = (overridePin || pin).trim();
    if (!pinToSubmit) {
      setError('Inserisci il PIN a 6 cifre.');
      return;
    }
    if (pinToSubmit.length !== 6) {
      setError('Il PIN deve essere esattamente di 6 cifre.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const token = await adminPinLogin(pinToSubmit);
      await saveAdminSession(token);
      router.replace('/admin/products');
    } catch (e: any) {
      setError(e?.message || 'PIN non valido.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInitialSetup = async () => {
    if (submitting) return;
    setError('');
    const cleanPin = pin.trim();
    const cleanConfirm = confirmPin.trim();

    if (!cleanPin) {
      setError('Inserisci il nuovo PIN a 6 cifre.');
      return;
    }
    if (cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
      setError('Il PIN deve essere composto esattamente da 6 cifre numeriche.');
      return;
    }
    if (cleanPin !== cleanConfirm) {
      setError('I due PIN inseriti non coincidono.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await configureInitialAdminCredentials(cleanPin);
      await saveAdminSession(result.token);
      setOneTimeRecoveryCode(result.recoveryCode);
    } catch (e: any) {
      setError(e?.message || 'Impossibile configurare il PIN amministratore.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportRecoveryBackup = async () => {
    if (!oneTimeRecoveryCode) return;
    setBackupSaving(true);
    try {
      const res = await saveCredentialRecoveryBackup({ recoveryCode: oneTimeRecoveryCode });
      setRecoveryHandled('saved');
      if (res.method === 'saf') {
        Alert.alert('Scheda Recupero PIN Salvata', 'La scheda è stata salvata nella cartella selezionata. Conservala in un luogo sicuro.');
      } else {
        Alert.alert('Scheda Recupero PIN Salvata', 'Il file di recupero è stato creato e il codice è stato copiato negli appunti.');
      }
    } catch (e: any) {
      Alert.alert('Salvataggio file non riuscito', e?.message || 'Il codice è stato comunque copiato negli appunti.');
    } finally {
      setBackupSaving(false);
    }
  };

  const handleShareRecoveryBackup = async () => {
    if (!oneTimeRecoveryCode) return;
    setBackupSaving(true);
    try {
      await shareCredentialRecoveryBackup({ recoveryCode: oneTimeRecoveryCode });
      setRecoveryHandled('shared');
      Alert.alert('Condivisione aperta', 'Scegli messaggistica, email o un’altra app per inviare la scheda di recupero.');
    } catch (e: any) {
      Alert.alert('Condivisione non riuscita', e?.message || 'Il codice è stato copiato negli appunti.');
    } finally {
      setBackupSaving(false);
    }
  };

  const handleRecoveryReset = async () => {
    if (submitting) return;
    setError('');
    const cleanRecovery = recoveryCode.trim();
    const cleanPin = pin.trim();
    const cleanConfirm = confirmPin.trim();

    if (!cleanRecovery) {
      setError('Inserisci il Recovery Code.');
      return;
    }
    if (!cleanPin) {
      setError('Inserisci il nuovo PIN a 6 cifre.');
      return;
    }
    if (cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
      setError('Il nuovo PIN deve essere composto da 6 cifre numeriche.');
      return;
    }
    if (cleanPin !== cleanConfirm) {
      setError('I due PIN inseriti non coincidono.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await resetAdminCredentialsWithRecoveryCode(cleanRecovery, cleanPin);
      await saveAdminSession(result.token);
      setOneTimeRecoveryCode(result.recoveryCode);
    } catch (e: any) {
      setError(e?.message || 'Recovery Code non valido o requisiti PIN non rispettati.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetFields = () => {
    setPin('');
    setConfirmPin('');
    setRecoveryCode('');
    setError('');
  };

  const showLogin = mode === 'login';
  const showSetup = mode === 'setup';

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          {loading || showSetup ? null : (
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={submitting}>
              <Ionicons name="arrow-back" size={24} color="#1E293B" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.languageSelector}>
            <LanguageSelector compact theme="light" />
          </View>
          <Text style={styles.logoEmoji}>🍔</Text>
          <Text style={styles.title}>Totem Admin</Text>

          {loading ? (
            <ActivityIndicator color="#FF6B6B" style={{ marginVertical: 24 }} />
          ) : (
            <>
              <Text style={styles.subtitle}>
                {showSetup
                  ? 'Primo accesso: crea il tuo PIN a 6 cifre per accedere e gestire il Totem.'
                  : mode === 'recovery'
                    ? 'Inserisci il Recovery Code e crea un nuovo PIN a 6 cifre.'
                    : 'Inserisci il PIN a 6 cifre per accedere al pannello di controllo.'}
              </Text>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#991B1B" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {mode === 'recovery' ? (
                <View style={styles.formGroup}>
                  <View style={styles.recoveryLabelRow}>
                    <Text style={styles.formLabel}>Recovery Code Monouso</Text>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    value={recoveryCode}
                    onChangeText={setRecoveryCode}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    placeholder="TQB-RC-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                    placeholderTextColor="#94A3B8"
                    editable={!submitting}
                  />
                  
                  <View style={styles.recoveryActionRow}>
                    <TouchableOpacity
                      style={styles.recoveryActionBtn}
                      onPress={handlePasteRecoveryCode}
                      disabled={submitting}
                    >
                      <Ionicons name="clipboard-outline" size={15} color="#0F766E" />
                      <Text style={styles.recoveryActionBtnText}>Incolla dagli Appunti</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.recoveryActionBtn}
                      onPress={handlePickRecoveryFile}
                      disabled={submitting}
                    >
                      <Ionicons name="document-text-outline" size={15} color="#0F766E" />
                      <Text style={styles.recoveryActionBtnText}>Importa Scheda (.txt)</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.recoveryHintText}>
                    💡 Inserisci il Recovery Code monouso ottenuto alla prima configurazione o generato dalle impostazioni per creare un nuovo PIN.
                  </Text>
                </View>
              ) : null}

              {showLogin ? (
                <View style={styles.formGroup}>
                  <View style={styles.pinLabelRow}>
                    <Text style={styles.formLabel}>PIN Amministratore (6 cifre)</Text>
                    <TouchableOpacity
                      onPress={() => setShowPin((visible) => !visible)}
                      style={styles.togglePinBtn}
                      disabled={submitting}
                    >
                      <Ionicons name={showPin ? 'eye-off-outline' : 'eye-outline'} size={16} color="#64748B" />
                      <Text style={styles.togglePinText}>{showPin ? 'Nascondi' : 'Mostra'}</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.pinInput}
                    value={pin}
                    onChangeText={(val) => {
                      const digits = val.replace(/\D/g, '').slice(0, 6);
                      setPin(digits);
                      if (digits.length === 6) {
                        void handlePinLogin(digits);
                      }
                    }}
                    secureTextEntry={!showPin}
                    keyboardType="numeric"
                    maxLength={6}
                    placeholder="Inserisci le 6 cifre"
                    placeholderTextColor="#94A3B8"
                    editable={!submitting}
                    autoFocus
                  />
                </View>
              ) : (
                <>
                  <View style={styles.formGroup}>
                    <View style={styles.pinLabelRow}>
                      <Text style={styles.formLabel}>Nuovo PIN (6 cifre)</Text>
                      <TouchableOpacity
                        onPress={() => setShowPin((visible) => !visible)}
                        style={styles.togglePinBtn}
                        disabled={submitting}
                      >
                        <Ionicons name={showPin ? 'eye-off-outline' : 'eye-outline'} size={16} color="#64748B" />
                        <Text style={styles.togglePinText}>{showPin ? 'Nascondi' : 'Mostra'}</Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={styles.pinInput}
                      value={pin}
                      onChangeText={(val) => setPin(val.replace(/\D/g, '').slice(0, 6))}
                      secureTextEntry={!showPin}
                      keyboardType="numeric"
                      maxLength={6}
                      placeholder="6 cifre numeriche"
                      placeholderTextColor="#94A3B8"
                      editable={!submitting}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Conferma Nuovo PIN (6 cifre)</Text>
                    <TextInput
                      style={styles.pinInput}
                      value={confirmPin}
                      onChangeText={(val) => setConfirmPin(val.replace(/\D/g, '').slice(0, 6))}
                      secureTextEntry={!showPin}
                      keyboardType="numeric"
                      maxLength={6}
                      placeholder="Ripeti le 6 cifre"
                      placeholderTextColor="#94A3B8"
                      editable={!submitting}
                    />
                  </View>
                </>
              )}

              {showLogin ? (
                <TouchableOpacity
                  testID="admin-login-submit"
                  style={[styles.loginBtn, submitting && styles.loginBtnDisabled]}
                  onPress={() => handlePinLogin()}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.loginBtnText}>Accedi con PIN</Text>
                  )}
                </TouchableOpacity>
              ) : showSetup ? (
                <TouchableOpacity
                  testID="admin-setup-submit"
                  style={[styles.loginBtn, submitting && styles.loginBtnDisabled]}
                  onPress={handleInitialSetup}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.loginBtnText}>Configura PIN e Accedi</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  testID="admin-recovery-submit"
                  style={[styles.loginBtn, submitting && styles.loginBtnDisabled]}
                  onPress={handleRecoveryReset}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.loginBtnText}>Reimposta PIN e Accedi</Text>
                  )}
                </TouchableOpacity>
              )}

              {showLogin ? (
                <TouchableOpacity
                  style={styles.linkBtn}
                  onPress={() => {
                    resetFields();
                    setMode('recovery');
                  }}
                  disabled={submitting}
                >
                  <Text style={styles.linkText}>Hai smarrito il PIN? Recupera con codice</Text>
                </TouchableOpacity>
              ) : null}

              {mode === 'recovery' ? (
                <TouchableOpacity
                  style={styles.linkBtn}
                  onPress={() => {
                    resetFields();
                    setMode('login');
                  }}
                  disabled={submitting}
                >
                  <Text style={styles.linkText}>Torna al login</Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      {/* Modal One-time Recovery Code */}
      <Modal visible={Boolean(oneTimeRecoveryCode)} transparent animationType="fade" onRequestClose={() => undefined}>
        <View style={styles.modalOverlay}>
          <View style={styles.recoveryModal}>
            <Ionicons name="shield-checkmark" size={40} color="#047857" />
            <Text style={styles.modalTitle}>Conserva il Recovery Code</Text>
            <Text style={styles.modalBody}>
              Questo codice è l'unico modo per reimpostare il PIN. Viene mostrato una sola volta: scegli se salvarlo su file oppure inviarlo a messaggi o email, poi continua.
            </Text>
            <Text selectable style={styles.recoveryCode}>
              {oneTimeRecoveryCode}
            </Text>

            <TouchableOpacity
              style={[styles.loginBtn, (backupSaving || recoveryHandled === 'saved') && styles.loginBtnDisabled]}
              onPress={handleExportRecoveryBackup}
              disabled={backupSaving}
            >
              {backupSaving && recoveryHandled !== 'shared' ? (
                <ActivityIndicator color="white" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <Ionicons name="download-outline" size={18} color="#FFF" />
                  <Text style={styles.loginBtnText}>{recoveryHandled === 'saved' ? 'Salvato su file' : 'Salva su file'}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shareBtn, backupSaving && styles.loginBtnDisabled]}
              onPress={handleShareRecoveryBackup}
              disabled={backupSaving}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <Ionicons name="share-social-outline" size={18} color="#0F172A" />
                <Text style={styles.shareBtnText}>{recoveryHandled === 'shared' ? 'Inviato' : 'Invia con messaggi o email'}</Text>
              </View>
            </TouchableOpacity>

            {recoveryHandled === 'none' ? (
              <Text style={styles.modalBody}>Devi salvare o inviare il codice prima di continuare.</Text>
            ) : null}

            <TouchableOpacity
              testID="recovery-continue-admin"
              style={[styles.continueBtn, recoveryHandled === 'none' && { opacity: 0.4 }]}
              onPress={() => {
                if (recoveryHandled === 'none') {
                  Alert.alert('Recovery Code', 'Scegli se salvare il codice su file oppure inviarlo con messaggi o email.');
                  return;
                }
                setOneTimeRecoveryCode(null);
                setRecoveryHandled('none');
                router.replace(mode === 'setup' ? '/' : '/admin/products');
              }}
              disabled={backupSaving || recoveryHandled === 'none'}
            >
              <Text style={styles.continueBtnText}>{mode === 'setup' ? 'Continua al Totem' : 'Continua al Pannello'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 32,
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 24 : 44,
    left: 16,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    alignItems: 'center',
  },
  languageSelector: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  logoEmoji: {
    fontSize: 44,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 19,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 10,
    borderRadius: 10,
    width: '100%',
    marginBottom: 14,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  formGroup: {
    width: '100%',
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  pinLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  togglePinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  togglePinText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
  },
  recoveryLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  recoveryActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  recoveryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 8,
  },
  recoveryActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  recoveryHintText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#64748B',
    marginTop: 6,
  },
  pinInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: 4,
  },
  loginBtn: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  linkBtn: {
    paddingVertical: 14,
  },
  linkText: {
    color: '#2563EB',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.68)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  recoveryModal: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 13,
    lineHeight: 19,
    color: '#475569',
    textAlign: 'center',
  },
  recoveryCode: {
    width: '100%',
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: 1,
    padding: 14,
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  continueBtn: {
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  shareBtn: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  shareBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
});
