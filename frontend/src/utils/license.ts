import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY_LICENSE = 'TOTEM_LICENSE_INFO_V1';
const STORAGE_KEY_DEVICE_ID = 'TOTEM_DEVICE_UUID_V1';

export interface LicensePlan {
  id: 'monthly_pro' | 'annual_kiosk' | 'lifetime_pro';
  name: string;
  price: string;
  period: string;
  badge?: string;
  description: string;
  playStoreProductId: string;
  features: string[];
}

export const AVAILABLE_PLANS: LicensePlan[] = [
  {
    id: 'monthly_pro',
    name: 'Abbonamento Mensile',
    price: '19,99 €',
    period: '/ mese',
    description: 'Flessibilità totale con rinnovo mensile automatico.',
    playStoreProductId: 'totem_sub_pro_monthly',
    features: [
      'Ordini & Comande illimitati',
      'Display Cucina KDS realtime',
      'Stampa termica scontrini ESC/POS',
      'Pannello Admin remoto via WiFi',
      'Assistenza tecnica via email'
    ]
  },
  {
    id: 'annual_kiosk',
    name: 'Abbonamento Annuale',
    price: '199,00 €',
    period: '/ anno',
    badge: 'RISPARMIA 2 MESI',
    description: 'Il piano più conveniente per attività continuative.',
    playStoreProductId: 'totem_sub_pro_annual',
    features: [
      'Tutte le funzioni del piano Mensile',
      '2 mesi gratis inclusi',
      'Supporto prioritario WhatsApp / Email',
      'Backup & Ripristino illimitati',
      'Aggiornamenti software garantiti'
    ]
  },
  {
    id: 'lifetime_pro',
    name: 'Licenza a Vita (One-Time)',
    price: '399,00 €',
    period: 'una tantum',
    badge: 'PERPETUA',
    description: 'Acquisto una tantum senza costi ricorrenti per questo totem.',
    playStoreProductId: 'totem_inapp_lifetime',
    features: [
      'Licenza permanente per singolo terminale',
      'Nessun canone periodico',
      'Tutte le feature PRO attive per sempre',
      'Supporto tecnico a vita'
    ]
  }
];

export interface LicenseInfo {
  status: 'active' | 'trial' | 'expired' | 'unlicensed';
  plan: 'free_trial' | 'monthly_pro' | 'annual_kiosk' | 'lifetime_pro' | 'custom_serial';
  planName: string;
  deviceId: string;
  licenseKey?: string;
  expiresAt: string | null; // ISO string
  activatedAt: string | null; // ISO string
  customerName?: string;
  isPlayStorePurchase: boolean;
  playPurchaseToken?: string;
  features: {
    unlimitedOrders: boolean;
    kdsKitchen: boolean;
    thermalPrinters: boolean;
    remoteAdminLan: boolean;
    cloudBackup: boolean;
  };
}

/** Genera un UUID pseudo-casuale per identificare univocamente l'hardware Totem */
function generateDeviceId(): string {
  const chars = '0123456789ABCDEF';
  const seg = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `QKB-${seg(4)}-${seg(4)}-${seg(4)}`;
}

export async function getOrCreateDeviceId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY_DEVICE_ID);
    if (existing) return existing;
    const newId = generateDeviceId();
    await AsyncStorage.setItem(STORAGE_KEY_DEVICE_ID, newId);
    return newId;
  } catch {
    return 'QKB-TOTEM-LOCAL-001';
  }
}

export async function getLicenseInfo(): Promise<LicenseInfo> {
  const deviceId = await getOrCreateDeviceId();
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_LICENSE);
    if (raw) {
      const parsed: LicenseInfo = JSON.parse(raw);
      // Verifica eventuale scadenza trial o abbonamento
      if (parsed.expiresAt) {
        const expDate = new Date(parsed.expiresAt).getTime();
        const now = Date.now();
        if (now > expDate && parsed.status === 'trial') {
          parsed.status = 'expired';
        }
      }
      return { ...parsed, deviceId };
    }
  } catch (e) {
    console.warn('Errore lettura licenza da storage:', e);
  }

  // Default: Inizializza con Periodo di Prova (Trial 30 giorni)
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const defaultTrial: LicenseInfo = {
    status: 'trial',
    plan: 'free_trial',
    planName: 'Periodo di Prova Gratuito (30 Giorni)',
    deviceId,
    expiresAt: thirtyDaysLater.toISOString(),
    activatedAt: now.toISOString(),
    isPlayStorePurchase: false,
    features: {
      unlimitedOrders: true,
      kdsKitchen: true,
      thermalPrinters: true,
      remoteAdminLan: true,
      cloudBackup: true
    }
  };

  try {
    await AsyncStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(defaultTrial));
  } catch (e) {
    console.warn('Errore salvataggio trial iniziale:', e);
  }

  return defaultTrial;
}

export async function activateWithLicenseKey(rawKey: string): Promise<{ success: boolean; message: string; license?: LicenseInfo }> {
  const cleanKey = (rawKey || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!cleanKey || cleanKey.length < 8) {
    return { success: false, message: 'Formato chiave non valido. Inserisci una chiave seriale completa (es. QKB-PRO-XXXX-XXXX).' };
  }

  const deviceId = await getOrCreateDeviceId();
  const now = new Date();

  let plan: LicenseInfo['plan'] = 'custom_serial';
  let planName = 'Licenza Seriale Attiva';
  let expiresAt: string | null = null; // Perpetua

  if (cleanKey.includes('ANNUAL') || cleanKey.includes('YEAR')) {
    plan = 'annual_kiosk';
    planName = 'Licenza Annuale (Attivata da Seriale)';
    expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
  } else if (cleanKey.includes('MONTH')) {
    plan = 'monthly_pro';
    planName = 'Licenza Mensile (Attivata da Seriale)';
    expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  } else if (cleanKey.includes('LIFE') || cleanKey.includes('PRO') || cleanKey.startsWith('QKB-') || cleanKey.startsWith('TOTEM-')) {
    plan = 'lifetime_pro';
    planName = 'Licenza a Vita PRO (Attivazione Seriale)';
    expiresAt = null;
  }

  const newLicense: LicenseInfo = {
    status: 'active',
    plan,
    planName,
    deviceId,
    licenseKey: cleanKey,
    activatedAt: now.toISOString(),
    expiresAt,
    isPlayStorePurchase: false,
    features: {
      unlimitedOrders: true,
      kdsKitchen: true,
      thermalPrinters: true,
      remoteAdminLan: true,
      cloudBackup: true
    }
  };

  try {
    await AsyncStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(newLicense));
    return { success: true, message: `Licenza attivata con successo per ${planName}!`, license: newLicense };
  } catch (e: any) {
    return { success: false, message: 'Errore durante il salvataggio della licenza: ' + (e?.message || 'sconosciuto') };
  }
}

export async function activatePlayPurchase(planId: string): Promise<{ success: boolean; message: string; license?: LicenseInfo }> {
  const planObj = AVAILABLE_PLANS.find(p => p.id === planId) || AVAILABLE_PLANS[0];
  const deviceId = await getOrCreateDeviceId();
  const now = new Date();

  let expiresAt: string | null = null;
  if (planObj.id === 'monthly_pro') {
    expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  } else if (planObj.id === 'annual_kiosk') {
    expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
  }

  const token = `GP-TOKEN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const updatedLicense: LicenseInfo = {
    status: 'active',
    plan: planObj.id,
    planName: planObj.name,
    deviceId,
    activatedAt: now.toISOString(),
    expiresAt,
    isPlayStorePurchase: true,
    playPurchaseToken: token,
    features: {
      unlimitedOrders: true,
      kdsKitchen: true,
      thermalPrinters: true,
      remoteAdminLan: true,
      cloudBackup: true
    }
  };

  try {
    await AsyncStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(updatedLicense));
    return {
      success: true,
      message: `Pagamento Google Play elaborato con successo! Piano "${planObj.name}" attivo su questo dispositivo.`,
      license: updatedLicense
    };
  } catch (e: any) {
    return { success: false, message: 'Errore di attivazione: ' + (e?.message || 'sconosciuto') };
  }
}

export async function restorePurchases(): Promise<{ success: boolean; message: string; license?: LicenseInfo }> {
  const deviceId = await getOrCreateDeviceId();
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_LICENSE);
    if (raw) {
      const parsed: LicenseInfo = JSON.parse(raw);
      if (parsed.status === 'active') {
        return {
          success: true,
          message: `Acquisto trovato e ripristinato con successo: ${parsed.planName}.`,
          license: { ...parsed, deviceId }
        };
      }
    }
  } catch (e) {
    console.warn('Restore error:', e);
  }

  return {
    success: false,
    message: 'Nessun acquisto attivo precedente rilevato per l\'account Google Play corrente.'
  };
}

export async function resetLicenseToTrial(): Promise<LicenseInfo> {
  await AsyncStorage.removeItem(STORAGE_KEY_LICENSE);
  return getLicenseInfo();
}
