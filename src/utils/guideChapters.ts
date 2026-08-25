import { SupportedLanguage } from './i18n';

export interface GuideChapter {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  badge?: string;
  paragraphs: string[];
  bulletPoints?: { title: string; desc: string }[];
  tip?: string;
}

export const GUIDE_CHAPTERS: Record<SupportedLanguage, GuideChapter[]> = {
  it: [
    {
      id: 'ch1_overview',
      icon: 'sparkles',
      title: '1. Panoramica & Architettura Ecosistema',
      subtitle: 'Come interagiscono Totem, Cucina KDS e Gestione Remota',
      badge: 'ARCHITETTURA',
      paragraphs: [
        'Totem QuickBite è una piattaforma completa per la ristorazione self-service progettata con approccio Local-First:',
        'Il sistema garantisce la totale continuità operativa anche in caso di caduta della connessione Internet esterna.',
      ],
      bulletPoints: [
        { title: '📱 Totem Touchscreen', desc: 'Interfaccia intuitiva per ordinazioni autonome dei clienti o rilascio ticket numerato per ordinare in cassa.' },
        { title: '🍳 Cucina KDS Digitale', desc: 'Display comande in tempo reale con avanzamento di stato (In attesa, In preparazione, Pronto, Completato).' },
        { title: '🖨️ Stampanti ESC/POS', desc: 'Stampa automatica scontrini di cortesia per il cliente e comande per il banco di preparazione.' },
        { title: '🌐 Controllo Remoto LAN & Web', desc: 'Gestione prodotti, prezzi, foto e categorie da qualsiasi smartphone o computer nella stessa rete locale.' },
      ],
      tip: 'Suggerimento: Collega il totem e il display cucina alla stessa rete Wi-Fi locale per una sincronizzazione istantanea a latenza zero.',
    },
    {
      id: 'ch2_customer_flow',
      icon: 'users',
      title: '2. Flusso Esperienza Cliente (Ordinazione al Totem)',
      subtitle: 'Dalla selezione lingua al ritiro dello scontrino',
      badge: 'CLIENTE',
      paragraphs: [
        'L\'interfaccia utente è studiata per ridurre le code e rendere l\'ordine facile anche per i clienti meno tecnologici:',
      ],
      bulletPoints: [
        { title: '1. Scelta Lingua & Modalità', desc: '5 lingue disponibili (IT, EN, ES, FR, DE). Il cliente può scegliere se ordinare al totem o ritirare solo il numero per ordinare in cassa.' },
        { title: '2. Esplorazione Menù', desc: 'Categorie chiare, foto ad alta risoluzione, descrizioni dettagliate, prezzi e indicazione degli allergeni.' },
        { title: '3. Personalizzazione Piatti', desc: 'Rimozione ingredienti (es. "Senza Cipolla"), aggiunta extra (es. "Extra Formaggio") e scelta opzioni obbligatorie o salse.' },
        { title: '4. Tipologia di Consumazione', desc: 'Scelta tra consumo al tavolo o asporto prima del riepilogo finale.' },
        { title: '5. Pagamento & Scontrino', desc: 'Pagamento al totem o saldo in cassa. Viene generato il numero d\'ordine progressivo da mostrare alla chiamata.' },
      ],
      tip: 'Il carrello si azzera automaticamente dopo 60 secondi di inattività per garantire la privacy del cliente successivo.',
    },
    {
      id: 'ch3_menu_management',
      icon: 'utensils',
      title: '3. Gestione Menù, Prezzi & Esauriti',
      subtitle: 'Creazione categorie, varianti, combo e blocchi rapidi',
      badge: 'MENÙ',
      paragraphs: [
        'Puoi modificare il catalogo prodotti direttamente dal Totem o tramite il Pannello Remoto Web:',
      ],
      bulletPoints: [
        { title: 'Categorie & Ordinamento', desc: 'Crea categorie (es. Panini, Pizze, Bevande, Dolci) e definisci la sequenza di visualizzazione.' },
        { title: 'Gruppi di Opzioni & Modificatori', desc: 'Configura scelte singole, salse gratuite o extra a pagamento con limiti minimi e massimi.' },
        { title: 'Interruttore Rapido Esaurito', desc: 'Segna un ingrediente o un piatto come esaurito con un solo tocco; il totem bloccherà subito le ordinazioni per quell\'articolo.' },
      ],
      tip: 'Durante il servizio puoi gestire gli esauriti direttamente dal tuo smartphone senza interrompere i clienti al totem.',
    },
    {
      id: 'ch4_kds_kitchen',
      icon: 'flame',
      title: '4. Display Cucina KDS & Gestione Comande',
      subtitle: 'Flusso operativo dei cuochi e tempi di preparazione',
      badge: 'CUCINA KDS',
      paragraphs: [
        'Il modulo KDS (Kitchen Display System) sostituisce i vecchi scontrini cartacei con un pannello dinamico:',
      ],
      bulletPoints: [
        { title: '🟡 In Attesa (Giallo)', desc: 'Nuova comanda appena inviata dal totem con orario esatto e modifiche evidenziate.' },
        { title: '🔵 In Preparazione (Blu)', desc: 'Il cuoco prende in carico la comanda toccando "Inizia".' },
        { title: '🟢 Pronto (Verde)', desc: 'I piatti sono pronti per essere serviti o ritirati al banco.' },
        { title: '⚪ Completato (Grigio)', desc: 'La comanda viene archiviata dallo storico visibile.' },
      ],
      tip: 'Le comande in attesa da più di 15 minuti vengono evidenziate per dare priorità agli ordini in ritardo.',
    },
    {
      id: 'ch5_printers',
      icon: 'printer',
      title: '5. Stampanti Termiche ESC/POS & Ricevute',
      subtitle: 'Configurazione Bluetooth, LAN, scontrino cortesia e cucina',
      badge: 'STAMPANTI',
      paragraphs: [
        'Compatibilità universale con stampanti termiche da 58mm e 80mm standard ESC/POS:',
      ],
      bulletPoints: [
        { title: 'Connessione Bluetooth & IP LAN', desc: 'Supporto per stampanti Bluetooth Classic/BLE e stampanti di rete su porta 9100.' },
        { title: 'Scontrino di Cortesia Cliente', desc: 'Stampa del numero ordine, data, ora e riepilogo piatti ordinati.' },
        { title: 'Comanda Termica Cucina', desc: 'Stampa separata direttamente sul bancone di preparazione con ingredienti speciali in evidenza.' },
      ],
      tip: 'Dalla scheda Impostazioni puoi abilitare o disabilitare indipendentemente la stampa cliente o cucina.',
    },
    {
      id: 'ch6_kiosk_lockdown',
      icon: 'shield',
      title: '6. Modalità Kiosk, Blocco Schermo & Sicurezza',
      subtitle: 'Protezione del dispositivo e gesture di sblocco segreta',
      badge: 'SICUREZZA',
      paragraphs: [
        'La modalità Kiosk protegge il tablet impedendo ai clienti di uscire dall\'applicazione o accedere al sistema operativo:',
      ],
      bulletPoints: [
        { title: 'Immersive Fullscreen (Lock Task)', desc: 'Nasconde la barra di stato, i pulsanti home/indietro e i pannelli notifiche.' },
        { title: 'Trigger Segreto per Admin (7 Tocchi)', desc: 'Toccando rapidamente 7 volte l\'angolo in alto a destra compare il tastierino PIN di sicurezza.' },
        { title: 'PIN Amministratore a 4 Cifre', desc: 'Protegge tutte le impostazioni e le modifiche ai prodotti (PIN predefinito: 1234).' },
      ],
      tip: 'Imposta l\'applicazione come launcher predefinito nelle impostazioni Android per avviare il totem all\'accensione.',
    },
    {
      id: 'ch7_remote_web',
      icon: 'globe',
      title: '7. Pannello di Amministrazione Remoto (Web LAN)',
      subtitle: 'Controllo completo da smartphone o PC senza toccare il totem',
      badge: 'REMOTO',
      paragraphs: [
        'Il Totem integra un micro-server web accessibile tramite qualsiasi browser web sulla rete locale:',
      ],
      bulletPoints: [
        { title: 'Accesso Istantaneo con QR Code', desc: 'Scansiona il codice QR presente nella scheda Remoto dal tuo smartphone.' },
        { title: 'Sincronizzazione in Tempo Reale', desc: 'Ogni modifica a prezzi, nomi e foto viene immediatamente applicata sullo schermo del totem.' },
        { title: 'Backup & Ripristino ZIP', desc: 'Esporta l\'intero catalogo con relative immagini in un archivio ZIP per backup o duplicazione su altri totem.' },
      ],
      tip: 'Aggiungi il link del pannello remoto alla schermata Home del tuo smartphone come Web App.',
    },
    {
      id: 'ch8_licensing',
      icon: 'award',
      title: '8. Licenze & Abbonamenti Google Play Store',
      subtitle: 'Attivazione, ripristino e gestione trasparente delle sottoscrizioni',
      badge: 'ABBONAMENTI',
      paragraphs: [
        'Piani di abbonamento semplici e trasparenti gestiti interamente tramite Google Play Billing:',
      ],
      bulletPoints: [
        { title: 'Piano Base Mensile (9,99 € / mese)', desc: 'Fatturazione mensile ricorrente. Singola postazione Totem, ordini illimitati, KDS cucina e pannello remoto.' },
        { title: 'Piano Base Annuale (89,00 € / anno)', desc: 'Miglior valore con oltre il 25% di risparmio (2 mesi gratuiti inclusi). Tutte le funzionalità attive.' },
        { title: 'Ripristino Acquisti su Nuovo Dispositivo', desc: 'Se cambi tablet, puoi ripristinare il tuo abbonamento con un solo tocco tramite il tuo account Google.' },
      ],
      tip: 'Gli abbonamenti possono essere gestiti o disdetti in qualsiasi momento dall\'app Google Play Store > Pagamenti e abbonamenti.',
    },
  ],
  en: [
    {
      id: 'ch1_overview',
      icon: 'sparkles',
      title: '1. System Overview & Architecture',
      subtitle: 'How Totem, Kitchen KDS, and Remote Management interact',
      badge: 'ARCHITECTURE',
      paragraphs: [
        'Totem QuickBite is a self-service restaurant management ecosystem built with a Local-First philosophy:',
        'The system ensures full operational continuity even without an external Internet connection.',
      ],
      bulletPoints: [
        { title: '📱 Touchscreen Totem', desc: 'Intuitive interface for customer self-ordering or ticket queue numbers for counter ordering.' },
        { title: '🍳 Digital Kitchen KDS', desc: 'Real-time kitchen order board with status workflow (Pending, Preparing, Ready, Completed).' },
        { title: '🖨️ ESC/POS Thermal Printers', desc: 'Automatic printing of customer courtesy receipts and kitchen preparation tickets.' },
        { title: '🌐 Remote LAN & Web Control', desc: 'Manage dishes, prices, pictures, and categories from any smartphone or PC on the same Wi-Fi.' },
      ],
      tip: 'Tip: Connect totem and kitchen display to the same local Wi-Fi for zero-latency real-time synchronization.',
    },
    {
      id: 'ch2_customer_flow',
      icon: 'users',
      title: '2. Customer Ordering Journey',
      subtitle: 'From language selection to receipt collection',
      badge: 'CUSTOMER',
      paragraphs: [
        'The UI is designed to minimize lines and make ordering effortless for all types of customers:',
      ],
      bulletPoints: [
        { title: '1. Language & Mode Selection', desc: '5 languages supported (EN, IT, ES, FR, DE). Customers choose between ordering on the totem or taking a ticket.' },
        { title: '2. Menu Browsing', desc: 'Clear categories, HD photography, detailed descriptions, pricing, and allergen tags.' },
        { title: '3. Dish Customization', desc: 'Remove standard ingredients, add paid extras, and select mandatory combo choices.' },
        { title: '4. Dine-in or Takeaway', desc: 'Select dining preference before proceeding to checkout.' },
        { title: '5. Payment & Ticket Receipt', desc: 'Pay at the totem or at the register. A unique queue number is printed.' },
      ],
      tip: 'The cart resets automatically after 60 seconds of inactivity to protect customer privacy.',
    },
    {
      id: 'ch3_menu_management',
      icon: 'utensils',
      title: '3. Menu, Pricing & Out-of-Stock Management',
      subtitle: 'Categories, modifier groups, combos, and instant item toggles',
      badge: 'MENU',
      paragraphs: [
        'Edit and update your catalog directly on the totem or through the Remote Web Manager:',
      ],
      bulletPoints: [
        { title: 'Categories & Sequencing', desc: 'Organize menu sections (Burgers, Pizzas, Drinks, Desserts) and set display order.' },
        { title: 'Option Groups & Modifiers', desc: 'Configure single-choice sauces, free options, or paid toppings with min/max rules.' },
        { title: 'Quick Out-of-Stock Switch', desc: 'Mark any dish or ingredient unavailable with one tap; orders are instantly blocked.' },
      ],
      tip: 'Mark 86\'d ingredients from your smartphone during busy hours without disturbing ordering customers.',
    },
    {
      id: 'ch4_kds_kitchen',
      icon: 'flame',
      title: '4. Kitchen KDS Display & Order Tracking',
      subtitle: 'Cook workflow and preparation timing',
      badge: 'KITCHEN KDS',
      paragraphs: [
        'The Kitchen Display System replaces paper chaos with a responsive digital Kanban board:',
      ],
      bulletPoints: [
        { title: '🟡 Pending (Yellow)', desc: 'Fresh order ticket with precise timestamp and custom notes highlighted.' },
        { title: '🔵 Preparing (Blue)', desc: 'Cook marks order start when items hit the grill.' },
        { title: '🟢 Ready (Green)', desc: 'Dishes are ready for service or counter collection.' },
        { title: '⚪ Completed (Gray)', desc: 'Order is finalized and archived from active view.' },
      ],
      tip: 'Tickets waiting longer than 15 minutes are highlighted to prevent customer delays.',
    },
    {
      id: 'ch5_printers',
      icon: 'printer',
      title: '5. ESC/POS Thermal Printing & Receipts',
      subtitle: 'Bluetooth and LAN setup for customer and kitchen receipts',
      badge: 'PRINTERS',
      paragraphs: [
        'Universal support for standard 58mm and 80mm ESC/POS thermal printer hardware:',
      ],
      bulletPoints: [
        { title: 'Bluetooth & LAN IP Connectivity', desc: 'Support for Bluetooth Classic/BLE and Network Ethernet printers on port 9100.' },
        { title: 'Customer Courtesy Ticket', desc: 'Prints order number, date, time, and complete order summary.' },
        { title: 'Kitchen Prep Ticket', desc: 'Direct print to preparation line with highlighted removed ingredients and additions.' },
      ],
      tip: 'Enable or disable customer and kitchen printing independently in Admin Settings.',
    },
    {
      id: 'ch6_kiosk_lockdown',
      icon: 'shield',
      title: '6. Kiosk Lockdown, Screen Protection & Security',
      subtitle: 'Securing the terminal and secret gesture unlock',
      badge: 'SECURITY',
      paragraphs: [
        'Kiosk Mode locks the tablet to ensure customers cannot exit or tamper with the operating system:',
      ],
      bulletPoints: [
        { title: 'Immersive Fullscreen (Lock Task)', desc: 'Hides Android navigation bars, home buttons, and notifications.' },
        { title: 'Secret Admin Gesture (7 Taps)', desc: 'Tap quickly 7 times in the top-right corner to bring up the security PIN pad.' },
        { title: '4-Digit Security PIN', desc: 'Protects menu edits, settings, and hardware parameters (Default: 1234).' },
      ],
      tip: 'Set this app as default Android Home Launcher to auto-boot upon terminal power on.',
    },
    {
      id: 'ch7_remote_web',
      icon: 'globe',
      title: '7. Remote Web Administration Panel',
      subtitle: 'Complete control from smartphone or PC without touching the totem',
      badge: 'REMOTE',
      paragraphs: [
        'The totem hosts an embedded local web server accessible from any browser on the local network:',
      ],
      bulletPoints: [
        { title: 'Instant QR Code Access', desc: 'Scan the QR code on the Remote tab with your phone to open management.' },
        { title: 'Real-Time Sync', desc: 'Every price change, photo upload, and name update reflects instantly on the kiosk.' },
        { title: 'ZIP Backup & Restore', desc: 'Export full catalog with images to a ZIP file for backup or multi-device cloning.' },
      ],
      tip: 'Add the remote panel URL to your smartphone home screen as a Web App.',
    },
    {
      id: 'ch8_licensing',
      icon: 'award',
      title: '8. Licensing & Google Play Subscriptions',
      subtitle: 'Activation, restores, and transparent billing compliance',
      badge: 'BILLING',
      paragraphs: [
        'Clean, transparent subscription tiers handled exclusively via Google Play Billing:',
      ],
      bulletPoints: [
        { title: 'Basic Monthly Plan (€9.99 / mo)', desc: 'Recurring monthly billing. Single Totem terminal, unlimited orders, kitchen KDS, and remote admin.' },
        { title: 'Basic Annual Plan (€89.00 / yr)', desc: 'Best value with over 25% savings (includes 2 months free). All features unlocked.' },
        { title: 'Restore Purchases on New Hardware', desc: 'Seamlessly transfer your subscription to a new tablet with one tap via Google Play.' },
      ],
      tip: 'Manage or cancel subscriptions at any time through Google Play Store > Payments & subscriptions.',
    },
  ],
  es: [
    {
      id: 'ch1_overview',
      icon: 'sparkles',
      title: '1. Resumen y Arquitectura del Sistema',
      subtitle: 'Interacción entre Totem, Cocina KDS y Gestión Remota',
      badge: 'ARQUITECTURA',
      paragraphs: [
        'Totem QuickBite es una plataforma integral de autoservicio con arquitectura Local-First:',
        'Garantiza la operatividad ininterrumpida incluso ante fallos de conexión a Internet externa.',
      ],
      bulletPoints: [
        { title: '📱 Tótem Táctil', desc: 'Interfaz rápida para pedidos de autoservicio o asignación de ticket para pagar en caja.' },
        { title: '🍳 Cocina Digital KDS', desc: 'Panel de comandas en tiempo real con estados (En espera, En preparación, Listo, Completado).' },
        { title: '🖨️ Impresoras ESC/POS', desc: 'Impresión automática de tickets de cortesía y comandas para cocina.' },
        { title: '🌐 Panel Remoto Web & LAN', desc: 'Gestione platos, precios y categorías desde cualquier móvil o PC conectado al mismo Wi-Fi.' },
      ],
      tip: 'Consejo: Conecte el tótem y la pantalla de cocina a la misma red Wi-Fi para una sincronización instantánea.',
    },
    {
      id: 'ch2_customer_flow',
      icon: 'users',
      title: '2. Experiencia del Cliente (Proceso de Pedido)',
      subtitle: 'Desde la selección de idioma hasta la recogida del ticket',
      badge: 'CLIENTE',
      paragraphs: [
        'Diseñado para reducir colas y simplificar los pedidos al máximo:',
      ],
      bulletPoints: [
        { title: '1. Idioma y Modo', desc: '5 idiomas disponibles (ES, IT, EN, FR, DE). El cliente elige entre pedir en el tótem o tomar ticket.' },
        { title: '2. Exploración del Menú', desc: 'Categorías claras, imágenes en alta definición, precios y advertencia de alérgenos.' },
        { title: '3. Personalización', desc: 'Quitar ingredientes estándar, agregar extras de pago y seleccionar opciones de menú.' },
        { title: '4. Comer Aquí o Para Llevar', desc: 'Selección del tipo de consumo antes de confirmar.' },
        { title: '5. Pago y Ticket', desc: 'Pago en el tótem o en caja. Se imprime el número de llamada.' },
      ],
      tip: 'El carrito se reinicia automáticamente tras 60 segundos de inactividad por seguridad.',
    },
    {
      id: 'ch3_menu_management',
      icon: 'utensils',
      title: '3. Gestión del Menú, Precios y Agotados',
      subtitle: 'Categorías, grupos de opciones, combos y control de existencias',
      badge: 'MENÚ',
      paragraphs: [
        'Edite el catálogo directamente en el tótem o a través del Panel Web Remoto:',
      ],
      bulletPoints: [
        { title: 'Categorías y Orden', desc: 'Cree secciones (Hamburguesas, Pizzas, Bebidas) y determine su orden de visualización.' },
        { title: 'Grupos de Opciones', desc: 'Configure salsas, elecciones obligatorias o extras de pago con límites mínimos y máximos.' },
        { title: 'Interruptor Rápido Agotado', desc: 'Marque platos o ingredientes como agotados con un solo toque.' },
      ],
      tip: 'Gestione los productos agotados desde su smartphone en pleno servicio sin molestar al cliente.',
    },
    {
      id: 'ch4_kds_kitchen',
      icon: 'flame',
      title: '4. Pantalla de Cocina KDS y Comandas',
      subtitle: 'Flujo de trabajo para cocineros y tiempos de preparación',
      badge: 'COCINA KDS',
      paragraphs: [
        'Sustituye los tickets de papel por un panel Kanban digital y dinámico:',
      ],
      bulletPoints: [
        { title: '🟡 En Espera (Amarillo)', desc: 'Nueva comanda con hora exacta y modificaciones resaltadas.' },
        { title: '🔵 En Preparación (Azul)', desc: 'El cocinero marca el inicio de elaboración.' },
        { title: '🟢 Listo (Verde)', desc: 'Platos preparados para su entrega o pase a sala.' },
        { title: '⚪ Completado (Gris)', desc: 'La comanda se archiva del panel activo.' },
      ],
      tip: 'Los pedidos con más de 15 minutos de espera se señalan para priorizarlos.',
    },
    {
      id: 'ch5_printers',
      icon: 'printer',
      title: '5. Impresoras Térmicas ESC/POS y Tickets',
      subtitle: 'Configuración Bluetooth, red LAN, tickets de cliente y cocina',
      badge: 'IMPRESORAS',
      paragraphs: [
        'Compatibilidad con impresoras térmicas estándar de 58 mm y 80 mm ESC/POS:',
      ],
      bulletPoints: [
        { title: 'Conexión Bluetooth y Red IP', desc: 'Soporte Bluetooth Classic/BLE e impresoras Ethernet por puerto 9100.' },
        { title: 'Ticket de Cortesía Cliente', desc: 'Impresión del número de pedido, fecha, hora y detalle de los platos.' },
        { title: 'Comanda de Cocina', desc: 'Impresión directa en la zona de cocinado con extras y exclusiones en negrita.' },
      ],
      tip: 'Active o desactive de forma independiente la impresión de cliente y cocina en Ajustes.',
    },
    {
      id: 'ch6_kiosk_lockdown',
      icon: 'shield',
      title: '6. Modo Kiosk, Bloqueo y Seguridad',
      subtitle: 'Protección del terminal y gesto secreto de desbloqueo',
      badge: 'SEGURIDAD',
      paragraphs: [
        'El Modo Kiosk bloquea la tableta impidiendo a los clientes salir al sistema operativo:',
      ],
      bulletPoints: [
        { title: 'Pantalla Completa Inmersiva (Lock Task)', desc: 'Oculta barras de navegación de Android y notificaciones.' },
        { title: 'Gesto Secreto Admin (7 Toques)', desc: 'Toque 7 veces rápidamente en la esquina superior derecha para abrir el teclado PIN.' },
        { title: 'PIN de Seguridad de 4 Dígitos', desc: 'Protege todos los ajustes y cambios del catálogo (Por defecto: 1234).' },
      ],
      tip: 'Configure la aplicación como inicio predeterminado en Android para iniciar automáticamente al encender.',
    },
    {
      id: 'ch7_remote_web',
      icon: 'globe',
      title: '7. Panel de Administración Remoto Web',
      subtitle: 'Control total desde smartphone o PC sin manipular el tótem',
      badge: 'REMOTO',
      paragraphs: [
        'El tótem aloja un servidor web accesible desde cualquier navegador en la red local:',
      ],
      bulletPoints: [
        { title: 'Acceso Instantáneo por Código QR', desc: 'Escanee el código QR de la pestaña Remoto con la cámara de su móvil.' },
        { title: 'Sincronización en Tiempo Real', desc: 'Cualquier modificación se refleja al instante en la pantalla del tótem.' },
        { title: 'Copia de Seguridad ZIP', desc: 'Exporte el menú con fotos en un archivo ZIP para respaldo o clonación.' },
      ],
      tip: 'Añada el enlace remoto a la pantalla de inicio de su teléfono como Web App.',
    },
    {
      id: 'ch8_licensing',
      icon: 'award',
      title: '8. Licencias y Suscripciones Google Play',
      subtitle: 'Activación, restauración y gestión transparente',
      badge: 'SUSCRIPCIONES',
      paragraphs: [
        'Planes de suscripción sencillos procesados mediante Google Play Billing:',
      ],
      bulletPoints: [
        { title: 'Plan Base Mensual (9,99 € / mes)', desc: 'Facturación mensual recurrente. 1 terminal Tótem, pedidos ilimitados, KDS y panel remoto.' },
        { title: 'Plan Base Anual (89,00 € / año)', desc: 'Ahorro superior al 25% (incluye 2 meses gratis). Todas las funciones habilitadas.' },
        { title: 'Restaurar Compras en Nuevo Dispositivo', desc: 'Transfiera su suscripción a una nueva tableta en un solo clic mediante su cuenta Google.' },
      ],
      tip: 'Gestione o cancele su suscripción en cualquier momento desde Google Play Store > Pagos y suscripciones.',
    },
  ],
  fr: [
    {
      id: 'ch1_overview',
      icon: 'sparkles',
      title: '1. Aperçu & Architecture du Système',
      subtitle: 'Interaction entre Borne Totem, Écran Cuisine KDS et Gestion à Distance',
      badge: 'ARCHITECTURE',
      paragraphs: [
        'Totem QuickBite est un écosystème complet de restauration self-service conçu avec une approche Local-First :',
        'Le système garantit une continuité opérationnelle totale même en cas de coupure de connexion Internet.',
      ],
      bulletPoints: [
        { title: '📱 Borne Tactile Totem', desc: 'Interface intuitive pour commandes autonomes ou retrait de ticket pour commander en caisse.' },
        { title: '🍳 Écran Cuisine KDS Numérique', desc: 'Affichage des commandes en temps réel avec statuts (En attente, En préparation, Prêt, Terminé).' },
        { title: '🖨️ Imprimantes ESC/POS', desc: 'Impression automatique des tickets de courtoisie client et des bons de préparation cuisine.' },
        { title: '🌐 Contrôle à Distance Web & LAN', desc: 'Gérez vos plats, prix et catégories depuis n\'importe quel smartphone ou PC sur le même Wi-Fi.' },
      ],
      tip: 'Conseil : Connectez la borne et l\'écran cuisine au même réseau Wi-Fi local pour une synchronisation instantanée.',
    },
    {
      id: 'ch2_customer_flow',
      icon: 'users',
      title: '2. Parcours de Commande Client',
      subtitle: 'Du choix de la langue au retrait du ticket',
      badge: 'CLIENT',
      paragraphs: [
        'Conçu pour fluidifier le service et simplifier la prise de commande :',
      ],
      bulletPoints: [
        { title: '1. Choix Langue & Mode', desc: '5 langues disponibles (FR, IT, EN, ES, DE). Choix entre commander sur la borne ou retirer un ticket.' },
        { title: '2. Exploration du Menu', desc: 'Catégories claires, photos HD, descriptions, tarifs et allergènes mentionnés.' },
        { title: '3. Personnalisation des Plats', desc: 'Retrait d\'ingrédients (ex. "Sans Oignon"), suppléments payants et choix obligatoires.' },
        { title: '4. Sur Place ou À Emporter', desc: 'Sélection du mode de consommation avant paiement.' },
        { title: '5. Paiement & Reçu', desc: 'Paiement à la borne ou en caisse avec impression du numéro d\'appel.' },
      ],
      tip: 'Le panier se réinitialise après 60 secondes d\'inactivité pour protéger la confidentialité.',
    },
    {
      id: 'ch3_menu_management',
      icon: 'utensils',
      title: '3. Gestion de la Carte, Prix & Ruptures',
      subtitle: 'Catégories, variantes, menus combos et blocage d\'ingrédients',
      badge: 'MENU',
      paragraphs: [
        'Mettez à jour vos produits directement sur la borne ou via le panneau Web distant :',
      ],
      bulletPoints: [
        { title: 'Catégories & Ordre', desc: 'Organisez les sections (Burgers, Pizzas, Boissons) et définissez l\'ordre d\'affichage.' },
        { title: 'Groupes d\'Options & Sauces', desc: 'Configurez les sauces, choix inclus ou extras payants avec règles min/max.' },
        { title: 'Bouton Rupture de Stock', desc: 'Désactivez un produit ou ingrédient épuisé d\'un seul geste.' },
      ],
      tip: 'Gérez les ruptures depuis votre smartphone pendant le coup de feu sans déranger les clients.',
    },
    {
      id: 'ch4_kds_kitchen',
      icon: 'flame',
      title: '4. Écran Cuisine KDS & Suivi des Bons',
      subtitle: 'Organisation des cuisiniers et maîtrise des délais',
      badge: 'CUISINE KDS',
      paragraphs: [
        'Remplace les tickets papier par un tableau Kanban numérique dynamique :',
      ],
      bulletPoints: [
        { title: '🟡 En Attente (Jaune)', desc: 'Nouvelle commande horodatée avec modifications mises en évidence.' },
        { title: '🔵 En Préparation (Bleu)', desc: 'Le chef valide le début de cuisson.' },
        { title: '🟢 Prêt (Vert)', desc: 'Plats prêts pour le service ou le retrait au comptoir.' },
        { title: '⚪ Terminé (Gris)', desc: 'La commande est archivée de la vue active.' },
      ],
      tip: 'Les commandes en attente depuis plus de 15 minutes sont signalées pour accélérer le service.',
    },
    {
      id: 'ch5_printers',
      icon: 'printer',
      title: '5. Imprimantes Thermiques ESC/POS & Reçus',
      subtitle: 'Configuration Bluetooth, réseau LAN, tickets client et cuisine',
      badge: 'IMPRIMANTES',
      paragraphs: [
        'Compatibilité avec imprimantes thermiques 58mm et 80mm ESC/POS standards :',
      ],
      bulletPoints: [
        { title: 'Connexion Bluetooth & Réseau IP', desc: 'Support Bluetooth Classic/BLE et imprimantes réseau Ethernet sur le port 9100.' },
        { title: 'Ticket de Courtoisie Client', desc: 'Impression du numéro de commande, de la date, de l\'heure et du détail des plats.' },
        { title: 'Bon de Préparation Cuisine', desc: 'Impression directe en cuisine avec modifications et extras clairement lisibles.' },
      ],
      tip: 'Activez ou désactivez indépendamment l\'impression client ou cuisine dans les paramètres.',
    },
    {
      id: 'ch6_kiosk_lockdown',
      icon: 'shield',
      title: '6. Mode Kiosque, Verrouillage & Sécurité',
      subtitle: 'Protection de la tablette et geste secret de déverrouillage',
      badge: 'SÉCURITÉ',
      paragraphs: [
        'Le mode Kiosque verrouille la tablette pour empêcher toute sortie non autorisée :',
      ],
      bulletPoints: [
        { title: 'Plein Écran Immersif (Lock Task)', desc: 'Masque les boutons Android et la barre de notifications.' },
        { title: 'Geste Secret Admin (7 Taps)', desc: 'Touchez rapidement 7 fois le coin supérieur droit pour afficher le clavier PIN.' },
        { title: 'Code PIN de Sécurité à 4 Chiffres', desc: 'Protège l\'accès aux réglages et à la modification des plats (Défaut : 1234).' },
      ],
      tip: 'Définissez l\'application comme écran d\'accueil par défaut pour un lancement automatique au démarrage.',
    },
    {
      id: 'ch7_remote_web',
      icon: 'globe',
      title: '7. Panneau d\'Administration à Distance (Web LAN)',
      subtitle: 'Contrôle complet depuis smartphone ou PC sans toucher au totem',
      badge: 'DISTANCE',
      paragraphs: [
        'La borne intègre un serveur web accessible depuis tout navigateur sur le réseau local :',
      ],
      bulletPoints: [
        { title: 'Accès Instantané par QR Code', desc: 'Scannez le QR Code de l\'onglet Distance avec votre téléphone.' },
        { title: 'Synchronisation Immédiate', desc: 'Chaque modification est instantanément appliquée sur l\'écran de la borne.' },
        { title: 'Sauvegarde & Restauration ZIP', desc: 'Exportez le catalogue complet avec images au format ZIP pour sauvegarde ou clonage.' },
      ],
      tip: 'Enregistrez le lien distant sur l\'écran d\'accueil de votre smartphone comme Web App.',
    },
    {
      id: 'ch8_licensing',
      icon: 'award',
      title: '8. Licences & Abonnements Google Play',
      subtitle: 'Activation, restauration et conformité tarifaire',
      badge: 'ABONNEMENTS',
      paragraphs: [
        'Formules d\'abonnements transparentes gérées via Google Play Billing :',
      ],
      bulletPoints: [
        { title: 'Formule Mensuelle (9,99 € / mois)', desc: 'Facturation mensuelle sans engagement. 1 borne Totem, commandes illimitées, KDS et panneau distant.' },
        { title: 'Formule Annuelle (89,00 € / an)', desc: 'Meilleure valeur avec plus de 25% d\'économie (2 mois gratuits inclus). Toutes fonctions activées.' },
        { title: 'Restaurer sur un Nouvel Appareil', desc: 'Transférez facilement votre abonnement sur une nouvelle tablette via votre compte Google.' },
      ],
      tip: 'Gérez ou résiliez votre abonnement à tout moment depuis Google Play Store > Paiements et abonnements.',
    },
  ],
  de: [
    {
      id: 'ch1_overview',
      icon: 'sparkles',
      title: '1. Systemübersicht & Architektur',
      subtitle: 'Zusammenspiel von Terminal, Küchenmonitor und Fernverwaltung',
      badge: 'ARCHITEKTUR',
      paragraphs: [
        'Totem QuickBite ist ein professionelles Self-Service-System mit Local-First-Architektur:',
        'Das System garantiert unterbrechungsfreien Betrieb auch bei Ausfall der externen Internetverbindung.',
      ],
      bulletPoints: [
        { title: '📱 Touchscreen Terminal', desc: 'Intuitive Oberfläche für Selbstbedienung oder Ziehen einer Wartenummer für die Kasse.' },
        { title: '🍳 Digitaler KDS Küchenmonitor', desc: 'Echtzeit-Bestellanzeige mit Status-Workflow (Wartend, In Zubereitung, Bereit, Abgeschlossen).' },
        { title: '🖨️ ESC/POS Thermodrucker', desc: 'Automatischer Druck von Kundenbelegen und Küchenbons.' },
        { title: '🌐 Web-Fernsteuerung (WLAN)', desc: 'Speisekarte, Preise und Fotos bequem vom Smartphone oder PC im selben Netzwerk verwalten.' },
      ],
      tip: 'Tipp: Verbinden Sie Terminal und Küchenmonitor mit demselben WLAN für verzögerungsfreie Synchronisation.',
    },
    {
      id: 'ch2_customer_flow',
      icon: 'users',
      title: '2. Kunden-Bedienungsanleitung (Bestellablauf)',
      subtitle: 'Vom Startbildschirm bis zur Essensausgabe',
      badge: 'KUNDENABLAUF',
      paragraphs: [
        'Die intuitive Benutzeroberfläche mit großen Schaltflächen garantiert schnelle Bedienung:',
      ],
      bulletPoints: [
        { title: '1. Sprach- und Moduswahl', desc: 'Auswahl aus 5 Sprachen (DE, IT, EN, ES, FR) und Option: Am Terminal bestellen oder Wartenummer.' },
        { title: '2. Speisekarte durchstöbern', desc: 'Übersichtliche Kategorien mit Fotos, Allergenhinweisen und Preisen.' },
        { title: '3. Gerichte individuell anpassen', desc: 'Zutaten abwählen (z.B. "Ohne Zwiebeln") oder Extras und Beilagen hinzufügen.' },
        { title: '4. Verzehrart (Im Haus / Zum Mitnehmen)', desc: 'Auswahl vor dem Bezahlen.' },
        { title: '5. Bezahlung & Beleg', desc: 'Zahlung an der Kasse oder am Terminal. Abholnummer wird ausgedruckt.' },
      ],
      tip: 'Verlässt ein Kunde das Terminal, leert der Inaktivitäts-Timer den Warenkorb automatisch.',
    },
    {
      id: 'ch3_menu_management',
      icon: 'utensils',
      title: '3. Speisekarten- und Ausverkaufs-Verwaltung',
      subtitle: 'Kategorien, Rezepturen, Menü-Kombinationen und Preise',
      badge: 'SPEISEKARTE',
      paragraphs: [
        'Verwalten Sie das Sortiment direkt am Terminal oder per Smartphone:',
      ],
      bulletPoints: [
        { title: 'Kategorien & Reihenfolge', desc: 'Kategorien anlegen (Burger, Pizza, Getränke, Desserts) und anordnen.' },
        { title: 'Optionsgruppen & Menüs', desc: 'Pflichtauswahlen definieren (z.B. Getränkewahl, Garstufe).' },
        { title: 'Schneller Ausverkaufs-Schalter', desc: 'Ausverkaufte Artikel mit einem Tippen deaktivieren.' },
      ],
      tip: 'Nutzen Sie die Ausverkaufs-Funktion vom Smartphone während des laufenden Betriebs.',
    },
    {
      id: 'ch4_kds_kitchen',
      icon: 'flame',
      title: '4. Küchen-Monitor KDS & Bestellabwicklung',
      subtitle: 'Echtzeit-Bons und verkürzte Zubereitungszeiten',
      badge: 'KÜCHE KDS',
      paragraphs: [
        'Ersetzt Zettelwirtschaft durch ein digitales Kanban-Board:',
      ],
      bulletPoints: [
        { title: '🟡 Zuzubereiten (Gelb)', desc: 'Neuer Bon mit Zeitstempel und hervorgehobenen Änderungen.' },
        { title: '🔵 In Zubereitung (Blau)', desc: 'Koch markiert den Start am Herd/Grill.' },
        { title: '🟢 Abholbereit (Grün)', desc: 'Bestellung ist fertig zur Ausgabe.' },
        { title: '⚪ Abgeschlossen (Grau)', desc: 'Bestellung wird archiviert.' },
      ],
      tip: 'Bestellungen mit über 15 Minuten Wartezeit werden rot hervorgehoben.',
    },
    {
      id: 'ch5_printers',
      icon: 'printer',
      title: '5. ESC/POS Thermodrucker-Einrichtung',
      subtitle: 'Bluetooth, LAN-Netzwerk, Kunden- und Küchenbelege',
      badge: 'DRUCKER',
      paragraphs: [
        'Unterstützt 58mm und 80mm ESC/POS Thermodrucker:',
      ],
      bulletPoints: [
        { title: 'Bluetooth & Netzwerk-IP', desc: 'Drucker per Bluetooth koppeln oder IP-Adresse (Port 9100) eingeben.' },
        { title: 'Rollen-Trennung', desc: 'Separater Belegdruck für Kunden und Küchenpersonal.' },
      ],
      tip: 'Führen Sie in den Einstellungen einen Testdruck durch.',
    },
    {
      id: 'ch6_kiosk_lockdown',
      icon: 'shield',
      title: '6. Kiosk-Sperrmodus & Gerätesicherheit',
      subtitle: 'Tablet sichern und Admin-Menü mit PIN entsperren',
      badge: 'SPERRMODUS',
      paragraphs: [
        'Sichert handelsübliche Tablets gegen unbefugten Zugriff ab:',
      ],
      bulletPoints: [
        { title: 'Immersiver Vollbildmodus (Lock Task)', desc: 'Android-Systemleisten und Benachrichtigungen werden gesperrt.' },
        { title: 'Geheime Geste (7x Tippen)', desc: '7x schnell oben rechts tippen und PIN (Standard: 1234) eingeben.' },
      ],
      tip: 'In den Android-Einstellungen als Standard-Start-App festlegen.',
    },
    {
      id: 'ch7_remote_web',
      icon: 'globe',
      title: '7. Web-Fernsteuerung (LAN-Browser)',
      subtitle: 'Komfortable Verwaltung vom Smartphone im lokalen WLAN',
      badge: 'FERNSTEUERUNG',
      paragraphs: [
        'Integrierter Webserver für kabellose Administration:',
      ],
      bulletPoints: [
        { title: 'Verbindung per QR-Code', desc: 'QR-Code in den Einstellungen mit dem Smartphone scannen.' },
        { title: 'Live-Aktualisierung', desc: 'Änderungen werden sofort am Terminal sichtbar.' },
        { title: 'ZIP-Backup & Wiederherstellung', desc: 'Exportieren Sie das Menü samt Bildern als ZIP-Datei.' },
      ],
      tip: 'Legen Sie ein Lesezeichen auf Ihrem Smartphone-Startbildschirm an.',
    },
    {
      id: 'ch8_licensing',
      icon: 'award',
      title: '8. Lizenzen und Abonnements',
      subtitle: 'Abonnementverwaltung über den Google Play Store',
      badge: 'LIZENZEN',
      paragraphs: [
        'Transparente Lizenzmodelle für Gastronomiebetriebe:',
      ],
      bulletPoints: [
        { title: 'Monatliches Google Play Abo (9,99 € / Monat)', desc: 'Monatlich kündbar. 1 Terminal, unbegrenzte Bestellungen, KDS und Fernsteuerung.' },
        { title: 'Jährliches Google Play Abo (89,00 € / Jahr)', desc: 'Bestes Angebot mit über 25% Ersparnis (inklusive 2 Gratismonate).' },
        { title: 'Einkäufe auf neuem Tablet wiederherstellen', desc: 'Mit einem Klick über das Google-Konto auf neuen Geräten wiederherstellen.' },
      ],
      tip: 'Verwalten Sie Ihr Abonnement in den Google Play Store Einstellungen.',
    },
  ],
};
