# 🍔 Totem QuickBite - Sistema Ordinazioni & Cassa Self-Service

Soluzione software e hardware integrata per totem digitali touch-screen dedicati alla ristorazione. Progettato con paradigma **Local-First**, garantisce continuità operativa totale anche in caso di assenza temporanea di connessione Internet esterna.

---

## 🚀 Funzionalità Principali

### 1. Interfaccia Cliente (Kiosk Mode)
- **Catalogo Digitale:** Navigazione fluida per categorie merceologiche, allergeni, varianti e personalizzazione ingredienti.
- **Supporto Multilingua (Offline):** I clienti possono selezionare la lingua preferita (Italiano, Inglese, Francese, Spagnolo, Tedesco) per la sessione d'ordine, senza bisogno di rete internet.
- **Carrello Reattivo:** Calcolo automatico di totali, IVA e sconti.
- **Modalità di Servizio:** Scelta tra *Consumazione al Tavolo* e *Asporto*.
- **Sicurezza Kiosk:** Protezione da input multipli (debouncing) e blocco configurabile.

### 2. Display Comande Cucina (KDS)
- **Ricezione Real-Time:** Notifiche immediate di nuovi ordini senza necessità di refresh.
- **Workflow Operativo:** Stati comanda (*In attesa*, *In preparazione*, *Pronto*).
- **Reset Giornaliero & Manuale:**
  - Reset automatico programmabile ad orario prefissato (es. `06:00`).
  - Reset manuale con azzeramento numerazione e svuotamento istantaneo della coda cucina.

### 3. Pannello Admin Remoto (Web LAN)
- **Controllo da Rete Locale:** Accesso via browser da qualsiasi smartphone, tablet o PC connesso alla stessa rete WiFi/LAN del totem.
- **Gestione Menu:** Inserimento, modifica, cancellazione e riordinamento di prodotti, categorie e varianti.
- **Glossario Multilingua Integrato:** Aggiornamento delle traduzioni offline del catalogo (IT, EN, FR, ES, DE) con traduzione assistita automatica dal browser.
- **Reportistica & Backup:** Statistiche giornaliere di vendita e snapshot di backup/ripristino database in locale.

### 4. Gestione Stampanti & Ricevute
- **Supporto ESC/POS:** Stampa automatica o manuale su stampanti termiche di rete (LAN), USB e Bluetooth.
- **Tipologie di Stampa:**
  - Scontrino di comanda dettagliato per i reparti cucina/bar.
  - Ricevuta di cortesia per il cliente finale con numero d'ordine evidenziato.

---

## 🛠️ Architettura e Stack Tecnologico

| Layer | Tecnologie Utilizzate | Note Operative |
| :--- | :--- | :--- |
| **Kiosk Client** | React Native, Expo Router, TypeScript | Esecuzione nativa Android su Hermes Engine |
| **Styling & UI** | Tailwind CSS / NativeWind | UI touch-friendly con target minimi di 44px |
| **Microserver Locale** | Python (FastAPI / Uvicorn) + Local Embedded HTTP | Routing API locale, gestione socket e persistenza |
| **Data Engine** | Local Storage Asincrono + Snapshot Engine | Resilienza totale in assenza di cloud |
| **CI / CD** | GitHub Actions + Expo EAS Build | Compilazione automatica APK Android |

---

## 📦 Struttura del Progetto

```text
├── .github/
│   └── workflows/
│       └── build-android.yml    # Workflow CI/CD per compilazione APK su EAS
├── backend/
│   ├── server.py                # Server FastAPI e API di gestione
│   └── static/remote/           # Interfaccia Web responsive del pannello Admin remoto
├── frontend/
│   ├── app/                     # Navigazione basata su file (Expo Router)
│   │   ├── (tabs)/              # Schermate Kiosk Cliente
│   │   └── admin/               # Impostazioni locali e Display Cucina KDS
│   ├── src/
│   │   ├── api/                 # Moduli di interscambio dati e sincronizzazione
│   │   └── utils/               # Gestione stampanti, server locale e storage
│   ├── app.json                 # Configurazione progetto Expo
│   └── eas.json                 # Profili di build EAS (preview / release)
└── metadata.json                # Metadati dell'applicazione
```

---

## ⚙️ Compilazione APK Android (EAS Build)

### Prerequisiti
- Node.js 20+
- EAS CLI installata globalmente:
  ```bash
  npm install -g eas-cli
  ```

### Build APK Preview (Standalone Android)
```bash
cd frontend
eas build --platform android --profile preview
```

I build artefatti generati possono essere scaricati direttamente dalla dashboard di Expo:
👉 [Dashboard Progetto EAS](https://expo.dev/accounts/cogoy23817s-teamq/projects/totem/builds)

---

## 👨‍💻 Autori e Crediti

- **Azienda:** Totem QuickBite
- **Repository Ufficiale:** [Totem QuickBite](https://github.com/Jonnymago/totem)
- **Licenza:** Proprietary - Tutti i diritti riservati
