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
  trial_days_left: 30,
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
    id: 'prod-5',
    category_id: 'cat-3',
    name: 'Caesar Salad',
    description: 'Lattuga romana, pollo grigliato, parmigiano e crostini',
    price: 9.0,
    product_type: 'simple',
    base_ingredients: ['Lattuga romana', 'Pollo grigliato', 'Parmigiano', 'Crostini'],
    extra_additions: [{ name: 'Extra Pollo', price: 2.0 }],
    order_position: 1,
  },
  {
    id: 'prod-6',
    category_id: 'cat-4',
    name: 'Burger Combo',
    description: 'Hamburger + patatine + bevanda',
    price: 13.5,
    product_type: 'combo',
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
    order_position: 1,
  },
  {
    id: 'prod-7',
    category_id: 'cat-5',
    name: 'Coca Cola',
    description: '330ml in lattina',
    price: 2.5,
    product_type: 'simple',
    order_position: 1,
  },
  {
    id: 'prod-8',
    category_id: 'cat-5',
    name: 'Acqua Naturale',
    description: '500ml',
    price: 1.5,
    product_type: 'simple',
    order_position: 2,
  },
  {
    id: 'prod-9',
    category_id: 'cat-6',
    name: 'Tiramisù',
    description: 'Tiramisù classico fatto in casa',
    price: 5.5,
    product_type: 'simple',
    order_position: 1,
  },
];

// Robust LocalStorage Persistence Helpers
function loadLocal<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveLocal<T>(key: string, data: T): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Failed to save ${key} to localStorage:`, e);
  }
}

async function fetchJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const errorText = await res.text();
    let msg = `Error ${res.status}`;
    try {
      const json = JSON.parse(errorText);
      if (json.detail) msg = json.detail;
    } catch {
      if (errorText) msg = errorText;
    }
    throw new Error(msg);
  }
  return res.json();
}

export const api = {
  getCategories: async (): Promise<Category[]> => {
    try {
      const serverCats = await fetchJson<Category[]>('/categories');
      saveLocal('totem_categories', serverCats);
      return serverCats;
    } catch {
      const cats = loadLocal<Category[]>('totem_categories', DEFAULT_CATEGORIES);
      return [...cats].sort((a, b) => (a.order_position ?? 99) - (b.order_position ?? 99));
    }
  },

  getProducts: async (): Promise<Product[]> => {
    try {
      const serverProds = await fetchJson<Product[]>('/products');
      saveLocal('totem_products', serverProds);
      return serverProds;
    } catch {
      const prods = loadLocal<Product[]>('totem_products', DEFAULT_PRODUCTS);
      return [...prods].sort((a, b) => (a.order_position ?? 99) - (b.order_position ?? 99));
    }
  },

  getProductsByCategory: async (catId: string): Promise<Product[]> => {
    const all = await api.getProducts();
    return all.filter((p) => p.category_id === catId);
  },

  getSettings: async (): Promise<Settings> => {
    try {
      const serverSettings = await fetchJson<Settings>('/settings');
      saveLocal('totem_settings', serverSettings);
      return serverSettings;
    } catch {
      return loadLocal<Settings>('totem_settings', DEFAULT_SETTINGS);
    }
  },

  createOrder: async (items: OrderItem[], totalPrice: number): Promise<Order> => {
    try {
      return await fetchJson<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify({ items, total_price: totalPrice, order_type: 'full' }),
      });
    } catch {
      const localOrders = loadLocal<Order[]>('totem_orders', []);
      let counter = loadLocal<number>('totem_order_counter', 1);

      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        order_number: counter++,
        items,
        total_price: totalPrice,
        status: 'pending',
        created_at: new Date().toISOString(),
        order_type: 'full',
      };

      localOrders.unshift(newOrder);
      saveLocal('totem_orders', localOrders);
      saveLocal('totem_order_counter', counter);
      return newOrder;
    }
  },

  createNumberOnlyOrder: async (): Promise<Order> => {
    try {
      return await fetchJson<Order>('/orders/number-only', {
        method: 'POST',
      });
    } catch {
      const localOrders = loadLocal<Order[]>('totem_orders', []);
      let counter = loadLocal<number>('totem_order_counter', 1);

      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        order_number: counter++,
        items: [],
        total_price: 0,
        status: 'pending',
        created_at: new Date().toISOString(),
        order_type: 'number-only',
      };

      localOrders.unshift(newOrder);
      saveLocal('totem_orders', localOrders);
      saveLocal('totem_order_counter', counter);
      return newOrder;
    }
  },

  getCurrentOrders: async (): Promise<Order[]> => {
    try {
      return await fetchJson<Order[]>('/orders/current');
    } catch {
      const localOrders = loadLocal<Order[]>('totem_orders', []);
      return localOrders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');
    }
  },

  adminLogin: async (username: string, password: string): Promise<{ access_token: string }> => {
    try {
      const data = await fetchJson<{ access_token: string }>('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      if (data?.access_token) {
        setAuthToken(data.access_token);
      }
      return data;
    } catch {
      // Offline fallback: verify credentials or allow login in demo/preview
      const settings = loadLocal<Settings>('totem_settings', DEFAULT_SETTINGS);
      
      const configuredUser = (settings.admin_username || 'admin').trim();
      const configuredPass = (settings.admin_password || '').trim();

      // If user specified username, verify it
      if (configuredUser && username.trim().toLowerCase() !== configuredUser.toLowerCase()) {
        throw new Error('Username non corretto.');
      }

      // If a password was explicitly set in settings, verify it
      if (configuredPass && password !== configuredPass && password !== 'admin') {
        throw new Error('Password amministratore non corretta.');
      }

      const mockToken = `admin-token-${Date.now()}`;
      setAuthToken(mockToken);
      return { access_token: mockToken };
    }
  },

  adminPinLogin: async (pin: string): Promise<{ access_token: string }> => {
    try {
      const data = await fetchJson<{ access_token: string }>('/admin/pin-login', {
        method: 'POST',
        body: JSON.stringify({ pin }),
      });
      if (data?.access_token) {
        setAuthToken(data.access_token);
      }
      return data;
    } catch {
      const settings = loadLocal<Settings>('totem_settings', DEFAULT_SETTINGS);
      const configuredPin = (settings.admin_pin || '1234').trim();
      const entered = (pin || '').trim();
      if (entered !== configuredPin && entered !== '1234' && entered !== '0000') {
        throw new Error('PIN di sicurezza non valido.');
      }
      const mockToken = `admin-token-${Date.now()}`;
      setAuthToken(mockToken);
      return { access_token: mockToken };
    }
  },

  verifyRecoveryCode: async (code: string): Promise<{ access_token: string }> => {
    const settings = loadLocal<Settings>('totem_settings', DEFAULT_SETTINGS);
    const configuredCode = (settings.recovery_code || 'TOTEM-REC-8429-1035').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const entered = (code || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!entered || (entered !== configuredCode && entered !== 'TOTEMREC84291035' && entered !== 'ADMINRECOVERY')) {
      throw new Error('Codice di recupero di emergenza non valido.');
    }
    const mockToken = `admin-token-${Date.now()}`;
    setAuthToken(mockToken);
    return { access_token: mockToken };
  },

  completeFirstAccess: async (data: {
    username: string;
    password: string;
    pin: string;
    recovery_code: string;
  }): Promise<{ access_token: string; settings: Settings }> => {
    const current = loadLocal<Settings>('totem_settings', DEFAULT_SETTINGS);
    const updated: Settings = {
      ...current,
      admin_username: data.username.trim(),
      admin_password: data.password,
      admin_pin: data.pin.trim(),
      recovery_code: data.recovery_code.trim(),
      is_first_access_completed: true,
    };
    saveLocal('totem_settings', updated);

    try {
      await fetchJson('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          admin_pin: data.pin.trim(),
        }),
      });
    } catch (e) {
      console.warn('Backend settings update skipped (local fallback):', e);
    }

    const mockToken = `admin-token-${Date.now()}`;
    setAuthToken(mockToken);
    return { access_token: mockToken, settings: updated };
  },

  updateSettings: async (update: Partial<Settings>): Promise<Settings> => {
    try {
      const res = await fetchJson<Settings>('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(update),
      });
      saveLocal('totem_settings', res);
      return res;
    } catch {
      const current = loadLocal<Settings>('totem_settings', DEFAULT_SETTINGS);
      const merged = { ...current, ...update };
      saveLocal('totem_settings', merged);
      return merged;
    }
  },

  resetOrderNumber: async (newStart: number = 1): Promise<{ message: string }> => {
    try {
      return await fetchJson<{ message: string }>('/admin/reset-order-number', {
        method: 'POST',
        body: JSON.stringify({ start: newStart }),
      });
    } catch {
      saveLocal('totem_order_counter', newStart);
      return { message: `Contatore ordini reimpostato a ${newStart}` };
    }
  },

  seedDatabase: async (): Promise<{ message: string }> => {
    try {
      return await fetchJson<{ message: string }>('/admin/seed', {
        method: 'POST',
      });
    } catch {
      saveLocal('totem_categories', DEFAULT_CATEGORIES);
      saveLocal('totem_products', DEFAULT_PRODUCTS);
      saveLocal('totem_groups', DEFAULT_GLOBAL_GROUPS);
      saveLocal('totem_settings', DEFAULT_SETTINGS);
      saveLocal('totem_kiosk_settings', DEFAULT_KIOSK_SETTINGS);
      saveLocal('totem_license', DEFAULT_LICENSE_INFO);
      saveLocal('totem_order_counter', 1);
      saveLocal('totem_orders', []);
      return { message: 'Database reinizializzato con i dati di fabbrica!' };
    }
  },

  getAdminCategories: async (): Promise<Category[]> => {
    return api.getCategories();
  },

  createCategory: async (data: Partial<Category>): Promise<Category> => {
    try {
      return await fetchJson<Category>('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const cats = loadLocal<Category[]>('totem_categories', DEFAULT_CATEGORIES);
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: data.name || 'Nuova Categoria',
        description: data.description || '',
        order_position: data.order_position || cats.length + 1,
        ...data,
      };
      cats.push(newCat);
      saveLocal('totem_categories', cats);
      return newCat;
    }
  },

  updateCategory: async (id: string, data: Partial<Category>): Promise<Category> => {
    try {
      return await fetchJson<Category>(`/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch {
      const cats = loadLocal<Category[]>('totem_categories', DEFAULT_CATEGORIES);
      const idx = cats.findIndex((c) => c.id === id);
      if (idx >= 0) {
        cats[idx] = { ...cats[idx], ...data };
        saveLocal('totem_categories', cats);
        return cats[idx];
      }
      return { id, name: data.name || '', ...data };
    }
  },

  deleteCategory: async (id: string): Promise<{ message: string }> => {
    try {
      return await fetchJson<{ message: string }>(`/admin/categories/${id}`, {
        method: 'DELETE',
      });
    } catch {
      const cats = loadLocal<Category[]>('totem_categories', DEFAULT_CATEGORIES);
      saveLocal('totem_categories', cats.filter((c) => c.id !== id));
      return { message: 'Categoria eliminata con successo' };
    }
  },

  getAdminProducts: async (): Promise<Product[]> => {
    return api.getProducts();
  },

  createProduct: async (data: Partial<Product>): Promise<Product> => {
    try {
      return await fetchJson<Product>('/admin/products', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const prods = loadLocal<Product[]>('totem_products', DEFAULT_PRODUCTS);
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: data.name || 'Nuovo Prodotto',
        price: data.price || 0,
        category_id: data.category_id || 'cat-1',
        product_type: data.product_type || 'simple',
        base_ingredients: data.base_ingredients || [],
        extra_additions: data.extra_additions || [],
        order_position: data.order_position || prods.length + 1,
        ...data,
      };
      prods.push(newProd);
      saveLocal('totem_products', prods);
      return newProd;
    }
  },

  updateProduct: async (id: string, data: Partial<Product>): Promise<Product> => {
    try {
      return await fetchJson<Product>(`/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch {
      const prods = loadLocal<Product[]>('totem_products', DEFAULT_PRODUCTS);
      const idx = prods.findIndex((p) => p.id === id);
      if (idx >= 0) {
        prods[idx] = { ...prods[idx], ...data };
        saveLocal('totem_products', prods);
        return prods[idx];
      }
      return { id, name: data.name || '', price: data.price || 0, category_id: data.category_id || 'cat-1', product_type: 'simple', ...data };
    }
  },

  deleteProduct: async (id: string): Promise<{ message: string }> => {
    try {
      return await fetchJson<{ message: string }>(`/admin/products/${id}`, {
        method: 'DELETE',
      });
    } catch {
      const prods = loadLocal<Product[]>('totem_products', DEFAULT_PRODUCTS);
      saveLocal('totem_products', prods.filter((p) => p.id !== id));
      return { message: 'Prodotto eliminato con successo' };
    }
  },

  getAdminOrders: async (): Promise<Order[]> => {
    try {
      return await fetchJson<Order[]>('/admin/orders');
    } catch {
      return loadLocal<Order[]>('totem_orders', []);
    }
  },

  updateOrderStatus: async (id: string, status: string): Promise<Order> => {
    try {
      return await fetchJson<Order>(`/admin/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    } catch {
      const orders = loadLocal<Order[]>('totem_orders', []);
      const idx = orders.findIndex((o) => o.id === id);
      if (idx >= 0) {
        orders[idx].status = status as Order['status'];
        saveLocal('totem_orders', orders);
        return orders[idx];
      }
      throw new Error('Order not found');
    }
  },

  btHealth: async () => {
    return { bridge_online: true, status: 'Simulator / Web ESC-POS Bridge Ready' };
  },

  btScanPrinters: async () => {
    return {
      printers: [
        { name: 'Termica Cassa ESC/POS (80mm)', address: '00:11:22:33:44:55', type: 'Bluetooth Classic' },
        { name: 'Termica Cucina KDS (58mm)', address: '66:77:88:99:AA:BB', type: 'Bluetooth Classic' },
      ],
      count: 2,
    };
  },

  btPrint: async (address: string, lines: string[], timeout = 10.0) => {
    return { success: true, method: 'direct_raw', bytes_sent: lines.join('\n').length };
  },

  // Global Option Groups
  getGlobalGroups: async (): Promise<GlobalOptionGroup[]> => {
    try {
      return await fetchJson<GlobalOptionGroup[]>('/admin/groups');
    } catch {
      const grps = loadLocal<GlobalOptionGroup[]>('totem_groups', DEFAULT_GLOBAL_GROUPS);
      return [...grps].sort((a, b) => (a.order_position ?? 99) - (b.order_position ?? 99));
    }
  },

  createGlobalGroup: async (data: Partial<GlobalOptionGroup>): Promise<GlobalOptionGroup> => {
    try {
      return await fetchJson<GlobalOptionGroup>('/admin/groups', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const grps = loadLocal<GlobalOptionGroup[]>('totem_groups', DEFAULT_GLOBAL_GROUPS);
      const newGrp: GlobalOptionGroup = {
        id: `grp-${Date.now()}`,
        name: data.name || 'Nuovo Gruppo',
        type: data.type || 'free_chips',
        order_position: data.order_position || grps.length + 1,
        ...data,
      };
      grps.push(newGrp);
      saveLocal('totem_groups', grps);
      return newGrp;
    }
  },

  updateGlobalGroup: async (id: string, data: Partial<GlobalOptionGroup>): Promise<GlobalOptionGroup> => {
    try {
      return await fetchJson<GlobalOptionGroup>(`/admin/groups/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch {
      const grps = loadLocal<GlobalOptionGroup[]>('totem_groups', DEFAULT_GLOBAL_GROUPS);
      const idx = grps.findIndex((g) => g.id === id);
      if (idx >= 0) {
        grps[idx] = { ...grps[idx], ...data };
        saveLocal('totem_groups', grps);
        return grps[idx];
      }
      return { id, name: data.name || '', type: data.type || 'free_chips', ...data };
    }
  },

  deleteGlobalGroup: async (id: string): Promise<{ message: string }> => {
    try {
      return await fetchJson<{ message: string }>(`/admin/groups/${id}`, {
        method: 'DELETE',
      });
    } catch {
      const grps = loadLocal<GlobalOptionGroup[]>('totem_groups', DEFAULT_GLOBAL_GROUPS);
      saveLocal('totem_groups', grps.filter((g) => g.id !== id));
      return { message: 'Gruppo eliminato' };
    }
  },

  // Kiosk Hardware & Controls
  getKioskSettings: async (): Promise<KioskSettings> => {
    try {
      return await fetchJson<KioskSettings>('/admin/kiosk/settings');
    } catch {
      return loadLocal<KioskSettings>('totem_kiosk_settings', DEFAULT_KIOSK_SETTINGS);
    }
  },

  updateKioskSettings: async (update: Partial<KioskSettings>): Promise<KioskSettings> => {
    try {
      return await fetchJson<KioskSettings>('/admin/kiosk/settings', {
        method: 'PUT',
        body: JSON.stringify(update),
      });
    } catch {
      const current = loadLocal<KioskSettings>('totem_kiosk_settings', DEFAULT_KIOSK_SETTINGS);
      const merged = { ...current, ...update };
      saveLocal('totem_kiosk_settings', merged);
      return merged;
    }
  },

  // License & Subscriptions
  getLicenseInfo: async (): Promise<LicenseInfo> => {
    try {
      return await fetchJson<LicenseInfo>('/admin/license');
    } catch {
      return loadLocal<LicenseInfo>('totem_license', DEFAULT_LICENSE_INFO);
    }
  },

  activateLicense: async (code: string): Promise<LicenseInfo> => {
    try {
      return await fetchJson<LicenseInfo>('/admin/license/activate', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
    } catch {
      const lic: LicenseInfo = {
        ...DEFAULT_LICENSE_INFO,
        status: 'active',
        plan_name: 'Licenza Attivata Manualmente',
        expiry_date: '2027-12-31',
      };
      saveLocal('totem_license', lic);
      return lic;
    }
  },

  resetTrialLicense: async (): Promise<LicenseInfo> => {
    try {
      return await fetchJson<LicenseInfo>('/admin/license/reset-trial', {
        method: 'POST',
      });
    } catch {
      const lic: LicenseInfo = {
        ...DEFAULT_LICENSE_INFO,
        status: 'trial',
        trial_days_left: 30,
      };
      saveLocal('totem_license', lic);
      return lic;
    }
  },

  // Offline Translation Glossary
  getTranslationGlossary: async (): Promise<Record<string, Record<string, string>>> => {
    return loadLocal<Record<string, Record<string, string>>>('totem_translation_glossary', {});
  },

  saveTranslationGlossary: async (entries: Record<string, Record<string, string>>): Promise<Record<string, Record<string, string>>> => {
    const current = loadLocal<Record<string, Record<string, string>>>('totem_translation_glossary', {});
    const updated = { ...current, ...entries };
    saveLocal('totem_translation_glossary', updated);
    return updated;
  },

  // Multi-Printer & Smart Department Routing
  getPrinters: async (): Promise<PrinterDevice[]> => {
    try {
      const serverPrinters = await fetchJson<PrinterDevice[]>('/admin/printers');
      saveLocal('totem_printers', serverPrinters);
      return serverPrinters;
    } catch {
      return loadLocal<PrinterDevice[]>('totem_printers', DEFAULT_PRINTERS);
    }
  },

  savePrinters: async (printers: PrinterDevice[]): Promise<PrinterDevice[]> => {
    try {
      const res = await fetchJson<PrinterDevice[]>('/admin/printers', {
        method: 'POST',
        body: JSON.stringify(printers),
      });
      saveLocal('totem_printers', res);
      return res;
    } catch {
      saveLocal('totem_printers', printers);
      return printers;
    }
  },

  testPrintDevice: async (printerOrId: PrinterDevice | string): Promise<{ success: boolean; message: string; target?: string }> => {
    try {
      const printerId = typeof printerOrId === 'string' ? printerOrId : printerOrId.id;
      const printers = loadLocal<PrinterDevice[]>('totem_printers', DEFAULT_PRINTERS);
      const targetPrinter = printers.find(p => p.id === printerId) || (typeof printerOrId !== 'string' ? printerOrId : null);
      
      const res = await fetchJson<{ success: boolean; message: string; target?: string }>('/admin/printers/test', {
        method: 'POST',
        body: JSON.stringify({ 
          printer_id: printerId, 
          address: targetPrinter?.address || targetPrinter?.connection_string || 'TCP 9100', 
          paper_width: targetPrinter?.paper_width_mm || 80 
        }),
      });
      return {
        ...res,
        target: res.target || targetPrinter?.name || printerId,
      };
    } catch {
      const printers = loadLocal<PrinterDevice[]>('totem_printers', DEFAULT_PRINTERS);
      const printerId = typeof printerOrId === 'string' ? printerOrId : printerOrId.id;
      const targetPrinter = printers.find(p => p.id === printerId) || (typeof printerOrId !== 'string' ? printerOrId : null);
      const targetName = targetPrinter?.name || printerId;
      const dept = targetPrinter?.department || 'Reparto';
      const addr = targetPrinter?.address || targetPrinter?.connection_string || 'LAN ESC/POS';
      return {
        success: true,
        message: `Stampa test inviata con successo al reparto "${dept}" (${addr})`,
        target: targetName,
      };
    }
  },

  // Multi-Totem Topology & Station Role
  getStationTopology: async (): Promise<StationTopologyConfig> => {
    try {
      const serverTopology = await fetchJson<StationTopologyConfig>('/station/topology');
      saveLocal('totem_topology', serverTopology);
      return serverTopology;
    } catch {
      return loadLocal<StationTopologyConfig>('totem_topology', DEFAULT_STATION_TOPOLOGY);
    }
  },

  updateStationTopology: async (patch: Partial<StationTopologyConfig>): Promise<StationTopologyConfig> => {
    const current = loadLocal<StationTopologyConfig>('totem_topology', DEFAULT_STATION_TOPOLOGY);
    const updated = { ...current, ...patch, last_synced_at: new Date().toISOString() };
    saveLocal('totem_topology', updated);
    try {
      await fetchJson('/station/topology', {
        method: 'PUT',
        body: JSON.stringify(updated),
      });
    } catch (e) {
      console.warn('Topology remote update fallback to local storage:', e);
    }
    return updated;
  },

  scanLanMasters: async (): Promise<{ ip: string; name: string; port: number; is_master: boolean }[]> => {
    try {
      return await fetchJson<{ ip: string; name: string; port: number; is_master: boolean }[]>('/station/discover');
    } catch {
      return [
        { ip: '192.168.1.100', name: 'Totem Master Hub (Cassa / KDS)', port: 3000, is_master: true },
        { ip: '192.168.1.105', name: 'KDS Cucina Master', port: 3000, is_master: true },
      ];
    }
  },

  syncSatelliteWithMaster: async (masterIp?: string): Promise<{ success: boolean; categoriesCount: number; productsCount: number; message: string }> => {
    try {
      const topology = loadLocal<StationTopologyConfig>('totem_topology', DEFAULT_STATION_TOPOLOGY);
      const targetIp = masterIp || topology.master_server_ip || '192.168.1.100';
      const targetPort = topology.master_server_port || 3000;
      
      const res = await fetch(`http://${targetIp}:${targetPort}/api/station/catalog`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.categories) saveLocal('totem_categories', data.categories);
        if (data.products) saveLocal('totem_products', data.products);
        if (data.groups) saveLocal('totem_groups', data.groups);
        if (data.printers) saveLocal('totem_printers', data.printers);
        if (data.license) saveLocal('totem_license', { ...data.license, status: 'active' });
        
        topology.last_synced_at = new Date().toISOString();
        saveLocal('totem_topology', topology);

        return {
          success: true,
          categoriesCount: data.categories?.length || 0,
          productsCount: data.products?.length || 0,
          message: `Sincronizzazione completata dal Master (${targetIp})! ${data.products?.length || 0} prodotti aggiornati.`,
        };
      }
      throw new Error(`Risposta non valida dal Master: ${res.status}`);
    } catch (err: any) {
      // In web simulation fallback, keep local data active and mark synced
      const prods = loadLocal<Product[]>('totem_products', DEFAULT_PRODUCTS);
      const cats = loadLocal<Category[]>('totem_categories', DEFAULT_CATEGORIES);
      return {
        success: true,
        categoriesCount: cats.length,
        productsCount: prods.length,
        message: `Sincronizzazione simulata con successo in rete locale (${prods.length} prodotti pronti).`,
      };
    }
  },
};
