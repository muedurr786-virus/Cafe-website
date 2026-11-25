import { useEffect, useState } from 'react';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import rawShopData from './data/coffeeShopData.json';
import type { CartItem, CoffeeShopPayload, MenuItem } from './types/coffeeShop';
import { ResilientImage } from './components/ResilientImage';
import { MenuSection } from './components/MenuSection';
import { AiFullShopView } from './components/AiFullShopView';
import { ShopLocationMap } from './components/ShopLocationMap';
import { CartDrawer } from './components/CartDrawer';

const INITIAL_SHOP_DATA = rawShopData as CoffeeShopPayload;

export default function App() {
  const [shopData, setShopData] = useState<CoffeeShopPayload>(INITIAL_SHOP_DATA);
  const [aiViewMode, setAiViewMode] = useState<'spatial' | 'json'>('spatial');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [mapsApiKey, setMapsApiKey] = useState<string>(
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  );

  useEffect(() => {
    const onQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.mapsApiKey) {
          setMapsApiKey(data.mapsApiKey);
        }
      })
      .catch(() => {
        // Fallback relies on VITE_GOOGLE_MAPS_API_KEY if present
      });
    return () => {
      active = false;
    };
  }, []);

  const handleAddToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((entry) => entry.item.id === item.id);
      if (existing) {
        return prev.map((entry) =>
          entry.item.id === item.id
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((entry) =>
          entry.item.id === itemId
            ? { ...entry, quantity: entry.quantity + delta }
            : entry
        )
        .filter((entry) => entry.quantity > 0)
    );
  };

  const totalBagCount = cart.reduce((sum, entry) => sum + entry.quantity, 0);

  const navigateToAiSection = (mode: 'spatial' | 'json') => {
    setAiViewMode(mode);
    const el = document.getElementById('ai-shop-view');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F5] text-zinc-900">
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Clean 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-[#F7F7F5]/95 backdrop-blur-sm border-b border-zinc-200/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="font-display text-xl font-semibold tracking-tight text-zinc-900 whitespace-nowrap shrink-0"
          >
            {shopData.shop.name}
          </a>

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-600"
          >
            <a
              href="#menu"
              className="hover:text-zinc-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Menu
            </a>
            <button
              type="button"
              onClick={() => navigateToAiSection('spatial')}
              className="hover:text-zinc-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              AI Space View
            </button>
            <a
              href="#location"
              className="hover:text-zinc-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Location
            </a>
            <button
              type="button"
              onClick={() => navigateToAiSection('json')}
              className="hover:text-zinc-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              JSON Fields
            </button>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-zinc-900 hover:bg-amber-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Order Bag</span>
              <span className="font-mono tabular-nums">({totalBagCount})</span>
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Storefront Hero */}
        <section className="py-14 lg:py-20">
          <div className="max-w-6xl mx-auto px-6 space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-between gap-8 py-2">
                <div className="space-y-5">
                  <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                    {shopData.location.neighborhood} · {shopData.location.city}
                  </p>
                  <h1 className="font-display text-4xl sm:text-5xl font-medium text-zinc-900 tracking-tight leading-[1.1] text-balance">
                    {shopData.shop.headline}
                  </h1>
                  <p className="text-base text-zinc-600 leading-relaxed max-w-xl">
                    {shopData.shop.tagline}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <a
                    href="#menu"
                    className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-amber-800 hover:bg-amber-900 rounded-md transition-colors whitespace-nowrap shrink-0"
                  >
                    Explore Coffee Menu
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => navigateToAiSection('spatial')}
                    className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-zinc-900 bg-white border border-zinc-300 hover:bg-zinc-100 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    AI Full Shop View
                  </button>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="aspect-[16/10] lg:aspect-auto lg:h-full min-h-[320px] rounded-lg overflow-hidden border border-zinc-200 bg-zinc-200">
                  <ResilientImage
                    src={shopData.shop.heroImage}
                    alt={`${shopData.shop.name} interior espresso counter`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* 4-column structured facts row below the hero split */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8 border-t border-zinc-200">
              {shopData.shop.heroMetrics.map((metric) => (
                <div key={metric.label} className="space-y-1">
                  <p className="text-xs text-zinc-500">{metric.label}</p>
                  <p className="text-lg font-medium text-zinc-900 font-mono tabular-nums">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <MenuSection items={shopData.menuItems} onAddToCart={handleAddToCart} />

        <AiFullShopView
          shopData={shopData}
          viewMode={aiViewMode}
          onViewModeChange={setAiViewMode}
          onApplyShopJson={(nextData) => setShopData(nextData)}
          onResetShopJson={() => setShopData(INITIAL_SHOP_DATA)}
          onAddToCart={handleAddToCart}
        />

        <ShopLocationMap
          shopName={shopData.shop.name}
          hours={shopData.shop.hours}
          location={shopData.location}
          mapsApiKey={mapsApiKey}
        />
      </main>

      <footer className="border-t border-zinc-200 bg-white py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row md:items-center justify-between gap-6 text-sm text-zinc-600">
          <div className="space-y-1">
            <p className="font-display text-base font-semibold text-zinc-900">
              {shopData.shop.name}
            </p>
            <p className="text-xs text-zinc-500">
              {shopData.location.address} · {shopData.shop.roasterSpec}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-500">
            <span>{shopData.shop.contact.email}</span>
            <span className="font-mono tabular-nums">{shopData.shop.contact.phone}</span>
            <span>Mon–Fri {shopData.shop.hours.weekdays}</span>
            <span>© {new Date().getFullYear()} {shopData.shop.name}</span>
          </div>
        </div>
      </footer>

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={() => setCart([])}
        shopName={shopData.shop.name}
        address={shopData.location.address}
      />
    </div>
  );
}
