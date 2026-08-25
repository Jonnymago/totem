import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_LICENSE = 'TOTEM_LICENSE_INFO_V2';
const STORAGE_KEY_DEVICE_ID = 'TOTEM_DEVICE_UUID_V2';
const TRIAL_DURATION_DAYS = 7;

export type LicensePlanId = 'basic_monthly' | 'basic_annual';

export interface LicensePlan {
  id: LicensePlanId;
  name: string;
  category: 'base';
  target: string;
  price: string;
  rawPrice: number;
  period: string;
  badge?: string;
  description: string;
  playStoreProductId: string;
  features: string[];
}

/** I piani commerciali attualmente disponibili. */
export const PLAY_STORE_SUBSCRIPTIONS: LicensePlan[] = [
  {
    id: 'basic_monthly',
    name: 'Piano Base Totem',
    category: 'base',
    target: 'Ideale per singola postazione (Pizzerie, Bar, Chioschi)',
    price: '9,99 €',
    rawPrice: 9.99,
    period: '/ mese',
    description: 'Gestione completa per singolo totem con rinnovo mensile.',
    playStoreProductId: 'totem_sub_basic_monthly',
    features: [
      '1 postazione Totem touch-screen',
      'Ordini e comande illimitati',
      '1 display cucina KDS in tempo reale',
      'Stampa scontrini termici ESC/POS',
      'Pannello amministrativo remoto in rete locale',
    ],
  },
  {
    id: 'basic_annual',
    name: 'Piano Base Annuale',
    category: 'base',
    target: 'Il più scelto dai piccoli ristoratori (2 mesi gratis)',
    price: '89,00 €',
    rawPrice: 89.0,
    period: '/ anno',
    badge: 'RISPARMIA 2 MESI',
    description: 'Solo circa 7,40 € al mese con fatturazione annuale.',
    playStoreProductId: 'totem_sub_basic_annual',
    features: [
      'Tutte le funzionalità del Piano Base',
      '2 mesi gratuiti inclusi',
      'Backup e ripristino illimitati',
      'Aggiornamenti software inclusi',
    ],
  },
];

export interface LicenseInfo {
  status: 'active' | 'trial' | 'expired';
  plan: 'free_trial' | LicensePlanId;
  planName: string;
  deviceId: string;
  expiresAt: string | null;
  activatedAt: string | null;
  isPlayStorePurchase: boolean;
  playPurchaseToken?: string;
  features: {
    unlimitedOrders: boolean;
    kdsKitchen: boolean;
    multiKds: boolean;
    thermalPrinters: boolean;
    remoteAdminLan: boolean;
    cloudBackup: boolean;
  };
}

function trialExpiry(activatedAt: Date): Date {
  return new Date(activatedAt.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
}

function fullFeatures(): LicenseInfo['features'] {
  return {
    unlimitedOrders: true,
    kdsKitchen: true,
    multiKds: false,
    thermalPrinters: true,
    remoteAdminLan: true,
    cloudBackup: true,
  };
}

/** Genera un identificatore locale dell'installazione. Non è una chiave di attivazione. */
function generateDeviceId(): string {
  const chars = '0123456789ABCDEF';
  const segment = (length: number) =>
    Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
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

function isSupportedPlan(value: unknown): value is LicensePlanId {
  return value === 'basic_monthly' || value === 'basic_annual';
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
    features: fullFeatures(),
  };
}

/**
 * Legge lo stato della licenza. I vecchi piani rimossi vengono riportati alla
 * prova gratuita; non esistono più attivazioni tramite seriale o licenze a vita.
 */
export async function getLicenseInfo(): Promise<LicenseInfo> {
  const deviceId = await getOrCreateDeviceId();
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_LICENSE);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LicenseInfo>;
      const now = Date.now();

      if (parsed.status === 'active' && isSupportedPlan(parsed.plan)) {
        const restored: LicenseInfo = {
          status: 'active',
          plan: parsed.plan,
          planName: PLAY_STORE_SUBSCRIPTIONS.find((plan) => plan.id === parsed.plan)?.name || 'Piano Base Totem',
          deviceId,
          expiresAt: parsed.expiresAt || null,
          activatedAt: parsed.activatedAt || null,
          isPlayStorePurchase: Boolean(parsed.isPlayStorePurchase),
          playPurchaseToken: parsed.playPurchaseToken,
          features: { ...fullFeatures(), ...(parsed.features || {}) },
        };
        return restored;
      }

      const activatedAt = parsed.activatedAt ? new Date(parsed.activatedAt) : new Date();
      const validActivatedAt = Number.isNaN(activatedAt.getTime()) ? new Date() : activatedAt;
      const trial = createTrial(deviceId, validActivatedAt);
      if (new Date(trial.expiresAt as string).getTime() <= now) {
        trial.status = 'expired';
      }
      await AsyncStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(trial));
      return trial;
    }
  } catch (error) {
    console.warn('Errore lettura licenza da storage:', error);
  }

  const trial = createTrial(deviceId);
  try {
    await AsyncStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(trial));
  } catch (error) {
    console.warn('Errore salvataggio prova iniziale:', error);
  }
  return trial;
}

/**
 * Registra localmente l'esito della sottoscrizione già confermata dal canale di
 * vendita. La verifica lato server del token di acquisto resta obbligatoria in produzione.
 */
export async function processPlayStoreSubscription(
  planId: LicensePlanId,
): Promise<{ success: boolean; message: string; license?: LicenseInfo }> {
  const plan = PLAY_STORE_SUBSCRIPTIONS.find((candidate) => candidate.id === planId);
  if (!plan) {
    return { success: false, message: 'Piano di abbonamento non disponibile.' };
  }

  const deviceId = await getOrCreateDeviceId();
  const now = new Date();
  const durationDays = plan.id === 'basic_monthly' ? 30 : 365;
  const license: LicenseInfo = {
    status: 'active',
    plan: plan.id,
    planName: plan.name,
    deviceId,
    activatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
    isPlayStorePurchase: true,
    features: fullFeatures(),
  };

  try {
    await AsyncStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(license));
    return {
      success: true,
      message: `Abbonamento registrato: ${plan.name}.`,
      license,
    };
  } catch (error: any) {
    return { success: false, message: 'Errore di salvataggio: ' + (error?.message || 'sconosciuto') };
  }
}

/** Ripristina lo stato dell'abbonamento disponibile sul dispositivo. */
export async function restoreGooglePlayPurchases(): Promise<{
  success: boolean;
  message: string;
  license?: LicenseInfo;
}> {
  const license = await getLicenseInfo();
  if (license.status === 'active' && license.isPlayStorePurchase) {
    return {
      success: true,
      message: `Abbonamento ripristinato: ${license.planName}.`,
      license,
    };
  }
  return {
    success: false,
    message: 'Nessun abbonamento attivo rilevato su questo dispositivo.',
  };
}

export async function resetLicenseToTrial(): Promise<LicenseInfo> {
  await AsyncStorage.removeItem(STORAGE_KEY_LICENSE);
  return getLicenseInfo();
}

export const LICENSE_TRIAL_DAYS = TRIAL_DURATION_DAYS;
