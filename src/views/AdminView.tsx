import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../api/client';
import { Product, Category, Settings } from '../types';
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
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const { adminToken, logoutAdmin, fetchSettings, settings } = useStore();
  const [tab, setTab] = useState<'products' | 'categories' | 'settings' | 'remote'>('products');

  // Products State
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // Categories State
  const [adminCategories, setAdminCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  // Settings State
  const [settingsForm, setSettingsForm] = useState<Partial<Settings>>({});

  // Auth State
  const [loginUser, setLoginUser] = useState('admin');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [savingMsg, setSavingMsg] = useState('');

  const loadAdminData = async () => {
    if (!adminToken) return;
    try {
      const [prods, cats, sets] = await Promise.all([
        api.getAdminProducts(),
        api.getAdminCategories(),
        api.getSettings(),
      ]);
      setAdminProducts(prods);
      setAdminCategories(cats);
      setSettingsForm(sets);
    } catch (err) {
      console.error('Failed to load admin data:', err);
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
      <div className="min-h-[calc(100vh-70px)] bg-zinc-950 flex items-center justify-center p-6 text-white">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-extrabold">Login Amministratore</h2>
            <p className="text-xs text-zinc-400">Inserisci le credenziali di accesso</p>
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
    } catch (err: any) {
      alert('Errore eliminazione categoria');
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async () => {
    try {
      await api.updateSettings(settingsForm);
      await fetchSettings();
      setSavingMsg('Impostazioni salvate con successo!');
      setTimeout(() => setSavingMsg(''), 3000);
    } catch (err: any) {
      alert('Errore salvataggio impostazioni');
    }
  };

  // Handle Reset Counter
  const handleResetOrderCounter = async () => {
    if (!confirm('Resettare il contatore del numero ordini a 1?')) return;
    try {
      await api.resetOrderNumber();
      alert('Contatore numero ordini resettato a 1!');
    } catch (err) {
      alert('Errore reset contatore');
    }
  };

  // Handle Seed
  const handleSeedDatabase = async () => {
    if (!confirm('Ripristinare i dati e i menu iniziali di default?')) return;
    try {
      await api.seedDatabase();
      await loadAdminData();
      alert('Database reinizializzato con i dati di default!');
    } catch (err) {
      alert('Errore re-seed');
    }
  };

  return (
    <div className="min-h-[calc(100vh-70px)] bg-zinc-950 p-6 sm:p-8 max-w-7xl mx-auto text-white">
      {/* Admin Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
            Gestionale Totem
          </span>
          <h2 className="text-3xl font-black text-white mt-2">Pannello Amministrativo</h2>
        </div>

        <button
          onClick={logoutAdmin}
          className="self-start sm:self-auto px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-rose-400 hover:text-rose-300 rounded-2xl text-xs font-bold transition-all flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Esci Admin</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar mb-8">
        {[
          { id: 'products', label: 'Prodotti', icon: FastForward },
          { id: 'categories', label: 'Categorie', icon: Grid },
          { id: 'settings', label: 'Impostazioni Totem', icon: SettingsIcon },
          { id: 'remote', label: 'Pannello Remoto Web', icon: ExternalLink },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id as any)}
              className={`px-5 py-3 rounded-2xl text-xs font-extrabold transition-all border flex items-center gap-2 flex-shrink-0 ${
                isActive
                  ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/20'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PRODUCTS */}
      {tab === 'products' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Elenco Prodotti ({adminProducts.length})</h3>
            <button
              onClick={() =>
                setEditingProduct({
                  name: '',
                  description: '',
                  price: 5.0,
                  category_id: adminCategories[0]?.id || '',
                  is_available: true,
                  available: true,
                  product_type: 'simple',
                  base_ingredients: [],
                  extra_additions: [],
                  combo_groups: [],
                })
              }
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-md shadow-rose-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Prodotto</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminProducts.map((p) => {
              const catName = adminCategories.find((c) => c.id === p.category_id)?.name || 'N/D';
              return (
                <div
                  key={p.id}
                  className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-start justify-between gap-3"
                >
                  <div className="flex gap-3">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-14 h-14 object-cover rounded-xl bg-zinc-800"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center text-xs text-zinc-600">
                        No img
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-white text-sm">{p.name}</h4>
                      <p className="text-xs text-rose-400 font-extrabold mt-0.5">€{p.price.toFixed(2)}</p>
                      <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-md mt-1 inline-block">
                        {catName}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingProduct({ ...p })}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl"
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

      {/* TAB 2: CATEGORIES */}
      {tab === 'categories' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Categorie Menù ({adminCategories.length})</h3>
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
                className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-white text-base">{c.name}</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">{c.description}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingCategory({ ...c })}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(c.id)}
                    className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SETTINGS */}
      {tab === 'settings' && (
        <div className="max-w-xl bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-6">
          <h3 className="text-xl font-bold text-white">Impostazioni Ristorante</h3>

          {savingMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{savingMsg}</span>
            </div>
          )}

          <div className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">
                Nome Ristorante
              </label>
              <input
                type="text"
                value={settingsForm.restaurant_name || ''}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, restaurant_name: e.target.value })
                }
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">
                URL Logo Immagine
              </label>
              <input
                type="text"
                value={settingsForm.logo || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, logo: e.target.value })}
                placeholder="https://..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">
                PIN Accesso Amministratore (Default 0000)
              </label>
              <input
                type="text"
                maxLength={4}
                value={settingsForm.admin_pin || '0000'}
                onChange={(e) => setSettingsForm({ ...settingsForm, admin_pin: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500 font-mono tracking-widest text-center"
              />
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Salva Impostazioni</span>
            </button>

            <div className="pt-6 border-t border-zinc-800 space-y-3">
              <h4 className="font-bold text-zinc-300">Azioni Rapide & Reset</h4>
              <div className="flex gap-3">
                <button
                  onClick={handleResetOrderCounter}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold text-xs"
                >
                  Reset Numero Ordini
                </button>
                <button
                  onClick={handleSeedDatabase}
                  className="flex-1 py-3 bg-rose-950/60 hover:bg-rose-900/60 text-rose-400 border border-rose-800/50 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-seed Dati Iniziali</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REMOTE ADMIN WEB PANEL */}
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
                    alert(`URL copiato: ${url}`);
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition-all"
                >
                  Copia Link
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
                  <span className="text-[11px] uppercase tracking-wider text-rose-400 font-bold block">Scansiona con Fotocamera</span>
                  <p className="text-xs text-zinc-400 mt-1 truncate">Inquadra dal telefono per aprire subito il pannello</p>
                </div>
              </div>

              <div className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-2xl flex flex-col justify-center">
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold block">Indirizzo Web Diretto</span>
                <code className="text-xs text-rose-400 font-mono mt-1 break-all bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                  {typeof window !== 'undefined' ? `${window.location.origin}/remote/` : '/remote/'}
                </code>
              </div>

              <div className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-2xl flex flex-col justify-center">
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold block">Credenziali Admin</span>
                <p className="text-xs text-zinc-300 mt-1">
                  PIN predefinito: <span className="font-mono text-white font-bold bg-zinc-800 px-1.5 py-0.5 rounded">{settings?.admin_pin || settingsForm.admin_pin || '0000'}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="w-full h-[650px] border border-zinc-800 rounded-3xl overflow-hidden bg-zinc-950 shadow-2xl">
            <iframe src="/remote/" className="w-full h-full border-none" title="Remote Admin" />
          </div>
        </div>
      )}

      {/* Product Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl w-full max-w-lg space-y-4">
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
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
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

      {/* Category Edit Modal */}
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
                <label className="block text-zinc-400 font-bold mb-1">URL Immagine Categoria</label>
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
    </div>
  );
};
