import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Ticket, Utensils, ArrowRight, Lock, Sparkles } from 'lucide-react';
import { PinPadModal } from '../components/PinPadModal';
import { motion } from 'motion/react';

export const WelcomeView: React.FC = () => {
  const { setView, settings, submitNumberOnlyOrder } = useStore();
  const [dotClickCount, setDotClickCount] = useState(0);
  const [showPinModal, setShowPinModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const clickTimerRef = useRef<any>(null);

  const handleSecretDotPress = () => {
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    const newCount = dotClickCount + 1;
    setDotClickCount(newCount);

    if (newCount >= 7) {
      setDotClickCount(0);
      setShowPinModal(true);
      return;
    }

    clickTimerRef.current = setTimeout(() => {
      setDotClickCount(0);
    }, 3000);
  };

  const handleTakeNumber = async () => {
    try {
      setLoading(true);
      await submitNumberOnlyOrder();
    } catch (err: any) {
      alert('Errore durante la creazione del numero ordine');
    } finally {
      setLoading(false);
    }
  };

  const restaurantName = settings?.restaurant_name || 'TOTEM RISTORANTE';
  const logo = settings?.logo;

  return (
    <div className="relative min-h-screen bg-zinc-950 flex flex-col justify-between p-6 sm:p-12 overflow-hidden selection:bg-rose-500 selection:text-white">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-rose-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-amber-500/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Secret Admin Dot */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={handleSecretDotPress}
          className="relative w-8 h-8 rounded-full bg-zinc-800/60 border border-zinc-700/50 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all opacity-80 hover:opacity-100"
          title="Secret Admin Trigger"
        >
          <Lock className="w-3.5 h-3.5" />
          {dotClickCount > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-lg animate-scale-in">
              {dotClickCount}
            </span>
          )}
        </button>
      </div>

      {/* Main Header / Branding */}
      <div className="my-auto max-w-4xl mx-auto w-full text-center space-y-8 z-10 py-8">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-6"
        >
          {logo ? (
            <img
              src={logo}
              alt="Logo"
              className="w-36 h-36 object-contain rounded-3xl bg-zinc-900/80 p-3 border border-zinc-800 shadow-2xl"
            />
          ) : (
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-rose-600 to-rose-500 text-white flex items-center justify-center shadow-2xl shadow-rose-600/30 border border-rose-400/20">
              <Utensils className="w-14 h-14" />
            </div>
          )}

          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-rose-400 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" /> Kiosk Touchscreen
            </span>
            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
              {restaurantName}
            </h1>
            <p className="text-lg sm:text-2xl text-zinc-400 font-medium max-w-lg mx-auto">
              Benvenuto! Come desideri procedere oggi?
            </p>
          </div>
        </motion.div>

        {/* Big Action Choice Buttons */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 max-w-3xl mx-auto"
        >
          {/* Option 1: Take Number Only */}
          <button
            onClick={handleTakeNumber}
            disabled={loading}
            className="group relative p-8 bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800 hover:border-zinc-700 rounded-3xl text-left transition-all duration-300 shadow-xl hover:shadow-2xl flex flex-col justify-between gap-8 active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Ticket className="w-8 h-8" />
              </div>
              <div className="w-10 h-10 rounded-full bg-zinc-800 group-hover:bg-amber-500 group-hover:text-black text-zinc-400 flex items-center justify-center transition-all">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-white group-hover:text-amber-400 transition-colors">
                Prendi solo il Numero
              </h3>
              <p className="text-sm text-zinc-400 mt-2 font-medium">
                Ritira il tuo ticket e ordina a voce direttamente in cassa.
              </p>
            </div>
          </button>

          {/* Option 2: Full Order at Kiosk */}
          <button
            onClick={() => setView('categories')}
            className="group relative p-8 bg-gradient-to-br from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 border border-rose-400/30 rounded-3xl text-left transition-all duration-300 shadow-xl shadow-rose-600/20 hover:shadow-rose-600/40 flex flex-col justify-between gap-8 active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="w-16 h-16 rounded-2xl bg-white/20 text-white backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
                <Utensils className="w-8 h-8" />
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center group-hover:bg-white group-hover:text-rose-600 transition-all">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-white">
                Ordina al Totem
              </h3>
              <p className="text-sm text-rose-100/90 mt-2 font-medium">
                Sfoglia il menù digitale, personalizza i piatti ed invia l'ordine.
              </p>
            </div>
          </button>
        </motion.div>
      </div>

      {/* Footer Info */}
      <footer className="text-center text-xs text-zinc-600 font-medium z-10">
        Touchscreen Order Station • Versione 2.0
      </footer>

      <PinPadModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={() => {
          setShowPinModal(false);
          setView('admin');
        }}
        correctPin={settings?.admin_pin || '0000'}
      />
    </div>
  );
};
