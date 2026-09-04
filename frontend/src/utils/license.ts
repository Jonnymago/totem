import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
  acknowledgeVerifiedPlayPurchase,
  PlayBillingOffer,
  PlayBillingProduct,
  PlayPurchase,
  queryActivePlaySubscriptions,
  queryPlaySubscriptions,
  startPlaySubscriptionPurchase,
} from '@/modules/play-billing';
import { PLAY_BILLING_CONFIG, hasPlayBillingConfiguration } from '@/src/config/playBilling';

const STORAGE_KEY_TRIAL = 'TOTEM_LICENSE_INFO_V2';
const STORAGE_KEY_DEVICE_ID = 'TOTEM_DEVICE_UUID_V2';
const STORAGE_KEY_PLAY_PURCHASE_TOKEN = 'TOTEM_PLAY_PURCHASE_TOKEN_V1';
const STORAGE_KEY_VERIFIED_ENTITLEMENT = 'TOTEM_PLAY_VERIFIED_ENTITLEMENT_V1';
const TRIAL_DURATION_DAYS = 7;
const PLAY_PURCHASED_STATE = 1;
const OFFLINE_ENTITLEMENT_GRACE_MS = 72 * 60 * 60 * 1000;

export interface LicenseInfo {
  status: 'active' | 'trial' | 'expired';
  plan: 'free_trial' | string;
  planName: string;
  deviceId: string;
  expiresAt: string | null;
  activatedAt: string | null;
  isPlayStorePurchase: boolean;
  /** Mai restituito al chiamante: il purchase token rimane esclusivamente in SecureStore. */
  playPurchaseToken?: never;
  /** Un entitlement attivo richiede sempre verifica HTTPS lato server. */
  verificationState: 'not_applicable' | 'verified' | 'pending' | 'unverified';
  /** Istante dell’ultima risposta attiva accettata dal backend HTTPS. */
  lastVerifiedAt?: string | null;
  /** Data massima di funzionamento offline di uno snapshot già verificato. */
  offlineGraceUntil?: string | null;
  features: {
    unlimitedOrders: boolean;
    kdsKitchen: boolean;
    multiKds: boolean;
    thermalPrinters: boolean;
    remoteAdminLan: boolean;
    cloudBackup: boolean;
    multiTotem: boolean;
    unlimitedPrinters: boolean;
    multiTv: boolean;
  };
}

export interface AvailableSubscriptionResult {
  success: boolean;
  configured: boolean;
  message: string;
  products: PlayBillingProduct[];
}

interface VerificationResponse {
  valid?: boolean;
  active?: boolean;
  planName?: string;
  productId?: string;
  expiresAt?: string | null;
  activatedAt?: string | null;
  features?: Partial<LicenseInfo['features']>;
  message?: string;
}

interface VerifiedEntitlementSnapshot extends LicenseInfo {
  lastVerifiedAt: string;
  offlineGraceUntil: string;
}

function trialExpiry(activatedAt: Date): Date {
  return new Date(activatedAt.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
}

function fullFeatures(): LicenseInfo['features'] {
  return {
    unlimitedOrders: true,
    kdsKitchen: true,
    multiKds: true,
    thermalPrinters: true,
    remoteAdminLan: true,
    cloudBackup: true,
    multiTotem: true,
    unlimitedPrinters: true,
    multiTv: true,
  };
}

function monoFeatures(): LicenseInfo['features'] {
  return {
    unlimitedOrders: true,
    kdsKitchen: true,
    multiKds: false,
    thermalPrinters: true,
    remoteAdminLan: true,
    cloudBackup: true,
    multiTotem: false,
    unlimitedPrinters: false,
    multiTv: false,
  };
}

function noPremiumFeatures(): LicenseInfo['features'] {
  return {
    unlimitedOrders: false,
    kdsKitchen: false,
    multiKds: false,
    thermalPrinters: false,
    remoteAdminLan: false,
    cloudBackup: false,
    multiTotem: false,
    unlimitedPrinters: false,
    multiTv: false,
  };
}

export function featuresForProductId(productId?: string | null): LicenseInfo['features'] {
  const id = String(productId || '').toLowerCase();
  if (id.includes('multi')) return fullFeatures();
  if (id.includes('mono')) return monoFeatures();
  return fullFeatures();
}

export function isMultiLicense(license: LicenseInfo | null | undefined): boolean {
  if (!license) return false;
  if (license.status === 'trial') return true;
  if (license.status !== 'active') return false;
  return Boolean(license.features.multiTotem || license.features.multiKds || license.features.multiTv);
}

function generateDeviceId(): string {
  const chars = '0123456789ABCDEF';
  const segment = (length: number) => Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `QKB-${segment(4)}-${segment(4)}-${segment(4)}`;
}

export async function getOrCreateDeviceId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY_DEVICE_ID);
    if (existing) return existing;
    const deviceId = generateDeviceId();
    await AsyncStorage.setItem(STORAGE_KEY_DEVICE_ID, deviceId);
    return deviceId;
  } catch {
    return 'QKB-TOTEM-LOCAL-001';
  }
}

function createTrial(deviceId: string, activatedAt = new Date()): LicenseInfo {
  return {
    status: 'trial',
    plan: 'free_trial',
    planName: `Prova gratuita (${TRIAL_DURATION_DAYS} giorni)`,
    deviceId,
    expiresAt: trialExpiry(activatedAt).toISOString(),
    activatedAt: activatedAt.toISOString(),
    isPlayStorePurchase: false,
    verificationState: 'not_applicable',
    lastVerifiedAt: null,
    offlineGraceUntil: null,
    features: fullFeatures(),
  };
}

function isFutureDate(value: string | null | undefined): boolean {
  if (!value) return false;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp > Date.now();
}

function dateMs(value: string | null | undefined): number {
  const timestamp = new Date(value || '').getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function createUnverifiedLicense(deviceId: string, activatedAt: string | null = null): LicenseInfo {
  return {
    status: 'expired',
    plan: 'play_subscription',
    planName: 'Verifica acquisto Google Play richiesta',
    deviceId,
    expiresAt: null,
    activatedAt,
    isPlayStorePurchase: false,
    verificationState: 'unverified',
    lastVerifiedAt: null,
    offlineGraceUntil: null,
    features: noPremiumFeatures(),
  };
}

function normalizeVerifiedSnapshot(value: Partial<VerifiedEntitlementSnapshot>, deviceId: string): VerifiedEntitlementSnapshot | null {
  if (
    value.status !== 'active' ||
    value.isPlayStorePurchase !== true ||
    value.verificationState !== 'verified' ||
    !value.lastVerifiedAt ||
    !value.offlineGraceUntil ||
    !isFutureDate(value.expiresAt)
  ) return null;

  return {
    status: 'active',
    plan: value.plan || 'play_subscription',
    planName: value.planName || 'Abbonamento Google Play',
    deviceId,
    expiresAt: value.expiresAt || null,
    activatedAt: value.activatedAt || null,
    isPlayStorePurchase: true,
    verificationState: 'verified',
    lastVerifiedAt: value.lastVerifiedAt,
    offlineGraceUntil: value.offlineGraceUntil,
    features: { ...fullFeatures(), ...(value.features || {}) },
  };
}

function canUseOfflineEntitlement(snapshot: VerifiedEntitlementSnapshot): boolean {
  const now = Date.now();
  const graceEnd = Math.min(dateMs(snapshot.offlineGraceUntil), dateMs(snapshot.expiresAt));
  return graceEnd > now && dateMs(snapshot.lastVerifiedAt) > 0;
}

async function readVerifiedEntitlement(deviceId: string): Promise<VerifiedEntitlementSnapshot | null> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY_VERIFIED_ENTITLEMENT);
    if (!raw) return null;
    return normalizeVerifiedSnapshot(JSON.parse(raw), deviceId);
  } catch (error) {
    console.warn('Errore lettura entitlement protetto:', error);
    return null;
  }
}

async function writeVerifiedEntitlement(entitlement: VerifiedEntitlementSnapshot): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY_VERIFIED_ENTITLEMENT, JSON.stringify(entitlement));
}

/**
 * Concede offline soltanto un entitlement già verificato dal backend HTTPS, conservato
 * in SecureStore e valido entro una finestra massima di 72 ore o fino alla scadenza Play.
 * AsyncStorage non viene mai considerato prova di un acquisto Google Play.
 */
export async function getLicenseInfo(): Promise<LicenseInfo> {
  const deviceId = await getOrCreateDeviceId();
  const verifiedSnapshot = await readVerifiedEntitlement(deviceId);
  if (verifiedSnapshot && canUseOfflineEntitlement(verifiedSnapshot)) {
    return verifiedSnapshot;
  }

  // Se il totem opera come satellite agganciato a un Master su LAN, eredita l'entitlement attivo del Master
  try {
    const rawMulti = await AsyncStorage.getItem('TOTEM_MULTI_CONFIG');
    if (rawMulti) {
      const multi = JSON.parse(rawMulti);
      if (multi?.role === 'satellite') {
        const rawMirror = await AsyncStorage.getItem('TOTEM_SATELLITE_LICENSE_MIRROR');
        if (rawMirror) {
          const mirror = JSON.parse(rawMirror);
          if (mirror?.status === 'active' || mirror?.status === 'trial') {
            return {
              status: mirror.status,
              plan: mirror.plan || 'master_inherited',
              planName: `Licenza Master (${mirror.planName || 'Attiva'})`,
              deviceId,
              expiresAt: mirror.expiresAt || null,
              activatedAt: mirror.activatedAt || null,
              isPlayStorePurchase: Boolean(mirror.isPlayStorePurchase),
              verificationState: 'verified',
              lastVerifiedAt: mirror.at || new Date().toISOString(),
              offlineGraceUntil: mirror.offlineGraceUntil || null,
              features: mirror.features || fullFeatures(),
            };
          }
        }
      }
    }
  } catch (error) {
    console.warn('Errore lettura licenza ereditata da Master:', error);
  }

  try {
    const rawTrial = await AsyncStorage.getItem(STORAGE_KEY_TRIAL);
    if (rawTrial) {
      const parsed = JSON.parse(rawTrial) as Partial<LicenseInfo>;
      if (parsed.plan === 'free_trial' && parsed.isPlayStorePurchase !== true) {
        const activatedAt = new Date(parsed.activatedAt || '');
        const validActivation = Number.isFinite(activatedAt.getTime()) ? activatedAt : new Date();
        const trial = createTrial(deviceId, validActivation);
        if (!isFutureDate(trial.expiresAt)) trial.status = 'expired';
        await AsyncStorage.setItem(STORAGE_KEY_TRIAL, JSON.stringify(trial));
        return trial;
      }
      // Una licenza Play legacy in AsyncStorage non può ottenere accesso: il suo token
      // potrà essere rivalidato unicamente tramite Google Play + backend HTTPS.
      return createUnverifiedLicense(deviceId, parsed.activatedAt || null);
    }
  } catch (error) {
    console.warn('Errore lettura prova locale:', error);
  }

  const trial = createTrial(deviceId);
  try {
    await AsyncStorage.setItem(STORAGE_KEY_TRIAL, JSON.stringify(trial));
  } catch (error) {
    console.warn('Errore salvataggio prova iniziale:', error);
  }
  return trial;
}

export async function resetTrialForTesting(): Promise<LicenseInfo> {
  const deviceId = await getOrCreateDeviceId();
  const trial = createTrial(deviceId, new Date());
  try {
    await AsyncStorage.setItem(STORAGE_KEY_TRIAL, JSON.stringify(trial));
  } catch (error) {
    console.warn('Errore salvataggio ripristino prova:', error);
  }
  return trial;
}

export async function getAvailablePlaySubscriptions(): Promise<AvailableSubscriptionResult> {
  if (!hasPlayBillingConfiguration()) {
    return {
      success: false,
      configured: false,
      message: 'Abbonamenti non ancora configurati: inserisci ID prodotto Play Console ed endpoint HTTPS di verifica.',
      products: [],
    };
  }
  const result = await queryPlaySubscriptions(PLAY_BILLING_CONFIG.subscriptionProductIds);
  return {
    success: result.ok,
    configured: true,
    message: result.message,
    products: result.products || [],
  };
}

async function verifyPurchaseOnServer(purchase: PlayPurchase): Promise<VerificationResponse> {
  const endpoint = PLAY_BILLING_CONFIG.verificationEndpoint.trim();
  if (!endpoint.startsWith('https://')) {
    throw new Error('Endpoint HTTPS di verifica acquisti non configurato.');
  }
  const deviceId = await getOrCreateDeviceId();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      purchaseToken: purchase.purchaseToken,
      productIds: purchase.products,
      orderId: purchase.orderId,
      purchaseTime: purchase.purchaseTime,
      deviceId,
      packageName: 'com.emergent.quickorderstation.eku1ku',
    }),
  });
  if (!response.ok) throw new Error(`Verifica acquisto non riuscita (${response.status}).`);
  const payload = await response.json() as VerificationResponse;
  if (payload.valid !== true || payload.active !== true) {
    throw new Error(payload.message || 'Google Play non ha confermato un abbonamento attivo.');
  }
  if (!payload.expiresAt || !isFutureDate(payload.expiresAt)) {
    throw new Error('Il server non ha restituito una scadenza valida per l’abbonamento.');
  }
  return payload;
}

async function persistVerifiedEntitlement(purchase: PlayPurchase): Promise<{ success: boolean; message: string; license?: LicenseInfo }> {
  if (purchase.purchaseState !== PLAY_PURCHASED_STATE) {
    return { success: false, message: 'L’acquisto è in attesa di pagamento o non è stato completato.' };
  }
  try {
    const verified = await verifyPurchaseOnServer(purchase);
    const deviceId = await getOrCreateDeviceId();
    const lastVerifiedAt = new Date();
    const subscriptionExpiry = new Date(verified.expiresAt || 0);
    const offlineGraceUntil = new Date(Math.min(subscriptionExpiry.getTime(), lastVerifiedAt.getTime() + OFFLINE_ENTITLEMENT_GRACE_MS));
    const entitlement: VerifiedEntitlementSnapshot = {
      status: 'active',
      plan: verified.productId || purchase.products[0] || 'play_subscription',
      planName: verified.planName || 'Abbonamento Google Play',
      deviceId,
      activatedAt: verified.activatedAt || lastVerifiedAt.toISOString(),
      expiresAt: verified.expiresAt || null,
      isPlayStorePurchase: true,
      verificationState: 'verified',
      lastVerifiedAt: lastVerifiedAt.toISOString(),
      offlineGraceUntil: offlineGraceUntil.toISOString(),
      features: { ...featuresForProductId(verified.productId || purchase.products[0]), ...(verified.features || {}) },
    };
    await SecureStore.setItemAsync(STORAGE_KEY_PLAY_PURCHASE_TOKEN, purchase.purchaseToken);
    await writeVerifiedEntitlement(entitlement);
    // Rimuove l’eventuale record legacy: AsyncStorage non è un contenitore entitlement.
    await AsyncStorage.removeItem(STORAGE_KEY_TRIAL);

    // L'acknowledgement avviene solo dopo verifica positiva lato server. Se il canale è
    // temporaneamente indisponibile, l’entitlement resta già verificato ma il bridge
    // potrà ritentare l’acknowledgement senza alterare la data di verifica.
    if (!purchase.isAcknowledged) {
      const acknowledgement = await acknowledgeVerifiedPlayPurchase(purchase.purchaseToken);
      if (!acknowledgement.ok) {
        return { success: true, message: 'Abbonamento verificato. La conferma a Google Play verrà ritentata automaticamente.', license: entitlement };
      }
    }
    return { success: true, message: 'Abbonamento verificato e attivato da Google Play.', license: entitlement };
  } catch (error: any) {
    return { success: false, message: error?.message || 'Impossibile verificare l’acquisto con il server.' };
  }
}

/** Avvia il checkout di una offerta ProductDetails già ricevuta da Google Play. */
export async function purchasePlaySubscription(productId: string, offer: PlayBillingOffer): Promise<{ success: boolean; message: string; license?: LicenseInfo }> {
  if (!hasPlayBillingConfiguration()) {
    return { success: false, message: 'Abbonamenti Google Play non configurati per questa build.' };
  }
  const purchaseResult = await startPlaySubscriptionPurchase(productId, offer.offerToken);
  if (!purchaseResult.ok) return { success: false, message: purchaseResult.message };
  const purchase = (purchaseResult.purchases || []).find((candidate) => candidate.purchaseState === PLAY_PURCHASED_STATE);
  if (!purchase) return { success: false, message: 'Google Play non ha restituito un acquisto completato.' };
  return persistVerifiedEntitlement(purchase);
}

/** Ripristina esclusivamente acquisti attivi letti da Google Play e verificati dal backend HTTPS. */
export async function restoreGooglePlayPurchases(): Promise<{ success: boolean; message: string; license?: LicenseInfo }> {
  if (!hasPlayBillingConfiguration()) {
    return { success: false, message: 'Ripristino non disponibile: configurazione Play Console o verifica HTTPS mancante.' };
  }
  const result = await queryActivePlaySubscriptions();
  if (!result.ok) return { success: false, message: result.message };
  const activePurchase = (result.purchases || []).find((purchase) => purchase.purchaseState === PLAY_PURCHASED_STATE);
  if (!activePurchase) return { success: false, message: 'Nessun abbonamento Google Play attivo rilevato su questo account.' };
  return persistVerifiedEntitlement(activePurchase);
}

/**
 * Quando l’app torna online o si apre la pagina Licenza, prova una nuova verifica server-side.
 * Un errore di rete non estende alcun diritto: resta valida solo l’eventuale cache già entro
 * il proprio limite offline; altrimenti l’utente vede lo stato non verificato.
 */
export async function revalidateGooglePlayEntitlement(): Promise<{ success: boolean; message: string; license?: LicenseInfo }> {
  if (!hasPlayBillingConfiguration()) {
    return { success: false, message: 'Riverifica Play non disponibile: configurazione non completata.' };
  }
  const token = await SecureStore.getItemAsync(STORAGE_KEY_PLAY_PURCHASE_TOKEN);
  if (!token) return { success: false, message: 'Nessun acquisto Google Play da riverificare su questo dispositivo.' };
  const result = await queryActivePlaySubscriptions();
  if (!result.ok) return { success: false, message: result.message || 'Google Play non raggiungibile.' };
  const purchase = (result.purchases || []).find((candidate) => candidate.purchaseToken === token && candidate.purchaseState === PLAY_PURCHASED_STATE)
    || (result.purchases || []).find((candidate) => candidate.purchaseState === PLAY_PURCHASED_STATE);
  if (!purchase) return { success: false, message: 'Nessun abbonamento Google Play attivo da riverificare.' };
  return persistVerifiedEntitlement(purchase);
}
