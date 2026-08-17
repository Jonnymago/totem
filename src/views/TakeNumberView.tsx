import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Ticket, Home, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export const TakeNumberView: React.FC = () => {
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
        <p className="text-zinc-400 text-lg">Nessun numero generato.</p>
        <button
          onClick={() => setView('welcome')}
          className="mt-4 px-6 py-3 bg-rose-600 text-white rounded-2xl font-bold"
        >
          Torna alla Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 blur-[160px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center shadow-2xl relative z-10 space-y-6"
      >
        <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-3xl flex items-center justify-center mx-auto border border-amber-500/20 shadow-lg shadow-amber-500/10">
          <Ticket className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Ticket Numero Assegnato
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-3">Prendi il tuo Numero!</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Conserva questo numero e vai in cassa a ordinare a voce
          </p>
        </div>

        {/* Big Ticket Display */}
        <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 border border-zinc-800 rounded-3xl p-8 my-4 shadow-inner relative overflow-hidden">
          <div className="text-xs uppercase font-bold text-zinc-500 tracking-wider">
            Il Tuo Numero
          </div>
          <div className="text-7xl font-black text-amber-500 tracking-tight my-3">
            #{String(lastOrder.order_number).padStart(3, '0')}
          </div>
          <div className="text-xs text-zinc-400 flex items-center justify-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Mostra questo numero al personale di cassa</span>
          </div>
        </div>

        <div className="pt-2 space-y-3">
          <p className="text-xs text-zinc-500">
            Ritorno alla home in{' '}
            <span className="font-extrabold text-amber-400">{countdown}s</span>
          </p>

          <button
            onClick={() => setView('welcome')}
            className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 border border-zinc-700 transition-all"
          >
            <Home className="w-4 h-4 text-zinc-400" />
            <span>Torna alla Schermata Iniziale</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
