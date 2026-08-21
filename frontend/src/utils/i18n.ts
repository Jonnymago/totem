import { useEffect, useState } from 'react';
import { storage } from '@/src/utils/storage';

export type SupportedLanguage = 'it' | 'en' | 'es' | 'fr' | 'de';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'it', name: 'Italiano', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
];

export interface GuideSection {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  badge?: string;
  paragraphs: string[];
  bulletPoints?: { title: string; desc: string }[];
  tip?: string;
}

// Translations Dictionary
const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  it: {
    // Common / Global
    'common.confirm': 'Conferma',
    'common.cancel': 'Annulla',
    'common.save': 'Salva',
    'common.saved': 'Salvato con successo!',
    'common.delete': 'Elimina',
    'common.edit': 'Modifica',
    'common.back': 'Indietro',
    'common.close': 'Chiudi',
    'common.loading': 'Caricamento in corso...',
    'common.success': 'Operazione completata con successo!',
    'common.error': 'Si è verificato un errore',
    'common.search': 'Cerca...',
    'common.total': 'Totale',
    'common.quantity': 'Quantità',
    'common.price': 'Prezzo',
    'common.free': 'Gratis',
    'common.active': 'Attivo',
    'common.inactive': 'Non attivo',
    'common.print': 'Stampa',
    'common.language': 'Lingua',
    'common.choose_language': 'Seleziona Lingua',
    'common.seconds': 'secondi',

    // Welcome Screen (index.tsx)
    'welcome.greeting': 'Benvenuto!',
    'welcome.how_to_proceed': 'Come vuoi procedere?',
    'welcome.take_number_title': 'Prendi solo il Numero',
    'welcome.take_number_desc': 'Vai in cassa a ordinare a voce',
    'welcome.order_totem_title': 'Ordina al Totem',
    'welcome.order_totem_desc': 'Componi il tuo ordine qui',
    'welcome.admin_access_title': 'Accesso Amministratore',
    'welcome.admin_access_desc': 'Inserisci il PIN di sicurezza per gestire il totem',

    // Take Number Screen
    'take_number.loading': 'Generazione numero...',
    'take_number.ticket_title': 'TICKET DI PRENOTAZIONE',
    'take_number.your_number': 'IL TUO NUMERO',
    'take_number.go_to_counter': 'Presentati alla cassa per ordinare',
    'take_number.date': 'Data',
    'take_number.time': 'Ora',
    'take_number.auto_return': 'Ritorno alla schermata iniziale tra',
    'take_number.new_ticket': 'Nuovo Ticket',

    // Categories Screen
    'categories.title': 'Categorie',
    'categories.subtitle': 'Cosa desideri gustare oggi?',
    'categories.empty': 'Nessuna categoria disponibile al momento.',
    'categories.view_cart': 'Vedi Carrello',

    // Products Screen
    'products.title': 'Menu',
    'products.subtitle': 'Scegli i tuoi piatti preferiti',
    'products.empty': 'Nessun prodotto disponibile in questa categoria.',
    'products.sold_out': 'Esaurito',
    'products.sold_out_badge': 'NON DISPONIBILE',
    'products.customize': 'Personalizza',
    'products.add_to_cart': 'Aggiungi al Carrello',
    'products.update_cart': 'Aggiorna Articolo nel Carrello',
    'products.without_ingredients': 'Rimuovi Ingredienti (Senza)',
    'products.extra_additions': 'Aggiunte & Extra',
    'products.choose_options': 'Scegli Opzioni',
    'products.notes_placeholder': 'Note per la cucina (es. cottura, intolleranze)...',
    'products.required': 'Obbligatorio',
    'products.optional': 'Opzionale',
    'products.select_at_least': 'Seleziona almeno',
    'products.select_max': 'Massimo consentito',

    // Cart Screen
    'cart.title': 'Il Tuo Carrello',
    'cart.empty_title': 'Il carrello è vuoto',
    'cart.empty_desc': 'Non hai ancora aggiunto nessun piatto al tuo ordine.',
    'cart.start_order': 'Esplora il Menu',
    'cart.order_summary': 'Riepilogo Ordine',
    'cart.clear_all': 'Svuota Carrello',
    'cart.clear_confirm': 'Vuoi davvero svuotare tutti gli articoli dal carrello?',
    'cart.checkout': 'Procedi al Pagamento',
    'cart.sold_out_warning': 'Uno o più articoli nel carrello sono esauriti. Rimuovili per procedere.',

    // Order Confirmation Screen
    'order_confirm.title': 'Conferma Ordine',
    'order_confirm.service_type': 'Dove vuoi consumare?',
    'order_confirm.eat_in': '🍽️ Consuma Qui al Tavolo',
    'order_confirm.take_away': '🛍️ Ordine da Asporto',
    'order_confirm.payment_method': 'Seleziona Metodo di Pagamento',
    'order_confirm.pay_cash': '💵 Paga alla Cassa (Contanti / Bancomat)',
    'order_confirm.pay_pos': '💳 Paga al Totem (Carta / POS Digitale)',
    'order_confirm.send_order': 'Invia Ordine in Cucina',
    'order_confirm.creating': 'Invio ordine alla cucina in corso...',
    'order_confirm.success_title': 'Ordine Inviato in Cucina!',
    'order_confirm.order_number_label': 'NUMERO ORDINE',
    'order_confirm.keep_receipt': 'Ritira lo scontrino di cortesia e attendi la chiamata sul monitor.',
    'order_confirm.new_order': 'Inizia Nuovo Ordine',

    // Admin Navigation
    'nav.products': 'Prodotti',
    'nav.categories': 'Categorie',
    'nav.groups': 'Gruppi',
    'nav.kiosk': 'Controllo Kiosk',
    'nav.settings': 'Impostazioni',
    'nav.license': 'Licenza & Info',
    'nav.kitchen': 'Schermo Cucina KDS',

    // KDS Kitchen Screen
    'kds.title': 'Monitor Cucina KDS',
    'kds.active_orders': 'Comande Attive',
    'kds.status_to_prepare': 'Da Preparare',
    'kds.status_preparing': 'In Preparazione',
    'kds.status_ready': 'Pronto per Ritiro',
    'kds.status_completed': 'Ritirato',
    'kds.elapsed': 'Trascorsi',
    'kds.mark_preparing': 'Avvia Preparazione',
    'kds.mark_ready': 'Segna Come Pronto',
    'kds.mark_completed': 'Consegna al Cliente',
    'kds.all_stations': 'Tutte le Postazioni',

    // Kiosk Module
    'kiosk.title': 'Controllo Kiosk & Schermo',
    'kiosk.lockdown_title': 'Modalità Kiosk & Blocco Dispositivo',
    'kiosk.fullscreen': 'Schermo Intero Immersivo',
    'kiosk.keep_awake': 'Schermo Sempre Acceso (Keep Awake)',
    'kiosk.auto_boot': 'Avvio Automatico all\'Accensione (Auto-Boot)',
    'kiosk.screensaver': 'Salvaschermo & Reset Inattività',
    'kiosk.timeout': 'Timeout Inattività',
    'kiosk.auto_reset_cart': 'Auto-Reset Carrello Abbandonato',
    'kiosk.brightness': 'Luminosità Display',
    'kiosk.night_dimming': 'Dimming Notturno Automatico',
    'kiosk.secret_unlock': 'Gesture di Sblocco Segreto (7 Tocchi)',
    'kiosk.wake_btn': '☀️ Risveglia Schermo',
    'kiosk.screensaver_btn': '🖼️ Avvia Salvaschermo',
    'kiosk.reload_btn': '🔄 Ricarica App',

    // Guide Title & Header
    'guide.title': '📖 Guida Completa & Manuale Operativo Totem',
    'guide.subtitle': 'Tutte le istruzioni dettagliate per l\'uso, configurazione hardware e gestione del ristorante',
    'guide.interactive_helper': 'Assistente Interattivo Totem QuickBite',
    'guide.tab_all': 'Tutti i Capitoli',
    'guide.tab_customer': 'Per i Clienti',
    'guide.tab_admin': 'Per i Gestori',
    'guide.tab_hardware': 'Hardware & Stampanti',
  },

  en: {
    // Common / Global
    'common.confirm': 'Confirm',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.saved': 'Successfully saved!',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.back': 'Back',
    'common.close': 'Close',
    'common.loading': 'Loading...',
    'common.success': 'Operation completed successfully!',
    'common.error': 'An error occurred',
    'common.search': 'Search...',
    'common.total': 'Total',
    'common.quantity': 'Quantity',
    'common.price': 'Price',
    'common.free': 'Free',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.print': 'Print',
    'common.language': 'Language',
    'common.choose_language': 'Select Language',
    'common.seconds': 'seconds',

    // Welcome Screen
    'welcome.greeting': 'Welcome!',
    'welcome.how_to_proceed': 'How would you like to proceed?',
    'welcome.take_number_title': 'Take a Number Only',
    'welcome.take_number_desc': 'Order at the counter with our staff',
    'welcome.order_totem_title': 'Order at the Totem',
    'welcome.order_totem_desc': 'Build and customize your order here',
    'welcome.admin_access_title': 'Admin Access',
    'welcome.admin_access_desc': 'Enter security PIN to access management settings',

    // Take Number Screen
    'take_number.loading': 'Generating ticket number...',
    'take_number.ticket_title': 'QUEUE RESERVATION TICKET',
    'take_number.your_number': 'YOUR NUMBER',
    'take_number.go_to_counter': 'Please proceed to the counter to order',
    'take_number.date': 'Date',
    'take_number.time': 'Time',
    'take_number.auto_return': 'Returning to home screen in',
    'take_number.new_ticket': 'New Ticket',

    // Categories Screen
    'categories.title': 'Categories',
    'categories.subtitle': 'What would you like to enjoy today?',
    'categories.empty': 'No categories available at the moment.',
    'categories.view_cart': 'View Cart',

    // Products Screen
    'products.title': 'Menu',
    'products.subtitle': 'Select your favorite dishes',
    'products.empty': 'No items available in this category.',
    'products.sold_out': 'Sold Out',
    'products.sold_out_badge': 'UNAVAILABLE',
    'products.customize': 'Customize',
    'products.add_to_cart': 'Add to Cart',
    'products.update_cart': 'Update Cart Item',
    'products.without_ingredients': 'Remove Ingredients (Without)',
    'products.extra_additions': 'Extra Additions & Toppings',
    'products.choose_options': 'Choose Options',
    'products.notes_placeholder': 'Kitchen notes (e.g. cooking level, allergies)...',
    'products.required': 'Required',
    'products.optional': 'Optional',
    'products.select_at_least': 'Select at least',
    'products.select_max': 'Maximum allowed',

    // Cart Screen
    'cart.title': 'Your Cart',
    'cart.empty_title': 'Your cart is empty',
    'cart.empty_desc': 'You have not added any dishes to your order yet.',
    'cart.start_order': 'Explore the Menu',
    'cart.order_summary': 'Order Summary',
    'cart.clear_all': 'Clear Cart',
    'cart.clear_confirm': 'Are you sure you want to remove all items from the cart?',
    'cart.checkout': 'Proceed to Checkout',
    'cart.sold_out_warning': 'One or more items in your cart are sold out. Remove them to proceed.',

    // Order Confirmation Screen
    'order_confirm.title': 'Order Confirmation',
    'order_confirm.service_type': 'Dining Preference',
    'order_confirm.eat_in': '🍽️ Dine In / Eat Here',
    'order_confirm.take_away': '🛍️ Take Away / To Go',
    'order_confirm.payment_method': 'Select Payment Method',
    'order_confirm.pay_cash': '💵 Pay at Cash Desk (Cash / Card)',
    'order_confirm.pay_pos': '💳 Pay at Totem (Digital Card / POS)',
    'order_confirm.send_order': 'Send Order to Kitchen',
    'order_confirm.creating': 'Submitting order to the kitchen...',
    'order_confirm.success_title': 'Order Sent to Kitchen!',
    'order_confirm.order_number_label': 'ORDER NUMBER',
    'order_confirm.keep_receipt': 'Please take your courtesy receipt and watch the monitor.',
    'order_confirm.new_order': 'Start New Order',

    // Admin Navigation
    'nav.products': 'Products',
    'nav.categories': 'Categories',
    'nav.groups': 'Groups',
    'nav.kiosk': 'Kiosk Control',
    'nav.settings': 'Settings',
    'nav.license': 'License & Info',
    'nav.kitchen': 'Kitchen KDS',

    // KDS Kitchen Screen
    'kds.title': 'Kitchen Display KDS',
    'kds.active_orders': 'Active Orders',
    'kds.status_to_prepare': 'To Prepare',
    'kds.status_preparing': 'Preparing',
    'kds.status_ready': 'Ready for Pickup',
    'kds.status_completed': 'Delivered',
    'kds.elapsed': 'Elapsed',
    'kds.mark_preparing': 'Start Prep',
    'kds.mark_ready': 'Mark as Ready',
    'kds.mark_completed': 'Deliver to Customer',
    'kds.all_stations': 'All Stations',

    // Kiosk Module
    'kiosk.title': 'Kiosk & Screen Control',
    'kiosk.lockdown_title': 'Kiosk Lockdown & Device Mode',
    'kiosk.fullscreen': 'Immersive Fullscreen',
    'kiosk.keep_awake': 'Keep Screen Awake',
    'kiosk.auto_boot': 'Auto-Start on Boot',
    'kiosk.screensaver': 'Screensaver & Inactivity Reset',
    'kiosk.timeout': 'Inactivity Timeout',
    'kiosk.auto_reset_cart': 'Auto-Reset Abandoned Cart',
    'kiosk.brightness': 'Display Brightness',
    'kiosk.night_dimming': 'Automatic Night Dimming',
    'kiosk.secret_unlock': 'Secret Gesture Unlock (7 Taps)',
    'kiosk.wake_btn': '☀️ Wake Screen',
    'kiosk.screensaver_btn': '🖼️ Start Screensaver',
    'kiosk.reload_btn': '🔄 Reload App',

    // Guide Title & Header
    'guide.title': '📖 Complete Totem Operating Guide & Manual',
    'guide.subtitle': 'Step-by-step instructions for customer orders, hardware setup and restaurant operations',
    'guide.interactive_helper': 'Interactive Helper & Totem Guide',
    'guide.tab_all': 'All Chapters',
    'guide.tab_customer': 'Customer Flow',
    'guide.tab_admin': 'Manager Ops',
    'guide.tab_hardware': 'Hardware & Printers',
  },

  es: {
    // Common / Global
    'common.confirm': 'Confirmar',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.saved': '¡Guardado con éxito!',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.back': 'Atrás',
    'common.close': 'Cerrar',
    'common.loading': 'Cargando...',
    'common.success': '¡Operación realizada con éxito!',
    'common.error': 'Ocurrió un error',
    'common.search': 'Buscar...',
    'common.total': 'Total',
    'common.quantity': 'Cantidad',
    'common.price': 'Precio',
    'common.free': 'Gratis',
    'common.active': 'Activo',
    'common.inactive': 'Inactivo',
    'common.print': 'Imprimir',
    'common.language': 'Idioma',
    'common.choose_language': 'Seleccionar Idioma',
    'common.seconds': 'segundos',

    // Welcome Screen
    'welcome.greeting': '¡Bienvenido!',
    'welcome.how_to_proceed': '¿Cómo deseas proceder?',
    'welcome.take_number_title': 'Tomar solo el Turno',
    'welcome.take_number_desc': 'Pide en caja directamente con el personal',
    'welcome.order_totem_title': 'Pedir en el Tótem',
    'welcome.order_totem_desc': 'Crea y personaliza tu pedido aquí',
    'welcome.admin_access_title': 'Acceso Administrador',
    'welcome.admin_access_desc': 'Ingresa el PIN de seguridad para gestionar el tótem',

    // Take Number Screen
    'take_number.loading': 'Generando número de turno...',
    'take_number.ticket_title': 'TICKET DE RESERVA DE TURNO',
    'take_number.your_number': 'TU NÚMERO',
    'take_number.go_to_counter': 'Pasa por caja para realizar tu pedido',
    'take_number.date': 'Fecha',
    'take_number.time': 'Hora',
    'take_number.auto_return': 'Volviendo a la pantalla principal en',
    'take_number.new_ticket': 'Nuevo Ticket',

    // Categories Screen
    'categories.title': 'Categorías',
    'categories.subtitle': '¿Qué te apetece degustar hoy?',
    'categories.empty': 'No hay categorías disponibles en este momento.',
    'categories.view_cart': 'Ver Carrito',

    // Products Screen
    'products.title': 'Menú',
    'products.subtitle': 'Elige tus platos favoritos',
    'products.empty': 'No hay productos disponibles en esta categoría.',
    'products.sold_out': 'Agotado',
    'products.sold_out_badge': 'NO DISPONIBLE',
    'products.customize': 'Personalizar',
    'products.add_to_cart': 'Añadir al Carrito',
    'products.update_cart': 'Actualizar en el Carrito',
    'products.without_ingredients': 'Quitar Ingredientes (Sin)',
    'products.extra_additions': 'Ingredientes Extra',
    'products.choose_options': 'Elegir Opciones',
    'products.notes_placeholder': 'Notas para cocina (ej. punto de cocción, alergias)...',
    'products.required': 'Obligatorio',
    'products.optional': 'Opcional',
    'products.select_at_least': 'Selecciona al menos',
    'products.select_max': 'Máximo permitido',

    // Cart Screen
    'cart.title': 'Tu Carrito',
    'cart.empty_title': 'El carrito está vacío',
    'cart.empty_desc': 'Aún no has añadido ningún plato a tu pedido.',
    'cart.start_order': 'Explorar el Menú',
    'cart.order_summary': 'Resumen del Pedido',
    'cart.clear_all': 'Vaciar Carrito',
    'cart.clear_confirm': '¿Seguro que deseas vaciar todos los artículos del carrito?',
    'cart.checkout': 'Proceder al Pago',
    'cart.sold_out_warning': 'Uno o más artículos en tu carrito están agotados. Elimínalos para continuar.',

    // Order Confirmation Screen
    'order_confirm.title': 'Confirmar Pedido',
    'order_confirm.service_type': '¿Dónde deseas consumir?',
    'order_confirm.eat_in': '🍽️ Comer Aquí en Mesa',
    'order_confirm.take_away': '🛍️ Para Llevar',
    'order_confirm.payment_method': 'Selecciona Método de Pago',
    'order_confirm.pay_cash': '💵 Pagar en Caja (Efectivo / Tarjeta)',
    'order_confirm.pay_pos': '💳 Pagar en el Tótem (Tarjeta / POS)',
    'order_confirm.send_order': 'Enviar Pedido a Cocina',
    'order_confirm.creating': 'Enviando el pedido a la cocina...',
    'order_confirm.success_title': '¡Pedido Enviado a la Cocina!',
    'order_confirm.order_number_label': 'NÚMERO DE PEDIDO',
    'order_confirm.keep_receipt': 'Recoge tu ticket de cortesía y espera tu turno en el monitor.',
    'order_confirm.new_order': 'Iniciar Nuevo Pedido',

    // Admin Navigation
    'nav.products': 'Productos',
    'nav.categories': 'Categorías',
    'nav.groups': 'Grupos',
    'nav.kiosk': 'Control Kiosco',
    'nav.settings': 'Ajustes',
    'nav.license': 'Licencia e Info',
    'nav.kitchen': 'Pantalla Cocina KDS',

    // KDS Kitchen Screen
    'kds.title': 'Monitor de Cocina KDS',
    'kds.active_orders': 'Comandas Activas',
    'kds.status_to_prepare': 'Por Preparar',
    'kds.status_preparing': 'En Preparación',
    'kds.status_ready': 'Listo para Recoger',
    'kds.status_completed': 'Entregado',
    'kds.elapsed': 'Transcurrido',
    'kds.mark_preparing': 'Iniciar Prep',
    'kds.mark_ready': 'Marcar como Listo',
    'kds.mark_completed': 'Entregar al Cliente',
    'kds.all_stations': 'Todas las Secciones',

    // Kiosk Module
    'kiosk.title': 'Control Kiosco y Pantalla',
    'kiosk.lockdown_title': 'Modo Kiosco y Bloqueo',
    'kiosk.fullscreen': 'Pantalla Completa Inmersiva',
    'kiosk.keep_awake': 'Mantener Pantalla Encendida',
    'kiosk.auto_boot': 'Inicio Automático al Encender',
    'kiosk.screensaver': 'Salvapantallas e Inactividad',
    'kiosk.timeout': 'Tiempo de Inactividad',
    'kiosk.auto_reset_cart': 'Auto-Reset de Carrito Abandonado',
    'kiosk.brightness': 'Brillo de la Pantalla',
    'kiosk.night_dimming': 'Atenuación Nocturna Automática',
    'kiosk.secret_unlock': 'Gesto Secreto de Desbloqueo (7 Toques)',
    'kiosk.wake_btn': '☀️ Despertar Pantalla',
    'kiosk.screensaver_btn': '🖼️ Iniciar Salvapantallas',
    'kiosk.reload_btn': '🔄 Recargar App',

    // Guide Title & Header
    'guide.title': '📖 Guía Completa y Manual Operativo del Tótem',
    'guide.subtitle': 'Instrucciones paso a paso para pedidos, hardware de impresión y operaciones de restaurante',
    'guide.interactive_helper': 'Asistente Interactivo Tótem QuickBite',
    'guide.tab_all': 'Todos los Capítulos',
    'guide.tab_customer': 'Flujo Clientes',
    'guide.tab_admin': 'Gestión Restaurante',
    'guide.tab_hardware': 'Hardware e Impresoras',
  },

  fr: {
    // Common / Global
    'common.confirm': 'Confirmer',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.saved': 'Enregistré avec succès !',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.back': 'Retour',
    'common.close': 'Fermer',
    'common.loading': 'Chargement...',
    'common.success': 'Opération réussie !',
    'common.error': 'Une erreur est survenue',
    'common.search': 'Rechercher...',
    'common.total': 'Total',
    'common.quantity': 'Quantité',
    'common.price': 'Prix',
    'common.free': 'Gratuit',
    'common.active': 'Actif',
    'common.inactive': 'Inactif',
    'common.print': 'Imprimer',
    'common.language': 'Langue',
    'common.choose_language': 'Choisir la Langue',
    'common.seconds': 'secondes',

    // Welcome Screen
    'welcome.greeting': 'Bienvenue !',
    'welcome.how_to_proceed': 'Comment souhaitez-vous commander ?',
    'welcome.take_number_title': 'Prendre un Numéro Seul',
    'welcome.take_number_desc': 'Commandez au comptoir avec notre personnel',
    'welcome.order_totem_title': 'Commander sur la Borne',
    'welcome.order_totem_desc': 'Composez et personnalisez votre commande ici',
    'welcome.admin_access_title': 'Accès Administrateur',
    'welcome.admin_access_desc': 'Entrez le code PIN pour gérer la borne',

    // Take Number Screen
    'take_number.loading': 'Génération du numéro...',
    'take_number.ticket_title': 'TICKET DE RÉSERVATION',
    'take_number.your_number': 'VOTRE NUMÉRO',
    'take_number.go_to_counter': 'Présentez-vous à la caisse pour commander',
    'take_number.date': 'Date',
    'take_number.time': 'Heure',
    'take_number.auto_return': 'Retour à l\'accueil dans',
    'take_number.new_ticket': 'Nouveau Ticket',

    // Categories Screen
    'categories.title': 'Catégories',
    'categories.subtitle': 'Que souhaitez-vous déguster aujourd\'hui ?',
    'categories.empty': 'Aucune catégorie disponible actuellement.',
    'categories.view_cart': 'Voir le Panier',

    // Products Screen
    'products.title': 'Menu',
    'products.subtitle': 'Choisissez vos plats préférés',
    'products.empty': 'Aucun plat disponible dans cette catégorie.',
    'products.sold_out': 'Épuisé',
    'products.sold_out_badge': 'NON DISPONIBLE',
    'products.customize': 'Personnaliser',
    'products.add_to_cart': 'Ajouter au Panier',
    'products.update_cart': 'Mettre à Jour dans le Panier',
    'products.without_ingredients': 'Retirer des Ingrédients (Sans)',
    'products.extra_additions': 'Suppléments & Extras',
    'products.choose_options': 'Choisir les Options',
    'products.notes_placeholder': 'Notes pour la cuisine (ex. cuisson, allergies)...',
    'products.required': 'Obligatoire',
    'products.optional': 'Facultatif',
    'products.select_at_least': 'Sélectionnez au moins',
    'products.select_max': 'Maximum autorisé',

    // Cart Screen
    'cart.title': 'Votre Panier',
    'cart.empty_title': 'Votre panier est vide',
    'cart.empty_desc': 'Vous n\'avez encore ajouté aucun plat.',
    'cart.start_order': 'Découvrir le Menu',
    'cart.order_summary': 'Récapitulatif de Commande',
    'cart.clear_all': 'Vider le Panier',
    'cart.clear_confirm': 'Voulez-vous vraiment vider tous les articles ?',
    'cart.checkout': 'Passer au Paiement',
    'cart.sold_out_warning': 'Un ou plusieurs articles sont épuisés. Retirez-les pour continuer.',

    // Order Confirmation Screen
    'order_confirm.title': 'Confirmation de Commande',
    'order_confirm.service_type': 'Mode de Dégustation',
    'order_confirm.eat_in': '🍽️ Sur Place (À Table)',
    'order_confirm.take_away': '🛍️ À Emporter',
    'order_confirm.payment_method': 'Mode de Paiement',
    'order_confirm.pay_cash': '💵 Payer en Caisse (Espèces / Carte)',
    'order_confirm.pay_pos': '💳 Payer sur la Borne (CB / Sans Contact)',
    'order_confirm.send_order': 'Envoyer la Commande en Cuisine',
    'order_confirm.creating': 'Envoi de la commande à la cuisine...',
    'order_confirm.success_title': 'Commande Envoyée en Cuisine !',
    'order_confirm.order_number_label': 'NUMÉRO DE COMMANDE',
    'order_confirm.keep_receipt': 'Prenez votre ticket et surveillez l\'écran d\'appel.',
    'order_confirm.new_order': 'Nouvelle Commande',

    // Admin Navigation
    'nav.products': 'Produits',
    'nav.categories': 'Catégories',
    'nav.groups': 'Groupes',
    'nav.kiosk': 'Contrôle Borne',
    'nav.settings': 'Paramètres',
    'nav.license': 'Licence & Info',
    'nav.kitchen': 'Écran Cuisine KDS',

    // KDS Kitchen Screen
    'kds.title': 'Écran Cuisine KDS',
    'kds.active_orders': 'Bons Actifs',
    'kds.status_to_prepare': 'À Préparer',
    'kds.status_preparing': 'En Préparation',
    'kds.status_ready': 'Prêt au Retrait',
    'kds.status_completed': 'Livré',
    'kds.elapsed': 'Écoulé',
    'kds.mark_preparing': 'Démarrer Prépa',
    'kds.mark_ready': 'Marquer Prêt',
    'kds.mark_completed': 'Remettre au Client',
    'kds.all_stations': 'Tous les Postes',

    // Kiosk Module
    'kiosk.title': 'Contrôle Borne & Écran',
    'kiosk.lockdown_title': 'Mode Kiosque & Verrouillage',
    'kiosk.fullscreen': 'Plein Écran Immersif',
    'kiosk.keep_awake': 'Écran Toujours Allumé',
    'kiosk.auto_boot': 'Démarrage Automatique',
    'kiosk.screensaver': 'Écran de Veille & Inactivité',
    'kiosk.timeout': 'Délai d\'Inactivité',
    'kiosk.auto_reset_cart': 'Auto-Reset Panier Abandonné',
    'kiosk.brightness': 'Luminosité de l\'Écran',
    'kiosk.night_dimming': 'Atténuation Nocturne Auto',
    'kiosk.secret_unlock': 'Geste Secret de Déverrouillage (7 Tapes)',
    'kiosk.wake_btn': '☀️ Réveiller l\'Écran',
    'kiosk.screensaver_btn': '🖼️ Lancer Veille',
    'kiosk.reload_btn': '🔄 Recharger l\'App',

    // Guide Title & Header
    'guide.title': '📖 Guide Complet & Manuel Opérationnel Borne',
    'guide.subtitle': 'Instructions pas à pas pour commandes, configuration matériel et gestion de restaurant',
    'guide.interactive_helper': 'Assistant Interactif Borne QuickBite',
    'guide.tab_all': 'Tous les Chapitres',
    'guide.tab_customer': 'Parcours Client',
    'guide.tab_admin': 'Gestion Restaurant',
    'guide.tab_hardware': 'Matériel & Imprimantes',
  },

  de: {
    // Common / Global
    'common.confirm': 'Bestätigen',
    'common.cancel': 'Abbrechen',
    'common.save': 'Speichern',
    'common.saved': 'Erfolgreich gespeichert!',
    'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten',
    'common.back': 'Zurück',
    'common.close': 'Schließen',
    'common.loading': 'Wird geladen...',
    'common.success': 'Vorgang erfolgreich abgeschlossen!',
    'common.error': 'Ein Fehler ist aufgetreten',
    'common.search': 'Suchen...',
    'common.total': 'Gesamt',
    'common.quantity': 'Menge',
    'common.price': 'Preis',
    'common.free': 'Kostenlos',
    'common.active': 'Aktiv',
    'common.inactive': 'Inaktiv',
    'common.print': 'Drucken',
    'common.language': 'Sprache',
    'common.choose_language': 'Sprache wählen',
    'common.seconds': 'Sekunden',

    // Welcome Screen
    'welcome.greeting': 'Herzlich Willkommen!',
    'welcome.how_to_proceed': 'Wie möchten Sie fortfahren?',
    'welcome.take_number_title': 'Nur Wartenummer ziehen',
    'welcome.take_number_desc': 'Bestellen Sie persönlich an der Kasse',
    'welcome.order_totem_title': 'Am Terminal bestellen',
    'welcome.order_totem_desc': 'Bestellung hier zusammenstellen und anpassen',
    'welcome.admin_access_title': 'Admin-Zugang',
    'welcome.admin_access_desc': 'Sicherheits-PIN für Verwaltungsmenü eingeben',

    // Take Number Screen
    'take_number.loading': 'Nummer wird generiert...',
    'take_number.ticket_title': 'RESERVIERUNGS-TICKET',
    'take_number.your_number': 'IHRE NUMMER',
    'take_number.go_to_counter': 'Bitte zur Kasse gehen, um zu bestellen',
    'take_number.date': 'Datum',
    'take_number.time': 'Uhrzeit',
    'take_number.auto_return': 'Zurück zum Startbildschirm in',
    'take_number.new_ticket': 'Neues Ticket',

    // Categories Screen
    'categories.title': 'Kategorien',
    'categories.subtitle': 'Was möchten Sie heute genießen?',
    'categories.empty': 'Derzeit sind keine Kategorien verfügbar.',
    'categories.view_cart': 'Warenkorb anzeigen',

    // Products Screen
    'products.title': 'Speisekarte',
    'products.subtitle': 'Wählen Sie Ihre Lieblingsgerichte',
    'products.empty': 'Keine Artikel in dieser Kategorie verfügbar.',
    'products.sold_out': 'Ausverkauft',
    'products.sold_out_badge': 'NICHT VERFÜGBAR',
    'products.customize': 'Anpassen',
    'products.add_to_cart': 'In den Warenkorb',
    'products.update_cart': 'Im Warenkorb aktualisieren',
    'products.without_ingredients': 'Zutaten entfernen (Ohne)',
    'products.extra_additions': 'Zusätzliche Extras & Toppings',
    'products.choose_options': 'Optionen wählen',
    'products.notes_placeholder': 'Notizen für die Küche (z.B. Garstufe, Allergien)...',
    'products.required': 'Erforderlich',
    'products.optional': 'Optional',
    'products.select_at_least': 'Wählen Sie mindestens',
    'products.select_max': 'Maximal erlaubt',

    // Cart Screen
    'cart.title': 'Ihr Warenkorb',
    'cart.empty_title': 'Ihr Warenkorb ist leer',
    'cart.empty_desc': 'Sie haben noch keine Gerichte hinzugefügt.',
    'cart.start_order': 'Speisekarte erkunden',
    'cart.order_summary': 'Bestellübersicht',
    'cart.clear_all': 'Warenkorb leeren',
    'cart.clear_confirm': 'Möchten Sie wirklich alle Artikel aus dem Warenkorb entfernen?',
    'cart.checkout': 'Zur Kasse gehen',
    'cart.sold_out_warning': 'Ein oder mehrere Artikel im Warenkorb sind ausverkauft. Bitte entfernen.',

    // Order Confirmation Screen
    'order_confirm.title': 'Bestellbestätigung',
    'order_confirm.service_type': 'Verzehrart',
    'order_confirm.eat_in': '🍽️ Hier im Restaurant essen',
    'order_confirm.take_away': '🛍️ Zum Mitnehmen',
    'order_confirm.payment_method': 'Zahlungsart wählen',
    'order_confirm.pay_cash': '💵 An der Kasse zahlen (Bar / Karte)',
    'order_confirm.pay_pos': '💳 Am Terminal zahlen (Karte / Kontaktlos)',
    'order_confirm.send_order': 'Bestellung an Küche senden',
    'order_confirm.creating': 'Bestellung wird an die Küche übermittelt...',
    'order_confirm.success_title': 'Bestellung an Küche übermittelt!',
    'order_confirm.order_number_label': 'BESTELLNUMMER',
    'order_confirm.keep_receipt': 'Bitte Beleg entnehmen und Monitor beachten.',
    'order_confirm.new_order': 'Neue Bestellung starten',

    // Admin Navigation
    'nav.products': 'Produkte',
    'nav.categories': 'Kategorien',
    'nav.groups': 'Gruppen',
    'nav.kiosk': 'Kiosk-Steuerung',
    'nav.settings': 'Einstellungen',
    'nav.license': 'Lizenz & Info',
    'nav.kitchen': 'Küchen-Monitor KDS',

    // KDS Kitchen Screen
    'kds.title': 'Küchen-Display KDS',
    'kds.active_orders': 'Aktive Bestellungen',
    'kds.status_to_prepare': 'Zuzubereiten',
    'kds.status_preparing': 'In Zubereitung',
    'kds.status_ready': 'Abholbereit',
    'kds.status_completed': 'Ausgegeben',
    'kds.elapsed': 'Vergangen',
    'kds.mark_preparing': 'Zubereitung starten',
    'kds.mark_ready': 'Als Fertig markieren',
    'kds.mark_completed': 'An Kunden übergeben',
    'kds.all_stations': 'Alle Stationen',

    // Kiosk Module
    'kiosk.title': 'Kiosk & Bildschirm-Steuerung',
    'kiosk.lockdown_title': 'Kiosk-Sperrmodus',
    'kiosk.fullscreen': 'Immersiver Vollbildmodus',
    'kiosk.keep_awake': 'Bildschirm immer an (Keep Awake)',
    'kiosk.auto_boot': 'Automatischer Start beim Einschalten',
    'kiosk.screensaver': 'Bildschirmschoner & Inaktivitäts-Reset',
    'kiosk.timeout': 'Inaktivitäts-Timeout',
    'kiosk.auto_reset_cart': 'Warenkorb bei Inaktivität leeren',
    'kiosk.brightness': 'Display-Helligkeit',
    'kiosk.night_dimming': 'Automatische Nacht-Dimmung',
    'kiosk.secret_unlock': 'Geheime Entsperr-Geste (7x Tippen)',
    'kiosk.wake_btn': '☀️ Bildschirm aufwecken',
    'kiosk.screensaver_btn': '🖼️ Schoner starten',
    'kiosk.reload_btn': '🔄 App neu laden',

    // Guide Title & Header
    'guide.title': '📖 Vollständiges Terminal-Handbuch & Betriebsanleitung',
    'guide.subtitle': 'Schritt-für-Schritt-Anleitung für Bestellungen, Druckereinrichtung und Restaurantbetrieb',
    'guide.interactive_helper': 'Interaktiver Totem-Assistent',
    'guide.tab_all': 'Alle Kapitel',
    'guide.tab_customer': 'Kundenablauf',
    'guide.tab_admin': 'Betriebsleitung',
    'guide.tab_hardware': 'Hardware & Drucker',
  },
};

// Comprehensive 8-Chapter Multilingual User Guide & Helper
export const GUIDE_CHAPTERS: Record<SupportedLanguage, GuideSection[]> = {
  it: [
    {
      id: 'ch1_overview',
      icon: 'restaurant',
      title: '1. Architettura del Sistema Totem QuickBite',
      subtitle: 'Come interagiscono Totem, Cucina KDS, Cassa e Pannello Remoto',
      badge: 'ARCHITETTURA',
      paragraphs: [
        'Totem QuickBite è una piattaforma POS/Kiosk all-in-one creata con architettura Local-First. Funziona al 100% all\'interno della rete locale (LAN/WiFi) del ristorante, garantendo operatività continua anche in assenza di connessione internet esterna.',
        'Il sistema si compone di 4 moduli cooperanti in tempo reale:',
      ],
      bulletPoints: [
        { title: '📱 Totem Touchscreen Cliente', desc: 'Permette ai clienti di ordinare in autonomia o prendere il numero di turno, personalizzando ingredienti, salse e varianti.' },
        { title: '👨‍🍳 Monitor Cucina KDS (Kitchen Display)', desc: 'Riceve istantaneamente le comande dal totem, organizza gli ordini per postazione (Grill, Friggitrice, Pizze, Bar) e calcola i tempi di attesa.' },
        { title: '🖨️ Motore di Stampa ESC/POS', desc: 'Invia la comanda ai cuochi e stampa lo scontrino di cortesia numerato per il cliente via Bluetooth o Ethernet/WiFi.' },
        { title: '🌐 Pannello Remoto Web Manager', desc: 'Permette al gestore di modificare prezzi, nascondere piatti esauriti e monitorare le vendite da smartphone o PC senza interrompere il totem.' },
      ],
      tip: 'Consiglio: Collega il totem e lo schermo cucina allo stesso router WiFi per una sincronizzazione in tempo reale senza ritardi.',
    },
    {
      id: 'ch2_customer_flow',
      icon: 'people',
      title: '2. Guida all\'Uso per il Cliente (Percorso Ordine)',
      subtitle: 'Dalla schermata di benvenuto al ritiro del vassoio',
      badge: 'PERCORSO CLIENTE',
      paragraphs: [
        'L\'interfaccia cliente è progettata con pulsanti extra-large e touch-target generosi per garantire la massima semplicità anche nelle ore di punta:',
      ],
      bulletPoints: [
        { title: '1. Selezione Lingua & Modalità', desc: 'Il cliente può scegliere tra 5 lingue (Italiano, English, Español, Français, Deutsch) e decidere se ordinare al totem o prendere solo il numero.' },
        { title: '2. Esplorazione Categorie & Prodotti', desc: 'I piatti sono suddivisi in categorie con foto, prezzi chiari, allergeni e badge di disponibilità.' },
        { title: '3. Personalizzazione del Piatto', desc: 'Cliccando su un piatto è possibile rimuovere ingredienti non desiderati (es. "Senza Cipolla"), aggiungere extra a pagamento o scegliere varianti menù combo.' },
        { title: '4. Scelta del Servizio (Tavolo o Asporto)', desc: 'Prima del pagamento il cliente seleziona se consumare sul posto o richiedere il sacchetto d\'asporto.' },
        { title: '5. Pagamento & Scontrino', desc: 'Scelta tra pagamento in cassa o con carta al totem. Viene emesso lo scontrino con il numero ordine da mostrare al banco.' },
      ],
      tip: 'Se un cliente lascia il carrello a metà, il timer di inattività azzera automaticamente l\'ordine per il cliente successivo.',
    },
    {
      id: 'ch3_menu_management',
      icon: 'fast-food',
      title: '3. Gestione Menu, Varianti ed Esauriti (86)',
      subtitle: 'Creazione categorie, ingredienti, gruppi opzioni e prezzi',
      badge: 'MENU & CATALOGO',
      paragraphs: [
        'Puoi configurare l\'intero catalogo sia direttamente dal totem (sezione Admin) sia dal pannello remoto web sul tuo telefono:',
      ],
      bulletPoints: [
        { title: 'Categorie & Ordinamento', desc: 'Crea categorie (es. Burger, Pizze, Bevande, Dolci) e trascinale nell\'ordine di visualizzazione desiderato.' },
        { title: 'Gruppi di Opzioni & Combo', desc: 'Crea gruppi di scelta (es. "Scegli la Bibita", "Tipo di Cottura", "Aggiungi Salsa") con regole di selezione minima e massima obbligatoria.' },
        { title: 'Ingredienti Rimovibili & Extra', desc: 'Definisci la ricetta base con ingredienti che il cliente può togliere, e imposta gli extra con il rispettivo sovrapprezzo.' },
        { title: 'Pulsante Esaurito Rapido (86)', desc: 'Con un solo tocco puoi impostare un piatto come "Esaurito": apparirà immediatamente disattivato sul totem senza doverlo eliminare.' },
      ],
      tip: 'Usa il tasto "Esaurito" dal pannello smartphone quando finisce un ingrediente durante il servizio: si aggiorna live in mezzo secondo.',
    },
    {
      id: 'ch4_kds_kitchen',
      icon: 'flame',
      title: '4. Monitor Cucina KDS & Gestione Comande',
      subtitle: 'Avanzamento ordini in tempo reale e riduzione dei tempi d\'attesa',
      badge: 'CUCINA KDS',
      paragraphs: [
        'Il display cucina sostituisce i vecchi bigliettini di carta volanti con un tabellone digitale interattivo a colonne:',
      ],
      bulletPoints: [
        { title: '🟡 Da Preparare (Giallo)', desc: 'Comanda appena inviata dal totem con orario di arrivo e lista precisa di ingredienti e modifiche evidenziate.' },
        { title: '🔵 In Preparazione (Blu)', desc: 'Il cuoco tocca la comanda per indicare che la comanda è sui fuochi / in piastra.' },
        { title: '🟢 Pronto per Ritiro (Verde)', desc: 'Il piatto è pronto: il numero ordine compare sul tabellone sala o viene chiamato il cliente.' },
        { title: 'Filtri di Reparto', desc: 'In cucine grandi puoi filtrare il monitor per mostrare solo le comande del reparto Grill, Pizze o Friggitrice.' },
      ],
      tip: 'Il KDS calcola i minuti trascorsi evidenziando in rosso le comande in ritardo da oltre 15 minuti.',
    },
    {
      id: 'ch5_printers',
      icon: 'print',
      title: '5. Configurazione Stampanti Termiche ESC/POS',
      subtitle: 'Bluetooth, WiFi di rete, scontrini cortesia e comande sdoppiate',
      badge: 'STAMPANTI HARDWARE',
      paragraphs: [
        'Il sistema supporta lo standard industriale ESC/POS per rotoli di carta termica da 58mm e 80mm:',
      ],
      bulletPoints: [
        { title: 'Stampanti Bluetooth', desc: 'Associa la stampante nelle impostazioni Android del tablet, poi selezionala nella scheda Impostazioni Totem.' },
        { title: 'Stampanti Ethernet / WiFi LAN', desc: 'Inserisci l\'indirizzo IP della stampante (es. 192.168.1.200:9100) per collegare stampanti collocate in cucina lontane dal totem.' },
        { title: 'Sdoppiamento Ruoli', desc: 'Puoi assegnare una stampante per lo scontrino cortesia cliente e una seconda stampante termica direttamente sul banco cucina.' },
        { title: 'Stampa Automatica', desc: 'Attiva il toggle "Stampa Automatica all\'Ordine" per far uscire i tagliandi all\'istante senza conferme manuali.' },
      ],
      tip: 'Esegui sempre il "Test Stampa" dalla scheda Impostazioni per verificare la taglierina automatica e la densità del testo.',
    },
    {
      id: 'ch6_kiosk_lockdown',
      icon: 'shield-checkmark',
      title: '6. Modalità Kiosk, Blocco Schermo & Sicurezza',
      subtitle: 'Come blindare il tablet e accedere al menu segreto con PIN',
      badge: 'BLOCCO KIOSK',
      paragraphs: [
        'La modalità Kiosk trasforma qualsiasi tablet commerciale in un totem industriale inaccessibile al pubblico:',
      ],
      bulletPoints: [
        { title: 'Schermo Intero Immersivo', desc: 'Inibisce e nasconde la barra dei tasti Android (Home, Indietro, Recenti) e la tenda delle notifiche.' },
        { title: 'Gesture di Sblocco Segreto', desc: 'Per accedere alle impostazioni, tocca 7 volte rapidamente l\'angolo in alto a destra dello schermo e inserisci il PIN (default: 1234).' },
        { title: 'Salvaschermo & Dimming Notturno', desc: 'Dopo 60 secondi di inattività si avvia il salvaschermo con foto promozionali, e di notte la luminosità cala al 10% per risparmiare energia.' },
        { title: 'Auto-Boot all\'Accensione', desc: 'Se salta la luce o si riavvia il tablet, l\'applicazione si riapre da sola a pieno schermo.' },
      ],
      tip: 'Nelle impostazioni Android del tablet, imposta l\'app come "Home predefinita" per impedire qualsiasi uscita anche con tasti fisici.',
    },
    {
      id: 'ch7_remote_web',
      icon: 'globe',
      title: '7. Pannello di Controllo Remoto Web (Browser LAN)',
      subtitle: 'Controllo completo da smartphone senza toccare il totem',
      badge: 'CONTROLLO REMOTO',
      paragraphs: [
        'Il totem integra un server web locale leggero e super veloce che trasmette l\'interfaccia di gestione sulla rete WiFi:',
      ],
      bulletPoints: [
        { title: 'Come Collegarsi', desc: 'Scansiona il QR Code mostrato in Impostazioni oppure digita nel browser del telefono l\'indirizzo locale (es. http://192.168.1.9:3000/remote).' },
        { title: 'Modifiche Menu in Tempo Reale', desc: 'Aggiungi piatti, cambia prezzi o descrizioni dal tuo smartphone: il totem del cliente si aggiorna live senza riavvii.' },
        { title: 'Controllo Hardware Remoto', desc: 'Dalla nuova scheda Kiosk remota puoi risvegliare il display, avviare il salvaschermo o ricaricare l\'app con un clic.' },
      ],
      tip: 'Salva la pagina del pannello remoto tra i preferiti o sulla schermata home dello smartphone del direttore di sala.',
    },
    {
      id: 'ch8_licensing',
      icon: 'ribbon',
      title: '8. Piani di Abbonamento & Licenza a Vita B2B',
      subtitle: 'Google Play Store vs Fattura Elettronica Diretta P.IVA',
      badge: 'LICENZE & FISCALITÀ',
      paragraphs: [
        'Totem QuickBite offre formule commerciali trasparenti pensate per ogni tipo di attività:',
      ],
      bulletPoints: [
        { title: 'Abbonamento Mensile / Annuale Google Play', desc: 'Attivabile con un click tramite account Google. Include periodo di prova di 30 giorni, aggiornamenti automatici e cancellazione libera in qualsiasi momento.' },
        { title: 'Licenza a Vita B2B (Fattura Elettronica)', desc: 'Acquisto una tantum senza canoni ricorrenti. Fornita con regolare fattura elettronica con Partita IVA italiana 100% deducibile e chiave seriale permanente (es. QKB-B2B-XXXX).' },
        { title: 'Ripristino Licenza su Nuovo Dispositivo', desc: 'Se cambi tablet puoi ripristinare il tuo acquisto Google Play o re-inserire la chiave seriale B2B per riattivare la licenza istantaneamente.' },
      ],
      tip: 'Per richiedere la licenza a vita con fattura fiscale, clicca sul pulsante "Richiedi Fattura B2B" o invia una email a priologiovanni82@gmail.com.',
    },
  ],

  en: [
    {
      id: 'ch1_overview',
      icon: 'restaurant',
      title: '1. Totem QuickBite System Architecture',
      subtitle: 'How Totem, Kitchen KDS, Cash Desk and Remote Admin cooperate',
      badge: 'ARCHITECTURE',
      paragraphs: [
        'Totem QuickBite is an all-in-one POS & self-service kiosk platform built on a Local-First architecture. It runs 100% inside your restaurant local network (LAN/WiFi), guaranteeing uninterrupted operations even without internet connectivity.',
        'The system consists of 4 real-time synchronized modules:',
      ],
      bulletPoints: [
        { title: '📱 Customer Touchscreen Totem', desc: 'Allows customers to order independently or take a queue number, customizing ingredients, toppings and combos.' },
        { title: '👨‍🍳 Kitchen Display System (KDS)', desc: 'Receives instant tickets from the totem, organizes orders by cooking station (Grill, Fryer, Pizza, Bar) and monitors preparation times.' },
        { title: '🖨️ ESC/POS Thermal Printing Engine', desc: 'Dispatches kitchen tickets and prints numbered courtesy receipts via Bluetooth or Ethernet/WiFi.' },
        { title: '🌐 Remote Web Manager Panel', desc: 'Allows managers to edit prices, 86 sold-out dishes and view orders from any smartphone or PC without touching the totem.' },
      ],
      tip: 'Tip: Connect the totem and kitchen monitor to the same local WiFi router for zero-latency live sync.',
    },
    {
      id: 'ch2_customer_flow',
      icon: 'people',
      title: '2. Customer User Guide (Ordering Flow)',
      subtitle: 'From welcome screen to meal pickup',
      badge: 'CUSTOMER JOURNEY',
      paragraphs: [
        'The customer interface features extra-large touch targets and high-contrast typography designed for rapid, error-free ordering during peak hours:',
      ],
      bulletPoints: [
        { title: '1. Language & Mode Selection', desc: 'Customers can choose from 5 languages (Italian, English, Spanish, French, German) and select self-order or queue ticket.' },
        { title: '2. Browsing Categories & Dishes', desc: 'Dishes are grouped into clear categories with images, descriptions, allergen badges and prices.' },
        { title: '3. Meal Customization', desc: 'Tap any dish to omit ingredients (e.g. "No Onions"), add paid extras, or choose meal combo sides and drinks.' },
        { title: '4. Service Preference (Dine In / Takeaway)', desc: 'Before checkout, customers select whether they are eating in the restaurant or taking food to go.' },
        { title: '5. Payment & Order Ticket', desc: 'Choose pay at counter or digital card. A receipt with the order number is printed to track status on the monitor.' },
      ],
      tip: 'If a customer walks away, the inactivity timer automatically resets the cart for the next guest.',
    },
    {
      id: 'ch3_menu_management',
      icon: 'fast-food',
      title: '3. Menu, Variants & 86 Sold-Out Items',
      subtitle: 'Managing categories, ingredients, option groups and prices',
      badge: 'MENU & CATALOG',
      paragraphs: [
        'You can configure the full menu directly on the totem (Admin section) or via the remote web dashboard on your smartphone:',
      ],
      bulletPoints: [
        { title: 'Categories & Ordering', desc: 'Create categories (e.g. Burgers, Pizza, Drinks, Desserts) and arrange them in your preferred display order.' },
        { title: 'Option Groups & Combos', desc: 'Set up choice groups (e.g. "Choose Drink", "Meat Temperature", "Add Sauce") with min/max selection rules.' },
        { title: 'Removable Ingredients & Extras', desc: 'Define recipe ingredients customers can remove, and add paid extra toppings with custom pricing.' },
        { title: 'Quick 86 / Sold-Out Toggle', desc: 'One tap disables sold-out items across all customer screens in real time without deleting them.' },
      ],
      tip: 'Use the 86 toggle from your smartphone when an ingredient runs out during peak dinner rush.',
    },
    {
      id: 'ch4_kds_kitchen',
      icon: 'flame',
      title: '4. Kitchen Display (KDS) & Order Workflow',
      subtitle: 'Real-time kitchen queues and reduced preparation times',
      badge: 'KITCHEN KDS',
      paragraphs: [
        'The kitchen monitor replaces paper tickets with an interactive digital kanban board:',
      ],
      bulletPoints: [
        { title: '🟡 To Prepare (Yellow)', desc: 'New ticket sent from totem with arrival timestamp and highlighted ingredient customizations.' },
        { title: '🔵 Preparing (Blue)', desc: 'The cook taps the ticket to indicate cooking has started on the grill/station.' },
        { title: '🟢 Ready for Pickup (Green)', desc: 'The order is ready: the number appears on the collection monitor or staff calls the customer.' },
        { title: 'Station Filtering', desc: 'Filter orders to show only Grill, Fryer, Pizza or Bar items on dedicated screens.' },
      ],
      tip: 'The KDS highlights tickets in red when preparation time exceeds 15 minutes.',
    },
    {
      id: 'ch5_printers',
      icon: 'print',
      title: '5. ESC/POS Thermal Printer Configuration',
      subtitle: 'Bluetooth, LAN Network, courtesy receipts and split kitchen tickets',
      badge: 'PRINTER HARDWARE',
      paragraphs: [
        'The system supports standard ESC/POS protocol for 58mm and 80mm thermal receipt printers:',
      ],
      bulletPoints: [
        { title: 'Bluetooth Printers', desc: 'Pair the printer in Android system settings, then select it inside Totem Settings.' },
        { title: 'Ethernet / WiFi LAN Printers', desc: 'Enter the printer IP address (e.g. 192.168.1.200:9100) to connect printers located in the kitchen.' },
        { title: 'Role Separation', desc: 'Assign one printer for customer courtesy receipts and a separate printer for kitchen order slips.' },
        { title: 'Auto-Print on Order', desc: 'Enable automatic printing to dispatch tickets instantly upon order submission.' },
      ],
      tip: 'Always perform a "Test Print" from Settings to verify auto-cutter and text alignment.',
    },
    {
      id: 'ch6_kiosk_lockdown',
      icon: 'shield-checkmark',
      title: '6. Kiosk Lockdown, Screen Protection & Security',
      subtitle: 'Securing the tablet and unlocking the admin menu with PIN',
      badge: 'KIOSK LOCKDOWN',
      paragraphs: [
        'Kiosk mode turns any standard tablet into a secure commercial self-ordering totem:',
      ],
      bulletPoints: [
        { title: 'Immersive Fullscreen', desc: 'Hides and blocks system navigation keys (Home, Back, Recent Apps) and notification shade.' },
        { title: 'Secret Gesture Unlock', desc: 'To access admin settings, tap 7 times quickly on the top-right corner and enter the PIN (default: 1234).' },
        { title: 'Screensaver & Night Dimming', desc: 'Starts promo screensaver after 60s of inactivity, and dims brightness to 10% during closing hours.' },
        { title: 'Auto-Start on Boot', desc: 'The app launches automatically when power is restored or the tablet restarts.' },
      ],
      tip: 'In Android system settings, set this app as the "Default Home App" for maximum lockdown.',
    },
    {
      id: 'ch7_remote_web',
      icon: 'globe',
      title: '7. Remote Web Admin (LAN Browser Access)',
      subtitle: 'Total control from your smartphone without touching the totem',
      badge: 'REMOTE CONTROL',
      paragraphs: [
        'The totem hosts an embedded local web server delivering a responsive admin interface over WiFi:',
      ],
      bulletPoints: [
        { title: 'How to Connect', desc: 'Scan the QR Code in Settings or navigate to the local IP (e.g. http://192.168.1.9:3000/remote) on your smartphone.' },
        { title: 'Live Menu Updates', desc: 'Add dishes, update prices or edit descriptions: the totem updates instantly with no restart needed.' },
        { title: 'Remote Hardware Actions', desc: 'Wake the screen, trigger promo screensaver or reload the kiosk app with one click.' },
      ],
      tip: 'Bookmark the remote admin URL on your smartphone home screen for instant manager access.',
    },
    {
      id: 'ch8_licensing',
      icon: 'ribbon',
      title: '8. Subscription Plans & B2B Lifetime License',
      subtitle: 'Google Play Billing vs Direct B2B Invoicing',
      badge: 'LICENSING & TAX',
      paragraphs: [
        'Totem QuickBite provides flexible, transparent licensing options tailored to every hospitality business:',
      ],
      bulletPoints: [
        { title: 'Google Play Monthly / Annual Subscription', desc: 'One-click activation with Google Play account. Includes 30-day free trial, automatic updates and cancel anytime.' },
        { title: 'B2B Lifetime License (VAT Invoicing)', desc: 'One-time purchase with zero recurring fees. Delivered with an official tax invoice and permanent activation serial key (e.g. QKB-B2B-XXXX).' },
        { title: 'Restoring License on New Device', desc: 'Easily restore purchases on new tablets via Google Play Restore or re-entering the B2B key.' },
      ],
      tip: 'To request a B2B invoice license, tap "Request B2B Invoice" or email priologiovanni82@gmail.com.',
    },
  ],

  es: [
    {
      id: 'ch1_overview',
      icon: 'restaurant',
      title: '1. Arquitectura del Sistema Tótem QuickBite',
      subtitle: 'Cómo interactúan Tótem, Cocina KDS, Caja y Panel Remoto',
      badge: 'ARQUITECTURA',
      paragraphs: [
        'Totem QuickBite es una plataforma POS y quiosco de autoservicio todo en uno con arquitectura Local-First. Funciona 100% dentro de la red local (LAN/WiFi) de su restaurante, garantizando un servicio ininterrumpido sin depender de internet.',
      ],
      bulletPoints: [
        { title: '📱 Tótem Táctil para Clientes', desc: 'Permite pedir de forma autónoma o tomar turno, personalizando ingredientes y combos.' },
        { title: '👨‍🍳 Monitor de Cocina KDS', desc: 'Recibe comandas al instante, organiza pedidos por estación (Plancha, Freidora, Pizza) y calcula tiempos.' },
        { title: '🖨️ Impresión Térmica ESC/POS', desc: 'Envía comandas a cocina e imprime tickets de cortesía numerados vía Bluetooth o WiFi.' },
        { title: '🌐 Panel Web Remoto para Gerentes', desc: 'Permite cambiar precios y marcar platos agotados desde su móvil sin interrumpir el tótem.' },
      ],
      tip: 'Consejo: Conecte el tótem y la pantalla de cocina al mismo router WiFi para una sincronización en tiempo real.',
    },
    {
      id: 'ch2_customer_flow',
      icon: 'people',
      title: '2. Guía del Cliente (Flujo de Pedido)',
      subtitle: 'Desde la pantalla de bienvenida hasta la entrega',
      badge: 'FLUJO CLIENTE',
      paragraphs: [
        'La interfaz de cliente cuenta con botones táctiles grandes diseñados para agilizar los pedidos en horas punta:',
      ],
      bulletPoints: [
        { title: '1. Selección de Idioma y Modo', desc: 'El cliente elige entre 5 idiomas y decide si pedir en el tótem o tomar solo el turno.' },
        { title: '2. Exploración de Categorías', desc: 'Platos ordenados con fotos, descripciones, alérgenos y precios claros.' },
        { title: '3. Personalización del Plato', desc: 'Posibilidad de quitar ingredientes (ej. "Sin Cebolla") o añadir extras de pago.' },
        { title: '4. Consumo en Mesa o Para Llevar', desc: 'Elección entre consumir en el local o empaquetar para llevar.' },
        { title: '5. Pago y Ticket con Turno', desc: 'Pago en caja o tarjeta digital. Se imprime el ticket con el número de pedido.' },
      ],
      tip: 'Si el cliente se retira sin terminar, el carrito se reinicia automáticamente.',
    },
    {
      id: 'ch3_menu_management',
      icon: 'fast-food',
      title: '3. Gestión de Menú, Variantes y Agotados (86)',
      subtitle: 'Creación de categorías, extras, grupos de opciones y precios',
      badge: 'MENÚ Y CATÁLOGO',
      paragraphs: [
        'Configure su carta tanto desde el tótem como desde el panel web en su teléfono móvil:',
      ],
      bulletPoints: [
        { title: 'Categorías y Orden', desc: 'Cree categorías (Hamburguesas, Pizzas, Bebidas, Postres) y ordénelas fácilmente.' },
        { title: 'Grupos de Opciones y Menús', desc: 'Configure opciones obligatorias (ej. "Elige Bebida", "Punto de Carne") con mínimos y máximos.' },
        { title: 'Ingredientes y Extras', desc: 'Defina ingredientes que el cliente puede quitar y extras con suplemento de precio.' },
        { title: 'Botón de Agotado Rápido (86)', desc: 'Desactive productos agotados con un solo toque sin tener que borrarlos.' },
      ],
      tip: 'Utilice el botón de Agotado desde su móvil cuando se acabe un ingrediente durante el servicio.',
    },
    {
      id: 'ch4_kds_kitchen',
      icon: 'flame',
      title: '4. Monitor de Cocina KDS y Comandas',
      subtitle: 'Gestión de comandas en tiempo real y reducción de esperas',
      badge: 'COCINA KDS',
      paragraphs: [
        'Sustituye los tickets de papel por un panel digital táctil interactivo:',
      ],
      bulletPoints: [
        { title: '🟡 Por Preparar (Amarillo)', desc: 'Comanda recién llegada con hora y lista de ingredientes modificados.' },
        { title: '🔵 En Preparación (Azul)', desc: 'El cocinero pulsa para indicar que el pedido está en marcha.' },
        { title: '🟢 Listo (Verde)', desc: 'El pedido está listo para recoger por el cliente o camarero.' },
      ],
      tip: 'El KDS resalta en rojo las comandas que superan los 15 minutos de espera.',
    },
    {
      id: 'ch5_printers',
      icon: 'print',
      title: '5. Configuración de Impresoras Térmicas ESC/POS',
      subtitle: 'Bluetooth, Red LAN, tickets de cortesía y comandas separadas',
      badge: 'IMPRESORAS',
      paragraphs: [
        'Soporta el estándar industrial ESC/POS en rollos térmicos de 58mm y 80mm:',
      ],
      bulletPoints: [
        { title: 'Impresoras Bluetooth', desc: 'Empareje en Android y selecciónela en los Ajustes del Tótem.' },
        { title: 'Impresoras Ethernet / WiFi', desc: 'Introduzca la IP (ej. 192.168.1.200:9100) para impresoras en cocina.' },
        { title: 'Separación de Roles', desc: 'Asigne una impresora para tickets de cliente y otra para cocina.' },
      ],
      tip: 'Haga una "Prueba de Impresión" desde Ajustes para verificar el corte y la nitidez.',
    },
    {
      id: 'ch6_kiosk_lockdown',
      icon: 'shield-checkmark',
      title: '6. Modo Kiosco, Bloqueo y Seguridad',
      subtitle: 'Protección del dispositivo y desbloqueo secreto con PIN',
      badge: 'BLOQUEO KIOSCO',
      paragraphs: [
        'Bloquea el tablet para convertirlo en un terminal de autoservicio seguro:',
      ],
      bulletPoints: [
        { title: 'Pantalla Completa Inmersiva', desc: 'Oculta botones de navegación de Android y barra de notificaciones.' },
        { title: 'Gesto Secreto de Desbloqueo', desc: 'Toque 7 veces la esquina superior derecha e introduzca el PIN (por defecto 1234).' },
        { title: 'Salvapantallas y Dimm Nocturno', desc: 'Salvapantallas con fotos y brillo al 10% durante la noche.' },
      ],
      tip: 'Configure la app como "Inicio predeterminado" en los ajustes de Android.',
    },
    {
      id: 'ch7_remote_web',
      icon: 'globe',
      title: '7. Panel Web Remoto (Navegador LAN)',
      subtitle: 'Control total desde su smartphone sin tocar el tótem',
      badge: 'CONTROL REMOTO',
      paragraphs: [
        'Servidor web local que permite administrar el tótem mediante WiFi:',
      ],
      bulletPoints: [
        { title: 'Cómo Conectarse', desc: 'Escanee el código QR en Ajustes o abra la IP local en el navegador del móvil.' },
        { title: 'Actualización en Vivo', desc: 'Modifique precios y platos: el tótem se actualiza al instante.' },
      ],
      tip: 'Guarde la dirección del panel remoto en la pantalla de inicio de su teléfono.',
    },
    {
      id: 'ch8_licensing',
      icon: 'ribbon',
      title: '8. Suscripciones y Licencia de por Vida B2B',
      subtitle: 'Google Play Billing vs Facturación Fiscal Directa',
      badge: 'LICENCIAS',
      paragraphs: [
        'Opciones comerciales adaptadas a cualquier negocio de hostelería:',
      ],
      bulletPoints: [
        { title: 'Suscripción Google Play', desc: 'Prueba gratuita de 30 días, actualizaciones automáticas y cancelación libre.' },
        { title: 'Licencia de por Vida B2B', desc: 'Pago único con factura deducible y clave de serie permanente.' },
      ],
      tip: 'Para solicitar factura B2B, contacte en priologiovanni82@gmail.com.',
    },
  ],

  fr: [
    {
      id: 'ch1_overview',
      icon: 'restaurant',
      title: '1. Architecture Système Borne QuickBite',
      subtitle: 'Borne tactile, Écran Cuisine KDS, Caisse et Gestion Web',
      badge: 'ARCHITECTURE',
      paragraphs: [
        'Totem QuickBite est une plateforme POS et borne de commande autonome conçue avec une architecture Local-First. Elle fonctionne à 100% sur le réseau local (LAN/WiFi) de votre restaurant, garantissant une continuité absolue même sans connexion internet.',
      ],
      bulletPoints: [
        { title: '📱 Borne Tactile Client', desc: 'Permet aux clients de commander ou de prendre un ticket avec personnalisation des ingrédients.' },
        { title: '👨‍🍳 Écran Cuisine KDS', desc: 'Affiche les bons en temps réel par poste de préparation (Grill, Friteuse, Pizza, Bar).' },
        { title: '🖨️ Impression Thermique ESC/POS', desc: 'Sortie automatique des tickets cuisine et reçus clients en Bluetooth ou WiFi.' },
        { title: '🌐 Tableau de Bord Web Distant', desc: 'Gestion des prix et des ruptures depuis votre smartphone sans toucher la borne.' },
      ],
      tip: 'Conseil : Connectez la borne et l\'écran cuisine sur la même box WiFi pour une synchronisation instantanée.',
    },
    {
      id: 'ch2_customer_flow',
      icon: 'people',
      title: '2. Guide d\'Utilisation Client (Parcours de Commande)',
      subtitle: 'De l\'écran d\'accueil au retrait de la commande',
      badge: 'PARCOURS CLIENT',
      paragraphs: [
        'Une interface ergonomique conçue pour fluidifier les commandes en période de forte affluence :',
      ],
      bulletPoints: [
        { title: '1. Choix de la Langue', desc: 'Sélection parmi 5 langues et choix entre commander ou prendre un ticket.' },
        { title: '2. Choix des Plats & Menus', desc: 'Navigation fluide dans les catégories avec photos, allergènes et prix.' },
        { title: '3. Personnalisation des Recettes', desc: 'Retrait d\'ingrédients (ex. "Sans Oignon") et ajout de suppléments payants.' },
        { title: '4. Sur Place ou À Emporter', desc: 'Précisez votre mode de dégustation avant le paiement.' },
        { title: '5. Paiement & Ticket Numéroté', desc: 'Paiement en caisse ou par carte. Un ticket numéroté est imprimé.' },
      ],
      tip: 'En cas d\'abandon, le panier se réinitialise automatiquement après inactivité.',
    },
    {
      id: 'ch3_menu_management',
      icon: 'fast-food',
      title: '3. Gestion du Menu, Options et Ruptures (86)',
      subtitle: 'Catégories, recettes, menus combos et gestion des stocks',
      badge: 'MENU & STOCKS',
      paragraphs: [
        'Configurez facilement votre carte depuis la borne ou depuis votre smartphone :',
      ],
      bulletPoints: [
        { title: 'Catégories & Ordre', desc: 'Créez vos familles de produits et organisez l\'affichage.' },
        { title: 'Groupes d\'Options & Combos', desc: 'Définissez des choix obligatoires (Boisson, Cuisson, Sauce).' },
        { title: 'Bouton Rupture Rapide (86)', desc: 'Désactivez un plat épuisé en un clic sans le supprimer.' },
      ],
      tip: 'Utilisez le bouton Rupture depuis votre mobile lors des coups de feu.',
    },
    {
      id: 'ch4_kds_kitchen',
      icon: 'flame',
      title: '4. Écran Cuisine KDS & Bons de Commande',
      subtitle: 'Affichage des commandes en direct et réduction des délais',
      badge: 'CUISINE KDS',
      paragraphs: [
        'Remplacez les tickets papier par un écran interactif par colonnes de statut :',
      ],
      bulletPoints: [
        { title: '🟡 À Préparer (Jaune)', desc: 'Nouveau bon reçu avec heure et modifications demandées.' },
        { title: '🔵 En Préparation (Bleu)', desc: 'Le cuisinier indique le début de cuisson.' },
        { title: '🟢 Prêt (Vert)', desc: 'La commande est prête à être servie ou remise au client.' },
      ],
      tip: 'Les commandes de plus de 15 minutes sont surlignées en rouge.',
    },
    {
      id: 'ch5_printers',
      icon: 'print',
      title: '5. Configuration des Imprimantes ESC/POS',
      subtitle: 'Bluetooth, Réseau Ethernet/WiFi et répartition des rôles',
      badge: 'IMPRIMANTES',
      paragraphs: [
        'Prise en charge des imprimantes thermiques 58mm et 80mm ESC/POS :',
      ],
      bulletPoints: [
        { title: 'Bluetooth & Réseau IP', desc: 'Connexion simple en Bluetooth ou par adresse IP locale.' },
        { title: 'Double Impression', desc: 'Une imprimante pour le reçu client et une autre pour la cuisine.' },
      ],
      tip: 'Faites un test d\'impression dans les Paramètres pour vérifier la découpe.',
    },
    {
      id: 'ch6_kiosk_lockdown',
      icon: 'shield-checkmark',
      title: '6. Mode Kiosque & Sécurité Matérielle',
      subtitle: 'Verrouillage tablette et déverrouillage secret par PIN',
      badge: 'VERROUILLAGE',
      paragraphs: [
        'Sécurise la tablette pour une utilisation exclusive en borne de commande :',
      ],
      bulletPoints: [
        { title: 'Plein Écran Immersif', desc: 'Bloque l\'accès aux boutons Android et à la barre de notification.' },
        { title: 'Déverrouillage Secret (7 Tapes)', desc: 'Tapez 7 fois en haut à droite pour saisir le code PIN (1234 par défaut).' },
      ],
      tip: 'Définissez l\'application comme écran d\'accueil par défaut sur Android.',
    },
    {
      id: 'ch7_remote_web',
      icon: 'globe',
      title: '7. Tableau de Bord Web Distant (Accès LAN)',
      subtitle: 'Contrôlez la borne depuis votre téléphone sur le réseau local',
      badge: 'CONTRÔLE DISTANT',
      paragraphs: [
        'Serveur web intégré permettant la gestion à distance sans fil :',
      ],
      bulletPoints: [
        { title: 'Connexion par QR Code', desc: 'Flashez le QR Code dans les Paramètres avec votre smartphone.' },
        { title: 'Modifications Directes', desc: 'Mettez à jour les prix sans redémarrer la borne.' },
      ],
      tip: 'Ajoutez la page sur l\'écran d\'accueil de votre smartphone.',
    },
    {
      id: 'ch8_licensing',
      icon: 'ribbon',
      title: '8. Abonnements & Licence à Vie B2B',
      subtitle: 'Google Play Store vs Facturation Professionnelle',
      badge: 'LICENCES',
      paragraphs: [
        'Des formules transparentes adaptées à chaque établissement :',
      ],
      bulletPoints: [
        { title: 'Abonnement Google Play', desc: 'Essai gratuit de 30 jours et résiliation libre.' },
        { title: 'Licence à Vie B2B', desc: 'Achat unique avec facture professionnelle et clé permanente.' },
      ],
      tip: 'Contactez priologiovanni82@gmail.com pour une facture B2B.',
    },
  ],

  de: [
    {
      id: 'ch1_overview',
      icon: 'restaurant',
      title: '1. Totem QuickBite Systemarchitektur',
      subtitle: 'Zusammenspiel von Terminal, Küchen-KDS, Kasse und Web-Admin',
      badge: 'ARCHITEKTUR',
      paragraphs: [
        'Totem QuickBite ist ein ganzheitliches POS- und SB-Bestellterminal mit Local-First-Architektur. Das System läuft zu 100% im lokalen WLAN/LAN Ihres Restaurants und arbeitet auch ohne Internetverbindung stabil.',
      ],
      bulletPoints: [
        { title: '📱 Touchscreen-Bestellterminal', desc: 'Ermöglicht Gästen selbstständiges Bestellen oder Nummernziehen mit Zutatenauswahl.' },
        { title: '👨‍🍳 Küchen-Monitor KDS', desc: 'Echtzeit-Empfang von Bons mit Stationstrennung (Grill, Fritteuse, Pizza, Bar).' },
        { title: '🖨️ ESC/POS Thermodruck', desc: 'Automatischer Ausdruck von Küchenbons und nummerierten Abholbelegen.' },
        { title: '🌐 Web-Fernsteuerung', desc: 'Preise und ausverkaufte Artikel bequem vom Smartphone aus anpassen.' },
      ],
      tip: 'Tipp: Verbinden Sie Terminal und Küchenmonitor mit demselben WLAN für verzögerungsfreie Synchronisation.',
    },
    {
      id: 'ch2_customer_flow',
      icon: 'people',
      title: '2. Kunden-Bedienungsanleitung (Bestellablauf)',
      subtitle: 'Vom Startbildschirm bis zur Essensausgabe',
      badge: 'KUNDENABLAUF',
      paragraphs: [
        'Die intuitive Benutzeroberfläche mit großen Schaltflächen garantiert schnelle Bedienung in Stoßzeiten:',
      ],
      bulletPoints: [
        { title: '1. Sprach- und Moduswahl', desc: 'Auswahl aus 5 Sprachen (DE, IT, EN, ES, FR) und Option: Am Terminal bestellen oder Wartenummer.' },
        { title: '2. Speisekarte durchstöbern', desc: 'Übersichtliche Kategorien mit Fotos, Allergenhinweisen und Preisen.' },
        { title: '3. Gerichte individuell anpassen', desc: 'Zutaten abwählen (z.B. "Ohne Zwiebeln") oder Extras und Beilagen hinzufügen.' },
        { title: '4. Verzehrart (Im Haus / Zum Mitnehmen)', desc: 'Auswahl vor dem Bezahlen.' },
        { title: '5. Bezahlung & Beleg', desc: 'Zahlung an der Kasse oder per Karte am Terminal. Abholnummer wird ausgedruckt.' },
      ],
      tip: 'Verlässt ein Kunde das Terminal, leert der Inaktivitäts-Timer den Warenkorb automatisch.',
    },
    {
      id: 'ch3_menu_management',
      icon: 'fast-food',
      title: '3. Speisekarten- und Ausverkaufs-Verwaltung (86)',
      subtitle: 'Kategorien, Rezepturen, Menü-Kombinationen und Preise',
      badge: 'SPEISEKARTE',
      paragraphs: [
        'Verwalten Sie das Sortiment direkt am Terminal oder per Smartphone:',
      ],
      bulletPoints: [
        { title: 'Kategorien & Reihenfolge', desc: 'Kategorien anlegen (Burger, Pizza, Getränke, Desserts) und anordnen.' },
        { title: 'Optionsgruppen & Menüs', desc: 'Pflichtauswahlen definieren (z.B. Getränkewahl, Garstufe).' },
        { title: 'Schneller Ausverkaufs-Schalter (86)', desc: 'Ausverkaufte Artikel mit einem Tippen deaktivieren.' },
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
      ],
      tip: 'Bestellungen mit über 15 Minuten Wartezeit werden rot hervorgehoben.',
    },
    {
      id: 'ch5_printers',
      icon: 'print',
      title: '5. ESC/POS Thermodrucker-Einrichtung',
      subtitle: 'Bluetooth, LAN-Netzwerk, Kunden- und Küchenbelege',
      badge: 'DRUCKER',
      paragraphs: [
        'Unterstützt 58mm und 80mm ESC/POS Thermodrucker:',
      ],
      bulletPoints: [
        { title: 'Bluetooth & Netzwerk-IP', desc: 'Drucker per Bluetooth koppeln oder IP-Adresse (z.B. 192.168.1.200:9100) eingeben.' },
        { title: 'Rollen-Trennung', desc: 'Separater Belegdruck für Kunden und Küchenpersonal.' },
      ],
      tip: 'Führen Sie in den Einstellungen einen Testdruck durch.',
    },
    {
      id: 'ch6_kiosk_lockdown',
      icon: 'shield-checkmark',
      title: '6. Kiosk-Sperrmodus & Gerätesicherheit',
      subtitle: 'Tablet sichern und Admin-Menü mit PIN entsperren',
      badge: 'SPERRMODUS',
      paragraphs: [
        'Sichert handelsübliche Tablets gegen unbefugten Zugriff ab:',
      ],
      bulletPoints: [
        { title: 'Immersiver Vollbildmodus', desc: 'Android-Systemleisten und Benachrichtigungen werden gesperrt.' },
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
      ],
      tip: 'Legen Sie ein Lesezeichen auf Ihrem Smartphone-Startbildschirm an.',
    },
    {
      id: 'ch8_licensing',
      icon: 'ribbon',
      title: '8. Abonnements & Lebenslange B2B-Lizenz',
      subtitle: 'Google Play Abrechnung vs. Direkte B2B-Rechnung',
      badge: 'LIZENZEN',
      paragraphs: [
        'Transparente Lizenzmodelle für Gastronomiebetriebe:',
      ],
      bulletPoints: [
        { title: 'Google Play Abo', desc: '30 Tage kostenlos testen, monatlich oder jährlich kündbar.' },
        { title: 'Lebenslange B2B-Lizenz', desc: 'Einmalkauf mit steuerlicher Rechnung und Dauerschlüssel.' },
      ],
      tip: 'Kontakt für B2B-Rechnungen: priologiovanni82@gmail.com.',
    },
  ],
};

// State / Event Bus for reactive multi-screen i18n
type Listener = (lang: SupportedLanguage) => void;
const listeners = new Set<Listener>();

let currentLang: SupportedLanguage = 'it';
let isInitialized = false;

export async function initI18n(): Promise<SupportedLanguage> {
  if (isInitialized) return currentLang;
  try {
    const saved = await storage.getItem('app_language', 'it' as SupportedLanguage);
    if (saved && (['it', 'en', 'es', 'fr', 'de'] as SupportedLanguage[]).includes(saved as SupportedLanguage)) {
      currentLang = saved as SupportedLanguage;
    }
  } catch (e) {
    console.warn('initI18n error:', e);
  }
  isInitialized = true;
  return currentLang;
}

export function getCurrentLanguage(): SupportedLanguage {
  return currentLang;
}

export async function setLanguage(lang: SupportedLanguage): Promise<void> {
  if (!(['it', 'en', 'es', 'fr', 'de'] as SupportedLanguage[]).includes(lang)) return;
  currentLang = lang;
  try {
    await storage.setItem('app_language', lang);
  } catch (e) {
    console.warn('setLanguage save error:', e);
  }
  // Notify all active React components
  listeners.forEach((fn) => {
    try {
      fn(lang);
    } catch (err) {
      console.warn('i18n listener error:', err);
    }
  });
}

export function t(key: string, defaultText?: string): string {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.it;
  if (dict[key]) return dict[key];
  const fallback = TRANSLATIONS.it[key];
  if (fallback) return fallback;
  return defaultText || key;
}

export function getGuideForCurrentLanguage(): GuideSection[] {
  return GUIDE_CHAPTERS[currentLang] || GUIDE_CHAPTERS.it;
}

export function useI18n() {
  const [lang, setLangState] = useState<SupportedLanguage>(currentLang);

  useEffect(() => {
    // Initial check
    initI18n().then((l) => setLangState(l));

    const listener: Listener = (newLang) => {
      setLangState(newLang);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const translate = (key: string, defaultText?: string) => {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.it;
    if (dict[key]) return dict[key];
    const fallback = TRANSLATIONS.it[key];
    if (fallback) return fallback;
    return defaultText || key;
  };

  const changeLanguage = async (newLang: SupportedLanguage) => {
    await setLanguage(newLang);
  };

  return {
    lang,
    setLanguage: changeLanguage,
    t: translate,
    languages: SUPPORTED_LANGUAGES,
    guideChapters: GUIDE_CHAPTERS[lang] || GUIDE_CHAPTERS.it,
  };
}
