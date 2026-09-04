import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text as NativeText,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useKioskStore } from '@/src/store/kioskStore';
import { useCartStore } from '@/src/store/cartStore';
import { getSettings, getProducts, getCategories, Settings, Product, Category } from '@/src/api/api';
import { sanitizeImageUri } from '@/src/utils/imageUtils';
import { isNightDimmingTime } from '@/src/utils/kiosk';
import { useI18n } from '@/src/utils/i18n';

import { Text } from '@/src/components/LocalizedPrimitives';

interface KioskManagerProps {
  children: React.ReactNode;
}

export default function KioskManager({ children }: KioskManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { lang, t, resetCustomerSessionLanguage } = useI18n();
  const locale = { it: 'it-IT', en: 'en-GB', fr: 'fr-FR', es: 'es-ES', de: 'de-DE' }[lang] || 'it-IT';
  const { width: winW, height: winH } = useWindowDimensions();
  const isLandscape = winW > winH;
  const isTablet = winW >= 768;
  const isLargeKiosk = winW >= 1024;

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
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string>>({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeCustomerNightSession, setActiveCustomerNightSession] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideFadeAnim = useRef(new Animated.Value(1)).current;
  const promoSlideIndexRef = useRef(0);
  const [promoSlide, setPromoSlide] = useState(0);
  const lastActivityGestureRef = useRef(0);

  // Inizializza impostazioni Kiosk, sicurezza e catalogo prodotti per il salvaschermo
  const loadCatalogForScreensaver = useCallback(async () => {
    try {
      const [prods, cats, stg] = await Promise.all([
        getProducts().catch(() => [] as Product[]),
        getCategories().catch(() => [] as Category[]),
        getSettings().catch(() => null),
      ]);
      if (stg) setSettings(stg);
      const catMap: Record<string, string> = {};
      cats.forEach((c) => {
        catMap[c.id] = c.name;
      });
      setCategoriesMap(catMap);
      const availableWithImages = prods.filter((p) => p.available !== false && !!sanitizeImageUri(p.image));
      const featuredList = availableWithImages.filter((p) => (p as any).is_featured === true || (p as any).featured === true || (p as any).is_screensaver === true);
      // Se l'esercente ha selezionato prodotti con la stella ⭐ per lo screensaver, mostra solo quelli; altrimenti fallback su tutti
      setProducts(featuredList.length > 0 ? featuredList : availableWithImages);
    } catch (e) {
      // Ignora silenziosamente errori transitori di caricamento
    }
  }, []);

  useEffect(() => {
    initKiosk();
    loadCatalogForScreensaver();
  }, [initKiosk, loadCatalogForScreensaver]);

  useEffect(() => {
    if (screensaverActive) {
      loadCatalogForScreensaver();
    }
  }, [screensaverActive, loadCatalogForScreensaver]);

  // Gestione tocco universale
  const handleUniversalActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastActivityGestureRef.current < 250) return;
    lastActivityGestureRef.current = now;
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

  // Default fallback promo cards se non ci sono prodotti con immagini
  const promoCards = useMemo(
    () => [
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
    ],
    []
  );

  const totalSlides = products.length > 0 ? products.length : promoCards.length;

  // Orologio & Slideshow promozionale dinamico
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const promoTimer = setInterval(() => {
      Animated.sequence([
        Animated.timing(slideFadeAnim, {
          toValue: 0.15,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideFadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();

      promoSlideIndexRef.current = (promoSlideIndexRef.current + 1) % Math.max(1, totalSlides);
      setPromoSlide(promoSlideIndexRef.current);
    }, 4500);

    return () => {
      clearInterval(clockTimer);
      clearInterval(promoTimer);
    };
  }, [totalSlides, slideFadeAnim]);

  // Monitoraggio Inattività & Reset Automatico Carrello
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedSec = Math.floor((now - lastActivityTimestamp) / 1000);
      const isCustomerFlow = pathname && !pathname.startsWith('/admin') && pathname !== '/';

      // 1. Ritorno automatico alla home cliente
      if (
        isCustomerFlow &&
        config.autoReturnHomeOnInactivity &&
        config.autoReturnHomeTimeoutSec > 0 &&
        elapsedSec >= config.autoReturnHomeTimeoutSec
      ) {
        if (config.autoResetCartOnInactivity) {
          const cartItems = useCartStore.getState().items;
          if (cartItems.length > 0) {
            useCartStore.getState().clearCart();
          }
        }
        router.replace('/');
        recordActivity();
      }

      // 2. Attivazione Salvaschermo e Reset Lingua se il totem è inattivo
      if (
        config.inactivityTimeoutSec > 0 &&
        elapsedSec >= config.inactivityTimeoutSec &&
        !pathname?.startsWith('/admin')
      ) {
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

  // Timeout dedicato per garanzia salvaschermo
  useEffect(() => {
    if (!isInitialized || config.inactivityTimeoutSec <= 0 || pathname?.startsWith('/admin')) return;

    const elapsedMs = Date.now() - lastActivityTimestamp;
    const remainingMs = Math.max(0, config.inactivityTimeoutSec * 1000 - elapsedMs);
    const timer = setTimeout(() => {
      const runtime = useKioskStore.getState();
      if (runtime.screensaverActive || runtime.config.inactivityTimeoutSec <= 0) return;
      resetCustomerSessionLanguage();
      setActiveCustomerNightSession(false);
      runtime.triggerScreensaver();
    }, remainingMs + 50);

    return () => clearTimeout(timer);
  }, [
    isInitialized,
    config.inactivityTimeoutSec,
    lastActivityTimestamp,
    pathname,
    resetCustomerSessionLanguage,
  ]);

  // Calcolo oscuramento luminosità (Dimmer Overlay)
  const effectiveBrightness = dimmedActive || (nightDimmingActive && !activeCustomerNightSession && screensaverActive)
    ? 10
    : (config.brightnessLevel || 90);
  const dimmerOpacity = effectiveBrightness < 100 ? ((100 - effectiveBrightness) / 100) * 0.82 : 0;

  const restaurantName = settings?.restaurant_name || 'Totem Self-Service';
  const logo = settings?.logo;

  // Prodotto corrente nello slideshow
  const hasProducts = products.length > 0;
  const currentProduct = hasProducts ? products[promoSlide % products.length] : null;
  const currentCategory = currentProduct ? categoriesMap[currentProduct.category_id] : null;
  const currentProductImage = currentProduct ? sanitizeImageUri(currentProduct.image) : null;
  const fallbackCard = !hasProducts ? promoCards[promoSlide % promoCards.length] : null;

  return (
    <View
      style={styles.rootContainer}
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
            <View style={[styles.screensaverContent, isLandscape && styles.screensaverContentLandscape]}>
              {/* Header con Logo e Nome Ristorante */}
              <View style={styles.screensaverTopBar}>
                {logo ? (
                  <Image source={{ uri: logo }} style={styles.screensaverMiniLogo} resizeMode="contain" />
                ) : (
                  <View style={styles.screensaverMiniLogoPlaceholder}>
                    <Ionicons name="restaurant" size={20} color="#FF6B6B" />
                  </View>
                )}
                <Text style={styles.screensaverRestaurantName} numberOfLines={1}>
                  {restaurantName}
                </Text>
              </View>

              {/* Contenuto Slideshow Promozionale */}
              {hasProducts && currentProduct ? (
                <Animated.View
                  style={[
                    styles.productHeroCard,
                    isLandscape && styles.productHeroCardLandscape,
                    { opacity: slideFadeAnim },
                  ]}
                >
                  {/* Immagine Hero Prodotto con Badge Categoria */}
                  <View style={[styles.productImageWrapper, isLandscape && styles.productImageWrapperLandscape]}>
                    {currentProductImage ? (
                      <ExpoImage
                        source={{ uri: currentProductImage }}
                        style={styles.productImage}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <View style={styles.productImageFallback}>
                        <Ionicons name="fast-food" size={64} color="#64748B" />
                      </View>
                    )}
                    <View style={styles.productBadgeContainer}>
                      <Text style={styles.productCategoryBadge}>
                        {currentCategory ? `✨ ${currentCategory}` : '🔥 Specialità'}
                      </Text>
                    </View>
                  </View>

                  {/* Informazioni Prodotto & Prezzo */}
                  <View style={[styles.productInfoBox, isLandscape && styles.productInfoBoxLandscape]}>
                    <Text style={styles.productTitle} numberOfLines={2}>
                      {currentProduct.name}
                    </Text>

                    {currentProduct.description ? (
                      <Text style={styles.productDesc} numberOfLines={isLandscape ? 3 : 2}>
                        {currentProduct.description}
                      </Text>
                    ) : null}

                    <View style={styles.productPriceRow}>
                      <View style={styles.pricePill}>
                        <Text style={styles.priceCurrency}>€</Text>
                        <Text style={styles.priceValue}>{Number(currentProduct.price || 0).toFixed(2)}</Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              ) : fallbackCard ? (
                /* Fallback se non ci sono prodotti con immagini caricate */
                <Animated.View style={[styles.promoBox, { opacity: slideFadeAnim }]}>
                  <Text style={styles.promoBadge}>{fallbackCard.badge}</Text>
                  <Text style={styles.promoTitle}>{fallbackCard.title}</Text>
                  <Text style={styles.promoSub}>{fallbackCard.sub}</Text>
                </Animated.View>
              ) : null}

              {/* Pulsante Animato "TOCCA LO SCHERMO PER ORDINARE" */}
              <Animated.View
                style={[
                  styles.touchToStartBtn,
                  isLandscape && styles.touchToStartBtnLandscape,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <Ionicons name="hand-left" size={24} color="#FFFFFF" style={{ marginRight: 10 }} />
                <Text style={styles.touchToStartText}>{t('screensaver.touch_to_order') || 'TOCCA LO SCHERMO PER ORDINARE'}</Text>
              </Animated.View>

              {/* Indicatori Dots Slideshow */}
              {totalSlides > 1 && (
                <View style={styles.dotsContainer}>
                  {Array.from({ length: Math.min(totalSlides, 8) }).map((_, idx) => {
                    const isActive = (promoSlide % Math.min(totalSlides, 8)) === idx;
                    return (
                      <View
                        key={idx}
                        style={[styles.dotIndicator, isActive && styles.dotIndicatorActive]}
                      />
                    );
                  })}
                </View>
              )}
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
                <Text style={styles.touchClockText}>{t('screensaver.touch_to_order') || 'Tocca per iniziare ad ordinare'}</Text>
              </Animated.View>
            </View>
          )}

          {config.screensaverMode === 'dimmed' && (
            <View style={styles.dimmedContent}>
              <Animated.View style={{ opacity: pulseAnim, alignItems: 'center' }}>
                <Ionicons name="moon" size={48} color="#64748B" style={{ marginBottom: 12 }} />
                <Text style={styles.dimmedTitle}>Totem in Standby</Text>
                <Text style={styles.dimmedSub}>{t('screensaver.touch_to_wake') || 'Tocca lo schermo per riattivare'}</Text>
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
    backgroundColor: '#070B14',
    zIndex: 999999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screensaverContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    maxWidth: 580,
    width: '100%',
  },
  screensaverContentLandscape: {
    maxWidth: 820,
  },
  screensaverTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  screensaverMiniLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  screensaverMiniLogoPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screensaverRestaurantName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },

  // Hero Card Prodotto
  productHeroCard: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
    marginBottom: 20,
  },
  productHeroCardLandscape: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImageWrapper: {
    width: '100%',
    height: 260,
    position: 'relative',
    backgroundColor: '#1E293B',
  },
  productImageWrapperLandscape: {
    width: '46%',
    height: 230,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImageFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
  },
  productBadgeContainer: {
    position: 'absolute',
    top: 14,
    left: 14,
  },
  productCategoryBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  productInfoBox: {
    padding: 20,
    alignItems: 'center',
  },
  productInfoBoxLandscape: {
    flex: 1,
    padding: 22,
    alignItems: 'flex-start',
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  productDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  pricePill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  priceCurrency: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FCA5A5',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // Promo Box Fallback
  promoBox: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
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

  // Pulsante Touch to Order
  touchToStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 100,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
    width: '100%',
  },
  touchToStartBtnLandscape: {
    maxWidth: 460,
  },
  touchToStartText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  // Dots Indicator
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  dotIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dotIndicatorActive: {
    width: 20,
    backgroundColor: '#EF4444',
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
    fontSize: 68,
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
    marginBottom: 36,
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
