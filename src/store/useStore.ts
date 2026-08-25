import { create } from 'zustand';
import { Category, Product, Order, Settings, OrderItem } from '../types';
import { api, setAuthToken } from '../api/client';
import { refreshCustomerMenuGlossary } from '../utils/customerMenuTranslation';

export type AppView =
  | 'welcome'
  | 'categories'
  | 'products'
  | 'cart'
  | 'order-confirmation'
  | 'take-number'
  | 'kitchen'
  | 'admin';

interface AppState {
  view: AppView;
  categories: Category[];
  products: Product[];
  settings: Settings | null;
  activeCategory: Category | null;
  cart: OrderItem[];
  lastOrder: Order | null;
  adminToken: string | null;
  searchQuery: string;
  isCartOpen: boolean;
  selectedProductForCustomization: Product | null;

  // Actions
  setView: (view: AppView) => void;
  setActiveCategory: (category: Category | null) => void;
  setSearchQuery: (query: string) => void;
  setIsCartOpen: (open: boolean) => void;
  setSelectedProductForCustomization: (product: Product | null) => void;

  // Cart Management
  addToCart: (item: OrderItem) => void;
  updateCartQuantity: (index: number, quantity: number) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;

  // Data Fetching
  fetchInitialData: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchProducts: () => Promise<void>;

  // Orders
  submitOrder: () => Promise<Order>;
  submitNumberOnlyOrder: () => Promise<Order>;

  // Admin Auth
  setAdminToken: (token: string | null) => void;
  logoutAdmin: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  view: 'welcome',
  categories: [],
  products: [],
  settings: null,
  activeCategory: null,
  cart: [],
  lastOrder: null,
  adminToken: null,
  searchQuery: '',
  isCartOpen: false,
  selectedProductForCustomization: null,

  setView: (view) => set({ view }),
  setActiveCategory: (category) => set({ activeCategory: category }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setIsCartOpen: (isCartOpen) => set({ isCartOpen }),
  setSelectedProductForCustomization: (selectedProductForCustomization) =>
    set({ selectedProductForCustomization }),

  addToCart: (newItem) => {
    set((state) => {
      // Find if exact same item exists (same product_id & customizations)
      const existingIdx = state.cart.findIndex(
        (item) =>
          item.product_id === newItem.product_id &&
          JSON.stringify(item.removed_ingredients || []) ===
            JSON.stringify(newItem.removed_ingredients || []) &&
          JSON.stringify(item.added_extras || []) ===
            JSON.stringify(newItem.added_extras || []) &&
          JSON.stringify(item.combo_selections || {}) ===
            JSON.stringify(newItem.combo_selections || {}) &&
          (item.notes || '') === (newItem.notes || '')
      );

      if (existingIdx >= 0) {
        const updated = [...state.cart];
        updated[existingIdx].quantity += newItem.quantity;
        return { cart: updated, isCartOpen: true };
      }
      return { cart: [...state.cart, newItem], isCartOpen: true };
    });
  },

  updateCartQuantity: (index, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        return { cart: state.cart.filter((_, i) => i !== index) };
      }
      const updated = [...state.cart];
      updated[index].quantity = quantity;
      return { cart: updated };
    });
  },

  removeFromCart: (index) => {
    set((state) => ({ cart: state.cart.filter((_, i) => i !== index) }));
  },

  clearCart: () => set({ cart: [] }),

  fetchInitialData: async () => {
    try {
      const [cats, prods, sets] = await Promise.all([
        api.getCategories(),
        api.getProducts(),
        api.getSettings(),
        refreshCustomerMenuGlossary(),
      ]);
      set({ categories: cats, products: prods, settings: sets });
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  },

  fetchSettings: async () => {
    try {
      const sets = await api.getSettings();
      set({ settings: sets });
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  },

  fetchCategories: async () => {
    try {
      const cats = await api.getCategories();
      set({ categories: cats });
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  },

  fetchProducts: async () => {
    try {
      const prods = await api.getProducts();
      set({ products: prods });
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  },

  submitOrder: async () => {
    const { cart } = get();
    if (cart.length === 0) throw new Error('Carrello vuoto');

    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const createdOrder = await api.createOrder(cart, totalPrice);

    set({
      lastOrder: createdOrder,
      cart: [],
      isCartOpen: false,
      view: 'order-confirmation',
    });
    return createdOrder;
  },

  submitNumberOnlyOrder: async () => {
    const createdOrder = await api.createNumberOnlyOrder();
    set({
      lastOrder: createdOrder,
      view: 'take-number',
    });
    return createdOrder;
  },

  setAdminToken: (token) => {
    setAuthToken(token || '');
    set({ adminToken: token });
  },

  logoutAdmin: () => {
    setAuthToken('');
    set({ adminToken: null, view: 'welcome' });
  },
}));
