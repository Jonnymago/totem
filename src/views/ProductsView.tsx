import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Product, OrderItem } from '../types';
import { Search, Plus, Filter, AlertTriangle, ChevronLeft } from 'lucide-react';
import { CustomizationModal } from '../components/CustomizationModal';
import { motion } from 'motion/react';

export const ProductsView: React.FC = () => {
  const {
    products,
    categories,
    activeCategory,
    setActiveCategory,
    addToCart,
    setView,
  } = useStore();

  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Filter products by search and active category
  const filteredProducts = products.filter((p) => {
    if (p.is_available === false || p.available === false) return false;
    if (activeCategory && p.category_id !== activeCategory.id) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();

    // If product has base ingredients, extra additions, or is a combo -> open customization modal
    if (
      product.product_type === 'combo' ||
      (product.base_ingredients && product.base_ingredients.length > 0) ||
      (product.extra_additions && product.extra_additions.length > 0)
    ) {
      setSelectedProduct(product);
    } else {
      // Add simple product directly
      const item: OrderItem = {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        price: product.price,
      };
      addToCart(item);
    }
  };

  return (
    <div className="min-h-[calc(100vh-70px)] bg-zinc-950 p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Top Category Filter Bar */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 custom-scrollbar mb-6">
        <button
          onClick={() => setView('categories')}
          className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Tutte le Categorie</span>
        </button>

        <button
          onClick={() => setActiveCategory(null)}
          className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex-shrink-0 border ${
            activeCategory === null
              ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/20'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          Tutti i piatti ({products.filter((p) => p.available).length})
        </button>

        {categories.map((cat) => {
          const isActive = activeCategory?.id === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex-shrink-0 border ${
                isActive
                  ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/20'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Search Input Bar */}
      <div className="mb-8 relative max-w-xl">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca un piatto o un ingrediente..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-all shadow-inner"
        />
      </div>

      {/* Active Header Title */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-black text-white">
          {activeCategory ? activeCategory.name : 'Tutti i prodotti'}
        </h2>
        <span className="text-xs text-zinc-400 font-semibold">
          {filteredProducts.length} opzioni disponibili
        </span>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8">
          <p className="text-zinc-400 text-base font-semibold">Nessun prodotto trovato</p>
          <p className="text-zinc-600 text-xs mt-1">
            Prova a modificare la ricerca o seleziona un'altra categoria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedProduct(product)}
              className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              {/* Image & Type Badge */}
              <div className="relative h-48 bg-zinc-800 overflow-hidden">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    Nessuna immagine
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />

                {product.product_type === 'combo' && (
                  <span className="absolute top-3 left-3 bg-amber-500 text-black text-[11px] font-black uppercase px-2.5 py-1 rounded-lg shadow">
                    Combo
                  </span>
                )}
              </div>

              {/* Card Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-xl font-extrabold text-white group-hover:text-rose-400 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-zinc-400 text-xs mt-1 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>

                  {/* Allergen Tags */}
                  {product.allergens && product.allergens.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      {product.allergens.map((alg: string) => (
                        <span
                          key={alg}
                          className="text-[10px] font-semibold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700/60"
                        >
                          {alg}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Price & Action Button */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                  <span className="text-2xl font-black text-white">
                    €{product.price.toFixed(2)}
                  </span>

                  <button
                    onClick={(e) => handleQuickAdd(product, e)}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Aggiungi</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Customization Modal */}
      <CustomizationModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(item) => addToCart(item)}
      />
    </div>
  );
};
