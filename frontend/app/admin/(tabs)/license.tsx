import React, { useEffect, useState } from 'react';
import { View, Text as NativeText, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getLicenseInfo,
  processPlayStoreSubscription,
  restoreGooglePlayPurchases,
  resetLicenseToTrial,
  PLAY_STORE_SUBSCRIPTIONS,
  LICENSE_TRIAL_DAYS,
  LicenseInfo,
} from '@/src/utils/license';
import { Text } from '@/src/components/LocalizedPrimitives';
import GuideHelper from '@/src/components/GuideHelper';

export default function LicenseCreditsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [license, setLicense] = useState<LicenseInfo | null>(null);

  // Modali Legali
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms'>('privacy');

  useEffect(() => {
    loadLicenseData();
  }, []);

  const loadLicenseData = async () => {
    try {
      setLoading(true);
      const info = await getLicenseInfo();
      setLicense(info);
    } catch (e) {
      console.warn('Errore caricamento dati licenza:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseSubscription = async (plan: (typeof PLAY_STORE_SUBSCRIPTIONS)[number]) => {
    Alert.alert(
      'Abbonamento Google Play',
      `Vuoi attivare il "${plan.name}" a ${plan.price} (${plan.period}) con addebito sul tuo account Google Play Store?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Conferma su Google Play',
          onPress: async () => {
            try {
              setProcessingPlan(plan.id);
              const res = await processPlayStoreSubscription(plan.id);
              if (res.success && res.license) {
                setLicense(res.license);
                Alert.alert('🎉 Abbonamento Attivato!', res.message);
              } else {
                Alert.alert('Errore Transazione', res.message);
              }
            } catch (err: any) {
              Alert.alert('Errore Pagamento', err?.message || 'Operazione annullata.');
            } finally {
              setProcessingPlan(null);
            }
          },
        },
      ]
    );
  };

  const handleRestore = async () => {
    try {
      setRestoring(true);
      const res = await restoreGooglePlayPurchases();
      if (res.success && res.license) {
        setLicense(res.license);
        Alert.alert('Ripristino Completato', res.message);
      } else {
        Alert.alert('Nessun Abbonamento Trovato', res.message);
      }
    } catch (e: any) {
      Alert.alert('Errore', 'Impossibile completare il ripristino: ' + (e?.message || 'errore sconosciuto'));
    } finally {
      setRestoring(false);
    }
  };

  const handleResetTrial = () => {
    Alert.alert(
      'Ripristina Prova',
      `Vuoi ripristinare il periodo di prova (${LICENSE_TRIAL_DAYS} giorni) per questo dispositivo?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Ripristina',
          style: 'destructive',
          onPress: async () => {
            const updated = await resetLicenseToTrial();
            setLicense(updated);
            Alert.alert('Reset Eseguito', 'Stato licenza reimpostato a periodo di prova.');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Caricamento stato licenza e abbonamenti...</Text>
      </View>
    );
  }

  const isProActive = license?.status === 'active';
  const isTrial = license?.status === 'trial';
  const isExpired = license?.status === 'expired';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* HEADER DELLA SCHERMATA */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={styles.headerIconBox}>
            <Ionicons name="ribbon" size={28} color="#FF6B6B" />
          </View>
          <View style={styles.headerTextBox}>
            <Text style={styles.headerTitle}>Licenza e Abbonamenti</Text>
            <Text style={styles.headerSubtitle}>Gestisci lo stato della prova e gli abbonamenti disponibili.</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.exitToTotemBtn}
          onPress={() => router.replace('/')}
        >
          <Ionicons name="storefront" size={18} color="white" />
          <Text style={styles.exitToTotemText}>Torna al Totem</Text>
        </TouchableOpacity>
      </View>

      {/* SEZIONE 1: STATO LICENZA ATTUALE */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="shield-checkmark" size={22} color="#2563EB" />
          <Text style={styles.cardTitle}>Stato Attivazione Dispositivo</Text>
        </View>

        <View style={styles.statusBox}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Stato Kiosk:</Text>
            {isProActive && (
              <View style={[styles.badge, styles.badgeActive]}>
                <Ionicons name="checkmark-circle" size={14} color="#166534" />
                <Text style={styles.badgeTextActive}>ABBONAMENTO ATTIVO</Text>
              </View>
            )}
            {isTrial && (
              <View style={[styles.badge, styles.badgeTrial]}>
                <Ionicons name="time" size={14} color="#854D0E" />
                <Text style={styles.badgeTextTrial}>PROVA GRATUITA ({LICENSE_TRIAL_DAYS} GG)</Text>
              </View>
            )}
            {isExpired && (
              <View style={[styles.badge, styles.badgeExpired]}>
                <Ionicons name="alert-circle" size={14} color="#991B1B" />
                <Text style={styles.badgeTextExpired}>PERIODO PROVA SCADUTO</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Piano Configurato:</Text>
            <Text style={styles.infoVal}>{license?.planName || 'Nessuno'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Kiosk Hardware ID:</Text>
            <Text style={[styles.infoVal, styles.mono]}>{license?.deviceId || 'SCONOSCIUTO'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Scadenza / Prossimo Rinnovo:</Text>
            <Text style={styles.infoVal}>
              {license?.expiresAt
                ? new Date(license.expiresAt).toLocaleDateString('it-IT', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })
                : 'Non disponibile'}
            </Text>
          </View>

          {license?.isPlayStorePurchase && (
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Metodo Pagamento:</Text>
              <Text style={[styles.infoVal, { color: '#0F172A' }]}>Google Play Store Billing</Text>
            </View>
          )}
        </View>

        {/* Pulsante Ripristina Acquisti Google Play */}
        <View style={styles.restoreRow}>
          <TouchableOpacity
            style={styles.restoreBtn}
            onPress={handleRestore}
            disabled={restoring}
          >
            {restoring ? (
              <ActivityIndicator size="small" color="#334155" />
            ) : (
              <>
                <Ionicons name="refresh" size={16} color="#334155" />
                <Text style={styles.restoreBtnText}>Ripristina Abbonamento Google Play</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetTrialBtn} onPress={handleResetTrial}>
            <Text style={styles.resetTrialBtnText}>Reset Prova</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SEZIONE 2: PIANI ABBONAMENTO GOOGLE PLAY */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="logo-google-playstore" size={22} color="#059669" />
          <Text style={styles.cardTitle}>Abbonamenti Google Play Store</Text>
        </View>
        <Text style={styles.sectionDesc}>
          Attiva o gestisci l'abbonamento con addebito sicuro tramite Google Play Store. Disdici in qualsiasi momento senza vincoli.
        </Text>

        {/* Filtri Piani */}
        <View style={styles.plansGrid}>
          {PLAY_STORE_SUBSCRIPTIONS.map((plan) => {
            const isSelected = license?.plan === plan.id;
            const isProcessing = processingPlan === plan.id;

            return (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  plan.badge ? styles.planCardFeatured : null,
                  isSelected ? styles.planCardSelected : null,
                ]}
              >
                {plan.badge && (
                  <View style={styles.planBadge}>
                    <Text style={styles.planBadgeText}>{plan.badge}</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planTarget}>{plan.target}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.planPrice}>{plan.price}</Text>
                    <Text style={styles.planPeriod}>{plan.period}</Text>
                  </View>
                  <Text style={styles.planDesc}>{plan.description}</Text>
                </View>

                <View style={styles.planFeatures}>
                  {plan.features.map((feat, idx) => (
                    <View key={idx} style={styles.featRow}>
                      <Ionicons name="checkmark-circle" size={15} color="#10B981" />
                      <Text style={styles.featText}>{feat}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.planActionBtn,
                    isSelected ? styles.planActionBtnActive : styles.planActionBtnPrimary,
                  ]}
                  onPress={() => handlePurchaseSubscription(plan)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'logo-google-playstore'}
                        size={18}
                        color="white"
                      />
                      <Text style={styles.planActionBtnText}>
                        {isSelected ? 'Abbonamento Attivo' : `Attiva su Google Play`}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Note Legali Google Play */}
        <View style={styles.playNotesBox}>
          <Ionicons name="information-circle-outline" size={18} color="#64748B" />
          <Text style={styles.playNotesText}>
            Gli abbonamenti si rinnovano automaticamente tramite il tuo account Google Play a meno che non vengano disdetti almeno 24 ore prima della scadenza. Puoi gestire o annullare l'abbonamento in qualsiasi momento dall'app Google Play &gt; Pagamenti e Abbonamenti.
          </Text>
        </View>
      </View>

      {/* SEZIONE 3: VERSIONE BUILD */}
      <View style={styles.buildFooter}>
        <Text style={styles.buildFooterText}>Totem QuickBite · Versione build v1.2.10</Text>
      </View>

      {/* SEZIONE 4: NOTE LEGALI, PRIVACY & CONFORMITÀ PLAY STORE */}
      <View style={[styles.card, styles.legalCard]}>
        <Text style={styles.legalNoticeTitle}>Note Legali & Conformità Google Play Store</Text>
        <Text style={styles.legalNoticeText}>
          Tutti i marchi citati appartengono ai rispettivi proprietari. L'applicazione non condivide dati sensibili di pagamento con terze parti non autorizzate. Gli abbonamenti in-app sono elaborati direttamente dai server sicuri di Google Play Billing.
        </Text>

        <View style={styles.legalButtonsRow}>
          <TouchableOpacity
            style={styles.legalLinkBtn}
            onPress={() => {
              setLegalModalType('privacy');
              setShowLegalModal(true);
            }}
          >
            <Ionicons name="document-text-outline" size={16} color="#4B5563" />
            <Text style={styles.legalLinkBtnText}>Informativa Privacy (GDPR)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.legalLinkBtn}
            onPress={() => {
              setLegalModalType('terms');
              setShowLegalModal(true);
            }}
          >
            <Ionicons name="reader-outline" size={16} color="#4B5563" />
            <Text style={styles.legalLinkBtnText}>Termini di Servizio (EULA)</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SEZIONE 7: GUIDA OPERATIVA COMPLETA & MANUALE IN 5 LINGUE */}
      <GuideHelper />

      {/* MODAL INFORMATIVE LEGALI */}
      <Modal
        visible={showLegalModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLegalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {legalModalType === 'privacy' ? 'Informativa sulla Privacy (GDPR)' : 'Termini di Servizio & Licenza d\'Uso'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowLegalModal(false)}
              >
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {legalModalType === 'privacy' ? (
                <View>
                  <Text style={styles.legalHeading}>1. Raccolta e Trattamento dei Dati</Text>
                  <Text style={styles.legalParagraph}>
                    Totem QuickBite opera secondo il principio Local-First: i dati di catalogo, prodotti, prezzi e comande vengono salvati esclusivamente nella memoria locale del terminale e sulla rete locale LAN. Nessun dato relativo alle comande o ai clienti viene venduto o trasmesso a server cloud esterni non autorizzati.
                  </Text>

                  <Text style={styles.legalHeading}>2. Gestione dei Pagamenti</Text>
                  <Text style={styles.legalParagraph}>
                    Gli abbonamenti digitali in-app sono gestiti integralmente da Google Play Billing. L'applicazione non ha accesso né memorizza carte di credito o coordinate bancarie.
                  </Text>

                  <Text style={styles.legalHeading}>3. Permessi Hardware</Text>
                  <Text style={styles.legalParagraph}>
                    L'app richiede l'accesso alla rete locale (WiFi) per consentire il collegamento con il display cucina KDS e il pannello remoto amministrativo, e l'accesso al Bluetooth per la connessione alle stampanti termiche ESC/POS.
                  </Text>

                  <Text style={styles.legalHeading}>4. Titolare del Trattamento</Text>
                  <Text style={styles.legalParagraph}>
                    Per qualsiasi informazione sulla gestione dei dati, contatta Totem QuickBite attraverso i canali di assistenza ufficiali.
                  </Text>
                </View>
              ) : (
                <View>
                  <Text style={styles.legalHeading}>1. Concessione della Licenza</Text>
                  <Text style={styles.legalParagraph}>
                    L'attivazione di Totem QuickBite conferisce una licenza d'uso per singolo terminale Kiosk touch-screen.
                  </Text>

                  <Text style={styles.legalHeading}>2. Rinnovi e Cancellazioni Abbonamento</Text>
                  <Text style={styles.legalParagraph}>
                    Gli abbonamenti Google Play Store si rinnovano automaticamente. È possibile gestire la cancellazione o la modifica del metodo di pagamento in qualsiasi momento direttamente dal proprio account Google Play.
                  </Text>

                  <Text style={styles.legalHeading}>3. Supporto Tecnico e Aggiornamenti</Text>
                  <Text style={styles.legalParagraph}>
                    Gli aggiornamenti software correttivi e le nuove funzionalità vengono rilasciati attraverso i canali di distribuzione dell'app.
                  </Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalAcceptBtn}
              onPress={() => setShowLegalModal(false)}
            >
              <Text style={styles.modalAcceptBtnText}>Ho Letto e Accetto</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  buildFooter: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 18,
  },
  buildFooterText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerTextBox: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  exitToTotemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  exitToTotemText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 13,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  b2bCard: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    marginBottom: 16,
  },
  statusBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
  },
  badgeTextActive: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
  },
  badgeTrial: {
    backgroundColor: '#FEF9C3',
    borderColor: '#FDE047',
    borderWidth: 1,
  },
  badgeTextTrial: {
    fontSize: 12,
    fontWeight: '800',
    color: '#854D0E',
  },
  badgeExpired: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
  },
  badgeTextExpired: {
    fontSize: 12,
    fontWeight: '800',
    color: '#991B1B',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoKey: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  infoVal: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
  },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: '#334155',
  },
  restoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    gap: 10,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  restoreBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  resetTrialBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  resetTrialBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterChipTextActive: {
    color: 'white',
  },
  plansGrid: {
    gap: 14,
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  planCardFeatured: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  planCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  planBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  planBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  planHeader: {
    marginBottom: 10,
  },
  planName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  planTarget: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
    marginTop: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 4,
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  planPeriod: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 4,
  },
  planDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  planFeatures: {
    gap: 6,
    marginVertical: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  featRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  planActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  planActionBtnPrimary: {
    backgroundColor: '#0F172A',
  },
  planActionBtnActive: {
    backgroundColor: '#2563EB',
  },
  planActionBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  playNotesBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  playNotesText: {
    flex: 1,
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  b2bContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
  },
  b2bHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 10,
  },
  b2bTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#92400E',
  },
  b2bSubtitle: {
    fontSize: 12,
    color: '#78350F',
    fontWeight: '600',
    marginTop: 2,
  },
  b2bPriceBox: {
    alignItems: 'flex-end',
  },
  b2bPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: '#92400E',
  },
  b2bPeriod: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '700',
  },
  b2bFeaturesList: {
    gap: 6,
    marginVertical: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#FEF3C7',
  },
  b2bFeatText: {
    fontSize: 12,
    color: '#78350F',
    fontWeight: '600',
  },
  b2bRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D97706',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 6,
  },
  b2bRequestBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '800',
  },
  serialInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  serialInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  serialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
  },
  serialBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
  },
  authorCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  authorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  authorRole: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
    marginBottom: 4,
  },
  authorDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  contactActions: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 16,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  techSpecs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  techSpecItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  techSpecLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  techSpecVal: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
    marginTop: 2,
  },
  legalCard: {
    backgroundColor: '#F8FAFC',
  },
  legalNoticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 4,
  },
  legalNoticeText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 12,
  },
  legalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  legalLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  legalLinkBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 550,
    maxHeight: '80%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 16,
  },
  legalHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
    marginBottom: 4,
  },
  legalParagraph: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 10,
  },
  modalAcceptBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalAcceptBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
  },
});
