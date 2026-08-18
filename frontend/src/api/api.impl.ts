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
