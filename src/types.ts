export interface ExtraAddition {
  name: string;
  price: number;
}

export interface ComboOption {
  name: string;
  price_delta: number;
}

export interface ComboGroup {
  name: string;
  min_selection: number;
  max_selection: number;
  options: ComboOption[];
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  image?: string;
  description?: string;
  order_index?: number;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  product_type: 'simple' | 'combo';
  base_ingredients?: string[];
  extra_additions?: ExtraAddition[];
  combo_groups?: ComboGroup[];
  is_available?: boolean;
  available?: boolean;
  allergens?: string[];
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  notes?: string;
  removed_ingredients?: string[];
  added_extras?: ExtraAddition[];
  combo_selections?: Record<string, string[]>;
}

export interface Order {
  id: string;
  order_number: number;
  items: OrderItem[];
  total_price: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  created_at: string;
  order_type: 'full' | 'number-only';
}

export interface Settings {
  restaurant_name: string;
  logo?: string;
  admin_pin?: string;
  currency_symbol?: string;
  custom_backend_url?: string;
  auto_print_courtesy?: boolean;
  auto_print_kitchen?: boolean;
  kitchen_display_enabled?: boolean;
}

export type UiSectionType = 'free_chips' | 'paid_extras' | 'single_choice' | 'multi_choice' | 'combo_group';

export interface GlobalOptionGroup {
  id: string;
  name: string;
  title?: string;
  type: UiSectionType;
  items?: string[];
  extras?: ExtraAddition[];
  chips?: string[];
  options?: ComboOption[];
  min_selection?: number;
  max_selection?: number;
}

export interface KioskSettings {
  kiosk_enabled: boolean;
  screen_orientation: 'portrait' | 'landscape' | 'sensor';
  secret_taps_count: number;
  secret_taps_position: 'top-right' | 'top-center' | 'top-left';
  admin_pin_required: boolean;
  screensaver_timeout_minutes: number;
  dimming_timeout_minutes: number;
  local_api_enabled: boolean;
}

export interface LicenseInfo {
  status: 'active' | 'trial' | 'expired';
  plan_name: string;
  hardware_id: string;
  expiry_date: string;
  trial_days_left: number;
  allowed_totems: number;
}

