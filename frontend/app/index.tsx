import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Platform, useWindowDimensions, Alert, BackHandler, ScrollView, ActivityIndicator } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getSettings, Settings, adminPinLogin, getAdminCredentialStatus, getGlobalGroups, getProducts, getCategories } from '@/src/api/api';
import { getLicenseInfo, LicenseInfo } from '@/src/utils/license';
import PinPad from '@/src/components/PinPad';
import LanguageSelector from '@/src/components/LanguageSelector';
import { useI18n, resetCustomerSessionLanguage } from '@/src/utils/i18n';
import { useKioskStore } from '@/src/store/kioskStore';
import { stopKioskMode, startKioskMode, isKioskModeActive } from '../modules/kiosk-mode/src';
import { storage } from '@/src/utils/storage';
import { sanitizeImageUri } from '@/src/utils/imageUtils';
import { Text } from '@/src/components/LocalizedPrimitives';

const EDGE = Platform.OS === 'android' ? 24 : 20;
const BOTTOM = Platform.OS === 'android' ? 32 : 24;

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const config = useKioskStore((s) => s.config);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [dotClickCount, setDotClickCount] = useState(0);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [isLockActive, setIsLockActive] = useState(false);
  const clickTimerRef = useRef<any>(null);
  const hasReceivedInitialFocusRef = useRef(false);
  const [setupGate, setSetupGate] = useState<'checking' | 'required' | 'ready'>('checking');

  const targetTaps = config.secretTapsCount || 7;

  useEffect(() => {
    let active = true;
    void getAdminCredentialStatus()
      .then((status) => {
        if (!active) return;
        if (!status.configured) {
          setSetupGate('required');
          router.replace('/admin/login');
          return;
        }
        setSetupGate('ready');
      })
      .catch(() => {
        if (active) setSetupGate('ready');
      });
    return () => { active = false; };
  }, [router]);

  const loadSettings = useCallback(async () => {
    try {
      const data = await getSettings();
      const lic = await getLicenseInfo();
      setLicense(lic);
      getGlobalGroups().catch(() => {});
      getProducts().catch(() => {});
      getCategories().catch(() => {});
      setSettings(data);
      const lockState = await isKioskModeActive();
      setIsLockActive(lockState);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  // Alla prima apertura conserva la lingua appena scelta dal cliente. Al ritorno
  // effettivo alla Home dopo una navigazione, chiude invece la sessione lingua.
  useFocusEffect(
    useCallback(() => {
      if (hasReceivedInitialFocusRef.current) {
        resetCustomerSessionLanguage();
      } else {
        hasReceivedInitialFocusRef.current = true;
      }
      loadSettings();
    }, [loadSettings])
  );

  const handleSecretDotPress = async () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    const newCount = dotClickCount + 1;
    setDotClickCount(newCount);

    if (newCount >= targetTaps) {
      setDotClickCount(0);
      // Al primo avvio non esiste ancora un PIN da verificare: porta l’amministratore
      // al setup iniziale, dove può scegliere username, password, PIN e recovery code.
      const credentialStatus = await getAdminCredentialStatus().catch(() => ({ configured: true, username: null, recoveryCodeReady: false }));
      if (!credentialStatus.configured) {
        router.push('/admin/login');
        return;
      }
      // Dopo il setup, l’accesso al menu tecnico richiede sempre un PIN verificato.
      setShowPinModal(true);
      return;
    }

    clickTimerRef.current = setTimeout(() => {
      setDotClickCount(0);
    }, 3000);
  };

  const authenticateAdminSession = async (pin: string) => {
    const token = await adminPinLogin(pin);
    const saved = await storage.secureSet('admin_token', token);
    if (!saved) throw new Error('Impossibile salvare la sessione amministratore');
  };

  const handlePinSuccess = async () => {
    setShowPinModal(false);
    const lockState = await isKioskModeActive();
    setIsLockActive(lockState);
    setShowActionModal(true);
  };

  const handleUnlockKiosk = async () => {
    try {
      await stopKioskMode();
      setIsLockActive(false);
      Alert.alert(t('tech_menu.unlocked_title'), t('tech_menu.unlocked_msg'));
    } catch (e) {
      Alert.alert(t('common.error'), String(e));
    }
  };

  const handleRelockKiosk = async () => {
    try {
      await startKioskMode();
      setIsLockActive(true);
      Alert.alert(t('tech_menu.locked_title'), t('tech_menu.locked_msg'));
    } catch (e) {
      Alert.alert(t('common.error'), String(e));
    }
  };

  const handleExitApp = () => {
    Alert.alert(
      t('tech_menu.exit_confirm_title'),
      t('tech_menu.exit_confirm_msg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('tech_menu.close_app_btn'),
          style: 'destructive',
          onPress: async () => {
            await stopKioskMode().catch(() => {});
            if (Platform.OS === 'android') {
              BackHandler.exitApp();
            } else {
              setShowActionModal(false);
            }
          },
        },
      ]
    );
  };

  const restaurantName = settings?.restaurant_name || t('welcome.title');
  const logo = settings?.logo;
  const { width: winW, height: winH } = useWindowDimensions();
  
  // Rilevamento tablet/totem vs smartphone
  const isLarge = Math.min(winW, winH) >= 540 || Math.max(winW, winH) >= 880;
  const isCompactHeight = winH < 700;

  const logoSize = isLarge ? 220 : (isCompactHeight ? 90 : 130);
  const btnPadV = isLarge ? 28 : (isCompactHeight ? 12 : 16);
  const btnPadH = isLarge ? 28 : 16;
  const titleSize = isLarge ? 42 : (isCompactHeight ? 24 : 30);
  const subtitleSize = isLarge ? 22 : (isCompactHeight ? 14 : 16);
  const optTitleSize = isLarge ? 26 : (isCompactHeight ? 16 : 18);
  const descSize = isLarge ? 17 : (isCompactHeight ? 12 : 13);
  const iconBoxSize = isLarge ? 80 : (isCompactHeight ? 48 : 56);
  const iconSize = isLarge ? 44 : (isCompactHeight ? 26 : 30);
  const arrowSize = isLarge ? 32 : 22;
  const btnRadius = isLarge ? 24 : 16;
  const btnGap = isLarge ? 24 : (isCompactHeight ? 10 : 14);
  const btnMaxW = isLarge ? 720 : 440;

  if (setupGate !== 'ready') {
    return (
      <View style={[styles.container, { backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color="#FF6B6B" />
        <Text style={{ color: '#FFF', marginTop: 14, fontWeight: '700' }}>Preparazione primo accesso...</Text>
      </View>
    );
  }
  if (license?.status === 'expired') {
    return (
      <View style={[styles.container, { backgroundColor: '#0B1220', alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        <Ionicons name="warning-outline" size={64} color="#FF6B6B" style={{ marginBottom: 16 }} />
        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 8 }}>Licenza Scaduta</Text>
        <Text style={{ color: '#94A3B8', fontSize: 16, textAlign: 'center', marginBottom: 24 }}>Il periodo di prova o l'abbonamento è terminato. Accedi al pannello per riattivare il Totem.</Text>
        <TouchableOpacity style={{ backgroundColor: '#1F2937', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#374151' }} onPress={() => setShowPinModal(true)}>
          <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>Accedi al Pannello</Text>
        </TouchableOpacity>
        
        <Modal visible={showPinModal} animationType="fade" transparent statusBarTranslucent>
          <View style={styles.modalOverlay}>
            <PinPad 
              title={t('welcome.admin_access_title')}
              subtitle={t('welcome.admin_access_desc')}
              verifyPin={async (enteredPin) => {
                try {
                  await authenticateAdminSession(enteredPin);
                  return true;
                } catch {
                  return false;
                }
              }}
              onSuccess={handlePinSuccess}
              onBack={() => setShowPinModal(false)}
              onForgotPin={() => {
                setShowPinModal(false);
                router.push({ pathname: '/admin/login', params: { mode: 'recovery' } });
              }}
            />
          </View>
        </Modal>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#000', '#1a1a2e']}
        style={styles.gradient}
      >
        {/* Barra selezione lingua in alto a sinistra */}
        <View style={styles.langBarTop}>
          <LanguageSelector compact mode="customer-session" />
        </View>

        {/* Trigger segreto admin PERENNEMENTE in alto a destra */}
        <TouchableOpacity
          testID="secret-admin-dot"
          style={styles.secretDot}
          onPress={handleSecretDotPress}
          activeOpacity={0.6}
        >
          {dotClickCount > 0 && (
            <View style={styles.dotCounter}>
              <Text style={styles.dotCounterText}>{dotClickCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <ScrollView
          style={styles.scrollWrapper}
          contentContainerStyle={[styles.content, isLarge && styles.contentLarge]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.header}>
            {sanitizeImageUri(logo) ? (
              <ExpoImage
                key={logo!.slice(0, 64)}
                source={{ uri: sanitizeImageUri(logo)! }}
                style={[styles.logoImage, { width: logoSize, height: logoSize }]}
                contentFit="contain"
                transition={120}
                cachePolicy="memory-disk"
              />
            ) : (
              <Ionicons name="restaurant" size={isLarge ? 96 : (isCompactHeight ? 56 : 72)} color="#FF6B6B" />
            )}
            <Text style={[styles.title, { fontSize: titleSize, marginTop: isCompactHeight ? 8 : 14 }]}>
              {restaurantName}
            </Text>
            <Text style={[styles.subtitle, { fontSize: subtitleSize, marginTop: isCompactHeight ? 4 : 8 }]}>
              {t('welcome.how_to_proceed')}
            </Text>
          </View>

          <View style={[styles.buttonContainer, { gap: btnGap, maxWidth: btnMaxW }]}>
            <TouchableOpacity
              testID="take-number-btn"
              style={[
                styles.optionButton,
                {
                  paddingVertical: btnPadV,
                  paddingHorizontal: btnPadH,
                  borderRadius: btnRadius,
                }
              ]}
              onPress={() => router.push('/take-number')}
              activeOpacity={0.8}
            >
              <View style={[styles.optionIcon, { width: iconBoxSize, height: iconBoxSize, borderRadius: iconBoxSize / 2 }]}>
                <Ionicons name="ticket" size={iconSize} color="#FF6B6B" />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { fontSize: optTitleSize }]}>
                  {t('welcome.take_number_title')}
                </Text>
                <Text style={[styles.optionDescription, { fontSize: descSize }]}>
                  {t('welcome.take_number_desc')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={arrowSize} color="#FF6B6B" />
            </TouchableOpacity>

            <TouchableOpacity
              testID="start-order-btn"
              style={[
                styles.optionButton,
                styles.primaryButton,
                {
                  paddingVertical: btnPadV,
                  paddingHorizontal: btnPadH,
                  borderRadius: btnRadius,
                }
              ]}
              onPress={() => router.push('/categories')}
              activeOpacity={0.8}
            >
              <View style={[styles.optionIcon, styles.primaryIcon, { width: iconBoxSize, height: iconBoxSize, borderRadius: iconBoxSize / 2 }]}>
                <Ionicons name="fast-food" size={iconSize} color="white" />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, styles.primaryTitle, { fontSize: optTitleSize }]}>
                  {t('welcome.order_totem_title')}
                </Text>
                <Text style={[styles.optionDescription, styles.primaryDescription, { fontSize: descSize }]}>
                  {t('welcome.order_totem_desc')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={arrowSize} color="white" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* MODAL 1: PIN PAD */}
      <Modal
        visible={showPinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '92%', padding: 14 }]}>
            <PinPad
              title={t('welcome.admin_access_title')}
              subtitle={t('welcome.admin_access_desc')}
              verifyPin={async (enteredPin) => {
                try {
                  await authenticateAdminSession(enteredPin);
                  return true;
                } catch {
                  return false;
                }
              }}
              onSuccess={handlePinSuccess}
              onBack={() => setShowPinModal(false)}
              onForgotPin={() => {
                setShowPinModal(false);
                router.push({ pathname: '/admin/login', params: { mode: 'recovery' } });
              }}
            />
          </View>
        </View>
      </Modal>

      {/* MODAL 2: MENU TECNICO TOTEM (MULTI-LINGUA REATTIVO) */}
      <Modal
        visible={showActionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 460 }]}>
            <View style={styles.actionModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={styles.shieldIconBox}>
                  <Ionicons name="shield-checkmark" size={22} color="#3B82F6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionModalMainTitle}>{t('tech_menu.title')}</Text>
                  <Text style={styles.actionModalMainSub}>{t('tech_menu.authorized_access')}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowActionModal(false)} style={{ padding: 6 }}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 10 }}>
                {/* Opzione 1: Vai al pannello admin */}
                <TouchableOpacity
                  style={styles.actionModalBtn}
                  onPress={() => {
                    setShowActionModal(false);
                    router.push('/admin/products');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIconBox, { backgroundColor: '#2563EB' }]}>
                    <Ionicons name="settings" size={20} color="white" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actionModalTitle}>{t('tech_menu.admin_panel')}</Text>
                    <Text style={styles.actionModalSub}>{t('tech_menu.admin_panel_desc')}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#64748B" />
                </TouchableOpacity>

                {/* Opzione 2: Sblocca Kiosk / Lock Task */}
                <TouchableOpacity
                  style={styles.actionModalBtn}
                  onPress={isLockActive ? handleUnlockKiosk : handleRelockKiosk}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIconBox, { backgroundColor: isLockActive ? '#F59E0B' : '#10B981' }]}>
                    <Ionicons name={isLockActive ? "lock-open" : "lock-closed"} size={20} color="white" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actionModalTitle}>
                      {isLockActive ? t('tech_menu.unlock_screen') : t('tech_menu.lock_screen')}
                    </Text>
                    <Text style={styles.actionModalSub}>
                      {isLockActive ? t('tech_menu.unlock_screen_desc') : t('tech_menu.lock_screen_desc')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#64748B" />
                </TouchableOpacity>

                {/* Opzione 3: Ricarica e Sincronizza */}
                <TouchableOpacity
                  style={styles.actionModalBtn}
                  onPress={() => {
                    loadSettings();
                    setShowActionModal(false);
                    Alert.alert(t('tech_menu.reloaded_title'), t('tech_menu.reloaded_msg'));
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIconBox, { backgroundColor: '#0284C7' }]}>
                    <Ionicons name="refresh" size={20} color="white" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actionModalTitle}>{t('tech_menu.reload_screen')}</Text>
                    <Text style={styles.actionModalSub}>{t('tech_menu.reload_screen_desc')}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#64748B" />
                </TouchableOpacity>

                {/* Opzione 4: Esci dall'App */}
                <TouchableOpacity
                  style={[styles.actionModalBtn, { borderColor: '#EF444440' }]}
                  onPress={handleExitApp}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIconBox, { backgroundColor: '#EF4444' }]}>
                    <Ionicons name="power" size={20} color="white" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.actionModalTitle, { color: '#F87171' }]}>{t('tech_menu.exit_app')}</Text>
                    <Text style={styles.actionModalSub}>{t('tech_menu.exit_app_desc')}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.returnTotemBtn}
              onPress={() => setShowActionModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.returnTotemText}>{t('tech_menu.return_totem')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollWrapper: {
    flex: 1,
  },
  langBarTop: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 44 : 50,
    left: EDGE,
    zIndex: 90,
  },
  secretDot: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 44 : 50,
    right: EDGE,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  dotCounter: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  dotCounterText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: EDGE,
    paddingTop: Platform.OS === 'android' ? 90 : 96,
    paddingBottom: BOTTOM,
    gap: 20,
  },
  contentLarge: {
    gap: 36,
    paddingTop: 80,
  },
  header: {
    alignItems: 'center',
    width: '100%',
  },
  logoImage: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  title: {
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  buttonContainer: {
    width: '100%',
    alignSelf: 'center',
  },
  optionButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButton: {
    backgroundColor: '#FF6B6B',
  },
  optionIcon: {
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  primaryTitle: {
    color: 'white',
  },
  optionDescription: {
    color: '#64748B',
    lineHeight: 18,
  },
  primaryDescription: {
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  actionModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  shieldIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionModalMainTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
  },
  actionModalMainSub: {
    color: '#94A3B8',
    fontSize: 12,
  },
  actionModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionModalTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  actionModalSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  returnTotemBtn: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  returnTotemText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
});

