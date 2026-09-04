# Report di correzione — Totem

## Esito

Le regressioni individuate nel client Expo, nel server locale e nel pannello remoto sono state corrette nella working tree di `/home/ubuntu/Totem`. Le modifiche includono il ripristino dei flussi funzionali, l'allineamento dei contratti TypeScript, la rigenerazione del pannello remoto incorporato nell'app e la correzione delle risorse PNG che impedivano la build web.

| Segnalazione | Intervento applicato | Stato di verifica |
|---|---|---|
| Traduzione frontend | Il selettore lingua aggiorna subito lo stato dell'interfaccia e persiste la lingua nelle impostazioni. La guida espone nuovamente il selettore e usa le chiavi localizzate. | Verificato visivamente tra EN e IT nella home web. |
| Traduzione pannello remoto | Il runtime di localizzazione remoto conserva e applica la preferenza; il glossario locale rimane esposto alle schermate prodotto. | Verificato in compilazione; il pannello incorporato è stato rigenerato. |
| Modalità kiosk | I toggle nativi sono collegati ai metodi effettivi del modulo Android. Le configurazioni inviate dal pannello remoto passano ora dallo store reattivo, quindi vengono applicate subito. | Verificato tramite TypeScript e build web. |
| Difetti UI | Sono stati corretti contratti e proprietà non supportate sulle azioni delle schermate amministrative, con stati espliciti per KDS e privacy. | Verificato visivamente nelle impostazioni e categorie. |
| IP non visibile | Le impostazioni mostrano ora un riquadro con l'IP Wi-Fi rilevato, oltre all'URL remoto e al QR code. | Verificato visivamente nel fallback web; Android legge l'IP da `expo-network`. |
| Beep | È stato ripristinato il feedback nativo Android, aptico e WebAudio. Il comando remoto `/api/kiosk/beep` ora viene effettivamente inoltrato. | Verificato a livello di chiamate e bundle remoto. |
| Ordinamento categorie, ingredienti e gruppi | Aggiunte operazioni persistenti per categorie e gruppi, oltre a frecce di ordinamento per sezioni prodotto, ingredienti, salse, extra e opzioni. | Verificato visivamente per categorie e staticamente per tutte le schermate. |
| Monitor comande/KDS | Il toggle persiste subito. La schermata KDS ascolta gli aggiornamenti delle impostazioni e visualizza uno stato chiaro quando è disabilitata. | Verificato tramite TypeScript e resa web. |
| Numerazione ordini | Ripristinate le scelte **Automatico**, **Manuale** e **Mai**, l'orario di reset e l'azzeramento immediato. | Verificato visivamente nelle impostazioni. |
| Guida e manuale | Ricollegati alle traduzioni e al selettore lingua; i capitoli disponibili dal provider i18n vengono nuovamente visualizzati. | Verificato in compilazione. |
| Conformità e privacy | Aggiunto riepilogo visibile e contenuto nelle modali Privacy e Termini, con dati di licenza allineati al modello corrente. | Verificato tramite TypeScript. |
| Screensaver | Le azioni wake e screensaver del pannello remoto usano le route locali, aggiornano lo store e il wake riaccende anche il display nativo. | Verificato a livello di codice e compilazione. |

## Correzioni tecniche principali

Il server locale ora fornisce telemetria kiosk coerente, supporta gli alias amministrativi dei comandi e inoltra wake, screensaver, luminosità, ricarica e beep allo store kiosk. Il beep non è più una notifica simulata: il pannello remoto effettua la chiamata al dispositivo e può riportare un errore reale.

L'ordinamento delle categorie e dei gruppi assegna nuovamente indici contigui dopo spostamenti o eliminazioni e pubblica notifiche di aggiornamento per ri-renderizzare catalogo e schermate amministrative. Nell'editor prodotti le liste interne vengono riordinate senza perdere prezzo, nomi o vincoli di selezione.

La gestione licenza utilizza ora `expiresAt`, calcola i giorni residui e visualizza il contenuto informativo senza dipendere da proprietà inesistenti. La routine di backup evita inoltre di assegnare valori `null` a immagini opzionali.

## Verifiche eseguite

| Controllo | Esito |
|---|---|
| `npx tsc --noEmit` | Completato senza errori. |
| `npm run lint` | Nessun errore bloccante; rimangono 44 avvisi pre-esistenti/non bloccanti su variabili non utilizzate e dipendenze di hook. |
| `git diff --check` | Completato senza anomalie di whitespace. |
| `npx expo export --platform web` | Completato con successo. |
| Home cliente e cambio lingua | Verificati visivamente in browser, da EN a IT. |
| Impostazioni amministrative | Verificati visivamente IP, QR, KDS, reset automatico/manuale/mai e orario. |
| Categorie | Verificati visivamente posizione e comandi su/giù. |

## Nota sugli asset e sull'hardware

La build web era bloccata da immagini PNG corrotte: la firma binaria PNG era stata alterata. Le 19 risorse generate del progetto sono state rigenerate tramite lo script versionato e l'esportazione web ora termina correttamente.

> Beep, blocco kiosk, risveglio fisico dello schermo e modalità Device Owner richiedono una prova conclusiva su tablet Android con il modulo nativo installato. Il codice, i contratti e i bundle sono corretti; la verifica fisica non è eseguibile nel browser di sviluppo.

## File principali modificati

| Area | File |
|---|---|
| API e stato locale | `frontend/src/api/api.impl.ts`, `frontend/src/utils/LocalServer.ts` |
| Kiosk e schermo | `frontend/src/utils/kiosk.ts`, `frontend/src/store/kioskStore.ts`, `frontend/app/admin/(tabs)/kiosk.tsx` |
| Impostazioni e KDS | `frontend/app/admin/(tabs)/settings.tsx`, `frontend/app/admin/(tabs)/kitchen.tsx` |
| Catalogo e ordinamento | `frontend/app/admin/(tabs)/categories.tsx`, `groups.tsx`, `products.tsx` |
| Lingue e documentazione | `frontend/src/components/LanguageSelector.tsx`, `GuideHelper.tsx`, `license.tsx` |
| Pannello remoto | `backend/static/remote/index.html`, `frontend/src/utils/web_build.json` |
| Build e asset | `frontend/src/utils/updates.ts`, immagini in `frontend/assets/images` e `public/assets/images` |

