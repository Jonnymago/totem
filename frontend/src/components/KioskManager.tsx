import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text as NativeText, StyleSheet, TouchableOpacity, Image, Dimensions, Animated, Platform,  } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useKioskStore } from '@/src/store/kioskStore';
import { useCartStore } from '@/src/store/cartStore';
import { getSettings, Settings } from '@/src/api/api';
import { isNightDimmingTime } from '@/src/utils/kiosk';
import { useI18n } from '@/src/utils/i18n';

import { Text } from '@/src/components/LocalizedPrimitives';
interface KioskManagerProps {
  children: React.ReactNode;
}

export default function KioskManager({ children }: KioskManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { lang, resetCustomerSessionLanguage } = useI18n();
  const locale = { it: 'it-IT', en: 'en-GB', fr: 'fr-FR', es: 'es-ES', de: 'de-DE' }[lang];

  const {
    config,
    isInitialized,
    screensaverActive,
    dimmedActive,
    nightDimmingActive,
    lastActivityTimestamp,
    initKiosk,
    recordActivity,
    triggerScreensaver,
    triggerWake,
  } = useKioskStore();

  const [settings, setSettings] = useState<Settings | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeCustomerNightSession, setActiveCustomerNightSession] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const promoSlideIndexRef = useRef(0);
  const [promoSlide, setPromoSlide] = useState(0);

  // Inizializza impostazioni Kiosk
  useEffect(() => {
    initKiosk();
    getSettings().then(setSettings).catch(() => {});
  }, [initKiosk]);

  // Gestione tocco universale
  const handleUniversalActivity = useCallback(() => {
    recordActivity();
    if (nightDimmingActive && !activeCustomerNightSession) {
      setActiveCustomerNightSession(true);
    }
  }, [recordActivity, nightDimmingActive, activeCustomerNightSession]);

  const handleWakeFromScreensaver = useCallback(() => {
    triggerWake();
    handleUniversalActivity();
  }, [triggerWake, handleUniversalActivity]);

  // Animazione pulsazione per i salvaschermo
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.96,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // Orologio & Slideshow promozionale
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const promoTimer = setInterval(() => {
      promoSlideIndexRef.current = (promoSlideIndexRef.current + 1) % 3;
      setPromoSlide(promoSlideIndexRef.current);
    }, 5000);

    return () => {
      clearInterval(clockTimer);
      clearInterval(promoTimer);
    };
  }, []);

  // Monitoraggio Inattività & Reset Automatico Carrello
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedSec = Math.floor((now - lastActivityTimestamp) / 1000);
      const isCustomerFlow = pathname && !pathname.startsWith('/admin') && pathname !== '/';

      // 1. Auto-Reset Carrello Abbandonato su schermate cliente
      if (
        isCustomerFlow &&
        config.autoResetCartOnInactivity &&
        config.autoResetCartTimeoutSec > 0 &&
        elapsedSec >= config.autoResetCartTimeoutSec
      ) {
        const cartItems = useCartStore.getState().items;
        if (cartItems.length > 0) {
          useCartStore.getState().clearCart();
        }
        if (pathname !== '/') {
          router.replace('/');
          recordActivity();
        }
      }

      // 2. Attivazione Salvaschermo e Reset Lingua se il totem è inattivo
      if (
        config.inactivityTimeoutSec > 0 &&
        elapsedSec >= config.inactivityTimeoutSec &&
        !pathname?.startsWith('/admin')
      ) {
        // Chiude la sessione linguistica cliente quando scatta il salvaschermo per inattività
        resetCustomerSessionLanguage();
        setActiveCustomerNightSession(false);
        
        if (!screensaverActive) {
          triggerScreensaver();
        }
      }

      // 3. Controllo Programmazione Notturna
      if (config.nightDimmingEnabled) {
        const isNight = isNightDimmingTime(config.nightDimmingStart, config.nightDimmingEnd);
        if (isNight !== nightDimmingActive) {
          useKioskStore.setState({ nightDimmingActive: isNight });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    isInitialized,
    config,
    lastActivityTimestamp,
    screensaverActive,
    nightDimmingActive,
    pathname,
    router,
    triggerScreensaver,
    recordActivity,
    resetCustomerSessionLanguage,
  ]);

  // Calcolo oscuramento luminosità (Dimmer Overlay)
  // Se è orario notturno ma c'è una sessione cliente attiva, usa luminosità piena
  const effectiveBrightness = dimmedActive || (nightDimmingActive && !activeCustomerNightSession && screensaverActive)
    ? 10
    : (config.brightnessLevel || 90);
  const dimmerOpacity = effectiveBrightness < 100 ? ((100 - effectiveBrightness) / 100) * 0.82 : 0;

  const restaurantName = settings?.restaurant_name || 'Totem Self-Service';
  const logo = settings?.logo;

  const promoCards = [
    {
      title: 'Benvenuto!',
      sub: 'Tocca lo schermo per scoprire il nostro menu e ordinare subito.',
      badge: '🍔 Freschezza & Qualità',
    },
    {
      title: 'Componi il Tuo Piatto',
      sub: 'Personalizza ingredienti, salse, opzioni ed extra come preferisci.',
      badge: '🍟 Facile & Veloce',
    },
    {
      title: 'Ritiro al Banco Senza Attese',
      sub: 'Invia la tua comanda in cucina e ricevi il tuo scontrino con numero.',
      badge: '⚡ Ordine Diretto',
    },
  ];

  return (
    <View
      style={styles.rootContainer}
      onStartShouldSetResponderCapture={() => {
        handleUniversalActivity();
        return false;
      }}
      onMoveShouldSetResponderCapture={() => {
        handleUniversalActivity();
        return false;
      }}
      onTouchStart={handleUniversalActivity}
    >
      {/* Applicazione Principale */}
      {children}

      {/* Layer Dimming Hardware / Luminosità Visiva */}
      {dimmerOpacity > 0 && (
        <View
          pointerEvents="none"
          style={[styles.dimmerLayer, { opacity: dimmerOpacity }]}
        />
      )}

      {/* Overlay Salvaschermo Kiosk Attivo */}
      {screensaverActive && (
        <TouchableOpacity
          activeOpacity={1}
          style={styles.screensaverContainer}
          onPress={handleWakeFromScreensaver}
        >
          {config.screensaverMode === 'promo_banner' && (
            <View style={styles.screensaverContent}>
              {logo ? (
                <Image source={{ uri: logo }} style={styles.screensaverLogo} resizeMode="contain" />
              ) : (
                <View style={styles.screensaverLogoPlaceholder}>
                  <Ionicons name="restaurant" size={56} color="#FF6B6B" />
                </View>
              )}

              <Text style={styles.screensaverRestaurant}>{restaurantName}</Text>
              
              <View style={styles.promoBox}>
                <Text style={styles.promoBadge}>{promoCards[promoSlide].badge}</Text>
                <Text style={styles.promoTitle}>{promoCards[promoSlide].title}</Text>
                <Text style={styles.promoSub}>{promoCards[promoSlide].sub}</Text>
              </View>

              <Animated.View style={[styles.touchToStartBtn, { transform: [{ scale: pulseAnim }] }]}>
                <Ionicons name="hand-left" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.touchToStartText}>TOCCA LO SCHERMO PER ORDINARE</Text>
              </Animated.View>
            </View>
          )}

          {config.screensaverMode === 'clock' && (
            <View style={styles.screensaverContent}>
              {logo && (
                <Image source={{ uri: logo }} style={styles.clockLogo} resizeMode="contain" />
              )}
              <Text style={styles.clockRestaurant}>{restaurantName}</Text>

              <Text style={styles.clockDigits}>
                {currentTime.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </Text>
              <Text style={styles.clockDate}>
                {currentTime.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>

              <Animated.View style={[styles.touchClockHint, { transform: [{ scale: pulseAnim }] }]}>
                <Ionicons name="hand-left" size={20} color="#94A3B8" />
                <Text style={styles.touchClockText}>Tocca per iniziare ad ordinare</Text>
              </Animated.View>
            </View>
          )}

          {config.screensaverMode === 'dimmed' && (
            <View style={styles.dimmedContent}>
              <Animated.View style={{ opacity: pulseAnim, alignItems: 'center' }}>
                <Ionicons name="moon" size={48} color="#64748B" style={{ marginBottom: 12 }} />
                <Text style={styles.dimmedTitle}>Totem in Standby</Text>
                <Text style={styles.dimmedSub}>Tocca lo schermo per riattivare</Text>
              </Animated.View>
            </View>
          )}

          {config.screensaverMode === 'black' && (
            <View style={styles.blackContent}>
              <Text style={styles.blackHint}>•</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const { width: WIN_W, height: WIN_H } = Dimensions.get('window');

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  dimmerLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 999998,
  },
  screensaverContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0B0F19',
    zIndex: 999999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screensaverContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    maxWidth: 600,
    width: '100%',
  },
  screensaverLogo: {
    width: 140,
    height: 140,
    marginBottom: 16,
    borderRadius: 20,
  },
  screensaverLogoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 24,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  screensaverRestaurant: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  promoBox: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 36,
  },
  promoBadge: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  promoTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  promoSub: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },
  touchToStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4757',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 100,
    shadowColor: '#FF4757',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  touchToStartText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // Modalità Orologio
  clockLogo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  clockRestaurant: {
    fontSize: 20,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 20,
  },
  clockDigits: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
    marginBottom: 8,
  },
  clockDate: {
    fontSize: 18,
    fontWeight: '600',
    color: '#38BDF8',
    textTransform: 'capitalize',
    marginBottom: 40,
  },
  touchClockHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  touchClockText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },

  // Modalità Dimmed
  dimmedContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimmedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 4,
  },
  dimmedSub: {
    fontSize: 14,
    color: '#64748B',
  },

  // Modalità Black
  blackContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blackHint: {
    color: '#1E293B',
    fontSize: 12,
  },
});
