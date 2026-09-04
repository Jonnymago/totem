# Totem — Contratto backend per Google Play Billing

**Stato:** predisposizione locale completata; integrazione Play Console e backend non configurata. Questo documento definisce il contratto che il servizio HTTPS deve soddisfare prima di valorizzare `frontend/src/config/playBilling.ts`.

## Principio di sicurezza

L’app Android **non concede mai un entitlement Premium** basandosi sul solo token acquistato, sullo stato del client o su AsyncStorage. Dopo un acquisto o un ripristino, invia il token a un backend HTTPS sotto il controllo dell’esercente. Il backend verifica il token con la Google Play Developer API e restituisce un entitlement attivo soltanto dopo esito positivo.

> Il service account Google e le sue chiavi rimangono esclusivamente nel backend. Non devono essere distribuiti nell’APK, nel repository, nella configurazione Expo o nel pannello remoto.

## Endpoint richiesto

| Campo | Valore richiesto |
|---|---|
| Metodo | `POST` |
| URL | HTTPS, controllato dall’esercente; da inserire in `PLAY_BILLING_CONFIG.verificationEndpoint` solo quando reale |
| Autenticazione verso Google | Service account con accesso limitato alla Play Developer API e collegato alla Play Console |
| API Google | `purchases.subscriptionsv2.get` oppure endpoint idoneo al tipo di prodotto configurato |
| Cache server | Stato entitlement associato a `purchaseToken`, prodotto, scadenza e ultimo evento RTDN |
| Idempotenza | Richieste ripetute con lo stesso token devono restituire lo stesso stato corrente |

### Corpo della richiesta app → backend

```json
{
  "purchaseToken": "token restituito da Google Play Billing",
  "productIds": ["id_prodotto_play_reale"],
  "orderId": "ordine Google Play se disponibile",
  "purchaseTime": 0,
  "deviceId": "id locale Totem",
  "packageName": "com.emergent.quickorderstation.eku1ku"
}
```

Il backend deve considerare il valore `packageName` un dato da verificare rispetto alla configurazione attesa; non deve fidarsi ciecamente di prodotto, ordine o stato inviati dal client.

### Risposta positiva backend → app

```json
{
  "valid": true,
  "active": true,
  "productId": "id_prodotto_play_reale",
  "planName": "Nome piano visualizzato",
  "activatedAt": "2026-08-28T00:00:00.000Z",
  "expiresAt": "2026-09-28T00:00:00.000Z",
  "features": {
    "unlimitedOrders": true,
    "kdsKitchen": true,
    "multiKds": false,
    "thermalPrinters": true,
    "remoteAdminLan": true,
    "cloudBackup": true
  }
}
```

La risposta deve avere `valid: true`, `active: true` e una `expiresAt` futura. Qualunque altro stato, risposta non JSON, errore HTTP o assenza di scadenza viene trattato dal client come **non verificato**.

### Risposta negativa o inattiva

Il backend deve restituire un HTTP 4xx/5xx appropriato oppure un oggetto con `valid: false` o `active: false` e un messaggio generico. Non deve restituire token Google, chiavi di servizio, dati completi dell’account o dettagli sensibili.

## Eventi e rinnovi

Configurare **Real-time Developer Notifications (RTDN)** su Pub/Sub affinché il backend aggiorni lo stato quando avvengono rinnovi, scadenze, annullamenti, revoche o cambi piano. L’evento RTDN è un segnale per richiedere nuovamente la risorsa alla Play Developer API: non va considerato da solo prova definitiva di entitlement.

| Situazione | Comportamento backend richiesto |
|---|---|
| Acquisto iniziale | Verifica token con API Google, salva stato e restituisce entitlement attivo solo se valido |
| Rinnovo / cambio piano | RTDN → lettura API Google → aggiornamento scadenza e funzioni |
| Annullamento / revoca / rimborso | RTDN → lettura API Google → disattivazione entitlement in cache server |
| Richiesta di riverifica app | Restituzione dello stato corrente verificato, non di quello dichiarato dal client |
| Token sconosciuto | Nessun entitlement; registrazione audit senza memorizzare il token nei log in chiaro |

## Cache offline nell’app

Dopo una risposta positiva, Totem conserva in `SecureStore` il token e uno **snapshot entitlement verificato**, con `lastVerifiedAt` e `offlineGraceUntil`. La cache è valida per il minore tra la scadenza Play e **72 ore** dall’ultima verifica riuscita. Non esiste alcuna concessione offline per token non verificati o per dati inseriti/modificati in AsyncStorage.

Alla riapertura della pagina Licenza e nei normali flussi di acquisto/ripristino, l’app tenta di riverificare Google Play e il backend. Un errore di rete non prolunga la finestra offline.

## Dati da fornire prima dell’attivazione

1. Product ID effettivi, base plan e offerte pubblicate in Play Console.
2. URL HTTPS definitivo dell’endpoint e specifica di autenticazione/monitoraggio.
3. Google Cloud project, Pub/Sub RTDN e service account con accesso Play Developer API.
4. App Play Console collegata al project e tester di Internal Testing.
5. Ambiente di test con almeno un acquisto sandbox verificabile end-to-end.

Fino alla disponibilità di questi dati, `subscriptionProductIds` e `verificationEndpoint` devono rimanere vuoti. L’app mostra lo stato **non configurato** e non presenta prodotti acquistabili.

## Riferimenti ufficiali

1. [Google Play Billing — Integrazione e test](https://developer.android.com/google/play/billing/integrate)
2. [Google Play Developer API — Verifica degli acquisti](https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptionsv2/get)
3. [Real-time Developer Notifications](https://developer.android.com/google/play/billing/rtdn-reference)
4. [Protezione del codice con R8](https://developer.android.com/build/shrink-code)
