import React, { useEffect, useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../api/client';
import { Order, OrderStatus } from '../types';
import {
  Clock,
  CheckCircle2,
  UtensilsCrossed,
  RefreshCw,
  PowerOff,
  Settings as SettingsIcon,
  Layers,
  Radio,
  Tv,
  Store,
  ChefHat,
  Coffee,
  Receipt,
  Flame,
  CheckCheck,
} from 'lucide-react';
import { motion } from 'motion/react';

export const KitchenView: React.FC = () => {
  const { settings, printers, products, setView, fetchPrinters, fetchProducts, fetchCategories } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await api.getCurrentOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load kitchen orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    fetchPrinters();
    fetchProducts();
    fetchCategories();
    const interval = setInterval(loadOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      await loadOrders();
    } catch (err) {
      alert('Errore aggiornamento stato ordine');
    }
  };

  // Build departments list from configured printers + default fallbacks
  const departments = useMemo(() => {
    const list: { id: string; name: string; icon: any; categoryIds: string[] }[] = [
      { id: 'all', name: 'Tutti i Reparti', icon: Layers, categoryIds: [] },
    ];

    if (printers && printers.length > 0) {
      printers.forEach((p) => {
        if (!p.enabled) return;
        let icon = ChefHat;
        const depLower = (p.department || '').toLowerCase();
        if (depLower.includes('pizza') || depLower.includes('forno')) icon = Flame;
        else if (depLower.includes('bar') || depLower.includes('bevande') || depLower.includes('caff')) icon = Coffee;
        else if (depLower.includes('cassa') || depLower.includes('ricevut') || depLower.includes('scontrin')) icon = Receipt;
        else if (depLower.includes('cucina') || depLower.includes('fritt')) icon = ChefHat;

        list.push({
          id: p.id,
          name: p.department || p.name,
          icon,
          categoryIds: p.assigned_category_ids || [],
        });
      });
    } else {
      // Default fallbacks if no printers configured yet
      list.push(
        { id: 'pizzeria', name: 'Pizzeria / Forno', icon: Flame, categoryIds: ['cat-2'] },
        { id: 'cucina', name: 'Cucina Calda & Fritti', icon: ChefHat, categoryIds: ['cat-1', 'cat-3', 'cat-4'] },
        { id: 'bar', name: 'Bar & Bevande', icon: Coffee, categoryIds: ['cat-5', 'cat-6'] }
      );
    }
    return list;
  }, [printers]);

  // Product category lookup map
  const productCategoryMap = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      map.set(p.id, p.category_id);
      map.set(p.name.toLowerCase().trim(), p.category_id);
    });
    return map;
  }, [products]);

  // Filter orders by status and department
  const filteredOrdersWithItems = useMemo(() => {
    const targetDept = departments.find((d) => d.id === selectedDepartment);
    const assignedCats = targetDept?.categoryIds || [];

    return orders
      .filter((ord) => {
        if (statusFilter === 'pending') return ord.status === 'pending';
        if (statusFilter === 'preparing') return ord.status === 'preparing';
        if (statusFilter === 'ready') return ord.status === 'ready';
        return ord.status !== 'completed' && ord.status !== 'cancelled';
      })
      .map((ord) => {
        if (selectedDepartment === 'all' || assignedCats.length === 0) {
          return { order: ord, visibleItems: ord.items };
        }
        // Filter items matching department categories
        const matchingItems = ord.items.filter((item) => {
          const catId = productCategoryMap.get(item.product_id) || productCategoryMap.get(item.product_name.toLowerCase().trim());
          return catId ? assignedCats.includes(catId) : true;
        });
        return { order: ord, visibleItems: matchingItems };
      })
      .filter((entry) => {
        if (selectedDepartment === 'all') return true;
        if (entry.order.order_type === 'number-only') return true;
        return entry.visibleItems.length > 0;
      });
  }, [orders, statusFilter, selectedDepartment, departments, productCategoryMap]);

  if (settings && settings.kitchen_display_enabled === false) {
    return (
      <div className="min-h-[calc(100vh-70px)] bg-zinc-950 flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
            <PowerOff className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-extrabold text-white">Monitor Cucina Disattivato</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            La modalità Display Cucina KDS è attualmente disattivata nelle impostazioni amministratore. Puoi riattivarla in qualsiasi momento.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={async () => {
                await api.updateSettings({ kitchen_display_enabled: true });
                await useStore.getState().fetchSettings();
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer"
            >
              Riattiva Monitor Cucina Subito
            </button>
            <button
              onClick={() => setView('admin')}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <SettingsIcon className="w-4 h-4" />
              <span>Apri Impostazioni Amministratore</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold rounded-full flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> In attesa
          </span>
        );
      case 'preparing':
        return (
          <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold rounded-full flex items-center gap-1.5">
            <UtensilsCrossed className="w-3.5 h-3.5" /> In preparazione
          </span>
        );
      case 'ready':
        return (
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-full flex items-center gap-1.5 animate-pulse">
            <CheckCircle2 className="w-3.5 h-3.5" /> Pronto per il ritiro
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-zinc-800 text-zinc-400 text-xs font-bold rounded-full">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-[calc(100vh-70px)] bg-zinc-950 p-6 sm:p-8 max-w-7xl mx-auto text-white">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-extrabold text-white">KDS & Monitor Reparti</h2>
                <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> LAN Live
                </span>
              </div>
              <p className="text-zinc-400 text-sm mt-0.5">
                Ricezione in tempo reale da tutti i Totem & Smistamento automatico ai reparti
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadOrders}
            disabled={loading}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-amber-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Aggiorna ({orders.length})</span>
          </button>
        </div>
      </div>

      {/* Department KDS Selector (Dynamic from Printers) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-amber-500" /> Reparto di Visualizzazione KDS:
          </span>
          <span className="text-xs text-zinc-500">
            {departments.length - 1} Reparti Attivi
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {departments.map((dept) => {
            const IconComponent = dept.icon;
            const isSelected = selectedDepartment === dept.id;
            return (
              <button
                key={dept.id}
                onClick={() => setSelectedDepartment(dept.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all border flex items-center gap-2 cursor-pointer flex-shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 border-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20 scale-[1.02]'
                    : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-850'
                }`}
              >
                <IconComponent className={`w-4 h-4 ${isSelected ? 'text-zinc-950' : 'text-amber-400'}`} />
                <span>{dept.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Order Status Filters */}
      <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar mb-6 border-b border-zinc-800/60">
        {[
          { id: 'active', label: 'Tutti gli Ordini Attivi' },
          { id: 'pending', label: 'In Attesa' },
          { id: 'preparing', label: 'In Preparazione' },
          { id: 'ready', label: 'Pronti al Bordo' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex-shrink-0 cursor-pointer ${
              statusFilter === tab.id
                ? 'bg-zinc-800 border-zinc-600 text-white shadow-md'
                : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {filteredOrdersWithItems.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8">
          <CheckCircle2 className="w-16 h-16 text-zinc-700 mx-auto mb-3" />
          <p className="text-lg font-bold text-zinc-400">Nessuna comanda in questo reparto</p>
          <p className="text-xs text-zinc-600 mt-1 max-w-md mx-auto">
            Quando i clienti ordinano piatti assegnati a questo reparto, i biglietti digitali compariranno qui automaticamente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrdersWithItems.map(({ order: ord, visibleItems }) => (
            <motion.div
              key={ord.id}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`bg-zinc-900 border rounded-3xl p-5 flex flex-col justify-between shadow-xl space-y-4 ${
                ord.status === 'pending'
                  ? 'border-amber-500/50 shadow-amber-950/10'
                  : ord.status === 'preparing'
                  ? 'border-blue-500/50 shadow-blue-950/10'
                  : ord.status === 'ready'
                  ? 'border-emerald-500/50 shadow-emerald-950/10'
                  : 'border-zinc-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">
                        Comanda
                      </span>
                      {ord.station_name && (
                        <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-[10px] font-extrabold rounded-md border border-zinc-700">
                          {ord.station_name}
                        </span>
                      )}
                    </div>
                    <h3 className="text-3xl font-black text-rose-500 tracking-tight">
                      #{String(ord.order_number).padStart(3, '0')}
                    </h3>
                  </div>
                  {getStatusBadge(ord.status as OrderStatus)}
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium my-2">
                  <span>Ora: {new Date(ord.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                  {ord.order_type === 'number-only' ? (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-bold">
                      Solo Numero Cassa
                    </span>
                  ) : (
                    <span className="text-zinc-500 font-bold">
                      {visibleItems.length} {visibleItems.length === 1 ? 'Piatto' : 'Piatti'}
                    </span>
                  )}
                </div>

                {/* Items Breakdown */}
                {ord.order_type === 'number-only' ? (
                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-xs text-amber-300 font-semibold my-3">
                    Cliente in attesa di ordinare a voce in cassa.
                  </div>
                ) : (
                  <div className="space-y-2.5 my-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                    {visibleItems.map((it, i) => (
                      <div key={i} className="p-3 bg-zinc-950/90 rounded-2xl border border-zinc-800/90 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-white text-sm">
                          <span>
                            <span className="text-rose-500 font-black mr-1.5">{it.quantity}x</span>
                            {it.product_name}
                          </span>
                        </div>

                        {/* Removed Base Ingredients */}
                        {it.removed_ingredients && it.removed_ingredients.length > 0 && (
                          <p className="text-rose-400 font-bold text-[11px]">
                            ⛔ SENZA: {it.removed_ingredients.join(', ')}
                          </p>
                        )}

                        {/* Extras */}
                        {it.added_extras && it.added_extras.length > 0 && (
                          <p className="text-emerald-400 font-bold text-[11px]">
                            + EXTRA: {it.added_extras.map((e) => e.name).join(', ')}
                          </p>
                        )}

                        {/* Combo selections */}
                        {it.combo_selections &&
                          Object.entries(it.combo_selections).map(([grp, opts]) => (
                            <p key={grp} className="text-zinc-300 text-[11px]">
                              <span className="text-zinc-500 font-semibold">{grp}:</span> {opts.join(', ')}
                            </p>
                          ))}

                        {/* Notes */}
                        {it.notes && (
                          <p className="italic text-amber-300 bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20 mt-1">
                            Note: &quot;{it.notes}&quot;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Action Buttons */}
              <div className="pt-3 border-t border-zinc-800/80 flex flex-col gap-2">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleUpdateStatus(ord.id, 'pending')}
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      ord.status === 'pending'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-white'
                    }`}
                  >
                    In Attesa
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(ord.id, 'preparing')}
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      ord.status === 'preparing'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-white'
                    }`}
                  >
                    In Prep.
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(ord.id, 'ready')}
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      ord.status === 'ready'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Pronto
                  </button>
                </div>

                <button
                  onClick={() => handleUpdateStatus(ord.id, 'completed')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20 cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Completa & Archivia Comanda</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
