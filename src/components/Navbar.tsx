import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Home, ShoppingBag, UtensilsCrossed, Settings, Lock } from 'lucide-react';
import { PinPadModal } from './PinPadModal';

export const Navbar: React.FC = () => {
  const { view, setView, settings, cart, setIsCartOpen, adminToken } = useStore();
  const [showPinModal, setShowPinModal] = useState(false);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAdminClick = () => {
    if (adminToken) {
      setView('admin');
    } else {
      setShowPinModal(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xl">
        {/* Left: Home / Brand Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setView('welcome')}
            className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white rounded-2xl transition-all flex items-center gap-2 font-bold text-sm"
          >
            <Home className="w-5 h-5 text-rose-500" />
            <span className="hidden sm:inline">Home</span>
          </button>

          <div
            onClick={() => setView('categories')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            {settings?.logo ? (
              <img
                src={settings.logo}
                alt="Logo"
                className="w-10 h-10 object-contain rounded-xl bg-zinc-900 p-1 border border-zinc-800"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center font-extrabold text-lg">
                T
              </div>
            )}
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight group-hover:text-rose-400 transition-colors">
                {settings?.restaurant_name || 'TOTEM RISTORANTE'}
              </h1>
              <p className="text-xs text-zinc-500 font-medium hidden sm:block">
                Quick Order Station
              </p>
            </div>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          {/* Kitchen Display System */}
          <button
            onClick={() => setView('kitchen')}
            className={`p-3 rounded-2xl border transition-all flex items-center gap-2 font-bold text-sm ${
              view === 'kitchen'
                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="Display Cucina"
          >
            <UtensilsCrossed className="w-5 h-5 text-amber-500" />
            <span className="hidden md:inline">Cucina</span>
          </button>

          {/* Admin Button */}
          <button
            onClick={handleAdminClick}
            className={`p-3 rounded-2xl border transition-all flex items-center gap-2 font-bold text-sm ${
              view === 'admin'
                ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="Pannello Amministrazione"
          >
            {adminToken ? (
              <Settings className="w-5 h-5 text-rose-400" />
            ) : (
              <Lock className="w-5 h-5 text-zinc-400" />
            )}
            <span className="hidden md:inline">Admin</span>
          </button>

          {/* Cart Button */}
          {view !== 'welcome' && view !== 'order-confirmation' && view !== 'take-number' && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-3.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-extrabold rounded-2xl shadow-lg shadow-rose-600/25 flex items-center gap-2.5 transition-all active:scale-95"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-sm">Carrello</span>
              {cartItemCount > 0 && (
                <span className="w-6 h-6 rounded-full bg-white text-rose-600 flex items-center justify-center text-xs font-black shadow">
                  {cartItemCount}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      <PinPadModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={() => {
          setShowPinModal(false);
          setView('admin');
        }}
        correctPin={settings?.admin_pin || '0000'}
      />
    </>
  );
};
