import { useState } from 'react';
import { Minus, Plus, ShoppingBag, X, Check } from 'lucide-react';
import type { CartItem } from '../types/coffeeShop';
import { ResilientImage } from './ResilientImage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onClearCart: () => void;
  shopName: string;
  address: string;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onClearCart,
  shopName,
  address,
}: CartDrawerProps) {
  const [customerName, setCustomerName] = useState('');
  const [pickupNote, setPickupNote] = useState('');
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, entry) => sum + entry.item.priceUsd * entry.quantity,
    0
  );

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    const orderCode = `KR-${Math.floor(1000 + Math.random() * 9000)}`;
    setConfirmedOrderId(orderCode);
    onClearCart();
  };

  const handleClose = () => {
    setConfirmedOrderId(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-zinc-950/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Order bag"
    >
      <div className="w-full max-w-md bg-[#F7F7F5] h-full flex flex-col border-l border-zinc-200 shadow-xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 bg-white">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-4 h-4 text-zinc-900" strokeWidth={1.75} />
            <h2 className="font-display text-lg font-medium text-zinc-900">
              Pickup Order
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close order bag"
            className="p-2 text-zinc-500 hover:text-zinc-900 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {confirmedOrderId ? (
            <div className="bg-white border border-zinc-200 rounded-lg p-6 space-y-4">
              <div className="w-10 h-10 rounded-full bg-amber-800/10 text-amber-800 flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-mono uppercase tracking-wider text-amber-800">
                  Order #{confirmedOrderId} Confirmed
                </p>
                <h3 className="font-display text-xl font-medium text-zinc-900">
                  Preparing at the Espresso Bar
                </h3>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  {customerName ? `Ready for ${customerName} in ` : 'Ready in '}
                  approximately 8–10 minutes at {shopName}, {address}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmedOrderId(null)}
                className="w-full py-2.5 px-4 text-sm font-medium text-zinc-900 border border-zinc-300 rounded-md hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Start Another Order
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-3">
              <ShoppingBag className="w-8 h-8 text-zinc-300" strokeWidth={1.5} />
              <p className="text-base font-medium text-zinc-900">Your bag is empty</p>
              <p className="text-sm text-zinc-500 max-w-xs">
                Select espresso drinks, single-origin pour-overs, or whole bean bags from the menu or AI curator.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(({ item, quantity }) => (
                <div
                  key={item.id}
                  className="flex gap-4 bg-white border border-zinc-200 rounded-lg p-3.5"
                >
                  <ResilientImage
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-md object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-zinc-900 truncate">
                        {item.name}
                      </h3>
                      <span className="text-sm font-mono tabular-nums text-zinc-900 shrink-0">
                        ${(item.priceUsd * quantity).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">
                      {item.category} · {item.origin}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        aria-label={`Decrease quantity of ${item.name}`}
                        className="w-7 h-7 flex items-center justify-center border border-zinc-200 rounded text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-mono tabular-nums w-6 text-center text-zinc-900">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        aria-label={`Increase quantity of ${item.name}`}
                        className="w-7 h-7 flex items-center justify-center border border-zinc-200 rounded text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && !confirmedOrderId && (
          <form
            onSubmit={handlePlaceOrder}
            className="p-6 border-t border-zinc-200 bg-white space-y-4"
          >
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="pickup-name"
                  className="block text-xs font-medium text-zinc-700 mb-1"
                >
                  Name for bar pickup
                </label>
                <input
                  id="pickup-name"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full px-3 py-2 text-sm bg-[#F7F7F5] border border-zinc-200 rounded-md focus:outline-none focus:border-amber-800"
                />
              </div>
              <div>
                <label
                  htmlFor="pickup-note"
                  className="block text-xs font-medium text-zinc-700 mb-1"
                >
                  Barista notes (optional)
                </label>
                <input
                  id="pickup-note"
                  type="text"
                  value={pickupNote}
                  onChange={(e) => setPickupNote(e.target.value)}
                  placeholder="Oat milk, extra hot, or whole bean grind"
                  className="w-full px-3 py-2 text-sm bg-[#F7F7F5] border border-zinc-200 rounded-md focus:outline-none focus:border-amber-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
              <span className="text-sm text-zinc-600">Pickup Subtotal</span>
              <span className="text-base font-semibold font-mono tabular-nums text-zinc-900">
                ${subtotal.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClearCart}
                className="px-4 py-2.5 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Clear
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-amber-800 hover:bg-amber-900 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Place Pickup Order
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
