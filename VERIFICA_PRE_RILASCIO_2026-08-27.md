# Totem — verifica pre-rilascio delle regressioni

**Data:** 27 agosto 2026  
**Stato di pubblicazione:** **bloccato**. Non sono stati eseguiti commit, push, OTA o build APK per questo ciclo di correzioni.  
**Autore:** Manus AI

## Esito sintetico

Le correzioni applicative, web e native sono state implementate nella working tree locale e sottoposte a controlli statici e prove visive nel browser. Le funzioni che richiedono un tablet Android e/o Google Play Console non possono essere dichiarate effettivamente funzionanti senza una build installata, prodotti pubblicati nel canale di test e verifica del backend. Questa distinzione è intenzionale: un esito non misurabile non è stato marcato come superato.

| Stato | Significato |
|---|---|
| **Superato** | Corretto e verificato in modo interattivo/visivo o compilato sul percorso coinvolto. |
| **Pronto per test fisico** | Codice e compilazione superati, ma richiede tablet Android con l'APK aggiornato. |
| **Bloccato da configurazione esterna** | Richiede risorse o credenziali non presenti nel repository e non deve essere simulato. |

## Esito dei 13 punti richiesti

| # | Richiesta | Correzione realizzata | Evidenza | Stato |
|---:|---|---|---|---|
| 1 | Rimuovere reset prova | Rimossi comando e logica UI raggiungibile di reset manuale. Lo stato trial non viene più azzerato dall'operatore. | Pagina Licenza verificata: nessun pulsante Reset trial/prova. | **Superato** |
| 2 | Rendere funzionante Traduzioni prodotti | Il comando aggiorna il glossario e mostra un pannello di esito persistente e chiudibile, non soltanto un avviso non osservabile. | Click reale: “Glossario aggiornato: 177 termini pronti in 5 lingue.” | **Superato** |
| 3 | Crea/Modifica prodotti | Modale rifatta con altezza vincolata alla viewport, corpo scrollabile e footer indipendente. | Modifica Margherita salvata, ricaricata e poi ripristinata dal backup. | **Superato nel browser; pronto per test fisico su Android** |
| 4 | Crea/Modifica categorie | Posizione mostrata in formato umano 1-based; validazione e footer affidabile. | Modifica Pizze salvata, ricaricata e poi ripristinata dal backup. | **Superato nel browser; pronto per test fisico su Android** |
| 5 | Crea/Modifica gruppi | Header/card responsive, modal body scrollabile, footer stabile e limiti delle frecce corretti. | Gruppo di prova creato, modificato, ricaricato e rimosso tramite restore completo. | **Superato nel browser; pronto per test fisico su Android** |
| 6 | Frecce su/giù prodotti | Aggiunti `order_index` e `moveProduct`, persistenti per categoria; frecce disabilitate ai limiti. | Margherita e Diavola scambiate, ordine confermato dopo reload, poi ripristinato. | **Superato** |
| 7 | Beep | Sostituito il solo tono di notifica con segnale PCM su stream multimediale e vibrazione di conferma; il remoto non dichiara più l'udibilità come certa. | Modulo Kotlin compilato. | **Pronto per test fisico** |
| 8 | Disallineamento Gruppi su smartphone | Testata, azioni e ricerca adattate a righe mobili; card e modale usano dimensioni della viewport. | Screenshot reale 390 × 844 px senza overflow superiore. | **Superato per UI web** |
| 9 | Guida/manuale in fondo a Licenza | `GuideHelper` rimosso dalle Impostazioni e montato dopo Licenza e Conformità/Privacy. | Pagina Licenza verificata con selettore lingua, filtri e 8 capitoli in fondo. | **Superato** |
| 10 | Immersive efficace | Immersive sticky e LockTask irrobustiti; le policy avanzate vengono applicate soltanto se esiste già un Device Owner. | Kotlin e manifest compilati. Android non consente a un'app ordinaria di auto-proclamarsi Device Owner. | **Pronto per test fisico** |
| 11 | Rimuovere banner Device Owner non attivo | Eliminati banner giallo e istruzioni/comando ADB dalla UI app e remota. | Entrambe le UI verificate visivamente senza banner. | **Superato** |
| 12 | Abbonamenti Play funzionanti e conformi | Nuovo modulo Android Play Billing 9.1.0: query ProductDetails, checkout, restore, verifica HTTPS obbligatoria, acknowledgement dopo verifica, token in SecureStore, link gestione Google Play e nessun prezzo/piano simulato. | Modulo autolinked e compilato; UI indica chiaramente configurazione mancante. | **Bloccato da Console/backend/test interno** |
| 13 | Pannello remoto allineato | UI Kiosk/Licenza aggiornata; endpoint LAN di riordino prodotti/categorie/gruppi e Licenza sicura; editor prodotto esteso con ingredienti, extra, combo e riordini; bundle rigenerato. | Bundle decodificato e validato sintatticamente; resa desktop e login mobile verificati. | **Superato per UI/bundle; pronto per prova LAN su APK** |

## Modifiche sostanziali

L'ordine dei prodotti è ora un dato persistente di catalogo, normalizzato per categoria e condiviso tra amministrazione, lato cliente e pannello remoto. Il comportamento delle categorie segue la stessa convenzione: all'operatore viene mostrato un indice da 1, mentre l'archiviazione interna può mantenere l'indice zero-based senza creare lo scarto osservato in precedenza.

Le tre modali di amministrazione sono state rese coerenti: dimensione legata allo schermo disponibile, contenuto scorrevole e azioni di chiusura/salvataggio esterne alla zona scorrevole. La prova interattiva ha coperto creazione/modifica di Gruppi, modifica di Categorie e modifica di Prodotti; ogni mutazione di test è stata effettuata con backup preventivo e ripristinata integralmente.

La Licenza non presenta più il reset di prova né piani statici venduti come effettivi. La UI carica offerte e prezzi soltanto dai `ProductDetails` che Google Play restituisce. Un entitlement viene attivato soltanto dopo esito positivo dell'endpoint HTTPS di verifica, e il purchase token non è più memorizzato nel record AsyncStorage ordinario.

> **Limite Android gestito:** Android non consente a una normale app installata di rendersi Device Owner autonomamente. Il blocco più completo di notifiche e system bar richiede provisioning enterprise/managed del dispositivo. L'app applica quindi LockTask e le relative policy solo quando il privilegio esiste già; non viene mostrato alcun banner operativo fuorviante.

## Controlli eseguiti

| Controllo | Esito |
|---|---|
| `npx tsc --noEmit` | Superato, nessun errore. |
| `npm run lint` | Superato, 0 errori e 43 warning non bloccanti/pre-esistenti. |
| `git diff --check` | Superato. |
| `npx expo export --platform web` | Superato; export completato. |
| Bundle pannello remoto | Rigenerato, decodificato e validato: una sezione JavaScript inline senza errori di sintassi. |
| Kotlin Kiosk + Play Billing | Superato: `:kiosk-mode:compileDebugKotlin`, `:play-billing:compileDebugKotlin` e `:app:processDebugMainManifest`. |
| Screenshot mobile app | Prodotti e Gruppi verificati a 390 × 844 px. |
| Screenshot mobile remoto | Login remoto verificato a 390 × 844 px. |

Le immagini di verifica locale sono conservate in `verification_assets/` e il registro dettagliato in `verification_notes.md`. Questi elementi non sono stati aggiunti a una pubblicazione.

## Verifica Google Play: ciò che resta necessario

Il codice adotta Play Billing Library **9.1.0** e implementa la sequenza richiesta: connessione a BillingClient, lettura dei ProductDetails dalla Console, avvio checkout con offer token, elaborazione dell'esito acquisto, verifica sicura lato server e acknowledgement dopo verifica. La documentazione Google corrente richiede per nuovi invii/aggiornamenti l'uso di Billing Library 8 o superiore a partire dal 31 agosto 2026; la libreria 9.1.0 adottata soddisfa questo requisito. [1] [2]

Per completare un test reale e poter contrassegnare il punto 12 come superato servono i dati che non possono essere inventati nel repository:

| Dato/azione richiesta | Motivo |
|---|---|
| Invito al progetto Play Console oppure ID abbonamenti + base plan/offer attivi | I Product IDs e gli offer token sono definiti solo in Play Console. |
| Endpoint HTTPS di verifica e service account/backend controllato dal titolare | La verifica purchase token deve avvenire fuori dall'app; nessun segreto Google è stato inserito nel client. |
| Release in **Internal testing** e account License Tester | È l'unico test valido per checkout, restore, rinnovo/cancellazione e acknowledgement. |
| Tablet Android fisico | Necessario per udibilità beep, system bars, notification shade, LockTask, wake/dim, auto-boot e URL/IP LAN. |

## Passo successivo proposto

È necessaria una nuova autorizzazione esplicita prima di qualsiasi pubblicazione. Dopo l'autorizzazione, il flusso corretto è: creare commit locale, push su `main` — che avvierà automaticamente il workflow OTA già configurato — e produrre l'APK GitHub Actions. L'APK potrà poi essere installato sul tablet per i test nativi e caricato in Internal Testing Play quando i dati di Console e backend saranno disponibili.

## Riferimenti

[1] [Google Play Billing — Integrazione](https://developer.android.com/google/play/billing/integrate)  
[2] [Google Play Billing — Abbonamenti](https://developer.android.com/google/play/billing/subscriptions)  
[3] [Google Play — Norme per gli abbonamenti](https://support.google.com/googleplay/android-developer/answer/9900533?hl=en)
