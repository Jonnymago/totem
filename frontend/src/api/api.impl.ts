import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { sanitizeImageUri } from '@/src/utils/imageUtils';
import {
  authenticateAdminCredentials,
  authenticateAdminPin,
  clearLegacyAdminSecretsFromSettings,
  configureInitialAdminCredentials as configureInitialAdminCredentialsSecure,
  generateRecoveryCode as generateRecoveryCodeSecure,
  getAdminCredentialStatus as getSecureAdminCredentialStatus,
  isAdminSessionValid as isSecureAdminSessionValid,
  migrateLegacyAdminCredentials,
  registerAdminSessionRevoker as registerAdminSessionRevokerSecure,
  resetAdminCredentialsWithRecoveryCode as resetAdminCredentialsWithRecoveryCodeSecure,
  updateAdminCredentials,
} from '@/src/utils/adminCredentials';

export type SupportedCatalogLanguage = 'it' | 'en' | 'fr' | 'es' | 'de';
export type LocalTranslation = Partial<Record<SupportedCatalogLanguage, string>>;
export type TranslationGlossary = Record<string, LocalTranslation>;

export interface Category {
  id: string;
  name: string;
  description: string;
  image?: string;
  order_index: number;
}

export interface ExtraAddition {
  name: string;
  price: number;
}

export interface ComboGroupOption {
  name: string;
  price_delta: number;
}

export interface ComboGroup {
  name: string;
  min_selection: number;
  max_selection: number;
  options: ComboGroupOption[];
}

export type UiSectionType = 'base_remove' | 'paid_extras' | 'free_chips' | 'choice_group';

export interface UiSection {
  id: string;
  type: UiSectionType;
  title: string;
  enabled: boolean;
  order: number;
  items?: string[];
  extras?: ExtraAddition[];
  chips?: string[];
  min_selection?: number;
  max_selection?: number;
  options?: ComboGroupOption[];
}

export interface GlobalOptionGroup {
  id: string;
  name: string;
  description?: string;
  type: UiSectionType;
  title: string;
  order_index?: number;
  items?: string[];
  extras?: ExtraAddition[];
  chips?: string[];
  min_selection?: number;
  max_selection?: number;
  options?: ComboGroupOption[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category_id: string;
  available: boolean;
  /** Se true, il prodotto è in evidenza/preferito per la rotazione dello screensaver pubblicitario */
  is_featured?: boolean;
  allergens: string[];
  customization_options: string[];
  product_type: 'simple' | 'combo';
  base_ingredients: string[];
  extra_additions: ExtraAddition[];
  combo_groups: ComboGroup[];
  ui_sections?: UiSection[];
  global_group_ids?: string[];
  /** Posizione del prodotto all'interno della propria categoria (0-based, interna). */
  order_index?: number;
}

export type StationRole = 'mono' | 'master' | 'satellite' | 'kds';

export interface StationTopologyConfig {
  role: StationRole;
  station_id: string;
  station_name: string;
  master_server_ip: string;
  master_server_port: number;
  auto_discovery: boolean;
  order_prefix: string;
  sync_interval_sec: number;
  last_synced_at?: string;
}

export interface PrinterDevice {
  id: string;
  name: string;
  department: string;
  interface_type: 'bluetooth' | 'tcp_raw' | 'system';
  address: string;
  paper_width_mm: 58 | 80;
  assigned_category_ids: string[];
  print_courtesy: boolean;
  print_kitchen: boolean;
  enabled: boolean;
}

export interface DepartmentKDS {
  id: string;
  name: string;
  icon?: string;
  assigned_category_ids: string[];
  printer_id?: string;
}

export interface SignageScreen {
  id: string;
  name: string;
  category_ids: string[];
  mode?: 'full' | 'products';
  enabled?: boolean;
}

export interface ReceiptCustomLine {
  id: string;
  text: string;
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
}

export interface ReceiptTranslationsMap {
  courtesy?: string;
  order_num?: string;
  total?: string;
  subtotal?: string;
  pay_at_cash?: string;
  thanks?: string;
  non_fiscal?: string;
  table?: string;
  takeaway?: string;
  dine_in?: string;
  without?: string;
  notes?: string;
  tax_id_label?: string;
  items_label?: string;
  qty_label?: string;
  price_label?: string;
}

export interface ReceiptLayoutConfig {
  language?: 'auto' | 'it' | 'en' | 'es' | 'fr' | 'de';
  paper_width_mm?: 58 | 80;
  header_title?: string;
  header_subtitle?: string;
  header_tax_id?: string;
  show_order_number_big?: boolean;
  show_order_type?: boolean;
  show_date_time?: boolean;
  show_subtotal?: boolean;
  show_tax_summary?: boolean;
  item_notes_enabled?: boolean;
  footer_message?: string;
  footer_non_fiscal_note?: string;
  custom_template_raw?: string;
  blocks_order?: string[];
  custom_lines?: ReceiptCustomLine[];
  translations?: Record<string, ReceiptTranslationsMap>;
  separator_style?: 'dashes' | 'stars' | 'equals' | 'solid';
  condensed_spacing?: boolean;
}

export interface SignageProductConfig {
  product_id: string;
  is_hero?: boolean;
  slot_size?: 'normal' | 'hero' | 'wide' | 'spotlight';
  animation?: 'ken-burns' | 'pulse-glow' | 'steam-float' | 'badge-star' | 'zoom-in' | 'price-shimmer' | '3d-pop' | 'none';
  custom_tag?: string;
  video_loop_url?: string;
  enabled?: boolean;
  order_index?: number;
}

export interface SignageCategoryConfig {
  category_id: string;
  enabled?: boolean;
  order_index?: number;
  duration_seconds?: number;
  layout?: 'auto' | '1' | '2' | '3' | '4' | '6' | '8' | '10' | '12' | '16' | '1-hero-4-grid' | '2-hero-2-grid' | 'bento' | 'grid-4' | 'grid-6' | 'grid-8' | 'grid-10' | 'grid-12' | 'grid-16' | 'hero-spotlight' | 'all' | 'list-table';
  transition?: 'curtain-slide' | 'fade-blur' | 'zoom-in' | 'flip-3d' | 'ken-burns' | 'slide-left' | 'none';
  theme?: 'chalkboard' | 'dark-gold' | 'fastfood-vibrant' | 'trattoria' | 'fresh-emerald' | 'steakhouse' | 'cyberpunk-neon' | 'nordic-minimal' | 'sunset-coral';
  bg_video_url?: string;
  bg_image_url?: string;
  hero_product_ids?: string[];
  product_order_ids?: string[];
  products_config?: Record<string, SignageProductConfig>;
  show_descriptions?: boolean;
  show_allergens?: boolean;
}

export interface DigitalSignageSettings {
  rotate_seconds?: number;
  ticker_enabled?: boolean;
  ticker_text?: string;
  video_loop_url?: string;
  video_loop_enabled?: boolean;
  video_loop_opacity?: number;
  video_loop_fit?: 'cover' | 'contain';
  tv_orientation?: 'landscape' | 'portrait' | 'auto';
  products_per_page?: 'all' | '1' | '2' | '3' | '4' | '6' | '8' | '10' | '12' | '16' | 'auto' | 'bento' | 'hero-spotlight' | 'list-table';
  default_theme?: 'chalkboard' | 'dark-gold' | 'fastfood-vibrant' | 'trattoria' | 'fresh-emerald' | 'steakhouse' | 'cyberpunk-neon' | 'nordic-minimal' | 'sunset-coral';
  default_transition?: 'curtain-slide' | 'fade-blur' | 'zoom-in' | 'flip-3d' | 'ken-burns' | 'slide-left' | 'none';
  categories_config?: Record<string, SignageCategoryConfig>;
  category_order_ids?: string[];
  auto_reorganize_unavailable?: boolean;
  show_queue_bar?: boolean;
  queue_bar_position?: 'top' | 'bottom' | 'hidden';
  queue_bar_height_percent?: number;
  logo_overlay_enabled?: boolean;
  columns?: number;
  mode?: 'full' | 'products' | 'queue';
  custom_accent_color?: string;
  font_family?: 'impact' | 'condensed' | 'serif' | 'modern' | 'handwritten';
  font_size_scale?: 'normal' | 'large' | 'extra-large';
  show_product_images?: boolean;
  show_product_descriptions?: boolean;
  show_allergens?: boolean;
  show_calories?: boolean;
  price_format?: 'standard' | 'symbol_after' | 'compact';
  clock_format?: '24h' | '12h' | 'hidden';
  sound_on_rotate?: boolean;
  template?: string;
  theme?: string;
  rotation_interval_sec?: number;
  animation_type?: string;
  hero_banner_enabled?: boolean;
  ticker_speed?: 'slow' | 'normal' | 'fast';
  ticker_background_color?: string;
  video_background_enabled?: boolean;
  video_background_url?: string;
  upselling_rules_enabled?: boolean;
}

export interface Settings {
  custom_backend_url?: string;
  /** IPv4 LAN scelto manualmente per QR e pannello remoto quando l'auto-rilevamento non è affidabile. */
  remote_ip_override?: string;
  language?: 'it' | 'en' | 'es' | 'fr' | 'de';
  id: string;
  restaurant_name: string;
  logo: string;
  auto_print_courtesy: boolean;
  auto_print_kitchen: boolean;
  kitchen_display_enabled: boolean;
  printer_courtesy: string;
  printer_kitchen: string;
  known_printers: any[];
  paper_width_mm?: number | string;
  order_reset_mode: 'daily' | 'manual' | 'never';
  reset_time: string;
  current_order_number: number;
  last_reset_at: string | null;
  admin_pin?: string;
  admin_username?: string;
  admin_password?: string;
  station_topology?: StationTopologyConfig;
  printers?: PrinterDevice[];
  department_kds?: DepartmentKDS[];
  signage_screens?: SignageScreen[];
  receipt_layout?: ReceiptLayoutConfig;
  signage_config?: DigitalSignageSettings;
  display_queue_calling?: number | null;
  display_queue_config?: {
    show_only_number?: boolean;
    show_header?: boolean;
    show_clock?: boolean;
    show_ready_list?: boolean;
    show_prep_list?: boolean;
    show_instruction?: boolean;
    number_size?: 'normal' | 'huge' | 'gigantic';
    theme?: 'dark-navy' | 'dark-pure' | 'light';
    sound_enabled?: boolean;
    call_label?: string;
    instruction_text?: string;
    show_prefix?: boolean;
  };
  dq_mode?: 'full' | 'products';
  dq_theme?: 'dark' | 'light';
  dq_cols?: number;
  dq_interval?: number;
  dq_hero?: boolean;
  dq_dayparting?: boolean;
  dq_animation?: 'kenburns' | 'slide' | 'fade';
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  category_id?: string;
  product_category_id?: string;
  quantity: number;
  price: number;
  customizations: string[];
  notes: string;
  removed_ingredients: string[];
  added_extras: ExtraAddition[];
  combo_selections: { [key: string]: string[] };
  combo_lines?: { group: string; name: string; price_delta: number }[];
  /** Compatibilità con ordini creati da build precedenti. */
  extras?: ExtraAddition[];
  selected_chips?: string[];
}

export interface Order {
  id: string;
  order_number: number;
  order_prefix?: string;
  items: OrderItem[];
  total_price: number;
  status: string;
  order_type: string;
  created_at: string;
  station_id?: string;
  station_name?: string;
  customer_type?: 'eat-in' | 'takeaway';
  /** Campi opzionali per ticket provenienti da installazioni precedenti. */
  table_number?: string | number;
  total_amount?: number;
}

export const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export function newSectionId(): string {
  return 'sec_' + Math.random().toString(36).substring(2, 9);
}

const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  restaurant_name: 'Il Mio Ristorante',
  logo: '',
  auto_print_courtesy: true,
  auto_print_kitchen: true,
  kitchen_display_enabled: true,
  printer_courtesy: '',
  printer_kitchen: '',
  known_printers: [],
  order_reset_mode: 'daily',
  reset_time: '06:00',
  current_order_number: 1,
  last_reset_at: null,
  custom_backend_url: '',
  language: 'en',
  station_topology: {
    role: 'mono',
    station_id: 'TOTEM-01',
    station_name: 'Totem principale',
    master_server_ip: '',
    master_server_port: 3000,
    auto_discovery: true,
    order_prefix: '',
    sync_interval_sec: 15,
  },
  printers: [],
  department_kds: [],
  signage_screens: [],
  receipt_layout: {
    language: 'auto',
    paper_width_mm: 58,
    header_title: '',
    header_subtitle: '',
    header_tax_id: '',
    show_order_number_big: true,
    show_order_type: true,
    show_date_time: true,
    show_subtotal: true,
    show_tax_summary: false,
    item_notes_enabled: true,
    footer_message: 'Grazie per la visita! Arrivederci.',
    footer_non_fiscal_note: 'DOCUMENTO NON FISCALE',
    custom_template_raw: '',
  },
  signage_config: {
    rotate_seconds: 8,
    ticker_enabled: true,
    ticker_text: '🍟 Menù Speciale del Giorno • Ingredienti freschi e selezionati • Chiedi al personale!',
    default_theme: 'chalkboard',
    default_transition: 'curtain-slide',
    auto_reorganize_unavailable: true,
    categories_config: {},
  },
  display_queue_calling: null,
  display_queue_config: {
    show_only_number: false,
    show_header: true,
    show_clock: true,
    show_ready_list: true,
    show_prep_list: true,
    show_instruction: true,
    number_size: 'gigantic',
    theme: 'dark-pure',
    sound_enabled: true,
    call_label: '',
    instruction_text: '',
    show_prefix: false,
  },
  dq_mode: 'full',
  dq_theme: 'dark',
  dq_cols: 4,
  dq_interval: 9,
  dq_hero: true,
  dq_dayparting: false,
  dq_animation: 'kenburns',
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Panini', description: 'I nostri panini gourmet', order_index: 1, image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=400' },
  { id: 'cat-2', name: 'Pizze', description: 'Pizze fresche e croccanti', order_index: 2, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=400' },
  { id: 'cat-3', name: 'Insalate', description: 'Insalate fresche e salutari', order_index: 3, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400' },
  { id: 'cat-4', name: 'Combo', description: 'I nostri menù combo', order_index: 4, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400' },
  { id: 'cat-5', name: 'Bevande', description: 'Bevande fresche', order_index: 5, image: 'https://images.unsplash.com/photo-1543253687-c931c8e01820?auto=format&fit=crop&q=80&w=400' },
  { id: 'cat-6', name: 'Dolci', description: 'Dolci e dessert', order_index: 6, image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=400' },
];

const DEFAULT_PRODUCTS: any[] = [
  {
    id: 'prod-1',
    category_id: 'cat-1',
    name: 'Hamburger Classico',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400',
    description: 'Carne di manzo 180g su pane brioche con lattuga, pomodoro e salsa',
    price: 8.5,
    product_type: 'simple',
    base_ingredients: ['Pane brioche', 'Carne di manzo', 'Lattuga', 'Pomodoro', 'Salsa'],
    extra_additions: [
      { name: 'Extra Formaggio', price: 1.0 },
      { name: 'Extra Bacon', price: 1.5 },
      { name: 'Uovo', price: 1.0 },
    ],
    order_index: 1,
  },
  {
    id: 'prod-2',
    category_id: 'cat-1',
    name: 'Cheeseburger Deluxe',
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&q=80&w=400',
    description: 'Hamburger con doppio cheddar e salsa speciale',
    price: 9.5,
    product_type: 'simple',
    base_ingredients: ['Pane brioche', 'Carne di manzo', 'Cheddar', 'Salsa speciale'],
    extra_additions: [
      { name: 'Extra Formaggio', price: 1.0 },
      { name: 'Extra Bacon', price: 1.5 },
    ],
    order_index: 2,
  },
  {
    id: 'prod-3',
    category_id: 'cat-2',
    name: 'Margherita',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=400',
    description: 'Pomodoro, mozzarella di bufala, basilico fresco',
    price: 7.0,
    product_type: 'simple',
    base_ingredients: ['Pomodoro', 'Mozzarella', 'Basilico'],
    extra_additions: [
      { name: 'Extra Mozzarella', price: 1.5 },
      { name: 'Bordo Ripieno', price: 2.0 },
    ],
    order_index: 1,
  },
  {
    id: 'prod-4',
    category_id: 'cat-2',
    name: 'Diavola',
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=400',
    description: 'Pomodoro, mozzarella, salame piccante',
    price: 8.5,
    product_type: 'simple',
    base_ingredients: ['Pomodoro', 'Mozzarella', 'Salame piccante'],
    extra_additions: [{ name: 'Extra Mozzarella', price: 1.5 }],
    order_index: 2,
  },
  {
    id: 'prod-5',
    category_id: 'cat-3',
    name: 'Caesar Salad',
    
    description: 'Lattuga romana, pollo grigliato, parmigiano e crostini',
    image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&q=80&w=400',
    price: 9.0,
    product_type: 'simple',
    base_ingredients: ['Lattuga romana', 'Pollo grigliato', 'Parmigiano', 'Crostini'],
    extra_additions: [{ name: 'Extra Pollo', price: 2.0 }],
    order_index: 1,
  },
  {
    id: 'prod-6',
    category_id: 'cat-4',
    name: 'Burger Combo',
    
    description: 'Hamburger + patatine + bevanda',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400',
    price: 13.5,
    product_type: 'combo',
    combo_groups: [
      {
        name: 'Scegli il Burger',
        min_selection: 1,
        max_selection: 1,
        options: [
          { name: 'Hamburger Classico',
    
    price_delta: 0.0 },
          { name: 'Cheeseburger', price_delta: 1.0 },
        ],
      },
      {
        name: 'Scegli la Bevanda',
        min_selection: 1,
        max_selection: 1,
        options: [
          { name: 'Coca Cola',
    
    price_delta: 0.0 },
          { name: 'Fanta', price_delta: 0.0 },
          { name: 'Acqua', price_delta: 0.0 },
        ],
      },
    ],
    order_index: 1,
  },
  {
    id: 'prod-7',
    category_id: 'cat-5',
    name: 'Coca Cola',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400',
    description: '330ml in lattina',
    price: 2.5,
    product_type: 'simple',
    order_index: 1,
  },
  {
    id: 'prod-8',
    category_id: 'cat-5',
    name: 'Acqua Naturale',
    
    description: '500ml',
    image: 'https://images.unsplash.com/photo-1543253687-c931c8e01820?auto=format&fit=crop&q=80&w=400',
    price: 1.5,
    product_type: 'simple',
    order_index: 2,
  },
  {
    id: 'prod-9',
    category_id: 'cat-6',
    name: 'Tiramisù',
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&q=80&w=400',
    description: 'Tiramisù classico fatto in casa',
    price: 5.5,
    product_type: 'simple',
    order_index: 1,
  },
];

export interface LocalDbState {
  settings: Settings;
  categories: Category[];
  products: Product[];
  orders: Order[];
  global_groups: GlobalOptionGroup[];
  translation_glossary: TranslationGlossary;
}

const STORAGE_KEY = 'totem_local_db_v1';
const NATIVE_DATABASE_FILE = 'totem_local_db_v1.json';
const NATIVE_DATABASE_BACKUP_FILE = 'totem_local_db_v1.previous.json';

/**
 * AsyncStorage resta il fallback web e di compatibilità. Su Android il catalogo
 * completo (incluse immagini data-URI) viene salvato anche nella directory
 * documenti dell'app, che non ha il limite pratico della singola chiave AsyncStorage.
 */
function nativeDatabaseUri(fileName = NATIVE_DATABASE_FILE): string | null {
  if (Platform.OS === 'web') return null;
  const directory = FileSystem.documentDirectory;
  return directory ? `${directory}${fileName}` : null;
}

async function readStoredDatabase(): Promise<string | null> {
  const candidates = [
    nativeDatabaseUri(NATIVE_DATABASE_FILE),
    nativeDatabaseUri(NATIVE_DATABASE_BACKUP_FILE),
  ].filter((value): value is string => Boolean(value));

  for (const uri of candidates) {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists || !info.size) continue;
      const value = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      JSON.parse(value);
      return value;
    } catch (error) {
      console.warn('Unable to read persistent catalog file:', error);
    }
  }

  return AsyncStorage.getItem(STORAGE_KEY);
}

async function writeStoredDatabase(value: string): Promise<void> {
  let nativePersisted = false;
  let nativeError: any = null;
  const primaryUri = nativeDatabaseUri(NATIVE_DATABASE_FILE);
  const backupUri = nativeDatabaseUri(NATIVE_DATABASE_BACKUP_FILE);

  if (primaryUri) {
    const temporaryUri = `${primaryUri}.next`;
    try {
      await FileSystem.writeAsStringAsync(temporaryUri, value, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const check = await FileSystem.readAsStringAsync(temporaryUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      if (check !== value) throw new Error('Persistent catalog verification failed');
      const current = await FileSystem.getInfoAsync(primaryUri);
      if (current.exists && backupUri) {
        await FileSystem.copyAsync({ from: primaryUri, to: backupUri });
      }
      await FileSystem.moveAsync({ from: temporaryUri, to: primaryUri });
      nativePersisted = true;
    } catch (error) {
      nativeError = error;
      try { await FileSystem.deleteAsync(temporaryUri, { idempotent: true }); } catch {}
      console.warn('Unable to persist catalog to app documents:', error);
    }
  }

  let asyncStorageSaved = false;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, value);
    asyncStorageSaved = true;
  } catch (error) {
    console.warn('AsyncStorage catalog mirror unavailable; persistent file retained:', error);
  }

  if (!nativePersisted && !asyncStorageSaved && Platform.OS !== 'web') {
    throw new Error(nativeError?.message || 'Il catalogo non è stato salvato nella memoria persistente del dispositivo.');
  }
}

let localDb: LocalDbState = {
  settings: DEFAULT_SETTINGS,
  categories: DEFAULT_CATEGORIES,
  products: DEFAULT_PRODUCTS,
  orders: [],
  global_groups: [],
  translation_glossary: {}
};

let isLoaded = false;

function normalizeOrderIndexes<T extends { order_index?: number }>(items: T[]): T[] {
  return [...items]
    .sort((a, b) => Number(a.order_index ?? 0) - Number(b.order_index ?? 0))
    .map((item, order_index) => ({ ...item, order_index }));
}

/** Mantiene una posizione consecutiva per ogni categoria, senza cambiare il contenuto dei prodotti legacy. */
function normalizeProductOrderIndexes(products: Product[]): Product[] {
  const grouped = new Map<string, Product[]>();
  for (const product of products) {
    const key = product.category_id || '';
    grouped.set(key, [...(grouped.get(key) || []), product]);
  }

  const positions = new Map<string, number>();
  for (const group of grouped.values()) {
    group
      .sort((a, b) => {
        const aOrder = Number.isFinite(Number(a.order_index)) ? Number(a.order_index) : Number.MAX_SAFE_INTEGER;
        const bOrder = Number.isFinite(Number(b.order_index)) ? Number(b.order_index) : Number.MAX_SAFE_INTEGER;
        return aOrder - bOrder;
      })
      .forEach((product, orderIndex) => positions.set(product.id, orderIndex));
  }

  return products.map((product) => ({ ...product, order_index: positions.get(product.id) ?? 0 }));
}

function productsSortedForDisplay(products: Product[]): Product[] {
  const categoryPositions = new Map(
    localDb.categories.map((category, index) => [category.id, Number(category.order_index ?? index)])
  );
  return clone(products).sort((a, b) => {
    const categoryDiff = (categoryPositions.get(a.category_id) ?? Number.MAX_SAFE_INTEGER) -
      (categoryPositions.get(b.category_id) ?? Number.MAX_SAFE_INTEGER);
    if (categoryDiff !== 0) return categoryDiff;
    return Number(a.order_index ?? 0) - Number(b.order_index ?? 0);
  });
}

const ORDER_RESET_MODES = new Set(['daily', 'manual', 'never']);
const RESET_TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function getValidResetTime(value: unknown): string {
  const time = typeof value === 'string' ? value.trim() : '';
  return RESET_TIME_PATTERN.test(time) ? time : '06:00';
}

export async function checkAndApplyAutoReset(): Promise<boolean> {
  if (!localDb || !localDb.settings) return false;
  const mode = localDb.settings.order_reset_mode || 'daily';
  if (mode !== 'daily') return false;

  const timeParts = getValidResetTime(localDb.settings.reset_time).split(':');
  const resetH = parseInt(timeParts[0], 10);
  const resetM = parseInt(timeParts[1], 10);

  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), resetH, resetM, 0, 0);
  if (now.getTime() < cutoff.getTime()) {
    cutoff.setDate(cutoff.getDate() - 1);
  }
  const cutoffTimestamp = cutoff.getTime();

  let lastResetTimestamp = 0;
  if (localDb.settings.last_reset_at) {
    const parsed = new Date(localDb.settings.last_reset_at).getTime();
    if (!isNaN(parsed)) {
      lastResetTimestamp = parsed;
    }
  }

  if (lastResetTimestamp < cutoffTimestamp) {
    localDb.settings.current_order_number = 1;
    localDb.settings.last_reset_at = now.toISOString();
    // Il reset riguarda esclusivamente il contatore: lo storico KDS e i report
    // devono rimanere disponibili anche dopo il cambio giornata.
    await saveLocalDb();
    notifyDbChanged('orders');
    notifyDbChanged('settings');
    return true;
  }
  return false;
}

export async function ensureLocalDbLoaded() {
  if (isLoaded) return;
  try {
    const raw = await readStoredDatabase();
    if (raw) {
      const parsed = JSON.parse(raw);
      localDb = {
        settings: {
          ...DEFAULT_SETTINGS,
          ...(parsed.settings || {}),
          logo: sanitizeImageUri(parsed.settings?.logo) || parsed.settings?.logo || '',
        },
        // Un array vuoto è un catalogo intenzionalmente vuoto: non va mai
        // rimpiazzato dai dati demo al successivo avvio.
        categories: Array.isArray(parsed.categories)
          ? normalizeOrderIndexes(parsed.categories.map((c: any) => {
              let img = sanitizeImageUri(c.image);
              if (!img || (typeof img === 'string' && img.trim() === '') || img.includes('placeholder')) {
                const def = DEFAULT_CATEGORIES.find(d => d.id === c.id);
                if (def && def.image) img = def.image;
              }
              return {
                ...c,
                image: img || '',
              }
            }))
          : clone(DEFAULT_CATEGORIES),
        products: Array.isArray(parsed.products)
          ? normalizeProductOrderIndexes(parsed.products.map((p: any) => {
              let img = sanitizeImageUri(p.image);
              if (!img || (typeof img === 'string' && img.trim() === '') || img.includes('placeholder')) {
                const def = DEFAULT_PRODUCTS.find(d => d.id === p.id);
                if (def && def.image) img = def.image;
              }
              return {
                ...p,
                image: img || '',
              }
            }))
          : clone(DEFAULT_PRODUCTS),
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        global_groups: Array.isArray(parsed.global_groups) ? parsed.global_groups : [],
        translation_glossary: parsed.translation_glossary || {}
      };
    } else {
      await saveLocalDb();
    }

    // Le installazioni precedenti conservavano le credenziali nel database/backup.
    // Al primo avvio compatibile le trasferiamo in SecureStore come derivati PBKDF2
    // e rimuoviamo immediatamente ogni valore in chiaro dal catalogo persistente.
    const legacySettings = localDb.settings || ({} as Settings);
    const hasLegacySecrets = Boolean(legacySettings.admin_username || legacySettings.admin_password || legacySettings.admin_pin);
    if (hasLegacySecrets) {
      await migrateLegacyAdminCredentials({
        username: legacySettings.admin_username,
        password: legacySettings.admin_password,
        pin: legacySettings.admin_pin,
      });
      localDb.settings = await clearLegacyAdminSecretsFromSettings(localDb.settings);
      await saveLocalDb();
    }
  } catch (e) {
    console.warn('Error loading local db:', e);
  }
  isLoaded = true;
  await checkAndApplyAutoReset();
}

export async function saveLocalDb() {
  const serialized = JSON.stringify(localDb);
  await writeStoredDatabase(serialized);
}

export type DbChangeType = 'products' | 'categories' | 'groups' | 'settings' | 'orders' | 'glossary' | 'all';
export type DbChangeListener = (type: DbChangeType) => void;
const dbChangeListeners = new Set<DbChangeListener>();

export function subscribeToDbChanges(listener: DbChangeListener): () => void {
  dbChangeListeners.add(listener);
  return () => {
    dbChangeListeners.delete(listener);
  };
}

export function notifyDbChanged(type: DbChangeType = 'all') {
  dbChangeListeners.forEach((fn) => {
    try {
      fn(type);
    } catch (e) {
      console.warn('[DbChange] listener error:', e);
    }
  });
}

export function getBackendBaseUrl(): string {
  const custom = localDb.settings?.custom_backend_url?.trim();
  if (custom) return custom.replace(/\/+$/, '');
  return '';
}

export function getRemoteAdminUrl(localIp?: string): string {
  // Leggi l'IP dal localDb se disponibile, altrimenti stringa vuota (non hardcoded)
  const custom = localDb?.settings?.custom_backend_url?.trim();
  if (custom) {
    const clean = custom.replace(/\/+$/, '');
    if (clean.endsWith('/remote') || clean.endsWith('/admin')) {
      return `${clean}/`;
    }
    return `${clean}/remote/`;
  }
  const cleanIp = (localIp || '').trim();
  if (cleanIp && cleanIp !== 'localhost' && cleanIp !== '127.0.0.1' && cleanIp !== '0.0.0.0' && cleanIp !== 'IP_DEL_TABLET' && !cleanIp.startsWith('0.')) {
    return `http://${cleanIp}:3000/remote/`;
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/remote/`;
  }
  return '';
}

async function getRemoteJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const base = getBackendBaseUrl();
  if (!base) throw new Error('No backend URL configured');
  const res = await fetch(`${base}${path}`, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function ensureProductSections(product: Product, includeGlobals: boolean = true): UiSection[] {
  const globals = localDb.global_groups || [];
  const injectedGlobals: UiSection[] = includeGlobals ? (product.global_group_ids || [])
    .map(gid => globals.find(g => g.id === gid))
    .filter(Boolean)
    .map((g, i) => ({
      id: "global_" + g!.id,
      type: g!.type,
      title: g!.title,
      enabled: true,
      order: 1000 + i,
      items: g!.items,
      chips: g!.chips,
      extras: g!.extras,
      options: g!.options,
      min_selection: g!.min_selection,
      max_selection: g!.max_selection
    } as UiSection)) : [];

  if (product.ui_sections && product.ui_sections.length > 0) {
    return [...product.ui_sections.map((s, i) => ({ ...s, order: s.order ?? i })), ...injectedGlobals].sort((a, b) => a.order - b.order);
  }

  const sections: UiSection[] = [];
  let order = 0;

  if (product.base_ingredients && product.base_ingredients.length > 0) {
    sections.push({
      id: newSectionId(),
      type: 'base_remove',
      title: 'Ingredienti Base (Rimuovi)',
      enabled: true,
      order: order++,
      items: [...product.base_ingredients]
    });
  }

  if (product.extra_additions && product.extra_additions.length > 0) {
    sections.push({
      id: newSectionId(),
      type: 'paid_extras',
      title: 'Extra e Aggiunte',
      enabled: true,
      order: order++,
      extras: [...product.extra_additions]
    });
  }

  if (product.combo_groups && product.combo_groups.length > 0) {
    product.combo_groups.forEach(g => {
      sections.push({
        id: newSectionId(),
        type: 'choice_group',
        title: g.name,
        enabled: true,
        order: order++,
        min_selection: g.min_selection,
        max_selection: g.max_selection,
        options: [...g.options]
      });
    });
  }

  return [...sections, ...injectedGlobals].sort((a, b) => a.order - b.order);
}

export function syncLegacyFromSections(sections: UiSection[]): {
  base_ingredients: string[];
  extra_additions: ExtraAddition[];
  combo_groups: { name: string; min_selection: number; max_selection: number; options: ComboGroupOption[] }[];
};
export function syncLegacyFromSections(product: Product, sections: UiSection[]): void;
export function syncLegacyFromSections(arg1: Product | UiSection[], arg2?: UiSection[]): any {
  if (Array.isArray(arg1)) {
    const ownSections = arg1.filter(s => !s.id.startsWith('global_'));
    const baseSec = ownSections.find(s => s.type === 'base_remove' && s.enabled);
    const extraSec = ownSections.find(s => s.type === 'paid_extras' && s.enabled);
    const choiceSecs = ownSections.filter(s => s.type === 'choice_group' && s.enabled);
    return {
      base_ingredients: baseSec ? (baseSec.items || []) : [],
      extra_additions: extraSec ? (extraSec.extras || []) : [],
      combo_groups: choiceSecs.map(c => ({
        name: c.title,
        min_selection: c.min_selection ?? 1,
        max_selection: c.max_selection ?? 1,
        options: c.options || []
      }))
    };
  } else if (arg1 && arg2) {
    const ownSections = arg2.filter(s => !s.id.startsWith('global_'));
    arg1.ui_sections = ownSections;
    
    const baseSec = ownSections.find(s => s.type === 'base_remove' && s.enabled);
    arg1.base_ingredients = baseSec ? (baseSec.items || []) : [];

    const extraSec = ownSections.find(s => s.type === 'paid_extras' && s.enabled);
    arg1.extra_additions = extraSec ? (extraSec.extras || []) : [];

    const choiceSecs = ownSections.filter(s => s.type === 'choice_group' && s.enabled);
    arg1.combo_groups = choiceSecs.map(c => ({
      name: c.title,
      min_selection: c.min_selection ?? 1,
      max_selection: c.max_selection ?? 1,
      options: c.options || []
    }));
  }
}

function normalizeKnownPrinters(list: any[]): string[] {
  const out: string[] = [];
  for (const p of list || []) {
    const key = typeof p === 'string' ? p.trim() : String(p?.address || p?.name || p?.id || '').trim();
    if (key && !out.includes(key)) out.push(key);
  }
  return out;
}

async function mergePrinterSidecarIntoSettings() {
  try {
    const cfgRaw = await AsyncStorage.getItem('totem_printer_config');
    const courtesy = await AsyncStorage.getItem('totem_printer_address');
    const kitchen = await AsyncStorage.getItem('totem_printer_kitchen_address');
    let cfg: any = null;
    try { if (cfgRaw) cfg = JSON.parse(cfgRaw); } catch {}
    const nextCourtesy = localDb.settings.printer_courtesy || courtesy || cfg?.printer_courtesy || '';
    const nextKitchen = localDb.settings.printer_kitchen || kitchen || cfg?.printer_kitchen || '';
    const nextKnown = normalizeKnownPrinters([
      ...(localDb.settings.known_printers || []),
      ...(cfg?.known_printers || []),
      nextCourtesy,
      nextKitchen,
    ]);
    localDb.settings.printer_courtesy = nextCourtesy;
    localDb.settings.printer_kitchen = nextKitchen;
    localDb.settings.known_printers = nextKnown;
  } catch (e) {
    console.warn('mergePrinterSidecarIntoSettings failed:', e);
  }
}

async function persistPrinterSidecarFromSettings() {
  try {
    const courtesy = localDb.settings.printer_courtesy || '';
    const kitchen = localDb.settings.printer_kitchen || '';
    const known = normalizeKnownPrinters(localDb.settings.known_printers || []);
    localDb.settings.known_printers = known;
    await AsyncStorage.setItem('totem_printer_address', courtesy);
    await AsyncStorage.setItem('totem_printer_kitchen_address', kitchen);
    await AsyncStorage.setItem('totem_printer_config', JSON.stringify({
      printer_courtesy: courtesy,
      printer_kitchen: kitchen,
      known_printers: known,
    }));
  } catch (e) {
    console.warn('persistPrinterSidecarFromSettings failed:', e);
  }
}

export const getTranslationGlossary = async (): Promise<TranslationGlossary> => {
  await ensureLocalDbLoaded();
  return clone(localDb.translation_glossary || {});
};

export const mergeTranslationGlossary = async (entries: TranslationGlossary): Promise<TranslationGlossary> => {
  await ensureLocalDbLoaded();
  const next = { ...(localDb.translation_glossary || {}) };
  for (const [source, translations] of Object.entries(entries || {})) {
    const key = String(source || '').trim();
    if (!key || !translations || typeof translations !== 'object') continue;
    next[key] = { ...(next[key] || {}), ...translations };
  }
  localDb.translation_glossary = next;
  await saveLocalDb();
  notifyDbChanged('glossary');
  return clone(localDb.translation_glossary);
};

export const updateGlossaryTranslations = async (): Promise<{ count: number; glossary: TranslationGlossary }> => {
  await ensureLocalDbLoaded();
  const { CUSTOMER_MENU_TRANSLATIONS, translateCustomerMenuText, fetchFullGlossaryTermOnline } = await import('../utils/customerMenuTranslation');
  
  const next: TranslationGlossary = { ...(localDb.translation_glossary || {}) };
  
  // Aggiungi tutto il dizionario integrato
  for (const [source, trans] of Object.entries(CUSTOMER_MENU_TRANSLATIONS)) {
    if (!next[source]) {
      next[source] = { ...trans };
    }
  }

  // Raccogli tutti i termini unici presenti nel database
  const terms = new Set<string>();
  
  // Categorie
  for (const cat of localDb.categories || []) {
    if (cat.name) terms.add(cat.name.trim());
    if (cat.description) terms.add(cat.description.trim());
  }

  // Prodotti
  for (const prod of localDb.products || []) {
    if (prod.name) terms.add(prod.name.trim());
    if (prod.description) terms.add(prod.description.trim());
    (prod.allergens || []).forEach(a => a && terms.add(a.trim()));
    (prod.base_ingredients || []).forEach(i => i && terms.add(i.trim()));
    (prod.extra_additions || []).forEach(e => e.name && terms.add(e.name.trim()));
    (prod.customization_options || []).forEach((option) => {
      const label = String(option || '').trim();
      if (label) terms.add(label);
    });
    (prod.combo_groups || []).forEach(cg => {
      if (cg.name) terms.add(cg.name.trim());
      (cg.options || []).forEach(o => o.name && terms.add(o.name.trim()));
    });
    (prod.ui_sections || []).forEach(s => {
      if (s.title) terms.add(s.title.trim());
      (s.options || []).forEach(o => o.name && terms.add(o.name.trim()));
    });
  }

  // Gruppi globali
  for (const gg of localDb.global_groups || []) {
    if (gg.name) terms.add(gg.name.trim());
    (gg.options || []).forEach(o => o.name && terms.add(o.name.trim()));
  }

  // Identifica i termini che necessitano di traduzione o arricchimento online
  const termsList = Array.from(terms).filter(Boolean);
  const termsToFetch: string[] = [];

  for (const term of termsList) {
    if (!next[term]) {
      // Inizializza con fallback locale
      next[term] = {
        it: term,
        en: translateCustomerMenuText(term, 'en'),
        fr: translateCustomerMenuText(term, 'fr'),
        es: translateCustomerMenuText(term, 'es'),
        de: translateCustomerMenuText(term, 'de'),
      };
      termsToFetch.push(term);
    } else {
      // Controlla se mancano lingue
      const entry = next[term];
      if (!entry.en || !entry.fr || !entry.es || !entry.de || entry.en === term || entry.fr === term || entry.es === term || entry.de === term) {
        termsToFetch.push(term);
      }
    }
  }

  // Esegui lookup online a piccoli blocchi concorrenti (senza bloccare in caso di timeout/offline)
  if (termsToFetch.length > 0) {
    const BATCH_SIZE = 3;
    for (let i = 0; i < termsToFetch.length; i += BATCH_SIZE) {
      const batch = termsToFetch.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (term) => {
          try {
            const enriched = await fetchFullGlossaryTermOnline(term, next[term]);
            if (enriched) {
              next[term] = { ...(next[term] || {}), ...enriched };
            }
          } catch {
            // Se offline o errore, mantiene le traduzioni già generate dal fallback
          }
        })
      );
    }
  }

  localDb.translation_glossary = next;
  await saveLocalDb();
  notifyDbChanged('glossary');
  return { count: Object.keys(next).length, glossary: clone(localDb.translation_glossary) };
};

export const getSettings = async (): Promise<Settings> => {
  await ensureLocalDbLoaded();
  await mergePrinterSidecarIntoSettings();
  return clone(localDb.settings);
};

export const updateSettings = async (data: Partial<Settings>): Promise<Settings> => {
  await ensureLocalDbLoaded();
  const next = { ...data };
  // Password, PIN e username non fanno parte delle impostazioni esportabili: vengono
  // gestiti soltanto dal modulo credenziali protetto e non possono essere aggiornati
  // tramite un generico payload impostazioni.
  delete next.admin_pin;
  delete next.admin_username;
  delete next.admin_password;
  if (next.known_printers) {
    next.known_printers = normalizeKnownPrinters(next.known_printers);
  }
  if (next.order_reset_mode !== undefined && !ORDER_RESET_MODES.has(next.order_reset_mode)) {
    throw new Error('Modalità di reset ordini non valida');
  }
  if (next.reset_time !== undefined) {
    const resetTime = typeof next.reset_time === 'string' ? next.reset_time.trim() : '';
    if (!RESET_TIME_PATTERN.test(resetTime)) {
      throw new Error('L’orario di reset deve avere formato HH:MM');
    }
    next.reset_time = resetTime;
  }
  if (next.logo !== undefined) {
    next.logo = sanitizeImageUri(next.logo) ?? '';
  }
  if (next.station_topology && localDb.settings.station_topology) {
    next.station_topology = { ...localDb.settings.station_topology, ...next.station_topology };
  }
  if (next.display_queue_config) {
    next.display_queue_config = {
      ...(localDb.settings.display_queue_config || DEFAULT_SETTINGS.display_queue_config || {}),
      ...next.display_queue_config,
    };
  }
  localDb.settings = { ...localDb.settings, ...next };
  if (localDb.settings.known_printers) {
    localDb.settings.known_printers = normalizeKnownPrinters(localDb.settings.known_printers);
  }
  if (next.station_topology) {
    try {
      const topo = localDb.settings.station_topology;
      await AsyncStorage.setItem('TOTEM_MULTI_CONFIG', JSON.stringify({
        role: topo?.role || 'mono',
        stationId: topo?.station_id,
        stationName: topo?.station_name,
        masterHost: topo?.master_server_ip,
        masterPort: topo?.master_server_port || 3000,
        orderPrefix: topo?.order_prefix || '',
      }));
    } catch {}
  }
  await saveLocalDb();
  await persistPrinterSidecarFromSettings();
  notifyDbChanged('settings');
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error('Save verification failed');
  } catch (e) {
    console.error('Settings save verification failed:', e);
  }
  return clone(localDb.settings);
};

export const getCategories = async (): Promise<Category[]> => {
  await ensureLocalDbLoaded();
  return clone(localDb.categories).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
};

export const getProducts = async (): Promise<Product[]> => {
  await ensureLocalDbLoaded();
  return productsSortedForDisplay(localDb.products);
};

export const getProductsByCategory = async (categoryId: string): Promise<Product[]> => {
  await ensureLocalDbLoaded();
  return clone(localDb.products
    .filter((product) => product.category_id === categoryId)
    .sort((a, b) => Number(a.order_index ?? 0) - Number(b.order_index ?? 0)));
};

export const getNextOrderNumber = async (): Promise<number> => {
  await ensureLocalDbLoaded();
  await checkAndApplyAutoReset();
  try {
    const rawMulti = await AsyncStorage.getItem('TOTEM_MULTI_CONFIG');
    if (rawMulti) {
      const multi = JSON.parse(rawMulti);
      if (multi?.role === 'satellite' && multi.masterHost) {
        let base = String(multi.masterHost).trim();
        if (!base.startsWith('http://') && !base.startsWith('https://')) base = `http://${base}`;
        if (!/:\d+$/.test(base)) base = `${base}:3000`;
        const res = await fetch(`${base}/api/orders/next-number`, { headers: { Accept: 'application/json' } });
        if (res.ok) {
          const data = await res.json();
          if (data?.order_number && Number.isFinite(Number(data.order_number))) {
            return Number(data.order_number);
          }
        }
      }
    }
  } catch (e) {
    console.warn('[MultiTotem] Next number from master failed, using local:', e);
  }
  const n = localDb.settings.current_order_number || 1;
  localDb.settings.current_order_number = n + 1;
  await saveLocalDb();
  return n;
};

export const createOrder = async (items: OrderItem[], totalPrice: number, orderType = 'totem'): Promise<Order> => {
  await ensureLocalDbLoaded();
  await checkAndApplyAutoReset();
  
  let orderNumber = localDb.settings.current_order_number || 1;
  let orderPrefix = (localDb.settings as any).order_prefix || '';

  try {
    const rawMulti = await AsyncStorage.getItem('TOTEM_MULTI_CONFIG');
    if (rawMulti) {
      const multi = JSON.parse(rawMulti);
      if (multi?.orderPrefix) {
        orderPrefix = multi.orderPrefix;
      }
      if (multi?.role === 'satellite' && multi.masterHost) {
        let base = String(multi.masterHost).trim();
        if (!base.startsWith('http://') && !base.startsWith('https://')) base = `http://${base}`;
        if (!/:\d+$/.test(base)) base = `${base}:3000`;
        const res = await fetch(`${base}/api/orders/next-number`, { headers: { Accept: 'application/json' } });
        if (res.ok) {
          const data = await res.json();
          if (data?.order_number && Number.isFinite(Number(data.order_number))) {
            orderNumber = Number(data.order_number);
          } else {
            localDb.settings.current_order_number = orderNumber + 1;
          }
        } else {
          localDb.settings.current_order_number = orderNumber + 1;
        }
      } else {
        localDb.settings.current_order_number = orderNumber + 1;
      }
    } else {
      localDb.settings.current_order_number = orderNumber + 1;
    }
  } catch {
    localDb.settings.current_order_number = orderNumber + 1;
  }

  // Enrich items with category_id if missing from local products
  const enrichedItems = items.map((it) => {
    const catId = (it as any).category_id || (it as any).product_category_id;
    if (!catId && it.product_id) {
      const prod = (localDb.products || []).find((p) => p.id === it.product_id);
      if (prod?.category_id) {
        return {
          ...it,
          category_id: prod.category_id,
          product_category_id: prod.category_id,
        };
      }
    }
    return it;
  });

  const ord: Order = {
    id: 'ord_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
    order_number: orderNumber,
    order_prefix: orderPrefix ? String(orderPrefix).trim() : undefined,
    items: enrichedItems,
    total_price: totalPrice,
    status: 'pending',
    order_type: orderType,
    created_at: new Date().toISOString(),
    station_id: localDb.settings.station_topology?.station_id,
    station_name: localDb.settings.station_topology?.station_name,
  };
  localDb.orders = [ord, ...localDb.orders];
  await saveLocalDb();
  notifyDbChanged('orders');

  // Push to master in background if satellite
  try {
    const rawMulti = await AsyncStorage.getItem('TOTEM_MULTI_CONFIG');
    if (rawMulti) {
      const multi = JSON.parse(rawMulti);
      if (multi?.role === 'satellite' && multi.masterHost) {
        let base = String(multi.masterHost).trim();
        if (!base.startsWith('http://') && !base.startsWith('https://')) base = `http://${base}`;
        if (!/:\d+$/.test(base)) base = `${base}:3000`;
        void fetch(`${base}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_number: ord.order_number,
            order_prefix: ord.order_prefix,
            items: ord.items,
            total_price: ord.total_price,
            order_type: ord.order_type,
          }),
        }).catch(() => {});
      }
    }
  } catch {}

  return clone(ord);
};

/** Verifica il PIN senza mai restituirlo al chiamante. */
export const verifyAdminPin = async (pin: string): Promise<boolean> => {
  await ensureLocalDbLoaded();
  try {
    await authenticateAdminPin(pin);
    return true;
  } catch {
    return false;
  }
};

/** Crea una sessione locale a scadenza dopo la verifica hashata del PIN. */
export const adminPinLogin = async (pin: string): Promise<string> => {
  await ensureLocalDbLoaded();
  return authenticateAdminPin(pin);
};

export const getAdminCredentialStatus = async () => {
  await ensureLocalDbLoaded();
  return getSecureAdminCredentialStatus();
};

export const registerAdminSessionRevoker = (revoker: () => void | Promise<void>): (() => void) =>
  registerAdminSessionRevokerSecure(revoker);

export const isAdminSessionValid = async (token: string): Promise<boolean> =>
  isSecureAdminSessionValid(token);

export const configureInitialAdminCredentials = async (
  pinOrUsername: string,
  maybePassword?: string,
  maybePin?: string
): Promise<{ recoveryCode: string; token: string }> => {
  await ensureLocalDbLoaded();
  const result = await configureInitialAdminCredentialsSecure(pinOrUsername, maybePassword, maybePin);
  notifyDbChanged('settings');
  return result;
};

export const generateRecoveryCode = async (): Promise<{ recoveryCode: string }> => {
  await ensureLocalDbLoaded();
  const result = await generateRecoveryCodeSecure();
  notifyDbChanged('settings');
  return result;
};

export const resetAdminCredentialsWithRecoveryCode = async (
  recoveryCode: string,
  pinOrUsername: string,
  maybePassword?: string,
  maybePin?: string
): Promise<{ recoveryCode: string; token: string }> => {
  await ensureLocalDbLoaded();
  const result = await resetAdminCredentialsWithRecoveryCodeSecure(recoveryCode, pinOrUsername, maybePassword, maybePin);
  notifyDbChanged('settings');
  return result;
};

export const getOrders = async (): Promise<Order[]> => {
  await ensureLocalDbLoaded();
  await checkAndApplyAutoReset();
  return clone(localDb.orders).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const updateOrderStatus = async (id: string, status: string): Promise<Order> => {
  await ensureLocalDbLoaded();
  const idx = localDb.orders.findIndex(o => o.id === id);
  if (idx !== -1) {
    localDb.orders[idx] = { ...localDb.orders[idx], status };
    await saveLocalDb();
    notifyDbChanged('orders');
    return clone(localDb.orders[idx]);
  }
  throw new Error('Order not found');
};

export const adminLogin = async (username: string, password: string): Promise<string> => {
  await ensureLocalDbLoaded();
  return authenticateAdminCredentials(username, password);
};

export const getAllProductsAdmin = async (): Promise<Product[]> => {
  await ensureLocalDbLoaded();
  return productsSortedForDisplay(localDb.products);
};

export const createProduct = async (product: Partial<Product>): Promise<Product> => {
  await ensureLocalDbLoaded();
  const assignedId = (product.id && typeof product.id === 'string' && product.id.trim().length > 0)
    ? product.id.trim()
    : ('prod_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6));

  let isAvail = true;
  if (product.available !== undefined) {
    if (typeof product.available === 'string') {
      isAvail = (product.available as any) === 'true' || (product.available as any) === '1';
    } else {
      isAvail = Boolean(product.available);
    }
  }

  const productCategoryId = product.category_id || '';
  const siblings = localDb.products
    .filter((candidate) => candidate.category_id === productCategoryId)
    .sort((a, b) => Number(a.order_index ?? 0) - Number(b.order_index ?? 0));
  const requestedPosition = Number(product.order_index);
  const position = Number.isFinite(requestedPosition)
    ? Math.max(0, Math.min(Math.trunc(requestedPosition), siblings.length))
    : siblings.length;
  const newProduct: Product = {
    ...product,
    id: assignedId,
    name: product.name || '',
    description: product.description || '',
    price: Number(product.price) || 0,
    category_id: productCategoryId,
    available: isAvail,
    allergens: product.allergens || [],
    customization_options: product.customization_options || [],
    product_type: product.product_type || 'simple',
    base_ingredients: product.base_ingredients || [],
    extra_additions: product.extra_additions || [],
    combo_groups: product.combo_groups || [],
    ui_sections: product.ui_sections || [],
    global_group_ids: product.global_group_ids || [],
    image: sanitizeImageUri(product.image) || product.image || '',
    order_index: position,
  };
  const positionedSiblings = [...siblings];
  positionedSiblings.splice(position, 0, newProduct);
  localDb.products = normalizeProductOrderIndexes([
    ...localDb.products.filter((candidate) => candidate.category_id !== productCategoryId),
    ...positionedSiblings,
  ]);
  await saveLocalDb();
  notifyDbChanged('products');
  return clone(newProduct);
};

export const updateProduct = async (id: string, product: Partial<Product>): Promise<Product> => {
  await ensureLocalDbLoaded();
  const existing = localDb.products.find((candidate) => candidate.id === id);
  if (!existing) throw new Error('Product not found');

  const normalized = { ...product };
  if (normalized.image !== undefined) {
    normalized.image = sanitizeImageUri(normalized.image) ?? '';
  }
  if (normalized.available !== undefined) {
    if (typeof normalized.available === 'string') {
      normalized.available = (normalized.available as any) === 'true' || (normalized.available as any) === '1';
    } else {
      normalized.available = Boolean(normalized.available);
    }
  }

  const nextProduct: Product = { ...existing, ...normalized, id };
  const remaining = localDb.products.filter((candidate) => candidate.id !== id);
  const siblings = remaining
    .filter((candidate) => candidate.category_id === nextProduct.category_id)
    .sort((a, b) => Number(a.order_index ?? 0) - Number(b.order_index ?? 0));
  const requestedPosition = Number(normalized.order_index);
  const fallbackPosition = nextProduct.category_id === existing.category_id
    ? Number(existing.order_index ?? siblings.length)
    : siblings.length;
  const position = Number.isFinite(requestedPosition)
    ? Math.max(0, Math.min(Math.trunc(requestedPosition), siblings.length))
    : Math.max(0, Math.min(fallbackPosition, siblings.length));
  siblings.splice(position, 0, { ...nextProduct, order_index: position });
  localDb.products = normalizeProductOrderIndexes([
    ...remaining.filter((candidate) => candidate.category_id !== nextProduct.category_id),
    ...siblings,
  ]);
  await saveLocalDb();
  notifyDbChanged('products');
  const updated = localDb.products.find((candidate) => candidate.id === id);
  if (!updated) throw new Error('Product not found');
  return clone(updated);
};

export const deleteProduct = async (id: string): Promise<void> => {
  await ensureLocalDbLoaded();
  localDb.products = normalizeProductOrderIndexes(localDb.products.filter((product) => product.id !== id));
  await saveLocalDb();
  notifyDbChanged('products');
};

/** Scambia un prodotto con il vicino nella stessa categoria e conserva l'ordine dopo il riavvio. */
export const moveProduct = async (id: string, direction: 'up' | 'down'): Promise<Product[]> => {
  await ensureLocalDbLoaded();
  const product = localDb.products.find((candidate) => candidate.id === id);
  if (!product) throw new Error('Product not found');
  const siblings = localDb.products
    .filter((candidate) => candidate.category_id === product.category_id)
    .sort((a, b) => Number(a.order_index ?? 0) - Number(b.order_index ?? 0));
  const index = siblings.findIndex((candidate) => candidate.id === id);
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= siblings.length) return clone(siblings);

  [siblings[index], siblings[targetIndex]] = [siblings[targetIndex], siblings[index]];
  const positions = new Map(siblings.map((candidate, order_index) => [candidate.id, order_index]));
  localDb.products = localDb.products.map((candidate) => positions.has(candidate.id)
    ? { ...candidate, order_index: positions.get(candidate.id) }
    : candidate);
  localDb.products = normalizeProductOrderIndexes(localDb.products);
  await saveLocalDb();
  notifyDbChanged('products');
  return clone(siblings.map((candidate, order_index) => ({ ...candidate, order_index })));
};

export const createCategory = async (cat: Partial<Category>): Promise<Category> => {
  await ensureLocalDbLoaded();
  const assignedId = (cat.id && typeof cat.id === 'string' && cat.id.trim().length > 0)
    ? cat.id.trim()
    : ('cat_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6));
  const requestedPosition = Number(cat.order_index);
  const position = Number.isFinite(requestedPosition)
    ? Math.max(0, Math.min(Math.trunc(requestedPosition), localDb.categories.length))
    : localDb.categories.length;
  const newCat: Category = {
    ...cat,
    id: assignedId,
    name: cat.name || '',
    description: cat.description || '',
    image: sanitizeImageUri(cat.image) || cat.image || '',
    order_index: position,
  };
  const ordered = [...localDb.categories].sort((a, b) => a.order_index - b.order_index);
  ordered.splice(position, 0, newCat);
  localDb.categories = normalizeOrderIndexes(ordered);
  await saveLocalDb();
  notifyDbChanged('categories');
  return clone(localDb.categories.find((category) => category.id === assignedId) as Category);
};

export const updateCategory = async (id: string, cat: Partial<Category>): Promise<Category> => {
  await ensureLocalDbLoaded();
  const existing = localDb.categories.find((category) => category.id === id);
  if (!existing) throw new Error('Category not found');
  const nextCategory: Category = {
    ...existing,
    ...cat,
    id,
    image: cat.image !== undefined ? (sanitizeImageUri(cat.image) ?? '') : existing.image,
  };
  const remaining = localDb.categories
    .filter((category) => category.id !== id)
    .sort((a, b) => a.order_index - b.order_index);
  const requestedPosition = Number(cat.order_index);
  const fallbackPosition = Number(existing.order_index ?? remaining.length);
  const position = Number.isFinite(requestedPosition)
    ? Math.max(0, Math.min(Math.trunc(requestedPosition), remaining.length))
    : Math.max(0, Math.min(fallbackPosition, remaining.length));
  remaining.splice(position, 0, { ...nextCategory, order_index: position });
  localDb.categories = normalizeOrderIndexes(remaining);
  await saveLocalDb();
  notifyDbChanged('categories');
  const updated = localDb.categories.find((category) => category.id === id);
  if (!updated) throw new Error('Category not found');
  return clone(updated);
};

export const deleteCategory = async (id: string): Promise<void> => {
  await ensureLocalDbLoaded();
  localDb.categories = localDb.categories
    .filter(c => c.id !== id)
    .sort((a, b) => a.order_index - b.order_index)
    .map((category, order_index) => ({ ...category, order_index }));
  await saveLocalDb();
  notifyDbChanged('categories');
};

export const moveCategory = async (id: string, direction: 'up' | 'down'): Promise<Category[]> => {
  await ensureLocalDbLoaded();
  const sorted = [...localDb.categories].sort((a, b) => a.order_index - b.order_index);
  const index = sorted.findIndex(category => category.id === id);
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return clone(sorted);
  [sorted[index], sorted[targetIndex]] = [sorted[targetIndex], sorted[index]];
  localDb.categories = sorted.map((category, order_index) => ({ ...category, order_index }));
  await saveLocalDb();
  notifyDbChanged('categories');
  return clone(localDb.categories);
};

export const resetOrderNumber = async (): Promise<{ message: string; reset_at: string; orders_cleared: number }> => {
  await ensureLocalDbLoaded();
  const ordersCleared = localDb.orders.length;
  localDb.settings.current_order_number = 1;
  localDb.settings.last_reset_at = new Date().toISOString();
  // Il reset manuale richiesto dall'operatore apre un nuovo servizio: oltre al
  // contatore svuota la lista delle comande del monitor cucina e azzera il tabellone chiama coda.
  localDb.orders = [];
  localDb.settings.display_queue_calling = null;
  _memoryCallingNumber = null;
  await saveLocalDb();
  notifyDbChanged('orders');
  notifyDbChanged('settings');
  return {
    message: 'Order number and kitchen orders reset successfully',
    reset_at: localDb.settings.last_reset_at,
    orders_cleared: ordersCleared,
  };
};

/** Restituisce solo metadati pubblici: password, PIN e recovery code non sono mai leggibili. */
export const getAdminCredentials = async () => getAdminCredentialStatus();

export const changeRemoteCredentials = async (currentUsername: string, currentSecret: string, nextUsername: string, nextPassword: string): Promise<void> => {
  await ensureLocalDbLoaded();
  const status = await getSecureAdminCredentialStatus();
  if (!status.configured || !status.username || status.username !== (currentUsername || '').trim().toLowerCase()) {
    throw new Error('Credenziali attuali non valide');
  }
  await updateAdminCredentials(currentSecret, {
    username: nextUsername,
    password: nextPassword,
    pin: '',
  });
  notifyDbChanged('settings');
};

export const updateAdminCredentialsSafely = async (currentSecret: string, next: { username?: string; password?: string; pin?: string }): Promise<void> => {
  await ensureLocalDbLoaded();
  await updateAdminCredentials(currentSecret, {
    username: next.username || '',
    password: next.password || '',
    pin: next.pin || '',
  });
  notifyDbChanged('settings');
};

export const getAllOrdersAdmin = getOrders;

export const createNumberOnlyOrder = async (): Promise<Order> => createOrder([], 0, 'number_only');

export const getLocalBackupSnapshot = async () => {
  await ensureLocalDbLoaded();
  return {
    settings: await clearLegacyAdminSecretsFromSettings(clone(localDb.settings)),
    categories: clone(localDb.categories),
    products: clone(localDb.products),
    global_groups: clone(localDb.global_groups || []),
    orders: clone(localDb.orders || []),
    translation_glossary: clone(localDb.translation_glossary || {})
  };
};

export const restoreLocalBackupSnapshot = async (snapshot: any): Promise<{ products: number; categories: number; global_groups: number }> => {
  await ensureLocalDbLoaded();
  const data = snapshot?.manifest || snapshot?.data || snapshot || {};
  if (data.settings && typeof data.settings === 'object') {
    const incomingSettings = data.settings as Settings;
    // Un backup legacy può migrare una sola volta le vecchie credenziali in SecureStore,
    // ma i valori in chiaro non vengono mai copiati nel database ripristinato.
    if (incomingSettings.admin_username || incomingSettings.admin_password || incomingSettings.admin_pin) {
      await migrateLegacyAdminCredentials({
        username: incomingSettings.admin_username,
        password: incomingSettings.admin_password,
        pin: incomingSettings.admin_pin,
      });
    }
    localDb.settings = {
      ...localDb.settings,
      ...(await clearLegacyAdminSecretsFromSettings(incomingSettings)),
    };
  }
  if (data.categories && Array.isArray(data.categories)) {
    localDb.categories = data.categories.map((c: any, i: number) => ({
      ...c,
      id: (c.id || c._id || 'cat_' + i).toString()
    }));
  }
  if (data.products && Array.isArray(data.products)) {
    localDb.products = data.products.map((p: any, i: number) => ({
      ...p,
      id: (p.id || p._id || 'prod_' + i).toString()
    }));
  }
  if (data.global_groups && Array.isArray(data.global_groups)) {
    localDb.global_groups = data.global_groups.map((g: any, i: number) => ({
      ...g,
      id: (g.id || g._id || 'gg_' + i).toString()
    }));
  }
  if (Array.isArray(data.orders)) {
    localDb.orders = data.orders.map((order: any, i: number) => ({
      ...order,
      id: (order.id || order._id || 'ord_' + i).toString()
    }));
  }
  if (data.translation_glossary && typeof data.translation_glossary === 'object') {
    localDb.translation_glossary = data.translation_glossary;
  }
  await saveLocalDb();
  notifyDbChanged('all');
  return {
    products: localDb.products.length,
    categories: localDb.categories.length,
    global_groups: (localDb.global_groups || []).length
  };
};

export const getGlobalGroups = async (): Promise<GlobalOptionGroup[]> => {
  await ensureLocalDbLoaded();
  return clone(localDb.global_groups || []).sort((a, b) =>
    (a.order_index ?? Number.MAX_SAFE_INTEGER) - (b.order_index ?? Number.MAX_SAFE_INTEGER)
  );
};

export const createGlobalGroup = async (group: Partial<GlobalOptionGroup>): Promise<GlobalOptionGroup> => {
  await ensureLocalDbLoaded();
  const assignedId = (group.id && typeof group.id === 'string' && group.id.trim().length > 0)
    ? group.id.trim()
    : ('gg_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6));

  const newGroup: GlobalOptionGroup = {
    ...group,
    id: assignedId,
    name: group.name || group.title || 'Nuovo Gruppo',
    type: group.type || 'free_chips',
    title: group.title || group.name || 'Nuovo Gruppo',
    description: group.description || '',
    order_index: group.order_index ?? (localDb.global_groups || []).length,
    items: group.items || [],
    extras: group.extras || [],
    chips: group.chips || [],
    min_selection: group.min_selection ?? 0,
    max_selection: group.max_selection ?? 1,
    options: group.options || [],
  };
  localDb.global_groups = [...(localDb.global_groups || []), newGroup];
  await saveLocalDb();
  notifyDbChanged('groups');
  notifyDbChanged('products');
  return clone(newGroup);
};

export const updateGlobalGroup = async (id: string, group: Partial<GlobalOptionGroup>): Promise<GlobalOptionGroup> => {
  await ensureLocalDbLoaded();
  localDb.global_groups = (localDb.global_groups || []).map(g => g.id === id ? { ...g, ...group, id } : g);
  await saveLocalDb();
  notifyDbChanged('groups');
  notifyDbChanged('products');
  const updated = (localDb.global_groups || []).find(g => g.id === id);
  if (!updated) throw new Error('Global group not found');
  return clone(updated);
};

export const deleteGlobalGroup = async (id: string): Promise<void> => {
  await ensureLocalDbLoaded();
  localDb.global_groups = (localDb.global_groups || [])
    .filter(g => g.id !== id)
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map((group, order_index) => ({ ...group, order_index }));
  await saveLocalDb();
  notifyDbChanged('groups');
  notifyDbChanged('products');
};

export const moveGlobalGroup = async (id: string, direction: 'up' | 'down'): Promise<GlobalOptionGroup[]> => {
  await ensureLocalDbLoaded();
  const sorted = [...(localDb.global_groups || [])].sort((a, b) =>
    (a.order_index ?? 0) - (b.order_index ?? 0)
  );
  const index = sorted.findIndex(group => group.id === id);
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return clone(sorted);
  [sorted[index], sorted[targetIndex]] = [sorted[targetIndex], sorted[index]];
  localDb.global_groups = sorted.map((group, order_index) => ({ ...group, order_index }));
  await saveLocalDb();
  notifyDbChanged('groups');
  notifyDbChanged('products');
  return clone(localDb.global_groups);
};

export const scanBluetoothPrinters = async (): Promise<{ devices: any[]; settings: Settings }> => {
  try {
    const { scanPrinters } = await import('../utils/printer');
    const devices = await scanPrinters();
    await ensureLocalDbLoaded();
    if (!localDb.settings) localDb.settings = { ...DEFAULT_SETTINGS };

    const existingMap = new Map(
      (localDb.settings.known_printers || []).map((p: any) => {
        const key = (typeof p === 'string') ? p : (p.address || p.name || p.id);
        return [key, (typeof p === 'string') ? { name: p, address: p, id: p } : p];
      })
    );
    for (const d of devices) {
      const key = d.address || d.name || d.id;
      if (key) existingMap.set(key, { name: d.name || key, address: d.address || key, id: d.id || key });
    }
    localDb.settings.known_printers = Array.from(existingMap.values()).map(
      (p: any) => p.address || p.name || p.id
    ).filter(Boolean);
    await saveLocalDb();
    await persistPrinterSidecarFromSettings();
    return { devices: devices || [], settings: clone(localDb.settings) };
  } catch (e) {
    console.error('scanBluetoothPrinters error:', e);
    await ensureLocalDbLoaded();
    return { devices: [], settings: clone(localDb.settings || DEFAULT_SETTINGS) };
  }
};

export const testPrintHardware = async (type: string = 'courtesy'): Promise<{ success: boolean; message: string }> => {
  try {
    await ensureLocalDbLoaded();
    const settings = localDb.settings || DEFAULT_SETTINGS;
    const targetPrinter = type === 'kitchen' 
      ? (settings.printer_kitchen || settings.printer_courtesy) 
      : (settings.printer_courtesy || settings.printer_kitchen);
    const dateStr = new Date().toLocaleTimeString('it-IT');
    const title = type === 'kitchen' ? 'TEST COMANDA CUCINA' : 'TEST SCONTRINO CORTESIA';
    const sampleText = `@@NAME@@${(settings.restaurant_name || 'TOTEM').toUpperCase()}\n${title}\n--------------------------------\nData: ${new Date().toLocaleDateString('it-IT')} ${dateStr}\n--------------------------------\nStampante: ${targetPrinter || 'Default'}\nStato: Connessione Bluetooth OK!\n--------------------------------\nStampa di test riuscita!\nGrazie!\n`;
    const sampleHtml = `<div style="text-align:center;font-family:sans-serif;padding:20px;"><h2>${settings.restaurant_name || 'TOTEM'}</h2><h3>${title}</h3><p>Data: ${dateStr}</p><p>Stampante: ${targetPrinter || 'Default'}</p><p>Stato: Connessione Bluetooth OK!</p></div>`;
    
    const { printTicket } = await import('../utils/printer');
    await printTicket(sampleHtml, sampleText, targetPrinter || undefined, {
      paperMm: (settings.paper_width_mm === 80 || settings.paper_width_mm === '80') ? 80 : 58
    });
    return { success: true, message: `Stampa test inviata a ${targetPrinter || 'stampante predefinita'}` };
  } catch (e: any) {
    console.error('testPrintHardware error:', e);
    return { success: false, message: e?.message || 'Errore durante la stampa di test' };
  }
};

let _memoryCallingNumber: number | null = null;

export const getDisplayQueueCalling = async (): Promise<{ number: number | null }> => {
  await ensureLocalDbLoaded();
  const stored = localDb.settings?.display_queue_calling;
  _memoryCallingNumber = stored === undefined ? _memoryCallingNumber : stored;
  return { number: _memoryCallingNumber };
};

export const setDisplayQueueCalling = async (number: number | null): Promise<{ number: number | null; ok: boolean }> => {
  await ensureLocalDbLoaded();
  const next = number === null || number === undefined || Number.isNaN(Number(number))
    ? null
    : Math.max(0, Math.trunc(Number(number)));
  _memoryCallingNumber = next;
  localDb.settings.display_queue_calling = next;
  await saveLocalDb();
  notifyDbChanged('settings');
  return { number: next, ok: true };
};

export const getPrinters = async (): Promise<PrinterDevice[]> => {
  await ensureLocalDbLoaded();
  return clone(localDb.settings.printers || []);
};

export const savePrinters = async (printers: PrinterDevice[]): Promise<PrinterDevice[]> => {
  await ensureLocalDbLoaded();
  const list = (printers || []).map((printer, idx) => ({
    id: (printer.id && String(printer.id).trim()) || (`prn_${Date.now().toString(36)}_${idx}`),
    name: printer.name || 'Stampante',
    department: printer.department || 'Cucina',
    interface_type: printer.interface_type || 'bluetooth',
    address: printer.address || '',
    paper_width_mm: (printer.paper_width_mm === 80 ? 80 : 58) as 58 | 80,
    assigned_category_ids: printer.assigned_category_ids || [],
    print_courtesy: Boolean(printer.print_courtesy),
    print_kitchen: printer.print_kitchen !== false,
    enabled: printer.enabled !== false,
  }));
  localDb.settings.printers = list;
  const courtesy = list.find((p) => p.print_courtesy && p.address);
  const kitchen = list.find((p) => p.print_kitchen && p.address);
  if (courtesy) localDb.settings.printer_courtesy = courtesy.address;
  if (kitchen) localDb.settings.printer_kitchen = kitchen.address;
  await saveLocalDb();
  await persistPrinterSidecarFromSettings();
  notifyDbChanged('settings');
  return clone(list);
};

export const upsertPrinterDevice = async (printer: Partial<PrinterDevice>): Promise<PrinterDevice> => {
  await ensureLocalDbLoaded();
  const list = [...(localDb.settings.printers || [])];
  const id = (printer.id && String(printer.id).trim()) || ('prn_' + Date.now().toString(36));
  const existing = list.find((p) => p.id === id);
  const next: PrinterDevice = {
    id,
    name: printer.name ?? existing?.name ?? 'Stampante',
    department: printer.department ?? existing?.department ?? 'Cucina',
    interface_type: printer.interface_type ?? existing?.interface_type ?? 'bluetooth',
    address: printer.address ?? existing?.address ?? '',
    paper_width_mm: printer.paper_width_mm === 80 || existing?.paper_width_mm === 80 ? 80 : 58,
    assigned_category_ids: printer.assigned_category_ids ?? existing?.assigned_category_ids ?? [],
    print_courtesy: printer.print_courtesy ?? existing?.print_courtesy ?? false,
    print_kitchen: printer.print_kitchen ?? existing?.print_kitchen ?? true,
    enabled: printer.enabled ?? existing?.enabled ?? true,
  };
  const idx = list.findIndex((p) => p.id === id);
  if (idx >= 0) list[idx] = next;
  else list.push(next);
  localDb.settings.printers = list;
  if (next.print_courtesy && next.address) localDb.settings.printer_courtesy = next.address;
  if (next.print_kitchen && next.address && !localDb.settings.printer_kitchen) {
    localDb.settings.printer_kitchen = next.address;
  }
  await saveLocalDb();
  await persistPrinterSidecarFromSettings();
  notifyDbChanged('settings');
  return clone(next);
};

export const deletePrinterDevice = async (id: string): Promise<PrinterDevice[]> => {
  await ensureLocalDbLoaded();
  const removed = (localDb.settings.printers || []).find((p) => p.id === id);
  localDb.settings.printers = (localDb.settings.printers || []).filter((p) => p.id !== id);
  if (removed?.address && localDb.settings.printer_courtesy === removed.address) {
    localDb.settings.printer_courtesy = '';
  }
  if (removed?.address && localDb.settings.printer_kitchen === removed.address) {
    localDb.settings.printer_kitchen = '';
  }
  await saveLocalDb();
  await persistPrinterSidecarFromSettings();
  notifyDbChanged('settings');
  return clone(localDb.settings.printers || []);
};

export const getDepartmentKdsList = async (): Promise<DepartmentKDS[]> => {
  await ensureLocalDbLoaded();
  return clone(localDb.settings.department_kds || []);
};

export const saveDepartmentKdsList = async (depts: DepartmentKDS[]): Promise<DepartmentKDS[]> => {
  await ensureLocalDbLoaded();
  localDb.settings.department_kds = (depts || []).map((dept, idx) => ({
    id: (dept.id && String(dept.id).trim()) || (`kds_${Date.now().toString(36)}_${idx}`),
    name: dept.name || 'Reparto',
    icon: dept.icon || 'restaurant',
    assigned_category_ids: dept.assigned_category_ids || [],
    printer_id: dept.printer_id,
  }));
  await saveLocalDb();
  notifyDbChanged('settings');
  return clone(localDb.settings.department_kds || []);
};

export const upsertDepartmentKds = async (dept: Partial<DepartmentKDS>): Promise<DepartmentKDS> => {
  await ensureLocalDbLoaded();
  const list = [...(localDb.settings.department_kds || [])];
  const id = (dept.id && String(dept.id).trim()) || ('kds_' + Date.now().toString(36));
  const existing = list.find((d) => d.id === id);
  const next: DepartmentKDS = {
    id,
    name: dept.name ?? existing?.name ?? 'Reparto',
    icon: dept.icon ?? existing?.icon ?? 'restaurant',
    assigned_category_ids: dept.assigned_category_ids ?? existing?.assigned_category_ids ?? [],
    printer_id: dept.printer_id ?? existing?.printer_id,
  };
  const idx = list.findIndex((d) => d.id === id);
  if (idx >= 0) list[idx] = next;
  else list.push(next);
  localDb.settings.department_kds = list;
  await saveLocalDb();
  notifyDbChanged('settings');
  return clone(next);
};

export const deleteDepartmentKds = async (id: string): Promise<DepartmentKDS[]> => {
  await ensureLocalDbLoaded();
  localDb.settings.department_kds = (localDb.settings.department_kds || []).filter((d) => d.id !== id);
  await saveLocalDb();
  notifyDbChanged('settings');
  return clone(localDb.settings.department_kds || []);
};

export const getStationTopology = async (): Promise<StationTopologyConfig> => {
  await ensureLocalDbLoaded();
  return clone(localDb.settings.station_topology || DEFAULT_SETTINGS.station_topology!);
};

export const updateStationTopology = async (patch: Partial<StationTopologyConfig>): Promise<StationTopologyConfig> => {
  await ensureLocalDbLoaded();
  const current = localDb.settings.station_topology || DEFAULT_SETTINGS.station_topology!;
  const next: StationTopologyConfig = {
    ...current,
    ...patch,
    last_synced_at: new Date().toISOString(),
  };
  const saved = await updateSettings({ station_topology: next });
  return clone(saved.station_topology || next);
};

export const getStationCatalog = async () => {
  await ensureLocalDbLoaded();
  return {
    categories: clone(localDb.categories || []),
    products: clone(localDb.products || []),
    groups: clone(localDb.global_groups || []),
    restaurant_name: localDb.settings.restaurant_name,
    logo: localDb.settings.logo,
  };
};

export const ingestRemoteOrder = async (payload: Partial<Order> & { items?: OrderItem[]; total_price?: number; order_type?: string }): Promise<Order> => {
  await ensureLocalDbLoaded();
  const incomingNumber = Number(payload.order_number);
  const incomingPrefix = payload.order_prefix ? String(payload.order_prefix).trim() : undefined;
  const existing = (localDb.orders || []).find((o) => {
    if (payload.id && o.id === payload.id) return true;
    if (Number.isFinite(incomingNumber) && incomingNumber > 0 && o.order_number === incomingNumber && (o.order_prefix || '') === (incomingPrefix || '')) return true;
    return false;
  });
  if (existing) return clone(existing);

  const ord: Order = {
    id: payload.id || ('ord_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6)),
    order_number: Number.isFinite(incomingNumber) && incomingNumber > 0
      ? incomingNumber
      : (localDb.settings.current_order_number || 1),
    order_prefix: incomingPrefix,
    items: payload.items || [],
    total_price: Number(payload.total_price || 0),
    status: payload.status || 'pending',
    order_type: payload.order_type || 'totem',
    created_at: payload.created_at || new Date().toISOString(),
    station_id: payload.station_id,
    station_name: payload.station_name,
    customer_type: payload.customer_type,
  };
  if (!Number.isFinite(incomingNumber) || incomingNumber <= 0) {
    localDb.settings.current_order_number = (ord.order_number || 1) + 1;
  }
  localDb.orders = [ord, ...localDb.orders];
  await saveLocalDb();
  notifyDbChanged('orders');
  return clone(ord);
};

export const getStationInfo = async () => {
  await ensureLocalDbLoaded();
  const topo = localDb.settings.station_topology || DEFAULT_SETTINGS.station_topology!;
  return {
    status: 'ok',
    server: 'local',
    port: 3000,
    role: topo.role,
    is_master: topo.role === 'master' || topo.role === 'mono',
    station_id: topo.station_id,
    station_name: topo.station_name,
    restaurant_name: localDb.settings.restaurant_name,
    order_prefix: topo.order_prefix || '',
    master_server_ip: topo.master_server_ip || '',
    master_server_port: topo.master_server_port || 3000,
    printers: (localDb.settings.printers || []).length,
    department_kds: (localDb.settings.department_kds || []).length,
    signage_screens: (localDb.settings.signage_screens || []).length,
  };
};

export const getSignageCatalog = async () => {
  await ensureLocalDbLoaded();
  const settings = localDb.settings;
  const categories = (localDb.categories || []).map((cat) => ({
    id: cat.id,
    name: cat.name,
    order_index: cat.order_index || 0,
  }));
  const products = (localDb.products || [])
    .filter((p) => p.available !== false)
    .map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      category_id: p.category_id,
      is_featured: Boolean(p.is_featured),
      available: p.available !== false,
      has_image: Boolean(p.image),
      image: Boolean(p.image) ? `/api/signage-photo/${p.id}` : '',
      description: String(p.description || '').slice(0, 180),
    }));
  return {
    restaurant_name: settings.restaurant_name || '',
    has_logo: Boolean(settings.logo),
    categories,
    products,
    screens: clone(settings.signage_screens || []),
    signage_config: clone(settings.signage_config || DEFAULT_SETTINGS.signage_config!),
    receipt_layout: clone(settings.receipt_layout || DEFAULT_SETTINGS.receipt_layout!),
    dq_mode: settings.dq_mode || 'full',
    dq_theme: settings.dq_theme || 'dark',
    dq_cols: settings.dq_cols || 4,
    dq_interval: settings.dq_interval || 9,
    dq_hero: settings.dq_hero !== false,
    dq_dayparting: Boolean(settings.dq_dayparting),
    dq_animation: settings.dq_animation || 'kenburns',
  };
};

export const getDigitalSignageSettings = async (): Promise<DigitalSignageSettings> => {
  await ensureLocalDbLoaded();
  return clone(localDb.settings.signage_config || DEFAULT_SETTINGS.signage_config!);
};

export const getSignageSettings = getDigitalSignageSettings;

export const updateDigitalSignageSettings = async (cfg: Partial<DigitalSignageSettings>): Promise<DigitalSignageSettings> => {
  await ensureLocalDbLoaded();
  localDb.settings.signage_config = {
    ...(localDb.settings.signage_config || DEFAULT_SETTINGS.signage_config!),
    ...cfg,
  };
  await saveLocalDb();
  notifyDbChanged('settings');
  return clone(localDb.settings.signage_config);
};

export const updateSignageSettings = updateDigitalSignageSettings;

export const getReceiptLayout = async (): Promise<ReceiptLayoutConfig> => {
  await ensureLocalDbLoaded();
  return clone(localDb.settings.receipt_layout || DEFAULT_SETTINGS.receipt_layout!);
};

export const updateReceiptLayout = async (cfg: Partial<ReceiptLayoutConfig>): Promise<ReceiptLayoutConfig> => {
  await ensureLocalDbLoaded();
  localDb.settings.receipt_layout = {
    ...(localDb.settings.receipt_layout || DEFAULT_SETTINGS.receipt_layout!),
    ...cfg,
  };
  await saveLocalDb();
  notifyDbChanged('settings');
  return clone(localDb.settings.receipt_layout);
};

export const getSignageImage = async (id: string): Promise<{ id: string; image: string }> => {
  await ensureLocalDbLoaded();
  const key = String(id || '').trim();
  if (!key || key === 'logo') {
    return { id: 'logo', image: localDb.settings.logo || '' };
  }
  const product = (localDb.products || []).find((p) => p.id === key);
  return { id: key, image: product?.image || '' };
};

export const getSignageScreens = async (): Promise<SignageScreen[]> => {
  await ensureLocalDbLoaded();
  return clone(localDb.settings.signage_screens || []);
};

export const saveSignageScreens = async (screens: SignageScreen[]): Promise<SignageScreen[]> => {
  await ensureLocalDbLoaded();
  localDb.settings.signage_screens = (screens || []).map((screen, idx) => ({
    id: (screen.id && String(screen.id).trim()) || (`tv_${Date.now().toString(36)}_${idx}`),
    name: screen.name || `TV ${idx + 1}`,
    category_ids: screen.category_ids || [],
    mode: screen.mode === 'products' ? 'products' : 'full',
    enabled: screen.enabled !== false,
  }));
  await saveLocalDb();
  notifyDbChanged('settings');
  return clone(localDb.settings.signage_screens || []);
};

export const upsertSignageScreen = async (screen: Partial<SignageScreen>): Promise<SignageScreen> => {
  await ensureLocalDbLoaded();
  const list = [...(localDb.settings.signage_screens || [])];
  const id = (screen.id && String(screen.id).trim()) || ('tv_' + Date.now().toString(36));
  const existing = list.find((s) => s.id === id);
  const next: SignageScreen = {
    id,
    name: screen.name ?? existing?.name ?? `TV ${list.length + 1}`,
    category_ids: screen.category_ids ?? existing?.category_ids ?? [],
    mode: screen.mode ?? existing?.mode ?? 'full',
    enabled: screen.enabled ?? existing?.enabled ?? true,
  };
  const idx = list.findIndex((s) => s.id === id);
  if (idx >= 0) list[idx] = next;
  else list.push(next);
  localDb.settings.signage_screens = list;
  await saveLocalDb();
  notifyDbChanged('settings');
  return clone(next);
};

export const deleteSignageScreen = async (id: string): Promise<SignageScreen[]> => {
  await ensureLocalDbLoaded();
  localDb.settings.signage_screens = (localDb.settings.signage_screens || []).filter((s) => s.id !== id);
  await saveLocalDb();
  notifyDbChanged('settings');
  return clone(localDb.settings.signage_screens || []);
};
