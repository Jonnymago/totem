import { create } from 'zustand';
import { ExtraAddition } from '@/src/api/api';

export interface CartItem {
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
}

interface CartStore {
  items: CartItem[];
  editingIndex: number | null;
  addItem: (item: CartItem) => void;
  updateItem: (index: number, item: CartItem) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  setEditingIndex: (index: number | null) => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  editingIndex: null,

  addItem: (item) => set((state) => ({ items: [...state.items, item] })),

  updateItem: (index, item) =>
    set((state) => ({
      items: state.items.map((it, i) => (i === index ? item : it)),
      editingIndex: null,
    })),

  removeItem: (index) =>
    set((state) => ({
      items: state.items.filter((_, i) => i !== index),
      editingIndex:
        state.editingIndex === index
          ? null
          : state.editingIndex !== null && state.editingIndex > index
            ? state.editingIndex - 1
            : state.editingIndex,
    })),

  updateQuantity: (index, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return {
          items: state.items.filter((_, i) => i !== index),
          editingIndex:
            state.editingIndex === index
              ? null
              : state.editingIndex !== null && state.editingIndex > index
                ? state.editingIndex - 1
                : state.editingIndex,
        };
      }
      return {
        items: state.items.map((item, i) =>
          i === index ? { ...item, quantity } : item
        ),
      };
    }),

  clearCart: () => set({ items: [], editingIndex: null }),

  setEditingIndex: (index) => set({ editingIndex: index }),

  getTotalPrice: () => {
    const state = get();
    return state.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  },

  getTotalItems: () => {
    const state = get();
    return state.items.reduce((total, item) => total + item.quantity, 0);
  },
}));
