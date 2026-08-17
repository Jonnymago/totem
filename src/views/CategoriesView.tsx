import React from 'react';
import { useStore } from '../store/useStore';
import { ChevronRight, Utensils, Grid } from 'lucide-react';
import { motion } from 'motion/react';

export const CategoriesView: React.FC = () => {
  const { categories, products, setActiveCategory, setView } = useStore();

  const handleSelectCategory = (category: any) => {
    setActiveCategory(category);
    setView('products');
  };

  return (
    <div className="min-h-[calc(100vh-70px)] bg-zinc-950 p-6 sm:p-10 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
            Menù Ristorante
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Cosa desideri mangiare?
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            Seleziona una categoria per scoprire i nostri piatti
          </p>
        </div>

        <button
          onClick={() => {
            setActiveCategory(null);
            setView('products');
          }}
          className="self-start sm:self-auto px-5 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-2xl font-bold text-sm transition-all flex items-center gap-2"
        >
          <Grid className="w-4 h-4 text-rose-500" />
          <span>Mostra Tutto</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat, index) => {
          const count = products.filter((p) => p.category_id === cat.id && p.is_available !== false && p.available !== false).length;

          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              onClick={() => handleSelectCategory(cat)}
              className="group relative h-64 bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden cursor-pointer shadow-xl hover:border-rose-500/50 hover:shadow-2xl hover:shadow-rose-600/10 transition-all duration-300 flex flex-col justify-end"
            >
              {/* Background Image */}
              {cat.image ? (
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-tr from-zinc-900 to-zinc-800 flex items-center justify-center text-zinc-700">
                  <Utensils className="w-20 h-20" />
                </div>
              )}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent group-hover:via-zinc-950/70 transition-all" />

              {/* Content */}
              <div className="relative p-6 z-10 flex items-end justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 inline-block mb-2">
                    {count} prodotti
                  </span>
                  <h3 className="text-2xl font-extrabold text-white group-hover:text-rose-400 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-zinc-300 text-xs mt-1 line-clamp-1 font-medium">
                    {cat.description}
                  </p>
                </div>

                <div className="w-10 h-10 rounded-2xl bg-white/10 group-hover:bg-rose-500 text-white flex items-center justify-center transition-all backdrop-blur-md flex-shrink-0">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
