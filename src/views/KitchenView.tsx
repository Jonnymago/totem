import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Order, OrderStatus } from '../types';
import { Clock, CheckCircle2, UtensilsCrossed, RefreshCw, AlertCircle, PlayCircle, CheckCheck } from 'lucide-react';
import { motion } from 'motion/react';

export const KitchenView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>('active');
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
    const interval = setInterval(loadOrders, 5000);
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

  const filteredOrders = orders.filter((ord) => {
    if (filter === 'pending') return ord.status === 'pending';
    if (filter === 'preparing') return ord.status === 'preparing';
    if (filter === 'ready') return ord.status === 'ready';
    return true; // 'active' -> non-completed
  });

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-extrabold text-white">Kitchen Display System</h2>
          </div>
          <p className="text-zinc-400 text-sm mt-1">
            Gestione in tempo reale delle comande in arrivo dal Totem
          </p>
        </div>

        <button
          onClick={loadOrders}
          disabled={loading}
          className="self-start sm:self-auto px-5 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl text-xs font-bold transition-all flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 text-amber-500 ${loading ? 'animate-spin' : ''}`} />
          <span>Aggiorna ({orders.length})</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar mb-6">
        {[
          { id: 'active', label: 'Tutti Attivi' },
          { id: 'pending', label: 'In Attesa' },
          { id: 'preparing', label: 'In Preparazione' },
          { id: 'ready', label: 'Pronti al Bordo' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all border flex-shrink-0 ${
              filter === tab.id
                ? 'bg-amber-500 border-amber-400 text-black shadow-lg shadow-amber-500/20'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8">
          <CheckCircle2 className="w-16 h-16 text-zinc-700 mx-auto mb-3" />
          <p className="text-lg font-bold text-zinc-400">Nessun ordine in questa sezione</p>
          <p className="text-xs text-zinc-600 mt-1">
            Le nuove comande inviate dal totem appariranno qui in automatico.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((ord) => (
            <motion.div
              key={ord.id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`bg-zinc-900 border rounded-3xl p-6 flex flex-col justify-between shadow-xl space-y-6 ${
                ord.status === 'pending'
                  ? 'border-amber-500/40'
                  : ord.status === 'preparing'
                  ? 'border-blue-500/40'
                  : 'border-emerald-500/40'
              }`}
            >
              {/* Order Header */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                      Comanda
                    </span>
                    <h3 className="text-3xl font-black text-rose-500">
                      #{String(ord.order_number).padStart(3, '0')}
                    </h3>
                  </div>
                  {getStatusBadge(ord.status)}
                </div>

                <div className="text-[11px] text-zinc-500 font-medium my-2">
                  Ora: {new Date(ord.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  {ord.order_type === 'number-only' && (
                    <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-md font-bold">
                      Solo Numero
                    </span>
                  )}
                </div>

                {/* Items Breakdown */}
                {ord.order_type === 'number-only' ? (
                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-xs text-amber-300 font-semibold my-4">
                    Cliente in attesa di ordinare a voce in cassa.
                  </div>
                ) : (
                  <div className="space-y-3 my-4 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                    {ord.items.map((it, i) => (
                      <div key={i} className="p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-white text-sm">
                          <span>
                            <span className="text-rose-500 font-black mr-1.5">{it.quantity}x</span>
                            {it.product_name}
                          </span>
                        </div>

                        {/* Removed Base Ingredients */}
                        {it.removed_ingredients && it.removed_ingredients.length > 0 && (
                          <p className="text-rose-400 font-bold">
                            NO: {it.removed_ingredients.join(', ')}
                          </p>
                        )}

                        {/* Extras */}
                        {it.added_extras && it.added_extras.length > 0 && (
                          <p className="text-emerald-400 font-bold">
                            + {it.added_extras.map((e) => e.name).join(', ')}
                          </p>
                        )}

                        {/* Combo selections */}
                        {it.combo_selections &&
                          Object.entries(it.combo_selections).map(([grp, opts]) => (
                            <p key={grp} className="text-zinc-300">
                              <span className="text-zinc-500 font-semibold">{grp}:</span> {opts.join(', ')}
                            </p>
                          ))}

                        {/* Notes */}
                        {it.notes && (
                          <p className="italic text-amber-300 bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20 mt-1">
                            Note: "{it.notes}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Action Buttons */}
              <div className="pt-2 border-t border-zinc-800 flex gap-2">
                {ord.status === 'pending' && (
                  <button
                    onClick={() => handleUpdateStatus(ord.id, 'preparing')}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Inizia Preparazione</span>
                  </button>
                )}

                {ord.status === 'preparing' && (
                  <button
                    onClick={() => handleUpdateStatus(ord.id, 'ready')}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Segna PRONTO</span>
                  </button>
                )}

                {ord.status === 'ready' && (
                  <button
                    onClick={() => handleUpdateStatus(ord.id, 'completed')}
                    className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CheckCheck className="w-4 h-4 text-emerald-400" />
                    <span>Completa / Archivia</span>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
