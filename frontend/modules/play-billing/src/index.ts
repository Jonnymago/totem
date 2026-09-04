import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

export interface PlayBillingPricingPhase {
  formattedPrice: string;
  billingPeriod: string;
  recurrenceMode: string;
  priceAmountMicros: string;
  priceCurrencyCode: string;
}

export interface PlayBillingOffer {
  offerToken: string;
  basePlanId: string;
  offerId: string;
  pricingPhases: PlayBillingPricingPhase[];
}

export interface PlayBillingProduct {
  productId: string;
  title: string;
  description: string;
  offers: PlayBillingOffer[];
}

export interface PlayPurchase {
  purchaseToken: string;
  products: string[];
  orderId: string;
  purchaseState: number;
  isAcknowledged: boolean;
  purchaseTime: string;
}

export interface PlayBillingResult {
  ok: boolean;
  code: string;
  message: string;
  products?: PlayBillingProduct[];
  purchases?: PlayPurchase[];
  unavailableProducts?: Array<{ productId: string; responseCode: number }>;
}

interface PlayBillingNativeModule {
  isAvailable(): Promise<boolean>;
  querySubscriptions(productIds: string[]): Promise<PlayBillingResult>;
  startSubscriptionPurchase(productId: string, offerToken?: string): Promise<PlayBillingResult>;
  queryActiveSubscriptions(): Promise<PlayBillingResult>;
  acknowledgePurchase(purchaseToken: string): Promise<PlayBillingResult>;
}

let nativeModule: PlayBillingNativeModule | null = null;
try {
  if (Platform.OS === 'android') nativeModule = requireNativeModule('TotemPlayBilling');
} catch {
  nativeModule = null;
}

const unavailable = (message: string, code = 'BILLING_UNAVAILABLE'): PlayBillingResult => ({
  ok: false,
  code,
  message,
  products: [],
  purchases: [],
});

export async function isPlayBillingAvailable(): Promise<boolean> {
  if (!nativeModule) return false;
  try {
    return await nativeModule.isAvailable();
  } catch {
    return false;
  }
}

export async function queryPlaySubscriptions(productIds: string[]): Promise<PlayBillingResult> {
  if (Platform.OS !== 'android') return unavailable('Gli acquisti Google Play sono disponibili soltanto nell’app Android installata dal canale Play.');
  if (!nativeModule) return unavailable('Questa build Android non include ancora il modulo Google Play Billing.');
  try {
    return await nativeModule.querySubscriptions(productIds);
  } catch (error: any) {
    return unavailable(error?.message || 'Impossibile leggere i prodotti Google Play.', 'QUERY_FAILED');
  }
}

export async function startPlaySubscriptionPurchase(productId: string, offerToken?: string): Promise<PlayBillingResult> {
  if (!nativeModule) return unavailable('Questa build Android non include ancora il modulo Google Play Billing.');
  try {
    return await nativeModule.startSubscriptionPurchase(productId, offerToken);
  } catch (error: any) {
    return unavailable(error?.message || 'Impossibile avviare l’acquisto Google Play.', 'PURCHASE_FAILED');
  }
}

export async function queryActivePlaySubscriptions(): Promise<PlayBillingResult> {
  if (!nativeModule) return unavailable('Questa build Android non include ancora il modulo Google Play Billing.');
  try {
    return await nativeModule.queryActiveSubscriptions();
  } catch (error: any) {
    return unavailable(error?.message || 'Impossibile leggere gli acquisti esistenti.', 'RESTORE_FAILED');
  }
}

/** Da invocare solo dopo la verifica positiva del token su backend sicuro. */
export async function acknowledgeVerifiedPlayPurchase(purchaseToken: string): Promise<PlayBillingResult> {
  if (!nativeModule) return unavailable('Questa build Android non include ancora il modulo Google Play Billing.');
  try {
    return await nativeModule.acknowledgePurchase(purchaseToken);
  } catch (error: any) {
    return unavailable(error?.message || 'Impossibile confermare l’acquisto.', 'ACKNOWLEDGE_FAILED');
  }
}
