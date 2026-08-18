import AsyncStorage from '@react-native-async-storage/async-storage';

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
  type: UiSectionType;
  title: string;
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
  allergens: string[];
  customization_options: string[];
  product_type: 'simple' | 'combo';
  base_ingredients: string[];
  extra_additions: ExtraAddition[];
  combo_groups: ComboGroup[];
  ui_sections?: UiSection[];
  global_group_ids?: string[];
}

export interface Settings {
  custom_backend_url?: string;
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
  order_reset_mode: string;
  reset_time: string;
  current_order_number: number;
  last_reset_at: string | null;
  admin_pin?: string;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  customizations: string[];
  notes: string;
  removed_ingredients: string[];
  added_extras: ExtraAddition[];
  combo_selections: { [key: string]: string[] };
  combo_lines?: { group: string; name: string; price_delta: number }[];
}

export interface Order {
  id: string;
  order_number: number;
  items: OrderItem[];
  total_price: number;
  status: string;
  order_type: string;
  created_at: string;
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
  admin_pin: '1234',
  custom_backend_url: ''
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Panini', description: 'I nostri panini gourmet', order_index: 1 },
  { id: 'cat-2', name: 'Pizze', description: 'Pizze fresche e croccanti', order_index: 2 },
  { id: 'cat-3', name: 'Insalate', description: 'Insalate fresche e salutari', order_index: 3 },
  { id: 'cat-4', name: 'Combo', description: 'I nostri menù combo', order_index: 4 },
  { id: 'cat-5', name: 'Bevande', description: 'Bevande fresche', order_index: 5 },
  { id: 'cat-6', name: 'Dolci', description: 'Dolci e dessert', order_index: 6 },
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    category_id: 'cat-1',
    name: 'Hamburger Classico',
    description: 'Carne di manzo 180g su pane brioche con lattuga, pomodoro e salsa',
    price: 8.5,
    available: true,
    allergens: [],
    customization_options: [],
    product_type: 'simple',
    base_ingredients: ['Pane brioche', 'Carne di manzo', 'Lattuga', 'Pomodoro', 'Salsa'],
    extra_additions: [
      { name: 'Extra Formaggio', price: 1.0 },
      { name: 'Extra Bacon', price: 1.5 },
      { name: 'Uovo', price: 1.0 },
    ],
    combo_groups: [],
  },
  {
    id: 'prod-2',
    category_id: 'cat-1',
    name: 'Cheeseburger Deluxe',
    description: 'Hamburger con doppio cheddar e salsa speciale',
    price: 9.5,
    available: true,
    allergens: [],
    customization_options: [],
    product_type: 'simple',
    base_ingredients: ['Pane brioche', 'Carne di manzo', 'Cheddar', 'Salsa speciale'],
    extra_additions: [
      { name: 'Extra Formaggio', price: 1.0 },
      { name: 'Extra Bacon', price: 1.5 },
    ],
    combo_groups: [],
  },
  {
    id: 'prod-3',
    category_id: 'cat-2',
    name: 'Margherita',
    description: 'Pomodoro, mozzarella di bufala, basilico fresco',
    price: 7.0,
    available: true,
    allergens: [],
    customization_options: [],
    product_type: 'simple',
    base_ingredients: ['Pomodoro', 'Mozzarella', 'Basilico'],
    extra_additions: [
      { name: 'Extra Mozzarella', price: 1.5 },
      { name: 'Bordo Ripieno', price: 2.0 },
    ],
    combo_groups: [],
  },
  {
    id: 'prod-4',
    category_id: 'cat-2',
    name: 'Diavola',
    description: 'Pomodoro, mozzarella, salame piccante',
    price: 8.5,
    available: true,
    allergens: [],
    customization_options: [],
    product_type: 'simple',
    base_ingredients: ['Pomodoro', 'Mozzarella', 'Salame piccante'],
    extra_additions: [{ name: 'Extra Mozzarella', price: 1.5 }],
    combo_groups: [],
  },
  {
    id: 'prod-5',
    category_id: 'cat-3',
    name: 'Caesar Salad',
    description: 'Lattuga romana, pollo grigliato, parmigiano e crostini',
    price: 9.0,
    available: true,
    allergens: [],
    customization_options: [],
    product_type: 'simple',
    base_ingredients: ['Lattuga romana', 'Pollo grigliato', 'Parmigiano', 'Crostini'],
    extra_additions: [{ name: 'Extra Pollo', price: 2.0 }],
    combo_groups: [],
  },
  {
    id: 'prod-6',
    category_id: 'cat-4',
    name: 'Burger Combo',
    description: 'Hamburger + patatine + bevanda',
    price: 13.5,
    available: true,
    allergens: [],
    customization_options: [],
    product_type: 'combo',
    base_ingredients: [],
    extra_additions: [],
    combo_groups: [
      {
        name: 'Scegli il Burger',
        min_selection: 1,
        max_selection: 1,
        options: [
          { name: 'Hamburger Classico', price_delta: 0.0 },
          { name: 'Cheeseburger', price_delta: 1.0 },
        ],
      },
      {
        name: 'Scegli la Bevanda',
        min_selection: 1,
        max_selection: 1,
        options: [
          { name: 'Coca Cola', price_delta: 0.0 },
          { name: 'Fanta', price_delta: 0.0 },
          { name: 'Acqua', price_delta: 0.0 },
        ],
      },
    ],
  },
  {
    id: 'prod-7',
    category_id: 'cat-5',
    name: 'Coca Cola',
    description: '330ml in lattina',
    price: 2.5,
    available: true,
    allergens: [],
    customization_options: [],
    product_type: 'simple',
    base_ingredients: [],
    extra_additions: [],
    combo_groups: [],
  },
  {
    id: 'prod-8',
    category_id: 'cat-5',
    name: 'Acqua Naturale',
    description: '500ml',
    price: 1.5,
    available: true,
    allergens: [],
    customization_options: [],
    product_type: 'simple',
    base_ingredients: [],
    extra_additions: [],
    combo_groups: [],
  },
  {
    id: 'prod-9',
    category_id: 'cat-6',
    name: 'Tiramisù',
    description: 'Tiramisù classico fatto in casa',
    price: 5.5,
    available: true,
    allergens: [],
    customization_options: [],
    product_type: 'simple',
    base_ingredients: [],
    extra_additions: [],
    combo_groups: [],
  },
];

export interface LocalDbState {
  settings: Settings;
  categories: Category[];
  products: Product[];
  orders: Order[];
  global_groups: GlobalOptionGroup[];
}

const STORAGE_KEY = 'totem_local_db_v1';

let localDb: LocalDbState = {
  settings: DEFAULT_SETTINGS,
  categories: DEFAULT_CATEGORIES,
  products: DEFAULT_PRODUCTS,
  orders: [],
  global_groups: []
};

let isLoaded = false;

export async function ensureLocalDbLoaded() {
  if (isLoaded) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      localDb = {
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        categories: parsed.categories && parsed.categories.length ? parsed.categories : DEFAULT_CATEGORIES,
        products: parsed.products && parsed.products.length ? parsed.products : DEFAULT_PRODUCTS,
        orders: parsed.orders || [],
        global_groups: parsed.global_groups || []
      };
    } else {
      await saveLocalDb();
    }
  } catch (e) {
    console.warn('Error loading local db:', e);
  }
  isLoaded = true;
}

export async function saveLocalDb() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(localDb));
  } catch (e) {
    console.warn('Error saving local db:', e);
  }
}

export function getBackendBaseUrl(): string {
  const custom = localDb.settings?.custom_backend_url?.trim();
  if (custom) return custom.replace(/\/+$/, '');
  return '';
}

export function getRemoteAdminUrl(localIp?: string): string {
  const custom = localDb.settings?.custom_backend_url?.trim();
  if (custom) {
    const clean = custom.replace(/\/+$/, '');
    if (clean.endsWith('/remote') || clean.endsWith('/admin')) {
      return `${clean}/`;
    }
    return `${clean}/remote/`;
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/remote/`;
  }
  const cleanIp = (localIp || '').trim();
  if (cleanIp && cleanIp !== 'localhost' && cleanIp !== '127.0.0.1' && cleanIp !== '0.0.0.0' && cleanIp !== 'IP_DEL_TABLET' && !cleanIp.startsWith('0.')) {
    return `http://${cleanIp}:3000/remote/`;
  }
  return 'http://192.168.1.9:3000/remote/';
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

export const getSettings = async (): Promise<Settings> => {
  await ensureLocalDbLoaded();
  return clone(localDb.settings);
};

export const updateSettings = async (data: Partial<Settings>): Promise<Settings> => {
  await ensureLocalDbLoaded();
  localDb.settings = { ...localDb.settings, ...data };
  await saveLocalDb();
  return clone(localDb.settings);
};

export const getCategories = async (): Promise<Category[]> => {
  await ensureLocalDbLoaded();
  return clone(localDb.categories).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
};

export const getProducts = async (): Promise<Product[]> => {
  await ensureLocalDbLoaded();
  return clone(localDb.products);
};

export const getProductsByCategory = async (categoryId: string): Promise<Product[]> => {
  await ensureLocalDbLoaded();
  return clone(localDb.products.filter(p => p.category_id === categoryId));
};

export const createOrder = async (items: OrderItem[], totalPrice: number, orderType = 'totem'): Promise<Order> => {
  await ensureLocalDbLoaded();
  const n = localDb.settings.current_order_number || 1;
  localDb.settings.current_order_number = n + 1;
  const ord: Order = {
    id: 'ord_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
    order_number: n,
    items,
    total_price: totalPrice,
    status: 'pending',
    order_type: orderType,
    created_at: new Date().toISOString()
  };
  localDb.orders = [ord, ...localDb.orders];
  await saveLocalDb();
  return clone(ord);
};

export const getAdminPin = async (): Promise<string> => {
  await ensureLocalDbLoaded();
  return localDb.settings.admin_pin || '1234';
};

export const setAdminPin = async (pin: string): Promise<void> => {
  await ensureLocalDbLoaded();
  localDb.settings.admin_pin = pin;
  await saveLocalDb();
};

export const getOrders = async (): Promise<Order[]> => {
  await ensureLocalDbLoaded();
  return clone(localDb.orders).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const updateOrderStatus = async (id: string, status: string): Promise<Order> => {
  await ensureLocalDbLoaded();
  const idx = localDb.orders.findIndex(o => o.id === id);
  if (idx !== -1) {
    localDb.orders[idx] = { ...localDb.orders[idx], status };
    await saveLocalDb();
    return clone(localDb.orders[idx]);
  }
  throw new Error('Order not found');
};

export const adminLogin = async (username: string, password: string): Promise<string> => {
  await ensureLocalDbLoaded();
  // Offline: PIN configurato (default 1234) oppure admin/admin123.
  const configuredPin = (localDb.settings.admin_pin || '1234').trim();
  const u = (username || '').toLowerCase().trim();
  const pw = (password || '').trim();
  const pinOk = !!configuredPin && pw === configuredPin;
  const adminOk = u === 'admin' && pw === 'admin123';
  if (pinOk || adminOk) {
    const token = 'local-admin-token';
    try {
      await AsyncStorage.setItem('admin_token', token);
    } catch {}
    return token;
  }
  try {
    const res = await getRemoteJson<{ access_token: string }>('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u || 'admin', password: pw })
    });
    if (res.access_token) {
      try {
        await AsyncStorage.setItem('admin_token', res.access_token);
      } catch {}
      return res.access_token;
    }
  } catch {}
  throw new Error('Credenziali non valide');
};

export const getAllProductsAdmin = async (): Promise<Product[]> => {
  await ensureLocalDbLoaded();
  return clone(localDb.products);
};

export const createProduct = async (product: Partial<Product>): Promise<Product> => {
  await ensureLocalDbLoaded();
  const assignedId = (product.id && typeof product.id === 'string' && product.id.trim().length > 0)
    ? product.id.trim()
    : ('prod_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6));

  const newProduct: Product = {
    ...product,
    id: assignedId,
    name: product.name || '',
    description: product.description || '',
    price: Number(product.price) || 0,
    category_id: product.category_id || '',
    available: product.available ?? true,
    allergens: product.allergens || [],
    customization_options: product.customization_options || [],
    product_type: product.product_type || 'simple',
    base_ingredients: product.base_ingredients || [],
    extra_additions: product.extra_additions || [],
    combo_groups: product.combo_groups || [],
    ui_sections: product.ui_sections || [],
    global_group_ids: product.global_group_ids || [],
    image: product.image || '',
  };
  localDb.products = [...localDb.products, newProduct];
  await saveLocalDb();
  return clone(newProduct);
};

export const updateProduct = async (id: string, product: Partial<Product>): Promise<Product> => {
  await ensureLocalDbLoaded();
  localDb.products = localDb.products.map(p => p.id === id ? { ...p, ...product, id } : p);
  await saveLocalDb();
  const updated = localDb.products.find(p => p.id === id);
  if (!updated) throw new Error('Product not found');
  return clone(updated);
};

export const deleteProduct = async (id: string): Promise<void> => {
  await ensureLocalDbLoaded();
  localDb.products = localDb.products.filter(p => p.id !== id);
  await saveLocalDb();
};

export const createCategory = async (cat: Partial<Category>): Promise<Category> => {
  await ensureLocalDbLoaded();
  const assignedId = (cat.id && typeof cat.id === 'string' && cat.id.trim().length > 0)
    ? cat.id.trim()
    : ('cat_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6));

  const newCat: Category = {
    ...cat,
    id: assignedId,
    name: cat.name || '',
    description: cat.description || '',
    image: cat.image,
    order_index: cat.order_index ?? (localDb.categories.length + 1),
  };
  localDb.categories = [...localDb.categories, newCat];
  await saveLocalDb();
  return clone(newCat);
};

export const updateCategory = async (id: string, cat: Partial<Category>): Promise<Category> => {
  await ensureLocalDbLoaded();
  localDb.categories = localDb.categories.map(c => c.id === id ? { ...c, ...cat, id } : c);
  await saveLocalDb();
  const updated = localDb.categories.find(c => c.id === id);
  if (!updated) throw new Error('Category not found');
  return clone(updated);
};

export const deleteCategory = async (id: string): Promise<void> => {
  await ensureLocalDbLoaded();
  localDb.categories = localDb.categories.filter(c => c.id !== id);
  await saveLocalDb();
};

export const resetOrderNumber = async (): Promise<void> => {
  await ensureLocalDbLoaded();
  localDb.settings.current_order_number = 1;
  localDb.settings.last_reset_at = new Date().toISOString();
  await saveLocalDb();
};

export const getAdminCredentials = async () => ({ username: 'admin', password: '***' });

export const changeRemoteCredentials = async (cu: string, cp: string, nu: string, np: string): Promise<void> => {
  // Remote/local change handler
};

export const getAllOrdersAdmin = getOrders;

export const createNumberOnlyOrder = async (): Promise<Order> => createOrder([], 0, 'number_only');

export const getLocalBackupSnapshot = async () => {
  await ensureLocalDbLoaded();
  return {
    settings: clone(localDb.settings),
    categories: clone(localDb.categories),
    products: clone(localDb.products),
    global_groups: clone(localDb.global_groups || [])
  };
};

export const restoreLocalBackupSnapshot = async (snapshot: any): Promise<{ products: number; categories: number; global_groups: number }> => {
  await ensureLocalDbLoaded();
  const data = snapshot?.manifest || snapshot?.data || snapshot || {};
  if (data.settings && typeof data.settings === 'object') {
    localDb.settings = { ...localDb.settings, ...data.settings };
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
  await saveLocalDb();
  return {
    products: localDb.products.length,
    categories: localDb.categories.length,
    global_groups: (localDb.global_groups || []).length
  };
};

export const getGlobalGroups = async (): Promise<GlobalOptionGroup[]> => {
  await ensureLocalDbLoaded();
  return clone(localDb.global_groups || []);
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
    items: group.items || [],
    extras: group.extras || [],
    chips: group.chips || [],
    min_selection: group.min_selection ?? 0,
    max_selection: group.max_selection ?? 1,
    options: group.options || [],
  };
  localDb.global_groups = [...(localDb.global_groups || []), newGroup];
  await saveLocalDb();
  return clone(newGroup);
};

export const updateGlobalGroup = async (id: string, group: Partial<GlobalOptionGroup>): Promise<GlobalOptionGroup> => {
  await ensureLocalDbLoaded();
  localDb.global_groups = (localDb.global_groups || []).map(g => g.id === id ? { ...g, ...group, id } : g);
  await saveLocalDb();
  const updated = (localDb.global_groups || []).find(g => g.id === id);
  if (!updated) throw new Error('Global group not found');
  return clone(updated);
};

export const deleteGlobalGroup = async (id: string): Promise<void> => {
  await ensureLocalDbLoaded();
  localDb.global_groups = (localDb.global_groups || []).filter(g => g.id !== id);
  await saveLocalDb();
};

export const scanBluetoothPrinters = async (): Promise<{ devices: any[]; settings: Settings }> => {
  try {
    const { scanPrinters } = await import('../utils/printer');
    const devices = await scanPrinters();
    await ensureLocalDbLoaded();
    if (!localDb.settings) localDb.settings = { ...DEFAULT_SETTINGS };
    const currentKnown = new Set(localDb.settings.known_printers || []);
    for (const d of devices) {
      const id = d.name || d.address || d.id;
      if (id) currentKnown.add(id);
    }
    localDb.settings.known_printers = Array.from(currentKnown);
    if (!localDb.settings.printer_courtesy && devices.length > 0) {
      localDb.settings.printer_courtesy = devices[0].name || devices[0].address || devices[0].id;
    }
    if (!localDb.settings.printer_kitchen && devices.length > 0) {
      localDb.settings.printer_kitchen = devices[0].name || devices[0].address || devices[0].id;
    }
    await saveLocalDb();
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

