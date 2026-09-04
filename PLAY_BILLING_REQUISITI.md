# Requisiti Google Play Billing verificati

Consultazione effettuata il 27 agosto 2026 su documentazione ufficiale Android Developers.

| Ambito | Requisito da implementare/verificare |
|---|---|
| Versione libreria | Le nuove app e gli aggiornamenti devono usare Play Billing Library 8 o successiva dal 31 agosto 2026. La documentazione corrente indica `com.android.billingclient:billing-ktx:9.1.0`. |
| Connessione | Un solo `BillingClient`, `PurchasesUpdatedListener`, riconnessione automatica tramite `enableAutoServiceReconnection()`, gestione esiti `BillingResult`. |
| Catalogo | I piani vendibili devono essere letti con `queryProductDetailsAsync()` usando gli ID creati e attivi nella Play Console. Non devono essere mostrati prezzi statici come se fossero acquistabili. |
| Acquisto | Il flusso deve usare `launchBillingFlow()` con `ProductDetails` freschi e un offer token idoneo per la sottoscrizione. |
| Entitlement | Alla ricezione dell'acquisto, il token deve essere verificato su un backend sicuro prima di concedere l'accesso. L'app deve gestire anche gli acquisti pending e lo stato di rinnovo/cancellazione. |
| Acknowledgement | Gli acquisti completati devono essere acknowledged. Il frontend non può attestare da solo la validità commerciale di un token. |
| Ripristino | Il client deve interrogare gli acquisti attivi (`queryPurchasesAsync`) e il backend deve confermare l'entitlement associato al token. |
| Informativa abbonamento | Prima dell'acquisto devono risultare chiari prezzo locale, periodo/frequenza, rinnovo automatico, valore ricorrente, modalità di annullamento e accesso al Subscription Center. |
| Test reale | La dichiarazione di funzionamento richiede prodotto/sottoscrizione attivo, build in Internal testing e account license tester nella Play Console. |

## Vincoli del progetto

Al momento non sono disponibili accesso Play Console, ID prodotto/base plan/offer attivi né endpoint backend con credenziali Google Play Developer API. Il progetto precedente simulava l'attivazione in `AsyncStorage`, quindi non può essere descritto come integrazione Play Billing reale. Il codice sarà predisposto per il client nativo e non dovrà mai inventare ID, prezzi, token verificati o esiti di pagamento.

## Fonti

1. [Integrazione Google Play Billing](https://developer.android.com/google/play/billing/integrate)
2. [Note di rilascio Google Play Billing 9.1.0](https://developer.android.com/google/play/billing/release-notes)
3. [Gestione delle sottoscrizioni Google Play](https://developer.android.com/google/play/billing/subscriptions)

