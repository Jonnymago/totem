# Evidenze ufficiali — Google Play Billing e R8

Data della ricerca: 27 agosto 2026.

| Argomento | Evidenza tecnica | Impatto per Totem |
|---|---|---|
| Verifica acquisti | Google richiede di inviare il purchase token a un backend sicuro e verificare il prodotto prima di concedere l'entitlement. | L'app può conservare offline solo un entitlement già verificato; non deve trasformare un token locale in una licenza valida. |
| Fonte di verità | Il backend deve interrogare Google Play Developer API per acquisti o abbonamenti e mantenere lo stato aggiornato tramite RTDN. | Sono indispensabili Play Console, progetto Google Cloud/service account, endpoint HTTPS e Product ID/base plan: non è sicuro inventarli nel codice. |
| Offline | La cache offline è ragionevole soltanto per un entitlement precedentemente verificato, con scadenza e finestra di tolleranza esplicite; senza una verifica precedente l'accesso non va concesso. | La cache va cifrata/protetta nel device e riesaminata appena torna la rete; non può sostituire il backend di verifica. |
| Testing | I license tester e le test track permettono il collaudo di billing; gli acquisti devono essere riconosciuti/acknowledged. | Il collaudo reale potrà iniziare solo dopo configurazione Play Console e pubblicazione in Internal Testing. |
| R8 | Per release Android Google raccomanda ottimizzazione, shrinking risorse e obfuscation; le keep rules devono essere minimali e testate su release. | È possibile abilitare R8/ProGuard ora e produrre mapping per deobfuscation; occorre compilare/testare una release prima della pubblicazione. |

## Fonti

1. [Google Play Billing — Integrare la libreria](https://developer.android.com/google/play/billing/integrate)
2. [Google Play Billing — Test dell'integrazione](https://developer.android.com/google/play/billing/test)
3. [Google Play Developer API — Componenti backend](https://developers.google.com/chromeos/app-development/publish/play-billing-backend)
4. [Android Developers — Abilitare R8](https://developer.android.com/topic/performance/app-optimization/enable-app-optimization)
