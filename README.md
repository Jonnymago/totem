# 🍔 Totem QuickBite

**Il Sistema di Ordinazioni e Cassa Self-Service Definitivo per la Ristorazione**

Totem QuickBite è una soluzione software e hardware integrata progettata specificamente per i totem digitali touch-screen nel settore della ristorazione. Basato su un solido paradigma **Local-First**, Totem QuickBite garantisce una continuità operativa totale, eliminando la dipendenza da connessioni Internet esterne e assicurando che il tuo locale non si fermi mai.

---

## ✨ Funzionalità Multilingua e Traduzioni

L'applicazione è interamente tradotta in **5 lingue (Italiano, Inglese, Francese, Spagnolo, Tedesco)**, coprendo ogni singolo aspetto del sistema:
*   **App Nativa:** Tutti i testi, le schermate, il salvaschermo e la guida integrata sono tradotti al 100%.
*   **Pannello Remoto:** L'interfaccia web di gestione (categorie, prodotti, impostazioni) è completamente localizzata.
*   **Stampe e Scontrini:** Le ricevute per i clienti e le comande per la cucina rispettano la lingua selezionata o quella di sistema.
*   **Traduttore Temporaneo per Clienti:** I clienti possono selezionare la loro lingua dalla Home. I prodotti vengono tradotti momentaneamente per la sessione d'ordine, per poi tornare automaticamente alla lingua di sistema al termine dell'ordine o per inattività.
*   **Glossario Offline Aggiornabile:** Le traduzioni dei prodotti vengono salvate localmente. Tramite il pannello remoto, è possibile aggiornare il glossario offline con un clic: il sistema sfrutta un motore di traduzione automatica per generare i testi mancanti, salvandoli nel database locale per rendere il totem completamente indipendente da Internet durante l'uso.

---

## 🚀 Funzionalità Principali e Correzioni Recenti

Il sistema è stato recentemente aggiornato con **22 correzioni e implementazioni chiave**:

### 1. Interfaccia Cliente (Kiosk Mode)
*   **Branding:** Nessun riferimento personale, l'app è marchiata esclusivamente **Totem QuickBite**.
*   **Navigazione Intuitiva:** Catalogo fluido, senza scelte intermedie superflue (combo di base per tutti i prodotti).
*   **Lingua Automatica:** All'installazione, l'app adotta automaticamente la lingua di sistema.
*   **Orientamento Libero:** Rimozione di blocchi verticali/orizzontali forzati, lasciando gestire l'orientamento al dispositivo.
*   **Modalità Immersiva:** Supporto a schermo intero corretto per i dispositivi Android.

### 2. Pannello Admin Remoto (Web LAN)
*   **IP LAN Dinamico:** Riconoscimento e connessione corretta all'IP reale del dispositivo.
*   **Barra Scorrevole:** Interfaccia ottimizzata con barra di navigazione (pagine prodotti, categorie, ecc.) scorrevole lateralmente.
*   **Riordinamento Facile:** Aggiunte frecce su/giù per riordinare comodamente categorie e prodotti direttamente dal browser.
*   **Multilingua Remoto:** Possibilità di cambiare lingua anche dal pannello web.
*   **Stampe di Test:** Pulsante per eseguire stampe di prova direttamente dal browser remoto.
*   **Sezione Comande (KDS):** Aggiunto il pulsante per accedere alla gestione comande anche da remoto.

### 3. Gestione Licenze e Sicurezza
*   **Piani Semplificati:** Solo due opzioni: Base mensile (9,99€) e Base annuale (89€). Rimosse licenze a vita, seriali e B2B.
*   **Prova Gratuita:** Periodo di prova ridotto a 7 giorni.
*   **Pulizia UI:** Rimosse informazioni tecniche superflue (architettura, runtime) dalla sezione licenze, lasciando solo la versione della build in basso.
*   **Sicurezza:** Inclusione del documento `SECURITY_GUIDELINES.md` con best practices anti-hacking.
*   **Trigger Segreto:** Rinominato il titolo del menu nascosto in "In Alto Centrale".

---

## 🛠️ Architettura e Stack Tecnologico

| Componente | Tecnologie Utilizzate | Descrizione |
| :--- | :--- | :--- |
| **Kiosk Client** | React Native, Expo Router, TypeScript | Esecuzione nativa Android fluida e performante. |
| **Styling & UI** | Tailwind CSS, NativeWind | Interfaccia touch-friendly e reattiva. |
| **Microserver Locale** | Python (FastAPI / Uvicorn) | Server HTTP integrato per API locale, socket e persistenza offline. |
| **Data Engine** | AsyncStorage + Snapshot Engine | Resilienza totale in assenza di cloud, con backup istantanei. |
| **CI / CD** | GitHub Actions + Expo EAS Build | Pipeline automatizzata per la compilazione dell'APK Android ad ogni push. |

---

## ⚙️ Compilazione APK Android (EAS Build)

La repository è configurata per generare automaticamente l'APK Android ad ogni push sul branch `main` tramite GitHub Actions. L'attesa del completamento è stata rimossa per risparmiare minuti di esecuzione.

I file APK generati possono essere scaricati direttamente dalla dashboard del progetto su Expo EAS.

---

## 👨‍💻 Crediti e Licenza
- **Sviluppato da:** Totem QuickBite
- **Licenza:** Proprietary - Tutti i diritti riservati. Vietata la riproduzione o distribuzione non autorizzata.
