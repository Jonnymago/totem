# 🍔 Totem QuickBite

**Il Sistema di Ordinazioni e Cassa Self-Service Definitivo per la Ristorazione**

Totem QuickBite è una soluzione software e hardware integrata progettata specificamente per i totem digitali touch-screen nel settore della ristorazione. Basato su un solido paradigma **Local-First**, Totem QuickBite garantisce una continuità operativa totale, eliminando la dipendenza da connessioni Internet esterne e assicurando che il tuo locale non si fermi mai.

---

## ✨ Perché Scegliere Totem QuickBite?

*   **Zero Interruzioni:** Funziona al 100% offline. Il server locale integrato gestisce ordini, stampe e comunicazioni con la cucina anche in assenza di rete internet.
*   **Multilingua Dinamico:** Accogli clienti da tutto il mondo con un'interfaccia tradotta in 5 lingue (Italiano, Inglese, Francese, Spagnolo, Tedesco), con traduzione automatica temporanea durante l'ordine.
*   **Gestione Remota Semplificata:** Un pannello di controllo web accessibile da qualsiasi dispositivo nella stessa rete locale (smartphone, tablet, PC) per gestire il menu in tempo reale.
*   **Sicurezza Integrata:** Modalità Kiosk protetta, debouncing avanzato per evitare tocchi accidentali e linee guida anti-hacking integrate.

---

## 🚀 Funzionalità Principali

### 1. Interfaccia Cliente (Kiosk Mode)
*   **Catalogo Digitale Intuitivo:** Navigazione fluida per categorie merceologiche, con gestione avanzata di allergeni, varianti e personalizzazione degli ingredienti.
*   **Supporto Multilingua (Offline):** I clienti possono selezionare la lingua preferita per la loro sessione d'ordine. La lingua si resetta automaticamente al termine dell'ordine o per inattività.
*   **Carrello Intelligente e Reattivo:** Calcolo automatico in tempo reale di totali, IVA e sconti applicabili.
*   **Modalità di Servizio Flessibile:** Scelta rapida tra *Consumazione al Tavolo* e *Asporto*.
*   **Protezione Kiosk:** Sistema di debouncing per prevenire input multipli e blocco configurabile per evitare l'uscita non autorizzata dall'app.

### 2. Display Comande Cucina (KDS - Kitchen Display System)
*   **Ricezione Real-Time:** Notifiche immediate e visive dei nuovi ordini, senza necessità di aggiornare la pagina.
*   **Workflow Operativo Chiaro:** Gestione degli stati della comanda (*In attesa*, *In preparazione*, *Pronto*) per ottimizzare i tempi della cucina.
*   **Gestione Avanzata delle Code:**
    *   Reset automatico programmabile ad un orario prefissato (es. chiusura locale).
    *   Reset manuale con azzeramento della numerazione e svuotamento istantaneo della coda.

### 3. Pannello Admin Remoto (Web LAN)
*   **Controllo Totale dalla Rete Locale:** Accesso completo via browser da qualsiasi dispositivo connesso alla stessa rete WiFi/LAN del totem.
*   **Gestione Menu Completa:** Inserimento, modifica, cancellazione e riordinamento intuitivo (drag&drop o frecce) di prodotti, categorie e varianti.
*   **Glossario Multilingua Integrato:** Sistema di aggiornamento delle traduzioni offline del catalogo. Traduzione assistita automatica dal browser (tramite MyMemory API gratuita) con un solo clic.
*   **Reportistica e Sicurezza dei Dati:** Statistiche giornaliere di vendita chiare e sistema di snapshot per backup/ripristino istantaneo del database in locale.

### 4. Gestione Stampanti e Ricevute
*   **Supporto Universale ESC/POS:** Stampa fluida, automatica o manuale, su stampanti termiche di rete (LAN/WLAN), USB e Bluetooth.
*   **Tipologie di Stampa Ottimizzate:**
    *   **Scontrino Comanda:** Dettagliato e chiaro per i reparti cucina e bar.
    *   **Ricevuta Cliente:** Scontrino di cortesia (non fiscale) con il numero d'ordine in evidenza per il ritiro.

---

## 🛠️ Architettura e Stack Tecnologico

Totem QuickBite sfrutta le tecnologie più moderne per garantire prestazioni eccellenti su dispositivi Android.

| Componente | Tecnologie Utilizzate | Descrizione |
| :--- | :--- | :--- |
| **Kiosk Client** | React Native, Expo Router, TypeScript | Esecuzione nativa Android fluida e performante grazie a Hermes Engine. |
| **Styling & UI** | Tailwind CSS, NativeWind | Interfaccia touch-friendly, reattiva e con target minimi di 44px per un'usabilità ottimale. |
| **Microserver Locale** | Python (FastAPI / Uvicorn) | Server HTTP integrato nell'app per routing API locale, gestione socket e persistenza dati offline. |
| **Data Engine** | AsyncStorage + Snapshot Engine | Resilienza totale in assenza di cloud, con backup istantanei. |
| **CI / CD** | GitHub Actions + Expo EAS Build | Pipeline automatizzata per la compilazione dell'APK Android ad ogni push. |

---

## 📦 Struttura del Progetto

```text
├── .github/
│   └── workflows/
│       └── build-android.yml    # Workflow CI/CD per compilazione automatica APK su EAS
├── backend/
│   ├── server.py                # Server FastAPI e API di gestione core
│   └── static/remote/           # Interfaccia Web responsive del pannello Admin remoto
├── frontend/
│   ├── app/                     # Navigazione basata su file (Expo Router)
│   │   ├── (tabs)/              # Schermate principali Kiosk Cliente
│   │   └── admin/               # Impostazioni locali, KDS e configurazioni
│   ├── src/
│   │   ├── api/                 # Moduli di interscambio dati, glossario e sincronizzazione
│   │   └── utils/               # Gestione stampanti ESC/POS, server locale e storage
│   ├── app.json                 # Configurazione e manifest del progetto Expo
│   └── eas.json                 # Profili di build EAS (preview / release)
├── SECURITY_GUIDELINES.md       # Linee guida e best practices anti-hacking
└── metadata.json                # Metadati dell'applicazione
```

---

## ⚙️ Compilazione APK Android (EAS Build)

La repository è configurata per generare automaticamente l'APK Android ad ogni push sul branch `main` tramite GitHub Actions.

### Compilazione Manuale Locale
Se desideri compilare l'app localmente, assicurati di avere i seguenti prerequisiti:
1.  Node.js 20+
2.  EAS CLI installata globalmente:
    ```bash
    npm install -g eas-cli
    ```

Esegui i seguenti comandi:
```bash
cd frontend
npm install
eas build --platform android --profile preview
```

I file APK generati possono essere scaricati direttamente dalla dashboard del progetto su Expo:
👉 [Dashboard Progetto EAS - Totem QuickBite](https://expo.dev/accounts/cogoy23817s-teamq/projects/totem/builds)

---

## 🛡️ Sicurezza
Per garantire la massima protezione del tuo totem, consulta il file `SECURITY_GUIDELINES.md` incluso nella repository. Contiene le best practices essenziali per prevenire accessi non autorizzati e manomissioni.

---

## 👨‍💻 Crediti e Licenza
- **Sviluppato da:** Totem QuickBite
- **Repository Ufficiale:** [Jonnymago/totem](https://github.com/Jonnymago/totem)
- **Licenza:** Proprietary - Tutti i diritti riservati. Vietata la riproduzione o distribuzione non autorizzata.
