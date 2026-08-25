import React from 'react';
import { useStore } from '../store/useStore';
import { ShoppingBag, X, Trash2, Plus, Minus, ArrowRight, Utensils } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useI18n } from '../utils/i18n';
import { translateCustomerMenuText } from '../utils/customerMenuTranslation';

export const CartDrawer: React.FC = () => {
  const { cart, isCartOpen, setIsCartOpen, updateCartQuantity, removeFromCart, clearCart, submitOrder } =
    useStore();
  const { t, lang } = useI18n();

  const [submitting, setSubmitting] = React.useState(false);

  if (!isCartOpen) return null;

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0 || submitting) return;
    try {
      setSubmitting(true);
      await submitOrder();
    } catch (err: any) {
      alert(err.message || 'Errore durante l\'invio dell\'ordine');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsCartOpen(false)}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-screen max-w-md bg-zinc-900 border-l border-zinc-800 text-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white">{t('cart.title')}</h2>
                  <p className="text-xs text-zinc-400">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)} {t('cart.items_count')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-800 hover:bg-zinc-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500">
                  <Utensils className="w-16 h-16 mb-4 text-zinc-700 stroke-1" />
                  <p className="text-lg font-bold text-zinc-400">{t('cart.empty_title')}</p>
                  <p className="text-sm text-zinc-500 mt-1">
                    {t('cart.empty_desc')}
                  </p>
                </div>
              ) : (
                cart.map((item, idx) => {
                  const itemTotal = item.price * item.quantity;
                  return (
                    <div
                      key={idx}
                      className="p-4 bg-zinc-800/60 border border-zinc-800 rounded-2xl flex flex-col gap-3 relative group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-white text-base">{translateCustomerMenuText(item.product_name, lang)}</h4>
                        <span className="font-extrabold text-rose-400 text-base">
                          €{itemTotal.toFixed(2)}
                        </span>
                      </div>

                      {/* Customization Details */}
                      <div className="text-xs text-zinc-400 space-y-1">
                        {item.removed_ingredients && item.removed_ingredients.length > 0 && (
                          <p className="text-rose-400/90 font-medium">
                            <span className="text-zinc-500">{t('cart.without')}:</span>{' '}
                            {item.removed_ingredients.map((ing) => translateCustomerMenuText(ing, lang)).join(', ')}
                          </p>
                        )}
                        {item.added_extras && item.added_extras.length > 0 && (
                          <p className="text-emerald-400 font-medium">
                            <span className="text-zinc-500">{t('cart.extra')}:</span>{' '}
                            {item.added_extras.map((e) => translateCustomerMenuText(e.name, lang)).join(', ')}
                          </p>
                        )}
                        {item.combo_selections &&
                          Object.keys(item.combo_selections).length > 0 && (
                            <div className="space-y-0.5 mt-1 border-t border-zinc-700/50 pt-1">
                              {Object.entries(item.combo_selections).map(([grp, opts]) => (
                                <p key={grp}>
                                  <span className="text-zinc-500">{translateCustomerMenuText(grp, lang)}:</span>{' '}
                                  <span className="text-zinc-200 font-medium">{opts.map((opt) => translateCustomerMenuText(opt, lang)).join(', ')}</span>
                                </p>
                              ))}
                            </div>
                          )}
                        {item.notes && (
                          <p className="italic text-zinc-400 bg-zinc-900/60 p-1.5 rounded-lg border border-zinc-800 mt-1">
                            "{item.notes}"
                          </p>
                        )}
                      </div>

                      {/* Quantity Controls & Remove */}
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-700/40 mt-1">
                        <div className="flex items-center gap-2 bg-zinc-900 px-2 py-1 rounded-xl border border-zinc-700/60">
                          <button
                            onClick={() => updateCartQuantity(idx, item.quantity - 1)}
                            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-6 text-center font-bold text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(idx, item.quantity + 1)}
                            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(idx)}
                          className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Summary & Checkout Button */}
            {cart.length > 0 && (
              <div className="p-6 bg-zinc-950 border-t border-zinc-800 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-zinc-400 text-sm">
                    <span>{t('cart.subtotal')}</span>
                    <span>€{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400 text-sm">
                    <span>{t('cart.service')}</span>
                    <span className="text-emerald-400 font-semibold">{t('cart.included')}</span>
                  </div>
                  <div className="flex justify-between text-white text-xl font-black pt-2 border-t border-zinc-800">
                    <span>{t('cart.total')}</span>
                    <span className="text-rose-500">€{totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={clearCart}
                    className="p-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-2xl font-bold transition-all"
                  >
                    {t('cart.clear')}
                  </button>
                  <button
                    onClick={handleCheckout}
                    disabled={submitting}
                    className="flex-1 h-16 bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white rounded-2xl font-extrabold text-lg flex items-center justify-center gap-3 shadow-xl shadow-rose-600/30 transition-all"
                  >
                    {submitting ? (
                      <span className="animate-pulse">{t('cart.sending')}</span>
                    ) : (
                      <>
                        <span>{t('cart.send_order')}</span>
                        <ArrowRight className="w-6 h-6" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
