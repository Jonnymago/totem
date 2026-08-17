COME AVVIARE IL SERVER IN LOCALE (SENZA INTERNET)

Se vuoi che il totem funzioni completamente senza internet, devi scaricare il codice 
del server (il "backend") sul tuo PC locale (ad esempio quello con IP 192.168.1.9) 
e avviarlo tu stesso.

1. ESPORTA IL PROGETTO
   - In alto a destra su AI Studio clicca su "Export" -> "Download ZIP".
   - Estrai il file ZIP sul tuo PC.

2. REQUISITI PC
   - Python 3.10+ (scaricalo da python.org)
   - MongoDB (devi installare MongoDB Server localmente, o usare Docker)

3. AVVIARE IL BACKEND
   Apri il terminale nella cartella "backend" ed esegui:
   > pip install -r requirements.txt
   > uvicorn server:app --host 0.0.0.0 --port 8000

   L'opzione "--host 0.0.0.0" è fondamentale: permette al PC di accettare le 
   connessioni dal tablet sulla rete WiFi.

4. CONFIGURARE IL TABLET
   Nell'app Android, entra nelle Impostazioni (Area Admin). 
   Troverai una nuova voce "Server Locale (Opzionale)". 
   Scrivi qui: http://192.168.1.9:8000 (o l'IP corretto del tuo PC).
   Salva e riavvia l'app.
