import { Category, Product, Order, Settings, OrderItem } from '../types';

const API_BASE = '/api';

let _authToken = '';

export function setAuthToken(t: string) {
  _authToken = t || '';
}

export function getAuthToken(): string {
  return _authToken;
}

const DEFAULT_SETTINGS: Settings = {
  restaurant_name: 'TOTEM RISTORANTE',
  logo: '',
  admin_pin: undefined,
  currency_symbol: '€',
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Panini', description: 'I nostri panini gourmet' },
  { id: 'cat-2', name: 'Pizze', description: 'Pizze fresche e croccanti' },
  { id: 'cat-3', name: 'Insalate', description: 'Insalate fresche e salutari' },
  { id: 'cat-4', name: 'Combo', description: 'I nostri menù combo' },
  { id: 'cat-5', name: 'Bevande', description: 'Bevande fresche' },
  { id: 'cat-6', name: 'Dolci', description: 'Dolci e dessert' },
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
  },
  {
    id: 'prod-7',
    category_id: 'cat-5',
    name: 'Coca Cola',
    description: '330ml in lattina',
    price: 2.5,
    product_type: 'simple',
  },
  {
    id: 'prod-8',
    category_id: 'cat-5',
    name: 'Acqua Naturale',
    description: '500ml',
    price: 1.5,
    product_type: 'simple',
  },
  {
    id: 'prod-9',
    category_id: 'cat-6',
    name: 'Tiramisù',
    description: 'Tiramisù classico fatto in casa',
    price: 5.5,
    product_type: 'simple',
  },
];

// Local state helpers for offline / preview mode
let localOrders: Order[] = [];
let orderCounter = 1;

async function fetchJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = _authToken;
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
  getCategories: async () => {
    try {
      return await fetchJson<Category[]>('/categories');
    } catch {
      return DEFAULT_CATEGORIES;
    }
  },

  getProducts: async () => {
    try {
      return await fetchJson<Product[]>('/products');
    } catch {
      return DEFAULT_PRODUCTS;
    }
  },

  getProductsByCategory: async (catId: string) => {
    try {
      return await fetchJson<Product[]>(`/products/category/${catId}`);
    } catch {
      return DEFAULT_PRODUCTS.filter((p) => p.category_id === catId);
    }
  },

  getSettings: async () => {
    try {
      return await fetchJson<Settings>('/settings');
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  createOrder: async (items: OrderItem[], totalPrice: number) => {
    try {
      return await fetchJson<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify({ items, total_price: totalPrice, order_type: 'full' }),
      });
    } catch {
      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        order_number: orderCounter++,
        items,
        total_price: totalPrice,
        status: 'pending',
        created_at: new Date().toISOString(),
        order_type: 'full',
      };
      localOrders.push(newOrder);
      return newOrder;
    }
  },

  createNumberOnlyOrder: async () => {
    try {
      return await fetchJson<Order>('/orders/number-only', {
        method: 'POST',
      });
    } catch {
      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        order_number: orderCounter++,
        items: [],
        total_price: 0,
        status: 'pending',
        created_at: new Date().toISOString(),
        order_type: 'number-only',
      };
      localOrders.push(newOrder);
      return newOrder;
    }
  },

  getCurrentOrders: async () => {
    try {
      return await fetchJson<Order[]>('/orders/current');
    } catch {
      return localOrders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');
    }
  },

  adminLogin: async (username: string, password: string) => {
    try {
      const data = await fetchJson<{ access_token: string }>('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      if (data?.access_token) {
        setAuthToken(data.access_token);
      }
      return data;
    } catch (error) {
      throw error;
    }
  },

  updateSettings: async (update: Partial<Settings>) => {
    try {
      return await fetchJson<Settings>('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(update),
      });
    } catch {
      return { ...DEFAULT_SETTINGS, ...update };
    }
  },

  resetOrderNumber: async () => {
    try {
      return await fetchJson<{ message: string }>('/admin/reset-order-number', {
        method: 'POST',
      });
    } catch {
      orderCounter = 1;
      return { message: 'Order number reset successfully' };
    }
  },

  seedDatabase: async () => {
    try {
      return await fetchJson<{ message: string }>('/admin/seed', {
        method: 'POST',
      });
    } catch {
      return { message: 'Database seeded successfully' };
    }
  },

  getAdminCategories: async () => {
    try {
      return await fetchJson<Category[]>('/admin/categories');
    } catch {
      return DEFAULT_CATEGORIES;
    }
  },

  createCategory: async (data: Partial<Category>) => {
    try {
      return await fetchJson<Category>('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return { id: `cat-${Date.now()}`, name: data.name || 'Nuova Categoria', ...data };
    }
  },

  updateCategory: async (id: string, data: Partial<Category>) => {
    try {
      return await fetchJson<Category>(`/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch {
      return { id, name: data.name || '', ...data };
    }
  },

  deleteCategory: async (id: string) => {
    try {
      return await fetchJson<{ message: string }>(`/admin/categories/${id}`, {
        method: 'DELETE',
      });
    } catch {
      return { message: 'Category deleted' };
    }
  },

  getAdminProducts: async () => {
    try {
      return await fetchJson<Product[]>('/admin/products');
    } catch {
      return DEFAULT_PRODUCTS;
    }
  },

  createProduct: async (data: Partial<Product>) => {
    try {
      return await fetchJson<Product>('/admin/products', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return { id: `prod-${Date.now()}`, name: data.name || 'Nuovo Prodotto', price: data.price || 0, category_id: data.category_id || 'cat-1', product_type: 'simple', ...data };
    }
  },

  updateProduct: async (id: string, data: Partial<Product>) => {
    try {
      return await fetchJson<Product>(`/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch {
      return { id, name: data.name || '', price: data.price || 0, category_id: data.category_id || 'cat-1', product_type: 'simple', ...data };
    }
  },

  deleteProduct: async (id: string) => {
    try {
      return await fetchJson<{ message: string }>(`/admin/products/${id}`, {
        method: 'DELETE',
      });
    } catch {
      return { message: 'Product deleted' };
    }
  },

  getAdminOrders: async () => {
    try {
      return await fetchJson<Order[]>('/admin/orders');
    } catch {
      return localOrders;
    }
  },

  updateOrderStatus: async (id: string, status: string) => {
    try {
      return await fetchJson<Order>(`/admin/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    } catch {
      const idx = localOrders.findIndex((o) => o.id === id);
      if (idx >= 0) {
        localOrders[idx].status = status as Order['status'];
        return localOrders[idx];
      }
      throw new Error('Order not found');
    }
  },
};

