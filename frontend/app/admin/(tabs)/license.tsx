import { useI18n } from '@/src/utils/i18n';
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getAvailablePlaySubscriptions,
  getLicenseInfo,
  purchasePlaySubscription,
  revalidateGooglePlayEntitlement,
  restoreGooglePlayPurchases,
  resetTrialForTesting,
  LicenseInfo,
} from '@/src/utils/license';
import { PlayBillingOffer, PlayBillingProduct } from '@/modules/play-billing';
import { LICENSE_PLANS } from '@/src/config/playBilling';
import { Text } from '@/src/components/LocalizedPrimitives';
import AdminHeader from '@/src/components/AdminHeader';

function formatBillingPeriod(period: string): string {
  const compact = (period || '').toUpperCase();
  if (compact === 'P1M') return 'al mese';
  if (compact === 'P1Y') return 'all’anno';
  if (compact === 'P1W') return 'a settimana';
  if (compact === 'P1D') return 'al giorno';
  return period || 'secondo le condizioni visualizzate da Google Play';
}

function offerSummary(offer: PlayBillingOffer): string {
  return offer.pricingPhases
    .map((phase) => `${phase.formattedPrice} ${formatBillingPeriod(phase.billingPeriod)}`)
    .join(' · ');
}

export default function LicenseCreditsScreen({ embedded }: { embedded?: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [playProducts, setPlayProducts] = useState<PlayBillingProduct[]>([]);
  const [billingConfigured, setBillingConfigured] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [billingMessage, setBillingMessage] = useState('Caricamento stato Google Play…');

  // Modali Legali
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms'>('privacy');

  useEffect(() => {
    loadLicenseData();
  }, []);

  const refreshPlayProducts = async () => {
    try {
      setLoadingProducts(true);
      const result = await getAvailablePlaySubscriptions();
      setBillingConfigured(result.configured);
      setPlayProducts(result.products);
      setBillingMessage(result.message);
    } catch (error: any) {
      setBillingConfigured(false);
      setPlayProducts([]);
      setBillingMessage(error?.message || 'Impossibile leggere il catalogo Google Play.');
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadLicenseData = async () => {
    try {
      setLoading(true);
      // Non sostituisce mai una licenza con dati client-side: la riverifica può
      // produrre un entitlement soltanto dopo Google Play + backend HTTPS.
      const revalidation = await revalidateGooglePlayEntitlement().catch(() => null);
      const info = revalidation?.license || await getLicenseInfo();
      setLicense(info);
    } catch (e) {
      console.warn('Errore caricamento dati licenza:', e);
    } finally {
      setLoading(false);
      void refreshPlayProducts();
    }
  };

  const handlePurchaseSubscription = async (product: PlayBillingProduct, offer: PlayBillingOffer) => {
    Alert.alert(t('Conferma abbonamento Google Play'), `${product.title}\n\nPrezzo e frequenza: ${offerSummary(offer)}.\n\nL’abbonamento si rinnova automaticamente secondo le condizioni Google Play finché non viene annullato. Puoi gestirlo o disdirlo dal Centro abbonamenti Google Play.`,
      [
        { text: t('Annulla'), style: 'cancel' },
        {
          text: 'Continua su Google Play',
          onPress: async () => {
            try {
              setProcessingPlan(product.productId);
              const res = await purchasePlaySubscription(product.productId, offer);
              if (res.success && res.license) {
                setLicense(res.license);
                Alert.alert(t('Abbonamento attivato'), res.message);
              } else {
                Alert.alert(t('Acquisto non completato'), res.message);
              }
            } catch (err: any) {
              Alert.alert(t('Errore acquisto'), err?.message || t('Operazione annullata.'));
            } finally {
              setProcessingPlan(null);
            }
          },
        },
      ]
    );
  };

  const handleManageSubscriptions = async () => {
    try {
      await Linking.openURL('https://play.google.com/store/account/subscriptions');
    } catch {
      Alert.alert(t('Google Play'), t('Apri il Centro abbonamenti Google Play dal tuo account per gestire o annullare il rinnovo.'));
    }
  };

  const handleRestore = async () => {
    try {
      setRestoring(true);
      const res = await restoreGooglePlayPurchases();
      if (res.success && res.license) {
        setLicense(res.license);
        Alert.alert(t('Ripristino Completato'), res.message);
      } else {
        Alert.alert(t('Nessun Abbonamento'), res.message);
      }
    } catch (e: any) {
      Alert.alert(t('Errore'), t('Impossibile completare il ripristino: ') + (e?.message || ''));
    } finally {
      setRestoring(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>{t(`Caricamento stato licenza...`)}</Text>
      </View>
    );
  }

  const isProActive = license?.status === 'active';
  const isTrial = license?.status === 'trial';
  const daysRemaining = license?.expiresAt
    ? Math.max(0, Math.ceil((new Date(license.expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;
  const expiryLabel = license?.expiresAt
    ? new Date(license.expiresAt).toLocaleDateString('it-IT')
    : 'Nessuna scadenza';
  const lastVerifiedLabel = license?.lastVerifiedAt
    ? new Date(license.lastVerifiedAt).toLocaleString('it-IT')
    : 'Non ancora verificata dal backend Play';
  const offlineGraceLabel = license?.offlineGraceUntil
    ? new Date(license.offlineGraceUntil).toLocaleString('it-IT')
    : 'Non disponibile';

  return (
    <View style={styles.container}>
      {!embedded && <AdminHeader
        title={t(`Licenza Totem`)}
        subtitle={t(`Stato attivazione, abbonamenti Google Play e conformità`)}
        emoji="📜"
        showBack={true}
        onBack={() => router.back()}
        showTotemButton={true}
        badge={{
          text: isProActive ? 'PRO ATTIVO' : isTrial ? 'PROVA ATTIVA' : 'PIANO FREE',
          variant: isProActive ? 'success' : isTrial ? 'warning' : 'default',
        }}
      />}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Card: Stato Attuale */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#2563EB" />
            <Text style={styles.cardTitle}>{t(`Stato Licenza Totem`)}</Text>
          </View>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isProActive
                    ? '#DCFCE7'
                    : isTrial
                    ? '#EFF6FF'
                    : '#FEE2E2',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  {
                    color: isProActive
                      ? '#15803D'
                      : isTrial
                      ? '#1D4ED8'
                      : '#DC2626',
                  },
                ]}
              >
                {isProActive
                  ? 'PRO ATTIVO'
                  : isTrial
                  ? `PERIODO DI PROVA (${daysRemaining} giorni rimasti)`
                  : 'LICENZA SCADUTA'}
              </Text>
            </View>

          </View>

          <View style={styles.infoMetaBox}>
            <Text style={styles.infoMetaText}>
              Dispositivo ID: {license?.deviceId || 'TOTEM-LOCAL-001'}
            </Text>
            <Text style={styles.infoMetaText}>
              Scadenza: {expiryLabel}
            </Text>
            {license?.isPlayStorePurchase ? (
              <>
                <Text style={styles.infoMetaText}>Ultima verifica backend Play: {lastVerifiedLabel}</Text>
                <Text style={styles.infoMetaText}>Cache offline valida fino a: {offlineGraceLabel}</Text>
              </>
            ) : null}
          </View>
        </View>

        {/* Card: Dettagli Prova Gratuita 7 Giorni */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="sparkles-outline" size={18} color="#D97706" />
            <Text style={styles.cardTitle}>{t(`Dettagli Prova Gratuita (7 Giorni)`)}</Text>
          </View>

          <View style={{ backgroundColor: '#FEF3C7', borderRadius: 12, padding: 12, gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#92400E' }}>{t(`
              ✨ Accesso Completo Totem Multi Incluso
            `)}</Text>
            <Text style={{ fontSize: 12, color: '#78350F', lineHeight: 18 }}>
              Durante i 7 giorni di prova hai a disposizione tutte le funzioni senza alcuna limitazione:{'\n'}
              • Ordini e comande illimitati{'\n'}
              • Monitor Cucina KDS LAN illimitati (fino a 99 schermi){'\n'}
              • Stampanti termiche ESC/POS illimitate con reparti{'\n'}
              • Tabellone TV Chiamate Ordini con sintesi vocale{'\n'}
              • Rete Multi-Totem Master / Satelliti{'\n'}
              • Pannello di controllo Web Admin da PC/Smartphone
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>
                {isTrial ? `Giorni di prova rimanenti: ${daysRemaining}` : 'Prova gratuita terminata'}
              </Text>
              <Text style={{ fontSize: 11, color: '#64748B' }}>{t(`
                Nessun addebito automatico. Al termine puoi attivare Totem Mono o Multi.
              `)}</Text>
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: '#F1F5F9',
                borderWidth: 1,
                borderColor: '#CBD5E1',
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 8,
              }}
              onPress={() => {
                Alert.alert(
                  'Ripristina Prova 7 Giorni',
                  'Vuoi riavviare il periodo di prova di 7 giorni per eseguire test e collaudi?',
                  [
                    { text: t('Annulla'), style: 'cancel' },
                    {
                      text: 'Riavvia Prova',
                      onPress: async () => {
                        try {
                          const refreshed = await resetTrialForTesting();
                          setLicense(refreshed);
                          Alert.alert(t('✅ Prova Ripristinata'), t('Hai a disposizione altri 7 giorni di prova completa Totem Multi!'));
                        } catch (err: any) {
                          Alert.alert(t('Errore'), err?.message || t('Impossibile ripristinare la prova.'));
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#334155' }}>{t(`Riavvia Prova`)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card: Abbonamenti Google Play. Le offerte sono sempre ProductDetails correnti. */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="ribbon-outline" size={18} color="#FF6B6B" />
            <Text style={styles.cardTitle}>{t(`Piani mensili Totem`)}</Text>
          </View>
          <Text style={styles.infoMetaText}>{t(`Solo abbonamento mensile. Nessun piano annuale. Totem Mono 9,99 € funzioni base, Totem Multi 19,99 € funzioni avanzate.`)}</Text>

          <View style={[styles.billingNotice, billingConfigured ? styles.billingNoticeReady : styles.billingNoticePending]}>
            <Ionicons name={billingConfigured ? 'shield-checkmark-outline' : 'information-circle-outline'} size={18} color={billingConfigured ? '#15803D' : '#92400E'} />
            <Text style={styles.billingNoticeText}>{billingMessage}</Text>
          </View>

          {loadingProducts ? (
            <View style={styles.billingLoadingRow}>
              <ActivityIndicator size="small" color="#E11D48" />
              <Text style={styles.infoMetaText}>{t(`Aggiornamento offerte Google Play…`)}</Text>
            </View>
          ) : null}

          <View style={styles.plansContainer}>
            {([LICENSE_PLANS.mono, LICENSE_PLANS.multi] as const).map((plan) => {
              const playProduct = playProducts.find((p) => p.productId === plan.productId);
              const monthlyOffer = playProduct?.offers.find((offer) =>
                offer.pricingPhases.some((phase) => (phase.billingPeriod || '').toUpperCase() === 'P1M')
                && !offer.pricingPhases.some((phase) => (phase.billingPeriod || '').toUpperCase() === 'P1Y')
              );
              const isCurrent = license?.plan === plan.productId || (license?.planName || '').toLowerCase().includes(plan.productId.includes('multi') ? 'multi' : 'mono');
              return (
                <View key={plan.productId} style={[styles.planCard, { flexDirection: 'column', alignItems: 'stretch' }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    {isCurrent ? <Text style={styles.planPeriod}>{t(`Attivo`)}</Text> : null}
                  </View>
                  <Text style={styles.planPrice}>{plan.priceLabel}</Text>
                  <Text style={styles.planPeriod}>{plan.periodLabel} · {plan.tagline}</Text>
                  {plan.features.map((item) => (
                    <Text key={item} style={styles.planFeatures}>• {item}</Text>
                  ))}
                  <Text style={styles.subscriptionDisclosure}>{t(`
                    Rinnovo automatico mensile. Gestisci o annulla dal Centro abbonamenti Google Play.
                  `)}</Text>
                  <TouchableOpacity
                    style={[styles.planActivateBtn, { alignSelf: 'flex-start', marginTop: 8 }]}
                    onPress={() => {
                      if (playProduct && monthlyOffer) {
                        handlePurchaseSubscription(playProduct, monthlyOffer);
                        return;
                      }
                      Alert.alert(
                        plan.name,
                        'Questo piano è ' + plan.priceLabel + ' al mese. Quando il prodotto Google Play sarà collegato, l’acquisto partirà da qui.'
                      );
                    }}
                    disabled={processingPlan === plan.productId}
                  >
                    {processingPlan === plan.productId ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.planActivateBtnText}>Attiva {plan.name}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          <View style={styles.billingActions}>
            <TouchableOpacity
              style={[styles.restoreBtn, !billingConfigured && styles.restoreBtnDisabled]}
              onPress={handleRestore}
              disabled={restoring || !billingConfigured}
            >
              {restoring ? (
                <ActivityIndicator size="small" color="#1E293B" />
              ) : (
                <Ionicons name="refresh-circle-outline" size={18} color="#1E293B" />
              )}
              <Text style={styles.restoreBtnText}>{t(`Ripristina acquisti`)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.restoreBtn} onPress={handleManageSubscriptions}>
              <Ionicons name="open-outline" size={18} color="#1E293B" />
              <Text style={styles.restoreBtnText}>{t(`Gestisci abbonamento`)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.refreshBillingBtn} onPress={() => { void refreshPlayProducts(); }} disabled={loadingProducts}>
              <Ionicons name="refresh-outline" size={16} color="#475569" />
              <Text style={styles.refreshBillingBtnText}>{t(`Aggiorna offerte`)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card: Documenti Legali & Privacy */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text-outline" size={18} color="#64748B" />
            <Text style={styles.cardTitle}>{t(`Conformità & Privacy`)}</Text>
          </View>

          <Text style={styles.legalText}>{t(`
            Consulta le informazioni operative su dati locali, accesso amministratore, conservazione delle comande e condizioni d&apos;uso del software.
          `)}</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <TouchableOpacity
              style={styles.legalBtn}
              onPress={() => {
                setLegalModalType('privacy');
                setShowLegalModal(true);
              }}
            >
              <Ionicons name="shield-outline" size={16} color="#1E293B" />
              <Text style={styles.legalBtnText}>{t(`Informativa Privacy`)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.legalBtn}
              onPress={() => {
                setLegalModalType('terms');
                setShowLegalModal(true);
              }}
            >
              <Ionicons name="reader-outline" size={16} color="#1E293B" />
              <Text style={styles.legalBtnText}>{t(`Termini di Servizio`)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modal Legale */}
      <Modal
        visible={showLegalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLegalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {legalModalType === 'privacy' ? 'Informativa Privacy' : 'Termini di Servizio'}
              </Text>
              <TouchableOpacity onPress={() => setShowLegalModal(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} contentContainerStyle={styles.legalModalContent}>
              {legalModalType === 'privacy' ? (
                <>
                  <Text style={styles.legalSectionTitle}>{t(`Dati trattati e finalità`)}</Text>
                  <Text style={styles.legalText}>{t(`
                    Totem QuickBite conserva sul tablet le configurazioni del locale, il catalogo, le preferenze operative e le comande necessarie al servizio. Questi dati sono usati esclusivamente per erogare le funzioni di ordinazione, cucina, stampa e amministrazione del totem.
                  `)}</Text>
                  <Text style={styles.legalSectionTitle}>{t(`Conservazione e accesso`)}</Text>
                  <Text style={styles.legalText}>{t(`
                    I dati restano localmente sul dispositivo finché l&apos;operatore non li modifica, esporta o cancella. Il pannello remoto è progettato per la rete locale: proteggi la rete Wi-Fi, le credenziali amministrative e il PIN di accesso.
                  `)}</Text>
                  <Text style={styles.legalSectionTitle}>{t(`Responsabilità del gestore`)}</Text>
                  <Text style={styles.legalText}>{t(`
                    Il titolare dell&apos;attività definisce le procedure di conservazione, informa il personale e gli utenti quando necessario e verifica l&apos;applicazione degli obblighi privacy pertinenti al proprio esercizio.
                  `)}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.legalSectionTitle}>{t(`Licenza d&apos;uso`)}</Text>
                  <Text style={styles.legalText}>{t(`
                    Totem QuickBite è destinato alla gestione di ordinazioni self-service, comande e stampe in un esercizio commerciale. L&apos;uso è consentito al personale autorizzato sul dispositivo associato alla licenza attiva.
                  `)}</Text>
                  <Text style={styles.legalSectionTitle}>{t(`Uso operativo sicuro`)}</Text>
                  <Text style={styles.legalText}>{t(`
                    Configura e verifica kiosk, stampanti, KDS, rete e pannello remoto prima dell&apos;uso in servizio. Mantieni il PIN riservato e non lasciare il pannello di amministrazione incustodito.
                  `)}</Text>
                  <Text style={styles.legalSectionTitle}>{t(`Aggiornamenti e assistenza`)}</Text>
                  <Text style={styles.legalText}>{t(`
                    Installa gli aggiornamenti dopo un controllo operativo e conserva un backup prima di modifiche importanti. Il gestore resta responsabile dell&apos;uso conforme alle procedure interne e ai requisiti applicabili.
                  `)}</Text>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingTop: Platform.OS === 'android' ? 24 : 44,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleCol: {
    flex: 1,
  },
  headerEmoji: {
    fontSize: 22,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  headerTotemBtn: {
    padding: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
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
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  infoMetaBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoMetaText: {
    fontSize: 11,
    color: '#64748B',
  },
  billingNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: 9,
    padding: 10,
  },
  billingNoticeReady: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  billingNoticePending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  billingNoticeText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: '#475569',
  },
  billingLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plansContainer: {
    gap: 8,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  planName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '900',
    color: '#E11D48',
    marginTop: 8,
  },
  planPeriod: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  planFeatures: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  subscriptionDisclosure: {
    fontSize: 10,
    lineHeight: 14,
    color: '#475569',
    marginTop: 7,
  },
  planActivateBtn: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  planActivateBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  billingActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  restoreBtn: {
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  restoreBtnDisabled: {
    opacity: 0.5,
  },
  refreshBillingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  refreshBillingBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  restoreBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  legalBtn: {
    flex: 1,
    minWidth: 130,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    borderRadius: 8,
  },
  legalBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalBody: {
    padding: 20,
  },
  legalModalContent: {
    paddingBottom: 24,
    gap: 8,
  },
  legalSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 8,
  },
  legalText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
});
