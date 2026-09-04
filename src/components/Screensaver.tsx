import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useI18n } from '../utils/i18n';
import { Utensils, Sparkles, Moon, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScreensaverProps {
  isActive: boolean;
  onDismiss: () => void;
}

export const Screensaver: React.FC<ScreensaverProps> = ({ isActive, onDismiss }) => {
  const { settings, products } = useStore();
  const { t } = useI18n();
  const [time, setTime] = useState('');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Filtra i prodotti preferiti con la stella per lo screensaver; se nessuno ha la stella, usa tutti i prodotti disponibili con immagine o descrizione
  const featuredProducts = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const starred = products.filter(
      (p) => (p.is_featured === true || p.isFeatured === true) && p.is_available !== false && p.available !== false
    );
    if (starred.length > 0) return starred;
    return products.filter((p) => p.is_available !== false && p.available !== false);
  }, [products]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Rotazione prodotti ogni 5 secondi nello screensaver
  useEffect(() => {
    if (!isActive || featuredProducts.length === 0) return;
    const slideInterval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % featuredProducts.length);
    }, 5000);
    return () => clearInterval(slideInterval);
  }, [isActive, featuredProducts.length]);

  if (!isActive) return null;

  const currentProduct = featuredProducts[currentSlideIndex % Math.max(1, featuredProducts.length)];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onDismiss}
        onTouchStart={onDismiss}
        className="fixed inset-0 z-[9999] bg-black text-white flex flex-col items-center justify-between p-6 sm:p-12 cursor-pointer select-none overflow-hidden"
      >
        {/* Top bar with time and branding */}
        <div className="w-full flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {settings?.logo ? (
              <img
                src={settings.logo}
                alt="Logo"
                className="w-12 h-12 object-contain rounded-2xl bg-zinc-900/80 p-1.5 border border-zinc-800 shadow-lg"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-rose-600/20 text-rose-500 border border-rose-500/30 flex items-center justify-center">
                <Utensils className="w-5 h-5" />
              </div>
            )}
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                {settings?.restaurant_name || 'TOTEM RISTORANTE'}
              </h2>
              <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1">
                <Moon className="w-3 h-3 text-rose-400" /> Salvaschermo attivo
              </span>
            </div>
          </div>

          <div className="text-right">
            <h1 className="text-2xl sm:text-4xl font-black font-mono tracking-tight text-white/90">
              {time}
            </h1>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Tocca per ordinare</span>
          </div>
        </div>

        {/* Center: Featured Product / Sandwich Hero or Classic Clock */}
        {currentProduct ? (
          <div className="w-full max-w-4xl my-auto py-4 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 z-10">
            {/* Product Image */}
            <div className="relative flex-shrink-0">
              {currentProduct.image ? (
                <motion.img
                  key={currentProduct.id}
                  initial={{ opacity: 0, scale: 0.92, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  src={currentProduct.image}
                  alt={currentProduct.name}
                  className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 object-cover rounded-3xl bg-zinc-900 border-2 border-zinc-800 shadow-2xl shadow-rose-950/30"
                />
              ) : (
                <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-3xl bg-zinc-900 border-2 border-zinc-800 flex flex-col items-center justify-center text-zinc-600 gap-3">
                  <Utensils className="w-20 h-20 text-zinc-700" />
                  <span className="text-xs font-bold text-zinc-500 uppercase">Specialità del giorno</span>
                </div>
              )}
              <div className="absolute top-4 right-4 bg-amber-500 text-zinc-950 font-black text-xs px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>IN EVIDENZA</span>
              </div>
            </div>

            {/* Product Details */}
            <motion.div
              key={`details-${currentProduct.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="text-center md:text-left space-y-4 max-w-md"
            >
              <span className="inline-block text-xs font-mono font-bold uppercase tracking-widest text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                La nostra Specialità
              </span>
              <h3 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                {currentProduct.name}
              </h3>
              {currentProduct.description ? (
                <p className="text-sm sm:text-base text-zinc-400 line-clamp-3 leading-relaxed">
                  {currentProduct.description}
                </p>
              ) : null}
              <div className="text-3xl sm:text-4xl font-black text-rose-400 font-mono pt-1">
                €{currentProduct.price.toFixed(2)}
              </div>

              <div className="pt-2">
                <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-rose-600 text-white font-extrabold text-base shadow-2xl shadow-rose-600/50 border border-rose-400/30 animate-pulse">
                  <Sparkles className="w-5 h-5" />
                  <span>{t('welcome.order_totem_title', 'Tocca lo schermo per ordinare')}</span>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          /* Fallback when no products */
          <div className="text-center space-y-8 my-auto z-10">
            <div className="space-y-2">
              <h1 className="text-7xl sm:text-9xl font-black font-mono tracking-tighter text-white/90">
                {time}
              </h1>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-400 tracking-tight">
                {settings?.restaurant_name || 'TOTEM RISTORANTE'}
              </h2>
            </div>

            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-rose-600 text-white font-extrabold text-lg shadow-2xl shadow-rose-600/40 border border-rose-400/30"
            >
              <Sparkles className="w-5 h-5" />
              <span>{t('welcome.order_totem_title', 'Tocca lo schermo per iniziare')}</span>
            </motion.div>
          </div>
        )}

        {/* Footer */}
        <div className="w-full flex items-center justify-between text-xs text-zinc-600 font-mono z-10 border-t border-zinc-900 pt-4">
          <span>Totem Kiosk Touchscreen</span>
          <span>Tocca un punto qualsiasi per ordinare subito</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
