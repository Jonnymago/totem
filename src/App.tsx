import React, { useEffect } from 'react';
import { useStore } from './store/useStore';
import { Navbar } from './components/Navbar';
import { CartDrawer } from './components/CartDrawer';
import { WelcomeView } from './views/WelcomeView';
import { CategoriesView } from './views/CategoriesView';
import { ProductsView } from './views/ProductsView';
import { OrderConfirmationView } from './views/OrderConfirmationView';
import { TakeNumberView } from './views/TakeNumberView';
import { KitchenView } from './views/KitchenView';
import { AdminView } from './views/AdminView';

export const App: React.FC = () => {
  const { view, setView, fetchInitialData } = useStore();

  useEffect(() => {
    fetchInitialData();

    // Check initial URL path, search params and hash
    const handleRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();

      if (hash.includes('remote') || search.includes('view=remote') || search.includes('remote')) {
        window.location.href = '/remote/';
        return;
      }

      if (path.includes('/admin') || hash.includes('admin') || search.includes('admin') || search.includes('view=admin')) {
        setView('admin');
      } else if (path.includes('/kitchen') || hash.includes('kitchen') || search.includes('kitchen') || search.includes('view=kitchen')) {
        setView('kitchen');
      } else if (path.includes('/categories') || hash.includes('categories') || search.includes('categories')) {
        setView('categories');
      } else if (path.includes('/take-number') || hash.includes('take-number') || search.includes('take-number')) {
        setView('take-number');
      }
    };

    handleRoute();
    window.addEventListener('popstate', handleRoute);
    window.addEventListener('hashchange', handleRoute);

    return () => {
      window.removeEventListener('popstate', handleRoute);
      window.removeEventListener('hashchange', handleRoute);
    };
  }, [fetchInitialData, setView]);

  const renderView = () => {
    switch (view) {
      case 'welcome':
        return <WelcomeView />;
      case 'categories':
        return <CategoriesView />;
      case 'products':
        return <ProductsView />;
      case 'order-confirmation':
        return <OrderConfirmationView />;
      case 'take-number':
        return <TakeNumberView />;
      case 'kitchen':
        return <KitchenView />;
      case 'admin':
        return <AdminView />;
      default:
        return <WelcomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased selection:bg-rose-500 selection:text-white">
      {view !== 'welcome' && <Navbar />}
      <main className="flex-1">{renderView()}</main>
      <CartDrawer />
    </div>
  );
};

export default App;
