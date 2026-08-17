import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { CheckCircle2, Home, Printer, Clock, FileText } from 'lucide-react';
import { motion } from 'motion/react';

export const OrderConfirmationView: React.FC = () => {
  const { lastOrder, setView } = useStore();
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setView('welcome');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [setView]);

  if (!lastOrder) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-zinc-400 text-lg">Nessun ordine trovato.</p>
        <button
          onClick={() => setView('welcome')}
          className="mt-4 px-6 py-3 bg-rose-600 text-white rounded-2xl font-bold"
        >
          Torna alla Home
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[160px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center shadow-2xl relative z-10 space-y-6"
      >
        {/* Success Icon */}
        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Ordine Inviato con Successo
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-3">Grazie dal Totem!</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Conserva il tuo numero e attendi la chiamata al display
          </p>
        </div>

        {/* Big Queue Ticket Badge */}
        <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 border border-zinc-800 rounded-3xl p-6 my-4 shadow-inner relative overflow-hidden">
          <div className="text-xs uppercase font-bold text-zinc-500 tracking-wider">
            Numero Ordine
          </div>
          <div className="text-6xl font-black text-rose-500 tracking-tight my-2">
            #{String(lastOrder.order_number).padStart(3, '0')}
          </div>
          <div className="text-xs text-zinc-400 flex items-center justify-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            <span>In attesa di preparazione</span>
          </div>
        </div>

        {/* Receipt Summary */}
        <div className="bg-zinc-950/60 rounded-2xl p-4 border border-zinc-800/80 text-left text-xs space-y-2 max-h-44 overflow-y-auto custom-scrollbar">
          <div className="font-bold text-zinc-300 pb-2 border-b border-zinc-800 flex justify-between">
            <span>Riepilogo Piatti ({lastOrder.items.length})</span>
            <span>Totale: €{lastOrder.total_price.toFixed(2)}</span>
          </div>
          {lastOrder.items.map((it, idx) => (
            <div key={idx} className="flex justify-between text-zinc-400">
              <span>
                {it.quantity}x {it.product_name}
              </span>
              <span className="font-semibold text-zinc-300">
                €{(it.price * it.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Countdown & Buttons */}
        <div className="pt-2 space-y-3">
          <p className="text-xs text-zinc-500">
            Ritorno automatico alla schermata principale in{' '}
            <span className="font-extrabold text-rose-400">{countdown}s</span>
          </p>

          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border border-zinc-700 transition-all"
            >
              <Printer className="w-4 h-4 text-zinc-400" />
              <span>Stampa Ricevuta</span>
            </button>

            <button
              onClick={() => setView('welcome')}
              className="flex-1 py-4 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
            >
              <Home className="w-4 h-4" />
              <span>Nuovo Ordine</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
