import {
  Category,
  Product,
  Order,
  Settings,
  OrderItem,
  GlobalOptionGroup,
  KioskSettings,
  LicenseInfo,
  PrinterDevice,
  StationTopologyConfig,
} from '../types';

const API_BASE = '/api';

let _authToken = '';

export function setAuthToken(t: string) {
  _authToken = t || '';
  if (typeof localStorage !== 'undefined') {
    if (t) {
      localStorage.setItem('totem_admin_token', t);
    } else {
      localStorage.removeItem('totem_admin_token');
    }
  }
}

export function getAuthToken(): string {
  if (!_authToken && typeof localStorage !== 'undefined') {
    _authToken = localStorage.getItem('totem_admin_token') || '';
  }
  return _authToken;
}

// Initial defaults
const DEFAULT_PRINTERS: PrinterDevice[] = [
  {
    id: 'prn-1',
    name: 'Stampante Cassa / Ricevute',
    department: 'Cassa',
    interface_type: 'system',
    address: 'POS-RECEIPT-01',
    paper_width_mm: 80,
    assigned_category_ids: [],
    print_courtesy: true,
    print_kitchen: false,
    enabled: true,
  },
  {
    id: 'prn-2',
    name: 'Stampante Pizzeria / Forno',
    department: 'Pizzeria',
    interface_type: 'tcp_raw',
    address: '192.168.1.201:9100',
    paper_width_mm: 80,
    assigned_category_ids: ['cat-2'],
    print_courtesy: false,
    print_kitchen: true,
    enabled: true,
  },
  {
    id: 'prn-3',
    name: 'Stampante Cucina Calda / Fritti',
    department: 'Cucina Calda',
    interface_type: 'tcp_raw',
    address: '192.168.1.202:9100',
    paper_width_mm: 80,
    assigned_category_ids: ['cat-1', 'cat-3', 'cat-4'],
    print_courtesy: false,
    print_kitchen: true,
    enabled: true,
  },
  {
    id: 'prn-4',
    name: 'Stampante Bar / Bevande',
    department: 'Bar',
    interface_type: 'bluetooth',
    address: '66:77:88:99:AA:BB',
    paper_width_mm: 58,
    assigned_category_ids: ['cat-5', 'cat-6'],
    print_courtesy: false,
    print_kitchen: true,
    enabled: true,
  },
];

const DEFAULT_STATION_TOPOLOGY: StationTopologyConfig = {
  role: 'mono',
  station_id: 'TOTEM-01',
  station_name: 'Totem Principale',
  master_server_ip: '192.168.1.100',
  master_server_port: 3000,
  auto_discovery: true,
  order_prefix: '',
  sync_interval_sec: 5,
  last_synced_at: new Date().toISOString(),
};

const DEFAULT_SETTINGS: Settings = {
  restaurant_name: 'TOTEM RISTORANTE',
  logo: '',
  admin_username: 'admin',
  admin_password: '',
  admin_pin: '1234',
  recovery_code: 'TOTEM-REC-8429-1035',
  is_first_access_completed: false,
  currency_symbol: '€',
  kitchen_display_enabled: true,
  auto_print_courtesy: false,
  auto_print_kitchen: true,
  order_reset_mode: 'daily',
  order_reset_time: '00:00',
  station_topology: DEFAULT_STATION_TOPOLOGY,
  printers: DEFAULT_PRINTERS,
  display_queue_config: {
    show_prefix: false,
    show_only_number: false,
    show_header: true,
    show_clock: true,
    show_ready_list: true,
    show_prep_list: true,
    show_instruction: true,
    number_size: 'gigantic',
    theme: 'dark-pure',
    sound_enabled: true,
  },
};

const DEFAULT_KIOSK_SETTINGS: KioskSettings = {
  kiosk_enabled: true,
  screen_orientation: 'portrait',
  secret_taps_count: 7,
  secret_taps_position: 'top-right',
  admin_pin_required: true,
  screensaver_timeout_minutes: 3,
  dimming_timeout_minutes: 5,
  local_api_enabled: true,
};

const DEFAULT_LICENSE_INFO: LicenseInfo = {
  status: 'active',
  plan_name: 'Professional Totem (Google Play)',
  hardware_id: 'TOTEM-HW-88F4-A92B',
  expiry_date: '2026-12-31',
  trial_days_left: 7,
  allowed_totems: 1,
};

const DEFAULT_GLOBAL_GROUPS: GlobalOptionGroup[] = [
  {
    id: 'grp-1',
    name: 'Salse a Scelta',
    title: 'Salse & Condimenti',
    type: 'free_chips',
    chips: ['Ketchup', 'Maionese', 'Senape', 'Barbecue', 'Salsa Rosa', 'Salsa Piccante'],
    min_selection: 0,
    max_selection: 3,
    order_position: 1,
  },
  {
    id: 'grp-2',
    name: 'Formaggi & Aggiunte Extra',
    title: 'Aggiungi Extra',
    type: 'paid_extras',
    extras: [
      { name: 'Cheddar Fuso', price: 1.0 },
      { name: 'Bacon Croccante', price: 1.5 },
      { name: 'Cipolla Caramellata', price: 0.8 },
      { name: 'Doppia Carne', price: 3.0 },
    ],
    order_position: 2,
  },
  {
    id: 'grp-3',
    name: 'Cottura Carne',
    title: 'Grado di Cottura',
    type: 'single_choice',
    items: ['Al sangue', 'Media cottura', 'Ben cotta'],
    min_selection: 1,
    max_selection: 1,
    order_position: 3,
  },
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Panini', description: 'I nostri panini gourmet', order_position: 1 },
  { id: 'cat-2', name: 'Pizze', description: 'Pizze fresche e croccanti', order_position: 2 },
  { id: 'cat-3', name: 'Insalate', description: 'Insalate fresche e salutari', order_position: 3 },
  { id: 'cat-4', name: 'Combo', description: 'I nostri menù combo', order_position: 4 },
  { id: 'cat-5', name: 'Bevande', description: 'Bevande fresche', order_position: 5 },
  { id: 'cat-6', name: 'Dolci', description: 'Dolci e dessert', order_position: 6 },
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    category_id: 'cat-1',
    name: 'Hamburger Classico',
    description: 'Carne di manzo 180g su pane brioche con lattuga, pomodoro e salsa',
    price: 8.5,
    product_type: 'simple',
    base_ingredients: ['Pane brioche', 'Carne di manzo', 'Lattuga', 'Pomodoro', 'Salsa'],
    extra_additions: [
      { name: 'Extra Formaggio', price: 1.0 },
      { name: 'Extra Bacon', price: 1.5 },
      { name: 'Uovo', price: 1.0 },
    ],
    order_position: 1,
  },
  {
    id: 'prod-2',
    category_id: 'cat-1',
    name: 'Cheeseburger Deluxe',
    description: 'Hamburger con doppio cheddar e salsa speciale',
    price: 9.5,
    product_type: 'simple',
    base_ingredients: ['Pane brioche', 'Carne di manzo', 'Cheddar', 'Salsa speciale'],
    extra_additions: [
      { name: 'Extra Formaggio', price: 1.0 },
      { name: 'Extra Bacon', price: 1.5 },
    ],
    order_position: 2,
  },
  {
    id: 'prod-3',
    category_id: 'cat-2',
    name: 'Margherita',
    description: 'Pomodoro, mozzarella di bufala, basilico fresco',
    price: 7.0,
    product_type: 'simple',
    base_ingredients: ['Pomodoro', 'Mozzarella', 'Basilico'],
    extra_additions: [
      { name: 'Extra Mozzarella', price: 1.5 },
      { name: 'Bordo Ripieno', price: 2.0 },
    ],
    order_position: 1,
  },
  {
    id: 'prod-4',
    category_id: 'cat-2',
    name: 'Diavola',
    description: 'Pomodoro, mozzarella, salame piccante',
    price: 8.5,
    product_type: 'simple',
    base_ingredients: ['Pomodoro', 'Mozzarella', 'Salame piccante'],
    extra_additions: [{ name: 'Extra Mozzarella', price: 1.5 }],
    order_position: 2,
  },
  {
