# Consigli per la Sicurezza e Contro l'Hacking (Totem QuickBite)

Per garantire la massima sicurezza del sistema Kiosk e del server locale, si raccomanda di implementare le seguenti misure:

## 1. Sicurezza della Rete Locale (LAN)
- **Isolamento della Rete (VLAN):** Collega i totem e le stampanti a una VLAN dedicata (es. "Rete IoT/POS"), separata dalla rete Wi-Fi pubblica offerta ai clienti.
- **Firewall e Regole di Accesso:** Configura il router per impedire che i dispositivi sulla rete ospiti possano comunicare con l'indirizzo IP del totem (porta 8000/8080).
- **IP Statico e MAC Binding:** Assegna un IP statico al totem tramite il router basandoti sul MAC address, per evitare conflitti e facilitare il monitoraggio.

## 2. Sicurezza del Dispositivo (Android/Kiosk)
- **Pin di Uscita Robusto:** Modifica sempre il PIN di default (1234) per l'uscita dalla modalità Kiosk.
- **Gestione Dispositivi Mobili (MDM):** Utilizza un software MDM (es. Esper, Hexnode) per bloccare a livello di sistema operativo l'installazione di app non autorizzate e forzare la Kiosk Mode in modo nativo.
- **Disabilitazione ADB e USB Debugging:** Assicurati che le opzioni sviluppatore e il debug USB siano disattivati sul tablet in produzione.

## 3. Sicurezza del Server Locale e API
- **Cambio Chiave JWT:** Nel file `.env` del backend, modifica immediatamente la variabile `JWT_SECRET_KEY` utilizzando una stringa lunga e casuale.
- **Password di Amministrazione:** Non utilizzare credenziali predefinite (es. admin/admin123). Imposta una password complessa per il pannello remoto.
- **Limitazione del Rate (Rate Limiting):** Implementa un rate limiter (es. tramite `slowapi` in FastAPI) sugli endpoint sensibili (login, creazione ordini) per prevenire attacchi brute-force o DoS.
- **Validazione dell'Input:** Mantieni rigorosa la validazione dei dati in ingresso (già gestita da Pydantic) per prevenire iniezioni di codice o payload anomali.

## 4. Sicurezza Fisica
- **Protezione Porte e Cavi:** Utilizza un case/chassis per il totem che blocchi l'accesso fisico alle porte USB, ai pulsanti del volume e al pulsante di accensione.
- **Fissaggio Sicuro:** Assicurati che il dispositivo sia ancorato saldamente per prevenire furti o manomissioni hardware.
