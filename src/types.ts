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
  order_position?: number;
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
  is_featured?: boolean;
  isFeatured?: boolean;
  allergens?: string[];
  order_position?: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface OrderItem {
  product_id: string;
  product_name: string;
  category_id?: string;
  product_category_id?: string;
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
  order_prefix?: string;
  items: OrderItem[];
  total_price: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  created_at: string;
  order_type: 'full' | 'number-only';
  station_id?: string;
  station_name?: string;
  customer_type?: 'eat-in' | 'takeaway';
}

export type StationRole = 'mono' | 'master' | 'satellite' | 'kds';

export interface StationTopologyConfig {
  role: StationRole;
  station_id: string;
  station_name: string;
  master_server_ip: string;
  master_server_port: number;
  auto_discovery?: boolean;
  auto_discovery_enabled?: boolean;
  order_prefix: string;
  sync_interval_sec: number;
  sync_interval_seconds?: number;
  last_synced_at?: string;
  last_sync_timestamp?: string;
}

export interface PrinterDevice {
  id: string;
  name: string;
  department?: string;
  interface_type?: 'bluetooth' | 'tcp_raw' | 'usb' | 'sunmi_internal' | 'system';
  type?: 'bluetooth' | 'tcp_raw' | 'usb' | 'sunmi_internal' | 'system';
  address?: string;
  connection_string?: string;
  paper_width_mm?: 58 | 80;
  paper_width?: '58mm' | '80mm';
  assigned_category_ids?: string[];
  print_courtesy?: boolean;
  is_courtesy?: boolean;
  print_kitchen?: boolean;
  is_kitchen?: boolean;
  enabled?: boolean;
  is_active?: boolean;
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

export interface Settings {
  restaurant_name: string;
  logo?: string;
  admin_username?: string;
  admin_password?: string;
  admin_pin?: string;
  recovery_code?: string;
  is_first_access_completed?: boolean;
  currency_symbol?: string;
  custom_backend_url?: string;
  auto_print_courtesy?: boolean;
  auto_print_kitchen?: boolean;
  kitchen_display_enabled?: boolean;
  order_reset_mode?: 'manual' | 'automatic' | 'daily';
  order_reset_time?: string;
  station_topology?: StationTopologyConfig;
  printers?: PrinterDevice[];
  department_kds?: DepartmentKDS[];
  signage_screens?: SignageScreen[];
  display_queue_calling?: number | null;
  display_queue_config?: DisplayQueueConfig;
  dq_mode?: 'full' | 'products';
  dq_theme?: 'dark' | 'light';
  dq_cols?: number;
  dq_interval?: number;
  dq_hero?: boolean;
  dq_dayparting?: boolean;
  dq_animation?: 'kenburns' | 'slide' | 'fade';
}

export interface DisplayQueueConfig {
  show_prefix?: boolean;
  show_only_number?: boolean;
  show_header?: boolean;
  show_clock?: boolean;
  show_ready_list?: boolean;
  show_prep_list?: boolean;
  show_instruction?: boolean;
  number_size?: 'normal' | 'huge' | 'gigantic' | 'standard' | 'large' | 'giant';
  call_label?: string;
  instruction_text?: string;
  theme?: 'dark-navy' | 'dark-pure' | 'light' | 'nero-led' | 'oled' | 'contrast';
  sound_enabled?: boolean;
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
  order_position?: number;
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
