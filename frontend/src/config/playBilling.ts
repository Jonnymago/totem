/**
 * Configurazione di rilascio Google Play Billing.
 *
 * Product ID da creare in Play Console come abbonamenti mensili (base plan P1M).
 * Nessun piano annuale: Totem Mono 9,99 €/mese e Totem Multi 19,99 €/mese.
 * L'endpoint HTTPS verifica il purchase token con Google Play Developer API.
 */
export const PLAY_BILLING_CONFIG = {
  subscriptionProductIds: [
    'totem_mono_monthly',
    'totem_multi_monthly',
  ] as string[],
  /** Endpoint HTTPS che verifica il purchase token con Google Play Developer API. */
  verificationEndpoint: '',
};

export const LICENSE_PLANS = {
  mono: {
    productId: 'totem_mono_monthly',
    name: 'Totem Mono',
    priceLabel: '9,99 €',
    periodLabel: 'al mese',
    tagline: 'Funzioni base per un solo totem',
    features: [
      '1 totem (postazione singola)',
      '1 monitor cucina KDS',
      'Fino a 2 stampanti termiche',
      '1 vetrina TV',
      'Stampa scontrini e comande',
      'Backup locale e pannello remoto LAN',
    ],
  },
  multi: {
    productId: 'totem_multi_monthly',
    name: 'Totem Multi',
    priceLabel: '19,99 €',
    periodLabel: 'al mese',
    tagline: 'Funzioni avanzate per catene e multi-reparto',
    features: [
      'Totem illimitati (master + satellite)',
      'KDS illimitati con IP dedicato',
      'Stampanti illimitate e rinominabili',
      'Vetrine TV illimitate per categoria',
      'Sync catalogo e numerazione condivisa',
      'Tutte le funzioni avanzate multi-reparto',
    ],
  },
} as const;

export const hasPlayBillingConfiguration = () =>
  PLAY_BILLING_CONFIG.subscriptionProductIds.length > 0 &&
  PLAY_BILLING_CONFIG.verificationEndpoint.trim().startsWith('https://');
