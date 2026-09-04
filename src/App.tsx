import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import { Screensaver } from './components/Screensaver';

export const App: React.FC = () => {
  const { view, setView, fetchInitialData } = useStore();
  const [isScreensaverActive, setIsScreensaverActive] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    // Only activate auto-screensaver in customer-facing views
    if (view === 'admin' || view === 'kitchen') {
      setIsScreensaverActive(false);
      return;
    }

    // Default screensaver timeout: 3 minutes (180,000 ms)
    idleTimerRef.current = setTimeout(() => {
      setIsScreensaverActive(true);
    }, 180000);
  }, [view]);

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

    // Global activity listeners for idle reset
    const handleUserActivity = () => {
      resetIdleTimer();
    };

    window.addEventListener('pointerdown', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    resetIdleTimer();

    return () => {
      window.removeEventListener('popstate', handleRoute);
      window.removeEventListener('hashchange', handleRoute);
      window.removeEventListener('pointerdown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [fetchInitialData, setView, resetIdleTimer]);

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

      {/* Full-Screen Ambient Screensaver */}
      <Screensaver
        isActive={isScreensaverActive}
        onDismiss={() => {
          setIsScreensaverActive(false);
          resetIdleTimer();
        }}
      />
    </div>
  );
};

export default App;
