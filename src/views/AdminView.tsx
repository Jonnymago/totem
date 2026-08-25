import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../api/client';
import {
  Product,
  Category,
  Settings,
  GlobalOptionGroup,
  KioskSettings,
  LicenseInfo,
  Order,
  OrderStatus,
} from '../types';
import {
  FastForward,
  Grid,
  Settings as SettingsIcon,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  ExternalLink,
  Save,
  Lock,
  CheckCircle,
  Smartphone,
  ShieldCheck,
  UtensilsCrossed,
  Layers,
  Volume2,
  Moon,
  Clock,
  AlertTriangle,
  Copy,
  Monitor,
  Check,
  CheckCheck,
  PlayCircle,
  Sparkles,
  Printer,
  FileText,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GuideHelper } from '../components/GuideHelper';

type AdminTab =
  | 'products'
  | 'categories'
  | 'groups'
  | 'orders'
  | 'kiosk'
  | 'settings'
  | 'license'
  | 'remote'
  | 'guide';

export const AdminView: React.FC = () => {
  const { adminToken, logoutAdmin, fetchSettings, settings } = useStore();
  const [tab, setTab] = useState<AdminTab>('products');

  // Products
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [prodSearch, setProdSearch] = useState('');
  const [prodCatFilter, setProdCatFilter] = useState<string>('all');

  // Categories
  const [adminCategories, setAdminCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  // Groups & Modifiers
  const [adminGroups, setAdminGroups] = useState<GlobalOptionGroup[]>([]);
  const [editingGroup, setEditingGroup] = useState<Partial<GlobalOptionGroup> | null>(null);

  // Orders
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [orderFilter, setOrderFilter] = useState<string>('all');

  // Kiosk & Hardware
  const [kioskConfig, setKioskConfig] = useState<KioskSettings>({
    kiosk_enabled: true,
    screen_orientation: 'portrait',
    secret_taps_count: 7,
    secret_taps_position: 'top-right',
    admin_pin_required: true,
    screensaver_timeout_minutes: 3,
    dimming_timeout_minutes: 5,
    local_api_enabled: true,
  });

  // License & Subscriptions
  const [licenseData, setLicenseData] = useState<LicenseInfo>({
    status: 'active',
    plan_name: 'Piano Base Totem (Google Play)',
    hardware_id: 'TOTEM-HW-88F4-A92B',
    expiry_date: '2026-12-31',
    trial_days_left: 30,
    allowed_totems: 1,
  });

  // Settings
  const [settingsForm, setSettingsForm] = useState<Partial<Settings>>({});

  // Auth & UI feedback
  const [loginUser, setLoginUser] = useState('admin');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [statusNotice, setStatusNotice] = useState<{ msg: string; type: 'success' | 'info' } | null>(null);
  const [loading, setLoading] = useState(false);

  const showNotification = (msg: string, type: 'success' | 'info' = 'success') => {
    setStatusNotice({ msg, type });
    setTimeout(() => setStatusNotice(null), 3500);
  };

  const loadAdminData = async () => {
    if (!adminToken) return;
    try {
      setLoading(true);
      const [prods, cats, groups, ords, sets, kiosk, lic] = await Promise.all([
        api.getAdminProducts(),
        api.getAdminCategories(),
        api.getGlobalGroups(),
        api.getAdminOrders(),
        api.getSettings(),
        api.getKioskSettings(),
        api.getLicenseInfo(),
      ]);
      setAdminProducts(prods);
      setAdminCategories(cats);
      setAdminGroups(groups);
      setAdminOrders(ords);
      setSettingsForm(sets);
      setKioskConfig(kiosk);
      setLicenseData(lic);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      loadAdminData();
    }
  }, [adminToken]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const data = await api.adminLogin(loginUser, loginPass);
      useStore.getState().setAdminToken(data.access_token);
    } catch (err: any) {
      setLoginError(err.message || 'Credenziali errate');
    }
  };

  if (!adminToken) {
    return (
      <div className="min-h-[calc(100vh-70px)] bg-zinc-950 flex items-center justify-center p-4 sm:p-6 text-white">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-extrabold">Login Amministratore</h2>
            <p className="text-xs text-zinc-400">Inserisci credenziali per accedere al gestionale</p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl font-bold text-center">
              {loginError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Username</label>
              <input
                type="text"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Password</label>
              <input
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-12 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-rose-600/20"
          >
            Accedi
          </button>
        </form>
      </div>
    );
  }

  // Handle Product Save
  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    try {
      if (editingProduct.id) {
        await api.updateProduct(editingProduct.id, editingProduct);
      } else {
        await api.createProduct(editingProduct);
      }
      setEditingProduct(null);
      await loadAdminData();
      showNotification('Prodotto salvato con successo!');
    } catch (err: any) {
      alert(err.message || 'Errore salvataggio prodotto');
    }
  };

  // Handle Product Delete
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo prodotto?')) return;
    try {
      await api.deleteProduct(id);
      await loadAdminData();
      showNotification('Prodotto eliminato');
    } catch (err: any) {
      alert('Errore eliminazione');
    }
  };

  // Handle Category Save
  const handleSaveCategory = async () => {
    if (!editingCategory) return;
    try {
      if (editingCategory.id) {
        await api.updateCategory(editingCategory.id, editingCategory);
      } else {
        await api.createCategory(editingCategory);
      }
      setEditingCategory(null);
      await loadAdminData();
      showNotification('Categoria salvata con successo!');
    } catch (err: any) {
      alert('Errore salvataggio categoria');
    }
  };

  // Handle Category Delete
  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Eliminare questa categoria?')) return;
    try {
      await api.deleteCategory(id);
      await loadAdminData();
      showNotification('Categoria eliminata');
    } catch (err: any) {
      alert('Errore eliminazione categoria');
    }
  };

  // Handle Group Save
  const handleSaveGroup = async () => {
    if (!editingGroup) return;
    try {
      if (editingGroup.id) {
        await api.updateGlobalGroup(editingGroup.id, editingGroup);
      } else {
        await api.createGlobalGroup(editingGroup);
      }
      setEditingGroup(null);
      await loadAdminData();
      showNotification('Gruppo opzioni salvato!');
    } catch (err: any) {
      alert('Errore salvataggio gruppo');
    }
  };

  // Handle Group Delete
  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Eliminare questo gruppo opzioni?')) return;
    try {
      await api.deleteGlobalGroup(id);
      await loadAdminData();
      showNotification('Gruppo eliminato');
    } catch (err: any) {
      alert('Errore eliminazione gruppo');
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async () => {
    try {
      await api.updateSettings(settingsForm);
      await fetchSettings();
      showNotification('Impostazioni salvate con successo!');
    } catch (err: any) {
      alert('Errore salvataggio impostazioni');
    }
  };

  // Handle Kiosk Config Update
  const handleUpdateKiosk = async (patch: Partial<KioskSettings>) => {
    try {
      const updated = { ...kioskConfig, ...patch };
      setKioskConfig(updated);
      await api.updateKioskSettings(patch);
      showNotification('Configurazione Kiosk aggiornata!');
    } catch (err) {
      alert('Errore salvataggio kiosk');
    }
  };

  // Handle Order Status Update
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      await loadAdminData();
      showNotification(`Stato ordine aggiornato a: ${newStatus}`);
    } catch (err) {
      alert('Errore aggiornamento ordine');
    }
  };

  // Handle Restore Subscriptions
  const handleRestorePurchases = async () => {
    try {
      setLoading(true);
      const lic = await api.getLicenseInfo();
      setLicenseData(lic);
      showNotification('Stato abbonamento Google Play verificato e aggiornato!');
    } catch (err) {
      alert('Impossibile verificare lo stato abbonamento.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Trial
  const handleResetTrial = async () => {
    try {
      const res = await api.resetTrialLicense();
      setLicenseData(res);
      showNotification('Periodo di prova ripristinato (30 giorni)');
    } catch (err) {
      alert('Errore ripristino prova');
    }
  };

  // Filtered Products
  const filteredProducts = adminProducts.filter((p) => {
    if (prodCatFilter !== 'all' && p.category_id !== prodCatFilter) return false;
    if (prodSearch.trim()) {
      const q = prodSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  // Filtered Orders
  const filteredOrders = adminOrders.filter((o) => {
    if (orderFilter === 'all') return true;
    return o.status === orderFilter;
  });

  const tabList: { id: AdminTab; label: string; icon: any; count?: number }[] = [
    { id: 'products', label: 'Prodotti', icon: FastForward, count: adminProducts.length },
    { id: 'categories', label: 'Categorie', icon: Grid, count: adminCategories.length },
    { id: 'groups', label: 'Gruppi & Modificatori', icon: Layers, count: adminGroups.length },
    { id: 'orders', label: 'Comande & KDS', icon: UtensilsCrossed, count: adminOrders.length },
    { id: 'kiosk', label: 'Controllo Kiosk & Hardware', icon: Smartphone },
    { id: 'settings', label: 'Impostazioni & Stampanti', icon: SettingsIcon },
    { id: 'license', label: 'Licenza & Abbonamenti', icon: ShieldCheck },
    { id: 'remote', label: 'Pannello Remoto Web', icon: ExternalLink },
    { id: 'guide', label: 'Guida & Manuale', icon: BookOpen },
  ];

  return (
    <div className="min-h-[calc(100vh-70px)] bg-zinc-950 p-4 sm:p-8 max-w-7xl mx-auto text-white">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
              Pannello Totem Unificato
            </span>
            <span className="text-[11px] font-bold text-zinc-500">v2.0</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
            Gestione Ecosistema Totem & Kiosk
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Configurazione completa di prodotti, categorie, comande, blocco hardware e licenze
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadAdminData}
            disabled={loading}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-rose-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Sincronizza</span>
          </button>
          <button
            onClick={logoutAdmin}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-800/40 text-rose-400 rounded-2xl text-xs font-bold transition-all flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Esci Admin</span>
          </button>
        </div>
      </div>

      {/* Floating Status Notification */}
      <AnimatePresence>
        {statusNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-3 shadow-lg shadow-emerald-950/20"
          >
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{statusNotice.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Tabs (Responsive Swipeable / Grid) */}
      <div className="flex gap-2.5 overflow-x-auto pb-4 custom-scrollbar mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabList.map((item) => {
          const Icon = item.icon;
          const isActive = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`px-4 py-3 rounded-2xl text-xs font-extrabold transition-all border flex items-center gap-2 flex-shrink-0 ${
                isActive
                  ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/20'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
              {typeof item.count === 'number' && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                    isActive ? 'bg-black/30 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PRODOTTI */}
      {/* ========================================================= */}
      {tab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">Elenco Prodotti ({adminProducts.length})</h3>
              <p className="text-xs text-zinc-400">Gestisci ingredienti, prezzi, varianti ed extra</p>
            </div>

            <button
              onClick={() =>
                setEditingProduct({
                  name: '',
                  description: '',
                  price: 6.5,
                  category_id: adminCategories[0]?.id || 'cat-1',
                  is_available: true,
                  available: true,
                  product_type: 'simple',
                  base_ingredients: ['Ingrediente 1', 'Ingrediente 2'],
                  extra_additions: [{ name: 'Extra Formaggio', price: 1.0 }],
                  allergens: [],
                })
              }
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-md shadow-rose-600/20 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Prodotto</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={prodSearch}
              onChange={(e) => setProdSearch(e.target.value)}
              placeholder="🔍 Cerca prodotto o ingrediente..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
            />
            <select
              value={prodCatFilter}
              onChange={(e) => setProdCatFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="all">Tutte le Categorie ({adminProducts.length})</option>
              {adminCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((p) => {
              const catName = adminCategories.find((c) => c.id === p.category_id)?.name || 'Generale';
              return (
                <div
                  key={p.id}
                  className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl flex flex-col justify-between gap-4 hover:border-zinc-700 transition-all shadow-md"
                >
                  <div className="flex items-start gap-3">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-16 h-16 object-cover rounded-2xl bg-zinc-800 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-xs text-zinc-600 flex-shrink-0">
                        No img
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-extrabold text-white text-base truncate">{p.name}</h4>
                        <span className="font-black text-rose-400 text-sm">€{p.price.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">{p.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md font-semibold">
                          {catName}
                        </span>
                        {p.product_type === 'combo' && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-md">
                            Combo
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            p.is_available !== false && p.available !== false
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {p.is_available !== false && p.available !== false ? 'Disponibile' : 'Esaurito'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-zinc-800">
                    <button
                      onClick={() => setEditingProduct({ ...p })}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Modifica</span>
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                      title="Elimina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CATEGORIE */}
      {/* ========================================================= */}
      {tab === 'categories' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Categorie Menù ({adminCategories.length})</h3>
              <p className="text-xs text-zinc-400">Ordina e organizza le categorie del menù digitale</p>
            </div>
            <button
              onClick={() =>
                setEditingCategory({
                  name: '',
                  description: '',
                  order_index: adminCategories.length,
                })
              }
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-md shadow-rose-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Nuova Categoria</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminCategories.map((c) => (
              <div
                key={c.id}
                className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl flex items-center justify-between gap-3 hover:border-zinc-700 transition-all shadow-md"
              >
                <div>
                  <h4 className="font-extrabold text-white text-base">{c.name}</h4>
                  <p className="text-xs text-zinc-400 mt-1">{c.description || 'Nessuna descrizione'}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingCategory({ ...c })}
                    className="p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(c.id)}
                    className="p-2.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: GRUPPI & MODIFICATORI */}
      {/* ========================================================= */}
      {tab === 'groups' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Gruppi Varianti & Opzioni ({adminGroups.length})</h3>
              <p className="text-xs text-zinc-400">Configura salse a scelta, cotture ed extra riutilizzabili</p>
            </div>
            <button
              onClick={() =>
                setEditingGroup({
                  name: '',
                  title: '',
                  type: 'free_chips',
                  chips: ['Opzione 1', 'Opzione 2'],
                  min_selection: 0,
                  max_selection: 2,
                })
              }
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-md shadow-rose-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Gruppo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminGroups.map((g) => (
              <div
                key={g.id}
                className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl space-y-4 hover:border-zinc-700 transition-all shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-white text-base">{g.name}</h4>
                    <p className="text-xs text-zinc-400">{g.title || 'Titolo non specificato'}</p>
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md mt-1 inline-block">
                      Tipo: {g.type}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingGroup({ ...g })}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(g.id)}
                      className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {g.chips && g.chips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {g.chips.map((chip, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-lg border border-zinc-700"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                )}

                {g.extras && g.extras.length > 0 && (
                  <div className="space-y-1 text-xs">
                    {g.extras.map((ex, idx) => (
                      <div key={idx} className="flex justify-between text-zinc-300">
                        <span>{ex.name}</span>
                        <span className="font-bold text-rose-400">+€{ex.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: COMANDE & KDS */}
      {/* ========================================================= */}
      {tab === 'orders' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">Comande & KDS Cucina ({adminOrders.length})</h3>
              <p className="text-xs text-zinc-400">Monitora e avanza lo stato delle comande in cucina</p>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {[
                { id: 'all', label: 'Tutti' },
                { id: 'pending', label: 'In Attesa' },
                { id: 'preparing', label: 'In Preparazione' },
                { id: 'ready', label: 'Pronti' },
                { id: 'completed', label: 'Completati' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setOrderFilter(f.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    orderFilter === f.id
                      ? 'bg-rose-600 border-rose-500 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8">
              <CheckCircle className="w-12 h-12 text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-400 font-bold">Nessuna comanda trovata in questa sezione</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((ord) => (
                <div
                  key={ord.id}
                  className={`bg-zinc-900 border rounded-3xl p-5 space-y-4 shadow-lg ${
                    ord.status === 'pending'
                      ? 'border-amber-500/40'
                      : ord.status === 'preparing'
                      ? 'border-blue-500/40'
                      : ord.status === 'ready'
                      ? 'border-emerald-500/40'
                      : 'border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">Comanda</span>
                      <h4 className="text-2xl font-black text-rose-500">
                        #{String(ord.order_number).padStart(3, '0')}
                      </h4>
                    </div>
                    <span
                      className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                        ord.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400'
                          : ord.status === 'preparing'
                          ? 'bg-blue-500/20 text-blue-400'
                          : ord.status === 'ready'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {ord.order_type === 'number-only' ? (
                      <div className="p-3 bg-amber-500/10 text-amber-300 rounded-xl">
                        Ticket Solo Numero (ordinazione in cassa)
                      </div>
                    ) : (
                      ord.items.map((it, i) => (
                        <div key={i} className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800">
                          <span className="font-bold text-white">
                            <span className="text-rose-400 mr-1">{it.quantity}x</span> {it.product_name}
                          </span>
                          {it.removed_ingredients && it.removed_ingredients.length > 0 && (
                            <p className="text-[11px] text-rose-400 font-medium">
                              Senza: {it.removed_ingredients.join(', ')}
                            </p>
                          )}
                          {it.added_extras && it.added_extras.length > 0 && (
                            <p className="text-[11px] text-emerald-400 font-medium">
                              + {it.added_extras.map((e) => e.name).join(', ')}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-zinc-800">
                    {ord.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'preparing')}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span>Inizia</span>
                      </button>
                    )}
                    {ord.status === 'preparing' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'ready')}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Pronto</span>
                      </button>
                    )}
                    {ord.status === 'ready' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'completed')}
                        className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <CheckCheck className="w-4 h-4 text-emerald-400" />
                        <span>Completa</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: KIOSK CONTROL & HARDWARE */}
      {/* ========================================================= */}
      {tab === 'kiosk' && (
        <div className="space-y-6 max-w-4xl">
          <div>
            <h3 className="text-xl font-bold text-white">Controllo Totem Kiosk & Hardware</h3>
            <p className="text-xs text-zinc-400">
              Parametri hardware del totem, blocco touchscreen, orientamento e diagnostica
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Blocco Schermo & Kiosk Mode */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-base">Modalità Kiosk & Blocco Task</h4>
                  <p className="text-xs text-zinc-400">Nasconde la navigation bar Android e blocca l'uscita</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-800/80">
                <span className="text-xs font-bold text-zinc-300">Stato Blocco Kiosk</span>
                <button
                  onClick={() => handleUpdateKiosk({ kiosk_enabled: !kioskConfig.kiosk_enabled })}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    kioskConfig.kiosk_enabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {kioskConfig.kiosk_enabled ? '🔒 Attivo' : '🔓 Disattivato'}
                </button>
              </div>

              {/* Secret Taps Settings */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-zinc-400">
                  Trigger Tocco Segreto per Admin (Numero Tocchi)
                </label>
                <div className="flex gap-2">
                  {[5, 7, 10].map((taps) => (
                    <button
                      key={taps}
                      onClick={() => handleUpdateKiosk({ secret_taps_count: taps })}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all border ${
                        kioskConfig.secret_taps_count === taps
                          ? 'bg-rose-600 border-rose-500 text-white'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      {taps} Tocchi
                    </button>
                  ))}
                </div>
              </div>

              {/* Touch Position */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-zinc-400">Posizione Tocco Segreto</label>
                <div className="flex gap-2">
                  {[
                    { id: 'top-right', label: 'In alto a destra' },
                    { id: 'top-center', label: 'In alto al centro' },
                    { id: 'top-left', label: 'In alto a sinistra' },
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      onClick={() => handleUpdateKiosk({ secret_taps_position: pos.id as any })}
                      className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-all border ${
                        kioskConfig.secret_taps_position === pos.id
                          ? 'bg-rose-600 border-rose-500 text-white'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Orientamento & Timeout */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-base">Display & Orientamento</h4>
                  <p className="text-xs text-zinc-400">Adatta l'interfaccia a totem verticali o tablet orizzontali</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-400">Orientamento Schermo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateKiosk({ screen_orientation: 'portrait' })}
                    className={`py-3 rounded-2xl text-xs font-extrabold transition-all border flex items-center justify-center gap-2 ${
                      kioskConfig.screen_orientation === 'portrait'
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span>Verticale (Totem)</span>
                  </button>
                  <button
                    onClick={() => handleUpdateKiosk({ screen_orientation: 'landscape' })}
                    className={`py-3 rounded-2xl text-xs font-extrabold transition-all border flex items-center justify-center gap-2 ${
                      kioskConfig.screen_orientation === 'landscape'
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span>Orizzontale (Tablet)</span>
                  </button>
                </div>
              </div>

              {/* Hardware Test Tool Buttons */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-zinc-400">Test Strumenti Hardware</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => showNotification('Test risveglio schermo inviato!')}
                    className="p-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Test Wake</span>
                  </button>
                  <button
                    onClick={() => showNotification('Segnale acustico inviato agli altoparlanti')}
                    className="p-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Test Beep</span>
                  </button>
                  <button
                    onClick={() => showNotification('Salvaschermo avviato (tocca per uscire)')}
                    className="p-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Moon className="w-3.5 h-3.5 text-purple-400" />
                    <span>Screensaver</span>
                  </button>
                  <button
                    onClick={() => showNotification('Dimming 10% attivato per risparmio energetico')}
                    className="p-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Dimming 10%</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: IMPOSTAZIONI & STAMPANTI */}
      {/* ========================================================= */}
      {tab === 'settings' && (
        <div className="max-w-2xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 rounded-3xl space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white">Impostazioni Ristorante & Stampanti</h3>
            <p className="text-xs text-zinc-400">Parametri di base, PIN di sicurezza e stampanti termiche</p>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Nome Ristorante</label>
              <input
                type="text"
                value={settingsForm.restaurant_name || ''}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, restaurant_name: e.target.value })
                }
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">URL Logo Insegna</label>
              <input
                type="text"
                value={settingsForm.logo || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, logo: e.target.value })}
                placeholder="https://..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">
                PIN Amministratore (4 cifre per accesso rapido su Totem)
              </label>
              <input
                type="text"
                maxLength={4}
                value={settingsForm.admin_pin || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, admin_pin: e.target.value })}
                placeholder="Es. 1234"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500 font-mono tracking-widest text-center text-lg"
              />
            </div>

            {/* Printing Switches */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Stampa Automatica Ticket Cortesia</span>
                  <span className="text-[11px] text-zinc-400">Rilascia scontrino con numero per il cliente</span>
                </div>
                <button
                  onClick={() =>
                    setSettingsForm({
                      ...settingsForm,
                      auto_print_courtesy: !settingsForm.auto_print_courtesy,
                    })
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    settingsForm.auto_print_courtesy ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {settingsForm.auto_print_courtesy ? 'Attivo' : 'Spento'}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                <div>
                  <span className="text-xs font-bold text-white block">Stampa Automatica Comanda Cucina</span>
                  <span className="text-[11px] text-zinc-400">Invia ticket direttamente al banco di preparazione</span>
                </div>
                <button
                  onClick={() =>
                    setSettingsForm({
                      ...settingsForm,
                      auto_print_kitchen: !settingsForm.auto_print_kitchen,
                    })
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    settingsForm.auto_print_kitchen !== false ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {settingsForm.auto_print_kitchen !== false ? 'Attivo' : 'Spento'}
                </button>
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 text-sm"
            >
              <Save className="w-4 h-4" />
              <span>Salva Modifiche</span>
            </button>

            {/* Dangerous Actions */}
            <div className="pt-6 border-t border-zinc-800 space-y-3">
              <h4 className="font-bold text-zinc-300 text-xs uppercase tracking-wider">
                Manutenzione & Ripristino
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={async () => {
                    if (confirm('Resettare il contatore ordini a 1?')) {
                      await api.resetOrderNumber();
                      showNotification('Contatore numero ordini resettato a 1!');
                    }
                  }}
                  className="py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Numero Ordini</span>
                </button>
                <button
                  onClick={async () => {
                    if (confirm('Ripristinare il database e i piatti di default?')) {
                      await api.seedDatabase();
                      await loadAdminData();
                      showNotification('Database reinizializzato con successo!');
                    }
                  }}
                  className="py-3 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-seed Dati Default</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 7: LICENZA & ABBONAMENTI GOOGLE PLAY */}
      {/* ========================================================= */}
      {tab === 'license' && (
        <div className="space-y-6 max-w-4xl">
          <div>
            <h3 className="text-xl font-bold text-white">Licenza & Abbonamenti Google Play</h3>
            <p className="text-xs text-zinc-400">
              Verifica lo stato di attivazione del dispositivo e i piani di sottoscrizione
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Card */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <span className="text-xs text-zinc-400">Dispositivo Hardware</span>
                  <p className="font-mono text-white text-sm font-bold">{licenseData.hardware_id}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    licenseData.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {licenseData.status === 'active' ? 'Licenza Attiva' : 'Periodo di Prova'}
                </span>
              </div>

              <div className="space-y-2 text-xs text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Piano Attivo:</span>
                  <span className="font-bold text-white">{licenseData.plan_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Scadenza:</span>
                  <span className="font-bold text-white">{licenseData.expiry_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Totem Autorizzati:</span>
                  <span className="font-bold text-white">{licenseData.allowed_totems} Postazione</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleRestorePurchases}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  🔄 Verifica & Ripristina Abbonamento Google Play
                </button>
                <button
                  onClick={handleResetTrial}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all"
                >
                  Ripristina prova (30 giorni gratuiti)
                </button>
              </div>
            </div>

            {/* Plans List - Google Play Store Subscriptions */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
              <h4 className="font-extrabold text-white text-base">Piani Abbonamento Google Play Store</h4>
              <p className="text-xs text-zinc-400">
                Tutti i piani includono tutte le funzionalità (Kiosk, KDS cucina, stampe termiche e controllo remoto). Gli abbonamenti vengono gestiti direttamente tramite Google Play Billing.
              </p>
              <div className="space-y-3">
                {[
                  {
                    title: 'Piano Base Totem - Mensile',
                    price: '€9,99 / mese',
                    desc: 'Fatturazione mensile ricorrente. Singola postazione Totem, ordini illimitati, display cucina KDS, stampe ESC/POS e backup.',
                    badge: 'Flessibile',
                  },
                  {
                    title: 'Piano Base Totem - Annuale',
                    price: '€89,00 / anno',
                    desc: 'Fatturazione annuale ricorrente. Risparmia oltre il 25% (2 mesi gratuiti inclusi). Tutte le funzionalità attive.',
                    badge: 'Miglior Valore (2 Mesi Gratis)',
                    popular: true,
                  },
                ].map((plan, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-2xl border ${
                      plan.popular
                        ? 'bg-rose-950/20 border-rose-500/40 text-white shadow-lg'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-sm">{plan.title}</h5>
                        {plan.badge && (
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            plan.popular ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-300'
                          }`}>
                            {plan.badge}
                          </span>
                        )}
                      </div>
                      <span className="font-extrabold text-rose-400 text-xs">{plan.price}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">{plan.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 8: PANNELLO REMOTO WEB & QR */}
      {/* ========================================================= */}
      {tab === 'remote' && (
        <div className="space-y-6">
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-lg">Pannello Web Admin Remoto</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Accedi a questo pannello di controllo da qualsiasi smartphone o computer per gestire prodotti, listini, categorie e ordini in tempo reale.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/remote/`;
                    navigator.clipboard.writeText(url);
                    showNotification(`URL copiato negli appunti!`);
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copia Link</span>
                </button>
                <a
                  href="/remote/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-rose-600/20"
                >
                  <span>Apri in nuova scheda</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-2xl flex items-center gap-4">
                <div className="bg-white p-2 rounded-xl">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                      typeof window !== 'undefined' ? `${window.location.origin}/remote/` : ''
                    )}`}
                    alt="QR Code Remoto"
                    className="w-20 h-20"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] uppercase tracking-wider text-rose-400 font-bold block">
                    Scansiona con Telefono
                  </span>
                  <p className="text-xs text-zinc-400 mt-1">Inquadra dal telefono per gestire il totem a distanza</p>
                </div>
              </div>

              <div className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-2xl flex flex-col justify-center">
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold block">
                  Indirizzo Web Diretto
                </span>
                <code className="text-xs text-rose-400 font-mono mt-1 break-all bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                  {typeof window !== 'undefined' ? `${window.location.origin}/remote/` : '/remote/'}
                </code>
              </div>

              <div className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-2xl flex flex-col justify-center">
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold block">
                  Credenziali Admin
                </span>
                <p className="text-xs text-zinc-300 mt-1">
                  PIN impostato:{' '}
                  <span className="font-mono text-white font-bold bg-zinc-800 px-1.5 py-0.5 rounded">
                    {settings?.admin_pin || settingsForm.admin_pin || '1234'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="w-full h-[650px] border border-zinc-800 rounded-3xl overflow-hidden bg-zinc-950 shadow-2xl">
            <iframe src="/remote/" className="w-full h-full border-none" title="Remote Admin" />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 9: GUIDA OPERATIVA & MANUALE */}
      {/* ========================================================= */}
      {tab === 'guide' && (
        <div className="space-y-6">
          <GuideHelper embedded />
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT PRODUCT */}
      {/* ========================================================= */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl w-full max-w-lg space-y-4 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="font-bold text-lg text-white">
              {editingProduct.id ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Nome Prodotto</label>
                <input
                  type="text"
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Descrizione</label>
                <textarea
                  value={editingProduct.description || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white resize-none h-16"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Prezzo (€)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingProduct.price || 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Categoria</label>
                  <select
                    value={editingProduct.category_id || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category_id: e.target.value })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                  >
                    {adminCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">URL Immagine</label>
                <input
                  type="text"
                  value={editingProduct.image || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">
                  Ingredienti Base (separati da virgola, es: Pane, Carne, Formaggio)
                </label>
                <input
                  type="text"
                  value={editingProduct.base_ingredients?.join(', ') || ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      base_ingredients: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Es. Carne, Pomodoro, Salsa"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <span className="font-bold text-zinc-300">Disponibilità Prodotto</span>
                <button
                  type="button"
                  onClick={() =>
                    setEditingProduct({
                      ...editingProduct,
                      is_available: !editingProduct.is_available,
                      available: !editingProduct.is_available,
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs ${
                    editingProduct.is_available !== false
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {editingProduct.is_available !== false ? 'Disponibile' : 'Esaurito'}
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingProduct(null)}
                className="flex-1 py-3 bg-zinc-800 text-zinc-300 rounded-xl font-bold text-xs"
              >
                Annulla
              </button>
              <button
                onClick={handleSaveProduct}
                className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold text-xs"
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT CATEGORY */}
      {/* ========================================================= */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl w-full max-w-md space-y-4">
            <h3 className="font-bold text-lg text-white">
              {editingCategory.id ? 'Modifica Categoria' : 'Nuova Categoria'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Nome Categoria</label>
                <input
                  type="text"
                  value={editingCategory.name || ''}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, name: e.target.value })
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Descrizione</label>
                <input
                  type="text"
                  value={editingCategory.description || ''}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, description: e.target.value })
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">URL Immagine</label>
                <input
                  type="text"
                  value={editingCategory.image || ''}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, image: e.target.value })
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingCategory(null)}
                className="flex-1 py-3 bg-zinc-800 text-zinc-300 rounded-xl font-bold text-xs"
              >
                Annulla
              </button>
              <button
                onClick={handleSaveCategory}
                className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold text-xs"
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT OPTION GROUP */}
      {/* ========================================================= */}
      {editingGroup && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl w-full max-w-md space-y-4">
            <h3 className="font-bold text-lg text-white">
              {editingGroup.id ? 'Modifica Gruppo' : 'Nuovo Gruppo Opzioni'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Nome Gruppo Interno</label>
                <input
                  type="text"
                  value={editingGroup.name || ''}
                  onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                  placeholder="Es. Salse a Scelta"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Titolo Visibile al Cliente</label>
                <input
                  type="text"
                  value={editingGroup.title || ''}
                  onChange={(e) => setEditingGroup({ ...editingGroup, title: e.target.value })}
                  placeholder="Es. Scegli le tue salse preferite"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Opzioni (separate da virgola)</label>
                <input
                  type="text"
                  value={editingGroup.chips?.join(', ') || ''}
                  onChange={(e) =>
                    setEditingGroup({
                      ...editingGroup,
                      chips: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Es. Ketchup, Maionese, BBQ"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Min Selezioni</label>
                  <input
                    type="number"
                    value={editingGroup.min_selection ?? 0}
                    onChange={(e) =>
                      setEditingGroup({ ...editingGroup, min_selection: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Max Selezioni</label>
                  <input
                    type="number"
                    value={editingGroup.max_selection ?? 1}
                    onChange={(e) =>
                      setEditingGroup({ ...editingGroup, max_selection: parseInt(e.target.value) || 1 })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingGroup(null)}
                className="flex-1 py-3 bg-zinc-800 text-zinc-300 rounded-xl font-bold text-xs"
              >
                Annulla
              </button>
              <button
                onClick={handleSaveGroup}
                className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold text-xs"
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
