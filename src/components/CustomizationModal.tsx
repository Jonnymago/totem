import React, { useState, useEffect } from 'react';
import { Product, ExtraAddition, OrderItem } from '../types';
import { X, Plus, Minus, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomizationModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: OrderItem) => void;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [addedExtras, setAddedExtras] = useState<ExtraAddition[]>([]);
  const [comboSelections, setComboSelections] = useState<Record<string, string[]>>({});
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (product) {
      setQuantity(1);
      setRemovedIngredients([]);
      setAddedExtras([]);
      setNotes('');

      // Initialize default selections for combo groups
      const initialCombos: Record<string, string[]> = {};
      if (product.product_type === 'combo' && product.combo_groups) {
        product.combo_groups.forEach((group) => {
          if (group.min_selection > 0 && group.options.length > 0) {
            initialCombos[group.name] = [group.options[0].name];
          } else {
            initialCombos[group.name] = [];
          }
        });
      }
      setComboSelections(initialCombos);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  // Price Calculation
  let unitPrice = product.price;

  // Add extras
  addedExtras.forEach((extra) => {
    unitPrice += extra.price;
  });

  // Add combo price deltas
  if (product.product_type === 'combo' && product.combo_groups) {
    product.combo_groups.forEach((group) => {
      const selected = comboSelections[group.name] || [];
      selected.forEach((selectedOptionName) => {
        const optionObj = group.options.find((o) => o.name === selectedOptionName);
        if (optionObj) {
          unitPrice += optionObj.price_delta;
        }
      });
    });
  }

  const totalPrice = unitPrice * quantity;

  // Toggle ingredient removal
  const toggleIngredient = (ing: string) => {
    if (removedIngredients.includes(ing)) {
      setRemovedIngredients(removedIngredients.filter((i) => i !== ing));
    } else {
      setRemovedIngredients([...removedIngredients, ing]);
    }
  };

  // Toggle extra addition
  const toggleExtra = (extra: ExtraAddition) => {
    const exists = addedExtras.some((e) => e.name === extra.name);
    if (exists) {
      setAddedExtras(addedExtras.filter((e) => e.name !== extra.name));
    } else {
      setAddedExtras([...addedExtras, extra]);
    }
  };

  // Handle combo selection
  const handleComboSelect = (groupName: string, optionName: string, maxSelection: number) => {
    const current = comboSelections[groupName] || [];
    if (maxSelection === 1) {
      setComboSelections({ ...comboSelections, [groupName]: [optionName] });
    } else {
      if (current.includes(optionName)) {
        setComboSelections({
          ...comboSelections,
          [groupName]: current.filter((o) => o !== optionName),
        });
      } else if (current.length < maxSelection) {
        setComboSelections({
          ...comboSelections,
          [groupName]: [...current, optionName],
        });
      }
    }
  };

  // Check validation for required combo groups
  let isComboValid = true;
  if (product.product_type === 'combo' && product.combo_groups) {
    for (const group of product.combo_groups) {
      const selectedCount = (comboSelections[group.name] || []).length;
      if (selectedCount < group.min_selection) {
        isComboValid = false;
        break;
      }
    }
  }

  const handleConfirm = () => {
    if (!isComboValid) return;

    const orderItem: OrderItem = {
      product_id: product.id,
      product_name: product.name,
      quantity,
      price: unitPrice,
      notes: notes.trim(),
      removed_ingredients: removedIngredients,
      added_extras: addedExtras,
      combo_selections: comboSelections,
    };

    onAddToCart(orderItem);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl my-8 text-left"
        >
          {/* Header Image & Close */}
          <div className="relative h-56 bg-zinc-800">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                Nessuna immagine
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-3 bg-black/60 hover:bg-black text-white rounded-full backdrop-blur-md transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="absolute bottom-4 left-6 right-6">
              <span className="text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full inline-block mb-2">
                {product.product_type === 'combo' ? 'Menù Combo' : 'Personalizza'}
              </span>
              <h2 className="text-3xl font-extrabold text-white">{product.name}</h2>
              <p className="text-zinc-300 text-sm mt-1">{product.description}</p>
            </div>
          </div>

          <div className="p-6 space-y-6 max-h-[55vh] overflow-y-auto custom-scrollbar">
            {/* Base Ingredients (Removable) */}
            {product.product_type === 'simple' &&
              product.base_ingredients &&
              product.base_ingredients.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    Ingredienti di base
                    <span className="text-xs font-normal text-zinc-400">
                      (Tocca per rimuovere)
                    </span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {product.base_ingredients.map((ing) => {
                      const isRemoved = removedIngredients.includes(ing);
                      return (
                        <button
                          key={ing}
                          onClick={() => toggleIngredient(ing)}
                          className={`px-4 py-2.5 rounded-xl font-semibold text-sm border transition-all flex items-center gap-2 ${
                            isRemoved
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/40 line-through opacity-70'
                              : 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:border-zinc-500'
                          }`}
                        >
                          {isRemoved ? <X className="w-4 h-4 text-rose-400" /> : <Check className="w-4 h-4 text-emerald-400" />}
                          {ing}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Extra Additions */}
            {product.product_type === 'simple' &&
              product.extra_additions &&
              product.extra_additions.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-white mb-3">
                    Aggiungi Extra
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {product.extra_additions.map((extra) => {
                      const isAdded = addedExtras.some((e) => e.name === extra.name);
                      return (
                        <button
                          key={extra.name}
                          onClick={() => toggleExtra(extra)}
                          className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                            isAdded
                              ? 'bg-rose-600/15 border-rose-500 text-white shadow-md'
                              : 'bg-zinc-800/60 border-zinc-700/80 text-zinc-300 hover:bg-zinc-800'
                          }`}
                        >
                          <span className="font-medium text-sm">{extra.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-rose-400">
                              +€{extra.price.toFixed(2)}
                            </span>
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                                isAdded ? 'bg-rose-500 text-white' : 'bg-zinc-700 text-zinc-400'
                              }`}
                            >
                              {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Combo Groups */}
            {product.product_type === 'combo' &&
              product.combo_groups &&
              product.combo_groups.map((group) => {
                const selected = comboSelections[group.name] || [];
                const isSatisfied = selected.length >= group.min_selection;

                return (
                  <div key={group.name} className="p-4 bg-zinc-800/40 rounded-2xl border border-zinc-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        {group.name}
                        {group.min_selection > 0 && (
                          <span className={`text-xs px-2 py-0.5 rounded-md ${isSatisfied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {isSatisfied ? 'Selezionato' : 'Obbligatorio'}
                          </span>
                        )}
                      </h3>
                      <span className="text-xs text-zinc-400">
                        Scegli {group.max_selection === 1 ? '1 opzione' : `fino a ${group.max_selection}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.options.map((option) => {
                        const isSelected = selected.includes(option.name);
                        return (
                          <button
                            key={option.name}
                            onClick={() =>
                              handleComboSelect(group.name, option.name, group.max_selection)
                            }
                            className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                              isSelected
                                ? 'bg-rose-500/20 border-rose-500 text-white font-semibold'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                            }`}
                          >
                            <span className="text-sm">{option.name}</span>
                            {option.price_delta > 0 && (
                              <span className="text-xs text-rose-400 font-bold ml-2">
                                +€{option.price_delta.toFixed(2)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

            {/* Special Instructions / Notes */}
            <div>
              <label className="block text-sm font-bold text-zinc-300 mb-2">
                Note o richieste speciali per la cucina
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Es. Senza sale, salsa a parte, ben cotto..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 resize-none h-20"
              />
            </div>
          </div>

          {/* Footer Controls */}
          <div className="p-6 bg-zinc-950 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Quantity Controls */}
            <div className="flex items-center gap-3 bg-zinc-800 p-1.5 rounded-2xl border border-zinc-700">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center font-bold text-lg active:scale-95 transition-all"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="w-8 text-center font-extrabold text-xl text-white">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center font-bold text-lg active:scale-95 transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Add Button */}
            <button
              onClick={handleConfirm}
              disabled={!isComboValid}
              className={`w-full sm:w-auto flex-1 h-14 rounded-2xl font-extrabold text-lg flex items-center justify-between px-6 shadow-xl transition-all ${
                isComboValid
                  ? 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-rose-600/30 active:scale-[0.98]'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
              }`}
            >
              <span>Aggiungi all'ordine</span>
              <span className="text-xl font-black">€{totalPrice.toFixed(2)}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
