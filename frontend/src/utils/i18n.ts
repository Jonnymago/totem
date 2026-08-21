import { useEffect, useState } from 'react';
import * as Localization from 'expo-localization';
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
    'products.allergens': 'Allergeni',
    'products.quantity': 'Quantità',
    'products.complete_selection': 'Completa le scelte obbligatorie',

    // Cart Screen
    'cart.title': 'Il Tuo Carrello',
    'cart.empty': 'Il carrello è vuoto',
    'cart.empty_title': 'Il carrello è vuoto',
    'cart.empty_desc': 'Non hai ancora aggiunto nessun piatto al tuo ordine.',
    'cart.start_order': 'Esplora il Menu',
    'cart.order_summary': 'Riepilogo Ordine',
    'cart.clear_all': 'Svuota Carrello',
    'cart.clear_confirm': 'Vuoi davvero svuotare tutti gli articoli dal carrello?',
    'cart.checkout': 'Procedi al Pagamento',
    'cart.sold_out_warning': 'Uno o più articoli nel carrello sono esauriti. Rimuovili per procedere.',
    'cart.edit': 'Modifica',
    'cart.items_count': 'articoli',
    'cart.total': 'Totale',
    'cart.unavailable_items': 'Prodotto esaurito, rimuovilo per procedere',

    // Order Confirmation Screen
    'order_conf.title': 'Conferma Ordine',
    'order_conf.summary': 'Riepilogo Ordine',
    'order_conf.service_type': 'Dove vuoi consumare?',
    'order_conf.eat_in': '🍽️ Consuma Qui al Tavolo',
    'order_conf.take_away': '🛍️ Ordine da Asporto',
    'order_conf.payment_method': 'Seleziona Metodo di Pagamento',
    'order_conf.pay_cash': '💵 Paga alla Cassa (Contanti / Bancomat)',
    'order_conf.pay_pos': '💳 Paga al Totem (Carta / POS Digitale)',
    'order_conf.pay_at_counter': 'Pagamento in cassa al ritiro dell\'ordine.',
    'order_conf.confirm_and_print': 'Conferma Ordine & Stampa Scontrino',
    'order_conf.send_order': 'Invia Ordine in Cucina',
    'order_conf.creating': 'Invio ordine alla cucina in corso...',
    'order_conf.success_title': 'Ordine Inviato in Cucina!',
    'order_conf.order_confirmed': 'Ordine Confermato!',
    'order_conf.sent_to_kitchen': 'Il tuo ordine è stato inviato in cucina. Ritira lo scontrino e attendi la chiamata sul monitor.',
    'order_conf.order_number_label': 'NUMERO ORDINE',
    'order_conf.keep_receipt': 'Ritira lo scontrino di cortesia e attendi la chiamata sul monitor.',
    'order_conf.new_order': 'Inizia Nuovo Ordine',
    'order_conf.error': 'Errore durante la creazione dell\'ordine. Riprova.',

    // Aliases for compatibility
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

    // Settings
    'settings.title': 'Impostazioni',
    'settings.language_section': 'Lingua dell\'Interfaccia Totem',
    'settings.select_language': 'Seleziona la lingua per il totem clienti',

    // Guide Title & Header
    'guide.title': '📖 Guida Completa & Manuale Operativo Totem',
    'guide.subtitle': 'Tutte le istruzioni dettagliate per l\'uso, configurazione hardware e gestione del ristorante',
    'guide.interactive_helper': 'Assistente Interattivo Totem QuickBite',
    'guide.tab_all': 'Tutti i Capitoli',
    'guide.tab_customer': 'Per i Clienti',
    'guide.tab_admin': 'Per i Gestori',
    'guide.tab_hardware': 'Hardware & Stampanti',
    'guide.support_title': 'Hai bisogno di assistenza?',
    'guide.support_desc': 'Contatta il nostro team di supporto per aiuto su hardware, stampanti ESC/POS o licenze.',
    'guide.support_btn': 'Scrivi al Supporto',
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
    'welcome.how_to_proceed': 'How would you like to order?',
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
    'take_number.go_to_counter': 'Please proceed to the counter to place your order',
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
    'products.allergens': 'Allergens',
    'products.quantity': 'Quantity',
    'products.complete_selection': 'Please complete required choices',

    // Cart Screen
    'cart.title': 'Your Cart',
    'cart.empty': 'Your cart is empty',
    'cart.empty_title': 'Your cart is empty',
    'cart.empty_desc': 'You have not added any dishes to your order yet.',
    'cart.start_order': 'Explore the Menu',
    'cart.order_summary': 'Order Summary',
    'cart.clear_all': 'Clear Cart',
    'cart.clear_confirm': 'Are you sure you want to remove all items from the cart?',
    'cart.checkout': 'Proceed to Checkout',
    'cart.sold_out_warning': 'One or more items in your cart are sold out. Remove them to proceed.',
    'cart.edit': 'Edit',
    'cart.items_count': 'items',
    'cart.total': 'Total',
    'cart.unavailable_items': 'Sold out item, please remove to proceed',

    // Order Confirmation Screen
    'order_conf.title': 'Order Confirmation',
    'order_conf.summary': 'Order Summary',
    'order_conf.service_type': 'Dining Preference',
    'order_conf.eat_in': '🍽️ Dine In / Eat Here',
    'order_conf.take_away': '🛍️ Take Away / To Go',
    'order_conf.payment_method': 'Select Payment Method',
    'order_conf.pay_cash': '💵 Pay at Cash Desk (Cash / Card)',
    'order_conf.pay_pos': '💳 Pay at Totem (Digital Card / POS)',
    'order_conf.pay_at_counter': 'Payment at cash desk upon collecting your order.',
    'order_conf.confirm_and_print': 'Confirm Order & Print Ticket',
    'order_conf.send_order': 'Send Order to Kitchen',
    'order_conf.creating': 'Submitting order to the kitchen...',
    'order_conf.success_title': 'Order Sent to Kitchen!',
    'order_conf.order_confirmed': 'Order Confirmed!',
    'order_conf.sent_to_kitchen': 'Your order has been sent to the kitchen. Please take your courtesy receipt and watch the monitor.',
    'order_conf.order_number_label': 'ORDER NUMBER',
    'order_conf.keep_receipt': 'Please take your courtesy receipt and wait for your number on screen.',
    'order_conf.new_order': 'Start New Order',
    'order_conf.error': 'Error submitting order. Please try again.',

    // Aliases for compatibility
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

    // Settings
    'settings.title': 'Settings',
    'settings.language_section': 'Totem Interface Language',
    'settings.select_language': 'Select language for the customer totem',

    // Guide Title & Header
    'guide.title': '📖 Complete Totem Operating Guide & Manual',
    'guide.subtitle': 'Step-by-step instructions for customer orders, hardware setup and restaurant operations',
    'guide.interactive_helper': 'Interactive Helper & Totem Guide',
    'guide.tab_all': 'All Chapters',
    'guide.tab_customer': 'Customer Flow',
    'guide.tab_admin': 'Manager Ops',
    'guide.tab_hardware': 'Hardware & Printers',
    'guide.support_title': 'Need assistance?',
    'guide.support_desc': 'Contact our support team for help with hardware, ESC/POS printers, or licensing.',
    'guide.support_btn': 'Contact Support',
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
    'welcome.how_to_proceed': '¿Cómo deseas pedir?',
    'welcome.take_number_title': 'Solo Turno / Fila',
    'welcome.take_number_desc': 'Pide directamente en caja al personal',
    'welcome.order_totem_title': 'Pedir en el Tótem',
    'welcome.order_totem_desc': 'Crea y personaliza tu pedido aquí',
    'welcome.admin_access_title': 'Acceso Administrador',
    'welcome.admin_access_desc': 'Introduce el PIN de seguridad para gestionar el tótem',

    // Take Number Screen
    'take_number.loading': 'Generando ticket de turno...',
    'take_number.ticket_title': 'TICKET DE TURNO',
    'take_number.your_number': 'TU NÚMERO',
    'take_number.go_to_counter': 'Preséntate en caja para pedir tu comida',
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
    'products.extra_additions': 'Ingredientes Extra y Suplementos',
    'products.choose_options': 'Elegir Opciones',
    'products.notes_placeholder': 'Notas para la cocina (ej. punto de cocción, alergias)...',
    'products.required': 'Obligatorio',
    'products.optional': 'Opcional',
    'products.select_at_least': 'Selecciona al menos',
    'products.select_max': 'Máximo permitido',
    'products.allergens': 'Alérgenos',
    'products.quantity': 'Cantidad',
    'products.complete_selection': 'Completa las opciones obligatorias',

    // Cart Screen
    'cart.title': 'Tu Carrito',
    'cart.empty': 'El carrito está vacío',
    'cart.empty_title': 'El carrito está vacío',
    'cart.empty_desc': 'Aún no has añadido ningún plato a tu pedido.',
    'cart.start_order': 'Explorar el Menú',
    'cart.order_summary': 'Resumen del Pedido',
    'cart.clear_all': 'Vaciar Carrito',
    'cart.clear_confirm': '¿Seguro que deseas vaciar todos los artículos del carrito?',
    'cart.checkout': 'Tramitar Pedido',
    'cart.sold_out_warning': 'Uno o más artículos en tu carrito están agotados. Elimínalos para continuar.',
    'cart.edit': 'Editar',
    'cart.items_count': 'artículos',
    'cart.total': 'Total',
    'cart.unavailable_items': 'Artículo agotado, por favor elimínalo para continuar',

    // Order Confirmation Screen
    'order_conf.title': 'Confirmación del Pedido',
    'order_conf.summary': 'Resumen del Pedido',
    'order_conf.service_type': '¿Dónde deseas consumir?',
    'order_conf.eat_in': '🍽️ Comer Aquí en Mesa',
    'order_conf.take_away': '🛍️ Para Llevar',
    'order_conf.payment_method': 'Selecciona Método de Pago',
    'order_conf.pay_cash': '💵 Pagar en Caja (Efectivo / Tarjeta)',
    'order_conf.pay_pos': '💳 Pagar en el Tótem (Tarjeta / POS)',
    'order_conf.pay_at_counter': 'Pago en caja al recoger tu pedido.',
    'order_conf.confirm_and_print': 'Confirmar Pedido e Imprimir Ticket',
    'order_conf.send_order': 'Enviar Pedido a Cocina',
    'order_conf.creating': 'Enviando el pedido a la cocina...',
    'order_conf.success_title': '¡Pedido Enviado a la Cocina!',
    'order_conf.order_confirmed': '¡Pedido Confirmado!',
    'order_conf.sent_to_kitchen': 'Tu pedido ha sido enviado a la cocina. Recoge tu ticket de cortesía y espera en el monitor.',
    'order_conf.order_number_label': 'NÚMERO DE PEDIDO',
    'order_conf.keep_receipt': 'Recoge tu ticket de cortesía y espera tu turno en el monitor.',
    'order_conf.new_order': 'Iniciar Nuevo Pedido',
    'order_conf.error': 'Ocurrió un error al procesar el pedido. Por favor, inténtalo de nuevo.',

    // Aliases for compatibility
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

    // Settings
    'settings.title': 'Ajustes',
    'settings.language_section': 'Idioma del Tótem',
    'settings.select_language': 'Selecciona el idioma para el tótem de clientes',

    // Guide Title & Header
    'guide.title': '📖 Guía Completa y Manual Operativo del Tótem',
    'guide.subtitle': 'Instrucciones paso a paso para pedidos, hardware de impresión y operaciones de restaurante',
    'guide.interactive_helper': 'Asistente Interactivo Tótem QuickBite',
    'guide.tab_all': 'Todos los Capítulos',
    'guide.tab_customer': 'Flujo Clientes',
    'guide.tab_admin': 'Gestión Restaurante',
    'guide.tab_hardware': 'Hardware e Impresoras',
    'guide.support_title': '¿Necesitas ayuda?',
    'guide.support_desc': 'Contacta con nuestro equipo de soporte para ayuda con hardware, impresoras ESC/POS o licencias.',
    'guide.support_btn': 'Escribir a Soporte',
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
    'welcome.admin_access_desc': 'Entrez le code PIN de sécurité pour gérer la borne',

    // Take Number Screen
    'take_number.loading': 'Génération du ticket en cours...',
    'take_number.ticket_title': 'TICKET DE RÉSERVATION',
    'take_number.your_number': 'VOTRE NUMÉRO',
    'take_number.go_to_counter': 'Présentez-vous à la caisse pour passer commande',
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
    'products.allergens': 'Allergènes',
    'products.quantity': 'Quantité',
    'products.complete_selection': 'Complétez les options obligatoires',

    // Cart Screen
    'cart.title': 'Votre Panier',
    'cart.empty': 'Votre panier est vide',
    'cart.empty_title': 'Votre panier est vide',
    'cart.empty_desc': 'Vous n\'avez encore ajouté aucun plat à votre commande.',
    'cart.start_order': 'Découvrir le Menu',
    'cart.order_summary': 'Récapitulatif de Commande',
    'cart.clear_all': 'Vider le Panier',
    'cart.clear_confirm': 'Voulez-vous vraiment vider tous les articles du panier ?',
    'cart.checkout': 'Valider la Commande',
    'cart.sold_out_warning': 'Un ou plusieurs articles dans votre panier sont épuisés. Retirez-les pour continuer.',
    'cart.edit': 'Modifier',
    'cart.items_count': 'articles',
    'cart.total': 'Total',
    'cart.unavailable_items': 'Article épuisé, veuillez le retirer pour continuer',

    // Order Confirmation Screen
    'order_conf.title': 'Confirmation de Commande',
    'order_conf.summary': 'Récapitulatif de Commande',
    'order_conf.service_type': 'Mode de Dégustation',
    'order_conf.eat_in': '🍽️ Sur Place (À Table)',
    'order_conf.take_away': '🛍️ À Emporter',
    'order_conf.payment_method': 'Mode de Paiement',
    'order_conf.pay_cash': '💵 Payer en Caisse (Espèces / Carte)',
    'order_conf.pay_pos': '💳 Payer sur la Borne (Carte / Sans Contact)',
    'order_conf.pay_at_counter': 'Paiement en caisse lors du retrait de votre commande.',
    'order_conf.confirm_and_print': 'Confirmer la Commande & Imprimer le Ticket',
    'order_conf.send_order': 'Envoyer la Commande en Cuisine',
    'order_conf.creating': 'Envoi de la commande à la cuisine en cours...',
    'order_conf.success_title': 'Commande Envoyée en Cuisine !',
    'order_conf.order_confirmed': 'Commande Confirmée !',
    'order_conf.sent_to_kitchen': 'Votre commande a été envoyée en cuisine. Prenez votre ticket et surveillez l\'écran d\'appel.',
    'order_conf.order_number_label': 'NUMÉRO DE COMMANDE',
    'order_conf.keep_receipt': 'Conservez votre ticket de courtoisie et attendez votre tour sur l\'écran.',
    'order_conf.new_order': 'Nouvelle Commande',
    'order_conf.error': 'Erreur lors de la création de la commande. Veuillez réessayer.',

    // Aliases for compatibility
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

    // Settings
    'settings.title': 'Paramètres',
    'settings.language_section': 'Langue de la Borne',
    'settings.select_language': 'Sélectionnez la langue pour la borne client',

    // Guide Title & Header
    'guide.title': '📖 Guide Complet & Manuel Opérationnel Borne',
    'guide.subtitle': 'Instructions pas à pas pour commandes, configuration matériel et gestion de restaurant',
    'guide.interactive_helper': 'Assistant Interactif Borne QuickBite',
    'guide.tab_all': 'Tous les Chapitres',
    'guide.tab_customer': 'Parcours Client',
    'guide.tab_admin': 'Gestion Restaurant',
    'guide.tab_hardware': 'Matériel & Imprimantes',
    'guide.support_title': 'Besoin d\'assistance ?',
    'guide.support_desc': 'Contactez notre équipe de support pour l\'aide au matériel, imprimantes ESC/POS ou licences.',
    'guide.support_btn': 'Écrire au Support',
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
    'welcome.how_to_proceed': 'Wie möchten Sie bestellen?',
    'welcome.take_number_title': 'Nur Wartenummer ziehen',
    'welcome.take_number_desc': 'Bestellen Sie persönlich an der Kasse',
    'welcome.order_totem_title': 'Am Terminal bestellen',
    'welcome.order_totem_desc': 'Bestellung hier zusammenstellen und anpassen',
    'welcome.admin_access_title': 'Admin-Zugang',
    'welcome.admin_access_desc': 'Sicherheits-PIN für Verwaltungsmenü eingeben',

    // Take Number Screen
    'take_number.loading': 'Wartenummer wird generiert...',
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
    'products.without_ingredients': 'Zutaten abwählen (Ohne)',
    'products.extra_additions': 'Zusätzliche Extras & Beilagen',
    'products.choose_options': 'Optionen wählen',
    'products.notes_placeholder': 'Notizen für die Küche (z.B. Garstufe, Allergien)...',
    'products.required': 'Erforderlich',
    'products.optional': 'Optional',
    'products.select_at_least': 'Wählen Sie mindestens',
    'products.select_max': 'Maximal erlaubt',
    'products.allergens': 'Allergene',
    'products.quantity': 'Menge',
    'products.complete_selection': 'Pflichtauswahl bitte vervollständigen',

    // Cart Screen
    'cart.title': 'Ihr Warenkorb',
    'cart.empty': 'Ihr Warenkorb ist leer',
    'cart.empty_title': 'Ihr Warenkorb ist leer',
    'cart.empty_desc': 'Sie haben noch keine Gerichte hinzugefügt.',
    'cart.start_order': 'Speisekarte erkunden',
    'cart.order_summary': 'Bestellübersicht',
    'cart.clear_all': 'Warenkorb leeren',
    'cart.clear_confirm': 'Möchten Sie wirklich alle Artikel aus dem Warenkorb entfernen?',
    'cart.checkout': 'Bestellung aufgeben',
    'cart.sold_out_warning': 'Ein oder mehrere Artikel im Warenkorb sind ausverkauft. Bitte entfernen.',
    'cart.edit': 'Bearbeiten',
    'cart.items_count': 'Artikel',
    'cart.total': 'Gesamt',
    'cart.unavailable_items': 'Artikel ausverkauft, bitte entfernen',

    // Order Confirmation Screen
    'order_conf.title': 'Bestellbestätigung',
    'order_conf.summary': 'Bestellübersicht',
    'order_conf.service_type': 'Verzehrart',
    'order_conf.eat_in': '🍽️ Hier im Restaurant essen',
    'order_conf.take_away': '🛍️ Zum Mitnehmen',
    'order_conf.payment_method': 'Zahlungsart wählen',
    'order_conf.pay_cash': '💵 An der Kasse zahlen (Bar / Karte)',
    'order_conf.pay_pos': '💳 Am Terminal zahlen (Karte / Kontaktlos)',
    'order_conf.pay_at_counter': 'Zahlung erfolgt an der Kasse bei Abholung.',
    'order_conf.confirm_and_print': 'Bestellung bestätigen & Bon drucken',
    'order_conf.send_order': 'Bestellung an Küche senden',
    'order_conf.creating': 'Bestellung wird an die Küche übermittelt...',
    'order_conf.success_title': 'Bestellung an Küche übermittelt!',
    'order_conf.order_confirmed': 'Bestellung bestätigt!',
    'order_conf.sent_to_kitchen': 'Ihre Bestellung wurde an die Küche gesendet. Bitte Beleg entnehmen und Monitor beachten.',
    'order_conf.order_number_label': 'BESTELLNUMMER',
    'order_conf.keep_receipt': 'Bitte Beleg entnehmen und warten, bis Ihre Nummer aufgerufen wird.',
    'order_conf.new_order': 'Neue Bestellung starten',
    'order_conf.error': 'Fehler bei der Übermittlung. Bitte erneut versuchen.',

    // Aliases for compatibility
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

    // Settings
    'settings.title': 'Einstellungen',
    'settings.language_section': 'Terminal-Sprache',
    'settings.select_language': 'Sprache für das Kunden-Terminal auswählen',

    // Guide Title & Header
    'guide.title': '📖 Vollständiges Terminal-Handbuch & Betriebsanleitung',
    'guide.subtitle': 'Schritt-für-Schritt-Anleitung für Bestellungen, Druckereinrichtung und Restaurantbetrieb',
    'guide.interactive_helper': 'Interaktiver Totem-Assistent',
    'guide.tab_all': 'Alle Kapitel',
    'guide.tab_customer': 'Kundenablauf',
    'guide.tab_admin': 'Betriebsleitung',
    'guide.tab_hardware': 'Hardware & Drucker',
    'guide.support_title': 'Benötigen Sie Hilfe?',
    'guide.support_desc': 'Kontaktieren Sie unser Support-Team für Hilfe bei Hardware, ESC/POS-Druckern oder Lizenzen.',
    'guide.support_btn': 'Support kontaktieren',
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
      title: '3. Gestione Menu, Varianti ed Esauriti',
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
        { title: 'Abbonamento Mensile / Annuale Google Play', desc: 'Attivabile con un click tramite account Google. Include periodo di prova di 7 giorni, aggiornamenti automatici e cancellazione libera in qualsiasi momento.' },
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
        { title: 'Suscripción Google Play', desc: 'Prueba gratuita de 7 días, actualizaciones automáticas y cancelación libre.' },
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
        { title: 'Abonnement Google Play', desc: 'Essai gratuit de 7 jours et résiliation libre.' },
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
      title: '8. Abonnements',
      subtitle: 'Lizenzen und Support',
      badge: 'LIZENZEN',
      paragraphs: [
        'Transparente Lizenzmodelle für Gastronomiebetriebe:',
      ],
      bulletPoints: [
        { title: 'Google Play Abo', desc: '7 Tage kostenlos testen, monatlich oder jährlich kündbar.' },
        { title: 'Lizenz wiederherstellen', desc: 'Einfache Wiederherstellung von Käufen auf neuen Tablets über Google Play.' },
      ],
      tip: 'Die Abonnementverwaltung erfolgt sicher über den Google Play Store.',
    },
  ],
};



// Literal UI strings extracted from the native interface, printer templates and screensavers.
// This keeps legacy screens reactive while they migrate gradually to semantic t('key') calls.
const LITERAL_TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {"it":{"- Senza":"- Senza",", Max":", Max",";base64,":";base64,","\" a":"\" a","\"? Tutti i prodotti associati rimarranno ma non saranno più visibili.":"\"? Tutti i prodotti associati rimarranno ma non saranno più visibili.","(copia)":"(copia)","(Senza nome)":"(Senza nome)",") con addebito sul tuo account Google Play Store?":") con addebito sul tuo account Google Play Store?",") error:":") errore:","[print] attempt":"[print] tentativo","[print] logo nodes failed":"[print] nodi logo falliti","[printer] getStoredPrinterAddress(":"[printer] getStoredPrinterAddress(","[printer] getStoredPrinterConfig error:":"[printer] getStoredPrinterConfig errore:","[printer] savePrinterAddress(":"[printer] savePrinterAddress(","[printer] savePrinterConfig error:":"[printer] savePrinterConfig errore:","[printer][perms] Android >=31 requestMultiple results:":"[printer][perms] Android >=31 requestMultiple risultati:","[printer][perms] Checking Bluetooth permissions...":"[printer][perms] Controllo permessi Bluetooth...","[printer][perms] Exception requesting Bluetooth permissions:":"[printer][perms] Eccezione durante la richiesta dei permessi Bluetooth:","[printer][scan] Calling TP.scan()...":"[printer][scan] Chiamata a TP.scan()...","[printer][scan] Devices breakdown:":"[printer][scan] Suddivisione dispositivi:","[printer][scan] Entering Android/Native Bluetooth branch":"[printer][scan] Entrando nel ramo Android/Native Bluetooth","[printer][scan] Entering Web bridge branch via backend /api/admin/bt/printers":"[printer][scan] Entrando nel ramo Web bridge tramite backend /api/admin/bt/printers","[printer][scan] Final resolved printers list:":"[printer][scan] Lista finale delle stampanti risolte:","[printer][scan] getTP() returned null (thermal printer driver module not available)":"[printer][scan] getTP() ha restituito null (modulo driver stampante termica non disponibile)","[printer][scan] Starting getPairedPrinters...":"[printer][scan] Avvio di getPairedPrinters...","[printer][scan] TP.scan() failed, trying alternative methods:":"[printer][scan] TP.scan() non riuscito, tento metodi alternativi:","[printer][scan] TP.scan() raw result:":"[printer][scan] TP.scan() risultato grezzo:","[printer][scan] Web bridge returned printers:":"[printer][scan] Web bridge ha restituito le stampanti:","*** CUCINA ***":"*** CUCINA ***","/ anno":"/ anno","/ mese":"/ mese","+ Aggiungi extra":"+ Aggiungi extra","+ Aggiungi opzione":"+ Aggiungi opzione","+ Extra €":"+ Extra €","+ Gruppo scelta":"+ Gruppo scelta","+ Ingredienti":"+ Ingredienti","+ Salse/Creme":"+ Salse/Creme","</body></html>":"</body></html>","<html><body style=\"font-family:monospace;white-space:pre;font-size:11px\">":"<html><body style=\"font-family:monospace;white-space:pre;font-size:11px\">","⚠️ IP Wi-Fi non rilevato automaticamente. Inserisci l'indirizzo IP del tablet (es. 192.168.1.9) nel campo sotto per generare il QR Code corretto.":"⚠️ IP Wi-Fi non rilevato automaticamente. Inserisci l'indirizzo IP del tablet (es. 192.168.1.9) nel campo sotto per generare il QR Code corretto.","⚡ Ordine Diretto":"⚡ Ordine Diretto","✅ Test Dimming":"✅ Test Dimming","✅ Test Risveglio":"✅ Test Risveglio","✅ Test Salvaschermo":"✅ Test Salvaschermo","❌ SENZA":"❌ SENZA","🍔 Freschezza & Qualità":"🍔 Freschezza & Qualità","🍟 Facile & Veloce":"🍟 Facile & Veloce","🎉 Abbonamento Attivato!":"🎉 Abbonamento Attivato!","📚 Gruppi Extra Globali (":"📚 Gruppi Extra Globali (","📝 Note:":"📝 Note:","🔔 Feedback Acustico":"🔔 Feedback Acustico","🔴 Esaurito":"🔴 Esaurito","🟢 Attivo (":"🟢 Attivo (","🟢 Disponibile":"🟢 Disponibile","1 display cucina KDS in tempo reale":"1 display cucina KDS in tempo reale","1 postazione Totem touch-screen":"1 postazione Totem touch-screen","1. Concessione della Licenza":"1. Concessione della Licenza","1. la stampante sia già associata nelle impostazioni Bluetooth di Android,":"1. la stampante sia già associata nelle impostazioni Bluetooth di Android,","1. Raccolta e Trattamento dei Dati":"1. Raccolta e Trattamento dei Dati","1. Telefono e totem connessi alla stessa rete Wi-Fi":"1. Telefono e totem connessi alla stessa rete Wi-Fi","10 Tocchi":"10 Tocchi","2 mesi gratuiti inclusi":"2 mesi gratuiti inclusi","2 min":"2 min","2. Apri l'indirizzo sopra nel browser del telefono o scansiona il QR Code":"2. Apri l'indirizzo sopra nel browser del telefono o scansiona il QR Code","2. Gestione dei Pagamenti":"2. Gestione dei Pagamenti","2. i permessi Bluetooth siano concessi,":"2. i permessi Bluetooth siano concessi,","2. Rinnovi e Cancellazioni Abbonamento":"2. Rinnovi e Cancellazioni Abbonamento","3. Effettua l'accesso inserendo il PIN dell'app (":"3. Effettua l'accesso inserendo il PIN dell'app (","3. il Bluetooth del telefono sia attivo.":"3. il Bluetooth del telefono sia attivo.","3. Permessi Hardware":"3. Permessi Hardware","3. Supporto Tecnico e Aggiornamenti":"3. Supporto Tecnico e Aggiornamenti","30 sec":"30 sec","4. Titolare del Trattamento":"4. Titolare del Trattamento","5 min":"5 min","5 Tocchi Rapidi":"5 Tocchi Rapidi","60 sec":"60 sec","7 Tocchi Rapidi (Consigliato)":"7 Tocchi Rapidi (Consigliato)","Abbassa la luminosità al 10% negli orari di chiusura per preservare il pannello.":"Abbassa la luminosità al 10% negli orari di chiusura per preservare il pannello.","Abbonamenti Google Play Store":"Abbonamenti Google Play Store","Abbonamento Attivo":"Abbonamento Attivo","ABBONAMENTO ATTIVO":"ABBONAMENTO ATTIVO","Abbonamento Google Play":"Abbonamento Google Play","Abbonamento registrato:":"Abbonamento registrato:","Abbonamento ripristinato:":"Abbonamento ripristinato:","Accesso Remoto da Smartphone & PC":"Accesso Remoto da Smartphone & PC","Admin Panel":"Admin Panel","Aggiorna lista dispositivi":"Aggiorna lista dispositivi","Aggiornamenti software inclusi":"Aggiornamenti software inclusi","Aggiungi Extra":"Aggiungi Extra","Aggiungi Immagine":"Aggiungi Immagine","Aggiungi opzione":"Aggiungi opzione","Aggiungi sezione":"Aggiungi sezione","Aggiungi sezioni, rinomina, attiva/disattiva e sposta su/giù per decidere l'ordine sul totem.":"Aggiungi sezioni, rinomina, attiva/disattiva e sposta su/giù per decidere l'ordine sul totem.","Aggiungi tutti all elenco":"Aggiungi tutti all elenco","Alle ore:":"Alle ore:","Allergeni (separati da virgola)":"Allergeni (separati da virgola)","Angolo Alto a Destra":"Angolo Alto a Destra","Angolo Alto a Sinistra":"Angolo Alto a Sinistra","Apri nel browser del telefono o inquadra il QR Code:":"Apri nel browser del telefono o inquadra il QR Code:","Attiva o gestisci l'abbonamento con addebito sicuro tramite Google Play Store. Disdici in qualsiasi momento senza vincoli.":"Attiva o gestisci l'abbonamento con addebito sicuro tramite Google Play Store. Disdici in qualsiasi momento senza vincoli.","Attiva su Google Play":"Attiva su Google Play","Auto-print courtesy failed":"Stampa automatica cortesia non riuscita","Auto-print kitchen failed":"Stampa automatica cucina non riuscita","Auto-Reset Carrello Abbandonato":"Auto-Reset Carrello Abbandonato","Avvio Automatico all'Accensione (Auto-Boot)":"Avvio Automatico all'Accensione (Auto-Boot)","Azzerando la numerazione, il prossimo ordine ripartirà da #1 e tutte le comande attuali verranno cancellate dalla schermata cucina.":"Azzerando la numerazione, il prossimo ordine ripartirà da #1 e tutte le comande attuali verranno cancellate dalla schermata cucina.","Backup / Migrazione":"Backup / Migrazione","Backup creato":"Backup creato","Backup e ripristino illimitati":"Backup e ripristino illimitati","Backup pronto":"Backup pronto","Backup salvato":"Backup salvato","Banner Promozionale":"Banner Promozionale","Benvenuto!":"Benvenuto!","Blocca il tablet in modalità totem esclusiva. Nasconde la barra di navigazione Android e impedisce l'uscita non autorizzata ai clienti.":"Blocca il tablet in modalità totem esclusiva. Nasconde la barra di navigazione Android e impedisce l'uscita non autorizzata ai clienti.","Bridge BT non disponibile:":"Bridge BT non disponibile:","BT print failed, PDF fallback":"Stampa BT fallita, ripiego su PDF","Cambia Immagine":"Cambia Immagine","Carica Logo":"Carica Logo","Caricamento stato licenza e abbonamenti...":"Caricamento stato licenza e abbonamenti...","Categoria *":"Categoria *","Categoria aggiornata":"Categoria aggiornata","Categoria creata":"Categoria creata","Categoria eliminata":"Categoria eliminata","categorie e":"categorie e","Cerca dispositivi Bluetooth":"Cerca dispositivi Bluetooth","collegati)":"collegati)","Comando di risveglio schermo eseguito con successo.":"Comando di risveglio schermo eseguito con successo.","Compatibile con MPT, Xprinter, Rongta e altre ESC/POS (Bluetooth Classic e BLE). Mostra tutti i dispositivi Bluetooth paired e vicini: scegli la stampante e assegna Scontrino o Cucina.":"Compatibile con MPT, Xprinter, Rongta e altre ESC/POS (Bluetooth Classic e BLE). Mostra tutti i dispositivi Bluetooth paired e vicini: scegli la stampante e assegna Scontrino o Cucina.","Compila almeno un campo":"Compila almeno un campo","Compila tutti i campi obbligatori":"Compila tutti i campi obbligatori","Componi il Tuo Piatto":"Componi il Tuo Piatto","Conferma Eliminazione":"Conferma Eliminazione","Conferma PIN":"Conferma PIN","Conferma Reset":"Conferma Reset","Conferma su Google Play":"Conferma su Google Play","Configura il comportamento del totem quando nessun cliente interagisce con lo schermo.":"Configura il comportamento del totem quando nessun cliente interagisce con lo schermo.","Consenti l'accesso alle foto nelle impostazioni Android/FydeOS per aggiungere immagini ai prodotti.":"Consenti l'accesso alle foto nelle impostazioni Android/FydeOS per aggiungere immagini ai prodotti.","Consenti l'accesso alle foto nelle impostazioni Android/FydeOS per aggiungere immagini alle categorie.":"Consenti l'accesso alle foto nelle impostazioni Android/FydeOS per aggiungere immagini alle categorie.","Contatta direttamente il team di sviluppo per supporto su hardware, stampanti ESC/POS o licenze B2B.":"Contatta direttamente il team di sviluppo per supporto su hardware, stampanti ESC/POS o licenze B2B.","Credenziali Admin":"Credenziali Admin","Credenziali aggiornate":"Credenziali aggiornate","Dalle ore:":"Dalle ore:","Descrizione *":"Descrizione *","Descrizione del prodotto":"Descrizione del prodotto","Descrizione della categoria":"Descrizione della categoria","Device management, screen lockdown, screensaver and REST API":"Device management, screen lockdown, screensaver and REST API","Dimming Notturno Programmato":"Dimming Notturno Programmato","Display Cucina":"Display Cucina","Display Cucina Disabilitato":"Display Cucina Disabilitato","Dispositivi trovati (":"Dispositivi trovati (","dispositivi. Aggiungi la stampante all elenco e assegna Scontrino/Cucina.":"dispositivi. Aggiungi la stampante all elenco e assegna Scontrino/Cucina.","Elementi (separati da virgola)":"Elementi (separati da virgola)","Elenco Stampanti":"Elenco Stampanti","Enter your credentials to access management":"Inserisci le credenziali per accedere alla gestione","Error checking product availability:":"Errore durante il controllo della disponibilità del prodotto:","Error creating order:":"Errore durante la creazione dell'ordine:","Error deleting category:":"Errore durante l'eliminazione della categoria:","Error deleting product:":"Errore durante l'eliminazione del prodotto:","Error loading categories:":"Errore durante il caricamento delle categorie:","Error loading data:":"Errore caricamento dati:","Error loading Kiosk data:":"Errore caricamento dati Kiosk:","Error loading orders:":"Errore caricamento ordini:","Error loading products:":"Errore caricamento prodotti:","Error loading settings:":"Errore caricamento impostazioni:","Error printing:":"Errore di stampa:","Error saving category:":"Errore salvataggio categoria:","Error saving kiosk config:":"Errore salvataggio configurazione Kiosk:","Error saving product:":"Errore salvataggio prodotto:","Error saving:":"Errore di salvataggio:","Error updating order:":"Errore aggiornamento ordine:","Errore applicazione hardware kiosk:":"Errore applicazione hardware kiosk:","Errore caricamento dati licenza:":"Errore caricamento dati licenza:","Errore di salvataggio:":"Errore di salvataggio:","Errore inizializzazione KioskStore:":"Errore inizializzazione KioskStore:","Errore lettura configurazione Kiosk:":"Errore lettura configurazione Kiosk:","Errore lettura licenza da storage:":"Errore lettura licenza da storage:","Errore Pagamento":"Errore Pagamento","Errore salvataggio configurazione Kiosk:":"Errore salvataggio configurazione Kiosk:","Errore salvataggio prova iniziale:":"Errore salvataggio prova iniziale:","Errore scansione":"Errore scansione","errore sconosciuto":"errore sconosciuto","Errore stampa":"Errore stampa","Errore Transazione":"Errore Transazione","Es: Hamburger Classico":"Es: Hamburger Classico","Es: Maionese, Ketchup":"Es: Maionese, Ketchup","Es: Panini":"Es: Panini","Es: Patatine":"Es: Patatine","Es: PIZZERIA DA MARIO":"Es: PIZZERIA DA MARIO","Es: Pomodoro, Lattuga":"Es: Pomodoro, Lattuga","Es. 06:00 → ogni giorno alle 6:00 il contatore ordini riparte da 1":"Es. 06:00 → ogni giorno alle 6:00 il contatore ordini riparte da 1","es. 192.168.1.9":"es. 192.168.1.9","es. https://miosito.it oppure lascia vuoto per rete locale":"es. https://miosito.it oppure lascia vuoto per rete locale","Esporta backup ZIP":"Esporta backup ZIP","Esporta: ti chiede dove salvare il ZIP (scegli Download). Importa: seleziona il file ZIP. Contiene impostazioni, testi e immagini.":"Esporta: ti chiede dove salvare il ZIP (scegli Download). Importa: seleziona il file ZIP. Contiene impostazioni, testi e immagini.","export backup":"Esporta backup","Extra a pagamento":"Extra a pagamento","Extra Formaggio:1, Bacon:1.5":"Extra Formaggio:1, Bacon:1.5","failed on":"fallito su","File ZIP salvato nella cartella che hai scelto (":"File ZIP salvato nella cartella che hai scelto (","Gestione Categorie":"Gestione Categorie","Gestione completa per singolo totem con rinnovo mensile.":"Gestione completa per singolo totem con rinnovo mensile.","Gestione Ordini":"Gestione Ordini","Gestione Prodotti":"Gestione Prodotti","Gestisci lo stato della prova e gli abbonamenti disponibili.":"Gestisci lo stato della prova e gli abbonamenti disponibili.","Gestisci prodotti, categorie, foto, listini e impostazioni dal telefono o PC senza toccare il totem.":"Gestisci prodotti, categorie, foto, listini e impostazioni dal telefono o PC senza toccare il totem.","GG)":"GG)","giorni)":"giorni)","giorni) per questo dispositivo?":"giorni) per questo dispositivo?","Gli abbonamenti digitali in-app sono gestiti integralmente da Google Play Billing. L'applicazione non ha accesso né memorizza carte di credito o coordinate bancarie.":"Gli abbonamenti digitali in-app sono gestiti integralmente da Google Play Billing. L'applicazione non ha accesso né memorizza carte di credito o coordinate bancarie.","Gli abbonamenti Google Play Store si rinnovano automaticamente. È possibile gestire la cancellazione o la modifica del metodo di pagamento in qualsiasi momento direttamente dal proprio account Google Play.":"Gli abbonamenti Google Play Store si rinnovano automaticamente. È possibile gestire la cancellazione o la modifica del metodo di pagamento in qualsiasi momento direttamente dal proprio account Google Play.","Gli abbonamenti si rinnovano automaticamente tramite il tuo account Google Play a meno che non vengano disdetti almeno 24 ore prima della scadenza. Puoi gestire o annullare l'abbonamento in qualsiasi momento dall'app Google Play &gt; Pagamenti e Abbonamenti.":"Gli abbonamenti si rinnovano automaticamente tramite il tuo account Google Play a meno che non vengano disdetti almeno 24 ore prima della scadenza. Puoi gestire o annullare l'abbonamento in qualsiasi momento dall'app Google Play &gt; Pagamenti e Abbonamenti.","Gli aggiornamenti software correttivi e le nuove funzionalità vengono rilasciati attraverso i canali di distribuzione dell'app.":"Gli aggiornamenti software correttivi e le nuove funzionalità vengono rilasciati attraverso i canali di distribuzione dell'app.","glutine, lattosio, uova":"glutine, lattosio, uova","Google Play Store Billing":"Google Play Store Billing","Grazie!":"Grazie!","Gruppi Extra Globali":"Gruppi Extra Globali","Gruppi Opzionali Globali":"Gruppi Opzionali Globali","Gruppo a scelta":"Gruppo a scelta","Hai bisogno di assistenza o configurazione personalizzata?":"Hai bisogno di assistenza o configurazione personalizzata?","Ho Letto e Accetto":"Ho Letto e Accetto","I gruppi selezionati vengono aggiunti automaticamente a questo prodotto al momento dell'ordine.":"I gruppi selezionati vengono aggiunti automaticamente a questo prodotto al momento dell'ordine.","I nuovi PIN non coincidono":"I nuovi PIN non coincidono","Ideale per singola postazione (Pizzerie, Bar, Chioschi)":"Ideale per singola postazione (Pizzerie, Bar, Chioschi)","Il file ZIP è stato creato (":"Il file ZIP è stato creato (","Il nome del ristorante non puo essere vuoto":"Il nome del ristorante non puo essere vuoto","Il nuovo PIN deve essere di 4 cifre":"Il nuovo PIN deve essere di 4 cifre","Il più scelto dai piccoli ristoratori (2 mesi gratis)":"Il più scelto dai piccoli ristoratori (2 mesi gratis)","Immagine (opzionale)":"Immagine (opzionale)","Impedisce lo spegnimento dello schermo durante il servizio.":"Impedisce lo spegnimento dello schermo durante il servizio.","import backup":"Importa backup","Import completato":"Import completato","Import fallito:":"Import fallito:","Importa backup ZIP":"Importa backup ZIP","Impossibile aggiornare la disponibilità":"Impossibile aggiornare la disponibilità","Impossibile aprire la galleria. Controlla i permessi foto.":"Impossibile aprire la galleria. Controlla i permessi foto.","Impossibile aprire la modifica.":"Impossibile aprire la modifica.","Impossibile caricare i dati":"Impossibile caricare i dati","Impossibile caricare le categorie":"Impossibile caricare le categorie","Impossibile completare il ripristino:":"Impossibile completare il ripristino:","Impossibile creare il backup:":"Impossibile creare il backup:","Impossibile eliminare il prodotto":"Impossibile eliminare il prodotto","Impossibile eliminare la categoria":"Impossibile eliminare la categoria","Impossibile leggere l'immagine selezionata":"Impossibile leggere l'immagine selezionata","Impossibile recuperare i dispositivi Bluetooth. Controlla i permessi.":"Impossibile recuperare i dispositivi Bluetooth. Controlla i permessi.","Impossibile rilevare l'IP in automatico. Inserisci l'indirizzo IP visibile nelle impostazioni Wi-Fi del tablet (es. 192.168.1.9).":"Impossibile rilevare l'IP in automatico. Inserisci l'indirizzo IP visibile nelle impostazioni Wi-Fi del tablet (es. 192.168.1.9).","Impossibile salvare il gruppo":"Impossibile salvare il gruppo","Impossibile salvare il prodotto":"Impossibile salvare il prodotto","Impossibile salvare la categoria":"Impossibile salvare la categoria","Impossibile salvare le credenziali":"Impossibile salvare le credenziali","Impossibile salvare le impostazioni":"Impossibile salvare le impostazioni","Imposta la sequenza di tocchi segreta per aprire il pannello di amministrazione e il PIN di protezione.":"Imposta la sequenza di tocchi segreta per aprire il pannello di amministrazione e il PIN di protezione.","Impostazioni salvate correttamente":"Impostazioni salvate correttamente","In Alto Centrale":"In Alto Centrale","In Attesa":"In Attesa","In Preparazione":"In Preparazione","Indirizzo IP Totem (Wi-Fi Locale)":"Indirizzo IP Totem (Wi-Fi Locale)","Indirizzo IP Wi-Fi trovato:":"Indirizzo IP Wi-Fi trovato:","Info Rilevamento":"Info Rilevamento","Informativa Privacy (GDPR)":"Informativa Privacy (GDPR)","Informativa sulla Privacy (GDPR)":"Informativa sulla Privacy (GDPR)","Informazioni Ristorante":"Informazioni Ristorante","Ingredienti (separati da virgola)":"Ingredienti (separati da virgola)","Ingredienti base":"Ingredienti base","Ingredienti Base":"Ingredienti Base","Inserisci il nome o titolo del gruppo":"Inserisci il nome o titolo del gruppo","Interactive Totem Guide":"Interactive Totem Guide","Invalid credentials. Use admin / admin123":"Credenziali non valide. Usa admin / admin123","Invia la tua comanda in cucina e ricevi il tuo scontrino con numero.":"Invia la tua comanda in cucina e ricevi il tuo scontrino con numero.","IP detect error:":"IP detect error:","IP Kiosk LAN:":"IP Kiosk LAN:","IP Rilevato":"IP Rilevato","IP Totem:":"IP Totem:","KB) su Drive, USB o inviarlo.":"KB) su Drive, USB o inviarlo.","KB), ma su questo dispositivo non c'è un'app per salvarlo/condividerlo. Riprova e, quando richiesto, scegli la cartella Download.":"KB), ma su questo dispositivo non c'è un'app per salvarlo/condividerlo. Riprova e, quando richiesto, scegli la cartella Download.","KB). Contiene impostazioni, testi e immagini. Copia quel file sull'altro tablet e usa Importa backup ZIP.":"KB). Contiene impostazioni, testi e immagini. Copia quel file sull'altro tablet e usa Importa backup ZIP.","Ketchup, Maionese, Crema tartufo...":"Ketchup, Maionese, Crema tartufo...","Kiosk Control & Hardware":"Controllo Kiosk e Hardware","Kiosk Hardware ID:":"ID Hardware Kiosk:","L'app richiede l'accesso alla rete locale (WiFi) per consentire il collegamento con il display cucina KDS e il pannello remoto amministrativo, e l'accesso al Bluetooth per la connessione alle stampanti termiche ESC/POS.":"L'app richiede l'accesso alla rete locale (WiFi) per consentire il collegamento con il display cucina KDS e il pannello remoto amministrativo, e l'accesso al Bluetooth per la connessione alle stampanti termiche ESC/POS.","L'attivazione di Totem QuickBite conferisce una licenza d'uso per singolo terminale Kiosk touch-screen.":"L'attivazione di Totem QuickBite conferisce una licenza d'uso per singolo terminale Kiosk touch-screen.","La scansione Bluetooth funziona solo su Android.":"La scansione Bluetooth funziona solo su Android.","Le categorie vengono ordinate per indice crescente. 0 = prima categoria.":"Le categorie vengono ordinate per indice crescente. 0 = prima categoria.","Le stampe per la cucina continuano a funzionare normalmente.":"Le stampe per la cucina continuano a funzionare normalmente.","Licenza e Abbonamenti":"Licenza e Abbonamenti","Lista Extra (€)":"Lista Extra (€)","Loading Kiosk & Hardware Settings...":"Caricamento impostazioni Kiosk & Hardware...","Local server boot error:":"Errore avvio server locale:","Logo Ristorante":"Logo Ristorante","Luminosità & Controllo Display":"Luminosità & Controllo Display","Luminosità impostata al 10% (risparmio energetico). Tocca lo schermo per ripristinare.":"Luminosità impostata al 10% (risparmio energetico). Tocca lo schermo per ripristinare.","Luminosità Schermo (":"Luminosità Schermo (","MAC es. 00:11:22:33:44:55 o nome":"MAC es. 00:11:22:33:44:55 o nome","mailto:priologiovanni82@gmail.com?subject=Supporto%20Guida%20Totem%20QuickBite":"mailto:priologiovanni82@gmail.com?subject=Supporto%20Guida%20Totem%20QuickBite","Memoria Libera:":"Memoria Libera:","Metodo Pagamento:":"Metodo Pagamento:","Min selezioni / Max selezioni":"Min selezioni / Max selezioni","Modalità Kiosk & Blocco Schermo":"Modalità Kiosk & Blocco Schermo","Modifica Categoria":"Modifica Categoria","Modifica Gruppo":"Modifica Gruppo","Modifica Prodotto":"Modifica Prodotto","Modulo stampante non disponibile":"Modulo stampante non disponibile","N°":"N°","Nessun abbonamento attivo rilevato su questo dispositivo.":"Nessun abbonamento attivo rilevato su questo dispositivo.","Nessun Abbonamento Trovato":"Nessun Abbonamento Trovato","Nessun argomento trovato per la ricerca \"":"Nessun argomento trovato per la ricerca \"","Nessun dispositivo Bluetooth":"Nessun dispositivo Bluetooth","Nessun dispositivo in modalita web.":"Nessun dispositivo in modalita web.","Nessun dispositivo trovato. Accendi e abbina la stampante in Impostazioni Android Bluetooth, concedi i permessi, poi aggiorna la lista. Oppure inserisci il MAC manualmente.":"Nessun dispositivo trovato. Accendi e abbina la stampante in Impostazioni Android Bluetooth, concedi i permessi, poi aggiorna la lista. Oppure inserisci il MAC manualmente.","Nessun dispositivo. Abbina prima la stampante nelle impostazioni Bluetooth di sistema, poi riprova.":"Nessun dispositivo. Abbina prima la stampante nelle impostazioni Bluetooth di sistema, poi riprova.","Nessun gruppo globale configurato. Creane uno nella scheda \"Gruppi\" per collegarlo rapidamente qui.":"Nessun gruppo globale configurato. Creane uno nella scheda \"Gruppi\" per collegarlo rapidamente qui.","Nessun gruppo globale configurato. Creane uno nella sezione Gruppi.":"Nessun gruppo globale configurato. Creane uno nella sezione Gruppi.","Nessun ordine":"Nessun ordine","Nessuna immagine selezionata":"Nessuna immagine selezionata","Nessuna stampante configurata":"Nessuna stampante configurata","Nessuna stampante trovata. Verifica che:":"Nessuna stampante trovata. Verifica che:","Nessuna stampante. Aggiungine una dalla lista o inserisci il MAC.":"Nessuna stampante. Aggiungine una dalla lista o inserisci il MAC.","Nome *":"Nome *","Nome del Ristorante":"Nome del Ristorante","Nome Interno (es: Salse Panini)":"Nome Interno (es: Salse Panini)","Nome opzione":"Nome opzione","Nome sezione (es: Creme, Salse, Extra...)":"Nome sezione (es: Creme, Salse, Extra...)","Non disponibile":"Non disponibile","Note Legali & Conformità Google Play Store":"Note Legali & Conformità Google Play Store","Numero di tocchi segreti:":"Numero di tocchi segreti:","Numero Ordini":"Numero Ordini","Nuova Categoria":"Nuova Categoria","Nuova password":"Nuova password","Nuovo Gruppo":"Nuovo Gruppo","Nuovo PIN":"Nuovo PIN","Nuovo Prodotto":"Nuovo Prodotto","Nuovo username":"Nuovo username","Offline: admin / admin123 (or PIN 1234)":"Offline: admin / admin123 (or PIN 1234)","Ogni modifica effettuata da remoto si sincronizza automaticamente con il totem.":"Ogni modifica effettuata da remoto si sincronizza automaticamente con il totem.","Operazione annullata.":"Operazione annullata.","Opzioni (nome + sovrapprezzo €)":"Opzioni (nome + sovrapprezzo €)","Orario reset giornaliero (HH:mm)":"Orario reset giornaliero (HH:mm)","Ordine a voce":"Ordine a voce","ORDINE A VOCE":"ORDINE A VOCE","Ordine a voce - cliente ordinerà in cassa":"Ordine a voce - cliente ordinerà in cassa","Ordine visualizzazione":"Ordine visualizzazione","Ordini e comande illimitati":"Ordini e comande illimitati","Orologio Digitale":"Orologio Digitale","Paga in cassa al ritiro":"Paga in cassa al ritiro","Paired printers error:":"Paired printers error:","Pane, Carne, Lattuga, Pomodoro":"Pane, Carne, Lattuga, Pomodoro","Pannello amministrativo remoto in rete locale":"Pannello amministrativo remoto in rete locale","Password attuale":"Password attuale","Password attuale non corretta":"Password attuale non corretta","Per abilitarlo, vai su Impostazioni e attiva l'opzione \"Display Cucina\".":"Per abilitarlo, vai su Impostazioni e attiva l'opzione \"Display Cucina\".","Per qualsiasi informazione sulla gestione dei dati, contatta Totem QuickBite attraverso i canali di assistenza ufficiali.":"Per qualsiasi informazione sulla gestione dei dati, contatta Totem QuickBite attraverso i canali di assistenza ufficiali.","PERIODO PROVA SCADUTO":"PERIODO PROVA SCADUTO","Permessi Bluetooth negati":"Permessi Bluetooth negati","Permesso negato":"Permesso negato","Permette il controllo remoto e la telemetria via rete locale LAN (compatibile con Home Assistant e pannello web).":"Permette il controllo remoto e la telemetria via rete locale LAN (compatibile con Home Assistant e pannello web).","Personalizza ingredienti, salse, opzioni ed extra come preferisci.":"Personalizza ingredienti, salse, opzioni ed extra come preferisci.","Personalizzazioni sul totem":"Personalizzazioni sul totem","Piano Base Annuale":"Piano Base Annuale","Piano Base Totem":"Piano Base Totem","Piano Configurato:":"Piano Configurato:","Piano di abbonamento non disponibile.":"Piano di abbonamento non disponibile.","pickImage category error":"pickImage category error","pickImage product error":"pickImage product error","PIN attuale":"PIN attuale","PIN attuale / nuovo / conferma":"PIN attuale / nuovo / conferma","PIN attuale non corretto":"PIN attuale non corretto","PIN errato. Predefinito: 0000 o 1234":"PIN errato. Predefinito: 0000 o 1234","Please enter username and password":"Please enter username and password","Porta standard 8000 / microserver Python locale.":"Porta standard 8000 / microserver Python locale.","Posizione del Trigger Segreto:":"Posizione del Trigger Segreto:","Premi Cerca o Aggiorna lista. Vedrai cuffie, speaker e stampanti: aggiungi solo la stampante.":"Premi Cerca o Aggiorna lista. Vedrai cuffie, speaker e stampanti: aggiungi solo la stampante.","Presentati al banco":"Presentati al banco","Prezzo (€) *":"Prezzo (€) *","prodotti (con immagini). Se qualcosa non si aggiorna, chiudi e riapri l'app.":"prodotti (con immagini). Se qualcosa non si aggiorna, chiudi e riapri l'app.","Prodotti Esauriti":"Prodotti Esauriti","Prodotto aggiornato":"Prodotto aggiornato","Prodotto creato":"Prodotto creato","Prodotto eliminato":"Prodotto eliminato","Prodotto Esaurito":"Prodotto Esaurito","Prodotto non trovato nel menu.":"Prodotto non trovato nel menu.","Prova gratuita (":"Prova gratuita (","PROVA GRATUITA (":"PROVA GRATUITA (","Questo articolo è attualmente esaurito e non può essere modificato.":"Questo articolo è attualmente esaurito e non può essere modificato.","Reset error:":"Errore di reset:","Reset Eseguito":"Reset Eseguito","Reset Numerazione e Comande?":"Reset Numerazione e Comande?","Reset Numero Ora":"Reset Numero Ora","Reset Prova":"Reset Prova","REST API Locale Attiva":"REST API Locale Attiva","rgba(0,0,0,0.5)":"rgba(0,0,0,0.5)","rgba(0,0,0,0.7)":"rgba(0,0,0,0.7)","rgba(0,0,0,0.85)":"rgba(0,0,0,0.85)","rgba(0,0,0,0.92)":"rgba(0,0,0,0.92)","rgba(15, 23, 42, 0.6)":"rgba(15, 23, 42, 0.6)","rgba(15, 23, 42, 0.65)":"rgba(15, 23, 42, 0.65)","rgba(255, 107, 107, 0.1)":"rgba(255, 107, 107, 0.1)","rgba(255, 107, 107, 0.15)":"rgba(255, 107, 107, 0.15)","rgba(255, 107, 107, 0.2)":"rgba(255, 107, 107, 0.2)","rgba(255, 107, 107, 0.3)":"rgba(255, 107, 107, 0.3)","rgba(255, 255, 255, 0.12)":"rgba(255, 255, 255, 0.12)","rgba(255, 255, 255, 0.18)":"rgba(255, 255, 255, 0.18)","rgba(255,255,255,0.12)":"rgba(255,255,255,0.12)","rgba(255,255,255,0.2)":"rgba(255,255,255,0.2)","rgba(255,255,255,0.9)":"rgba(255,255,255,0.9)","rgba(56, 189, 248, 0.15)":"rgba(56, 189, 248, 0.15)","Riapre l'app totem immediatamente dopo il riavvio del tablet.":"Riapre l'app totem immediatamente dopo il riavvio del tablet.","Rileva IP":"Rileva IP","Ripristina Abbonamento Google Play":"Ripristina Abbonamento Google Play","Ripristina Prova":"Ripristina Prova","Ripristino Completato":"Ripristino Completato","RISPARMIA 2 MESI":"RISPARMIA 2 MESI","Risparmio Energetico (Dimmed)":"Risparmio Energetico (Dimmed)","Ritiro al Banco Senza Attese":"Ritiro al Banco Senza Attese","Salse gratuite":"Salse gratuite","Salva Credenziali":"Salva Credenziali","Salva Impostazioni":"Salva Impostazioni","Salvaschermo & Reset Inattività":"Salvaschermo & Reset Inattività","Salvaschermo avviato. Tocca lo schermo per uscire.":"Salvaschermo avviato. Tocca lo schermo per uscire.","Scadenza / Prossimo Rinnovo:":"Scadenza / Prossimo Rinnovo:","Scan error:":"Scan error:","scan failed":"scansione non riuscita","Scansione completata":"Scansione completata","Scelta obbligatoria":"Scelta obbligatoria","Schermo Nero":"Schermo Nero","Schermo Sempre Acceso (Keep Awake)":"Schermo Sempre Acceso (Keep Awake)","Scontrino Cortesia":"Scontrino Cortesia","SCONTRINO CORTESIA":"Scontrino cortesia","Scrivi al Supporto":"Scrivi al Supporto","Segnale acustico e vibrazione hardware eseguiti.":"Segnale acustico e vibrazione hardware eseguiti.","Seleziona i gruppi globali (salse, ingredienti, extra o scelte) da collegare a questo prodotto.":"Seleziona i gruppi globali (salse, ingredienti, extra o scelte) da collegare a questo prodotto.","Sicurezza & Gesture di Sblocco":"Sicurezza & Gesture di Sblocco","Solo circa 7,40 € al mese con fatturazione annuale.":"Solo circa 7,40 € al mese con fatturazione annuale.","Stampa Automatica":"Stampa Automatica","Stampa scontrini termici ESC/POS":"Stampa scontrini termici ESC/POS","Stampanti Bluetooth":"Stampanti Bluetooth","Stato Attivazione Dispositivo":"Stato Attivazione Dispositivo","Stato Kiosk:":"Stato Kiosk:","Stato licenza reimpostato a periodo di prova.":"Stato licenza reimpostato a periodo di prova.","Stato Schermo:":"Stato Schermo:","Step-by-step instructions for hardware configuration, orders, and restaurant management":"Istruzioni passo-passo per la configurazione hardware, gli ordini e la gestione del ristorante","Svuota il carrello e torna alla home se il cliente si allontana prima di pagare.":"Svuota il carrello e torna alla home se il cliente si allontana prima di pagare.","Tempo attesa reset carrello:":"Tempo attesa reset carrello:","Termini di Servizio (EULA)":"Termini di Servizio (EULA)","Termini di Servizio & Licenza d'Uso":"Termini di Servizio & Licenza d'Uso","Test Dimming (10%)":"Test Dimming (10%)","Test Feedback Beep":"Test Feedback Beep","Test Risveglio (Wake)":"Test Risveglio (Wake)","Test Salvaschermo":"Test Salvaschermo","Test Strumenti & Comandi Hardware:":"Test Strumenti & Comandi Hardware:","thermal driver import missing":"Import driver termico mancante","Ticket Cucina":"Ticket Cucina","Timeout Inattività:":"Timeout Inattività:","Tipo di Salvaschermo:":"Tipo di Salvaschermo:","Tipo Sezione":"Tipo Sezione","Tipo: extra a pagamento":"Tipo: extra a pagamento","Tipo: gruppo a scelta (min/max + prezzo)":"Tipo: gruppo a scelta (min/max + prezzo)","Tipo: ingredienti da togliere":"Tipo: ingredienti da togliere","Tipo: scelte gratuite (salse/creme...)":"Tipo: scelte gratuite (salse/creme...)","Titolo per cliente (es: Scegli salse)":"Titolo per cliente (es: Scegli salse)","TOCCA LO SCHERMO PER ORDINARE":"TOCCA LO SCHERMO PER ORDINARE","Tocca lo schermo per riattivare":"Tocca lo schermo per riattivare","Tocca lo schermo per scoprire il nostro menu e ordinare subito.":"Tocca lo schermo per scoprire il nostro menu e ordinare subito.","Tocca per iniziare ad ordinare":"Tocca per iniziare ad ordinare","Totale: €":"Totale: €","Totem in Standby":"Totem in Standby","Totem Kiosk REST API & Telemetria LAN":"Totem Kiosk REST API & Telemetria LAN","Totem Operating Guide & Manual":"Totem Operating Guide & Manual","Totem QuickBite · Versione build v1.2.10":"Totem QuickBite · Versione build v1.2.10","TOTEM RISTORANTE":"TOTEM RISTORANTE","Totem Self-Service":"Totem Self-Service","Tutte le funzionalità del Piano Base":"Tutte le funzionalità del Piano Base","Tutti i marchi citati appartengono ai rispettivi proprietari. L'applicazione non condivide dati sensibili di pagamento con terze parti non autorizzate. Gli abbonamenti in-app sono elaborati direttamente dai server sicuri di Google Play Billing.":"Tutti i marchi citati appartengono ai rispettivi proprietari. L'applicazione non condivide dati sensibili di pagamento con terze parti non autorizzate. Gli abbonamenti in-app sono elaborati direttamente dai server sicuri di Google Play Billing.","Ultimo reset:":"Ultimo reset:","Uno o più articoli nel tuo carrello non sono più disponibili. Rimuovili per poter procedere.":"Uno o più articoli nel tuo carrello non sono più disponibili. Rimuovili per poter procedere.","URL Server Personalizzato (Opzionale per Cloud / Dominio)":"URL Server Personalizzato (Opzionale per Cloud / Dominio)","Usa il menu di condivisione per salvare il ZIP (":"Usa il menu di condivisione per salvare il ZIP (","Username / Password":"Nome utente / Password","Username attuale":"Username attuale","Username attuale non corretto":"Username attuale non corretto","Username e password nuovi obbligatori":"Username e password nuovi obbligatori","Versione Sistema:":"Versione Sistema:","Vuoi attivare il \"":"Vuoi attivare il \\\"","Vuoi eliminare":"Vuoi eliminare","Vuoi eliminare \"":"Vuoi eliminare \\\"","Vuoi eliminare la categoria \"":"Vuoi eliminare la categoria \\\"","Vuoi ripristinare il periodo di prova (":"Vuoi ripristinare il periodo di prova (","ZIP non valido":"ZIP non valido"},"en":{"- Senza":"- Without",", Max":", Max",";base64,":";base64,","\" a":"\" a","\"? Tutti i prodotti associati rimarranno ma non saranno più visibili.":"\"? All associated products will remain but will no longer be visible.","(copia)":"(copy)","(Senza nome)":"(Unnamed)",") con addebito sul tuo account Google Play Store?":") charged to your Google Play Store account?",") error:":") error:","[print] attempt":"[print] attempt","[print] logo nodes failed":"[print] logo nodes failed","[printer] getStoredPrinterAddress(":"[printer] getStoredPrinterAddress(","[printer] getStoredPrinterConfig error:":"[printer] getStoredPrinterConfig error:","[printer] savePrinterAddress(":"[printer] savePrinterAddress(","[printer] savePrinterConfig error:":"[printer] savePrinterConfig error:","[printer][perms] Android >=31 requestMultiple results:":"[printer][perms] Android >=31 requestMultiple results:","[printer][perms] Checking Bluetooth permissions...":"[printer][perms] Checking Bluetooth permissions...","[printer][perms] Exception requesting Bluetooth permissions:":"[printer][perms] Exception requesting Bluetooth permissions:","[printer][scan] Calling TP.scan()...":"[printer][scan] Calling TP.scan()...","[printer][scan] Devices breakdown:":"[printer][scan] Devices breakdown:","[printer][scan] Entering Android/Native Bluetooth branch":"[printer][scan] Entering Android/Native Bluetooth branch","[printer][scan] Entering Web bridge branch via backend /api/admin/bt/printers":"[printer][scan] Entering Web bridge branch via backend /api/admin/bt/printers","[printer][scan] Final resolved printers list:":"[printer][scan] Final resolved printers list:","[printer][scan] getTP() returned null (thermal printer driver module not available)":"[printer][scan] getTP() returned null (thermal printer driver module not available)","[printer][scan] Starting getPairedPrinters...":"[printer][scan] Starting getPairedPrinters...","[printer][scan] TP.scan() failed, trying alternative methods:":"[printer][scan] TP.scan() failed, trying alternative methods:","[printer][scan] TP.scan() raw result:":"[printer][scan] TP.scan() raw result:","[printer][scan] Web bridge returned printers:":"[printer][scan] Web bridge returned printers:","*** CUCINA ***":"*** KITCHEN ***","/ anno":"/ year","/ mese":"/ month","+ Aggiungi extra":"+ Add extra","+ Aggiungi opzione":"+ Add option","+ Extra €":"+ Extra €","+ Gruppo scelta":"+ Choice group","+ Ingredienti":"+ Ingredients","+ Salse/Creme":"+ Sauces/Creams","</body></html>":"</body></html>","<html><body style=\"font-family:monospace;white-space:pre;font-size:11px\">":"<html><body style=\"font-family:monospace;white-space:pre;font-size:11px\">","⚠️ IP Wi-Fi non rilevato automaticamente. Inserisci l'indirizzo IP del tablet (es. 192.168.1.9) nel campo sotto per generare il QR Code corretto.":"⚠️ Wi‑Fi IP not detected automatically. Enter the tablet's IP address (e.g. 192.168.1.9) in the field below to generate the correct QR Code.","⚡ Ordine Diretto":"⚡ Direct Order","✅ Test Dimming":"✅ Dimming Test","✅ Test Risveglio":"✅ Wake Test","✅ Test Salvaschermo":"✅ Screensaver Test","❌ SENZA":"❌ WITHOUT","🍔 Freschezza & Qualità":"🍔 Freshness & Quality","🍟 Facile & Veloce":"🍟 Easy & Fast","🎉 Abbonamento Attivato!":"🎉 Subscription Activated!","📚 Gruppi Extra Globali (":"📚 Global Extra Groups (","📝 Note:":"📝 Notes:","🔔 Feedback Acustico":"🔔 Sound feedback","🔴 Esaurito":"🔴 Out of stock","🟢 Attivo (":"🟢 Active (","🟢 Disponibile":"🟢 Available","1 display cucina KDS in tempo reale":"1 real-time kitchen KDS display","1 postazione Totem touch-screen":"1 Totem touch-screen station","1. Concessione della Licenza":"1. License Grant","1. la stampante sia già associata nelle impostazioni Bluetooth di Android,":"1. the printer is already paired in Android's Bluetooth settings,","1. Raccolta e Trattamento dei Dati":"1. Data Collection and Processing","1. Telefono e totem connessi alla stessa rete Wi-Fi":"1. Phone and Totem connected to the same Wi-Fi network","10 Tocchi":"10 taps","2 mesi gratuiti inclusi":"2 months free included","2 min":"2 min","2. Apri l'indirizzo sopra nel browser del telefono o scansiona il QR Code":"2. Open the address above in the phone's browser or scan the QR Code","2. Gestione dei Pagamenti":"2. Payment processing","2. i permessi Bluetooth siano concessi,":"2. Bluetooth permissions are granted,","2. Rinnovi e Cancellazioni Abbonamento":"2. Subscription renewals and cancellations","3. Effettua l'accesso inserendo il PIN dell'app (":"3. Sign in by entering the app PIN (","3. il Bluetooth del telefono sia attivo.":"3. that the phone's Bluetooth is enabled.","3. Permessi Hardware":"3. Hardware permissions","3. Supporto Tecnico e Aggiornamenti":"3. Technical support and updates","30 sec":"30 sec","4. Titolare del Trattamento":"4. Data Controller","5 min":"5 min","5 Tocchi Rapidi":"5 quick taps","60 sec":"60 sec","7 Tocchi Rapidi (Consigliato)":"7 Quick Taps (Recommended)","Abbassa la luminosità al 10% negli orari di chiusura per preservare il pannello.":"Lower brightness to 10% during closing hours to preserve the panel.","Abbonamenti Google Play Store":"Google Play Store Subscriptions","Abbonamento Attivo":"Active subscription","ABBONAMENTO ATTIVO":"ACTIVE SUBSCRIPTION","Abbonamento Google Play":"Google Play subscription","Abbonamento registrato:":"Subscription registered:","Abbonamento ripristinato:":"Subscription restored:","Accesso Remoto da Smartphone & PC":"Remote access from Smartphone & PC","Admin Panel":"Admin Panel","Aggiorna lista dispositivi":"Refresh device list","Aggiornamenti software inclusi":"Software updates included","Aggiungi Extra":"Add extras","Aggiungi Immagine":"Add image","Aggiungi opzione":"Add option","Aggiungi sezione":"Add section","Aggiungi sezioni, rinomina, attiva/disattiva e sposta su/giù per decidere l'ordine sul totem.":"Add sections, rename, enable/disable and move up/down to set the order on the kiosk.","Aggiungi tutti all elenco":"Add all to list","Alle ore:":"At:","Allergeni (separati da virgola)":"Allergens (separated by comma)","Angolo Alto a Destra":"Top right corner","Angolo Alto a Sinistra":"Top left corner","Apri nel browser del telefono o inquadra il QR Code:":"Open in your phone browser or scan the QR Code:","Attiva o gestisci l'abbonamento con addebito sicuro tramite Google Play Store. Disdici in qualsiasi momento senza vincoli.":"Activate or manage the subscription with secure billing via Google Play Store. Cancel anytime with no commitment.","Attiva su Google Play":"Enable on Google Play","Auto-print courtesy failed":"Auto-print courtesy failed","Auto-print kitchen failed":"Auto-print kitchen failed","Auto-Reset Carrello Abbandonato":"Auto-reset abandoned cart","Avvio Automatico all'Accensione (Auto-Boot)":"Automatic start on power-up (Auto-Boot)","Azzerando la numerazione, il prossimo ordine ripartirà da #1 e tutte le comande attuali verranno cancellate dalla schermata cucina.":"Resetting the numbering will make the next order start at #1 and all current orders will be cleared from the kitchen screen.","Backup / Migrazione":"Backup / Migration","Backup creato":"Backup created","Backup e ripristino illimitati":"Unlimited backups and restores","Backup pronto":"Backup ready","Backup salvato":"Backup saved","Banner Promozionale":"Promotional banner","Benvenuto!":"Welcome!","Blocca il tablet in modalità totem esclusiva. Nasconde la barra di navigazione Android e impedisce l'uscita non autorizzata ai clienti.":"Lock the tablet in exclusive kiosk mode. Hides the Android navigation bar and prevents customers from exiting.","Bridge BT non disponibile:":"BT bridge not available:","BT print failed, PDF fallback":"BT print failed, PDF fallback","Cambia Immagine":"Change image","Carica Logo":"Upload logo","Caricamento stato licenza e abbonamenti...":"Loading license and subscription status...","Categoria *":"Category *","Categoria aggiornata":"Category updated","Categoria creata":"Category created","Categoria eliminata":"Category deleted","categorie e":"categories and","Cerca dispositivi Bluetooth":"Search for Bluetooth devices","collegati)":"connected)","Comando di risveglio schermo eseguito con successo.":"Screen wake command executed successfully.","Compatibile con MPT, Xprinter, Rongta e altre ESC/POS (Bluetooth Classic e BLE). Mostra tutti i dispositivi Bluetooth paired e vicini: scegli la stampante e assegna Scontrino o Cucina.":"Compatible with MPT, Xprinter, Rongta and other ESC/POS (Bluetooth Classic and BLE). Shows all paired and nearby Bluetooth devices: choose the printer and assign Receipt or Kitchen.","Compila almeno un campo":"Fill at least one field","Compila tutti i campi obbligatori":"Fill in all required fields","Componi il Tuo Piatto":"Customize Your Dish","Conferma Eliminazione":"Confirm Deletion","Conferma PIN":"Confirm PIN","Conferma Reset":"Confirm Reset","Conferma su Google Play":"Confirm on Google Play","Configura il comportamento del totem quando nessun cliente interagisce con lo schermo.":"Configure the totem behavior when no customer interacts with the screen.","Consenti l'accesso alle foto nelle impostazioni Android/FydeOS per aggiungere immagini ai prodotti.":"Allow photo access in Android/FydeOS settings to add images to products.","Consenti l'accesso alle foto nelle impostazioni Android/FydeOS per aggiungere immagini alle categorie.":"Allow photo access in Android/FydeOS settings to add images to categories.","Contatta direttamente il team di sviluppo per supporto su hardware, stampanti ESC/POS o licenze B2B.":"Contact the development team directly for support on hardware, ESC/POS printers or B2B licenses.","Credenziali Admin":"Admin Credentials","Credenziali aggiornate":"Credentials updated","Dalle ore:":"From:","Descrizione *":"Description *","Descrizione del prodotto":"Product description","Descrizione della categoria":"Category description","Device management, screen lockdown, screensaver and REST API":"Device management, screen lockdown, screensaver and REST API","Dimming Notturno Programmato":"Scheduled Night Dimming","Display Cucina":"Kitchen Display","Display Cucina Disabilitato":"Kitchen Display Disabled","Dispositivi trovati (":"Devices found (","dispositivi. Aggiungi la stampante all elenco e assegna Scontrino/Cucina.":"devices. Add the printer to the list and assign Receipt/Kitchen.","Elementi (separati da virgola)":"Items (comma separated)","Elenco Stampanti":"Printer List","Enter your credentials to access management":"Enter your credentials to access management","Error checking product availability:":"Error checking product availability:","Error creating order:":"Error creating order:","Error deleting category:":"Error deleting category:","Error deleting product:":"Error deleting product:","Error loading categories:":"Error loading categories:","Error loading data:":"Error loading data:","Error loading Kiosk data:":"Error loading Kiosk data:","Error loading orders:":"Error loading orders:","Error loading products:":"Error loading products:","Error loading settings:":"Error loading settings:","Error printing:":"Error printing:","Error saving category:":"Error saving category:","Error saving kiosk config:":"Error saving kiosk config:","Error saving product:":"Error saving product:","Error saving:":"Error saving:","Error updating order:":"Error updating order:","Errore applicazione hardware kiosk:":"kiosk hardware application error:","Errore caricamento dati licenza:":"Error loading license data:","Errore di salvataggio:":"Error saving:","Errore inizializzazione KioskStore:":"Error initializing KioskStore:","Errore lettura configurazione Kiosk:":"Error reading Kiosk configuration:","Errore lettura licenza da storage:":"Error reading license from storage:","Errore Pagamento":"Payment Error","Errore salvataggio configurazione Kiosk:":"Error saving Kiosk configuration:","Errore salvataggio prova iniziale:":"Error saving initial test:","Errore scansione":"Scan Error","errore sconosciuto":"Unknown error","Errore stampa":"Print Error","Errore Transazione":"Transaction Error","Es: Hamburger Classico":"Eg: Classic Hamburger","Es: Maionese, Ketchup":"Eg: Mayonnaise, Ketchup","Es: Panini":"Eg: Sandwiches","Es: Patatine":"Eg: Fries","Es: PIZZERIA DA MARIO":"Eg: PIZZERIA DA MARIO","Es: Pomodoro, Lattuga":"Eg: Tomato, Lettuce","Es. 06:00 → ogni giorno alle 6:00 il contatore ordini riparte da 1":"Eg. 06:00 → every day at 06:00 the order counter restarts from 1","es. 192.168.1.9":"Eg. 192.168.1.9","es. https://miosito.it oppure lascia vuoto per rete locale":"Eg. https://miosito.it or leave empty for local network","Esporta backup ZIP":"Export ZIP backup","Esporta: ti chiede dove salvare il ZIP (scegli Download). Importa: seleziona il file ZIP. Contiene impostazioni, testi e immagini.":"Export: asks where to save the ZIP (choose Download). Import: select the ZIP file. Contains settings, texts and images.","export backup":"Export backup","Extra a pagamento":"Paid extras","Extra Formaggio:1, Bacon:1.5":"Extra Cheese:1, Bacon:1.5","failed on":"failed on","File ZIP salvato nella cartella che hai scelto (":"ZIP file saved in the folder you chose (","Gestione Categorie":"Category Management","Gestione completa per singolo totem con rinnovo mensile.":"Full management for a single kiosk with monthly renewal.","Gestione Ordini":"Order Management","Gestione Prodotti":"Product Management","Gestisci lo stato della prova e gli abbonamenti disponibili.":"Manage trial status and available subscriptions.","Gestisci prodotti, categorie, foto, listini e impostazioni dal telefono o PC senza toccare il totem.":"Manage products, categories, photos, price lists and settings from your phone or PC without touching the kiosk.","GG)":"GG)","giorni)":"days)","giorni) per questo dispositivo?":"days) for this device?","Gli abbonamenti digitali in-app sono gestiti integralmente da Google Play Billing. L'applicazione non ha accesso né memorizza carte di credito o coordinate bancarie.":"In-app digital subscriptions are fully managed by Google Play Billing. The app does not access or store credit card or bank details.","Gli abbonamenti Google Play Store si rinnovano automaticamente. È possibile gestire la cancellazione o la modifica del metodo di pagamento in qualsiasi momento direttamente dal proprio account Google Play.":"Google Play Store subscriptions renew automatically. You can manage cancellation or change payment method at any time directly from your Google Play account.","Gli abbonamenti si rinnovano automaticamente tramite il tuo account Google Play a meno che non vengano disdetti almeno 24 ore prima della scadenza. Puoi gestire o annullare l'abbonamento in qualsiasi momento dall'app Google Play &gt; Pagamenti e Abbonamenti.":"Subscriptions renew automatically through your Google Play account unless cancelled at least 24 hours before expiration. You can manage or cancel the subscription at any time from the Google Play app &gt; Payments & Subscriptions.","Gli aggiornamenti software correttivi e le nuove funzionalità vengono rilasciati attraverso i canali di distribuzione dell'app.":"Software fixes and new features are released through the app's distribution channels.","glutine, lattosio, uova":"gluten, lactose, eggs","Google Play Store Billing":"Google Play Store Billing","Grazie!":"Thanks!","Gruppi Extra Globali":"Global Extra Groups","Gruppi Opzionali Globali":"Global Optional Groups","Gruppo a scelta":"Choice group","Hai bisogno di assistenza o configurazione personalizzata?":"Do you need assistance or custom configuration?","Ho Letto e Accetto":"I have read and accept","I gruppi selezionati vengono aggiunti automaticamente a questo prodotto al momento dell'ordine.":"Selected groups are automatically added to this product when ordering.","I nuovi PIN non coincidono":"The new PINs do not match","Ideale per singola postazione (Pizzerie, Bar, Chioschi)":"Ideal for a single station (Pizzerias, Bars, Kiosks)","Il file ZIP è stato creato (":"The ZIP file has been created (","Il nome del ristorante non puo essere vuoto":"The restaurant name cannot be empty","Il nuovo PIN deve essere di 4 cifre":"New PIN must be 4 digits","Il più scelto dai piccoli ristoratori (2 mesi gratis)":"Most popular with small restaurants (2 months free)","Immagine (opzionale)":"Image (optional)","Impedisce lo spegnimento dello schermo durante il servizio.":"Prevents the screen from turning off during service.","import backup":"Import backup","Import completato":"Import completed","Import fallito:":"Import failed:","Importa backup ZIP":"Import ZIP backup","Impossibile aggiornare la disponibilità":"Unable to update availability","Impossibile aprire la galleria. Controlla i permessi foto.":"Unable to open gallery. Check photo permissions.","Impossibile aprire la modifica.":"Unable to open edit.","Impossibile caricare i dati":"Unable to load data","Impossibile caricare le categorie":"Unable to load categories","Impossibile completare il ripristino:":"Unable to complete restore:","Impossibile creare il backup:":"Unable to create backup:","Impossibile eliminare il prodotto":"Unable to delete product","Impossibile eliminare la categoria":"Unable to delete category","Impossibile leggere l'immagine selezionata":"Unable to read the selected image","Impossibile recuperare i dispositivi Bluetooth. Controlla i permessi.":"Unable to retrieve Bluetooth devices. Check permissions.","Impossibile rilevare l'IP in automatico. Inserisci l'indirizzo IP visibile nelle impostazioni Wi-Fi del tablet (es. 192.168.1.9).":"Unable to detect the IP automatically. Enter the IP address visible in the tablet's Wi-Fi settings (e.g. 192.168.1.9).","Impossibile salvare il gruppo":"Unable to save group","Impossibile salvare il prodotto":"Unable to save product","Impossibile salvare la categoria":"Unable to save category","Impossibile salvare le credenziali":"Unable to save credentials","Impossibile salvare le impostazioni":"Unable to save settings","Imposta la sequenza di tocchi segreta per aprire il pannello di amministrazione e il PIN di protezione.":"Set the secret tap sequence to open the admin panel and the protection PIN.","Impostazioni salvate correttamente":"Settings saved successfully","In Alto Centrale":"Top Center","In Attesa":"Waiting","In Preparazione":"Preparing","Indirizzo IP Totem (Wi-Fi Locale)":"Totem IP address (Local Wi‑Fi)","Indirizzo IP Wi-Fi trovato:":"Wi‑Fi IP address found:","Info Rilevamento":"Detection info","Informativa Privacy (GDPR)":"Privacy Policy (GDPR)","Informativa sulla Privacy (GDPR)":"Privacy Policy (GDPR)","Informazioni Ristorante":"Restaurant information","Ingredienti (separati da virgola)":"Ingredients (separated by commas)","Ingredienti base":"Base ingredients","Ingredienti Base":"Base Ingredients","Inserisci il nome o titolo del gruppo":"Enter the group's name or title","Interactive Totem Guide":"Interactive Totem Guide","Invalid credentials. Use admin / admin123":"Invalid credentials. Use admin / admin123","Invia la tua comanda in cucina e ricevi il tuo scontrino con numero.":"Send your order to the kitchen and get your numbered receipt.","IP detect error:":"IP detect error:","IP Kiosk LAN:":"IP Kiosk LAN:","IP Rilevato":"Detected IP","IP Totem:":"Totem IP:","KB) su Drive, USB o inviarlo.":"KB) to Drive, USB or send it.","KB), ma su questo dispositivo non c'è un'app per salvarlo/condividerlo. Riprova e, quando richiesto, scegli la cartella Download.":"KB), but this device doesn't have an app to save/share it. Try again and, when prompted, choose the Download folder.","KB). Contiene impostazioni, testi e immagini. Copia quel file sull'altro tablet e usa Importa backup ZIP.":"KB). It contains settings, texts and images. Copy that file to the other tablet and use Importa backup ZIP.","Ketchup, Maionese, Crema tartufo...":"Ketchup, Mayonnaise, Truffle cream...","Kiosk Control & Hardware":"Kiosk Control & Hardware","Kiosk Hardware ID:":"Kiosk Hardware ID:","L'app richiede l'accesso alla rete locale (WiFi) per consentire il collegamento con il display cucina KDS e il pannello remoto amministrativo, e l'accesso al Bluetooth per la connessione alle stampanti termiche ESC/POS.":"The app requires access to the local network (Wi‑Fi) to connect with the kitchen display KDS and the remote admin panel, and access to Bluetooth to connect to ESC/POS thermal printers.","L'attivazione di Totem QuickBite conferisce una licenza d'uso per singolo terminale Kiosk touch-screen.":"Activating Totem QuickBite grants a single-terminal license for the touch-screen Kiosk.","La scansione Bluetooth funziona solo su Android.":"Bluetooth scanning works only on Android.","Le categorie vengono ordinate per indice crescente. 0 = prima categoria.":"Categories are sorted by increasing index. 0 = first category.","Le stampe per la cucina continuano a funzionare normalmente.":"Kitchen prints continue to work normally.","Licenza e Abbonamenti":"License & Subscriptions","Lista Extra (€)":"Extras List (€)","Loading Kiosk & Hardware Settings...":"Loading Kiosk & Hardware Settings...","Local server boot error:":"Local server boot error:","Logo Ristorante":"Restaurant Logo","Luminosità & Controllo Display":"Brightness & Display Control","Luminosità impostata al 10% (risparmio energetico). Tocca lo schermo per ripristinare.":"Brightness set to 10% (power saving). Tap the screen to restore.","Luminosità Schermo (":"Screen Brightness (","MAC es. 00:11:22:33:44:55 o nome":"MAC e.g. 00:11:22:33:44:55 or name","mailto:priologiovanni82@gmail.com?subject=Supporto%20Guida%20Totem%20QuickBite":"mailto:priologiovanni82@gmail.com?subject=Supporto%20Guida%20Totem%20QuickBite","Memoria Libera:":"Free Memory:","Metodo Pagamento:":"Payment Method:","Min selezioni / Max selezioni":"Min selections / Max selections","Modalità Kiosk & Blocco Schermo":"Kiosk Mode & Screen Lock","Modifica Categoria":"Edit Category","Modifica Gruppo":"Edit Group","Modifica Prodotto":"Edit Product","Modulo stampante non disponibile":"Printer module not available","N°":"No.","Nessun abbonamento attivo rilevato su questo dispositivo.":"No active subscription detected on this device.","Nessun Abbonamento Trovato":"No Subscription Found","Nessun argomento trovato per la ricerca \"":"No topic found for search \"","Nessun dispositivo Bluetooth":"No Bluetooth device","Nessun dispositivo in modalita web.":"No device in web mode.","Nessun dispositivo trovato. Accendi e abbina la stampante in Impostazioni Android Bluetooth, concedi i permessi, poi aggiorna la lista. Oppure inserisci il MAC manualmente.":"No device found. Turn on and pair the printer in Android Bluetooth Settings, grant permissions, then refresh the list. Or enter the MAC manually.","Nessun dispositivo. Abbina prima la stampante nelle impostazioni Bluetooth di sistema, poi riprova.":"No device. Pair the printer first in the system Bluetooth settings, then try again.","Nessun gruppo globale configurato. Creane uno nella scheda \"Gruppi\" per collegarlo rapidamente qui.":"No global group configured. Create one in the \"Groups\" tab to link it here quickly.","Nessun gruppo globale configurato. Creane uno nella sezione Gruppi.":"No global group configured. Create one in the Groups section.","Nessun ordine":"No orders","Nessuna immagine selezionata":"No image selected","Nessuna stampante configurata":"No printer configured","Nessuna stampante trovata. Verifica che:":"No printer found. Check that:","Nessuna stampante. Aggiungine una dalla lista o inserisci il MAC.":"No printer. Add one from the list or enter the MAC.","Nome *":"Name *","Nome del Ristorante":"Restaurant Name","Nome Interno (es: Salse Panini)":"Internal Name (e.g. Salse Panini)","Nome opzione":"Option name","Nome sezione (es: Creme, Salse, Extra...)":"Section name (e.g.: Creme, Salse, Extra...)","Non disponibile":"Unavailable","Note Legali & Conformità Google Play Store":"Legal Notes & Google Play Store Compliance","Numero di tocchi segreti:":"Number of secret taps:","Numero Ordini":"Number of Orders","Nuova Categoria":"New Category","Nuova password":"New password","Nuovo Gruppo":"New Group","Nuovo PIN":"New PIN","Nuovo Prodotto":"New Product","Nuovo username":"New username","Offline: admin / admin123 (or PIN 1234)":"Offline: admin / admin123 (or PIN 1234)","Ogni modifica effettuata da remoto si sincronizza automaticamente con il totem.":"Any change made remotely syncs automatically with the totem.","Operazione annullata.":"Operation canceled.","Opzioni (nome + sovrapprezzo €)":"Options (name + surcharge €)","Orario reset giornaliero (HH:mm)":"Daily reset time (HH:mm)","Ordine a voce":"Voice order","ORDINE A VOCE":"VOICE ORDER","Ordine a voce - cliente ordinerà in cassa":"Voice order - customer will order at the counter","Ordine visualizzazione":"Order display","Ordini e comande illimitati":"Unlimited orders and tickets","Orologio Digitale":"Digital Clock","Paga in cassa al ritiro":"Pay at counter on pickup","Paired printers error:":"Paired printers error:","Pane, Carne, Lattuga, Pomodoro":"Bread, Meat, Lettuce, Tomato","Pannello amministrativo remoto in rete locale":"Remote admin panel on local network","Password attuale":"Current password","Password attuale non corretta":"Current password is incorrect","Per abilitarlo, vai su Impostazioni e attiva l'opzione \"Display Cucina\".":"To enable it, go to Settings and turn on the \"Display Cucina\" option.","Per qualsiasi informazione sulla gestione dei dati, contatta Totem QuickBite attraverso i canali di assistenza ufficiali.":"For any information about data handling, contact Totem QuickBite through official support channels.","PERIODO PROVA SCADUTO":"Trial period expired","Permessi Bluetooth negati":"Bluetooth permissions denied","Permesso negato":"Permission denied","Permette il controllo remoto e la telemetria via rete locale LAN (compatibile con Home Assistant e pannello web).":"Allows remote control and telemetry over the local LAN (compatible with Home Assistant and web panel).","Personalizza ingredienti, salse, opzioni ed extra come preferisci.":"Customize ingredients, sauces, options and extras as you like.","Personalizzazioni sul totem":"Personalizations on the totem","Piano Base Annuale":"Annual Basic Plan","Piano Base Totem":"Totem Basic Plan","Piano Configurato:":"Configured Plan:","Piano di abbonamento non disponibile.":"Subscription plan not available.","pickImage category error":"pickImage category error","pickImage product error":"pickImage product error","PIN attuale":"Current PIN","PIN attuale / nuovo / conferma":"Current PIN / new / confirm","PIN attuale non corretto":"Current PIN incorrect","PIN errato. Predefinito: 0000 o 1234":"Wrong PIN. Default: 0000 or 1234","Please enter username and password":"Please enter username and password","Porta standard 8000 / microserver Python locale.":"Default port 8000 / local Python microserver.","Posizione del Trigger Segreto:":"Secret trigger location:","Premi Cerca o Aggiorna lista. Vedrai cuffie, speaker e stampanti: aggiungi solo la stampante.":"Press Search or Refresh list. You'll see headsets, speakers and printers: add only the printer.","Presentati al banco":"Present yourself at the counter","Prezzo (€) *":"Price (€) *","prodotti (con immagini). Se qualcosa non si aggiorna, chiudi e riapri l'app.":"products (with images). If something doesn't update, close and reopen the app.","Prodotti Esauriti":"Out of stock products","Prodotto aggiornato":"Product updated","Prodotto creato":"Product created","Prodotto eliminato":"Product deleted","Prodotto Esaurito":"Product sold out","Prodotto non trovato nel menu.":"Product not found in the menu.","Prova gratuita (":"Free trial (","PROVA GRATUITA (":"FREE TRIAL (","Questo articolo è attualmente esaurito e non può essere modificato.":"This item is currently sold out and cannot be edited.","Reset error:":"Reset error:","Reset Eseguito":"Reset completed","Reset Numerazione e Comande?":"Reset numbering and orders?","Reset Numero Ora":"Reset number now","Reset Prova":"Reset trial","REST API Locale Attiva":"Local REST API active","rgba(0,0,0,0.5)":"rgba(0,0,0,0.5)","rgba(0,0,0,0.7)":"rgba(0,0,0,0.7)","rgba(0,0,0,0.85)":"rgba(0,0,0,0.85)","rgba(0,0,0,0.92)":"rgba(0,0,0,0.92)","rgba(15, 23, 42, 0.6)":"rgba(15, 23, 42, 0.6)","rgba(15, 23, 42, 0.65)":"rgba(15, 23, 42, 0.65)","rgba(255, 107, 107, 0.1)":"rgba(255, 107, 107, 0.1)","rgba(255, 107, 107, 0.15)":"rgba(255, 107, 107, 0.15)","rgba(255, 107, 107, 0.2)":"rgba(255, 107, 107, 0.2)","rgba(255, 107, 107, 0.3)":"rgba(255, 107, 107, 0.3)","rgba(255, 255, 255, 0.12)":"rgba(255, 255, 255, 0.12)","rgba(255, 255, 255, 0.18)":"rgba(255, 255, 255, 0.18)","rgba(255,255,255,0.12)":"rgba(255,255,255,0.12)","rgba(255,255,255,0.2)":"rgba(255,255,255,0.2)","rgba(255,255,255,0.9)":"rgba(255,255,255,0.9)","rgba(56, 189, 248, 0.15)":"rgba(56, 189, 248, 0.15)","Riapre l'app totem immediatamente dopo il riavvio del tablet.":"Reopens the kiosk app immediately after the tablet restarts.","Rileva IP":"Detect IP","Ripristina Abbonamento Google Play":"Restore Google Play Subscription","Ripristina Prova":"Restore Trial","Ripristino Completato":"Restore Completed","RISPARMIA 2 MESI":"SAVE 2 MONTHS","Risparmio Energetico (Dimmed)":"Energy Saving (Dimmed)","Ritiro al Banco Senza Attese":"Counter pickup — no wait","Salse gratuite":"Free sauces","Salva Credenziali":"Save credentials","Salva Impostazioni":"Save settings","Salvaschermo & Reset Inattività":"Screensaver & Inactivity Reset","Salvaschermo avviato. Tocca lo schermo per uscire.":"Screensaver started. Tap the screen to exit.","Scadenza / Prossimo Rinnovo:":"Expiry / Next Renewal:","Scan error:":"Scan error:","scan failed":"scan failed","Scansione completata":"Scan completed","Scelta obbligatoria":"Selection required","Schermo Nero":"Black screen","Schermo Sempre Acceso (Keep Awake)":"Screen Always On (Keep Awake)","Scontrino Cortesia":"Courtesy receipt","SCONTRINO CORTESIA":"Courtesy receipt","Scrivi al Supporto":"Contact Support","Segnale acustico e vibrazione hardware eseguiti.":"Beep and vibration triggered.","Seleziona i gruppi globali (salse, ingredienti, extra o scelte) da collegare a questo prodotto.":"Select global groups (sauces, ingredients, extras or choices) to link to this product.","Sicurezza & Gesture di Sblocco":"Security & Unlock Gestures","Solo circa 7,40 € al mese con fatturazione annuale.":"Only about €7.40 per month with annual billing.","Stampa Automatica":"Automatic Printing","Stampa scontrini termici ESC/POS":"Print thermal receipts (ESC/POS)","Stampanti Bluetooth":"Bluetooth Printers","Stato Attivazione Dispositivo":"Device Activation Status","Stato Kiosk:":"Kiosk Status:","Stato licenza reimpostato a periodo di prova.":"License status reset to trial period.","Stato Schermo:":"Screen Status:","Step-by-step instructions for hardware configuration, orders, and restaurant management":"Step-by-step instructions for hardware configuration, orders, and restaurant management","Svuota il carrello e torna alla home se il cliente si allontana prima di pagare.":"Empty the cart and return to home if the customer walks away before paying.","Tempo attesa reset carrello:":"Cart reset wait time:","Termini di Servizio (EULA)":"Terms of Service (EULA)","Termini di Servizio & Licenza d'Uso":"Terms of Service & License Agreement","Test Dimming (10%)":"Dimming Test (10%)","Test Feedback Beep":"Feedback Beep Test","Test Risveglio (Wake)":"Wake Test (Wake)","Test Salvaschermo":"Screensaver Test","Test Strumenti & Comandi Hardware:":"Hardware Tools & Commands Test:","thermal driver import missing":"Thermal driver import missing","Ticket Cucina":"Kitchen Ticket","Timeout Inattività:":"Inactivity timeout:","Tipo di Salvaschermo:":"Screensaver type:","Tipo Sezione":"Section type","Tipo: extra a pagamento":"Type: paid extra","Tipo: gruppo a scelta (min/max + prezzo)":"Type: choice group (min/max + price)","Tipo: ingredienti da togliere":"Type: ingredients to remove","Tipo: scelte gratuite (salse/creme...)":"Type: free choices (sauces/creams...)","Titolo per cliente (es: Scegli salse)":"Title for customer (e.g. Choose sauces)","TOCCA LO SCHERMO PER ORDINARE":"TOUCH THE SCREEN TO ORDER","Tocca lo schermo per riattivare":"Touch the screen to reactivate","Tocca lo schermo per scoprire il nostro menu e ordinare subito.":"Touch the screen to browse our menu and order now.","Tocca per iniziare ad ordinare":"Tap to start ordering","Totale: €":"Total: €","Totem in Standby":"Totem in Standby","Totem Kiosk REST API & Telemetria LAN":"Totem Kiosk REST API & LAN Telemetry","Totem Operating Guide & Manual":"Totem Operating Guide & Manual","Totem QuickBite · Versione build v1.2.10":"Totem QuickBite · Build version v1.2.10","TOTEM RISTORANTE":"TOTEM RESTAURANT","Totem Self-Service":"Totem Self-Service","Tutte le funzionalità del Piano Base":"All features of the Basic Plan","Tutti i marchi citati appartengono ai rispettivi proprietari. L'applicazione non condivide dati sensibili di pagamento con terze parti non autorizzate. Gli abbonamenti in-app sono elaborati direttamente dai server sicuri di Google Play Billing.":"All mentioned brands belong to their respective owners. The application does not share sensitive payment data with unauthorized third parties. In-app subscriptions are processed directly by the secure servers of Google Play Billing.","Ultimo reset:":"Last reset:","Uno o più articoli nel tuo carrello non sono più disponibili. Rimuovili per poter procedere.":"One or more items in your cart are no longer available. Remove them to proceed.","URL Server Personalizzato (Opzionale per Cloud / Dominio)":"Custom Server URL (Optional for Cloud / Domain)","Usa il menu di condivisione per salvare il ZIP (":"Use the share menu to save the ZIP (","Username / Password":"Username / Password","Username attuale":"Current username","Username attuale non corretto":"Current username incorrect","Username e password nuovi obbligatori":"New username and password required","Versione Sistema:":"System Version:","Vuoi attivare il \"":"Do you want to activate the \\\"","Vuoi eliminare":"Do you want to delete","Vuoi eliminare \"":"Do you want to delete \\\"","Vuoi eliminare la categoria \"":"Do you want to delete the category \\\"","Vuoi ripristinare il periodo di prova (":"Do you want to restore the trial period (","ZIP non valido":"Invalid ZIP"},"fr":{"- Senza":"- Sans",", Max":", Max",";base64,":";base64,","\" a":"\" a","\"? Tutti i prodotti associati rimarranno ma non saranno più visibili.":"\"? Tous les produits associés resteront mais ne seront plus visibles.","(copia)":"(copier)","(Senza nome)":"(Sans nom)",") con addebito sul tuo account Google Play Store?":") facturé sur votre compte Google Play Store ?",") error:":") erreur :","[print] attempt":"[print] tentative","[print] logo nodes failed":"[print] échec des nœuds du logo","[printer] getStoredPrinterAddress(":"[printer] getStoredPrinterAddress(","[printer] getStoredPrinterConfig error:":"[printer] getStoredPrinterConfig erreur :","[printer] savePrinterAddress(":"[printer] savePrinterAddress(","[printer] savePrinterConfig error:":"[printer] savePrinterConfig erreur :","[printer][perms] Android >=31 requestMultiple results:":"[printer][perms] Android >=31 requestMultiple résultats :","[printer][perms] Checking Bluetooth permissions...":"[printer][perms] Vérification des autorisations Bluetooth...","[printer][perms] Exception requesting Bluetooth permissions:":"[printer][perms] Exception lors de la demande des autorisations Bluetooth :","[printer][scan] Calling TP.scan()...":"[printer][scan] Appel de TP.scan()...","[printer][scan] Devices breakdown:":"[printer][scan] Répartition des appareils :","[printer][scan] Entering Android/Native Bluetooth branch":"[printer][scan] Entrée dans la branche Android/Native Bluetooth","[printer][scan] Entering Web bridge branch via backend /api/admin/bt/printers":"[printer][scan] Entrée dans la branche Web bridge via backend /api/admin/bt/printers","[printer][scan] Final resolved printers list:":"[printer][scan] Liste finale des imprimantes résolues :","[printer][scan] getTP() returned null (thermal printer driver module not available)":"[printer][scan] getTP() a renvoyé null (module pilote imprimante thermique non disponible)","[printer][scan] Starting getPairedPrinters...":"[printer][scan] Démarrage de getPairedPrinters...","[printer][scan] TP.scan() failed, trying alternative methods:":"[printer][scan] TP.scan() a échoué, tentative de méthodes alternatives:","[printer][scan] TP.scan() raw result:":"[printer][scan] TP.scan() résultat brut:","[printer][scan] Web bridge returned printers:":"[printer][scan] Web bridge a renvoyé les imprimantes:","*** CUCINA ***":"*** CUISINE ***","/ anno":"/ an","/ mese":"/ mois","+ Aggiungi extra":"+ Ajouter supplément","+ Aggiungi opzione":"+ Ajouter option","+ Extra €":"+ Supplément €","+ Gruppo scelta":"+ Groupe de choix","+ Ingredienti":"+ Ingrédients","+ Salse/Creme":"+ Sauces/Crèmes","</body></html>":"</body></html>","<html><body style=\"font-family:monospace;white-space:pre;font-size:11px\">":"<html><body style=\"font-family:monospace;white-space:pre;font-size:11px\">","⚠️ IP Wi-Fi non rilevato automaticamente. Inserisci l'indirizzo IP del tablet (es. 192.168.1.9) nel campo sotto per generare il QR Code corretto.":"⚠️ L'adresse IP Wi‑Fi n'a pas été détectée automatiquement. Entrez l'adresse IP de la tablette (ex. 192.168.1.9) dans le champ ci‑dessous pour générer le QR Code correct.","⚡ Ordine Diretto":"⚡ Commande directe","✅ Test Dimming":"✅ Test de gradation","✅ Test Risveglio":"✅ Test de réveil","✅ Test Salvaschermo":"✅ Test économiseur d'écran","❌ SENZA":"❌ SANS","🍔 Freschezza & Qualità":"🍔 Fraîcheur & Qualité","🍟 Facile & Veloce":"🍟 Facile & Rapide","🎉 Abbonamento Attivato!":"🎉 Abonnement activé !","📚 Gruppi Extra Globali (":"📚 Groupes d'extras globaux (","📝 Note:":"📝 Notes:","🔔 Feedback Acustico":"🔔 Retour sonore","🔴 Esaurito":"🔴 Épuisé","🟢 Attivo (":"🟢 Actif (","🟢 Disponibile":"🟢 Disponible","1 display cucina KDS in tempo reale":"1 écran KDS cuisine en temps réel","1 postazione Totem touch-screen":"1 station Totem à écran tactile","1. Concessione della Licenza":"1. Octroi de licence","1. la stampante sia già associata nelle impostazioni Bluetooth di Android,":"1. que l'imprimante soit déjà appairée dans les paramètres Bluetooth d'Android,","1. Raccolta e Trattamento dei Dati":"1. Collecte et traitement des données","1. Telefono e totem connessi alla stessa rete Wi-Fi":"1. Le téléphone et le Totem connectés au même réseau Wi‑Fi","10 Tocchi":"10 appuis","2 mesi gratuiti inclusi":"2 mois gratuits inclus","2 min":"2 min","2. Apri l'indirizzo sopra nel browser del telefono o scansiona il QR Code":"2. Ouvrez l'adresse ci‑dessus dans le navigateur du téléphone ou scannez le QR Code","2. Gestione dei Pagamenti":"2. Gestion des paiements","2. i permessi Bluetooth siano concessi,":"2. que les autorisations Bluetooth soient accordées,","2. Rinnovi e Cancellazioni Abbonamento":"2. Renouvellements et annulations d'abonnement","3. Effettua l'accesso inserendo il PIN dell'app (":"3. Connectez‑vous en saisissant le PIN de l'app (","3. il Bluetooth del telefono sia attivo.":"3. que le Bluetooth du téléphone soit activé.","3. Permessi Hardware":"3. Permissions matérielles","3. Supporto Tecnico e Aggiornamenti":"3. Support technique et mises à jour","30 sec":"30 sec","4. Titolare del Trattamento":"4. Responsable du traitement","5 min":"5 min","5 Tocchi Rapidi":"5 appuis rapides","60 sec":"60 sec","7 Tocchi Rapidi (Consigliato)":"7 Touches rapides (Recommandé)","Abbassa la luminosità al 10% negli orari di chiusura per preservare il pannello.":"Baissez la luminosité à 10 % pendant les heures de fermeture pour préserver la dalle.","Abbonamenti Google Play Store":"Abonnements Google Play Store","Abbonamento Attivo":"Abonnement actif","ABBONAMENTO ATTIVO":"ABONNEMENT ACTIF","Abbonamento Google Play":"Abonnement Google Play","Abbonamento registrato:":"Abonnement enregistré :","Abbonamento ripristinato:":"Abonnement restauré :","Accesso Remoto da Smartphone & PC":"Accès à distance depuis Smartphone & PC","Admin Panel":"Admin Panel","Aggiorna lista dispositivi":"Actualiser la liste des appareils","Aggiornamenti software inclusi":"Mises à jour logicielles incluses","Aggiungi Extra":"Ajouter des suppléments","Aggiungi Immagine":"Ajouter une image","Aggiungi opzione":"Ajouter une option","Aggiungi sezione":"Ajouter une section","Aggiungi sezioni, rinomina, attiva/disattiva e sposta su/giù per decidere l'ordine sul totem.":"Ajoutez des sections, renommez-les, activez/désactivez et déplacez vers le haut/bas pour définir l'ordre sur le totem.","Aggiungi tutti all elenco":"Ajouter tout à la liste","Alle ore:":"À :","Allergeni (separati da virgola)":"Allergènes (séparés par des virgules)","Angolo Alto a Destra":"Coin supérieur droit","Angolo Alto a Sinistra":"Coin supérieur gauche","Apri nel browser del telefono o inquadra il QR Code:":"Ouvrez dans le navigateur de votre téléphone ou scannez le QR Code :","Attiva o gestisci l'abbonamento con addebito sicuro tramite Google Play Store. Disdici in qualsiasi momento senza vincoli.":"Activez ou gérez l'abonnement avec facturation sécurisée via Google Play Store. Résiliez à tout moment sans engagement.","Attiva su Google Play":"Activer sur Google Play","Auto-print courtesy failed":"Échec de l'impression automatique de courtoisie","Auto-print kitchen failed":"Échec de l'impression automatique vers la cuisine","Auto-Reset Carrello Abbandonato":"Réinitialisation automatique du panier abandonné","Avvio Automatico all'Accensione (Auto-Boot)":"Démarrage automatique à l'allumage (Auto-Boot)","Azzerando la numerazione, il prossimo ordine ripartirà da #1 e tutte le comande attuali verranno cancellate dalla schermata cucina.":"En remettant la numérotation à zéro, la commande suivante repartira à partir de #1 et toutes les commandes en cours seront supprimées de l'écran cuisine.","Backup / Migrazione":"Sauvegarde / Migration","Backup creato":"Sauvegarde créée","Backup e ripristino illimitati":"Sauvegardes et restaurations illimitées","Backup pronto":"Sauvegarde prête","Backup salvato":"Sauvegarde enregistrée","Banner Promozionale":"Bannière promotionnelle","Benvenuto!":"Bienvenue !","Blocca il tablet in modalità totem esclusiva. Nasconde la barra di navigazione Android e impedisce l'uscita non autorizzata ai clienti.":"Verrouille la tablette en mode borne exclusive. Masque la barre de navigation Android et empêche toute sortie non autorisée des clients.","Bridge BT non disponibile:":"Passerelle BT non disponible :","BT print failed, PDF fallback":"Impression BT échouée, bascule sur PDF","Cambia Immagine":"Changer l'image","Carica Logo":"Importer le logo","Caricamento stato licenza e abbonamenti...":"Chargement de l'état de la licence et des abonnements...","Categoria *":"Catégorie *","Categoria aggiornata":"Catégorie mise à jour","Categoria creata":"Catégorie créée","Categoria eliminata":"Catégorie supprimée","categorie e":"catégories et","Cerca dispositivi Bluetooth":"Rechercher des appareils Bluetooth","collegati)":"connectés)","Comando di risveglio schermo eseguito con successo.":"Commande de réveil de l'écran exécutée avec succès.","Compatibile con MPT, Xprinter, Rongta e altre ESC/POS (Bluetooth Classic e BLE). Mostra tutti i dispositivi Bluetooth paired e vicini: scegli la stampante e assegna Scontrino o Cucina.":"Compatible avec MPT, Xprinter, Rongta et autres ESC/POS (Bluetooth Classic et BLE). Affiche tous les appareils Bluetooth appairés et à proximité : choisissez l'imprimante et assignez Ticket ou Cuisine.","Compila almeno un campo":"Remplissez au moins un champ","Compila tutti i campi obbligatori":"Remplissez tous les champs obligatoires","Componi il Tuo Piatto":"Composez votre plat","Conferma Eliminazione":"Confirmer la suppression","Conferma PIN":"Confirmer le PIN","Conferma Reset":"Confirmer la réinitialisation","Conferma su Google Play":"Confirmer sur Google Play","Configura il comportamento del totem quando nessun cliente interagisce con lo schermo.":"Configurez le comportement du totem lorsqu'aucun client n'interagit avec l'écran.","Consenti l'accesso alle foto nelle impostazioni Android/FydeOS per aggiungere immagini ai prodotti.":"Autorisez l'accès aux photos dans les paramètres Android/FydeOS pour ajouter des images aux produits.","Consenti l'accesso alle foto nelle impostazioni Android/FydeOS per aggiungere immagini alle categorie.":"Autorisez l'accès aux photos dans les paramètres Android/FydeOS pour ajouter des images aux catégories.","Contatta direttamente il team di sviluppo per supporto su hardware, stampanti ESC/POS o licenze B2B.":"Contactez directement l'équipe de développement pour le support matériel, les imprimantes ESC/POS ou les licences B2B.","Credenziali Admin":"Identifiants Admin","Credenziali aggiornate":"Identifiants mis à jour","Dalle ore:":"À partir de :","Descrizione *":"Description *","Descrizione del prodotto":"Description du produit","Descrizione della categoria":"Description de la catégorie","Device management, screen lockdown, screensaver and REST API":"Gestion des appareils, verrouillage d'écran, économiseur d'écran et API REST","Dimming Notturno Programmato":"Atténuation nocturne programmée","Display Cucina":"Affichage cuisine","Display Cucina Disabilitato":"Affichage cuisine désactivé","Dispositivi trovati (":"Périphériques trouvés (","dispositivi. Aggiungi la stampante all elenco e assegna Scontrino/Cucina.":"périphériques. Ajoutez l'imprimante à la liste et assignez Reçu/Cuisine.","Elementi (separati da virgola)":"Éléments (séparés par des virgules)","Elenco Stampanti":"Liste des imprimantes","Enter your credentials to access management":"Saisissez vos identifiants pour accéder à la gestion","Error checking product availability:":"Erreur lors de la vérification de la disponibilité du produit :","Error creating order:":"Erreur lors de la création de la commande :","Error deleting category:":"Erreur lors de la suppression de la catégorie :","Error deleting product:":"Erreur lors de la suppression du produit :","Error loading categories:":"Erreur lors du chargement des catégories :","Error loading data:":"Erreur lors du chargement des données :","Error loading Kiosk data:":"Erreur lors du chargement des données Kiosk :","Error loading orders:":"Erreur lors du chargement des commandes :","Error loading products:":"Erreur lors du chargement des produits :","Error loading settings:":"Erreur lors du chargement des paramètres :","Error printing:":"Erreur d'impression :","Error saving category:":"Erreur lors de l'enregistrement de la catégorie :","Error saving kiosk config:":"Erreur lors de l'enregistrement de la configuration Kiosk :","Error saving product:":"Erreur lors de l'enregistrement du produit :","Error saving:":"Erreur d'enregistrement :","Error updating order:":"Erreur lors de la mise à jour de la commande :","Errore applicazione hardware kiosk:":"Erreur d'application matérielle kiosk :","Errore caricamento dati licenza:":"Erreur de chargement des données de licence :","Errore di salvataggio:":"Erreur d'enregistrement :","Errore inizializzazione KioskStore:":"Erreur d'initialisation de KioskStore :","Errore lettura configurazione Kiosk:":"Erreur de lecture de la configuration Kiosk :","Errore lettura licenza da storage:":"Erreur de lecture de la licence depuis le stockage :","Errore Pagamento":"Erreur de paiement","Errore salvataggio configurazione Kiosk:":"Erreur lors de l'enregistrement de la configuration du Kiosk :","Errore salvataggio prova iniziale:":"Erreur lors de l'enregistrement du test initial :","Errore scansione":"Erreur de scan","errore sconosciuto":"Erreur inconnue","Errore stampa":"Erreur d'impression","Errore Transazione":"Erreur de transaction","Es: Hamburger Classico":"Ex : Hamburger classique","Es: Maionese, Ketchup":"Ex : Mayonnaise, Ketchup","Es: Panini":"Ex : Sandwichs","Es: Patatine":"Ex : Frites","Es: PIZZERIA DA MARIO":"Ex : PIZZERIA DA MARIO","Es: Pomodoro, Lattuga":"Ex : Tomate, Laitue","Es. 06:00 → ogni giorno alle 6:00 il contatore ordini riparte da 1":"Ex. 06:00 → chaque jour à 06:00 le compteur de commandes repart de 1","es. 192.168.1.9":"Ex. 192.168.1.9","es. https://miosito.it oppure lascia vuoto per rete locale":"Ex. https://miosito.it ou laissez vide pour le réseau local","Esporta backup ZIP":"Exporter la sauvegarde ZIP","Esporta: ti chiede dove salvare il ZIP (scegli Download). Importa: seleziona il file ZIP. Contiene impostazioni, testi e immagini.":"Export : demande où enregistrer le ZIP (choisissez Download). Import : sélectionnez le fichier ZIP. Contient paramètres, textes et images.","export backup":"Exporter la sauvegarde","Extra a pagamento":"Suppléments payants","Extra Formaggio:1, Bacon:1.5":"Supplément Fromage:1, Bacon:1.5","failed on":"échec sur","File ZIP salvato nella cartella che hai scelto (":"Fichier ZIP enregistré dans le dossier que vous avez choisi (","Gestione Categorie":"Gestion des catégories","Gestione completa per singolo totem con rinnovo mensile.":"Gestion complète pour un seul totem avec renouvellement mensuel.","Gestione Ordini":"Gestion des commandes","Gestione Prodotti":"Gestion des produits","Gestisci lo stato della prova e gli abbonamenti disponibili.":"Gérez l'état d'essai et les abonnements disponibles.","Gestisci prodotti, categorie, foto, listini e impostazioni dal telefono o PC senza toccare il totem.":"Gérez produits, catégories, photos, listes de prix et paramètres depuis le téléphone ou le PC sans toucher le totem.","GG)":"GG)","giorni)":"jours)","giorni) per questo dispositivo?":"jours) pour cet appareil ?","Gli abbonamenti digitali in-app sono gestiti integralmente da Google Play Billing. L'applicazione non ha accesso né memorizza carte di credito o coordinate bancarie.":"Les abonnements numériques in-app sont intégralement gérés par Google Play Billing. L'application n'accède pas et ne stocke pas les cartes de crédit ni les coordonnées bancaires.","Gli abbonamenti Google Play Store si rinnovano automaticamente. È possibile gestire la cancellazione o la modifica del metodo di pagamento in qualsiasi momento direttamente dal proprio account Google Play.":"Les abonnements Google Play Store se renouvellent automatiquement. Vous pouvez gérer l'annulation ou modifier le moyen de paiement à tout moment depuis votre compte Google Play.","Gli abbonamenti si rinnovano automaticamente tramite il tuo account Google Play a meno che non vengano disdetti almeno 24 ore prima della scadenza. Puoi gestire o annullare l'abbonamento in qualsiasi momento dall'app Google Play &gt; Pagamenti e Abbonamenti.":"Les abonnements se renouvellent automatiquement via votre compte Google Play, sauf s'ils sont annulés au moins 24 heures avant l'expiration. Vous pouvez gérer ou annuler l'abonnement à tout moment depuis l'application Google Play &gt; Paiements et abonnements.","Gli aggiornamenti software correttivi e le nuove funzionalità vengono rilasciati attraverso i canali di distribuzione dell'app.":"Les mises à jour correctives et les nouvelles fonctionnalités sont publiées via les canaux de distribution de l'application.","glutine, lattosio, uova":"gluten, lactose, œufs","Google Play Store Billing":"Google Play Store Billing","Grazie!":"Merci!","Gruppi Extra Globali":"Groupes d'extras globaux","Gruppi Opzionali Globali":"Groupes optionnels globaux","Gruppo a scelta":"Groupe au choix","Hai bisogno di assistenza o configurazione personalizzata?":"Besoin d'aide ou d'une configuration personnalisée ?","Ho Letto e Accetto":"J'ai lu et j'accepte","I gruppi selezionati vengono aggiunti automaticamente a questo prodotto al momento dell'ordine.":"Les groupes sélectionnés sont ajoutés automatiquement à ce produit au moment de la commande.","I nuovi PIN non coincidono":"Les nouveaux PIN ne correspondent pas","Ideale per singola postazione (Pizzerie, Bar, Chioschi)":"Idéal pour une seule station (Pizzerias, Bars, Kiosques)","Il file ZIP è stato creato (":"Le fichier ZIP a été créé (","Il nome del ristorante non puo essere vuoto":"Le nom du restaurant ne peut pas être vide","Il nuovo PIN deve essere di 4 cifre":"Le nouveau PIN doit comporter 4 chiffres","Il più scelto dai piccoli ristoratori (2 mesi gratis)":"Le plus choisi par les petits restaurateurs (2 mois offerts)","Immagine (opzionale)":"Image (optionnelle)","Impedisce lo spegnimento dello schermo durante il servizio.":"Empêche l'écran de s'éteindre pendant le service.","import backup":"Importer la sauvegarde","Import completato":"Importation terminée","Import fallito:":"Importation échouée:","Importa backup ZIP":"Importer la sauvegarde ZIP","Impossibile aggiornare la disponibilità":"Impossible de mettre à jour la disponibilité","Impossibile aprire la galleria. Controlla i permessi foto.":"Impossible d'ouvrir la galerie. Vérifiez les autorisations photos.","Impossibile aprire la modifica.":"Impossible d'ouvrir la modification.","Impossibile caricare i dati":"Impossible de charger les données","Impossibile caricare le categorie":"Impossible de charger les catégories","Impossibile completare il ripristino:":"Impossible de compléter la restauration:","Impossibile creare il backup:":"Impossible de créer la sauvegarde:","Impossibile eliminare il prodotto":"Impossible de supprimer le produit","Impossibile eliminare la categoria":"Impossible de supprimer la catégorie","Impossibile leggere l'immagine selezionata":"Impossible de lire l'image sélectionnée","Impossibile recuperare i dispositivi Bluetooth. Controlla i permessi.":"Impossible de récupérer les appareils Bluetooth. Vérifiez les autorisations.","Impossibile rilevare l'IP in automatico. Inserisci l'indirizzo IP visibile nelle impostazioni Wi-Fi del tablet (es. 192.168.1.9).":"Impossible de détecter l'IP automatiquement. Saisissez l'adresse IP visible dans les paramètres Wi-Fi de la tablette (ex. 192.168.1.9).","Impossibile salvare il gruppo":"Impossible d'enregistrer le groupe","Impossibile salvare il prodotto":"Impossible d'enregistrer le produit","Impossibile salvare la categoria":"Impossible d'enregistrer la catégorie","Impossibile salvare le credenziali":"Impossible d'enregistrer les identifiants","Impossibile salvare le impostazioni":"Impossible d'enregistrer les paramètres","Imposta la sequenza di tocchi segreta per aprire il pannello di amministrazione e il PIN di protezione.":"Définissez la séquence de touches secrète pour ouvrir le panneau d'administration et le code PIN de protection.","Impostazioni salvate correttamente":"Paramètres enregistrés","In Alto Centrale":"En haut au centre","In Attesa":"En attente","In Preparazione":"En préparation","Indirizzo IP Totem (Wi-Fi Locale)":"Adresse IP du Totem (Wi‑Fi local)","Indirizzo IP Wi-Fi trovato:":"Adresse IP Wi‑Fi trouvée :","Info Rilevamento":"Infos détection","Informativa Privacy (GDPR)":"Politique de confidentialité (GDPR)","Informativa sulla Privacy (GDPR)":"Politique de confidentialité (GDPR)","Informazioni Ristorante":"Informations sur le restaurant","Ingredienti (separati da virgola)":"Ingrédients (séparés par des virgules)","Ingredienti base":"Ingrédients de base","Ingredienti Base":"Ingrédients de base","Inserisci il nome o titolo del gruppo":"Saisissez le nom ou le titre du groupe","Interactive Totem Guide":"Guide interactif du Totem","Invalid credentials. Use admin / admin123":"Identifiants invalides. Utilisez admin / admin123","Invia la tua comanda in cucina e ricevi il tuo scontrino con numero.":"Envoyez votre commande en cuisine et recevez votre ticket numéroté.","IP detect error:":"Erreur de détection IP :","IP Kiosk LAN:":"IP Kiosk LAN :","IP Rilevato":"IP détectée","IP Totem:":"IP du Totem :","KB) su Drive, USB o inviarlo.":"KB) sur Drive, USB ou l'envoyer.","KB), ma su questo dispositivo non c'è un'app per salvarlo/condividerlo. Riprova e, quando richiesto, scegli la cartella Download.":"KB), mais sur cet appareil il n'y a pas d'application pour l'enregistrer/partager. Réessayez et, lorsque demandé, choisissez le dossier Download.","KB). Contiene impostazioni, testi e immagini. Copia quel file sull'altro tablet e usa Importa backup ZIP.":"KB). Contient les paramètres, les textes et les images. Copiez ce fichier sur l'autre tablette et utilisez Importa backup ZIP.","Ketchup, Maionese, Crema tartufo...":"Ketchup, Mayonnaise, Crème de truffe...","Kiosk Control & Hardware":"Contrôle Kiosk et Matériel","Kiosk Hardware ID:":"ID matériel Kiosk:","L'app richiede l'accesso alla rete locale (WiFi) per consentire il collegamento con il display cucina KDS e il pannello remoto amministrativo, e l'accesso al Bluetooth per la connessione alle stampanti termiche ESC/POS.":"L'application nécessite l'accès au réseau local (Wi‑Fi) pour permettre la connexion avec l'écran cuisine KDS et le panneau d'administration distant, et l'accès au Bluetooth pour la connexion aux imprimantes thermiques ESC/POS.","L'attivazione di Totem QuickBite conferisce una licenza d'uso per singolo terminale Kiosk touch-screen.":"L'activation de Totem QuickBite accorde une licence d'utilisation pour un seul terminal Kiosk à écran tactile.","La scansione Bluetooth funziona solo su Android.":"La recherche Bluetooth ne fonctionne que sur Android.","Le categorie vengono ordinate per indice crescente. 0 = prima categoria.":"Les catégories sont triées par indice croissant. 0 = première catégorie.","Le stampe per la cucina continuano a funzionare normalmente.":"Les impressions pour la cuisine continuent de fonctionner normalement.","Licenza e Abbonamenti":"Licence et abonnements","Lista Extra (€)":"Liste Extras (€)","Loading Kiosk & Hardware Settings...":"Chargement des paramètres Kiosk & Hardware...","Local server boot error:":"Erreur de démarrage du serveur local:","Logo Ristorante":"Logo du restaurant","Luminosità & Controllo Display":"Luminosité & Contrôle de l'écran","Luminosità impostata al 10% (risparmio energetico). Tocca lo schermo per ripristinare.":"Luminosité réglée à 10 % (économie d'énergie). Touchez l'écran pour restaurer.","Luminosità Schermo (":"Luminosité écran (","MAC es. 00:11:22:33:44:55 o nome":"MAC ex. 00:11:22:33:44:55 ou nom","mailto:priologiovanni82@gmail.com?subject=Supporto%20Guida%20Totem%20QuickBite":"mailto:priologiovanni82@gmail.com?subject=Supporto%20Guida%20Totem%20QuickBite","Memoria Libera:":"Mémoire libre :","Metodo Pagamento:":"Méthode de paiement :","Min selezioni / Max selezioni":"Min sélections / Max sélections","Modalità Kiosk & Blocco Schermo":"Mode Kiosk & Verrouillage écran","Modifica Categoria":"Modifier la catégorie","Modifica Gruppo":"Modifier le groupe","Modifica Prodotto":"Modifier le produit","Modulo stampante non disponibile":"Module d'imprimante indisponible","N°":"N°","Nessun abbonamento attivo rilevato su questo dispositivo.":"Aucun abonnement actif détecté sur cet appareil.","Nessun Abbonamento Trovato":"Aucun abonnement trouvé","Nessun argomento trovato per la ricerca \"":"Aucun sujet trouvé pour la recherche \"","Nessun dispositivo Bluetooth":"Aucun appareil Bluetooth","Nessun dispositivo in modalita web.":"Aucun appareil en mode web.","Nessun dispositivo trovato. Accendi e abbina la stampante in Impostazioni Android Bluetooth, concedi i permessi, poi aggiorna la lista. Oppure inserisci il MAC manualmente.":"Aucun appareil trouvé. Allumez et associez l'imprimante dans les Paramètres Bluetooth d'Android, accordez les autorisations, puis actualisez la liste. Ou saisissez l'adresse MAC manuellement.","Nessun dispositivo. Abbina prima la stampante nelle impostazioni Bluetooth di sistema, poi riprova.":"Aucun appareil. Associez d'abord l'imprimante dans les paramètres Bluetooth du système, puis réessayez.","Nessun gruppo globale configurato. Creane uno nella scheda \"Gruppi\" per collegarlo rapidamente qui.":"Aucun groupe global configuré. Créez-en un dans l'onglet \"Groupes\" pour le connecter rapidement ici.","Nessun gruppo globale configurato. Creane uno nella sezione Gruppi.":"Aucun groupe global configuré. Créez-en un dans la section Groupes.","Nessun ordine":"Aucune commande","Nessuna immagine selezionata":"Aucune image sélectionnée","Nessuna stampante configurata":"Aucune imprimante configurée","Nessuna stampante trovata. Verifica che:":"Aucune imprimante trouvée. Vérifiez que :","Nessuna stampante. Aggiungine una dalla lista o inserisci il MAC.":"Aucune imprimante. Ajoutez-en une depuis la liste ou saisissez le MAC.","Nome *":"Nom *","Nome del Ristorante":"Nom du restaurant","Nome Interno (es: Salse Panini)":"Nom interne (ex : Salse Panini)","Nome opzione":"Nom de l'option","Nome sezione (es: Creme, Salse, Extra...)":"Nom de la section (ex : Creme, Salse, Extra...)","Non disponibile":"Indisponible","Note Legali & Conformità Google Play Store":"Mentions légales & conformité Google Play Store","Numero di tocchi segreti:":"Nombre de touches secrètes :","Numero Ordini":"Nombre de commandes","Nuova Categoria":"Nouvelle catégorie","Nuova password":"Nouveau mot de passe","Nuovo Gruppo":"Nouveau groupe","Nuovo PIN":"Nouveau PIN","Nuovo Prodotto":"Nouveau produit","Nuovo username":"Nouveau nom d'utilisateur","Offline: admin / admin123 (or PIN 1234)":"Hors ligne: admin / admin123 (ou PIN 1234)","Ogni modifica effettuata da remoto si sincronizza automaticamente con il totem.":"Toute modification effectuée à distance se synchronise automatiquement avec le totem.","Operazione annullata.":"Opération annulée.","Opzioni (nome + sovrapprezzo €)":"Options (nom + supplément €)","Orario reset giornaliero (HH:mm)":"Heure de réinitialisation quotidienne (HH:mm)","Ordine a voce":"Commande vocale","ORDINE A VOCE":"COMMANDE VOCALE","Ordine a voce - cliente ordinerà in cassa":"Commande vocale - le client commandera au comptoir","Ordine visualizzazione":"Affichage de la commande","Ordini e comande illimitati":"Commandes et tickets illimités","Orologio Digitale":"Horloge numérique","Paga in cassa al ritiro":"Payer à la caisse au retrait","Paired printers error:":"Erreur imprimantes appairées :","Pane, Carne, Lattuga, Pomodoro":"Pain, Viande, Laitue, Tomate","Pannello amministrativo remoto in rete locale":"Panneau d'administration distant sur le réseau local","Password attuale":"Mot de passe actuel","Password attuale non corretta":"Le mot de passe actuel est incorrect","Per abilitarlo, vai su Impostazioni e attiva l'opzione \"Display Cucina\".":"Pour l'activer, allez dans Paramètres et activez l'option \"Display Cucina\".","Per qualsiasi informazione sulla gestione dei dati, contatta Totem QuickBite attraverso i canali di assistenza ufficiali.":"Pour toute information sur la gestion des données, contactez Totem QuickBite via les canaux d'assistance officiels.","PERIODO PROVA SCADUTO":"Période d'essai expirée","Permessi Bluetooth negati":"Autorisations Bluetooth refusées","Permesso negato":"Permission refusée","Permette il controllo remoto e la telemetria via rete locale LAN (compatibile con Home Assistant e pannello web).":"Permet le contrôle à distance et la télémétrie via le réseau local LAN (compatible avec Home Assistant et panneau web).","Personalizza ingredienti, salse, opzioni ed extra come preferisci.":"Personnalisez ingrédients, sauces, options et extras comme vous le souhaitez.","Personalizzazioni sul totem":"Personnalisations sur le totem","Piano Base Annuale":"Plan de base annuel","Piano Base Totem":"Plan de base Totem","Piano Configurato:":"Plan configuré :","Piano di abbonamento non disponibile.":"Plan d'abonnement non disponible.","pickImage category error":"pickImage category error","pickImage product error":"pickImage product error","PIN attuale":"PIN actuel","PIN attuale / nuovo / conferma":"PIN actuel / nouveau / confirmer","PIN attuale non corretto":"PIN actuel incorrect","PIN errato. Predefinito: 0000 o 1234":"PIN incorrect. Par défaut : 0000 ou 1234","Please enter username and password":"Veuillez saisir nom d'utilisateur et mot de passe","Porta standard 8000 / microserver Python locale.":"Port par défaut 8000 / microserveur Python local.","Posizione del Trigger Segreto:":"Emplacement du déclencheur secret :","Premi Cerca o Aggiorna lista. Vedrai cuffie, speaker e stampanti: aggiungi solo la stampante.":"Appuyez sur Rechercher ou Actualiser la liste. Vous verrez casques, enceintes et imprimantes : ajoutez uniquement l'imprimante.","Presentati al banco":"Présentez-vous au comptoir","Prezzo (€) *":"Prix (€) *","prodotti (con immagini). Se qualcosa non si aggiorna, chiudi e riapri l'app.":"produits (avec images). Si quelque chose ne se met pas à jour, fermez et rouvrez l'application.","Prodotti Esauriti":"Produits en rupture de stock","Prodotto aggiornato":"Produit mis à jour","Prodotto creato":"Produit créé","Prodotto eliminato":"Produit supprimé","Prodotto Esaurito":"Produit en rupture de stock","Prodotto non trovato nel menu.":"Produit introuvable dans le menu.","Prova gratuita (":"Essai gratuit (","PROVA GRATUITA (":"ESSAI GRATUIT (","Questo articolo è attualmente esaurito e non può essere modificato.":"Cet article est actuellement en rupture de stock et ne peut pas être modifié.","Reset error:":"Erreur de réinitialisation:","Reset Eseguito":"Réinitialisation effectuée","Reset Numerazione e Comande?":"Réinitialiser la numérotation et les commandes ?","Reset Numero Ora":"Réinitialiser le numéro maintenant","Reset Prova":"Réinitialiser l'essai","REST API Locale Attiva":"REST API locale activée","rgba(0,0,0,0.5)":"rgba(0,0,0,0.5)","rgba(0,0,0,0.7)":"rgba(0,0,0,0.7)","rgba(0,0,0,0.85)":"rgba(0,0,0,0.85)","rgba(0,0,0,0.92)":"rgba(0,0,0,0.92)","rgba(15, 23, 42, 0.6)":"rgba(15, 23, 42, 0.6)","rgba(15, 23, 42, 0.65)":"rgba(15, 23, 42, 0.65)","rgba(255, 107, 107, 0.1)":"rgba(255, 107, 107, 0.1)","rgba(255, 107, 107, 0.15)":"rgba(255, 107, 107, 0.15)","rgba(255, 107, 107, 0.2)":"rgba(255, 107, 107, 0.2)","rgba(255, 107, 107, 0.3)":"rgba(255, 107, 107, 0.3)","rgba(255, 255, 255, 0.12)":"rgba(255, 255, 255, 0.12)","rgba(255, 255, 255, 0.18)":"rgba(255, 255, 255, 0.18)","rgba(255,255,255,0.12)":"rgba(255,255,255,0.12)","rgba(255,255,255,0.2)":"rgba(255,255,255,0.2)","rgba(255,255,255,0.9)":"rgba(255,255,255,0.9)","rgba(56, 189, 248, 0.15)":"rgba(56, 189, 248, 0.15)","Riapre l'app totem immediatamente dopo il riavvio del tablet.":"Rouvre l'application totem immédiatement après le redémarrage de la tablette.","Rileva IP":"Détecter IP","Ripristina Abbonamento Google Play":"Restaurer l'abonnement Google Play","Ripristina Prova":"Restaurer la période d'essai","Ripristino Completato":"Restauration terminée","RISPARMIA 2 MESI":"ÉCONOMISEZ 2 MOIS","Risparmio Energetico (Dimmed)":"Économie d'énergie (Atténué)","Ritiro al Banco Senza Attese":"Retrait au comptoir — sans attente","Salse gratuite":"Sauces gratuites","Salva Credenziali":"Enregistrer les identifiants","Salva Impostazioni":"Enregistrer les paramètres","Salvaschermo & Reset Inattività":"Écran de veille et réinitialisation d'inactivité","Salvaschermo avviato. Tocca lo schermo per uscire.":"Écran de veille activé. Touchez l'écran pour sortir.","Scadenza / Prossimo Rinnovo:":"Expiration / Prochain renouvellement :","Scan error:":"Erreur de lecture :","scan failed":"échec du scan","Scansione completata":"Scan terminé","Scelta obbligatoria":"Choix obligatoire","Schermo Nero":"Écran noir","Schermo Sempre Acceso (Keep Awake)":"Écran toujours allumé (Keep Awake)","Scontrino Cortesia":"Reçu de courtoisie","SCONTRINO CORTESIA":"Ticket de courtoisie","Scrivi al Supporto":"Contacter le support","Segnale acustico e vibrazione hardware eseguiti.":"Signal sonore et vibration matérielle déclenchés.","Seleziona i gruppi globali (salse, ingredienti, extra o scelte) da collegare a questo prodotto.":"Sélectionnez les groupes globaux (sauces, ingrédients, extras ou choix) à associer à ce produit.","Sicurezza & Gesture di Sblocco":"Sécurité & gestes de déverrouillage","Solo circa 7,40 € al mese con fatturazione annuale.":"Environ 7,40 € par mois avec facturation annuelle.","Stampa Automatica":"Impression automatique","Stampa scontrini termici ESC/POS":"Imprimer des tickets thermiques (ESC/POS)","Stampanti Bluetooth":"Imprimantes Bluetooth","Stato Attivazione Dispositivo":"État d'activation de l'appareil","Stato Kiosk:":"État du kiosque :","Stato licenza reimpostato a periodo di prova.":"Statut de licence réinitialisé en période d'essai.","Stato Schermo:":"État de l'écran :","Step-by-step instructions for hardware configuration, orders, and restaurant management":"Instructions étape par étape pour la configuration du matériel, les commandes et la gestion du restaurant","Svuota il carrello e torna alla home se il cliente si allontana prima di pagare.":"Vider le panier et revenir à l'accueil si le client s'éloigne avant de payer.","Tempo attesa reset carrello:":"Temps d'attente avant réinitialisation du panier :","Termini di Servizio (EULA)":"Conditions d'utilisation (EULA)","Termini di Servizio & Licenza d'Uso":"Conditions d'utilisation et licence","Test Dimming (10%)":"Test d'atténuation (10%)","Test Feedback Beep":"Test du bip de confirmation","Test Risveglio (Wake)":"Test de réveil (Wake)","Test Salvaschermo":"Test de l'écran de veille","Test Strumenti & Comandi Hardware:":"Test des outils et commandes matérielles :","thermal driver import missing":"Importation du pilote thermique manquante","Ticket Cucina":"Ticket cuisine","Timeout Inattività:":"Délai d'inactivité:","Tipo di Salvaschermo:":"Type d'économiseur d'écran:","Tipo Sezione":"Type de section","Tipo: extra a pagamento":"Type : extra payant","Tipo: gruppo a scelta (min/max + prezzo)":"Type : groupe de choix (min/max + prix)","Tipo: ingredienti da togliere":"Type : ingrédients à retirer","Tipo: scelte gratuite (salse/creme...)":"Type : choix gratuits (sauces/crèmes...)","Titolo per cliente (es: Scegli salse)":"Titre pour le client (ex : Choisissez les sauces)","TOCCA LO SCHERMO PER ORDINARE":"TOUCHEZ L'ÉCRAN POUR COMMANDER","Tocca lo schermo per riattivare":"Touchez l'écran pour réactiver","Tocca lo schermo per scoprire il nostro menu e ordinare subito.":"Touchez l'écran pour découvrir notre menu et commander dès maintenant.","Tocca per iniziare ad ordinare":"Touchez pour commencer à commander","Totale: €":"Total: €","Totem in Standby":"Totem en veille","Totem Kiosk REST API & Telemetria LAN":"Totem Kiosk REST API & Télémétrie LAN","Totem Operating Guide & Manual":"Guide d'utilisation et manuel Totem","Totem QuickBite · Versione build v1.2.10":"Totem QuickBite · Version build v1.2.10","TOTEM RISTORANTE":"TOTEM RESTAURANT","Totem Self-Service":"Totem Libre-service","Tutte le funzionalità del Piano Base":"Toutes les fonctionnalités du plan de base","Tutti i marchi citati appartengono ai rispettivi proprietari. L'applicazione non condivide dati sensibili di pagamento con terze parti non autorizzate. Gli abbonamenti in-app sono elaborati direttamente dai server sicuri di Google Play Billing.":"Toutes les marques citées appartiennent à leurs propriétaires respectifs. L'application ne partage pas de données de paiement sensibles avec des tiers non autorisés. Les abonnements in-app sont traités directement par les serveurs sécurisés de Google Play Billing.","Ultimo reset:":"Dernière réinitialisation:","Uno o più articoli nel tuo carrello non sono più disponibili. Rimuovili per poter procedere.":"Un ou plusieurs articles dans votre panier ne sont plus disponibles. Supprimez-les pour pouvoir continuer.","URL Server Personalizzato (Opzionale per Cloud / Dominio)":"URL du serveur personnalisé (optionnel pour Cloud / domaine)","Usa il menu di condivisione per salvare il ZIP (":"Utilisez le menu de partage pour enregistrer le ZIP (","Username / Password":"Nom d'utilisateur / Mot de passe","Username attuale":"Nom d'utilisateur actuel","Username attuale non corretto":"Nom d'utilisateur actuel incorrect","Username e password nuovi obbligatori":"Nouveau nom d'utilisateur et mot de passe requis","Versione Sistema:":"Version du système:","Vuoi attivare il \"":"Voulez-vous activer le \\\"","Vuoi eliminare":"Voulez-vous supprimer","Vuoi eliminare \"":"Voulez-vous supprimer \\\"","Vuoi eliminare la categoria \"":"Voulez-vous supprimer la catégorie \\\"","Vuoi ripristinare il periodo di prova (":"Voulez-vous rétablir la période d'essai (","ZIP non valido":"ZIP non valide"},"es":{"- Senza":"- Sin",", Max":", Max",";base64,":";base64,","\" a":"\" a","\"? Tutti i prodotti associati rimarranno ma non saranno più visibili.":"\"? Todos los productos asociados permanecerán pero ya no serán visibles.","(copia)":"(copiar)","(Senza nome)":"(Sin nombre)",") con addebito sul tuo account Google Play Store?":") con cargo a tu cuenta de Google Play Store?",") error:":") error:","[print] attempt":"[print] intento","[print] logo nodes failed":"[print] nodos logo fallidos","[printer] getStoredPrinterAddress(":"[printer] getStoredPrinterAddress(","[printer] getStoredPrinterConfig error:":"[printer] getStoredPrinterConfig error:","[printer] savePrinterAddress(":"[printer] savePrinterAddress(","[printer] savePrinterConfig error:":"[printer] savePrinterConfig error:","[printer][perms] Android >=31 requestMultiple results:":"[printer][perms] Android >=31 requestMultiple resultados:","[printer][perms] Checking Bluetooth permissions...":"[printer][perms] Comprobando permisos de Bluetooth...","[printer][perms] Exception requesting Bluetooth permissions:":"[printer][perms] Excepción al solicitar permisos de Bluetooth:","[printer][scan] Calling TP.scan()...":"[printer][scan] Llamando a TP.scan()...","[printer][scan] Devices breakdown:":"[printer][scan] Desglose de dispositivos:","[printer][scan] Entering Android/Native Bluetooth branch":"[printer][scan] Entrando en la rama Android/Native Bluetooth","[printer][scan] Entering Web bridge branch via backend /api/admin/bt/printers":"[printer][scan] Entrando en la rama Web bridge vía backend /api/admin/bt/printers","[printer][scan] Final resolved printers list:":"[printer][scan] Lista final de impresoras resueltas:","[printer][scan] getTP() returned null (thermal printer driver module not available)":"[printer][scan] getTP() devolvió null (módulo controlador de impresora térmica no disponible)","[printer][scan] Starting getPairedPrinters...":"[printer][scan] Iniciando getPairedPrinters...","[printer][scan] TP.scan() failed, trying alternative methods:":"[printer][scan] TP.scan() falló, intentando métodos alternativos:","[printer][scan] TP.scan() raw result:":"[printer][scan] TP.scan() resultado en bruto:","[printer][scan] Web bridge returned printers:":"[printer][scan] Web bridge devolvió las impresoras:","*** CUCINA ***":"*** COCINA ***","/ anno":"/ año","/ mese":"/ mes","+ Aggiungi extra":"+ Añadir extra","+ Aggiungi opzione":"+ Añadir opción","+ Extra €":"+ Extra €","+ Gruppo scelta":"+ Grupo de opciones","+ Ingredienti":"+ Ingredientes","+ Salse/Creme":"+ Salsas/Cremas","</body></html>":"</body></html>","<html><body style=\"font-family:monospace;white-space:pre;font-size:11px\">":"<html><body style=\"font-family:monospace;white-space:pre;font-size:11px\">","⚠️ IP Wi-Fi non rilevato automaticamente. Inserisci l'indirizzo IP del tablet (es. 192.168.1.9) nel campo sotto per generare il QR Code corretto.":"⚠️ IP Wi‑Fi no detectada automáticamente. Introduce la dirección IP de la tableta (p. ej. 192.168.1.9) en el campo de abajo para generar el QR Code correcto.","⚡ Ordine Diretto":"⚡ Pedido directo","✅ Test Dimming":"✅ Prueba de atenuación","✅ Test Risveglio":"✅ Prueba de activación","✅ Test Salvaschermo":"✅ Prueba de salvapantallas","❌ SENZA":"❌ SIN","🍔 Freschezza & Qualità":"🍔 Frescura & Calidad","🍟 Facile & Veloce":"🍟 Fácil & Rápido","🎉 Abbonamento Attivato!":"🎉 ¡Suscripción activada!","📚 Gruppi Extra Globali (":"📚 Grupos Extra Globales (","📝 Note:":"📝 Notas:","🔔 Feedback Acustico":"🔔 Feedback sonoro","🔴 Esaurito":"🔴 Agotado","🟢 Attivo (":"🟢 Activo (","🟢 Disponibile":"🟢 Disponible","1 display cucina KDS in tempo reale":"1 pantalla KDS de cocina en tiempo real","1 postazione Totem touch-screen":"1 estación Totem con pantalla táctil","1. Concessione della Licenza":"1. Concesión de la licencia","1. la stampante sia già associata nelle impostazioni Bluetooth di Android,":"1. que la impresora ya esté emparejada en los ajustes Bluetooth de Android,","1. Raccolta e Trattamento dei Dati":"1. Recopilación y tratamiento de datos","1. Telefono e totem connessi alla stessa rete Wi-Fi":"1. Teléfono y Totem conectados a la misma red Wi‑Fi","10 Tocchi":"10 toques","2 mesi gratuiti inclusi":"2 meses gratis incluidos","2 min":"2 min","2. Apri l'indirizzo sopra nel browser del telefono o scansiona il QR Code":"2. Abra la dirección anterior en el navegador del teléfono o escanee el QR Code","2. Gestione dei Pagamenti":"2. Gestión de pagos","2. i permessi Bluetooth siano concessi,":"2. que se concedan los permisos Bluetooth,","2. Rinnovi e Cancellazioni Abbonamento":"2. Renovaciones y cancelaciones de suscripción","3. Effettua l'accesso inserendo il PIN dell'app (":"3. Inicie sesión introduciendo el PIN de la app (","3. il Bluetooth del telefono sia attivo.":"3. que el Bluetooth del teléfono esté activo.","3. Permessi Hardware":"3. Permisos de hardware","3. Supporto Tecnico e Aggiornamenti":"3. Soporte técnico y actualizaciones","30 sec":"30 sec","4. Titolare del Trattamento":"4. Responsable del tratamiento","5 min":"5 min","5 Tocchi Rapidi":"5 toques rápidos","60 sec":"60 sec","7 Tocchi Rapidi (Consigliato)":"7 Toques rápidos (Recomendado)","Abbassa la luminosità al 10% negli orari di chiusura per preservare il pannello.":"Reduce el brillo al 10% en horario de cierre para preservar el panel.","Abbonamenti Google Play Store":"Suscripciones Google Play Store","Abbonamento Attivo":"Suscripción activa","ABBONAMENTO ATTIVO":"SUSCRIPCIÓN ACTIVA","Abbonamento Google Play":"Suscripción Google Play","Abbonamento registrato:":"Suscripción registrada:","Abbonamento ripristinato:":"Suscripción restaurada:","Accesso Remoto da Smartphone & PC":"Acceso remoto desde Smartphone & PC","Admin Panel":"Admin Panel","Aggiorna lista dispositivi":"Actualizar lista de dispositivos","Aggiornamenti software inclusi":"Actualizaciones de software incluidas","Aggiungi Extra":"Añadir extras","Aggiungi Immagine":"Añadir imagen","Aggiungi opzione":"Añadir opción","Aggiungi sezione":"Añadir sección","Aggiungi sezioni, rinomina, attiva/disattiva e sposta su/giù per decidere l'ordine sul totem.":"Añade secciones, renombra, activa/desactiva y mueve arriba/abajo para decidir el orden en el tótem.","Aggiungi tutti all elenco":"Añadir todo a la lista","Alle ore:":"A las:","Allergeni (separati da virgola)":"Alérgenos (separados por comas)","Angolo Alto a Destra":"Esquina superior derecha","Angolo Alto a Sinistra":"Esquina superior izquierda","Apri nel browser del telefono o inquadra il QR Code:":"Ábrelo en el navegador del teléfono o escanea el QR Code:","Attiva o gestisci l'abbonamento con addebito sicuro tramite Google Play Store. Disdici in qualsiasi momento senza vincoli.":"Activa o gestiona la suscripción con cobro seguro a través de Google Play Store. Cancela en cualquier momento sin compromiso.","Attiva su Google Play":"Activar en Google Play","Auto-print courtesy failed":"Impresión automática de cortesía fallida","Auto-print kitchen failed":"Error en la impresión automática a cocina","Auto-Reset Carrello Abbandonato":"Reinicio automático del carrito abandonado","Avvio Automatico all'Accensione (Auto-Boot)":"Inicio automático al encender (Auto-Boot)","Azzerando la numerazione, il prossimo ordine ripartirà da #1 e tutte le comande attuali verranno cancellate dalla schermata cucina.":"Al reiniciar la numeración, el siguiente pedido empezará en #1 y todos los pedidos actuales se eliminarán de la pantalla de cocina.","Backup / Migrazione":"Copia de seguridad / Migración","Backup creato":"Copia de seguridad creada","Backup e ripristino illimitati":"Copias de seguridad y restauraciones ilimitadas","Backup pronto":"Copia de seguridad lista","Backup salvato":"Copia de seguridad guardada","Banner Promozionale":"Banner promocional","Benvenuto!":"¡Bienvenido!","Blocca il tablet in modalità totem esclusiva. Nasconde la barra di navigazione Android e impedisce l'uscita non autorizzata ai clienti.":"Bloquea la tablet en modo tótem exclusivo. Oculta la barra de navegación de Android e impide que los clientes salgan sin autorización.","Bridge BT non disponibile:":"Puente BT no disponible:","BT print failed, PDF fallback":"Impresión BT fallida, se utiliza PDF","Cambia Immagine":"Cambiar imagen","Carica Logo":"Cargar logo","Caricamento stato licenza e abbonamenti...":"Cargando estado de licencia y suscripciones...","Categoria *":"Categoría *","Categoria aggiornata":"Categoría actualizada","Categoria creata":"Categoría creada","Categoria eliminata":"Categoría eliminada","categorie e":"categorías y","Cerca dispositivi Bluetooth":"Buscar dispositivos Bluetooth","collegati)":"conectados)","Comando di risveglio schermo eseguito con successo.":"Comando de activación de la pantalla ejecutado con éxito.","Compatibile con MPT, Xprinter, Rongta e altre ESC/POS (Bluetooth Classic e BLE). Mostra tutti i dispositivi Bluetooth paired e vicini: scegli la stampante e assegna Scontrino o Cucina.":"Compatible con MPT, Xprinter, Rongta y otras ESC/POS (Bluetooth Classic y BLE). Muestra todos los dispositivos Bluetooth emparejados y cercanos: elige la impresora y asigna Ticket o Cocina.","Compila almeno un campo":"Rellena al menos un campo","Compila tutti i campi obbligatori":"Rellena todos los campos obligatorios","Componi il Tuo Piatto":"Compón tu plato","Conferma Eliminazione":"Confirmar eliminación","Conferma PIN":"Confirmar PIN","Conferma Reset":"Confirmar restablecimiento","Conferma su Google Play":"Confirmar en Google Play","Configura il comportamento del totem quando nessun cliente interagisce con lo schermo.":"Configura el comportamiento del totem cuando ningún cliente interactúa con la pantalla.","Consenti l'accesso alle foto nelle impostazioni Android/FydeOS per aggiungere immagini ai prodotti.":"Permite el acceso a las fotos en los ajustes de Android/FydeOS para añadir imágenes a los productos.","Consenti l'accesso alle foto nelle impostazioni Android/FydeOS per aggiungere immagini alle categorie.":"Permite el acceso a las fotos en los ajustes de Android/FydeOS para añadir imágenes a las categorías.","Contatta direttamente il team di sviluppo per supporto su hardware, stampanti ESC/POS o licenze B2B.":"Contacte directamente con el equipo de desarrollo para soporte sobre hardware, impresoras ESC/POS o licencias B2B.","Credenziali Admin":"Credenciales de administrador","Credenziali aggiornate":"Credenciales actualizadas","Dalle ore:":"Desde las:","Descrizione *":"Descripción *","Descrizione del prodotto":"Descripción del producto","Descrizione della categoria":"Descripción de la categoría","Device management, screen lockdown, screensaver and REST API":"Gestión de dispositivos, bloqueo de pantalla, protector de pantalla y API REST","Dimming Notturno Programmato":"Atenuación nocturna programada","Display Cucina":"Pantalla de cocina","Display Cucina Disabilitato":"Pantalla de cocina desactivada","Dispositivi trovati (":"Dispositivos encontrados (","dispositivi. Aggiungi la stampante all elenco e assegna Scontrino/Cucina.":"dispositivos. Añade la impresora a la lista y asigna Ticket/Cocina.","Elementi (separati da virgola)":"Elementos (separados por comas)","Elenco Stampanti":"Lista de impresoras","Enter your credentials to access management":"Introduce tus credenciales para acceder a la gestión","Error checking product availability:":"Error al comprobar la disponibilidad del producto:","Error creating order:":"Error al crear el pedido:","Error deleting category:":"Error al eliminar la categoría:","Error deleting product:":"Error al eliminar el producto:","Error loading categories:":"Error al cargar las categorías:","Error loading data:":"Error al cargar los datos:","Error loading Kiosk data:":"Error al cargar los datos de Kiosk:","Error loading orders:":"Error al cargar los pedidos:","Error loading products:":"Error al cargar los productos:","Error loading settings:":"Error al cargar la configuración:","Error printing:":"Error al imprimir:","Error saving category:":"Error al guardar la categoría:","Error saving kiosk config:":"Error al guardar la configuración de Kiosk:","Error saving product:":"Error al guardar el producto:","Error saving:":"Error al guardar:","Error updating order:":"Error al actualizar el pedido:","Errore applicazione hardware kiosk:":"Error de aplicación de hardware kiosk:","Errore caricamento dati licenza:":"Error al cargar los datos de la licencia:","Errore di salvataggio:":"Error al guardar:","Errore inizializzazione KioskStore:":"Error al inicializar KioskStore:","Errore lettura configurazione Kiosk:":"Error al leer la configuración de Kiosk:","Errore lettura licenza da storage:":"Error al leer la licencia desde el almacenamiento:","Errore Pagamento":"Error de pago","Errore salvataggio configurazione Kiosk:":"Error al guardar la configuración del Kiosk:","Errore salvataggio prova iniziale:":"Error al guardar la prueba inicial:","Errore scansione":"Error de escaneo","errore sconosciuto":"Error desconocido","Errore stampa":"Error de impresión","Errore Transazione":"Error de transacción","Es: Hamburger Classico":"Ej: Hamburguesa clásica","Es: Maionese, Ketchup":"Ej: Mayonesa, Ketchup","Es: Panini":"Ej: Bocadillos","Es: Patatine":"Ej: Patatas fritas","Es: PIZZERIA DA MARIO":"Ej: PIZZERIA DA MARIO","Es: Pomodoro, Lattuga":"Ej: Tomate, Lechuga","Es. 06:00 → ogni giorno alle 6:00 il contatore ordini riparte da 1":"Ej. 06:00 → cada día a las 06:00 el contador de pedidos vuelve a 1","es. 192.168.1.9":"Ej. 192.168.1.9","es. https://miosito.it oppure lascia vuoto per rete locale":"Ej. https://miosito.it o déjalo vacío para la red local","Esporta backup ZIP":"Exportar copia de seguridad ZIP","Esporta: ti chiede dove salvare il ZIP (scegli Download). Importa: seleziona il file ZIP. Contiene impostazioni, testi e immagini.":"Exportar: te preguntará dónde guardar el ZIP (elige Download). Importar: selecciona el archivo ZIP. Contiene ajustes, textos e imágenes.","export backup":"Exportar copia de seguridad","Extra a pagamento":"Extras de pago","Extra Formaggio:1, Bacon:1.5":"Extra Queso:1, Bacon:1.5","failed on":"falló en","File ZIP salvato nella cartella che hai scelto (":"Archivo ZIP guardado en la carpeta que elegiste (","Gestione Categorie":"Gestión de categorías","Gestione completa per singolo totem con rinnovo mensile.":"Gestión completa para un solo tótem con renovación mensual.","Gestione Ordini":"Gestión de pedidos","Gestione Prodotti":"Gestión de productos","Gestisci lo stato della prova e gli abbonamenti disponibili.":"Administra el estado de la prueba y las suscripciones disponibles.","Gestisci prodotti, categorie, foto, listini e impostazioni dal telefono o PC senza toccare il totem.":"Administra productos, categorías, fotos, listas de precios y ajustes desde el teléfono o PC sin tocar el tótem.","GG)":"GG)","giorni)":"días)","giorni) per questo dispositivo?":"días) para este dispositivo?","Gli abbonamenti digitali in-app sono gestiti integralmente da Google Play Billing. L'applicazione non ha accesso né memorizza carte di credito o coordinate bancarie.":"Las suscripciones digitales in-app están gestionadas íntegramente por Google Play Billing. La aplicación no accede ni almacena tarjetas de crédito ni datos bancarios.","Gli abbonamenti Google Play Store si rinnovano automaticamente. È possibile gestire la cancellazione o la modifica del metodo di pagamento in qualsiasi momento direttamente dal proprio account Google Play.":"Las suscripciones de Google Play Store se renuevan automáticamente. Puedes gestionar la cancelación o cambiar el método de pago en cualquier momento desde tu cuenta de Google Play.","Gli abbonamenti si rinnovano automaticamente tramite il tuo account Google Play a meno che non vengano disdetti almeno 24 ore prima della scadenza. Puoi gestire o annullare l'abbonamento in qualsiasi momento dall'app Google Play &gt; Pagamenti e Abbonamenti.":"Las suscripciones se renuevan automáticamente a través de tu cuenta de Google Play a menos que se cancelen al menos 24 horas antes del vencimiento. Puedes gestionar o cancelar la suscripción en cualquier momento desde la app Google Play &gt; Pagos y suscripciones.","Gli aggiornamenti software correttivi e le nuove funzionalità vengono rilasciati attraverso i canali di distribuzione dell'app.":"Las actualizaciones correctivas de software y las nuevas funciones se publican a través de los canales de distribución de la aplicación.","glutine, lattosio, uova":"gluten, lactosa, huevos","Google Play Store Billing":"Google Play Store Billing","Grazie!":"¡Gracias!","Gruppi Extra Globali":"Grupos de extras globales","Gruppi Opzionali Globali":"Grupos opcionales globales","Gruppo a scelta":"Grupo a elección","Hai bisogno di assistenza o configurazione personalizzata?":"¿Necesitas asistencia o configuración personalizada?","Ho Letto e Accetto":"He leído y acepto","I gruppi selezionati vengono aggiunti automaticamente a questo prodotto al momento dell'ordine.":"Los grupos seleccionados se añaden automáticamente a este producto al realizar el pedido.","I nuovi PIN non coincidono":"Los nuevos PIN no coinciden","Ideale per singola postazione (Pizzerie, Bar, Chioschi)":"Ideal para una sola estación (Pizzerías, Bares, Quioscos)","Il file ZIP è stato creato (":"El archivo ZIP se ha creado (","Il nome del ristorante non puo essere vuoto":"El nombre del restaurante no puede estar vacío","Il nuovo PIN deve essere di 4 cifre":"El nuevo PIN debe tener 4 dígitos","Il più scelto dai piccoli ristoratori (2 mesi gratis)":"El más elegido por los pequeños restauradores (2 meses gratis)","Immagine (opzionale)":"Imagen (opcional)","Impedisce lo spegnimento dello schermo durante il servizio.":"Evita que la pantalla se apague durante el servicio.","import backup":"Importar backup","Import completato":"Importación completada","Import fallito:":"Importación fallida:","Importa backup ZIP":"Importar backup ZIP","Impossibile aggiornare la disponibilità":"No se puede actualizar la disponibilidad","Impossibile aprire la galleria. Controlla i permessi foto.":"No se puede abrir la galería. Comprueba los permisos de fotos.","Impossibile aprire la modifica.":"No se puede abrir la edición.","Impossibile caricare i dati":"No se pueden cargar los datos","Impossibile caricare le categorie":"No se pueden cargar las categorías","Impossibile completare il ripristino:":"No se pudo completar la restauración:","Impossibile creare il backup:":"No se pudo crear la copia de seguridad:","Impossibile eliminare il prodotto":"No se puede eliminar el producto","Impossibile eliminare la categoria":"No se puede eliminar la categoría","Impossibile leggere l'immagine selezionata":"No se puede leer la imagen seleccionada","Impossibile recuperare i dispositivi Bluetooth. Controlla i permessi.":"No se pueden recuperar los dispositivos Bluetooth. Comprueba los permisos.","Impossibile rilevare l'IP in automatico. Inserisci l'indirizzo IP visibile nelle impostazioni Wi-Fi del tablet (es. 192.168.1.9).":"No se puede detectar la IP automáticamente. Introduce la dirección IP que aparece en los ajustes Wi-Fi de la tablet (p. ej. 192.168.1.9).","Impossibile salvare il gruppo":"No se puede guardar el grupo","Impossibile salvare il prodotto":"No se puede guardar el producto","Impossibile salvare la categoria":"No se puede guardar la categoría","Impossibile salvare le credenziali":"No se pueden guardar las credenciales","Impossibile salvare le impostazioni":"No se pueden guardar los ajustes","Imposta la sequenza di tocchi segreta per aprire il pannello di amministrazione e il PIN di protezione.":"Configura la secuencia de toques secreta para abrir el panel de administración y el PIN de protección.","Impostazioni salvate correttamente":"Ajustes guardados correctamente","In Alto Centrale":"Centro superior","In Attesa":"En espera","In Preparazione":"En preparación","Indirizzo IP Totem (Wi-Fi Locale)":"Dirección IP del Totem (Wi‑Fi local)","Indirizzo IP Wi-Fi trovato:":"Dirección IP Wi‑Fi encontrada:","Info Rilevamento":"Información de detección","Informativa Privacy (GDPR)":"Política de privacidad (GDPR)","Informativa sulla Privacy (GDPR)":"Política de privacidad (GDPR)","Informazioni Ristorante":"Información del restaurante","Ingredienti (separati da virgola)":"Ingredientes (separados por comas)","Ingredienti base":"Ingredientes básicos","Ingredienti Base":"Ingredientes Básicos","Inserisci il nome o titolo del gruppo":"Introduce el nombre o título del grupo","Interactive Totem Guide":"Guía interactiva del Totem","Invalid credentials. Use admin / admin123":"Credenciales inválidas. Usa admin / admin123","Invia la tua comanda in cucina e ricevi il tuo scontrino con numero.":"Envía tu pedido a cocina y recibe tu ticket con número.","IP detect error:":"Error al detectar IP:","IP Kiosk LAN:":"IP Kiosk LAN:","IP Rilevato":"IP detectada","IP Totem:":"IP del Totem:","KB) su Drive, USB o inviarlo.":"KB) en Drive, USB o enviarlo.","KB), ma su questo dispositivo non c'è un'app per salvarlo/condividerlo. Riprova e, quando richiesto, scegli la cartella Download.":"KB), pero en este dispositivo no hay una app para guardarlo/compartirlo. Inténtalo de nuevo y, cuando se solicite, elige la carpeta Download.","KB). Contiene impostazioni, testi e immagini. Copia quel file sull'altro tablet e usa Importa backup ZIP.":"KB). Contiene ajustes, textos e imágenes. Copia ese archivo en la otra tablet y usa Importa backup ZIP.","Ketchup, Maionese, Crema tartufo...":"Ketchup, Mayonesa, Crema de trufa...","Kiosk Control & Hardware":"Control Kiosk y Hardware","Kiosk Hardware ID:":"ID hardware del Kiosk:","L'app richiede l'accesso alla rete locale (WiFi) per consentire il collegamento con il display cucina KDS e il pannello remoto amministrativo, e l'accesso al Bluetooth per la connessione alle stampanti termiche ESC/POS.":"La app requiere acceso a la red local (Wi‑Fi) para permitir la conexión con la pantalla de cocina KDS y el panel administrativo remoto, y acceso al Bluetooth para la conexión a impresoras térmicas ESC/POS.","L'attivazione di Totem QuickBite conferisce una licenza d'uso per singolo terminale Kiosk touch-screen.":"La activación de Totem QuickBite concede una licencia de uso para un único terminal Kiosk con pantalla táctil.","La scansione Bluetooth funziona solo su Android.":"La exploración Bluetooth funciona solo en Android.","Le categorie vengono ordinate per indice crescente. 0 = prima categoria.":"Las categorías se ordenan por índice creciente. 0 = primera categoría.","Le stampe per la cucina continuano a funzionare normalmente.":"Las impresiones para cocina continúan funcionando normalmente.","Licenza e Abbonamenti":"Licencia y suscripciones","Lista Extra (€)":"Lista Extras (€)","Loading Kiosk & Hardware Settings...":"Cargando ajustes Kiosk & Hardware...","Local server boot error:":"Error de arranque del servidor local:","Logo Ristorante":"Logo del restaurante","Luminosità & Controllo Display":"Brillo y control de pantalla","Luminosità impostata al 10% (risparmio energetico). Tocca lo schermo per ripristinare.":"Brillo ajustado al 10% (ahorro de energía). Toca la pantalla para restaurar.","Luminosità Schermo (":"Brillo de pantalla (","MAC es. 00:11:22:33:44:55 o nome":"MAC ej. 00:11:22:33:44:55 o nombre","mailto:priologiovanni82@gmail.com?subject=Supporto%20Guida%20Totem%20QuickBite":"mailto:priologiovanni82@gmail.com?subject=Supporto%20Guida%20Totem%20QuickBite","Memoria Libera:":"Memoria libre:","Metodo Pagamento:":"Método de pago:","Min selezioni / Max selezioni":"Mín selecciones / Máx selecciones","Modalità Kiosk & Blocco Schermo":"Modo Kiosk y bloqueo de pantalla","Modifica Categoria":"Editar categoría","Modifica Gruppo":"Editar grupo","Modifica Prodotto":"Editar producto","Modulo stampante non disponibile":"Módulo de impresora no disponible","N°":"N.º","Nessun abbonamento attivo rilevato su questo dispositivo.":"No se detectó ninguna suscripción activa en este dispositivo.","Nessun Abbonamento Trovato":"No se encontró suscripción","Nessun argomento trovato per la ricerca \"":"No se encontró ningún tema para la búsqueda \"","Nessun dispositivo Bluetooth":"Ningún dispositivo Bluetooth","Nessun dispositivo in modalita web.":"Ningún dispositivo en modo web.","Nessun dispositivo trovato. Accendi e abbina la stampante in Impostazioni Android Bluetooth, concedi i permessi, poi aggiorna la lista. Oppure inserisci il MAC manualmente.":"No se encontró ningún dispositivo. Enciende y empareja la impresora en Ajustes Bluetooth de Android, concede los permisos y luego actualiza la lista. O introduce la MAC manualmente.","Nessun dispositivo. Abbina prima la stampante nelle impostazioni Bluetooth di sistema, poi riprova.":"Ningún dispositivo. Empareja primero la impresora en los ajustes Bluetooth del sistema y luego vuelve a intentarlo.","Nessun gruppo globale configurato. Creane uno nella scheda \"Gruppi\" per collegarlo rapidamente qui.":"Ningún grupo global configurado. Crea uno en la pestaña \"Grupos\" para vincularlo aquí rápidamente.","Nessun gruppo globale configurato. Creane uno nella sezione Gruppi.":"Ningún grupo global configurado. Crea uno en la sección Grupos.","Nessun ordine":"Sin pedidos","Nessuna immagine selezionata":"Ninguna imagen seleccionada","Nessuna stampante configurata":"Ninguna impresora configurada","Nessuna stampante trovata. Verifica che:":"No se encontró ninguna impresora. Verifica que:","Nessuna stampante. Aggiungine una dalla lista o inserisci il MAC.":"Ninguna impresora. Añade una desde la lista o introduce la MAC.","Nome *":"Nombre *","Nome del Ristorante":"Nombre del restaurante","Nome Interno (es: Salse Panini)":"Nombre interno (p. ej.: Salse Panini)","Nome opzione":"Nombre de la opción","Nome sezione (es: Creme, Salse, Extra...)":"Nombre de sección (p. ej.: Creme, Salse, Extra...)","Non disponibile":"No disponible","Note Legali & Conformità Google Play Store":"Notas legales & cumplimiento de Google Play Store","Numero di tocchi segreti:":"Número de toques secretos:","Numero Ordini":"Número de pedidos","Nuova Categoria":"Nueva categoría","Nuova password":"Nueva contraseña","Nuovo Gruppo":"Nuevo grupo","Nuovo PIN":"Nuevo PIN","Nuovo Prodotto":"Nuevo producto","Nuovo username":"Nuevo nombre de usuario","Offline: admin / admin123 (or PIN 1234)":"Sin conexión: admin / admin123 (o PIN 1234)","Ogni modifica effettuata da remoto si sincronizza automaticamente con il totem.":"Cualquier modificación realizada de forma remota se sincroniza automáticamente con el totem.","Operazione annullata.":"Operación cancelada.","Opzioni (nome + sovrapprezzo €)":"Opciones (nombre + recargo €)","Orario reset giornaliero (HH:mm)":"Hora de reinicio diario (HH:mm)","Ordine a voce":"Pedido por voz","ORDINE A VOCE":"PEDIDO POR VOZ","Ordine a voce - cliente ordinerà in cassa":"Pedido por voz - el cliente pedirá en caja","Ordine visualizzazione":"Visualización del pedido","Ordini e comande illimitati":"Pedidos y comandas ilimitados","Orologio Digitale":"Reloj digital","Paga in cassa al ritiro":"Paga en caja al recoger","Paired printers error:":"Error impresoras emparejadas:","Pane, Carne, Lattuga, Pomodoro":"Pan, Carne, Lechuga, Tomate","Pannello amministrativo remoto in rete locale":"Panel administrativo remoto en red local","Password attuale":"Contraseña actual","Password attuale non corretta":"La contraseña actual no es correcta","Per abilitarlo, vai su Impostazioni e attiva l'opzione \"Display Cucina\".":"Para habilitarlo, ve a Ajustes y activa la opción \"Display Cucina\".","Per qualsiasi informazione sulla gestione dei dati, contatta Totem QuickBite attraverso i canali di assistenza ufficiali.":"Para cualquier información sobre la gestión de datos, contacta a Totem QuickBite a través de los canales de asistencia oficiales.","PERIODO PROVA SCADUTO":"Periodo de prueba caducado","Permessi Bluetooth negati":"Permisos Bluetooth denegados","Permesso negato":"Permiso denegado","Permette il controllo remoto e la telemetria via rete locale LAN (compatibile con Home Assistant e pannello web).":"Permite el control remoto y la telemetría a través de la LAN local (compatible con Home Assistant y panel web).","Personalizza ingredienti, salse, opzioni ed extra come preferisci.":"Personaliza ingredientes, salsas, opciones y extras como prefieras.","Personalizzazioni sul totem":"Personalizaciones en el totem","Piano Base Annuale":"Plan básico anual","Piano Base Totem":"Plan básico Totem","Piano Configurato:":"Plan configurado:","Piano di abbonamento non disponibile.":"Plan de suscripción no disponible.","pickImage category error":"pickImage category error","pickImage product error":"pickImage product error","PIN attuale":"PIN actual","PIN attuale / nuovo / conferma":"PIN actual / nuevo / confirmar","PIN attuale non corretto":"PIN actual incorrecto","PIN errato. Predefinito: 0000 o 1234":"PIN erróneo. Predeterminado: 0000 o 1234","Please enter username and password":"Por favor ingrese usuario y contraseña","Porta standard 8000 / microserver Python locale.":"Puerto predeterminado 8000 / microservidor Python local.","Posizione del Trigger Segreto:":"Ubicación del disparador secreto:","Premi Cerca o Aggiorna lista. Vedrai cuffie, speaker e stampanti: aggiungi solo la stampante.":"Pulsa Buscar o Actualizar lista. Verás auriculares, altavoces e impresoras: añade solo la impresora.","Presentati al banco":"Preséntate en el mostrador","Prezzo (€) *":"Precio (€) *","prodotti (con immagini). Se qualcosa non si aggiorna, chiudi e riapri l'app.":"productos (con imágenes). Si algo no se actualiza, cierra y vuelve a abrir la app.","Prodotti Esauriti":"Productos agotados","Prodotto aggiornato":"Producto actualizado","Prodotto creato":"Producto creado","Prodotto eliminato":"Producto eliminado","Prodotto Esaurito":"Producto agotado","Prodotto non trovato nel menu.":"Producto no encontrado en el menú.","Prova gratuita (":"Prueba gratuita (","PROVA GRATUITA (":"PRUEBA GRATUITA (","Questo articolo è attualmente esaurito e non può essere modificato.":"Este artículo está actualmente agotado y no se puede modificar.","Reset error:":"Error de restablecimiento:","Reset Eseguito":"Restablecimiento realizado","Reset Numerazione e Comande?":"¿Restablecer numeración y pedidos?","Reset Numero Ora":"Restablecer número ahora","Reset Prova":"Restablecer prueba","REST API Locale Attiva":"REST API local activa","rgba(0,0,0,0.5)":"rgba(0,0,0,0.5)","rgba(0,0,0,0.7)":"rgba(0,0,0,0.7)","rgba(0,0,0,0.85)":"rgba(0,0,0,0.85)","rgba(0,0,0,0.92)":"rgba(0,0,0,0.92)","rgba(15, 23, 42, 0.6)":"rgba(15, 23, 42, 0.6)","rgba(15, 23, 42, 0.65)":"rgba(15, 23, 42, 0.65)","rgba(255, 107, 107, 0.1)":"rgba(255, 107, 107, 0.1)","rgba(255, 107, 107, 0.15)":"rgba(255, 107, 107, 0.15)","rgba(255, 107, 107, 0.2)":"rgba(255, 107, 107, 0.2)","rgba(255, 107, 107, 0.3)":"rgba(255, 107, 107, 0.3)","rgba(255, 255, 255, 0.12)":"rgba(255, 255, 255, 0.12)","rgba(255, 255, 255, 0.18)":"rgba(255, 255, 255, 0.18)","rgba(255,255,255,0.12)":"rgba(255,255,255,0.12)","rgba(255,255,255,0.2)":"rgba(255,255,255,0.2)","rgba(255,255,255,0.9)":"rgba(255,255,255,0.9)","rgba(56, 189, 248, 0.15)":"rgba(56, 189, 248, 0.15)","Riapre l'app totem immediatamente dopo il riavvio del tablet.":"Vuelve a abrir la app del tótem inmediatamente después de reiniciar la tablet.","Rileva IP":"Detectar IP","Ripristina Abbonamento Google Play":"Restaurar suscripción de Google Play","Ripristina Prova":"Restaurar prueba","Ripristino Completato":"Restauración completada","RISPARMIA 2 MESI":"AHORRA 2 MESES","Risparmio Energetico (Dimmed)":"Ahorro de energía (Atenuado)","Ritiro al Banco Senza Attese":"Recogida en mostrador — sin esperas","Salse gratuite":"Salsas gratis","Salva Credenziali":"Guardar credenciales","Salva Impostazioni":"Guardar ajustes","Salvaschermo & Reset Inattività":"Salvapantallas y reinicio por inactividad","Salvaschermo avviato. Tocca lo schermo per uscire.":"Salvapantallas activado. Toca la pantalla para salir.","Scadenza / Prossimo Rinnovo:":"Vencimiento / Próxima renovación:","Scan error:":"Error de escaneo:","scan failed":"escaneo fallido","Scansione completata":"Escaneo completado","Scelta obbligatoria":"Selección obligatoria","Schermo Nero":"Pantalla negra","Schermo Sempre Acceso (Keep Awake)":"Pantalla siempre encendida (Keep Awake)","Scontrino Cortesia":"Ticket de cortesía","SCONTRINO CORTESIA":"Recibo de cortesía","Scrivi al Supporto":"Contactar con el soporte","Segnale acustico e vibrazione hardware eseguiti.":"Pitido y vibración del hardware activados.","Seleziona i gruppi globali (salse, ingredienti, extra o scelte) da collegare a questo prodotto.":"Seleccione los grupos globales (salsas, ingredientes, extras o elecciones) para vincularlos a este producto.","Sicurezza & Gesture di Sblocco":"Seguridad y gestos de desbloqueo","Solo circa 7,40 € al mese con fatturazione annuale.":"Solo aproximadamente 7,40 € al mes con facturación anual.","Stampa Automatica":"Impresión automática","Stampa scontrini termici ESC/POS":"Imprimir recibos térmicos (ESC/POS)","Stampanti Bluetooth":"Impresoras Bluetooth","Stato Attivazione Dispositivo":"Estado de activación del dispositivo","Stato Kiosk:":"Estado del kiosco:","Stato licenza reimpostato a periodo di prova.":"Estado de la licencia restablecido a periodo de prueba.","Stato Schermo:":"Estado de pantalla:","Step-by-step instructions for hardware configuration, orders, and restaurant management":"Instrucciones paso a paso para la configuración de hardware, pedidos y gestión del restaurante","Svuota il carrello e torna alla home se il cliente si allontana prima di pagare.":"Vacía el carrito y vuelve al inicio si el cliente se aleja antes de pagar.","Tempo attesa reset carrello:":"Tiempo de espera para reinicio del carrito:","Termini di Servizio (EULA)":"Términos de servicio (EULA)","Termini di Servizio & Licenza d'Uso":"Términos de servicio y licencia de uso","Test Dimming (10%)":"Prueba de atenuación (10%)","Test Feedback Beep":"Prueba de pitido de retroalimentación","Test Risveglio (Wake)":"Prueba de activación (Wake)","Test Salvaschermo":"Prueba del salvapantallas","Test Strumenti & Comandi Hardware:":"Prueba de herramientas y comandos de hardware:","thermal driver import missing":"Falta la importación del controlador térmico","Ticket Cucina":"Ticket de cocina","Timeout Inattività:":"Tiempo de inactividad:","Tipo di Salvaschermo:":"Tipo de salvapantallas:","Tipo Sezione":"Tipo de sección","Tipo: extra a pagamento":"Tipo: extra de pago","Tipo: gruppo a scelta (min/max + prezzo)":"Tipo: grupo de elección (mín/máx + precio)","Tipo: ingredienti da togliere":"Tipo: ingredientes para quitar","Tipo: scelte gratuite (salse/creme...)":"Tipo: opciones gratuitas (salsas/cremas...)","Titolo per cliente (es: Scegli salse)":"Título para el cliente (p. ej.: Elige salsas)","TOCCA LO SCHERMO PER ORDINARE":"TOCA LA PANTALLA PARA PEDIR","Tocca lo schermo per riattivare":"Toca la pantalla para reactivar","Tocca lo schermo per scoprire il nostro menu e ordinare subito.":"Toca la pantalla para descubrir nuestro menú y pedir ahora.","Tocca per iniziare ad ordinare":"Toca para empezar a pedir","Totale: €":"Total: €","Totem in Standby":"Totem en standby","Totem Kiosk REST API & Telemetria LAN":"Totem Kiosk REST API y Telemetría LAN","Totem Operating Guide & Manual":"Guía de funcionamiento y manual Totem","Totem QuickBite · Versione build v1.2.10":"Totem QuickBite · Versión build v1.2.10","TOTEM RISTORANTE":"TOTEM RESTAURANTE","Totem Self-Service":"Totem Autoservicio","Tutte le funzionalità del Piano Base":"Todas las funcionalidades del Plan Básico","Tutti i marchi citati appartengono ai rispettivi proprietari. L'applicazione non condivide dati sensibili di pagamento con terze parti non autorizzate. Gli abbonamenti in-app sono elaborati direttamente dai server sicuri di Google Play Billing.":"Todas las marcas mencionadas pertenecen a sus respectivos propietarios. La aplicación no comparte datos sensibles de pago con terceros no autorizados. Las suscripciones in-app se procesan directamente en los servidores seguros de Google Play Billing.","Ultimo reset:":"Último reinicio:","Uno o più articoli nel tuo carrello non sono più disponibili. Rimuovili per poter procedere.":"Uno o más artículos en tu carrito ya no están disponibles. Elimínalos para poder continuar.","URL Server Personalizzato (Opzionale per Cloud / Dominio)":"URL del servidor personalizado (opcional para Cloud / dominio)","Usa il menu di condivisione per salvare il ZIP (":"Usa el menú de compartir para guardar el ZIP (","Username / Password":"Nombre de usuario / Contraseña","Username attuale":"Nombre de usuario actual","Username attuale non corretto":"Nombre de usuario actual incorrecto","Username e password nuovi obbligatori":"Se requieren nombre de usuario y contraseña nuevos","Versione Sistema:":"Versión del sistema:","Vuoi attivare il \"":"¿Desea activar el \\\"","Vuoi eliminare":"¿Desea eliminar","Vuoi eliminare \"":"¿Desea eliminar \\\"","Vuoi eliminare la categoria \"":"¿Desea eliminar la categoría \\\"","Vuoi ripristinare il periodo di prova (":"¿Desea restablecer el periodo de prueba (","ZIP non valido":"ZIP no válido"},"de":{"- Senza":"- Ohne",", Max":", Max",";base64,":";base64,","\" a":"\" a","\"? Tutti i prodotti associati rimarranno ma non saranno più visibili.":"\"? Alle zugehörigen Produkte bleiben erhalten, sind aber nicht mehr sichtbar.","(copia)":"(kopieren)","(Senza nome)":"(Unbenannt)",") con addebito sul tuo account Google Play Store?":") mit Belastung auf deinem Google Play Store-Konto?",") error:":") Fehler:","[print] attempt":"[print] Versuch","[print] logo nodes failed":"[print] Logo-Knoten fehlgeschlagen","[printer] getStoredPrinterAddress(":"[printer] getStoredPrinterAddress(","[printer] getStoredPrinterConfig error:":"[printer] getStoredPrinterConfig Fehler:","[printer] savePrinterAddress(":"[printer] savePrinterAddress(","[printer] savePrinterConfig error:":"[printer] savePrinterConfig Fehler:","[printer][perms] Android >=31 requestMultiple results:":"[printer][perms] Android >=31 requestMultiple Ergebnisse:","[printer][perms] Checking Bluetooth permissions...":"[printer][perms] Überprüfe Bluetooth-Berechtigungen...","[printer][perms] Exception requesting Bluetooth permissions:":"[printer][perms] Ausnahme beim Anfordern der Bluetooth-Berechtigungen:","[printer][scan] Calling TP.scan()...":"[printer][scan] Aufruf von TP.scan()...","[printer][scan] Devices breakdown:":"[printer][scan] Aufschlüsselung der Geräte:","[printer][scan] Entering Android/Native Bluetooth branch":"[printer][scan] Wechsel zum Android/Native Bluetooth-Zweig","[printer][scan] Entering Web bridge branch via backend /api/admin/bt/printers":"[printer][scan] Wechsel zum Web-Bridge-Zweig über Backend /api/admin/bt/printers","[printer][scan] Final resolved printers list:":"[printer][scan] Endgültige aufgelöste Druckerliste:","[printer][scan] getTP() returned null (thermal printer driver module not available)":"[printer][scan] getTP() gab null zurück (Thermodrucker-Treibermodul nicht verfügbar)","[printer][scan] Starting getPairedPrinters...":"[printer][scan] Starte getPairedPrinters...","[printer][scan] TP.scan() failed, trying alternative methods:":"[printer][scan] TP.scan() fehlgeschlagen, versuche alternative Methoden:","[printer][scan] TP.scan() raw result:":"[printer][scan] TP.scan() rohes Ergebnis:","[printer][scan] Web bridge returned printers:":"[printer][scan] Web bridge hat die Drucker zurückgegeben:","*** CUCINA ***":"*** KÜCHE ***","/ anno":"/ Jahr","/ mese":"/ Monat","+ Aggiungi extra":"+ Extra hinzufügen","+ Aggiungi opzione":"+ Option hinzufügen","+ Extra €":"+ Extra €","+ Gruppo scelta":"+ Auswahlgruppe","+ Ingredienti":"+ Zutaten","+ Salse/Creme":"+ Saucen/Creme","</body></html>":"</body></html>","<html><body style=\"font-family:monospace;white-space:pre;font-size:11px\">":"<html><body style=\"font-family:monospace;white-space:pre;font-size:11px\">","⚠️ IP Wi-Fi non rilevato automaticamente. Inserisci l'indirizzo IP del tablet (es. 192.168.1.9) nel campo sotto per generare il QR Code corretto.":"⚠️ Wi‑Fi-IP wurde nicht automatisch erkannt. Gib die IP-Adresse des Tablets (z. B. 192.168.1.9) im Feld unten ein, um den korrekten QR-Code zu erzeugen.","⚡ Ordine Diretto":"⚡ Direktbestellung","✅ Test Dimming":"✅ Dimming-Test","✅ Test Risveglio":"✅ Aufweck-Test","✅ Test Salvaschermo":"✅ Bildschirmschoner-Test","❌ SENZA":"❌ OHNE","🍔 Freschezza & Qualità":"🍔 Frische & Qualität","🍟 Facile & Veloce":"🍟 Einfach & Schnell","🎉 Abbonamento Attivato!":"🎉 Abonnement aktiviert!","📚 Gruppi Extra Globali (":"📚 Globale Extra-Gruppen (","📝 Note:":"📝 Notizen:","🔔 Feedback Acustico":"🔔 Akustisches Feedback","🔴 Esaurito":"🔴 Ausverkauft","🟢 Attivo (":"🟢 Aktiv (","🟢 Disponibile":"🟢 Verfügbar","1 display cucina KDS in tempo reale":"1 KDS-Küchendisplay in Echtzeit","1 postazione Totem touch-screen":"1 Totem Touchscreen-Station","1. Concessione della Licenza":"1. Lizenzgewährung","1. la stampante sia già associata nelle impostazioni Bluetooth di Android,":"1. dass der Drucker bereits in den Bluetooth-Einstellungen von Android gekoppelt ist,","1. Raccolta e Trattamento dei Dati":"1. Erhebung und Verarbeitung von Daten","1. Telefono e totem connessi alla stessa rete Wi-Fi":"1. Telefon und Totem mit demselben Wi‑Fi-Netz verbunden","10 Tocchi":"10 Berührungen","2 mesi gratuiti inclusi":"2 Monate gratis inklusive","2 min":"2 min","2. Apri l'indirizzo sopra nel browser del telefono o scansiona il QR Code":"2. Öffnen Sie die obenstehende Adresse im Browser des Telefons oder scannen Sie den QR-Code","2. Gestione dei Pagamenti":"2. Zahlungsabwicklung","2. i permessi Bluetooth siano concessi,":"2. dass die Bluetooth-Berechtigungen erteilt sind,","2. Rinnovi e Cancellazioni Abbonamento":"2. Abonnementserneuerungen und -kündigungen","3. Effettua l'accesso inserendo il PIN dell'app (":"3. Melden Sie sich an, indem Sie die App‑PIN eingeben (","3. il Bluetooth del telefono sia attivo.":"3. dass das Bluetooth des Telefons aktiviert ist.","3. Permessi Hardware":"3. Hardware-Berechtigungen","3. Supporto Tecnico e Aggiornamenti":"3. Technischer Support und Updates","30 sec":"30 sec","4. Titolare del Trattamento":"4. Verantwortlicher für die Verarbeitung","5 min":"5 min","5 Tocchi Rapidi":"5 schnelle Berührungen","60 sec":"60 sec","7 Tocchi Rapidi (Consigliato)":"7 Kurze Taps (Empfohlen)","Abbassa la luminosità al 10% negli orari di chiusura per preservare il pannello.":"Reduziere die Helligkeit auf 10 % während der Schließzeiten, um das Display zu schonen.","Abbonamenti Google Play Store":"Google Play Store Abonnements","Abbonamento Attivo":"Aktives Abonnement","ABBONAMENTO ATTIVO":"ABONNEMENT AKTIV","Abbonamento Google Play":"Google Play Abonnement","Abbonamento registrato:":"Abonnement registriert:","Abbonamento ripristinato:":"Abonnement wiederhergestellt:","Accesso Remoto da Smartphone & PC":"Fernzugriff von Smartphone & PC","Admin Panel":"Admin Panel","Aggiorna lista dispositivi":"Geräteliste aktualisieren","Aggiornamenti software inclusi":"Software‑Updates inklusive","Aggiungi Extra":"Extras hinzufügen","Aggiungi Immagine":"Bild hinzufügen","Aggiungi opzione":"Option hinzufügen","Aggiungi sezione":"Abschnitt hinzufügen","Aggiungi sezioni, rinomina, attiva/disattiva e sposta su/giù per decidere l'ordine sul totem.":"Abschnitte hinzufügen, umbenennen, aktivieren/deaktivieren und nach oben/unten verschieben, um die Reihenfolge am Kiosk festzulegen.","Aggiungi tutti all elenco":"Alle zur Liste hinzufügen","Alle ore:":"Um:","Allergeni (separati da virgola)":"Allergene (durch Komma getrennt)","Angolo Alto a Destra":"Obere rechte Ecke","Angolo Alto a Sinistra":"Obere linke Ecke","Apri nel browser del telefono o inquadra il QR Code:":"Im Browser des Telefons öffnen oder den QR Code scannen:","Attiva o gestisci l'abbonamento con addebito sicuro tramite Google Play Store. Disdici in qualsiasi momento senza vincoli.":"Aktiviere oder verwalte das Abonnement mit sicherer Abrechnung über Google Play Store. Kündige jederzeit ohne Verpflichtungen.","Attiva su Google Play":"Auf Google Play aktivieren","Auto-print courtesy failed":"Automatischer Kulanzdruck fehlgeschlagen","Auto-print kitchen failed":"Automatischer Küchendruck fehlgeschlagen","Auto-Reset Carrello Abbandonato":"Automatischer Reset des verlassenen Warenkorbs","Avvio Automatico all'Accensione (Auto-Boot)":"Automatischer Start beim Einschalten (Auto-Boot)","Azzerando la numerazione, il prossimo ordine ripartirà da #1 e tutte le comande attuali verranno cancellate dalla schermata cucina.":"Wenn die Nummerierung zurückgesetzt wird, beginnt die nächste Bestellung wieder bei #1 und alle aktuellen Bestellungen werden vom Küchenbildschirm gelöscht.","Backup / Migrazione":"Backup / Migration","Backup creato":"Backup erstellt","Backup e ripristino illimitati":"Unbegrenzte Backups und Wiederherstellungen","Backup pronto":"Backup bereit","Backup salvato":"Backup gespeichert","Banner Promozionale":"Werbebanner","Benvenuto!":"Willkommen!","Blocca il tablet in modalità totem esclusiva. Nasconde la barra di navigazione Android e impedisce l'uscita non autorizzata ai clienti.":"Sperrt das Tablet im exklusiven Totem-Modus. Versteckt die Android-Navigationsleiste und verhindert unbefugtes Verlassen durch Kunden.","Bridge BT non disponibile:":"BT-Bridge nicht verfügbar:","BT print failed, PDF fallback":"BT-Druck fehlgeschlagen, Rückfall auf PDF","Cambia Immagine":"Bild ändern","Carica Logo":"Logo hochladen","Caricamento stato licenza e abbonamenti...":"Lade Lizenz- und Abonnementstatus...","Categoria *":"Kategorie *","Categoria aggiornata":"Kategorie aktualisiert","Categoria creata":"Kategorie erstellt","Categoria eliminata":"Kategorie gelöscht","categorie e":"kategorien und","Cerca dispositivi Bluetooth":"Nach Bluetooth-Geräten suchen","collegati)":"verbunden)","Comando di risveglio schermo eseguito con successo.":"Befehl zum Aufwecken des Bildschirms erfolgreich ausgeführt.","Compatibile con MPT, Xprinter, Rongta e altre ESC/POS (Bluetooth Classic e BLE). Mostra tutti i dispositivi Bluetooth paired e vicini: scegli la stampante e assegna Scontrino o Cucina.":"Kompatibel mit MPT, Xprinter, Rongta und anderen ESC/POS (Bluetooth Classic und BLE). Zeigt alle gepaarten und in der Nähe befindlichen Bluetooth-Geräte: Drucker auswählen und Beleg oder Küche zuweisen.","Compila almeno un campo":"Fülle mindestens ein Feld aus","Compila tutti i campi obbligatori":"Füllen Sie alle Pflichtfelder aus","Componi il Tuo Piatto":"Stelle dein Gericht zusammen","Conferma Eliminazione":"Löschung bestätigen","Conferma PIN":"PIN bestätigen","Conferma Reset":"Zurücksetzen bestätigen","Conferma su Google Play":"Auf Google Play bestätigen","Configura il comportamento del totem quando nessun cliente interagisce con lo schermo.":"Konfigurieren Sie das Verhalten des totems, wenn kein Kunde mit dem Bildschirm interagiert.","Consenti l'accesso alle foto nelle impostazioni Android/FydeOS per aggiungere immagini ai prodotti.":"Erlaube den Zugriff auf Fotos in den Android/FydeOS-Einstellungen, um Produktbilder hinzuzufügen.","Consenti l'accesso alle foto nelle impostazioni Android/FydeOS per aggiungere immagini alle categorie.":"Erlaube den Zugriff auf Fotos in den Android/FydeOS-Einstellungen, um Bilder zu Kategorien hinzuzufügen.","Contatta direttamente il team di sviluppo per supporto su hardware, stampanti ESC/POS o licenze B2B.":"Kontaktieren Sie direkt das Entwicklungsteam für Unterstützung bei Hardware, ESC/POS-Druckern oder B2B-Lizenzen.","Credenziali Admin":"Admin-Zugangsdaten","Credenziali aggiornate":"Zugangsdaten aktualisiert","Dalle ore:":"Ab:","Descrizione *":"Beschreibung *","Descrizione del prodotto":"Produktbeschreibung","Descrizione della categoria":"Kategoriebeschreibung","Device management, screen lockdown, screensaver and REST API":"Geräteverwaltung, Bildschirm-Sperre, Bildschirmschoner und REST-API","Dimming Notturno Programmato":"Geplante nächtliche Dimmung","Display Cucina":"Küchendisplay","Display Cucina Disabilitato":"Küchendisplay deaktiviert","Dispositivi trovati (":"Gefundene Geräte (","dispositivi. Aggiungi la stampante all elenco e assegna Scontrino/Cucina.":"Geräte. Fügen Sie den Drucker zur Liste hinzu und weisen Sie Bon/Küche zu.","Elementi (separati da virgola)":"Elemente (durch Kommas getrennt)","Elenco Stampanti":"Druckerliste","Enter your credentials to access management":"Geben Sie Ihre Zugangsdaten ein, um auf die Verwaltung zuzugreifen","Error checking product availability:":"Fehler beim Überprüfen der Produktverfügbarkeit:","Error creating order:":"Fehler beim Erstellen der Bestellung:","Error deleting category:":"Fehler beim Löschen der Kategorie:","Error deleting product:":"Fehler beim Löschen des Produkts:","Error loading categories:":"Fehler beim Laden der Kategorien:","Error loading data:":"Fehler beim Laden der Daten:","Error loading Kiosk data:":"Fehler beim Laden der Kiosk-Daten:","Error loading orders:":"Fehler beim Laden der Bestellungen:","Error loading products:":"Fehler beim Laden der Produkte:","Error loading settings:":"Fehler beim Laden der Einstellungen:","Error printing:":"Fehler beim Drucken:","Error saving category:":"Fehler beim Speichern der Kategorie:","Error saving kiosk config:":"Fehler beim Speichern der Kiosk-Konfiguration:","Error saving product:":"Fehler beim Speichern des Produkts:","Error saving:":"Fehler beim Speichern:","Error updating order:":"Fehler beim Aktualisieren der Bestellung:","Errore applicazione hardware kiosk:":"Fehler der kiosk-Hardwareanwendung:","Errore caricamento dati licenza:":"Fehler beim Laden der Lizenzdaten:","Errore di salvataggio:":"Fehler beim Speichern:","Errore inizializzazione KioskStore:":"Fehler bei der Initialisierung von KioskStore:","Errore lettura configurazione Kiosk:":"Fehler beim Lesen der Kiosk-Konfiguration:","Errore lettura licenza da storage:":"Fehler beim Lesen der Lizenz aus dem Speicher:","Errore Pagamento":"Zahlungsfehler","Errore salvataggio configurazione Kiosk:":"Fehler beim Speichern der Kiosk-Konfiguration:","Errore salvataggio prova iniziale:":"Fehler beim Speichern des Initialtests:","Errore scansione":"Fehler beim Scannen","errore sconosciuto":"Unbekannter Fehler","Errore stampa":"Druckfehler","Errore Transazione":"Transaktionsfehler","Es: Hamburger Classico":"Bsp.: Klassischer Hamburger","Es: Maionese, Ketchup":"Bsp.: Mayonnaise, Ketchup","Es: Panini":"Bsp.: Sandwiches","Es: Patatine":"Bsp.: Pommes","Es: PIZZERIA DA MARIO":"Bsp.: PIZZERIA DA MARIO","Es: Pomodoro, Lattuga":"Bsp.: Tomate, Salat","Es. 06:00 → ogni giorno alle 6:00 il contatore ordini riparte da 1":"Bsp. 06:00 → jeden Tag um 06:00 wird der Bestellzähler auf 1 zurückgesetzt","es. 192.168.1.9":"Bsp. 192.168.1.9","es. https://miosito.it oppure lascia vuoto per rete locale":"Bsp. https://miosito.it oder leer lassen für lokales Netzwerk","Esporta backup ZIP":"Backup ZIP exportieren","Esporta: ti chiede dove salvare il ZIP (scegli Download). Importa: seleziona il file ZIP. Contiene impostazioni, testi e immagini.":"Exportieren: fragt, wo das ZIP gespeichert werden soll (wähle Download). Importieren: wähle die ZIP-Datei. Enthält Einstellungen, Texte und Bilder.","export backup":"Backup exportieren","Extra a pagamento":"Kostenpflichtige Extras","Extra Formaggio:1, Bacon:1.5":"Extra Käse:1, Bacon:1.5","failed on":"fehlgeschlagen bei","File ZIP salvato nella cartella che hai scelto (":"ZIP-Datei im ausgewählten Ordner gespeichert (","Gestione Categorie":"Kategorieverwaltung","Gestione completa per singolo totem con rinnovo mensile.":"Komplette Verwaltung für einen einzelnen Kiosk mit monatlicher Verlängerung.","Gestione Ordini":"Bestellverwaltung","Gestione Prodotti":"Produktverwaltung","Gestisci lo stato della prova e gli abbonamenti disponibili.":"Verwalte den Teststatus und verfügbare Abonnements.","Gestisci prodotti, categorie, foto, listini e impostazioni dal telefono o PC senza toccare il totem.":"Verwalten Sie Produkte, Kategorien, Fotos, Preislisten und Einstellungen vom Telefon oder PC, ohne den Kiosk zu berühren.","GG)":"GG)","giorni)":"Tage)","giorni) per questo dispositivo?":"Tage) für dieses Gerät?","Gli abbonamenti digitali in-app sono gestiti integralmente da Google Play Billing. L'applicazione non ha accesso né memorizza carte di credito o coordinate bancarie.":"Digitale In-App-Abonnements werden vollständig von Google Play Billing verwaltet. Die App hat keinen Zugriff auf Kreditkarten- oder Bankdaten und speichert diese nicht.","Gli abbonamenti Google Play Store si rinnovano automaticamente. È possibile gestire la cancellazione o la modifica del metodo di pagamento in qualsiasi momento direttamente dal proprio account Google Play.":"Google Play Store-Abonnements verlängern sich automatisch. Sie können die Kündigung verwalten oder die Zahlungsmethode jederzeit direkt über Ihr Google Play-Konto ändern.","Gli abbonamenti si rinnovano automaticamente tramite il tuo account Google Play a meno che non vengano disdetti almeno 24 ore prima della scadenza. Puoi gestire o annullare l'abbonamento in qualsiasi momento dall'app Google Play &gt; Pagamenti e Abbonamenti.":"Abonnements werden automatisch über Ihr Google Play-Konto verlängert, es sei denn, sie werden mindestens 24 Stunden vor Ablauf gekündigt. Sie können das Abonnement jederzeit in der Google Play-App &gt; Zahlungen und Abonnements verwalten oder kündigen.","Gli aggiornamenti software correttivi e le nuove funzionalità vengono rilasciati attraverso i canali di distribuzione dell'app.":"Korrektur-Updates und neue Funktionen werden über die Distributionskanäle der App bereitgestellt.","glutine, lattosio, uova":"Gluten, Laktose, Eier","Google Play Store Billing":"Google Play Store Billing","Grazie!":"Danke!","Gruppi Extra Globali":"Globale Extra-Gruppen","Gruppi Opzionali Globali":"Globale optionale Gruppen","Gruppo a scelta":"Auswahlgruppe","Hai bisogno di assistenza o configurazione personalizzata?":"Brauchen Sie Unterstützung oder eine individuelle Konfiguration?","Ho Letto e Accetto":"Ich habe gelesen und akzeptiere","I gruppi selezionati vengono aggiunti automaticamente a questo prodotto al momento dell'ordine.":"Die ausgewählten Gruppen werden beim Bestellen automatisch diesem Produkt hinzugefügt.","I nuovi PIN non coincidono":"Die neuen PINs stimmen nicht überein","Ideale per singola postazione (Pizzerie, Bar, Chioschi)":"Ideal für eine einzelne Station (Pizzerien, Bars, Kioske)","Il file ZIP è stato creato (":"Die ZIP-Datei wurde erstellt (","Il nome del ristorante non puo essere vuoto":"Der Restaurantname darf nicht leer sein","Il nuovo PIN deve essere di 4 cifre":"Die neue PIN muss 4 Ziffern haben","Il più scelto dai piccoli ristoratori (2 mesi gratis)":"Am meisten gewählt von kleinen Gastronomen (2 Monate gratis)","Immagine (opzionale)":"Bild (optional)","Impedisce lo spegnimento dello schermo durante il servizio.":"Verhindert das Ausschalten des Bildschirms während des Service.","import backup":"Backup importieren","Import completato":"Import abgeschlossen","Import fallito:":"Import fehlgeschlagen:","Importa backup ZIP":"ZIP-Backup importieren","Impossibile aggiornare la disponibilità":"Verfügbarkeit konnte nicht aktualisiert werden","Impossibile aprire la galleria. Controlla i permessi foto.":"Galerie kann nicht geöffnet werden. Prüfe die Foto-Berechtigungen.","Impossibile aprire la modifica.":"Bearbeitung kann nicht geöffnet werden.","Impossibile caricare i dati":"Daten können nicht geladen werden","Impossibile caricare le categorie":"Kategorien können nicht geladen werden","Impossibile completare il ripristino:":"Wiederherstellung konnte nicht abgeschlossen werden:","Impossibile creare il backup:":"Backup konnte nicht erstellt werden:","Impossibile eliminare il prodotto":"Produkt kann nicht gelöscht werden","Impossibile eliminare la categoria":"Kategorie kann nicht gelöscht werden","Impossibile leggere l'immagine selezionata":"Ausgewähltes Bild kann nicht gelesen werden","Impossibile recuperare i dispositivi Bluetooth. Controlla i permessi.":"Bluetooth-Geräte können nicht abgerufen werden. Prüfe die Berechtigungen.","Impossibile rilevare l'IP in automatico. Inserisci l'indirizzo IP visibile nelle impostazioni Wi-Fi del tablet (es. 192.168.1.9).":"IP kann nicht automatisch erkannt werden. Gib die IP-Adresse ein, die in den Wi-Fi-Einstellungen des Tablets angezeigt wird (z. B. 192.168.1.9).","Impossibile salvare il gruppo":"Gruppe kann nicht gespeichert werden","Impossibile salvare il prodotto":"Produkt kann nicht gespeichert werden","Impossibile salvare la categoria":"Kategorie kann nicht gespeichert werden","Impossibile salvare le credenziali":"Anmeldedaten können nicht gespeichert werden","Impossibile salvare le impostazioni":"Einstellungen können nicht gespeichert werden","Imposta la sequenza di tocchi segreta per aprire il pannello di amministrazione e il PIN di protezione.":"Legen Sie die geheime Tipp‑Sequenz fest, um das Administrationspanel und die Schutz‑PIN zu öffnen.","Impostazioni salvate correttamente":"Einstellungen erfolgreich gespeichert","In Alto Centrale":"Oben Mitte","In Attesa":"Wartend","In Preparazione":"In Vorbereitung","Indirizzo IP Totem (Wi-Fi Locale)":"Totem‑IP‑Adresse (lokales Wi‑Fi)","Indirizzo IP Wi-Fi trovato:":"Wi‑Fi IP‑Adresse gefunden:","Info Rilevamento":"Erkennungsinfo","Informativa Privacy (GDPR)":"Datenschutzerklärung (GDPR)","Informativa sulla Privacy (GDPR)":"Datenschutzerklärung (GDPR)","Informazioni Ristorante":"Restaurantinformationen","Ingredienti (separati da virgola)":"Zutaten (durch Kommas getrennt)","Ingredienti base":"Basiszutaten","Ingredienti Base":"Basiszutaten","Inserisci il nome o titolo del gruppo":"Geben Sie den Namen oder Titel der Gruppe ein","Interactive Totem Guide":"Interaktiver Totem‑Guide","Invalid credentials. Use admin / admin123":"Ungültige Zugangsdaten. Verwenden Sie admin / admin123","Invia la tua comanda in cucina e ricevi il tuo scontrino con numero.":"Senden Sie Ihre Bestellung an die Küche und erhalten Sie Ihren nummerierten Beleg.","IP detect error:":"IP‑Erkennungsfehler:","IP Kiosk LAN:":"IP Kiosk LAN:","IP Rilevato":"Erkannte IP","IP Totem:":"Totem‑IP:","KB) su Drive, USB o inviarlo.":"KB) auf Drive, USB oder senden.","KB), ma su questo dispositivo non c'è un'app per salvarlo/condividerlo. Riprova e, quando richiesto, scegli la cartella Download.":"KB), aber auf diesem Gerät gibt es keine App, um es zu speichern/teilen. Versuchen Sie es erneut und wählen Sie bei Aufforderung den Ordner Download.","KB). Contiene impostazioni, testi e immagini. Copia quel file sull'altro tablet e usa Importa backup ZIP.":"KB). Enthält Einstellungen, Texte und Bilder. Kopieren Sie diese Datei auf das andere Tablet und verwenden Sie Importa backup ZIP.","Ketchup, Maionese, Crema tartufo...":"Ketchup, Mayonnaise, Trüffelcreme...","Kiosk Control & Hardware":"Kiosk-Steuerung & Hardware","Kiosk Hardware ID:":"Kiosk Hardware-ID:","L'app richiede l'accesso alla rete locale (WiFi) per consentire il collegamento con il display cucina KDS e il pannello remoto amministrativo, e l'accesso al Bluetooth per la connessione alle stampanti termiche ESC/POS.":"Die App benötigt Zugriff auf das lokale Netzwerk (Wi‑Fi), um die Verbindung mit dem Küchen-Display KDS und dem entfernten Administrationspanel zu ermöglichen, sowie Zugriff auf Bluetooth für die Verbindung zu ESC/POS-Thermodruckern.","L'attivazione di Totem QuickBite conferisce una licenza d'uso per singolo terminale Kiosk touch-screen.":"Durch die Aktivierung von Totem QuickBite wird eine Nutzungslizenz für ein einzelnes Kiosk-Touchscreen-Terminal erteilt.","La scansione Bluetooth funziona solo su Android.":"Das Bluetooth-Scanning funktioniert nur unter Android.","Le categorie vengono ordinate per indice crescente. 0 = prima categoria.":"Kategorien werden nach aufsteigendem Index sortiert. 0 = erste Kategorie.","Le stampe per la cucina continuano a funzionare normalmente.":"Die Ausdrucke für die Küche funktionieren weiterhin wie gewohnt.","Licenza e Abbonamenti":"Lizenz & Abonnements","Lista Extra (€)":"Extra-Liste (€)","Loading Kiosk & Hardware Settings...":"Lade Kiosk- & Hardware-Einstellungen...","Local server boot error:":"Fehler beim Starten des lokalen Servers:","Logo Ristorante":"Restaurantlogo","Luminosità & Controllo Display":"Helligkeit & Display-Steuerung","Luminosità impostata al 10% (risparmio energetico). Tocca lo schermo per ripristinare.":"Helligkeit auf 10 % gesetzt (Energiesparmodus). Tippen Sie auf den Bildschirm, um wiederherzustellen.","Luminosità Schermo (":"Bildschirmhelligkeit (","MAC es. 00:11:22:33:44:55 o nome":"MAC z.B. 00:11:22:33:44:55 oder Name","mailto:priologiovanni82@gmail.com?subject=Supporto%20Guida%20Totem%20QuickBite":"mailto:priologiovanni82@gmail.com?subject=Supporto%20Guida%20Totem%20QuickBite","Memoria Libera:":"Freier Speicher:","Metodo Pagamento:":"Zahlungsmethode:","Min selezioni / Max selezioni":"Min. Auswahlen / Max. Auswahlen","Modalità Kiosk & Blocco Schermo":"Kiosk-Modus & Bildschirmsperre","Modifica Categoria":"Kategorie bearbeiten","Modifica Gruppo":"Gruppe bearbeiten","Modifica Prodotto":"Produkt bearbeiten","Modulo stampante non disponibile":"Druckermodul nicht verfügbar","N°":"Nr.","Nessun abbonamento attivo rilevato su questo dispositivo.":"Kein aktives Abonnement auf diesem Gerät gefunden.","Nessun Abbonamento Trovato":"Kein Abonnement gefunden","Nessun argomento trovato per la ricerca \"":"Kein Thema für die Suche \"","Nessun dispositivo Bluetooth":"Kein Bluetooth-Gerät","Nessun dispositivo in modalita web.":"Kein Gerät im Web‑Modus.","Nessun dispositivo trovato. Accendi e abbina la stampante in Impostazioni Android Bluetooth, concedi i permessi, poi aggiorna la lista. Oppure inserisci il MAC manualmente.":"Kein Gerät gefunden. Schalten Sie den Drucker ein und koppeln Sie ihn in den Android-Bluetooth‑Einstellungen, erteilen Sie die Berechtigungen und aktualisieren Sie dann die Liste. Oder geben Sie die MAC manuell ein.","Nessun dispositivo. Abbina prima la stampante nelle impostazioni Bluetooth di sistema, poi riprova.":"Kein Gerät. Koppeln Sie zuerst den Drucker in den Bluetooth‑Systemeinstellungen und versuchen Sie es dann erneut.","Nessun gruppo globale configurato. Creane uno nella scheda \"Gruppi\" per collegarlo rapidamente qui.":"Keine globale Gruppe konfiguriert. Erstellen Sie eine auf der Registerkarte \"Gruppen\", um sie hier schnell zu verknüpfen.","Nessun gruppo globale configurato. Creane uno nella sezione Gruppi.":"Keine globale Gruppe konfiguriert. Erstellen Sie eine in der Sektion \"Gruppen\".","Nessun ordine":"Keine Bestellungen","Nessuna immagine selezionata":"Kein Bild ausgewählt","Nessuna stampante configurata":"Kein Drucker konfiguriert","Nessuna stampante trovata. Verifica che:":"Kein Drucker gefunden. Prüfen Sie, dass:","Nessuna stampante. Aggiungine una dalla lista o inserisci il MAC.":"Kein Drucker. Fügen Sie einen aus der Liste hinzu oder geben Sie die MAC ein.","Nome *":"Name *","Nome del Ristorante":"Name des Restaurants","Nome Interno (es: Salse Panini)":"Interner Name (z. B.: Salse Panini)","Nome opzione":"Name der Option","Nome sezione (es: Creme, Salse, Extra...)":"Name der Sektion (z. B.: Creme, Salse, Extra...)","Non disponibile":"Nicht verfügbar","Note Legali & Conformità Google Play Store":"Rechtliche Hinweise & Google Play Store Konformität","Numero di tocchi segreti:":"Anzahl geheimer Berührungen:","Numero Ordini":"Anzahl Bestellungen","Nuova Categoria":"Neue Kategorie","Nuova password":"Neues Passwort","Nuovo Gruppo":"Neue Gruppe","Nuovo PIN":"Neue PIN","Nuovo Prodotto":"Neues Produkt","Nuovo username":"Neuer Benutzername","Offline: admin / admin123 (or PIN 1234)":"Offline: admin / admin123 (oder PIN 1234)","Ogni modifica effettuata da remoto si sincronizza automaticamente con il totem.":"Jede aus der Ferne vorgenommene Änderung synchronisiert sich automatisch mit dem Totem.","Operazione annullata.":"Vorgang abgebrochen.","Opzioni (nome + sovrapprezzo €)":"Optionen (Name + Aufpreis €)","Orario reset giornaliero (HH:mm)":"Tägliche Reset-Zeit (HH:mm)","Ordine a voce":"Sprachbestellung","ORDINE A VOCE":"SPRACHBESTELLUNG","Ordine a voce - cliente ordinerà in cassa":"Sprachbestellung - Kunde bestellt an der Kasse","Ordine visualizzazione":"Bestellansicht","Ordini e comande illimitati":"Unbegrenzte Bestellungen und Bons","Orologio Digitale":"Digitale Uhr","Paga in cassa al ritiro":"Bezahlung an der Kasse bei Abholung","Paired printers error:":"Fehler bei gekoppelten Druckern:","Pane, Carne, Lattuga, Pomodoro":"Brot, Fleisch, Salat, Tomate","Pannello amministrativo remoto in rete locale":"Remote-Administrationspanel im lokalen Netzwerk","Password attuale":"Aktuelles Passwort","Password attuale non corretta":"Aktuelles Passwort ist nicht korrekt","Per abilitarlo, vai su Impostazioni e attiva l'opzione \"Display Cucina\".":"Um es zu aktivieren, gehe zu Einstellungen und aktiviere die Option \"Display Cucina\".","Per qualsiasi informazione sulla gestione dei dati, contatta Totem QuickBite attraverso i canali di assistenza ufficiali.":"Für Informationen zur Datenverwaltung kontaktieren Sie Totem QuickBite über die offiziellen Supportkanäle.","PERIODO PROVA SCADUTO":"Testzeitraum abgelaufen","Permessi Bluetooth negati":"Bluetooth-Berechtigungen verweigert","Permesso negato":"Berechtigung verweigert","Permette il controllo remoto e la telemetria via rete locale LAN (compatibile con Home Assistant e pannello web).":"Ermöglicht Fernsteuerung und Telemetrie über das lokale LAN (kompatibel mit Home Assistant und Web‑Panel).","Personalizza ingredienti, salse, opzioni ed extra come preferisci.":"Passe Zutaten, Saucen, Optionen und Extras nach Wunsch an.","Personalizzazioni sul totem":"Personalisierungen am totem","Piano Base Annuale":"Basis-Jahresplan","Piano Base Totem":"Totem Basisplan","Piano Configurato:":"Konfigurierter Plan:","Piano di abbonamento non disponibile.":"Abonnementplan nicht verfügbar.","pickImage category error":"pickImage category error","pickImage product error":"pickImage product error","PIN attuale":"Aktueller PIN","PIN attuale / nuovo / conferma":"Aktueller PIN / neu / bestätigen","PIN attuale non corretto":"Aktueller PIN nicht korrekt","PIN errato. Predefinito: 0000 o 1234":"Falscher PIN. Standard: 0000 oder 1234","Please enter username and password":"Bitte Benutzername und Passwort eingeben","Porta standard 8000 / microserver Python locale.":"Standardport 8000 / lokaler Python-Microserver.","Posizione del Trigger Segreto:":"Position des geheimen Auslösers:","Premi Cerca o Aggiorna lista. Vedrai cuffie, speaker e stampanti: aggiungi solo la stampante.":"Drücken Sie Suchen oder Liste aktualisieren. Sie sehen Kopfhörer, Lautsprecher und Drucker: fügen Sie nur den Drucker hinzu.","Presentati al banco":"Melden Sie sich am Tresen","Prezzo (€) *":"Preis (€) *","prodotti (con immagini). Se qualcosa non si aggiorna, chiudi e riapri l'app.":"Produkte (mit Bildern). Wenn sich etwas nicht aktualisiert, schließen und die App neu öffnen.","Prodotti Esauriti":"Ausverkaufte Produkte","Prodotto aggiornato":"Produkt aktualisiert","Prodotto creato":"Produkt erstellt","Prodotto eliminato":"Produkt gelöscht","Prodotto Esaurito":"Produkt ausverkauft","Prodotto non trovato nel menu.":"Produkt im Menü nicht gefunden.","Prova gratuita (":"Kostenlose Testversion (","PROVA GRATUITA (":"KOSTENLOSE TESTVERSION (","Questo articolo è attualmente esaurito e non può essere modificato.":"Dieser Artikel ist derzeit ausverkauft und kann nicht bearbeitet werden.","Reset error:":"Reset-Fehler:","Reset Eseguito":"Reset abgeschlossen","Reset Numerazione e Comande?":"Nummerierung und Bestellungen zurücksetzen?","Reset Numero Ora":"Nummer jetzt zurücksetzen","Reset Prova":"Test zurücksetzen","REST API Locale Attiva":"Lokale REST-API aktiviert","rgba(0,0,0,0.5)":"rgba(0,0,0,0.5)","rgba(0,0,0,0.7)":"rgba(0,0,0,0.7)","rgba(0,0,0,0.85)":"rgba(0,0,0,0.85)","rgba(0,0,0,0.92)":"rgba(0,0,0,0.92)","rgba(15, 23, 42, 0.6)":"rgba(15, 23, 42, 0.6)","rgba(15, 23, 42, 0.65)":"rgba(15, 23, 42, 0.65)","rgba(255, 107, 107, 0.1)":"rgba(255, 107, 107, 0.1)","rgba(255, 107, 107, 0.15)":"rgba(255, 107, 107, 0.15)","rgba(255, 107, 107, 0.2)":"rgba(255, 107, 107, 0.2)","rgba(255, 107, 107, 0.3)":"rgba(255, 107, 107, 0.3)","rgba(255, 255, 255, 0.12)":"rgba(255, 255, 255, 0.12)","rgba(255, 255, 255, 0.18)":"rgba(255, 255, 255, 0.18)","rgba(255,255,255,0.12)":"rgba(255,255,255,0.12)","rgba(255,255,255,0.2)":"rgba(255,255,255,0.2)","rgba(255,255,255,0.9)":"rgba(255,255,255,0.9)","rgba(56, 189, 248, 0.15)":"rgba(56, 189, 248, 0.15)","Riapre l'app totem immediatamente dopo il riavvio del tablet.":"Öffnet die Kiosk‑App sofort nach dem Neustart des Tablets.","Rileva IP":"IP erkennen","Ripristina Abbonamento Google Play":"Google Play‑Abo wiederherstellen","Ripristina Prova":"Testphase wiederherstellen","Ripristino Completato":"Wiederherstellung abgeschlossen","RISPARMIA 2 MESI":"SPARE 2 MONATE","Risparmio Energetico (Dimmed)":"Energiesparmodus (Abgedunkelt)","Ritiro al Banco Senza Attese":"Abholung am Tresen — ohne Wartezeit","Salse gratuite":"Kostenlose Saucen","Salva Credenziali":"Anmeldedaten speichern","Salva Impostazioni":"Einstellungen speichern","Salvaschermo & Reset Inattività":"Bildschirmschoner & Inaktivitäts‑Reset","Salvaschermo avviato. Tocca lo schermo per uscire.":"Bildschirmschoner gestartet. Tippe den Bildschirm an, um zu beenden.","Scadenza / Prossimo Rinnovo:":"Ablauf / Nächste Verlängerung:","Scan error:":"Fehler beim Scannen:","scan failed":"scan fehlgeschlagen","Scansione completata":"Scan abgeschlossen","Scelta obbligatoria":"Auswahl erforderlich","Schermo Nero":"Schwarzer Bildschirm","Schermo Sempre Acceso (Keep Awake)":"Bildschirm immer an (Keep Awake)","Scontrino Cortesia":"Kulanzbeleg","SCONTRINO CORTESIA":"Kulanzbeleg","Scrivi al Supporto":"Support kontaktieren","Segnale acustico e vibrazione hardware eseguiti.":"Ton und Hardware-Vibration ausgelöst.","Seleziona i gruppi globali (salse, ingredienti, extra o scelte) da collegare a questo prodotto.":"Wählen Sie globale Gruppen (Saucen, Zutaten, Extras oder Auswahl) aus, die mit diesem Produkt verknüpft werden sollen.","Sicurezza & Gesture di Sblocco":"Sicherheit & Entsperrgesten","Solo circa 7,40 € al mese con fatturazione annuale.":"Nur etwa 7,40 € pro Monat bei Jahresabrechnung.","Stampa Automatica":"Automatischer Druck","Stampa scontrini termici ESC/POS":"Thermische Belege drucken (ESC/POS)","Stampanti Bluetooth":"Bluetooth-Drucker","Stato Attivazione Dispositivo":"Aktivierungsstatus des Geräts","Stato Kiosk:":"Kiosk-Status:","Stato licenza reimpostato a periodo di prova.":"Lizenzstatus auf Testzeitraum zurückgesetzt.","Stato Schermo:":"Bildschirmstatus:","Step-by-step instructions for hardware configuration, orders, and restaurant management":"Schritt-für-Schritt-Anleitungen für Hardware-Konfiguration, Bestellungen und Restaurantverwaltung","Svuota il carrello e torna alla home se il cliente si allontana prima di pagare.":"Warenkorb leeren und zur Startseite zurückkehren, wenn der Kunde vor dem Bezahlen weggeht.","Tempo attesa reset carrello:":"Wartezeit bis Warenkorb-Reset:","Termini di Servizio (EULA)":"Nutzungsbedingungen (EULA)","Termini di Servizio & Licenza d'Uso":"Nutzungsbedingungen & Lizenzvereinbarung","Test Dimming (10%)":"Dimmtest (10%)","Test Feedback Beep":"Feedback-Piep-Test","Test Risveglio (Wake)":"Wake-Test (Wake)","Test Salvaschermo":"Bildschirmschoner-Test","Test Strumenti & Comandi Hardware:":"Test: Hardware-Werkzeuge & -Befehle:","thermal driver import missing":"Import des Thermaltreibers fehlt","Ticket Cucina":"Küchenbon","Timeout Inattività:":"Inaktivitäts-Timeout:","Tipo di Salvaschermo:":"Art des Bildschirmschoners:","Tipo Sezione":"Bereichstyp","Tipo: extra a pagamento":"Typ: kostenpflichtiges Extra","Tipo: gruppo a scelta (min/max + prezzo)":"Typ: Auswahlgruppe (min/max + Preis)","Tipo: ingredienti da togliere":"Typ: Zutaten zum Entfernen","Tipo: scelte gratuite (salse/creme...)":"Typ: kostenlose Auswahl (Saucen/Creme...)","Titolo per cliente (es: Scegli salse)":"Titel für den Kunden (z. B.: Saucen wählen)","TOCCA LO SCHERMO PER ORDINARE":"BERÜHRE DEN BILDSCHIRM ZUM BESTELLEN","Tocca lo schermo per riattivare":"Tippe den Bildschirm an, um zu reaktivieren","Tocca lo schermo per scoprire il nostro menu e ordinare subito.":"Tippe den Bildschirm an, um unser Menü zu entdecken und jetzt zu bestellen.","Tocca per iniziare ad ordinare":"Tippe, um mit der Bestellung zu beginnen","Totale: €":"Gesamt: €","Totem in Standby":"Totem im Standby","Totem Kiosk REST API & Telemetria LAN":"Totem Kiosk REST API & LAN‑Telemetrie","Totem Operating Guide & Manual":"Totem Bedienungsanleitung & Handbuch","Totem QuickBite · Versione build v1.2.10":"Totem QuickBite · Build‑Version v1.2.10","TOTEM RISTORANTE":"TOTEM RESTAURANT","Totem Self-Service":"Totem Selbstbedienung","Tutte le funzionalità del Piano Base":"Alle Funktionen des Basic Plans","Tutti i marchi citati appartengono ai rispettivi proprietari. L'applicazione non condivide dati sensibili di pagamento con terze parti non autorizzate. Gli abbonamenti in-app sono elaborati direttamente dai server sicuri di Google Play Billing.":"Alle genannten Marken gehören ihren jeweiligen Eigentümern. Die Anwendung teilt keine sensiblen Zahlungsdaten mit nicht autorisierten Dritten. In‑App‑Abonnements werden direkt von den sicheren Servern von Google Play Billing verarbeitet.","Ultimo reset:":"Letzter Reset:","Uno o più articoli nel tuo carrello non sono più disponibili. Rimuovili per poter procedere.":"Ein oder mehrere Artikel in deinem Warenkorb sind nicht mehr verfügbar. Entferne sie, um fortzufahren.","URL Server Personalizzato (Opzionale per Cloud / Dominio)":"URL des benutzerdefinierten Servers (optional für Cloud / Domain)","Usa il menu di condivisione per salvare il ZIP (":"Verwende das Teilen‑Menü, um die ZIP zu speichern (","Username / Password":"Benutzername / Passwort","Username attuale":"Aktueller Benutzername","Username attuale non corretto":"Aktueller Benutzername nicht korrekt","Username e password nuovi obbligatori":"Neuer Benutzername und Passwort erforderlich","Versione Sistema:":"Systemversion:","Vuoi attivare il \"":"Möchten Sie den \\\"","Vuoi eliminare":"Möchten Sie löschen","Vuoi eliminare \"":"Möchten Sie löschen \\\"","Vuoi eliminare la categoria \"":"Möchten Sie die Kategorie löschen \\\"","Vuoi ripristinare il periodo di prova (":"Möchten Sie den Probezeitraum wiederherstellen (","ZIP non valido":"Ungültige ZIP"}};

export function translateSourceText(value: string): string {
  if (typeof value !== 'string' || !value) return value;
  const translations = LITERAL_TRANSLATIONS[currentLang] || LITERAL_TRANSLATIONS.it;
  const direct = translations[value];
  if (direct) return direct;

  // Handles UI messages that include a runtime value, such as a printer name or an error detail.
  let translated = value;
  const entries = Object.entries(translations)
    .filter(([source]) => source.length >= 3 && source !== translated)
    .sort(([a], [b]) => b.length - a.length);
  for (const [sourceText, targetText] of entries) {
    if (translated.includes(sourceText)) translated = translated.split(sourceText).join(targetText);
  }
  return translated;
}

// State / Event Bus for reactive multi-screen i18n
type Listener = (lang: SupportedLanguage) => void;
const listeners = new Set<Listener>();

let defaultLang: SupportedLanguage = 'en';
let sessionLang: SupportedLanguage | null = null;
let currentLang: SupportedLanguage = 'en';
let isInitialized = false;

function notifyLanguageChange(): void {
  listeners.forEach((fn) => {
    try {
      fn(currentLang);
    } catch (err) {
      console.warn('i18n listener error:', err);
    }
  });
}

export async function initI18n(): Promise<SupportedLanguage> {
  if (isInitialized) return currentLang;

  try {
    const saved = await storage.getItem('app_language', null);
    if (saved && isSupportedLanguage(saved)) {
      defaultLang = saved;
    } else {
      const systemLanguage = Localization.getLocales()[0]?.languageCode?.toLowerCase();
      defaultLang = isSupportedLanguage(systemLanguage) ? systemLanguage : 'it';
      await storage.setItem('app_language', defaultLang);
    }
    currentLang = sessionLang || defaultLang;
  } catch (error) {
    console.warn('initI18n error:', error);
    defaultLang = 'it';
    currentLang = sessionLang || defaultLang;
  }

  isInitialized = true;
  return currentLang;
}

function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === 'string' && (['it', 'en', 'es', 'fr', 'de'] as string[]).includes(value);
}

export function getCurrentLanguage(): SupportedLanguage {
  return currentLang;
}

export function getDefaultLanguage(): SupportedLanguage {
  return defaultLang;
}

export function isCustomerSessionLanguageActive(): boolean {
  return sessionLang !== null;
}

/** Changes the kiosk default language permanently and ends any customer-only session. */
export async function setLanguage(lang: SupportedLanguage): Promise<void> {
  if (!isSupportedLanguage(lang)) return;
  defaultLang = lang;
  sessionLang = null;
  currentLang = lang;
  try {
    await storage.setItem('app_language', lang);
  } catch (e) {
    console.warn('setLanguage save error:', e);
  }
  notifyLanguageChange();
}

/** Changes language for the current customer order only; this value is never persisted. */
export function setCustomerSessionLanguage(lang: SupportedLanguage): void {
  if (!isSupportedLanguage(lang)) return;
  sessionLang = lang;
  currentLang = lang;
  notifyLanguageChange();
}

/** Restores the configured/system default language after an order, reset or return to home. */
export function resetCustomerSessionLanguage(): void {
  if (sessionLang === null) return;
  sessionLang = null;
  currentLang = defaultLang;
  notifyLanguageChange();
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

  const changeCustomerSessionLanguage = (newLang: SupportedLanguage) => {
    setCustomerSessionLanguage(newLang);
  };

  const resetCustomerLanguage = () => {
    resetCustomerSessionLanguage();
  };

  return {
    lang,
    defaultLang,
    isCustomerSessionLanguage: sessionLang !== null,
    setLanguage: changeLanguage,
    setCustomerSessionLanguage: changeCustomerSessionLanguage,
    resetCustomerSessionLanguage: resetCustomerLanguage,
    t: translate,
    languages: SUPPORTED_LANGUAGES,
    guideChapters: GUIDE_CHAPTERS[lang] || GUIDE_CHAPTERS.it,
  };
}
