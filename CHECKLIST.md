# Checklist Correzioni Totem QuickBite

## 1. Difetti visibili dagli screenshot forniti dall'utente:
- [ ] Screenshot 1 (Impostazioni): Il titolo della pagina è ancora "Totem QuickOrder Remote Admin" (dovrebbe essere Totem QuickBite).
- [ ] Screenshot 1 (Impostazioni): La "Posizione Trigger Segreto" ha ancora l'opzione "Angolo Alto a Destra" e non è stata rinominata in "In Alto Centrale" (Richiesta 8).
- [ ] Screenshot 2 (Licenza & Info): Mostra "Licenza Pro Attiva" e "Totem Kiosk Pro Unlimited" con "Validità: Perpetua". Questi piani andavano rimossi (Richiesta 5).
- [ ] Screenshot 3 (Impostazioni/Backup): Il titolo è "Totem QuickOrder Remote Admin".
- [ ] Screenshot 4 (Prodotti): Mostra "Errore aggiornamento glossario: PLEASE SELECT TWO DISTINCT LANGUAGES". L'aggiornamento traduzioni offline è rotto.
- [ ] Screenshot 4 (Prodotti): Il pulsante per le traduzioni è in francese "Mettre à jour les traductions hors ligne" ma il resto della UI mescola italiano ("Mostrati 35 di 35", "Prodotti prodotti", "Ricerca traduzioni in corso: 163 nuovi testi..."). Multilingua rotto.
- [ ] Tutti gli screenshot: La barra di navigazione superiore (Prodotti, Categorie, Gruppi, ecc.) ha le icone schiacciate o non sembra "scorrevole da dx a SX" come richiesto (Richiesta 13).

## 2. Bug segnalato dall'utente (Nuovo):
- [ ] Traduzione momentanea: Il timeout scatta troppo presto, impedendo al cliente di fare l'ordine. Deve basarsi su un timer di inattività reale legato ai click (Kiosk Inactivity Timer).

## 3. Revisione 22 richieste originali:
- [ ] 1. IP Kiosk LAN dinamico (da verificare).
- [ ] 2. Modalità kiosk dedicata non funziona (da verificare rimozione).
- [ ] 3. Rimuovere kiosk verticale/orizzontale (da verificare).
- [ ] 4. Rimuovere Giovanni Priolo, sostituire con Totem QuickBite (da verificare backend/frontend).
- [ ] 5. Togliere licenza a vita, piano 179€, piano 19.99€ (FALLITO, visibile in screenshot).
- [ ] 6. Prova gratuita 7 giorni (da verificare).
- [ ] 7. Schermo intero immersivo (da verificare).
- [ ] 8. Trigger segreto "In Alto Centrale" (FALLITO, visibile in screenshot).
- [ ] 9. Frecce su/giù per categorie/prodotti in remoto (da verificare).
- [ ] 10. Lingua settabile in remoto browser (FALLITO, UI mista).
- [ ] 11. Sezione licenza remoto browser (da verificare).
- [ ] 12. Togliere rigo url server personalizzato (da verificare).
- [ ] 13. Barra menu remoto scorrevole (FALLITO/DUBBIO).
- [ ] 14. Pulsante test stampe da remoto (da verificare).
- [ ] 15. Togliere 'tipo di prodotto' (da verificare).
- [ ] 16. Pulsante comande (kds) da remoto (da verificare).
- [ ] 17. Guida manuali (86) (da verificare).
- [ ] 18. Lingua sistema automatica all'installazione (da verificare).
- [ ] 19. Pulizia info tecniche licenza (da verificare).
- [ ] 20. Togliere github (da verificare).
- [ ] 21. Togliere attivazione codice seriale (da verificare).
- [ ] 22. Consigli hacking (Completato in SECURITY_GUIDELINES.md).

## Verifica Frontend (Kiosk App)

- **Avvio e Dipendenze:** L'errore TypeScript in `i18n.ts` dovuto a una proprietà mancante è stato corretto. Tutti i testi della guida sono stati uniformati in IT, EN, ES, FR e DE, rimuovendo le opzioni di licenza B2B e i riferimenti all'autore.
- **Flusso Cliente & Inattività:** La logica di ripristino della lingua in `KioskManager.tsx` (riga 117) chiude la sessione linguistica del cliente *esclusivamente* quando scatta il timeout di inattività che avvia il salvaschermo, come richiesto, evitando ripristini prematuri.

- **Test web frontend:** La home cliente compila e si apre correttamente. Durante l'interazione con il selettore lingua francese, però, il browser è passato a una pagina vuota invece di restare nel flusso d'ordine. Il comportamento richiede diagnosi: è una regressione rilevata nel test diretto e non verrà considerata risolta finché il flusso non sarà stabile.
- **Diagnosi selettore lingua web:** Il selettore francese è presente come elemento interattivo React Native Web. La simulazione di click non modifica però la lingua visualizzata; il problema sembra quindi collocarsi nel percorso di aggiornamento dello stato i18n o nel listener React, non nel timer di inattività.

- **Lingua Cliente e Trigger:** È stato rimosso il reset automatico della lingua cliente al rendering della home, che impediva di selezionare una lingua temporanea senza essere immediatamente resettata. Inoltre, la posizione predefinita del trigger segreto per l'amministratore è stata corretta a `top-center` ("In Alto Centrale").
- **Test reale lingua temporanea:** Dopo la correzione, il francese resta selezionato nella home e persiste entrando in `/categories`; il reset immediato è risolto. Il test ha tuttavia rivelato una non conformità: i titoli delle categorie sono tradotti ma alcune descrizioni del catalogo restano in italiano. Occorre applicare il traduttore menu anche alle descrizioni delle categorie, non solo ai nomi.
- **Test prodotti cliente:** Nella categoria Panini, il titolo del prodotto viene tradotto ma le descrizioni complete restano in italiano. Il componente applica correttamente il traduttore; il glossario iniziale deve quindi includere anche frasi descrittive comuni del catalogo demo e continuare a essere ampliato dal pannello remoto per i prodotti personalizzati.
- **Riesito del test frontend in francese:** Dopo l'estensione del glossario, le categorie, le descrizioni delle categorie, i titoli dei prodotti e le descrizioni complete dei prodotti demo risultano tutti tradotti offline nel flusso cliente.
- **Test ritorno alla Home:** Dopo aver completato la navigazione nelle categorie e nei prodotti in francese, premendo due volte il tasto "Indietro" si ritorna alla Home page. In quel momento la sessione cliente viene terminata e l'interfaccia si ripristina correttamente alla lingua di sistema (inglese in questo caso). Il comportamento della lingua temporanea è ora perfettamente conforme alla richiesta.
- **Test Backend:** Avviato il server FastAPI locale e testato con successo l'API seed (creazione admin), l'autenticazione JWT, la persistenza delle impostazioni, la creazione di categorie e prodotti (menu), la sottomissione di un ordine, e le API kiosk/hardware (status, config, test-print). Nessun difetto riscontrato, la comunicazione MongoDB e i flussi critici sono intatti.
