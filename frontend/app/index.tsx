import React, { useState, useRef, useCallback } from 'react';
import { View, Text as NativeText, StyleSheet, TouchableOpacity, Image, Modal, Platform, useWindowDimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getSettings, Settings, getAdminPin, getGlobalGroups, getProducts, getCategories } from '@/src/api/api';
import PinPad from '@/src/components/PinPad';
import LanguageSelector from '@/src/components/LanguageSelector';
import { useI18n, resetCustomerSessionLanguage } from '@/src/utils/i18n';
import { useKioskStore } from '@/src/store/kioskStore';

import { Text } from '@/src/components/LocalizedPrimitives';
const EDGE = Platform.OS === 'android' ? 32 : 28;
const BOTTOM = Platform.OS === 'android' ? 40 : 32;

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const config = useKioskStore((s) => s.config);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [dotClickCount, setDotClickCount] = useState(0);
  const [showPinModal, setShowPinModal] = useState(false);
  const [adminPin, setAdminPin] = useState('1234');
  const clickTimerRef = useRef<any>(null);
  const hasReceivedInitialFocusRef = useRef(false);

  const targetTaps = config.secretTapsCount || 7;
  const triggerLoc = config.secretTriggerLocation || 'top-center';

  const loadSettings = useCallback(async () => {
    try {
      const data = await getSettings();
      getGlobalGroups().catch(() => {});
      getProducts().catch(() => {});
      getCategories().catch(() => {});
      setSettings(data);
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
      const pin = await getAdminPin();
      setAdminPin(pin);
      setShowPinModal(true);
      return;
    }

    clickTimerRef.current = setTimeout(() => {
      setDotClickCount(0);
    }, 3000);
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    router.push('/admin/login');
  };

  const restaurantName = settings?.restaurant_name || 'Benvenuto!';
  const logo = settings?.logo;
  const { width: winW, height: winH } = useWindowDimensions();
  // FydeOS / tablet / PC: sempre dimensioni generose
  const isLarge = Math.min(winW, winH) >= 480 || Math.max(winW, winH) >= 800;
  const btnPadV = isLarge ? 32 : 22;
  const btnPadH = isLarge ? 32 : 22;
  const titleSize = isLarge ? 34 : 22;
  const descSize = isLarge ? 22 : 15;
  const iconSize = isLarge ? 72 : 50;
  const arrowSize = isLarge ? 40 : 30;
  const btnRadius = isLarge ? 28 : 20;
  const btnGap = isLarge ? 28 : 16;
  const btnMaxW = isLarge ? 780 : 500;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#000', '#1a1a2e']}
        style={styles.gradient}
      >
        <View style={styles.langBarTop}>
          <LanguageSelector compact mode="customer-session" />
        </View>
          <TouchableOpacity
            testID="secret-admin-dot"
            style={[
              styles.secretDot,
              triggerLoc === 'top-left' && { right: undefined, left: EDGE },
              triggerLoc === 'top-center' && { right: undefined, left: winW / 2 - 12 },
              triggerLoc === 'logo' && { right: undefined, left: winW / 2 - 12, top: Platform.OS === 'android' ? 64 : 70 },
            ]}
            onPress={handleSecretDotPress}
            activeOpacity={0.7}
          >
          {dotClickCount > 0 && (
            <View style={styles.dotCounter}>
              <Text style={styles.dotCounterText}>{dotClickCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={[styles.content, isLarge && styles.contentLarge]}>
          <TouchableOpacity
            activeOpacity={triggerLoc === 'logo' ? 0.8 : 1}
            onPress={triggerLoc === 'logo' ? handleSecretDotPress : undefined}
            style={styles.header}
          >
            {logo ? (
              <Image
                key={logo.slice(0, 64)}
                source={{ uri: logo }}
                style={[styles.logoImage, isLarge && { width: 240, height: 240, borderRadius: 0 }]}
                resizeMode="contain"
              />
            ) : (
              <Ionicons name="restaurant" size={isLarge ? 110 : 90} color="white" />
            )}
            <Text style={[styles.title, isLarge && { fontSize: 48, marginTop: 16 }]}>{restaurantName}</Text>
            <Text style={[styles.subtitle, isLarge && { fontSize: 26, marginBottom: 8 }]}>
              {t('welcome.how_to_proceed')}
            </Text>
          </TouchableOpacity>

          <View style={[styles.buttonContainer, { gap: btnGap, maxWidth: btnMaxW }]}>
            <TouchableOpacity
              testID="take-number-btn"
              style={[styles.optionButton, { paddingVertical: btnPadV, paddingHorizontal: btnPadH, borderRadius: btnRadius, minHeight: isLarge ? 120 : 100 }]}
              onPress={() => router.push('/take-number')}
            >
              <View style={[styles.optionIcon, isLarge && { width: 88, height: 88, borderRadius: 44 }]}>
                <Ionicons name="ticket" size={iconSize} color="#FF6B6B" />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { fontSize: titleSize }]}>
                  {t('welcome.take_number_title')}
                </Text>
                <Text style={[styles.optionDescription, { fontSize: descSize }]}>
                  {t('welcome.take_number_desc')}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={arrowSize} color="#FF6B6B" />
            </TouchableOpacity>

            <TouchableOpacity
              testID="start-order-btn"
              style={[styles.optionButton, styles.primaryButton, { paddingVertical: btnPadV, paddingHorizontal: btnPadH, borderRadius: btnRadius, minHeight: isLarge ? 120 : 100 }]}
              onPress={() => router.push('/categories')}
            >
              <View style={[styles.optionIcon, styles.primaryIcon, isLarge && { width: 88, height: 88, borderRadius: 44 }]}>
                <Ionicons name="fast-food" size={iconSize} color="white" />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, styles.primaryTitle, { fontSize: titleSize }]}>
                  {t('welcome.order_totem_title')}
                </Text>
                <Text style={[styles.optionDescription, styles.primaryDescription, { fontSize: descSize }]}>
                  {t('welcome.order_totem_desc')}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={arrowSize} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <Modal
        visible={showPinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <PinPad
              title={t('welcome.admin_access_title')}
              subtitle={t('welcome.admin_access_desc')}
              correctPin={adminPin}
              onSuccess={handlePinSuccess}
              onBack={() => setShowPinModal(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  langBarTop: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 56 : 60,
    left: EDGE,
    zIndex: 90,
  },
  secretDot: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 64 : 70,
    right: EDGE,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    opacity: 0.7,
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
    top: -20,
    right: -8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  dotCounterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: EDGE,
    paddingTop: 40,
    paddingBottom: BOTTOM,
    gap: 36,
  },
  contentLarge: {
    gap: 48,
    paddingTop: 24,
  },
  header: {
    alignItems: 'center',
  },
  logoImage: {
    width: 200,
    height: 200,
    borderRadius: 0,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 22,
    color: 'white',
    marginTop: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 16,
    width: '100%',
    alignSelf: 'center',
  },
  optionButton: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 100,
  },
  primaryButton: {
    backgroundColor: '#FF6B6B',
  },
  optionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  primaryTitle: {
    color: 'white',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  primaryDescription: {
    color: 'rgba(255,255,255,0.9)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 24,
    paddingTop: 32,
    paddingBottom: 32,
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 480,
  },
});
